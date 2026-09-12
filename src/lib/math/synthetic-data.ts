/**
 * Synthetic data generation for ML experiments (regularization, ensembles).
 *
 * GÉNÉRATEUR SYNTHÉTIQUE — pas de formule dans course_sources/.
 * Fournit des données linéaires creuses (sparse) et corrélées pour les
 * démos de régularisation (Lasso/Ridge/Elastic Net, cf.
 * course_sources/typst/regularization.typ, ch. 5) ; la structure « 5
 * coefficients non nuls sur 20 » reprend le style de l'exemple Python de la
 * source (« Génération de données avec structure parce »), sans être une
 * formule de la source.
 */

/** Generate linear regression data with k sparse true features and Gaussian noise */
export function generateLinearData(
	n: number,
	d: number,
	sparsity = 0.2, // fraction of truly non-zero coefficients
	noiseSigma = 0.1,
	seed = 42
): { X: number[][]; y: number[]; trueCoef: number[] } {
	const rng = makeRng(seed);

	// Random standard-normal features via Box-Muller
	const X: number[][] = [];
	for (let i = 0; i < n; i++) {
		X.push(Array.from({ length: d }, () => boxMuller(rng)));
	}

	// Sparse true coefficients
	const numNonZero = Math.max(1, Math.round(d * sparsity));
	const indices = new Set<number>();
	while (indices.size < numNonZero) {
		indices.add(Math.floor(rng() * d));
	}

	const trueCoef = Array.from({ length: d }, (_, j) => indices.has(j) ? rng() * 4 - 2 : 0);

	// Target with noise
	const y = new Array(n);
	for (let i = 0; i < n; i++) {
		let sum = 0;
		for (let j = 0; j < d; j++) sum += X[i][j] * trueCoef[j];
		y[i] = sum + boxMuller(rng) * noiseSigma;
	}

	return { X, y, trueCoef };
}

/** Generate data with correlated features (multicollinearity) */
export function generateCorrelatedData(
	n: number,
	d: number,
	correlationMatrix?: number[][],
	noiseSigma = 0.1,
	seed = 42
): { X: number[][]; y: number[]; trueCoef: number[] } {
	const rng = makeRng(seed);

	let corr = correlationMatrix;
	if (!corr) {
		// Default: create a simple AR(1)-like correlation structure
		corr = Array.from({ length: d }, (_, i) =>
			Array.from({ length: d }, (__, j) => 0.7 ** Math.abs(i - j))
		);
	}

	// Cholesky decomposition of correlation matrix
	const L = cholesky(corr, d);

	// Generate correlated samples
	const X: number[][] = [];
	for (let i = 0; i < n; i++) {
		const z = Array.from({ length: d }, () => boxMuller(rng)); // independent N(0,1)
		const x = new Array(d);
		for (let j = 0; j < d; j++) {
			let sum = 0;
			for (let k = 0; k <= j; k++) sum += L[j][k] * z[k];
			x[j] = sum;
		}
		X.push(x);
	}

	const trueCoef = Array.from({ length: d }, () => rng() * 2 - 1);

	const y = new Array(n);
	for (let i = 0; i < n; i++) {
		let sum = 0;
		for (let j = 0; j < d; j++) sum += X[i][j] * trueCoef[j];
		y[i] = sum + boxMuller(rng) * noiseSigma;
	}

	return { X, y, trueCoef };
}

// ─── Helpers ────────────────────────────────────────────────────────

function makeRng(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return s / 2147483647;
	};
}

function boxMuller(rng: () => number): number {
	const u1 = rng();
	const u2 = rng();
	return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/** Cholesky decomposition of symmetric positive-definite matrix → lower triangular L */
function cholesky(A: number[][], n: number): number[][] {
	const L = Array.from({ length: n }, () => new Array(n).fill(0));

	for (let i = 0; i < n; i++) {
		for (let j = 0; j <= i; j++) {
			let sum = 0;
			if (j === i) {
				const diag = A[i][i] - sum;
				L[i][j] = Math.sqrt(Math.max(diag, 1e-10));
			} else {
				for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
				L[i][j] = (A[i][j] - sum) / L[j][j];
			}
		}
	}

	return L;
}
