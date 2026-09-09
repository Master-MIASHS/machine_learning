import { describe, it, expect } from 'vitest';
import {
	adjustedRSquared,
	anovaDesign,
	ancovaDesign,
	ar1Correlation,
	ar1Samples,
	aic,
	anovaTable,
	backwardSelection,
	bestSubset,
	bic,
	cooksDistance,
	conditionNumber,
	correlatedPredictors,
	covarianceBeta,
	correlationMatrix,
	deletedResidual,
	fQuantile,
	forwardSelection,
	glsClosedForm,
	glsSigma2,
	glsVarianceBeta,
	hatMatrix,
	interpolatingPolynomialBeta,
	leverages,
	mallowCp,
	meanResponseInterval,
	nestedFTest,
	olsFit,
	olsVarianceWithCorrelation,
	partialResiduals,
	polynomialDesign,
	polynomialFamily,
	polynomialTestMSE,
	polyValue,
	predictionInterval,
	predictionLeverage,
	press,
	repeatedSlopeIntervals,
	repeatedSlopeSamples,
	rSquared,
	selectionProblem,
	simulateResidualScenario,
	sseSimple,
	standardizedResiduals,
	studentizedResiduals,
	stepwiseBoth,
	sumsOfSquares,
	tConfidenceInterval,
	tDensity,
	tQuantile,
	twoFactorData,
	twoWayAnovaDesign,
	varBetaJ,
	vif,
	withIntercept
} from './linear-model';
import { olsClosedForm } from './regression';
import { gaussianSample } from './gaussian';
import { combineSeed, invert, linspace, matMul, matVec, mulberry32, transpose } from './util';
import { bienEtre, longley, prostate, swiss, designMatrix, responseVector } from '../data/linear-regression';

// Helpers to refit leave-one-out models (brute-force ground truth for the
// hat-matrix shortcuts).
function looRefit(X: number[][], y: number[], drop: number) {
	const rows = X.filter((_, i) => i !== drop);
	const rowsY = y.filter((_, i) => i !== drop);
	const beta = olsClosedForm(rows, rowsY);
	const yHatAll = X.map((row) => row.reduce((a, b, j) => a + b * beta[j], 0));
	const residAll = y.map((yi, i) => yi - yHatAll[i]);
	return { beta, yHat: yHatAll, resid: residAll };
}

describe('Design matrices (ModèleLinéaire_ANOVA_ANCOVA.pdf)', () => {
	it('withIntercept prepends a column of 1s', () => {
		const X = withIntercept([
			[1, 2],
			[3, 4]
		]);
		expect(X).toEqual([
			[1, 1, 2],
			[1, 3, 4]
		]);
	});

	it('polynomialDesign builds [1, x, x², …]', () => {
		const X = polynomialDesign([0, 1, 2], 3);
		expect(X).toEqual([
			[1, 0, 0, 0],
			[1, 1, 1, 1],
			[1, 2, 4, 8]
		]);
		expect(() => polynomialDesign([1], -1)).toThrow();
	});

	const levels = [0, 0, 1, 1, 1, 2, 2];
	const yByLevel = [10, 10.5, 20, 19.5, 21, 30, 29.5];
	const levelMeans = (yHat: number[]) => {
		const acc: Record<number, { s: number; c: number }> = {};
		levels.forEach((l, i) => {
			acc[l] ??= { s: 0, c: 0 };
			acc[l].s += yHat[i];
			acc[l].c += 1;
		});
		return [acc[0].s / acc[0].c, acc[1].s / acc[1].c, acc[2].s / acc[2].c];
	};

	it('the three codings give identical fitted level means (unbalanced)', () => {
		for (const coding of ['none', 'treatment', 'sum'] as const) {
			const fit = olsFit(anovaDesign(levels, coding), yByLevel);
			const [m0, m1, m2] = levelMeans(fit.yHat);
			expect(m0).toBeCloseTo(10.25, 10);
			expect(m1).toBeCloseTo(20 + 1 / 6, 10);
			expect(m2).toBeCloseTo(29.75, 10);
		}
	});

	it('treatment coding: β0 = mean of level 1, βj = deviation from level 1', () => {
		const fit = olsFit(anovaDesign(levels, 'treatment'), yByLevel);
		expect(fit.beta[0]).toBeCloseTo(10.25, 10);
		expect(fit.beta[1]).toBeCloseTo(20 + 1 / 6 - 10.25, 10);
		expect(fit.beta[2]).toBeCloseTo(29.75 - 10.25, 10);
	});

	it('sum coding on a balanced design: β0 = grand mean, β0+βj = level mean', () => {
		const balLevels = [0, 0, 1, 1, 2, 2];
		const balY = [10, 12, 20, 22, 30, 28];
		const fit = olsFit(anovaDesign(balLevels, 'sum'), balY);
		expect(fit.beta[0]).toBeCloseTo(122 / 6, 10); // grand mean (balanced ⇒ unweighted = weighted)
		expect(fit.beta[0] + fit.beta[1]).toBeCloseTo(11, 10); // level 0 mean (col 0 = +1)
		expect(fit.beta[0] + fit.beta[2]).toBeCloseTo(21, 10); // level 1 mean (col 1 = +1)
		expect(fit.beta[0] - fit.beta[1] - fit.beta[2]).toBeCloseTo(29, 10); // last level: every col = −1
	});

	it('none coding: βj = mean of the response at level j (no intercept)', () => {
		const fit = olsFit(anovaDesign(levels, 'none'), yByLevel);
		expect(fit.beta).toHaveLength(3);
		expect(fit.beta[0]).toBeCloseTo(10.25, 10);
		expect(fit.beta[1]).toBeCloseTo(20 + 1 / 6, 10);
		expect(fit.beta[2]).toBeCloseTo(29.75, 10);
	});

	it('twoWayAnovaDesign: main effects + interaction rows (reference coding α1 = β1 = 0)', () => {
		// columns: [1, α2, α3, β2]
		const X = twoWayAnovaDesign([0, 0, 1, 1, 2, 2], [0, 1, 0, 1, 0, 1], false);
		expect(X).toEqual([
			[1, 0, 0, 0],
			[1, 0, 0, 1],
			[1, 1, 0, 0],
			[1, 1, 0, 1],
			[1, 0, 1, 0],
			[1, 0, 1, 1]
		]);
		// with interaction: columns [1, α2, α3, β2, γ(1,1), γ(2,1)] — γi1 = γ1j = 0
		const Xi = twoWayAnovaDesign([0, 1, 1, 2], [0, 0, 1, 1], true);
		expect(Xi).toEqual([
			[1, 0, 0, 0, 0, 0],
			[1, 1, 0, 0, 0, 0],
			[1, 1, 0, 1, 1, 0],
			[1, 0, 1, 1, 0, 1]
		]);
	});

	it('ancovaDesign: parallel vs interacting slopes', () => {
		const X = ancovaDesign([0, 0, 1, 1], [1, 2, 3, 4], false);
		expect(X).toEqual([
			[1, 0, 1],
			[1, 0, 2],
			[1, 1, 3],
			[1, 1, 4]
		]);
		const Xi = ancovaDesign([0, 0, 1, 1], [1, 2, 3, 4], true);
		expect(Xi).toEqual([
			[1, 0, 1, 0],
			[1, 0, 2, 0],
			[1, 1, 3, 3],
			[1, 1, 4, 4]
		]);
	});
});

