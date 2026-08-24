import { describe, it, expect } from 'vitest';
import {
	misleadingSampleBound,
	separableSampleSizeBound,
	separableRiskBound,
	generateHypothesisClass,
	simulateMisleadingHypotheses,
	hoeffdingBound,
	hoeffdingUniformBound,
	finiteClassRiskBound,
	generateGenericHypothesisClass,
	simulateEmpiricalRisks,
	doubleDescentCurve,
	estimateParameterCount,
	neuralVCDimEstimate,
	neuralVCGeneralizationEstimate,
	neuralNormBasedEstimate,
	type SyntheticHypothesis
} from './generalization';

describe('misleadingSampleBound', () => {
	it('matches |H| * e^(-n*epsilon) directly', () => {
		expect(misleadingSampleBound(100, 10, 0.5)).toBeCloseTo(100 * Math.exp(-5), 10);
	});

	it('decreases as n increases, increases as classSize increases', () => {
		expect(misleadingSampleBound(100, 20, 0.5)).toBeLessThan(misleadingSampleBound(100, 10, 0.5));
		expect(misleadingSampleBound(200, 10, 0.5)).toBeGreaterThan(
			misleadingSampleBound(100, 10, 0.5)
		);
	});

	it('throws for non-positive classSize, n, or epsilon', () => {
		expect(() => misleadingSampleBound(0, 10, 0.5)).toThrow();
		expect(() => misleadingSampleBound(10, 0, 0.5)).toThrow();
		expect(() => misleadingSampleBound(10, 10, 0)).toThrow();
	});
});

describe('separableSampleSizeBound / separableRiskBound', () => {
	it('round-trips: plugging n back into separableRiskBound recovers epsilon', () => {
		const classSize = 500;
		const epsilon = 0.05;
		const delta = 0.01;
		const n = separableSampleSizeBound(classSize, epsilon, delta);
		expect(separableRiskBound(classSize, n, delta)).toBeCloseTo(epsilon, 8);
	});

	it('required n grows with classSize and shrinks with epsilon', () => {
		const delta = 0.05;
		expect(separableSampleSizeBound(1000, 0.1, delta)).toBeGreaterThan(
			separableSampleSizeBound(100, 0.1, delta)
		);
		expect(separableSampleSizeBound(100, 0.05, delta)).toBeGreaterThan(
			separableSampleSizeBound(100, 0.2, delta)
		);
	});

	it('throws for delta outside (0,1)', () => {
		expect(() => separableSampleSizeBound(100, 0.1, 0)).toThrow();
		expect(() => separableSampleSizeBound(100, 0.1, 1)).toThrow();
	});
});

describe('generateHypothesisClass', () => {
	it('is deterministic for a fixed seed', () => {
		const a = generateHypothesisClass(50, 0.2, 42);
		const b = generateHypothesisClass(50, 0.2, 42);
		expect(a).toEqual(b);
	});

	it('produces exactly one good hypothesis (trueRisk=0) and the rest bad with risk > epsilon', () => {
		const epsilon = 0.2;
		const hypotheses = generateHypothesisClass(30, epsilon, 3);
		expect(hypotheses).toHaveLength(30);
		const good = hypotheses.filter((h) => h.isGood);
		expect(good).toHaveLength(1);
		expect(good[0].trueRisk).toBe(0);
		for (const h of hypotheses.filter((h) => !h.isGood)) {
			expect(h.trueRisk).toBeGreaterThan(epsilon);
			expect(h.trueRisk).toBeLessThanOrEqual(1);
		}
	});

	it('throws for non-positive classSize or epsilon outside (0,1)', () => {
		expect(() => generateHypothesisClass(0, 0.1, 1)).toThrow();
		expect(() => generateHypothesisClass(10, 0, 1)).toThrow();
		expect(() => generateHypothesisClass(10, 1, 1)).toThrow();
	});
});

