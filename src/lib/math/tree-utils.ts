/**
 * Tree utilities for 2D visualization of decision stumps and simple trees.
 * Used by DecisionTreeStump and ForestGrowthAnimation demo components.
 *
 * Also hosts the full CART (classification/regression tree) builder used by
 * Part 2, lesson 3: `buildCartTree` / `findBestSplit1D` implement the greedy,
 * recursive, axis-aligned binary partition of the lecture, and the impurity
 * criteria come from `random-forest.ts` (Gini / entropy / misclassification).
 */

import { impurityOf, type ImpurityCriterion } from './random-forest.js';
import { mulberry32, combineSeed } from './util.js';

export interface TreeNode {
	left?: TreeNode;
	right?: TreeNode;
	featureIdx: number;
	threshold: number;
	prediction: number; // leaf prediction value
	isLeaf: boolean;
}

/**
 * Predict for a single data point using a tree. `x` is a feature vector of
 * arbitrary length (was `[number, number]`; widened so `buildCartTree`, which
 * is not restricted to 2 features, can share the same predictor). Existing
 * 2D call sites are unaffected — a `[number, number]` tuple is assignable to
 * `number[]`.
 */
export function predictTree(node: TreeNode, x: number[]): number {
	if (node.isLeaf) return node.prediction;
	if (x[node.featureIdx] <= node.threshold) {
		return node.left ? predictTree(node.left, x) : node.prediction;
	} else {
		return node.right ? predictTree(node.right, x) : node.prediction;
	}
}

/** Build a simple decision stump as a TreeNode */
export function buildTreeNode(
	featureIdx: number,
	threshold: number,
	leftValue: number,
	rightValue: number,
	isLeaf = false
): TreeNode {
	return isLeaf
		? { featureIdx, threshold, prediction: leftValue, isLeaf: true }
		: {
				featureIdx,
				threshold,
				prediction: (leftValue + rightValue) / 2,
				isLeaf: false,
				left: { featureIdx, threshold, prediction: leftValue, isLeaf: true },
				right: { featureIdx, threshold, prediction: rightValue, isLeaf: true }
			};
}

/** Build a simple binary tree of given depth for visualization */
export function buildBalancedTree(depth: number): TreeNode {
	if (depth <= 0) return { featureIdx: 0, threshold: 0, prediction: 0, isLeaf: true };

	return {
		featureIdx: 0,
		threshold: 0,
		prediction: 0,
		isLeaf: false,
		left: buildBalancedTree(depth - 1),
		right: buildBalancedTree(depth - 1)
	};
}

/** Get all leaf nodes and their bounding regions for 2D visualization */
interface LeafRegion {
	node: TreeNode;
	xRange: [number, number];
	yRange: [number, number];
	prediction: number;
}

export function getLeafRegions(
	tree: TreeNode,
	xDomain: [number, number],
	yDomain: [number, number]
): LeafRegion[] {
	const regions: LeafRegion[] = [];

	function traverse(node: TreeNode, xRange: [number, number], yRange: [number, number]): void {
		if (node.isLeaf) {
			regions.push({ node, xRange, yRange, prediction: node.prediction });
			return;
		}

		const feat = node.featureIdx;
		let leftXR: [number, number], rightXR: [number, number];
		let leftYR: [number, number], rightYR: [number, number];

		if (feat === 0) {
			leftXR = [xRange[0], node.threshold];
			rightXR = [node.threshold, xRange[1]];
			leftYR = yRange;
			rightYR = yRange;
		} else {
			leftXR = xRange;
			rightXR = xRange;
			leftYR = [yRange[0], node.threshold];
			rightYR = [node.threshold, yRange[1]];
		}

		if (node.left) traverse(node.left, leftXR, leftYR);
		if (node.right) traverse(node.right, rightXR, rightYR);
	}

	traverse(tree, xDomain, yDomain);
	return regions;
}

