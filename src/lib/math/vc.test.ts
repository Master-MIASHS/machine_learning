import { describe, it, expect } from 'vitest';
import {
	allLabelings,
	isThresholdRealizable,
	isIntervalRealizable,
	isHalfspaceRealizable,
	findSeparatingHyperplane2D,
	shatters,
	countRealizedDichotomies,
	trivialGrowthBound,
	sauerShelahBound,
	sauerShelahEnvelope,
	vcGeneralizationBound,
	marginVCDimBound,
	svmGeneralizationBound
} from './vc';

describe('allLabelings', () => {
	it('returns 2^m labelings, each of length m', () => {
		const labelings = allLabelings(3);
		expect(labelings).toHaveLength(8);
		for (const l of labelings) expect(l).toHaveLength(3);
	});

	it('returns a single empty labeling for m=0', () => {
		expect(allLabelings(0)).toEqual([[]]);
	});
});

describe('thresholds — VCdim = 1', () => {
	it('shatters any single point', () => {
		expect(shatters('thresholds', [5])).toBe(true);
	});

	it('does not shatter two points (the (1,0) sorted pattern is unrealizable)', () => {
		expect(shatters('thresholds', [1, 2])).toBe(false);
		expect(isThresholdRealizable([1, 2], [1, 0])).toBe(false);
		expect(isThresholdRealizable([1, 2], [0, 1])).toBe(true);
	});

	it('only realizes m+1 of the 2^m labelings for m points in general position', () => {
		expect(countRealizedDichotomies('thresholds', [1, 2, 3])).toBe(4); // m+1 = 4
	});
});

describe('intervals — VCdim = 2', () => {
	it('shatters two points', () => {
		expect(shatters('intervals', [1, 2])).toBe(true);
	});

	it('does not shatter three points (a 1-0-1 pattern is unrealizable)', () => {
		expect(shatters('intervals', [1, 2, 3])).toBe(false);
		expect(isIntervalRealizable([1, 2, 3], [1, 0, 1])).toBe(false);
		expect(isIntervalRealizable([1, 2, 3], [0, 1, 0])).toBe(true);
	});
});

describe('halfspaces2d — VCdim = 3', () => {
	const triangle: [number, number][] = [
		[0, 0],
		[1, 0],
		[0, 1]
	];

	it('shatters a non-degenerate triangle', () => {
		expect(shatters('halfspaces2d', triangle)).toBe(true);
	});

	it('does not shatter 4 points where one lies inside the triangle of the other three', () => {
		const points: [number, number][] = [
			[0, 0],
			[2, 0],
			[0, 2],
			[0.5, 0.5] // inside the triangle formed by the other three
		];
		// Labeling the 3 outer points 1 and the inner point 0 is unrealizable:
		// the inner point is a convex combination of the outer ones, so any
		// halfspace containing all three outer points must also contain it.
		expect(isHalfspaceRealizable(points, [1, 1, 1, 0])).toBe(false);
		expect(shatters('halfspaces2d', points)).toBe(false);
	});

	it('realizes all-same-label trivially', () => {
		expect(isHalfspaceRealizable(triangle, [1, 1, 1])).toBe(true);
		expect(isHalfspaceRealizable(triangle, [0, 0, 0])).toBe(true);
	});

	it('shatters any two distinct points (the parallel-candidate case)', () => {
		const twoPts: [number, number][] = [
			[0, 0],
			[1, 1]
		];
		expect(isHalfspaceRealizable(twoPts, [1, 0])).toBe(true);
		expect(isHalfspaceRealizable(twoPts, [0, 1])).toBe(true);
		expect(shatters('halfspaces2d', twoPts)).toBe(true);
		expect(countRealizedDichotomies('halfspaces2d', twoPts)).toBe(4);
	});

	it('handles separable collinear configurations', () => {
		const collinear: [number, number][] = [
			[0, 0],
			[1, 0],
			[2, 0]
		];
		expect(isHalfspaceRealizable(collinear, [1, 0, 0])).toBe(true);
		// 1-0-1 along a line is not halfspace-realizable (the middle point is
		// a convex combination of the two outer ones).
		expect(isHalfspaceRealizable(collinear, [1, 0, 1])).toBe(false);
	});

	it('findSeparatingHyperplane2D returns a witness that actually classifies the points', () => {
		const twoPts: [number, number][] = [
			[0, 0],
			[3, 0]
		];
		const h = findSeparatingHyperplane2D(twoPts, [1, 0]);
		expect(h).not.toBeNull();
		const [wx, wy] = h!.w;
		expect(wx * twoPts[0][0] + wy * twoPts[0][1] >= h!.b).toBe(true);
		expect(wx * twoPts[1][0] + wy * twoPts[1][1] < h!.b).toBe(true);
		expect(findSeparatingHyperplane2D(triangle, [1, 1, 0])).not.toBeNull();
		expect(findSeparatingHyperplane2D(triangle, [0, 0, 1])).not.toBeNull();
	});
});

