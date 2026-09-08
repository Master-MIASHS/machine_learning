/**
 * Linear regression solvers (OLS, Ridge) with matrix utilities.
 */

import { matMul, matVec, solveLinearSystem, transpose } from './util.js';

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

/** SVD shrinkage factors: σ²_j / (σ²_j + λ) */
export function svdShrinkageFactors(singularValues: number[], lambda: number): number[] {
	return singularValues.map((sv) => {
		const s2 = sv * sv;
		return s2 / (s2 + lambda);
	});
}
