/**
 * Part III — Clustering.
 *
 * Implements the formulas taught in the course, source:
 * course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex (slides
 * M1 MIASHS, M. Demangeot, themselves largely inspired by C.-A. Azencott,
 * « Introduction au Machine Learning », Dunod). Frame references below
 * point at the beamer frames of that file :
 *  - frames « Distances — variables quantitatives » (euclidienne,
 *    Manhattan, Minkowski, Chebyshev, Mahalanobis) ;
 *  - « Choix d'une partition » : B_n = (1/e) Σ_{K≥1} Kⁿ/K! (nombre de Bell,
 *    B_50 ≥ 10^48) → bellNumber ; critère R(homogénéité, séparabilité) ;
 *  - « Homogénéité », « Séparabilité », « Indice de Davies-Bouldin »,
 *    « Coefficient de silhouette », « Inertie intra et inter classes » ;
 *  - section « Clustering hiérarchique » : frames « Principe », « Distance
 *    entre deux clusters » (simple / complet / moyen / centroïde / Ward :
 *    |C_k||C_ℓ|/(|C_k|+|C_ℓ|)·‖μ_k−μ_ℓ‖² = gain de variance intra-classe),
 *    « Dendogramme », « Choix du nombre de clusters » ;
 *  - section « Les K-moyennes » : frames « Principe », « Algorithme de
 *    Lloyd » (+ variante), « Répétition de la procédure » (restarts),
 *    « Choix de K » (coudure), « Données aberrantes ».
 *
 * Conventions:
 * - points are plain number arrays; the ambient dimension d is inferred;
 * - unless a function takes an explicit distance, the Euclidean distance is
 *   used (remarque, frame « Distances — variables quantitatives » : on
 *   considère souvent la distance euclidienne, notée ‖·‖);
 * - partitions are integer label arrays in {0, …, K-1};
 * - deterministic randomness uses mulberry32 + combineSeed from util.ts.
 */
import { combineSeed, mulberry32 } from './util';

export type Point = number[];
export type Linkage = 'single' | 'complete' | 'average' | 'centroid' | 'ward';

// ── Distances ──────────────────────────────────────────────────────────────
// Frames « Choix d'une distance » and « Distances — variables quantitatives ».

function checkSameLength(x: Point, y: Point): void {
	if (x.length === 0) throw new Error('points must have at least one coordinate');
	if (x.length !== y.length) {
		throw new Error(`points must have the same dimension, got ${x.length} and ${y.length}`);
	}
}

export function euclidean(x: Point, y: Point): number {
	checkSameLength(x, y);
	let s = 0;
	for (let i = 0; i < x.length; i++) s += (x[i] - y[i]) ** 2;
	return Math.sqrt(s);
}

export function manhattan(x: Point, y: Point): number {
	checkSameLength(x, y);
	let s = 0;
	for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]);
	return s;
}

/**
 * Minkowski distance with exponent p ≥ 1; `p = Infinity` is the Chebyshev
 * distance (frame « Distances — variables quantitatives »).
 */
export function minkowski(x: Point, y: Point, p: number): number {
	checkSameLength(x, y);
	if (!Number.isFinite(p) ? p !== Infinity : p < 1) {
		throw new Error(`p must be ≥ 1 or Infinity, got ${p}`);
	}
	if (p === Infinity) return chebyshev(x, y);
	let s = 0;
	for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]) ** p;
	return s ** (1 / p);
}

export function chebyshev(x: Point, y: Point): number {
	checkSameLength(x, y);
	let m = 0;
	for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i] - y[i]));
	return m;
}

/** Invert a square matrix by Gauss-Jordan elimination with partial pivoting. */
export function invertMatrix(M: number[][]): number[][] {
	const n = M.length;
	if (n === 0) throw new Error('cannot invert an empty matrix');
	for (let i = 0; i < n; i++) {
		if (M[i].length !== n) throw new Error('matrix must be square');
	}
	// Work on [M | I]
	const A = M.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
	for (let col = 0; col < n; col++) {
		let pivot = col;
		for (let r = col + 1; r < n; r++) {
			if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
		}
		if (Math.abs(A[pivot][col]) < 1e-12) throw new Error('matrix is singular (or nearly so)');
		[A[col], A[pivot]] = [A[pivot], A[col]];
		const d = A[col][col];
		for (let j = 0; j < 2 * n; j++) A[col][j] /= d;
		for (let r = 0; r < n; r++) {
			if (r === col) continue;
			const f = A[r][col];
			if (f === 0) continue;
			for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[col][j];
		}
	}
	return A.map((row) => row.slice(n));
}

