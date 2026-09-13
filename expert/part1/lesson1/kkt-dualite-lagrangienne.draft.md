# Brouillon — Panneau « Conditions KKT et dualité lagrangienne »

> Brouillon du contenu `ExpertPanel` pour le brief
> `p1-l1-kkt-dualite-lagrangienne`, à greffer sur
> `src/routes/part1/lesson1/+page.svelte` (anchor `conditions-suffisantes`,
> après l'Exemple 1.5.1 « la parabole », avant la démo 1.3).
>
> Tout ce qui suit est **au-delà du cours** : `course_sources/typst/optim.typ`
> ne traite que de l'optimisation **sans contraintes** (section « Conditions
> d'existence d'un minimum », Déf. 1.1–1.2, Th. 1.3–1.12). Aucune lagrangienne,
> aucun dual, aucune condition KKT n'y apparaît. La frontière est marquée
> visiblement par le Callout d'ouverture (bloc 2).
>
> Sources : Boyd & Vandenberghe, *Convex Optimization*, CUP 2004, ch. 5
> (§5.1.1–5.1.3, §5.2, §5.2.2, §5.2.3, §5.3.2, §5.4.2, §5.5.1–5.5.3, exercice
> 5.21, bibliographie) — version libre
> https://web.stanford.edu/~boyd/cvxbook/ ; Nocedal & Wright, *Numerical
> Optimization*, 2e éd., Springer 2006, ch. 12 (cas général non convexe ;
> numéro de théorème UNVERIFIED, cf. `kkt-dualite-lagrangienne.research.md`).
>
> Convention du code : les formules sont écrites telles qu'elles iront dans
> `String.raw`… (backticks), transposes en `\top` (convention du dépôt).

**Titre du panneau** : `Conditions KKT et dualité lagrangienne`

---

## Bloc 1 — Ouverture (paragraphe)

Jusqu'ici, la leçon suppose qu'on minimise `f` sur un ouvert `Ω` **sans
contrainte** : les conditions d'optimalité sont locales (gradient, Hessienne).
Une seule contrainte change tout. Exemple minimal :

```
\min_{x \le 0} (x-1)^2
```

Le minimum est en `x* = 0`, mais `f'(x*) = 2(x* - 1) = -2 \neq 0` : la CNO
(Th. 1.3) n'est même plus **nécessaire** dès que le point optimal est « plaqué »
contre une contrainte. Il faut de nouvelles conditions d'optimalité, et un
nouvel outil : la **dualité lagrangienne**.

## Bloc 2 — Callout « Au-delà du cours »

`Callout type="note" title="Au-delà du cours"`

Tout ce panneau est **au-delà du cours** : la section « Conditions
d'existence d'un minimum » de `course_sources/typst/optim.typ` ne traite que
de l'optimisation sans contrainte. La dualité lagrangienne et les conditions
de Karush–Kuhn–Tucker (KKT) ne s'y trouvent pas ; elles sont données ici d'après
Boyd & Vandenberghe (2004), chapitre 5, et Nocedal & Wright (2006), chapitre 12.
Elles sont indispensables plus tard dans le cours : c'est la clé de voûte de la
SVM (Partie II, leçon 4) et du Lasso (Partie V).

## Bloc 3 — DefinitionBlock « Lagrangienne et fonction duale »

Numéro : `1.5.1.bis`

Soit le problème (1D, une contrainte d'inégalité) :

```
\min_x \; f(x) \quad \text{sous} \quad h(x) \le 0,
```

avec `f` et `h` convexes et différentiables. On introduit le multiplicateur
`λ ≥ 0` et la **fonction lagrangienne** :

```
L(x, \lambda) = f(x) + \lambda \, h(x), \qquad \lambda \ge 0.
```

Pour `x` réalisable (`h(x) ≤ 0`) et `λ ≥ 0`, le terme `λh(x) ≤ 0`, donc
`L(x, λ) ≤ f(x)` ; en prenant l'infimum sur **tout** `x` (et pas seulement les
points réalisables), on obtient une **minoration** de la valeur optimale. On
définit la **fonction duale** :

```
g(\lambda) = \inf_x \, L(x, \lambda), \qquad \lambda \ge 0.
```

Forme générale (Boyd & Vandenberghe §5.1.1, forme standard 5.1) :
`minimize f_0(x)` sous `f_i(x) \le 0` (`i = 1, \dots, m`), `h_i(x) = 0`
(`i = 1, \dots, p`) :

