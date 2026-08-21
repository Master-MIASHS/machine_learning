---
name: page-creation
description: Create or extend course pages in src/routes using the project's PageTemplate, navigation registry, content components, math conventions, and progress tracking.
---

# Page creation

Use this skill when adding or substantially revising a lesson, exercise page, introduction page, or demonstration page.

## Workflow

1. Inspect a nearby page and the component source before writing markup.
2. Create the route directory and a minimal `+page.svelte`.
3. Register the route in `src/lib/navigation.ts` by editing `RAW_PAGES` in reading order.
4. Resolve metadata with `getPageByPath`, previous/next pages with `getPrevPage` and `getNextPage`, and page interaction tracking with `createPageTracker`.
5. Wrap content in `PageTemplate`; its `title` creates the page heading, so do not add a duplicate `<h1>`.
6. Use existing narrative, control, chart, and demo components before creating new ones.
7. Use `KatexInline`/`KatexBlock` for mathematics and add bibliography entries for cited works.
8. Run `pnpm check`, targeted tests, and a production build when the page is complete.

## Conventions

- Prefer the smallest page script that expresses the page behavior.
- Keep formulas and computation out of markup when they become non-trivial.
- Use Svelte 5 runes and snippets; do not introduce legacy slots.
- Use semantic CSS variables and scoped styles for page-specific layout.
- Track meaningful interactions from interactive sections, not every render.
- For expensive demos, use `DeferredDemo` and provide loading/error behavior.

## Boundaries

Do not modify global layout, reusable components, or math modules unless the page actually requires it; use the corresponding specialized skill for those changes.
