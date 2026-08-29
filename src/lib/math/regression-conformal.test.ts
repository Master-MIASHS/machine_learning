import { describe, expect, it } from 'vitest';
import {
	adaptiveInterval,
	conditionalCoverageRate,
	constantInterval,
	residualQuantile
} from './regression-conformal';

describe('residualQuantile', () => {
	it('returns the ⌈(n+1)(1−α)⌉-th smallest value (input need not be sorted)', () => {
		const r = [5, 3, 1, 4, 2];
		expect(residualQuantile(r, 0.5)).toBe(3); // k = ⌈6·0.5⌉ = 3 → 3rd smallest
		expect(residualQuantile(r, 0.2)).toBe(5); // k = ⌈6·0.8⌉ = 5 → 5th smallest
		expect(residualQuantile(r, 0.9)).toBe(1); // k = ⌈6·0.1⌉ = 1 → 1st smallest
	});

	it('returns +∞ when the requested order exceeds n or the input is empty', () => {
		expect(residualQuantile([5, 3, 1, 4, 2], 0.1)).toBe(Infinity); // k = 6 > 5
		expect(residualQuantile([], 0.5)).toBe(Infinity);
	});

	it('single-element input', () => {
		expect(residualQuantile([7], 0.5)).toBe(7); // k = ⌈2·0.5⌉ = 1
	});
});

describe('constantInterval', () => {
	it('hand-computed half-width at α = 0.5', () => {
		// |residuals| = [1, 2, 0.5, 0.5, 2]; k = ⌈6·0.5⌉ = 3 → 3rd smallest = 1
		const { lowerBounds, upperBounds } = constantInterval(
			[0, 0, 0, 0, 0],
			[1, -2, 0.5, -0.5, 2],
			[10, 20],
			0.5
		);
		expect(lowerBounds).toEqual([9, 19]);
		expect(upperBounds).toEqual([11, 21]);
	});

	it('calibrated intervals cover at least 1 − α of the calibration data', () => {
		const calPred = [1, 2, 3, 4, 5, 6, 7, 8];
		const calTrue = [1.4, 1.1, 3.9, 3.2, 5.6, 4.8, 7.1, 8.5];
		const alpha = 0.5;
		const { lowerBounds, upperBounds } = constantInterval(calPred, calTrue, calPred, alpha);
		// Independent half-width check: k = ⌈9·0.5⌉ = 5 → 5th smallest |residual| ≈ 0.8
		const hw = residualQuantile(
			calTrue.map((y, i) => Math.abs(y - calPred[i])),
			alpha
		);
		expect(hw).toBeCloseTo(0.8, 12);
		const intervals = lowerBounds.map((lb, i) => [lb, upperBounds[i]] as [number, number]);
		expect(conditionalCoverageRate(intervals, calTrue)).toBeGreaterThanOrEqual(1 - alpha);
	});
});

describe('adaptiveInterval', () => {
	it('hand-computed normalized-score interval', () => {
		// scores = |residual| / (σ + ε) = [1, 0.5, 1]; k = ⌈4·0.75⌉ = 1 → q = 0.5
		// half-width = 0.5 · (3 + ε) ≈ 1.5
		const { lowerBounds, upperBounds } = adaptiveInterval(
			[0, 10, 20],
			[1, 9, 22],
			[1, 2, 2],
			[100],
			[3],
			0.75
		);
		expect(lowerBounds[0]).toBeCloseTo(98.5, 10);
		expect(upperBounds[0]).toBeCloseTo(101.5, 10);
	});

	it('halving the test sigma halves the interval width (ε = 0)', () => {
		const base = adaptiveInterval([0, 0], [1, -1], [1, 1], [5, 5], [2, 2], 0.5, 0);
		const scaled = adaptiveInterval([0, 0], [1, -1], [1, 1], [5, 5], [1, 1], 0.5, 0);
		const wBase = base.upperBounds[0] - base.lowerBounds[0];
		const wScaled = scaled.upperBounds[0] - scaled.lowerBounds[0];
		expect(wBase).toBeCloseTo(4, 14);
		expect(wScaled).toBeCloseTo(wBase / 2, 14);
	});
});

describe('conditionalCoverageRate', () => {
	it('counts covered values, endpoints included', () => {
		expect(conditionalCoverageRate([[0, 10], [0, 1]], [5, 0.5])).toBe(1);
		expect(conditionalCoverageRate([[0, 1], [5, 6]], [0, 6])).toBe(1);
	});

	it('partial and zero coverage', () => {
		expect(conditionalCoverageRate([[0, 10], [0, 1]], [5, 2])).toBeCloseTo(0.5, 12);
		expect(conditionalCoverageRate([[0, 1]], [1.5])).toBe(0);
	});

	it('empty input gives 0', () => {
		expect(conditionalCoverageRate([], [])).toBe(0);
	});
});
