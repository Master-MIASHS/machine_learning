import { describe, expect, it } from 'vitest';
import {
	coverSeparabilityProbability,
	fitRandomFeatures,
	gaussianLinearClassifierError,
	gaussianMatrix,
	gramSpectrum,
	marchenkoPasturConditionNumber,
	marchenkoPasturDensity,
	marchenkoPasturEdges,
	marchenkoPasturStieltjes,
	optimalRidgeLambda,
	rfTrainingSet,
	ridgeAsymptoticRisk,
	ridgeFit,
	ridgelessAsymptoticRisk,
	sampleGramSpectrum,
	sampleRandomFeatures,
	simulateClassificationDoubleDescent,
	simulateLinearDoubleDescent,
	simulateRandomFeaturesDoubleDescent,
	standardGaussian,
	weakFeaturesRisk
} from './double-descent';
import { mulberry32 } from './util';

/** Midpoint-rule quadrature on [a, b] (integrable square-root edges). */
function integrate(f: (s: number) => number, a: number, b: number, m = 20000): number {
	const h = (b - a) / m;
	let s = 0;
	for (let i = 0; i < m; i++) s += f(a + (i + 0.5) * h);
	return s * h;
}

function matVec(X: number[][], b: number[]): number[] {
	return X.map((row) => row.reduce((s, v, j) => s + v * b[j], 0));
}

describe('weakFeaturesRisk (Belkin, Hsu & Xu 2020, Theorem 1)', () => {
	it('matches hand-computed closed-form values', () => {
		// p ≤ n-2: (0 + 1)(1 + 5/4) = 2.25
		expect(weakFeaturesRisk({ n: 10, p: 5, signalIn: 3, signalOut: 0, sigma2: 1 })).toBeCloseTo(
			2.25,
			12
		);
		// p ≥ n+2: 1·(1 − 10/20) + 1·(1 + 10/9)
		expect(weakFeaturesRisk({ n: 10, p: 20, signalIn: 1, signalOut: 0, sigma2: 1 })).toBeCloseTo(
			0.5 + 1 + 10 / 9,
			12
		);
	});

	it('is infinite exactly for n-1 ≤ p ≤ n+1', () => {
		const base = { n: 10, signalIn: 1, signalOut: 1, sigma2: 1 };
		expect(Number.isFinite(weakFeaturesRisk({ ...base, p: 8 }))).toBe(true);
		for (const p of [9, 10, 11]) expect(weakFeaturesRisk({ ...base, p })).toBe(Infinity);
		expect(Number.isFinite(weakFeaturesRisk({ ...base, p: 12 }))).toBe(true);
	});

	it('increases towards the threshold from both sides', () => {
		const base = { n: 30, signalIn: 1, signalOut: 0.5, sigma2: 0.25 };
		let prev = 0;
		for (let p = 1; p <= 28; p++) {
			const r = weakFeaturesRisk({ ...base, p });
			expect(r).toBeGreaterThan(prev);
			prev = r;
		}
		prev = Infinity;
		for (let p = 32; p <= 200; p++) {
			const r = weakFeaturesRisk({ ...base, p });
			expect(r).toBeLessThan(prev);
			prev = r;
		}
	});

	it('converges to the asymptotic excess risk of Hastie et al. (σ² added back)', () => {
		const n = 20000;
		for (const gamma of [0.5, 2]) {
			const p = gamma * n;
			const finite = weakFeaturesRisk({ n, p, signalIn: 1, signalOut: 0, sigma2: 1 });
			const asym = ridgelessAsymptoticRisk(gamma, 1, 1).risk + 1;
			expect(finite).toBeCloseTo(asym, 3);
		}
	});

	it('agrees with a Monte-Carlo simulation away from the threshold', () => {
		const n = 20;
		const D = 60;
		const sim = simulateLinearDoubleDescent({
			n,
			pGrid: [6, 50],
			D,
			r2: 1,
			sigma2: 0.5,
			lambda: 0,
			repetitions: 600,
			seed: 11
		});
		for (const pt of sim) {
			const theory = weakFeaturesRisk({
				n,
				p: pt.p,
				signalIn: pt.p / D,
				signalOut: 1 - pt.p / D,
				sigma2: 0.5
			});
			expect(Math.abs(pt.testRisk - theory) / theory).toBeLessThan(0.08);
		}
	});

	it('rejects invalid inputs', () => {
		expect(() => weakFeaturesRisk({ n: 0, p: 1, signalIn: 1, signalOut: 0, sigma2: 1 })).toThrow();
		expect(() => weakFeaturesRisk({ n: 5, p: 1, signalIn: -1, signalOut: 0, sigma2: 1 })).toThrow();
		expect(() => weakFeaturesRisk({ n: 5, p: 1, signalIn: 1, signalOut: 0, sigma2: -1 })).toThrow();
	});
});

