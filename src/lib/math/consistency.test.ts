import { describe, it, expect } from 'vitest';
import {
	excessRiskScale,
	simulateRiskTrials,
	simulateRiskPath,
	exceedanceProbability,
	meanSquaredExcessRisk,
	checkStoneConditions,
	knnExcessRisk,
	knnExcessRiskCurve,
	knnOptimalK,
	approximationRisk,
	learnedRisk,
	approxEstimDecomposition,
	approxEstimCurve,
	knn2DEta,
	generateKnnDataset,
	kNearestNeighbors,
	knnPredict,
	knnDecisionField,
	type ExcessRiskModel,
	type KnnRiskModel,
	type ApproxEstimModel,
	type Knn2DModel,
	type LabeledPoint2D
} from './consistency';
import { linspace } from './util'; // TODO: confirm path, as in bayes-learning.test.ts

const model: ExcessRiskModel = { biasConst: 2, decayRate: 0.5 };

describe('excessRiskScale', () => {
	it('matches biasConst / n^decayRate exactly', () => {
		expect(excessRiskScale(4, model)).toBeCloseTo(2 / Math.sqrt(4), 10);
		expect(excessRiskScale(100, model)).toBeCloseTo(2 / 10, 10);
	});

	it('is strictly decreasing in n', () => {
		const ns = [1, 4, 16, 64, 256];
		const scales = ns.map((n) => excessRiskScale(n, model));
		for (let i = 1; i < scales.length; i++) {
			expect(scales[i]).toBeLessThan(scales[i - 1]);
		}
	});

	it('throws for non-positive n', () => {
		expect(() => excessRiskScale(0, model)).toThrow();
		expect(() => excessRiskScale(-1, model)).toThrow();
	});
});

describe('simulateRiskTrials', () => {
	const bayesRisk = 0.2;

	it('is deterministic for a fixed seed', () => {
		const a = simulateRiskTrials(50, 200, bayesRisk, model, 7);
		const b = simulateRiskTrials(50, 200, bayesRisk, model, 7);
		expect(a).toEqual(b);
	});

	it('produces different draws for different seeds', () => {
		const a = simulateRiskTrials(50, 200, bayesRisk, model, 1);
		const b = simulateRiskTrials(50, 200, bayesRisk, model, 2);
		expect(a).not.toEqual(b);
	});

	it('never goes below the Bayes risk', () => {
		const samples = simulateRiskTrials(20, 500, bayesRisk, model, 3);
		for (const r of samples) {
			expect(r).toBeGreaterThanOrEqual(bayesRisk);
		}
	});

	it('has empirical mean close to bayesRisk + scale(n) for a large batch', () => {
		const n = 30;
		const samples = simulateRiskTrials(n, 20000, bayesRisk, model, 11);
		const empiricalMean = samples.reduce((s, r) => s + r, 0) / samples.length;
		const expectedMean = bayesRisk + excessRiskScale(n, model);
		expect(empiricalMean).toBeCloseTo(expectedMean, 1);
	});

	it('does not correlate trivially across different n (different seed stream)', () => {
		const a = simulateRiskTrials(10, 50, bayesRisk, model, 5);
		const b = simulateRiskTrials(20, 50, bayesRisk, model, 5);
		expect(a).not.toEqual(b);
	});
});

describe('simulateRiskPath', () => {
	it('returns one value per grid point and is deterministic for a fixed seed', () => {
		const nGrid = linspace(5, 100, 20).map((n) => Math.round(n));
		const a = simulateRiskPath(nGrid, 0.1, model, 9);
		const b = simulateRiskPath(nGrid, 0.1, model, 9);
		expect(a).toHaveLength(nGrid.length);
		expect(a).toEqual(b);
	});
});

describe('exceedanceProbability', () => {
	it('matches the analytical Exponential tail probability for a large batch', () => {
		const n = 40;
		const bayesRisk = 0;
		const epsilon = 0.05;
		const samples = simulateRiskTrials(n, 50000, bayesRisk, model, 13);
		const empirical = exceedanceProbability(samples, bayesRisk, epsilon);
		const scale = excessRiskScale(n, model);
		const analytical = Math.exp(-epsilon / scale); // P(Exp(mean=scale) > epsilon)
		expect(empirical).toBeCloseTo(analytical, 1);
	});

	it('decreases as epsilon increases, for a fixed sample', () => {
		const samples = simulateRiskTrials(30, 5000, 0, model, 4);
		const small = exceedanceProbability(samples, 0, 0.05);
		const large = exceedanceProbability(samples, 0, 0.5);
		expect(large).toBeLessThan(small);
	});

	it('returns 0 for an empty sample', () => {
		expect(exceedanceProbability([], 0, 0.1)).toBe(0);
	});
});

