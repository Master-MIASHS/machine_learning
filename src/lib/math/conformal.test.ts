import { describe, it, expect } from 'vitest';
import {
	conformityScoreRank,
	conformityScore1MinusProba,
	conformityScoreCumulative,
	computeQuantileThreshold,
	conformalPredictionSet
} from './conformal';

describe('conformityScoreCumulative', () => {
	// s(x, y) = 1 − Σ_{j : p̂_j ≥ p̂_y} p̂_j  (set_valued.typ, « Scores de
	// conformité probabilistes ») — all ties included.

	it('includes every tied class in the sum (plan-required tied case)', () => {
		// [0.4, 0.3, 0.3], true label 1: classes ≥ 0.3 are all three → 1 − 1.0 = 0.
		expect(conformityScoreCumulative([0.4, 0.3, 0.3], 1)).toBeCloseTo(0);
		// same vector, true label 2: identical set of classes ≥ 0.3.
		expect(conformityScoreCumulative([0.4, 0.3, 0.3], 2)).toBeCloseTo(0);
		// [0.3, 0.4, 0.3], true label 0: the tied class 2 comes AFTER label 0 in
		// index order; the old "stop at first tie" behavior would give 1 − 0.7 = 0.3.
		expect(conformityScoreCumulative([0.3, 0.4, 0.3], 0)).toBeCloseTo(0);
	});

	it('ties at the top probability are all included', () => {
		// [0.5, 0.5, 0]: true label 0 → classes ≥ 0.5 are {0, 1} → 1 − 1.0 = 0.
		expect(conformityScoreCumulative([0.5, 0.5, 0], 0)).toBeCloseTo(0);
		expect(conformityScoreCumulative([0.5, 0.5, 0], 1)).toBeCloseTo(0);
	});

	it('no-tie cases match the hand-computed values', () => {
		// [0.5, 0.3, 0.2], label 1 → 1 − (0.5 + 0.3) = 0.2.
		expect(conformityScoreCumulative([0.5, 0.3, 0.2], 1)).toBeCloseTo(0.2);
		// label 0 (the argmax) → 1 − 0.5 = 0.5.
		expect(conformityScoreCumulative([0.5, 0.3, 0.2], 0)).toBeCloseTo(0.5);
		// label 2 (the least probable) → 1 − 1.0 = 0.
		expect(conformityScoreCumulative([0.5, 0.3, 0.2], 2)).toBeCloseTo(0);
		// [0.6, 0.25, 0.15], label 1 → 1 − 0.85 = 0.15.
		expect(conformityScoreCumulative([0.6, 0.25, 0.15], 1)).toBeCloseTo(0.15);
	});

	it('stays in [0, 1] on simplex inputs', () => {
		const vectors: Array<[number[], number]> = [
			[[0.4, 0.3, 0.3], 1],
			[[0.5, 0.5, 0], 0],
			[[1, 0, 0, 0], 0],
			[[0.25, 0.25, 0.25, 0.25], 3],
			[[0.9, 0.05, 0.05], 2]
		];
		for (const [probas, label] of vectors) {
			const s = conformityScoreCumulative(probas, label);
			expect(s).toBeGreaterThanOrEqual(-1e-12);
			expect(s).toBeLessThanOrEqual(1);
		}
	});

	it('coincides with the top-r accumulation form on tie-free vectors', () => {
		// On a tie-free vector, {j : p_j ≥ p_y} is exactly the top-r classes in
		// descending order (r = rank of y), so both definitions must agree.
		const rankCumulative = (probas: number[], trueLabel: number): number => {
			const indices = probas.map((_, i) => i);
			indices.sort((a, b) => probas[b] - probas[a] || a - b);
			let sum = 0;
			for (let r = 0; r < indices.length; r++) {
				sum += probas[indices[r]];
				if (indices[r] === trueLabel) return 1 - sum;
			}
			return 0;
		};
		const tieFreeVectors: number[][] = [
			[0.7, 0.2, 0.1],
			[0.6, 0.25, 0.15],
			[0.05, 0.09, 0.11, 0.13, 0.17, 0.21, 0.24],
			[0.33, 0.21, 0.19, 0.27]
		];
		for (const probas of tieFreeVectors) {
			for (let label = 0; label < probas.length; label++) {
				expect(conformityScoreCumulative(probas, label)).toBeCloseTo(
					rankCumulative(probas, label),
					10
				);
			}
		}
	});
});

