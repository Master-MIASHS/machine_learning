/**
 * Lagrangian duality helpers for the 1-D constrained problems taught in the
 * expert panel « Conditions KKT et dualité lagrangienne » (Part I, lesson 1,
 * anchor « conditions-suffisantes »).
 *
 * Content boundary: Lagrangian duality and the KKT conditions are **not** in
 * `course_sources/` — `course_sources/typst/optim.typ` only covers
 * unconstrained optimization (section « Conditions d'existence d'un minimum »,
 * Déf. 1.1–1.2, Th. 1.3–1.12). The statements implemented here follow Boyd &
 * Vandenberghe, *Convex Optimization*, Cambridge University Press, 2004, ch. 5
 * (free version: https://web.stanford.edu/~boyd/cvxbook/):
 *  - §5.1.1  the Lagrangian L(x, λ, ν) = f0(x) + Σ λᵢfᵢ(x) + Σ νᵢhᵢ(x);
 *  - §5.1.2  the dual function g(λ, ν) = inf_x L(x, λ, ν), concave even when
 *            the primal problem is not convex;
 *  - §5.1.3 / §5.2.2  weak duality d* ≤ p* (eq. 5.2, 5.23) and the duality gap
 *            p* − d* ≥ 0;
 *  - §5.2.3  Slater's condition and strong duality for convex problems;
 *  - §5.4.2  saddle-point interpretation (L(x*, λ) ≤ L(x*, λ*) ≤ L(x, λ*));
 *  - §5.5.2  complementary slackness λᵢ*fᵢ(x*) = 0;
 *  - §5.5.3  KKT conditions (eq. 5.49): necessary and sufficient under
 *            convexity + Slater, only necessary outside convexity;
 *  - exercice 5.21  convex problem with a positive duality gap (Slater fails).
 *
 * Two 1-D problems are studied, both with the single constraint h(x) = x ≤ 0:
 *
 *  (P) convex     : min (x−1)²   s.t. x ≤ 0
 *                   → p* = 1, unique KKT point (x*, λ*) = (0, 2), strong
 *                   duality (Slater holds at x̃ = −1), g(λ) = λ − λ²/4.
 *  (Q) non-convex : min x⁴ − x²  s.t. x ≤ 0
 *                   → two KKT points: x = −1/√2 (global minimum, λ = 0) and
 *                   x = 0 (local maximum, λ = 0) — KKT are not sufficient
 *                   without convexity (same objective as Exemple 1.8 of the
 *                   lesson, restricted to x ≤ 0).
 */

import { softThreshold } from './regularization.js';

/** Tolerance used by the KKT checks. */
const KKT_TOL = 1e-9;

/** Throw a clear error when a multiplier is outside the dual domain. */
function assertDualFeasible(lambda: number, name: string): void {
	if (!Number.isFinite(lambda)) throw new Error(`${name}: lambda must be a finite number, got ${lambda}`);
	if (lambda < 0) throw new Error(`${name}: lambda must be >= 0, got ${lambda}`);
}

// ─── (P) Convex problem: min (x−1)² s.t. x ≤ 0 ────────────────────

/** Objective of (P): f(x) = (x−1)² (Boyd & Vandenberghe ch. 5, 1-D example). */
export function paraboleObjective(x: number): number {
	return (x - 1) * (x - 1);
}

/**
 * Lagrangian of (P): L(x, λ) = (x−1)² + λx for the constraint h(x) = x ≤ 0
 * (Boyd & Vandenberghe §5.1.1). Throws for λ < 0.
 */
export function lagrangianParabole(x: number, lambda: number): number {
	assertDualFeasible(lambda, 'lagrangianParabole');
	return paraboleObjective(x) + lambda * x;
}

/**
 * Exact minimizer in x of the Lagrangian of (P): ∂L/∂x = 2(x−1) + λ = 0 ⇒
 * x(λ) = 1 − λ/2 (L is strongly convex in x, so the minimizer is unique).
 * Throws for λ < 0.
 */
export function dualMinimizerParabole(lambda: number): number {
	assertDualFeasible(lambda, 'dualMinimizerParabole');
	return 1 - lambda / 2;
}

/**
 * Dual function of (P), closed form: g(λ) = inf_x L(x, λ) = λ − λ²/4
 * (Boyd & Vandenberghe §5.1.2). Concave on λ ≥ 0; maximum 1 at λ* = 2.
 * Throws for λ < 0.
 */
export function dualFunctionParabole(lambda: number): number {
	assertDualFeasible(lambda, 'dualFunctionParabole');
	return lambda - (lambda * lambda) / 4;
}

/** Optimal values of (P): p* = d* = 1, (x*, λ*) = (0, 2) (strong duality). */
export const PARABOLE_OPTIMUM = {
	primal: 1,
	dual: 1,
	xStar: 0,
	lambdaStar: 2
} as const;

/**
 * Duality gap of (P) at a given dual feasible λ: p* − g(λ) = 1 − (λ − λ²/4).
 * Invariant: ≥ 0 for every λ ≥ 0 (weak duality, Boyd & Vandenberghe §5.2.2),
 * with equality exactly at λ* = 2.
 */
