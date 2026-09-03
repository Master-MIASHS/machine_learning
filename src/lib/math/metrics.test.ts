import { describe, it, expect } from 'vitest';
import {
	confusionMatrix,
	confusionFromRates,
	accuracy,
	precision,
	recall,
	specificity,
	f1,
	multiclassConfusion,
	ovaCounts,
	perClassPrecision,
	macroAverage,
	weightedAverage,
	microPrecision,
	type BinaryConfusion
} from './metrics';
import { mulberry32 } from './util';

// A reference matrix with every denominator non-zero.
const cm0: BinaryConfusion = { tn: 85, fp: 10, fn: 25, tp: 80 };

describe('confusionMatrix', () => {
	it('counts TN/FN/FP/TP exactly for a known pair list', () => {
		const pairs: [0 | 1, 0 | 1][] = [
			[0, 0],
			[0, 0],
			[0, 1],
			[1, 0],
			[1, 1]
		];
		expect(confusionMatrix(pairs)).toEqual({ tn: 2, fp: 1, fn: 1, tp: 1 });
	});

	it('returns all zeros for an empty list', () => {
		expect(confusionMatrix([])).toEqual({ tn: 0, fp: 0, fn: 0, tp: 0 });
	});

	it('throws for labels outside {0,1}', () => {
		const invalid = (pair: number[]): [0 | 1, 0 | 1] => pair as unknown as [0 | 1, 0 | 1];
		expect(() => confusionMatrix([invalid([0, 2])])).toThrow();
		expect(() => confusionMatrix([invalid([-1, 0])])).toThrow();
		expect(() => confusionMatrix([invalid([0, 0.5])])).toThrow();
	});
});

describe('confusionFromRates', () => {
	it('matches the rounded definition on a clean case', () => {
		// TP = round(0.9·100) = 90, TN = round(0.8·50) = 40
		expect(confusionFromRates(100, 50, 0.9, 0.8)).toEqual({ tn: 40, fp: 10, fn: 10, tp: 90 });
	});

	it('rounds to the nearest integer (0.33·10 = 3.3 → 3)', () => {
		expect(confusionFromRates(10, 20, 0.33, 0.85)).toEqual({ tn: 17, fp: 3, fn: 7, tp: 3 });
	});

	it('preserves TP+FN = nPos and TN+FP = nNeg on a parameter sweep', () => {
		for (const nPos of [1, 7, 100]) {
			for (const nNeg of [1, 13, 200]) {
				for (const sens of [0, 0.25, 0.5, 0.75, 1]) {
					for (const spec of [0, 0.1, 0.5, 0.9, 1]) {
						const cm = confusionFromRates(nPos, nNeg, sens, spec);
						expect(cm.tp + cm.fn).toBe(nPos);
						expect(cm.tn + cm.fp).toBe(nNeg);
					}
				}
			}
		}
	});

	it('throws for invalid domains', () => {
		expect(() => confusionFromRates(0, 10, 0.5, 0.5)).toThrow();
		expect(() => confusionFromRates(10, -1, 0.5, 0.5)).toThrow();
		expect(() => confusionFromRates(2.5, 10, 0.5, 0.5)).toThrow();
		expect(() => confusionFromRates(10, 10, -0.1, 0.5)).toThrow();
		expect(() => confusionFromRates(10, 10, 0.5, 1.1)).toThrow();
		expect(() => confusionFromRates(10, 10, Number.NaN, 0.5)).toThrow();
	});
});

describe('binary metrics — closed-form values', () => {
	// cm0 = {tn:85, fp:10, fn:25, tp:80}, total 200.
	it('accuracy = (TP+TN)/total = 165/200', () => {
		expect(accuracy(cm0)).toBeCloseTo(165 / 200, 12);
	});

	it('precision = TP/(TP+FP) = 80/90', () => {
		expect(precision(cm0)).toBeCloseTo(80 / 90, 12);
	});

	it('recall = TP/(TP+FN) = 80/105', () => {
		expect(recall(cm0)).toBeCloseTo(80 / 105, 12);
	});

	it('specificity = TN/(TN+FP) = 85/95', () => {
		expect(specificity(cm0)).toBeCloseTo(85 / 95, 12);
	});

	it('F1 = 2TP/(2TP+FP+FN) = 160/195', () => {
		expect(f1(cm0)).toBeCloseTo(160 / 195, 12);
	});
});

