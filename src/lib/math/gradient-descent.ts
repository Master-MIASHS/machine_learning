/**
 * Gradient descent step implementations.
 * Each function takes current position, gradient info, and returns the next iterate.
 *
 * Reference: course_sources/typst/optim.typ, ch. 3 « Algorithmes de
 * descente de gradient » :
 *  - Algorithme 3.1 (Descente de gradient : x^(k+1) = x^(k) − α_k ∇f(x^(k)))
 *    → gdStep / runGD ;
 *  - Proposition 3.2 (Direction de plus forte descente) et Proposition 3.3
 *    (Décroissance locale : f(x − α∇f(x)) < f(x) pour α assez petit) ;
 *  - « Choix du pas d'apprentissage » (pas constant / line search / pas
 *    décroissant) ;
 *  - Théorème 3.4 (Convergence — cas convexe : f convexe, L-lisse,
 *    α = 1/L ⇒ f(x^(k)) − f(x*) ≤ L‖x^(0)−x*‖²/(2k), soit O(1/k)) ;
 *  - Algorithme 3.6 (Gradient avec momentum : v^(k+1) = βv^(k) + ∇f,
 *    x^(k+1) = x^(k) − αv^(k+1)) + Remarque 3.7 (développement de la
 *    vitesse) → momentumStep / runMomentum ;
 *  - Algorithme 3.8 (Nesterov Accelerated Gradient : évaluation du
 *    gradient au point anticipé x̃^(k) = x^(k) + β(x^(k) − x^(k−1)))
 *    → nesterovStep / runNAG.
 */

type Grad2D = (x: number, y: number) => [number, number];
type Point2D = [number, number];

/** Classic gradient descent step */
export function gdStep(x: number, y: number, grad: Grad2D, alpha: number): Point2D {
	const [gx, gy] = grad(x, y);
	return [x - alpha * gx, y - alpha * gy];
}

/** Gradient descent with momentum (Polyak) */
interface MomentumState {
	vx: number; // velocity x
	vy: number; // velocity y
}

export function createMomentumState(): MomentumState {
	return { vx: 0, vy: 0 };
}

export function momentumStep(
	x: number,
	y: number,
	state: MomentumState,
	grad: Grad2D,
	alpha: number,
	beta = 0.9
): { x: number; y: number; state: MomentumState } {
	const [gx, gy] = grad(x, y);

	const newVx = beta * state.vx + gx;
	const newVy = beta * state.vy + gy;

	return {
		x: x - alpha * newVx,
		y: y - alpha * newVy,
		state: { vx: newVx, vy: newVy }
	};
}

/** Nesterov Accelerated Gradient step */
interface NAGState {
	vx: number; // velocity for extrapolation
	vy: number;
}

export function createNAGState(): NAGState {
	return { vx: 0, vy: 0 };
}

export function nesterovStep(
	x: number,
	y: number,
	state: NAGState,
	grad: Grad2D,
	alpha: number,
	beta = 0.9
): { x: number; y: number; state: NAGState } {
	// Extrapolate to lookahead point
	const xLookahead = x + beta * state.vx;
	const yLookahead = y + beta * state.vy;

	// Evaluate gradient at lookahead point
	const [gx, gy] = grad(xLookahead, yLookahead);

	const newVx = beta * state.vx - alpha * gx;
	const newVy = beta * state.vy - alpha * gy;

	return {
		x: x + newVx,
		y: y + newVy,
		state: { vx: newVx, vy: newVy }
	};
}

/** Run a full gradient descent trajectory */
interface TrajectoryPoint {
	k: number;
	x: number;
	y: number;
	fVal?: number;
	gradNorm?: number;
}

export interface GDParams {
	alpha?: number | ((k: number) => number); // constant or schedule
	maxIter?: number;
	tol?: number;
	recordFVal?: boolean;
}

export function runGD(
	x0: number,
	y0: number,
	grad: Grad2D,
	getF?: (x: number, y: number) => number,
	params: GDParams = {}
): TrajectoryPoint[] {
	const { alpha = 0.01, maxIter = 1000, tol = 1e-10, recordFVal = true } = params;

	let x = x0,
		y = y0;
	const trajectory: TrajectoryPoint[] = [];

	for (let k = 0; k < maxIter; k++) {
		const [gx, gy] = grad(x, y);
		const gNorm = Math.sqrt(gx * gx + gy * gy);

		const stepSize = typeof alpha === 'function' ? alpha(k) : alpha;

		const pt: TrajectoryPoint = {
			k,
			x,
			y,
			fVal: recordFVal && getF ? getF(x, y) : undefined,
			gradNorm: gNorm
		};
		trajectory.push(pt);

		if (gNorm < tol) break;

		const [nx, ny] = gdStep(x, y, grad, stepSize);
		x = nx;
		y = ny;
	}

	return trajectory;
}

export function runMomentum(
	x0: number,
	y0: number,
	grad: Grad2D,
	getF?: (x: number, y: number) => number,
	params: GDParams & { beta?: number } = {}
): TrajectoryPoint[] {
	const { alpha = 0.01, maxIter = 1000, tol = 1e-10, recordFVal = true, beta = 0.9 } = params;

	let x = x0,
		y = y0;
	const state = createMomentumState();
	const trajectory: TrajectoryPoint[] = [];

	for (let k = 0; k < maxIter; k++) {
		const [gx, gy] = grad(x, y);
		const gNorm = Math.sqrt(gx * gx + gy * gy);

		const stepSize = typeof alpha === 'function' ? alpha(k) : alpha;

		const pt: TrajectoryPoint = {
			k,
			x,
			y,
			fVal: recordFVal && getF ? getF(x, y) : undefined,
			gradNorm: gNorm
		};
		trajectory.push(pt);

		if (gNorm < tol) break;

		const result = momentumStep(x, y, state, grad, stepSize, beta);
		x = result.x;
		y = result.y;
		state.vx = result.state.vx;
		state.vy = result.state.vy;
	}

	return trajectory;
}

export function runNAG(
	x0: number,
	y0: number,
	grad: Grad2D,
	getF?: (x: number, y: number) => number,
	params: GDParams & { beta?: number } = {}
): TrajectoryPoint[] {
	const { alpha = 0.01, maxIter = 1000, tol = 1e-10, recordFVal = true, beta = 0.9 } = params;

	let x = x0,
		y = y0;
	const state: NAGState = { vx: 0, vy: 0 };
	const trajectory: TrajectoryPoint[] = [];

	for (let k = 0; k < maxIter; k++) {
		const [gx, gy] = grad(x, y);
		const gNorm = Math.sqrt(gx * gx + gy * gy);

		const stepSize = typeof alpha === 'function' ? alpha(k) : alpha;

		const pt: TrajectoryPoint = {
			k,
			x,
			y,
			fVal: recordFVal && getF ? getF(x, y) : undefined,
			gradNorm: gNorm
		};
		trajectory.push(pt);

		if (gNorm < tol) break;

		const result = nesterovStep(x, y, state, grad, stepSize, beta);
		x = result.x;
		y = result.y;
		state.vx = result.state.vx;
		state.vy = result.state.vy;
	}

	return trajectory;
}
