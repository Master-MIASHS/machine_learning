// src/lib/math/consistency.ts
//
// Part V — Consistance
// Reference: theorie.typ — "Consistance", "Définition", "Pourquoi cette
// notion est-elle centrale ?", "Consistance universelle",
// "Consistance du classifieur k-NN" (Théorème 2.1, Stone 1977).
//
// theorie.typ proves consistency results but doesn't give a concrete
// learning-curve model to simulate from — the toy models below (excess risk
// as an Exponential random variable shrinking with n; k-NN excess risk as a
// bias/variance sum in k) are pedagogical stand-ins built for the demos in
// this lesson (ConsistencyConvergenceDemo, ApproximationEstimationDemo,
// KNNConsistencyDemo), not formulas drawn from the course text.

import { combineSeed, mulberry32 } from './util';

// ---------------------------------------------------------------------------
// Toy excess-risk model: R(h_n) - R* ~ Exponential(mean = scale(n))
// ---------------------------------------------------------------------------

/** Shape of the toy excess-risk model: scale(n) = biasConst / n^decayRate. */
export interface ExcessRiskModel {
	/** > 0 — overall magnitude of the excess risk. */
	biasConst: number;
	/** > 0 — how fast the excess risk shrinks with n. */
	decayRate: number;
}

/**
 * Mean excess risk at sample size n under the toy model: scale(n) =
 * biasConst / n^decayRate. Shrinks to 0 as n -> infty when decayRate > 0 —
 * this is the deterministic "bias" part of the toy learning curve.
 */
export function excessRiskScale(n: number, model: ExcessRiskModel): number {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	return model.biasConst / Math.pow(n, model.decayRate);
}

/**
 * One simulated draw of R(h_n) - R*, via inverse-CDF sampling of an
 * Exponential distribution with mean scale(n). Always >= 0, matching the
 * fact that no classifier can beat the Bayes risk.
 */
function sampleExcessRisk(n: number, model: ExcessRiskModel, rand: () => number): number {
	const scale = excessRiskScale(n, model);
	const u = Math.max(rand(), 1e-12); // avoid log(0)
	return -scale * Math.log(u);
}

/**
 * Simulate `trials` independent draws of R(h_n) at a fixed sample size n,
 * given a Bayes risk R* and the toy excess-risk model. Deterministic for a
 * given seed — used for the in-probability / mean-square consistency checks,
 * which are about repeated independent experiments at each n.
 */
export function simulateRiskTrials(
	n: number,
	trials: number,
	bayesRisk: number,
	model: ExcessRiskModel,
	seed = 1
): number[] {
	const rand = mulberry32(combineSeed(seed, n));
	const out: number[] = [];
	for (let i = 0; i < trials; i++) {
		out.push(bayesRisk + sampleExcessRisk(n, model, rand));
	}
	return out;
}

/**
 * Simulate a single trajectory of R(h_n) across a grid of sample sizes,
 * using one continuous PRNG stream throughout — a stand-in for ONE run of an
 * experiment as its sample size grows, which is what almost-sure convergence
 * is actually a statement about (unlike in-probability/mean-square, which
 * concern the distribution across many independent repetitions at each n).
 */
export function simulateRiskPath(
	nGrid: number[],
	bayesRisk: number,
	model: ExcessRiskModel,
	seed = 1
): number[] {
	const rand = mulberry32(seed);
	return nGrid.map((n) => bayesRisk + sampleExcessRisk(n, model, rand));
}

/**
 * Empirical P(R(h_n) - R* > epsilon) from a batch of trials — the quantity
 * that must -> 0 for consistency in probability (Définition 1.2).
 */
export function exceedanceProbability(
	riskSamples: number[],
	bayesRisk: number,
	epsilon: number
): number {
	if (riskSamples.length === 0) return 0;
	const count = riskSamples.filter((r) => r - bayesRisk > epsilon).length;
	return count / riskSamples.length;
}

/**
 * Empirical E[(R(h_n) - R*)^2] from a batch of trials — the quantity that
 * must -> 0 for consistency in mean square (Définition 1.2).
 */
