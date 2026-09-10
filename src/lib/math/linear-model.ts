/**
 * Part IV — Régression linéaire.
 *
 * Closed-form estimators, Gaussian-model inference, model diagnostics and
 * model-selection criteria for the (multiple) linear model
 *   Y = Xβ + ε,  (H1) rang(X) = p + 1, (H2) E(ε) = 0, Σε = σ²In.
 *
 * Ground truth (see course_sources/sophie/):
 *  - StatM1S1_2025.pdf            — modèle, Théorème 1 (MCO), Théorème 2 (MV),
 *                                   lois d'échantillonnage, tests Student/F,
 *                                   intervalles, MCG (§7);
 *  - 8.validation_du_modele_lineaire_2025.pdf — conditionnement κ, VIF,
 *                                   matrice chapeau, leviers, résidus
 *                                   standardisés/studentisés, distance de Cook,
 *                                   résidus partiels;
 *  - 9.choix_de_modele.pdf        — PRESS, Cp de Mallows, AIC, BIC,
 *                                   best-subset / forward / backward / both;
 *  - ModèleLinéaire_ANOVA_ANCOVA.pdf — codages de facteurs, ANOVA 2 facteurs,
 *                                   ANCOVA.
 *
 * Convention: X is n×d with the intercept as column 0; the sources' "p"
 * (number of regressors) is d − 1 and the residual degrees of freedom are
 * n − p − 1 = n − d.
 */

import {
	combineSeed,
	invert,
	linspace,
	matMul,
	matVec,
	mulberry32,
	solveLinearSystem,
	symmetricEigenvalues,
	transpose
} from './util.js';
import { olsClosedForm } from './regression.js';
import { gaussianSample, type Gaussian } from './gaussian.js';

// ─── Design matrices ──────────────────────────────────────

/** Prepend an intercept column of 1s to X (n×p → n×(p+1)). */
export function withIntercept(x: number[][]): number[][] {
	return x.map((row) => [1, ...row]);
}

/** Polynomial design: columns [1, x, x², …, x^degree] (course 9.choix_de_modele.pdf, polynômes de degré croissant). */
export function polynomialDesign(x: number[], degree: number): number[][] {
	if (!Number.isInteger(degree) || degree < 0) throw new Error(`polynomialDesign: degree must be a non-negative integer, got ${degree}`);
	return x.map((xi) => {
		const row = new Array<number>(degree + 1);
		for (let j = 0; j <= degree; j++) row[j] = Math.pow(xi, j);
		return row;
	});
}

export type FactorCoding = 'none' | 'treatment' | 'sum';

/**
 * One-way ANOVA design matrix for factor levels (0-indexed per observation).
 * Source: ModèleLinéaire_ANOVA_ANCOVA.pdf, "Contraintes de plein rang":
 *  - 'none'      : no intercept (β0 = 0), one column per level — βj = mean of the response at level j;
 *  - 'treatment' : R contr.treatment, level 1 is the reference (β1 = 0);
 *  - 'sum'       : R contr.sum, Σj βj = 0 (β0 is the grand mean for balanced
 *                  designs; in general the unweighted mean of the level means).
 * The fitted values (and the per-level means) are identical under the three
 * codings — only the parameter interpretation changes.
 */
export function anovaDesign(levels: number[], coding: FactorCoding = 'treatment'): number[][] {
	if (levels.length === 0) throw new Error('anovaDesign: empty factor');
	const k = Math.max(...levels) + 1;
	if (levels.some((l) => l < 0 || l >= k)) throw new Error(`anovaDesign: level index outside [0, ${k - 1}]`);

	return levels.map((level) => {
		const row = new Array<number>(k).fill(0);
		if (coding === 'none') {
			row[level] = 1;
		} else if (coding === 'treatment') {
			row[0] = 1;
			if (level >= 1) row[level] = 1;
		} else {
			// contr.sum: +1 on the level's own column, −1 on every other
			// non-reference column for the last level — this is what makes
			// Σj βj = 0, so β0 is the grand mean and β0 + βj the level mean.
			row[0] = 1;
			if (level <= k - 2) row[level + 1] = 1;
			else for (let m = 1; m < k; m++) row[m] = -1;
		}
		return row;
	});
}

/**
 * Two-way ANOVA design, reference coding (α1 = 0, β1 = 0), optional
 * interaction γij with γi1 = γ1j = 0.
 * Source: ModèleLinéaire_ANOVA_ANCOVA.pdf, "ANOVA à 2 facteurs"
 * (R: Y ~ F1 + F2, or Y ~ F1 * F2 with interaction).
 */
export function twoWayAnovaDesign(iLevels: number[], jLevels: number[], interaction: boolean): number[][] {
	if (iLevels.length === 0 || iLevels.length !== jLevels.length) throw new Error('twoWayAnovaDesign: factor lengths must be equal and non-empty');
	const I = Math.max(...iLevels) + 1;
	const J = Math.max(...jLevels) + 1;
	const nMain = 1 + (I - 1) + (J - 1);
	const nInter = (I - 1) * (J - 1);

	return iLevels.map((i, obs) => {
		const j = jLevels[obs];
		const row = new Array<number>(nMain + (interaction ? nInter : 0)).fill(0);
		row[0] = 1;
		if (i >= 1) row[1 + (i - 1)] = 1;
		if (j >= 1) row[1 + (I - 1) + (j - 1)] = 1;
		if (interaction && i >= 1 && j >= 1) row[nMain + (i - 1) * (J - 1) + (j - 1)] = 1;
		return row;
	});
}

/**
 * ANCOVA design: factor (reference coding) + quantitative covariate x,
 * optional factor×covariate interaction.
 * Source: ModèleLinéaire_ANOVA_ANCOVA.pdf, "Modèle d'ANCOVA":
 *  - no interaction: Yjk = β0 + βj + δ·xjk (parallel lines, R: Y ~ X + F);
 *  - interaction:    Yjk = β0 + βj + (δ + δj)·xjk (R: Y ~ X * F).
 */
export function ancovaDesign(levels: number[], x: number[], interaction: boolean): number[][] {
	if (levels.length !== x.length || levels.length === 0) throw new Error('ancovaDesign: factor and covariate lengths must be equal and non-empty');
	const k = Math.max(...levels) + 1;
	const nMain = 1 + (k - 1) + 1;
	const nInter = k - 1;

	return levels.map((level, obs) => {
		const row = new Array<number>(nMain + (interaction ? nInter : 0)).fill(0);
		row[0] = 1;
		if (level >= 1) row[1 + (level - 1)] = 1;
		row[1 + (k - 1)] = x[obs];
		if (interaction && level >= 1) row[nMain + (level - 1)] = x[obs];
		return row;
	});
}

/**
 * Seeded ANCOVA data: `levels` factor levels × `nPerLevel` observations,
 * xjk ~ U(0, xMax),
 *   yjk = beta0 + alphas[j] + (slope + deltaSlopes[j])·xjk + N(0, sigma²),
 * with deltaSlopes all zero by default (no interaction → parallel lines).
 * Source: ModèleLinéaire_ANOVA_ANCOVA.pdf, "Modèle d'ANCOVA" (slide 11):
 * Yjk = β0 + βj + δ·xjk (R: Y ~ X + F), or Yjk = β0 + βj + (δ + δj)·xjk
 * (R: Y ~ X * F). Synthetic data for the demo W2.3 — the slides give no
 * numeric example.
 */
export function ancovaData(opts: {
	nPerLevel: number;
	levels: number;
	xMax: number;
	beta0: number;
	alphas: number[];
	slope: number;
	deltaSlopes?: number[];
	sigma: number;
	seed: number;
}): { levels: number[]; x: number[]; y: number[] } {
	const { nPerLevel, levels, xMax, beta0, alphas, slope, sigma, seed } = opts;
	const delta = opts.deltaSlopes ?? alphas.map(() => 0);
	if (nPerLevel < 2 || levels < 2) throw new Error(`ancovaData: need at least 2 levels × 2 observations (got ${levels} × ${nPerLevel})`);
	if (xMax <= 0) throw new Error(`ancovaData: xMax must be positive (got ${xMax})`);
	if (sigma <= 0) throw new Error(`ancovaData: sigma must be positive (got ${sigma})`);
	if (alphas.length !== levels || delta.length !== levels)
		throw new Error(`ancovaData: alphas/deltaSlopes length (${alphas.length}/${delta.length}) must equal levels (${levels})`);

	const rng = mulberry32(combineSeed(seed, 1));
	const base: Gaussian = { mu: 0, sigma2: 1 };
	const outLevels: number[] = [];
	const outX: number[] = [];
	const outY: number[] = [];
	for (let j = 0; j < levels; j++)
		for (let k = 0; k < nPerLevel; k++) {
			const x = rng() * xMax;
			outLevels.push(j);
			outX.push(x);
			outY.push(beta0 + alphas[j] + (slope + delta[j]) * x + sigma * gaussianSample(base, rng));
		}
	return { levels: outLevels, x: outX, y: outY };
}

