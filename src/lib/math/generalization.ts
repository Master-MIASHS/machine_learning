// src/lib/math/generalization.ts
//
// Part VI — Généralisation
// Reference: theorie.typ — "Majoration de l'erreur de généralisation : cas
// fini" (Théorème 3.1 séparable, Théorème 3.2 non séparable/Hoeffding), and
// "Limites de la théorie VC pour les réseaux de neurones" (double descente,
// Belkin et al. 2019 — the pseudo-inverse linear regression figure,
// d=50, 50 répétitions, bruit irréductible sigma^2=1).
// ---------------------------------------------------------------------------
// Cas séparable (Théorème 3.1)
// ---------------------------------------------------------------------------

import { mulberry32 } from './util';

/**
 * Union-bound probability that at least one "bad" hypothesis (R(h) > epsilon)
 * achieves zero empirical risk on a sample of size n — the "échantillon
 * trompeur" bound: P^n(R(hhat_S) > epsilon) <= |H| e^{-n*epsilon}.
 */
export function misleadingSampleBound(classSize: number, n: number, epsilon: number): number {
	if (classSize <= 0) throw new Error(`classSize must be positive, got ${classSize}`);
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (epsilon <= 0) throw new Error(`epsilon must be positive, got ${epsilon}`);
	return classSize * Math.exp(-n * epsilon);
}

/**
 * Minimal sample size for the separable-case guarantee P(R(hhat_S)>epsilon) <= delta:
 * n >= log(|H|/delta) / epsilon.
 */
export function separableSampleSizeBound(
	classSize: number,
	epsilon: number,
	delta: number
): number {
	if (classSize <= 0) throw new Error(`classSize must be positive, got ${classSize}`);
	if (epsilon <= 0) throw new Error(`epsilon must be positive, got ${epsilon}`);
	if (delta <= 0 || delta >= 1) throw new Error(`delta must be in (0,1), got ${delta}`);
	return Math.log(classSize / delta) / epsilon;
}

/**
 * The separable-case risk bound (corollaire): with probability 1-delta,
 * R(hhat_S) <= log(|H|/delta) / n.
 */
export function separableRiskBound(classSize: number, n: number, delta: number): number {
	if (classSize <= 0) throw new Error(`classSize must be positive, got ${classSize}`);
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (delta <= 0 || delta >= 1) throw new Error(`delta must be in (0,1), got ${delta}`);
	return Math.log(classSize / delta) / n;
}

// ---------------------------------------------------------------------------
// Misleading-hypothesis simulator (for FiniteClassGeneralizationDemo.svelte)
//
// theorie.typ's proof of Théorème 3.1 turns on: a "bad" hypothesis h (with
// R(h) > epsilon) is "misleading" if it happens to make zero errors on the
// sample anyway — P(misleading) = (1-R(h))^n <= e^{-n*epsilon}. Summing over
// bad hypotheses gives both the union-bound P(at least one exists) and,
// via linearity of expectation, a bound on E[misleading count] — the same
// quantity misleadingSampleBound() computes either way.
// ---------------------------------------------------------------------------

export interface SyntheticHypothesis {
	id: number;
	/** R(h) in [0,1]. The one designated "good" hypothesis has trueRisk = 0 (realizability). */
	trueRisk: number;
	isGood: boolean;
}

/**
 * A synthetic class of `classSize` hypotheses: one "good" one with
 * trueRisk=0 (the realizable h*), and the rest "bad" with trueRisk drawn
 * uniformly in (epsilon, 1]. Deterministic for a given seed.
 */
export function generateHypothesisClass(
	classSize: number,
	epsilon: number,
	seed = 1
): SyntheticHypothesis[] {
	if (classSize <= 0) throw new Error(`classSize must be positive, got ${classSize}`);
	if (epsilon <= 0 || epsilon >= 1) throw new Error(`epsilon must be in (0,1), got ${epsilon}`);
	const rand = mulberry32(seed);
	const hypotheses: SyntheticHypothesis[] = [{ id: 0, trueRisk: 0, isGood: true }];
	for (let i = 1; i < classSize; i++) {
		hypotheses.push({ id: i, trueRisk: epsilon + rand() * (1 - epsilon), isGood: false });
	}
	return hypotheses;
}

