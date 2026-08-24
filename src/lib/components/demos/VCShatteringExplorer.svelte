<script lang="ts">
	// Part VI — Dimension de Vapnik-Chervonenkis : brisure et coefficient de
	// brisure. Lets the user place points, pick a hypothesis family, toggle a
	// target labeling by clicking points, and see whether that labeling (and
	// the family as a whole) is realizable.
	//
	// No click-handling prop exists on ScatterPlot, so point placement is
	// done via a transparent <rect> inside snippetOverlay, converting screen
	// coordinates to the SVG's internal user space with getScreenCTM()
	// (robust to CSS scaling), then inverting the same pad=4 projection used
	// elsewhere in these demos.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	// TODO: filename/path guessed — confirm against the actual component (the
	// one wrapping Button with a bindable groupValue for radio-style selection).
	import SelectOption from '$lib/components/controls/RadioButton.svelte';

	import {
		isThresholdRealizable,
		isIntervalRealizable,
		isHalfspaceRealizable,
		shatters,
		countRealizedDichotomies,
		trivialGrowthBound,
		type HypothesisFamily
	} from '$lib/math/vc';

	interface UiPoint {
		x: number;
		y: number;
		label: 0 | 1;
	}

	const FAMILY_LABELS: Record<HypothesisFamily, string> = {
		thresholds: 'Seuils (1D)',
		intervals: 'Intervalles (1D)',
		halfspaces2d: 'Demi-plans (2D)'
	};
	const FAMILY_VCDIM: Record<HypothesisFamily, number> = {
		thresholds: 1,
		intervals: 2,
		halfspaces2d: 3
	};
	const FAMILY_OPTIONS: { value: HypothesisFamily; label: string }[] = [
		{ value: 'thresholds', label: FAMILY_LABELS.thresholds },
		{ value: 'intervals', label: FAMILY_LABELS.intervals },
		{ value: 'halfspaces2d', label: FAMILY_LABELS.halfspaces2d }
	];
	const DEFAULT_POINTS: Record<HypothesisFamily, UiPoint[]> = {
		thresholds: [
			{ x: -1, y: 0.5, label: 0 },
			{ x: 1, y: 0.5, label: 1 }
		],
		intervals: [
			{ x: -1.5, y: 0.5, label: 0 },
			{ x: 0, y: 0.5, label: 1 },
			{ x: 1.5, y: 0.5, label: 0 }
		],
		halfspaces2d: [
			{ x: 0, y: 1, label: 1 },
			{ x: -1, y: -1, label: 0 },
			{ x: 1, y: -1, label: 0 }
		]
	};

	let family = $state<HypothesisFamily>('thresholds');
	let points = $state<UiPoint[]>([...DEFAULT_POINTS.thresholds]);

	function resetPoints() {
		points = DEFAULT_POINTS[family].map((p) => ({ ...p }));
	}

	function clearPoints() {
		points = [];
	}

	// Reset to a sensible default whenever the family changes.
	$effect(() => {
		void family;
		resetPoints();
	});

	const is1D = $derived(family === 'thresholds' || family === 'intervals');

	const SIZE = 420;
	const PAD = 4;
	const domainX: [number, number] = [-3, 3];
	const domainY = $derived(is1D ? ([0, 1] as [number, number]) : ([-3, 3] as [number, number]));

	function invProjX(px: number): number {
		return domainX[0] + ((px - PAD) / (SIZE - PAD * 2)) * (domainX[1] - domainX[0]);
	}
	function invProjY(py: number): number {
		const [yMin, yMax] = domainY;
		return yMax - ((py - PAD) / (SIZE - PAD * 2)) * (yMax - yMin);
	}

	const CLICK_RADIUS_DATA = 0.35; // toggle an existing point within this data-space distance, else add a new one

	function addOrToggleAt(dataX: number, dataY: number) {
		let nearestIndex = -1;
		let nearestDist = Infinity;
		points.forEach((p, i) => {
			const d = is1D ? Math.abs(p.x - dataX) : Math.hypot(p.x - dataX, p.y - dataY);
			if (d < nearestDist) {
				nearestDist = d;
				nearestIndex = i;
			}
		});

		if (nearestIndex !== -1 && nearestDist < CLICK_RADIUS_DATA) {
			points[nearestIndex] = {
				...points[nearestIndex],
				label: points[nearestIndex].label === 0 ? 1 : 0
			};
		} else {
			points = [...points, { x: dataX, y: dataY, label: 0 }];
		}
	}

	function handleOverlayClick(event: MouseEvent, rectEl: SVGRectElement) {
		const svg = rectEl.ownerSVGElement;
		if (!svg) return;
		const pt = svg.createSVGPoint();
		pt.x = event.clientX;
		pt.y = event.clientY;
		const ctm = svg.getScreenCTM();
		if (!ctm) return;
		const local = pt.matrixTransform(ctm.inverse());

		addOrToggleAt(invProjX(local.x), is1D ? 0.5 : invProjY(local.y));
	}

	/**
	 * Keyboard fallback: a click-at-this-pixel interaction has no natural
	 * keyboard equivalent (there's no "which point" for a keydown to target),
	 * so Enter/Space here adds-or-toggles at the plot's center instead. A
	 * fuller solution — a textual list of points with editable x/y fields and
	 * remove buttons — would give keyboard users the same reach as a pointer;
	 * this is the minimal affordance that keeps the control operable rather
	 * than pointer-only.
	 */
	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		const centerX = (domainX[0] + domainX[1]) / 2;
		const centerY = is1D ? 0.5 : (domainY[0] + domainY[1]) / 2;
		addOrToggleAt(centerX, centerY);
	}

	// ─── Realizability checks ───────────────────────────────────────────────
	function pointsAs1D(): number[] {
		return points.map((p) => p.x);
	}
	function pointsAs2D(): [number, number][] {
		return points.map((p): [number, number] => [p.x, p.y]);
	}
	function familyPoints(): number[] | [number, number][] {
		return is1D ? pointsAs1D() : pointsAs2D();
	}

	const currentLabeling = $derived(points.map((p) => p.label));

	const isTargetRealizable = $derived.by(() => {
		if (points.length === 0) return true;
		if (family === 'thresholds') return isThresholdRealizable(pointsAs1D(), currentLabeling);
		if (family === 'intervals') return isIntervalRealizable(pointsAs1D(), currentLabeling);
		return isHalfspaceRealizable(pointsAs2D(), currentLabeling);
	});

	const familyShattersSet = $derived(points.length === 0 ? true : shatters(family, familyPoints()));
	const realizedCount = $derived(
		points.length === 0 ? 1 : countRealizedDichotomies(family, familyPoints())
	);
	const totalCount = $derived(trivialGrowthBound(points.length));

	function labelColor(label: 0 | 1): string {
		return label === 1 ? 'var(--color-belief)' : 'var(--color-surprise)';
	}
	const scatterPoints = $derived(points.map((p) => ({ x: p.x, y: p.y, group: p.label })));
	function colorByLabel(d: { group?: string | number }): string {
		return labelColor((d.group as 0 | 1) ?? 0);
	}
