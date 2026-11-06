/**
 * Double descent — linear regression, conditioning, ridge, linear
 * classification and random features (Part V, expert lesson /part5/double-descente "La double descente").
 *
 * ANCHOR IN course_sources/:
 *  - course_sources/typst/theorie.typ, § "Limites de la théorie VC pour les
 *    réseaux de neurones" → "Le paradoxe de la double descente" (block
 *    "Phénomène de double descente (Belkin et al., 2019)" and the pseudo-inverse
 *    figure: min-norm least squares, peak at the interpolation threshold,
 *    attributed to the ill-conditioning of X).
 *  - course_sources/typst/regularization.typ, Définition 5.1 (Ridge) and
 *    Proposition 5.1 (facteurs de rétrécissement σ_j²/(σ_j²+λ) in the SVD basis).
 *  - course_sources/typst/optim.typ, Proposition 2.6.2 (Ridge: unique solution,
 *    Hessian X^T X/n + λI positive definite).
 *
 * EVERYTHING ELSE IS AN EXTENSION beyond course_sources/, taken from the
 * primary literature (verified literature review in
 * expert/part5/lessons/double-descente.research.md):
 *  - finite-sample risk of min-norm least squares with Gaussian "weak
 *    features": Belkin, Hsu & Xu (2020), SIAM J. Math. Data Sci. 2(4);
 *  - asymptotic ridge / ridgeless risk in the isotropic model:
 *    Hastie, Montanari, Rosset & Tibshirani (2022), Ann. Statist. 50(2);
 *  - Marchenko–Pastur law (1967) and Bai–Yin smallest-eigenvalue limit (1993);
 *  - Cover (1965) function-counting theorem (linear separability);
 *  - random-features regression (Rahimi & Recht 2007; Mei & Montanari 2022),
 *    used here as a SIMPLIFIED, illustrative proxy for a two-layer network
 *    with a frozen first layer — not a model of a trained deep network.
 *
 * Conventions used throughout:
 *  - design X ∈ R^{n×p}, i.i.d. N(0,1) entries (isotropic features), so that
 *    for a fresh test point x ~ N(0, I) the excess risk of an estimate b is
 *    exactly E_x[(x^T(b-β))^2] = ||b-β||^2 (no test-set sampling needed);
 *  - γ = p/n is the aspect ratio;
 *  - ridge objective: (1/n)||y - Xb||^2 + λ||b||^2, i.e.
 *    b_λ = (X^T X + nλ I)^{-1} X^T y  — the normalization of Hastie et al.
 *    (2022). (regularization.typ Définition 5.1 uses ||y-Xb||^2 + λ||b||^2,
 *    which is the same path with λ rescaled by n.)
 *  - λ = 0 means the minimum-norm least-squares solution b = X^+ y (the
 *    λ → 0+ limit of ridge, cf. part1/lesson2 Théorème 2.6.1.bis).
 */

import { combineSeed, mulberry32, solveLinearSystem, symmetricEigenvalues } from './util';

type Matrix = number[][];

// ---------------------------------------------------------------------------
// Small helpers (Gaussian draws, linear algebra on row-major arrays)
// ---------------------------------------------------------------------------

/** Standard normal draw (Box–Muller) from a seeded uniform generator. */
export function standardGaussian(rand: () => number): number {
	let u = 0;
	while (u === 0) u = rand();
	const v = rand();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** rows×cols matrix of i.i.d. N(0,1) entries. */
export function gaussianMatrix(rows: number, cols: number, rand: () => number): Matrix {
	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => standardGaussian(rand))
	);
}

function dot(a: number[], b: number[]): number {
	let s = 0;
	for (let i = 0; i < a.length; i++) s += a[i] * b[i];
	return s;
}

/** X^T X (p×p) for X n×p. */
function gramCols(X: Matrix): Matrix {
	const n = X.length;
	const p = X[0].length;
	const G: Matrix = Array.from({ length: p }, () => new Array(p).fill(0));
	for (let i = 0; i < n; i++) {
		const row = X[i];
		for (let a = 0; a < p; a++) {
			const ra = row[a];
			if (ra === 0) continue;
			for (let b = a; b < p; b++) G[a][b] += ra * row[b];
		}
	}
	for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) G[a][b] = G[b][a];
	return G;
}

/** X X^T (n×n) for X n×p. */
function gramRows(X: Matrix): Matrix {
	const n = X.length;
	const G: Matrix = Array.from({ length: n }, () => new Array(n).fill(0));
	for (let i = 0; i < n; i++) {
		for (let j = i; j < n; j++) {
			const v = dot(X[i], X[j]);
			G[i][j] = v;
			G[j][i] = v;
		}
	}
	return G;
}

