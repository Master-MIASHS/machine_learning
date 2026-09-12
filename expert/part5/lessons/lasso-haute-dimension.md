---
id: p5-lesson-lasso-haute-dimension
type: lesson
part: 5
lesson: /part5
anchor: null
title: "Lasso en haute dimension (p ≫ n) : théorie complète"
level: m2
priority: 2
status: pending
related: [p5-l4-lasso-oracle-irrepresentable, p5-l4-lasso-bic-equivalence, p4-l5-bic-aic-cv]
sources:
  - course_sources/typst/regularization.typ
  - course_sources/sophie/9.choix_de_modele.pdf
---

# Lasso en haute dimension (p ≫ n) : théorie complète

## Mission

Leçon expert à part entière qui développe la **théorie high-dimension** du
Lasso au-delà des deux panneaux de la leçon 4. Le régime $p\gg n$ (plus de
variables que d'observations), la restricted eigenvalue condition, l'inégalité
oracle, la consistance de sélection (irrepresentable), le **Dantzig selector**
en alternative, et les extensions (adaptive Lasso, group lasso). C'est la
leçon de référence pour la sélection de variables moderne.

## Course boundaries

- **Anchored to:** Partie V — Régularisation (`src/routes/part5/`), leçon 4
  (Lasso/Ridge/Elastic Net), avec pont vers le choix de modèle (Partie IV,
  leçon 5).
- **Already taught (do not re-teach):** Ridge, Lasso (parcimonie), Elastic
  Net, choix de $\lambda$, AIC/BIC (Partie IV).
- **Ground truth to read first:** `course_sources/typst/regularization.typ` §
  « Régularisation L1 (Lasso) » et `course_sources/sophie/9.choix_de_modele.pdf`
  (sélection de variables, best-subset). La théorie $p\gg n$ est au-delà.
- **Where "beyond course" starts:** RE condition, oracle inequality,
  irrepresentable, Dantzig, adaptive/group lasso — « au-delà du cours », leçon
  marquée expert.
- **Out of scope:** les algorithmes proximaux (leçon expert
  `p1-lesson-methodes-proximales-fista-admm`), la théorie des réseaux.

## Research questions

1. Poser le régime $p\gg n$ : pourquoi l'OLS échoue (singulier) et le Lasso
   reste défini (convexe, coercif).
2. Définir la **restricted eigenvalue condition** (RE) et son rôle ; donner un
   exemple de matrice qui la satisfait (incohérente / sub-gaussienne).
3. Énoncer et discuter l'**inégalité oracle** (Tibshirani 2013 ; van de Geer &
   Bühlmann 2013) en prédiction.
4. Énoncer la **consistance de sélection** (Zhao & Yu 2006) : irrepresentable +
   signal minimal + RE.
5. Présenter le **Dantzig selector** (Candès, Tao, Plan 2007) comme alternative
   (contrainte sur $X^\top r$) et le comparer au Lasso.
6. Extensions : **adaptive Lasso** (Zou 2006, propriété oracle) et **group
   lasso** (selection de groupes).
7. En une phrase, situer par rapport au choix de variables classique
   (best-subset, Partie IV) : le Lasso évite l'exploration $2^p$.

## Starting references

- Tibshirani, *The Lasso Method for Variables Selection* (2013, Statistical
  Science).
- van de Geer, *High-Dimensional Statistics with a View Towards Applications in
  Biology* (2015).
- Zhao & Yu (2006) ; Bickel, Ritov, Tsybakov (2009) ; Candès & Tao (2007)
  Dantzig.
- Zou (2006) adaptive Lasso ; Yuan & Lin (2006) group lasso.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `lasso-haute-dimension.research.md` — verified claims only, each with an
   exact citation. Flag **UNVERIFIED** anything not verified.
2. `lasso-haute-dimension.draft.md` — French **full-lesson** draft: French, M2
   level; structured like an expert lesson; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; "Proposed demos" subsection (ex. Lasso path en $p\gg n$) +
   `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
