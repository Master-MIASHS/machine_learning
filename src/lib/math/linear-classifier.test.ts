import { describe, it, expect } from 'vitest';
import {
	affineScore,
	halfSpaceDecision,
	logisticProbability,
	decisionBoundaryLine,
	generateSeparableClasses2D,
	type LabeledPoint2D
} from './linear-classifier';
import { logLoss } from './loss-functions';

describe('affineScore', () => {
	it('computes ⟨w,x⟩ + b by hand', () => {
		expect(affineScore([1, 2], 3, [4, 5])).toBe(1 * 4 + 2 * 5 + 3);
		expect(affineScore([0, 0], -2, [10, 20])).toBe(-2);
	});

	it('throws on dimension mismatch', () => {
		expect(() => affineScore([1, 2], 0, [1])).toThrow();
	});
});

describe('halfSpaceDecision', () => {
	it('agrees with the sign of ⟨w,x⟩ + b, with sign(0) = +1 by convention', () => {
		expect(halfSpaceDecision([1, 0], 0, [1, 9])).toBe(1);
		expect(halfSpaceDecision([1, 0], 0, [-1, 9])).toBe(-1);
		// Point exactly on the hyperplane → +1 (convention documentée)
		expect(halfSpaceDecision([1, 1], 0, [1, -1])).toBe(1);
		// z = -2 + 1 = -1 < 0 → -1
		expect(halfSpaceDecision([1, 1], 1, [-1, -1])).toBe(-1);
	});

	it('matches the sign of affineScore pointwise on the generated data', () => {
		const points = generateSeparableClasses2D(30, 3, 11);
		const w: [number, number] = [1, 1];
		const b = 0;
		for (const p of points) {
			const expected = affineScore(w, b, [p.x1, p.x2]) >= 0 ? 1 : -1;
			expect(halfSpaceDecision(w, b, [p.x1, p.x2])).toBe(expected);
		}
	});
});

describe('logisticProbability', () => {
	it('is 1/2 on the hyperplane and monotone in z', () => {
		expect(logisticProbability([1, 1], 0, [1, -1])).toBeCloseTo(0.5, 12);
		const near = logisticProbability([1, 0], 0, [0.1, 0]);
		const far = logisticProbability([1, 0], 0, [3, 0]);
		expect(far).toBeGreaterThan(near);
		expect(far).toBeGreaterThan(0.5);
		expect(near).toBeGreaterThan(0.5);
	});

	it('takes values in (0,1) for all generated points', () => {
		const points = generateSeparableClasses2D(40, 2, 3);
		for (const p of points) {
			const v = logisticProbability([1, 1], 0.3, [p.x1, p.x2]);
			expect(v).toBeGreaterThan(0);
			expect(v).toBeLessThan(1);
		}
	});

	it('its sign relative to 1/2 always matches halfSpaceDecision', () => {
		const points = generateSeparableClasses2D(50, 2.5, 77);
		for (const p of points) {
			const v = logisticProbability([1, 1], 0, [p.x1, p.x2]);
			const sign = halfSpaceDecision([1, 1], 0, [p.x1, p.x2]);
			if (sign === 1) expect(v).toBeGreaterThanOrEqual(0.5);
			else expect(v).toBeLessThan(0.5);
		}
	});
});

describe('logLoss with explicit bias', () => {
	it('logLoss(w, x, y, b) equals logLoss([w..., b], [x..., 1], y) (biais comme dernière feature)', () => {
		const w = [1.3, -0.7];
		const b = 0.9;
		const x = [0.4, 2.1];
		for (const y of [1, -1]) {
			const direct = logLoss(w, x, y, b);
			const augmented = logLoss([...w, b], [...x, 1], y);
			expect(direct).toBeCloseTo(augmented, 12);
		}
	});

	it('depends on (y, z) only through the product yz', () => {
		// ℓ(y, z) = log(1 + e^{-yz}) : (y, z) → (−y, −z) préserve le produit,
		// donc la perte. Ici −z est obtenu par w → −w et b → −b.
		const w = [0.5, 1];
		const x = [1, -0.5];
		const b = 0.2;
		const base = logLoss(w, x, 1, b);
		expect(logLoss([-w[0], -w[1]], x, -1, -b)).toBeCloseTo(base, 12);
		// Changer SEUL le signe de y change la perte (marge correcte vs. incorrecte)
		const z = w[0] * x[0] + w[1] * x[1] + b;
		expect(z).toBeGreaterThan(0);
		expect(logLoss(w, x, -1, b)).toBeGreaterThan(logLoss(w, x, 1, b));
	});
});

describe('decisionBoundaryLine', () => {
	it('recovers slope -w1/w2 and intercept -b/w2 on a simple case', () => {
		// w = (1, 1), b = 0 → y = -x : pente -1, ordonnée 0
		expect(decisionBoundaryLine([1, 1], 0)).toEqual({ slope: -1, intercept: 0 });
		// w = (2, 1), b = 1 → y = -2x - 1
		expect(decisionBoundaryLine([2, 1], 1)).toEqual({ slope: -2, intercept: -1 });
	});

	it('returns null for a vertical boundary (w2 = 0)', () => {
		expect(decisionBoundaryLine([3, 0], 1)).toBeNull();
	});

	it('the line separates the two generated blobs when w is the true normal', () => {
		// Générateur : centres (s/2, s/2) et (−s/2, −s/2) → normale (1,1), b = 0.
		const s = 3;
		const points = generateSeparableClasses2D(60, s, 21);
		const line = decisionBoundaryLine([1, 1], 0);
		expect(line).not.toBeNull();
		// Un point de la classe +1 a ⟨(1,1), x⟩ = x1 + x2 ≥ 0 au-delà de la droite
		// (test de sanity sur une séparation forte, pas une consistance rigoureuse).
		const misclassified = points.filter(
			(p) => p.label === 1 ? p.x1 + p.x2 < 0 : p.x1 + p.x2 > 0
		);
		expect(misclassified.length).toBeLessThan(points.length * 0.1);
	});
});

describe('generateSeparableClasses2D', () => {
	it('is deterministic for a fixed seed', () => {
		const a = generateSeparableClasses2D(20, 2, 99);
		const b = generateSeparableClasses2D(20, 2, 99);
		expect(a).toEqual(b);
	});

	it('produces the requested class balance', () => {
		const points: LabeledPoint2D[] = generateSeparableClasses2D(13, 1, 5);
		expect(points.length).toBe(26);
		expect(points.filter((p) => p.label === 1).length).toBe(13);
		expect(points.filter((p) => p.label === -1).length).toBe(13);
	});

	it('the optimal hyperplane classifies almost perfectly at large separation', () => {
		const points = generateSeparableClasses2D(200, 5, 8);
		const errors = points.filter((p) => p.label !== halfSpaceDecision([1, 1], 0, [p.x1, p.x2]));
		expect(errors.length / points.length).toBeLessThan(0.02);
	});

	it('degrades towards chance (≈50 %) at zero separation', () => {
		const points = generateSeparableClasses2D(400, 0, 8);
		const errors = points.filter((p) => p.label !== halfSpaceDecision([1, 1], 0, [p.x1, p.x2]));
		const rate = errors.length / points.length;
		expect(rate).toBeGreaterThan(0.4);
		expect(rate).toBeLessThan(0.6);
	});

	it('rejects invalid inputs', () => {
		expect(() => generateSeparableClasses2D(0, 1)).toThrow();
		expect(() => generateSeparableClasses2D(10, Number.NaN)).toThrow();
	});
});