describe('OLS core — bien-être fixture (StatM1S1_2025.pdf p. 15–19)', () => {
	const fit = olsFit(designMatrix(bienEtre), responseVector(bienEtre));

	it('β̂ = (3.2195, −12.0562, 0.5803, 0.6411)', () => {
		expect(fit.beta[0]).toBeCloseTo(3.2195, 4);
		expect(fit.beta[1]).toBeCloseTo(-12.0562, 4);
		expect(fit.beta[2]).toBeCloseTo(0.5803, 4);
		expect(fit.beta[3]).toBeCloseTo(0.6411, 4);
	});

	it('σ̂² = SCR/(n−p−1) = 16.8852', () => {
		expect(fit.sse).toBeCloseTo(16.8852 * 6, 2);
		expect(fit.sigma2).toBeCloseTo(16.8852, 4);
	});

	it('predicts 40.6297 at (1, 30, 50) — 40.6273 in the PDF uses the rounded β̂', () => {
		const v0 = [1, 1, 30, 50];
		const exact = v0.reduce((a, b, j) => a + b * fit.beta[j], 0);
		const fromRounded = 3.2195 - 12.0562 * 1 + 0.5803 * 30 + 0.6411 * 50;
		expect(exact).toBeCloseTo(40.6297, 4);
		expect(fromRounded).toBeCloseTo(40.6273, 4); // the PDF's value
	});
});

describe('OLS core — longley fixture (StatM1S1_2025.pdf p. 29–32)', () => {
	const fit = olsFit(designMatrix(longley), responseVector(longley));

	it('β̂ = (120.0801, 0.0882, −0.7570)', () => {
		expect(fit.beta[0]).toBeCloseTo(120.0801, 4);
		expect(fit.beta[1]).toBeCloseTo(0.0882, 4);
		expect(fit.beta[2]).toBeCloseTo(-0.757, 4);
	});

	it('σ̂² = ‖ε̂‖²/(n−p−1) = 0.2563 (SCR = 1.2814)', () => {
		expect(fit.sse).toBeCloseTo(1.2814, 3);
		expect(fit.sigma2).toBeCloseTo(0.2563, 4);
	});

	it('standard errors (26.8533, 0.0262, 0.3167)', () => {
		expect(fit.seBeta[0]).toBeCloseTo(26.8533, 3);
		expect(fit.seBeta[1]).toBeCloseTo(0.0262, 3);
		expect(fit.seBeta[2]).toBeCloseTo(0.3167, 3);
	});

	it('T = (4.471, 3.369, −2.391) up to the PDF’s rounding', () => {
		// The PDF's first value (4.471) truncates 4.4717; the others round to 3 decimals.
		expect(fit.tStats[0]).toBeCloseTo(4.471, 2);
		expect(fit.tStats[1]).toBeCloseTo(3.369, 3);
		expect(fit.tStats[2]).toBeCloseTo(-2.391, 3);
	});

	it('t5(97.5 %) = 2.57058', () => {
		expect(tQuantile(0.975, 5)).toBeCloseTo(2.57058, 4);
	});

	it('IC(β1) = [0.02089 ; 0.15547]', () => {
		const [lo, hi] = tConfidenceInterval(fit.beta[1], fit.seBeta[1], 0.05, fit.dfResidual);
		expect(lo).toBeCloseTo(0.02089, 3);
		expect(hi).toBeCloseTo(0.15547, 3);
	});
});

describe('OLS core — swiss fixture (StatM1S1_2025.pdf p. 4–5)', () => {
	const y = responseVector(swiss);
	const cols = designMatrix(swiss, false);

	it('the 4 simple regressions reproduce the PDF table', () => {
		const expected: [number, number, number][] = [
			[60.3, 0.194, 0.1247],
			[79.6, -0.862, 0.4406],
			[64.4, 0.139, 0.215],
			[34.5, 1.787, 0.1735]
		];
		for (let j = 0; j < 4; j++) {
			const fit = olsFit(withIntercept(cols.map((r) => [r[j]])), y);
			expect(fit.beta[0]).toBeCloseTo(expected[j][0], 1);
			// j = 3: the PDF prints 1.787 for R's 1.7864859737 (looser rounding there).
			expect(fit.beta[1]).toBeCloseTo(expected[j][1], j === 3 ? 2 : 3);
			expect(fit.rSquared).toBeCloseTo(expected[j][2], 4);
		}
	});

	it('multiple regression: β̂ and adjusted R² = 0.6707', () => {
		const fit = olsFit(designMatrix(swiss), y);
		expect(fit.beta[0]).toBeCloseTo(62.1, 1);
		expect(fit.beta[1]).toBeCloseTo(-0.155, 3);
		expect(fit.beta[2]).toBeCloseTo(-0.98, 2);
		expect(fit.beta[3]).toBeCloseTo(0.125, 3);
		expect(fit.beta[4]).toBeCloseTo(1.078, 3);
		expect(fit.adjustedRSquared).toBeCloseTo(0.6707, 4);
	});

	it('R² is monotone in the model dimension (nested subsets)', () => {
		let previous = 0;
		for (const size of [1, 2, 3, 4]) {
			const design = withIntercept(cols.map((r) => r.slice(0, size)));
			const r2 = olsFit(design, y).rSquared;
			expect(r2).toBeGreaterThanOrEqual(previous - 1e-12);
			previous = r2;
		}
	});
});

describe('Sums of squares and R² invariants (StatM1S1_2025.pdf §5)', () => {
	const X = designMatrix(swiss);
	const y = responseVector(swiss);
	const fit = olsFit(X, y);

	it('SCT = SCE + SCR', () => {
		const { scr, sce, sct } = sumsOfSquares(y, fit.yHat);
		expect(sct).toBeCloseTo(sce + scr, 10);
		expect(fit.sst).toBeCloseTo(fit.sseExplained + fit.sse, 10);
	});

	it('R² = 1 − SCR/SCT and the adjusted form', () => {
		expect(rSquared(fit.sst, fit.sse)).toBeCloseTo(fit.rSquared, 12);
		expect(adjustedRSquared(fit.rSquared, fit.n, fit.p)).toBeCloseTo(fit.adjustedRSquared, 12);
	});

	it('σ̂²MV = σ̂²·(n−p−1)/n (Théorème 2, biased)', () => {
		expect(fit.sigma2MV).toBeCloseTo((fit.sigma2 * (fit.n - fit.p - 1)) / fit.n, 12);
	});

	it('hat matrix is symmetric, idempotent, Σhii = p+1, 0 ≤ hii ≤ 1', () => {
		const H = hatMatrix(X);
		for (let i = 0; i < fit.n; i++) {
			expect(H[i][i]).toBeGreaterThanOrEqual(0);
			expect(H[i][i]).toBeLessThanOrEqual(1);
			for (let j = 0; j < fit.n; j++) expect(H[i][j]).toBeCloseTo(H[j][i], 10);
		}
		const H2 = matMul(H, H);
		for (let i = 0; i < fit.n; i++) for (let j = 0; j < fit.n; j++) expect(H2[i][j]).toBeCloseTo(H[i][j], 8);
		expect(fit.leverages.reduce((a, b) => a + b, 0)).toBeCloseTo(fit.p + 1, 8);
		expect(leverages(X)).toEqual(fit.leverages);
	});

	it('ε̂ = (I − H)Y and eᵀX = 0 (residuals orthogonal to the design)', () => {
		// (I − H)Y recomputed via the hat matrix; compare elementwise (last-ulp
		// differences vs. the y − Xβ̂ path are expected in floating point).
		const H = hatMatrix(X);
		const I = H_identity(fit.n);
		const ImH = I.map((row, i) => row.map((_, j) => (i === j ? 1 : 0) - H[i][j]));
		const e = matVec(ImH, y);
		e.forEach((vi, i) => expect(vi).toBeCloseTo(fit.residuals[i], 8));
		const Xt = transpose(X, fit.n, fit.p + 1);
		for (const col of Xt) {
			expect(col.reduce((a, x, i) => a + x * fit.residuals[i], 0)).toBeCloseTo(0, 8);
		}
	});
});

