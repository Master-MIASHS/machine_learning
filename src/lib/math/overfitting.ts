// src/lib/math/overfitting.ts
//
// Hero figure of the home page — « Les points qu'on n'a pas vus » (the
// overfitting micro-drama shown under the title).
//
// Reference: course_sources/typst/theorie.typ, Introduction — the ERM setup
// and the overfitting warning: "un classifieur qui mémorise S_n obtient
// R_n(h) = 0 mais ne généralise pas".
//
// ILLUSTRATIVE TOY MODEL (not a formula from the sources): the sources state
// the warning qualitatively. We model it in 1-D with
//   - heroTrueFunction: a smooth unknown law f (the "réalité"),
//   - generateHeroSample: a seeded sample of n points y = f(x) + small noise,
//   - buildMemorizingCurve: the exact Lagrange interpolant through the
//     sample — the h with R_S(h) = 0, it memorizes and wiggles,
//   - fitPolynomialLeastSquares / buildSmoothFit: a low-degree least-squares
//     fit — the controlled-complexity model that generalizes,
//   - one unseen test point drawn from the true law (x outside the sampled
//     region).
// HeroFigure.svelte animates: points arrive -> the memorizing curve is drawn
// -> it misses the unseen point -> it morphs into the smooth fit -> it hits.
// No theorem is claimed; the figure is a visual paraphrase of the
// Introduction's warning.
//
// All randomness goes through mulberry32 from util.ts (deterministic for a
// fixed seed).

import { linspace, mulberry32, solveLinearSystem } from './util';

export interface HeroPoint {
	x: number;
	y: number;
}

/**
 * The unknown smooth law behind the hero sample (illustrative ground
 * truth). Bounded: f ∈ [0.23, 0.77] on R (|0.2| + |0.07| around 0.5), so
 * points and curves stay well inside the [0,1] frame.
 */
export function heroTrueFunction(x: number): number {
	return 0.5 + 0.2 * Math.sin(2 * Math.PI * (0.9 * x + 0.05)) + 0.07 * Math.sin(2 * Math.PI * (2.3 * x + 0.4));
}

/**
 * Seeded sample of n points: x's evenly spaced on [0.06, 0.72] with a small
 * ±0.02 jitter (then sorted), y = f(x) + uniform noise of amplitude 0.05.
 * The sample deliberately stops short of 1 so the unseen test point
 * (x = 0.9, see generalizationHeroModel) lies outside the sampled region.
 * n >= 4 is required (degree-3 least-squares fit below).
 */
export function generateHeroSample(n: number, seed = 1): HeroPoint[] {
	if (!Number.isInteger(n) || n < 4) throw new Error(`n must be an integer >= 4, got ${n}`);
	const rand = mulberry32(seed);
	const base = linspace(0.06, 0.72, n);
	const pts = base.map((x) => {
		const jitter = (rand() - 0.5) * 0.04;
		const xx = Math.min(0.72, Math.max(0.04, x + jitter));
		const noise = (rand() - 0.5) * 0.1;
		return { x: xx, y: heroTrueFunction(xx) + noise };
	});
	pts.sort((a, b) => a.x - b.x);
	return pts;
}

/**
 * Lagrange interpolant through `sample`, evaluated at x — the "memorizing"
 * model: p(x_i) = y_i exactly for every sample point (R_S(p) = 0), while
 * between and beyond the points it oscillates freely (overfitting).
 * Direct sum of the Lagrange basis polynomials; stable for the n <= 12
 * nodes used here.
 */
export function memorizingValue(sample: HeroPoint[], x: number): number {
	if (sample.length === 0) throw new Error('memorizingValue: sample must not be empty');
	for (const p of sample) {
		if (Math.abs(x - p.x) < 1e-9) return p.y;
	}
	let sum = 0;
	for (let i = 0; i < sample.length; i++) {
		let basis = 1;
		for (let j = 0; j < sample.length; j++) {
			if (j === i) continue;
			basis *= (x - sample[j].x) / (sample[i].x - sample[j].x);
		}
		sum += sample[i].y * basis;
	}
	return sum;
}

/** Values of the memorizing (exact interpolating) curve on a grid of x's. */
export function buildMemorizingCurve(sample: HeroPoint[], xs: number[]): number[] {
	return xs.map((x) => memorizingValue(sample, x));
}

/** x^0, x^1, ..., x^degree. */
function powers(x: number, degree: number): number[] {
	const v = new Array<number>(degree + 1);
	v[0] = 1;
	for (let i = 1; i <= degree; i++) v[i] = v[i - 1] * x;
	return v;
}

/**
 * Polynomial least-squares fit of `degree` to `sample`, via the normal
 * equations (solved with util.solveLinearSystem). Returns the coefficients
 * in ascending powers: beta[0] + beta[1]*x + ... + beta[degree]*x^degree.
 * This is the "controlled-complexity" model of the hero figure.
 *
 * With `penalty > 0` the fit is REGULARIZED (penalized least squares):
 *   minimize ||V beta - y||^2 + penalty * (beta[2]^2 + ... + beta[degree]^2)
 * i.e. the coefficients of the non-affine terms are damped — the same idea
 * as the L2 regularization taught in Part V, which is exactly what makes a
 * model stop memorizing noise and start generalizing. The affine part
 * (beta[0], beta[1]) is never penalized, so the fit can still follow a
 * trend. penalty = 0 recovers plain least squares.
 * Throws for degree < 0, penalty < 0, or when there are fewer than
 * degree + 1 points.
 */