/**
 * Ridge estimator b_λ = argmin (1/n)||y - Xb||^2 + λ||b||^2, λ ≥ 0.
 *
 * Uses the primal form (X^T X + nλI)^{-1} X^T y when p ≤ n and the dual form
 * X^T (X X^T + nλI)^{-1} y when p > n (push-through identity). Both forms are
 * exact for every λ > 0; at λ = 0 they give the minimum-norm least-squares
 * solution X^+ y whenever X has full rank min(n,p) — which holds with
 * probability one for Gaussian designs (regularization.typ Déf. 5.1 /
 * optim.typ Prop. 2.6.2 for λ > 0; min-norm limit: part1/lesson2,
 * Théorème 2.6.1.bis).
 *
 * Near p = n with λ = 0 the system is ill-conditioned and the solution has a
 * huge norm: that numerical blow-up IS the phenomenon studied in the lesson.
 */
export function ridgeFit(X: Matrix, y: number[], lambda: number): number[] {
	const n = X.length;
	if (n === 0) throw new Error('ridgeFit: X must have at least one row');
	const p = X[0].length;
	if (p === 0) throw new Error('ridgeFit: X must have at least one column');
	if (y.length !== n) throw new Error(`ridgeFit: y has length ${y.length}, expected ${n}`);
	if (!(lambda >= 0)) throw new Error(`ridgeFit: lambda must be >= 0, got ${lambda}`);
	const solveWith = (shift: number): number[] => {
		if (p <= n) {
			const G = gramCols(X);
			for (let a = 0; a < p; a++) G[a][a] += shift;
			const Xty = new Array(p).fill(0);
			for (let i = 0; i < n; i++) for (let a = 0; a < p; a++) Xty[a] += X[i][a] * y[i];
			return solveLinearSystem(G, Xty);
		}
		const K = gramRows(X);
		for (let i = 0; i < n; i++) K[i][i] += shift;
		const alpha = solveLinearSystem(K, y);
		const b = new Array(p).fill(0);
		for (let i = 0; i < n; i++) for (let a = 0; a < p; a++) b[a] += X[i][a] * alpha[i];
		return b;
	};
	if (lambda > 0) return solveWith(n * lambda);
	try {
		return solveWith(0);
	} catch {
		// Rank-deficient X (e.g. a random ReLU feature that vanishes on every
		// training point): fall back to the λ → 0+ limit with a vanishing ridge
		// (relative size 1e-10), which converges to the pseudo-inverse solution.
		let tr = 0;
		for (const row of X) tr += dot(row, row);
		return solveWith(1e-10 * (tr / Math.min(n, p) || 1));
	}
}

// ---------------------------------------------------------------------------
// 1. Finite-sample risk of min-norm least squares (Gaussian weak features)
// ---------------------------------------------------------------------------

export interface WeakFeaturesParams {
	/** Number of training samples n ≥ 1. */
	n: number;
	/** Number of features used by the model, p ≥ 1. */
	p: number;
	/** ||β_T||^2: squared norm of the part of the truth carried by the p used features. */
	signalIn: number;
	/** ||β_{T^c}||^2: squared norm of the part carried by the unused features (acts as noise). */
	signalOut: number;
	/** Noise variance σ^2 ≥ 0. */
	sigma2: number;
}

/**
 * Exact expected test risk E[(y - x^T β̂)^2] of the minimum-norm least-squares
 * estimator β̂ = X_T^+ y when x ~ N(0, I_D), y = x^T β + ε (ε ~ N(0, σ²)) and
 * the model only sees the p coordinates in T (Belkin, Hsu & Xu 2020, "Two
 * models of double descent for weak features", Theorem 1):
 *
 *   p ≤ n − 2 :  (||β_{T^c}||² + σ²) · (1 + p / (n − p − 1))
 *   n − 1 ≤ p ≤ n + 1 :  +∞
 *   p ≥ n + 2 :  ||β_T||² (1 − n/p) + (||β_{T^c}||² + σ²) · (1 + n / (p − n − 1))
 *
 * The test risk INCLUDES the irreducible noise σ² (it is the mean squared
 * prediction error on a fresh pair (x, y)).
 * EXTENSION beyond course_sources/ (theorie.typ only describes the curve).
 */