/**
 * Mahalanobis distance √((x−y)ᵀ Σ⁻¹ (x−y)), with Σ the (empirical)
 * covariance matrix (frame « Distances — variables quantitatives »).
 */
export function mahalanobis(x: Point, y: Point, Sigma: number[][]): number {
	checkSameLength(x, y);
	const d = x.length;
	if (Sigma.length !== d || Sigma.some((row) => row.length !== d)) {
		throw new Error(`Sigma must be a ${d}×${d} matrix`);
	}
	const inv = invertMatrix(Sigma);
	const diff = x.map((v, i) => v - y[i]);
	let s = 0;
	for (let i = 0; i < d; i++) {
		let acc = 0;
		for (let j = 0; j < d; j++) acc += inv[i][j] * diff[j];
		s += diff[i] * acc;
	}
	if (s < 0 && s > -1e-9) s = 0; // guard against tiny negative round-off
	if (s < 0) throw new Error('Sigma does not look positive semi-definite');
	return Math.sqrt(s);
}

/** Empirical covariance matrix of a point cloud. */
export function empiricalCovariance(points: Point[]): number[][] {
	const n = points.length;
	if (n < 2) throw new Error('empirical covariance needs at least 2 points');
	const d = points[0].length;
	if (points.some((p) => p.length !== d)) throw new Error('points must have the same dimension');
	const mu = Array.from({ length: d }, (_, j) => points.reduce((s, p) => s + p[j], 0) / n);
	const C = Array.from({ length: d }, () => new Array(d).fill(0));
	for (const p of points) {
		for (let i = 0; i < d; i++) {
			for (let j = i; j < d; j++) {
				C[i][j] += (p[i] - mu[i]) * (p[j] - mu[j]);
			}
		}
	}
	for (let i = 0; i < d; i++) for (let j = i + 1; j < d; j++) C[j][i] = C[i][j];
	for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) C[i][j] /= n - 1;
	return C;
}

/**
 * Radius of the unit ball of the 2-D Minkowski norm p as a function of angle:
 * r(θ) = (|cos θ|^p + |sin θ|^p)^(-1/p); p = 1 → diamond, p = 2 → circle,
 * p = ∞ → square. Used by the distance landscape demo.
 */
export function minkowskiUnitBall(p: number, n = 128): { r: number; theta: number }[] {
	if (!Number.isFinite(p) ? p !== Infinity : p < 1) {
		throw new Error(`p must be ≥ 1 or Infinity, got ${p}`);
	}
	return Array.from({ length: n }, (_, i) => {
		const theta = (2 * Math.PI * i) / n;
		const c = Math.abs(Math.cos(theta));
		const s = Math.abs(Math.sin(theta));
		const r = p === Infinity ? 1 / Math.max(c, s, 1e-12) : (c ** p + s ** p) ** (-1 / p);
		return { r, theta };
	});
}

/**
 * Unit ball of the 2-D Mahalanobis distance: r(θ) = 1/√(uᵀ Σ⁻¹ u) with
 * u = (cos θ, sin θ). Ellipse in general, circle when Σ = I.
 */
export function mahalanobisUnitBall(Sigma: number[][], n = 128): { r: number; theta: number }[] {
	if (Sigma.length !== 2 || Sigma.some((row) => row.length !== 2)) {
		throw new Error('mahalanobisUnitBall expects a 2×2 covariance matrix');
	}
	const inv = invertMatrix(Sigma);
	return Array.from({ length: n }, (_, i) => {
		const theta = (2 * Math.PI * i) / n;
		const u = [Math.cos(theta), Math.sin(theta)];
		const q = u[0] * (inv[0][0] * u[0] + inv[0][1] * u[1]) + u[1] * (inv[1][0] * u[0] + inv[1][1] * u[1]);
		return { r: 1 / Math.sqrt(q), theta };
	});
}

// ── Data generators ────────────────────────────────────────────────────────
// Illustrative seeded datasets for the demos (not data from the slides).

