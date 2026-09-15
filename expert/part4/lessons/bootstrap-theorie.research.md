# Recherche — `p4-lesson-bootstrap-theorie`

Théorie du bootstrap (leçon expert, Partie IV, après la leçon 3).

Brief : `expert/part4/lessons/bootstrap-theorie.md` · Leçon cible :
`src/routes/part4/lesson3/+page.svelte` (panneau expert déjà implémenté,
lignes ~226–516) + nouvelle page `src/routes/part4/bootstrap-theorie/` ·
Matériel réutilisé du panneau : `expert/part4/lesson3/bootstrap-theorie.research.md`
(+ `.draft.md`). Statut des affirmations : **VÉRIFIÉ** (lu dans la source
primaire) / **croisé** (source secondaire fiable, primaire citée mais non lue
en intégral cette session) / **UNVERIFIED** (à ne pas présenter comme fait
établi).

Note de méthode : Bickel & Freedman (1981) relu en intégral cette session
(PDF scanné Project Euclid, OCR tesseract, 22 pages — les numéros de
théorèmes/équations et les énoncés sont inambigus malgré le bruit OCR) ;
Efron (1987) relu en intégral (PDF 16 pages, texte natif) ; DiCiccio, Martin &
Young (1992) relu en intégral (PDF 11 pages, texte natif). Les métadonnées
bibliographiques des références ajoutées cette session ont été résolues via
l'API Crossref (DOI, volume, pages).

## Frontière du cours (vérifiée dans la source de vérité)

Réutilisée du research du panneau (vérifiée, non re-contredite) :

- `course_sources/sophie/StatM1S1_2025.pdf`, §6 « Inférence dans le modèle
  gaussien » (diapos 22–28) : (H3) diapo 22 ; Th. 2 diapo 23
  (`β̂_MV = (XᵀX)⁻¹XᵀY`, `σ̂²_MV = SCR/n` biaisé, préférer `σ̂² = SCR/(n−p−1)`
  diapo 25) ; §6.2 diapo 26 : (i) `β̂ ~ N_{p+1}(β, σ²(XᵀX)⁻¹)` ;
  (ii) `(n−p−1)σ̂²/σ² ~ χ²(n−p−1)` ; (iii) `β̂` ⊥ `σ̂²` ;
  (iv) `T_{j−1} ~ Student(n−p−1)` ; §6.3 diapo 27 IC de Student ;
  §6.4 diapo 28 test de Student. **Le bootstrap n'apparaît nulle part dans ce
   PDF** (zéro occurrence « boot »). Tout le contenu de la leçon est donc
   au-delà de cette source de vérité.
- Le seul fait de resamplage du cours : `course_sources/typst/regularization.typ`,
  ch. 4 « Méthodes ensemblistes » : Définition 4.5 (échantillon bootstrap :
  n tirages avec remise, `(1−1/e) ≈ 63,2 %` de points présents, `1/e ≈ 36,8 %`
  absents), Algorithme 4.1 (bagging), Théorème 4.2 (variance `σ²/M` si modèles
  décorrélés), Définition 4.6 (erreur OOB). Enseigné sur le site en Partie V,
  leçon 1 (`src/routes/part5/lesson1/+page.svelte`, callout « Pourquoi 63.2% ? »
  + démo `BootstrapSampler`).

Conséquence pour la leçon : tout le contenu est « au-delà du cours » ; seuls
points d'ancrage autorisés dans le texte visible : les lois exactes de la
leçon 3 (Th. 3.3 du site) comme point de départ, le panneau expert de la
leçon 3 (recette du bootstrap), et le 63,2 % / OOB enseignés en Partie V,
leçon 1.

## RQ1 — Formalisation : loi empirique, échantillon bootstrap, fonctionnels de von Mises, fonctions d'influence

**VÉRIFIÉ — Efron (1979)** (reutilisé du research du panneau, PDF lu en
intégral ; Ann. Statist. 7(1), 1–26, DOI 10.1214/aos/1176344139, §2 et §7) :
loi empirique `F̂_n` (masse 1/n en chaque `x_i`), échantillon bootstrap `X*`
de taille n tiré **avec remise** dans `F̂_n`, loi bootstrap de
`R* = R(X*, F̂_n)` comme approximation de la loi de `R(X, F)`, cohérence de
Fisher (« equals the desired distribution of R if F = F̂_n »), méthode Monte
Carlo n° 2 (histogramme des B réalisations), §7 régression
(`x_i* = g_i(θ̂) + ε̂_i*`, covariance bootstrap ≈ `σ̂²G⁻¹`).

**VÉRIFIÉ — Bickel & Freedman (1981), §3 « Bootstrapping von Mises
functionals » (pp. 1200–1203), relu en intégral cette session** :

- Cadre (p. 1200) : les pivots d'intérêt à limite normale s'écrivent
  `n^{1/2}{g(S_n/n) − g(μ)} / v(T_n/n)` (eq. 3.1) avec
  `S_n = Σh(X_i)`, `T_n = Σr(X_i)` ; l'asymptotique repose sur la
  **linéarisation** (eq. 3.4) :
  `n^{1/2}{g(S_n/n) − g(μ)} = g'(μ) n^{−1/2} Σ(h(X_i) − μ) + o_p(1)`,
  si `E‖h(X_1)‖² < ∞` et `g` différentiable en `μ` ; « The bootstrap
  commutes with smooth functions in exactly the same way » (eq. 3.6) : la
  même linéarisation vaut **conditionnellement** aux données
  (`Λ_n → 0` en probabilité conditionnelle).
