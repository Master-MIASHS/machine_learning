<script lang="ts">
	import {
		conformityScoreRank,
		conformityScore1MinusProba,
		conformityScoreCumulative,
		computeQuantileThreshold,
		conformalPredictionSet
	} from '$lib/math/conformal';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────────────
	const NUM_CLASSES = 3;
	const CLASSES = ['Fleur', 'Étoile', 'Carré'];
	const CLASS_COLORS = ['#06b6d4', '#f43f5e', '#10b981']; // belief, surprise, positive
	const CLASS_ICONS = ['✿', '✦', '■'];
	const NUM_TRAINING = 40;
	const NUM_CALIBRATION = 20;
	const NUM_TEST = 5;
	const TOTAL = NUM_TRAINING + NUM_CALIBRATION + NUM_TEST;

	// Scatter plot dimensions
	const SCATTER_W = 420;
	const SCATTER_H = 320;
	const SCATTER_PAD = { top: 10, right: 10, bottom: 30, left: 40 };
	const PLOT_W = SCATTER_W - SCATTER_PAD.left - SCATTER_PAD.right;
	const PLOT_H = SCATTER_H - SCATTER_PAD.top - SCATTER_PAD.bottom;

	// Histogram dimensions
	const HIST_W = 420;
	const HIST_H = 180;
	const HIST_PAD = { top: 10, right: 15, bottom: 30, left: 40 };
	const HIST_PLOT_W = HIST_W - HIST_PAD.left - HIST_PAD.right;
	const HIST_PLOT_H = HIST_H - HIST_PAD.top - HIST_PAD.bottom;


	const rand = mulberry32(42);

	function boxMuller(rng: () => number): number {
		let u = 0,
			v = 0;
		while (u === 0) u = rng();
		while (v === 0) v = rng();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}

	// ─── Data generation ────────────────────────────────────────
	const centroids = [
		{ x: 0.3, y: 0.35 },
		{ x: 0.7, y: 0.3 },
		{ x: 0.5, y: 0.75 }
	];
	const sigma = 0.12;

	interface DataPoint {
		x: number;
		y: number;
		label: number;
		probas: number[];
		isCalibration: boolean;
		isTest: boolean;
	}

	const data: DataPoint[] = [];
	const trainingData: DataPoint[] = [];
	const calibrationData: DataPoint[] = [];
	const testData: DataPoint[] = [];

	// Generate all points
	for (let i = 0; i < TOTAL; i++) {
		const label = i % NUM_CLASSES;
		const cx = centroids[label].x + boxMuller(rand) * sigma;
		const cy = centroids[label].y + boxMuller(rand) * sigma;
		const x = Math.max(0.02, Math.min(0.98, cx));
		const y = Math.max(0.02, Math.min(0.98, cy));

		const isCalibration = i >= NUM_TRAINING && i < NUM_TRAINING + NUM_CALIBRATION;
		const isTest = i >= NUM_TRAINING + NUM_CALIBRATION;

		const point: DataPoint = { x, y, label, probas: [], isCalibration, isTest };
		data.push(point);
		if (isCalibration) calibrationData.push(point);
		else if (isTest) testData.push(point);
		else trainingData.push(point);
	}

	// Compute softmax probabilities based on distance to centroids
	function softmax(logits: number[]): number[] {
		const maxL = Math.max(...logits);
		const exps = logits.map((l) => Math.exp(l - maxL));
		const sum = exps.reduce((a, b) => a + b, 0);
		return exps.map((e) => e / sum);
	}

	for (const p of data) {
		const logits = centroids.map((c) => {
			const d2 = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
			return -d2 / (2 * sigma * sigma);
		});
		p.probas = softmax(logits);
	}

	// ─── Test point selection ───────────────────────────────────
	let testPointIndex = $state(0);
	const testPoint = $derived(testData[testPointIndex]);

	// ─── Pipeline state ─────────────────────────────────────────
	// Steps: 0=Data, 1=Calibration, 2=Quantile, 3=Prediction Set
	const STEP_LABELS = ['Données', 'Calibration', 'Quantile', 'Prédiction'];
	const STEP_DESCRIPTIONS = [
		"Visualisation des données d'entraînement, de calibration et du point test",
		"Calcul des scores de conformité sur l'ensemble de calibration",
		'Calcul du seuil quantile q̂ à partir des scores de calibration',
		"Construction progressive de l'ensemble de prédiction C(x)"
	];

	let currentStep = $state(0);
	let predictionSubStep = $state(0); // 0..NUM_CLASSES, how many classes added to C(x)

	// ─── Score type ─────────────────────────────────────────────
	type ScoreType = 'rank' | 'oneMinusProba' | 'cumulative';
	let scoreType = $state<ScoreType>('rank');

	const scoreFn = $derived.by(() => {
		switch (scoreType) {
			case 'rank':
				return conformityScoreRank;
			case 'oneMinusProba':
				return conformityScore1MinusProba;
			case 'cumulative':
				return conformityScoreCumulative;
		}
	});

	const scoreFnLabel = $derived.by(() => {
		switch (scoreType) {
			case 'rank':
				return 'Rang';
			case 'oneMinusProba':
				return '1 − p';
			case 'cumulative':
				return 'Cumulatif';
		}
	});

	// ─── Significance level ─────────────────────────────────────
	let alpha = $state(0.1);

	// ─── Calibration scores ─────────────────────────────────────
	const calibrationScores = $derived(calibrationData.map((p) => scoreFn(p.probas, p.label)));

	// ─── Quantile threshold ─────────────────────────────────────
	const quantileThreshold = $derived(computeQuantileThreshold(calibrationScores, alpha));

	// Classes sorted by ascending score (most probable first for rank-based)
	const classesByScore = $derived.by((): { classIdx: number; score: number }[] => {
		const scored = Array.from({ length: NUM_CLASSES }, (_, c) => ({
			classIdx: c,
			score: scoreFn(testPoint.probas, c)
		}));
		return scored.toSorted((a, b) => a.score - b.score);
	});

	// Progressive prediction set
	const progressiveSet = $derived(
		classesByScore.slice(0, predictionSubStep).map((c) => c.classIdx)
	);

	// Max sub-steps for current config
	const maxSubStep = $derived(NUM_CLASSES);

	// ─── Histogram computation ──────────────────────────────────
	const scoreMin = $derived(Math.min(...calibrationScores, 0));
	const scoreMax = $derived(Math.max(...calibrationScores));
	const NUM_BINS = 20;
	const binWidth = $derived((scoreMax - scoreMin) / NUM_BINS || 1);

	const histogram = $derived.by((): { bins: number[]; binLabels: string[] } => {
		const bins = new Array(NUM_BINS).fill(0);
		for (const s of calibrationScores) {
			const idx = Math.min(Math.floor((s - scoreMin) / binWidth), NUM_BINS - 1);
			bins[Math.max(0, idx)]++;
		}
		const labels = Array.from({ length: NUM_BINS }, (_, i) => (scoreMin + i * binWidth).toFixed(2));
		return { bins, binLabels: labels };
	});

	const histMaxCount = $derived(Math.max(...histogram.bins, 1));

	// ─── Background grid for decision regions ───────────────────
	const GRID_RES = 20;
	const cellW = PLOT_W / GRID_RES;
	const cellH = PLOT_H / GRID_RES;

	const gridCells = $derived.by((): { x: number; y: number; color: string; opacity: number }[] => {
		const cells: { x: number; y: number; color: string; opacity: number }[] = [];
		for (let gy = 0; gy < GRID_RES; gy++) {
			for (let gx = 0; gx < GRID_RES; gx++) {
				const px = (gx + 0.5) / GRID_RES;
				const py = (gy + 0.5) / GRID_RES;
				let minDist = Infinity;
				let bestClass = 0;
				for (let c = 0; c < NUM_CLASSES; c++) {
					const d = (px - centroids[c].x) ** 2 + (py - centroids[c].y) ** 2;
					if (d < minDist) {
						minDist = d;
						bestClass = c;
					}
				}
				// Fade opacity based on distance from centroid (closer = more opaque)
				const opacity = Math.max(0.06, Math.min(0.2, 0.25 - minDist * 0.5));
				cells.push({
					x: SCATTER_PAD.left + gx * cellW,
					y: SCATTER_PAD.top + gy * cellH,
					color: CLASS_COLORS[bestClass],
					opacity
				});
			}
		}
		return cells;
	});

	// ─── Coordinate mapping ─────────────────────────────────────
	function dataToSvgX(v: number): number {
		return SCATTER_PAD.left + v * PLOT_W;
	}
	function dataToSvgY(v: number): number {
		return SCATTER_PAD.top + (1 - v) * PLOT_H; // flip Y
	}

	// ─── Navigation ─────────────────────────────────────────────
	function nextStep() {
		if (currentStep < 3) {
			currentStep++;
			predictionSubStep = 0;
		} else if (predictionSubStep < maxSubStep) {
			predictionSubStep++;
		}
	}

	function prevStep() {
		if (currentStep === 3 && predictionSubStep > 0) {
			predictionSubStep--;
		} else if (currentStep > 0) {
			currentStep--;
			if (currentStep === 3) predictionSubStep = maxSubStep;
		}
	}

	function goToStep(step: number) {
		currentStep = step;
		predictionSubStep = step === 3 ? 0 : 0;
	}

	function resetDemo() {
		currentStep = 0;
		predictionSubStep = 0;
		testPointIndex = 0;
		alpha = 0.1;
		scoreType = 'rank';
	}

	function nextTestPoint() {
		testPointIndex = (testPointIndex + 1) % testData.length;
		predictionSubStep = 0;
	}

	function prevTestPoint() {
		testPointIndex = (testPointIndex - 1 + testData.length) % testData.length;
		predictionSubStep = 0;
	}

	// ─── Derived UI helpers ─────────────────────────────────────
	const isAtFinalStep = $derived(currentStep === 3 && predictionSubStep >= maxSubStep);
	const canNext = $derived(
		currentStep < 3 || (currentStep === 3 && predictionSubStep < maxSubStep)
	);
	const canPrev = $derived(currentStep > 0 || (currentStep === 3 && predictionSubStep > 0));

	// Coverage info
	const coverageCount = $derived(
		testData.filter((p) => {
			const pScores = calibrationData.map((c) => scoreFn(c.probas, c.label));
			const result = conformalPredictionSet(p.probas, pScores, alpha, scoreFn);
			return result.predictionSets[0].includes(p.label);
		}).length
	);
	const coverageRate = $derived(coverageCount / testData.length);
