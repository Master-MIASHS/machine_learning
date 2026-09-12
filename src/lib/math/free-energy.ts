/**
 * Variational Free Energy (VFE) for discrete and Gaussian models.
 *
 * The VFE is an upper bound on surprise (−log p(o)) and is minimized during
 * perceptual inference (belief updating).
 *
 * Decomposition:
 *   F = KL(q(s) ‖ p(s)) − E_q[log p(o|s)]
 *     = complexity − accuracy
 *
 * References (externes au cours) :
 *   - Friston (2010). "The free-energy principle: a unified brain theory?"
 *   - Parr, Pezzulo & Friston (2022). "Active Inference."
 *
 * AU-DELÀ DU COURS : la free energy variationnelle n'est pas dans
 * course_sources/ — références externes ci-dessus. Utilitaire générale
 * exportée dans l'API publique (index.ts), sans leçon dédiée.
 */

import type { Gaussian } from './gaussian.js';
import { klGaussian } from './kl.js';
import { safeLog } from './discrete.js';

// ─── Discrete VFE ─────────────────────────────────────────────────────────────

/**
 * Variational Free Energy for a discrete generative model.
 *
 * F = KL(q(s) ‖ prior(s)) − E_q[log A[obs][s]]
 *   = Σ_s q(s) log(q(s)/prior(s))  −  Σ_s q(s) log A[obs][s]
 *
 * F ≥ 0 for proper probability distributions.
 * F = 0 only when q = posterior and obs is fully predicted.
 *
 * @param q_state   - Approximate posterior q(s), sums to 1
 * @param prior     - Prior distribution p(s), sums to 1
 * @param A         - Likelihood matrix A[o][s]: P(o|s), each column sums to 1
 * @param obs       - Observed outcome index
 */
export function variationalFE(
	q_state: number[],
	prior: number[],
	A: number[][],
	obs: number
): number {
	// Complexity term: KL(q ‖ prior)
	const complexity = q_state.reduce((sum, qs, s) => {
		if (qs <= 0) return sum;
		return sum + qs * Math.log(qs / Math.max(prior[s], 1e-300));
	}, 0);

	// Accuracy term: E_q[log p(o|s)] = Σ_s q(s) · log A[obs][s]
	const accuracy = q_state.reduce((sum, qs, s) => {
		return sum + qs * safeLog(A[obs][s]);
	}, 0);

	return complexity - accuracy;
}

/**
 * Variational Free Energy for a Gaussian generative model.
 *
 * F = KL(q(s) ‖ p(s)) − E_q[log p(o|s)]
 *
 * With Gaussian q(s) = N(μ_q, σ²_q), prior p(s) = N(μ_p, σ²_p),
 * and Gaussian likelihood p(o|s) = N(o | μ_s, σ²_l):
 *
 * E_q[log p(o|s)] = gaussianLogPDF(o, { mu: μ_q, sigma2: σ²_q + σ²_l })
 *   (marginalised over q)  — approximated here as log p(o | μ_q, σ²_l)
 *   for simplicity (first-order Taylor approximation around the mean).
 *
 * @param q         - Approximate posterior q(s) = N(μ_q, σ²_q)
 * @param prior     - Prior p(s) = N(μ_p, σ²_p)
 * @param likelihoodSigma2 - Observation noise variance σ²_l
 * @param obs       - Observed value o
 */
export function variationalFEGaussian(
	q: Gaussian,
	prior: Gaussian,
	likelihoodSigma2: number,
	obs: number
): number {
	// Complexity: KL(q ‖ prior)
	const complexity = klGaussian(q, prior);

	// Accuracy: E_q[log p(o|s)] ≈ log N(o | μ_q, σ²_q + σ²_l)
	// (exact for Gaussian likelihood, marginalised over q)
	const marginalSigma2 = q.sigma2 + likelihoodSigma2;
	const logNorm = -0.5 * Math.log(2 * Math.PI * marginalSigma2);
	const accuracy = logNorm - (obs - q.mu) ** 2 / (2 * marginalSigma2);

	return complexity - accuracy;
}

// ─── Surprise bound ───────────────────────────────────────────────────────────

/**
 * Compute surprise −log p(o) directly for a discrete model by marginalizing.
 * p(o) = Σ_s p(o|s) · prior(s) = Σ_s A[obs][s] · prior(s)
 * surprise = −log p(o)
 *
 * Note: VFE ≥ surprise (VFE is an upper bound on surprise).
 */
export function discreteSurprise(prior: number[], A: number[][], obs: number): number {
	const pObs = prior.reduce((sum, ps, s) => sum + A[obs][s] * ps, 0);
	return -safeLog(pObs);
}

// ─── Ambiguity ────────────────────────────────────────────────────────────────

/**
 * Expected ambiguity: E_q[H(p(o|s))]
 * Measures how ambiguous the observation model is on average under current beliefs.
 * A[s_col] = A[:, s] = the observation distribution for state s.
 */
export function expectedAmbiguity(q_state: number[], A: number[][]): number {
	return q_state.reduce((sum, qs, s) => {
		if (qs <= 0) return sum;
		// H(p(o|s)): entropy of the s-th column of A
		const H_s = -A.reduce((h, row) => {
			const aos = row[s];
			if (aos <= 0) return h;
			return h + aos * Math.log(aos);
		}, 0);
		return sum + qs * H_s;
	}, 0);
}
