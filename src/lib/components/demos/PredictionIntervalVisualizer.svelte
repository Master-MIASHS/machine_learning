<script lang="ts">
	import { constantInterval, conditionalCoverageRate } from '$lib/math/regression-conformal';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────────────
	const PLOT_W = 560;
	const PLOT_H = 340;
	const PAD = { top: 16, right: 20, bottom: 40, left: 52 };
	const INNER_W = PLOT_W - PAD.left - PAD.right;
	const INNER_H = PLOT_H - PAD.top - PAD.bottom;

	const X_MIN = 0;
	const X_MAX = 5;
	const CURVE_POINTS = 200;

	const NUM_TRAIN = 40;
	const NUM_TEST = 100;

	// ─── KaTeX formulas (constants to avoid brace issues in template) ─
	const F_QHAT = String.raw`\hat{q}_{1 - \alpha}`;
	const F_INTERVAL = String.raw`[\hat{f}(x) - \hat{q},\ \hat{f}(x) + \hat{q}]`;
	const F_COVERAGE = String.raw`P(y \in C(x)) \geq 1 - \alpha`;
	const F_SIGMA = String.raw`\sigma(x) = \sigma_0 \cdot (0.2 + 0.6\,x/5)`;
	const F_MODEL = String.raw`\hat{f}(x) = \sin(x)`;
	const F_RESIDUAL = String.raw`|y_i - \hat{f}(x_i)|`;
	const F_NOISE = String.raw`y = \sin(x) + \varepsilon,\ \varepsilon \sim \mathcal{N}(0, \sigma(x))`;



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
		// Heteroscedastic noise: std grows with x
		return level * (0.2 + (0.6 * (x - X_MIN)) / (X_MAX - X_MIN));
	}

	// ─── Data generation ────────────────────────────────────────
	interface TestDataPoint {
		x: number;
		y: number;
		pred: number;
		lower: number;
		upper: number;
		covered: boolean;
	}

	function generateData(calSize: number, noiseLevel: number, seed: number) {
		const rng = mulberry32(seed);

		// Training points
		const trainX: number[] = [];
		const trainY: number[] = [];
		for (let i = 0; i < NUM_TRAIN; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			trainX.push(x);
			trainY.push(y);
		}

		// Calibration points
		const calX: number[] = [];
		const calY: number[] = [];
		for (let i = 0; i < calSize; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			calX.push(x);
			calY.push(y);
		}

		// Test points
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

	// ─── State ──────────────────────────────────────────────────
	let alpha = $state(0.05);
	let calSize = $state(50);
	let noiseLevel = $state(1.0);
	let regenCount = $state(0);

	// ─── Derived: raw data ──────────────────────────────────────
	const raw = $derived(generateData(calSize, noiseLevel, 42 + regenCount * 1000));

	// ─── Derived: conformal intervals ───────────────────────────
	const intervals = $derived(
		constantInterval(
			raw.calX.map((x) => trueModel(x)),
			raw.calY,
			raw.testX.map((x) => trueModel(x)),
			alpha
		)
	);

	// ─── Derived: half-width ────────────────────────────────────
	const halfWidth = $derived((intervals.upperBounds[0] - intervals.lowerBounds[0]) / 2);

	// ─── Derived: coverage ──────────────────────────────────────
	const coveragePairs = $derived(
		raw.testX.map((_, i): [number, number] => [
			intervals.lowerBounds[i],
			intervals.upperBounds[i]
		]) as [number, number][]
	);
	const coverageRate = $derived(conditionalCoverageRate(coveragePairs, raw.testY));

	// ─── Derived: test point classification ─────────────────────
	const testPoints = $derived(
		raw.testX.map((x, i): TestDataPoint => {
			const y = raw.testY[i];
			const pred = trueModel(x);
			const lower = intervals.lowerBounds[i];
			const upper = intervals.upperBounds[i];
			return {
				x,
				y,
				pred,
				lower,
				upper,
				covered: y >= lower && y <= upper
			};
		})
	);

	// ─── Derived: dynamic Y range ───────────────────────────────
	const yRange = $derived({
		min: Math.min(...raw.testY, ...intervals.lowerBounds) - 0.3,
		max: Math.max(...raw.testY, ...intervals.upperBounds) + 0.3
	});

	// ─── Helpers for derived values ─────────────────────────────
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

	function buildCurvePath(yrMin: number, yrMax: number): string {
		let d = '';
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x);
			const sx = PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		return d;
	}

	function buildBandPath(q: number, yrMin: number, yrMax: number): string {
		let d = '';
		// Upper bound: left → right
		for (let i = 0; i < CURVE_POINTS; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x) + q;
			const sx = PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		// Lower bound: right → left
		for (let i = CURVE_POINTS - 1; i >= 0; i--) {
			const x = X_MIN + (X_MAX - X_MIN) * (i / (CURVE_POINTS - 1));
			const y = trueModel(x) - q;
			const sx = PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
			const sy = PAD.top + ((yrMax - y) / (yrMax - yrMin)) * INNER_H;
			d += 'L' + sx.toFixed(2) + ',' + sy.toFixed(2);
		}
		d += 'Z';
		return d;
	}

	// ─── Derived: SVG data ──────────────────────────────────────
	const yTicks = $derived(computeNiceTicks(yRange.min, yRange.max));
	const curvePath = $derived(buildCurvePath(yRange.min, yRange.max));
	const bandPath = $derived(buildBandPath(halfWidth, yRange.min, yRange.max));

	// ─── Derived: counts ────────────────────────────────────────
	const outlierCount = $derived(testPoints.filter((p) => !p.covered).length);

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

