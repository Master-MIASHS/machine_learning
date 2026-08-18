// src/lib/math/bayes-learning.ts
//
// Part IV — Optimum de Bayes
// Core formulas for Bayesian decision theory: conditional risk, the Bayes
// classifier, Bayes risk, and optimality of the conditional mean (L2) /
// conditional median (L1) for regression.
//
// Reference: theorie.typ — "Prédicteurs optimaux de Bayes",
// "Le cadre de la décision Bayésienne", "Cas de la régression".

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