export function weakFeaturesRisk(params: WeakFeaturesParams): number {
	const { n, p, signalIn, signalOut, sigma2 } = params;
	if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a positive integer, got ${n}`);
	if (!Number.isInteger(p) || p < 1) throw new Error(`p must be a positive integer, got ${p}`);
	if (signalIn < 0 || signalOut < 0) throw new Error('signal norms must be >= 0');
	if (sigma2 < 0) throw new Error(`sigma2 must be >= 0, got ${sigma2}`);
	const effNoise = signalOut + sigma2;
	if (p <= n - 2) return effNoise * (1 + p / (n - p - 1));
	if (p >= n + 2) return signalIn * (1 - n / p) + effNoise * (1 + n / (p - n - 1));
	return Infinity;
}

// ---------------------------------------------------------------------------
// 2. Marchenko–Pastur law and conditioning
// ---------------------------------------------------------------------------

/**
 * Support edges [(1-√γ)², (1+√γ)²] of the Marchenko–Pastur law with ratio
 * γ = p/n — the limiting spectral distribution of X^T X / n for X n×p with
 * i.i.d. unit-variance entries, n, p → ∞, p/n → γ (Marchenko & Pastur 1967).
 * The smallest non-zero eigenvalue converges a.s. to the lower edge
 * (1-√γ)² (Bai & Yin 1993), which vanishes at γ = 1.
 */
export function marchenkoPasturEdges(gamma: number): [number, number] {
	if (!(gamma > 0)) throw new Error(`gamma must be > 0, got ${gamma}`);
	const r = Math.sqrt(gamma);
	return [(1 - r) ** 2, (1 + r) ** 2];
}

/**
 * Density of the absolutely continuous part of the Marchenko–Pastur law
 * (ratio γ, unit variance):  f(s) = √((b - s)(s - a)) / (2π γ s)  on [a, b].
 * For γ > 1 the law also has an atom of mass 1 - 1/γ at 0 (not included).
 */
export function marchenkoPasturDensity(s: number, gamma: number): number {
	const [a, b] = marchenkoPasturEdges(gamma);
	if (s <= a || s >= b || s <= 0) return 0;
	return Math.sqrt((b - s) * (s - a)) / (2 * Math.PI * gamma * s);
}

/**
 * Asymptotic condition number of X^T X restricted to its non-zero spectrum,
 * κ(γ) = ((1+√γ)/(1-√γ))², from the Marchenko–Pastur edges. +∞ at γ = 1.
 * (Same κ = λ_max/λ_min as the "indice de conditionnement" of part4/lesson4,
 * Définition 4.3 — here for a Gaussian design rather than a correlation matrix.)
 */
export function marchenkoPasturConditionNumber(gamma: number): number {
	const [a, b] = marchenkoPasturEdges(gamma);
	return a === 0 ? Infinity : b / a;
}

/**
 * Non-zero eigenvalues of X^T X / n (equivalently of X X^T / n), sorted in
 * decreasing order — there are min(n, p) of them for a Gaussian design.
 * Uses the smaller of the two Gram matrices.
 */
export function gramSpectrum(X: Matrix): number[] {
	const n = X.length;
	const p = X[0].length;
	const G = p <= n ? gramCols(X) : gramRows(X);
	return symmetricEigenvalues(G).map((v) => Math.max(v, 0) / n);
}

export interface SpectrumSample {
	gamma: number;
	/** Non-zero eigenvalues of X^T X / n for one Gaussian draw. */
	eigenvalues: number[];
	/** Smallest of them. */
	minEigenvalue: number;
}

/** One seeded Gaussian design X (n×p) and its non-zero Gram spectrum. */
export function sampleGramSpectrum(n: number, p: number, seed = 1): SpectrumSample {
	if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a positive integer, got ${n}`);
	if (!Number.isInteger(p) || p < 1) throw new Error(`p must be a positive integer, got ${p}`);
	const rand = mulberry32(combineSeed(seed, n * 7919 + p));
	const eig = gramSpectrum(gaussianMatrix(n, p, rand));
	return { gamma: p / n, eigenvalues: eig, minEigenvalue: eig[eig.length - 1] };
}

// ---------------------------------------------------------------------------
// 3. Asymptotic ridge / ridgeless risk (isotropic model)
// ---------------------------------------------------------------------------

/**
 * Stieltjes transform of the Marchenko–Pastur law evaluated on the negative
 * real axis, m(-λ) = ∫ dμ(s)/(s + λ), and its derivative m'(-λ) =
 * ∫ dμ(s)/(s + λ)², for λ > 0 (closed form; two algebraically equivalent
 * expressions are used to avoid cancellation on either side of γ = 1).
 * The atom at 0 for γ > 1 IS included here (it is part of μ).
 */
