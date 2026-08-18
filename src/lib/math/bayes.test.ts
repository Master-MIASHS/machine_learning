import { describe, it, expect } from 'vitest';
import { bayesUpdate, bayesUpdateMultiple, numericalPosterior } from '../math/bayes.js';
import { gaussianPDF } from '../math/gaussian.js';
import { linspace } from './util.js';

describe('bayesUpdate', () => {
	it('pulls posterior mean toward the observation', () => {
		const prior = { mu: 0, sigma2: 10 };
		const likelihood = { mu: 0, sigma2: 1 };
		const post = bayesUpdate(prior, likelihood, 5);
		// Posterior mean should be between prior mu (0) and observation (5)
		expect(post.mu).toBeGreaterThan(0);
		expect(post.mu).toBeLessThan(5);
	});

	it('reduces uncertainty (posterior sigma2 < prior sigma2)', () => {
		const prior = { mu: 0, sigma2: 4 };
		const likelihood = { mu: 0, sigma2: 1 };
		const post = bayesUpdate(prior, likelihood, 2);
		expect(post.sigma2).toBeLessThan(prior.sigma2);
	});

	it('matches analytic formula for precision-weighted mean', () => {
		// prior: N(0, 2), likelihood sigma2 = 2, obs = 4
		// precPost = 1/2 + 1/2 = 1, sigma2Post = 1
		// muPost = 1 * (0/2 + 4/2) = 2
		const prior = { mu: 0, sigma2: 2 };
		const likelihood = { mu: 0, sigma2: 2 };
		const post = bayesUpdate(prior, likelihood, 4);
		expect(post.sigma2).toBeCloseTo(1, 12);
		expect(post.mu).toBeCloseTo(2, 12);
	});

	it('with very strong prior, posterior ≈ prior', () => {
		// Prior with tiny variance → posterior barely moves
		const prior = { mu: 0, sigma2: 0.001 };
		const likelihood = { mu: 0, sigma2: 100 };
		const post = bayesUpdate(prior, likelihood, 10);
		expect(Math.abs(post.mu - prior.mu)).toBeLessThan(0.2);
		expect(post.sigma2).toBeLessThan(prior.sigma2 + 0.001);
	});

	it('with very weak prior, posterior ≈ observation', () => {
		const prior = { mu: 0, sigma2: 1000 };
		const likelihood = { mu: 0, sigma2: 1 };
		const post = bayesUpdate(prior, likelihood, 7);
		expect(post.mu).toBeCloseTo(7, 1);
	});
});

describe('bayesUpdateMultiple', () => {
	it('tightens posterior with more observations', () => {
		const prior = { mu: 0, sigma2: 10 };
		const likelihood = { mu: 0, sigma2: 1 };
		const post1 = bayesUpdate(prior, likelihood, 5);
		const post2 = bayesUpdateMultiple(prior, likelihood, [5, 5]);
		expect(post2.sigma2).toBeLessThan(post1.sigma2);
	});

	it('is order-invariant for conjugate updates', () => {
		const prior = { mu: 0, sigma2: 5 };
		const likelihood = { mu: 0, sigma2: 1 };
		const obs = [1, 3, 5];
		const result1 = bayesUpdateMultiple(prior, likelihood, obs);
		const result2 = bayesUpdateMultiple(prior, likelihood, [...obs].reverse());
		expect(result1.mu).toBeCloseTo(result2.mu, 10);
		expect(result1.sigma2).toBeCloseTo(result2.sigma2, 10);
	});

	it('applying n identical observations equals applying bayesUpdate n times', () => {
		const prior = { mu: 0, sigma2: 4 };
		const likelihood = { mu: 0, sigma2: 2 };
		const obs = [2, 2, 2];

		let manual = prior;
		for (const x of obs) manual = bayesUpdate(manual, likelihood, x);
		const bulk = bayesUpdateMultiple(prior, likelihood, obs);

		expect(bulk.mu).toBeCloseTo(manual.mu, 12);
		expect(bulk.sigma2).toBeCloseTo(manual.sigma2, 12);
	});
});

describe('numericalPosterior', () => {
	it('is normalized (sums to 1)', () => {
		const grid = linspace(-5, 5, 200);
		const priorFn = (s: number) => gaussianPDF(s, { mu: 0, sigma2: 1 });
		const likelyFn = (s: number) => gaussianPDF(3, { mu: s, sigma2: 1 });
		const posterior = numericalPosterior(priorFn, likelyFn, grid);
		expect(posterior.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
	});

	it('peaks near the observation (conjugate check)', () => {
		const grid = linspace(-10, 10, 500);
		const obs = 5;
		const priorFn = (s: number) => gaussianPDF(s, { mu: 0, sigma2: 4 });
		const likelyFn = (s: number) => gaussianPDF(obs, { mu: s, sigma2: 1 });
		const posterior = numericalPosterior(priorFn, likelyFn, grid);
		const peakIdx = posterior.indexOf(Math.max(...posterior));
		// The peak should be between 0 and 5 (pulled toward observation)
		expect(grid[peakIdx]).toBeGreaterThan(0);
		expect(grid[peakIdx]).toBeLessThan(5.5);
	});

	it('all entries are non-negative', () => {
		const grid = linspace(-3, 3, 100);
		const priorFn = (s: number) => gaussianPDF(s, { mu: 0, sigma2: 1 });
		const likelyFn = (s: number) => gaussianPDF(1, { mu: s, sigma2: 0.5 });
		const posterior = numericalPosterior(priorFn, likelyFn, grid);
		expect(posterior.every((p) => p >= 0)).toBe(true);
	});
});

describe('linspace', () => {
	it('generates n points from start to end', () => {
		const pts = linspace(0, 1, 5);
		expect(pts.length).toBe(5);
		expect(pts[0]).toBeCloseTo(0, 12);
		expect(pts[4]).toBeCloseTo(1, 12);
	});

	it('evenly spaces the points', () => {
		const pts = linspace(0, 4, 5);
		expect(pts[1]).toBeCloseTo(1, 12);
		expect(pts[2]).toBeCloseTo(2, 12);
		expect(pts[3]).toBeCloseTo(3, 12);
	});
});