describe('Marchenko–Pastur law', () => {
	it('has edges (1 ± √γ)², touching 0 exactly at γ = 1', () => {
		expect(marchenkoPasturEdges(1)).toEqual([0, 4]);
		const [a, b] = marchenkoPasturEdges(0.25);
		expect(a).toBeCloseTo(0.25, 12);
		expect(b).toBeCloseTo(2.25, 12);
		expect(marchenkoPasturConditionNumber(1)).toBe(Infinity);
		expect(marchenkoPasturConditionNumber(0.25)).toBeCloseTo(9, 12);
	});

	it('continuous part has mass 1 (γ ≤ 1) or 1/γ (γ > 1), and mean 1', () => {
		for (const gamma of [0.2, 0.5, 2, 4]) {
			const [a, b] = marchenkoPasturEdges(gamma);
			const mass = integrate((s) => marchenkoPasturDensity(s, gamma), a, b);
			const mean = integrate((s) => s * marchenkoPasturDensity(s, gamma), a, b);
			expect(mass).toBeCloseTo(gamma <= 1 ? 1 : 1 / gamma, 3);
			expect(mean).toBeCloseTo(1, 3);
		}
	});

	it('Stieltjes transform and derivative match quadrature (atom included for γ > 1)', () => {
		for (const gamma of [0.3, 0.9, 1.5, 3]) {
			for (const lambda of [0.05, 0.5, 2]) {
				const [a, b] = marchenkoPasturEdges(gamma);
				const atom = gamma > 1 ? 1 - 1 / gamma : 0;
				const m =
					integrate((s) => marchenkoPasturDensity(s, gamma) / (s + lambda), a, b) + atom / lambda;
				const dm =
					integrate((s) => marchenkoPasturDensity(s, gamma) / (s + lambda) ** 2, a, b) +
					atom / lambda ** 2;
				const got = marchenkoPasturStieltjes(lambda, gamma);
				expect(got.m).toBeCloseTo(m, 3);
				expect(got.dm / dm).toBeCloseTo(1, 3);
			}
		}
	});

	it('γ → 0 limit: μ → δ₁ so m(−λ) → 1/(1+λ)', () => {
		expect(marchenkoPasturStieltjes(0.7, 1e-9).m).toBeCloseTo(1 / 1.7, 6);
	});

	it('empirical Gram spectrum: min(n,p) eigenvalues, trace identity, Bai–Yin edge', () => {
		const rand = mulberry32(5);
		const X = gaussianMatrix(30, 12, rand);
		const eig = gramSpectrum(X);
		expect(eig).toHaveLength(12);
		const trace = X.reduce((s, row) => s + row.reduce((t, v) => t + v * v, 0), 0) / 30;
		expect(eig.reduce((s, v) => s + v, 0)).toBeCloseTo(trace, 8);
		expect(gramSpectrum(gaussianMatrix(8, 20, rand))).toHaveLength(8);

		// γ = 1/4, n = 240: smallest eigenvalue near (1 − 1/2)² = 0.25
		const s = sampleGramSpectrum(240, 60, 3);
		expect(s.minEigenvalue).toBeGreaterThan(0.12);
		expect(s.minEigenvalue).toBeLessThan(0.35);
		// γ = 1: smallest eigenvalue is tiny (Bai–Yin limit is 0)
		expect(sampleGramSpectrum(60, 60, 3).minEigenvalue).toBeLessThan(0.02);
	});
});

