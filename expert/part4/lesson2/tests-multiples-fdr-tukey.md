---
id: p4-l2-tests-multiples-fdr-tukey
type: panel
part: 4
lesson: /part4/lesson2
anchor: anova-deux-facteurs
title: "Tests multiples après ANOVA : Tukey, Bonferroni, FDR"
level: m2
priority: 2
status: pending
related: [p4-l5-bic-aic-cv, p5-l2-rf-consistance-clt-honest]
sources:
  - course_sources/sophie/StatM1S1_2025.pdf
  - "course_sources/sophie/ModèleLinéaire_ANOVA_ANCOVA.pdf"
---

# Tests multiples après ANOVA : Tukey, Bonferroni, FDR

## Mission

La leçon enseigne l'ANOVA et le test $F$ global. Mais un $F$ global
significatif ne dit **pas** quels niveaux diffèrent : les comparaisons
pairwise post-hoc multiplient le risque d'erreur de type I. Ce panneau couvre
le contrôle du **family-wise error rate** (Bonferroni, Holm, Tukey HSD) et du
**false discovery rate** (Benjamini–Hochberg) — indispensable dès que le nombre
de facteurs (ou de variables) est grand.

## Course boundaries

- **Lesson:** `src/routes/part4/lesson2/+page.svelte`
- **Already taught (do not re-teach):** deux natures de covariables, ANOVA
  (un paramètre par niveau), contraintes de plein rang, ANOVA à deux facteurs +
  interaction, ANCOVA.
- **Ground truth to read first:** `course_sources/sophie/StatM1S1_2025.pdf`
  (test $F$, lois d'échantillonnage) et
  `course_sources/sophie/ModèleLinéaire_ANOVA_ANCOVA.pdf` (ANOVA/ANCOVA). Les
  tests multiples ne sont pas dans les sources.
- **Where "beyond course" starts:** Tukey HSD, Bonferroni/Holm, FDR/BH —
  « au-delà du cours ».
- **Out of scope:** la sélection de variables (leçon 5), la théorie de
  l'inférence bayésienne.

## Research questions

1. Montrer que $m$ tests $t$ au niveau $\alpha$ donnent
   $\text{FWER}\approx1-(1-\alpha)^m$ (independence) — l'inflation.
2. **Bonferroni** ($p\le\alpha/m$) et **Holm** (step-down) : énoncer, prouver
   le contrôle du FWER, comparer la puissance.
3. **Tukey HSD** : base sur la distribution de la **portée studentisée**
   (studentized range), pourquoi c'est adapté aux comparaisons **paires** ;
   énoncer le seuil.
4. Définir le **FDR** $\mathbb E[V/R]$ et la procédure **Benjamini–Hochberg** ;
   quand préférer FDR à FWER (nombre de tests grand).
5. En une phrase, situer par rapport à la sélection de variables (leçon 5) :
   le data snooping est un test multiple déguisé.

## Starting references

- Tukey, « The problem of multiple comparisons (1948) » (1953, Collected
  Papers).
- Holm, « A simple sequentially rejective multiple test procedure » (1979,
  Scand. J. Statist.).
- Benjamini & Hochberg, « Controlling the false discovery rate » (1995, JRSS-B).
- Westfall, *Multivariate Linear Models* / tests multiples (réf. standard).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `tests-multiples-fdr-tukey.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `tests-multiples-fdr-tukey.draft.md` — French content draft for an
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
