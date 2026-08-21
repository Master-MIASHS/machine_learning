---
name: navigation-progress
description: Maintain route registration, page ordering, previous/next links, sidebar metadata, and interaction progress.
---

# Navigation and progress

Treat `src/lib/navigation.ts` as the source of truth. When adding or moving a page, update `RAW_PAGES` with the exact route ID, title, and part number in course order.

Verify that:

- The route file exists for every registered content page.
- `PageMeta` remains compatible with `PageTemplate` and stores.
- `getPrevPage` and `getNextPage` produce the intended lesson sequence.
- `PART_NAMES` and page titles match the visible course structure.
- Pages use `createPageTracker` and demos record meaningful interactions.

Avoid duplicating navigation arrays in pages or components. Run type checking and, when ordering changes, inspect the sidebar and page footer behavior.
