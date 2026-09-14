/**
 * Part III — Clustering.
 *
 * Minimum-spanning-tree helpers for the expert panel « Single-linkage,
 * arbres couvrants minimaux et consistance de Hartigan » (Part III, lesson 1,
 * h2 « Liaisons entre clusters »).
 *
 * Content boundary: the MST characterization of single-linkage and the
 * Hartigan consistency theory are **not** in `course_sources/` —
 * course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex (section
 * « Clustering hiérarchique ») teaches the linkage criteria algorithmically
 * and states the Ward proposition without proof. The statements implemented
 * here follow the primary literature (see
 * expert/part3/lesson1/single-linkage-mst-hartigan.research.md for the
 * verification status of each claim):
 *  - Gower & Ross (1969), « Minimum Spanning Trees and Single Linkage
 *    Cluster Analysis », JRSS-C 18(1):54–64 — the single-linkage partition
 *    at threshold t is exactly the connected components of the subgraph of
 *    any MST formed by the edges of weight ≤ t (singleLinkageFromMst,
 *    componentsAtThreshold, mstPathMaxEdge);
 *  - Hartigan (1975, book) / Hartigan (1981), JASA 76(374):388–394, with
 *    Penrose (1995), J. Multivariate Analysis 53:94–109 — density cluster
 *    tree, d=1 consistency / d≥2 failure (continuum percolation),
 *    fractional consistency for a density-ratio > 1. The two-population
 *    proposition (compact support, gap) and the empirical gap-closing
 *    measurement for unbounded support (meanGapCurve + the two generators
 *    below) implement the accessible core of that theory; the generators
 *    are seeded synthetic demo models, not course data.
 *  - Ward (1963), JASA 58(301):236–244 — Ward's distance is the exact
 *    within-cluster SSE increase of a merge (course proposition, proved in
 *    the panel; no code needed here, clustering.ts already implements it).
 *  - Sibson (1973), « SLINK », The Computer Journal 16(1):30–34 — O(n²)
 *    single-linkage; mstKruskal here is the O(n² log n) MST route of the
 *    panel's complexity discussion.
 *
 * Conventions: same as clustering.ts (points are number arrays, Euclidean
 * distance by default, deterministic tie-breaking by index order).
 */
import { euclidean, type Point, type Hierarchy } from './clustering';
import { combineSeed, mulberry32 } from './util';

export interface MstEdge {
	/** First endpoint (leaf index). */
	u: number;
	/** Second endpoint (leaf index). */
	v: number;
	/** Edge weight (distance). */
	weight: number;
}

export interface Mst {
	/** The n−1 edges of the MST, in increasing weight order (Kruskal order). */
	edges: MstEdge[];
	/** Sum of the edge weights. */
	totalWeight: number;
}

function checkPoints(points: Point[]): number {
	const n = points.length;
	if (n < 2) throw new Error(`at least 2 points are needed, got ${n}`);
	const d = points[0].length;
	if (d === 0) throw new Error('points must have at least one coordinate');
	if (points.some((p) => p.length !== d)) {
		throw new Error('points must have the same dimension');
	}
	return n;
}

/**
 * Kruskal's algorithm on the complete graph of `points` (edge weight =
 * distance, Euclidean by default). O(n² log n) — the panel's « par le MST »
 * route (Prim O(n²) + Kruskal O(n log n) is the dense-graph variant).
 * Deterministic: edges are processed in (weight, u, v) order.
 * Implements the Gower & Ross (1969) equivalence — the returned tree is the
 * object whose threshold subgraphs are the single-linkage clusters.
 */
export function mstKruskal(points: Point[], dist: (a: Point, b: Point) => number = euclidean): Mst {
	const n = checkPoints(points);
	const edges: MstEdge[] = [];
	for (let u = 0; u < n; u++) {
		for (let v = u + 1; v < n; v++) {
			edges.push({ u, v, weight: dist(points[u], points[v]) });
		}
	}
	edges.sort((e, f) => (e.weight - f.weight) || (e.u - f.u) || (e.v - f.v));
	const parent = Array.from({ length: n }, (_, i) => i);
	const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
	const kept: MstEdge[] = [];
	let total = 0;
	for (const e of edges) {
		const ru = find(e.u);
		const rv = find(e.v);
		if (ru === rv) continue;
		parent[rv] = ru;
		kept.push(e);
		total += e.weight;
		if (kept.length === n - 1) break;
	}
	return { edges: kept, totalWeight: total };
}

/**
 * Maximum edge weight on the unique path of the MST joining i and j. By the
 * Gower & Ross (1969) equivalence this is the single-linkage merge level of
 * the two clusters containing i and j, and by the minimax identity it equals
 * min over all paths of the maximum edge weight (bottleneck distance).
 */
