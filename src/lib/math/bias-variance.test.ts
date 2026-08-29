import { describe, expect, it } from 'vitest';
import {
	computeBiasVarianceDecomposition,
	computeRidgeBiasVariance,
	crossValidateRidge,
	generateSyntheticData,
	polyEval,
	polyFit,
	polynomialFeatures,
	ridgeSolver
} from './bias-variance';

describe('polynomialFeatures', () => {
	it('expands [1, x, x², …, x^degree]', () => {
		expect(polynomialFeatures([2], 3)).toEqual([[1, 2, 4, 8]]);
		expect(polynomialFeatures([0], 5)).toEqual([[1, 0, 0, 0, 0, 0]]);
		expect(polynomialFeatures([0.3, 0.7], 0)).toEqual([
			[1],
			[1]
		]);
	});

	it('handles several samples and fractional values', () => {
		const row = polynomialFeatures([1.5], 2)[0];
		expect(row[0]).toBe(1);
		expect(row[1]).toBeCloseTo(1.5, 12);
		expect(row[2]).toBeCloseTo(2.25, 12);
	});
});

describe('polyEval', () => {
	it('evaluates c0 + c1·x + c2·x² + …', () => {
		expect(polyEval([3, -2, 5], 2)).toBe(19);
		expect(polyEval([7, -1, 0.5], 0)).toBe(7);
		expect(polyEval([], 5)).toBe(0);
	});

	it('matches an independent summation', () => {
		const coeffs = [0.5, -1.25, 3, 0.1];
		const x = 0.7;
		const manual = coeffs.reduce((s, c, i) => s + c * x ** i, 0);
		expect(polyEval(coeffs, x)).toBeCloseTo(manual, 12);
	});
});

describe('polyFit', () => {
	it('recovers the exact quadratic coefficients', () => {
		const xs = [0, 1, 2, 3, 4];
		const ys = xs.map((x) => 1 + 2 * x + 3 * x * x);
		const coeffs = polyFit(xs, ys, 2);
		expect(coeffs[0]).toBeCloseTo(1, 8);
		expect(coeffs[1]).toBeCloseTo(2, 8);
		expect(coeffs[2]).toBeCloseTo(3, 8);
	});

	it('interpolates with degree = n − 1', () => {
		const xs = [0, 1, 2, 3];
		const ys = [4, 1, 5, 2];
		const coeffs = polyFit(xs, ys, 3);
		for (let i = 0; i < xs.length; i++) {
			expect(polyEval(coeffs, xs[i])).toBeCloseTo(ys[i], 8);
		}
	});
});

describe('ridgeSolver', () => {
	it('intercept-only closed form θ = Σy / (n + λ)', () => {
		const X = [
			[1],
			[1],
			[1]
		];
		const y = [1, 3, 5];
		for (const lambda of [0, 1, 10]) {
			expect(ridgeSolver(X, y, lambda)[0]).toBeCloseTo(9 / (3 + lambda), 10);
		}
	});

	it('λ = 0 recovers the OLS solution', () => {
		const xs = [0, 1, 2, 3, 4];
		const ys = xs.map((x) => 1 + 2 * x + 3 * x * x);
		const coeffs = ridgeSolver(polynomialFeatures(xs, 2), ys, 0);
		expect(coeffs[0]).toBeCloseTo(1, 8);
		expect(coeffs[1]).toBeCloseTo(2, 8);
		expect(coeffs[2]).toBeCloseTo(3, 8);
	});

	it('coefficient norm is non-increasing in λ', () => {
		const xs = [0, 0.5, 1, 1.5, 2];
		const ys = [0.1, 0.9, 0.3, 0.8, 0.2];
		const X = polynomialFeatures(xs, 3);
		const norm = (lambda: number) => {
			const th = ridgeSolver(X, ys, lambda);
			return Math.sqrt(th.reduce((s, c) => s + c * c, 0));
		};
		expect(norm(100)).toBeLessThanOrEqual(norm(1));
		expect(norm(1)).toBeLessThanOrEqual(norm(0.01));
	});

	it('huge λ drives every coefficient to ~0', () => {
		const xs = [0, 0.5, 1, 1.5, 2];
		const ys = [0.1, 0.9, 0.3, 0.8, 0.2];
		const coeffs = ridgeSolver(polynomialFeatures(xs, 3), ys, 1e6);
		for (const c of coeffs) expect(Math.abs(c)).toBeLessThan(1e-3);
	});
});

