---
name: demo-maintenance
description: Audit and maintain the demonstration component library, including unused demos, duplicate behavior, stale imports, and lesson coverage.
---

# Demonstration maintenance

Inventory `src/lib/components/demos` and search all routes for imports and rendered uses. Classify components as used, unused, experimental, or broken before changing them.

Check that used demos:

- Still match the current `src/lib/math` APIs.
- Use current Svelte 5 and component conventions.
- Have valid controls, labels, loading states, and responsive output.
- Are connected to the lesson that explains their behavior.
- Are deferred when their cost warrants it.

For unused demos, report their paths and likely replacement or removal candidates. Do not delete material code without confirming that no dynamic import, documentation, or external route depends on it.
