/**
 * Tests for proximal.ts (expert lesson « Méthodes proximales », Part I).
 *
 * All results are « au-delà du cours » — sources: Parikh & Boyd 2014,
 * Beck & Teboulle 2009, Boyd et al. 2011, Combettes & Wajs 2005 (see the
 * module header and expert/part1/lessons/methodes-proximales-fista-admm.research.md).
 *
 * Strategy (per AGENTS.md math-module rules): check against
 * (a) known closed forms computed independently, (b) invariants
 * (cross-algorithm agreement, monotone ISTA decay, Moreau decomposition),
 * (c) exact analytical cases (zero solution when λ ≥ max_j |Xᵀy_j|,
 * orthonormal design, homogeneity of S_λ), (d) input validation.
 */
import { describe, it, expect } from 'vitest';
import {
	softThreshold,
	proxL1,
	proxL2Squared,
	lassoObjectiveValue,
	lassoLipschitzConstant,
	istaLassoStep,
	runProxLasso,
	demoLassoData,
	estimateReferenceValue
} from './proximal.js';
import { matVec, transpose, mulberry32, combineSeed, symmetricEigenvalues } from './util.js';

/** Two-stage grid minimization: coarse scan, then a fine scan around the coarse best. */
function gridMinimize(obj: (x: number) => number, lo: number, hi: number): number {
	let bestX = lo;
	let best = obj(lo);
	const coarse = 200;
	for (let i = 1; i <= coarse; i++) {
		const x = lo + ((hi - lo) * i) / coarse;
		const v = obj(x);
		if (v < best) {
			best = v;
			bestX = x;
		}
	}
	const h = (hi - lo) / coarse;
	for (let i = -50; i <= 50; i++) {
		const x = bestX + (i * h) / 100;
		if (x < lo || x > hi) continue;
		const v = obj(x);
		if (v < best) best = v;
	}
	return best;
}

/**
 * Independent reference: exact cyclic coordinate descent for
 * min ½‖y − Xθ‖² + λ‖θ‖₁. Coordinate subproblem min ½aθ² − bθ + λ|θ|
 * (a = Σ_i X_ij², b = Σ_i X_ij r_i, r = y − Xθ with θ_j removed) has the
 * exact update θ_j ← S(b, λ)/a (1-D proximal calculus — hand-verifiable).
 * Note: the course's `lassoCoordinateDescent` (regularization.ts) uses a
 * heuristic update (exact only for orthonormal columns), so it is NOT used
 * as a reference here.
 */
function referenceLasso(X: number[][], y: number[], lambda: number, maxIter = 5000, tol = 1e-13): number[] {
	const n = X.length,
		d = X[0].length;
	const a = new Array(d).fill(0);
	for (let j = 0; j < d; j++) for (let i = 0; i < n; i++) a[j] += X[i][j] * X[i][j];
	const theta = new Array(d).fill(0);
	for (let iter = 0; iter < maxIter; iter++) {
		let maxChange = 0;
		for (let j = 0; j < d; j++) {
			let b = 0; // Σ_i X_ij r_i with r = y − Xθ excluding coordinate j
			for (let i = 0; i < n; i++) {
				let r = y[i];
				for (let k = 0; k < d; k++) if (k !== j) r -= X[i][k] * theta[k];
				b += X[i][j] * r;
			}
			const old = theta[j];
			theta[j] = softThreshold(b, lambda) / (a[j] || 1e-12);
			maxChange = Math.max(maxChange, Math.abs(theta[j] - old));
		}
		if (maxChange < tol) break;
	}
	return theta;
}

