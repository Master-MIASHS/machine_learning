/**
 * RKHS et régression à noyau ridge (KRR) — leçon expert « Espaces de Hilbert
 * à noyau (RKHS) et méthodes à noyau » (brief
 * expert/part2/lessons/rkhs-methodes-noyau.md).
 *
 * Le contenu de ce module est au-delà de course_sources/ : la théorie RKHS
 * n'y figure pas (vérifié). Références primaires des résultats implémentés :
 *  - Forme close de la KRR (E.5–E.6 de la leçon) :
 *      min_{f ∈ H_K} (1/n) Σᵢ (yᵢ − f(xᵢ))² + λ‖f‖²_{H_K}
 *      ⇒ α⋆ = (K + nλI)⁻¹y,  ‖f⋆‖²_{H_K} = α⋆ᵀKα⋆.
 *    Dérivation : théorème du représentant (Schölkopf, Herbrich & Smola 2001,
 *    « Learning with Kernels », MIT Press ; première forme Kimeldorf & Wahba
 *    1970) + conditions d'optimalité — exposé moderne : Schölkopf & Smola,
 *    « Learning with Kernels » (2002), ch. 4 ; SMLR ch. 16 « Kernel Ridge
 *    Regression ».
 *  - Théorème du représentant (section 4 de la leçon) : idem Schölkopf,
 *    Herbrich & Smola 2001.
 *  - Noyaux PSD / astuce du noyau / matrice de Gram : déjà enseignés —
 *    course_sources/marine/Cours/CM/coursClassif-4-SVM.tex, § « SVM à noyau »
 *    (Théorème de Moore–Aronszajn, exemples de noyaux) ; les fonctions
 *    `linearKernel`, `gaussianKernel`, `polyKernel`, `gramMatrix` et
 *    `minEigenvalueSymmetric` sont réutilisées depuis ./svm (pas de
 *    duplication). Convention du noyau gaussien : exp(−‖x−x̃‖²/(2σ²)),
 *    γ = 1/(2σ²) — idem coursClassif-4-SVM.tex.
 *  - Pont ridge (bloc 5.3 de la leçon) : KRR à noyau linéaire = ridge
 *    (Partie V, leçon 4) de paramètre nλ — `ridgeSolver` de ./regression,
 *    source course_sources/typst/regularization.typ, ch. 5, Définition 5.1.
 *
 * Convention de λ : objectif (1/n)Σ(yᵢ−f(xᵢ))² + λ‖f‖² (forme SMLR / Welling)
 * — d'autres conventions circulent (scikit-learn omet le 1/n) ; la solution
 * close correspondante est α = (K + nλI)⁻¹y.
 */
import {
	gaussianKernel,
	linearKernel,
	minEigenvalueSymmetric,
	type KernelFn
} from './svm';
import { solveLinearSystem } from './util';
import { gaussianSample, type Gaussian } from './gaussian';
import { mulberry32, combineSeed } from './util';

/**
 * Vérifie qu'une matrice carrée est symétrique semi-définie positive
 * (tolérance 1e-8 sur la plus petite valeur propre, précision Jacobi).
 *
 * @throws si M n'est pas carrée ou si min spec(M) < −1e-8.
 */
export function assertPsd(K: number[][], tol = 1e-8): void {
	const n = K.length;
	for (let i = 0; i < n; i++) {
		if (K[i].length !== n) {
			throw new Error(`assertPsd: matrice non carrée (${n}×${K[i].length})`);
		}
	}
	const minEv = minEigenvalueSymmetric(K);
	if (minEv < -tol) {
		throw new Error(`assertPsd: matrice non PSD (valeur propre min = ${minEv.toExponential(3)})`);
	}
}

/**
 * Forme close de la KRR : α⋆ = (K + nλI)⁻¹y (leçon expert RKHS, E.6).
 *
 * Résout le système (K + nλI)α = y par élimination de Gauss (avec
 * pivotage) — K + nλI est toujours inversible pour λ > 0 (K PSD + nλI
 * définie positive), même si K est singulière.
 *
 * @throws si λ ≤ 0, si K n'est pas carrée, si K et y ont des longueurs
 *   différentes, ou si K n'est pas semi-définie positive.
 */
export function krrSolve(K: number[][], y: number[], lambda: number): number[] {
	const n = K.length;
	if (n === 0) throw new Error('krrSolve: matrice de Gram vide');
	if (y.length !== n) {
		throw new Error(`krrSolve: dimensions incompatibles (K ${n}×? , y ${y.length})`);
	}
	if (!(lambda > 0)) {
		throw new Error(`krrSolve: lambda doit être > 0 (reçu ${lambda})`);
	}
	assertPsd(K);
	// (K + nλI) — on ne modifie jamais K (contrat : entrée préservée).
	const A = K.map((row, i) => row.map((v, j) => (i === j ? v + n * lambda : v)));
	return solveLinearSystem(A, y);
}

/** Prédictions de la KRR aux points d'entraînement : Kα. */
export function krrFitted(alpha: number[], K: number[][]): number[] {
	const n = K.length;
	if (alpha.length !== n) {
		throw new Error(`krrFitted: longueurs inégales (α ${alpha.length}, K ${n}×?)`);
	}
	const fitted = new Array<number>(n);
	for (let i = 0; i < n; i++) {
		let s = 0;
		for (let j = 0; j < n; j++) s += K[i][j] * alpha[j];
		fitted[i] = s;
	}
	return fitted;
}

