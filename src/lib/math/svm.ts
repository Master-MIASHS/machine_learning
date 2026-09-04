/**
 * SVM (Support Vector Machines) utilities — marge rigide, marge souple, noyaux.
 *
 * Source pédagogique : Marine Demangeot, « Apprentissage supervisé et non
 * supervisé », M1 MIASHS, CM 4 — SVM (marine/Cours/CM/coursClassif-4-SVM.tex) :
 *  - Proposition « Formulation mathématique » : d(x, H) = |⟨w, x⟩ + b| / ‖w‖ ;
 *  - eq. optim2 : primale à marge rigide (min ½‖w‖² s.c. y_i(⟨w,x_i⟩+b) ≥ 1) ;
 *  - eq. optim3 : duale à marge rigide (max Σα_i − ½ΣΣ α_iα_j y_iy_j⟨x_i,x_j⟩,
 *    s.c. Σα_i y_i = 0, α_i ≥ 0) ;
 *  - eq. optim4 : primale à marge souple (min ½‖w‖² + C·Σξ_i, variables
 *    d'ajustement ξ_i ≥ 0) ;
 *  - eq. optim5 : duale à marge souple (0 ≤ α_i ≤ C) ;
 *  - eq. optim6 / optim6-bis : duale à noyau (produits scalaires remplacés
 *    par K(x_i, x_j)) et astuce du noyau ;
 *  - Définitions symétrique / semi-défini positif et Théorème de
 *    Moore–Aronszajn (existence de φ).
 */
import type { LabeledPoint2D } from './linear-classifier';
import { gaussianSample, type Gaussian } from './gaussian';
import { mulberry32, combineSeed } from './util';

/** Produit scalaire euclidien de deux vecteurs de même dimension. */
export function dot(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		throw new Error(`dot: dimensions incompatibles (${a.length} ≠ ${b.length})`);
	}
	let s = 0;
	for (let i = 0; i < a.length; i++) s += a[i] * b[i];
	return s;
}

/** Norme euclidienne. */
export function norm(a: number[]): number {
	return Math.sqrt(dot(a, a));
}

// ── Noyaux ─────────────────────────────────────────────────────────────────

/** Noyau applicable à deux observations (vectors de ℝ^d). */
export type KernelFn = (a: number[], b: number[]) => number;

/** Noyau linéaire K(x, x̃) = ⟨x, x̃⟩. */
export function linearKernel(a: number[], b: number[]): number {
	return dot(a, b);
}

/** Noyau polynomial K(x, x̃) = (⟨x, x̃⟩ + c)^d, c ∈ ℝ_+, d ∈ ℕ. */
export function polyKernel(a: number[], b: number[], degree: number, coef0 = 1): number {
	if (!Number.isInteger(degree) || degree < 1) {
		throw new Error(`polyKernel: degree doit être un entier ≥ 1 (reçu ${degree})`);
	}
	if (coef0 < 0) {
		throw new Error(`polyKernel: coef0 doit être ≥ 0 (reçu ${coef0})`);
	}
	return Math.pow(dot(a, b) + coef0, degree);
}

/**
 * Noyau gaussien K(x, x̃) = exp(−γ‖x − x̃‖²), γ = 1/(2σ²) — la forme
 * exp(−‖x−x̃‖²/(2σ²)) du cours.
 */
export function gaussianKernel(a: number[], b: number[], gamma: number): number {
	if (gamma <= 0) {
		throw new Error(`gaussianKernel: gamma doit être > 0 (reçu ${gamma})`);
	}
	const d = a.length - b.length;
	if (d !== 0) {
		throw new Error(`gaussianKernel: dimensions incompatibles (${a.length} ≠ ${b.length})`);
	}
	let s = 0;
	for (let i = 0; i < a.length; i++) {
		const dx = a[i] - b[i];
		s += dx * dx;
	}
	return Math.exp(-gamma * s);
}

/** Matrice de Gram M_{i,j} = K(x_i, x_j) (remarque du cours après Moore–Aronszajn). */
export function gramMatrix(points: number[][], kernel: KernelFn): number[][] {
	const n = points.length;
	const M: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
	for (let i = 0; i < n; i++) {
		M[i][i] = kernel(points[i], points[i]);
		for (let j = i + 1; j < n; j++) {
			const v = kernel(points[i], points[j]);
			M[i][j] = v;
			M[j][i] = v;
		}
	}
	return M;
}