/** Convert tree to SVG path data for decision boundary visualization */
export function treeBoundaryPaths(
	tree: TreeNode,
	xDomain: [number, number],
	yDomain: [number, number],
	projectX: (v: number) => number = (v) => v,
	projectY: (v: number) => number = (v) => v
): { d: string; prediction: number }[] {
	const regions = getLeafRegions(tree, xDomain, yDomain);

	return regions.map((r) => ({
		d: `M${projectX(r.xRange[0])},${projectY(r.yRange[0])}h${projectX(r.xRange[1] - r.xRange[0])}v${projectY(r.yRange[1] - r.yRange[0])}Z`,
		prediction: r.prediction
	}));
}

// ─── Full CART tree (Part 2, lesson 3) ─────────────────────────────────

/**
 * A node of a CART classification tree. Extends `TreeNode` (so it can be fed
 * straight into `predictTree` / `getLeafRegions` / `treeBoundaryPaths`) with
 * the fields needed to display the split and the complexity cost
 * {@code C_\lambda(T)} of the lecture.
 */
export interface CartNode extends TreeNode {
	/** Impurity of this node (chosen criterion). */
	impurity: number;
	/** Number of training samples falling in this node. */
	nSamples: number;
	/** Distance from the root (root = 0). */
	depth: number;
	left?: CartNode;
	right?: CartNode;
}

export interface CartOptions {
	criterion: ImpurityCriterion;
	maxDepth: number;
	minSamplesLeaf: number;
}

/**
 * Majority class of binary 0/1 labels: `Math.round(mean)`. On a perfect 50/50
 * tie this rounds to 1 — an arbitrary, deterministic tie-break (matches the
 * `buildDecisionStump` mean-then-round convention).
 */
function majorityClass(y: number[]): number {
	if (y.length === 0) return 0;
	const mean = y.reduce((s, l) => s + l, 0) / y.length;
	return Math.round(mean);
}

/**
 * Best axis-aligned split of a single feature, minimising the weighted
 * impurity of the two children (subject to `minSamplesLeaf` on each side).
 * Candidate thresholds are the midpoints between consecutive distinct values
 * of `values`. Returns `null` when no valid split exists (fewer than two
 * distinct values, or `minSamplesLeaf` rules every split out — including the
 * two-point edge case with `minSamplesLeaf > 1`).
 */
export function findBestSplit1D(
	values: number[],
	y: number[],
	criterion: ImpurityCriterion,
	minSamplesLeaf: number
): { threshold: number; impurityDecrease: number } | null {
	if (values.length !== y.length)
		throw new Error('findBestSplit1D: values and y must have the same length');
	const n = y.length;
	const unique = [...new Set(values)].sort((a, b) => a - b);
	if (unique.length < 2) return null;

	const parentImp = impurityOf(y, criterion);
	let best: { threshold: number; impurityDecrease: number } | null = null;

	for (let t = 0; t < unique.length - 1; t++) {
		const threshold = (unique[t] + unique[t + 1]) / 2;
		const left: number[] = [];
		const right: number[] = [];
		for (let i = 0; i < n; i++) (values[i] <= threshold ? left : right).push(y[i]);
		if (left.length < minSamplesLeaf || right.length < minSamplesLeaf) continue;

		const weightedChild =
			(left.length * impurityOf(left, criterion) +
				right.length * impurityOf(right, criterion)) /
			n;
		const decrease = parentImp - weightedChild;
		if (best === null || decrease > best.impurityDecrease)
			best = { threshold, impurityDecrease: decrease };
	}
	return best;
}

/**
 * Greedy, recursive, axis-aligned binary CART classifier (Part 2, lesson 3).
 * Splits on the single feature/threshold that maximises the impurity decrease
 * (over every feature), and stops when `maxDepth` is reached, the node is
 * pure, or no valid split exists. Leaf prediction is the majority class.
 */
