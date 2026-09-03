// src/lib/math/metrics.ts
//
// Part II, lesson 1 — « Évaluer un modèle »
// Reference: marine/Cours/CM/coursClassif-1-Intro.tex, frames
// « Les métriques — classification binaire », « Les métriques —
// classification multiclasse » (matrice de confusion, accuracy, sensibilité,
// précision, F1-score, spécificité, macro/weighted/micro-average, exercice).
//
// Binary convention: pairs are [trueLabel, predLabel] with labels 0|1. The
// confusion matrix follows the slide layout — rows = classe prédite, columns
// = classe réelle — so TN = (0,0), FN = (1,0), FP = (0,1), TP = (1,1).
//
// Multiclass convention: M[i][j] = nombre d'exemples de la classe i (réelle)
// pour lesquels l'étiquette j a été prédite — the slide's M_{i,j} (rows =
// true class, columns = predicted class, the transpose of the binary layout).

export interface BinaryConfusion {
	tn: number;
	fp: number;
	fn: number;
	tp: number;
}

function assertCount(value: number, name: string): void {
	if (!Number.isInteger(value) || value < 0) {
		throw new Error(`${name} must be a non-negative integer, got ${value}`);
	}
}

function assertRate(value: number, name: string): void {
	if (!Number.isFinite(value) || value < 0 || value > 1) {
		throw new Error(`${name} must be a finite number in [0, 1], got ${value}`);
	}
}

function assertBinaryConfusion(cm: BinaryConfusion): void {
	assertCount(cm.tn, 'tn');
	assertCount(cm.fp, 'fp');
	assertCount(cm.fn, 'fn');
	assertCount(cm.tp, 'tp');
}

/**
 * Confusion matrix from (true, predicted) pairs. Slide layout: TN = (0,0),
 * FN = (1,0) « exemples positifs étiquetés négatifs », FP = (0,1), TP = (1,1).
 */
export function confusionMatrix(
	pairs: ReadonlyArray<readonly [0 | 1, 0 | 1]>
): BinaryConfusion {
	const cm: BinaryConfusion = { tn: 0, fp: 0, fn: 0, tp: 0 };
	for (const pair of pairs) {
		const [y, yh] = pair;
		if ((y !== 0 && y !== 1) || (yh !== 0 && yh !== 1)) {
			throw new Error(`binary labels must be 0 or 1, got [${y}, ${yh}]`);
		}
		if (y === 0 && yh === 0) cm.tn += 1;
		else if (y === 1 && yh === 0) cm.fn += 1;
		else if (y === 0 && yh === 1) cm.fp += 1;
		else cm.tp += 1;
	}
	return cm;
}

/**
 * Confusion matrix implied by class counts and two rates:
 * TP = round(sensitivity · nPos), FN = nPos − TP, TN = round(specificity · nNeg),
 * FP = nNeg − TN. This is the slider→matrix bridge used by
 * ConfusionMatrixMetricsDemo.svelte; the rounding is part of the contract so
 * the demo can keep it out of the component.
 */
export function confusionFromRates(
	nPos: number,
	nNeg: number,
	sensitivity: number,
	specificity: number
): BinaryConfusion {
	if (!Number.isInteger(nPos) || nPos <= 0) {
		throw new Error(`nPos must be a positive integer, got ${nPos}`);
	}
	if (!Number.isInteger(nNeg) || nNeg <= 0) {
		throw new Error(`nNeg must be a positive integer, got ${nNeg}`);
	}
	assertRate(sensitivity, 'sensitivity');
	assertRate(specificity, 'specificity');
	const tp = Math.round(sensitivity * nPos);
	const tn = Math.round(specificity * nNeg);
	return { tn, fp: nNeg - tn, fn: nPos - tp, tp };
}

/** « Accuracy — proportion d'exemples bien classés » : (TP+TN)/total. */
export function accuracy(cm: BinaryConfusion): number {
	assertBinaryConfusion(cm);
	const total = cm.tn + cm.fp + cm.fn + cm.tp;
	if (total === 0) throw new Error('accuracy is undefined for an empty confusion matrix');
	return (cm.tp + cm.tn) / total;
}

/** « Précision — proportion de prédictions correctes parmi les prédictions positives » : TP/(TP+FP). */
export function precision(cm: BinaryConfusion): number {
	assertBinaryConfusion(cm);
	const denom = cm.tp + cm.fp;
	if (denom === 0) {
		throw new Error('precision is undefined: no positive predictions (TP+FP = 0)');
	}
	return cm.tp / denom;
}

/** « Rappel ou sensibilité — proportion d'exemples positifs correctement classés » : TP/(TP+FN). */
export function recall(cm: BinaryConfusion): number {
	assertBinaryConfusion(cm);
	const denom = cm.tp + cm.fn;
	if (denom === 0) {
		throw new Error('recall is undefined: no true positives in the data (TP+FN = 0)');
	}
	return cm.tp / denom;
}

/** « Spécificité — proportion d'exemples négatifs correctement classés » : TN/(TN+FP). */
export function specificity(cm: BinaryConfusion): number {
	assertBinaryConfusion(cm);
	const denom = cm.tn + cm.fp;
	if (denom === 0) {
		throw new Error('specificity is undefined: no true negatives in the data (TN+FP = 0)');
	}
	return cm.tn / denom;
}

/**
 * « F-mesure ou F1-score — moyenne harmonique de la précision et du rappel » :
 * F1 = 2·Précision·Rappel/(Précision+Rappel) = 2TP/(2TP+FP+FN).
 */
