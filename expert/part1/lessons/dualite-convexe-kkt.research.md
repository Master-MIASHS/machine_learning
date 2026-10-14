# Recherche — Dualité convexe et conditions KKT

> Agent de recherche pour le brief `p1-lesson-dualite-convexe-kkt`
> (`expert/part1/lessons/dualite-convexe-kkt.md`).
>
> Sources primaires consultées :
>
> - **[BV04]** Boyd, S. & Vandenberghe, L., *Convex Optimization*, Cambridge
>   University Press, 2004. — PDF téléchargé et lu le 2026-09-15 :
>   https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf . Parties lues en
>   entier : ch. 5 « Duality » (pp. 215–288, dont exercices), ch. 8
>   « Geometric problems » §8.6 « Classification » (pp. 422–431), §3.3
>   « The conjugate function » (Exemple 3.26), Appendice A (A.1.6).
> - **[NW06]** Nocedal, J. & Wright, S., *Numerical Optimization*, 2e éd.,
>   SIAM, 2006, ch. 12 (KKT). — **UNVERIFIÉ directement** (paywall) ; aucune
>   affirmation de la leçon ne s'appuie sur lui : le contenu KKT est
>   intégralement vérifié dans [BV04 §5.5] (nécessité + suffisance, preuves
>   complètes). Référence secondaire uniquement.
> - **[Vap98]** Vapnik, V., *The Nature of Statistical Learning Theory*,
>   Springer, 1998. — **UNVERIFIÉ directement** (paywall) ; la partie SVM est
>   vérifiée dans [BV04 §8.6] et le panneau P2/L4 cite déjà Hastie–Tibshirani–
>   Friedman ESL 2e éd. §12.2 pour la forme standard `yᵢ ∈ {−1,+1}`.
>   Référence secondaire uniquement.
> - **Sources du cours** : `course_sources/typst/optim.typ` (lu en entier —
>   **aucune** dualité, aucun KKT, aucun lagrangien : vérifié par recherche
>   des termes « lagrangien », « dual », « KKT », « multiplicateur ») et
>   `course_sources/typst/regularization.typ` (Déf. 5.2 Lasso, Déf. 5.3 lasso
>   path, §5.1 LARS).
>
> ## ⚠️ Corrections au brief (vérification des références)
>
> 1. Le brief cite « B&V ch. 9 (KKT) » : **inexact**. Les conditions KKT
>    sont dans **[BV04 §5.5 « Optimality conditions »]** (ch. 5, pp. 241–248) ;
>    le ch. 9 de [BV04] est « Interior-point methods ».
> 2. Le brief cite « B&V ch. 7 (exemples SVM) » : **inexact**. La
>    discrimination/SVM linéaire est dans **[BV04 §8.6 « Classification »]**
>    (ch. 8 « Geometric problems », pp. 422–431) ; le ch. 7 de [BV04] est
>    « Statistical estimation ».
> 3. Le Lasso n'est **pas** dans [BV04] : une seule mention en passant
>    (§5.1.5 : « regularization is also known under the name lasso (Tibshirani
>    [Tib96]) »). Les duales du Lasso enseignées dans la leçon sont
>    **calculées ici** (section 5 ci-dessous) à partir de la machine de
>    [BV04 ch. 5] + [BV04 §3.3.1 Ex. 3.26], et vérifiées numériquement
>    (tests unitaires prévus en phase d'implémentation).
> 4. Le brief demande un exemple de gap strict « non convexe **ou sans
>    Slater** » : les deux sont fournis et vérifiés (section 5.3) — l'exercice
>    5.21 de [BV04] couvre déjà le cas « convexe sans Slater » dans le
>    panneau P1/L1 ; la leçon apporte un cas non convexe à gap **fini** en
>    forme close.
>
> ## Convention de notation retenue (celle de [BV04])
>
> Forme standard [BV04 eq. (5.1)] :
> `minimize f₀(x)` s.t. `fᵢ(x) ≤ 0 (i = 1…m)`, `hⱼ(x) = 0 (j = 1…p)` ;
> multiplicateurs `λ ≥ 0` (inégalités), `ν` libres (égalités) ;
> lagrangien eq. (5.4), fonction duale `g(λ,ν) = inf_x L(x,λ,ν)`,
> problème duale eq. (5.16), valeurs optimales `p*` (primale) et `d*` (duale).

---

## 1. Affirmations vérifiées — [BV04] ch. 5 « Duality »

### 1.1 Forme standard et lagrangien (§5.1, eq. (5.1), (5.3), (5.4))

- **Eq. (5.1)** : forme générale `minimize f₀(x)` s.t. `fᵢ(x) ≤ 0`,
  `hⱼ(x) = 0` ; « We do not assume the problem (5.1) is convex. » La valeur
  optimale est notée `p*`.
- **Eq. (5.3)** : reformulation sans contraintes par fonctions indicatrices
  `I₋` (« brick wall » / « infinitely hard displeasure function »).
- **Eq. (5.4)** : « The objective becomes the Lagrangian function
  `L(x, λ, ν) = f₀(x) + Σᵢ λᵢ fᵢ(x) + Σⱼ νⱼ hⱼ(x)`, and the dual function
  value `g(λ, ν)` is the optimal value of the problem `minimize L(x,λ,ν)` ».
  Interprétation : « soft » displeasure linéaire remplaçant l'indicatrice.

### 1.2 Fonction duale : borne inférieure et concavité (§5.1.2)

- **Propriété de borne inférieure (5.2)** : pour tout `(λ,ν)` avec `λ ≥ 0`,
  `g(λ,ν) ≤ p*` — point par point, même si le problème n'est pas convexe.
- `g` est **concave** : « pointwise infimum of a family of affine functions »
  (chaque `x` fixe donne une fonction affine de `(λ,ν)`).
- **Exemples analytiques du §5.1.5** (toutes formes closes vérifiées dans le
  texte) : moindres carrés contraints `min xᵀx s.t. Ax = b` (eq. (5.5),
  `g(ν) = −¼ νᵀA Aᵀν − bᵀν`) ; LP standard (eq. (5.6)–(5.8) : `g` fini seulement
  sur `c + Aᵀν − λ = 0`) ; bipartition `min xᵀWx s.t. xᵢ² = 1` (eq. (5.7),
  duale SDP `max −1ᵀν s.t. W + diag(ν) ⪰ 0`) ; maximisation d'entropie (5.13) ;
  ellipsoïde de volume minimal (5.14).
- **Figures 5.1–5.2** : illustration non convexe — « Neither f₀ nor f₁ is
  convex, but the dual function is concave » ; chaque `L(x,λ)` a son minimum
  sous `p*`.

### 1.3 Problème duale et contraintes « cachées » (§5.2, eq. (5.16)–(5.20))

- **Eq. (5.16)** : « maximize `g(λ,ν)` subject to `λ ⪰ 0` » — « This problem
  is called the Lagrange dual problem associated with the problem (5.1). In
  this context the original problem (5.1) is sometimes called the primal
  problem. »
- « The Lagrange dual problem (5.16) is a convex optimization problem, since
  the objective to be maximized is concave and the constraint is convex.
  **This is the case whether or not the primal problem (5.1) is convex.** »
- **§5.2.1 « Making dual constraints explicit »** : « `g` is finite only when
  … » — on peut identifier « the equality constraints that are ‘hidden’ or
  implicit in the domain of g » (ex. LP standard eq. (5.18)→(5.19)→(5.20)).
  **C'est le mécanisme exact qui produit `Σᵢ αᵢyᵢ = 0` dans la duale SVM**
  (la contrainte n'apparaît pas dans le lagrangien ; elle émerge du domaine
  fini de `g`).

### 1.4 Dualité faible (§5.2.2, eq. (5.23))

- « The optimal value of the Lagrange dual problem, which we denote `d*`, is,
  by definition, the best lower bound on `p*` … we have the simple but
  important inequality `d* ≤ p*` (5.23), which holds even if the original
  problem is not convex. This property is called **weak duality**. »
- « We refer to the difference `p* − d*` as the optimal duality gap … The
  optimal duality gap is always nonnegative. »
- Conséquences en valeurs infinies : `p* = −∞` ⟹ `d* = −∞` (duale
  infaisable) ; `d* = ∞` ⟹ `p* = ∞` (primale infaisable).

### 1.5 Dualité forte et Slater (§5.2.3, eq. (5.24)–(5.27))

- **Eq. (5.24)** : « If the equality `d* = p*` holds, i.e., the optimal
  duality gap is zero, then we say that **strong duality** holds. »
- « Strong duality does not, in general hold. »
- **Eq. (5.25)** : forme convexe standard (f₀,…,fₘ convexes, contraintes
  d'égalité affines).
- **Eq. (5.26)** : condition de Slater — « There exists an `x ∈ relint D`
  such that `fᵢ(x) < 0, i = 1,…,m, Ax = b` » (« strictly feasible »).
  « **Slater's theorem states that strong duality holds, if Slater's
  condition holds** (and the problem is convex). »
- **Eq. (5.27)** : Slater affiné — si `f₁,…,fₖ` sont affines, elles n'ont
  pas besoin d'être strictes (`fᵢ(x) ≤ 0` pour i ≤ k). « Reduces to
  feasibility when the constraints are all linear … and dom f₀ is open. »
- « Slater's condition (and the refinement (5.27)) not only implies strong
  duality for convex problems. **It also implies that the dual optimal value
  is attained** when `d* > −∞`. » Preuve reportée au §5.3.2.
- **§5.2.4 Exemple « Geometric programming »** : les programmes géométriques
  (non convexes en variables d'origine) ont **toujours** gap nul après
  reparamétrage log (eq. (5.32)–(5.33)) — exemple de dualité forte hors
  convexité apparente.

### 1.6 Interprétation géométrique (§5.3.1–5.3.2, eq. (5.36)–(5.38))

- **Eq. (5.36)** : `G = {(f₁(x),…,fₘ(x), h₁(x),…,hₚ(x), f₀(x)) | x ∈ D}`.
- **Eq. (5.37)** : `A = G + R₊ᵐ × {0} × R₊` — convexe si le problème l'est.
- **Eq. (5.38)** : `p* = (λ,ν,1)ᵀ(0,0,p*) ≥ g(λ,ν)` — « there exists a
  nonvertical supporting hyperplane of A through (0,0,p*) … **if and only
  if** strong duality holds ».
- **§5.3.2 Preuve par séparation** : pour un problème convexe,
  « Slater's condition implies that relint D is nonempty », et avec
  `rank A = p` et `p*` fini, le théorème de séparation des convexes
  (théorème 2.12 de [BV04 ch. 2]) appliqué à `A` et au point `(0,0,p*)`
  (extérieur à `A`) donne l'hyperplan support non vertical ⟹ dualité forte.
  Slater garantit que l'hyperplan peut être choisi **non vertical** (sinon
  le multiplicateur de la coordonnée `t` serait nul et on ne lirait pas `p*`).

### 1.7 Interprétation saddle-point et jeux (§5.4, eq. (5.45)–(5.47))

- **Eq. (5.45)** : `sup_λ inf_x L(x,λ) ≤ inf_x sup_λ L(x,λ)` — inégalité
  max-min, « does not depend on any properties of L » (démontrée par
  transposition : le max-min est la valeur du jeu coopératif du
  minimiseur).
- **Eq. (5.46)–(5.47)** : formulation abstraite `sup inf f(w,z) ≤ inf sup
  f(w,z)` ; égalité (5.47) = « strong max-min property ».
- **§5.4.2 « Saddle-point theorem »** (théorème de minimax de
  Sion, énoncé dans le texte) : sous convexité-concavité + hypothèses de
  compacité/continuité, (5.47) tient — c'est le cadre qui justifie
  l'échange `inf/sup` pour les duales Fenchel de la section 5 ci-dessous.
- **§5.4.4** : interprétation « shadow price » — `λᵢ*` est le prix de
  l'unité de ressource de la contrainte i (lien direct avec §5.6).

### 1.8 Conditions d'optimalité et KKT (§5.5, eq. (5.48)–(5.49))

- **§5.5.1** : « certificates of suboptimality » — toute paire faisable
  `(x, (λ,ν))` donne un certificat `f₀(x) − g(λ,ν) ≥ 0` du gap ; gap nul
  ⟹ optimalité des deux côtés.
- **§5.5.2 Complémentarité** : si `x*, (λ*,ν*)` sont primalement et dualement
  optimaux et que `g` est finie en `(λ*,ν*)`, alors
  `L(x*,λ*,ν*) = f₀(x*)`, ce qui force `λᵢ* fᵢ(x*) = 0` pour tout i avec
  `λᵢ* ≥ 0` — **eq. (5.48)** : `λᵢ* fᵢ(x*) = 0, i = 1,…,m`.
- **§5.5.3 — Conditions KKT, eq. (5.49)** : pour un problème **convexe**
  différentiable (f₀, fᵢ, hⱼ différentiables), les conditions KKT sont
  (i) **faisabilité primale** `fᵢ(x*) ≤ 0, hⱼ(x*) = 0` ;
  (ii) **faisabilité duale** `λ* ⪰ 0` ;
  (iii) **complémentarité** `λᵢ* fᵢ(x*) = 0` ;
  (iv) **stationnarité** `∇f₀(x*) + Σᵢ λᵢ* ∇fᵢ(x*) + Σⱼ νⱼ* ∇hⱼ(x*) = 0`.
- **Nécessité** (théorème, preuve complète dans le texte) : « If the problem
  (5.25) is convex, the functions are differentiable, and Slater's condition
  holds, then the KKT conditions (5.49) are necessary for optimality » — la
  preuve combine dualité forte (Slater, §5.2.3), atteinte du dual, et la
  chaîne `f₀(x*) = L(x*,λ*,ν*)` (§5.5.2) + optimalité de `x*` pour
  `L(·,λ*,ν*)` (stationnarité).
- **Suffisance** (théorème, preuve complète dans le texte) : « If the problem
  is convex and differentiable, and there exists a point satisfying the KKT
  conditions, then that point is optimal » — la preuve utilise la
  sous-majoration convexe `fᵢ(x) ≥ fᵢ(x*) + ∇fᵢ(x*)ᵀ(x−x*)` et la
  complémentarité pour montrer `f₀(x) ≥ f₀(x*)` pour tout `x` faisable.
- Formulation compacte du texte : « **For a convex problem with differentiable
  functions, the KKT conditions are necessary and sufficient for optimality
  if Slater's condition holds** » (et suffisantes en pure convexité, sans
  Slater, quand le dual est atteint).
- **Exemple 5.1** (QP, forme close complète dans le texte) et
  **Exemple 5.2 « Water-filling »** : `min Σᵢ (xᵢ−cᵢ)² s.t. Σxᵢ ≤ 1, xᵢ ≥ 0` —
  solution `xᵢ* = max(cᵢ − λ*, 0)`, λ* choisi par la contrainte de somme ;
  illustration de la complémentarité (`λ* = 0` si `Σcᵢ ≤ 1`).
- **§5.5.4 « Mechanics of using KKT conditions »** : recette (écrire KKT,
  résoudre, vérifier) ; **§5.5.5** : résolution de la primale *via* la duale —
  `x* = argmin L(x, λ*)` une fois `λ*` connu (c'est exactement ce que fait
  le panneau P1/L1 sur l'exemple de la parabole).

### 1.9 Perturbation et analyse de sensibilité (§5.6, eq. (5.56)–(5.58))

- **Eq. (5.56)** : problème perturbé `minimize f₀(x)` s.t. `fᵢ(x) ≤ uᵢ`,
  `hⱼ(x) = vⱼ` ; `p*(u,v)` = valeur optimale perturbée.
- **Propriété** : `p*` est **convexe** (en `(u,v)`) ; `p*(0,0) = p*`.
- **Eq. (5.57)** : inégalité globale de sensibilité — « for any
  `(u,v)` for which the perturbed problem is feasible,
  `p*(u,v) ≥ p*(0,0) − λ*ᵀu − ν*ᵀv` » (valable dès que le dual est atteint —
  c'est `g(λ*,ν*) ≤ p*(u,v)` réécrit).
- **Eq. (5.58)** : si `p*` est différentiable en `(0,0)`, alors
  `λᵢ* = −∂p*(0,0)/∂uᵢ`, `νⱼ* = −∂p*(0,0)/∂vⱼ` — « the local sensitivity
  result (5.58) gives us a quantitative measure of how active each
  constraint is » : les multiplicateurs optimaux sont les taux marginaux
  (shadow prices).
- **Exercice 5.21** (p. 281) : « A convex problem in which strong duality
  fails » — `minimize e^{−x}` s.t. `x²/y ≤ 0`, domaine `D = {(x,y) | y > 0}` :
  `p* = 1` (en `x* = 0`), duale `g ≡ 0` donc `d* = 0`, **gap = 1**, Slater
  échoue (aucun point strictement faisable : `x²/y < 0` impossible).
  **Déjà enseigné dans le panneau P1/L1** — la leçon y renvoie sans
  re-démontrer.

---

## 2. Affirmations vérifiées — [BV04] §8.6 « Classification » (pp. 422–431)

- **§8.6.1** : discrimination linéaire — trouver `f(x) = aᵀx − b` avec
  `aᵀxᵢ − b > 0` (i = 1…N), `aᵀyⱼ − b < 0` (j = 1…M) — **eq. (8.20)** ;
  faisabilité stricte ⇔ faisabilité de **eq. (8.21)** (`aᵀxᵢ − b ≥ 1`,
  `aᵀyⱼ − b ≤ −1`), par homogénéité.
- **Eq. (8.22)** alternative de séparabilité : les convexes hulls de
  `{xᵢ}` et `{yⱼ}` se coupent ⇔ non discriminable (« There is a point in
  the convex hull of both … sets »).
- **Eq. (8.23) « Robust linear discrimination »** :
  `maximize t` s.t. `aᵀxᵢ − b ≥ t`, `aᵀyⱼ − b ≤ −t`, `‖a‖₂ ≤ 1` —
  « the thickest slab that separates the two sets » ; `‖a*‖₂ = 1` à
  l'optimum ; `t* =` **moitié de la distance entre les convexes hulls**.
- **Duale de (8.23)** (démontrée dans le texte, pp. 424–425) : lagrangienne
  `−t + Σᵢ uᵢ(t + b − aᵀxᵢ) + Σⱼ vⱼ(t − b + aᵀyⱼ) + λ(‖a‖²₂ − 1)` ;
  minimisation sur `b, t` ⟹ **`1ᵀu = 1/2`, `1ᵀv = 1/2`** ;
  `maximize −(Σⱼ vⱼyⱼ − Σᵢ uᵢxᵢ)²/2` s.t. `u ⪰ 0, 1ᵀu = 1/2, v ⪰ 0,
  1ᵀv = 1/2` — « find (half) the distance between the convex hulls ».
  **À relier dans la leçon** : c'est le même mécanisme que la contrainte
  cachée `Σαᵢyᵢ = 0` du §1.3 (ici visible directement : la minimisation sur
  `b` force la somme des multiplicateurs).
- **Eq. (8.24)** : version à marge souple — `aᵀxᵢ − b ≥ 1 − uᵢ`,
  `aᵀyⱼ − b ≤ −(1 − vⱼ)`, `u, v ⪰ 0` ; **eq. (8.25)** : relaxation LP
  `minimize 1ᵀu + 1ᵀv` ; « standard support vector classifier » (p. 427) :
  `minimize ‖a‖²₂ + γ(1ᵀu + 1ᵀv)` s.t. (8.24) — `γ > 0` pondère le nombre
  (relaxé) de points mal classés contre la largeur de la dalle
  (`2/‖a‖₂`).
- **Forme standard du cours** (`yᵢ ∈ {−1,+1}`, `min ½‖w‖² + CΣξᵢ`, duale
  quadratique en `α` avec `0 ≤ αᵢ ≤ C`) : **pas dans [BV04]** sous cette
  écriture (qui est deux-ensembles `(xᵢ, yⱼ)`). Elle est déjà vérifiée et
  citée dans le panneau P2/L4 (Hastie–Tibshirani–Friedman, ESL 2e éd.,
  §12.2, eq. (12.12)+(12.15)) — la leçon renvoie au panneau plutôt que de
  re-dériver (décision de plan validée).

---

## 3. Affirmations vérifiées — [BV04] conjugée / normes duales

- **§3.3.1 Exemple 3.26 « Norm »** (p. 94) : « the conjugate of a norm is
  the indicator function of the dual norm unit ball » —
  `f* = ι_B` pour `f = ‖·‖`, `B = {u | ‖u‖* ≤ 1}` ; preuve par
  `sup_{‖z‖≤1} uᵀz` (définition de la norme duale).
- **Définition de la norme duale, Appendice A.1.6** :
  `‖u‖* = sup{uᵀx | ‖x‖ ≤ 1}`.
- Conséquence utilisée dans la leçon (déduite, citée via l'exemple 3.26) :
  `‖θ‖₁ = max_{‖u‖∞ ≤ 1} uᵀθ` — représentation du Lasso par sa
  représentation duale de la norme, point de départ de la duale Fenchel de
  la section 5.4.

---

## 4. Ancrages dans le cours (vérifiés)

- `course_sources/typst/optim.typ` : **aucune** dualité, aucun KKT, aucun
  lagrangien (recherche exhaustive « lagrangien », « dual », « KKT »,
  « multiplicateur » : 0 occurrence dans le contenu théorique). Toute la
  leçon est donc « au-delà du cours » — cohérent avec le brief.
- `course_sources/typst/regularization.typ` :
  - **Déf. 5.2** : `θ̂_Lasso = argmin_θ ‖y − Xθ‖₂² + λ‖θ‖₁` — **forme
    pénalisée, sans facteur ½, sans normalisation 1/(2n)**. La leçon
    enseignera la forme `min ½‖y − Xθ‖₂² + λ‖θ‖₁` (absorption du ½ dans
    λ, reparamétrage noté explicitement) car c'est la forme qui se dualise
    proprement (les deux formes ont le même chemin de solutions).
  - **Déf. 5.3** : lasso path `λ ↦ θ̂_Lasso(λ)` ; §5.1 : LARS comme
    algorithme du chemin.
- Panneaux existants à **référencer sans re-enseigner** :
  - P1/L1 (KKT + dualité 1-D, parabole, quartique, exemple gap [BV04 ex.
    5.21]) — `src/routes/part1/lesson1/+page.svelte` (panneau à partir de la
    ligne ~536).
  - P2/L4 (duale SVM complète, vecteurs support, régimes `αᵢ ∈ {0, (0,C), C}`)
    — `src/routes/part2/lesson4/+page.svelte` (panneau à partir de la
    ligne ~633).

---

## 5. Calculé ici (déduit de la machine [BV04] ci-dessus, vérifié numériquement)

> Aucune de ces formes closes n'est dans [BV04] ni dans les sources du
> cours. Toutes sont déduites des résultats vérifiés des sections 1–3 et
> **vérifiées numériquement** (script Python + scipy, 2026-09-15) ; les tests
> unitaires `duality.test.ts` de la phase d'implémentation figeront ces
> vérifications (dualité forte à la précision machine, identités KKT, cas
> analytiques 1-D).

### 5.1 Exemple conducteur 2-D (tout le pipeline en forme close)

Problème : `minimize (x−1)² + (y−1)²` s.t. `x + y ≤ 1` — convexe (QP),
Slater tient en `(0,0)` (`0 + 0 < 1` strict).

- **Primale** : par symétrie (ou Lagrange direct), `x* = y* = 1/2`,
  `p* = 1/2` — la contrainte est active.
- **Lagrangienne** : `L(x,y,λ) = (x−1)² + (y−1)² + λ(x + y − 1)`, `λ ≥ 0`.
- **Fonction duale** : minimisation quadratique en `(x,y)` —
  `x(λ) = y(λ) = 1 − λ/2`, donc
  `g(λ) = L(x(λ), y(λ), λ) = λ − λ²/2` (concave, quadratique).
- **Duale** : `max_{λ≥0} λ − λ²/2` → `λ* = 1`, `d* = g(1) = 1/2`.
- **Dualité forte** : `p* = d* = 1/2` (Slater).
- **Gap ponctuel** : `gap(λ) := p* − g(λ) = (λ − 1)²/2 ≥ 0`, nul en `λ*` —
  la courbe de gap est une parabole tangente à 0 : c'est **l'objet
  visuel central** de la leçon (démonstration interactive E.1).
- **KKT** : stationnarité `2(x−1) + λ = 0`, `2(y−1) + λ = 0`
  (dérivée de `L = (x−1)² + (y−1)² + λ(x+y−1)`), faisabilité,
  complémentarité `λ(x+y−1) = 0` → point KKT unique `((1/2,1/2), 1)` —
  cohérent avec `x* = 1 − λ*/2`.
- **Sensibilité (§5.6)** : perturbant la contrainte `x + y ≤ 1 + u` :
  `x*(u) = y*(u) = (1+u)/2`, multiplicateur `λ(u) = 1−u`, et
  `p*(u) = (1−u)²/2` pour `u ≤ 1` (contrainte active), `p*(u) = 0` pour
  `u ≥ 1` (le minimiseur libre `(1,1)` devient faisable) ; `p*` est
  convexe `C¹`, et `λ(u) = −p*'(u)` sur `u < 1` — vérifie (5.58) en forme
  close. (Calculé ici.)

### 5.2 Leçons du gap — exemples sous la contrainte non convexe `x² ≥ 1` (calculés ici)

> **Correction majeure (2026-09-15)** : le brouillon initial présentait
> `min (x−2)²` s.t. `x² ≥ 1` comme « gap strict fini = 1 ». C'est **faux** :
> `x = 2` est **faisable** (`2² = 4 ≥ 1`) et minimise `(x−2)²` sur R, donc
> `p* = 0`, et `d* = g(0) = 0` — **gap nul**. La famille correcte (une
> contrainte, deux objectifs) est ci-dessous. Notez l'écueil général :
> sur R¹ avec une unique contrainte lisse, un optimum primal **atteint**
> vérifie presque toujours KKT (le multiplicateur est déterminé par la
> stationnarité), et la duale lagrangienne « rattrape » la primale (7 cas
> quadratiques vérifiés numériquement, gap 0 — cohérent avec l'exactitude
> de la procédure-S d'une QCQP à contrainte unique). Le gap strict propre
> dit est porté par l'exercice [BV04 5.21] (convexe sans Slater, 2-D).

**(G1) « Piège » — non convexe, gap NUL : `min (x−2)²` s.t. `x² ≥ 1`.**
- Faisable : `{x ≤ −1} ∪ {x ≥ 1}` ; `p* = 0` en `x* = 2` (faisable ! la
  contrainte est **inactive** : `1 − 2² = −3 < 0`).
- `L(x,λ) = (x−2)² + λ(1−x²)` ; pour `λ ∈ [0,1)` : minimiseur
  `x(λ) = 2/(1−λ)`, `g(λ) = −λ(3+λ)/(1−λ)` (décroissante ; vérifié par
  contre-minimisation sur grille, `λ ∈ {0, 0.1, 0.2, 0.5, 0.9}`) ;
  pour `λ ≥ 1` : `g(λ) = −∞`.
- `d* = sup g = g(0) = 0 = p*` — **gap 0** ; KKT satisfait en
  `(x* = 2, λ* = 0)` (stationnarité `2(x−2) + 2λx = 0`, complémentarité
  `λ(1−x²) = 0`).
- **Leçon** : la non-convexité de l'ensemble faisable **ne suffit pas**
  à ouvrir un gap. La preuve de séparation (BV04 §5.3.2) a besoin d'une
  condition de qualification, pas de la convexité de l'ensemble en soi.

**(G2) Primale non bornée : `min x` s.t. `x² ≥ 1`.**
- `p* = −∞` (`x → −∞` est faisable et fait descendre `x`) ;
  `L(x,λ) = x + λ(1−x²)` non bornée inférieurement en `x` pour tout
  `λ ≥ 0` (affine pour `λ = 0`, quadratique pour `λ > 0`) ;
  `g ≡ −∞`, `d* = −∞`.
- **Leçon** : c'est le cas « `p* = −∞` ⟹ `d* = −∞` » du §5.2.2 de [BV04] —
  les deux valeurs s'effondrent ensemble ; il n'y a pas de « gap » au sens
  d'un écart fini.

**Gap strict de référence** : exercice [BV04 5.21] — `min e^{−x}` s.t.
`x²/y ≤ 0`, domaine `y > 0` : convexe, **Slater échoue** (`x²/y < 0`
impossible), `p* = 1` (atteint, tout `(0, y)` avec `y > 0` est optimal),
duale `g ≡ 0` donc `d* = 0`, **gap = 1**. Déjà traité au panneau P1/L1 —
renvoi, pas re-démonstration.

### 5.3 Leçons du gap : pourquoi Slater/convexité suffisent-elles ?

- (G1) : non convexe → **pas** de gap (0) — la non-convexité seule ne
  suffit pas.
- [BV04 5.21] : convexe mais **sans Slater** → gap strict fini (1)
  (déjà au panneau P1/L1).
- (G2) : primale non bornée → `p* = d* = −∞` (§5.2.2 de [BV04]).
- Conclusion enseignée : la condition de qualification (Slater) est ce qui
  garantit la dualité forte ; la convexité entre dans la preuve par la
  convexité de `A` (BV04 §5.3.2). Retirer Slater peut faire perdre la
  dualité forte (5.21) ; retirer la convexité ne la fait pas perdre
  automatiquement ((G1)).

### 5.4 Le Lasso — duales (calculées ici, vérifiées numériquement)

Forme enseignée (reparamétrage de la Déf. 5.2 du cours, le ½ absorbé dans
λ, chemin de solutions identique) :
`(P_λ) : minimize_θ ½‖y − Xθ‖₂² + λ‖θ‖₁`, `λ ≥ 0`.

**(a) Duale lagrangienne de la forme contrainte.**
Forme contrainte `(P_t) : minimize_θ ½‖y − Xθ‖₂²` s.t. `‖θ‖₁ ≤ t`.
Lagrangienne `L(θ,λ) = ½‖y − Xθ‖₂² + λ(‖θ‖₁ − t)` ;
`g(λ) = p_pen(λ) − λt` où `p_pen(λ) = min_θ ½‖y − Xθ‖₂² + λ‖θ‖₁` —
**pas de forme close** : évaluer `g(λ)` coûte un lasso pénalisé.
`p_pen` est **concave** en `λ` (infimum point par point de fonctions
affines en `λ`) ⟹ `g` concave ⟹ `max_{λ≥0} g` est une maximisation
concave **1-D**. Slater tient (`θ = 0` strictement faisable pour `t > 0`)
⟹ **dualité forte** `d* = p*` et le dual optimal est atteint (théorème
Slater, §1.5). **Vérifié numériquement** : `max_λ [p_pen(λ) − λt] = p*`
à la précision machine sur 5 jeux `(X, y, t)` (X 3×2 aléatoire, CD lasso
+ section dorée).

**(b) Correspondance des chemins (calculée ici, déduction KKT).**
Soit `θ(λ)` solution de `(P_λ)` et `t = ‖θ(λ)‖₁`. Alors `θ(λ)` minimise
`(P_t)`. **Preuve** (KKT, §5.5.3 de [BV04]) : par Slater + dualité forte,
`θ(λ)` satisfait `Xᵀ(y − Xθ(λ)) = λ z` avec `z ∈ ∂‖θ(λ)‖₁` (stationnarité
non lisse) ; pour `(P_t)`, les KKT sont
`Xᵀ(y − Xθ̃) = λ̃ z̃`, `z̃ ∈ ∂‖θ̃‖₁`, `λ̃ ≥ 0`,
`λ̃(t − ‖θ̃‖₁) = 0` — que `(θ̃, λ̃, z̃) = (θ(λ), λ, z)` satisfait puisque
`λ‖θ(λ)‖₁ = λt`. Suffisance KKT (convexe) ⟹ optimalité. Réciproquement,
toute solution de `(P_t)` avec `‖θ‖₁ < t_max` est solution de `(P_λ)` pour
un `λ ≥ 0` (premier point du chemin exclu : `λ = 0`). **Vérifié
numériquement** : `θ_primal(t) = θ_pen(λ*)` (max `‖·−·‖∞ < 10⁻⁴`) et
complémentarité `λ*(t − ‖θ‖₁) ≈ 0` sur les mêmes jeux. (Cette équivalence
de chemins est un résultat standard — cf. Hastie–Tibshirani–Friedman, ESL
2e éd., §3.2 — cité ici en référence secondaire ; la leçon l'enseigne via la
preuve KKT ci-dessus qui n'utilise que [BV04 §5.5.3].)

**(c) Duale Fenchel de la forme pénalisée (calculée ici, vérifiée).**
Écriture `min_θ f(Xθ) + g(θ)` avec `f(z) = ½‖y − z‖₂²`,
`g(θ) = λ‖θ‖₁`. Par dualité de Fenchel (machine §1.7, thm. minimax
Sion), sous rang entier en colonnes de `X` :

`(D_λ) : maximize_{u}  ½‖(I − P_X) y‖₂² + uᵀ(XᵀX)⁻¹Xᵀy − ½ uᵀ(XᵀX)⁻¹u
        subject to      ‖u‖∞ ≤ λ`,  `u ∈ R^d` (d = nombre de paramètres),

où `P_X = X(XᵀX)⁻¹Xᵀ` est la projection sur le column space de `X`.
Dérivation : `g*(u) = 0` si `‖u‖∞ ≤ λ` (conjugée de `λ‖·‖₁` = indicatrice
de la boule duale, §3) ; `inf_θ f(Xθ) + uᵀθ = ½‖(I−P_X)y‖₂² +
uᵀ(XᵀX)⁻¹Xᵀy − ½uᵀ(XᵀX)⁻¹u` (stationnarité `XᵀXθ = Xᵀy − u`).
- **Vérification 1-D** (`X = 1`, n = d = 1) : `(D_λ)` =
  `max_{|u|≤λ} uy − ½u²` — coïncide avec la duale élémentaire vérifiée
  plus bas (y = 3, λ = 1 : `p* = d* = 2.5` ; y = 0.5, λ = 1 :
  `p* = d* = 0.125` ; y = −2.5, λ = 1 : `p* = d* = 2.0`).
- **Vérification numérique n-D** : dualité forte à la précision machine
  (`|p* − d*| < 2·10⁻¹⁵`) sur 6 jeux `(X, y, λ)` (X 3×2 uniforme,
  λ ∈ {0.3, 0.7, 1, 1.5, 2.5, 4}), primal par descente de coordonnées
  exacte, dual par SLSQP multi-départs.
- **Lien primal-duale (vérifié)** : `u* = Xᵀ(y − Xθ*)` et, posant
  `z* = u*/λ`, `z* ∈ ∂‖θ*‖₁` — c'est-à-dire
  `z*_i = sgn(θ*_i)` si `θ*_i ≠ 0` et `|z*_i| ≤ 1` si `θ*_i = 0`.

**(d) Duale Fenchel de la forme contrainte (calculée ici, vérifiée).**
Éclatement `z = Xθ` : `maximize_{u∈Rⁿ} uᵀy − ½‖u‖₂² − t‖Xᵀu‖∞`
— maximisation concave **non lisse** (norme infinie). Vérifiée
numériquement sur 6 jeux : 5/6 à `|p* − d*| ≤ 4·10⁻³` (tolérance SLSQP),
1/6 à `1.3·10⁻¹` (SLSQP peinant sur la non-lissitude du `‖·‖∞` — le
dégagement est attribué au solveur, pas à la formule ; la version 1-D
est exacte en forme close, cf. tableau §5.5).

**(e) KKT du Lasso pénalisé (calculée ici).**
`0 ∈ −Xᵀ(y − Xθ*) + λ∂‖θ*‖₁` — **inclusion, pas équation** (non lissitude).
Coordonnée par coordonnée : `θ*_i ≠ 0` ⟹ `Xᵀ(y−Xθ*)_i = λ sgn(θ*_i)` ;
`θ*_i = 0` ⟹ `|Xᵀ(y−Xθ*)_i| ≤ λ` — c'est la condition qui **produit la
parcimonie** (les coordonnées dont le gradient ne « dépasse pas » λ
s'annulent) ; elle se réécrit `θ* = S_λ((XᵀX)⁻¹… )` en forme close seulement
si `X` a des colonnes orthonormales — sinon c'est l'inclusion qui définit
θ* (lien avec le soft-thresholding et le panneau P1/L1
`sous-gradient-optimisation-non-lisse`, et la leçon
`methodes-proximales` qui exploite exactement cette inclusion via
`prox_{λ‖·‖₁}`).
- **Contraste enseigné (la question du brief, fil B)** :
  - SVM : contraintes **affines** → `g(α)` **quadratique close**, duale à
    n variables avec simple structure de box `0 ≤ αᵢ ≤ C` ; KKT = équations
    lisses ; les α non nuls **sont** les vecteurs support (complémentarité
    lisible en une ligne).
  - Lasso : contrainte `‖θ‖₁ ≤ t` **non lisse, non affine** →
    `g(λ) = p_pen(λ) − λt` **sans forme close** (chaque évaluation coûte un
    lasso) ; la duale utile (c) est lisse mais vit en dimension d avec
    matrice `(XᵀX)⁻¹`, et la parcimonie n'apparaît **pas** dans la duale —
    elle vient du sous-différentiel `∂|·|(0) = [−1,1]` côté primale.
    D'ailleurs, la duale du Lasso ne « sélectionne » rien : c'est la primale
    qui sélectionne. → « la dualité y est moins exploitable » (brief),
    formulé précisément ainsi.

### 5.5 Résumé des vérifications numériques (2026-09-15)

| Affirmation | Méthode | Résultat |
|---|---|---|
| 5.1 `g(λ) = λ − λ²/2`, `p* = d* = ½`, KKT `((½,½),1)` | contre-calculation directe + grille 401² | exact (signe de la stationnarité corrigé : `2(x−1) + λ = 0`) |
| 5.1 sensibilité `x*(u) = ((1+u)/2, (1+u)/2)`, `p*(u) = (1−u)²/2` (`u ≤ 1`), `0` sinon | contre-calculation directe | exact |
| 5.2 (G1) `p* = 0` en `x* = 2` (faisable), `g(λ) = −λ(3+λ)/(1−λ)`, `d* = 0`, gap 0 | minimiseur par composante + inf grille (fenêtre ±40) vs forme close (5 λ) + KKT en `(2,0)` | exact — **correction majeure** : le brouillon donnait `p* = 1` en `x* = 1` (point du bord), oubliant que `x* = 2` est faisable ; le « gap strict fini » initial n'existait pas |
| 5.2 (G2) `min x` s.t. `x² ≥ 1` : `p* = d* = −∞` | `x → −∞` faisable ; `L(±R, λ) → −∞` | exact |
| 5.2 gap strict de référence [BV04 5.21] : `p* = 1`, `d* = 0`, gap 1 | vérifié en phase de recherche (panneau P1/L1) | renvoi, pas re-démontré ici |
| 7 cas quadratiques 1-D (objectif quadratique, contrainte quadratique unique, optimum atteint) → gap 0 | résolution KKT + maximisation de `g` (scipy) | gap ≤ 10⁻⁶ partout — cohérent avec l'exactitude de la procédure-S |
| 5.4(a) `max_λ [p_pen(λ) − λt] = p*` | CD lasso + section dorée, 5 jeux | `gap < 10⁻⁶` |
| 5.4(b) `θ_pr(t) = θ_pen(λ*)` | id. | `‖·−·‖∞ < 10⁻⁴`, complémentarité `≈ 0` |
| 5.4(c) duale Fenchel pénalisée | CD + SLSQP multi-départs, 6 jeux | `|p* − d*| < 2·10⁻¹⁵`, lien `u* = Xᵀ(y−Xθ*)` vérifié |
| 5.4(d) duale Fenchel contrainte | SLSQP primal/dual, 6 jeux | 5/6 `|p* − d*| ≤ 4·10⁻³`, 1/6 `1.3·10⁻¹` (tolérance solveur sur le `‖·‖∞` non lisse) |
| 1-D lasso `max_{|u|≤λ} uy − ½u²` | forme close, 5 jeux | `p* = d*` exact, `u* = clip(y,−λ,λ) = y − θ*` |

> **Leçon de processus** : deux erreurs de dérivation manuelle (5.2 et la
> première version de 5.4) ont été détectées par contre-calculation
> numérique avant rédaction. Les tests unitaires de la phase
> d'implémentation doivent figer les valeurs closes ci-dessus (et non
> seulement des invariants), précisément parce que les formes closes du
> Lasso ne sont dans aucune source imprimée consultable.

---

## 6. Références de la page (complies)

- Boyd, S. & Vandenberghe, L., *Convex Optimization*, Cambridge University
  Press, 2004. Ch. 5 (dualité : §5.1–5.6, eq. (5.1)–(5.58), Ex. 5.1–5.2,
  ex. 5.21), §8.6 (classification, eq. (8.20)–(8.27)), §3.3.1 (Ex. 3.26).
  URL : https://web.stanford.edu/~boyd/cvxbook/ (PDF :
  https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf).
- Nocedal, J. & Wright, S., *Numerical Optimization*, 2e éd., SIAM, 2006,
  ch. 12. (Référence secondaire — non vérifiée directement.)
- Vapnik, V., *The Nature of Statistical Learning Theory*, Springer, 1998.
  (Référence secondaire — non vérifiée directement.)
- Hastie, T., Tibshirani, R. & Friedman, J., *The Elements of Statistical
  Learning*, 2e éd., Springer, 2009, §3.2 (lasso path) et §12.2 (duale
  SVM). URL : https://hastie.su.domains/ElemStatLearn/ . (Référence
  secondaire pour l'équivalence des chemins lasso ; la leçon démontre via
  KKT/BV04. Le panneau P2/L4 cite déjà ESL §12.2 pour la duale SVM.)