// ─── OLS core ─────────────────────────────────────────────

/** Summary of an ordinary least squares fit (see module header for conventions). */
export interface LinearModelFit {
	/** β̂ = (XᵀX)⁻¹XᵀY, Théorème 1 (StatM1S1_2025.pdf). Length d. */
	beta: number[];
	/** Ŷ = Xβ̂. */
	yHat: number[];
	/** ε̂ = Y − Ŷ = (I − H)Y. */
	residuals: number[];
	/** Leverages hii (diagonal of H = X(XᵀX)⁻¹Xᵀ). */
	leverages: number[];
	/** Number of observations. */
	n: number;
	/** Number of regressors excluding the intercept (the sources' p). */
	p: number;
	/** SCR = ‖Y − Ŷ‖². */
	sse: number;
	/** SCE = ‖Ŷ − ȳ·1‖². */
	sseExplained: number;
	/** SCT = ‖Y − ȳ·1‖² (equals SCE + SCR when X has an intercept). */
	sst: number;
	/** R² = SCE/SCT. */
	rSquared: number;
	/** R² ajusté = 1 − (n−1)/(n−p−1) · SCR/SCT (StatM1S1_2025.pdf, §5). */
	adjustedRSquared: number;
	/** σ̂² = SCR/(n−p−1), unbiased estimator. */
	sigma2: number;
	/** σ̂²MV = SCR/n (Théorème 2 — biased, StatM1S1_2025.pdf, §6). */
	sigma2MV: number;
	/** σ̂·√((XᵀX)⁻¹ⱼⱼ) — standard error of each coefficient. */
	seBeta: number[];
	/** Tj = β̂j / SE(β̂j), Student(n−p−1) under (H3). */
	tStats: number[];
	/** Residual degrees of freedom n − p − 1. */
	dfResidual: number;
}

/**
 * Fit the linear model Y = Xβ + ε by ordinary least squares and compute the
 * full summary used across the course: Théorème 1 (β̂ = (XᵀX)⁻¹XᵀY), sums of
 * squares SCR/SCE/SCT, R² and adjusted R², σ̂², standard errors and Student
 * statistics (StatM1S1_2025.pdf, §2–§6).
 * X must have the intercept as column 0 and full rank.
 */
export function olsFit(X: number[][], y: number[]): LinearModelFit {
	const n = X.length;
	const d = X[0]?.length ?? 0;
	if (n === 0 || d === 0) throw new Error('olsFit: X must not be empty');
	if (y.length !== n) throw new Error(`olsFit: X has ${n} rows but y has ${y.length}`);
	if (n <= d) throw new Error(`olsFit: need n > p + 1 (got n = ${n}, p + 1 = ${d})`);

	const beta = olsClosedForm(X, y);
	const yHat = matVec(X, beta);
	const residuals = y.map((yi, i) => yi - yHat[i]);
	const p = d - 1;

	const ybar = y.reduce((a, b) => a + b, 0) / n;
	const sst = y.reduce((a, yi) => a + (yi - ybar) * (yi - ybar), 0);
	const sse = residuals.reduce((a, r) => a + r * r, 0);
	const sseExplained = yHat.reduce((a, yi) => a + (yi - ybar) * (yi - ybar), 0);

	// (XᵀX)⁻¹ serves both the standard errors and the leverages. Only the
	// diagonal hii = xiᵀ(XᵀX)⁻¹xi is kept — materializing the full n×n hat
	// matrix here would make olsFit O(n²·d) in memory, not O(n·d²).
	const Xt = transpose(X, n, d);
	const XtXinv = invert(matMul(Xt, X));
	const seBeta = new Array<number>(d);
	for (let j = 0; j < d; j++) seBeta[j] = Math.sqrt(Math.max(0, XtXinv[j][j]));
	const leverages = leveragesFromInverse(X, XtXinv);

	const sigma2 = sse / (n - d);
	const rSquared = sst > 0 ? sseExplained / sst : 0;

	return {
		beta,
		yHat,
		residuals,
		leverages,
		n,
		p,
		sse,
		sseExplained,
		sst,
		rSquared,
		adjustedRSquared: 1 - ((n - 1) / (n - d)) * (sse / sst),
		sigma2,
		sigma2MV: sse / n,
		seBeta: seBeta.map((se) => se * Math.sqrt(sigma2)),
		tStats: beta.map((b, j) => (seBeta[j] > 0 ? b / (seBeta[j] * Math.sqrt(sigma2)) : 0)),
		dfResidual: n - d
	};
}

/** Hat (projection) matrix H = X(XᵀX)⁻¹Xᵀ — symmetric and idempotent (8.validation…, "Leviers hii"). O(n²·d): only use on small designs. */
export function hatMatrix(X: number[][]): number[][] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	const XtX = matMul(Xt, X);
	// H = X · S with S = (XᵀX)⁻¹Xᵀ (d×n). The j-th column of S is the solution
	// of (XᵀX) s = (j-th column of Xᵀ) = (j-th row of X).
	const s = Array.from({ length: n }, (_, j) => solveLinearSystem(XtX, X[j]));
	return matMul(X, transpose(s, n, d));
}

/** Diagonal hii = xiᵀ(XᵀX)⁻¹xi of the hat matrix, given (XᵀX)⁻¹ (8.validation…, "Leviers hii"). */
function leveragesFromInverse(X: number[][], XtXinv: number[][]): number[] {
	const d = X[0].length;
	return X.map((row) => {
		let h = 0;
		for (let j = 0; j < d; j++) {
			let s = 0;
			for (let m = 0; m < d; m++) s += XtXinv[j][m] * row[m];
			h += row[j] * s;
		}
		return h;
	});
}

/** Leverages hii = diagonal of the hat matrix (8.validation…, "Leviers hii"). O(n·d²) — the diagonal is read off (XᵀX)⁻¹ without materializing H. */
export function leverages(X: number[][]): number[] {
	const n = X.length,
		d = X[0].length;
	const Xt = transpose(X, n, d);
	return leveragesFromInverse(X, invert(matMul(Xt, X)));
}

/** Sums of squares: SCR (residuals), SCE (explained), SCT (total) (StatM1S1_2025.pdf, §5). */
export function sumsOfSquares(y: number[], yHat: number[]): { scr: number; sce: number; sct: number } {
	const n = y.length;
	if (yHat.length !== n) throw new Error(`sumsOfSquares: length mismatch (${n} vs ${yHat.length})`);
	const ybar = y.reduce((a, b) => a + b, 0) / n;
	const scr = y.reduce((a, yi, i) => a + (yi - yHat[i]) * (yi - yHat[i]), 0);
	const sce = yHat.reduce((a, yi) => a + (yi - ybar) * (yi - ybar), 0);
	const sct = y.reduce((a, yi) => a + (yi - ybar) * (yi - ybar), 0);
	return { scr, sce, sct };
}

/**
 * SSE(β0, β1) = Σi (yi − β0 − β1·xi)² — the squared-error landscape whose
 * unique minimum under (H1) is attained at the OLS solution
 * (StatM1S1_2025.pdf, §I.4 — derivation of ‖Y − Xβ‖²). Used by the demo W1.1.
 */
export function sseSimple(x: number[], y: number[], b0: number, b1: number): number {
	if (x.length !== y.length) throw new Error(`sseSimple: length mismatch (x = ${x.length}, y = ${y.length})`);
	if (x.length < 2) throw new Error(`sseSimple: need at least 2 points (got ${x.length})`);
	return y.reduce((a, yi, i) => {
		const r = yi - (b0 + b1 * x[i]);
		return a + r * r;
	}, 0);
}