describe('simulateMisleadingHypotheses', () => {
	it('is deterministic for a fixed seed', () => {
		const hypotheses = generateHypothesisClass(40, 0.2, 5);
		const a = simulateMisleadingHypotheses(hypotheses, 20, 9);
		const b = simulateMisleadingHypotheses(hypotheses, 20, 9);
		expect(a).toEqual(b);
	});

	it('the good hypothesis is never counted as misleading', () => {
		const hypotheses = generateHypothesisClass(20, 0.2, 1);
		const result = simulateMisleadingHypotheses(hypotheses, 10, 2);
		const good = result.hypotheses.find((h) => h.isGood)!;
		expect(good.empiricalRiskZero).toBe(true);
		expect(good.isMisleading).toBe(false);
	});

	it('misleading count only ever includes bad hypotheses', () => {
		const hypotheses = generateHypothesisClass(50, 0.3, 7);
		const result = simulateMisleadingHypotheses(hypotheses, 15, 8);
		for (const h of result.hypotheses) {
			if (h.isMisleading) expect(h.isGood).toBe(false);
		}
		expect(result.misleadingCount).toBe(result.hypotheses.filter((h) => h.isMisleading).length);
	});

	it('expected misleading count roughly tracks the analytical per-hypothesis probability, for a large repeated experiment', () => {
		// A single bad hypothesis with a known trueRisk, repeated across many
		// independent "samples" (different seeds) approximates E[misleading].
		const trueRisk = 0.3;
		const n = 10;
		const hypotheses: SyntheticHypothesis[] = [{ id: 1, trueRisk, isGood: false }];
		let misleadingHits = 0;
		const trials = 3000;
		for (let seed = 1; seed <= trials; seed++) {
			const result = simulateMisleadingHypotheses(hypotheses, n, seed);
			if (result.misleadingCount > 0) misleadingHits++;
		}
		const empirical = misleadingHits / trials;
		const analytical = Math.pow(1 - trueRisk, n);
		expect(empirical).toBeCloseTo(analytical, 1);
	});

	it('average misleading count over many samples stays below misleadingSampleBound', () => {
		const classSize = 60;
		const epsilon = 0.25;
		const n = 20;
		const hypotheses = generateHypothesisClass(classSize, epsilon, 11);
		let totalMisleading = 0;
		const trials = 500;
		for (let seed = 1; seed <= trials; seed++) {
			totalMisleading += simulateMisleadingHypotheses(hypotheses, n, seed + 100000).misleadingCount;
		}
		const empiricalMean = totalMisleading / trials;
		const bound = misleadingSampleBound(classSize, n, epsilon);
		expect(empiricalMean).toBeLessThanOrEqual(bound + 0.1);
	});

	it('throws for non-positive n', () => {
		const hypotheses = generateHypothesisClass(10, 0.2, 1);
		expect(() => simulateMisleadingHypotheses(hypotheses, 0, 1)).toThrow();
	});
});

describe('generateGenericHypothesisClass', () => {
	it('is deterministic for a fixed seed', () => {
		const a = generateGenericHypothesisClass(30, 5);
		const b = generateGenericHypothesisClass(30, 5);
		expect(a).toEqual(b);
	});

	it('produces classSize hypotheses with trueRisk in [0,1]', () => {
		const hypotheses = generateGenericHypothesisClass(50, 3);
		expect(hypotheses).toHaveLength(50);
		for (const h of hypotheses) {
			expect(h.trueRisk).toBeGreaterThanOrEqual(0);
			expect(h.trueRisk).toBeLessThanOrEqual(1);
		}
	});

	it('throws for non-positive classSize', () => {
		expect(() => generateGenericHypothesisClass(0, 1)).toThrow();
	});
});

describe('simulateEmpiricalRisks', () => {
	it('is deterministic for a fixed seed', () => {
		const hypotheses = generateGenericHypothesisClass(20, 1);
		const a = simulateEmpiricalRisks(hypotheses, 50, 7);
		const b = simulateEmpiricalRisks(hypotheses, 50, 7);
		expect(a).toEqual(b);
	});

	it('empirical risk is always in [0,1] and averages close to the true risk for a large n', () => {
		const hypotheses = generateGenericHypothesisClass(10, 2);
		const results = simulateEmpiricalRisks(hypotheses, 20000, 4);
		for (const r of results) {
			expect(r.empiricalRisk).toBeGreaterThanOrEqual(0);
			expect(r.empiricalRisk).toBeLessThanOrEqual(1);
			expect(Math.abs(r.empiricalRisk - r.trueRisk)).toBeLessThan(0.02);
		}
	});

	it('the minimum empirical risk (ERM pick) is optimistically biased relative to its own true risk, for a large enough class', () => {
		// Classic "look-elsewhere" effect: min over many noisy estimates is
		// biased downward relative to its own true value, on average.
		const hypotheses = generateGenericHypothesisClass(80, 11);
		const n = 15;
		const trials = 300;
		let ermBiasSum = 0;
		for (let seed = 1; seed <= trials; seed++) {
			const results = simulateEmpiricalRisks(hypotheses, n, seed + 500000);
			const erm = results.reduce((best, r) => (r.empiricalRisk < best.empiricalRisk ? r : best));
			ermBiasSum += erm.trueRisk - erm.empiricalRisk; // typically positive (optimistic bias)
		}
		expect(ermBiasSum / trials).toBeGreaterThan(0);
	});

	it('throws for non-positive n', () => {
		const hypotheses = generateGenericHypothesisClass(5, 1);
		expect(() => simulateEmpiricalRisks(hypotheses, 0, 1)).toThrow();
	});
});

