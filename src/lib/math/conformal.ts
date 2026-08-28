/**
 * Conformal prediction for classification.
 * Builds valid prediction sets with finite-sample coverage guarantees.
 */

export interface ConformalResult {
	predictionSets: number[][]; // one set of predicted class indices per test sample
}

// ─── Conformity score functions ──────────────────────

/** Rank of the true class in descending probability order (1-indexed). Ties broken by lower index first. */
export function conformityScoreRank(probas: number[], trueLabel: number): number {
	const n = probas.length;
	const indices: number[] = Array.from({ length: n }, (_, i) => i);
	indices.sort((a, b) => probas[b] - probas[a] || a - b);

	for (let r = 0; r < n; r++) {
		if (indices[r] === trueLabel) return r + 1; // 1-indexed rank
	}
	return n; // fallback (should not reach here)
}

/** Score = 1 - P(true label). Higher score means the model was less confident about the correct class. */
export function conformityScore1MinusProba(probas: number[], trueLabel: number): number {
	return 1 - probas[trueLabel];
}

/**
 * Cumulative score, per the notes (`set_valued.typ`, « Scores de conformité
 * probabilistes »): s(x, y) = 1 − Σ_{j : p̂_j(x) ≥ p̂_y(x)} p̂_j(x).
 *
 * The sum runs over **every** class at least as probable as the true label —
 * all ties included, not only those preceding the true label in rank order.
 * For probability vectors without ties this coincides with "sum of the top-r
 * probabilities, r = rank of the true label"; the two forms differ only when
 * several classes share the true label's probability.
 */
export function conformityScoreCumulative(probas: number[], trueLabel: number): number {
	const threshold = probas[trueLabel];
	let cumulativeSum = 0;
	for (const p of probas) {
		if (p >= threshold) cumulativeSum += p;
	}
	return 1 - cumulativeSum;
}

// ─── Quantile threshold ──────────────────────────────

/**
 * Conformal quantile threshold.
 * Returns the ⌈(n+1)(1−α)⌉-th smallest score (0-indexed: sorted[k−1]).
 * If k > n, returns +∞ (include all classes).
 */
export function computeQuantileThreshold(scores: number[], alpha: number): number {
	const n = scores.length;
	if (n === 0) return Infinity;

	const sorted = [...scores].toSorted((a, b) => a - b);
	const k = Math.ceil((n + 1) * (1 - alpha));

	if (k > n) return Infinity;
	return sorted[k - 1];
}

// ─── Prediction set construction ──────────────────────

/**
 * Build the conformal prediction set for a single test sample.
 * For each class j, compute s(x, j) = scoreFn(testProba, j). Include j if s(x, j) ≤ q̂.
 */
export function conformalPredictionSet(
	testProba: number[],
	scores: number[],
	alpha: number,
	scoreFn: (probas: number[], label: number) => number
): ConformalResult {
	const qHat = computeQuantileThreshold(scores, alpha);

	const numClasses = testProba.length;
	const included: number[] = [];
	for (let j = 0; j < numClasses; j++) {
		if (scoreFn(testProba, j) <= qHat) {
			included.push(j);
		}
	}

	return { predictionSets: [included] };
}
