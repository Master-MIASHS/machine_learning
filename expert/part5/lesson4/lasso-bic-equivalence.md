---
id: p5-l4-lasso-bic-equivalence
type: panel
part: 5
lesson: /part5/lesson4
anchor: elastic-net
title: "Lasso et BIC : la double pénalité et l'équivalence"
level: m2
priority: 2
status: pending
related: [p4-l5-bic-aic-cv, p5-l4-lasso-oracle-irrepresentable]
sources:
  - course_sources/typst/regularization.typ
  - course_sources/sophie/9.choix_de_modele.pdf
---

# Lasso et BIC : la double pénalité et l'équivalence

## Mission

La leçon présente le Lasso (Partie V) et le BIC (Partie IV) séparément. Ce
panneau montre leur **lien profond** : pour des coefficients petits, l'objectif
Lasso se développe en un **BIC** (Tibshirani 2008/2013), et la norme L1 a une
**double pénalité** (rétrécit *et* sélectionne). C'est la justification
statistique du Lasso comme outil de sélection de variables, et un pont
élégant entre les deux parties.

## Course boundaries

- **Lesson:** `src/routes/part5/lesson4/+page.svelte`
- **Already taught (do not re-teach):** Ridge, Lasso, Elastic Net, choix de
  $\lambda$, weight decay (Partie V) ; AIC/BIC (Partie IV, leçon 5).
- **Ground truth to read first:** `course_sources/typst/regularization.typ` §
  « Régularisation L1 (Lasso) » et `course_sources/sophie/9.choix_de_modele.pdf`
  (BIC). Le panneau relie les deux.
- **Where "beyond course" starts:** le développement asymptotique Lasso≈BIC, la
  double pénalité — « au-delà du cours ».
- **Out of scope:** la théorie high-dim complète (panneau
  `p5-l4-lasso-oracle-irrepresentable`).

## Research questions

1. Énoncer la **double pénalité** du L1 : à la différence du L2 (qui rétrécit
   sans sélectionner), le L1 rétrécit *et* pousse à 0 (parcimonie) — montrer
   géométriquement (contrainte diamant vs. cercle).
2. Montrer que, pour les $\beta_j$ petits,
   $\min\ \tfrac12\|Y-X\beta\|^2+\lambda\|\beta\|_1$ se développe en
   $-\log\hat L+\lambda'\log n$ (forme BIC) avec $\lambda$ calibré (Tibshirani
   2008/2013).
3. Donner la valeur de $\lambda$ qui rend le Lasso $\approx$ BIC et discuter la
   calibration.
4. Relier : le Lasso « fait du BIC en continu » ; comparer à l'AIC (sur-
   sélection).
5. En une phrase, pourquoi cette équivalence justifie le Lasso pour la
   sélection de variables (et ses limites — variables corrélées).

## Starting references

- Tibshirani, « Strong Rules for Discarding Predictors in Lasso-Type Problems »
  (2012) ; *The Lasso Method* (2013, Statistical Science) — équivalence BIC.
- Zou, « The Adaptive Lasso and Its Oracle Properties » (2006, JRSS-B).
- `course_sources/sophie/9.choix_de_modele.pdf` (BIC).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `lasso-bic-equivalence.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `lasso-bic-equivalence.draft.md` — French content draft for an
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