describe('trivialGrowthBound', () => {
	it('equals 2^m', () => {
		expect(trivialGrowthBound(5)).toBe(32);
		expect(trivialGrowthBound(0)).toBe(1);
	});
});

describe('sauerShelahBound', () => {
	it('equals 2^m when d >= m (no VC constraint kicks in)', () => {
		expect(sauerShelahBound(5, 5)).toBe(32);
		expect(sauerShelahBound(5, 10)).toBe(32);
	});

	it('equals 1+m for d=1', () => {
		expect(sauerShelahBound(10, 1)).toBe(11);
	});

	it('is non-decreasing in m and non-decreasing in d', () => {
		expect(sauerShelahBound(20, 3)).toBeGreaterThan(sauerShelahBound(10, 3));
		expect(sauerShelahBound(20, 5)).toBeGreaterThan(sauerShelahBound(20, 3));
	});
});

describe('sauerShelahEnvelope', () => {
	it('equals e^d at m=d', () => {
		expect(sauerShelahEnvelope(4, 4)).toBeCloseTo(Math.pow(Math.E, 4), 6);
	});

	it('upper-bounds the exact Sauer-Shelah sum for m >= d', () => {
		for (const [m, d] of [
			[10, 3],
			[50, 5],
			[100, 10]
		]) {
			expect(sauerShelahEnvelope(m, d)).toBeGreaterThanOrEqual(sauerShelahBound(m, d));
		}
	});

	it('throws for m < d or non-positive d', () => {
		expect(() => sauerShelahEnvelope(3, 5)).toThrow();
		expect(() => sauerShelahEnvelope(5, 0)).toThrow();
	});
});

describe('vcGeneralizationBound', () => {
	it('matches the formula directly', () => {
		const d = 5;
		const n = 1000;
		const delta = 0.05;
		const expected = Math.sqrt(
			(8 * d * Math.log((2 * Math.E * n) / d) + 8 * Math.log(4 / delta)) / n
		);
		expect(vcGeneralizationBound(d, n, delta)).toBeCloseTo(expected, 10);
	});

	it('decreases as n grows, increases as d grows', () => {
		expect(vcGeneralizationBound(5, 5000, 0.05)).toBeLessThan(vcGeneralizationBound(5, 1000, 0.05));
		expect(vcGeneralizationBound(20, 1000, 0.05)).toBeGreaterThan(
			vcGeneralizationBound(5, 1000, 0.05)
		);
	});

	it('throws when n < d, or for non-positive d/n or delta outside (0,1)', () => {
		expect(() => vcGeneralizationBound(100, 50, 0.05)).toThrow();
		expect(() => vcGeneralizationBound(0, 100, 0.05)).toThrow();
		expect(() => vcGeneralizationBound(5, 100, 0)).toThrow();
	});
});

describe('marginVCDimBound', () => {
	it('matches floor(R^2/gamma^2)', () => {
		expect(marginVCDimBound(2, 1)).toBe(4);
		expect(marginVCDimBound(1, 2)).toBe(0); // R^2/gamma^2 = 0.25 -> floor 0
	});

	it('throws for non-positive R or gamma', () => {
		expect(() => marginVCDimBound(0, 1)).toThrow();
		expect(() => marginVCDimBound(1, 0)).toThrow();
	});
});

describe('svmGeneralizationBound', () => {
	it('returns 0 when the margin-based VC-dim bound rounds down to 0', () => {
		expect(svmGeneralizationBound(1, 2, 100, 0.05)).toBe(0);
	});

	it('matches vcGeneralizationBound applied to the margin-based d otherwise', () => {
		const R = 3;
		const gamma = 1;
		const n = 100;
		const delta = 0.05;
		const d = marginVCDimBound(R, gamma); // 9
		expect(svmGeneralizationBound(R, gamma, n, delta)).toBeCloseTo(
			vcGeneralizationBound(d, n, delta),
			10
		);
	});

	it('throws when n is below the margin-based VC-dim bound', () => {
		expect(() => svmGeneralizationBound(10, 1, 5, 0.05)).toThrow(); // d=100 > n=5
	});
});
