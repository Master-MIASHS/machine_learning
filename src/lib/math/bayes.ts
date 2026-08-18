/**
 * Bayesian inference utilities for Gaussian (conjugate) and numerical posteriors.
 */

import type { Gaussian } from './gaussian.js';
import { normalize } from './discrete.js';

// ─── Conjugate Gaussian updates ───────────────────────────────────────────────

/**
 * Conjugate Bayesian update for a Gaussian prior and Gaussian likelihood.
 *
 * Model:
 *   Prior:      θ ~ N(μ_0, σ²_0)          (belief about the true mean)
 *   Likelihood: x ~ N(θ,  σ²_l)           (observation noise)
 *   Posterior:  θ|x ~ N(μ_post, σ²_post)
 *
 * Posterior precision = 1/σ²_post = 1/σ²_0 + 1/σ²_l
 * Posterior mean      = σ²_post · (μ_0/σ²_0 + x/σ²_l)
 *
 * @param prior       - Prior belief N(μ_0, σ²_0)
 * @param likelihood  - Observation model: only sigma2 is used (observation noise variance)
 * @param observation - Observed value x
 */
export function bayesUpdate(prior: Gaussian, likelihood: Gaussian, observation: number): Gaussian {
	const prec0 = 1 / prior.sigma2;
	const precL = 1 / likelihood.sigma2;
	const precPost = prec0 + precL;
	const sigma2Post = 1 / precPost;
	const muPost = sigma2Post * (prior.mu * prec0 + observation * precL);
	return { mu: muPost, sigma2: sigma2Post };
}

/**
 * Conjugate Bayesian update after multiple independent observations.
 * Applies `bayesUpdate` sequentially; equivalent to computing the full posterior.
 *
 * Order invariance: for the conjugate case, the result is identical regardless
 * of the order the observations are applied.
 */
export function bayesUpdateMultiple(
	prior: Gaussian,
	likelihood: Gaussian,
	observations: number[]
): Gaussian {
	return observations.reduce((post, x) => bayesUpdate(post, likelihood, x), prior);
}

// ─── Numerical posterior on a 1-D grid ───────────────────────────────────────

/**
 * Compute a numerical (grid-based) posterior over a 1-D parameter space.
 *
 * Returns normalized posterior weights on `grid`:
 *   post[i] ∝ priorFn(grid[i]) · likelihoodFn(grid[i])
 *
 * @param priorFn      - Unnormalized prior density evaluated at each grid point
 * @param likelihoodFn - Unnormalized likelihood evaluated at each grid point
 * @param grid         - Evaluation points (e.g. linspace(-5, 5, 200))
 * @returns Normalized posterior probability mass on each grid point
 */
export function numericalPosterior(
	priorFn: (s: number) => number,
	likelihoodFn: (s: number) => number,
	grid: number[]
): number[] {
	const unnorm = grid.map((s) => Math.max(0, priorFn(s) * likelihoodFn(s)));
	return normalize(unnorm);
}
