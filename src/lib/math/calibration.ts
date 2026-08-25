// src/lib/math/calibration.ts
//
// Part VII — Fonctions de perte : pertes de substitution et calibration
// Reference: theorie.typ — "Motivation : pourquoi ne pas minimiser la perte 0-1 ?",
// "Formalisation" (perte phi, phi-risque, phi-risque de Bayes), "Calibration"
// (risque conditionnel C_phi, calibration ponctuelle, Théorème 4.1 —
// Bartlett, Jordan, McAuliffe 2006), "Décomposition de l'erreur"
// (Théorème 4.2).

import { exponentialLoss, logisticLoss } from './boosting';
import { gaussianSample } from './gaussian';
import { combineSeed, mulberry32 } from './util';

// ---------------------------------------------------------------------------
// Surrogate losses  phi : RR -> RR_+  applied to the margin t = y f(x)
//
// theorie.typ ("Formalisation"): ell_phi(f(x), y) = phi(y f(x)).
// logistic and exponential are reused from boosting.ts (same margin form);
// hinge / brier / 0-1 are defined here in scalar margin form.
// ---------------------------------------------------------------------------

export type LossId =
	| 'zeroOne'
	| 'logistic'
	| 'hinge'
	| 'exponential'
	| 'brier'
	| 'squaredMargin'
	| 'shiftedSquared';

export interface SurrogateLoss {
	id: LossId;
	label: string;
	usage: string;
	phi: (t: number) => number;
	/** derivative where it exists; documented subgradient convention at kinks */
	dphi: (t: number) => number;
	/** left derivative at 0 (extended real; convex phi always has both) */
	dphiLeftAt0: number;
	/** right derivative at 0 */
	dphiRightAt0: number;
}

function sigmoid(t: number): number {
	return t >= 0 ? 1 / (1 + Math.exp(-t)) : Math.exp(t) / (1 + Math.exp(t));
}

export const SURROGATE_LOSSES: SurrogateLoss[] = [
	{
		id: 'zeroOne',
		label: 'Perte 0-1',
		usage: 'Cible optimale (non optimisable : NP-difficile, gradient nul p.p.)',
		phi: (t) => (t < 0 ? 1 : 0),
		dphi: () => 0,
		dphiLeftAt0: -Infinity,
		dphiRightAt0: 0
	},
	{
		id: 'logistic',
		label: 'Logistique',
		usage: 'Régression logistique, deep learning',
		phi: logisticLoss,
		dphi: (t) => sigmoid(t) - 1,
		dphiLeftAt0: -0.5,
		dphiRightAt0: -0.5
	},
	{
		id: 'hinge',
		label: 'Charnière',
		usage: 'SVM',
		phi: (t) => Math.max(0, 1 - t),
		// kink at t = 1 (not at 0); at the kink the subgradient is taken as 0,
		// same convention as hingeLossGrad in loss-functions.ts
		dphi: (t) => (t < 1 ? -1 : 0),
		dphiLeftAt0: -1,
		dphiRightAt0: -1
	},
	{
		id: 'exponential',
		label: 'Exponentielle',
		usage: 'AdaBoost',
		phi: exponentialLoss,
		dphi: (t) => -Math.exp(-t),
		dphiLeftAt0: -1,
		dphiRightAt0: -1
	},
	{
		id: 'brier',
		label: 'Carrée (Brier)',
		usage: 'Least-squares classification',
		phi: (t) => (1 - t) ** 2,
		dphi: (t) => 2 * (t - 1),
		dphiLeftAt0: -2,
		dphiRightAt0: -2
	},
	{
		id: 'squaredMargin',
		label: 'Margin carrée t²',
		usage: 'Contre-exemple non calibré : φ\'(0) = 0',
		phi: (t) => t * t,
		dphi: (t) => 2 * t,
		dphiLeftAt0: 0,
		dphiRightAt0: 0
	},
	{
		id: 'shiftedSquared',
		label: 'Décalée (1+t)²',
		usage: 'Contre-exemple non calibré : φ\'(0) > 0',
		phi: (t) => (1 + t) ** 2,
		dphi: (t) => 2 * (1 + t),
		dphiLeftAt0: 2,
		dphiRightAt0: 2
	}
];

export function getLoss(id: LossId): SurrogateLoss {
	const loss = SURROGATE_LOSSES.find((l) => l.id === id);
	if (!loss) throw new Error(`unknown loss id: ${id}`);
	return loss;
}

// ---------------------------------------------------------------------------
// Conditional phi-risk  C_phi(alpha, eta) = eta phi(alpha) + (1-eta) phi(-alpha)
//
// theorie.typ ("Calibration", loi des espérances totales): R_phi(f) =
// E_X[C_phi(f(X), eta(X))] with eta(x) = P(Y=1|X=x), and the conditional
// phi-Bayes risk C_phi^*(eta) = inf_alpha C_phi(alpha, eta).
// ---------------------------------------------------------------------------

