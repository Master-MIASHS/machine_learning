---
id: p1-l2-fenchel-legendre-dualite
type: panel
part: 1
lesson: /part1/lesson2
anchor: proprietes-conservation
title: "Dualité de Fenchel–Legendre"
level: m2
priority: 2
status: pending
related: [p1-lesson-methodes-proximales-fista-admm, p1-l1-kkt-dualite-lagrangienne]
sources:
  - course_sources/typst/optim.typ
---

# Dualité de Fenchel–Legendre

## Mission

La leçon étudie la conservation de la convexité par somme et composition
(Th. 2.1–2.5). Ce panneau introduit la **transformée de Fenchel–Legendre**
$f^\star(y)=\sup_x\langle y,x\rangle-f(x)$, la bidualité $f^{\star\star}=f$, et le
lien $\partial f^\star=(\partial f)^{-1}$. C'est l'outil unificateur de la
dualité convexe et des opérateurs proximaux (leçon expert proximale).

## Course boundaries

- **Lesson:** `src/routes/part1/lesson2/+page.svelte`
- **Already taught (do not re-teach):** somme de convexes (Th. 2.1), gradient et
  Hessienne d'une somme (Prop. 2.2–2.4), composition affine (Th. 2.5), exemples
  ML, non-convexité deep learning.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Fonctions d'optimisation en Machine Learning » — le panneau généralise
  l'additivité vers la dualité.
- **Where "beyond course" starts:** Fenchel–Legendre, bidualité, absents de
  `course_sources/` → « au-delà du cours ».
- **Out of scope:** l'opérateur proximal en lui-même (leçon expert proximale),
   la dualité lagrangienne KKT (panneau `p1-l1-kkt-dualite-lagrangienne`).

## Research questions

1. Définir $f^\star(y)=\sup_x(\langle y,x\rangle-f(x))$ ; montrer que $f^\star$
   est toujours convexe et semi-continue inférieurement.
2. Énoncer le théorème de bidualité : $f^{\star\star}=f$ si $f$ est convexe,
   semi-continue inférieurement et propre.
3. Calculer l'exemple quadratique : $f(x)=\tfrac12 x^\top A x$ ($A\succ 0$) $\Rightarrow
   f^\star(y)=\tfrac12 y^\top A^{-1}y$.
4. Énoncer la relation $\partial f^\star = (\partial f)^{-1}$ (et le cas
   $f$ strictement convexe : $\nabla f^\star=(\nabla f)^{-1}$).
5. Expliquer en une phrase pourquoi la dualité de Fenchel est l'échafaudage de
   toute la dualité convexe (et des proximaux).

## Starting references

- Rockafellar, *Convex Analysis* (1970), ch. 10 (Fenchel–Legendre).
- Boyd & Vandenberghe, *Convex Optimization* (2004), § 3.1.7.
- Hiriart-Urruty & Lemaréchal, *Convex Analysis and Minimization* I (2009),
  ch. 14.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `fenchel-legendre-dualite.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified against a primary
   source.
2. `fenchel-legendre-dualite.draft.md` — French content draft for an
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
