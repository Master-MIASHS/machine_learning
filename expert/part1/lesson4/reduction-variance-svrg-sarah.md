---
id: p1-l4-reduction-variance-svrg-sarah
type: panel
part: 1
lesson: /part1/lesson4
anchor: sgd
title: "Réduction de variance : SVRG et SARAH"
level: m2
priority: 2
status: pending
related: [p1-l3-adam-convergence-adam-adaptive-methods]
sources:
  - course_sources/typst/optim.typ
---

# Réduction de variance : SVRG et SARAH

## Mission

La leçon présente le SGD et sa variance (section SGD). Ce panneau montre que la
variance du gradient stochastique n'est pas une fatalité : les méthodes de
**réduction de variance** (SVRG, SARAH) atteignent une convergence linéaire
$O(\log(1/\epsilon))$ sur les problèmes fortement convexes à somme finie, contre
$O(1/k)$ du SGD — en réutilisant un gradient exact périodiquement comme
« variate de contrôle ».

## Course boundaries

- **Lesson:** `src/routes/part1/lesson4/+page.svelte`
- **Already taught (do not re-teach):** SGD (Prop. 3.10–3.11), coordinate
  descent (Th. 3.16), Newton-Raphson (Th. 3.14), synthèse.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Descente de gradient stochastique (SGD) » (Prop. 3.10 « Gradient non
  biaisé », Prop. 3.11 « Convergence SGD »). Le panneau part de la variance
  identifiée ici.
- **Where "beyond course" starts:** SVRG, SARAH, les taux linéaires, absents de
  `course_sources/` → « au-delà du cours ».
- **Out of scope:** Adam/adaptatif (panneau
  `p1-l3-adam-convergence-adam-adaptive-methods`).

## Research questions

1. Rappeler pourquoi le SGD converge en $O(1/k)$ (fortement convexe, pas
   décroissant) : le bruit du gradient borne le taux.
2. Expliquer l'idée de la **variate de contrôle** : réutiliser
   $\nabla f(s)$ (snapshot) pour corriger $\nabla f_i(x)$ et réduire la
   variance.
3. Énoncer l'algorithme SVRG (Johnson & Zhang 2013 / Mairal 2013) et son taux
   $O((L/\mu)\log(1/\epsilon))$.
4. Présenter SARAH (Nguyen et al. 2017) : réduction de variance **le long de la
   trajectoire**, et son intérêt (moins de gradient exact).
5. Indiquer quand SVRG/SARAH battent le SGD mini-batch (et quand ils ne
   valent pas le coût d'un gradient exact).

## Starting references

- Johnson & Zhang, « Accelerating Stochastic Gradient Descent with Predictive
  Variance Reduction » (2013, NIPS / arXiv:1309.4149).
- Mairal, « Optimization with First-Order Surrogate Functions » (2013/2014,
  SIAM J. Optim.).
- Nguyen, Liu, Scheinberg, Takáč, « SARAH: Stochastic Average Recursive
  Gradient Algorithm » (2017, ICML).
- Schmidt, Le Roux, Bach, « Minimize, sketch, compress » (2017).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `reduction-variance-svrg-sarah.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `reduction-variance-svrg-sarah.draft.md` — French content draft for an
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
