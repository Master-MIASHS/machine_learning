# Brouillon — Leçon expert « Méthodes proximales et premier ordre moderne (prox, FISTA, ADMM) »

> Brouillon du contenu de la leçon expert pour le brief
> `p1-lesson-methodes-proximales-fista-admm`
> (`expert/part1/lessons/methodes-proximales-fista-admm.md`).
> Contenu en français, niveau M2. Toutes les formules sont prêtes pour
> `KatexInline`/`KatexBlock` via `String.raw` (aucun backtick ni `\` non
> échappé à l'intérieur).
>
> **Fidélité aux sources** : rien de ce qui suit n'est dans
> `course_sources/` (vérifié par recherche exhaustive des termes « proximal »,
> « prox », « FISTA », « ADMM », « soft-threshold » dans tout
> `course_sources/`). Toute la leçon est donc « au-delà du cours » et l'est
> visiblement par le Callout d'ouverture (section 1) + l'attribution explicite
> de chaque bloc de contenu (référence auteur + théorème/équation exacte,
> cf. `methodes-proximales-fista-admm.research.md`).
>
> Convention de notation retenue pour toute la leçon : celle du monographie
> de Parikh & Boyd, eq. (1.2) : `prox_{λf}(v) = argmin f(x) + (1/(2λ))‖x−v‖²`.
> La différence avec la convention de Boyd et al. (ADMM) est explicitée dans
> la section 2 (Callout « Deux conventions »).

---

## Section 1 — `introduction` — Pourquoi des méthodes proximales ?

### Bloc 1.1 — Paragraphe d'ouverture

La Partie I a enseigné trois familles d'algorithmes : descente de gradient
(taux `O(1/k)` pour les fonctions convexes L-lisses, Thm 3.4 de
`course_sources/typst/optim.typ`), Newton (quadratique près d'un minimum
strict), SGD (variance). La Partie V (leçon 4) a présenté le **Lasso** comme
*modèle* :

```
θ̂_Lasso = argmin_θ ‖y − Xθ‖₂² + λ‖θ‖₁      (Définition 5.2, regularization.typ)
```

et a donné LARS (Algorithme 5.1) comme *algorithme* pour le calculer. Mais
l'objectif du Lasso est **convexe et non lisse** (le terme `‖θ‖₁` n'est pas
différentiable en 0) : ni la descente de gradient (pas de gradient), ni
Newton (pas de Hessienne) ne s'appliquent directement. Et la descente par
coordonnées, enseignée, traite les coordonnées *une à une* — elle sérialise ce
qui est parallélisable.

**La question de la leçon** : quelle est la famille d'algorithmes qui
calcule concrètement le Lasso (et bien plus) en traitant les coordonnées
*en parallèle*, en ne nécessitant que des produits matrice-vecteur, et dont
on sait exactement le taux de convergence ? **Les méthodes proximales** —
l'opérateur proximal, la descente proximale (ISTA), son accélération (FISTA)
et l'ADMM.

### Bloc 1.2 — Callout « Au-delà du cours »

`Callout type="note" title="Au-delà du cours — leçon expert"`

> Ce contenu n'est **pas** dans `course_sources/`. Tout est « au-delà du
> cours » : opérateur proximal, descente proximale, FISTA, ADMM. Les seuls
> points d'ancrage dans le cours sont : le modèle Lasso (Partie V, leçon 4),
> LARS (Algorithme 5.1) comme alternative enseignée au calcul du Lasso, la
> descente par coordonnées (Partie I, leçon 4), et le taux `O(1/k)` de la
> descente de gradient convexe (Thm 3.4 de `optim.typ`) dont le taux ISTA est
> l'analogue composite. Chaque bloc ci-dessous est attribué à sa source
> primaire (voir bibliographie en fin de page).

### Bloc 1.3 — Paragraphe « Le plan »

1. **L'opérateur proximal** : définition, soft-thresholding, lien au
   sous-différentiel et à Fenchel (sections 2).
2. **La descente proximale** (ISTA) : l'algorithme, son taux `O(1/k)`, ses
   cas particuliers (section 3).
3. **FISTA** : l'accélération de Nesterov pour problème composite, taux
   `O(1/k²)` — optimal au pire cas (section 4).
4. **L'ADMM** : éclatement de variables, multiplicateur, application au Lasso
   (section 5).
5. **Le tout-en-un** : sous-gradient, Fenchel, Moreau, Douglas–Rachford
   (section 6) + synthèse pratique (section 7).

---

## Section 2 — `operateur-proximal` — L'opérateur proximal

### Bloc 2.1 — DefinitionBlock « Opérateur proximal »

`DefinitionBlock number="PB14, §1.1, eq. (1.1)–(1.2)"`

Soit `f : Rⁿ → R ∪ {+∞}` une fonction convexe fermée propre. L'opérateur
proximal de `f` est l'application

```
prox_f(v) = argmin_x  f(x) + ½‖x − v‖²
```

et, pour `λ > 0`, le proximal de `f` avec paramètre `λ` :

```
prox_{λf}(v) = argmin_x  f(x) + (1/(2λ))‖x − v‖²
```

Le minimiseur existe et est **unique** pour tout `v` : la fonction minimisée
est fortement convexe (le terme quadratique) même si `f` ne l'est pas et
même si `dom f` est un sous-ensemble propre de Rⁿ (les fonctions à valeur
`+∞` encodent des contraintes).

**Lecture** : `prox_f(v)` est le compromis entre « rester près de `v` »
(terme quadratique) et « descendre `f` » (terme `f(x)`). Pour
`f = ι_C` (fonction indicatrice d'un ensemble fermé convexe `C`),
`prox_f(v) = Π_C(v)` : le proximal **généralise la projection**.

### Bloc 2.2 — Callout « Deux conventions de notation »

`Callout type="warning" title="Deux conventions coexistent dans la littérature"`

Deux écritures du même objet circulent :

- Parikh & Boyd 2014, eq. (1.2) : `prox_{λf}(v) = argmin f(x) + (1/(2λ))‖x−v‖²`
- Boyd et al. 2011, §4.1 : `prox_{f,ρ}(v) = argmin f(x) + (ρ/2)‖x−v‖²`

C'est le **même** opérateur avec un reparamétrage :
`prox_{f,ρ}` (ADMM) = `prox_{(1/ρ)f}` (PB). Le reste de la leçon utilise la
convention Parikh & Boyd. Conséquence pratique : dans l'ADMM (section 5), le
seuillage doux apparaît avec le paramètre `λ/ρ`, alors qu'en descente
proximale (section 3) il apparaît avec `λ/L`.

### Bloc 2.3 — ExampleBlock « Soft-thresholding : le proximal du ‖·‖₁ »

`ExampleBlock number="PB14, §6.5.2, eq. (6.9)"`

Pour `f = ‖·‖₁`, la minimisation est séparable coordonnée par coordonnée.
En une dimension : `min_x |x| + (1/(2λ))(x−v)²`.

- Si `v > λ` : le minimum est en `x = v − λ` (le sous-différentiel de `|x|`
  vaut `{1}` et l'équation `1 + (x−v)/λ = 0` donne `x = v−λ`).
- Si `|v| ≤ λ` : le minimum est en `x = 0` (0 appartient à
  `∂|0| = [−1, 1]` et `(1/λ)(0−v) ∈ [−1,1]` exactement quand `|v| ≤ λ`).
- Si `v < −λ` : symétriquement, `x = v + λ`.

D'où l'opérateur de **seuillage doux** :

```
(prox_{λ‖·‖₁}(v))_i = S(v_i, λ) = (v_i − λ)_+ − (−v_i − λ)_+
                  = sign(v_i) · max(|v_i| − λ, 0)
```

**C'est la clé du Lasso** : `S(v, λ)` annule *exactement* les coordonnées
dont la magnitude est ≤ λ (les « petites » coordonnées), et rétrécit les
autres. On retrouve mot pour mot la propriété de sélection automatique de
variables enseignée à la Partie V, leçon 4 (Définition 5.2 et le losange L1) —
mais maintenant avec une **formule exacte** et un algorithme pour l'obtenir
sans LARS.

### Bloc 2.4 — ExampleBlock « Le proximal du ½ρ‖·‖₂² »

`ExampleBlock` (calcul direct, au-delà du cours)

Pour `g(x) = (ρ/2)‖x‖₂²` (Ridge) : `min_x (ρ/2)‖x‖₂² + (1/(2λ))‖x−v‖²` est
quadratique strictement convexe ; l'équation du premier ordre
`ρx + (x−v)/λ = 0` donne

```
prox_{λ·(ρ/2‖·‖₂²)}(v) = (λ/(λ + ρ)) · v
```

Contrairement au Lasso, **aucune coordonnée n'est annulée** : le Ridge
rétrécit uniformément (facteur `λ/(λ+ρ) < 1`). C'est exactement la
différence de comportement Ridge vs Lasso de la Partie V, leçon 4, mais vue
du côté de l'algorithme.

### Bloc 2.5 — TheoremBlock « Proximal = résolvante du sous-différentiel »

`TheoremBlock number="PB14, §3.2, eq. (3.4)"`

Pour `f` convexe fermée propre et `λ > 0` :

```
prox_{λf} = (I + λ∂f)⁻¹
```

c'est-à-dire que `z = prox_{λf}(x)` **si et seulement si**
`0 ∈ ∂f(z) + (1/λ)(z − x)`.

**Esquisse de la preuve** (PB14 §3.2) : `z ∈ (I + λ∂f)⁻¹(x)`
⟺ `x ∈ z + λ∂f(z)` ⟺ `0 ∈ ∂f(z) + (1/λ)(z − x)`
⟺ `0 ∈ ∂_z ( f(z) + (1/(2λ))‖z − x‖² )`, qui est la condition nécessaire et
suffisante (forte convexité) pour que `z` minimise cette fonction.
L'opérateur `(I + λ∂f)⁻¹` est la *résolvante* de `∂f` : c'est une **fonction**
(valeur simple), bien que `∂f` soit une relation à valeurs en ensembles —
car le proximal minimise une fonction fortement convexe.

**Pourquoi c'est important** : la condition d'optimalité d'un problème
composite `min f(x) + g(x)` (f lisse, g non lisse) est
`0 ∈ ∇f(x*) + ∂g(x*)`. Le théorème ci-dessus dit que `x*` la satisfait
**si et seulement si** `x* = prox_{λg}(x* − λ∇f(x*))` — le point fixe d'un
opérateur qu'on *sait construire*. C'est le pont vers la section 3.

### Bloc 2.6 — TheoremBlock « Décomposition de Moreau »

`TheoremBlock number="PB14, §2.5, eq. (2.4)"`

Pour toute fonction convexe fermée propre `f` et tout `v` :

```
v = prox_f(v) + prox_{f*}(v)
```

où `f*` est la conjugée convexe de `f`. « This property, known as Moreau
decomposition, is the main relationship between proximal operators and
duality. »

**Conséquence pratique** (PB14 §6.5.2) : comme `‖·‖₁* = ι_B` avec
`B = {w | ‖w‖∞ ≤ λ}` (boule duale), on a
`prox_{λ‖·‖₁}(v) = v − Π_B(v)` : le soft-thresholding s'obtient en
*tronquant* `v` en `[−λ, λ]` et en soustrayant. Le proximal d'une norme se
ramène toujours à une projection sur la boule duale — un résultat de
dualité/Fenchel directement exploitable. (Ceci prépare le panneau expert
« Dualité de Fenchel–Legendre », Partie I, leçon 2 — au-delà du cours.)

### Bloc 2.7 — InteractiveSection (Démo 1) : `ProxOperator1D`

`InteractiveSection number="P.1" title="Le proximal en 1D : visualiser le compromis"`

Démo 1D : pour `f = λ|·|` et `g = (ρ/2)·(·)²`, tracer
`x ↦ f(x) + (1/2)(x−v)²` (resp. `+ (1/(2λ))(x−v)²`) et marquer l'argmin.
Glisseurs `v` et `λ` (ou `ρ`) ; marqueur mobile à `S(v,λ)` (resp.
`λv/(λ+ρ)`). Légende : « le point rouge minimise la courbe — c'est le
proximal ». Module mathématique requis : `src/lib/math/proximal.ts`,
fonctions `softThreshold`, `proxL2Squared`, et une fonction `prox1DCurve(v,
lambda, n)` produisant les points de la courbe (voir section « Démos
proposées »).

---

## Section 3 — `descente-proximale` — La descente proximale (ISTA)

### Bloc 3.1 — DefinitionBlock « Algorithme ISTA / descente proximale »

`DefinitionBlock number="PB14, §4.2, eq. (4.6)"`

Pour minimiser `F(x) = f(x) + g(x)` (f, g convexes fermées propres,
`f` différentiable à gradient L-Lipschitz) :

```
x^{k+1} = prox_{(1/L)·g}(x^k − (1/L)·∇f(x^k))
```

avec pas constant `λ = 1/L` (plus généralement tout `λ ∈ (0, 1/L]`, et même
`λ < 2/L` pour la convergence — PB14 §4.2). Chaque itération : **un pas de
gradient sur la partie lisse, puis un proximal sur la partie non lisse**
— d'où le nom *forward-backward* (Euler explicite sur `f`, implicite sur `g`,
PB14 §4.2 « Forward-backward integration of gradient flow »).

Pour le Lasso avec `f(θ) = ½‖y − Xθ‖₂²`, `g(θ) = λ‖θ‖₁` :
`∇f(θ) = Xᵀ(Xθ − y)`, `L = λ_max(XᵀX)`, et le pas devient

```
θ^{k+1} = S_{λ/L}( θ^k − (1/L)·Xᵀ(Xθ^k − y) )
```

— c'est l'**ISTA** (iterative shrinkage-thresholding algorithm, PB14 §7.1.1 /
BT09 eq. (1.4)–(1.5)).

### Bloc 3.2 — TheoremBlock « Taux O(1/k) »

`TheoremBlock number="BT09, Théorème 3.1"`

Soit `{x^k}` la suite ISTA (pas constant `1/L` ou backtracking). Alors pour
tout `k ≥ 1` et tout minimiseur `x*` :

```
F(x^k) − F(x*) ≤ ( L·‖x^0 − x*‖² ) / (2k)
```

(avec un facteur `α = η` en plus en mode backtracking, `η > 1`). C'est le
même **ordre** de taux que la descente de gradient convexe enseignée
(Thm 3.4 de `optim.typ` : `f(x^k) − f(x*) ≤ L‖x⁰−x*‖²/(2k)`) — mais valable
pour un problème **non lisse**. Conséquence : obtenir une précision `ε` en
valeur coûte `O(L·‖x⁰−x*‖²/ε)` itérations, chacune coûtant un produit
matrice-vecteur par `X` et par `Xᵀ` (PB14 §7.1.1) — indépendante de la
taille de `d` pour la partie proximal.

### Bloc 3.3 — Callout « Cas particuliers : la descente proximale est une généralisation »

`Callout type="insight" title="Un algorithme, trois visages"` (PB14 §4.2 « Special cases »)

- `g = ι_C` (contrainte) : `prox = Π_C` → **gradient projeté**.
- `f = 0` : → **algorithme du point proximal** (résolvante itérée).
- `g = 0` : → **descente de gradient classique**.

La descente proximale est donc l'unique cadre qui contient les trois
algorithmes appris en Partie I *et* le Lasso.

### Bloc 3.4 — ExampleBlock « Pourquoi le taux ne peut pas être meilleur (sans accélération) »

`ExampleBlock` (au-delà du cours, intuition — PB14 §4.3, BT09 §1.2)

Le taux `O(1/k)` de l'ISTA est **optimal au pire cas** parmi les méthodes au
premier ordre (au même titre que celui du gradient pour les fonctions
lisses, sens de Nemirovsky–Yudin 1979). L'accélération de Nesterov (1983)
prouve qu'on peut faire `O(1/k²)` pour les fonctions lisses — la question
ouverte (1983→2009) était : et pour un problème *composite* (lisse + non
lisse) ? FISTA (Beck & Teboulle 2009) répond oui, sans changer le coût
d'itération. C'est l'objet de la section suivante.

---

## Section 4 — `fista` — FISTA : l'accélération

### Bloc 4.1 — DefinitionBlock « Algorithme FISTA »

`DefinitionBlock number="BT09, eq. (4.1)–(4.3)"`

Même problème `min f(x) + g(x)`, `∇f` L-Lipschitz. FISTA ajoute à l'ISTA un
**point extrapolé** `y^k` (le momentum) :

```
Entrée : L = L(f), x^0
Étape 0 : y^1 = x^0,  t_1 = 1
Étape k (k ≥ 1) :
  x^k     = prox_{(1/L)·g}( y^k − (1/L)·∇f(y^k) )        (4.1)
  t_{k+1} = (1 + √(1 + 4·t_k²)) / 2                       (4.2)
  y^{k+1} = x^k + ((t_k − 1)/t_{k+1})·(x^k − x^{k−1})     (4.3)
```

Le seul changement par rapport à l'ISTA : le proximal est évalué au point
*extrapolé* `y^k` (mélange de `x^k` et `x^{k−1}`) plutôt qu'à `x^{k−1}`.
Le coût d'itération est **identique** (un gradient + un proximal) ; le surcoût
de (4.2)–(4.3) est marginal (BT09 §4). La récurrence (4.2) donne
`t_k ≥ (k+1)/2` (BT09, Lemme 4.3) — le « momentum » croît linéairement.

**Variante backtracking** (BT09 §4) : si `L` est inconnu, on choisit
`L_k` par backtracking (le plus petit `L̄ = η^{i_k}L_{k−1}` tel que le
modèle quadratique majorant soit vérifié) ; le taux est alors garanti avec
`α = η` au lieu de `α = 1`. (PB14 §4.2–§4.3 donnent la même line search.)

### Bloc 4.2 — TheoremBlock « Taux O(1/k²) — optimal »

`TheoremBlock number="BT09, Théorème 4.4"`

Soit `{x^k}` la suite FISTA (pas constant). Alors pour tout `k ≥ 1` et tout
minimiseur `x*` :

```
F(x^k) − F(x*) ≤ ( 2·L·‖x^0 − x*‖² ) / (k + 1)²
```

Comparaison avec l'ISTA : `C/k` contre `2C/(k+1)²`. Pour atteindre une
précision `ε` : `O(√(C/ε))` itérations au lieu de `O(C/ε)` — **le carré
s'épare** (BT09 : « which clearly improves ISTA »).

Ce taux est **optimal au pire cas** parmi les méthodes au premier ordre pour
les problèmes convexes composites lisses + convexes : il ne peut pas être
amélioré sans information supplémentaire (BT09 §1.2, §4, d'après Nesterov
1983 et Nemirovsky–Yudin 1979 ; PB14 §4.3 « cannot be improved further »).

### Bloc 4.3 — Callout « Attention : le taux est en *valeur*, pas en *distance* »

`Callout type="warning" title="Ce que le théorème dit — et ne dit pas"`

Le Théorème 4.4 borne `F(x^k) − F*`, **pas** `‖x^k − x*‖`. La convergence de
la *suite* `{x^k}` vers un minimiseur est un résultat distinct, qui vient du
cadre forward-backward (Combettes & Wajs 2005, Thm 3.4 — section 6) : la
suite converge faiblement (toujours) et fortement sous des hypothèses
usuelles (dimension finie + conditions standard). Ne jamais écrire « FISTA
converge en `O(1/k²)` » sans préciser : **en valeur objective**.

### Bloc 4.4 — InteractiveSection (Démo 2) : `FistaLassoAnimator`

`InteractiveSection number="P.2" title="ISTA vs FISTA vs ADMM sur un Lasso synthétique"`

Le cœur de la leçon : un Lasso `min ½‖y − Xθ‖² + λ‖θ‖₁` synthétique
(`n = 60`, `d = 12`, seed fixe, `X` gaussienne, `y` généré depuis un `θ*`
sparse de 5 non-nuls). Trois solveurs lancés sur le *même* problème :

- **ISTA** : `θ^{k+1} = S_{λ/L}(θ^k − (1/L)Xᵀ(Xθ^k − y))`, `L = λ_max(XᵀX)`
  (calcul exact par valeurs propres de `XᵀX`, `d × d`).
- **FISTA** : avec le momentum `t_k` de (4.2).
- **ADMM** : `x^{k+1} = (XᵀX + ρI)⁻¹(Xᵀy + ρ(z^k − u^k))`,
  `z^{k+1} = S_{λ/ρ}(x^{k+1} + u^k)`, `u^{k+1} = u^k + x^{k+1} − z^{k+1}`
  (BPC11 §6.4), système `12×12` résolu par élimination de Gauss (déjà dans
  `src/lib/math/util.ts`).

Courbe : `F(x^k) − F*` en fonction de `k`, **échelle logarithmique** (les
valeurs couvrent plusieurs ordres de grandeur — cf. AGENTS.md). `F*` est
estimé une fois par une longue exécution FISTA (et croisé avec la descente
par coordonnées déjà testée du cours, `lassoCoordinateDescent`, dans les
tests). Un curseur anime `k` le long de la courbe du solveur choisi ;
panneau de métriques : `k`, `F(x^k) − F*` (formaté `toExponential`), nombre
de coefficients non nuls de `θ^k`. Glisseurs : `λ`, `ρ` (ADMM).

**Lecture attendue** : FISTA descend nettement plus vite qu'ISTA (l'écart se
creuse dès `k ≈ 50`) ; ADMM suit ISTA en valeur (même ordre `O(1/k)` en
pratique) mais ses itérés `z^k` sont exactements sparses alors que les `x^k`
ne le sont que « presque » (PB14 §4.4) — visible dans le compteur de
coefficients non nuls.

Légende (obligatoire, honnête) : « Illustration sur un petit problème
synthétique (n=60, d=12, seed fixe) — les taux théoriques `O(1/k)` et
`O(1/k²)` sont des bornes au pire cas ; l'écart observé ici dépend du
conditionnement de `X`. Pas une benchmark. »

---

## Section 5 — `admm` — L'ADMM

### Bloc 5.1 — DefinitionBlock « ADMM : éclatement de variables »

`DefinitionBlock number="BPC11, §3.1, eq. (3.1)–(3.7)"`

L'ADMM (alternating direction method of multipliers) résout des problèmes où
l'objectif est **séparable après éclatement** de la variable :

```
minimize  f(x) + g(z)     subject to  Ax + Bz = c
```

(f, g convexes — **les deux peuvent être non lisses**, contrairement à la
descente proximale.) L'itération ADMM (forme échangée, `u = y/ρ`) :

```
x^{k+1} = argmin_x  f(x) + (ρ/2)‖Ax + Bz^k − c + u^k‖²     (3.5)
z^{k+1} = argmin_z  g(z) + (ρ/2)‖Ax^{k+1} + Bz − c + u^k‖²  (3.6)
u^{k+1} = u^k + Ax^{k+1} + Bz^{k+1} − c                     (3.7)
```

`ρ > 0` est la pénalité de la lagrangienne augmentée ; `u^k` est la somme
cumulée des résidus (`u^k = u^0 + Σ_{j≤k} r^j`, BPC11 §3.1.1).

**Mécanique** (BPC11 §3.1) : on forme la lagrangienne augmentée
`L_ρ(x,z,y) = f(x) + g(z) + yᵀ(Ax + Bz − c) + (ρ/2)‖Ax + Bz − c‖²` et on fait
un **seul pas Gauss–Seidel** sur `(x, z)` (x, puis z, puis le dual) au lieu
de minimiser conjointement — c'est cette alternance qui permet le
découplage. « ADMM can be viewed as a version of the method of multipliers
where a single Gauss–Seidel pass over x and z is used instead of the usual
joint minimization. »

### Bloc 5.2 — TheoremBlock « Convergence de l'ADMM »

`TheoremBlock number="BPC11, §3.2 (Assumptions 1–2)"`

Sous deux hypothèses :
1. `f` et `g` convexes fermées propres (peuvent être non différentiables,
   valoir `+∞`) ;
2. la lagrangienne non augmentée `L_0` possède un point selle (⟹ dualité
   forte),

les itérations ADMM **convergent** (résultat « basic but still very general »
; preuve en annexe A de BPC11). Aucun rang minimum n'est exigé de `A` ou `B`.
La leçon n'enseigne **pas** de taux en valeur pour l'ADMM : les taux
`O(1/k)`/`O(1/k²)` de l'ADMM sont des résultats de la littérature plus
récente, non vérifiés ici — ne pas les énoncer (cf. research.md, section 6).

### Bloc 5.3 — DefinitionBlock « L'ADMM appliqué au Lasso »

`DefinitionBlock number="BPC11, §6.3–§6.4, eq. (6.2)"`

Lasso `minimize ½‖Ax − b‖² + λ‖x‖₁`, écrit `min f(x) + g(z)` sous
`x − z = 0` avec `f(x) = ½‖Ax−b‖²`, `g(z) = λ‖z‖₁`. Les deux minimisations
ont une forme close (BPC11 §6.4) :

```
x^{k+1} = (AᵀA + ρI)⁻¹ (Aᵀb + ρ(z^k − u^k))     ← un Ridge (système SPD)
z^{k+1} = S_{λ/ρ}(x^{k+1} + u^k)                 ← soft-thresholding
u^{k+1} = u^k + x^{k+1} − z^{k+1}                ← dual
```

`AᵀA + ρI` est **toujours inversible** (`ρ > 0`) ; sa factorisation se cache
une fois pour toutes. « The x-update is essentially a ridge regression … ADMM
can be interpreted as a method for solving the lasso problem by iteratively
carrying out ridge regression. » (BPC11 §6.4)

**Généralisation** (BPC11 §6.3) : pour *n'importe quelle* perte convexe `l`,
`min l(x) + λ‖x‖₁` se résout par le même schéma — le x-update devient un
proximal de `l` (Newton si `l` est lisse, système linéaire si `l` est
quadratique). L'ADMM transforme un problème `l + λ‖·‖₁` en une **séquence
de problèmes `l` quadratiquement régularisés**. C'est ce qui rend l'ADMM
indispensable pour le Lasso logistique, le Lasso poisson, etc. — hors
périmètre de cette leçon (au-delà du cours).

### Bloc 5.4 — Callout « ADMM vs descente proximale : quand choisir ? »

`Callout type="summary" title="Le choix en pratique"`

| | Descente proximale (ISTA/FISTA) | ADMM |
|---|---|---|
| Découpage | `f` lisse + `g` non lisse | `f(x)` + `g(z)`, **les deux non lisses possibles**, sous contrainte linéaire |
| Coût d'itération | 2 produits matrice-vecteur + seuillage | Résolution d'un système (Ridge) + seuillage |
| Taux prouvé (valeur) | `O(1/k)` (ISTA), `O(1/k²)` (FISTA) | Convergence (BPC11 §3.2) ; pas de taux enseigné ici |
| Points d'ancrage | Les `x^k` sont « presque sparses » | Les `z^k` sont **exactement sparses** (PB14 §4.4) |
| Répartition | Naturellement parallèle (produits) | Découpable sur les exemples/features (BPC11 ch. 7–8, hors périmètre) |

En pratique, pour un Lasso de taille moyenne : **FISTA** si on veut la
convergence en valeur la plus rapide ; **ADMM** (ou la descente par
coordonnées enseignée) si on veut des itérés exactement sparses à chaque pas
ou un découpage distribué. (PB14 §4.4, BPC11 §6.4 ; choix heuristique —
au-delà du cours.)

---

## Section 6 — `liaison-sous-gradient-fenchel` — Le tout-en-un : sous-gradient, Fenchel, Douglas–Rachford

### Bloc 6.1 — Paragraphe « Les trois identités qui lient tout »

`Callout type="insight" title="Trois identités, un même objet"`

L'opérateur proximal apparaît simultanément dans trois cadres — c'est ce qui
le rend central (PB14 ch. 3, « Interpretations ») :

1. **Sous-différentiel** (PB14 §3.2, eq. (3.4)) :
   `prox_{λf} = (I + λ∂f)⁻¹`. Le proximal est la *résolvante* du
   sous-différentiel ; itérer `(I + λ∂g)⁻¹(I − λ∇f)` (descente proximale)
   cherche le point fixe équivalent à `0 ∈ ∇f(x*) + ∂g(x*)`.
2. **Fenchel / dualité** (PB14 §2.5, eq. (2.4)) :
   `v = prox_f(v) + prox_{f*}(v)` (Moreau) — le proximal de `f` et celui de
   sa conjugée se complètent comme deux projections orthogonales. En
   particulier, le soft-thresholding se calcule par troncature (projection
   sur la boule duale, PB14 §6.5.2).
3. **Régularisation de Moreau–Yosida** (PB14 §3.1) : l'enveloppe
   `e_λf(v) = min_x f(x) + (1/(2λ))‖x−v‖²` est convexe et **différentiable**
   même si `f` ne l'est pas — le proximal « lisse » les fonctions.

Ces trois angles sont le fil rouge des panneaux experts de la Partie I
(« Sous-gradient et optimisation non lisse », P1/L1 ; « Dualité de
Fenchel–Legendre », P1/L2) — **au-delà du cours** ; cette leçon se contente
d'énoncer les identités, sans les preuves générales.

### Bloc 6.2 — Paragraphe « Douglas–Rachford : l'ADMM est une méthode de splitting »

`Callout type="note" title="Nom alternatif : Douglas–Rachford splitting"`

Pour `min f(x) + g(x)` **sans** contrainte (i.e. `A = I`, `B = −I`, `c = 0`),
l'ADMM (section 5) se réécrit, avec la convention PB, comme (PB14 §4.4) :

```
x^{k+1} = prox_{λf}(z^k − u^k)
z^{k+1} = prox_{λg}(x^{k+1} + u^k)
u^{k+1} = u^k + x^{k+1} − z^{k+1}
```

PB14 l'appelle aussi **Douglas–Rachford splitting** et signale : « This
method converges under more or less the most general possible conditions; see
[BPC11, §3.2] for details. » C'est la méthode de splitting la plus générale
pour la somme de deux convexes — la descente proximale (section 3) en est le
cas particulier où `f` est lisse (on peut alors évaluer `∇f` au lieu de son
proximal). La convergence générale (faible, et forte sous conditions) est
celle du Théorème 3.4 de Combettes & Wajs 2005 (cf. research.md §4.2) :
pas proximal `γ ∈ ]0, 2/L[`, relaxation `λ ∈ ]0, 1]`.

### Bloc 6.3 — Paragraphe « Ce que ça veut dire pour le Lasso du cours »

Pour le Lasso de la Partie V (leçon 4), on sait maintenant **trois** façons
de le calculer :

- **LARS** (Algorithme 5.1 de `regularization.typ` — enseigné) : calcule tout
  le *lasso path* en un coup, exploitant la structure linéaire par morceaux
  (Définition 5.3).
- **Descente par coordonnées** (Algo 3.13 de `optim.typ` — enseignée, implémentée
  dans le cours) : un sweep = `d` résolutions 1D par seuillage doux.
- **FISTA / ADMM** (cette leçon — au-delà du cours) : scalables en parallèle,
  taux connu (FISTA), itérés sparses (ADMM).

Les quatre méthodes produisent le même `θ̂_Lasso(λ)` (unicité : `½‖y−Xθ‖²`
strictement convexe si `X` est de rang colonne plein, `+ λ‖θ‖₁` convexe).
Le choix est un compromis *algorithme* (coût, parallélisme, précision), pas
un compromis *statistique* — les estimateurs sont identiques.

---

## Section 7 — `exemples-psy` — Exemple guidé : FISTA sur un Lasso logistique

### Bloc 7.1 — Pseudo-code (exemple exécutable)

`ExampleBlock number="pseudo-code, d'après BT09 (4.1)–(4.3) et BPC11 §6.3"`

Lasso logistique (réponse binaire) :

```
minimize  ℓ(θ) + λ‖θ‖₁
où ℓ(θ) = Σ_i log(1 + e^{−y_i x_iᵀθ}),  y_i ∈ {−1, +1}
```

`ℓ` est convexe et `C^{1,1}`. Borne de Lipschitz **vérifiée par calcul
direct** (Hessien) : `∇²ℓ(θ) = Xᵀ D(θ) X` où `D(θ)` est diagonale avec
`D_ii = σ(s_i)(1−σ(s_i))` (s_i = y_i x_iᵀθ, σ la sigmoïde) — chaque
diagonale vaut au plus `1/4` (maximum de `p(1−p)`), donc
`∇²ℓ ⪯ (1/4)·XᵀX` et `L = (1/4)·λ_max(XᵀX)` borne valide (calcule en
deux lignes, aucune source nécessaire — le calcul est dans la leçon).
FISTA (BT09 (4.1)–(4.3)) :

```
Entrée : X (n×d), y (n), λ, L = (1/4)·λ_max(XᵀX)
θ⁰ = 0 ;  y¹ = 0 ;  t₁ = 1
Pour k = 1, 2, 3, … :
    g = −Xᵀ ( y ⊙ ( e^{−y x θ} / (1 + e^{−y x θ}) ) )        # ∇ℓ(y^k)
    θᵏ = S_{λ/L}( yᵏ − (1/L)·g )                              # (4.1) : prox_{(1/L)·λ‖·‖₁}
    t_{k+1} = (1 + √(1 + 4 t_k²)) / 2                          # (4.2)
    y^{k+1} = θᵏ + ((t_k − 1)/t_{k+1})(θᵏ − θ^{k−1})          # (4.3)