export interface AnnotatedHypothesis extends SyntheticHypothesis {
	/** Did this hypothesis achieve zero empirical risk on the (simulated) sample? */
	empiricalRiskZero: boolean;
	/** True iff bad AND achieved zero empirical risk — an "échantillon trompeur" hypothesis. */
	isMisleading: boolean;
}

export interface MisleadingSampleResult {
	hypotheses: AnnotatedHypothesis[];
	misleadingCount: number;
}

/**
 * Simulate, for ONE sample of size n, which bad hypotheses happen to make
 * zero training errors (P = (1-trueRisk)^n each) — no need to simulate
 * individual data points, since errors are i.i.d. Bernoulli. The designated
 * good hypothesis always has zero empirical risk by the realizability
 * assumption. Deterministic for a given seed.
 */
export function simulateMisleadingHypotheses(
	hypotheses: SyntheticHypothesis[],
	n: number,
	seed = 1
): MisleadingSampleResult {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	const rand = mulberry32(seed);
	const annotated: AnnotatedHypothesis[] = hypotheses.map((h) => {
		if (h.isGood) {
			return { ...h, empiricalRiskZero: true, isMisleading: false };
		}
		const probZeroErrors = Math.pow(1 - h.trueRisk, n);
		const empiricalRiskZero = rand() < probZeroErrors;
		return { ...h, empiricalRiskZero, isMisleading: empiricalRiskZero };
	});
	return {
		hypotheses: annotated,
		misleadingCount: annotated.filter((h) => h.isMisleading).length
	};
}

// ---------------------------------------------------------------------------
// Cas non séparable — Hoeffding (Théorème 3.2)
// ---------------------------------------------------------------------------

/** Hoeffding's two-sided tail bound for Z_i in [0,1] i.i.d.: P(|Zbar_n - E[Z1]| >= t) <= 2e^{-2nt^2}. */
export function hoeffdingBound(n: number, t: number): number {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (t <= 0) throw new Error(`t must be positive, got ${t}`);
	return 2 * Math.exp(-2 * n * t * t);
}

/**
 * Uniform (over a finite class H) Hoeffding bound (Théorème 3.2): with
 * probability 1-delta, simultaneously for all h in H,
 *   |R(h) - R_S(h)| <= sqrt((log|H| + log(2/delta)) / (2n)).
 */
export function hoeffdingUniformBound(classSize: number, n: number, delta: number): number {
	if (classSize <= 0) throw new Error(`classSize must be positive, got ${classSize}`);
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (delta <= 0 || delta >= 1) throw new Error(`delta must be in (0,1), got ${delta}`);
	return Math.sqrt((Math.log(classSize) + Math.log(2 / delta)) / (2 * n));
}

/** Convenience wrapper: R(hhat_S) <= empiricalRisk + hoeffdingUniformBound(...). */
export function finiteClassRiskBound(
	empiricalRisk: number,
	classSize: number,
	n: number,
	delta: number
): number {
	if (empiricalRisk < 0 || empiricalRisk > 1) {
		throw new Error(`empiricalRisk must be in [0,1], got ${empiricalRisk}`);
	}
	return empiricalRisk + hoeffdingUniformBound(classSize, n, delta);
}

// ---------------------------------------------------------------------------
// Generic hypothesis class + empirical-risk simulator
// (for UniformConvergenceDemo.svelte)
//
// Unlike generateHypothesisClass (which encodes the separable-case story:
// one good h with risk 0, the rest bad with risk > epsilon), this is just a
// spread of true risks across [0,1] — used to show R_S(h) vs R(h) for every
// h in a class at once, and to contrast a single h fixed in advance against
// the ERM-selected (data-dependent) hhat_S.
// ---------------------------------------------------------------------------