describe('F1 harmonic-mean identity', () => {
	it('F1 = 2·P·R/(P+R) with P and R from the same matrix', () => {
		const cases: BinaryConfusion[] = [
			cm0,
			{ tn: 1, fp: 2, fn: 3, tp: 4 },
			{ tn: 0, fp: 5, fn: 0, tp: 7 },
			{ tn: 9, fp: 0, fn: 4, tp: 2 }
		];
		for (const cm of cases) {
			const p = precision(cm);
			const r = recall(cm);
			expect(f1(cm)).toBeCloseTo((2 * p * r) / (p + r), 12);
		}
	});
});

describe('binary metrics — zero denominators and invalid counts', () => {
	it('precision throws when TP+FP = 0', () => {
		expect(() => precision({ tn: 5, fp: 0, fn: 5, tp: 0 })).toThrow();
	});

	it('recall throws when TP+FN = 0', () => {
		expect(() => recall({ tn: 5, fp: 5, fn: 0, tp: 0 })).toThrow();
	});

	it('specificity throws when TN+FP = 0', () => {
		expect(() => specificity({ tn: 0, fp: 0, fn: 5, tp: 5 })).toThrow();
	});

	it('F1 throws when 2TP+FP+FN = 0', () => {
		expect(() => f1({ tn: 5, fp: 0, fn: 0, tp: 0 })).toThrow();
	});

	it('accuracy throws on the empty matrix', () => {
		expect(() => accuracy({ tn: 0, fp: 0, fn: 0, tp: 0 })).toThrow();
	});

	it('every metric throws on negative counts', () => {
		const bad: BinaryConfusion = { tn: -1, fp: 1, fn: 1, tp: 1 };
		expect(() => accuracy(bad)).toThrow();
		expect(() => precision(bad)).toThrow();
		expect(() => recall(bad)).toThrow();
		expect(() => specificity(bad)).toThrow();
		expect(() => f1(bad)).toThrow();
	});
});

describe('binary metrics — scores bounded in [0,1]', () => {
	it('all five scores lie in [0,1] on the full count grid 0..5', () => {
		for (let tn = 0; tn <= 5; tn++) {
			for (let fp = 0; fp <= 5; fp++) {
				for (let fn = 0; fn <= 5; fn++) {
					for (let tp = 0; tp <= 5; tp++) {
						const cm: BinaryConfusion = { tn, fp, fn, tp };
						const check = (v: number) => {
							expect(v).toBeGreaterThanOrEqual(0);
							expect(v).toBeLessThanOrEqual(1);
						};
						if (tn + fp + fn + tp > 0) check(accuracy(cm));
						if (tp + fp > 0) check(precision(cm));
						if (tp + fn > 0) check(recall(cm));
						if (tn + fp > 0) check(specificity(cm));
						if (2 * tp + fp + fn > 0) check(f1(cm));
					}
				}
			}
		}
	});
});

// ---------------------------------------------------------------------------
// Marine's exercise (frame « Exercice »): per-class (TP, FP) for classes A–D.
// Hand-computed anchors, independent of the code:
//
// Situation 1: A(1,1) B(10,90) C(1,1) D(1,1)
//   m_i = [1/2, 10/100, 1/2, 1/2] = [0.5, 0.1, 0.5, 0.5]
//   macro = (0.5+0.1+0.5+0.5)/4 = 0.4
//   micro = (1+10+1+1)/(1+10+1+1+1+90+1+1) = 13/106
//
// Situation 2: A(0,2) B(90,10) C(0,2) D(0,2)
//   m_i = [0/2, 90/100, 0/2, 0/2] = [0, 0.9, 0, 0]
//   macro = 0.9/4 = 0.225
//   micro = (0+90+0+0)/(0+90+0+0+2+10+2+2) = 90/106
// ---------------------------------------------------------------------------

const situation1 = [
	{ tp: 1, fp: 1 },
	{ tp: 10, fp: 90 },
	{ tp: 1, fp: 1 },
	{ tp: 1, fp: 1 }
];
const situation2 = [
	{ tp: 0, fp: 2 },
	{ tp: 90, fp: 10 },
	{ tp: 0, fp: 2 },
	{ tp: 0, fp: 2 }
];

