---
id: p7-l2-lp-loss-quantile-regression
type: panel
part: 7
lesson: /part7/lesson2
anchor: perte-absolue
title: "Lp-perte, quantiles conditionnels et régression quantile"
level: m2
priority: 2
status: pending
related: [p6-l3-conformal-shift-aci, p7-l2-scoring-rules-regression-gneiting]
sources:
  - course_sources/typst/theorie.typ
---

# Lp-perte, quantiles conditionnels et régression quantile

## Mission

La leçon établit le prédicteur bayésien sous perte **quadratique** (moyenne
conditionnelle) et **absolue** (médiane conditionnelle), Théorème 1.2. Ce
panneau généralise : sous perte $L_p$, le prédicteur bayésien est le
**quantile d'ordre $p$** de la loi conditionnelle ; sous une perte **asymétrique
(pinball)**, c'est un quantile d'ordre $\tau$ donné. C'est le socle de la
**régression quantile** et du panneau CQR (Partie VI, leçon 3).

## Course boundaries

- **Lesson:** `src/routes/part7/lesson2/+page.svelte`
- **Already taught (do not re-teach):** perte quadratique (moyenne
  conditionnelle), perte absolue (médiane conditionnelle), comparaison des deux
  prédicteurs.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` § « Cas de
  la régression » (Théorème 1.2 « Prédicteurs optimaux en régression »). Le
  panneau généralise quadratique/absolue vers $L_p$ et pinball.
- **Where "beyond course" starts:** le quantile d'ordre $p$, la perte pinball,
  la régression quantile — « au-delà du cours ».
- **Out of scope:** la prédiction conforme en régression (Partie VI, leçon 3).

## Research questions

1. Montrer que le minimiseur de $\mathbb E[|Y-f(X)|^p\mid X]$ est le
   **quantile d'ordre $p$** (cas $p=2$ : moyenne ; $p=1$ : médiane).
2. Définir la **perte pinball** (asymétrique)
   $\rho_\tau(u)=u(\tau-\mathbf 1_{u<0})$ et montrer que son minimiseur
   conditionnel est le **$\tau$-quantile**.
3. Relier à la **régression quantile** (Koenker & Bassett 1978) : estimer le
   $\tau$-quantile de $Y\mid X$.
4. Montrer que $\tau=0.9$ donne le quantile supérieur utilisé par la **CQR**
   (Partie VI, leçon 3) pour l'interval de prédiction.
5. En une phrase, pourquoi la famille des pertes $L_p$/pinball couvre toute la
   fonction de quantile conditionnelle (et donc toute l'incertitude).

## Starting references

- Koenker & Bassett, « Regression Quantiles » (1978, Econometrica).
- `course_sources/typst/theorie.typ` (Théorème 1.2).
- Pinball loss : Koenker (2005), *Quantile Regression*.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `lp-loss-quantile-regression.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `lp-loss-quantile-regression.draft.md` — French content draft for an
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
