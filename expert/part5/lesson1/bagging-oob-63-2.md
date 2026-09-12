---
id: p5-l1-bagging-oob-63-2
type: panel
part: 5
lesson: /part5/lesson1
anchor: bagging
title: "Pourquoi 63,2 % et pourquoi l'erreur OOB est (presque) non biaisée"
level: m2
priority: 2
status: pending
related: [p4-l3-bootstrap-theorie, p4-lesson-bootstrap-theorie]
sources:
  - course_sources/typst/regularization.typ
---

# Pourquoi 63,2 % et pourquoi l'erreur OOB est (presque) non biaisée

## Mission

La leçon présente le bagging et l'erreur OOB (out-of-bag) de façon
algorithmique. Ce panneau justifie les deux faits chocs : (1) chaque
sous-échantillon bootstrap contient en moyenne **63,2 %** des observations
($1-1/e$) ; (2) l'erreur OOB est un estimateur **presque non biaisé** de
l'erreur de généralisation, et la réduction de variance de l'agrégation
(Théorème 4.2 de la source) tient quand l'apprenant est **dominé par la
variance** (les arbres).

## Course boundaries

- **Lesson:** `src/routes/part5/lesson1/+page.svelte`
- **Already taught (do not re-teach):** approche naïve, BMA, bagging
  (Bootstrap Aggregating) — algorithme, OOB (Théorèmes 4.1–4.2 de la source).
- **Ground truth to read first:** `course_sources/typst/regularization.typ`,
  sections « Bagging » (Théorème 4.1 réduction de variance par agrégation,
  Théorème 4.2 réduction de variance par bagging). Le panneau justifie le 63,2
  % et l'innocuité de l'OOB (au-delà du théorème).
- **Where "beyond course" starts:** le calcul $1-(1-1/n)^n\to1-1/e$, la
  (presque) non-biaisance de l'OOB — « au-delà du cours ».
- **Out of scope:** la théorie du bootstrap complète (leçon expert
  `p4-lesson-bootstrap-theorie`), le Random Forest (leçon 2).

## Research questions

1. Montrer qu'une observation donnée entre dans un bootstrap de taille $n$ avec
   probabilité $1-(1-1/n)^n\to1-1/e\approx0.632$ ; en moyenne $0.632n$ points
   distincts, $0.368n$ points « out-of-bag ».
2. Montrer que l'erreur OOB est un estimateur **presque non biaisé** de
   l'erreur de test (chaque point est prédit par des arbres qui ne l'ont pas vu)
   ; discuter le léger biais (les OOB ne sont pas strictement i.i.d. du test).
3. Relier au **Théorème 4.2** (réduction de variance par bagging) : la
   condition « apprenant dominé par la variance » — pourquoi les arbres
   (instables) en bénéficient et les classifieurs stables non.
4. Comparer OOB vs. validation croisée : coût, et pourquoi l'OOB est « gratuit »
   avec le bootstrap.
5. En une phrase, pont vers le Random Forest : le RF ajoute le sous-ensemble de
   features (leçon 2).

## Starting references

- Breiman, « Bagging Predictors » (1996, Machine Learning).
- Efron (1979) — origine du resamplage.
- `course_sources/typst/regularization.typ` (Théorèmes 4.1, 4.2).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `bagging-oob-63-2.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `bagging-oob-63-2.draft.md` — French content draft for an `ExpertPanel`:
   French, M2/research level; every formula KaTeX-ready and `String.raw`-safe;
   narrative blocks; every beyond-course statement marked « au-delà du cours »;
   optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
