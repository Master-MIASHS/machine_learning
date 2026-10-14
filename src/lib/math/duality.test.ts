import { describe, it, expect } from 'vitest';
import {
	paraboleObjective,
	quarticObjective,
	lagrangianParabole,
	lagrangianQuartic,
	dualMinimizerParabole,
	dualFunctionParabole,
	dualArgminQuartic,
	dualFunctionQuartic,
	dualGapParabole,
	kktCheckParabole,
	isKktQuartic,
	quarticKktPoints,
	PARABOLE_OPTIMUM,
	QUARTIC_OPTIMUM,
	CONDUCTOR_2D_OPTIMUM,
	conductingObjective,
	conductingLagrangian,
	dualMinimizer2D,
	dualFunction2D,
	dualGap2D,
	kktCheck2D,
	perturbedValue2D,
	GAP_TRAP_OPTIMUM,
	GAP_UNBOUNDED_OPTIMUM,
	trapLagrangian,
	trapDual,
	unboundedLagrangian,
	unboundedDual,
	LASSO_DEMO,
	assertLassoInstance,
	lassoPrimal,
	lassoPrimalValue,
	lassoDualFenchel,
	lassoKktReport,
	lassoConstrainedDualFunction,
	lassoConstrainedDualOptimum
} from './duality.js';
import { softThreshold } from './regularization.js';
import { linspace } from './util.js';

describe('(P) min (x−1)² s.t. x ≤ 0 — closed forms', () => {
	it('matches independently computed values at the optimum', () => {
		// p* = 1 at x* = 0; λ* = 2; g(2) = 2 − 1 = 1.
		expect(paraboleObjective(0)).toBeCloseTo(1, 12);
		expect(PARABOLE_OPTIMUM.primal).toBe(1);
		expect(PARABOLE_OPTIMUM.dual).toBe(1);
		expect(dualFunctionParabole(2)).toBeCloseTo(1, 12);
		expect(dualMinimizerParabole(2)).toBeCloseTo(0, 12);
		// Saddle value L(0, 2) = 1 (Boyd & Vandenberghe §5.4.2).
		expect(lagrangianParabole(0, 2)).toBeCloseTo(1, 12);
	});

	it('round-trips through the stationarity equation', () => {
		// x(λ) = 1 − λ/2 must satisfy ∂L/∂x = 2(x−1) + λ = 0.
		for (const lambda of [0, 0.5, 2, 7]) {
			const x = dualMinimizerParabole(lambda);
			expect(2 * (x - 1) + lambda).toBeCloseTo(0, 12);
		}
	});

	it('satisfies weak duality g(λ) ≤ p* on a grid (invariant)', () => {
		for (const lambda of linspace(0, 10, 201)) {
			expect(dualFunctionParabole(lambda)).toBeLessThanOrEqual(PARABOLE_OPTIMUM.primal + 1e-12);
		}
	});

	it('g is concave and maximized at λ* = 2', () => {
		// g(λ) = λ − λ²/4 is a concave parabola with unique maximum 1 at λ = 2.
		for (const [a, b] of [
			[0, 4],
			[1, 3],
			[0.2, 2.9]
		] as const) {
			const mid = (a + b) / 2;
			expect(dualFunctionParabole(mid)).toBeGreaterThanOrEqual(
				(dualFunctionParabole(a) + dualFunctionParabole(b)) / 2 - 1e-12
			);
		}
		expect(dualFunctionParabole(2)).toBe(
			linspace(0, 4, 1001).reduce((m, l) => Math.max(m, dualFunctionParabole(l)), -Infinity)
		);
	});

	it('duality gap is nonnegative and zero exactly at λ* = 2', () => {
		for (const lambda of linspace(0, 6, 121)) {
			expect(dualGapParabole(lambda)).toBeGreaterThanOrEqual(-1e-12);
		}
		expect(dualGapParabole(2)).toBeCloseTo(0, 12);
		expect(dualGapParabole(0)).toBeCloseTo(1, 12); // g(0) = 0, gap = 1.
	});

	it('KKT: (0, 2) is the unique satisfying pair on a grid', () => {
		expect(kktCheckParabole(0, 2).allSatisfied).toBe(true);
		expect(kktCheckParabole(0, 2).stationarityResidual).toBeCloseTo(0, 12);

		// No other pair on a coarse grid satisfies all four conditions
		// (grids chosen so that x = 0 and λ = 2 are exact grid points).
		const xs = linspace(-2, 0.5, 101);
		const lambdas = linspace(0, 4, 17);
		for (const x of xs) {
			for (const lambda of lambdas) {
				if (Math.abs(x) < 1e-9 && Math.abs(lambda - 2) < 1e-9) continue;
				const report = kktCheckParabole(x, lambda, 1e-3);
				if (report.allSatisfied) {
					// Only near-duplicates of (0, 2) may pass with this tolerance.
					expect(Math.abs(x)).toBeLessThanOrEqual(1e-3);
					expect(Math.abs(lambda - 2)).toBeLessThanOrEqual(1e-3);
				}
			}
		}
	});

	it('rejects invalid inputs', () => {
		expect(() => dualFunctionParabole(-1)).toThrow(/lambda must be >= 0/);
		expect(() => lagrangianParabole(0, -0.5)).toThrow(/lambda must be >= 0/);
		expect(() => kktCheckParabole(Number.NaN, 1)).toThrow(/finite/);
	});
});

