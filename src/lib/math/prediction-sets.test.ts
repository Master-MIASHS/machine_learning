import { describe, expect, it } from 'vitest';
import { accuracyAtK, findOptimalK, topK } from './prediction-sets';

describe('topK', () => {
	it('returns the k highest-probability indices, sorted descending', () => {
		expect(topK([0.1, 0.7, 0.2, 0.5], 2)).toEqual([1, 3]);
	});

	it('k = 1 returns the argmax', () => {
		expect(topK([0.1, 0.7, 0.2, 0.5], 1)).toEqual([1]);
	});

	it('k ≥ n returns every index, best first', () => {
		expect(topK([0.2, 0.5, 0.3], 10)).toEqual([1, 2, 0]);
	});

	it('ties are broken toward the lower index', () => {
		expect(topK([0.4, 0.4, 0.2], 2)).toEqual([0, 1]);
		expect(topK([0.3, 0.5, 0.5], 3)).toEqual([1, 2, 0]);
	});

	it('results respect the invariants: size, range, distinctness, non-increasing order', () => {
		const probas = [0.33, 0.08, 0.51, 0.08];
		const idx = topK(probas, 3);
		expect(idx).toHaveLength(3);
		for (const i of idx) {
			expect(i).toBeGreaterThanOrEqual(0);
			expect(i).toBeLessThan(probas.length);
		}
		expect(new Set(idx).size).toBe(idx.length);
		for (let j = 1; j < idx.length; j++) {
			expect(probas[idx[j]]).toBeLessThanOrEqual(probas[idx[j - 1]]);
		}
	});
});

describe('accuracyAtK', () => {
	it('counts the samples whose true label is in the top-K', () => {
		const yTrue = [0, 1];
		const yProba = [
			[0.6, 0.4],
			[0.55, 0.45]
		];
		expect(accuracyAtK(yTrue, yProba, 1)).toBeCloseTo(0.5, 12);
		expect(accuracyAtK(yTrue, yProba, 2)).toBe(1);
	});

	it('one-hot probabilities give perfect accuracy at k = 1', () => {
		const yTrue = [0, 1, 2];
		const yProba = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
		expect(accuracyAtK(yTrue, yProba, 1)).toBe(1);
	});

	it('k = number of classes always covers the truth', () => {
		const yTrue = [2, 0, 1];
		const yProba = [
			[0.3, 0.4, 0.3],
			[0.2, 0.5, 0.3],
			[0.5, 0.2, 0.3]
		];
		expect(accuracyAtK(yTrue, yProba, 3)).toBe(1);
	});

	it('accuracy is non-decreasing in k and matches hand values', () => {
		const yTrue = [0, 1, 2, 0];
		const yProba = [
			[0.4, 0.5, 0.1],
			[0.45, 0.55, 0],
			[0.49, 0.5, 0.01],
			[0.5, 0.3, 0.2]
		];
		const a1 = accuracyAtK(yTrue, yProba, 1);
		const a2 = accuracyAtK(yTrue, yProba, 2);
		const a3 = accuracyAtK(yTrue, yProba, 3);
		expect(a1).toBeCloseTo(0.5, 12);
		expect(a2).toBeCloseTo(0.75, 12);
		expect(a3).toBe(1);
		expect(a2).toBeGreaterThanOrEqual(a1);
		expect(a3).toBeGreaterThanOrEqual(a2);
	});

	it('empty input gives 0', () => {
		expect(accuracyAtK([], [], 1)).toBe(0);
	});
});

describe('findOptimalK', () => {
	it('reports the accuracy for every k and the smallest k reaching the target', () => {
		const yTrue = [0, 1, 0, 1];
		const yProba = [
			[0.6, 0.4, 0],
			[0.45, 0.55, 0],
			[0.3, 0.2, 0.5],
			[0.55, 0.45, 0]
		];
		const { k, accuracies } = findOptimalK(yTrue, yProba, 0.75);
		expect(accuracies).toHaveLength(3);
		for (let i = 1; i <= 3; i++) {
			expect(accuracies[i - 1]).toBeCloseTo(accuracyAtK(yTrue, yProba, i), 12);
		}
		expect(accuracies[0]).toBeCloseTo(0.5, 12);
		expect(accuracies[1]).toBe(1);
		expect(k).toBe(2);
	});

	it('returns k = 1 when the target is already met at k = 1 (or is 0)', () => {
		const yTrue = [0, 1];
		const yProba = [
			[0.9, 0.1],
			[0.1, 0.9]
		];
		expect(findOptimalK(yTrue, yProba, 1).k).toBe(1);
		expect(findOptimalK(yTrue, yProba, 0).k).toBe(1);
	});

	it('returns the number of classes when the truth only appears in rank 3', () => {
		const { k } = findOptimalK([2], [[0.34, 0.33, 0.33]], 1);
		expect(k).toBe(3);
	});

	it('falls back to k = 1 when the target is unreachable (current behavior)', () => {
		// tie at [0.5, 0.5]: topK breaks toward the lower index, so the truth (0)
		// is already covered at k = 1; only a target above 1 is unreachable
		const { k, accuracies } = findOptimalK([0], [[0.5, 0.5]], 2);
		expect(accuracies).toEqual([1, 1]);
		expect(k).toBe(1);
	});
});
