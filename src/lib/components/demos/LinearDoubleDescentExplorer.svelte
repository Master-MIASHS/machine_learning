<script lang="ts">
	// Part V, expert lesson /part5/double-descente — double descent of minimum-norm least squares.
	// Exact finite-sample curve: Belkin, Hsu & Xu (2020), Theorem 1 (weakFeaturesRisk);
	// Monte-Carlo dots: simulateLinearDoubleDescent (seeded). Extension beyond
	// course_sources/ — theorie.typ only describes the shape of the curve.
	//
	// PERFORMANCE: the Monte-Carlo part costs O(|pGrid| · REPETITIONS · n · D)
	// draws plus one min(n,p)³ solve per fit; with n ≤ 40, D = 3n, ~20 grid
	// points and 20 repetitions it stays well under ~150 ms per slider change.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { simulateLinearDoubleDescent, weakFeaturesRisk } from '$lib/math/double-descent';

	const REPETITIONS = 20;
	const SEED = 7;

	let n = $state(30);
	let r2 = $state(1);
	let sigma2 = $state(0.25);
	let yScaleType = $state<'linear' | 'log'>('log');

	const D = $derived(3 * n);

	// Exact expected test risk for every p (σ² included), split around the
	// threshold n-1 ≤ p ≤ n+1 where it is infinite.
	function theory(p: number): number {
		return weakFeaturesRisk({
			n,
			p,
			signalIn: (r2 * p) / D,
			signalOut: (r2 * (D - p)) / D,
			sigma2
		});
	}
	const underCurve = $derived(
		Array.from({ length: n - 2 }, (_, i) => i + 1).map((p): [number, number] => [p, theory(p)])
	);
	const overCurve = $derived(
		Array.from({ length: D - n - 1 }, (_, i) => n + 2 + i).map((p): [number, number] => [
			p,
			theory(p)
		])
	);

	// Monte-Carlo grid: avoids n-1..n+1 (infinite expectation — the empirical
	// mean there is finite but erratic), plus p = n alone for the metric.
	const pGrid = $derived.by(() => {
		const fractions = [0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.1, 1.2, 1.35, 1.5, 1.75, 2, 2.4, 3];
		const raw = [1, ...fractions.map((f) => Math.round(f * n))];
		return Array.from(new Set(raw))
			.filter((p) => p >= 1 && p <= D && Math.abs(p - n) >= 2)
			.sort((a, b) => a - b);
	});

	const sim = $derived(
		simulateLinearDoubleDescent({
			n,
			pGrid,
			D,
			r2,
			sigma2,
			lambda: 0,
			repetitions: REPETITIONS,
			seed: SEED
		})
	);
	const atThreshold = $derived(
		simulateLinearDoubleDescent({
			n,
			pGrid: [n],
			D,
			r2,
			sigma2,
			lambda: 0,
			repetitions: REPETITIONS,
			seed: SEED
		})[0]
	);

	const trainPoints = $derived(sim.map((s): [number, number] => [s.p, s.trainRisk]));
	const mcDots = $derived(
		sim.map((s) => ({
			x: s.p,
			y: Math.min(s.testRisk, yMax),
			r: 3.5,
			fill: 'var(--color-surprise)'
		}))
	);

	const bestUnder = $derived(underCurve.reduce((b, c) => (c[1] < b[1] ? c : b), underCurve[0]));
	const atD = $derived(theory(D));

	// Display ceiling: the exact curve diverges at the threshold, so the chart
	// is cut at a few times the null risk r² + σ² (value of the empty model).
	const yMax = $derived(Math.max(8 * (r2 + sigma2), 4));
	const clip = (pts: [number, number][]): [number, number][] =>
		pts.map(([x, y]) => [x, Math.min(y, yMax)]);
	const yDomain = $derived(
		(yScaleType === 'log' ? [Math.max(sigma2, 1e-2) / 4, yMax] : [0, yMax]) as [number, number]
	);
</script>

<div class="scale-picker">
	<span class="scale-label">Échelle y :</span>
	<RadioButton value="linear" label="lin" bind:groupValue={yScaleType} />
	<RadioButton value="log" label="log" bind:groupValue={yScaleType} />
</div>

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={260}
		{yScaleType}
		{yDomain}
		yAxis={true}
		xDomain={[1, D]}
		curves={[
			{ points: clip(underCurve), stroke: 'var(--color-surprise)', strokeWidth: 2 },
			{ points: clip(overCurve), stroke: 'var(--color-surprise)', strokeWidth: 2 },
			{
				points: trainPoints,
				stroke: 'var(--color-belief)',
				strokeWidth: 2,
				strokeDasharray: '5 3'
			},
			{
				points: [
					[1, sigma2],
					[D, sigma2]
				],
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1,
				strokeDasharray: '2 2'
			}
		]}
		curveDots={mcDots}
		vlines={[{ x: n, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'p = n' }]}
		legend={[
			{ label: 'risque test exact (espérance)', color: 'var(--color-surprise)' },
			{ label: 'risque train (Monte-Carlo)', color: 'var(--color-belief)', kind: 'dashed-line' },
			{ label: 'bruit σ²', color: 'var(--color-text-muted)', kind: 'dashed-line' }
		]}
	/>
	{#snippet caption()}
		Moindres carrés de norme minimale <KatexInline formula={String.raw`\hat\beta = X_T^{+}y`} /> sur les
		<KatexInline formula="p" /> premières des <KatexInline formula="D = 3n" /> variables gaussiennes ;
		le signal <KatexInline formula={String.raw`\|\beta\|^2 = r^2`} /> est réparti uniformément sur les
		<KatexInline formula="D" /> coordonnées, si bien que les variables non utilisées agissent comme un
		bruit supplémentaire. Courbe pleine : espérance exacte du risque de test (Belkin, Hsu &amp; Xu, 2020),
		infinie pour <KatexInline formula={String.raw`n-1 \le p \le n+1`} /> et coupée en haut du graphique.
		Points : moyennes sur {REPETITIONS} tirages seedés. Petit problème synthétique, illustration de la
		forme de la courbe et non benchmark.
	{/snippet}
</Figure>

<div class="controls">
	<Slider min={20} max={40} step={2} bind:value={n} label="Taille d'échantillon n" />
	<Slider min={0.25} max={4} step={0.25} bind:value={r2} label="Énergie du signal r²" />
	<Slider min={0.05} max={1} step={0.05} bind:value={sigma2} label="Variance du bruit σ²" />
</div>

<Metrics align="left">
	<div class="cell">
		<span class="label">Meilleur p ≤ n − 2</span>
		<span class="value">p = {bestUnder[0]} : {bestUnder[1].toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Seuil p = n (médiane MC)</span>
		<span class="value">{atThreshold.testRiskMedian.toExponential(2)}</span>
	</div>
	<div class="cell">
		<span class="label">p = D = {D} (exact)</span>
		<span class="value">{atD.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Modèle nul r² + σ²</span>
		<span class="value">{(r2 + sigma2).toFixed(3)}</span>
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
	.controls {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
</style>
