/**
 * Deterministic seeded PRNG (mulberry32) — reproducible across runs for a
 * given seed. Third copy of this helper (bayes-learning.ts, consistency.ts
 * each keep their own private one) — worth hoisting to util.ts now rather
 * than copying a fourth time.
 */
export function mulberry32(seed: number): () => number {
	let a = seed;
	return function (): number {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Deterministically combine a base seed with an integer n into a new seed. */
export function combineSeed(seed: number, n: number): number {
	return (seed * 2654435761 + n * 40503) >>> 0;
}

/**
 * Generate n evenly spaced points between start and end (inclusive).
 */
export function linspace(start: number, end: number, n: number): number[] {
	if (n <= 1) return [start];
	const step = (end - start) / (n - 1);
	return Array.from({ length: n }, (_, i) => start + i * step);
}

/** Transpose an m×n matrix. */
export function transpose(M: number[][], m: number, n: number): number[][] {
	const T = Array.from({ length: n }, () => new Array(m).fill(0));
	for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) T[j][i] = M[i][j];
	return T;
}

/** Multiply matrices A (m×n) and B (n×p). */
export function matMul(A: number[][], B: number[][]): number[][] {
	const m = A.length,
		n = A[0].length,
		p = B[0].length;
	const C = Array.from({ length: m }, () => new Array(p).fill(0));
	for (let i = 0; i < m; i++)
		for (let k = 0; k < n; k++) for (let j = 0; j < p; j++) C[i][j] += A[i][k] * B[k][j];
	return C;
}

/** Multiply matrix M (m×n) by vector v (n). */
export function matVec(M: number[][], v: number[]): number[] {
	const m = M.length,
		n = M[0].length;
	const result = new Array(m);
	for (let i = 0; i < m; i++) {
		let s = 0;
		for (let j = 0; j < n; j++) s += M[i][j] * v[j];
		result[i] = s;
	}
	return result;
}

/**
 * Solve A·x = b for a square, non-singular matrix A using Gaussian
 * elimination with partial pivoting. Throws if A is (numerically) singular.
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] {
	const n = A.length;
	if (b.length !== n) throw new Error(`solveLinearSystem: dimension mismatch (${n} vs ${b.length})`);
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
		if (maxVal < 1e-12) throw new Error(`solveLinearSystem: singular matrix at column ${col}`);
		[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

		for (let row = col + 1; row < n; row++) {
			const factor = aug[row][col] / aug[col][col];
			for (let j = col; j <= n; j++) aug[row][j] -= factor * aug[col][j];
		}
	}

	const x = new Array(n);
	for (let i = n - 1; i >= 0; i--) {
		let sum = aug[i][n];
		for (let j = i + 1; j < n; j++) sum -= aug[i][j] * x[j];
		x[i] = sum / aug[i][i];
	}
	return x;
}

/** Invert a square, non-singular matrix (Gaussian elimination on [A | I]). */
export function invert(A: number[][]): number[][] {
	const n = A.length;
	const aug = Array.from({ length: n }, (_, i) => [...A[i], ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);

	for (let col = 0; col < n; col++) {
		let maxRow = col,
			maxVal = Math.abs(aug[col][col]);
		for (let row = col + 1; row < n; row++) {
			if (Math.abs(aug[row][col]) > maxVal) {
				maxVal = Math.abs(aug[row][col]);
				maxRow = row;
			}
		}
		if (maxVal < 1e-12) throw new Error(`invert: singular matrix at column ${col}`);
		[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

		const pivot = aug[col][col];
		for (let j = col; j < 2 * n; j++) aug[col][j] /= pivot;
		for (let row = 0; row < n; row++) {
			if (row === col) continue;
			const factor = aug[row][col];
			for (let j = col; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
		}
	}

	return aug.map((row) => row.slice(n));
}

/**
 * Eigenvalues of a real symmetric matrix via cyclic Jacobi rotations,
 * returned sorted in decreasing order. For a d×d matrix this is exact to
 * machine precision — unlike a diagonal-ratio heuristic, it captures the
 * off-diagonal coupling that dominates the condition number of correlated
 * predictors (course_sources/sophie/8.validation_du_modele_lineaire_2025.pdf,
 * "Calcul de l'indice de conditionnement κ").
 */
export function symmetricEigenvalues(A: number[][]): number[] {
	const n = A.length;
	const M = A.map((row) => [...row]);

	const MAX_SWEEPS = 60;
	for (let sweep = 0; sweep < MAX_SWEEPS; sweep++) {
		let off = 0;
		for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += M[p][q] * M[p][q];
		if (off < 1e-24) break;

		for (let p = 0; p < n - 1; p++) {
			for (let q = p + 1; q < n; q++) {
				const apq = M[p][q];
				if (Math.abs(apq) < 1e-16) continue;
				const app = M[p][p],
					aqq = M[q][q];
				const theta = (aqq - app) / (2 * apq);
				const t =
					theta >= 0 ? 1 / (theta + Math.sqrt(theta * theta + 1)) : -1 / (-theta + Math.sqrt(theta * theta + 1));
				const c = 1 / Math.sqrt(t * t + 1);
				const s = t * c;

				for (let k = 0; k < n; k++) {
					const mkp = M[k][p],
						mkq = M[k][q];
					M[k][p] = c * mkp - s * mkq;
					M[k][q] = s * mkp + c * mkq;
				}
				for (let k = 0; k < n; k++) {
					const mpk = M[p][k],
						mqk = M[q][k];
					M[p][k] = c * mpk - s * mqk;
					M[q][k] = s * mpk + c * mqk;
				}
			}
		}
	}

	return M.map((row, i) => row[i])
		.toSorted((a, b) => b - a);
}
