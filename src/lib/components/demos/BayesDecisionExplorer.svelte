<script lang="ts">
	// Part IV — Optimum de Bayes — Théorème 1.1 (Classifieur de Bayes)
	//
	// r(0, x) = eta(x), r(1, x) = 1 - eta(x); h*(x) = 1 iff eta(x) >= 1/2.
	// All math comes from $lib/math/bayes-learning — nothing computed inline.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';

	import { conditionalRisk, bayesAction, bayesConditionalRisk } from '$lib/math/bayes-learning';
	import { linspace } from '$lib/math/util';

	let eta = $state(0.5);

	// Fixed grid for the two risk curves r(0,·) and r(1,·) over eta in [0,1].
	const grid = linspace(0, 1, 101);

	const r0Points = $derived(grid.map((e): [number, number] => [e, conditionalRisk(0, e)]));
	const r1Points = $derived(grid.map((e): [number, number] => [e, conditionalRisk(1, e)]));

	// Current slider position, projected onto each curve.
	const r0AtEta = $derived(conditionalRisk(0, eta));
	const r1AtEta = $derived(conditionalRisk(1, eta));

	const action = $derived(bayesAction(eta)); // 0 | 1, per Théorème 1.1
	const bayesRiskAtEta = $derived(bayesConditionalRisk(eta));
</script>

<Figure type="chart">
	<CurveChart
		curves={[
			{ points: r0Points, stroke: 'var(--color-belief)', strokeWidth: 2 },
			{ points: r1Points, stroke: 'var(--color-surprise)', strokeWidth: 2 }
		]}
		xDomain={[0, 1]}
		yDomain={[0, 1]}
		yAxis={true}
		vlines={[
			{
				x: 0.5,
				stroke: 'var(--color-text-muted)',
				strokeDasharray: '4 4',
				label: '1/2'
			}
		]}
		curveDots={[
			{ x: eta, y: r0AtEta, fill: 'var(--color-belief)' },
			{ x: eta, y: r1AtEta, fill: 'var(--color-surprise)' }
		]}
		legend={[
			{ label: 'r(0, x) = η(x)', color: 'var(--color-belief)' },
			{ label: 'r(1, x) = 1 − η(x)', color: 'var(--color-surprise)' }
		]}
	/>

	{#snippet caption()}
		Risque conditionnel des deux actions possibles en fonction de η(x) = P(Y=1|X=x). L'action
		optimale bascule au croisement η(x) = 1/2 (Théorème 1.1) : prédire 1 minimise le risque
		conditionnel dès que η(x) dépasse ce seuil.
	{/snippet}
</Figure>

<Slider min={0} max={1} step={0.01} bind:value={eta} label="η(x)" />

<p class="verdict" aria-live="polite">
	Action optimale pour η(x) = {eta.toFixed(2)} :
	<strong>{action === 1 ? 'prédire ŷ = 1' : 'prédire ŷ = 0'}</strong>
	— risque conditionnel de Bayes r* = min(η, 1−η) = {bayesRiskAtEta.toFixed(3)}
	(contre {(action === 1 ? r0AtEta : r1AtEta).toFixed(3)} pour l'action non retenue).
</p>

<style>
	.verdict {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.verdict strong {
		color: var(--color-belief);
	}
</style>
