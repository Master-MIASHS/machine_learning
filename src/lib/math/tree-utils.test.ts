import { describe, it, expect } from 'vitest';
import {
	buildBalancedTree,
	buildCartTree,
	buildTreeNode,
	countLeaves,
	costComplexity,
	accuracyOf,
	findBestSplit1D,
	generateTreeDemoDataset,
	generateTwoBlobsDataset,
	getLeafRegions,
	predictTree,
	trainTestSplit,
	treeBoundaryPaths,
	treeDepth,
	type CartNode
} from '../math/tree-utils.js';

// Note: CART / decision trees are not part of theorie.typ; this module
// supports Part 2, lesson 3 (Arbres de décision — CART).

// ─── Small manual-tree helpers ────────────────────────────────────────
function makeLeaf(prediction: number): CartNode {
	return {
		featureIdx: 0,
		threshold: 0,
		prediction,
		isLeaf: true,
		impurity: 0,
		nSamples: 1,
		depth: 0
	};
}
function makeSplit(featureIdx: number, threshold: number, left: CartNode, right: CartNode): CartNode {
	return {
		featureIdx,
		threshold,
		prediction: Math.round((left.prediction + right.prediction) / 2),
		isLeaf: false,
		impurity: 0.5,
		nSamples: 4,
		depth: 0,
		left,
		right
	};
}

describe('predictTree / buildTreeNode / buildBalancedTree (existing)', () => {
	it('buildTreeNode produces a stump that routes by threshold', () => {
		const stump = buildTreeNode(0, 0.5, 0, 1); // split on feature 0 at 0.5
		expect(predictTree(stump, [0.3, 0])).toBe(0);
		expect(predictTree(stump, [0.7, 0])).toBe(1);
	});

	it('predictTree generalises to feature vectors of length > 2', () => {
		const stump = buildTreeNode(2, 1.0, 0, 1); // split on the 3rd feature
		expect(predictTree(stump, [9, 9, 0.5])).toBe(0);
		expect(predictTree(stump, [9, 9, 1.5])).toBe(1);
	});

	it('buildBalancedTree(k) has depth k and 2^k leaves', () => {
		for (const k of [1, 2, 3]) {
			const t = buildBalancedTree(k);
			expect(treeDepth(t)).toBe(k);
			expect(countLeaves(t)).toBe(2 ** k);
		}
	});
});

describe('getLeafRegions / treeBoundaryPaths (existing)', () => {
	it('a 2-leaf tree yields two regions that partition the x-domain', () => {
		const t = makeSplit(0, 0.5, makeLeaf(0), makeLeaf(1));
		const regions = getLeafRegions(t, [0, 1], [0, 1]);
		expect(regions).toHaveLength(2);
		const xs = regions.map((r) => r.xRange).sort((a, b) => a[0] - b[0]);
		expect(xs[0]).toEqual([0, 0.5]);
		expect(xs[1]).toEqual([0.5, 1]);
		// Total area of the partition equals the domain area (no overlap/gap).
		const totalArea = regions.reduce(
			(s, r) => s + (r.xRange[1] - r.xRange[0]) * (r.yRange[1] - r.yRange[0]),
			0
		);
		expect(totalArea).toBeCloseTo(1, 12);
	});

	it('treeBoundaryPaths emits one path per region with matching predictions', () => {
		const t = makeSplit(0, 0.5, makeLeaf(0), makeLeaf(1));
		const paths = treeBoundaryPaths(t, [0, 1], [0, 1]);
		expect(paths).toHaveLength(2);
		expect(paths.map((p) => p.prediction).sort()).toEqual([0, 1]);
		for (const p of paths) expect(p.d).toMatch(/^M/);
	});
});

describe('findBestSplit1D', () => {
	it('finds the unique zero-cost split on separable 1D data (closed form)', () => {
		const res = findBestSplit1D([0, 0, 1, 1], [0, 0, 1, 1], 'gini', 1);
		expect(res).not.toBeNull();
		expect(res!.threshold).toBeCloseTo(0.5, 12);
		// parent Gini([0,0,1,1]) = 0.5, children pure → decrease = 0.5.
		expect(res!.impurityDecrease).toBeCloseTo(0.5, 12);
	});

	it('returns null when all values are identical', () => {
		expect(findBestSplit1D([1, 1, 1], [0, 1, 1], 'gini', 1)).toBeNull();
	});

	it('returns null when minSamplesLeaf rules every candidate out', () => {
		// 2 points, 2 unique values: the only candidate gives 1/1, invalid at msl=2.
		expect(findBestSplit1D([0, 1], [0, 1], 'gini', 2)).toBeNull();
	});

	it('splits a two-point edge case when minSamplesLeaf=1', () => {
		const res = findBestSplit1D([0, 1], [0, 1], 'gini', 1);
		expect(res).not.toBeNull();
		expect(res!.threshold).toBeCloseTo(0.5, 12);
	});

	it('throws on length mismatch', () => {
		expect(() => findBestSplit1D([0, 1], [0], 'gini', 1)).toThrow();
	});
});

