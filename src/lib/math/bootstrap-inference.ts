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
 *    Mammen, Ann. Statist. 21(1), 1993, 255–285 (two-point weights).
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
