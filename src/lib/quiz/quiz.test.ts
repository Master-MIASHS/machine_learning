import { describe, it, expect } from 'vitest';
import { getQuizQuestions, QUESTIONS } from './index.js';

describe('QUESTIONS (invariants)', () => {
	it('is non-empty', () => {
		expect(QUESTIONS.length).toBeGreaterThan(0);
	});

	// Exact count guards against a quiz block being silently dropped on re-migration.
  it('contains exactly 285 questions', () => {
    expect(QUESTIONS.length).toBe(285);
  });

	it('has a unique id per question', () => {
		const ids = QUESTIONS.map((q) => q.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	// Note: question *text* is allowed to repeat (a part "synthèse" quiz reuses
	// some lesson questions with a shorter explanation); `id` uniqueness is the
	// guard against accidental duplicated records.

	it('every question is well-formed (>=2 options, valid answerIndex, non-empty text)', () => {
		for (const q of QUESTIONS) {
			expect(q.question.trim().length, q.id).toBeGreaterThan(0);
			expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
			expect(q.answerIndex, q.id).toBeGreaterThanOrEqual(0);
			expect(q.answerIndex, q.id).toBeLessThan(q.options.length);
		}
	});

	it('every question has at least one tag', () => {
		for (const q of QUESTIONS) {
			expect(q.tags.length, q.id).toBeGreaterThan(0);
		}
	});

	it('part tags only reference parts 1..10', () => {
		for (const q of QUESTIONS) {
			for (const t of q.tags) {
				const m = /^p(\d+)/.exec(t);
				if (m) {
					const n = Number(m[1]);
					expect(n, `bad part in tag "${t}" (${q.id})`).toBeGreaterThanOrEqual(1);
					expect(n, `bad part in tag "${t}" (${q.id})`).toBeLessThanOrEqual(10);
				}
			}
		}
	});
});

describe('getQuizQuestions (query semantics)', () => {
	it('with no filter returns every question', () => {
		expect(getQuizQuestions()).toHaveLength(QUESTIONS.length);
	});

	it('a question is returned by every one of its own tags', () => {
		for (const q of QUESTIONS) {
			for (const t of q.tags) {
				expect(
					getQuizQuestions(t).some((x) => x.id === q.id),
					`${q.id} / ${t}`
				).toBe(true);
			}
		}
	});

	it('results are monotone: a deeper prefix never exceeds its parent', () => {
		const parents = new Set<string>();
		for (const q of QUESTIONS) {
			for (const t of q.tags) {
				const segs = t.split('/');
				if (segs[0].startsWith('p') && segs.length >= 2) parents.add(segs[0]);
			}
		}
		for (const parent of parents) {
			const parentSet = new Set(getQuizQuestions(parent).map((q) => q.id));
			const children = new Set<string>();
			for (const q of QUESTIONS) {
				for (const t of q.tags) {
					if (t.startsWith(parent + '/')) {
						const segs = t.split('/');
						if (segs.length >= 2) children.add(`${segs[0]}/${segs[1]}`);
					}
				}
			}
			for (const child of children) {
				for (const q of getQuizQuestions(child)) {
					expect(parentSet.has(q.id), `${q.id} in ${child} but not in ${parent}`).toBe(true);
				}
			}
		}
	});
});
