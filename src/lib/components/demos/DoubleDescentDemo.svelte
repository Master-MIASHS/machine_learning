<script lang="ts">
	// Part VI — Limites de la théorie VC : le paradoxe de la double descente
	// ("complexity" viewpoint, as defined in theorie.typ: risk vs. number of
	// parameters d at fixed n — the classic bias-variance framing, with the
	// interpolation threshold spike at d = n).
	//
	// PERFORMANCE: doubleDescentComplexityCurve costs
	// O(repetitions * (n + testSize) * D + min(n,d)^3) per grid point, where
	// D = 3n is the ground-truth dimension, and the full curve recomputes on
	// every slider tick. Parameters below are kept conservative on purpose
	// (n capped at 20; modest repetitions/grid size/testSize) to stay
	// interactive. If it still feels sluggish, reduce REPETITIONS or
	// TEST_SIZE first.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SelectOption from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import { doubleDescentComplexityCurve } from '$lib/math/generalization';
	import { linspace } from '$lib/math/util';
	import KatexInline from '../narrative/KatexInline.svelte';

	const NOISE_STD = 1; // matches theorie.typ's irreducible risk sigma^2 = 1
	const REPETITIONS = 8;
	const TEST_SIZE = 150;
	const SEED = 42;
	const GRID_POINTS = 20;
	const TRUTH_NORM = 1; // E||beta||^2 of the dense ground truth; kept
	// comparable to the noise (sigma^2 = 1) so that the second descent settles
	// just above the noise floor at d = 3n (residual min-norm bias^2
	// (1 - n/d)^2 ||beta||^2) instead of far above it.

	let n = $state(15);

	// The risks span several decades (train risk ≈ 0 at the threshold, test
	// risk ~10–30 there, converging to σ² = 1): log is the informative default.
	let yScaleType = $state<'linear' | 'log'>('log');

	// Grid spans [0.2n, 3n] log-spaced, with n itself forced in — so the
	// interpolation threshold always has an exact (not interpolated) charted
	// value, wherever the slider currently sits. d = 3n is where the model
	// first contains the whole ground truth (which lives in 3n coordinates);
	// the min-norm interpolator's residual bias^2 (1 - n/d)^2 ||beta||^2 then
	// leaves the test risk just above the noise floor at the grid's right
	// edge.
	const dGrid = $derived.by(() => {
		const dMin = Math.max(2, Math.round(n * 0.2));
		const dMax = Math.round(n * 3);
		const raw = linspace(Math.log(dMin), Math.log(dMax), GRID_POINTS).map((v) =>
			Math.round(Math.exp(v))
		);
		return Array.from(new Set([...raw, n])).sort((a, b) => a - b);
	});

	const curve = $derived(
		doubleDescentComplexityCurve(dGrid, n, REPETITIONS, NOISE_STD, TEST_SIZE, TRUTH_NORM, SEED)
	);

	const trainPoints = $derived(curve.map((p): [number, number] => [p.d, p.trainRisk]));
	const testPoints = $derived(curve.map((p): [number, number] => [p.d, p.testRisk]));
	const noiseFloorPoints = $derived([
		[dGrid[0], NOISE_STD ** 2],
		[dGrid[dGrid.length - 1], NOISE_STD ** 2]
	] as [number, number][]);

	const atThreshold = $derived(curve.find((p) => p.d === n));
	const atLargestD = $derived(curve[curve.length - 1]);

	// Log mode gets an explicit domain: the pseudo-inverse interpolates exactly
	// for d >= n (train risk ~1e-29, a floating-point zero), so the generic
	// auto log domain would span ~30 empty decades. The floor 1e-2 clamps those
	// zero values to the bottom of the chart (still visually "≈ 0"), and the
	// ceiling tracks the threshold spike so its magnitude stays visible.
	const peakTestRisk = $derived(Math.max(...curve.map((p) => p.testRisk)));
	const logYDomain = $derived([1e-2, 10 ** Math.ceil(Math.log10(peakTestRisk * 1.5))] as [
		number,
		number
	]);
</script>

<div class="scale-picker">
	<span class="scale-label">Échelle y :</span>
	<SelectOption value="linear" label="lin" bind:groupValue={yScaleType} />
	<SelectOption value="log" label="log" bind:groupValue={yScaleType} />
</div>

<Figure type="chart">
	<!-- curve="linear": the train-risk drop to zero and the test-risk spike
		must land exactly on the d = n threshold; the default B-spline smoothing
		lags sharp changes and would reach the floor only after it. -->
	<CurveChart
		curve="linear"
		{yScaleType}
		yDomain={yScaleType === 'log' ? logYDomain : undefined}
		curves={[
			{ points: trainPoints, stroke: 'var(--color-belief)', strokeWidth: 2 },
			{ points: testPoints, stroke: 'var(--color-surprise)', strokeWidth: 2 },
			{
				points: noiseFloorPoints,
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1,
				strokeDasharray: '2 2',
				opacity: 0.6
			}
		]}
		xDomain={[dGrid[0], dGrid[dGrid.length - 1]]}
		yAxis={true}
		vlines={[
			{
				x: n,
				stroke: 'var(--color-text)',
				strokeDasharray: '4 4',
				label: "seuil d'interpolation d=n"
			}
		]}
		legend={[
			{ label: 'risque train', color: 'var(--color-belief)' },
			{ label: 'risque test', color: 'var(--color-surprise)' },
			{ label: 'bruit irréductible σ²', color: 'var(--color-text-muted)', kind: 'dashed-line' }
		]}
	/>

	{#snippet caption()}
		Régression linéaire par pseudo-inverse, n = {n} observations, moyennée sur {REPETITIONS}
		répétitions. Le paramètre vrai, de carré de norme <KatexInline formula={String.raw`1`} />
		(comparable au bruit <KatexInline formula={String.raw`\sigma^2 = 1`} />), vit dans 3n dimensions
		; le modèle de dimension d n'en utilise que les d premières. Sous-paramétré (<KatexInline
			formula="d< n"
		/>) : compromis biais-variance classique — le biais (part du signal non modélisée) décroît avec
		d, la variance croît. Au seuil d = n : système carré mal conditionné — interpolation exacte
		(risque train ≈ 0) mais le risque test explose. Sur-paramétré (<KatexInline formula="d > n" />)
		: la pseudo-inverse retient la solution de norme minimale ; le risque test redescend vers un
		niveau bas, légèrement au-dessus du bruit irréductible — en d = 3n le modèle contient tout le
		signal, mais la solution de norme minimale ne capture que sa composante dans le sous-espace de
		rang n engendré par les observations (biais résiduel au carré <KatexInline
			formula={String.raw`(1 - n/d)^2\,\|\beta\|^2`}
		/>) — le régime que la théorie VC classique n'explique pas. En échelle logarithmique, le risque
		train ≈ 0 au seuil et la descente après le seuil restent lisibles ; en échelle linéaire, le pic
		du seuil domine le graphique.
	{/snippet}
</Figure>

<Slider min={10} max={20} step={1} bind:value={n} label="Taille de l'échantillon n" />

<Metrics align="left">
	<div class="cell">
		<span class="label">Risque test au seuil (d=n)</span>
		<span class="value">{atThreshold ? atThreshold.testRisk.toFixed(3) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">Risque train au seuil (d=n)</span>
		<span class="value">{atThreshold ? atThreshold.trainRisk.toFixed(4) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">Risque test, d={atLargestD.d} (sur-paramétré)</span>
		<span class="value">{atLargestD.testRisk.toFixed(3)}</span>
	</div>
</Metrics>

<style>
	.scale-picker {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.scale-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
