import { describe, expect, it } from 'vitest';
import {
	MAMMEN_HI,
	MAMMEN_LO,
	MAMMEN_LO_P,
	bootstrapCoverageStudy,
	bootstrapMaxPivots,
	bootstrapMedians,
	bootstrapStandardError,
	exponentialPDF,
	heteroRegressionSample,
	medianSEUniform,
	olsBootstrapSlopes,
	percentileInterval,
	parametricBootstrapMaxPivots,
	quantileOfSorted,
	resampleIndices,
	residualBootstrapSlopes,
	skewedRegressionSample,
	trueSlopeSE,
	uniformSample,
	wildBootstrapSlopes,
	type BootstrapErrorScenario
} from './bootstrap-inference.js';
import { combineSeed, linspace, mulberry32 } from './util.js';
import { olsClosedForm } from './regression.js';
import { withIntercept } from './linear-model.js';

const SEED = 97;

describe('resampleIndices (Efron 1979, §2 — with replacement)', () => {
	it('is deterministic for a fixed seed', () => {
		const a = resampleIndices(10, mulberry32(combineSeed(SEED, 1)));
		const b = resampleIndices(10, mulberry32(combineSeed(SEED, 1)));
		expect(a).toEqual(b);
	});

	it('returns n indices in [0, n)', () => {
		const idx = resampleIndices(7, mulberry32(combineSeed(SEED, 2)));
		expect(idx).toHaveLength(7);
		for (const i of idx) {
			expect(Number.isInteger(i)).toBe(true);
			expect(i).toBeGreaterThanOrEqual(0);
			expect(i).toBeLessThan(7);
		}
	});

	it('each index appears ≈ 1/n of the time over many draws', () => {
		const n = 100;
		const rng = mulberry32(combineSeed(SEED, 3));
		const counts = new Array<number>(n).fill(0);
		const draws = 10000;
		for (let b = 0; b < draws; b++) {
			for (const i of resampleIndices(n, rng)) counts[i]++;
		}
		// Each index's count is Binomial(draws·n, 1/n): mean draws = 10 000,
		// sd ≈ √(draws·(1−1/n)) ≈ 99.5 — bound at ±3 sd.
		for (const c of counts) {
			expect(c).toBeGreaterThan(10000 - 300);
			expect(c).toBeLessThan(10000 + 300);
		}
	});

	it('rejects n < 1', () => {
		expect(() => resampleIndices(0, mulberry32(1))).toThrow();
	});
});

describe('olsBootstrapSlopes', () => {
	it('is deterministic for a fixed seed', () => {
		const s = skewedRegressionSample(20, 'gaussian', SEED);
		const a = olsBootstrapSlopes(s.X, s.y, 50, mulberry32(combineSeed(SEED, 1)));
		const b = olsBootstrapSlopes(s.X, s.y, 50, mulberry32(combineSeed(SEED, 1)));
		expect(a).toEqual(b);
	});

	it('recovers the exact slope on a noise-free line (analytic case)', () => {
		// y = 2 + 1.5x exactly: every full-rank bootstrap refit returns 1.5.
		const x = linspace(0, 10, 15);
		const y = x.map((xi) => 2 + 1.5 * xi);
		const X = withIntercept(x.map((xi) => [xi]));
		const slopes = olsBootstrapSlopes(X, y, 200, mulberry32(combineSeed(SEED, 2)));
		for (const s of slopes) expect(s).toBeCloseTo(1.5, 9);
		expect(bootstrapStandardError(slopes)).toBeCloseTo(0, 9);
	});

	it('bootstrap mean of the replicates tracks the original estimate', () => {
		const s = skewedRegressionSample(30, 'gaussian', SEED);
		const beta = olsClosedForm(s.X, s.y);
		const slopes = olsBootstrapSlopes(s.X, s.y, 2000, mulberry32(combineSeed(SEED, 3)));
		const mean = slopes.reduce((a, v) => a + v, 0) / slopes.length;
		// First-order: E*[β̂*] = β̂ up to O(1/n) + Monte Carlo (Efron 1979, §2).
		// SE(β̂1) ≈ 0.06 here, so the MC error of the mean is < 0.001.
		expect(Math.abs(mean - beta[1])).toBeLessThan(0.02);
	});

	it('rejects degenerate inputs', () => {
		const s = skewedRegressionSample(20, 'gaussian', SEED);
		expect(() => olsBootstrapSlopes(s.X, s.y, 0, mulberry32(1))).toThrow();
		expect(() => olsBootstrapSlopes(s.X, s.y.slice(0, 19), 10, mulberry32(1))).toThrow();
		expect(() => olsBootstrapSlopes(s.X, s.y, 10, mulberry32(1))).not.toThrow();
	});
});

