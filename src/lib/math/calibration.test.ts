import { describe, it, expect } from 'vitest';
import {
	SURROGATE_LOSSES,
	getLoss,
	conditionalPhiRisk,
	conditionalPhiRiskCurve,
	conditionalPhiRiskMinimizer,
	bayesConditionalPhiRisk,
	checkCalibration,
	pointwiseCalibration,
	decomposeExcessRisk,
	phiMinimizerZeroOneGap,
	simulateExcessRiskDecomposition,
	simulateExcessRiskDecompositionMean,
	REFERENCE_CLASS_GAP,
	type LossId
} from './calibration';
import { exponentialLoss } from './boosting';
import { hingeLoss, logLoss } from './loss-functions';
import { entropyBinary } from './entropy';
import { linspace } from './util';

describe('SURROGATE_LOSSES registry', () => {
	it('contains exactly the expected loss ids', () => {
		const ids = SURROGATE_LOSSES.map((l) => l.id);
		expect(ids).toEqual([
			'zeroOne',
			"logistic",
			'hinge',
			'exponential',
			'brier',
			'squaredMargin',
			'shiftedSquared'
		]);
	});

	it('getLoss returns the matching loss and throws on an unknown id', () => {
		expect(getLoss('hinge').id).toBe('hinge');
		expect(() => getLoss('relu' as LossId)).toThrow();
	});
});

describe('phi values (theorie.typ "Formalisation" table)', () => {
	it('zero-one loss: 1_{t<0}', () => {
		expect(getLoss('zeroOne').phi(-1)).toBe(1);
		expect(getLoss('zeroOne').phi(0)).toBe(0);
		expect(getLoss('zeroOne').phi(1)).toBe(0);
	});

	it('logistic: log(1+e^-t)', () => {
		expect(getLoss('logistic').phi(0)).toBeCloseTo(Math.log(2), 12);
		expect(getLoss('logistic').phi(1)).toBeCloseTo(Math.log(1 + Math.exp(-1)), 12);
	});

	it('hinge: max(0, 1-t)', () => {
		expect(getLoss('hinge').phi(0)).toBe(1);
		expect(getLoss('hinge').phi(1)).toBe(0);
		expect(getLoss('hinge').phi(2)).toBe(0);
		expect(getLoss('hinge').phi(-1)).toBe(2);
	});

	it('exponential: e^-t', () => {
		expect(getLoss('exponential').phi(0)).toBe(1);
		expect(getLoss('exponential').phi(1)).toBeCloseTo(Math.exp(-1), 12);
	});

	it('brier: (1-t)^2', () => {
		expect(getLoss('brier').phi(0)).toBe(1);
		expect(getLoss('brier').phi(1)).toBe(0);
		expect(getLoss('brier').phi(-1)).toBe(4);
	});
});

describe('consistency with existing loss modules', () => {
	it('logistic phi is the margin form of logLoss(w, x, +1)', () => {
		for (const t of [-2, -0.5, 0, 0.5, 1, 3]) {
			expect(getLoss('logistic').phi(t)).toBeCloseTo(logLoss([t], [1], 1), 12);
		}
	});

	it('exponential phi is the margin form of exponentialLoss', () => {
		for (const t of [-2, 0, 1, 3]) {
			expect(getLoss('exponential').phi(t)).toBeCloseTo(exponentialLoss(t), 12);
		}
	});

	it('hinge phi is the margin form of hingeLoss(w, x, +1)', () => {
		for (const t of [-2, 0, 0.5, 1, 1.5, 3]) {
			expect(getLoss('hinge').phi(t)).toBeCloseTo(hingeLoss([t], [1], 1), 12);
		}
	});
});

