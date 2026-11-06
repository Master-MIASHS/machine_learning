<script lang="ts">
	// Part V, expert lesson /part5/double-descente — model-wise double descent in a two-layer network whose
	// first layer is FROZEN at random (random ReLU features; Rahimi & Recht 2007,
	// Belkin et al. 2019 Fig. 3, Mei & Montanari 2022). Only the output layer is
	// fitted, by min-norm least squares or ridge. SIMPLIFIED, illustrative toy
	// model (1-D input, n = 20) standing in for the deep-learning experiments of
	// Nakkiran et al. (2020), which cannot be run in a browser. Extension beyond
	// course_sources/.
	//
	// Test MSE is reported as a MEDIAN over repetitions: near N = n the mean is
	// dominated by a few near-singular draws (heavy tail), see the module doc.
	// The displayed fit is clipped to [-3, 3] so the chart stays readable.
	//
	// PERFORMANCE: ~24 widths × 15 repetitions, each fit an n×N feature matrix
	// plus a 201-point evaluation grid — a few tens of ms per λ change.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import {
		fitRandomFeatures,
		rfTarget,
		rfTrainingSet,
		sampleRandomFeatures,
		simulateRandomFeaturesDoubleDescent
	} from '$lib/math/double-descent';
	import { combineSeed, linspace } from '$lib/math/util';

	const N_TRAIN = 20;
	const NOISE = 0.3;
	const REPETITIONS = 15;
	const SEED = 1;
	const N_GRID = [
		2, 4, 6, 8, 10, 12, 14, 16, 18, 19, 20, 21, 22, 24, 27, 30, 35, 40, 50, 60, 80, 100, 130, 160
	];
	const CLIP = 3;

	let lambda = $state(0);
	let width = $state(20);

	const curve = $derived(
		simulateRandomFeaturesDoubleDescent({
			n: N_TRAIN,
			NGrid: N_GRID,
			noiseStd: NOISE,
			lambda,
			repetitions: REPETITIONS,
			seed: SEED
		})
	);
	const testPts = $derived(curve.map((c): [number, number] => [c.N, c.testMSEMedian]));
	const trainPts = $derived(curve.map((c): [number, number] => [c.N, c.trainMSE]));

	const train = rfTrainingSet(N_TRAIN, NOISE, combineSeed(SEED, 0));
	const fit = $derived(
		fitRandomFeatures(
			train.x,
			train.y,
			sampleRandomFeatures(width, combineSeed(SEED + 1, 0)),
			lambda
		)
	);
	const fitPts = $derived(
		fit.grid.map((x, i): [number, number] => [x, Math.max(-CLIP, Math.min(CLIP, fit.fitted[i]))])
	);
	const targetPts = linspace(-1, 1, 201).map((x): [number, number] => [x, rfTarget(x)]);
	const trainDots = train.x.map((x, i) => ({
		x,
		y: train.y[i],
		r: 3.5,
		fill: 'var(--color-belief)'
	}));

	const peak = $derived(curve.find((c) => c.N === N_TRAIN));
	const widest = $derived(curve[curve.length - 1]);
	const bestUnder = $derived(
		curve.filter((c) => c.N < N_TRAIN).reduce((b, c) => (c.testMSEMedian < b.testMSEMedian ? c : b))
	);
</script>

<div class="picker">
	<span class="picker-label">Pénalité sur la couche de sortie λ :</span>
	<RadioButton value={0} label="0 (norme min.)" bind:groupValue={lambda} />
	<RadioButton value={0.0001} label="10⁻⁴" bind:groupValue={lambda} />
	<RadioButton value={0.01} label="10⁻²" bind:groupValue={lambda} />
</div>

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={240}
		yScaleType="log"
		yDomain={[1e-3, 20]}
		yAxis={true}
		xDomain={[1, 160]}
		curves={[
			{ points: testPts, stroke: 'var(--color-surprise)', strokeWidth: 2.5 },
			{ points: trainPts, stroke: 'var(--color-belief)', strokeWidth: 2, strokeDasharray: '5 3' }
		]}
		curveDots={[
			{
				x: width,
				y: Math.max(
					1e-3,
					Math.min(20, curve.find((c) => c.N === width)?.testMSEMedian ?? fit.testMSE)
				),
				r: 5,
				fill: 'var(--color-agent)'
			}
		]}
		vlines={[{ x: N_TRAIN, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'N = n' }]}
		legend={[
			{ label: 'erreur de test (médiane)', color: 'var(--color-surprise)' },
			{
				label: 'erreur d’entraînement (moyenne)',
				color: 'var(--color-belief)',
				kind: 'dashed-line'
			}
		]}
	/>
	{#snippet caption()}
		Réseau à deux couches <KatexInline
			formula={String.raw`f(x) = \sum_{k=1}^{N} a_k\, \max(0, w_k x + b_k)`}
		/> dont la première couche <KatexInline formula={String.raw`(w_k, b_k)`} /> est tirée au hasard puis
		figée ; seule la couche de sortie <KatexInline formula="a" /> est apprise. Cible
		<KatexInline formula={String.raw`\sin(\pi x)`} />, <KatexInline formula="n = 20" /> points bruités
		(écart-type 0,3), erreur de test quadratique par rapport à la cible non bruitée, médiane sur
		{REPETITIONS} tirages seedés (données et poids figés). Jouet unidimensionnel : il reproduit la forme
		de la courbe en largeur, pas les performances d'un vrai réseau entraîné.
	{/snippet}
</Figure>

<Slider
	min={2}
	max={160}
	step={1}
	bind:value={width}
	label="Largeur N (nombre de neurones cachés)"
/>

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={220}
		yAxis={true}
		xDomain={[-1, 1]}
		yDomain={[-CLIP, CLIP]}
		curves={[
			{
				points: targetPts,
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1.5,
				strokeDasharray: '4 3'
			},
			{ points: fitPts, stroke: 'var(--color-agent)', strokeWidth: 2 }
		]}
		curveDots={trainDots}
		chartLabel={`N = ${width}`}
		legend={[
			{ label: 'cible sin(πx)', color: 'var(--color-text-muted)', kind: 'dashed-line' },
			{ label: 'réseau ajusté', color: 'var(--color-agent)' }
		]}
	/>
	{#snippet caption()}
		Fonction apprise pour un tirage (affichage tronqué à ±{CLIP}). Près de <KatexInline
			formula="N = n"
		/>, l'unique interpolant disponible oscille violemment entre les points ; loin au-delà, la
		solution de norme minimale parmi une infinité d'interpolants est bien plus régulière.
	{/snippet}
</Figure>

<Metrics align="left">
	<div class="cell">
		<span class="label">Meilleur N &lt; n</span>
		<span class="value">N = {bestUnder.N} : {bestUnder.testMSEMedian.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">N = n = {N_TRAIN}</span>
		<span class="value">{peak ? peak.testMSEMedian.toFixed(3) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">N = {widest.N}</span>
		<span class="value">{widest.testMSEMedian.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Ce tirage, N = {width}</span>
		<span class="value">{fit.testMSE.toExponential(2)}</span>
	</div>
</Metrics>

<style>
	.picker {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.picker-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
