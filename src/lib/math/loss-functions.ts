/**
 * Loss functions for ML regression/classification with gradients.
 */

/** MSE loss for a single example: ½(y - wᵀx)² */
export function mseLoss(w: number[], x: number[], y: number): number {
	const pred = dot(w, x);
	return 0.5 * (y - pred) ** 2;
}

/** Gradient of MSE loss w.r.t. w: -(y - wᵀx)·x */
export function mseLossGrad(w: number[], x: number[], y: number): number[] {
	const residual = y - dot(w, x);
	return w.map((_, j) => -residual * x[j]);
}

/** Log-loss for binary classification: log(1 + exp(-y·(wᵀx + b))), y ∈ {-1,+1}. The optional bias b defaults to 0. */
export function logLoss(w: number[], x: number[], yLabel: number, b = 0): number {
	const margin = (dot(w, x) + b) * yLabel; // yLabel should be -1 or +1
	return Math.log(1 + Math.exp(-margin));
}

/** Gradient of log-loss w.r.t. w (bias b defaults to 0) */
export function logLossGrad(w: number[], x: number[], yLabel: number, b = 0): number[] {
	const margin = (dot(w, x) + b) * yLabel;
	const sigmoidNegMargin = 1 / (1 + Math.exp(margin)); // σ(-y·(wᵀx + b))
	return w.map((_, j) => -sigmoidNegMargin * yLabel * x[j]);
}

/** Hinge loss for SVM: max(0, 1 - y·wᵀx), y ∈ {-1,+1} */
export function hingeLoss(w: number[], x: number[], yLabel: number): number {
	const margin = dot(w, x) * yLabel;
	return Math.max(0, 1 - margin);
}

/** Gradient of hinge loss w.r.t. w (subgradient at 0 is set to 0 for simplicity) */
export function hingeLossGrad(w: number[], x: number[], yLabel: number): number[] {
	const margin = dot(w, x) * yLabel;
	if (margin >= 1) return new Array(x.length).fill(0);
	return w.map((_, j) => -yLabel * x[j]);
}

// ─── Helpers ────────────────────────────────────────
function dot(a: number[], b: number[]): number {
	let s = 0;
	for (let i = 0; i < a.length; i++) s += a[i] * b[i];
	return s;
}
