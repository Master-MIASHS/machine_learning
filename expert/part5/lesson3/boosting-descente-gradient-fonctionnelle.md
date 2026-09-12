---
id: p5-l3-boosting-descente-gradient-fonctionnelle
type: panel
part: 5
lesson: /part5/lesson3
anchor: gradient-boosting
title: "Boosting comme descente de gradient en espace fonctionnel"
level: m2
priority: 1
status: pending
related: [p5-l3-boosting-margins-weak-to-strong, p5-lesson-boosting-weak-to-strong]
sources:
  - course_sources/typst/regularization.typ
---

# Boosting comme descente de gradient en espace fonctionnel

## Mission

La leçon présente le Gradient Boosting (Friedman 2001) algorithmiquement. Ce
panneau donne la **vue rigoureuse** : le boosting est une **descente de
gradient dans l'espace des fonctions** — à chaque étape on ajuste un
apprenant de base au **pseudo-résidu** $-\partial L/\partial F$, et la
fonction additive $F_M=\sum_m\rho_m h_m$ descend une perte **différentiable
quelconque**. C'est la justification profonde du Gradient Boosting.

## Course boundaries

- **Lesson:** `src/routes/part5/lesson3/+page.svelte`
- **Already taught (do not re-teach):** introduction boosting, AdaBoost, perte
  exponentielle et margins, Gradient Boosting (Friedman 2001), XGBoost/
  LightGBM/CatBoost, comparaison.
- **Ground truth to read first:** `course_sources/typst/regularization.typ` §
  « Boosting » (Théorèmes 4.3–4.4) et « Méthodes modernes ». Le panneau
  re-formalise l'étape de Friedman en descente fonctionnelle.
- **Where "beyond course" starts:** la formulation « descente en espace
  fonctionnel » et la line search sur $\rho_m$ — « au-delà du cours ».
- **Out of scope:** la théorie des margins / weak-to-strong (panneau
  `p5-l3-boosting-margins-weak-to-strong` et leçon expert).

## Research questions

1. Poser le problème : minimiser $L(F)=\sum_i L(y_i,F(x_i))$ sur un espace de
   fonctions $\mathcal F$ (additif).
2. Montrer l'étape de **descente fonctionnelle** : à l'itération $m$,
   $h_m\approx\arg\min_h\sum_i L(y_i,F_{m-1}(x_i)+h(x_i))$ ; pour $L$
   différentiable, $h_m$ ajuste le pseudo-résidu
   $r_{mi}=-[\partial L(y_i,F(x_i))/\partial F(x_i)]_{F=F_{m-1}}$.
3. Montrer la **line search** sur le pas $\rho_m$ (minimisation 1D).
4. Relier : boosting quadratique = descente de gradient sur les résidus ;
   boosting logistique = sur les dérivées de la logistique ; AdaBoost = perte
   exponentielle (rattachement à la leçon).
5. En une phrase, pourquoi cette vue unifie tous les boosting (et les
   rapproche de la descente de gradient — Partie I).

## Starting references

- Friedman, « Greedy Function Approximation: A Gradient Boosting Machine »
  (2001, Ann. Statist.).
- `course_sources/typst/regularization.typ` (Théorèmes 4.3–4.4).
- Hastie, Tibshirani, Friedman, *The Elements of Statistical Learning* (2009),
  ch. 10.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `boosting-descente-gradient-fonctionnelle.research.md` — verified claims
   only, each with an exact citation. Flag **UNVERIFIED** anything not
   verified.
2. `boosting-descente-gradient-fonctionnelle.draft.md` — French content draft
   for an `ExpertPanel`: French, M2/research level; every formula KaTeX-ready
   and `String.raw`-safe; narrative blocks; every beyond-course statement
   marked « au-delà du cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
