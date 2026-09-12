---
id: p6-l1-scoring-rules-propres
type: panel
part: 6
lesson: /part6/lesson1
anchor: calibration-confiance
title: "Scoring rules propres : Brier, log score, et calibration"
level: m2
priority: 2
status: pending
related: [p7-l2-scoring-rules-regression-gneiting, p10-l2-margin-condition-taux-calibration]
sources:
  - course_sources/typst/set_valued.typ
---

# Scoring rules propres : Brier, log score, et calibration

## Mission

La leçon présente l'ECE (Expected Calibration Error) comme mesure de
calibration. Ce panneau place l'ECE dans le cadre général des **scoring rules
propres** : une règle de score $S(F,y)$ est *propre* si l'espérance du score
est minimisée par la vraie distribution $F$. Le **Brier** et le **log score**
sont les deux scores propres canoniques ; la calibration est exactement la
condition qui rend un prédicteur optimal pour un score propre. C'est le socle
théorique de la calibration (Partie X).

## Course boundaries

- **Lesson:** `src/routes/part6/lesson1/+page.svelte`
- **Already taught (do not re-teach):** risque Top-K bayésien, choix adaptatif
  de $K$, calibration de la confiance (ECE — panneau existant), synthèse.
- **Ground truth to read first:** `course_sources/typst/set_valued.typ` §
  « Calibration de la confiance » (ECE y est introduit). Le panneau généralise
  ECE vers les scoring rules propres.
- **Where "beyond course" starts:** la notion de scoring rule propre, Brier/log,
  le lien calibration↔score propre — « au-delà du cours ».
- **Out of scope:** la calibration des pertes convexes (Partie X, leçon 2).

## Research questions

1. Définir une **scoring rule** $S(F,y)$ et la **propreté** :
   $\mathbb E_F[S(F,Y)]\le\mathbb E_F[S(G,Y)]\ \forall G$ (égalité ssi $G=F$).
2. Montrer que le **Brier** $S(F,y)=\sum_k(F_k-y_k)^2$ et le **log score**
   $S(F,y)=-\log F_y$ sont propres (et strictes).
3. Montrer que l'**ECE** est une version discrète (bins) d'une mesure de
   calibration, et que la calibration est la condition d'optimalité pour les
   scores propres.
4. Relier : un prédicteur calibré maximise l'espérance de tout score propre
   (à distribution marginale fixée) — citer Gneiting & Raftery (2007).
5. En une phrase, pont vers la calibration des pertes convexes (Partie X).

## Starting references

- Gneiting & Raftery, « Strictly Proper Scoring Rules, Prediction, and
  Estimation » (2007, JASA).
- Winkler, « A Definition of Calibration » (1996, EJS).
- `course_sources/typst/set_valued.typ` § calibration de la confiance (ECE).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `scoring-rules-propres.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `scoring-rules-propres.draft.md` — French content draft for an
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