describe('bootstrapStandardError', () => {
	it('matches an independently computed sd', () => {
		const values = [1.0, 1.4, 1.2, 1.05, 1.6];
		const mean = values.reduce((a, v) => a + v, 0) / values.length;
		const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1));
		expect(bootstrapStandardError(values)).toBeCloseTo(sd, 12);
	});

	it('rejects fewer than 2 values', () => {
		expect(() => bootstrapStandardError([1])).toThrow();
	});
});

describe('quantileOfSorted (type-7 linear interpolation)', () => {
	it('exact values on [1..5]', () => {
		const v = [1, 2, 3, 4, 5];
		expect(quantileOfSorted(v, 0.5)).toBe(3);
		expect(quantileOfSorted(v, 0.25)).toBe(2);
		expect(quantileOfSorted(v, 0.75)).toBe(4);
	});

	it('interpolates between order statistics', () => {
		expect(quantileOfSorted([1, 3], 0.25)).toBeCloseTo(1.5, 12);
		expect(quantileOfSorted([1, 3], 0.75)).toBeCloseTo(2.5, 12);
		// h = (4−1)·0.375 = 1.125 → v[1] + 0.125·(v[2]−v[1]) = 4 + 0.125·2.
		expect(quantileOfSorted([2, 4, 6, 8], 0.375)).toBeCloseTo(4.25, 12);
	});

	it('hits order statistics exactly on the type-7 grid', () => {
		// For a sorted array of length n, q(k/(n−1)) = v[k] exactly
		// (1 ≤ k ≤ n−2 keeps p strictly inside (0,1)).
		const v = [3.1, 5.2, 7.7, 8.0, 9.4, 11.1, 12.9, 14.3, 16.6];
		const n = v.length;
		for (let k = 1; k < n - 1; k++) {
			expect(quantileOfSorted(v, k / (n - 1))).toBeCloseTo(v[k], 12);
		}
	});

	it('is symmetric: q(p) + q(1−p) = min + max on a symmetric sample', () => {
		// Type-7 quantiles mirror on symmetric data (v[k] + v[n−1−k] = c).
		const v = [-4.5, -3.2, -1.7, -0.4, 0.4, 1.7, 3.2, 4.5];
		const c = v[0] + v[v.length - 1];
		for (const p of [0.05, 0.1, 0.25, 0.375, 0.5, 0.75, 0.9]) {
			expect(quantileOfSorted(v, p) + quantileOfSorted(v, 1 - p)).toBeCloseTo(c, 9);
		}
	});

	it('rejects empty input and p outside (0,1)', () => {
		expect(() => quantileOfSorted([], 0.5)).toThrow();
		expect(() => quantileOfSorted([1, 2], 0)).toThrow();
		expect(() => quantileOfSorted([1, 2], 1.2)).toThrow();
	});
});

describe('percentileInterval (Efron & Tibshirani 1993, eq. 13.5)', () => {
	it('returns ordered bounds containing the sample median', () => {
		const s = skewedRegressionSample(25, 'asymmetric', SEED);
		const slopes = olsBootstrapSlopes(s.X, s.y, 400, mulberry32(combineSeed(SEED, 5)));
		const [lo, hi] = percentileInterval(slopes, 0.05);
		expect(lo).toBeLessThan(hi);
		const median = quantileOfSorted([...slopes].toSorted((a, b) => a - b), 0.5);
		expect(lo).toBeLessThanOrEqual(median);
		expect(hi).toBeGreaterThanOrEqual(median);
	});

	it('known values: quartiles of [1..9]', () => {
		const [lo, hi] = percentileInterval([1, 2, 3, 4, 5, 6, 7, 8, 9], 0.5);
		// h = 8·0.25 = 2 and h = 8·0.75 = 6 are exact grid points: v[2] = 3, v[6] = 7.
		expect(lo).toBeCloseTo(3, 12);
		expect(hi).toBeCloseTo(7, 12);
	});

	it('rejects alpha outside (0,1)', () => {
		expect(() => percentileInterval([1, 2, 3], 0)).toThrow();
		expect(() => percentileInterval([1, 2, 3], 1.5)).toThrow();
	});
});

