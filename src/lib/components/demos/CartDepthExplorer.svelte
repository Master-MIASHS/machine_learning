<script lang="ts">
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import {
		accuracyOf,
		buildCartTree,
		countLeaves,
		getLeafRegions,
		generateTreeDemoDataset,
		trainTestSplit,
		type CartNode
	} from '$lib/math/tree-utils';

	// Fixed label noise so that a deep tree can visibly overfit (train accuracy
	// climbs toward 100% while test accuracy plateaus at the Bayes limit).
	const NOISE = 0.15;
	const TEST_FRACTION = 0.3;
	const MAX_DEPTH = 8;

	// ── Partition panel projection ────────────────────────────────────────
	const P_W = 420;
	const P_H = 340;
	const P_PAD = { top: 18, right: 16, bottom: 32, left: 38 };
	const P_PLOT_W = P_W - P_PAD.left - P_PAD.right;
	const P_PLOT_H = P_H - P_PAD.top - P_PAD.bottom;
	const DMIN = -2.5;
	const DMAX = 2.5;
	function pX(v: number): number {
		return P_PAD.left + ((v - DMIN) / (DMAX - DMIN)) * P_PLOT_W;
	}
	function pY(v: number): number {
		return P_H - P_PAD.bottom - ((v - DMIN) / (DMAX - DMIN)) * P_PLOT_H;
	}

	// ── Depth-accuracy curve projection (hand-rolled) ──────────────────────
	// The shared LineChart uses a 0-indexed x-axis and prints raw integer
	// tick values, which is a poor fit for "profondeur 1..8"; so the curve is
	// drawn by hand here. Swap for a real labelled-line component if one is
	// added to the chart library later.
	const C_W = 460;
	const C_H = 220;
	const C_PAD = { top: 14, right: 16, bottom: 34, left: 42 };
	function cX(d: number): number {
		return C_PAD.left + ((d - 1) / (MAX_DEPTH - 1)) * (C_W - C_PAD.left - C_PAD.right);
	}
	function cY(a: number): number {
		return C_H - C_PAD.bottom - a * (C_H - C_PAD.top - C_PAD.bottom);
	}

	// ── State ──────────────────────────────────────────────────────────────
	let seed = $state(0);
	let maxDepth = $state(2);
	let minLeaf = $state(2);

	const data = $derived(generateTreeDemoDataset(seed, NOISE));
	const split = $derived(trainTestSplit(data.X, data.y, TEST_FRACTION, seed));

	const currentTree = $derived(
		buildCartTree(split.XTrain, split.yTrain, {
			criterion: 'gini',
			maxDepth,
			minSamplesLeaf: minLeaf
		})
	);

	const trainAcc = $derived(accuracyOf(currentTree, split.XTrain, split.yTrain));
	const testAcc = $derived(accuracyOf(currentTree, split.XTest, split.yTest));
	const nLeaves = $derived(countLeaves(currentTree));

	// Full 1..8 curve so the whole bias/variance trade-off is visible; the
	// current depth is marked on top of it.
	const depthCurve = $derived.by(() => {
		const pts: { depth: number; train: number; test: number }[] = [];
		for (let d = 1; d <= MAX_DEPTH; d++) {
			const t = buildCartTree(split.XTrain, split.yTrain, {
				criterion: 'gini',
				maxDepth: d,
				minSamplesLeaf: minLeaf
			});
			pts.push({
				depth: d,
				train: accuracyOf(t, split.XTrain, split.yTrain),
				test: accuracyOf(t, split.XTest, split.yTest)
			});
		}
		return pts;
	});

	const regions = $derived(getLeafRegions(currentTree, [DMIN, DMAX], [DMIN, DMAX]));
	const trainPoints = $derived(split.XTrain.map((r, i) => ({ r, y: split.yTrain[i] })));
	const testPoints = $derived(split.XTest.map((r, i) => ({ r, y: split.yTest[i] })));

	// ── Tree diagram layout (hand-rolled SVG) ─────────────────────────────
	// No generic tree-diagram component exists in charts/ or narrative/, so this
	// is a minimal hand-rolled layout, capped at the first 3 levels (deeper
	// subtrees are collapsed to a "…" box). Swap for a real component if one is
	// added to the design system later.
	const VISUAL_DEPTH = 4;
	const COL_W = 88;
	const LEVEL_H = 48;
	const TOP_PAD = 26;
	const BOX_W = 80;
	const BOX_H = 40;

	function condLabel(n: CartNode): string {
		return `${n.featureIdx === 0 ? 'x₁' : 'x₂'} ≤ ${n.threshold.toFixed(2)}`;
	}
	const EDGE_MARGIN = 16;
	const diagram = $derived.by(() => {
		const boxes: {
			x: number;
			y: number;
			isLeaf: boolean;
			collapsed: boolean;
			cls: number;
			title: string;
			sub: string;
		}[] = [];
		const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
		let slot = 0;

		function rec(node: CartNode): number {
			const y = TOP_PAD + node.depth * LEVEL_H;
			const terminal = node.isLeaf || node.depth >= VISUAL_DEPTH;
			if (terminal) {
				const x = EDGE_MARGIN + BOX_W / 2 + slot++ * COL_W;
				boxes.push({
					x,
					y,
					isLeaf: node.isLeaf,
					collapsed: !node.isLeaf,
					cls: node.prediction,
					title: node.isLeaf ? `cl. ${node.prediction}` : '…',
					sub: `n=${node.nSamples}`
				});
				return x;
			}
			const lx = rec(node.left!);
			const rx = rec(node.right!);
			const x = (lx + rx) / 2;
			const childY = TOP_PAD + (node.depth + 1) * LEVEL_H;
			edges.push({ x1: x, y1: y, x2: lx, y2: childY });
			edges.push({ x1: x, y1: y, x2: rx, y2: childY });
			boxes.push({
				x,
				y,
				isLeaf: false,
				collapsed: false,
				cls: node.prediction,
				title: condLabel(node),
				sub: `imp=${node.impurity.toFixed(2)}`
			});
			return x;
		}

		rec(currentTree);
		return {
			boxes,
			edges,
			width: Math.max(48 + slot * COL_W, 220),
			height: TOP_PAD + VISUAL_DEPTH * LEVEL_H + BOX_H + 12
		};
	});

	const trainPoly = $derived(depthCurve.map((p) => `${cX(p.depth)},${cY(p.train)}`).join(' '));
	const testPoly = $derived(depthCurve.map((p) => `${cX(p.depth)},${cY(p.test)}`).join(' '));

	function newDataset() {
		seed += 1;
	}