export function dualGapParabole(lambda: number): number {
	assertDualFeasible(lambda, 'dualGapParabole');
	return PARABOLE_OPTIMUM.primal - dualFunctionParabole(lambda);
}

export interface KktReport {
	primalFeasible: boolean;
	dualFeasible: boolean;
	complementarySlackness: boolean;
	stationarity: boolean;
	stationarityResidual: number;
	allSatisfied: boolean;
}

/**
 * Check the four KKT conditions (Boyd & Vandenberghe §5.5.3, eq. 5.49) of the
 * pair (x, λ) for problem (P): h(x) = x ≤ 0, L(x, λ) = (x−1)² + λx.
 * The unique solution is (0, 2).
 */
export function kktCheckParabole(x: number, lambda: number, tol = KKT_TOL): KktReport {
	if (!Number.isFinite(x) || !Number.isFinite(lambda)) {
		throw new Error(`kktCheckParabole: inputs must be finite, got x = ${x}, lambda = ${lambda}`);
	}
	const primalFeasible = x <= tol;
	const dualFeasible = lambda >= -tol;
	const complementarySlackness = Math.abs(lambda * x) <= tol;
	const stationarityResidual = 2 * (x - 1) + lambda;
	const stationarity = Math.abs(stationarityResidual) <= tol;
	return {
		primalFeasible,
		dualFeasible,
		complementarySlackness,
		stationarity,
		stationarityResidual,
		allSatisfied: primalFeasible && dualFeasible && complementarySlackness && stationarity
	};
}

// ─── (Q) Non-convex problem: min x⁴ − x² s.t. x ≤ 0 ───────────────

/** Objective of (Q): f(x) = x⁴ − x² (same function as Exemple 1.8 of the lesson). */
export function quarticObjective(x: number): number {
	const x2 = x * x;
	return x2 * x2 - x2;
}

/**
 * Lagrangian of (Q): L(x, λ) = x⁴ − x² + λx for the constraint h(x) = x ≤ 0.
 * Throws for λ < 0.
 */
export function lagrangianQuartic(x: number, lambda: number): number {
	assertDualFeasible(lambda, 'lagrangianQuartic');
	return quarticObjective(x) + lambda * x;
}

/**
 * KKT conditions of (Q): h(x) = x ≤ 0, ∂L/∂x = 4x³ − 2x + λ.
 * Both x = −1/√2 (λ = 0, global minimum) and x = 0 (λ = 0, local maximum)
 * satisfy the KKT conditions — KKT are not sufficient without convexity.
 */
export function isKktQuartic(x: number, lambda: number, tol = KKT_TOL): KktReport {
	if (!Number.isFinite(x) || !Number.isFinite(lambda)) {
		throw new Error(`isKktQuartic: inputs must be finite, got x = ${x}, lambda = ${lambda}`);
	}
	const primalFeasible = x <= tol;
	const dualFeasible = lambda >= -tol;
	const complementarySlackness = Math.abs(lambda * x) <= tol;
	const stationarityResidual = 4 * x * x * x - 2 * x + lambda;
	const stationarity = Math.abs(stationarityResidual) <= tol;
	return {
		primalFeasible,
		dualFeasible,
		complementarySlackness,
		stationarity,
		stationarityResidual,
		allSatisfied: primalFeasible && dualFeasible && complementarySlackness && stationarity
	};
}

export interface QuarticKktPoint {
	x: number;
	lambda: number;
	fValue: number;
	role: 'global-minimum' | 'local-maximum';
}

/**
 * The two KKT points of (Q), computed from the system x ≤ 0, λ ≥ 0,
 * λx = 0, 4x³ − 2x + λ = 0:
 *  - x < 0 ⇒ λ = 0 ⇒ 4x³ − 2x = 0 ⇒ x = −1/√2 (f = −1/4, global min);
 *  - x = 0 ⇒ λ = 0 (f = 0, local maximum — the trap).
 */
export function quarticKktPoints(): QuarticKktPoint[] {
	return [
		{ x: -1 / Math.SQRT2, lambda: 0, fValue: -1 / 4, role: 'global-minimum' },
		{ x: 0, lambda: 0, fValue: 0, role: 'local-maximum' }
	];
}

/**
 * Optimal value of (Q): p* = −1/4 attained at x = −1/√2 (the global minimum
 * of x⁴ − x² over x ≤ 0; f decreases on (−∞, −1/√2) and increases on
 * (−1/√2, 0)).
 */
export const QUARTIC_OPTIMUM = {
	primal: -1 / 4,
	xStar: -1 / Math.SQRT2
} as const;

/**
 * Numerical minimizer in x of the Lagrangian of (Q): the infimum is attained
 * (the Lagrangian is coercive) at a root of 4x³ − 2x + λ = 0, found by a
 * bounded grid scan on [−2, 2] followed by a golden-section refinement in a
 * one-step bracket around the scan minimum (covers all λ in [0, 8]; the
 * bracket contains no other stationary point, so the refinement stays
 * unimodal). Illustrative only — the panel's exact claims use the
 * closed-form problem (P). Throws for λ < 0.
 */
