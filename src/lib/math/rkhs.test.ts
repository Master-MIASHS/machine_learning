import { describe, it, expect } from 'vitest';
import {
	assertPsd,
	krrSolve,
	krrFitted,
	krrHilbertNormSq,
	krrObjective,
	krrPredictAt,
	krrTarget1D,
	generateKrrDataset1D,
	krrGram1D
} from './rkhs';
import { invert, matVec } from './util';
import { ridgeSolver } from './regression';
import { minEigenvalueSymmetric } from './svm';

// ─── krrSolve : forme close α⋆ = (K + nλI)⁻¹y (leçon expert RKHS, E.6) ────

const K2 = (rho: number): number[][] => [
	[1, rho],
	[rho, 1]
];

describe('krrSolve', () => {
	it('cas 2×2 à la main : α⋆ = (1+2λ+ρ)/D · (1, −1)', () => {
		const rho = 0.3;
		const lambda = 0.1;
		const y = [1, -1];
		const alpha = krrSolve(K2(rho), y, lambda);
		const D = (1 + 2 * lambda) ** 2 - rho ** 2;
		const a = (1 + 2 * lambda + rho) / D;
		expect(alpha[0]).toBeCloseTo(a, 12);
		expect(alpha[1]).toBeCloseTo(-a, 12);
	});
	it('coïncide avec (K + nλI)⁻¹y calculé par inversion directe', () => {
		const { x, y } = generateKrrDataset1D(20, 42);
		const K = krrGram1D(x, 'gaussien', 0.2);
		const lambda = 0.05;
		const alpha = krrSolve(K, y, lambda);
		const n = x.length;
		const A = K.map((row, i) => row.map((v, j) => (i === j ? v + n * lambda : v)));
		const alphaRef = matVec(invert(A), y);
		for (let i = 0; i < n; i++) expect(alpha[i]).toBeCloseTo(alphaRef[i], 10);
	});
	it('λ → 0⁺ : interpolation exacte 2×2 (Kα → y)', () => {
		// Cas analytique : K = [[1,ρ],[ρ,1]], y = (1,−1) ⇒ K⁻¹y = (1/(1−ρ))(1,−1),
		// donc Kα → (1,−1) = y.
		const rho = 0.3;
		const alpha = krrSolve(K2(rho), [1, -1], 1e-12);
		const fitted = krrFitted(alpha, K2(rho));
		expect(fitted[0]).toBeCloseTo(1, 8);
		expect(fitted[1]).toBeCloseTo(-1, 8);
	});
	it('λ → 0⁺ : l’écart d’interpolation décroît quand λ décroît (1D)', () => {
		const { x, y } = generateKrrDataset1D(15, 7);
		const K = krrGram1D(x, 'gaussien', 0.15);
		const maxErr = (lambda: number) =>
			Math.max(...krrFitted(krrSolve(K, y, lambda), K).map((f, i) => Math.abs(f - y[i])));
		const errPetit = maxErr(1e-4);
		const errGrand = maxErr(0.1);
		expect(errPetit).toBeLessThan(errGrand);
		expect(errPetit).toBeLessThan(0.25);
	});
	it('λ → ∞ : α → 0 et ‖f⋆‖² → 0', () => {
		const { x, y } = generateKrrDataset1D(15, 7);
		const K = krrGram1D(x, 'gaussien', 0.15);
		const alpha = krrSolve(K, y, 1e6);
		for (const a of alpha) expect(Math.abs(a)).toBeLessThan(1e-5);
		expect(krrHilbertNormSq(alpha, K)).toBeLessThan(1e-8);
	});
	it('λ ≤ 0 → erreur', () => {
		expect(() => krrSolve(K2(0.3), [1, -1], 0)).toThrow(/lambda/);
		expect(() => krrSolve(K2(0.3), [1, -1], -1)).toThrow(/lambda/);
	});
	it('K non PSD → erreur (points en double non gérés par un K quelconque)', () => {
		expect(() => krrSolve([[1, 2], [2, 1]], [1, -1], 0.1)).toThrow(/PSD/);
	});
	it('dimensions incohérentes → erreur', () => {
		expect(() => krrSolve(K2(0.3), [1], 0.1)).toThrow(/dimensions/);
		expect(() => krrSolve([[1]], [1, 2], 0.1)).toThrow(/dimensions/);
		expect(() => krrSolve([], [], 0.1)).toThrow(/vide/);
	});
	it('K singulière (points en double) : le système reste bien posé', () => {
		// x₁ = x₂ ⇒ K = [[1,1],[1,1]] (rang 1) : K + nλI inversible.
		const K = [
			[1, 1],
			[1, 1]
		];
		const y = [1, -1];
		const lambda = 1;
		const alpha = krrSolve(K, y, lambda);
		// (K + 2I)α = y ⇒ α = (1/(2·1))·(1,−1)… vérification directe :
		expect(krrFitted(alpha, K)).toEqual([0, 0]); // prédictions nulles (symétrie)
		expect(() => krrHilbertNormSq(alpha, K)).not.toThrow();
	});
});