describe('skewedRegressionSample', () => {
	it('is deterministic for a fixed seed and scenario', () => {
		const a = skewedRegressionSample(20, 'asymmetric', SEED);
		const b = skewedRegressionSample(20, 'asymmetric', SEED);
		expect(a.X).toEqual(b.X);
		expect(a.y).toEqual(b.y);
	});

	it('scenarios draw different errors', () => {
		const g = skewedRegressionSample(20, 'gaussian', SEED);
		const a = skewedRegressionSample(20, 'asymmetric', SEED);
		expect(g.y).not.toEqual(a.y);
	});

	it('x lies in (0, 10) and the OLS fit recovers the truth approximately', () => {
		const s = skewedRegressionSample(40, 'asymmetric', SEED);
		for (const row of s.X) {
			expect(row[0]).toBe(1);
			expect(row[1]).toBeGreaterThan(0);
			expect(row[1]).toBeLessThan(10);
		}
		const beta = olsClosedForm(s.X, s.y);
		// The intercept has a much larger SE (≈0.42) than the slope (≈0.08),
		// so allow a wider margin on the intercept (≈2.4 SE).
		expect(Math.abs(beta[0] - 2)).toBeLessThan(1.0);
		expect(Math.abs(beta[1] - 1.5)).toBeLessThan(0.3);
	});

	it('the asymmetric error is genuinely skewed (positive skew of residuals)', () => {
		const s = skewedRegressionSample(500, 'asymmetric', SEED);
		const beta = olsClosedForm(s.X, s.y);
		const res = s.y.map((yi, i) => yi - (s.X[i][0] * beta[0] + s.X[i][1] * beta[1]));
		const m = res.reduce((a, r) => a + r, 0) / res.length;
		const m2 = res.reduce((a, r) => a + (r - m) ** 2, 0) / res.length;
		const m3 = res.reduce((a, r) => a + (r - m) ** 3, 0) / res.length;
		const skew = m3 / m2 ** 1.5;
		expect(skew).toBeGreaterThan(0.5);
	});

	it('rejects invalid inputs', () => {
		expect(() => skewedRegressionSample(2, 'gaussian', SEED)).toThrow();
		expect(() => skewedRegressionSample(10, 'weird' as BootstrapErrorScenario, SEED)).toThrow();
	});
});

