---
id: p1-lesson-dualite-convexe-kkt
type: lesson
part: 1
lesson: /part1
anchor: null
title: "Dualité convexe et conditions KKT"
level: m2
priority: 1
status: pending
related: [p1-l1-kkt-dualite-lagrangienne, p2-l4-svm-dualite-kkt, p5-l4-lasso-oracle-irrepresentable]
sources:
  - course_sources/typst/optim.typ
---

# Dualité convexe et conditions KKT

## Mission

Leçon expert à part entière (comme `lesson3-adam`) : la **dualité convexe**
complète. Fonction lagrangienne, problème duale, dualité faible/forte,
qualification de Slater, conditions KKT, et un fil conducteur applicatif — la
dualité de la SVM (Partie II) et du Lasso (Partie V). C'est la leçon qui rend
cohérente une grande partie du reste du cours (SVM, régularisation, sélection
de variables).

## Course boundaries

- **Anchored to:** Partie I — Optimisation (`src/routes/part1/`), en
  complément des leçons 1 (minimum) et 2 (convexité).
- **Already taught (do not re-teach):** conditions d'optimalité sans
  contraintes, convexité, descente de gradient (leçons 1–4 de la partie).
- **Ground truth to read first:** `course_sources/typst/optim.typ` (toutes les
  sections) — la leçon s'appuie sur la convexité enseignée (Th. 1.7, 2.1, 2.5)
  et reste **entièrement au-delà** de ces sources pour la dualité.
- **Where "beyond course" starts:** tout (la dualité n'est dans aucune
  `course_sources/`) → leçon marquée expert, « au-delà du cours ».
- **Out of scope:** la preuve détaillée de la SVM (panneau
  `p2-l4-svm-dualite-kkt`), les algorithmes duaux (primal-dual).

## Research questions

1. Construire pas à pas : primale contrainte $\to$ lagrangienne $\to$ fonction
   duale $\to$ problème duale ; prouver la dualité faible.
2. Énoncer et prouver (esquisse) la **dualité forte** sous Slater pour un
   problème convexe.
3. Énoncer les **conditions KKT** (stationnarité, faisabilité,
   complémentarité, dualité) et montrer leur nécessité + suffisance (convexe,
   Slater).
4. Fil conducteur A : écrire la dualité de la SVM à marge rigide et identifier
   les vecteurs support via la complémentarité (renvoi au panneau P2/L4).
5. Fil conducteur B : écrire le lagrangien du Lasso et montrer pourquoi la
   dualité y est moins exploitable (contrainte de norme non lisse) — lien avec
   le sous-gradient (panneau `p1-l1-sous-gradient-optimisation-non-lisse`).
6. Donner un exemple de **gap de dualité** strict (problème non convexe ou sans
   Slater).

## Starting references

- Boyd & Vandenberghe, *Convex Optimization* (2004), ch. 5 (dualité), ch. 9
  (KKT), ch. 7 (exemples SVM).
- Nocedal & Wright, *Numerical Optimization* (2006), ch. 12.
- Vapnik, *Statistical Learning Theory* (1998).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `dualite-convexe-kkt.research.md` — verified claims only, each with an exact
   citation (author, year, venue, theorem/section number, URL where available).
   Flag **UNVERIFIED** anything not verified.
2. `dualite-convexe-kkt.draft.md` — French **full-lesson** draft (not a panel):
   French, M2 level; structured like an expert lesson (introduction, running
   example, progressive sections, synthèse); every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours » (whole lesson is expert); optional "Proposed demos" subsection per
   section + the `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
