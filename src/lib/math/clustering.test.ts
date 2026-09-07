import { describe, expect, it } from 'vitest';
import {
	assignToNearestCenter,
	bellNumber,
	chebyshev,
	cutByThreshold,
	cutPartition,
	daviesBouldin,
	dendrogramLayout,
	elbowK,
	empiricalCovariance,
	euclidean,
	generateBlobs,
	generateBlobsWithOutliers,
	generateConcentricRings,
	hierarchicalAgglomerative,
	homogeneity,
	inertiaIntra,
	inertiaInter,
	inertiaTotal,
	invertMatrix,
	kmeansLloyd,
	kmeansPPInit,
	mahalanobis,
	mahalanobisUnitBall,
	manhattan,
	minkowski,
	minkowskiUnitBall,
	separability,
	silhouette
} from './clustering';

// ── Distances ──────────────────────────────────────────────────────────────

describe('distances (frame « Distances — variables quantitatives »)', () => {
	const x = [0, 0];
	const y = [3, 4];

	it('euclidean: 3-4-5 triangle', () => {
		expect(euclidean(x, y)).toBeCloseTo(5, 12);
	});

	it('manhattan and chebyshev exact values', () => {
		expect(manhattan(x, y)).toBe(7);
		expect(chebyshev(x, y)).toBe(4);
	});

	it('minkowski recovers L1 and L2 and converges to Chebyshev', () => {
		expect(minkowski(x, y, 1)).toBeCloseTo(7, 12);
		expect(minkowski(x, y, 2)).toBeCloseTo(5, 12);
		// p = 4: (3⁴ + 4⁴)^(1/4) = 337^(1/4)
		expect(minkowski(x, y, 4)).toBeCloseTo(337 ** 0.25, 12);
		expect(minkowski(x, y, Infinity)).toBeCloseTo(4, 12);
	});

	it('minkowski rejects p < 1', () => {
		expect(() => minkowski(x, y, 0.5)).toThrow();
	});

	it('rejects mismatched dimensions', () => {
		expect(() => euclidean([0, 0], [0])).toThrow();
	});

	it('mahalanobis with Σ = I equals the euclidean distance', () => {
		expect(mahalanobis(x, y, [[1, 0], [0, 1]])).toBeCloseTo(5, 12);
	});

	it('mahalanobis anisotropic 2-D case (Σ = diag(4, 1))', () => {
		// (x−y)ᵀ Σ⁻¹ (x−y) = (2)²/4 + (1)²/1 = 2
		expect(mahalanobis([0, 0], [2, 1], [[4, 0], [0, 1]])).toBeCloseTo(Math.SQRT2, 12);
	});

	it('mahalanobis rejects a wrong-size Sigma', () => {
		expect(() => mahalanobis([0, 0, 0], [1, 1, 1], [[1, 0], [0, 1]])).toThrow();
	});
});

describe('invertMatrix and empiricalCovariance', () => {
	it('inverts a known 2×2 matrix', () => {
		const inv = invertMatrix([[4, 7], [2, 6]]);
		// det = 10; inverse = (1/10)·[[6, −7], [−2, 4]]
		expect(inv[0][0]).toBeCloseTo(0.6, 12);
		expect(inv[0][1]).toBeCloseTo(-0.7, 12);
		expect(inv[1][0]).toBeCloseTo(-0.2, 12);
		expect(inv[1][1]).toBeCloseTo(0.4, 12);
	});

	it('inverts a 3×3 matrix (M·M⁻¹ = I)', () => {
		const M = [[2, 0, 1], [1, 3, 0], [0, 2, 5]];
		const inv = invertMatrix(M);
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				let s = 0;
				for (let k = 0; k < 3; k++) s += M[i][k] * inv[k][j];
				expect(s).toBeCloseTo(i === j ? 1 : 0, 12);
			}
		}
	});

	it('rejects singular and non-square matrices', () => {
		expect(() => invertMatrix([[1, 2], [2, 4]])).toThrow();
		expect(() => invertMatrix([[1, 2, 3]])).toThrow();
	});

	it('empiricalCovariance on a known cloud', () => {
		const pts = [
			[0, 0],
			[2, 0],
			[0, 1],
			[2, 1]
		];
		const C = empiricalCovariance(pts as number[][]);
		// mean = (1, 0.5); sample variances (n−1): var(x) = 4/3, var(y) = 1/3, cov = 0
		expect(C[0][0]).toBeCloseTo(4 / 3, 12);
		expect(C[1][1]).toBeCloseTo(1 / 3, 12);
		expect(C[0][1]).toBeCloseTo(0, 12);
	});
});

