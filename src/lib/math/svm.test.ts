import { describe, it, expect } from 'vitest';
import {
	dot,
	norm,
	linearKernel,
	polyKernel,
	gaussianKernel,
	gramMatrix,
	pointToHyperplaneDistance,
	marginOfHyperplane,
	functionalMargins,
	slackVariables,
	hingeObjective,
	solveSvmDual,
	makeDecisionFunction,
	minEigenvalueSymmetric,
	zeroContourSegments,
	generateNoisyClasses2D,
	generateRingData,
	generateXorData,
	type KernelFn
} from './svm';
import type { LabeledPoint2D } from './linear-classifier';
import { mulberry32, combineSeed } from './util';

const P = (x1: number, x2: number, label: 1 | -1): LabeledPoint2D => ({ x1, x2, label });

describe('dot / norm', () => {
	it('valeurs fermées', () => {
		expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
		expect(norm([3, 4])).toBe(5);
		expect(norm([0, 0])).toBe(0);
	});
	it('dimensions incompatibles → erreur', () => {
		expect(() => dot([1], [1, 2])).toThrow(/dimensions/);
	});
});

describe('pointToHyperplaneDistance (Proposition « Formulation mathématique »)', () => {
	it('d(x, H) = |⟨w, x⟩ + b| / ‖w‖', () => {
		expect(pointToHyperplaneDistance([3, 4], 0, [1, 0])).toBeCloseTo(0.6, 12);
		expect(pointToHyperplaneDistance([3, 4], 10, [1, 0])).toBeCloseTo(2.6, 12);
		expect(pointToHyperplaneDistance([1, 1], -2, [1, 1])).toBeCloseTo(0, 12);
	});
	it('invariante par re-échelle (w, b) ↦ (kw, kb)', () => {
		expect(pointToHyperplaneDistance([6, 8], 0, [1, 0])).toBeCloseTo(
			pointToHyperplaneDistance([3, 4], 0, [1, 0]),
			12
		);
		expect(pointToHyperplaneDistance([-3, -4], 5, [2, 0])).toBeCloseTo(
			pointToHyperplaneDistance([3, 4], -5, [2, 0]),
			12
		);
	});
	it('‖w‖ = 0 → erreur', () => {
		expect(() => pointToHyperplaneDistance([0, 0], 0, [1, 0])).toThrow(/‖w‖/);
	});
});

describe('marginOfHyperplane / functionalMargins / slackVariables', () => {
	// H : x1 = 1 (w = (1,0), b = −1).
	const w = [1, 0];
	const b = -1;
	const pts = [P(2, 0, 1), P(0, 0, -1), P(1.5, 3, 1), P(0.5, 3, -1)];

	it('marges fonctionnelles exactes', () => {
		expect(functionalMargins(w, b, pts)).toEqual([1, 1, 0.5, 0.5]);
	});

	it('marge γ = distance à l’observation la plus proche', () => {
		expect(marginOfHyperplane(w, b, pts)).toBeCloseTo(0.5, 12);
	});

	it('invariance par re-échelle', () => {
		expect(marginOfHyperplane([2, 0], -2, pts)).toBeCloseTo(0.5, 12);
	});

	it('trois régimes des slack variables (frame « Variable d’ajustement ξi »)', () => {
		const pts2 = [P(2, 0, 1), P(1.2, 0, 1), P(1.5, 3, -1)];
		// m = 1 (ξ = 0), m = 0.2 (0 < ξ ≤ 1), m = −0.5 (ξ > 1, mal classé)
		expect(slackVariables(w, b, pts2)).toEqual([0, 0.8, 1.5]);
	});

	it('jeu vide → erreur', () => {
		expect(() => marginOfHyperplane(w, b, [])).toThrow(/vide/);
	});
});

describe('hingeObjective (eq. optim4)', () => {
	const w = [1, 0];
	const b = -1;
	const pts = [P(2, 0, 1), P(1.5, 3, 1), P(1.5, 3, -1)]; // ξ = 0, 0.5, 1.5

	it('½‖w‖² + C·Σξi', () => {
		expect(hingeObjective(w, b, pts, 2)).toBeCloseTo(0.5 + 2 * 2, 12);
		expect(hingeObjective(w, b, pts, 0)).toBeCloseTo(0.5, 12);
	});
	it('C < 0 → erreur', () => {
		expect(() => hingeObjective(w, b, pts, -1)).toThrow(/C/);
	});
});

