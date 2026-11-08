/**
 * Subderivatives, subgradients, the orthonormal-design lasso and the
 * subgradient method — expert lesson « Introduction au sous-gradient »
 * (Part I, route /part1/sous-gradient).
 *
 * Content boundary: subgradients / the subdifferential are **not** in
 * `course_sources/` (verified: no occurrence of "sous-gradient",
 * "sous-différentiel", "sous-dérivée" or "subgradient" anywhere under
 * course_sources/). The only anchors in the sources are:
 *  - course_sources/typst/optim.typ, Exemple 2.8 — Lasso r(w) = ‖w‖₁,
 *    « convexe, non différentiable » ;
 *  - course_sources/typst/regularization.typ, Définition 5.2 — Lasso
 *    θ̂ = argmin ‖y − Xθ‖² + λ‖θ‖₁ (no ½ factor: orthonormal threshold λ/2).
 * Everything else is an extension beyond the sources. Primary references
 * (see expert/part1/lessons/sous-gradient-introduction.research.md):
 *  [BV]   Boyd, Duchi, Pilanci, Vandenberghe, EE364b notes « Subgradients »
 *         (2022) — §2 (closed, convex; nonempty & bounded on int dom f),
 *         §2.2 (differentiable ⇔ ∂f = {∇f}), §2.3 (0 ∈ ∂f(x*) ⇔ minimizer),
 *         §3.1–3.2 (scaling, sum). VERIFIED.
 *  [BP14] Boyd (with J. Park), EE364b notes « Subgradient Methods » (2014) —
 *         §1/§2.1 (not a descent method), §3.2 eq. (3) (best-iterate bound,
 *         constant step → G²α/2), §3.3 (αᵢ = R/(G√k) ⇒ RG/√k). VERIFIED.
 *  [R70]  Rockafellar, Convex Analysis, 1970 — general reference; theorem
 *         numbers (23.8 sum rule, 24.1 one-sided derivatives, 25.1
 *         differentiability) UNVERIFIED against the book, not cited visibly.
 *  [N04]  Nesterov, Introductory Lectures on Convex Optimization, 2004 —
 *         §3.2 subgradient method; theorem number UNVERIFIED.
 *  [T96]  Tibshirani, JRSS-B 58(1):267–288, 1996 — §2.2 eq. (3), orthonormal
 *         case in the *constrained* form (γ fixed by Σ|β̂ⱼ| = t). VERIFIED.
 *  [HTF09] Hastie, Tibshirani, Friedman, ESL (2nd ed.), 2009 — eq. (3.52)
 *         (½-scaled penalized lasso) and Table 3.4 (threshold λ). VERIFIED.
 *
 * Lasso convention in this module: F(w) = ½‖y − Xw‖² + λ‖w‖₁ (same as
 * `lassoObjectiveValue` in proximal.ts), so the orthonormal threshold is λ.
 */

import { softThreshold } from './regularization.js';
import { combineSeed, mulberry32 } from './util.js';

export type Interval = [number, number];

// ─── 1-D subderivatives ─────────────────────────────────────────────

/**
 * Numerical one-sided derivatives f'₋(x) = lim (f(x) − f(x−h))/h and
 * f'₊(x) = lim (f(x+h) − f(x))/h, approximated with a small h.
 * For a convex f, ∂f(x) = [f'₋(x), f'₊(x)] ([R70], 1-D case — theorem number unverified).
 */
export function oneSidedDerivatives(f: (x: number) => number, x: number, h = 1e-6): Interval {
	if (!Number.isFinite(x)) throw new Error(`oneSidedDerivatives: x must be finite (got ${x})`);
	if (!(h > 0)) throw new Error(`oneSidedDerivatives: h must be > 0 (got ${h})`);
	const fx = f(x);
	return [(fx - f(x - h)) / h, (f(x + h) - fx) / h];
}

/**
 * Subdifferential of |·| at x: {sign x} if x ≠ 0, the interval [−1, 1] at 0
 * ([BV] « Subgradients », absolute value example).
 */
export function absSubdifferential(x: number): Interval {
	if (!Number.isFinite(x)) throw new Error(`absSubdifferential: x must be finite (got ${x})`);
	if (x > 0) return [1, 1];
	if (x < 0) return [-1, -1];
	return [-1, 1];
}

/**
 * Subdifferential of ‖·‖₁ at w: since ‖w‖₁ = Σ|w_j| is separable,
 * ∂‖w‖₁ is the Cartesian product of the ∂|w_j| ([BV], separable sum rule).
 * Returned as one interval per coordinate.
 */
