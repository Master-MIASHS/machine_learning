---
id: p2-l2-biais-implicite-sgd-max-margin
type: panel
part: 2
lesson: /part2/lesson2
anchor: regression-logistique
title: "Biais implicite du SGD : vers la solution max-margin"
level: research
priority: 3
status: pending
related: [p2-l4-svm-dualite-kkt, p1-l4-sgd-regularisation-implicite]
sources:
  - course_sources/marine/Cours/CM/coursClassif-2RegLogistique.tex
---

# Biais implicite du SGD : vers la solution max-margin

## Mission

La leçon enseigne la régression logistique comme minimisation d'une perte
convexe. Ce panneau aborde un résultat de recherche majeur : quand les données
sont **séparables** (la perte peut aller à 0), la solution ne se stabilise pas
— sa norme diverge, mais sa **direction** converge vers la solution max-margin
de la SVM. C'est le « biais implicite » de la descente de gradient sur données
séparables, et un pont élégant vers la SVM (leçon 4).

## Course boundaries

- **Lesson:** `src/routes/part2/lesson2/+page.svelte`
- **Already taught (do not re-teach):** classifieur linéaire, régression
  logistique, sigmoïde, seuil $\alpha$, coût, AUC, multiclasse.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  2RegLogistique.tex`, section « Classifieurs Linéaires — La régression
  logistique ». Le panneau suppose la séparation (cas limite où la perte $\to0$).
- **Where "beyond course" starts:** le biais implicite / convergence
  max-margin, absent de `course_sources/` → « au-delà du cours ».
- **Out of scope:** la preuve SVM (panneau `p2-l4-svm-dualite-kkt`), la théorie
  NTK (leçon expert).

## Research questions

1. Montrer que si les données sont séparables, $\min_w \frac1n\sum\log(1+e^{-y_i
   w^\top x_i})=0$ et que tout minimiseur a $\|w\|\to\infty$ (la perte n'a pas
   de minimum atteint).
2. Énoncer le résultat de convergence **directionnelle** : sous SGD/gradient
   flow, $w_t/\|w_t\|\to w^{\star}_{\text{SVM}}$ (solution max-margin) — citer
   Soudry, Har-Peled, Shammah (2018) et/ou Nacson et al. (2019).
3. Distinguer gradient flow (continu) et SGD discret : le résultat tient-il
   dans les deux cas ?
4. Quel rôle joue l'initialisation (et la vitesse de convergence en
   $\log t$) ?
5. En une phrase, relier à la SVM : pourquoi « minimiser la logistique sur
   données séparables » retrouve « maximiser la marge ».

## Starting references

- Soudry, Har-Peled, Shammah, « Explicit convergence rate for interpolating
  logistic regression » (2018, ICML).
- Nacson, Har-Mon, Lin, « Gradient Descent Converges to Minimal Norm
  Solutions » (2019, JMLR).
- Ji & Telgarsky, « Directional and Degree Convergence for Separable
  Classification » (2019).
- Sutherland, et al., « Implicit Regularization in Matrix Factorization »
  (2019).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `biais-implicite-sgd-max-margin.research.md` — verified claims only, each
   with an exact citation. Distinguer **prouvé** / **heuristique** /
   **UNVERIFIED**.
2. `biais-implicite-sgd-max-margin.draft.md` — French content draft for an
   `ExpertPanel`: French, research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/claim checked against a primary source (not memory)
- [ ] Prouvé / heuristique / UNVERIFIED clairement distingués
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] French draft reads at research level
