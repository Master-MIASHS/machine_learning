import { describe, it, expect } from 'vitest';
import {
	buildDecisionStump,
	giniImpurity,
	informationGain,
	permutationImportance
} from '../math/random-forest.js';
import { mulberry32 } from './util.js';

// Note: Random Forests are not part of theorie.typ (which covers
// Théorèmes 1.1–4.2); this module supports Part 4, lesson 2 of the course,
// where Définition 6.2 (impureté de Gini et division optimale), Définition 6.3
// (division optimale restreinte) and Théorème 6.1 (décorrélation) are taught.

describe('giniImpurity', () => {
	it('is zero for a pure node', () => {
		expect(giniImpurity([1, 1, 1])).toBeCloseTo(0, 12);
		expect(giniImpurity([0, 0])).toBeCloseTo(0, 12);
	});

	it('equals 2·p·(1−p) on a known mixture (closed form)', () => {
		// p = 3/4 → 2·(3/4)·(1/4) = 3/8
		expect(giniImpurity([1, 1, 1, 0])).toBeCloseTo(3 / 8, 12);
		// p = 1/2 → 1/2
		expect(giniImpurity([0, 1])).toBeCloseTo(0.5, 12);
	});

	it('is symmetric in the class proportion (p ↔ 1−p)', () => {
		expect(giniImpurity([1, 1, 1, 0])).toBeCloseTo(giniImpurity([1, 0, 0, 0]), 12);
	});

	it('never exceeds 1/2 for binary labels', () => {
		for (const labels of [
			[0, 1, 1, 1, 0, 0],
			[1, 0, 1, 1, 1, 0, 0, 0],
			[1, 1, 0]
		]) {
			expect(giniImpurity(labels)).toBeLessThanOrEqual(0.5 + 1e-12);
		}
	});

	it('returns 0 for the empty node (documented convention)', () => {
		expect(giniImpurity([])).toBe(0);
	});
});

describe('buildDecisionStump (classification)', () => {
	it('finds the unique zero-cost split on perfectly separable 1D data', () => {
		const X = [
			[0],
			[1],
			[2]
		];
		const y = [0, 0, 1];
		const stump = buildDecisionStump(X, y, undefined, true);
		// t = 1.5 isolates the single class-1 point; t = 0.5 leaves an impure right node.
		expect(stump.featureIdx).toBe(0);
		expect(stump.threshold).toBeCloseTo(1.5, 12);
		expect(stump.leftValue).toBeCloseTo(0, 12);
		expect(stump.rightValue).toBeCloseTo(1, 12);
	});

	it('returns the Gini-minimizing threshold on a non-separable case (closed form)', () => {
		const X = [
			[0],
			[1],
			[2],
			[3]
		];
		const y = [0, 1, 0, 1];
		const stump = buildDecisionStump(X, y, undefined, true);
		// Weighted Gini: t=0.5 → 4/3, t=1.5 → 2, t=2.5 → 4/3.
		expect(stump.threshold).toBeCloseTo(0.5, 12);
		expect(stump.leftValue).toBeCloseTo(0, 12);
		expect(stump.rightValue).toBeCloseTo(2 / 3, 12);

		// Invariant: the chosen split's weighted Gini is the minimum over all
		// candidate midpoints, recomputed independently here.
		const vals = [...new Set(X.map((r) => r[0]))].sort((a, b) => a - b);
		let minCost = Infinity;
		for (let t = 0; t < vals.length - 1; t++) {
			const thr = (vals[t] + vals[t + 1]) / 2;
			const left = y.filter((_, i) => X[i][0] <= thr);
			const right = y.filter((_, i) => X[i][0] > thr);
			minCost = Math.min(minCost, giniImpurity(left) * left.length + giniImpurity(right) * right.length);
		}
		const chosenLeft = y.filter((_, i) => X[i][0] <= stump.threshold);
		const chosenRight = y.filter((_, i) => X[i][0] > stump.threshold);
		const chosenCost =
			giniImpurity(chosenLeft) * chosenLeft.length + giniImpurity(chosenRight) * chosenRight.length;
		expect(chosenCost).toBeCloseTo(minCost, 12);
		expect(chosenCost).toBeCloseTo(4 / 3, 12);
	});

	it('prefers the informative feature when several are available', () => {
		// Feature 0 carries the signal; feature 1 is constant.
		const X = [
			[0, 7],
			[1, 7],
			[2, 7],
			[3, 7]
		];
		const y = [0, 1, 0, 1];
		const stump = buildDecisionStump(X, y, undefined, true);
		expect(stump.featureIdx).toBe(0);
		expect(stump.threshold).toBeCloseTo(0.5, 12);
	});

	it('respects the random feature subset (Définition 6.3)', () => {
		const X = [
			[0, 0],
			[1, 1],
			[2, 2]
		];
		const y = [0, 0, 1];
		const stump = buildDecisionStump(X, y, [1], true);
		expect(stump.featureIdx).toBe(1);
		expect(stump.threshold).toBeCloseTo(1.5, 12);
		expect(stump.leftValue).toBeCloseTo(0, 12);
		expect(stump.rightValue).toBeCloseTo(1, 12);
	});

	it('falls back to the constant mean stump when a feature has a single unique value', () => {
		const X = [
			[5],
			[5],
			[5]
		];
		const y = [0, 1, 1];
		const stump = buildDecisionStump(X, y, undefined, true);
		expect(stump.featureIdx).toBe(0);
		expect(stump.threshold).toBe(0);
		expect(stump.leftValue).toBeCloseTo(2 / 3, 12);
		expect(stump.rightValue).toBeCloseTo(2 / 3, 12);
	});
});