export function meanSquaredExcessRisk(riskSamples: number[], bayesRisk: number): number {
	if (riskSamples.length === 0) return 0;
	const total = riskSamples.reduce((sum, r) => sum + (r - bayesRisk) ** 2, 0);
	return total / riskSamples.length;
}

// ---------------------------------------------------------------------------
// Stone's conditions (Théorème 2.1) — a finite-grid heuristic check
// ---------------------------------------------------------------------------

export interface StoneConditionsResult {
	/** k(n) is non-decreasing over the grid and its final value clears minFinalK. */
	kGrowsToInfinity: boolean;
	/** k(n)/n is non-increasing over the grid and its final value is below maxFinalRatio. */
	kOverNShrinksToZero: boolean;
	satisfiesStone: boolean;
}

/**
 * Checks Stone's two conditions — k(n) -> infty and k(n)/n -> 0 — on a
 * sequence k(n), evaluated over a finite grid of n values. A finite check can
 * only ever be suggestive of the limiting behavior, never a proof of it;
 * this is meant for interactive exploration (KNNConsistencyDemo.svelte), not
 * as a formal verifier.
 */
export function checkStoneConditions(
	nGrid: number[],
	kOfN: (n: number) => number,
	opts: { minFinalK?: number; maxFinalRatio?: number } = {}
): StoneConditionsResult {
	const { minFinalK = 10, maxFinalRatio = 0.05 } = opts;
	if (nGrid.length < 2) throw new Error('nGrid must have at least 2 points');

	const kValues = nGrid.map(kOfN);
	const ratios = nGrid.map((n, i) => kValues[i] / n);

	const kNonDecreasing = kValues.every((k, i) => i === 0 || k >= kValues[i - 1] - 1e-9);
	const kGrowsToInfinity = kNonDecreasing && kValues[kValues.length - 1] >= minFinalK;

	const ratioNonIncreasing = ratios.every((r, i) => i === 0 || r <= ratios[i - 1] + 1e-9);
	const kOverNShrinksToZero = ratioNonIncreasing && ratios[ratios.length - 1] <= maxFinalRatio;

	return {
		kGrowsToInfinity,
		kOverNShrinksToZero,
		satisfiesStone: kGrowsToInfinity && kOverNShrinksToZero
	};
}

// ---------------------------------------------------------------------------
// Toy k-NN excess-risk model (variance in k, bias in k/n)
// ---------------------------------------------------------------------------

export interface KnnRiskModel {
	/** > 0 — weight of the 1/k variance term. */
	varianceConst: number;
	/** > 0 — weight of the (k/n)^biasExponent bias term. */
	biasConst: number;
	/** Shape of the bias term's growth with k/n. Default 1. */
	biasExponent?: number;
}

/**
 * Toy bias-variance model of the k-NN excess risk:
 *   excess(n,k) = varianceConst/k + biasConst * (k/n)^biasExponent
 * The first term shrinks as k grows (averaging over more neighbors reduces
 * variance); the second grows with k relative to n (neighbors become less
 * local, increasing bias). Gives KNNConsistencyDemo.svelte a U-shaped
 * risk-vs-k curve whose minimum tracks Stone's k(n) ~ sqrt(n) as n grows.
 * This is a pedagogical stand-in, not a rate derived in theorie.typ.
 */
export function knnExcessRisk(n: number, k: number, model: KnnRiskModel): number {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (k <= 0) throw new Error(`k must be positive, got ${k}`);
	if (k > n) throw new Error(`k cannot exceed n (got k=${k}, n=${n})`);
	const exponent = model.biasExponent ?? 1;
	return model.varianceConst / k + model.biasConst * Math.pow(k / n, exponent);
}

/** k-NN excess risk evaluated over a grid of k values, for fixed n. */
export function knnExcessRiskCurve(
	n: number,
	kGrid: number[],
	model: KnnRiskModel
): { k: number; excessRisk: number }[] {
	return kGrid.map((k) => ({ k, excessRisk: knnExcessRisk(n, k, model) }));
}

/**
 * The real-valued k minimizing the toy k-NN excess-risk model for fixed n,
 * found by calculus (d/dk = 0): k* = (varianceConst * n^p / (biasConst * p))^(1/(p+1))
 * for biasExponent = p. Reduces to sqrt(varianceConst * n / biasConst) at p=1.
 */