/**
 * Norme RKHS de la solution : ‖f⋆‖²_{H_K} = αᵀKα (leçon expert RKHS, E.6).
 * Toujours ≥ 0 si K est PSD ; mesure la « régularité » de f⋆ (l'énergie
 * spectrale Σ cᵢ²/λᵢ, bloc E.2 de la leçon).
 */
export function krrHilbertNormSq(alpha: number[], K: number[][]): number {
	const n = K.length;
	if (alpha.length !== n) {
		throw new Error(`krrHilbertNormSq: longueurs inégales (α ${alpha.length}, K ${n}×?)`);
	}
	let s = 0;
	for (let i = 0; i < n; i++) {
		let row = 0;
		for (let j = 0; j < n; j++) row += K[i][j] * alpha[j];
		s += alpha[i] * row;
	}
	return s;
}

/**
 * Objectif KRR en α : (1/n)‖y − Kα‖² + λαᵀKα (leçon expert RKHS, E.5).
 * Valeur minimale à la solution : λ·yᵀ(K + nλI)⁻¹y.
 */
export function krrObjective(
	alpha: number[],
	K: number[][],
	y: number[],
	lambda: number
): number {
	const n = K.length;
	if (alpha.length !== n || y.length !== n) {
		throw new Error('krrObjective: longueurs inégales (α, K, y)');
	}
	if (!(lambda > 0)) {
		throw new Error(`krrObjective: lambda doit être > 0 (reçu ${lambda})`);
	}
	let loss = 0;
	for (let i = 0; i < n; i++) {
		let fi = 0;
		for (let j = 0; j < n; j++) fi += K[i][j] * alpha[j];
		const r = y[i] - fi;
		loss += r * r;
	}
	return loss / n + lambda * krrHilbertNormSq(alpha, K);
}

/**
 * Prédiction de la KRR en un nouveau point x : f⋆(x) = Σᵢ αᵢ K(xᵢ, x)
 * (propriété reproduisante / astuce du noyau — coursClassif-4-SVM.tex).
 */
export function krrPredictAt(
	kernel: KernelFn,
	x: number[],
	X: number[][],
	alpha: number[]
): number {
	if (X.length !== alpha.length) {
		throw new Error(`krrPredictAt: longueurs inégales (X ${X.length}, α ${alpha.length})`);
	}
	let s = 0;
	for (let i = 0; i < X.length; i++) s += alpha[i] * kernel(X[i], x);
	return s;
}

/** Fonction cible fixe de la démo 1D : f⋆(t) = 2 sin(2πt) + ½ cos(4πt). */
export function krrTarget1D(t: number): number {
	return 2 * Math.sin(2 * Math.PI * t) + 0.5 * Math.cos(4 * Math.PI * t);
}

/**
 * Jeu de données 1D seedé pour la démo E.7 (leçon expert RKHS) :
 * xᵢ uniformes triés sur [0,1], yᵢ = f⋆(xᵢ) + 0.1·εᵢ, εᵢ ~ N(0,1)
 * (fonction cible krrTarget1D, bruit gaussien de σ = 0.1).
 *
 * Déterministe (mulberry32 + combineSeed) : même seed ⇒ même jeu.
 *
 * @throws si n < 2 ou n non entier.
 */
export function generateKrrDataset1D(
	n: number,
	seed: number
): { x: number[]; y: number[]; fStar: (t: number) => number } {
	if (!Number.isInteger(n) || n < 2) {
		throw new Error(`generateKrrDataset1D: n doit être un entier ≥ 2 (reçu ${n})`);
	}
	const rng = mulberry32(combineSeed(seed, 1));
	const x = Array.from({ length: n }, () => rng()).toSorted((a, b) => a - b);
	const noise: Gaussian = { mu: 0, sigma2: 0.01 };
	const rngN = mulberry32(combineSeed(seed, 2));
	const y = x.map((xi) => krrTarget1D(xi) + 0.1 * gaussianSample(noise, rngN));
	return { x, y, fStar: krrTarget1D };
}

/**
 * Matrice de Gram 1D d'une famille de noyaux à une entrée scalaire :
 * `gaussien` → exp(−(xᵢ−xⱼ)²/(2σ²)) (γ = 1/(2σ²), convention du cours),
 * `lineaire` → xᵢxⱼ.
 *
 * @throws si sigma ≤ 0 en mode gaussien.
 */
export function krrGram1D(
	x: number[],
	kind: 'gaussien' | 'lineaire',
	sigma = 0.15
): number[][] {
	if (x.length === 0) throw new Error('krrGram1D: x vide');
	if (kind === 'gaussien' && !(sigma > 0)) {
		throw new Error(`krrGram1D: sigma doit être > 0 (reçu ${sigma})`);
	}
	const kernel: KernelFn =
		kind === 'gaussien'
			? (a, b) => gaussianKernel(a, b, 1 / (2 * sigma * sigma))
			: (a, b) => linearKernel(a, b);
	const n = x.length;
	const K: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
	for (let i = 0; i < n; i++) {
		K[i][i] = kernel([x[i]], [x[i]]);
		for (let j = i + 1; j < n; j++) {
			const v = kernel([x[i]], [x[j]]);
			K[i][j] = v;
			K[j][i] = v;
		}
	}
	return K;
}
