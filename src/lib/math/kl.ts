/**
 * KL divergence functions for Gaussian and discrete distributions.
 *
 * Convention: KL(p ‖ q) — the "forward" KL, p is the reference distribution.
 *
 * UTILITAIRE GÉNÉRAL — la divergence de KL n'est pas énoncée dans
 * course_sources/. Brique des modules bayésiens (free-energy.ts :
 * F = KL(q‖p) − E_q[log p(o|s)]) et exportée dans l'API publique
 * (index.ts).
 */

import type { Gaussian } from './gaussian.js';

const EPSILON = 1e-300;

// ─── Gaussian KL ──────────────────────────────────────────────────────────────

/**
 * Analytic KL divergence between two Gaussians: KL(p ‖ q)
 *
 * Formula (derived from moment-matching integrals):
 *   KL(N(μ_p,σ²_p) ‖ N(μ_q,σ²_q))
 *     = ½ [ log(σ²_q/σ²_p) − 1 + σ²_p/σ²_q + (μ_p−μ_q)²/σ²_q ]
 *
 * Properties:
 *   - KL(p, p) = 0
 *   - KL(p, q) ≥ 0
 *   - Asymmetric: KL(p,q) ≠ KL(q,p) in general
 */
export function klGaussian(p: Gaussian, q: Gaussian): number {
	const { mu: mu_p, sigma2: s2_p } = p;
	const { mu: mu_q, sigma2: s2_q } = q;
	return 0.5 * (Math.log(s2_q / s2_p) - 1 + s2_p / s2_q + (mu_p - mu_q) ** 2 / s2_q);
}

// ─── Discrete KL ─────────────────────────────────────────────────────────────

/**
 * KL divergence between two discrete distributions: KL(p ‖ q)
 *
 * KL(p ‖ q) = Σ_i p_i · log(p_i / q_i)
 *
 * Numerically stable: replaces q_i with max(q_i, ε) to avoid log(0).
 * By convention, 0·log(0/q) = 0 and 0·log(0/0) = 0.
 *
 * @throws if p and q have different lengths
 */
export function klDiscrete(p: number[], q: number[]): number {
	if (p.length !== q.length) {
		throw new Error(`klDiscrete: length mismatch (${p.length} vs ${q.length})`);
	}
	return p.reduce((sum, pi, i) => {
		if (pi <= 0) return sum; // 0·log(·) = 0
		const qi = Math.max(q[i], EPSILON);
		return sum + pi * Math.log(pi / qi);
	}, 0);
}

/**
 * Symmetric KL divergence (Jeffrey's divergence): ½ [KL(p‖q) + KL(q‖p)]
 * Always non-negative; equals 0 iff p = q.
 */
export function klSymmetric(p: number[], q: number[]): number {
	return 0.5 * (klDiscrete(p, q) + klDiscrete(q, p));
}

/**
 * Jensen-Shannon divergence: JSD(p ‖ q) = ½ KL(p‖m) + ½ KL(q‖m)
 * where m = ½(p + q).
 * Bounded in [0, log 2]; symmetric and always finite.
 */
export function jensenShannon(p: number[], q: number[]): number {
	const m = p.map((pi, i) => 0.5 * (pi + q[i]));
	return 0.5 * (klDiscrete(p, m) + klDiscrete(q, m));
}
