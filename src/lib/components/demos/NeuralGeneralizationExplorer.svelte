<script lang="ts">
	// Part VI — VC theory limits for neural networks.
	//
	// The VC-vs-norm comparison below stays a hand-rolled SVG: BarChart.svelte
	// exists but is linear-scale ([0, yMax], bars anchored at the baseline)
	// and cannot show a bound *below* 1 on a log10 axis with a "bound = 1"
	// threshold in the middle of the plot. The SVG is responsive — the
	// viewBox width tracks the measured container width (same pattern as
	// GradientBoostingDemo.svelte and BarChart.svelte) — so it fills the
	// figure without being stretched.

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

	// Measured figure width. LineChart draws its coordinate system at this
	// exact size (it has no viewBox, so width must match the rendered box);
	// the bar comparison uses it as its viewBox width.
	let containerWidth = $state(0);
	const chartWidth = $derived(containerWidth);
	const chartHeight = $derived(Math.round(containerWidth * 0.5));

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

	// ─── Responsive log-scale bar comparison at the CURRENT settings ─────────
	// The two bounds span roughly 10^-17 to 10^10 across the slider range, so
	// they are compared on a log10 axis with a "bound = 1" threshold: below it
	// the bound is informative, above it the bound is trivial (the risk is
	// bounded by 1 anyway).
	const BAR_HEIGHT = 170;
	const BAR_PAD = { top: 18, right: 16, bottom: 28, left: 44 };
	const LOG_MIN = -6;
	const LOG_MAX = 10;
	const LOG_TICKS = [-6, -4, -2, 0, 2, 4, 6, 8, 10];

	const barVBW = $derived(containerWidth || 560);
	const barPlotW = $derived(barVBW - BAR_PAD.left - BAR_PAD.right);
	const barPlotH = BAR_HEIGHT - BAR_PAD.top - BAR_PAD.bottom;
	const barSlotW = $derived(barPlotW / 2);
	const barW = $derived(Math.min(80, barSlotW * 0.58));
	const barBaseline = BAR_HEIGHT - BAR_PAD.bottom;

	function valueLog(value: number): number {
		return Math.log10(Math.max(value, 1e-300));
	}
	function clampLog(value: number): number {
		return Math.min(LOG_MAX, Math.max(LOG_MIN, valueLog(value)));
	}
	function logY(log: number): number {
		return BAR_PAD.top + ((LOG_MAX - log) / (LOG_MAX - LOG_MIN)) * barPlotH;
	}
	function barY(value: number): number {
		return logY(clampLog(value));
	}
	function barX(i: number): number {
		return BAR_PAD.left + i * barSlotW + (barSlotW - barW) / 2;
	}
	function barMidX(i: number): number {
		return BAR_PAD.left + (i + 0.5) * barSlotW;
	}
	function fmtExp(value: number): string {
		return value.toExponential(1);
	}

	const bars = $derived([
		{ value: vcBound, color: 'var(--color-belief)', label: 'VC' },
		{ value: normBound, color: 'var(--color-surprise)', label: 'Normes' }
	]);
</script>

<div class="disclaimer">
	Cette démonstration est <strong>illustrative</strong>, pas une simulation d'un vrai réseau de
	neurones. Le nombre de paramètres est une estimation grossière (profondeur × largeur²), et la
	borne fondée sur les normes suppose la même norme à chaque couche — un vrai réseau a des normes
	différentes par couche. Les ordres de grandeur relatifs comptent ici, pas les valeurs exactes.
</div>

<Figure type="chart" bind:containerWidth>
	{#if containerWidth > 0}
		<LineChart
			series={[
				{ values: vcSeries, color: 'var(--color-belief)', label: 'VC' },
				{ values: normSeries, color: 'var(--color-surprise)', label: 'Normes' }
			]}
			xLabel="profondeur L (1 à la valeur actuelle)"
			yLabel="borne indicative"
			width={chartWidth}
			height={chartHeight}
		/>
	{/if}

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

<Figure type="chart" bind:containerWidth>
	{#if containerWidth > 0}
		<svg
			viewBox={`0 0 ${barVBW} ${BAR_HEIGHT}`}
			width="100%"
			role="img"
			aria-label="Comparaison des bornes VC et fondée sur les normes, échelle log10"
		>
			<!-- Y grid lines + 10^k tick labels -->
			{#each LOG_TICKS as tick (tick)}
				{@const ty = logY(tick)}
				<line
					x1={BAR_PAD.left}
					y1={ty}
					x2={barVBW - BAR_PAD.right}
					y2={ty}
					stroke="var(--color-border)"
					stroke-width="0.5"
					opacity="0.6"
				/>
				<text
					x={BAR_PAD.left - 6}
					y={ty}
					text-anchor="end"
					dominant-baseline="middle"
					font-size="9"
					font-family="var(--font-mono)"
					fill="var(--color-text-muted)"
				>
					10<tspan dy="-3" font-size="7">{tick}</tspan>
				</text>
			{/each}

			<!-- Left axis + baseline -->
			<line
				x1={BAR_PAD.left}
				y1={BAR_PAD.top}
				x2={BAR_PAD.left}
				y2={barBaseline}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<line
				x1={BAR_PAD.left}
				y1={barBaseline}
				x2={barVBW - BAR_PAD.right}
				y2={barBaseline}
				stroke="var(--color-border)"
				stroke-width="1"
			/>

			<!-- "bound = 1" threshold (vacuous bound level) -->
			<line
				x1={BAR_PAD.left}
				y1={logY(0)}
				x2={barVBW - BAR_PAD.right}
				y2={logY(0)}
				stroke="var(--color-text-muted)"
				stroke-width="1"
				stroke-dasharray="3 3"
			/>
			{#if barVBW >= 560}
				<text
					x={barVBW - BAR_PAD.right}
					y={logY(0) - 4}
					text-anchor="end"
					font-size="9"
					fill="var(--color-text-muted)"
				>
					borne = 1 (triviale)
				</text>
			{/if}

			<!-- Bars: value annotation above, category label below -->
			{#each bars as bar, i (bar.label)}
				{@const top = barY(bar.value)}
				{@const log = valueLog(bar.value)}
				<rect
					x={barX(i)}
					y={top}
					width={barW}
					height={Math.max(2, barBaseline - top)}
					fill={bar.color}
					opacity="0.8"
				/>
				<text
					x={barMidX(i)}
					y={Math.max(top - 6, 10)}
					text-anchor="middle"
					font-size="10"
					font-family="var(--font-mono)"
					fill={bar.color}
				>
					{fmtExp(bar.value)}{log > LOG_MAX ? ' ↑' : log < LOG_MIN ? ' ↓' : ''}
				</text>
				<text
					x={barMidX(i)}
					y={barBaseline + 16}
					text-anchor="middle"
					font-size="10"
					fill="var(--color-text)"
				>
					{bar.label}
				</text>
			{/each}
		</svg>
	{/if}

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
