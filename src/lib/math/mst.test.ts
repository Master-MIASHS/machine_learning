import { describe, expect, it } from 'vitest';
import {
	cutByThreshold,
	cutPartition,
	generateBlobs,
	hierarchicalAgglomerative,
	type Point
} from './clustering';
import {
	componentsAtThreshold,
	gapMetrics,
	generateChainedDisks,
	generateDisksPair,
	meanGapCurve,
	mstKruskal,
	mstPathMaxEdge,
	singleLinkageFromMst
} from './mst';

// ── mstKruskal ─────────────────────────────────────────────────────────────

/** All pairwise distances of a point cloud. */
function allDistances(points: Point[]): number[] {
	const out: number[] = [];
	for (let i = 0; i < points.length; i++) {
		for (let j = i + 1; j < points.length; j++) {
			let s = 0;
			for (let q = 0; q < points[i].length; q++) s += (points[i][q] - points[j][q]) ** 2;
			out.push(Math.sqrt(s));
		}
	}
	return out;
}

/**
 * Minimum spanning tree weight by brute force: enumerate every labeled tree
 * on n vertices via its Prüfer code (Cayley: n^(n−2) trees), sum the edge
 * weights, keep the minimum. Reference independent of Kruskal.
 */
function mstWeightBruteForce(points: Point[]): number {
	const n = points.length;
	const d = points[0].length;
	const w = (i: number, j: number): number => {
		let s = 0;
		for (let q = 0; q < d; q++) s += (points[i][q] - points[j][q]) ** 2;
		return Math.sqrt(s);
	};
	if (n === 2) return w(0, 1);
	const codeLength = n - 2;
	let best = Infinity;
	for (let mask = 0; mask < Math.pow(n, codeLength); mask++) {
		// Decode mask as the base-n Prüfer code.
		const code: number[] = [];
		let m = mask;
		for (let k = 0; k < codeLength; k++) {
			code.push(m % n);
			m = Math.floor(m / n);
		}
		// Prüfer → edges: repeatedly attach the smallest label of degree 1 to
		// the next code entry.
		const degree = new Array(n).fill(1);
		for (const c of code) degree[c]++;
		let total = 0;
		for (const c of code) {
			let l = 0;
			while (degree[l] !== 1) l++;
			total += w(l, c);
			degree[l]--;
			degree[c]--;
		}
		// Final edge: the two labels still of degree 1.
		const rest: number[] = [];
		for (let x = 0; x < n; x++) if (degree[x] === 1) rest.push(x);
		total += w(rest[0], rest[1]);
		if (total < best) best = total;
	}
	return best;
}

describe('mstKruskal (Gower & Ross 1969 — the MST behind single-linkage)', () => {
	it('n = 2: the single edge', () => {
		const mst = mstKruskal([[0, 0], [3, 4]]);
		expect(mst.edges).toHaveLength(1);
		expect(mst.edges[0].weight).toBeCloseTo(5, 12);
		expect(mst.totalWeight).toBeCloseTo(5, 12);
	});

	it('n = 3 right triangle: 3 + 4 = 7 (the hypotenuse 5 is rejected)', () => {
		const mst = mstKruskal([[0, 0], [3, 0], [0, 4]]);
		expect(mst.totalWeight).toBeCloseTo(7, 12);
	});

	it('1-D points: the MST is the chain of consecutive gaps (total = span)', () => {
		const pts: Point[] = [[0], [2], [5], [6]];
		const mst = mstKruskal(pts);
		expect(mst.edges).toHaveLength(3);
		expect(mst.totalWeight).toBeCloseTo(6, 12);
	});

	it('matches the Prüfer brute-force optimum for n = 4, 5, 6 (several seeds)', () => {
		for (const seed of [1, 7, 42]) {
			for (const n of [4, 5, 6]) {
				// Seeded 2-D random cloud, well-spread (avoids degenerate weights).
				let a = seed * 1000 + n;
				const rand = () => {
					a = (a * 1103515245 + 12345) % 2147483648;
					return a / 2147483648;
				};
				const pts: Point[] = Array.from({ length: n }, () => [rand() * 10, rand() * 10]);
				expect(mstKruskal(pts).totalWeight).toBeCloseTo(mstWeightBruteForce(pts), 10);
			}
		}
	});

	it('is invariant under translation and rotation', () => {
		const base: Point[] = [
			[0, 0],
			[2, 0.5],
			[4, 3],
			[1, 4],
			[5, 5]
		];
		const ang = 0.9;
		const rot = (p: Point): Point => [
			p[0] * Math.cos(ang) - p[1] * Math.sin(ang) + 17,
			p[0] * Math.sin(ang) + p[1] * Math.cos(ang) - 3
		];
		expect(mstKruskal(base.map(rot)).totalWeight).toBeCloseTo(mstKruskal(base).totalWeight, 12);
	});

	it('rejects degenerate inputs', () => {
		expect(() => mstKruskal([[0, 0]])).toThrow();
		expect(() => mstKruskal([[0, 0], [1]])).toThrow();
	});
});