describe('asymptotic ridge / ridgeless risk (Hastie et al. 2022)', () => {
	it('ridgeless closed forms', () => {
		expect(ridgelessAsymptoticRisk(0.5, 7, 1).risk).toBeCloseTo(1, 12); // σ²γ/(1−γ), bias 0
		const over = ridgelessAsymptoticRisk(2, 1, 1);
		expect(over.bias).toBeCloseTo(0.5, 12);
		expect(over.variance).toBeCloseTo(1, 12);
		expect(ridgelessAsymptoticRisk(1, 1, 1).risk).toBe(Infinity);
		// γ → ∞: the min-norm estimator tends to the null risk r²
		expect(ridgelessAsymptoticRisk(1e6, 3, 1).risk).toBeCloseTo(3, 4);
	});

	it('ridge tends to ridgeless as λ → 0+', () => {
		for (const gamma of [0.4, 2.5]) {
			const r0 = ridgelessAsymptoticRisk(gamma, 1, 0.5);
			const rl = ridgeAsymptoticRisk(gamma, 1e-7, 1, 0.5);
			expect(rl.bias).toBeCloseTo(r0.bias, 4);
			expect(rl.variance).toBeCloseTo(r0.variance, 4);
		}
	});

	it('ridge tends to the null risk r² as λ → ∞', () => {
		expect(ridgeAsymptoticRisk(1.3, 1e7, 2, 1).risk).toBeCloseTo(2, 4);
	});

	it('is minimized at λ* = σ²γ/r², where risk = σ²γ m(−λ*)', () => {
		for (const gamma of [0.3, 1, 2]) {
			const r2 = 1.5;
			const sigma2 = 0.4;
			const ls = optimalRidgeLambda(gamma, r2, sigma2);
			const at = ridgeAsymptoticRisk(gamma, ls, r2, sigma2).risk;
			for (const f of [0.5, 0.8, 1.25, 2]) {
				expect(ridgeAsymptoticRisk(gamma, f * ls, r2, sigma2).risk).toBeGreaterThan(at);
			}
			expect(at).toBeCloseTo(sigma2 * gamma * marchenkoPasturStieltjes(ls, gamma).m, 10);
		}
	});

	it('optimal ridge dominates min-norm everywhere and stays finite at γ = 1', () => {
		for (const gamma of [0.2, 0.6, 0.95, 1, 1.05, 1.8, 5]) {
			const opt = ridgeAsymptoticRisk(gamma, optimalRidgeLambda(gamma, 1, 0.5), 1, 0.5).risk;
			expect(Number.isFinite(opt)).toBe(true);
			expect(opt).toBeLessThanOrEqual(ridgelessAsymptoticRisk(gamma, 1, 0.5).risk);
		}
	});

	it('matches a Monte-Carlo simulation of ridge (well-specified, p = D)', () => {
		const n = 60;
		const p = 90; // γ = 1.5
		const lambda = 0.2;
		const sim = simulateLinearDoubleDescent({
			n,
			pGrid: [p],
			D: p,
			r2: 1,
			sigma2: 0.5,
			lambda,
			repetitions: 150,
			seed: 4
		});
		const theory = ridgeAsymptoticRisk(p / n, lambda, 1, 0.5).risk + 0.5;
		expect(Math.abs(sim[0].testRisk - theory) / theory).toBeLessThan(0.06);
	});

	it('rejects invalid inputs', () => {
		expect(() => ridgelessAsymptoticRisk(0, 1, 1)).toThrow();
		expect(() => ridgeAsymptoticRisk(1, -1, 1, 1)).toThrow();
		expect(() => marchenkoPasturStieltjes(0, 1)).toThrow();
		expect(() => optimalRidgeLambda(1, 0, 1)).toThrow();
	});
});