```
L(x, \lambda, \nu) = f_0(x) + \sum_{i=1}^{m} \lambda_i f_i(x) + \sum_{i=1}^{p} \nu_i h_i(x),
\qquad g(\lambda, \nu) = \inf_x L(x, \lambda, \nu).
```

La fonction duale est **concave** même si le problème primal n'est pas convexe :
c'est le pointwise-infimum d'une famille de fonctions affines de
`(λ, ν)` (B&V §5.1.2).

## Bloc 4 — TheoremBlock « Dualité faible » + preuve

Numéro : `1.5.2.bis`

Soit `p* = inf{ f(x) : h(x) ≤ 0 }` la valeur optimale du problème primal, et
`d* = sup_{λ ≥ 0} g(λ)` la valeur duale. Alors :

```
d^* \le p^*
```

quelle que soit la convexité du problème (B&V §5.2.2, eq. 5.23). L'écart
`p* − d* ≥ 0` est l'**écart de dualité** (duality gap) ; il est toujours
non négatif.

<div class="proof-block">
<strong>Idée de la démonstration :</strong> soit `x̃` un point réalisable
(`h(x̃) ≤ 0`) et `λ ≥ 0`. Alors `λ h(x̃) ≤ 0`, donc
`L(x̃, λ) = f(x̃) + λ h(x̃) ≤ f(x̃)`. Comme `g(λ) = inf_x L(x, λ)`, on a
`g(λ) ≤ L(x̃, λ) ≤ f(x̃)` pour **tout** `x̃` réalisable, donc
`g(λ) ≤ p*`. En maximisant sur `λ ≥ 0` : `d* ≤ p*`. ∎ (B&V §5.1.3, eq. 5.2)
</div>

Le **problème dual** est `maximize g(λ)` sous `λ ≥ 0`. C'est un problème
d'optimisation **convexe** — maximiser une fonction concave sur un convexe —
**même si le primal n'est pas convexe** (B&V §5.2). Les contraintes
« sont passées dans les multiplicateurs » : on a échangé un problème contraint
en `x` contre un problème convexe, sans contrainte d'inégalité en `λ` (sauf
`λ ≥ 0`).

## Bloc 5 — TheoremBlock « Dualité forte et condition de Slater »

Numéro : `1.5.3.bis`

La **dualité forte** tient si `d* = p*` (écart nul). Pour un problème convexe,
ceci est garanti par la **condition de Slater** (B&V §5.2.3) :

> Il existe un point **strictement réalisable** `x̃` :
> `f_i(x̃) < 0` pour toute contrainte d'inégalité, `h_i(x̃) = 0` pour les
> égalités (version 1D : `h(x̃) < 0`).

Alors :

1. **dualité forte** : `d* = p*` ;
2. le dual **est atteint** : il existe `λ* ≥ 0` avec `g(λ*) = d* = p*`
   (quand `d* > −∞`) ;