describe('crossValidateRidge', () => {
	it('near-zero CV error on exact quadratic data, increasing in λ', () => {
		const n = 20;
		const xs = Array.from({ length: n }, (_, i) => i / (n - 1));
		const ys = xs.map((x) => 2 - x + 0.5 * x * x);
		const { cvScores } = crossValidateRidge(xs, ys, [0.001, 1, 10, 1000], 2, 5);
		// degree 2 interpolates the data exactly; λ = 0.001 barely perturbs the fit
		expect(cvScores).toHaveLength(4);
		expect(cvScores[0]).toBeLessThan(1e-3);
		expect(cvScores[0]).toBeLessThan(cvScores[1]);
		expect(cvScores[1]).toBeLessThan(cvScores[2]);
		expect(cvScores[2]).toBeLessThan(cvScores[3]);
	});

	it('returns one non-negative score per candidate λ', () => {
		const xs = Array.from({ length: 12 }, (_, i) => i * 0.2);
		const ys = xs.map((x) => Math.sin(x) + 0.05);
		const { cvScores } = crossValidateRidge(xs, ys, [0.01, 1, 50], 3, 4);
		expect(cvScores).toHaveLength(3);
		for (const s of cvScores) expect(s).toBeGreaterThanOrEqual(0);
	});
});

describe('generateSyntheticData', () => {
	it('places samples at the midpoints of equal bins', () => {
		const { xs } = generateSyntheticData(10, 0.3);
		expect(xs).toHaveLength(10);
		for (let i = 0; i < 10; i++) expect(xs[i]).toBe((i + 0.5) / 10);
	});

	it('noiseStd = 0 gives exact samples of the true function', () => {
		const { xs, ys, trueFunc } = generateSyntheticData(25, 0);
		expect(xs).toHaveLength(25);
		for (let i = 0; i < xs.length; i++) expect(ys[i]).toBe(trueFunc(xs[i]));
	});

	it('exposes the ground truth sin(2πx)·e^(−x²)', () => {
		const { trueFunc } = generateSyntheticData(5, 0);
		for (const x of [0, 0.25, 0.5, 0.75]) {
			expect(trueFunc(x)).toBe(Math.sin(2 * Math.PI * x) * Math.exp(-(x ** 2)));
		}
	});
});

// The decomposition helpers sample with Math.random (not seedable in this
// module), so these checks use loose ratio bounds, each verified against
// repeated runs before being fixed.
const N = 100;
const NOISE = 0.3;

function meanBiasVariance(out: { x: number; biasSq: number; variance: number; noise: number }[]) {
	return {
		bias: out.reduce((s, p) => s + p.biasSq, 0) / out.length,
		variance: out.reduce((s, p) => s + p.variance, 0) / out.length
	};
}

describe('computeBiasVarianceDecomposition', () => {
	it('reports one point per evaluation grid location with non-negative terms', () => {
		const { xs, ys, trueFunc } = generateSyntheticData(N, NOISE);
		const out = computeBiasVarianceDecomposition(xs, ys, trueFunc, 3, 40);
		expect(out).toHaveLength(101);
		expect(out[0].x).toBeCloseTo(Math.min(...xs), 12);
		expect(out[out.length - 1].x).toBeCloseTo(Math.max(...xs), 12);
		for (const p of out) {
			expect(p.biasSq).toBeGreaterThanOrEqual(0);
			expect(p.variance).toBeGreaterThanOrEqual(0);
			expect(p.noise).toBe(0);
		}
	});

	it('higher degree inflates variance, lower degree inflates bias', () => {
		const { xs, ys, trueFunc } = generateSyntheticData(N, NOISE);
		const low = computeBiasVarianceDecomposition(xs, ys, trueFunc, 0, 200);
		const mid = computeBiasVarianceDecomposition(xs, ys, trueFunc, 4, 200);
		const high = computeBiasVarianceDecomposition(xs, ys, trueFunc, 8, 200);
		const l = meanBiasVariance(low);
		const m = meanBiasVariance(mid);
		const h = meanBiasVariance(high);
		expect(h.variance).toBeGreaterThan(1.5 * l.variance);
		expect(m.bias).toBeLessThan(0.5 * l.bias);
	});
});

describe('computeRidgeBiasVariance', () => {
	it('shows the regularization trade-off: larger λ lowers variance, raises bias', () => {
		const { xs, ys, trueFunc } = generateSyntheticData(N, NOISE);
		const { lambdas, decompositions } = computeRidgeBiasVariance(xs, ys, trueFunc, [0.01, 100], 4, 50);
		expect(lambdas).toEqual([0.01, 100]);
		expect(decompositions).toHaveLength(2);
		for (const d of decompositions) {
			expect(d.biasSq).toBeGreaterThanOrEqual(0);
			expect(d.variance).toBeGreaterThanOrEqual(0);
			expect(d.noise).toBe(0);
		}
		const [weak, strong] = decompositions;
		expect(weak.variance).toBeGreaterThan(1.2 * strong.variance);
		expect(strong.biasSq).toBeGreaterThan(1.5 * weak.biasSq);
	});
});