describe('buildCartTree', () => {
	it('training accuracy is monotone non-decreasing in maxDepth (greedy)', () => {
		const { X, y } = generateTreeDemoDataset(1, 0);
		const accs: number[] = [];
		for (let d = 1; d <= 6; d++) {
			const tree = buildCartTree(X, y, { criterion: 'gini', maxDepth: d, minSamplesLeaf: 1 });
			accs.push(accuracyOf(tree, X, y));
		}
		for (let i = 1; i < accs.length; i++)
			expect(accs[i]).toBeGreaterThanOrEqual(accs[i - 1] - 1e-12);
	});

	it('reaches 100% training accuracy on a noiseless dataset given enough depth', () => {
		const { X, y } = generateTreeDemoDataset(2, 0);
		const tree = buildCartTree(X, y, { criterion: 'gini', maxDepth: 6, minSamplesLeaf: 1 });
		expect(accuracyOf(tree, X, y)).toBeCloseTo(1, 12);
	});

	it('produces a single leaf for a pure node regardless of maxDepth', () => {
		const X = [
			[0, 0],
			[1, 1],
			[2, 2]
		];
		const y = [0, 0, 0];
		for (const d of [1, 4, 10]) {
			const tree = buildCartTree(X, y, { criterion: 'gini', maxDepth: d, minSamplesLeaf: 1 });
			expect(countLeaves(tree)).toBe(1);
		}
	});

	it('splits on a single axis-aligned feature (frontière orthogonale aux axes)', () => {
		const { X, y } = generateTreeDemoDataset(3, 0);
		const tree = buildCartTree(X, y, { criterion: 'gini', maxDepth: 2, minSamplesLeaf: 1 });
		// Every internal node tests one feature (index 0 or 1); the root has
		// exactly two children.
		const walk = (n: CartNode): void => {
			if (!n.isLeaf) {
				expect(n.featureIdx).toBeGreaterThanOrEqual(0);
				expect(n.featureIdx).toBeLessThan(X[0].length);
				expect(n.left).toBeDefined();
				expect(n.right).toBeDefined();
				walk(n.left!);
				walk(n.right!);
			}
		};
		walk(tree);
	});
});

describe('countLeaves / treeDepth', () => {
	it('a single leaf has 1 leaf and depth 0', () => {
		const leaf = makeLeaf(1);
		expect(countLeaves(leaf)).toBe(1);
		expect(treeDepth(leaf)).toBe(0);
	});

	it('a balanced 3-level tree has 8 leaves and depth 3', () => {
		const t = buildBalancedTree(3);
		expect(countLeaves(t)).toBe(8);
		expect(treeDepth(t)).toBe(3);
	});
});

describe('costComplexity', () => {
	it('matches the hand-computed C_λ on a known 2-leaf tree (closed form)', () => {
		// Two pure leaves, nSamples 2 each, impurity 0 → impurity sum 0.
		const pure = makeSplit(0, 0.5, makeLeaf(0), makeLeaf(1));
		expect(costComplexity(pure, 0)).toBeCloseTo(0, 12);
		expect(costComplexity(pure, 1)).toBeCloseTo(2, 12); // λ·|T| = 1·2

		// Impure leaves: 2×(2·0.25) = 1.0 impurity sum, |T| = 2.
		const impureLeft = { ...makeLeaf(0), impurity: 0.25, nSamples: 2 };
		const impureRight = { ...makeLeaf(1), impurity: 0.25, nSamples: 2 };
		const impure = makeSplit(0, 0.5, impureLeft, impureRight);
		expect(costComplexity(impure, 0)).toBeCloseTo(1.0, 12);
		expect(costComplexity(impure, 0.5)).toBeCloseTo(2.0, 12);
		expect(costComplexity(impure, 1)).toBeCloseTo(3.0, 12);
	});

	it('is non-decreasing in λ for a fixed tree', () => {
		const { X, y } = generateTreeDemoDataset(4, 0.1);
		const tree = buildCartTree(X, y, { criterion: 'gini', maxDepth: 3, minSamplesLeaf: 1 });
		expect(costComplexity(tree, 2)).toBeGreaterThanOrEqual(costComplexity(tree, 1) - 1e-12);
		expect(costComplexity(tree, 1)).toBeGreaterThanOrEqual(costComplexity(tree, 0) - 1e-12);
	});

	it('the impurity-only term (λ=0) never exceeds the parent Gini mass', () => {
		const { X, y } = generateTreeDemoDataset(5, 0.2);
		const tree = buildCartTree(X, y, { criterion: 'gini', maxDepth: 4, minSamplesLeaf: 1 });
		// Σ n_l·Gini(R_l) ≤ Σ n_l·Gini(R_l) + parent contribution; in particular
		// the λ=0 cost is bounded by the total mass times max impurity (≤ ½·n).
		expect(costComplexity(tree, 0)).toBeLessThanOrEqual(0.5 * y.length + 1e-9);
	});
});