describe('meanSquaredExcessRisk', () => {
	it('matches the analytical Exponential second moment (2*scale^2) for a large batch', () => {
		const n = 25;
		const bayesRisk = 0;
		const samples = simulateRiskTrials(n, 50000, bayesRisk, model, 17);
		const empirical = meanSquaredExcessRisk(samples, bayesRisk);
		const scale = excessRiskScale(n, model);
		expect(empirical).toBeCloseTo(2 * scale * scale, 1);
	});

	it('returns 0 for an empty sample', () => {
		expect(meanSquaredExcessRisk([], 0)).toBe(0);
	});
});

describe('checkStoneConditions', () => {
	const nGrid = [10, 100, 1000, 10000, 100000];

	it('accepts k(n) = sqrt(n)', () => {
		const result = checkStoneConditions(nGrid, (n) => Math.sqrt(n));
		expect(result.kGrowsToInfinity).toBe(true);
		expect(result.kOverNShrinksToZero).toBe(true);
		expect(result.satisfiesStone).toBe(true);
	});

	it('rejects a constant k(n) (fails the growth condition)', () => {
		const result = checkStoneConditions(nGrid, () => 5);
		expect(result.kGrowsToInfinity).toBe(false);
		expect(result.satisfiesStone).toBe(false);
	});

	it('rejects k(n) = n (fails the ratio condition — ratio stays at 1)', () => {
		const result = checkStoneConditions(nGrid, (n) => n);
		expect(result.kOverNShrinksToZero).toBe(false);
		expect(result.satisfiesStone).toBe(false);
	});

	it('throws for a grid with fewer than 2 points', () => {
		expect(() => checkStoneConditions([10], (n) => n)).toThrow();
	});
});

describe('knnExcessRisk', () => {
	const knnModel: KnnRiskModel = { varianceConst: 4, biasConst: 1 };

	it('matches the formula V/k + B*(k/n)^p directly', () => {
		expect(knnExcessRisk(100, 10, knnModel)).toBeCloseTo(4 / 10 + 1 * (10 / 100), 10);
	});

	it('throws when k > n, or n/k are non-positive', () => {
		expect(() => knnExcessRisk(10, 20, knnModel)).toThrow();
		expect(() => knnExcessRisk(0, 1, knnModel)).toThrow();
		expect(() => knnExcessRisk(10, 0, knnModel)).toThrow();
	});
});

describe('knnExcessRiskCurve', () => {
	it('returns one entry per k with matching values', () => {
		const knnModel: KnnRiskModel = { varianceConst: 4, biasConst: 1 };
		const kGrid = [1, 2, 5, 10];
		const curve = knnExcessRiskCurve(50, kGrid, knnModel);
		expect(curve.map((p) => p.k)).toEqual(kGrid);
		expect(curve[2].excessRisk).toBeCloseTo(knnExcessRisk(50, 5, knnModel), 10);
	});
});

describe('knnOptimalK', () => {
	it('approximately minimizes knnExcessRisk over a fine grid, for biasExponent=1', () => {
		const knnModel: KnnRiskModel = { varianceConst: 4, biasConst: 1 };
		const n = 200;
		const kStar = knnOptimalK(n, knnModel);
		const riskAtKStar = knnExcessRisk(n, Math.round(kStar), knnModel);
		for (let k = 1; k < n; k++) {
			expect(knnExcessRisk(n, k, knnModel)).toBeGreaterThanOrEqual(riskAtKStar - 1e-6);
		}
	});

	it('matches the closed form sqrt(V*n/B) at biasExponent=1', () => {
		const knnModel: KnnRiskModel = { varianceConst: 4, biasConst: 1 };
		const n = 400;
		expect(knnOptimalK(n, knnModel)).toBeCloseTo(Math.sqrt((4 * n) / 1), 6);
	});

	it('grows with n (tracks Stone-style k(n) -> infty)', () => {
		const knnModel: KnnRiskModel = { varianceConst: 4, biasConst: 1 };
		expect(knnOptimalK(1000, knnModel)).toBeGreaterThan(knnOptimalK(100, knnModel));
	});
});

