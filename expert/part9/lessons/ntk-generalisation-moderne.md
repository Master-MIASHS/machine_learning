---
id: p9-lesson-ntk-generalisation-moderne
type: lesson
part: 9
lesson: /part9
anchor: null
title: "Généralisation moderne : NTK et régularisation implicite"
level: research
priority: 3
status: pending
related: [p9-l4-overfitting-benin-interpolation, p1-lesson-optimisation-non-convexe-deep-learning, p2-lesson-rkhs-methodes-noyau]
sources:
  - course_sources/typst/theorie.typ
---

# Généralisation moderne : NTK et régularisation implicite

## Mission

Leçon expert de **frontière de recherche** : la théorie moderne de la
généralisation des réseaux de neurones. Le **Neural Tangent Kernel (NTK)**
(Jacot et al. 2018) qui linearise un réseau infini et rend la dynamique
équivalente à un noyau (pont avec la leçon expert RKHS), la **théorie mean
field**, la **double descente** théorique, et la **régularisation implicite**
du SGD (minima plats, pont avec le panneau `p1-l4-sgd-regularisation-implicite`).
C'est la leçon qui explique « pourquoi les réseaux surparamétrés généralisent »
en théorie.

## Course boundaries

- **Anchored to:** Partie IX — Généralisation (`src/routes/part9/`), après la
  leçon 4 (limites VC, double descente).
- **Already taught (do not re-teach):** dimension VC des réseaux, double
  descente, bornes de Bartlett (Th. cités dans la source).
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Limites de la théorie VC pour les réseaux de neurones ». NTK, mean field,
  régularisation implicite sont au-delà.
- **Where "beyond course" starts:** NTK, mean field, double descente théorique,
  régularisation implicite — « au-delà du cours », leçon marquée expert.
- **Out of scope:** l'optimisation non convexe (leçon expert
  `p1-lesson-optimisation-non-convexe-deep-learning`), la théorie des taux
  (Partie VIII).

## Research questions

1. Définir le **NTK** $\Theta(x,x')=\langle\partial_\theta f_\theta(x),
   \partial_\theta f_\theta(x')\rangle$ et montrer que, au régime infini,
   l'entraînement est équivalent à une **méthode à noyau** (pont leçon expert
   RKHS).
2. Énoncer le **théorème mean field** (médiocrité/large-width) : un réseau large
   converge vers une solution de noyau et la dynamique est convexe en $\Theta$.
3. Relier à la **double descente** : la courbe de risque en fonction de la
   capacité (NTK) reproduit la double descente (Hastie et al. 2019 ; Allen-Zhu
   et al. 2019).
4. Présenter la **régularisation implicite** du SGD (minima plats) et son lien
   avec la généralisation (pont `p1-l4-sgd-regularisation-implicite`).
5. Distinguer **prouvé** / **heuristique** / **empirique** (sujet de frontière)
   et citer les limites de la théorie NTK (régime « lazy » vs. « rich »).

## Starting references

- Jacot, Gabriel, Hongler, « Neural Tangent Kernel: Convergence and
  Generalization in Neural Networks » (2018, ICLR).
- Allen-Zhu, Li, Li, Ma, « Convergence and Generalization Bound of SGD for
  Over-Parameterized Neural Networks » (2019).
- Hastie, Montanari, Rosset, Tibshirani, « Surprises in High-Dimensional Ridge
  Behavior » (2019, Ann. Statist.).
- Lee, Xiao, et al., « Wide Neural Networks of Any Depth Evolve as Linear
  Models Under Gradient Descent » (2019).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `ntk-generalisation-moderne.research.md` — verified claims only, each with
   an exact citation. Sujet de frontière : distinguer soigneusement **prouvé**
   / **heuristique** / **empirique** / **UNVERIFIED**.
2. `ntk-generalisation-moderne.draft.md` — French **full-lesson** draft:
   French, research level; structured like an expert lesson; every formula
   KaTeX-ready and `String.raw`-safe; narrative blocks; every statement marked
   « au-delà du cours »; "Proposed demos" subsection (ex. NTK vs. réseau fini)
   + `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every claim checked against a primary source (not memory)
- [ ] Prouvé / heuristique / empirique / UNVERIFIED clairement distingués
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at research level