Arrêt : ‖θᵏ − θ^{k−1}‖ < tol  ou  k = K_max
```

Chaque itération : un produit `Xᵀ(·)` (n×d), un seuillage (d) — **pas de
système à résoudre**. C'est la différence structurelle avec l'ADMM sur le
même problème (BPC11 §6.3 : x-update = Newton sur la logistique régularisée).
La démo P.2 de cette page implémente la version **moindres carrés** du même
pseudo-code (le cas `ℓ(θ) = ½‖y−Xθ‖²`), où `L = λ_max(XᵀX)` est calculé
exactement.

---

## Section 8 — `synthese` — Synthèse

### Bloc 8.1 — Callout « Ce qu'il faut retenir »

`Callout type="summary" title="La boîte à outils proximale"`

1. **L'opérateur proximal** `prox_{λf}(v) = argmin f(x) + (1/(2λ))‖x−v‖²`
   est l'outil : unique, généralise la projection, et se calcule par
   soft-thresholding pour `‖·‖₁` (PB14 eq. (1.2), (6.9)).
2. **ISTA** (PB14 eq. (4.6), BT09 Thm 3.1) : gradient + proximal,
   `O(1/k)` en valeur — le gradient des problèmes composites.
3. **FISTA** (BT09 (4.1)–(4.3), Thm 4.4) : + momentum `t_k`, `O(1/k²)` —
   optimal au pire cas ; coût d'itération identique.
4. **ADMM** (BPC11 eq. (3.5)–(3.7)) : éclatement + multiplicateur ; Lasso =
   « Ridge itérée + seuillage » ; itérés `z^k` exactement sparses.
5. **Le lien profond** : `prox = (I + λ∂f)⁻¹` (PB14 (3.4)), Moreau
   `v = prox_f(v) + prox_{f*}(v)` (PB14 (2.4)), Douglas–Rachford = ADMM sans
   contrainte (PB14 §4.4) — sous-gradient et Fenchel se rejoignent dans un
   seul objet.

### Bloc 8.2 — ExercisePanel « Exercice 1 — Calculer à la main »

`ExercisePanel number="1" title="Proximaux élémentaires"`

Soit `v = (3, −0.5, 2)ᵀ`, `λ = 1`.
(a) Calculer `prox_{1·‖·‖₁}(v)` (soft-thresholding, PB14 (6.9)).
(b) Calculer `prox_{1·(1/2‖·‖₂²)}(v)` (section 2.4, `ρ = 1`).
(c) Vérifier la décomposition de Moreau (PB14 (2.4)) : montrer que
`v = prox_{‖·‖₁}(v) + Π_{‖·‖∞ ≤ 1}(v)` en identifiant
`prox_{‖·‖₁*}(v) = Π_B(v)`.

`#snippet solution()` :
(a) `S(3,1) = 2`, `S(−0.5,1) = 0` (car `|−0.5| ≤ 1`), `S(2,1) = 1` →
`(2, 0, 1)ᵀ`. (b) `(1/(1+1))·v = (1.5, −0.25, 1)ᵀ`. (c) `Π_B(v) = (1, −0.5,
1)ᵀ` (troncature en `[−1,1]`) ; `(2,0,1)ᵀ + (1,−0.5,1)ᵀ = (3, −0.5, 2)ᵀ = v` ✓.