// ── Géométrie de la marge ──────────────────────────────────────────────────

/**
 * Distance d'un point x à l'hyperplan ⟨w, ·⟩ + b = 0 (Proposition «
 * Formulation mathématique ») : d(x, H) = |⟨w, x⟩ + b| / ‖w‖.
 * Invariante par re-échelle (w, b) ↦ (kw, kb), k ≠ 0.
 */
export function pointToHyperplaneDistance(w: number[], b: number, x: number[]): number {
	const nw = norm(w);
	if (nw === 0) {
		throw new Error("pointToHyperplaneDistance: ‖w‖ = 0 — pas d'hyperplan défini");
	}
	return Math.abs(dot(w, x) + b) / nw;
}

/**
 * Marge γ d'un hyperplan séparateur sur un jeu d'apprentissage
 * (Définition « Marges et vecteurs de support ») : distance de l'hyperplan à
 * l'observation la plus proche, γ = min_i y_i(⟨w, x_i⟩ + b) / ‖w‖.
 * Négative si l'hyperplan fait des erreurs de classification.
 */
export function marginOfHyperplane(w: number[], b: number, points: LabeledPoint2D[]): number {
	if (points.length === 0) {
		throw new Error('marginOfHyperplane: jeu de données vide');
	}
	const nw = norm(w);
	if (nw === 0) {
		throw new Error("marginOfHyperplane: ‖w‖ = 0 — pas d'hyperplan défini");
	}
	let min = Infinity;
	for (const p of points) {
		const m = (p.label * (dot(w, [p.x1, p.x2]) + b)) / nw;
		if (m < min) min = m;
	}
	return min;
}

/** Marges fonctionnelles m_i = y_i(⟨w, x_i⟩ + b) (sans division par ‖w‖). */
export function functionalMargins(w: number[], b: number, points: LabeledPoint2D[]): number[] {
	return points.map((p) => p.label * (dot(w, [p.x1, p.x2]) + b));
}

/**
 * Variables d'ajustement (slack) ξ_i = max(0, 1 − y_i(⟨w, x_i⟩ + b))
 * (frame « Variable d'ajustement ξ_i ») : mesurent à quel point (x_i, y_i)
 * échoue à être bien séparé. Trois régimes : ξ_i = 0 (hors zone d'indécision),
 * 0 < ξ_i ≤ 1 (dans la zone d'indécision), ξ_i > 1 (mal classé).
 */
export function slackVariables(w: number[], b: number, points: LabeledPoint2D[]): number[] {
	return functionalMargins(w, b, points).map((m) => Math.max(0, 1 - m));
}

/**
 * Objectif primal à marge souple (eq. optim4) : ½‖w‖² + C·Σξ_i.
 */
export function hingeObjective(
	w: number[],
	b: number,
	points: LabeledPoint2D[],
	C: number
): number {
	if (C < 0) {
		throw new Error(`hingeObjective: C doit être ≥ 0 (reçu ${C})`);
	}
	let s = 0;
	for (const xi of slackVariables(w, b, points)) s += xi;
	return 0.5 * dot(w, w) + C * s;
}

// ── Solveur duale (SMO) ────────────────────────────────────────────────────

export interface SvmSolution {
	/** Multiplicateurs duaux α_i ≥ 0 (eq. optim3/optim5). */
	alphas: number[];
	/** Biais b̂ (moyenne des y_i − (Qα)_i sur les vecteurs de support). */
	b: number;
	/** Vecteur ŵ = Σ α_i y_i x_i — vide si le noyau n'est pas linéaire. */
	w: number[];
	/** Indices i avec α_i > tol (vecteurs de support). */
	supportIndices: number[];
	/** Indices i avec ξ_i > tol (outliers : zone d'indécision ou mal classés). */
	outlierIndices: number[];
	/** Indices i mal classés (marge fonctionnelle < 0). */
	misclassifiedIndices: number[];
	/** Marges fonctionnelles m_i = y_i(⟨ŵ, x_i⟩ + b̂). */
	margins: number[];
	/** Objectif dual f(α) = Σα_i − ½αᵀQα à la solution. */
	dualObjective: number;
}

