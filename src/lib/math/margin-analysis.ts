/**
 * Margin analysis for boosting classifiers.
 *
 * Reference: course_sources/typst/regularization.typ, ch. 4 « Méthodes
 * ensemblistes », section « Boosting » :
 *  - Définition 4.7 (Margin : margin_i = y_i F(x_i), interprétation
 *    signe/confiance) → computeMargins ;
 *  - « Interprétation en termes de margin » : la perte exponentielle
 *    pénalise exponentiellement les margines très négatives ;
 *  - « Propriété clé (Margin maximization) » : AdaBoost tend à maximiser le
 *    margin minimum → minMargin / trackMarginEvolution ;
 *  - Théorème 4.3 (γ_t = ½ − ε_t : l'avantage conditionnel qui sous-tend la
 *    borne d'erreur d'entraînement).
 * Les statistiques descriptives (moyenne, médiane, histogramme de margines)
 * sont des utilitaires, pas des formules de la source.
 */

import type { DecisionStump } from './random-forest.js';

// ─── Margin Computation ──────────────────────────────

export interface MarginStats {
	margins: number[];
	minMargin: number;
	maxMargin: number;
	meanMargin: number;
	medianMargin: number;
	negativeCount: number;
}

/** Compute margins for all examples: margin_i = y_i · F(x_i) */
export function computeMargins(F_pred: number[], y: number[]): number[] {
	return F_pred.map((fp, i) => fp * y[i]);
}

/** Minimum margin across all examples */
export function minMargin(margins: number[]): number {
	if (margins.length === 0) return Infinity;
	let m = margins[0];
	for (let i = 1; i < margins.length; i++) if (margins[i] < m) m = margins[i];
	return m;
}

/** Mean margin */
export function meanMargin(margins: number[]): number {
	if (margins.length === 0) return 0;
	return margins.reduce((a, b) => a + b, 0) / margins.length;
}

/** Full margin statistics distribution */
export function marginDistribution(margins: number[]): MarginStats {
	const sorted = [...margins].sort((a, b) => a - b);
	const n = sorted.length;

	return {
		margins: sorted,
		minMargin: sorted[0] ?? Infinity,
		maxMargin: sorted[n - 1] ?? -Infinity,
		meanMargin: margins.reduce((a, b) => a + b, 0) / (n || 1),
		medianMargin: n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)],
		negativeCount: margins.filter((m) => m < 0).length
	};
}

/** Margin histogram for visualization */
export function marginHistogram(
	margins: number[],
	bucketCount = 30
): { bins: [number, number][]; counts: number[] } {
	if (margins.length === 0) return { bins: [], counts: [] };

	const mn = Math.min(...margins);
	const mx = Math.max(...margins);
	const span = Math.max(mx - mn, 1e-10);

	const binWidth = span / bucketCount;
	const counts = new Array(bucketCount).fill(0);

	for (const m of margins) {
		let idx = Math.floor((m - mn) / binWidth);
		if (idx >= bucketCount) idx = bucketCount - 1;
		counts[idx]++;
	}

	const bins: [number, number][] = Array.from({ length: bucketCount }, (_, i) => [
		mn + i * binWidth,
		mn + (i + 1) * binWidth
	]);

	return { bins, counts };
}

/** Track margin evolution across AdaBoost iterations */
export function trackMarginEvolution(
	X: number[][],
	y: number[], // labels ∈ {-1, +1}
	T = 50
): Array<{ t: number; margins: number[]; minM: number; meanM: number }> {
	const n = X.length;
	const cumulativeF = new Array(n).fill(0);

	const evolution: Array<{ t: number; margins: number[]; minM: number; meanM: number }> = [
		{ t: 0, margins: new Array(n).fill(0), minM: 0, meanM: 0 }
	];

	let weights = new Array(n).fill(1 / n);

	for (let t = 1; t <= T; t++) {
		const result = adaboostStep(weights, X, y);

		if (result.weightedError >= 0.5) break;

		// Update cumulative predictions
		for (let i = 0; i < n; i++) {
			const pred =
				X[i][result.stump.featureIdx] <= result.stump.threshold
					? result.stump.leftValue
					: result.stump.rightValue;
			cumulativeF[i] += result.alpha * pred;
		}

		const margins = computeMargins(cumulativeF, y);
		evolution.push({
			t,
			margins: [...margins],
			minM: minMargin(margins),
			meanM: meanMargin(margins)
		});

		// Update weights
		const preds = X.map((x) => {
			return x[result.stump.featureIdx] <= result.stump.threshold
				? result.stump.leftValue
				: result.stump.rightValue;
		});
		const updated = updateWeightsFn(weights, result.alpha, preds, y);
		weights = updated.newWeights;
	}

	return evolution;
}

// Re-export for convenience
function adaboostStep(
	weights: number[],
	X: number[][],
	y: number[]
): { stump: DecisionStump; weightedError: number; alpha: number } {
	const n = X.length,
		d = X[0].length;
	let bestCost = Infinity;
	let bestStump: DecisionStump | null = null;

	for (const f of Array.from({ length: d }, (_, i) => i)) {
		const vals = [...new Set(X.map((row) => row[f]))].sort((a, b) => a - b);
		for (let t = 0; t < vals.length - 1; t++) {
			const threshold = (vals[t] + vals[t + 1]) / 2;
			for (const dir of [-1, 1]) {
				let error = 0;
				for (let i = 0; i < n; i++) {
					if ((X[i][f] <= threshold ? dir : -dir) !== y[i]) error += weights[i];
				}
				if (error < bestCost) {
					bestCost = error;
					bestStump = { featureIdx: f, threshold, leftValue: dir, rightValue: -dir };
				}
				const altError = 1 - error;
				if (altError < bestCost) {
					bestCost = altError;
					bestStump = { featureIdx: f, threshold, leftValue: -dir, rightValue: dir };
				}
			}
		}
	}

	const weightedError = Math.max(1e-10, Math.min(1 - 1e-10, bestCost ?? 0.5));
	const alpha = 0.5 * Math.log((1 - weightedError) / weightedError);
	return { stump: bestStump!, weightedError, alpha };
}

function updateWeightsFn(
	weights: number[],
	alpha: number,
	predictions: number[],
	trueLabels: number[]
): { newWeights: number[]; Z: number } {
	const n = weights.length;
	let Z = 0;
	for (let i = 0; i < n; i++) {
		weights[i] *= Math.exp(-alpha * trueLabels[i] * predictions[i]);
		Z += weights[i];
	}
	return { newWeights: weights.map((w) => w / Z), Z };
}
