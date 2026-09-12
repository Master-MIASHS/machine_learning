---
id: p8-l2-stone-theoreme-minimax
type: panel
part: 8
lesson: /part8/lesson2
anchor: theoreme-stone
title: "Théorème de Stone en détail et borne minimax non paramétrique"
level: m2
priority: 1
status: pending
related: [p8-lesson-taux-non-parametriques-minimax, p2-l1-maudit-dimension-quantitatif]
sources:
  - course_sources/typst/theorie.typ
---

# Théorème de Stone en détail et borne minimax non paramétrique

## Mission

La leçon énonce le **théorème de Stone (1977)** (consistance universelle de
k-NN, Théorème 2.1) et « pourquoi $k$ fixe ne suffit pas ». Ce panneau donne
la **structure de la preuve** : le rôle précis des deux conditions $k_n\to\infty$
(tue la variance) et $k_n/n\to0$ (tue le biais), et énonce la **borne inférieure
de Stone** — le taux minimax non paramétrique. C'est le pont vers la leçon
expert sur les taux non paramétriques.

## Course boundaries

- **Lesson:** `src/routes/part8/lesson2/+page.svelte`
- **Already taught (do not re-teach):** consistance universelle, théorème de
  Stone (Th. 2.1), pourquoi $k$ fixe ne suffit pas.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Consistance du classifieur k-NN » (Théorème 2.1). Le panneau détaille la
  preuve et ajoute la borne inférieure.
- **Where "beyond course" starts:** la décomposition biais/variance locale de la
  preuve, la borne minimax de Stone — « au-delà du cours ».
- **Out of scope:** les estimateurs à noyau en détail (leçon expert
  `p8-lesson-taux-non-parametriques-minimax`).

## Research questions

1. Rappeler le **Théorème 2.1** (consistance universelle de k-NN) et ses deux
   conditions $k_n\to\infty$, $k_n/n\to0$.
2. Montrer le **rôle de $k_n\to\infty$** : la variance du voisinage local
   $\to0$ (plus de points dans la boule).
3. Montrer le **rôle de $k_n/n\to0$** : le rayon du voisinage $\to0$ (le biais
   local $\to0$).
4. Énoncer la **borne inférieure de Stone** : pour une classe $\beta$-lisse en
   $d$ dimensions, aucun estimateur ne fait mieux que le taux
   $n^{-2\beta/(2\beta+d)}$ (minimax).
5. Relier au **maudit de la dimension** (panneau `p2-l1-maudit-dimension-quantitatif`)
   : le taux dégénère en $d$ grand ; et renvoyer à la leçon expert sur les taux.

## Starting references

- Stone, « Consistent Nonparametric Regression » (1977, Ann. Statist.).
- Stone, « Optimal Global Rates of Convergence for Nonparametric Regression »
  (1982, Ann. Statist.).
- Tsybakov, *Introduction to Nonparametric Estimation* (2009), ch. 2.
- `course_sources/typst/theorie.typ` (Théorème 2.1).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `stone-theoreme-minimax.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `stone-theoreme-minimax.draft.md` — French content draft for an
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