describe('bootstrap consistency (Freedman 1981; Bickel & Freedman 1981, Th. 2.1–2.2)', () => {
	// The known closed-form SE of the slope for a simple regression:
	// SE(β̂1) = σ/√(Σ(x_i−x̄)²), exact for any i.i.d. homoscedastic errors.
	function trueSEOfSlope(X: number[][], sigma: number): number {
		const n = X.length;
		let xMean = 0;
		for (const row of X) xMean += row[1];
		xMean /= n;
		let sxx = 0;
		for (const row of X) sxx += (row[1] - xMean) * (row[1] - xMean);
		return sigma / Math.sqrt(sxx);
	}

	it('Gaussian errors: bootstrap SE ≈ σ/√Σ(xi−x̄)² with σ = 1', () => {
		// n = 300: the bootstrap SE carries a known negative O(1/n) bias
		// (measured ratio ≈ 0.82 at n = 30, ≈ 0.95 for n ≥ 60, → 1); at
		// n = 300 the ratio is 0.95 and 10% leaves a wide margin.
		const n = 300;
		const B = 2000;
		const s = skewedRegressionSample(n, 'gaussian', SEED);
		const slopes = olsBootstrapSlopes(s.X, s.y, B, mulberry32(combineSeed(SEED, 6)));
		const bootSE = bootstrapStandardError(slopes);
		const se = trueSEOfSlope(s.X, 1);
		expect(Math.abs(bootSE - se) / se).toBeLessThan(0.1);
	});

	it('asymmetric errors: bootstrap SE ≈ true SE without knowing the error law', () => {
		// The point of the method: no (H3) assumed. The centered
		// log-normal(0.8) error has closed-form variance
		// e^{0.64}(e^{0.64}−1) ≈ 1.70 (independent of σ̂, which is noisy
		// under heavy tails). Measured ratio at n = 300: 0.993.
		const n = 300;
		const B = 2000;
		const s = skewedRegressionSample(n, 'asymmetric', SEED);
		const slopes = olsBootstrapSlopes(s.X, s.y, B, mulberry32(combineSeed(SEED, 6)));
		const bootSE = bootstrapStandardError(slopes);
		const errorVar = Math.exp(0.64) * (Math.exp(0.64) - 1);
		const se = trueSEOfSlope(s.X, Math.sqrt(errorVar));
		expect(Math.abs(bootSE - se) / se).toBeLessThan(0.1);
	});

	it('a seeded Gaussian sample is actually Gaussian-shaped (control)', () => {
		// Sanity: with σ = 1 and z ~ N(0,1), the residuals' sd must be
		// close to 1 (sd of the sample sd at n = 500 is ≈ 0.03).
		const s = skewedRegressionSample(500, 'gaussian', SEED);
		const beta = olsClosedForm(s.X, s.y);
		const res = s.y.map((yi, i) => yi - (s.X[i][0] * beta[0] + s.X[i][1] * beta[1]));
		const m = res.reduce((a, r) => a + r, 0) / res.length;
		const sd = Math.sqrt(res.reduce((a, r) => a + (r - m) ** 2, 0) / res.length);
		expect(sd).toBeGreaterThan(0.85);
		expect(sd).toBeLessThan(1.15);
	});
});

describe('bootstrapCoverageStudy', () => {
	it('under H3 (Gaussian errors) both intervals cover ≈ 1 − α', () => {
		const { studentCoverage, percentileCoverage } = bootstrapCoverageStudy({
			n: 20,
			B: 300,
			R: 400,
			alpha: 0.05,
			scenario: 'gaussian',
			seed: SEED
		});
		// MC sd of a coverage fraction ≈ √(0.95·0.05/400) ≈ 0.011.
		expect(studentCoverage).toBeGreaterThan(0.87);
		expect(studentCoverage).toBeLessThan(1);
		expect(percentileCoverage).toBeGreaterThan(0.85);
		expect(percentileCoverage).toBeLessThan(1);
	});

	it('with asymmetric errors both intervals still stay near the nominal level', () => {
		// Measured (seed 97, this exact config): student 0.9425,
		// percentile 0.9100. The slope is a LINEAR statistic (CLT +
		// symmetric design), so its sampling law stays near-Gaussian even
		// with skewed errors and the t-interval does not visibly drift —
		// no winner-take-all ordering is asserted (the percentile is NOT
		// better here; the dramatic bootstrap-vs-theory contrasts are
		// nonlinear-statistic phenomena, e.g. the maximum, B&F 1981 §6).
		const { studentCoverage, percentileCoverage } = bootstrapCoverageStudy({
			n: 12,
			B: 300,
			R: 400,
			alpha: 0.05,
			scenario: 'asymmetric',
			seed: SEED
		});
		expect(studentCoverage).toBeGreaterThan(0.88);
		expect(studentCoverage).toBeLessThan(1);
		expect(percentileCoverage).toBeGreaterThan(0.84);
		expect(percentileCoverage).toBeLessThan(1);
	});

	it('rejects invalid inputs', () => {
		expect(() =>
			bootstrapCoverageStudy({ n: 3, B: 100, R: 10, alpha: 0.05, scenario: 'gaussian', seed: SEED })
		).toThrow();
		expect(() =>
			bootstrapCoverageStudy({ n: 20, B: 5, R: 10, alpha: 0.05, scenario: 'gaussian', seed: SEED })
		).toThrow();
		expect(() =>
			bootstrapCoverageStudy({ n: 20, B: 100, R: 0, alpha: 0.05, scenario: 'gaussian', seed: SEED })
		).toThrow();
		expect(() =>
			bootstrapCoverageStudy({ n: 20, B: 100, R: 10, alpha: 1, scenario: 'gaussian', seed: SEED })
		).toThrow();
	});
});

