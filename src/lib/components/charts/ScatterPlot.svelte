<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Single data point */
	interface Point {
		x: number;
		y: number;
		value?: number;
		group?: string | number;
	}

	interface Props {
		points: Point[];
		domainX: [number, number];
		domainY: [number, number];
		width?: number;
		height?: number;
		colorBy?: (d: Point) => string | number;
		sizeBy?: (d: Point) => number;
		defaultSize?: number;
		defaultColor?: string;
		showAxes?: boolean;
		showLabels?: boolean;
		snippetOverlay?: Snippet;
	}

	let {
		points,
		domainX,
		domainY,
		width = 400,
		height = 350,
		colorBy,
		sizeBy,
		defaultSize = 4,
		defaultColor = 'var(--color-belief)',
		showAxes = true,
		showLabels = false,
		snippetOverlay
	}: Props = $props();

	const xMin = $derived(domainX[0]);
	const xMax = $derived(domainX[1]);
	const yMin = $derived(domainY[0]);
	const yMax = $derived(domainY[1]);

	const pad = 4;
	const plotW = $derived(width - pad * 2);
	const plotH = $derived(height - pad * 2);

	function project(x: number, y: number): [number, number] {
		const px = pad + ((x - xMin) / (xMax - xMin)) * plotW;
		const py = pad + ((yMax - y) / (yMax - yMin)) * plotH;
		return [px, py];
	}

	// Resolve color for a point
	function resolveColor(d: Point): string {
		if (!colorBy) return defaultColor;
		const v = colorBy(d);
		if (typeof v === 'string') return v;
		// numeric value -> diverging blue-red
		return numToColor(v);
	}

	function numToColor(v: number): string {
		const normed = Math.max(-1, Math.min(1, v));
		if (normed < 0) {
			const t = Math.abs(normed);
			return `rgb(${(25 + t * 220) | 0},${(10 + (1 - t) * 15) | 0},${(30 + (1 - t) * 180) | 0})`;
		} else {
			const t = normed;
			return `rgb(${(25 + t * 220) | 0},${(10 + (1 - t) * 30) | 0},${(30 + (1 - t) * 60) | 0})`;
		}
	}

	function resolveSize(d: Point): number {
		if (!sizeBy) return defaultSize;
		return Math.max(1, sizeBy(d));
	}

	const projectedPoints = $derived.by(() =>
		points.map((d) => ({
			cx: project(d.x, d.y)[0],
			cy: project(d.x, d.y)[1],
			r: resolveSize(d),
			fill: resolveColor(d)
		}))
	);

	const axesCoords = $derived.by(() => ({
		xLeft: project(xMin, yMax)[0],
		xRight: project(xMax, yMin)[0],
		yTop: project(xMin, yMax)[1],
		yBot: project(xMin, yMin)[1]
	}));

	const axisTickData = $derived.by(() => {
		if (!showLabels) return [];
		const result: { xVal: number; px: number }[] = [];
		for (let i = 0; i <= 4; i++) {
			const xVal = xMin + (i / 4) * (xMax - xMin);
			result.push({ xVal, px: project(xVal, yMin)[0] });
		}
		return result;
	});

	const yAxisTickData = $derived.by(() => {
		if (!showLabels) return [];
		const result: { yVal: number; py: number }[] = [];
		for (let j = 0; j <= 4; j++) {
			const yVal = yMin + (j / 4) * (yMax - yMin);
			result.push({ yVal, py: project(xMin, yVal)[1] });
		}
		return result;
	});
</script>

<svg
	{width}
	{height}
	viewBox={`0 0 ${width} ${height}`}
	class="scatter-svg"
	role="img"
	aria-label="Scatter plot"
>
	<!-- Data points -->
	<g class="points">
		{#each projectedPoints as p}
			<circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity="0.85" />
		{/each}
	</g>

	<!-- Axes and labels -->
	{#if showAxes}
		<g class="axes">
			<line
				x1={axesCoords.xLeft}
				y1={axesCoords.yBot}
				x2={axesCoords.xRight}
				y2={axesCoords.yBot}
				stroke="var(--color-border)"
				stroke-width="0.5"
			/>
			<line
				x1={axesCoords.xLeft}
				y1={axesCoords.yTop}
				x2={axesCoords.xLeft}
				y2={axesCoords.yBot}
				stroke="var(--color-border)"
				stroke-width="0.5"
			/>

			{#each axisTickData as tick}
				<text x={tick.px} y={axesCoords.yBot + 14} text-anchor="middle" class="axis-label">
					{tick.xVal.toFixed(1)}
				</text>
			{/each}

			{#each yAxisTickData as tick}
				<text x={axesCoords.xLeft - 6} y={tick.py + 3.5} text-anchor="end" class="axis-label">
					{tick.yVal.toFixed(1)}
				</text>
			{/each}
		</g>
	{/if}

	<!-- User overlay snippet (decision boundary, prediction interval, etc.) -->
	{#if snippetOverlay}
		{@render snippetOverlay()}
	{/if}
</svg>

<style>
	.scatter-svg {
		display: block;
		width: 100%;
		height: auto;
		user-select: none;
	}

	.axis-label {
		fill: var(--color-text-muted);
		font-size: 10px;
	}
</style>
