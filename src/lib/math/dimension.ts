import { mulberry32 } from './util';

export interface DistanceExtremes {
	min: number;
	max: number;
}

/** Generate n deterministic points uniformly in the d-dimensional unit cube. */
export function unitCubePoints(d: number, n: number, seed = 1): number[][] {
	if (!Number.isInteger(d) || d <= 0) throw new Error(`d must be a positive integer, got ${d}`);
	if (!Number.isInteger(n) || n <= 0) throw new Error(`n must be a positive integer, got ${n}`);

	const rand = mulberry32(seed);
	return Array.from({ length: n }, () => Array.from({ length: d }, () => rand()));
}

/** Return the smallest and largest pairwise Euclidean distances. */
export function minMaxDistances(points: number[][]): DistanceExtremes {
	if (points.length < 2) throw new Error('points must contain at least two observations');
	const dimension = points[0].length;
	if (dimension === 0) throw new Error('points must have at least one dimension');
	if (points.some((point) => point.length !== dimension)) {
		throw new Error('all points must have the same dimension');
	}

	let min = Infinity;
	let max = 0;
	for (let i = 0; i < points.length; i++) {
		for (let j = i + 1; j < points.length; j++) {
			let squared = 0;
			for (let coordinate = 0; coordinate < dimension; coordinate++) {
				squared += (points[i][coordinate] - points[j][coordinate]) ** 2;
			}
			const distance = Math.sqrt(squared);
			min = Math.min(min, distance);
			max = Math.max(max, distance);
		}
	}
	if (max === 0) throw new Error('points must not all be identical');
	return { min, max };
}

/**
 * Ratio d_min / d_max for pairwise distances in a point cloud. As dimension
 * grows, distances in the unit cube tend to concentrate, so this ratio tends
 * toward one. This is a finite-sample diagnostic, not an asymptotic theorem.
 */
export function minMaxDistanceRatio(points: number[][]): number {
	const { min, max } = minMaxDistances(points);
	return min / max;
}
