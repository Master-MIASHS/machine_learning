<script lang="ts">
	// Part IX, leçon 3 — exemple « au-delà du cours » : la dimension VC de la
	// famille {x ↦ 1[sin(Ax + b) > 0]} est infinie. L'étudiant place des points
	// de classe 0 ou 1 sur l'axe des x ; le widget cherche automatiquement une
	// paire (A, b) réalisant l'étiquetage (solveur exact de
	// $lib/math/sinusoid-vc) et trace la frontière y = sin(Ax + b).
	//
	// ScatterPlot n'expose pas de gestion de clic : la pose des points est
	// faite via un <rect> transparent dans snippetOverlay, avec conversion des
	// coordonnées écran → espace SVG via getScreenCTM() (robuste au redimensionnement
	// CSS) et inversion de la même projection pad=4 que ScatterPlot.

	import Figure from '$lib/components/charts/Figure.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import SelectOption from '$lib/components/controls/RadioButton.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import {
		findSinusoidFit,
		sinusoidSigns,
		sinusoidCurvePoints,
		sampleSinusoidInterval,
		positiveRegions,
		type SinusoidFit
	} from '$lib/math/sinusoid-vc';

	interface UiPoint {
		x: number;
		label: 0 | 1;
	}

	const SIZE = 460;
	const HEIGHT = 300;
	const PAD = 4; // identique à la projection interne de ScatterPlot
	const domainX: [number, number] = [0, 10];
	const domainY: [number, number] = [-1.4, 1.4];
	const POINT_Y = 1.15; // abscisse verticale des points (au-dessus / en dessous de la courbe)
	const MAX_POINTS = 30;
	const CLICK_RADIUS = 0.15; // rayon (en unités de x) pour capturer un point existant
	const FILL_MAX_OSCILLATIONS = 200; // au-delà, l'ombrage des régions aliéase

	const plotW = SIZE - PAD * 2;
	const plotH = HEIGHT - PAD * 2;

	function projectX(x: number): number {
		return PAD + ((x - domainX[0]) / (domainX[1] - domainX[0])) * plotW;
	}
	function projectY(y: number): number {
		return PAD + ((domainY[1] - y) / (domainY[1] - domainY[0])) * plotH;
	}
	function invProjX(px: number): number {
		return domainX[0] + ((px - PAD) / plotW) * (domainX[1] - domainX[0]);
	}

	// ─── Préréglages ───────────────────────────────────────────────────────────
	// « Deux nuages » : deux nuages proprement séparés — une sinusoïde basse
	// fréquence (une bosse) suffit, ce qui contraste avec le cas alterné.
	const CLOUDS: UiPoint[] = [
		{ x: 1.0, label: 0 },
		{ x: 1.5, label: 0 },
		{ x: 2.0, label: 0 },
		{ x: 2.5, label: 0 },
		{ x: 7.0, label: 1 },
		{ x: 7.5, label: 1 },
		{ x: 8.0, label: 1 },
		{ x: 8.5, label: 1 }
	];
	// « Alterné » : étiquettes 1, 0, 1, 0, ... — la frontière doit faire un
	// aller-retour entre chaque paire de points : haute fréquence (« pourrie »).
	// Les abscisses ne sont PAS en progression arithmétique (petite dérive
	// irrationnelle) : un quadrillage parfait admet des étiquetages alternés
	// irréalisables, ce qui n'est pas le message de la démo.
	const ALTERNATING: UiPoint[] = Array.from({ length: 13 }, (_, i) => ({
		x: 0.4 * (i + 1) + 0.015 * i * (i - 1) * Math.SQRT2,
		label: (i % 2 === 0 ? 1 : 0) as 0 | 1
	}));

	let points = $state<UiPoint[]>(CLOUDS.map((p) => ({ ...p })));
	let activeClass = $state<0 | 1>(1);

	function presetClouds() {
		points = CLOUDS.map((p) => ({ ...p }));
	}
	function presetAlternating() {
		points = ALTERNATING.map((p) => ({ ...p }));
	}
	function clearPoints() {
		points = [];
	}

	// ─── Solveur ────────────────────────────────────────────────────────────────
	const fit = $derived.by((): SinusoidFit | null => {
		if (points.length === 0) return null;
		return findSinusoidFit(points.map((p) => p.x), points.map((p) => p.label));
	});

	const oscillations = $derived(fit ? (fit.A * (domainX[1] - domainX[0])) / Math.PI : 0);

	const pointStates = $derived.by((): boolean[] => {
		if (!fit) return points.map(() => true);
		const signs = sinusoidSigns(fit.A, fit.b, points.map((p) => p.x));
		return points.map((p, i) => signs[i] === p.label);
	});

	// ─── Tracé de la frontière ──────────────────────────────────────────────────
	const curvePath = $derived.by(() => {
		if (!fit) return '';
		const pts = sinusoidCurvePoints(fit.A, fit.b, domainX[0], domainX[1]);
		return pts
			.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${projectX(x).toFixed(2)} ${projectY(y).toFixed(2)}`)
			.join(' ');
	});

	// Ombrage des régions où sin(Ax + b) > 0 (classe 1), intervalle par
	// intervalle entre zéros consécutifs. Masqué au-delà du plafond d'oscillations
	// (l'ombrage deviendrait un moiré illisible).
	const fillPaths = $derived.by((): string[] => {
		if (!fit || oscillations > FILL_MAX_OSCILLATIONS) return [];
		const regions = positiveRegions(fit.A, fit.b, domainX[0], domainX[1]);
		const y0 = projectY(0).toFixed(2);
		return regions.map(([a, c]) => {
			const pts = sampleSinusoidInterval(fit.A, fit.b, a, c, 48);
			let d = `M${projectX(a).toFixed(2)} ${y0}`;
			for (const [x, y] of pts) d += ` L${projectX(x).toFixed(2)} ${projectY(y).toFixed(2)}`;
			return `${d} L${projectX(c).toFixed(2)} ${y0} Z`;
		});
	});

	// ─── Interaction point par point ────────────────────────────────────────────
	function handleOverlayClick(event: MouseEvent, rectEl: SVGRectElement) {
		const svg = rectEl.ownerSVGElement;
		if (!svg) return;
		const pt = svg.createSVGPoint();
		pt.x = event.clientX;
		pt.y = event.clientY;
		const ctm = svg.getScreenCTM();
		if (!ctm) return;
		const local = pt.matrixTransform(ctm.inverse());
		const dataX = invProjX(local.x);
		if (dataX < domainX[0] || dataX > domainX[1]) return;

		let nearest = -1;
		let nearestDist = Infinity;
		points.forEach((p, i) => {
			const d = Math.abs(p.x - dataX);
			if (d < nearestDist) {
				nearestDist = d;
				nearest = i;
			}
		});

		if (nearest !== -1 && nearestDist < CLICK_RADIUS) {
			points = points.filter((_, i) => i !== nearest);
		} else if (points.length < MAX_POINTS) {
			points = [...points, { x: dataX, label: activeClass }];
		}
	}

	/**
	 * Fallback clavier : « cliquer à cet endroit » n'a pas d'équivalent naturel
	 * (pas de point ciblé par une touche), donc Entrée/Espace ajoute un point
	 * au centre de l'axe avec la classe active. Une liste textuelle des points
	 * avec boutons de suppression donnerait un accès complet aux utilisateurs
	 * du clavier ; ceci est l'accessibilité minimale qui garde le contrôle
	 * utilisable (même compromis que VCShatteringExplorer).
	 */
	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		if (points.length >= MAX_POINTS) return;
		points = [...points, { x: (domainX[0] + domainX[1]) / 2, label: activeClass }];
	}

	// ─── Rendu des points ───────────────────────────────────────────────────────
	function labelColor(label: 0 | 1): string {
		return label === 1 ? 'var(--color-belief)' : 'var(--color-surprise)';
	}
	const scatterPoints = $derived(points.map((p) => ({ x: p.x, y: p.label === 1 ? POINT_Y : -POINT_Y, group: p.label })));
	function colorByLabel(d: { group?: string | number }): string {
		return labelColor((d.group as 0 | 1) ?? 0);
	}

	const atMax = $derived(points.length >= MAX_POINTS);
	const solverFailed = $derived(points.length > 0 && fit === null);
</script>

<div class="controls-row">
	<div class="class-picker">
		<span class="picker-label">Classe du nouveau point :</span>
		<SelectOption value={0} label="Classe 0" bind:groupValue={activeClass} />
		<SelectOption value={1} label="Classe 1" bind:groupValue={activeClass} />
	</div>
	<div class="preset-picker">
		<button type="button" onclick={presetClouds}>Deux nuages</button>
		<button type="button" onclick={presetAlternating}>Alterné</button>
		<button type="button" onclick={clearPoints}>Effacer</button>
	</div>
</div>

<Figure type="chart">
	<ScatterPlot
		points={scatterPoints}
		{domainX}
		{domainY}
		width={SIZE}
		height={HEIGHT}
		colorBy={colorByLabel}
		defaultSize={7}
		showAxes={true}
		showLabels={false}
	>
		{#snippet snippetOverlay()}
			<!-- Axe y = 0 : la frontière oscille autour de cette ligne -->
			<line
				x1={projectX(domainX[0])}
				y1={projectY(0)}
				x2={projectX(domainX[1])}
				y2={projectY(0)}
				stroke="var(--color-border)"
				stroke-width="1"
				stroke-dasharray="4 3"
				opacity="0.6"
			/>
			<!-- Ombrage des régions classées 1 -->
			{#each fillPaths as d (d)}
				<path d={d} fill="var(--color-belief)" opacity="0.08" style="pointer-events: none" />
			{/each}
			<!-- La frontière y = sin(Ax + b) -->
			{#if curvePath}
				<path
					d={curvePath}
					fill="none"
					stroke="var(--color-agent)"
					stroke-width="2"
					stroke-linejoin="round"
					style="pointer-events: none"
				/>
			{/if}
			<!-- Tics reliant chaque point à l'axe, + anneau rouge si mal classé -->
			{#each points as p, i (i)}
				<line
					x1={projectX(p.x)}
					y1={projectY(0)}
					x2={projectX(p.x)}
					y2={projectY(p.label === 1 ? POINT_Y : -POINT_Y)}
					stroke={labelColor(p.label)}
					stroke-width="1"
					opacity="0.3"
					style="pointer-events: none"
				/>
				{#if !pointStates[i]}
					<circle
						cx={projectX(p.x)}
						cy={projectY(p.label === 1 ? POINT_Y : -POINT_Y)}
						r="10"
						fill="none"
						stroke="var(--color-negative)"
						stroke-width="2"
						style="pointer-events: none"
					/>
				{/if}
			{/each}
			<rect
				x={0}
				y={0}
				width={SIZE}
				height={HEIGHT}
				fill="transparent"
				style="cursor: crosshair"
				role="button"
				tabindex={0}
				aria-label="Zone de tracé : cliquer pour ajouter un point de la classe choisie, cliquer sur un point pour le retirer, ou appuyer sur Entrée pour en ajouter un au centre"
				onclick={(e) => handleOverlayClick(e, e.currentTarget as unknown as SVGRectElement)}
				onkeydown={handleOverlayKeydown}
			/>
		{/snippet}
	</ScatterPlot>

	{#snippet caption()}
		Cliquez pour ajouter un point de la classe choisie
		(<span style="color: var(--color-surprise)">rose = 0</span>,
		<span style="color: var(--color-belief)">cyan = 1</span>) ; cliquez sur un
		point pour le retirer. La frontière
		<KatexInline formula={String.raw`y = \sin(Ax + b)`} /> est recalculée à
		chaque changement : la classe d'un point est le signe de la courbe à son
		abscisse.{#if atMax} Plafond de {MAX_POINTS} points atteint.{/if}
		{#if solverFailed}
			Aucune paire (A, b) trouvée dans le domaine exploré — cette
			configuration particulière est difficile, déplacez légèrement un point.
		{/if}
	{/snippet}
</Figure>

<Metrics align="left">
	<div class="cell">
		<span class="label">Points</span>
		<span class="value">{points.length} / {MAX_POINTS}</span>
	</div>
	<div class="cell">
		<span class="label">Erreurs empiriques</span>
		<span
			class="value"
			style={`color: ${
				solverFailed ? 'var(--color-negative)' : points.length > 0 ? 'var(--color-positive)' : undefined
			}`}
		>
			{#if points.length === 0}
				—
			{:else if solverFailed}
				séparation introuvable
			{:else}
				0 — séparation exacte
			{/if}
		</span>
	</div>
	<div class="cell">
		<span class="label">Fréquence A</span>
		<span class="value">{fit ? (fit.A >= 10000 ? fit.A.toExponential(2) : fit.A.toFixed(2)) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">Phase b (mod 2π)</span>
		<span class="value">{fit ? fit.b.toFixed(2) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">Oscillations sur la fenêtre</span>
		<span class="value">{fit ? oscillations.toFixed(1) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">VCdim de la famille</span>
		<span class="value">+∞</span>
	</div>
</Metrics>

<style>
	.controls-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.class-picker {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.picker-label {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.preset-picker {
		display: flex;
		gap: 0.5rem;
	}

	.preset-picker button {
		font-size: 0.8125rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 4px);
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
	}

	.preset-picker button:hover {
		background: var(--color-surface-2);
	}
</style>
