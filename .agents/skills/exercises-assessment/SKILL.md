---
name: exercises-assessment
description: Create and review mathematical exercises, explanations, and teacher-mode solutions in course pages.
---

# Exercises and assessment

Use `ExercisePanel` and the existing narrative components rather than inventing a parallel exercise format. Keep numbering, notation, and difficulty aligned with the surrounding lesson.

- State the task and data precisely.
- Reuse tested functions from `src/lib/math` for computational exercises.
- Keep solutions hidden behind the component’s teacher-mode behavior.
- Check that each exercise tests a concept actually introduced in the course.
- Verify calculations, edge cases, and displayed formulas independently.

When adding an exercise page, also update navigation and page metadata according to `page-creation` conventions.
