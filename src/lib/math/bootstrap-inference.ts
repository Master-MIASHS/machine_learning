/**
 * Bootstrap inference for the linear model — sampling-distribution
 * estimation by resampling (the non-Gaussian alternative to the exact
 * laws of the course).
 *
 * Ground-truth boundary (course): course_sources/sophie/StatM1S1_2025.pdf,
 * §6 « Inférence dans le modèle gaussien » (diapos 22–28) — (H3),
 * Théorème 2 (MV), lois d'échantillonnage (β̂ ∼ N, χ², Student) et IC de
 * Student. The bootstrap is ABSENT from that source; everything in this
 * module is beyond-course content, per the expert brief
 * expert/part4/lesson3/bootstrap-theorie.md:
 *  - nonparametric bootstrap (resampling (X_i, Y_i) pairs, re-estimating
 *    β̂): Efron, « Bootstrap Methods: Another Look at the Jackknife »,
 *    Ann. Statist. 7(1), 1979, 1–26, §2 (F̂_n, with replacement,
 *    bootstrap distribution of R* = R(X*, F̂_n), Monte Carlo method 2)
 *    and §7 (regression);
 *  - consistency: Bickel & Freedman, « Some Asymptotic Theory for the
 *    Bootstrap », Ann. Statist. 9(6), 1981, 1196–1217 — Th. 2.1/2.2
 *    (conditional law of √n(X̄* − X̄) ⇒ N(0, σ²), s*² →p σ²; vector
 *    version), §6 principle (uniformity conditions); Freedman,
 *    « Bootstrapping Regression Models », Ann. Statist. 9(6), 1981,
 *    1218–1228 (bootstrap approximation to the distribution of the
 *    least squares estimates is valid, with error bounds);
 *  - confidence intervals: Efron & Tibshirani, An Introduction to the
 *    Bootstrap (1993), eq. 13.5 p. 171 (percentile) and eq. 12.22
 *    p. 160 (studentized / bootstrap-t); first- vs second-order
 *    accuracy: Efron, « Better Bootstrap Confidence Intervals », JASA
 *    82(397), 1987, 171–185 (BCa second-order correctness);
 *  - wild bootstrap (heteroscedasticity): Wu, Ann. Statist. 14(4),
 *    1986, 1261–1295 (residual resampling with random weights is
 *    bias-robust; naive variants give biased variance estimators);
 *    Mammen, Ann. Statist. 21(1), 1993, 255–285 (two-point weights);
 *  - failures of the nonparametric bootstrap for order statistics:
 *    Bickel & Freedman 1981, §5 Prop. 5.1 (median with f(m) > 0:
 *    consistent, same √n limit) and §6 counterexample 2 (maximum of a
 *    bounded-support law: X*_(n) = X_(n) with probability
 *    1 − (1−1/n)^n → 1 − 1/e; no weak limit for the pivot; the
 *    parametric repair resamples from U(0, X_(n))); Athreya, Ann.
 *    Statist. 15(2), 1987, 724–731 (infinite variance: the bootstrap
 *    mean converges to a random distribution, not the stable law).
 *
 * Conventions: X is n×d with the intercept as column 0 (as in
 * linear-model.ts); the slope of interest is coefficient index 1.
 */

import { combineSeed, mulberry32 } from './util.js';
import { olsClosedForm } from './regression.js';
import { tConfidenceInterval } from './linear-model.js';
import { gaussianSample, type Gaussian } from './gaussian.js';

export type BootstrapErrorScenario = 'gaussian' | 'asymmetric';

const BASE: Gaussian = { mu: 0, sigma2: 1 };
/** Mean of exp(0.8·Z), Z ∼ N(0,1) — centers the log-normal error. */
const LOGNORMAL_CENTER = Math.exp(0.5 * 0.8 * 0.8);

// ─── Resampling ───────────────────────────────────────────

/**
 * Draw n indices with replacement from {0, …, n−1} — one bootstrap
 * resample of an n-observation data set (Efron 1979, §2: « the values
 * of X* are selected with replacement from the set {x_1, …, x_n} »).
 */
export function resampleIndices(n: number, rng: () => number): number[] {
	if (n < 1) throw new Error(`resampleIndices: n must be at least 1 (got ${n})`);
	return Array.from({ length: n }, () => Math.floor(rng() * n));
}