export function l1Subdifferential(w: number[]): Interval[] {
	if (w.length === 0) throw new Error('l1Subdifferential: w must be non-empty');
	return w.map((wj) => absSubdifferential(wj));
}

/**
 * Checks the subgradient inequality f(y) ≥ f(x) + c·(y − x) on a finite grid
 * of y values (definition of a subderivative, [BV] « Subgradients » §1).
 * A grid check is only a *necessary* test (it cannot see between grid
 * points), which is enough for the demo's piecewise-linear / quadratic
 * functions when the grid contains x and the kinks.
 */
export function isSubgradient1D(
	f: (x: number) => number,
	x: number,
	c: number,
	grid: number[],
	tol = 1e-9
): boolean {
	if (grid.length === 0) throw new Error('isSubgradient1D: grid must be non-empty');
	if (!Number.isFinite(c)) throw new Error(`isSubgradient1D: c must be finite (got ${c})`);
	const fx = f(x);
	return grid.every((y) => f(y) >= fx + c * (y - x) - tol);
}

/**
 * The 1-D functions used by the demo E.1 with their exact subdifferentials.
 *  - abs   : |x|          → absSubdifferential
 *  - relu  : max(0, x)    → {0} (x<0), [0,1] (x=0), {1} (x>0)
 *  - square: x²           → {2x} (differentiable)
 *  - hinge : max(0, 1−x)  → {−1} (x<1), [−1,0] (x=1), {0} (x>1)
 */
export type Convex1DName = 'abs' | 'relu' | 'square' | 'hinge';

export function convex1D(name: Convex1DName): (x: number) => number {
	switch (name) {
		case 'abs':
			return (x) => Math.abs(x);
		case 'relu':
			return (x) => Math.max(0, x);
		case 'square':
			return (x) => x * x;
		case 'hinge':
			return (x) => Math.max(0, 1 - x);
		default:
			throw new Error(`convex1D: unknown function "${name as string}"`);
	}
}

export function convex1DSubdifferential(name: Convex1DName, x: number): Interval {
	if (!Number.isFinite(x)) throw new Error(`convex1DSubdifferential: x must be finite (got ${x})`);
	switch (name) {
		case 'abs':
			return absSubdifferential(x);
		case 'relu':
			return x > 0 ? [1, 1] : x < 0 ? [0, 0] : [0, 1];
		case 'square':
			return [2 * x, 2 * x];
		case 'hinge':
			return x < 1 ? [-1, -1] : x > 1 ? [0, 0] : [-1, 0];
		default:
			throw new Error(`convex1DSubdifferential: unknown function "${name as string}"`);
	}
}

// ─── Lasso with orthonormal design ───────────────────────────────────

function checkLambda(lambda: number, who: string): void {
	if (!(lambda >= 0) || !Number.isFinite(lambda)) {
		throw new Error(`${who}: lambda must be a finite number >= 0 (got ${lambda})`);
	}
}

/**
 * argmin_w ½(w − z)² + λ|w| = S(z, λ) = sign(z)·max(|z| − λ, 0).
 * Derived from 0 ∈ w − z + λ∂|w| by case analysis on the sign of w
 * ([T96] orthonormal case; [HTF09] Table 3.4). Reuses `softThreshold`
 * (regularization.ts).
 */
export function lassoOrthonormal1D(z: number, lambda: number): number {
	checkLambda(lambda, 'lassoOrthonormal1D');
	if (!Number.isFinite(z)) throw new Error(`lassoOrthonormal1D: z must be finite (got ${z})`);
	return softThreshold(z, lambda);
}

/**
 * Ridge counterpart for comparison: argmin_w ½(w − z)² + (λ/2)w² = z/(1 + λ)
 * (differentiable objective — set the derivative to zero). Shrinks but never
 * zeroes a coordinate with z ≠ 0.
 */
export function ridgeOrthonormal1D(z: number, lambda: number): number {
	checkLambda(lambda, 'ridgeOrthonormal1D');
	if (!Number.isFinite(z)) throw new Error(`ridgeOrthonormal1D: z must be finite (got ${z})`);
	return z / (1 + lambda);
}

/**
 * Distance from 0 to the subdifferential of w ↦ ½‖w − z‖² + λ‖w‖₁, i.e. to
 * the set w − z + λ∂‖w‖₁ (Euclidean norm over coordinates). It is 0 exactly
 * at the minimizer (optimality criterion 0 ∈ ∂F(w*), [BV] « Subgradients »).
 */
