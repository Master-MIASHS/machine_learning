import { describe, it, expect } from 'vitest';
import { mulberry32, combineSeed, linspace, transpose, matMul, matVec } from './util';

describe('mulberry32', () => {
	it('same seed produces the identical sequence', () => {
		const a = mulberry32(12345);
		const b = mulberry32(12345);
		for (let i = 0; i < 100; i++) {
			expect(a()).toBe(b());
		}
	});

	it('distinct seeds produce distinct streams', () => {
		const a = mulberry32(1);
		const b = mulberry32(2);
		const seqA = Array.from({ length: 50 }, () => a());
		const seqB = Array.from({ length: 50 }, () => b());
		expect(seqA[0]).not.toBe(seqB[0]);
		expect(seqA).not.toEqual(seqB);
	});

	it('values always lie in [0, 1)', () => {
		const rng = mulberry32(42);
		for (let i = 0; i < 1000; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

describe('combineSeed', () => {
	it('is deterministic', () => {
		expect(combineSeed(42, 7)).toBe(combineSeed(42, 7));
	});

	it('different n give different seeds', () => {
		for (const seed of [1, 42, 12345]) {
			expect(combineSeed(seed, 0)).not.toBe(combineSeed(seed, 1));
			expect(combineSeed(seed, 1)).not.toBe(combineSeed(seed, 2));
		}
	});

	it('streams from combined seeds share no prefix', () => {
		const rngA = mulberry32(combineSeed(42, 1));
		const rngB = mulberry32(combineSeed(42, 2));
		const a = Array.from({ length: 20 }, () => rngA());
		const b = Array.from({ length: 20 }, () => rngB());
		// no common prefix: the very first values already differ
		expect(a[0]).not.toBe(b[0]);
		// and the two 20-value blocks are entirely different
		expect(a).not.toEqual(b);
	});
});

describe('linspace', () => {
	it('produces the exact expected grid for (0, 1, 5)', () => {
		expect(linspace(0, 1, 5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
	});

	it('first and last points are exactly start and end', () => {
		const v = linspace(-2.5, 7.25, 17);
		expect(v[0]).toBe(-2.5);
		expect(v[v.length - 1]).toBe(7.25);
	});

	it('points are evenly spaced', () => {
		const v = linspace(-2.5, 7.25, 17);
		const step = (7.25 - -2.5) / 16;
		for (let i = 1; i < v.length; i++) {
			expect(v[i] - v[i - 1]).toBeCloseTo(step, 12);
		}
	});

	it('n = 1 returns [start], n = 2 returns both endpoints', () => {
		expect(linspace(3, 9, 1)).toEqual([3]);
		expect(linspace(3, 9, 2)).toEqual([3, 9]);
	});
});

describe('transpose', () => {
	it('swaps rows and columns on a 2x3 matrix', () => {
		const M = [
			[1, 2, 3],
			[4, 5, 6]
		];
		expect(transpose(M, 2, 3)).toEqual([
			[1, 4],
			[2, 5],
			[3, 6]
		]);
	});

	it('double transpose returns the original matrix (round trip)', () => {
		const M = [
			[1.5, -2, 0, 7],
			[0, 3.25, 4, -1],
			[9, -0.5, 2, 6]
		];
		expect(transpose(transpose(M, 3, 4), 4, 3)).toEqual(M);
	});
});

describe('matMul', () => {
	const I3 = [
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1]
	];

	it('identity leaves the matrix unchanged (A·I = I·A = A)', () => {
		const A = [
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 10]
		];
		expect(matMul(A, I3)).toEqual(A);
		expect(matMul(I3, A)).toEqual(A);
	});

	it('matches the hand-computed 2x2 product', () => {
		const A = [
			[1, 2],
			[3, 4]
		];
		const B = [
			[5, 6],
			[7, 8]
		];
		expect(matMul(A, B)).toEqual([
			[19, 22],
			[43, 50]
		]);
	});

	it('output dimensions follow (m×n)·(n×p) = m×p', () => {
		const A = [
			[1, 2, 3],
			[4, 5, 6]
		]; // 2x3
		const B = [
			[7, 8],
			[9, 10],
			[11, 12]
		]; // 3x2
		const C = matMul(A, B);
		expect(C.length).toBe(2);
		expect(C[0].length).toBe(2);
	});
});

describe('matVec', () => {
	it('matches the hand-computed 2x3 product', () => {
		const M = [
			[1, 2, 3],
			[4, 5, 6]
		];
		expect(matVec(M, [1, 1, 1])).toEqual([6, 15]);
	});

	it('agrees with matMul against a column vector', () => {
		const M = [
			[1, -2, 0.5],
			[3, 0, -1]
		];
		const v = [2, 4, 6];
		const asColumn = v.map((x) => [x]);
		expect(matVec(M, v)).toEqual(matMul(M, asColumn).map((row) => row[0]));
	});

	it('zero vector maps to zero', () => {
		const M = [
			[1, 2],
			[3, 4]
		];
		expect(matVec(M, [0, 0])).toEqual([0, 0]);
	});
});
