/**
 * Boosting algorithms: AdaBoost, Gradient Boosting steps.
 */

import type { DecisionStump } from './random-forest.js';

// ─── AdaBoost ──────────────────────────────────────

interface AdaBoostState {
	weights: number[];
	models: Array<{ stump: DecisionStump; alpha: number }>;
	errors: number[];
}

export function createAdaBoostState(n: number): AdaBoostState {
	return {
		weights: new Array(n).fill(1 / n),
		models: [],
		errors: []
	};
}

/** Single AdaBoost step: train stump, compute error and alpha */
export function adaboostStep(
	weights: number[],
	X: number[][],
	y: number[], // labels ∈ {-1, +1}
	featureSubset?: number[]
): { stump: DecisionStump; weightedError: number; alpha: number } {
	const n = X.length;

	// Build decision stump minimizing weighted error
	let bestCost = Infinity;
	let bestStump: DecisionStump | null = null;

	const d = X[0].length;
	const features = featureSubset ?? Array.from({ length: d }, (_, i) => i);

	for (const f of features) {
		const vals = [...new Set(X.map((row) => row[f]))].sort((a, b) => a - b);

		for (let t = 0; t < vals.length - 1; t++) {
			const threshold = (vals[t] + vals[t + 1]) / 2;

			// Try both directions: left=+1 and left=-1
			for (const dir of [-1, 1]) {
				let error = 0;
				for (let i = 0; i < n; i++) {
					const pred = X[i][f] <= threshold ? dir : -dir;
					if (pred !== y[i]) {
						error += weights[i];
					}
				}

				if (error < bestCost) {
					bestCost = error;
					bestStump = { featureIdx: f, threshold, leftValue: dir, rightValue: -dir };
				}

				// Also try 1-error as cost (for minority class)
				const altError = 1 - error;
				if (altError < bestCost) {
					bestCost = altError;
					bestStump = { featureIdx: f, threshold, leftValue: -dir, rightValue: dir };
				}
			}
		}
	}

	const weightedError = Math.max(1e-10, Math.min(1 - 1e-10, bestCost ?? 0.5));
	const alpha = computeAlpha(weightedError);

	return { stump: bestStump!, weightedError, alpha };
}

/** Compute model weight from classification error */
export function computeAlpha(error: number): number {
	// Clamp to avoid log(0) or division by zero
	error = Math.max(1e-10, Math.min(1 - 1e-10, error));
	return 0.5 * Math.log((1 - error) / error);
}

/** Update example weights after AdaBoost step */
export function updateWeights(
	weights: number[],
	alpha: number,
	predictions: number[], // each prediction ∈ {-1, +1}
	trueLabels: number[] // each label ∈ {-1, +1}
): { newWeights: number[]; Z: number } {
	const n = weights.length;
	let Z = 0;

	for (let i = 0; i < n; i++) {
		weights[i] *= Math.exp(-alpha * trueLabels[i] * predictions[i]);
		Z += weights[i];
	}

	const newWeights = weights.map((w) => w / Z);
	return { newWeights, Z };
}

/** AdaBoost prediction for a single example */
export function adaboostPredict(
	models: Array<{ stump: DecisionStump; alpha: number }>,
	x: number[]
): number {
	let margin = 0;
	for (const { stump, alpha } of models) {
		const pred = x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
		margin += alpha * pred;
	}
	return Math.sign(margin);
}

/** Run full AdaBoost for T iterations */
export function runAdaBoost(
	X: number[][],
	y: number[], // labels ∈ {-1, +1}
	T = 50,
	featureSubset?: number[]
): AdaBoostState {
	const state = createAdaBoostState(X.length);

	for (let t = 0; t < T; t++) {
		const result = adaboostStep(state.weights, X, y, featureSubset);
		state.models.push({ stump: result.stump, alpha: result.alpha });
		state.errors.push(result.weightedError);

		if (result.weightedError >= 0.5) break; // weak learner is useless

		// Compute predictions and update weights
		const preds = X.map((x) => {
			const stump = result.stump;
			return x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
		});

		const updated = updateWeights(state.weights, result.alpha, preds, y);
		state.weights = updated.newWeights;
	}

	return state;
}

// ─── Gradient Boosting ─────────────────────────────

