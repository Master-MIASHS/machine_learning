---
name: math-content-katex
description: Author mathematical explanations and KaTeX formulas consistently across course pages.
---

# Mathematical content

Use `KatexInline` inside prose and `KatexBlock` for displayed equations. Keep substantial formulas in script constants so Svelte markup does not interpret TeX braces.

For complex expressions prefer `String.raw` and verify literal braces carefully: TeX grouping braces are not escaped, while literal set-builder braces may need `\{` and `\}`. Keep notation stable within and across lessons.

Introduce concepts in the project’s usual progression: intuition, definition, formula, example or visual consequence, then expert detail when useful. Connect displayed formulas to tested functions in `src/lib/math` rather than presenting disconnected mathematics.

Before finishing, check rendered formulas for malformed TeX, duplicate headings, inconsistent symbols, and missing bibliography entries.
