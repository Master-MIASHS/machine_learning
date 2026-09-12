<script lang="ts">
	import { onDestroy } from 'svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import { mulberry32 } from '$lib/math/util';

	// PRNG seedé : mêmes tirages à chaque chargement ; « Régénérer » avance
	// la suite.
	const rng = mulberry32(42);

	interface DataPoint {
		x: number;
		y: number;
		label: 0 | 1;
	}

	// ── Depth-2 CART tree (3 leaves max) ─────────────────────────
	interface TreeNode {
		leaf?: boolean;
		prediction?: 0 | 1; // majority class at this leaf

		axis?: 0 | 1; // 0 = x, 1 = y
		threshold?: number;
		left?: TreeNode;
		right?: TreeNode;
	}

	interface WeakClassifier {
		root: TreeNode;
		accuracy: number;
		id: number;
		equation: string;
	}

	const defaultNumClassifiers = 7;
	let numClassifiers = $state(defaultNumClassifiers);
	const minNum = 1;
	const maxNum = 100;

	const svgW = 460,
		svgH = 380;
	const padL = 48,
		padR = 16,
		padT = 12,
		padB = 36;
	const plotW = $derived(svgW - padL - padR);
	const plotH = $derived(svgH - padT - padB);

	const domainX: [number, number] = [-0.25, 1.25];
	const domainY: [number, number] = [-0.85, 0.95];

	const gridResX = 40;
	const gridResY = 32;

	function px(x: number): number {
		return padL + ((x - domainX[0]) / (domainX[1] - domainX[0])) * plotW;
	}
	function py(y: number): number {
		return padT + ((domainY[1] - y) / (domainY[1] - domainY[0])) * plotH;
	}

	// Generate two noisy concentric rings centered around (0.5, 0).
	// Inner ring = class 0 (blue), outer ring = class 1 (red).
	function generateRingsData(n: number): DataPoint[] {
		const pts: DataPoint[] = [];
		const half = Math.floor(n / 2);

		for (let i = 0; i < n; i++) {
			const angle = rng() * 2 * Math.PI;
			const noise = () => (rng() - 0.5) * 0.08;
			if (i < half) {
				pts.push({
					x: 0.5 + 0.28 * Math.cos(angle) + noise(),
					y: 0.28 * Math.sin(angle) + noise(),
					label: 0 as const
				});
			} else {
				pts.push({
					x: 0.5 + 0.58 * Math.cos(angle) + noise(),
					y: 0.58 * Math.sin(angle) + noise(),
					label: 1 as const
				});
			}
		}
		return pts;
	}

	let dataPoints = $state(generateRingsData(90));

	// Recursively traverse a tree to classify a point.
	function classify(node: TreeNode, x: number, y: number): 0 | 1 {
		if (node.leaf) return node.prediction as 0 | 1;
		const val = node.axis === 0 ? x : y;
		return classify(val <= (node.threshold ?? 0) ? node.left! : node.right!, x, y);
	}

	// Draw a bootstrap sample (with replacement) from the dataset.
	function bootstrap(pts: DataPoint[]): DataPoint[] {
		const sample: DataPoint[] = [];
		for (let i = 0; i < pts.length; i++) {
			sample.push(pts[Math.floor(rng() * pts.length)]);
		}
		return sample;
	}

	// ── Gini impurity helper ───────────────────────────────────────
	function gini(labels: (0 | 1)[]): number {
		if (!labels.length) return 0;
		const c0 = labels.filter((l) => l === 0).length;
		const p0 = c0 / labels.length;
		return 2 * p0 * (1 - p0);
	}

	// Find the best axis-aligned split using Gini impurity.
	function findBestSplit(data: DataPoint[]): { axis: 0 | 1; threshold: number } | null {
		let bestGini = Infinity;
		let result: { axis: 0 | 1; threshold: number } | null = null;

		for (const axis of [0, 1] as (0 | 1)[]) {
			// Sort indices by the feature value
			const sorted = [...data].sort((a, b) => (axis === 0 ? a.x : a.y) - (axis === 0 ? b.x : b.y));
			const n = sorted.length;

			// Evaluate thresholds between consecutive distinct values
			for (let i = 1; i < n; i++) {
				const vLeft = axis === 0 ? sorted[i - 1].x : sorted[i - 1].y;
				const vRight = axis === 0 ? sorted[i].x : sorted[i].y;
				if (vLeft >= vRight) continue; // skip duplicates
				const threshold = (vLeft + vRight) / 2;

				// Split data into left/right groups
				const leftLabels: (0 | 1)[] = [];
				const rightLabels: (0 | 1)[] = [];
				for (const pt of sorted) {
					const val = axis === 0 ? pt.x : pt.y;
					if (val <= threshold) leftLabels.push(pt.label);
					else rightLabels.push(pt.label);
				}

				// Weighted Gini of the split
				const g =
					(leftLabels.length * gini(leftLabels) + rightLabels.length * gini(rightLabels)) / n;
				if (g < bestGini) {
					bestGini = g;
					result = { axis, threshold };
				}
			}
		}

		return result;
	}

	// Majority class of a group of labels.
	function majorityClass(data: DataPoint[]): 0 | 1 {
		const c1 = data.filter((p) => p.label === 1).length;
		return c1 > data.length / 2 ? (1 as const) : (0 as const);
	}

	// Recursively train a CART tree up to maxDepth.
	function trainTree(data: DataPoint[], depth: number): TreeNode {
		// Stopping conditions: max depth reached, all same label, or too few samples
		if (depth >= 2 || data.length < 3 || new Set(data.map((p) => p.label)).size === 1) {
			return { leaf: true, prediction: majorityClass(data) };
		}

		const split = findBestSplit(data);
		if (!split) return { leaf: true, prediction: majorityClass(data) };

		// Partition data according to the best split
		const leftData: DataPoint[] = [];
		const rightData: DataPoint[] = [];
		for (const pt of data) {
			const val = split.axis === 0 ? pt.x : pt.y;
			if (val <= split.threshold) leftData.push(pt);
			else rightData.push(pt);
		}

		// Safety: if one side is empty, make this a leaf
		if (!leftData.length || !rightData.length) {
			return { leaf: true, prediction: majorityClass(data) };
		}

		return {
			axis: split.axis,
			threshold: split.threshold,
			left: trainTree(leftData, depth + 1),
			right: trainTree(rightData, depth + 1)
		};
	}

	// Generate maxNum depth-2 trees via bootstrap bagging.
	const classifierPool = $derived.by(() => {
		const pool: WeakClassifier[] = [];

		for (let i = 0; i < maxNum; i++) {
			const sample = bootstrap(dataPoints);
			const root = trainTree(sample, 0);
			// Evaluate on the original dataset, not the bootstrap sample
			let correct = 0;
			for (const pt of dataPoints) {
				if (classify(root, pt.x, pt.y) === pt.label) correct++;
			}
			const acc = correct / dataPoints.length;

			pool.push({
				root,
				accuracy: acc,
				id: i,
				equation: 'Depth 2 tree'
			});
		}

		return pool;
	});

	const classifiers = $derived(classifierPool.slice(0, numClassifiers));

	function regenerate() {
		stopAnim();
		dataPoints = generateRingsData(90);
	}

	function ensemblePredictWith(cls: WeakClassifier[], x: number, y: number): 0 | 1 {
		let votes = 0;
		for (const c of cls) votes += classify(c.root, x, y);
		return votes > cls.length / 2 ? (1 as const) : (0 as const);
	}

	function ensemblePredict(x: number, y: number): 0 | 1 {
		return ensemblePredictWith(classifiers, x, y);
	}

	const cellStepPxW = $derived(plotW / gridResX);
	const cellStepPxH = $derived(plotH / gridResY);
	const cellRenderPxW = $derived(cellStepPxW * 1.05);
	const cellRenderPxH = $derived(cellStepPxH * 1.05);

	const cellDataWx = $derived((domainX[1] - domainX[0]) / gridResX);
	const cellDataWy = $derived((domainY[1] - domainY[0]) / gridResY);

	interface GridCell {
		sx: number;
		sy: number;
		vote: 0 | 1;
	}

	const gridCells = $derived.by(() => {
		const cells: GridCell[] = [];
		for (let iy = 0; iy < gridResY; iy++) {
			const sy = padT + iy * cellStepPxH;
			for (let ix = 0; ix < gridResX; ix++) {
				const cx = domainX[0] + (ix + 0.5) * cellDataWx;
				const cy = domainY[0] + (iy + 0.5) * cellDataWy;

				let votes1 = 0;
				for (const c of classifiers) votes1 += classify(c.root, cx, cy);

				cells.push({
					sx: padL + ix * cellStepPxW,
					sy,
					vote: votes1 > classifiers.length / 2 ? (1 as const) : (0 as const)
				});
			}
		}
		return cells;
	});

	interface Edge {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}

	const boundaryEdges = $derived.by(() => {
		const edges: Edge[] = [];

		function getCell(ix: number, iy: number): GridCell | null {
			return gridCells[iy * gridResX + ix] ?? null;
		}

		for (let iy = 0; iy < gridResY - 1; iy++) {
			for (let ix = 0; ix < gridResX - 1; ix++) {
				const left = getCell(ix, iy);
				const right = getCell(ix + 1, iy);
				const below = getCell(ix, iy + 1);
				if (!left || !right || !below) continue;

				if (left.vote !== right.vote) {
					const midX = left.sx + cellStepPxW;
					edges.push({ x1: midX, y1: left.sy - 2, x2: midX, y2: left.sy + cellStepPxH + 2 });
				}
				if (left.vote !== below.vote) {
					const midY = left.sy + cellStepPxH;
					edges.push({ x1: left.sx - 2, y1: midY, x2: left.sx + cellStepPxW + 2, y2: midY });
				}
			}
		}
		return edges;
	});

	// ── Mini classifier previews ───────────────────────────────
	const miniRes = 14;
	const miniSvgW = 80,
		miniSvgH = 52;
	const miniPad = 3;
	const miniPlotW = $derived(miniSvgW - miniPad * 2);
	const miniPlotH = $derived(miniSvgH - miniPad * 2);

	function mpx(x: number): number {
		return miniPad + ((x - domainX[0]) / (domainX[1] - domainX[0])) * miniPlotW;
	}
	function mpy(y: number): number {
		return miniPad + ((domainY[1] - y) / (domainY[1] - domainY[0])) * miniPlotH;
	}

	interface MiniCell {
		sx: number;
		sy: number;
		sw: number;
		sh: number;
		vote: 0 | 1;
	}

	const previewClassifiers = $derived.by(() => {
		const mWx = (domainX[1] - domainX[0]) / miniRes;
		const mWy = (domainY[1] - domainY[0]) / miniRes;
		const miniCellPxW = ((miniPlotW / miniRes) * 1.12) | 0;
		const miniCellPxH = ((miniPlotH / miniRes) * 1.12) | 0;

		return classifiers.slice(0, 8).map((c) => {
			const cells: MiniCell[] = [];
			for (let iy = 0; iy < miniRes; iy++) {
				for (let ix = 0; ix < miniRes; ix++) {
					const cx = domainX[0] + (ix + 0.5) * mWx;
					const cy = domainY[0] + (iy + 0.5) * mWy;
					cells.push({
						sx: miniPad + ix * (miniPlotW / miniRes),
						sy: miniPad + iy * (miniPlotH / miniRes),
						sw: miniCellPxW,
						sh: miniCellPxH,
						vote: classify(c.root, cx, cy)
					});
				}
			}
			return { ...c, miniCells: cells };
		});
	});

	interface ProjectedPoint {
		cx: number;
		cy: number;
		label: 0 | 1;
	}
	const projectedPoints = $derived(
		dataPoints.map((p) => ({ cx: px(p.x), cy: py(p.y), label: p.label }) as ProjectedPoint)
	);

	const xTicks = $derived.by(() => {
		const ticks: { val: number; px: number }[] = [];
		for (let i = 0; i <= 4; i++) {
			const v = domainX[0] + (i / 4) * (domainX[1] - domainX[0]);
			ticks.push({ val: v, px: px(v) });
		}
		return ticks;
	});

	const yTicks = $derived.by(() => {
		const ticks: { val: number; py: number }[] = [];
		for (let i = 0; i <= 4; i++) {
			const v = domainY[0] + (i / 4) * (domainY[1] - domainY[0]);
			ticks.push({ val: v, py: py(v) });
		}
		return ticks;
	});

	const ensembleAccuracy = $derived.by(() => {
		let correct = 0;
		for (const pt of dataPoints) {
			if (ensemblePredict(pt.x, pt.y) === pt.label) correct++;
		}
		return correct / dataPoints.length;
	});

	const bestIndividualAccuracy = $derived(
		classifiers.length ? Math.max(...classifiers.map((c) => c.accuracy)) : 0
	);
	const improvement = $derived(ensembleAccuracy - bestIndividualAccuracy);

	const accuracyCurve = $derived.by(() => {
		const curve: { m: number; acc: number }[] = [];
		for (let mm = 1; mm <= maxNum; mm++) {
			const sub = classifierPool.slice(0, mm);
			let correct = 0;
			for (const pt of dataPoints) {
				if (ensemblePredictWith(sub, pt.x, pt.y) === pt.label) correct++;
			}
			curve.push({ m: mm, acc: correct / dataPoints.length });
		}
		return curve;
	});

	const sparkW = 400;
	const sparkH = 100;
	const sparkPad = { l: 34, r: 10, t: 8, b: 18 };
	function sparkX(mm: number): number {
		return sparkPad.l + ((mm - 1) / (maxNum - 1)) * (sparkW - sparkPad.l - sparkPad.r);
	}
	function sparkY(acc: number): number {
		return sparkPad.t + (1 - acc) * (sparkH - sparkPad.t - sparkPad.b);
	}
	const accuracyPath = $derived(
		accuracyCurve
			.map((p, i) => `${i === 0 ? 'M' : 'L'}${sparkX(p.m).toFixed(1)},${sparkY(p.acc).toFixed(1)}`)
			.join(' ')
	);

	let playing = $state(false);
	let animTimer: ReturnType<typeof setInterval> | null = null;
	function play() {
		if (playing) return;
		if (numClassifiers >= maxNum) numClassifiers = minNum;
		playing = true;
		animTimer = setInterval(() => {
			numClassifiers = Math.min(numClassifiers + 1, maxNum);
			if (numClassifiers >= maxNum) stopAnim();
		}, 300);
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
</script>

<Figure type="chart">
	<div class="ensemble-demo">
		<header class="demo-header">
			<h2>Vote majoritaire — Bagging d'arbres de décision (profondeur 2)</h2>
			<p>
				Chaque arbre CART de profondeur 2 est entraîné sur un échantillon bootstrap des anneaux
				concentriques. Seul, un petit arbre ne peut pas séparer les anneaux. Ensemble, leur vote
				majoritaire reconstruit une frontière non-linéaire nettement plus précise — car chaque arbre
				est instable et le bagging profite pleinement de la diversité.
			</p>
		</header>

		<div class="viz-grid">
			<div class="main-plot">
				<svg
					viewBox={`0 0 ${svgW} ${svgH}`}
					width="100%"
					height={svgH}
					role="img"
					aria-label="Frontière de décision de l'ensemble"
				>
					{#each gridCells as cell}
						<rect
							x={cell.sx}
							y={cell.sy}
							width={cellRenderPxW}
							height={cellRenderPxH}
							fill={cell.vote === 1 ? 'rgba(239,68,68,0.14)' : 'rgba(59,130,246,0.14)'}
						/>
					{/each}

					{#each boundaryEdges as edge}
						<line
							x1={edge.x1}
							y1={edge.y1}
							x2={edge.x2}
							y2={edge.y2}
							stroke="var(--color-text)"
							stroke-width="0.7"
							opacity="0.3"
						/>
					{/each}

					{#each projectedPoints as p}
						<circle
							cx={p.cx}
							cy={p.cy}
							r="4.5"
							fill={p.label === 1 ? 'var(--color-surprise)' : 'var(--color-belief)'}
							opacity="0.85"
						/>
					{/each}

					<line
						x1={padL}
						y1={svgH - padB + 4}
						x2={svgW - padR}
						y2={svgH - padB + 4}
						stroke="var(--color-border)"
						stroke-width="0.5"
					/>
					<line
						x1={padL}
						y1={padT - 4}
						x2={padL}
						y2={svgH - padB + 4}
						stroke="var(--color-border)"
						stroke-width="0.5"
					/>

					{#each xTicks as tick}
						<text x={tick.px} y={svgH - 6} text-anchor="middle" class="axis-label"
							>{tick.val.toFixed(2)}</text
						>
					{/each}

					{#each yTicks as tick}
						<text x={padL - 8} y={tick.py + 4} text-anchor="end" class="axis-label"
							>{tick.val.toFixed(2)}</text
						>
					{/each}

					<text
						x={svgW / 2}
						y={svgH - 2}
						text-anchor="middle"
						font-size="10"
						fill="var(--color-text-muted)">x</text
					>
					<text
						x={12}
						y={svgH / 2}
						text-anchor="middle"
						font-size="10"
						fill="var(--color-text-muted)"
						transform={`rotate(-90, 12, ${svgH / 2})`}>y</text
					>
				</svg>
			</div>

			<div class="side-panel">
				<div class="panel-title">Souches actives (Top 8)</div>
				{#each previewClassifiers as pc (pc.id)}
					<div class="classifier-card">
						<svg viewBox={`0 0 ${miniSvgW} ${miniSvgH}`} width={miniSvgW} height={miniSvgH}>
							{#each pc.miniCells as cell}
								<rect
									x={cell.sx}
									y={cell.sy}
									width={cell.sw}
									height={cell.sh}
									fill={cell.vote === 1 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}
								/>
							{/each}
							{#each dataPoints as pt}
								<circle
									cx={mpx(pt.x)}
									cy={mpy(pt.y)}
									r="1"
									fill={pt.label === 1 ? 'var(--color-surprise)' : 'var(--color-belief)'}
									opacity="0.65"
								/>
							{/each}
						</svg>
						<div class="classif-info">
							<span class="classif-acc">{(pc.accuracy * 100).toFixed(0)}%</span>
							<span class="classif-eq">{pc.equation}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="metrics-row">
			<div class="cell">
				<span class="label">Classifieurs</span>
				<span class="value">{classifiers.length}</span>
			</div>
			<div class="cell style-operator"></div>
			<div class="cell">
				<span class="label">Meilleur Stump</span>
				<span class="value" style:color="var(--color-neutral)"
					>{(bestIndividualAccuracy * 100).toFixed(0)}%</span
				>
			</div>
			<div class="cell style-operator"></div>
			<div class="cell">
				<span class="label">Vote majoritaire</span>
				<span class="value" style:color="var(--color-belief)"
					>{(ensembleAccuracy * 100).toFixed(0)}%</span
				>
			</div>
			<div class="cell style-operator"></div>
			<div class="cell">
				<span class="label">Gain</span>
				<span
					class="value"
					style:color={improvement > 0 ? 'var(--color-belief)' : 'var(--color-surprise)'}
				>
					{improvement >= 0 ? '+' : ''}{(improvement * 100).toFixed(1)}%
				</span>
			</div>
		</div>

		<div class="controls-panel">
			<Slider
				bind:value={numClassifiers}
				min={minNum}
				max={maxNum}
				step={1}
				label="Nombre de classifieurs"
			/>
			<div class="actions-row">
				{#if playing}
					<button class="action-btn" onclick={pause}>⏸ Pause</button>
				{:else}
					<button class="action-btn" onclick={play}>▶ Balayer m automatiquement</button>
				{/if}
				<button class="action-btn" onclick={regenerate}>↻ Régénérer</button>
			</div>
		</div>

		<div class="spark-panel">
			<div class="spark-title">Convergence de l'ensemble (Théorème de Condorcet)</div>
			<svg viewBox={`0 0 ${sparkW} ${sparkH}`} width="100%" height={sparkH} role="img">
				<line
					x1={sparkPad.l}
					y1={sparkH - sparkPad.b}
					x2={sparkW - sparkPad.r}
					y2={sparkH - sparkPad.b}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				<line
					x1={sparkPad.l}
					y1={sparkPad.t}
					x2={sparkPad.l}
					y2={sparkH - sparkPad.b}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				<line
					x1={sparkPad.l}
					y1={sparkY(0.5)}
					x2={sparkW - sparkPad.r}
					y2={sparkY(0.5)}
					stroke="var(--color-surprise)"
					stroke-width="1"
					stroke-dasharray="3 3"
					opacity="0.5"
				/>
				<path d={accuracyPath} fill="none" stroke="var(--color-belief)" stroke-width="2.5" />
				{#if accuracyCurve.length}
					{@const cur = accuracyCurve[Math.min(numClassifiers, maxNum) - 1]}
					{#if cur}
						<circle
							cx={sparkX(cur.m)}
							cy={sparkY(cur.acc)}
							r="4"
							fill="var(--color-belief)"
							stroke="#fff"
							stroke-width="1.5"
						/>
					{/if}
				{/if}
				<text
					x={sparkPad.l - 4}
					y={sparkH - sparkPad.b + 12}
					font-size="9"
					fill="var(--color-text-muted)">m=1</text
				>
				<text
					x={sparkW - sparkPad.r}
					y={sparkH - sparkPad.b + 12}
					text-anchor="end"
					font-size="9"
					fill="var(--color-text-muted)">m={maxNum}</text
				>
			</svg>
		</div>

		<div class="legend">
			<span><span class="swatch-dot swatch-blue"></span> Classe 0</span>
			<span><span class="swatch-dot swatch-red"></span> Classe 1</span>
			<span><span class="swatch-rect swatch-bluish"></span> Zone majoritaire 0</span>
			<span><span class="swatch-rect swatch-reddish"></span> Zone majoritaire 1</span>
		</div>
	</div>
</Figure>

<p class="caption-note">
	<strong>Pédagogie :</strong> Chaque arbre CART a une profondeur maximale de 2 (au plus 3
	feuilles). Contrairement aux souches de décision, ces petits arbres sont suffisamment instables
	pour que chaque bootstrap produise un arbre différent. Leur vote majoritaire crée une frontière
	non-linéaire en escalier qui approxime bien la structure circulaire des anneaux — et la précision
	monte rapidement avec m (théorème du jury de Condorcet, voir Exercice 5.1 du cours).
	<br /><br />
	<strong>Question :</strong> Dans cet exemple particulier, le gain de performance reste limité malgré
	l'ajout de nombreux classifieurs. Pourquoi pensez-vous que l'ajout d'arbres supplémentaires n'améliore
	pas significativement la précision ?
</p>

<style>
	.ensemble-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
		padding: 0.25rem;
	}

	.demo-header {
		text-align: center;
		max-width: 600px;
	}

	.demo-header h2 {
		font-size: 1.1rem;
		margin-bottom: 0.2rem;
		color: var(--color-text);
	}

	.demo-header p {
		font-size: 0.82rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.viz-grid {
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		align-items: flex-start;
		width: 100%;
		max-width: 680px;
	}

	.main-plot svg {
		max-width: 480px;
		width: 100%;
		user-select: none;
	}

	.side-panel {
		width: 100%;
		max-width: 100%;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
		gap: 0.35rem;
		align-content: start;
	}

	.panel-title {
		grid-column: 1 / -1;
	}

	.panel-title {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--color-text-muted);
		margin-bottom: 0.2rem;
		padding-left: 4px;
	}

	.classifier-card {
		display: flex;
		flex-direction: column;
		gap: 1px;
		align-items: center;
		background: var(--color-surface, transparent);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 4px);
		padding: 3px;
	}

	.classifier-card svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.classif-info {
		font-size: 0.62rem;
		font-family: var(--font-mono, monospace);
		color: var(--color-text-muted);
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.classif-acc {
		font-weight: 700;
		font-size: 0.68rem;
		color: var(--color-text);
	}

	.classif-eq {
		opacity: 0.75;
		line-height: 1.3;
	}

	.metrics-row {
		width: 100%;
		max-width: 620px;
		display: flex;
		flex-direction: row;
		padding: 0.8rem 1rem;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
		flex: 1;
		min-width: 80px;
		text-align: center;
		align-items: center;
	}

	.cell.style-operator {
		width: 0.2rem;
		flex: none;
		min-width: auto;
	}

	.label {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: var(--font-mono, monospace);
	}

	.value {
		font-family: var(--font-mono, monospace);
		font-size: 1.08rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 420px;
		padding: 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}

	.actions-row {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.action-btn {
		align-self: center;
		padding: 0.35rem 1rem;
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

	.action-btn:hover {
		background: var(--color-belief);
		color: #fff;
		border-color: var(--color-belief);
	}

	.spark-panel {
		width: 100%;
		max-width: 460px;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
	}
	.spark-title {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		text-align: center;
	}

	.legend {
		display: flex;
		gap: 0.7rem;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		flex-wrap: wrap;
		justify-content: center;
		padding-bottom: 0.25rem;
	}

	.swatch-dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		vertical-align: middle;
		margin-right: 3px;
	}

	.swatch-blue {
		background: var(--color-belief);
	}
	.swatch-red {
		background: var(--color-surprise);
	}

	.swatch-rect {
		display: inline-block;
		width: 12px;
		height: 10px;
		border-radius: 2px;
		vertical-align: middle;
		margin-right: 3px;
	}

	.swatch-bluish {
		background: rgba(59, 130, 246, 0.3);
	}
	.swatch-reddish {
		background: rgba(239, 68, 68, 0.3);
	}

	.axis-label {
		fill: var(--color-text-muted);
		font-size: 9px;
		font-family: var(--font-mono, monospace);
	}

	.caption-note {
		max-width: 100%;
		text-align: center;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		line-height: 1.45;
		padding: 0 0.5rem;
		font-style: italic;
	}

	@media (max-width: 640px) {
		.viz-grid {
			flex-direction: column;
			align-items: center;
		}

		.side-panel {
			width: 100%;
			max-width: 320px;
		}

		.metrics-row {
			flex-direction: column;
			align-items: stretch;
		}

		.cell.style-operator {
			display: none;
		}
	}
</style>