describe('unit balls (distance landscape demo)', () => {
	it('L2 unit ball is the circle of radius 1', () => {
		for (const { r } of minkowskiUnitBall(2, 64)) expect(r).toBeCloseTo(1, 12);
	});

	it('L1 unit ball passes through (0.5, 0.5): r(π/4) = 1/√2', () => {
		const ball = minkowskiUnitBall(1, 8);
		const at45 = ball.find((p) => Math.abs(p.theta - Math.PI / 4) < 1e-12)!;
		expect(at45.r).toBeCloseTo(Math.SQRT1_2, 12);
	});

	it('L∞ unit ball is the square: r(0) = 1, r(π/4) = √2', () => {
		const ball = minkowskiUnitBall(Infinity, 8);
		const at0 = ball.find((p) => p.theta === 0)!;
		const at45 = ball.find((p) => Math.abs(p.theta - Math.PI / 4) < 1e-12)!;
		expect(at0.r).toBeCloseTo(1, 12);
		expect(at45.r).toBeCloseTo(Math.SQRT2, 12);
	});

	it('mahalanobis unit ball is the circle for Σ = I and the axis-aligned ellipse for diag(4, 1)', () => {
		for (const { r } of mahalanobisUnitBall([[1, 0], [0, 1]], 32)) expect(r).toBeCloseTo(1, 12);
		const ball = mahalanobisUnitBall([[4, 0], [0, 1]], 4);
		expect(ball.find((p) => p.theta === 0)!.r).toBeCloseTo(2, 12);
		expect(ball.find((p) => Math.abs(p.theta - Math.PI / 2) < 1e-12)!.r).toBeCloseTo(1, 12);
	});
});

// ── Data generators ────────────────────────────────────────────────────────

describe('generateBlobs', () => {
	it('is deterministic and has the right size', () => {
		const a = generateBlobs(3, 10, 42);
		const b = generateBlobs(3, 10, 42);
		expect(a).toEqual(b);
		expect(a).toHaveLength(30);
	});

	it('keeps points close to one of the k centers on a circle of radius 4', () => {
		const pts = generateBlobs(3, 20, 7);
		const centers = [0, 1, 2].map((j) => [4 * Math.cos((2 * Math.PI * j) / 3), 4 * Math.sin((2 * Math.PI * j) / 3)]);
		for (const p of pts) {
			const nearest = Math.min(...centers.map((c) => euclidean(p, c)));
			expect(nearest).toBeLessThan(4); // ≈ 4σ with spread 0.7
		}
	});

	it('rejects invalid parameters', () => {
		expect(() => generateBlobs(0, 5, 1)).toThrow();
		expect(() => generateBlobs(2, 0, 1)).toThrow();
		expect(() => generateBlobs(2, 5, 1, 0)).toThrow();
	});
});

describe('generateConcentricRings', () => {
	it('splits the points between radii ≈ 1.5 and ≈ 3.5', () => {
		const pts = generateConcentricRings(15, 3);
		expect(pts).toHaveLength(30);
		const radii = pts.map((p) => Math.hypot(p[0], p[1]));
		expect(radii.filter((r) => r < 2.5)).toHaveLength(15);
		expect(radii.filter((r) => r > 2.5)).toHaveLength(15);
	});
});

describe('generateBlobsWithOutliers', () => {
	it('places outliers far from the origin and reports their indices', () => {
		const { points, outlierIndices } = generateBlobsWithOutliers(3, 10, 3, 5);
		expect(points).toHaveLength(33);
		expect(outlierIndices).toHaveLength(3);
		for (const idx of outlierIndices) {
			expect(Math.hypot(points[idx][0], points[idx][1])).toBeGreaterThanOrEqual(10);
		}
	});
});

// ── Inertias ───────────────────────────────────────────────────────────────

