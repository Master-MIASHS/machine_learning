/**
 * Benchmark test functions for optimization algorithms.
 * Each function exports { f, grad, hess } — the objective, analytical gradient, and analytical Hessian.
 *
 * SUITE DE BENCHMARK GÉNÉRALE — pas de correspondance dans course_sources/.
 * Les fonctions (paraboloid, rosenbrock, ellipse, rastrigin, beale,
 * saddle, cubicInflection, semiDefSaddle, residualNorm) sont des benchmarks standards,
 * au-delà du cours. Elles alimentent les démos de
 * course_sources/typst/optim.typ : ch. 1 (conditions d'optimalité,
 * Théorèmes 1.3–1.7, coercivité — Définition 1.11 / Théorème 1.12) et
 * ch. 3 (GD — Algorithme 3.1, momentum — 3.6, Nesterov — 3.8, Newton —
 * Algorithme 3.13 / Théorème 3.14, descente par coordonnées — Algorithme
 * 3.13 / Théorème 3.16, SGD/mini-batch — 3.9–3.12).
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

/**
 * Norme d'un résidu non linéaire :
 *   f(x, y) = ‖r(x, y)‖₂ = √((x² + y − 2)² + (x + y² − 7)²),  r = (x² + y − 2, x + y² − 7).
 *
 * Benchmark — pas dans course_sources/ (fonction fournie par l'enseignant pour les démos de
 * course_sources/typst/optim.typ ch. 3, Algorithme 3.1 GD / 3.6 momentum). Proche de
 * Himmelblau (qui utilise x² + y − 11) mais avec la constante 2 et surtout la racine carrée,
 * qui change la nature des minima. Points remarquables (calculés numériquement, cf. tests) :
 *  - 2 minima globaux, f = 0, aux zéros réels de r : y = 2 − x² avec x⁴ − 4x² + x − 3 = 0,
 *    soit (2.055164, −2.223699) et (−2.245123, −3.040579). En ces points f est une
 *    « pointe de cône » (r a un jacobien inversible, donc f ≈ ‖J·h‖) : f n'y est PAS
 *    différentiable et ‖∇f‖ ne tend pas vers 0 quand on s'en approche ;
 *  - 1 minimum local strict, lisse, non global : (0.095968, 2.605022), f ≈ 0.625443 ;
 *  - 2 points-selles : (−0.100396, −2.490148) et (1.813086, 0.137886).
 *
 * grad : ∇f = Jᵀr / ‖r‖. Aux zéros de r le gradient n'existe pas ; on renvoie [0, 0]
 * (f y atteint son minimum global) uniquement pour éviter un NaN.
 * hess : avec g = f² = ‖r‖², ∇²f = ∇²g / (2√g) − ∇g∇gᵀ / (4 g^{3/2}) ; non définie aux
 * zéros de r (renvoie des NaN/Infinity là, comme la vraie Hessienne qui explose).
 */
export const residualNorm: TestFunc = {
	f: (x, y) => Math.hypot(x * x + y - 2, x + y * y - 7),
	grad: (x, y) => {
		const r1 = x * x + y - 2;
		const r2 = x + y * y - 7;
		const n = Math.hypot(r1, r2);
		if (n === 0) return [0, 0];
		return [(2 * x * r1 + r2) / n, (r1 + 2 * y * r2) / n];
	},
	hess: (x, y) => {
		const r1 = x * x + y - 2;
		const r2 = x + y * y - 7;
		const g = r1 * r1 + r2 * r2;
		const gx = 4 * x * r1 + 2 * r2;
		const gy = 2 * r1 + 4 * y * r2;
		const gxx = 4 * r1 + 8 * x * x + 2;
		const gyy = 4 * r2 + 8 * y * y + 2;
		const gxy = 4 * x + 4 * y;
		const s = Math.sqrt(g);
		const a = 1 / (2 * s);
		const b = 1 / (4 * g * s);
		return [
			[gxx * a - gx * gx * b, gxy * a - gx * gy * b],
			[gxy * a - gx * gy * b, gyy * a - gy * gy * b]
		];
	},
	domain: [
		[-4, 4],
		[-4, 4]
	],
	// Un des deux minima globaux (l'autre : (−2.245123…, −3.040579…)). Valeur exacte :
	// x racine de x⁴ − 4x² + x − 3 = 0, y = 2 − x².
	minimum: [2.055163920119653, 2 - 2.055163920119653 ** 2],
	minValue: 0
};

/** All test functions for iteration */
export const allTestFunctions: Record<string, TestFunc> = {
	residualNorm,
	paraboloid,
	rosenbrock,
	ellipse,
	rastrigin,
	beale,
	saddle,
	cubicInflection,
	semiDefSaddle
};
