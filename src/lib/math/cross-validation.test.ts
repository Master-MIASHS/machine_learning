import { describe, expect, it } from 'vitest';
import { generateKnnDataset, type Knn2DModel } from './consistency';
import { kFoldIndices, knnCVAccuracyCurve, leavePOutCount } from './cross-validation';

describe('kFoldIndices', () => {
	it('partitions every index exactly once into near-equal folds', () => {
		const folds = kFoldIndices(11, 4, 42);
		const allIndices = folds.flat();
		expect(new Set(allIndices).size).toBe(11);
		expect(allIndices.sort((a, b) => a - b)).toEqual([...Array(11).keys()]);
		expect(
			Math.max(...folds.map((fold) => fold.length)) - Math.min(...folds.map((fold) => fold.length))
		).toBeLessThanOrEqual(1);
	});

	it('is deterministic for a fixed seed and changes with another seed', () => {
		expect(kFoldIndices(20, 5, 8)).toEqual(kFoldIndices(20, 5, 8));
		expect(kFoldIndices(20, 5, 8)).not.toEqual(kFoldIndices(20, 5, 9));
	});

	it('rejects impossible fold configurations', () => {
		expect(() => kFoldIndices(1, 2)).toThrow();
		expect(() => kFoldIndices(10, 1)).toThrow();
		expect(() => kFoldIndices(3, 4)).toThrow();
	});
});

describe('knnCVAccuracyCurve', () => {
	const model: Knn2DModel = { radius: 2, temperature: 0.3 };
	const dataset = generateKnnDataset(80, model, 3, 17);

	it('returns one bounded accuracy for each candidate k', () => {
		const curve = knnCVAccuracyCurve(dataset, [1, 3, 5, 9], 5, 4);
		expect(curve.map((point) => point.k)).toEqual([1, 3, 5, 9]);
		for (const point of curve) expect(point.accuracy).toBeGreaterThanOrEqual(0);
		for (const point of curve) expect(point.accuracy).toBeLessThanOrEqual(1);
	});

	it('is deterministic and rejects k larger than a training fold', () => {
		const a = knnCVAccuracyCurve(dataset, [1, 5], 4, 12);
		expect(a).toEqual(knnCVAccuracyCurve(dataset, [1, 5], 4, 12));
		expect(() => knnCVAccuracyCurve(dataset, [61], 4)).toThrow();
	});
});

describe('leavePOutCount', () => {
	it('matches basic binomial values and symmetry', () => {
		expect(leavePOutCount(10, 1)).toBe(10);
		expect(leavePOutCount(10, 0)).toBe(1);
		expect(leavePOutCount(12, 3)).toBe(leavePOutCount(12, 9));
		expect(leavePOutCount(12, 3)).toBe(220);
	});

	it('rejects invalid n and p', () => {
		expect(() => leavePOutCount(0, 1)).toThrow();
		expect(() => leavePOutCount(10, -1)).toThrow();
		expect(() => leavePOutCount(10, 11)).toThrow();
	});
});