describe('inertias (frame « Inertie intra et inter classes »)', () => {
	const square: number[][] = [
		[0, 0],
		[1, 0],
		[0, 1],
		[1, 1]
	];
	const labels = [0, 0, 1, 1];

	it('exact values on the unit square: I = 2 = I_W + I_B = 1 + 1', () => {
		expect(inertiaTotal(square)).toBeCloseTo(2, 12);
		expect(inertiaIntra(square, labels)).toBeCloseTo(1, 12);
		expect(inertiaInter(square, labels)).toBeCloseTo(1, 12);
	});

	it('K = 1: I_B = 0 and I_W = I; K = n: I_W = 0 and I_B = I', () => {
		const one = [0, 0, 0, 0];
		expect(inertiaInter(square, one)).toBeCloseTo(0, 12);
		expect(inertiaIntra(square, one)).toBeCloseTo(inertiaTotal(square), 12);
		const singletons = [0, 1, 2, 3];
		expect(inertiaIntra(square, singletons)).toBeCloseTo(0, 12);
		expect(inertiaInter(square, singletons)).toBeCloseTo(inertiaTotal(square), 12);
	});

	it('satisfies I = I_W + I_B (TP 6, exercice A) on random data', () => {
		for (const seed of [1, 11, 99]) {
			const pts = generateBlobs(3, 15, seed);
			for (const k of [1, 2, 3, 5]) {
				const labels = cutPartition(hierarchicalAgglomerative(pts, 'ward'), k);
				const total = inertiaTotal(pts);
				const intra = inertiaIntra(pts, labels);
				const inter = inertiaInter(pts, labels);
				expect(intra + inter).toBeCloseTo(total, 9);
			}
		}
	});
});

// ── Quality criteria ───────────────────────────────────────────────────────

describe('homogeneity (frame « Homogénéité »)', () => {
	it('exact values on the unit square partition', () => {
		const { T, TGlobal } = homogeneity(
			[
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1]
			],
			[0, 0, 1, 1]
		);
		expect(T[0]).toBeCloseTo(0.5, 12);
		expect(T[1]).toBeCloseTo(0.5, 12);
		expect(TGlobal).toBeCloseTo(0.5, 12);
	});

	it('singleton clusters have T_k = 0', () => {
		const pts = [
			[0, 0],
			[3, 4]
		];
		const { T } = homogeneity(pts, [0, 1]);
		expect(T[0]).toBe(0);
		expect(T[1]).toBe(0);
	});
});

describe('separability (frame « Séparabilité »)', () => {
	it('exact values on the unit square partition: S = 1', () => {
		const { pairwise, SGlobal } = separability(
			[
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1]
			],
			[0, 0, 1, 1]
		);
		expect(pairwise[0][1]).toBeCloseTo(1, 12);
		expect(SGlobal).toBeCloseTo(1, 12);
	});

	it('rejects K = 1 and empty clusters', () => {
		const pts = [
			[0, 0],
			[1, 0]
		];
		expect(() => separability(pts, [0, 0])).toThrow();
		expect(() => separability(pts, [0, 1, 2])).toThrow();
	});
});

describe('daviesBouldin (frame « Indice de Davies-Bouldin »)', () => {
	it('exact values on the unit square partition: D_0 = D_1 = 1', () => {
		const { D, DGlobal } = daviesBouldin(
			[
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1]
			],
			[0, 0, 1, 1]
		);
		expect(D[0]).toBeCloseTo(1, 12);
		expect(D[1]).toBeCloseTo(1, 12);
		expect(DGlobal).toBeCloseTo(1, 12);
	});

	it('is small for well-separated blobs (the lower, the better)', () => {
		const pts = generateBlobs(3, 20, 42);
		const { DGlobal } = daviesBouldin(pts, cutPartition(hierarchicalAgglomerative(pts, 'ward'), 3));
		expect(DGlobal).toBeLessThan(1);
	});

	it('rejects K = 1', () => {
		expect(() => daviesBouldin([[0, 0], [1, 1]], [0, 0])).toThrow();
	});
});

