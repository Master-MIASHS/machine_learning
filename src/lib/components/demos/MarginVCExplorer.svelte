<script lang="ts">
	// Part VI — Application : borne VC pour le SVM (Théorème 3.4).
	//
	// Points are placed relative to the CURRENT gamma slider — the two
	// closest points always sit exactly ON the margin boundary (offset=0),
	// the rest further out by a fixed extra distance. This keeps "the margin
	// is the distance to the nearest point" visually true as gamma moves,
	// rather than showing a static configuration that could end up
	// inconsistent with whatever gamma the slider currently sets.

	import Figure from '$lib/components/charts/Figure.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import { marginVCDimBound, svmGeneralizationBound } from '$lib/math/vc';

	let gamma = $state(1);
	let R = $state(3);

	// Fixed defaults, not slider-controlled per this step's spec — only used
	// to show what the VC-dim bound implies for an actual generalization gap.
	const N = 500;
	const DELTA = 0.05;

	interface PointSpec {
		x: number;
		cls: -1 | 1;
		offset: number; // extra distance beyond the margin boundary
	}
	const POINT_SPECS: PointSpec[] = [
		{ x: -1, cls: -1, offset: 0 }, // closest point of its class — sits exactly on the margin
		{ x: 1, cls: 1, offset: 0 }, // closest point of its class — sits exactly on the margin
		{ x: -2.4, cls: -1, offset: 0.5 },
		{ x: 2.4, cls: 1, offset: 0.5 },
		{ x: -0.3, cls: -1, offset: 1.1 },
		{ x: 0.3, cls: 1, offset: 1.1 },
		{ x: -3.2, cls: -1, offset: 0.2 },
		{ x: 3.2, cls: 1, offset: 0.2 }
	];

	const points = $derived(
		POINT_SPECS.map((spec) => ({
			x: spec.x,
			y: spec.cls * (gamma + spec.offset),
			group: spec.cls
		}))
	);

	const maxPointNorm = $derived(Math.max(...points.map((p) => Math.hypot(p.x, p.y))));
	const pointsExceedR = $derived(maxPointNorm > R);

	function colorByClass(d: { group?: string | number }): string {
		return d.group === 1 ? 'var(--color-belief)' : 'var(--color-surprise)';
	}

	const vcDimBound = $derived(marginVCDimBound(R, gamma));
	const generalizationBound = $derived.by(() => {
		try {
			return svmGeneralizationBound(R, gamma, N, DELTA);
		} catch {
			return null; // d > N for this (R, gamma) — the bound isn't meaningful at this fixed N
		}
	});

	// ─── Projection (mirrors ScatterPlot.svelte's internal pad=4) ──────────
	const SIZE = 420;
	const PAD = 4;
	const DOMAIN: [number, number] = [-6, 6];

	function projX(x: number): number {
		return PAD + ((x - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * (SIZE - PAD * 2);
	}
	function projY(y: number): number {
		return PAD + ((DOMAIN[1] - y) / (DOMAIN[1] - DOMAIN[0])) * (SIZE - PAD * 2);
	}
	const pxPerUnit = (SIZE - PAD * 2) / (DOMAIN[1] - DOMAIN[0]);
</script>

<Figure type="chart">
	<ScatterPlot
		{points}
		domainX={DOMAIN}
		domainY={DOMAIN}
		width={SIZE}
		height={SIZE}
		colorBy={colorByClass}
		defaultSize={6}
		showAxes={true}
		showLabels={true}
	>
		{#snippet snippetOverlay()}
			<!-- Margin band -->
			<rect
				x={projX(DOMAIN[0])}
				y={projY(gamma)}
				width={projX(DOMAIN[1]) - projX(DOMAIN[0])}
				height={projY(-gamma) - projY(gamma)}
				fill="var(--color-belief)"
				opacity="0.08"
			/>
			<!-- Separating hyperplane -->
			<line
				x1={projX(DOMAIN[0])}
				y1={projY(0)}
				x2={projX(DOMAIN[1])}
				y2={projY(0)}
				stroke="var(--color-text)"
				stroke-width="1.5"
			/>
			<!-- Margin boundaries -->
			<line
				x1={projX(DOMAIN[0])}
				y1={projY(gamma)}
				x2={projX(DOMAIN[1])}
				y2={projY(gamma)}
				stroke="var(--color-belief)"
				stroke-width="1"
				stroke-dasharray="4 4"
				opacity="0.7"
			/>
			<line
				x1={projX(DOMAIN[0])}
				y1={projY(-gamma)}
				x2={projX(DOMAIN[1])}
				y2={projY(-gamma)}
				stroke="var(--color-belief)"
				stroke-width="1"
				stroke-dasharray="4 4"
				opacity="0.7"
			/>
			<!-- Radius R -->
			<circle
				cx={projX(0)}
				cy={projY(0)}
				r={R * pxPerUnit}
				fill="none"
				stroke={pointsExceedR ? 'var(--color-surprise)' : 'var(--color-text-muted)'}
				stroke-width="1.5"
				stroke-dasharray="2 3"
			/>
		{/snippet}
	</ScatterPlot>

	{#snippet caption()}
		Bande bleue : marge γ de part et d'autre de l'hyperplan séparateur (trait plein). Cercle
		pointillé : rayon R borné par ‖X‖ ≤ R. Les deux points les plus proches de chaque classe
		touchent exactement la frontière de la marge.
		{#if pointsExceedR}
			<strong style="color: var(--color-surprise)">
				Certains points sortent du cercle de rayon R — l'hypothèse ‖X_i‖ ≤ R n'est plus respectée,
				la borne ci-dessous ne s'applique alors plus rigoureusement à cette configuration.
			</strong>
		{/if}
	{/snippet}
</Figure>

<Slider min={0.2} max={3} step={0.1} bind:value={gamma} label="Marge γ" />
<Slider min={1} max={5} step={0.1} bind:value={R} label="Rayon R" />

<Metrics align="left">
	<div class="cell">
		<span class="label">VCdim(H_γ) ≤ ⌊R²/γ²⌋</span>
		<span class="value">{vcDimBound}</span>
	</div>
	<div class="cell">
		<span class="label">Borne de généralisation (n={N}, δ={DELTA})</span>
		<span class="value">
			{generalizationBound !== null ? generalizationBound.toFixed(4) : `n < ${vcDimBound} : n/a`}
			{#if generalizationBound !== null && generalizationBound > 1}
				<span class="vacuous">borne triviale (> 1)</span>
			{/if}
		</span>
	</div>
</Metrics>

<style>
	.vacuous {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-surprise);
	}
</style>
