import { describe, expect, it } from 'vitest';
import {
	generateKnnRegressionDataset,
	knnClassificationPredict,
	knnRegressionNeighbors,
	knnRegressionPredict,
	knnVoteCounts
} from './knn';

describe('generateKnnRegressionDataset', () => {
	it('is deterministic for a fixed seed and has the requested size', () => {
		const a = generateKnnRegressionDataset(20, 42, 3);
		const b = generateKnnRegressionDataset(20, 42, 3);
		expect(a).toEqual(b);
		expect(a).toHaveLength(20);
	});

	it('keeps generated coordinates inside the requested domain', () => {
		for (const point of generateKnnRegressionDataset(100, 7, 2)) {
			expect(Math.abs(point.x1)).toBeLessThanOrEqual(2);
			expect(Math.abs(point.x2)).toBeLessThanOrEqual(2);
		}
	});

	it('rejects invalid sizes and domains', () => {
		expect(() => generateKnnRegressionDataset(0)).toThrow();
		expect(() => generateKnnRegressionDataset(1.5)).toThrow();
		expect(() => generateKnnRegressionDataset(2, 1, 0)).toThrow();
	});
});

describe('knnVoteCounts', () => {
	const dataset = [
		{ x1: 0, x2: 0, label: 1 as const },
		{ x1: 1, x2: 0, label: 0 as const },
		{ x1: 0, x2: 2, label: 1 as const },
		{ x1: 3, x2: 0, label: 0 as const }
	];

	it('counts exactly the labels of the k nearest points', () => {
		expect(knnVoteCounts(dataset, { x1: 0.1, x2: 0 }, 3)).toEqual({ 0: 1, 1: 2 });
	});

	it('counts sum to k and rejects invalid k', () => {
		const counts = knnVoteCounts(dataset, { x1: 0, x2: 0 }, 2);
		expect(counts[0] + counts[1]).toBe(2);
		expect(() => knnVoteCounts(dataset, { x1: 0, x2: 0 }, 0)).toThrow();
		expect(() => knnVoteCounts(dataset, { x1: 0, x2: 0 }, 5)).toThrow();
	});

	it('assigns ties to class 1, matching the widget convention', () => {
		const tiedDataset = [
			{ x1: 0, x2: 0, label: 0 as const },
			{ x1: 1, x2: 0, label: 1 as const }
		];
		expect(knnClassificationPredict(tiedDataset, { x1: 0.5, x2: 0 }, 2)).toBe(1);
	});
});

describe('knnRegressionPredict', () => {
	const dataset = [
		{ x1: 0, x2: 0, y: 2 },
		{ x1: 1, x2: 0, y: 4 },
		{ x1: 0, x2: 1, y: 8 },
		{ x1: 3, x2: 3, y: 100 }
	];

	it('equals the exact mean of the k nearest responses', () => {
		expect(knnRegressionPredict(dataset, { x1: 0, x2: 0 }, 3)).toBe(14 / 3);
	});

	it('returns the nearest response for k = 1', () => {
		expect(knnRegressionPredict(dataset, { x1: 0.1, x2: 0 }, 1)).toBe(2);
	});

	it('returns neighbors in increasing distance order', () => {
		const neighbors = knnRegressionNeighbors(dataset, { x1: 0, x2: 0 }, 3);
		expect(neighbors.map((point) => point.y)).toEqual([2, 4, 8]);
	});
});