// ── singleLinkageFromMst ≡ hierarchicalAgglomerative('single') ─────────────

describe('singleLinkageFromMst vs hierarchicalAgglomerative (equivalence)', () => {
	it('gives the same partition at every k (several seeds, no distance ties)', () => {
		for (const seed of [3, 11, 29]) {
			const pts = generateBlobs(3, 8, seed, 0.9);
			const dists = allDistances(pts);
			// The equivalence below is stated for distinct weights; with seeded
			// continuous data a tie would be a defect of the test data, not of
			// the code — assert it away.
			expect(new Set(dists.map((d) => d.toFixed(15))).size).toBe(dists.length);
			const viaMst = singleLinkageFromMst(pts);
			const viaCah = hierarchicalAgglomerative(pts, 'single');
			for (let k = 1; k <= pts.length; k++) {
				expect(cutPartition(viaMst, k)).toEqual(cutPartition(viaCah, k));
			}
		}
	});
});

// ── componentsAtThreshold ──────────────────────────────────────────────────

describe('componentsAtThreshold (the threshold graph G_t)', () => {
	it('unit square, hand-computed thresholds', () => {
		const pts: Point[] = [
			[0, 0],
			[1, 0],
			[1, 1],
			[0, 1]
		];
		// t below the side: no edge at all.
		expect(componentsAtThreshold(pts, 0.5).count).toBe(4);
		// t = side: the four sides are edges, the diagonals (√2) are not → one
		// component (the square is connected through its sides).
		expect(componentsAtThreshold(pts, 1).count).toBe(1);
	});

	it('two compact disks: the gap threshold separates exactly the disks', () => {
		const { points, labels } = generateDisksPair(25, 5);
		const { intraMax, interMin } = gapMetrics(points, labels);
		const t = (intraMax + interMin) / 2;
		const { labels: comp } = componentsAtThreshold(points, t);
		// Same two classes, up to the label permutation — compare as a set of
		// index sets.
		const classOf = (arr: number[]): string[] => {
			const groups = new Map<number, number[]>();
			arr.forEach((l, i) => groups.set(l, [...(groups.get(l) ?? []), i]));
			return [...groups.values()].sort((a, b) => a[0] - b[0]).map((g) => g.slice().sort((x, y) => x - y).join(','));
		};
		expect(classOf(comp)).toEqual(classOf(labels));
	});

	it('monotone in t; trivial at the extremes (Gower–Ross invariants)', () => {
		const pts = generateBlobs(2, 12, 9);
		const dists = allDistances(pts);
		const tMin = Math.min(...dists);
		const tMax = Math.max(...dists);
		expect(componentsAtThreshold(pts, tMin * (1 - 1e-9)).count).toBe(pts.length);
		expect(componentsAtThreshold(pts, tMax).count).toBe(1);
		const levels = [0.25, 0.5, 0.75, 1].map((q) => dists.slice().sort((a, b) => a - b)[Math.floor(q * (dists.length - 1))]);
		const counts = levels.map((t) => componentsAtThreshold(pts, t).count);
		for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
	});

	it('equals cutByThreshold of the single-linkage MST dendrogram (several t)', () => {
		const pts = generateBlobs(3, 7, 21);
		const dists = allDistances(pts).sort((a, b) => a - b);
		const h = singleLinkageFromMst(pts);
		for (const q of [0.1, 0.3, 0.5, 0.7, 0.9]) {
			const t = dists[Math.floor(q * (dists.length - 1))];
			const byThreshold = componentsAtThreshold(pts, t);
			const byDendrogram = cutByThreshold(h, t);
			// Same convention (labels by smallest member) → exactly equal.
			expect(byDendrogram).toEqual(byThreshold.labels);
		}
	});

	it('rejects a negative threshold', () => {
		expect(() => componentsAtThreshold([[0, 0], [1, 1]], -1)).toThrow();
	});
});

