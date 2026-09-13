# Recherche — Conditions KKT et dualité lagrangienne

> Agent de recherche pour le brief `p1-l1-kkt-dualite-lagrangienne`.
> Source primaire vérifiée : **Boyd & Vandenberghe, *Convex Optimization*,
> Cambridge University Press, 2004**, chapitre 5 « Duality » — texte complet
> consulté via la version PDF libre publiée par les auteurs
> (https://web.stanford.edu/~boyd/cvxbook/, fichier `bv_cvxbook.pdf`,
> téléchargé le 2026-09-13). Chaque affirmation ci-dessous indique la section
> exacte du livre où elle a été lue dans le texte.

## 1. Affirmations vérifiées (Boyd & Vandenberghe, 2004, ch. 5)

### 1.1 Forme standard, lagrangienne, fonction duale

- **Forme standard (5.1)** : `minimize f0(x)` sous `fi(x) ≤ 0 (i = 1..m)`,
  `hi(x) = 0 (i = 1..p)`, variable `x ∈ R^n`, domaine `D` non vide, valeur
  optimale `p*`. « We do not assume the problem (5.1) is convex. » — §5.1.1.
- **Lagrangienne** (§5.1.1) :
  `L(x, λ, ν) = f0(x) + Σᵢ λᵢ fᵢ(x) + Σᵢ νᵢ hᵢ(x)`,
  `dom L = D × R^m × R^p`. Les `λᵢ` sont les multiplicateurs de Lagrange des
  contraintes d'inégalité, les `νᵢ` ceux des égalités ; `λ, ν` sont les
  variables duales.
- **Fonction duale** (§5.1.2) :
  `g(λ, ν) = inf_{x ∈ D} L(x, λ, ν)` ; vaut `−∞` si la lagrangienne est
  minorée non bornée en `x`. **Texte exact** : « Since the dual function is
  the pointwise infimum of a family of affine functions of (λ, ν), it is
  concave, even when the problem (5.1) is not convex. »

### 1.2 Majorations et dualité faible

- **Majoration** (§5.1.3, eq. 5.2) : pour tout `λ ≥ 0` et tout `ν`,
  `g(λ, ν) ≤ p*`. Preuve dans le texte : pour `x̃` admissible,
  `Σ λᵢ fᵢ(x̃) + Σ νᵢ hᵢ(x̃) ≤ 0`, donc `L(x̃, λ, ν) ≤ f0(x̃)`, et
  `g(λ, ν) = inf L ≤ L(x̃, λ, ν) ≤ f0(x̃)`, pour tout `x̃` admissible.
- **Problème dual** (§5.2, eq. 5.16) : `maximize g(λ, ν)` sous `λ ≥ 0`.
  **Texte exact** : « The Lagrange dual problem (5.16) is a convex
  optimization problem, since the objective to be maximized is concave and
  the constraint is convex. This is the case whether or not the primal
  problem (5.1) is convex. »
- **Dualité faible** (§5.2.2, eq. 5.23) : `d* ≤ p*`, « which holds even if
  the original problem is not convex ». Équivalences : `p* = −∞` ⇒
  `d* = −∞` ; `d* = +∞` ⇒ `p* = +∞` (primale irréalisable).
- **Écart de dualité** (§5.2.2) : « We refer to the difference p* − d* as
  the optimal duality gap of the original problem […] The optimal duality
  gap is always nonnegative. »

### 1.3 Dualité forte et condition de Slater

- **Définition** (§5.2.3, eq. 5.24) : la dualité forte tient si `d* = p*`.
- **Problème convexe** (§5.2.3, eq. 5.25) : `minimize f0(x)` sous
  `fi(x) ≤ 0`, `Ax = b`, avec `f0, …, fm` convexes. « we usually (but not
  always) have strong duality » ; les hypothèses supplémentaires s'appellent
  *constraint qualifications*.
- **Condition de Slater** (§5.2.3, eq. 5.26) : il existe
  `x̃ ∈ relint D` tel que `fi(x̃) < 0 (i = 1..m)` et `Ax̃ = b`. Point dit
  *strictement réalisable*. **Théorème de Slater** : « Slater's theorem
  states that strong duality holds, if Slater's condition holds (and the
  problem is convex). »
