/**
 * Tests for subgradient.ts (expert lesson « Introduction au sous-gradient »,
 * Part I). Content beyond course_sources/ — see the module header for the
 * primary references (Rockafellar 1970; Boyd et al., EE364b notes;
 * Nesterov 2004; Tibshirani 1996; Hastie et al. 2009).
 *
 * Strategy (AGENTS.md): closed-form values, invariants (0 ∈ ∂F at the
 * computed minimizer, monotone f_best), independent cross-checks (prox
 * operator, ISTA on an orthonormal design, brute-force grid minimization),
 * and input validation.
 */
import { describe, it, expect } from 'vitest';
import {
	oneSidedDerivatives,
	absSubdifferential,
	l1Subdifferential,
	isSubgradient1D,
	convex1D,
	convex1DSubdifferential,
	lassoOrthonormal1D,
	lassoOptimalityResidual,
	lassoOrthonormal,
	orthonormalColumns,
	orthonormalityDefect,
	subgradientMethod,
	weightedL1,
	supportLineSegment,
	lassoSubdiffGraph,
	ridgeOrthonormal1D,
	type Convex1DName
} from './subgradient.js';
import { proxL1, runProxLasso, lassoObjectiveValue } from './proximal.js';
import { linspace, mulberry32, combineSeed, matVec } from './util.js';

const GRID = linspace(-5, 5, 2001);

describe('1-D subderivatives', () => {
	it('∂|·|(0) = [−1, 1] and {±1} elsewhere', () => {
		expect(absSubdifferential(0)).toEqual([-1, 1]);
		expect(absSubdifferential(2.5)).toEqual([1, 1]);
		expect(absSubdifferential(-0.1)).toEqual([-1, -1]);
	});

	it('one-sided derivatives recover the subdifferential of each test function', () => {
		const names: Convex1DName[] = ['abs', 'relu', 'square', 'hinge'];
		for (const name of names) {
			for (const x of [-1.3, 0, 0.7, 1, 2]) {
				const [lo, hi] = oneSidedDerivatives(convex1D(name), x);
				const [elo, ehi] = convex1DSubdifferential(name, x);
				expect(lo, `${name} at ${x}`).toBeCloseTo(elo, 4);
				expect(hi, `${name} at ${x}`).toBeCloseTo(ehi, 4);
			}
		}
	});

	it('the subgradient inequality holds exactly for c in ∂f(x) and fails just outside', () => {
		const names: Convex1DName[] = ['abs', 'relu', 'square', 'hinge'];
		for (const name of names) {
			const f = convex1D(name);
			for (const x of [-2, 0, 1, 1.5]) {
				const [lo, hi] = convex1DSubdifferential(name, x);
				for (const c of linspace(lo, hi, 5)) expect(isSubgradient1D(f, x, c, GRID)).toBe(true);
				expect(isSubgradient1D(f, x, lo - 0.05, GRID), `${name} ${x} below`).toBe(false);
				expect(isSubgradient1D(f, x, hi + 0.05, GRID), `${name} ${x} above`).toBe(false);
			}
		}
	});

	it('|·| at 0: c = 1.1 is not a subderivative; x² at 1: only c = 2', () => {
		expect(isSubgradient1D(Math.abs, 0, 1.1, GRID)).toBe(false);
		expect(isSubgradient1D(Math.abs, 0, -1, GRID)).toBe(true);
		const sq = (x: number) => x * x;
		expect(isSubgradient1D(sq, 1, 2, GRID)).toBe(true);
		expect(isSubgradient1D(sq, 1, 1.95, GRID)).toBe(false);
		expect(isSubgradient1D(sq, 1, 2.05, GRID)).toBe(false);
	});

	it('∂‖w‖₁ is the product of the ∂|w_j|', () => {
		expect(l1Subdifferential([2, 0, -3])).toEqual([
			[1, 1],
			[-1, 1],
			[-1, -1]
		]);
	});
});