describe('solveSvmDual — cas 1D analytique (eq. optim3 / optim5)', () => {
	// Points (1,0,+1) et (−1,0,−1) : l’unique hyperplan de marge maximale est
	// x1 = 0, avec ‖w‖ = 1, b = 0, γ = 1, α1 = α2 = 1/2, f(α*) = 1/2.
	const pts = [P(1, 0, 1), P(-1, 0, -1)];

	it('solution exacte (α = (1/2, 1/2), w = (1,0), b = 0)', () => {
		const sol = solveSvmDual(pts, 10);
		expect(sol.alphas).toEqual([0.5, 0.5]);
		expect(sol.w).toEqual([1, 0]);
		expect(sol.b).toBeCloseTo(0, 9);
		expect(sol.margins).toEqual([1, 1]);
	});

	it('égalité primal-dual (dualité forte, pas de saut de dualité)', () => {
		const sol = solveSvmDual(pts, 10);
		const primal = 0.5 * norm(sol.w) ** 2; // Σξ = 0 (données séparables)
		expect(sol.dualObjective).toBeCloseTo(primal, 9);
		expect(sol.dualObjective).toBeCloseTo(0.5, 9);
	});

	it('fonction de décision sign[Σ αi yi⟨xi, x⟩ + b]', () => {
		const sol = solveSvmDual(pts, 10);
		const f = makeDecisionFunction(sol.alphas, pts, sol.b);
		expect(f([5, 3])).toBeCloseTo(5, 9);
		expect(f([-2, 2])).toBeCloseTo(-2, 9);
		expect(f([0, 0])).toBeCloseTo(0, 9);
	});

	it('determinisme : meme resultat a deux executions', () => {
		const a = solveSvmDual(pts, 10);
		const b2 = solveSvmDual(pts, 10);
		expect(a.alphas).toEqual(b2.alphas);
		expect(a.b).toBe(b2.b);
	});
});

describe('solveSvmDual — vecteurs de support (KKT, eq. optim3)', () => {
	// Deux paires alignées sur la diagonale : les points lointains ne sont pas
	// sur la marge maximale x1 = 0 → leurs α doivent valoir 0.
	const pts = [P(1, 0, 1), P(-1, 0, -1), P(1, 5, 1), P(-1, 5, -1)];

	it('α = 0 hors de la marge, γ = 1, aucune erreur', () => {
		const sol = solveSvmDual(pts, 10);
		expect(sol.supportIndices).toEqual([0, 1]);
		expect(sol.alphas[2]).toBeCloseTo(0, 9);
		expect(sol.alphas[3]).toBeCloseTo(0, 9);
		expect(marginOfHyperplane(sol.w, sol.b, pts)).toBeCloseTo(1, 6);
		expect(sol.misclassifiedIndices).toEqual([]);
	});
});

describe('solveSvmDual — marge souple (eq. optim4 / optim5)', () => {
	// Anneau non séparable linéairement, noyau linéaire, C = 1.
	const pts = generateRingData(10, 20, 1, 2.4);

	it('feasibilite duale : 0 ≤ αi ≤ C et Σ αi yi = 0', () => {
		const sol = solveSvmDual(pts, 1, { tol: 1e-5, maxPasses: 300 });
		for (const a of sol.alphas) {
			expect(a).toBeGreaterThanOrEqual(-1e-9);
			expect(a).toBeLessThanOrEqual(1 + 1e-9);
		}
		const sum = pts.reduce((s, p, i) => s + p.label * sol.alphas[i], 0);
		expect(Math.abs(sum)).toBeLessThan(1e-9);
	});

	it('conditions d’écart complémentaire (KKT)', () => {
		const sol = solveSvmDual(pts, 1, { tol: 1e-5, maxPasses: 300 });
		for (const i of sol.supportIndices) {
			// αi > 0 ⇒ soit mi = 1 (vecteur de support), soit αi = C (outlier).
			expect(sol.margins[i]).toBeLessThanOrEqual(1 + 1e-3);
			expect(sol.margins[i] >= 1 - 1e-3 || sol.alphas[i] > 1 - 1e-6).toBe(true);
		}
	});

	it('égalité primal-dual malgré le relâchement', () => {
		const sol = solveSvmDual(pts, 1, { tol: 1e-5, maxPasses: 300 });
		let slacks = 0;
		for (const m of sol.margins) slacks += Math.max(0, 1 - m);
		const primal = 0.5 * norm(sol.w) ** 2 + slacks;
		expect(sol.dualObjective).toBeCloseTo(primal, 3);
	});

	it('les outliers sont identifiés (ξi > 0)', () => {
		const sol = solveSvmDual(pts, 1, { tol: 1e-5, maxPasses: 300 });
		expect(sol.outlierIndices.length).toBeGreaterThan(0);
		for (const i of sol.outlierIndices) {
			expect(sol.margins[i]).toBeLessThan(1);
		}
	});
});

