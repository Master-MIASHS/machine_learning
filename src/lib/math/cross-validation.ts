import { knnPredict, type LabeledPoint2D } from './consistency';
import { mulberry32 } from './util';

export interface KnnCVAccuracy {
	k: number;
	accuracy: number;
}

function validateInteger(name: string, value: number, minimum: number): void {
	if (!Number.isInteger(value) || value < minimum) {
		throw new Error(`${name} must be an integer >= ${minimum}, got ${value}`);
	}
}

/**
 * Build a deterministic, shuffled partition of [0, n) into near-equal folds.
 * Every index appears exactly once; the seed only controls the assignment.
 */
export function kFoldIndices(n: number, kFolds: number, seed = 1): number[][] {
	validateInteger('n', n, 1);
	validateInteger('kFolds', kFolds, 2);
	if (kFolds > n) throw new Error(`kFolds cannot exceed n (got ${kFolds}, n=${n})`);

	const indices = Array.from({ length: n }, (_, index) => index);
	const rand = mulberry32(seed);
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}

	const folds = Array.from({ length: kFolds }, () => [] as number[]);
	indices.forEach((index, position) => folds[position % kFolds].push(index));
	return folds;
}

/**
 * Estimate k-NN classification accuracy for each candidate k by k-fold CV.
 * The returned accuracy is pooled over all held-out observations, so each
 * observation contributes exactly once for every candidate k.
 */
export function knnCVAccuracyCurve(
	dataset: LabeledPoint2D[],
	Ks: number[],
	kFolds: number,
	seed = 1
): KnnCVAccuracy[] {
	if (dataset.length === 0) throw new Error('dataset must not be empty');
	if (Ks.length === 0) throw new Error('Ks must not be empty');
	const folds = kFoldIndices(dataset.length, kFolds, seed);
	const smallestTrainingSize = dataset.length - Math.max(...folds.map((fold) => fold.length));

	return Ks.map((k) => {
		validateInteger('k', k, 1);
		if (k > smallestTrainingSize) {
			throw new Error(
				`k (${k}) cannot exceed the smallest training fold (${smallestTrainingSize})`
			);
		}

		let correct = 0;
		for (const validationIndices of folds) {
			const validationSet = new Set(validationIndices);
			const training = dataset.filter((_, index) => !validationSet.has(index));
			for (const index of validationIndices) {
				const prediction = knnPredict(dataset[index], training, k);
				if (prediction === dataset[index].label) correct += 1;
			}
		}
		return { k, accuracy: correct / dataset.length };
	});
}

/** Number of leave-p-out splits, C(n, p), computed without factorial overflow. */
export function leavePOutCount(n: number, p: number): number {
	validateInteger('n', n, 1);
	validateInteger('p', p, 0);
	if (p > n) throw new Error(`p cannot exceed n (got p=${p}, n=${n})`);

	const reducedP = Math.min(p, n - p);
	let count = 1;
	for (let i = 1; i <= reducedP; i++) {
		count = (count * (n - reducedP + i)) / i;
		if (!Number.isFinite(count)) return Infinity;
	}
	return count;
}
