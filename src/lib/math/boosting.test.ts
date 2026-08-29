import { describe, expect, it } from 'vitest';
import {
	adaboostPredict,
	adaboostStep,
	computeAlpha,
	computeMarginsPerStep,
	createAdaBoostState,
	evaluateAdaboostBoundary,
	exponentialLoss,
	exponentialLossDerivative,
	fitRegressionStump,
	gradientBoostingStep,
	logisticLoss,
	logisticLossDerivative,
	predictRegressionStump,
	runAdaBoost,
	runAdaBoostWithHistory,
	runGradientBoostingWithHistory,
	updateWeights
} from './boosting';

describe('computeAlpha', () => {
	it('is 0.5 · ln((1−ε) / ε)', () => {
		expect(computeAlpha(0.3)).toBeCloseTo(0.5 * Math.log(0.7 / 0.3), 12);
		expect(computeAlpha(0.1)).toBeCloseTo(0.5 * Math.log(0.9 / 0.1), 12);
	});

	it('vanishes at chance level and keeps the right sign', () => {
		expect(computeAlpha(0.5)).toBe(0);
		expect(computeAlpha(0.3)).toBeGreaterThan(0);
		expect(computeAlpha(0.7)).toBeLessThan(0);
	});

	it('is decreasing in the error and finite at the clamped boundaries', () => {
		expect(computeAlpha(0.1)).toBeGreaterThan(computeAlpha(0.3));
		expect(computeAlpha(0.3)).toBeGreaterThan(computeAlpha(0.4));
		expect(computeAlpha(0)).toBeGreaterThan(0);
		expect(Number.isFinite(computeAlpha(0))).toBe(true);
		expect(computeAlpha(1)).toBeLessThan(0);
		expect(Number.isFinite(computeAlpha(1))).toBe(true);
	});
});

describe('exponentialLoss', () => {
	it('closed forms and monotonicity', () => {
		expect(exponentialLoss(0)).toBe(1);
		expect(exponentialLoss(Math.log(2))).toBeCloseTo(0.5, 12);
		expect(exponentialLoss(1)).toBeCloseTo(1 / Math.E, 12);
		expect(exponentialLoss(0)).toBeGreaterThan(exponentialLoss(0.5));
		expect(exponentialLoss(0.5)).toBeGreaterThan(exponentialLoss(1));
	});
});

describe('logisticLoss', () => {
	it('closed forms', () => {
		expect(logisticLoss(0)).toBeCloseTo(Math.log(2), 12);
		expect(logisticLoss(1)).toBeCloseTo(Math.log(1 + Math.exp(-1)), 12);
	});

	it('stable clamps for extreme margins', () => {
		expect(logisticLoss(21)).toBe(0);
		expect(logisticLoss(-21)).toBe(21);
	});

	it('satisfies L(−m) − L(m) = m', () => {
		for (const m of [0, 0.7, 3.1, 10, 15]) {
			expect(logisticLoss(-m) - logisticLoss(m)).toBeCloseTo(m, 8);
		}
	});
});

/** Central difference of F ↦ loss(y·F), the chain-rule derivative the helpers must return. */
function fdLossDeriv(y: number, F: number, loss: (margin: number) => number): number {
	const h = 1e-6;
	return (loss(y * (F + h)) - loss(y * (F - h))) / (2 * h);
}

describe('loss derivatives', () => {
	const points: Array<[number, number]> = [
		[1, 0.3],
		[1, -0.8],
		[-1, 0.4]
	];

	it('logisticLossDerivative matches finite differences', () => {
		for (const [y, F] of points) {
			expect(logisticLossDerivative(y, F)).toBeCloseTo(fdLossDeriv(y, F, logisticLoss), 6);
		}
	});

	it('exponentialLossDerivative matches finite differences', () => {
		for (const [y, F] of points) {
			expect(exponentialLossDerivative(y, F)).toBeCloseTo(fdLossDeriv(y, F, exponentialLoss), 6);
		}
	});

	it('closed forms at F = 0', () => {
		expect(logisticLossDerivative(1, 0)).toBeCloseTo(-0.5, 12);
		expect(logisticLossDerivative(-1, 0)).toBeCloseTo(0.5, 12);
		expect(exponentialLossDerivative(1, 0)).toBeCloseTo(-1, 12);
		expect(exponentialLossDerivative(-1, 0)).toBeCloseTo(1, 12);
	});
});

