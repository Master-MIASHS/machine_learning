---
id: p4-l3-bootstrap-theorie
type: panel
part: 4
lesson: /part4/lesson3
anchor: lois-echantillonnage
title: "Le bootstrap : estimer la loi d'échantillonnage sans gaussienne"
level: m2
priority: 1
status: pending
related: [p4-lesson-bootstrap-theorie, p5-l1-bagging-oob-63-2, p4-l3-regression-lineaire-bayesienne]
sources:
  - course_sources/sophie/StatM1S1_2025.pdf
---

# Le bootstrap : estimer la loi d'échantillonnage sans gaussienne

## Mission

La leçon donne les **lois d'échantillonnage exactes** sous l'hypothèse
gaussienne (H3). Ce panneau présente le **bootstrap** (Efron 1979/1982) comme
alternative non paramétrique : resamplage avec remise pour approcher la loi
d'échantillonnage d'une statistique, sans supposer la gaussienne. C'est aussi
le pont direct vers le bagging (Partie V) et la leçon expert bootstrap.

## Course boundaries

- **Lesson:** `src/routes/part4/lesson3/+page.svelte`
- **Already taught (do not re-teach):** hypothèse gaussienne (H3),
  maximum de vraisemblance, lois d'échantillonnage, IC et test de Student, test
  $F$, prévisions, MCG.
- **Ground truth to read first:** `course_sources/sophie/StatM1S1_2025.pdf`
  (lois d'échantillonnage, Th. — $\hat\beta\sim\mathcal N$,
  $(n-p-1)\hat\sigma^2/\sigma^2\sim\chi^2$). Le bootstrap **remplace** ces lois
  exactes par un resamplage.
- **Where "beyond course" starts:** bootstrap (nonparamétrique, wild),
  consistance d'Efron/Bickel–Freedman, absents de `course_sources/` →
  « au-delà du cours ».
- **Out of scope:** le bagging comme classifieur (Partie V, leçon 1), la leçon
  expert bootstrap (version complète).

## Research questions

1. Algorithme du **bootstrap non paramétrique** : resamplage $(X_i^*,Y_i^*)$
   avec remise, réestimation $\hat\beta^*$, et approximation de la loi de
   $\hat\beta$.
2. Énoncer le **résultat de consistance** (Efron 1982 ; Bickel & Freedman
   1981) : la loi bootstrap $\to$ la loi d'échantillonnage vraie, sous
   conditions (fonctionnel lisse).
3. Distinguer **percentile** vs **studentized** bootstrap pour les IC.
4. Présenter le **wild bootstrap** (hétéroscédasticité) : resamplage des
   résidus pondérés.
5. Limite : fonctionnel non lisse (ex. la médiane) — le bootstrap peut échouer
   (taux de convergence différent).
6. Pont : le bootstrap et le bagging partagent le resamplage (renvoi Partie V)
   et le 63,2 % (panneau `p5-l1-bagging-oob-63-2`).

## Starting references

- Efron, « Bootstrap Methods: Another Look at the Jackknife » (1979, Ann.
  Statist.) ; Efron (1982, « The Jackknife, the Bootstrap and Other
  Resampling Plans », CBMS-NSF).
- Bickel & Freedman, « Some Asymptotic Theory for the Bootstrap » (1981,
  Ann. Statist.).
- Efron & Tibshirani, *An Introduction to the Bootstrap* (1993).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `bootstrap-theorie.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `bootstrap-theorie.draft.md` — French content draft for an `ExpertPanel`:
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
