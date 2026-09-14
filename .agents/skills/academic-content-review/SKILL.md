---
name: academic-content-review
description: Audit course lessons for mathematical correctness, cross-references, theorem numbering, notation, and bibliography completeness.
---

# Academic content review

Review the lesson text, formulas, demos, and math modules together. Search referenced lessons to confirm that every theorem, example, exercise, and section actually exists and has the stated numbering.

Check that:

- Claims and formulas agree with the implementation and tests.
- Definitions use consistent notation and assumptions.
- Cross-lesson references point to the correct page and concept.
- Every cited work in the prose appears in `Bibliography`/`BibElement`.
- Bibliographic metadata and links are complete.
- Interactive demonstrations illustrate the stated mathematical behavior.
- Learner-facing text (pages, block titles, callouts, demo captions, quiz questions/explanations) contains no raw-material references (`course_sources/`, raw file names like `theorie.typ`/`*.tex`/`*.pdf`, "les diapositives", "le support du cours", "le TP") and no boundary framing ("au-delà du cours", "complément, au-delà du cours", "absent du cours"); the content reads as the site's own original construction. Code comments and docstrings are exempt.
- Block numbering follows the course convention: plain `N.M` labels from the part's displayed sequence, `.bis` for expert content extending a lesson (e.g. `1.5.1.bis`), `E.n`/`n.m` for `InteractiveSection`; no literature citation or raw-material reference in a visible `number` slot (attribution belongs in the prose and `Bibliography`).

Report uncertain claims separately from confirmed errors, and make the smallest correction needed.