</script>

<div class="family-picker">
	{#each FAMILY_OPTIONS as option (option.value)}
		<SelectOption value={option.value} label={option.label} bind:groupValue={family} />
	{/each}
</div>

<Figure type="chart">
	<ScatterPlot
		points={scatterPoints}
		{domainX}
		{domainY}
		width={SIZE}
		height={SIZE}
		colorBy={colorByLabel}
		defaultSize={7}
		showAxes={true}
		showLabels={!is1D}
	>
		{#snippet snippetOverlay()}
			<rect
				x={0}
				y={0}
				width={SIZE}
				height={SIZE}
				fill="transparent"
				style="cursor: crosshair"
				role="button"
				tabindex={0}
				aria-label="Zone de tracé : cliquer, ou appuyer sur Entrée, pour ajouter ou basculer un point au centre"
				onclick={(e) => handleOverlayClick(e, e.currentTarget as unknown as SVGRectElement)}
				onkeydown={handleOverlayKeydown}
			/>
		{/snippet}
	</ScatterPlot>

	{#snippet caption()}
		Cliquez dans une zone vide pour ajouter un point ; cliquez sur un point existant pour basculer
		son étiquette ({' '}<span style="color: var(--color-surprise)">orange = 0</span>,
		<span style="color: var(--color-belief)">bleu = 1</span>).
		{#if is1D}
			La coordonnée verticale n'a pas de sens ici — seule la position horizontale compte.
		{/if}
	{/snippet}
</Figure>

<div class="controls-row">
	<button type="button" onclick={resetPoints}>Réinitialiser</button>
	<button type="button" onclick={clearPoints}>Tout effacer</button>
</div>

<Metrics align="left">
	<div class="cell">
		<span class="label">Étiquetage cible réalisable ?</span>
		<span
			class="value"
			style={`color: ${isTargetRealizable ? 'var(--color-belief)' : 'var(--color-surprise)'}`}
		>
			{isTargetRealizable ? 'Oui' : 'Non'}
		</span>
	</div>
	<div class="cell">
		<span class="label">Brise cet ensemble de points ?</span>
		<span
			class="value"
			style={`color: ${familyShattersSet ? 'var(--color-belief)' : 'var(--color-surprise)'}`}
		>
			{familyShattersSet ? 'Oui' : 'Non'}
		</span>
	</div>
	<div class="cell">
		<span class="label">Dichotomies réalisées</span>
		<span class="value">{realizedCount} / {totalCount}</span>
	</div>
	<div class="cell">
		<span class="label">VCdim connue de cette famille</span>
		<span class="value">{FAMILY_VCDIM[family]}</span>
	</div>
</Metrics>

<style>
	.family-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.controls-row {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.controls-row button {
		font-size: 0.8125rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 4px);
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
	}

	.controls-row button:hover {
		background: var(--color-surface-2);
	}
</style>
