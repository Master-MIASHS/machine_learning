---
id: p4-l5-cv-inegalite-oracle
type: panel
part: 4
lesson: /part4/lesson5
anchor: criteres-comparaison
title: "Validation croisée : inégalité oracle de Yang–Barron"
level: m2
priority: 2
status: pending
related: [p4-l5-bic-aic-cv, p4-l4-robust-m-estimateurs-huber]
sources:
  - course_sources/sophie/9.choix_de_modele.pdf
---

# Validation croisée : inégalité oracle de Yang–Barron

## Mission

La leçon présente AIC/BIC/PRESS/Cp comme **critères** de comparaison de modèles
sans justification théorique profonde. Ce panneau fournit la garantie :
l'**inégalité oracle** de la validation croisée (Yang & Barron 1995/1996) — le
risque du modèle sélectionné par CV est, à un terme $O(1/n)$ près, aussi bon
que le meilleur modèle de la classe. C'est la raison pour laquelle la CV
« marche ».

## Course boundaries

- **Lesson:** `src/routes/part4/lesson5/+page.svelte`
- **Already taught (do not re-teach):** trois objectifs de modélisation,
  compromis biais/variance, critères (PRESS, Cp, AIC, BIC), algorithmes de
  sélection de sous-ensembles (best-subset, pas à pas), exemple prostate.
- **Ground truth to read first:** `course_sources/sophie/9.choix_de_modele.pdf`
  (formules de PRESS, Cp, AIC, BIC). Le panneau ajoute la **garantie** de la CV.
- **Where "beyond course" starts:** l'inégalité oracle et sa preuve, absentes
  de `course_sources/` → « au-delà du cours ».
- **Out of scope:** la comparaison AIC vs BIC (panneau
  `p4-l5-bic-aic-cv`), le Lasso (Partie V).

## Research questions

1. Définir le risque CV $\hat R_{\text{CV}}(\lambda)=\frac1n\sum_i
   L(Y_i,\hat f_{(-i)}(X_i))$ (leave-one-out).
2. Énoncer l'**inégalité oracle** (Yang & Barron 1995/1996) :
   $\mathbb E[\hat R_{\text{CV}}(\hat\lambda)]\le\min_\lambda
   R(\lambda)+O(\text{complexité}/n)$.
3. Montrer l'équivalence **LOOCV $\approx$ AIC** pour les modèles linéaires
   (formule en somme des carrés).
4. Comparer leave-one-out vs $k$-fold vs leave-out : coût et variance de
   l'estimateur.
5. En une phrase : pourquoi la CV est une procédure « quasi-oracle » (et ses
   limites — optimisme, coût).

## Starting references

- Yang & Barron, « Decision-Theoretic Normalization » (1995, JASA) ;
  « A Decision-Theoretic Generalization of On-Line Learning » (1996, Ann.
  Statist.).
- Arlot & Celisse, « A Survey of Cross-Validation Procedures for Model
  Selection » (2010, Statist. Surveys).
- Efron, « Estimating the Error Rate of a Prediction Rule » (1983, JASA).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `cv-inegalite-oracle.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `cv-inegalite-oracle.draft.md` — French content draft for an `ExpertPanel`:
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