function gaussianPair(rand: () => number): [number, number] {
	let u1 = rand();
	while (u1 === 0) u1 = rand();
	const u2 = rand();
	const r = Math.sqrt(-2 * Math.log(u1));
	return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

/**
 * k Gaussian blobs of nPerBlob 2-D points centered on a circle of radius 4.
 * Illustrative dataset for the clustering demos.
 */
export function generateBlobs(
	k: number,
	nPerBlob: number,
	seed: number,
	spread = 0.7
): Point[] {
	if (!Number.isInteger(k) || k < 1) throw new Error(`k must be a positive integer, got ${k}`);
	if (!Number.isInteger(nPerBlob) || nPerBlob < 1) {
		throw new Error(`nPerBlob must be a positive integer, got ${nPerBlob}`);
	}
	if (spread <= 0) throw new Error(`spread must be positive, got ${spread}`);
	const points: Point[] = [];
	for (let j = 0; j < k; j++) {
		const angle = (2 * Math.PI * j) / k;
		const cx = k === 1 ? 0 : 4 * Math.cos(angle);
		const cy = k === 1 ? 0 : 4 * Math.sin(angle);
		const rand = mulberry32(combineSeed(seed, j + 1));
		for (let i = 0; i < nPerBlob; i++) {
			const [g0, g1] = gaussianPair(rand);
			points.push([cx + spread * g0, cy + spread * g1]);
		}
	}
	return points;
}

/**
 * Two concentric rings in 2-D (inner radius 1.5, outer radius 3.5) — the
 * classic non-convex shape k-means cannot recover (frame « Remarques —
 * Forme des clusters »).
 */
export function generateConcentricRings(nPerRing: number, seed: number): Point[] {
	if (!Number.isInteger(nPerRing) || nPerRing < 2) {
		throw new Error(`nPerRing must be an integer ≥ 2, got ${nPerRing}`);
	}
	const makeRing = (radius: number, stream: number): Point[] => {
		const rand = mulberry32(combineSeed(seed, stream));
		return Array.from({ length: nPerRing }, () => {
			const [g, u] = gaussianPair(rand);
			const r = radius + 0.15 * g;
			const theta = 2 * Math.PI * u;
			return [r * Math.cos(theta), r * Math.sin(theta)];
		});
	};
	return [...makeRing(1.5, 1), ...makeRing(3.5, 2)];
}

/**
 * Gaussian blobs plus nOutliers points placed far away (radius ≈ 10–12) —
 * for the outlier-sensitivity demo (frame « Données abberrantes »).
 */
export function generateBlobsWithOutliers(
	k: number,
	nPerBlob: number,
	nOutliers: number,
	seed: number,
	spread = 0.7
): { points: Point[]; outlierIndices: number[] } {
	if (!Number.isInteger(nOutliers) || nOutliers < 0) {
		throw new Error(`nOutliers must be a non-negative integer, got ${nOutliers}`);
	}
	const points = generateBlobs(k, nPerBlob, seed, spread);
	const rand = mulberry32(combineSeed(seed, 1000));
	const outlierIndices: number[] = [];
	for (let i = 0; i < nOutliers; i++) {
		const theta = 2 * Math.PI * rand();
		const r = 10 + 2 * rand();
		outlierIndices.push(points.length);
		points.push([r * Math.cos(theta), r * Math.sin(theta)]);
	}
	return { points, outlierIndices };
}

// ── Inertias and cluster quality criteria ──────────────────────────────────
// Frames « Homogénéité », « Séparabilité », « Indice de Davies-Bouldin »,
// « Coefficient de silhouette », « Inertie intra et inter classes ».

export function clusterCentroid(points: Point[], labels: number[], k: number): Point {
	const d = points[0].length;
	const centroid = new Array(d).fill(0);
	let count = 0;
	for (let i = 0; i < points.length; i++) {
		if (labels[i] !== k) continue;
		count++;
		for (let j = 0; j < d; j++) centroid[j] += points[i][j];
	}
	if (count === 0) throw new Error(`cluster ${k} is empty`);
	return centroid.map((v) => v / count);
}

export function clusterSizes(labels: number[], k: number): number[] {
	const sizes = new Array(k).fill(0);
	for (const label of labels) sizes[label]++;
	return sizes;
}

function inferK(labels: number[]): number {
	if (labels.length === 0) throw new Error('labels must be non-empty');
	const k = Math.max(...labels) + 1;
	for (const label of labels) {
		if (!Number.isInteger(label) || label < 0 || label >= k) {
			throw new Error(`labels must be integers in {0, …, ${k - 1}}`);
		}
	}
	return k;
}

/** I = Σᵢ ‖xᵢ − μ‖², total inertia around the overall centroid μ. */
export function inertiaTotal(points: Point[]): number {
	const n = points.length;
	if (n === 0) throw new Error('points must be non-empty');
	const d = points[0].length;
	const mu = Array.from({ length: d }, (_, j) => points.reduce((s, p) => s + p[j], 0) / n);
	let s = 0;
	for (const p of points) for (let j = 0; j < d; j++) s += (p[j] - mu[j]) ** 2;
	return s;
}

/** I_W = Σ_k Σ_{x∈𝒞_k} ‖x − μ_k‖² (intra-class inertia, « homogeneity »). */
export function inertiaIntra(points: Point[], labels: number[]): number {
	const k = inferK(labels);
	let s = 0;
	for (let c = 0; c < k; c++) {
		const members = points.filter((_, i) => labels[i] === c);
		if (members.length === 0) continue;
		const mu = clusterCentroid(members, members.map(() => 0), 0);
		for (const p of members) for (let j = 0; j < p.length; j++) s += (p[j] - mu[j]) ** 2;
	}
	return s;
}

/** I_B = Σ_k |𝒞_k| ‖μ_k − μ‖² (inter-class inertia, « heterogeneity »). */
export function inertiaInter(points: Point[], labels: number[]): number {
	const k = inferK(labels);
	const n = points.length;
	const d = points[0].length;
	const mu = Array.from({ length: d }, (_, j) => points.reduce((s, p) => s + p[j], 0) / n);
	let s = 0;
	for (let c = 0; c < k; c++) {
		const members = points.filter((_, i) => labels[i] === c);
		if (members.length === 0) continue;
		const muC = clusterCentroid(members, members.map(() => 0), 0);
		for (let j = 0; j < d; j++) s += members.length * (muC[j] - mu[j]) ** 2;
	}
	return s;
}

/**
 * Homogeneity (tightness): T_k = (1/|𝒞_k|) Σ_{x∈𝒞_k} d(x, μ_k),
 * T = (1/K) Σ_k T_k. Empty clusters contribute 0 to T_k.
 */
export function homogeneity(points: Point[], labels: number[]): { T: number[]; TGlobal: number } {
	const k = inferK(labels);
	const T = new Array(k).fill(0);
	for (let c = 0; c < k; c++) {
		const members = points.filter((_, i) => labels[i] === c);
		if (members.length === 0) continue;
		const mu = clusterCentroid(members, members.map(() => 0), 0);
		let s = 0;
		for (const p of members) s += euclidean(p, mu);
		T[c] = s / members.length;
	}
	return { T, TGlobal: T.reduce((a, b) => a + b, 0) / k };
}

/**
 * Separability: S_kℓ = d(μ_k, μ_ℓ), S = 2/(K(K−1)) Σ_{k<ℓ} S_kℓ.
 * Requires K ≥ 2 and non-empty clusters.
 */
export function separability(points: Point[], labels: number[]): { pairwise: number[][]; SGlobal: number } {
	const k = inferK(labels);
	if (k < 2) throw new Error('separability requires at least 2 clusters');
	const sizes = clusterSizes(labels, k);
	for (let c = 0; c < k; c++) {
		if (sizes[c] === 0) throw new Error(`cluster ${c} is empty; separability requires non-empty clusters`);
	}
	const centroids = Array.from({ length: k }, (_, c) => {
		const members = points.filter((_, i) => labels[i] === c);
		return clusterCentroid(members, members.map(() => 0), 0);
	});
	const pairwise = Array.from({ length: k }, () => new Array(k).fill(0));
	let sum = 0;
	for (let a = 0; a < k; a++) {
		for (let b = a + 1; b < k; b++) {
			pairwise[a][b] = pairwise[b][a] = euclidean(centroids[a], centroids[b]);
			sum += pairwise[a][b];
		}
	}
	return { pairwise, SGlobal: (2 * sum) / (k * (k - 1)) };
}

/**
 * Davies-Bouldin index: D_k = max_{ℓ≠k} (T_k + T_ℓ)/S_kℓ,
 * D = (1/K) Σ_k D_k (minimize). Requires K ≥ 2 and non-empty clusters.
 */
export function daviesBouldin(
	points: Point[],
	labels: number[]
): { D: number[]; DGlobal: number } {
	const k = inferK(labels);
	if (k < 2) throw new Error('Davies-Bouldin requires at least 2 clusters');
	const sizes = clusterSizes(labels, k);
	for (let c = 0; c < k; c++) {
		if (sizes[c] === 0) throw new Error(`cluster ${c} is empty; Davies-Bouldin requires non-empty clusters`);
	}
	const { T } = homogeneity(points, labels);
	const { pairwise } = separability(points, labels);
	const D = Array.from({ length: k }, (_, c) => {
		let worst = 0;
		for (let l = 0; l < k; l++) {
			if (l === c) continue;
			if (pairwise[c][l] === 0) throw new Error('two clusters share the same centroid');
			worst = Math.max(worst, (T[c] + T[l]) / pairwise[c][l]);
		}
		return worst;
	});
	return { D, DGlobal: D.reduce((a, b) => a + b, 0) / k };
}

/**
 * Silhouette coefficient: s(x) = (b(x) − a(x)) / max(a(x), b(x)) ∈ [−1, 1],
 * a(x) = mean distance from x to the other points of its own cluster,
 * b(x) = smallest mean distance from x to the points of another cluster.
 * s = (1/n) Σ s(xᵢ) (maximize). Convention: s(x) = 0 for points in a
 * singleton cluster (a(x) undefined) and when max(a, b) = 0.
 * Requires at least 2 non-empty clusters overall; empty clusters are ignored
 * in the b(x) minimum.
 */
export function silhouette(points: Point[], labels: number[]): { s: number[]; sGlobal: number } {
	const k = inferK(labels);
	const nonEmpty: number[] = [];
	for (let c = 0; c < k; c++) {
		if (labels.includes(c)) nonEmpty.push(c);
	}
	if (nonEmpty.length < 2) throw new Error('silhouette requires at least 2 non-empty clusters');
	const n = points.length;
	const d = points[0].length;
	// Precompute the mean distance from each point to each cluster.
	const meanToCluster: number[][] = Array.from({ length: n }, () => new Array(k).fill(NaN));
	for (const c of nonEmpty) {
		const members = labels.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0);
		for (let i = 0; i < n; i++) {
			let s = 0;
			for (const j of members) {
				let acc = 0;
				for (let q = 0; q < d; q++) acc += (points[i][q] - points[j][q]) ** 2;
				s += Math.sqrt(acc);
			}
			meanToCluster[i][c] = s / members.length;
		}
	}
	const sArr: number[] = [];
	for (let i = 0; i < n; i++) {
		const c = labels[i];
		const ownSize = labels.filter((l) => l === c).length;
		if (ownSize === 1) {
			sArr.push(0);
			continue;
		}
		// a(x): mean distance to the OTHER points of the own cluster.
		const a = (meanToCluster[i][c] * ownSize) / (ownSize - 1);
		// b(x): min over other non-empty clusters.
		let b = Infinity;
		for (const l of nonEmpty) {
			if (l !== c) b = Math.min(b, meanToCluster[i][l]);
		}
		const denom = Math.max(a, b);
		sArr.push(denom === 0 ? 0 : (b - a) / denom);
	}
	return { s: sArr, sGlobal: sArr.reduce((x, y) => x + y, 0) / n };
}