/** Seeded synthetic lasso problem (deterministic across runs). */
function makeProblem(seed = 42, n = 60, d = 12, nonzero = 5): { X: number[][]; y: number[]; thetaStar: number[] } {
	const rng = mulberry32(combineSeed(seed, 7));
	const X: number[][] = [];
	for (let i = 0; i < n; i++) {
		const row: number[] = [];
		for (let j = 0; j < d; j++) row.push(rng() * 2 - 1);
		X.push(row);
	}
	const thetaStar = new Array(d).fill(0);
	for (let j = 0; j < nonzero; j++) thetaStar[j] = (j % 2 === 0 ? 1 : -1) * (1 + rng() * 2);
	const y = X.map((row) => row.reduce((s, v, j) => s + v * thetaStar[j], 0) + 0.1 * (rng() * 2 - 1));
	return { X, y, thetaStar };
}

describe('softThreshold (S_λ — PB14 §6.5.2, eq. (6.9))', () => {
	it('matches the closed form on exact cases', () => {
		expect(softThreshold(3, 1)).toBeCloseTo(2, 12);
		expect(softThreshold(-3, 1)).toBeCloseTo(-2, 12);
		expect(softThreshold(0.5, 1)).toBe(0);
		expect(softThreshold(-0.5, 1)).toBe(0);
		expect(softThreshold(0, 1)).toBe(0);
		// |v| = λ is in the "zero" branch (|v_i| ≤ λ)
		expect(softThreshold(1, 1)).toBe(0);
		expect(softThreshold(-1, 1)).toBe(0);
		expect(softThreshold(0, 0)).toBe(0);
	});

	it('is homogeneous: S(αv, αλ) = α·S(v, λ) for α > 0', () => {
		const rng = mulberry32(7);
		for (let i = 0; i < 200; i++) {
			const v = (rng() * 2 - 1) * 5;
			const lam = 0.1 + rng() * 2;
			const alpha = 0.3 + rng() * 3;
			expect(softThreshold(alpha * v, alpha * lam)).toBeCloseTo(alpha * softThreshold(v, lam), 9);
		}
	});

	it('is the exact minimizer of |x| + (1/(2λ))(x−v)² (brute force)', () => {
		const rng = mulberry32(11);
		for (let i = 0; i < 40; i++) {
			const v = (rng() * 2 - 1) * 3;
			const lam = 0.05 + rng() * 1.5;
			const xStar = softThreshold(v, lam);
			const obj = (x: number) => Math.abs(x) + ((x - v) ** 2) / (2 * lam);
			expect(obj(xStar)).toBeCloseTo(gridMinimize(obj, -6, 6), 6);
		}
	});

	it('satisfies the first-order optimality condition 0 ∈ ∂|x| + (x−v)/λ', () => {
		const rng = mulberry32(29);
		for (let i = 0; i < 100; i++) {
			const v = (rng() * 2 - 1) * 4;
			const lam = 0.1 + rng() * 2;
			const x = softThreshold(v, lam);
			const r = (x - v) / lam; // subgradient residual
			if (x > 0) expect(1 + r).toBeCloseTo(0, 9);
			else if (x < 0) expect(-1 + r).toBeCloseTo(0, 9);
			else expect(Math.abs(r)).toBeLessThanOrEqual(1 + 1e-9); // 0 ∈ [−1,1] + r
		}
	});
});

describe('proxL1 (vector soft-thresholding)', () => {
	it('applies S_λ elementwise', () => {
		expect(proxL1([3, -0.5, 2, 0], 1)).toEqual([2, 0, 1, 0]);
	});

	it('throws on negative lambda', () => {
		expect(() => proxL1([1, 2], -0.1)).toThrow(/lambda/);
	});
});