### Bloc 8.3 — ExercisePanel « Exercice 2 — Lire un taux »

`ExercisePanel number="2" title="Combien d'itérations ?"`

Un Lasso `min ½‖y−Xθ‖² + λ‖θ‖₁` avec `‖XᵀX‖ = 100`, `‖θ⁰ − θ*‖ = 10`,
`θ⁰ = 0`. On veut `F(θᵏ) − F* ≤ 10⁻⁴`.
(a) Borne supérieure du nombre d'itérations ISTA (BT09 Thm 3.1).
(b) Borne supérieure pour FISTA (BT09 Thm 4.4).
(c) Pourquoi la borne ISTA est-elle (ici) atteinte à l'égalité près, alors
que celle de FISTA n'est qu'une borne ?

`#snippet solution()` :
`C = L‖θ⁰−θ*‖² = 100·100 = 10⁴`.
(a) ISTA : `k ≥ C/(2ε) = 10⁴/(2·10⁻⁴) = 5·10⁷` itérations (borne
`L‖·‖²/(2k) ≤ ε`).
(b) FISTA : `(k+1)² ≥ 2C/ε = 2·10⁴/10⁻⁴ = 2·10⁸` → `k + 1 ≥ √(2)·10⁴ ≈
1.41·10⁴` → `k ≥ 14 142`.
(c) La borne ISTA est une **majoration** valable pour tout problème
L-lisse + convexe ; elle est au pire cas serrée (Nemirovsky–Yudin). Ici elle
est une borne, pas une prédiction : le comportement réel dépend du
conditionnement et de la géométrie. Idem pour FISTA — les deux sont des
bornes au pire cas, pas des lois de convergence exactes (au-delà du cours :
les taux asymptotiques exacts dépendent de propriétés supplémentaires, hors
périmètre).