export function conditionalPhiRisk(alpha: number, eta: number, loss: SurrogateLoss): number {
	if (eta < 0 || eta > 1) throw new Error(`eta must be in [0,1], got ${eta}`);
	return eta * loss.phi(alpha) + (1 - eta) * loss.phi(-alpha);
}

/** Values of C_phi(alpha, eta) over a grid of alpha (for plotting). */
export function conditionalPhiRiskCurve(
	eta: number,
	alphaGrid: number[],
	loss: SurrogateLoss
): number[] {
	return alphaGrid.map((alpha) => conditionalPhiRisk(alpha, eta, loss));
}

export interface ConditionalMinimizer {
	alpha: number;
	risk: number;
}

/**
 * Numerical minimizer of alpha -> C_phi(alpha, eta) on [alphaMin, alphaMax]:
 * dense coarse grid, then ternary refinement on the bracket around the grid
 * argmin (exact for convex C_phi, which holds since phi is convex).
 * Deterministic — no randomness involved.
 */
export function conditionalPhiRiskMinimizer(
	eta: number,
	loss: SurrogateLoss,
	opts: { alphaMin?: number; alphaMax?: number; grid?: number } = {}
): ConditionalMinimizer {
	const { alphaMin = -4, alphaMax = 4, grid = 401 } = opts;
	if (alphaMax <= alphaMin) throw new Error(`alphaMax must exceed alphaMin, got [${alphaMin}, ${alphaMax}]`);
	if (grid < 3) throw new Error(`grid must be >= 3, got ${grid}`);
	const step = (alphaMax - alphaMin) / (grid - 1);
	let bestA = alphaMin;
	let bestR = conditionalPhiRisk(alphaMin, eta, loss);
	for (let i = 1; i < grid - 1; i++) {
		const a = alphaMin + i * step;
		const r = conditionalPhiRisk(a, eta, loss);
		if (r < bestR) {
			bestR = r;
			bestA = a;
		}
	}
	let lo = bestA - step;
	let hi = bestA + step;
	for (let i = 0; i < 100; i++) {
		const m1 = lo + (hi - lo) / 3;
		const m2 = hi - (hi - lo) / 3;
		if (conditionalPhiRisk(m1, eta, loss) < conditionalPhiRisk(m2, eta, loss)) hi = m2;
		else lo = m1;
	}
	const alpha = (lo + hi) / 2;
	return { alpha, risk: conditionalPhiRisk(alpha, eta, loss) };
}

/** Conditional phi-Bayes risk C_phi^*(eta) = inf_alpha C_phi(alpha, eta). */
export function bayesConditionalPhiRisk(eta: number, loss: SurrogateLoss): number {
	return conditionalPhiRiskMinimizer(eta, loss).risk;
}

// ---------------------------------------------------------------------------
// Calibration criterion — Théorème 4.1 (Bartlett, Jordan, McAuliffe 2006):
// phi convexe et positive est calibrée  <=>  phi différentiable en 0 et phi'(0) < 0.
//
// One-sided derivatives at 0 are stored per loss (exact values from theorie.typ
// "Vérification sur les exemples"): logistique -1/2, charnière -1 (the kink is
// at t = 1, so phi IS differentiable at 0), exponentielle -1, carrée -2.
// ---------------------------------------------------------------------------

export interface CalibrationCheck {
	left: number;
	right: number;
	differentiableAtZero: boolean;
	phiPrimeAtZero: number | null;
	calibrated: boolean;
}

export function checkCalibration(loss: SurrogateLoss): CalibrationCheck {
	const { dphiLeftAt0: left, dphiRightAt0: right } = loss;
	const differentiableAtZero = Number.isFinite(left) && Number.isFinite(right) && left === right;
	const phiPrimeAtZero = differentiableAtZero ? left : null;
	const calibrated = differentiableAtZero && left < 0;
	return { left, right, differentiableAtZero, phiPrimeAtZero, calibrated };
}

export interface PointwiseCalibration {
	alpha: number;
	expectedSign: -1 | 0 | 1;
	/**
	 * Whether the minimizer's sign matches the Bayes classifier's sign, per the
	 * pointwise-calibration definition. null at eta = 1/2: the definition
	 * only constrains eta != 1/2 (the minimizer set may include 0 or be flat).
	 */
	tracksEta: boolean | null;
}

/**
 * Pointwise calibration at eta (theorie.typ "Définition (Calibration
 * ponctuelle)"): for eta > 1/2 the minimizer must be > 0, for eta < 1/2 it
 * must be < 0; at eta = 1/2 nothing is required (tracksEta = null).
 */
/**
 * Numerical sign tolerance: the minimizer is only resolved to ~1e-8 by the
 * ternary refinement, so a minimizer this close to 0 is treated as unsigned
 * (its raw floating-point sign is noise, not a decision).
 */
const SIGN_TOLERANCE = 1e-6;

