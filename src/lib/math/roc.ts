/**
 * ROC curve / AUC utilities for the "Évaluer un modèle avec l'AUC" section of
 * part2/lesson2 (Marine's course, chapitre 2 — régression logistique).
 *
 * Convention: a score is turned into a binary prediction by
 * "predict positive if score >= threshold" (seuil α on la sortie du modèle).
 *
 * The sigmoid is exported here (a private copy already lives in
 * calibration.ts — prior debt, not a pattern to continue; new modules import
 * it from here).
 */
import { gaussianSample, type Gaussian } from './gaussian';
import { mulberry32, combineSeed } from './util';

/** Sigmoid σ(t) = 1 / (1 + e^{-t}). */
export function sigmoid(t: number): number {
	if (t >= 0) {
		const e = Math.exp(-t);
		return 1 / (1 + e);
	}
	const e = Math.exp(t);
	return e / (1 + e);
}

/** A single (FPR, TPR, threshold) point of a ROC curve. */
export interface RocPoint {
	fpr: number;
	tpr: number;
	threshold: number;
}

function assertAligned(scores: number[], labels: (0 | 1)[]): void {
	if (scores.length === 0) {
		throw new Error('roc: au moins une observation est requise (scores.length = 0)');
	}
	if (scores.length !== labels.length) {
		throw new Error(
			`roc: scores.length (${scores.length}) !== labels.length (${labels.length})`
		);
	}
	for (let i = 0; i < labels.length; i++) {
		if (labels[i] !== 0 && labels[i] !== 1) {
			throw new Error(`roc: label invalide ${labels[i]} à l'index ${i} (attendu 0 ou 1)`);
		}
	}
}

/**
 * TPR (sensibilité) et FPR (1 − spécificité) obtenus en prédisant « positif »
 * dès que score >= threshold.
 *
 * Lève une erreur s'il n'y a aucun positif ou aucun négatif dans les labels
 * (les taux sont alors inconnus).
 */
export function rocPoint(
	scores: number[],
	labels: (0 | 1)[],
	threshold: number
): { fpr: number; tpr: number } {
	assertAligned(scores, labels);
	let pos = 0;
	let neg = 0;
	for (const y of labels) {
		if (y === 1) pos++;
		else neg++;
	}
	if (pos === 0) throw new Error('roc: aucun label positif — TPR indéfini');
	if (neg === 0) throw new Error('roc: aucun label négatif — FPR indéfini');

	let tp = 0;
	let fp = 0;
	for (let i = 0; i < scores.length; i++) {
		const pred = scores[i] >= threshold ? 1 : 0;
		if (pred === 1 && labels[i] === 1) tp++;
		if (pred === 1 && labels[i] === 0) fp++;
	}
	return { fpr: fp / neg, tpr: tp / pos };
}

/**
 * Courbe ROC complète : on fait varier le seuil de +∞ (aucun positif prédit,
 * point (0,0)) à -∞ (tout est prédit positif, point (1,1)), en ne retenant
 * que les seuils distincts présents dans `scores` (entre deux seuils consécutifs
 * le point ROC ne change pas).
 *
 * Résultat trié par FPR croissant, débutant en (0,0) et finissant en (1,1).
 */
export function rocCurve(scores: number[], labels: (0 | 1)[]): RocPoint[] {
	assertAligned(scores, labels);

	const points: RocPoint[] = [{ fpr: 0, tpr: 0, threshold: Number.POSITIVE_INFINITY }];
	const thresholds = [...new Set(scores)].sort((a, b) => b - a);
	for (const threshold of thresholds) {
		points.push({ threshold, ...rocPoint(scores, labels, threshold) });
	}
	points.push({ fpr: 1, tpr: 1, threshold: Number.NEGATIVE_INFINITY });
	return points;
}

/**
 * AUC de la courbe ROC par la méthode des trapèzes, sur des points triés par
 * FPR croissant (sortie de `rocCurve`).
 *
 * Cas parfaits : (0,0)→(0,1)→(1,1) donne 1 ; la diagonale (0,0)→(1,1) donne 0.5.
 */
export function aucTrapezoidal(points: { fpr: number; tpr: number }[]): number {
	if (points.length < 2) {
		throw new Error('roc: au moins deux points sont requis pour calculer l\'AUC');
	}
	let auc = 0;
	for (let i = 1; i < points.length; i++) {
		const dx = points[i].fpr - points[i - 1].fpr;
		const avgH = (points[i].tpr + points[i - 1].tpr) / 2;
		auc += dx * avgH;
	}
	return auc;
}

/**
 * Échantillon de scores synthétiques à deux classes, pour la démo ROC :
 * classe 0 ~ N(0, 1), classe 1 ~ N(separation, 1).
 *
 * separation = 0 → les deux lois coïncident (classifieur aléatoire, AUC ≈ 0.5) ;
 * separation grand → les classes sont (quasi) parfaitement séparées (AUC ≈ 1).
 * Déterministe : PRNG mulberry32 de util.ts, seeds décorrélées par combineSeed.
 */
export function generateScoreSamples(
	nPerClass: number,
	separation: number,
	seed = 42
): { scores: number[]; labels: (0 | 1)[] } {
	if (nPerClass <= 0) {
		throw new Error(`generateScoreSamples: nPerClass doit être > 0 (reçu ${nPerClass})`);
	}
	if (typeof separation !== 'number' || Number.isNaN(separation)) {
		throw new Error('generateScoreSamples: separation doit être un nombre');
	}
	const rng0 = mulberry32(combineSeed(seed, 0));
	const rng1 = mulberry32(combineSeed(seed, 1));
	const g0: Gaussian = { mu: 0, sigma2: 1 };
	const g1: Gaussian = { mu: separation, sigma2: 1 };

	const scores: number[] = [];
	const labels: (0 | 1)[] = [];
	for (let i = 0; i < nPerClass; i++) {
		scores.push(gaussianSample(g0, rng0));
		labels.push(0);
	}
	for (let i = 0; i < nPerClass; i++) {
		scores.push(gaussianSample(g1, rng1));
		labels.push(1);
	}
	return { scores, labels };
}