### Bloc 8.4 — Quiz (5 questions)

`InteractiveSection number="E.8" title="Quiz — prox, FISTA et ADMM"`

`Quiz items={getQuizQuestions('p1/proximal')}` — 5 questions dans
`src/lib/quiz/questions/part1.ts`, tag `p1/proximal` (voir section « Démos
proposées » pour le contenu exact).

---

## Bibliographie (Bloc `Bibliography`)

1. Parikh, N. & Boyd, S. (2014). « Proximal Algorithms ». *Foundations and
   Trends in Optimization*, 1(3):123–231. DOI 10.1561/2400000003.
   https://web.stanford.edu/~boyd/papers/prox_algs.html
2. Beck, A. & Teboulle, M. (2009). « A Fast Iterative Shrinkage-Thresholding
   Algorithm for Linear Inverse Problems ». *SIAM Journal on Imaging
   Sciences*, 2(1):183–202. DOI 10.1137/080716542.
   https://www.tau.ac.il/~becka/FISTA.pdf
3. Boyd, S., Parikh, N., Chu, E., Peleato, B. & Eckstein, J. (2011). «
   Distributed Optimization and Statistical Learning via the Alternating
   Direction Method of Multipliers ». *Foundations and Trends in Machine
   Learning*, 3(1):1–122. DOI 10.1561/2200000016.
   https://web.stanford.edu/~boyd/papers/admm_distr_stats.html
