---
name: testing-validation
description: Validate changes to pages, math modules, components, navigation, and interactive demonstrations with the project's checks and tests.
---

# Testing and validation

Use the smallest relevant checks first, then broaden validation according to risk:

- `pnpm check` for Svelte, TypeScript, route, and prop errors.
- `pnpm lint` for code quality and Svelte rules.
- `pnpm test:unit` for math, stores, and deterministic behavior.
- `pnpm build` for production-only import, route, and asset failures.
- Playwright tests for user-visible navigation or interaction regressions.

New mathematical functions need analytic values, boundary cases, and invariants. New pages need route registration, metadata, navigation, and render checks. New interactive components need parameter extremes, reset behavior, and loading/error behavior where applicable.

Report failures with the command and the relevant error; do not hide unrelated pre-existing failures.