export interface SvmOptions {
	/** Tolérance KKT (défaut 1e-4). */
	tol?: number;
	/** Nombre maximal de passes complètes (défaut 30). */
	maxPasses?: number;
	/** Plafond de sécurité sur le nombre de mises à jour de paires (défaut 20000). */
	maxIter?: number;
	/** Noyau K (défaut noyau linéaire). */
	kernel?: KernelFn;
	/** Tolérance pour considérer α_i nul (défaut 1e-6). */
	alphaTol?: number;
}

/**
 * Résout le problème dual SVM (eq. optim3 si C = +∞/très grand, eq. optim5
 * sinon) par SMO :
 *
 *   max_α  Σα_i − ½ Σ_i Σ_j α_i α_j y_i y_j K(x_i, x_j)
 *   s.c.   Σα_i y_i = 0,  0 ≤ α_i ≤ C.
 *
 * La contrainte d'écart complémentaire des conditions KKT donne alors les
 * vecteurs de support (α_i > 0 ⇒ m_i = 1 en marge rigide ; α_i = C pour les
 * outliers en marge souple). Déterministe : sélection de paires par premier
 * indice, aucun tirage aléatoire.
 */
export function solveSvmDual(
	points: LabeledPoint2D[],
	C: number,
	options?: SvmOptions
): SvmSolution {
	const n = points.length;
	if (n < 2) {
		throw new Error(`solveSvmDual: au moins 2 points requis (reçu ${n})`);
	}
	// Le dual est toujours faisable (α = 0) ; la contrainte Σα_i y_i = 0 est
	// conservée à chaque mise à jour de paire (α_i ← α_i − y_i y_j δ).
	if (!(C > 0)) {
		throw new Error(`solveSvmDual: C doit être > 0 (reçu ${C})`);
	}

	const tol = options?.tol ?? 1e-4;
	const maxPasses = options?.maxPasses ?? 30;
	const maxIter = options?.maxIter ?? 20000;
	const alphaTol = options?.alphaTol ?? 1e-6;
	const kernel = options?.kernel ?? linearKernel;

	const ys = points.map((p) => p.label);
	const xs = points.map((p) => [p.x1, p.x2]);

	// Matrice Q : Q_{i,j} = y_i y_j K(x_i, x_j).
	const Q: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
	for (let i = 0; i < n; i++) {
		Q[i][i] = ys[i] * ys[i] * kernel(xs[i], xs[i]);
		for (let j = i + 1; j < n; j++) {
			const v = ys[i] * ys[j] * kernel(xs[i], xs[j]);
			Q[i][j] = v;
			Q[j][i] = v;
		}
	}

	// ÉTAT : α, (Qα), et b. On note f_i = (Qα)_i / y_i + b la sortie du
	// modèle en x_i, et E_i = y_i f_i − 1 = (Qα)_i − y_i b − 1.
	// Conditions KKT du dual : α_i ∈ (0,C) ⇒ E_i = 0 ; α_i = 0 ⇒ E_i ≥ 0 ;
	// α_i = C ⇒ E_i ≤ 0.
	const alpha = new Array<number>(n).fill(0);
	const qAlpha = new Array<number>(n).fill(0);
	let b = 0;

	// b_i cohérent avec KKT pour un vecteur de support : y_i f_i = 1
	// ⟺ b = y_i (1 − (Qα)_i).
	const bFromI = (i: number): number => ys[i] * (1 - qAlpha[i]);

	let iter = 0;
	for (let pass = 0; pass < maxPasses && iter < maxIter; pass++) {
		let worked = 0;
		for (let i = 0; i < n && iter < maxIter; i++) {
			const yi = ys[i];
			const ai = alpha[i];
			const Ei = qAlpha[i] + yi * b - 1;
			// Violation KKT de i : αi ∈ (0,C) ⇒ Ei = 0 ; αi = 0 ⇒ Ei ≥ 0 ;
			// αi = C ⇒ Ei ≤ 0.
			let viol = 0;
			if (Ei < -tol && ai < C - alphaTol) viol = -Ei;
			else if (Ei > tol && ai > alphaTol) viol = Ei;
			if (viol <= tol) continue;

			// Sélection de j (SMO) : le plus grand |Δα_j| APRÈS application
			// des bornes 0 ≤ α ≤ C — une paire dont l'étape non bornée est
			// grande mais clampée à 0 (parce que α_j est déjà à C) est
			// inutile et doit être écartée au profit d'un autre j.
			let j = -1;
			let best = 0;
			for (let k = 0; k < n; k++) {
				if (k === i) continue;
				const yj = ys[k];
				const aj = alpha[k];
				const L = Q[i][i] + Q[k][k] - 2 * Q[i][k] * yi * yj;
				if (L <= 1e-12) continue; // direction plate
				const Ek = qAlpha[k] + yj * b - 1;
				let d = (yi * yj * Ei - Ek) / L;
				if (yi === yj) {
					// α_i ← α_i − d, α_j ← α_j + d
					d = Math.max(Math.max(ai - C, -aj), Math.min(Math.min(ai, C - aj), d));
				} else {
					// α_i ← α_i + d, α_j ← α_j + d
					d = Math.max(Math.max(-ai, -aj), Math.min(Math.min(C - ai, C - aj), d));
				}
				const ad = Math.abs(d);
				if (ad > best) {
					best = ad;
					j = k;
				}
			}
			if (j < 0 || best <= 1e-12) continue; // pas de paire utile pour i

			const yj = ys[j];
			const L = Q[i][i] + Q[j][j] - 2 * Q[i][j] * yi * yj;
			let delta = (yi * yj * Ei - (qAlpha[j] + yj * b - 1)) / L;
			if (yi === yj) {
				delta = Math.max(Math.max(ai - C, -alpha[j]), Math.min(Math.min(ai, C - alpha[j]), delta));
			} else {
				delta = Math.max(Math.max(-ai, -alpha[j]), Math.min(Math.min(C - ai, C - alpha[j]), delta));
			}

			const dAi = -yi * yj * delta;
			alpha[i] += dAi;
			alpha[j] += delta;
			for (let k = 0; k < n; k++) {
				qAlpha[k] += Q[k][i] * dAi + Q[k][j] * delta;
			}
			// Mise à jour de b à partir des points intérieurs de la paire.
			const bi = alpha[i] > alphaTol && alpha[i] < C - alphaTol ? bFromI(i) : null;
			const bj = alpha[j] > alphaTol && alpha[j] < C - alphaTol ? bFromI(j) : null;
			if (bi !== null && bj !== null) b = (bi + bj) / 2;
			else if (bi !== null) b = bi;
			else if (bj !== null) b = bj;

			worked++;
			iter++;
		}
		if (worked === 0) break; // KKT satisfait à tol près (ou stagnation)
	}

	// b̂ : moyenne de y_i(1 − (Qα)_i) sur les vecteurs de support intérieurs
	// (0 < α_i < C) ; à défaut, sur tous les vecteurs de support (le cours
	// note qu'en l'absence de point intérieur on peut prendre toute valeur
	// d'un intervalle — on choisit ici la moyenne, déterministe).
	const interior: number[] = [];
	const support: number[] = [];
	for (let i = 0; i < n; i++) {
		if (alpha[i] > alphaTol) support.push(i);
		if (alpha[i] > alphaTol && alpha[i] < C - alphaTol) interior.push(i);
	}
	const bSet = interior.length > 0 ? interior : support;
	b = 0;
	if (bSet.length > 0) {
		for (const i of bSet) b += bFromI(i);
		b /= bSet.length;
	}

	// ŵ explicite : n'a de sens que pour le noyau linéaire (Σα_i y_i x_i vit
	// dans l'espace d'entrée). Pour un noyau non linéaire, il n'existe pas de
	// vecteur de poids fini dans cet espace — on renvoie [] pour éviter
	// qu'un appelant l'utilise par erreur comme frontière de décision.
	const dim = xs[0].length;
	const w = new Array<number>(dim).fill(0);
	if (kernel === linearKernel) {
		for (let i = 0; i < n; i++) {
			const a = alpha[i];
			if (a <= alphaTol) continue;
			for (let d = 0; d < dim; d++) w[d] += a * ys[i] * xs[i][d];
		}
	}

	// Marges fonctionnelles m_i = y_i f_i = (Qα)_i + y_i b.
	const margins = new Array<number>(n);
	for (let i = 0; i < n; i++) {
		margins[i] = qAlpha[i] + ys[i] * b;
	}

	const outlierIndices: number[] = [];
	const misclassifiedIndices: number[] = [];
	for (let i = 0; i < n; i++) {
		if (1 - margins[i] > alphaTol * 10) outlierIndices.push(i);
		if (margins[i] < 0) misclassifiedIndices.push(i);
	}

	let dualObjective = 0;
	for (let i = 0; i < n; i++) dualObjective += alpha[i];
	for (let i = 0; i < n; i++)
		for (let j = 0; j < n; j++) dualObjective -= 0.5 * alpha[i] * alpha[j] * Q[i][j];

	return {
		alphas: alpha,
		b,
		w,
		supportIndices: support,
		outlierIndices,
		misclassifiedIndices,
		margins,
		dualObjective
	};
}

