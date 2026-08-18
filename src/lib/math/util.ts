/**
 * Generate n evenly spaced points between start and end (inclusive).
 */
export function linspace(start: number, end: number, n: number): number[] {
	if (n <= 1) return [start];
	const step = (end - start) / (n - 1);
	return Array.from({ length: n }, (_, i) => start + i * step);
}
