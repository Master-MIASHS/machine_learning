---
id: p1-l3-bornes-minimax-convexe
type: panel
part: 1
lesson: /part1/lesson3
anchor: convergence-convexes
title: "Bornes minimax de l'optimisation convexe au premier ordre"
level: m2
priority: 2
status: pending
related: [p1-l3-nesterov-preuve-ode]
sources:
  - course_sources/typst/optim.typ
---

# Bornes minimax de l'optimisation convexe au premier ordre

## Mission

La leçon enseigne la descente de gradient et ses accélérations sans dire ce que
« optimal » veut dire au sens informationnel. Ce panneau introduit le **taux
minimax** : le meilleur taux qu'aucune méthode au premier ordre ne peut battre
sur une classe de fonctions, et montre que la descente de gradient
($O(\kappa\log(1/\epsilon))$) et Nesterov ($O(\sqrt{\kappa}\log(1/\epsilon))$)
l'atteignent — un certificat d'optimalité, pas seulement une convergence.

## Course boundaries

- **Lesson:** `src/routes/part1/lesson3/+page.svelte`
- **Already taught (do not re-teach):** convergence convexe (Th. 3.4), momentum,
  Nesterov.
- **Ground truth to read first:** `course_sources/typst/optim.typ`, section
  « Descente de gradient classique » (Th. 3.4) — le panneau place ces taux dans
  le cadre minimax.
- **Where "beyond course" starts:** la notion de taux minimax et les bornes
  inférieures, absentes de `course_sources/` → « au-delà du cours ».
- **Out of scope:** la preuve ODE de Nesterov (panneau
  `p1-l3-nesterov-preuve-ode`).

## Research questions

1. Définir le taux minimax :
   $\sup_{f\in\mathcal F}\inf_{\text{algorithme}} \#\text{itérations}$ pour
   atteindre $\epsilon$.
2. Énoncer la borne inférieure : aucune méthode au premier ordre ne fait mieux
   que $\Omega(\sqrt{\kappa}\log(1/\epsilon))$ (fortement convexe lisse) et
   $\Omega(1/\sqrt{k})$ (convexe lisse) — construction par un quadratique 1D.
3. Montrer que Nesterov atteint $O(\sqrt{\kappa}\log(1/\epsilon))$ (borne
   supérieure qui matche).
4. Expliquer l'idée de la preuve de borne inférieure (l'adversaire choisit une
   quadratique que l'algorithme ne distingue pas sans assez d'itérations).
5. En une phrase : pourquoi « optimal » se lit ici comme « impossible de faire
   mieux avec seulement $\nabla f$ ».

## Starting references

- Nemirovski & Yudin, *Problem Complexity and Method Efficiency in
  Optimization* (1983).
- Nesterov, *Introductory Lectures on Convex Optimization* (2018), ch. 2.
- Arjevski, Vial, Volle, Wets (1998) — borne inférieure.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `bornes-minimax-convexe.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `bornes-minimax-convexe.draft.md` — French content draft for an
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