describe('ridgeFit', () => {
	const rand = mulberry32(21);

	it('λ = 0, p < n: solves the normal equations X^T(Xb − y) = 0', () => {
		const X = gaussianMatrix(15, 4, rand);
		const y = Array.from({ length: 15 }, () => standardGaussian(rand));
		const b = ridgeFit(X, y, 0);
		const r = matVec(X, b).map((v, i) => v - y[i]);
		for (let j = 0; j < 4; j++) {
			expect(X.reduce((s, row, i) => s + row[j] * r[i], 0)).toBeCloseTo(0, 9);
		}
	});

	it('λ = 0, p > n: interpolates and has smaller norm than another interpolator', () => {
		const X = gaussianMatrix(5, 12, rand);
		const y = Array.from({ length: 5 }, () => standardGaussian(rand));
		const b = ridgeFit(X, y, 0);
		matVec(X, b).forEach((v, i) => expect(v).toBeCloseTo(y[i], 9));
		// add a vector of the null space of X: still interpolates, larger norm
		const z = Array.from({ length: 12 }, () => standardGaussian(rand));
		const Pz = ridgeFit(X, matVec(X, z), 0); // projection of z on the row space
		const nullVec = z.map((v, j) => v - Pz[j]);
		matVec(X, nullVec).forEach((v) => expect(v).toBeCloseTo(0, 8));
		const other = b.map((v, j) => v + nullVec[j]);
		const nb = b.reduce((s, v) => s + v * v, 0);
		const no = other.reduce((s, v) => s + v * v, 0);
		expect(nb).toBeLessThan(no);
	});

	it('primal and dual (push-through) forms agree for λ > 0', () => {
		const X = gaussianMatrix(6, 9, rand);
		const y = Array.from({ length: 6 }, () => standardGaussian(rand));
		const lambda = 0.3;
		const dual = ridgeFit(X, y, lambda); // p > n → dual form
		// primal form on the same data, computed through the transposed problem:
		// (X^T X + nλ I) b = X^T y checked directly.
		const n = 6;
		for (let a = 0; a < 9; a++) {
			let lhs = n * lambda * dual[a];
			for (let i = 0; i < n; i++) lhs += X[i][a] * matVec([X[i]], dual)[0];
			const rhs = X.reduce((s, row, i) => s + row[a] * y[i], 0);
			expect(lhs).toBeCloseTo(rhs, 9);
		}
	});

	it('shrinks to 0 as λ → ∞', () => {
		const X = gaussianMatrix(10, 3, rand);
		const y = Array.from({ length: 10 }, () => standardGaussian(rand));
		const b = ridgeFit(X, y, 1e9);
		b.forEach((v) => expect(Math.abs(v)).toBeLessThan(1e-8));
	});

	it('rank-deficient X (duplicated column): min-norm splits the weight equally', () => {
		const col = [1, 2, 3, 4];
		const X = col.map((v) => [v, v]);
		const y = col.map((v) => 2 * v);
		const b = ridgeFit(X, y, 0);
		expect(b[0]).toBeCloseTo(1, 6);
		expect(b[1]).toBeCloseTo(1, 6);
	});

	it('rejects invalid inputs', () => {
		expect(() => ridgeFit([[1]], [1, 2], 0)).toThrow();
		expect(() => ridgeFit([[1]], [1], -1)).toThrow();
	});
});

describe('simulateLinearDoubleDescent', () => {
	const base = { n: 20, D: 60, r2: 1, sigma2: 0.25, repetitions: 40, seed: 2 };

	it('training error vanishes once p ≥ n (λ = 0) and the test risk peaks at p = n', () => {
		const sim = simulateLinearDoubleDescent({ ...base, pGrid: [10, 20, 60], lambda: 0 });
		expect(sim[1].trainRisk).toBeLessThan(1e-12);
		expect(sim[2].trainRisk).toBeLessThan(1e-12);
		expect(sim[1].testRiskMedian).toBeGreaterThan(3 * sim[0].testRiskMedian);
		expect(sim[1].testRiskMedian).toBeGreaterThan(3 * sim[2].testRiskMedian);
		// the coefficient norm blows up at the threshold
		expect(sim[1].normSq).toBeGreaterThan(5 * sim[2].normSq);
	});

	it('ridge removes the peak', () => {
		const ridge = simulateLinearDoubleDescent({ ...base, pGrid: [20], lambda: 0.1 });
		const mn = simulateLinearDoubleDescent({ ...base, pGrid: [20], lambda: 0 });
		expect(ridge[0].testRisk).toBeLessThan(mn[0].testRisk / 5);
	});

	it('is deterministic for a given seed', () => {
		const a = simulateLinearDoubleDescent({ ...base, pGrid: [7, 33], lambda: 0 });
		const b = simulateLinearDoubleDescent({ ...base, pGrid: [7, 33], lambda: 0 });
		expect(a).toEqual(b);
	});

	it('rejects p outside [1, D]', () => {
		expect(() => simulateLinearDoubleDescent({ ...base, pGrid: [61], lambda: 0 })).toThrow();
	});
});