export function mstPathMaxEdge(mst: Mst, i: number, j: number): number {
	const n = mst.edges.length + 1;
	if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || j < 0 || i >= n || j >= n) {
		throw new Error(`endpoints must be in {0, …, ${n - 1}}, got ${i} and ${j}`);
	}
	if (i === j) throw new Error('endpoints must be distinct');
	const adj: { to: number; w: number }[][] = Array.from({ length: n }, () => []);
	for (const e of mst.edges) {
		adj[e.u].push({ to: e.v, w: e.weight });
		adj[e.v].push({ to: e.u, w: e.weight });
	}
	// BFS from i, tracking the maximum edge weight along the path.
	const seen = new Array(n).fill(false);
	const maxSoFar = new Array(n).fill(0);
	const queue = [i];
	seen[i] = true;
	while (queue.length > 0) {
		const x = queue.shift()!;
		if (x === j) return maxSoFar[x];
		for (const { to, w } of adj[x]) {
			if (seen[to]) continue;
			seen[to] = true;
			maxSoFar[to] = Math.max(maxSoFar[x], w);
			queue.push(to);
		}
	}
	throw new Error('MST is not connected');
}

/**
 * Connected components of the threshold graph G_t: edge {i, j} iff
 * d(x_i, x_j) ≤ t. This is the single-linkage partition at threshold t —
 * the objects of the Gower & Ross (1969) theorem. O(n²).
 * Labels are in {0, …, K−1}, assigned in the order of the smallest member
 * index (same convention as clustering.ts).
 */
export function componentsAtThreshold(
	points: Point[],
	t: number,
	dist: (a: Point, b: Point) => number = euclidean
): { labels: number[]; count: number } {
	const n = checkPoints(points);
	if (!Number.isFinite(t) || t < 0) throw new Error(`threshold t must be finite and ≥ 0, got ${t}`);
	const parent = Array.from({ length: n }, (_, i) => i);
	const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			if (dist(points[i], points[j]) <= t) {
				const ri = find(i);
				const rj = find(j);
				if (ri !== rj) parent[rj] = ri;
			}
		}
	}
	const rootToLabel = new Map<number, number>();
	const labels = new Array<number>(n);
	let count = 0;
	for (let i = 0; i < n; i++) {
		const r = find(i);
		if (!rootToLabel.has(r)) rootToLabel.set(r, count++);
		labels[i] = rootToLabel.get(r)!;
	}
	return { labels, count };
}

/**
 * The single-linkage dendrogram built from the MST (Gower & Ross 1969):
 * process the MST edges in increasing weight order; each edge merges the two
 * current components, and the merge level is the edge weight. Returns a
 * `Hierarchy` in the clustering.ts convention (leaves 0..n−1, merge t is the
 * record of node n+t), so it feeds cutPartition / cutByThreshold /
 * dendrogramLayout directly.
 */
export function singleLinkageFromMst(points: Point[], dist: (a: Point, b: Point) => number = euclidean): Hierarchy {
	const n = checkPoints(points);
	const { edges } = mstKruskal(points, dist);
	// DSU over the points; each component carries its current dendrogram node
	// id (a leaf id at first, then the id of the last merge that formed it).
	const parent = Array.from({ length: n }, (_, i) => i);
	const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
	const nodeId = new Array<number>(n);
	const size = new Array<number>(n).fill(1);
	for (let i = 0; i < n; i++) nodeId[i] = i;
	const merges: { a: number; b: number; height: number; size: number }[] = [];
	for (const e of edges) {
		const ru = find(e.u);
		const rv = find(e.v);
		if (ru === rv) continue;
		const a = nodeId[ru];
		const b = nodeId[rv];
		const newSize = size[ru] + size[rv];
		const newId = n + merges.length;
		parent[rv] = ru;
		nodeId[ru] = newId;
		size[ru] = newSize;
		merges.push({ a, b, height: e.weight, size: newSize });
	}
	return { n, merges };
}

/**
 * Observed two-population gap: intraMax = largest within-population
 * distance, interMin = smallest across-population distance, gap =
 * interMin − intraMax. The accessible two-population proposition of the
 * Hartigan consistency theory (research file §3.3): if the support is
 * compact with a gap and t ∈ (intraMax, interMin), the threshold graph G_t
 * has exactly the two populations as components — for every sample.
 * Requires exactly two non-empty classes, each with at least 2 points.
 */
export function gapMetrics(points: Point[], labels: number[]): { intraMax: number; interMin: number; gap: number } {
	const n = checkPoints(points);
	if (labels.length !== n) throw new Error(`labels length must match points length (${n})`);
	const present = [...new Set(labels)];
	if (present.length !== 2) {
		throw new Error(`gapMetrics needs exactly 2 distinct labels, got ${present.length}`);
	}
	for (const c of present) {
		if (labels.filter((l) => l === c).length < 2) {
			throw new Error('each class needs at least 2 points (within-class distances undefined otherwise)');
		}
	}
	let intraMax = 0;
	let interMin = Infinity;
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			const d = euclidean(points[i], points[j]);
			if (labels[i] === labels[j]) {
				if (d > intraMax) intraMax = d;
			} else if (d < interMin) {
				interMin = d;
			}
		}
	}
	return { intraMax, interMin, gap: interMin - intraMax };
}