describe('derivatives', () => {
	it('match the theory values at 0 (theorie.typ "Vérification sur les exemples")', () => {
		expect(getLoss('logistic').dphi(0)).toBeCloseTo(-0.5, 12);
		expect(getLoss('hinge').dphi(0)).toBeCloseTo(-1, 12);
		expect(getLoss('exponential').dphi(0)).toBeCloseTo(-1, 12);
		expect(getLoss('brier').dphi(0)).toBeCloseTo(-2, 12);
	});

	it('hinge is differentiable at 0 (kink is at t = 1, not 0)', () => {
		// left and right one-sided derivatives at 0 agree
		const h = 1e-6;
		const hinge = getLoss('hinge');
		const left = (hinge.phi(0) - hinge.phi(-h)) / h;
		const right = (hinge.phi(h) - hinge.phi(0)) / h;
		expect(left).toBeCloseTo(-1, 5);
		expect(right).toBeCloseTo(-1, 5);
		// kink at 1: left slope -1, right slope 0
		const leftAt1 = (hinge.phi(1) - hinge.phi(1 - h)) / h;
		const rightAt1 = (hinge.phi(1 + h) - hinge.phi(1)) / h;
		expect(leftAt1).toBeCloseTo(-1, 5);
		expect(rightAt1).toBeCloseTo(0, 5);
	});

	it('zero-one loss is discontinuous at 0 with dphi = 0 a.e.', () => {
		const z = getLoss('zeroOne');
		expect(z.phi(-1e-9)).toBe(1);
		expect(z.phi(0)).toBe(0);
		expect(z.dphi(-1)).toBe(0);
		expect(z.dphi(1)).toBe(0);
	});

	it('dphi matches central finite differences for the smooth losses', () => {
		const h = 1e-5;
		for (const id of ['logistic', 'exponential', 'brier', 'squaredMargin', 'shiftedSquared'] as const) {
			const loss = getLoss(id);
			for (const t of [-1, 0, 1, 2]) {
				const fd = (loss.phi(t + h) - loss.phi(t - h)) / (2 * h);
				expect(loss.dphi(t)).toBeCloseTo(fd, 4);
			}
		}
	});

	it('stored one-sided derivatives at 0 match one-sided finite differences', () => {
		const h = 1e-5;
		for (const id of ['logistic', 'hinge', 'exponential', 'brier', 'squaredMargin', 'shiftedSquared'] as const) {
			const loss = getLoss(id);
			const left = (loss.phi(0) - loss.phi(-h)) / h;
			const right = (loss.phi(h) - loss.phi(0)) / h;
			expect(loss.dphiLeftAt0).toBeCloseTo(left, 4);
			expect(loss.dphiRightAt0).toBeCloseTo(right, 4);
		}
		// zero-one: left derivative at 0 is -Infinity (discontinuous), right is 0
		const z = getLoss('zeroOne');
		expect(z.dphiLeftAt0).toBeLessThan(0);
		expect(Number.isFinite(z.dphiLeftAt0)).toBe(false);
		expect(z.dphiRightAt0).toBe(0);
	});
});

