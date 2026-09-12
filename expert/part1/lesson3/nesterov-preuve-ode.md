---
id: p1-l3-nesterov-preuve-ode
type: panel
part: 1
lesson: /part1/lesson3
anchor: methode-nesterov
title: "Nesterov accéléré vu comme une ODE amortie"
level: m2
priority: 2
status: pending
related: [p1-l3-bornes-minimax-convexe, p1-lesson-optimisation-non-convexe-deep-learning]
sources:
  - course_sources/typst/optim.typ
---

# Nesterov accéléré vu comme une ODE amortie

## Mission

La leçon présente la méthode de Nesterov algorithmiquement (section « Nesterov »
de la leçon 3). Ce panneau donne la compréhension **moderne** de
l'accélération : la descente de gradient accélérée est une discrétisation
d'une équation différentielle du second ordre (oscillateur amorti), à la
Su–Boyd–Candès, ce qui explique d'où viennent la « mémoire » (momentum) et le
pas en avance, et pourquoi le taux $O(1/\sqrt{k})$ est optimal.

## Course boundaries

- **Lesson:** `src/routes/part1/lesson3/+page.svelte`
- **Already taught (do not re-teach):** descente de gradient classique,
  intuition géométrique, justification par développement limité, choix du pas,
  convergence convexe (Th. 3.4), momentum, Nesterov (algorithme).
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Momentum et méthodes accélérées ». Le panneau ne redécouvre pas
  l'algorithme ; il en donne l'origine continue.
- **Where "beyond course" starts:** l'ODE, la discrétisation de
  Su–Boyd–Candès, l'optimalité minimax, absents de `course_sources/` →
  « au-delà du cours ».
- **Out of scope:** les bornes minimax en détail (panneau
  `p1-l3-bornes-minimax-convexe`).

## Research questions

1. Écrire l'ODE continue de l'accélération :
   $\ddot x + \frac{3}{t}\dot x + \nabla f(x)=0$ (ou sa variante), et identifier
   le terme d'amortissement $\frac{3}{t}$.
2. Présenter la discrétisation de Su–Boyd–Candès : comment on obtient les
   variables $(x_k,y_k)$ et le pas en avance de Nesterov.
3. Montrer (esquisse) que l'énergie décroît et que $f(x_k)-f^\star=
   O(1/k^2)$ en convexe (et $O(\kappa\log(1/\epsilon))$ en fortement convexe).
4. Relater au momentum classique (heavy-ball de Polyak) : en quoi Nesterov
   diffère (le terme en avance).
5. En une phrase : pourquoi ce taux est dit « optimal » (renvoi au panneau
   minimax).

## Starting references

- Nesterov, « A method for solving convex programming problems with the rate of
  convergence $O(1/k^2)$ » (1983).
- Su, Boyd, Candès, « Differential Equations for Momentum Optimization »
  (2014), *SIAM J. Optim.* 25(3).
- Polyak, « Some methods of speeding up the convergence of iteration methods »
  (1964).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `nesterov-preuve-ode.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `nesterov-preuve-ode.draft.md` — French content draft for an `ExpertPanel`:
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
