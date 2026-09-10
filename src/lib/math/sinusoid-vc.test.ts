// src/lib/math/sinusoid-vc.test.ts
//
// Tests for the sin(Ax + b) separator used by the « dimension VC infinie »
// demo (exemple au-delà du cours — cf. sinusoid-vc.ts).

import { describe, it, expect } from 'vitest';
import {
	sinusoidSigns,
	feasiblePhase,
	findSinusoidFit,
	sinusoidCurvePoints,
	sampleSinusoidInterval,
	positiveRegions
} from './sinusoid-vc';
import { allLabelings } from './vc';

const PI = Math.PI;

describe('sinusoidSigns', () => {
	it('matches the closed form of sin (A=1, b=0)', () => {
		const xs = [0, PI / 4, PI / 2, PI, (5 * PI) / 4, (3 * PI) / 2, 2 * PI];
		expect(sinusoidSigns(1, 0, xs)).toEqual([0, 1, 1, 0, 0, 0, 0]);
	});

	it('matches the closed form (A=2, b=π/2 ⇒ sin(2x+π/2) = cos(2x))', () => {
		expect(sinusoidSigns(2, PI / 2, [0, PI / 4, PI / 2])).toEqual([1, 0, 0]);
	});

	it('convention: sin = 0 classifies 0', () => {
		expect(sinusoidSigns(1, 0, [PI])).toEqual([0]);
	});

	it('rejects invalid A, b, x', () => {
		expect(() => sinusoidSigns(0, 0, [1])).toThrow();
		expect(() => sinusoidSigns(-1, 0, [1])).toThrow();
		expect(() => sinusoidSigns(1, 0, [Infinity])).toThrow();
		expect(() => sinusoidSigns(1, NaN, [1])).toThrow();
	});
});

describe('feasiblePhase', () => {
	it('single point, label 1: the feasible arc is the semicircle centered at π/2 − A·x', () => {
		const w = feasiblePhase(1, [0], [1]);
		expect(w).not.toBeNull();
		expect(w!.mid).toBeCloseTo(PI / 2, 12);
		expect(w!.halfLen).toBeCloseTo(PI / 2, 12);
	});

	it('single point, label 0: the feasible arc is centered at 3π/2 − A·x', () => {
		const w = feasiblePhase(2, [1], [0]);
		expect(w).not.toBeNull();
		expect(w!.mid).toBeCloseTo(((3 * PI) / 2 - 2) % (2 * PI), 12);
		expect(w!.halfLen).toBeCloseTo(PI / 2, 12);
	});

	it('returned window is exact: b inside works, b outside does not', () => {
		const xs = [0, 1];
		const labels: (0 | 1)[] = [1, 0];
		const w = feasiblePhase(1, xs, labels);
		expect(w).not.toBeNull();
		const inside = [w!.mid, w!.mid + 0.5 * w!.halfLen, w!.mid - 0.5 * w!.halfLen];
		for (const b of inside) expect(sinusoidSigns(1, b, xs)).toEqual(labels);
		const outside = w!.mid + 1.5 * w!.halfLen;
		expect(sinusoidSigns(1, outside, xs)).not.toEqual(labels);
	});

	it('three equally spaced alternating points: infeasible below AΔ = π/2, feasible above (exact threshold)', () => {
		// Avec AΔ < π, un gap contient au plus un zéro ; deux gaps consécutifs
		// contenant chacun un zéro exigent une avance de phase > π/2 par gap.
		expect(feasiblePhase(0.3, [0, 1, 2], [1, 0, 1])).toBeNull();
		expect(feasiblePhase(2.0, [0, 1, 2], [1, 0, 1])).not.toBeNull();
	});

	it('constant labeling is feasible at small A', () => {
		expect(feasiblePhase(0.1, [0, 1, 2], [0, 0, 0])).not.toBeNull();
		expect(feasiblePhase(0.1, [0, 1, 2], [1, 1, 1])).not.toBeNull();
	});

	it('rejects invalid inputs', () => {
		expect(() => feasiblePhase(0, [0], [1])).toThrow();
		expect(() => feasiblePhase(1, [], [1] as (0 | 1)[])).toThrow();
		expect(() => feasiblePhase(1, [0, 1], [1])).toThrow();
	});
});

