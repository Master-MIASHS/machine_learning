/**
 * Optimality condition helpers.
 * Find critical points, compute Hessians numerically, and test positive definiteness.
 */

type Grad2D = (x: number, y: number) => [number, number];
type Func2D = (x: number, y: number) => number;

/** 2×2 matrix as flat array [a,b,c,d] representing [[a,b],[c,d]] */
export type Matrix2x2 = [number, number, number, number];

/** Numerical Hessian using centered finite differences */
export function hessian2D(f: Func2D, x: number, y: number, h = 1e-5): Matrix2x2 {
	const f00 = f(x, y);
	const fh0 = f(x + h, y);
	const f0h = f(x, y + h);
	const fhh = f(x + h, y + h);

	const dxx = (f(x + h, y) - 2 * f00 + f(x - h, y)) / (h * h);
	const dyx = (fhh - fh0 - f0h + f00) / (2 * h * h); // mixed derivative
	const dyy = (f(x, y + h) - 2 * f00 + f(x, y - h)) / (h * h);

	return [dxx, dyx, dyx, dyy]; // symmetric for C² functions
}

/** Test if a 2×2 matrix is positive definite via Sylvester's criterion */
export function isPositiveDefinite(m: Matrix2x2): boolean {
	const [a, b, c, d] = m;
	return a > 0 && a * d - b * c > 0; // leading principal minors all positive
}

/** Test if a 2×2 symmetric matrix is semi-definite positive */
export function isSemiDefinitePositive(m: Matrix2x2, tol = 1e-8): boolean {
	// m = [hxx, hxy, hyx, hyy]; use index access to skip unused element
	const a = m[0],
		b = m[1],
		d = m[3];
	// Both eigenvalues ≥ -tol
	if (a < -tol || d < -tol) return false;
	if (a * d - b * b < -tol) return false;
	return true;
}

/** Eigenvalues of a 2×2 symmetric matrix [[a,b],[b,d]] */
export function eigenvalues2x2(m: Matrix2x2): [number, number] {
	// m = [hxx, hxy, hyx, hyy]; use index access to skip unused element
	const a = m[0],
		b = m[1],
		d = m[3];
	const trace = a + d;
	const det = a * d - b * b;
	const disc = Math.max(0, trace * trace - 4 * det);
	const sqrtDisc = Math.sqrt(disc);
	return [(trace + sqrtDisc) / 2, (trace - sqrtDisc) / 2];
}

/** Gradient norm at a point */
export function gradNorm(grad: Grad2D, x: number, y: number): number {
	const [gx, gy] = grad(x, y);
	return Math.sqrt(gx * gx + gy * gy);
}

/**
 * Find critical points by multi-start Newton from a coarse 25×25 grid over
 * `domain` (both endpoints included), then deduplicate and classify the
 * converged iterates. A strict sign-change grid scan is deliberately not
 * used: a gradient component that is exactly zero on a grid line (e.g. the
 * origin of x² + 4y² on a symmetric domain) produces no sign change, hence
 * no candidate at all. `gridSize` sets the start-grid resolution, capped at
 * 25 points per axis so the multi-start stays cheap in the browser.
 */
interface CriticalPoint {
	x: number;
	y: number;
	fVal: number;
	type: 'minimum' | 'maximum' | 'saddle' | 'inconclusive';
	gradNormAtPoint: number;
}

// For degenerate roots, a small gradient norm does not imply equally small
// coordinates: here |∂f/∂y| = 4|y|³, so Newton may stop around y = 3e-4.
// Treat these nearby iterates as the same root and normalize them to zero.
const coordinateTolerance = 1e-3;

function normalizeNearZero(value: number): number {
	return Math.abs(value) < coordinateTolerance ? 0 : value;
}

export function findCriticalPoints(
	f: Func2D,
	grad: Grad2D,
	domain: [[number, number], [number, number]],
	gridSize = 100,
	newtonTol = 1e-10,
	maxIter = 50
): CriticalPoint[] {
	const [xMin, xMax] = domain[0];
	const [yMin, yMax] = domain[1];

	// Step 1: coarse grid of Newton start points (both endpoints included),
	// capped at 25 per axis so the multi-start stays cheap in the browser
	const n = Math.min(gridSize, 25);
	const dx = (xMax - xMin) / (n - 1);
	const dy = (yMax - yMin) / (n - 1);

	const candidates: { x: number; y: number }[] = [];
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			candidates.push({ x: xMin + i * dx, y: yMin + j * dy });
		}
	}

	// Step 2: Refine each candidate with Newton's method
	const refined: CriticalPoint[] = [];

	for (const c of candidates) {
		const result = refineNewton(f, grad, c.x, c.y, newtonTol, maxIter);
		if (!result) continue;

		const point = {
			x: normalizeNearZero(result.x),
			y: normalizeNearZero(result.y)
		};

		// Deduplicate by coordinate distance rather than independent rounded
		// bins, so small positive and negative residuals around zero coincide.
		const existingIndex = refined.findIndex(
			(existing) =>
				Math.abs(existing.x - point.x) <= coordinateTolerance &&
				Math.abs(existing.y - point.y) <= coordinateTolerance
		);
		if (existingIndex >= 0) {
			// Keep the most accurate representative when several starts reach
			// the same flat/degenerate root.
			if (gradNorm(grad, point.x, point.y) >= refined[existingIndex].gradNormAtPoint) continue;
			refined.splice(existingIndex, 1);
		}

		// Classify using Hessian
		const hess = hessian2D(f, point.x, point.y);
		let type: CriticalPoint['type'];
		if (isPositiveDefinite(hess)) {
			type = 'minimum';
		} else {
			const [ev1, ev2] = eigenvalues2x2(hess);
			if (ev1 < -1e-6 && ev2 < -1e-6) type = 'maximum';
			else if (ev1 * ev2 < -1e-6) type = 'saddle';
			else type = 'inconclusive';
		}

		refined.push({
			x: point.x,
			y: point.y,
			fVal: f(point.x, point.y),
			type,
			gradNormAtPoint: gradNorm(grad, point.x, point.y)
		});
	}

	return refined;
}

/** Refine a critical point candidate with Newton's method */
function refineNewton(
	f: Func2D,
	grad: Grad2D,
	x0: number,
	y0: number,
	tol = 1e-10,
	maxIter = 50
): { x: number; y: number } | null {
	let x = x0,
		y = y0;

	for (let k = 0; k < maxIter; k++) {
		const [gx, gy] = grad(x, y);
		const gNorm = Math.sqrt(gx * gx + gy * gy);

		if (gNorm < tol) return { x, y };

		const hess = hessian2D(f, x, y);
		// m = [hxx, hxy, hyx, hyy]
		const hxx = hess[0],
			hxy = hess[1],
			hyy = hess[3];
		const det = hxx * hyy - hxy * hxy;

		if (Math.abs(det) < 1e-15) {
			// Hessian is singular — fall back to steepest descent step
			const stepSize = gNorm > 0 ? tol / gNorm : 1e-4;
			x -= gx * stepSize;
			y -= gy * stepSize;
			continue;
		}

		// Newton step: [dx, dy] = -H⁻¹ · ∇f
		const dxx = (-hyy * gx + hxy * gy) / det;
		const dyy = (hxy * gx - hxx * gy) / det;

		x += dxx;
		y += dyy;
	}

	return null; // did not converge
}
