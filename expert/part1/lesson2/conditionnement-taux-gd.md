---
id: p1-l2-conditionnement-taux-gd
type: panel
part: 1
lesson: /part1/lesson2
anchor: exemples-ml
title: "Nombre de conditionnement et taux de convergence de la descente de gradient"
level: m2
priority: 2
status: pending
related: [p1-l3-bornes-minimax-convexe, p1-l3-adam-convergence-adam-adaptive-methods]
sources:
  - course_sources/typst/optim.typ
---

# Nombre de conditionnement et taux de convergence de la descente de gradient

## Mission

La leçon possède un demo `HessianConditionNumber` mais ne formalise pas le lien
quantitatif entre le nombre de conditionnement et la vitesse de convergence de la
descente de gradient. Ce panneau établit le taux $(1-\mu/L)^k$ pour une fonction
$\mu$-fortement convexe et $L$-lisse, et montre pourquoi le conditionnement
anisotrope motive les pas adaptatifs (lien vers la leçon expert Adam).

## Course boundaries

- **Lesson:** `src/routes/part1/lesson2/+page.svelte`
- **Already taught (do not re-teach):** propriétés de conservation, exemples ML
  (moindres carrés, Ridge), non-convexité, synthèse — **et** la descente de
  gradient (Partie I, leçon 3, Th. 3.4 « Convergence, cas convexe »).
- **Ground truth to read first:** `course_sources/typst/optim.typ`, sections
  « Fonctions d'optimisation en ML » et « Descente de gradient classique »
  (Th. 3.4). Le panneau affine Th. 3.4 avec le taux explicite en $\kappa=L/\mu$.
- **Where "beyond course" starts:** le taux explicite $(1-\mu/L)^k$ et son
  interprétation en $\kappa$ ne sont pas déduits dans `course_sources/` →
  « au-delà du cours ».
- **Out of scope:** la théorie complète de Nesterov (panneau
  `p1-l3-nesterov-preuve-ode`), Adam (leçon expert).

## Research questions

1. Pour $f$ $\mu$-fortement convexe et $L$-lisse, avec pas $1/L$, établir
   $f(w_k)-f^\star\le(1-\mu/L)^k\,(f(w_0)-f^\star)$.
2. Démontrer l'étape clé (lemme de descente) :
   $f(w_{k+1})\le f(w_k)-\tfrac{1}{2L}\|\nabla f(w_k)\|^2$.
3. Montrer que le taux dépend de $\kappa=L/\mu$ et que $\kappa\to\infty$ fait
   diverger le nombre d'itérations.
4. Donner l'exemple quadratique $f(x)=\tfrac12 x^\top A x$ et relier $\mu,\,L$
   aux valeurs propres extrêmes de $A$.
5. Expliquer en une phrase pourquoi un préconditionnement (ou des pas adaptatifs
   à la manière d'Adam) contourne la pénalité de $\kappa$.

## Starting references

- Nesterov, *Introductory Lectures on Convex Optimization* (2018), ch. 1–2.
- Nocedal & Wright, *Numerical Optimization* (2006), § 3.2, 10.1.
- `course_sources/typst/optim.typ` Th. 3.4 (convergence convexe).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `conditionnement-taux-gd.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `conditionnement-taux-gd.draft.md` — French content draft for an
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
