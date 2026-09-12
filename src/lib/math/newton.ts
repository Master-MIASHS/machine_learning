/**
 * Newton's method for unconstrained optimization.
 *
 * Reference: course_sources/typst/optim.typ, ch. 3, section « Méthode de
 * Newton-Raphson » :
 *  - « Motivation par développement de Taylor » (développement à l'ordre 2)
 *    et « Dérivation de l'algorithme » (v* = −H_f(x)⁻¹ ∇f(x)) →
 *    taylorApproximation2 / newtonStep ;
 *  - Algorithme 3.13 (Méthode de Newton) — NB : la source réutilise le
 *    numéro 3.13 (déjà porté par la descente par coordonnées cyclique) ;
 *  - Théorème 3.14 (Convergence quadratique : ‖x^(k+1)−x*‖ ≤ C‖x^(k)−x*‖²
 *    près d'un minimum strict) → runNewton.
 * Le Newton amorti (dampedNewtonStep) n'est PAS dans les sources —
 * illustratif, au-delà du cours (la source évoque la combinaison GD puis
 * Newton dans « Remarque 3.14.2 — Convergence locale vs globale »).
 */

type Grad2D = (x: number, y: number) => [number, number];
type Func2D = (x: number, y: number) => number;
type Matrix2x2 = [number, number, number, number];

/** Single Newton step: x_new = x - H⁻¹ ∇f(x) */
export function newtonStep(
	x: number,
	y: number,
	grad: Grad2D,
	hess: Matrix2x2
): { x: number; y: number } {
	const [gx, gy] = grad(x, y);
	const [hxx, hxy, hyx, hyy] = hess;

	const det = hxx * hyy - hxy * hyx;

	if (Math.abs(det) < 1e-15) {
		// Singular Hessian — fall back to gradient step with damping
		return { x: x - 0.1 * gx, y: y - 0.1 * gy };
	}

	// H⁻¹ = (1/det) * [[hyy, -hxy], [-hyx, hxx]]
	// Newton step: x_new = x - H⁻¹ ∇f → d = H⁻¹g
	const dxx = (hyy * gx - hxy * gy) / det;
	const dyy = (-hyx * gx + hxx * gy) / det;

	return { x: x - dxx, y: y - dyy };
}

/** Taylor approximation of order 2 at point x0 evaluated at dx */
export function taylorApproximation2(
	f0: number,
	gradF0: [number, number],
	hess0: Matrix2x2,
	dx: number,
	dy: number
): number {
	const [gx, gy] = gradF0;
	// m = [hxx, hxy, hyx, hyy]
	const hxx = hess0[0],
		hxy = hess0[1],
		hyy = hess0[3];

	// f(x) ≈ f(x0) + ∇f(x0)·(dx,dy) + ½ (dx,dy)ᵀ H(dx,dy)
	return f0 + gx * dx + gy * dy + 0.5 * (hxx * dx * dx + 2 * hxy * dx * dy + hyy * dy * dy);
}

/** Damped Newton with backtracking line search */
export function dampedNewtonStep(
	x: number,
	y: number,
	f: Func2D,
	grad: Grad2D,
	hess: Matrix2x2,
	alpha0 = 1.0,
	c1 = 1e-4,
	rho = 0.5,
	maxBacktracks = 20
): { x: number; y: number; alpha: number } {
	const fVal = f(x, y);
	const [gx, gy] = grad(x, y);

	const step = newtonStep(x, y, grad, hess);
	let dx = step.x - x;
	let dy = step.y - y;

	// If Newton direction is not a descent direction (Hessian indefinite), use steepest descent
	const directionalDeriv = gx * dx + gy * dy;
	if (directionalDeriv >= 0) {
		dx = -gx;
		dy = -gy;
	}

	let alpha = alpha0;

	for (let bt = 0; bt < maxBacktracks; bt++) {
		const newX = x + alpha * dx;
		const newY = y + alpha * dy;
		const newF = f(newX, newY);

		// Armijo condition: f(x+αd) ≤ f(x) + c1·α·∇f(x)·d
		if (newF <= fVal + c1 * alpha * directionalDeriv || (directionalDeriv < 0 && newF <= fVal)) {
			return { x: newX, y: newY, alpha };
		}

		alpha *= rho;
	}

	return { x: x + alpha * dx, y: y + alpha * dy, alpha };
}

/** Full Newton trajectory with convergence tracking */
export interface NewtonPoint {
	k: number;
	x: number;
	y: number;
	fVal?: number;
	gradNorm?: number;
	stepSize?: number;
}

export function runNewton(
	x0: number,
	y0: number,
	f: Func2D,
	grad: Grad2D,
	getHess: (x: number, y: number) => Matrix2x2,
	maxIter = 100,
	tol = 1e-10,
	damped = true
): NewtonPoint[] {
	let x = x0,
		y = y0;
	const trajectory: NewtonPoint[] = [];

	for (let k = 0; k < maxIter; k++) {
		const fVal = f(x, y);
		const [gx, gy] = grad(x, y);
		const gNorm = Math.sqrt(gx * gx + gy * gy);

		trajectory.push({
			k,
			x,
			y,
			fVal,
			gradNorm: gNorm,
			stepSize: 0 // placeholder; set below if needed
		});

		if (gNorm < tol) break;

		const hess = getHess(x, y);

		let newX: number, newY: number;
		let stepSize = 1.0;

		if (damped) {
			const result = dampedNewtonStep(x, y, f, grad, hess);
			newX = result.x;
			newY = result.y;
			stepSize = result.alpha;
			trajectory[trajectory.length - 1].stepSize = stepSize;
		} else {
			const step = newtonStep(x, y, grad, hess);
			newX = step.x;
			newY = step.y;
			trajectory[trajectory.length - 1].stepSize = 1.0;
		}

		x = newX;
		y = newY;
		if (k > 0) trajectory[trajectory.length - 1].stepSize = stepSize;
	}

	return trajectory;
}
