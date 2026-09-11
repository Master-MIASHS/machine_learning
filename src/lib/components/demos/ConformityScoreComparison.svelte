<script lang="ts">
	import {
		conformityScoreRank,
		conformityScore1MinusProba,
		conformityScoreCumulative,
		computeQuantileThreshold
	} from '$lib/math/conformal';

	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { mulberry32 } from '$lib/math/util';

	/* ------------------------------------------------------------ */
	/* Constants                                                     */
	/* ------------------------------------------------------------ */

	const NUM_CAL = 50;
	const NUM_TEST = 24;
	const NUM_CLASSES = 4;

	const CLASSES = ['A', 'B', 'C', 'D'];

	const CLASS_COLORS = ['#06b6d4', '#f43f5e', '#10b981', '#eab308'];

	const HIST_HEIGHT = 140;

	const HIST_PAD = {
		top: 8,
		right: 8,
		bottom: 24,
		left: 28
	};

	const NUM_BINS = 10;

	type ScoreDefinition = {
		id: string;
		name: string;
		color: string;
		formula: string;
		discrete: boolean;
		score: (probas: number[], label: number) => number;
	};

	const SCORE_TYPES: ScoreDefinition[] = [
		{
			id: 'rank',
			name: 'Rang',
			color: '#06b6d4',
			formula: 's(x,y)=\\mathrm{rang}(y)',
			discrete: true,
			score: conformityScoreRank
		},
		{
			id: 'prob',
			name: '1-p̂',
			color: '#f43f5e',
			formula: 's(x,y)=1-\\hat p_y',
			discrete: false,
			score: conformityScore1MinusProba
		},
		{
			id: 'cum',
			name: 'Cumulatif',
			color: '#10b981',
			formula: 's(x,y)=1-\\sum_{j:\\hat p_j\\ge \\hat p_y}\\hat p_j',
			discrete: false,
			score: conformityScoreCumulative
		}
	];

	/* ------------------------------------------------------------ */
	/* Seeded RNG                                                    */
	/* ------------------------------------------------------------ */



	const rand = mulberry32(42);

	/* ------------------------------------------------------------ */
	/* Softmax                                                       */
	/* ------------------------------------------------------------ */

	function softmax(logits: number[]): number[] {
		const max = Math.max(...logits);

		const exp = logits.map((v) => Math.exp(v - max));

		const sum = exp.reduce((a, b) => a + b, 0);

		return exp.map((v) => v / sum);
	}

	/* ------------------------------------------------------------ */
	/* Synthetic classifier                                          */
	/* ------------------------------------------------------------ */

	interface Example {
		probas: number[];
		label: number;
	}

	function generateExample(): Example {
		const label = Math.floor(rand() * NUM_CLASSES);

		const logits = Array(NUM_CLASSES).fill(0);

		const mode = rand();

		/*
		 * 70%:
		 * confident prediction
		 */
		if (mode < 0.7) {
			for (let c = 0; c < NUM_CLASSES; c++) {
				logits[c] = c === label ? 3 + rand() : rand();
			}
		}

		/*
		 * 20%:
		 * ambiguous prediction
		 */
		else if (mode < 0.9) {
			const rival = (label + 1 + Math.floor(rand() * (NUM_CLASSES - 1))) % NUM_CLASSES;

			for (let c = 0; c < NUM_CLASSES; c++) {
				if (c === label || c === rival) {
					logits[c] = 2 + rand();
				} else {
					logits[c] = 1.7 + 0.3 * rand();
				}
			}
		}

		/*
		 * 10%:
		 * confidently wrong
		 */
		else {
			const wrong = (label + 1 + Math.floor(rand() * (NUM_CLASSES - 1))) % NUM_CLASSES;

			for (let c = 0; c < NUM_CLASSES; c++) {
				if (c === wrong) {
					logits[c] = 3 + rand();
				} else if (c === label) {
					logits[c] = 1 + rand();
				} else {
					logits[c] = rand();
				}
			}
		}

		return {
			label,
			probas: softmax(logits)
		};
	}

	const calData = Array.from({ length: NUM_CAL }, generateExample);

	const testData = Array.from({ length: NUM_TEST }, generateExample);

	/* ------------------------------------------------------------ */
	/* UI state                                                      */
	/* ------------------------------------------------------------ */

	let alpha = $state(0.1);
	let testIndex = $state(0);

	let widths = $state<number[]>([]);

	/* ------------------------------------------------------------ */
	/* Generic helpers                                               */
	/* ------------------------------------------------------------ */

	function buildPredictionSet(
		probas: number[],
		qHat: number,
		scoreFn: (p: number[], y: number) => number
	) {
		const set: number[] = [];

		for (let y = 0; y < NUM_CLASSES; y++) {
			if (scoreFn(probas, y) <= qHat) {
				set.push(y);
			}
		}

		return set;
	}
	/* ------------------------------------------------------------ */
	/* Current test example                                          */
	/* ------------------------------------------------------------ */

	const currentTest = $derived(testData[testIndex]);

	/* ------------------------------------------------------------ */
	/* Histogram helper                                              */
	/* ------------------------------------------------------------ */

	function computeHistogram(scores: number[], discrete: boolean) {
		if (discrete) {
			const bins = Array(NUM_CLASSES).fill(0);

			for (const s of scores) {
				const idx = Math.max(0, Math.min(NUM_CLASSES - 1, Math.round(s) - 1));
				bins[idx]++;
			}

			return {
				bins,
				labels: Array.from({ length: NUM_CLASSES }, (_, i) => String(i + 1)),
				min: 1,
				max: NUM_CLASSES
			};
		}

		const min = Math.min(...scores);
		const max = Math.max(...scores);
		const range = Math.max(max - min, 1e-8);

		const bins = Array(NUM_BINS).fill(0);

		for (const s of scores) {
			const idx = Math.min(NUM_BINS - 1, Math.floor(((s - min) / range) * NUM_BINS));

			bins[idx]++;
		}

		return {
			bins,
			labels: Array.from({ length: NUM_BINS }, (_, i) => (min + (i / NUM_BINS) * range).toFixed(1)),
			min,
			max
		};
	}

	/* ------------------------------------------------------------ */
	/* Everything derived for each conformity score                  */
	/* ------------------------------------------------------------ */

	const scoreData = $derived.by(() =>
		SCORE_TYPES.map((method) => {
			/* Calibration scores */

			const calibrationScores = calData.map((sample) => method.score(sample.probas, sample.label));

			/* Quantile */

			const qHat = computeQuantileThreshold(calibrationScores, alpha);

			/* Prediction set for selected test point */

			const predictionSet = buildPredictionSet(currentTest.probas, qHat, method.score);

			/* Empirical coverage */

			const covered = testData.filter((sample) => {
				return buildPredictionSet(sample.probas, qHat, method.score).includes(sample.label);
			}).length;

			/* Average prediction set size */

			const averageSetSize =
				testData.reduce((acc, sample) => {
					return acc + buildPredictionSet(sample.probas, qHat, method.score).length;
				}, 0) / testData.length;

			return {
				...method,

				calibrationScores,

				qHat,

				histogram: computeHistogram(calibrationScores, method.discrete),

				predictionSet,

				coverage: covered,

				coverageRate: covered / testData.length,

				averageSetSize
			};
		})
	);
