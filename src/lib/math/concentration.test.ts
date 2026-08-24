import { describe, it, expect } from 'vitest';
import {
	markovBound,
	chebyshevBound,
	simulateEmpiricalMeanTrials,
	simulateEmpiricalMeanPath,
	empiricalExceedanceProbability,
	empiricalOneSidedExceedanceProbability,
	fixedClassifierRiskBound,
	fixedClassifierRiskBoundUniform,
	empiricalMeanStandardError,
	histogram,
	type EmpiricalMeanModel
} from './concentration';

describe('markovBound', () => {
	it('matches E[Z]/t directly', () => {
		expect(markovBound(2, 4)).toBeCloseTo(0.5, 10);
		expect(markovBound(10, 2)).toBeCloseTo(5, 10);
	});

	it('can exceed 1 (a valid but vacuous bound) without being clamped', () => {
		expect(markovBound(10, 1)).toBeCloseTo(10, 10);
	});

	it('throws for a negative mean or non-positive t', () => {
		expect(() => markovBound(-1, 1)).toThrow();
		expect(() => markovBound(1, 0)).toThrow();
		expect(() => markovBound(1, -1)).toThrow();
	});
});

describe('chebyshevBound', () => {
	it('matches Var(Z)/epsilon^2 directly', () => {
		expect(chebyshevBound(4, 2)).toBeCloseTo(1, 10);
		expect(chebyshevBound(1, 0.5)).toBeCloseTo(4, 10);
	});

	it('throws for negative variance or non-positive epsilon', () => {
		expect(() => chebyshevBound(-1, 1)).toThrow();
		expect(() => chebyshevBound(1, 0)).toThrow();
	});
});

describe('simulateEmpiricalMeanTrials', () => {
	const model: EmpiricalMeanModel = { mean: 2, variance: 1 };

	it('is deterministic for a fixed seed', () => {
		const a = simulateEmpiricalMeanTrials(50, 500, model, 7);
		const b = simulateEmpiricalMeanTrials(50, 500, model, 7);
		expect(a).toEqual(b);
	});

	it('has empirical mean and variance close to the model for a large batch', () => {
		const n = 30;
		const samples = simulateEmpiricalMeanTrials(n, 20000, model, 11);
		const empiricalMean = samples.reduce((s, z) => s + z, 0) / samples.length;
		expect(empiricalMean).toBeCloseTo(model.mean, 1);

		const empiricalVarOfMean =
			samples.reduce((s, z) => s + (z - empiricalMean) ** 2, 0) / samples.length;
		// Var(Zbar_n) = variance/n
		expect(empiricalVarOfMean).toBeCloseTo(model.variance / n, 2);
	});
});

describe('simulateEmpiricalMeanPath', () => {
	const model: EmpiricalMeanModel = { mean: 5, variance: 2 };

	it('is deterministic for a fixed seed and returns one value per grid point', () => {
		const nGrid = [1, 10, 50, 100, 500, 2000];
		const a = simulateEmpiricalMeanPath(nGrid, model, 3);
		const b = simulateEmpiricalMeanPath(nGrid, model, 3);
		expect(a).toHaveLength(nGrid.length);
		expect(a).toEqual(b);
	});

	it('gets closer to the true mean at larger n (single trajectory, generous tolerance)', () => {
		const nGrid = [5, 5000];
		const [early, late] = simulateEmpiricalMeanPath(nGrid, model, 21);
		expect(Math.abs(late - model.mean)).toBeLessThan(Math.abs(early - model.mean));
	});

	it('throws for a non-positive or non-integer n in the grid', () => {
		expect(() => simulateEmpiricalMeanPath([0, 10], model, 1)).toThrow();
		expect(() => simulateEmpiricalMeanPath([5.5, 10], model, 1)).toThrow();
	});
});

describe('empiricalExceedanceProbability', () => {
	const model: EmpiricalMeanModel = { mean: 0, variance: 1 };

	it('matches the exact tail probability of the underlying uniform model', () => {
		// Zbar_n for large n is itself ~ Uniform-like around mean with variance/n;
		// here we test the exceedance directly on single draws (n=1) where the
		// exact distribution is Uniform(mean-h, mean+h), h = sqrt(3*variance).
		const h = Math.sqrt(3 * model.variance);
		const epsilon = 1;
		const samples = simulateEmpiricalMeanTrials(1, 50000, model, 5);
		const empirical = empiricalExceedanceProbability(samples, model.mean, epsilon);
		const exact = 1 - epsilon / h; // P(|Uniform(-h,h)| >= epsilon), 0 <= epsilon <= h
		expect(empirical).toBeCloseTo(exact, 1);
	});

	it('never exceeds the Chebyshev bound by more than sampling noise, for n=1', () => {
		const epsilon = 1.5;
		const samples = simulateEmpiricalMeanTrials(1, 50000, model, 8);
		const empirical = empiricalExceedanceProbability(samples, model.mean, epsilon);
		const bound = chebyshevBound(model.variance, epsilon);
		expect(empirical).toBeLessThanOrEqual(bound + 0.05);
	});

	it('returns 0 for an empty sample', () => {
		expect(empiricalExceedanceProbability([], 0, 0.1)).toBe(0);
	});
});

