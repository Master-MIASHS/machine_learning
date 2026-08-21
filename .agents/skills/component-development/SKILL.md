---
name: component-development
description: Create or extend reusable Svelte components in the project's layout, narrative, controls, charts, and demos libraries.
---

# Component development

Search the existing component library first. Read the implementation of any component being reused so props, snippets, bindings, and defaults are correct.

- Use Svelte 5 `$props()` with explicit TypeScript types.
- Use `Snippet` and `{@render ...}`; do not introduce legacy `<slot>` APIs.
- Keep reusable components independent of route-specific content.
- Put shared behavior in the appropriate library category and avoid page-only abstractions.
- Reuse semantic CSS variables and scoped styles.
- Preserve accessible names, focus behavior, and responsive layout.

Update project references only when the new component is intended for repeated use. Validate with `pnpm check` and focused tests or a demo route.
