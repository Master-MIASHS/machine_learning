<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { findOptimalK } from '$lib/math/prediction-sets';
	import CurveChart from '../charts/CurveChart.svelte';

	// ─── Constants ──────────────────────────────────────
	const NUM_SAMPLES = 200;
	const CLASSES = ['Chat', 'Chien', 'Oiseau', 'Poisson', 'Lapin'];
	const NUM_CLASSES = CLASSES.length;

	// ─── Seeded PRNG ────────────────────────────────────
	function mulberry32(seed: number): () => number {
		return function () {
			let s = (seed |= 0);
			s = (s + 0x6d2b79f5) | 0;
			let t = Math.imul(s ^ (s >>> 15), 1 | s);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function softmax(logits: number[]): number[] {
		const maxL = Math.max(...logits);
		const exps = logits.map((l) => Math.exp(l - maxL));
		const sum = exps.reduce((a, b) => a + b, 0);
		return exps.map((e) => e / sum);
	}

	// ─── Static sample population ───────────────────────
	interface SampleBase {
		trueClass: number;
		signal: number[];
		noise: number[];
	}

	const rand = mulberry32(42);
	const samples: SampleBase[] = [];

	for (let i = 0; i < NUM_SAMPLES; i++) {
		const trueClass = Math.floor(rand() * NUM_CLASSES);

		// Weak class separation:
		// top-1 is imperfect, but top-K can recover.
		const signal = Array.from({ length: NUM_CLASSES }, (_, c) => {
			if (c === trueClass) {
				return 0.4 + rand() * 0.8;
			}
			return rand() * 0.8;
		});

		const noise = Array.from({ length: NUM_CLASSES }, () => rand() - 0.5);

		samples.push({
			trueClass,
			signal,
			noise
		});
	}

	// ─── Controls ───────────────────────────────────────
	let targetAccuracy = $state(0.85);
	let noiseLevel = $state(0.8);

	// ─── Current prediction probabilities ───────────────
	const data = $derived.by(() => {
		const yTrue: number[] = [];
		const yProba: number[][] = [];

		for (const s of samples) {
			yTrue.push(s.trueClass);

			const logits = s.signal.map((v, c) => v + s.noise[c] * noiseLevel);

			yProba.push(softmax(logits));
		}

		return { yTrue, yProba };
	});

	// ─── Accuracy@K computation ─────────────────────────
	const optResult = $derived.by(() => findOptimalK(data.yTrue, data.yProba, targetAccuracy));

	const accCurvePoints = $derived(
		optResult.accuracies.map((acc, i) => [i + 1, acc] as [number, number])
	);

	const optimalAcc = $derived(optResult.accuracies[optResult.k - 1]);

	const top1Accuracy = $derived(optResult.accuracies[0]);

	const topKGain = $derived(optimalAcc - top1Accuracy);

	// Acc@C (K = number of classes) is *always* 1.0 — the Top-K set then contains every
	// class, so the true label is trivially included regardless of noise. Comparing the
	// target against Acc@C is therefore a tautology (always true) and never reacts to the
	// sliders. What we actually want to know is whether the target is reachable *without*
	// falling back to the full label set — i.e. whether Top-K is still doing useful work.
	const targetAchievable = $derived(optResult.k < NUM_CLASSES);

	// ─── Chart layers ──────────────────────────────────

	const accCurve = $derived({
		points: accCurvePoints,
		stroke: 'var(--color-belief)',
		strokeWidth: 2.5,
		fill: 'var(--color-belief)',
		fillOpacity: 0.12
	});

	const thresholdCurve = $derived({
		points: [
			[1, targetAccuracy],
			[NUM_CLASSES, targetAccuracy]
		] as [number, number][],
		stroke: 'var(--color-surprise)',
		strokeWidth: 1.5,
		strokeDasharray: '6 4',
		fill: 'none'
	});

	const curves = $derived([accCurve, thresholdCurve]);

	const fillRegion = $derived([
		{
			curveA: 0,
			curveB: 1,
			fill: 'var(--color-surprise)',
			opacity: 0.12
		}
	]);

	const optimalDot = $derived([
		{
			x: optResult.k,
			y: optimalAcc,
			r: 7,
			fill: '#22c55e',
			stroke: 'var(--color-bg)',
			strokeWidth: 2.5,
			bar: true,
			barFill: '#22c55e',
			barOpacity: 0.1,
			barWidth: 3
		}
	]);

	const optVline = $derived([
		{
			x: optResult.k,
			stroke: '#22c55e',
			strokeWidth: 1.5,
			strokeDasharray: '3 3'
		}
	]);

	const legend = $derived([
		{
			label: 'Acc@K',
			color: 'var(--color-belief)',
			kind: 'line' as const
		},
		{
			label: `Seuil ${targetAccuracy.toFixed(2)}`,
			color: 'var(--color-surprise)',
			kind: 'dashed-line' as const
		}
	]);
</script>

<div class="acc-k-cutoff">
	<!-- ════════════════ Metrics panel ═══════════════ -->
	<div class="metrics-panel">
		<div class="metric-item">
			<span class="metric-label">K optimal</span>
			<span class="metric-value">{optResult.k}</span>
		</div>

		<div class="metric-divider"></div>

		<div class="metric-item">
			<span class="metric-label">Acc@{optResult.k}</span>
			<span class="metric-value">
				{(optimalAcc * 100).toFixed(1)}%
			</span>
		</div>

		<div class="metric-divider"></div>

		<div class="metric-item">
			<span class="metric-label">Gain vs Top-1</span>
			<span class="metric-value">
				+{(topKGain * 100).toFixed(1)}%
			</span>
		</div>

		<div class="metric-divider"></div>

		<!--
			`target-metric` scopes the achieved/not-achieved color rules below to THIS item only.
			Previously the CSS used a bare `:not(.achieved)` descendant selector, which matched
			every `.metric-value` on the page (K optimal, Acc@K, Gain included) because none of
			their ancestors carry `.achieved` either — it always won due to !important + source
			order, so every number rendered red no matter what.
		-->
		<div class="metric-item target-metric" class:achieved={targetAchievable}>
			<span class="metric-label">Cible</span>
			<span class="metric-value">
				{targetAchievable ? '✓ Atteinte' : `✗ Nécessite K=${NUM_CLASSES}`}
			</span>
		</div>
	</div>

	<!-- ════════════════ Accuracy@K chart ═══════════════ -->
	<div class="panel-title">Exactitude cumulative — gain apporté par les prédictions Top-K</div>

	<Figure type="chart">
		<CurveChart
			{curves}
			xDomain={[1, NUM_CLASSES]}
			yDomain={[0, 1.05]}
			height={240}
			nTicks={NUM_CLASSES + 1}
			yAxis
			vlines={optVline}
			curveDots={optimalDot}
			fillBetween={fillRegion}
			{legend}
		/>
	</Figure>

	<!-- ════════════════ Controls ═══════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Précision cible</div>

			<Slider bind:value={targetAccuracy} min={0.5} max={1.0} step={0.01} label="Acc" />
		</div>

		<div class="grp">
			<div class="gttl">Ambiguïté du modèle</div>

			<Slider bind:value={noiseLevel} min={0} max={2} step={0.05} label="σ" />
		</div>
	</SliderGrid>

	<!-- ════════════════ Caption ═══════════════ -->
	<p class="cap">
		La prédiction Top-K conserve les K classes les plus probables. L'exactitude <KatexInline
			formula={String.raw`\text{Acc@}K`}
		/>
		mesure la proportion d'exemples où la vraie classe apparaît parmi ces K hypothèses. On choisit le
		plus petit K satisfaisant :
		<KatexInline formula={String.raw`\text{Acc@}K \geq \tau`} />.
		<br />

		Pour un modèle peu ambigu, le Top-1 suffit souvent. Lorsque les scores sont plus proches (bruit
		élevé), augmenter K permet de récupérer des prédictions manquées : la différence
		<KatexInline formula={String.raw`\text{Acc@}K-\text{Acc@}1`} />
		représente le gain apporté par le raisonnement Top-K.
	</p>
</div>

<style>
	.acc-k-cutoff {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	/* ── Panel title ─────────────────── */
	.panel-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: -0.25rem;
	}

	/* ── Metrics panel ─────────────── */
	.metrics-panel {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.6rem 1rem;
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, rgba(148, 163, 184, 0.06));
		border: 1px solid var(--color-border);
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		min-width: 7rem;
	}

	.metric-label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.metric-value {
		font-family: 'SF Mono', 'Fira Code', monospace, system-ui;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.2;
	}

	.metric-item .metric-value {
		color: #3b82f6;
	}

	.metric-divider {
		width: 1px;
		height: 2rem;
		background: var(--color-border);
		flex-shrink: 0;
	}

	/* Status colors for the target-achievement metric only (scoped to .target-metric,
	   not a bare :not(.achieved) that would match every metric on the page). */
	.target-metric.achieved .metric-value {
		color: #22c55e !important;
	}

	.target-metric:not(.achieved) .metric-value {
		color: #ef4444 !important;
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
</style>