3. la qualification peut être affaiblie si les contraintes sont affines
   (elles n'ont alors pas à être strictes) (B&V, eq. 5.27).

La preuve (B&V §5.3.2) sépare par un hyperplan deux ensembles convexes
construits à partir des valeurs des contraintes et de l'objectif ; Slater
garantit que l'hyperplan séparateur est « non vertical », ce qui fournit un
multiplicateur `λ*` avec `g(λ*) = p*`.

## Bloc 6 — TheoremBlock « Conditions KKT »

Numéro : `1.5.4.bis`

Sous les hypothèses de différentiabilité (B&V §5.5.3), les **conditions de
Karush–Kuhn–Tucker** d'un couple `(x*, λ*)` sont, dans le cas 1D :

1. **faisabilité primal** : `h(x*) ≤ 0` ;
2. **faisabilité dual** : `λ* ≥ 0` ;
3. **complémentarité** : `λ* h(x*) = 0` (c.-à-d. `λ* > 0 ⇒ h(x*) = 0` : le
   multiplicateur est nul si la contrainte n'est pas active) ;
4. **stationnarité** : `f'(x*) + λ* h'(x*) = 0`,
   i.e. `∇f(x*) + λ* ∇h(x*) = 0` en dimension `n`.

En forme générale (B&V, eq. 5.49) : `f_i(x^*) \le 0`, `h_i(x^*) = 0`,
`λ_i^* \ge 0`, `λ_i^* f_i(x^*) = 0`, et
`\nabla f_0(x^*) + \sum_i λ_i^* \nabla f_i(x^*) + \sum_i ν_i^* \nabla h_i(x^*) = 0`.

Deux faits essentiels (B&V §5.5.3) :

- **Convexe + Slater ⇒ les KKT sont nécessaires ET suffisantes** :
  `x*` est optimal si et seulement s'il existe `λ*` tel que `(x*, λ*)`
  satisfait les KKT.
  *Idée* (sens suffisant) : si les KKT tiennent, `x*` minimise
  `L(x, λ*)` en `x` (gradient nul et convexité), donc
  `g(λ*) = L(x*, λ*) = f(x*)` (complémentarité) : écart nul, dualité forte.
- **Hors convexité, les KKT ne sont que nécessaires** (sous dualité forte,
  ou sous une qualification des contraintes en contexte général non convexe —
  Nocedal & Wright, ch. 12) : un point KKT n'est pas forcément un optimum.
  Voir l'exemple 1.5.7.bis ci-dessous.

Si la dualité forte tient, `(x*, λ*)` est un **point-selle** de la
lagrangienne (B&V §5.4.2) : `L(x, λ*) ≤ L(x*, λ*) ≤ L(x*, λ)` pour tout
`x` et `λ ≥ 0` — minimum en `x`, maximum en `λ`.

## Bloc 7 — ExampleBlock « Un exemple complet en 1D »

Numéro : `1.5.5.bis`

Problème : `\min_x (x-1)^2` sous `x \le 0`. Convexe, Slater vérifié
(`x̃ = −1` est strictement réalisable).

1. **Primal** : `p* = 1` en `x* = 0` (le minimiseur non contraint `x = 1`
   est non réalisable).
2. **Lagrangienne** : `L(x, λ) = (x-1)^2 + λx` ;
   `∂L/∂x = 2(x-1) + λ = 0` ⇒ `x(λ) = 1 - λ/2`.
3. **Fonction duale** :
   `g(λ) = L(x(λ), λ) = λ - λ²/4` (parabole concave sur `λ ≥ 0`).
4. **Dual** : `g'(λ) = 1 - λ/2` ⇒ `λ* = 2`, et `d* = g(2) = 1 = p*`
   (dualité forte, écart nul).
5. **KKT** : `2(x* - 1) + λ* = 0`, `x* ≤ 0`, `λ* ≥ 0`, `λ* x* = 0`
   ⇒ solution unique `(x*, λ*) = (0, 2)`.
6. **Récupération du primal** (B&V §5.5.1) : résoudre le dual donne
   `λ* = 2`, et `x(λ*) = 1 - λ*/2 = 0 = x*` : le primal se lit directement
   sur la solution duale.
7. **Point-selle** : `L(x, 2) = x² + 1 ≥ 1 = L(0, 2) = L(0, λ)` pour tout
   `λ ≥ 0`.

## Bloc 8 — ExampleBlock « Convexe ne suffit pas : Slater échoue »

Numéro : `1.5.6.bis`

Exercice 5.21 de Boyd & Vandenberghe : `\min_{(x,y)} e^{-x}` sous
`x²/y \le 0`, domaine `y > 0`.

- Le problème est **convexe** (`e^{−x}` convexe, `x²/y` convexe sur
  `y > 0`), et `p* = 1` (réalisable : `x = 0`, `y > 0`).
- Mais Slater **échoue** : il n'existe aucun point avec `x²/y < 0`
  (puisque `x² ≥ 0`).
- Dual : `L(x, y, λ) = e^{-x} + λ x²/y` ; comme `λ x²/y ≥ 0` et
  `inf_{y>0} λx²/y = 0`, on a `g(λ) = inf_x e^{-x} = 0` pour tout `λ ≥ 0`,
  donc `d* = 0 < 1 = p*` : **l'écart de dualité vaut 1**.

Morale : la convexité seule ne garantit pas la dualité forte — il faut une
qualification des contraintes (Slater).

## Bloc 9 — ExampleBlock « Hors convexité, KKT ≠ optimum »

Numéro : `1.5.7.bis`

Reprenons la fonction de l'Exemple 1.8 de la leçon, `f(x) = x⁴ − x²`, mais
restreinte à `x ≤ 0` : `\min_x x^4 - x^2` sous `x \le 0`.

KKT : `x ≤ 0`, `λ ≥ 0`, `λx = 0`, `4x³ - 2x + λ = 0`.

- `x = −1/√2`, `λ = 0` : KKT vérifiées ; `f(−1/√2) = −1/4` — c'est le
  **minimum global** sur `x ≤ 0`.
- `x = 0`, `λ = 0` : KKT vérifiées (`0 + 0 = 0`, `0·0 = 0`)… mais
  `f''(0) = −2 < 0` : c'est un **maximum local** (`f(x) < 0 = f(0)` pour
  `x < 0` petit).

Deux points KKT, l'un optimal, l'autre pas : **hors convexité, satisfaire les
KKT ne suffit pas à être optimal**. La convexité (et Slater) sont exactement
ce qui transforme les KKT en critère complet de décision.

## Bloc 10 — Callout « Le pont vers SVM et Lasso »

`Callout type="intuition" title="Pourquoi c'est la clé de voûte du reste du cours"`

La dualité transforme un problème **contraint** en un problème convexe
**sans contraintes d'inégalité** sur les multiplicateurs : c'est exactement ce
qui rend la SVM exploitable (le dual de la SVM n'a que la contrainte de somme
`Σ λᵢ yᵢ = 0`, et la complémentarité `λᵢ > 0` sélectionne les vecteurs
support — Partie II, leçon 4) et ce qui explique la parcimonie du Lasso
(Partie V). Aperçu seulement ici : le développement complet est hors périmètre
de ce panneau.

## Proposition de démo (option validée)

- **Widget** : `KktDualityExplorer.svelte` dans
  `src/lib/components/demos/`, chargé via `DeferredDemo` **à l'intérieur** de
  l'ExpertPanel (la démo est donc, comme le texte, masquée hors mode expert).
- **Module math** : `src/lib/math/duality.ts` (nouveau) +
  `src/lib/math/duality.test.ts`, fonctions :
  - `lagrangianParabole(x, lambda)` : `L(x, λ) = (x−1)² + λx` ;
  - `dualFunctionParabole(lambda)` : `g(λ) = λ − λ²/4` (forme close) ;
  - `dualMinimizerParabole(lambda)` : `x(λ) = 1 − λ/2` ;
  - `kktCheckParabole(x, lambda)` : les 4 conditions (primal/dual feasibility,
    complémentarité, stationnarité) + résidu de stationnarité ;
  - `lagrangianQuartic(x, lambda)` : `x⁴ − x² + λx` ;
  - `isKktQuartic(x, lambda)` : vérifie les KKT de l'exemple non convexe
    (pour afficher les deux points KKT, dont celui qui est un maximum local) ;
  - `dualGapParabole(lambda)` : `p* − g(λ) = 1 − (λ − λ²/4)` (invariant ≥ 0).
- **Testes** : valeurs closes indépendantes (`g(2) = 1`, `x(2) = 0`,
  `kktCheck(0, 2)` tout vrai), invariants (dualité faible `g(λ) ≤ 1` sur une
  grille de `λ ≥ 0` ; concavité de `g` sur une grille), cas exacts
  (`isKktQuartic(0, 0)` vrai, `isKktQuartic(−1/√2, 0)` vrai,
  `isKktQuartic(1/√2, 0)` faux — non réalisable).
- **UI** : deux modes (segmented control) — « Convexe : (x−1)², x ≤ 0 » et
  « Non convexe : x⁴−x², x ≤ 0 ». Mode convexe : slider `λ ∈ [0, 4]` ;
  courbes `x ↦ L(x, λ)` et `x ↦ f(x)` (zone `x ≤ 0`), marqueur `x(λ)` ;
  petite courbe `λ ↦ g(λ)` avec son maximum en `λ* = 2` ; panneau des 4
  conditions KKT avec ✓/✗ ; lecture `p*`, `d*`, écart. Mode non convexe :
  mêmes courbes pour `x⁴−x²`, marqueurs sur les deux points KKT
  (`−1/√2` : minimum global ; `0` : maximum local — le piège).
  Fichiers de style : couleurs en variables CSS du site
  (`var(--color-belief)`, `var(--color-surprise)`, …), SVG minimal fait main
  (fallback documenté en commentaire, à remplacer si un composant
  `CurveChart` adapté est construit — à vérifier avant de l'utiliser).
- **Accessibilité** : sliders standards (composant `Slider` existant),
  `aria-label` sur les zones SVG.