/**
 * B bootstrap re-estimates of the slope β̂1 (coefficient index 1) by
 * resampling the (x_i, y_i) pairs and refitting OLS (Efron 1979, §2 +
 * §7; validity for least squares: Freedman 1981). X must carry the
 * intercept as column 0.
 */
export function olsBootstrapSlopes(X: number[][], y: number[], B: number, rng: () => number): number[] {
	const n = X.length;
	const d = X[0]?.length ?? 0;
	if (n === 0 || d === 0) throw new Error('olsBootstrapSlopes: X must not be empty');
	if (y.length !== n) throw new Error(`olsBootstrapSlopes: X has ${n} rows but y has ${y.length}`);
	if (d < 2) throw new Error(`olsBootstrapSlopes: need an intercept plus at least one regressor (got ${d} columns)`);
	if (B < 1) throw new Error(`olsBootstrapSlopes: B must be at least 1 (got ${B})`);
	if (n <= d) throw new Error(`olsBootstrapSlopes: need n > number of parameters (got n = ${n}, p + 1 = ${d})`);

	const slopes = new Array<number>(B);
	for (let b = 0; b < B; b++) {
		// A resample is rank-deficient when too few distinct x values are
		// drawn (probability ≈ n·(1/n)^n per draw — rare, but real at small
		// n); the slope is then undefined, so the resample is simply redrawn.
		let attempt = 0;
		for (;;) {
			const idx = resampleIndices(n, rng);
			const Xs = idx.map((i) => X[i]);
			const ys = idx.map((i) => y[i]);
			try {
				slopes[b] = olsClosedForm(Xs, ys)[1];
				break;
			} catch {
				if (++attempt > 50)
					throw new Error('olsBootstrapSlopes: bootstrap resamples keep being rank-deficient');
			}
		}
	}
	return slopes;
}

/** Empirical standard deviation of the bootstrap replicates (denominator B−1). */
export function bootstrapStandardError(values: number[]): number {
	if (values.length < 2) throw new Error(`bootstrapStandardError: need at least 2 values (got ${values.length})`);
	const mean = values.reduce((a, v) => a + v, 0) / values.length;
	const ss = values.reduce((a, v) => a + (v - mean) * (v - mean), 0);
	return Math.sqrt(ss / (values.length - 1));
}

// ─── Quantiles & intervals ────────────────────────────────

/**
 * p-quantile of a sorted array by linear interpolation (type 7, the
 * R/NumPy default): h = (n−1)p, interpolate between ⌊h⌋ and ⌈h⌉.
 */
export function quantileOfSorted(values: number[], p: number): number {
	if (values.length === 0) throw new Error('quantileOfSorted: empty array');
	if (!(p > 0 && p < 1)) throw new Error(`quantileOfSorted: p must be in (0,1) (got ${p})`);
	const h = (values.length - 1) * p;
	const lo = Math.floor(h);
	const hi = Math.ceil(h);
	if (lo === hi) return values[lo];
	return values[lo] + (h - lo) * (values[hi] - values[lo]);
}

/**
 * Percentile bootstrap (1−α)·100% confidence interval of the slope:
 * [q*_{α/2}, q*_{1−α/2}] of the bootstrap replicates of β̂1
 * (Efron & Tibshirani 1993, eq. 13.5 p. 171). First-order accurate —
 * best used when the bootstrap distribution is near-symmetric.
 */
export function percentileInterval(slopes: number[], alpha: number): [number, number] {
	if (!(alpha > 0 && alpha < 1)) throw new Error(`percentileInterval: alpha must be in (0,1) (got ${alpha})`);
	const s = [...slopes].toSorted((a, b) => a - b);
	return [quantileOfSorted(s, alpha / 2), quantileOfSorted(s, 1 - alpha / 2)];
}

// ─── Seeded simulators (demos) ────────────────────────────

export interface SkewedSample {
	/** Design rows [1, x_i], n×2. */
	X: number[][];
	y: number[];
	/** True coefficients [β0, β1]. */
	beta: [number, number];
}