describe('Lasso with orthonormal design', () => {
	it('closed-form soft-thresholding values', () => {
		expect(lassoOrthonormal1D(3, 1)).toBe(2);
		expect(lassoOrthonormal1D(-3, 1)).toBe(-2);
		expect(lassoOrthonormal1D(0.8, 1)).toBe(0);
		expect(lassoOrthonormal1D(-1, 1)).toBe(0); // |z| = λ: boundary of the zero set
		expect(lassoOrthonormal1D(1.7, 0)).toBe(1.7); // λ = 0: OLS
	});

	it('exercise E.3: z = (3, −0.5, 1.2), λ = 1 → (2, 0, 0.2)', () => {
		const w = [3, -0.5, 1.2].map((z) => lassoOrthonormal1D(z, 1));
		expect(w[0]).toBeCloseTo(2, 12);
		expect(w[1]).toBe(0);
		expect(w[2]).toBeCloseTo(0.2, 12);
	});

	it('invariant: 0 ∈ ∂F at the soft-thresholded point, and not elsewhere', () => {
		for (const lambda of [0, 0.3, 1, 2.5]) {
			for (const z of linspace(-4, 4, 41)) {
				const w = lassoOrthonormal1D(z, lambda);
				expect(lassoOptimalityResidual([w], [z], lambda)).toBeLessThan(1e-12);
				expect(lassoOptimalityResidual([w + 0.1], [z], lambda)).toBeGreaterThan(0.05);
			}
		}
	});

	it('matches a brute-force grid minimization of ½(w − z)² + λ|w|', () => {
		const fine = linspace(-6, 6, 120001);
		for (const [z, lambda] of [
			[2.3, 0.7],
			[-0.4, 1],
			[-3.1, 1.5]
		]) {
			let best = fine[0];
			let bestVal = Infinity;
			for (const w of fine) {
				const v = 0.5 * (w - z) ** 2 + lambda * Math.abs(w);
				if (v < bestVal) {
					bestVal = v;
					best = w;
				}
			}
			expect(lassoOrthonormal1D(z, lambda)).toBeCloseTo(best, 3);
		}
	});

	it('ridge counterpart z/(1+λ) zeroes the derivative and never vanishes for z ≠ 0', () => {
		for (const [z, lambda] of [
			[2, 1],
			[-0.3, 2.5],
			[0.05, 3]
		]) {
			const w = ridgeOrthonormal1D(z, lambda);
			expect(w - z + lambda * w).toBeCloseTo(0, 12);
			expect(w).not.toBe(0);
		}
		expect(ridgeOrthonormal1D(2, 1)).toBe(1);
	});

	it('orthonormalColumns really has XᵀX = I', () => {
		expect(orthonormalityDefect(orthonormalColumns(30, 6, 3))).toBeLessThan(1e-12);
	});

	it('equals prox_{λ‖·‖₁}(Xᵀy) and the ISTA solution (independent solver)', () => {
		const X = orthonormalColumns(40, 5, 11);
		const rng = mulberry32(combineSeed(11, 1));
		const y = Array.from({ length: 40 }, () => rng() * 4 - 2);
		const lambda = 0.4;
		const w = lassoOrthonormal(X, y, lambda);
		const Xty = Array.from({ length: 5 }, (_, j) => X.reduce((s, row, i) => s + row[j] * y[i], 0));
		const prox = proxL1(Xty, lambda);
		w.forEach((wj, j) => expect(wj).toBeCloseTo(prox[j], 12));

		const ista = runProxLasso('ista', X, y, lambda, { maxIter: 200 });
		w.forEach((wj, j) => expect(wj).toBeCloseTo(ista.theta[j], 8));

		// minimality against random perturbations
		const F0 = lassoObjectiveValue(w, X, y, lambda);
		for (let k = 0; k < 50; k++) {
			const p = w.map((wj) => wj + (rng() - 0.5) * 0.2);
			expect(lassoObjectiveValue(p, X, y, lambda)).toBeGreaterThanOrEqual(F0 - 1e-12);
		}
		// fitted values are well defined
		expect(matVec(X, w)).toHaveLength(40);
	});

	it('rejects a non-orthonormal design and negative λ', () => {
		expect(() =>
			lassoOrthonormal(
				[
					[1, 1],
					[0, 1]
				],
				[1, 1],
				0.5
			)
		).toThrow(/orthonormal/);
		expect(() => lassoOrthonormal1D(1, -0.1)).toThrow(/lambda/);
		expect(() => lassoOptimalityResidual([1], [1, 2], 1)).toThrow();
	});
});