/** R² = SCE/SCT = 1 − SCR/SCT (StatM1S1_2025.pdf, §5). */
export function rSquared(sct: number, scr: number): number {
	if (sct <= 0) throw new Error(`rSquared: total sum of squares must be positive (got ${sct})`);
	return 1 - scr / sct;
}

/** R² ajusté = 1 − (n−1)/(n−p−1) · SCR/SCT (StatM1S1_2025.pdf, §5). */
export function adjustedRSquared(r2: number, n: number, p: number): number {
	if (n <= p + 1) throw new Error(`adjustedRSquared: need n > p + 1 (got n = ${n}, p = ${p})`);
	return 1 - ((n - 1) / (n - p - 1)) * (1 - r2);
}

/**
 * Standardized residuals ri = ε̂i / (σ̂√(1 − hii)) (8.validation…, "Résidus
 * standardisés", R: rstandard()).
 */
export function standardizedResiduals(residuals: number[], leveragesArr: number[], sigma2: number): number[] {
	if (residuals.length !== leveragesArr.length) throw new Error('standardizedResiduals: length mismatch');
	if (sigma2 <= 0) throw new Error(`standardizedResiduals: sigma2 must be positive (got ${sigma2})`);
	const sigma = Math.sqrt(sigma2);
	return residuals.map((r, i) => {
		const h = leveragesArr[i];
		if (h >= 1) throw new Error(`standardizedResiduals: leverage ${h} must be < 1`);
		return r / (sigma * Math.sqrt(1 - h));
	});
}

/**
 * Studentized residuals ti = ε̂i / (σ̂(−i)√(1 − hii)) ~ Student(n−p−2) under
 * (H3) (8.validation…, "Résidus studentisés", R: rstudent()). Computed from
 * the standardized residuals via ti = ri·√((n−p−2)/(n−p−1−ri²)).
 */
export function studentizedResiduals(residuals: number[], leveragesArr: number[], sigma2: number, n: number, p: number): number[] {
	if (n <= p + 2) throw new Error(`studentizedResiduals: need n > p + 2 (got n = ${n}, p = ${p})`);
	const ri = standardizedResiduals(residuals, leveragesArr, sigma2);
	return ri.map((r) => {
		const denom = (n - p - 1) - r * r;
		if (denom <= 0) throw new Error('studentizedResiduals: numerical failure (|ri| ≥ √(n−p−1))');
		return r * Math.sqrt((n - p - 2) / denom);
	});
}

/**
 * Deleted (leave-one-out) residual ε̂(−i)i = ε̂i / (1 − hii) (8.validation…,
 * "Erreur de test ε̂(−i)i") — no refit needed.
 */
export function deletedResidual(residual: number, hii: number): number {
	if (hii >= 1) throw new Error(`deletedResidual: leverage ${hii} must be < 1`);
	return residual / (1 - hii);
}

/**
 * Partial residuals of regressor j: ε̂∆j,i = β̂j·xj,i + ε̂i
 * (8.validation_du_modele_lineaire_2025.pdf, "Résidus partiels" — they remove
 * the estimated effect of the OTHER regressors, so plotting them against xj
 * reveals the true shape of the (xj, Y) relationship). X has the intercept as
 * column 0; j is a regressor index in [1, p].
 */
export function partialResiduals(X: number[][], fit: LinearModelFit, j: number): number[] {
	if (fit.n !== X.length) throw new Error(`partialResiduals: fit for ${fit.n} observations, design has ${X.length}`);
	if (!Number.isInteger(j) || j < 1 || j >= X[0].length) throw new Error(`partialResiduals: j must be a regressor index in [1, p] (got ${j})`);
	return X.map((row, i) => fit.beta[j] * row[j] + fit.residuals[i]);
}

/**
 * Cook's distance Di = hii·ε̂²i / ((p+1)(1−hii)²σ̂²) = hii·ri²/((p+1)(1−hii))
 * (8.validation…, "Distance de Cook", R: cooks.distance()).
 */
export function cooksDistance(residual: number, hii: number, sigma2: number, p: number): number {
	if (hii >= 1) throw new Error(`cooksDistance: leverage ${hii} must be < 1`);
	if (sigma2 <= 0) throw new Error(`cooksDistance: sigma2 must be positive (got ${sigma2})`);
	return (hii * residual * residual) / ((p + 1) * (1 - hii) * (1 - hii) * sigma2);
}

// ─── Collinearity diagnostics ─────────────────────────────

/** Pearson correlation matrix of a list of numeric columns. */
export function correlationMatrix(columns: number[][]): number[][] {
	const n = columns[0]?.length ?? 0;
	const m = columns.length;
	if (n === 0) throw new Error('correlationMatrix: columns must not be empty');
	const means = columns.map((col) => col.reduce((a, b) => a + b, 0) / n);
	const sds = columns.map((col, j) => Math.sqrt(col.reduce((a, x) => a + (x - means[j]) * (x - means[j]), 0)));

	const R = Array.from({ length: m }, () => new Array<number>(m).fill(0));
	for (let j = 0; j < m; j++) {
		for (let k = j; k < m; k++) {
			if (sds[j] === 0 || sds[k] === 0) throw new Error(`correlationMatrix: constant column (index ${j === k ? j : Math.min(j, k)})`);
			let cov = 0;
			for (let i = 0; i < n; i++) cov += (columns[j][i] - means[j]) * (columns[k][i] - means[k]);
			R[j][k] = R[k][j] = cov / (sds[j] * sds[k]);
		}
	}
	return R;
}

/**
 * Condition number κ = λ1/λp of the correlation matrix of the p regressors
 * (intercept column excluded). Source: 8.validation…, "Calcul de l'indice de
 * conditionnement κ" (R: eigen(cor(x)); règle courante κ > 500).
 */
export function conditionNumber(X: number[][]): number {
	const d = X[0].length;
	if (d < 2) return 1;
	// one vector per regressor (columns, not rows — correlationMatrix's convention)
	const regressors = Array.from({ length: d - 1 }, (_, j) => X.map((row) => row[j + 1]));
	const R = correlationMatrix(regressors);
	const eig = symmetricEigenvalues(R);
	if (eig[eig.length - 1] <= 1e-12) return Infinity;
	return eig[0] / eig[eig.length - 1];
}

/**
 * Variance Inflation Factors VIFj = 1/(1 − R²j), where R²j is the R² of the
 * regression of Xj on the other regressors (8.validation…, "VIF et propriété
 * d'inflation de variance"; règle courante VIFj > 10). X column 0 is the
 * intercept; returns one VIF per regressor.
 */
export function vif(X: number[][]): number[] {
	const n = X.length;
	const d = X[0].length;
	if (d < 2) throw new Error('vif: X must have an intercept column plus at least one regressor');
	if (n <= d) throw new Error(`vif: need n > p + 1 (got n = ${n}, p + 1 = ${d})`);

	const out = new Array<number>(d - 1);
	for (let j = 1; j < d; j++) {
		const keep = X.map((row) => [...row.slice(0, j), ...row.slice(j + 1)]);
		const target = X.map((row) => row[j]);
		const fit = olsFit(keep, target);
		const r2 = fit.rSquared;
		if (r2 >= 1) throw new Error(`vif: regressor ${j} is (numerically) a linear combination of the others`);
		out[j - 1] = 1 / (1 - r2);
	}
	return out;
}

/**
 * Var(β̂j) = σ² / (‖xj − x̄j·1‖² (1 − R²j)) (8.validation…, "VIF et propriété
 * d'inflation de variance").
 */
export function varBetaJ(sigma2: number, xj: number[], r2j: number): number {
	if (sigma2 <= 0) throw new Error(`varBetaJ: sigma2 must be positive (got ${sigma2})`);
	if (r2j < 0 || r2j >= 1) throw new Error(`varBetaJ: R²j must be in [0, 1) (got ${r2j})`);
	const n = xj.length;
	const mean = xj.reduce((a, b) => a + b, 0) / n;
	const ss = xj.reduce((a, x) => a + (x - mean) * (x - mean), 0);
	if (ss <= 0) throw new Error('varBetaJ: constant regressor');
	return sigma2 / (ss * (1 - r2j));
}