function H_identity(n: number): number[][] {
	return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

describe('Student & Fisher quantiles (StatM1S1_2025.pdf p. 31)', () => {
	it('reference values', () => {
		expect(tQuantile(0.975, 5)).toBeCloseTo(2.57058, 4); // the PDF's longley value
		expect(tQuantile(0.975, 1)).toBeCloseTo(12.7062, 3);
		expect(tQuantile(0.975, 10)).toBeCloseTo(2.22814, 4);
		expect(tQuantile(0.975, 30)).toBeCloseTo(2.04227, 4);
		expect(tQuantile(0.975, 1000)).toBeCloseTo(1.96234, 4);
	});

	it('symmetry: t(p, df) = −t(1−p, df)', () => {
		for (const [p, df] of [
			[0.025, 5],
			[0.1, 10],
			[0.9, 30]
		]) {
			expect(tQuantile(p, df)).toBeCloseTo(-tQuantile(1 - p, df), 10);
		}
	});

	it('F quantiles (exact closed form for d1 = 1 and d1 = 2)', () => {
		expect(fQuantile(0.95, 1, 5)).toBeCloseTo(6.6079, 3);
		// d1 = 2: P(F ≤ f) = 1 − (1 − z)^{d2/2}, z = 2f/(2f + d2) → f(0.95; 2, 5) = 5.78614.
		expect(fQuantile(0.95, 2, 5)).toBeCloseTo(5.78614, 4);
		expect(fQuantile(0.95, 4, 10)).toBeCloseTo(3.47806, 4);
	});

	it('F(0.95, 1, d) = t(0.975, d)² (same test as Student)', () => {
		for (const d of [1, 5, 30, 100]) {
			expect(fQuantile(0.95, 1, d)).toBeCloseTo(tQuantile(0.975, d) ** 2, 4);
		}
	});

	it('input validation', () => {
		expect(() => tQuantile(0, 5)).toThrow();
		expect(() => tQuantile(1, 5)).toThrow();
		expect(() => tQuantile(0.975, 0)).toThrow();
		expect(() => fQuantile(0.95, 0, 5)).toThrow();
		expect(() => tConfidenceInterval(1, 0.5, 0, 5)).toThrow();
	});
});

describe('F tests and the ANOVA table (StatM1S1_2025.pdf §6.6–6.7)', () => {
	const fit = olsFit(designMatrix(longley), responseVector(longley));

	it('anovaTable: degrees of freedom, sums of squares, F = (SCE/p)/(SCR/(n−p−1))', () => {
		const [reg, err, tot] = anovaTable(fit);
		expect(reg.df).toBe(2);
		expect(err.df).toBe(5);
		expect(tot.df).toBe(7);
		expect(tot.ss).toBeCloseTo(reg.ss + err.ss, 8);
		expect(reg.f).toBeCloseTo((reg.ss / reg.df) / (err.ss / err.df), 10);
	});

	it('nested F test with q = 1 equals the Student statistic squared', () => {
		// Full model: GNP + Population. Reduced model: Population only (drop GNP,
		// regressor index 0 → design column 1). The PDF's T = 3.369 is the GNP t-stat.
		const reduced = olsFit(longley.rows.map((r) => [1, r[2]]), longley.rows.map((r) => r[0]));
		const res = nestedFTest(fit.rSquared, reduced.rSquared, 1, fit.n, fit.p, 0.05);
		expect(res.f).toBeCloseTo(fit.tStats[1] ** 2, 6);
		expect(res.d1).toBe(1);
		expect(res.d2).toBe(5);
		expect(res.critical).toBeCloseTo(fQuantile(0.95, 1, 5), 8);
	});

	it('prediction leverage and intervals (StatM1S1_2025.pdf §6.8)', () => {
		const X = designMatrix(longley);
		const v0 = [1, 500, 125];
		const lev = predictionLeverage(X, v0);
		expect(lev).toBeGreaterThan(0);
		const y0 = v0.reduce((a, b, j) => a + b * fit.beta[j], 0);
		const ci = meanResponseInterval(y0, fit.sigma2, lev, 0.05, fit.dfResidual);
		const pi = predictionInterval(y0, fit.sigma2, lev, 0.05, fit.dfResidual);
		// the prediction interval is strictly wider (extra variance σ² of a new observation)
		expect(pi[0]).toBeLessThan(ci[0]);
		expect(pi[1]).toBeGreaterThan(ci[1]);
		// half-widths: t·σ̂√(lev) vs t·σ̂√(1 + lev)
		const t = tQuantile(0.975, fit.dfResidual);
		expect(ci[1] - y0).toBeCloseTo(t * Math.sqrt(fit.sigma2 * lev), 10);
		expect(pi[1] - y0).toBeCloseTo(t * Math.sqrt(fit.sigma2 * (1 + lev)), 10);
	});
});

describe('Influence diagnostics (8.validation_du_modele_lineaire_2025.pdf)', () => {
	const X = designMatrix(bienEtre);
	const y = responseVector(bienEtre);
	const fit = olsFit(X, y);

	it('deleted residual ≡ ε̂i/(1−hii) ≡ brute-force leave-one-out', () => {
		for (let i = 0; i < fit.n; i++) {
			expect(deletedResidual(fit.residuals[i], fit.leverages[i])).toBeCloseTo(
				fit.residuals[i] / (1 - fit.leverages[i]),
				12
			);
			const loo = looRefit(X, y, i);
			expect(loo.resid[i]).toBeCloseTo(deletedResidual(fit.residuals[i], fit.leverages[i]), 8);
		}
	});

	it("Cook's distance ≡ ‖ŷ − ŷ(−i)‖²/((p+1)σ̂²) by brute force", () => {
		for (const i of [0, 4, 8]) {
			const loo = looRefit(X, y, i);
			const d = y.reduce((a, _, j) => a + (fit.yHat[j] - loo.yHat[j]) ** 2, 0);
			expect(cooksDistance(fit.residuals[i], fit.leverages[i], fit.sigma2, fit.p)).toBeCloseTo(
				d / ((fit.p + 1) * fit.sigma2),
				8
			);
		}
	});

	it('standardized residual = ε̂i/(σ̂√(1−hii)) (R: rstandard)', () => {
		const r = standardizedResiduals(fit.residuals, fit.leverages, fit.sigma2);
		for (const i of [0, 3, 9]) {
			expect(r[i]).toBeCloseTo(fit.residuals[i] / (Math.sqrt(fit.sigma2) * Math.sqrt(1 - fit.leverages[i])), 12);
		}
		// The inflation factor 1/(σ̂√(1−hii)) is monotone in hii: the
		// max-leverage point inflates its raw residual at least as much as point 0.
		const iMax = fit.leverages.indexOf(Math.max(...fit.leverages));
		expect(Math.abs(r[iMax]) / Math.abs(fit.residuals[iMax])).toBeGreaterThanOrEqual(
			Math.abs(r[0]) / Math.abs(fit.residuals[0])
		);
		// Mean leverage = (p+1)/n < 1.
		expect(fit.leverages.reduce((a, b) => a + b, 0) / fit.n).toBeLessThan(1);
		expect(() => standardizedResiduals([1, 2], [0.1], 1)).toThrow(/length mismatch/);
		expect(() => standardizedResiduals([1], [0.1], -1)).toThrow(/sigma2/);
		expect(() => standardizedResiduals([1], [1], 1)).toThrow(/< 1/);
	});

	it('studentized residual ≡ ε̂i/(σ̂(−i)√(1−hii)) by brute force', () => {
		const t = studentizedResiduals(fit.residuals, fit.leverages, fit.sigma2, fit.n, fit.p);
		for (const i of [0, 3, 9]) {
			const loo = looRefit(X, y, i);
			// σ̂(−i)² uses the n−1 residuals of the reduced sample only — the deleted
			// residual (at x_i, outside the reduced design) is NOT part of SSR(−i).
			const sigma2Lo = loo.resid.filter((_, j) => j !== i).reduce((a, r) => a + r * r, 0) / (fit.n - fit.p - 2);
			// t_i = e_i^{(i)}/(σ̂(−i)√(1 + h_i^{(i)})) with 1 + h_i^{(i)} = 1/(1−h_ii),
			// i.e. the leverage factor MULTIPLIES by √(1−h_ii) (not divides).
			expect(t[i]).toBeCloseTo((loo.resid[i] * Math.sqrt(1 - fit.leverages[i])) / Math.sqrt(sigma2Lo), 8);
		}
	});

	it('VIF = 1/(1−R²j) and Var(β̂j) = σ²·VIFj/‖xj−x̄j1‖² = σ²(XᵀX)⁻¹jj', () => {
		const Xs = designMatrix(swiss);
		const ys = responseVector(swiss);
		const fitS = olsFit(Xs, ys);
		const vv = vif(Xs);
		for (let j = 1; j <= 4; j++) {
			const xj = Xs.map((row) => row[j]);
			const others = Xs.map((row) => [...row.slice(0, j), ...row.slice(j + 1)]);
			const r2j = olsFit(others, xj).rSquared;
			expect(vv[j - 1]).toBeCloseTo(1 / (1 - r2j), 10);
			// variance inflation vs the (XᵀX)⁻¹ diagonal
			const Xt = transpose(Xs, fitS.n, fitS.p + 1);
			const XtXinv = invert(matMul(Xt, Xs));
			const mean = xj.reduce((a, b) => a + b, 0) / xj.length;
			const ss = xj.reduce((a, x) => a + (x - mean) ** 2, 0);
			expect(varBetaJ(1, xj, r2j)).toBeCloseTo(1 / (ss * (1 - r2j)), 12);
			expect(varBetaJ(fitS.sigma2, xj, r2j)).toBeCloseTo(fitS.sigma2 * XtXinv[j][j], 8);
		}
	});

	it('condition number of a 2-predictor design: κ = (1+ρ)/(1−ρ) on the correlation matrix', () => {
		const n = 20;
		const x1 = Array.from({ length: n }, (_, i) => i);
		const x2 = x1.map((x, i) => 0.99 * x + (i % 2 === 0 ? 1 : -1) * 0.1);
		const X = withIntercept(
			Array.from({ length: n }, (_, i) => [x1[i], x2[i]])
		);
		// build a design whose predictor correlation is exactly 0.99
		const rng = (seed: number) => {
			let a = seed;
			return () => {
				a = (a * 1103515245 + 12345) % 2147483648;
				return a / 2147483648;
			};
		};
		const r = rng(1);
		const z1 = Array.from({ length: n }, () => r() * 2 - 1);
		const z2 = z1.map((z) => 0.99 * z + Math.sqrt(1 - 0.99 ** 2) * (r() * 2 - 1));
		const Xrho = withIntercept(Array.from({ length: n }, (_, i) => [z1[i], z2[i]]));
		const R = correlationMatrix([z1, z2]);
		const expected = (1 + R[0][1]) / (1 - R[0][1]);
		expect(conditionNumber(Xrho)).toBeCloseTo(expected, 8);
		expect(conditionNumber(Xrho)).toBeGreaterThan(100); // ρ ≈ 0.99 → κ ≈ 198
		expect(conditionNumber(X)).toBeGreaterThan(1);
	});
});

describe('Model selection — prostate fixture (9.choix_de_modele.pdf p. 38)', () => {
	const X = designMatrix(prostate);
	const y = responseVector(prostate);
	const n = y.length;

	it('null model: RSS = 127.91766 (PDF, 5 decimals) and AIC = 28.84', () => {
		const nullFit = olsFit(y.map(() => [1]), y);
		expect(nullFit.sse).toBeCloseTo(127.91766, 3);
		expect(aic(nullFit.sse, n, 1)).toBeCloseTo(28.83755, 3);
	});

	it('full model: RSS = 44.16313 and AIC = −58.32', () => {
		const fullFit = olsFit(X, y);
		expect(fullFit.sse).toBeCloseTo(44.16313, 3);
		expect(aic(fullFit.sse, n, 9)).toBeCloseTo(-58.32161, 3);
	});

	it('forward AIC selection: lcavol → lweight → svi → lbph → age, final AIC −61.37420', () => {
		const res = forwardSelection(X, y, aic);
		const path = res.steps.map((s) => s.subset);
		expect(path).toEqual([[], [0], [0, 1], [0, 1, 4], [0, 1, 3, 4], [0, 1, 2, 3, 4]]);
		expect(res.steps[res.steps.length - 1].value).toBeCloseTo(-61.3742, 3);
	});

	it('final model coefficients (PDF order: intercept, lcavol, lweight, svi, lbph, age)', () => {
		const design = X.map((row) => [row[0], row[1], row[2], row[4], row[5], row[3]]);
		const fit = olsFit(design, y);
		expect(fit.beta[0]).toBeCloseTo(0.95102, 4);
		expect(fit.beta[1]).toBeCloseTo(0.56561, 4);
		expect(fit.beta[2]).toBeCloseTo(0.42369, 4);
		expect(fit.beta[3]).toBeCloseTo(0.11184, 4);
		expect(fit.beta[4]).toBeCloseTo(0.72096, 4);
		expect(fit.beta[5]).toBeCloseTo(-0.01489, 4);
	});

	it('Mallows Cp of the full model equals p + 1', () => {
		const fullFit = olsFit(X, y);
		expect(mallowCp(fullFit.sse, n, 9, fullFit.sigma2)).toBeCloseTo(9, 10);
		// reduced model (drop the 3 least relevant): Cp differs from p + 1
		const reduced = olsFit(X.map((row) => [row[0], row[1], row[2], row[3], row[5], row[6]]), y);
		const cp = mallowCp(reduced.sse, n, 6, fullFit.sigma2);
		expect(cp).toBeCloseTo(reduced.sse / fullFit.sigma2 - (n - 12), 10);
	});

	it('BIC uses the k·ln n penalty (stronger than AIC for k ≥ 1, n > e)', () => {
		const fullFit = olsFit(X, y);
		expect(bic(fullFit.sse, n, 9) - aic(fullFit.sse, n, 9)).toBeCloseTo(9 * (Math.log(n) - 2), 10);
	});
});

describe('Model selection — algorithms and criteria (9.choix_de_modele.pdf)', () => {
	const { X, y, trueSupport } = selectionProblem(7);

	it('bestSubset finds the true support on the seeded problem (p ≤ 12 guard)', () => {
		const res = bestSubset(X, y, aic);
		expect(res.best.subset).toEqual(trueSupport);
		expect(res.perSize).toHaveLength(9);
		expect(() =>
			bestSubset(
				Array.from({ length: 20 }, () => new Array(15).fill(1)),
				new Array(20).fill(1),
				aic
			)
		).toThrow();
	});

	it('forward / backward / both all terminate and include the true support', () => {
		for (const fn of [forwardSelection, backwardSelection, stepwiseBoth]) {
			const res = fn(X, y, aic);
			expect(res.steps.length).toBeGreaterThanOrEqual(2);
			for (const j of trueSupport) expect(res.best).toContain(j);
		}
	});

	it('PRESS ≡ Σ (ε̂i/(1−hii))² ≡ brute-force leave-one-out prediction error', () => {
		const Xb = designMatrix(bienEtre);
		const yb = responseVector(bienEtre);
		const fit = olsFit(Xb, yb);
		const formula = fit.residuals.reduce((a, r, i) => a + (r / (1 - fit.leverages[i])) ** 2, 0);
		expect(press(fit)).toBeCloseTo(formula, 10);
		let loo = 0;
		for (let i = 0; i < yb.length; i++) {
			const looFit = looRefit(Xb, yb, i);
			loo += (yb[i] - looFit.yHat[i]) ** 2;
		}
		expect(press(fit)).toBeCloseTo(loo, 8);
	});

	it('aic / bic hand values on the null model of swiss', () => {
		const y = responseVector(swiss);
		const nullFit = olsFit(y.map(() => [1]), y);
		const n = y.length;
		expect(aic(nullFit.sse, n, 1)).toBeCloseTo(n * Math.log(nullFit.sse / n) + 2, 12);
		expect(bic(nullFit.sse, n, 1)).toBeCloseTo(n * Math.log(nullFit.sse / n) + Math.log(n), 12);
	});

	it('AIC and BIC select nested models by the criterion value (monotone RSS trade-off)', () => {
		const cols = designMatrix(swiss, false);
		const y = responseVector(swiss);
		const aics: number[] = [];
		for (const size of [0, 1, 2, 3, 4]) {
			const design = size === 0 ? y.map(() => [1]) : withIntercept(cols.map((r) => r.slice(0, size)));
			const rss = olsFit(design, y).sse;
			aics.push(aic(rss, y.length, size + 1));
		}
		const bestIdx = aics.indexOf(Math.min(...aics));
		expect(bestIdx).toBeGreaterThanOrEqual(1);
		expect(bestIdx).toBeLessThanOrEqual(4);
	});
});

describe('Generalized least squares — MCG (StatM1S1_2025.pdf §7)', () => {
	const n = 12;
	const X = withIntercept(Array.from({ length: n }, (_, i) => [1 + 0.5 * i, 2 - 0.3 * ((i * 37) % 7)]));
	const y = X.map((row, i) => row[0] + 2 * row[1] - 0.5 * row[2] + (i % 3) * 0.7);
	const d = X[0].length;

	it('MCG = OLS when ℱ = I', () => {
		const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
		expect(glsClosedForm(X, y, I)).toEqual(olsClosedForm(X, y));
	});

	it('MCG equals OLS on the whitened model (ℱ = PPᵀ, multiply by P⁻¹)', () => {
		// ℱ = LLᵀ with explicit lower-triangular L; take P = Lᵀ so that PPᵀ = ℱ.
		const L = Array.from({ length: n }, (_, i) => {
			const row = new Array<number>(n).fill(0);
			row[i] = 1;
			for (let k = 0; k < i; k++) row[k] = 0.3;
			return row;
		});
		const F = matMul(L, transpose(L, n, n));
		const Pinv = invert(transpose(L, n, n));
		const gls = glsClosedForm(X, y, F);
		const olsWhite = olsClosedForm(matMul(Pinv, X), matVec(Pinv, y));
		for (let j = 0; j < d; j++) expect(gls[j]).toBeCloseTo(olsWhite[j], 8);
	});

	it('σ̂²MCG is an unbiased estimate of σ² under AR(1) errors (seeded Monte Carlo)', () => {
		const m = 20;
		const Xar = withIntercept(Array.from({ length: m }, (_, i) => [Math.sin(i * 1.7), Math.cos(i * 1.3)]));
		const rho = 0.7;
		const F = ar1Correlation(m, rho);
		const betaTrue = [1, 2, -1.5];
		let sum = 0;
		const B = 400;
		for (let b = 0; b < B; b++) {
			const rng = mulberry32(combineSeed(99, b));
			const eps = new Array<number>(m);
			eps[0] = gaussianSample({ mu: 0, sigma2: 1 }, rng);
			for (let i = 1; i < m; i++)
				eps[i] = rho * eps[i - 1] + Math.sqrt(1 - rho * rho) * gaussianSample({ mu: 0, sigma2: 1 }, rng);
			const yy = Xar.map((row, i) => row.reduce((a, x, j) => a + x * betaTrue[j], 0) + eps[i]);
			const beta = glsClosedForm(Xar, yy, F);
			sum += glsSigma2(yy, Xar, beta, F, 2);
		}
		// the errors have stationary variance 1, so the average estimate ≈ 1
		expect(sum / B).toBeCloseTo(1, 1);
	});
});

describe('Seeded simulators (demos)', () => {
	it('are deterministic in the seed and different across seeds', () => {
		const a = simulateResidualScenario(40, 'gaussian', 11);
		const b = simulateResidualScenario(40, 'gaussian', 11);
		const c = simulateResidualScenario(40, 'gaussian', 12);
		expect(a.x).toEqual(b.x);
		expect(a.y).toEqual(b.y);
		expect(a.y).not.toEqual(c.y);
	});

	it('the fan scenario has increasing residual variance in x', () => {
		const { x, y } = simulateResidualScenario(200, 'fan', 3);
		const fit = olsFit(withIntercept(x.map((v) => [v])), y);
		const order = x.map((_, i) => i).toSorted((i, j) => x[i] - x[j]);
		const low = order.slice(0, 100).map((i) => fit.residuals[i]);
		const high = order.slice(100).map((i) => fit.residuals[i]);
		const varOf = (r: number[]) => r.reduce((a, v) => a + v * v, 0) / r.length;
		expect(varOf(high)).toBeGreaterThan(1.5 * varOf(low));
	});

	it('the autocorrelated scenario has positive lag-1 autocorrelation', () => {
		// Fit against the simulator's own x so the residual is (≈) the AR(1) process;
		// num/den ≈ lag-1 autocorrelation / 2, so > 0.2 ⇔ positive lag-1 correlation.
		const { x, y } = simulateResidualScenario(200, 'autocorrelated', 4);
		const fit = olsFit(withIntercept(x.map((v) => [v])), y);
		const r = fit.residuals;
		let num = 0,
			den = 0;
		for (let i = 1; i < r.length; i++) {
			num += r[i - 1] * r[i];
			den += r[i - 1] * r[i - 1] + r[i] * r[i];
		}
		expect(num / den).toBeGreaterThan(0.2);
	});

	it('ar1Correlation builds ℱij = ρ^|i−j| and validates ρ', () => {
		const F = ar1Correlation(4, 0.5);
		expect(F[0][0]).toBe(1);
		expect(F[0][2]).toBeCloseTo(0.25, 12);
		expect(F[3][0]).toBeCloseTo(0.125, 12);
		for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) expect(F[i][j]).toBeCloseTo(F[j][i], 12);
		expect(() => ar1Correlation(4, 1)).toThrow();
		expect(() => ar1Correlation(4, -1.2)).toThrow();
	});

	it('repeatedSlopeSamples: the mean of B estimates recovers β1', () => {
		const estimates = repeatedSlopeSamples({ n: 20, spread: 10, beta0: 2, beta1: 3, sigma: 1, B: 200, seed: 5 });
		const mean = estimates.reduce((a, b) => a + b, 0) / estimates.length;
		expect(mean).toBeCloseTo(3, 1);
	});

	it('polynomialFamily: seeded, correct shape, recovers the degree', () => {
		const { x, y, trueBeta } = polynomialFamily({ n: 30, degree: 2, sigma: 0.1, seed: 8 });
		expect(trueBeta).toHaveLength(3);
		expect(x).toHaveLength(30);
		expect(y).toHaveLength(30);
		const fit = olsFit(polynomialDesign(x, 2), y);
		// The raw power basis on [0,10] is ill-conditioned, so coefficient recovery
		// is looser than σ; 0.1 (≫ σ=0.1·‖design‖ inflation) still certifies the
		// correct degree was fitted (a wrong degree would miss by O(1)).
		fit.beta.forEach((b, j) => expect(Math.abs(b - trueBeta[j])).toBeLessThan(0.1));
	});

	it('polyValue: evaluates the power basis', () => {
		// β = (2, 3, 1) → 2 + 3x + x²
		expect(polyValue([2, 3, 1], 0)).toBe(2);
		expect(polyValue([2, 3, 1], 2)).toBe(2 + 6 + 4);
		expect(polyValue([0, 0, 0, 5], -3)).toBe(5 * -27);
		expect(polyValue([4], 999)).toBe(4);
	});

	it('polynomialTestMSE: zero on an in-sample perfect fit, U-shaped in degree', () => {
		// Near-exact line (σ → 0): a degree-1 fit predicts a fresh line sample
		// with MSE at the noise level.
		const { x, y } = polynomialFamily({ n: 20, degree: 1, sigma: 1e-6, seed: 3 });
		const fit1 = olsFit(polynomialDesign(x, 1), y);
		const xTest = linspace(0, 10, 50);
		const yTest = xTest.map((xi) => polyValue(fit1.beta, xi));
		expect(polynomialTestMSE(fit1, xTest, yTest)).toBeLessThan(1e-6);

		// With noise, the test error is U-shaped in the fitted degree: the true
		// degree (1) beats both underfits (0) and overfits (high degree) on a
		// fresh sample — the demo W5.1 phenomenon (9.choix_de_modele.pdf).
		const noisy = polynomialFamily({ n: 15, degree: 1, sigma: 0.8, seed: 11 });
		const rng = mulberry32(combineSeed(11, 99));
		const xT = linspace(0, 10, 40);
		const yT = xT.map((xi) => polyValue(noisy.trueBeta, xi) + 0.8 * gaussianSample({ mu: 0, sigma2: 1 }, rng));
		const mse0 = polynomialTestMSE(olsFit(polynomialDesign(noisy.x, 0), noisy.y), xT, yT);
		const mse1 = polynomialTestMSE(olsFit(polynomialDesign(noisy.x, 1), noisy.y), xT, yT);
		const mse13 = polynomialTestMSE(olsFit(polynomialDesign(noisy.x, 13), noisy.y), xT, yT);
		expect(mse1).toBeLessThan(mse0);
		expect(mse1).toBeLessThan(mse13);

		expect(() => polynomialTestMSE(fit1, xTest, [1])).toThrow(/length mismatch/);
		expect(() => polynomialTestMSE(fit1, [], [])).toThrow(/empty/);
	});

	it('interpolatingPolynomialBeta: RSS = 0 and recovers a known quadratic exactly', () => {
		// Exact case: the degree n−1 interpolant of n points of a quadratic is
		// the quadratic itself (uniqueness) — a closed-form check.
		const x = [0, 1, 2, 3, 4];
		const y = x.map((xi) => xi * xi);
		const beta = interpolatingPolynomialBeta(x, y);
		expect(beta).toHaveLength(5);
		expect(Math.abs(beta[2] - 1)).toBeLessThan(1e-9);
		for (const j of [0, 1, 3, 4]) expect(Math.abs(beta[j])).toBeLessThan(1e-9);

		// Demo W5.1 case (n = 15 on [0,10]): RSS ~ 0 to machine precision and
		// every value finite — the normal equation would miss by O(1) here.
		const { x: xd, y: yd } = polynomialFamily({ n: 15, degree: 2, sigma: 0.8, seed: 11 });
		const beta14 = interpolatingPolynomialBeta(xd, yd);
		expect(beta14.every(Number.isFinite)).toBe(true);
		const rss = xd.reduce((a, xi, i) => a + (polyValue(beta14, xi) - yd[i]) ** 2, 0);
		expect(rss).toBeLessThan(1e-6);

		expect(() => interpolatingPolynomialBeta([1, 2], [1])).toThrow(/length mismatch/);
		expect(() => interpolatingPolynomialBeta([1], [1])).toThrow(/at least 2/);
		expect(() => interpolatingPolynomialBeta([1, 1], [1, 2])).toThrow(/distinct/);
	});

	it('selectionProblem: 8 predictors, 3 relevant, x4 null but correlated with x1', () => {
		const { X, y, trueSupport } = selectionProblem(42);
		expect(X).toHaveLength(100);
		expect(X[0]).toHaveLength(9);
		expect(X.every((row) => row[0] === 1)).toBe(true);
		expect(y).toHaveLength(100);
		expect(trueSupport).toEqual([0, 1, 2]);
		const colCorr = (i: number, j: number) => {
			const a = X.map((r) => r[i + 1]);
			const b = X.map((r) => r[j + 1]);
			const ma = a.reduce((s, v) => s + v, 0) / a.length;
			const mb = b.reduce((s, v) => s + v, 0) / b.length;
			let cov = 0,
				va = 0,
				vb = 0;
			for (let k = 0; k < a.length; k++) {
				cov += (a[k] - ma) * (b[k] - mb);
				va += (a[k] - ma) ** 2;
				vb += (b[k] - mb) ** 2;
			}
			return cov / Math.sqrt(va * vb);
		};
		expect(colCorr(0, 3)).toBeCloseTo(0.9, 1); // x4 ≈ 0.9·x1 + noise
	});
});