// ─── krrFitted / krrHilbertNormSq ──────────────────────────────────────────

describe('krrFitted / krrHilbertNormSq', () => {
	it('fitted = Kα (calcul direct)', () => {
		const K = K2(0.5);
		const alpha = [0.3, -0.2];
		const fitted = krrFitted(alpha, K);
		expect(fitted[0]).toBeCloseTo(0.3 * 1 + 0.5 * -0.2, 12);
		expect(fitted[1]).toBeCloseTo(0.5 * 0.3 + -0.2 * 1, 12);
	});
	it('‖f⋆‖² exact 2×2 : 2(1−ρ)a² avec a = (1+2λ+ρ)/D', () => {
		const rho = 0.3;
		const lambda = 0.1;
		const alpha = krrSolve(K2(rho), [1, -1], lambda);
		const D = (1 + 2 * lambda) ** 2 - rho ** 2;
		const a = (1 + 2 * lambda + rho) / D;
		expect(krrHilbertNormSq(alpha, K2(rho))).toBeCloseTo(2 * (1 - rho) * a * a, 10);
	});
	it('identité ‖f⋆‖² = αᵀy − nλ‖α‖² (issue de Kα⋆ = y − nλα⋆)', () => {
		const { x, y } = generateKrrDataset1D(12, 3);
		const K = krrGram1D(x, 'gaussien', 0.18);
		const lambda = 0.2;
		const n = x.length;
		const alpha = krrSolve(K, y, lambda);
		let alphaTy = 0;
		let alphaNormSq = 0;
		for (let i = 0; i < n; i++) {
			alphaTy += alpha[i] * y[i];
			alphaNormSq += alpha[i] * alpha[i];
		}
		expect(krrHilbertNormSq(alpha, K)).toBeCloseTo(alphaTy - n * lambda * alphaNormSq, 8);
	});
	it('‖f⋆‖² ≥ 0 pour un Gram gaussien 1D (PSD)', () => {
		const { x, y } = generateKrrDataset1D(25, 11);
		const K = krrGram1D(x, 'gaussien', 0.1);
		const alpha = krrSolve(K, y, 0.01);
		expect(krrHilbertNormSq(alpha, K)).toBeGreaterThanOrEqual(-1e-12);
	});
	it('longueurs inégales → erreur', () => {
		expect(() => krrFitted([1], K2(0.3))).toThrow(/longueurs/);
		expect(() => krrHilbertNormSq([1], K2(0.3))).toThrow(/longueurs/);
	});
});

// ─── krrObjective ──────────────────────────────────────────────────────────

describe('krrObjective', () => {
	it('valeur minimale = λ·yᵀ(K + nλI)⁻¹y (identité vérifiée)', () => {
		const { x, y } = generateKrrDataset1D(10, 5);
		const K = krrGram1D(x, 'gaussien', 0.2);
		const lambda = 0.3;
		const n = x.length;
		const alpha = krrSolve(K, y, lambda);
		const A = K.map((row, i) => row.map((v, j) => (i === j ? v + n * lambda : v)));
		let yMinvY = 0;
		const alpha2 = invert(A).map((row) => matVec([row], y)[0]);
		for (let i = 0; i < n; i++) yMinvY += y[i] * alpha2[i];
		expect(krrObjective(alpha, K, y, lambda)).toBeCloseTo(lambda * yMinvY, 8);
	});
	it('à la solution ≤ objectif en α = 0 (= (1/n)‖y‖²) — minimiseur global', () => {
		const { x, y } = generateKrrDataset1D(14, 9);
		const K = krrGram1D(x, 'gaussien', 0.15);
		for (const lambda of [0.001, 0.1, 10]) {
			const alpha = krrSolve(K, y, lambda);
			const zero = y.reduce((s, v) => s + v * v, 0) / y.length;
			expect(krrObjective(alpha, K, y, lambda)).toBeLessThanOrEqual(zero + 1e-12);
		}
	});
	it('longueurs inégales / λ ≤ 0 → erreur', () => {
		const K = K2(0.3);
		expect(() => krrObjective([1], K, [1, -1], 0.1)).toThrow(/longueurs/);
		expect(() => krrObjective([1, 1], K, [1, -1], 0)).toThrow(/lambda/);
	});
});