describe('createAdaBoostState', () => {
	it('starts with uniform weights and no models', () => {
		const state = createAdaBoostState(7);
		expect(state.weights).toHaveLength(7);
		for (const w of state.weights) expect(w).toBe(1 / 7);
		expect(state.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
		expect(state.models).toEqual([]);
		expect(state.errors).toEqual([]);
	});
});

describe('adaboostStep', () => {
	it('hand-computed best stump and alpha', () => {
		// One feature: three 0s (label +1) and two 1s (labels −1, +1).
		const X = [
			[0],
			[0],
			[0],
			[1],
			[1]
		];
		const y = [1, 1, 1, -1, 1];
		const { stump, weightedError, alpha } = adaboostStep(createAdaBoostState(5).weights, X, y);
		// x ≤ 0.5 → +1, x > 0.5 → −1 misclassifies only the last point: error 1/5
		expect(weightedError).toBeCloseTo(0.2, 12);
		expect(alpha).toBeCloseTo(0.5 * Math.log(4), 10);
		expect(stump).toEqual({ featureIdx: 0, threshold: 0.5, leftValue: 1, rightValue: -1 });
	});

	it('perfectly separable data: clamped error, large alpha, correct stump', () => {
		const X = [
			[0],
			[1],
			[2],
			[3]
		];
		const y = [-1, -1, 1, 1];
		const { stump, weightedError, alpha } = adaboostStep(createAdaBoostState(4).weights, X, y);
		expect(weightedError).toBe(1e-10);
		expect(alpha).toBeCloseTo(0.5 * Math.log((1 - 1e-10) / 1e-10), 6);
		for (let i = 0; i < 4; i++) {
			const pred = X[i][0] <= stump.threshold ? stump.leftValue : stump.rightValue;
			expect(pred).toBe(y[i]);
		}
	});

	it('always reports an error in (0, 1) with a finite alpha', () => {
		const X = [
			[0],
			[1],
			[0],
			[1],
			[1]
		];
		const y = [1, -1, 1, -1, 1];
		const { weightedError, alpha } = adaboostStep(createAdaBoostState(5).weights, X, y);
		expect(weightedError).toBeGreaterThan(0);
		expect(weightedError).toBeLessThan(1);
		expect(Number.isFinite(alpha)).toBe(true);
	});
});

describe('updateWeights', () => {
	it('hand-computed rescaling', () => {
		// w = [0.5, 0.5], α = ln 2: point 0 correct (× e^{−ln2} = ½), point 1 wrong (× 2)
		// → Z = 1.25, new = [0.2, 0.8]
		const { newWeights, Z } = updateWeights([0.5, 0.5], Math.LN2, [1, -1], [1, 1]);
		expect(Z).toBeCloseTo(1.25, 12);
		expect(newWeights[0]).toBeCloseTo(0.2, 12);
		expect(newWeights[1]).toBeCloseTo(0.8, 12);
	});

	it('returns a normalized weight vector', () => {
		const { newWeights } = updateWeights([0.3, 0.3, 0.4], 0.7, [1, 1, -1], [1, -1, -1]);
		expect(newWeights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
		for (const w of newWeights) expect(w).toBeGreaterThan(0);
	});

	it('alpha = 0 leaves the weights unchanged', () => {
		const w = [0.3, 0.3, 0.4];
		const { newWeights } = updateWeights([...w], 0, [1, -1, 1], [1, 1, -1]);
		for (let i = 0; i < w.length; i++) expect(newWeights[i]).toBeCloseTo(w[i], 14);
	});

	it('up-weights misclassified points and down-weights correct ones', () => {
		const { newWeights } = updateWeights([0.25, 0.25, 0.25, 0.25], 1, [1, 1, -1, -1], [1, 1, 1, -1]);
		expect(newWeights[0]).toBeLessThan(0.25);
		expect(newWeights[2]).toBeGreaterThan(0.25);
	});
});

describe('adaboostPredict', () => {
	it('single stump: sign of the weighted margin', () => {
		const models = [
			{ stump: { featureIdx: 0, threshold: 0.5, leftValue: 1, rightValue: -1 }, alpha: 1 }
		];
		expect(adaboostPredict(models, [0.2, 9])).toBe(1);
		expect(adaboostPredict(models, [0.8, 9])).toBe(-1);
	});

	it('accumulates weighted votes across models', () => {
		const models = [
			{ stump: { featureIdx: 0, threshold: 0.5, leftValue: 1, rightValue: -1 }, alpha: 0.6 },
			{ stump: { featureIdx: 0, threshold: 0.5, leftValue: 1, rightValue: -1 }, alpha: 0.7 }
		];
		expect(adaboostPredict(models, [0, 0])).toBe(1); // margin 1.3
		expect(adaboostPredict(models, [9, 0])).toBe(-1); // margin −1.3
	});
});

describe('runAdaBoost', () => {
	const X = [
		[0, 0.5],
		[0, 0.2],
		[1, 0.8],
		[1, 0.1]
	];
	const y = [-1, -1, 1, 1];

	it('is deterministic', () => {
		const a = runAdaBoost(X, y, 10);
		const b = runAdaBoost(X, y, 10);
		expect(a.models).toEqual(b.models);
		expect(a.weights).toEqual(b.weights);
		expect(a.errors).toEqual(b.errors);
	});

	it('reaches zero training error on separable data', () => {
		const state = runAdaBoost(X, y, 10);
		for (let i = 0; i < X.length; i++) {
			expect(adaboostPredict(state.models, X[i])).toBe(y[i]);
		}
	});

	it('keeps the weights valid', () => {
		const state = runAdaBoost(X, y, 10);
		expect(state.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
		for (const w of state.weights) expect(w).toBeGreaterThanOrEqual(0);
	});
});

describe('runAdaBoostWithHistory', () => {
	const X = [
		[0, 0.5],
		[0, 0.2],
		[1, 0.8],
		[1, 0.1]
	];
	const y = [-1, -1, 1, 1];

	it('records a consistent history on separable data', () => {
		const h = runAdaBoostWithHistory(X, y, 10);
		for (const w of h.weightsPerStep[0]) expect(w).toBe(0.25);
		expect(h.weightsPerStep.length).toBe(h.cumulativeErrors.length + 1);
		expect(h.models.length).toBe(h.errors.length);
		expect(h.models.length).toBe(h.alphas.length);
		for (const row of h.weightsPerStep) {
			expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
		}
		expect(h.cumulativeErrors[h.cumulativeErrors.length - 1]).toBe(0);
	});

	it('recorded weights match an independent re-application of the update rule', () => {
		// Six 1-D points where the per-round training error does not decrease
		// monotonically (the best stump keeps trading two points off against a
		// third), so the recorded state is checked against the documented update
		// rule wᵢ ← wᵢ·exp(−α·yᵢ·h(xᵢ)) / Z instead of against a monotonicity claim.
		const X6 = [
			[0],
			[1],
			[2],
			[3],
			[4],
			[5]
		];
		const y6 = [-1, -1, 1, 1, 1, -1];
		const h = runAdaBoostWithHistory(X6, y6, 8);
		const h2 = runAdaBoostWithHistory(X6, y6, 8);
		expect(h.weightsPerStep).toEqual(h2.weightsPerStep);
		expect(h.models).toEqual(h2.models);

		const updates = h.weightsPerStep.length - 1;
		for (let t = 0; t < updates; t++) {
			const { stump, alpha } = h.models[t];
			const w = h.weightsPerStep[t];
			let Z = 0;
			const scaled = w.map((wi, i) => {
				const pred = X6[i][0] <= stump.threshold ? stump.leftValue : stump.rightValue;
				const s = wi * Math.exp(-alpha * y6[i] * pred);
				Z += s;
				return s;
			});
			for (let i = 0; i < w.length; i++) {
				expect(h.weightsPerStep[t + 1][i]).toBeCloseTo(scaled[i] / Z, 10);
			}
		}
	});
});

describe('computeMarginsPerStep', () => {
	it('margin is α · y · h for a single model', () => {
		const models = [
			[{ stump: { featureIdx: 0, threshold: 0.5, leftValue: 1, rightValue: -1 }, alpha: 0.4 }]
		];
		const X = [
			[0],
			[1]
		];
		const y = [1, -1];
		const margins = computeMarginsPerStep(models, X, y);
		expect(margins[0][0]).toBeCloseTo(0.4, 12); // 0.4 · 1 · (+1)
		expect(margins[0][1]).toBeCloseTo(0.4, 12); // 0.4 · (−1) · (−1)
	});

	it('accumulates across steps', () => {
		const h1 = { stump: { featureIdx: 0, threshold: 0.5, leftValue: 1, rightValue: -1 }, alpha: 0.4 };
		const h2 = { stump: { featureIdx: 1, threshold: 0.3, leftValue: -1, rightValue: 1 }, alpha: 0.9 };
		const X = [
			[0.2, 0.1],
			[0.8, 0.7],
			[0.5, 0.5]
		];
		const y = [1, -1, 1];
		const margins = computeMarginsPerStep([[h1], [h1, h2]], X, y);
		expect(margins[1][0]).toBeCloseTo(0.4 * 1 * 1 + 0.9 * 1 * -1, 12);
		expect(margins[1][1]).toBeCloseTo(0.4 * -1 * -1 + 0.9 * -1 * 1, 12);
		expect(margins[1][2]).toBeCloseTo(0.4 * 1 * 1 + 0.9 * 1 * 1, 12);
	});
});

describe('evaluateAdaboostBoundary', () => {
	it('grid predictions equal the sign of the grid margins', () => {
		const models = [
			{ stump: { featureIdx: 0, threshold: 0, leftValue: 1, rightValue: -1 }, alpha: 1 }
		];
		const { predictions, margins } = evaluateAdaboostBoundary(models, [-1, 1], [-1, 1], 9);
		expect(predictions).toHaveLength(10);
		for (const row of predictions) expect(row).toHaveLength(10);
		for (let j = 0; j < 10; j++) {
			for (let i = 0; i < 10; i++) {
				expect(predictions[j][i]).toBe(Math.sign(margins[j][i]));
				expect(predictions[j][i]).toBeGreaterThanOrEqual(-1);
				expect(predictions[j][i]).toBeLessThanOrEqual(1);
			}
		}
		// x = −1 + 2i/9: the boundary x = 0 lies between i = 4 (−1/9) and i = 5 (+1/9)
		expect(predictions[0][4]).toBe(1);
		expect(predictions[0][5]).toBe(-1);
	});

	it('no models: zero margin and zero prediction everywhere', () => {
		const { predictions, margins } = evaluateAdaboostBoundary([], [-1, 1], [-1, 1], 4);
		for (const row of predictions) {
			for (const p of row) expect(p).toBe(0);
		}
		for (const row of margins) {
			for (const m of row) expect(m).toBe(0);
		}
	});
});

describe('fitRegressionStump', () => {
	it('hand-computed best split', () => {
		// x = 0..3, r = [0, 1, 0, 2]:
		//  t = 0.5 → (0 | 1, 0, 2), MSE 2 ; t = 1.5 → (0, 1 | 0, 2), MSE 2.5 ; t = 2.5 → (0, 1, 0 | 2), MSE 2/3
		const stump = fitRegressionStump([0, 1, 2, 3], [0, 1, 0, 2]);
		expect(stump.threshold).toBe(2.5);
		expect(stump.leftValue).toBeCloseTo(1 / 3, 12);
		expect(stump.rightValue).toBe(2);
	});

	it('constant x falls back to the overall mean', () => {
		const stump = fitRegressionStump([5, 5, 5], [1, 2, 3]);
		expect(stump.leftValue).toBe(2);
		expect(stump.rightValue).toBe(2);
	});
});

describe('predictRegressionStump', () => {
	it('the threshold belongs to the left side', () => {
		const stump = { threshold: 1.5, leftValue: 0.5, rightValue: 2 };
		expect(predictRegressionStump(stump, 1.5)).toBe(0.5);
		expect(predictRegressionStump(stump, 1.4)).toBe(0.5);
		expect(predictRegressionStump(stump, 1.6)).toBe(2);
	});
});

describe('gradientBoostingStep', () => {
	it('newF = F + lr · h with an identity base learner', () => {
		const { predictions, newF } = gradientBoostingStep(
			[0, 1],
			[1, 2],
			(yTrue, fPred) => -2 * (yTrue - fPred), // ∇_F of ½(F−y)², up to the ½
			(residuals) => (xIdx) => residuals[xIdx],
			0.1
		);
		expect(predictions).toEqual([2, 2]);
		expect(newF[0]).toBeCloseTo(0.2, 12);
		expect(newF[1]).toBeCloseTo(1.2, 12);
	});
});

describe('runGradientBoostingWithHistory', () => {
	it('is deterministic', () => {
		const a = runGradientBoostingWithHistory([0, 1, 2], [0.2, 1.5, 0.7], 5);
		const b = runGradientBoostingWithHistory([0, 1, 2], [0.2, 1.5, 0.7], 5);
		expect(a.stumps).toEqual(b.stumps);
		expect(a.FAtEachStep).toEqual(b.FAtEachStep);
	});

	it('starts at the mean of y', () => {
		const h = runGradientBoostingWithHistory([0, 1, 2], [0.2, 1.5, 0.7], 3);
		for (const f of h.FAtEachStep[0]) {
			expect(f).toBeCloseTo((0.2 + 1.5 + 0.7) / 3, 12);
		}
	});

	it('records residuals y − F and updates F by lr · stump', () => {
		const x = [0, 0.5, 1, 1.5, 2];
		const y = [1, 0.3, 0.8, 0.2, 0.9];
		const h = runGradientBoostingWithHistory(x, y, 6, 0.25);
		expect(h.residualsAtEachStep.length).toBe(6);
		expect(h.FAtEachStep.length).toBe(7);
		for (let t = 0; t < 6; t++) {
			for (let i = 0; i < x.length; i++) {
				expect(h.residualsAtEachStep[t][i]).toBeCloseTo(y[i] - h.FAtEachStep[t][i], 12);
				const expected = h.FAtEachStep[t][i] + 0.25 * predictRegressionStump(h.stumps[t], x[i]);
				expect(h.FAtEachStep[t + 1][i]).toBeCloseTo(expected, 12);
			}
		}
	});

	it('constant data stays constant', () => {
		const h = runGradientBoostingWithHistory([0, 1, 2], [3, 3, 3], 5);
		for (const row of h.FAtEachStep) {
			for (const f of row) expect(f).toBeCloseTo(3, 12);
		}
	});

	it('reduces the training MSE over the runs', () => {
		const x = [0, 0.3, 0.7, 1];
		const y = [0.1, 0.9, 0.2, 0.8];
		const h = runGradientBoostingWithHistory(x, y, 30, 0.3);
		const mse = (F: number[]) => F.reduce((s, f, i) => s + (f - y[i]) ** 2, 0) / F.length;
		expect(mse(h.FAtEachStep[h.FAtEachStep.length - 1])).toBeLessThan(mse(h.FAtEachStep[0]));
	});
});
