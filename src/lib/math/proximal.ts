/**
 * Proximal methods for composite convex problems `min f(x) + g(x)`:
 * soft-thresholding, the proximal operator, ISTA, FISTA and ADMM — applied to
 * the lasso.
 *
 * Content boundary: proximal methods are **not** in `course_sources/`
 * (verified: no occurrence of "proximal", "prox", "FISTA", "ADMM" or
 * "soft-threshold" anywhere under course_sources/). Every result below is
 * « au-delà du cours »; the primary sources are cited in
 * expert/part1/lessons/methodes-proximales-fista-admm.research.md:
 *
 *  [PB14] Parikh & Boyd, « Proximal Algorithms », Foundations and Trends in
 *         Optimization, 1(3):123–231, 2014:
 *    - §1.1 eq. (1.1)–(1.2): definition of the proximal operator — the
 *      convention used here: prox_{λf}(v) = argmin f(x) + (1/(2λ))‖x−v‖²;
 *    - §2.5 eq. (2.4): Moreau decomposition v = prox_f(v) + prox_{f*}(v);
 *    - §3.2 eq. (3.4): prox_{λf} = (I + λ∂f)⁻¹ (resolvent of the
 *      subdifferential);
 *    - §4.2 eq. (4.6): proximal gradient `x^{k+1} = prox_{λ_k g}(x^k − λ_k
 *      ∇f(x^k))`, rate O(1/k) for λ ∈ (0, 1/L];
 *    - §4.3: accelerated proximal gradient, rate O(1/k²) (Nesterov-type);
 *    - §4.4: ADMM (a.k.a. Douglas–Rachford splitting);
 *    - §6.5.2 eq. (6.9): prox_{λ‖·‖₁}(v) = (v−λ)+ − (−v−λ)+ (soft-
 *      thresholding);
 *    - §7.1.1: lasso = ISTA (basic) / FISTA (accelerated).
 *  [BT09] Beck & Teboulle, « A Fast Iterative Shrinkage-Thresholding
 *         Algorithm for Linear Inverse Problems », SIAM Journal on Imaging
 *         Sciences, 2(1):183–202, 2009:
 *    - eq. (1.4)–(1.5): ISTA step and shrinkage operator;
 *    - Theorem 3.1: F(x^k) − F(x*) ≤ L‖x⁰−x*‖²/(2k) (ISTA, constant step);
 *    - eq. (4.1)–(4.3): FISTA (extrapolation t_{k+1} = (1+√(1+4t_k²))/2);
 *    - Theorem 4.4: F(x^k) − F(x*) ≤ 2L‖x⁰−x*‖²/(k+1)² (FISTA).
 *  [BPC11] Boyd, Parikh, Chu, Peleato, Eckstein, « Distributed Optimization
 *          and Statistical Learning via the Alternating Direction Method of
 *          Multipliers », Foundations and Trends in Machine Learning,
 *          3(1):1–122, 2011:
 *    - §3.1 eq. (3.5)–(3.7): scaled ADMM (u = y/ρ);
 *    - §3.2: convergence under (1) f, g closed proper convex, (2) saddle
 *      point of the unaugmented Lagrangian;
 *    - §6.3–6.4: ℓ1-regularized loss minimization; lasso updates
 *      x^{k+1} = (AᵀA+ρI)⁻¹(Aᵀb+ρ(z^k−u^k)), z^{k+1} = S_{λ/ρ}(x^{k+1}+u^k).
 *  [CW05] Combettes & Wajs, « Signal Recovery by Proximal Forward-Backward
 *         Splitting », Multiscale Modeling and Simulation, 4(4):1164–1200,
 *         2005:
 *    - Theorem 3.4: weak (and, under standard conditions, strong)
 *      convergence of the forward-backward iterates to a solution.
 *
 * Convention note: the proximity operator of [BPC11 §4.1],
 * `prox_{f,ρ}(v) = argmin f(x) + (ρ/2)‖x−v‖²`, equals `prox_{(1/ρ) f}(v)`
 * in the [PB14] convention used here. This is why the ADMM z-update below
 * thresholds with `λ/ρ` while the ISTA/FISTA step thresholds with `λ·step`.
 */

import { softThreshold } from './regularization.js';
import { combineSeed, matMul, matVec, mulberry32, solveLinearSystem, symmetricEigenvalues, transpose } from './util.js';

export { softThreshold };

/**
 * Elementwise soft-thresholding S_λ(v) — closed form of prox_{λ‖·‖₁}
 * ([PB14 §6.5.2, eq. (6.9)]).
 */
