import { describe, expect, it } from 'vitest';
import {
	allTestFunctions,
	beale,
	cubicInflection,
	ellipse,
	paraboloid,
	rastrigin,
	rosenbrock,
	saddle,
	semiDefSaddle
} from './test-functions';

type Vec2 = [number, number];

/** Central-difference gradient, h = 1e-5 (round-off ~1e-9, truncation ~1e-8 for these functions). */
function fdGrad(f: (x: number, y: number) => number, x: number, y: number): Vec2 {
	const h = 1e-5;
	return [
		(f(x + h, y) - f(x - h, y)) / (2 * h),
		(f(x, y + h) - f(x, y - h)) / (2 * h)
	];
}

/** Central-difference Hessian, h = 1e-4 (round-off ~1e-6 on the steepest test function). */
function fdHess(f: (x: number, y: number) => number, x: number, y: number) {
	const h = 1e-4;
	return {
		hxx: (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h),
		hyy: (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h),
		hxy:
			(f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h)
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
			const [x, y] = tf.minimum;
			expect(tf.f(x, y), `${name} f(minimum)`).toBeCloseTo(tf.minValue, 10);
			const g = tf.grad(x, y);
			expect(g[0], `${name} grad.x(minimum)`).toBeCloseTo(0, 8);
			expect(g[1], `${name} grad.y(minimum)`).toBeCloseTo(0, 8);
		}
	});

	it('allTestFunctions exposes exactly the eight benchmark functions', () => {
		expect(Object.keys(allTestFunctions).sort()).toEqual([
			'beale',
			'cubicInflection',
			'ellipse',
			'paraboloid',
			'rastrigin',
			'rosenbrock',
			'saddle',
			'semiDefSaddle'
		]);
	});
});
