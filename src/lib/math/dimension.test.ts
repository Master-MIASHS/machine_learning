import { describe, expect, it } from 'vitest';
import { minMaxDistanceRatio, minMaxDistances, unitCubePoints } from './dimension';

describe('unitCubePoints', () => {
	it('is deterministic and has the requested shape', () => {
		const points = unitCubePoints(4, 12, 42);
		expect(points).toEqual(unitCubePoints(4, 12, 42));
		expect(points).toHaveLength(12);
		expect(points.every((point) => point.length === 4)).toBe(true);
		expect(points.flat().every((coordinate) => coordinate >= 0 && coordinate <= 1)).toBe(true);
	});

	it('rejects invalid dimensions and sample sizes', () => {
		expect(() => unitCubePoints(0, 10)).toThrow();
		expect(() => unitCubePoints(2.5, 10)).toThrow();
		expect(() => unitCubePoints(2, 0)).toThrow();
	});
});

describe('minMaxDistances and minMaxDistanceRatio', () => {
	it('matches an exact two-point distance', () => {
		const extremes = minMaxDistances([
			[0, 0],
			[3, 4]
		]);
		expect(extremes.min).toBe(5);
		expect(extremes.max).toBe(5);
		expect(
			minMaxDistanceRatio([
				[0, 0],
				[3, 4]
			])
		).toBe(1);
	});

	it('returns a ratio in (0, 1] and concentrates more in high dimension', () => {
		const lowDimension = minMaxDistanceRatio(unitCubePoints(2, 80, 7));
		const highDimension = minMaxDistanceRatio(unitCubePoints(50, 80, 7));
		expect(lowDimension).toBeGreaterThan(0);
		expect(lowDimension).toBeLessThanOrEqual(1);
		expect(highDimension).toBeGreaterThan(0);
		expect(highDimension).toBeLessThanOrEqual(1);
		expect(highDimension).toBeGreaterThan(lowDimension);
	});

	it('rejects too few, inconsistent, empty, or identical points', () => {
		expect(() => minMaxDistances([])).toThrow();
		expect(() => minMaxDistances([[0, 0]])).toThrow();
		expect(() => minMaxDistances([[0, 0], [1]])).toThrow();
		expect(() =>
			minMaxDistances([
				[0, 0],
				[0, 0]
			])
		).toThrow();
	});
});
