---
id: p6-l2-couverture-conditionnelle-conformal
type: panel
part: 6
lesson: /part6/lesson2
anchor: garantie-couverture
title: "Couverture conditionnelle de la prédiction conformelle"
level: m2
priority: 2
status: pending
related: [p6-l3-conformal-shift-aci]
sources:
  - course_sources/typst/set_valued.typ
---

# Couverture conditionnelle de la prédiction conformelle

## Mission

La leçon établit la **garantie de couverture marginale** (Théorème 6.1 :
$\mathbb P(Y\in\hat C)\ge1-\alpha$). Ce panneau approfondit la question
subtile : la garantie est **marginale** (moyennée sur $X$), mais on voudrait
une **couverture conditionnelle** $\mathbb P(Y\in\hat C\mid X=x)\ge1-\alpha$
pour chaque $x$. Ce panneau montre que la couverture conditionnelle exacte est
en général **impossible à garantir**, propose des diagnostics et des
approches approchées.

## Course boundaries

- **Lesson:** `src/routes/part6/lesson2/+page.svelte`
- **Already taught (do not re-teach):** algorithme de prédiction conformelle,
  garantie de couverture (Th. 6.1), score de rang, prédicteur oracle et dual du
  Top-K, scores probabilistes, seuil quantile.
- **Ground truth to read first:** `course_sources/typst/set_valued.typ` §
  « Prédiction conformelle » (Théorème 6.1 « Garantie de couverture »). Le
  panneau affine marginal → conditionnel.
- **Where "beyond course" starts:** la couverture conditionnelle, les
  impossibilités, les diagnostics — « au-delà du cours ».
- **Out of scope:** la prédiction sous dérive (panneau
  `p6-l3-conformal-shift-aci`).

## Research questions

1. Distinguer **couverture marginale** ($\mathbb P(Y\in\hat C)\ge1-\alpha$) et
   **conditionnelle** ($\mathbb P(Y\in\hat C\mid X=x)\ge1-\alpha$) ; laquelle
   garantit le Th. 6.1 ?
2. Énoncer un **résultat d'impossibilité** : on ne peut pas garantir la
   couverture conditionnelle pour tout $x$ à partir de finis données (ex.
   Foygel et al. 2019 ; Vovk) — pourquoi.
3. Proposer des **diagnostics** de couverture conditionnelle (calibration
   locale, test par région).
4. Citer des approches approchées : conformal avec score local, conformal sous
  covariate shift (rattachement panneau `p6-l3-conformal-shift-aci`).
5. En une phrase, pourquoi la garantie marginale reste le résultat central
  (distribution-free) malgré ses limites.

## Starting references

- Vovk, Gammerman, Shafer, *Algorithmic Learning in a Random World* (2005).
- Lei, G'Sell, Raskutti, Tibshirani, « Distribution-Free Predictive Inference
  for Regression » (2018, Ann. Statist.).
- Foygel, Riquelme, Ryabko, « Quantile Regression Conformal Prediction » /
  conditional coverage (2019).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `couverture-conditionnelle-conformal.research.md` — verified claims only,
   each with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `couverture-conditionnelle-conformal.draft.md` — French content draft for an
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