describe("Marine's exercise — macro vs micro precision", () => {
	it('Situation 1: per-class precision [0.5, 0.1, 0.5, 0.5], macro = 0.4, micro = 13/106', () => {
		const scores = situation1.map((c) => perClassPrecision(c.tp, c.fp));
		expect(scores).toEqual([0.5, 0.1, 0.5, 0.5]);
		expect(macroAverage(scores)).toBeCloseTo(0.4, 12);
		const micro = microPrecision(
			situation1.map((c) => c.tp),
			situation1.map((c) => c.fp)
		);
		expect(micro).toBeCloseTo(13 / 106, 12);
	});

	it('Situation 2: per-class precision [0, 0.9, 0, 0], macro = 0.225, micro = 90/106', () => {
		const scores = situation2.map((c) => perClassPrecision(c.tp, c.fp));
		expect(scores).toEqual([0, 0.9, 0, 0]);
		expect(macroAverage(scores)).toBeCloseTo(0.225, 12);
		const micro = microPrecision(
			situation2.map((c) => c.tp),
			situation2.map((c) => c.fp)
		);
		expect(micro).toBeCloseTo(90 / 106, 12);
	});

	it('macro and micro disagree in opposite directions — the exercise point', () => {
		// Situation 1: the small, easy classes inflate the macro above the micro.
		const macro1 = macroAverage(situation1.map((c) => perClassPrecision(c.tp, c.fp)));
		const micro1 = microPrecision(
			situation1.map((c) => c.tp),
			situation1.map((c) => c.fp)
		);
		expect(macro1).toBeGreaterThan(micro1);
		// Situation 2: class B dominates the micro, while the macro stays low.
		const macro2 = macroAverage(situation2.map((c) => perClassPrecision(c.tp, c.fp)));
		const micro2 = microPrecision(
			situation2.map((c) => c.tp),
			situation2.map((c) => c.fp)
		);
		expect(macro2).toBeLessThan(micro2);
	});
});

describe('multiclassConfusion', () => {
	it('builds the C×C matrix with rows = true class, columns = predicted', () => {
		const pairs: [number, number][] = [
			[0, 0],
			[0, 1],
			[1, 1],
			[1, 1],
			[2, 0]
		];
		expect(multiclassConfusion(pairs)).toEqual([
			[1, 1, 0],
			[0, 2, 0],
			[1, 0, 0]
		]);
	});

	it('throws for negative labels', () => {
		expect(() => multiclassConfusion([[-1, 0]])).toThrow();
		expect(() => multiclassConfusion([[0, -2]])).toThrow();
	});
});

describe('ovaCounts', () => {
	const matrix = [
		[1, 1, 0],
		[0, 2, 0],
		[1, 0, 0]
	];

	it('gives the exact OVA (TP, FP, FN) per class', () => {
		// Class 1: column 1 = [1, 2, 0] → FP₁ = M[0][1] + M[2][1] = 1 (the (0,1) example).
		expect(ovaCounts(matrix)).toEqual([
			{ tp: 1, fp: 1, fn: 1 },
			{ tp: 2, fp: 1, fn: 0 },
			{ tp: 0, fp: 0, fn: 1 }
		]);
	});

	it('satisfies Σ(tp+fn) = n and Σfp = n − Σtp on a seeded random problem', () => {
		const rand = mulberry32(77);
		const n = 500;
		const c = 3;
		const pairs: [number, number][] = [];
		for (let i = 0; i < n; i++) {
			const y = Math.floor(rand() * c);
			const yh = Math.floor(rand() * c);
			pairs.push([y, yh]);
		}
		const counts = ovaCounts(multiclassConfusion(pairs));
		const support = counts.reduce((s, x) => s + x.tp + x.fn, 0);
		const fpSum = counts.reduce((s, x) => s + x.fp, 0);
		const tpSum = counts.reduce((s, x) => s + x.tp, 0);
		expect(support).toBe(n);
		expect(fpSum).toBe(n - tpSum);
	});

	it('throws on empty, non-square or negative-count matrices', () => {
		expect(() => ovaCounts([])).toThrow();
		expect(() => ovaCounts([[1, 0], [0]])).toThrow();
		expect(() => ovaCounts([[1, -1]])).toThrow();
	});
});