export interface GenericHypothesis {
	id: number;
	trueRisk: number;
}

/** classSize hypotheses with trueRisk drawn uniformly in [0,1]. Deterministic for a given seed. */
export function generateGenericHypothesisClass(classSize: number, seed = 1): GenericHypothesis[] {
	if (classSize <= 0) throw new Error(`classSize must be positive, got ${classSize}`);
	const rand = mulberry32(seed);
	return Array.from({ length: classSize }, (_, i) => ({ id: i, trueRisk: rand() }));
}

export interface EmpiricalRiskPoint extends GenericHypothesis {
	empiricalRisk: number;
}

/**
 * Simulate the empirical risk R_S(h) of every hypothesis on ONE sample of
 * size n — n independent Bernoulli(trueRisk) draws per hypothesis, averaged.
 * Deterministic for a given seed.
 */
export function simulateEmpiricalRisks(
	hypotheses: GenericHypothesis[],
	n: number,
	seed = 1
): EmpiricalRiskPoint[] {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	const rand = mulberry32(seed);
	return hypotheses.map((h) => {
		let errors = 0;
		for (let i = 0; i < n; i++) {
			if (rand() < h.trueRisk) errors++;
		}
		return { ...h, empiricalRisk: errors / n };
	});
}

// ---------------------------------------------------------------------------
// Small linear-algebra helpers (private) — enough for pseudo-inverse
// regression, nothing more general.
// ---------------------------------------------------------------------------

type Matrix = number[][];

function transpose(A: Matrix): Matrix {
	const rows = A.length;
	const cols = A[0].length;
	const T: Matrix = Array.from({ length: cols }, () => new Array(rows));
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) T[j][i] = A[i][j];
	}
	return T;
}

function matMul(A: Matrix, B: Matrix): Matrix {
	const n = A.length;
	const k = A[0].length;
	const m = B[0].length;
	const C: Matrix = Array.from({ length: n }, () => new Array(m).fill(0));
	for (let i = 0; i < n; i++) {
		for (let l = 0; l < k; l++) {
			const a = A[i][l];
			if (a === 0) continue;
			for (let j = 0; j < m; j++) C[i][j] += a * B[l][j];
		}
	}
	return C;
}

function matVecMul(A: Matrix, v: number[]): number[] {
	return A.map((row) => row.reduce((s, a, i) => s + a * v[i], 0));
}

/**
 * Gauss-Jordan inversion with partial pivoting. Pivots are floored at 1e-10
 * (in magnitude) rather than rejected outright — near-singular matrices
 * therefore produce very large but finite entries rather than crashing. This
 * is deliberate: the resulting instability near n=d is exactly the numerical
 * phenomenon the double-descent simulation below is meant to exhibit.
 */
function invertMatrix(A: Matrix): Matrix {
	const n = A.length;
	const EPS = 1e-10;
	const M: Matrix = A.map((row, i) => [
		...row,
		...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
	]);

	for (let col = 0; col < n; col++) {
		let pivotRow = col;
		let maxVal = Math.abs(M[col][col]);
		for (let r = col + 1; r < n; r++) {
			if (Math.abs(M[r][col]) > maxVal) {
				maxVal = Math.abs(M[r][col]);
				pivotRow = r;
			}
		}
		if (pivotRow !== col) {
			[M[col], M[pivotRow]] = [M[pivotRow], M[col]];
		}
		let pivot = M[col][col];
		if (Math.abs(pivot) < EPS) pivot = pivot >= 0 ? EPS : -EPS;
		for (let j = 0; j < 2 * n; j++) M[col][j] /= pivot;
		for (let r = 0; r < n; r++) {
			if (r === col) continue;
			const factor = M[r][col];
			if (factor === 0) continue;
			for (let j = 0; j < 2 * n; j++) M[r][j] -= factor * M[col][j];
		}
	}

	return M.map((row) => row.slice(n));
}

