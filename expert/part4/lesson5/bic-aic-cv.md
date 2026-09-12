---
id: p4-l5-bic-aic-cv
type: panel
part: 4
lesson: /part4/lesson5
anchor: criteres-comparaison
title: "AIC vs BIC : deux objectifs, deux pénalités"
level: m2
priority: 2
status: pending
related: [p4-l5-cv-inegalite-oracle, p5-l4-lasso-bic-equivalence]
sources:
  - course_sources/sophie/9.choix_de_modele.pdf
---

# AIC vs BIC : deux objectifs, deux pénalités

## Mission

La leçon donne les **formules** AIC $=-2\log\hat L+2k$ et BIC
$=-2\log\hat L+k\log n$ sans les justifier. Ce panneau montre qu'elles
proviennent d'objectifs **différents** : l'AIC estime la divergence de
Kullback–Leibler (prédiction), le BIC approxime l'évidence bayésienne (et est
**consistant** — retrouve le vrai modèle). C'est la clé pour choisir l'un ou
l'autre selon qu'on prédit ou qu'on infère.

## Course boundaries

- **Lesson:** `src/routes/part4/lesson5/+page.svelte`
- **Already taught (do not re-teach):** trois objectifs, biais/variance,
  critères (PRESS, Cp, AIC, BIC) — formules, best-subset, pas à pas, prostate.
- **Ground truth to read first:** `course_sources/sophie/9.choix_de_modele.pdf`
  (définitions de AIC et BIC). Le panneau donne la **justification**
  asymptotique des deux pénalités.
- **Where "beyond course" starts:** la dérivation de la pénalité AIC (KL) et BIC
  (évidence bayésienne), la consistance du BIC, absentes de `course_sources/` →
  « au-delà du cours ».
- **Out of scope:** la CV (panneau `p4-l5-cv-inegalite-oracle`), l'équivalence
  Lasso–BIC (panneau `p5-l4-lasso-bic-equivalence`).

## Research questions

1. Montrer que **AIC** $=-2\log\hat L+2k$ est un estimateur sans biais de la
   divergence de KL entre la vraie loi et le modèle (Akaike 1973/1974) —
   objectif **prédiction**.
2. Montrer que **BIC** $=-2\log\hat L+k\log n$ approxime
   $-\log$ de l'évidence bayésienne (Schwarz 1978) — objectif **sélection du
   vrai modèle**.
3. Énoncer la **consistance** du BIC : $P(\text{BIC sélectionne le vrai modèle})
   \to1$ quand $n\to\infty$ ; l'AIC, lui, est **asymptotiquement efficace**
   (pas consistant).
4. Expliquer la divergence : si le vrai modèle est dans la classe, BIC le
   retrouve ; AIC peut en sélectionner un plus grand (biais-variance).
5. Relier à la CV : la CV est « côté prédiction » comme l'AIC (pont avec le
   panneau `p4-l5-cv-inegalite-oracle`).

## Starting references

- Akaike, « Information theory and an extension of the maximum likelihood
  principle » (1973/1974, 2nd Int. Symp. on Information Theory).
- Schwarz, « Estimating the Dimension of a Model » (1978, Ann. Statist.).
- Burnham & Anderson, *Multimodel Inference* (2002) — AIC en pratique.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `bic-aic-cv.research.md` — verified claims only, each with an exact citation.
   Flag **UNVERIFIED** anything not verified.
2. `bic-aic-cv.draft.md` — French content draft for an `ExpertPanel`: French,
   M2/research level; every formula KaTeX-ready and `String.raw`-safe;
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