describe('hoeffdingBound', () => {
	it('matches 2*e^(-2*n*t^2) directly', () => {
		expect(hoeffdingBound(50, 0.1)).toBeCloseTo(2 * Math.exp(-2 * 50 * 0.01), 10);
	});

	it('decreases as n or t increases', () => {
		expect(hoeffdingBound(100, 0.1)).toBeLessThan(hoeffdingBound(50, 0.1));
		expect(hoeffdingBound(50, 0.2)).toBeLessThan(hoeffdingBound(50, 0.1));
	});
});

describe('hoeffdingUniformBound', () => {
	it('matches sqrt((log|H|+log(2/delta))/(2n)) directly', () => {
		const classSize = 50;
		const n = 100;
		const delta = 0.05;
		const expected = Math.sqrt((Math.log(classSize) + Math.log(2 / delta)) / (2 * n));
		expect(hoeffdingUniformBound(classSize, n, delta)).toBeCloseTo(expected, 10);
	});

	it('is the t that makes 2*|H|*e^(-2nt^2) equal delta (round-trip)', () => {
		const classSize = 200;
		const n = 300;
		const delta = 0.02;
		const t = hoeffdingUniformBound(classSize, n, delta);
		expect(2 * classSize * Math.exp(-2 * n * t * t)).toBeCloseTo(delta, 6);
	});

	it('decreases with n, increases with classSize', () => {
		expect(hoeffdingUniformBound(50, 200, 0.05)).toBeLessThan(hoeffdingUniformBound(50, 100, 0.05));
		expect(hoeffdingUniformBound(500, 100, 0.05)).toBeGreaterThan(
			hoeffdingUniformBound(50, 100, 0.05)
		);
	});
});

describe('finiteClassRiskBound', () => {
	it('adds the empirical risk and the uniform bound', () => {
		const empiricalRisk = 0.1;
		const classSize = 50;
		const n = 100;
		const delta = 0.05;
		expect(finiteClassRiskBound(empiricalRisk, classSize, n, delta)).toBeCloseTo(
			empiricalRisk + hoeffdingUniformBound(classSize, n, delta),
			10
		);
	});

	it('throws for empiricalRisk outside [0,1]', () => {
		expect(() => finiteClassRiskBound(-0.1, 50, 100, 0.05)).toThrow();
		expect(() => finiteClassRiskBound(1.1, 50, 100, 0.05)).toThrow();
	});
});

describe('doubleDescentCurve', () => {
	// Small d and moderate repetitions/testSize to keep the test suite fast
	// while still exhibiting the phenomenon.
	const d = 10;

	it('is deterministic for a fixed seed', () => {
		const nGrid = [3, 5, 10, 20, 40];
		const a = doubleDescentCurve(nGrid, d, 8, 1, 150, 42);
		const b = doubleDescentCurve(nGrid, d, 8, 1, 150, 42);
		expect(a).toEqual(b);
	});

	it('returns one point per n, with matching n values', () => {
		const nGrid = [3, 5, 10, 20];
		const curve = doubleDescentCurve(nGrid, d, 8, 1, 150, 7);
		expect(curve.map((p) => p.n)).toEqual(nGrid);
	});

	it('interpolates near-perfectly (train risk ~ 0) in the underparameterized regime n < d', () => {
		const curve = doubleDescentCurve([Math.floor(d / 2)], d, 15, 1, 150, 3);
		expect(curve[0].trainRisk).toBeLessThan(1e-6);
	});

	it('shows a generalization gap in the underparameterized regime (test > train)', () => {
		const curve = doubleDescentCurve([Math.floor(d / 2)], d, 15, 1, 150, 5);
		expect(curve[0].testRisk).toBeGreaterThan(curve[0].trainRisk);
	});

	it('test risk in the far overparameterized regime approaches the irreducible noise variance', () => {
		const noiseStd = 1;
		const curve = doubleDescentCurve([d * 20], d, 15, noiseStd, 300, 9);
		// Generous tolerance: this is a Monte-Carlo estimate, not an exact value.
		expect(curve[0].testRisk).toBeGreaterThan(noiseStd ** 2 * 0.5);
		expect(curve[0].testRisk).toBeLessThan(noiseStd ** 2 * 2);
	});

	it('test risk near the interpolation threshold n=d is elevated compared to the far overparameterized regime', () => {
		const [atThreshold, farOver] = doubleDescentCurve([d, d * 20], d, 15, 1, 300, 11);
		expect(atThreshold.testRisk).toBeGreaterThan(farOver.testRisk);
	});

	it('throws for non-positive d, repetitions, testSize, or n', () => {
		expect(() => doubleDescentCurve([10], 0, 5, 1, 100, 1)).toThrow();
		expect(() => doubleDescentCurve([10], 10, 0, 1, 100, 1)).toThrow();
		expect(() => doubleDescentCurve([10], 10, 5, 1, 0, 1)).toThrow();
		expect(() => doubleDescentCurve([0], 10, 5, 1, 100, 1)).toThrow();
	});
});