export function proxL1(v: number[], lambda: number): number[] {
	if (!(lambda >= 0)) throw new Error(`proxL1: lambda must be >= 0 (got ${lambda})`);
	if (!Array.isArray(v) || v.length === 0) throw new Error('proxL1: v must be a non-empty vector');
	return v.map((x) => softThreshold(x, lambda));
}

/**
 * Proximal operator of the quadratic f(x) = (ρ/2)‖x‖² with unit quadratic
 * weight (λ = 1 in the [PB14] convention):
 * argmin_x (ρ/2)‖x‖² + (1/2)‖x−v‖²  =  v/(1+ρ).
 * (Ridge shrinkage — no coordinate is ever exactly zero, unlike proxL1.)
 */
export function proxL2Squared(v: number[], rho: number): number[] {
	if (!(rho >= 0)) throw new Error(`proxL2Squared: rho must be >= 0 (got ${rho})`);
	if (!Array.isArray(v) || v.length === 0) throw new Error('proxL2Squared: v must be a non-empty vector');
	const c = 1 / (1 + rho);
	return v.map((x) => c * x);
}

/** Check that X is a rectangular matrix (n×d, n,d ≥ 1). */
function checkMatrix(X: number[][]): { n: number; d: number } {
	if (!Array.isArray(X) || X.length === 0) throw new Error('lasso data: X must be a non-empty matrix');
	const n = X.length;
	const d = X[0]?.length ?? 0;
	if (d === 0) throw new Error('lasso data: X must have at least one column');
	for (let i = 0; i < n; i++) {
		if (X[i].length !== d) throw new Error(`lasso data: ragged rows in X (row ${i} has ${X[i].length} columns, expected ${d})`);
	}
	return { n, d };
}

/** Check that X is rectangular and y matches its number of rows. */
function checkLassoData(X: number[][], y: number[]): { n: number; d: number } {
	const { n, d } = checkMatrix(X);
	if (!Array.isArray(y) || y.length !== n) {
		throw new Error(`lasso data: y must have ${n} entries (one per row of X)`);
	}
	return { n, d };
}

/**
 * Lasso objective F(θ) = ½‖y − Xθ‖² + λ‖θ‖₁.
 * (Same convention as [PB14 §7.1, eq. (7.1)] and [BPC11 eq. (6.2)].)
 */
export function lassoObjectiveValue(theta: number[], X: number[][], y: number[], lambda: number): number {
	const { d } = checkLassoData(X, y);
	if (theta.length !== d) throw new Error(`lassoObjectiveValue: theta must have ${d} entries (got ${theta.length})`);
	if (!(lambda >= 0)) throw new Error(`lassoObjectiveValue: lambda must be >= 0 (got ${lambda})`);
	let quad = 0;
	let l1 = 0;
	for (let i = 0; i < X.length; i++) {
		let r = y[i];
		const row = X[i];
		for (let j = 0; j < d; j++) r -= row[j] * theta[j];
		quad += r * r;
	}
	for (let j = 0; j < d; j++) l1 += Math.abs(theta[j]);
	return quad / 2 + lambda * l1;
}

/**
 * Lipschitz constant of ∇f for f(θ) = ½‖y − Xθ‖², i.e. λ_max(XᵀX) —
 * exact, via the Jacobi eigensolver of util.ts (d×d, cheap for d ≪ n).
 * This is the `L(f)` of [BT09] (Example 2.2, with the ½ convention) and the
 * `L` of [PB14 §4.2]; the guaranteed step is step ∈ (0, 1/L].
 */
export function lassoLipschitzConstant(X: number[][]): number {
	const { n, d } = checkMatrix(X);
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);
	const L = symmetricEigenvalues(XtX)[0];
	if (!(L > 0)) throw new Error('lassoLipschitzConstant: XᵀX has no positive eigenvalue (degenerate problem)');
	return L;
}

export type ProxAlgorithm = 'ista' | 'fista' | 'admm';

export interface ProxLassoOptions {
	/** Number of iterations (default 500). */
	maxIter?: number;
	/**
	 * Step size for ISTA/FISTA (default 1/L with the exact L). Convergence is
	 * guaranteed for step ∈ (0, 1/L] ([PB14 §4.2], [BT09]).
	 */
	stepSize?: number;
	/** ADMM penalty ρ > 0 (default 1). */
	rho?: number;
	/**
	 * Reference value F* used for the objective gap F(θ^k) − F*. If omitted,
	 * estimated once by a long FISTA run (the minimum objective value observed
	 * on that run — a valid lower bound estimate, since every F(θ) ≥ F*).
	 */
	referenceValue?: number;
}

