<script lang="ts">
	// Part IV — Optimum de Bayes — régression : Théorème 1.2.
	// L2 -> moyenne conditionnelle, L1 -> médiane conditionnelle.
	// All distributional math comes from bayes-learning.ts; only chart layout
	// (jitter, projection for the scatter overlay) lives here.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';

	import {
		conditionalMean,
		conditionalMedian,
		conditionalSquaredRisk,
		conditionalAbsoluteRisk,
		conditionalRiskCurve,
		sampleConditionalDistribution,
		type ConditionalDistribution
	} from '$lib/math/bayes-learning';
	import { linspace } from '$lib/math/util';

	// ─── Conditional distribution Y | X = x ───────────────────────────────────
	// Chosen so that mean and median are visibly different.
	const dist: ConditionalDistribution = {
		values: [-1, 2, 6],
		probabilities: [0.5, 0.3, 0.2]
	};

	// Bayes-optimal predictions:
	// L2 -> conditional mean
	// L1 -> conditional median
	const mean = conditionalMean(dist);
	const median = conditionalMedian(dist);

	// Candidate prediction c, moved by the slider.
	let c = $state(0);

	const cMin = Math.min(...dist.values) - 1;
	const cMax = Math.max(...dist.values) + 1;

	// ─── Risk curves over c ────────────────────────────────────────────────────
	const cGrid = linspace(cMin, cMax, 121);
	const riskCurve = $derived(conditionalRiskCurve(dist, cGrid));

	const squaredPoints = $derived(riskCurve.map((p): [number, number] => [p.c, p.squaredRisk]));

	const absolutePoints = $derived(riskCurve.map((p): [number, number] => [p.c, p.absoluteRisk]));

	const squaredAtC = $derived(conditionalSquaredRisk(dist, c));
	const absoluteAtC = $derived(conditionalAbsoluteRisk(dist, c));

	// ─── Scatter of Y | X = x ─────────────────────────────────────────────────
	// Horizontal jitter is purely visual: x is fixed.
	const samples = sampleConditionalDistribution(dist, 60, 7);

	/** Deterministic quasi-random offset in [-0.5, 0.5] * spread. */
	function jitter(i: number, spread: number): number {
		const frac = (i * 0.6180339887498949) % 1;
		return (frac - 0.5) * spread;
	}

	const scatterPoints = samples.map((y, i) => ({
		x: jitter(i, 0.6),
		y
	}));

	const scatterWidth = 400;
	const scatterHeight = 260;

	const scatterDomainX: [number, number] = [-1, 1];

	const scatterDomainY: [number, number] = [
		Math.min(...dist.values) - 1.5,
		Math.max(...dist.values) + 1.5
	];

	// Mirrors ScatterPlot.svelte's internal projection.
	const SCATTER_PAD = 4;

	function projX(x: number): number {
		const [xMin, xMax] = scatterDomainX;

		return SCATTER_PAD + ((x - xMin) / (xMax - xMin)) * (scatterWidth - SCATTER_PAD * 2);
	}

	function projY(y: number): number {
		const [yMin, yMax] = scatterDomainY;

		return SCATTER_PAD + ((yMax - y) / (yMax - yMin)) * (scatterHeight - SCATTER_PAD * 2);
	}
</script>

<!-- ──────────────────────────────────────────────────────────────────────────
     Distribution Y | X = x
─────────────────────────────────────────────────────────────────────────── -->

