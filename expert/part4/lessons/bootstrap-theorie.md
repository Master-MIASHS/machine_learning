---
id: p4-lesson-bootstrap-theorie
type: lesson
part: 4
lesson: /part4
anchor: null
title: "Théorie du bootstrap"
level: m2
priority: 1
status: pending
related: [p4-l3-bootstrap-theorie, p5-l1-bagging-oob-63-2, p4-l3-regression-lineaire-bayesienne]
sources:
  - course_sources/sophie/StatM1S1_2025.pdf
  - course_sources/typst/regularization.typ
---

# Théorie du bootstrap

## Mission

Leçon expert à part entière qui théorise le bootstrap au-delà de la recette
« resamplage + réestimation » (panneau `p4-l3-bootstrap-theorie`). Consistance
(Efron, Bickel–Freedman), versions percentile/studentized, **wild bootstrap**
pour l'hétéroscédasticité, double bootstrap, limites (fonctionnels non lisses),
et le pont vers le bagging (Partie V). C'est le pont entre l'inférence
gaussienne exacte (Partie IV) et les méthodes ensemblistes (Partie V).

## Course boundaries

- **Anchored to:** Partie IV — Régression (`src/routes/part4/`), leçon 3
  (inférence gaussienne), avec pont vers la Partie V (bagging).
- **Already taught (do not re-teach):** lois d'échantillonnage gaussiennes
  (leçon 3), bagging comme algorithme (Partie V, leçon 1).
- **Ground truth to read first:** `course_sources/sophie/StatM1S1_2025.pdf`
  (lois d'échantillonnage) et `course_sources/typst/regularization.typ` §
  « Bagging » (Théorème 4.2). La **théorie** du bootstrap est au-delà.
- **Where "beyond course" starts:** consistance, wild/double bootstrap,
  limites — « au-delà du cours », leçon marquée expert.
- **Out of scope:** le bagging comme classifieur (Partie V), l'inférence
  bayésienne (panneau `p4-l3-regression-lineaire-bayesienne`).

## Research questions

1. Formaliser le bootstrap : loi empirique $\hat F_n$, échantillon bootstrap,
   statistique $\hat\theta^*$, et approximation de la loi de $\hat\theta$.
2. Énoncer et prouver (esquisse) la **consistance** (Efron 1982 ; Bickel &
   Freedman 1981) : $\sup_t|P^*(\hat\theta^*\le t)-P(\hat\theta\le t)|\xrightarrow{p}0$.
3. Comparer **percentile** vs **studentized** (et le « basic ») pour les IC ;
   quand le studentized est meilleur.
4. **Wild bootstrap** : resamplage des résidus pondérés, pour
   l'hétéroscédasticité ; le comparer au residual bootstrap.
5. **Double bootstrap** : correction du biais de l'IC bootstrap.
6. **Limites** : fonctionnel non lisse (médiane) — le bootstrap peut avoir un
   taux différent ; citer un contre-exemple.
7. Pont bagging : le resamplage est identique ; le 63,2 % et l'erreur OOB
   (rattachement `p5-l1-bagging-oob-63-2`).

## Starting references

- Efron (1979, 1982) ; Efron & Tibshirani, *An Introduction to the Bootstrap*
  (1993).
- Bickel & Freedman (1981) ; Bickel & Freedman, « Some Asymptotic Theory for
  the Bootstrap » (1981).
- Davison & Hinkley, *Bootstrap Methods and Their Application* (1997).
- Wu, « Jackknife, Bootstrap and Other Resampling Methods in Regression
  Analysis » (1986, wild bootstrap).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `bootstrap-theorie.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `bootstrap-theorie.draft.md` — French **full-lesson** draft: French, M2
   level; structured like an expert lesson; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; "Proposed demos" subsection (ex. bootstrap de l'IC de $\hat\beta$
   vs. gaussien) + `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