export function dualArgminQuartic(lambda: number, grid = 2001): number {
	assertDualFeasible(lambda, 'dualArgminQuartic');
	const [a, b] = [-2, 2];
	const step = (b - a) / (grid - 1);
	let bestX = a;
	let bestV = lagrangianQuartic(a, lambda);
	for (let i = 1; i < grid; i++) {
		const x = a + i * step;
		const v = lagrangianQuartic(x, lambda);
		if (v < bestV) {
			bestV = v;
			bestX = x;
		}
	}
	// Golden section on [bestX − step, bestX + step] (clamped to [a, b]).
	let lo = Math.max(a, bestX - step);
	let hi = Math.min(b, bestX + step);
	const phi = (Math.sqrt(5) - 1) / 2;
	let c = hi - phi * (hi - lo);
	let d = lo + phi * (hi - lo);
	let fc = lagrangianQuartic(c, lambda);
	let fd = lagrangianQuartic(d, lambda);
	for (let k = 0; k < 100 && hi - lo > 1e-14; k++) {
		if (fc < fd) {
			hi = d;
			d = c;
			fd = fc;
			c = hi - phi * (hi - lo);
			fc = lagrangianQuartic(c, lambda);
		} else {
			lo = c;
			c = d;
			fc = fd;
			d = lo + phi * (hi - lo);
			fd = lagrangianQuartic(d, lambda);
		}
	}
	const mid = (lo + hi) / 2;
	return lagrangianQuartic(mid, lambda) < bestV ? mid : bestX;
}

/**
 * Dual function of (Q): g(λ) = inf_x (x⁴ − x² + λx) = L(x(λ), λ) with
 * x(λ) = dualArgminQuartic(λ). Concave in λ ≥ 0 and bounded above by
 * p* = −1/4 (weak duality holds even for this non-convex problem).
 * Throws for λ < 0.
 */
export function dualFunctionQuartic(lambda: number, grid = 2001): number {
	return lagrangianQuartic(dualArgminQuartic(lambda, grid), lambda);
}

// ─── (R) Running 2-D example: min (x−1)²+(y−1)² s.t. x+y ≤ 1 ────
//
// Worked example of the expert lesson « Dualité convexe et conditions KKT »
// (Part I, expert). Every closed form below is *derived here* by applying the
// Boyd & Vandenberghe ch. 5 machinery (verified against the book) to this
// problem — the book does not contain this example:
//  - projection of (1,1) onto the half-plane x+y ≤ 1: x* = y* = 1/2, p* = 1/2;
//  - Lagrangian L(x,y,λ) = (x−1)²+(y−1)² + λ(x+y−1), λ ≥ 0;
//  - dual minimizer x(λ) = y(λ) = 1 − λ/2 (∂L/∂x = 2(x−1)+λ = 0);
//  - dual function g(λ) = L(1−λ/2, 1−λ/2, λ) = λ − λ²/2 (concave parabola);
//  - dual optimum λ* = 1, d* = g(1) = 1/2 = p* (strong duality — Slater holds
//    at (0,0): 0+0 < 1);
//  - gap(λ) = p* − g(λ) = (λ−1)²/2, zero exactly at λ*;
//  - unique KKT point ((1/2, 1/2), 1): stationarity −2(x−1)+λ = 0 = −2(y−1)+λ,
//    feasibility x+y ≤ 1, dual feasibility λ ≥ 0, complementarity λ(x+y−1) = 0.
//  - perturbation x+y ≤ 1+u (Boyd & Vandenberghe §5.6): for u ≤ 1 the
//    constraint stays active, x*(u) = y*(u) = (1+u)/2, p*(u) = (1−u)²/2,
//    multiplier λ(u) = 1−u, and λ(u) = −p*'(u) (eq. 5.58 in closed form);
//    for u ≥ 1 the point (1,1) is feasible and p*(u) = 0. p* is convex and C¹.

/** Optimal data of the running 2-D example (derived, see section comment). */
export const CONDUCTOR_2D_OPTIMUM = {
	primal: 0.5,
	dual: 0.5,
	xStar: 0.5,
	yStar: 0.5,
	lambdaStar: 1
} as const;

/** Objective of the running 2-D example: f(x, y) = (x−1)² + (y−1)². */
export function conductingObjective(x: number, y: number): number {
	return (x - 1) * (x - 1) + (y - 1) * (y - 1);
}

/**
 * Lagrangian of the running 2-D example for the constraint x + y ≤ 1:
 * L(x, y, λ) = (x−1)² + (y−1)² + λ(x+y−1) (Boyd & Vandenberghe §5.1.1).
 * Throws for λ < 0.
 */
export function conductingLagrangian(x: number, y: number, lambda: number): number {
	assertDualFeasible(lambda, 'conductingLagrangian');
	return conductingObjective(x, y) + lambda * (x + y - 1);
}