describe('solveSvmDual — erreurs de validation', () => {
	it('jeu déséquilibré : le dual reste faisable (α = 0) et se résout', () => {
		const sol = solveSvmDual([P(0, 0, 1), P(1, 1, 1), P(2, 2, -1)], 1);
		const sum = [1, 1, -1].reduce((s, y, i) => s + y * sol.alphas[i], 0);
		expect(Math.abs(sum)).toBeLessThan(1e-9);
	});
	it('C ≤ 0 → erreur', () => {
		expect(() => solveSvmDual([P(0, 0, 1), P(1, 1, -1)], 0)).toThrow(/C/);
	});
	it('n < 2 → erreur', () => {
		expect(() => solveSvmDual([P(0, 0, 1)], 1)).toThrow(/2 points/);
	});
});

describe('noyaux (astuce du noyau)', () => {
	const rng = mulberry32(42);
	const x = [rng() * 3 - 1.5, rng() * 3 - 1.5];
	const x2 = [rng() * 3 - 1.5, rng() * 3 - 1.5];

	it('noyau quadratique = produit scalaire dans φ(x) = (1, √2x1, √2x2, x1², x1x2, x2²)', () => {
		// Le terme croisé x1x2 apparaît deux fois dans ⟨x, x̃⟩² → facteur √2.
		const phi = (z: number[]) => [
			1,
			Math.SQRT2 * z[0],
			Math.SQRT2 * z[1],
			z[0] ** 2,
			Math.SQRT2 * z[0] * z[1],
			z[1] ** 2
		];
		// (⟨x, x̃⟩ + 1)² = 1 + 2⟨x, x̃⟩ + ⟨x, x̃⟩² — le calcul direct coûte O(d²),
		// le noyau O(d) (frame « L'astuce du noyau »).
		expect(polyKernel(x, x2, 2, 1)).toBeCloseTo(dot(phi(x), phi(x2)), 9);
	});

	it('noyaux usuels : symétrie, K(x, x) = 1 pour le gaussien', () => {
		expect(linearKernel(x, x2)).toBeCloseTo(linearKernel(x2, x), 12);
		expect(gaussianKernel(x, x2, 0.5)).toBeCloseTo(gaussianKernel(x2, x, 0.5), 12);
		expect(gaussianKernel(x, x, 0.5)).toBeCloseTo(1, 12);
		expect(gaussianKernel(x, x2, 2)).toBeLessThan(gaussianKernel(x, x2, 0.1));
	});

	it('paramètres invalides → erreurs', () => {
		expect(() => polyKernel(x, x2, 0)).toThrow(/degree/);
		expect(() => polyKernel(x, x2, 2.5)).toThrow(/degree/);
		expect(() => polyKernel(x, x2, 2, -1)).toThrow(/coef0/);
		expect(() => gaussianKernel(x, x2, 0)).toThrow(/gamma/);
	});

	it('matrice de Gram symétrique', () => {
		const pts = [x, x2, [0.3, -0.7]];
		const M = gramMatrix(pts, (a, b) => polyKernel(a, b, 3, 0.5));
		for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
			expect(M[i][j]).toBeCloseTo(M[j][i], 12);
		}
	});
});

