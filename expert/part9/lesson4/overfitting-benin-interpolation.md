---
id: p9-l4-overfitting-benin-interpolation
type: panel
part: 9
lesson: /part9/lesson4
anchor: double-descente
title: "Overfitting bénin et interpolation"
level: research
priority: 3
status: pending
related: [p9-lesson-ntk-generalisation-moderne, p5-l4-lasso-bic-equivalence]
sources:
  - course_sources/typst/theorie.typ
---

# Overfitting bénin et interpolation

## Mission

La leçon présente la **double descente** (paradoxe : le risque redescend au-delà
du seuil d'interpolation $n<d$) et les bornes de Bartlett–Foster–Telgarsky. Ce
panneau traite le phénomène d'**« overfitting bénin »** : dans le régime
d'interpolation, l'interpolant de **norme minimale** (moindres carrés) peut
tout de même **bien généraliser** — sous certaines conditions sur le signal.
C'est un résultat précis (et contre-intuitif) de la frontière de recherche.

## Course boundaries

- **Lesson:** `src/routes/part9/lesson4/+page.svelte`
- **Already taught (do not re-teach):** dimension VC des réseaux, paradoxe de la
  double descente, pourquoi les réseaux généralisent (Th. Bartlett 1998,
  Bartlett–Foster–Telgarsky 2017).
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Limites de la théorie VC pour les réseaux de neurones » (double descente).
  Le panneau approfondit le régime d'interpolation.
- **Where "beyond course" starts:** l'interpolation de norme minimale,
  l'« overfitting bénin » — « au-delà du cours ».
- **Out of scope:** la théorie NTK (leçon expert
  `p9-lesson-ntk-generalisation-moderne`).

## Research questions

1. Définir le **seuil d'interpolation** ($n<d$ : il existe $w$ avec
   $\|Xw-y\|=0$) et la **solution de norme minimale** (rattachement au panneau
  Moore-Penrose, Partie I).
2. Énoncer le **risque de test** du moindres carrés de norme minimale sous
  design gaussien (courbe en double descente, Hastie et al. 2019).
3. Définir l'**« overfitting bénin »** (Dong & Zhang 2017 ; Hastie et al. 2019) :
   l'interpolant généralise bien quand le signal est favorable (même en $n<d$).
4. Montrer pourquoi la **norme minimale** est spéciale (vs. les autres
   interpolants) — lien avec la régularisation Ridge $\lambda\to0$ (panneau
   `p5-l4-lasso-bic-equivalence` / Ridge).
5. Distinguer **prouvé** / **empirique** sur le phénomène (sujet de recherche).

## Starting references

- Hastie, Montanari, Rosset, Tibshirani, « Surprises in High-Dimensional Ridge
  Behavior » (2019, Ann. Statist.) ; « The Elements of Statistical Learning »
  (2009/2017) — double descente.
- Dong & Zhang, « Interpolation, Overfitting and Generalization in Random
  Features Regression » (2017).
- Belhadj? — voir aussi Bartlett, Long, et al. (2020) « Regret Bounds for
  overparameterized regression ».

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `overfitting-benin-interpolation.research.md` — verified claims only, each
   with an exact citation. Distinguer **prouvé** / **empirique** /
   **UNVERIFIED**.
2. `overfitting-benin-interpolation.draft.md` — French content draft for an
   `ExpertPanel`: French, research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/claim checked against a primary source (not memory)
- [ ] Prouvé / empirique / UNVERIFIED clairement distingués
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] French draft reads at research level