describe('proxL2Squared (proximal of (ρ/2)‖·‖²)', () => {
	it('equals v/(1+ρ) (closed form)', () => {
		const v = [1.5, -2, 0, 3.25];
		for (const rho of [0, 0.5, 1, 7]) {
			const expected = v.map((x) => x / (1 + rho));
			expect(proxL2Squared(v, rho)).toEqual(expected);
		}
	});

	it('is the exact minimizer of (ρ/2)‖x‖² + ½‖x−v‖² (brute force, scalar)', () => {
		const rng = mulberry32(5);
		for (let i = 0; i < 30; i++) {
			const v = (rng() * 2 - 1) * 3;
			const rho = 0.1 + rng() * 4;
			const xStar = proxL2Squared([v], rho)[0];
			const obj = (x: number) => (rho / 2) * x * x + 0.5 * (x - v) ** 2;
			expect(obj(xStar)).toBeCloseTo(gridMinimize(obj, -6, 6), 6);
		}
	});

	it('never zeros a nonzero coordinate (contrast with L1)', () => {
		const v = [0.001, -0.001];
		for (const rho of [1, 100, 1e4]) {
			const p = proxL2Squared(v, rho);
			expect(p[0]).not.toBe(0);
			expect(p[1]).not.toBe(0);
		}
	});
});

describe('Moreau decomposition (PB14 §2.5, eq. (2.4))', () => {
	it('v = prox_{λ‖·‖₁}(v) + prox_{λ‖·‖₁*}(v) = S_λ(v) + clip(v, −λ, λ)', () => {
		const rng = mulberry32(3);
		const lam = 0.7;
		for (let i = 0; i < 100; i++) {
			const v = (rng() * 2 - 1) * 3;
			const s = softThreshold(v, lam); // prox_{λ‖·‖₁}
			const clip = Math.max(-lam, Math.min(lam, v)); // Π_{‖·‖∞ ≤ λ} = prox_{λ·ι_B} = prox_{(λ‖·‖₁)*}
			expect(s + clip).toBeCloseTo(v, 12);
		}
	});
});

describe('lassoObjectiveValue', () => {
	it('matches a hand-computed value on a 2×2 problem', () => {
		// X = [[1, 0], [0, 1]], y = (1, 1), θ = (0.5, 0), λ = 0.2
		// F = ½((1−0.5)² + 1²) + 0.2·0.5 = ½(0.25 + 1) + 0.1 = 0.725
		const X = [
			[1, 0],
			[0, 1]
		];
		expect(lassoObjectiveValue([0.5, 0], X, [1, 1], 0.2)).toBeCloseTo(0.725, 12);
	});

	it('validates dimensions and lambda', () => {
		const X = [
			[1, 0],
			[0, 1]
		];
		expect(() => lassoObjectiveValue([1, 2, 3], X, [1, 1], 0.1)).toThrow(/2 entries/);
		expect(() => lassoObjectiveValue([1, 2], X, [1, 1], -1)).toThrow(/lambda/);
	});
});

describe('lassoLipschitzConstant (= λ_max(XᵀX))', () => {
	it('is 1 for orthonormal columns', () => {
		const X = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
		expect(lassoLipschitzConstant(X)).toBeCloseTo(1, 9);
	});

	it('scales like c² for X scaled by c', () => {
		const { X } = makeProblem(1, 20, 4);
		const L1 = lassoLipschitzConstant(X);
		const Xc = X.map((row) => row.map((v) => 3 * v));
		expect(lassoLipschitzConstant(Xc)).toBeCloseTo(9 * L1, 6);
	});

	it('equals the exact largest eigenvalue of XᵀX (independent construction)', () => {
		const { X } = makeProblem(2, 25, 5);
		const n = X.length,
			d = X[0].length;
		// Build XᵀX by direct outer-product summation (independent of matMul/transpose).
		const XtX: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
		for (let i = 0; i < n; i++) for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) XtX[a][b] += X[i][a] * X[i][b];
		expect(lassoLipschitzConstant(X)).toBeCloseTo(symmetricEigenvalues(XtX)[0], 6);
	});
});