describe('trainTestSplit', () => {
	const X = Array.from({ length: 10 }, (_, i) => [i, i]);
	const y = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 0 : 1));

	it('respects the requested test fraction (to rounding)', () => {
		const s = trainTestSplit(X, y, 0.3, 42);
		expect(s.XTest.length).toBe(3);
		expect(s.XTrain.length).toBe(7);
	});

	it('is deterministic for a fixed seed', () => {
		const a = trainTestSplit(X, y, 0.4, 7);
		const b = trainTestSplit(X, y, 0.4, 7);
		expect(a.XTest).toEqual(b.XTest);
		expect(a.XTrain).toEqual(b.XTrain);
	});

	it('preserves the full data (train ∪ test = original multiset)', () => {
		const s = trainTestSplit(X, y, 0.35, 3);
		const all = [...s.yTrain, ...s.yTest].sort();
		expect(all).toEqual([...y].sort());
	});

	it('throws on invalid testFraction or length mismatch', () => {
		expect(() => trainTestSplit(X, y, 0, 1)).toThrow();
		expect(() => trainTestSplit(X, y, 1, 1)).toThrow();
		expect(() => trainTestSplit(X, y, 1.5, 1)).toThrow();
		expect(() => trainTestSplit(X, y.slice(0, 9), 0.3, 1)).toThrow();
	});
});

describe('generateTreeDemoDataset', () => {
	it('is exactly balanced 50/50 when noiseless', () => {
		const { y } = generateTreeDemoDataset(11, 0);
		const ones = y.filter((v) => v === 1).length;
		expect(ones).toBeCloseTo(y.length / 2, 0);
		// Loose balance bound (Gaussian blobs are symmetric, not exact).
		expect(ones / y.length).toBeGreaterThan(0.35);
		expect(ones / y.length).toBeLessThan(0.65);
	});

	it('the noiseless label is exactly the checkerboard target sign(x1)==sign(x2)', () => {
		const { X, y } = generateTreeDemoDataset(12, 0);
		for (let i = 0; i < X.length; i++) {
			const expected = X[i][0] * X[i][1] > 0 ? 1 : 0;
			expect(y[i]).toBe(expected);
		}
	});

	it('label noise increases the fraction of points off the true target', () => {
		const clean = generateTreeDemoDataset(13, 0);
		const noisy = generateTreeDemoDataset(13, 0.2);
		const off = ({ X, y }: { X: number[][]; y: number[] }) =>
			y.filter((v, i) => v !== (X[i][0] * X[i][1] > 0 ? 1 : 0)).length;
		expect(off(clean)).toBe(0);
		expect(off(noisy)).toBeGreaterThan(off(clean));
	});

	it('is deterministic in the seed and throws on invalid noiseRate/n', () => {
		const a = generateTreeDemoDataset(21);
		const b = generateTreeDemoDataset(21);
		expect(a).toEqual(b);
		expect(() => generateTreeDemoDataset(0, -0.1)).toThrow();
		expect(() => generateTreeDemoDataset(0, 1)).toThrow();
		expect(() => generateTreeDemoDataset(0, 0.05, 10)).toThrow(); // not a multiple of 4
	});
});

describe('generateTwoBlobsDataset', () => {
	it('is balanced 50/50', () => {
		const { y } = generateTwoBlobsDataset(5, 80);
		const ones = y.filter((v) => v === 1).length;
		expect(ones).toBe(y.length / 2);
	});

	it('x₁ is informative (class means well separated), x₂ is not (both centred on 0)', () => {
		const { X, y } = generateTwoBlobsDataset(6, 80);
		const per = y.filter((v) => v === 0).length;
		const mean = (c: number, axis: number) =>
			X.filter((_, i) => y[i] === c).reduce((s, r) => s + r[axis], 0) / per;
		// x₁ means are ~-1 and ~+1 → separation ≈ 2; x₂ means both ≈ 0.
		const sepX1 = Math.abs(mean(0, 0) - mean(1, 0));
		const sepX2 = Math.abs(mean(0, 1) - mean(1, 1));
		expect(sepX1).toBeGreaterThan(sepX2 + 1);
		expect(sepX1).toBeGreaterThan(1.5);
	});

	it('is deterministic in the seed and throws on invalid n', () => {
		expect(generateTwoBlobsDataset(9)).toEqual(generateTwoBlobsDataset(9));
		expect(() => generateTwoBlobsDataset(0, 7)).toThrow();
		expect(() => generateTwoBlobsDataset(0, 0)).toThrow();
	});
});