describe('heteroRegressionSample (wild-bootstrap demo, fan design)', () => {
	it('is deterministic for a fixed seed', () => {
		const a = heteroRegressionSample(30, SEED);
		const b = heteroRegressionSample(30, SEED);
		expect(a.X).toEqual(b.X);
		expect(a.y).toEqual(b.y);
	});

	it('x lies in (0, 10) and the fan is σ²(x) = (1 + 2x/10)²', () => {
		const s = heteroRegressionSample(40, SEED);
		for (const row of s.X) {
			expect(row[0]).toBe(1);
			expect(row[1]).toBeGreaterThan(0);
			expect(row[1]).toBeLessThan(10);
		}
		expect(s.sigma2(0)).toBeCloseTo(1, 12);
		expect(s.sigma2(10)).toBeCloseTo(9, 12);
		expect(s.sigma2(5)).toBeCloseTo(4, 12);
	});

	it('the OLS fit recovers the truth approximately', () => {
		const s = heteroRegressionSample(100, SEED);
		const beta = olsClosedForm(s.X, s.y);
		expect(Math.abs(beta[1] - 1.5)).toBeLessThan(0.3);
		expect(Math.abs(beta[0] - 2)).toBeLessThan(2);
	});

	it('rejects n < 3', () => {
		expect(() => heteroRegressionSample(2, SEED)).toThrow();
	});
});

describe('Mammen weights (Mammen 1993 — moments by direct computation)', () => {
	// E[v] = 0, E[v²] = 1, E[v³] = 1 are EXACT for v = −(√5−1)/2 c.p. (5+√5)/10
	// and v = +(√5+1)/2 c.p. (5−√5)/10: check the empirical moments over a
	// large seeded stream (the analytic values are verified in the module
	// docstring; this is the numeric witness).
	it('empirical moments converge to (0, 1, 1) over 200 000 draws', () => {
		const rng = mulberry32(123);
		const M = 200000;
		let s1 = 0,
			s2 = 0,
			s3 = 0,
			nLo = 0;
		for (let i = 0; i < M; i++) {
			// Re-derive the weight draw from the exported constants.
			const v = rng() < MAMMEN_LO_P ? MAMMEN_LO : MAMMEN_HI;
			if (v < 0) nLo++;
			s1 += v;
			s2 += v * v;
			s3 += v * v * v;
		}
		expect(Math.abs(s1 / M)).toBeLessThan(0.006);
		expect(s2 / M).toBeGreaterThan(0.99);
		expect(s2 / M).toBeLessThan(1.01);
		expect(s3 / M).toBeGreaterThan(0.985);
		expect(s3 / M).toBeLessThan(1.015);
		// Draw frequency of the low point ≈ (5+√5)/10 ≈ 0.7236.
		expect(Math.abs(nLo / M - (5 + Math.sqrt(5)) / 10)).toBeLessThan(0.01);
	});
});

