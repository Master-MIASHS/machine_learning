---
id: p10-l3-decomposition-exces-risque
type: panel
part: 10
lesson: /part10/lesson3
anchor: theoreme-42
title: "Décomposition de l'excès de risque et lien avec le biais-variance"
level: m2
priority: 2
status: pending
related: [p8-l1-lln-fort-erm-consistance-ps, p10-l2-margin-condition-taux-calibration]
sources:
  - course_sources/typst/theorie.typ
---

# Décomposition de l'excès de risque et lien avec le biais-variance

## Mission

La leçon établit la **décomposition de l'erreur** en trois termes (Théorème 4.2).
Ce panneau relie cette décomposition au **biais-variance** classique (Partie
VIII, leçon 1) et à la notion d'**excès de risque** $R(f)-R(f^\star)$ : montrer
que les trois termes (approximation, estimation, optimisation) sont le
biais-variance « en version risque » et que le cas favorable (classe contenant
$f^\star$) réduit à l'erreur d'estimation. C'est la synthèse qui unit la
Partie VIII (consistance) à la Partie X (pertes).

## Course boundaries

- **Lesson:** `src/routes/part9/lesson3/+page.svelte`
- **Already taught (do not re-teach):** mise en place, Th. 4.2 (décomposition en
  trois termes), interprétation de chaque terme, cas favorable.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Décomposition de l'erreur » (Théorème 4.2) et `src/routes/part8/lesson1`
  (décomposition approximation/estimation). Le panneau fait le pont explicite.
- **Where "beyond course" starts:** l'identification formelle des trois termes
  avec le biais-variance et l'excès de risque — « au-delà du cours ».
- **Out of scope:** la consistance en elle-même (Partie VIII).

## Research questions

1. Rappeler le **Th. 4.2** : excès de risque
   $R(f_n)-R(f^\star)$ = terme d'approximation + terme d'estimation + terme
   d'optimisation (écrire les trois termes).
2. Montrer l'**identification** avec le biais-variance (Partie VIII) :
   approximation ↔ biais, estimation ↔ variance, optimisation ↔ erreur
   numérique.
3. Définir l'**excès de risque** et montrer que le **cas favorable** (classe
   contenant $f^\star$) annule le terme d'approximation.
4. Relier au **biais-variance** de la leçon 1 (Partie VIII) et au **Th. 4.1**
   (calibration) : la décomposition est le « pourquoi » derrière la calibration.
5. En une phrase, pourquoi cette décomposition est l'outil de diagnostic
   (quel terme domine ?).

## Starting references

- `course_sources/typst/theorie.typ` (Théorème 4.2).
- Part VIII, leçon 1 (décomposition approximation/estimation) —
  `src/routes/part8/lesson1/+page.svelte`.
- Shalev-Shwartz & Ben-David, *Understanding Machine Learning* (2014), ch. 13
  (risk decomposition).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `decomposition-exces-risque.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `decomposition-exces-risque.draft.md` — French content draft for an
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