describe('istaLassoStep', () => {
	it('one step from θ⁰=0 equals S_{λ/L}((1/L)·Xᵀy)', () => {
		const { X, y } = makeProblem(9, 30, 6);
		const lambda = 0.3;
		const L = lassoLipschitzConstant(X);
		const step = 1 / L;
		const stepResult = istaLassoStep(new Array(6).fill(0), X, y, lambda, step);
		const Xt = transpose(X, 30, 6);
		const Xty = matVec(Xt, y);
		// x¹ = prox_{step·(λ‖·‖₁)}(0 − step·(−Xᵀy)) = S_{λ·step}(step·Xᵀy)
		const expected = Xty.map((v) => softThreshold(v * step, lambda * step));
		expect(stepResult).toEqual(expected);
	});

	it('validates inputs', () => {
		const { X, y } = makeProblem(9, 30, 6);
		expect(() => istaLassoStep([0, 0], X, y, 0.1, 0.01)).toThrow(/6 entries/);
		expect(() => istaLassoStep(new Array(6).fill(0), X, y, 0.1, 0)).toThrow(/step/);
	});
});

describe('runProxLasso — cross-algorithm invariants', () => {
	const { X, y } = makeProblem(42, 60, 12);
	const lambda = 0.4;
	// Independent reference minimizer (exact coordinate descent, above).
	const thetaRef = referenceLasso(X, y, lambda);
	const F = (th: number[]) => lassoObjectiveValue(th, X, y, lambda);
	const Fstar = F(thetaRef);

	const run = (algo: 'ista' | 'fista' | 'admm', maxIter = 1500, extra: Record<string, unknown> = {}) =>
		runProxLasso(algo, X, y, lambda, { maxIter, referenceValue: Fstar, ...extra });

	it('ISTA converges to the coordinate-descent minimizer (objective + iterate)', () => {
		const r = run('ista');
		expect(F(r.theta) - Fstar).toBeLessThan(1e-6);
		const maxDelta = Math.max(...r.theta.map((v, j) => Math.abs(v - thetaRef[j])));
		expect(maxDelta).toBeLessThan(1e-4);
	});

	it('FISTA converges to the same minimizer', () => {
		const r = run('fista');
		expect(F(r.theta) - Fstar).toBeLessThan(1e-6);
		const maxDelta = Math.max(...r.theta.map((v, j) => Math.abs(v - thetaRef[j])));
		expect(maxDelta).toBeLessThan(1e-4);
	});

	it('ADMM converges to the same minimizer (x^k variable)', () => {
		for (const rho of [0.5, 1, 4]) {
			const r = run('admm', 2000, { rho });
			expect(F(r.theta) - Fstar).toBeLessThan(1e-4);
			const maxDelta = Math.max(...r.theta.map((v, j) => Math.abs(v - thetaRef[j])));
			expect(maxDelta).toBeLessThan(1e-2);
		}
	});

	it('FISTA beats ISTA in objective gap at equal iteration count (O(1/k²) vs O(1/k))', () => {
		const k = 300;
		const ista = runProxLasso('ista', X, y, lambda, { maxIter: k, referenceValue: Fstar });
		const fista = runProxLasso('fista', X, y, lambda, { maxIter: k, referenceValue: Fstar });
		expect(fista.objectiveGap[k]).toBeLessThan(ista.objectiveGap[k]);
	});

	it('ISTA objective values are (numerically) non-increasing at step 1/L', () => {
		const r = run('ista', 300);
		for (let k = 1; k < r.objectiveGap.length; k++) {
			expect(r.objectiveGap[k]).toBeLessThanOrEqual(r.objectiveGap[k - 1] + 1e-9);
		}
	});

	it('exact sparsity: λ ≥ max_j |(Xᵀy)_j| ⇒ the solution is exactly 0', () => {
		const Xt = transpose(X, X.length, X[0].length);
		const Xty = matVec(Xt, y);
		const lambdaBig = 2 * Math.max(...Xty.map(Math.abs));
		const r = runProxLasso('fista', X, y, lambdaBig, { maxIter: 20, referenceValue: 0 });
		// 0 is optimal: F(0) = ½‖y‖² = the reference, every iterate is exactly 0
		expect(r.theta.every((v) => v === 0)).toBe(true);
	});

	it('estimated referenceValue (no explicit F*) is a valid lower-bound estimate', () => {
		const r = runProxLasso('ista', X, y, lambda, { maxIter: 200 }); // reference estimated internally
		expect(r.referenceValue).toBeGreaterThan(0);
		expect(r.referenceValue).toBeCloseTo(Fstar, 4);
		// all gaps are non-negative (reference ≤ every observed F)
		expect(r.objectiveGap.every((g) => g >= -1e-12)).toBe(true);
	});

	it('validates inputs', () => {
		expect(() => runProxLasso('ista', X, y, -0.1, {})).toThrow(/lambda/);
		expect(() => runProxLasso('admm', X, y, lambda, { rho: 0 })).toThrow(/rho/);
		expect(() => runProxLasso('ista', X, y, lambda, { maxIter: 0 })).toThrow(/maxIter/);
		expect(() => runProxLasso('bogus' as never, X, y, lambda, {})).toThrow(/algorithm/);
		expect(() => runProxLasso('ista', X, y.slice(0, 5), lambda, {})).toThrow(/y must have/);
	});
});