/**
 * Fonction de décision f(x) = sign[Σ α_i y_i K(x_i, x) + b̂] (classifieur SVM
 * à marge souple / à noyau) — retourne le score signé avant le sign.
 */
export function makeDecisionFunction(
	alphas: number[],
	points: LabeledPoint2D[],
	b: number,
	kernel: KernelFn = linearKernel
): (x: number[]) => number {
	return (x: number[]): number => {
		let s = b;
		for (let i = 0; i < points.length; i++) {
			const a = alphas[i];
			if (a <= 1e-9) continue;
			s += a * points[i].label * kernel([points[i].x1, points[i].x2], x);
		}
		return s;
	};
}

// ── Valeurs propres (vérification PSD / Moore–Aronszajn) ───────────────────

/**
 * Plus petite valeur propre d'une matrice symétrique (n ≤ ~30) par
 * rotations de Jacobi cycliques. Tolérance ~1e-12 sur la somme des carrés
 * hors diagonale ; précision typique 1e-8 en valeur propre.
 */
export function minEigenvalueSymmetric(M: number[][]): number {
	const n = M.length;
	if (n === 0) throw new Error('minEigenvalueSymmetric: matrice vide');
	for (let i = 0; i < n; i++) {
		if (M[i].length !== n) throw new Error(`minEigenvalueSymmetric: matrice non carrée (${n}×?)`);
	}
	const A = M.map((row) => row.slice());

	const tol = 1e-12;
	for (let sweep = 0; sweep < 100; sweep++) {
		// Somme des carrés des éléments hors diagonale.
		let off = 0;
		for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
		if (off < tol) break;
		for (let p = 0; p < n - 1; p++) {
			for (let q = p + 1; q < n; q++) {
				const apq = A[p][q];
				if (Math.abs(apq) < 1e-300) continue;
				const app = A[p][p];
				const aqq = A[q][q];
				const tau = (aqq - app) / (2 * apq);
				// t = 1/(τ + √(1+τ²)) si τ ≥ 0, sinon −1/(|τ| + √(1+τ²)) —
				// Math.sign(0) = 0 ferait sauter la rotation à 45° quand app = aqq.
				const t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
				const c = 1 / Math.sqrt(1 + t * t);
				const s = t * c;
				// A ← Jᵀ A J : les lignes/colonnes hors bloc se mettent à jour
				// ensemble (matrice symétrique), le bloc 2×2 explicitement.
				for (let k = 0; k < n; k++) {
					if (k === p || k === q) continue;
					const akp = A[k][p];
					const akq = A[k][q];
					A[k][p] = c * akp - s * akq;
					A[p][k] = A[k][p];
					A[k][q] = s * akp + c * akq;
					A[q][k] = A[k][q];
				}
				const npp = c * c * app - 2 * s * c * apq + s * s * aqq;
				const nqq = s * s * app + 2 * s * c * apq + c * c * aqq;
				A[p][p] = npp;
				A[q][q] = nqq;
				A[p][q] = 0;
				A[q][p] = 0;
			}
		}
	}
	let min = Infinity;
	for (let i = 0; i < n; i++) if (A[i][i] < min) min = A[i][i];
	return min;
}