export function marchenkoPasturStieltjes(lambda: number, gamma: number): { m: number; dm: number } {
	if (!(lambda > 0)) throw new Error(`lambda must be > 0, got ${lambda}`);
	if (!(gamma > 0)) throw new Error(`gamma must be > 0, got ${gamma}`);
	const a = 1 - gamma + lambda;
	const S = Math.sqrt(a * a + 4 * gamma * lambda);
	const dS = (a + 2 * gamma) / S; // dS/dλ
	let f: number; // f(λ) = m(-λ)
	let df: number; // f'(λ) = -m'(-λ)
	if (a >= 0) {
		f = 2 / (a + S);
		df = (-2 * (1 + dS)) / (a + S) ** 2;
	} else {
		f = (S - a) / (2 * gamma * lambda);
		df = ((dS - 1) * lambda - (S - a)) / (2 * gamma * lambda * lambda);
	}
	return { m: f, dm: -df };
}

export interface RiskDecomposition {
	/** Squared bias (excess-risk part due to shrinkage / unseen directions). */
	bias: number;
	/** Variance (excess-risk part due to the noise ε). */
	variance: number;
	/** Excess risk bias + variance = E_x[(x^T(β̂ - β))^2] (σ² NOT included). */
	risk: number;
}

/**
 * Limiting excess risk of min-norm least squares (λ = 0) in the isotropic
 * model x ~ N(0, I_p), ||β||² = r², noise σ², p/n → γ
 * (Hastie, Montanari, Rosset & Tibshirani 2022, isotropic ridgeless case):
 *
 *   γ < 1 :  B = 0,                 V = σ² γ / (1 - γ)
 *   γ > 1 :  B = r² (1 - 1/γ),      V = σ² / (γ - 1)
 *
 * and +∞ at γ = 1.
 */
export function ridgelessAsymptoticRisk(
	gamma: number,
	r2: number,
	sigma2: number
): RiskDecomposition {
	if (!(gamma > 0)) throw new Error(`gamma must be > 0, got ${gamma}`);
	if (r2 < 0) throw new Error(`r2 must be >= 0, got ${r2}`);
	if (sigma2 < 0) throw new Error(`sigma2 must be >= 0, got ${sigma2}`);
	if (gamma === 1) return { bias: 0, variance: Infinity, risk: Infinity };
	if (gamma < 1) {
		const variance = (sigma2 * gamma) / (1 - gamma);
		return { bias: 0, variance, risk: variance };
	}
	const bias = r2 * (1 - 1 / gamma);
	const variance = sigma2 / (gamma - 1);
	return { bias, variance, risk: bias + variance };
}

/**
 * Limiting excess risk of ridge with penalty λ (objective
 * (1/n)||y-Xb||² + λ||b||²) in the isotropic model, written with the
 * Marchenko–Pastur Stieltjes transform m (Hastie et al. 2022, isotropic
 * ridge case):
 *
 *   B(λ) = r² λ² m'(-λ),      V(λ) = σ² γ ( m(-λ) - λ m'(-λ) ).
 *
 * λ = 0 falls back to ridgelessAsymptoticRisk (the λ → 0+ limit).
 */
export function ridgeAsymptoticRisk(
	gamma: number,
	lambda: number,
	r2: number,
	sigma2: number
): RiskDecomposition {
	if (!(lambda >= 0)) throw new Error(`lambda must be >= 0, got ${lambda}`);
	if (lambda === 0) return ridgelessAsymptoticRisk(gamma, r2, sigma2);
	if (r2 < 0) throw new Error(`r2 must be >= 0, got ${r2}`);
	if (sigma2 < 0) throw new Error(`sigma2 must be >= 0, got ${sigma2}`);
	const { m, dm } = marchenkoPasturStieltjes(lambda, gamma);
	const bias = r2 * lambda * lambda * dm;
	const variance = sigma2 * gamma * (m - lambda * dm);
	return { bias, variance, risk: bias + variance };
}

/**
 * Optimal ridge penalty in the isotropic model, λ* = σ² γ / r² (Hastie et al.
 * 2022, with the (1/n)-normalized objective). It coincides with the Bayes
 * posterior mean under the prior β ~ N(0, (r²/p) I_p).
 */
