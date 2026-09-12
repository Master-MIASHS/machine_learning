---
id: p7-l1-classification-selective-abstention
type: panel
part: 7
lesson: /part7/lesson1
anchor: classifieur-bayes
title: "Classification sélective et abstention"
level: m2
priority: 2
status: pending
related: [p6-l1-scoring-rules-propres]
sources:
  - course_sources/typst/theorie.typ
---

# Classification sélective et abstention

## Mission

La leçon établit le classifieur de Bayes qui **prédit toujours**. Ce panneau
introduit la **classification sélective** : le droit de **rejeter** (abstention)
lorsque la confiance est faible, avec un coût pour le rejet. Le classifieur
sélectif de Bayes prédit l'argmax seulement si $\max_i\eta_i\ge\tau$ (seuil de
confiance), et on obtient une **courbe risque–couverture**. C'est le pont
direct vers la Top-K / l'abstention (Partie VI) et un cadre bayésien complet.

## Course boundaries

- **Lesson:** `src/routes/part7/lesson1/+page.svelte`
- **Already taught (do not re-teach):** cadre bayésien, risque conditionnel,
  classifieur de Bayes (Th. 1.1), risque de Bayes et séparabilité.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Prédicteurs optimaux de Bayes » (Théorème 1.1). La leçon suppose une
  prédiction toujours émise ; le panneau ajoute l'abstention.
- **Where "beyond course" starts:** classification sélective, seuil $\tau$,
  courbe risque–couverture — « au-delà du cours ».
- **Out of scope:** la Top-K comme prédiction set-valued (Partie VI, leçon 1).

## Research questions

1. Formaliser la **classification sélective** : action « prédire $i$ » ou
   « rejeter », avec coût $c_r$ pour le rejet ; écrire le risque.
2. Montrer que le **classifieur sélectif de Bayes** prédit
   $\arg\max_i\eta_i$ ssi $\max_i\eta_i\ge\tau$ (seuil lié à $c_r$), et rejette
   sinon.
3. Décrire la **courbe risque–couverture** (risque en fonction de la fraction
   de points non rejetés) et montrer qu'elle est décroissante.
4. Relier à la **Top-K** (Partie VI) : renvoyer au top-$K$ est une abstention
   structurée ; comparer les deux cadres.
5. En une phrase, comment choisir $\tau$ en pratique (couverture cible, coût
   du rejet).

## Starting references

- Geifman & El-Yaniv, « Selective Classification for Deep Neural Networks »
  (2017, NeurIPS).
- Chow, « On Optimum Recognition Errors and Bayes' Risk » (1970, IEEE Trans.
  IT) — origine de l'abstention bayésienne.
- `course_sources/typst/theorie.typ` (Théorème 1.1).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `classification-selective-abstention.research.md` — verified claims only,
   each with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `classification-selective-abstention.draft.md` — French content draft for
   an `ExpertPanel`: French, M2/research level; every formula KaTeX-ready and
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
