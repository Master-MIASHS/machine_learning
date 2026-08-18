<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '../narrative/KatexInline.svelte';

	/**
	 * Regression vs classification.
	 *
	 * η(x)      : true posterior probability
	 * η_n(x)    : noisy/imperfect estimate of η(x)
	 *
	 * The shaded regions are precisely where η and η_n are on opposite
	 * sides of 1/2. These are the regions where regression error actually
	 * changes the classification decision.
	 */

	const N = 161;
	const xMin = -3;
	const xMax = 3;

	const width = 760;
	const height = 360;
	const margin = {
		left: 52,
		right: 18,
		top: 18,
		bottom: 38
	};

	const plotWidth = width - margin.left - margin.right;
	const plotHeight = height - margin.top - margin.bottom;

	let temperature = $state(0.5);
	let approximationQuality = $state(0.75);
	let estimationNoise = $state(0.08);

	const xGrid = Array.from({ length: N }, (_, i) => xMin + (xMax - xMin) * (i / (N - 1)));

	// Fixed pseudo-random noise: changing the sliders changes its amplitude,
	// not the realization. This makes the widget visually stable.
	function pseudoNoise(i: number): number {
		const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
		return (x - Math.floor(x)) * 2 - 1;
	}

	function sigmoid(x: number, temperature: number): number {
		const t = Math.max(temperature, 0.001);
		return 1 / (1 + Math.exp(-x / t));
	}

	function clamp01(x: number): number {
		return Math.max(0, Math.min(1, x));
	}

	const truePoints = $derived(
		xGrid.map((x) => ({
			x,
			y: sigmoid(x, temperature)
		}))
	);

	const estimatedPoints = $derived(
		xGrid.map((x, i) => {
			const eta = sigmoid(x, temperature);

			// Approximation error is deliberately largest away from the
			// decision boundary. This illustrates that large regression
			// errors can have no effect on classification.
			const systematic =
				(1 - approximationQuality) *
				0.12 *
				Math.sin(3.6 * x + 2) *
				(1.2 + 0.65 * Math.abs(2 * eta - 1));

			const noise = estimationNoise * 0.16 * pseudoNoise(i);

			return {
				x,
				y: clamp01(eta + systematic + noise)
			};
		})
	);

	function xToSvg(x: number): number {
		return margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
	}

	function yToSvg(y: number): number {
		return margin.top + (1 - y) * plotHeight;
	}

	function linePath(points: { x: number; y: number }[]): string {
		return points
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xToSvg(p.x).toFixed(2)} ${yToSvg(p.y).toFixed(2)}`)
			.join(' ');
	}

	/**
	 * Find contiguous intervals where η and η_n lie on opposite sides
	 * of 1/2, then construct a polygon following both curves.
	 */
	const mismatchRegions = $derived.by(() => {
		const regions: { truePoints: typeof truePoints; estimatedPoints: typeof estimatedPoints }[] =
			[];

		let start = -1;

		for (let i = 0; i < truePoints.length; i++) {
			const mismatch = (truePoints[i].y - 0.5) * (estimatedPoints[i].y - 0.5) < 0;

			if (mismatch && start === -1) {
				start = i;
			}

			const isEnd = !mismatch || i === truePoints.length - 1;

			if (start !== -1 && isEnd) {
				const end = mismatch && i === truePoints.length - 1 ? i : i - 1;

				if (end > start) {
					regions.push({
						truePoints: truePoints.slice(start, end + 1),
						estimatedPoints: estimatedPoints.slice(start, end + 1)
					});
				}

				start = -1;
			}
		}

		return regions;
	});

	function regionPath(region: {
		truePoints: { x: number; y: number }[];
		estimatedPoints: { x: number; y: number }[];
	}): string {
		const top = region.truePoints
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xToSvg(p.x).toFixed(2)} ${yToSvg(p.y).toFixed(2)}`)
			.join(' ');

		const bottom = [...region.estimatedPoints]
			.reverse()
			.map((p) => `L ${xToSvg(p.x).toFixed(2)} ${yToSvg(p.y).toFixed(2)}`)
			.join(' ');

		return `${top} ${bottom} Z`;
	}

	const truePath = $derived(linePath(truePoints));
	const estimatedPath = $derived(linePath(estimatedPoints));

	const thresholdY = yToSvg(0.5);
	const boundaryX = xToSvg(0);

	const mse = $derived(
		estimatedPoints.reduce((sum, p, i) => sum + (p.y - truePoints[i].y) ** 2, 0) / N
	);

	const mismatchMass = $derived(
		estimatedPoints.reduce((sum, p, i) => {
			const mismatch = (p.y - 0.5) * (truePoints[i].y - 0.5) < 0;
			return sum + (mismatch ? 1 : 0);
		}, 0) / N
	);
</script>

