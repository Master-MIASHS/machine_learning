/**
 * Diversity measures for ensemble methods.
 *
 * Relié à course_sources/typst/regularization.typ, ch. 4 « Méthodes
 * ensemblistes », Théorème 4.1 (Réduction de variance par agrégation) et sa
 * « Remarque cruciale » : la réduction de variance n'est effective que si
 * les modèles font des erreurs complémentaires (erreurs centrées, idéalement
 * indépendantes).
 * Les mesures elles-mêmes (corrélations, taux de désaccord, q-statistique de
 * Weiss, mesure composite de diversité) ne sont PAS énoncées dans les
 * sources — illustratif, au-delà du cours.
 */

// Diversity measures computed directly without ensemble imports

/** Pairwise correlation of model predictions (regression) */
export function pairwiseCorrelation(predictions: number[][]): number[] {
	const m = predictions.length; // number of models
	const n = predictions[0].length; // number of examples

	// Mean of each model's predictions
	const means = Array.from({ length: m }, (_, j) => predictions[j].reduce((a, b) => a + b, 0) / n);

	const correlations: number[] = [];
	for (let i = 0; i < m; i++) {
		for (let j = i + 1; j < m; j++) {
			let cov = 0,
				varI = 0,
				varJ = 0;
			for (let k = 0; k < n; k++) {
				const di = predictions[i][k] - means[i];
				const dj = predictions[j][k] - means[j];
				cov += di * dj;
				varI += di * di;
				varJ += dj * dj;
			}

			const corr = cov / (Math.sqrt(varI) * Math.sqrt(varJ));
			correlations.push(isFinite(corr) ? corr : 0);
		}
	}

	return correlations;
}

/** Mean pairwise correlation */
export function meanPairwiseCorrelation(predictions: number[][]): number {
	const corrs = pairwiseCorrelation(predictions);
	if (corrs.length === 0) return 0;
	return corrs.reduce((a, b) => a + Math.abs(b), 0) / corrs.length;
}

/** Disagreement rate for classification: fraction of examples where models disagree */
export function disagreementRate(predictions: number[][]): number {
	const n = predictions[0].length;
	let agreeCount = 0;

	for (let i = 0; i < n; i++) {
		const votes: Record<string, number> = {};
		let maxVotes = 0;
		for (const predSet of predictions) {
			const key = String(predSet[i]);
			votes[key] = (votes[key] ?? 0) + 1;
			if (votes[key] > maxVotes) maxVotes = votes[key];
		}

		// All agree if majority == total models
		if (maxVotes === predictions.length) agreeCount++;
	}

	return n > 0 ? 1 - agreeCount / n : 0;
}

/** Q-statistic diversity measure between two binary-classifiers */
export function qStatistic(
	predsA: number[], // array of predicted labels for model A
	predsB: number[], // array of predicted labels for model B
	trueLabels: number[] // true labels
): number {
	const n = predsA.length;

	let ba_bc_ca = 0,
		bb2 = 0;
	for (let i = 0; i < n; i++) {
		const aCorrect = predsA[i] === trueLabels[i];
		const bCorrect = predsB[i] === trueLabels[i];
		if (aCorrect && !bCorrect) ba_bc_ca++;
		if (!aCorrect && bCorrect) ba_bc_ca--;
		if (!aCorrect && !bCorrect) bb2++;
	}

	const denom = Math.abs(ba_bc_ca); // simplified Q-statistic approximation
	return denom > 0 ? bb2 / (n - 1e-10) : 0;
}

/** Overall diversity score combining multiple measures */
export function diversityMeasure(
	predictions: number[][],
	trueLabels?: number[]
): { meanCorrelation: number; disagreementRate_: number } {
	return {
		meanCorrelation: meanPairwiseCorrelation(predictions),
		disagreementRate_: trueLabels ? disagreementRate(predictions) : 0
	};
}
