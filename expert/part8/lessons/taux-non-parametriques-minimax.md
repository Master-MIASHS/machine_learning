---
id: p8-lesson-taux-non-parametriques-minimax
type: lesson
part: 8
lesson: /part8
anchor: null
title: "Taux non paramétriques et minimax"
level: m2
priority: 2
status: pending
related: [p8-l2-stone-theoreme-minimax, p2-l1-estimateurs-noyau-nadaraya-watson, p2-lesson-rkhs-methodes-noyau]
sources:
  - course_sources/typst/theorie.typ
---

# Taux non paramétriques et minimax

## Mission

Leçon expert à part entière : la **théorie des taux de convergence non
paramétriques**. Le cadre des classes de régularité (Hölder/Lipschitz), la
décomposition biais-variance pour les estimateurs à noyau et local polynomial,
le **taux minimax** $n^{-2\beta/(2\beta+d)}$, la **borne inférieure de
Stone**, et l'adaptation (bande adaptative, lasso de Tibshirani). C'est la
leçon qui quantifie « à quelle vitesse on apprend sans paramètre ».

## Course boundaries

- **Anchored to:** Partie VIII — Consistance (`src/routes/part8/`), après
  k-NN (leçon 2).
- **Already taught (do not re-teach):** consistance universelle, théorème de
  Stone (Th. 2.1), consistance de k-NN.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Consistance et convergence » (Théorème 2.1). Les taux et le minimax sont
  au-delà.
- **Where "beyond course" starts:** classes de régularité, taux minimax, borne
  inférieure, adaptation — « au-delà du cours », leçon marquée expert.
- **Out of scope:** la consistance (déjà traitée), les noyaux/RKHS (leçon
  expert P2), la concentration (Partie IX).

## Research questions

1. Définir une **classe de régularité** $\mathcal H_\beta$ (fonctions
   $\beta$-Hölder) et le **risque** $R_n(f)=\mathbb E\|\hat f-f\|^2$.
2. Énoncer le **taux minimax** :
   $\inf_{\hat f}\sup_{f\in\mathcal H_\beta} R_n(f)\asymp
   n^{-2\beta/(2\beta+d)}$ et l'expliquer (biais-variance).
3. Montrer que l'**estimateur à noyau** (bande $h\asymp n^{-1/(2\beta+d)}$)
   atteint ce taux (et local polynomial).
4. Énoncer la **borne inférieure de Stone** (1982) : aucun estimateur ne fait
   mieux (optimalité).
5. Présenter **l'adaptation** : bande adaptative, ou pénalisation (Tibshirani
   1996) pour atteindre le taux sans connaître $\beta$.
6. Relier : le taux dégénère en $d$ grand (maudit de la dimension, panneau
   `p2-l1-maudit-dimension-quantitatif`) ; et le lien avec la consistance de
   k-NN (leçon 2).

## Starting references

- Tsybakov, *Introduction to Nonparametric Estimation* (2009), ch. 2–3.
- Stone (1977, 1982) — consistance et borne minimax.
- Wand & Jones, *Kernel Smoothing* (1995) — estimateurs à noyau.
- Tibshirani, « Adaptive Bias Reduction in Nonparametric Regression » (1996,
  JASA).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `taux-non-parametriques-minimax.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `taux-non-parametriques-minimax.draft.md` — French **full-lesson** draft:
   French, M2 level; structured like an expert lesson; every formula
   KaTeX-ready and `String.raw`-safe; narrative blocks; every statement marked
   « au-delà du cours »; "Proposed demos" subsection (ex. biais-variance en
   fonction de $h$) + `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
