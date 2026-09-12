/**
 * Prediction sets — Top-K accuracy and optimal-K search.
 *
 * Reference: course_sources/typst/set_valued.typ :
 *  - ch. « Classification Top-K », Définition 6.1 (Prédiction Top-K :
 *    C_K(x) = les K classes de plus haute probabilité prédite) → topK ;
 *  - Définition 6.2 (Accuracy@K : Acc@K = (1/n) Σ 1[y_i ∈ C_K(x_i)], avec
 *    Acc@1 ≤ Acc@2 ≤ … ≤ Acc@C = 1) → accuracyAtK ;
 *  - ch. « Choix automatique de K », Algorithme 6.1 (Choix de K par
 *    validation : K* = argmin_k {Acc@k ≥ τ}, le plus petit ensemble qui
 *    garantit le niveau τ) → findOptimalK.
 */

/** Return indices of the K classes with highest probability, sorted descending by proba. */
export function topK(probas: number[], k: number): number[] {
	const n = probas.length;
	// Build [index] array, sort by probability descending (tie-break: lower index first)
	const indices: number[] = Array.from({ length: n }, (_, i) => i);
	indices.sort((a, b) => probas[b] - probas[a] || a - b);
	return indices.slice(0, Math.min(k, n));
}

/**
 * Accuracy@K for classification.
 * For each sample checks whether the true label appears in the top-K predicted classes.
 */
export function accuracyAtK(y_true: number[], y_proba: number[][], k: number): number {
	const m = y_true.length;
	if (m === 0) return 0;

	let correct = 0;
	for (let s = 0; s < m; s++) {
		const topk = topK(y_proba[s], k);
		if (topk.includes(y_true[s])) correct++;
	}
	return correct / m;
}

/**
 * Find the smallest K that achieves at least `targetAccuracy`.
 * Returns the chosen K and an array of accuracies for K = 1 .. num_classes.
 */
export function findOptimalK(
	y_true: number[],
	y_proba: number[][],
	targetAccuracy: number
): { k: number; accuracies: number[] } {
	const numClasses = y_proba[0]?.length ?? 0;

	const accuracies: number[] = [];
	for (let k = 1; k <= numClasses; k++) {
		accuracies.push(accuracyAtK(y_true, y_proba, k));
	}

	let bestK = 1;
	for (let k = 1; k <= numClasses; k++) {
		if (accuracies[k - 1] >= targetAccuracy) {
			bestK = k;
			break;
		}
	}

	return { k: bestK, accuracies };
}
