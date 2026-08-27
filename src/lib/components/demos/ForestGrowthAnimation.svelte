<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { buildDecisionStump } from '$lib/math/random-forest';
	import { mulberry32, combineSeed } from '$lib/math/util';
	import { gaussianSample, type Gaussian } from '$lib/math/gaussian';

	// ─── Constants ──────────────────────────────────────────────
	const N_TRAIN = 120;
	const DATA_MIN = -3.5;
	const DATA_MAX = 3.5;
	const GRID_RES = 35; // grid cells per dimension for ensemble regions

	// SVG dimensions
	const SVG_W = 480;
	const SVG_H = 380;
	const PAD = { top: 20, right: 20, bottom: 35, left: 40 };
	const PLOT_W = SVG_W - PAD.left - PAD.right;
	const PLOT_H = SVG_H - PAD.top - PAD.bottom;

	// ─── Data: two Gaussian clusters for binary classification ──
	const CLUSTER_0: Gaussian = { mu: -1, sigma2: 1.3 ** 2 };
	const CLUSTER_1: Gaussian = { mu: 1, sigma2: 1.3 ** 2 };

	function generateData(seed: number) {
		const rng = mulberry32(seed);
		const X: number[][] = [];
		const y: number[] = [];
		const half = Math.floor(N_TRAIN / 2);

		for (let i = 0; i < half; i++) {
			X.push([gaussianSample(CLUSTER_0, rng), gaussianSample(CLUSTER_0, rng)]);
			y.push(0);
		}
		for (let i = 0; i < N_TRAIN - half; i++) {
			X.push([gaussianSample(CLUSTER_1, rng), gaussianSample(CLUSTER_1, rng)]);
			y.push(1);
		}

		return { X, y };
	}

	// ─── Stump interface (mirrors DecisionStump from random-forest) ──
	interface TrainedStump {
		featureIdx: number;
		threshold: number;
		leftValue: number;
		rightValue: number;
		hue: number; // for visual distinction
	}

	// Predict a single point with one stump → class 0 or 1
	function predictStump(stump: TrainedStump, x: number[]): number {
		const raw = x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
		return Math.round(raw);
	}

	// ─── State ──────────────────────────────────────────────
	let dataSeed = $state(0); // change to regenerate data
	let maxTrees = $state(25); // how many trees the forest can grow to
	let treeCount = $state(0); // current number of displayed trees (0 → maxTrees)
	let isPlaying = $state(false);
	let animSpeed = $state(400); // ms between steps

	const data = $derived(generateData(dataSeed * 7919 + 42));

	// ─── Derived: forest of stumps (trained lazily on demand) ──
	// We train each stump deterministically so that re-deriving gives same results
	const stumps = $derived.by(() => {
		const result: TrainedStump[] = [];
		for (let t = 0; t < treeCount; t++) {
			const rng = mulberry32(combineSeed(dataSeed, t));

			// Bootstrap sample from training data
			const bootIndices: number[] = Array.from({ length: N_TRAIN }, () =>
				Math.floor(rng() * N_TRAIN)
			);
			const bootX = bootIndices.map((i) => data.X[i]);
			const bootY = bootIndices.map((i) => data.y[i]);

			// Random feature subset (m=1 for stumps → creates diversity)
			const featureIdx = Math.floor(rng() * 2); // 0 or 1 in 2D

			const stump = buildDecisionStump(bootX, bootY, [featureIdx], true);
			result.push({ ...stump, hue: (t * 137.508) % 360 }); // golden angle spacing
		}
		return result;
	});

	// ─── Derived: ensemble accuracy on training data ──────────
	const currentAccuracy = $derived.by(() => {
		if (stumps.length === 0) return 0;
		let correct = 0;
		for (let i = 0; i < N_TRAIN; i++) {
			let votes0 = 0,
				votes1 = 0;
			for (const stump of stumps) {
				const pred = predictStump(stump, data.X[i]);
				if (pred === 0) votes0++;
				else votes1++;
			}
			const ensemblePred = votes1 > votes0 ? 1 : 0;
			if (ensemblePred === data.y[i]) correct++;
		}
		return correct / N_TRAIN;
	});

	// ─── Derived: accuracy history for sparkline ──────────────
	// Compute accuracy at each forest size from 1 to treeCount
	const accuracyHistory = $derived.by(() => {
		if (treeCount === 0) return [];
		const history: number[] = [];

		for (let t = 1; t <= treeCount; t++) {
			let correct = 0;
			for (let i = 0; i < N_TRAIN; i++) {
				let votes0 = 0,
					votes1 = 0;
				for (let s = 0; s < t; s++) {
					const pred = predictStump(stumps[s], data.X[i]);
					if (pred === 0) votes0++;
					else votes1++;
				}
				const ensemblePred = votes1 > votes0 ? 1 : 0;
				if (ensemblePred === data.y[i]) correct++;
			}
			history.push(correct / N_TRAIN);
		}
		return history;
	});

	// ─── Derived: consensus/diversity metric ──────────────────
	const diversityRate = $derived.by(() => {
		if (stumps.length < 2) return 0;
		let totalDisagree = 0,
			totalPairs = 0;
		// Average pairwise disagreement over the whole training set
		// (the data is generated class-first, so any prefix would be biased
		// toward a single class).
		for (let i = 0; i < N_TRAIN; i++) {
			for (let a = 0; a < stumps.length; a++) {
				for (let b = a + 1; b < stumps.length; b++) {
					const predA = predictStump(stumps[a], data.X[i]);
					const predB = predictStump(stumps[b], data.X[i]);
					if (predA !== predB) totalDisagree++;
					totalPairs++;
				}
			}
		}
		return totalPairs > 0 ? totalDisagree / totalPairs : 0;
	});

	// ─── Derived: ensemble grid for background regions ────────
	const ensembleGrid = $derived.by(() => {
		if (stumps.length === 0) return null;

		const cellW = PLOT_W / GRID_RES;
		const cellH = PLOT_H / GRID_RES;
		const cells: Array<{ x: number; y: number; pred: number; confidence: number }> = [];

		for (let gy = 0; gy < GRID_RES; gy++) {
			for (let gx = 0; gx < GRID_RES; gx++) {
				// Cell center in data coordinates
				const cx = DATA_MIN + ((gx + 0.5) / GRID_RES) * (DATA_MAX - DATA_MIN);
				const cy = DATA_MIN + ((gy + 0.5) / GRID_RES) * (DATA_MAX - DATA_MIN);

				let votes1 = 0;
				for (const stump of stumps) {
					if (predictStump(stump, [cx, cy]) === 1) votes1++;
				}

				cells.push({
					x: PAD.left + gx * cellW,
					// gy = 0 is DATA_MIN (bottom in data space); SVG y grows
					// downward, so flip the row index to match projY.
					y: PAD.top + (GRID_RES - 1 - gy) * cellH,
					pred: votes1 > stumps.length / 2 ? 1 : 0,
					confidence: Math.abs(votes1 - (stumps.length - votes1)) / stumps.length
				});
			}
		}

		return cells;
	});

	// ─── SVG projection helpers ──────────────────────────────
	function projX(v: number): number {
		return PAD.left + ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_W;
	}

	function projY(v: number): number {
		return SVG_H - PAD.bottom - ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_H;
	}

	// ─── Sparkline projection helpers ──────────────────────
	const SPARK_W = 120;
	const SPARK_H = 36;
	const SPARK_PAD = { top: 4, right: 2, bottom: 2, left: 2 };

	function sparkX(i: number): number {
		if (accuracyHistory.length <= 1) return SPARK_PAD.left + SPARK_W / 2;
		return (
			SPARK_PAD.left +
			(i / (accuracyHistory.length - 1)) * (SPARK_W - SPARK_PAD.left - SPARK_PAD.right)
		);
	}

	function sparkY(v: number): number {
		const minV = 0.4,
			maxV = 1.0;
		const t = Math.max(0, Math.min(1, (v - minV) / (maxV - minV)));
		return SPARK_H - SPARK_PAD.bottom - t * (SPARK_H - SPARK_PAD.top - SPARK_PAD.bottom);
	}

	const sparkPath = $derived.by(() => {
		if (accuracyHistory.length === 0) return '';
		const pts = accuracyHistory.map((v, i) => `${sparkX(i)},${sparkY(v)}`);
		return `M${pts.join(' L')}`;
	});

	// ─── Animation timer via $effect ──────────────────────
	$effect(() => {
		if (!isPlaying) return;

		const interval = setInterval(() => {
			if (treeCount < maxTrees) {
				treeCount += 1;
			} else {
				isPlaying = false; // stop when max reached
			}
		}, animSpeed);

		return () => clearInterval(interval);
	});

	// Also pause if we reach max during play
	$effect(() => {
		if (isPlaying && treeCount >= maxTrees) {
			isPlaying = false;
		}
	});

	// ─── Controls ──────────────────────────────────────
	function step() {
		if (treeCount < maxTrees) treeCount += 1;
	}

	function reset() {
		treeCount = 0;
		isPlaying = false;
	}

	function togglePlay() {
		if (treeCount >= maxTrees) treeCount = 0; // restart if at end
		isPlaying = !isPlaying;
	}

	function regenerateData() {
		dataSeed += 1;
		treeCount = 0;
		isPlaying = false;
	}
