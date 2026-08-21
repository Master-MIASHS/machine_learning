import { describe, it, expect } from 'vitest';
import {
	normalize,
	categoricalSample,
	categoricalSamples,
	uniformDiscrete,
	oneHot,
	softmax,
	logSoftmax,
	safeLog,
	outerProduct
} from '../math/discrete.js';
import { matVec } from './util.js';

describe('normalize', () => {
	it('sums to 1', () => {
		const result = normalize([1, 2, 3]);
		expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
	});

	it('preserves ratios', () => {
		const result = normalize([1, 3]);
		expect(result[0]).toBeCloseTo(0.25, 12);
		expect(result[1]).toBeCloseTo(0.75, 12);
	});

	it('throws on all-zero input', () => {
		expect(() => normalize([0, 0, 0])).toThrow();
	});

	it('handles already-normalized input without distortion', () => {
		const result = normalize([0.5, 0.5]);
		expect(result[0]).toBeCloseTo(0.5, 12);
	});

	it('handles a single element', () => {
		const result = normalize([7]);
		expect(result[0]).toBeCloseTo(1, 12);
	});
});

describe('categoricalSample', () => {
	it('returns an index in range [0, n-1]', () => {
		const probs = [0.1, 0.4, 0.5];
		for (let i = 0; i < 100; i++) {
			const idx = categoricalSample(probs);
			expect(idx).toBeGreaterThanOrEqual(0);
			expect(idx).toBeLessThan(probs.length);
		}
	});

	it('samples index 0 for one-hot [1, 0, 0]', () => {
		// deterministic: rng always returns 0
		const idx = categoricalSample([1, 0, 0], () => 0);
		expect(idx).toBe(0);
	});

	it('samples index 2 for one-hot [0, 0, 1]', () => {
		// rng returns 0.99 → cumulative: 0, 0, 1 → falls through to last
		const idx = categoricalSample([0, 0, 1], () => 0.99);
		expect(idx).toBe(2);
	});
});

describe('categoricalSamples — frequency convergence', () => {
	it('frequencies converge to probs (n=10000)', () => {
		const probs = [0.2, 0.5, 0.3];
		const n = 10_000;
		const samples = categoricalSamples(probs, n);
		const counts = [0, 0, 0];
		for (const s of samples) counts[s]++;
		for (let i = 0; i < probs.length; i++) {
			const freq = counts[i] / n;
			expect(Math.abs(freq - probs[i])).toBeLessThan(0.05);
		}
	});
});

describe('uniformDiscrete', () => {
	it('all entries equal 1/n', () => {
		const result = uniformDiscrete(4);
		expect(result.length).toBe(4);
		result.forEach((p) => expect(p).toBeCloseTo(0.25, 12));
	});

	it('sums to 1', () => {
		const result = uniformDiscrete(7);
		expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
	});
});

describe('oneHot', () => {
	it('places 1 at index i', () => {
		const result = oneHot(2, 5);
		expect(result[2]).toBe(1);
	});

	it('places 0 elsewhere', () => {
		const result = oneHot(1, 4);
		expect(result[0]).toBe(0);
		expect(result[2]).toBe(0);
		expect(result[3]).toBe(0);
	});

	it('sums to 1', () => {
		const result = oneHot(0, 3);
		expect(result.reduce((a, b) => a + b, 0)).toBe(1);
	});
});

describe('softmax', () => {
	it('outputs sum to 1', () => {
		const result = softmax([1, 2, 3]);
		expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
	});

	it('is invariant to constant addition to logits', () => {
		const logits = [1, 2, 3];
		const offset = 100;
		const r1 = softmax(logits);
		const r2 = softmax(logits.map((l) => l + offset));
		r1.forEach((p, i) => expect(p).toBeCloseTo(r2[i], 10));
	});

	it('puts most mass on the largest logit', () => {
		const result = softmax([0, 0, 10]);
		expect(result[2]).toBeGreaterThan(0.99);
	});

	it('is uniform for equal logits', () => {
		const result = softmax([0, 0, 0]);
		result.forEach((p) => expect(p).toBeCloseTo(1 / 3, 12));
	});
});

describe('logSoftmax', () => {
	it('matches log of softmax output', () => {
		const logits = [1, 2, 3];
		const lsm = logSoftmax(logits);
		const sm = softmax(logits);
		lsm.forEach((lp, i) => expect(lp).toBeCloseTo(Math.log(sm[i]), 10));
	});
});

describe('safeLog', () => {
	it('returns finite value for 0', () => {
		expect(isFinite(safeLog(0))).toBe(true);
	});

	it('does not return NaN for 0', () => {
		expect(isNaN(safeLog(0))).toBe(false);
	});

	it('matches Math.log for positive values', () => {
		expect(safeLog(1)).toBeCloseTo(0, 12);
		expect(safeLog(Math.E)).toBeCloseTo(1, 12);
	});
});

describe('matVec', () => {
	it('computes correct result for identity matrix', () => {
		const I = [
			[1, 0],
			[0, 1]
		];
		const v = [3, 7];
		const result = matVec(I, v);
		expect(result).toEqual([3, 7]);
	});

	it('computes basic matrix-vector product', () => {
		// [[1,2],[3,4]] * [1,1] = [3, 7]
		const A = [
			[1, 2],
			[3, 4]
		];
		const result = matVec(A, [1, 1]);
		expect(result[0]).toBeCloseTo(3, 12);
		expect(result[1]).toBeCloseTo(7, 12);
	});
});

describe('outerProduct', () => {
	it('produces correct shape', () => {
		const u = [1, 2];
		const v = [3, 4, 5];
		const result = outerProduct(u, v);
		expect(result.length).toBe(2);
		expect(result[0].length).toBe(3);
	});

	it('produces correct values', () => {
		const u = [1, 2];
		const v = [3, 4];
		const result = outerProduct(u, v);
		expect(result[0][0]).toBeCloseTo(3, 12);
		expect(result[0][1]).toBeCloseTo(4, 12);
		expect(result[1][0]).toBeCloseTo(6, 12);
		expect(result[1][1]).toBeCloseTo(8, 12);
	});
});
