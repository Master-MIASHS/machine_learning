<script lang="ts">
	// Part VI — Limites de la théorie VC pour les réseaux de neurones.
	//
	// NOTE: no bar-chart component was available, so the VC-vs-norm
	// comparison below is hand-drawn SVG bars (log10-scaled, since the two
	// bounds can differ by many orders of magnitude — a linear scale would
	// make one invisible). Same fallback approach as earlier hand-rolled
	// visualizations in this project.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		estimateParameterCount,
		neuralVCDimEstimate,
		neuralVCGeneralizationEstimate,
		neuralNormBasedEstimate
	} from '$lib/math/generalization';

	let depth = $state(6);
	let width = $state(64);
	let weightNorm = $state(1);
	let n = $state(10000);

	const paramCount = $derived(estimateParameterCount(depth, width));
	const vcDimEstimate = $derived(neuralVCDimEstimate(paramCount, depth));
	const vcBound = $derived(neuralVCGeneralizationEstimate(vcDimEstimate, n));
	const normBound = $derived(neuralNormBasedEstimate(depth, weightNorm, n));

	const interpolationPossible = $derived(paramCount > n);

	// Sweep depth (1..current depth) at the current width/weightNorm/n, so
	// the rightmost point of each line is always "now" — no separate marker
	// needed, unlike CurveChart-based demos.
	const depthSweep = $derived(Array.from({ length: depth }, (_, i) => i + 1));
	const vcSeries = $derived(
		depthSweep.map((L) => {
			const w = estimateParameterCount(L, width);
			return neuralVCGeneralizationEstimate(neuralVCDimEstimate(w, L), n);
		})
	);
	const normSeries = $derived(depthSweep.map((L) => neuralNormBasedEstimate(L, weightNorm, n)));

	// ─── Hand-drawn log-scale bar comparison at the CURRENT settings ────────
	const BAR_WIDTH = 260;
	const BAR_HEIGHT = 160;
	const BAR_PAD = { top: 10, right: 16, bottom: 24, left: 40 };
	const LOG_MIN = -4;
	const LOG_MAX = 8;

	function clampLog(value: number): number {
		const log = Math.log10(Math.max(value, 1e-300));
		return Math.min(LOG_MAX, Math.max(LOG_MIN, log));
	}
	function barY(value: number): number {
		const clamped = clampLog(value);
		return (
			BAR_PAD.top +
			((LOG_MAX - clamped) / (LOG_MAX - LOG_MIN)) * (BAR_HEIGHT - BAR_PAD.top - BAR_PAD.bottom)
		);
	}
	const barBaseline = BAR_HEIGHT - BAR_PAD.bottom;
	const zeroLine = $derived(barY(1)); // log10(1) = 0 — the "bound = 1" (vacuous) threshold
</script>

<div class="disclaimer">
	Cette démonstration est <strong>illustrative</strong>, pas une simulation d'un vrai réseau de
	neurones. Le nombre de paramètres est une estimation grossière (profondeur × largeur²), et la
	borne fondée sur les normes suppose la même norme à chaque couche — un vrai réseau a des normes
	différentes par couche. Les ordres de grandeur relatifs comptent ici, pas les valeurs exactes.
</div>

<Figure type="chart">
	<LineChart
		series={[
			{ values: vcSeries, color: 'var(--color-belief)', label: 'borne VC (Bartlett 1998)' },
			{
				values: normSeries,
				color: 'var(--color-surprise)',
				label: 'borne fondée sur les normes (BFT 2017)'
			}
		]}
		xLabel="profondeur L (1 à la valeur actuelle)"
		yLabel="borne indicative"
	/>

	{#snippet caption()}
		Les deux bornes en fonction de la profondeur, à largeur / norme des poids / n fixées au réglage
		actuel (le point le plus à droite). La borne VC croît sans limite avec la profondeur ; la borne
		fondée sur les normes dépend surtout de la norme des poids — décroissante si celle-ci reste sous
		1, explosive sinon.
	{/snippet}
</Figure>

<Slider min={1} max={30} step={1} bind:value={depth} label="Profondeur (couches L)" />
<Slider
	min={4}
	max={512}
	step={4}
	logarithmic={true}
	bind:value={width}
	label="Largeur (par couche)"
/>
<Slider
	min={0.3}
	max={2}
	step={0.05}
	bind:value={weightNorm}
	label="Norme des poids (par couche, uniforme)"
/>
<Slider
	min={100}
	max={1000000}
	step={1}
	logarithmic={true}
	bind:value={n}
	label="Taille d'échantillon n"
/>

<Figure type="chart">
	<svg
		viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`}
		width="100%"
		height={BAR_HEIGHT}
		role="img"
		aria-label="Comparaison des deux bornes, échelle log10"
	>
		<line
			x1={BAR_PAD.left}
			y1={zeroLine}
			x2={BAR_WIDTH - BAR_PAD.right}
			y2={zeroLine}
			stroke="var(--color-text-muted)"
			stroke-width="1"
			stroke-dasharray="3 3"
		/>
		<text
			x={BAR_WIDTH - BAR_PAD.right}
			y={zeroLine - 3}
			text-anchor="end"
			font-size="9"
			fill="var(--color-text-muted)"
		>
			borne = 1 (triviale)
		</text>

		<rect
			x={BAR_PAD.left + 20}
			y={barY(vcBound)}
			width={60}
			height={barBaseline - barY(vcBound)}
			fill="var(--color-belief)"
			opacity="0.8"
		/>
		<text
			x={BAR_PAD.left + 50}
			y={barBaseline + 14}
			text-anchor="middle"
			font-size="9"
			fill="var(--color-text)">VC</text
		>

		<rect
			x={BAR_PAD.left + 140}
			y={barY(normBound)}
			width={60}
			height={barBaseline - barY(normBound)}
			fill="var(--color-surprise)"
			opacity="0.8"
		/>
		<text
			x={BAR_PAD.left + 170}
			y={barBaseline + 14}
			text-anchor="middle"
			font-size="9"
			fill="var(--color-text)">Normes</text
		>

		<line
			x1={BAR_PAD.left}
			y1={barBaseline}
			x2={BAR_WIDTH - BAR_PAD.right}
			y2={barBaseline}
			stroke="var(--color-border)"
			stroke-width="1"
		/>
	</svg>

	{#snippet caption()}
		Comparaison en échelle log₁₀ (les deux bornes peuvent différer de plusieurs ordres de grandeur).
		Sous la ligne pointillée : borne informative. Au-dessus : borne triviale (≥ 1), aussi vraie
		qu'inutile puisque le risque lui-même est borné par 1.
	{/snippet}
</Figure>

<Metrics align="left">
	<div class="cell">
		<span class="label">Paramètres estimés (W)</span>
		<span class="value">{paramCount.toExponential(2)}</span>
	</div>
	<div class="cell">
		<span class="label">Borne VC</span>
		<span class="value">{vcBound >= 1000 ? vcBound.toExponential(2) : vcBound.toFixed(2)}</span>
	</div>
	<div class="cell">
		<span class="label">Borne fondée sur les normes</span>
		<span class="value"
			>{normBound >= 1000 ? normBound.toExponential(2) : normBound.toFixed(4)}</span
		>
	</div>
	<div class="cell">
		<span class="label">Régime interpolant (W &gt; n) ?</span>
		<span class="value">{interpolationPossible ? 'Oui' : 'Non'}</span>
	</div>
</Metrics>

<style>
	.disclaimer {
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 6px);
		background: var(--color-surface-2);
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
</style>