/**
 * Exact minimizer in (x, y) of the Lagrangian of the running 2-D example:
 * x(λ) = y(λ) = 1 − λ/2 (L is strongly convex in (x, y)). Returns [x, y].
 * Throws for λ < 0.
 */
export function dualMinimizer2D(lambda: number): [number, number] {
	assertDualFeasible(lambda, 'dualMinimizer2D');
	const v = 1 - lambda / 2;
	return [v, v];
}

/**
 * Dual function of the running 2-D example, closed form:
 * g(λ) = λ − λ²/2 (Boyd & Vandenberghe §5.1.2). Concave on λ ≥ 0 with unique
 * maximum 1/2 at λ* = 1. Throws for λ < 0.
 */
export function dualFunction2D(lambda: number): number {
	assertDualFeasible(lambda, 'dualFunction2D');
	return lambda - (lambda * lambda) / 2;
}

/**
 * Duality gap of the running 2-D example at a dual feasible λ:
 * p* − g(λ) = (λ−1)²/2 ≥ 0 (weak duality, Boyd & Vandenberghe §5.2.2), with
 * equality exactly at λ* = 1. Throws for λ < 0.
 */
export function dualGap2D(lambda: number): number {
	assertDualFeasible(lambda, 'dualGap2D');
	const d = lambda - CONDUCTOR_2D_OPTIMUM.lambdaStar;
	return d * d / 2;
}

export interface KktReport2D {
	primalFeasible: boolean;
	dualFeasible: boolean;
	complementarySlackness: boolean;
	stationarity: boolean;
	stationarityResiduals: [number, number];
	allSatisfied: boolean;
}

/**
 * Check the KKT conditions (Boyd & Vandenberghe §5.5.3, eq. 5.49) of the pair
 * ((x, y), λ) for the running 2-D example: stationarity −2(x−1)+λ = 0 and
 * −2(y−1)+λ = 0, primal feasibility x+y ≤ 1, dual feasibility λ ≥ 0,
 * complementarity λ(x+y−1) = 0. The unique satisfying pair is
 * ((1/2, 1/2), 1).
 */
export function kktCheck2D(x: number, y: number, lambda: number, tol = KKT_TOL): KktReport2D {
	if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(lambda)) {
		throw new Error(`kktCheck2D: inputs must be finite, got x = ${x}, y = ${y}, lambda = ${lambda}`);
	}
	const primalFeasible = x + y - 1 <= tol;
	const dualFeasible = lambda >= -tol;
	const complementarySlackness = Math.abs(lambda * (x + y - 1)) <= tol;
	const stationarityResiduals: [number, number] = [2 * (x - 1) + lambda, 2 * (y - 1) + lambda];
	const stationarity = Math.abs(stationarityResiduals[0]) <= tol && Math.abs(stationarityResiduals[1]) <= tol;
	return {
		primalFeasible,
		dualFeasible,
		complementarySlackness,
		stationarity,
		stationarityResiduals,
		allSatisfied: primalFeasible && dualFeasible && complementarySlackness && stationarity
	};
}

/**
 * Optimal value of the perturbed problem min (x−1)²+(y−1)² s.t. x+y ≤ 1+u
 * (Boyd & Vandenberghe §5.6, derived here): p*(u) = (1−u)²/2 for u ≤ 1
 * (constraint active, x*(u) = y*(u) = (1+u)/2, multiplier 1−u), and 0 for
 * u ≥ 1 (the unconstrained minimizer (1,1) is feasible). p* is convex and
 * C¹; λ(u) = −p*'(u) on u < 1 (eq. 5.58 in closed form).
 */
export function perturbedValue2D(u: number): number {
	if (!Number.isFinite(u)) throw new Error(`perturbedValue2D: u must be finite, got ${u}`);
	return u <= 1 ? (1 - u) * (1 - u) / 2 : 0;
}

// ─── (G) Gap examples: non-convexity alone, and unbounded primal ───
//
// Content: expert lesson « Dualité convexe et conditions KKT » (Part I,
// expert), section « gap-strict ». The strict-gap example itself
// (Boyd & Vandenberghe, exercice 5.21: min e^{−x} s.t. x²/y ≤ 0, y > 0 —
// convex without Slater, p* = 1 attained, d* = 0, gap 1) is taught in the
// panel of lesson 1 and is only referenced from this lesson. The examples
// below share the non-convex constraint x² ≥ 1 (i.e. 1 − x² ≤ 0, feasible
// set {x ≤ −1} ∪ {x ≥ 1}); all values are derived here and verified
// numerically in duality.test.ts.
//
// (G1) « Piège » — non-convex, gap ZERO: min (x−2)² s.t. x² ≥ 1.
//  - p* = 0 at x* = 2 (the unconstrained minimizer IS feasible — the trap
//    is that the disconnected feasible set suggests a gap);
//  - L(x, λ) = (x−2)² + λ(1−x²); for λ ∈ [0, 1): convex quadratic in x,
//    minimizer x(λ) = 2/(1−λ), g(λ) = −λ(3+λ)/(1−λ) (decreasing);
//    for λ ≥ 1: g(λ) = −∞;
//  - d* = sup g = g(0) = 0 = p* → gap 0; KKT holds at (x* = 2, λ* = 0)
//    (the constraint is inactive at x*). Non-convexity alone does NOT open
//    a gap: what the separation proof needs is a constraint qualification,
//    not convexity of the feasible set per se.
//
// (G2) Unbounded primal: min x s.t. x² ≥ 1.
//  - p* = −∞ (x → −∞ is feasible and drives x down); L(x, λ) = x + λ(1−x²)
//    is unbounded below in x for every λ ≥ 0 (affine for λ = 0, quadratic
//    for λ > 0); g ≡ −∞, d* = −∞. This is the infinite-value case of weak
//    duality (Boyd & Vandenberghe §5.2.2: p* = −∞ forces d* = −∞) — there
//    is no « gap » to speak of, both values collapse to −∞.