/** Gradient boosting step: fit a base learner to negative gradients */
export function gradientBoostingStep(
	F_pred: number[], // current ensemble predictions F(x_i)
	y: number[], // true labels/values
	lossDerivative: (y_true: number, F_pred: number) => number,
	baseLearner: (residuals: number[]) => (xIdx: number) => number, // learns residuals → prediction function
	learningRate = 0.1
): { predictions: number[]; newF: number[] } {
	const n = y.length;

	// Compute negative gradients (pseudo-residuals)
	const residuals = Array.from({ length: n }, (_, i) => -lossDerivative(y[i], F_pred[i]));

	// Fit base learner to residuals
	const h = baseLearner(residuals);

	// Update ensemble predictions
	const newF = F_pred.map((fp, i) => fp + learningRate * h(i));

	return { predictions: Array.from({ length: n }, (_, i) => h(i)), newF };
}

// ─── Loss Functions ────────────────────────────────

/** Exponential loss: exp(-margin), margin = y·F(x) */
export function exponentialLoss(margin: number): number {
	return Math.exp(-margin);
}

/** Logistic loss: log(1 + exp(-margin)) */
export function logisticLoss(margin: number): number {
	// Numerically stable computation
	if (margin > 20) return 0;
	if (margin < -20) return -margin;
	return Math.log(1 + Math.exp(-margin));
}

/** Derivative of logistic loss w.r.t. margin */
export function logisticLossDerivative(y: number, F_pred: number): number {
	const margin = y * F_pred;
	// d/dF [log(1+exp(-y·F))] / dF = -y / (1 + exp(y·F))
	return -y / (1 + Math.exp(margin));
}

/** Derivative of exponential loss w.r.t. margin */
export function exponentialLossDerivative(y: number, F_pred: number): number {
	const margin = y * F_pred;
	// d/dF [exp(-y·F)] = -y · exp(-y·F)
	return -y * Math.exp(-margin);
}

// ─── Visualization Utilities ──────────────────────

/** AdaBoost state with training history for step-by-step visualization */
export interface AdaBoostHistory {
	weights: number[];
	models: Array<{ stump: DecisionStump; alpha: number }>;
	errors: number[];
	alphas: number[];
	cumulativeErrors: number[];
	weightsPerStep: number[][];
}

/** Run AdaBoost with full history for step-by-step visualization */
export function runAdaBoostWithHistory(
	X: number[][],
	y: number[],
	T = 50,
	featureSubset?: number[]
): AdaBoostHistory {
	const n = X.length;
	const result: AdaBoostHistory = {
		weights: new Array(n).fill(1 / n),
		models: [],
		errors: [],
		alphas: [],
		cumulativeErrors: [],
		weightsPerStep: [new Array(n).fill(1 / n)]
	};

	let weights = [...result.weights];

	for (let t = 0; t < T; t++) {
		const stepResult = adaboostStep(weights, X, y, featureSubset);
		result.models.push({ stump: stepResult.stump, alpha: stepResult.alpha });
		result.errors.push(stepResult.weightedError);
		result.alphas.push(stepResult.alpha);

		if (stepResult.weightedError >= 0.5) break;

		// Compute predictions and update weights
		const preds = X.map((x) => {
			const stump = stepResult.stump;
			return x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
		});

		const updated = updateWeights(weights, stepResult.alpha, preds, y);
		weights = [...updated.newWeights];
		result.weightsPerStep.push([...weights]);

		// Compute cumulative training error (fraction of misclassified samples)
		let correct = 0;
		for (let i = 0; i < n; i++) {
			const pred = adaboostPredict(result.models, X[i]);
			if (pred === y[i]) correct++;
		}
		result.cumulativeErrors.push(1 - correct / n);
	}

	return result;
}

/** Compute functional margin for each sample at each step */
export function computeMarginsPerStep(
	models: Array<{ stump: DecisionStump; alpha: number }>[],
	X: number[][],
	y: number[]
): number[][] {
	// Returns margins[step][sample] = sum(alpha_t * y_i * h_t(x_i))
	return models.map((modelsAtStep) => {
		return X.map((x, i) => {
			let margin = 0;
			for (const { stump, alpha } of modelsAtStep) {
				const pred = x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
				margin += alpha * y[i] * pred;
			}
			return margin;
		});
	});
}