export function fitPolynomialLeastSquares(
	sample: HeroPoint[],
	degree: number,
	penalty = 0
): number[] {
	if (degree < 0) throw new Error(`degree must be >= 0, got ${degree}`);
	if (penalty < 0) throw new Error(`penalty must be >= 0, got ${penalty}`);
	if (sample.length < degree + 1) {
		throw new Error(`need at least ${degree + 1} points for degree ${degree}, got ${sample.length}`);
	}
	const k = degree + 1;
	const A: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
	const b: number[] = new Array<number>(k).fill(0);
	for (const p of sample) {
		const row = powers(p.x, degree);
		for (let i = 0; i < k; i++) {
			b[i] += row[i] * p.y;
			for (let j = 0; j < k; j++) A[i][j] += row[i] * row[j];
		}
	}
	for (let i = 2; i < k; i++) A[i][i] += penalty;
	return solveLinearSystem(A, b);
}

/** Evaluate a polynomial with ascending-power coefficients at x (Horner). */
export function evaluatePolynomial(coeffs: number[], x: number): number {
	let acc = 0;
	for (let i = coeffs.length - 1; i >= 0; i--) acc = acc * x + coeffs[i];
	return acc;
}

/** Values of the degree-`degree` least-squares fit (with optional L2 `penalty`)
 *  on a grid of x's. */
export function buildSmoothFit(
	sample: HeroPoint[],
	degree: number,
	xs: number[],
	penalty = 0
): number[] {
	const beta = fitPolynomialLeastSquares(sample, degree, penalty);
	return xs.map((x) => evaluatePolynomial(beta, x));
}

/**
 * Beat structure of the hero animation, in seconds — single source of truth
 * for the HeroFigure.svelte requestAnimationFrame timeline:
 *   0.15–1.48  the sample points pop in (staggered)
 *   1.20–3.00  the memorizing curve draws itself (stroke-dashoffset)
 *   3.00–3.60  the unseen test point appears
 *   3.60–4.50  failure ring: the interpolant misses the test point
 *   4.40–6.40  the wiggles decay: the curve morphs into the smooth fit
 *   5.90–6.80  success ring: the smooth fit lands on the test point
 *   6.80–9.20  hold the settled state
 *   9.20–9.80  crossfade out, the loop restarts
 */
export interface HeroTimeline {
	loop: number;
	pointsStart: number;
	pointStagger: number;
	pointDur: number;
	drawStart: number;
	drawEnd: number;
	testStart: number;
	testEnd: number;
	failRingStart: number;
	failRingDur: number;
	morphStart: number;
	morphEnd: number;
	okRingStart: number;
	okRingDur: number;
	fadeStart: number;
	fadeEnd: number;
}

export const HERO_TIMELINE: HeroTimeline = {
	loop: 9.8,
	pointsStart: 0.15,
	pointStagger: 0.11,
	pointDur: 0.35,
	drawStart: 1.2,
	drawEnd: 3.0,
	testStart: 3.0,
	testEnd: 3.6,
	failRingStart: 3.6,
	failRingDur: 0.9,
	morphStart: 4.4,
	morphEnd: 6.4,
	okRingStart: 5.9,
	okRingDur: 0.9,
	fadeStart: 9.2,
	fadeEnd: 9.8
};

/** Standard ease-in-out cubic (generic animation helper, not course content). */
export function easeInOutCubic(t: number): number {
	const u = Math.min(1, Math.max(0, t));
	return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

/** Standard ease-out cubic (generic animation helper, not course content). */
export function easeOutCubic(t: number): number {
	const u = Math.min(1, Math.max(0, t));
	return 1 - Math.pow(1 - u, 3);
}

export interface GeneralizationHeroModel {
	sample: HeroPoint[];
	/** x grid on [0, 1] where both curves are pre-sampled (80 points). */
	grid: number[];
	/** Memorizing (exact interpolating) curve values on the grid. */
	memorizing: number[];
	/** Regularized degree-3 polynomial fit values on the grid. */
	smooth: number[];
	/** Unseen test point: x outside the sampled region, y = f(x) exactly. */
	testPoint: HeroPoint;
	/** Curve values at the test point (drop line, and the fail/hit beats). */
	memorizingAtTest: number;
	smoothAtTest: number;
	timeline: HeroTimeline;
}

/** Smooth fit used by the hero: degree-3 polynomial with an L2 penalty on the
 *  non-affine coefficients (the "regularized" model of the narrative). */
export const HERO_SMOOTH_DEGREE = 3;
export const HERO_SMOOTH_PENALTY = 0.3;

/**
 * Precompute everything HeroFigure.svelte needs, deterministically: the
 * animation then only interpolates between the two pre-sampled curves.
 *
 * The default (seed 82, n = 6, test point x = 0.88) was surveyed and chosen
 * so the figure reads clearly at a glance: the memorizing curve stays inside
 * the [0,1] frame on the whole grid (max |p| ≈ 0.94, no clipping needed) yet
 * misses the unseen test point by ≈ 0.45, while the regularized fit lands
 * within ≈ 0.09 of the truth — the fail/hit drama of the animation, asserted
 * in overfitting.test.ts.
 */
export function generalizationHeroModel(seed = 82): GeneralizationHeroModel {
	const sample = generateHeroSample(6, seed);
	const grid = linspace(0, 1, 80);
	const memorizing = buildMemorizingCurve(sample, grid);
	const beta = fitPolynomialLeastSquares(sample, HERO_SMOOTH_DEGREE, HERO_SMOOTH_PENALTY);
	const smooth = grid.map((x) => evaluatePolynomial(beta, x));
	const testPoint = { x: 0.88, y: heroTrueFunction(0.88) };
	return {
		sample,
		grid,
		memorizing,
		smooth,
		testPoint,
		memorizingAtTest: memorizingValue(sample, testPoint.x),
		smoothAtTest: evaluatePolynomial(beta, testPoint.x),
		timeline: HERO_TIMELINE
	};
}