// ── Hierarchical agglomerative clustering (CAH) ────────────────────────────
// Section « Clustering hiérarchique », frames « Principe »,
// « Distance entre deux clusters », « Dendogramme ».

export interface Merge {
	/** Node id of the left child (leaf ids are 0..n−1, merges n, n+1, …). */
	a: number;
	/** Node id of the right child. */
	b: number;
	/** Distance between the two merged clusters (branch length in the dendrogram). */
	height: number;
	/** Size of the merged cluster. */
	size: number;
}

export interface Hierarchy {
	n: number;
	merges: Merge[];
}

interface ActiveCluster {
	/** Node id: leaves are 0..n−1, internal nodes n, n+1, …. */
	nodeId: number;
	members: number[];
	centroid: Point;
}

function pairwisePointDistance(a: Point, b: Point): number {
	return euclidean(a, b);
}

/**
 * Agglomerative hierarchical clustering (CAH) with the given linkage:
 * - 'single'   : min d(x,y) over x∈𝒞_k, y∈𝒞_ℓ (lien simple)
 * - 'complete' : max d(x,y) (lien complet)
 * - 'average'  : mean d(x,y) (lien moyen)
 * - 'centroid' : d(μ_k, μ_ℓ) (lien centroïdal)
 * - 'ward'     : |𝒞_k||𝒞_ℓ|/(|𝒞_k|+|𝒞_ℓ|) ‖μ_k − μ_ℓ‖² (distance de Ward)
 * Ties are broken by the smallest (i, j) index pair, keeping the result
 * deterministic.
 */
