<script lang="ts">
	// Part VI — Inégalités fondamentales.
	//
	// Design note on what's being compared: Markov's inequality applied
	// directly to a nonnegative Zbar_n naturally bounds the ONE-SIDED event
	// P(Zbar_n - mean >= epsilon), and that bound does NOT shrink with n — a
	// deliberate, honest illustration of why it's a weak starting point.
	// Chebyshev and Hoeffding are stated in theorie.typ in their two-sided
	// form; applied here to the same one-sided event they remain valid but
	// slightly conservative upper bounds (one-sided event ⊆ two-sided event).
	// All three, plus the empirical curve, therefore bound/estimate the exact
	// same quantity — see empiricalOneSidedExceedanceProbability's docstring.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		markovBound,
		chebyshevBound,
		simulateEmpiricalMeanTrials,
		empiricalOneSidedExceedanceProbability,
		type EmpiricalMeanModel
	} from '$lib/math/concentration';
	import { hoeffdingBound } from '$lib/math/generalization';
	import { linspace } from '$lib/math/util'; // TODO: confirm path

	// Fixed mean, kept in (0,1) and away from the edges so the underlying
	// variable's support (mean ± sqrt(3*variance)) can stay inside [0,1] —
	// required for Hoeffding's boundedness assumption to actually hold.
	const MEAN = 0.5;
	const N_MIN = 5;
	const N_MAX = 300;
	const TRIALS = 1500;
	const SEED = 777;

	// Log-spaced grid so the curves resolve the fast-changing small-n region.
	const nGrid = Array.from(
		new Set(linspace(Math.log(N_MIN), Math.log(N_MAX), 25).map((v) => Math.round(Math.exp(v))))
	);

	let variance = $state(0.02);
	let epsilon = $state(0.1);
	let n = $state(50);

	const model = $derived({ mean: MEAN, variance } as EmpiricalMeanModel);

	// Markov's bound doesn't depend on n — a flat line, drawn across the grid.
	const markovValue = $derived(markovBound(MEAN, MEAN + epsilon));
	const markovPoints = $derived([
		[N_MIN, markovValue],
		[N_MAX, markovValue]
	] as [number, number][]);

	const chebyshevPoints = $derived(
		nGrid.map((gridN): [number, number] => [gridN, chebyshevBound(variance / gridN, epsilon)])
	);
	const hoeffdingPoints = $derived(
		nGrid.map((gridN): [number, number] => [gridN, hoeffdingBound(gridN, epsilon)])
	);
	const empiricalPoints = $derived(
		nGrid.map((gridN): [number, number] => {
			const samples = simulateEmpiricalMeanTrials(gridN, TRIALS, model, SEED);
			return [gridN, empiricalOneSidedExceedanceProbability(samples, MEAN, epsilon)];
		})
	);

	// Exact values at the slider's n, for the vline markers and Metrics.
	const chebyshevAtN = $derived(chebyshevBound(variance / n, epsilon));
	const hoeffdingAtN = $derived(hoeffdingBound(n, epsilon));
	const empiricalAtN = $derived(
		empiricalOneSidedExceedanceProbability(
			simulateEmpiricalMeanTrials(n, TRIALS, model, SEED),
			MEAN,
			epsilon
		)
	);
</script>

<Figure type="chart">
	<CurveChart
		curves={[
			{ points: markovPoints, stroke: 'var(--color-text-muted)', strokeWidth: 2 },
			{ points: chebyshevPoints, stroke: 'var(--color-belief)', strokeWidth: 2 },
			{ points: hoeffdingPoints, stroke: 'var(--color-surprise)', strokeWidth: 2 },
			{ points: empiricalPoints, stroke: 'var(--color-text)', strokeWidth: 1.5, opacity: 0.7 }
		]}
		xDomain={[N_MIN, N_MAX]}
		yAxis={true}
		vlines={[{ x: n, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'n' }]}
		curveDots={[
			{ x: n, y: markovValue, fill: 'var(--color-text-muted)' },
			{ x: n, y: chebyshevAtN, fill: 'var(--color-belief)' },
			{ x: n, y: hoeffdingAtN, fill: 'var(--color-surprise)' },
			{ x: n, y: empiricalAtN, fill: 'var(--color-text)' }
		]}
		legend={[
			{ label: 'Markov (ne dépend pas de n)', color: 'var(--color-text-muted)' },
			{ label: 'Tchebychev', color: 'var(--color-belief)' },
			{ label: 'Hoeffding', color: 'var(--color-surprise)' },
			{ label: 'probabilité empirique', color: 'var(--color-text)' }
		]}
	/>

	{#snippet caption()}
		Les quatre courbes bornent (ou estiment) la même quantité : P(Z̄ₙ − moyenne ≥ ε). Markov,
		appliqué directement à Z̄ₙ ≥ 0, ne tient pas compte de la moyenne des observations — sa borne
		reste constante quel que soit n. Tchebychev (variance/n) et Hoeffding (borné + indépendance)
		exploitent davantage de structure et se resserrent avec n, Hoeffding bien plus vite que
		Tchebychev. Les deux sont énoncées sous forme bilatérale dans le cours ; appliquées ici à
		l'événement unilatéral, elles restent valides mais légèrement conservatrices.
	{/snippet}
</Figure>

<Slider min={0.001} max={0.08} step={0.001} bind:value={variance} label="Variance" />
<Slider min={0.01} max={0.3} step={0.01} bind:value={epsilon} label="Seuil ε" />
<Slider
	min={N_MIN}
	max={N_MAX}
	step={1}
	logarithmic={true}
	bind:value={n}
	label="Taille d'échantillon n"
/>

<Metrics align="left">
	<div class="cell">
		<span class="label">Markov</span>
		<span class="value">{markovValue.toFixed(4)}</span>
	</div>
	<div class="cell">
		<span class="label">Tchebychev</span>
		<span class="value">{chebyshevAtN.toFixed(4)}</span>
	</div>
	<div class="cell">
		<span class="label">Hoeffding</span>
		<span class="value">{hoeffdingAtN.toFixed(4)}</span>
	</div>
	<div class="cell">
		<span class="label">Empirique</span>
		<span class="value">{empiricalAtN.toFixed(4)}</span>
	</div>
</Metrics>
