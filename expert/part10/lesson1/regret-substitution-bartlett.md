---
id: p10-l1-regret-substitution-bartlett
type: panel
part: 10
lesson: /part10/lesson1
anchor: formulation-marge
title: "Borne de regret de substitution (Bartlett)"
level: m2
priority: 1
status: pending
related: [p10-l2-margin-condition-taux-calibration, p10-l3-decomposition-exces-risque]
sources:
  - course_sources/typst/theorie.typ
---

# Borne de regret de substitution (Bartlett)

## Mission

La leçon justifie *pourquoi* on minimise une perte proxy (marge, logistique)
plutôt que la perte 0-1, mais sans **quantifier** la fidélité du proxy. Ce
panneau fournit le résultat clé : la **borne de regret de substitution**
(Bartlett 2006) — l'excès de risque 0-1 du minimiseur du proxy est contrôlé par
une fonction $\Psi$ de l'excès de risque proxy. C'est la quantification de
« minimiser le proxy ≈ minimiser la 0-1 ».

## Course boundaries

- **Lesson:** `src/routes/part9/lesson1/+page.svelte`
- **Already taught (do not re-teach):** pourquoi ne pas minimiser la perte 0-1,
  formulation par la marge, quatre pertes de substitution, logistique et
  cross-entropy.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Fonctions de perte calibrées » (motivation, Théorème 4.1). Le panneau
  anticipe/quantifie ce que Th. 4.1 prouve en calibration.
- **Where "beyond course" starts:** la borne de regret de substitution et sa
  preuve — « au-delà du cours ».
- **Out of scope:** le théorème de calibration complet (leçon 2).

## Research questions

1. Définir le **regret de substitution** :
   $L_{0-1}(f)-L_{0-1}(f^\star)$ en fonction de
   $L_\lambda(f)-L_\lambda(f^\star)$.
2. Énoncer la **borne de Bartlett (2006)** :
   $L_{0-1}(f)-L_{0-1}(f^\star)\le\Psi_\lambda(L_\lambda(f)-L_\lambda(f^\star))$
   pour une fonction $\Psi_\lambda$ (donner $\Psi$ pour la logistique / hinge).
3. Montrer le rôle de la **marge** et de la régularité de la distribution
   (condition de Tsybakov) dans l'affinement de $\Psi$ (pont panneau
   `p10-l2-margin-condition-taux-calibration`).
4. Relier au **Th. 4.1** (calibration) : la borne de regret est un cas/
   précurseur du résultat de calibration.
5. En une phrase, pourquoi cette borne justifie le choix d'un proxy (et lequel
   est « meilleur » selon $\Psi$).

## Starting references

- Bartlett, « Convexity, Classification, and Risk Bounds » (2006, JASA).
- `course_sources/typst/theorie.typ` (Théorème 4.1).
- Shalev-Shwartz & Ben-David, *Understanding Machine Learning* (2014), ch. 26
  (surrogate losses).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `regret-substitution-bartlett.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `regret-substitution-bartlett.draft.md` — French content draft for an
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