describe('FistaLassoAnimator demo data (demoLassoData + runProxLasso)', () => {
	// Mirrors the demo exactly: n=60, d=12, seed 42, λ=0.4, ρ=1, 400 iters.
	const { X, y } = demoLassoData(60, 12, 42);
	const lambda = 0.4;
	const maxIter = 400;
	const refValue = estimateReferenceValue(X, y, lambda, 4000);

	const ista = runProxLasso('ista', X, y, lambda, { maxIter, referenceValue: refValue });
	const fista = runProxLasso('fista', X, y, lambda, { maxIter, referenceValue: refValue });
	const admm = runProxLasso('admm', X, y, lambda, { maxIter, rho: 1, referenceValue: refValue });

	it('demoLassoData is deterministic and non-degenerate', () => {
		const a = demoLassoData(60, 12, 42);
		const b = demoLassoData(60, 12, 42);
		expect(a.X).toEqual(b.X);
		expect(a.y).toEqual(b.y);
		expect(a.X).toHaveLength(60);
		expect(a.X[0]).toHaveLength(12);
		// The problem is not already solved at θ⁰ = 0 (the race has something
		// to show), and a small λ keeps the solution away from 0.
		expect(ista.objectiveGap[0]).toBeGreaterThan(1);
		expect(ista.theta.filter((v) => Math.abs(v) > 1e-12).length).toBeGreaterThan(0);
	});

	it('all three gaps stay finite and non-negative on the demo scale', () => {
		for (const r of [ista, fista, admm]) {
			for (const g of r.objectiveGap) {
				expect(Number.isFinite(g)).toBe(true);
				expect(g).toBeGreaterThanOrEqual(-1e-9);
			}
		}
	});

	it('all three converge (gap → 0) by k=400', () => {
		for (const r of [ista, fista, admm]) {
			expect(r.objectiveGap[maxIter]).toBeLessThan(1e-3);
		}
	});

	it('FISTA beats ISTA at k=100 and k=400 (the visible race)', () => {
		expect(fista.objectiveGap[100]).toBeLessThan(ista.objectiveGap[100]);
		expect(fista.objectiveGap[400]).toBeLessThan(ista.objectiveGap[400]);
	});

	it('ADMM z^k is exactly sparse early while x^k is dense', () => {
		// z^k = S_{λ/ρ}(·) → exact zeros; x^k = ridge solve → generally dense.
		expect(admm.zSparsity![0]).toBe(0);
		expect(admm.zSparsity![1]).toBeLessThan(admm.sparsity[1]);
		// Both sparsity trackers are bounded by d.
		for (const s of admm.zSparsity!) expect(s).toBeLessThanOrEqual(12);
		for (const s of admm.sparsity) expect(s).toBeLessThanOrEqual(12);
	});
});