describe('conditionalPhiRisk (theorie.typ "Calibration")', () => {
	it('matches C_phi(alpha, eta) = eta phi(alpha) + (1-eta) phi(-alpha)', () => {
		const logistic = getLoss('logistic');
		const alpha = 0.7;
		const eta = 0.3;
		const expected = eta * logistic.phi(alpha) + (1 - eta) * logistic.phi(-alpha);
		expect(conditionalPhiRisk(alpha, eta, logistic)).toBeCloseTo(expected, 12);
	});

	it('satisfies the symmetry C_phi(alpha, eta) = C_phi(-alpha, 1-eta)', () => {
		for (const loss of SURROGATE_LOSSES) {
			for (const [alpha, eta] of [
				[0.4, 0.25],
				[-1.1, 0.7],
				[2, 0.5]
			]) {
				expect(conditionalPhiRisk(alpha, eta, loss)).toBeCloseTo(
					conditionalPhiRisk(-alpha, 1 - eta, loss),
					12
				);
			}
		}
	});

	it('at eta = 1/2 reduces to the symmetric average (phi(alpha)+phi(-alpha))/2', () => {
		for (const loss of SURROGATE_LOSSES) {
			for (const alpha of [-2, -0.5, 0.3, 1.7]) {
				const expected = (loss.phi(alpha) + loss.phi(-alpha)) / 2;
				expect(conditionalPhiRisk(alpha, 0.5, loss)).toBeCloseTo(expected, 12);
			}
		}
	});

	it('rejects eta outside [0,1]', () => {
		const loss = getLoss('logistic');
		expect(() => conditionalPhiRisk(0, 1.2, loss)).toThrow();
		expect(() => conditionalPhiRisk(0, -0.1, loss)).toThrow();
	});

	it('curve evaluates C_phi over the whole grid', () => {
		const grid = linspace(-3, 3, 7);
		const loss = getLoss('brier');
		const curve = conditionalPhiRiskCurve(0.7, grid, loss);
		expect(curve).toHaveLength(7);
		grid.forEach((alpha, i) => {
			expect(curve[i]).toBeCloseTo(conditionalPhiRisk(alpha, 0.7, loss), 12);
		});
	});
});

describe('conditionalPhiRiskMinimizer (closed-form cross-checks)', () => {
	const etas = [0.2, 0.3, 0.6, 0.7, 0.9];

	// the ternary refinement resolves the minimizer to ~1e-8, so 1e-6 is the
	// honest accuracy for these closed-form cross-checks
	it('logistic: alpha* = logit(eta) = log(eta/(1-eta))', () => {
		const loss = getLoss('logistic');
		for (const eta of etas) {
			const { alpha } = conditionalPhiRiskMinimizer(eta, loss);
			expect(alpha).toBeCloseTo(Math.log(eta / (1 - eta)), 6);
		}
	});

	it('exponential: alpha* = logit(eta)/2', () => {
		const loss = getLoss('exponential');
		for (const eta of etas) {
			const { alpha } = conditionalPhiRiskMinimizer(eta, loss);
			expect(alpha).toBeCloseTo(0.5 * Math.log(eta / (1 - eta)), 6);
		}
	});

	it('brier: alpha* = 2 eta - 1', () => {
		const loss = getLoss('brier');
		for (const eta of etas) {
			const { alpha } = conditionalPhiRiskMinimizer(eta, loss);
			expect(alpha).toBeCloseTo(2 * eta - 1, 6);
		}
	});

	it('hinge: alpha* = +1 for eta > 1/2, -1 for eta < 1/2', () => {
		const loss = getLoss('hinge');
		for (const eta of etas) {
			const { alpha } = conditionalPhiRiskMinimizer(eta, loss);
			expect(alpha).toBeCloseTo(eta > 0.5 ? 1 : -1, 8);
		}
	});

	it('at eta = 1/2 the minimizer is 0 for the smooth losses', () => {
		for (const id of ['logistic', 'exponential', 'brier', 'squaredMargin', 'shiftedSquared'] as const) {
			const { alpha } = conditionalPhiRiskMinimizer(0.5, getLoss(id));
			expect(alpha).toBeCloseTo(0, 5);
		}
	});

	it('at eta = 1/2 the hinge minimizer set is the whole interval [-1, 1]', () => {
		const { alpha, risk } = conditionalPhiRiskMinimizer(0.5, getLoss('hinge'));
		expect(risk).toBeCloseTo(1, 10);
		expect(alpha).toBeGreaterThanOrEqual(-1 - 1e-9);
		expect(alpha).toBeLessThanOrEqual(1 + 1e-9);
	});

	it('the non-calibrated counterexamples do not track eta', () => {
		// squared margin: C_phi(alpha, eta) = alpha^2, minimizer 0 for every eta
		const sq = getLoss('squaredMargin');
		for (const eta of etas) {
			const { alpha, tracksEta } = pointwiseCalibration(eta, sq);
			expect(alpha).toBeCloseTo(0, 5);
			expect(tracksEta).toBe(false);
		}
		// shifted squared: alpha* = 1 - 2 eta, wrong sign on both sides of 1/2
		const sh = getLoss('shiftedSquared');
		for (const eta of etas) {
			const { alpha, tracksEta } = pointwiseCalibration(eta, sh);
			expect(alpha).toBeCloseTo(1 - 2 * eta, 6);
			expect(tracksEta).toBe(false);
		}
	});
});

