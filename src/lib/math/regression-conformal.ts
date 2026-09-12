/**
 * Regression conformal prediction — constant and adaptive prediction intervals.
 *
 * Reference: course_sources/typst/set_valued.typ, ch. « Application à la
 * régression » :
 *  - « Principe général » : construire C(x) = [a(x), b(x)] avec
 *    P(Y ∈ [a(X), b(X)]) ≥ 1−α, le plus petit possible ;
 *  - « Intervalles de largeur constante » : score s(x,y) = |y − f̂(x)|,
 *    C(x) = [f̂(x)−q, f̂(x)+q], q = quantile des résidus absolus →
 *    constantInterval ;
 *  - quantile d'ordre ⌈(n+1)(1−α)⌉/n (Algorithme 6.2, code sklearn de la
 *    source) → residualQuantile ;
 *  - « Intervalles adaptatifs » : score s(x,y) = |y − f̂(x)| / (σ(x)+ε),
 *    σ(x) = incertitude locale, ε > 0 → adaptiveInterval ;
 *  - « Estimation de l'incertitude locale » (bootstrap, bagging, quantile
 *    regression, réseaux bayésiens) ;
 *  - « Évaluation des intervalles de prédiction » : taux de couverture
 *    empirique, largeur moyenne, efficacité conditionnelle →
 *    conditionalCoverageRate.
 * Garantie : Théorème 6.1 (sous échangeabilité).
 */

export interface PredictionIntervals {
	lowerBounds: number[];
	upperBounds: number[];
}

// ─── Conformal quantile helper ────────────────────────

/**
 * Return the ⌈(n+1)(1−α)⌉-th smallest residual magnitude.
 * If k > n, returns +∞ (very wide interval).
 */
export function residualQuantile(residuals: number[], alpha: number): number {
	const sorted = [...residuals].toSorted((a, b) => a - b);
	const n = residuals.length;
	if (n === 0) return Infinity;

	const k = Math.ceil((n + 1) * (1 - alpha));
	if (k > n) return Infinity;
	return sorted[k - 1];
}

// ─── Constant-width intervals ─────────────────────────

/**
 * Constant-width conformal prediction intervals.
 * Half-width = conformal quantile of absolute calibration residuals.
 */
export function constantInterval(
	calPredictions: number[],
	calTrue: number[],
	testPredictions: number[],
	alpha: number
): PredictionIntervals {
	const n = calTrue.length;

	// Absolute residuals on the calibration set
	const absResiduals: number[] = new Array(n);
	for (let i = 0; i < n; i++) {
		absResiduals[i] = Math.abs(calTrue[i] - calPredictions[i]);
	}

	const halfWidth = residualQuantile(absResiduals, alpha);

	const m = testPredictions.length;
	return {
		lowerBounds: Array.from({ length: m }, (_, i) => testPredictions[i] - halfWidth),
		upperBounds: Array.from({ length: m }, (_, i) => testPredictions[i] + halfWidth)
	};
}

// ─── Adaptive (normalized-score) intervals ────────────

/**
 * Adaptive conformal prediction intervals with sigma-normalized scores.
 * Score = |residual| / (σ + ε). The quantile of these normalized scores is then used as
 * the interval half-width, providing better calibration under heteroscedasticity.
 */
export function adaptiveInterval(
	calPredictions: number[],
	calTrue: number[],
	calSigmaEstimates: number[],
	testPredictions: number[],
	testSigmaEstimates: number[],
	alpha: number,
	epsilon = 1e-10
): PredictionIntervals {
	const n = calTrue.length;

	// Normalized conformity scores
	const normalizedScores = new Array<number>(n);
	for (let i = 0; i < n; i++) {
		normalizedScores[i] =
			Math.abs(calTrue[i] - calPredictions[i]) / (calSigmaEstimates[i] + epsilon);
	}

	const qHat = residualQuantile(normalizedScores, alpha);

	const m = testPredictions.length;

	const lowerBounds = new Array<number>(m);
	const upperBounds = new Array<number>(m);

	for (let i = 0; i < m; i++) {
		const halfWidth = qHat * (testSigmaEstimates[i] + epsilon);

		lowerBounds[i] = testPredictions[i] - halfWidth;
		upperBounds[i] = testPredictions[i] + halfWidth;
	}

	return {
		lowerBounds,
		upperBounds
	};
}

// ─── Coverage evaluation ──────────────────────────────

/**
 * Compute the fraction of true values covered by their prediction intervals.
 * Intervals are [lower, upper] pairs matching y_true 1:1.
 */
export function conditionalCoverageRate(intervals: [number, number][], y_true: number[]): number {
	const m = y_true.length;
	if (m === 0) return 0;

	let covered = 0;
	for (let i = 0; i < m; i++) {
		if (y_true[i] >= intervals[i][0] && y_true[i] <= intervals[i][1]) covered++;
	}
	return covered / m;
}