/**
 * Seeded simple-regression sample y = β0 + β1·x + ε with x_i ∼ U(0, 10)
 * i.i.d. (random design — so pair resampling is the exact bootstrap)
 * and β0 = 2, β1 = 1.5. Scenarios:
 *  - 'gaussian'  : ε_i ∼ N(0, 1) (the course's H3 — the bootstrap must
 *    reproduce the exact Gaussian laws of the lesson);
 *  - 'asymmetric': ε_i = exp(0.8·Z_i) − e^{0.32}, a centered log-normal
 *    error (mean 0, variance e^{0.64}(e^{0.64} − 1) ≈ 1.70, σ ≈ 1.30,
 *    strongly skewed) — (H3) is violated, the exact t-interval is only
 *    an asymptotic approximation, and the bootstrap is the point.
 * Synthetic seeded data for the demo (honest simplification: the lesson
 * gives no numeric bootstrap example).
 */
export function skewedRegressionSample(n: number, scenario: BootstrapErrorScenario, seed: number): SkewedSample {
	if (n < 3) throw new Error(`skewedRegressionSample: n must be at least 3 (got ${n})`);
	if (scenario !== 'gaussian' && scenario !== 'asymmetric')
		throw new Error(`skewedRegressionSample: unknown scenario "${scenario}"`);
	const beta: [number, number] = [2, 1.5];
	const rng = mulberry32(combineSeed(seed, 1));
	const X: number[][] = [];
	const y: number[] = [];
	for (let i = 0; i < n; i++) {
		const x = rng() * 10;
		const z = gaussianSample(BASE, mulberry32(combineSeed(seed, i + 2)));
		const eps = scenario === 'gaussian' ? z : Math.exp(0.8 * z) - LOGNORMAL_CENTER;
		X.push([1, x]);
		y.push(beta[0] + beta[1] * x + eps);
	}
	return { X, y, beta };
}

export interface CoverageStudy {
	/** Fraction of R experiments whose Student t-interval contains β1. */
	studentCoverage: number;
	/** Fraction of R experiments whose bootstrap percentile interval contains β1. */
	percentileCoverage: number;
	R: number;
	alpha: number;
}

/**
 * Empirical coverage of the two (1−α)-level intervals for β1 over R
 * independent seeded experiments (the demo's quantitative panel):
 * Student t-interval β̂1 ± t_{n−2}(1−α/2)·SE (the course's exact law,
 * valid under H3) vs bootstrap percentile interval (Efron & Tibshirani
 * 1993, eq. 13.5).
 *
 * Verified behavior for the SLOPE (measured, seed 97, R = 400): the
 * bootstrap distribution of β̂1 stays near-Gaussian even with strongly
 * skewed errors — β̂1 = β1 + Σ w_i ε_i is a linear statistic and the
 * design x_i ∼ U(0,10) is symmetric, so the error skew largely cancels —
 * and both intervals therefore stay close to the nominal level
 * (t: 0.93–0.96, percentile: 0.88–0.93 for B = 300). The dramatic
 * bootstrap-vs-theory contrasts of the panel (the maximum, the median:
 * Bickel & Freedman 1981, §4–§5) are NONLINEAR-statistic phenomena and
 * are NOT reproduced by this slope coverage study. The demo presents
 * both coverages as a check, not as a winner-take-all comparison.
 */
export function bootstrapCoverageStudy(opts: {
	n: number;
	B: number;
	R: number;
	alpha: number;
	scenario: BootstrapErrorScenario;
	seed: number;
}): CoverageStudy {
	const { n, B, R, alpha, scenario, seed } = opts;
	if (n < 5) throw new Error(`bootstrapCoverageStudy: n must be at least 5 (got ${n})`);
	if (B < 10) throw new Error(`bootstrapCoverageStudy: B must be at least 10 (got ${B})`);
	if (R < 1) throw new Error(`bootstrapCoverageStudy: R must be at least 1 (got ${R})`);
	if (!(alpha > 0 && alpha < 1)) throw new Error(`bootstrapCoverageStudy: alpha must be in (0,1) (got ${alpha})`);

	let studentHits = 0;
	let percentileHits = 0;
	for (let r = 0; r < R; r++) {
		const s = skewedRegressionSample(n, scenario, combineSeed(seed, r + 1));
		const beta = olsClosedForm(s.X, s.y);
		// SE of the slope: σ̂·√[(XᵀX)⁻¹]₁₁ with σ̂² = SCR/(n−2).
		const yHat = s.X.map((row) => row[0] * beta[0] + row[1] * beta[1]);
		const scr = s.y.reduce((a, yi, i) => a + (yi - yHat[i]) * (yi - yHat[i]), 0);
		const sigma2 = scr / (n - 2);
		let sxx = 0;
		let xMean = 0;
		for (const row of s.X) xMean += row[1];
		xMean /= n;
		for (const row of s.X) sxx += (row[1] - xMean) * (row[1] - xMean);
		const se = Math.sqrt(sigma2 / sxx);
		const [loT, hiT] = tConfidenceInterval(beta[1], se, alpha, n - 2);
		if (loT <= s.beta[1] && s.beta[1] <= hiT) studentHits++;

		const rng = mulberry32(combineSeed(seed, r + 101));
		const [loP, hiP] = percentileInterval(olsBootstrapSlopes(s.X, s.y, B, rng), alpha);
		if (loP <= s.beta[1] && s.beta[1] <= hiP) percentileHits++;
	}
	return { studentCoverage: studentHits / R, percentileCoverage: percentileHits / R, R, alpha };
}

