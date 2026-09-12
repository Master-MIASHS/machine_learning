/**
 * Entropy functions for discrete and Gaussian distributions.
 *
 * Contexte du cours : course_sources/marine/Cours/CM/coursClassif-3ArbresDecision.tex,
 * frame « Critères d'impureté » — l'entropie est l'un des trois critères
 * d'impureté des arbres de décision (avec Gini et erreur de classification) ;
 * entropyDiscrete sert d'impureté via random-forest.ts (entropyImpurity) et
 * le gain d'information (frame du choix de la division).
 * entropyGaussian / conditionalEntropy / entropyBinary : utilitaires
 * généraux, pas dans les sources.
 */

import type { Gaussian } from './gaussian.js';

const LOG_2PI = Math.log(2 * Math.PI);

// ─── Discrete entropy ────────────────────────────────────────────────────────

/**
 * Shannon entropy of a discrete distribution: H(p) = -Σ p_i · log(p_i)
 * Uses safeLog to handle zero probabilities (0·log(0) → 0 by convention).
 * @returns Entropy in nats
 */
export function entropyDiscrete(probs: number[]): number {
	return -probs.reduce((acc, p) => {
		if (p <= 0) return acc; // 0·log(0) = 0 by convention
		return acc + p * Math.log(p);
	}, 0);
}

/**
 * Conditional entropy H(X|Y) from a joint distribution matrix.
 * joint[i][j] = P(X=i, Y=j)
 * H(X|Y) = H(X,Y) - H(Y) = -Σ_ij P(X=i,Y=j) log P(X=i|Y=j)
 */
export function conditionalEntropy(joint: number[][]): number {
	// Marginal over Y: P(Y=j) = Σ_i joint[i][j]
	const n_x = joint.length;
	const n_y = joint[0].length;
	const marginalY = Array.from({ length: n_y }, (_, j) =>
		joint.reduce((sum, row) => sum + row[j], 0)
	);

	let h = 0;
	for (let i = 0; i < n_x; i++) {
		for (let j = 0; j < n_y; j++) {
			const pxy = joint[i][j];
			const py = marginalY[j];
			if (pxy <= 0 || py <= 0) continue;
			h -= pxy * Math.log(pxy / py); // pxy · log P(X|Y) = pxy · log(pxy/py)
		}
	}
	return h;
}

// ─── Gaussian entropy ─────────────────────────────────────────────────────────

/**
 * Differential entropy of a Gaussian: H(N(μ, σ²)) = ½ ln(2πe σ²)
 * @returns Entropy in nats
 */
export function entropyGaussian(g: Gaussian): number {
	return 0.5 * (1 + LOG_2PI + Math.log(g.sigma2));
}

// ─── Binary entropy ─────────────────────────────────────────────────────────

/**
 * Entropy of a binary variable
 * @returns Entropy in nats
 */
export function entropyBinary(p: number): number {
	if (p <= 0 || p >= 1) return 0;
	return -(p * Math.log(p) + (1 - p) * Math.log(1 - p));
}