export function optimalRidgeLambda(gamma: number, r2: number, sigma2: number): number {
	if (!(gamma > 0)) throw new Error(`gamma must be > 0, got ${gamma}`);
	if (!(r2 > 0)) throw new Error(`r2 must be > 0, got ${r2}`);
	if (sigma2 < 0) throw new Error(`sigma2 must be >= 0, got ${sigma2}`);
	return (sigma2 * gamma) / r2;
}

// ---------------------------------------------------------------------------
// 4. Monte-Carlo simulator — regression (weak-features model)
// ---------------------------------------------------------------------------

export interface LinearDDOptions {
	/** Training sample size n. */
	n: number;
	/** Grid of numbers of features p used by the model (each ≤ D). */
	pGrid: number[];
	/** Total number of (latent) features D; the model uses the first p. */
	D: number;
	/** ||β||² of the full truth β ∈ R^D, spread uniformly over the D coordinates. */
	r2: number;
	/** Noise variance σ². */
	sigma2: number;
	/** Ridge penalty λ ≥ 0 (0 = minimum-norm least squares). */
	lambda: number;
	/** Monte-Carlo repetitions per grid point. */
	repetitions: number;
	seed?: number;
}

export interface LinearDDPoint {
	p: number;
	/** Mean training MSE. */
	trainRisk: number;
	/** Mean test MSE E[(y - x^T β̂)^2] (σ² included), computed exactly given β̂. */
	testRisk: number;
	/** Median test MSE over repetitions (robust to the heavy tail at p ≈ n). */
	testRiskMedian: number;
	/** Mean ||β̂||². */
	normSq: number;
}

/**
 * Monte-Carlo version of the weak-features experiment: β ∈ R^D with
 * β_j = √(r²/D) (deterministic, so ||β_T||² = r² p/D exactly), X ~ N(0,1)^{n×D},
 * the model is fitted on the first p columns with ridge(λ). Test risk is
 * computed exactly from β̂: ||β̂ - β_T||² + ||β_{T^c}||² + σ².
 * Seeds are decorrelated per (p, repetition) with combineSeed.
 */
export function simulateLinearDoubleDescent(opts: LinearDDOptions): LinearDDPoint[] {
	const { n, pGrid, D, r2, sigma2, lambda, repetitions } = opts;
	const seed = opts.seed ?? 1;
	if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a positive integer, got ${n}`);
	if (!Number.isInteger(D) || D < 1) throw new Error(`D must be a positive integer, got ${D}`);
	if (!Number.isInteger(repetitions) || repetitions < 1)
		throw new Error(`repetitions must be a positive integer, got ${repetitions}`);
	if (r2 < 0 || sigma2 < 0) throw new Error('r2 and sigma2 must be >= 0');
	if (!(lambda >= 0)) throw new Error(`lambda must be >= 0, got ${lambda}`);
	const bj = Math.sqrt(r2 / D);
	const sigma = Math.sqrt(sigma2);

	return pGrid.map((p) => {
		if (!Number.isInteger(p) || p < 1 || p > D)
			throw new Error(`each p must be an integer in [1, D], got ${p}`);
		const outNorm = bj * bj * (D - p);
		const tests: number[] = [];
		let trainSum = 0;
		let normSum = 0;
		for (let rep = 0; rep < repetitions; rep++) {
			const rand = mulberry32(combineSeed(combineSeed(seed, p), rep));
			const X = gaussianMatrix(n, D, rand);
			const y = X.map(
				(row) => bj * row.reduce((s, v) => s + v, 0) + sigma * standardGaussian(rand)
			);
			const XT = X.map((row) => row.slice(0, p));
			const b = ridgeFit(XT, y, lambda);
			let err = 0;
			let nrm = 0;
			for (let j = 0; j < p; j++) {
				err += (b[j] - bj) ** 2;
				nrm += b[j] * b[j];
			}
			tests.push(err + outNorm + sigma2);
			normSum += nrm;
			let tr = 0;
			for (let i = 0; i < n; i++) tr += (y[i] - dot(XT[i], b)) ** 2;
			trainSum += tr / n;
		}
		const sorted = tests.toSorted((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
		return {
			p,
			trainRisk: trainSum / repetitions,
			testRisk: tests.reduce((s, v) => s + v, 0) / repetitions,
			testRiskMedian: median,
			normSq: normSum / repetitions
		};
	});
}

// ---------------------------------------------------------------------------
// 5. Linear classification
// ---------------------------------------------------------------------------

/**
 * Cover's function-counting theorem (Cover 1965): n points in general position
 * in R^d admit C(n, d) = 2 Σ_{k=0}^{d-1} binom(n-1, k) linearly separable
 * dichotomies (homogeneous separators, i.e. hyperplanes through the origin).
 * Hence, for random labels, P(separable) = C(n,d) / 2^n = P(Bin(n-1, 1/2) ≤ d-1):
 * equal to 1 for n ≤ d, and exactly 1/2 at n = 2d.
 * Computed in log-space so that n up to several thousands is safe.
 */
export function coverSeparabilityProbability(n: number, d: number): number {
	if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a positive integer, got ${n}`);
	if (!Number.isInteger(d) || d < 1) throw new Error(`d must be a positive integer, got ${d}`);
	if (n <= d) return 1;
	const m = n - 1;
	// log binom(m, k) by recurrence, then a stable log-sum-exp.
	const logs: number[] = [];
	let lb = 0; // log binom(m, 0)
	for (let k = 0; k <= d - 1; k++) {
		logs.push(lb);
		lb += Math.log(m - k) - Math.log(k + 1);
	}
	const mx = Math.max(...logs);
	const s = logs.reduce((acc, l) => acc + Math.exp(l - mx), 0);
	return Math.min(1, Math.exp(mx + Math.log(s) - m * Math.LN2));
}

