---
name: chart-visualization
description: Create course charts with the existing Figure and chart components, responsive sizing, mathematical data, and accessible labels.
---

# Chart visualization

Choose an existing chart from `src/lib/components/charts` before implementing a new one. Read its props and types directly. Wrap charts in `Figure` and select the appropriate figure type.

- Compute points and series from functions in `src/lib/math`.
- Make domains, scales, labels, units, legends, and reference values explicit.
- Use semantic colors from `src/app.css`; do not hard-code theme colors.
- Account for responsive width through `Figure` and component props.
- Keep SVG/canvas output readable, labeled, and stable when data changes.
- Test empty, constant, negative, and extreme-valued datasets where relevant.

Use `DeferredDemo` for expensive visualizations and avoid duplicating chart logic inside pages.