</script>

<div class="demo-wrap">
	<div class="header">
		<h2>Construction CART — partition, arbre et compromis biais/variance</h2>
		<p class="subtitle">
			Un motif 2×2 (échiquier) avec du bruit d'étiquette : un stump (profondeur 1) sous-apprend, la
			profondeur 2–4 capture les quatre quadrants, et une grande profondeur sur-apprend le bruit.
		</p>
	</div>

	<div class="panels">
		<!-- Partition -->
		<div class="panel">
			<h3 class="panel-title">Partition de l'espace</h3>
			<svg
				viewBox={`0 0 ${P_W} ${P_H}`}
				class="panel-svg"
				role="img"
				aria-label="Régions de partition et points d'entraînement et de test"
			>
				<g class="grid">
					{#each Array.from({ length: 6 }, (_, i) => DMIN + (i / 5) * (DMAX - DMIN)) as tick}
						<line x1={pX(tick)} y1={P_PAD.top} x2={pX(tick)} y2={P_H - P_PAD.bottom} />
						<line x1={P_PAD.left} y1={pY(tick)} x2={P_W - P_PAD.right} y2={pY(tick)} />
					{/each}
				</g>

				{#each regions as reg}
					<rect
						x={pX(reg.xRange[0])}
						y={pY(reg.yRange[1])}
						width={Math.max(0, pX(reg.xRange[1]) - pX(reg.xRange[0]))}
						height={Math.max(0, pY(reg.yRange[0]) - pY(reg.yRange[1]))}
						class="region"
						class:is-class-0={reg.prediction === 0}
						class:is-class-1={reg.prediction === 1}
					/>
				{/each}

				{#each trainPoints as pt}
					<circle
						cx={pX(pt.r[0])}
						cy={pY(pt.r[1])}
						r={3.5}
						class="dot"
						class:is-class-0={pt.y === 0}
						class:is-class-1={pt.y === 1}
					/>
				{/each}
				{#each testPoints as pt}
					<circle
						cx={pX(pt.r[0])}
						cy={pY(pt.r[1])}
						r={3}
						class="dot dot-test"
						class:is-class-0={pt.y === 0}
						class:is-class-1={pt.y === 1}
					/>
				{/each}

				<text x={P_W / 2} y={P_H - 4} class="axis-label" text-anchor="middle">x₁</text>
				<text
					x={12}
					y={P_H / 2}
					class="axis-label"
					text-anchor="middle"
					transform={`rotate(-90, 12, ${P_H / 2})`}>x₂</text
				>
			</svg>
		</div>

		<!-- Tree diagram -->
		<div class="panel">
			<h3 class="panel-title">Arbre correspondant</h3>
			<svg
				viewBox={`0 0 ${diagram.width} ${diagram.height}`}
				class="panel-svg"
				role="img"
				aria-label="Diagramme de l'arbre, trois premiers niveaux"
			>
				{#each diagram.edges as e}
					<line x1={e.x1} y1={e.y1 - BOX_H / 2} x2={e.x2} y2={e.y2 - BOX_H / 2} class="edge" />
				{/each}
				{#each diagram.boxes as b}
					<rect
						x={b.x - BOX_W / 2}
						y={b.y - BOX_H / 2}
						width={BOX_W}
						height={BOX_H}
						rx={5}
						class="tnode"
						class:leaf={b.isLeaf}
						class:collapsed={b.collapsed}
						class:is-class-0={b.isLeaf && b.cls === 0}
						class:is-class-1={b.isLeaf && b.cls === 1}
					/>
					<text x={b.x} y={b.y - 3} text-anchor="middle" class="tnode-title">{b.title}</text>
					<text x={b.x} y={b.y + 12} text-anchor="middle" class="tnode-sub">{b.sub}</text>
				{/each}
			</svg>
		</div>
	</div>

	<!-- Depth-accuracy curve -->
	<div class="panel curve-panel">
		<h3 class="panel-title">Précision en fonction de la profondeur</h3>
		<svg
			viewBox={`0 0 ${C_W} ${C_H}`}
			class="panel-svg"
			role="img"
			aria-label="Précision sur l'entraînement et le test en fonction de la profondeur de l'arbre"
		>
			{#each [0, 0.25, 0.5, 0.75, 1] as tick}
				<line
					x1={C_PAD.left}
					y1={cY(tick)}
					x2={C_W - C_PAD.right}
					y2={cY(tick)}
					class="grid-line"
				/>
				<text
					x={C_PAD.left - 6}
					y={cY(tick)}
					text-anchor="end"
					dominant-baseline="middle"
					class="tick-label">{Math.round(tick * 100)}</text
				>
			{/each}

			<!-- current-depth marker -->
			<line
				x1={cX(maxDepth)}
				y1={C_PAD.top}
				x2={cX(maxDepth)}
				y2={C_H - C_PAD.bottom}
				class="depth-marker"
			/>

			<polyline points={trainPoly} class="line line-train" />
			<polyline points={testPoly} class="line line-test" />

			{#each depthCurve as p (p.depth)}
				<circle cx={cX(p.depth)} cy={cY(p.train)} r={2.5} class="pt pt-train" />
				<circle cx={cX(p.depth)} cy={cY(p.test)} r={2.5} class="pt pt-test" />
			{/each}

			{#each Array.from({ length: MAX_DEPTH }, (_, i) => i + 1) as d}
				<text x={cX(d)} y={C_H - C_PAD.bottom + 14} text-anchor="middle" class="tick-label"
					>{d}</text
				>
			{/each}

			<text
				x={(C_PAD.left + C_W - C_PAD.right) / 2}
				y={C_H - 3}
				text-anchor="middle"
				class="axis-label">profondeur</text
			>
			<text
				x={12}
				y={(C_PAD.top + C_H - C_PAD.bottom) / 2}
				text-anchor="middle"
				transform={`rotate(-90, 12, ${(C_PAD.top + C_H - C_PAD.bottom) / 2})`}
				class="axis-label">précision %</text
			>

			<g transform={`translate(${C_W - C_PAD.right - 150}, ${C_PAD.top + 2})`}>
				<line x1="0" y1="5" x2="14" y2="5" class="line line-train" />
				<text x="18" y="8" class="legend-label">entraînement</text>
				<line x1="90" y1="5" x2="104" y2="5" class="line line-test" />
				<text x="108" y="8" class="legend-label">test</text>
			</g>
		</svg>
		<p class="curve-note">
			À gauche : le biais domine (l'arbre est trop simple pour le motif). À droite : la variance
			domine (l'écart train/test se creuse = sur-apprentissage).
		</p>
	</div>

	<Metrics align="center">
		<div class="cell">
			<span class="label">Précision train</span>
			<span class="value" style:color="var(--color-positive)">{(trainAcc * 100).toFixed(1)}%</span>
		</div>
		<div class="cell">
			<span class="label">Précision test</span>
			<span class="value" style:color="var(--color-belief)">{(testAcc * 100).toFixed(1)}%</span>
		</div>
		<div class="cell">
			<span class="label">Feuilles (régions)</span>
			<span class="value">{nLeaves}</span>
		</div>
		<div class="cell">
			<span class="label">Écart train−test</span>
			<span class="value" style:color="var(--color-surprise)">
				{((trainAcc - testAcc) * 100).toFixed(1)} pts
			</span>
			<span class="unit">proxy de la variance</span>
		</div>
	</Metrics>

	<!-- Controls -->
	<div class="controls-panel">
		<Slider bind:value={maxDepth} min={1} max={MAX_DEPTH} step={1} label="Profondeur maximale" />
		<Slider bind:value={minLeaf} min={1} max={10} step={1} label="Exemples minimaux par feuille" />
		<div class="actions-row">
			<Button variant="primary" size="sm" onclick={newDataset}>⟲ Nouveau jeu de données</Button>
		</div>
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
		max-width: 640px;
	}

	.subtitle {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		width: 100%;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}

	.curve-panel {
		width: 100%;
	}

	.panel-title {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.panel-svg {
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
		opacity: 0.13;
	}
	.region.is-class-0 {
		fill: var(--color-surprise);
	}
	.region.is-class-1 {
		fill: var(--color-positive);
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
	.dot-test {
		fill: none;
		stroke-width: 1.5;
	}
	.dot-test.is-class-0 {
		stroke: var(--color-surprise);
	}
	.dot-test.is-class-1 {
		stroke: var(--color-positive);
	}

	/* tree diagram */
	.edge {
		stroke: var(--color-border);
		stroke-width: 1;
	}
	.tnode {
		fill: var(--color-surface);
		stroke: var(--color-border);
		stroke-width: 1;
	}
	.tnode.leaf.is-class-0 {
		fill: color-mix(in srgb, var(--color-surprise) 18%, var(--color-surface));
		stroke: var(--color-surprise);
	}
	.tnode.leaf.is-class-1 {
		fill: color-mix(in srgb, var(--color-positive) 18%, var(--color-surface));
		stroke: var(--color-positive);
	}
	.tnode.collapsed {
		stroke-dasharray: 3 3;
	}
	.tnode-title {
		font-size: 11px;
		font-weight: 700;
		fill: var(--color-text);
		font-family: var(--font-mono, monospace);
	}
	.tnode-sub {
		font-size: 9px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	/* depth curve */
	.grid-line {
		stroke: var(--color-border);
		stroke-opacity: 0.5;
		stroke-width: 0.5;
	}
	.tick-label {
		font-size: 10px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}
	.legend-label {
		font-size: 11px;
		fill: var(--color-text-muted);
		font-family: var(--font-sans);
	}
	.line {
		fill: none;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.line-train {
		stroke: var(--color-positive);
	}
	.line-test {
		stroke: var(--color-belief);
	}
	.pt-train {
		fill: var(--color-positive);
	}
	.pt-test {
		fill: var(--color-belief);
	}
	.depth-marker {
		stroke: var(--color-text-muted);
		stroke-width: 1;
		stroke-dasharray: 4 3;
		opacity: 0.6;
	}
	.curve-note {
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		font-style: italic;
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
		justify-content: center;
	}

	@media (max-width: 720px) {
		.panels {
			grid-template-columns: 1fr;
		}
	}
</style>