/**
 * Exact 0-1 test error of the linear classifier x ↦ sign(x^T w) when
 * x ~ N(0, Σ) with Σ = diag(variances) (default: identity), the clean label is
 * sign(x^T β), and labels are flipped independently with probability η:
 *
 *   η + (1 - 2η) · θ_Σ(w, β)/π,   cos θ_Σ = w^T Σ β / (‖w‖_Σ ‖β‖_Σ),
 *
 * since (x^T w, x^T β) is a centred Gaussian pair whose correlation is
 * cos θ_Σ, and two such variables have different signs with probability θ_Σ/π.
 * Returns 1/2 if ‖w‖_Σ = 0 (convention: a null classifier is a coin flip).
 */
export function gaussianLinearClassifierError(
	w: number[],
	beta: number[],
	eta = 0,
	variances?: number[]
): number {
	if (w.length !== beta.length) throw new Error('w and beta must have the same length');
	if (variances && variances.length !== w.length)
		throw new Error('variances must have the same length as w');
	if (eta < 0 || eta > 0.5) throw new Error(`eta must be in [0, 1/2], got ${eta}`);
	let wb = 0;
	let ww = 0;
	let bb = 0;
	for (let j = 0; j < w.length; j++) {
		const v = variances ? variances[j] : 1;
		if (v < 0) throw new Error('variances must be >= 0');
		wb += w[j] * v * beta[j];
		ww += w[j] * w[j] * v;
		bb += beta[j] * beta[j] * v;
	}
	if (bb === 0) throw new Error('beta must be non-zero (in the Σ-norm)');
	if (ww === 0) return 0.5;
	const c = Math.max(-1, Math.min(1, wb / Math.sqrt(ww * bb)));
	return eta + ((1 - 2 * eta) * Math.acos(c)) / Math.PI;
}

export interface ClassificationDDOptions {
	n: number;
	pGrid: number[];
	/** Total dimension D; the model uses the first p coordinates. */
	D: number;
	/** Number s of informative coordinates (variance 1, β_j = 1 for j < s). Default 5. */
	informative?: number;
	/** Variance of the D − s non-informative coordinates (β_j = 0). Default 0.02. */
	junkVariance?: number;
	/** Label-flip probability η ∈ [0, 1/2). */
	eta: number;
	/** Ridge penalty on the least-squares fit of the ±1 labels (0 = min-norm). */
	lambda: number;
	repetitions: number;
	seed?: number;
}

export interface ClassificationDDPoint {
	p: number;
	/** Mean training 0-1 error (≈ 0 once the fit interpolates, p ≥ n, λ = 0). */
	trainError: number;
	/** Mean exact test 0-1 error. */
	testError: number;
	/** Fraction of repetitions in which the fitted classifier makes no training mistake. */
	zeroTrainErrorFraction: number;
}

/**
 * Double descent for a linear CLASSIFIER trained by least squares on ±1
 * labels (minimum-norm / ridge), evaluated with the 0-1 loss. This is the
 * setting in which Muthukumar et al. (2021, JMLR) show that, in strongly
 * over-parameterized regimes, the hard-margin SVM coincides with this
 * minimum-norm interpolator (every point becomes a support vector).
 * Kini & Thrampoulidis (ISIT 2020) show that for this square-loss classifier
 * the test error tends to 1/2 at p/n → 1, whatever the signal strength.
 * SIMPLIFIED, illustrative "spiked" model: s informative Gaussian coordinates
 * of variance 1 (β_j = 1) followed by D − s non-informative coordinates of
 * small variance v (β_j = 0) — many weak, low-variance directions, the regime
 * in which min-norm interpolation is benign (Bartlett et al. 2020; Muthukumar
 * et al. 2021). The model sees the first p coordinates (informative ones
 * first). The test error is exact given ŵ (angle formula in the Σ geometry),
 * so the only randomness is the training sample.
 */
