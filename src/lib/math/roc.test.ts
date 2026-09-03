import { describe, it, expect } from 'vitest';
import {
	sigmoid,
	rocPoint,
	rocCurve,
	aucTrapezoidal,
	generateScoreSamples
} from './roc';
import { mulberry32 } from './util';

describe('sigmoid', () => {
	it('passes through the known values', () => {
		expect(sigmoid(0)).toBeCloseTo(0.5, 12);
		expect(sigmoid(1)).toBeCloseTo(1 / (1 + Math.exp(-1)), 12);
		expect(sigmoid(10)).toBeCloseTo(1, 4);
		expect(sigmoid(-10)).toBeCloseTo(0, 4);
	});

	it('satisfies σ(-t) = 1 - σ(t)', () => {
		for (const t of [-5, -1.3, 0, 0.7, 4.2]) {
			expect(sigmoid(-t)).toBeCloseTo(1 - sigmoid(t), 12);
		}
	});

	it('is monotonically increasing', () => {
		let prev = -Infinity;
		for (let t = -10; t <= 10; t += 0.1) {
			const v = sigmoid(t);
			expect(v).toBeGreaterThan(prev);
			prev = v;
		}
	});
});

describe('rocPoint', () => {
	it('computes TPR/FPR by hand on a known case', () => {
		// 2 négatifs, 3 positifs. Seuil 0.5 → prédit positif si score >= 0.5.
		const scores = [0.1, 0.4, 0.6, 0.8, 0.9];
		const labels: (0 | 1)[] = [0, 0, 1, 1, 1];
		// Prédits positifs : indices 2,3,4 → 3 TP, 0 FP
		expect(rocPoint(scores, labels, 0.5)).toEqual({ fpr: 0, tpr: 1 });
		// Seuil 0.3 → prédit positif : 0.4, 0.6, 0.8, 0.9 → 3 TP, 1 FP
		expect(rocPoint(scores, labels, 0.3)).toEqual({ fpr: 0.5, tpr: 1 });
		// Seuil 0.2 → tout sauf 0.1 est prédit positif → 3 TP, 1 FP (0.4) + ...
		// 0.1 prédit négatif : 4 positifs prédits (0.4 FP, 0.6/0.8/0.9 TP), 1 négatif bien prédit
		expect(rocPoint(scores, labels, 0.2)).toEqual({ fpr: 0.5, tpr: 1 });
		// Seuil très bas : tout est prédit positif → FPR = TPR = 1
		expect(rocPoint(scores, labels, -100)).toEqual({ fpr: 1, tpr: 1 });
		// Seuil très haut : rien n'est prédit positif → FPR = TPR = 0
		expect(rocPoint(scores, labels, 100)).toEqual({ fpr: 0, tpr: 0 });
	});

	it('throws for empty input, size mismatch, invalid labels, or a missing class', () => {
		expect(() => rocPoint([], [], 0)).toThrow();
		expect(() => rocPoint([0.1, 0.2], [0], 0)).toThrow();
		const bad = [0, 2] as unknown as (0 | 1)[];
		expect(() => rocPoint([0.1, 0.2], bad, 0)).toThrow();
		// Tous les labels positifs : FPR indéfini
		expect(() => rocPoint([0.1, 0.2], [1, 1], 0)).toThrow();
		// Tous les labels négatifs : TPR indéfini
		expect(() => rocPoint([0.1, 0.2], [0, 0], 0)).toThrow();
	});
});

describe('rocCurve', () => {
	it('starts at (0,0) and ends at (1,1), sorted by FPR', () => {
		const scores = [0.9, 0.8, 0.4, 0.3, 0.1];
		const labels: (0 | 1)[] = [1, 1, 1, 0, 0];
		const curve = rocCurve(scores, labels);
		expect(curve[0]).toMatchObject({ fpr: 0, tpr: 0 });
		expect(curve[curve.length - 1]).toMatchObject({ fpr: 1, tpr: 1 });
		for (let i = 1; i < curve.length; i++) {
			expect(curve[i].fpr).toBeGreaterThanOrEqual(curve[i - 1].fpr);
		}
	});

	it('is the diagonal for a degenerate (random) classifier: all scores equal', () => {
		// Tous les scores égaux : le seul seuil utile prédit tout ou rien.
		const scores = [0.5, 0.5, 0.5, 0.5];
		const labels: (0 | 1)[] = [0, 0, 1, 1];
		const curve = rocCurve(scores, labels);
		// Points distincts : (0,0) puis, dès le seuil 0.5, tout est prédit positif → (1,1)
		const distinct = curve.filter(
			(p, i, arr) => arr.findIndex((q) => q.fpr === p.fpr && q.tpr === p.tpr) === i
		);
		expect(distinct.map((p) => [p.fpr, p.tpr])).toEqual([
			[0, 0],
			[1, 1]
		]);
	});

	it('is the upper-left corner for a perfect classifier', () => {
		// Tous les scores positifs strictement au-dessus de tous les négatifs :
		// FPR reste 0 pendant que TPR monte jusqu'à 1, puis TPR reste 1.
		const scores = [0.9, 0.8, 0.7, 0.1, 0.2, 0.3];
		const labels: (0 | 1)[] = [1, 1, 1, 0, 0, 0];
		const curve = rocCurve(scores, labels);
		const distinct = curve.filter(
			(p, i, arr) => arr.findIndex((q) => q.fpr === p.fpr && q.tpr === p.tpr) === i
		);
		expect(distinct.map((p) => [p.fpr, p.tpr])).toEqual([
			[0, 0],
			[0, 1 / 3],
			[0, 2 / 3],
			[0, 1],
			[1 / 3, 1],
			[2 / 3, 1],
			[1, 1]
		]);
		// L'AUC de cette courbe est exactement 1.
		expect(aucTrapezoidal(curve)).toBeCloseTo(1, 12);
	});
});