describe('(Q) min x⁴ − x² s.t. x ≤ 0 — KKT without convexity', () => {
	it('both reported KKT points satisfy the four conditions (exact case)', () => {
		const points = quarticKktPoints();
		expect(points).toHaveLength(2);
		for (const p of points) {
			expect(isKktQuartic(p.x, p.lambda).allSatisfied).toBe(true);
		}
	});

	it('the two KKT points are x = −1/√2 (min, f = −1/4) and x = 0 (max, f = 0)', () => {
		const [min, max] = quarticKktPoints();
		expect(min.x).toBeCloseTo(-1 / Math.SQRT2, 12);
		expect(min.fValue).toBeCloseTo(-1 / 4, 12);
		expect(min.role).toBe('global-minimum');
		expect(quarticObjective(min.x)).toBeCloseTo(-1 / 4, 12);
		expect(max.x).toBe(0);
		expect(max.fValue).toBe(0);
		expect(max.role).toBe('local-maximum');
		// x = 0 is a local maximum: f''(0) = −2 < 0, and f(x) < f(0) for x < 0 small.
		expect(quarticObjective(-1e-3)).toBeLessThan(0);
		expect(QUARTIC_OPTIMUM.xStar).toBeCloseTo(-1 / Math.SQRT2, 12);
	});

	it('KKT points outside the verified set are rejected', () => {
		// x = +1/√2 is a KKT candidate of the UNCONSTRAINED problem but is not
		// primal feasible for x ≤ 0.
		expect(isKktQuartic(1 / Math.SQRT2, 0).primalFeasible).toBe(false);
		expect(isKktQuartic(1 / Math.SQRT2, 0).allSatisfied).toBe(false);
		// x = −1/2, λ = 0: stationarity residual 4(−1/8) − 2(−1/2) = 0.5 ≠ 0.
		expect(isKktQuartic(-0.5, 0).stationarity).toBe(false);
		// Negative multiplier violates dual feasibility.
		expect(isKktQuartic(0, -1).dualFeasible).toBe(false);
	});

	it('dual function: exact value at λ = 0 and weak duality on a grid', () => {
		// g(0) = inf_x (x⁴ − x²) = −1/4 (attained at ±1/√2) — exact analytical case.
		expect(dualFunctionQuartic(0)).toBeCloseTo(-1 / 4, 6);
		// Weak duality: g(λ) ≤ p* = −1/4 for every λ ≥ 0 (Boyd & Vandenberghe §5.2.2).
		for (const lambda of linspace(0, 4, 41)) {
			expect(dualFunctionQuartic(lambda)).toBeLessThanOrEqual(QUARTIC_OPTIMUM.primal + 1e-6);
		}
	});

	it('dualArgminQuartic round-trips through stationarity 4x³ − 2x + λ = 0', () => {
		for (const lambda of [0, 0.3, 1, 2, 4]) {
			const x = dualArgminQuartic(lambda);
			// The argmin is a stationary point of the Lagrangian in x.
			expect(Math.abs(4 * x ** 3 - 2 * x + lambda)).toBeLessThan(1e-5);
			// g(λ) = L(x(λ), λ) and is below p* (weak duality).
			expect(lagrangianQuartic(x, lambda)).toBeCloseTo(dualFunctionQuartic(lambda), 6);
			expect(lagrangianQuartic(x, lambda)).toBeLessThanOrEqual(QUARTIC_OPTIMUM.primal + 1e-6);
		}
	});

	it('dual function is concave on a grid (invariant, holds even non-convex)', () => {
		const grid = linspace(0, 2, 11);
		const values = grid.map((l) => dualFunctionQuartic(l));
		for (let i = 0; i < values.length - 2; i++) {
			const mid = (values[i] + values[i + 2]) / 2;
			expect(values[i + 1]).toBeGreaterThanOrEqual(mid - 1e-6);
		}
	});

	it('Lagrangian at a KKT point of (Q) matches the objective (complementary slackness)', () => {
		for (const p of quarticKktPoints()) {
			expect(lagrangianQuartic(p.x, p.lambda)).toBeCloseTo(p.fValue, 12);
		}
	});

	it('rejects invalid inputs', () => {
		expect(() => dualFunctionQuartic(-0.1)).toThrow(/lambda must be >= 0/);
		expect(() => isKktQuartic(0, Number.POSITIVE_INFINITY)).toThrow(/finite/);
	});
});

