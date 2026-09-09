import { describe, it, expect } from 'vitest';
import {
	gaussianPDF,
	gaussianLogPDF,
	gaussianSample,
	gaussianSamples,
	gaussianEntropy,
	gaussianProduct,
	gaussianQuantile
} from '../math/gaussian.js';

describe('gaussianPDF', () => {
	it('is maximised at the mean', () => {
		const g = { mu: 2, sigma2: 1 };
		const pAtMean = gaussianPDF(g.mu, g);
		expect(gaussianPDF(g.mu - 0.1, g)).toBeLessThan(pAtMean);
		expect(gaussianPDF(g.mu + 0.1, g)).toBeLessThan(pAtMean);
	});

	it('equals the analytic formula at x=mu', () => {
		const g = { mu: 0, sigma2: 1 };
		const expected = 1 / Math.sqrt(2 * Math.PI);
		expect(gaussianPDF(0, g)).toBeCloseTo(expected, 10);
	});

	it('is symmetric around mu', () => {
		const g = { mu: 3, sigma2: 2 };
		expect(gaussianPDF(g.mu - 1, g)).toBeCloseTo(gaussianPDF(g.mu + 1, g), 12);
	});

	it('integrates to ~1 via Riemann sum', () => {
		const g = { mu: 0, sigma2: 1 };
		const dx = 0.001;
		let sum = 0;
		for (let x = -10; x <= 10; x += dx) {
			sum += gaussianPDF(x, g) * dx;
		}
		expect(sum).toBeCloseTo(1, 2);
	});

	it('handles large sigma2', () => {
		const g = { mu: 0, sigma2: 1e6 };
		const v = gaussianPDF(0, g);
		expect(v).toBeGreaterThan(0);
		expect(isNaN(v)).toBe(false);
	});

	it('handles small sigma2', () => {
		const g = { mu: 0, sigma2: 1e-6 };
		const v = gaussianPDF(0, g);
		expect(v).toBeGreaterThan(0);
		expect(isNaN(v)).toBe(false);
	});
});

describe('gaussianLogPDF', () => {
	it('matches log of gaussianPDF', () => {
		const g = { mu: 1, sigma2: 2 };
		const xs = [-3, -1, 0, 1, 2, 3, 5];
		for (const x of xs) {
			expect(gaussianLogPDF(x, g)).toBeCloseTo(Math.log(gaussianPDF(x, g)), 10);
		}
	});

	it('is always finite for valid inputs', () => {
		const g = { mu: 0, sigma2: 1 };
		expect(isFinite(gaussianLogPDF(1e10, g))).toBe(true); // very large x → very negative log
	});
});

describe('gaussianProduct', () => {
	it('self-product halves the variance', () => {
		const g = { mu: 0, sigma2: 4 };
		const result = gaussianProduct(g, g);
		expect(result.sigma2).toBeCloseTo(g.sigma2 / 2, 12);
	});

	it('self-product preserves the mean', () => {
		const g = { mu: 3, sigma2: 2 };
		const result = gaussianProduct(g, g);
		expect(result.mu).toBeCloseTo(g.mu, 12);
	});

	it('computes precision-weighted mean', () => {
		// g1: mu=0, sigma2=1 (high precision)
		// g2: mu=4, sigma2=3 (low precision)
		// precision1 = 1, precision2 = 1/3
		// precNew = 4/3, sigma2New = 3/4
		// muNew = (3/4) * (0*1 + 4*(1/3)) = (3/4) * (4/3) = 1
		const g1 = { mu: 0, sigma2: 1 };
		const g2 = { mu: 4, sigma2: 3 };
		const result = gaussianProduct(g1, g2);
		expect(result.sigma2).toBeCloseTo(0.75, 12);
		expect(result.mu).toBeCloseTo(1, 12);
	});

	it('is commutative (mu and sigma2)', () => {
		const g1 = { mu: 1, sigma2: 2 };
		const g2 = { mu: -1, sigma2: 0.5 };
		const ab = gaussianProduct(g1, g2);
		const ba = gaussianProduct(g2, g1);
		expect(ab.mu).toBeCloseTo(ba.mu, 12);
		expect(ab.sigma2).toBeCloseTo(ba.sigma2, 12);
	});
});