4. Combettes, P. L. & Wajs, V. R. (2005). « Signal Recovery by Proximal
   Forward-Backward Splitting ». *Multiscale Modeling and Simulation*,
   4(4):1164–1200. DOI 10.1137/050626090.
   https://pcombet.math.ncsu.edu/mms1.pdf
5. Nesterov, Y. E. (1983). « A method for solving the convex programming
   problem with convergence rate O(1/k²) ». *Dokl. Akad. Nauk SSSR*,
   269:543–547 (en russe). — cité par [Beck & Teboulle 2009, ref. 27].

---

## Démos proposées (à implémenter)

### Démo P.1 — `ProxOperator1D.svelte` (`src/lib/components/demos/`)

- **But** : visualiser en 1D le compromis « proche de v » vs « descendre f »
  et l'argmin = proximal.
- **Module mathématique** : `src/lib/math/proximal.ts` (nouveau) :
  - `softThreshold(v: number, lambda: number): number` — `S(v, λ)` (PB14 (6.9));
  - `proxL2Squared(v: number, rho: number): number` — `λv/(λ+ρ)` (λ = 1 ici) ;
  - `prox1DCurve(v: number, kind: 'l1' | 'l2', lambda: number, n: number): [number, number][]`
    — points de la courbe `x ↦ f(x) + (1/(2λ))(x−v)²` pour le tracé SVG.