describe('empiricalOneSidedExceedanceProbability', () => {
	const model: EmpiricalMeanModel = { mean: 0.5, variance: 0.02 };

	it('matches the exact one-sided tail probability of the underlying uniform model, at n=1', () => {
		const h = Math.sqrt(3 * model.variance);
		const epsilon = 0.1;
		const samples = simulateEmpiricalMeanTrials(1, 50000, model, 6);
		const empirical = empiricalOneSidedExceedanceProbability(samples, model.mean, epsilon);
		const exact = Math.max(0, (h - epsilon) / (2 * h)); // P(Uniform(-h,h) >= epsilon)
		expect(empirical).toBeCloseTo(exact, 1);
	});

	it('is always <= the two-sided exceedance probability, for the same samples', () => {
		const samples = simulateEmpiricalMeanTrials(10, 5000, model, 14);
		const epsilon = 0.05;
		const oneSided = empiricalOneSidedExceedanceProbability(samples, model.mean, epsilon);
		const twoSided = empiricalExceedanceProbability(samples, model.mean, epsilon);
		expect(oneSided).toBeLessThanOrEqual(twoSided + 1e-9);
	});

	it('returns 0 for an empty sample', () => {
		expect(empiricalOneSidedExceedanceProbability([], 0, 0.1)).toBe(0);
	});
});

describe('empiricalMeanStandardError', () => {
	it('matches sqrt(variance/n) directly', () => {
		expect(empiricalMeanStandardError(4, 16)).toBeCloseTo(2, 10);
		expect(empiricalMeanStandardError(100, 4)).toBeCloseTo(0.2, 10);
	});

	it('decreases as n grows', () => {
		expect(empiricalMeanStandardError(400, 4)).toBeLessThan(empiricalMeanStandardError(100, 4));
	});

	it('is 0 when variance is 0', () => {
		expect(empiricalMeanStandardError(10, 0)).toBe(0);
	});

	it('throws for non-positive n or negative variance', () => {
		expect(() => empiricalMeanStandardError(0, 1)).toThrow();
		expect(() => empiricalMeanStandardError(10, -1)).toThrow();
	});
});

describe('histogram', () => {
	it('bucket counts sum to the number of samples', () => {
		const samples = [1, 2, 2, 3, 5, 8, 8, 8, 9, 10];
		const bins = histogram(samples, 5);
		const total = bins.reduce((s, b) => s + b.count, 0);
		expect(total).toBe(samples.length);
	});

	it('places known values in the expected bins', () => {
		// Range [0,10], 5 bins of width 2: [0,2) [2,4) [4,6) [6,8) [8,10]
		const samples = [0, 1.9, 2, 3.9, 9.9, 10];
		const bins = histogram(samples, 5, [0, 10]);
		expect(bins).toHaveLength(5);
		expect(bins[0].count).toBe(2); // 0, 1.9
		expect(bins[1].count).toBe(2); // 2, 3.9
		expect(bins[4].count).toBe(2); // 9.9, 10 (10 clamped into the last bin)
	});

	it('returns an empty array for an empty sample', () => {
		expect(histogram([], 10)).toEqual([]);
	});

	it('throws for non-positive bins or an invalid explicit range', () => {
		expect(() => histogram([1, 2, 3], 0)).toThrow();
		expect(() => histogram([1, 2, 3], 5, [5, 1])).toThrow();
	});
});

describe('fixedClassifierRiskBound', () => {
	it('matches risk*(1-risk)/(n*epsilon^2) directly', () => {
		expect(fixedClassifierRiskBound(0.5, 100, 0.1)).toBeCloseTo(0.25 / (100 * 0.01), 10);
	});

	it('is never larger than the uniform (worst-case) bound, for any risk in [0,1]', () => {
		const n = 50;
		const epsilon = 0.2;
		const uniform = fixedClassifierRiskBoundUniform(n, epsilon);
		for (const risk of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
			expect(fixedClassifierRiskBound(risk, n, epsilon)).toBeLessThanOrEqual(uniform + 1e-12);
		}
	});

	it('is maximized at risk=0.5 (Bernoulli variance is maximal at p=1/2)', () => {
		const n = 50;
		const epsilon = 0.2;
		const atHalf = fixedClassifierRiskBound(0.5, n, epsilon);
		for (const risk of [0.1, 0.3, 0.7, 0.9]) {
			expect(fixedClassifierRiskBound(risk, n, epsilon)).toBeLessThanOrEqual(atHalf + 1e-12);
		}
	});

	it('throws for risk outside [0,1], or non-positive n/epsilon', () => {
		expect(() => fixedClassifierRiskBound(-0.1, 10, 0.1)).toThrow();
		expect(() => fixedClassifierRiskBound(1.1, 10, 0.1)).toThrow();
		expect(() => fixedClassifierRiskBound(0.5, 0, 0.1)).toThrow();
		expect(() => fixedClassifierRiskBound(0.5, 10, 0)).toThrow();
	});
});

describe('fixedClassifierRiskBoundUniform', () => {
	it('matches 1/(4*n*epsilon^2) directly', () => {
		expect(fixedClassifierRiskBoundUniform(100, 0.1)).toBeCloseTo(1 / (4 * 100 * 0.01), 10);
	});

	it('decreases as n or epsilon increases', () => {
		expect(fixedClassifierRiskBoundUniform(200, 0.1)).toBeLessThan(
			fixedClassifierRiskBoundUniform(100, 0.1)
		);
		expect(fixedClassifierRiskBoundUniform(100, 0.2)).toBeLessThan(
			fixedClassifierRiskBoundUniform(100, 0.1)
		);
	});
});