/**
 * Covariance matrix of β̂: Cov(β̂) = σ²(XᵀX)⁻¹ (StatM1S1_2025.pdf, §I.4 —
 * "Var(β̂) = σ²(XᵀX)⁻¹" under (H2); the diagonal gives the coefficient
 * variances behind the standard errors). X has the intercept as column 0.
 */
export function covarianceBeta(X: number[][], sigma2: number): number[][] {
	if (sigma2 <= 0) throw new Error(`covarianceBeta: sigma2 must be positive (got ${sigma2})`);
	const n = X.length;
	const d = X[0]?.length ?? 0;
	if (n === 0 || d === 0) throw new Error('covarianceBeta: X must not be empty');
	const Xt = transpose(X, n, d);
	return invert(matMul(Xt, X)).map((row) => row.map((v) => v * sigma2));
}

// ─── Gaussian-model inference ─────────────────────────────

const LOG_2PI = Math.log(2 * Math.PI);

/** Log-gamma function (Lanczos approximation, |error| < 1e-13 for x > 0). */
export function logGamma(x: number): number {
	if (x <= 0) throw new Error(`logGamma: x must be positive (got ${x})`);
	const g = 7;
	const c = [
		0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
		12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
	];
	if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
	x -= 1;
	let a = c[0];
	const t = x + g + 0.5;
	for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
	return 0.5 * LOG_2PI + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Regularized incomplete beta function I_x(a, b) via the standard continued
 * fraction (Lentz). Used below to invert the Student and Fisher CDFs.
 */
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
	if (a <= 0 || b <= 0) throw new Error('regularizedIncompleteBeta: parameters must be positive');
	if (x <= 0) return 0;
	if (x >= 1) return 1;

	const FPMIN = 1e-300;
	const betacf = (aa: number, bb: number, xx: number): number => {
		const qab = aa + bb,
			qap = aa + 1,
			qam = aa - 1;
		let c = 1;
		let d = 1 - (qab * xx) / qap;
		if (Math.abs(d) < FPMIN) d = FPMIN;
		d = 1 / d;
		let h = d;
		for (let m = 1; m <= 300; m++) {
			const m2 = 2 * m;
			let t = (m * (bb - m) * xx) / ((qam + m2) * (aa + m2));
			d = 1 + t * d;
			if (Math.abs(d) < FPMIN) d = FPMIN;
			c = 1 + t / c;
			if (Math.abs(c) < FPMIN) c = FPMIN;
			d = 1 / d;
			h *= d * c;
			t = (-(aa + m) * (qab + m) * xx) / ((aa + m2) * (qap + m2));
			d = 1 + t * d;
			if (Math.abs(d) < FPMIN) d = FPMIN;
			c = 1 + t / c;
			if (Math.abs(c) < FPMIN) c = FPMIN;
			d = 1 / d;
			const del = d * c;
			h *= del;
			if (Math.abs(del - 1) < 3e-14) break;
		}
		return h;
	};

	const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
	if (x < (a + 1) / (a + b + 2)) {
		return (Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) * betacf(a, b, x)) / a;
	}
	// I_x(a, b) = 1 − I_{1−x}(b, a) — the continued fraction must be re-evaluated
	// at the mirrored point with swapped parameters.
	return 1 - (Math.exp(b * Math.log(1 - x) + a * Math.log(x) - lnBeta) * betacf(b, a, 1 - x)) / b;
}

/**
 * Quantile of Student's t distribution with `df` degrees of freedom:
 * returns t such that P(T ≤ t) = p, T ~ Student(df)
 * (StatM1S1_2025.pdf, p. 32: t5(97.5 %) = 2.57058).
 */
export function tQuantile(p: number, df: number): number {
	if (p <= 0 || p >= 1) throw new Error(`tQuantile: p must be in (0,1) (got ${p})`);
	if (df <= 0) throw new Error(`tQuantile: df must be positive (got ${df})`);
	if (p === 0.5) return 0;
	if (p < 0.5) return -tQuantile(1 - p, df);

	// For t > 0: P(T > t) = 0.5 · I_{df/(df+t²)}(df/2, 1/2). Invert for x = df/(df+t²).
	const target = 2 * (1 - p);
	let lo = 0,
		hi = 1;
	for (let i = 0; i < 100; i++) {
		const mid = (lo + hi) / 2;
		if (regularizedIncompleteBeta(mid, df / 2, 0.5) < target) lo = mid;
		else hi = mid;
	}
	const x = (lo + hi) / 2;
	return Math.sqrt((df * (1 - x)) / x);
}

/**
 * Density of Student's t distribution with `df` degrees of freedom
 * (StatM1S1_2025.pdf, §I.7 — Tj ~ Student(n−p−1)):
 *   f(t; ν) = Γ((ν+1)/2) / (√(νπ)·Γ(ν/2)) · (1 + t²/ν)^{−(ν+1)/2}.
 * Computed in log-space via logGamma for stability.
 */
export function tDensity(x: number, df: number): number {
	if (df <= 0) throw new Error(`tDensity: df must be positive (got ${df})`);
	const logC = logGamma((df + 1) / 2) - 0.5 * Math.log(df * Math.PI) - logGamma(df / 2);
	return Math.exp(logC - ((df + 1) / 2) * Math.log1p((x * x) / df));
}

/**
 * Quantile of Fisher's F distribution with (d1, d2) degrees of freedom:
 * returns f such that P(F ≤ f) = p (StatM1S1_2025.pdf, §6.6).
 */
export function fQuantile(p: number, d1: number, d2: number): number {
	if (p <= 0 || p >= 1) throw new Error(`fQuantile: p must be in (0,1) (got ${p})`);
	if (d1 <= 0 || d2 <= 0) throw new Error(`fQuantile: degrees of freedom must be positive (got ${d1}, ${d2})`);

	// P(F ≤ f) = I_{d1 f/(d1 f + d2)}(d1/2, d2/2). Invert for z = d1 f/(d1 f + d2) ∈ (0,1).
	let lo = 0,
		hi = 1;
	for (let i = 0; i < 100; i++) {
		const mid = (lo + hi) / 2;
		if (regularizedIncompleteBeta(mid, d1 / 2, d2 / 2) < p) lo = mid;
		else hi = mid;
	}
	const z = (lo + hi) / 2;
	return (d2 * z) / (d1 * (1 - z));
}

/** 1−α confidence interval for βj: β̂j ± t_{n−p−1}(1−α/2) · SE(β̂j) (StatM1S1_2025.pdf, §6). */
export function tConfidenceInterval(beta: number, se: number, alpha: number, df: number): [number, number] {
	if (alpha <= 0 || alpha >= 1) throw new Error(`tConfidenceInterval: alpha must be in (0,1) (got ${alpha})`);
	if (se < 0) throw new Error(`tConfidenceInterval: se must be non-negative (got ${se})`);
	const t = tQuantile(1 - alpha / 2, df);
	return [beta - t * se, beta + t * se];
}

/** One row of the ANOVA table (StatM1S1_2025.pdf, §6.6 "tableau d'analyse de la variance"). */
export interface AnovaRow {
	source: 'Régression' | 'Erreur' | 'Total';
	df: number;
	ss: number;
	ms: number | null;
	f: number | null;
}

/** Global F test: F = (SCE/p)/(SCR/(n−p−1)) ~ F(p, n−p−1) under H0: β1 = … = βp = 0. */
export function anovaTable(fit: LinearModelFit): AnovaRow[] {
	const { p, n, sse, sseExplained, sst, dfResidual } = fit;
	const f = p > 0 ? (sseExplained / p) / (sse / dfResidual) : null;
	return [
		{ source: 'Régression', df: p, ss: sseExplained, ms: p > 0 ? sseExplained / p : null, f },
		{ source: 'Erreur', df: dfResidual, ss: sse, ms: sse / dfResidual, f: null },
		{ source: 'Total', df: n - 1, ss: sst, ms: null, f: null }
	];
}

/**
 * Nested (emboîté) F test of a reduced model against the full one:
 * Fq = ((R² − Rq²)/q) / ((1 − R²)/(n − p − 1)) ~ F(q, n−p−1); for q = 1 this
 * is exactly the Student test squared (StatM1S1_2025.pdf, §6.7).
 * `p` is the full model's number of regressors (excluding intercept).
 */