describe('gaussianEntropy', () => {
	it('matches analytic formula H = 0.5*(1 + ln(2πσ²))', () => {
		const g = { mu: 0, sigma2: 1 };
		const expected = 0.5 * (1 + Math.log(2 * Math.PI * g.sigma2));
		expect(gaussianEntropy(g)).toBeCloseTo(expected, 12);
	});

	it('is independent of mu', () => {
		const g1 = { mu: 0, sigma2: 3 };
		const g2 = { mu: 100, sigma2: 3 };
		expect(gaussianEntropy(g1)).toBeCloseTo(gaussianEntropy(g2), 12);
	});

	it('increases with variance', () => {
		const g1 = { mu: 0, sigma2: 1 };
		const g2 = { mu: 0, sigma2: 2 };
		expect(gaussianEntropy(g2)).toBeGreaterThan(gaussianEntropy(g1));
	});
});

describe('gaussianSamples — law of large numbers', () => {
	it('sample mean converges to mu (n=10000, wide tolerance)', () => {
		const g = { mu: 5, sigma2: 1 };
		const samples = gaussianSamples(g, 10_000);
		const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
		// 3σ/√n = 3/√10000 = 0.03 — use tolerance of 0.1 to be safe
		expect(Math.abs(mean - g.mu)).toBeLessThan(0.15);
	});

	it('sample variance converges to sigma2 (n=10000)', () => {
		const g = { mu: 0, sigma2: 4 };
		const samples = gaussianSamples(g, 10_000);
		const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
		const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / (samples.length - 1);
		expect(Math.abs(variance - g.sigma2)).toBeLessThan(0.3);
	});

	it('never returns NaN', () => {
		const g = { mu: 0, sigma2: 1 };
		const samples = gaussianSamples(g, 1000);
		expect(samples.every((s) => !isNaN(s))).toBe(true);
	});
});

describe('gaussianSample', () => {
	it('returns a number', () => {
		const g = { mu: 0, sigma2: 1 };
		expect(typeof gaussianSample(g)).toBe('number');
		expect(isNaN(gaussianSample(g))).toBe(false);
	});
});

describe('gaussianQuantile (Acklam inverse CDF)', () => {
	it('matches the standard normal quantiles', () => {
		expect(gaussianQuantile(0.5)).toBeCloseTo(0, 9);
		expect(gaussianQuantile(0.975)).toBeCloseTo(1.959963984540054, 6);
		expect(gaussianQuantile(0.95)).toBeCloseTo(1.6448536269514722, 6);
		expect(gaussianQuantile(0.8413447460685429)).toBeCloseTo(1.0, 6);
		expect(gaussianQuantile(0.025)).toBeCloseTo(-1.959963984540054, 6);
		expect(gaussianQuantile(0.15865525393145707)).toBeCloseTo(-1.0, 6);
	});

	it('is symmetric: q(p) = -q(1-p)', () => {
		for (const p of [0.01, 0.1, 0.33, 0.5, 0.71, 0.9, 0.99]) {
			expect(gaussianQuantile(p) + gaussianQuantile(1 - p)).toBeCloseTo(0, 10);
		}
	});

	it('is strictly increasing on (0,1)', () => {
		let prev = gaussianQuantile(0.0001);
		for (let i = 1; i <= 100; i++) {
			const q = gaussianQuantile(0.0001 + (0.9998 * i) / 100);
			expect(q).toBeGreaterThan(prev);
			prev = q;
		}
	});

	it('covers the extreme tails and rejects p outside (0,1)', () => {
		expect(gaussianQuantile(0.999)).toBeCloseTo(3.090232306167813, 4);
		expect(gaussianQuantile(0.001)).toBeCloseTo(-3.090232306167813, 4);
		expect(() => gaussianQuantile(0)).toThrow();
		expect(() => gaussianQuantile(1)).toThrow();
		expect(() => gaussianQuantile(-0.2)).toThrow();
		expect(() => gaussianQuantile(1.3)).toThrow();
	});
});
