# Recherche — Dualité KKT de la SVM : vecteurs support et parcimonie

> Agent de recherche pour le brief `p2-l4-svm-dualite-kkt`.
> Sources primaires vérifiées dans cette session (2026-09-14), texte complet
> téléchargé et lu (extrait `pdftotext` dans le répertoire de travail de
> l'agent, non conservé dans le dépôt) :
>
> - **Boyd & Vandenberghe, *Convex Optimization*, Cambridge University Press,
>   2004** — version PDF libre publiée par les auteurs
>   (https://web.stanford.edu/~boyd/cvxbook/, fichier `bv_cvxbook.pdf`).
>   Le chapitre 5 (« Duality ») a déjà été vérifié section par section dans
>   `expert/part1/lesson1/kkt-dualite-lagrangienne.research.md` §1 ; ici on
>   utilise le chapitre 8.
> - **Hastie, Tibshirani & Friedman, *The Elements of Statistical Learning*,
>   2e édition, Springer Series in Statistics** (mirroir consulté :
>   https://www.sas.upenn.edu/~fdiebold/NoHesitations/BookAdvanced.pdf,
>   764 pages) — chapitre 12 « Support Vector Machines and Flexible
>   Discriminants », pp. 417–460.
> - **Shalev-Shwartz & Ben-David, *Understanding Machine Learning: From
>   Theory to Algorithms*, Cambridge University Press, 2014** (consulté :
>   https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/understanding-machine-learning-theory-algorithms.pdf)
>   — chapitre 15 « Support Vector Machines », pp. 202–213.
> - **Vapnik, *The Nature of Statistical Learning Theory*, Springer, 1995** —
>   métadonnées seulement (cf. §1.4) ; **UNVERIFIED** pour le contenu.

## 1. Affirmations vérifiées

### 1.1 Boyd & Vandenberghe (2004) — le « § 9.4 » du brief est erroné

- **Correction** : dans B&V, le **chapitre 9 est « Unconstrained
  minimization »** (sommaire, p. 457 du livre). La SVM n'y apparaît pas.
- Le contenu SVM de B&V est au **§8.6 « Classification » → « Support vector
  classifier » (pp. 425–427)** du chapitre 8 « Geometric problems » (p. 397) :
  - heuristique LP : relâchement (8.24) avec variables non négatives
    `u₁,…,u_N, v₁,…,v_M`, puis LP (8.25)
    `minimize 1ᵀu + 1ᵀv` sous
    `aᵀxᵢ − b ≥ 1 − uᵢ`, `aᵀyᵢ − b ≤ −(1 − vᵢ)`, `u, v ≥ 0` ;
  - classifieur SVM standard (pp. 426–427, sans numéro d'équation dans
    l'extraction) :
    `minimize ‖a‖² + γ(1ᵀu + 1ᵀv)` sous
    `aᵀxᵢ − b ≥ 1 − uᵢ`, `aᵀyᵢ − b ≤ −(1 − vᵢ)`, `u, v ≥ 0`,
    avec texte exact : « The first term is proportional to the inverse of the
    width of the slab defined by −1 ≤ aᵀz − b ≤ 1. […] The parameter γ, which
    is positive, gives the relative weight of the number of misclassified
    points […] compared to the width of the slab. »
    Même schéma que la leçon (marge + pénalité linéaire des violations), à
    l'échelle près : B&V pénalise `‖a‖² + γ·(somme des slacks)` là où la
    leçon pénalise `½‖w‖² + C·(somme des slacks)` (le `1` face à `½` devant
    la norme revient à un changement d'échelle du paramètre d'échange).
  - **B&V ne dérive PAS le dual de la SVM** : pas de multiplicateurs `αᵢ`,
    pas de conditions KKT, pas de noyau dans cette section. Le livre renvoie
    explicitement ailleurs (p. 447, texte exact) : « For a detailed discussion
    of support vector classifiers, see Vapnik [Vap00] or Schölkopf and Smola
    [SS01]. »
  - Références B&V citées (vérifiées dans sa bibliographie) :
    `[Vap00]` = Vapnik, *The Nature of Statistical Learning Theory*, Springer,
    **2e édition, 2000** ; `[SS01]` = Schölkopf & Smola, *Learning with
    Kernels: Support Vector Machines, Regularization, Optimization, and
    Beyond*, **MIT Press, 2001**.
- La machine de dualité générale (lagrangienne §5.1.1, fonction duale §5.1.2
  et sa concavité, dualité faible §5.2.2, Slater §5.2.3, preuve de la dualité
  forte §5.3.2, point-selle §5.4.2, complémentarité §5.5.2, KKT §5.5.3) est
  citée depuis le **chapitre 5** — vérifié section par section dans
  `kkt-dualite-lagrangienne.research.md` §1 (pas revérifié ici).

### 1.2 Hastie, Tibshirani & Friedman, ESL 2e éd. (2009), ch. 12 — source principale

§12.2.1 « Computing the Support Vector Classifier » (pp. 420–421), texte lu
dans le PDF :

- **(12.8) primal marge souple** : `min_{β,β₀} ½‖β‖² + C Σᵢ ξᵢ` s.c.
  `ξᵢ ≥ 0`, `yᵢ(xᵀᵢβ + β₀) ≥ 1 − ξᵢ` ; texte exact : « the "cost" parameter C
  replaces the constant in (12.7); **the separable case corresponds to
  C = ∞** ».
- **(12.9) lagrangienne (primal)** :
  `L_P = ½‖β‖² + C Σᵢξᵢ − Σᵢ αᵢ[yᵢ(xᵀᵢβ + β₀) − (1 − ξᵢ)] − Σᵢ μᵢξᵢ`,
  « which we **minimize w.r.t β, β₀ and ξᵢ** ».
- **Stationnarité** (dérivées nulles) :
  **(12.10)** `β = Σᵢ αᵢyᵢxᵢ` ; **(12.11)** `0 = Σᵢ αᵢyᵢ` ;
  **(12.12)** `αᵢ = C − μᵢ` ; « as well as the positivity constraints
  `αᵢ, μᵢ, ξᵢ ≥ 0 ∀i` ».
- **(12.13) dual (Wolfe)** :
  `L_D = Σᵢ αᵢ − ½ Σᵢ Σᵢ′ αᵢαᵢ′yᵢyᵢ′xᵀᵢxᵢ′`, « which gives a lower bound on
  the objective function (12.8) for any feasible point. **We maximize L_D
  subject to 0 ≤ αᵢ ≤ C and Σᵢ αᵢyᵢ = 0** ».
- **KKT complètes** : (12.14)–(12.16), pour `i = 1,…,N` :
  - (12.14) `αᵢ[yᵢ(xᵀᵢβ + β₀) − (1 − ξᵢ)] = 0` ;
  - (12.15) `μᵢξᵢ = 0` ;
  - (12.16) `yᵢ(xᵀᵢβ + β₀) − (1 − ξᵢ) ≥ 0`.
  Texte exact : « Together these equations (12.10)–(12.16) **uniquely
  characterize the solution to the primal and dual problem**. »
- **Vecteurs support, régimes, `β₀`** (texte exact, p. 421) : « From (12.10)
  we see that the solution for β has the form (12.17) `β̂ = Σᵢ α̂ᵢyᵢxᵢ`, with
  **nonzero coefficients α̂ᵢ only for those observations i for which the
  constraints in (12.16) are exactly met** (due to (12.14)). **These
  observations are called the support vectors, since β̂ is represented in
  terms of them alone.** Among these support points, **some will lie on the
  edge of the margin (ξ̂ᵢ = 0), and hence from (12.15) and (12.12) will be
  characterized by 0 < α̂ᵢ < C; the remainder (ξ̂ᵢ > 0) have α̂ᵢ = C.** From
  (12.14) we can see that **any of these margin points (0 < α̂ᵢ, ξ̂ᵢ = 0) can
  be used to solve for β₀, and we typically use an average of all the
  solutions for numerical stability**. »
- **§12.2.2 — parcimonie** (texte exact, p. 421) : « the leave-one-out
  cross-validation error can be bounded above by the proportion of support
  points in the data. **The reason is that leaving out an observation that is
  not a support vector will not change the solution.** »
- **§12.3.1 « Computing the SVM for Classification » — noyau** (pp. 423–424) :
  - (12.19) : le dual (12.13) s'écrit avec `⟨h(xᵢ), h(xᵢ′)⟩` (base
    transformée `h`) ; (12.20) : `f(x) = Σᵢ αᵢyᵢ⟨h(x), h(xᵢ)⟩ + β₀`, et
    « given αᵢ, β₀ can be determined by solving `yᵢf(xᵢ) = 1` in (12.20) for
    any (or all) xᵢ for which `0 < αᵢ < C` » ;
  - (12.21) : « we need not specify the transformation h(x) at all, but
    require only knowledge of the kernel function
    `K(x, x′) = ⟨h(x), h(x′)⟩` […] **K should be a symmetric positive
    (semi-) definite function** » ;
  - (12.22) : trois noyaux populaires (polynomial `(1+⟨x,x′⟩)ᵈ`, RBF
    `exp(−γ‖x−x′‖²)`, réseau `tanh(κ₁⟨x,x′⟩+κ₂)`) ; (12.23) : expansion du
    polynomial de degré 2 (`M = 6`) ; (12.24) :
    `f̂(x) = Σᵢ α̂ᵢyᵢK(x, xᵢ) + β̂₀`.
- **§12.3.2 « The SVM as a Penalization Method » — hinge** (p. 426) :
  **(12.25)** `min_{β₀,β} Σᵢ[1 − yᵢf(xᵢ)]₊ + (λ/2)‖β‖²` ; texte exact : « It
  is easy to show (Exercise 12.1) that **the solution to (12.25), with
  λ = 1/C, is the same as that for (12.8)** ». Table 12.1 : le hinge loss
  estime le classifieur `G(x)` lui-même (mode de la postérieure), contrairement
  à la logistique (log-odds) ou l'erreur quadratique (`2Pr(Y=+1|x)−1`).
  « Margin maximizing loss-functions » (Rosset et al., 2004b) : si les données
  sont séparables, la limite de `β̂λ` quand `λ → 0` définit l'hyperplan
  séparateur optimal.

### 1.3 Shalev-Shwartz & Ben-David, S&B (2014), ch. 15 — dérivation alternative + Fritz John

Structure vérifiée (pp. 202–213) : 15.1 Margin and Hard-SVM (202) · 15.2
Soft-SVM and Norm Regularization (206) · 15.3 Optimality Conditions and
"Support Vectors"* (210) · 15.4 Duality* (211) · 15.5 Implementing Soft-SVM
Using SGD (212) · 15.6 Summary (213). (Les sections marquées `*` sont les
sections avancées du livre.)

- **§15.1** : (15.1) Hard-SVM `max_{(w,b):‖w‖=1} minᵢ yᵢ(⟨w,xᵢ⟩+b)` ;
  (15.2) QP équivalent avec `b` ; claim 15.1 (distance d'un point à
  l'hyperplan = `|⟨w,x⟩+b|` si `‖w‖=1`) ; lemma 15.2 (sortie du QP résout
  (15.1)) ; **§15.1.1** : cas homogène **(15.3)** `min ‖w‖² s.c.
  ∀i, yᵢ⟨w,xᵢ⟩ ≥ 1` (réduction du non-homogène au homogène « by adding one
  more feature ») ; **definition 15.3** : marge `(γ,ρ)` (`‖w?‖=1`,
  `y(⟨w?,xᵢ⟩+b?) ≥ γ`, `‖xᵢ‖ ≤ ρ` a.p. 1) ; le chapitre renvoie au th. 26.13
  (ch. avancé 26) : complexité d'échantillon en `(ρ/γ)²`, **indépendante de la
  dimension `d`** — c'est le contexte de la borne VC de la SVM (déjà traitée
  dans le cours, Théorème 3.4).
- **§15.2** : **(15.4)** Soft-SVM `min_{w,b,ξ} (λ/2)‖w‖² + (1/m) Σᵢ ξᵢ` s.c.
  `yᵢ(⟨w,xᵢ⟩+b) ≥ 1 − ξᵢ`, `ξᵢ ≥ 0` ; **(15.5)** `min_{w,b} λ‖w‖² +
  L^S_hinge((w,b))` ; **claim 15.5** : « Equation (15.4) and Equation (15.5)
  are equivalent » (preuve : minimisation sur `ξ` donne
  `ξᵢ = ℓ_hinge((w,b),(xᵢ,yᵢ))` — note de l'agent : les deux objectifs
   diffèrent par le coefficient de la norme, `(λ/2)` vs `λ`, soit un
   changement d'échelle du paramètre ; l'équivalence est au sens des mêmes
   minimiseurs après ce changement d'échelle). **Correspondance avec la leçon** :
  divisant (15.4) par `λ`, on obtient `½‖w‖² + (1/(λm)) Σᵢξᵢ`, donc
  **`C = 1/(λm)`** (la leçon ne fait pas de moyenne `1/m` dans la pénalité).
  Claim 15.6 : le hinge est `‖x‖`-Lipschitz ; corollaire 15.7 : borne de
  généralisation pour la Soft-SVM (hors périmètre du panneau — cf. Théorème 3.4
  du cours).
- **§15.3 « Optimality Conditions and "Support Vectors"* »** (texte exact,
  p. 210) : « The name "Support Vector Machine" stems from the fact that the
  solution of hard-SVM, w₀, **is supported by (i.e., is in the linear span of)
  the examples that are exactly at distance 1/‖w₀‖ from the separating
  hyperplane**. These vectors are therefore called support vectors. »
  **Theorem 15.8** : si `I = {i : |⟨w₀,xᵢ⟩| = 1}`, il existe
  `α₁,…,α_m` tels que `w₀ = Σ_{i∈I} αᵢxᵢ` ; preuve par le **lemma 15.9
  (Fritz John)** : pour `w? ∈ argmin f(w) s.c. gᵢ(w) ≤ 0`, il existe
  `α ∈ R^m` avec `∇f(w?) + Σ_{i∈I} αᵢ∇gᵢ(w?) = 0`, `I = {i : gᵢ(w?) = 0}`.
- **§15.4 « Duality* »** (texte exact, p. 211) : « **Our presentation of SVM
  does not rely on duality. For completeness, we present in the following how
  to derive the dual of Equation (15.3).** »
  - (15.7)–(15.8) : `g(w) = max_{α ≥ 0} Σᵢ αᵢ(1 − yᵢ⟨w,xᵢ⟩)` (vaut
    `0` si toutes les contraintes tiennent, `+∞` sinon), et
     `(15.3) ≡ min_w ‖w‖² + g(w) ≡ min_w max_{α≥0} [½‖w‖² + Σᵢαᵢ(1−yᵢ⟨w,xᵢ⟩)]`
     (note de l'agent : les conventions du livre sont mélangées — (15.3)
     écrit `min ‖w‖²` tandis que (15.8) écrit `½‖w‖²` et (15.11) un `½` ;
     (15.11) correspond à la convention `½‖w‖²`, i.e. celle de la leçon — le
     panneau suit la convention de la leçon) ;
  - **dualité faible** : « Now suppose that we flip the order of min and max
    […] This can only decrease the objective value (see Exercise 4) » —
    `min_w max_α ≥ max_α min_w` ; puis « **It turns out that in our case,
    strong duality also holds; namely, the inequality holds with equality** » ;
  - (15.9) : dual = `max_{α≥0} min_w [½‖w‖² + Σᵢαᵢ(1−yᵢ⟨w,xᵢ⟩)]` ;
  - « once α is fixed, the optimization problem with respect to w is
    unconstrained and the objective is differentiable; thus **at the optimum,
    the gradient equals zero** : `w − Σᵢαᵢyᵢxᵢ = 0 ⇒ w = Σᵢαᵢyᵢxᵢ`. **This
    shows us that the solution must be in the linear span of the examples, a
    fact we will use later to derive SVM with kernels.** »
  - (15.11) : dual final `max_{α≥0} [Σᵢαᵢ − ½ΣᵢΣⱼαᵢαⱼyᵢyⱼ⟨xⱼ,xᵢ⟩]` ;
    texte exact : « **Note that the dual problem only involves inner products
    between instances and does not require direct access to specific elements
    within an instance.** This property is important when implementing SVM
    with kernels, as we will discuss in the next chapter. »
  - **Note de l'agent** : la dérivation de S&B est faite pour la forme
    **homogène** (15.3, sans biais `b`) : le dual (15.11) n'a donc **pas** de
    contrainte `Σᵢαᵢyᵢ = 0`. La version non homogène avec `b` (et donc avec
    la contrainte de somme) est celle de la leçon et de ESL (12.9)–(12.13),
    citée au §1.2 ci-dessus. Le panneau suit la version non homogène.

### 1.4 Vapnik — UNVERIFIED

- **Existence vérifiée** : *The Nature of Statistical Learning Theory*,
  Springer, 1995 (cité par le cours lui-même : `course_sources/typst/theorie.typ`,
  § « Application : borne VC pour le SVM », Théorème 3.4) ; 2e édition
  Springer 2000 = `[Vap00]` de B&V (cf. §1.1). Exemplaire archive.org
  `natureofstatisti0037vapn` (1995) identifié.
- **UNVERIFIED** : le **numéro du chapitre SVM** dans l'édition 1995 ou 1998
  (*Statistical Learning Theory*, Wiley). Les copies archive.org sont en
  prêt numérique (« lending », téléchargement refusé, code 401),
  SpringerLink est bloqué (challenge navigateur) et l'API Google Books est en
  quota épuisé lors de cette session. Le « ch. 6 (SVM) » du brief n'a donc
  **pas** pu être confirmé.
- **Impact nul sur le panneau** : aucune affirmation du panneau ne vient du
  texte de Vapnik — toute la dérivation est couverte par ESL §1.2 (non
  homogène) et S&B §1.3 (homogène + Fritz John). La borne VC de la SVM est
  attribuée à Vapnik (1995) **par le cours lui-même** (`theorie.typ`,
  Théorème 3.4, affiché « Théorème 3.4 » sur la page `part9/lesson3`) : le
  panneau ne fait qu'y renvoyer, sans rien en affirmer de plus.

## 2. Corrections apportées aux « Starting references » du brief

1. **B&V « § 9.4 (exemple SVM) » — erroné.** Le ch. 9 de B&V est « Unconstrained
   minimization » (p. 457). Le contenu SVM est au **§8.6 (pp. 425–427)** :
   heuristique LP (8.24)–(8.25) + QP `‖a‖² + γ(1ᵀu+1ᵀv)` — **sans** dérivation
   duale, sans `αᵢ`, sans noyau ; le livre renvoie à Vapnik [Vap00] et
   Schölkopf–Smola [SS01] (p. 447). Le panneau ne cite B&V que pour la machine
   de dualité du ch. 5 (vérifiée dans le brief P1) et signale l'équivalence de
   schéma du QP §8.6.
2. **Vapnik, *Statistical Learning Theory* (1998), ch. 6 — UNVERIFIED**
   (cf. §1.4). Non utilisé : aucune affirmation du panneau n'en dépend.
3. **S&B ch. 15 — confirmé**, mais la dérivation duale (§15.4) y est faite en
   forme **homogène** (sans `b`) ; la version non homogène de la leçon est
   citée depuis **ESL 2e éd., ch. 12** (ajouté comme source principale, non
   listée dans le brief).
4. **Ajout** : Schölkopf & Smola, *Learning with Kernels*, MIT Press 2001
   (réf. `[SS01]` de B&V) — mentionné comme référence standard du « primal
   inchangé » ; **non lu** dans cette session : l'argument correspondant est
   fait et vérifié par l'agent au §3.4 (pas de citation de section).

## 3. Calculs faits et revérifiés par l'agent

Les deux exemples chiffrés ci-dessous ont été vérifiés **deux fois** : à la
main (KKT complètes, primal = dual) et par le solveur SMO du dépôt
(`src/lib/math/svm.ts`, `solveSvmDual`), via un script de vérification
(`esbuild` + `node`, tous les checks « OK »).

### 3.1 Exemple marge rigide — 3 points (leçon, Exercice 1 + un point)

`x₁ = (1,0)`, `y₁ = +1` · `x₂ = (−1,0)`, `y₂ = −1` · `x₃ = (2,0)`, `y₃ = +1`
(C très grand, i.e. rigide).

- **Primal** : contraintes `w₁ + b ≥ 1`, `−w₁ + b ≥ 1`, `2w₁ + b ≥ 1` ⇒
  `w₁ ≥ 1 + |b|` ; `p* = ½` atteint en `(ŵ, b̂) = ((1,0), 0)` (marge
  `γ = 1/‖ŵ‖ = 1`).
- **Dual** : matrice `Qᵢⱼ = yᵢyⱼ⟨xᵢ,xⱼ⟩` avec
  `⟨x₁,x₂⟩ = −1`, `⟨x₁,x₃⟩ = 2`, `⟨x₂,x₃⟩ = −2` ; objectif
   `α₁+α₂+α₃ − ½αᵀQα` s.c. `α ≥ 0`, `α₁−α₂+α₃ = 0`. Solution
   **`α̂ = (½, ½, 0)`** (vérifiée à la main : pas de point critique
   intérieur — le système de stationnarité est incompatible ; maximum de
   chaque arête du polytope calculé, l'unique maximiseur est
   `(½, ½, 0)` avec valeur `½` — et confirmée par le solveur SMO du dépôt).
- **KKT complètes** : `Σαᵢyᵢ = 0` ✓ ; compléments
  `αᵢ(mᵢ−1) = 0` avec `m = (1, 1, 2)` ✓ (`α₃(m₃−1) = 0·1 = 0`) ;
  `ŵ = Σα̂ᵢyᵢxᵢ = ½(1,0) − ½(−1,0) = (1,0)` ✓ ; `b̂ = 1 − y₁⟨ŵ,x₁⟩ = 0` ✓
  (point intérieur, donc `b̂` unique).
- **Parcimonie (vérifiée numériquement)** : retirer `x₃` (non-SV, `m₃ = 2 > 1`,
  `α̂₃ = 0`) donne le problème à 2 points de l'Exercice 1 de la leçon —
  solution identique `((1,0), 0)`, `α̂ = (½,½)`. Le classifieur ne change pas
  quand on retire un point non vecteur support.

### 3.2 Exemple marge souple, `C = 1` — 3 points

`x₁ = (1,0)`, `y₁ = +1` · `x₂ = (−1,0)`, `y₂ = −1` · `x₃ = (−½,0)`, `y₃ = +1`
(les deux `+` du même côté de la marge : `x₃` est « dans la marge »).

- **Dual** : `Q = [[1, 1, −½], [1, 1, −½], [−½, −½, ¼]]` (rang 1 :
  `Q = vvᵀ` avec `v = (1, 1, −½)`). Maximisation concave
  `Σαᵢ − ½(Σᵢvᵢαᵢ)²` s.c. `0 ≤ αᵢ ≤ 1`, `α₁−α₂+α₃ = 0` : pas de point
  critique intérieur (le système donne `−6 = 0`), maximum sur le bord —
  **`α̂ = (0, 1, 1)`**, `d* = 2 − ½·(¼) = 15/8`. (`α̂ = (½,½,0)` ne donne que
  `1/2` : c'est la solution rigide, dominée.)
- **Primal à `b̂ = ½`** : `ŵ = Σα̂ᵢyᵢxᵢ = (1,0) + (−½,0) = (½,0)` ;
  `m = (1, 0, ¼)` ; `ξ = (0, 1, ¾)` ; objectif
  `½·(¼) + (0+1+¾) = ⅛ + 7/4 = 15/8 = d*` ✓ (dualité forte).
- **KKT complètes (vérifiées, toutes à `b̂ = ½`)** :
  `α̂ᵢ(mᵢ−1+ξᵢ) = 0` ✓ (valeurs `(0, 0, 0)`) ;
  `(C−α̂ᵢ)ξᵢ = 0` ✓ (`(1,0,0)·(0,1,¾)`) ;
  `mᵢ−1+ξᵢ ≥ 0` ✓ ; `0 ≤ α̂ᵢ ≤ C` ✓ ; `Σα̂ᵢyᵢ = 0` ✓.
- **Régimes** : `x₁` est **sur la marge** (`m₁ = 1`) avec **`α̂₁ = 0`** —
  illustration de « pas forcément tous » ; `x₂` est **mal classé**
  (`m₂ = 0`) avec `α̂₂ = C` ; `x₃` est dans la marge, bien classé
  (`m₃ = ¼`) avec `α̂₃ = C`. **Aucun** `α̂ᵢ` intérieur : `b̂` n'est **pas
  unique** (cf. §3.5).
- **Conséquence `ξᵢ > 0 ⇒ α̂ᵢ = C`** (ligne commentée dans la source du
  cours, cf. §4) : ici `ξ₂ = 1 > 0` et `ξ₃ = ¾ > 0`, et bien
  `α̂₂ = α̂₃ = C` ✓. La réciproque est faible : `α̂ᵢ = C` ne force pas
  `ξᵢ > 0` (un point peut être `α̂ᵢ = C` et sur la marge).

### 3.3 Dérivation du dual souple — d'où vient `0 ≤ αᵢ ≤ C`

Primal (leçon, `optim4`) : `min ½‖w‖² + C Σᵢξᵢ` s.c.
`1 − ξᵢ − yᵢ(⟨w,xᵢ⟩+b) ≤ 0`, `ξᵢ ≥ 0`. MultiPLICATEURS `αᵢ ≥ 0` (première
contrainte) et `μᵢ ≥ 0` (seconde) :

```
L = ½‖w‖² + C Σᵢξᵢ + Σᵢ αᵢ(1 − ξᵢ − yᵢ(⟨w,xᵢ⟩+b)) − Σᵢ μᵢξᵢ
  = ½‖w‖² + Σᵢ αᵢ(1 − yᵢ(⟨w,xᵢ⟩+b)) + Σᵢ (C − αᵢ − μᵢ) ξᵢ .
```

- **Minimisation sur `ξᵢ ≥ 0`** : `min_{ξᵢ≥0} (C−αᵢ−μᵢ)ξᵢ` est fini
  (vaut `0`, atteint en `ξᵢ = 0`) **ssi** `C − αᵢ − μᵢ ≥ 0`.
- **Minimisation sur `w`** (sans contrainte, quadratique strictement
  convexe) : `∇_w L = w − Σᵢαᵢyᵢxᵢ = 0` ⇒ `w = Σᵢαᵢyᵢxᵢ`, et
  `½‖w‖² − ⟨w, Σᵢαᵢyᵢxᵢ⟩ = −½Σᵢⱼαᵢαⱼyᵢyⱼ⟨xᵢ,xⱼ⟩`.
- **Minimisation sur `b`** : `∂L/∂b = −Σᵢαᵢyᵢ` ; l'infimum en `b` est fini
  **ssi** `Σᵢαᵢyᵢ = 0` (sinon `L → −∞` quand `b → ±∞`).
- Le dual est donc `max_{α,μ ≥ 0, C−αᵢ−μᵢ ≥ 0} Σᵢαᵢ − ½αᵀQα` ; l'objectif
  ne dépendant pas de `μ`, on pose `μᵢ = C − αᵢ`, d'où **`0 ≤ αᵢ ≤ C`** et le
  dual (leçon, `optim5`). Identique au (12.10)–(12.13) d'ESL.

### 3.4 « Le primal reste inchangé » (noyau) — argument de projection

Soit `H` un RKHS sur `X` de noyau `K` (application canonique `φ : X → H`), et
le primal dans `H` :

```
(P_H)  min_{w∈H, b, ξ≥0}  ½‖w‖²_H + C Σᵢ ξᵢ
       s.c.  yᵢ(⟨w, φ(xᵢ)⟩_H + b) ≥ 1 − ξᵢ .
```

Soit `S = span{φ(x₁), …, φ(xₙ)}` et `P_S` la projection orthogonale de `H`
sur `S`. Pour tout `w ∈ H`, `w = P_S w + v` avec `v ∈ S⊥` :

- `‖w‖²_H = ‖P_S w‖²_H + ‖v‖²_H ≥ ‖P_S w‖²_H` ;
- `⟨w, φ(xᵢ)⟩_H = ⟨P_S w, φ(xᵢ)⟩_H` pour tout `i` (car `φ(xᵢ) ∈ S` et
  `v ⟂ S`).

Donc `(P_S w, b, ξ)` est réalisable et a un objectif **au plus aussi grand**
que `(w, b, ξ)` : l'infimum sur `H` vaut l'infimum sur `S`. Plus : si `w` est
optimal, `‖P_S w‖² = ‖w‖²` (sinon `P_S w` serait strictement meilleur), donc
`v = 0` : **tout** `w` optimal appartient à `S`.

Conclusion : le primal dans `H` a exactement les mêmes solutions et la même
valeur que le problème fini-dimensionnel restreint à `S` — « **le primal reste
inchangé** ». Et pour `w ∈ S`, la stationnarité (ESL (12.10)) écrit
`w = Σᵢαᵢyᵢφ(xᵢ)` ; le dual (ESL (12.13)/(12.19)) ne contient plus que
`⟨φ(xᵢ), φ(xⱼ)⟩_H = K(xᵢ, xⱼ)` : d'où l'apparition du noyau. Soutenu par S&B
§15.4 (« the solution must be in the linear span of the examples, a fact we
will use later to derive SVM with kernels ») pour le cas linéaire.
*(Argument fait par l'agent ; ESL §12.3.1 donne la moitié duale (12.19)–
(12.24) mais ne développe pas explicitement l'argument primal.)*

### 3.5 Non-unicité de `b̂` (aucun `αᵢ` intérieur) — et écart du solveur du dépôt

Pour `α̂ = (0,1,1)` du §3.2, fixons `ŵ = (½,0)` et cherchons l'ensemble des
`b` optimales : `ξᵢ*(b) = max(0, 1 − mᵢ(b))` avec `m(b) = (½+b, ½−b, −¼+b)`.

- Pour `b ≥ ½` : `ξ = (0, ½+b, 5/4−b)` (quand `b ≤ 5/4`) ⇒
  `Σξ = 7/4` constant ⇒ objectif `= 15/8` : **tout** `b ∈ [½, 5/4]` est
  optimal. Pour `b < ½` ou `b > 5/4` : objectif `> 15/8`.
- L'ensemble des `b` optimales est exactement **`[½, 5/4]`** ; `b̂` n'est pas
  unique (cohérent avec la remarque du cours, §4, et avec ESL « we typically
  use an average of all the solutions » — qui ne s'applique qu'aux points
  intérieurs).
- **Écart constaté dans le solveur du dépôt** (`src/lib/math/svm.ts:331–346`) :
  en l'absence de point intérieur, `b` est choisi comme **moyenne des
  `yᵢ(1−(Qα)ᵢ)` sur les vecteurs de support frontaux** — ici
  `(−½ + 5/4)/2 = 3/8`, qui est **hors** de `[½, 5/4]` : avec cette `b`,
  `ξ₁ = ⅛ > 0` alors que `C − α̂₁ = 1 > 0`, donc la complémentarité
  `(C−α̂ᵢ)ξᵢ = 0` est **violée** (vérifié numériquement). Le commentaire du
  code (« on peut prendre toute valeur d'un intervalle — on choisit ici la
  moyenne ») décrit bien le phénomène de non-unicité, mais la moyenne des
  valeurs frontales n'est **pas garantie** d'être dans l'intervalle valide.
  **À traiter avant de construire la démo** du panneau (cf. brouillon,
  « Proposed demo ») : soit projeter la valeur de `b` sur l'intervalle valide
  (bornes données par les inégalités de complémentarité), soit choisir pour la
  démo un exemple avec au moins un `αᵢ` intérieur, soit calculer les résidus
  KKT avec `ξᵢ = max(0, 1−mᵢ)` et les afficher (cas où le résidu `(C−αᵢ)ξᵢ`
  est visible, le panneau le mentionnerait).

## 4. Périmètre du cours (frontière)

Sources : `course_sources/marine/Cours/CM/coursClassif-4-SVM.tex` (numéros de
ligne de l'extraction) et `src/routes/part2/lesson4/+page.svelte` (page
enseignée).

**Déjà enseigné (ne pas réenseigner)** :

| Contenu | tex | page leçon |
|---|---|---|
| primal rigide (`optim2`) + QP | 902 | Déf. 4.1–4.4, « Proposition — formulation primale » (445) |
| dual rigide (`optim3`) énoncé + `ŵ`, `b̂` | 957 | TheoremBlock 505–521 (preuve : Azencott §10.1.3) |
| Lagrangien plein/réduit, (P)→(Q), dualité faible, Slater | 974–1060 | 523–559 |
| KKT rigide **énoncé** (écart complémentaire) + 2 cas + parcimonie « pas forcément tous » | 1003 | Callout 561–593 |
| primal souple (`optim4`) + `C` hyperparamètre + reformulation hinge | 1155, 1167–1187 | 790–858 |
| dual souple (`optim5`) énoncé + `ŵ`, `b̂` (points intérieurs) | 1232–1241 | TheoremBlock 919–935 |
| `b̂` non unique si aucun `αᵢ` intérieur (intervalle) | 1249 | Callout 937–948 |
| KKT souple **énoncé** + 3 cas (m>1 ⇒ α=0 ; α>0, ξ=0 ⇒ SV ; α>0, ξ≠0 ⇒ outlier) + parcimonie | 1265–1278 | TheoremBlock 957–1002 |
| dual noyau (`optim6-bis`) + `b̂`, classifieur ; « φ intervient uniquement via les produits scalaires » (astuce du noyau) ; Def. 4.6 Noyau, 4.7 sym. s.p.d., Moore–Aronszajn | 1341, 1364 | 1180–1196, 1198–1212, 1226–1330 |

**Au-delà du cours (contenu du panneau)** :

1. **La minimisation interne** `min_{w,b} L` : la leçon écrit (P) et (Q) et
   énonce le dual (TheoremBlock « Proposition », preuve renvoyée à Azencott),
   mais ne **calcule jamais** `min_{w,b} L` — ni l'apparition de
   `w = Σαᵢyᵢxᵢ`, ni de la contrainte `Σαᵢyᵢ = 0` (rigide) / `0 ≤ αᵢ ≤ C`
   (souple, via `μᵢ = C − αᵢ`). → Blocs « Dérivation du dual » du panneau
   (calculs §3.3).
2. **`ξᵢ > 0 ⇒ α̂ᵢ = C`** : la ligne correspondante est **commentée** dans la
   source (`coursClassif-4-SVM.tex:1275`,
   `%De plus, d'après les conditions d'optimalité de Karush-Kuhn-Tucker,
   \widehat{\alpha}_i^ = C`). Elle n'apparaît dans la page enseignée qu'en
   passant, dans la **correction de l'Exercice 2** (ligne 1091 : « et
   `α̂₃ = C`, d'après les conditions de Karush-Kuhn-Tucker »), **sans
   démonstration** (ni apparition de `μᵢ = C − αᵢ`). Le panneau la démontre
   (ESL (12.12)+(12.15) ; calcul §3.2).
3. **L'argument « le primal reste inchangé » sous le noyau** : la leçon
   enseigne le dual noyau et l'astuce du noyau (φ n'intervient que via les
   produits scalaires) mais **pas** pourquoi le primal (dans l'espace de
   redescription) a les mêmes solutions — l'argument de projection sur
   `span{φ(xᵢ)}` (§3.4) est absent de la source.
4. **Les KKT complètes** (faisabilité primal/dual, les **deux** complémentarités
   `αᵢ(·) = 0` et `μᵢξᵢ = 0`, la condition `mᵢ − 1 + ξᵢ ≥ 0`) : la source
   n'énonce que l'écart complémentaire `α̂ᵢ[yᵢ(⟨ŵ,xᵢ⟩+b̂)−1+ξᵢ] = 0`.
5. **L'argument de parcimonie** (retirer un point non-SV ne change pas le
   classifieur) : la source **conclut** (« Ce sont seulement ces vecteurs de
   support [et outliers] qui sont utilisés pour construire le classifieur »,
   tex 1278) sans démontrer ; ESL §12.2.2 fournit l'argument (cf. §1.2).

## 5. Observations — violations AGENTS.md préexistantes (non corrigées ici)

La page `src/routes/part2/lesson4/+page.svelte` contient des références au
support brut dans du texte enseigné, contraires à la règle « le site présente
son propre contenu » (pas de « les diapositives », pas de cadrage « au-delà
du cours ») :

- ligne 538 : « c'est pourquoi **les diapositives** écrivent le Lagrangien
  réduit » ;
- ligne 630 : « *Exercice d'entraînement, **au-delà des diapositives**.* » ;
- ligne 1055 : idem (Exercice 2) ;
- ligne 1168 : « (l'application **de la diapositive**) ».

Hors périmètre de ce brief (ne pas modifier `src/` ici) — à signaler à
l'orchestrateur. Le brouillon du panneau ne reproduit **pas** ce schéma.

## 6. Check-list de vérification du brief

- [x] Chaque théorème/esquisse de preuve vérifié contre une source primaire
      (ESL ch. 12 lu dans le PDF — équations (12.8)–(12.25) ; S&B ch. 15 lu
      dans le PDF — (15.1)–(15.11), th. 15.8, lemme 15.9 ; B&V §8.6 lu dans le
      PDF — (8.24)–(8.25) + QP ; B&V ch. 5 via le brief P1 déjà vérifié).
- [x] Aucune affirmation hors cours présentée comme du cours (frontière
      détaillée en §4, ligne à ligne).
- [x] Références complètes (auteur, année, éditeur, section, URL) — seules
      exceptions assumées : Vapnik 1995/1998 **UNVERIFIED** pour le numéro de
      chapitre (§1.4, impact nul) et Schölkopf–Smola non lu (argument fait par
      l'agent, §3.4).
- [x] Formules valides KaTeX / sûres `String.raw` : les 14 blocs de formules
      de `draft.md` rendus avec `katex.renderToString` (KaTeX 0.16.47 du
      dépôt), aucun échec, aucun backtick ni `${`.
- [x] Fichier de source du cours cité pour la frontière
      (`coursClassif-4-SVM.tex` + numéros de ligne ; `theorie.typ` pour le
      Théorème 3.4).
- [x] Brouillon français de niveau M2 → rédigé dans `draft.md` (10 blocs +
      « Proposed demo »).
