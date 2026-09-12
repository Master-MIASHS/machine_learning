---
id: p3-l2-kmeans-em-dur
type: panel
part: 3
lesson: /part3/lesson2
anchor: algorithme-lloyd
title: "K-moyennes comme EM dur sur un mélange gaussien"
level: m2
priority: 2
status: pending
related: [p3-lessons-melange-gaussien-em, p3-l2-kmeanspp-garantie]
sources:
  - course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex
---

# K-moyennes comme EM dur sur un mélange gaussien

## Mission

La leçon présente Lloyd comme une descente par alternance (assignment /
update). Ce panneau donne la **lecture probabiliste** : k-means est la limite
« dure » de l'algorithme **EM** appliqué à un mélange de gaussiennes à
covariances sphériques égales, quand la variance tend vers 0. C'est le pont
conceptuel vers le modèle générique (GMM) et la leçon expert EM.

## Course boundaries

- **Lesson:** `src/routes/part3/lesson2/+page.svelte`
- **Already taught (do not re-teach):** algorithme de Lloyd, convergence,
  minima locaux, évaluation.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  5-Clustering.tex`, section « Les $K$-moyennes ». La lecture GMM/EM est
  absente.
- **Where "beyond course" starts:** EM, GMM, limite variance nulle, absents de
  `course_sources/` → « au-delà du cours ».
- **Out of scope:** la théorie complète de la convergence d'EM (leçon expert
  `p3-lessons-melange-gaussien-em`).

## Research questions

1. Écrire EM pour un mélange gaussien : E-step (responsabilités
   $\gamma_{ik}=p(z_i=k\mid x_i)$), M-step (mise à jour de $\mu_k,S_k,\pi_k$).
2. Montrer que, pour $S_k=\sigma^2 I$ commun et $\sigma^2\to0$, EM devient
   k-means : $\gamma_{ik}\to\mathbf 1[x_i\in C_k]$ (affectation dure au centre
   le plus proche).
3. Montrer que k-means minimise la même objectif (distortion) que l'EM dur, et
   que chaque étape augmente la vraisemblance (minorant).
4. Citer **fuzzy c-means** (soft k-means) comme version intermédiaire.
5. En une phrase, relier aux minima locaux : k-means et GMM partagent la même
   non-convexité (d'où le besoin d'initialisation, panneau k-means++).

## Starting references

- Dempster, Laird, Rubin, « Maximum Likelihood from Incomplete Data via the EM
  Algorithm » (1977, JRSS-B).
- McLachlan & Krishnan, *The Gaussian Mixture Model* (2008).
- Bezdek, *Pattern Recognition with Fuzzy Objective Function Algorithms*
  (1981) — fuzzy c-means.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `kmeans-em-dur.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `kmeans-em-dur.draft.md` — French content draft for an `ExpertPanel`:
   French, M2/research level; every formula KaTeX-ready and
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
