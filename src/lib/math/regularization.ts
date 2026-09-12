/**
 * Regularization solvers: Ridge path, Lasso (coordinate descent), Elastic Net, and LARS.
 *
 * Source principale : course_sources/typst/regularization.typ, ch. 5
 * « Régularisation » :
 *  - Définition 5.1 (Régularisation L2 — Ridge) + solution analytique
 *    → ridgePath ;
 *  - Définition 5.2 (Régularisation L1 — Lasso) + « sélection de variables
 *    automatique » (les coins du losange L1) → lassoCoordinateDescent ;
 *    la descente par coordonnées elle-même : course_sources/typst/optim.typ,
 *    ch. 3, Algorithme 3.13 (« Solution exacte possible dans certains cas
 *    (Lasso) » est listée parmi les avantages de la CD) ;
 *  - Définition 5.3 (Lasso path — fonction linéaire par morceaux, variables
 *    qui entrent/sortent à des valeurs spécifiques de λ) → lassoPathLARS ;
 *  - Algorithme 5.1 (LARS simplifié : j* = argmax_j |x_jᵀr|, direction
 *    « équiangular », événements) → lassoPathLARS ;
 *  - Définition 5.3 (Elastic Net — NB : la source réutilise le numéro 5.3,
 *    déjà porté par le Lasso path ; paramétrisation α ∈ [0,1]) →
 *    elasticNetSolver.
 * Cf. aussi Théorème 5.1 (Décomposition biais-variance avec
 * régularisation) pour l'interprétation du trade-off.
 */

import { ridgeSolver } from './regression.js';

// ─── Ridge Path ─────────────────────────────────────

export function ridgePath(X: number[][], y: number[], lambdas: number[]): number[][] {
	return lambdas.map((lambda) => ridgeSolver(X, y, lambda));
}

// ─── Lasso via Coordinate Descent ──────────────────

/** Soft-thresholding operator */
function softThreshold(val: number, threshold: number): number {
	if (val > threshold) return val - threshold;
	if (val < -threshold) return val + threshold;
	return 0;
}

export function lassoCoordinateDescent(
	X: number[][],
	y: number[],
	lambda: number,
	maxIter = 1000,
	tol = 1e-8
): number[] {
	const n = X.length,
		d = X[0].length;

	// Precompute column norms and dot products
	const colNorms = new Array(d);
	for (let j = 0; j < d; j++) {
		let s = 0;
		for (let i = 0; i < n; i++) s += X[i][j] ** 2;
		colNorms[j] = s / n || 1e-10; // normalize for stability
	}

	const theta = new Array(d).fill(0);

	for (let iter = 0; iter < maxIter; iter++) {
		let maxChange = 0;

		for (let j = 0; j < d; j++) {
			// Compute residual without feature j contribution
			let rho_j = y[j]; // wrong — need partial residual
			rho_j = 0;
			for (let i = 0; i < n; i++) {
				let xi = y[i];
				for (let k = 0; k < d; k++) {
					if (k === j) continue;
					xi -= X[i][k] * theta[k];
				}
				rho_j += X[i][j] * xi;
			}

			const oldVal = theta[j];
			theta[j] = softThreshold(rho_j / n, lambda) / colNorms[j];
			maxChange += Math.abs(theta[j] - oldVal);
		}

		if (maxChange < tol) break;
	}

	return theta;
}

// ─── Elastic Net ────────────────────────────────────