describe('bayesConditionalPhiRisk (closed-form C_phi^*(eta))', () => {
	const etas = [0.2, 0.3, 0.5, 0.7, 0.9];

	it('logistic: C_phi^*(eta) = binary entropy H(eta) (nats)', () => {
		const loss = getLoss('logistic');
		for (const eta of etas) {
			expect(bayesConditionalPhiRisk(eta, loss)).toBeCloseTo(entropyBinary(eta), 6);
		}
	});

	it('exponential: C_phi^*(eta) = 2 sqrt(eta (1-eta))', () => {
		const loss = getLoss('exponential');
		for (const eta of etas) {
			expect(bayesConditionalPhiRisk(eta, loss)).toBeCloseTo(2 * Math.sqrt(eta * (1 - eta)), 6);
		}
	});

	it('brier: C_phi^*(eta) = 4 eta (1-eta)', () => {
		const loss = getLoss('brier');
		for (const eta of etas) {
			expect(bayesConditionalPhiRisk(eta, loss)).toBeCloseTo(4 * eta * (1 - eta), 6);
		}
	});

	it('hinge: C_phi^*(eta) = 2 min(eta, 1-eta)', () => {
		const loss = getLoss('hinge');
		for (const eta of etas) {
			expect(bayesConditionalPhiRisk(eta, loss)).toBeCloseTo(2 * Math.min(eta, 1 - eta), 6);
		}
	});
});

describe('checkCalibration (Théorème 4.1: calibrated <=> differentiable at 0 and phi\'(0) < 0)', () => {
	it('logistic, hinge, exponential, brier are calibrated', () => {
		for (const id of ['logistic', 'hinge', 'exponential', 'brier'] as const) {
			const check = checkCalibration(getLoss(id));
			expect(check.differentiableAtZero).toBe(true);
			expect(check.calibrated).toBe(true);
			expect(check.phiPrimeAtZero).toBeLessThan(0);
		}
	});

	it('hinge is differentiable at 0 with phi\'(0) = -1 (kink at 1, not 0)', () => {
		const check = checkCalibration(getLoss('hinge'));
		expect(check.left).toBe(-1);
		expect(check.right).toBe(-1);
		expect(check.phiPrimeAtZero).toBe(-1);
	});

	it('zero-one loss is not differentiable at 0, hence not calibrated', () => {
		const check = checkCalibration(getLoss('zeroOne'));
		expect(check.differentiableAtZero).toBe(false);
		expect(check.phiPrimeAtZero).toBeNull();
		expect(check.calibrated).toBe(false);
	});

	it('phi\'(0) = 0 (t^2) and phi\'(0) > 0 ((1+t)^2) fail the criterion', () => {
		const sq = checkCalibration(getLoss('squaredMargin'));
		expect(sq.differentiableAtZero).toBe(true);
		expect(sq.phiPrimeAtZero).toBe(0);
		expect(sq.calibrated).toBe(false);

		const sh = checkCalibration(getLoss('shiftedSquared'));
		expect(sh.differentiableAtZero).toBe(true);
		expect(sh.phiPrimeAtZero).toBe(2);
		expect(sh.calibrated).toBe(false);
	});
});

