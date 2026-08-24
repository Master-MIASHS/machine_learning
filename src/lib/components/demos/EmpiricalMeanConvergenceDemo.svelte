<script lang="ts">
	// Part VI — Application : consistance en probabilité de la moyenne
	// empirique (loi des grands nombres via Tchebychev).
	//
	// NOTE on the histogram: no verified density-chart/histogram component was
	// available, so the final-value histogram below is plain hand-drawn SVG
	// (bars via <rect>) inside Figure, rather than a guessed component API.
	// Swap in a real one if it exists — the binning math (histogram() in
	// concentration.ts) is already separated from this rendering, so only the
	// markup below would need to change.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';

	import {
		simulateEmpiricalMeanPath,
		simulateEmpiricalMeanTrials,
		empiricalMeanStandardError,
		histogram,
		type EmpiricalMeanModel
	} from '$lib/math/concentration';
	import { linspace } from '$lib/math/util'; // TODO: confirm path

	const MEAN = 5;

	let variance = $state(4);
	let nMax = $state(200);

	const model = $derived({ mean: MEAN, variance } as EmpiricalMeanModel);

	// Log-spaced grid so early, fast-changing behavior isn't squashed against
	// the axis; recomputed whenever nMax changes.
	const nGrid = $derived(
		Array.from(
			new Set(linspace(0, Math.log(nMax), 40).map((v) => Math.max(1, Math.round(Math.exp(v)))))
		).sort((a, b) => a - b)
	);

	const TRAJECTORY_SEEDS = [101, 102, 103, 104, 105, 106, 107, 108];
	const trajectoryPoints = $derived(
		TRAJECTORY_SEEDS.map((seed) =>
			simulateEmpiricalMeanPath(nGrid, model, seed).map((v, i): [number, number] => [nGrid[i], v])
		)
	);

	const meanLinePoints = $derived([
		[nGrid[0], MEAN],
		[nGrid[nGrid.length - 1], MEAN]
	] as [number, number][]);

	// Envelope: mean ± 2 standard errors. Approximate — the underlying model
	// isn't Gaussian, this is a CLT-style approximation, not an exact 95% band.
	const K = 2;
	const upperEnvelopePoints = $derived(
		nGrid.map((n): [number, number] => [n, MEAN + K * empiricalMeanStandardError(n, variance)])
	);
	const lowerEnvelopePoints = $derived(
		nGrid.map((n): [number, number] => [n, MEAN - K * empiricalMeanStandardError(n, variance)])
	);

	// ─── Final-value histogram at n = nMax ──────────────────────────────────
	const HIST_TRIALS = 4000;
	const HIST_BINS = 22;
	const finalValues = $derived(simulateEmpiricalMeanTrials(nMax, HIST_TRIALS, model, 555));
	const bins = $derived(histogram(finalValues, HIST_BINS));
	const maxCount = $derived(Math.max(1, ...bins.map((b) => b.count)));

	const HIST_WIDTH = 420;
	const HIST_HEIGHT = 200;
	const HIST_PAD = { top: 10, right: 16, bottom: 26, left: 16 };
	const histRange = $derived(
		bins.length > 0
			? ([bins[0].binStart, bins[bins.length - 1].binEnd] as [number, number])
			: ([MEAN - 1, MEAN + 1] as [number, number])
	);

	function histX(value: number): number {
		const [rMin, rMax] = histRange;
		return (
			HIST_PAD.left +
			((value - rMin) / (rMax - rMin)) * (HIST_WIDTH - HIST_PAD.left - HIST_PAD.right)
		);
	}
	function histY(count: number): number {
		return (
			HIST_HEIGHT -
			HIST_PAD.bottom -
			(count / maxCount) * (HIST_HEIGHT - HIST_PAD.top - HIST_PAD.bottom)
		);
	}
	const histBaseline = HIST_HEIGHT - HIST_PAD.bottom;

	const empiricalStd = $derived(Math.sqrt(variance / nMax));
