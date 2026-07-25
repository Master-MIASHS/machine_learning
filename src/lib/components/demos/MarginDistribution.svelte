<script lang="ts">
	/**
	 * Distribution des marges fonctionnelles au fil des itérations d'AdaBoost.
	 */

	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import type { DecisionStump } from '$lib/math/random-forest.js';
	import { runAdaBoostWithHistory } from '$lib/math/boosting.js';

	// ─── Constants ──────────────────────────────────────────────────────
	const N_SAMPLES = 60;
	const T_MAX = 20;
	const NUM_BINS = 15;
	const SVG_W = 520;
	const SVG_H = 240;
	const PAD = { top: 34, right: 16, bottom: 36, left: 48 };
	const PLOT_W = SVG_W - PAD.left - PAD.right;
	const PLOT_H = SVG_H - PAD.top - PAD.bottom;

	// ─── Seeded RNG ─────────────────────────────────────────────────────
	function makeRng(seed: number) {
		let s = seed;
		return () => {
			s = (s * 16807 + 11) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	function randn(rng: () => number): number {
		let u1 = rng(),
			u2 = rng();
		while (u1 === 0) u1 = rng();
		return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	// ─── Data generation ────────────────────────────────────────────────
	function generateDataset(seed: number) {
		const rng = makeRng(seed + 42);
		const X: number[][] = [];
		const y: number[] = [];
		const half = N_SAMPLES / 2;

		for (let i = 0; i < N_SAMPLES; i++) {
			const label = i < half ? -1 : 1;
			const cx = label * 1.2;
			const x0 = cx + randn(rng) * 0.9;
			const x1 = randn(rng) * 1.3;
			X.push([x0, x1]);
			y.push(label);
		}
		return { X, y };
	}

	// ─── Margin computation ─────────────────────────────────────────────
	type ModelWithAlpha = { stump: DecisionStump; alpha: number };

	function computeMarginsAtStep(
		models: Array<ModelWithAlpha>,
		X: number[][],
		y: number[]
	): number[] {
		return X.map((x, i) => {
			let margin = 0;
			for (const m of models) {
				const pred =
					x[m.stump.featureIdx] <= m.stump.threshold ? m.stump.leftValue : m.stump.rightValue;
				margin += m.alpha * y[i] * pred;
			}
			return margin;
		});
	}

	function computeHistogram(
		values: number[],
		numBins: number,
		maxAbsVal: number
	): Array<{ count: number; isPositive: boolean; center: number }> {
		const binWidth = (2 * maxAbsVal) / numBins;
		const bins = Array.from({ length: numBins }, () => ({
			count: 0,
			isPositive: false,
			center: 0
		}));

		for (let b = 0; b < numBins; b++) {
			bins[b].center = -maxAbsVal + (b + 0.5) * binWidth;
			bins[b].isPositive = bins[b].center > 0;
		}

		for (const v of values) {
			let idx = Math.floor((v + maxAbsVal) / binWidth);
			idx = Math.max(0, Math.min(numBins - 1, idx));
			bins[idx].count++;
		}

		return bins;
	}

	// ─── Reactive state ─────────────────────────────────────────────────
	let seed = $state(7);
	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animTimer: ReturnType<typeof setTimeout> | null = null;

	function initData() {
		const { X, y } = generateDataset(seed);
		const history = runAdaBoostWithHistory(X, y, T_MAX);
		return { X, y, history };
	}

	let data = $state(initData());

	const numModels = $derived(data.history.models.length);
	const allMarginsPositive = $derived(
		Array.from({ length: numModels }, (_, s) =>
			computeMarginsAtStep(data.history.models.slice(0, s + 1), data.X, data.y)
		)
	);

	const currentMargins = $derived(
		currentStep > 0 ? allMarginsPositive[currentStep - 1] : new Array(N_SAMPLES).fill(0)
	);
	const maxAbsMargin = $derived(
		Math.max(...allMarginsPositive.map((m) => Math.max(...m.map(Math.abs))), 0.5)
	);

	const bins = $derived(computeHistogram(currentMargins, NUM_BINS, maxAbsMargin));
	const maxBinCount = $derived(Math.max(...bins.map((b) => b.count), 1));

	// ─── Metrics ────────────────────────────────────────────────────────
	const meanMargin = $derived(currentMargins.reduce((a, b) => a + b, 0) / currentMargins.length);
	const minMargin = $derived(Math.min(...currentMargins));
	const correctCount = $derived(currentMargins.filter((m) => m > 0).length);
	const misclassifiedCount = $derived(currentMargins.filter((m) => m <= 0).length);
	const stdDev = $derived(
		Math.sqrt(
			currentMargins.reduce((acc, v) => acc + (v - meanMargin) ** 2, 0) / currentMargins.length
		)
	);

	// ─── SVG scales ─────────────────────────────────────────────────────
	function scaleX(v: number): number {
		return PAD.left + ((v + maxAbsMargin) / (2 * maxAbsMargin)) * PLOT_W;
	}
	function scaleY(count: number): number {
		return PAD.top + PLOT_H - (count / maxBinCount) * PLOT_H;
	}

	// ─── Controls ───────────────────────────────────────────────────────
	function step() {
		if (currentStep < numModels) currentStep += 1;
		stopAnimation();
	}
	function prevStep() {
		if (currentStep > 0) currentStep -= 1;
		stopAnimation();
	}
	function reset() {
		currentStep = 0;
		stopAnimation();
	}
	function regenerate() {
		seed += 1;
		data = initData();
		currentStep = 0;
		stopAnimation();
	}

	function togglePlay() {
		if (isPlaying) {
			stopAnimation();
		} else {
			isPlaying = true;
			if (currentStep >= numModels) currentStep = 0;
			animTimer = setTimeout(tick, 500);
		}
	}

	function tick() {
		if (!isPlaying) return;
		currentStep += 1;
		if (currentStep >= numModels) {
			stopAnimation();
			return;
		}
		animTimer = setTimeout(tick, 500);
	}

	function stopAnimation() {
		isPlaying = false;
		if (animTimer) {
			clearTimeout(animTimer);
			animTimer = null;
		}
	}
</script>

<div class="demo-wrap">
	<!-- Header -->
	<div class="header">
		<h2>Distribution des marges fonctionnelles</h2>
		<p class="subtitle">
			margin<sub>i</sub>(s) = &sum;<sub>t=0..s</sub>&alpha;<sub>t</sub> · y<sub>i</sub> · h<sub
				>t</sub
			>(x<sub>i</sub>) — comment les marges se séparent en deux groupes
		</p>
	</div>

	<!-- Histogram -->
	<Figure type="chart">
		<svg
			viewBox={`0 0 ${SVG_W} ${SVG_H}`}
			class="hist-svg"
			role="img"
			aria-label="Histogramme des marges fonctionnelles"
		>
			<!-- Grid lines (horizontal) -->
			<g class="grid">
				{#each Array.from({ length: 5 }, (_, i) => Math.round((maxBinCount / 4) * i)) as tickVal}
					<line x1={PAD.left} y1={scaleY(tickVal)} x2={SVG_W - PAD.right} y2={scaleY(tickVal)} />
				{/each}
			</g>

			<!-- Zero reference line -->
			<line class="zero-line" x1={scaleX(0)} y1={PAD.top} x2={scaleX(0)} y2={SVG_H - PAD.bottom} />

			<!-- Bars -->
			{#each bins as bin}
				<rect
					class={`bar ${bin.isPositive ? 'bar-positive' : 'bar-negative'}`}
					x={scaleX(bin.center) - PLOT_W / NUM_BINS / 2}
					y={scaleY(bin.count)}
					width={PLOT_W / NUM_BINS}
					height={PAD.top + PLOT_H - scaleY(bin.count)}
				>
					<title
						>{bin.isPositive ? 'Correctement classés' : 'Mauvais classement'}: {bin.count} &lrm;|&rarr;
						marge &asymp; {bin.center.toFixed(2)}</title
					>
				</rect>
			{/each}

			<!-- Y axis labels -->
			<g class="axis-labels">
				{#each Array.from( { length: 5 }, (_, i) => Math.round((maxBinCount / 4) * i) ) as tickVal (tickVal)}
					<text x={PAD.left - 6} y={scaleY(tickVal) + 4} text-anchor="end" class="axis-tick">
						{tickVal}
					</text>
				{/each}
			</g>

			<!-- X axis labels -->
			<g class="axis-labels">
				<text x={scaleX(-maxAbsMargin)} y={SVG_H - 8} text-anchor="middle" class="axis-tick">
					{-maxAbsMargin.toFixed(1)}
				</text>
				<text x={scaleX(0)} y={SVG_H - 8} text-anchor="middle" class="axis-tick zero-label">
					0
				</text>
				<text x={scaleX(maxAbsMargin)} y={SVG_H - 8} text-anchor="middle" class="axis-tick">
					{maxAbsMargin.toFixed(1)}
				</text>
			</g>

			<!-- Axis titles -->
			<text x={SVG_W / 2} y={SVG_H - 1} text-anchor="middle" class="axis-title-x">
				Marge fonctionnelle
			</text>
			<text
				x={14}
				y={SVG_H / 2}
				text-anchor="middle"
				class="axis-title-y"
				transform={`rotate(-90, 14, ${SVG_H / 2})`}
			>
				Fréquence
			</text>

			<!-- Legend -->
			<g transform={`translate(${PAD.left + 8}, ${PAD.top + 6})`}>
				<rect width="10" height="10" rx="2" class="legend-positive" />
				<text x={15} y={9} class="legend-text">Correct (marge &gt; 0)</text>
				<rect x="110" width="10" height="10" rx="2" class="legend-negative" />
				<text x={125} y={9} class="legend-text">Mauvais (marge &le; 0)</text>
			</g>

			<!-- Step badge -->
			<g transform={`translate(${SVG_W / 2}, 14)`}>
				<rect x="-52" y="-10" width="104" height="20" rx="4" class="badge-bg" />
				<text x="0" y="3" text-anchor="middle" class="badge-text">
					Itération {currentStep} / {numModels}
				</text>
			</g>
		</svg>

		{#snippet caption()}
			Les marges positives (bleu) correspondent aux échantillons correctement classés, les marges
			négatives (rouge) aux erreurs. La ligne verticale marque la séparation à marge = 0.
		{/snippet}
	</Figure>

	<!-- Metrics Panel -->
	<Metrics align="center">
		<div class="cell">
			<span class="label">Marge moyenne</span>
			<span class="value" style:color="var(--color-belief)">{meanMargin.toFixed(3)}</span>
			<span class="unit">&mu; au pas {currentStep}</span>
		</div>

		<div class="cell">
			<span class="label">Marge minimale</span>
			<span
				class="value"
				style:color={minMargin > 0 ? 'var(--color-belief)' : 'var(--color-surprise)'}
				>{minMargin.toFixed(3)}</span
			>
			<span class="unit">{minMargin > 0 ? '✓ tous séparés' : '✗ encore des erreurs'}</span>
		</div>

		<div class="cell">
			<span class="label">Classification</span>
			<span class="value" style:color="var(--color-belief)">{correctCount}</span>
			<span class="unit">sur {N_SAMPLES} corrects ({misclassifiedCount} erreurs)</span>
		</div>

		<div class="cell">
			<span class="label">Écart-type</span>
			<span class="value" style:color="var(--color-positive)">{stdDev.toFixed(3)}</span>
			<span class="unit">&sigma; des marges</span>
		</div>
	</Metrics>

	<!-- Controls -->
	<div class="controls-panel">
		<Slider
			bind:value={currentStep}
			min={0}
			max={numModels}
			step={1}
			label={`Itération (${currentStep}/${numModels})`}
		/>

		<div class="actions-row">
			<Button variant="outline" size="sm" onclick={prevStep} disabled={currentStep <= 0}
				>◀ Préc.</Button
			>
			<Button variant="outline" size="sm" onclick={reset}>⟲ Reset</Button>
			<Button variant="primary" size="sm" onclick={togglePlay} disabled={numModels === 0}>
				{isPlaying ? '⏸ Pause' : '▶ Lecture'}
			</Button>
			<Button variant="outline" size="sm" onclick={step} disabled={currentStep >= numModels}
				>Suiv. ▶</Button
			>
			<Button variant="outline" size="sm" onclick={regenerate}>⟳ Nouvelles données</Button>
		</div>
	</div>

	<!-- Insight box -->
	<aside class="insight-box">
		<span class="icon">💡</span>
		<p>
			Pendant que AdaBoost itère, la distribution des marges se <strong
				>déplace vers la droite</strong
			>
			: les échantillons correctement classés voient leur marge augmenter, tandis que ceux qui sont mal
			classés sont progressivement corrigés. Quand le
			<strong>marge minimale devient strictement positive</strong>, tous les échantillons sont
			séparés avec une marge &gt; 0 — c'est la garantie de bonne généralisation du théorème de
			<strong>maximisation de la marge</strong>. La dispersion (&sigma;) reflète la confiance
			hétérogène du classifieur sur chaque point.
		</p>
	</aside>
</div>

<style>
	.demo-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.header {
		text-align: center;
	}

	.subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	/* ── Histogram SVG ─────────────────────────────────────────────── */
	.hist-svg {
		display: block;
		width: 100%;
		aspect-ratio: 520 / 240;
		margin-top: 20px;
		height: auto;
	}

	.grid line {
		stroke: var(--color-border);
		stroke-opacity: 0.4;
	}

	.zero-line {
		stroke: var(--color-text-muted);
		stroke-width: 1.2;
		stroke-dasharray: 6 3;
	}

	.bar {
		transition:
			height 0.25s ease,
			y 0.25s ease;
		rx: 1;
	}

	.bar-positive {
		fill: var(--color-belief);
		fill-opacity: 0.78;
	}

	.bar-negative {
		fill: var(--color-surprise);
		fill-opacity: 0.78;
	}

	.axis-tick {
		font-size: 9px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	.zero-label {
		font-weight: 600;
	}

	.axis-title-x,
	.axis-title-y {
		font-size: 10px;
		fill: var(--color-text-muted);
	}

	.badge-bg {
		fill: rgba(255, 255, 255, 0.1);
		stroke: var(--color-border);
		stroke-width: 0.5;
	}

	.badge-text {
		font-size: 10px;
		fill: var(--color-text);
		font-weight: 600;
	}

	.legend-positive {
		fill: var(--color-belief);
		fill-opacity: 0.78;
	}

	.legend-negative {
		fill: var(--color-surprise);
		fill-opacity: 0.78;
	}

	.legend-text {
		font-size: 9px;
		fill: var(--color-text-muted);
	}

	/* ── Metrics cells ─────────────────────────────────────────────── */
	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 0.3rem 0.6rem;
	}

	.cell .label {
		font-size: 0.72rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.cell .value {
		font-family: var(--font-mono, monospace);
		font-size: 1.05rem;
		font-weight: 600;
	}

	.cell .unit {
		font-size: 0.72rem;
		color: var(--color-text-muted);
	}

	/* ── Controls ──────────────────────────────────────────────────── */
	.controls-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		justify-content: center;
	}

	/* ── Insight box ───────────────────────────────────────────────── */
	.insight-box {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		padding: 0.75rem 1rem;
		background: rgba(59, 130, 246, 0.08);
		border-radius: 6px;
		width: 100%;
	}

	.insight-box p {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	/* ── Responsive ────────────────────────────────────────────────── */
	@media (max-width: 640px) {
		.demo-wrap {
			gap: 0.5rem;
		}

		.controls-panel {
			max-width: 100%;
		}

		.actions-row {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
