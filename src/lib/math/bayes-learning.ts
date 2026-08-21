// src/lib/math/bayes-learning.ts
//
// Part IV — Optimum de Bayes
// Core formulas for Bayesian decision theory: conditional risk, the Bayes
// classifier, Bayes risk, and optimality of the conditional mean (L2) /
// conditional median (L1) for regression.
//
// Reference: theorie.typ — "Prédicteurs optimaux de Bayes",
// "Le cadre de la décision Bayésienne", "Cas de la régression".

import { mulberry32 } from './util';

/** Action space for binary classification. */
export type BinaryAction = 0 | 1;

/**
 * Conditional risk r(a, eta) of taking action `a` given eta = P(Y=1|X=x),
 * under the 0-1 loss.
 *   r(0, eta) = eta       (cost of predicting 0 when Y=1 w.p. eta)
 *   r(1, eta) = 1 - eta   (cost of predicting 1 when Y=0 w.p. 1-eta)
 */
export function conditionalRisk(action: BinaryAction, eta: number): number {
	if (eta < 0 || eta > 1) throw new Error(`eta must be in [0,1], got ${eta}`);
	return action === 0 ? eta : 1 - eta;
}

/**
 * The Bayes-optimal action given eta = P(Y=1|X=x), per Théorème 1.1:
 *   h*(x) = 1 if eta(x) >= 1/2, else 0.
 * (Both actions attain the same conditional risk at eta = 1/2; the theorem's
 * stated convention breaks the tie toward 1.)
 */
export function bayesAction(eta: number): BinaryAction {
	if (eta < 0 || eta > 1) throw new Error(`eta must be in [0,1], got ${eta}`);
	return eta >= 0.5 ? 1 : 0;
}

/** Conditional risk attained by the Bayes-optimal action at a given eta. */
export function bayesConditionalRisk(eta: number): number {
	return Math.min(eta, 1 - eta);
}

/**
 * Bayes risk R* = E_X[min(eta(X), 1 - eta(X))], estimated by Monte Carlo
 * over a sample of eta(x) values (e.g. drawn from the marginal of X, then
 * mapped through eta).
 */
export function bayesRisk(etaSamples: number[]): number {
	if (etaSamples.length === 0) return 0;
	const total = etaSamples.reduce((sum, eta) => sum + bayesConditionalRisk(eta), 0);
	return total / etaSamples.length;
}

// ---------------------------------------------------------------------------
// Régression : optimalité de la moyenne / médiane conditionnelle
// ---------------------------------------------------------------------------

/** A simple discrete conditional distribution of Y given X = x. */
export interface ConditionalDistribution {
	/** Support points y_1, ..., y_k. */
	values: number[];
	/** Probabilities p_1, ..., p_k, summing to 1. */
	probabilities: number[];
}

function assertValidDistribution(dist: ConditionalDistribution): void {
	if (dist.values.length !== dist.probabilities.length) {
		throw new Error('values and probabilities must have the same length');
	}
	const total = dist.probabilities.reduce((a, b) => a + b, 0);
	if (Math.abs(total - 1) > 1e-9) {
		throw new Error(`probabilities must sum to 1, got ${total}`);
	}
}

/**
 * Draw `n` i.i.d. samples of Y from a discrete ConditionalDistribution via
 * inverse-CDF sampling with a seeded PRNG — deterministic for a given seed,
 * so the scatter in ConditionalRegressionExplorer.svelte doesn't reshuffle
 * on every re-render. `seed` defaults to 1.
 */
export function sampleConditionalDistribution(
	dist: ConditionalDistribution,
	n: number,
	seed = 1
): number[] {
	assertValidDistribution(dist);
	const rand = mulberry32(seed);
	const cumulative: number[] = [];
	let acc = 0;
	for (const p of dist.probabilities) {
		acc += p;
		cumulative.push(acc);
	}
	const samples: number[] = [];
	for (let i = 0; i < n; i++) {
		const u = rand();
		let idx = cumulative.findIndex((c) => u <= c);
		if (idx === -1) idx = dist.values.length - 1;
		samples.push(dist.values[idx]);
	}
	return samples;
}