/** Evaluate AdaBoost on a 2D grid for decision boundary visualization */
export function evaluateAdaboostBoundary(
	models: Array<{ stump: DecisionStump; alpha: number }>,
	xRange: [number, number],
	yRange: [number, number],
	resolution = 40
): { predictions: number[][]; margins: number[][] } {
	const gridX: number[] = [];
	for (let i = 0; i <= resolution; i++) {
		gridX.push(xRange[0] + ((xRange[1] - xRange[0]) * i) / resolution);
	}

	const gridY: number[] = [];
	for (let j = 0; j <= resolution; j++) {
		gridY.push(yRange[0] + ((yRange[1] - yRange[0]) * j) / resolution);
	}

	const predictions: number[][] = [];
	const margins: number[][] = [];

	for (let j = 0; j <= resolution; j++) {
		predictions[j] = [];
		margins[j] = [];
		for (let i = 0; i <= resolution; i++) {
			const x = [gridX[i], gridY[j]];
			let marginSum = 0;
			for (const { stump, alpha } of models) {
				const pred = x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
				marginSum += alpha * pred;
			}
			predictions[j][i] = Math.sign(marginSum);
			margins[j][i] = marginSum;
		}
	}

	return { predictions, margins };
}

/** Fit a regression stump to 1D residuals (for Gradient Boosting demo) */
export interface RegressionStump {
	threshold: number;
	leftValue: number;
	rightValue: number;
}

export function fitRegressionStump(xValues: number[], residuals: number[]): RegressionStump {
	const n = xValues.length;
	let bestMse = Infinity;
	let bestStump: RegressionStump | null = null;

	// Candidate thresholds at midpoints between sorted unique x values
	const sortedX = [...new Set(xValues)].sort((a, b) => a - b);

	for (let t = 0; t < sortedX.length - 1; t++) {
		const threshold = (sortedX[t] + sortedX[t + 1]) / 2;

		let leftSum = 0,
			leftCount = 0,
			rightSum = 0,
			rightCount = 0;

		for (let i = 0; i < n; i++) {
			if (xValues[i] <= threshold) {
				leftSum += residuals[i];
				leftCount++;
			} else {
				rightSum += residuals[i];
				rightCount++;
			}
		}

		const leftValue = leftCount > 0 ? leftSum / leftCount : 0;
		const rightValue = rightCount > 0 ? rightSum / rightCount : 0;

		// Compute MSE
		let mse = 0;
		for (let i = 0; i < n; i++) {
			const pred = xValues[i] <= threshold ? leftValue : rightValue;
			mse += (residuals[i] - pred) ** 2;
		}

		if (mse < bestMse) {
			bestMse = mse;
			bestStump = { threshold, leftValue, rightValue };
		}
	}

	return (
		bestStump ?? {
			threshold: 0,
			leftValue: residuals.reduce((a, b) => a + b, 0) / n,
			rightValue: residuals.reduce((a, b) => a + b, 0) / n
		}
	);
}

/** Predict using regression stump */
export function predictRegressionStump(stump: RegressionStump, x: number): number {
	return x <= stump.threshold ? stump.leftValue : stump.rightValue;
}

/** Run Gradient Boosting with history for visualization (1D case) */
export interface GradientBoostingHistory {
	stumps: RegressionStump[];
	FAtEachStep: number[][]; // FAtEachStep[step][i] = F(x_i) after step
	residualsAtEachStep: number[][];
	learningRate: number;
}

/**
 * Run Gradient Boosting with regression stumps on 1D data.
 * Uses squared loss: residual = y - F(x).
 */
export function runGradientBoostingWithHistory(
	xValues: number[],
	yValues: number[],
	T = 20,
	learningRate = 0.3
): GradientBoostingHistory {
	const n = xValues.length;
	// Initialize F to mean(y)
	const F = new Array(n).fill(yValues.reduce((a, b) => a + b, 0) / n);

	const result: GradientBoostingHistory = {
		stumps: [],
		FAtEachStep: [[...F]],
		residualsAtEachStep: [],
		learningRate
	};

	for (let t = 0; t < T; t++) {
		// Compute residuals for squared loss: r_i = y_i - F(x_i)
		const residuals = Array.from({ length: n }, (_, i) => yValues[i] - F[i]);
		result.residualsAtEachStep.push([...residuals]);

		// Fit regression stump to residuals
		const stump = fitRegressionStump(xValues, residuals);
		result.stumps.push(stump);

		// Update F
		for (let i = 0; i < n; i++) {
			F[i] += learningRate * predictRegressionStump(stump, xValues[i]);
		}
		result.FAtEachStep.push([...F]);
	}

	return result;
}
