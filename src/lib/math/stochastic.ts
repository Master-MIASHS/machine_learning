/**
 * Stochastic optimization helpers.
 * SGD, mini-batch gradient computation for machine learning loss landscapes.
 *
 * Reference: course_sources/typst/optim.typ, ch. 3, section « Descente de
 * gradient stochastique (SGD) » :
 *  - Algorithme 3.9 (Stochastic Gradient Descent : tirage d'un exemple i_k,
 *    x^(k+1) = x^(k) − α_k ∇f_{i_k}(x^(k))) → sgdStep / runSGD ;
 *  - Proposition 3.10 (Gradient non biaisé : E[∇f_{i_k}(w)] = ∇f(w))
 *    → exactGradient ;
 *  - « Variance du gradient stochastique » (oscillation autour du minimum)
 *    + Remarque 3.13 (Var[∇̃f] = σ²/b pour un mini-batch de taille b) →
 *    computeGradientVariance / miniBatchGradient ;
 *  - Algorithme 3.12 (Mini-batch SGD) ;
 *  - Proposition 3.11 (Convergence SGD : f convexe, L-lisse,
 *    α_k = α/√k ⇒ E[f(w̄_K)] − f(w*) = O(1/√K), moyenne des itérés).
 */

/** Gradient of a single loss component f_i with respect to theta (2D) */
export type ComponentGrad = (theta: [number, number], i: number) => [number, number];

/** Full objective value as mean of components */
export type ComponentLoss = (theta: [number, number], i: number) => number;

/** Single SGD step using one randomly chosen component gradient */
export function sgdStep(
	theta: [number, number],
	componentGrad: ComponentGrad,
	i_k: number,
	alpha: number
): [number, number] {
	const [dgx, dgy] = componentGrad(theta, i_k);
	return [theta[0] - alpha * dgx, theta[1] - alpha * dgy];
}

/** Mini-batch gradient: average of gradients over a batch */
export function miniBatchGradient(
	componentGrads: ComponentGrad[],
	batchIndices: number[],
	theta: [number, number]
): [number, number] {
	if (batchIndices.length === 0) return [0, 0];

	let sumGx = 0,
		sumGy = 0;
	for (const idx of batchIndices) {
		const gradFn = componentGrads[idx % componentGrads.length];
		const [gx, gy] = gradFn(theta, idx);
		sumGx += gx;
		sumGy += gy;
	}

	return [sumGx / batchIndices.length, sumGy / batchIndices.length];
}

/** Exact gradient: average of all component gradients */
export function exactGradient(
	componentGrad: ComponentGrad,
	n: number,
	theta: [number, number]
): [number, number] {
	let sumGx = 0,
		sumGy = 0;
	for (let i = 0; i < n; i++) {
		const [gx, gy] = componentGrad(theta, i);
		sumGx += gx;
		sumGy += gy;
	}
	return [sumGx / n, sumGy / n];
}

/** SGD trajectory with optional mini-batch support */
interface SGDPoint {
	k: number;
	x: number;
	y: number;
	fVal?: number;
}

export interface SGDParams {
	alpha?: number | ((k: number) => number); // step size / schedule
	maxIter?: number;
	batchSize?: number;
	recordFVal?: boolean;
	seed?: number;
}

/** Simple deterministic pseudo-random for reproducibility */
function seededRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return s / 2147483647;
	};
}

export function runSGD(
	theta0: [number, number],
	componentGrad: ComponentGrad,
	n: number,
	getF?: (theta: [number, number]) => number,
	params: SGDParams = {}
): SGDPoint[] {
	const { alpha = 0.01, maxIter = 1000, batchSize = 1, recordFVal = true, seed } = params;

	const rng = seededRandom(seed ?? 42);
	const theta: [number, number] = [...theta0];
	const trajectory: SGDPoint[] = [];

	for (let k = 0; k < maxIter; k++) {
		const stepSize = typeof alpha === 'function' ? alpha(k) : alpha;

		if (batchSize <= 1 || batchSize >= n) {
			// Pure SGD (single sample)
			const i_k = Math.floor(rng() * n);
			const [nx, ny] = sgdStep(theta, componentGrad, i_k, stepSize);
			theta[0] = nx;
			theta[1] = ny;
		} else {
			// Mini-batch
			const batch: number[] = [];
			for (let b = 0; b < batchSize; b++) {
				batch.push(Math.floor(rng() * n));
			}

			// Compute mini-batch gradient using same componentGrad with different indices
			let sumGx = 0,
				sumGy = 0;
			for (const idx of batch) {
				const [gx, gy] = componentGrad(theta, idx);
				sumGx += gx;
				sumGy += gy;
			}
			const avgGx = sumGx / batch.length;
			const avgGy = sumGy / batch.length;

			theta[0] -= stepSize * avgGx;
			theta[1] -= stepSize * avgGy;
		}

		trajectory.push({
			k,
			x: theta[0],
			y: theta[1],
			fVal: recordFVal && getF ? getF(theta) : undefined
		});
	}

	return trajectory;
}

/** Compute variance of stochastic gradients */
export function computeGradientVariance(
	componentGrad: ComponentGrad,
	n: number,
	theta: [number, number]
): number {
	const exact = exactGradient(componentGrad, n, theta);
	let sumVar = 0;

	for (let i = 0; i < n; i++) {
		const [gx, gy] = componentGrad(theta, i);
		const diffGx = gx - exact[0];
		const diffGy = gy - exact[1];
		sumVar += diffGx * diffGx + diffGy * diffGy;
	}

	return sumVar / n; // E[||∇f_i - ∇f||²]
}