export function hierarchicalAgglomerative(points: Point[], linkage: Linkage): Hierarchy {
	const n = points.length;
	if (n < 2) throw new Error('hierarchical agglomerative clustering needs at least 2 points');
	if (!points.every((p) => p.length === points[0].length)) {
		throw new Error('points must have the same dimension');
	}
	const linkages: Linkage[] = ['single', 'complete', 'average', 'centroid', 'ward'];
	if (!linkages.includes(linkage)) throw new Error(`unknown linkage: ${linkage}`);

	const dist = (a: Point, b: Point) => pairwisePointDistance(a, b);
	let clusters: ActiveCluster[] = points.map((p, i) => ({ nodeId: i, members: [i], centroid: [...p] }));
	const merges: Merge[] = [];
	while (clusters.length > 1) {
		const m = clusters.length;
		let bestI = 0;
		let bestJ = 1;
		let best = Infinity;
		for (let i = 0; i < m; i++) {
			for (let j = i + 1; j < m; j++) {
				const d = clusterDistance(clusters[i], clusters[j], linkage, points, dist);
				if (d < best - 1e-12) {
					best = d;
					bestI = i;
					bestJ = j;
				}
			}
		}
		const a = clusters[bestI];
		const b = clusters[bestJ];
		const members = [...a.members, ...b.members];
		const size = members.length;
		const centroid = Array.from({ length: points[0].length }, (_, q) =>
			members.reduce((s, idx) => s + points[idx][q], 0) / size
		);
		// The new cluster takes the next internal node id (n, n+1, … in merge
		// order); merge t (0-based) is the record of node n+t.
		const t = merges.length;
		merges.push({ a: a.nodeId, b: b.nodeId, height: best, size });
		// Replace the two clusters by their union, keeping the array order.
		const next = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ);
		next.push({ nodeId: n + t, members, centroid });
		clusters = next;
	}
	return { n, merges };
}