<div class="prediction-interval-demo">
	<!-- ════════════════ Title ════════════════ -->
	<h3 class="demo-title">Intervalles de prédiction conformelle — Régression</h3>
	<p class="demo-subtitle">
		Modèle synthétique <KatexInline formula={F_NOISE} />
		avec bruit hétéroscédastique (la variabilité augmente avec x).
	</p>

	<!-- ════════════════ SVG Visualization ════════════════ -->
	<div class="viz-area">
		<Figure type="chart">
			{#if PLOT_W > 0}
				<svg
					viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
					width="100%"
					height={PLOT_H}
					role="img"
					aria-label="Scatter plot avec intervalles de prédiction conformelle"
				>
					<defs>
						<clipPath id="pi-plot-clip">
							<rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} />
						</clipPath>
					</defs>

					<g clip-path="url(#pi-plot-clip)">
						<!-- Interval band -->
						<path d={bandPath} fill="var(--color-belief)" opacity="0.13" />

						<!-- Prediction curve f̂(x) = sin(x) -->
						<path d={curvePath} fill="none" stroke="var(--color-belief)" stroke-width="2.2" />

						<!-- Calibration points -->
						{#each raw.calX as cx, i}
							<circle
								cx={mapX(cx)}
								cy={mapY(raw.calY[i])}
								r="2.5"
								fill="var(--color-text-muted)"
								opacity="0.35"
							/>
						{/each}

						<!-- Test points — covered -->
						{#each testPoints as p, i (i)}
							{#if p.covered}
								<circle
									cx={mapX(p.x)}
									cy={mapY(p.y)}
									r="3.2"
									fill="var(--color-text)"
									opacity="0.4"
								/>
							{/if}
						{/each}

						<!-- Test points — outliers (not covered) -->
						{#each testPoints as p, i (i)}
							{#if !p.covered}
								<circle
									cx={mapX(p.x)}
									cy={mapY(p.y)}
									r="4.5"
									fill="var(--color-surprise)"
									stroke="var(--color-surprise)"
									stroke-width="2"
									opacity="0.85"
								/>
							{/if}
						{/each}
					</g>

					<!-- Axes -->
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

					<!-- X axis ticks and labels -->
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

					<!-- Y axis ticks and labels -->
					{#each yTicks as tick}
						<text
							x={PAD.left - 6}
							y={mapY(tick) + 3}
							text-anchor="end"
							font-size="9"
							font-family="var(--font-mono)"
							fill="var(--color-text-muted)">{tick.toFixed(1)}</text
						>
						<line
							x1={PAD.left}
							y1={mapY(tick)}
							x2={PAD.left + INNER_W}
							y2={mapY(tick)}
							stroke="var(--color-border)"
							stroke-width="0.4"
							opacity="0.4"
						/>
					{/each}

					<!-- Axis labels -->
					<text
						x={PAD.left + INNER_W / 2}
						y={PLOT_H - 4}
						text-anchor="middle"
						font-size="10"
						fill="var(--color-text-muted)">x</text
					>
					<text
						x={14}
						y={PAD.top + INNER_H / 2}
						text-anchor="middle"
						font-size="10"
						transform={`rotate(-90, 14, ${PAD.top + INNER_H / 2})`}
						fill="var(--color-text-muted)">y</text
					>

					<!-- Coverage label inside plot -->
					<rect
						x={PLOT_W - PAD.right - 120}
						y={PAD.top + 4}
						width="116"
						height="24"
						rx="4"
						fill="var(--color-surface-2, #1a1a2e)"
						stroke="var(--color-border)"
						stroke-width="0.6"
						opacity="0.9"
					/>
					<text
						x={PLOT_W - PAD.right - 12}
						y={PAD.top + 20}
						text-anchor="end"
						font-size="10"
						font-weight="600"
						font-family="var(--font-mono)"
						fill={coverageRate >= 1 - alpha ? 'var(--color-positive)' : 'var(--color-surprise)'}
					>
						Couverture : {(coverageRate * 100).toFixed(1)}%
					</text>
				</svg>
			{/if}
		</Figure>
	</div>

	<!-- ════════════════ Metrics Panel ════════════════ -->
	<div class="metrics-row">
		<div class="metric-card">
			<span class="metric-label">Demi-largeur</span>
			<span class="metric-value">{halfWidth.toFixed(3)}</span>
			<span class="metric-formula">q̂ = {F_QHAT}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">Couverture empirique</span>
			<span
				class="metric-value"
				class:ok={coverageRate >= 1 - alpha}
				class:low={coverageRate < 1 - alpha}
			>
				{(coverageRate * 100).toFixed(1)}%
			</span>
			<span class="metric-target">Cible &ge; {(1 - alpha) * 100}%</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">Points hors intervalle</span>
			<span class="metric-value">{outlierCount}</span>
			<span class="metric-target">/ {testPoints.length} tests</span>
		</div>
	</div>

	<!-- ════════════════ Controls ════════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Paramètres de la méthode</div>
			<Slider bind:value={alpha} min={0.01} max={0.5} step={0.01} label="α (alpha)" unit="" />
			<Slider bind:value={calSize} min={20} max={200} step={5} label="Taille calibration" unit="" />
			<Slider
				bind:value={noiseLevel}
				min={0.2}
				max={3}
				step={0.1}
				label="Niveau de bruit"
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
				<span>Entrainement : {NUM_TRAIN}</span>
				<span>Calibration : {calSize}</span>
				<span>Test : {NUM_TEST}</span>
			</div>
		</div>
	</SliderGrid>

	<!-- ════════════════ Legend ════════════════ -->
	<div class="legend">
		<div class="legend-item">
			<span class="legend-swatch legend-curve"></span>
			<span class="legend-text">Courbe de prédiction <KatexInline formula={F_MODEL} /></span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-band"></span>
			<span class="legend-text">Bande d'intervalle <KatexInline formula={F_INTERVAL} /></span>
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
		<strong>Régression conformelle à intervalle constant.</strong>
		Les résidus absolus de calibration <KatexInline formula={F_RESIDUAL} /> déterminent le quantile <KatexInline
			formula={F_QHAT}
		/>, qui définit une bande uniforme autour de la prédiction. Sous les hypothèses
		d'échangeabilité, on garantit
		<KatexInline formula={F_COVERAGE} />. Avec un bruit hétéroscédastique <KatexInline
			formula={F_SIGMA}
		/>, l'intervalle constant peut être trop large là où le bruit est faible, et trop étroit là où
		il est fort — ce qui illustre le bien-fondé des intervalles adaptatifs.
	</p>
</div>

<style>
	.prediction-interval-demo {
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
		grid-template-columns: repeat(3, 1fr);
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
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--color-text);
		transition: color 0.2s ease;
	}

	.metric-value.ok {
		color: var(--color-positive);
	}

	.metric-value.low {
		color: var(--color-surprise);
	}

	.metric-target {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.metric-formula {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		opacity: 0.7;
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

	.legend-curve {
		width: 20px;
		height: 3px;
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
	@media (max-width: 520px) {
		.metrics-row {
			grid-template-columns: 1fr;
		}

		.legend {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
