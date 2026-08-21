/**
 * Bias–variance decomposition utilities.
 *
 * Monte Carlo estimates of bias², variance, and irreducible noise for
 * polynomial regression and Ridge regularization demos (Leçon 8).
 */

import { matMul, matVec, transpose } from './util.js';

/** Solve Ax = b via Gaussian elimination with partial pivoting. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
	const n = A.length;
	const aug = Array.from({ length: n }, (_, i) => [...A[i], b[i]]);

	for (let col = 0; col < n; col++) {
		let maxRow = col,
			maxVal = Math.abs(aug[col][col]);
		for (let row = col + 1; row < n; row++) {
			if (Math.abs(aug[row][col]) > maxVal) {
				maxVal = Math.abs(aug[row][col]);
				maxRow = row;
			}
		}
		[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

		if (Math.abs(aug[col][col]) < 1e-12) continue;

		for (let row = col + 1; row < n; row++) {
			const factor = aug[row][col] / aug[col][col];
			for (let j = col; j <= n; j++) aug[row][j] -= factor * aug[col][j];
		}
	}

	const x = new Array(n);
	for (let i = n - 1; i >= 0; i--) {
		let sum = aug[i][n];
		for (let j = i + 1; j < n; j++) sum -= aug[i][j] * x[j];
		x[i] = Math.abs(aug[i][i]) > 1e-12 ? sum / aug[i][i] : 0;
	}
	return x;
}

// ─── Random sampling helpers ──────────────────────────────────────

/** Draw a standard normal sample via Box-Muller. */
function randn(): number {
	let u = 0,
		v = 0;
	while (u === 0) u = Math.random();
	while (v === 0) v = Math.random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Sample `k` indices uniformly with replacement from [0, n). */
function sampleIndices(n: number, k: number): number[] {
	const idx = new Array(k);
	for (let i = 0; i < k; i++) idx[i] = Math.floor(Math.random() * n);
	return idx;
}

// ─── Synthetic data generation ──────────────────────────────────────

/** True function: sin(2πx) · exp(−x²). Smooth but non-trivial. */
function trueFuncDefault(x: number): number {
	return Math.sin(2 * Math.PI * x) * Math.exp(-(x ** 2));
}

/**
 * Generate synthetic data from a true function + Gaussian noise.
 * @param n number of samples
 * @param noiseStd standard deviation of Gaussian noise
 * @returns xs (uniform in [0,1]), ys, and the ground truth function
 */
export function generateSyntheticData(
	n: number,
	noiseStd: number
): {
	xs: number[];
	ys: number[];
	trueFunc: (x: number) => number;
} {
	const xs = Array.from({ length: n }, (_, i) => (i + 0.5) / n); // uniform on [0,1]
	const ys = xs.map((x) => trueFuncDefault(x) + noiseStd * randn());
	return { xs, ys, trueFunc: trueFuncDefault };
}

// ─── Polynomial features & fitting ──────────────────────────────

/**
 * Polynomial feature expansion. Converts [x] into [1, x, x², ..., x^degree].
 */
export function polynomialFeatures(xs: number[], degree: number): number[][] {
	return xs.map((x) => {
		const row = new Array(degree + 1);
		let power = 1;
		for (let i = 0; i <= degree; i++) {
			row[i] = power;
			power *= x;
		}
		return row;
	});
}

/**
 * Evaluate a polynomial at x given coefficients.
 * coeffs[i] is the coefficient for x^i.
 */
export function polyEval(coeffs: number[], x: number): number {
	let result = 0,
		power = 1;
	for (let i = 0; i < coeffs.length; i++) {
		result += coeffs[i] * power;
		power *= x;
	}
	return result;
}

/**
 * Fit a polynomial regression of given degree using normal equations.
 * Solves the OLS problem: min ||Xθ − y||² where X = polynomialFeatures(xs, degree).
 * @param xs input values
 * @param ys target values
 * @param degree polynomial degree
 * @returns coefficients [c0, c1, ..., c_degree] where predict(x) = Σ ci · x^i
 */
export function polyFit(xs: number[], ys: number[], degree: number): number[] {
	const X = polynomialFeatures(xs, degree);
	return olsClosedForm(X, ys);
}

/** OLS closed-form: θ = (XᵀX)⁻¹ Xᵀy */
function olsClosedForm(X: number[][], y: number[]): number[] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);
	const Xty = matVec(Xt, y);
	return solveLinearSystem(XtX, Xty);
}

