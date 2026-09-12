---
id: p3-lesson-clustering-spectral-laplacien
type: lesson
part: 3
lesson: /part3
anchor: null
title: "Clustering spectral et laplacien de graphe"
level: m2
priority: 2
status: pending
related: [p3-l1-single-linkage-mst-hartigan, p3-l2-kmeanspp-garantie, p2-lesson-rkhs-methodes-noyau]
sources:
  - course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex
---

# Clustering spectral et laplacien de graphe

## Mission

Leçon expert à part entière : le **clustering spectral** comme alternative
principale à k-means et au hiérarchique. Construire un graphe de similarité,
son laplacien, le critère Ncut, la coupure par le vecteur de Fiedler, et la
consistance du spectral clustering. C'est la leçon qui traite des clusters
non-convexes (les « formes » que k-means ne gère pas, leçon 2).

## Course boundaries

- **Anchored to:** Partie III — Clustering (`src/routes/part3/`), après les
  leçons 1 (hiérarchique) et 2 (k-means).
- **Already taught (do not re-teach):** hiérarchique, k-means, formes de
  clusters (limite de k-means), évaluation.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  5-Clustering.tex` (toute la partie). Le spectral clustering est **au-delà**
  de ces sources.
- **Where "beyond course" starts:** graphe de similarité, laplacien, Ncut,
  Fiedler, consistance — « au-delà du cours », leçon marquée expert.
- **Out of scope:** la théorie des graphes générale, les noyaux (leçon expert
  RKHS).

## Research questions

1. Construire le graphe de similarité $W$ (noyau $k$-NN ou gaussien) et son
   laplacien $L=D-W$ (et $L_{sym}=I-D^{-1/2}WD^{-1/2}$).
2. Énoncer le critère **Ncut** (Shi & Malik 2000) et sa relaxation
   semi-définie positive.
3. Montrer que la solution relaxée est donnée par les **vecteurs propres de
   plus petite valeur propre** de $L_{sym}$ (dont le vecteur de Fiedler).
4. Algorithme spectral : embed par les $k$ premiers vecteurs propres, puis
   k-means sur l'embedding (Ng, Jordan, Weiss 2002).
5. Énoncer un **résultat de consistance** du spectral clustering (ex. von
   Luxburg 2007 / Azencott 2006) et les conditions (clusters bien séparés).
6. Relier : pourquoi le spectral gère les clusters non-convexes que k-means ne
   gère pas (pont leçon 2).

## Starting references

- Shi & Malik, « Normalized Cuts and Image Segmentation » (2000, IEEE TPAMI).
- Ng, Jordan, Weiss, « On Spectral Clustering: Analysis and an Algorithm »
  (2002, NeurIPS).
- von Luxburg, « A Tutorial on Spectral Clustering » (2007, Statistics and
  Computing).
- Azencott, « Spectral clustering and its relationship to normalised cuts »
  (2006).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `clustering-spectral-laplacien.research.md` — verified claims only, each with
   an exact citation. Flag **UNVERIFIED** anything not verified.
2. `clustering-spectral-laplacien.draft.md` — French **full-lesson** draft:
   French, M2 level; structured like an expert lesson; every formula
   KaTeX-ready and `String.raw`-safe; narrative blocks; every statement marked
   « au-delà du cours »; "Proposed demos" subsection (ex. spectral sur deux
   croissants) + `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
