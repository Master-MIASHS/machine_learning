---
id: p5-l4-lasso-oracle-irrepresentable
type: panel
part: 5
lesson: /part5/lesson4
anchor: lasso
title: "Lasso : inégalité oracle et condition irrepresentable"
level: m2
priority: 1
status: pending
related: [p4-l5-bic-aic-cv, p5-lesson-lasso-haute-dimension, p1-lesson-methodes-proximales-fista-admm]
sources:
  - course_sources/typst/regularization.typ
---

# Lasso : inégalité oracle et condition irrepresentable

## Mission

La leçon enseigne le Lasso (régularisation L1, parcimonie) mais sans garantie
en **haute dimension**. Ce panneau donne les deux résultats centraux :
l'**inégalité oracle** (le risque de prédiction du Lasso est comparable au
meilleur modèle creux, à un facteur constant) et la **consistance de sélection**
(sous la **condition irrepresentable** et un signal minimal, le Lasso retrouve
exactement le support vrai). C'est le passage du Lasso comme « astuce » au
Lasso comme estimateur justifié.

## Course boundaries

- **Lesson:** `src/routes/part5/lesson4/+page.svelte`
- **Already taught (do not re-teach):** introduction régularisation, Ridge
  (Th. 5.1, Prop. 5.1), Lasso (parcimonie), Elastic Net, choix de $\lambda$ par
  CV, weight decay.
- **Ground truth to read first:** `course_sources/typst/regularization.typ` §
  « Régularisation L1 (Lasso) » et « Elastic Net ». La théorie high-dim
  (oracle, irrepresentable) est au-delà.
- **Where "beyond course" starts:** inégalité oracle, condition irrepresentable,
  RE condition — « au-delà du cours ».
- **Out of scope:** l'équivalence Lasso–BIC (panneau
  `p5-l4-lasso-bic-equivalence`), la leçon expert high-dim.

## Research questions

1. Énoncer l'**inégalité oracle** du Lasso (Tibshirani 2013 ; van de Geer &
   Bühlmann 2013) :
   $\mathbb E\|X\hat\beta-X\beta\|^2\le C\min_{S}\|\beta_S\|_1^2+...$ (forme
   exacte).
2. Énoncer la **condition irrepresentable** (Zhao & Yu 2006) : la corrélation
   entre chaque variable vraie et chaque fausse est bornée ($<1$).
3. Énoncer la **consistance de sélection** : sous irrepresentable + signal
   minimal + RE condition, $P(\text{supp}(\hat\beta)=\text{supp}(\beta))\to1$.
4. Définir la **restricted eigenvalue condition** et son rôle (contrôle
   d'expansion).
5. Montrer un **cas d'échec** : variables quasi-colinéaires (irrepresentable
   violée) — le Lasso sélectionne l'une au hasard.

## Starting references

- Tibshirani, « The Lasso Method for Variables Selection in the Cohort Study »
  / *The Lasso* (2013, Statistical Science).
- van de Geer & Bühlmann, « Theory and Application of the Lasso and Related
  Penalties » (2013, J. R. Statist. Soc.).
- Zhao & Yu, « On Model Selection by Lasso » (2006, JRSS-B).
- Bickel, Ritov, Tsybakov, « Simultaneous Analysis of Lasso and Dantzig
  Selector » (2009, Ann. Statist.).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `lasso-oracle-irrepresentable.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `lasso-oracle-irrepresentable.draft.md` — French content draft for an
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