describe('coverSeparabilityProbability (Cover 1965)', () => {
	it('equals 1 for n ≤ d and exactly 1/2 at n = 2d', () => {
		expect(coverSeparabilityProbability(3, 5)).toBe(1);
		expect(coverSeparabilityProbability(5, 5)).toBe(1);
		for (const d of [1, 3, 10, 50, 200]) {
			expect(coverSeparabilityProbability(2 * d, d)).toBeCloseTo(0.5, 10);
		}
	});

	it('matches the direct binomial sum on small cases', () => {
		const binom = (m: number, k: number): number => {
			let r = 1;
			for (let i = 1; i <= k; i++) r = (r * (m - k + i)) / i;
			return r;
		};
		for (const [n, d] of [
			[7, 3],
			[12, 4],
			[9, 2]
		]) {
			let s = 0;
			for (let k = 0; k <= d - 1; k++) s += binom(n - 1, k);
			expect(coverSeparabilityProbability(n, d)).toBeCloseTo((2 * s) / 2 ** n, 12);
		}
		// d = 1: only the two "all one side" dichotomies of the line through 0
		expect(coverSeparabilityProbability(6, 1)).toBeCloseTo(2 / 64, 12);
	});

	it('is non-increasing in n and stays in [0, 1] for large n', () => {
		let prev = 1;
		for (let n = 1; n <= 400; n++) {
			const pr = coverSeparabilityProbability(n, 50);
			expect(pr).toBeLessThanOrEqual(prev + 1e-12);
			expect(pr).toBeGreaterThanOrEqual(0);
			prev = pr;
		}
		expect(coverSeparabilityProbability(3000, 1000)).toBeLessThan(1e-10);
	});
});

describe('gaussianLinearClassifierError', () => {
	const beta = [1, 2, -1];

	it('exact values on aligned, opposite, orthogonal and null classifiers', () => {
		expect(gaussianLinearClassifierError(beta, beta, 0.1)).toBeCloseTo(0.1, 12);
		expect(
			gaussianLinearClassifierError(
				beta.map((v) => -v),
				beta,
				0.1
			)
		).toBeCloseTo(0.9, 12);
		expect(gaussianLinearClassifierError([2, -1, 0], beta, 0)).toBeCloseTo(0.5, 12);
		expect(gaussianLinearClassifierError([0, 0, 0], beta, 0)).toBe(0.5);
	});

	it('agrees with a Monte-Carlo estimate of the angle formula', () => {
		const rand = mulberry32(8);
		const w = [1, 0.5, 0.3];
		let errs = 0;
		const M = 40000;
		for (let i = 0; i < M; i++) {
			const x = [standardGaussian(rand), standardGaussian(rand), standardGaussian(rand)];
			const sw = x.reduce((s, v, j) => s + v * w[j], 0) >= 0;
			const sb = x.reduce((s, v, j) => s + v * beta[j], 0) >= 0;
			if (sw !== sb) errs++;
		}
		expect(errs / M).toBeCloseTo(gaussianLinearClassifierError(w, beta, 0), 2);
	});

	it('anisotropic Σ: matches a Monte-Carlo estimate and reduces to the isotropic case', () => {
		const variances = [4, 0.25, 1];
		const w = [0.2, 1, -0.5];
		const rand = mulberry32(17);
		let errs = 0;
		const M = 40000;
		for (let i = 0; i < M; i++) {
			const x = variances.map((v) => Math.sqrt(v) * standardGaussian(rand));
			const sw = x.reduce((s, v, j) => s + v * w[j], 0) >= 0;
			const sb = x.reduce((s, v, j) => s + v * beta[j], 0) >= 0;
			if (sw !== sb) errs++;
		}
		expect(errs / M).toBeCloseTo(gaussianLinearClassifierError(w, beta, 0, variances), 2);
		expect(gaussianLinearClassifierError(w, beta, 0.1, [1, 1, 1])).toBeCloseTo(
			gaussianLinearClassifierError(w, beta, 0.1),
			12
		);
	});

	it('rejects invalid inputs', () => {
		expect(() => gaussianLinearClassifierError([1], [1, 2])).toThrow();
		expect(() => gaussianLinearClassifierError([1, 2], [1, 2], 0, [1])).toThrow();
		expect(() => gaussianLinearClassifierError([1], [0])).toThrow();
		expect(() => gaussianLinearClassifierError([1], [1], 0.7)).toThrow();
	});
});

