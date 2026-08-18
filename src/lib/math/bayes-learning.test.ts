import { describe, it, expect } from 'vitest';
import {
	conditionalRisk,
	bayesAction,
	bayesConditionalRisk,
	bayesRisk,
	conditionalSquaredRisk,
	conditionalAbsoluteRisk,
	conditionalMean,
	conditionalMedian,
	conditionalRiskCurve,
	sigmoidEta,
	sigmoidEtaCurve,
	sigmoidBayesBoundary,
	sampleConditionalDistribution,
	type ConditionalDistribution
} from './bayes-learning';
import { linspace } from './util'; // TODO: fix path if util.ts lives elsewhere

describe('conditionalRisk', () => {
	it('r(0, eta) = eta and r(1, eta) = 1 - eta', () => {
		expect(conditionalRisk(0, 0.3)).toBeCloseTo(0.3);
		expect(conditionalRisk(1, 0.3)).toBeCloseTo(0.7);
	});

	it('throws outside [0,1]', () => {
		expect(() => conditionalRisk(0, 1.5)).toThrow();
		expect(() => conditionalRisk(0, -0.1)).toThrow();
	});
});

describe('bayesAction', () => {
	it('predicts 1 iff eta >= 1/2 (Théorème 1.1)', () => {
		expect(bayesAction(0.9)).toBe(1);
		expect(bayesAction(0.1)).toBe(0);
		expect(bayesAction(0.5)).toBe(1); // tie-break convention per theorie.typ
	});
});

describe('bayesConditionalRisk', () => {
	it('equals min(eta, 1-eta)', () => {
		expect(bayesConditionalRisk(0.3)).toBeCloseTo(0.3);
		expect(bayesConditionalRisk(0.7)).toBeCloseTo(0.3);
		expect(bayesConditionalRisk(0.5)).toBeCloseTo(0.5);
	});

	it('is never larger than either action-specific risk', () => {
		for (const eta of linspace(0, 1, 21)) {
			expect(bayesConditionalRisk(eta)).toBeLessThanOrEqual(conditionalRisk(0, eta) + 1e-12);
			expect(bayesConditionalRisk(eta)).toBeLessThanOrEqual(conditionalRisk(1, eta) + 1e-12);
		}
	});
});

describe('bayesRisk', () => {
	it('averages the pointwise Bayes risk', () => {
		const etas = [0.1, 0.5, 0.9];
		// bayesConditionalRisk: 0.1, 0.5, 0.1 -> mean = 0.2333...
		expect(bayesRisk(etas)).toBeCloseTo((0.1 + 0.5 + 0.1) / 3, 10);
	});

	it('returns 0 for an empty sample', () => {
		expect(bayesRisk([])).toBe(0);
	});
});

describe('conditional mean / median optimality', () => {
	const dist: ConditionalDistribution = {
		values: [0, 1, 10],
		probabilities: [0.5, 0.3, 0.2]
	};

	it('conditionalMean minimizes conditionalSquaredRisk over a fine grid', () => {
		const mean = conditionalMean(dist);
		const grid = linspace(-5, 15, 2001);
		const riskAtMean = conditionalSquaredRisk(dist, mean);
		for (const c of grid) {
			expect(conditionalSquaredRisk(dist, c)).toBeGreaterThanOrEqual(riskAtMean - 1e-9);
		}
	});

	it('conditionalMedian minimizes conditionalAbsoluteRisk over a fine grid', () => {
		const median = conditionalMedian(dist);
		const grid = linspace(-5, 15, 2001);
		const riskAtMedian = conditionalAbsoluteRisk(dist, median);
		for (const c of grid) {
			expect(conditionalAbsoluteRisk(dist, c)).toBeGreaterThanOrEqual(riskAtMedian - 1e-9);
		}
	});

	it('rejects a distribution whose probabilities do not sum to 1', () => {
		expect(() =>
			conditionalSquaredRisk({ values: [0, 1], probabilities: [0.5, 0.6] }, 0)
		).toThrow();
	});
});