<Figure type="chart">
	<div class="regression-figure">
		<svg
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="Comparaison entre la vraie fonction η et son approximation"
		>
			<!-- Grid -->
			{#each [0, 0.25, 0.5, 0.75, 1] as y}
				<line
					x1={margin.left}
					x2={width - margin.right}
					y1={yToSvg(y)}
					y2={yToSvg(y)}
					class="grid-line"
				/>
				<text x={margin.left - 9} y={yToSvg(y) + 4} class="axis-label" text-anchor="end">
					{y.toFixed(2)}
				</text>
			{/each}

			{#each [-3, -2, -1, 0, 1, 2, 3] as x}
				<line
					x1={xToSvg(x)}
					x2={xToSvg(x)}
					y1={margin.top}
					y2={height - margin.bottom}
					class="grid-line"
				/>
				<text x={xToSvg(x)} y={height - margin.bottom + 20} class="axis-label" text-anchor="middle">
					{x}
				</text>
			{/each}

			<!-- Threshold η = 1/2 -->
			<line
				x1={margin.left}
				x2={width - margin.right}
				y1={thresholdY}
				y2={thresholdY}
				class="threshold"
			/>

			<text
				x={width - margin.right - 4}
				y={thresholdY - 7}
				class="threshold-label"
				text-anchor="end"
			>
				η = 1/2
			</text>

			<!-- Bayes boundary -->
			<line
				x1={boundaryX}
				x2={boundaryX}
				y1={margin.top}
				y2={height - margin.bottom}
				class="boundary"
			/>

			<text x={boundaryX + 7} y={margin.top + 15} class="boundary-label"> frontière de Bayes </text>

			<!-- Areas where the classification changes -->
			{#each mismatchRegions as region}
				<path d={regionPath(region)} class="mismatch-area" />
			{/each}

			<!-- True η -->
			<path d={truePath} class="true-curve" />

			<!-- Estimated η_n -->
			<path d={estimatedPath} class="estimated-curve" />

			<!-- Axes -->
			<line
				x1={margin.left}
				x2={width - margin.right}
				y1={height - margin.bottom}
				y2={height - margin.bottom}
				class="axis"
			/>
			<line
				x1={margin.left}
				x2={margin.left}
				y1={margin.top}
				y2={height - margin.bottom}
				class="axis"
			/>

			<!-- Legend -->
			<g class="legend">
				<line x1="70" x2="98" y1="35" y2="35" class="true-curve" />
				<text x="106" y="39">η(x) — vraie</text>

				<line x1="70" x2="98" y1="57" y2="57" class="estimated-curve" />
				<text x="106" y="61">ηₙ(x) — estimée</text>

				<rect x="70" y="70" width="28" height="10" class="mismatch-area" />
				<text x="106" y="80">erreur de classification</text>
			</g>

			<text x={width / 2} y={height - 5} class="axis-title" text-anchor="middle"> x </text>
		</svg>
	</div>

	{#snippet caption()}
		La courbe bleue est la vraie probabilité a posteriori
		<em>η(x)</em>, tandis que la courbe rouge représente son estimation
		<em>ηₙ(x)</em>. Les zones roses apparaissent uniquement lorsque les deux courbes sont de part et
		d'autre du seuil <em>1/2</em> : ce sont donc les régions où l'erreur de régression provoque réellement
		une erreur de classification.
	{/snippet}
</Figure>

<div class="controls">
	<Slider
		min={0.02}
		max={5}
		step={0.01}
		logarithmic={true}
		bind:value={temperature}
		label="Bruit réel — température de η(x)"
	/>

	<Slider
		min={0}
		max={1}
		step={0.01}
		bind:value={approximationQuality}
		label="Qualité de l'approximation de η(x)"
	/>

	<Slider
		min={0}
		max={1}
		step={0.01}
		bind:value={estimationNoise}
		label="Bruit de l'estimation ηₙ(x)"
	/>
</div>

<Metrics align="left">
	<div class="cell">
		<span class="label">Risque de Bayes R*</span>
		<span class="value">
			{(truePoints.reduce((sum, p) => sum + Math.min(p.y, 1 - p.y), 0) / N).toFixed(3)}
		</span>
	</div>

	<div class="cell">
		<span class="label">Erreur quadratique</span>
		<span class="value">{mse.toFixed(4)}</span>
	</div>

	<div class="cell">
		<span class="label">Zone où la décision diffère</span>
		<span class="value">{(100 * mismatchMass).toFixed(1)} %</span>
	</div>
</Metrics>

<div class="explanation">
	<strong>Pourquoi les zones roses sont importantes ?</strong>
	Une grande erreur sur <KatexInline formula="\eta_n(x)" /> n'est pas forcément importante pour la classification.
	Si les deux courbes restent du même côté de
	<KatexInline formula="1/2" />, elles donnent exactement la même décision. L'erreur ne devient
	pertinente que lorsqu'elle fait franchir le seuil.
</div>

<style>
	.regression-figure {
		width: 100%;
		overflow: hidden;
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.015);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.grid-line {
		stroke: var(--color-text-muted);
		stroke-width: 0.6;
		opacity: 0.12;
	}

	.axis {
		stroke: var(--color-text);
		stroke-width: 1;
		opacity: 0.5;
	}

	.axis-label {
		font-size: 10px;
		fill: var(--color-text-muted);
	}

	.axis-title {
		font-size: 11px;
		font-weight: 600;
		fill: var(--color-text-muted);
	}

	.threshold {
		stroke: var(--color-text-muted);
		stroke-width: 1.2;
		stroke-dasharray: 5 4;
		opacity: 0.7;
	}

	.threshold-label {
		font-size: 10px;
		fill: var(--color-text-muted);
	}

	.boundary {
		stroke: var(--color-surprise);
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
		opacity: 0.8;
	}

	.boundary-label {
		font-size: 10px;
		font-weight: 600;
		fill: var(--color-surprise);
	}

	.true-curve {
		fill: none;
		stroke: var(--color-belief);
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.estimated-curve {
		fill: none;
		stroke: var(--color-positive);
		stroke-width: 2.2;
		stroke-dasharray: 6 4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.mismatch-area {
		fill: var(--color-surprise);
		opacity: 0.22;
		stroke: none;
	}

	.legend {
		fill: var(--color-text);
		font-size: 10px;
	}

	.controls {
		display: grid;
		gap: 0.75rem;
		margin: 1rem 0;
	}

	.explanation {
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		border-left: 3px solid var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 6%, transparent);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
</style>
