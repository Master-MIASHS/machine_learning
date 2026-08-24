// src/lib/math/vc.ts
//
// Part VI — Cas |H|=+infty : théorie de Vapnik-Chervonenkis
// Reference: theorie.typ — "Dimension de Vapnik-Chervonenkis" (brisure,
// VCdim, coefficient de brisure, lemme de Sauer-Shelah), "Théorème de
// généralisation VC" (Théorème 3.3), "Application : borne VC pour le SVM"
// (Théorème 3.4).

// ---------------------------------------------------------------------------
// Shattering checks for small point sets
// ---------------------------------------------------------------------------

export type Point1D = number;
export type Point2D = [number, number];
export type Labeling = (0 | 1)[];

/** All 2^m labelings of m points, in a fixed (binary-counting) order. */
export function allLabelings(m: number): Labeling[] {
	if (m < 0) throw new Error(`m must be >= 0, got ${m}`);
	const count = 2 ** m;
	const labelings: Labeling[] = [];
	for (let mask = 0; mask < count; mask++) {
		const labeling: Labeling = [];
		for (let i = 0; i < m; i++) labeling.push(((mask >> i) & 1) as 0 | 1);
		labelings.push(labeling);
	}
	return labelings;
}

/**
 * Thresholds on R: h_theta(x) = 1{x >= theta}. A labeling is realizable iff,
 * sorted by x, it never has a 1 immediately followed by a 0 (i.e. it's a
 * 0*1* pattern in sorted order). VCdim = 1.
 */
export function isThresholdRealizable(points: Point1D[], labeling: Labeling): boolean {
	if (points.length !== labeling.length) {
		throw new Error('points and labeling must have the same length');
	}
	const order = points.map((x, i) => ({ x, y: labeling[i] })).sort((a, b) => a.x - b.x);
	for (let i = 1; i < order.length; i++) {
		if (order[i - 1].y === 1 && order[i].y === 0) return false;
	}
	return true;
}

/**
 * Intervals on R: h_{a,b}(x) = 1{a <= x <= b}. A labeling is realizable iff,
 * sorted by x, the 1s form a single contiguous block (0*1*0* pattern).
 * VCdim = 2.
 */
export function isIntervalRealizable(points: Point1D[], labeling: Labeling): boolean {
	if (points.length !== labeling.length) {
		throw new Error('points and labeling must have the same length');
	}
	const order = points
		.map((x, i) => ({ x, y: labeling[i] }))
		.sort((a, b) => a.x - b.x)
		.map((p) => p.y);
	let seenOne = false;
	let seenZeroAfterOne = false;
	for (const y of order) {
		if (y === 1) {
			if (seenZeroAfterOne) return false;
			seenOne = true;
		} else if (seenOne) {
			seenZeroAfterOne = true;
		}
	}
	return true;
}

/**
 * Are two finite point sets in R^2 linearly separable? Tests candidate
 * separator normal directions perpendicular to every pair of points (a
 * standard finite reduction: the optimal separator's normal, when one
 * exists, is always achievable this way for points in general position),
 * then checks for a projection gap. Exact for generic point configurations;
 * may be imprecise for exactly collinear or otherwise degenerate ones — this
 * is a small pedagogical check, not a general-purpose LP solver.
 */
function isLinearlySeparable(pointsA: Point2D[], pointsB: Point2D[]): boolean {
	if (pointsA.length === 0 || pointsB.length === 0) return true;
	const all = [...pointsA, ...pointsB];
	const candidates: Point2D[] = [];
	for (let i = 0; i < all.length; i++) {
		for (let j = i + 1; j < all.length; j++) {
			const dx = all[j][0] - all[i][0];
			const dy = all[j][1] - all[i][1];
			candidates.push([-dy, dx]);
		}
	}
	if (candidates.length === 0) candidates.push([1, 0]);

	for (const [wx, wy] of candidates) {
		const projA = pointsA.map(([x, y]) => wx * x + wy * y);
		const projB = pointsB.map(([x, y]) => wx * x + wy * y);
		const maxA = Math.max(...projA);
		const minA = Math.min(...projA);
		const maxB = Math.max(...projB);
		const minB = Math.min(...projB);
		if (maxA < minB || maxB < minA) return true;
	}
	return false;
}

/**
 * Halfspaces on R^2: h_{w,b}(x) = 1{w.x >= b}. Realizable iff the two
 * labeled classes are linearly separable. VCdim = 3 (more generally d+1 on
 * R^d, but only the 2D case is implemented here — see isLinearlySeparable).
 */
export function isHalfspaceRealizable(points: Point2D[], labeling: Labeling): boolean {
	if (points.length !== labeling.length) {
		throw new Error('points and labeling must have the same length');
	}
	const classA = points.filter((_, i) => labeling[i] === 1);
	const classB = points.filter((_, i) => labeling[i] === 0);
	return isLinearlySeparable(classA, classB);
}

export type HypothesisFamily = 'thresholds' | 'intervals' | 'halfspaces2d';

