---
name: interactive-demo
description: Build interactive Svelte demonstrations in src/lib/components/demos that connect tested mathematics to controls and visual feedback.
---

# Interactive demonstrations

Inspect existing demos and controls before creating a component. Keep the component responsible for state, presentation, and user events; put reusable algorithms and calculations in `src/lib/math`.

- Use Svelte 5 `$state`, `$derived`, `$effect`, and `$props()`.
- Use existing controls and chart components before adding new UI primitives.
- Define valid parameter ranges, reset behavior, stable keys, and empty/error states.
- Use deterministic seeds for reproducible simulations.
- Expose accessible labels and keyboard-operable controls.
- Have the containing page call `tracker.trackInteraction()` for meaningful user interaction.
- Use `DeferredDemo` when computation or rendering is expensive or below the fold.

Check the demo at representative parameter extremes and run `pnpm check` plus relevant unit tests.