// ── mstPathMaxEdge and the minimax identity ────────────────────────────────

/**
 * Bottleneck (minimax) distance: D[i][j] = min over all paths of the maximum
 * edge weight, via the min–max Floyd–Warshall relaxation. Reference
 * independent of the MST path.
 */
function bottleneckAllPairs(points: Point[]): number[][] {
	const n = points.length;
	const D: number[][] = Array.from({ length: n }, () => new Array(n).fill(Infinity));
	for (let i = 0; i < n; i++) {
		D[i][i] = 0;
		for (let j = i + 1; j < n; j++) {
			let s = 0;
			for (let q = 0; q < points[i].length; q++) s += (points[i][q] - points[j][q]) ** 2;
			D[i][j] = D[j][i] = Math.sqrt(s);
		}
	}
	for (let k = 0; k < n; k++) {
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				const via = Math.max(D[i][k], D[k][j]);
				if (via < D[i][j]) D[i][j] = via;
			}
		}
	}
	return D;
}

describe('mstPathMaxEdge (merge level = heaviest MST edge)', () => {
	it('1-D chain: the path 0→3 sees the heaviest consecutive gap', () => {
		const mst = mstKruskal([
			[0],
			[2],
			[5],
			[6]
		]);
		// Gaps: 2, 3, 1 → heaviest on the whole path = 3.
		expect(mstPathMaxEdge(mst, 0, 3)).toBeCloseTo(3, 12);
		expect(mstPathMaxEdge(mst, 0, 1)).toBeCloseTo(2, 12);
		expect(mstPathMaxEdge(mst, 2, 3)).toBeCloseTo(1, 12);
	});

	it('equals the brute-force bottleneck distance for all pairs (seeds, n ≤ 8)', () => {
		for (const seed of [2, 13]) {
			for (const n of [4, 6, 8]) {
				let a = seed * 999 + n;
				const rand = () => {
					a = (a * 1103515245 + 12345) % 2147483648;
					return a / 2147483648;
				};
				const pts: Point[] = Array.from({ length: n }, () => [rand() * 10, rand() * 10]);
				const mst = mstKruskal(pts);
				const B = bottleneckAllPairs(pts);
				for (let i = 0; i < n; i++) {
					for (let j = i + 1; j < n; j++) {
						expect(mstPathMaxEdge(mst, i, j)).toBeCloseTo(B[i][j], 10);
					}
				}
			}
		}
	});

	it('rejects bad endpoints', () => {
		const mst = mstKruskal([[0, 0], [1, 0], [4, 0]]);
		expect(() => mstPathMaxEdge(mst, 0, 0)).toThrow();
		expect(() => mstPathMaxEdge(mst, 0, 3)).toThrow();
	});
});

// ── gapMetrics ─────────────────────────────────────────────────────────────

