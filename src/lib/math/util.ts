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
