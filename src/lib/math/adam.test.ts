import { describe, expect, it } from 'vitest';
import {
	adamStep,
	adamWStep,
	biasCorrected,
	createAdamState,
	exponentialMovingAverage
} from './adam';

describe('adamStep', () => {
	it('computes the first bias-corrected step exactly', () => {
		const result = adamStep([1, -2], [2, -4], createAdamState(2), {
			alpha: 0.1,
			beta1: 0.9,
			beta2: 0.999,
			epsilon: 0
		});
		expect(result.mHat).toEqual([2, -4]);
		expect(result.vHat).toEqual([4, 16]);
		expect(result.theta).toEqual([0.9, -1.9]);
	});

	it('does not mutate inputs and advances the state', () => {
		const theta = [1];
		const gradient = [3];
		const state = createAdamState(1);
		const result = adamStep(theta, gradient, state, { alpha: 0.01, beta1: 0.9, beta2: 0.99, epsilon: 1e-8 });
		expect(theta).toEqual([1]);
		expect(gradient).toEqual([3]);
		expect(state.step).toBe(0);
		expect(result.state.step).toBe(1);
	});
});

describe('adamWStep', () => {
	it('applies multiplicative decay separately from the gradient update', () => {
		const result = adamWStep([2], [0], createAdamState(1), { alpha: 0.1, beta1: 0.9, beta2: 0.999, epsilon: 1e-8 }, 0.5);
		expect(result.theta[0]).toBeCloseTo(1.9);
	});
});

describe('EMA', () => {
	it('has the expected short-memory limits', () => {
		expect(exponentialMovingAverage([1, 2, 3], 0)).toEqual([1, 2, 3]);
		expect(exponentialMovingAverage([1, 2, 3], 0.5)).toEqual([0.5, 1.25, 2.125]);
	});
});

describe('biasCorrected', () => {
	it('divides by 1 - beta^step; at t = 1 this is value / (1 - beta)', () => {
		// m_1 = (1 - beta) * g, so mHat_1 = m_1 / (1 - beta) = g exactly
		expect(biasCorrected(0.2, 0.9, 1)).toBeCloseTo(2, 12);
		expect(biasCorrected(1, 0.5, 3)).toBeCloseTo(1 / (1 - 0.125), 12); // 8/7
		expect(biasCorrected(3, 0.999, 2)).toBeCloseTo(3 / (1 - 0.999 ** 2), 12);
	});

	it('correction factor 1/(1-beta^t) decreases to 1 as t grows', () => {
		const factors = [1, 100, 1000, 10000].map((t) => biasCorrected(1, 0.999, t));
		// t = 1: 1/(1-0.999) = 1000 ; t = 100: ~10.6 ; t = 1000: ~1.58
		expect(factors[0]).toBeCloseTo(1000, 6);
		for (let i = 1; i < factors.length; i++) {
			expect(factors[i]).toBeLessThan(factors[i - 1]);
		}
		expect(factors[3]).toBeCloseTo(1, 3); // 1/(1 - 0.999^10000) ~ 1.000045
	});
});

describe('constant-gradient limit', () => {
	it('with a constant gradient, the walk is exactly linear: theta_T = theta_0 - T*alpha*g/(|g|+epsilon)', () => {
		// For constant g: m_t = g(1 - beta1^t) and v_t = g^2(1 - beta2^t),
		// so the bias correction cancels exactly: mHat_t = g, vHat_t = g^2,
		// and every step moves alpha*g/(|g| + epsilon) — no drift, no decay.
		const params = { alpha: 0.1, beta1: 0.9, beta2: 0.999, epsilon: 1e-8 };
		const g = [2, -3];
		let state = createAdamState(2);
		let theta = [1, -2];
		const T = 5;
		for (let t = 0; t < T; t++) {
			const r = adamStep(theta, g, state, params);
			theta = r.theta;
			state = r.state;
		}
		expect(theta[0]).toBeCloseTo(1 - T * 0.1 * (2 / (2 + 1e-8)), 6); // ~0
		expect(theta[1]).toBeCloseTo(-2 + T * 0.1 * (3 / (3 + 1e-8)), 6); // ~-0.5
	});
});

describe('extreme hyperparameters', () => {
	it('no NaN/Infinity for beta1 and beta2 extremely close to 1', () => {
		const params = { alpha: 0.01, beta1: 1 - 1e-15, beta2: 1 - 1e-15, epsilon: 1e-8 };
		let state = createAdamState(2);
		let theta = [0.5, -0.25];
		for (let t = 0; t < 20; t++) {
			const r = adamStep(theta, [1.3, -0.7], state, params);
			theta = r.theta;
			state = r.state;
			for (const value of [...r.theta, ...r.mHat, ...r.vHat, ...r.update]) {
				expect(Number.isFinite(value)).toBe(true);
			}
		}
	});

	it('zero gradient leaves theta unchanged and produces no NaN', () => {
		const r = adamStep([1, 2], [0, 0], createAdamState(2), {
			alpha: 0.1,
			beta1: 0.9,
			beta2: 0.999,
			epsilon: 1e-8
		});
		expect(r.theta).toEqual([1, 2]);
		expect(r.mHat).toEqual([0, 0]);
		expect(r.vHat).toEqual([0, 0]);
		for (const value of r.effectiveLearningRate) expect(Number.isFinite(value)).toBe(true);
	});
});
