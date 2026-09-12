---
id: p9-l3-borne-marge-tsybakov
type: panel
part: 9
lesson: /part9/lesson3
anchor: theoreme-generalisation-vc
title: "Condition de marge de Tsybakov et taux de généralisation"
level: m2
priority: 2
status: pending
related: [p9-l3-rademacher-complexity-vc, p10-l2-margin-condition-taux-calibration]
sources:
  - course_sources/typst/theorie.typ
---

# Condition de marge de Tsybakov et taux de généralisation

## Mission

La leçon établit la borne VC pour SVM (Théorème 3.4, Vapnik 1995) qui
introduit la **marge**. Ce panneau précise le rôle de la marge : la
**condition de marge de Tsybakov** sur la distribution de $\eta$ près de $1/2$
améliore le taux de l'excès de risque (de $O(1/\sqrt n)$ vers un taux plus
rapide en $\alpha$). C'est la raison profonde pour laquelle maximiser la marge
aide à généraliser, et le pont vers la calibration (Partie X).

## Course boundaries

- **Lesson:** `src/routes/part9/lesson3/+page.svelte`
- **Already taught (do not re-teach):** dimension VC, Sauer–Shelah, Th. 3.3
  (borne VC), Th. 3.4 (borne VC SVM — marge).
- **Ground truth to read first:** `course_sources/typst/theorie.typ` § « Cas
  $|cal(H)|=+\infty$ » (Th. 3.4 Vapnik 1995 — la borne à marge). Le panneau
  ajoute la condition de Tsybakov.
- **Where "beyond course" starts:** la condition de Tsybakov et l'amélioration
  de taux — « au-delà du cours ».
- **Out of scope:** la calibration (Partie X, leçon 2).

## Research questions

1. Définir la **marge** d'un point $\gamma(x)=y\,f(x)/\|w\|$ (ou
   $y\,\eta(x)-1/2$) et la **distribution des margins**.
2. Énoncer la **condition de Tsybakov** :
   $\mathbb P(|\eta(x)-1/2|\le t)\le C\,t^{\alpha}$ ($\alpha\ge0$).
3. Montrer que, sous cette condition, l'**excès de risque** du classifieur de
   marge empirique s'améliore vers $O(n^{-\alpha/(\alpha+1)})$ (au lieu de
   $O(1/\sqrt n)$).
4. Relier à la SVM (Th. 3.4) : pourquoi maximiser la marge aide (la SVM est
   adaptée à la condition de marge).
5. En une phrase, pont vers la calibration : la condition de Tsybakov contrôle
   aussi le taux de calibration (panneau `p10-l2-margin-condition-taux-calibration`).

## Starting references

- Tsybakov, « Optimal Aggregation of Classifiers in Statistical Pattern
  Recognition » (2004, Ann. Probab.) — condition de marge.
- Bartlett & Mendelson, « Upper and Lower Bounds on the Excess Risk » (2002,
  J. Complexity).
- `course_sources/typst/theorie.typ` (Th. 3.4 Vapnik 1995).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `borne-marge-tsybakov.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `borne-marge-tsybakov.draft.md` — French content draft for an
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
