<script lang="ts">
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────
	const NUM_SAMPLES = 200;
	const CLASSES = ['Chat', 'Chien', 'Oiseau', 'Poisson'];
	const NUM_CLASSES = CLASSES.length;
	const HIST_HEIGHT = 140;


	const rand = mulberry32(77);

	// ─── Softmax helper ─────────────────────────────────
	function softmax(logits: number[]): number[] {
		const maxL = Math.max(...logits);
		const exps = logits.map((l) => Math.exp(l - maxL));
		const sum = exps.reduce((a, b) => a + b, 0);
		return exps.map((e) => e / sum);
	}

	function argmax(arr: number[]): number {
		let idx = 0;
		for (let i = 1; i < arr.length; i++) {
			if (arr[i] > arr[idx]) idx = i;
		}
		return idx;
	}

	function mean(vals: number[]): number {
		if (vals.length === 0) return 0;
		return vals.reduce((a, b) => a + b, 0) / vals.length;
	}

	// ─── Synthetic data generation ──────────────────────
	const rawData = Array.from({ length: NUM_SAMPLES }, () => {
		const trueClass = Math.floor(rand() * NUM_CLASSES);

		// Logits biased toward the true class with variable noise
		const logits = Array.from({ length: NUM_CLASSES }, (_, c) => {
			if (c === trueClass) return 1.2 + rand() * 3;
			return -0.5 + rand() * 3.5;
		});

		// ~20% chance a competing class gets boosted (harder samples)
		if (rand() < 0.2) {
			const decoy = (trueClass + 1 + Math.floor(rand() * (NUM_CLASSES - 1))) % NUM_CLASSES;
			logits[decoy] += 1.5 + rand() * 2;
		}

		return { logits, trueClass };
	});

	// ─── Temperature scaling ────────────────────────────
	function applyTemperature(probas: number[], temperature: number): number[] {
		if (temperature <= 0) return probas;
		const logits = probas.map((p) => Math.log(Math.max(p, 1e-10)));
		const scaled = logits.map((l) => l / temperature);
		return softmax(scaled);
	}

	// ─── Bin samples by max predicted probability ───────
	function binByConfidence(
		samples: { proba: number[]; trueLabel: number }[],
		numBins: number
	): Array<{
		lower: number;
		upper: number;
		count: number;
		avgConfidence: number;
		accuracy: number;
	}> {
		const bins = Array.from({ length: numBins }, () => ({
			confident: [] as number[],
			correct: [] as boolean[]
		}));

		for (const s of samples) {
			const maxProba = Math.max(...s.proba);
			const binIdx = Math.min(Math.floor(maxProba * numBins), numBins - 1);
			bins[binIdx].confident.push(maxProba);
			bins[binIdx].correct.push(argmax(s.proba) === s.trueLabel);
		}

		return bins.map((b, i) => ({
			lower: i / numBins,
			upper: (i + 1) / numBins,
			count: b.confident.length,
			avgConfidence: b.confident.length > 0 ? mean(b.confident) : (i + 0.5) / numBins,
			accuracy: b.correct.length > 0 ? mean(b.correct.map((c) => (c ? 1 : 0))) : 0
		}));
	}

	// ─── ECE computation ────────────────────────────────
	function computeECE(
		bins: Array<{ count: number; avgConfidence: number; accuracy: number }>,
		totalSamples: number
	): number {
		let ece = 0;
		for (const b of bins) {
			if (b.count > 0) {
				ece += Math.abs(b.accuracy - b.avgConfidence) * (b.count / totalSamples);
			}
		}
		return ece;
	}

	// ─── Reactive state ─────────────────────────────────
	let temperature = $state(1.0);
	let numBins = $state(5);
	let chartWidth = $state(0);

	// ─── Derived: apply temperature and compute bins ────
	const processedSamples = $derived.by(() => {
		return rawData.map((d) => ({
			trueLabel: d.trueClass,
			logits: d.logits,
			proba: applyTemperature(softmax(d.logits), temperature)
		}));
	});

	const bins = $derived(binByConfidence(processedSamples, numBins));

	const ece = $derived(computeECE(bins, NUM_SAMPLES));

	const overallAccuracy = $derived.by(() => {
		let correct = 0;
		for (const s of processedSamples) {
			if (argmax(s.proba) === s.trueLabel) correct++;
		}
		return correct / NUM_SAMPLES;
	});

	const wellCalibratedCount = $derived(
		bins.filter((b) => b.count > 0 && Math.abs(b.accuracy - b.avgConfidence) < 0.1).length
	);
	const poorlyCalibratedCount = $derived(
		bins.filter((b) => b.count > 0 && Math.abs(b.accuracy - b.avgConfidence) >= 0.1).length
	);

	// ─── Reliability diagram: diagonal reference curve ──
	const diagonalCurve = [
		{
			points: [
				[0, 0],
				[1, 1]
			] as [number, number][],
			stroke: 'var(--color-text-muted)',
			strokeWidth: 1.5,
			strokeDasharray: '6 4',
			opacity: 0.6
		}
	];

	// ─── Curve dots for accuracy points per bin ─────────
	const reliabilityDots = $derived(
		bins.map((b) => ({
			x: b.avgConfidence,
			y: b.accuracy,
			r: Math.max(4.5, 2 + b.count * 0.4),
			fill: Math.abs(b.accuracy - b.avgConfidence) < 0.1 ? '#22c55e' : '#ef4444',
			stroke: 'var(--color-bg)',
			strokeWidth: 2
		}))
	);

	// ─── Histogram layout helpers ──────────────────────
	const PAD_L = 36;
	const PAD_R = 14;
	const PAD_T = 12;
	const PAD_B = 40;

	const hPlotW = $derived(Math.max(0, chartWidth - PAD_L - PAD_R));
	const hPlotH = $derived(HIST_HEIGHT - PAD_T - PAD_B);
