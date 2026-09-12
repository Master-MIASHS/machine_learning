/**
 * Linear regression solvers (OLS, Ridge) with matrix utilities.
 *
 * Sources :
 *  - OLS : course_sources/sophie/StatM1S1_2025.pdf (« Modèles de régression
 *    linéaire et outils du diagnostic ») — estimation MCO du modèle
 *    Y = Xβ + ε, hypothèses (H1) rang(X), (H2) E(ε)=0, (H3) Σ_ε = σ²In
 *    (cf. linear-model.ts pour le détail : Théorème 1 MCO, Théorème 2 MV) ;
 *  - Ridge : course_sources/typst/regularization.typ, ch. 5, Définition 5.1
 *    (Régularisation L2 — Ridge) et solution analytique
 *    θ̂_Ridge = (XᵀX + λI)⁻¹Xᵀy (inversion garantie pour λ > 0) →
 *    ridgeSolver ; cf. aussi course_sources/typst/optim.typ, ch. 2,
 *    Proposition 2.6.2 (Régularisation Ridge) ;
 *  - svdShrinkageFactors : course_sources/typst/regularization.typ,
 *    Proposition 5.1 (Facteurs de rétrécissement : avec X = UΣVᵀ,
 *    θ̂_Ridge = Σ_j (σ_j²/(σ_j²+λ)) v_j (u_jᵀy) — shrinkage plus fort sur
 *    les petites valeurs singulières).
 */

import { matMul, matVec, solveLinearSystem, transpose } from './util.js';

// ─── Solvers ──────────────────────────────────────────────

/** OLS closed-form: θ = (XᵀX)⁻¹ Xᵀy */
export function olsClosedForm(X: number[][], y: number[]): number[] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);
	const Xty = matVec(Xt, y);

	return solveLinearSystem(XtX, Xty);
}

/** Ridge solver: θ = (XᵀX + λI)⁻¹ Xᵀy */
export function ridgeSolver(X: number[][], y: number[], lambda: number): number[] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);

	for (let j = 0; j < d; j++) XtX[j][j] += lambda;

	const Xty = matVec(Xt, y);
	return solveLinearSystem(XtX, Xty);
}

/** SVD shrinkage factors: σ²_j / (σ²_j + λ) */
export function svdShrinkageFactors(singularValues: number[], lambda: number): number[] {
	return singularValues.map((sv) => {
		const s2 = sv * sv;
		return s2 / (s2 + lambda);
	});
}