describe('simulateClassificationDoubleDescent', () => {
	const base = { n: 40, D: 200, eta: 0, repetitions: 20, seed: 3 };

	it('U-shape below n, peak near chance at p = n, second descent beyond (λ = 0)', () => {
		const sim = simulateClassificationDoubleDescent({
			...base,
			pGrid: [5, 20, 40, 200],
			lambda: 0
		});
		const [oracle, mid, peak, wide] = sim.map((s) => s.testError);
		expect(oracle).toBeLessThan(mid); // classical U: junk features hurt below n
		expect(peak).toBeGreaterThan(0.4);
		expect(peak).toBeGreaterThan(mid + 0.1);
		expect(wide).toBeLessThan(peak - 0.2);
		expect(sim[2].trainError).toBe(0);
		expect(sim[3].zeroTrainErrorFraction).toBe(1);
	});

	it('ridge regularization lowers the error at the threshold', () => {
		const mn = simulateClassificationDoubleDescent({ ...base, pGrid: [40], lambda: 0 });
		const rg = simulateClassificationDoubleDescent({ ...base, pGrid: [40], lambda: 0.5 });
		expect(rg[0].testError).toBeLessThan(mn[0].testError - 0.1);
	});

	it('test error is at least the label-noise level', () => {
		const sim = simulateClassificationDoubleDescent({
			...base,
			eta: 0.2,
			pGrid: [5, 80],
			lambda: 0
		});
		sim.forEach((pt) => expect(pt.testError).toBeGreaterThanOrEqual(0.2));
	});

	it('rejects invalid inputs', () => {
		expect(() =>
			simulateClassificationDoubleDescent({ ...base, eta: 0.5, pGrid: [5], lambda: 0 })
		).toThrow();
		expect(() =>
			simulateClassificationDoubleDescent({ ...base, pGrid: [5], lambda: 0, junkVariance: 0 })
		).toThrow();
	});
});

describe('random ReLU features', () => {
	it('stratified training inputs lie in [-1, 1], one per cell', () => {
		const { x } = rfTrainingSet(10, 0.3, 1);
		x.forEach((v, i) => {
			expect(v).toBeGreaterThanOrEqual(-1 + (2 * i) / 10);
			expect(v).toBeLessThanOrEqual(-1 + (2 * (i + 1)) / 10);
		});
	});

	it('interpolates the training set once N ≥ n (λ = 0)', () => {
		const { x, y } = rfTrainingSet(15, 0.3, 2);
		const fit = fitRandomFeatures(x, y, sampleRandomFeatures(120, 4), 0);
		expect(fit.trainMSE).toBeLessThan(1e-8);
		expect(fit.fitted).toHaveLength(fit.grid.length);
	});

	it('model-wise double descent: median peak at N ≈ n, removed by ridge', () => {
		const opts = { n: 20, NGrid: [5, 20, 400], noiseStd: 0.3, repetitions: 21, seed: 1 };
		const mn = simulateRandomFeaturesDoubleDescent({ ...opts, lambda: 0 });
		expect(mn[1].testMSEMedian).toBeGreaterThan(2 * mn[0].testMSEMedian);
		expect(mn[1].testMSEMedian).toBeGreaterThan(2 * mn[2].testMSEMedian);
		const rg = simulateRandomFeaturesDoubleDescent({ ...opts, lambda: 1e-4 });
		expect(rg[1].testMSEMedian).toBeLessThan(mn[1].testMSEMedian / 3);
	});

	it('is deterministic for a given seed', () => {
		const opts = { n: 12, NGrid: [6, 30], noiseStd: 0.2, lambda: 0, repetitions: 3, seed: 9 };
		expect(simulateRandomFeaturesDoubleDescent(opts)).toEqual(
			simulateRandomFeaturesDoubleDescent(opts)
		);
	});
});
