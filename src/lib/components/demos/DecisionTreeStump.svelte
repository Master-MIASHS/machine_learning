<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import {
		fitRandomStump,
		giniImpurity,
		informationGain,
		predictStumpClass
	} from '$lib/math/random-forest';
	import { gaussianSample } from '$lib/math/gaussian';
	import { mulberry32, combineSeed } from '$lib/math/util';

	// Random Forest of depth-1 trees, following Algorithme 4.2
	// (course_sources/typst/regularization.typ, ch. 4): each tree gets its own
	// bootstrap sample S_n^(j) AND its own random subset of m features among d.
	// Depth 1 is a visualization simplification (one node → one draw of m)

	const N_SAMPLES = 80;
	const D = 5;
	const N_TREES = 6;
	const FEATURE_NAMES = ['x₁', 'x₂', 'x₃', 'x₄', 'x₅'];
	const N_VISIBLE = 2; // x₁, x₂ are the plot axes; x₃..x₅ are hidden variables
	const SQRT_D = Math.sqrt(D);

	const DATA_MIN = -3.5;
	const DATA_MAX = 3.5;

	const SVG_W = 460;
	const SVG_H = 320;
	const PAD = { top: 20, right: 20, bottom: 35, left: 40 };
	const PLOT_W = SVG_W - PAD.left - PAD.right;
	const PLOT_H = SVG_H - PAD.bottom - PAD.top;

	// 1-D strip for stumps on hidden variables. Hand-rolled SVG fallback: no
	// 1-D strip-plot component exists yet; swap for one if it gets built.
	const STRIP_H = 80;
	const STRIP_PAD = { top: 12, bottom: 24 };
	const STRIP_ROW = { 0: 30, 1: 48 } as Record<number, number>; // y of class rows

	/**
	 * Toy synthetic model (simplification, seeded):
	 *  - x₁, x₂ : class means ∓1, σ = 1.2 (the informative, visible pair);
	 *  - x₃     : weakly informative, class means ∓0.3, σ = 1;
	 *  - x₄, x₅ : pure noise N(0, 1), independent of the label.
	 */
	function generateData(seed: number): { X: number[][]; y: number[] } {
		const rng = mulberry32(seed);
		const X: number[][] = [];
		const y: number[] = [];
		const half = Math.floor(N_SAMPLES / 2);
		for (let i = 0; i < N_SAMPLES; i++) {
			const cls = i < half ? 0 : 1;
			const s = cls === 0 ? -1 : 1;
			X.push([
				gaussianSample({ mu: s, sigma2: 1.44 }, rng),
				gaussianSample({ mu: s, sigma2: 1.44 }, rng),
				gaussianSample({ mu: 0.3 * s, sigma2: 1 }, rng),
				gaussianSample({ mu: 0, sigma2: 1 }, rng),
				gaussianSample({ mu: 0, sigma2: 1 }, rng)
			]);
			y.push(cls);
		}
		return { X, y };
	}

	// ── State ──────────────────────────────────────────────────────────
	// `dataSeed` regenerates the dataset; `treeSeed` redraws the ensemble
	// (bootstrap samples + feature subsets) on the SAME dataset.
	let dataSeed = $state(0);
	let treeSeed = $state(0);
	let mTry = $state(2); // fixed for the whole forest; default ≈ √d
	let activeTreeIdx = $state(0);

	const data = $derived(generateData(combineSeed(dataSeed, 42)));

	const forest = $derived.by(() =>
		Array.from({ length: N_TREES }, (_, t) => {
			// mulberry32 + combineSeed: independent, well-mixed stream per tree
			// (the previous Park–Miller seeding gave nearly identical first
			// draws for adjacent seeds → all trees picked the same feature).
			const rng = mulberry32(combineSeed(combineSeed(treeSeed, t), 1));
			const fit = fitRandomStump(data.X, data.y, mTry, rng);
			return { ...fit, treeIdx: t, nDistinct: new Set(fit.bootstrapIdx).size };
		})
	);

	const active = $derived(forest[Math.min(activeTreeIdx, forest.length - 1)]);
	const activeStump = $derived(active.stump);
	const isHidden = $derived(activeStump.featureIdx >= N_VISIBLE);
	const isHorizontalSplit = $derived(activeStump.featureIdx === 1);
	const splitsOnFeature = $derived(FEATURE_NAMES[activeStump.featureIdx]);
	const inBag = $derived(new Set(active.bootstrapIdx));

	// Metrics on the full data set S_n (not the bootstrap sample).
	const goesLeft = $derived(data.X.map((x) => x[activeStump.featureIdx] <= activeStump.threshold));
	const leftLabels = $derived(data.y.filter((_, i) => goesLeft[i]));
	const rightLabels = $derived(data.y.filter((_, i) => !goesLeft[i]));
	const leftCount = $derived(leftLabels.length);
	const rightCount = $derived(rightLabels.length);
	const accuracy = $derived(
		data.X.filter((x, i) => predictStumpClass(activeStump, x) === data.y[i]).length / N_SAMPLES
	);
	const giniBefore = $derived(giniImpurity(data.y));
	const giniLeft = $derived(giniImpurity(leftLabels));
	const giniRight = $derived(giniImpurity(rightLabels));
	const giniAfter = $derived((leftCount * giniLeft + rightCount * giniRight) / N_SAMPLES);
	const infoGainVal = $derived(informationGain(data.y, leftLabels, rightLabels));
	const leftPredClass = $derived(Math.round(activeStump.leftValue));
	const rightPredClass = $derived(Math.round(activeStump.rightValue));

	function projX(v: number): number {
		return PAD.left + ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_W;
	}
	function projY(v: number): number {
		return SVG_H - PAD.bottom - ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_H;
	}
	function clampX(v: number): number {
		return projX(Math.min(DATA_MAX, Math.max(DATA_MIN, v)));
	}

	// Ensemble diversity summary
	const featureCounts = $derived.by(() => {
		const c = Array.from({ length: D }, () => 0);
		for (const f of forest) c[f.stump.featureIdx]++;
		return c;
	});
	const nHiddenStumps = $derived(featureCounts.slice(N_VISIBLE).reduce((a, b) => a + b, 0));
	const nDistinctSplits = $derived(
		new Set(forest.map((f) => `${f.stump.featureIdx}:${f.stump.threshold.toFixed(3)}`)).size
	);
	const featureSummary = $derived(
		featureCounts
			.map((c, j) => (c > 0 ? `${FEATURE_NAMES[j]}×${c}` : null))
			.filter((s) => s !== null)
			.join(', ')
	);

	// Badge / banner boxes are sized from the rendered text width
	// (getComputedTextLength) + side padding, so the label never overflows
	// whatever the font. Initial values are rough estimates for SSR / first paint.
	const LABEL_PAD_X = 10;
	const badgeLabel = $derived(
		`Arbre #${activeTreeIdx + 1} — split : ${splitsOnFeature} ≤ ${activeStump.threshold.toFixed(2)}${isHidden ? ' (cachée)' : ''}`
	);
	const bannerLabel = $derived(`Variable cachée ${splitsOnFeature} — absente du plan (x₁, x₂)`);
	let badgeTextEl = $state<SVGTextElement | null>(null);
	let bannerTextEl = $state<SVGTextElement | null>(null);
	let badgeTextW = $state(0);
	let bannerTextW = $state(0);
	$effect(() => {
		void badgeLabel;
		if (badgeTextEl) badgeTextW = badgeTextEl.getComputedTextLength();
	});
	$effect(() => {
		void bannerLabel;
		if (bannerTextEl) bannerTextW = bannerTextEl.getComputedTextLength();
	});
	const badgeBoxW = $derived(
		Math.min(PLOT_W, (badgeTextW || badgeLabel.length * 6.1) + 2 * LABEL_PAD_X)
	);
	const bannerBoxW = $derived(
		Math.min(PLOT_W, (bannerTextW || bannerLabel.length * 6.4) + 2 * LABEL_PAD_X)
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
		<h2>Forêt de stumps — arbres de profondeur 1</h2>
		<p class="subtitle">
			Les données ont <strong>d = {D} variables</strong>. Seules x₁ et x₂ sont visibles dans le plan
			; <strong>x₃, x₄, x₅ sont des variables cachées</strong> (non représentables en 2D). Chaque
			arbre reçoit son propre échantillon bootstrap et tire au hasard m variables parmi les
			{D} avant de choisir sa meilleure division.
		</p>
	</div>

	<div class="layout">
		<div class="viz-col">
			<Figure type="chart" style="width: 100%; margin: 0">
				<svg
					viewBox={`0 0 ${SVG_W} ${SVG_H}`}
					class="scatter-svg"
					role="img"
					aria-label="Nuage de points dans le plan (x₁, x₂) avec la frontière du stump actif"
				>
					<g class="grid">
						{#each Array.from({ length: 8 }, (_, i) => DATA_MIN + (i / 7) * (DATA_MAX - DATA_MIN)) as tick (tick)}
							<line x1={projX(tick)} y1={PAD.top} x2={projX(tick)} y2={SVG_H - PAD.bottom} />
							<line x1={PAD.left} y1={projY(tick)} x2={SVG_W - PAD.right} y2={projY(tick)} />
						{/each}
					</g>

					<!-- Ghost boundaries: other stumps of the ensemble that split on a VISIBLE variable -->
					{#each forest as f (f.treeIdx)}
						{#if f.treeIdx !== activeTreeIdx && f.stump.featureIdx < N_VISIBLE}
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

					{#if !isHidden}
						{#if isHorizontalSplit}
							<rect
								x={PAD.left}
								y={PAD.top}
								width={PLOT_W}
								height={projY(activeStump.threshold) - PAD.top}
								class="region"
								class:is-class-0={rightPredClass === 0}
								class:is-class-1={rightPredClass === 1}
							/>
							<rect
								x={PAD.left}
								y={projY(activeStump.threshold)}
								width={PLOT_W}
								height={SVG_H - PAD.bottom - projY(activeStump.threshold)}
								class="region"
								class:is-class-0={leftPredClass === 0}
								class:is-class-1={leftPredClass === 1}
							/>
							<line
								x1={PAD.left}
								y1={projY(activeStump.threshold)}
								x2={SVG_W - PAD.right}
								y2={projY(activeStump.threshold)}
								class="boundary"
							/>
						{:else}
							<rect
								x={PAD.left}
								y={PAD.top}
								width={projX(activeStump.threshold) - PAD.left}
								height={PLOT_H}
								class="region"
								class:is-class-0={leftPredClass === 0}
								class:is-class-1={leftPredClass === 1}
							/>
							<rect
								x={projX(activeStump.threshold)}
								y={PAD.top}
								width={SVG_W - PAD.right - projX(activeStump.threshold)}
								height={PLOT_H}
								class="region"
								class:is-class-0={rightPredClass === 0}
								class:is-class-1={rightPredClass === 1}
							/>
							<line
								x1={projX(activeStump.threshold)}
								y1={PAD.top}
								x2={projX(activeStump.threshold)}
								y2={SVG_H - PAD.bottom}
								class="boundary"
							/>
						{/if}
					{/if}

					<!-- Points: filled = in the active tree's bootstrap sample, faded = out-of-bag -->
					{#each data.X as point, i (i)}
						<circle
							cx={projX(point[0])}
							cy={projY(point[1])}
							r={3.5}
							class="dot"
							class:is-class-0={data.y[i] === 0}
							class:is-class-1={data.y[i] === 1}
							class:oob={!inBag.has(i)}
						/>
					{/each}

					{#if isHidden}
						<g transform={`translate(${SVG_W / 2}, ${PAD.top + 26})`}>
							<rect
								x={-bannerBoxW / 2}
								y="-12"
								width={bannerBoxW}
								height="24"
								rx="4"
								class="hidden-banner"
							/>
							<text
								bind:this={bannerTextEl}
								x="0"
								y="4"
								text-anchor="middle"
								class="hidden-banner-text">{bannerLabel}</text
							>
						</g>
					{/if}

					<text x={SVG_W / 2} y={SVG_H - 4} class="axis-label" text-anchor="middle">x₁</text>
					<text
						x={12}
						y={SVG_H / 2}
						class="axis-label"
						text-anchor="middle"
						transform={`rotate(-90, 12, ${SVG_H / 2})`}>x₂</text
					>

					<g transform={`translate(${SVG_W / 2}, ${PAD.top - 4})`}>
						<rect
							x={-badgeBoxW / 2}
							y="-10"
							width={badgeBoxW}
							height="20"
							rx="4"
							class="badge-bg"
						/>
						<text bind:this={badgeTextEl} x="0" y="3" text-anchor="middle" class="badge-text"
							>{badgeLabel}</text
						>
					</g>
				</svg>

				<svg
					viewBox={`0 0 ${SVG_W} ${STRIP_H}`}
					class="strip-svg"
					role="img"
					aria-label={`Projection des points sur la variable ${splitsOnFeature} avec le seuil du stump actif`}
				>
					<rect
						x={PAD.left}
						y={STRIP_PAD.top}
						width={clampX(activeStump.threshold) - PAD.left}
						height={STRIP_H - STRIP_PAD.top - STRIP_PAD.bottom}
						class="region"
						class:is-class-0={leftPredClass === 0}
						class:is-class-1={leftPredClass === 1}
					/>
					<rect
						x={clampX(activeStump.threshold)}
						y={STRIP_PAD.top}
						width={SVG_W - PAD.right - clampX(activeStump.threshold)}
						height={STRIP_H - STRIP_PAD.top - STRIP_PAD.bottom}
						class="region"
						class:is-class-0={rightPredClass === 0}
						class:is-class-1={rightPredClass === 1}
					/>
					<text x={PAD.left - 4} y={STRIP_ROW[0] + 3} class="strip-row-label" text-anchor="end"
						>y=0</text
					>
					<text x={PAD.left - 4} y={STRIP_ROW[1] + 3} class="strip-row-label" text-anchor="end"
						>y=1</text
					>
					{#each data.X as point, i (i)}
						<circle
							cx={clampX(point[activeStump.featureIdx])}
							cy={STRIP_ROW[data.y[i]] + ((i * 37) % 7) - 3}
							r={3}
							class="dot"
							class:is-class-0={data.y[i] === 0}
							class:is-class-1={data.y[i] === 1}
							class:oob={!inBag.has(i)}
						/>
					{/each}
					<line
						x1={clampX(activeStump.threshold)}
						y1={STRIP_PAD.top}
						x2={clampX(activeStump.threshold)}
						y2={STRIP_H - STRIP_PAD.bottom}
						class="boundary"
					/>
					<text x={SVG_W / 2} y={STRIP_H - 6} class="axis-label" text-anchor="middle"
						>{splitsOnFeature} en 1D — {isHidden
							? 'variable cachée, seule vue possible'
							: 'variable visible, même seuil que dans le plan'}</text
					>
				</svg>

				{#snippet caption()}
					m = {mTry} variable{mTry > 1 ? 's' : ''} sur d = {D} (fixé pour toute la forêt) | {N_TREES}
					arbres | {N_SAMPLES} échantillons. Petit modèle synthétique seedé : x₁, x₂ informatives, x₃
					faiblement informative, x₄, x₅ bruit pur. Points estompés : hors de l'échantillon bootstrap
					de l'arbre actif ({active.nDistinct}/{N_SAMPLES} points distincts tirés). Métriques calculées
					sur les {N_SAMPLES}
					points.
				{/snippet}
			</Figure>
		</div>

		<div class="side-col">
			<div class="controls-panel">
				<Slider
					bind:value={mTry}
					min={1}
					max={D}
					step={1}
					label={`Variables tirées par division (m) — règle empirique m ≈ √d ≈ ${SQRT_D.toFixed(1).replace('.', ',')}`}
				/>

				<div class="actions-row">
					<Button variant="outline" size="sm" onclick={newDataset}>⟲ Nouvelles données</Button>
					<Button variant="primary" size="sm" onclick={newForest}
						>🎲 Nouvel ensemble d'arbres</Button
					>
				</div>
			</div>

			<!-- Ensemble strip: click any stump to inspect it in the main chart -->
			<div class="ensemble-strip">
				{#each forest as f (f.treeIdx)}
					<button
						class="tree-chip"
						class:active={f.treeIdx === activeTreeIdx}
						class:hidden-feat={f.stump.featureIdx >= N_VISIBLE}
						onclick={() => (activeTreeIdx = f.treeIdx)}
						title={`Variables tirées : ${f.featureSubset.map((j) => FEATURE_NAMES[j]).join(', ')}`}
					>
						<span class="chip-idx"
							>#{f.treeIdx + 1}{f.stump.featureIdx >= N_VISIBLE ? ' · cachée' : ''}</span
						>
						<span class="chip-feat"
							>{FEATURE_NAMES[f.stump.featureIdx]} ≤ {f.stump.threshold.toFixed(2)}</span
						>
						<span class="chip-subset"
							>{'{'}{f.featureSubset.map((j) => FEATURE_NAMES[j]).join(',')}{'}'}</span
						>
					</button>
				{/each}
			</div>

			<p class="diversity-note">
				Variables utilisées : {featureSummary} — {nDistinctSplits} divisions distinctes sur {N_TREES}
				arbres{nHiddenStumps > 0
					? ` — ${nHiddenStumps} arbre${nHiddenStumps > 1 ? 's' : ''} sur une variable cachée (ligne absente du plan)`
					: ''}.
			</p>

			<div class="stump-params">
				<div class="param-cell">
					<span class="label">Variable</span>
					<span class="value mono">{splitsOnFeature}{isHidden ? ' (cachée)' : ''}</span>
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

			<Metrics
				align="center"
				style="margin: 0; padding: 0.5rem 0 0; background: transparent; border: none; border-top: 1px solid var(--color-border); border-radius: 0"
			>
				<div class="cell">
					<span class="label">Précision</span>
					<span class="value" style:color="var(--color-positive)"
						>{(accuracy * 100).toFixed(1)}%</span
					>
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
		</div>
	</div>

	<div class="insight-box">
		<span class="icon">🌲</span>
		<p>
			Chaque arbre d'un <strong>Random Forest</strong> combine deux sources d'aléa :
			<strong>un échantillon bootstrap</strong> (n tirages avec remise) et, à chaque division,
			<strong>m variables tirées au hasard</strong> parmi les d. Avec m = d = {D}, toutes les
			variables sont toujours disponibles : chaque arbre choisit la variable dominante et seuls ses
			seuils bougent légèrement d'un bootstrap à l'autre — les arbres restent fortement corrélés.
			Avec m petit, beaucoup d'arbres sont contraints de couper sur une variable moins informative,
			voire sur une variable cachée de pur bruit (x₄, x₅) : chaque arbre est moins bon, mais
			l'ensemble est plus diversifié. C'est ce compromis qu'exprime le théorème sur la variance d'un
			ensemble en fonction de la corrélation moyenne <span class="mono">ρ̄</span> (section
			précédente) : réduire
			<span class="mono">ρ̄</span> diminue le terme <span class="mono">ρ̄σ²</span> que l'ajout d'arbres
			ne fait pas disparaître.
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
		background: var(--color-surface, transparent);
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
		padding: 0.5rem 0 0;
		border-top: 1px solid var(--color-border);
		justify-content: space-around;
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
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
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

	.strip-svg {
		width: 100%;
		height: auto;
		margin-top: 0.25rem;
	}

	.strip-row-label {
		font-size: 9px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	.dot.oob {
		opacity: 0.25;
	}

	.hidden-banner {
		fill: var(--color-surface-2);
		stroke: var(--color-text-muted);
		stroke-width: 0.8;
		stroke-dasharray: 4 3;
		opacity: 0.95;
	}

	.hidden-banner-text {
		font-size: 10.5px;
		fill: var(--color-text);
		font-family: var(--font-mono, monospace);
	}

	.tree-chip.hidden-feat {
		border-style: dashed;
	}

	.chip-subset {
		font-size: 0.6rem;
		opacity: 0.7;
	}

	/* Two columns on wide screens: plot on the left, controls + readouts on
	   the right, so the slider/buttons stay next to the chart they drive. */
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
		gap: 0.75rem;
		width: 100%;
		align-items: stretch;
	}

	.viz-col,
	.side-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}

	/* Right column wrapped in the same card style as Figure's chart-wrap
	   (border, radius, surface-2, padding) so both columns read as panels. */
	.side-col {
		box-sizing: border-box;
		padding: 1rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}

	@media (max-width: 760px) {
		.layout {
			grid-template-columns: 1fr;
		}
		/* single column: keep controls right under the plot */
	}
</style>
