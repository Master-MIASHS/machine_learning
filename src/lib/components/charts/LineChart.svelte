<script lang="ts">
	import { scaleLinear } from 'd3';
	import { line, curveBasis } from 'd3';

	interface Series {
		values: number[];
		color: string;
		label: string;
	}

	interface Props {
		series: Series[];
		xLabel?: string;
		yLabel?: string;
		width?: number;
		height?: number;
	}

	let { series, xLabel = '', yLabel = '', width = 400, height = 200 }: Props = $props();

	const padding = { top: 12, right: 16, bottom: 36, left: 40 };

	const maxLen = $derived(Math.max(...series.map((s) => s.values.length), 1));
	const allVals = $derived(series.flatMap((s) => s.values));
	const minY = $derived(Math.min(...allVals, 0));
	const maxY = $derived(Math.max(...allVals, 1));

	const xScale = $derived(
		scaleLinear<number>()
			.domain([0, maxLen - 1])
			.range([padding.left, width - padding.right])
	);

	const yScale = $derived(
		scaleLinear<number>()
			.domain([minY, maxY])
			.range([height - padding.bottom, padding.top])
			.nice()
	);

	const paths = $derived.by(() => {
		return series.map((s) => {
			const pts = s.values.map((v, i) => ({ x: i, y: v }));
			const pathFn = line<{ x: number; y: number }>()
				.x((d) => xScale(d.x))
				.y((d) => yScale(d.y))
				.curve(curveBasis);
			return { d: pathFn(pts) ?? '', color: s.color, label: s.label };
		});
	});

	const xTicks = $derived(xScale.ticks(5));
	const yTicks = $derived(yScale.ticks(4));

	function formatTick(v: number): string {
		return Math.abs(v) >= 1e5 ? v.toExponential(1) : v.toFixed(1);
	}
</script>

<svg {width} {height} role="img" aria-label="Line chart">
	<!-- Y grid lines -->
	{#each yTicks as tick (tick)}
		<line
			x1={padding.left}
			y1={yScale(tick)}
			x2={width - padding.right}
			y2={yScale(tick)}
			stroke="var(--color-border)"
			stroke-width="0.5"
			opacity="0.6"
		/>
	{/each}

	<!-- Lines -->
	{#each paths as path (path.label)}
		<path
			d={path.d}
			fill="none"
			stroke={path.color}
			stroke-width="2"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
	{/each}

	<!-- Axes -->
	<line
		x1={padding.left} y1={padding.top}
		x2={padding.left} y2={height - padding.bottom}
		stroke="var(--color-border)" stroke-width="1"
	/>
	<line
		x1={padding.left} y1={height - padding.bottom}
		x2={width - padding.right} y2={height - padding.bottom}
		stroke="var(--color-border)" stroke-width="1"
	/>

	<!-- Y ticks -->
	{#each yTicks as tick (tick)}
		<text
			x={padding.left - 6}
			y={yScale(tick)}
			text-anchor="end"
			dominant-baseline="middle"
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-mono)"
		>{formatTick(tick)}</text>
	{/each}

	<!-- X ticks -->
	{#each xTicks as tick (tick)}
		<text
			x={xScale(tick)}
			y={height - padding.bottom + 14}
			text-anchor="middle"
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-mono)"
		>{tick}</text>
	{/each}

	<!-- Axis labels -->
	{#if xLabel}
		<text
			x={(padding.left + width - padding.right) / 2}
			y={height - 4}
			text-anchor="middle"
			fill="var(--color-text-muted)"
			font-size="11"
			font-family="var(--font-sans)"
		>{xLabel}</text>
	{/if}
	{#if yLabel}
		<text
			x={12}
			y={(padding.top + height - padding.bottom) / 2}
			text-anchor="middle"
			dominant-baseline="middle"
			transform="rotate(-90, 12, {(padding.top + height - padding.bottom) / 2})"
			fill="var(--color-text-muted)"
			font-size="11"
			font-family="var(--font-sans)"
		>{yLabel}</text>
	{/if}

	<!-- Legend -->
	{#each paths as path, i (path.label)}
		<rect x={padding.left + 8 + i * 90} y={padding.top + 2} width={10} height={10} rx={2} fill={path.color} />
		<text
			x={padding.left + 22 + i * 90}
			y={padding.top + 11}
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-sans)"
		>{path.label}</text>
	{/each}
</svg>

<style>
	svg {
		overflow: visible;
	}
</style>
