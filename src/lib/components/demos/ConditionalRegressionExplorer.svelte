<script lang="ts">
	// Part IV — Optimum de Bayes — régression : Théorème 1.2.
	// L2 -> moyenne conditionnelle, L1 -> médiane conditionnelle.
	// All distributional math comes from bayes-learning.ts; only chart layout
	// (jitter, projection for the scatter overlay) lives here.

	// TODO: confirm these paths/names against your actual files.
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
	import { linspace } from '$lib/math/util'; // TODO: confirm path

	// Fixed conditional distribution of Y | X = x, chosen so mean and median
	// differ visibly (asymmetric support) — makes the L2 vs. L1 contrast clear.
	const dist: ConditionalDistribution = {
		values: [-1, 2, 6],
		probabilities: [0.5, 0.3, 0.2]
	};

	const mean = conditionalMean(dist); // L2-optimal constant, 1.3
	const median = conditionalMedian(dist); // L1-optimal constant, -1

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

	// ─── Scatter of Y | X = x (fixed x, jittered horizontally for readability) ──
	const samples = sampleConditionalDistribution(dist, 60, 7);

	/** Deterministic quasi-random offset in [-0.5, 0.5] * spread (golden-ratio sequence). */
	function jitter(i: number, spread: number): number {
		const frac = (i * 0.6180339887498949) % 1;
		return (frac - 0.5) * spread;
	}

	const scatterPoints = samples.map((y, i) => ({ x: jitter(i, 0.6), y }));

	const scatterWidth = 400;
	const scatterHeight = 260;
	const scatterDomainX: [number, number] = [-1, 1];
	const scatterDomainY: [number, number] = [
		Math.min(...dist.values) - 1.5,
		Math.max(...dist.values) + 1.5
	];

	// Mirrors ScatterPlot.svelte's internal projection (pad = 4) so the overlay
	// lines land exactly where its own points do. If ScatterPlot's pad or
	// projection formula changes, update this too.
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
			<line
				x1={projX(scatterDomainX[0])}
				y1={projY(c)}
				x2={projX(scatterDomainX[1])}
				y2={projY(c)}
				stroke="var(--color-text)"
				stroke-width="2"
				stroke-dasharray="4 4"
			/>
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
		{/snippet}
	</ScatterPlot>

	{#snippet caption()}
		Échantillon de Y | X = x (x fixé ; l'écartement horizontal n'est qu'un artifice visuel pour
		éviter que les points ne se superposent). Ligne pleine : prédiction candidate c. Pointillés :
		moyenne conditionnelle (bleu) et médiane conditionnelle (orange).
	{/snippet}
</Figure>

<Slider min={cMin} max={cMax} step={0.05} bind:value={c} label="Prédiction candidate c" />

<Figure type="chart">
	<CurveChart
		curves={[{ points: squaredPoints, stroke: 'var(--color-belief)', strokeWidth: 2 }]}
		xDomain={[cMin, cMax]}
		yAxis={true}
		vlines={[{ x: mean, stroke: 'var(--color-belief)', strokeDasharray: '4 4', label: 'moyenne' }]}
		curveDots={[{ x: c, y: squaredAtC, fill: 'var(--color-belief)' }]}
		legend={[{ label: 'E[(Y−c)² | x]', color: 'var(--color-belief)' }]}
	/>

	{#snippet caption()}
		Risque quadratique conditionnel en fonction de c. Minimum atteint en c = E[Y|x] (la moyenne
		conditionnelle), conformément au Théorème 1.2.
	{/snippet}
</Figure>

<Figure type="chart">
	<CurveChart
		curves={[{ points: absolutePoints, stroke: 'var(--color-surprise)', strokeWidth: 2 }]}
		xDomain={[cMin, cMax]}
		yAxis={true}
		vlines={[
			{ x: median, stroke: 'var(--color-surprise)', strokeDasharray: '4 4', label: 'médiane' }
		]}
		curveDots={[{ x: c, y: absoluteAtC, fill: 'var(--color-surprise)' }]}
		legend={[{ label: 'E[|Y−c| | x]', color: 'var(--color-surprise)' }]}
	/>

	{#snippet caption()}
		Risque absolu conditionnel en fonction de c. Minimum atteint en c = Med(Y|x) (la médiane
		conditionnelle), conformément au Théorème 1.2.
	{/snippet}
</Figure>
