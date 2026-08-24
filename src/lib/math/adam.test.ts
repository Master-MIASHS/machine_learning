import { describe, expect, it } from 'vitest';
import { adamStep, adamWStep, createAdamState, exponentialMovingAverage } from './adam';

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