- **Définition de fonctionnel de von Mises (eq. 3.8–3.9, p. 1201)** :
  `g : 𝓕 → ℝ` (𝓕 convexe de mesures de probabilité contenant F et les masses
  ponctuelles) est un fonctionnel de von Mises si `g` est
  **Gâteaux-différentiable** en `F` avec dérivée représentable comme
  intégrale :
  `g'(F)(G−F) = d/dθ g(F + θ(G−F))|_{θ=0} = ∫ ψ(x, F) dG(x)`,
  avec nécessairement `∫ ψ(x, F) dF(x) = 0`. « Such g are often called von
  Mises functionals. » `ψ(·, F)` est la **fonction d'influence** de `g` en `F`.
- Décomposition de Taylor (eq. 3.10) :
  `g(F̂_n) − g(F) = g'(F̂_n − F) + Δ_n(F̂_n, F)` avec
  `Δ_n = o_p(g'(F̂_n − F))` ; le résultat d'asymptoticité normale standard :
  `n^{1/2}{g(F̂_n) − g(F)}` et `n^{1/2} ∫ ψ(x, F) d(F̂_n − F)` ont la même
  limite `N(0, ∫ψ²(x,F) dF)`.
- Analogie bootstrap (eq. 3.11–3.12) : on espère
  `g(G_n*) − g(F̂_n) = g'(G_n* − F̂_n) + δ_n` avec
  `n^{1/2} δ_n(G_n*, F̂_n) → 0` **en probabilité conditionnelle** (p.s.),
  d'où la loi conditionnelle de `n^{1/2} ∫ ψ(X_i*, F̂_n) dF̂_n*` tend vers
  `N(0, ∫ψ² dF)` — i.e. le bootstrap « commute » avec la linéarisation,
  exactement comme le CLT sous F.
- **Conditions suffisantes simples** (p. 1201, exploitées dans le Th. 3.1) :
  (i) `∫ ψ²(x, F) dF(x) < ∞` ; (ii)
  `∫ {ψ(x, F̂_n) − ψ(x, F)}² dF̂_n → 0` **p.s.** (convergence de la fonction
  d'influence évaluée en `F̂_n` vers celle évaluée en `F`).
- **Théorème 3.1** (p. 1202) : pour le fonctionnel de von Mises non linéaire
  le plus simple `g(H) = ∫∫ w(x, y) dH(x) dH(y)` (eq. 3.13, noyau symétrique),
  si `∫∫ w² dF dF < ∞` (3.15) et `∫ w²(x, x) dF(x) < ∞` (3.16), alors, pour
  presque tous les échantillons, **conditionnellement à `(X_1,…,X_n)`**,
  `n^{1/2}{g(G_n*) − g(F̂_n)}` converge faiblement vers
  `N(0, σ²)` (σ² eq. 3.18). La fonction d'influence correspondante (eq. 3.19) :
  `ψ(x, F) = ∫ w(x, y) dF(y) − g(F)`.
- La **U-statistique d'ordre 2** (eq. 3.14) est le cas adjacent
  (`g_n(F̂_n) = n^{-1} Σ_{i≠j} w(X_i, X_j)`) ; si `Ew²(X_1, X_2) < ∞` et
  `Ew²(X_1, X_1) < ∞`, la conclusion du Th. 3.1 vaut aussi pour la
  U-statistique bootstrap (p. 1203).
- Exemple : la statistique de **Wilcoxon à un échantillon** se bootstrappe
  valablement (p. 1203) ; extensions aux U-statistiques d'ordre quelconque,
  vectorielles, multi-échantillons « straightforward » sous les hypothèses de
  Filipova (1962) (p. 1203).
- **Bootstrap paramétrique** (p. 1199, relu cette session) : on peut
  resamplage dans n'importe quel estimateur `F̃_n` de F — l'argument du
  Th. 2.1 montre que ça marche dès que `F̃_n → F` en `T₂` (convergence faible
  **et** du second moment) ; condition (2.4)
  `∫ v dF̃_n → ∫ v dF` p.s. pour tout `v` de moments contrôlés. Pour
  `F̃_n = F_{θ̂_n}` (modèle paramétrique), (2.4) tient si `F = F_{θ₀}`,
  `θ̂_n` fortement consistant et `θ ↦ ∫ v dF_θ` continue. **C'est la
  justification théorique du bootstrap paramétrique** (celui qui répare le
  maximum, voir RQ6).

## RQ2 — Consistance : énoncé, esquisse de preuve, cas OLS

**VÉRIFIÉ — Bickel & Freedman (1981), §2 (pp. 1197–1199), relu en intégral
cette session** :

- **Mécanisme des « deux erreurs » (p. 1197, citation)** : « Comparing the
  classical `√n(X̄_n − μ)` with the bootstrap `√n(X̄_m* − X̄_n)`, the parameter
  μ is replaced by `X̄_n`. But this change is of the critical order of
  magnitude, namely `1/√n`, and cannot be ignored. However, there is a second
  error: the X's have been replaced by X*'s. **In fact, these two errors
  cancel each other to a large extent.** Our proof will make this idea
  precise, by showing that the distribution of the pivot does not change much
  if the empirical `F̂_n` is replaced by the theoretical F. »
- **Théorème 2.1** (p. 1198) : `X_i` i.i.d. de variance finie positive σ².
  Le long de presque toutes les suites d'échantillons, **conditionnellement à
  `(X_1,…,X_n)`**, quand `m, n → ∞` : (a) la loi conditionnelle de
  `√m(X̄_m* − X̄_n)` converge faiblement vers `N(0, σ²)` ; (b)
  `s_m*² → σ²` en probabilité conditionnelle. Conséquence (p. 1198) : la
  distribution asymptotique du pivot bootstrap
  `Q* = √m(X̄_m* − X̄_n)/s_m*` coïncide avec celle du pivot classique
  `Q_n = √n(X̄_n − μ)/s_n` : la normale standard.
- **Métrique de Mallows d₂ (p. 1198)** : sur `Γ₂ = {G : ∫x² dG < ∞}`,
  `G_n = G` ⇔ `G_n → G` faiblement **et** `∫x² dG_n → ∫x² dG`. La distance
  `d₂(G,H)²` est l'infimum de `E{(X−Y)²}` sur tous les couplages de
  marginales G et H (Mallows 1972 ; Tanaka 1973 ; cf. aussi Dobrushin 1970,
  Vallender 1973 — métriques de Vassiliev/Vassershtein). Loi forte :
  `F̂_n = F` le long de presque toutes les suites (eq. 2.1). Lemme 3 de
  Mallows (1972) : `d₂(G^m, H^m) ≤ d₂(G, H)` (eq. 2.2), où `G^m` est la loi
  de `√m` fois la moyenne centrée de m tirages de G — le passage à la moyenne
  est **d₂-contraction**.
- **Preuve du Th. 2.1a (p. 1198, citation)** : « conditionally, the law of
  `√m(X̄_m* − X̄_n)` is just `F̂_n^m`. But `F̂_n` is close to F in the
  d₂-metric … by (2.1). So `F̂_n^m` is close to `F^m` by (2.2). Now use the
  ordinary Central Limit Theorem on `F^m`. » — i.e. : la loi conditionnelle
  bootstrap est `F̂_n^m` ; `F̂_n ≈ F` (loi forte en d₂) ; la contraction
  d₂ donne `F̂_n^m ≈ F^m` ; le CLT s'applique à `F^m`. **Le pivot ne
  « change pas beaucoup » si `F̂_n` est remplacé par F** — c'est la
  compensation formelle des deux erreurs.
- **Version vectorielle — Théorème 2.2** (p. 1198) : même résultat pour
  `X_i ∈ ℝ^k` avec `E‖X_1‖² < ∞` : loi conditionnelle de
  `√m(m^{−1}ΣX_i* − X̄_n) ⇒ N_k(0, Σ_théorique)` ; matrice de covariance
  empirique bootstrap → covariance théorique en probabilité conditionnelle.
  Si `E‖X_1‖⁴ < ∞`, la matrice estimée peut à son tour être bootstrappée,
  etc.
- **Formulation générale (p. 1199, fin §2, citation)** : « To close this
  section, we set our results in the general context introduced by Efron. He
  considers real valued functions `Z_n(·,·)` on `ℤⁿ × 𝔽` … We interpret this
  as follows: **If the law of `Z_n{(X_1,…,X_n), F}` tends weakly to a limit
  as `n → ∞`, then the conditional distribution of
  `Z_m*{(X_1*,…,X_m*), F̂_n}` given `(X_1,…,X_n)` tends weakly to the same
  limit law with probability one as `m, n → ∞`.** » La notion de B&F est
  **plus forte** que celle d'Efron (convergence p.s. plutôt qu'en
  probabilité) ; Efron avait établi la convergence au sens faible pour la
  moyenne quand F a un support fini.