// ─── Ridge solver ──────────────────────────────────────────────

/**
 * Ridge regression solver using normal equations with L2 penalty.
 * θ = (XᵀX + λI)⁻¹ Xᵀy
 */
export function ridgeSolver(X: number[][], y: number[], lambda: number): number[] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);

	for (let j = 0; j < d; j++) XtX[j][j] += lambda;

	const Xty = matVec(Xt, y);
	return solveLinearSystem(XtX, Xty);
}

// ─── Bias–variance decomposition (polynomial degree) ──────────────

/**
 * Compute bias-variance decomposition via Monte Carlo simulation.
 *
 * For a given polynomial degree, fit many models on bootstrap subsamples
 * and compute empirical bias², variance, and irreducible noise at test points.
 *
 * @param xsTrain training inputs
 * @param ysTrain training targets
 * @param trueFunc ground truth function
 * @param degree polynomial degree to use for each fit
 * @param numRepeats number of bootstrap samples (default 50)
 * @param subsampleFraction fraction of data to use per bootstrap sample (default 0.8)
 * @returns array of { x, biasSq, variance, noise } at evaluation points
 */
export function computeBiasVarianceDecomposition(
	xsTrain: number[],
	ysTrain: number[],
	trueFunc: (x: number) => number,
	degree: number,
	numRepeats = 50,
	subsampleFraction = 0.8
): { x: number; biasSq: number; variance: number; noise: number }[] {
	const nTrain = xsTrain.length;
	const subSize = Math.max(2, Math.floor(subsampleFraction * nTrain));

	// Evaluation points span the training range at fine resolution
	const min = Math.min(...xsTrain);
	const max = Math.max(...xsTrain);
	const evalPoints: number[] = [];
	for (let i = 0; i <= 100; i++) evalPoints.push(min + (max - min) * (i / 100));

	// Collect predictions at each test point across bootstrap iterations
	const predAccumulators = evalPoints.map(() => new Array(numRepeats).fill(0));

	for (let r = 0; r < numRepeats; r++) {
		const indices = sampleIndices(nTrain, subSize);
		const xsSub = indices.map((i) => xsTrain[i]);
		const ysSub = indices.map((i) => ysTrain[i]);

		const coeffs = polyFit(xsSub, ysSub, degree);

		for (let p = 0; p < evalPoints.length; p++) {
			predAccumulators[p][r] = polyEval(coeffs, evalPoints[p]);
		}
	}

	// Aggregate: bias², variance, noise at each evaluation point
	return evalPoints.map((x, p) => {
		const preds = predAccumulators[p];
		const meanPred = preds.reduce((a, b) => a + b, 0) / numRepeats;
		const yTrue = trueFunc(x);

		const biasSq = (meanPred - yTrue) ** 2;
		let variance = 0;
		for (const pVal of preds) variance += (pVal - meanPred) ** 2;
		variance /= numRepeats;

		const noise = 0; // irreducible — estimated from data if available, default 0 for synthetic demos
		return { x, biasSq, variance, noise };
	});
}

// ─── Bias–variance decomposition (Ridge lambda) ──────────────

/**
 * Compute bias-variance decomposition for Ridge regression.
 *
 * For each lambda value, fit Ridge models on bootstrap subsamples and compute
 * the bias², variance, and noise at test points. This shows how regularization
 * trades increased bias for reduced variance.
 *
 * @param xsTrain training inputs (normalized)
 * @param ysTrain training targets
 * @param trueFunc ground truth function
 * @param lambdas array of lambda values to evaluate
 * @param degree polynomial degree for feature expansion
 * @param numRepeats number of bootstrap samples (default 30)
 * @returns { lambdas, decompositions } where each decomposition has per-point stats
 */