describe('silhouette (frame « Coefficient de silhouette »)', () => {
	it('exact 1-D case: clusters {0, 1} and {10, 11}', () => {
		const pts = [
			[0],
			[1],
			[10],
			[11]
		];
		const { s, sGlobal } = silhouette(pts, [0, 0, 1, 1]);
		expect(s[0]).toBeCloseTo(19 / 21, 12);
		expect(s[1]).toBeCloseTo(17 / 19, 12);
		expect(s[2]).toBeCloseTo(17 / 19, 12);
		expect(s[3]).toBeCloseTo(19 / 21, 12);
		expect(sGlobal).toBeCloseTo((19 / 21 + 17 / 19 + 17 / 19 + 19 / 21) / 4, 12);
	});

	it('points in singleton clusters have s = 0 (convention)', () => {
		const pts = [
			[0],
			[1],
			[10]
		];
		const { s } = silhouette(pts, [0, 1, 2]);
		expect(s).toEqual([0, 0, 0]);
	});

	it('is high for well-separated blobs and always in [−1, 1]', () => {
		const pts = generateBlobs(3, 20, 42);
		const labels = cutPartition(hierarchicalAgglomerative(pts, 'ward'), 3);
		const { s, sGlobal } = silhouette(pts, labels);
		expect(sGlobal).toBeGreaterThan(0.75);
		for (const v of s) {
			expect(v).toBeGreaterThanOrEqual(-1);
			expect(v).toBeLessThanOrEqual(1);
		}
	});

	it('rejects fewer than 2 non-empty clusters', () => {
		expect(() => silhouette([[0], [1]], [0, 0])).toThrow();
	});
});

// ── Hierarchical agglomerative clustering ──────────────────────────────────

describe('hierarchicalAgglomerative (section « Clustering hiérarchique »)', () => {
	it('n = 2: a single merge at distance d, identical for every linkage', () => {
		const pts: number[][] = [
			[0, 0],
			[3, 4]
		];
		for (const linkage of ['single', 'complete', 'average', 'centroid', 'ward'] as const) {
			const h = hierarchicalAgglomerative(pts, linkage);
			expect(h.merges).toHaveLength(1);
			if (linkage === 'ward') {
				// (1·1/2)·‖μ−μ‖² = 25/2
				expect(h.merges[0].height).toBeCloseTo(12.5, 12);
			} else {
				expect(h.merges[0].height).toBeCloseTo(5, 12);
			}
		}
	});

	it('collinear points: single and complete linkages give different second heights (2 vs 3)', () => {
		const pts: number[][] = [
			[0],
			[2],
			[3]
		];
		const single = hierarchicalAgglomerative(pts, 'single');
		const complete = hierarchicalAgglomerative(pts, 'complete');
		expect(single.merges.map((m) => m.height)).toEqual([1, 2]);
		expect(complete.merges.map((m) => m.height)).toEqual([1, 3]);
	});

	it('ward: the merge height equals the gain of intra-class variance (Proposition)', () => {
		const pts = generateBlobs(3, 8, 21);
		const h = hierarchicalAgglomerative(pts, 'ward');
		const n = pts.length;
		// After the first merge the partition has one pair; brute-force the
		// best second merge by recomputing I_W of the candidate partitions.
		const after1 = cutPartition(h, n - 1);
		const iW1 = inertiaIntra(pts, after1);
		const clustersOf = (labels: number[]) => {
			const map = new Map<number, number[]>();
			labels.forEach((l, i) => map.set(l, [...(map.get(l) ?? []), i]));
			return [...map.values()];
		};
		const iwAfter = (labels: number[]) => inertiaIntra(pts, labels);
		const base = clustersOf(after1);
		let bestGain = Infinity;
		for (let a = 0; a < base.length; a++) {
			for (let b = a + 1; b < base.length; b++) {
				const merged = after1.map((l) => (l === after1[base[b][0]] ? after1[base[a][0]] : l));
				const gain = iwAfter(merged) - iW1;
				if (gain < bestGain) bestGain = gain;
			}
		}
		expect(h.merges[1].height).toBeCloseTo(bestGain, 9);
	});

	it('heights are non-decreasing for median-axiom linkages', () => {
		const pts = generateBlobs(3, 12, 5);
		for (const linkage of ['single', 'complete', 'average', 'ward'] as const) {
			const heights = hierarchicalAgglomerative(pts, linkage).merges.map((m) => m.height);
			for (let t = 1; t < heights.length; t++) {
				expect(heights[t]).toBeGreaterThanOrEqual(heights[t - 1] - 1e-9);
			}
		}
	});

	it('is deterministic and rejects invalid inputs', () => {
		const pts = generateBlobs(2, 5, 9);
		expect(hierarchicalAgglomerative(pts, 'ward')).toEqual(hierarchicalAgglomerative(pts, 'ward'));
		expect(() => hierarchicalAgglomerative([[0]], 'ward')).toThrow();
		expect(() => hierarchicalAgglomerative(pts, 'unknown' as never)).toThrow();
	});
});

