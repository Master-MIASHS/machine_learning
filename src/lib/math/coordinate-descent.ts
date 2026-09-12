/**
 * Coordinate descent optimization.
 * Cycle through coordinates, optimizing one at a time.
 *
 * Reference: course_sources/typst/optim.typ, ch. 3, section « Descente par
 * coordonnées (Coordinate Descent) » :
 *  - Algorithme 3.13 (Descente par coordonnées — version cyclique :
 *    minimisation exacte de chaque coordonnée, valeurs déjà mises à jour
 *    utilisées immédiatement) → cdCyclicStep ;
 *  - « Stratégies de parcours » : cyclique / aléatoire / greedy →
 *    cdCyclicStep / cdRandomStep / cdGreedyStep ;
 *  - Théorème 3.16 (convergence CD aléatoire : E[f(x^(k))]−f(x*) = O(d/k)) ;
 *  - Algorithme 3.17 (Block Coordinate Descent) — non implémenté ici.
 * NB : la source énonce la minimisation *exacte* de chaque coordonnée ;
 * la recherche de pas par ligne (lineSearchCoordinate) est un substitut
 * numérique pour les fonctions sans solution en forme close — pas une
 * formule de la source.
 */

type FuncND = (theta: number[]) => number;
type GradND = (theta: number[]) => number[];

/** Cyclic coordinate descent step — cycle over coordinates 0..d-1 and return next iterate after one full sweep */
export function cdCyclicStep(theta: number[], f: FuncND): number[] {
	const d = theta.length;

	const newTheta = [...theta];

	for (let coord = 0; coord < d; coord++) {
		// Adaptive initial step size based on current coordinate magnitude
		const h = Math.max(1e-4, Math.abs(theta[coord]) * 0.1);
		const bestStep = lineSearchCoordinate(f, newTheta, coord, h);
		newTheta[coord] += bestStep;
	}

	return newTheta;
}

/** Line search along a single coordinate direction with adaptive step size expansion */
function lineSearchCoordinate(f: FuncND, theta: number[], coord: number, initH = 1e-4): number {
	const fBase = f(theta);

	// Try positive and negative directions to find descent direction
	const bestThetaPos = [...theta];
	bestThetaPos[coord] += initH;
	const fPos = f(bestThetaPos);

	const bestThetaNeg = [...theta];
	bestThetaNeg[coord] -= initH;
	const fNeg = f(bestThetaNeg);

	// Determine descent direction: pick whichever decreases more (or increases less)
	let dir = 1; // default: positive direction
	if (fNeg < fPos) {
		dir = -1;
	}

	// Adaptive bracketing: expand until we find the peak of improvement then decline
	const goldenRatio = (Math.sqrt(5) + 1) / 2;
	let stepSize = Math.abs(initH);
	const maxStep = 10.0; // practical upper bound for step size
	let fDirVal = dir > 0 ? fPos : fNeg;

	// Expand the bracket until we see improvement then decline (or hit max)
	while (fDirVal < fBase && stepSize * 2 <= maxStep) {
		const testTheta = [...theta];
		testTheta[coord] += dir * stepSize * 2;
		const fTest = f(testTheta);

		if (fTest >= fDirVal || fTest > fBase + (fDirVal - fBase)) {
			// Found peak — stop expanding
			break;
		}

		stepSize *= 2;
		fDirVal = fTest;
	}

	// Golden section search — ensure a <= b so standard formulas work regardless of direction
	let lo = Math.min(0, dir > 0 ? stepSize : -stepSize);
	let hi = Math.max(0, dir > 0 ? stepSize : -stepSize);

	for (let _ = 0; _ < 30; _) {
		const range = hi - lo; // always >= 0
		if (Math.abs(range) < 1e-15) break;

		// Standard golden section: inner points at (phi-1)/phi ≈ 0.382 from each end
		const phiInv = 1 / goldenRatio; // ~0.618
		const c1 = lo + range * (1 - phiInv); // ~0.382 from left
		const c2 = hi - range * (1 - phiInv); // ~0.382 from right

		const thetaC1 = [...theta];
		thetaC1[coord] += c1;
		const f1 = f(thetaC1);

		const thetaC2 = [...theta];
		thetaC2[coord] += c2;
		const f2 = f(thetaC2);

		if (f1 < f2) {
			hi = c2;
		} else {
			lo = c1;
		}
	}

	const bestStep = (lo + hi) / 2;

	// Only return step if it improves over base
	const testTheta = [...theta];
	testTheta[coord] += bestStep;
	if (f(testTheta) < fBase) {
		return bestStep;
	}
	return 0;
}

