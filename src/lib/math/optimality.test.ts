import { describe, it, expect } from 'vitest';
import {
	hessian2D,
	isPositiveDefinite,
	isSemiDefinitePositive,
	eigenvalues2x2,
	findCriticalPoints,
	gradNorm
} from '../math/optimality.js';
import {
	paraboloid,
	rosenbrock,
	saddle,
	semiDefSaddle,
	cubicInflection
} from '../math/test-functions.js';

describe('hessian2D', () => {
	it('returns exact Hessian for paraboloid f(x,y) = x² + 4y²', () => {
		const h = hessian2D(paraboloid.f, 1, 1);
		expect(h[0]).toBeCloseTo(2, 4); // d²f/dx²
		expect(h[3]).toBeCloseTo(8, 4); // d²f/dy²
		expect(Math.abs(h[1])).toBeLessThan(0.01); // mixed ≈ 0
	});

	it('returns a positive definite Hessian at Rosenbrock minimum (1, 1)', () => {
		const h = hessian2D(rosenbrock.f, 1, 1);
		expect(isPositiveDefinite(h)).toBe(true); // H should be PD at the minimum
	});

	it('finite difference Hessian is symmetric for smooth functions', () => {
		const h = hessian2D(paraboloid.f, 0.5, -1.2);
		expect(Math.abs(h[1] - h[2])).toBeLessThan(0.01); // mixed partials equal (Clairaut's theorem)
	});

	it('Hessian at Rosenbrock minimum has large diagonal entries', () => {
		const h = hessian2D(rosenbrock.f, 1, 1);
		// f(x,y)=(a-x)²+b(y-x²)² with a=1,b=100 → H(1,1)≈[[802,-400],[-400,200]]
		expect(h[0]).toBeGreaterThan(700); // hxx ≈ 802
		expect(Math.abs(h[3]) - 200).toBeLessThan(50); // hyy ≈ 200
	});
});

describe('isPositiveDefinite', () => {
	it('returns true for paraboloid Hessian [[2,0],[0,8]]', () => {
		expect(isPositiveDefinite([2, 0, 0, 8])).toBe(true);
	});

	it('returns false for saddle Hessian [[2,0],[0,-2]]', () => {
		expect(isPositiveDefinite([2, 0, 0, -2])).toBe(false);
	});

	it('returns true for Rosenbrock minimum Hessian [[802,-400],[-400,200]]', () => {
		expect(isPositiveDefinite([802, -400, -400, 200])).toBe(true);
	});

	it('returns false for zero matrix', () => {
		expect(isPositiveDefinite([0, 0, 0, 0])).toBe(false);
	});
});

describe('isSemiDefinitePositive', () => {
	it('returns true for positive definite matrices', () => {
		expect(isSemiDefinitePositive([2, 0, 0, 8])).toBe(true);
	});

	it('returns true when eigenvalues are [1, 0]', () => {
		expect(isSemiDefinitePositive([1, 0, 0, 0])).toBe(true); // semi-definite positive
	});

	it('returns false for indefinite matrices', () => {
		expect(isSemiDefinitePositive([2, 0, 0, -2])).toBe(false);
	});

	it('returns true for semi-def Saddle at origin (Hessian = [[2,0],[0,0]])', () => {
		const h = hessian2D(semiDefSaddle.f, 0, 0);
		expect(isSemiDefinitePositive(h)).toBe(true);
	});

	it('returns false for negative definite matrix [[-1,0],[0,-2]]', () => {
		expect(isSemiDefinitePositive([-1, 0, 0, -2])).toBe(false);
	});
});

describe('eigenvalues2x2', () => {
	it('returns [8, 2] for diagonal [[2,0],[0,8]]', () => {
		const [l1, l2] = eigenvalues2x2([2, 0, 0, 8]);
		expect(l1).toBeCloseTo(8);
		expect(l2).toBeCloseTo(2);
	});

	it('trace equals sum of eigenvalues', () => {
		const m: [number, number, number, number] = [3, 1, 1, 2];
		const [l1, l2] = eigenvalues2x2(m);
		expect(l1 + l2).toBeCloseTo(5); // trace = a+d = 3+2
	});

	it('determinant equals product of eigenvalues', () => {
		const m: [number, number, number, number] = [4, 0, 0, 9];
		const [l1, l2] = eigenvalues2x2(m);
		expect(l1 * l2).toBeCloseTo(36); // det = 4*9 - 0
	});

	it('eigenvalues of [[1,1],[1,-1]] have correct trace and determinant', () => {
		const m: [number, number, number, number] = [1, 1, 1, -1];
		const [l1, l2] = eigenvalues2x2(m);

		expect(l1 + l2).toBeCloseTo(0); // trace = 1 + (-1) = 0
		expect(Math.abs(l1 * l2)).toBeCloseTo(2); // |det| = |-1 - 1| = 2
	});

	it('eigenvalues are ordered largest first', () => {
		const m: [number, number, number, number] = [2, 0, 0, 8];
		const [l1, l2] = eigenvalues2x2(m);

		expect(l1 >= l2).toBe(true);
	});

	it('eigenvalues of identity are both 1', () => {
		const m: [number, number, number, number] = [1, 0, 0, 1];
		const [l1, l2] = eigenvalues2x2(m);
		expect(l1).toBeCloseTo(1);
		expect(l2).toBeCloseTo(1);
	});
});

