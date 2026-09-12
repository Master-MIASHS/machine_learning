/**
 * Loss functions for ML regression/classification with gradients.
 *
 * Sources :
 *  - MSE (coût quadratique) : course_sources/marine/Cours/CM/coursClassif-2RegLogistique.tex
 *    (section « Classifieurs Linéaires ») et course_sources/typst/optim.typ,
 *    ch. 2, « Exemples en ML — Régression linéaire » (Proposition 2.6.1,
 *    solution en forme close) ;
 *  - Perte logistique : course_sources/marine/Cours/CM/coursClassif-2RegLogistique.tex,
 *    frames de la section « La régression logistique » : ℓ = log(1 +
 *    exp(−y(⟨w,x⟩+b))), choix du log motivé par les cas y = ±1 ;
 *  - Perte charnière (hinge) : course_sources/marine/Cours/CM/coursClassif-4-SVM.tex,
 *    section « SVM à marge souple » : ℓ^hinge = max(0, 1 − y_i(⟨w,x_i⟩+b)),
 *    primale min ½‖w‖² + C Σ ℓ^hinge.
 * Les gradients ci-dessous sont les dérivées standards de ces pertes
 * (pas de formule numérotée dans les sources).
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
