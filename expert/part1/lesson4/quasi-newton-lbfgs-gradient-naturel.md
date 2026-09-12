---
id: p1-l4-quasi-newton-lbfgs-gradient-naturel
type: panel
part: 1
lesson: /part1/lesson4
anchor: newton
title: "Quasi-Newton (L-BFGS) et gradient naturel"
level: m2
priority: 2
status: pending
related: [p1-l3-adam-convergence-adam-adaptive-methods, p1-l2-conditionnement-taux-gd]
sources:
  - course_sources/typst/optim.typ
---

# Quasi-Newton (L-BFGS) et gradient naturel

## Mission

La leçon présente Newton exact (Th. 3.14, convergence quadratique) mais celui-ci
exige le Hessian, prohibitif en haute dimension. Ce panneau couvre les
**quasi-Newton** (BFGS, L-BFGS) qui approchent l'inverse du Hessian à partir de
différences de gradient, et le **gradient naturel** (préconditionnement par la
matrice de Fisher) — les deux principales réponses pratiques au coût de
Newton, et un pont vers la préconditionnement vu dans la leçon expert Adam.

## Course boundaries

- **Lesson:** `src/routes/part1/lesson4/+page.svelte`
- **Already taught (do not re-teach):** Newton-Raphson (Th. 3.14 convergence
  quadratique), SGD, coordinate descent, synthèse.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Méthode de Newton-Raphson ». Le panneau part du coût du Hessian identifié
  ici.
- **Where "beyond course" starts:** BFGS, L-BFGS, gradient naturel, absents de
  `course_sources/` → « au-delà du cours ».
- **Out of scope:** Adam (leçon expert), SAM (panneau
  `p1-l4-sgd-regularisation-implicite`).

## Research questions

1. Énoncer la **condition sécante** $B_k s_k=y_k$ et la mise à jour BFGS de
   $B_k$ (approximation de $\nabla^2 f$).
2. Présenter L-BFGS (Liu & Nocedal 1989) : mémoire $O(m)$, récursion à deux
   boucles, et pourquoi c'est la méthode de référence en optimisation non
  linéaire.
3. Définir le gradient naturel $\tilde\nabla = F^{-1}\nabla L$ (matrice de
   Fisher $F$) et son invariance au recodage des paramètres (Amari 1998).
4. Citer KFAC (Martens 2010/2020) comme approximation factorisée de $F$ en deep
   learning.
5. Relier à la préconditionnement : en quoi L-BFGS et gradient naturel font
   « comme » un pas adaptatif (lien avec la leçon Adam).

## Starting references

- Nocedal & Wright, *Numerical Optimization* (2006), ch. 6 (quasi-Newton).
- Liu & Nocedal, « On the limited memory BFGS method for large scale
  optimization » (1989, Math. Programming).
- Amari, « Natural Gradient Works Efficiently in Learning » (1998, NeurIPS).
- Martens, « Deep Learning via Hessian-Free Optimization » (2010, ICML) ;
  Martens & Grosse, « Optimizing Neural Networks with Crank-Nicolson
  Natural Gradient » / KFAC (2015).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `quasi-newton-lbfgs-gradient-naturel.research.md` — verified claims only,
   each with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `quasi-newton-lbfgs-gradient-naturel.draft.md` — French content draft for an
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
