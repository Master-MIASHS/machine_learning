---
id: p2-l1-estimateurs-noyau-nadaraya-watson
type: panel
part: 2
lesson: /part2/lesson1
anchor: k-nn
title: "Estimateurs à noyau : Nadaraya–Watson et Parzen"
level: m2
priority: 2
status: pending
related: [p2-lesson-rkhs-methodes-noyau, p8-l2-stone-theoreme-minimax]
sources:
  - course_sources/marine/Cours/CM/coursClassif-1-Intro.tex
---

# Estimateurs à noyau : Nadaraya–Watson et Parzen

## Mission

La leçon introduit k-NN comme méthode locale « brute » (moyenne des $k$ plus
proches). Ce panneau généralise vers les **estimateurs à noyau** : densité de
Parzen et régression de Nadaraya–Watson, où le voisinage est pondéré par un
noyau $K_h$ au lieu d'être une boule dure. C'est le passage de k-NN au lissage
local, et le prérequis pour la consistance (Partie VIII) et les méthodes à
noyau/RKHS (leçon expert).

## Course boundaries

- **Lesson:** `src/routes/part2/lesson1/+page.svelte`
- **Already taught (do not re-teach):** cadre de l'apprentissage supervisé,
  k-NN (algorithme, minimisation empirique), évaluer un modèle, biais-variance,
  sélection de modèle.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  1-Intro.tex`, section « L'apprentissage supervisé » (k-NN y est présenté).
  Le panneau généralise k-NN (noyau uniforme à bande variable).
- **Where "beyond course" starts:** Parzen, Nadaraya–Watson, bande $h$, taux
  $n^{-1/(d+4)}$, absents de `course_sources/` → « au-delà du cours ».
- **Out of scope:** la consistance de k-NN (Partie VIII, leçon 2), la théorie
  RKHS complète (leçon expert `p2-lesson-rkhs-methodes-noyau`).

## Research questions

1. Définir l'estimateur de densité de Parzen $\hat f_h(x)=\frac1n\sum_i K_h(x-X_i)$
   et calculer son biais/variance en $h$ (biais $O(h^2)$, variance
   $O(1/(nh^d))$ pour un noyau lisse).
2. Définir l'estimateur de régression de Nadaraya–Watson
   $\hat m_h(x)=\frac{\sum_i K_h(x-X_i)Y_i}{\sum_i K_h(x-X_i)}$.
3. Montrer que k-NN revient à un noyau uniforme avec $h$ dépendant de $x$
   (la distance au $k$-ième voisin).
4. Énoncer le choix oracle de bande $h\sim n^{-1/(d+4)}$ et le risque
   $O(n^{-4/(d+4)})$ — et la dégénérescence en $d$ grand (maudit de la
   dimension).
5. Relier à la consistance : pourquoi $h\to0$ et $nh^d\to\infty$ (renvoi
   Partie VIII).

## Starting references

- Parzen, « On estimation of a probability density function and mode » (1962,
  Ann. Math. Statist.).
- Nadaraya (1964), Watson (1964) — régression à noyau.
- Silverman, *Density Estimation for Statistics and Data Analysis* (1986).
- Tsybakov, *Introduction to Nonparametric Estimation* (2009), ch. 2.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `estimateurs-noyau-nadaraya-watson.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `estimateurs-noyau-nadaraya-watson.draft.md` — French content draft for an
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