export function simulateClassificationDoubleDescent(
	opts: ClassificationDDOptions
): ClassificationDDPoint[] {
	const { n, pGrid, D, eta, lambda, repetitions } = opts;
	const seed = opts.seed ?? 1;
	if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a positive integer, got ${n}`);
	if (!Number.isInteger(D) || D < 1) throw new Error(`D must be a positive integer, got ${D}`);
	if (eta < 0 || eta >= 0.5) throw new Error(`eta must be in [0, 1/2), got ${eta}`);
	if (!(lambda >= 0)) throw new Error(`lambda must be >= 0, got ${lambda}`);
	if (!Number.isInteger(repetitions) || repetitions < 1)
		throw new Error(`repetitions must be a positive integer, got ${repetitions}`);
	const s = opts.informative ?? 5;
	const v = opts.junkVariance ?? 0.02;
	if (!Number.isInteger(s) || s < 1 || s > D)
		throw new Error(`informative must be an integer in [1, D], got ${s}`);
	if (!(v > 0)) throw new Error(`junkVariance must be > 0, got ${v}`);
	const beta = Array.from({ length: D }, (_, j) => (j < s ? 1 : 0));
	const variances = Array.from({ length: D }, (_, j) => (j < s ? 1 : v));
	const sd = variances.map(Math.sqrt);

	return pGrid.map((p) => {
		if (!Number.isInteger(p) || p < 1 || p > D)
			throw new Error(`each p must be an integer in [1, D], got ${p}`);
		let trainSum = 0;
		let testSum = 0;
		let sepCount = 0;
		for (let rep = 0; rep < repetitions; rep++) {
			const rand = mulberry32(combineSeed(combineSeed(seed + 7, p), rep));
			const X = gaussianMatrix(n, D, rand).map((row) => row.map((x, j) => x * sd[j]));
			const y = X.map((row) => {
				const clean = dot(row, beta) >= 0 ? 1 : -1;
				return rand() < eta ? -clean : clean;
			});
			const XT = X.map((row) => row.slice(0, p));
			const w = ridgeFit(XT, y, lambda);
			let mistakes = 0;
			for (let i = 0; i < n; i++) if (dot(XT[i], w) * y[i] <= 0) mistakes++;
			trainSum += mistakes / n;
			if (mistakes === 0) sepCount++;
			const wFull = [...w, ...new Array(D - p).fill(0)];
			testSum += gaussianLinearClassifierError(wFull, beta, eta, variances);
		}
		return {
			p,
			trainError: trainSum / repetitions,
			testError: testSum / repetitions,
			zeroTrainErrorFraction: sepCount / repetitions
		};
	});
}

// ---------------------------------------------------------------------------
// 6. Random ReLU features — a two-layer network with a frozen first layer
// ---------------------------------------------------------------------------

/** Target function of the 1-D random-features toy problem. */
export function rfTarget(x: number): number {
	return Math.sin(Math.PI * x);
}

export interface RandomFeatureModel {
	/** First-layer weights (frozen): feature k is max(0, a_k x + c_k). */
	a: number[];
	c: number[];
}

/**
 * N random ReLU features φ_k(x) = max(0, a_k x + c_k) on [-1, 1], with
 * a_k ~ N(0, 1)·3 and kinks -c_k/a_k uniformly spread in [-1, 1] — so the
 * span grows into a rich class of piecewise-linear functions as N grows.
 * (Illustrative choice; Mei & Montanari 2022 study the high-dimensional
 * analogue with features σ(⟨θ_k, x⟩).)
 */
export function sampleRandomFeatures(N: number, seed = 1): RandomFeatureModel {
	if (!Number.isInteger(N) || N < 1) throw new Error(`N must be a positive integer, got ${N}`);
	const rand = mulberry32(combineSeed(seed, 104729 + N));
	const a: number[] = [];
	const c: number[] = [];
	for (let k = 0; k < N; k++) {
		const ak = 3 * standardGaussian(rand) || 1;
		const kink = 2 * rand() - 1;
		a.push(ak);
		c.push(-ak * kink);
	}
	return { a, c };
}

/** Feature matrix Φ (len(xs) × N), scaled by 1/√N. */
export function randomFeatureMatrix(xs: number[], model: RandomFeatureModel): Matrix {
	const N = model.a.length;
	const s = 1 / Math.sqrt(N);
	return xs.map((x) => model.a.map((ak, k) => s * Math.max(0, ak * x + model.c[k])));
}

/**
 * Seeded 1-D training set on [-1, 1], y = sin(πx) + noise. The inputs are
 * STRATIFIED (one point uniformly drawn in each of n equal cells, i.e. a
 * jittered grid) rather than i.i.d. uniform: in dimension 1, two i.i.d.
 * points can be arbitrarily close with different noisy labels, and ANY smooth
 * interpolant then explodes between them — an artefact of low dimension
 * unrelated to the interpolation threshold this toy model is meant to show.
 */
export function rfTrainingSet(n: number, noiseStd: number, seed = 1): { x: number[]; y: number[] } {
	if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a positive integer, got ${n}`);
	if (noiseStd < 0) throw new Error(`noiseStd must be >= 0, got ${noiseStd}`);
	const rand = mulberry32(combineSeed(seed, 31337 + n));
	const x = Array.from({ length: n }, (_, i) => -1 + (2 * (i + 0.25 + 0.5 * rand())) / n);
	const y = x.map((xi) => rfTarget(xi) + noiseStd * standardGaussian(rand));
	return { x, y };
}