function gaussianSample(rand: () => number): number {
	let u1 = 0;
	while (u1 === 0) u1 = rand(); // avoid log(0)
	const u2 = rand();
	return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function randomMatrix(rows: number, cols: number, rand: () => number): Matrix {
	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => gaussianSample(rand))
	);
}

function randomVector(len: number, rand: () => number): number[] {
	return Array.from({ length: len }, () => gaussianSample(rand));
}

function meanSquaredError(yTrue: number[], yPred: number[]): number {
	let s = 0;
	for (let i = 0; i < yTrue.length; i++) s += (yTrue[i] - yPred[i]) ** 2;
	return s / yTrue.length;
}

/**
 * Fit linear regression via the pseudo-inverse: the dual (minimum-norm)
 * formulation beta = X^T(XX^T)^{-1}y when n<=d (underdetermined — infinitely
 * many interpolating solutions, pick the smallest-norm one), and ordinary
 * least squares beta = (X^TX)^{-1}X^Ty when n>d (overdetermined). Both route
 * through invertMatrix, so results become unstable near n=d — intentionally,
 * matching theorie.typ's description of the interpolation threshold.
 */
function fitMinNormLeastSquares(X: Matrix, y: number[]): number[] {
	const n = X.length;
	const d = X[0].length;
	const XT = transpose(X);
	if (n <= d) {
		const gram = matMul(X, XT); // n x n
		const alpha = matVecMul(invertMatrix(gram), y);
		return matVecMul(XT, alpha);
	}
	const gram = matMul(XT, X); // d x d
	const XTy = matVecMul(XT, y);
	return matVecMul(invertMatrix(gram), XTy);
}

// ---------------------------------------------------------------------------
// Double-descent simulator
// ---------------------------------------------------------------------------

export interface DoubleDescentPoint {
	n: number;
	trainRisk: number;
	testRisk: number;
}

function doubleDescentTrial(
	n: number,
	beta: number[],
	noiseStd: number,
	testSize: number,
	rand: () => number
): { trainRisk: number; testRisk: number } {
	const d = beta.length;

	const XTrain = randomMatrix(n, d, rand);
	const yTrain = matVecMul(XTrain, beta).map((v) => v + gaussianSample(rand) * noiseStd);
	const betaHat = fitMinNormLeastSquares(XTrain, yTrain);
	const trainRisk = meanSquaredError(yTrain, matVecMul(XTrain, betaHat));

	const XTest = randomMatrix(testSize, d, rand);
	const yTest = matVecMul(XTest, beta).map((v) => v + gaussianSample(rand) * noiseStd);
	const testRisk = meanSquaredError(yTest, matVecMul(XTest, betaHat));

	return { trainRisk, testRisk };
}

/**
 * Train/test risk of pseudo-inverse linear regression across a grid of
 * sample sizes n, for fixed dimension d — theorie.typ's double-descent
 * figure. A single ground-truth beta is drawn once (fixed for the whole
 * curve, isolating the sample-size effect from trial-to-trial signal
 * variation); X and noise are redrawn independently each repetition and
 * averaged. Deterministic for a given seed.
 *
 * Cost is O(repetitions * min(n,d)^3) per grid point — keep d, the grid
 * size, and repetitions modest for interactive use (theorie.typ's own
 * figure uses d=50 with 50 repetitions, offline).
 */
