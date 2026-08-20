<script lang="ts">
	// Part V — Consistance — approximation/estimation decomposition
	// (theorie.typ, "Pourquoi cette notion est-elle centrale ?"):
	//   R(h_n) - R* = [R(h_n) - inf_H R(h)] (estimation) + [inf_H R(h) - R*] (approximation)
	//
	// Two sliders: n (sample size) and complexity (hypothesis-class richness).
	// The approximation curve only depends on complexity; the learned-risk
	// curve depends on both, and is typically U-shaped in complexity for fixed
	// n — too simple underfits, too rich overfits given only n samples.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		approximationRisk,
		learnedRisk,
		approxEstimDecomposition,
		type ApproxEstimModel
	} from '$lib/math/consistency';
	import { linspace } from '$lib/math/util'; // TODO: confirm path

	const bayesRisk = 0.1;
	const model: ApproxEstimModel = { approxConst: 0.5, approxExponent: 0.7, estimConst: 2 };

	const C_MIN = 1;
	const C_MAX = 50;
	const complexityGrid = linspace(C_MIN, C_MAX, 150);

	let n = $state(50);
	let complexity = $state(5);

	const bayesRiskLinePoints: [number, number][] = [
		[C_MIN, bayesRisk],
		[C_MAX, bayesRisk]
	];

	const approxPoints = $derived(
		complexityGrid.map((c): [number, number] => [c, approximationRisk(c, bayesRisk, model)])
	);
	const learnedPoints = $derived(
		complexityGrid.map((c): [number, number] => [c, learnedRisk(n, c, bayesRisk, model)])
	);

	const decomposition = $derived(approxEstimDecomposition(n, complexity, bayesRisk, model));
</script>

<Figure type="chart">
	<CurveChart
		curves={[
			{ points: bayesRiskLinePoints, stroke: 'var(--color-text-muted)', strokeWidth: 1.5 },
			{ points: approxPoints, stroke: 'var(--color-belief)', strokeWidth: 2 },
			{ points: learnedPoints, stroke: 'var(--color-surprise)', strokeWidth: 2 }
		]}
		xDomain={[C_MIN, C_MAX]}
		yAxis={true}
		vlines={[
			{
				x: complexity,
				stroke: 'var(--color-text)',
				strokeDasharray: '4 4',
				label: 'complexité choisie'
			}
		]}
		curveDots={[
			{ x: complexity, y: decomposition.approximationRisk, fill: 'var(--color-belief)' },
			{ x: complexity, y: decomposition.learnedRisk, fill: 'var(--color-surprise)' }
		]}
		legend={[
			{ label: 'R* (risque de Bayes)', color: 'var(--color-text-muted)' },
			{ label: 'inf_H R(h) (meilleur de la classe)', color: 'var(--color-belief)' },
			{ label: 'R(h_n) (risque appris)', color: 'var(--color-surprise)' }
		]}
	/>

	{#snippet caption()}
		Trois niveaux de risque en fonction de la complexité de la classe H, pour n fixé. L'écart
		bleu→gris est le terme d'approximation (indépendant de n) ; l'écart orange→bleu est le terme
		d'estimation (se réduit quand n augmente). Pour n fixé, R(h_n) est typiquement en U : une classe
		trop pauvre sous-ajuste, une classe trop riche est difficile à estimer avec si peu de données.
	{/snippet}
</Figure>

<Slider
	min={10}
	max={2000}
	step={1}
	logarithmic={true}
	bind:value={n}
	label="Taille d'échantillon n"
/>
<Slider
	min={C_MIN}
	max={C_MAX}
	step={0.5}
	bind:value={complexity}
	label="Complexité de la classe H"
/>

<Metrics align="left">
	<div class="cell">
		<span class="label">Terme d'approximation</span>
		<span class="value">{decomposition.approximationGap.toFixed(4)}</span>
	</div>
	<div class="cell">
		<span class="label">Terme d'estimation</span>
		<span class="value">{decomposition.estimationGap.toFixed(4)}</span>
	</div>
	<div class="cell">
		<span class="label">R(h_n) − R* total</span>
		<span class="value">{(decomposition.learnedRisk - bayesRisk).toFixed(4)}</span>
	</div>
</Metrics>
