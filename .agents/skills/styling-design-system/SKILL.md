---
name: styling-design-system
description: Style pages and components with the project's semantic CSS variables, scoped Svelte styles, theme support, and responsive conventions.
---

# Styling and design system

Use semantic variables from `src/app.css` for text, surfaces, borders, and conceptual colors. Use scoped `<style>` blocks for local layout and existing utilities from `src/lib/styles/page.css` when applicable.

- Reuse component styling before adding new rules.
- Preserve dark/light theme behavior; avoid fixed colors that disappear in either theme.
- Use the project radius and typography variables.
- Design for narrow screens and long formulas, labels, and navigation titles.
- Keep focus-visible states and readable contrast for interactive controls.
- Tailwind is available but is not the primary project styling approach.

Check the result at mobile width and in both themes when the change affects visible UI.
