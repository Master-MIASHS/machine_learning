---
name: quiz-database
description: Add, tag, query, and filter quiz questions in the static src/lib/quiz database and wire them into Quiz pages.
---

# Quiz database

Use this skill to add or edit quiz questions, choose their tags, query the database at any level (part / lesson / section), and render the result with the `Quiz` component.

## Where things live

- `src/lib/quiz/types.ts` — `QuizItem` (`question`, `options`, `answerIndex`, `explanation?`) and `QuizQuestion` (adds `id`, `tags`).
- `src/lib/quiz/questions/part1.ts` … `part9.ts` — the question data, one file per part (a question lives in its *home* part file).
- `src/lib/quiz/questions/index.ts` — aggregates the part files into `QUESTIONS` (course order).
- `src/lib/quiz/index.ts` — the query API: `getQuizQuestions`, `tagMatches`, `listChildren`, `listTags`, plus re-exports of `QUESTIONS` and the types.
- `src/lib/quiz/quiz.test.ts` — invariants (unique `id`s, valid `answerIndex`, parts 1–9, prefix monotonicity, exact total count).
- `src/lib/components/narrative/Quiz.svelte` — the renderer. It takes `items: QuizItem[]` (a `QuizQuestion[]` is directly assignable) and an optional `maxQuestions` that samples a random subset.

## Tag convention

A question carries a **list** of hierarchical path-tags; several tags is how one question belongs to multiple parts/topics.

| Tag | Meaning |
| --- | --- |
| `pN` | part N (1..9) |
| `pN/lM` | lesson M of part N |
| `pN/lM/<slug>` | a section / fine topic inside the lesson |
| `pN/synthese` | the part-N "synthèse" quiz |
| `axis:value` | part-agnostic cross-cutting group (`topic:…`, `difficulty:…`) |

Querying is by **path prefix**, matching over **all** of a question's tags (union). A question tagged `p4/l2/lasso` is returned by `getQuizQuestions('p4')`, `getQuizQuestions('p4/l2')`, and `getQuizQuestions('p4/l2/lasso')` — so store only the most specific tag; coarser queries fall out of the prefix. To make one question appear in two parts, give it two tags (e.g. `p1/l2/x` **and** `p2/l1/x`); it still lives in a single home file.

## Adding questions

1. Append to the correct `questions/partN.ts` (home part), in course order.
2. Give each a unique `id` (`pN-lM-qK`; `pN-syn-qK` for synthesis; `pN-lM-a-qK` / `pN-lM-b-qK` for a split lesson quiz) and at least one tag from the table.
3. Keep `answerIndex` 0-based and `< options.length`; use ≥ 2 options.
4. Write content in French, faithful to `course_sources/` — items test existing theorems/sections, so cite the real theorem numbers.
5. Update the exact-count assertion in `quiz.test.ts` (`QUESTIONS.length`).

To add an existing question to another part, add a second **tag** — do not duplicate the record.

## Querying / filtering

```ts
import { getQuizQuestions } from '$lib/quiz';

getQuizQuestions()                   // everything
getQuizQuestions('p4')               // whole part 4 (all lessons + synthèse)
getQuizQuestions('p4/l2')            // one lesson (union of its sections)
getQuizQuestions('p4/l2/lasso')      // one section
getQuizQuestions('p4/synthese')      // curated synthesis only
getQuizQuestions(['p1/l1','p4/l1'])  // union of several prefixes (OR)
```

`listChildren('p4')` and `listTags('p4')` return the distinct next-level slugs / full tags under a prefix — use them to build a picker UI.

## Rendering in a page

```svelte
<script lang="ts">
  import Quiz from '$lib/components/narrative/Quiz.svelte';
  import { getQuizQuestions } from '$lib/quiz';
  const quiz = getQuizQuestions('p4/l2');
</script>
<Quiz items={quiz} />                  <!-- all matching questions -->
<Quiz items={quiz} maxQuestions={10} /> <!-- random sample of 10 -->
```

The part "synthèse" pages (`partN/quiz`) query the **whole part** (`getQuizQuestions('pN')`) so they include every lesson quiz plus the curated synthesis questions, with `maxQuestions={10}`.

## Bulk changes

For many questions at once, a small Node script can extract the inline `const X: QuizItem[] = […]` arrays from pages, tag each record, and emit the `partN.ts` entries (the original 200-question migration worked this way). Run it in a dry run to validate extraction before writing, then re-run the checks.

## Verification

Run `npm run check`, `npm run test:unit`, `npm run lint`, and `npm run build`. The unit tests fail on a duplicated `id`, an out-of-range `answerIndex`, an unknown part, or a changed total count — keep the count assertion in sync.