function clusterDistance(
	a: ActiveCluster,
	b: ActiveCluster,
	linkage: Linkage,
	points: Point[],
	dist: (p: Point, q: Point) => number
): number {
	switch (linkage) {
		case 'single':
		case 'complete':
		case 'average': {
			let acc = 0;
			let count = 0;
			let min = Infinity;
			let max = -Infinity;
			for (const i of a.members) {
				for (const j of b.members) {
					const d = dist(points[i], points[j]);
					acc += d;
					count++;
					if (d < min) min = d;
					if (d > max) max = d;
				}
			}
			return linkage === 'single' ? min : linkage === 'complete' ? max : acc / count;
		}
		case 'centroid':
			return euclidean(a.centroid, b.centroid);
		case 'ward': {
			const w = (a.members.length * b.members.length) / (a.members.length + b.members.length);
			return w * euclidean(a.centroid, b.centroid) ** 2;
		}
	}
}

/**
 * Apply a subset of the merges of h (in merge order) with union-find over the
 * leaves, then label the connected components in the order of their smallest
 * member index (deterministic labels in {0, …, K−1}).
 */
function labelAfterMerges(h: Hierarchy, apply: (t: number, height: number) => boolean): number[] {
	const n = h.n;
	const parent = Array.from({ length: n }, (_, i) => i);
	const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
	// Resolve an internal node to the DSU root of its (first) leaf: after a
	// union, both child subtrees share the same root, so either child works.
	const nodeRoot = (node: number): number => {
		if (node < n) return find(node);
		const { a } = h.merges[node - n];
		return nodeRoot(a);
	};
	for (let t = 0; t < h.merges.length; t++) {
		if (!apply(t, h.merges[t].height)) continue;
		const { a, b } = h.merges[t];
		const ra = nodeRoot(a);
		const rb = nodeRoot(b);
		if (ra !== rb) parent[rb] = ra;
	}
	const labels = new Array<number>(n);
	const rootToLabel = new Map<number, number>();
	let nextLabel = 0;
	for (let i = 0; i < n; i++) {
		const r = find(i);
		if (!rootToLabel.has(r)) rootToLabel.set(r, nextLabel++);
		labels[i] = rootToLabel.get(r)!;
	}
	return labels;
}

/**
 * Cut the hierarchy after its first n−k merges: returns the partition of the
 * n points into k clusters, with labels in {0, …, k−1} assigned in the order
 * of the smallest member index of each cluster.
 */
export function cutPartition(h: Hierarchy, k: number): number[] {
	const n = h.n;
	if (!Number.isInteger(k) || k < 1 || k > n) {
		throw new Error(`k must be an integer in {1, …, ${n}}, got ${k}`);
	}
	return labelAfterMerges(h, (t) => t < n - k);
}

/**
 * Cut the hierarchy by a distance threshold r: every merge with height ≤ r is
 * applied (frame « Choix du nombre de clusters » : on arrête de fusionner
 * dès que la distance minimale dépasse le seuil r). All merges are scanned,
 * because the 'centroid' linkage can produce non-monotone heights.
 */
export function cutByThreshold(h: Hierarchy, r: number): number[] {
	// r = +Infinity applies every merge (a single cluster).
	if (Number.isNaN(r) || r < 0) throw new Error(`threshold r must be ≥ 0 (or +Infinity), got ${r}`);
	return labelAfterMerges(h, (_t, height) => height <= r);
}

/**
 * Layout data for drawing a dendrogram: leaves get x = 0..n−1 in in-order
 * leaf order, internal nodes x = mean of their children, y = merge height
 * (leaves y = 0). Node ids: leaves 0..n−1, merges n, n+1, …. The root is the
 * last merge.
 */