export interface GapExampleDual {
	value: number;
	/** True when the Lagrangian is unbounded below in x for this λ. */
	unbounded: boolean;
}

/** Optimal data of (G1), the non-convex zero-gap « trap ». */
export const GAP_TRAP_OPTIMUM = {
	primal: 0,
	xStar: 2,
	dual: 0,
	lambdaStar: 0,
	gap: 0
} as const;

/** Optimal data of (G2), the unbounded primal (p* = d* = −∞). */
export const GAP_UNBOUNDED_OPTIMUM = {
	primal: -Infinity,
	xStar: null,
	dual: -Infinity,
	lambdaStar: null
} as const;

/** Lagrangian of (G1): L(x, λ) = (x−2)² + λ(1−x²). */
export function trapLagrangian(x: number, lambda: number): number {
	assertDualFeasible(lambda, 'trapLagrangian');
	return (x - 2) * (x - 2) + lambda * (1 - x * x);
}

/**
 * Dual function of (G1), closed form: g(λ) = −λ(3+λ)/(1−λ) for
 * λ ∈ [0, 1) (decreasing, sup g(0) = 0 = p*), g(λ) = −∞ for λ ≥ 1.
 * Throws for λ < 0.
 */
export function trapDual(lambda: number): GapExampleDual {
	assertDualFeasible(lambda, 'trapDual');
	if (lambda >= 1) return { value: -Infinity, unbounded: true };
	// Normalize −0 at λ = 0 (the formula evaluates to -0).
	const value = (-lambda * (3 + lambda)) / (1 - lambda);
	return { value: value === 0 ? 0 : value, unbounded: false };
}

/** Lagrangian of (G2): L(x, λ) = x + λ(1−x²). */
export function unboundedLagrangian(x: number, lambda: number): number {
	assertDualFeasible(lambda, 'unboundedLagrangian');
	return x + lambda * (1 - x * x);
}

/**
 * Dual function of (G2): g(λ) = −∞ for every λ ≥ 0 (affine in x for
 * λ = 0, unbounded quadratic for λ > 0). So d* = p* = −∞ (weak duality,
 * Boyd & Vandenberghe §5.2.2). Throws for λ < 0.
 */
export function unboundedDual(lambda: number): GapExampleDual {
	assertDualFeasible(lambda, 'unboundedDual');
	return { value: -Infinity, unbounded: true };
}

// ─── (L) Lasso: primal–dual pair ───────────────────────────────
//
// Content: expert lesson « Dualité convexe et conditions KKT » (Part I,
// expert), section « fil-lasso ». The course's Lasso (Déf. 5.2,
// `course_sources/typst/regularization.typ`) is the penalized problem
// argmin_θ ‖y − Xθ‖²₂ + λ‖θ‖₁; the ½-scaled form below has the same
// solution path (λ reparametrized). The duals implemented here are
// *derived here* from the Boyd & Vandenberghe ch. 5 machinery (§5.1–5.2
// Lagrangian duality, §5.2.3 Slater/strong duality, §5.4.2 minimax/Sion,
// §3.3.1 Exemple 3.26 — conjugate of a norm is the indicator of the dual
// unit ball) — they appear in no consulted primary source, so every one of
// them is pinned by numerical invariants in `duality.test.ts`:
//
//  Penalized form  (P_λ): min_θ ½‖y − Xθ‖² + λ‖θ‖₁
//  - primal solver: exact coordinate descent
//    θᵢ ← S_λ((Xᵀy)ᵢ − Σ_{j≠i}(XᵀX)ᵢⱼθⱼ) / (XᵀX)ᵢᵢ;
//  - Fenchel dual (X full column rank, M = (XᵀX)⁻¹, P_X = X(XᵀX)⁻¹Xᵀ):
//    (D_λ) max_u ½‖(I−P_X)y‖² + uᵀMXᵀy − ½uᵀMu   s.t. ‖u‖∞ ≤ λ,  u ∈ R^d;
//  - strong duality d* = p* and the primal–dual link u* = Xᵀ(y − Xθ*)
//    (equivalently z* = u*/λ ∈ ∂‖θ*‖₁ — the KKT inclusion
//    0 ∈ −Xᵀ(y−Xθ*) + λ∂‖θ*‖₁);
//  - 1-D closed forms (X = 1): θ* = S_λ(y), u* = clip(y, −λ, λ),
//    p* = d* (e.g. (y,λ) = (3,1) → 2.5, (0.5,1) → 0.125, (−2.5,1) → 2).
//
//  Constrained form  (P_t): min_θ ½‖y − Xθ‖²   s.t. ‖θ‖₁ ≤ t
//  - Lagrangian dual: max_{λ≥0} [p_pen(λ) − λt], where p_pen(λ) is the
//    penalized value — no closed form (each evaluation costs a lasso);
//    g is concave in λ (p_pen is a pointwise infimum of affine functions);
//  - strong duality (Slater: θ = 0 is strictly feasible for t > 0) and the
//    path correspondence θ_primal(t) = θ_pen(λ*) with complementarity
//    λ*(t − ‖θ_primal‖₁) = 0 (derived via the KKT conditions).