export function buildCartTree(
	X: number[][],
	y: number[],
	opts: CartOptions,
	depth = 0
): CartNode {
	const n = y.length;
	const impurity = impurityOf(y, opts.criterion);
	const node: CartNode = {
		featureIdx: 0,
		threshold: 0,
		prediction: majorityClass(y),
		isLeaf: true,
		impurity,
		nSamples: n,
		depth
	};

	if (n === 0 || depth >= opts.maxDepth || impurity === 0) return node;

	const d = X[0]?.length ?? 0;
	let best: { featureIdx: number; threshold: number; decrease: number } | null = null;
	for (let j = 0; j < d; j++) {
		const col = X.map((r) => r[j]);
		const split = findBestSplit1D(col, y, opts.criterion, opts.minSamplesLeaf);
		if (split !== null && (best === null || split.impurityDecrease > best.decrease + 1e-15)) {
			best = { featureIdx: j, threshold: split.threshold, decrease: split.impurityDecrease };
		}
	}
	if (best === null) return node;

	const li: number[] = [];
	const ri: number[] = [];
	for (let i = 0; i < n; i++) (X[i][best.featureIdx] <= best.threshold ? li : ri).push(i);

	node.isLeaf = false;
	node.featureIdx = best.featureIdx;
	node.threshold = best.threshold;
	node.left = buildCartTree(li.map((i) => X[i]), li.map((i) => y[i]), opts, depth + 1);
	node.right = buildCartTree(ri.map((i) => X[i]), ri.map((i) => y[i]), opts, depth + 1);
	return node;
}

/** Number of leaves in a tree. */
export function countLeaves(node: TreeNode): number {
	if (node.isLeaf) return 1;
	let c = 0;
	if (node.left) c += countLeaves(node.left);
	if (node.right) c += countLeaves(node.right);
	return c;
}

/**
 * Depth of a tree: a single leaf has depth 0; a node with leaf children has
 * depth 1 (i.e. the number of internal nodes on the longest root-to-leaf
 * path). `buildBalancedTree(k)` therefore has depth k and 2^k leaves.
 */
export function treeDepth(node: TreeNode): number {
	if (node.isLeaf) return 0;
	const l = node.left ? treeDepth(node.left) : 0;
	const r = node.right ? treeDepth(node.right) : 0;
	return 1 + Math.max(l, r);
}

/** Classification accuracy of a tree on `(X, y)` (labels expected binary 0/1). */
export function accuracyOf(node: TreeNode, X: number[][], y: number[]): number {
	const n = y.length;
	if (n === 0) return 0;
	let correct = 0;
	for (let i = 0; i < n; i++) {
		if (Math.round(predictTree(node, X[i])) === y[i]) correct++;
	}
	return correct / n;
}

/**
 * Complexity cost {@code C_\lambda(T) = \sum_l n_l\,\mathcal I(R_l) + \lambda|T|}
 * of Part 2, lesson 3 (élagage). Requires a `CartNode` (for the per-leaf
 * `nSamples` and `impurity`).
 */
export function costComplexity(node: CartNode, lambda: number): number {
	let impuritySum = 0;
	const walk = (n: CartNode): void => {
		if (n.isLeaf) {
			impuritySum += n.nSamples * n.impurity;
			return;
		}
		if (n.left) walk(n.left);
		if (n.right) walk(n.right);
	};
	walk(node);
	return impuritySum + lambda * countLeaves(node);
}

/**
 * Deterministic shuffled train/test split. Indices are permuted with a seeded
 * PRNG (`mulberry32` + `combineSeed`) before being cut, so the same `seed`
 * always yields the same split.
 */
export function trainTestSplit(
	X: number[][],
	y: number[],
	testFraction: number,
	seed: number
): { XTrain: number[][]; yTrain: number[]; XTest: number[][]; yTest: number[] } {
	if (!(testFraction > 0 && testFraction < 1))
		throw new Error('trainTestSplit: testFraction must be in (0, 1)');
	if (X.length !== y.length)
		throw new Error('trainTestSplit: X and y must have the same length');

	const n = X.length;
	const rng = mulberry32(combineSeed(seed, 7));
	const idx = Array.from({ length: n }, (_, i) => i);
	for (let i = n - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[idx[i], idx[j]] = [idx[j], idx[i]];
	}

	const nTest = Math.round(n * testFraction);
	const testIdx = idx.slice(0, nTest);
	const trainIdx = idx.slice(nTest);
	return {
		XTrain: trainIdx.map((i) => X[i]),
		yTrain: trainIdx.map((i) => y[i]),
		XTest: testIdx.map((i) => X[i]),
		yTest: testIdx.map((i) => y[i])
	};
}

