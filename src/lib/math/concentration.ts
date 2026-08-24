// src/lib/math/concentration.ts
//
// Part VI — Inégalités de concentration et Généralisation
// Reference: theorie.typ — "Inégalités fondamentales" (Markov,
// Bienaymé-Tchebychev, application à la consistance en probabilité de la
// moyenne empirique, application au risque empirique d'un classifieur fixé).

import { combineSeed, mulberry32 } from './util';

// ---------------------------------------------------------------------------
// Markov and Bienaymé-Tchebychev bounds
// ---------------------------------------------------------------------------

/**
 * Markov's bound on P(Z >= t) for Z >= 0 a.s.: P(Z>=t) <= E[Z]/t.
 * Note this formula can exceed 1 for small t — that's expected (the bound is
 * only informative when it's < 1); it is not clamped here.
 */
export function markovBound(meanZ: number, t: number): number {
	if (meanZ < 0) throw new Error(`meanZ must be >= 0 (Markov requires Z >= 0 a.s.), got ${meanZ}`);
	if (t <= 0) throw new Error(`t must be positive, got ${t}`);
	return meanZ / t;
}

/**
 * Bienaymé-Tchebychev's bound on P(|Z-E[Z]| >= epsilon): Var(Z)/epsilon^2.
 * Derived from Markov applied to (Z-E[Z])^2 with threshold epsilon^2.
 */
export function chebyshevBound(variance: number, epsilon: number): number {
	if (variance < 0) throw new Error(`variance must be >= 0, got ${variance}`);
	if (epsilon <= 0) throw new Error(`epsilon must be positive, got ${epsilon}`);
	return variance / (epsilon * epsilon);
}

// ---------------------------------------------------------------------------
// Empirical-mean convergence simulator
//
// Samples are drawn from Uniform(mean - h, mean + h) with h = sqrt(3*variance),
// the unique uniform distribution with exactly the requested mean and
// variance — a generic bounded random variable to illustrate the LLN /
// Chebyshev's inequality without committing to any particular application.
// ---------------------------------------------------------------------------

export interface EmpiricalMeanModel {
	mean: number;
	/** >= 0 */
	variance: number;
}

function sampleFromMeanVariance(model: EmpiricalMeanModel, rand: () => number): number {
	if (model.variance < 0) throw new Error(`variance must be >= 0, got ${model.variance}`);
	const halfWidth = Math.sqrt(3 * model.variance);
	return model.mean + halfWidth * (2 * rand() - 1);
}

/**
 * Simulate `trials` independent empirical means, each computed from n fresh
 * i.i.d. draws. Deterministic for a given seed — used to check the
 * exceedance probability P(|Zbar_n - mu| >= epsilon) against Chebyshev's
 * bound at a fixed n.
 */
export function simulateEmpiricalMeanTrials(
	n: number,
	trials: number,
	model: EmpiricalMeanModel,
	seed = 1
): number[] {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	const rand = mulberry32(combineSeed(seed, n));
	const out: number[] = [];
	for (let t = 0; t < trials; t++) {
		let sum = 0;
		for (let i = 0; i < n; i++) sum += sampleFromMeanVariance(model, rand);
		out.push(sum / n);
	}
	return out;
}

/**
 * Simulate a single trajectory of the running empirical mean Zbar_n as n
 * grows along nGrid (positive integers, need not be sorted), using one
 * continuous PRNG stream — one actual growing sample, not independent draws
 * at each n. Deterministic for a given seed.
 */
export function simulateEmpiricalMeanPath(
	nGrid: number[],
	model: EmpiricalMeanModel,
	seed = 1
): number[] {
	if (nGrid.some((n) => n <= 0 || !Number.isInteger(n))) {
		throw new Error('nGrid must contain only positive integers');
	}
	const rand = mulberry32(seed);
	const maxN = Math.max(...nGrid);
	const cumMeans = new Array<number>(maxN);
	let cumSum = 0;
	for (let i = 0; i < maxN; i++) {
		cumSum += sampleFromMeanVariance(model, rand);
		cumMeans[i] = cumSum / (i + 1);
	}
	return nGrid.map((n) => cumMeans[n - 1]);
}

/** Empirical P(|Z - mean| >= epsilon) from a batch of samples (e.g. from simulateEmpiricalMeanTrials). */
export function empiricalExceedanceProbability(
	samples: number[],
	mean: number,
	epsilon: number
): number {
	if (samples.length === 0) return 0;
	const count = samples.filter((z) => Math.abs(z - mean) >= epsilon).length;
	return count / samples.length;
}