export function knnOptimalK(n: number, model: KnnRiskModel): number {
	const p = model.biasExponent ?? 1;
	const { varianceConst: V, biasConst: B } = model;
	const kStar = Math.pow((V * Math.pow(n, p)) / (B * p), 1 / (p + 1));
	return Math.max(1, kStar);
}

// ---------------------------------------------------------------------------
// Toy approximation/estimation decomposition
//
// theorie.typ ("Pourquoi cette notion est-elle centrale ?"):
//   R(h_n) - R* = [R(h_n) - inf_{h in H} R(h)]   (terme d'estimation)
//               + [inf_{h in H} R(h) - R*]         (terme d'approximation)
// ---------------------------------------------------------------------------

export interface ApproxEstimModel {
	/** > 0 — magnitude of the approximation error at complexity=1. */
	approxConst: number;
	/** > 0 — how fast approximation error shrinks as complexity grows. */
	approxExponent: number;
	/** > 0 — magnitude of the estimation error term. */
	estimConst: number;
	/** Shape of the estimation term's growth with complexity/n. Default 1. */
	estimExponent?: number;
}

/**
 * inf_{h in H} R(h) under the toy model: bayesRisk + approxConst / complexity^approxExponent.
 * Decreases toward bayesRisk as complexity -> infty (a richer class can
 * approximate the Bayes classifier arbitrarily well) — the approximation
 * term alone, independent of sample size.
 */
export function approximationRisk(
	complexity: number,
	bayesRisk: number,
	model: ApproxEstimModel
): number {
	if (complexity <= 0) throw new Error(`complexity must be positive, got ${complexity}`);
	return bayesRisk + model.approxConst / Math.pow(complexity, model.approxExponent);
}

/**
 * R(h_n) under the toy model: approximationRisk(complexity) plus an
 * estimation gap estimConst * (complexity/n)^estimExponent that grows with
 * complexity (richer classes are harder to estimate from n samples) and
 * shrinks with n. For fixed n, this sum is typically U-shaped in complexity
 * — too simple underfits (large approximation term), too rich overfits
 * (large estimation term) — which is the point of this demo.
 */
export function learnedRisk(
	n: number,
	complexity: number,
	bayesRisk: number,
	model: ApproxEstimModel
): number {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	const approx = approximationRisk(complexity, bayesRisk, model);
	const exponent = model.estimExponent ?? 1;
	const estimationGap = model.estimConst * Math.pow(complexity / n, exponent);
	return approx + estimationGap;
}

export interface ApproxEstimDecomposition {
	bayesRisk: number;
	approximationRisk: number;
	learnedRisk: number;
	/** inf_H R(h) - R* */
	approximationGap: number;
	/** R(h_n) - inf_H R(h) */
	estimationGap: number;
}

/** The full decomposition R(h_n) - R* = estimation + approximation, at one (n, complexity). */
export function approxEstimDecomposition(
	n: number,
	complexity: number,
	bayesRisk: number,
	model: ApproxEstimModel
): ApproxEstimDecomposition {
	const approx = approximationRisk(complexity, bayesRisk, model);
	const learned = learnedRisk(n, complexity, bayesRisk, model);
	return {
		bayesRisk,
		approximationRisk: approx,
		learnedRisk: learned,
		approximationGap: approx - bayesRisk,
		estimationGap: learned - approx
	};
}

/** The decomposition evaluated over a grid of complexity values, for fixed n. */
export function approxEstimCurve(
	n: number,
	complexityGrid: number[],
	bayesRisk: number,
	model: ApproxEstimModel
): ApproxEstimDecomposition[] {
	return complexityGrid.map((c) => approxEstimDecomposition(n, c, bayesRisk, model));
}

// ---------------------------------------------------------------------------
// Concrete 2D k-NN dataset and classifier (for KNNConsistencyDemo.svelte)
//
// knnExcessRisk/knnExcessRiskCurve above are an abstract formula-based model
// of k-NN's risk; there's nothing to nearest-neighbor-search over. This
// section is the geometric counterpart: an actual synthetic dataset and a
// real k-NN classifier over it, so the demo can show a genuine neighborhood
// and decision boundary, not just a risk curve.
// ---------------------------------------------------------------------------

