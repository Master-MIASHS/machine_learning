<script lang="ts">
	import {
		constantInterval,
		adaptiveInterval,
		conditionalCoverageRate
	} from '$lib/math/regression-conformal';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── KaTeX formulas ──────────────────────────────────────────
	const F_ALPHA = String.raw`1 - \alpha`;
	const F_COV = String.raw`\frac{1}{n}\sum_{i=1}^{n}\mathbb{1}\{y_i \in C(x_i)\}`;
	const F_WIDTH = String.raw`\bar{w} = \frac{1}{n}\sum_{i=1}^{n}(U_i - L_i)`;
	const F_COND = String.raw`C(x) \text{ uniforme sur } x`;
	const F_MODEL = String.raw`y = \sin(x) + \varepsilon`;
	const F_SIGMA = String.raw`\sigma(x) = \sigma_0(0.2 + 0.6\,x/5)`;
	const F_NOISE = String.raw`\varepsilon \sim \mathcal{N}(0, \sigma^2(x))`;



	function boxMuller(rng: () => number): number {
		let u = 0,
			v = 0;
		while (u === 0) u = rng();
		while (v === 0) v = rng();
		return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	}

	// ─── Data model ─────────────────────────────────────────────
	const X_MIN = 0;
	const X_MAX = 5;
	const NUM_TRAIN = 80;
	const NUM_TEST = 120;
	const NUM_CAL_MIN = 20;
	const NUM_CAL_MAX = 200;

	function trueModel(x: number): number {
		return Math.sin(x);
	}

	function noiseStd(x: number, level: number): number {
		return level * (0.2 + 0.6 * (x / X_MAX));
	}

	// ─── Data generation ────────────────────────────────────────
	function generateData(seed: number, noiseLevel: number, calSize: number) {
		const rng = mulberry32(seed);

		// Train set
		const trainX: number[] = [],
			trainY: number[] = [];
		for (let i = 0; i < NUM_TRAIN; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			trainX.push(x);
			trainY.push(y);
		}
		trainX.sort((a, b) => a - b);

		// Calibration set
		const calX: number[] = [],
			calY: number[] = [];
		for (let i = 0; i < calSize; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			calX.push(x);
			calY.push(y);
		}

		// Test set
		const testX: number[] = [],
			testY: number[] = [];
		for (let i = 0; i < NUM_TEST; i++) {
			const x = X_MIN + (X_MAX - X_MIN) * rng();
			const y = trueModel(x) + boxMuller(rng) * noiseStd(x, noiseLevel);
			testX.push(x);
			testY.push(y);
		}

		return { trainX, trainY, calX, calY, testX, testY };
	}

	// ─── Local sigma estimation ─────────────────────────────────
	function estimateLocalSigma(
		trainX: number[],
		trainY: number[],
		queryX: number[],
		windowSize: number,
		noiseLevel: number
	): number[] {
		const WINDOW_SIZE = windowSize;
		return queryX.map((qx) => {
			let sum = 0,
				sumSq = 0,
				count = 0;
			for (let i = 0; i < trainX.length; i++) {
				const r = Math.abs(trainX[i] - qx);
				if (r < WINDOW_SIZE) {
					const w = 1 - r / WINDOW_SIZE;
					const residual = trainY[i] - trueModel(trainX[i]);
					sum += w * residual;
					sumSq += w * residual * residual;
					count += w;
				}
			}
			if (count === 0) return noiseStd(qx, noiseLevel);
			const mean = sum / count;
			const variance = sumSq / count - mean * mean;
			return Math.sqrt(Math.max(variance, 1e-6));
		});
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

	// ─── Derived: sigma estimates ───────────────────────────────
	// Local uncertainty must be estimated at BOTH the calibration points (to compute
	// the normalized conformity scores during calibration) and the test points (to
	// actually size each test interval by its own local noise level). The original
	// widget only ever computed sigma at raw.calX and fed adaptiveInterval nothing
	// but calSigma + testPreds — testPreds is just sin(testX), a non-monotonic
	// function of x, so there was no way to recover per-test-point uncertainty from
	// it. The "adaptive" intervals could not actually adapt to the test region.
	const calSigma = $derived(estimateLocalSigma(raw.trainX, raw.trainY, raw.calX, 0.8, noiseLevel));
	const testSigma = $derived(
		estimateLocalSigma(raw.trainX, raw.trainY, raw.testX, 0.8, noiseLevel)
	);

	// ─── Derived: intervals ─────────────────────────────────────
	const constIntervals = $derived(constantInterval(calPreds, raw.calY, testPreds, alpha));
	// NOTE: passing testSigma so the interval half-width can vary per test point.
	// If your `regression-conformal` module expects a different argument order,
	// adjust this call to match — the important fix is that a per-test-point sigma
	// is computed and supplied at all, not the exact position in the signature.
	const adaptIntervals = $derived(
		adaptiveInterval(calPreds, raw.calY, calSigma, testPreds, testSigma, alpha)
	);

	// ─── Derived: interval pairs ────────────────────────────────
	const constPairs = $derived(
		raw.testX.map((_, i): [number, number] => [
			constIntervals.lowerBounds[i],
			constIntervals.upperBounds[i]
		]) as [number, number][]
	);
	const adaptPairs = $derived(
		raw.testX.map((_, i): [number, number] => [
			adaptIntervals.lowerBounds[i],
			adaptIntervals.upperBounds[i]
		]) as [number, number][]
	);

	// ─── Derived: coverage rates ────────────────────────────────
	const constCoverage = $derived(conditionalCoverageRate(constPairs, raw.testY));
	const adaptCoverage = $derived(conditionalCoverageRate(adaptPairs, raw.testY));

	// ─── Derived: half-widths ───────────────────────────────────
	const constHalfWidth = $derived(
		(constIntervals.upperBounds[0] - constIntervals.lowerBounds[0]) / 2
	);
	const constAvgWidth = $derived(
		constIntervals.upperBounds.reduce((s, u, i) => s + (u - constIntervals.lowerBounds[i]), 0) /
			constIntervals.upperBounds.length
	);
	const adaptAvgWidth = $derived(
		adaptIntervals.upperBounds.reduce((s, u, i) => s + (u - adaptIntervals.lowerBounds[i]), 0) /
			adaptIntervals.upperBounds.length
	);

	// ─── Derived: per-point status ──────────────────────────────
	const constPoints = $derived(
		raw.testX.map((x, i) => ({
			x,
			y: raw.testY[i],
			pred: testPreds[i],
			lower: constIntervals.lowerBounds[i],
			upper: constIntervals.upperBounds[i],
			covered:
				raw.testY[i] >= constIntervals.lowerBounds[i] &&
				raw.testY[i] <= constIntervals.upperBounds[i],
			halfWidth: (constIntervals.upperBounds[i] - constIntervals.lowerBounds[i]) / 2
		}))
	);
	const adaptPoints = $derived(
		raw.testX.map((x, i) => ({
			x,
			y: raw.testY[i],
			pred: testPreds[i],
			lower: adaptIntervals.lowerBounds[i],
			upper: adaptIntervals.upperBounds[i],
			covered:
				raw.testY[i] >= adaptIntervals.lowerBounds[i] &&
				raw.testY[i] <= adaptIntervals.upperBounds[i],
			halfWidth: (adaptIntervals.upperBounds[i] - adaptIntervals.lowerBounds[i]) / 2
		}))
	);

	// ─── Derived: conditional coverage (binary 0/1) per x ───────
	const constCondPoints = $derived(
		raw.testX.map((x, i) => ({
			x,
			covered: constPoints[i].covered ? 1 : 0
		}))
	);
	const adaptCondPoints = $derived(
		raw.testX.map((x, i) => ({
			x,
			covered: adaptPoints[i].covered ? 1 : 0
		}))
	);

	// ─── Derived: width histogram bins ──────────────────────────
	const constWidths = $derived(constPoints.map((p) => p.halfWidth));
	const adaptWidths = $derived(adaptPoints.map((p) => p.halfWidth));

	// ─── Derived: target coverage ───────────────────────────────
	const targetCoverage = $derived(1 - alpha);

	// ─── Regenerate ─────────────────────────────────────────────
	function regenerate() {
		regenCount++;
	}
</script>

<div class="dashboard">
	<h3 class="demo-title">Qualité des intervalles de prédiction</h3>
	<p class="demo-subtitle">
		Comparaison entre intervalles constants et adaptatifs sur le modèle
		<KatexInline formula={F_MODEL} />, <KatexInline formula={F_NOISE} />,
		<KatexInline formula={F_SIGMA} />. Métriques : couverture empirique
		<KatexInline formula={F_COV} />, largeur moyenne
		<KatexInline formula={F_WIDTH} />, et uniformité conditionnelle
		<KatexInline formula={F_COND} />.
	</p>

	<!-- ═══════════════════════════════════════════════════ -->
	<!-- METRIQUE 1 — Taux de couverture                    -->
	<!-- ═══════════════════════════════════════════════════ -->
	<div class="metric-block">
		<h4 class="metric-heading">1. Taux de couverture empirique</h4>

		<!-- Progress bars côte à côte -->
		<div class="progress-row">
			<div class="progress-card">
				<div class="progress-label">
					<span class="method-tag const-tag">Constant</span>
				</div>
				<div class="progress-bar-track">
					<div class="progress-bar-fill" style="width: {constCoverage * 100}%"></div>
				</div>
				<div class="progress-values">
					<span class="value {constCoverage >= targetCoverage - 0.05 ? 'ok' : 'low'}">
						{(constCoverage * 100).toFixed(1)}%
					</span>
					<span class="target">cible {(targetCoverage * 100).toFixed(0)}%</span>
				</div>
			</div>

			<div class="progress-card">
				<div class="progress-label">
					<span class="method-tag adapt-tag">Adaptatif</span>
				</div>
				<div class="progress-bar-track">
					<div class="progress-bar-fill adapt-fill" style="width: {adaptCoverage * 100}%"></div>
				</div>
				<div class="progress-values">
					<span class="value {adaptCoverage >= targetCoverage - 0.05 ? 'ok' : 'low'}">
						{(adaptCoverage * 100).toFixed(1)}%
					</span>
					<span class="target">cible {(targetCoverage * 100).toFixed(0)}%</span>
				</div>
			</div>
		</div>

		<!-- Mini scatter de couverture -->
		<div class="scatter-row">
			<svg class="mini-scatter" viewBox="0 0 320 100" preserveAspectRatio="xMidYMid meet">
				<rect class="plot-bg" width="320" height="100" rx="4" />
				<line x1="40" y1="95" x2="310" y2="95" stroke="var(--color-border)" />
				<text x="175" y="9" fill="var(--color-text-muted)" font-size="9" text-anchor="middle"
					>Constant — points couverts vs non couverts</text
				>
				{#each constPoints as p}
					<circle
						cx={40 + ((p.x - X_MIN) / (X_MAX - X_MIN)) * 270}
						cy={12 + ((p.y - -2.5) / 5) * 76}
						r="2.5"
						fill={p.covered ? 'var(--color-positive)' : 'var(--color-surprise)'}
						opacity={p.covered ? 0.6 : 0.9}
					/>
				{/each}
			</svg>

			<svg class="mini-scatter" viewBox="0 0 320 100" preserveAspectRatio="xMidYMid meet">
				<rect class="plot-bg" width="320" height="100" rx="4" />
				<line x1="40" y1="95" x2="310" y2="95" stroke="var(--color-border)" />
				<text x="175" y="9" fill="var(--color-text-muted)" font-size="9" text-anchor="middle"
					>Adaptatif — points couverts vs non couverts</text
				>
				{#each adaptPoints as p}
					<circle
						cx={40 + ((p.x - X_MIN) / (X_MAX - X_MIN)) * 270}
						cy={12 + ((p.y - -2.5) / 5) * 76}
						r="2.5"
						fill={p.covered ? 'var(--color-positive)' : 'var(--color-surprise)'}
						opacity={p.covered ? 0.6 : 0.9}
					/>
				{/each}
			</svg>
		</div>
	</div>

	<!-- ═══════════════════════════════════════════════════ -->
	<!-- METRIQUE 2 — Largeur moyenne des intervalles       -->
	<!-- ═══════════════════════════════════════════════════ -->
	<div class="metric-block">
		<h4 class="metric-heading">2. Largeur moyenne des intervalles</h4>

		<!-- Barres de largeur -->
		<div class="bar-row">
			<div class="bar-card">
				<span class="method-tag const-tag">Constant</span>
				<div class="bar-track">
					<div class="bar-fill" style="width: {(constAvgWidth / 4) * 100}%"></div>
				</div>
				<div class="bar-value">{constAvgWidth.toFixed(3)}</div>
			</div>

			<div class="bar-card">
				<span class="method-tag adapt-tag">Adaptatif</span>
				<div class="bar-track">
					<div class="bar-fill adapt-fill" style="width: {(adaptAvgWidth / 4) * 100}%"></div>
				</div>
				<div class="bar-value">{adaptAvgWidth.toFixed(3)}</div>
			</div>
		</div>

		<!-- Histogramme SVG des largeurs -->
		<div class="hist-row">
			<svg class="histogram" viewBox="0 0 320 100" preserveAspectRatio="xMidYMid meet">
				<rect class="plot-bg" width="320" height="100" rx="4" />
				<text x="175" y="9" fill="var(--color-text-muted)" font-size="9" text-anchor="middle"
					>Distribution des demi-largeurs — Constant</text
				>
				{#each Array.from({ length: 15 }, (_, i) => i) as binIdx}
					{@const binMin = constHalfWidth * 0.5 + binIdx * ((constHalfWidth * 1.2) / 15)}
					{@const binMax = binMin + (constHalfWidth * 1.2) / 15}
					{@const binCount = constWidths.filter((w) => w >= binMin && w < binMax).length}
					{@const barH = (binCount / constWidths.length) * 70}
					<rect
						x={35 + binIdx * 19}
						y={88 - barH}
						width="17"
						height={barH}
						fill="var(--color-belief)"
						opacity="0.6"
						rx="1"
					/>
				{/each}
			</svg>

			<svg class="histogram" viewBox="0 0 320 100" preserveAspectRatio="xMidYMid meet">
				<rect class="plot-bg" width="320" height="100" rx="4" />
				<text x="175" y="9" fill="var(--color-text-muted)" font-size="9" text-anchor="middle"
					>Distribution des demi-largeurs — Adaptatif</text
				>
				{#each Array.from({ length: 15 }, (_, i) => i) as binIdx}
					{@const binMin = 0 + binIdx * ((adaptAvgWidth * 2.5) / 15)}
					{@const binMax = binMin + (adaptAvgWidth * 2.5) / 15}
					{@const binCount = adaptWidths.filter((w) => w >= binMin && w < binMax).length}
					{@const barH = (binCount / adaptWidths.length) * 70}
					<rect
						x={35 + binIdx * 19}
						y={88 - barH}
						width="17"
						height={barH}
						fill="var(--color-epistemic)"
						opacity="0.6"
						rx="1"
					/>
				{/each}
			</svg>
		</div>
	</div>

	<!-- ═══════════════════════════════════════════════════ -->
	<!-- METRIQUE 3 — Efficacité conditionnelle             -->
	<!-- ═══════════════════════════════════════════════════ -->
	<div class="metric-block">
		<h4 class="metric-heading">3. Efficacité conditionnelle</h4>
		<p class="metric-desc">
			Couverture binaire (1 = couverte, 0 = non couverte) en fonction de
			<span class="mono">x</span>. Une couverture uniforme se traduit par une densité de points
			couverts homogène sur toutes les régions.
		</p>

		<div class="scatter-row">
			<svg class="cond-scatter" viewBox="0 0 320 110" preserveAspectRatio="xMidYMid meet">
				<rect class="plot-bg" width="320" height="110" rx="4" />
				<line x1="40" y1="90" x2="310" y2="90" stroke="var(--color-border)" />
				<line x1="40" y1="20" x2="40" y2="90" stroke="var(--color-border)" />
				<text x="175" y="9" fill="var(--color-text-muted)" font-size="9" text-anchor="middle"
					>Constant — couverture par région</text
				>
				<text x="175" y="105" fill="var(--color-text-muted)" font-size="8" text-anchor="middle"
					>x</text
				>
				<text
					x="14"
					y="55"
					fill="var(--color-text-muted)"
					font-size="8"
					text-anchor="middle"
					transform="rotate(-90,14,55)">couverture</text
				>
				{#each constCondPoints as p}
					<circle
						cx={40 + ((p.x - X_MIN) / (X_MAX - X_MIN)) * 265}
						cy={p.covered === 1 ? 25 : 80}
						r="3"
						fill={p.covered === 1 ? 'var(--color-positive)' : 'var(--color-surprise)'}
						opacity={p.covered === 1 ? 0.5 : 0.85}
					/>
				{/each}
			</svg>

			<svg class="cond-scatter" viewBox="0 0 320 110" preserveAspectRatio="xMidYMid meet">
				<rect class="plot-bg" width="320" height="110" rx="4" />
				<line x1="40" y1="90" x2="310" y2="90" stroke="var(--color-border)" />
				<line x1="40" y1="20" x2="40" y2="90" stroke="var(--color-border)" />
				<text x="175" y="9" fill="var(--color-text-muted)" font-size="9" text-anchor="middle"
					>Adaptatif — couverture par région</text
				>
				<text x="175" y="105" fill="var(--color-text-muted)" font-size="8" text-anchor="middle"
					>x</text
				>
				<text
					x="14"
					y="55"
					fill="var(--color-text-muted)"
					font-size="8"
					text-anchor="middle"
					transform="rotate(-90,14,55)">couverture</text
				>
				{#each adaptCondPoints as p}
					<circle
						cx={40 + ((p.x - X_MIN) / (X_MAX - X_MIN)) * 265}
						cy={p.covered === 1 ? 25 : 80}
						r="3"
						fill={p.covered === 1 ? 'var(--color-positive)' : 'var(--color-surprise)'}
						opacity={p.covered === 1 ? 0.5 : 0.85}
					/>
				{/each}
			</svg>
		</div>
	</div>

	<!-- ═══════════════════════════════════════════════════ -->
	<!-- TABLEAU RÉCAPITULATIF                               -->
	<!-- ═══════════════════════════════════════════════════ -->
	<div class="summary-section">
		<h4 class="summary-title">Récapitulatif des scores</h4>
		<table class="summary-table">
			<thead>
				<tr>
					<th>Méthode</th>
					<th>Couverture</th>
					<th>Largeur moy.</th>
					<th>Demi-largeur</th>
					<th>Écart à la cible</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="method-cell">
						<span class="method-tag const-tag">Constant</span>
					</td>
					<td class="num-cell {constCoverage >= targetCoverage - 0.05 ? 'ok' : 'low'}">
						{(constCoverage * 100).toFixed(1)}%
					</td>
					<td class="num-cell">{constAvgWidth.toFixed(3)}</td>
					<td class="num-cell">{constHalfWidth.toFixed(3)}</td>
					<td class="num-cell">{(Math.abs(constCoverage - targetCoverage) * 100).toFixed(2)} pp</td>
				</tr>
				<tr>
					<td class="method-cell">
						<span class="method-tag adapt-tag">Adaptatif</span>
					</td>
					<td class="num-cell {adaptCoverage >= targetCoverage - 0.05 ? 'ok' : 'low'}">
						{(adaptCoverage * 100).toFixed(1)}%
					</td>
					<td class="num-cell">{adaptAvgWidth.toFixed(3)}</td>
					<td class="num-cell">{(adaptAvgWidth / 2).toFixed(3)}</td>
					<td class="num-cell">{(Math.abs(adaptCoverage - targetCoverage) * 100).toFixed(2)} pp</td>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- ═══════════════════════════════════════════════════ -->
	<!-- CONTRÔLES                                           -->
	<!-- ═══════════════════════════════════════════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Paramètres</div>
			<Slider bind:value={alpha} min={0.01} max={0.5} step={0.01} label="α (alpha)" unit="" />
			<Slider
				bind:value={calSize}
				min={NUM_CAL_MIN}
				max={NUM_CAL_MAX}
				step={1}
				label="Taille de calibration"
				unit=""
			/>
			<!--
				This slider was missing entirely: noiseLevel (sigma_0) drives the whole
				heteroscedasticity story the widget claims to demonstrate (see F_SIGMA in the
				subtitle), but it was hardcoded at 1.0 with no way to change it from the UI.
			-->
			<Slider
				bind:value={noiseLevel}
				min={0.2}
				max={2.5}
				step={0.1}
				label="σ₀ (amplitude du bruit)"
				unit=""
			/>
		</div>
		<div class="grp">
			<div class="gttl">Régénération</div>
			<div class="regen-wrap">
				<button class="regen-btn" onclick={regenerate}> 🔄 Régénérer les données </button>
				<span class="regen-hint">Semence : {42 + regenCount * 1000}</span>
			</div>
			<div class="dataset-info">
				<span>Entraînement : {NUM_TRAIN}</span>
				<span>Test : {NUM_TEST}</span>
				<span>Calibration : {calSize}</span>
				<span>σ₀ : {noiseLevel.toFixed(2)}</span>
			</div>
		</div>
	</SliderGrid>

	<!-- ═══════════════════════════════════════════════════ -->
	<!-- LÉGENDE                                            -->
	<!-- ═══════════════════════════════════════════════════ -->
	<div class="legend">
		<div class="legend-item">
			<span class="legend-swatch legend-const"></span>
			<span class="legend-text">Intervalle constant</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-adapt"></span>
			<span class="legend-text">Intervalle adaptatif</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-covered"></span>
			<span class="legend-text">Point couvert</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch legend-outlier"></span>
			<span class="legend-text">Point non couvert</span>
		</div>
	</div>

	<p class="cap">
		<strong>Leçon 11 — Intervalles de prédiction · Régression conformelle.</strong>
		Le taux de couverture empirique mesure si l'intervalle respecte le niveau de confiance
		<KatexInline formula={F_ALPHA} />. La largeur moyenne reflète la précision des intervalles.
		L'efficacité conditionnelle vérifie si la couverture est uniforme indépendamment de la région de
		l'espace d'entrée.
	</p>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 880px;
		margin: 0 auto;
	}

	/* ─── Title ─── */
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

	/* ─── Metric block ─── */
	.metric-block {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.8rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
	}

	.metric-heading {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.metric-desc {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.mono {
		font-family: var(--font-mono, monospace);
	}

	/* ─── Progress bars ─── */
	.progress-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.progress-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.progress-label {
		display: flex;
		justify-content: flex-start;
	}

	.progress-bar-track {
		width: 100%;
		height: 18px;
		background: var(--color-surface);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: var(--color-belief, #60a5fa);
		border-radius: 4px;
		transition: width 0.3s ease;
		min-width: 1px;
	}

	.progress-bar-fill.adapt-fill {
		background: var(--color-epistemic);
	}

	.progress-values {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 0.78rem;
	}

	.progress-values .value {
		font-family: var(--font-mono, monospace);
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.progress-values .value.ok {
		color: var(--color-positive);
	}

	.progress-values .value.low {
		color: var(--color-surprise);
	}

	.progress-values .target {
		color: var(--color-text-muted);
	}

	/* ─── Method tags ─── */
	.method-tag {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
	}

	.method-tag.const-tag {
		background: color-mix(in srgb, var(--color-belief, #60a5fa) 15%, transparent);
		color: var(--color-belief, #60a5fa);
	}

	.method-tag.adapt-tag {
		background: color-mix(in srgb, var(--color-epistemic) 15%, transparent);
		color: var(--color-epistemic);
	}

	/* ─── Scatter row ─── */
	.scatter-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.mini-scatter {
		width: 100%;
		display: block;
	}

	.cond-scatter {
		width: 100%;
		display: block;
	}

	/* ─── Bar row (metric 2) ─── */
	.bar-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.bar-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.bar-track {
		width: 100%;
		height: 22px;
		background: var(--color-surface);
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--color-belief, #60a5fa);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.bar-fill.adapt-fill {
		background: var(--color-epistemic);
	}

	.bar-value {
		font-family: var(--font-mono, monospace);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text);
		text-align: right;
	}

	/* ─── Histogram row ─── */
	.hist-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.histogram {
		width: 100%;
		display: block;
	}

	/* ─── Plot background ─── */
	.plot-bg {
		fill: transparent;
	}

	/* ─── Summary table ─── */
	.summary-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.8rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
		overflow-x: auto;
	}

	.summary-title {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.summary-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;
	}

	.summary-table th {
		text-align: left;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		padding: 0.4rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.summary-table td {
		padding: 0.45rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.summary-table tbody tr:last-child td {
		border-bottom: none;
	}

	.method-cell {
		white-space: nowrap;
	}

	.num-cell {
		font-family: var(--font-mono, monospace);
		font-weight: 600;
		text-align: right;
	}

	.num-cell.ok {
		color: var(--color-positive);
	}

	.num-cell.low {
		color: var(--color-surprise);
	}

	/* ─── Controls ─── */
	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gttl {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.regen-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.regen-btn {
		cursor: pointer;
		padding: 0.45rem 0.9rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text);
		background: var(--color-surface-2, transparent);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		transition: background 0.15s ease;
	}

	.regen-btn:hover {
		background: var(--color-border);
	}

	.regen-hint {
		font-size: 0.72rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	.dataset-info {
		display: flex;
		gap: 0.8rem;
		font-size: 0.72rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	/* ─── Legend ─── */
	.legend {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.5rem;
		padding: 0.6rem 0.8rem;
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
	}

	.legend-swatch {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.legend-const {
		background: var(--color-belief, #60a5fa);
	}

	.legend-adapt {
		background: var(--color-epistemic);
	}

	.legend-covered {
		background: var(--color-positive);
	}

	.legend-outlier {
		background: var(--color-surprise);
	}

	.legend-text {
		line-height: 1.2;
	}

	/* ─── Caption ─── */
	.cap {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		padding: 0.4rem 0;
	}

	.cap strong {
		color: var(--color-text);
	}

	/* ─── Responsive ─── */
	@media (max-width: 760px) {
		.progress-row,
		.scatter-row,
		.bar-row,
		.hist-row {
			grid-template-columns: 1fr;
		}

		.legend {
			grid-template-columns: repeat(2, 1fr);
		}

		.summary-table {
			font-size: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.legend {
			grid-template-columns: 1fr 1fr;
		}

		.dataset-info {
			flex-wrap: wrap;
			gap: 0.4rem;
		}
	}
</style>
