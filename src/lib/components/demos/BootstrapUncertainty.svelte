<script lang="ts">
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────────────
	const MAIN_W = 560;
	const MAIN_H = 300;
	const SIGMA_W = 560;
	const SIGMA_H = 120;
	const PAD = { top: 16, right: 20, bottom: 36, left: 52 };
	const SIGMA_PAD = { top: 10, right: 20, bottom: 36, left: 52 };
	const INNER_W = MAIN_W - PAD.left - PAD.right;
	const INNER_H = MAIN_H - PAD.top - PAD.bottom;
	const SIGMA_INNER_W = SIGMA_W - SIGMA_PAD.left - SIGMA_PAD.right;
	const SIGMA_INNER_H = SIGMA_H - SIGMA_PAD.top - SIGMA_PAD.bottom;

	const X_MIN = 0;
	const X_MAX = 5;
	const CURVE_POINTS = 200;
	const SMOOTH_WINDOW = 7;
	const MAX_BOOTSTRAP = 50;
	const SEED = 42;

	// ─── KaTeX formulas ─────────────────────────────────────────
	const F_SIGMA_X = String.raw`\sigma(x)`;
	const F_SIGMA_FORMULA = String.raw`\sigma(x) = \sqrt{\frac{1}{B}\sum_{b=1}^{B}\bigl(\hat{f}_b(x)-\bar{f}(x)\bigr)^2}`;
	const F_HETEROSCEDASTIC = String.raw`\varepsilon \sim \mathcal{N}\bigl(0,\, \sigma(x)^2\bigr)`;
	const F_DATA_GEN = String.raw`y = \sin(x) + \varepsilon`;
	const F_BOOTSTRAP = String.raw`\hat{f}_b(x)`;
	const F_MEAN = String.raw`\bar{f}(x)`;
	const F_BAND = String.raw`\bar{f}(x) \pm \sigma(x)`;



	function boxMuller(rng: () => number): number {
		let u = 0,
			v = 0;
		while (u === 0) u = rng();
		while (v === 0) v = rng();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}

	// ─── True model & noise ─────────────────────────────────────
	function trueModel(x: number): number {
		return Math.sin(x);
	}

	function noiseStd(x: number, level: number): number {
		// Heteroscedastic noise: standard deviation grows with x
		return level * (0.2 + (0.8 * (x - X_MIN)) / (X_MAX - X_MIN));
	}

	// ─── Smoothing (moving average) ─────────────────────────────
	function movingAverage(values: number[], window: number): number[] {
		const half = Math.floor(window / 2);
		const result: number[] = new Array(values.length);
		for (let i = 0; i < values.length; i++) {
			let sum = 0,
				count = 0;
			for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j++) {
				sum += values[j];
				count++;
			}
			result[i] = sum / count;
		}
		return result;
	}

	// ─── Data generation ────────────────────────────────────────
	interface DataPoint {
		x: number;
		y: number;
	}

	function generateData(numData: number, noiseLevel: number, seed: number): DataPoint[] {
		const rng = mulberry32(seed);
		const data: DataPoint[] = new Array(numData);
		for (let i = 0; i < numData; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			data[i] = { x, y };
		}
		// Sort by x for rendering
		data.sort((a, b) => a.x - b.x);
		return data;
	}

	// ─── Bootstrap: sample with replacement, fit via moving average ─
	type BootstrapCurve = number[]; // y-values at CURVE_POINTS uniformly spaced x

	function sampleWithReplacement(data: DataPoint[], rng: () => number): DataPoint[] {
		const sample: DataPoint[] = new Array(data.length);
		for (let i = 0; i < data.length; i++) {
			sample[i] = data[Math.floor(rng() * data.length)];
		}
		sample.sort((a, b) => a.x - b.x);
		return sample;
	}

	function fitBootstrap(sample: DataPoint[]): BootstrapCurve {
		// Evaluate on uniform grid, then smooth
		const rawValues: number[] = new Array(CURVE_POINTS);
		const step = (X_MAX - X_MIN) / (CURVE_POINTS - 1);

		for (let i = 0; i < CURVE_POINTS; i++) {
			const gx = X_MIN + i * step;
			// Local average of nearby sample points (kernel-like)
			const bandwidth = 0.4;
			let sum = 0,
				weightSum = 0;
			for (const pt of sample) {
				const dist = Math.abs(pt.x - gx);
				if (dist < bandwidth) {
					const w = 1 - dist / bandwidth; // linear kernel
					sum += w * pt.y;
					weightSum += w;
				}
			}
			rawValues[i] = weightSum > 0 ? sum / weightSum : trueModel(gx);
		}

		return movingAverage(rawValues, SMOOTH_WINDOW);
	}

	// ─── State ──────────────────────────────────────────────────
	let numData = $state(50);
	let noiseLevel = $state(1.0);
	let bootstrapCount = $state(0);
	let regenSeed = $state(0);

	// ─── Derived: data ──────────────────────────────────────────
	const data = $derived(generateData(numData, noiseLevel, SEED + regenSeed * 1000));

	// ─── Derived: bootstrap curves ──────────────────────────────
	const bootstrapCurves = $derived.by(() => {
		const curves: BootstrapCurve[] = [];
		const baseRng = mulberry32(SEED + regenSeed * 100 + 7);
		for (let b = 0; b < bootstrapCount; b++) {
			const sample = sampleWithReplacement(data, baseRng);
			curves.push(fitBootstrap(sample));
		}
		return curves;
	});

	// ─── Derived: mean and sigma(x) ─────────────────────────────
	const meanCurve = $derived.by(() => {
		if (bootstrapCurves.length === 0) return new Array(CURVE_POINTS).fill(0);
		const mean = new Array(CURVE_POINTS).fill(0);
		for (let i = 0; i < CURVE_POINTS; i++) {
			let sum = 0;
			for (const curve of bootstrapCurves) {
				sum += curve[i];
			}
			mean[i] = sum / bootstrapCurves.length;
		}
		return mean;
	});

	const sigmaX = $derived.by(() => {
		if (bootstrapCurves.length < 2) return new Array(CURVE_POINTS).fill(0);
		const sigma = new Array(CURVE_POINTS).fill(0);
		const B = bootstrapCurves.length;
		for (let i = 0; i < CURVE_POINTS; i++) {
			let sumSq = 0;
			const m = meanCurve[i];
			for (const curve of bootstrapCurves) {
				sumSq += (curve[i] - m) * (curve[i] - m);
			}
			sigma[i] = Math.sqrt(sumSq / B);
		}
		return sigma;
	});

	// ─── Derived: metrics ───────────────────────────────────────
	const sigmaMean = $derived(
		sigmaX.length > 0 ? sigmaX.reduce((a, b) => a + b, 0) / sigmaX.length : 0
	);
	const sigmaMin = $derived(sigmaX.length > 0 ? Math.min(...sigmaX) : 0);
	const sigmaMax = $derived(sigmaX.length > 0 ? Math.max(...sigmaX) : 0);

	// ─── Derived: y-range ───────────────────────────────────────
	const yRange = $derived.by(() => {
		let minY = Infinity,
			maxY = -Infinity;
		for (const pt of data) {
			if (pt.y < minY) minY = pt.y;
			if (pt.y > maxY) maxY = pt.y;
		}
		if (bootstrapCount > 0) {
			for (let i = 0; i < CURVE_POINTS; i++) {
				const lo = meanCurve[i] - sigmaX[i];
				const hi = meanCurve[i] + sigmaX[i];
				if (lo < minY) minY = lo;
				if (hi > maxY) maxY = hi;
			}
		}
		const margin = (maxY - minY) * 0.1 || 0.5;
		return { min: minY - margin, max: maxY + margin };
	});

	// ─── Mapping functions ──────────────────────────────────────
	function mapX(x: number): number {
		return PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
	}

	function mapY(y: number): number {
		return PAD.top + INNER_H - ((y - yRange.min) / (yRange.max - yRange.min)) * INNER_H;
	}

	function mapXSigma(x: number): number {
		return SIGMA_PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * SIGMA_INNER_W;
	}

	function mapYSigma(v: number, maxV: number): number {
		return SIGMA_PAD.top + SIGMA_INNER_H - (v / (maxV * 1.15 || 1)) * SIGMA_INNER_H;
	}

	// ─── Path builders ──────────────────────────────────────────
	const trueModelPath = $derived.by(() => {
		let d = '';
		const step = (X_MAX - X_MIN) / (CURVE_POINTS - 1);
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + i * step;
			const y = trueModel(x);
			const sx = mapX(x);
			const sy = mapY(y);
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		return d;
	});

	const meanCurvePath = $derived.by(() => {
		if (bootstrapCount === 0) return '';
		let d = '';
		const step = (X_MAX - X_MIN) / (CURVE_POINTS - 1);
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + i * step;
			const sx = mapX(x);
			const sy = mapY(meanCurve[i]);
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		return d;
	});

	const sigmaBandPath = $derived.by(() => {
		if (bootstrapCount < 2) return '';
		const step = (X_MAX - X_MIN) / (CURVE_POINTS - 1);
		// Upper boundary (left to right)
		let d = '';
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + i * step;
			const sx = mapX(x);
			const sy = mapY(meanCurve[i] + sigmaX[i]);
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		// Lower boundary (right to left)
		for (let i = CURVE_POINTS - 1; i >= 0; i--) {
			const x = X_MIN + i * step;
			const sx = mapX(x);
			const sy = mapY(meanCurve[i] - sigmaX[i]);
			d += 'L' + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		d += 'Z';
		return d;
	});

	const sigmaCurvePath = $derived.by(() => {
		if (bootstrapCount < 2) return '';
		let d = '';
		const step = (X_MAX - X_MIN) / (CURVE_POINTS - 1);
		const maxV = sigmaMax * 1.15 || 1;
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + i * step;
			const sx = mapXSigma(x);
			const sy = mapYSigma(sigmaX[i], maxV);
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		return d;
	});

	// ─── Sigma y-range ──────────────────────────────────────────
	const sigmaYMax = $derived(sigmaMax * 1.15 || 0.5);

	// ─── Bootstrap SVG line paths ───────────────────────────────
	const bootstrapLinePaths = $derived.by(() => {
		const paths: string[] = [];
		const step = (X_MAX - X_MIN) / (CURVE_POINTS - 1);
		for (const curve of bootstrapCurves) {
			let d = '';
			for (let i = 0; i < CURVE_POINTS; i++) {
				const x = X_MIN + i * step;
				const sx = mapX(x);
				const sy = mapY(curve[i]);
				d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
			}
			paths.push(d);
		}
		return paths;
	});

	// ─── Tick computation ───────────────────────────────────────
	const yTicks = $derived.by(() => {
		const range = yRange.max - yRange.min;
		const mag = Math.pow(10, Math.floor(Math.log10(range)));
		const norm = range / mag;
		let niceStep: number;
		if (norm < 1.5) niceStep = 0.5 * mag;
		else if (norm < 3) niceStep = 1 * mag;
		else if (norm < 7) niceStep = 2 * mag;
		else niceStep = 5 * mag;
		const ticks: number[] = [];
		const start = Math.ceil(yRange.min / niceStep) * niceStep;
		for (let v = start; v <= yRange.max; v += niceStep) {
			ticks.push(parseFloat(v.toFixed(10)));
		}
		return ticks;
	});

	const sigmaYTicks = $derived.by(() => {
		const range = sigmaYMax;
		const mag = Math.pow(10, Math.floor(Math.log10(range || 1)));
		const norm = range / mag;
		let niceStep: number;
		if (norm < 1.5) niceStep = 0.5 * mag;
		else if (norm < 3) niceStep = 1 * mag;
		else if (norm < 7) niceStep = 2 * mag;
		else niceStep = 5 * mag;
		const ticks: number[] = [];
		const start = 0;
		for (let v = start; v <= sigmaYMax; v += niceStep) {
			ticks.push(parseFloat(v.toFixed(10)));
		}
		return ticks;
	});

	// ─── Actions ────────────────────────────────────────────────
	function addBootstrap() {
		if (bootstrapCount < MAX_BOOTSTRAP) {
			bootstrapCount++;
		}
	}

	function regenerate() {
		regenSeed++;
		bootstrapCount = 0;
	}
</script>

<div class="bootstrap-uncertainty">
	<h3 class="demo-title">Incertitude locale par bootstrap σ(x)</h3>
	<p class="demo-subtitle">
		Estimation de l'incertitude locale par rééchantillonnage bootstrap — données générées selon
		<KatexInline formula={F_DATA_GEN} />, avec bruit hétéroscédastique
		<KatexInline formula={F_HETEROSCEDASTIC} />.
	</p>

	<div class="viz-area">
		<!-- ─── Main plot: data + bootstrap curves + σ band ─── -->
		{#snippet mainCaption()}
			{#if sigmaBandPath}
				<p class="cap">
					<strong>Bande d'incertitude</strong> — La région ombrée représente
					<KatexInline formula={F_BAND} /> estimée à partir de
					<KatexInline formula={F_BOOTSTRAP} /> (moyenne mobile, fenêtre = {SMOOTH_WINDOW}).
					L'écart-type bootstrap
					<KatexInline formula={F_SIGMA_FORMULA} /> capture l'hétéroscédasticité du bruit :
					<KatexInline formula={F_SIGMA_X} /> croît avec x.
				</p>
			{:else}
				<p class="cap">
					<strong>Bande d'incertitude</strong> — Ajoutez des échantillons bootstrap pour estimer σ(x).
				</p>
			{/if}
		{/snippet}

		<Figure type="chart" caption={mainCaption}>
			{#if MAIN_W > 0}
				<svg viewBox={`0 0 ${MAIN_W} ${MAIN_H}`} xmlns="http://www.w3.org/2000/svg">
					<defs>
						<clipPath id="bu-plot-clip">
							<rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} />
						</clipPath>
					</defs>

					<g clip-path="url(#bu-plot-clip)">
						<!-- σ(x) band -->
						{#if sigmaBandPath}
							<path d={sigmaBandPath} fill="var(--color-belief)" opacity="0.14" />
						{/if}

						<!-- Bootstrap curves -->
						{#each bootstrapLinePaths as path, i (i)}
							<path
								d={path}
								fill="none"
								stroke="var(--color-epistemic)"
								stroke-width="1"
								opacity="0.2"
							/>
						{/each}

						<!-- Mean of bootstrap predictions -->
						{#if meanCurvePath}
							<path d={meanCurvePath} fill="none" stroke="var(--color-belief)" stroke-width="2.2" />
						{/if}

						<!-- True model (ground truth) -->
						<path
							d={trueModelPath}
							fill="none"
							stroke="var(--color-text-muted)"
							stroke-width="1.5"
							stroke-dasharray="6,4"
						/>

						<!-- Data points -->
						{#each data as pt, i (i)}
							<circle
								cx={mapX(pt.x)}
								cy={mapY(pt.y)}
								r="3.5"
								fill="var(--color-text)"
								opacity="0.45"
							/>
						{/each}
					</g>

					<!-- Axes -->
					<line
						x1={PAD.left}
						y1={PAD.top + INNER_H}
						x2={PAD.left + INNER_W}
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

					<!-- X ticks -->
					{#each [0, 1, 2, 3, 4, 5] as tick}
						<text x={mapX(tick)} y={PAD.top + INNER_H + 18} text-anchor="middle" class="tick-label">
							{tick}
						</text>
					{/each}

					<!-- Y ticks -->
					{#each yTicks as tick}
						<text x={PAD.left - 8} y={mapY(tick) + 4} text-anchor="end" class="tick-label">
							{tick.toFixed(2)}
						</text>
						<line
							x1={PAD.left}
							y1={mapY(tick)}
							x2={PAD.left + INNER_W}
							y2={mapY(tick)}
							stroke="var(--color-border)"
							stroke-width="0.5"
							opacity="0.35"
						/>
					{/each}

					<!-- Axis labels -->
					<text x={PAD.left + INNER_W / 2} y={MAIN_H - 4} text-anchor="middle" class="axis-label">
						x
					</text>
					<text
						x={14}
						y={PAD.top + INNER_H / 2}
						text-anchor="middle"
						class="axis-label"
						transform={`rotate(-90, 14, ${PAD.top + INNER_H / 2})`}
					>
						y
					</text>
				</svg>
			{/if}
		</Figure>

		<!-- ─── Secondary plot: σ(x) vs x ─── -->
		{#snippet sigmaCaption()}
			<p class="cap">
				<strong>Profils de σ(x)</strong> — Écart-type des prédictions bootstrap en fonction de x. La croissance
				de σ(x) reflète l'augmentation du bruit hétéroscédastique.
			</p>
		{/snippet}

		<Figure type="chart" caption={sigmaCaption}>
			{#if SIGMA_W > 0}
				<svg viewBox={`0 0 ${SIGMA_W} ${SIGMA_H}`} xmlns="http://www.w3.org/2000/svg">
					<defs>
						<clipPath id="bu-sigma-clip">
							<rect
								x={SIGMA_PAD.left}
								y={SIGMA_PAD.top}
								width={SIGMA_INNER_W}
								height={SIGMA_INNER_H}
							/>
						</clipPath>
					</defs>

					<g clip-path="url(#bu-sigma-clip)">
						<!-- Fill under σ(x) -->
						{#if sigmaCurvePath}
							<path
								d={sigmaCurvePath +
									` L${mapXSigma(X_MAX)},${mapYSigma(0, sigmaYMax)} L${mapXSigma(X_MIN)},${mapYSigma(0, sigmaYMax)} Z`}
								fill="var(--color-belief)"
								opacity="0.1"
							/>
							<path d={sigmaCurvePath} fill="none" stroke="var(--color-belief)" stroke-width="2" />
						{/if}
					</g>

					<!-- Axes -->
					<line
						x1={SIGMA_PAD.left}
						y1={SIGMA_PAD.top + SIGMA_INNER_H}
						x2={SIGMA_PAD.left + SIGMA_INNER_W}
						y2={SIGMA_PAD.top + SIGMA_INNER_H}
						stroke="var(--color-border)"
						stroke-width="1"
					/>
					<line
						x1={SIGMA_PAD.left}
						y1={SIGMA_PAD.top}
						x2={SIGMA_PAD.left}
						y2={SIGMA_PAD.top + SIGMA_INNER_H}
						stroke="var(--color-border)"
						stroke-width="1"
					/>

					<!-- X ticks -->
					{#each [0, 1, 2, 3, 4, 5] as tick}
						<text
							x={mapXSigma(tick)}
							y={SIGMA_PAD.top + SIGMA_INNER_H + 18}
							text-anchor="middle"
							class="tick-label"
						>
							{tick}
						</text>
					{/each}

					<!-- Y ticks -->
					{#each sigmaYTicks as tick}
						<text
							x={SIGMA_PAD.left - 8}
							y={mapYSigma(tick, sigmaYMax) + 4}
							text-anchor="end"
							class="tick-label"
						>
							{tick.toFixed(2)}
						</text>
					{/each}

					<!-- Axis labels -->
					<text
						x={SIGMA_PAD.left + SIGMA_INNER_W / 2}
						y={SIGMA_H - 2}
						text-anchor="middle"
						class="axis-label"
					>
						x
					</text>
					<text
						x={10}
						y={SIGMA_PAD.top + SIGMA_INNER_H / 2}
						text-anchor="middle"
						class="axis-label"
						transform={`rotate(-90, 10, ${SIGMA_PAD.top + SIGMA_INNER_H / 2})`}
					>
						σ(x)
					</text>
				</svg>
			{/if}
		</Figure>
	</div>

	<!-- ─── Metrics ─── -->
	<div class="metrics-row">
		<div class="metric-card">
			<span class="metric-label">Bootstraps</span>
			<span class="metric-value">{bootstrapCount}/{MAX_BOOTSTRAP}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">σ moyen</span>
			<span class="metric-value">{sigmaMean.toFixed(3)}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">σ min</span>
			<span class="metric-value">{sigmaMin.toFixed(3)}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">σ max</span>
			<span class="metric-value">{sigmaMax.toFixed(3)}</span>
		</div>
	</div>

	<!-- ─── Controls ─── -->
	<SliderGrid variant="outline">
		<div class="grp">
			<Slider bind:value={numData} min={20} max={100} step={1} label="Nbre de données" />
			<Slider bind:value={noiseLevel} min={0.2} max={3} step={0.1} label="Niveau de bruit" />
		</div>
		<div class="grp">
			<div class="btn-row">
				<button
					class="action-btn primary"
					disabled={bootstrapCount >= MAX_BOOTSTRAP}
					onclick={addBootstrap}
				>
					Ajouter bootstrap
				</button>
				<button class="action-btn secondary" onclick={regenerate}> Régénérer </button>
			</div>
			{#if bootstrapCount >= MAX_BOOTSTRAP}
				<span class="hint-text">Maximum ({MAX_BOOTSTRAP}) atteint</span>
			{/if}
		</div>
	</SliderGrid>

	<!-- ─── Legend ─── -->
	<div class="legend">
		<div class="legend-item">
			<span class="legend-swatch legend-data"></span>
			<span class="legend-text">Données observées</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-true"></span>
			<span class="legend-text">Modèle vrai sin(x)</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-bootstrap"></span>
			<span class="legend-text">Courbes bootstrap</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-mean"></span>
			<span class="legend-text"><KatexInline formula={F_MEAN} /></span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-band"></span>
			<span class="legend-text"><KatexInline formula={F_BAND} /></span>
		</div>
	</div>
</div>

<style>
	.bootstrap-uncertainty {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 640px;
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

	/* ─── Visualization ─── */
	.viz-area {
		width: 100%;
	}

	/* ─── Metrics Row ─── */
	.metrics-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	.metric-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.65rem 0.5rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
		text-align: center;
	}

	.metric-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.metric-value {
		font-family: var(--font-mono);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-text);
		transition: color 0.2s ease;
	}

	/* ─── Controls ─── */
	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.btn-row {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.85rem;
		font-size: 0.82rem;
		font-weight: 600;
		border: none;
		border-radius: var(--radius-sm, 6px);
		cursor: pointer;
		transition:
			opacity 0.15s ease,
			transform 0.1s ease;
	}

	.action-btn:active {
		transform: scale(0.97);
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-btn.primary {
		color: var(--color-bg);
		background: var(--color-belief);
	}

	.action-btn.secondary {
		color: var(--color-text);
		background: var(--color-surface-2, transparent);
		border: 1px solid var(--color-border);
	}

	.action-btn.primary:hover:not(:disabled) {
		opacity: 0.85;
	}

	.action-btn.secondary:hover:not(:disabled) {
		opacity: 0.8;
	}

	.hint-text {
		font-size: 0.7rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		margin-top: 0.15rem;
	}

	/* ─── Legend ─── */
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem 1.2rem;
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

	.legend-data {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-text);
		opacity: 0.45;
	}

	.legend-true {
		width: 20px;
		height: 0;
		border-top: 2px dashed var(--color-text-muted);
	}

	.legend-bootstrap {
		width: 20px;
		height: 1px;
		background: var(--color-epistemic);
		opacity: 0.5;
	}

	.legend-mean {
		width: 20px;
		height: 2.5px;
		background: var(--color-belief);
		border-radius: 2px;
	}

	.legend-band {
		width: 20px;
		height: 10px;
		background: var(--color-belief);
		opacity: 0.18;
		border-radius: 2px;
	}

	/* ─── SVG text ─── */
	.tick-label {
		font-size: 10px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono);
		user-select: none;
	}

	.axis-label {
		font-size: 12px;
		fill: var(--color-text-muted);
		user-select: none;
	}

	/* ─── Caption ─── */
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.65;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.cap strong {
		color: var(--color-text);
		font-style: normal;
	}

	/* ─── Responsive ─── */
	@media (max-width: 520px) {
		.metrics-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.legend {
			flex-direction: column;
			align-items: flex-start;
		}

		.btn-row {
			flex-direction: column;
		}
	}
</style>