export function computeRidgeBiasVariance(
	xsTrain: number[],
	ysTrain: number[],
	trueFunc: (x: number) => number,
	lambdas: number[],
	degree: number,
	numRepeats = 30
): {
	lambdas: number[];
	decompositions: Array<{ biasSq: number; variance: number; noise: number }>;
} {
	const nTrain = xsTrain.length;
	const subSize = Math.max(2, Math.floor(0.8 * nTrain));

	// Average bias² / variance across evaluation points for each lambda
	const decompositions = lambdas.map((lambda) => {
		// Per-lambda: accumulate per-point predictions across bootstrap runs
		const numEvalPoints = 50;
		const min = Math.min(...xsTrain);
		const max = Math.max(...xsTrain);

		const predAccumulators = Array.from({ length: numEvalPoints }, () =>
			new Array(numRepeats).fill(0)
		);
		const evalYTrue = Array.from({ length: numEvalPoints }, (_, i) => {
			const x = min + (max - min) * (i / (numEvalPoints - 1));
			return trueFunc(x);
		});

		for (let r = 0; r < numRepeats; r++) {
			const indices = sampleIndices(nTrain, subSize);
			const xsSub = indices.map((i) => xsTrain[i]);
			const ysSub = indices.map((i) => ysTrain[i]);

			const X = polynomialFeatures(xsSub, degree);
			const coeffs = ridgeSolver(X, ysSub, lambda);

			for (let p = 0; p < numEvalPoints; p++) {
				const x = min + (max - min) * (p / (numEvalPoints - 1));
				predAccumulators[p][r] = polyEval(coeffs, x);
			}
		}

		// Aggregate across evaluation points
		let totalBiasSq = 0;
		let totalVariance = 0;
		for (let p = 0; p < numEvalPoints; p++) {
			const preds = predAccumulators[p];
			const meanPred = preds.reduce((a, b) => a + b, 0) / numRepeats;

			totalBiasSq += (meanPred - evalYTrue[p]) ** 2;
			for (const pv of preds) totalVariance += (pv - meanPred) ** 2;
		}

		totalBiasSq /= numEvalPoints;
		totalVariance /= numEvalPoints * numRepeats;

		return { biasSq: totalBiasSq, variance: totalVariance, noise: 0 };
	});

	return { lambdas, decompositions };
}

// ─── Cross-validation for Ridge lambda selection ──────────────

/**
 * Perform k-fold cross-validation to find optimal lambda.
 *
 * @param xsTrain training inputs
 * @param ysTrain training targets
 * @param lambdas candidate lambda values
 * @param degree polynomial degree for feature expansion
 * @param k number of folds (default 5)
 * @returns { lambdas, cvScores } where cvScores are mean squared errors per fold set
 */
export function crossValidateRidge(
	xsTrain: number[],
	ysTrain: number[],
	lambdas: number[],
	degree: number,
	k = 5
): { lambdas: number[]; cvScores: number[] } {
	const n = xsTrain.length;
	const foldSize = Math.floor(n / k);

	// Build fold assignments (sequential for reproducibility)
	const folds: Array<{ trainIdx: number[]; valIdx: number[] }> = [];
	for (let f = 0; f < k; f++) {
		const valStart = f * foldSize;
		const valEnd = f === k - 1 ? n : (f + 1) * foldSize;
		const valIdx = Array.from({ length: valEnd - valStart }, (_, i) => valStart + i);
		const trainIdx = [
			...Array.from({ length: valStart }, (_, i) => i),
			...Array.from({ length: n - valEnd }, (_, i) => valEnd + i)
		];
		folds.push({ trainIdx, valIdx });
	}

	const cvScores = lambdas.map((lambda) => {
		let totalMSE = 0;
		for (const { trainIdx, valIdx } of folds) {
			const xsTr = trainIdx.map((i) => xsTrain[i]);
			const ysTr = trainIdx.map((i) => ysTrain[i]);
			const xsVal = valIdx.map((i) => xsTrain[i]);
			const ysVal = valIdx.map((i) => ysTrain[i]);

			const X = polynomialFeatures(xsTr, degree);
			const coeffs = ridgeSolver(X, ysTr, lambda);

			for (let i = 0; i < xsVal.length; i++) {
				const pred = polyEval(coeffs, xsVal[i]);
				totalMSE += (pred - ysVal[i]) ** 2;
			}
		}

		return totalMSE / n; // average MSE across all folds
	});

	return { lambdas, cvScores };
}
