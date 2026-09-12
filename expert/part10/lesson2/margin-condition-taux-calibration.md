---
id: p10-l2-margin-condition-taux-calibration
type: panel
part: 10
lesson: /part10/lesson2
anchor: theoreme-calibration
title: "Rôle de la condition de Tsybakov dans le taux de calibration"
level: m2
priority: 2
status: pending
related: [p9-l3-borne-marge-tsybakov, p10-l1-regret-substitution-bartlett]
sources:
  - course_sources/typst/theorie.typ
---

# Rôle de la condition de Tsybakov dans le taux de calibration

## Mission

La leçon établit le **théorème de calibration** (Théorème 4.1, Bartlett–Jordan–
McAuliffe 2006) : une perte convexe calibrée (au sens $\varphi'(0)<0$) rend le
risque 0-1 petit quand le risque proxy l'est. Ce panneau précise le **taux** :
il dépend de la **distribution des margins** près de $1/2$, contrôlée par la
**condition de Tsybakov**. C'est le lien quantitatif entre marge (Partie IX) et
calibration (ici).

## Course boundaries

- **Lesson:** `src/routes/part9/lesson2/+page.svelte`
- **Already taught (do not re-teach):** la question posée, définition de la
  calibration, calibration ponctuelle, critère $\varphi'(0)<0$, vérification
  sur les pertes usuelles.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Calibration » (Théorème 4.1). Le panneau affine le taux via Tsybakov.
- **Where "beyond course" starts:** la condition de Tsybakov appliquée au taux
  de calibration — « au-delà du cours ».
- **Out of scope:** la borne de regret de substitution (panneau
  `p10-l1-regret-substitution-bartlett`).

## Research questions

1. Rappeler le **Th. 4.1** (calibration) : si $\varphi$ est convexe calibrée,
   $L_{0-1}(f)-L_{0-1}(f^\star)$ est majorée par une fonction du
   $L_\varphi(f)-L_\varphi(f^\star)$.
2. Montrer que le **taut** de cette majoration dépend de la concentration de
   $\eta$ autour de $1/2$ (les points « difficiles »).
3. Énoncer la **condition de Tsybakov** $\mathbb P(|\eta-1/2|\le t)\le Ct^\alpha$
   et montrer l'amélioration du taux en $\alpha$ (pont panneau
   `p9-l3-borne-marge-tsybakov`).
4. Comparer les taux pour la logistique vs. la hinge (rôle de la régularité de
   $\varphi$ en 0).
5. En une phrase, pourquoi la condition de Tsybakov est l'hypothèse qui rend la
   calibration « rapide ».

## Starting references

- Bartlett, Jordan, McAuliffe, « Convexity, Classification, and Risk Bounds »
  (2006, JASA).
- Tsybakov, « Optimal Aggregation of Classifiers in Statistical Pattern
  Recognition » (2004, Ann. Probab.).
- `course_sources/typst/theorie.typ` (Théorème 4.1).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `margin-condition-taux-calibration.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `margin-condition-taux-calibration.draft.md` — French content draft for an
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