- **Cas OLS — VÉRIFIÉ (résumé) — Freedman (1981)**, « Bootstrapping
  Regression Models », Ann. Statist. 9(6), 1218–1228,
  DOI 10.1214/aos/1176345638 (reutilisé du research du panneau ; page
  Project Euclid lue) : « The regression and correlation models are
  considered. **It is shown that the bootstrap approximation to the
  distribution of the least squares estimates is valid, and some error
  bounds are given.** » — resamplage des paires `(X_i, Y_i)`, nombre de
  paramètres fixé. Confirmé par B&F §7 (p. 1211, relu cette session) :
  « Freedman (1981) has pursued the use of the bootstrap for least squares
  estimates in regression models when the number of parameters is fixed, and
  arrived at results very similar to those obtained for means in the
  one-sample problem. »
- **Travail parallèle — VÉRIFIÉ** : Singh, K. (1981). « On the Asymptotic
  Accuracy of Efron's Bootstrap ». Ann. Statist. 9(6), 1187–1195
  (même numéro que B&F) — cité dans l'introduction de B&F (p. 1196, relu) :
  « Some of the problems discussed in this paper have been studied
  independently by Singh (1981). » (métadonnées confirmées sur
  dml.mathdoc.fr, Ann. Statist. 1981).
- **UNVERIFIÉ** : les hypothèses techniques exactes de Freedman (1981)
  (design fixe vs aléatoire, moments des erreurs) — le corps de la preuve est
  paywall. La leçon formule le résultat au niveau du résumé (« sous des
  conditions légères, nombre de paramètres p fixé ») et n'invente pas
  d'hypothèses fines.

## RQ3 — Intervalles de confiance : basic, percentile, studentized, BCa, premier/second ordre

**croisé — Efron & Tibshirani (1993) / Davison & Hinkley (1997)** (reutilisé
du research du panneau ; livres non relus, équations croisées via source
secondaire citant pages/équations exactes) :

- **Basic / reverse percentile** (D&H 1997, eq. 5.6 p. 194) :
  `(2θ̂ − q*_{1−α/2}, 2θ̂ − q*_{α/2})`.
- **Percentile** (E&T 1993, eq. 13.5 p. 171 ; D&H 1997, eq. 5.18 p. 203) :
  `(q*_{α/2}, q*_{1−α/2})`.
- **Studentized / bootstrap-t** (E&T 1993, eq. 12.22 p. 160 ; D&H 1997,
  eq. 5.7 p. 194) : `(θ̂ − t*_{1−α/2}·sê_θ, θ̂ − t*_{α/2}·sê_θ)` avec
  `t* = (θ̂* − θ̂)/sê_{θ*}` ; « the studentized test enjoys optimal
  properties as the statistic that is bootstrapped is pivotal ».
