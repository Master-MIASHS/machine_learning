// Central static quiz database and its query API.
//
// Every quiz question in the course lives in ./questions/ (one file per part).
// Questions are tagged with hierarchical path-tags, so a single question can
// belong to several parts/topics at once (e.g. a "biais-variance" question
// taught in both Part I and Part II).
//
// Tag convention
//   pN            -> part N (1..10)
//   pN/lM         -> lesson M of part N
//   pN/lM/<slug>  -> a section / fine topic inside the lesson
//   pN/synthese   -> the part-N "synthèse" quiz
//   axis:value    -> part-agnostic cross-cutting group (topic:…, difficulty:…)
//
// A query is a path prefix: "p4" returns every question tagged p4/…, "p4/l2"
// narrows to that lesson, "p4/l2/lasso" to one topic, and the empty query
// returns everything. Matching is over ALL of a question's tags (union).
import { QUESTIONS } from './questions/index.js';
import type { QuizItem, QuizQuestion } from './types.js';

export type { QuizItem, QuizQuestion };

export { QUESTIONS };

/** A tag matches a query when the query is a path-prefix of the tag. */
export function tagMatches(tag: string, query: string): boolean {
	return query === '' || tag === query || tag.startsWith(query + '/');
}

/**
 * Return the questions matching the query. The query is a single tag prefix or
 * a list of prefixes; a question is included if any of its tags matches any
 * prefix. No query (or an empty one) returns every question.
 */
export function getQuizQuestions(filter: string | string[] = []): QuizQuestion[] {
	const queries = (Array.isArray(filter) ? filter : [filter]).filter(
		(s): s is string => typeof s === 'string' && s.length > 0
	);
	if (queries.length === 0) return [...QUESTIONS];
	return QUESTIONS.filter((q) => q.tags.some((t) => queries.some((p) => tagMatches(t, p))));
}

/** Distinct next-level slugs under a tag prefix (for building a picker UI). */
export function listChildren(prefix: string): string[] {
	const found = new Set<string>();
	for (const q of QUESTIONS) {
		for (const t of q.tags) {
			if (t === prefix) continue;
			if (t.startsWith(prefix + '/')) {
				const rest = t.slice(prefix.length + 1);
				const slash = rest.indexOf('/');
				found.add(slash === -1 ? rest : rest.slice(0, slash));
			}
		}
	}
	return [...found].sort();
}

/** Distinct full tags matching a prefix (for building a picker UI). */
export function listTags(prefix: string): string[] {
	const found = new Set<string>();
	for (const q of QUESTIONS) {
		for (const t of q.tags) {
			if (tagMatches(t, prefix)) found.add(t);
		}
	}
	return [...found].sort();
}