export function lassoOptimalityResidual(w: number[], z: number[], lambda: number): number {
	checkLambda(lambda, 'lassoOptimalityResidual');
	if (w.length !== z.length || w.length === 0) {
		throw new Error(`lassoOptimalityResidual: w and z must have the same non-zero length`);
	}
	let s = 0;
	for (let j = 0; j < w.length; j++) {
		const [lo, hi] = absSubdifferential(w[j]);
		const a = w[j] - z[j] + lambda * lo;
		const b = w[j] - z[j] + lambda * hi;
		// distance from 0 to the interval [a, b]
		const dist = a > 0 ? a : b < 0 ? -b : 0;
		s += dist * dist;
	}
	return Math.sqrt(s);
}

/** Max |(XᵀX − I)_{jk}| — 0 for orthonormal columns. */
export function orthonormalityDefect(X: number[][]): number {
	const n = X.length;
	if (n === 0) throw new Error('orthonormalityDefect: X must be non-empty');
	const d = X[0].length;
	let worst = 0;
	for (let j = 0; j < d; j++) {
		for (let k = 0; k < d; k++) {
			let s = 0;
			for (let i = 0; i < n; i++) s += X[i][j] * X[i][k];
			worst = Math.max(worst, Math.abs(s - (j === k ? 1 : 0)));
		}
	}
	return worst;
}

/**
 * Lasso min ½‖y − Xw‖² + λ‖w‖₁ for a design with orthonormal columns
 * (XᵀX = I). Then ½‖y − Xw‖² = ½‖w − z‖² + const with z = Xᵀy (= OLS
 * estimate), the problem separates, and w*_j = S(z_j, λ) ([T96], [HTF09]
 * Table 3.4). Throws if XᵀX is not the identity (up to `tol`).
 */
export function lassoOrthonormal(X: number[][], y: number[], lambda: number, tol = 1e-8): number[] {
	checkLambda(lambda, 'lassoOrthonormal');
	const n = X.length;
	if (n === 0 || y.length !== n) throw new Error('lassoOrthonormal: X must be n×d and y of length n');
	if (orthonormalityDefect(X) > tol) {
		throw new Error('lassoOrthonormal: the columns of X must be orthonormal (XᵀX = I)');
	}
	const d = X[0].length;
	const z = new Array(d).fill(0);
	for (let i = 0; i < n; i++) for (let j = 0; j < d; j++) z[j] += X[i][j] * y[i];
	return z.map((zj) => softThreshold(zj, lambda));
}

/**
 * Seeded n×d matrix with orthonormal columns (modified Gram–Schmidt on a
 * U(−1,1) matrix). Requires d ≤ n. Deterministic for a given seed.
 */
export function orthonormalColumns(n: number, d: number, seed = 7): number[][] {
	if (!Number.isInteger(n) || !Number.isInteger(d) || d < 1 || n < d) {
		throw new Error(`orthonormalColumns: need integers 1 <= d <= n (got n=${n}, d=${d})`);
	}
	const rng = mulberry32(combineSeed(seed, 17));
	const cols: number[][] = [];
	while (cols.length < d) {
		let v = Array.from({ length: n }, () => rng() * 2 - 1);
		for (const q of cols) {
			const dot = v.reduce((s, vi, i) => s + vi * q[i], 0);
			v = v.map((vi, i) => vi - dot * q[i]);
		}
		const norm = Math.sqrt(v.reduce((s, vi) => s + vi * vi, 0));
		if (norm > 1e-8) cols.push(v.map((vi) => vi / norm));
	}
	return Array.from({ length: n }, (_, i) => cols.map((q) => q[i]));
}

// ─── Subgradient method ─────────────────────────────────────────────

export type SubgradientStepRule = 'constant' | 'diminishing';

export interface SubgradientMethodOptions {
	f: (x: number[]) => number;
	/** Returns *one* subgradient g ∈ ∂f(x). */
	subgrad: (x: number[]) => number[];
	x0: number[];
	/** 'constant': t_k = t0; 'diminishing': t_k = t0/√(k+1). */
	step: SubgradientStepRule;
	t0: number;
	iters: number;
}

export interface SubgradientMethodResult {
	/** Iterates x_0, …, x_K (length iters+1). */
	xs: number[][];
	/** f(x_k) (length iters+1) — NOT monotone in general. */
	values: number[];
	/** f_best(k) = min_{i ≤ k} f(x_i) (length iters+1) — non-increasing. */
	best: number[];
}

/**
 * Subgradient method x_{k+1} = x_k − t_k g_k, g_k ∈ ∂f(x_k)
 * ([BP14] §1–3; [N04] §3.2). It is not a descent
 * method, so one tracks f_best(k). With a constant step the best value only
 * reaches a neighbourhood of f* (size ∝ G²t/2); with t_k → 0, Σt_k = ∞ it
 * converges, the classical choice t_k ∝ 1/√k giving f_best − f* = O(1/√k).
 */
