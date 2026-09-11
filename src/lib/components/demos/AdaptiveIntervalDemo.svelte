<script lang="ts">
	import { constantInterval } from '$lib/math/regression-conformal';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────────────
	const PLOT_W = 420;
	const PLOT_H = 290;
	const PAD = { top: 32, right: 16, bottom: 36, left: 48 };
	const INNER_W = PLOT_W - PAD.left - PAD.right; // 356
	const INNER_H = PLOT_H - PAD.top - PAD.bottom; // 222

	const X_MIN = 0;
	const X_MAX = 5;
	const CURVE_POINTS = 150;
	const NUM_TRAIN = 80;
	const NUM_TEST = 120;

	// ─── KaTeX formulas (constants to avoid brace issues) ──────
	const F_ALPHA = String.raw`1 - \alpha`;
	const F_CONST = String.raw`[\hat{f}(x) - \hat{q},\ \hat{f}(x) + \hat{q}]`;
	const F_ADAPT = String.raw`[\hat{f}(x) - \hat{q}\cdot\sigma(x),\ \hat{f}(x) + \hat{q}\cdot\sigma(x)]`;
	const F_MODEL = String.raw`\hat{f}(x) = \sin(x)`;
	const F_SIGMA = String.raw`\sigma(x) = \sigma_0(0.05 + 1.8\,(x/5)^2)`;
	const F_NOISE = String.raw`y = \sin(x) + \varepsilon,\ \varepsilon \sim \mathcal{N}(0, \sigma(x))`;
	const F_RESIDUAL = String.raw`|y_i - \hat{f}(x_i)|`;
	const F_COVERAGE = String.raw`P(y \in C(x)) \geq 1 - \alpha`;
	const F_NORM_SCORE = String.raw`|y_i - \hat{f}(x_i)| / \sigma(x_i)`;



	function boxMuller(rng: () => number): number {
		let u = 0,
			v = 0;
		while (u === 0) u = rng();
		while (v === 0) v = rng();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}

	// ─── True model & heteroscedastic noise ─────────────────────
	function trueModel(x: number): number {
		return Math.sin(x);
	}

	// Quadratic-in-x noise, matching Démo 11.4: variance is dominated by position much
	// more strongly than a linear model would give. At x=0 the data is nearly
	// noiseless; by x=X_MAX the noise has grown ~35x. This makes the contrast between
	// the constant and adaptive bands dramatic rather than subtle.
	function noiseStd(x: number, level: number): number {
		return level * (0.05 + 1.8 * ((x - X_MIN) / (X_MAX - X_MIN)) ** 2);
	}

	// ─── Data interfaces ────────────────────────────────────────
	interface GeneratedData {
		trainX: number[];
		trainY: number[];
		calX: number[];
		calY: number[];
		testX: number[];
		testY: number[];
	}

	interface TestDataPoint {
		x: number;
		y: number;
		pred: number;
		lower: number;
		upper: number;
		covered: boolean;
	}

	// ─── Data generation ────────────────────────────────────────
	function generateData(seed: number, noiseLevel: number, calSize: number): GeneratedData {
		const rng = mulberry32(seed);

		const trainX: number[] = [];
		const trainY: number[] = [];
		for (let i = 0; i < NUM_TRAIN; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			trainX.push(x);
			trainY.push(y);
		}

		const calX: number[] = [];
		const calY: number[] = [];
		for (let i = 0; i < calSize; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			calX.push(x);
			calY.push(y);
		}

		const testX: number[] = [];
		const testY: number[] = [];
		for (let i = 0; i < NUM_TEST; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			testX.push(x);
			testY.push(y);
		}

		return { trainX, trainY, calX, calY, testX, testY };
	}

	// ─── Adaptive interval (self-contained) ──────────────────────
	// Implemented directly here rather than through the imported `adaptiveInterval`,
	// whose exact signature isn't visible to us. The previous version of this file
	// called that external function and then had to *reverse-engineer* qHat from its
	// output half-width divided by mean(calSigma) — a strong sign the call was never
	// on solid footing. This version computes and returns qHat directly, no guessing
	// required:
	//   s_i = |y_i - pred_i| / (sigma_i + eps)
	//   Q   = the ceil((n+1)(1-alpha))-th order statistic of {s_i} (clamped to n)
	//   interval(x) = [pred(x) - Q*(sigma(x)+eps), pred(x) + Q*(sigma(x)+eps)]
	function computeAdaptiveInterval(
		calPreds: number[],
		calY: number[],
		calSigmaArr: number[],
		testPreds: number[],
		testSigmaArr: number[],
		alphaLevel: number
	): { lowerBounds: number[]; upperBounds: number[]; qHat: number; eps: number } {
		const n = calY.length;
		// eps scales with the typical calibration sigma rather than being a fixed
		// absolute constant, so it stays negligible regardless of the noiseLevel slider.
		const meanCalSigma = calSigmaArr.reduce((a, b) => a + b, 0) / Math.max(1, calSigmaArr.length);
		const eps = Math.max(1e-6, 0.02 * meanCalSigma);
		const scores = calY.map((y, i) => Math.abs(y - calPreds[i]) / (calSigmaArr[i] + eps));
		const sorted = [...scores].sort((a, b) => a - b);
		const kIndex = Math.min(n, Math.ceil((n + 1) * (1 - alphaLevel)));
		const Q = sorted[Math.max(0, kIndex - 1)];

		const lowerBounds = testPreds.map((p, i) => p - Q * (testSigmaArr[i] + eps));
		const upperBounds = testPreds.map((p, i) => p + Q * (testSigmaArr[i] + eps));
		return { lowerBounds, upperBounds, qHat: Q, eps };
	}

	// ─── Coverage (self-contained) ────────────────────────────────
	// Computed locally with the same inclusive convention used for the per-point
	// `covered` flags elsewhere in this file, instead of the imported
	// conditionalCoverageRate whose exact convention we can't verify.
	function localCoverageRate(pairs: [number, number][], yTrue: number[]): number {
		let covered = 0;
		for (let i = 0; i < pairs.length; i++) {
			if (yTrue[i] >= pairs[i][0] && yTrue[i] <= pairs[i][1]) covered++;
		}
		return pairs.length > 0 ? covered / pairs.length : 0;
	}

	// ─── State ──────────────────────────────────────────────────
	let alpha = $state(0.05);
	let calSize = $state(80);
	let noiseLevel = $state(1.0);
	let regenCount = $state(0);

	// ─── Derived: raw data ──────────────────────────────────────
	const raw = $derived(generateData(42 + regenCount * 1000, noiseLevel, calSize));

	// ─── Derived: model predictions ─────────────────────────────
	const calPreds = $derived(raw.calX.map((x) => trueModel(x)));
	const testPreds = $derived(raw.testX.map((x) => trueModel(x)));

	// ─── Derived: sigma (true local noise scale) ─────────────────
	// This demo compares interval-CONSTRUCTION strategies (constant vs. adaptive), not
	// sigma-ESTIMATION quality — that's covered separately by the Bootstrap demo
	// (11.3). Just like calPreds/testPreds already use the oracle mean trueModel(x)
	// rather than a fitted regressor, sigma here uses the true noiseStd(x, level)
	// formula directly rather than a noisy windowed estimate. This also removes a
	// real bug the windowed version caused downstream: the adaptive band was being
	// drawn by indexing a test-point sigma array by *position* while sweeping
	// *x* smoothly — since raw.testX is never sorted, that picked essentially
	// unrelated sigma values as x moved across the plot. Calling noiseStd(x, level)
	// directly at each plotted x sidesteps that indexing problem entirely.
	const calSigma = $derived(raw.calX.map((x) => noiseStd(x, noiseLevel)));
	const testSigma = $derived(raw.testX.map((x) => noiseStd(x, noiseLevel)));

	// ─── Derived: constant intervals ────────────────────────────
	const constIntervals = $derived(constantInterval(calPreds, raw.calY, testPreds, alpha));

	// ─── Derived: adaptive intervals ────────────────────────────
	const adaptIntervals = $derived(
		computeAdaptiveInterval(calPreds, raw.calY, calSigma, testPreds, testSigma, alpha)
	);

	// ─── Derived: coverage rates ────────────────────────────────
	const constPairs = $derived(
		raw.testX.map((_, i): [number, number] => [
			constIntervals.lowerBounds[i],
			constIntervals.upperBounds[i]
		]) as [number, number][]
	);
	const constCoverage = $derived(localCoverageRate(constPairs, raw.testY));

	const adaptPairs = $derived(
		raw.testX.map((_, i): [number, number] => [
			adaptIntervals.lowerBounds[i],
			adaptIntervals.upperBounds[i]
		]) as [number, number][]
	);
	const adaptCoverage = $derived(localCoverageRate(adaptPairs, raw.testY));

	// ─── Derived: interval widths ───────────────────────────────
	const constHalfWidth = $derived(
		(constIntervals.upperBounds[0] - constIntervals.lowerBounds[0]) / 2
	);

	const adaptHalfWidths = $derived(
		raw.testX.map((_, i) => (adaptIntervals.upperBounds[i] - adaptIntervals.lowerBounds[i]) / 2)
	);
	const adaptAvgWidth = $derived(
		adaptHalfWidths.reduce((a, b) => a + b, 0) / adaptHalfWidths.length
	);

	// ─── Derived: test points (constant method) ─────────────────
	const constPoints = $derived(
		raw.testX.map((x, i): TestDataPoint => {
			return {
				x,
				y: raw.testY[i],
				pred: testPreds[i],
				lower: constIntervals.lowerBounds[i],
				upper: constIntervals.upperBounds[i],
				covered:
					raw.testY[i] >= constIntervals.lowerBounds[i] &&
					raw.testY[i] <= constIntervals.upperBounds[i]
			};
		})
	);

	// ─── Derived: test points (adaptive method) ─────────────────
	const adaptPoints = $derived(
		raw.testX.map((x, i): TestDataPoint => {
			return {
				x,
				y: raw.testY[i],
				pred: testPreds[i],
				lower: adaptIntervals.lowerBounds[i],
				upper: adaptIntervals.upperBounds[i],
				covered:
					raw.testY[i] >= adaptIntervals.lowerBounds[i] &&
					raw.testY[i] <= adaptIntervals.upperBounds[i]
			};
		})
	);

	// ─── Derived: shared Y range ────────────────────────────────
	const yRange = $derived({
		min: Math.min(...raw.testY, ...constIntervals.lowerBounds, ...adaptIntervals.lowerBounds) - 0.3,
		max: Math.max(...raw.testY, ...constIntervals.upperBounds, ...adaptIntervals.upperBounds) + 0.3
	});

	// ─── SVG path builders ──────────────────────────────────────
	function buildTrueModelPath(yrMin: number, yrMax: number, offsetX: number): string {
		let d = '';
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x);
			const sx = offsetX + PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		return d;
	}

	function buildConstantBandPath(q: number, yrMin: number, yrMax: number, offsetX: number): string {
		let d = '';
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x) + q;
			const sx = offsetX + PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		for (let i = CURVE_POINTS - 1; i >= 0; i--) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x) - q;
			const sx = offsetX + PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += 'L' + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		d += 'Z';
		return d;
	}

	// Draws the adaptive band by evaluating sigma at the exact x being plotted via
	// noiseStd(x, level) — NOT by indexing a data-derived sigma array by position.
	// The previous version indexed adaptSigma (aligned with the unsorted raw.testX)
	// by `floor(t * length)` while sweeping x smoothly from 0 to X_MAX, which paired
	// each plotted x with an essentially unrelated test point's sigma. Calling the
	// formula directly is both correct and simpler.
	function buildAdaptiveBandPath(
		qHat: number,
		eps: number,
		noiseLevelVal: number,
		yrMin: number,
		yrMax: number,
		offsetX: number
	): string {
		let d = '';
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x) + qHat * (noiseStd(x, noiseLevelVal) + eps);
			const sx = offsetX + PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		for (let i = CURVE_POINTS - 1; i >= 0; i--) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x) - qHat * (noiseStd(x, noiseLevelVal) + eps);
			const sx = offsetX + PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += 'L' + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		d += 'Z';
		return d;
	}

	// ─── Derived: SVG data ──────────────────────────────────────
	function computeNiceTicks(min: number, max: number): number[] {
		const range = max - min;
		const rawStep = range / 6;
		const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
		const norm = rawStep / mag;
		const niceStep = norm <= 1.5 ? mag : norm <= 3 ? 2 * mag : norm <= 7 ? 5 * mag : 10 * mag;
		const ticks: number[] = [];
		const start = Math.ceil(min / niceStep) * niceStep;
		for (let v = start; v <= max; v += niceStep) {
			ticks.push(parseFloat(v.toFixed(4)));
		}
		return ticks;
	}

	const yTicks = $derived(computeNiceTicks(yRange.min, yRange.max));
	const curvePathL = $derived(buildTrueModelPath(yRange.min, yRange.max, 0));
	const curvePathR = $derived(buildTrueModelPath(yRange.min, yRange.max, PLOT_W + 16));
	const constBandPath = $derived(buildConstantBandPath(constHalfWidth, yRange.min, yRange.max, 0));
	const adaptBandPath = $derived(
		buildAdaptiveBandPath(
			adaptIntervals.qHat,
			adaptIntervals.eps,
			noiseLevel,
			yRange.min,
			yRange.max,
			PLOT_W + 16
		)
	);

	// ─── Derived: outlier counts ────────────────────────────────
	const constOutliers = $derived(constPoints.filter((p) => !p.covered).length);
	const adaptOutliers = $derived(adaptPoints.filter((p) => !p.covered).length);

	// ─── Mapping helpers ────────────────────────────────────────
	function mapX(x: number): number {
		return PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
	}

	function mapY(y: number): number {
		return PAD.top + ((yRange.max - y) / (yRange.max - yRange.min)) * INNER_H;
	}

	// ─── Actions ────────────────────────────────────────────────
	function regenerate() {
		regenCount++;
	}
