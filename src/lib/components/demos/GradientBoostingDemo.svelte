<script lang="ts">
	/**
	 * Gradient Boosting Demo — 1D regression visualisation.
	 * Each step fits a decision stump to the residuals, then adds its scaled
	 * prediction to the ensemble F(x). Students see how the piecewise-constant
	 * stumps progressively approximate an arbitrary target function.
	 */
	import { onDestroy } from 'svelte';
	import { scaleLinear, line as d3line, curveBasis } from 'd3';
	import Figure from '$lib/components/charts/Figure.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { runGradientBoostingWithHistory, predictRegressionStump } from '$lib/math/boosting.js';
	import { combineSeed, mulberry32 } from '$lib/math/util';

	// ─── Configuration ──────────────────────────────────────────────

	interface FuncDef {
		key: string;
		label: string;
		fn: (x: number) => number;
		color: string;
	}

	const funcDefs: FuncDef[] = [
		{ key: 'sin', label: 'sin(x)', fn: Math.sin, color: '#6366f1' },
		{ key: 'poly', label: 'x² + 0.5x', fn: (x) => x * x + 0.5 * x, color: '#ec4899' },
		{ key: 'cubic', label: 'sin(πx/2)', fn: (x) => Math.sin((Math.PI * x) / 2), color: '#14b8a6' }
	];

	const NUM_POINTS = 30;
	const X_MIN = -2;
	const X_MAX = 2;
	const T = 15; // max boosting steps
	const FINE_GRID_N = 120;

	// Fixed x-coordinates for data points (equally spaced)
	const FIXED_X = Array.from({ length: NUM_POINTS }, (_, i) => {
		return X_MIN + ((X_MAX - X_MIN) * i) / (NUM_POINTS - 1);
	});

	// ─── State ──────────────────────────────────────────────────────

	let selectedFunc = $state('sin');
	let currentStep = $state(0);
	let playing = $state(false);
	let learningRate = $state(0.3);
	let noiseLevel = $state(0.25);
	let containerWidth = $state(0);
	let dataYValues = $state<number[]>([]);

	// ─── Derived state ──────────────────────────────────────────────

	const funcOpt = $derived(funcDefs.find((f) => f.key === selectedFunc)!);
	const targetFn = $derived(funcOpt.fn);

	// Generate noisy y values when function or noise level changes. The noise
	// is seeded from (fonction, niveau) : mêmes réglages → mêmes données.
	const funcIdx = $derived(funcDefs.findIndex((f) => f.key === selectedFunc));
	$effect(() => {
		const fn = targetFn;
		const nl = noiseLevel;
		void funcIdx;
		const rng = mulberry32(combineSeed(funcIdx + 1, Math.round(nl * 100)));
		dataYValues = FIXED_X.map((x) => fn(x) + (rng() - 0.5) * 2 * nl);
		currentStep = 0; // reset step when data regenerates
	});

	// Run gradient boosting with full history
	const boostingHistory = $derived.by(() => {
		if (dataYValues.length === 0) return null;
		return runGradientBoostingWithHistory(FIXED_X, dataYValues, T, learningRate);
	});

	const maxStep = $derived(boostingHistory?.stumps.length ?? 0);
	const isDone = $derived(currentStep >= maxStep);

	// ─── Chart dimensions & scales ──────────────────────────────────

	const pad = { top: 20, right: 24, bottom: 36, left: 28 };
	const chartHeight = 280;
	const vbW = $derived(containerWidth || 560);
	const vbH = $derived(chartHeight);
	const baselineY = $derived(vbH - pad.bottom);

	// Y domain includes target curve + data points + predictions at current step
	const yDomain = $derived.by((): [number, number] => {
		if (!boostingHistory) return [-1.5, 1.5];
		const predsAtStep = boostingHistory.FAtEachStep[Math.min(currentStep, maxStep)] ?? [];

		const targetVals = Array.from({ length: FINE_GRID_N }, (_, i) => {
			const x = X_MIN + (i / (FINE_GRID_N - 1)) * (X_MAX - X_MIN);
			return targetFn(x);
		});

		const allY = [...targetVals, ...dataYValues, ...predsAtStep];
		if (allY.length === 0) return [-1.5, 1.5];
		const lo = Math.min(...allY);
		const hi = Math.max(...allY);
		const margin = Math.max((hi - lo) * 0.12, 0.1);
		return [lo - margin, hi + margin] as [number, number];
	});

	const xScale = $derived(
		scaleLinear()
			.domain([X_MIN, X_MAX])
			.range([pad.left, Math.max(pad.left, vbW - pad.right)])
	);

	const yScale = $derived(scaleLinear().domain(yDomain).range([baselineY, pad.top]));

	// ─── Ensemble prediction (evaluated on any x value) ─────────────

	function getEnsemblePred(x: number): number {
		if (!boostingHistory || currentStep === 0) return boostingHistory?.FAtEachStep[0]?.[0] ?? 0;
		const step = Math.min(currentStep, maxStep);
		let val = boostingHistory.FAtEachStep[0][0]; // mean(y) initial prediction
		for (let t = 0; t < step; t++) {
			val += learningRate * predictRegressionStump(boostingHistory.stumps[t], x);
		}
		return val;
	}

	// ─── SVG paths ──────────────────────────────────────────────────

	// D3 line generator helper
	function buildPath(fn: (x: number) => number, gridCount = FINE_GRID_N): string {
		const pts: [number, number][] = Array.from({ length: gridCount }, (_, i) => {
			const x = X_MIN + (i / (gridCount - 1)) * (X_MAX - X_MIN);
			return [x, fn(x)];
		});
		return (
			d3line<[number, number]>()
				.x((d) => xScale(d[0]))
				.y((d) => yScale(d[1]))
				.curve(curveBasis)(pts) ?? ''
		);
	}

	const targetPath = $derived.by(() => {
		if (!containerWidth) return '';
		return buildPath(targetFn);
	});

	const ensemblePath = $derived.by(() => {
		if (!containerWidth || !boostingHistory) return '';
		return buildPath(getEnsemblePred);
	});

	// ─── Metrics at current step ─────────────────────────────────────

	const currentPreds = $derived.by(() => {
		if (!boostingHistory) return [];
		return boostingHistory.FAtEachStep[Math.min(currentStep, maxStep)] ?? [];
	});

	const currentResiduals = $derived.by(() => {
		if (currentPreds.length === 0 || dataYValues.length === 0) return [];
		return FIXED_X.map((_, i) => dataYValues[i] - currentPreds[i]);
	});

	const mseValue = $derived.by(() => {
		if (currentPreds.length === 0) return 0;
		return (
			currentPreds.reduce((sum, p, i) => sum + (dataYValues[i] - p) ** 2, 0) / currentPreds.length
		);
	});

	const residualRange = $derived.by(() => {
		if (currentResiduals.length === 0) return [0, 0];
		return [Math.min(...currentResiduals), Math.max(...currentResiduals)];
	});

	// Latest stump fitted at current step (null when step is 0 — initialisation)
	const latestStump = $derived(
		currentStep > 0 && boostingHistory ? boostingHistory.stumps[currentStep - 1] : null
	);

	// ─── Axis ticks ────────────────────────────────────────────────

	const xTicks = $derived(xScale.ticks(6));
	const yTicks = $derived(yScale.ticks(5));

	// Check if zero is within Y domain (for reference line)
	const showZeroLine = $derived(yDomain[0] <= 0 && yDomain[1] >= 0);

	// ─── Animation controls ────────────────────────────────────────

	let animTimer: ReturnType<typeof setInterval> | null = null;

	function stepForward() {
		if (currentStep < maxStep) currentStep++;
	}

	function resetStep() {
		stopAnim();
		currentStep = 0;
	}

	function play() {
		if (playing) return;
		if (isDone) currentStep = 0;
		playing = true;
		animTimer = setInterval(() => {
			stepForward();
			if (currentStep >= maxStep) stopAnim();
		}, 450);
	}

	function pause() {
		stopAnim();
	}

	function stopAnim() {
		if (animTimer !== null) clearInterval(animTimer);
		animTimer = null;
		playing = false;
	}

	onDestroy(stopAnim);

	function handleFuncChange(key: string) {
		stopAnim();
		selectedFunc = key;
		currentStep = 0;
	}

	// ─── Legend items ──────────────────────────────────────────────

	const legendItems = $derived([
		{ label: 'Fonction cible f(x)', kind: 'dashed-line' as const, color: '#6b7280' },
		{ label: 'Prédiction F(x)', kind: 'line' as const, color: '#3b82f6' },
		{ label: 'Points de données', kind: 'dot' as const, color: '#1f2937' },
		{ label: 'Résidus positifs', kind: 'line' as const, color: '#ef4444' },
		{ label: 'Résidus négatifs', kind: 'line' as const, color: '#22c55e' },
		...(latestStump
			? [
					{ label: `Arbre t=${currentStep}`, kind: 'fill' as const, color: '#fb923c' },
					{ label: "Seuil de l'arbre", kind: 'dashed-line' as const, color: '#f59e0b' }
				]
			: [])
	]);

	const captionText = $derived(
		currentStep === 0
			? 'F(x) initialisé à la moyenne des y. Appuyez sur « Un pas » ou « Jouer » pour lancer le boosting.'
			: `Arbre t=${currentStep} ajouté : F(x) ← F(x) + ${learningRate} × h_${currentStep}(x)`
	);
