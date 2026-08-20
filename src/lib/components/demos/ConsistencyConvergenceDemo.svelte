<script lang="ts">
	// Part V — Consistance — Définition 1.2.
	// Visualizes several simulated learning-curve trajectories R(h_n) as n
	// grows, plus the empirical exceedance probability P(R(h_n)-R* > epsilon)
	// and mean-squared excess risk at the selected n — the two quantities that
	// must shrink to 0 for consistency in probability / mean square.
	// Almost-sure convergence is the one the trajectories themselves are
	// meant to give intuition for (each individual line eventually settling
	// inside the epsilon band), rather than a single number — the exceedance
	// probability alone can't distinguish it from the weaker notions.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		simulateRiskPath,
		simulateRiskTrials,
		exceedanceProbability,
		meanSquaredExcessRisk,
		type ExcessRiskModel
	} from '$lib/math/consistency';
	import { linspace } from '$lib/math/util'; // TODO: confirm path

	const bayesRisk = 0.15;
	const model: ExcessRiskModel = { biasConst: 1, decayRate: 0.5 };

	const N_MIN = 2;
	const N_MAX = 300;

	// Fixed grid + trajectories — computed once, not reactive to the sliders.
	// The sliders move a marker across these, they don't regenerate them.
	const nGrid = linspace(N_MIN, N_MAX, 120).map((n) => Math.round(n));
	const trajectorySeeds = [101, 102, 103, 104, 105, 106];
	const trajectories = trajectorySeeds.map((seed) =>
		simulateRiskPath(nGrid, bayesRisk, model, seed)
	);
	const trajectoryPoints = trajectories.map((risks) =>
		risks.map((r, i): [number, number] => [nGrid[i], r])
	);

	let n = $state(30);
	let epsilon = $state(0.15);

	// Flat reference lines spanning the domain, for R* and R*+epsilon.
	const bayesRiskLinePoints: [number, number][] = [
		[N_MIN, bayesRisk],
		[N_MAX, bayesRisk]
	];
	const thresholdLinePoints = $derived([
		[N_MIN, bayesRisk + epsilon],
		[N_MAX, bayesRisk + epsilon]
	] as [number, number][]);

	// Fresh Monte-Carlo batch at the current (n, epsilon) — independent of the
	// six displayed trajectories, used for the two Metrics below.
	const TRIALS = 3000;
	const trialSamples = $derived(simulateRiskTrials(n, TRIALS, bayesRisk, model, 999));
	const pExceed = $derived(exceedanceProbability(trialSamples, bayesRisk, epsilon));
	const mse = $derived(meanSquaredExcessRisk(trialSamples, bayesRisk));
</script>

<Figure type="chart">
	<CurveChart
		curves={[
			{ points: bayesRiskLinePoints, stroke: 'var(--color-text-muted)', strokeWidth: 1.5 },
			{
				points: thresholdLinePoints,
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1,
				strokeDasharray: '2 2',
				opacity: 0.6
			},
			...trajectoryPoints.map((points) => ({
				points,
				stroke: 'var(--color-belief)',
				strokeWidth: 1.5,
				opacity: 0.4
			}))
		]}
		xDomain={[N_MIN, N_MAX]}
		yAxis={true}
		fillBetween={[{ curveA: 0, curveB: 1, fill: 'var(--color-belief)', opacity: 0.08 }]}
		vlines={[{ x: n, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'n' }]}
		legend={[
			{ label: 'R* (risque de Bayes)', color: 'var(--color-text-muted)' },
			{ label: 'R* + ε', color: 'var(--color-text-muted)', kind: 'dashed-line' },
			{ label: 'trajectoires R(h_n) simulées', color: 'var(--color-belief)' }
		]}
	/>

	{#snippet caption()}
		Six trajectoires simulées indépendamment de R(h_n) à mesure que n grandit. La bande ombrée est
		la zone [R*, R*+ε] : une trajectoire qui y entre et n'en ressort plus illustre la convergence
		presque sûre — une notion que ni la probabilité d'excès ni l'erreur quadratique moyenne
		ci-dessous ne peuvent, à elles seules, distinguer des notions plus faibles.
	{/snippet}
</Figure>

<Slider min={N_MIN} max={N_MAX} step={1} bind:value={n} label="Taille d'échantillon n" />
<Slider min={0.01} max={0.6} step={0.01} bind:value={epsilon} label="Seuil ε" />

<Metrics align="left">
	<div class="cell">
		<span class="label">P(R(h_n) − R* &gt; ε)</span>
		<span class="value">{pExceed.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">E[(R(h_n) − R*)²]</span>
		<span class="value">{mse.toFixed(4)}</span>
	</div>
	<div class="cell">
		<span class="label">Estimé sur</span>
		<span class="value">{TRIALS} tirages</span>
	</div>
</Metrics>