- **Amélioration (5.27)** : si `f1, …, fk` sont affines, il suffit que
  `fi(x̃) ≤ 0 (i ≤ k)`, `fi(x̃) < 0 (i > k)`, `Ax̃ = b`.
- **Atteinte du dual** (§5.2.3) : Slater « also implies that the dual
  optimal value is attained when d* > −∞, i.e., there exists a dual feasible
  (λ*, ν*) with g(λ*, ν*) = d* = p* ».
- **Preuve de la dualité forte** (§5.3.2) : séparation des ensembles convexes
  `A` (épigraphe de type `G`) et `B = {(0,0,s) | s < p*}` par le théorème
  de l'hyperplan séparateur (§2.5.1) ; Slater garantit que l'hyperplan
  séparateur est non vertical (`µ > 0`), d'où `g(λ, ν) = p*`.

### 1.4 Points-selle, complémentarité, KKT

- **Interprétation point-selle** (§5.4.2) : si `x*` et `λ*` sont optimaux
  primal/dual quand la dualité forte tient, « they form a saddle-point for
  the Lagrangian » : `L(x*, λ) ≤ L(x*, λ*) ≤ L(x, λ*)` pour tout
  `λ ≥ 0` (et `x ∈ D`). La réciproque est vraie : un point-selle de `L`
  donne primal et dual optimaux et écart nul.
- **Récupération du primal** (§5.5.1, exemple 5.3) : si la dualité forte
  tient et `(λ*, ν*)` est dual optimal, un minimiseur `x*` de
  `L(x, λ*, ν*)` en `x` est primal optimal dès qu'il est primal réalisable ;
  s'il n'est pas réalisable, l'optimum primal n'est pas atteint.
- **Complémentarité** (§5.5.2, eq. 5.48) : `λᵢ* fi(x*) = 0 (i = 1..m)`,
  équivalent à `λᵢ* > 0 ⇒ fi(x*) = 0` (resp. `fi(x*) < 0 ⇒ λᵢ* = 0`). « the
  ith optimal Lagrange multiplier is zero unless the ith constraint is
  active at the optimum ».
- **Conditions KKT** (§5.5.3, eq. 5.49) — fonctions `f0, …, fm, h1, …, hp`
  différentiables (domaines ouverts), sans hypothèse de convexité :
  1. faisabilité primal : `fi(x*) ≤ 0`, `hi(x*) = 0` ;
  2. faisabilité dual : `λᵢ* ≥ 0` ;
  3. complémentarité : `λᵢ* fi(x*) = 0` ;
  4. stationnarité : `∇f0(x*) + Σᵢ λᵢ* ∇fi(x*) + Σᵢ νᵢ* ∇hi(x*) = 0`.
- **Cas non convexe** (§5.5.3) : « for any optimization problem with
  differentiable objective and constraint functions for which strong
  duality obtains, any pair of primal and dual optimal points must satisfy
  the KKT conditions (5.49). » — nécessaire, **pas** suffisant.
- **Cas convexe** (§5.5.3) : si `fi` convexes et `hi` affines, tout
  `(x̃, λ̃, ν̃)` satisfaisant KKT est primal **et** dual optimal avec écart
  nul (preuve : `x̃` minimise `L(x, λ̃, ν̃)` en `x`, donc
  `g(λ̃, ν̃) = f0(x̃)`). « If a convex optimization problem with
  differentiable objective and constraint functions satisfies Slater's
  condition, then the KKT conditions provide necessary and sufficient
  conditions for optimality ».
- **Dual du problème non convexe quadratique** (§5.2.4, eq. 5.32–5.33) :
  `min x^T A x + 2 b^T x` sous `x^T x ≤ 1` avec `A ⪯̸ 0` (« trust region
  problem ») admet **toujours** un écart de dualité nul (résultat plus
  général : quadratique + une contrainte quadratique + Slater, voir §B.1,
  S-procedure) ; le livre cite Nocedal & Wright, p. 78.

### 1.5 Exemple de convexité SANS dualité forte (exercice 5.21 du livre)

« A convex problem in which strong duality fails » :
`minimize e^(−x)` sous `x²/y ≤ 0`, variables `(x, y)`,
`D = {(x, y) | y > 0}`. Vérifications faites par l'agent :