describe('cutPartition and cutByThreshold', () => {
	const pts: number[][] = [
		[0],
		[2],
		[3],
		[10],
		[11]
	];
	const h = hierarchicalAgglomerative(pts, 'complete');

	it('k = 1 gives one cluster, k = n gives singletons', () => {
		expect(new Set(cutPartition(h, 1))).toHaveLength(1);
		const singletons = cutPartition(h, 5);
		expect(new Set(singletons)).toHaveLength(5);
		expect(singletons).toEqual([0, 1, 2, 3, 4]);
	});

	it('k = 2 keeps the two closest pairs together (complete linkage)', () => {
		const labels = cutPartition(h, 2);
		expect(labels[0]).toBe(labels[1]); // points 0 and 2 (distance 2)
		expect(labels[3]).toBe(labels[4]); // points 10 and 11
		expect(labels[0]).not.toBe(labels[3]);
	});

	it('cutByThreshold: r = 0 → singletons, r = ∞ → one cluster, in between → the right number', () => {
		expect(new Set(cutByThreshold(h, 0))).toHaveLength(5);
		expect(new Set(cutByThreshold(h, Infinity))).toHaveLength(1);
		// Complete-linkage heights on this set: 1 (2,3), 1 (10,11), 3, 9.
		const mid = cutByThreshold(h, 1.5);
		expect(new Set(mid)).toHaveLength(3);
	});

	it('rejects out-of-range k and negative thresholds', () => {
		expect(() => cutPartition(h, 0)).toThrow();
		expect(() => cutPartition(h, 6)).toThrow();
		expect(() => cutByThreshold(h, -1)).toThrow();
	});
});

