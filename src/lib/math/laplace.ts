/**
 * Laplace distribution utilities.
 * All functions are pure and never return NaN for valid inputs (b > 0).
 *
 * UTILITAIRE GÉNÉRAL — pas de correspondance dans course_sources/ (la loi
 * de Laplace n'est pas enseignée dans le cours). Exportée dans l'API
 * publique (index.ts).
 */

/** Laplace distribution parameterized by location (mu) and scale (b). */
export interface Laplace {
	mu: number; // location (median = mean = mode)
	b: number; // scale b > 0; variance = 2b²
}

const LOG_2 = Math.log(2);

/**
 * Laplace probability density function.
 * p(x | μ, b) = (1 / 2b) · exp(-|x − μ| / b)
 */
export function laplacePDF(x: number, d: Laplace): number {
	return (1 / (2 * d.b)) * Math.exp(-Math.abs(x - d.mu) / d.b);
}

/**
 * Laplace log probability density function (numerically stable).
 * log p(x | μ, b) = −log(2b) − |x − μ| / b
 */
export function laplaceLogPDF(x: number, d: Laplace): number {
	return -(LOG_2 + Math.log(d.b)) - Math.abs(x - d.mu) / d.b;
}

/**
 * Laplace CDF: F(x | μ, b).
 *   x < μ : 0.5 · exp((x − μ) / b)
 *   x ≥ μ : 1 − 0.5 · exp(−(x − μ) / b)
 */
export function laplaceCDF(x: number, d: Laplace): number {
	const z = (x - d.mu) / d.b;
	return z < 0 ? 0.5 * Math.exp(z) : 1 - 0.5 * Math.exp(-z);
}

/**
 * Sample one value from a Laplace distribution via the inverse-CDF method.
 *   X = μ − b · sign(U − 0.5) · ln(1 − 2|U − 0.5|)
 * where U ~ Uniform(0, 1).
 */
export function laplaceSample(d: Laplace, rng: () => number = Math.random): number {
	const u = rng() - 0.5; // U(−0.5, 0.5), never exactly 0
	return d.mu - d.b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Generate n independent samples from a Laplace distribution.
 */
export function laplaceSamples(d: Laplace, n: number, rng: () => number = Math.random): number[] {
	return Array.from({ length: n }, () => laplaceSample(d, rng));
}

/**
 * Differential entropy of a Laplace distribution.
 * H(Laplace(μ, b)) = 1 + ln(2b)
 */
export function laplaceEntropy(d: Laplace): number {
	return 1 + LOG_2 + Math.log(d.b);
}

/**
 * Variance of a Laplace distribution: Var = 2b².
 * (For comparison with a Gaussian whose variance is σ².)
 */
export function laplaceVariance(d: Laplace): number {
	return 2 * d.b * d.b;
}

/**
 * Equivalent scale b that matches a given Gaussian variance σ²:
 * b = sqrt(σ² / 2).
 *
 * Useful for overlaying a Laplace and a Gaussian with equal variance,
 * so the student sees the tail difference directly.
 */
export function laplaceScaleFromVariance(sigma2: number): number {
	return Math.sqrt(sigma2 / 2);
}