describe('Demo support functions (Phase C)', () => {
	it('sseSimple: closed form, minimum at the OLS solution, validates lengths', () => {
		// x = (1,2,3), y = (1,3,2): β̂1 = Sxy/Sxx = 1/2, β̂0 = ȳ − β̂1x̄ = 5/3,
		// SSE = 49/36 + 1/9 + 49/36 = 17/6.
		expect(sseSimple([1, 2, 3], [1, 3, 2], 5 / 3, 0.5)).toBeCloseTo(17 / 6, 12);
		const x = [1, 2, 3, 4, 5, 6, 7, 8];
		const y = [2.1, 2.9, 4.2, 3.8, 5.9, 6.2, 7.8, 8.1];
		const fit = olsFit(withIntercept(x.map((v) => [v])), y);
		expect(sseSimple(x, y, fit.beta[0], fit.beta[1])).toBeCloseTo(fit.sse, 10);
		expect(sseSimple(x, y, fit.beta[0] + 0.5, fit.beta[1])).toBeGreaterThan(fit.sse);
		expect(() => sseSimple([1, 2], [1], 0, 1)).toThrow();
	});

	it('partialResiduals: remove the estimated effect of the other regressors', () => {
		// Simple regression: β̂1x + ε̂ = y − β̂0 (the intercept is "the other variable").
		const x = [1, 2, 3, 4, 5, 6, 7];
		const y = [2.1, 2.9, 4.2, 3.8, 5.9, 6.2, 7.8];
		const Xs = withIntercept(x.map((v) => [v]));
		const fs = olsFit(Xs, y);
		partialResiduals(Xs, fs, 1).forEach((v, i) => expect(v).toBeCloseTo(y[i] - fs.beta[0], 10));

		// Multiple regression: partial of x1 = y − β̂0 − β̂2x2 (x2 independent of x1).
		const X = withIntercept(Array.from({ length: 10 }, (_, i) => [i + 1, ((i * 7) % 11) + 1]));
		const yy = Array.from({ length: 10 }, (_, i) => 1 + 2 * (i + 1) - 1.5 * (((i * 7) % 11) + 1) + 0.3 * i);
		const fm = olsFit(X, yy);
		partialResiduals(X, fm, 1).forEach((v, i) => expect(v).toBeCloseTo(yy[i] - fm.beta[0] - fm.beta[2] * X[i][2], 10));

		expect(() => partialResiduals(X, fm, 0)).toThrow(); // the intercept is not a regressor
		expect(() => partialResiduals(X, fm, 3)).toThrow();
		expect(() => partialResiduals(X.slice(0, 9), fm, 1)).toThrow(); // fit/design mismatch
	});

	it('covarianceBeta: σ²(XᵀX)⁻¹ — 1-D closed form, symmetry, scaling, SE cross-check', () => {
		const x = [1, 2, 3, 4, 5, 6, 7, 8];
		const X = withIntercept(x.map((v) => [v]));
		const C1 = covarianceBeta(X, 1);
		const mean = x.reduce((a, b) => a + b, 0) / x.length;
		const ss = x.reduce((a, v) => a + (v - mean) * (v - mean), 0);
		expect(C1[1][1]).toBeCloseTo(1 / ss, 10); // Var(β̂1) = 1/Σ(xi−x̄)²
		for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) expect(C1[a][b]).toBeCloseTo(C1[b][a], 12);
		const C2 = covarianceBeta(X, 4);
		for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) expect(C2[a][b]).toBeCloseTo(4 * C1[a][b], 10);

		// longley: the diagonal must reproduce the standard errors of olsFit.
		const fl = olsFit(designMatrix(longley), responseVector(longley));
		const Cl = covarianceBeta(designMatrix(longley), fl.sigma2);
		fl.seBeta.forEach((se, j) => expect(Math.sqrt(Cl[j][j])).toBeCloseTo(se, 8));

		expect(() => covarianceBeta(X, 0)).toThrow();
	});

	it('tDensity: closed forms, symmetry, integrates to 1, consistent with tQuantile', () => {
		expect(tDensity(0, 1)).toBeCloseTo(1 / Math.PI, 10); // Cauchy at 0
		expect(tDensity(0, 5)).toBeCloseTo(0.3796068, 5); // Γ(3)/(√(5π)Γ(5/2))
		expect(tDensity(0, 100000)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 3); // ν → ∞ ⇒ N(0,1)
		expect(tDensity(-1.7, 6)).toBeCloseTo(tDensity(1.7, 6), 12);

		const L = 12;
		const trap = (nu: number, a: number, b: number, m = 20000) => {
			const h = (b - a) / m;
			let s = 0.5 * (tDensity(a, nu) + tDensity(b, nu));
			for (let i = 1; i < m; i++) s += tDensity(a + i * h, nu);
			return s * h;
		};
		expect(trap(5, -L, L)).toBeCloseTo(1, 3);
		expect(trap(10, -L, L)).toBeCloseTo(1, 3);
		expect(trap(5, -L, tQuantile(0.975, 5))).toBeCloseTo(0.975, 3);
		expect(() => tDensity(1, 0)).toThrow();
	});

	it('ar1Samples: seeded, lag-1 autocorrelation ≈ ρ, stationary variance ≈ 1/(1−ρ²)', () => {
		const a = ar1Samples(500, 0.7, 11);
		expect(ar1Samples(500, 0.7, 11)).toEqual(a);
		expect(ar1Samples(500, 0.7, 12)).not.toEqual(a);
		expect(() => ar1Samples(0, 0.7, 1)).toThrow();
		expect(() => ar1Samples(10, 1, 1)).toThrow();
		expect(() => ar1Samples(10, -1.2, 1)).toThrow();

		const n = 4000;
		const e = ar1Samples(n, 0.7, 7);
		const mean = e.reduce((s, v) => s + v, 0) / n;
		let num = 0,
			den = 0;
		for (let i = 1; i < n; i++) {
			num += (e[i - 1] - mean) * (e[i] - mean);
			den += (e[i - 1] - mean) ** 2 + (e[i] - mean) ** 2;
		}
		expect(2 * (num / den)).toBeGreaterThan(0.6); // lag-1 autocorrelation ≈ 0.7
		expect(2 * (num / den)).toBeLessThan(0.8);
		const varE = e.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
		expect(varE).toBeGreaterThan(1 / (1 - 0.49) - 0.5);
		expect(varE).toBeLessThan(1 / (1 - 0.49) + 0.5);
	});

	it('correlatedPredictors: seeded, sample correlation ≈ ρ, validates', () => {
		const a = correlatedPredictors(200, 0.8, 3);
		expect(correlatedPredictors(200, 0.8, 3)).toEqual(a);
		expect(correlatedPredictors(200, 0.8, 4).x1).not.toEqual(a.x1);
		expect(a.x1).toHaveLength(200);
		expect(a.x2).toHaveLength(200);
		const corr = (u: number[], v: number[]) => {
			const mu = u.reduce((s, x) => s + x, 0) / u.length;
			const mv = v.reduce((s, x) => s + x, 0) / v.length;
			let cov = 0,
				vu = 0,
				vv = 0;
			for (let i = 0; i < u.length; i++) {
				cov += (u[i] - mu) * (v[i] - mv);
				vu += (u[i] - mu) ** 2;
				vv += (v[i] - mv) ** 2;
			}
			return cov / Math.sqrt(vu * vv);
		};
		expect(corr(a.x1, a.x2)).toBeGreaterThan(0.7);
		expect(corr(a.x1, a.x2)).toBeLessThan(0.9);
		expect(() => correlatedPredictors(1, 0.5, 1)).toThrow();
		expect(() => correlatedPredictors(10, 1, 1)).toThrow();
	});

	it('twoFactorData: seeded, shape, cell means recover the effects', () => {
		const d1 = twoFactorData({ nPerCell: 300, iLevels: 3, jLevels: 2, interaction: true, seed: 5 });
		expect(twoFactorData({ nPerCell: 300, iLevels: 3, jLevels: 2, interaction: true, seed: 5 }).y).toEqual(d1.y);
		expect(twoFactorData({ nPerCell: 300, iLevels: 3, jLevels: 2, interaction: true, seed: 6 }).y).not.toEqual(d1.y);
		expect(d1.y).toHaveLength(300 * 3 * 2);
		expect(d1.iLevels).toHaveLength(300 * 3 * 2);
		expect(d1.jLevels).toHaveLength(300 * 3 * 2);
		expect(d1.alpha).toHaveLength(3);
		expect(d1.beta).toHaveLength(2);
		expect(d1.gamma).toHaveLength(6);
		expect(d1.gamma.some((g) => g !== 0)).toBe(true);

		// cell mean ≈ αi + βj + γij, within 3σ/√nPerCell ≈ 0.17
		const cellMean = (d: ReturnType<typeof twoFactorData>, i: number, j: number) => {
			const vals = d.y.filter((_, k) => d.iLevels[k] === i && d.jLevels[k] === j);
			return vals.reduce((a, b) => a + b, 0) / vals.length;
		};
		for (let i = 0; i < 3; i++)
			for (let j = 0; j < 2; j++)
				expect(Math.abs(cellMean(d1, i, j) - (d1.alpha[i] + d1.beta[j] + d1.gamma[i * 2 + j]))).toBeLessThan(0.2);

		// no interaction ⇒ γ = 0 and the cell means are additive
		const d0 = twoFactorData({ nPerCell: 300, iLevels: 3, jLevels: 2, interaction: false, seed: 5 });
		expect(d0.gamma.every((g) => g === 0)).toBe(true);
		expect(Math.abs(cellMean(d0, 0, 0) + cellMean(d0, 2, 1) - cellMean(d0, 0, 1) - cellMean(d0, 2, 0))).toBeLessThan(0.35);

		expect(() => twoFactorData({ nPerCell: 0, iLevels: 2, jLevels: 2, interaction: false, seed: 1 })).toThrow();
		expect(() => twoFactorData({ nPerCell: 1, iLevels: 1, jLevels: 2, interaction: false, seed: 1 })).toThrow();
	});
});