/**
 * Fixed toy problem used by the lesson demo (honest note for the caption):
 * diagonal X so that both coordinates decouple and the sparsity thresholds
 * are exactly computable by hand — θ₁* = S_λ(3) (dies at λ = 3) and
 * θ₂* = ½S_{λ/2}(−1) = S_λ(−2)/4 (dies at λ = 2). ‖Xᵀy‖∞ = 3, so θ(λ) = 0
 * for λ ≥ 3. Illustration of the primal–dual machinery, not a benchmark.
 */
export const LASSO_DEMO: { X: number[][]; y: number[]; lambdaMax: number } = {
	X: [
		[1, 0],
		[0, 2]
	],
	y: [3, -1],
	/** λ beyond which θ(λ) = 0: ‖Xᵀy‖∞ = max(3, 2) = 3. */
	lambdaMax: 3
};

/**
 * Validate a lasso instance: square-ish dimensions (n rows, d columns, n ≥ 1,
 * d ≥ 1, y length n), finite entries, and full column rank of X (so XᵀX is
 * invertible — required by the Fenchel dual). Throws with a clear message.
 */
export function assertLassoInstance(X: number[][], y: number[]): void {
	const n = X.length;
	const d = n > 0 ? X[0].length : 0;
	if (n < 1 || d < 1) throw new Error(`assertLassoInstance: X must have at least one row and column, got ${n}×${d}`);
	if (y.length !== n) throw new Error(`assertLassoInstance: y must have length n = ${n}, got ${y.length}`);
	for (const row of X) {
		if (row.length !== d) throw new Error(`assertLassoInstance: X rows must all have length ${d}`);
	}
	for (let i = 0; i < n; i++) {
		if (!Number.isFinite(y[i])) throw new Error(`assertLassoInstance: y[${i}] must be finite, got ${y[i]}`);
		for (let j = 0; j < d; j++) {
			if (!Number.isFinite(X[i][j])) throw new Error(`assertLassoInstance: X[${i}][${j}] must be finite`);
		}
	}
	// Full column rank ⟺ XᵀX positive definite ⟺ all Cholesky pivots > 0.
	const G: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
	for (let i = 0; i < n; i++) for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) G[a][b] += X[i][a] * X[i][b];
	// Direct Cholesky, upper-triangular: U with G = UᵀU, only U[i][j] (j ≥ i)
	// is ever written, and only U[k][i], U[k][j] (k < i, so j, i ≥ k) are
	// read — all upper-triangular entries.
	const U: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
	for (let i = 0; i < d; i++) {
		let pivot = G[i][i];
		for (let k = 0; k < i; k++) pivot -= U[k][i] * U[k][i];
		if (pivot <= 1e-12) throw new Error(`assertLassoInstance: X must have full column rank (XᵀX not positive definite)`);
		U[i][i] = Math.sqrt(pivot);
		for (let j = i + 1; j < d; j++) {
			let s = G[i][j];
			for (let k = 0; k < i; k++) s -= U[k][i] * U[k][j];
			U[i][j] = s / U[i][i];
		}
	}
}

/** Xᵀw (transpose product) for the lasso instance. */
function xT(X: number[][], w: number[]): number[] {
	const d = X[0].length;
	const out = new Array(d).fill(0);
	for (let i = 0; i < X.length; i++) for (let j = 0; j < d; j++) out[j] += X[i][j] * w[i];
	return out;
}

/**
 * Solve the penalized lasso (P_λ) min_θ ½‖y − Xθ‖² + λ‖θ‖₁ by exact
 * coordinate descent: each sweep updates
 * θᵢ ← S_λ((Xᵀy)ᵢ − Σ_{j≠i}(XᵀX)ᵢⱼθⱼ) / (XᵀX)ᵢᵢ, the exact minimizer of
 * the objective in coordinate i (cyclical CD converges for the lasso).
 * Reuses `softThreshold` from `regularization.ts`. Throws for λ < 0 or
 * invalid instances (see `assertLassoInstance`).
 */