describe('residualBootstrapSlopes (Wu 1986 — naive variant)', () => {
	it('is deterministic for a fixed seed', () => {
		const s = heteroRegressionSample(30, SEED);
		const a = residualBootstrapSlopes(s.X, s.y, 50, mulberry32(combineSeed(SEED, 100)));
		const b = residualBootstrapSlopes(s.X, s.y, 50, mulberry32(combineSeed(SEED, 100)));
		expect(a).toEqual(b);
	});

	it('recovers the exact slope on a noise-free line (analytic case)', () => {
		// y = 2 + 1.5x exactly: all residuals are 0, so Y* = Xβ̂ and every
		// refit returns 1.5.
		const x = linspace(0, 10, 15);
		const y = x.map((xi) => 2 + 1.5 * xi);
		const X = withIntercept(x.map((xi) => [xi]));
		const slopes = residualBootstrapSlopes(X, y, 200, mulberry32(combineSeed(SEED, 101)));
		for (const s of slopes) expect(s).toBeCloseTo(1.5, 9);
		expect(bootstrapStandardError(slopes)).toBeCloseTo(0, 9);
	});

	it('is biased LOW on the fan design, wild bootstrap is not (Wu 1986)', () => {
		// Measured (seed 97, n = 100, B = 2000, R = 500): naive/true ≈ 0.877,
		// wild-Rademacher/true ≈ 0.961, wild-Mammen/true ≈ 0.985. The naive
		// residual bootstrap implicitly imposes σ_i² = σ² and underestimates
		// the slope SE on the fan; the wild bootstrap stays calibrated.
		const n = 100;
		const B = 2000;
		const s = heteroRegressionSample(n, SEED);
		const trueSE = trueSlopeSE({ n, R: 500, seed: SEED }).se;
		const naive = bootstrapStandardError(
			residualBootstrapSlopes(s.X, s.y, B, mulberry32(combineSeed(SEED, 102)))
		);
		const wildR = bootstrapStandardError(
			wildBootstrapSlopes(s.X, s.y, B, mulberry32(combineSeed(SEED, 103)), 'rademacher')
		);
		const wildM = bootstrapStandardError(
			wildBootstrapSlopes(s.X, s.y, B, mulberry32(combineSeed(SEED, 104)), 'mammen')
		);
		expect(naive / trueSE).toBeLessThan(0.95);
		expect(naive / trueSE).toBeGreaterThan(0.75);
		expect(Math.abs(wildR / trueSE - 1)).toBeLessThan(0.1);
		expect(Math.abs(wildM / trueSE - 1)).toBeLessThan(0.1);
	});

	it('rejects degenerate inputs', () => {
		const s = heteroRegressionSample(20, SEED);
		expect(() => residualBootstrapSlopes(s.X, s.y, 0, mulberry32(1))).toThrow();
		expect(() => residualBootstrapSlopes(s.X, s.y.slice(0, 19), 10, mulberry32(1))).toThrow();
		expect(() => residualBootstrapSlopes(s.X, s.y, 10, mulberry32(1))).not.toThrow();
	});
});

describe('wildBootstrapSlopes (Wu 1986; Mammen 1993)', () => {
	it('is deterministic for a fixed seed and weight type', () => {
		const s = heteroRegressionSample(30, SEED);
		const a = wildBootstrapSlopes(s.X, s.y, 50, mulberry32(combineSeed(SEED, 105)), 'rademacher');
		const b = wildBootstrapSlopes(s.X, s.y, 50, mulberry32(combineSeed(SEED, 105)), 'rademacher');
		expect(a).toEqual(b);
		const c = wildBootstrapSlopes(s.X, s.y, 50, mulberry32(combineSeed(SEED, 105)), 'mammen');
		expect(c).not.toEqual(a);
	});

	it('recovers the exact slope on a noise-free line (analytic case)', () => {
		const x = linspace(0, 10, 15);
		const y = x.map((xi) => 2 + 1.5 * xi);
		const X = withIntercept(x.map((xi) => [xi]));
		for (const w of ['rademacher', 'mammen'] as const) {
			const slopes = wildBootstrapSlopes(X, y, 200, mulberry32(combineSeed(SEED, 106)), w);
			for (const s of slopes) expect(s).toBeCloseTo(1.5, 9);
			expect(bootstrapStandardError(slopes)).toBeCloseTo(0, 9);
		}
	});

	it('rejects an unknown weight type', () => {
		const s = heteroRegressionSample(20, SEED);
		expect(() => wildBootstrapSlopes(s.X, s.y, 10, mulberry32(1), 'weird' as never)).toThrow();
	});
});

describe('trueSlopeSE (calibration by simulation)', () => {
	it('is deterministic and equals the sd of its own values', () => {
		const a = trueSlopeSE({ n: 50, R: 100, seed: SEED });
		const b = trueSlopeSE({ n: 50, R: 100, seed: SEED });
		expect(a.se).toBe(b.se);
		expect(a.values).toEqual(b.values);
		expect(a.se).toBeCloseTo(bootstrapStandardError(a.values), 12);
	});

	it('returns a positive SE on the fan design', () => {
		const { se, values } = trueSlopeSE({ n: 10, R: 50, seed: SEED });
		expect(se).toBeGreaterThan(0);
		expect(values).toHaveLength(50);
	});

	it('rejects invalid inputs', () => {
		expect(() => trueSlopeSE({ n: 2, R: 10, seed: SEED })).toThrow();
		expect(() => trueSlopeSE({ n: 10, R: 1, seed: SEED })).toThrow();
	});
});