describe('MCG variances & repeated intervals (StatM1S1_2025.pdf §6–7)', () => {
	const n = 15;
	const X = withIntercept(linspace(0, 10, n).map((v) => [v]));
	const d = X[0].length;
	const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

	it('olsVarianceWithCorrelation: reduces to σ²(XᵀX)⁻¹ when ℱ = I', () => {
		const V = olsVarianceWithCorrelation(X, I, 2);
		const C = covarianceBeta(X, 2);
		for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) expect(V[a][b]).toBeCloseTo(C[a][b], 10);
	});

	it('olsVarianceWithCorrelation: symmetric, scales with σ², positive diagonal', () => {
		const F = ar1Correlation(n, 0.7);
		const V = olsVarianceWithCorrelation(X, F, 1);
		for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) expect(V[a][b]).toBeCloseTo(V[b][a], 10);
		const V4 = olsVarianceWithCorrelation(X, F, 4);
		for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) expect(V4[a][b]).toBeCloseTo(4 * V[a][b], 8);
		for (let a = 0; a < d; a++) expect(V[a][a]).toBeGreaterThan(0);
	});

	it('olsVarianceWithCorrelation: positive AR(1) errors inflate the slope variance (trend)', () => {
		const F = ar1Correlation(n, 0.7);
		const slopeVar = olsVarianceWithCorrelation(X, F, 1)[1][1];
		const iidSlopeVar = covarianceBeta(X, 1)[1][1];
		expect(slopeVar).toBeGreaterThan(iidSlopeVar);
	});

	it('glsVarianceBeta: reduces to σ²(XᵀX)⁻¹ when ℱ = I', () => {
		const V = glsVarianceBeta(X, I, 3);
		const C = covarianceBeta(X, 3);
		for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) expect(V[a][b]).toBeCloseTo(C[a][b], 10);
	});

	it('glsVarianceBeta: symmetric, scales with σ², positive diagonal', () => {
		const F = ar1Correlation(n, 0.7);
		const V = glsVarianceBeta(X, F, 1);
		for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) expect(V[a][b]).toBeCloseTo(V[b][a], 10);
		const V4 = glsVarianceBeta(X, F, 4);
		for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) expect(V4[a][b]).toBeCloseTo(4 * V[a][b], 8);
		for (let a = 0; a < d; a++) expect(V[a][a]).toBeGreaterThan(0);
	});

	it('glsVarianceBeta ≤ olsVarianceWithCorrelation (BLUE, Loewner) coordinate-wise', () => {
		const F = ar1Correlation(n, 0.7);
		const Vols = olsVarianceWithCorrelation(X, F, 1);
		const Vgls = glsVarianceBeta(X, F, 1);
		for (let a = 0; a < d; a++) expect(Vols[a][a]).toBeGreaterThanOrEqual(Vgls[a][a] - 1e-12);
		// the slope (the informative coefficient) is the one most deflated
		expect(Vols[1][1]).toBeGreaterThan(Vgls[1][1]);
	});

	it('repeatedSlopeIntervals: intervals are symmetric about est, lo < est < hi, width shrinks with spread', () => {
		const opts = { n: 12, spread: 5, beta0: 1, beta1: 2, sigma: 1, B: 50, alpha: 0.05, seed: 3 };
		const ints = repeatedSlopeIntervals(opts);
		expect(ints.length).toBe(50);
		for (const { est, lo, hi } of ints) {
			expect(est).toBeGreaterThan(lo);
			expect(est).toBeLessThan(hi);
			expect(est - lo).toBeCloseTo(hi - est, 10);
		}
		const wide = repeatedSlopeIntervals({ ...opts, spread: 2 });
		const narrow = repeatedSlopeIntervals(opts);
		const meanWidth = (arr: typeof ints) => arr.reduce((a, r) => a + (r.hi - r.lo), 0) / arr.length;
		expect(meanWidth(wide)).toBeGreaterThan(meanWidth(narrow));
	});

	it('repeatedSlopeIntervals: est stream matches repeatedSlopeSamples (same seed)', () => {
		const opts = { n: 10, spread: 6, beta0: 0.5, beta1: -1.5, sigma: 2, B: 40, seed: 11 };
		const ests = repeatedSlopeIntervals({ ...opts, alpha: 0.1 }).map((r) => r.est);
		const plain = repeatedSlopeSamples(opts);
		for (let b = 0; b < opts.B; b++) expect(ests[b]).toBeCloseTo(plain[b], 12);
	});

	it('repeatedSlopeIntervals: validates alpha in (0,1)', () => {
		const opts = { n: 8, spread: 4, beta0: 0, beta1: 1, sigma: 1, B: 5, alpha: 0.05, seed: 1 };
		expect(() => repeatedSlopeIntervals({ ...opts, alpha: 0 })).toThrow();
		expect(() => repeatedSlopeIntervals({ ...opts, alpha: 1 })).toThrow();
		expect(() => repeatedSlopeIntervals({ ...opts, alpha: -1 })).toThrow();
	});
});
