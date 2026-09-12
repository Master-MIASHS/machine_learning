---
id: p3-l1-single-linkage-mst-hartigan
type: panel
part: 3
lesson: /part3/lesson1
anchor: distance-clusters
title: "Single-linkage, arbres couvrants minimaux et consistance de Hartigan"
level: m2
priority: 1
status: pending
related: [p3-lesson-clustering-spectral-laplacien]
sources:
  - course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex
---

# Single-linkage, arbres couvrants minimaux et consistance de Hartigan

## Mission

La leçon présente le clustering hiérarchique et les critères de liaison
(single/complete/average/ward) de façon algorithmique. Ce panneau donne la
**structure sous-jacente** : le dendrogramme de single-linkage est exactement un
arbre couvrant minimal (MST), et single-linkage possède un résultat de
**consistance** (Hartigan 1975) que les autres liaisons n'ont pas — une
justification théorique du choix de critère.

## Course boundaries

- **Lesson:** `src/routes/part3/lesson1/+page.svelte`
- **Already taught (do not re-teach):** objectif du clustering, choix d'une
  distance, mesurer une partition, principe du clustering hiérarchique,
  distance entre clusters, dendrogramme, choix du nombre de clusters.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  5-Clustering.tex`, section « Clustering hiérarchique ». Le panneau ajoute la
  théorie MST + consistance.
- **Where "beyond course" starts:** MST, consistance de Hartigan, optimalité de
  Ward, absents de `course_sources/` → « au-delà du cours ».
- **Out of scope:** k-means (leçon 2), spectral clustering (leçon expert
  `p3-lesson-clustering-spectral-laplacien`).

## Research questions

1. Montrer que le dendrogramme de **single-linkage** correspond à l'arbre
   couvrant minimal (MST) : la fusion de single-linkage a lieu au poids de
   l'arête MST.
2. Énoncer le **résultat de consistance de Hartigan (1975)** : sous un modèle à
   deux populations, single-linkage retrouve la partition vraie avec
   probabilité $\to1$ quand $n\to\infty$.
3. Montrer que **Ward** minimise l'augmentation de la somme des carrés intra-
   clusters (SSE) à chaque fusion (greedy variance reduction).
4. Expliquer pourquoi complete/average linkage n'ont pas de caractérisation
   d'optimalité simple (et le défaut de chaînage de single-linkage).
5. Relier à l'algorithmique MST (Kruskal/Prim) : le dendrogramme se construit
   en $O(n^2\log n)$ ou mieux.

## Starting references

- Hartigan, « Clustering algorithms » (1975, Wiley).
- Ward, « Hierarchical grouping to optimize an objective function » (1963, J.
  Amer. Statist. Assoc.).
- Johnson, « Hierarchical clustering schemes » (1967, Psychometrika).
- von Luxburg, « A tutorial on spectral clustering » (2007) — pour le contraste.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `single-linkage-mst-hartigan.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `single-linkage-mst-hartigan.draft.md` — French content draft for an
   `ExpertPanel`: French, M2/research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every beyond-course statement marked
   « au-delà du cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