describe('(R) min (x−1)²+(y−1)² s.t. x+y ≤ 1 — running 2-D example', () => {
	it('matches independently computed values at the optimum', () => {
		// Projection of (1,1) on the half-plane x+y ≤ 1: (1/2, 1/2), p* = 1/2.
		expect(conductingObjective(0.5, 0.5)).toBeCloseTo(0.5, 12);
		expect(CONDUCTOR_2D_OPTIMUM.primal).toBe(0.5);
		expect(CONDUCTOR_2D_OPTIMUM.dual).toBe(0.5);
		// Dual: g(1) = 1 − 1/2 = 1/2 at λ* = 1.
		expect(dualFunction2D(1)).toBeCloseTo(0.5, 12);
		expect(dualMinimizer2D(1)).toEqual([0.5, 0.5]);
		// Saddle identity: L(x(λ), y(λ), λ) = g(λ) for several λ.
		for (const lambda of [0, 0.4, 1, 2.3]) {
			const [x, y] = dualMinimizer2D(lambda);
			expect(conductingLagrangian(x, y, lambda)).toBeCloseTo(dualFunction2D(lambda), 10);
		}
	});

	it('round-trips through the stationarity equations', () => {
		// x(λ) = y(λ) = 1 − λ/2 must satisfy 2(x−1) + λ = 0.
		for (const lambda of [0, 0.5, 1, 4]) {
			const [x, y] = dualMinimizer2D(lambda);
			expect(2 * (x - 1) + lambda).toBeCloseTo(0, 12);
			expect(2 * (y - 1) + lambda).toBeCloseTo(0, 12);
		}
	});

	it('satisfies weak duality g(λ) ≤ p* and concavity on a grid (invariants)', () => {
		for (const lambda of linspace(0, 6, 121)) {
			expect(dualFunction2D(lambda)).toBeLessThanOrEqual(CONDUCTOR_2D_OPTIMUM.primal + 1e-12);
		}
		const grid = linspace(0, 3, 31);
		const values = grid.map((l) => dualFunction2D(l));
		for (let i = 0; i < values.length - 2; i++) {
			expect(values[i + 1]).toBeGreaterThanOrEqual((values[i] + values[i + 2]) / 2 - 1e-12);
		}
	});

	it('duality gap is nonnegative and zero exactly at λ* = 1', () => {
		for (const lambda of linspace(0, 5, 101)) {
			expect(dualGap2D(lambda)).toBeGreaterThanOrEqual(-1e-12);
		}
		expect(dualGap2D(1)).toBeCloseTo(0, 12);
		// Closed form (λ−1)²/2 at a few points.
		expect(dualGap2D(0)).toBeCloseTo(0.5, 12);
		expect(dualGap2D(2)).toBeCloseTo(0.5, 12);
		expect(dualGap2D(3)).toBeCloseTo(2, 12);
	});

	it('KKT: ((1/2, 1/2), 1) is the unique satisfying triple on a grid', () => {
		const report = kktCheck2D(0.5, 0.5, 1);
		expect(report.allSatisfied).toBe(true);
		expect(report.stationarityResiduals).toEqual([0, 0]);
		const xs = linspace(-1, 1.5, 31);
		const lambdas = linspace(0, 3, 31);
		for (const x of xs) {
			for (const y of xs) {
				for (const lambda of lambdas) {
					if (Math.abs(x - 0.5) < 1e-9 && Math.abs(y - 0.5) < 1e-9 && Math.abs(lambda - 1) < 1e-9) continue;
					const r = kktCheck2D(x, y, lambda, 1e-3);
					if (r.allSatisfied) {
						expect(Math.abs(x - 0.5)).toBeLessThanOrEqual(1e-3);
						expect(Math.abs(y - 0.5)).toBeLessThanOrEqual(1e-3);
						expect(Math.abs(lambda - 1)).toBeLessThanOrEqual(1e-3);
					}
				}
			}
		}
	});

	it('perturbed value p*(u): closed form, chord inequality, λ(u) = −p*′(u)', () => {
		// p*(u) = (1−u)²/2 for u ≤ 1 (active), 0 for u ≥ 1 (inactive).
		expect(perturbedValue2D(0)).toBeCloseTo(0.5, 12);
		expect(perturbedValue2D(1)).toBeCloseTo(0, 12);
		expect(perturbedValue2D(1.5)).toBe(0);
		expect(perturbedValue2D(-0.5)).toBeCloseTo(2.25 / 2, 12);
		// Global sensitivity inequality (5.57): p*(u) ≥ p*(0) − λ*u with λ* = 1.
		for (const u of linspace(-1, 2, 61)) {
			expect(perturbedValue2D(u)).toBeGreaterThanOrEqual(0.5 - u - 1e-12);
		}
		// Convexity on a grid (midpoint below the chord).
		const grid = linspace(-1, 2, 31);
		const values = grid.map((u) => perturbedValue2D(u));
		for (let i = 0; i < values.length - 2; i++) {
			expect(values[i + 1]).toBeLessThanOrEqual((values[i] + values[i + 2]) / 2 + 1e-12);
		}
		// λ(u) = −p*'(u) on u < 1 (eq. 5.58 in closed form): p*'(u) = −(1−u).
		const h = 1e-6;
		for (const u of [-0.5, 0, 0.7]) {
			const deriv = (perturbedValue2D(u + h) - perturbedValue2D(u - h)) / (2 * h);
			expect(-deriv).toBeCloseTo(1 - u, 4);
		}
	});

	it('rejects invalid inputs', () => {
		expect(() => dualFunction2D(-0.1)).toThrow(/lambda must be >= 0/);
		expect(() => conductingLagrangian(0, 0, -1)).toThrow(/lambda must be >= 0/);
		expect(() => kktCheck2D(Number.NaN, 0, 1)).toThrow(/finite/);
		expect(() => perturbedValue2D(Number.POSITIVE_INFINITY)).toThrow(/finite/);
	});
});

