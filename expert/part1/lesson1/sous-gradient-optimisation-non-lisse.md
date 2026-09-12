---
id: p1-l1-sous-gradient-optimisation-non-lisse
type: panel
part: 1
lesson: /part1/lesson1
anchor: conditions-necessaires
title: "Sous-gradient et optimisation non lisse"
level: m2
priority: 2
status: pending
related: [p1-lesson-methodes-proximales-fista-admm, p5-l4-lasso-oracle-irrepresentable]
sources:
  - course_sources/typst/optim.typ
---

# Sous-gradient et optimisation non lisse

## Mission

Toute la leçon suppose la différentiabilité ($\nabla f=0$). Ce panneau introduit
l'objet fondamental de l'optimisation **non lisse** (norme L1, charnière) : le
sous-gradient et le sous-différentiel, et le critère d'optimalité
$0\in\partial f(x^\star)$. C'est le prérequis conceptuel de la régularisation
Lasso (Partie V) et des méthodes proximales (leçon expert).

## Course boundaries

- **Lesson:** `src/routes/part1/lesson1/+page.svelte`
- **Already taught (do not re-teach):** gradient, Hessienne, CNO (Th. 1.3),
  CNSO/CSSO (Th. 1.4–1.5), convexité (Th. 1.7) — tous pour fonctions
  différentiables.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Conditions d'existence d'un minimum » (Th. 1.3–1.7). Le panneau montre que
  la CNO $\nabla f=0$ n'a pas d'équivalent direct dès que $f$ n'est pas lisse.
- **Where "beyond course" starts:** sous-gradient / sous-différentiel, absents
  de `course_sources/` → « au-delà du cours ».
- **Out of scope:** les algorithmes proximaux (leçon expert
  `p1-lesson-methodes-proximales-fista-admm`), la théorie du Lasso (Partie V).

## Research questions

1. Définir un sous-gradient $g$ de $f$ en $x$ : $f(y)\ge f(x)+g^\top(y-x)\;\forall
   y$. Montrer que $\partial f(x)$ est convexe et non vide si $f$ est convexe.
2. Énoncer le critère d'optimalité : $x^\star$ est minimal $\iff 0\in
   \partial f(x^\star)$ (cas convexe).
3. Calculer $\partial |x|$ et $\partial\|x\|_1$ composante à composante ;
   montrer que $0\in\partial|0|$ (d'où la solution nulle du Lasso).
4. Propriété du sous-différentiel d'une somme : $\partial(f+g)=\partial f+\partial
   g$ (sous conditions).
5. En une phrase, relier à la régularisation L1 : pourquoi le Lasso produit de la
   parcimonie via $0\in\partial\|w\|_1$.

## Starting references

- Rockafellar, *Convex Analysis* (1970), ch. 25 (subdifferentiation).
- Boyd & Vandenberghe, *Convex Optimization* (2004), § 3.2 (sous-gradient).
- Tibshirani, *The Lasso Method* (2013) — application L1.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `sous-gradient-optimisation-non-lisse.research.md` — verified claims only,
   each with an exact citation (author, year, venue, theorem/section number, URL
   where available). Flag **UNVERIFIED** anything not verified against a primary
   source.
2. `sous-gradient-optimisation-non-lisse.draft.md` — French content draft for an
   `ExpertPanel`: French, M2/research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks (`TheoremBlock`, `DefinitionBlock`,
   `KatexInline`, `KatexBlock`, `ExampleBlock`); every beyond-course statement
   marked « au-delà du cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
