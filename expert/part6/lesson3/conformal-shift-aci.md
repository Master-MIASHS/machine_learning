---
id: p6-l3-conformal-shift-aci
type: panel
part: 6
lesson: /part6/lesson3
anchor: evaluation-intervalles
title: "Prédiction conformelle sous dérive : adaptive conformal inference"
level: research
priority: 3
status: pending
related: [p6-l2-couverture-conditionnelle-conformal]
sources:
  - course_sources/typst/set_valued.typ
---

# Prédiction conformelle sous dérive : adaptive conformal inference

## Mission

La leçon présente les intervalles de prédiction conformelles (constantes,
adaptatifs, CQR) et liste les **limites** (section « Limitations et défis » de
la source), dont le non-stationnarité. Ce panneau traite le cas où la
distribution **change dans le temps** (dérive / covariate shift) : la
garantie de couverture se brise (l'échangeabilité n'est plus vraie), et
l'**adaptive conformal inference** (ACI, Gibbs & Candès 2021) ajuste le quantile
en ligne pour maintenir la couverture. C'est la frontière de recherche de la
prédiction conforme.

## Course boundaries

- **Lesson:** `src/routes/part6/lesson3/+page.svelte`
- **Already taught (do not re-teach):** intervalles de largeur constante,
  régime oracle, intervalles adaptatifs, estimation de l'incertitude locale,
  CQR, évaluation des intervalles.
- **Ground truth to read first:** `course_sources/typst/set_valued.typ` §
  « Application à la régression » et « Limitations et défis ». Le panneau
  traite la limitation « dérive » en profondeur.
- **Where "beyond course" starts:** ACI, conformal sous covariate shift —
  « au-delà du cours ».
- **Out of scope:** la couverture conditionnelle statique (panneau
  `p6-l2-couverture-conditionnelle-conformal`).

## Research questions

1. Montrer que la **couverture conformelle se brise sous dérive** :
   l'échangeabilité (hypothèse du Th. 6.1) n'est plus vraie si
   $P_t$ change avec $t$.
2. Présenter le **conformal sous covariate shift** par pondération (importance
   weights, Tibshirani et al. 2019).
3. Présenter **ACI** (Gibbs & Candès 2021) : mise à jour en ligne du quantile
   $\eta_t$ via une loi du type $\eta_{t+1}=\eta_t+\alpha(\hat c_t-\alpha)$
   (couverture empirique $\hat c_t$), et sa garantie (couverture moyenne en
   ligne).
4. Énoncer l'algorithme ACI pas à pas (initiation, boucle, choix du taux).
5. Discuter : applications (séries temporelles, dérive conceptuelle) et
   limites (dérive rapide, non-stationnarité du score).

## Starting references

- Gibbs & Candès, « Adaptive Conformal Inference Under Distribution Shift »
  (2021, NeurIPS).
- Tibshirani, Foygel, Bartlett, « Conformal Prediction Under Covariate Shift »
  (2019, NeurIPS).
- `course_sources/typst/set_valued.typ` § Limitations et défis.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `conformal-shift-aci.research.md` — verified claims only, each with an exact
   citation. Sujet de recherche : distinguer **prouvé** / **heuristique** /
   **UNVERIFIED**.
2. `conformal-shift-aci.draft.md` — French content draft for an `ExpertPanel`:
   French, research level; every formula KaTeX-ready and `String.raw`-safe;
   narrative blocks; every statement marked « au-delà du cours »; optional
   "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every claim checked against a primary source (not memory)
- [ ] Prouvé / heuristique / UNVERIFIED clairement distingués
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] French draft reads at research level