export interface LabeledPoint2D {
	x1: number;
	x2: number;
	label: 0 | 1;
}

export interface Knn2DModel {
	/** Radius of the circular Bayes boundary from the origin. */
	radius: number;
	/** Sharpness of the eta transition across the boundary (as in sigmoidEta). */
	temperature: number;
}

/**
 * Radial sigmoid ground truth: eta(x1,x2) = P(Y=1 | X=(x1,x2)) is high near
 * the origin and low far from it, crossing 1/2 exactly at ||x|| = radius —
 * a 2D analogue of sigmoidEta (bayes-learning.ts) with a circular boundary
 * instead of a linear one, so k-NN neighborhoods have something nontrivial
 * to adapt to.
 */
export function knn2DEta(x1: number, x2: number, model: Knn2DModel): number {
	if (model.temperature <= 0) {
		throw new Error(`temperature must be > 0, got ${model.temperature}`);
	}
	const r = Math.sqrt(x1 * x1 + x2 * x2);
	return 1 / (1 + Math.exp((r - model.radius) / model.temperature));
}

/**
 * Generate n i.i.d. labeled points: X uniform on [-domain,domain]^2 and
 * Y|X ~ Bernoulli(knn2DEta(X)). Deterministic for a given seed.
 */
export function generateKnnDataset(
	n: number,
	model: Knn2DModel,
	domain = 3,
	seed = 1
): LabeledPoint2D[] {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	const rand = mulberry32(seed);
	const points: LabeledPoint2D[] = [];
	for (let i = 0; i < n; i++) {
		const x1 = (rand() * 2 - 1) * domain;
		const x2 = (rand() * 2 - 1) * domain;
		const eta = knn2DEta(x1, x2, model);
		const label: 0 | 1 = rand() < eta ? 1 : 0;
		points.push({ x1, x2, label });
	}
	return points;
}

/** Squared Euclidean distance between two 2D points. */
function squaredDistance2D(a: { x1: number; x2: number }, b: { x1: number; x2: number }): number {
	const dx1 = a.x1 - b.x1;
	const dx2 = a.x2 - b.x2;
	return dx1 * dx1 + dx2 * dx2;
}

/** The k nearest neighbors of `query` in `dataset`, sorted by increasing distance. */
export function kNearestNeighbors(
	query: { x1: number; x2: number },
	dataset: LabeledPoint2D[],
	k: number
): LabeledPoint2D[] {
	if (k <= 0) throw new Error(`k must be positive, got ${k}`);
	if (k > dataset.length) {
		throw new Error(`k (${k}) cannot exceed dataset size (${dataset.length})`);
	}
	return dataset
		.map((p) => ({ p, d: squaredDistance2D(query, p) }))
		.sort((a, b) => a.d - b.d)
		.slice(0, k)
		.map(({ p }) => p);
}

/** Majority-vote k-NN prediction at `query`, ties broken toward 1 (as in bayesAction). */
export function knnPredict(
	query: { x1: number; x2: number },
	dataset: LabeledPoint2D[],
	k: number
): 0 | 1 {
	const neighbors = kNearestNeighbors(query, dataset, k);
	const ones = neighbors.filter((p) => p.label === 1).length;
	return ones * 2 >= neighbors.length ? 1 : 0;
}

/**
 * k-NN predictions over a regular grid covering [-domain,domain]^2, for
 * rendering a coarse decision-boundary background. gridSize points per axis
 * (gridSize^2 total predictions, each an O(n log n) neighbor search) — keep
 * gridSize and the dataset size modest for interactive use.
 */
export function knnDecisionField(
	dataset: LabeledPoint2D[],
	k: number,
	domain: number,
	gridSize = 20
): { x1: number; x2: number; predicted: 0 | 1 }[] {
	const step = (2 * domain) / (gridSize - 1);
	const field: { x1: number; x2: number; predicted: 0 | 1 }[] = [];
	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			const x1 = -domain + i * step;
			const x2 = -domain + j * step;
			field.push({ x1, x2, predicted: knnPredict({ x1, x2 }, dataset, k) });
		}
	}
	return field;
}