export function dendrogramLayout(h: Hierarchy): {
	leafOrder: number[];
	x: number[];
	y: number[];
	nodeCount: number;
} {
	const n = h.n;
	const total = 2 * n - 1;
	const x = new Array(total).fill(0);
	const y = new Array(total).fill(0);
	const leafOrder: number[] = [];
	const visit = (node: number): void => {
		if (node < n) {
			leafOrder.push(node);
			x[node] = leafOrder.length - 1;
			y[node] = 0;
			return;
		}
		const { a, b, height } = h.merges[node - n];
		visit(a);
		visit(b);
		x[node] = (x[a] + x[b]) / 2;
		y[node] = height;
	};
	visit(n + h.merges.length - 1);
	return { leafOrder, x, y, nodeCount: total };
}

// ── K-means (Lloyd's algorithm) ────────────────────────────────────────────
// Section « Les K-moyennes », frames « Principe », « Algorithme de Lloyd »,
// « Répétition de la procédure ».

export interface KMeansState {
	labels: number[];
	centers: Point[];
	/** Σᵢ ‖xᵢ − μ_{k(xᵢ)}‖² for the current centers and assignments. */
	inertia: number;
}

export interface KMeansResult {
	/**
	 * states[0] = initial centers + their assignment; each following state =
	 * recomputed centers + their assignment. Inertia is non-increasing along
	 * the sequence (frame « Répétition de la procédure »).
	 */
	states: KMeansState[];
	converged: boolean;
	/** Number of recompute steps actually performed. */
	iterations: number;
}

/**
 * K-means++ initialization (frame « Algorithme de Lloyd » : points choisis
 * de manière à les disperser au maximum). Deterministic for a fixed seed.
 */
export function kmeansPPInit(points: Point[], k: number, seed: number): Point[] {
	const n = points.length;
	if (!Number.isInteger(k) || k < 1) throw new Error(`k must be a positive integer, got ${k}`);
	if (k > n) throw new Error(`k (${k}) cannot exceed dataset size (${n})`);
	const rand = mulberry32(combineSeed(seed, 7));
	const centers: Point[] = [points[Math.floor(rand() * n)].slice()];
	while (centers.length < k) {
		const d2 = points.map((p) =>
			Math.min(...centers.map((c) => {
				let s = 0;
				for (let q = 0; q < p.length; q++) s += (p[q] - c[q]) ** 2;
				return s;
			}))
		);
		const total = d2.reduce((a, b) => a + b, 0);
		let idx: number;
		if (total === 0) {
			idx = Math.floor(rand() * n);
		} else {
			let u = rand() * total;
			idx = 0;
			while (idx < n - 1 && u > d2[idx]) {
				u -= d2[idx];
				idx++;
			}
		}
		centers.push(points[idx].slice());
	}
	return centers;
}

function assignToNearest(points: Point[], centers: Point[]): number[] {
	return points.map((p) => {
		let best = 0;
		let bestD = Infinity;
		for (let c = 0; c < centers.length; c++) {
			let s = 0;
			for (let q = 0; q < p.length; q++) s += (p[q] - centers[c][q]) ** 2;
			if (s < bestD - 1e-12) {
				bestD = s;
				best = c;
			}
		}
		return best;
	});
}

/** Assign each point to the index of its nearest center (ties → smallest index). */
export { assignToNearest as assignToNearestCenter };

function inertiaToCenters(points: Point[], labels: number[], centers: Point[]): number {
	let s = 0;
	for (let i = 0; i < points.length; i++) {
		const c = centers[labels[i]];
		for (let q = 0; q < points[i].length; q++) s += (points[i][q] - c[q]) ** 2;
	}
	return s;
}

/**
 * Lloyd's algorithm (frames « Principe » and « Algorithme de Lloyd »):
 * 1. initialize k centers (random data points, or k-means++);
 * 2. assign each observation to the nearest center (Voronoi cell);
 * 3. recompute each cluster center as the mean of its points (an empty
 *    cluster keeps its previous center);
 * 4. repeat 2–3 until the assignments stop changing (convergence).
 * Deterministic for a fixed seed; `initialCenters` overrides the random /
 * k-means++ step 1 with an explicit (e.g. pedagogical) initialization.
 */
