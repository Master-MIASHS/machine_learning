<script lang="ts">
	/** Arrow element with pre-computed SVG coords and color */
	interface ArrowData {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		color: string;
	}

	interface Props {
		field: (x: number, y: number) => [number, number];
		domain: [[number, number], [number, number]]; // [xmin,xmax], [ymin,ymax]
		width?: number;
		height?: number;
		gridSize?: number;
		maxArrowLength?: number;
		showAxes?: boolean;
		showLabels?: boolean;
	}

	let {
		field,
		domain,
		width = 400,
		height = 350,
		gridSize = 12,
		maxArrowLength = 15,
		showAxes = true,
		showLabels = false
	}: Props = $props();

	const xMin = $derived(domain[0][0]);
	const xMax = $derived(domain[0][1]);
	const yMin = $derived(domain[1][0]);
	const yMax = $derived(domain[1][1]);

	const pad = 4;
	const plotW = $derived(width - pad * 2);
	const plotH = $derived(height - pad * 2);

	function project(x: number, y: number): [number, number] {
		const px = pad + ((x - xMin) / (xMax - xMin)) * plotW;
		const py = pad + ((yMax - y) / (yMax - yMin)) * plotH;
		return [px, py];
	}

	function arrowColor(t: number): string {
		t = Math.max(0, Math.min(1, t));
		// light blue → deep red based on magnitude ratio
		return `rgb(${(80 + t * 175) | 0},${(60 + (1 - t) * 120) | 0},${(140 + (1 - t) * 80) | 0})`;
	}

	// First compute max magnitude for normalization
	const maxMagnitude = $derived.by(() => {
		if (gridSize < 2) return 1;
		let mx = 0;
		for (let j = 0; j < gridSize; j++) {
			for (let i = 0; i < gridSize; i++) {
				const x = xMin + (i / (gridSize - 1)) * (xMax - xMin);
				const y = yMin + (j / (gridSize - 1)) * (yMax - yMin);
				const [dx, dy] = field(x, y);
				const mag = Math.sqrt(dx * dx + dy * dy);
				if (isFinite(mag) && mag > mx) mx = mag;
			}
		}
		return mx || 1;
	});

	// Build arrow data with pre-computed SVG coords and colors
	const arrows = $derived.by((): ArrowData[] => {
		if (gridSize < 2) return [];

		const stepX = (xMax - xMin) / (gridSize - 1);
		const stepY = (yMax - yMin) / (gridSize - 1);

		const results: ArrowData[] = [];
		for (let j = 0; j < gridSize; j++) {
			for (let i = 0; i < gridSize; i++) {
				const x = xMin + i * stepX;
				const y = yMin + j * stepY;
				const [dx, dy] = field(x, y);
				let mag = Math.sqrt(dx * dx + dy * dy);
				if (!isFinite(mag)) continue;

				// Perceptual length scale: sqrt boosts short vectors relatively
				// more than long ones, so low-magnitude arrows stay readable
				// instead of shrinking to near-invisible slivers. The longest
				// arrow on the grid still maps to exactly maxArrowLength.
				const len = maxArrowLength * Math.sqrt(mag / maxMagnitude);

				const [px1, py1] = project(x, y);
				const nx = dx / (mag || 1); // normalized direction
				const ny = dy / (mag || 1);

				results.push({
					x1: px1,
					y1: py1,
					x2: px1 + nx * len,
					y2: py1 - ny * len, // flip Y for SVG coords
					color: arrowColor(mag / maxMagnitude)
				});
			}
		}
		return results;
	});

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
	class="vectorfield-svg"
	role="img"
	aria-label="Vector field"
>
	<defs>
		<!-- Background -->
		<radialGradient id="bg" cx="50%" cy="45%" r="85%">
			<stop offset="0%" stop-color="#1e293b" />
			<stop offset="100%" stop-color="#020617" />
		</radialGradient>

		<!-- Arrow gradient -->
		<linearGradient id="vectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" stop-color="#38bdf8" />
			<stop offset="50%" stop-color="#818cf8" />
			<stop offset="100%" stop-color="#fb7185" />
		</linearGradient>

		<!-- Glow -->
		<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur stdDeviation="2.2" result="blur" />
			<feMerge>
				<feMergeNode in="blur" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>

		<!-- Glass -->
		<filter id="glassShadow">
			<feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25" />
		</filter>

		<marker
			id="arrowhead"
			viewBox="0 0 15 15"
			refX="2"
			refY="5"
			markerWidth="8"
			markerHeight="8"
			orient="auto"
		>
			<path d="M0,1.5 L10,5 L0,8.5 Z" fill="url(#vectorGradient)" />
		</marker>

		<pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
			<path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
		</pattern>
	</defs>

	<!-- Background -->
	<rect x="0" y="0" {width} {height} rx="18" fill="url(#bg)" filter="url(#glassShadow)" />

	<!-- Glass overlay -->
	<rect
		x="0"
		y="0"
		{width}
		{height}
		rx="18"
		fill="rgba(255,255,255,0.03)"
		stroke="rgba(255,255,255,0.08)"
	/>

	<!-- Grid -->
	<rect x={pad} y={pad} width={plotW} height={plotH} fill="url(#grid)" />

	<!-- Axes -->
	{#if showAxes}
		<g opacity="0.45">
			<line
				x1={axesCoords.xLeft}
				y1={axesCoords.yBot}
				x2={axesCoords.xRight}
				y2={axesCoords.yBot}
				stroke="white"
				stroke-width="1.2"
			/>

			<line
				x1={axesCoords.xLeft}
				y1={axesCoords.yTop}
				x2={axesCoords.xLeft}
				y2={axesCoords.yBot}
				stroke="white"
				stroke-width="1.2"
			/>
		</g>
	{/if}

	<!-- Vector glow -->
	<g filter="url(#glow)" stroke="url(#vectorGradient)" fill="none" stroke-linecap="round">
		{#each arrows as a}
			<line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke-width="3.8" opacity="0.18" />
		{/each}
	</g>

	<!-- Vectors -->
	<g stroke="url(#vectorGradient)" stroke-linecap="round" fill="none">
		{#each arrows as a}
			<line
				x1={a.x1}
				y1={a.y1}
				x2={a.x2}
				y2={a.y2}
				stroke-width="1.3"
				marker-end="url(#arrowhead)"
			/>
		{/each}
	</g>

	<!-- Labels -->
	{#if showLabels}
		<g fill="rgba(255,255,255,.75)" font-size="10" font-family="Inter, sans-serif">
			{#each axisTickData as tick}
				<text x={tick.px} y={axesCoords.yBot + 18} text-anchor="middle">
					{tick.xVal.toFixed(1)}
				</text>
			{/each}

			{#each yAxisTickData as tick}
				<text x={axesCoords.xLeft - 8} y={tick.py + 4} text-anchor="end">
					{tick.yVal.toFixed(1)}
				</text>
			{/each}
		</g>
	{/if}
</svg>

<style>
	.vectorfield-svg {
		display: block;
		width: 100%;
		height: auto;
		user-select: none;
	}
</style>
