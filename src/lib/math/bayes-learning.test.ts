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
	type ConditionalDistribution
} from './bayes-learning';
import { linspace } from './util';

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

describe('linspace', () => {
	it('produces n evenly spaced points including both endpoints', () => {
		expect(linspace(0, 1, 5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
	});

	it('falls back to [min] when n < 2', () => {
		expect(linspace(0, 1, 1)).toEqual([0]);
	});
});