export interface ProxLassoResult {
	algorithm: ProxAlgorithm;
	/** Final iterate (θ^K; the x^k variable for ADMM). */
	theta: number[];
	/**
	 * Objective gap per iterate, length maxIter+1: index k holds
	 * F(θ^k) − referenceValue with θ^0 = 0. Non-negative in practice but not
	 * guaranteed (FISTA values are not monotone) — consumers must handle
	 * small negative values (e.g. a log scale clamps to its floor).
	 */
	objectiveGap: number[];
	/** The reference value used (F* estimate). */
	referenceValue: number;
	/** ‖θ^k‖₀ per iterate (length maxIter+1), count of |θ_j| > 1e-12. */
	sparsity: number[];
	/**
	 * ADMM only: ‖z^k‖₀ per iterate (length maxIter+1). The z^k iterates are
	 * *exactly* sparse (soft-thresholding) while the x^k iterates are only
	 * close to sparse — [PB14 §4.4].
	 */
	zSparsity?: number[];
}

/** Count of coordinates with |v_j| > 1e-12 (soft-thresholding zeros are exact). */
function countNonZero(v: number[]): number {
	let c = 0;
	for (const x of v) if (Math.abs(x) > 1e-12) c++;
	return c;
}

/** One ISTA iterate: prox_{step·(λ‖·‖₁)}(θ − step·∇f(θ)) — [PB14 §4.2, eq. (4.6)]. */
export function istaLassoStep(
	theta: number[],
	X: number[][],
	y: number[],
	lambda: number,
	step: number
): number[] {
	const { d } = checkLassoData(X, y);
	if (theta.length !== d) throw new Error(`istaLassoStep: theta must have ${d} entries (got ${theta.length})`);
	if (!(step > 0)) throw new Error(`istaLassoStep: step must be > 0 (got ${step})`);
	if (!(lambda >= 0)) throw new Error(`istaLassoStep: lambda must be >= 0 (got ${lambda})`);
	const Xt = transpose(X, X.length, d);
	const grad = matVec(Xt, matVec(X, theta).map((v, i) => v - y[i]));
	return proxL1(grad.map((g, j) => theta[j] - step * g), lambda * step);
}

/**
 * Estimate of the optimal value F* by running FISTA for `minIter` iterations
 * from θ⁰ = 0 and keeping the smallest value seen. An *estimate*, not an exact
 * optimum: good enough to turn F(θ^k) − F* into a decreasing gap for demos
 * (the true minimum is reached up to the O(1/k²) tail of that very run).
 */
export function estimateReferenceValue(X: number[][], y: number[], lambda: number, minIter: number): number {
	const { d } = checkLassoData(X, y);
	const L = lassoLipschitzConstant(X);
	const step = 1 / L;
	let theta = new Array(d).fill(0);
	let yk = new Array(d).fill(0);
	let t = 1;
	const Xt = transpose(X, X.length, d);
	let best = lassoObjectiveValue(theta, X, y, lambda);
	for (let k = 0; k < minIter; k++) {
		const grad = matVec(Xt, matVec(X, yk).map((v, i) => v - y[i]));
		const thetaNew = proxL1(grad.map((g, j) => yk[j] - step * g), lambda * step);
		const tNew = (1 + Math.sqrt(1 + 4 * t * t)) / 2;
		yk = thetaNew.map((x, j) => x + ((t - 1) / tNew) * (x - theta[j]));
		theta = thetaNew;
		t = tNew;
		const val = lassoObjectiveValue(theta, X, y, lambda);
		if (val < best) best = val;
	}
	return best;
}

/**
 * Seeded synthetic lasso used by the `FistaLassoAnimator` demo (and its
 * smoke test): `n` samples, `d` features, entries of `X` ~ U(−1, 1), and an
 * exact (noise-free) response `y = Xθ*` with a 4-sparse ground truth.
 * Deterministic: the same `(n, d, seed)` always yields the same problem.
 */
export function demoLassoData(n = 60, d = 12, seed = 42): { X: number[][]; y: number[] } {
	const rng = mulberry32(combineSeed(seed, 11));
	const X: number[][] = [];
	for (let i = 0; i < n; i++) {
		const row: number[] = [];
		for (let j = 0; j < d; j++) row.push(rng() * 2 - 1);
		X.push(row);
	}
	const thetaStar = new Array(d).fill(0);
	thetaStar[0] = 2.5;
	thetaStar[1] = -1.8;
	if (d > 4) thetaStar[4] = 1.2;
	if (d > 7) thetaStar[7] = -2.2;
	const y = X.map((row) => row.reduce((s, v, j) => s + v * thetaStar[j], 0));
	return { X, y };
}