- Caveat percentile (E&T 1993) : « will work well in cases where the
  bootstrap distribution is symmetrical and centered on the observed
  statistic … if the bootstrap distribution is non-symmetric, then
  percentile confidence intervals are often inappropriate » ; petit
  échantillon : pour la variance, `n = 20`, niveau nominal 90 % → couverture
  réelle 78 %.
- Hiérarchie de précision (cadre DiCiccio & Efron, discuté par Hall) :
  première ordre = erreur de couverture `O(n^{−1/2})` ; deuxième ordre =
  `O(n^{−1})`.

**VÉRIFIÉ — Efron (1987)**, « Better Bootstrap Confidence Intervals », JASA
82(397), 171–185, DOI 10.1080/01621459.1987.10478410 (PDF relu en intégral
cette session, 16 pages) :

- Résumé : les IC bootstrap discutés « results in second-order correctness in
  a wide variety of problems » (cf. research du panneau) ; l'article
  automatise transformations, corrections de biais et accélérations sans que
  le statisticien ait à les dériver cas par cas.
- **Modèle de travail (2.3, p. 172)** : il existe une transformation monotone
  `ϑ = g(θ)`, une constante de biais `z₀` et une **constante d'accélération a**
  tels que `(ϑ̂ − ϑ)/σ_ϑ ~ N(−2a·(…), σ_ϑ = 1 + a·(…))` (l'OCR des termes
  exacts est bruité ; le modèle (2.2) avec a = 0 est « normalité + écart-type
  constant après transformation », introduit par Efron 1981/1982a pour les
  intervalles BC).
- **Constante de biais (eq. 4.1, p. 175, VÉRIFIÉ)** :
  `z₀ = Φ⁻¹(G(θ̂))` où `G(s) = P{θ̂* < s}` est la fonction de répartition
  bootstrap — calculée directement à partir de G ; preuve (4.2)–(4.3) :
  sous (3.5)–(3.7), `G(θ̂) = P{θ̂* < θ̂} = Φ(z₀)`.
- **Constante d'accélération (eq. 4.4–4.5, p. 175, VÉRIFIÉ)** :
  `a ≈ SKEW(i_θ̂)/6`, où `i_θ(θ̂) = ∂/∂θ log f_θ(θ̂)|_{θ=θ̂}` est la
  **fonction score** évaluée en θ̂, et `SKEW = μ₃/μ₂^{3/2}`. Invariante sous
  les transformations bijectives (p. 175). Interprétation (eq. 4.6, p. 176) :
  a est le **changement relatif de l'écart-type par unité d'écart-type de
  déplacement** sur l'échelle normalisée — « We call a the acceleration
  constant because of its effect of constantly changing the natural units of
  measurement as we move along the ϑ (or θ) axis. »
- **Intervalles BCa (eq. 3.8–3.9, 3.14, p. 173–174, VÉRIFIÉ)** : les
  bornes `θ̂[α]` de l'IC BCa se calculent par
  `θ̂[α] = G⁻¹(Φ(z[α]))` avec
  `z[α] = z₀ + (z₀ + z_α)·a / (1 − a(z₀ + z_α))` (l'OCR de (3.14) est partiel
  mais la structure `H⁻¹(Φ(z[α]))` est lisible à la ligne « Which shows that
  H^{-1}(Φ(z[α])) equals (3.14) [see definition (3.9)] »). « If `z₀` and a
  equal 0, then `z[α] = z_α` and (3.8) becomes `θ ∈ [G⁻¹(α), G⁻¹(1−α)]` …
  called the **percentile method** … In general `z₀` and a do not equal zero,
  and formulas (3.8), (3.9) **make adjustments to the percentile method that
  are necessary to achieve second-order correctness.** » (p. 174).
- **BC = BCa avec a = 0** (p. 174, VÉRIFIÉ) : « Suppose that we set a = 0 in
  (3.9) … Interval (3.8) with this definition … is called the **BC interval**,
  short for bias-corrected bootstrap interval, in Efron (1981, 1982a). In
  other words, BC = BCa, with a = 0. »
- **Multiparamètres (sec. 6, p. 176–177)** : `a` se calcule dans la
  **direction la moins favorable** (construction de Stein 1956) :
  `h̄ = −I⁻¹V` (eq. 6.3), famille à un paramètre `f_{θ̂+λh̄}` (eq. 6.4),
  `a = SKEW_{θ̄=0}[∂ log f_{θ̂+λh̄}/∂λ]/6` (eq. 6.5). Cas des familles
  exponentielles (Lemme 3, eq. 6.7–6.9). « A proof of general second-order
  correctness does not yet exist for multiparameter situations » (p. 172) —
  mais BCa produit des intervalles second ordre pour une classe
  d'exemples (Fieller, etc.).
- **Non paramétrique (sec. 7–8)** : extension naturelle à `θ = t(F)` ;
  justification heuristique par la géométrie de l'échantillonnage
  multinomial (sec. 8) ; « Except for the case of the expectation, not much
  is proved about nonparametric BCa intervals, though the empirical results
  look promising » (p. 172).