describe('buildDecisionStump (regression)', () => {
	it('matches the hand-computed MSE-optimal split on 1D data', () => {
		const X = [
			[0],
			[1],
			[2],
			[3]
		];
		const y = [0, 1, 2, 3];
		const stump = buildDecisionStump(X, y, undefined, false);
		// MSE cost: t=0.5 → 2, t=1.5 → 1, t=2.5 → 2.
		expect(stump.threshold).toBeCloseTo(1.5, 12);
		expect(stump.leftValue).toBeCloseTo(0.5, 12);
		expect(stump.rightValue).toBeCloseTo(2.5, 12);
	});

	it('leaf values are the mean of the training labels on each side (round-trip)', () => {
		const X = [
			[0],
			[2]
		];
		const y = [3, 7];
		const stump = buildDecisionStump(X, y, undefined, false);
		expect(stump.threshold).toBeCloseTo(1, 12);
		expect(stump.leftValue).toBeCloseTo(3, 12);
		expect(stump.rightValue).toBeCloseTo(7, 12);
	});
});

describe('informationGain', () => {
	it('equals the parent entropy when both children are pure (closed form)', () => {
		// H([0,1]) = 1, children pure → IG = 1.
		expect(informationGain([0, 1], [0], [1])).toBeCloseTo(1, 12);
	});

	it('is zero for an uninformative split', () => {
		expect(informationGain([0, 1, 0, 1], [0, 1], [0, 1])).toBeCloseTo(0, 12);
	});

	it('is clamped at 0 when the split increases impurity', () => {
		// Parent H ≈ 0.811, weighted children H = 1 → raw gain ≈ −0.189.
		const ig = informationGain([0, 0, 0, 1], [0, 1], [0, 1]);
		expect(ig).toBe(0);
	});

	it('returns 0 for an empty parent', () => {
		expect(informationGain([], [], [])).toBe(0);
	});
});

describe('permutationImportance', () => {
	it('attributes no importance to a feature the model ignores', () => {
		const X = [
			[1, 9],
			[2, 8],
			[3, 7],
			[4, 6]
		];
		const y = [1, 2, 3, 4]; // y equals column 0
		const predict = (rows: number[][]) => rows.map((r) => r[0]);
		const importance = permutationImportance(predict, X, y, 10, 42);
		expect(importance.length).toBe(2);
		// Permuting column 1 leaves every prediction unchanged.
		expect(importance[1]).toBe(0);
		// Permuting column 0 degrades the (perfect) predictions.
		expect(importance[0]).toBeGreaterThan(importance[1]);
	});
});

