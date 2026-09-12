---
id: p3-l1-clustering-model-based-bmdp
type: panel
part: 3
lesson: /part3/lesson1
anchor: principe-hierarchique
title: "Vue model-based : BMDP et priors de partition"
level: research
priority: 3
status: pending
related: [p5-l1-bagging-oob-63-2, p3-lessons-melange-gaussien-em]
sources:
  - course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex
---

# Vue model-based : BMDP et priors de partition

## Mission

La leçon traite le clustering hiérarchique comme une procédure déterministe.
Ce panneau introduit la vue **model-based / bayésienne** : un prior exchangeable
sur les partitions hiérarchiques (arbre), le modèle **BMDP** (Bayesian Merged
Discrete Probability) pour apprendre l'arbre, et le lien avec les processus de
Dirichlet (choix automatique du nombre de clusters). C'est le pont vers le
Bayesian Model Averaging (Partie V) et vers le « choisir $K$ » (leçon 2).

## Course boundaries

- **Lesson:** `src/routes/part3/lesson1/+page.svelte`
- **Already taught (do not re-teach):** clustering hiérarchique, distances,
  dendrogramme, choix du nombre de clusters.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  5-Clustering.tex` (clustering hiérarchique). La vue bayésienne est absente.
- **Where "beyond course" starts:** BMDP, prior de partition, processus de
  Dirichlet, MCMC sur les arbres — « au-delà du cours ».
- **Out of scope:** le BMA en lui-même (Partie V, leçon 1), GMM/EM (leçon
  expert `p3-lessons-melange-gaussien-em`).

## Research questions

1. Définir une partition hiérarchique (arbre) et un **prior exchangeable** sur
   les arbres (poids par nœud).
2. Présenter le modèle **BMDP** (Miller & Harrison 2016) : prior sur l'arbre +
   vraisemblance, et comment on infère l'arbre (MCMC / variational).
3. Relier au **processus de Dirichlet** / Chinese restaurant process comme prior
   sur le nombre de clusters (non paramétrique).
4. Expliquer en quoi cette vue résout le « choix de $K$ » (le nombre de
   clusters est inféré, pas fixé).
5. Pont : comment un BMDP se rattache au BMA (agrégation sur les arbres,
   Partie V).

## Starting references

- Miller & Harrison, « Bayesian Relational Inference » / BMDP (2016, JMLR /
  Ann. Statist. — vérifier le titre exact).
- Ferguson, « A Bayesian analysis of nonparametric estimation » (1973).
- Ishwaran & James, « Gibbs Sampling Methods for Bayesian Nonparametric
  Models » (2001).
- de Freitas & Adams (2008) — tutorial sur les modèles bayésiens non
  paramétriques.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `clustering-model-based-bmdp.research.md` — verified claims only, each with
   an exact citation. Sujet de recherche : distinguer **prouvé** /
   **heuristique** / **UNVERIFIED**.
2. `clustering-model-based-bmdp.draft.md` — French content draft for an
   `ExpertPanel`: French, research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every claim checked against a primary source (not memory)
- [ ] Prouvé / heuristique / UNVERIFIED clairement distingués
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] French draft reads at research level