describe('approximationRisk', () => {
	const bayesRisk = 0.1;
	const aeModel: ApproxEstimModel = {
		approxConst: 0.5,
		approxExponent: 0.7,
		estimConst: 2
	};

	it('decreases toward bayesRisk as complexity grows', () => {
		const low = approximationRisk(1, bayesRisk, aeModel);
		const high = approximationRisk(1000, bayesRisk, aeModel);
		expect(high).toBeGreaterThan(bayesRisk);
		expect(high).toBeLessThan(low);
		expect(high - bayesRisk).toBeLessThan(0.01);
	});

	it('is never below bayesRisk', () => {
		for (const c of [0.5, 1, 10, 100]) {
			expect(approximationRisk(c, bayesRisk, aeModel)).toBeGreaterThanOrEqual(bayesRisk);
		}
	});

	it('throws for non-positive complexity', () => {
		expect(() => approximationRisk(0, bayesRisk, aeModel)).toThrow();
	});
});

describe('learnedRisk', () => {
	const bayesRisk = 0.1;
	const aeModel: ApproxEstimModel = {
		approxConst: 0.5,
		approxExponent: 0.7,
		estimConst: 2
	};

	it('is always >= approximationRisk (estimation gap is non-negative)', () => {
		for (const c of [1, 5, 20]) {
			for (const n of [10, 100, 1000]) {
				expect(learnedRisk(n, c, bayesRisk, aeModel)).toBeGreaterThanOrEqual(
					approximationRisk(c, bayesRisk, aeModel) - 1e-12
				);
			}
		}
	});

	it('decreases toward approximationRisk as n grows, for fixed complexity', () => {
		const c = 5;
		const approx = approximationRisk(c, bayesRisk, aeModel);
		const small = learnedRisk(10, c, bayesRisk, aeModel);
		const large = learnedRisk(100000, c, bayesRisk, aeModel);
		expect(large - approx).toBeLessThan(small - approx);
		expect(large - approx).toBeLessThan(1e-3);
	});

	it('is U-shaped in complexity for fixed n (underfitting vs overfitting)', () => {
		const n = 50;
		const risks = [1, 2, 5, 10, 20, 50, 100].map((c) => learnedRisk(n, c, bayesRisk, aeModel));
		const minIndex = risks.indexOf(Math.min(...risks));
		// The minimum should be interior, not at either endpoint of this grid.
		expect(minIndex).toBeGreaterThan(0);
		expect(minIndex).toBeLessThan(risks.length - 1);
	});
});

describe('approxEstimDecomposition', () => {
	it('splits R(h_n) - R* exactly into approximation + estimation gaps', () => {
		const bayesRisk = 0.1;
		const aeModel: ApproxEstimModel = { approxConst: 0.5, approxExponent: 0.7, estimConst: 2 };
		const d = approxEstimDecomposition(50, 8, bayesRisk, aeModel);
		expect(d.approximationGap + d.estimationGap).toBeCloseTo(d.learnedRisk - bayesRisk, 10);
		expect(d.approximationRisk - bayesRisk).toBeCloseTo(d.approximationGap, 10);
	});
});

describe('approxEstimCurve', () => {
	it('returns one entry per complexity value in the grid', () => {
		const bayesRisk = 0.1;
		const aeModel: ApproxEstimModel = { approxConst: 0.5, approxExponent: 0.7, estimConst: 2 };
		const grid = [1, 2, 5, 10];
		const curve = approxEstimCurve(50, grid, bayesRisk, aeModel);
		expect(curve).toHaveLength(4);
		expect(curve[2].learnedRisk).toBeCloseTo(learnedRisk(50, 5, bayesRisk, aeModel), 10);
	});
});