export function doubleDescentCurve(
	nGrid: number[],
	d = 50,
	repetitions = 10,
	noiseStd = 1,
	testSize = 200,
	seed = 1
): DoubleDescentPoint[] {
	if (d <= 0) throw new Error(`d must be positive, got ${d}`);
	if (repetitions <= 0) throw new Error(`repetitions must be positive, got ${repetitions}`);
	if (noiseStd < 0) throw new Error(`noiseStd must be >= 0, got ${noiseStd}`);
	if (testSize <= 0) throw new Error(`testSize must be positive, got ${testSize}`);

	const rand = mulberry32(seed);
	const beta = randomVector(d, rand); // fixed ground truth for the whole curve

	return nGrid.map((n) => {
		if (n <= 0) throw new Error(`n must be positive, got ${n}`);
		let trainSum = 0;
		let testSum = 0;
		for (let r = 0; r < repetitions; r++) {
			const { trainRisk, testRisk } = doubleDescentTrial(n, beta, noiseStd, testSize, rand);
			trainSum += trainRisk;
			testSum += testRisk;
		}
		return { n, trainRisk: trainSum / repetitions, testRisk: testSum / repetitions };
	});
}

// ---------------------------------------------------------------------------
// Indicative neural-network bounds (illustrative, NOT exact constants)
//
// theorie.typ ("Limites de la théorie VC pour les réseaux de neurones"):
// - Bartlett (1998): VCdim = O(W*L*log W) for W parameters, L layers
//   (threshold activations).
// - Bartlett/Foster/Telgarsky (2017): a norm-based bound depending on
//   per-layer weight norms rather than raw parameter count.
// Both are reproduced here WITHOUT their O(.)/tilde-O(.) constants — these
// are order-of-magnitude illustrations for NeuralGeneralizationExplorer.svelte,
// not rigorous bounds to quote as exact. The norm-based version additionally
// assumes a single uniform per-layer norm (both spectral and Frobenius),
// since the demo exposes one "weight norm" slider rather than per-layer
// values.
// ---------------------------------------------------------------------------

/** Rough parameter-count estimate for an L-layer fully-connected network of uniform width: W ≈ L * width^2. */
export function estimateParameterCount(depth: number, width: number): number {
	if (depth <= 0) throw new Error(`depth must be positive, got ${depth}`);
	if (width <= 0) throw new Error(`width must be positive, got ${width}`);
	return depth * width * width;
}

/** Indicative VC-dimension order of magnitude (Bartlett 1998, no constant): W*L*log(W). */
export function neuralVCDimEstimate(paramCount: number, depth: number): number {
	if (paramCount <= 1) throw new Error(`paramCount must be > 1, got ${paramCount}`);
	if (depth <= 0) throw new Error(`depth must be positive, got ${depth}`);
	return paramCount * depth * Math.log(paramCount);
}

/** Indicative VC-based generalization gap estimate: sqrt(vcDimEstimate/n), no constant. */
export function neuralVCGeneralizationEstimate(vcDimEstimate: number, n: number): number {
	if (vcDimEstimate < 0) throw new Error(`vcDimEstimate must be >= 0, got ${vcDimEstimate}`);
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	return Math.sqrt(vcDimEstimate / n);
}

/**
 * Indicative norm-based generalization gap estimate (Bartlett/Foster/
 * Telgarsky 2017 shape, no constant), assuming every layer shares the same
 * spectral norm AND the same Frobenius norm, both equal to `weightNorm`:
 *   weightNorm^depth * (depth * weightNorm^(2/3))^(3/2) / sqrt(n)
 * Small weightNorm (<1) shrinks toward 0 as depth grows (contractive
 * layers); weightNorm > 1 explodes with depth — deliberately, to illustrate
 * why controlling weight norms (regularization) matters for this bound to
 * stay meaningful.
 */
export function neuralNormBasedEstimate(depth: number, weightNorm: number, n: number): number {
	if (depth <= 0) throw new Error(`depth must be positive, got ${depth}`);
	if (weightNorm <= 0) throw new Error(`weightNorm must be positive, got ${weightNorm}`);
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	const spectralProduct = Math.pow(weightNorm, depth);
	const frobeniusSum = Math.pow(depth * Math.pow(weightNorm, 2 / 3), 3 / 2);
	return (spectralProduct * frobeniusSum) / Math.sqrt(n);
}
