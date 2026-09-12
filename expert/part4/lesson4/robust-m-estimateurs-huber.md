---
id: p4-l4-robust-m-estimateurs-huber
type: panel
part: 4
lesson: /part4/lesson4
anchor: observations-influantes
title: "Robustesse : M-estimateurs, Huber et point de rupture"
level: m2
priority: 2
status: pending
related: [p4-l1-frisch-waugh-lovell, p4-l5-cv-inegalite-oracle]
sources:
  - course_sources/sophie/8.validation_du_modele_lineaire_2025.pdf
---

# Robustesse : M-estimateurs, Huber et point de rupture

## Mission

La leçon diagnostique les observations influentes (leviers, distance de Cook)
mais l'OLS reste **non robuste** : un seul outlier peut fausser
l'estimateur. Ce panneau introduit les **M-estimateurs** robustes (Huber) et
les notions de **point de rupture** (breakdown point) et de **fonction
d'influence** — les outils pour quantifier et corriger la non-robustesse de
l'OLS.

## Course boundaries

- **Lesson:** `src/routes/part4/lesson4/+page.svelte`
- **Already taught (do not re-teach):** rang de $X$ et colinéarité, effets de la
  colinéarité (VIF), graphes des résidus, résidus partiels et Q-Q, observations
  influentes (leviers, Cook).
- **Ground truth to read first:**
  `course_sources/sophie/8.validation_du_modele_lineaire_2025.pdf` (leviers,
  Cook, outliers). Le panneau répond à la question « et si on change
  d'estimateur ? ».
- **Where "beyond course" starts:** M-estimateurs, Huber, breakdown point,
  fonction d'influence, absents de `course_sources/` → « au-delà du cours ».
- **Out of scope:** la théorie high-dimension du Lasso (panneau
  `p5-l4-lasso-oracle-irrepresentable`).

## Research questions

1. Définir un **M-estimateur** $\hat\beta=\arg\min\sum_i\rho(r_i/\sigma)$ et
   son **$\psi$-fonction** $\psi=\rho'$.
2. Montrer que l'OLS est le M-estimateur avec $\rho(u)=u^2$ (donc non robuste).
3. Présenter **Huber** : $\rho$ quadratique pour $|u|\le\kappa$, linéaire sinon ;
   montrer que $\psi$ est borné (donc l'influence d'un outlier est bornée).
4. Définir le **breakdown point** $\varepsilon^*$ ; montrer
   $\varepsilon^*(\text{OLS})=0$ et $\varepsilon^*(\text{Huber})>0$ (et
   $\varepsilon^*(\text{LMS})=50\%$).
5. Définir la **fonction d'influence** $IF(z)$ et son rôle (sensibilité locale)
   ; relier à Cook/leviers (leçon 4).

## Starting references

- Huber, « Robust Estimation of a Location Parameter » (1964, Ann. Math.
  Statist.) ; Huber, *Robust Statistics* (1981, Wiley).
- Rousseeuw & Leroy, *Robust Regression and Outlier Detection* (1987).
- Hampel, Ronchetti, Rousseeuw, Stahel, *Robust Statistics: The Approach Based
  on Influence Functions* (1986).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `robust-m-estimateurs-huber.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `robust-m-estimateurs-huber.draft.md` — French content draft for an
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
