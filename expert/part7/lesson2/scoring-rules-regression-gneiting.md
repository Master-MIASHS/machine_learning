---
id: p7-l2-scoring-rules-regression-gneiting
type: panel
part: 7
lesson: /part7/lesson2
anchor: comparer-deux-predicteurs
title: "Évaluer une prédiction : scoring rules propres en régression"
level: m2
priority: 2
status: pending
related: [p6-l1-scoring-rules-propres, p7-l2-lp-loss-quantile-regression]
sources:
  - course_sources/typst/theorie.typ
---

# Évaluer une prédiction : scoring rules propres en régression

## Mission

La leçon compare les prédicteurs bayésiens (moyenne vs. médiane) par leur perte.
Ce panneau élargit l'évaluation au **score de la distribution prédictive
complète** : les scoring rules propres pour la régression (Gneiting 2011),
l'équivalence perte quadratique ↔ moyenne, et la **formule de Tweedie**. C'est
le cadre qui justifie de scorer une distribution (et pas seulement un point) —
le pont vers la calibration (Partie X) et les scoring rules (Partie VI).

## Course boundaries

- **Lesson:** `src/routes/part7/lesson2/+page.svelte`
- **Already taught (do not re-teach):** perte quadratique (moyenne), perte
  absolue (médiane), comparaison des deux prédicteurs.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` § « Cas de
  la régression » (Théorème 1.2). Le panneau ajoute le scoring de la
  distribution complète.
- **Where "beyond course" starts:** scoring rules propres en régression,
  caractérisation de Gneiting, Tweedie — « au-delà du cours ».
- **Out of scope:** les quantiles (panneau `p7-l2-lp-loss-quantile-regression`).

## Research questions

1. Définir une **scoring rule propre** pour une prédiction $F$ (distribution)
   et une réalisation $y$ ; citer les deux canoniques (Brier, log score).
2. Montrer la **caractérisation de Gneiting (2011)** : le Brier est la seule
   score propre quadratique (additive en densité), le log score la seule
   informationnelle — et que le Brier décompose en calibration + sharpness.
3. Relier : le prédicteur bayésien sous perte quadratique (moyenne, Th. 1.2) est
   l'argmin de l'espérance du Brier — pont direct avec la leçon.
4. Énoncer la **formule de Tweedie** $\mathbb E[X\mid s]=f(s)$ (lien score /
   moyenne conditionnelle) et son utilité (déduire la moyenne du score).
5. En une phrase, pourquoi scorer la **distribution** (calibration + acuité)
   est plus riche que scorer un point.

## Starting references

- Gneiting, « Making and Evaluating Point Forecasts » (2011, JASA).
- Gneiting & Raftery, « Strictly Proper Scoring Rules, Prediction, and
  Estimation » (2007, JASA).
- Tweedie, « The Theory of Indexing of Families of Distributions » (1947) —
  formule de Tweedie.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `scoring-rules-regression-gneiting.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `scoring-rules-regression-gneiting.draft.md` — French content draft for an
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