describe('uniformSample (Bickel & Freedman 1981, §6 — bounded support)', () => {
	it('is deterministic and lies in [0, theta)', () => {
		const a = uniformSample(20, 4, SEED);
		const b = uniformSample(20, 4, SEED);
		expect(a).toEqual(b);
		expect(a).toHaveLength(20);
		for (const v of a) {
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(4);
		}
	});

	it('rejects n < 2 and non-positive theta', () => {
		expect(() => uniformSample(1, 4, SEED)).toThrow();
		expect(() => uniformSample(10, 0, SEED)).toThrow();
	});
});

describe('bootstrapMaxPivots (Bickel & Freedman 1981, §6 — the failure)', () => {
	it('is deterministic and never negative (X*_(n) ≤ X_(n))', () => {
		const sample = uniformSample(30, 4, SEED);
		const a = bootstrapMaxPivots(sample, 200, mulberry32(combineSeed(SEED, 110)));
		const b = bootstrapMaxPivots(sample, 200, mulberry32(combineSeed(SEED, 110)));
		expect(a).toEqual(b);
		expect(a).toHaveLength(200);
		for (const p of a) expect(p).toBeGreaterThanOrEqual(0);
	});

	it('carries the exact coincidence mass 1 − (1−1/n)ⁿ at the pivot 0', () => {
		// X*_(n) = X_(n) iff at least one of the n draws lands on the max:
		// probability 1 − (1−1/n)ⁿ — computed EXACTLY from the construction,
		// not estimated from the weak limit. B = 4000: MC sd of the rate
		// ≈ √(0.63·0.37/4000) ≈ 0.0077, so ±0.025 is ~3 sd.
		const B = 4000;
		for (const n of [20, 50, 100]) {
			const sample = uniformSample(n, 4, SEED);
			const pivots = bootstrapMaxPivots(sample, B, mulberry32(combineSeed(SEED, 111 + n)));
			const zeros = pivots.filter((p) => p === 0).length / B;
			expect(Math.abs(zeros - (1 - (1 - 1 / n) ** n))).toBeLessThan(0.025);
		}
	});

	it('the coincidence rate is far from 0 for every n (no continuous limit at 0)', () => {
		// A continuous limit of the pivot would put zero mass at 0; the
		// empirical rate stays near 1 − 1/e ≈ 0.63 at all n.
		const B = 2000;
		for (const n of [10, 100, 200]) {
			const sample = uniformSample(n, 4, SEED);
			const pivots = bootstrapMaxPivots(sample, B, mulberry32(combineSeed(SEED, 121 + n)));
			const zeros = pivots.filter((p) => p === 0).length / B;
			expect(zeros).toBeGreaterThan(0.55);
		}
	});

	it('rejects invalid inputs', () => {
		expect(() => bootstrapMaxPivots([1], 10, mulberry32(1))).toThrow();
		expect(() => bootstrapMaxPivots([1, 2], 0, mulberry32(1))).toThrow();
		expect(() => bootstrapMaxPivots([-1, 0], 10, mulberry32(1))).toThrow();
	});
});

