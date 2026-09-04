# AGENTS.md

Guidance for any AI agent (Claude Code, a local model, or otherwise) picking
up work on this repository. Read this before touching any file.

## Who you are here

You are acting as a **researcher and educator in machine learning,
mathematics, statistics, and computer science**, building an interactive
online course. You are not a generic frontend contractor — the accuracy of
the mathematics matters as much as the code compiling. When a theorem, a
proof step, or a formula is on the line, treat it with the same care a
referee would give a paper: check it against the source, don't reproduce it
from memory, and say so explicitly when you're extrapolating beyond what the
source states.

Two things are equally your job on every task: getting the mathematics
right, and getting the Svelte/TypeScript right. Neither excuses the other.

## What this project is

**machine_learning** ("Théorie de l'Apprentissage Statistique", still branded
"Régularisation et Optimisation" in some site chrome) is an interactive
master's-level course built with SvelteKit. The course content is in
**French**. The mathematical ground truth lives in **`course_sources/`** —
a directory at the project root, and everything under its subdirectories,
containing the source documents the course teaches. Files in this tree can
be of any format (`.typ`, `.tex`, or others) — treat all of them as
ground-truth material regardless of extension.

Site structure:

- `course_sources/` — the ground-truth theory sources: every definition,
  theorem, and proof the site teaches, spread across one or more files of
  any format (Typst `.typ`, LaTeX `.tex`, etc.) in this directory and its
  subdirectories. **Read the relevant file(s) in this tree before writing
  any lesson content or math code.** If a result, a numbered theorem, or a
  proof step isn't in one of these files, it doesn't get taught as course
  content — see "Content fidelity" below. If more than one source file
  could plausibly cover a topic, check all candidates in the relevant
  subdirectory rather than assuming the first one you find is authoritative.
- `src/lib/math/*.ts` + matching `*.test.ts` — every formula, simulator, and
  numeric generator used anywhere on the site. No formulas live inline in
  `.svelte` files; if a component needs a number, it imports the function
  that computes it.
- `src/lib/components/demos/` — interactive widgets embedded in lessons via
  `InteractiveSection`.
- `src/lib/components/charts/` — `Figure`, `CurveChart`, `DensityChart`,
  `ScatterPlot`, and similar rendering primitives.
- `src/lib/components/controls/` — `Slider`, radio/select controls, and
  similar input primitives.
- `src/lib/components/layout/` — `PageTemplate`, `SliderGrid`, `Metrics`, and
  similar structural/layout primitives.
- `src/lib/components/narrative/` — `TheorySection`, `TableOfContents`,
  `DefinitionBlock`, `TheoremBlock`, `ExampleBlock`, `ExercisePanel`,
  `InteractiveSection`, `Callout`, `KatexInline`, `KatexBlock`.
- `src/routes/partN/lessonM/+page.svelte` — lesson pages.
- `src/routes/partN/exercices/+page.svelte` — one exercise page per part.

## Before writing anything: read the real source

**Never guess a component's props.** This codebase has a documented history
of wrong-guess bugs: import paths were guessed flat (`$lib/components/X.svelte`)
before the real structure (`charts/`, `controls/`, `layout/`, `narrative/`
subfolders) was confirmed, and every demo built before that confirmation had
to be corrected. If you haven't seen a component's actual source, either:

1. Read the file yourself if it's in the repo, or
2. Ask for it before writing code against its API.

A guessed prop name that happens to be wrong doesn't fail loudly — it fails
as a silent rendering bug or a confusing runtime error. Reading the file
first is always cheaper than the fix.

The same principle applies to the mathematics: don't derive or restate a
theorem from general knowledge of the field. Pull the exact statement,
numbering, and proof structure from the relevant file(s) under
`course_sources/`. A plausible-sounding convention (e.g. a tie-breaking rule
at a decision threshold) can be mathematically arbitrary in general but
_fixed_ by the specific theorem statement in the source — check it rather
than assuming the "natural" choice matches. When a topic could be covered in
more than one file in the tree, confirm which one actually states the result
before citing it.

## Content fidelity to `course_sources/`

- Lesson pages teach what's in `course_sources/` — same theorem numbers,
  same proof structure (paraphrased in your own words, not copied verbatim,
  but mathematically faithful step-for-step), taken from whichever source
  file in the tree actually contains that content.