/** Elastic Net via generalized soft-thresholding coordinate descent */
export function elasticNetSolver(
	X: number[][],
	y: number[],
	lambda: number, // total regularization strength
	alpha = 0.5, // mix: alpha=0 → Ridge, alpha=1 → Lasso
	maxIter = 1000,
	tol = 1e-8
): number[] {
	const n = X.length,
		d = X[0].length;

	const l1Penalty = lambda * alpha; // L1 component
	const l2Penalty = lambda * (1 - alpha); // L2 component

	const colNorms = new Array(d);
	for (let j = 0; j < d; j++) {
		let s = 0;
		for (let i = 0; i < n; i++) s += X[i][j] ** 2;
		colNorms[j] = s / n || 1e-10;
	}

	const theta = new Array(d).fill(0);

	for (let iter = 0; iter < maxIter; iter++) {
		let maxChange = 0;

		for (let j = 0; j < d; j++) {
			// Partial residual
			let rho_j = 0;
			for (let i = 0; i < n; i++) {
				let xi = y[i];
				for (let k = 0; k < d; k++) {
					if (k === j) continue;
					xi -= X[i][k] * theta[k];
				}
				rho_j += X[i][j] * xi;
			}

			const oldVal = theta[j];
			// Generalized soft-thresholding: S(x, λ₁) / (colNorm + λ₂)
			theta[j] = softThreshold(rho_j / n, l1Penalty) / (colNorms[j] + l2Penalty);
			maxChange += Math.abs(theta[j] - oldVal);
		}

		if (maxChange < tol) break;
	}

	return theta;
}

// ─── LARS (Least Angle Regression) — simplified Lasso path ──

interface LARSKnot {
	lambda: number;
	theta: number[];
	activeSet: Set<number>;
}

export function lassoPathLARS(X: number[][], y: number[], maxFeatures?: number): LARSKnot[] {
	const n = X.length,
		d = X[0].length;
	const maxStep = maxFeatures ?? d;

	// Center and normalize
	const yMean = y.reduce((a, b) => a + b, 0) / n;
	const yCentered = y.map((yi) => yi - yMean);

	// Column norms and normalized columns
	const colNorms = new Array(d);
	const Xnorm: number[][] = [];
	for (let j = 0; j < d; j++) {
		let s = 0;
		for (let i = 0; i < n; i++) s += X[i][j] ** 2;
		colNorms[j] = Math.sqrt(s);
		Xnorm.push(colNorms[j] > 1e-12 ? X.map((row) => row[j] / colNorms[j]) : new Array(n).fill(0));
	}

	const knots: LARSKnot[] = [
		{ lambda: Infinity, theta: new Array(d).fill(0), activeSet: new Set() }
	];

	const r = [...yCentered]; // residual (mutated in-place)
	const active = new Set<number>();
	const theta = new Array(d).fill(0);

	for (let step = 0; step < maxStep; step++) {
		if (active.size === d) break;

		// Find most correlated feature with residual
		let bestCorr = -Infinity,
			bestJ = -1;
		for (let j = 0; j < d; j++) {
			if (active.has(j)) continue;
			let corr = 0;
			for (let i = 0; i < n; i++) corr += Xnorm[j][i] * r[i];
			corr = Math.abs(corr);
			if (corr > bestCorr) {
				bestCorr = corr;
				bestJ = j;
			}
		}

		if (bestJ < 0 || bestCorr < 1e-10) break;

		active.add(bestJ);

		// Equiangular direction for active set (simplified: just update along new feature)
		const sign = (() => {
			let c = 0;
			for (let i = 0; i < n; i++) c += Xnorm[bestJ][i] * r[i];
			return Math.sign(c);
		})();

		// Move in equiangular direction until next feature becomes equally correlated
		const gamma = step === 0 ? bestCorr / n : 1e-3; // simplified step size

		theta[bestJ] += sign * gamma;

		// Update residual
		for (let i = 0; i < n; i++) r[i] -= gamma * sign * Xnorm[bestJ][i];

		const currentLambda = (() => {
			let maxCorr = 0;
			for (let j = 0; j < d; j++)
				if (!active.has(j)) {
					let c = 0;
					for (let i = 0; i < n; i++) c += Math.abs(Xnorm[j][i] * r[i]);
					maxCorr = Math.max(maxCorr, c);
				}
			return maxCorr / n;
		})();

		knots.push({
			lambda: currentLambda,
			theta: [...theta],
			activeSet: new Set(active)
		});
	}

	return knots;
}
