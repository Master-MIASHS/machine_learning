/**
 * Ensemble methods: voting, bagging, BMA.
 *
 * Reference: course_sources/typst/regularization.typ, ch. 4 « Méthodes
 * ensemblistes » :
 *  - Définition 4.2 (Vote majoritaire) → majorityVote ;
 *  - Définition 4.3 (Moyenne pour la régression) → averagePredictions ;
 *  - Définition 4.4 (Bayesian Model Averaging) + « Calcul des poids a
 *    posteriori » (règle de Bayes, poids = p(M_j|D) ∝ p(D|M_j) p(M_j),
 *    logsumexp pour la stabilité numérique) → bmaWeights / bmaPredict ;
 *  - Définition 4.6 (Out-of-Bag Error : prédiction sur les ~36.8 % de
 *    points absents de l'échantillon bootstrap) → oobError.
 */

// ─── Voting / Aggregation ─────────────────────────────

/** Majority vote for classification */
export function majorityVote(predictions: number[][]): number[] {
	if (predictions.length === 0) return [];

	const n = predictions[0].length; // number of examples
	return Array.from({ length: n }, (_, i) => {
		const votes: Record<number, number> = {};
		for (const predSet of predictions) {
			votes[predSet[i]] = (votes[predSet[i]] ?? 0) + 1;
		}
		// Object.keys returns string[], so we convert back to number for comparison
		return Number(Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0]);
	});
}

/** Average predictions for regression */
export function averagePredictions(predictions: number[][]): number[] {
	if (predictions.length === 0) return [];
	const n = predictions[0].length;
	return Array.from({ length: n }, (_, i) => {
		let sum = 0;
		for (const predSet of predictions) sum += predSet[i];
		return sum / predictions.length;
	});
}

// ─── Out-of-Bag Error ────────────────────────────────

export function oobError(
	modelPredictions: number[][], // [model][example] — NaN if example was not in bootstrap for that model
	trueLabels: number[],
	isClassification = true
): number {
	const n = trueLabels.length;
	let totalSamples = 0,
		correct = 0;

	for (let i = 0; i < n; i++) {
		const predsForExample = [];
		for (const predSet of modelPredictions) {
			if (!isNaN(predSet[i])) predsForExample.push(predSet[i]);
		}

		if (predsForExample.length === 0) continue;
		totalSamples++;

		if (isClassification) {
			const vote = majorityVote([predsForExample])[0];
			if (vote === trueLabels[i]) correct++;
		} else {
			const avg = predsForExample.reduce((a, b) => a + b, 0) / predsForExample.length;
			if (Math.abs(avg - trueLabels[i]) < 1e-6) correct++; // approximate for regression
		}
	}

	return totalSamples > 0 ? 1 - correct / totalSamples : NaN;
}

// ─── Bayesian Model Averaging ────────────────────────

/** Compute BMA weights from log-likelihoods and priors */
export function bmaWeights(logLikelihoods: number[], priors?: number[]): number[] {
	const m = logLikelihoods.length;
	const logPriors = priors ? priors.map(Math.log) : new Array(m).fill(0); // uniform prior by default

	// log p(Mj | D) ∝ log p(D|Mj) + log p(Mj)
	const unnormalized = logLikelihoods.map((ll, j) => ll + logPriors[j]);

	// Log-sum-exp for numerical stability
	let maxVal = -Infinity;
	for (const v of unnormalized) if (v > maxVal) maxVal = v;
	const logSum = Math.log(unnormalized.reduce((acc, v) => acc + Math.exp(v - maxVal), 0)) + maxVal;

	return unnormalized.map((u) => Math.exp(u - logSum));
}

/** BMA prediction: weighted average of model predictions */
export function bmaPredict(
	modelPredictions: number[][], // [model][example]
	logLikelihoods: number[],
	priors?: number[]
): number[] {
	const weights = bmaWeights(logLikelihoods, priors);
	if (modelPredictions[0].length === 0) return [];

	return Array.from({ length: modelPredictions[0].length }, (_, i) => {
		let sum = 0;
		for (let j = 0; j < weights.length; j++) {
			sum += weights[j] * modelPredictions[j][i];
		}
		return sum;
	});
}