describe('parametricBootstrapMaxPivots (Bickel & Freedman 1981, §6 — the repair)', () => {
	it('is deterministic, in [0, n), and invariant to the sample scale', () => {
		// The pivot n(1 − U_(n)) reads only n and the RNG stream: rescaling
		// the sample (same draws, different θ) leaves it untouched.
		const a = parametricBootstrapMaxPivots(uniformSample(30, 4, SEED), 200, mulberry32(combineSeed(SEED, 130)));
		const b = parametricBootstrapMaxPivots(uniformSample(30, 4, SEED), 200, mulberry32(combineSeed(SEED, 130)));
		expect(a).toEqual(b);
		expect(a).toHaveLength(200);
		for (const p of a) {
			expect(p).toBeGreaterThanOrEqual(0);
			expect(p).toBeLessThan(30);
		}
		const scaled = parametricBootstrapMaxPivots(
			uniformSample(30, 4, SEED).map((v) => 7 * v),
			200,
			mulberry32(combineSeed(SEED, 130))
		);
		expect(scaled).toEqual(a);
	});

	it('mean of n(1 − U_(n)) is exactly n/(n+1) (not 1) at finite n', () => {
		// E[U_(n)] = n/(n+1), so E[n(1 − U_(n))] = n/(n+1) → 1 only as
		// n → ∞ (the Exp(1) limit, mean 1). Measured n = 30, B = 4000: 0.965.
		const n = 30;
		const B = 4000;
		const sample = uniformSample(n, 4, SEED);
		const pivots = parametricBootstrapMaxPivots(sample, B, mulberry32(combineSeed(SEED, 131)));
		const mean = pivots.reduce((acc, v) => acc + v, 0) / B;
		expect(Math.abs(mean - n / (n + 1))).toBeLessThan(0.05);
	});

	it('rejects invalid inputs', () => {
		expect(() => parametricBootstrapMaxPivots([1], 10, mulberry32(1))).toThrow();
		expect(() => parametricBootstrapMaxPivots([1, 2], 0, mulberry32(1))).toThrow();
	});
});

describe('bootstrapMedians (Bickel & Freedman 1981, §5 Prop. 5.1 — the success)', () => {
	it('is deterministic and stays inside the observed range', () => {
		const sample = uniformSample(40, 4, SEED);
		const a = bootstrapMedians(sample, 200, mulberry32(combineSeed(SEED, 140)));
		const b = bootstrapMedians(sample, 200, mulberry32(combineSeed(SEED, 140)));
		expect(a).toEqual(b);
		expect(a).toHaveLength(200);
		const lo = Math.min(...sample);
		const hi = Math.max(...sample);
		for (const m of a) {
			expect(m).toBeGreaterThanOrEqual(lo);
			expect(m).toBeLessThanOrEqual(hi);
		}
	});

	it('bootstrap SE tracks the theory θ/(2√n) for the uniform (f = 1/θ)', () => {
		// Prop. 5.1: √n(m* − m) ⇒ N(0, 1/(4f²)) — the bootstrap reproduces
		// the sampling law of the median. Measured (seed 97, n = 100,
		// B = 4000): ratio ≈ 1.08; the per-sample spacing of the empirical
		// density near the median adds O(1/√B) noise, hence the band.
		const n = 100;
		const sample = uniformSample(n, 4, SEED);
		const medians = bootstrapMedians(sample, 4000, mulberry32(combineSeed(SEED, 141)));
		const ratio = bootstrapStandardError(medians) / medianSEUniform(4, n);
		expect(ratio).toBeGreaterThan(0.9);
		expect(ratio).toBeLessThan(1.18);
	});

	it('rejects invalid inputs', () => {
		expect(() => bootstrapMedians([1], 10, mulberry32(1))).toThrow();
		expect(() => bootstrapMedians([1, 2], 0, mulberry32(1))).toThrow();
	});
});

describe('exponentialPDF (Bickel & Freedman 1981, §6 — true pivot limit)', () => {
	it('is the standard Exp(1) density', () => {
		expect(exponentialPDF(0)).toBeCloseTo(1, 12);
		expect(exponentialPDF(1)).toBeCloseTo(Math.exp(-1), 12);
		expect(exponentialPDF(2)).toBeCloseTo(Math.exp(-2), 12);
		expect(exponentialPDF(-1)).toBe(0);
		// Non-increasing on the positive axis.
		for (let i = 1; i <= 50; i++) {
			expect(exponentialPDF(i / 10)).toBeLessThanOrEqual(exponentialPDF((i - 1) / 10));
		}
	});
});

describe('medianSEUniform (Prop. 5.1 with f = 1/θ)', () => {
	it('exact values', () => {
		expect(medianSEUniform(4, 4)).toBeCloseTo(1, 12);
		expect(medianSEUniform(2, 1)).toBeCloseTo(1, 12);
		expect(medianSEUniform(4, 100)).toBeCloseTo(0.2, 12);
	});

	it('rejects invalid inputs', () => {
		expect(() => medianSEUniform(0, 10)).toThrow();
		expect(() => medianSEUniform(4, 0)).toThrow();
	});
});
