---
id: p1-l1-kkt-dualite-lagrangienne
type: panel
part: 1
lesson: /part1/lesson1
anchor: conditions-suffisantes
title: "Conditions KKT et dualité lagrangienne"
level: m2
priority: 1
status: pending
related: [p1-lesson-dualite-convexe-kkt, p2-l4-svm-dualite-kkt]
sources:
  - course_sources/typst/optim.typ
---

# Conditions KKT et dualité lagrangienne

## Mission

La leçon traite uniquement de l'optimisation **sans contraintes** (gradient nul,
Hessienne PSD, convexité, coercivité). Ce panneau comble le fossé vers
l'optimisation **contrainte** : la fonction lagrangienne, la dualité faible/forte
et les conditions de Karush–Kuhn–Tucker (KKT). C'est la clé de voûte qui rend
compréhensible la SVM (Partie II, leçon 4) et la régularisation L1 (Partie V),
où les contraintes/la norme entrent en jeu.

## Course boundaries

- **Lesson:** `src/routes/part1/lesson1/+page.svelte`
- **Already taught (do not re-teach):** définitions, conditions nécessaires
  (Th. 1.3), conditions suffisantes (Th. 1.4–1.7), convexité et minimum global,
  contre-exemples, coercivité (Th. 1.12), hiérarchie des conditions.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Conditions d'existence d'un minimum » — le panneau s'appuie sur ces
  conditions **sans contraintes** pour montrer pourquoi elles sont insuffisantes
  dès qu'une contrainte apparaît.
- **Where "beyond course" starts:** toute la dualité lagrangienne et les
  conditions KKT sont **absentes** de `course_sources/` → à marquer « au-delà du
  cours ».
- **Out of scope:** la dualité complète de la SVM (voir
  `p2-l4-svm-dualite-kkt`), le cours entier de dualité (voir
  `p1-lesson-dualite-convexe-kkt`).

## Research questions

1. Définir la fonction lagrangienne $L(x,\lambda)$ et la fonction duale
   $g(\lambda)=\inf_x L(x,\lambda)$ pour un problème convexe avec contraintes
   d'inégalité.
2. Démontrer (esquisse) la dualité faible : pour tout $x$ admissible et
   $\lambda\ge 0$, $g(\lambda)\le p^\star$ (la valeur duale majorée par la
   valeur primale).
3. Énoncer les conditions KKT et préciser sous quelle qualification des
   contraintes (Slater) elles deviennent nécessaires **et** suffisantes pour un
   problème convexe.
4. Donner un exemple non convexe où un point satisfait KKT sans être un optimum
   global (pour montrer la limite des KKT hors convexité).
5. Expliquer en une phrase pourquoi la dualité transforme un problème contraint
   en un problème sans contrainte en les $\lambda$ (le pont vers SVM/Lasso).

## Starting references

- Boyd & Vandenberghe, *Convex Optimization* (2004), ch. 5 (dualité) et ch. 9
  (KKT).
- Nocedal & Wright, *Numerical Optimization* (2nd ed., 2006), ch. 12 (KKT).
- Vapnik, *Statistical Learning Theory* (1998) — application SVM.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `kkt-dualite-lagrangienne.research.md` — verified claims only. Every theorem,
   formula, result or historical fact carries an exact citation (author, year,
   venue, theorem/section number, URL where available). Anything you could not
   verify against a primary source is flagged **UNVERIFIED**. No restatement
   from memory.
2. `kkt-dualite-lagrangienne.draft.md` — the French content draft, ready to
   become an `ExpertPanel`. Requirements:
   - Written in French, master's/research level.
   - Every formula KaTeX-ready and safe inside `String.raw` backticks.
   - Structured with the project's narrative blocks (`TheoremBlock`,
     `DefinitionBlock`, `KatexInline`, `KatexBlock`, `ExampleBlock`).
   - Every statement beyond `course_sources/` visibly marked « au-delà du
     cours ».
   - Optional "Proposed demo" subsection: widget name + the `src/lib/math`
     module + the function(s) it would need.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