</script>

<div class="demo-wrap">
	<!-- Header -->
	<div class="header">
		<h2>Croissance d'une Random Forest — animation pas à pas</h2>
		<p class="subtitle">
			Chaque arbre ajoute une nouvelle partition de l'espace de décision. L'agrégation par
			vote majoritaire affine progressivement la prédiction.
		</p>
	</div>

	<!-- Main visualization: scatter plot + ensemble regions -->
	<Figure type="chart" style="width:100%">
		<svg
			viewBox={`0 0 ${SVG_W} ${SVG_H}`}
			class="forest-svg"
			role="img"
			aria-label="Visualisation de la forêt aléatoire en croissance"
		>
			<!-- Grid lines (subtle) -->
			<g class="grid-lines">
				{#each Array.from({ length: 8 }, (_, i) => DATA_MIN + (i / 7) * (DATA_MAX - DATA_MIN)) as tick}
					<line x1={projX(tick)} y1={PAD.top} x2={projX(tick)} y2={SVG_H - PAD.bottom} />
					<line x1={PAD.left} y1={projY(tick)} x2={SVG_W - PAD.right} y2={projY(tick)} />
				{/each}
			</g>

			<!-- Ensemble prediction regions (colored grid cells) -->
			{#if ensembleGrid}
				<g class="ensemble-cells">
					{#each ensembleGrid as cell}
						<rect
							x={cell.x}
							y={cell.y}
							width={PLOT_W / GRID_RES + 0.5}
							height={PLOT_H / GRID_RES + 0.5}
							class="ens-cell"
							class:pred-0={cell.pred === 0}
							class:pred-1={cell.pred === 1}
							style:opacity={0.25 + cell.confidence * 0.45}
						/>
					{/each}
				</g>
			{/if}

			<!-- Individual tree boundaries (semi-transparent colored lines) -->
			{#each stumps as stump}
				{#if stump.featureIdx === 0}
					<line
						x1={projX(stump.threshold)}
						y1={PAD.top}
						x2={projX(stump.threshold)}
						y2={SVG_H - PAD.bottom}
						class="tree-boundary"
						style:stroke={`hsl(${stump.hue}, 65%, 55%)`}
					/>
				{:else}
					<line
						x1={PAD.left}
						y1={projY(stump.threshold)}
						x2={SVG_W - PAD.right}
						y2={projY(stump.threshold)}
						class="tree-boundary"
						style:stroke={`hsl(${stump.hue}, 65%, 55%)`}
					/>
				{/if}
			{/each}

			<!-- Data points -->
			{#each data.X as point, i}
				<circle
					cx={projX(point[0])}
					cy={projY(point[1])}
					r={3.5}
					class="dot"
					class:is-class-0={data.y[i] === 0}
					class:is-class-1={data.y[i] === 1}
				/>
			{/each}

			<!-- Axes labels -->
			<text x={SVG_W / 2} y={SVG_H - 4} class="axis-label" text-anchor="middle">x₁</text>
			<text
				x={12}
				y={SVG_H / 2}
				class="axis-label"
				text-anchor="middle"
				transform={`rotate(-90, 12, ${SVG_H / 2})`}>x₂</text
			>

			<!-- Tree count badge -->
			<g class="count-badge">
				<rect x={SVG_W - PAD.right - 68} y={PAD.top + 2} width="64" height="22" rx="4" />
				<text x={SVG_W - PAD.right - 36} y={PAD.top + 16} text-anchor="middle"
					>🌲 × {treeCount}</text
				>
			</g>
		</svg>

		{#snippet caption()}
			{treeCount} stump{treeCount !== 1 ? 's' : ''} dans la forêt | {N_TRAIN} échantillons d'entraînement
			(2 classes) | grille {GRID_RES}×{GRID_RES} pour le vote majoritaire
		{/snippet}
	</Figure>

	<!-- Metrics Panel -->
	<Metrics align="center">
		<div class="cell">
			<span class="label">Arbres</span>
			<span class="value" style:color="var(--color-positive)">{treeCount}</span>
			<span class="unit">/ {maxTrees}</span>
		</div>

		<div class="cell">
			<span class="label">Précision</span>
			<span class="value" style:color="var(--color-belief)"
				>{(currentAccuracy * 100).toFixed(1)}%</span
			>
			<span class="unit">vote majoritaire</span>
		</div>

		<div class="cell">
			<span class="label">Diversité</span>
			<span class="value" style:color="var(--color-surprise)"
				>{(diversityRate * 100).toFixed(1)}%</span
			>
			<span class="unit">disaccord. moyen</span>
		</div>

		<div class="cell spark-cell">
			<span class="label">Courbe précision</span>
			<svg
				viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
				class="sparkline-svg"
				aria-label="Précision en fonction du nombre d'arbres"
			>
				<path
					d={sparkPath}
					fill="none"
					stroke="var(--color-belief)"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>
			<span class="unit"
				>{accuracyHistory.length > 0
					? `min ${(Math.min(...accuracyHistory) * 100).toFixed(0)}% → max ${(Math.max(...accuracyHistory) * 100).toFixed(0)}%`
					: '—'}</span
			>
		</div>
	</Metrics>

	<!-- Controls -->
	<div class="controls-panel">
		<Slider bind:value={maxTrees} min={5} max={60} step={1} label="Max arbres dans la forêt" />
		<Slider
			bind:value={animSpeed}
			min={80}
			max={800}
			step={20}
			label="Vitesse d'animation (ms)"
			logarithmic={true}
		/>

		<div class="actions-row">
			<Button variant="outline" size="sm" onclick={reset}>⟲ Reset</Button>
			<Button
				variant="primary"
				size="sm"
				onclick={togglePlay}
				disabled={treeCount >= maxTrees && !isPlaying}
			>
				{isPlaying ? '⏸ Pause' : '▶ Jouer'}
			</Button>
			<Button variant="outline" size="sm" onclick={step} disabled={treeCount >= maxTrees}
				>+1 arbre</Button
			>

			<span class="iter-label">{treeCount} / {maxTrees}</span>
		</div>

		<div class="actions-row">
			<Button variant="ghost" size="sm" onclick={regenerateData}>🔄 Nouvelles données</Button>
		</div>
	</div>

	<!-- Insight box -->
	<div class="insight-box">
		<span class="icon">🌳</span>
		<p>
			Chaque stump est formé sur un échantillon bootstrap avec une seule feature aléatoire (m=1).
			Cette <strong>sélection aléatoire</strong> crée de la diversité entre les arbres — ils ne sont
			pas identiques. Au début ({treeCount <= 3 ? 'peu' : 'plus'} d'arbres), l'erreur chute vite car les
			erreurs indépendantes se compensent. Puis la courbe <strong>stabilise</strong> : au-delà d'un
			certain nombre, ajouter des arbres n'améliore plus significativement la précision — c'est le
			principe du Bagging (Breiman, 1996). La diversité ({(diversityRate * 100).toFixed(0)}%) reste
			élevée grâce à m=1.
		</p>
	</div>
</div>

<style>
	.demo-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-text);
	}

	.header {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
	}

	.subtitle {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	/* ─── SVG forest visualization ────────────────────────── */
	.forest-svg {
		width: 100%;
		height: auto;
	}

	.grid-lines line {
		stroke: var(--color-border);
		stroke-opacity: 0.4;
		stroke-width: 0.5;
	}

	.axis-label {
		font-size: 12px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	/* Ensemble prediction grid cells */
	.ensemble-cells {
		pointer-events: none;
	}

	.ens-cell {
		transition: opacity 0.2s ease;
	}

	.ens-cell.pred-0 {
		fill: var(--color-surprise);
	}

	.ens-cell.pred-1 {
		fill: var(--color-positive);
	}

	/* Individual tree boundaries */
	.tree-boundary {
		stroke-width: 1.5;
		stroke-opacity: 0.25;
		pointer-events: none;
	}

	/* Data points (rendered on top) */
	.dot.is-class-0 {
		fill: var(--color-surprise);
		stroke: white;
		stroke-width: 1;
	}

	.dot.is-class-1 {
		fill: var(--color-positive);
		stroke: white;
		stroke-width: 1;
	}

	/* Tree count badge */
	.count-badge rect {
		fill: var(--color-surface-2);
		stroke: var(--color-border);
		stroke-width: 0.8;
	}

	.count-badge text {
		font-size: 11px;
		fill: var(--color-text);
		font-family: var(--font-mono, monospace);
	}

	/* ─── Sparkline in metrics panel ──────────────────────── */
	.spark-cell {
		min-width: 130px !important;
		align-items: center !important;
	}

	.sparkline-svg {
		width: 120px;
		height: 36px;
		margin-top: -4px;
		margin-bottom: -4px;
	}

	/* ─── Controls panel ────────────────────────────── */
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.iter-label {
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		color: var(--color-text-muted);
		margin-left: auto;
	}

	/* ─── Insight box ────────────────────────────── */
	.insight-box {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		padding: 0.65rem 1rem;
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		border-radius: 6px;
		width: 100%;
	}

	.insight-box p {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	.icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}
</style>