describe('subgradient method', () => {
	const absF = weightedL1([1], [0]);

	it('constant step on |x|: oscillates, f is not monotone, f_best stalls in (0, t/2]', () => {
		const t = 0.3;
		const res = subgradientMethod({ ...absF, x0: [1], step: 'constant', t0: t, iters: 50 });
		// iterates 1, 0.7, 0.4, 0.1, −0.2, 0.1, −0.2, …
		expect(res.xs[3][0]).toBeCloseTo(0.1, 12);
		expect(res.xs[4][0]).toBeCloseTo(-0.2, 12);
		expect(res.values[4]).toBeGreaterThan(res.values[3]); // not a descent method
		const fb = res.best[res.best.length - 1];
		expect(fb).toBeGreaterThan(0);
		expect(fb).toBeLessThanOrEqual(t / 2 + 1e-12);
		expect(res.best[10]).toBeCloseTo(fb, 12); // stalled
	});

	it('diminishing step t0/√(k+1): f_best → 0, and f_best is non-increasing', () => {
		const res = subgradientMethod({ ...absF, x0: [1], step: 'diminishing', t0: 0.5, iters: 2000 });
		for (let k = 1; k < res.best.length; k++) expect(res.best[k]).toBeLessThanOrEqual(res.best[k - 1]);
		expect(res.best[2000]).toBeLessThan(0.02);
	});

	it('2-D weighted ℓ1: the diminishing rule beats the constant one at the same t0', () => {
		const g = weightedL1([1, 3], [0.5, -0.3]);
		const common = { ...g, x0: [2, 1.5], t0: 0.4, iters: 400 };
		const c = subgradientMethod({ ...common, step: 'constant' });
		const d = subgradientMethod({ ...common, step: 'diminishing' });
		expect(d.best[400]).toBeLessThan(c.best[400]);
	});

	it('validates its inputs', () => {
		expect(() => subgradientMethod({ ...absF, x0: [1], step: 'constant', t0: 0.1, iters: 0 })).toThrow(/iters/);
		expect(() => subgradientMethod({ ...absF, x0: [1], step: 'constant', t0: 0, iters: 5 })).toThrow(/t0/);
		expect(() => weightedL1([1, -1], [0, 0])).toThrow(/weights/);
	});
});

describe('demo geometry helpers', () => {
	const box = { xMin: -3, xMax: 3, yMin: -1, yMax: 4 };

	it('supportLineSegment stays in the box and lies on the line', () => {
		for (const c of [-2, -0.5, 0, 0.7, 3]) {
			const seg = supportLineSegment(1, 0.5, c, box);
			expect(seg).not.toBeNull();
			for (const [x, y] of seg!) {
				expect(x).toBeGreaterThanOrEqual(box.xMin - 1e-12);
				expect(x).toBeLessThanOrEqual(box.xMax + 1e-12);
				expect(y).toBeGreaterThanOrEqual(box.yMin - 1e-12);
				expect(y).toBeLessThanOrEqual(box.yMax + 1e-12);
				expect(y).toBeCloseTo(1 + c * (x - 0.5), 12);
			}
		}
		expect(supportLineSegment(10, 0, 0, box)).toBeNull();
		// horizontal line inside the box spans the full width
		expect(supportLineSegment(0, 0, 0, box)).toEqual([
			[-3, 0],
			[3, 0]
		]);
	});

	it('lassoSubdiffGraph crosses the axis exactly at S(z, λ)', () => {
		for (const [z, lambda] of [
			[2, 0.5],
			[0.3, 1],
			[-2.5, 1]
		]) {
			const { left, jump, right } = lassoSubdiffGraph(z, lambda, 5);
			const w = lassoOrthonormal1D(z, lambda);
			if (w > 0) {
				// on the right branch y = w − z + λ
				expect(right[0][1] + (w - right[0][0])).toBeCloseTo(0, 12);
			} else if (w < 0) {
				expect(left[1][1] + (w - left[1][0])).toBeCloseTo(0, 12);
			} else {
				expect(jump[0][1]).toBeLessThanOrEqual(0);
				expect(jump[1][1]).toBeGreaterThanOrEqual(0);
			}
		}
	});
});