describe('pointwiseCalibration', () => {
	it('the four calibrated losses track the sign of eta - 1/2', () => {
		for (const id of ['logistic', 'hinge', 'exponential', 'brier'] as const) {
			for (const eta of [0.2, 0.4, 0.6, 0.8]) {
				const { expectedSign, tracksEta } = pointwiseCalibration(eta, getLoss(id));
				expect(expectedSign).toBe(eta > 0.5 ? 1 : -1);
				expect(tracksEta).toBe(true);
			}
		}
	});

	it('eta = 1/2 is outside the definition (tracksEta = null)', () => {
		for (const loss of SURROGATE_LOSSES) {
			expect(pointwiseCalibration(0.5, loss).tracksEta).toBeNull();
		}
	});
});

describe('decomposeExcessRisk (Théorème 4.2)', () => {
	it('telescopes: total = estimation + calibration + approximation = rHat - rBayes', () => {
		const d = decomposeExcessRisk(0.35, 0.25, 0.18, 0.1);
		expect(d.estimation).toBeCloseTo(0.1, 12);
		expect(d.calibration).toBeCloseTo(0.07, 12);
		expect(d.approximation).toBeCloseTo(0.08, 12);
		expect(d.total).toBeCloseTo(d.estimation + d.calibration + d.approximation, 12);
		expect(d.total).toBeCloseTo(0.35 - 0.1, 12);
	});

	it('calibration term B = 0 when the in-class optimum reaches the global minimizer (f** in F)', () => {
		const d = decomposeExcessRisk(0.3, 0.15, 0.15, 0.1);
		expect(d.calibration).toBe(0);
	});

	it('all terms vanish when all risks coincide', () => {
		const d = decomposeExcessRisk(0.2, 0.2, 0.2, 0.2);
		expect(d.estimation).toBe(0);
		expect(d.calibration).toBe(0);
		expect(d.approximation).toBe(0);
		expect(d.total).toBe(0);
	});

	it('the estimation term is not clamped (the theory does not guarantee A >= 0 pointwise)', () => {
		const d = decomposeExcessRisk(0.1, 0.2, 0.3, 0.05);
		expect(d.estimation).toBeCloseTo(-0.1, 12);
	});

	it('throws for a risk outside [0,1]', () => {
		expect(() => decomposeExcessRisk(1.1, 0.2, 0.1, 0.05)).toThrow();
		expect(() => decomposeExcessRisk(0.3, -0.1, 0.1, 0.05)).toThrow();
		expect(() => decomposeExcessRisk(0.3, 0.2, 1.2, 0.05)).toThrow();
		expect(() => decomposeExcessRisk(0.3, 0.2, 0.1, -0.01)).toThrow();
	});
});

describe('phiMinimizerZeroOneGap (term C of Théorème 4.2)', () => {
	const etaWeights: [number, number][] = [
		[0.3, 0.5],
		[0.7, 0.5]
	];

	it('is exactly 0 for the four calibrated losses (h_{f**} = h* a.s.)', () => {
		for (const id of ['logistic', 'hinge', 'exponential', 'brier'] as const) {
			expect(phiMinimizerZeroOneGap(getLoss(id), etaWeights)).toBe(0);
		}
	});

	it('squared margin (alpha* = 0, predicts +1): risk 1/2, so C = 1/2 - R* = 0.2', () => {
		expect(phiMinimizerZeroOneGap(getLoss('squaredMargin'), etaWeights)).toBeCloseTo(0.2, 10);
	});

	it('shifted squared (alpha* = 1 - 2 eta, wrong sign on both sides): C = 0.4', () => {
		expect(phiMinimizerZeroOneGap(getLoss('shiftedSquared'), etaWeights)).toBeCloseTo(0.4, 10);
	});

	it('is symmetric under eta -> 1 - eta', () => {
		const flipped = etaWeights.map(([e, w]): [number, number] => [1 - e, w]);
		for (const id of ['logistic', 'squaredMargin', 'shiftedSquared'] as const) {
			expect(phiMinimizerZeroOneGap(getLoss(id), flipped)).toBeCloseTo(
				phiMinimizerZeroOneGap(getLoss(id), etaWeights),
				10
			);
		}
	});

	it('accepts unnormalized weights (same gap as normalized)', () => {
		expect(phiMinimizerZeroOneGap(getLoss('shiftedSquared'), [[0.3, 3], [0.7, 7]])).toBeCloseTo(
			0.4,
			10
		);
	});

	it('rejects invalid inputs', () => {
		expect(() => phiMinimizerZeroOneGap(getLoss('logistic'), [])).toThrow();
		expect(() => phiMinimizerZeroOneGap(getLoss('logistic'), [[0.3, 0.5], [1.7, 0.5]])).toThrow();
		expect(() => phiMinimizerZeroOneGap(getLoss('logistic'), [[-0.3, 0.5], [0.7, 0.5]])).toThrow();
		expect(() => phiMinimizerZeroOneGap(getLoss('logistic'), [[0.3, -0.5], [0.7, 0.5]])).toThrow();
		expect(() => phiMinimizerZeroOneGap(getLoss('logistic'), [[0.3, 0], [0.7, 0]])).toThrow();
	});
});

