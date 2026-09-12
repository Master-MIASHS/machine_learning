/**
 * Bootstrap resampling and variance estimation.
 *
 * Reference: course_sources/typst/regularization.typ, ch. 4 « Méthodes
 * ensemblistes », section « Bagging (Bootstrap Aggregating) » :
 *  - Définition 4.5 (Échantillon Bootstrap : tirage de n points avec remise,
 *    ~63.2 % des points présents, ~36.8 % absents) → bootstrapSample ;
 *  - Algorithme 4.1 (Bagging) → bootstrapPredictions ;
 *  - Théorème 4.2 (Réduction de variance par bagging : σ²/M si les modèles
 *    sont décorrélés) → bootstrapVariance.
 * NB : seededRandom ci-dessous est une copie privée de mulberry32 (dette
 * antérieure — les nouveaux modules importent de util.ts).
 */

export interface BootstrapResult {
	predictionsMatrix: number[][]; // [model_b][data_point_i]
	variancePerPoint: number[];
}

// ─── Seeded RNG (Mulberry32) ──────────────────────────

/** Return a reproducible PRNG given an integer seed. */
export function seededRandom(seed: number): () => number {
	let s = seed | 0;
	return function (): number {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		const t = Math.imul(s ^ ((s >>> 15) | 0), 1 | s);
		const hashed = (t + Math.imul(t ^ ((t >>> 7) | 0), 61 | t)) ^ t;
		return ((hashed ^ ((hashed >>> 14) | 0)) >>> 0) / 4294967296; // [0, 1)
	};
}

// ─── Bootstrap sampling ──────────────────────────────

/** Sample n items from `data` with replacement (n = data.length). */
export function bootstrapSample<T>(data: T[], rng = Math.random): T[] {
	const n = data.length;
	return Array.from({ length: n }, () => data[Math.floor(rng() * n)]);
}

// ─── Bootstrap predictions matrix ─────────────────────

/**
 * Train B bootstrap models and evaluate each on every point of the original dataset.
 * Returns a [B][n] prediction matrix plus per-point empirical variance.
 */
export function bootstrapPredictions<T>(
	modelFactory: (data: T[]) => (x: T) => number,
	data: T[],
	B: number
): BootstrapResult {
	const n = data.length;

	// predictionsMatrix[b][i] = prediction of model b at data point i
	const predictionsMatrix: number[][] = new Array(B);
	for (let b = 0; b < B; b++) {
		const sample = bootstrapSample(data);
		const model = modelFactory(sample);
		predictionsMatrix[b] = new Array(n);
		for (let i = 0; i < n; i++) {
			predictionsMatrix[b][i] = model(data[i]);
		}
	}

	const variancePerPoint = bootstrapVariance(predictionsMatrix);
	return { predictionsMatrix, variancePerPoint };
}

// ─── Per-point variance ──────────────────────────────

/** Compute empirical variance across models at each data point. */
export function bootstrapVariance(predictionsMatrix: number[][]): number[] {
	const B = predictionsMatrix.length;
	if (B === 0) return [];
	const n = predictionsMatrix[0].length;

	const variances: number[] = new Array(n);
	for (let i = 0; i < n; i++) {
		let sum = 0;
		for (let b = 0; b < B; b++) sum += predictionsMatrix[b][i];
		const mean = sum / B;

		let varSum = 0;
		for (let b = 0; b < B; b++) varSum += (predictionsMatrix[b][i] - mean) ** 2;
		variances[i] = varSum / B; // population variance
	}
	return variances;
}