describe('(G) gap examples under the non-convex constraint x² ≥ 1', () => {
	describe('(G1) « piège » min (x−2)² s.t. x² ≥ 1 — non-convex, gap ZERO', () => {
		it('primal: p* = 0 at x* = 2 (the unconstrained minimizer is feasible)', () => {
			// x = 2 is feasible (4 ≥ 1) and (x−2)² ≥ 0 with equality there.
			expect(GAP_TRAP_OPTIMUM.primal).toBe(0);
			expect(GAP_TRAP_OPTIMUM.xStar).toBe(2);
			expect(GAP_TRAP_OPTIMUM.gap).toBe(0);
			// Grid minimization over the feasible set agrees (min on x ≤ −1
			// is 9 at x = −1; on x ≥ 1 it is 0 at x = 2).
			let best = Infinity;
			for (let x = -1000; x <= 1000; x++) {
				const xv = x / 100;
				if (xv * xv >= 1 - 1e-12) best = Math.min(best, (xv - 2) ** 2);
			}
			expect(best).toBeCloseTo(0, 2);
			// KKT holds at (x* = 2, λ* = 0) — the constraint is inactive.
			// (Stationarity 2(x−2) + 2λx = 0, complementarity λ(1−x²) = 0.)
			expect(2 * (GAP_TRAP_OPTIMUM.xStar - 2) + 2 * GAP_TRAP_OPTIMUM.lambdaStar * GAP_TRAP_OPTIMUM.xStar).toBeCloseTo(0, 12);
			expect(GAP_TRAP_OPTIMUM.lambdaStar * (1 - GAP_TRAP_OPTIMUM.xStar ** 2)).toBeCloseTo(0, 12);
		});

		it('dual closed form g(λ) = −λ(3+λ)/(1−λ) agrees with a grid counter-minimization', () => {
			for (const lambda of [0, 0.1, 0.2, 0.5, 0.9]) {
				let best = Infinity;
				// The minimizer x(λ) = 2/(1−λ) reaches 20 at λ = 0.9, so the
				// window must go well past it.
				for (let x = -40000; x <= 40000; x++) {
					best = Math.min(best, trapLagrangian(x / 1000, lambda));
				}
				expect(best).toBeCloseTo(trapDual(lambda).value, 3);
				expect(trapDual(lambda).unbounded).toBe(false);
			}
			// g is decreasing on [0, 1) so d* = sup g = g(0) = 0 = p*.
			expect(trapDual(0).value).toBe(0);
			expect(trapDual(0.2).value).toBeCloseTo(-0.8, 12);
			expect(trapDual(0.5).value).toBeCloseTo(-3.5, 12);
			expect(trapDual(0.9).value).toBeCloseTo(-35.1, 12);
			for (const lambda of linspace(0.05, 0.95, 19)) {
				expect(trapDual(lambda).value).toBeLessThan(trapDual(lambda / 2).value);
			}
			expect(GAP_TRAP_OPTIMUM.dual).toBe(0);
		});

		it('the Lagrangian is unbounded below for λ ≥ 1 (g(λ) = −∞)', () => {
			expect(trapDual(1).unbounded).toBe(true);
			expect(trapDual(1.5).unbounded).toBe(true);
			// Direct check: L(±R, 1.2) = (1−λ)R² ∓ 4R + 4+λ → −∞ as R → +∞
			// (negative quadratic dominates the linear term in both directions).
			for (const sign of [1, -1]) {
				let prev = trapLagrangian(sign * 100, 1.2);
				for (const R of [1000, 10000]) {
					const cur = trapLagrangian(sign * R, 1.2);
					expect(cur).toBeLessThan(prev);
					prev = cur;
				}
				expect(prev).toBeLessThan(0);
			}
		});
	});

	describe('(G2) min x s.t. x² ≥ 1 — unbounded primal, p* = d* = −∞', () => {
		it('primal: p* = −∞ (x → −∞ is feasible); dual: g ≡ −∞', () => {
			expect(GAP_UNBOUNDED_OPTIMUM.primal).toBe(-Infinity);
			expect(GAP_UNBOUNDED_OPTIMUM.xStar).toBeNull();
			expect(GAP_UNBOUNDED_OPTIMUM.dual).toBe(-Infinity);
			for (const lambda of [0, 0.5, 10]) {
				expect(unboundedDual(lambda).value).toBe(-Infinity);
				expect(unboundedDual(lambda).unbounded).toBe(true);
			}
			// Direct checks: L(x, 0) = x is unbounded below; for λ > 0 the
			// quadratic −λx² dominates in both directions.
			expect(unboundedLagrangian(-1e6, 0)).toBeLessThan(-1e5);
			for (const sign of [1, -1]) {
				expect(unboundedLagrangian(sign * 1e6, 0.5)).toBeLessThan(-1e11);
			}
			// Feasibility of x → −∞: every x ≤ −1 is feasible and x → −∞.
			expect((-1e6) * (-1e6) >= 1).toBe(true);
		});
	});

	it('rejects invalid inputs', () => {
		expect(() => trapDual(-0.5)).toThrow(/lambda must be >= 0/);
		expect(() => trapLagrangian(0, -1)).toThrow(/lambda must be >= 0/);
		expect(() => unboundedDual(-0.1)).toThrow(/lambda must be >= 0/);
		expect(() => unboundedLagrangian(0, -1)).toThrow(/lambda must be >= 0/);
	});
});

