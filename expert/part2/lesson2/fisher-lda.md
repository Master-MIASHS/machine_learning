---
id: p2-l2-fisher-lda
type: panel
part: 2
lesson: /part2/lesson2
anchor: classifieur-linaire
title: "Discriminant linéaire de Fisher et LDA"
level: m2
priority: 2
status: pending
related: [p7-l1-auc-statistique-rang-eta, p2-lesson-rkhs-methodes-noyau]
sources:
  - course_sources/marine/Cours/CM/coursClassif-2RegLogistique.tex
---

# Discriminant linéaire de Fisher et LDA

## Mission

La leçon introduit le classifieur linéaire et la régression logistique par la
voie de la **perte**. Ce panneau offre la voie **géométrique/statistique**
complémentaire : le discriminant linéaire de Fisher (LDA) qui projette sur la
direction maximisant le rapport variance entre classes / variance intra-classes.
Sous l'hypothèse gaussienne à covariances égales, LDA est exactement le
classifieur de Bayes — un pont vers l'optimum de Bayes (Partie VII).

## Course boundaries

- **Lesson:** `src/routes/part2/lesson2/+page.svelte`
- **Already taught (do not re-teach):** classifieur linéaire, demi-espaces,
  régression logistique, sigmoïde, seuil, AUC, multiclasse.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  2RegLogistique.tex` (classifieurs linéaires). LDA n'y est pas traité.
- **Where "beyond course" starts:** Fisher/LDA, absent de `course_sources/` →
  « au-delà du cours ».
- **Out of scope:** l'optimum de Bayes en détail (Partie VII), la SVM (leçon 4).

## Research questions

1. Définir le critère de Fisher $J(w)=\dfrac{(w^\top\mu_1-w^\top\mu_2)^2}{w^\top
   S_w w}$ et montrer que son maximisateur est $w\propto S_w^{-1}(\mu_1-\mu_2)$
   ($S_w$ = scatter intra-classes).
2. Montrer que, si $Y|x\sim\mathcal N(\mu_y,S)$ avec $S$ commun aux deux
   classes, le classifieur de Bayes est linéaire et coïncide avec LDA.
3. Relier LDA et régression logistique : dans quel cas la logistique
   « approxime » LDA (et la forme PLDA) ?
4. Donner les variantes : LDA diagonal / Naive Bayes gaussien.
5. En une phrase, situer LDA par rapport à la SVM (marge vs. séparation
   gaussienne).

## Starting references

- Fisher, « The use of multiple measurements in taxonomic problems » (1936,
  Eugenics).
- Duda, Hart, Stork, *Pattern Classification* (2nd ed., 2012), ch. 4.
- McLachlan & Krishnan, *The Gaussian Mixture Model* (2008) — lien LDA/GMM.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `fisher-lda.research.md` — verified claims only, each with an exact citation.
   Flag **UNVERIFIED** anything not verified.
2. `fisher-lda.draft.md` — French content draft for an `ExpertPanel`: French,
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
