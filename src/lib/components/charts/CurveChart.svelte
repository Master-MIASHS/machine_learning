<script lang="ts">
	import { scaleLinear, scaleLog, line, curveBasis } from 'd3';
	import type { Snippet } from 'svelte';

	// ─── Curve layer ──────────────────────────────────────────────────────────────

	/**
	 * A single curve rendered in the chart.
	 * Pre-computed points are passed in; the component handles scaling + path gen.
	 */
	interface CurveLayer {
		/** Array of [x, y] data points. */
		points: [number, number][];
		/** Stroke color. Defaults to var(--color-text-muted). */
		stroke?: string;
		/** px stroke width. Default 2. */
		strokeWidth?: number;
		/** SVG stroke-dasharray, e.g. "6 4". Default solid. */
		strokeDasharray?: string;
		/** stroke-linejoin. Default "round". */
		strokeLinejoin?: 'round' | 'miter' | 'bevel' | 'arcs' | 'miter-clip' | 'inherit';
		/** Opacity of the stroke. Default 1. */
		opacity?: number;
	}

	// ─── Annotation layers ────────────────────────────────────────────────────────

	/** A vertical dashed/solid guide line at a data-space x value. */
	interface VLine {
		x: number;
		stroke?: string;
		strokeWidth?: number;
		strokeDasharray?: string;
		opacity?: number;
		/** Label rendered just above the top of the line. Omit for no label. */
		label?: string;
		/** Vertical offset from pad.top for the label. Default -2. */
		labelOffset?: number;
		labelFontSize?: number;
		labelOpacity?: number;
		labelFontFamily?: string;
	}

	// ─── Curve dot ────────────────────────────────────────────────────────────────

	/**
	 * A dot placed at (x, y) in data space. Optionally draws a vertical bar from
	 * the dot down to the bottom of the visible range.
	 */
	interface CurveDot {
		/** Data-space x position. */
		x: number;
		/** Data-space y position. */
		y: number;
		r?: number;
		fill?: string;
		stroke?: string;
		strokeWidth?: number;
		/** Draw a vertical bar from this dot down to the bottom of the chart area. */
		bar?: boolean;
		barFill?: string;
		barOpacity?: number;
		/** Bar width in SVG px. Default 2. */
		barWidth?: number;
	}

	// ─── Legend ───────────────────────────────────────────────────────────────────

	interface LegendItem {
		label: string;
		/** Swatch color. */
		color: string;
		/** 'line' (default) | 'dashed-line'. */
		kind?: 'line' | 'dashed-line';
	}

	// ─── Fill-between layer ───────────────────────────────────────────────────────

	/**
	 * Fills the vertical gap between two curves (identified by index into `curves`).
	 * The region is the area where one curve is above the other, pointwise.
	 * Renders below all curve strokes.
	 */
	interface FillBetween {
		/** Index of the first curve in `curves`. */
		curveA: number;
		/** Index of the second curve in `curves`. */
		curveB: number;
		fill?: string;
		opacity?: number;
	}

	// ─── Props ────────────────────────────────────────────────────────────────────

	interface Props {
		/** Curves. Rendered in order. */
		curves: CurveLayer[];
		/** Explicit x domain [min, max]. If omitted the domain is inferred from curves[].points. */
		xDomain?: [number, number];
		/** Explicit y domain [min, max]. If omitted both ends are auto-inferred from curve points with 10% padding. Must be positive when `yScaleType` is 'log'. */
		yDomain?: [number, number];
		/**
		 * Y scale type. 'log' uses a base-10 log scale, for data spanning several
		 * decades: the auto domain becomes [minPositive / 10, max * 1.5] and
		 * non-positive points are clamped to the domain floor. If the data has no
		 * positive values the scale silently falls back to linear. Default 'linear'.
		 */
		yScaleType?: 'linear' | 'log';
		/** Chart height in CSS px. Default 200. */
		height?: number;
		/** How many x-axis ticks to aim for. Default 5. */
		nTicks?: number;
		/** How many y-axis ticks to aim for. Default 3. */
		nYTicks?: number;
		/** Show Y axis. */
		yAxis?: boolean;
		/** Vertical guide lines (purely aesthetic grids or semantic markers). */
		vlines?: VLine[];
		/** Dots placed at arbitrary (x, y) in data space. */
		curveDots?: CurveDot[];
		/** Fill the gap between two curves (by index). Rendered below strokes. */
		fillBetween?: FillBetween[];
		/** Short label rendered top-right inside the SVG. */
		chartLabel?: string;
		/** Legend items rendered below the chart. */
		legend?: LegendItem[];
		/** For customizable elements */
		children?: Snippet;
	}

	let {
		curves,
		xDomain,
		yDomain,
		yScaleType = 'linear',
		height = 200,
		nTicks = 5,
		nYTicks = 3,
		yAxis = false,
		vlines = [],
		curveDots = [],
		fillBetween = [],
		chartLabel,
		legend = [],
		children
	}: Props = $props();

	// ─── Layout ───────────────────────────────────────────────────────────────────

	let containerWidth = $state(0);

	const pad = { top: 15, right: 20, bottom: 35 };

	const vbW = $derived(containerWidth || 560);
	const vbH = $derived(height);
	const baseline = $derived(vbH - pad.bottom);

	// ─── Scales ───────────────────────────────────────────────────────────────────

	const computedXDomain = $derived.by((): [number, number] => {
		if (xDomain) return xDomain;
		const allX = curves.flatMap((c) => c.points.map((p) => p[0]));
		if (allX.length === 0) return [-4, 4];
		return [Math.min(...allX), Math.max(...allX)];
	});

	// A log scale needs a positive domain, so it is only active when the data
	// actually contains positive values; otherwise fall back to linear.
	const useLog = $derived(
		yScaleType === 'log' && curves.some((c) => c.points.some((p) => p[1] > 0))
	);

	const computedYDomain = $derived.by((): [number, number] => {
		if (yDomain) return yDomain;
		const allY = curves.flatMap((c) => c.points.map((p) => p[1]));
		if (allY.length === 0) return [-1, 1];
		const min = Math.min(...allY);
		const max = Math.max(...allY);
		if (useLog) {
			// ±10% linear padding can go negative (breaking the log domain), so
			// pad multiplicatively instead: one decade below the smallest
			// positive value, modest headroom above the maximum.
			const minPositive = Math.min(...allY.filter((y) => y > 0));
			return [minPositive / 10, max * 1.5];
		}
		const padding = (max - min) * 0.1 || 0.5;
		return [min - padding, max + padding];
	});

	const yScale = $derived.by(() => {
		const scale = useLog ? scaleLog().clamp(true) : scaleLinear();
		return scale.domain(computedYDomain).range([baseline, pad.top]);
	});

	const yTicks = $derived.by(() => {
		if (!useLog) return yScale.ticks(nYTicks);
		// A fixed small count would leave the upper decades unlabeled on a log
		// axis: aim for ~one tick per decade instead.
		const decades = Math.log10(computedYDomain[1] / computedYDomain[0]);
		return yScale.ticks(Math.min(14, Math.max(nYTicks, Math.round(decades))));
	});

	// Left margin grows with the widest y-tick label: labels are middle-anchored
	// at padLeft - 16, so anything past x = 0 is clipped by the wrapper.
	// (Mono digit ≈ 6.5px at the 10.5px tick font.)
	const padLeft = $derived.by(() => {
		if (!yAxis) return 20;
		const widest = Math.max(0, ...yTicks.map((t) => String(t).length));
		return Math.max(20, Math.ceil(16 + (widest * 6.5) / 2 + 3));
	});

	const xScale = $derived(
		scaleLinear()
			.domain(computedXDomain)
			.range([padLeft, Math.max(padLeft, vbW - pad.right)])
	);

	const ticks = $derived(xScale.ticks(nTicks));

	// ─── Path generation ─────────────────────────────────────────────────────────

	type Pt = { x: number; y: number };

	const makeLine = (xs: typeof xScale, ys: typeof yScale) =>
		line<Pt>()
			.x((d) => xs(d.x))
			.y((d) => ys(d.y))
			.curve(curveBasis);

	const computedPaths = $derived.by(() => {
		if (!containerWidth) return [];

		return curves.map((c) => {
			const pts: Pt[] = c.points.map(([x, y]) => ({ x, y }));
			const curvePath = makeLine(xScale, yScale)(pts) ?? '';
			return { curvePath, layer: c };
		});
	});

	// ─── Fill-between paths ───────────────────────────────────────────────────────

	const computedFillBetween = $derived.by(() => {
		if (!containerWidth || fillBetween.length === 0) return [];

		return fillBetween.map((fb) => {
			const a = curves[fb.curveA]?.points ?? [];
			const b = curves[fb.curveB]?.points ?? [];
			// Assume both curves share the same x grid (same xs array).
			// Build a polygon: top edge = max(a,b), bottom edge = min(a,b), reversed.
			const n = Math.min(a.length, b.length);
			if (n === 0) return { d: '', fb };

			// Forward pass: upper envelope
			const upper: Pt[] = [];
			const lower: Pt[] = [];
			for (let i = 0; i < n; i++) {
				const x = a[i][0];
				const ya = a[i][1];
				const yb = b[i][1];
				upper.push({ x, y: Math.max(ya, yb) });
				lower.push({ x, y: Math.min(ya, yb) });
			}

			// Path: upper forward, lower reversed → closed polygon
			const upperPath = upper
				.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.x).toFixed(2)} ${yScale(p.y).toFixed(2)}`)
				.join(' ');
			const lowerPath = [...lower]
				.reverse()
				.map((p) => `L${xScale(p.x).toFixed(2)} ${yScale(p.y).toFixed(2)}`)
				.join(' ');

			return { d: `${upperPath} ${lowerPath} Z`, fb };
		});
	});
</script>

<div class="chart-wrapper" bind:clientWidth={containerWidth}>
	{#if containerWidth > 0}
		<svg
			viewBox={`0 0 ${vbW} ${vbH}`}
			width="100%"
			height={vbH}
			role="img"
			aria-label="Curve chart"
		>
			<!-- ① Vertical lines (behind curves) -->
			{#each vlines as vl}
				{@const stroke = vl.stroke ?? 'var(--color-border)'}
				<line
					x1={xScale(vl.x)}
					y1={pad.top}
					x2={xScale(vl.x)}
					y2={baseline}
					{stroke}
					stroke-width={vl.strokeWidth ?? 1}
					stroke-dasharray={vl.strokeDasharray ?? '2 2'}
					opacity={vl.opacity ?? 0.3}
				/>
				{#if vl.label}
					<text
						x={xScale(vl.x)}
						y={pad.top + (vl.labelOffset ?? -2)}
						text-anchor="middle"
						fill={stroke}
						font-size={vl.labelFontSize ?? 9}
						font-family={vl.labelFontFamily ?? 'var(--font-sans)'}
						opacity={vl.labelOpacity ?? 0.8}>{vl.label}</text
					>
				{/if}
			{/each}
			<!-- ① Fill-between regions -->
			{#each computedFillBetween as fb}
				<path
					d={fb.d}
					fill={fb.fb.fill ?? 'var(--color-surprise)'}
					opacity={fb.fb.opacity ?? 0.12}
				/>
			{/each}

			<!-- ② Curves -->
			{#each computedPaths as p}
				<path
					d={p.curvePath}
					fill="none"
					stroke={p.layer.stroke ?? 'var(--color-text-muted)'}
					stroke-width={p.layer.strokeWidth ?? 2}
					stroke-dasharray={p.layer.strokeDasharray ?? undefined}
					stroke-linejoin={p.layer.strokeLinejoin ?? 'round'}
					opacity={p.layer.opacity ?? 1}
				/>
			{/each}

			<!-- ② Curves -->
			{#each computedPaths as p}
				<path
					d={p.curvePath}
					fill="none"
					stroke={p.layer.stroke ?? 'var(--color-text-muted)'}
					stroke-width={p.layer.strokeWidth ?? 2}
					stroke-dasharray={p.layer.strokeDasharray ?? undefined}
					stroke-linejoin={p.layer.strokeLinejoin ?? 'round'}
					opacity={p.layer.opacity ?? 1}
				/>
			{/each}

			<!-- ③ Curve dots (data-space x, y) -->
			{#each curveDots as cd}
				{@const cx = xScale(cd.x)}
				{@const cy = Math.max(pad.top + 2, Math.min(baseline - 2, yScale(cd.y)))}
				{#if cd.bar}
					<rect
						x={cx - (cd.barWidth ?? 2) / 2}
						y={cy}
						width={cd.barWidth ?? 2}
						height={baseline - cy}
						fill={cd.barFill ?? cd.fill ?? 'var(--color-surprise)'}
						opacity={cd.barOpacity ?? 0.15}
					/>
				{/if}
				<circle
					{cx}
					{cy}
					r={cd.r ?? 5.5}
					fill={cd.fill ?? 'var(--color-surprise)'}
					stroke={cd.stroke ?? 'var(--color-bg)'}
					stroke-width={cd.strokeWidth ?? 2}
				/>
			{/each}

			<!-- ④ X, Y axis -->
			<line
				x1={padLeft}
				y1={baseline}
				x2={vbW - pad.right}
				y2={baseline}
				stroke="var(--color-border)"
				stroke-width="1.5"
			/>
			{#each ticks as tick (tick)}
				<text
					x={xScale(tick).toFixed(2)}
					y={baseline + 16}
					text-anchor="middle"
					fill="var(--color-text-muted)"
					font-size="10.5"
					font-family="var(--font-mono)">{tick}</text
				>
			{/each}
			{#if yAxis}
				<line
					x1={padLeft}
					y1={baseline}
					x2={padLeft}
					y2={pad.top}
					stroke="var(--color-border)"
					stroke-width="1.5"
				/>
				{#each yTicks as tick (tick)}
					<text
						x={padLeft - 16}
						y={yScale(tick).toFixed(2)}
						text-anchor="middle"
						fill="var(--color-text-muted)"
						font-size="10.5"
						font-family="var(--font-mono)">{tick}</text
					>
				{/each}
			{/if}

			<!-- ⑤ Chart label (top-right) -->
			{#if chartLabel}
				<text
					x={vbW - pad.right}
					y={pad.top + 10}
					text-anchor="end"
					fill="var(--color-text-muted)"
					font-size="11"
					font-family="var(--font-sans)">{chartLabel}</text
				>
			{/if}
			{#if children}
				{@render children()}
			{/if}
		</svg>

		<!-- ⑥ Legend -->
		{#if legend.length > 0}
			<div class="chart-legend">
				{#each legend as item}
					<span class="legend-item">
						{#if item.kind === 'dashed-line'}
							<span class="legend-swatch legend-dash" style:border-color={item.color}></span>
						{:else}
							<span class="legend-swatch legend-line" style:background={item.color}></span>
						{/if}
						{item.label}
					</span>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.chart-wrapper {
		width: 100%;
		overflow: hidden;
	}

	svg {
		display: block;
		overflow: visible;
	}

	.chart-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		justify-content: center;
		margin-top: 0.5rem;
		font-size: 0.8rem;
		font-family: var(--font-sans);
		color: var(--color-text-muted);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.legend-swatch {
		display: inline-block;
		width: 18px;
		height: 3px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	/* Solid line swatch */
	.legend-line {
		height: 3px;
	}

	/* Dashed line swatch */
	.legend-dash {
		height: 0;
		border-top: 2px dashed;
		background: transparent;
	}
</style>