</script>

<div class="adaptive-demo">
	<!-- ════════════════ Title ════════════════ -->
	<h3 class="demo-title">Intervalles de prédiction constants vs adaptatifs</h3>
	<p class="demo-subtitle">
		Modèle synthétique <KatexInline formula={F_NOISE} /> avec bruit hétéroscédastique <KatexInline
			formula={F_SIGMA}
		/>. La variabilité augmente fortement avec x.
	</p>

	<!-- ════════════════ Side-by-side SVG ════════════════ -->
	<div class="plots-container">
		<!-- ── Shared SVG ── -->
		<svg
			class="dual-plot"
			viewBox={`0 0 ${PLOT_W * 2 + 16} ${PLOT_H}`}
			width="100%"
			height={PLOT_H}
			role="img"
			aria-label="Comparaison côte à côte : intervalles constants vs adaptatifs"
		>
			<defs>
				<clipPath id="const-clip">
					<rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} />
				</clipPath>
				<clipPath id="adapt-clip">
					<rect x={PLOT_W + 16 + PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} />
				</clipPath>
			</defs>

			<!-- ═══ LEFT: Constant ═══ -->
			<!-- Plot background -->
			<rect
				x="0"
				y="0"
				width={PLOT_W}
				height={PLOT_H}
				rx="6"
				fill="var(--color-surface-2, transparent)"
				stroke="var(--color-border)"
				stroke-width="0.8"
			/>
			<!-- Title -->
			<text x={PAD.left} y={PAD.top - 14} font-size="11" font-weight="700" fill="var(--color-text)"
				>Constant</text
			>

			<g clip-path="url(#const-clip)">
				<!-- Constant band -->
				<path d={constBandPath} fill="var(--color-belief)" opacity="0.13" />
				<!-- True model curve -->
				<path d={curvePathL} fill="none" stroke="var(--color-belief)" stroke-width="2" />
				<!-- Calibration points -->
				{#each raw.calX as cx, i}
					<circle
						cx={mapX(cx)}
						cy={mapY(raw.calY[i])}
						r="2.2"
						fill="var(--color-text-muted)"
						opacity="0.3"
					/>
				{/each}
				<!-- Test points — covered -->
				{#each constPoints as p, i (i)}
					{#if p.covered}
						<circle cx={mapX(p.x)} cy={mapY(p.y)} r="3" fill="var(--color-text)" opacity="0.35" />
					{/if}
				{/each}
				<!-- Test points — outliers -->
				{#each constPoints as p, i (i)}
					{#if !p.covered}
						<circle
							cx={mapX(p.x)}
							cy={mapY(p.y)}
							r="4.2"
							fill="var(--color-surprise)"
							stroke="var(--color-surprise)"
							stroke-width="2"
							opacity="0.85"
						/>
					{/if}
				{/each}
			</g>

			<!-- Axes (left) -->
			<line
				x1={PAD.left}
				y1={PAD.top + INNER_H}
				x2={PLOT_W - PAD.right}
				y2={PAD.top + INNER_H}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<line
				x1={PAD.left}
				y1={PAD.top}
				x2={PAD.left}
				y2={PAD.top + INNER_H}
				stroke="var(--color-border)"
				stroke-width="1"
			/>

			<!-- X axis ticks (left) -->
			{#each [0, 1, 2, 3, 4, 5] as tick}
				<text
					x={mapX(tick)}
					y={PAD.top + INNER_H + 18}
					text-anchor="middle"
					font-size="9"
					font-family="var(--font-mono)"
					fill="var(--color-text-muted)">{tick}</text
				>
			{/each}

			<!-- Y axis ticks (left) -->
			{#each yTicks as tick}
				<text
					x={PAD.left - 6}
					y={mapY(tick) + 3}
					text-anchor="end"
					font-size="8"
					font-family="var(--font-mono)"
					fill="var(--color-text-muted)">{tick.toFixed(1)}</text
				>
			{/each}

			<!-- X label (left) -->
			<text
				x={PAD.left + INNER_W / 2}
				y={PLOT_H - 4}
				text-anchor="middle"
				font-size="10"
				fill="var(--color-text-muted)">x</text
			>

			<!-- Coverage badge (left) -->
			<rect
				x={PLOT_W - PAD.right - 110}
				y={PAD.top + 4}
				width="106"
				height="22"
				rx="4"
				fill="var(--color-surface-2, #1a1a2e)"
				stroke="var(--color-border)"
				stroke-width="0.6"
				opacity="0.9"
			/>
			<text
				x={PLOT_W - PAD.right - 7}
				y={PAD.top + 19}
				text-anchor="end"
				font-size="9"
				font-weight="600"
				font-family="var(--font-mono)"
				fill={constCoverage >= 1 - alpha ? 'var(--color-positive)' : 'var(--color-surprise)'}
			>
				Couverture : {(constCoverage * 100).toFixed(1)}%
			</text>

			<!-- ═══ RIGHT: Adaptatif ═══ -->
			<!-- Plot background -->
			<rect
				x={PLOT_W + 16}
				y="0"
				width={PLOT_W}
				height={PLOT_H}
				rx="6"
				fill="var(--color-surface-2, transparent)"
				stroke="var(--color-border)"
				stroke-width="0.8"
			/>
			<!-- Title -->
			<text
				x={PLOT_W + 16 + PAD.left}
				y={PAD.top - 14}
				font-size="11"
				font-weight="700"
				fill="var(--color-epistemic)">Adaptatif</text
			>

			<g clip-path="url(#adapt-clip)">
				<!-- Adaptive band -->
				<path d={adaptBandPath} fill="var(--color-epistemic)" opacity="0.13" />
				<!-- True model curve -->
				<path d={curvePathR} fill="none" stroke="var(--color-epistemic)" stroke-width="2" />
				<!-- Calibration points (offset) -->
				{#each raw.calX as cx, i}
					<circle
						cx={PLOT_W + 16 + mapX(cx)}
						cy={mapY(raw.calY[i])}
						r="2.2"
						fill="var(--color-text-muted)"
						opacity="0.3"
					/>
				{/each}
				<!-- Test points — covered -->
				{#each adaptPoints as p, i (i)}
					{#if p.covered}
						<circle
							cx={PLOT_W + 16 + mapX(p.x)}
							cy={mapY(p.y)}
							r="3"
							fill="var(--color-text)"
							opacity="0.35"
						/>
					{/if}
				{/each}
				<!-- Test points — outliers -->
				{#each adaptPoints as p, i (i)}
					{#if !p.covered}
						<circle
							cx={PLOT_W + 16 + mapX(p.x)}
							cy={mapY(p.y)}
							r="4.2"
							fill="var(--color-surprise)"
							stroke="var(--color-surprise)"
							stroke-width="2"
							opacity="0.85"
						/>
					{/if}
				{/each}
			</g>

			<!-- Axes (right) -->
			<line
				x1={PLOT_W + 16 + PAD.left}
				y1={PAD.top + INNER_H}
				x2={PLOT_W + 16 + PLOT_W - PAD.right}
				y2={PAD.top + INNER_H}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<line
				x1={PLOT_W + 16 + PAD.left}
				y1={PAD.top}
				x2={PLOT_W + 16 + PAD.left}
				y2={PAD.top + INNER_H}
				stroke="var(--color-border)"
				stroke-width="1"
			/>

			<!-- X axis ticks (right) -->
			{#each [0, 1, 2, 3, 4, 5] as tick}
				<text
					x={PLOT_W + 16 + mapX(tick)}
					y={PAD.top + INNER_H + 18}
					text-anchor="middle"
					font-size="9"
					font-family="var(--font-mono)"
					fill="var(--color-text-muted)">{tick}</text
				>
			{/each}

			<!-- Y axis ticks (right) -->
			{#each yTicks as tick}
				<text
					x={PLOT_W + 16 + PAD.left - 6}
					y={mapY(tick) + 3}
					text-anchor="end"
					font-size="8"
					font-family="var(--font-mono)"
					fill="var(--color-text-muted)">{tick.toFixed(1)}</text
				>
			{/each}

			<!-- X label (right) -->
			<text
				x={PLOT_W + 16 + PAD.left + INNER_W / 2}
				y={PLOT_H - 4}
				text-anchor="middle"
				font-size="10"
				fill="var(--color-text-muted)">x</text
			>

			<!-- Coverage badge (right) -->
			<rect
				x={PLOT_W + 16 + PLOT_W - PAD.right - 110}
				y={PAD.top + 4}
				width="106"
				height="22"
				rx="4"
				fill="var(--color-surface-2, #1a1a2e)"
				stroke="var(--color-border)"
				stroke-width="0.6"
				opacity="0.9"
			/>
			<text
				x={PLOT_W + 16 + PLOT_W - PAD.right - 7}
				y={PAD.top + 19}
				text-anchor="end"
				font-size="9"
				font-weight="600"
				font-family="var(--font-mono)"
				fill={adaptCoverage >= 1 - alpha ? 'var(--color-positive)' : 'var(--color-surprise)'}
			>
				Couverture : {(adaptCoverage * 100).toFixed(1)}%
			</text>
		</svg>
	</div>

	<!-- ════════════════ Metrics Panel ════════════════ -->
	<div class="metrics-section">
		<div class="metrics-label-row">
			<span class="metrics-section-title">Méthode</span>
			<span class="metrics-section-title">Couverture</span>
			<span class="metrics-section-title">Largeur moy.</span>
			<span class="metrics-section-title">Hors intervalle</span>
		</div>
		<div class="metrics-row">
			<div class="metric-card">
				<span class="metric-method">Constant</span>
				<span
					class="metric-value"
					class:ok={constCoverage >= 1 - alpha}
					class:low={constCoverage < 1 - alpha}
				>
					{(constCoverage * 100).toFixed(1)}%
				</span>
				<span class="metric-width">{constHalfWidth.toFixed(3)}</span>
				<span class="metric-outliers">{constOutliers}</span>
			</div>
			<div class="metric-card">
				<span class="metric-method accent">Adaptatif</span>
				<span
					class="metric-value"
					class:ok={adaptCoverage >= 1 - alpha}
					class:low={adaptCoverage < 1 - alpha}
				>
					{(adaptCoverage * 100).toFixed(1)}%
				</span>
				<span class="metric-width">{adaptAvgWidth.toFixed(3)}</span>
				<span class="metric-outliers">{adaptOutliers}</span>
			</div>
		</div>
		<div class="metrics-target">
			Cible de couverture &ge; {(1 - alpha) * 100}% (niveau <KatexInline formula={F_ALPHA} />)
		</div>
	</div>

	<!-- ════════════════ Controls ════════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Paramètres</div>
			<Slider bind:value={alpha} min={0.01} max={0.5} step={0.01} label="α (alpha)" unit="" />
			<Slider
				bind:value={noiseLevel}
				min={0.2}
				max={3}
				step={0.1}
				label="Niveau de bruit (σ₀)"
				unit=""
			/>
		</div>
		<div class="grp">
			<div class="gttl">Données</div>
			<div class="regen-wrap">
				<button class="regen-btn" onclick={regenerate}> ↻ Régénérer </button>
				<span class="regen-hint">
					seed = {42 + regenCount * 1000}
				</span>
			</div>
			<div class="dataset-info">
				<span>Entraînement : {NUM_TRAIN}</span>
				<span>Calibration : {calSize}</span>
				<span>Test : {NUM_TEST}</span>
			</div>
		</div>
	</SliderGrid>

	<!-- ════════════════ Legend ════════════════ -->
	<div class="legend">
		<div class="legend-item">
			<span class="legend-swatch legend-curve-const"></span>
			<span class="legend-text">Courbe <KatexInline formula={F_MODEL} /> (constant)</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-curve-adapt"></span>
			<span class="legend-text">Courbe <KatexInline formula={F_MODEL} /> (adaptatif)</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-band-const"></span>
			<span class="legend-text">Bande constante <KatexInline formula={F_CONST} /></span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-band-adapt"></span>
			<span class="legend-text">Bande adaptative <KatexInline formula={F_ADAPT} /></span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-covered"></span>
			<span class="legend-text">Point test couvert</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-outlier"></span>
			<span class="legend-text">Point test hors intervalle</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-cal"></span>
			<span class="legend-text">Points calibration</span>
		</div>
	</div>

	<!-- ════════════════ Caption ════════════════ -->
	<p class="cap">
		<strong>Comparaison intervalles constants vs adaptatifs.</strong>
		L'approche constante utilise un quantile unique <KatexInline formula={F_RESIDUAL} /> pour tous les
		points, produisant une bande de largeur uniforme. L'approche adaptative utilise directement l'écart-type
		local <KatexInline formula={F_SIGMA} /> du modèle génératif, puis normalise les scores de conformité
		<KatexInline formula={F_NORM_SCORE} /> avant de calculer le quantile. La bande adaptative est beaucoup
		plus étroite là où le bruit est faible (près de x=0) et s'élargit là où il est fort (près de x=5),
		offrant une calibration bien plus fine sous forte hétéroscédasticité. Dans les deux cas, on vise
		<KatexInline formula={F_COVERAGE} />.
	</p>
</div>

<style>
	.adaptive-demo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 880px;
		margin: 0 auto;
	}

	.demo-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.demo-subtitle {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	/* ─── Plots ─── */
	.plots-container {
		width: 100%;
		overflow-x: auto;
	}

	.dual-plot {
		display: block;
		min-width: 600px;
	}

	/* ─── Metrics ─── */
	.metrics-section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.metrics-label-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		padding: 0 0.5rem;
	}

	.metrics-section-title {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		text-align: center;
		padding-bottom: 0.3rem;
		border-bottom: 1px solid var(--color-border);
	}

	.metrics-section-title:first-child {
		text-align: left;
	}

	.metrics-row {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.metric-card {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 0.5rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
	}

	.metric-method {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.metric-method.accent {
		color: var(--color-epistemic);
	}

	.metric-value {
		font-family: var(--font-mono);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
		text-align: center;
	}

	.metric-value.ok {
		color: var(--color-positive);
	}

	.metric-value.low {
		color: var(--color-surprise);
	}

	.metric-width {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-align: center;
	}

	.metric-outliers {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-align: center;
	}

	.metrics-target {
		font-size: 0.72rem;
		color: var(--color-text-muted);
		text-align: center;
		padding-top: 0.15rem;
	}

	/* ─── Controls ─── */
	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gttl {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: 0.15rem;
	}

	.regen-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.regen-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.85rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-bg);
		background: var(--color-belief);
		border: none;
		border-radius: var(--radius-sm, 6px);
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.regen-btn:hover {
		opacity: 0.85;
	}

	.regen-hint {
		font-size: 0.7rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
	}

	.dataset-info {
		display: flex;
		justify-content: space-around;
		padding: 0.4rem 0;
		font-size: 0.72rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		border-top: 1px solid var(--color-border);
		margin-top: 0.25rem;
	}

	/* ─── Legend ─── */
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.2rem;
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.legend-swatch {
		flex-shrink: 0;
	}

	.legend-curve-const {
		width: 20px;
		height: 3px;
		background: var(--color-belief);
		border-radius: 2px;
	}

	.legend-curve-adapt {
		width: 20px;
		height: 3px;
		background: var(--color-epistemic);
		border-radius: 2px;
	}

	.legend-band-const {
		width: 20px;
		height: 10px;
		background: var(--color-belief);
		opacity: 0.18;
		border-radius: 2px;
	}

	.legend-band-adapt {
		width: 20px;
		height: 10px;
		background: var(--color-epistemic);
		opacity: 0.18;
		border-radius: 2px;
	}

	.legend-covered {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-text);
		opacity: 0.5;
	}

	.legend-outlier {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-surprise);
		border: 2px solid var(--color-surprise);
	}

	.legend-cal {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-text-muted);
		opacity: 0.4;
	}

	/* ─── Caption ─── */
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.65;
		color: var(--color-text-muted);
	}

	.cap strong {
		color: var(--color-text);
	}

	/* ─── Responsive ─── */
	@media (max-width: 760px) {
		.metrics-section-title:nth-child(4),
		.metric-outliers {
			display: none;
		}

		.metrics-label-row {
			grid-template-columns: 1fr 1fr 1fr;
		}

		.metric-card {
			grid-template-columns: 1fr 1fr 1fr;
		}
	}

	@media (max-width: 520px) {
		.legend {
			flex-direction: column;
			align-items: flex-start;
		}

		.metrics-section-title:nth-child(3) {
			display: none;
		}
		.metrics-section-title:nth-child(4) {
			display: none !important;
		}

		.metrics-label-row {
			grid-template-columns: 1fr 1fr 1fr 1fr;
		}

		.metric-width {
			display: none;
		}
	}
</style>