export function pointwiseCalibration(eta: number, loss: SurrogateLoss): PointwiseCalibration {
	const { alpha } = conditionalPhiRiskMinimizer(eta, loss);
	const expectedSign: -1 | 0 | 1 = eta > 0.5 ? 1 : eta < 0.5 ? -1 : 0;
	const actualSign: -1 | 0 | 1 = alpha > SIGN_TOLERANCE ? 1 : alpha < -SIGN_TOLERANCE ? -1 : 0;
	const tracksEta: boolean | null =
		expectedSign === 0 ? null : actualSign === expectedSign;
	return { alpha, expectedSign, tracksEta };
}

// ---------------------------------------------------------------------------
// Error decomposition — Théorème 4.2 (theorie.typ "Décomposition de l'erreur"):
//   R(h_fhat) - R* = A + B + C
//   A : terme d'estimation        R(h_fhat) - R(h_f*)
//   B : terme de calibration      R(h_f*)    - R(h_f**)   (nul si f** in F)
//   C : terme d'approximation     R(h_f**)   - R*         (nul si phi calibrée)
//
// A and B are not guaranteed pointwise positive (the theory only controls A in
// expectation); C >= 0 always. No sign is enforced here — the identity is
// algebraic.
// ---------------------------------------------------------------------------

export interface ExcessRiskDecomposition {
	estimation: number;
	calibration: number;
	approximation: number;
	/** total excess risk = estimation + calibration + approximation */
	total: number;
}

export function decomposeExcessRisk(
	rHat: number,
	rStar: number,
	rDoubleStar: number,
	rBayes: number
): ExcessRiskDecomposition {
	const risks: [string, number][] = [
		['rHat', rHat],
		['rStar', rStar],
		['rDoubleStar', rDoubleStar],
		['rBayes', rBayes]
	];
	for (const [name, r] of risks) {
		if (r < 0 || r > 1) throw new Error(`${name} must be in [0,1], got ${r}`);
	}
	return {
		estimation: rHat - rStar,
		calibration: rStar - rDoubleStar,
		approximation: rDoubleStar - rBayes,
		total: rHat - rBayes
	};
}

// ---------------------------------------------------------------------------
// Seeded simulation of the decomposition (illustrative, for the
// RiskDecompositionDemo): a fixed distribution with Bayes risk bayesRisk, a
// global phi-minimizer f** at calibrationGap above Bayes (0 for calibrated
// phi), a best-in-class f* at an in-class gap shrinking with classCapacity,
// and an estimation gap A concentrating at rate 1/sqrt(n) — half-normal with
// scale sqrt(r*(1-r*)/n), the Bernoulli variance used in Part VI.
// ---------------------------------------------------------------------------

/** Illustrative reference magnitude of the in-class gap (term B) at zero capacity. */
export const REFERENCE_CLASS_GAP = 0.05;

export interface ExcessRiskSimulationParams {
	/** sample size n */
	n: number;
	/** class capacity in [0,1]: 1 => f** in F, so term B = 0 */
	classCapacity: number;
	/** term C = R(h_f**) - R*: 0 for a calibrated phi, > 0 otherwise */
	calibrationGap: number;
	/** Bayes risk R* in [0,1] */
	bayesRisk: number;
	seed?: number;
}

export interface ExcessRiskSimulation extends ExcessRiskDecomposition {
	rHat: number;
	rStar: number;
	rDoubleStar: number;
	rBayes: number;
}

export function simulateExcessRiskDecomposition(
	params: ExcessRiskSimulationParams
): ExcessRiskSimulation {
	const { n, classCapacity, calibrationGap, bayesRisk, seed = 1 } = params;
	if (!Number.isInteger(n) || n <= 0) throw new Error(`n must be a positive integer, got ${n}`);
	if (classCapacity < 0 || classCapacity > 1)
		throw new Error(`classCapacity must be in [0,1], got ${classCapacity}`);
	if (bayesRisk < 0 || bayesRisk > 1)
		throw new Error(`bayesRisk must be in [0,1], got ${bayesRisk}`);
	if (calibrationGap < 0) throw new Error(`calibrationGap must be >= 0, got ${calibrationGap}`);
	const rDoubleStar = bayesRisk + calibrationGap;
	const inClassGap = (1 - classCapacity) * REFERENCE_CLASS_GAP;
	const rStar = rDoubleStar + inClassGap;
	if (rStar > 1)
		throw new Error(
			`rStar = rDoubleStar + inClassGap exceeds 1 (bayesRisk=${bayesRisk}, calibrationGap=${calibrationGap}, classCapacity=${classCapacity})`
		);
	const rand = mulberry32(combineSeed(seed, n));
	const z = gaussianSample({ mu: 0, sigma2: 1 }, rand);
	const scale = Math.sqrt((rStar * (1 - rStar)) / n);
	const estimation = Math.max(0, z) * scale;
	// a 0-1 risk cannot exceed 1
	const rHat = Math.min(1, rStar + estimation);
	return { ...decomposeExcessRisk(rHat, rStar, rDoubleStar, bayesRisk), rHat, rStar, rDoubleStar, rBayes: bayesRisk };
}