function isRealizableBy(
	family: HypothesisFamily,
	points: Point1D[] | Point2D[],
	labeling: Labeling
): boolean {
	switch (family) {
		case 'thresholds':
			return isThresholdRealizable(points as Point1D[], labeling);
		case 'intervals':
			return isIntervalRealizable(points as Point1D[], labeling);
		case 'halfspaces2d':
			return isHalfspaceRealizable(points as Point2D[], labeling);
	}
}

/** Does `family` shatter `points` — i.e. is every one of the 2^m labelings realizable? */
export function shatters(family: HypothesisFamily, points: Point1D[] | Point2D[]): boolean {
	return allLabelings(points.length).every((l) => isRealizableBy(family, points, l));
}

/**
 * The number of distinct dichotomies of `points` realized by `family`:
 * |{(h(x1),...,h(xm)) : h in family}|, bounded by 2^m and by the growth
 * function Pi_family(m).
 */
export function countRealizedDichotomies(
	family: HypothesisFamily,
	points: Point1D[] | Point2D[]
): number {
	return allLabelings(points.length).filter((l) => isRealizableBy(family, points, l)).length;
}

// ---------------------------------------------------------------------------
// Growth function and the Sauer-Shelah lemma
// ---------------------------------------------------------------------------

/** n choose k, computed iteratively (stable for moderate n). */
function binomial(n: number, k: number): number {
	if (k < 0 || k > n) return 0;
	const kk = Math.min(k, n - k);
	let result = 1;
	for (let i = 0; i < kk; i++) {
		result = (result * (n - i)) / (i + 1);
	}
	return result;
}

/** The trivial (non-VC) upper bound on any growth function: 2^m. */
export function trivialGrowthBound(m: number): number {
	if (m < 0) throw new Error(`m must be >= 0, got ${m}`);
	return Math.pow(2, m);
}

/**
 * Sauer-Shelah bound: sum_{i=0}^{d} C(m,i) — the polynomial upper bound on
 * the growth function Pi_H(m) whenever VCdim(H) = d.
 */
export function sauerShelahBound(m: number, d: number): number {
	if (m < 0) throw new Error(`m must be >= 0, got ${m}`);
	if (d < 0) throw new Error(`d must be >= 0, got ${d}`);
	let sum = 0;
	const upper = Math.min(d, m);
	for (let i = 0; i <= upper; i++) sum += binomial(m, i);
	return sum;
}

/** The (em/d)^d envelope of the Sauer-Shelah bound, valid for m >= d > 0. */
export function sauerShelahEnvelope(m: number, d: number): number {
	if (d <= 0) throw new Error(`d must be positive, got ${d}`);
	if (m < d) throw new Error(`sauerShelahEnvelope requires m >= d (got m=${m}, d=${d})`);
	return Math.pow((Math.E * m) / d, d);
}

// ---------------------------------------------------------------------------
// VC generalization bound (Théorème 3.3) and the SVM margin application
// (Théorème 3.4)
// ---------------------------------------------------------------------------

/**
 * Théorème 3.3: with probability 1-delta, simultaneously for all h in H
 * with VCdim(H)=d, |R(h)-R_S(h)| <= sqrt((8d*log(2en/d) + 8*log(4/delta))/n).
 */
export function vcGeneralizationBound(d: number, n: number, delta: number): number {
	if (d <= 0) throw new Error(`d must be positive, got ${d}`);
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (n < d) throw new Error(`n must be >= d for this bound to be meaningful (got n=${n}, d=${d})`);
	if (delta <= 0 || delta >= 1) throw new Error(`delta must be in (0,1), got ${delta}`);
	return Math.sqrt((8 * d * Math.log((2 * Math.E * n) / d) + 8 * Math.log(4 / delta)) / n);
}

/**
 * Théorème 3.4: VCdim(H_gamma) <= floor(R^2/gamma^2) for linear classifiers
 * of norm 1 separating data with margin gamma, given ||X_i|| <= R a.s.
 */
export function marginVCDimBound(R: number, gamma: number): number {
	if (R <= 0) throw new Error(`R must be positive, got ${R}`);
	if (gamma <= 0) throw new Error(`gamma must be positive, got ${gamma}`);
	return Math.floor((R * R) / (gamma * gamma));
}

/**
 * The VC generalization bound (Théorème 3.3) applied to the margin-based VC
 * dimension bound (Théorème 3.4) — the SVM application in theorie.typ. Note:
 * theorie.typ's displayed formula writes the log term with the un-floored
 * R^2/gamma^2 for readability; this uses the same floored d consistently in
 * both the coefficient and the log term, which is a strictly more internally
 * consistent (and no less valid) version of the same bound.
 */
export function svmGeneralizationBound(R: number, gamma: number, n: number, delta: number): number {
	const d = marginVCDimBound(R, gamma);
	if (d <= 0) {
		// Margin large enough relative to R that the VC-dim bound rounds down
		// to 0 — the class is trivial here, so there is nothing to bound.
		return 0;
	}
	if (n < d) {
		throw new Error(
			`n must be >= the VC-dim bound d=${d} for this bound to be meaningful (got n=${n})`
		);
	}
	return vcGeneralizationBound(d, n, delta);
}