</script>

<div class="gb-demo">
	<!-- ── Function selector ─────────────────────────────────────── -->
	<div class="options-row">
		{#each funcDefs as o}
			<button
				class:active={selectedFunc === o.key}
				style:--opt-color={o.color}
				onclick={() => handleFuncChange(o.key)}
			>
				<span class="dot" style:background={o.color}></span>
				{o.label}
			</button>
		{/each}
	</div>

	<!-- ── Caption snippet ───────────────────────────────────────── -->
	{#snippet chartCaption()}
		<p>{captionText}</p>
	{/snippet}

	<!-- ── Chart ─────────────────────────────────────────────────── -->
	<Figure type="chart" bind:containerWidth caption={chartCaption} style="width:100%">
		{#if containerWidth > 0 && boostingHistory}
			<svg
				viewBox={`0 0 ${vbW} ${vbH}`}
				width="100%"
				height={vbH}
				role="img"
				aria-label="Visualisation du Gradient Boosting"
			>
				<!-- Zero reference line -->
				{#if showZeroLine}
					<line
						x1={pad.left}
						y1={yScale(0)}
						x2={vbW - pad.right}
						y2={yScale(0)}
						stroke="var(--color-border)"
						stroke-width="1"
						stroke-dasharray="3 4"
						opacity="0.4"
					/>
				{/if}

				<!-- Target curve f(x) -->
				{#if targetPath}
					<path
						d={targetPath}
						fill="none"
						stroke="#6b7280"
						stroke-width="2"
						stroke-dasharray="5 4"
						opacity="0.7"
					/>
				{/if}

				<!-- Residual connector lines -->
				{#each FIXED_X as xVal, i (i)}
					{@const predY = currentPreds[i] ?? boostingHistory.FAtEachStep[0][0]}
					{@const residual = dataYValues[i] - predY}
					<line
						x1={xScale(xVal)}
						y1={yScale(dataYValues[i])}
						x2={xScale(xVal)}
						y2={yScale(predY)}
						stroke={residual > 0 ? '#ef4444' : '#22c55e'}
						stroke-width="1.2"
						opacity="0.55"
					/>
				{/each}

				<!-- Latest stump visualization (piecewise constant regions) -->
				{#if latestStump}
					{@const lrLeft = learningRate * latestStump.leftValue}
					{@const lrRight = learningRate * latestStump.rightValue}

					<!-- Left region fill -->
					<rect
						x={pad.left}
						y={Math.min(yScale(0), yScale(lrLeft))}
						width={xScale(latestStump.threshold) - pad.left}
						height={Math.abs(yScale(lrLeft) - yScale(0))}
						fill="#fb923c"
						opacity="0.15"
					/>

					<!-- Right region fill -->
					<rect
						x={xScale(latestStump.threshold)}
						y={Math.min(yScale(0), yScale(lrRight))}
						width={vbW - pad.right - xScale(latestStump.threshold)}
						height={Math.abs(yScale(lrRight) - yScale(0))}
						fill="#fb923c"
						opacity="0.15"
					/>

					<!-- Stump horizontal segments (contribution at lr*value) -->
					<line
						x1={pad.left}
						y1={yScale(lrLeft)}
						x2={xScale(latestStump.threshold)}
						y2={yScale(lrLeft)}
						stroke="#fb923c"
						stroke-width="2.5"
					/>

					<line
						x1={xScale(latestStump.threshold)}
						y1={yScale(lrRight)}
						x2={vbW - pad.right}
						y2={yScale(lrRight)}
						stroke="#fb923c"
						stroke-width="2.5"
					/>

					<!-- Threshold guide line -->
					<line
						x1={xScale(latestStump.threshold)}
						y1={pad.top}
						x2={xScale(latestStump.threshold)}
						y2={baselineY}
						stroke="#f59e0b"
						stroke-width="1.2"
						stroke-dasharray="4 3"
						opacity="0.6"
					/>
				{/if}

				<!-- Ensemble prediction F(x) -->
				{#if ensemblePath}
					<path d={ensemblePath} fill="none" stroke="#3b82f6" stroke-width="2.5" />
				{/if}

				<!-- Data points -->
				{#each FIXED_X as xVal, i (i)}
					<circle
						cx={xScale(xVal)}
						cy={yScale(dataYValues[i])}
						r="3.5"
						fill="#1f2937"
						stroke="var(--color-bg)"
						stroke-width="1"
					/>
				{/each}

				<!-- X-axis -->
				<line
					x1={pad.left}
					y1={baselineY}
					x2={vbW - pad.right}
					y2={baselineY}
					stroke="var(--color-border)"
					stroke-width="1.5"
				/>

				<!-- X-axis ticks -->
				{#each xTicks as tick (tick)}
					<text
						x={xScale(tick).toFixed(2)}
						y={baselineY + 16}
						text-anchor="middle"
						fill="var(--color-text-muted)"
						font-size="10.5"
						font-family="var(--font-mono, monospace)">{tick}</text
					>
				{/each}

				<!-- Y-axis -->
				<line
					x1={pad.left}
					y1={baselineY}
					x2={pad.left}
					y2={pad.top}
					stroke="var(--color-border)"
					stroke-width="1.5"
				/>

				<!-- Y-axis ticks -->
				{#each yTicks as tick (tick)}
					<text
						x={(pad.left - 8).toFixed(2)}
						y={yScale(tick).toFixed(2)}
						text-anchor="end"
						dominant-baseline="middle"
						fill="var(--color-text-muted)"
						font-size="10.5"
						font-family="var(--font-mono, monospace)">{tick}</text
					>
				{/each}

				<!-- Chart label -->
				<text
					x={vbW - pad.right}
					y={pad.top + 10}
					text-anchor="end"
					fill="var(--color-text-muted)"
					font-size="11"
					font-family="var(--font-sans, sans-serif)">F(x) — étape {currentStep}</text
				>
			</svg>

			<!-- Legend -->
			<div class="chart-legend">
				{#each legendItems as item}
					<span class="legend-item">
						{#if item.kind === 'fill'}
							<span class="swatch swatch-fill" style:background={item.color}></span>
						{:else if item.kind === 'dot'}
							<span class="swatch swatch-dot" style:background={item.color}></span>
						{:else if item.kind === 'dashed-line'}
							<span class="swatch swatch-dash" style:border-color={item.color}></span>
						{:else}
							<span class="swatch swatch-line" style:background={item.color}></span>
						{/if}
						{item.label}
					</span>
				{/each}
			</div>
		{:else}
			<!-- Loading state placeholder -->
			<div class="chart-placeholder">Chargement…</div>
		{/if}
	</Figure>

	<!-- ── Transport controls + step slider ──────────────────────── -->
	<div class="transport-row">
		<Button variant="outline" size="sm" onclick={resetStep}>⟲ Reset</Button>
		<Button variant="outline" size="sm" onclick={stepForward} disabled={playing || isDone}
			>▶ Pas</Button
		>

		{#if playing}
			<Button variant="danger" size="sm" onclick={pause}>⏸ Pause</Button>
		{:else}
			<Button variant="primary" size="sm" onclick={play} disabled={isDone && currentStep > 0}
				>⏵ Jouer</Button
			>
		{/if}

		<span class="step-label">Étape {currentStep} / {maxStep}</span>
	</div>

	<Slider
		bind:value={currentStep}
		min={0}
		max={maxStep}
		step={1}
		label="Étape"
		disabled={playing || dataYValues.length === 0}
	/>

	<!-- ── Parameter sliders ─────────────────────────────────────── -->
	<div class="param-grid">
		<Slider
			bind:value={learningRate}
			min={0.05}
			max={1}
			step={0.05}
			label="Taux d'apprentissage (η)"
		/>
		<Slider bind:value={noiseLevel} min={0} max={1} step={0.05} label="Niveau de bruit" />
	</div>

	<!-- ── Metrics panel ─────────────────────────────────────────── -->
	<div class="metrics">
		<div class="metric-card">
			<span class="metric-label">Erreur quadratique (MSE)</span>
			<span class="metric-value">{mseValue.toFixed(4)}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">Arbres entraînés</span>
			<span class="metric-value">{currentStep}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">Fourchette des résidus</span>
			<span class="metric-value">{residualRange[0].toFixed(3)} — {residualRange[1].toFixed(3)}</span
			>
		</div>
	</div>

	<!-- ── Description ───────────────────────────────────────────── -->
	<p class="description">
		L'ensemble de boosting ajuste progressivement la prédiction F(x) en ajoutant un arbre par étape.
		Chaque nouveau stump minimise les résidus restants : r<sub>i</sub> = y<sub>i</sub> − F(x<sub
			>i</sub
		>). Observez comment les lignes verticales (résidus) diminuent au fil des étapes.
	</p>
</div>

<style>
	.gb-demo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	/* ── Function selector pills ─────────────────────────────── */

	.options-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.options-row button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text, inherit);
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.options-row button .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}

	.options-row button.active {
		background: var(--opt-color);
		color: white;
		border-color: var(--opt-color);
	}

	.options-row button.active .dot {
		background: white !important;
	}

	/* ── Chart placeholder (loading) ─────────────────────────── */

	.chart-placeholder {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	/* ── Custom legend inside Figure ─────────────────────────── */

	.chart-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		justify-content: center;
		margin-top: 0.4rem;
		font-size: 0.78rem;
		font-family: var(--font-sans, sans-serif);
		color: var(--color-text-muted);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.swatch {
		display: inline-block;
		width: 16px;
		height: 3px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.swatch-line {
		height: 3px;
	}

	.swatch-dash {
		height: 0;
		width: 16px;
		border-top: 2px dashed;
		background: transparent;
	}

	.swatch-fill {
		width: 12px;
		height: 10px;
		opacity: 0.45;
	}

	.swatch-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	/* ── Transport controls row ──────────────────────────────── */

	.transport-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.step-label {
		margin-left: 0.5rem;
		font-family: var(--font-mono, monospace);
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* ── Parameter sliders grid ──────────────────────────────── */

	.param-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
		width: 100%;
		max-width: 640px;
	}

	/* ── Metrics panel ─────────────────────────────────────── */

	.metrics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		width: 100%;
		max-width: 640px;
	}

	.metric-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 0.4rem;
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		gap: 0.2rem;
	}

	.metric-label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		text-align: center;
	}

	.metric-value {
		font-family: var(--font-mono, monospace);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	/* ── Description text ──────────────────────────────────── */

	.description {
		max-width: 580px;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		text-align: center;
		line-height: 1.5;
		padding: 0 0.5rem;
		margin: 0;
	}

	/* ── Responsive: stack below 640px ─────────────────────── */

	@media (max-width: 640px) {
		.param-grid {
			grid-template-columns: 1fr;
		}

		.metrics {
			grid-template-columns: 1fr;
		}
	}
</style>
