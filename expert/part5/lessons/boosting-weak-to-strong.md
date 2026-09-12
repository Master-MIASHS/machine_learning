---
id: p5-lesson-boosting-weak-to-strong
type: lesson
part: 5
lesson: /part5
anchor: null
title: "Boosting : de l'apprenant faible à l'apprenant fort"
level: m2
priority: 2
status: pending
related: [p5-l3-boosting-margins-weak-to-strong, p5-l3-boosting-descente-gradient-fonctionnelle]
sources:
  - course_sources/typst/regularization.typ
---

# Boosting : de l'apprenant faible à l'apprenant fort

## Mission

Leçon expert à part entière qui théorise le boosting de bout en bout : le
**théorème weak-to-strong** (Schapire 1990), le **structural risk
minimization** par marges (Vapnik), la **borne exponentielle** d'AdaBoost
(Théorème 4.4 de la source) comme borne de marge, et la lecture en **descente
de gradient fonctionnelle** (Friedman). C'est la leçon qui justifie
profondément le boosting au-delà de la recette.

## Course boundaries

- **Anchored to:** Partie V — Régularisation (`src/routes/part5/`), leçon 3
  (Boosting).
- **Already taught (do not re-teach):** AdaBoost, perte exponentielle et
  margins, Gradient Boosting, XGBoost/LightGBM/CatBoost, comparaison.
- **Ground truth to read first:** `course_sources/typst/regularization.typ` §
  « Boosting » (Théorèmes 4.3–4.4) et « Méthodes modernes ». La théorie
  weak-to-strong / structural risk est au-delà.
- **Where "beyond course" starts:** Schapire (1990), Vapnik (1998) structural
  risk, et l'unification — « au-delà du cours », leçon marquée expert.
- **Out of scope:** les algorithmes modernes (XGBoost — déjà traité), la
  théorie des forêts (leçon 2).

## Research questions

1. Énoncer le **théorème weak-to-strong** (Schapire 1990) et sa preuve par
  l'absurde (si pas de strong learner, le weak learner ne peut pas exister).
2. Définir les **margins** et la **distribution des margins** ; énoncer le
   **structural risk minimization** (Vapnik 1998) : risque majoré par
   complexité/marge.
3. Relier à **AdaBoost** : la borne d'erreur (Théorème 4.4) est une borne sur
   la marge ; AdaBoost maximise la marge minimale (et la borne
   d'entraînement, Th. 4.3).
4. Donner la vue **descente fonctionnelle** (Friedman) et montrer qu'AdaBoost,
   Gradient Boosting, et les boosting modernes en sont des cas (perte
   exponentielle, quadratique, logistique).
5. Discuter les limites : overfitting du boosting, sensibilité au bruit, et
   pourquoi le Gradient Boosting régularise (shrinkage $\rho_m$).

## Starting references

- Schapire, « The Strength of Weak Learnability » (1990, Machine Learning).
- Freund & Schapire, « A Decision-Theoretic Generalization of On-Line Learning
  and an Application to Boosting » (1997, EuroCOLT).
- Vapnik, *Statistical Learning Theory* (1998), ch. 12.
- Friedman, « Greedy Function Approximation: A Gradient Boosting Machine »
  (2001, Ann. Statist.).
- `course_sources/typst/regularization.typ` (Théorèmes 4.3–4.4).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `boosting-weak-to-strong.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `boosting-weak-to-strong.draft.md` — French **full-lesson** draft: French,
   M2 level; structured like an expert lesson; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; "Proposed demos" subsection (ex. AdaBoost margins) + `src/lib/math`
   module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
