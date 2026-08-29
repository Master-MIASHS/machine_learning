/**
 * Benchmark test functions for optimization algorithms.
 * Each function exports { f, grad, hess } — the objective, analytical gradient, and analytical Hessian.
 */

type Func2D = (x: number, y: number) => number;
type Grad2D = (x: number, y: number) => [number, number];
type Hess2D = (x: number, y: number) => [[number, number], [number, number]];

interface TestFunc {
	f: Func2D;
	grad: Grad2D;
	hess: Hess2D;
	domain?: [[number, number], [number, number]];
	minimum?: [number, number];
	minValue?: number;
}

/** 2D Paraboloid (simple quadratic) */
export const paraboloid: TestFunc = {
	f: (x, y) => x * x + 4 * y * y,
	grad: (x, y) => [2 * x, 8 * y],
	hess: () => [
		[2, 0],
		[0, 8]
	],
	domain: [
		[-3, 3],
		[-3, 3]
	],
	minimum: [0, 0],
	minValue: 0
};

/** Rosenbrock function (banana valley) */
export const rosenbrock: TestFunc = {
	f: (x, y) => {
		const a = 1,
			b = 100;
		return (a - x) ** 2 + b * (y - x * x) ** 2;
	},
	grad: (x, y) => {
		const a = 1,
			b = 100;
		return [-2 * (a - x) - 4 * b * x * (y - x * x), 2 * b * (y - x * x)];
	},
	hess: (x, y) => {
		const b = 100;
		return [
			[2 - 4 * b * (y - 3 * x * x), -4 * b * x],
			[-4 * b * x, 2 * b]
		];
	},
	domain: [
		[-2, 2],
		[-1, 3]
	],
	minimum: [1, 1],
	minValue: 0
};

/** Elliptic quadratic */
export const ellipse: TestFunc = {
	f: (x, y) => (x * x) / 4 + y * y,
	grad: (x, y) => [x / 2, 2 * y],
	hess: () => [
		[0.5, 0],
		[0, 2]
	],
	domain: [
		[-4, 4],
		[-4, 4]
	],
	minimum: [0, 0],
	minValue: 0
};

/** Rastrigin function (multi-modal) */
export const rastrigin: TestFunc = {
	f: (x, y) => {
		const A = 10;
		return 2 * A + x * x - A * Math.cos(2 * Math.PI * x) + y * y - A * Math.cos(2 * Math.PI * y);
	},
	grad: (x, y) => [
		2 * x + 20 * Math.PI * Math.sin(2 * Math.PI * x),
		2 * y + 20 * Math.PI * Math.sin(2 * Math.PI * y)
	],
	hess: (x, y) => [
		[2 + 40 * Math.PI * Math.PI * Math.cos(2 * Math.PI * x), 0],
		[0, 2 + 40 * Math.PI * Math.PI * Math.cos(2 * Math.PI * y)]
	],
	domain: [
		[-5.12, 5.12],
		[-5.12, 5.12]
	],
	minimum: [0, 0],
	minValue: 0
};

/** Beale function */
export const beale: TestFunc = {
	f: (x, y) => {
		const a = x + 0.5 * y - 1.5;
		const b = x + 0.25 * y - 0.75;
		const c = 0.1 * x - 3 * y + 4;
		return a ** 2 + b ** 2 + c ** 2;
	},
	grad: (x, y) => {
		const a = x + 0.5 * y - 1.5;
		const b = x + 0.25 * y - 0.75;
		const c = 0.1 * x - 3 * y + 4;
		return [2 * a + 2 * b + 0.2 * c, a + 0.5 * b - 6 * c];
	},
	hess: () => [
		[4.02, 0.9],
		[0.9, 18.625]
	],
	domain: [
		[-4.5, 4.5],
		[-4.5, 4.5]
	],
	minimum: [0.6160337552742619, 1.359493670886076],
	minValue: 0.08438818565400845
};

/** Quadratic saddle (for demonstrating Hessian semi-definite cases) */
export const saddle: TestFunc = {
	f: (x, y) => x * x - y * y,
	grad: (x, y) => [2 * x, -2 * y],
	hess: () => [
		[2, 0],
		[0, -2]
	],
	domain: [
		[-3, 3],
		[-3, 3]
	]
};

/** Cubic function — critical point with zero Hessian (inflection point) */
export const cubicInflection: TestFunc = {
	f: (x, y) => x * x * x + y * y, // x³ + y²
	grad: (x, y) => [3 * x * x, 2 * y],
	hess: (x) => [
		[6 * x, 0],
		[0, 2]
	],
	domain: [
		[-2, 2],
		[-2, 2]
	]
};

/** Example from course: f(x,y) = x² - x⁴ - y⁴ (semi-definite Hessian at origin, but saddle point) */
export const semiDefSaddle: TestFunc = {
	f: (x, y) => x * x - x ** 4 - y ** 4,
	grad: (x, y) => [2 * x - 4 * x ** 3, -4 * y ** 3],
	hess: (x, y) => [
		[2 - 12 * x * x, 0],
		[0, -12 * y * y]
	],
	domain: [
		[-1.5, 1.5],
		[-1.5, 1.5]
	]
};

/** All test functions for iteration */
export const allTestFunctions: Record<string, TestFunc> = {
	paraboloid,
	rosenbrock,
	ellipse,
	rastrigin,
	beale,
	saddle,
	cubicInflection,
	semiDefSaddle
};
