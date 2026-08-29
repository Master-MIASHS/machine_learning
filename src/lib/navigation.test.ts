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
			const { next } = getAdjacentPages('/part7/exercices', includeExpert);
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