describe('(L) Lasso: penalized and constrained primal–dual pair', () => {
	// Non-diagonal full-rank 2×2 instance (fixed, deterministic).
	const XND = [
		[2, 0.5],
		[0.5, 1]
	];
	const yND = [1.5, -0.7];

	it('1-D closed forms: θ* = S_λ(y), u* = clip(y, −λ, λ), p* = d*', () => {
		for (const [yy, lam] of [
			[3, 1],
			[0.5, 1],
			[-2.5, 1],
			[2, 3]
		] as const) {
			const theta = lassoPrimal([[1]], [yy], lam);
			expect(theta[0]).toBeCloseTo(softThreshold(yy, lam), 10);
			const { u, value } = lassoDualFenchel([[1]], [yy], lam);
			expect(u[0]).toBeCloseTo(Math.max(-lam, Math.min(lam, yy)), 10);
			// Exact values: ½(y−θ*)² + λ|θ*| and uy* − ½u*².
			const primal = 0.5 * (yy - theta[0]) ** 2 + lam * Math.abs(theta[0]);
			expect(value).toBeCloseTo(primal, 10);
		}
		// Hand-checked closed values.
		expect(lassoPrimalValue([[1]], [3], lassoPrimal([[1]], [3], 1), 1)).toBeCloseTo(2.5, 10);
		expect(lassoPrimalValue([[1]], [0.5], lassoPrimal([[1]], [0.5], 1), 1)).toBeCloseTo(0.125, 10);
		expect(lassoPrimalValue([[1]], [-2.5], lassoPrimal([[1]], [-2.5], 1), 1)).toBeCloseTo(2, 10);
	});

	it('diagonal demo instance: hand-computed solutions and sparsity thresholds', () => {
		const { X, y } = LASSO_DEMO;
		// Coordinates decouple: θ₁* = S_λ(3) (dies at λ = 3),
		// θ₂* = S_λ(−2)/4 (dies at λ = 2).
		let theta = lassoPrimal(X, y, 1);
		expect(theta[0]).toBeCloseTo(2, 10);
		expect(theta[1]).toBeCloseTo(-0.25, 10);
		expect(lassoPrimalValue(X, y, theta, 1)).toBeCloseTo(2.875, 10);
		theta = lassoPrimal(X, y, 2.5);
		expect(theta[0]).toBeCloseTo(0.5, 10);
		expect(theta[1]).toBeCloseTo(0, 10); // sparse: θ₂ died at λ = 2
		expect(lassoPrimalValue(X, y, theta, 2.5)).toBeCloseTo(4.875, 10);
		theta = lassoPrimal(X, y, 3.5);
		expect(theta[0]).toBeCloseTo(0, 10);
		expect(theta[1]).toBeCloseTo(0, 10); // λ ≥ ‖Xᵀy‖∞ = 3 ⇒ θ = 0
	});

	it('strong duality: Fenchel dual value = penalized primal value (invariant)', () => {
		const cases: [number[][], number[], number][] = [
			[XND, yND, 0.3],
			[XND, yND, 1],
			[XND, yND, 4],
			[LASSO_DEMO.X, [...LASSO_DEMO.y], 0.7],
			[LASSO_DEMO.X, [...LASSO_DEMO.y], 2.5]
		];
		for (const [X, y, lam] of cases) {
			const theta = lassoPrimal(X, y, lam);
			const primal = lassoPrimalValue(X, y, theta, lam);
			const { value } = lassoDualFenchel(X, y, lam);
			expect(value).toBeCloseTo(primal, 7);
		}
	});

	it('KKT inclusion: z* = Xᵀ(y−Xθ*)/λ ∈ ∂‖θ*‖₁ and u* = Xᵀ(y−Xθ*) (invariants)', () => {
		const cases: [number[][], number[], number][] = [
			[XND, yND, 0.3],
			[XND, yND, 1],
			[LASSO_DEMO.X, [...LASSO_DEMO.y], 1],
			[LASSO_DEMO.X, [...LASSO_DEMO.y], 2.5]
		];
		for (const [X, y, lam] of cases) {
			const theta = lassoPrimal(X, y, lam);
			const report = lassoKktReport(X, y, theta, lam);
			expect(report.subgradientOk).toBe(true);
			expect(report.maxAbsZ).toBeLessThanOrEqual(1 + 1e-6);
			// Primal–dual link: the Fenchel dual optimizer equals Xᵀ(y − Xθ*).
			const { u } = lassoDualFenchel(X, y, lam);
			for (let i = 0; i < u.length; i++) {
				expect(u[i]).toBeCloseTo(report.uStar[i], 6);
			}
		}
	});

	it('constrained dual: strong duality at the KKT point, weak duality vs a grid', () => {
		for (const t of [0.5, 1.5, 3]) {
			const { lambda, value: dualValue } = lassoConstrainedDualOptimum(LASSO_DEMO.X, [...LASSO_DEMO.y], t);
			// Strong duality: g(λ*) = max g = p*(t), and the corresponding
			// primal point θ_pen(λ*) is feasible for (P_t) and attains the
			// dual bound: ½‖y−Xθ‖² = p*(t). (Equivalently
			// p_pen(λ*) = p*(t) + λ*t: the KKT multiplier identity.)
			const theta = lassoPrimal(LASSO_DEMO.X, [...LASSO_DEMO.y], lambda);
			const l1 = Math.abs(theta[0]) + Math.abs(theta[1]);
			// Feasibility up to solver tolerance (golden-section + CD).
			expect(l1).toBeLessThanOrEqual(t + 1e-6);
			const primalAtTheta = lassoPrimalValue(LASSO_DEMO.X, [...LASSO_DEMO.y], theta, 0);
			// Golden-section precision on λ* leaves ~1e-7 in the value.
			expect(primalAtTheta).toBeCloseTo(dualValue, 6);
			// Path correspondence: the constraint is active for t ≤ 3.5 =
			// ‖θ(0)‖₁ on this instance, and on the diagonal demo the lasso
			// path is explicit: ‖θ(λ)‖₁ = max(3−λ, 0) + max(2−λ, 0)/4.
			const pathL1 = Math.max(3 - lambda, 0) + Math.max(2 - lambda, 0) / 4;
			expect(l1).toBeCloseTo(pathL1, 4);
			expect(l1).toBeCloseTo(t, 1);
			expect(lassoKktReport(LASSO_DEMO.X, [...LASSO_DEMO.y], theta, lambda).subgradientOk).toBe(true);
			// Weak duality vs an independent coarse grid primal: the grid can
			// only produce upper bounds on p*(t) ≥ dualValue (the grid may not
			// sample the exact optimum, e.g. the vertex (0.5, 0) for t = 0.5).
			let best = Infinity;
			const H = 4;
			for (let i = -100; i <= 100; i++) {
				for (let j = -100; j <= 100; j++) {
					const th1 = (i * H) / 100;
					const th2 = (j * H) / 100;
					if (Math.abs(th1) + Math.abs(th2) > t + 1e-9) continue;
					const r1 = LASSO_DEMO.y[0] - th1;
					const r2 = LASSO_DEMO.y[1] - 2 * th2;
					best = Math.min(best, 0.5 * (r1 * r1 + r2 * r2));
				}
			}
			expect(dualValue).toBeLessThanOrEqual(best + 1e-9);
		}
	});

	it('g(λ) = p_pen(λ) − λt is concave and nonincreasing past λ = ‖Xᵀy‖∞', () => {
		const t = 1.5;
		const grid = linspace(0, 4, 25);
		const values = grid.map((l) => lassoConstrainedDualFunction(LASSO_DEMO.X, [...LASSO_DEMO.y], t, l));
		for (let i = 0; i < values.length - 2; i++) {
			expect(values[i + 1]).toBeGreaterThanOrEqual((values[i] + values[i + 2]) / 2 - 1e-9);
		}
		// For λ ≥ ‖Xᵀy‖∞ = 3, θ(λ) = 0, so p_pen(λ) = ½‖y‖² = 5 and
		// g(λ) = 5 − λt (affine decreasing).
		expect(lassoConstrainedDualFunction(LASSO_DEMO.X, [...LASSO_DEMO.y], t, 3.2)).toBeCloseTo(5 - 3.2 * t, 6);
	});

	it('rejects invalid inputs', () => {
		expect(() => lassoPrimal(XND, yND, -0.1)).toThrow(/lambda must be >= 0/);
		expect(() => assertLassoInstance([[1, 1], [2, 2]], [1, 1])).toThrow(/full column rank/);
		expect(() => assertLassoInstance([[1, 2]], [1, 2])).toThrow(/y must have length/);
		expect(() => assertLassoInstance([[Number.NaN, 0], [0, 1]], [1, 1])).toThrow(/finite/);
		expect(() => lassoConstrainedDualOptimum(XND, yND, 0)).toThrow(/t must be > 0/);
		expect(() => lassoKktReport(XND, yND, [0, 0], 0)).toThrow(/lambda must be > 0/);
	});
});