- **Contrôles** : sliders `v ∈ [−4, 4]`, `λ ∈ [0.1, 3]` ; bascule L1 / L2².
- **Rendu** : SVG minimal (courbe + point argmin + segment vertical),
  `Figure type="chart"` ; `KatexInline` pour `S(v,λ)`.

### Démo P.2 — `FistaLassoAnimator.svelte` (`src/lib/components/demos/`)

- **But** : courbe de convergence `F(x^k) − F*` (échelle log) d'ISTA, FISTA,
  ADMM sur un Lasso synthétique seedé, avec animation du curseur `k`.
- **Module mathématique** : `src/lib/math/proximal.ts` (suite) :
  - `lassoObjectiveValue(theta, X, y, lambda): number` — `½‖y−Xθ‖² + λ‖θ‖₁` ;
  - `lassoLipschitzConstant(X): number` — `λ_max(XᵀX)` via
    `symmetricEigenvalues` (`util.ts` existante) ;
  - `runProxLasso(algo: 'ista'|'fista'|'admm', X, y, lambda, opts): { theta, objectiveGap, referenceValue }`
    — `opts = { maxIter, stepSize?, rho?, referenceValue? }` ; si
    `referenceValue` absent, estimé par une longue exécution FISTA.
  - `softThresholdVec(v: number[], lambda: number): number[]` (version
    vectorielle, exportée depuis `regularization.ts` — la fonction privée
    existante `softThreshold` y est **exportée** et réutilisée, pas dupliquée).