describe('gradNorm', () => {
	it('returns 0 at the origin for paraboloid ∇f = [2x, 8y]', () => {
		expect(gradNorm(paraboloid.grad, 0, 0)).toBe(0);
	});

	it('matches manual computation', () => {
		const g = gradNorm(paraboloid.grad, 1, 1);
		// ∇f(1,1) = [2, 8] → ||∇f|| = √(4+64) = √68 ≈ 8.246
		expect(g).toBeCloseTo(Math.sqrt(68), 5);
	});

	it('increases with distance from minimum for paraboloid', () => {
		const g1 = gradNorm(paraboloid.grad, 0.5, 0.5);
		const g2 = gradNorm(paraboloid.grad, 2, 2);
		expect(g2).toBeGreaterThan(g1);
	});

	it('gradient norm at Rosenbrock minimum is zero', () => {
		const g = gradNorm(rosenbrock.grad, 1, 1);
		expect(Math.abs(g)).toBeLessThan(1e-10);
	});
});

describe('findCriticalPoints', () => {
	it('finds exactly one critical point for the paraboloid x² + 4y² on [−3, 3]²', () => {
		const cps = findCriticalPoints(paraboloid.f, paraboloid.grad, [
			[-3, 3],
			[-3, 3]
		]);
		expect(cps.length).toBe(1);
		expect(cps[0].type).toBe('minimum');
		expect(Math.abs(cps[0].x)).toBeLessThan(1e-3);
		expect(Math.abs(cps[0].y)).toBeLessThan(1e-3);
		expect(Math.abs(cps[0].fVal)).toBeLessThan(1e-6);
	});

	it('finds the saddle point of f(x, y) = x² − y² at (0, 0)', () => {
		const cps = findCriticalPoints(saddle.f, saddle.grad, [
			[-3, 3],
			[-3, 3]
		]);
		const sp = cps.find((cp) => cp.type === 'saddle');
		expect(sp).toBeDefined();
		expect(Math.abs(sp!.x)).toBeLessThan(1e-3);
		expect(Math.abs(sp!.y)).toBeLessThan(1e-3);
	});

	it('finds the Rosenbrock minimum at (1, 1) with vanishing gradient', () => {
		const cps = findCriticalPoints(rosenbrock.f, rosenbrock.grad, [
			[-2, 2],
			[-1, 3]
		]);
		const min = cps.find((cp) => cp.type === 'minimum');
		expect(min).toBeDefined();
		expect(Math.abs(min!.x - 1)).toBeLessThan(1e-3);
		expect(Math.abs(min!.y - 1)).toBeLessThan(1e-3);
		expect(min!.gradNormAtPoint).toBeLessThan(1e-6);
		expect(min!.fVal).toBeLessThan(1e-6);
	});

	it('classifies the maximum of f(x, y) = −x² − y² at (0, 0)', () => {
		const f = (x: number, y: number) => -x * x - y * y;
		const grad = (x: number, y: number): [number, number] => [-2 * x, -2 * y];
		const cps = findCriticalPoints(f, grad, [
			[-3, 3],
			[-3, 3]
		]);
		const max = cps.find((cp) => cp.type === 'maximum');
		expect(max).toBeDefined();
		expect(Math.abs(max!.x)).toBeLessThan(1e-3);
		expect(Math.abs(max!.y)).toBeLessThan(1e-3);
	});

	it('returns critical points with negligible gradient norm', () => {
		const cps = findCriticalPoints(rosenbrock.f, rosenbrock.grad, [
			[-2, 2],
			[-1, 3]
		]);

		expect(cps.length).toBeGreaterThan(0);
		for (const cp of cps) {
			expect(cp.gradNormAtPoint).toBeLessThan(0.1);
		}
	});

	it('deduplicates nearby critical points', () => {
		const cps = findCriticalPoints(
			saddle.f,
			saddle.grad,
			[
				[-3, 3],
				[-3, 3]
			],
			200
		);
		const saddles = cps.filter((cp) => cp.type === 'saddle');
		expect(saddles.length).toBeLessThanOrEqual(1); // Only one saddle at origin
	});

	it('critical points have reasonable f values', () => {
		const cps = findCriticalPoints(saddle.f, saddle.grad, [
			[-3, 3],
			[-3, 3]
		]);

		expect(cps.length).toBeGreaterThan(0);
		for (const cp of cps) {
			expect(cp.fVal).toBeCloseTo(0, 2); // Saddle at origin has f=0 for x²-y²
		}
	});

	it('cubic inflection: gradient at origin is zero', () => {
		const g = gradNorm(cubicInflection.grad, 0, 0);
		expect(g).toBeCloseTo(0, 5); // ∇f(0,0) = [3x², 2y] at (0,0) → [0,0] for x³+y²
	});

	it('findCriticalPoints classifies points correctly', () => {
		const cps = findCriticalPoints(saddle.f, saddle.grad, [
			[-3, 3],
			[-3, 3]
		]);
		expect(cps.length).toBeGreaterThan(0);
		for (const cp of cps) {
			expect(['minimum', 'maximum', 'saddle', 'inconclusive'].includes(cp.type)).toBe(true);
		}
	});

	it('deduplicates signed zero residuals for the degenerate saddle', () => {
		const cps = findCriticalPoints(semiDefSaddle.f, semiDefSaddle.grad, semiDefSaddle.domain!);

		expect(cps).toHaveLength(3);
		expect(cps.some((cp) => cp.x === 0 && cp.y === 0)).toBe(true);
		for (const cp of cps) {
			expect(Object.is(cp.x, -0)).toBe(false);
			expect(Object.is(cp.y, -0)).toBe(false);
		}

		const xs = cps.map((cp) => cp.x).sort((a, b) => a - b);
		expect(xs[0]).toBeCloseTo(-1 / Math.sqrt(2), 4);
		expect(xs[1]).toBe(0);
		expect(xs[2]).toBeCloseTo(1 / Math.sqrt(2), 4);
	});
});