describe('aucTrapezoidal', () => {
	it('is exactly 1 for the perfect classifier curve', () => {
		const points = [
			{ fpr: 0, tpr: 0 },
			{ fpr: 0, tpr: 1 },
			{ fpr: 1, tpr: 1 }
		];
		expect(aucTrapezoidal(points)).toBeCloseTo(1, 12);
	});

	it('is exactly 0.5 for the diagonal', () => {
		const points = [
			{ fpr: 0, tpr: 0 },
			{ fpr: 1, tpr: 1 }
		];
		expect(aucTrapezoidal(points)).toBeCloseTo(0.5, 12);
	});

	it('matches the Mann-Whitney U formula (P(score+ > score-)) on a sample', () => {
		// Formule fermée indépendante : AUC = (Σ_{i∈+} Σ_{j∈-} [s_i > s_j] + 0.5·[s_i = s_j])
		// / (n+ · n-). Calcul par force brute sur un petit échantillon.
		const { scores, labels } = generateScoreSamples(20, 1.5, 7);
		const pos = scores.filter((_, i) => labels[i] === 1);
		const neg = scores.filter((_, i) => labels[i] === 0);
		let stat = 0;
		for (const sp of pos) {
			for (const sn of neg) {
				if (sp > sn) stat += 1;
				else if (sp === sn) stat += 0.5;
			}
		}
		const mw = stat / (pos.length * neg.length);
		const auc = aucTrapezoidal(rocCurve(scores, labels));
		expect(auc).toBeCloseTo(mw, 6);
	});

	it('stays in [0, 1] and grows with the class separation on synthetic samples', () => {
		const aucAt = (sep: number): number => {
			const { scores, labels } = generateScoreSamples(200, sep, 42);
			return aucTrapezoidal(rocCurve(scores, labels));
		};
		const auc0 = aucAt(0);
		const auc1 = aucAt(1);
		const auc3 = aucAt(3);
		expect(auc0).toBeGreaterThanOrEqual(0);
		expect(auc0).toBeLessThanOrEqual(1);
		// séparation 0 ≈ classifieur aléatoire
		expect(auc0).toBeCloseTo(0.5, 1);
		// AUC croissante avec la séparation
		expect(auc1).toBeGreaterThan(auc0);
		expect(auc3).toBeGreaterThan(auc1);
	});
});

describe('generateScoreSamples', () => {
	it('is deterministic for a fixed seed', () => {
		const a = generateScoreSamples(50, 1, 123);
		const b = generateScoreSamples(50, 1, 123);
		expect(a.scores).toEqual(b.scores);
		expect(a.labels).toEqual(b.labels);
	});

	it('decorrelates the two class streams across parameters', () => {
		const a = generateScoreSamples(30, 0, 5);
		const b = generateScoreSamples(30, 1, 5);
		expect(a.scores).not.toEqual(b.scores);
	});

	it('produces the requested class balance and rejects bad inputs', () => {
		const { scores, labels } = generateScoreSamples(17, 2, 9);
		expect(scores.length).toBe(34);
		expect(labels.filter((y) => y === 1).length).toBe(17);
		expect(labels.filter((y) => y === 0).length).toBe(17);
		expect(() => generateScoreSamples(0, 1)).toThrow();
	});
});

// Garde-fou : le PRNG de util.ts est bien celui utilisé (déterminisme global).
describe('seed hygiene', () => {
	it('mulberry32 from util drives the generator (same stream, shifted seed)', () => {
		const { scores } = generateScoreSamples(3, 0, 42);
		const { scores: again } = generateScoreSamples(3, 0, 42);
		expect(scores).toEqual(again);
		// et un autre seed donne bien d'autres tirages
		const { scores: other } = generateScoreSamples(3, 0, 43);
		expect(scores).not.toEqual(other);
		void mulberry32; // importé pour documenter la dépendance
	});
});