- **Données** : `mulberry32` + `combineSeed` (`util.ts`) — `n = 60`, `d = 12`,
  `X` gaussienne, `θ*` avec 5 non-nuls, `y = Xθ* + 0.1·ε`.
- **Contrôles** : sélection ISTA/FISTA/ADMM, sliders `λ ∈ [0.05, 2]`,
  `ρ ∈ [0.1, 5]` (ADMM) ; bouton lecture/pause du curseur `k`.
- **Rendu** : `CurveChart` (`yScaleType="log"`, `curve="linear"`) avec 3
  courbes ; `curveDots` pour le curseur animé ; panneau métriques (`k`,
  `F(x^k)−F*` via `toExponential(2)`, `‖θ^k‖₀`).
- **Légende honnête** (obligatoire) : petit problème synthétique seedé,
  bornes au pire cas, pas une benchmark.

### Contenu du quiz (5 questions, tag `p1/proximal`)

1. **Q1** (soft-thresholding) : `prox_{λ‖·‖₁}(v)` en 1D vaut ? →
   `sign(v)·max(|v|−λ, 0)` (PB14 (6.9)). Options piégées : `sign(v)·max(|v|−λ,0)·λ`,
   `v·λ/(λ+|v|)`, `v` si `|v|>λ` sinon 0 sans rétrécissement.
