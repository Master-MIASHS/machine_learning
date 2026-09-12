---
id: p2-l1-maudit-dimension-quantitatif
type: panel
part: 2
lesson: /part2/lesson1
anchor: curse-dimension
title: "Le maudit de la dimension, quantitativement"
level: m2
priority: 2
status: pending
related: [p2-l1-estimateurs-noyau-nadaraya-watson, p8-l2-stone-theoreme-minimax]
sources:
  - course_sources/marine/Cours/CM/coursClassif-1-Intro.tex
---

# Le maudit de la dimension, quantitativement

## Mission

La leçon possède un demo `CurseOfDimensionalityDemo` mais sans formalisation.
Ce panneau quantifie le maudit de la dimension : volume de la boule en
dimension $d$, concentration des distances entre points, et la conséquence
directe pour k-NN — le rapport distance au plus proche / distance au plus loin
tend vers 1, ce qui rend tout voisinage « plat ». C'est l'explication
quantitative de la limite de k-NN en grande dimension.

## Course boundaries

- **Lesson:** `src/routes/part2/lesson1/+page.svelte`
- **Already taught (do not re-teach):** k-NN, maudit de la dimension (démo),
  biais-variance, sélection de modèle.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  1-Intro.tex` (k-NN). Le panneau fournit la quantification absente de la
  source.
- **Where "beyond course" starts:** volume de boule, concentration des
  distances, résultat sur le rapport de distances, absents de
  `course_sources/` → « au-delà du cours ».
- **Out of scope:** la théorie de la réduction de dimension (hors cours), la
  consistance (Partie VIII).

## Research questions

1. Donner le volume de la boule unité $d$-dimensionnelle
   $V_d=\pi^{d/2}/\Gamma(d/2+1)$, montrer qu'il est maximal vers $d\approx5.2$
   puis tend vers 0.
2. Pour des points uniformes dans $[0,1]^d$, montrer que la distance au
   $k$-ème voisin est $\approx (k/n)^{1/d}$ et qu'elle $\to1$ quand $d\to\infty$
   (à $n$ fixé).
3. Énoncer la **concentration des distances** : le ratio
   $\|X-X_{far}\|/\|X-X_{near}\|\to1$ en probabilité quand $d\to\infty$
   (pour l'uniforme du cube).
4. En déduire la conséquence pour k-NN : le voisinage ne discrimine plus, il
   faut un nombre exponentiel d'échantillons en $d$.
5. Indiquer les deux échappatoires conceptuels (réduction de dimension,
   sélection de variables) sans les développer (hors scope).

## Starting references

- Bellman, *Dynamic Programming* (1957) — origine du terme « curse of
  dimensionality ».
- Cover & Hart, « Nearest Neighbor Pattern Classification » (1967, IEEE Trans.
  IT).
- Devroye, Györfi, Lugosi, *A Probabilistic Theory of Pattern Recognition*
  (1996).
- Biau, *Machine Learning de A à Z* (2012) — traitement accessible du maudit.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `maudit-dimension-quantitatif.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `maudit-dimension-quantitatif.draft.md` — French content draft for an
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