// ── Courbe de niveau (frontière de décision des démos à noyau) ─────────────

export interface ContourSegment {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/**
 * Segments de la courbe de niveau {f = level} par marching squares sur une
 * grille régulière (même algorithme que ContourPlot.svelte, segment par
 * cellule). Cas ambigus 5/10 désambiguïsés par la moyenne de la cellule.
 */
export function zeroContourSegments(
	f: (x: number, y: number) => number,
	domain: [[number, number], [number, number]],
	res = 60,
	level = 0
): ContourSegment[] {
	if (res < 2) throw new Error(`zeroContourSegments: res doit être ≥ 2 (reçu ${res})`);
	const [xMin, xMax] = domain[0];
	const [yMin, yMax] = domain[1];
	const grid: number[][] = [];
	for (let j = 0; j < res; j++) {
		const y = yMax - (j / (res - 1)) * (yMax - yMin);
		const row: number[] = [];
		for (let i = 0; i < res; i++) {
			const x = xMin + (i / (res - 1)) * (xMax - xMin);
			row.push(f(x, y));
		}
		grid.push(row);
	}

	const segments: ContourSegment[] = [];
	const xAt = (i: number) => xMin + (i / (res - 1)) * (xMax - xMin);
	const yAt = (j: number) => yMax - (j / (res - 1)) * (yMax - yMin);

	for (let j = 0; j < res - 1; j++) {
		for (let i = 0; i < res - 1; i++) {
			const tl = grid[j][i];
			const tr = grid[j][i + 1];
			const bl = grid[j + 1][i];
			const br = grid[j + 1][i + 1];
			const above = (v: number) => v > level;
			const code =
				(above(tl) ? 8 : 0) | (above(tr) ? 4 : 0) | (above(br) ? 2 : 0) | (above(bl) ? 1 : 0);
			if (code === 0 || code === 15) continue;

			const x0 = xAt(i);
			const x1 = xAt(i + 1);
			const y0 = yAt(j);
			const y1 = yAt(j + 1);
			const lerp = (ax: number, bx: number, ay: number, by: number, va: number, vb: number) => ({
				x: ax + ((level - va) / (vb - va || 1e-9)) * (bx - ax),
				y: ay + ((level - va) / (vb - va || 1e-9)) * (by - ay)
			});
			// Points des 4 côtés : top, right, bottom, left.
			const top = lerp(x0, x1, y0, y0, tl, tr);
			const right = lerp(x1, x1, y0, y1, tr, br);
			const bottom = lerp(x0, x1, y1, y1, bl, br);
			const left = lerp(x0, x0, y0, y1, tl, bl);
			const seg = (a: { x: number; y: number }, b2: { x: number; y: number }) =>
				segments.push({ x1: a.x, y1: a.y, x2: b2.x, y2: b2.y });

			switch (code) {
				case 1:
					seg(left, bottom);
					break;
				case 2:
					seg(bottom, right);
					break;
				case 3:
					seg(left, right);
					break;
				case 4:
					seg(top, right);
					break;
				case 5: {
					// Ambigu : la moyenne de la cellule tranche.
					if ((tl + tr + bl + br) / 4 > level) {
						seg(left, top);
						seg(bottom, right);
					} else {
						seg(top, right);
						seg(left, bottom);
					}
					break;
				}
				case 6:
					seg(top, bottom);
					break;
				case 7:
					seg(left, top);
					break;
				case 8:
					seg(left, top);
					break;
				case 9:
					seg(top, bottom);
					break;
				case 10: {
					if ((tl + tr + bl + br) / 4 > level) {
						seg(top, left);
						seg(right, bottom);
					} else {
						seg(left, bottom);
						seg(top, right);
					}
					break;
				}
				case 11:
					seg(top, right);
					break;
				case 12:
					seg(left, right);
					break;
				case 13:
					seg(bottom, right);
					break;
				case 14:
					seg(left, bottom);
					break;
			}
		}
	}
	return segments;
}

// ── Générateurs de données 2D (déterministes) ──────────────────────────────

/**
 * Deux blobs gaussiens 2D « bruités » dans le style du TP5 : classe +1 ~
 * N((0,0), σ²I), classe −1 ~ N((gap,gap), σ²I). gap = 0 → classes
 * indissociables ; grand gap → quasi séparables.
 */
export function generateNoisyClasses2D(
	nPerClass: number,
	gap = 3,
	sigma = 1,
	seed = 1050
): LabeledPoint2D[] {
	if (nPerClass <= 0) {
		throw new Error(`generateNoisyClasses2D: nPerClass doit être > 0 (reçu ${nPerClass})`);
	}
	if (!(sigma > 0)) {
		throw new Error(`generateNoisyClasses2D: sigma doit être > 0 (reçu ${sigma})`);
	}
	const g: Gaussian = { mu: 0, sigma2: sigma * sigma };
	const rngP1 = mulberry32(combineSeed(seed, 1));
	const rngP2 = mulberry32(combineSeed(seed, 2));
	const rngN1 = mulberry32(combineSeed(seed, -1));
	const rngN2 = mulberry32(combineSeed(seed, -2));
	const points: LabeledPoint2D[] = [];
	for (let i = 0; i < nPerClass; i++) {
		points.push({ x1: gaussianSample(g, rngP1), x2: gaussianSample(g, rngP2), label: 1 });
	}
	for (let i = 0; i < nPerClass; i++) {
		points.push({
			x1: gap + gaussianSample(g, rngN1),
			x2: gap + gaussianSample(g, rngN2),
			label: -1
		});
	}
	return points;
}

/**
 * Anneau : classe +1 = blob central (rayon rInner), classe −1 = anneau
 * (rayons [rInner, rOuter]) — non séparable linéairement, mais séparable
 * par le noyau gaussien ou le mapping (x₁², x₂²).
 */
export function generateRingData(
	nInner: number,
	nOuter: number,
	rInner = 1,
	rOuter = 2.6,
	seed = 7
): LabeledPoint2D[] {
	if (nInner <= 0 || nOuter <= 0) {
		throw new Error('generateRingData: nInner et nOuter doivent être > 0');
	}
	if (rOuter <= rInner) {
		throw new Error(`generateRingData: rOuter doit dépasser rInner (${rOuter} ≤ ${rInner})`);
	}
	const rngIn = mulberry32(combineSeed(seed, 1));
	const rngOut = mulberry32(combineSeed(seed, 2));
	const points: LabeledPoint2D[] = [];
	for (let i = 0; i < nInner; i++) {
		// Rayon et angle tirés ensemble (uniforme dans le disque de rayon rInner).
		const r = rInner * Math.sqrt(rngIn());
		const a = 2 * Math.PI * rngIn();
		points.push({ x1: r * Math.cos(a), x2: r * Math.sin(a), label: 1 });
	}
	for (let i = 0; i < nOuter; i++) {
		const r = Math.sqrt(rInner * rInner + rngOut() * (rOuter * rOuter - rInner * rInner));
		const a = 2 * Math.PI * rngOut();
		points.push({ x1: r * Math.cos(a), x2: r * Math.sin(a), label: -1 });
	}
	return points;
}

/**
 * XOR : quatre blobs gaussiens dans les quadrants ; classe +1 sur les
 * quadrants (++, −−), classe −1 sur (+−, −+) — non séparable linéairement,
 * séparable par le noyau gaussien ou polynomial.
 */
export function generateXorData(nPerQuadrant: number, spread = 1.2, seed = 11): LabeledPoint2D[] {
	if (nPerQuadrant <= 0) {
		throw new Error(`generateXorData: nPerQuadrant doit être > 0 (reçu ${nPerQuadrant})`);
	}
	const g: Gaussian = { mu: 0, sigma2: 0.3 * 0.3 };
	const rngs = [1, 2, 3, 4].map((k) => mulberry32(combineSeed(seed, k)));
	// Quadrants : (1,1)→+1, (1,−1)→−1, (−1,1)→−1, (−1,−1)→+1.
	const quads: [number, number, 1 | -1][] = [
		[1, 1, 1],
		[1, -1, -1],
		[-1, 1, -1],
		[-1, -1, 1]
	];
	const points: LabeledPoint2D[] = [];
	quads.forEach(([sx, sy, label], qi) => {
		const r = rngs[qi];
		for (let i = 0; i < nPerQuadrant; i++) {
			points.push({
				x1: sx * spread + gaussianSample(g, r),
				x2: sy * spread + gaussianSample(g, r),
				label
			});
		}
	});
	return points;
}