2. **Q2** (taux) : différence de taux ISTA vs FISTA ? → `O(1/k)` vs
   `O(1/k²)` **en valeur objective** (BT09 Thm 3.1 / 4.4). Piège : « en
   distance aux itérés ».
3. **Q3** (ADMM Lasso) : le x-update de l'ADMM pour le Lasso est ? →
   `(AᵀA + ρI)⁻¹(Aᵀb + ρ(z^k − u^k))` — une **Ridge** (BPC11 §6.4). Pièges :
   « un OLS », « un soft-thresholding », « un pas de gradient ».
4. **Q4** (identité) : `prox_{λf}(x)` caractérise `z` par ? →
   `0 ∈ ∂f(z) + (1/λ)(z−x)`, i.e. `prox_{λf} = (I+λ∂f)⁻¹` (PB14 (3.4)).
5. **Q5** (pourquoi proximal) : la descente proximale s'applique quand ? →
   l'objectif se découpe en `f` lisse (C^{1,1}) + `g` convexe (éventuellement
   non lisse), et le proximal de `g` est calculable (PB14 §4.2, BT09 §2.2).
   Piège : « f et g lisses » (alors c'est juste du gradient).

---

## Vérification finale du brouillon (checklist du brief)

- [x] Chaque théorème/étape de preuve vérifié contre une source primaire
      (PDF lus en entier — cf. research.md).
- [x] Aucune affirmation au-delà du cours présentée comme du cours
      (Callout d'ouverture + attribution par bloc + mention « au-delà du
      cours » dans les blocs 6.1, 6.2, 5.4, 7.1(c)).
- [x] Références complètes (auteur, année, venue, DOI/lien) — avec
      **corrections** des venues erronées du brief (PB14 = F&T Optimization ;
      BT09 = SIAM J. Imaging Sci. ; CW05 = MMS).
- [x] Formules valides KaTeX, sûres dans `String.raw` (pas de backtick, pas
      de `\` non échappé ; `‖` est utilisé dans le brouillon mais devra être
      écrit `\|` ou `\lVert … \rVert` dans le `.svelte` — `String.raw`
      `\\lVert` est sûr).
- [x] Structure du brouillon reflète une leçon expert existante
      (`part1/lesson3-adam` : PageTemplate, TableOfContents, TheorySection,
      blocs, InteractiveSection + DeferredDemo, ExercisePanel, Quiz,
      Bibliography).
- [x] Brouillon lisible en M2.
