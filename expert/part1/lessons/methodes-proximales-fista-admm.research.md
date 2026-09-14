# Recherche — Méthodes proximales et premier ordre moderne (prox, FISTA, ADMM)

> Agent de recherche pour le brief `p1-lesson-methodes-proximales-fista-admm`.
> Sources primaires consultées (PDF téléchargés et lus en entier le 2026-09-13) :
>
> - **[PB14]** Parikh, N. & Boyd, S., « Proximal Algorithms », *Foundations
>   and Trends in Optimization*, **1**(3):123–231, 2014.
>   DOI [10.1561/2400000003](https://doi.org/10.1561/2400000003) — version PDF
>   libre : https://web.stanford.edu/~boyd/papers/pdf/prox_algs.pdf
> - **[BT09]** Beck, A. & Teboulle, M., « A Fast Iterative Shrinkage-Thresholding
>   Algorithm for Linear Inverse Problems », *SIAM Journal on Imaging Sciences*,
>   **2**(1):183–202, 2009. DOI [10.1137/080716542](https://doi.org/10.1137/080716542)
>   — version PDF libre : https://www.tau.ac.il/~becka/FISTA.pdf
> - **[BPC11]** Boyd, S., Parikh, N., Chu, E., Peleato, B. & Eckstein, J.,
>   « Distributed Optimization and Statistical Learning via the Alternating
>   Direction Method of Multipliers », *Foundations and Trends in Machine
>   Learning*, **3**(1):1–122, 2011.
>   DOI [10.1561/2200000016](https://doi.org/10.1561/2200000016) — version PDF
>   libre : https://web.stanford.edu/~boyd/papers/pdf/admm_distr_stats.pdf
> - **[CW05]** Combettes, P. L. & Wajs, V. R., « Signal Recovery by Proximal
>   Forward-Backward Splitting », *Multiscale Modeling and Simulation* (SIAM),
>   **4**(4):1164–1200, 2005. DOI [10.1137/050626090](https://doi.org/10.1137/050626090)
>   — version PDF libre : https://pcombet.math.ncsu.edu/mms1.pdf
>
> ## ⚠️ Corrections au brief (vérification des références)
>
> 1. **[PB14]** est publié dans *Foundations and Trends in* ***Optimization***
>    (1(3):123–231), pas dans « Found. Trends ML » comme l'écrit le brief.
> 2. Le papier FISTA cité par le brief (« IEEE Trans. IP, L1-regularized
>    Problems, 2009 ») **n'existe pas sous ce titre** : vérifié via Crossref,
>    la publication FISTA de 2009 est [BT09] (SIAM J. Imaging Sci. 2(1):183–202).
>    Le papier IEEE Trans. Image Processing 18(11):2419–2434 de Beck & Teboulle
>    en 2009 est un *autre* article (« Fast Gradient-Based Algorithms for
>    Constrained Total Variation Image Denoising and Deblurring Problems »).
>    La version courte ICASSP 2009 existe aussi : pp. 693–696,
>    DOI 10.1109/ICASSP.2009.4959678.
> 3. **[CW05]** est publié dans *Multiscale Modeling and Simulation* (revue SIAM),
>    pas dans le SIAM Journal on Optimization.
>
> ## ⚠️ Convention de notation — point d'attention vérifié
>
> Trois conventions coexistent dans la littérature pour l'opérateur proximal,
> toutes reliées par un simple reparamétrage du scalaire :
>
> - [PB14 §1.1, eq. (1.2)] : `prox_{λf}(v) = argmin_x f(x) + (1/(2λ))‖x−v‖²`
>   (« the proximal operator of f with parameter λ »).
> - [BPC11 §4.1] : `prox_{f,ρ}(v) = argmin_x f(x) + (ρ/2)‖x−v‖²`.
>   Donc `prox_{f,ρ}` (BPC11) = `prox_{(1/ρ)f}` (PB14).
> - [BT09, eq. (1.4)–(1.5)] : `x^{k+1} = T_{λt}(x^k − 2t·Aᵀ(Ax^k−b))` avec
>   `T_α(x)_i = (|x_i|−α)+·sgn(x_i)` ; ici `T_α(u) = argmin_x ½‖x−u‖² + α‖x‖₁`.
>
> **Anomalie de notation constatée dans [PB14 §7.1.1]** (page 197 du monographie)
> : le texte écrit, pour le lasso `min ½‖Ax−b‖² + γ‖x‖₁` avec
> `g(x) = γ‖x‖₁`, que `prox_{γg}(x) = S_γ(x)`. Or avec la convention (1.2) du
> même monographie, `prox_{γg}(x) = S_{γ²}(x)` ; l'écriture correcte est
> `prox_g(x) = S_γ(x)`. L'itération ISTA elle-même n'est pas ambiguë
> (voir eq. (4.6) ci-dessous) ; seule cette ligne d'exemple est fautive.
> La leçon doit définir **explicitement** la convention utilisée (celle de
> [PB14, eq. (1.2)] est retenue) pour éviter la confusion.

---

## 1. Affirmations vérifiées — [PB14] Parikh & Boyd, « Proximal Algorithms »

### 1.1 Définition de l'opérateur proximal (§1.1, eq. (1.1)–(1.2))

Pour `f : Rⁿ → R ∪ {+∞}` *closed proper convex* :

- `prox_f(v) = argmin_x f(x) + ½‖x−v‖²` — eq. (1.1).
  Le minimiseur est **unique** pour tout `v` (fonction fortement convexe),
  même si `dom f ⊊ Rⁿ`.
- `prox_{λf}(v) = argmin_x f(x) + (1/(2λ))‖x−v‖²` — eq. (1.2), « the
  proximal operator of f with parameter λ » (`λ > 0`).

### 1.2 Décomposition de Moreau (§2.5, eq. (2.4))

- `v = prox_f(v) + prox_{f*}(v)` pour toute `v`, où `f*` est la conjugée
  convexe. « This property, known as Moreau decomposition, is the main
  relationship between proximal operators and duality. »
- Généralise la décomposition orthogonale : si `f = ι_L` (fonction indicatrice
  d'un sous-espace), `prox_f = Π_L` et `prox_{f*} = Π_{L⊥}` puisque
  `(ι_L)* = ι_{L⊥}`.
- Conséquence pratique : pour `f = ‖·‖` (norme quelconque), `f* = ι_B` avec
  `B = {x | ‖x‖* ≤ 1}` (boule unitaire de la norme duale), donc
  `prox_f(v) = v − Π_B(v)` — le prox d'une norme se ramène à une projection.

### 1.3 Proximal = résolvante du sous-différentiel (§3.2, eq. (3.4))

- `prox_{λf} = (I + λ∂f)⁻¹` — eq. (3.4). Le membre de droite est la
  *résolvante* de l'opérateur `∂f` ; elle est à valeurs dans une fonction
  (et non une relation) car le prox est à valeur simple.
- **Esquisse de la preuve** (donnée en entier dans le texte) :
  `z ∈ (I + λ∂f)⁻¹(x)` ⟺ `x ∈ z + λ∂f(z)` ⟺ `0 ∈ ∂f(z) + (1/λ)(z−x)`
  ⟺ `0 ∈ ∂_z ( f(z) + ½λ⁻¹‖z−x‖² )`, qui est la condition
  nécessaire et suffisante pour que `z` minimise cette fonction
  fortement convexe.
- Interprétation géométrique associée (§3.3, « Modified gradient step ») :
  le prox est un pas de gradient « régularisé » ; cf. aussi §3.1
  (régularisation de Moreau–Yosida) et §3.4 (problème de région de confiance).

### 1.4 Méthode de descente proximale (§4.2, eq. (4.6))

Pour `minimize f(x) + g(x)` (f, g closed proper convex, f différentiable) :

- **Algorithme** — eq. (4.6) : `x^{k+1} := prox_{λ_k g}(x^k − λ_k ∇f(x^k))`.
- **Taux** : « When ∇f is Lipschitz continuous with constant L, this method
  can be shown to converge with rate O(1/k) when a fixed step size
  λ_k = λ ∈ (0, 1/L] is used. » (cf. [PB14, ref. 61] = Combettes & Pesquet,
  « Proximal splitting methods in signal processing », 2011 ; cf. aussi
  [BT09, Thm 3.1] pour le cas ISTA).
- **Line search** de Beck–Teboulle (β ∈ (0,1), typiquement 1/2) : répéter
  `z = prox_{λg}(x^k − λ∇f(x^k))`, break si `f(z) ≤ f̂_λ(z, x^k)`, sinon
  `λ := βλ`.
- **Cas particuliers** : `g = ι_C` → gradient projeté ; `f = 0` → point
  proximal ; `g = 0` → gradient classique.
- **Interprétation majorisation-minimisation** (eq. (4.7)–(4.8)) :
  `f̂_λ(x, y) = f(y) + ∇f(y)ᵀ(x−y) + (1/(2λ))‖x−y‖²` majore `f` si
  `λ ∈ (0, 1/L]` ; le pas proximal minimise `q_λ(x, y) = f̂_λ(x,y) + g(x)`.
- **Point fixe** : `x*` minimise `f+g` ⟺ `0 ∈ ∇f(x*) + ∂g(x*)` ⟺
  `x* = prox_{λg}(x* − λ∇f(x*))` — la méthode itère l'opérateur
  *forward-backward* `(I + λ∂g)⁻¹(I − λ∇f)`.
- **Interprétation ODE** : c'est le schéma semi-implicite (Euler explicite
  sur f, Euler implicite sur g) du flot de gradient `ẋ = −∇f(x) − ∇g(x)` ;
  on l'appelle *forward-backward splitting* (avec `λ = h`).

### 1.5 Version accélérée (§4.3)

- **Algorithme** : `y^{k+1} := x^k + ω_k(x^k − x^{k−1})` puis
  `x^{k+1} := prox_{λ_k g}(y^{k+1} − λ_k ∇f(y^{k+1}))`, avec
  `ω_k = k/(k+3)` « one simple choice [192] » ([192] = L. Vandenberghe,
  « Fast proximal gradient methods », 2010).
- **Taux** : « this method can be shown to converge in objective value with
  rate O(1/k²) when a fixed step size λ_k = λ ∈ (0, 1/L] is used. »
- « Following Nesterov, this is called an accelerated or optimal first-order
  method because it has a worst-case convergence rate that is superior to the
  standard method and that cannot be improved further [147, 148]. »
  ([147] = Nemirovsky & Yudin, *Problem Complexity and Method Efficiency in
  Optimization*, Wiley, 1979 ; [148] = Nesterov 1983, cf. [BT09, ref. 27] :
  Y. E. Nesterov, « A method for solving the convex programming problem with
  convergence rate O(1/k²) », *Dokl. Akad. Nauk SSSR*, **269**(1983),
  pp. 543–547, en russe.)

### 1.6 ADMM / Douglas–Rachford (§4.4)

Pour `minimize f(x) + g(x)` (f, g closed proper convex, **les deux peuvent
être non lisses**) :

- `x^{k+1} := prox_{λf}(z^k − u^k)`
- `z^{k+1} := prox_{λg}(x^{k+1} + u^k)`
- `u^{k+1} := u^k + x^{k+1} − z^{k+1}`
- « This method converges under more or less the most general possible
  conditions; see [32, §3.2] for details. » ([32] = [BPC11].)
- Les deux termes sont traités **séparément**, uniquement via leurs proximaux ;
  « ADMM is most useful when the proximal operators of f and g can be
  efficiently evaluated but the proximal operator for f + g is not easy to
  evaluate. »
- Si `g = ‖·‖₁`, les itérés `z^k` sont exactements sparses (soft-thresholding,
  eq. (6.9)), tandis que `x^k` n'est que proche de `z^k`.
- Cas `f = ι_C`, `g = ι_D` : ADMM = itération de projections alternées avec
  mémoire (pas Dykstra) — « similar to, but not the same as, Dykstra's
  alternating projections method ».

### 1.7 Soft-thresholding (§6.1.3 et §6.5.2, eq. (6.9))

Pour `f = ‖·‖₁` :

- `(prox_{λf}(v))_i = { v_i − λ si v_i ≥ λ ; 0 si |v_i| ≤ λ ; v_i + λ si v_i ≤ −λ }`
- Forme compacte — eq. (6.9) : `prox_{λf}(v) = (v − λ)+ − (−v − λ)+`,
  « the (elementwise) soft thresholding operator ».
- Via la décomposition de Moreau (§6.5.2) : `‖·‖₁* = ι_B` (B = boule
  ℓ∞ unité), donc `prox_{λ‖·‖₁}(v) = v − Π_B(v)` = troncature de `v` en
  `[−λ, λ]` soustraite de `v`… plus précisément `v = prox_{λf}(v) + Π_B(v)`.

### 1.8 Exemple lasso (§7.1 et §7.1.1)

- Découpage canonique : `f(x) = ½‖Ax − b‖²`, `g(x) = γ‖x‖₁` — eq. (7.1) ;
  `∇f(x) = Aᵀ(Ax − b)` ; le pas proximal = « ISTA (iterative shrinkage-
  thresholding algorithm) », la version accélérée = « FISTA (fast ISTA) [17] »
  ([17] = [BT09]).
- Coût d'une itération : un produit matrice-vecteur par A, un par Aᵀ, et des
  opérations vectorielles ; le prox est négligeable.
- ⚠️ Voir « Convention de notation » ci-dessus pour l'anomalie
  `prox_{γg}(x) = S_γ(x)` de cette section.

---

## 2. Affirmations vérifiées — [BT09] Beck & Teboulle, FISTA (SIAM J. Imaging Sci. 2009)

### 2.1 Modèle et opérateur de seuillage

- **Problème ℓ1** — eq. (1.3) : `min F(x) = ‖Ax − b‖² + λ‖x‖₁` (remarque :
  sans facteur ½ ici ; cf. [BPC11 eq. (6.2)] avec ½).
- **Pas ISTA** — eq. (1.4) : `x^{k+1} = T_{λt}(x^k − 2t·Aᵀ(Ax^k − b))`.
- **Opérateur de shrinkage** — eq. (1.5) : `T_α(x)_i = (|x_i| − α)+·sgn(x_i)`.
- **Modèle général** — §2.2, (P) : `min f(x) + g(x)` avec `f` convexe
  `C^{1,1}` (gradient L-Lipschitz, constante `L(f)`) et `g` convexe continue
  (éventuellement non lisse), problème supposé soluble.
- **Exemple 2.2** : pour `f(x) = ‖Ax − b‖²`, `L(f) = 2·λ_max(AᵀA)` ;
  pour `f(x) = ½‖Ax−b‖²`, `L(f) = λ_max(AᵀA)`.
- Convergence de la suite `{x_k}` vers un minimiseur : condition typique
  `t_k ∈ (0, 1/‖AᵀA‖)` (cf. [14, Thm 12.4.6] = Nocedal & Wright) ; les
  résultats généraux de convergence de la suite proviennent du cadre
  forward-backward ([6] = [CW05], [30] = Combettes & Pesquet 2008).

### 2.2 Théorème 3.1 — taux O(1/k) de l'ISTA

> **Théorème 3.1** (texte exact). Let {x_k} be the sequence generated by
> either (3.1) or (3.3). Then for any k ≥ 1
> `F(x_k) − F(x*) ≤ α·L(f)·‖x_0 − x*‖² / (2k)`  ∀x* ∈ X*,
> where α = 1 for the constant stepsize setting and α = η for the
> backtracking stepsize setting.

- Conséquence énoncée : nombre d'itérations pour un ε-optimal ≤
  `⌈(αL(f)‖x_0−x*‖²/(2ε))⌉` (C = αL(f)‖x_0−x*‖²/2).

### 2.3 Algorithme FISTA (pas constant), eq. (4.1)–(4.3)

```
Entrée : L = L(f) (Lipschitz de ∇f)
Étape 0 : y_1 = x_0,  t_1 = 1
Étape k (k ≥ 1) :
  (4.1)  x_k   = p_L(y_k)
  (4.2)  t_{k+1} = (1 + √(1 + 4 t_k²)) / 2
  (4.3)  y_{k+1} = x_k + ((t_k − 1)/t_{k+1})·(x_k − x_{k−1})
```

où `p_L(y) = argmin_x Q_L(x, y)` est la minimisation du modèle quadratique
(§2.3) : `Q_L(x, y) = f(y) + ⟨x − y, ∇f(y)⟩ + (L/2)‖x − y‖² + g(x)`
— i.e. un pas de gradient sur `f` suivi d'un proximal de `g` (seuillage doux
pour `g = λ‖·‖₁`, avec paramètre `λ/L`). Une variante backtracking
(plus petit entier `i_k` tel que `F(p_{L̄}(y_k)) ≤ Q_{L̄}(p_{L̄}(y_k), y_k)`
avec `L̄ = η^{i_k} L_{k−1}`) est donnée immédiatement après.

### 2.4 Théorème 4.4 — taux O(1/k²) de FISTA

> **Théorème 4.4** (texte exact). Let {x_k}, {y_k} be generated by FISTA.
> Then for any k ≥ 1
> `F(x_k) − F(x*) ≤ 2·α·L(f)·‖x_0 − x*‖² / (k + 1)²`  ∀x* ∈ X*,
> where α = 1 for the constant stepsize setting and α = η for the
> backtracking stepsize setting.

- **Lemme 4.3** (utilisé dans la preuve) : `t_k ≥ (k+1)/2` pour tout k ≥ 1.
- Conséquence énoncée : ε-optimal en au plus `⌈√(C/ε) − 1⌉` itérations,
  `C = 2αL(f)‖x_0−x*‖²` « which clearly improves ISTA ».
- Le papier ne contient **pas** de théorème numéroté de convergence de la
  suite `{x_k}` (seuls les taux de valeurs sont prouvés) ; la convergence de
  la suite s'appuie sur le cadre forward-backward de [CW05] (cf. §2.1).
  Toute affirmation de leçon « la suite converge vers un minimiseur » doit
  citer [CW05, Thm 3.4], pas [BT09].

### 2.5 Optimalité

- L'accélération de FISTA « builds on an algorithm which is not so well known
  and which was introduced and developed by Nesterov in 1983 [27] for
  minimizing a smooth convex function, and proven to be an "optimal" first
  order (gradient) method in the sense of complexity analysis [26] »
  ([26] = Nemirovsky & Yudin 1979 ; [27] = Nesterov, *Dokl. Akad. Nauk SSSR*
  269(1983) 543–547).
- Pour un problème lisse convexe, aucun algorithme au premier ordre ne peut
  faire mieux en O(1/k²) au pire cas (sens de Nemirovsky–Yudin) — cf. aussi
  [PB14 §4.3].

---

## 3. Affirmations vérifiées — [BPC11] Boyd et al., ADMM (F&T ML 3(1) 2011)

### 3.1 Algorithme et forme échangée (scaled form)

- **Problème** — eq. (3.1) : `minimize f(x) + g(z)` sous `Ax + Bz = c`
  (f, g convexes).
- **Lagrangienne augmentée** : `L_ρ(x, z, y) = f(x) + g(z) + yᵀ(Ax + Bz − c)
  + (ρ/2)‖Ax + Bz − c‖²`.
- **Itérations non échangées** — eq. (3.2)–(3.4) :
  `x^{k+1} = argmin_x L_ρ(x, z^k, y^k)` ;
  `z^{k+1} = argmin_z L_ρ(x^{k+1}, z, y^k)` ;
  `y^{k+1} = y^k + ρ(Ax^{k+1} + Bz^{k+1} − c)`.
- **Forme échangée** — §3.1.1, eq. (3.5)–(3.7), avec `u = y/ρ` :
  `x^{k+1} = argmin_x f(x) + (ρ/2)‖Ax + Bz^k − c + u^k‖²` ;
  `z^{k+1} = argmin_z g(z) + (ρ/2)‖Ax^{k+1} + Bz − c + u^k‖²` ;
  `u^{k+1} = u^k + Ax^{k+1} + Bz^{k+1} − c`.
  « u^k is the running sum of the residuals » (`u^k = u_0 + Σ_{j≤k} r^j`).
- ADMM = « a version of the method of multipliers where a single
  Gauss-Seidel pass over x and z is used instead of the usual joint
  minimization ».

### 3.2 Convergence (§3.2)

- **Assumption 1** : f, g closed, proper, convex (peuvent être non
  différentiables et valoir +∞).
- **Assumption 2** : la lagrangienne non augmentée `L_0` possède un point
  selle (⟹ dualité forte, `(x*, z*)` solution primale, `y*` duale).
- Sous ces deux hypothèses, les itérations convergent (résultat « basic but
  still very general » ; preuve en annexe A). Aucun rang minimum n'est exigé
  de A ou B.

### 3.3 Opérateur de proximité (§4.1)

- Pour `A = I`, le x-update est `prox_{f,ρ}(v) = argmin_x f(x) + (ρ/2)‖x−v‖²`
  (« proximity operator of f with penalty ρ ») ; la valeur
  `f̃(v) = inf_x f(x) + (ρ/2)‖x−v‖²` est l'*enveloppe de Moreau*
  (Moreau–Yosida regularization).
- `f = ι_C` ⟹ `prox_{f,ρ} = Π_C`, indépendamment de ρ.
- **Attention convention** : `prox_{f,ρ}` (BPC11) = `prox_{(1/ρ)f}` (PB14).

### 3.4 ℓ1-regularized loss minimization et Lasso (§6.3–§6.4)

- **Générique** — §6.3 : `min l(x) + λ‖x‖₁` (l convexe quelconque), écrit
  `min l(x) + g(z)` sous `x − z = 0`, `g(z) = λ‖z‖₁` :
  `x^{k+1} = argmin_x l(x) + (ρ/2)‖x − z^k + u^k‖²` (proximal de l ;
  Newton / L-BFGS / CG si l est lisse, système linéaire si l est quadratique) ;
  `z^{k+1} = S_{λ/ρ}(x^{k+1} + u^k)` ; `u^{k+1} = u^k + x^{k+1} − z^{k+1}`.
  « we can interpret ADMM for ℓ1 regularized loss minimization as reducing it
  to solving a sequence of ℓ2 (squared) regularized loss minimization
  problems. »
- **Lasso** — §6.4, eq. (6.2) : `minimize ½‖Ax − b‖² + λ‖x‖₁`. ADMM devient :
  `x^{k+1} = (AᵀA + ρI)⁻¹(Aᵀb + ρ(z^k − u^k))` ;
  `z^{k+1} = S_{λ/ρ}(x^{k+1} + u^k)` ;
  `u^{k+1} = u^k + x^{k+1} − z^{k+1}`.
  « AᵀA + ρI is always invertible, since ρ > 0. The x-update is essentially a
  ridge regression (i.e., quadratically regularized least squares)
  computation, so ADMM can be interpreted as a method for solving the lasso
  problem by iteratively carrying out ridge regression. »
  (La factorisation de `AᵀA + ρI` peut être mise en cache.)

---

## 4. Affirmations vérifiées — [CW05] Combettes & Wajs, MMS 4(4) 2005

### 4.1 Problème générique (Problem 1.1)

`minimize f_1(x) + f_2(x)` sur un espace de Hilbert réel H, `f_1 ∈ Γ₀(H)`
(proper, lower semi-continuous, convex), `f_2 : H → R` (convexe,
différentiable à gradient `1/β`-Lipschitz — cf. les hypothèses locales des
théorèmes). Ensemble des solutions `G`.

### 4.2 Théorème 3.4 — convergence de la méthode forward-backward

> **Théorème 3.4** (formulation vérifiée dans le texte). Suppose that
> `G ≠ ∅`. Soit `(γ_n)` dans `]0, +∞[` avec `0 < inf γ_n ≤ sup γ_n < 2β`,
> `(λ_n)` dans `]0, 1]` avec `inf λ_n > 0`, et des résidus sommables
> `(a_n)`, `(b_n)`. Avec
> `x_{n+1} = x_n + λ_n·( prox_{γ_n f_1}(x_n − γ_n(∇f_2(x_n) + b_n)) + a_n − x_n )`
> :
> (i) `(x_n)` converge **faiblement** vers un point `x̄ ∈ G` ;
> (ii) `Σ ‖∇f_2(x_n) − ∇f_2(x̄)‖² < +∞` ;
> (iii) `Σ ‖prox_{γ_n f_1}(x_n − γ_n ∇f_2(x_n)) − x_n‖² < +∞` ;
> (iv) convergence **forte** ⟺ `lim d_G(x_n) = 0`, en particulier si
> `int G ≠ ∅`, ou si `f_1` (resp. `f_2`) satisfait la Condition 3.2 sur G.

- En dimension finie, convergence faible + bornitude ⟹ convergence forte d'une
  sous-suite ; la Condition 3.2 est auto-satisfaite si `dom f_1` est
  *boundedly relatively compact* (Proposition 3.6(i)) — en particulier si
  `f_1` a un domaine borné non vide, ou dans Rⁿ sous des hypothèses
  d'existence classiques. **Pour la leçon** : « la suite converge vers une
  solution » (sens faible en général, fort en dimension finie sous les
  hypothèses usuelles) — citer [CW05, Thm 3.4(i)–(iv)].
- Le pas proximal `γ_n` peut être **variable** borné dans `]0, 2β[` — la
  constante 2 (ici 2β) est la limite usuelle « pas < 2/L » signalée aussi par
  [PB14 §4.2] et [BT09] (`t_k < 2/L` pour la convergence, `t_k ≤ 1/L` pour le
  taux garanti).

---

## 5. Liassons avec le cours (vérification dans `course_sources/`)

- `course_sources/typst/optim.typ` : **aucune** occurrence de « proximal »,
  « prox », « FISTA », « ADMM », « soft-threshold » (recherche exhaustive
  dans tout `course_sources/`, toutes extensions). Le cours enseigne :
  descente de gradient (Algo 3.1, Thm 3.4 : taux `L‖x⁰−x*‖²/(2k)` pour
  `α = 1/L`), momentum (Algo 3.6), Nesterov (Algo 3.8), SGD, descente par
  coordonnées (Algo 3.13, Thm 3.16 : `O(d/k)`), Newton (Algo 3.x, quadratique
  si Hessien constant).
- `course_sources/typst/regularization.typ` § « Régularisation L1 (Lasso) » :
  Définition 5.2 (objectif `‖y−Xθ‖²₂ + λ‖θ‖₁` — sans ½), Définition 5.3
  (lasso path, linéaire par morceaux), **Algorithme 5.1 (LARS simplifié)** —
  c'est l'algorithme de calcul du lasso enseigné dans le cours ; rien n'y est
  dit sur la descente proximale.
- ⟹ **Tout le contenu de la leçon est « au-delà du cours »** et doit le rester
  visiblement marqué. Les seuls points d'ancrage dans le cours :
  (a) le modèle lasso (Partie V, leçon 4) ; (b) LARS (Algo 5.1) comme
  alternative enseignée au calcul du lasso ; (c) la descente par coordonnées
  (Partie I, leçon 4) comme autre famille d'algorithmes pour le lasso ;
  (d) le taux `O(1/k)` de la descente de gradient convexe (Thm 3.4 de
  optim.typ) dont le taux ISTA est l'analogue composite.

## 6. Points UNVERIFIED

- **UNVERIFIED** — L'attribution historique du *premier* pas proximal
  (Moreau, années 1960) est évoquée dans [CW05] (« introduced by Moreau in
  the 1960s », cf. [53] = Moreau 1965) mais la bibliographie exacte de
  Moreau 1965 n'a pas été relue ici ; à citer sans numéro de page.
- **UNVERIFIED** — Le lien exact entre l'algorithme de [PB14 §4.3]
  (`ω_k = k/(k+3)` de Vandenberghe) et le `t_{k+1} = (1+√(1+4t_k²))/2` de
  [BT09] : les deux sont des choix valides d'accélération Nesterov-type mais
  les deux sources ne se réfèrent pas l'une à l'autre sur ce point précis ;
  la leçon ne doit pas affirmer qu'ils sont *identiques* (ce ne le sont pas
  littéralement — les deux produisent des `t_k` asymptotiquement `k/2` mais
  avec des récurrences différentes).
- **UNVERIFIED** — Taux exacts de convergence de l'ADMM (en valeurs) :
  [BPC11 §3.2] donne des conditions de convergence, pas de taux ; les taux
  `O(1/k)` / `O(1/k²)` de l'ADMM dans la littérature récente (Dai 2011, etc.)
  n'ont pas été vérifiés ici et ne doivent **pas** être enseignés.
