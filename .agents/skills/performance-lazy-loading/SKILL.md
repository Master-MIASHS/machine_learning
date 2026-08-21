---
name: performance-lazy-loading
description: Keep large pages and interactive demonstrations responsive through deferred loading, bounded computation, and careful reactive updates.
---

# Performance and lazy loading

Use `DeferredDemo` for expensive demonstrations or content below the fold. Preserve its loading placeholder, concurrency limit, and error handling.

- Avoid recalculating unchanged chart grids or simulation histories.
- Use `$derived` for pure derived data and `$effect` only for side effects.
- Bound grid sizes, sample counts, animation loops, and retained histories.
- Clean up observers, timers, and animation resources.
- Test slow loading, repeated visibility, parameter extremes, and component destruction.
- Prefer a simpler visualization or lower resolution when it preserves the pedagogical point.

Do not optimize by moving domain logic into global stores or duplicating math implementations.