describe('conformityScoreRank', () => {
	it('returns the 1-indexed rank in descending probability order', () => {
		expect(conformityScoreRank([0.5, 0.3, 0.2], 0)).toBe(1);
		expect(conformityScoreRank([0.5, 0.3, 0.2], 1)).toBe(2);
		expect(conformityScoreRank([0.5, 0.3, 0.2], 2)).toBe(3);
	});

	it('breaks ties by lower index first (documented convention)', () => {
		expect(conformityScoreRank([0.5, 0.5, 0.1], 0)).toBe(1);
		expect(conformityScoreRank([0.5, 0.5, 0.1], 1)).toBe(2);
	});

	it('matches the worked example of the notes (set_valued.typ, « Exemple pratique »)', () => {
		// proba = [0.1, 0.6, 0.05, 0.2, 0.05] → descending order 1, 3, 0, 2, 4.
		const proba = [0.1, 0.6, 0.05, 0.2, 0.05];
		expect(conformityScoreRank(proba, 1)).toBe(1);
		expect(conformityScoreRank(proba, 3)).toBe(2);
		expect(conformityScoreRank(proba, 0)).toBe(3);
		expect(conformityScoreRank(proba, 2)).toBe(4);
		expect(conformityScoreRank(proba, 4)).toBe(5);
	});
});

describe('conformityScore1MinusProba', () => {
	it('is 1 minus the true label probability', () => {
		expect(conformityScore1MinusProba([0.2, 0.7, 0.1], 1)).toBeCloseTo(0.3);
		expect(conformityScore1MinusProba([0.2, 0.7, 0.1], 0)).toBeCloseTo(0.8);
	});
});

describe('computeQuantileThreshold', () => {
	it('returns the ⌈(n+1)(1−α)⌉-th smallest score', () => {
		// n = 3, α = 0.5 → k = ⌈4 · 0.5⌉ = 2 → sorted[1] = 2.
		expect(computeQuantileThreshold([3, 1, 2], 0.5)).toBe(2);
		// α = 0.25 → k = ⌈4 · 0.75⌉ = 3 → sorted[2] = 3.
		expect(computeQuantileThreshold([3, 1, 2], 0.25)).toBe(3);
	});

	it('returns +∞ when the required rank exceeds n', () => {
		// n = 10, α = 0.01 → k = ⌈11 · 0.99⌉ = 11 > 10.
		const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		expect(computeQuantileThreshold(scores, 0.01)).toBe(Infinity);
	});

	it('returns +∞ on an empty score set', () => {
		expect(computeQuantileThreshold([], 0.1)).toBe(Infinity);
	});
});

describe('conformalPredictionSet', () => {
	it('includes exactly the classes whose score is ≤ q̂ (rank score)', () => {
		// testProba [0.5, 0.3, 0.2] → rank scores 1, 2, 3.
		// α = 0.75, scores [1,1,2,3,4] → k = ⌈6 · 0.25⌉ = 2 → q̂ = sorted[1] = 1 → {0}.
		const strict = conformalPredictionSet([0.5, 0.3, 0.2], [1, 1, 2, 3, 4], 0.75, conformityScoreRank);
		expect(strict.predictionSets).toEqual([[0]]);
		// α = 0.5 → k = ⌈6 · 0.5⌉ = 3 → q̂ = sorted[2] = 2 → {0, 1}.
		const relaxed = conformalPredictionSet([0.5, 0.3, 0.2], [1, 1, 2, 3, 4], 0.5, conformityScoreRank);
		expect(relaxed.predictionSets).toEqual([[0, 1]]);
	});

	it('works with a continuous score function (1 − p̂)', () => {
		// test scores: 1 − [0.5, 0.3, 0.2] = [0.5, 0.7, 0.8].
		// calibration [0.4, 0.5, 0.6, 0.7, 0.8], α = 0.5 → k = 3 → q̂ = 0.6 → only class 0.
		const result = conformalPredictionSet(
			[0.5, 0.3, 0.2],
			[0.4, 0.5, 0.6, 0.7, 0.8],
			0.5,
			conformityScore1MinusProba
		);
		expect(result.predictionSets).toEqual([[0]]);
	});
});