</script>

<Figure type="chart">
	<CurveChart
		curves={[
			{ points: meanLinePoints, stroke: 'var(--color-text-muted)', strokeWidth: 1.5 },
			{
				points: upperEnvelopePoints,
				stroke: 'var(--color-belief)',
				strokeWidth: 1,
				strokeDasharray: '2 2',
				opacity: 0.6
			},
			{
				points: lowerEnvelopePoints,
				stroke: 'var(--color-belief)',
				strokeWidth: 1,
				strokeDasharray: '2 2',
				opacity: 0.6
			},
			...trajectoryPoints.map((points) => ({
				points,
				stroke: 'var(--color-surprise)',
				strokeWidth: 1.5,
				opacity: 0.45
			}))
		]}
		xDomain={[nGrid[0], nGrid[nGrid.length - 1]]}
		yAxis={true}
		fillBetween={[{ curveA: 1, curveB: 2, fill: 'var(--color-belief)', opacity: 0.08 }]}
		legend={[
			{ label: 'moyenne théorique', color: 'var(--color-text-muted)' },
			{ label: 'enveloppe ± 2 erreurs-types', color: 'var(--color-belief)', kind: 'dashed-line' },
			{ label: 'trajectoires Z̄ₙ simulées', color: 'var(--color-surprise)' }
		]}
	/>

	{#snippet caption()}
		Huit trajectoires indépendantes de la moyenne empirique Z̄ₙ à mesure que n grandit, avec
		l'enveloppe ± 2 erreurs-types (√(variance/n), une approximation de type TCL, pas une bande à 95%
		exacte). L'enveloppe se resserre en 1/√n : c'est précisément la vitesse de convergence que
		Tchebychev garantit.
	{/snippet}
</Figure>

<Slider min={0.5} max={20} step={0.5} bind:value={variance} label="Variance" />
<Slider
	min={10}
	max={500}
	step={1}
	logarithmic={true}
	bind:value={nMax}
	label="Taille d'échantillon n (histogramme et étendue des trajectoires)"
/>

<Figure type="chart">
	<svg
		viewBox={`0 0 ${HIST_WIDTH} ${HIST_HEIGHT}`}
		width="100%"
		height={HIST_HEIGHT}
		role="img"
		aria-label="Histogramme des valeurs finales"
	>
		{#each bins as bin}
			<rect
				x={histX(bin.binStart) + 1}
				y={histY(bin.count)}
				width={Math.max(0, histX(bin.binEnd) - histX(bin.binStart) - 2)}
				height={histBaseline - histY(bin.count)}
				fill="var(--color-surprise)"
				opacity="0.75"
			/>
		{/each}
		<line
			x1={histX(MEAN)}
			y1={HIST_PAD.top}
			x2={histX(MEAN)}
			y2={histBaseline}
			stroke="var(--color-text)"
			stroke-width="1.5"
			stroke-dasharray="4 4"
		/>
		<line
			x1={HIST_PAD.left}
			y1={histBaseline}
			x2={HIST_WIDTH - HIST_PAD.right}
			y2={histBaseline}
			stroke="var(--color-border)"
			stroke-width="1"
		/>
	</svg>

	{#snippet caption()}
		Distribution de Z̄<sub>{nMax}</sub> sur {HIST_TRIALS} tirages indépendants (ligne pointillée : moyenne
		théorique). À mesure que n augmente, cette distribution se resserre autour de la moyenne — c'est la
		même convergence que montrent les trajectoires ci-dessus, vue depuis un seul instant n plutôt que
		suivie dans le temps.
	{/snippet}
</Figure>

<Metrics align="left">
	<div class="cell">
		<span class="label">Erreur-type théorique</span>
		<span class="value">{empiricalStd.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">n (histogramme)</span>
		<span class="value">{nMax}</span>
	</div>
	<div class="cell">
		<span class="label">Tirages</span>
		<span class="value">{HIST_TRIALS}</span>
	</div>
</Metrics>