export function subgradientMethod(opts: SubgradientMethodOptions): SubgradientMethodResult {
	const { f, subgrad, x0, step, t0, iters } = opts;
	if (!Number.isInteger(iters) || iters < 1) {
		throw new Error(`subgradientMethod: iters must be a positive integer (got ${iters})`);
	}
	if (!(t0 > 0) || !Number.isFinite(t0)) throw new Error(`subgradientMethod: t0 must be > 0 (got ${t0})`);
	if (step !== 'constant' && step !== 'diminishing') {
		throw new Error(`subgradientMethod: unknown step rule "${step as string}"`);
	}
	if (x0.length === 0) throw new Error('subgradientMethod: x0 must be non-empty');
	let x = x0.slice();
	const xs = [x.slice()];
	const values = [f(x)];
	const best = [values[0]];
	for (let k = 0; k < iters; k++) {
		const g = subgrad(x);
		if (g.length !== x.length) throw new Error('subgradientMethod: subgrad returned a vector of wrong size');
		const t = step === 'constant' ? t0 : t0 / Math.sqrt(k + 1);
		x = x.map((xi, i) => xi - t * g[i]);
		const v = f(x);
		xs.push(x.slice());
		values.push(v);
		best.push(Math.min(best[best.length - 1], v));
	}
	return { xs, values, best };
}

/**
 * Weighted ℓ1 toy objective f(w) = Σ a_j|w_j − c_j| (a_j > 0) and one of its
 * subgradients (sign convention: sign(0) = 0, a valid element of ∂|·|(0)).
 * Minimum f* = 0 at w = c. Used by the demo E.3.
 */
export function weightedL1(a: number[], c: number[]): {
	f: (w: number[]) => number;
	subgrad: (w: number[]) => number[];
} {
	if (a.length === 0 || a.length !== c.length) throw new Error('weightedL1: a and c must have the same non-zero length');
	if (a.some((aj) => !(aj > 0))) throw new Error('weightedL1: weights must be > 0');
	return {
		f: (w) => w.reduce((s, wj, j) => s + a[j] * Math.abs(wj - c[j]), 0),
		subgrad: (w) => w.map((wj, j) => a[j] * Math.sign(wj - c[j]))
	};
}

// ─── Geometry helpers for the demos ─────────────────────────────────

export type Segment = [[number, number], [number, number]];

/**
 * The affine minorant candidate y ↦ f(x0) + c·(y − x0) (demo E.1), clipped
 * to the box [xMin, xMax] × [yMin, yMax] so that a chart without clipping
 * does not draw outside its frame. Returns null if the line misses the box.
 */
export function supportLineSegment(
	fx0: number,
	x0: number,
	c: number,
	box: { xMin: number; xMax: number; yMin: number; yMax: number }
): Segment | null {
	const { xMin, xMax, yMin, yMax } = box;
	if (!(xMax > xMin) || !(yMax > yMin)) throw new Error('supportLineSegment: empty box');
	const line = (x: number) => fx0 + c * (x - x0);
	let lo = xMin;
	let hi = xMax;
	if (c !== 0) {
		const xa = x0 + (yMin - fx0) / c;
		const xb = x0 + (yMax - fx0) / c;
		lo = Math.max(lo, Math.min(xa, xb));
		hi = Math.min(hi, Math.max(xa, xb));
	} else if (fx0 < yMin || fx0 > yMax) {
		return null;
	}
	if (!(hi > lo)) return null;
	return [
		[lo, line(lo)],
		[hi, line(hi)]
	];
}

/**
 * Graph of the set-valued map w ↦ w − z + λ∂|w| = ∂_w[½(w − z)² + λ|w|]
 * on [−R, R] (demo E.2): two slope-1 branches and, at w = 0, the vertical
 * segment {−z + λs : s ∈ [−1, 1]}. Its crossing with the horizontal axis is
 * the minimizer S(z, λ) (criterion 0 ∈ ∂F).
 */
export function lassoSubdiffGraph(z: number, lambda: number, R: number): {
	left: Segment;
	jump: Segment;
	right: Segment;
} {
	checkLambda(lambda, 'lassoSubdiffGraph');
	if (!(R > 0)) throw new Error(`lassoSubdiffGraph: R must be > 0 (got ${R})`);
	return {
		left: [
			[-R, -R - z - lambda],
			[0, -z - lambda]
		],
		jump: [
			[0, -z - lambda],
			[0, -z + lambda]
		],
		right: [
			[0, -z + lambda],
			[R, R - z + lambda]
		]
	};
}