<Figure type="chart">
	<ScatterPlot
		points={scatterPoints}
		domainX={scatterDomainX}
		domainY={scatterDomainY}
		width={scatterWidth}
		height={scatterHeight}
		defaultColor="var(--color-text-muted)"
		showAxes={true}
		showLabels={false}
	>
		{#snippet snippetOverlay()}
			<!-- ── Candidate prediction c ───────────────────────────────────── -->
			<line
				x1={projX(scatterDomainX[0])}
				y1={projY(c)}
				x2={projX(scatterDomainX[1])}
				y2={projY(c)}
				stroke="var(--color-text)"
				stroke-width="2"
				stroke-dasharray="4 4"
			/>

			<!-- ── Conditional mean: L2 optimum ────────────────────────────── -->
			<line
				x1={projX(scatterDomainX[0])}
				y1={projY(mean)}
				x2={projX(scatterDomainX[1])}
				y2={projY(mean)}
				stroke="var(--color-belief)"
				stroke-width="1.5"
				stroke-dasharray="2 2"
				opacity="0.7"
			/>

			<!-- ── Conditional median: L1 optimum ───────────────────────────── -->
			<line
				x1={projX(scatterDomainX[0])}
				y1={projY(median)}
				x2={projX(scatterDomainX[1])}
				y2={projY(median)}
				stroke="var(--color-surprise)"
				stroke-width="1.5"
				stroke-dasharray="2 2"
				opacity="0.7"
			/>

			<!-- ── Legend ───────────────────────────────────────────────────── -->
			<g transform="translate(12, 0) scale(0.8)">
				<rect
					x="0"
					y="0"
					width="140"
					height="62"
					rx="5"
					fill="var(--color-background)"
					stroke="var(--color-border)"
					opacity="0.94"
				/>

				<!-- Candidate prediction -->
				<line
					x1="10"
					y1="13"
					x2="30"
					y2="13"
					stroke="var(--color-text)"
					stroke-width="2"
					stroke-dasharray="4 4"
				/>

				<text x="36" y="17" font-size="9" fill="var(--color-text)"> Prédiction choisie c </text>

				<!-- L2 / mean -->
				<line
					x1="10"
					y1="31"
					x2="30"
					y2="31"
					stroke="var(--color-belief)"
					stroke-width="1.5"
					stroke-dasharray="2 2"
				/>

				<text x="36" y="35" font-size="9" fill="var(--color-text)"> Optimal L2 : moyenne </text>

				<!-- L1 / median -->
				<line
					x1="10"
					y1="49"
					x2="30"
					y2="49"
					stroke="var(--color-surprise)"
					stroke-width="1.5"
					stroke-dasharray="2 2"
				/>

				<text x="36" y="53" font-size="9" fill="var(--color-text)"> Optimal L1 : médiane </text>
			</g>
		{/snippet}
	</ScatterPlot>

	{#snippet caption()}
		Échantillon de Y | X = x (x fixé ; l'écartement horizontal est uniquement visuel). La prédiction
		choisie c est comparée aux deux prédicteurs de Bayes : la moyenne pour L2 et la médiane pour L1.
	{/snippet}
</Figure>

<!-- ──────────────────────────────────────────────────────────────────────────
     Candidate prediction
─────────────────────────────────────────────────────────────────────────── -->

<Slider min={cMin} max={cMax} step={0.05} bind:value={c} label="Prédiction choisie c" />

<!-- ──────────────────────────────────────────────────────────────────────────
     L2 — Squared loss
─────────────────────────────────────────────────────────────────────────── -->

<Figure type="chart">
	<CurveChart
		curves={[
			{
				points: squaredPoints,
				stroke: 'var(--color-belief)',
				strokeWidth: 2
			}
		]}
		xDomain={[cMin, cMax]}
		yAxis={true}
		vlines={[
			{
				x: mean,
				stroke: 'var(--color-belief)',
				strokeDasharray: '4 4',
				label: 'optimal L2 : moyenne'
			}
		]}
		curveDots={[
			{
				x: c,
				y: squaredAtC,
				fill: 'var(--color-text)'
			}
		]}
		legend={[
			{
				label: 'Risque L2 : E[(Y−c)² | x]',
				color: 'var(--color-belief)'
			}
		]}
	/>

	{#snippet caption()}
		Risque quadratique conditionnel en fonction de la prédiction c. Le minimum est atteint en c =
		E[Y|x] : la moyenne conditionnelle est donc le prédicteur optimal pour la perte L2.
	{/snippet}
</Figure>

<!-- ──────────────────────────────────────────────────────────────────────────
     L1 — Absolute loss
─────────────────────────────────────────────────────────────────────────── -->

<Figure type="chart">
	<CurveChart
		curves={[
			{
				points: absolutePoints,
				stroke: 'var(--color-surprise)',
				strokeWidth: 2
			}
		]}
		xDomain={[cMin, cMax]}
		yAxis={true}
		vlines={[
			{
				x: median,
				stroke: 'var(--color-surprise)',
				strokeDasharray: '4 4',
				label: 'optimal L1 : médiane'
			}
		]}
		curveDots={[
			{
				x: c,
				y: absoluteAtC,
				fill: 'var(--color-text)'
			}
		]}
		legend={[
			{
				label: 'Risque L1 : E[|Y−c| | x]',
				color: 'var(--color-surprise)'
			}
		]}
	/>

	{#snippet caption()}
		Risque absolu conditionnel en fonction de la prédiction c. Le minimum est atteint en c =
		Med(Y|x) : la médiane conditionnelle est donc le prédicteur optimal pour la perte L1.
	{/snippet}
</Figure>
