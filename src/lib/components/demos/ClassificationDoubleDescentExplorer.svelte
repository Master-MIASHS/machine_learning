<script lang="ts">
	// Part V, expert lesson /part5/double-descente — double descent for a linear CLASSIFIER, 0-1 loss.
	// Least-squares fit of ±1 labels (min-norm or ridge), test error exact
	// given ŵ (angle formula), seeded training sets (simulateClassificationDoubleDescent;
	// SIMPLIFIED spiked model: 5 informative coordinates, 195 low-variance junk ones).
	// For this square-loss classifier Kini & Thrampoulidis (ISIT 2020) show the
	// test error → 1/2 at p/n → 1; Cover (1965) gives the separability capacity
	// 2p = n for random labels. Extension beyond course_sources/.
	//
	// PERFORMANCE: ~25 grid points × 20 repetitions, each drawing a 40×200
	// Gaussian matrix and solving a ≤ 40×40 system: ~0.2 s per control change.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import {
		coverSeparabilityProbability,
		simulateClassificationDoubleDescent
	} from '$lib/math/double-descent';

	const N = 40;
	const D = 200;
	const REPETITIONS = 20;
	const SEED = 5;
	const P_GRID = [
		1, 3, 5, 8, 12, 16, 20, 25, 30, 34, 37, 39, 40, 41, 43, 46, 50, 60, 70, 85, 100, 120, 150, 175,
		200
	];

	let eta = $state(0);
	let lambda = $state(0);

	const sim = $derived(
		simulateClassificationDoubleDescent({
			n: N,
			pGrid: P_GRID,
			D,
			eta,
			lambda,
			repetitions: REPETITIONS,
			seed: SEED
		})
	);
	const testPts = $derived(sim.map((s): [number, number] => [s.p, s.testError]));
	const trainPts = $derived(sim.map((s): [number, number] => [s.p, s.trainError]));

	const coverCurve = Array.from({ length: 100 }, (_, i) => i + 1).map((p): [number, number] => [
		p,
		coverSeparabilityProbability(N, p)
	]);

	const atThreshold = $derived(sim.find((s) => s.p === N));
	const bestUnder = $derived(
		sim.filter((s) => s.p < N).reduce((b, s) => (s.testError < b.testError ? s : b))
	);
	const atD = $derived(sim[sim.length - 1]);
</script>

<div class="pickers">
	<div class="picker">
		<span class="picker-label">Bruit d'étiquettes η :</span>
		<RadioButton value={0} label="0 %" bind:groupValue={eta} />
		<RadioButton value={0.1} label="10 %" bind:groupValue={eta} />
		<RadioButton value={0.2} label="20 %" bind:groupValue={eta} />
	</div>
	<div class="picker">
		<span class="picker-label">Ridge λ :</span>
		<RadioButton value={0} label="0 (norme min.)" bind:groupValue={lambda} />
		<RadioButton value={0.05} label="0,05" bind:groupValue={lambda} />
		<RadioButton value={0.5} label="0,5" bind:groupValue={lambda} />
	</div>
</div>

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={250}
		yAxis={true}
		xDomain={[1, D]}
		yDomain={[0, 0.55]}
		curves={[
			{ points: testPts, stroke: 'var(--color-surprise)', strokeWidth: 2.5 },
			{ points: trainPts, stroke: 'var(--color-belief)', strokeWidth: 2, strokeDasharray: '5 3' },
			{
				points: [
					[1, eta],
					[D, eta]
				],
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1,
				strokeDasharray: '2 2'
			},
			{
				points: [
					[1, 0.5],
					[D, 0.5]
				],
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1,
				opacity: 0.5
			}
		]}
		vlines={[
			{ x: N, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'p = n' },
			{
				x: 5,
				stroke: 'var(--color-positive)',
				strokeDasharray: '2 3',
				label: 'signal',
				labelOffset: 12
			}
		]}
		legend={[
			{ label: 'erreur 0-1 de test', color: 'var(--color-surprise)' },
			{ label: 'erreur 0-1 d’entraînement', color: 'var(--color-belief)', kind: 'dashed-line' },
			{
				label: 'niveau de bruit η (erreur de Bayes)',
				color: 'var(--color-text-muted)',
				kind: 'dashed-line'
			}
		]}
	/>
	{#snippet caption()}
		Classifieur <KatexInline formula={String.raw`x \mapsto \operatorname{sign}(x^\top \hat w)`} /> où
		<KatexInline formula={String.raw`\hat w`} /> ajuste les étiquettes <KatexInline
			formula={String.raw`\pm 1`}
		/>
		par moindres carrés (norme minimale si λ = 0) sur les <KatexInline formula="p" /> premières des
		<KatexInline formula="D = 200" /> variables gaussiennes, avec <KatexInline formula="n = 40" />.
		Les 5 premières variables (variance 1) portent tout le signal, l'étiquette valant
		<KatexInline formula={String.raw`\operatorname{sign}(x_1 + \dots + x_5)`} /> ; les 195 suivantes sont
		non informatives et de faible variance (0,02). Une fraction η des étiquettes est inversée. L'erreur
		de test est calculée exactement à partir de l'angle entre
		<KatexInline formula={String.raw`\hat w`} /> et <KatexInline formula={String.raw`\beta`} /> dans la
		géométrie de la covariance, moyennée sur {REPETITIONS} échantillons seedés. Petit problème synthétique,
		illustration et non benchmark.
	{/snippet}
</Figure>

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={160}
		yAxis={true}
		xDomain={[1, 100]}
		yDomain={[0, 1.05]}
		curves={[{ points: coverCurve, stroke: 'var(--color-agent)', strokeWidth: 2 }]}
		vlines={[
			{ x: N / 2, stroke: 'var(--color-agent)', strokeDasharray: '2 3', label: 'P = 1/2' },
			{ x: N, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'p = n' }
		]}
		legend={[
			{
				label: 'P(n = 40 points d’étiquettes aléatoires linéairement séparables)',
				color: 'var(--color-agent)'
			}
		]}
	/>
	{#snippet caption()}
		Théorème de Cover (1965) : probabilité que <KatexInline formula="n = 40" /> points en position générale
		de <KatexInline formula={String.raw`\mathbb R^p`} />, munis d'étiquettes aléatoires, soient
		séparables par un hyperplan passant par l'origine. Elle vaut exactement 1/2 en <KatexInline
			formula="n = 2p"
		/>. Pour un classifieur à marge maximale (ou la régression logistique), c'est la transition de
		séparabilité — et non <KatexInline formula="p = n" /> — qui joue le rôle de seuil d'interpolation
		; avec des étiquettes informatives, elle survient même avant
		<KatexInline formula="p = n/2" /> (Candès &amp; Sur, 2020).
	{/snippet}
</Figure>

<Metrics align="left">
	<div class="cell">
		<span class="label">Meilleur p &lt; n</span>
		<span class="value">p = {bestUnder.p} : {bestUnder.testError.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Seuil p = n</span>
		<span class="value">{atThreshold ? atThreshold.testError.toFixed(3) : '—'}</span>
	</div>
	<div class="cell">
		<span class="label">p = D = {D}</span>
		<span class="value">{atD.testError.toFixed(3)}</span>
	</div>
</Metrics>

<style>
	.pickers {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	.picker {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.picker-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