export function f1(cm: BinaryConfusion): number {
	assertBinaryConfusion(cm);
	const denom = 2 * cm.tp + cm.fp + cm.fn;
	if (denom === 0) throw new Error('F1 is undefined: 2TP+FP+FN = 0');
	return (2 * cm.tp) / denom;
}

// ---------------------------------------------------------------------------
// Multiclass — OVA (One Versus All)
//
// « On peut calculer les métriques précédentes pour chaque classe i en
// considérant que les autres classes forment une seule et même classe (stratégie
// One Versus All). On combine ensuite les métriques m_i de chaque classe pour
// obtenir un score global » (macro / weight / micro-average).
// ---------------------------------------------------------------------------

/**
 * C×C confusion matrix M with M[i][j] = number of examples of true class i
 * predicted as j. C is inferred as (max label + 1).
 */
export function multiclassConfusion(
	pairs: ReadonlyArray<readonly [number, number]>
): number[][] {
	let c = 0;
	for (const [y, yh] of pairs) {
		if (!Number.isInteger(y) || y < 0) {
			throw new Error(`true label must be a non-negative integer, got ${y}`);
		}
		if (!Number.isInteger(yh) || yh < 0) {
			throw new Error(`predicted label must be a non-negative integer, got ${yh}`);
		}
		c = Math.max(c, y + 1, yh + 1);
	}
	const m: number[][] = Array.from({ length: c }, () => new Array(c).fill(0));
	for (const [y, yh] of pairs) m[y][yh] += 1;
	return m;
}

export interface OvaCounts {
	/** M[i][i] — class i correctly predicted. */
	tp: number;
	/** Column i off-diagonal — predicted i, true class ≠ i. */
	fp: number;
	/** Row i off-diagonal — true class i, predicted ≠ i. */
	fn: number;
}

/** OVA (TP, FP, FN) counts for every class of a C×C confusion matrix. */
export function ovaCounts(matrix: number[][]): OvaCounts[] {
	if (matrix.length === 0) throw new Error('ovaCounts requires a non-empty confusion matrix');
	const c = matrix.length;
	for (const row of matrix) {
		if (row.length !== c) throw new Error('multiclass confusion matrix must be square');
		for (const v of row) assertCount(v, 'count');
	}
	const out: OvaCounts[] = [];
	for (let i = 0; i < c; i++) {
		let fp = 0;
		let fn = 0;
		for (let j = 0; j < c; j++) {
			if (j === i) continue;
			fp += matrix[j][i];
			fn += matrix[i][j];
		}
		out.push({ tp: matrix[i][i], fp, fn });
	}
	return out;
}

/** Per-class (OVA) precision m_i = TP_i/(TP_i+FP_i), as in Marine's exercise. */
export function perClassPrecision(tp: number, fp: number): number {
	assertCount(tp, 'tp');
	assertCount(fp, 'fp');
	if (tp + fp === 0) {
		throw new Error('precision is undefined for a class with no positive predictions (TP+FP = 0)');
	}
	return tp / (tp + fp);
}

/** « Macro-average » : (1/C)·Σ m_i — « permet de ne pas négliger les classes rares ». */
export function macroAverage(scores: number[]): number {
	if (scores.length === 0) throw new Error('macroAverage requires at least one score');
	for (const s of scores) {
		if (!Number.isFinite(s)) throw new Error(`scores must be finite, got ${s}`);
	}
	return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * « Weight-average » : Σ m_i·support_i / (nb. données total), each class
 * weighted by its support (number of true observations of that class).
 */
export function weightedAverage(scores: number[], supports: number[]): number {
	if (scores.length === 0) throw new Error('weightedAverage requires at least one score');
	if (scores.length !== supports.length) {
		throw new Error(`scores (${scores.length}) and supports (${supports.length}) must have the same length`);
	}
	let total = 0;
	for (const s of supports) {
		assertCount(s, 'support');
		total += s;
	}
	if (total === 0) throw new Error('weightedAverage is undefined for zero total support');
	let num = 0;
	for (let i = 0; i < scores.length; i++) {
		if (!Number.isFinite(scores[i])) throw new Error(`scores must be finite, got ${scores[i]}`);
		num += scores[i] * supports[i];
	}
	return num / total;
}

/**
 * « Micro-average » for precision: ΣTP_i/(ΣTP_i+ΣFP_i). In multiclass OVA this
 * equals the overall accuracy — ΣTP_i is the number of correct predictions and
 * ΣFP_i the number of wrong ones (each wrong prediction has exactly one
 * predicted class) — which is the slide's statement « correspond à l'accuracy ».
 */
export function microPrecision(tps: number[], fps: number[]): number {
	if (tps.length === 0) throw new Error('microPrecision requires at least one class');
	if (tps.length !== fps.length) {
		throw new Error(`tps (${tps.length}) and fps (${fps.length}) must have the same length`);
	}
	let tpSum = 0;
	let fpSum = 0;
	for (let i = 0; i < tps.length; i++) {
		assertCount(tps[i], `tps[${i}]`);
		assertCount(fps[i], `fps[${i}]`);
		tpSum += tps[i];
		fpSum += fps[i];
	}
	if (tpSum + fpSum === 0) {
		throw new Error('microPrecision is undefined: TP+FP = 0 for every class');
	}
	return tpSum / (tpSum + fpSum);
}
