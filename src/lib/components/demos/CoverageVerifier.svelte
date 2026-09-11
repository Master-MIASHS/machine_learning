<script lang="ts">
	import { conformityScoreRank, computeQuantileThreshold } from '$lib/math/conformal';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────────────
	const NUM_CLASSES = 3;
	const CLASSES = ['A', 'B', 'C'];

	const NUM_TEST_TOTAL = 100;
	const SCATTER_HEIGHT = 280;
	const SCATTER_PAD = { top: 12, right: 12, bottom: 30, left: 36 };
	const COV_CHART_HEIGHT = 160;
	const COV_PAD = { top: 16, right: 14, bottom: 30, left: 44 };
	const HIST_HEIGHT = 140;
	const HIST_PAD = { top: 8, right: 10, bottom: 28, left: 30 };



	// ─── Softmax ────────────────────────────────────────────────
	function softmax(logits: number[]): number[] {
		const maxL = Math.max(...logits);
		const exps = logits.map((l) => Math.exp(l - maxL));
		const sum = exps.reduce((a, b) => a + b, 0);
		return exps.map((e) => e / sum);
	}

	// ─── Generate synthetic data ────────────────────────────────
	interface Sample {
		probas: number[];
		label: number;
		x: number;
		y: number;
	}

	function generateSample(rng: () => number): Sample {
		const label = Math.floor(rng() * NUM_CLASSES);
		const logits = Array.from({ length: NUM_CLASSES }, (_, c) => {
			if (c === label) return 1.2 + rng() * 3;
			return -0.8 + rng() * 3.5;
		});
		// ~20% chance of a hard sample (decoy class boosted)
		if (rng() < 0.2) {
			const decoy = (label + 1 + Math.floor(rng() * (NUM_CLASSES - 1))) % NUM_CLASSES;
			logits[decoy] += 2 + rng() * 2;
		}
		return {
			probas: softmax(logits),
			label,
			x: rng(),
			y: rng()
		};
	}

	function generateCalibrationSet(size: number): Sample[] {
		const rng = mulberry32(1234);
		return Array.from({ length: size }, () => generateSample(rng));
	}

	// Test set is fixed (deterministic)
	const testRng = mulberry32(5678);
	const TEST_DATA: Sample[] = Array.from({ length: NUM_TEST_TOTAL }, () => generateSample(testRng));

	// ─── Reactive state ─────────────────────────────────────────
	let alpha = $state(0.1);
	let calSize = $state(50);
	let revealCount = $state(20);
	let scatterWidth = $state(0);
	let covChartWidth = $state(0);
	let histWidth = $state(0);

	// ─── Derived: calibration data (regenerate when calSize changes) ──
	const calibrationSet = $derived(generateCalibrationSet(calSize));

	// ─── Derived: conformity scores on calibration set ──────────
	const calScores = $derived(calibrationSet.map((s) => conformityScoreRank(s.probas, s.label)));

	// ─── Derived: quantile threshold ────────────────────────────
	const qHat = $derived(computeQuantileThreshold(calScores, alpha));

	// ─── Derived: prediction sets for all test samples ──────────
	const allPredictionSets = $derived(
		TEST_DATA.map((sample) => {
			const included: number[] = [];
			for (let j = 0; j < NUM_CLASSES; j++) {
				if (conformityScoreRank(sample.probas, j) <= qHat) {
					included.push(j);
				}
			}
			return included;
		})
	);

	// ─── Derived: revealed test samples ─────────────────────────
	const revealedSets = $derived(allPredictionSets.slice(0, revealCount));
	const revealedData = $derived(TEST_DATA.slice(0, revealCount));

	// ─── Derived: coverage info ─────────────────────────────────
	const covered = $derived(
		revealedSets.map((predSet, i) => predSet.includes(revealedData[i].label))
	);

	const coveredCount = $derived(covered.filter(Boolean).length);

	const empiricalCoverage = $derived(revealCount > 0 ? coveredCount / revealCount : 0);

	const theoreticalGuarantee = $derived(1 - alpha);

	// ─── Derived: prediction set size distribution ──────────
	const setSizeDistribution = $derived(
		(() => {
			const counts = new Array(NUM_CLASSES + 1).fill(0);
			for (const predSet of revealedSets) {
				const sz = predSet.length;
				if (sz <= NUM_CLASSES) counts[sz]++;
			}
			return counts;
		})()
	);

	const maxSetSizeCount = $derived(revealCount > 0 ? Math.max(...setSizeDistribution, 1) : 1);

	// ─── Derived: coverage evolution curve ──────────────────────
	// Compute coverage at each step from 1 to revealCount
	const coverageCurve = $derived(
		(() => {
			const points: [number, number][] = [];
			let cumCovered = 0;
			for (let i = 0; i < revealCount; i++) {
				cumCovered += allPredictionSets[i].includes(TEST_DATA[i].label) ? 1 : 0;
				points.push([i + 1, cumCovered / (i + 1)]);
			}
			return points;
		})()
	);

	// ─── Scatter layout ────────────────────────────────────────
	const sPlotW = $derived(Math.max(0, scatterWidth - SCATTER_PAD.left - SCATTER_PAD.right));
	const sPlotH = $derived(SCATTER_HEIGHT - SCATTER_PAD.top - SCATTER_PAD.bottom);

	// ─── Coverage chart layout ─────────────────────────────────
	const cPlotW = $derived(Math.max(0, covChartWidth - COV_PAD.left - COV_PAD.right));
	const cPlotH = $derived(COV_CHART_HEIGHT - COV_PAD.top - COV_PAD.bottom);
	const guaranteeY = $derived(COV_PAD.top + cPlotH * (1 - theoreticalGuarantee));

	// ─── Histogram layout ──────────────────────────────────────
	const hPlotW = $derived(Math.max(0, histWidth - HIST_PAD.left - HIST_PAD.right));
	const hPlotH = $derived(HIST_HEIGHT - HIST_PAD.top - HIST_PAD.bottom);
	const histSlotW = $derived(hPlotW / (NUM_CLASSES + 1));
	const histBarW = $derived(Math.min(histSlotW * 0.55, 50));

	// ─── Layout helpers ─────────────────────────────────────────
	// scatterX/scatterY seed their jitter PRNGs with DIFFERENT formulas (offset by a
	// large odd constant) so the two axes draw different pseudorandom values for the
	// same point index i. Previously both used the identical seed `i * 31 + 99`, so a
	// fresh mulberry32 instance in each function produced the same first draw — the x
	// and y jitter offsets were always numerically equal, and every point got pushed
	// along the same diagonal within its cell instead of spreading in two dimensions.
	function scatterX(i: number): number {
		const jitterRng = mulberry32(i * 31 + 99);
		const cellW = sPlotW / 10;
		return SCATTER_PAD.left + (i % 10) * cellW + cellW / 2 + (jitterRng() - 0.5) * cellW * 0.6;
	}

	function scatterY(i: number): number {
		const jitterRng = mulberry32(i * 53 + 271);
		const cellH = sPlotH / 10;
		return (
			SCATTER_PAD.top + Math.floor(i / 10) * cellH + cellH / 2 + (jitterRng() - 0.5) * cellH * 0.6
		);
	}

	// Y-axis ticks for coverage chart
	const covYTicks = [0, 0.25, 0.5, 0.75, 1.0];