export function kmeansLloyd(
	points: Point[],
	k: number,
	seed: number,
	options: { init?: 'random' | 'pp'; maxIter?: number; initialCenters?: Point[] } = {}
): KMeansResult {
	const { init = 'random', maxIter = 100, initialCenters } = options;
	const n = points.length;
	if (n === 0) throw new Error('points must be non-empty');
	if (!Number.isInteger(k) || k < 1) throw new Error(`k must be a positive integer, got ${k}`);
	if (k > n) throw new Error(`k (${k}) cannot exceed dataset size (${n})`);
	if (!Number.isInteger(maxIter) || maxIter < 1) {
		throw new Error(`maxIter must be a positive integer, got ${maxIter}`);
	}
	const d = points[0].length;
	if (points.some((p) => p.length !== d)) throw new Error('points must have the same dimension');

	let centers: Point[];
	if (initialCenters) {
		// Explicit (deterministic) initialization, e.g. the blob centers.
		if (initialCenters.length !== k) {
			throw new Error(`initialCenters must contain exactly k = ${k} centers, got ${initialCenters.length}`);
		}
		if (initialCenters.some((c) => c.length !== d)) {
			throw new Error('initialCenters must have the same dimension as the points');
		}
		centers = initialCenters.map((c) => c.slice());
	} else if (init === 'pp') {
		centers = kmeansPPInit(points, k, seed);
	} else {
		const rand = mulberry32(combineSeed(seed, 3));
		const idx = Array.from({ length: n }, (_, i) => i);
		// Fisher–Yates, take the first k: distinct data points at random.
		for (let i = n - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[idx[i], idx[j]] = [idx[j], idx[i]];
		}
		centers = idx.slice(0, k).map((i) => points[i].slice());
	}

	const states: KMeansState[] = [];
	let labels = assignToNearest(points, centers);
	states.push({
		labels,
		centers: centers.map((c) => c.slice()),
		inertia: inertiaToCenters(points, labels, centers)
	});

	let converged = false;
	for (let iter = 0; iter < maxIter; iter++) {
		// Step 3: recompute centers.
		const newCenters = centers.map((old, c) => {
			const members = points.filter((_, i) => labels[i] === c);
			if (members.length === 0) return old.slice(); // keep previous center
			return Array.from({ length: d }, (_, q) => members.reduce((s, p) => s + p[q], 0) / members.length);
		});
		// Step 2: reassign.
		const newLabels = assignToNearest(points, newCenters);
		let changed = false;
		for (let i = 0; i < n; i++) {
			if (newLabels[i] !== labels[i]) {
				changed = true;
				break;
			}
		}
		centers = newCenters;
		labels = newLabels;
		states.push({
			labels,
			centers: centers.map((c) => c.slice()),
			inertia: inertiaToCenters(points, labels, centers)
		});
		if (!changed) {
			converged = true;
			break;
		}
	}
	return { states, converged, iterations: states.length - 1 };
}

// ── Bell numbers and the elbow heuristic ───────────────────────────────────

/**
 * Bell number B_n (frame « Choix d'une partition »): B_n = (1/e) Σ_{K≥1} Kⁿ/K!,
 * the number of partitions of a set of n elements. Exact, via the recurrence
 * B_{n+1} = Σ_{k=0}^{n} C(n,k) B_k.
 */
export function bellNumber(n: number): bigint {
	if (!Number.isInteger(n) || n < 0) throw new Error(`n must be a non-negative integer, got ${n}`);
	if (n > 1000) throw new Error(`n too large (max 1000), got ${n}`);
	const B: bigint[] = [1n];
	for (let i = 0; i < n; i++) {
		let acc = 0n;
		let binom = 1n; // C(i, 0)
		for (let k = 0; k <= i; k++) {
			if (k > 0) binom = (binom * BigInt(i - k + 1)) / BigInt(k);
			acc += binom * B[k];
		}
		B.push(acc);
	}
	return B[n];
}

/**
 * Elbow heuristic (frame « Choix de K »): index of the point of the inertia
 * curve farthest from the chord joining its first and last points. ILLUSTRATIVE
 * heuristic — the slides only describe the elbow visually, they give no
 * formula for detecting it.
 */
export function elbowK(inertiaByK: number[]): number {
	const m = inertiaByK.length;
	if (m < 2) throw new Error('elbowK needs at least 2 values');
	if (inertiaByK.some((v) => !Number.isFinite(v) || v < 0)) {
		throw new Error('inertiaByK must contain only finite, non-negative values');
	}
	const x0 = 0;
	const y0 = inertiaByK[0];
	const x1 = m - 1;
	const y1 = inertiaByK[m - 1];
	const dx = x1 - x0;
	const dy = y1 - y0;
	const len2 = dx * dx + dy * dy;
	let bestIdx = 0;
	let bestDist = -1;
	for (let i = 0; i < m; i++) {
		const dist = len2 === 0 ? 0 : Math.abs(dx * (y0 - inertiaByK[i]) - dy * (x0 - i)) / Math.sqrt(len2);
		if (dist > bestDist) {
			bestDist = dist;
			bestIdx = i;
		}
	}
	return bestIdx;
}