// ─── Pont ridge : KRR linéaire = ridge de paramètre nλ (bloc 5.3) ─────────

describe('pont ridge (KRR à noyau linéaire = ridge du cours)', () => {
	it('prédictions KRR(linéaire, λ) = prédictions ridge(X, nλ)', () => {
		// X 12×3 déterministe (sans PRNG : lignes fixes).
		const X: number[][] = [];
		for (let i = 0; i < 12; i++) {
			X.push([
				Math.sin(0.7 * i + 0.3),
				Math.cos(1.3 * i - 0.5),
				0.5 * i - 2.5
			]);
		}
		const y = X.map((row, i) => 1.2 * row[0] - 0.8 * row[1] + 0.3 * row[2] + (i % 3) * 0.1);
		const lambda = 0.25;
		const n = X.length;
		// Gram K = XXᵀ via le noyau linéaire sur les lignes.
		const K = X.map((a) => X.map((b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
		const alpha = krrSolve(K, y, lambda);
		const fittedKrr = krrFitted(alpha, K);
		const beta = ridgeSolver(X, y, n * lambda);
		const fittedRidge = X.map((row) => row[0] * beta[0] + row[1] * beta[1] + row[2] * beta[2]);
		for (let i = 0; i < n; i++) expect(fittedKrr[i]).toBeCloseTo(fittedRidge[i], 8);
	});
});

// ─── krrPredictAt ──────────────────────────────────────────────────────────

describe('krrPredictAt', () => {
	it('aux points d’entraînement : f⋆(xᵢ) = (Kα)ᵢ', () => {
		const { x, y } = generateKrrDataset1D(10, 21);
		const sigma = 0.15;
		const K = krrGram1D(x, 'gaussien', sigma);
		const alpha = krrSolve(K, y, 0.1);
		const fitted = krrFitted(alpha, K);
		for (let i = 0; i < x.length; i++) {
			expect(krrPredictAt((a, b) => Math.exp(-((a[0] - b[0]) ** 2) / (2 * sigma * sigma)), [x[i]], x.map((v) => [v]), alpha)).toBeCloseTo(
				fitted[i],
				10
			);
		}
	});
	it('longueurs inégales → erreur', () => {
		expect(() => krrPredictAt((a, b) => a[0] * b[0], [1], [[1], [2]], [1])).toThrow(
			/longueurs/
		);
	});
});

// ─── generateKrrDataset1D / krrGram1D ─────────────────────────────────────

describe('generateKrrDataset1D', () => {
	it('déterministe : même seed ⇒ même jeu, seed différent ⇒ jeu différent', () => {
		const a = generateKrrDataset1D(16, 99);
		const b = generateKrrDataset1D(16, 99);
		const c = generateKrrDataset1D(16, 100);
		expect(a.x).toEqual(b.x);
		expect(a.y).toEqual(b.y);
		expect(a.x).not.toEqual(c.x);
	});
	it('x triées sur [0,1], y = f⋆(x) + bruit borné', () => {
		const { x, y, fStar } = generateKrrDataset1D(40, 5);
		for (let i = 1; i < x.length; i++) expect(x[i]).toBeGreaterThanOrEqual(x[i - 1]);
		expect(x[0]).toBeGreaterThanOrEqual(0);
		expect(x[x.length - 1]).toBeLessThanOrEqual(1);
		for (let i = 0; i < x.length; i++) {
			expect(Math.abs(y[i] - fStar(x[i]))).toBeLessThan(1); // 0.1·N(0,1)
			expect(Number.isFinite(y[i])).toBe(true);
		}
	});
	it('fStar = 2 sin(2πt) + ½ cos(4πt) — valeurs fermées', () => {
		expect(krrTarget1D(0)).toBeCloseTo(0.5, 12);
		expect(krrTarget1D(0.25)).toBeCloseTo(2 + 0.5 * Math.cos(Math.PI), 12); // 1.5
	});
	it('n < 2 ou non entier → erreur', () => {
		expect(() => generateKrrDataset1D(1, 1)).toThrow(/n doit/);
		expect(() => generateKrrDataset1D(2.5, 1)).toThrow(/n doit/);
	});
});

describe('krrGram1D', () => {
	it('gaussien : diagonale 1, symétrie, PSD', () => {
		const x = [0.1, 0.3, 0.7, 0.9];
		const K = krrGram1D(x, 'gaussien', 0.2);
		for (let i = 0; i < x.length; i++) {
			expect(K[i][i]).toBeCloseTo(1, 12);
			for (let j = 0; j < x.length; j++) expect(K[i][j]).toBeCloseTo(K[j][i], 12);
		}
		expect(minEigenvalueSymmetric(K)).toBeGreaterThanOrEqual(-1e-8);
	});
	it('linéaire : K = xxᵀ (colonne)', () => {
		const x = [0.1, -0.4, 0.8];
		const K = krrGram1D(x, 'lineaire');
		for (let i = 0; i < x.length; i++)
			for (let j = 0; j < x.length; j++) expect(K[i][j]).toBeCloseTo(x[i] * x[j], 12);
	});
	it('sigma ≤ 0 (gaussien) → erreur ; x vide → erreur', () => {
		expect(() => krrGram1D([0.1, 0.2], 'gaussien', 0)).toThrow(/sigma/);
		expect(() => krrGram1D([], 'lineaire')).toThrow(/vide/);
	});
});

// ─── Garde numérique : le contrôle PSD tolère les Grams de la démo (n ≤ 80) ─

describe('garde numérique (démo E.7, cas extrêmes)', () => {
	it('krrSolve ne rejette pas les Grams gaussiens de la démo (n jusqu’à 80, σ ≥ 0.02)', () => {
		// Le contrôle PSD (Jacobi) doit classer ces Grams PSD malgré le
		// conditionnement dégradé (points proches de l'échelle σ).
		for (const [n, sigma] of [
			[80, 0.02],
			[80, 0.15],
			[40, 0.02]
		] as const) {
			const { x, y } = generateKrrDataset1D(n, 42);
			const K = krrGram1D(x, 'gaussien', sigma);
			const alpha = krrSolve(K, y, 0.1);
			for (const a of alpha) expect(Number.isFinite(a)).toBe(true);
			expect(krrHilbertNormSq(alpha, K)).toBeGreaterThanOrEqual(-1e-9);
		}
	});
	it('valeurs de référence à la configuration par défaut de la démo (n=20, σ=0.15, λ=0.1)', () => {
		const { x, y } = generateKrrDataset1D(20, 42);
		const K = krrGram1D(x, 'gaussien', 0.15);
		const alpha = krrSolve(K, y, 0.1);
		// Stabilité : même valeur sur deux appels (déterminisme), plage
		// raisonnable pour l'affichage (pas d'explosion numérique).
		const alpha2 = krrSolve(K, y, 0.1);
		for (let i = 0; i < alpha.length; i++) expect(alpha[i]).toBe(alpha2[i]);
		expect(krrHilbertNormSq(alpha, K)).toBeGreaterThan(0);
		expect(krrHilbertNormSq(alpha, K)).toBeLessThan(1e4);
		const fitted = krrFitted(alpha, K);
		const mse = fitted.reduce((s, f, i) => s + (f - y[i]) ** 2, 0) / fitted.length;
		expect(mse).toBeGreaterThan(0);
		expect(mse).toBeLessThan(10);
	});
});

// ─── Invariant : ‖f⋆(λ)‖² strictement décroissant en λ (exercice 2) ──────

describe('invariant : décroissance de ‖f⋆‖²_{H_K} en λ', () => {
	it('h(λ) strictement décroissant pour K ≠ 0 et y ≠ 0', () => {
		const { x, y } = generateKrrDataset1D(18, 13);
		const K = krrGram1D(x, 'gaussien', 0.15);
		const grid = [1e-4, 1e-3, 1e-2, 0.1, 1, 10, 100];
		let prev = Infinity;
		for (const lambda of grid) {
			const alpha = krrSolve(K, y, lambda);
			const h = krrHilbertNormSq(alpha, K);
			expect(h).toBeLessThan(prev);
			prev = h;
		}
	});
});

// ─── assertPsd ─────────────────────────────────────────────────────────────

describe('assertPsd', () => {
	it('accepte une matrice PSD, rejette non carrée / non PSD', () => {
		expect(() => assertPsd([[1, 0.5], [0.5, 1]])).not.toThrow();
		expect(() => assertPsd([[1, 2], [2, 1]])).toThrow(/PSD/);
		expect(() => assertPsd([[1, 2, 3]])).toThrow(/carrée/);
	});
});
