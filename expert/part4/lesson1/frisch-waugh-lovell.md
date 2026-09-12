---
id: p4-l1-frisch-waugh-lovell
type: panel
part: 4
lesson: /part4/lesson1
anchor: ecriture-matricielle
title: "Lemme de Frisch–Waugh–Lovell et géométrie des coefficients partiels"
level: m2
priority: 2
status: pending
related: [p4-l4-robust-m-estimateurs-huber, p4-l1-ols-asymptotique-design-aleatoire]
sources:
  - course_sources/sophie/StatM1S1_2025.pdf
---

# Lemme de Frisch–Waugh–Lovell et géométrie des coefficients partiels

## Mission

La leçon enseigne l'OLS sous forme matricielle et géométrique (projection). Ce
panneau ajoute le **lemme de Frisch–Waugh–Lovell (FWL)** : le coefficient d'une
variable est le coefficient de la régression de $y$ sur le résidu de cette
variable après projection sur les autres régresseurs. C'est l'outil qui
explique les coefficients partiels, l'inflation de variance par colinéarité
(VIF), et les résidus partiels (leçon 4).

## Course boundaries

- **Lesson:** `src/routes/part4/lesson1/+page.svelte`
- **Already taught (do not re-teach):** modèle linéaire multiple, écriture
  matricielle et géométrie, estimateur OLS (Th. 1), résidus et $\hat\sigma^2$,
  sommes de carrés, $R^2$, exemple.
- **Ground truth to read first:** `course_sources/sophie/StatM1S1_2025.pdf`
  (Théorème 1 $\hat\beta=(X^\top X)^{-1}X^\top Y$, géométrie) et
  `course_sources/sophie/8.validation_du_modele_lineaire_2025.pdf` (VIF,
  colinéarité). Le lemme FWL relie les deux.
- **Where "beyond course" starts:** le lemme FWL lui-même est **au-delà** du
  développement des sources → « au-delà du cours ».
- **Out of scope:** le diagnostic complet (leçon 4), la théorie asymptotique
  (panneau `p4-l1-ols-asymptotique-design-aleatoire`).

## Research questions

1. Énoncer le lemme FWL : dans $Y=X_1\beta_1+X_2\beta_2+\varepsilon$,
   $\hat\beta_2$ est le coefficient de la régression de $M_1Y$ sur $M_1X_2$
   ($M_1=I-P_1$, projecteur orthogonal au sous-espace de $X_1$).
2. Donner la preuve par projection (deux lignes).
3. En déduire $\operatorname{Var}(\hat\beta_j)=\sigma^2/(\|x_j\|^2(1-R_j^2))$
   et le **VIF** $=1/(1-R_j^2)$ (lien avec la source validation).
4. Relier au **résidu partiel** (leçon 4) : le nuage partiel = régression
   $M_1Y$ sur $M_1X_2$.
5. En une phrase, FWL justifie pourquoi « contrôler pour $X_1$ » = projeter
   $X_1$ hors de $X_2$ et de $Y$.

## Starting references

- Frisch & Waugh (1933) ; Lovell, « Some tests of multivariate normality »
  (1963, Rev. Econ. Statist.) — énoncé moderne du lemme.
- Wooldridge, *Introductory Econometrics* (2020), § 3.3 (FWL).
- Hayashi, *Econometrics* (2000), ch. 4.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `frisch-waugh-lovell.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `frisch-waugh-lovell.draft.md` — French content draft for an `ExpertPanel`:
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
