import { describe, it, expect, vi, beforeEach } from 'vitest';

// navigation.ts imports resolve() from $app/paths — mock it as the identity
vi.mock('$app/paths', () => ({ resolve: (route: string) => route }));

beforeEach(() => {
	vi.resetModules();
});

async function load() {
	const mod = await import('./navigation.js');
	return mod;
}

describe('PAGES', () => {
	it('contains exactly one expert page (Adam)', async () => {
		const { PAGES } = await load();
		const experts = PAGES.filter((p) => p.expert);
		expect(experts).toHaveLength(1);
		expect(experts[0].path).toBe('/part1/lesson3-adam');
	});

	it('orders the Adam page between lesson3 and lesson4 of part 1', async () => {
		const { PAGES } = await load();
		const idx = PAGES.findIndex((p) => p.path === '/part1/lesson3');
		expect(PAGES[idx + 1].path).toBe('/part1/lesson3-adam');
		expect(PAGES[idx + 2].path).toBe('/part1/lesson4');
	});

	it('assigns sequential indices and a resolved path to every entry', async () => {
		const { PAGES } = await load();
		PAGES.forEach((p, i) => {
			expect(p.index).toBe(i);
			expect(p.resolvedPath).toBe(p.path);
		});
	});
});

describe('reserved parts (classification supervisée & clustering)', () => {
	it('registers the reserved Part II (classification) pages in course order', async () => {
		const { PAGES } = await load();
		const idx = PAGES.findIndex((p) => p.path === '/part2/lesson1');
		expect(idx).toBeGreaterThan(0);
		expect(PAGES[idx].part).toBe(2);
		expect(PAGES[idx + 1].path).toBe('/part2/lesson2');
		expect(PAGES[idx + 2].path).toBe('/part2/lesson3');
		expect(PAGES[idx + 3].path).toBe('/part2/lesson4');
		expect(PAGES[idx + 4].path).toBe('/part2/exercices');
		expect(PAGES[idx + 5].path).toBe('/part2/practice/travaux-pratiques');
	});

	it('registers the reserved Part III (clustering) pages in course order', async () => {
		const { PAGES } = await load();
		const idx = PAGES.findIndex((p) => p.path === '/part3/lesson1');
		expect(idx).toBeGreaterThan(0);
		expect(PAGES[idx].part).toBe(3);
		expect(PAGES[idx + 1].path).toBe('/part3/lesson2');
		expect(PAGES[idx + 2].path).toBe('/part3/exercices');
		expect(PAGES[idx + 3].path).toBe('/part3/practice/travaux-pratiques');
	});

	it('places the reserved parts between Part I and the regularization part (now IV)', async () => {
		const { PAGES } = await load();
		const idx = PAGES.findIndex((p) => p.path === '/part1/practice/travaux-pratiques');
		expect(PAGES[idx + 1].path).toBe('/part2/lesson1');
		const idxEnd = PAGES.findIndex((p) => p.path === '/part3/practice/travaux-pratiques');
		expect(PAGES[idxEnd + 1].path).toBe('/part4/lesson1');
	});

	it('keeps renumbered content: regularization at IV, set-valued at V, loss at IX', async () => {
		const { PAGES } = await load();
		expect(PAGES.find((p) => p.path === '/part4/lesson1')?.title).toBe(
			'Méthodes ensemblistes et Bagging'
		);
		expect(PAGES.find((p) => p.path === '/part5/lesson1')?.title).toBe('Classification Top-K');
		expect(PAGES.find((p) => p.path === '/part9/lesson1')?.title).toBe(
			'De la perte 0-1 aux pertes proxy'
		);
	});

	it('exposes a PART_NAMES entry for every part 1 through 9', async () => {
		const { PART_NAMES } = await load();
		for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
			expect(PART_NAMES[n]).toBeDefined();
		}
	});
});

describe('getAdjacentPages', () => {
	it('skips the expert page in default mode (part1/lesson3 → part1/lesson4)', async () => {
		const { getAdjacentPages } = await load();
		const { prev, next } = getAdjacentPages('/part1/lesson3', false);
		expect(prev?.path).toBe('/part1/lesson2');
		expect(next?.path).toBe('/part1/lesson4');
	});

	it('includes the expert page in expert mode (part1/lesson3 → adam)', async () => {
		const { getAdjacentPages } = await load();
		const { next } = getAdjacentPages('/part1/lesson3', true);
		expect(next?.path).toBe('/part1/lesson3-adam');
	});

	it('gives the Adam page lesson3/lesson4 as prev/next in expert mode', async () => {
		const { getAdjacentPages } = await load();
		const { prev, next } = getAdjacentPages('/part1/lesson3-adam', true);
		expect(prev?.path).toBe('/part1/lesson3');
		expect(next?.path).toBe('/part1/lesson4');
	});

	it('hides the Adam page entirely in default mode (no prev/next for it)', async () => {
		const { getAdjacentPages } = await load();
		const { prev, next } = getAdjacentPages('/part1/lesson3-adam', false);
		expect(prev).toBeUndefined();
		expect(next).toBeUndefined();
	});

	it('bridges around the hidden expert page: lesson4 prev → lesson3 in default mode', async () => {
		const { getAdjacentPages } = await load();
		const { prev } = getAdjacentPages('/part1/lesson4', false);
		expect(prev?.path).toBe('/part1/lesson3');
		const { prev: prevExpert } = getAdjacentPages('/part1/lesson4', true);
		expect(prevExpert?.path).toBe('/part1/lesson3-adam');
	});

	it('returns no prev for home and intro as next (both modes)', async () => {
		const { getAdjacentPages } = await load();
		for (const includeExpert of [false, true]) {
			const home = getAdjacentPages('/', includeExpert);
			expect(home.prev).toBeUndefined();
			expect(home.next?.path).toBe('/intro');

			const intro = getAdjacentPages('/intro', includeExpert);
			expect(intro.prev?.path).toBe('/');
			expect(intro.next?.path).toBe('/part1/lesson1');
		}
	});

	it('returns no next for the last page in either mode', async () => {
		const { getAdjacentPages } = await load();
		for (const includeExpert of [false, true]) {
			const { next } = getAdjacentPages('/part9/exercices', includeExpert);
			expect(next).toBeUndefined();
		}
	});

	it('returns undefined for an unknown path', async () => {
		const { getAdjacentPages } = await load();
		const { prev, next } = getAdjacentPages('/nope', true);
		expect(prev).toBeUndefined();
		expect(next).toBeUndefined();
	});
});
