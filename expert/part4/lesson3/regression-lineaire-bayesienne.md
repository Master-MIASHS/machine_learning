---
id: p4-l3-regression-lineaire-bayesienne
type: panel
part: 4
lesson: /part4/lesson3
anchor: maximum-vraisemblance
title: "Régression linéaire bayésienne : shrinkage et pont vers le Ridge"
level: m2
priority: 2
status: pending
related: [p5-l4-lasso-bic-equivalence, p4-l3-bootstrap-theorie, p4-lesson-bootstrap-theorie]
sources:
  - course_sources/sophie/StatM1S1_2025.pdf
  - course_sources/typst/regularization.typ
---

# Régression linéaire bayésienne : shrinkage et pont vers le Ridge

## Mission

La leçon traite l'inférence **fréquentiste** gaussienne (MLE, lois
d'échantillonnage). Ce panneau donne la version **bayésienne** conjugée
(prior Normal–Inverse-Gamma) : la moyenne a posteriori est un **shrinkage** de
l'OLS, et le cas particulier $V_0\propto\sigma^2 I$ redonne exactement la forme
**Ridge** (MAP). C'est le pont conceptuel entre l'inférence gaussienne
(ici) et la régularisation (Partie V, panneau « régularisation comme MAP »).

## Course boundaries

- **Lesson:** `src/routes/part4/lesson3/+page.svelte`
- **Already taught (do not re-teach):** H3, MLE, lois d'échantillonnage, IC et
  Student, test $F$, prévisions, MCG.
- **Ground truth to read first:** `course_sources/sophie/StatM1S1_2025.pdf`
  (MLE, lois d'échantillonnage) et `course_sources/typst/regularization.typ`
  § « Régularisation L2 (Ridge) » + le panneau « Dérivation bayésienne »
  existant de la leçon 4 (Partie V). Le panneau donne la **développement
  conjugée complète** (au-delà du MAP).
- **Where "beyond course" starts:** le prior, la loi a posteriori complète
  (au-delà du simple MAP) → « au-delà du cours ».
- **Out of scope:** la théorie du Lasso (panneau
  `p5-l4-lasso-oracle-irrepresentable`), le BMA (Partie V, leçon 1).

## Research questions

1. Écrire le modèle bayésien : $\beta\mid\sigma^2\sim\mathcal N(m_0,V_0)$,
   $\sigma^2\sim\operatorname{IG}(a_0,b_0)$, $Y\mid\beta,\sigma^2\sim
   \mathcal N(X\beta,\sigma^2I)$.
2. Montrer la **conjugaison** : la loi a posteriori est
   $\mathcal N$–$\operatorname{IG}$ et donner $m_n,V_n$ en forme close.
3. Montrer que $m_n$ est une **moyenne pondérée** de $m_0$ et de
   $\hat\beta_{\text{OLS}}$ (shrinkage), avec poids $V_0 X^\top X$ vs. $\sigma^2I$.
4. Montrer le **cas Ridge** : $V_0=(\sigma^2/\lambda)I$ $\Rightarrow$ MAP
   $\hat\beta_{\text{MAP}}=(X^\top X+\lambda I)^{-1}X^\top Y$ (rattachement au
   panneau « MAP » de la Partie V).
5. Donner la **prédiction a posteriori** (marge de prédiction bayésienne) et la
   comparer à l'IC fréquentiste (leçon 3).

## Starting references

- Gelman, Carlin, Stern, Vehtari, *Bayesian Data Analysis* (3rd ed., 2013),
  ch. 2.2 (régression linéaire bayésienne).
- Murphy, *Machine Learning: A Probabilistic Perspective* (2012), ch. 3–4.
- `course_sources/typst/regularization.typ` § Ridge + panneau « MAP ».

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `regression-lineaire-bayesienne.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `regression-lineaire-bayesienne.draft.md` — French content draft for an
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