// ─── Wild bootstrap (Wu 1986; Mammen 1993) ───────────────

/**
 * Mammen (1993) two-point wild-bootstrap weights: v = −(√5−1)/2 ≈ −0.618
 * with probability (5+√5)/10 ≈ 0.7236, and v = +(√5+1)/2 ≈ +1.618 with
 * probability (5−√5)/10 ≈ 0.2764 — so that E[v] = 0, E[v²] = 1, E[v³] = 1
 * (verified by direct computation; the matched third moment improves the
 * second-order approximation, Mammen 1993, Ann. Statist. 21(1):255–285).
 */
export const MAMMEN_LO = (1 - Math.sqrt(5)) / 2;
export const MAMMEN_HI = (1 + Math.sqrt(5)) / 2;
export const MAMMEN_LO_P = (5 + Math.sqrt(5)) / 10;
export const MAMMEN_HI_P = (5 - Math.sqrt(5)) / 10;

export type WildWeights = 'rademacher' | 'mammen';

function drawWildWeight(rng: () => number, weights: WildWeights): number {
	if (weights === 'rademacher') return rng() < 0.5 ? 1 : -1;
	if (weights === 'mammen') return rng() < MAMMEN_LO_P ? MAMMEN_LO : MAMMEN_HI;
	throw new Error(`drawWildWeight: unknown weights "${weights}"`);
}

/** Common input checks for the fixed-design bootstrap variants. */
function checkFixedDesign(X: number[][], y: number[], B: number): void {
	const n = X.length;
	const d = X[0]?.length ?? 0;
	if (n === 0 || d === 0) throw new Error('X must not be empty');
	if (y.length !== n) throw new Error(`X has ${n} rows but y has ${y.length}`);
	if (d < 2) throw new Error(`need an intercept plus at least one regressor (got ${d} columns)`);
	if (B < 1) throw new Error(`B must be at least 1 (got ${B})`);
	if (n <= d) throw new Error(`need n > number of parameters (got n = ${n}, p + 1 = ${d})`);
}

export interface HeteroSample {
	/** Design rows [1, x_i], n×2. */
	X: number[][];
	y: number[];
	/** True coefficients [β0, β1]. */
	beta: [number, number];
	/** Local error variance σ²(x) = (1 + 2x/10)² (the "fan" of the demo). */
	sigma2: (x: number) => number;
}

/**
 * Seeded simple-regression sample y = 2 + 1.5x + ε with x_i ∼ U(0, 10)
 * and Var(ε_i) = σ²(x_i) = (1 + 2 x_i / 10)² — the heteroscedastic "fan"
 * design of the wild-bootstrap demo (error sd grows from 1 at x = 0 to 3
 * at x = 10), the setting where Wu (1986, Ann. Statist. 14(4):1261–1295)
 * shows the naive residual bootstrap is biased and the wild bootstrap is
 * bias-robust. Synthetic seeded data (honest simplification: the primary
 * sources give no numeric example).
 */
export function heteroRegressionSample(n: number, seed: number): HeteroSample {
	if (n < 3) throw new Error(`heteroRegressionSample: n must be at least 3 (got ${n})`);
	const beta: [number, number] = [2, 1.5];
	const sigma2 = (x: number): number => (1 + (2 * x) / 10) ** 2;
	const rng = mulberry32(combineSeed(seed, 1));
	const X: number[][] = [];
	const y: number[] = [];
	for (let i = 0; i < n; i++) {
		const x = rng() * 10;
		const z = gaussianSample(BASE, mulberry32(combineSeed(seed, i + 2)));
		X.push([1, x]);
		y.push(beta[0] + beta[1] * x + Math.sqrt(sigma2(x)) * z);
	}
	return { X, y, beta, sigma2 };
}