describe('findSinusoidFit — brisure (VCdim = +∞, illustration numérique)', () => {
	// Ensembles en position générale : VCdim = +∞ signifie que pour tout m il
	// EXISTE un ensemble de m points brisé — ces ensembles le sont (vérifié
	// numériquement : tous les 2^m étiquetages sont réalisables). Attention :
	// ce n'est pas vrai de chaque configuration — des points parfaitement
	// équirépartis admettent des étiquetages irréalisables (ex. [0,1,2] avec
	// (1,0,1) pour AΔ < π/2, cas ci-dessous), et on ne les teste pas ici.
	const SETS: number[][] = [
		[0.3, 1.1, 2.7, 4.2, 9.8],
		[1.0, 2.3, 4.1, 6.7, 9.2],
		[0.7, 1.9, 3.4, 5.2, 6.6, 8.9]
	];

	it('shatters sets of 5-6 points in general position, for every labeling (2^m dichotomies)', () => {
		for (const base of SETS) {
			const m = base.length;
			for (const labels of allLabelings(m)) {
				const fit = findSinusoidFit(base, labels);
				expect(fit, `set ${JSON.stringify(base)}, labeling ${labels}`).not.toBeNull();
				expect(fit!.errors).toBe(0);
				expect(sinusoidSigns(fit!.A, fit!.b, base)).toEqual(labels);
			}
			// Les préfixes sont brisés aussi (tout étiquetage d'un préfixe
			// s'étend à l'ensemble entier, lui-même brisé).
			for (let k = 1; k < m; k++) {
				const xs = base.slice(0, k);
				for (const labels of allLabelings(k)) {
					const fit = findSinusoidFit(xs, labels);
					expect(fit, `prefix ${JSON.stringify(xs)}, labeling ${labels}`).not.toBeNull();
					expect(sinusoidSigns(fit!.A, fit!.b, xs)).toEqual(labels);
				}
			}
		}
	});

	it('two clean clouds: 0 error with a low-frequency sinusoid (A·span < 2π)', () => {
		const xs = [1.0, 1.5, 2.0, 2.5, 7.0, 7.5, 8.0, 8.5];
		const labels: (0 | 1)[] = [0, 0, 0, 0, 1, 1, 1, 1];
		const fit = findSinusoidFit(xs, labels);
		expect(fit).not.toBeNull();
		expect(fit!.errors).toBe(0);
		const span = xs[xs.length - 1] - xs[0];
		expect(fit!.A * span).toBeLessThan(2 * PI);
	});

	it('alternating labels on a generic set: 0 error, and the oscillation count is bounded below by the number of sign flips', () => {
		// Bornes universelles : m−1 retournements de signe exigent au moins
		// m−1 zéros dans (x_1, x_m), espacés de π/A ⇒ A·span > (m−2)π pour
		// TOUT fit réalisant l'étiquetage alterné (bornes strictes, marge
		// numérique 1 %).
		let previous = 0;
		for (let m = 4; m <= 12; m++) {
			// Gaps non égaux et irrationnels : configuration en position générale.
			const xs = Array.from({ length: m }, (_, i) => 0.5 * (i + 1) + 0.02 * (i + 1) * i * Math.SQRT2);
			const labels = Array.from({ length: m }, (_, i) => (i % 2 === 0 ? 1 : 0) as 0 | 1);
			const fit = findSinusoidFit(xs, labels);
			expect(fit, `m=${m}`).not.toBeNull();
			expect(fit!.errors).toBe(0);
			expect(sinusoidSigns(fit!.A, fit!.b, xs)).toEqual(labels);
			const span = xs[m - 1] - xs[0];
			expect(fit!.A * span).toBeGreaterThan((m - 2) * PI * 0.99);
			// Le solveur retourne le plus petit A faisable : la fréquence
			// minimale exigée croît avec m.
			expect(fit!.A * span).toBeGreaterThanOrEqual(previous);
			previous = fit!.A * span;
		}
	});

	it('works with unsorted input (labels follow the points)', () => {
		const xs = [5.0, 0.5, 9.2, 1.1];
		const labels: (0 | 1)[] = [1, 0, 1, 0];
		const fit = findSinusoidFit(xs, labels);
		expect(fit).not.toBeNull();
		expect(sinusoidSigns(fit!.A, fit!.b, xs)).toEqual(labels);
	});

	it('single point: any labeling is realizable', () => {
		for (const label of [0, 1] as const) {
			const fit = findSinusoidFit([3.7], [label]);
			expect(fit).not.toBeNull();
			expect(sinusoidSigns(fit!.A, fit!.b, [3.7])).toEqual([label]);
		}
	});

	it('is deterministic', () => {
		const xs = [0.6, 1.7, 2.9, 4.4, 5.8];
		const labels: (0 | 1)[] = [1, 0, 1, 0, 1];
		const a = findSinusoidFit(xs, labels);
		const b = findSinusoidFit(xs, labels);
		expect(a).toEqual(b);
	});

	it('rejects invalid inputs', () => {
		expect(() => findSinusoidFit([], [])).toThrow();
		expect(() => findSinusoidFit([1, 2], [1])).toThrow();
		expect(() => findSinusoidFit([1, 1], [0, 1])).toThrow();
		expect(() => findSinusoidFit([1, 2], [0, 5 as unknown as 0 | 1])).toThrow();
		expect(() => findSinusoidFit([1, NaN], [0, 1])).toThrow();
	});
});