- **croisé (formule des bornes + estimateur jackknife de a)** : le brouillon
  du cours peut utiliser la forme standard des bornes
  `IC_BCa = [q*_{α₁}, q*_{α₂}]` avec
  `α₁ = Φ(z₀ + (z₀ + z_{α/2})·a/(1 − a(z₀ + z_{α/2})))`,
  `α₂ = Φ(z₀ + (z₀ + z_{1−α/2})·a/(1 − a(z₀ + z_{1−α/2})))`,
  `z₀ = Φ⁻¹(# {θ̂*_b < θ̂}/B)` et `a` estimé par la **skewness jackknife**
  `a̅ = Σ(θ̄_(·) − θ̂_{(−i)})³ / (6 [Σ(θ̄_(·) − θ̂_{(−i)})²]^{3/2})` —
  forme croisée via un manuel statistique en ligne (sungchullee.github.io,
  « Bias-Corrected and Accelerated Bootstrap », qui cite Efron 1987 et donne
  exactement ces formules, l'algorithme, le coût n réévaluations jackknife,
  l'invariance par transformation (approximative avec a̅ jackknife), et
  couverture `1−α + O(n^{−1})` contre `1−α + O(n^{−1/2})` pour le
  percentile). La formule de z[α] est VÉRIFIÉE dans Efron 1987 (3.8)–(3.14) ;
  l'estimateur jackknife de a est la version pratique standard (E&T 1993).

**UNVERIFIÉ** (décision du research du panneau, maintenue) : le taux précis
« le percentile a une erreur de couverture `O(√(log n)/n)` » — non relu dans
le texte primaire. La leçon reste qualitative : percentile = premier ordre ;
studentized/BCa = second ordre.

## RQ4 — Wild bootstrap (hétéroscédasticité)

**VÉRIFIÉ (résumé) — Wu (1986)**, « Jackknife, Bootstrap and Other
Resampling Methods in Regression Analysis », Ann. Statist. 14(4), 1261–1295,
DOI 10.1214/aos/1176350142 (reutilisé du research du panneau) : « Two [of
three bootstrap methods] are shown to give **biased variance estimators** and
one does not have the bias-robustness property … **A general method for
resampling residuals is proposed. It gives variance estimators that are
bias-robust.** »

**VÉRIFIÉ (bibliographie) — Mammen (1993)**, « Bootstrap and Wild Bootstrap
for High Dimensional Linear Models », Ann. Statist. 21(1), 255–285,
DOI 10.1214/aos/1176349025 (reutilisé du research du panneau).

**croisé — mécanisme + poids de Mammen** (reutilisé du research du panneau,
source secondaire citant Wu 1986 / Mammen 1993) :
`Y_i* = ŷ_i + ε̂_i·v_i` où `v_i` i.i.d. centré de variance 1, régresseurs
fixes. Deux choix standards :
- **Rademacher** : `v_i = ±1` avec probabilité 1/2 ;
- **Mammen (1993)** : `v_i = −(√5−1)/2 ≈ −0,618` avec probabilité
  `(5+√5)/10 ≈ 0,7236`, et `v_i = +(√5+1)/2 ≈ +1,618` avec probabilité
  `(5−√5)/10 ≈ 0,2764`.
  **VÉRIFIÉ par calcul direct cette session** : `E[v] = 0`,
  `E[v²] = 1`, `E[v³] = 1` (les trois premiers moments de la distribution de
  Mammen, calculés explicitement : `0,7236×(−0,618) + 0,2764×1,618 = 0` ;
  `0,7236×0,382 + 0,2764×2,618 = 1` ; `0,7236×(−0,236) + 0,2764×4,236 = 1`).
  Le « matche le troisième moment » du brouillon du panneau se lit donc :
  `E[v³] = 1` (le Rademacher a `E[v³] = 0` ; Mammen a choisi un support à
  deux points qui ajuste aussi le troisième moment — ce qui améliore
  l'approximation de second ordre ; l'explication complète reste dans
  Mammen 1993, non relue en intégral).
- Préservation de la variance locale : `Var(ε̂_i v_i | X) = ε̂_i² Var(v_i) =
  ε̂_i²` — contrairement au resamplage i.i.d. des résidus (qui impose
  `Var(ε_i) = σ²` identique pour tout i), le wild bootstrap conserve la
  structure hétéroscédastique `σ_i² ≈ ε̂_i²`. (Argument direct, pas de
  source à citer au-delà de Wu 1986 / Mammen 1993.)

## RQ5 — Double bootstrap (iterated bootstrap) : correction du biais de couverture

**VÉRIFIÉ — DiCiccio, Martin & Young (1992)**, « Fast and accurate approximate
double bootstrap confidence intervals », **Biometrika 79(2), 285–295**,
DOI 10.2307/2336840 (PDF relu en intégral cette session) :

- Attribution (p. 285, citation) : « **The iterated bootstrap (Beran, 1987)
  is a widely applicable tool for correcting error in bootstrap procedures.**
  This technique involves nested levels of resampling, the innermost level
  directed at estimating error in a particular characteristic of a statistical
  procedure. For instance, in the problem of constructing bootstrap confidence
  intervals, the inner level of resampling can be used to estimate coverage
  error, and the original interval may then be calibrated to obtain more
  accurate coverage. »
- **Algorithme (sec. 2, eq. 1–2, pp. 286–287, VÉRIFIÉ)** : soit
  `I₀(α; X, X*)` un IC bootstrap non corrigé de niveau nominal α (p. ex.
  percentile). Sa couverture réelle `π(α) = P{θ ∈ I₀(α; X, X*)}` diffère de
  α. L'intervalle `I₀(ᾱ; X, X*)` avec `π(ᾱ) = α` a couverture exactement α.
  L'estimateur bootstrap de π(α) (eq. 1) :
  `π̂(α) = P*{θ̂ ∈ I₀(α; X*, X**) | X}` — proportion, sur B resamplages
  externes `X*`, de ceux pour lesquels θ̂ tombe dans l'IC calculé sur `X*`
  avec les resamplages internes `X**` (eq. 2). On résout `π̂(ᾱ) = α` et
  l'**intervalle double bootstrap** est `I₁(α) = I₀(ᾱ; X, X*)`.
