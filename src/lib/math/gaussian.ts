/**
 * Gaussian distribution utilities.
 * All functions are pure and never return NaN for valid inputs (sigma2 > 0).
 */

/** Gaussian distribution parameterized by mean (mu) and variance (sigma2). */
export interface Gaussian {
	mu: number; // mean
	sigma2: number; // variance σ², must be > 0
}

const LOG_2PI = Math.log(2 * Math.PI);

/**
 * Draw a standard normal sample using the Box-Muller transform.
 * @param rng - Random number generator (default: Math.random)
 */
function standardNormal(rng: () => number = Math.random): number {
	let u = 0;
	let v = 0;
	while (u === 0) u = rng();
	while (v === 0) v = rng();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Gaussian probability density function.
 * p(x | μ, σ²) = (1 / √(2π σ²)) · exp(-(x-μ)² / (2σ²))
 */
export function gaussianPDF(x: number, g: Gaussian): number {
	const { mu, sigma2 } = g;
	return (1 / Math.sqrt(2 * Math.PI * sigma2)) * Math.exp(-((x - mu) ** 2) / (2 * sigma2));
}

/**
 * Gaussian log probability density function (numerically stable).
 * log p(x | μ, σ²) = -½ log(2π σ²) - (x-μ)² / (2σ²)
 */
export function gaussianLogPDF(x: number, g: Gaussian): number {
	const { mu, sigma2 } = g;
	return -0.5 * (LOG_2PI + Math.log(sigma2)) - (x - mu) ** 2 / (2 * sigma2);
}

/**
 * Sample one value from a Gaussian distribution using Box-Muller.
 * @param rng - Optional RNG for deterministic testing
 */
export function gaussianSample(g: Gaussian, rng: () => number = Math.random): number {
	return g.mu + Math.sqrt(g.sigma2) * standardNormal(rng);
}

/**
 * Generate n independent samples from a Gaussian distribution.
 */
export function gaussianSamples(g: Gaussian, n: number, rng: () => number = Math.random): number[] {
	return Array.from({ length: n }, () => gaussianSample(g, rng));
}

/**
 * Differential entropy of a Gaussian: H(N(μ, σ²)) = ½ ln(2πe σ²)
 */
export function gaussianEntropy(g: Gaussian): number {
	return 0.5 * (1 + LOG_2PI + Math.log(g.sigma2));
}

/**
 * Analytic product of two Gaussian densities (result is proportional to a Gaussian).
 * Precision-weighted combination:
 *   1/σ²_new = 1/σ²_1 + 1/σ²_2
 *   μ_new    = σ²_new · (μ_1/σ²_1 + μ_2/σ²_2)
 */
export function gaussianProduct(g1: Gaussian, g2: Gaussian): Gaussian {
	const prec1 = 1 / g1.sigma2;
	const prec2 = 1 / g2.sigma2;
	const precNew = prec1 + prec2;
	const sigma2New = 1 / precNew;
	const muNew = sigma2New * (g1.mu * prec1 + g2.mu * prec2);
	return { mu: muNew, sigma2: sigma2New };
}

// Acklam's rational approximation for the inverse standard normal CDF
// (P. J. Acklam, "Algorithms 659: Inverse CDF", 2003); absolute value of the
// relative error < 1.15·10⁻⁹ over (0, 1). Coefficients from the published
// algorithm (https://home.online.no/~pjacklam/notes/invnorm).
const AQ_A1 = -39.69683028665376;
const AQ_A2 = 220.9460984245205;
const AQ_A3 = -275.9285104469687;
const AQ_A4 = 138.357751867269;
const AQ_A5 = -30.66479806614716;
const AQ_A6 = 2.506628277459239;
const AQ_B1 = -54.47609879822406;
const AQ_B2 = 161.5858368580409;
const AQ_B3 = -155.6989798598866;
const AQ_B4 = 66.80131188771972;
const AQ_B5 = -13.28068155288572;
const AQ_C1 = -0.007784894002430293;
const AQ_C2 = -0.3223964580411365;
const AQ_C3 = -2.400758277161838;
const AQ_C4 = -2.549732539343734;
const AQ_C5 = 4.374664141464968;
const AQ_C6 = 2.938163982698783;
const AQ_D1 = 0.007784695709041462;
const AQ_D2 = 0.3224671290700398;
const AQ_D3 = 2.445134137142996;
const AQ_D4 = 3.754408661907416;
const AQ_P_LOW = 0.02425;
const AQ_P_HIGH = 1 - AQ_P_LOW;

/**
 * Quantile function of the standard normal distribution (Φ⁻¹).
 * Acklam's rational approximation (relative error < 1.15·10⁻⁹).
 * Used for the normal Q-Q plot of regression residuals
 * (8.validation_du_modele_lineaire_2025.pdf, "Q-Q plot").
 */
export function gaussianQuantile(p: number): number {
	if (!(p > 0 && p < 1)) throw new Error(`gaussianQuantile: p must be in (0, 1) (got ${p})`);
	if (p < AQ_P_LOW) {
		const q = Math.sqrt(-2 * Math.log(p));
		return ((((((AQ_C1 * q + AQ_C2) * q + AQ_C3) * q + AQ_C4) * q + AQ_C5) * q + AQ_C6) / ((((AQ_D1 * q + AQ_D2) * q + AQ_D3) * q + AQ_D4) * q + 1));
	}
	if (p > AQ_P_HIGH) {
		const q = Math.sqrt(-2 * Math.log(1 - p));
		return -(((((AQ_C1 * q + AQ_C2) * q + AQ_C3) * q + AQ_C4) * q + AQ_C5) * q + AQ_C6) / ((((AQ_D1 * q + AQ_D2) * q + AQ_D3) * q + AQ_D4) * q + 1);
	}
	const q = p - 0.5,
		r = q * q;
	return ((((((AQ_A1 * r + AQ_A2) * r + AQ_A3) * r + AQ_A4) * r + AQ_A5) * r + AQ_A6) * q) / (((((AQ_B1 * r + AQ_B2) * r + AQ_B3) * r + AQ_B4) * r + AQ_B5) * r + 1);
}
