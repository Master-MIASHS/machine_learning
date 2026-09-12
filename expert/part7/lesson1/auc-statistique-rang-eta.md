---
id: p7-l1-auc-statistique-rang-eta
type: panel
part: 7
lesson: /part7/lesson1
anchor: risque-bayes
title: "AUC comme statistique de rang de η"
level: m2
priority: 2
status: pending
related: [p2-l2-biais-implicite-sgd-max-margin, p10-l1-regret-substitution-bartlett]
sources:
  - course_sources/typst/theorie.typ
---

# AUC comme statistique de rang de η

## Mission

La leçon établit le classifieur de Bayes et le risque de Bayes (Théorèmes 1.1)
via la fonction de risque conditionnel $\eta(x)$. Ce panneau donne une
interprétation profonde de l'**AUC** (déjà vue comme courbe en Partie II) :
l'AUC est la probabilité qu'un point positif ait un $\eta$ plus grand qu'un
point négatif, i.e. une **statistique de rang** de $\eta$. Elle est invariante
aux recalibrations monotones et ne dépend que de l'ordre de $\eta$ — un pont
élégant entre l'optimum de Bayes (ici) et la mesure ROC (Partie II).

## Course boundaries

- **Lesson:** `src/routes/part7/lesson1/+page.svelte`
- **Already taught (do not re-teach):** cadre bayésien, risque conditionnel,
  classifieur de Bayes (Th. 1.1), risque de Bayes et séparabilité, et le
  panneau « Pourquoi le conditionnement suffit ».
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Prédicteurs optimaux de Bayes » (Théorème 1.1). Le panneau ajoute l'AUC
  comme rang de $\eta$.
- **Where "beyond course" starts:** AUC = rang de $\eta$, invariance monotone —
  « au-delà du cours ».
- **Out of scope:** la construction de la courbe ROC (Partie II, leçon 2).

## Research questions

1. Montrer que $\mathrm{AUC}=\mathbb P(\eta(X^{+})>\eta(X^{-}))$ où
   $X^{+}\sim P(\cdot\mid Y=1)$, $X^{-}\sim P(\cdot\mid Y=0)$ (et le terme à
   égalité).
2. Montrer que l'AUC est **invariante** aux transformations monotones croissantes
   de $\eta$ (ne dépend que du rang) — lien avec la courbe ROC.
3. Relier à l'optimum de Bayes : le classifieur de Bayes (seuil $\eta>1/2$) est
   le point de la ROC ; l'AUC intègre la ROC sur tous les seuils.
4. Montrer que $\mathrm{AUC}=1$ ssi les distributions de $\eta$ sous $Y=0,1$
   sont séparables (cas limite de la séparabilité, Th. 1.1).
5. En une phrase, situer l'AUC par rapport au risque de Bayes (l'AUC mesure la
   qualité de *classement*, pas le risque au seuil $1/2$).

## Starting references

- Hanley & McNeil, « The Meaning and Use of the Area Under a Receiver
  Operating Characteristic (ROC) Curve » (1982, Radiology).
- `course_sources/typst/theorie.typ` (Théorème 1.1).
- Part II, leçon 2 (courbe ROC) — `src/routes/part2/lesson2/+page.svelte`.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `auc-statistique-rang-eta.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `auc-statistique-rang-eta.draft.md` — French content draft for an
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
