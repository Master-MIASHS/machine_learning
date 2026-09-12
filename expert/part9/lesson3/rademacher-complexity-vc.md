---
id: p9-l3-rademacher-complexity-vc
type: panel
part: 9
lesson: /part9/lesson3
anchor: theoreme-generalisation-vc
title: "Complexité de Rademacher : une complexité dépendante des données"
level: m2
priority: 2
status: pending
related: [p9-l2-convergence-uniforme-fonction-croissance, p9-l3-borne-marge-tsybakov]
sources:
  - course_sources/typst/theorie.typ
---

# Complexité de Rademacher : une complexité dépendante des données

## Mission

La leçon établit la borne VC (Théorèmes 3.3–3.4) et cite la **borne de
Rademacher** (Théorème « Borne de Rademacher »). Ce panneau développe la
**complexité de Rademacher** comme mesure de complexité **dépendante des
données** (pas seulement de la dimension VC) : définition, lien avec la
dimension VC, et pourquoi elle donne des bornes plus serrées (et data-dependent)
que la borne VC. C'est l'outil de la généralisation moderne.

## Course boundaries

- **Lesson:** `src/routes/part9/lesson3/+page.svelte`
- **Already taught (do not re-teach):** dimension VC et brisure, lemme de
  Sauer–Shelah, théorème de généralisation VC (Th. 3.3), borne VC pour SVM
  (Th. 3.4).
- **Ground truth to read first:** `course_sources/typst/theorie.typ` § « Cas
  $|cal(H)|=+\infty$ : théorie de Vapnik-Chervonenkis » (Th. 3.3, 3.4, Borne de
  Rademacher). Le panneau développe la borne de Rademacher citée.
- **Where "beyond course" starts:** le développement de la complexité de
  Rademacher et son lien data-dependent — « au-delà du cours ».
- **Out of scope:** la borne à marge de Tsybakov (panneau
  `p9-l3-borne-marge-tsybakov`).

## Research questions

1. Définir la **complexité de Rademacher**
   $\mathfrak R_n(H)=\mathbb E_\sigma\left[\sup_{h\in H}\frac1n\sum_i\sigma_i
   h(x_i)\right]$ ($\sigma_i=\pm1$ équiprobables).
2. Montrer le **lien avec la dimension VC** :
   $\mathfrak R_n(H)\le C\sqrt{d/n}$ (majoration via VC) — donc la borne VC
   s'en déduit.
3. Expliquer pourquoi Rademacher est **data-dependent** (dépend de
   $\{x_i\}$) et peut être bien plus petit que la borne VC au pire cas.
4. Énoncer la **borne de généralisation de Rademacher** (la Th. citée dans la
   source) et la comparer à la borne VC.
5. En une phrase, pourquoi Rademacher est la brique des bornes modernes
   (stabilité, double descente — pont leçon 4).

## Starting references

- Bartlett & Mendelson, « Rademacher and Gaussian Complexities: Tight
  Probabilistic Bounds on the Performance of Learning Algorithms » (2002,
  NIPS / 2006 JMLR).
- `course_sources/typst/theorie.typ` (Borne de Rademacher).
- Vidyasagar, *A Note on the Rademacher Complexity of the SVM » (2012).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `rademacher-complexity-vc.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `rademacher-complexity-vc.draft.md` — French content draft for an
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