describe('simulateExcessRiskDecomposition', () => {
	const base = { n: 100, classCapacity: 0.5, calibrationGap: 0.02, bayesRisk: 0.2 };

	it('is deterministic for a fixed seed', () => {
		const a = simulateExcessRiskDecomposition({ ...base, seed: 7 });
		const b = simulateExcessRiskDecomposition({ ...base, seed: 7 });
		expect(a).toEqual(b);
	});

	it('risks are consistent: gaps match the parameters, risks stay in [0,1]', () => {
		const s = simulateExcessRiskDecomposition({ ...base, seed: 3 });
		expect(s.rBayes).toBe(base.bayesRisk);
		expect(s.rDoubleStar - s.rBayes).toBeCloseTo(base.calibrationGap, 12);
		expect(s.rStar - s.rDoubleStar).toBeCloseTo((1 - base.classCapacity) * REFERENCE_CLASS_GAP, 12);
		expect(s.rHat).toBeGreaterThanOrEqual(s.rStar);
		for (const r of [s.rHat, s.rStar, s.rDoubleStar, s.rBayes]) {
			expect(r).toBeGreaterThanOrEqual(0);
			expect(r).toBeLessThanOrEqual(1);
		}
		expect(s.total).toBeCloseTo(s.rHat - s.rBayes, 12);
		expect(s.total).toBeCloseTo(s.estimation + s.calibration + s.approximation, 12);
	});

	it('classCapacity = 1 makes the calibration term exactly 0 (f** in F)', () => {
		const s = simulateExcessRiskDecomposition({ ...base, classCapacity: 1, seed: 5 });
		expect(s.calibration).toBe(0);
	});

	it('calibrationGap = 0 makes the approximation term exactly 0 (calibrated phi)', () => {
		const s = simulateExcessRiskDecomposition({ ...base, calibrationGap: 0, seed: 5 });
		expect(s.approximation).toBe(0);
	});

	it('the estimation gap concentrates at rate 1/sqrt(n) (mean of a half-normal)', () => {
		const trials = 20000;
		const n = 400;
		const params = { classCapacity: 1, calibrationGap: 0, bayesRisk: 0.5 };
		const scale = Math.sqrt(0.5 * 0.5 / n);
		let sum = 0;
		for (let t = 0; t < trials; t++) {
			sum += simulateExcessRiskDecomposition({ n, ...params, seed: t }).estimation;
		}
		const mean = sum / trials;
		// E[max(0, Z)] = 1/sqrt(2 pi) for Z ~ N(0,1)
		expect(mean).toBeCloseTo(scale / Math.sqrt(2 * Math.PI), 2);
	});

	it('the mean estimation gap shrinks as n grows', () => {
		const trials = 4000;
		const params = { classCapacity: 1, calibrationGap: 0, bayesRisk: 0.5 };
		const meanAt = (n: number) => {
			let sum = 0;
			for (let t = 0; t < trials; t++) {
				sum += simulateExcessRiskDecomposition({ n, ...params, seed: t }).estimation;
			}
			return sum / trials;
		};
		expect(meanAt(1600)).toBeLessThan(meanAt(100));
	});

	it('throws for invalid parameters', () => {
		expect(() => simulateExcessRiskDecomposition({ ...base, n: 0 })).toThrow();
		expect(() => simulateExcessRiskDecomposition({ ...base, n: 2.5 })).toThrow();
		expect(() => simulateExcessRiskDecomposition({ ...base, classCapacity: 1.2 })).toThrow();
		expect(() => simulateExcessRiskDecomposition({ ...base, classCapacity: -0.1 })).toThrow();
		expect(() => simulateExcessRiskDecomposition({ ...base, calibrationGap: -0.01 })).toThrow();
		expect(() => simulateExcessRiskDecomposition({ ...base, bayesRisk: -0.1 })).toThrow();
		expect(() =>
			simulateExcessRiskDecomposition({ ...base, bayesRisk: 0.92, calibrationGap: 0.05, classCapacity: 0 })
		).toThrow();
	});
});