describe('sinusoidCurvePoints', () => {
	it('hits the closed form at the endpoints', () => {
		const pts = sinusoidCurvePoints(1, 0, 0, 1);
		expect(pts[0]).toEqual([0, 0]);
		expect(pts[pts.length - 1][0]).toBeCloseTo(1, 12);
		expect(pts[pts.length - 1][1]).toBeCloseTo(Math.sin(1), 12);
	});

	it('clamps the sample count between 500 and 8000 points', () => {
		expect(sinusoidCurvePoints(0.1, 0, 0, 10).length).toBe(500);
		expect(sinusoidCurvePoints(1000, 0, 0, 10).length).toBe(8000);
		const mid = sinusoidCurvePoints(100, 0, 0, 10).length;
		expect(mid).toBeGreaterThan(500);
		expect(mid).toBeLessThan(8000);
	});

	it('rejects invalid inputs', () => {
		expect(() => sinusoidCurvePoints(0, 0, 0, 1)).toThrow();
		expect(() => sinusoidCurvePoints(1, 0, 1, 1)).toThrow();
	});
});

describe('sampleSinusoidInterval', () => {
	it('hits the closed form at the endpoints and is uniform in x', () => {
		const pts = sampleSinusoidInterval(2, PI / 3, 0, 1, 10);
		expect(pts).toHaveLength(11);
		expect(pts[0]).toEqual([0, Math.sin(PI / 3)]);
		expect(pts[10][0]).toBeCloseTo(1, 12);
		expect(pts[10][1]).toBeCloseTo(Math.sin(2 + PI / 3), 12);
		const step = pts[1][0] - pts[0][0];
		for (let i = 0; i < pts.length; i++) expect(pts[i][0]).toBeCloseTo(i * step, 12);
	});

	it('rejects invalid inputs', () => {
		expect(() => sampleSinusoidInterval(0, 0, 0, 1, 4)).toThrow();
		expect(() => sampleSinusoidInterval(1, 0, 1, 0, 4)).toThrow();
		expect(() => sampleSinusoidInterval(1, 0, 0, 1, 0)).toThrow();
	});
});

describe('positiveRegions', () => {
	it('A=4, b=0 on [0, 2]: sin(4x) > 0 on (0, π/4) and (π/2, 2)', () => {
		const regions = positiveRegions(4, 0, 0, 2);
		expect(regions).toHaveLength(2);
		expect(regions[0][0]).toBeCloseTo(0, 12);
		expect(regions[0][1]).toBeCloseTo(PI / 4, 12);
		expect(regions[1][0]).toBeCloseTo(PI / 2, 12);
		expect(regions[1][1]).toBeCloseTo(2, 12);
	});

	it('A=1, b=0 on [0, 2π]: a single region [0, π]', () => {
		const regions = positiveRegions(1, 0, 0, 2 * PI);
		expect(regions).toHaveLength(1);
		expect(regions[0][0]).toBeCloseTo(0, 12);
		expect(regions[0][1]).toBeCloseTo(PI, 12);
	});

	it('A=1, b=π on [0, 2π]: the complementary region [π, 2π]', () => {
		const regions = positiveRegions(1, PI, 0, 2 * PI);
		expect(regions).toHaveLength(1);
		expect(regions[0][0]).toBeCloseTo(PI, 12);
		expect(regions[0][1]).toBeCloseTo(2 * PI, 12);
	});

	it('no zero in the window: the whole window if positive, none if negative', () => {
		expect(positiveRegions(0.1, 0, 0, 1)).toEqual([[0, 1]]);
		expect(positiveRegions(0.1, PI, 0, 1)).toEqual([]);
	});

	it('rejects invalid inputs', () => {
		expect(() => positiveRegions(0, 0, 0, 1)).toThrow();
		expect(() => positiveRegions(1, 0, 2, 1)).toThrow();
	});
});
