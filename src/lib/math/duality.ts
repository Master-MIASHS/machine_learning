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