export function nestedFTest(r2Full: number, r2Reduced: number, q: number, n: number, p: number, alpha: number): { f: number; d1: number; d2: number; critical: number } {
	if (q <= 0) throw new Error(`nestedFTest: q must be positive (got ${q})`);
	if (n <= p + 1) throw new Error(`nestedFTest: need n > p + 1 (got n = ${n}, p = ${p})`);
	if (r2Full < 0 || r2Full >= 1) throw new Error(`nestedFTest: R² must be in [0,1) (got ${r2Full})`);
	if (r2Reduced < 0 || r2Reduced > r2Full) throw new Error(`nestedFTest: need 0 ≤ Rq² ≤ R² (got ${r2Reduced})`);
	if (alpha <= 0 || alpha >= 1) throw new Error(`nestedFTest: alpha must be in (0,1) (got ${alpha})`);
	const d1 = q;
	const d2 = n - p - 1;
	const f = ((r2Full - r2Reduced) / q) / ((1 - r2Full) / d2);
	return { f, d1, d2, critical: fQuantile(1 - alpha, d1, d2) };
}

/** v0ᵀ(XᵀX)⁻¹v0 — the prediction leverage of a design row v0 (StatM1S1_2025.pdf, §6.8). */
export function predictionLeverage(X: number[][], v0: number[]): number {
	const n = X.length,
		d = X[0].length;
	if (v0.length !== d) throw new Error(`predictionLeverage: v0 must have length ${d} (got ${v0.length})`);
	const Xt = transpose(X, n, d);
	const XtXinv = invert(matMul(Xt, X));
	const tmp = matVec(XtXinv, v0);
	let s = 0;
	for (let j = 0; j < d; j++) s += v0[j] * tmp[j];
	return s;
}

/** Confidence interval for the mean response at v0: ŷ0 ± t·σ̂√(v0ᵀ(XᵀX)⁻¹v0). */
export function meanResponseInterval(y0: number, sigma2: number, leverage0: number, alpha: number, df: number): [number, number] {
	if (sigma2 <= 0) throw new Error(`meanResponseInterval: sigma2 must be positive (got ${sigma2})`);
	if (leverage0 < 0) throw new Error(`meanResponseInterval: leverage0 must be non-negative (got ${leverage0})`);
	const t = tQuantile(1 - alpha / 2, df);
	const half = t * Math.sqrt(sigma2 * leverage0);
	return [y0 - half, y0 + half];
}

/** Prediction interval for a new observation at v0: ŷ0 ± t·σ̂√(1 + v0ᵀ(XᵀX)⁻¹v0) (StatM1S1_2025.pdf, §6.8). */
export function predictionInterval(y0: number, sigma2: number, leverage0: number, alpha: number, df: number): [number, number] {
	if (sigma2 <= 0) throw new Error(`predictionInterval: sigma2 must be positive (got ${sigma2})`);
	if (leverage0 < 0) throw new Error(`predictionInterval: leverage0 must be non-negative (got ${leverage0})`);
	const t = tQuantile(1 - alpha / 2, df);
	const half = t * Math.sqrt(sigma2 * (1 + leverage0));
	return [y0 - half, y0 + half];
}

// ─── Model selection ──────────────────────────────────────

/**
 * PRESS of Allen: PRESS = Σi ε̂(−i)²i, computed from the hat diagonal
 * (ε̂(−i)i = ε̂i/(1 − hii)) — no leave-one-out refits (9.choix_de_modele.pdf,
 * "Le PRESS de Allen").
 */
export function press(fit: LinearModelFit): number {
	let s = 0;
	for (let i = 0; i < fit.n; i++) {
		const d = deletedResidual(fit.residuals[i], fit.leverages[i]);
		s += d * d;
	}
	return s;
}

/**
 * Mallows Cp = ‖ε̂‖²/σ̂² − (n − 2k), where σ̂² is estimated on the FULL model
 * and k counts the estimated coefficients including the intercept; for the
 * full model Cp = p + 1 (9.choix_de_modele.pdf, "Le Cp de Mallows").
 */
export function mallowCp(rss: number, n: number, k: number, sigma2Full: number): number {
	if (rss < 0) throw new Error(`mallowCp: rss must be non-negative (got ${rss})`);
	if (sigma2Full <= 0) throw new Error(`mallowCp: sigma2Full must be positive (got ${sigma2Full})`);
	if (k < 1) throw new Error(`mallowCp: k must be at least 1 (got ${k})`);
	return rss / sigma2Full - (n - 2 * k);
}

/**
 * AIC = −2 log L + 2k. For the Gaussian linear model this equals
 * n·ln(RSS/n) + 2k up to an additive constant (n ln(2π) + n) shared by all
 * candidate models — the exact form reported by R's AIC.lm / step(), which
 * reproduces the numbers of 9.choix_de_modele.pdf (prostate: AIC nul = 28.84,
 * modèle final = −61.37420). `k` counts coefficients including the intercept.
 */
export function aic(rss: number, n: number, k: number): number {
	if (rss <= 0) throw new Error(`aic: rss must be positive (got ${rss})`);
	if (n <= 0) throw new Error(`aic: n must be positive (got ${n})`);
	if (k < 1) throw new Error(`aic: k must be at least 1 (got ${k})`);
	return n * Math.log(rss / n) + 2 * k;
}

/**
 * BIC = −2 log L + k·ln n — same Gaussian-linear-model form as `aic`, with
 * the stronger penalty k·ln n (9.choix_de_modele.pdf, "Critère d'information
 * bayésien BIC"). `k` counts coefficients including the intercept.
 */
export function bic(rss: number, n: number, k: number): number {
	if (rss <= 0) throw new Error(`bic: rss must be positive (got ${rss})`);
	if (n <= 1) throw new Error(`bic: n must be greater than 1 (got ${n})`);
	if (k < 1) throw new Error(`bic: k must be at least 1 (got ${k})`);
	return n * Math.log(rss / n) + k * Math.log(n);
}

/** Model-selection criterion: (rss, n, k) → score, k = number of coefficients including the intercept. */
export type SelectionCriterion = (rss: number, n: number, k: number) => number;

/**
 * RSS of the least-squares fit of y on the intercept plus the regressors in
 * `subset` (0-based regressor indices, intercept excluded — the actual X
 * column is therefore `j + 1`).
 */
function subsetRss(X: number[][], y: number[], subset: number[]): number {
	const cols = [0, ...subset.map((j) => j + 1)];
	const design = X.map((row) => cols.map((c) => row[c]));
	const beta = olsClosedForm(design, y);
	const yHat = matVec(design, beta);
	return y.reduce((a, yi, i) => a + (yi - yHat[i]) * (yi - yHat[i]), 0);
}

/**
 * Exhaustive best-subset selection over all 2^p models (9.choix_de_modele.pdf,
 * "Recherche exhaustive"). Guard: p ≤ 12 (the sources forbid p > 30 in
 * practice; 2^12 = 4096 fits is already the practical ceiling here).
 */
export function bestSubset(
	X: number[][],
	y: number[],
	criterion: SelectionCriterion = aic
): { perSize: { size: number; subset: number[]; value: number }[]; best: { subset: number[]; value: number } } {
	const p = X[0].length - 1;
	const n = X.length;
	if (p > 12) throw new Error(`bestSubset: p = ${p} exceeds the exhaustive-search ceiling of 12 (see 9.choix_de_modele.pdf)`);
	if (n <= p + 1) throw new Error(`bestSubset: need n > p + 1 (got n = ${n}, p = ${p})`);

	const perSize: { size: number; subset: number[]; value: number }[] = [];
	let best: { subset: number[]; value: number } | null = null;

	for (let mask = 0; mask < 2 ** p; mask++) {
		const subset: number[] = [];
		for (let j = 0; j < p; j++) if (mask & (1 << j)) subset.push(j);
		const k = subset.length + 1;
		const rss = subsetRss(X, y, subset);
		const value = criterion(rss, n, k);
		const idx = subset.length;
		if (!perSize[idx] || value < perSize[idx].value) perSize[idx] = { size: idx, subset, value };
		if (!best || value < best.value) best = { subset, value };
	}
	return { perSize, best: best! };
}