describe('PSD et Moore–Aronszajn (minEigenvalueSymmetric)', () => {
	it('valeurs propres exactes sur des petites matrices', () => {
		expect(minEigenvalueSymmetric([[2, 1], [1, 2]])).toBeCloseTo(1, 7);
		expect(minEigenvalueSymmetric([[4, 1, 0], [1, 3, 0], [0, 0, 2]])).toBeCloseTo(2, 7);
		expect(minEigenvalueSymmetric([[5]])).toBeCloseTo(5, 9);
	});

	it('matrice non carrée → erreur', () => {
		expect(() => minEigenvalueSymmetric([[1, 2]] as unknown as number[][])).toThrow(/carrée/);
	});

	// 6 points aléatoires de ℝ², déterministes.
	const rng = mulberry32(combineSeed(7, 1));
	const pts = Array.from({ length: 6 }, () => [rng() * 4 - 2, rng() * 4 - 2]);

	it('noyaux valides : matrice de Gram PSD', () => {
		// ⟨x,x̃⟩³ (c = 0) EST valide : par développement multinomial c'est une
		// somme de noyaux de rang 1 à coefficients positifs,
		// φ(x) = (x₁³, √3 x₁²x₂, √3 x₁x₂², x₂³) ∈ ℝ⁴.
		const kernels: [string, KernelFn][] = [
			['linéaire', linearKernel],
			['quadratique (c = 1)', (a, b) => polyKernel(a, b, 2, 1)],
			['polynomial d = 3', (a, b) => polyKernel(a, b, 3, 0.5)],
			['cubique (c = 0)', (a, b) => Math.pow(linearKernel(a, b), 3)],
			['gaussien (γ = 0.5)', (a, b) => gaussianKernel(a, b, 0.5)]
		];
		for (const [name, K] of kernels) {
			const minEv = minEigenvalueSymmetric(gramMatrix(pts, K));
			expect(minEv, `noyau ${name} PSD`).toBeGreaterThanOrEqual(-1e-7);
		}
	});

	it('fonction non PSD : plus petite valeur propre négative', () => {
		// K = −⟨x,x̃⟩ : la diagonale de la matrice de Gram vaut −‖x_i‖² < 0
		// (points non nuls) → non PSD.
		const negLinear: KernelFn = (a, b) => -linearKernel(a, b);
		expect(minEigenvalueSymmetric(gramMatrix(pts, negLinear))).toBeLessThan(0);
	});
});

describe('zeroContourSegments (frontières de décision)', () => {
	it('f(x, y) = x : la courbe de niveau 0 est la droite x = 0', () => {
		const segs = zeroContourSegments(x => x, [
			[-1, 1],
			[-1, 1]
		], 40);
		expect(segs.length).toBeGreaterThan(10);
		for (const s of segs) {
			expect(Math.abs(s.x1)).toBeLessThan(1e-9);
			expect(Math.abs(s.x2)).toBeLessThan(1e-9);
		}
		const ys = segs.flatMap((s) => [s.y1, s.y2]);
		expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(1);
	});

	it('f(x, y) = x² + y² − 1 : cercle de rayon 1', () => {
		const segs = zeroContourSegments((x, y) => x * x + y * y - 1, [
			[-2, 2],
			[-2, 2]
		], 80);
		expect(segs.length).toBeGreaterThan(50);
		for (const s of segs) {
			for (const [px, py] of [
				[s.x1, s.y1],
				[s.x2, s.y2]
			]) {
				expect(Math.hypot(px, py)).toBeCloseTo(1, 1);
			}
		}
	});

	it('res < 2 → erreur', () => {
		expect(() => zeroContourSegments(x => x, [
			[-1, 1],
			[-1, 1]
		], 1)).toThrow(/res/);
	});
});

describe('générateurs de données (déterministes)', () => {
	it('generateNoisyClasses2D : cardinal, classes équilibrées, déterminisme', () => {
		const a = generateNoisyClasses2D(15);
		const b = generateNoisyClasses2D(15);
		const c = generateNoisyClasses2D(15, 3, 1, 99);
		expect(a).toHaveLength(30);
		expect(a.filter((p) => p.label === 1)).toHaveLength(15);
		expect(a).toEqual(b);
		expect(a).not.toEqual(c);
	});

	it('generateRingData : géométrie de l’anneau', () => {
		const pts = generateRingData(10, 20, 1, 2.6);
		expect(pts).toHaveLength(30);
		for (const p of pts) {
			const r = Math.hypot(p.x1, p.x2);
			if (p.label === 1) expect(r).toBeLessThanOrEqual(1 + 1e-12);
			else expect(r).toBeGreaterThanOrEqual(1 - 1e-12);
			expect(r).toBeLessThanOrEqual(2.6 + 1e-12);
		}
	});

	it('generateXorData : étiquettes par quadrants', () => {
		const pts = generateXorData(5);
		expect(pts).toHaveLength(20);
		for (const p of pts) {
			expect(Math.sign(p.x1 * p.x2)).toBe(p.label);
		}
	});

	it('paramètres invalides → erreurs', () => {
		expect(() => generateNoisyClasses2D(0)).toThrow(/nPerClass/);
		expect(() => generateNoisyClasses2D(5, 3, 0)).toThrow(/sigma/);
		expect(() => generateRingData(5, 5, 2, 1)).toThrow(/rOuter/);
		expect(() => generateXorData(0)).toThrow(/nPerQuadrant/);
	});
});
