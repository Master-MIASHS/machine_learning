<script lang="ts">
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { mulberry32 } from '$lib/math/util';

	// PRNG seedé : tirages reproductibles, et « Regénérer » avance la suite.
	const rng = mulberry32(42);

	let m = $state(50);
	const maxM = 200;

	let bias = $state(0.1 + rng() * 0.3);
	let noiseVar = $state(0.2 + rng() * 0.4);

	function regenerate() {
		bias = 0.1 + rng() * 0.3;
		noiseVar = 0.2 + rng() * 0.4;
	}

	const mseValues = $derived.by(() => {
		const arr: number[] = [];
		for (let k = 1; k <= maxM; k++) {
			arr.push(Math.sqrt(bias * bias + noiseVar / k));
		}
		return arr;
	});

	const visibleValues = $derived(mseValues.slice(0, m));
	const baseline = $derived(Math.sqrt(bias * bias + noiseVar));
	const currentMse = $derived(visibleValues.at(-1) ?? 0);
	const improvement = $derived(((1 - currentMse / baseline) * 100).toFixed(1));

	// ── SVG layout ──
	const W = 520,
		H = 240;
	const pad = { t: 28, r: 16, b: 36, l: 48 };
	const plotW = W - pad.l - pad.r;
	const plotH = H - pad.t - pad.b;

	const yMax = $derived(baseline * 1.15);
	const viewBox = $derived(`0 0 ${W} ${H}`);

	const xScale = (k: number) => pad.l + ((k - 1) / (maxM - 1)) * plotW;
	const yScale = (v: number) => pad.t + plotH - (v / yMax) * plotH;

	const pathD = $derived.by(() => {
		let d = `M ${xScale(1)} ${yScale(visibleValues[0])}`;
		for (let k = 2; k <= m; k++) {
			d += ` L ${xScale(k)} ${yScale(visibleValues[k - 1])}`;
		}
		return d;
	});

	const yTickVals = $derived(Array.from({ length: 5 }, (_, i) => (yMax * i) / 4));
	const xTicks = [0, 50, 100, 150, 200];
</script>

<div class="bagging-demo">
	<h3>Bagging Convergence</h3>
	<p class="description">
		Ensemble error decreases as 1/&radic;M — more diverse models reduce variance.
	</p>

	<svg {viewBox} role="img" aria-label="Bagging convergence chart">
		<!-- Grid lines -->
		{#each yTickVals as tick}
			<line
				x1={pad.l}
				y1={yScale(tick)}
				x2={W - pad.r}
				y2={yScale(tick)}
				stroke="var(--color-border)"
				stroke-width="0.5"
			/>
			<text
				x={pad.l - 6}
				y={yScale(tick)}
				text-anchor="end"
				dominant-baseline="middle"
				fill="var(--color-text-muted)"
				font-size="9"
				font-family="var(--font-mono)">{tick.toFixed(2)}</text
			>
		{/each}

		<!-- Baseline reference -->
		<line
			x1={pad.l}
			y1={yScale(baseline)}
			x2={W - pad.r}
			y2={yScale(baseline)}
			stroke="var(--color-text-muted)"
			stroke-width="1"
			stroke-dasharray="4 3"
			opacity="0.6"
		/>
		<text
			x={W - pad.r + 4}
			y={yScale(baseline) - 4}
			fill="var(--color-text-muted)"
			font-size="8"
			font-family="var(--font-mono)">single model</text
		>

		<!-- Green convergence curve -->
		<path
			d={pathD}
			fill="none"
			stroke="#22c55e"
			stroke-width="2.5"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>

		<!-- Active endpoint -->
		<circle cx={xScale(m)} cy={yScale(currentMse)} r="4" fill="#22c55e">
			<animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
		</circle>

		<!-- Axes -->
		<path
			d={`M ${pad.l} ${pad.t} L ${pad.l} ${H - pad.b} L ${W - pad.r} ${H - pad.b}`}
			fill="none"
			stroke="var(--color-border)"
			stroke-width="1"
		/>

		{#each xTicks as tick}
			<text
				x={xScale(tick)}
				y={H - pad.b + 14}
				text-anchor="middle"
				fill="var(--color-text-muted)"
				font-size="9"
				font-family="var(--font-mono)">{tick}</text
			>
		{/each}

		<text
			x={(pad.l + W - pad.r) / 2}
			y={H - 4}
			text-anchor="middle"
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-sans)">Number of models (M)</text
		>
		<g transform={`rotate(-90, ${pad.l - 32}, ${(pad.t + H - pad.b) / 2})`}>
			<text
				x={pad.l - 32}
				y={(pad.t + H - pad.b) / 2}
				text-anchor="middle"
				dominant-baseline="middle"
				fill="var(--color-text-muted)"
				font-size="10"
				font-family="var(--font-sans)">RMSE</text
			>
		</g>
	</svg>

	<div class="controls">
		<Slider bind:value={m} min={10} max={200} step={1} label="Models (M)" />
		<button class="btn-regen" onclick={regenerate}>&#x21bb; Regenerate</button>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">Baseline RMSE</span>
			<span class="value">{baseline.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">Ensemble RMSE</span>
			<span class="value" style="color: #22c55e">{currentMse.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">Improvement</span>
			<span class="value" style="color: #22c55e">{improvement}%</span>
		</div>
		<div class="cell">
			<span class="label">Models</span>
			<span class="value">{m}</span>
		</div>
	</Metrics>
</div>

<style>
	.bagging-demo {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text);
	}
	.description {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.25rem;
	}

	.btn-regen {
		padding: 0.35rem 0.85rem;
		font-size: 0.8125rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
		cursor: pointer;
		font-family: var(--font-sans);
		white-space: nowrap;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.btn-regen:hover {
		border-color: var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 12%, transparent);
	}
	svg text {
		user-select: none;
	}
</style>