/**
 * 2D, two-class, non-linearly-separable (2×2 checkerboard) demo dataset for
 * Part 2, lesson 3. Class 1 when `sign(x1) === sign(x2)` (quadrants 1 and 3),
 * class 0 otherwise. Each point is drawn from a Gaussian blob centred in one
 * of the four quadrants; with probability `noiseRate` its label is then
 * flipped (irreducible label noise, so a deep tree can visibly
 * overfit). Deterministic in `seed`.
 */
export function generateTreeDemoDataset(
	seed = 0,
	noiseRate = 0.05,
	n = 80
): { X: number[][]; y: number[] } {
	if (!(noiseRate >= 0 && noiseRate < 1))
		throw new Error('generateTreeDemoDataset: noiseRate must be in [0, 1)');
	if (n <= 0 || n % 4 !== 0)
		throw new Error('generateTreeDemoDataset: n must be a positive multiple of 4');

	const rng = mulberry32(combineSeed(seed, 4242));
	const randn = (): number => {
		let u = rng();
		while (u === 0) u = rng();
		const v = rng();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	};

	// Quadrant centres, well clear of the coordinate axes so the CART splits
	// land near x1=0 / x2=0.
	const centers: [number, number][] = [
		[1.2, 1.2],
		[1.2, -1.2],
		[-1.2, -1.2],
		[-1.2, 1.2]
	];
	const spread = 0.4;
	const perQuad = n / 4;

	const X: number[][] = [];
	for (const [cx, cy] of centers) {
		for (let k = 0; k < perQuad; k++) {
			X.push([cx + spread * randn(), cy + spread * randn()]);
		}
	}
	// The label is the true checkerboard target evaluated at the FINAL
	// coordinates, `1` iff `x1·x2 > 0` (i.e. `sign(x1) === sign(x2)`). This
	// makes the noiseless pattern an exact, testable invariant and is exactly
	// the function a depth-2 tree (x1 ≤ 0, then x2 ≤ 0) recovers.
	const y: number[] = X.map(([x1, x2]) => (x1 * x2 > 0 ? 1 : 0));
	for (let i = 0; i < n; i++) {
		if (rng() < noiseRate) y[i] = 1 - y[i];
	}
	return { X, y };
}

/**
 * 2D, two-class dataset with two Gaussian blobs separated along the x₁ axis
 * (and overlapping along x₂), noiseless. A single axis-aligned split on x₁
 * strongly reduces the impurity of any of the three criteria, while a split on
 * x₂ barely helps — the pedagogical contrast the impurity-explorer demo needs
 * (unlike the 2×2 checkerboard of `generateTreeDemoDataset`, which requires
 * depth ≥ 2 and is therefore the wrong shape for a one-split demo).
 */
export function generateTwoBlobsDataset(seed = 0, n = 80): { X: number[][]; y: number[] } {
	if (n <= 0 || n % 2 !== 0)
		throw new Error('generateTwoBlobsDataset: n must be a positive even integer');
	const rng = mulberry32(combineSeed(seed, 777));
	const randn = (): number => {
		let u = rng();
		while (u === 0) u = rng();
		const v = rng();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	};

	const per = n / 2;
	const X: number[][] = [];
	const y: number[] = [];
	for (let i = 0; i < per; i++) {
		X.push([-1 + 0.5 * randn(), 0.8 * randn()]);
		y.push(0);
	}
	for (let i = 0; i < per; i++) {
		X.push([1 + 0.5 * randn(), 0.8 * randn()]);
		y.push(1);
	}
	// Shuffle rows so the class is not trivially recoverable from row order.
	for (let i = X.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[X[i], X[j]] = [X[j], X[i]];
		[y[i], y[j]] = [y[j], y[i]];
	}
	return { X, y };
}