export interface StepwiseResult {
	/** Criterion value at each step, from the start model to the final one. */
	steps: { subset: number[]; value: number }[];
	/** Final selected regressors (0-based, intercept excluded). */
	best: number[];
}

/**
 * Forward selection: start from S = ∅, at each step add the single regressor
 * that most decreases the criterion; stop when no addition improves it
 * (9.choix_de_modele.pdf, "Sélection pas à pas" — glouton).
 */
export function forwardSelection(X: number[][], y: number[], criterion: SelectionCriterion = aic): StepwiseResult {
	const p = X[0].length - 1;
	const n = X.length;
	if (n <= p + 1) throw new Error(`forwardSelection: need n > p + 1 (got n = ${n}, p = ${p})`);

	let current: number[] = [];
	let value = criterion(subsetRss(X, y, current), n, 1);
	const steps: { subset: number[]; value: number }[] = [{ subset: [...current], value }];

	while (true) {
		let bestGain: { j: number; value: number } | null = null;
		for (let j = 0; j < p; j++) {
			if (current.includes(j)) continue;
			const v = criterion(subsetRss(X, y, [...current, j]), n, current.length + 2);
			if (!bestGain || v < bestGain.value) bestGain = { j, value: v };
		}
		if (!bestGain || bestGain.value >= value) break;
		current = [...current, bestGain.j].toSorted((a, b) => a - b);
		value = bestGain.value;
		steps.push({ subset: [...current], value });
	}
	return { steps, best: current };
}

/**
 * Backward elimination: start from the full model, at each step remove the
 * single regressor whose removal most decreases the criterion; stop when no
 * removal improves it. Fails when n < p + 1, as the sources note
 * (9.choix_de_modele.pdf, "Sélection pas à pas").
 */
export function backwardSelection(X: number[][], y: number[], criterion: SelectionCriterion = aic): StepwiseResult {
	const p = X[0].length - 1;
	const n = X.length;
	if (n <= p + 1) throw new Error(`backwardSelection: need n > p + 1 (got n = ${n}, p = ${p})`);

	let current: number[] = Array.from({ length: p }, (_, j) => j);
	let value = criterion(subsetRss(X, y, current), n, p + 1);
	const steps: { subset: number[]; value: number }[] = [{ subset: [...current], value }];

	while (current.length > 0) {
		let bestRemoval: { j: number; value: number } | null = null;
		for (const j of current) {
			const remaining = current.filter((c) => c !== j);
			const v = criterion(subsetRss(X, y, remaining), n, remaining.length + 1);
			if (!bestRemoval || v < bestRemoval.value) bestRemoval = { j, value: v };
		}
		if (!bestRemoval || bestRemoval.value >= value) break;
		current = current.filter((c) => c !== bestRemoval!.j);
		value = bestRemoval.value;
		steps.push({ subset: [...current], value });
	}
	return { steps, best: current };
}

/**
 * Stepwise "both direction": at each step try every addition and every
 * removal, take the single best move; stop when no move improves the
 * criterion (9.choix_de_modele.pdf, "Sélection pas à pas").
 */
export function stepwiseBoth(X: number[][], y: number[], criterion: SelectionCriterion = aic): StepwiseResult {
	const p = X[0].length - 1;
	const n = X.length;
	if (n <= p + 1) throw new Error(`stepwiseBoth: need n > p + 1 (got n = ${n}, p = ${p})`);

	let current: number[] = [];
	let value = criterion(subsetRss(X, y, current), n, 1);
	const steps: { subset: number[]; value: number }[] = [{ subset: [...current], value }];

	while (true) {
		let bestMove: { subset: number[]; value: number } | null = null;
		for (let j = 0; j < p; j++) {
			if (current.includes(j)) continue;
			const candidate = [...current, j].toSorted((a, b) => a - b);
			const v = criterion(subsetRss(X, y, candidate), n, candidate.length + 1);
			if (!bestMove || v < bestMove.value) bestMove = { subset: candidate, value: v };
		}
		for (const j of current) {
			const candidate = current.filter((c) => c !== j);
			const v = criterion(subsetRss(X, y, candidate), n, candidate.length + 1);
			if (!bestMove || v < bestMove.value) bestMove = { subset: candidate, value: v };
		}
		if (!bestMove || bestMove.value >= value) break;
		current = bestMove.subset;
		value = bestMove.value;
		steps.push({ subset: [...current], value });
	}
	return { steps, best: current };
}

// ─── Generalized least squares (MCG) ──────────────────────

/**
 * Generalized least squares estimate β̂MCG = (Xᵀℱ⁻¹X)⁻¹Xᵀℱ⁻¹Y under
 * (H2′) Σε = σ²ℱ, ℱ known, symmetric, definite positive, rang n
 * (StatM1S1_2025.pdf, §7 "Moindres carrés généralisés"). Equivalent to
 * whitening the model with ℱ = PPᵀ (multiply by P⁻¹) and running OLS.
 */
export function glsClosedForm(X: number[][], y: number[], F: number[][]): number[] {
	const n = X.length,
		d = X[0].length;
	if (F.length !== n || F[0].length !== n) throw new Error(`glsClosedForm: F must be ${n}×${n}`);
	if (y.length !== n) throw new Error(`glsClosedForm: y must have length ${n}`);
	const Finv = invert(F);
	const Ft = transpose(X, n, d);
	const XTFiX = matMul(matMul(Ft, Finv), X);
	const XTFiy = matVec(Ft, matVec(Finv, y));
	return solveLinearSystem(XTFiX, XTFiy);
}

/**
 * Unbiased variance estimator for MCG: σ̂²MCG = ‖Y − Xβ̂MCG‖²_ℱ⁻¹ / (n−p−1),
 * with ‖A‖²_ℱ⁻¹ = Aᵀℱ⁻¹A (StatM1S1_2025.pdf, §7). `p` = d − 1.
 */
export function glsSigma2(y: number[], X: number[][], beta: number[], F: number[][], p: number): number {
	const n = X.length;
	if (n <= p + 1) throw new Error(`glsSigma2: need n > p + 1 (got n = ${n}, p = ${p})`);
	const r = y.map((yi, i) => yi - matVec(X, beta)[i]);
	const Finv = invert(F);
	const FinvR = matVec(Finv, r);
	const s = r.reduce((a, ri, i) => a + ri * FinvR[i], 0);
	return s / (n - p - 1);
}

/**
 * Variance-covariance of the OLS estimate under (H1) and (H2′) Σε = σ²ℱ:
 * Var(β̂) = σ²(XᵀX)⁻¹XᵀℱX(XᵀX)⁻¹ (StatM1S1_2025.pdf, §7). OLS stays
 * unbiased but is no longer BLUE — used by the MCG demo W3.4 to show the
 * (possibly inflated) variance OLS actually attains when errors are
 * correlated.
 */
export function olsVarianceWithCorrelation(X: number[][], F: number[][], sigma2: number): number[][] {
	const n = X.length,
		d = X[0].length;
	if (F.length !== n || F[0].length !== n) throw new Error(`olsVarianceWithCorrelation: F must be ${n}×${n}`);
	if (sigma2 <= 0) throw new Error(`olsVarianceWithCorrelation: sigma2 must be positive (got ${sigma2})`);
	const Xt = transpose(X, n, d);
	const XtXinv = invert(matMul(Xt, X));
	const XtFx = matMul(matMul(Xt, F), X);
	return matMul(
		matMul(
			XtXinv,
			XtFx.map((row) => row.map((v) => v * sigma2))
		),
		XtXinv
	);
}

/**
 * Variance-covariance of the MCG estimate under (H1) and (H2′):
 * Var(β̂MCG) = σ²(Xᵀℱ⁻¹X)⁻¹ (StatM1S1_2025.pdf, §7). Equal to
 * covarianceBeta on the whitened design; no larger (in Loewner order)
 * than the OLS variance of olsVarianceWithCorrelation.
 */