- **Coût (p. 285–287, VÉRIFIÉ)** : `B × Bᵢ` opérations de resamplage pour un
  seul intervalle (B externe, Bᵢ interne), « both B and Bᵢ must be large » ;
  « the construction of a single, highly accurate confidence interval might
  take hours or even days ». C'est ce que le paper corrige par
  approximations saddlepoint (hors périmètre de la leçon — mentionner le
  coût, pas la méthode).
- **Références détaillées citées (p. 285, VÉRIFIÉ)** : Hall & Martin (1988),
  Beran (1988), Hinkley & Shi (1989), Martin (1990, 1991) ; Davison & Hinkley
  (1988) (saddlepoint dans le bootstrap) ; Daniels & Young (1991).
- Résumé (VÉRIFIÉ) : « Our methods … yield confidence intervals with high
  coverage accuracy in small- to moderately-sized samples » ; application au
  ratio de moyennes et au coefficient de corrélation (où les méthodes
  standard « behave poorly »).

**VÉRIFIÉ (bibliographie, Crossref) — les références primaires de l'iterated
bootstrap** :

- Beran, R. (1987). « Prepivoting to Reduce Level Error of Confidence
  Sets ». Biometrika 74(3), 457–468. DOI 10.1093/biomet/74.3.457.
- Hall, P., Martin, R. (1988). « On bootstrap resampling and iteration ».
  Biometrika 75(4), 661–671. DOI 10.1093/biomet/75.4.661.
- Hall, P. (1988). « Theoretical Comparison of Bootstrap Confidence
  Intervals ». Ann. Statist. 16(1). DOI 10.1214/aos/1176350933 (comparaison
  théorique basic/percentile/studentized/BCa ; DiCiccio & Romano 1988 en
  discutent : DOI 10.1214/aos/1176350938).
- Martin, M. A. (1992). « On the Double Bootstrap ». In: *Computing Science
  and Statistics* (24th Symposium on the Interface), Springer, 73–78.
  DOI 10.1007/978-1-4612-2856-1_9. Le chapitre liste les auteurs de
  l'iterated bootstrap : « Efron (1983), Hall (1986), Beran (1987, 1988),
  Hall and Martin (1988), DiCiccio and Romano (1988), Hinkley and Shi (1989),
  and Martin (1990). Loh's (1987) method of bootstrap calibration includes
  bootstrap iteration as a special case. » (citation lue dans le PDF
  Springer cette session).
- DiCiccio, T. J., Romano, J. P. (1988). « A Review of Bootstrap Confidence
  Intervals ». J. Royal Statist. Soc. A 50, 338–354.
  DOI 10.1111/j.2517-6161.1988.tb01732.x (revue synthétique — source
  « croisée » de choix pour la hiérarchie de précision des IC).

**croisé — gain d'ordre** : l'IC double bootstrap (calibré) a une erreur de
couverture de l'ordre de `O(n^{−3/2})` — un ordre de mieux que le studentized
/ BCa (`O(n^{−1})`) — résultat standard de la littérature de l'iterated
bootstrap (Beran 1987 ; DiCiccio & Romano 1988 ; cf. la revue DiCiccio &
Romano 1988 JRSS-A). Le framework DMY92 (relu) est cohérent (« high coverage
accuracy »), mais l'exposant exact n'a pas été re-vérifié ligne à ligne cette
session : la leçon l'énonce comme « un ordre de mieux » avec attribution,
sans sur-vendre la précision.

**VÉRIFIÉ — le double bootstrap ne répare PAS l'inconsistance (voir RQ6)** :
pour le maximum, l'échec est structurel (aucun resamplage interne ne peut
dépasser le maximum externe) — corollaire immédiat du contre-exemple 2 de
B&F §6 (relu cette session). Formulation générale : Hall, Härdle & Simar
(1993), « On the inconsistency of bootstrap distribution estimators »,
*Computational Statistics & Data Analysis* 16(1), 11–18,
DOI 10.1016/0167-9473(93)90241-K (page ScienceDirect lue cette session) :
« bootstrap distribution estimators of a ranked parameter value are
consistent **if and only if** there are no ties for the rank in question.
When inconsistency occurs, the bootstrap distribution estimator does not even
converge in probability. »

## RQ6 — Limites : contre-exemples (maximum, U-statistique), médiane, variance infinie

**VÉRIFIÉ — Bickel & Freedman (1981), §6 « Counter-examples » (pp. 1209–1211),
relu en intégral cette session** :

- **Principe d'échec (pp. 1209, (6.1a)–(6.1c))** : le bootstrap fonctionne
  si (a) `R_n{(Y_1,…,Y_n); G}` converge faiblement vers `g(G)` pour tout G
  d'un voisinage de F ; (b) la convergence est **uniforme** sur le voisinage ;
  (c) `G ↦ g(G)` est continue. « In the examples of this section, the
  bootstrap fails **because uniformity does not hold on any usable
  neighborhoods**. »
