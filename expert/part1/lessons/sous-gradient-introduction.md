---
id: p1-lesson-sous-gradient-introduction
type: lesson
part: 1
lesson: /part1/sous-gradient
title: "Introduction au sous-gradient"
level: m1+
priority: 1
status: implemented
related: [p1-l1-sous-gradient-optimisation-non-lisse, p1-lesson-methodes-proximales-fista-admm, p1-lesson-dualite-convexe-kkt]
sources:
  - course_sources/typst/optim.typ
  - course_sources/typst/regularization.typ
---

# Introduction au sous-gradient

## Mission

Leçon experte **d'introduction** (niveau M1+) qui fonde l'optimisation non
lisse convexe, utilisée sans justification dans la suite de la Partie I :
seuillage doux de la descente par coordonnées (leçon 4), sous-différentiel des
méthodes proximales, et solution fermée du Lasso orthonormal (Partie V,
leçon 4). Plan imposé : sous-dérivée → sous-gradient → Lasso à covariables
orthonormales, puis un aperçu de la méthode du sous-gradient.

## Course boundaries

- **Route :** `src/routes/part1/sous-gradient/+page.svelte` (expert, entre
  `/part1/lesson4` et `/part1/methodes-proximales`).
- **Déjà enseigné :** CNO ∇f = 0 (Théorème 1.3, Partie I leçon 1), descente de
  gradient et taux O(1/k) (Théorème 3.4, leçon 3), CD-Lasso (leçon 4).
- **Ancrages dans les sources :** `course_sources/typst/optim.typ`, Exemple 2.8
  (Lasso, ‖w‖₁ « convexe, non différentiable ») ;
  `course_sources/typst/regularization.typ`, Définition 5.2 (Lasso sans ½).
- **Contenu hors sources (vérifié par grep : aucune occurrence de
  « sous-gradient », « sous-différentiel », « subgradient ») :** toute la
  leçon, attribuée à la littérature primaire (voir `.research.md`).
- **Hors périmètre :** méthodes proximales, dualité, théorie statistique du Lasso.

## Implémentation

- Maths : `src/lib/math/subgradient.ts` (+ `subgradient.test.ts`, 19 tests).
- Démos : `SubderivativeExplorer`, `LassoOrthoSubdiffDemo`,
  `SubgradientMethodDemo` (`src/lib/components/demos/`).
- Quiz : tag `p1/sous-gradient`, ids `p1-sous-gradient-q1…q8`.
- Convention : ½‖y − Xw‖² + λ‖w‖₁ (seuil λ, comme ESL éq. (3.52)) ; la variante
  sans ½ (seuil λ/2) est signalée et corrigée en Partie V leçon 4.

Ce brief couvre (et remplace) le brief panneau
`p1-l1-sous-gradient-optimisation-non-lisse`.