</script>

<div class="score-comparison">
	<!-- ═══════════ Test point header ═══════════ -->
	<div class="header">
		<div class="test-point-label">
			Point test #{testIndex + 1} — Classe vraie :
			<strong style="color: {CLASS_COLORS[currentTest.label]}">
				{CLASSES[currentTest.label]}
			</strong>
		</div>

		<div class="proba-bars">
			{#each currentTest.probas as p, i (i)}
				<div class="proba-col">
					<div
						class="proba-bar"
						style="
							height: {Math.max(p * 100, 5)}%;
							background:{CLASS_COLORS[i]}
						"
					>
						{#if p > 0.15}
							<span class="proba-val">
								{(p * 100).toFixed(0)}%
							</span>
						{/if}
					</div>

					<span class="class-label" class:true={i === currentTest.label}>
						{CLASSES[i]}
					</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- ═══════════ Score panels ═══════════ -->
	<div class="panels">
		{#each scoreData as score, i (score.id)}
			<!-- TypeScript is happy: Constants are now immediate children of the #each block -->
			{@const hW = widths[i] || 0}
			{@const plotW = hW - HIST_PAD.left - HIST_PAD.right}
			{@const plotH = HIST_HEIGHT - HIST_PAD.top - HIST_PAD.bottom}
			{@const base = HIST_HEIGHT - HIST_PAD.bottom}
			{@const maxCount = Math.max(...score.histogram.bins, 1)}

			<div class="panel">
				<div class="panel-header" style="border-color:{score.color}">
					<div class="panel-title">
						{score.name}
					</div>
					<div class="panel-formula">
						<KatexInline formula={score.formula} />
					</div>
				</div>

				<!-- Histogram -->
				<Figure type="chart">
					<svg
						bind:clientWidth={widths[i]}
						viewBox={`0 0 ${hW} ${HIST_HEIGHT}`}
						width="100%"
						height={HIST_HEIGHT}
					>
						{#if hW > 0}
							{#each score.histogram.bins as count, binIdx}
								{@const bins = score.histogram.bins.length}
								{@const bw = plotW / bins}
								{@const bh = (count / maxCount) * plotH}
								{@const x = HIST_PAD.left + binIdx * bw}

								<rect
									{x}
									y={base - bh}
									width={bw * 0.9}
									height={bh}
									fill={score.color}
									opacity="0.7"
									rx="2"
								/>

								<text
									x={x + bw / 2}
									y={base + 14}
									text-anchor="middle"
									font-size="9"
									fill="var(--color-text-muted)"
								>
									{score.histogram.labels[binIdx]}
								</text>
							{/each}

							<!-- Quantile line -->
							{#if Number.isFinite(score.qHat)}
								{@const range = score.histogram.max - score.histogram.min}
								{@const norm = range > 0 ? (score.qHat - score.histogram.min) / range : 0}
								{@const qx = HIST_PAD.left + Math.max(0, Math.min(1, norm)) * plotW}

								<line
									x1={qx}
									y1={HIST_PAD.top}
									x2={qx}
									y2={base}
									stroke="var(--color-text)"
									stroke-width="1.5"
									stroke-dasharray="4 3"
								/>

								<text
									x={qx}
									y={HIST_PAD.top - 1}
									text-anchor="middle"
									font-size="9"
									fill="var(--color-text)"
								>
									q̂={score.qHat.toFixed(2)}
								</text>
							{/if}

							<line
								x1={HIST_PAD.left}
								y1={base}
								x2={hW - HIST_PAD.right}
								y2={base}
								stroke="var(--color-border)"
							/>
						{/if}
					</svg>
				</Figure>

				<!-- Statistics -->

				<div class="panel-stats">
					<div class="stat-row">
						<span class="stat-label"> q̂ </span>

						<span class="stat-value">
							{score.qHat.toFixed(3)}
						</span>
					</div>

					<div class="stat-row">
						<span class="stat-label"> C(x) </span>

						<span class="stat-value">
							[
							{score.predictionSet.map((c) => CLASSES[c]).join(', ')}
							]
						</span>
					</div>

					<div class="stat-row">
						<span class="stat-label"> |C(x)| </span>

						<span class="stat-value">
							{score.predictionSet.length}
							/
							{NUM_CLASSES}
						</span>
					</div>

					<div class="stat-row">
						<span class="stat-label"> Couverture </span>

						<span class="stat-value coverage">
							{score.coverage}
							/
							{NUM_TEST}
							=
							{(score.coverageRate * 100).toFixed(0)}%
						</span>
					</div>

					<div class="stat-row">
						<span class="stat-label"> Taille moyenne </span>

						<span class="stat-value">
							{score.averageSetSize.toFixed(2)}
						</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- ═══════════ Controls ═══════════ -->

	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Niveau de signification α</div>

			<Slider bind:value={alpha} min={0.01} max={0.3} step={0.01} label="α" />
		</div>

		<div class="grp">
			<div class="gttl">Point test</div>

			<Slider bind:value={testIndex} min={0} max={NUM_TEST - 1} step={1} label="Index" />
		</div>
	</SliderGrid>

	<p class="cap">
		Le seuil q̂ est calibré sur les données de calibration afin de contrôler la probabilité d'erreur.
		Un score de conformité transforme la sortie du classifieur en ensemble prédictif : les classes
		dont le score est inférieur au seuil sont conservées. Les différents scores modifient le
		compromis entre couverture garantie et taille des ensembles.
	</p>
</div>

<style>
	.score-comparison {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	/* ── Header ────────────────────── */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.82rem;
	}

	.test-point-label {
		color: var(--color-text-muted);
	}

	/* ── Probability bars ──────────── */
	.proba-bars {
		display: flex;
		gap: 0.35rem;
		align-items: flex-end;
		height: 50px;
	}

	.proba-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.proba-bar {
		width: 28px;
		border-radius: 3px 3px 0 0;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 2px;
		transition: height 0.3s ease;
	}

	.proba-val {
		font-size: 8px;
		font-family: var(--font-mono);
		color: white;
		font-weight: 600;
	}

	.class-label {
		font-size: 9px;
		color: var(--color-text-muted);
	}

	.class-label.true {
		color: var(--color-surprise);
		font-weight: 700;
	}

	/* ── Panels ────────────────────── */
	.panels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 768px) {
		.panels {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.panel-header {
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		border-left: 3px solid;
		background: var(--color-surface-2, transparent);
	}

	.panel-title {
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.panel-formula {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/* ── Stats ─────────────────────── */
	.panel-stats {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		background: var(--color-surface-2, transparent);
		border-radius: 6px;
		font-size: 0.75rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
	}

	.stat-label {
		color: var(--color-text-muted);
	}

	.stat-value {
		font-family: var(--font-mono);
		font-weight: 600;
	}

	/* ── Slider group ──────────────── */
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

	/* ── Caption ───────────────────── */
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
