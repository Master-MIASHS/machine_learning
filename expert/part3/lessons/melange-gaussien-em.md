---
id: p3-lessons-melange-gaussien-em
type: lesson
part: 3
lesson: /part3
anchor: null
title: "Mélange gaussien et algorithme EM"
level: m2
priority: 2
status: pending
related: [p3-l2-kmeans-em-dur, p2-l2-fisher-lda, p4-l3-regression-lineaire-bayesienne]
sources:
  - course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex
---

# Mélange gaussien et algorithme EM

## Mission

Leçon expert à part entière : l'algorithme **EM** (Dempster–Laird–Rubin 1977)
et le **mélange gaussien** comme modèle générique de clustering. Montrer que la
convergence d'EM est garantie vers un **point stationnaire** (pas forcément un
maximum), la relation avec k-means (limite dure), et le lien vers LDA (mélange
gaussien à covariances égales). C'est le socle probabiliste du clustering
model-based.

## Course boundaries

- **Anchored to:** Partie III — Clustering (`src/routes/part3/`), après
  k-means (leçon 2).
- **Already taught (do not re-teach):** k-means, hiérarchique, évaluation.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  5-Clustering.tex`. Le GMM/EM est **au-delà** de ces sources.
- **Where "beyond course" starts:** EM, GMM, convergence, likelihood —
  « au-delà du cours », leçon marquée expert.
- **Out of scope:** BMDP (panneau `p3-l1-clustering-model-based-bmdp`),
  clustering spectral (leçon expert).

## Research questions

1. Énoncer le **théorème d'EM** (Dempster–Laird–Rubin 1977) : chaque itération
   augmente la vraisemblance observée, et la suite converge vers un point
   stationnaire du log-likelihood.
2. Écrire le modèle de **mélange gaussien**
   $p(x)=\sum_k\pi_k\mathcal N(x;\mu_k,S_k)$ et ses paramètres.
3. Dériver les équations E-step et M-step complètes.
4. Montrer la **limite k-means** : $S_k\to\sigma^2I$, $\sigma^2\to0$
   (rattachement au panneau `p3-l2-kmeans-em-dur`).
5. Montrer que $S_k=S$ commun donne **LDA** (rattachement au panneau
   `p2-l2-fisher-lda`).
6. Discuter : choix de $k$ (BIC, consistance), sensibilité à l'initialisation,
   et la non-convexité (minima locaux).

## Starting references

- Dempster, Laird, Rubin, « Maximum Likelihood from Incomplete Data via the EM
  Algorithm » (1977, JRSS-B).
- McLachlan & Krishnan, *The Gaussian Mixture Model* (2008).
- Biernacki, Celeux, Govaert, « Assessing the Number of Linear Subspaces in a
  Mixture Model » (2000) — choix de $k$ via BIC.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `melange-gaussien-em.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `melange-gaussien-em.draft.md` — French **full-lesson** draft: French, M2
   level; structured like an expert lesson; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; "Proposed demos" subsection (ex. EM pas-à-pas sur un mélange 2D)
   + `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