/**
 * Run a proximal solver on the lasso `min ½‖y − Xθ‖² + λ‖θ‖₁` from θ⁰ = 0
 * and record the objective gap at every iterate.
 *
 * - `ista`  : [PB14 §4.2, eq. (4.6)] / [BT09 eq. (1.4)] — rate O(1/k) ([BT09
 *   Thm 3.1]);
 * - `fista` : [BT09 eq. (4.1)–(4.3)] — rate O(1/k²) ([BT09 Thm 4.4]);
 * - `admm`  : [BPC11 §6.4] — x-update = ridge solve (AᵀA+ρI), z-update =
 *   soft-thresholding S_{λ/ρ}, u-update = dual ascent. The returned `theta`
 *   is the x^k variable (the z^k iterates are exactly sparse — [PB14 §4.4]).
 */
export function runProxLasso(
	algorithm: ProxAlgorithm,
	X: number[][],
	y: number[],
	lambda: number,
	opts: ProxLassoOptions = {}
): ProxLassoResult {
	const { n, d } = checkLassoData(X, y);
	if (!(lambda >= 0)) throw new Error(`runProxLasso: lambda must be >= 0 (got ${lambda})`);
	if (!['ista', 'fista', 'admm'].includes(algorithm)) {
		throw new Error(`runProxLasso: unknown algorithm "${algorithm}" (expected 'ista' | 'fista' | 'admm')`);
	}
	const maxIter = opts.maxIter ?? 500;
	if (!Number.isInteger(maxIter) || maxIter < 1) {
		throw new Error(`runProxLasso: maxIter must be a positive integer (got ${maxIter})`);
	}
	const rho = opts.rho ?? 1;
	if (algorithm === 'admm' && !(rho > 0)) {
		throw new Error(`runProxLasso: rho must be > 0 for ADMM (got ${rho})`);
	}
	const referenceValue =
		opts.referenceValue ?? estimateReferenceValue(X, y, lambda, Math.max(1000, 4 * maxIter));

	const gaps: number[] = [];
	const sparsity: number[] = [];
	let zSparsity: number[] | undefined;
	const F = (th: number[]) => lassoObjectiveValue(th, X, y, lambda);

	let theta = new Array(d).fill(0);
	gaps.push(F(theta) - referenceValue);
	sparsity.push(countNonZero(theta));
	if (algorithm === 'admm') zSparsity = [0];

	const Xt = transpose(X, n, d);
	const gradAt = (v: number[]) => matVec(Xt, matVec(X, v).map((s, i) => s - y[i]));

	if (algorithm === 'ista' || algorithm === 'fista') {
		const L = lassoLipschitzConstant(X);
		const step = opts.stepSize ?? 1 / L;
		if (!(step > 0)) throw new Error(`runProxLasso: stepSize must be > 0 (got ${step})`);

		let yk = theta; // y^1 = x^0 (FISTA); unused for ISTA
		let t = 1;

		for (let k = 0; k < maxIter; k++) {
			const base = algorithm === 'ista' ? theta : yk;
			const grad = gradAt(base);
			const thetaNew = proxL1(grad.map((g, j) => base[j] - step * g), lambda * step);

			if (algorithm === 'fista') {
				const tNew = (1 + Math.sqrt(1 + 4 * t * t)) / 2;
				// y^{k+1} = x^{k+1} + ((t_k − 1)/t_{k+1})(x^{k+1} − x^k)  [BT09 eq. (4.3)]
				yk = thetaNew.map((x, j) => x + ((t - 1) / tNew) * (x - theta[j]));
				t = tNew;
			}
			theta = thetaNew;
			gaps.push(F(theta) - referenceValue);
			sparsity.push(countNonZero(theta));
		}
	} else {
		// ADMM — [BPC11 §6.4]: A = XᵀX + ρI (constant, built once), b = Xᵀy.
		const A = matMul(Xt, X).map((row, i) => row.map((v, j) => v + (i === j ? rho : 0)));
		const b = matVec(Xt, y);
		let z = new Array(d).fill(0);
		let u = new Array(d).fill(0);

		for (let k = 0; k < maxIter; k++) {
			theta = solveLinearSystem(A, b.map((v, j) => v + rho * (z[j] - u[j])));
			z = proxL1(theta.map((v, j) => v + u[j]), lambda / rho);
			u = u.map((v, j) => v + theta[j] - z[j]);
			gaps.push(F(theta) - referenceValue);
			sparsity.push(countNonZero(theta));
			zSparsity!.push(countNonZero(z));
		}
	}

	return { algorithm, theta, objectiveGap: gaps, referenceValue, sparsity, zSparsity };
}