export function lassoPrimal(X: number[][], y: number[], lambda: number, maxIter = 20000, tol = 1e-11): number[] {
	assertDualFeasible(lambda, 'lassoPrimal');
	assertLassoInstance(X, y);
	const n = X.length;
	const d = X[0].length;
	const G: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
	const Gb: number[] = new Array(d).fill(0);
	for (let i = 0; i < n; i++) {
		for (let a = 0; a < d; a++) {
			Gb[a] += X[i][a] * y[i];
			for (let b = 0; b < d; b++) G[a][b] += X[i][a] * X[i][b];
		}
	}
	const theta = new Array(d).fill(0);
	for (let iter = 0; iter < maxIter; iter++) {
		let maxChange = 0;
		for (let i = 0; i < d; i++) {
			let r = Gb[i];
			for (let j = 0; j < d; j++) if (j !== i) r -= G[i][j] * theta[j];
			const next = softThreshold(r, lambda) / G[i][i];
			maxChange = Math.max(maxChange, Math.abs(next - theta[i]));
			theta[i] = next;
		}
		if (maxChange < tol) break;
	}
	return theta;
}

/** Penalized lasso value ½‖y − Xθ‖² + λ‖θ‖₁ (the objective of (P_λ)). */
export function lassoPrimalValue(X: number[][], y: number[], theta: number[], lambda: number): number {
	assertDualFeasible(lambda, 'lassoPrimalValue');
	assertLassoInstance(X, y);
	if (theta.length !== X[0].length) throw new Error('lassoPrimalValue: theta must have the same length as the columns of X');
	let sq = 0;
	let l1 = 0;
	for (let i = 0; i < X.length; i++) {
		let pred = 0;
		for (let j = 0; j < theta.length; j++) pred += X[i][j] * theta[j];
		const r = y[i] - pred;
		sq += r * r;
	}
	for (const t of theta) l1 += Math.abs(t);
	return 0.5 * sq + lambda * l1;
}

/**
 * Solve the Fenchel dual of the penalized lasso,
 * (D_λ) max_u ½‖(I−P_X)y‖² + uᵀ(XᵀX)⁻¹Xᵀy − ½uᵀ(XᵀX)⁻¹u   s.t. ‖u‖∞ ≤ λ,
 * by exact coordinate ascent (each coordinate is a strictly concave
 * quadratic because (XᵀX)⁻¹ ≻ 0):
 * uᵢ ← clip((bᵢ − Σ_{j≠i}Mᵢⱼuⱼ)/Mᵢᵢ, −λ, λ) with M = (XᵀX)⁻¹, b = MXᵀy.
 * Returns { u, value }. Throws for λ < 0 or invalid instances.
 */
export function lassoDualFenchel(X: number[][], y: number[], lambda: number, maxIter = 20000, tol = 1e-11): { u: number[]; value: number } {
	assertDualFeasible(lambda, 'lassoDualFenchel');
	assertLassoInstance(X, y);
	const n = X.length;
	const d = X[0].length;
	// Augmented matrix [XᵀX | I], solved to [I | (XᵀX)⁻¹] by Gauss–Jordan
	// (d is small in this course).
	const G: number[][] = Array.from({ length: d }, (_, i) => {
		const row = new Array(2 * d).fill(0);
		row[d + i] = 1;
		return row;
	});
	for (let i = 0; i < n; i++) for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) G[a][b] += X[i][a] * X[i][b];
	for (let col = 0; col < d; col++) {
		for (let i = 0; i < d; i++) if (i !== col) {
			const f = G[i][col] / G[col][col];
			for (let k = 0; k < 2 * d; k++) G[i][k] -= f * G[col][k];
		}
		const s = G[col][col];
		for (let k = 0; k < 2 * d; k++) G[col][k] /= s;
	}
	const M: number[][] = Array.from({ length: d }, (_, i) => G[i].slice(d));
	const Xty = xT(X, y);
	const b: number[] = new Array(d).fill(0);
	for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) b[i] += M[i][j] * Xty[j];
	// Constant ½‖(I−P_X)y‖² with P_X = X(XᵀX)⁻¹Xᵀ (orthogonal projector, so
	// ‖(I−P_X)y‖² = ‖y‖² − yᵀP_Xy = ‖y‖² − (Xᵀy)ᵀM(Xᵀy)).
	let c = 0;
	for (const v of y) c += 0.5 * v * v;
	for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) c -= 0.5 * Xty[i] * M[i][j] * Xty[j];
	const u = new Array(d).fill(0);
	for (let iter = 0; iter < maxIter; iter++) {
		let maxChange = 0;
		for (let i = 0; i < d; i++) {
			let s = b[i];
			for (let j = 0; j < d; j++) if (j !== i) s -= M[i][j] * u[j];
			const next = Math.max(-lambda, Math.min(lambda, s / M[i][i]));
			maxChange = Math.max(maxChange, Math.abs(next - u[i]));
			u[i] = next;
		}
		if (maxChange < tol) break;
	}
	let value = c;
	for (let i = 0; i < d; i++) {
		value += b[i] * u[i];
		for (let j = 0; j < d; j++) value -= 0.5 * M[i][j] * u[i] * u[j];
	}
	return { u, value };
}

