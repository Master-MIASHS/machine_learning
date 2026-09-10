// Tests for src/lib/math/overfitting.ts — hero figure of the home page.
//
// The model is an ILLUSTRATIVE toy (see the module header: it paraphrases
// the overfitting warning of course_sources/typst/theorie.typ, Introduction,
// it does not reproduce a formula from the sources). The tests therefore
// check the numerical invariants that make the animation honest and stable:
// exact interpolation, exact polynomial recovery, frame safety, and the
// deterministic fail/hit drama of the default seed.

import { describe, it, expect } from 'vitest';
import {
	heroTrueFunction,
	generateHeroSample,
	memorizingValue,
	buildMemorizingCurve,
	fitPolynomialLeastSquares,
	evaluatePolynomial,
	buildSmoothFit,
	generalizationHeroModel,
	HERO_TIMELINE,
	easeInOutCubic,
	easeOutCubic,
	HERO_SMOOTH_DEGREE,
	HERO_SMOOTH_PENALTY,
	type HeroPoint
} from './overfitting';
import { linspace } from './util';

function totalVariation(ys: number[]): number {
	let s = 0;
	for (let i = 1; i < ys.length; i++) s += Math.abs(ys[i] - ys[i - 1]);
	return s;
}

describe('heroTrueFunction', () => {
	it('stays inside the [0.2, 0.8] frame band on [0, 1] (closed bound |f - 0.5| <= 0.27)', () => {
		for (const x of linspace(0, 1, 400)) {
			const f = heroTrueFunction(x);
			expect(f).toBeGreaterThanOrEqual(0.2);
			expect(f).toBeLessThanOrEqual(0.8);
		}
	});
});

describe('generateHeroSample', () => {
	it('is deterministic for a fixed seed', () => {
		expect(generateHeroSample(6, 82)).toEqual(generateHeroSample(6, 82));
	});

	it('returns n sorted points with distinct x in [0.04, 0.72] and y in [0, 1]', () => {
		const sample = generateHeroSample(6, 82);
		expect(sample).toHaveLength(6);
		for (let i = 0; i < sample.length; i++) {
			expect(sample[i].x).toBeGreaterThanOrEqual(0.04);
			expect(sample[i].x).toBeLessThanOrEqual(0.72);
			expect(sample[i].y).toBeGreaterThanOrEqual(0);
			expect(sample[i].y).toBeLessThanOrEqual(1);
			if (i > 0) expect(sample[i].x).toBeGreaterThan(sample[i - 1].x + 0.01);
		}
	});

	it('throws for n < 4 or non-integer n', () => {
		expect(() => generateHeroSample(3, 1)).toThrow();
		expect(() => generateHeroSample(2.5, 1)).toThrow();
	});
});

describe('memorizingValue / buildMemorizingCurve', () => {
	it('interpolates: p(x_i) = y_i exactly for every sample point (invariant)', () => {
		const sample = generateHeroSample(6, 82);
		for (const p of sample) {
			expect(memorizingValue(sample, p.x)).toBeCloseTo(p.y, 9);
		}
	});

	it('reproduces a degree-(n-1) polynomial exactly at an off-sample point (closed form)', () => {
		// 5 points on the cubic g(x) = 0.4 + 0.3x - 0.2x^2 + 0.1x^3: the
		// unique degree-4 interpolant of 5 points of a cubic is the cubic.
		const g = (x: number) => 0.4 + 0.3 * x - 0.2 * x * x + 0.1 * x * x * x;
		const sample: HeroPoint[] = [0.1, 0.2, 0.3, 0.4, 0.5].map((x) => ({ x, y: g(x) }));
		expect(memorizingValue(sample, 0.37)).toBeCloseTo(g(0.37), 8);
	});

	it('buildMemorizingCurve matches pointwise evaluation on a grid', () => {
		const sample = generateHeroSample(6, 82);
		const grid = linspace(0.05, 0.8, 17);
		const curve = buildMemorizingCurve(sample, grid);
		grid.forEach((x, i) => expect(curve[i]).toBeCloseTo(memorizingValue(sample, x), 10));
	});

	it('throws on an empty sample', () => {
		expect(() => memorizingValue([], 0.5)).toThrow();
	});
});

describe('fitPolynomialLeastSquares / buildSmoothFit', () => {
	it('recovers an exact quadratic: coefficients and zero residual (closed form)', () => {
		const h = (x: number) => 0.3 + 0.25 * x - 0.15 * x * x;
		const sample: HeroPoint[] = linspace(0.05, 0.95, 7).map((x) => ({ x, y: h(x) }));
		const beta = fitPolynomialLeastSquares(sample, 2);
		expect(beta[0]).toBeCloseTo(0.3, 6);
		expect(beta[1]).toBeCloseTo(0.25, 6);
		expect(beta[2]).toBeCloseTo(-0.15, 6);
		for (const p of sample) {
			expect(evaluatePolynomial(beta, p.x)).toBeCloseTo(p.y, 6);
		}
	});

	it('the L2 penalty damps the non-affine coefficients (ridge property)', () => {
		const sample = generateHeroSample(6, 82);
		const plain = fitPolynomialLeastSquares(sample, 3);
		const damped = fitPolynomialLeastSquares(sample, 3, 5);
		const norm = (b: number[]) => b.slice(2).reduce((s, c) => s + c * c, 0);
		expect(norm(damped)).toBeLessThan(norm(plain));
	});

	it('does not mutate the sample', () => {
		const sample = generateHeroSample(6, 82);
		const before = sample.map((p) => ({ ...p }));
		fitPolynomialLeastSquares(sample, 3, 0.3);
		expect(sample).toEqual(before);
	});

	it('buildSmoothFit matches the fitted polynomial pointwise', () => {
		const sample = generateHeroSample(6, 82);
		const grid = linspace(0, 1, 21);
		const beta = fitPolynomialLeastSquares(sample, 3, 0.3);
		const curve = buildSmoothFit(sample, 3, grid, 0.3);
		grid.forEach((x, i) => expect(curve[i]).toBeCloseTo(evaluatePolynomial(beta, x), 10));
	});

	it('throws for degree < 0, penalty < 0, or too few points', () => {
		const sample = generateHeroSample(6, 82);
		expect(() => fitPolynomialLeastSquares(sample, -1)).toThrow();
		expect(() => fitPolynomialLeastSquares(sample, 3, -0.1)).toThrow();
		expect(() => fitPolynomialLeastSquares(sample.slice(0, 3), 3)).toThrow();
	});
});

