/**
 * Discrete (categorical) distribution utilities.
 * All functions are pure and operate on plain number[] probability vectors.
 */

/** Smallest positive value used to guard against log(0). */
const EPSILON = 1e-300;

/**
 * Safe natural logarithm: returns log(max(x, ε)) to avoid −∞ from log(0).
 */
export function safeLog(x: number): number {
	return Math.log(Math.max(x, EPSILON));
}

/**
 * Normalize a non-negative array to sum to 1.
 * Throws if the sum is zero (all-zero input).
 */
export function normalize(probs: number[]): number[] {
	const sum = probs.reduce((acc, p) => acc + p, 0);
	if (sum <= 0) throw new Error('normalize: sum is zero — cannot normalize an all-zero vector');
	return probs.map((p) => p / sum);
}

/**
 * Sample one index from a categorical distribution.
 * @param probs - Probability vector (must sum to ≈1)
 * @param rng   - Optional RNG for deterministic testing
 */
export function categoricalSample(probs: number[], rng: () => number = Math.random): number {
	const u = rng();
	let cumulative = 0;
	for (let i = 0; i < probs.length; i++) {
		cumulative += probs[i];
		if (u < cumulative) return i;
	}
	return probs.length - 1; // guard against floating-point rounding
}

/**
 * Sample n independent indices from a categorical distribution.
 */
export function categoricalSamples(
	probs: number[],
	n: number,
	rng: () => number = Math.random
): number[] {
	return Array.from({ length: n }, () => categoricalSample(probs, rng));
}

/**
 * Uniform distribution over n states: [1/n, 1/n, …, 1/n].
 */
export function uniformDiscrete(n: number): number[] {
	return Array.from({ length: n }, () => 1 / n);
}

/**
 * One-hot encoding: probability 1 at index i, 0 elsewhere.
 */
export function oneHot(i: number, n: number): number[] {
	const probs = Array.from({ length: n }, () => 0);
	probs[i] = 1;
	return probs;
}

/**
 * Softmax: converts log-odds (logits) to a probability distribution.
 * Numerically stable via max-subtraction.
 */
export function softmax(logits: number[]): number[] {
	const maxLogit = Math.max(...logits);
	const exps = logits.map((l) => Math.exp(l - maxLogit));
	const sum = exps.reduce((acc, e) => acc + e, 0);
	return exps.map((e) => e / sum);
}

/**
 * Log-softmax (numerically stable): log(softmax(logits)).
 */
export function logSoftmax(logits: number[]): number[] {
	const maxLogit = Math.max(...logits);
	const exps = logits.map((l) => Math.exp(l - maxLogit));
	const logSum = Math.log(exps.reduce((acc, e) => acc + e, 0));
	return logits.map((l) => l - maxLogit - logSum);
}

/**
 * Outer product: u (m) ⊗ v (n) → matrix (m×n).
 */
export function outerProduct(u: number[], v: number[]): number[][] {
	return u.map((ui) => v.map((vj) => ui * vj));
}