describe('estimateParameterCount', () => {
	it('matches depth * width^2 directly', () => {
		expect(estimateParameterCount(4, 10)).toBe(400);
	});

	it('throws for non-positive depth or width', () => {
		expect(() => estimateParameterCount(0, 10)).toThrow();
		expect(() => estimateParameterCount(4, 0)).toThrow();
	});
});

describe('neuralVCDimEstimate', () => {
	it('matches W*L*log(W) directly', () => {
		const W = 1000;
		const L = 5;
		expect(neuralVCDimEstimate(W, L)).toBeCloseTo(W * L * Math.log(W), 6);
	});

	it('increases with both paramCount and depth', () => {
		expect(neuralVCDimEstimate(2000, 5)).toBeGreaterThan(neuralVCDimEstimate(1000, 5));
		expect(neuralVCDimEstimate(1000, 10)).toBeGreaterThan(neuralVCDimEstimate(1000, 5));
	});

	it('throws for paramCount <= 1 or non-positive depth', () => {
		expect(() => neuralVCDimEstimate(1, 5)).toThrow();
		expect(() => neuralVCDimEstimate(1000, 0)).toThrow();
	});
});

describe('neuralVCGeneralizationEstimate', () => {
	it('matches sqrt(vcDimEstimate/n) directly', () => {
		expect(neuralVCGeneralizationEstimate(400, 100)).toBeCloseTo(2, 10);
	});

	it('becomes vacuous (>> 1) for realistic large-network, small-n combinations', () => {
		// A stand-in for W ~ 1e8: this is exactly the "VC bound is useless in
		// practice" point theorie.typ makes.
		const W = 1e8;
		const L = 10;
		const vcDim = neuralVCDimEstimate(W, L);
		const bound = neuralVCGeneralizationEstimate(vcDim, 1e6);
		expect(bound).toBeGreaterThan(1);
	});

	it('throws for negative vcDimEstimate or non-positive n', () => {
		expect(() => neuralVCGeneralizationEstimate(-1, 100)).toThrow();
		expect(() => neuralVCGeneralizationEstimate(100, 0)).toThrow();
	});
});

describe('neuralNormBasedEstimate', () => {
	it('shrinks toward 0 as depth grows when weightNorm < 1 (contractive layers)', () => {
		const shallow = neuralNormBasedEstimate(2, 0.8, 1000);
		const deep = neuralNormBasedEstimate(20, 0.8, 1000);
		expect(deep).toBeLessThan(shallow);
	});

	it('explodes as depth grows when weightNorm > 1', () => {
		const shallow = neuralNormBasedEstimate(2, 1.5, 1000);
		const deep = neuralNormBasedEstimate(20, 1.5, 1000);
		expect(deep).toBeGreaterThan(shallow);
	});

	it('decreases as n grows, for fixed depth and weightNorm', () => {
		expect(neuralNormBasedEstimate(5, 1, 10000)).toBeLessThan(neuralNormBasedEstimate(5, 1, 100));
	});

	it('throws for non-positive depth, weightNorm, or n', () => {
		expect(() => neuralNormBasedEstimate(0, 1, 100)).toThrow();
		expect(() => neuralNormBasedEstimate(5, 0, 100)).toThrow();
		expect(() => neuralNormBasedEstimate(5, 1, 0)).toThrow();
	});
});