export interface LassoKktReport {
	/** r* = y − Xθ (the residual). */
	residual: number[];
	/** u* = Xᵀ(y − Xθ) — the predicted Fenchel dual optimizer. */
	uStar: number[];
	/** z* = (u*)/λ — must belong to ∂‖θ‖₁ (KKT inclusion). */
	z: number[];
	/** True when z ∈ ∂‖θ‖₁: zᵢ = sgn(θᵢ) if θᵢ ≠ 0, |zᵢ| ≤ 1 if θᵢ = 0. */
	subgradientOk: boolean;
	maxAbsZ: number;
}

/**
 * KKT report for the penalized lasso: 0 ∈ −Xᵀ(y − Xθ) + λ∂‖θ‖₁, i.e.
 * z* = Xᵀ(y − Xθ)/λ ∈ ∂‖θ*‖₁ (Boyd & Vandenberghe §5.5.3 adapted to the
 * nonsmooth objective — the stationarity condition becomes an inclusion).
 * Throws for λ ≤ 0 or invalid instances.
 */
export function lassoKktReport(X: number[][], y: number[], theta: number[], lambda: number, tol = 1e-7): LassoKktReport {
	if (!Number.isFinite(lambda) || lambda <= 0) throw new Error(`lassoKktReport: lambda must be > 0, got ${lambda}`);
	assertLassoInstance(X, y);
	const n = X.length;
	const d = X[0].length;
	if (theta.length !== d) throw new Error('lassoKktReport: theta must have the same length as the columns of X');
	const residual: number[] = new Array(n);
	for (let i = 0; i < n; i++) {
		let pred = 0;
		for (let j = 0; j < d; j++) pred += X[i][j] * theta[j];
		residual[i] = y[i] - pred;
	}
	const uStar = xT(X, residual);
	const z = uStar.map((v) => v / lambda);
	let maxAbsZ = 0;
	let subgradientOk = true;
	for (let i = 0; i < d; i++) {
		maxAbsZ = Math.max(maxAbsZ, Math.abs(z[i]));
		if (Math.abs(theta[i]) > tol) {
			if (Math.abs(z[i] - Math.sign(theta[i])) > tol) subgradientOk = false;
		} else if (Math.abs(z[i]) > 1 + tol) {
			subgradientOk = false;
		}
	}
	return { residual, uStar, z, subgradientOk, maxAbsZ };
}

/**
 * Value of the Lagrangian dual of the constrained lasso at λ:
 * g(λ) = p_pen(λ) − λt where p_pen(λ) is the penalized lasso value (no
 * closed form — the evaluation costs one lasso). Concave in λ ≥ 0.
 * Throws for λ < 0, t ≤ 0, or invalid instances.
 */
export function lassoConstrainedDualFunction(X: number[][], y: number[], t: number, lambda: number): number {
	assertDualFeasible(lambda, 'lassoConstrainedDualFunction');
	if (!Number.isFinite(t) || t <= 0) throw new Error(`lassoConstrainedDualFunction: t must be > 0, got ${t}`);
	const theta = lassoPrimal(X, y, lambda);
	return lassoPrimalValue(X, y, theta, lambda) - lambda * t;
}

/**
 * Optimize the 1-D concave Lagrangian dual of the constrained lasso,
 * max_{λ≥0} [p_pen(λ) − λt], by golden-section search on [0, L] with
 * L = max(1, ‖Xᵀy‖∞) (θ = 0 is optimal for λ ≥ ‖Xᵀy‖∞, where
 * g(λ) = ½‖y‖² − λt is affine decreasing, so the maximizer lies in [0, L]).
 * Returns { lambda, value }. By strong duality (Slater: θ = 0 is strictly
 * feasible for t > 0) the value equals the optimal value of the constrained
 * problem. Throws for t ≤ 0 or invalid instances.
 */
export function lassoConstrainedDualOptimum(X: number[][], y: number[], t: number, iterations = 120): { lambda: number; value: number } {
	if (!Number.isFinite(t) || t <= 0) throw new Error(`lassoConstrainedDualOptimum: t must be > 0, got ${t}`);
	assertLassoInstance(X, y);
	const Xty = xT(X, y);
	const L = Math.max(1, ...Xty.map(Math.abs));
	const phi = (Math.sqrt(5) - 1) / 2;
	let lo = 0;
	let hi = L;
	let c = hi - phi * (hi - lo);
	let d = lo + phi * (hi - lo);
	let fc = lassoConstrainedDualFunction(X, y, t, c);
	let fd = lassoConstrainedDualFunction(X, y, t, d);
	for (let k = 0; k < iterations && hi - lo > 1e-10 * L; k++) {
		if (fc < fd) {
			lo = c;
			c = d;
			fc = fd;
			d = lo + phi * (hi - lo);
			fd = lassoConstrainedDualFunction(X, y, t, d);
		} else {
			hi = d;
			d = c;
			fd = fc;
			c = hi - phi * (hi - lo);
			fc = lassoConstrainedDualFunction(X, y, t, c);
		}
	}
	const lambda = (lo + hi) / 2;
	return { lambda, value: lassoConstrainedDualFunction(X, y, t, lambda) };
}
