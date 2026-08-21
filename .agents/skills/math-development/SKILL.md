---
name: math-development
description: Add, refactor, or test mathematical functions in src/lib/math for the interactive optimization and learning course.
---

# Mathematical development

Use this skill for numerical helpers, algorithms, distributions, losses, optimization routines, simulation data, and their tests.

## Workflow

1. Search `src/lib/math` and inspect `util.ts`, `index.ts`, and related tests before adding code.
2. Reuse an existing function when its contract already fits.
3. Put generic reusable helpers in `src/lib/math/util.ts`; put topic-specific logic in a focused module.
4. Export public functions from `src/lib/math/index.ts` when barrel imports are appropriate.
5. Specify input/output shapes, numerical conventions, and behavior at boundaries in TypeScript types and comments.
6. Use deterministic seeded randomness for demonstrations and tests.
7. Add Vitest tests for analytic values, limiting cases, invariants, and failure-prone numerical inputs.

## Numerical rules

- Avoid accidental `NaN` and division-by-zero behavior.
- Make probability conventions explicit: normalization, zero masses, log base, and units.
- Preserve input arrays unless mutation is part of the documented contract.
- Keep math modules framework-independent; Svelte components consume them but do not define them.