- Réalisable : `x²/y ≤ 0` avec `y > 0` ⇔ `x = 0`. Donc ensemble des points
  réalisables = `{0} × (0, ∞)`, `p* = 1` (atteint en tout point réalisable).
- Slater : exige `x²/y < 0` — impossible puisque `x² ≥ 0`. **Slater échoue.**
- Lagrangienne : `L(x, y, λ) = e^(−x) + λ x²/y`, `λ ≥ 0`.
- Fonction duale : `λ x²/y ≥ 0` et `inf_{y > 0} λ x²/y = 0` (en `y → +∞`),
  donc `g(λ) = inf_x e^(−x) = 0` pour tout `λ ≥ 0` (pas d'atteinte :
  `x → +∞`). D'où `d* = 0 < 1 = p*` : **écart de dualité = 1 > 0**.
- Conclusion : la convexité seule ne suffit pas ; il faut une qualification
  des contraintes (Slater).

### 1.6 Remarque historique (bibliographie du ch. 5)

Texte exact : « The KKT conditions are named after Karush (whose unpublished
1939 Master's thesis is summarized in Kuhn [Kuh76]), Kuhn, and Tucker
[KT51]. Related optimality conditions were also derived by John [Joh85]. »
→ Karush : mémoire de **Master** (1939), non publié ; Kuhn & Tucker :
[Kuh–Tuk 51] (1951) ; voir aussi John.

## 2. Corrections apportées aux « Starting references » du brief

1. Le brief cite « Boyd & Vandenberghe (2004), ch. 5 (dualité) **et ch. 9
   (KKT)** ». Dans le livre, **les conditions KKT sont au §5.5.3
   (chapitre 5)** ; le chapitre 9 est « Minimization algorithms »
   (descente, Newton…). Les citations du panneau utiliseront le §5.5.3.
2. Karush (1939) est un mémoire de **Master** non publié (et non une thèse
   de doctorat) — corrigé conformément au texte de la bibliographie du ch. 5.
3. **Nocedal & Wright, *Numerical Optimization*, 2e éd., Springer, 2006**
   (ISBN 978-0-387-40065-5, existence et éditeur vérifiés via Open Library,
   OL37089883M) : le chapitre 12 est bien le chapitre des conditions
   d'optimalité contrainte (cas général non convexe, qualifications des
   contraintes type LICQ/MFCQ). **UNVERIFIED** : le numéro exact du
   théorème KKT dans le ch. 12 n'a pas pu être vérifié en ligne lors de
   cette session (pas d'accès au texte). Le panneau n'a pas besoin de ce
   numéro : toutes les affirmations utilisées sont citées depuis B&V (véréfié
   ci-dessus) ou sont des calculs faits et revérifiables ci-après.
4. Vapnik, *Statistical Learning Theory* (1998) : cité dans le brief comme
   référence d'application SVM ; non utilisé pour aucune affirmation du
   panneau (la dualité complète de la SVM est hors périmètre, cf. brief
   `p2-l4-svm-dualite-kkt`).

## 3. Calculs faits et revérifiés à la main par l'agent

### 3.1 Exemple convexe avec dualité forte (1D)

Problème : `minimize (x − 1)²` sous `x ≤ 0` (forme standard :
`h(x) = x ≤ 0`).

- **Primal** : `min_{x ≤ 0} (x−1)²` ; le minimiseur sans contrainte `x = 1`
  est non réalisable ; `x* = 0`, `p* = 1`.
- **Slater** : `x̃ = −1` est strictement réalisable (`−1 < 0`).
- **Lagrangienne** : `L(x, λ) = (x−1)² + λx`, `λ ≥ 0` ;
  `∂L/∂x = 2(x−1) + λ = 0` ⇒ `x(λ) = 1 − λ/2` (unique minimiseur en `x`,
  `L` fortement convexe en `x`).
- **Fonction duale** : `g(λ) = L(x(λ), λ) = (λ/2)² + λ(1 − λ/2)
  = λ − λ²/4` (parabole concave sur `λ ≥ 0`).
- **Dual** : `g'(λ) = 1 − λ/2` ⇒ `λ* = 2`, `d* = g(2) = 1 = p*`
  (dualité forte, conforme au théorème de Slater).
- **KKT** : `2(x*−1) + λ* = 0`, `x* ≤ 0`, `λ* ≥ 0`, `λ* x* = 0` ⇒
  `x* = 0`, `λ* = 2` (solution unique).
- **Point-selle** : `L(x, 2) = x² + 1 ≥ 1 = L(0, 2) = L(0, λ)` pour tout
  `λ ≥ 0` (vérifié : `L(0, λ) = 1`).
- **Récupération du primal** : `x(λ*) = 1 − 2/2 = 0 = x*`.

### 3.2 Exemple non convexe où KKT ≠ optimum (1D)

Problème : `minimize x⁴ − x²` sous `x ≤ 0` — **même fonction que l'Exemple
1.8 de la leçon** (`f(x) = x⁴ − x²`), restreinte à `x ≤ 0`.

- **Lagrangienne** : `L(x, λ) = x⁴ − x² + λx`, `λ ≥ 0`.
- **KKT** : `x ≤ 0`, `λ ≥ 0`, `λx = 0`, `4x³ − 2x + λ = 0`.
  - Cas `x < 0` : `λ = 0` ⇒ `4x³ − 2x = 0` ⇒ `x ∈ {±1/√2}` ⇒ `x = −1/√2`.
    `f(−1/√2) = 1/4 − 1/2 = −1/4` : c'est le **minimum global** sur
    `x ≤ 0` (`f' = 4x(x² − 1/2)` : `f` décroît sur `(−∞, −1/√2)`, croît
    sur `(−1/√2, 0)`).
  - Cas `x = 0` : stationnarité donne `λ = 0 ≥ 0` ✓, complémentarité
    `0·0 = 0` ✓, faisabilité ✓. Donc `(x, λ) = (0, 0)` **satisfait les KKT**
    alors que `f(0) = 0` et que `f(x) = x⁴ − x² < 0` pour `x < 0` petit :
    `x = 0` est un **maximum local** (de `f` en 0, `f''(0) = −2 < 0`),
    pas un minimum.
- **Conclusion** : hors convexité, un point KKT n'est pas nécessairement
  optimal (cohérent avec le §5.5.3 de B&V : nécessaire seulement, sous
  dualité forte/qualification, pas suffisant).

### 3.3 Invariant de dualité faible (pour le test numérique)

Pour l'exemple 3.1 : `g(λ) = λ − λ²/4 ≤ 1 = p*` pour tout `λ ≥ 0`
(maximum de `g` est `1` en `λ = 2`). Pour l'exemple 3.2 :
`p* = −1/4` ; la fonction duale `g(λ) = inf_x (x⁴ − x² + λx)` satisfait
`g(λ) ≤ −1/4` pour tout `λ ≥ 0` (dualité faible, vraie même hors convexité).

## 4. Périmètre du cours (rappel, `course_sources/typst/optim.typ`)

`optim.typ` ne contient **aucune** notion de contrainte : la section «
Conditions d'existence d'un minimum » (Déf. 1.1–1.2, Th. 1.3–1.12) traite
exclusivement du cas sans contrainte (`Ω ⊂ R^n` ouvert, CNO `∇f = 0`,
CNSO/CSSO sur la Hessienne, convexité, coercivité). **Tout le contenu du
panneau (lagrangienne, dual, dualité faible/forte, Slater, KKT, exemples 3.1
et 3.2) est « au-delà du cours »** et devra l'être visiblement marqué dans
le brouillon.

## 5. Check-list de vérification du brief

- [x] Chaque théorème/esquisse de preuve vérifié contre une source primaire
      (texte du livre B&V lu section par section, pas de mémoire).
- [x] Aucune affirmation hors cours présentée comme du cours (section 4).
- [x] Références complètes (auteur, année, éditeur, section, URL) — seule
      exception assumée : numéro de théorème N&W ch. 12 **UNVERIFIED**.
- [ ] Formules valides KaTeX / sûres `String.raw` → vérification à la
      rédaction du brouillon (`draft.md`).
- [x] Fichier de source du cours cité pour la frontière (`optim.typ`,
      section « Conditions d'existence d'un minimum »).
- [ ] Brouillon français de niveau M2 → rédigé dans `draft.md`.
