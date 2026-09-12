---
id: p1-lesson-optimisation-non-convexe-deep-learning
type: lesson
part: 1
lesson: /part1
anchor: null
title: "Optimisation non convexe en deep learning"
level: research
priority: 3
status: pending
related: [p1-l4-sgd-regularisation-implicite, p9-l4-overfitting-benin-interpolation, p9-lesson-ntk-generalisation-moderne]
sources:
  - course_sources/typst/optim.typ
---

# Optimisation non convexe en deep learning

## Mission

Leçon expert de **frontière de recherche** : pourquoi l'entraînement de réseaux
de neurones (perte manifestement non convexe, voir la section « Non-convexité en
Deep Learning » de la leçon 2) réussit pourtant. Paysage de perte, points-selle
contre minima locaux, propriété strict-saddle, connectivité des minima, et le
pont vers la théorie NTK / régularisation implicite (Partie IX).

## Course boundaries

- **Anchored to:** Partie I — Optimisation (`src/routes/part1/`), prolongement
  de la section « Non-convexité en Deep Learning » (leçon 2).
- **Already taught (do not re-teach):** non-convexité (leçon 2), points-selle
  vs minima locaux (panneau existant de la leçon 2), descente de gradient,
  momentum, Nesterov, SGD.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Non-convexité en Deep Learning » (leçon 2) — très courte ; la leçon expert
  la complète.
- **Where "beyond course" starts:** tout (paysage, strict-saddle, mode
  connectivity, NTK) → « au-delà du cours », leçon marquée expert.
- **Out of scope:** NTK en détail (leçon expert
  `p9-lesson-ntk-generalisation-moderne`), double descente (Partie IX).

## Research questions

1. Compter les points-saddle : pourquoi leur nombre explode avec la dimension
   (Dauphin et al. 2014) et pourquoi le SGD les quitte (la mesure du sous-
   niveau de $\nabla^2$ nulle).
2. Énoncer la **propriété strict-saddle** (Li et al. 2018) : chaque point-selle
   a une direction de descente de la Hessienne, donc le GD/SGD s'en échappe en
   temps polynomial.
3. Présenter la **mode connectivity** : les minima de réseaux entraînés sont
   reliés par des chemins à faible perte (Nguyen et al. 2021).
4. Distinguer **prouvé** / **heuristique** / **empirique** sur chaque point.
5. Pont : en quoi la théorie NTK (Jacot et al. 2018) rend la perte convexe dans
   le régime « lazy » (renvoi à la leçon NTK).

## Starting references

- Dauphin, Pascanu, et al., « Identifying and attacking the saddle point
  problem in high-dimensional non-convex optimization » (2014, NeurIPS).
- Li, Tai, et al., « Visualizing the Loss Landscape of Neural Nets » (2018,
  NeurIPS) ; Li, Mada, et al., strict-saddle (2018).
- Nguyen, Han, et al., « Mode connectivity of neural networks » (2021).
- Jacot, Gabriel, Hongler, « Neural Tangent Kernel » (2018, ICLR).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `optimisation-non-convexe-deep-learning.research.md` — verified claims only,
   each with an exact citation. Sujet de frontière : distinguer soigneusement
   **prouvé** / **heuristique** / **empirique** / **UNVERIFIED**.
2. `optimisation-non-convexe-deep-learning.draft.md` — French **full-lesson**
   draft: French, research level; structured like an expert lesson; every
   formula KaTeX-ready and `String.raw`-safe; narrative blocks; every statement
   marked « au-delà du cours »; optional "Proposed demos" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every claim checked against a primary source (not memory)
- [ ] Prouvé / heuristique / empirique / UNVERIFIED clairement distingués
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at research level