/**
 * Two uniform disks of radius `radius` centered at (±separation/2, 0) —
 * seeded synthetic demo model (NOT course data): the compact-support
 * setting of the two-population proposition, where the gap δ − 2·(2r) stays
 * positive. Uniform in the disk via r = radius·√u, θ = 2πv.
 */
export function generateDisksPair(
	nPerDisk: number,
	seed: number,
	radius = 1,
	separation = 6
): { points: Point[]; labels: number[] } {
	if (!Number.isInteger(nPerDisk) || nPerDisk < 1) {
		throw new Error(`nPerDisk must be a positive integer, got ${nPerDisk}`);
	}
	if (radius <= 0) throw new Error(`radius must be positive, got ${radius}`);
	if (separation <= 0) throw new Error(`separation must be positive, got ${separation}`);
	const points: Point[] = [];
	const labels: number[] = [];
	for (let c = 0; c < 2; c++) {
		const cx = c === 0 ? -separation / 2 : separation / 2;
		const rand = mulberry32(combineSeed(seed, 50 + c));
		for (let i = 0; i < nPerDisk; i++) {
			const u = rand();
			const v = rand();
			const r = radius * Math.sqrt(u);
			const theta = 2 * Math.PI * v;
			points.push([cx + r * Math.cos(theta), r * Math.sin(theta)]);
			labels.push(c);
		}
	}
	return { points, labels };
}

/**
 * The two disks of generateDisksPair plus a chain of `nChain` points spread
 * along the segment between the two disk boundaries (small seeded jitter) —
 * seeded synthetic demo model (NOT course data) for the chaining defect:
 * when the chain step is below the threshold t, G_t connects the two disks
 * through the chain into a single component, even though the disks are
 * well separated from each other. Chain points get label 2.
 */
export function generateChainedDisks(
	nPerDisk: number,
	nChain: number,
	seed: number,
	radius = 1,
	separation = 6,
	chainStep = 0.8
): { points: Point[]; labels: number[] } {
	if (!Number.isInteger(nChain) || nChain < 0) {
		throw new Error(`nChain must be a non-negative integer, got ${nChain}`);
	}
	if (chainStep <= 0) throw new Error(`chainStep must be positive, got ${chainStep}`);
	const { points, labels } = generateDisksPair(nPerDisk, seed, radius, separation);
	if (nChain === 0) return { points, labels };
	const x0 = -separation / 2 + radius;
	const x1 = separation / 2 - radius;
	if (x1 < x0) throw new Error(`separation (${separation}) must exceed 2·radius (${2 * radius}) for a chain between the disks`);
	const rand = mulberry32(combineSeed(seed, 60));
	for (let i = 0; i < nChain; i++) {
		const frac = nChain === 1 ? 0.5 : i / (nChain - 1);
		const x = x0 + (x1 - x0) * frac + 0.05 * (rand() - 0.5);
		const y = 0.05 * (rand() - 0.5);
		points.push([x, y]);
		labels.push(2);
	}
	return { points, labels };
}

export interface GapCurve {
	/** Sample sizes (per population), as given. */
	n: number[];
	/** Mean observed gap g(n) over the replicates (may be negative). */
	meanGap: number[];
}

/**
 * Empirical gap-closing curve g(n) = mean over replicates of
 * (interMin − intraMax), for a two-population model `make(n, repSeed)`.
 * Implements the research file §3.3 measurement: compact support (disks)
 * keeps g(n) > 0 for all n (limiting gap = separation − 4·radius), while
 * unbounded support (Gaussian blobs, e.g. clustering.ts generateBlobs)
 * shows g(n) closing to 0 as n grows — the empirical face of the chaining
 * defect / d≥2 consistency failure. Deterministic for a fixed seed
 * (mulberry32 + combineSeed from util.ts).
 */
export function meanGapCurve(
	seed: number,
	nValues: number[],
	replicates: number,
	make: (nPerPop: number, repSeed: number) => { points: Point[]; labels: number[] }
): GapCurve {
	if (!Number.isInteger(replicates) || replicates < 1) {
		throw new Error(`replicates must be a positive integer, got ${replicates}`);
	}
	if (nValues.length === 0) throw new Error('nValues must be non-empty');
	const meanGap = nValues.map((nv) => {
		if (!Number.isInteger(nv) || nv < 1) {
			throw new Error(`nValues must contain positive integers, got ${nv}`);
		}
		let s = 0;
		for (let r = 0; r < replicates; r++) {
			const { points, labels } = make(nv, combineSeed(seed, 1000 * nv + r));
			s += gapMetrics(points, labels).gap;
		}
		return s / replicates;
	});
	return { n: nValues, meanGap };
}