export function glsVarianceBeta(X: number[][], F: number[][], sigma2: number): number[][] {
	const n = X.length,
		d = X[0].length;
	if (F.length !== n || F[0].length !== n) throw new Error(`glsVarianceBeta: F must be ${n}×${n}`);
	if (sigma2 <= 0) throw new Error(`glsVarianceBeta: sigma2 must be positive (got ${sigma2})`);
	const Xt = transpose(X, n, d);
	const Finv = invert(F);
	return invert(matMul(matMul(Xt, Finv), X)).map((row) => row.map((v) => v * sigma2));
}

// ─── Seeded simulators (demos) ────────────────────────────

export type ResidualScenario = 'gaussian' | 'quadratic' | 'fan' | 'asymmetric' | 'autocorrelated';

/**
 * Seeded regression sample y = 2 + 1.5x + ε with a chosen residual scenario
 * (8.validation…, "Graphes des résidus" — each pathology has a visual
 * signature). x is uniform on [0, 10]; scenarios:
 *  - 'gaussian'      : ε ~ N(0, 1) (correct model);
 *  - 'quadratic'     : + 0.3(x − 5)² systematic term (non-linearity → blocks);
 *  - 'fan'           : Var(ε) grows with x (heteroscedasticity);
 *  - 'asymmetric'    : skewed (log-normal) errors (multiple-populations look);
 *  - 'autocorrelated': AR(1) errors with ρ = 0.7 (time series).
 */
export function simulateResidualScenario(n: number, scenario: ResidualScenario, seed: number): { x: number[]; y: number[] } {
	if (n < 2) throw new Error(`simulateResidualScenario: n must be at least 2 (got ${n})`);
	const rng = mulberry32(combineSeed(seed, 1));
	const x = Array.from({ length: n }, () => rng() * 10);
	const base: Gaussian = { mu: 0, sigma2: 1 };

	const y = new Array<number>(n);
	if (scenario === 'autocorrelated') {
		const rho = 0.7;
		let eps = 0;
		for (let i = 0; i < n; i++) {
			eps = rho * eps + gaussianSample(base, mulberry32(combineSeed(seed, i + 2)));
			y[i] = 2 + 1.5 * x[i] + eps;
		}
	} else {
		for (let i = 0; i < n; i++) {
			let eps = 0;
			if (scenario === 'gaussian') eps = gaussianSample(base, mulberry32(combineSeed(seed, i + 2)));
			else if (scenario === 'quadratic') eps = 0.3 * (x[i] - 5) * (x[i] - 5) + 0.5 * gaussianSample(base, mulberry32(combineSeed(seed, i + 2)));
			else if (scenario === 'fan') eps = (0.5 + 0.3 * x[i]) * gaussianSample(base, mulberry32(combineSeed(seed, i + 2)));
			else if (scenario === 'asymmetric') eps = Math.exp(0.8 * gaussianSample(base, mulberry32(combineSeed(seed, i + 2)))) - 1.32;
			y[i] = 2 + 1.5 * x[i] + eps;
		}
	}
	return { x, y };
}

/** AR(1) correlation matrix ℱ with ℱij = ρ^|i−j| (used by the MCG demo, StatM1S1_2025.pdf §7). */
export function ar1Correlation(n: number, rho: number): number[][] {
	if (n < 1) throw new Error(`ar1Correlation: n must be positive (got ${n})`);
	if (rho <= -1 || rho >= 1) throw new Error(`ar1Correlation: rho must be in (−1, 1) (got ${rho})`);
	return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Math.pow(rho, Math.abs(i - j))));
}

/**
 * Seeded AR(1) error process: ε0 ~ N(0, 1/(1−ρ²)) (stationary draw), then
 * εi = ρ·εi−1 + zi with zi ~ N(0,1) i.i.d. (StatM1S1_2025.pdf, §7 — (H2′)
 * Σε = σ²ℱ with ℱ the AR(1) matrix; used by the MCG demo W3.4). Stationary
 * variance 1/(1−ρ²); starting from the stationary law keeps the simulated
 * covariance at σ²ℱ even for the short series the demo uses (starting at
 * ε0 = 0 would drag the simulated variances below the displayed theory at
 * high ρ).
 */
export function ar1Samples(n: number, rho: number, seed: number): number[] {
	if (n < 1) throw new Error(`ar1Samples: n must be positive (got ${n})`);
	if (rho <= -1 || rho >= 1) throw new Error(`ar1Samples: rho must be in (−1, 1) (got ${rho})`);
	const rng = mulberry32(combineSeed(seed, 1));
	const base: Gaussian = { mu: 0, sigma2: 1 };
	const out = new Array<number>(n);
	let eps = Math.sqrt(1 / (1 - rho * rho)) * gaussianSample(base, rng);
	for (let i = 0; i < n; i++) {
		if (i > 0) eps = rho * eps + gaussianSample(base, rng);
		out[i] = eps;
	}
	return out;
}

/**
 * B seeded simple-regression fits on x = linspace(0, spread, n),
 * y = β0 + β1x + N(0, σ²): returns the B estimates of β̂1
 * (StatM1S1_2025.pdf, §6 — β̂ ~ N(β, σ²(XᵀX)⁻¹); the sampling demo W3.1).
 */
export function repeatedSlopeSamples(opts: { n: number; spread: number; beta0: number; beta1: number; sigma: number; B: number; seed: number }): number[] {
	const { n, spread, beta0, beta1, sigma, B, seed } = opts;
	if (n < 3) throw new Error(`repeatedSlopeSamples: n must be at least 3 (got ${n})`);
	if (spread <= 0) throw new Error(`repeatedSlopeSamples: spread must be positive (got ${spread})`);
	if (sigma <= 0) throw new Error(`repeatedSlopeSamples: sigma must be positive (got ${sigma})`);
	if (B < 1) throw new Error(`repeatedSlopeSamples: B must be at least 1 (got ${B})`);

	const x = linspace(0, spread, n);
	const out = new Array<number>(B);
	for (let b = 0; b < B; b++) {
		const rng = mulberry32(combineSeed(seed, b + 1));
		const y = x.map((xi) => beta0 + beta1 * xi + sigma * gaussianSample({ mu: 0, sigma2: 1 }, rng));
		const fit = olsFit(withIntercept(x.map((xi) => [xi])), y);
		out[b] = fit.beta[1];
	}
	return out;
}

/**
 * B repeated simple regressions y = β0 + β1x + N(0, σ²) (x on
 * linspace(0, spread, n)), each with its (1−α)·100 % t-interval of the slope:
 * β̂1 ± t_{n−3}(1−α/2)·σ̂·√[(XᵀX)⁻¹]₁₁ (StatM1S1_2025.pdf, §6.3).
 * Sampling demo W3.1 — the empirical coverage over the B samples should be
 * close to 1−α.
 */
export function repeatedSlopeIntervals(opts: { n: number; spread: number; beta0: number; beta1: number; sigma: number; B: number; alpha: number; seed: number }): Array<{ est: number; lo: number; hi: number }> {
	const { n, spread, beta0, beta1, sigma, B, alpha, seed } = opts;
	if (!(alpha > 0 && alpha < 1)) throw new Error(`repeatedSlopeIntervals: alpha must be in (0, 1) (got ${alpha})`);

	const x = linspace(0, spread, n);
	const X = withIntercept(x.map((xi) => [xi]));
	const out: Array<{ est: number; lo: number; hi: number }> = [];
	for (let b = 0; b < B; b++) {
		const rng = mulberry32(combineSeed(seed, b + 1));
		const y = x.map((xi) => beta0 + beta1 * xi + sigma * gaussianSample({ mu: 0, sigma2: 1 }, rng));
		const fit = olsFit(X, y);
		const se = Math.sqrt(covarianceBeta(X, fit.sigma2)[1][1]);
		const [lo, hi] = tConfidenceInterval(fit.beta[1], se, alpha, n - 3);
		out.push({ est: fit.beta[1], lo, hi });
	}
	return out;
}

/**
 * Seeded sample from a true polynomial of the given degree (degree-0 to
 * n−1 overfitting demo, 9.choix_de_modele.pdf, §7.1): coefficients drawn
 * from N(0, 1), x uniform on [0, 10], y = P(x) + N(0, σ²).
 */
