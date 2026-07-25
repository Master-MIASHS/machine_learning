<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { buildDecisionStump, giniImpurity, informationGain } from '$lib/math/random-forest';

	const N_SAMPLES = 80;
	const DATA_MIN = -3.5;
	const DATA_MAX = 3.5;

	const SVG_W = 460;
	const SVG_H = 360;
	const PAD = { top: 20, right: 20, bottom: 35, left: 40 };
	const PLOT_W = SVG_W - PAD.left - PAD.right;
	const PLOT_H = SVG_H - PAD.top - PAD.bottom;

	function makeRng(seed: number): () => number {
		let s = ((seed % 2147483647) + 2147483647) % 2147483647 || 1;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	function randn(rng: () => number): number {
		let u1 = rng(),
			u2 = rng();
		while (u1 === 0) u1 = rng();
		return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	function generateData(seed: number): { X: number[][]; y: number[] } {
		const rng = makeRng(seed);
		const X: number[][] = [];
		const y: number[] = [];
		const half = Math.floor(N_SAMPLES / 2);

		for (let i = 0; i < half; i++) {
			X.push([-1 + randn(rng) * 1.2, -1 + randn(rng) * 1.2]);
			y.push(0);
		}
		for (let i = 0; i < N_SAMPLES - half; i++) {
			X.push([1 + randn(rng) * 1.2, 1 + randn(rng) * 1.2]);
			y.push(1);
		}
		return { X, y };
	}

	// ── State ──────────────────────────────────────────────────────────
	// `dataSeed` regenerates the DATASET itself (a genuinely new problem).
	// `treeSeed` regenerates the ENSEMBLE of stumps on the SAME dataset —
	// this is the actual source of Random Forest diversity: many trees,
	// same data, independent random feature draws at each split.
	let dataSeed = $state(0);
	let treeSeed = $state(0);
	let mTry = $state(1); // FIXED hyperparameter of the whole forest, not per-tree

	const N_TREES = 6; // how many independent stumps to show at once

	const data = $derived(generateData(dataSeed * 7919 + 42));

	// FIX: each of the N_TREES stumps gets its OWN independent random feature
	// subset, freshly re-seeded from (treeSeed, tree index) — previously
	// there was only ever ONE stump, and its "random" subset was actually
	// fully determined by `seed` alone, so it never varied unless you
	// stepped. Now every click of "Nouvel ensemble" draws N_TREES independent
	// subsets, which is what actually lets you SEE the diversity m produces.
	const forest = $derived.by(() => {
		const stumps = [];
		for (let t = 0; t < N_TREES; t++) {
			const rng = makeRng(treeSeed * 104729 + t * 7919 + 13);

			let featureSubset: number[];
			if (mTry >= 2) {
				featureSubset = [0, 1]; // both features always available — no randomness to draw
			} else {
				featureSubset = [Math.floor(rng() * 2)]; // independent coin flip PER TREE
			}

			const stump = buildDecisionStump(data.X, data.y, featureSubset, true);
			stumps.push({ stump, featureSubset, treeIdx: t });
		}
		return stumps;
	});

	// The stump currently highlighted / detailed in the metrics panel below.
	let activeTreeIdx = $state(0);
	const activeStump = $derived(forest[Math.min(activeTreeIdx, forest.length - 1)]?.stump);

	const leftCount = $derived(
		activeStump
			? data.X.filter((x) => x[activeStump.featureIdx] <= activeStump.threshold).length
			: 0
	);
	const rightCount = $derived(N_SAMPLES - leftCount);

	const accuracy = $derived.by(() => {
		if (!activeStump) return 0;
		let correct = 0;
		for (let i = 0; i < N_SAMPLES; i++) {
			const pred =
				data.X[i][activeStump.featureIdx] <= activeStump.threshold
					? Math.round(activeStump.leftValue)
					: Math.round(activeStump.rightValue);
			if (pred === data.y[i]) correct++;
		}
		return correct / N_SAMPLES;
	});

	const leftLabels = $derived(
		activeStump
			? data.X.map((x, i) => ({ x, yi: data.y[i] }))
					.filter((d) => d.x[activeStump.featureIdx] <= activeStump.threshold)
					.map((d) => d.yi)
			: []
	);
	const rightLabels = $derived(
		activeStump
			? data.X.map((x, i) => ({ x, yi: data.y[i] }))
					.filter((d) => d.x[activeStump.featureIdx] > activeStump.threshold)
					.map((d) => d.yi)
			: []
	);

	const giniBefore = $derived(giniImpurity(data.y));
	const giniLeft = $derived(giniImpurity(leftLabels));
	const giniRight = $derived(giniImpurity(rightLabels));
	const giniAfter = $derived((leftCount * giniLeft + rightCount * giniRight) / N_SAMPLES);
	const infoGainVal = $derived(informationGain(data.y, leftLabels, rightLabels));

	function projX(v: number): number {
		return PAD.left + ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_W;
	}
	function projY(v: number): number {
		return SVG_H - PAD.bottom - ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_H;
	}

	const splitsOnFeature = $derived(activeStump?.featureIdx === 0 ? 'x₁' : 'x₂');
	const isHorizontalSplit = $derived(activeStump?.featureIdx === 1);
	const leftPredClass = $derived(activeStump ? Math.round(activeStump.leftValue) : 0);
	const rightPredClass = $derived(activeStump ? Math.round(activeStump.rightValue) : 0);

	// How diverse is this ensemble? Count how many distinct features got used
	// across all N_TREES stumps — the direct visual/numeric signature of the
	// decorrelation effect from Theorem 6.1.
	const featuresUsed = $derived(new Set(forest.map((f) => f.stump.featureIdx)));
	const diversityLabel = $derived(
		mTry >= 2
			? 'toutes les features toujours utilisées — aucune diversité de features possible'
			: featuresUsed.size === 2
				? 'les deux features sont exploitées à travers l\u2019ensemble — diversité maximale'
				: 'un seul feature domine tout l\u2019ensemble — pas de diversité (rare avec m=1)'
	);

	function newForest() {
		treeSeed += 1;
		activeTreeIdx = 0;
	}
	function newDataset() {
		dataSeed += 1;
		treeSeed = 0;
		activeTreeIdx = 0;
	}
</script>

<div class="demo-wrap">
	<div class="header">
		<h2>Décision Stump — arbre de profondeur 1</h2>
		<p class="subtitle">
			Une seule question sur une seule variable pour séparer deux classes. Avec m=1, la variable
			interrogée est tirée au hasard <strong>indépendamment pour chaque arbre</strong> — c'est exactement
			le mécanisme de sélection aléatoire de features du Random Forest.
		</p>
	</div>

	<Figure type="chart" style="width: 100%">
		<svg
			viewBox={`0 0 ${SVG_W} ${SVG_H}`}
			class="scatter-svg"
			role="img"
			aria-label="Nuage de points avec frontière de décision du stump actif"
		>
			<g class="grid">
				{#each Array.from({ length: 8 }, (_, i) => DATA_MIN + (i / 7) * (DATA_MAX - DATA_MIN)) as tick}
					<line x1={projX(tick)} y1={PAD.top} x2={projX(tick)} y2={SVG_H - PAD.bottom} />
					<line x1={PAD.left} y1={projY(tick)} x2={SVG_W - PAD.right} y2={projY(tick)} />
				{/each}
			</g>

			<!-- Ghost boundaries: all OTHER stumps in the ensemble, faint, to show diversity at a glance -->
			{#each forest as f (f.treeIdx)}
				{#if f.treeIdx !== activeTreeIdx}
					{#if f.stump.featureIdx === 1}
						<line
							x1={PAD.left}
							y1={projY(f.stump.threshold)}
							x2={SVG_W - PAD.right}
							y2={projY(f.stump.threshold)}
							class="boundary-ghost"
						/>
					{:else}
						<line
							x1={projX(f.stump.threshold)}
							y1={PAD.top}
							x2={projX(f.stump.threshold)}
							y2={SVG_H - PAD.bottom}
							class="boundary-ghost"
						/>
					{/if}
				{/if}
			{/each}

			{#if activeStump}
				{#if isHorizontalSplit}
					<rect
						x={PAD.left}
						y={PAD.top}
						width={PLOT_W}
						height={projY(activeStump.threshold) - PAD.top}
						class="region region-left"
						class:is-class-0={leftPredClass === 0}
						class:is-class-1={leftPredClass === 1}
					/>
					<rect
						x={PAD.left}
						y={projY(activeStump.threshold)}
						width={PLOT_W}
						height={PAD.top - projY(activeStump.threshold) + PLOT_H}
						class="region region-right"
						class:is-class-0={rightPredClass === 0}
						class:is-class-1={rightPredClass === 1}
					/>
				{:else}
					<rect
						x={PAD.left}
						y={PAD.top}
						width={projX(activeStump.threshold) - PAD.left}
						height={PLOT_H}
						class="region region-left"
						class:is-class-0={leftPredClass === 0}
						class:is-class-1={leftPredClass === 1}
					/>
					<rect
						x={projX(activeStump.threshold)}
						y={PAD.top}
						width={SVG_W - PAD.right - projX(activeStump.threshold)}
						height={PLOT_H}
						class="region region-right"
						class:is-class-0={rightPredClass === 0}
						class:is-class-1={rightPredClass === 1}
					/>
				{/if}

				{#if isHorizontalSplit}
					<line
						x1={PAD.left}
						y1={projY(activeStump.threshold)}
						x2={SVG_W - PAD.right}
						y2={projY(activeStump.threshold)}
						class="boundary"
					/>
				{:else}
					<line
						x1={projX(activeStump.threshold)}
						y1={PAD.top}
						x2={projX(activeStump.threshold)}
						y2={SVG_H - PAD.bottom}
						class="boundary"
					/>
				{/if}
			{/if}

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

			<text x={SVG_W / 2} y={SVG_H - 4} class="axis-label" text-anchor="middle">x₁</text>
			<text
				x={12}
				y={SVG_H / 2}
				class="axis-label"
				text-anchor="middle"
				transform={`rotate(-90, 12, ${SVG_H / 2})`}>x₂</text
			>

			{#if activeStump}
				<g transform={`translate(${SVG_W / 2}, ${PAD.top - 4})`}>
					<rect x="-90" y="-10" width="180" height="20" rx="4" class="badge-bg" />
					<text x="0" y="3" text-anchor="middle" class="badge-text"
						>Arbre #{activeTreeIdx + 1} — split: {splitsOnFeature} ≤ {activeStump.threshold.toFixed(
							2
						)}</text
					>
				</g>
			{/if}
		</svg>

		{#snippet caption()}
			m = {mTry} feature{mTry > 1 ? 's' : ''} sur 2 (fixé pour toute la forêt) | {N_TREES} arbres indépendants
			affichés | Données : {N_SAMPLES} échantillons
		{/snippet}
	</Figure>

	<!-- Ensemble strip: click any stump to inspect it in the main chart -->
	<div class="ensemble-strip">
		{#each forest as f (f.treeIdx)}
			<button
				class="tree-chip"
				class:active={f.treeIdx === activeTreeIdx}
				onclick={() => (activeTreeIdx = f.treeIdx)}
			>
				<span class="chip-idx">#{f.treeIdx + 1}</span>
				<span class="chip-feat"
					>{f.stump.featureIdx === 0 ? 'x₁' : 'x₂'} ≤ {f.stump.threshold.toFixed(2)}</span
				>
			</button>
		{/each}
	</div>

	<p class="diversity-note">{diversityLabel}</p>

	<!-- Stump Parameters Panel -->
	{#if activeStump}
		<div class="stump-params">
			<div class="param-cell">
				<span class="label">Feature</span>
				<span class="value mono">{splitsOnFeature}</span>
			</div>
			<div class="param-cell">
				<span class="label">Seuil</span>
				<span class="value mono">{activeStump.threshold.toFixed(3)}</span>
			</div>
			<div class="param-cell">
				<span class="label">← Préd.</span>
				<span
					class="value"
					style:color={leftPredClass === 0 ? 'var(--color-surprise)' : 'var(--color-positive)'}
					>{leftPredClass}</span
				>
			</div>
			<div class="param-cell">
				<span class="label">Préd. →</span>
				<span
					class="value"
					style:color={rightPredClass === 0 ? 'var(--color-surprise)' : 'var(--color-positive)'}
					>{rightPredClass}</span
				>
			</div>
			<div class="param-cell">
				<span class="label">Échantillons</span>
				<span class="value mono">{leftCount} / {rightCount}</span>
			</div>
		</div>
	{/if}

	<!-- Metrics Panel -->
	<Metrics align="center">
		<div class="cell">
			<span class="label">Précision</span>
			<span class="value" style:color="var(--color-positive)">{(accuracy * 100).toFixed(1)}%</span>
			<span class="unit">{Math.round(accuracy * N_SAMPLES)}/{N_SAMPLES} corrects</span>
		</div>

		<div class="cell">
			<span class="label">Gini avant</span>
			<span class="value" style:color="var(--color-surprise)">{giniBefore.toFixed(3)}</span>
			<span class="unit">impureté globale</span>
		</div>

		<div class="cell">
			<span class="label">Gini après</span>
			<span class="value" style:color="var(--color-belief)">{giniAfter.toFixed(3)}</span>
			<span class="unit"
				>pondéré {leftCount}×{giniLeft.toFixed(2)} + {rightCount}×{giniRight.toFixed(2)}</span
			>
		</div>

		<div class="cell">
			<span class="label">Gain info.</span>
			<span class="value" style:color="var(--color-positive)">{infoGainVal.toFixed(3)}</span>
			<span class="unit">bits d'entropie</span>
		</div>
	</Metrics>

	<!-- Controls -->
	<div class="controls-panel">
		<Slider
			bind:value={mTry}
			min={1}
			max={2}
			step={1}
			label="Taille sous-ensemble (m) — fixée pour toute la forêt"
		/>

		<div class="actions-row">
			<Button variant="outline" size="sm" onclick={newDataset}>⟲ Nouvelles données</Button>
			<Button variant="primary" size="sm" onclick={newForest}>🎲 Nouvel ensemble d'arbres</Button>
		</div>
	</div>

	<!-- Insight box -->
	<div class="insight-box">
		<span class="icon">🌲</span>
		<p>
			Dans un <strong>Random Forest</strong>, m est un hyperparamètre
			<strong>fixe pour toute la forêt</strong>
			: chaque arbre tire toujours exactement m features par division, mais
			<strong>lesquelles</strong>
			sont tirées indépendamment à chaque arbre (et même à chaque nœud, dans un vrai arbre plus profond).
			Avec m=1 ici, les {N_TREES} arbres ci-dessus ont chacun tiré leur propre feature au hasard — regardez
			les lignes fantômes grises sur le graphique : elles montrent tous les autres seuils de l'ensemble.
			Avec m=2, il n'y a plus rien à tirer au hasard (les deux features sont toujours disponibles), donc
			tous les arbres retombent sur exactement le même seuil — la diversité de features disparaît complètement,
			ce qui, d'après le Théorème 6.1 du cours, ramène la corrélation moyenne
			<span class="mono">ρ̄</span> à son maximum.
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
		max-width: 480px;
	}

	.subtitle {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.scatter-svg {
		width: 100%;
		height: auto;
	}

	.grid line {
		stroke: var(--color-border);
		stroke-opacity: 0.4;
		stroke-width: 0.5;
	}

	.axis-label {
		font-size: 12px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	.region {
		opacity: 0.12;
		transition: fill 0.3s ease;
	}
	.region.is-class-0 {
		fill: var(--color-surprise);
	}
	.region.is-class-1 {
		fill: var(--color-positive);
	}

	.boundary {
		stroke: var(--color-belief);
		stroke-width: 2.5;
		filter: drop-shadow(0 0 3px color-mix(in srgb, var(--color-belief) 40%, transparent));
	}

	.boundary-ghost {
		stroke: var(--color-text-muted);
		stroke-width: 1;
		opacity: 0.35;
		stroke-dasharray: 3 3;
	}

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

	.badge-bg {
		fill: var(--color-surface-2);
		stroke: var(--color-border);
		stroke-width: 0.8;
	}
	.badge-text {
		font-size: 10px;
		fill: var(--color-text);
		font-family: var(--font-mono, monospace);
	}

	.ensemble-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		justify-content: center;
		width: 100%;
		max-width: 480px;
	}

	.tree-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		padding: 0.3rem 0.6rem;
		border-radius: var(--radius-sm, 4px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
		cursor: pointer;
		font-family: var(--font-mono, monospace);
		color: var(--color-text-muted);
		transition:
			border-color 0.15s ease,
			color 0.15s ease,
			background 0.15s ease;
	}

	.tree-chip:hover {
		border-color: var(--color-belief);
	}

	.tree-chip.active {
		border-color: var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 12%, transparent);
		color: var(--color-text);
	}

	.chip-idx {
		font-size: 0.65rem;
		opacity: 0.7;
	}

	.chip-feat {
		font-size: 0.72rem;
		font-weight: 700;
	}

	.diversity-note {
		margin: 0;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		text-align: center;
		font-style: italic;
	}

	.stump-params {
		display: flex;
		gap: 0.5rem;
		width: 100%;
		max-width: 480px;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		flex-wrap: wrap;
	}

	.param-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		min-width: 60px;
	}

	.param-cell .label {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-family: var(--font-mono, monospace);
	}

	.param-cell .value {
		font-family: var(--font-mono, monospace);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.mono {
		font-family: var(--font-mono, monospace);
	}

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
		justify-content: center;
		flex-wrap: wrap;
	}

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