- **Contre-exemple 2 : la maximum et les spacings (p. 1210, VÉRIFIÉ)** :
  F uniforme sur `(0, θ)` ; le pivot usuel `n(θ − X_{(n)})/θ` a une limite
  exponentielle standard. Le substitut bootstrap naturel
  `n(X*_{(n)} − X_{(n)})/X_{(n)}` « does not work » :
  `P{n(X*_{(n)} − X_{(n)}) = 0 | F̂_n} → 1 − e^{−1} ≈ 0,63` ; plus
  généralement `P{X*_{(k)} < X_{(n−n+k)} | F̂_n} → e^{−k}` ; et, avec
  probabilité 1, la loi conditionnelle de
  `n(X_{(n)} − X*_{(n−k+1)})/X_{(n)}` **n'a pas de limite faible**
  (`limsup = ∞`, `liminf = 0` p.s. pour chaque k). « This unpleasant
  behavior cannot be mended by simple smoothing, e.g., replacing F̂_n by [la
  densité à pas constant]. Nor does this behavior have much to do with the
  maximum. The conditional distributions of the spacings … do not have weak
  limits, even though `n(X_{(k)} − X_{(k−1)})` has an exponential limit. »
  « The problem is the **lack of uniformity** in the convergence of F̂_n to
  F. **Uniformity does hold for the parametric bootstrap**, where F is
  estimated by `F_{θ̂}`, which is uniform on the interval `(0, X_{(n)})`. »
- **Contre-exemple 1 : une U-statistique (p. 1209–1210, VÉRIFIÉ)** : sans la
  condition de von Mises `(6.5) ∫ w²(x,x) dF(x) < ∞` (noyau **singulier sur
  la diagonale**), le bootstrap peut échouer :
  `|R_{n2}(X_1*,…,X_n*; F̂_n)|` peut tendre vers ∞ en probabilité (exemple
  F uniforme sur `(0,1)`, `w(x,y) = w₁(x,y)I(x≠y) + w₂(x,y)I(x=y)`,
  `w(x,x) = e^{1/(x−y)}`-type ; la partie diagonale domine : la loi
  conditionnelle de `n^{1/2}(n−1)/ν_n × R_{n2}*` converge **en probabilité**
  vers la loi de `√ν(ν−1) − 1` où `ν ~ Poisson(1)` (eq. 6.8)). La
  U-statistique « hors diagonale » `R_{n1}*` elle, se bootstrappe
  correctement (Th. 3.1) — l'échec vient de la masse sur la diagonale
  (`ν_n` = nombre de collisions dans le resamplage, `→ Poisson(1)`).
- **⚠ Correction du prérequis du brief (reconfirmée)** : le brief proposait
  « la médiane » comme exemple de fonctionnel non lisse pour lequel le
  bootstrap peut échouer. Les sources primaires vérifiées disent le
  contraire : la médiane est un cas de **succès** (Prop. 5.1, voir
  research du panneau) ; les contre-exemples vérifiés sont **la maximum**
  (CE2) et **la U-statistique à noyau singulier** (CE1). La leçon présente
  la maximum comme contre-exemple principal, la U-statistique en renfort, et
  la médiane comme cas de succès avec sa condition.

**VÉRIFIÉ — la médiane EST un cas de succès (reutilisé du research du
panneau, Prop. 5.1 de B&F 1981, §5)** : si F a une médiane unique μ et une
densité f avec `f(μ) > 0` (forme la plus faible), alors, conditionnellement
aux données, `√n(m* − m) ⇒ N(0, 1/(4f(μ)²))` — la même limite que
`√n(m − μ)` (Th. 5.1 du même § : processus de quantiles
`√n(F̂_n^{−1} − F^{−1}) ⇒ B/(f∘F^{−1})`). C'est le **jackknife**, pas le
bootstrap, qui échoue pour la médiane (Efron 1979, §3).

**croisé / UNVERIFIÉ — médiane avec `f(μ) = 0`** : si la densité s'annule en
la médiane, le taux `√n` ne tient plus (la médiane échantillonnale converge
alors au taux `n^{1/3}`, limite du type argmax d'un processus gaussien moins
une parabole — théorie classique des M-estimateurs à maximum plat). La
théorie du bootstrap à ce taux existe : **VÉRIFIÉ (existence et sujet) —
Léger, C., Macgibbon, B. (2006). « On the bootstrap in cube root
asymptotics ». Canadian Journal of Statistics 34(1), 29–44.**
DOI 10.1002/cjs.5550340104 (métadonnées Crossref ; abstract non lu — les
détails : consistance à l'échelle `n^{1/3}`, invalidité de la
studentisation usuelle — sont **UNVERIFIÉS** cette session). **Décision pour
la leçon** : une seule phrase prudente, explicitement marquée comme point
d'entrée d'une théorie au-delà du cours, sans énoncer de taux ni de résultat
non vérifié.

**VÉRIFIÉ — variance infinie (cette session)** : Athreya, K. B. (1987).
« Bootstrap of the Mean in the Infinite Variance Case ». *The Annals of
Statistics* 15(2), 724–731, DOI 10.1214/aos/1176350371 (abstract JSTOR /
Project Euclid lu) : « Let X₁, X₂, … be independent identically distributed
random variables with EX² = ∞ but X₁ belonging to the domain of attraction of
a stable law. It is known that the sample mean X̄_n appropriately normalized
converges to a stable law. **It is shown here that the bootstrap version of
the normalized mean has a random distribution (given the sample) whose limit
is also a random distribution** … implying that the naive bootstrap could
fail in the heavy tailed case. » — i.e. la condition de variance finie du
Th. 2.1 (B&F) est **essentielle** : sans elle, le bootstrap de la moyenne
est inconstant (la limite bootstrap est aléatoire, pas la loi stable
théorique). Corollaire : le pivot bootstrap `√n(X̄* − X̄)/s*` ne converge
pas vers N(0,1).

## RQ7 — Pont vers le bagging (Partie V)

**VÉRIFIÉ (source du cours)** — `course_sources/typst/regularization.typ`,
ch. 4 : Définition 4.5 — échantillon bootstrap : n tirages avec remise ;
`(1−1/e) ≈ 63,2 %` des points originaux présents, `1/e ≈ 36,8 %` absents ;
Algorithme 4.1 (bagging : M échantillons bootstrap → M modèles →
moyenne/vote) ; Théorème 4.2 (variance `σ²/M` si décorrélés) ; Définition 4.6
(erreur OOB). Enseigné sur le site : Partie V, leçon 1.