describe('simulateExcessRiskDecompositionMean', () => {
	const base = { n: 200, classCapacity: 0.5, calibrationGap: 0.2, bayesRisk: 0.15 };

	it('is deterministic for fixed parameters', () => {
		const a = simulateExcessRiskDecompositionMean({ ...base, seed: 1 }, 200);
		const b = simulateExcessRiskDecompositionMean({ ...base, seed: 1 }, 200);
		expect(a).toEqual(b);
	});

	it('the estimation term is exactly proportional to 1/sqrt(n) (shared draws, rescaled)', () => {
		const a10 = simulateExcessRiskDecompositionMean({ ...base, n: 10, seed: 1 }, 200).estimation;
		const a2000 = simulateExcessRiskDecompositionMean({ ...base, n: 2000, seed: 1 }, 200).estimation;
		expect(a10 / a2000).toBeCloseTo(Math.sqrt(200), 10);
	});

	it('the estimation mean converges to the half-normal mean scale/sqrt(2 pi)', () => {
		const single = simulateExcessRiskDecomposition({ ...base, seed: 1 });
		const scale = Math.sqrt((single.rStar * (1 - single.rStar)) / base.n);
		const mean = simulateExcessRiskDecompositionMean({ ...base, seed: 1 }, 2000).estimation;
		expect(mean).toBeCloseTo(scale / Math.sqrt(2 * Math.PI), 1);
	});

	it('the estimation mean is non-increasing in n over the demo slider grid', () => {
		let prev = Infinity;
		for (let n = 10; n <= 2000; n += 10) {
			const e = simulateExcessRiskDecompositionMean({ ...base, n, seed: 1 }, 200).estimation;
			expect(e).toBeLessThanOrEqual(prev + 1e-15);
			prev = e;
		}
	});

	it('deterministic fields match a single simulation; telescoping identity holds', () => {
		const m = simulateExcessRiskDecompositionMean({ ...base, seed: 1 }, 200);
		const s = simulateExcessRiskDecomposition({ ...base, seed: 1 });
		expect(m.calibration).toBe(s.calibration);
		expect(m.approximation).toBe(s.approximation);
		expect(m.rStar).toBe(s.rStar);
		expect(m.rDoubleStar).toBe(s.rDoubleStar);
		expect(m.rBayes).toBe(s.rBayes);
		expect(m.total).toBeCloseTo(m.estimation + m.calibration + m.approximation, 12);
		expect(m.total).toBeCloseTo(m.rHat - m.rBayes, 12);
	});

	it('throws for invalid nReplicates', () => {
		expect(() => simulateExcessRiskDecompositionMean(base, 0)).toThrow();
		expect(() => simulateExcessRiskDecompositionMean(base, -3)).toThrow();
		expect(() => simulateExcessRiskDecompositionMean(base, 2.5)).toThrow();
	});
});