</script>

<div class="calibration-card">
	<!-- ═══════════ Panel 1: Reliability Diagram ═══════════ -->
	<div class="panel-title">Diagramme de fiabilité — confiance prédite vs exactitude empirique</div>

	<Figure type="chart">
		<DensityChart
			curves={diagonalCurve}
			xDomain={[0, 1]}
			yMax={1.05}
			height={220}
			nTicks={numBins + 1}
			yAxis
			curveDots={reliabilityDots}
			legend={[
				{ label: 'Calibration parfaite', color: 'var(--color-text-muted)', kind: 'dashed-line' },
				{ label: 'Bien calibré (gap < 0.1)', color: '#22c55e', kind: 'fill' },
				{ label: 'Mal calibré (gap ≥ 0.1)', color: '#ef4444', kind: 'fill' }
			]}
		/>
	</Figure>

	<!-- ═══════════ Panel 2: Calibration Histogram ═══════════ -->
	<div class="panel-title">Distribution des échantillons par bin de confiance</div>

	<Figure type="chart" bind:containerWidth={chartWidth}>
		{#if chartWidth > 0}
			{@const baseline = PAD_T + hPlotH}
			{@const maxCount = Math.max(...bins.map((b) => b.count), 1)}
			{@const slotW = hPlotW / numBins}
			{@const barW = Math.min(slotW * 0.65, 48)}

			<svg
				viewBox={`0 0 ${chartWidth} ${HIST_HEIGHT}`}
				width="100%"
				height={HIST_HEIGHT}
				role="img"
				aria-label="Histogramme de calibration par bin"
			>
				<!-- Baseline -->
				<line
					x1={PAD_L}
					y1={baseline}
					x2={chartWidth - PAD_R}
					y2={baseline}
					stroke="var(--color-border)"
					stroke-width="1"
				/>

				<!-- Bars per bin -->
				{#each bins as b, idx (b.lower)}
					{@const bx = PAD_L + slotW * idx + (slotW - barW) / 2}
					{@const bh = Math.max(1, hPlotH * (b.count / maxCount))}
					{@const gap = Math.abs(b.accuracy - b.avgConfidence)}
					<!-- Bar rect -->
					<rect
						x={bx.toFixed(1)}
						y={(baseline - bh).toFixed(1)}
						width={barW.toFixed(1)}
						height={bh.toFixed(1)}
						fill={gap < 0.1 ? '#22c55e' : '#ef4444'}
						opacity="0.6"
						rx="3"
					/>
					<!-- Count label -->
					{#if bh > 18}
						<text
							x={(bx + barW / 2).toFixed(1)}
							y={(baseline - bh - 4).toFixed(1)}
							text-anchor="middle"
							font-size="10"
							font-family="var(--font-mono)"
							fill="var(--color-text-muted)">{b.count}</text
						>
					{/if}
					<!-- Bin label -->
					<text
						x={(bx + barW / 2).toFixed(1)}
						y={(baseline + 14).toFixed(1)}
						text-anchor="middle"
						font-size="9"
						font-family="var(--font-mono)"
						fill="var(--color-text-muted)">{b.lower.toFixed(1)}–{b.upper.toFixed(1)}</text
					>
				{/each}
			</svg>
		{/if}
	</Figure>

	<!-- ═══════════ Metrics Row ═══════════ -->
	<div class="metrics-row">
		<div class="metric">
			<span class="metric-label">ECE</span>
			<span class="metric-value">{ece.toFixed(3)}</span>
			<span class="metric-sub">exactitude globale {(overallAccuracy * 100).toFixed(1)}%</span>
		</div>
		<div class="metric" class:good={wellCalibratedCount > poorlyCalibratedCount}>
			<span class="metric-label">Bins calibrés</span>
			<span class="metric-value">{wellCalibratedCount}</span>
		</div>
		<div class="metric" class:bad={poorlyCalibratedCount > 0}>
			<span class="metric-label">Mal calibrés</span>
			<span class="metric-value">{poorlyCalibratedCount}</span>
		</div>
	</div>

	<!-- ═══════════ Controls ═══════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Échelle de température</div>
			<Slider bind:value={temperature} min={0.2} max={3.0} step={0.1} label="T" />
		</div>
		<div class="grp">
			<div class="gttl">Nombre de bins</div>
			<Slider bind:value={numBins} min={2} max={10} step={1} label="B" />
		</div>
	</SliderGrid>

	<!-- ═══════════ Caption ═══════════ -->
	<p class="cap">
		Un modèle <strong>bien calibré</strong> a une confiance prédite qui correspond à son exactitude
		empirique : si le modèle prédit avec 80% de confiance, alors environ 80% de ces prédictions
		doivent être correctes. L'<strong>ECE</strong>
		(Expected Calibration Error) mesure cet écart moyen pondéré entre la confiance et l'exactitude sur
		chaque bin :
		<KatexInline
			formula={String.raw`\text{ECE} = \sum_{b=1}^{B} \frac{|b|}{N} \bigl|\text{acc}(b) - \text{conf}(b)\bigr|`}
		/>. L'<strong>échelle de température</strong>
		<KatexInline formula={String.raw`T > 0`} /> affine les logits avant le softmax : un <KatexInline
			formula={String.raw`T < 1`}
		/> rend la distribution plus tranchée (surestimation de la confiance), tandis qu'un
		<KatexInline formula={String.raw`T > 1`} /> l'aplatit (sous-estimation). L'ajustement optimal de T
		réduit l'ECE et améliore la calibration globale. Les points verts indiquent des bins bien calibrés
		(écart &lt; 0,1), les points rouges signalent un déséquilibre entre confiance et performance réelle.
	</p>
</div>

<style>
	.calibration-card {
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

	/* ── Metrics row ─────────────────── */
	.metrics-row {
		display: flex;
		gap: 1rem;
		padding: 0.6rem 0.75rem;
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
		border: 1px solid var(--color-border);
	}

	.metric {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		flex: 1;
		text-align: center;
	}

	.metric-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.metric-value {
		font-family: 'SF Mono', 'Fira Code', monospace, system-ui;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.metric-sub {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.metric.good .metric-value {
		color: #22c55e;
	}

	.metric.bad .metric-value {
		color: #ef4444;
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
