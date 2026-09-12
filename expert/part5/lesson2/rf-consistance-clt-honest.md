---
id: p5-l2-rf-consistance-clt-honest
type: panel
part: 5
lesson: /part5/lesson2
anchor: avantages-random-forest
title: "Consistance et normalité asymptotique des Random Forest"
level: m2
priority: 2
status: pending
related: [p5-l1-bagging-oob-63-2, p8-l2-stone-theoreme-minimax]
sources:
  - course_sources/typst/regularization.typ
---

# Consistance et normalité asymptotique des Random Forest

## Mission

La leçon présente le Random Forest et ses avantages empiriques (robustesse,
importance de variables). Ce panneau donne la **théorie** : le RF est
**consistant** sous des hypothèses faibles (Biau 2012), satisfait un **CLT**
(normalité asymptotique), et la variante **honest** permet des intervalles de
confiance valides. C'est le pont vers la consistance de k-NN (Partie VIII) —
le RF est une « forêt de k-NN locaux ».

## Course boundaries

- **Lesson:** `src/routes/part5/lesson2/+page.svelte`
- **Already taught (do not re-teach):** motivation RF, algorithme, choix du
  nombre de features par division ($m$), importance des variables, avantages.
- **Ground truth to read first:** `course_sources/typst/regularization.typ` §
  « Random Forest ». La théorie (consistance, CLT, honest) est au-delà.
- **Where "beyond course" starts:** Biau (2012), CLT RF, honest splitting,
  absents de `course_sources/` → « au-delà du cours ».
- **Out of scope:** la consistance de k-NN en détail (Partie VIII, leçon 2),
  l'inférence bayésienne sur les forêts.

## Research questions

1. Énoncer le **théorème de consistance de Biau (2012)** : le RF est
   universellement consistant si (a) les arbres sont « légèrement
   sous-échantillonnés » ($n_k\to\infty$ et $n_k/n\to0$) et (b) les arbres sont
   faiblement dépendants (sous-ensemble de features).
2. Relier à la consistance de k-NN (Partie VIII) : chaque feuille est un
   voisinage local ; le RF moyenne ces estimateurs locaux.
3. Énoncer un **CLT pour le RF** (ex. Biau, Scornet) :
   $\sqrt n(\hat f_{\text{RF}}(x)-f(x))\xrightarrow{d}\mathcal N(0,\sigma^2(x))$
   sous conditions.
4. Présenter le **honest splitting** (échantillon de split ≠ échantillon de
   valeur de feuille) et pourquoi il donne des IC valides (pont vers l'inférence).
5. En une phrase, justifier le choix $m\approx d/3$ (variance vs. corrélation des
   arbres).

## Starting references

- Biau, « On the Consistency of Random Forests » (2012, Ann. Statist.).
- Breiman, « Random Forests » (2001, Machine Learning).
- Biau & Scornet (2016/2018) — CLT et asymptotique des RF.
- Wager, Athanes, et al. (2018+) — inférence honnête sur les RF.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `rf-consistance-clt-honest.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `rf-consistance-clt-honest.draft.md` — French content draft for an
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
