import { describe, expect, it } from 'vitest';
import {
	allTestFunctions,
	beale,
	cubicInflection,
	ellipse,
	paraboloid,
	rastrigin,
	residualNorm,
	rosenbrock,
	saddle,
	semiDefSaddle
} from './test-functions';
import { runGD } from './gradient-descent';

type Vec2 = [number, number];

/** Central-difference gradient, h = 1e-5 (round-off ~1e-9, truncation ~1e-8 for these functions). */
function fdGrad(f: (x: number, y: number) => number, x: number, y: number): Vec2 {
	const h = 1e-5;
	return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
}

/** Central-difference Hessian, h = 1e-4 (round-off ~1e-6 on the steepest test function). */
function fdHess(f: (x: number, y: number) => number, x: number, y: number) {
	const h = 1e-4;
	return {
		hxx: (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h),
		hyy: (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h),
		hxy: (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h)
	};
}

const GRAD_POINTS: Vec2[] = [
	[0.7, 1.3],
	[-0.4, 0.9]
];

describe('test-functions', () => {
	it('analytical gradient matches central differences on every function', () => {
		for (const [name, tf] of Object.entries(allTestFunctions)) {
			for (const [x, y] of GRAD_POINTS) {
				const g = tf.grad(x, y);
				const fd = fdGrad(tf.f, x, y);
				expect(g[0], `${name} grad.x at (${x}, ${y})`).toBeCloseTo(fd[0], 5);
				expect(g[1], `${name} grad.y at (${x}, ${y})`).toBeCloseTo(fd[1], 5);
			}
		}
	});

	it('analytical Hessian matches central differences on every function', () => {
		for (const [name, tf] of Object.entries(allTestFunctions)) {
			const H = tf.hess(0.7, 1.3);
			const fd = fdHess(tf.f, 0.7, 1.3);
			expect(H[0][0], `${name} Hxx`).toBeCloseTo(fd.hxx, 4);
			expect(H[1][1], `${name} Hyy`).toBeCloseTo(fd.hyy, 4);
			expect(H[0][1], `${name} Hxy`).toBeCloseTo(fd.hxy, 4);
			expect(H[1][0], `${name} Hyx`).toBeCloseTo(fd.hxy, 4);
		}
	});

	it('paraboloid: closed forms', () => {
		expect(paraboloid.f(1.5, -2)).toBe(18.25);
		expect(paraboloid.f(0, 0)).toBe(0);
		expect(paraboloid.grad(0, 0)).toEqual([0, 0]);
		expect(paraboloid.grad(1, 2)).toEqual([2, 16]);
		expect(paraboloid.hess(0.3, -1.7)).toEqual([
			[2, 0],
			[0, 8]
		]);
	});

	it('rosenbrock: closed forms at the minimum and elsewhere', () => {
		expect(rosenbrock.f(1, 1)).toBe(0);
		expect(rosenbrock.f(0, 0)).toBe(1);
		// grad(1,1) evaluates to [-0, +0]; Object.is would reject it
		expect(rosenbrock.grad(1, 1)[0]).toBeCloseTo(0, 12);
		expect(rosenbrock.grad(1, 1)[1]).toBeCloseTo(0, 12);
		expect(rosenbrock.hess(1, 1)).toEqual([
			[802, -400],
			[-400, 200]
		]);
	});

	it('ellipse: closed forms', () => {
		expect(ellipse.f(2, -3)).toBe(10);
		expect(ellipse.grad(0, 0)).toEqual([0, 0]);
		expect(ellipse.hess(0, 0)).toEqual([
			[0.5, 0],
			[0, 2]
		]);
	});

	it('rastrigin: value 0 at origin and f(k, l) = k² + l² on the integer lattice', () => {
		expect(rastrigin.f(0, 0)).toBe(0);
		expect(rastrigin.grad(0, 0)).toEqual([0, 0]);
		const lattice: Array<[number, number, number]> = [
			[1, 0, 1],
			[-1, 1, 2],
			[2, -1, 5]
		];
		for (const [x, y, v] of lattice) {
			expect(rastrigin.f(x, y), `rastrigin.f(${x}, ${y})`).toBeCloseTo(v, 10);
		}
		const H = rastrigin.hess(0, 0);
		expect(H[0][0]).toBeCloseTo(2 + 40 * Math.PI * Math.PI, 12);
		expect(H[0][1]).toBeCloseTo(0, 12); // -0 at the origin, Object.is would reject it
		expect(H[1][1]).toBeCloseTo(2 + 40 * Math.PI * Math.PI, 12);
	});

	it('beale: value equals a² + b² + c² and the Hessian is the constant quadratic form', () => {
		for (const [x, y] of GRAD_POINTS) {
			const a = x + 0.5 * y - 1.5;
			const b = x + 0.25 * y - 0.75;
			const c = 0.1 * x - 3 * y + 4;
			expect(beale.f(x, y)).toBeCloseTo(a * a + b * b + c * c, 13);
		}
		expect(beale.hess(0.3, -0.7)).toEqual([
			[4.02, 0.9],
			[0.9, 18.625]
		]);
	});

	it('saddle: indefinite Hessian and saddle-shaped values', () => {
		expect(saddle.hess(0.4, -0.2)).toEqual([
			[2, 0],
			[0, -2]
		]);
		const H = saddle.hess(0, 0);
		expect(H[0][0] * H[1][1] - H[0][1] * H[1][0]).toBeLessThan(0);
		expect(saddle.f(1.4, 0.8)).toBeCloseTo(1.4 * 1.4 - 0.8 * 0.8, 12);
	});

	it('cubicInflection: zero gradient at the origin with a semi-definite Hessian', () => {
		expect(cubicInflection.grad(0, 0)).toEqual([0, 0]);
		expect(cubicInflection.hess(0, 0)).toEqual([
			[0, 0],
			[0, 2]
		]);
		expect(cubicInflection.f(1.4, -0.6)).toBeCloseTo(1.4 ** 3 + 0.36, 12);
	});

	it('semiDefSaddle: PSD Hessian at the origin, negative along y, positive along x', () => {
		const H = semiDefSaddle.hess(0, 0);
		// element-wise: H[1][1] = −12·y² evaluates to -0 at y = 0
		expect(H[0][0]).toBe(2);
		expect(H[0][1]).toBeCloseTo(0, 12);
		expect(H[1][0]).toBeCloseTo(0, 12);
		expect(H[1][1]).toBeCloseTo(0, 12);
		expect(H[0][0]).toBeGreaterThanOrEqual(0);
		expect(H[1][1]).toBeGreaterThanOrEqual(0);
		expect(H[0][0] * H[1][1] - H[0][1] * H[1][0]).toBeCloseTo(0, 12);
		expect(semiDefSaddle.f(0, 0.5)).toBeLessThan(0);
		expect(semiDefSaddle.f(0.5, 0)).toBeGreaterThan(0);
	});

	it('minimum metadata is a true stationary point at the stated value', () => {
		for (const [name, tf] of Object.entries(allTestFunctions)) {
			if (tf.minimum === undefined || tf.minValue === undefined) continue;
			// residualNorm: non-differentiable (cone tip) at its global minima — tested separately.
			if (tf === residualNorm) continue;
			const [x, y] = tf.minimum;
			expect(tf.f(x, y), `${name} f(minimum)`).toBeCloseTo(tf.minValue, 10);
			const g = tf.grad(x, y);
			expect(g[0], `${name} grad.x(minimum)`).toBeCloseTo(0, 8);
			expect(g[1], `${name} grad.y(minimum)`).toBeCloseTo(0, 8);
		}
	});

	it('allTestFunctions exposes exactly the nine benchmark functions', () => {
		expect(Object.keys(allTestFunctions).sort()).toEqual([
			'beale',
			'cubicInflection',
			'ellipse',
			'paraboloid',
			'rastrigin',
			'residualNorm',
			'rosenbrock',
			'saddle',
			'semiDefSaddle'
		]);
	});

	describe('residualNorm: f = √((x² + y − 2)² + (x + y² − 7)²)', () => {
		const r = (x: number, y: number): Vec2 => [x * x + y - 2, x + y * y - 7];
		// Global minima: real roots of x⁴ − 4x² + x − 3 = 0 (from y = 2 − x² substituted into r₂ = 0).
		const quartic = (x: number) => x ** 4 - 4 * x * x + x - 3;
		const GLOBAL_X = [2.055163920119653, -2.245123485562594];
		// Smooth critical points of g = f² (independently solved with scipy fsolve on ∇g = 0).
		const LOCAL_MIN: Vec2 = [0.09596849258911525, 2.6050216404915707];
		const SADDLES: Vec2[] = [
			[-0.1003956403530436, -2.49014796978105],
			[1.8130859745696095, 0.1378864562996496]
		];

		it('f² equals the sum of squared residuals', () => {
			for (const [x, y] of [...GRAD_POINTS, [3, -1] as Vec2, [-2.5, 0.4] as Vec2]) {
				const [r1, r2] = r(x, y);
				expect(residualNorm.f(x, y) ** 2).toBeCloseTo(r1 * r1 + r2 * r2, 10);
			}
			expect(residualNorm.f(0, 0)).toBeCloseTo(Math.sqrt(53), 12);
		});

		it('vanishes at both real roots of the quartic (the two global minima)', () => {
			for (const x of GLOBAL_X) {
				expect(quartic(x)).toBeCloseTo(0, 12);
				expect(residualNorm.f(x, 2 - x * x)).toBeCloseTo(0, 12);
			}
		});

		it('gradient stays finite at the (floating-point) global minimum', () => {
			// ‖r‖ ≈ 1e-14 there: Jᵀr/‖r‖ must still be finite (and is [0, 0] if ‖r‖ is exactly 0).
			const [x, y] = residualNorm.minimum!;
			const g = residualNorm.grad(x, y);
			expect(Number.isFinite(g[0]) && Number.isFinite(g[1])).toBe(true);
		});

		it('is non-smooth at a global minimum: ‖∇f‖ stays bounded away from 0 nearby', () => {
			// Near a simple zero x* of r, f(x* + h) ≈ ‖J h‖ so ‖∇f‖ ≥ σ_min(J(x*)) > 0.
			const [xs, ys] = residualNorm.minimum!;
			for (const eps of [1e-2, 1e-4, 1e-6]) {
				for (const [dx, dy] of [
					[eps, 0],
					[0, eps],
					[-eps, eps]
				]) {
					const g = residualNorm.grad(xs + dx, ys + dy);
					expect(Math.hypot(g[0], g[1])).toBeGreaterThan(3);
				}
			}
			// Directional derivatives in opposite directions do not cancel (kink, like |t|).
			const gp = residualNorm.grad(xs + 1e-6, ys);
			const gm = residualNorm.grad(xs - 1e-6, ys);
			expect(gp[0] * gm[0]).toBeLessThan(0);
		});

		it('has a smooth, strict, non-global local minimum with f ≈ 0.6254', () => {
			const [x, y] = LOCAL_MIN;
			const g = residualNorm.grad(x, y);
			expect(Math.hypot(g[0], g[1])).toBeLessThan(1e-6);
			expect(residualNorm.f(x, y)).toBeCloseTo(0.6254433526, 8);
			const H = residualNorm.hess(x, y);
			expect(H[0][0]).toBeGreaterThan(0);
			expect(H[0][0] * H[1][1] - H[0][1] * H[1][0]).toBeGreaterThan(0);
		});

		it('has two saddle points (indefinite Hessian, zero gradient)', () => {
			for (const [x, y] of SADDLES) {
				const g = residualNorm.grad(x, y);
				expect(Math.hypot(g[0], g[1])).toBeLessThan(1e-6);
				const H = residualNorm.hess(x, y);
				expect(H[0][0] * H[1][1] - H[0][1] * H[1][0]).toBeLessThan(0);
			}
		});

		it('constant-step GD from (0, 0) is trapped in the local minimum (demo default)', () => {
			const tr = runGD(0, 0, residualNorm.grad, residualNorm.f, {
				alpha: 0.03,
				maxIter: 2000,
				tol: 1e-3
			});
			const last = tr[tr.length - 1];
			expect(last.gradNorm!).toBeLessThan(1e-3);
			expect(last.x).toBeCloseTo(LOCAL_MIN[0], 2);
			expect(last.y).toBeCloseTo(LOCAL_MIN[1], 2);
		});

		it('constant-step GD toward a global minimum zigzags: ‖∇f‖ never drops below 1', () => {
			const tr = runGD(3.5, -0.5, residualNorm.grad, residualNorm.f, { alpha: 0.01, maxIter: 400 });
			const tail = tr.slice(-50);
			for (const p of tail) {
				expect(p.gradNorm!).toBeGreaterThan(1);
				expect(p.fVal!).toBeLessThan(0.2); // but the iterates do sit near the cone tip
			}
		});
	});
});
