<script lang="ts">
	// Part IV — Optimum de Bayes — separability vs. noise, and the Bayes risk
	// R* = E_X[min(eta(X), 1-eta(X))] (Théorème 1.1, remarque).
	//
	// Uses the symmetric-sigmoid toy model from bayes-learning.ts: the boundary
	// (eta(x)=1/2) stays fixed at x=0, only the sharpness of eta around it moves
	// as `temperature` changes — separable (temperature -> 0) vs. noisy
	// (temperature large).
	//
	// NOTE on component choice: the plain LineChart (index-based series, no
	// arbitrary x-domain, no vertical guide lines) can't mark a boundary or a
	// fixed 1/2 threshold cleanly, so this uses CurveChart instead (already
	// verified working in BayesDecisionExplorer.svelte). Swap back to LineChart
	// if you have a reason to prefer it — the data prep below would need to
	// change (values-only arrays, no explicit x).

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		sigmoidEta,
		sigmoidEtaCurve,
		sigmoidBayesBoundary,
		bayesRisk
	} from '$lib/math/bayes-learning';
	import { linspace } from '$lib/math/util';

	// Log slider: small temperature = separable, large = noisy.
	let temperature = $state(0.5);

	const xGrid = linspace(-3, 3, 121);

	const etaPoints = $derived(
		sigmoidEtaCurve(xGrid, temperature).map((p): [number, number] => [p.x, p.eta])
	);

	// Flat reference line at eta = 1/2, spanning the same x-range.
	const thresholdPoints = $derived([
		[xGrid[0], 0.5],
		[xGrid[xGrid.length - 1], 0.5]
	] as [number, number][]);

	const boundary = sigmoidBayesBoundary(); // always 0 for this model

	// Monte-Carlo estimate of R* = E_X[min(eta(X), 1-eta(X))] over the grid,
	// standing in for the marginal of X (implicitly uniform on the grid here).
	const rStar = $derived(bayesRisk(xGrid.map((x) => sigmoidEta(x, temperature))));

	const separabilityLabel = $derived(
		temperature < 0.15 ? 'quasi séparable' : temperature > 2 ? 'très bruité' : 'intermédiaire'
	);
</script>

<Figure type="chart">
	<CurveChart
		curves={[
			{ points: etaPoints, stroke: 'var(--color-belief)', strokeWidth: 2 },
			{
				points: thresholdPoints,
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1,
				strokeDasharray: '2 2',
				opacity: 0.6
			}
		]}
		xDomain={[xGrid[0], xGrid[xGrid.length - 1]]}
		yDomain={[0, 1]}
		yAxis={true}
		vlines={[
			{
				x: boundary,
				stroke: 'var(--color-surprise)',
				strokeDasharray: '4 4',
				label: 'frontière de Bayes'
			}
		]}
		legend={[
			{ label: 'η(x)', color: 'var(--color-belief)' },
			{ label: 'seuil η = 1/2', color: 'var(--color-text-muted)', kind: 'dashed-line' }
		]}
	/>

	{#snippet caption()}
		η(x) pour un modèle sigmoïde symétrique centré en x = 0 : la frontière de décision (où η(x) =
		1/2) reste fixe, seule la pente autour d'elle change avec le niveau de bruit.
	{/snippet}
</Figure>

<Slider
	min={0.02}
	max={5}
	step={0.01}
	logarithmic={true}
	bind:value={temperature}
	label="Niveau de bruit (température)"
/>

<Metrics align="left">
	<div class="cell">
		<span class="label">R* (risque de Bayes)</span>
		<span class="value">{rStar.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Frontière</span>
		<span class="value">x = {boundary}</span>
	</div>
	<div class="cell">
		<span class="label">Régime</span>
		<span class="value">{separabilityLabel}</span>
	</div>
</Metrics>