/**
 * Empirical P(Z - mean >= epsilon) — the ONE-SIDED exceedance, as opposed to
 * empiricalExceedanceProbability's two-sided |Z-mean|>=epsilon. Markov's
 * inequality applied directly to a nonnegative Z naturally bounds this
 * one-sided event; Chebyshev and Hoeffding are stated in theorie.typ in
 * their two-sided form, which remains a valid (if slightly conservative)
 * upper bound on this smaller one-sided event too, since
 * {Z-mean>=epsilon} subset {|Z-mean|>=epsilon}. Used by
 * ConcentrationInequalityExplorer.svelte to compare all three bounds against
 * the same empirical curve.
 */
export function empiricalOneSidedExceedanceProbability(
	samples: number[],
	mean: number,
	epsilon: number
): number {
	if (samples.length === 0) return 0;
	const count = samples.filter((z) => z - mean >= epsilon).length;
	return count / samples.length;
}

// ---------------------------------------------------------------------------
// Risk control for a single FIXED classifier
//
// theorie.typ ("Application : consistance en probabilité de la moyenne
// empirique"): for h fixed, Z_i = 1_{h(X_i)!=Y_i} has Var(Z_i) = R(h)(1-R(h)),
// so Chebyshev gives:
//   P(|R_n(h) - R(h)| >= epsilon) <= R(h)(1-R(h)) / (n*epsilon^2) <= 1/(4n*epsilon^2)
// This bound holds for ONE h fixed in advance — it is not uniform over a
// class H (see the finite-class generalization bounds later in Part VI).
// ---------------------------------------------------------------------------

/** The risk-dependent version of the fixed-classifier bound: R(h)(1-R(h)) / (n*epsilon^2). */
export function fixedClassifierRiskBound(risk: number, n: number, epsilon: number): number {
	if (risk < 0 || risk > 1) throw new Error(`risk must be in [0,1], got ${risk}`);
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (epsilon <= 0) throw new Error(`epsilon must be positive, got ${epsilon}`);
	const variance = risk * (1 - risk);
	return variance / (n * epsilon * epsilon);
}

/** The risk-independent, worst-case version: 1/(4n*epsilon^2), using Var(Z) <= 1/4 for any Bernoulli Z. */
export function fixedClassifierRiskBoundUniform(n: number, epsilon: number): number {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (epsilon <= 0) throw new Error(`epsilon must be positive, got ${epsilon}`);
	return 1 / (4 * n * epsilon * epsilon);
}

// ---------------------------------------------------------------------------
// Small helpers for EmpiricalMeanConvergenceDemo.svelte
// ---------------------------------------------------------------------------

/** Standard error of the empirical mean: sqrt(variance/n) — the shrinking half-width of a mean ± k*SE confidence envelope. */
export function empiricalMeanStandardError(n: number, variance: number): number {
	if (n <= 0) throw new Error(`n must be positive, got ${n}`);
	if (variance < 0) throw new Error(`variance must be >= 0, got ${variance}`);
	return Math.sqrt(variance / n);
}

export interface HistogramBin {
	binStart: number;
	binEnd: number;
	count: number;
}

/**
 * Bucket `samples` into `bins` equal-width bins spanning [min(samples),
 * max(samples)] (or an explicit [rangeMin, rangeMax] if given). Generic —
 * not specific to empirical means, but currently only used by
 * EmpiricalMeanConvergenceDemo's final-value histogram.
 */
export function histogram(
	samples: number[],
	bins: number,
	range?: [number, number]
): HistogramBin[] {
	if (bins <= 0) throw new Error(`bins must be positive, got ${bins}`);
	if (samples.length === 0) return [];
	const [rangeMin, rangeMax] = range ?? [Math.min(...samples), Math.max(...samples)];
	if (rangeMax <= rangeMin) throw new Error('range must have rangeMax > rangeMin');
	const width = (rangeMax - rangeMin) / bins;
	const counts = new Array(bins).fill(0);
	for (const s of samples) {
		let idx = Math.floor((s - rangeMin) / width);
		if (idx < 0) idx = 0;
		if (idx >= bins) idx = bins - 1;
		counts[idx]++;
	}
	return counts.map((count, i) => ({
		binStart: rangeMin + i * width,
		binEnd: rangeMin + (i + 1) * width,
		count
	}));
}