describe('evaluatePolynomial', () => {
	it('matches direct evaluation on a known value (1 + 2x + 3x^2 at x = 2 is 17)', () => {
		expect(evaluatePolynomial([1, 2, 3], 2)).toBeCloseTo(17, 12);
	});
});

describe('easing helpers', () => {
	it('hit the endpoints and clamp outside [0, 1]', () => {
		for (const f of [easeInOutCubic, easeOutCubic]) {
			expect(f(0)).toBe(0);
			expect(f(1)).toBe(1);
			expect(f(-0.5)).toBe(0);
			expect(f(1.5)).toBe(1);
		}
	});

	it('are monotone non-decreasing on [0, 1]', () => {
		for (const f of [easeInOutCubic, easeOutCubic]) {
			let prev = -1;
			for (const t of linspace(0, 1, 50)) {
				expect(f(t)).toBeGreaterThanOrEqual(prev);
				prev = f(t);
			}
		}
	});
});

describe('HERO_TIMELINE', () => {
	it('is well ordered: every beat starts after the previous one and ends in the loop', () => {
		const tl = HERO_TIMELINE;
		expect(tl.loop).toBeGreaterThan(0);
		expect(tl.pointsStart).toBeGreaterThanOrEqual(0);
		expect(tl.drawStart).toBeGreaterThan(tl.pointsStart);
		expect(tl.drawEnd).toBeGreaterThan(tl.drawStart);
		expect(tl.testStart).toBeGreaterThan(tl.drawStart);
		expect(tl.testEnd).toBeGreaterThan(tl.testStart);
		expect(tl.failRingStart).toBeGreaterThan(tl.testStart);
		expect(tl.failRingStart + tl.failRingDur).toBeLessThan(tl.loop);
		expect(tl.morphStart).toBeGreaterThan(tl.failRingStart);
		expect(tl.morphEnd).toBeGreaterThan(tl.morphStart);
		expect(tl.okRingStart).toBeGreaterThan(tl.morphStart);
		expect(tl.okRingStart + tl.okRingDur).toBeLessThan(tl.loop);
		expect(tl.fadeStart).toBeGreaterThan(tl.morphEnd);
		expect(tl.fadeEnd).toBe(tl.loop);
	});
});

describe('generalizationHeroModel (default seed)', () => {
	const model = generalizationHeroModel();

	it('is deterministic', () => {
		expect(generalizationHeroModel()).toEqual(generalizationHeroModel());
	});

	it('precomputes a full 80-point grid for both curves', () => {
		expect(model.grid).toHaveLength(80);
		expect(model.memorizing).toHaveLength(80);
		expect(model.smooth).toHaveLength(80);
	});

	it('frame safety: the memorizing curve stays inside the [0, 1] frame on the grid', () => {
		for (const v of [...model.memorizing, ...model.smooth]) {
			expect(v).toBeGreaterThan(-0.02);
			expect(v).toBeLessThan(1.02);
		}
	});

	it('all values are finite', () => {
		for (const v of [...model.memorizing, ...model.smooth, model.memorizingAtTest, model.smoothAtTest]) {
			expect(Number.isFinite(v)).toBe(true);
		}
	});

	it('drama: the interpolant misses the unseen test point by far more than the regularized fit', () => {
		const memErr = Math.abs(model.memorizingAtTest - model.testPoint.y);
		const smoothErr = Math.abs(model.smoothAtTest - model.testPoint.y);
		expect(memErr).toBeGreaterThan(0.3);
		expect(smoothErr).toBeLessThan(0.15);
		expect(memErr).toBeGreaterThan(3 * smoothErr);
	});

	it('the memorizing curve oscillates more than the smooth fit (total variation)', () => {
		expect(totalVariation(model.memorizing)).toBeGreaterThan(totalVariation(model.smooth) * 2);
	});

	it('the test point lies outside the sampled x region', () => {
		const maxX = Math.max(...model.sample.map((p) => p.x));
		expect(model.testPoint.x).toBeGreaterThan(maxX);
	});

	it('exposes the hero smooth-fit parameters', () => {
		expect(HERO_SMOOTH_DEGREE).toBe(3);
		expect(HERO_SMOOTH_PENALTY).toBeGreaterThan(0);
	});
});
