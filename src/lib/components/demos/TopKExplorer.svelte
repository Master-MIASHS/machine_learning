<script lang="ts">
	import { topK, accuracyAtK } from '$lib/math/prediction-sets';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import CurveChart from '../charts/CurveChart.svelte';

	// ─── Constants ──────────────────────────────────────────────
	const NUM_SAMPLES = 30;
	const CLASSES = ['Chat', 'Chien', 'Oiseau', 'Poisson', 'Lapin'];
	const NUM_CLASSES = CLASSES.length;
	const BAR_HEIGHT = 210;

	// ─── Seeded PRNG (deterministic demo data) ──────────────────
	function mulberry32(seed: number): () => number {
		return function () {
			seed |= 0;
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}
	const rand = mulberry32(42);

	// ─── Softmax helper ─────────────────────────────────────────
	function softmax(logits: number[]): number[] {
		const maxL = Math.max(...logits);
		const exps = logits.map((l) => Math.exp(l - maxL));
		const sum = exps.reduce((a, b) => a + b, 0);
		return exps.map((e) => e / sum);
	}

	// ─── Synthetic data generation ──────────────────────────────
	const yTrue: number[] = [];
	const yProba: number[][] = [];

	for (let s = 0; s < NUM_SAMPLES; s++) {
		const trueClass = Math.floor(rand() * NUM_CLASSES);
		yTrue.push(trueClass);

		// Logits biased toward the true class
		const logits = Array.from({ length: NUM_CLASSES }, (_, c) => {
			if (c === trueClass) return 1.5 + rand() * 3;
			return -1 + rand() * 3.5;
		});

		// ~25% chance a competing class gets boosted (harder samples)
		if (rand() < 0.25) {
			const decoy = (trueClass + 1 + Math.floor(rand() * (NUM_CLASSES - 1))) % NUM_CLASSES;
			logits[decoy] += 2 + rand() * 2;
		}

		yProba.push(softmax(logits));
	}

	// ─── Pre-computed accuracy curve (static) ──────────────────
	const accAtKAll: number[] = [];
	for (let ki = 1; ki <= NUM_CLASSES; ki++) {
		accAtKAll.push(accuracyAtK(yTrue, yProba, ki));
	}

	const accCurvePoints: [number, number][] = accAtKAll.map((acc, i) => [i + 1, acc]);

	// ─── Reactive state ────────────────────────────────────────
	let k = $state(2);
	let sampleIndex = $state(0);
	let barChartWidth = $state(0);

	// ─── Derived: current sample info ──────────────────────────
	const currentProbas = $derived(yProba[sampleIndex]);
	const currentTrueLabel = $derived(yTrue[sampleIndex]);
	const topKIndices = $derived(topK(currentProbas, k));
	const isInTopK = $derived(topKIndices.includes(currentTrueLabel));

	// Which classes are in the top-K set (for bar coloring)
	const classInTopK = $derived(
		Array.from({ length: NUM_CLASSES }, (_, c) => topKIndices.includes(c))
	);

	// Current accuracy@K over all samples
	const currentAccAtK = $derived(accuracyAtK(yTrue, yProba, k));

	// ─── Derived: DensityChart annotations at current K ────────
	const accVlines = $derived([{ x: k, stroke: 'var(--color-surprise)', strokeWidth: 1.5 }]);

	const accCurveDots = $derived([
		{
			x: k,
			y: currentAccAtK,
			fill: 'var(--color-surprise)',
			stroke: 'var(--color-bg)',
			strokeWidth: 2,
			r: 6,
			bar: true,
			barFill: 'var(--color-surprise)',
			barOpacity: 0.1,
			barWidth: 3
		}
	]);

	// Static curve definition for the accuracy plot
	const accCurves = [
		{
			points: accCurvePoints,
			stroke: 'var(--color-belief)',
			strokeWidth: 2.5,
			fill: 'var(--color-belief)',
			fillOpacity: 0.12
		}
	];

	// ─── Navigation ─────────────────────────────────────────────
	function prevSample() {
		sampleIndex = (sampleIndex - 1 + NUM_SAMPLES) % NUM_SAMPLES;
	}
	function nextSample() {
		sampleIndex = (sampleIndex + 1) % NUM_SAMPLES;
	}

	// ─── Bar chart layout helpers ──────────────────────────────
	const PAD_LEFT = 42;
	const PAD_RIGHT = 14;
	const PAD_TOP = 18;
	const PAD_BOTTOM = 50;

	const plotW = $derived(Math.max(0, barChartWidth - PAD_LEFT - PAD_RIGHT));
	const plotH = $derived(BAR_HEIGHT - PAD_TOP - PAD_BOTTOM);
	const baseline = $derived(PAD_TOP + plotH);
	const slotW = $derived(plotW / NUM_CLASSES);
	const barW = $derived(Math.min(slotW * 0.55, 64));

	function barX(i: number): number {
		return PAD_LEFT + i * slotW + (slotW - barW) / 2;
	}
	function barCenterX(i: number): number {
		return PAD_LEFT + i * slotW + slotW / 2;
	}
	function barTop(v: number): number {
		return PAD_TOP + plotH * (1 - v);
	}
	function barHeightFn(v: number): number {
		return Math.max(2, plotH * v);
	}

	// ─── Y-axis ticks ──────────────────────────────────────────
	const yTicks = [0, 0.25, 0.5, 0.75, 1];
</script>

<div class="topk-explorer">
	<!-- ════════════════ Panel 1: Bar Chart ═══════════════ -->
	<div class="panel-title">
		Probabilités prédites — échantillon {sampleIndex + 1} / {NUM_SAMPLES}
	</div>

	<Figure type="chart" bind:containerWidth={barChartWidth}>
		{#if barChartWidth > 0}
			<svg
				viewBox={`0 0 ${barChartWidth} ${BAR_HEIGHT}`}
				width="100%"
				height={BAR_HEIGHT}
				role="img"
				aria-label="Bar chart des probabilités par classe"
			>
				<!-- Y grid lines -->
				{#each yTicks as tick (tick)}
					{@const ty = PAD_TOP + plotH * (1 - tick)}
					<line
						x1={PAD_LEFT}
						y1={ty}
						x2={barChartWidth - PAD_RIGHT}
						y2={ty}
						stroke="var(--color-border)"
						stroke-width="1"
						stroke-dasharray="3,3"
					/>
					<text
						x={PAD_LEFT - 6}
						y={ty + 4}
						text-anchor="end"
						font-size="10"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">{tick.toFixed(2)}</text
					>
				{/each}

				<!-- Baseline -->
				<line
					x1={PAD_LEFT}
					y1={baseline}
					x2={barChartWidth - PAD_RIGHT}
					y2={baseline}
					stroke="var(--color-border)"
					stroke-width="1"
				/>

				<!-- Bars + labels -->
				{#each currentProbas as v, i (i)}
					{@const bx = barX(i)}
					{@const bTop = barTop(v)}
					{@const bH = barHeightFn(v)}
					{@const cx = barCenterX(i)}
					{@const inSet = classInTopK[i]}
					{@const isTrueClass = i === currentTrueLabel}

					<!-- Bar rect -->
					<rect
						x={bx.toFixed(1)}
						y={bTop.toFixed(1)}
						width={barW.toFixed(1)}
						height={bH.toFixed(1)}
						fill={inSet ? 'var(--color-belief)' : 'var(--color-border)'}
						opacity={inSet ? 0.85 : 0.3}
						rx="4"
					/>

					<!-- Probability annotation above bar -->
					{#if bH > 16}
						<text
							x={cx.toFixed(1)}
							y={(bTop - 5).toFixed(1)}
							text-anchor="middle"
							font-size="11"
							font-family="var(--font-mono)"
							font-weight="600"
							fill={inSet ? 'var(--color-belief)' : 'var(--color-text-muted)'}
							opacity={inSet ? 1 : 0.5}>{v.toFixed(2)}</text
						>
					{/if}

					<!-- Badge on true class bar -->
					{#if isTrueClass && bH > 30}
						{@const badgeY = Math.max(bTop + 14, PAD_TOP + 16)}
						<circle
							cx={cx.toFixed(1)}
							cy={badgeY.toFixed(1)}
							r="10"
							fill={isInTopK ? '#22c55e' : '#ef4444'}
							opacity="0.9"
						/>
						<text
							x={cx.toFixed(1)}
							y={(badgeY + 4).toFixed(1)}
							text-anchor="middle"
							font-size="13"
							fill="white"
							font-weight="700">{isInTopK ? '✓' : '✗'}</text
						>
					{/if}

					<!-- Class label below baseline -->
					<text
						x={cx.toFixed(1)}
						y={(baseline + 16).toFixed(1)}
						text-anchor="middle"
						font-size="12"
						fill="var(--color-text-muted)"
						class:true-label={isTrueClass}>{CLASSES[i]}</text
					>

					<!-- Top-K indicator under label -->
					<text
						x={cx.toFixed(1)}
						y={(baseline + 30).toFixed(1)}
						text-anchor="middle"
						font-size="9.5"
						fill={inSet ? 'var(--color-belief)' : 'var(--color-text-muted)'}
						opacity={inSet ? 0.7 : 0.4}
						class:true-label={isTrueClass}>{inSet ? 'Top-' + k : 'hors Top-' + k}</text
					>
				{/each}
			</svg>
		{/if}
	</Figure>

	<!-- Result badge -->
	<div class="result-badge" class:correct={isInTopK}>
		{#if isInTopK}
			<span class="badge-icon">✓</span> Correct — la vraie classe
			<strong>{CLASSES[currentTrueLabel]}</strong>
			est dans le Top-{k}
		{:else}
			<span class="badge-icon error">✗</span> Incorrect — la vraie classe
			<strong>{CLASSES[currentTrueLabel]}</strong>
			est hors du Top-{k}
		{/if}
	</div>

	<!-- Sample navigation -->
	<div class="nav-row">
		<button class="nav-btn" onclick={prevSample} disabled={NUM_SAMPLES <= 1}>◀ Précédent</button>
		<span class="sample-label">{sampleIndex + 1} / {NUM_SAMPLES}</span>
		<button class="nav-btn" onclick={nextSample} disabled={NUM_SAMPLES <= 1}>Suivant ▶</button>
	</div>

	<!-- ════════════════ Panel 2: Accuracy@K Curve ═══════════ -->
	<div class="panel-title">Courbe d'exactitude — Acc@{k} = {(currentAccAtK * 100).toFixed(1)}%</div>

	<Figure type="chart">
		<CurveChart
			curves={accCurves}
			xDomain={[1, NUM_CLASSES]}
			yDomain={[0, 1]}
			height={200}
			nTicks={NUM_CLASSES + 1}
			yAxis
			vlines={accVlines}
			curveDots={accCurveDots}
		/>
	</Figure>

	<!-- Controls -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Taille du Top-K</div>
			<Slider bind:value={k} min={1} max={NUM_CLASSES} step={1} label="K" />
		</div>
		<div class="grp">
			<div class="gttl">Échantillon affiché</div>
			<Slider bind:value={sampleIndex} min={0} max={NUM_SAMPLES - 1} step={1} label="Index" />
		</div>
	</SliderGrid>

	<!-- Caption -->
	<p class="cap">
		La classification <strong>Top-K</strong> ne retient pas seulement la classe la plus probable,
		mais les K classes avec la plus forte probabilité prédite. Un échantillon est considéré correct
		si sa vraie étiquette appartient à cet ensemble : <KatexInline
			formula={String.raw`y_{true} \in \text{Top}_K(\hat{p})`}
		/>. L'exactitude Top-K, notée <KatexInline
			formula={String.raw`\text{Acc@}K = \frac{1}{N}\sum_{i=1}^{N} \mathbb{1}(y_i \in \text{Top}_K(\hat{p}_i))`}
		/>, croît avec K et atteint 100% quand <KatexInline formula={String.raw`K = |C|`} />. En
		pratique, on cherche le plus petit K tel que Acc@K ≥ cible — un compromis entre couverture et
		précision de l'ensemble de prédiction.
	</p>
</div>

<style>
	.topk-explorer {
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

	/* ── Result badge ─────────────────── */
	.result-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md, 8px);
		font-size: 0.82rem;
		line-height: 1.4;
		background: rgba(239, 68, 68, 0.08);
		color: #dc2626;
		border-left: 3px solid #ef4444;
		transition:
			background 0.3s ease,
			border-color 0.3s ease,
			color 0.3s ease;
	}

	.result-badge.correct {
		background: rgba(34, 197, 94, 0.08);
		color: #16a34a;
		border-left-color: #22c55e;
	}

	.badge-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #ef4444;
		color: white;
		font-weight: 700;
		font-size: 13px;
		flex-shrink: 0;
	}

	.result-badge.correct .badge-icon {
		background: #22c55e;
	}

	.badge-icon.error {
		background: #ef4444;
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
		padding: 0.3rem 0.85rem;
		border-radius: var(--radius-sm, 6px);
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.nav-btn:hover {
		background: var(--color-surface-2, transparent);
		border-color: var(--color-belief);
		color: var(--color-text);
	}

	.sample-label {
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		min-width: 4rem;
		text-align: center;
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

	/* ── True class label highlight ───── */
	.true-label {
		font-weight: 600;
		fill: var(--color-surprise) !important;
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