/**
 * Naive residual bootstrap of the slope (Wu 1986's biased variant): the
 * design X stays fixed, each Y_i* = X_i β̂ + ε̂_{j(i)} draws a residual
 * ε̂_{j(i)} i.i.d. from the empirical residual set, and the slope is
 * refitted. Implicitly imposes σ_i² = σ² for all i, so under
 * heteroscedasticity the resulting variance estimate is biased (Wu,
 * 1986, §2).
 */
export function residualBootstrapSlopes(X: number[][], y: number[], B: number, rng: () => number): number[] {
	checkFixedDesign(X, y, B);
	const n = X.length;
	const beta = olsClosedForm(X, y);
	const yHat = X.map((row) => row[0] * beta[0] + row[1] * beta[1]);
	const epsHat = y.map((yi, i) => yi - yHat[i]);
	const slopes = new Array<number>(B);
	for (let b = 0; b < B; b++) {
		const yStar = yHat.map((mu) => mu + epsHat[Math.floor(rng() * n)]);
		slopes[b] = olsClosedForm(X, yStar)[1];
	}
	return slopes;
}

/**
 * Wild bootstrap of the slope (Wu 1986): design fixed,
 * Y_i* = X_i β̂ + ε̂_i · v_i with v_i i.i.d. mean-0 variance-1 weights
 * (Rademacher ±1, or Mammen 1993's two-point weights) independent of the
 * data. The local variance is preserved — Var*(ε̂_i v_i | X) = ε̂_i² — so
 * the variance estimate is bias-robust under heteroscedasticity (Wu 1986;
 * Mammen 1993).
 */
export function wildBootstrapSlopes(
	X: number[][],
	y: number[],
	B: number,
	rng: () => number,
	weights: WildWeights
): number[] {
	checkFixedDesign(X, y, B);
	const beta = olsClosedForm(X, y);
	const yHat = X.map((row) => row[0] * beta[0] + row[1] * beta[1]);
	const epsHat = y.map((yi, i) => yi - yHat[i]);
	const slopes = new Array<number>(B);
	for (let b = 0; b < B; b++) {
		const yStar = yHat.map((mu, i) => mu + epsHat[i] * drawWildWeight(rng, weights));
		slopes[b] = olsClosedForm(X, yStar)[1];
	}
	return slopes;
}

export interface TrueSE {
	/** Empirical sd (denominator R−1) of the R slope estimates. */
	se: number;
	/** The R independent slope estimates β̂₁. */
	values: number[];
}

/**
 * The true standard error of the slope, measured by simulation: R
 * independent seeded heteroscedastic experiments of size n, and the
 * empirical sd of the R OLS slopes (the calibration target for the
 * naive-residual and wild bootstrap SEs of the demo).
 */
export function trueSlopeSE(opts: { n: number; R: number; seed: number }): TrueSE {
	const { n, R, seed } = opts;
	if (n < 3) throw new Error(`trueSlopeSE: n must be at least 3 (got ${n})`);
	if (R < 2) throw new Error(`trueSlopeSE: R must be at least 2 (got ${R})`);
	const values = new Array<number>(R);
	for (let r = 0; r < R; r++) {
		const s = heteroRegressionSample(n, combineSeed(seed, r + 1));
		values[r] = olsClosedForm(s.X, s.y)[1];
	}
	return { se: bootstrapStandardError(values), values };
}

// ─── Order statistics: maximum (failure) & median (success) ───

/**
 * Seeded sample of size n from the uniform law on (0, θ) — the law of the
 * Bickel & Freedman (1981, Ann. Statist. 9(6):1196–1217, §6)
 * counterexample for the nonparametric bootstrap.
 */
export function uniformSample(n: number, theta: number, seed: number): number[] {
	if (n < 2) throw new Error(`uniformSample: n must be at least 2 (got ${n})`);
	if (!(theta > 0)) throw new Error(`uniformSample: theta must be positive (got ${theta})`);
	const rng = mulberry32(combineSeed(seed, 1));
	return Array.from({ length: n }, () => rng() * theta);
}