describe('knn2DEta', () => {
	const knn2DModel: Knn2DModel = { radius: 2, temperature: 0.3 };

	it('equals 1/2 exactly on the boundary circle', () => {
		expect(knn2DEta(2, 0, knn2DModel)).toBeCloseTo(0.5, 10);
		expect(knn2DEta(0, -2, knn2DModel)).toBeCloseTo(0.5, 10);
	});

	it('is high near the origin and low far away', () => {
		expect(knn2DEta(0, 0, knn2DModel)).toBeGreaterThan(0.9);
		expect(knn2DEta(10, 10, knn2DModel)).toBeLessThan(0.01);
	});

	it('throws for non-positive temperature', () => {
		expect(() => knn2DEta(0, 0, { radius: 2, temperature: 0 })).toThrow();
	});
});

describe('generateKnnDataset', () => {
	const knn2DModel: Knn2DModel = { radius: 2, temperature: 0.3 };

	it('is deterministic for a fixed seed', () => {
		const a = generateKnnDataset(100, knn2DModel, 3, 42);
		const b = generateKnnDataset(100, knn2DModel, 3, 42);
		expect(a).toEqual(b);
	});

	it('produces n points within the domain with 0/1 labels', () => {
		const points = generateKnnDataset(50, knn2DModel, 3, 5);
		expect(points).toHaveLength(50);
		for (const p of points) {
			expect(Math.abs(p.x1)).toBeLessThanOrEqual(3);
			expect(Math.abs(p.x2)).toBeLessThanOrEqual(3);
			expect([0, 1]).toContain(p.label);
		}
	});

	it('mostly labels points near the origin as 1 and far points as 0', () => {
		const points = generateKnnDataset(2000, knn2DModel, 4, 9);
		const near = points.filter((p) => Math.sqrt(p.x1 ** 2 + p.x2 ** 2) < 1);
		const far = points.filter((p) => Math.sqrt(p.x1 ** 2 + p.x2 ** 2) > 3.5);
		const nearRate = near.filter((p) => p.label === 1).length / near.length;
		const farRate = far.filter((p) => p.label === 1).length / far.length;
		expect(nearRate).toBeGreaterThan(0.9);
		expect(farRate).toBeLessThan(0.1);
	});
});

describe('kNearestNeighbors', () => {
	const dataset: LabeledPoint2D[] = [
		{ x1: 0, x2: 0, label: 1 },
		{ x1: 1, x2: 0, label: 1 },
		{ x1: 5, x2: 5, label: 0 },
		{ x1: -1, x2: 0, label: 0 }
	];

	it('returns exactly k points, sorted by increasing distance to the query', () => {
		const neighbors = kNearestNeighbors({ x1: 0, x2: 0 }, dataset, 3);
		expect(neighbors).toHaveLength(3);
		expect(neighbors[0]).toEqual(dataset[0]); // distance 0
		expect(neighbors).not.toContainEqual(dataset[2]); // farthest, excluded at k=3
	});

	it('throws for k <= 0 or k > dataset size', () => {
		expect(() => kNearestNeighbors({ x1: 0, x2: 0 }, dataset, 0)).toThrow();
		expect(() => kNearestNeighbors({ x1: 0, x2: 0 }, dataset, 10)).toThrow();
	});
});

describe('knnPredict', () => {
	it('predicts the majority label among the k nearest neighbors', () => {
		const dataset: LabeledPoint2D[] = [
			{ x1: 0, x2: 0, label: 1 },
			{ x1: 0.1, x2: 0, label: 1 },
			{ x1: 0.2, x2: 0, label: 0 },
			{ x1: 10, x2: 10, label: 0 }
		];
		// k=3 nearest to (0,0) are the first three points: labels 1,1,0 -> majority 1
		expect(knnPredict({ x1: 0, x2: 0 }, dataset, 3)).toBe(1);
	});

	it('breaks ties toward 1', () => {
		const dataset: LabeledPoint2D[] = [
			{ x1: 0, x2: 0, label: 1 },
			{ x1: 0.1, x2: 0, label: 0 }
		];
		expect(knnPredict({ x1: 0, x2: 0 }, dataset, 2)).toBe(1);
	});
});

describe('knnDecisionField', () => {
	it('returns gridSize^2 predictions, each 0 or 1', () => {
		const knn2DModel: Knn2DModel = { radius: 2, temperature: 0.3 };
		const dataset = generateKnnDataset(80, knn2DModel, 3, 3);
		const field = knnDecisionField(dataset, 5, 3, 6);
		expect(field).toHaveLength(36);
		for (const cell of field) {
			expect([0, 1]).toContain(cell.predicted);
		}
	});
});