</script>

<div class="conformal-demo">
	<!-- ════════════════ Pipeline Steps Indicator ═══════════════ -->
	<div class="pipeline-steps">
		{#each STEP_LABELS as label, i (i)}
			<button
				class="step-btn"
				class:active={i === currentStep}
				class:done={i < currentStep}
				class:future={i > currentStep}
				onclick={() => goToStep(i)}
			>
				<span class="step-num">{i + 1}</span>
				<span class="step-label">{label}</span>
			</button>
		{/each}
		{#if currentStep === 3}
			<span class="sub-step-label">
				— Classes ajoutées : {Math.min(predictionSubStep, maxSubStep)}/{maxSubStep}
			</span>
		{/if}
	</div>

	<!-- Step description -->
	<p class="step-desc">{STEP_DESCRIPTIONS[currentStep]}</p>

	<!-- ════════════════ Main Visualization ════════════════ -->
	<div class="viz-area">
		<!-- Scatter plot -->
		<Figure type="chart">
			{#if SCATTER_W > 0}
				<svg
					viewBox={`0 0 ${SCATTER_W} ${SCATTER_H}`}
					width="100%"
					height={SCATTER_H}
					role="img"
					aria-label="Nuage de points avec régions de décision"
				>
					<!-- Background decision regions -->
					{#each gridCells as cell (`${cell.x},${cell.y}`)}
						<rect
							x={cell.x}
							y={cell.y}
							width={cellW + 0.5}
							height={cellH + 0.5}
							fill={cell.color}
							opacity={cell.opacity}
						/>
					{/each}

					<!-- Axes -->
					<line
						x1={SCATTER_PAD.left}
						y1={SCATTER_PAD.top + PLOT_H}
						x2={SCATTER_W - SCATTER_PAD.right}
						y2={SCATTER_PAD.top + PLOT_H}
						stroke="var(--color-border)"
						stroke-width="1"
					/>
					<line
						x1={SCATTER_PAD.left}
						y1={SCATTER_PAD.top}
						x2={SCATTER_PAD.left}
						y2={SCATTER_PAD.top + PLOT_H}
						stroke="var(--color-border)"
						stroke-width="1"
					/>

					<!-- Axis labels -->
					<text
						x={SCATTER_PAD.left - 8}
						y={SCATTER_PAD.top + 12}
						text-anchor="end"
						font-size="9"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">1.0</text
					>
					<text
						x={SCATTER_PAD.left - 8}
						y={SCATTER_PAD.top + PLOT_H + 4}
						text-anchor="end"
						font-size="9"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">0.0</text
					>
					<text
						x={SCATTER_PAD.left}
						y={SCATTER_PAD.top + PLOT_H + 20}
						text-anchor="middle"
						font-size="9"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">0.0</text
					>
					<text
						x={SCATTER_W - SCATTER_PAD.right}
						y={SCATTER_PAD.top + PLOT_H + 20}
						text-anchor="middle"
						font-size="9"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">1.0</text
					>

					<!-- Training points -->
					{#each trainingData as p (p)}
						<circle
							cx={dataToSvgX(p.x)}
							cy={dataToSvgY(p.y)}
							r="3.5"
							fill={CLASS_COLORS[p.label]}
							opacity="0.55"
						/>
					{/each}

					<!-- Calibration points (with border) -->
					{#each calibrationData as p (p)}
						{#if currentStep >= 1}
							<circle
								cx={dataToSvgX(p.x)}
								cy={dataToSvgY(p.y)}
								r="4.5"
								fill="var(--color-surface-2)"
								stroke={CLASS_COLORS[p.label]}
								stroke-width="2"
								opacity="0.9"
							/>
						{/if}
					{/each}

					<!-- Test point (highlighted) -->
					{#if currentStep >= 3}
						<!-- Pulse ring -->
						<circle
							cx={dataToSvgX(testPoint.x)}
							cy={dataToSvgY(testPoint.y)}
							r="16"
							fill="none"
							stroke="var(--color-surprise)"
							stroke-width="1.5"
							opacity="0.4"
						/>
						<circle
							cx={dataToSvgX(testPoint.x)}
							cy={dataToSvgY(testPoint.y)}
							r="8"
							fill="none"
							stroke="var(--color-surprise)"
							stroke-width="2"
							opacity="0.7"
						/>
						<!-- Point -->
						<circle
							cx={dataToSvgX(testPoint.x)}
							cy={dataToSvgY(testPoint.y)}
							r="6"
							fill="var(--color-surprise)"
							stroke="var(--color-bg)"
							stroke-width="2"
						/>
						<!-- Label -->
						<text
							x={dataToSvgX(testPoint.x)}
							y={dataToSvgY(testPoint.y) - 20}
							text-anchor="middle"
							font-size="10"
							font-weight="600"
							fill="var(--color-surprise)"
						>
							x<text baseline-shift="sub" font-size="8">test</text>
						</text>
					{/if}

					<!-- Centroid markers (only at step >= 1) -->
					{#if currentStep >= 1}
						{#each centroids as c, i (i)}
							<text
								x={dataToSvgX(c.x)}
								y={dataToSvgY(c.y)}
								text-anchor="middle"
								dominant-baseline="central"
								font-size="14"
								fill={CLASS_COLORS[i]}
								opacity="0.5">{CLASS_ICONS[i]}</text
							>
						{/each}
					{/if}
				</svg>
			{/if}
		</Figure>

		<!-- Right side: scores + prediction set -->
		<div class="side-panel">
			<!-- ─── Calibration Scores Histogram ─── -->
			{#if currentStep >= 1}
				<div class="panel-title">
					{#if currentStep === 1}
						Scores de conformité — calibration ({calibrationData.length} échantillons)
					{:else}
						Scores de conformité
					{/if}
				</div>

				<svg
					viewBox={`0 0 ${HIST_W} ${HIST_H}`}
					width="100%"
					height={HIST_H}
					role="img"
					aria-label="Histogramme des scores de conformité"
				>
					<!-- Bars -->
					{#each histogram.bins as count, i (i)}
						{@const barH = (count / histMaxCount) * HIST_PLOT_H}
						{@const barX = HIST_PAD.left + (i / NUM_BINS) * HIST_PLOT_W}
						{@const barW = HIST_PLOT_W / NUM_BINS}
						{@const isPastQuantile =
							currentStep >= 2 && scoreMin + i * binWidth <= quantileThreshold}
						<rect
							x={barX}
							y={HIST_PAD.top + HIST_PLOT_H - barH}
							width={barW}
							height={barH}
							fill={isPastQuantile ? 'var(--color-belief)' : 'var(--color-border)'}
							opacity={isPastQuantile ? 0.7 : 0.35}
							rx="1"
						/>
					{/each}

					<!-- Quantile threshold line -->
					{#if currentStep >= 2}
						{@const qX =
							HIST_PAD.left +
							((quantileThreshold - scoreMin) / (scoreMax - scoreMin)) * HIST_PLOT_W}
						<line
							x1={qX}
							y1={HIST_PAD.top}
							x2={qX}
							y2={HIST_PAD.top + HIST_PLOT_H}
							stroke="var(--color-surprise)"
							stroke-width="2"
							stroke-dasharray="4,3"
						/>
						<text
							x={qX}
							y={HIST_PAD.top - 2}
							text-anchor="middle"
							font-size="9"
							font-weight="600"
							font-family="var(--font-mono)"
							fill="var(--color-surprise)"
						>
							q̂ = {quantileThreshold.toFixed(2)}
						</text>
						<!-- Shaded region under threshold -->
						{@const shadeW = Math.min(qX, HIST_PAD.left + HIST_PLOT_W) - HIST_PAD.left}
						<rect
							x={HIST_PAD.left}
							y={HIST_PAD.top}
							width={shadeW}
							height={HIST_PLOT_H}
							fill="var(--color-belief)"
							opacity="0.08"
						/>
					{/if}

					<!-- Baseline -->
					<line
						x1={HIST_PAD.left}
						y1={HIST_PAD.top + HIST_PLOT_H}
						x2={HIST_W - HIST_PAD.right}
						y2={HIST_PAD.top + HIST_PLOT_H}
						stroke="var(--color-border)"
						stroke-width="1"
					/>

					<!-- X-axis labels (sparse) -->
					{#each histogram.binLabels as label, i (i)}
						{#if i % Math.max(1, Math.floor(NUM_BINS / 6)) === 0}
							<text
								x={HIST_PAD.left + (i / NUM_BINS) * HIST_PLOT_W}
								y={HIST_PAD.top + HIST_PLOT_H + 16}
								text-anchor="middle"
								font-size="9"
								font-family="var(--font-mono)"
								fill="var(--color-text-muted)"
							>
								{label}
							</text>
						{/if}
					{/each}

					<!-- X axis label -->
					<text
						x={HIST_PAD.left + HIST_PLOT_W / 2}
						y={HIST_H - 2}
						text-anchor="middle"
						font-size="9"
						fill="var(--color-text-muted)"
					>
						Score ({scoreFnLabel})
					</text>
				</svg>

				<!-- Score formula -->
				<div class="formula-row">
					{#if scoreType === 'rank'}
						s(x, y) = rang de y par ↓ probabilité
					{:else if scoreType === 'oneMinusProba'}
						s(x, y) = 1 − p̂(y|x)
					{:else}
						s(x, y) = 1 − Σ cumulatif jusqu'à y
					{/if}
				</div>
			{/if}

			<!-- ─── Prediction Set ─── -->
			{#if currentStep >= 3}
				<div class="panel-title">Ensemble de prédiction C(x)</div>

				<!-- Test point probabilities -->
				<div class="proba-list">
					{#each testPoint.probas as p, i (i)}
						{@const isInSet = progressiveSet.includes(i)}
						{@const isTrueClass = i === testPoint.label}
						<div class="proba-row" class:in-set={isInSet} class:true-class={isTrueClass}>
							<span class="class-badge" style:background={CLASS_COLORS[i]}>
								{CLASS_ICONS[i]}
							</span>
							<span class="class-name">
								{CLASSES[i]}
								{#if isTrueClass}
									<span class="true-tag">vrai</span>
								{/if}
							</span>
							<span class="proba-bar-wrap">
								<div
									class="proba-bar"
									style:width={`${(p * 100).toFixed(1)}%`}
									style:background={CLASS_COLORS[i]}
								></div>
							</span>
							<span class="proba-val">{(p * 100).toFixed(1)}%</span>
							<span class="status-icon">
								{#if isInSet}
									<span class="included">✓</span>
								{:else}
									<span class="excluded">—</span>
								{/if}
							</span>
						</div>
					{/each}
				</div>

				<!-- Set summary -->
				<div class="set-summary">
					C(x) =
					{#if progressiveSet.length === 0}
						∅
					{:else}
						{progressiveSet.map((c) => CLASSES[c]).join(', ')}
					{/if}
				</div>

				{#if isAtFinalStep}
					<div class="coverage-info">
						Couverture sur les {testData.length} points test :
						<strong>{coverageCount}/{testData.length} = {(coverageRate * 100).toFixed(0)}%</strong>
						{#if coverageRate >= 1 - alpha}
							<span class="coverage-ok"> ✓ garanti ≥ {(1 - alpha) * 100}%</span>
						{:else}
							<span class="coverage-warn">
								(fini, pas toujours garanti sur un petit échantillon)</span
							>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- ════════════════ Navigation ═══════════════ -->
	<div class="nav-row">
		<button class="nav-btn" onclick={prevStep} disabled={!canPrev}> ◀ Précédent </button>
		<button class="nav-btn primary" onclick={nextStep} disabled={!canNext}>
			{#if currentStep < 3}
				Suivant ▶
			{:else if predictionSubStep < maxSubStep}
				Ajouter une classe ▶
			{:else}
				✓ Terminé
			{/if}
		</button>
		<button class="nav-btn reset" onclick={resetDemo}> ↺ Réinitialiser </button>
	</div>

	<!-- Test point navigation -->
	{#if currentStep >= 3}
		<div class="test-nav">
			<button class="test-btn" onclick={prevTestPoint}>◀</button>
			<span class="test-label">
				Point test {testPointIndex + 1}/{testData.length} — Vraie classe :
				<strong style="color: {CLASS_COLORS[testPoint.label]}">
					{CLASSES[testPoint.label]}
				</strong>
			</span>
			<button class="test-btn" onclick={nextTestPoint}>▶</button>
		</div>
	{/if}

	<!-- ════════════════ Controls ═══════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Niveau de signification α</div>
			<Slider bind:value={alpha} min={0.01} max={0.5} step={0.01} label="Alpha" unit="" />
			<div class="alpha-info">
				Couverture garantie : ≥ <strong>{((1 - alpha) * 100).toFixed(0)}%</strong>
			</div>
		</div>
		<div class="grp">
			<div class="gttl">Type de score</div>
			<div class="score-select">
				<button
					class="score-btn"
					class:active={scoreType === 'rank'}
					onclick={() => {
						scoreType = 'rank';
						predictionSubStep = 0;
					}}
				>
					Rang
				</button>
				<button
					class="score-btn"
					class:active={scoreType === 'oneMinusProba'}
					onclick={() => {
						scoreType = 'oneMinusProba';
						predictionSubStep = 0;
					}}
				>
					1 − p
				</button>
				<button
					class="score-btn"
					class:active={scoreType === 'cumulative'}
					onclick={() => {
						scoreType = 'cumulative';
						predictionSubStep = 0;
					}}
				>
					Cumulatif
				</button>
			</div>
		</div>
	</SliderGrid>

	<!-- ════════════════ Caption ═══════════════ -->
	<p class="cap">
		La <strong>prédiction conformelle</strong> construit des ensembles de prédiction
		<KatexInline formula={String.raw`C(x)`} />
		avec une garantie de couverture statistique :
		<KatexInline formula={String.raw`P(y \in C(x)) \geq 1 - \alpha`} />
		. On calcule d'abord des scores de conformité
		<KatexInline formula={String.raw`s(x_i, y_i)`} />
		sur un ensemble de calibration, puis on détermine le seuil quantile
		<KatexInline
			formula={String.raw`\hat{q} = \text{quantile}_{\lceil(n+1)(1-\alpha)\rceil}(\{s_i\})`}
		/>. Pour un nouveau point x, l'ensemble de prédiction contient les classes dont le score ne
		dépasse pas
		<KatexInline formula={String.raw`\hat{q}`} />.
	</p>
</div>

<style>
	.conformal-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	/* ── Pipeline steps ─────────────────── */
	.pipeline-steps {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.step-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 20px;
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		transition: all 0.2s ease;
	}

	.step-btn:hover {
		border-color: var(--color-belief);
		color: var(--color-text);
	}

	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-surface-3);
		font-weight: 600;
		font-size: 0.72rem;
	}

	.step-btn.active {
		border-color: var(--color-belief);
		background: rgba(6, 182, 212, 0.1);
		color: var(--color-belief);
	}

	.step-btn.active .step-num {
		background: var(--color-belief);
		color: var(--color-bg);
	}

	.step-btn.done {
		border-color: var(--color-positive);
		color: var(--color-positive);
	}

	.step-btn.done .step-num {
		background: var(--color-positive);
		color: var(--color-bg);
	}

	.step-btn.future {
		opacity: 0.4;
	}

	.sub-step-label {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.step-desc {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* ── Visualization area ─────────────── */
	.viz-area {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
	}

	@media (max-width: 768px) {
		.viz-area {
			grid-template-columns: 1fr;
		}
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* ── Panel titles ─────────────────── */
	.panel-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: -0.25rem;
	}

	/* ── Formula row ──────────────────── */
	.formula-row {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		padding: 0.35rem 0.5rem;
		background: var(--color-surface-2);
		border-radius: 4px;
		text-align: center;
	}

	/* ── Probability list ─────────────── */
	.proba-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.proba-row {
		display: grid;
		grid-template-columns: 24px 1fr 80px 40px 24px;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.4rem;
		border-radius: 6px;
		background: var(--color-surface-2);
		transition: all 0.3s ease;
		border-left: 3px solid transparent;
	}

	.proba-row.in-set {
		background: rgba(6, 182, 212, 0.08);
		border-left-color: var(--color-belief);
	}

	.proba-row.true-class {
		border-bottom: 1px solid var(--color-surprise);
	}

	.class-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 4px;
		font-size: 12px;
		color: white;
	}

	.class-name {
		font-size: 0.78rem;
		color: var(--color-text);
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.true-tag {
		font-size: 0.6rem;
		padding: 0.1rem 0.3rem;
		background: var(--color-surprise);
		color: white;
		border-radius: 3px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.proba-bar-wrap {
		width: 80px;
		height: 8px;
		background: var(--color-surface-3);
		border-radius: 4px;
		overflow: hidden;
	}

	.proba-bar {
		height: 100%;
		border-radius: 4px;
		transition: width 0.4s ease;
	}

	.proba-val {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		text-align: right;
	}

	.status-icon {
		text-align: center;
		font-size: 0.85rem;
	}

	.included {
		color: var(--color-positive);
		font-weight: 700;
	}

	.excluded {
		color: var(--color-text-muted);
		opacity: 0.3;
	}

	/* ── Set summary ──────────────────── */
	.set-summary {
		padding: 0.5rem 0.75rem;
		background: var(--color-surface-2);
		border-radius: 6px;
		font-size: 0.82rem;
		font-family: var(--font-mono);
		color: var(--color-belief);
		text-align: center;
		line-height: 1.5;
	}

	/* ── Coverage info ────────────────── */
	.coverage-info {
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.78rem;
		line-height: 1.5;
		background: rgba(16, 185, 129, 0.06);
		color: var(--color-text-muted);
		border-left: 3px solid var(--color-positive);
	}

	.coverage-info strong {
		color: var(--color-positive);
	}

	.coverage-ok {
		color: var(--color-positive);
	}

	.coverage-warn {
		color: var(--color-neutral);
		font-size: 0.72rem;
	}

	/* ── Navigation row ─────────────── */
	.nav-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 0.82rem;
	}

	.nav-btn {
		padding: 0.4rem 1rem;
		border-radius: var(--radius-sm, 6px);
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		transition: all 0.15s ease;
	}

	.nav-btn:hover:not(:disabled) {
		background: var(--color-surface-2, transparent);
		border-color: var(--color-belief);
		color: var(--color-text);
	}

	.nav-btn.primary {
		background: var(--color-belief);
		border-color: var(--color-belief);
		color: var(--color-bg);
		font-weight: 600;
	}

	.nav-btn.primary:hover:not(:disabled) {
		opacity: 0.85;
	}

	.nav-btn.reset {
		font-size: 0.72rem;
		padding: 0.3rem 0.7rem;
	}

	.nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	/* ── Test point navigation ────────── */
	.test-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 0.8rem;
	}

	.test-btn {
		padding: 0.25rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: transparent;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.test-btn:hover {
		border-color: var(--color-surprise);
		color: var(--color-surprise);
	}

	.test-label {
		color: var(--color-text-muted);
	}

	/* ── Score type selector ──────────── */
	.score-select {
		display: flex;
		gap: 0.4rem;
	}

	.score-btn {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		transition: all 0.15s ease;
		text-align: center;
	}

	.score-btn:hover {
		border-color: var(--color-belief);
	}

	.score-btn.active {
		border-color: var(--color-belief);
		background: rgba(6, 182, 212, 0.12);
		color: var(--color-belief);
		font-weight: 600;
	}

	/* ── Alpha info ───────────────────── */
	.alpha-info {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin-top: 0.15rem;
	}

	.alpha-info strong {
		color: var(--color-belief);
	}

	/* ── Slider group styling ─────────── */
	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	/* ── Caption ──────────────────── */
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}

	.cap strong {
		color: var(--color-text);
	}
</style>
