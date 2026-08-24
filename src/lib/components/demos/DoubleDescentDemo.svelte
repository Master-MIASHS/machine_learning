<script lang="ts">
	// Part VI — Limites de la théorie VC : le paradoxe de la double descente
	// (theorie.typ's pseudo-inverse linear regression figure).
	//
	// PERFORMANCE: doubleDescentCurve costs O(repetitions * min(n,d)^3) per
	// grid point, and the whole point of this demo is sweeping d on a slider
	// — so the full curve recomputes on every tick. Parameters below are kept
	// conservative on purpose (d capped at 50, matching theorie.typ's own
	// example; modest repetitions/grid size/testSize) to stay interactive. If
	// it still feels sluggish, reduce REPETITIONS or the grid point count
	// first — those are far cheaper levers than lowering d's range, which is
	// the one number tied to matching the course figure.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import { doubleDescentCurve } from '$lib/math/generalization';
	import { linspace } from '$lib/math/util'; // TODO: confirm path

	const NOISE_STD = 1; // matches theorie.typ's irreducible risk sigma^2 = 1
	const REPETITIONS = 8;
	const TEST_SIZE = 150;
	const SEED = 42;
	const GRID_POINTS = 20;

	let d = $state(30);

	// Grid spans [0.2d, 3d] log-spaced, with d itself forced in — so the
	// interpolation threshold always has an exact (not interpolated) charted
	// value, wherever the slider currently sits.
	const nGrid = $derived.by(() => {
		const nMin = Math.max(2, Math.round(d * 0.2));
		const nMax = Math.round(d * 3);
		const raw = linspace(Math.log(nMin), Math.log(nMax), GRID_POINTS).map((v) =>
			Math.round(Math.exp(v))
		);
		return Array.from(new Set([...raw, d])).sort((a, b) => a - b);
	});

	const curve = $derived(doubleDescentCurve(nGrid, d, REPETITIONS, NOISE_STD, TEST_SIZE, SEED));

	const trainPoints = $derived(curve.map((p): [number, number] => [p.n, p.trainRisk]));
	const testPoints = $derived(curve.map((p): [number, number] => [p.n, p.testRisk]));
	const noiseFloorPoints = $derived([
		[nGrid[0], NOISE_STD ** 2],
		[nGrid[nGrid.length - 1], NOISE_STD ** 2]
	] as [number, number][]);

	const atThreshold = $derived(curve.find((p) => p.n === d));
	const atLargestN = $derived(curve[curve.length - 1]);
</script>

<Figure type="chart">
	<CurveChart
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
		xDomain={[nGrid[0], nGrid[nGrid.length - 1]]}
		yAxis={true}
		vlines={[
			{
				x: d,
				stroke: 'var(--color-text)',
				strokeDasharray: '4 4',
				label: "seuil d'interpolation n=d"
			}
		]}
		legend={[
			{ label: 'risque train', color: 'var(--color-belief)' },
			{ label: 'risque test', color: 'var(--color-surprise)' },
			{ label: 'bruit irréductible σ²', color: 'var(--color-text-muted)', kind: 'dashed-line' }
		]}
	/>

	{#snippet caption()}
		Régression linéaire par pseudo-inverse, d = {d} paramètres, moyennée sur {REPETITIONS}
		répétitions. Sous-paramétré (n ≪ d) : la courbe en U classique du compromis biais-variance. Au seuil
		n=d : interpolation exacte (risque train ≈ 0) mais système presque singulier — le risque test explose.
		Sur-paramétré (n ≫ d) : le risque test redescend et converge vers le bruit irréductible σ². Ce dernier
		régime est ce que la théorie VC classique n'explique pas.
	{/snippet}
</Figure>

<Slider min={10} max={50} step={1} bind:value={d} label="Nombre de paramètres d" />

<Metrics align="left">
	<div class="cell">
		<span class="label">Risque test au seuil (n=d)</span>
		<span class="value">{atThreshold ? atThreshold.testRisk.toFixed(3) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">Risque train au seuil (n=d)</span>
		<span class="value">{atThreshold ? atThreshold.trainRisk.toFixed(4) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">Risque test, n={atLargestN.n} (sur-paramétré)</span>
		<span class="value">{atLargestN.testRisk.toFixed(3)}</span>
	</div>
</Metrics>
