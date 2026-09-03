/**
 * Linear classifier (classifieur linéaire) utilities.
 *
 * Source pédagogique : Marine Demangeot, « Apprentissage supervisé et non
 * supervisé », M1 MIASHS, CM 2 — Classifieurs linéaires & régression
 * logistique (marine/Cours/CM/coursClassif-2RegLogistique.tex). Le classifieur
 * est la composée φ ∘ h_{w,b} avec h_{w,b}(x) = ⟨w,x⟩ + b (ensemble L_d des
 * fonctions affines, définition des classes d'hypothèse H_φ dans les diapos).
 */
import { gaussianSample, type Gaussian } from './gaussian';
import { mulberry32, combineSeed } from './util';

/** Un point 2D étiqueté ±1, pour la démo LinearClassifierExplorer. */
export interface LabeledPoint2D {
	x1: number;
	x2: number;
	label: 1 | -1;
}

/**
 * Score affine h_{w,b}(x) = ⟨w, x⟩ + b.
 */
export function affineScore(w: number[], b: number, x: number[]): number {
	if (w.length !== x.length) {
		throw new Error(`affineScore: dimensions incompatibles (w ${w.length}, x ${x.length})`);
	}
	let s = b;
	for (let i = 0; i < w.length; i++) s += w[i] * x[i];
	return s;
}

/**
 * Classifieur des demi-espaces : h(x) = sign(⟨w,x⟩ + b), avec la convention
 * pédagogique sign(0) = +1 (le point sur l'hyperplan est rattaché à la classe
 * +1 — choix arbitraire, à documenter dans la leçon).
 */
export function halfSpaceDecision(w: number[], b: number, x: number[]): 1 | -1 {
	return affineScore(w, b, x) >= 0 ? 1 : -1;
}

/**
 * Sortie de la régression logistique : φ_sig(z) = 1 / (1 + e^{-z}) avec
 * z = ⟨w,x⟩ + b. Interprétation : probabilité prédite de l'étiquette +1.
 */
export function logisticProbability(w: number[], b: number, x: number[]): number {
	const z = affineScore(w, b, x);
	if (z >= 0) {
		const e = Math.exp(-z);
		return 1 / (1 + e);
	}
	const e = Math.exp(z);
	return e / (1 + e);
}

/**
 * Équation de la droite de décision w1·x + w2·y + b = 0 en forme pente/ordonnée
 * : y = (−w1/w2)·x − b/w2 (remarque de la diapo « Classifieur linéaire -
 * formulation »). Retourne null si w2 = 0 (droite verticale x = −b/w1 —
 * à traiter séparément dans le composant).
 */
export function decisionBoundaryLine(
	w: [number, number],
	b: number
): { slope: number; intercept: number } | null {
	const [w1, w2] = w;
	if (w2 === 0) return null;
	const slope = -w1 / w2;
	const intercept = -b / w2;
	// −0 est normalisé en 0 (b = 0 donnerait sinon une ordonnée « −0 »)
	return { slope, intercept: intercept === 0 ? 0 : intercept };
}

/**
 * Deux blobs gaussiens 2D étiquetés ±1 :
 *   classe +1 ~ N( (s/2, s/2), I ),  classe −1 ~ N( (−s/2, −s/2), I )
 * separation = 0 → les deux lois coïncident (aucune séparation) ;
 * separation grand → classes quasi parfaitement séparables par la droite
 * x1 + x2 = 0 (médiatrice des deux centres).
 * Déterministe : PRNG mulberry32 de util.ts, seeds décorrélées par combineSeed.
 */
export function generateSeparableClasses2D(
	nPerClass: number,
	separation: number,
	seed = 42
): LabeledPoint2D[] {
	if (nPerClass <= 0) {
		throw new Error(`generateSeparableClasses2D: nPerClass doit être > 0 (reçu ${nPerClass})`);
	}
	if (typeof separation !== 'number' || Number.isNaN(separation)) {
		throw new Error('generateSeparableClasses2D: separation doit être un nombre');
	}

	// Un PRNG par (classe, coordonnée) pour des coordonnées indépendantes,
	// seeds décorrélées par combineSeed.
	const rngP1 = mulberry32(combineSeed(seed, 1));
	const rngP2 = mulberry32(combineSeed(seed, 2));
	const rngN1 = mulberry32(combineSeed(seed, -1));
	const rngN2 = mulberry32(combineSeed(seed, -2));
	const half = separation / 2;
	const g: Gaussian = { mu: 0, sigma2: 2 };

	const points: LabeledPoint2D[] = [];
	for (let i = 0; i < nPerClass; i++) {
		points.push({
			x1: half + gaussianSample(g, rngP1),
			x2: half + gaussianSample(g, rngP2),
			label: 1
		});
	}
	for (let i = 0; i < nPerClass; i++) {
		points.push({
			x1: -half + gaussianSample(g, rngN1),
			x2: -half + gaussianSample(g, rngN2),
			label: -1
		});
	}
	return points;
}
