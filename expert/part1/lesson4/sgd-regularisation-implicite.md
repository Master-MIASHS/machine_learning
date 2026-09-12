---
id: p1-l4-sgd-regularisation-implicite
type: panel
part: 1
lesson: /part1/lesson4
anchor: sgd
title: "Le SGD comme régularisateur implicite"
level: research
priority: 3
status: pending
related: [p9-l4-overfitting-benin-interpolation, p1-lesson-optimisation-non-convexe-deep-learning]
sources:
  - course_sources/typst/optim.typ
---

# Le SGD comme régularisateur implicite

## Mission

La leçon traite le SGD comme un algorithme d'approximation du gradient exact.
Ce panneau adopte le point de vue de la recherche : le bruit du SGD n'est pas
qu'une nuisance, c'est un **régularisateur implicite** qui biaise la solution
vers des minima « plats », avec des conséquences mesurables sur la
généralisation. Pont direct vers la double descente (Partie IX, leçon 4).

## Course boundaries

- **Lesson:** `src/routes/part1/lesson4/+page.svelte`
- **Already taught (do not re-teach):** SGD, variance du gradient, coordinate
  descent, Newton, synthèse.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Descente de gradient stochastique (SGD) ». Le panneau renverse la
  perspective (bruit = régularisation).
- **Where "beyond course" starts:** l'interprétation en régularisation
  implicite et les minima plats, absents de `course_sources/` → « au-delà du
  cours ».
- **Out of scope:** la double descente en elle-même (Partie IX), la théorie
  NTK (leçon expert `p9-lesson-ntk-generalisation-moderne`).

## Research questions

1. Présenter l'hypothèse des **minima plats** : pourquoi un minimum avec
  Hessienne petite (plat) généraliserait mieux (Hochreiter & Schmidhuber 2002 ;
  Keskar et al. 2017).
2. Montrer que l'amplitude du bruit du SGD est $\propto$ learning rate /
   taille de mini-lot, et qu'elle dépend de la courbure locale.
3. Présenter la **sharpness-aware minimization** (SAM, Foret et al. 2021) :
   minimiser $\max_{\|\epsilon\|\le\rho} L(w+\epsilon)$, et ce qu'elle mesure.
4. Distinguer les **preuves** des **observations empiriques** sur le lien
   SGD → généralisation (ce sujet est largement heuristique).
5. Expliquer le « generalization gap » entre gros et petits lots (Chen et al.
   2021) en une phrase.

## Starting references

- Hochreiter & Schmidhuber, « Flat Minima » (2002, Neural Computation).
- Keskar, He, Cho, Franzi, Socher, « On Large-Batch Training for Deep Learning:
  Generalization Gap and Sharp Minima » (2017, ICLR).
- Foret, Kaya, et al., « Sharpness-Aware Minimization for Improved
  Generalization » (2021, ICML).
- Chen, Li, et al., « On the Generalization Performance of Sgd » (2021).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `sgd-regularisation-implicite.research.md` — verified claims only, each with
   an exact citation. Sujet heuristique : distinguer **prouvé** /
   **empirique** / **UNVERIFIED**.
2. `sgd-regularisation-implicite.draft.md` — French content draft for an
   `ExpertPanel`: French, research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every claim checked against a primary source (not memory)
- [ ] Prouvé / empirique / UNVERIFIED clairement distingués
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] French draft reads at research level