export function polynomialFamily(opts: { n: number; degree: number; sigma: number; seed: number }): { x: number[]; y: number[]; trueBeta: number[] } {
	const { n, degree, sigma, seed } = opts;
	if (n < 3) throw new Error(`polynomialFamily: n must be at least 3 (got ${n})`);
	if (!Number.isInteger(degree) || degree < 0 || degree > n - 1) throw new Error(`polynomialFamily: degree must be in [0, n−1] (got ${degree})`);
	if (sigma <= 0) throw new Error(`polynomialFamily: sigma must be positive (got ${sigma})`);

	const rng = mulberry32(combineSeed(seed, 1));
	const trueBeta = Array.from({ length: degree + 1 }, () => gaussianSample({ mu: 0, sigma2: 1 }, rng));
	const x = linspace(0, 10, n);
	const y = x.map((xi, i) => {
		const value = trueBeta.reduce((a, b, j) => a + b * Math.pow(xi, j), 0);
		return value + sigma * gaussianSample({ mu: 0, sigma2: 1 }, mulberry32(combineSeed(seed, i + 2)));
	});
	return { x, y, trueBeta };
}

/**
 * Coefficients of the degree n−1 polynomial interpolating the n points
 * (x_i, y_i) — the RSS = 0 endpoint of the bias/variance illustration
 * (9.choix_de_modele.pdf, « Illustration : Compromis Biais/Variance »).
 * `olsFit` refuses this case (n = p + 1, zero residual degrees of freedom)
 * and the normal equation (XᵀX)⁻¹XᵀY is far too ill-conditioned for a
 * 15×15 Vandermonde on [0, 10] (residual ~3 instead of ~0), so the square
 * system Xβ = y is solved directly with partial pivoting.
 */
export function interpolatingPolynomialBeta(x: number[], y: number[]): number[] {
	if (x.length !== y.length) throw new Error(`interpolatingPolynomialBeta: x/y length mismatch (${x.length} vs ${y.length})`);
	if (x.length < 2) throw new Error(`interpolatingPolynomialBeta: need at least 2 points (got ${x.length})`);
	if (new Set(x).size !== x.length) throw new Error('interpolatingPolynomialBeta: x values must be distinct');
	return solveLinearSystem(polynomialDesign(x, x.length - 1), y);
}

/**
 * Value at x of the polynomial with coefficients `beta` (column j is x^j).
 * Demo W5.1 uses it to build a fresh test set from `polynomialFamily`'s true
 * coefficients (9.choix_de_modele.pdf, « Illustration : Compromis
 * Biais/Variance »).
 */
export function polyValue(beta: number[], x: number): number {
	let v = 0;
	for (let j = 0; j < beta.length; j++) v += beta[j] * Math.pow(x, j);
	return v;
}

/**
 * Mean squared prediction error of a polynomial OLS fit on a fresh sample
 * (demo W5.1, 9.choix_de_modele.pdf, « Illustration : Compromis
 * Biais/Variance » : l'erreur de test en U, minimale au voisinage du vrai
 * degré). `fit.beta` has one coefficient per polynomial column (x^0 … x^d).
 */
export function polynomialTestMSE(fit: LinearModelFit, xTest: number[], yTest: number[]): number {
	if (xTest.length !== yTest.length) throw new Error('polynomialTestMSE: xTest/yTest length mismatch');
	if (xTest.length === 0) throw new Error('polynomialTestMSE: empty test set');
	let s = 0;
	for (let i = 0; i < xTest.length; i++) {
		const err = polyValue(fit.beta, xTest[i]) - yTest[i];
		s += err * err;
	}
	return s / xTest.length;
}

/**
 * Seeded variable-selection problem for the demos (9.choix_de_modele.pdf,
 * exemple prostate): n = 100, p = 8 predictors — 3 relevant (x1, x2, x3),
 * 1 null but strongly correlated with x1 (x4), 4 pure noise (x5…x8).
 * X column 0 is the intercept; `trueSupport` lists the relevant regressors.
 */
export function selectionProblem(seed: number): { X: number[][]; y: number[]; trueSupport: number[] } {
	const n = 100;
	const rng = mulberry32(combineSeed(seed, 1));
	const raw = Array.from({ length: 8 }, () => new Array<number>(n).fill(0).map(() => gaussianSample({ mu: 0, sigma2: 1 }, rng)));
	// x4 (index 3): null but correlated with x1, ρ ≈ 0.9.
	for (let i = 0; i < n; i++) raw[3][i] = 0.9 * raw[0][i] + Math.sqrt(1 - 0.81) * gaussianSample({ mu: 0, sigma2: 1 }, rng);

	const X: number[][] = [];
	const y: number[] = [];
	for (let i = 0; i < n; i++) {
		const noise = gaussianSample({ mu: 0, sigma2: 1 }, rng);
		X.push([1, ...raw.map((col) => col[i])]);
		y.push(1 + 2 * raw[0][i] + 1.5 * raw[1][i] - raw[2][i] + noise);
	}
	return { X, y, trueSupport: [0, 1, 2] };
}

/**
 * Seeded pair of N(0,1) predictors with target correlation ρ:
 * x1 ~ N(0,1), x2 = ρ·x1 + √(1−ρ²)·z (demo W1.3 — the effect of the
 * predictor correlation on Var(β̂j) = σ²(XᵀX)⁻¹, StatM1S1_2025.pdf §I.4.3).
 */
export function correlatedPredictors(n: number, rho: number, seed: number): { x1: number[]; x2: number[] } {
	if (n < 2) throw new Error(`correlatedPredictors: n must be at least 2 (got ${n})`);
	if (rho <= -1 || rho >= 1) throw new Error(`correlatedPredictors: rho must be in (−1, 1) (got ${rho})`);
	const rng = mulberry32(combineSeed(seed, 1));
	const base: Gaussian = { mu: 0, sigma2: 1 };
	const x1: number[] = [];
	const x2: number[] = [];
	for (let i = 0; i < n; i++) {
		const u = gaussianSample(base, rng);
		const z = gaussianSample(base, rng);
		x1.push(u);
		x2.push(rho * u + Math.sqrt(1 - rho * rho) * z);
	}
	return { x1, x2 };
}

/**
 * Seeded two-factor response for the interaction demo 2.7
 * (ModèleLinéaire_ANOVA_ANCOVA.pdf, ANOVA à 2 facteurs):
 *   Y = αi + βj + γij·1{interaction} + N(0,1),
 * with `nPerCell` observations per (i, j) cell and effects drawn from N(0, 4).
 * `gamma` is all zeros when `interaction` is false (additive model).
 */
export function twoFactorData(opts: { nPerCell: number; iLevels: number; jLevels: number; interaction: boolean; seed: number }): {
	iLevels: number[];
	jLevels: number[];
	y: number[];
	alpha: number[];
	beta: number[];
	gamma: number[];
} {
	const { nPerCell, iLevels: I, jLevels: J, interaction, seed } = opts;
	if (!Number.isInteger(nPerCell) || nPerCell < 1) throw new Error(`twoFactorData: nPerCell must be a positive integer (got ${nPerCell})`);
	if (!Number.isInteger(I) || I < 2) throw new Error(`twoFactorData: need at least 2 levels of factor 1 (got ${I})`);
	if (!Number.isInteger(J) || J < 2) throw new Error(`twoFactorData: need at least 2 levels of factor 2 (got ${J})`);

	const rng = mulberry32(combineSeed(seed, 1));
	const effect: Gaussian = { mu: 0, sigma2: 4 };
	const noise: Gaussian = { mu: 0, sigma2: 1 };
	const alpha = Array.from({ length: I }, () => gaussianSample(effect, rng));
	const beta = Array.from({ length: J }, () => gaussianSample(effect, rng));
	const gamma = interaction ? Array.from({ length: I * J }, () => gaussianSample(noise, rng)) : new Array<number>(I * J).fill(0);

	const iLevels: number[] = [];
	const jLevels: number[] = [];
	const y: number[] = [];
	for (let i = 0; i < I; i++) {
		for (let j = 0; j < J; j++) {
			for (let k = 0; k < nPerCell; k++) {
				iLevels.push(i);
				jLevels.push(j);
				y.push(alpha[i] + beta[j] + gamma[i * J + j] + gaussianSample(noise, rng));
			}
		}
	}
	return { iLevels, jLevels, y, alpha, beta, gamma };
}
