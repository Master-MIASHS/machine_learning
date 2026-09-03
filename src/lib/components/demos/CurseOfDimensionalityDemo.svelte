<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import { minMaxDistanceRatio, minMaxDistances, unitCubePoints } from '$lib/math/dimension';

	const SAMPLE_SIZE = 80;
	const SVG_SIZE = 360;
	const PAD = 28;
	const PLOT_SIZE = SVG_SIZE - 2 * PAD;

	let dimension = $state(2);

	const points = $derived(unitCubePoints(dimension, SAMPLE_SIZE, 42));
	const extremes = $derived(minMaxDistances(points));
	const ratio = $derived(minMaxDistanceRatio(points));

	function project(value: number): number {
		return PAD + value * PLOT_SIZE;
	}
</script>

<div class="dimension-demo">
	<div class="controls">
		<Slider bind:value={dimension} min={2} max={50} step={1} label="Dimension d" />
	</div>

	<div class="demo-grid">
		<Figure type="chart">
			<svg
				viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
				role="img"
				aria-label={`Projection des ${SAMPLE_SIZE} points sur les deux premières dimensions, pour d égal à ${dimension}`}
			>
				<rect
					x={PAD}
					y={PAD}
					width={PLOT_SIZE}
					height={PLOT_SIZE}
					fill="var(--color-surface)"
					stroke="var(--color-border)"
				/>
				<line
					x1={PAD}
					y1={PAD + PLOT_SIZE}
					x2={PAD + PLOT_SIZE}
					y2={PAD + PLOT_SIZE}
					stroke="var(--color-border)"
				/>
				<line x1={PAD} y1={PAD} x2={PAD} y2={PAD + PLOT_SIZE} stroke="var(--color-border)" />
				{#each points as point}
					<circle
						cx={project(point[0])}
						cy={PAD + (1 - point[1]) * PLOT_SIZE}
						r="3"
						fill="var(--color-belief)"
						opacity="0.7"
					/>
				{/each}
				<text x={PAD + PLOT_SIZE / 2} y={SVG_SIZE - 5} text-anchor="middle" class="axis-label"
					>dimension 1</text
				>
				<text
					x="10"
					y={PAD + PLOT_SIZE / 2}
					text-anchor="middle"
					transform={`rotate(-90 10 ${PAD + PLOT_SIZE / 2})`}
					class="axis-label">dimension 2</text
				>
			</svg>
			{#snippet caption()}
				Projection sur les deux premières coordonnées ; les {dimension - 2} autres dimensions (si d &gt;
				2) ne sont pas visibles dans ce dessin.
			{/snippet}
		</Figure>

		<section class="stats" aria-live="polite">
			<p class="eyebrow">Distances dans le cube unité</p>
			<div class="stat-row"><span>d</span><strong>{dimension}</strong></div>
			<div class="stat-row">
				<span>d<sub>min</sub></span><strong>{extremes.min.toFixed(3)}</strong>
			</div>
			<div class="stat-row">
				<span>d<sub>max</sub></span><strong>{extremes.max.toFixed(3)}</strong>
			</div>
			<div class="ratio-block">
				<div class="ratio-header">
					<span>d<sub>min</sub> / d<sub>max</sub></span><strong>{ratio.toFixed(3)}</strong>
				</div>
				<div
					class="ratio-track"
					role="progressbar"
					aria-label="Ratio entre la distance minimale et la distance maximale"
					aria-valuemin="0"
					aria-valuemax="1"
					aria-valuenow={ratio}
				>
					<div class="ratio-fill" style:width={`${ratio * 100}%`}></div>
				</div>
				<p>Quand ce ratio se rapproche de 1, les distances deviennent presque indistinguables.</p>
			</div>
		</section>
	</div>

	<p class="caption">
		<strong>Complément — au-delà du cours.</strong> Les diapositives posent la question du fléau de
		la dimension sans y répondre. Ici, le nuage est tiré uniformément dans [0, 1]<sup>d</sup> : en grande
		dimension, la concentration des distances fait que le plus proche et le plus éloigné tendent à être
		presque aussi loin. C'est une explication standard du phénomène, illustrée par un échantillon fini
		— pas une preuve générale.
	</p>
</div>

<style>
	.dimension-demo {
		display: grid;
		gap: 1rem;
	}
	.controls {
		max-width: 28rem;
	}
	.demo-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
		gap: 1rem;
		align-items: start;
	}
	.demo-grid :global(figure) {
		margin: 0;
	}
	.demo-grid :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
	.axis-label {
		fill: var(--color-text-muted);
		font-size: 0.75rem;
	}
	.stats {
		display: grid;
		gap: 0.65rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}
	.eyebrow {
		margin: 0 0 0.25rem;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.stat-row,
	.ratio-header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		color: var(--color-text-muted);
	}
	.stat-row strong,
	.ratio-header strong {
		color: var(--color-text);
		font-family: var(--font-mono);
	}
	.ratio-block {
		display: grid;
		gap: 0.45rem;
		margin-top: 0.4rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}
	.ratio-track {
		height: 0.7rem;
		overflow: hidden;
		border-radius: 999px;
		background: var(--color-surface-2);
	}
	.ratio-fill {
		height: 100%;
		border-radius: inherit;
		background: var(--color-belief);
		transition: width 0.2s ease;
	}
	.ratio-block p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8rem;
		line-height: 1.45;
	}
	.caption {
		margin: 0;
		padding: 0.8rem 1rem;
		border-left: 3px solid var(--color-epistemic);
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
		color: var(--color-text-muted);
		font-size: 0.85rem;
		line-height: 1.55;
	}
	.caption strong {
		color: var(--color-epistemic);
	}
	@media (max-width: 700px) {
		.demo-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