/** E[(Y - c)^2 | X = x] for a discrete conditional distribution. */
export function conditionalSquaredRisk(dist: ConditionalDistribution, c: number): number {
	assertValidDistribution(dist);
	return dist.values.reduce((sum, y, i) => sum + dist.probabilities[i] * (y - c) ** 2, 0);
}

/** E[|Y - c| | X = x] for a discrete conditional distribution. */
export function conditionalAbsoluteRisk(dist: ConditionalDistribution, c: number): number {
	assertValidDistribution(dist);
	return dist.values.reduce((sum, y, i) => sum + dist.probabilities[i] * Math.abs(y - c), 0);
}

/** E[Y | X = x], the L2-optimal constant predictor. */
export function conditionalMean(dist: ConditionalDistribution): number {
	assertValidDistribution(dist);
	return dist.values.reduce((sum, y, i) => sum + dist.probabilities[i] * y, 0);
}

/**
 * A median of Y | X = x, the L1-optimal constant predictor. Medians need not
 * be unique; this returns the smallest value at which the CDF first reaches
 * >= 1/2.
 */
export function conditionalMedian(dist: ConditionalDistribution): number {
	assertValidDistribution(dist);
	const order = dist.values
		.map((y, i) => ({ y, p: dist.probabilities[i] }))
		.sort((a, b) => a.y - b.y);
	let cumulative = 0;
	for (const { y, p } of order) {
		cumulative += p;
		if (cumulative >= 0.5 - 1e-12) return y;
	}
	return order[order.length - 1].y;
}

/**
 * Evaluate E[(Y-c)^2|x] and E[|Y-c||x] over a grid of candidate values c,
 * for demo/plotting use (e.g. ConditionalRegressionExplorer.svelte).
 */
export function conditionalRiskCurve(
	dist: ConditionalDistribution,
	cGrid: number[]
): { c: number; squaredRisk: number; absoluteRisk: number }[] {
	return cGrid.map((c) => ({
		c,
		squaredRisk: conditionalSquaredRisk(dist, c),
		absoluteRisk: conditionalAbsoluteRisk(dist, c)
	}));
}

// ---------------------------------------------------------------------------
// Modèle jouet : séparabilité / bruit via un sigmoïde symétrique
// ---------------------------------------------------------------------------

/**
 * Symmetric sigmoid model of eta(x) = P(Y=1|X=x):
 *   eta(x) = 1 / (1 + exp(-x / temperature))
 * centered at x = 0, so eta(0) = 1/2 for every temperature > 0 — the Bayes
 * boundary never moves in this family, only the sharpness around it does.
 *   temperature -> 0+  : eta approaches a step function -> separable (R* -> 0)
 *   temperature -> +oo : eta flattens toward 1/2 everywhere -> noisy (R* -> 1/2)
 * Used by BayesRiskNoiseDemo.svelte.
 */
export function sigmoidEta(x: number, temperature: number): number {
	if (temperature <= 0) throw new Error(`temperature must be > 0, got ${temperature}`);
	return 1 / (1 + Math.exp(-x / temperature));
}

/** eta(x) evaluated over a grid of x for the symmetric sigmoid model above. */
export function sigmoidEtaCurve(
	xGrid: number[],
	temperature: number
): { x: number; eta: number }[] {
	return xGrid.map((x) => ({ x, eta: sigmoidEta(x, temperature) }));
}

/**
 * Bayes decision boundary for the symmetric sigmoid model: always x = 0,
 * since eta(0) = 1/2 regardless of temperature (Théorème 1.1 threshold).
 */
export function sigmoidBayesBoundary(): number {
	return 0;
}