describe('buildDecisionStump — giniDecrease', () => {
	it('matches the hand-computed normalized Gini decrease (closed form, classification)', () => {
		const X = [
			[0],
			[1],
			[2],
			[3]
		];
		const y = [0, 1, 0, 1];
		const stump = buildDecisionStump(X, y, undefined, true);
		// Parent Gini = 1/2 → parentCost = 4·(1/2) = 2. Best split t=0.5 has
		// weighted child Gini 4/3 → giniDecrease = (2 − 4/3)/4 = 1/6.
		expect(stump.threshold).toBeCloseTo(0.5, 12);
		expect(stump.giniDecrease).toBeCloseTo(1 / 6, 12);
	});

	it('matches the hand-computed normalized MSE decrease (closed form, regression)', () => {
		const X = [
			[0],
			[1],
			[2],
			[3]
		];
		const y = [0, 1, 2, 3];
		const stump = buildDecisionStump(X, y, undefined, false);
		// ȳ = 3/2 → parentCost = Σ(y−ȳ)² = 5. Best split t=1.5 has cost 1 →
		// giniDecrease = (5 − 1)/4 = 1.
		expect(stump.threshold).toBeCloseTo(1.5, 12);
		expect(stump.giniDecrease).toBeCloseTo(1, 12);
	});

	it('is zero for the fallback stump (no candidate split available)', () => {
		const X = [
			[5],
			[5],
			[5]
		];
		const y = [0, 1, 1];
		const stump = buildDecisionStump(X, y, undefined, true);
		expect(stump.giniDecrease).toBe(0);
	});

	it('never exceeds the parent impurity and stays non-negative (invariant, seeded random data)', () => {
		for (const seed of [1, 7, 42, 1234]) {
			const rng = mulberry32(seed);
			const randn = () => {
				let u = rng();
				while (u === 0) u = rng();
				return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
			};
			const n = 60;
			const X = Array.from({ length: n }, () => [randn()]);
			const y = Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1));
			const stump = buildDecisionStump(X, y, undefined, true);
			const parentGini = giniImpurity(y);
			expect(stump.giniDecrease).toBeGreaterThanOrEqual(0);
			expect(stump.giniDecrease).toBeLessThanOrEqual(parentGini + 1e-12);
		}
	});
});

describe('impurity-based feature importance (sanity, mirrors FeatureImportanceChart)', () => {
	// Same pipeline as the demo: 350 samples (200 train + 150 test) are drawn,
	// the first 200 are used for training; k informative Gaussian features
	// drive a logistic label; bootstrap stumps restricted to m = √d random
	// features. The top feature for the summed Gini decrease must be one of
	// the k truly informative ones (the demo's own "top feature correct"
	// metric). The signal is deliberately modest (weights 1.0−0.2i give a
	// score with std ≈ √2, Bayes accuracy ≈ 0.62), so we do not require the
	// strongest feature x0 to win specifically.
	function runForestImportance(k: number, dataSeed: number, numTrees: number): number[] {
		const d = 8;
		const nTotal = 350;
		const nTrain = 200;
		const rng = mulberry32(dataSeed * 7919 + 42);
		// Mirrors the demo's randn exactly (u1 and u2 drawn up front, then the
		// zero-retry on u1) so the random stream is identical.
		const randn = () => {
			let u1 = rng();
			const u2 = rng();
			while (u1 === 0) u1 = rng();
			return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
		};
		const XAll = Array.from({ length: nTotal }, () => Array.from({ length: d }, () => randn()));
		const weights = Array.from({ length: k }, (_, i) => 1.0 - i * 0.2);
		const yAll = XAll.map((row) => {
			let score = 0;
			for (let f = 0; f < k; f++) score += weights[f] * row[f];
			return rng() < 1 / (1 + Math.exp(-score)) ? 1 : 0;
		});
		const X = XAll.slice(0, nTrain);
		const y = yAll.slice(0, nTrain);
		const n = nTrain;

		const scores = new Array(d).fill(0);
		const m = Math.max(1, Math.round(Math.sqrt(d)));
		for (let t = 0; t < numTrees; t++) {
			const treeRng = mulberry32(t * 1301 + dataSeed * 97);
			const bootX: number[][] = [];
			const bootY: number[] = [];
			for (let i = 0; i < n; i++) {
				const idx = Math.floor(treeRng() * n);
				bootX.push(X[idx]);
				bootY.push(y[idx]);
			}
			const allFeatures = Array.from({ length: d }, (_, i) => i);
			for (let i = allFeatures.length - 1; i > 0; i--) {
				const j = Math.floor(treeRng() * (i + 1));
				[allFeatures[i], allFeatures[j]] = [allFeatures[j], allFeatures[i]];
			}
			const stump = buildDecisionStump(bootX, bootY, allFeatures.slice(0, m), true);
			scores[stump.featureIdx] += stump.giniDecrease;
		}
		return scores;
	}

	it('ranks a truly informative feature first (demo default: seed 0, k=3, 40 trees)', () => {
		const scores = runForestImportance(3, 0, 40);
		let top = 0;
		for (let i = 1; i < scores.length; i++) if (scores[i] > scores[top]) top = i;
		expect(top).toBeLessThan(3);
	});

	it('the top feature is informative across several seeds (100 trees)', () => {
		for (const dataSeed of [0, 1, 2, 3, 4]) {
			const scores = runForestImportance(3, dataSeed, 100);
			let top = 0;
			for (let i = 1; i < scores.length; i++) if (scores[i] > scores[top]) top = i;
			expect(top).toBeLessThan(3);
		}
	});
});
