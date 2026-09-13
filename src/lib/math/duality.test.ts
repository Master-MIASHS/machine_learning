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
	QUARTIC_OPTIMUM
} from './duality.js';
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