describe('dendrogramLayout', () => {
	it('leaves are evenly ordered, internal nodes sit between their children', () => {
		const pts = generateBlobs(3, 6, 2);
		const h = hierarchicalAgglomerative(pts, 'ward');
		const { leafOrder, x, y, nodeCount } = dendrogramLayout(h);
		const n = pts.length;
		expect(nodeCount).toBe(2 * n - 1);
		expect([...leafOrder].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
		// Leaf x equals its position in the leaf order.
		leafOrder.forEach((leaf, pos) => expect(x[leaf]).toBe(pos));
		// Internal nodes: x = mean of children, y = merge height.
		h.merges.forEach(({ a, b, height }, t) => {
			const id = n + t;
			expect(x[id]).toBeCloseTo((x[a] + x[b]) / 2, 12);
			expect(y[id]).toBeCloseTo(height, 12);
		});
		// The root is the top of the dendrogram.
		expect(y[2 * n - 2]).toBe(h.merges[n - 2].height);
	});
});

// ── K-means (Lloyd) ────────────────────────────────────────────────────────

describe('kmeansLloyd (section « Les K-moyennes »)', () => {
	it('is deterministic for a fixed seed and initialization', () => {
		const pts = generateBlobs(3, 15, 13);
		const a = kmeansLloyd(pts, 3, 7, { init: 'random' });
		const b = kmeansLloyd(pts, 3, 7, { init: 'random' });
		expect(a).toEqual(b);
		expect(kmeansLloyd(pts, 3, 7, { init: 'pp' })).not.toEqual(a);
	});

	it('intra-class inertia is non-increasing at every iteration (Proposition)', () => {
		const datasets: number[][][] = [
			generateBlobs(3, 20, 4),
			generateBlobs(2, 15, 8),
			generateConcentricRings(20, 6)
		];
		for (const pts of datasets) {
			for (const init of ['random', 'pp'] as const) {
				const { states } = kmeansLloyd(pts, 3, 2, { init });
				for (let t = 1; t < states.length; t++) {
					expect(states[t].inertia).toBeLessThanOrEqual(states[t - 1].inertia + 1e-9);
				}
			}
		}
	});

	it('k = 1: the center is the overall mean and every point is assigned to it', () => {
		const pts = generateBlobs(3, 10, 1);
		const { states, converged } = kmeansLloyd(pts, 1, 1, { init: 'random' });
		expect(converged).toBe(true);
		const final = states[states.length - 1];
		expect(final.labels).toEqual(new Array(pts.length).fill(0));
		const mean = [0, 1].map((q) => pts.reduce((s, p) => s + p[q], 0) / pts.length);
		expect(euclidean(final.centers[0], mean)).toBeLessThan(1e-9);
	});

	it('recovers well-separated blobs up to a permutation of the labels', () => {
		const k = 3;
		const nPerBlob = 30;
		const pts = generateBlobs(k, nPerBlob, 17);
		const { labels } = kmeansLloyd(pts, k, 23, { init: 'pp' }).states.at(-1)!;
		const centers = [0, 1, 2].map((j) => [4 * Math.cos((2 * Math.PI * j) / 3), 4 * Math.sin((2 * Math.PI * j) / 3)]);
		const truth = pts.map((p) =>
			centers.reduce((best, c, j) => (euclidean(p, c) < euclidean(p, centers[best]) ? j : best), 0)
		);
		// Try all 6 label permutations and keep the best agreement.
		const perms = [
			[0, 1, 2],
			[0, 2, 1],
			[1, 0, 2],
			[1, 2, 0],
			[2, 0, 1],
			[2, 1, 0]
		];
		let bestAgreement = 0;
		for (const perm of perms) {
			const agreement = pts.filter((_, i) => labels[i] === perm[truth[i]]).length / pts.length;
			bestAgreement = Math.max(bestAgreement, agreement);
		}
		expect(bestAgreement).toBeGreaterThan(0.95);
	});

	it('k-means++ picks k distinct data points, deterministically', () => {
		const pts = generateBlobs(2, 20, 11);
		const c1 = kmeansPPInit(pts, 3, 5);
		const c2 = kmeansPPInit(pts, 3, 5);
		expect(c1).toEqual(c2);
		expect(c1).toHaveLength(3);
		for (const c of c1) expect(pts.some((p) => p[0] === c[0] && p[1] === c[1])).toBe(true);
	});

	it('cannot separate concentric rings in 2-D (convex Voronoi cells)…', () => {
		const nPerRing = 25;
		const pts = generateConcentricRings(nPerRing, 3);
		const { labels } = kmeansLloyd(pts, 2, 3, { init: 'pp' }).states.at(-1)!;
		const inner = labels.slice(0, nPerRing);
		const outer = labels.slice(nPerRing);
		// A ring-respecting partition would assign one label per ring; k-means
		// cuts each ring into convex pieces, so both labels appear in both rings.
		expect(new Set(inner)).toHaveLength(2);
		expect(new Set(outer)).toHaveLength(2);
	});

	it('…but the φ = (x, y, x²+y²) lift (TP 6, question 7) makes them separable', () => {
		const nPerRing = 25;
		const pts = generateConcentricRings(nPerRing, 3);
		const lifted = pts.map((p) => [p[0], p[1], p[0] ** 2 + p[1] ** 2]);
		const { labels } = kmeansLloyd(lifted, 2, 3, { init: 'pp' }).states.at(-1)!;
		const inner = labels.slice(0, nPerRing);
		const outer = labels.slice(nPerRing);
		const pureInner = new Set(inner).size === 1;
		const pureOuter = new Set(outer).size === 1;
		expect(pureInner && pureOuter).toBe(true);
	});

	it('an outlier given its own center ends up alone in a cluster (frame « Données abberrantes »)', () => {
		const { points, outlierIndices } = generateBlobsWithOutliers(3, 30, 1, 1);
		const outlier = points[outlierIndices[0]];
		// True blob centers: radius 4 at angles 0, 2π/3, 4π/3 (see generateBlobs).
		const blobCenters = [0, 1, 2].map((j) => [4 * Math.cos((2 * Math.PI * j) / 3), 4 * Math.sin((2 * Math.PI * j) / 3)]);
		// Keep the two centers CLOSEST to the outlier so the third blob is the
		// one farthest from it: every blob point stays closer to a blob center
		// than to the outlier, which converges to a singleton cluster.
		const twoClosest = [...blobCenters]
			.sort((a, b) => euclidean(a, outlier) - euclidean(b, outlier))
			.slice(0, 2);
		const { states, converged } = kmeansLloyd(points, 3, 1, { initialCenters: [outlier, ...twoClosest] });
		const labels = states.at(-1)!.labels;
		expect(converged).toBe(true);
		expect(labels.filter((l) => l === labels[outlierIndices[0]])).toEqual([labels[outlierIndices[0]]]);
	});

	it('absorbs the same outlier into a blob when no center is allocated to it (local minimum)', () => {
		const { points, outlierIndices } = generateBlobsWithOutliers(3, 30, 1, 1);
		const blobCenters = [0, 1, 2].map((j) => [4 * Math.cos((2 * Math.PI * j) / 3), 4 * Math.sin((2 * Math.PI * j) / 3)]);
		const { states } = kmeansLloyd(points, 3, 1, { initialCenters: blobCenters });
		const labels = states.at(-1)!.labels;
		// The outlier joins the nearest blob cluster: its cluster has > 1 point.
		expect(labels.filter((l) => l === labels[outlierIndices[0]]).length).toBeGreaterThan(1);
	});

	it('rejects invalid k, empty points and maxIter', () => {
		const pts = generateBlobs(2, 4, 1);
		expect(() => kmeansLloyd(pts, 0, 1)).toThrow();
		expect(() => kmeansLloyd(pts, 100, 1)).toThrow();
		expect(() => kmeansLloyd([], 2, 1)).toThrow();
		expect(() => kmeansLloyd(pts, 2, 1, { maxIter: 0 })).toThrow();
	});
});

describe('assignToNearestCenter', () => {
	it('assigns each point to its nearest center, ties to the smallest index', () => {
		const pts: number[][] = [
			[0, 0],
			[5, 0],
			[2.5, 0] // equidistant from both centers
		];
		const centers: number[][] = [
			[0, 0],
			[5, 0]
		];
		expect(assignToNearestCenter(pts, centers)).toEqual([0, 1, 0]);
	});
});

// ── Bell numbers and the elbow heuristic ───────────────────────────────────

describe('bellNumber (frame « Choix d’une partition »)', () => {
	it('matches the known values B_0 … B_11 (A000110)', () => {
		const known = [1n, 1n, 2n, 5n, 15n, 52n, 203n, 877n, 4140n, 21147n, 115975n, 678570n, 4213597n];
		for (let n = 0; n <= 11; n++) expect(bellNumber(n)).toBe(known[n]);
	});

	it('B_50 is astronomically large (the slides’ warning)', () => {
		// Exact value: 185724268771078270438257767181908917499221852770 ≈ 1.86·10^47.
		// NB: the slides state B_50 ≥ 10^48; the exact computation gives
		// ≈ 1.86·10^47 (one decade lower). The lesson quotes the corrected
		// order of magnitude and flags the discrepancy.
		expect(bellNumber(50) >= 10n ** 47n).toBe(true);
		expect(bellNumber(50) < 10n ** 48n).toBe(true);
	});

	it('rejects invalid n', () => {
		expect(() => bellNumber(-1)).toThrow();
		expect(() => bellNumber(1.5)).toThrow();
		expect(() => bellNumber(1001)).toThrow();
	});
});

describe('elbowK (frame « Choix de K », illustrative heuristic)', () => {
	it('finds the knee of a synthetic inertia curve', () => {
		// Sharp decrease up to K = 3 (index 2), then a flat tail.
		expect(elbowK([100, 60, 40, 33, 30, 29, 28])).toBe(2);
	});

	it('returns an endpoint for a straight line', () => {
		const idx = elbowK([100, 75, 50, 25]);
		expect(idx).toBe(0);
	});

	it('rejects invalid curves', () => {
		expect(() => elbowK([5])).toThrow();
		expect(() => elbowK([1, -2, 3])).toThrow();
		expect(() => elbowK([1, Number.NaN, 3])).toThrow();
	});
});