</script>

<div class="coverage-verifier">
	<!-- ════════════════ Controls ═══════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Niveau de signification (α)</div>
			<Slider bind:value={alpha} min={0.01} max={0.3} step={0.01} label="α" />
		</div>
		<div class="grp">
			<div class="gttl">Taille de l'ensemble de calibration</div>
			<Slider bind:value={calSize} min={20} max={200} step={5} label="n" />
		</div>
		<div class="grp">
			<div class="gttl">Échantillons révélés</div>
			<Slider bind:value={revealCount} min={1} max={NUM_TEST_TOTAL} step={1} label="k" />
		</div>
	</SliderGrid>

	<!-- ════════════════ Stats row ═══════════════ -->
	<div class="stats-row">
		<div class="stat-card">
			<div class="stat-label">Garantie théorique</div>
			<div class="stat-value guarantee">{(theoreticalGuarantee * 100).toFixed(1)}%</div>
			<div class="stat-sub">P(y ∈ C(x)) ≥ 1 − α = {theoreticalGuarantee.toFixed(2)}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Couverture empirique</div>
			<div class="stat-value empirical" class:good={empiricalCoverage >= theoreticalGuarantee}>
				{(empiricalCoverage * 100).toFixed(1)}%
			</div>
			<div class="stat-sub">{coveredCount} / {revealCount} échantillons couverts</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Seuil quantile (q̂)</div>
			<div class="stat-value quantile">
				{qHat === Infinity ? '∞' : qHat.toFixed(1)}
			</div>
			<div class="stat-sub">Calibration : {calSize} échantillons</div>
		</div>
	</div>

	<!-- ════════════════ Panel: Scatter ═══════════════ -->
	<div class="panel-title">Échantillons de test — verts = couverts, rouges = non couverts</div>

	<Figure type="chart" bind:containerWidth={scatterWidth}>
		{#if scatterWidth > 0 && sPlotW > 0}
			<svg
				viewBox={`0 0 ${scatterWidth} ${SCATTER_HEIGHT}`}
				width="100%"
				height={SCATTER_HEIGHT}
				role="img"
				aria-label="Nuage de points montrant les échantillons couverts et non couverts"
			>
				<!-- Grid -->
				{#each Array.from({ length: 11 }, (_, i) => i) as gridI}
					{@const gx = SCATTER_PAD.left + (gridI / 10) * sPlotW}
					{@const gy = SCATTER_PAD.top + (gridI / 10) * sPlotH}
					<line
						x1={gx}
						y1={SCATTER_PAD.top}
						x2={gx}
						y2={SCATTER_PAD.top + sPlotH}
						stroke="var(--color-border)"
						stroke-width="0.5"
						opacity="0.4"
					/>
					<line
						x1={SCATTER_PAD.left}
						y1={gy}
						x2={SCATTER_PAD.left + sPlotW}
						y2={gy}
						stroke="var(--color-border)"
						stroke-width="0.5"
						opacity="0.4"
					/>
				{/each}

				<!-- Points -->
				{#each revealedData as sample, i (i)}
					{@const px = scatterX(i)}
					{@const py = scatterY(i)}
					{@const isCovered = covered[i]}
					{@const r = 5}

					<!-- Point circle -->
					<circle
						cx={px.toFixed(1)}
						cy={py.toFixed(1)}
						{r}
						fill={isCovered ? '#22c55e' : '#ef4444'}
						opacity="0.8"
						stroke={isCovered ? '#16a34a' : '#dc2626'}
						stroke-width="1"
					/>

					<!-- Class label in center -->
					<text
						x={px.toFixed(1)}
						y={(py + 3).toFixed(1)}
						text-anchor="middle"
						font-size="6"
						font-family="var(--font-mono)"
						fill="white"
						font-weight="700"
						pointer-events="none">{CLASSES[sample.label]}</text
					>
				{/each}
			</svg>
		{/if}
	</Figure>

	<!-- Scatter legend -->
	<div class="legend-row">
		<span class="legend-item covered">
			<span class="legend-dot covered"></span> Couvert ({(empiricalCoverage * 100).toFixed(1)}%)
		</span>
		<span class="legend-item not-covered">
			<span class="legend-dot not-covered"></span> Non couvert ({(
				(1 - empiricalCoverage) *
				100
			).toFixed(1)}%)
		</span>
		<span class="legend-item count">Échantillon {revealCount} / {NUM_TEST_TOTAL}</span>
	</div>

	<!-- ════════════════ Panel: Coverage Evolution ═══════════════ -->
	<div class="panel-title">Convergence de la couverture empirique vers la garantie théorique</div>

	<Figure type="chart" bind:containerWidth={covChartWidth}>
		{#if covChartWidth > 0 && cPlotW > 0}
			<svg
				viewBox={`0 0 ${covChartWidth} ${COV_CHART_HEIGHT}`}
				width="100%"
				height={COV_CHART_HEIGHT}
				role="img"
				aria-label="Graphique de convergence de la couverture empirique"
			>
				<!-- Y grid lines + labels -->
				{#each covYTicks as tick (tick)}
					{@const ty = COV_PAD.top + cPlotH * (1 - tick)}
					<line
						x1={COV_PAD.left}
						y1={ty}
						x2={COV_PAD.left + cPlotW}
						y2={ty}
						stroke="var(--color-border)"
						stroke-width="1"
						stroke-dasharray="3,3"
					/>
					<text
						x={(COV_PAD.left - 6).toFixed(1)}
						y={(ty + 4).toFixed(1)}
						text-anchor="end"
						font-size="10"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">{tick.toFixed(2)}</text
					>
				{/each}

				<!-- Baseline -->
				<line
					x1={COV_PAD.left}
					y1={COV_PAD.top + cPlotH}
					x2={COV_PAD.left + cPlotW}
					y2={COV_PAD.top + cPlotH}
					stroke="var(--color-border)"
					stroke-width="1"
				/>

				<!-- Theoretical guarantee line -->
				<line
					x1={COV_PAD.left}
					y1={guaranteeY.toFixed(1)}
					x2={COV_PAD.left + cPlotW}
					y2={guaranteeY.toFixed(1)}
					stroke="var(--color-surprise)"
					stroke-width="1.5"
					stroke-dasharray="6,3"
				/>
				<text
					x={(COV_PAD.left + cPlotW - 4).toFixed(1)}
					y={(guaranteeY - 6).toFixed(1)}
					text-anchor="end"
					font-size="9.5"
					font-family="var(--font-mono)"
					fill="var(--color-surprise)"
					font-weight="600">1 − α = {theoreticalGuarantee.toFixed(2)}</text
				>

				<!-- X axis ticks -->
				{#each [0, 25, 50, 75, 100] as xtick}
					{@const xtx = COV_PAD.left + (xtick / NUM_TEST_TOTAL) * cPlotW}
					<text
						x={xtx.toFixed(1)}
						y={(COV_PAD.top + cPlotH + 16).toFixed(1)}
						text-anchor="middle"
						font-size="9.5"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">{xtick}</text
					>
				{/each}

				<!-- X axis label -->
				<text
					x={(COV_PAD.left + cPlotW / 2).toFixed(1)}
					y={(COV_CHART_HEIGHT - 2).toFixed(1)}
					text-anchor="middle"
					font-size="9"
					fill="var(--color-text-muted)">Nombre d'échantillons test</text
				>

				<!-- Coverage curve as polyline -->
				{#if coverageCurve.length > 1}
					{@const polylinePoints = coverageCurve
						.map(([xi, yi]) => {
							const x = COV_PAD.left + (xi / NUM_TEST_TOTAL) * cPlotW;
							const y = COV_PAD.top + cPlotH * (1 - yi);
							return `${x.toFixed(1)},${y.toFixed(1)}`;
						})
						.join(' ')}
					<polyline
						points={polylinePoints}
						fill="none"
						stroke="var(--color-belief)"
						stroke-width="2"
					/>
				{/if}

				<!-- Dots on the curve -->
				{#each coverageCurve as [xi, yi], idx (idx)}
					{@const dx = COV_PAD.left + (xi / NUM_TEST_TOTAL) * cPlotW}
					{@const dy = COV_PAD.top + cPlotH * (1 - yi)}
					{@const aboveGuarantee = yi >= theoreticalGuarantee}
					<circle
						cx={dx.toFixed(1)}
						cy={dy.toFixed(1)}
						r={idx === coverageCurve.length - 1 ? 4 : 2.5}
						fill={aboveGuarantee ? 'var(--color-belief)' : '#ef4444'}
						opacity={idx === coverageCurve.length - 1 ? 1 : 0.6}
					/>
				{/each}
			</svg>
		{/if}
	</Figure>

	<!-- ════════════════ Panel: Prediction Set Size Histogram ═══════════════ -->
	<div class="panel-title">Distribution de la taille des ensembles de prédiction</div>

	<Figure type="chart" bind:containerWidth={histWidth}>
		{#if histWidth > 0 && hPlotW > 0}
			<svg
				viewBox={`0 0 ${histWidth} ${HIST_HEIGHT}`}
				width="100%"
				height={HIST_HEIGHT}
				role="img"
				aria-label="Histogramme de la taille des ensembles de prédiction"
			>
				<!-- Baseline -->
				<line
					x1={HIST_PAD.left}
					y1={HIST_PAD.top + hPlotH}
					x2={HIST_PAD.left + hPlotW}
					y2={HIST_PAD.top + hPlotH}
					stroke="var(--color-border)"
					stroke-width="1"
				/>

				<!-- Bars -->
				{#each setSizeDistribution as count, i (i)}
					{@const bx = HIST_PAD.left + i * histSlotW + (histSlotW - histBarW) / 2}
					{@const bH = (count / maxSetSizeCount) * hPlotH}
					{@const isSingle = i === 1}

					<rect
						x={bx.toFixed(1)}
						y={(HIST_PAD.top + hPlotH - bH).toFixed(1)}
						width={histBarW.toFixed(1)}
						height={bH.toFixed(1)}
						fill={isSingle ? 'var(--color-border)' : 'var(--color-belief)'}
						opacity={isSingle ? 0.3 : 0.75}
						rx="3"
					/>

					{#if bH > 14}
						<text
							x={(bx + histBarW / 2).toFixed(1)}
							y={(HIST_PAD.top + hPlotH - bH - 4).toFixed(1)}
							text-anchor="middle"
							font-size="10"
							font-family="var(--font-mono)"
							font-weight="600"
							fill="var(--color-text-muted)">{count}</text
						>
					{/if}

					<!-- X axis label -->
					<text
						x={(bx + histBarW / 2).toFixed(1)}
						y={(HIST_PAD.top + hPlotH + 14).toFixed(1)}
						text-anchor="middle"
						font-size="10"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">{i} classe{i > 1 ? 's' : ''}</text
					>
				{/each}

				<!-- X axis label -->
				<text
					x={(HIST_PAD.left + hPlotW / 2).toFixed(1)}
					y={(HIST_HEIGHT - 2).toFixed(1)}
					text-anchor="middle"
					font-size="9"
					fill="var(--color-text-muted)">Taille de l'ensemble de prédiction</text
				>
			</svg>
		{/if}
	</Figure>

	<!-- ════════════════ Caption ═══════════════ -->
	<p class="cap">
		La <strong>prédiction conforme</strong> garantit que, pour un niveau de signification α, la
		probabilité que la vraie étiquette appartienne à l'ensemble de prédiction est au moins
		<KatexInline formula={String.raw`1 - \alpha`} /> :<br />
		<KatexInline formula={String.raw`P(y \in C(x)) \geq 1 - \alpha`} />.<br />
		Ce vérificateur montre empiriquement cette propriété en révélant progressivement des échantillons
		de test et en calculant la couverture observée. La courbe de convergence illustre comment la couverture
		empirique se stabilise autour de la garantie théorique à mesure que le nombre d'échantillons augmente.
		Le seuil <KatexInline formula={String.raw`\hat{q}`} /> est calculé comme le quantile <KatexInline
			formula={String.raw`\lceil (n+1)(1-\alpha) \rceil`}
		/>-ième des scores de conformité sur l'ensemble de calibration.
	</p>
</div>

<style>
	.coverage-verifier {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	/* ── Panel titles ─────────────────── */
	.panel-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: -0.25rem;
	}

	/* ── Stats row ────────────────────── */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	@media (max-width: 600px) {
		.stats-row {
			grid-template-columns: 1fr;
		}
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		padding: 0.6rem 0.75rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: transparent;
	}

	.stat-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		margin-bottom: 0.15rem;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		font-family: var(--font-mono);
		color: var(--color-text);
		line-height: 1.2;
	}

	.stat-value.guarantee {
		color: var(--color-surprise);
	}

	.stat-value.empirical {
		color: #ef4444;
		transition: color 0.3s ease;
	}

	.stat-value.empirical.good {
		color: #16a34a;
	}

	.stat-value.quantile {
		color: var(--color-belief);
	}

	.stat-sub {
		font-size: 0.72rem;
		color: var(--color-text-muted);
		margin-top: 0.1rem;
	}

	/* ── Legend row ───────────────────── */
	.legend-row {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		padding: 0 0.25rem;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.legend-item.count {
		margin-left: auto;
		font-family: var(--font-mono);
	}

	.legend-dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-dot.covered {
		background: #22c55e;
	}

	.legend-dot.not-covered {
		background: #ef4444;
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
		color: inherit;
	}
</style>
