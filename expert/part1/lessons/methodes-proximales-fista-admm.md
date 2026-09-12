---
id: p1-lesson-methodes-proximales-fista-admm
type: lesson
part: 1
lesson: /part1
anchor: null
title: "Méthodes proximales et premier ordre moderne (prox, FISTA, ADMM)"
level: m2
priority: 1
status: pending
related: [p1-l1-sous-gradient-optimisation-non-lisse, p1-l2-fenchel-legendre-dualite, p5-l4-lasso-oracle-irrepresentable]
sources:
  - course_sources/typst/optim.typ
  - course_sources/typst/regularization.typ
---

# Méthodes proximales et premier ordre moderne (prox, FISTA, ADMM)

## Mission

Leçon expert de **pont** entre l'optimisation (Partie I) et la régularisation
(Partie V). L'optimisation non lisse (Lasso, Elastic Net) ne se traite ni par
gradient (pas lisse) ni par Newton (pas lisse). La leçon enseigne l'opérateur
**proximal**, la **descente proximale**, **FISTA** (accélération) et **ADMM** —
les méthodes qui calculent concrètement un Lasso/Elastic Net, et qui font le
lien avec le sous-gradient (panneau P1/L1) et la dualité de Fenchel (panneau
P1/L2).

## Course boundaries

- **Anchored to:** Partie I — Optimisation (`src/routes/part1/`), avec une
  forte application en Partie V (leçon 4, Lasso/Ridge/Elastic Net).
- **Already taught (do not re-teach):** conditions d'optimalité, convexité,
  descente de gradient, SGD, Newton (Partie I) ; Lasso/Ridge/Elastic Net comme
  **modèles** (Partie V, leçon 4).
- **Ground truth to read first:** `course_sources/typst/optim.typ` (descente de
  gradient) et `course_sources/typst/regularization.typ` § « Régularisation L1
  (Lasso) » — la leçon donne les **algorithmes** qui calculent ces modèles.
- **Where "beyond course" starts:** prox, proximal gradient, FISTA, ADMM,
  absents des sources → « au-delà du cours », leçon marquée expert.
- **Out of scope:** la théorie statistique du Lasso (panneau
  `p5-l4-lasso-oracle-irrepresentable`), la dualité KKT complète (leçon
  `p1-lesson-dualite-convexe-kkt`).

## Research questions

1. Définir l'opérateur proximal $\operatorname{prox}_{\lambda f}(v)=
   \arg\min_x \tfrac{\lambda}{2}\|x-v\|^2+f(x)$ et le calculer pour
   $f=\|\cdot\|_1$ (soft-thresholding) et $f=\tfrac{\rho}{2}\|\cdot\|_2^2$.
2. Énoncer la descente proximale $x_{k+1}=\operatorname{prox}_{\alpha g}
   (x_k-\alpha\nabla f(x_k))$ pour $h=f+g$ (lisse + non lisse) et son taux
   $O(1/k)$.
3. Présenter **FISTA** (Beck & Teboulle 2009) : momentum + proximal, taux
   $O(1/k^2)$ (optimal).
4. Présenter **ADMM** (Boyd et al. 2011) : variables éclatées, multiplicateur,
   et application au Lasso.
5. Relier au sous-gradient et à Fenchel : pourquoi prox = argmin d'un problème
   quadratique régularisé, et $\operatorname{prox} = (I+\lambda\partial f)^{-1}$.
6. Donner le pseudo-code FISTA d'un Lasso binaire (exemple exécutable).

## Starting references

- Parikh & Boyd, « Proximal Algorithms » (2014, Found. Trends ML).
- Beck & Teboulle, « A Fast Iterative Shrinkage-Thresholding Algorithm for
  L1-regularized Problems » (2009, IEEE Trans. IP).
- Boyd, Parikh, Chu, Peleato, Eckstein, « Distributed Optimization and
  Statistical Learning via the Alternating Direction Method of Multipliers »
  (2011, Found. Trends ML).
- Combettes & Wajs, « Signal Recovery by Proximal Forward-Backward
  Splitting » (2005).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `methodes-proximales-fista-admm.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `methodes-proximales-fista-admm.draft.md` — French **full-lesson** draft:
   French, M2 level; structured like an expert lesson; every formula
   KaTeX-ready and `String.raw`-safe; narrative blocks; every statement marked
   « au-delà du cours »; "Proposed demos" subsection (ex. un animateur FISTA
   sur un Lasso 1D) + `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