describe('microPrecision — the micro = accuracy invariant', () => {
	it('equals the overall accuracy exactly on a seeded random 3-class problem', () => {
		const rand = mulberry32(1234);
		const n = 1000;
		const c = 3;
		const trueLabels: number[] = [];
		const predLabels: number[] = [];
		for (let i = 0; i < n; i++) {
			const y = Math.floor(rand() * c);
			let yh = y;
			if (rand() < 0.3) {
				const others = [0, 1, 2].filter((k) => k !== y);
				yh = others[Math.floor(rand() * others.length)];
			}
			trueLabels.push(y);
			predLabels.push(yh);
		}
		const counts = ovaCounts(multiclassConfusion(trueLabels.map((y, i) => [y, predLabels[i]])));
		const micro = microPrecision(
			counts.map((x) => x.tp),
			counts.map((x) => x.fp)
		);
		const overallAccuracy = trueLabels.filter((y, i) => y === predLabels[i]).length / n;
		expect(micro).toBeCloseTo(overallAccuracy, 12);
	});
});

describe('macroAverage', () => {
	it('is the plain mean of the scores', () => {
		expect(macroAverage([0.5, 0.1, 0.5, 0.5])).toBeCloseTo(0.4, 12);
	});

	it('throws on an empty list or non-finite scores', () => {
		expect(() => macroAverage([])).toThrow();
		expect(() => macroAverage([0.5, Number.NaN])).toThrow();
	});
});

describe('weightedAverage', () => {
	it('matches the hand-computed weighted mean', () => {
		// (0.5·2 + 0.1·100 + 0.5·2 + 0.5·2) / 106 = 13/106
		expect(weightedAverage([0.5, 0.1, 0.5, 0.5], [2, 100, 2, 2])).toBeCloseTo(13 / 106, 12);
	});

	it('coincides with microPrecision when supports = TP+FP (since m_i·(TP_i+FP_i) = TP_i)', () => {
		const data = situation1;
		const scores = data.map((c) => perClassPrecision(c.tp, c.fp));
		const supports = data.map((c) => c.tp + c.fp);
		expect(weightedAverage(scores, supports)).toBeCloseTo(
			microPrecision(
				data.map((c) => c.tp),
				data.map((c) => c.fp)
			),
			12
		);
	});

	it('throws on empty input, length mismatch or zero total support', () => {
		expect(() => weightedAverage([], [])).toThrow();
		expect(() => weightedAverage([0.5, 0.1], [1])).toThrow();
		expect(() => weightedAverage([0.5, 0.1], [0, 0])).toThrow();
	});
});

describe('perClassPrecision', () => {
	it('matches the hand values from Marine\'s exercise', () => {
		expect(perClassPrecision(1, 1)).toBeCloseTo(0.5, 12);
		expect(perClassPrecision(10, 90)).toBeCloseTo(0.1, 12);
		expect(perClassPrecision(90, 10)).toBeCloseTo(0.9, 12);
	});

	it('is defined and zero when TP = 0 but FP > 0 (Situation 2, classes A/C/D)', () => {
		expect(perClassPrecision(0, 2)).toBe(0);
	});

	it('throws when TP+FP = 0 or counts are negative', () => {
		expect(() => perClassPrecision(0, 0)).toThrow();
		expect(() => perClassPrecision(-1, 1)).toThrow();
	});
});

describe('microPrecision — direct values', () => {
	it('matches the hand values from Marine\'s exercise', () => {
		expect(
			microPrecision(
				situation1.map((c) => c.tp),
				situation1.map((c) => c.fp)
			)
		).toBeCloseTo(13 / 106, 12);
		expect(
			microPrecision(
				situation2.map((c) => c.tp),
				situation2.map((c) => c.fp)
			)
		).toBeCloseTo(90 / 106, 12);
	});

	it('throws on empty input, length mismatch or all-zero denominators', () => {
		expect(() => microPrecision([], [])).toThrow();
		expect(() => microPrecision([1], [])).toThrow();
		expect(() => microPrecision([0, 0], [0, 0])).toThrow();
	});
});
