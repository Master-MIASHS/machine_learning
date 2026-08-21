/**
 * Linear regression solvers (OLS, Ridge) with matrix utilities.
 */

import { matMul, matVec, transpose } from './util.js';

function solveLinearSystem(A: number[][], b: number[]): number[] {
	// Gaussian elimination with partial pivoting
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

// ─── Solvers ──────────────────────────────────────────────

/** OLS closed-form: θ = (XᵀX)⁻¹ Xᵀy */
export function olsClosedForm(X: number[][], y: number[]): number[] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);
	const Xty = matVec(Xt, y);

	return solveLinearSystem(XtX, Xty);
}

/** Ridge solver: θ = (XᵀX + λI)⁻¹ Xᵀy */
export function ridgeSolver(X: number[][], y: number[], lambda: number): number[] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);

	for (let j = 0; j < d; j++) XtX[j][j] += lambda;

	const Xty = matVec(Xt, y);
	return solveLinearSystem(XtX, Xty);
}

/** Condition number of XᵀX (approximate via ratio of max/min diagonal after SVD-like) */
export function computeConditionNumber(X: number[][]): number {
	// Simple estimate via Givens-based or power iteration; for small matrices just use XtX eigenvalues
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);

	// Power method + inverse power method to estimate max/min eigenvalue
	if (d <= 1) return 1;

	// Simple Jacobi iteration for 2x2 or small systems — use diagonal as rough estimate
	let minD = Infinity,
		maxD = -Infinity;
	for (let j = 0; j < d; j++) {
		const val = Math.abs(XtX[j][j]);
		if (val < minD) minD = val;
		if (val > maxD) maxD = val;
	}

	return minD > 1e-12 ? maxD / minD : Infinity;
}

/** SVD shrinkage factors: σ²_j / (σ²_j + λ) */
export function svdShrinkageFactors(singularValues: number[], lambda: number): number[] {
	return singularValues.map((sv) => {
		const s2 = sv * sv;
		return s2 / (s2 + lambda);
	});
}