/** Random coordinate descent — pick a random coordinate to optimize */
export function cdRandomStep(
	theta: number[],
	f: FuncND,
	rng: () => number = Math.random
): { newTheta: number[]; coord: number } {
	const d = theta.length;
	const coord = Math.floor(rng() * d);

	// Line search along this coordinate with adaptive step size
	const h = Math.max(1e-4, Math.abs(theta[coord]) * 0.1);
	const bestStep = lineSearchCoordinate(f, theta, coord, h);

	// Return a new array — never mutate the input so runCD can compare references
	const newTheta = [...theta];
	newTheta[coord] += bestStep;

	return { newTheta, coord };
}

/** Greedy coordinate descent — pick the coordinate with largest gradient component */
export function cdGreedyStep(
	theta: number[],
	f: FuncND,
	grad?: GradND // optional analytical gradient for efficiency
): { newTheta: number[]; coord: number } {
	const d = theta.length;

	let bestCoord = 0;
	let maxAbsGrad = -Infinity;

	for (let j = 0; j < d; j++) {
		if (grad) {
			const g = grad(theta);
			if (Math.abs(g[j]) > maxAbsGrad) {
				maxAbsGrad = Math.abs(g[j]);
				bestCoord = j;
			}
		} else {
			// Numerical gradient along coordinate j
			const h = 1e-6;
			const thetaPlus = [...theta];
			thetaPlus[j] += h;
			const gNum = (f(thetaPlus) - f(theta)) / h;
			if (Math.abs(gNum) > maxAbsGrad) {
				maxAbsGrad = Math.abs(gNum);
				bestCoord = j;
			}
		}
	}

	const newTheta = [...theta];
	const hGreedy = Math.max(1e-4, Math.abs(newTheta[bestCoord]) * 0.1);
	const bestStep = lineSearchCoordinate(f, newTheta, bestCoord, hGreedy);
	newTheta[bestCoord] += bestStep;

	return { newTheta, coord: bestCoord };
}

/** Run full coordinate descent until convergence */
export interface CDParams {
	method?: 'cyclic' | 'random' | 'greedy';
	maxIter?: number;
	tol?: number;
	grad?: GradND;
	seed?: number;
}

interface CDTrajectoryPoint {
	k: number;
	theta: number[];
	fVal: number;
}

export function runCD(theta0: number[], f: FuncND, params: CDParams = {}): CDTrajectoryPoint[] {
	const { method = 'cyclic', maxIter = 1000, tol = 1e-8, grad, seed } = params;

	let theta = [...theta0];
	const trajectory: CDTrajectoryPoint[] = [];

	const rng = (() => {
		let s = seed ?? 42;
		return () => {
			s = (s * 16807) % 2147483647;
			return s / 2147483647;
		};
	})();

	for (let k = 0; k < maxIter; k++) {
		const fVal = f(theta);

		if (k % 5 === 0 || k < 5) {
			trajectory.push({ k, theta: [...theta], fVal });
		}

		let newTheta: number[];
		if (method === 'cyclic') {
			newTheta = cdCyclicStep(theta, f);
		} else if (method === 'random') {
			const result = cdRandomStep(theta, f, rng);
			newTheta = result.newTheta;
		} else {
			const result = cdGreedyStep(theta, f, grad);
			newTheta = result.newTheta;
		}

		// Check convergence
		let diff = 0;
		for (let j = 0; j < theta.length; j++) {
			diff += (newTheta[j] - theta[j]) ** 2;
		}
		if (Math.sqrt(diff) < tol) break;

		theta = newTheta;
	}

	// Always add the final point
	const fVal = f(theta);
	trajectory.push({ k: trajectory.length, theta: [...theta], fVal });

	return trajectory;
}
