---
id: p3-l2-kmeanspp-garantie
type: panel
part: 3
lesson: /part3/lesson2
anchor: convergence-minima-locaux
title: "k-means++ : une initialisation avec garantie"
level: m2
priority: 1
status: pending
related: [p3-l2-kmeans-em-dur, p3-lesson-clustering-spectral-laplacien]
sources:
  - course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex
---

# k-means++ : une initialisation avec garantie

## Mission

La leçon insiste sur les **minima locaux** de k-means et les redémarrages
multiples. Ce panneau montre qu'on peut faire mieux qu'au hasard :
**k-means++** (Arthur & Vassilvitskii 2007) initialise les centres par
échantillonnage $D^2$ et obtient une **garantie d'approximation**
$\mathbb E[\text{coût}]\le O(\log k)\cdot\text{OPT}$ — une borne théorique sur
la qualité de l'initialisation, pas seulement un astuce pratique.

## Course boundaries

- **Lesson:** `src/routes/part3/lesson2/+page.svelte`
- **Already taught (do not re-teach):** problème de fixer $K$, algorithme de
  Lloyd, convergence et minima locaux, choix de $K$ (coude), complexité,
  outliers, formes de clusters, évaluation.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  5-Clustering.tex`, section « Les $K$-moyennes » (Lloyd y est donné ;
  l'initialisation n'est pas théorisée).
- **Where "beyond course" starts:** k-means++, garantie $O(\log k)$,
  $D^2$-sampling, absents de `course_sources/` → « au-delà du cours ».
- **Out of scope:** la théorie de la convergence de Lloyd (à part le lien),
  spectral clustering (leçon expert).

## Research questions

1. Pourquoi l'initialisation aléatoire naive est mauvaise (pire cas
   exponentiel en $k$ / nombre de minima locaux).
2. Algorithme k-means++ : 1er centre uniforme, ensuite centre tiré avec
   probabilité $\propto D^2(x)$ (distance au centre le plus proche).
3. **Théorème (Arthur & Vassilvitskii 2007)** :
   $\mathbb E[\text{coût}(k\text{-means}^{++})]\le 8\ln k\cdot\text{OPT}$
   (donner la forme exacte et la constante).
4. Montrer que les itérations de Lloyd après k-means++ affinent la solution
   (et le coût total en pratique).
5. Comparer : redémarrages multiples (heuristic) vs. k-means++ (garantie) ;
   citer une amélioration récente (k-means||, Drineas et al. 2014).

## Starting references

- Arthur & Vassilvitskii, « k-means++: The Advantages of Careful Seeding »
  (2007, SOCC / Algorithmica 2007).
- Drineas, Mairal, Schmidt, « k-means||: A Fast Distributed Algorithm for
  Designing Large-scale K-means Clustering Systems » (2014, PDW).
- Elkan, « Using the Triangle Inequality to Accelerate k-Means » (2003, ICML)
  — bornes de convergence.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `kmeanspp-garantie.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `kmeanspp-garantie.draft.md` — French content draft for an `ExpertPanel`:
   French, M2/research level; every formula KaTeX-ready and `String.raw`-safe;
   narrative blocks; every beyond-course statement marked « au-delà du cours »;
   optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