describe('gapMetrics (the observed two-population gap)', () => {
	it('hand-computed 1-D case', () => {
		const points: Point[] = [
			[0],
			[1],
			[4],
			[5]
		];
		const labels = [0, 0, 1, 1];
		const g = gapMetrics(points, labels);
		expect(g.intraMax).toBeCloseTo(1, 12);
		expect(g.interMin).toBeCloseTo(3, 12);
		expect(g.gap).toBeCloseTo(2, 12);
	});

	it('rejects non-two-class or singleton classes', () => {
		expect(() => gapMetrics([[0], [1]], [0, 0])).toThrow();
		expect(() => gapMetrics([[0], [1], [5]], [0, 1, 2])).toThrow();
		expect(() => gapMetrics([[0], [1], [5]], [0, 0, 1])).toThrow();
		expect(() => gapMetrics([[0], [1]], [0, 1])).toThrow();
	});
});

// ── meanGapCurve and the generators ────────────────────────────────────────

describe('meanGapCurve (the empirical gap-closing measurement)', () => {
	const grid = [10, 20, 40, 80, 120, 160, 200, 240, 300];

	it('is deterministic for a fixed seed', () => {
		const c1 = meanGapCurve(7, [10, 50], 3, (n, s) => generateDisksPair(n, s));
		const c2 = meanGapCurve(7, [10, 50], 3, (n, s) => generateDisksPair(n, s));
		expect(c1.meanGap).toEqual(c2.meanGap);
	});

	it('compact support (disks): the gap stays positive for every n (limit δ − 4r = 2)', () => {
		const { meanGap } = meanGapCurve(7, grid, 10, (n, s) => generateDisksPair(n, s, 1, 6));
		for (const g of meanGap) expect(g).toBeGreaterThan(0);
		// The gap shrinks with n (intra max ↑ toward 2, inter min ↓ toward 4).
		expect(meanGap[meanGap.length - 1]).toBeLessThan(meanGap[0]);
		// And it approaches the deterministic limit 6 − 4 = 2 from above.
		expect(meanGap[meanGap.length - 1]).toBeLessThan(2.2);
	});

	it('unbounded support (Gaussian blobs, course parameters): the gap closes to 0', () => {
		// generateBlobs(2, n): σ = 0.7, centers 8 apart — the parameters of the
		// lesson demos. Research file §3.3: P(gap > 0) ≈ 1, 0.68, 0.10 at
		// n = 10, 100, 300 → the mean gap crosses 0 inside the grid.
		// generateBlobs(2, n) = 2n points: first n in blob 0, next n in blob 1.
		const { meanGap } = meanGapCurve(7, grid, 10, (n, s) => ({
			points: generateBlobs(2, n, s),
			labels: Array.from({ length: 2 * n }, (_, i) => (i < n ? 0 : 1))
		}));
		expect(meanGap[0]).toBeGreaterThan(0);
		expect(meanGap[meanGap.length - 1]).toBeLessThan(0);
	});

	it('generateDisksPair: exact support bounds and determinism', () => {
		const { points, labels } = generateDisksPair(20, 3, 1, 6);
		expect(points).toHaveLength(40);
		expect(labels.filter((l) => l === 0)).toHaveLength(20);
		// Intra ≤ 2r (diameter), inter ≥ δ − 2r, up to floating point.
		const g = gapMetrics(points, labels);
		expect(g.intraMax).toBeLessThanOrEqual(2 + 1e-9);
		expect(g.interMin).toBeGreaterThanOrEqual(4 - 1e-9);
		const again = generateDisksPair(20, 3, 1, 6);
		expect(again.points).toEqual(points);
	});

	it('generateChainedDisks: adds the chain (label 2) between the disks', () => {
		const { points, labels } = generateChainedDisks(10, 5, 4, 1, 6, 0.8);
		expect(points).toHaveLength(25);
		expect(labels.filter((l) => l === 2)).toHaveLength(5);
		// nChain = 0 reproduces the plain disks.
		const none = generateChainedDisks(10, 0, 4, 1, 6, 0.8);
		expect(none.points).toEqual(generateDisksPair(10, 4, 1, 6).points);
	});
});