/**
 * Bootstrap pivots of the maximum: for B resamples of size n from the
 * empirical law, n(X_(n) − X*_(n)) / X_(n) (0 exactly when X*_(n) =
 * X_(n)). The nonparametric bootstrap cannot exceed the observed maximum,
 * so the pivots carry a mass 1 − (1−1/n)ⁿ → 1 − 1/e at 0 and have no weak
 * limit (Bickel & Freedman 1981, §6, p. 1210) — the failure of the lesson.
 */
export function bootstrapMaxPivots(sample: number[], B: number, rng: () => number): number[] {
	if (sample.length < 2) throw new Error(`bootstrapMaxPivots: n must be at least 2 (got ${sample.length})`);
	if (B < 1) throw new Error(`bootstrapMaxPivots: B must be at least 1 (got ${B})`);
	const n = sample.length;
	const xMax = Math.max(...sample);
	if (!(xMax > 0)) throw new Error('bootstrapMaxPivots: the sample maximum must be positive');
	const pivots = new Array<number>(B);
	for (let b = 0; b < B; b++) {
		let max = -Infinity;
		for (let i = 0; i < n; i++) {
			const v = sample[Math.floor(rng() * n)];
			if (v > max) max = v;
		}
		pivots[b] = (n * (xMax - max)) / xMax;
	}
	return pivots;
}

/**
 * Parametric-bootstrap pivots of the maximum — the repair of Bickel &
 * Freedman (1981, §6): resample from the fitted uniform law
 * U(0, X_(n)) instead of the empirical one, i.e. X**_i = X_(n)·U_i with
 * U_i ∼ U(0,1); the pivot n(X_(n) − X**_(n)) / X_(n) = n(1 − U_(n))
 * converges to the Exp(1) law (the true pivot limit). Note the pivot is
 * invariant to the scale of the sample — it only reads n and X_(n).
 */
export function parametricBootstrapMaxPivots(sample: number[], B: number, rng: () => number): number[] {
	if (sample.length < 2) throw new Error(`parametricBootstrapMaxPivots: n must be at least 2 (got ${sample.length})`);
	if (B < 1) throw new Error(`parametricBootstrapMaxPivots: B must be at least 1 (got ${B})`);
	const n = sample.length;
	const xMax = Math.max(...sample);
	if (!(xMax > 0)) throw new Error('parametricBootstrapMaxPivots: the sample maximum must be positive');
	const pivots = new Array<number>(B);
	for (let b = 0; b < B; b++) {
		let max = 0;
		for (let i = 0; i < n; i++) {
			const u = rng();
			if (u > max) max = u;
		}
		pivots[b] = n * (1 - max);
	}
	return pivots;
}

/**
 * Bootstrap medians: the median of each of B resamples of size n from the
 * empirical law. With a unique median m and density f satisfying f(m) > 0,
 * the bootstrap is consistent for the median — √n(m* − m) ⇒
 * N(0, 1/(4f(m)²)), the same limit as the sampling law (Bickel & Freedman
 * 1981, §5, Prop. 5.1): the median is a SUCCESS case, in contrast with
 * the maximum.
 */
export function bootstrapMedians(sample: number[], B: number, rng: () => number): number[] {
	if (sample.length < 2) throw new Error(`bootstrapMedians: n must be at least 2 (got ${sample.length})`);
	if (B < 1) throw new Error(`bootstrapMedians: B must be at least 1 (got ${B})`);
	const n = sample.length;
	const medians = new Array<number>(B);
	for (let b = 0; b < B; b++) {
		const resampled = new Array<number>(n);
		for (let i = 0; i < n; i++) resampled[i] = sample[Math.floor(rng() * n)];
		resampled.sort((a, b2) => a - b2);
		medians[b] = quantileOfSorted(resampled, 0.5);
	}
	return medians;
}

/** Standard Exp(1) density — the true limit of the maximum pivot (B&F 1981, §6). */
export function exponentialPDF(x: number): number {
	if (x < 0) return 0;
	return Math.exp(-x);
}

/**
 * Theoretical standard error of the median of a size-n sample from the
 * uniform on (0, θ): θ/(2√n) — Prop. 5.1 of Bickel & Freedman (1981) with
 * f = 1/θ (variance 1/(4f²) = θ²/4 at scale √n).
 */
export function medianSEUniform(theta: number, n: number): number {
	if (!(theta > 0)) throw new Error(`medianSEUniform: theta must be positive (got ${theta})`);
	if (n < 1) throw new Error(`medianSEUniform: n must be at least 1 (got ${n})`);
	return theta / (2 * Math.sqrt(n));
}