describe('conditionalRiskCurve', () => {
	it('returns one entry per grid point with matching c', () => {
		const dist: ConditionalDistribution = { values: [0, 2], probabilities: [0.5, 0.5] };
		const grid = linspace(0, 2, 5);
		const curve = conditionalRiskCurve(dist, grid);
		expect(curve).toHaveLength(5);
		expect(curve.map((p) => p.c)).toEqual(grid);
	});
});

describe('sigmoidEta', () => {
	it('always equals 1/2 at x = 0, for any temperature', () => {
		for (const t of [0.05, 0.5, 1, 5]) {
			expect(sigmoidEta(0, t)).toBeCloseTo(0.5, 10);
		}
	});

	it('is monotonically increasing in x for fixed temperature', () => {
		const xs = linspace(-3, 3, 25);
		const etas = xs.map((x) => sigmoidEta(x, 0.5));
		for (let i = 1; i < etas.length; i++) {
			expect(etas[i]).toBeGreaterThan(etas[i - 1]);
		}
	});

	it('approaches a step function as temperature -> 0+', () => {
		expect(sigmoidEta(1, 0.01)).toBeGreaterThan(0.999);
		expect(sigmoidEta(-1, 0.01)).toBeLessThan(0.001);
	});

	it('flattens toward 1/2 as temperature grows', () => {
		expect(sigmoidEta(1, 50)).toBeCloseTo(0.5, 1);
		expect(sigmoidEta(-1, 50)).toBeCloseTo(0.5, 1);
	});

	it('throws for non-positive temperature', () => {
		expect(() => sigmoidEta(0, 0)).toThrow();
		expect(() => sigmoidEta(0, -1)).toThrow();
	});
});

describe('sigmoidEtaCurve', () => {
	it('pairs each x with its eta value', () => {
		const xs = [-1, 0, 1];
		const curve = sigmoidEtaCurve(xs, 1);
		expect(curve.map((p) => p.x)).toEqual(xs);
		expect(curve[1].eta).toBeCloseTo(0.5, 10);
	});
});

describe('sigmoidBayesBoundary', () => {
	it('is always 0', () => {
		expect(sigmoidBayesBoundary()).toBe(0);
	});
});

describe('bayesRisk on the sigmoid model', () => {
	it('increases with temperature (noisier problem -> higher Bayes risk)', () => {
		const xs = linspace(-3, 3, 61);
		const lowNoise = bayesRisk(xs.map((x) => sigmoidEta(x, 0.1)));
		const highNoise = bayesRisk(xs.map((x) => sigmoidEta(x, 5)));
		expect(highNoise).toBeGreaterThan(lowNoise);
	});

	it('approaches 0 as temperature -> 0+ (separable limit)', () => {
		const xs = linspace(-3, 3, 61);
		const risk = bayesRisk(xs.map((x) => sigmoidEta(x, 0.01)));
		expect(risk).toBeLessThan(0.01);
	});
});

describe('sampleConditionalDistribution', () => {
	const dist: ConditionalDistribution = {
		values: [0, 1, 10],
		probabilities: [0.5, 0.3, 0.2]
	};

	it('is deterministic for a fixed seed', () => {
		const a = sampleConditionalDistribution(dist, 200, 42);
		const b = sampleConditionalDistribution(dist, 200, 42);
		expect(a).toEqual(b);
	});

	it('produces different draws for different seeds', () => {
		const a = sampleConditionalDistribution(dist, 200, 1);
		const b = sampleConditionalDistribution(dist, 200, 2);
		expect(a).not.toEqual(b);
	});

	it('only draws values from the support of the distribution', () => {
		const samples = sampleConditionalDistribution(dist, 500, 7);
		for (const s of samples) {
			expect(dist.values).toContain(s);
		}
	});

	it('approximates the true probabilities for a large sample', () => {
		const samples = sampleConditionalDistribution(dist, 20000, 123);
		const freq = (v: number) => samples.filter((s) => s === v).length / samples.length;
		expect(freq(0)).toBeCloseTo(0.5, 1);
		expect(freq(1)).toBeCloseTo(0.3, 1);
		expect(freq(10)).toBeCloseTo(0.2, 1);
	});
});
