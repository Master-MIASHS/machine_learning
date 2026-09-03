import { mulberry32 } from './util';
import type { LabeledPoint2D } from './consistency';

export interface KnnRegressionPoint {
	x1: number;
	x2: number;
	y: number;
}

export interface KnnVoteCounts {
	0: number;
	1: number;
}

interface PointWithDistance<T> {
	point: T;
	distance: number;
}

function validateK(k: number, size: number): void {
	if (!Number.isInteger(k) || k <= 0) throw new Error(`k must be a positive integer, got ${k}`);
	if (k > size) throw new Error(`k (${k}) cannot exceed dataset size (${size})`);
}

function squaredDistance(a: { x1: number; x2: number }, b: { x1: number; x2: number }): number {
	return (a.x1 - b.x1) ** 2 + (a.x2 - b.x2) ** 2;
}

function nearest<T extends { x1: number; x2: number }>(
	dataset: T[],
	query: { x1: number; x2: number },
	k: number
): T[] {
	validateK(k, dataset.length);
	return dataset
		.map((point): PointWithDistance<T> => ({ point, distance: squaredDistance(point, query) }))
		.sort((a, b) => a.distance - b.distance)
		.slice(0, k)
		.map(({ point }) => point);
}

/**
 * Generate a deterministic toy regression dataset for the introductory
 * k-NN explorer. The response is a smooth two-dimensional signal plus fixed
 * seeded noise; this illustrative model is not a formula from theorie.typ.
 */
export function generateKnnRegressionDataset(
	n: number,
	seed = 1,
	domain = 3
): KnnRegressionPoint[] {
	if (!Number.isInteger(n) || n <= 0) throw new Error(`n must be a positive integer, got ${n}`);
	if (!Number.isFinite(domain) || domain <= 0) {
		throw new Error(`domain must be finite and positive, got ${domain}`);
	}

	const rand = mulberry32(seed);
	return Array.from({ length: n }, () => {
		const x1 = (rand() * 2 - 1) * domain;
		const x2 = (rand() * 2 - 1) * domain;
		const signal = 0.7 * x1 - 0.35 * x2 + 0.45 * Math.sin(x1 * 1.4);
		const noise = (rand() * 2 - 1) * 0.35;
		return { x1, x2, y: signal + noise };
	});
}

/** Return the binary class vote counts among the k nearest observations. */
export function knnVoteCounts(
	dataset: LabeledPoint2D[],
	query: { x1: number; x2: number },
	k: number
): KnnVoteCounts {
	const neighbors = nearest(dataset, query, k);
	const counts: KnnVoteCounts = { 0: 0, 1: 0 };
	for (const neighbor of neighbors) {
		if (neighbor.label !== 0 && neighbor.label !== 1) {
			throw new Error(`classification labels must be 0 or 1, got ${neighbor.label}`);
		}
		counts[neighbor.label] += 1;
	}
	return counts;
}

/**
 * Predict the binary class by majority vote; ties are assigned to class 1.
 * This is the convention used by the introductory k-NN widget.
 */
export function knnClassificationPredict(
	dataset: LabeledPoint2D[],
	query: { x1: number; x2: number },
	k: number
): 0 | 1 {
	const counts = knnVoteCounts(dataset, query, k);
	return counts[1] * 2 >= k ? 1 : 0;
}

/** Return the k nearest points in a regression dataset. */
export function knnRegressionNeighbors(
	dataset: KnnRegressionPoint[],
	query: { x1: number; x2: number },
	k: number
): KnnRegressionPoint[] {
	return nearest(dataset, query, k);
}

/** Predict the response by averaging the responses of the k nearest points. */
export function knnRegressionPredict(
	dataset: KnnRegressionPoint[],
	query: { x1: number; x2: number },
	k: number
): number {
	const neighbors = knnRegressionNeighbors(dataset, query, k);
	return neighbors.reduce((sum, point) => sum + point.y, 0) / neighbors.length;
}