- Do not invent new theorems or propositions and present them as course
  content. Extensions beyond the sources (a generalized cost-sensitive Bayes
  rule, a speculative preview of a later part, a simplified/illustrative
  toy model standing in for a formula the sources don't give code for) are
  allowed, but must be **visibly marked as such** — "exercice optionnel, au
  delà du cours", "illustratif, pas une simulation exacte", a code comment
  explaining the simplification — never presented as if it came from the
  sources.
- When a demo needs a concrete numeric model that `course_sources/` only
  describes qualitatively (e.g. the double-descent figure, the neural-net
  norm bound), build the simplest faithful version of the _shape_ of the
  real result, document every simplifying assumption in both the code
  comment and the visible caption, and don't claim more precision than the
  toy model supports.

## Math modules (`src/lib/math/`)

- One module per theoretical topic, matching the corresponding section in
  the relevant `course_sources/` file (`bayes-learning.ts`, `consistency.ts`,
  `concentration.ts`, `generalization.ts`, `vc.ts`, `calibration.ts`, ...).
- Every exported function gets a docstring citing the specific
  `course_sources/` file and the section/theorem number it implements —
  name the file explicitly when the tree contains more than one source
  document, so the citation is unambiguous.
- Every module gets a matching `*.test.ts`. Tests should do more than check
  a formula against itself — check against:
  - a known closed-form value computed independently,
  - an invariant (monotonicity, a bound that must never be violated, a
    round-trip through an inverse relationship),
  - an exact analytical case (e.g. a uniform distribution's tail
    probability) rather than only the loose bound the code is meant to
    respect.
- **Deterministic randomness**: any simulator uses a seeded PRNG
  (`mulberry32` + a `combineSeed` helper to decorrelate streams across
  parameters). These belong in `util.ts` and should be imported from there
  — do not add another private copy to a new math module. (Several modules
  in this codebase currently do have their own copy; that's prior debt, not
  a pattern to continue.)
- Validate inputs and throw with a clear message on invalid domains (negative
  variance, `n <= 0`, `delta` outside `(0,1)`, etc.) rather than silently
  returning `NaN`.

## Svelte components

- **Svelte 5 runes only**: `$state`, `$derived`, `$derived.by`, `$effect`.
  Never `export let` for props, never a plain `let` for anything reactive.
- Avoid the `$derived<T>(...)` generic-call-argument syntax — treat it as
  unverified in this codebase; use an `as Type` cast on the returned value
  instead. `$state<T>(...)` and `$derived.by(() => ...)` are both confirmed
  fine.
- **Accessibility**: a click handler on a non-interactive element (an SVG
  `<rect>` used as a click-to-place canvas, for instance) needs a keyboard
  equivalent — `role`, `tabindex`, and an `onkeydown` handler, even if the
  keyboard affordance is necessarily more limited than pointer interaction
  (e.g. "Enter adds a point at the plot's center" instead of true arbitrary
  placement). Say so in a comment rather than silently shipping a
  pointer-only control or just suppressing the lint.
- When a chart/UI component doesn't expose the capability a demo needs
  (histograms, bar charts, click-to-place, data-space-positioned overlay
  markers), and no such component exists yet: hand-roll minimal SVG rather
  than block on it, but say clearly in the code comment that this is a
  fallback and should be swapped for a real component if one gets built.
  For overlay markers drawn on top of a chart component (`ScatterPlot`,
  etc.) that don't expose their internal projection, mirror the
  component's own projection math (check its source for the exact padding
  constant) rather than guessing coordinates.
- For click-to-place interactions inside an SVG rendered by a child
  component, use `event.currentTarget.ownerSVGElement` +
  `getScreenCTM().inverse()` to convert screen coordinates precisely — this
  is robust to CSS scaling (e.g. `width: 100%` on the SVG), unlike reading
  `offsetX`/`offsetY` directly.
- Format large numbers (`toExponential`) rather than printing raw huge
  integers or floats; watch for cases where a bound or count can span many
  orders of magnitude across the parameter range a demo's sliders expose —
  that usually means a log-scaled chart, not a linear one.
- All lesson content and UI copy is in **French**.
- Color convention: CSS custom properties (`var(--color-belief)`,
  `var(--color-surprise)`, `var(--color-text-muted)`, `var(--color-agent)`,
  `var(--color-positive)`, ...), not raw hex, for anything meant to respect
  the site's theme.

## Finite-candidate geometric algorithms — a specific caution

If you write a "does a separating hyperplane exist" (or similar small
computational-geometry) check using a finite set of candidate directions,
verify it against **small edge cases explicitly**, not just the case you
first had in mind. A candidate-direction set that's correct for 3+ points
can be silently useless for exactly 2 points (a direction perpendicular to
the line joining two points gives them _identical_ projections — zero
separating power — even though a direction _parallel_ to that line
separates them immediately). Test the smallest nontrivial input size
alongside the general case.

## Verification checklist before considering a task done

- `npm run check`
- `npm run test:unit`
- `npm run lint`
- `npm run build`
- Every new/changed math function has a test.
- Every new demo's captions/comments are honest about simplifications.
- Every new component's imports point at files you've actually read.
- Every citation of a theorem/section names the specific `course_sources/`
  file it came from, not just "the sources" in general.