export interface RandomFeatureFit {
	/** Output-layer weights (length N). */
	weights: number[];
	trainMSE: number;
	/** Test MSE against the noiseless target on a uniform grid of [-1,1] (σ² NOT included). */
	testMSE: number;
	/** Fitted function on `grid`. */
	grid: number[];
	fitted: number[];
}

const RF_GRID = Array.from({ length: 201 }, (_, i) => -1 + (2 * i) / 200);

/** Fit the output layer of the random-features model by ridge(λ) (λ = 0: min-norm). */
export function fitRandomFeatures(
	x: number[],
	y: number[],
	model: RandomFeatureModel,
	lambda: number
): RandomFeatureFit {
	const Phi = randomFeatureMatrix(x, model);
	const w = ridgeFit(Phi, y, lambda);
	let tr = 0;
	for (let i = 0; i < x.length; i++) tr += (y[i] - dot(Phi[i], w)) ** 2;
	const PhiG = randomFeatureMatrix(RF_GRID, model);
	const fitted = PhiG.map((row) => dot(row, w));
	let te = 0;
	for (let i = 0; i < RF_GRID.length; i++) te += (fitted[i] - rfTarget(RF_GRID[i])) ** 2;
	return {
		weights: w,
		trainMSE: tr / x.length,
		testMSE: te / RF_GRID.length,
		grid: RF_GRID,
		fitted
	};
}

export interface RandomFeaturesDDPoint {
	N: number;
	trainMSE: number;
	/** Mean test MSE over repetitions (fresh features AND fresh training set per repetition). */
	testMSE: number;
	/** Median test MSE over repetitions. */
	testMSEMedian: number;
}

/**
 * Model-wise double descent of random-features regression: test MSE as a
 * function of the width N at fixed n, averaged over repetitions (each
 * repetition redraws the training set and the frozen features).
 */
export function simulateRandomFeaturesDoubleDescent(opts: {
	n: number;
	NGrid: number[];
	noiseStd: number;
	lambda: number;
	repetitions: number;
	seed?: number;
}): RandomFeaturesDDPoint[] {
	const { n, NGrid, noiseStd, lambda, repetitions } = opts;
	const seed = opts.seed ?? 1;
	if (!Number.isInteger(repetitions) || repetitions < 1)
		throw new Error(`repetitions must be a positive integer, got ${repetitions}`);
	return NGrid.map((N) => {
		const tests: number[] = [];
		let trainSum = 0;
		for (let rep = 0; rep < repetitions; rep++) {
			const { x, y } = rfTrainingSet(n, noiseStd, combineSeed(seed, rep));
			const model = sampleRandomFeatures(N, combineSeed(seed + 1, rep));
			const fit = fitRandomFeatures(x, y, model, lambda);
			tests.push(fit.testMSE);
			trainSum += fit.trainMSE;
		}
		const sorted = tests.toSorted((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return {
			N,
			trainMSE: trainSum / repetitions,
			testMSE: tests.reduce((s, v) => s + v, 0) / repetitions,
			testMSEMedian: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
		};
	});
}
