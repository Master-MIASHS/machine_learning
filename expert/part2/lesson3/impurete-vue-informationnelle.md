---
id: p2-l3-impurete-vue-informationnelle
type: panel
part: 2
lesson: /part2/lesson3
anchor: criteres-impurete
title: "Critères d'impureté : vue informationnelle"
level: m2
priority: 2
status: pending
related: [p5-l2-rf-consistance-clt-honest]
sources:
  - course_sources/marine/Cours/CM/coursClassif-3ArbresDecision.tex
---

# Critères d'impureté : vue informationnelle

## Mission

La leçon présente les critères d'impureté (Gini, MSE, entropie) de façon
algorithmique. Ce panneau donne leur **interprétation informationnelle** :
l'impureté d'un nœud est la probabilité que deux points tirés au hasard dans le
nœud aient des étiquettes différentes (pour Gini), l'information de partage est
une réduction d'entropie, et le gain d'information est un gain d'information
mutuelle. Cela justifie *pourquoi* ces critères et pas d'autres.

## Course boundaries

- **Lesson:** `src/routes/part2/lesson3/+page.svelte`
- **Already taught (do not re-teach):** CART, binarisation, une variable par
  nœud, frontières orthogonales, agrégation aux feuilles, critères d'impureté
  (classification), critère MSE (régression), sélection d'arbre, limites.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  3ArbresDecision.tex`, section « Les arbres de décisions » (les critères y
  sont donnés). Le panneau les réinterprète.
- **Where "beyond course" starts:** l'interprétation probabiliste
  informationnelle (paires de points, entropie, information mutuelle), absente
  de `course_sources/` → « au-delà du cours ».
- **Out of scope:** Random Forest (Partie V, leçon 2), la théorie de la
  complexité des arbres.

## Research questions

1. Montrer que l'impureté de Gini $D(p)=1-\sum_i p_i^2$ est la probabilité que
   deux points tirés **avec remise** dans un nœud aient des étiquettes
   différentes.
2. Relier l'entropie $H(p)=-\sum_i p_i\log p_i$ à l'information mutuelle
   $I(Y;\text{feuille})$ et le « gain d'information » à une réduction
   d'entropie attendue.
3. Expliquer pourquoi minimiser l'impureté pondérée après un split équivaut à
   maximiser un critère de séparation (et écrire l'équivalence).
4. Comparer Gini / entropie / erreur de classification : à quoi diffèrent-ils
   exactement (et pourquoi le choix a peu d'impact — Breiman).
5. En une phrase, relier au critère MSE en régression (variance résiduelle =
   impureté continue).

## Starting references

- Breiman, Friedman, Olshen, Stone, *Classification and Regression Trees*
  (1984, CART).
- Quinlan, « Induction of Decision Trees » (1986, Machine Learning) —
  ID3/C4.5, gain d'information.
- Cover & Thomas, *Elements of Information Theory* (2006) — entropie, IM.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `impurete-vue-informationnelle.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `impurete-vue-informationnelle.draft.md` — French content draft for an
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