**VÉRIFIÉ (coïncidence de constantes)** — Bickel & Freedman (1981), §6
(relu cette session) : `P{n(X*_{(n)} − X_{(n)}) = 0 | F̂_n} → 1 − 1/e ≈
0,63` : la même constante `(1−1/e)` qui gouverne le bagging (point présent
au moins une fois dans l'échantillon bootstrap) est celle qui fait que le
maximum bootstrap coïncide avec l'observation maximale avec probabilité ≈ 63
%.

**croisé — identité bagging = bootstrap** (Efron & Tibshirani 1993, ch. 8
« Bagging » — livre cité dans le research du panneau, non relu) : même
mécanisme de resamplage ; le bagging moyenne les **prédictions** de B modèles
pour réduire la variance, le bootstrap étudie la **distribution** d'une
statistique réestimée pour l'inférence. La leçon l'énonce ainsi, avec
renvoi à la Partie V, leçon 1.

## Références complètes (pour la Bibliographie de la page)

1. Efron, B. (1979). Bootstrap Methods: Another Look at the Jackknife.
   *The Annals of Statistics* 7(1), 1–26.
   https://doi.org/10.1214/aos/1176344139
2. Efron, B. (1982). *The Jackknife, the Bootstrap and Other Resampling
   Plans*. CBMS-NSF Regional Conference Series in Applied Mathematics,
   vol. 38. SIAM, Philadelphia.
   https://doi.org/10.1137/1.9781611970319
3. Efron, B. (1987). Better Bootstrap Confidence Intervals. *Journal of the
   American Statistical Association* 82(397), 171–185.
   https://doi.org/10.1080/01621459.1987.10478410
4. Bickel, P. J., Freedman, D. A. (1981). Some Asymptotic Theory for the
   Bootstrap. *The Annals of Statistics* 9(6), 1196–1217.
   https://doi.org/10.1214/aos/1176345637
5. Freedman, D. A. (1981). Bootstrapping Regression Models. *The Annals of
   Statistics* 9(6), 1218–1228.
   https://doi.org/10.1214/aos/1176345638
6. Singh, K. (1981). On the Asymptotic Accuracy of Efron's Bootstrap.
   *The Annals of Statistics* 9(6), 1187–1195.
7. Wu, C. F. J. (1986). Jackknife, Bootstrap and Other Resampling Methods in
   Regression Analysis. *The Annals of Statistics* 14(4), 1261–1295.
   https://doi.org/10.1214/aos/1176350142
8. Mammen, E. (1993). Bootstrap and Wild Bootstrap for High Dimensional
   Linear Models. *The Annals of Statistics* 21(1), 255–285.
   https://doi.org/10.1214/aos/1176349025
9. Athreya, K. B. (1987). Bootstrap of the Mean in the Infinite Variance
   Case. *The Annals of Statistics* 15(2), 724–731.
   https://doi.org/10.1214/aos/1176350371
10. Beran, R. (1987). Prepivoting to Reduce Level Error of Confidence Sets.
    *Biometrika* 74(3), 457–468. https://doi.org/10.1093/biomet/74.3.457
11. Hall, P., Martin, R. (1988). On bootstrap resampling and iteration.
    *Biometrika* 75(4), 661–671. https://doi.org/10.1093/biomet/75.4.661
12. Hall, P. (1988). Theoretical Comparison of Bootstrap Confidence
    Intervals. *The Annals of Statistics* 16(1).
    https://doi.org/10.1214/aos/1176350933
13. DiCiccio, T. J., Romano, J. P. (1988). A Review of Bootstrap Confidence
    Intervals. *Journal of the Royal Statistical Society A* 50, 338–354.
    https://doi.org/10.1111/j.2517-6161.1988.tb01732.x
14. DiCiccio, T. J., Martin, M. A., Young, G. A. (1992). Fast and Accurate
    Approximate Double Bootstrap Confidence Intervals. *Biometrika* 79(2),
    285–295. https://doi.org/10.2307/2336840
15. Martin, M. A. (1992). On the Double Bootstrap. In: *Computing Science
    and Statistics* (24th Symposium on the Interface). Springer, 73–78.
    https://doi.org/10.1007/978-1-4612-2856-1_9
16. Hall, P., Härdle, W., Simar, L. (1993). On the Inconsistency of
    Bootstrap Distribution Estimators. *Computational Statistics & Data
    Analysis* 16(1), 11–18.
    https://doi.org/10.1016/0167-9473(93)90241-K
17. Léger, C., Macgibbon, B. (2006). On the Bootstrap in Cube Root
    Asymptotics. *Canadian Journal of Statistics* 34(1), 29–44.
    https://doi.org/10.1002/cjs.5550340104
18. Efron, B., Tibshirani, R. J. (1993). *An Introduction to the
    Bootstrap*. Monographs on Statistics and Applied Probability, vol. 57.
    Chapman & Hall, Boca Raton. (croisé : eq. 12.22 p. 160, 13.5 p. 171 ;
    ch. 8 bagging)
19. Davison, A. C., Hinkley, D. V. (1997). *Bootstrap Methods and Their
    Application*. Cambridge University Press. (croisé : eq. 5.6/5.7 p. 194,
    5.18 p. 203)
20. DiCiccio, T. J., Efron, B. (1996). Bootstrap Confidence Intervals.
    *Statistical Science* 11(3), 189–212.
    https://doi.org/10.1214/ss/1032280214 (revue moderne — hiérarchie
    premier/second ordre)
