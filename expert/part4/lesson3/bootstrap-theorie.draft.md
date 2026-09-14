# Brouillon — `p4-l3-bootstrap-theorie`

Contenu du panneau `ExpertPanel` à greffer sur
`src/routes/part4/lesson3/+page.svelte`, **après** l'InteractiveSection 3.4
(démo `LmSamplingDist`), avant `<h2 id="student">` (ancrage du brief :
« lois d'échantillonnage »).

Convention de numérotation (précédent du panneau KKT, part1/lesson1 :
`1.5.1.bis`–`1.5.7.bis` après le bloc 1.5.1) : le bloc précédent ici est
l'InteractiveSection `3.4`, donc le panneau utilise `3.4.1.bis`–`3.4.5.bis`.

Chaque bloc est marqué « au-delà du cours » (stagiaire du brouillon — dans
l'intégration finale, ces marqueurs seront retirés de la copie visible,
conformément à AGENTS.md ; le badge « Expert » du panneau porte la
distinction, et les citations d'auteurs restent dans le texte).

Formules : toutes en `String.raw`-safety (pas de backtick ni de `${` à
l'intérieur), valides KaTeX.

---

## Intro (avant le premier bloc)

```
<p>
  Le Théorème 3.3 de cette leçon donne des <strong>lois exactes</strong> —
   gaussienne, khi-deux, Student — mais <strong>uniquement sous (H3)</strong>,
   l'hypothèse d'erreurs gaussiennes. Sans (H3), la distribution
   d'échantillonnage de β̂ est inconnue, et l'intervalle de confiance
   β̂ ± t·SE n'a plus de justification exacte (il ne reste que
   l'approximation asymptotique du CLT). Il existe une alternative
  entièrement non paramétrique : au lieu de supposer une loi pour les
  erreurs, on suppose que <strong>les données observées sont
  représentatives de la population</strong>, et on « ré-échantillonne »
  dessus. C'est le <strong>bootstrap</strong> (Efron, 1979).
</p>
```

## DefinitionBlock 3.4.1.bis — « Bootstrap non paramétrique : resamplage et réestimation »

« au-delà du cours » (Efron 1979, Ann. Statist. 7(1): 1–26, §2 et §7)

```
<p>
  Soit S_n = {(X_1, Y_1), …, (X_n, Y_n)} l'échantillon observé de la
  leçon, et F_n^∧ la <strong>loi empirique</strong> : la distribution qui
  met une masse 1/n en chaque point (X_i, Y_i). L'algorithme du
  bootstrap non paramétrique est :
</p>
<ol>
  <li>
    <strong>Resamplage.</strong> Tirer un échantillon bootstrap
    S_n^* = {(X_1^*, Y_1^*), …, (X_n^*, Y_n^*)} de taille n dans
    F_n^∧, <strong>avec remise</strong> — chaque observation
    (X_i, Y_i) est tirée avec probabilité 1/n, indépendamment des
    autres ;
  </li>
  <li>
    <strong>Réestimation.</strong> Ajuster le même modèle (moindres
    carrés) sur S_n^* :
    β̂^* = (X^{*ᵀ}X^*)^{−1} X^{*ᵀ} Y^* ;
  </li>
  <li>
    <strong>Itération Monte Carlo.</strong> Répéter B fois (B ≈ 100–1000)
    avec des tirages indépendants, et prendre pour
    <strong>loi bootstrap</strong> de β̂^* l'histogramme des B valeurs
    β̂^{*1}, …, β̂^{*B}.
  </li>
</ol>
<p>
  La loi d'échantillonnage de β̂ (centrée, c'est-à-dire β̂^* − β̂ à la
  place de β̂ − β) est approchée par la loi bootstrap de β̂^* − β̂,
  conditionnelle aux données. Le raisonnement de cohérence (Efron, 1979,
  « Fisher consistency ») : si la vraie loi F coïncidait avec F_n^∧,
  alors la loi de β̂^* serait <strong>exactement</strong> la loi de
  β̂ ; le bootstrap rend l'approximation exacte au point central de la
  classe des lois plausibles.
</p>
<p>
  Pour la régression, on peut aussi <strong>resamplage des résidus</strong>
  (Efron, 1979, §7) : on garde les X_i fixes et on rejoue
  Y_i^* = X_i β̂ + ε̂_{j(i)} avec ε̂_{j(i)} tiré au hasard parmi les
  résidus ε̂_1, …, ε̂_n. Cette variante utilise l'information que les
  régresseurs sont fixés, mais suppose une loi d'erreur identique pour
  tout i (homoscédasticité) ; elle est remplacée par le wild bootstrap
  (3.4.4.bis) quand cette hypothèse échoue.
</p>
```

## TheoremBlock 3.4.2.bis — « Consistance du bootstrap (Efron, 1982 ; Bickel & Freedman, 1981) »

« au-delà du cours » (Bickel & Freedman 1981, Ann. Statist. 9(6): 1196–1217,
Th. 2.1, 2.2, §6 ; Freedman 1981, Ann. Statist. 9(6): 1218–1228)

```
<p>
  Le bootstrap n'est pas une recette magique : il converge vers la bonne
  loi sous des conditions précises. Pour la moyenne (cas modèle), le
  résultat s'énonce ainsi.
</p>
<p>
  <strong>Théorème (moyenne, Bickel & Freedman, 1981, Th. 2.1).</strong>
  Soit X_1, X_2, … i.i.d. de variance σ² finie et positive. Le long de
  presque toutes les suites d'échantillons, conditionnellement à
  (X_1, …, X_n), quand n → ∞ :
</p>
<KatexBlock formula={consistencyMean} />
<p>
  où X̄_n^*, s_n^* sont la moyenne et l'écart-type de l'échantillon
  bootstrap. Les deux erreurs du bootstrap — remplacer β par β̂ (erreur
  d'ordre 1/√n, <strong>du bon ordre de grandeur</strong>) et remplacer
  F par F_n^∧ — se <strong>compensent</strong> ; c'est ce que la preuve
  établit formellement. La même preuve, vectorisée (Th. 2.2), couvre
  les vecteurs (X_i, Y_i), et Freedman (1981) l'applique au cas qui
  nous intéresse :
</p>
<KatexBlock formula={consistencyOls} />
<p>
  Sous des conditions légères (nombre de paramètres p fixé, moments des
  erreurs contrôlés), la loi bootstrap de β̂^* − β̂ converge vers la
  loi d'échantillonnage vraie de β̂ − β, avec bornes d'erreur
  explicites (Freedman, 1981).
</p>
<p>
  <strong>Principe général (Bickel & Freedman, 1981, §6).</strong> Le
  bootstrap fonctionne pour une statistique T_n si, en notant g(F) la
  limite de sa loi d'échantillonnage : (i) T_n converge faiblement vers
  g(G) pour toute loi G d'un voisinage de F ; (ii) cette convergence est
  <strong>uniforme</strong> sur le voisinage ; (iii) G ↦ g(G) est
  continue. L'échec vient toujours d'un défaut d'uniformité (3.4.5.bis).
</p>
```

## DefinitionBlock 3.4.3.bis — « Intervalles bootstrap : percentile contre studentized »

« au-delà du cours » (Efron & Tibshirani 1993, eq. 12.22 p. 160, eq. 13.5
p. 171 ; Efron 1987, JASA 82(397): 171–185 ; Davison & Hinkley 1997,
eq. 5.6/5.7/5.18)

```
<p>
  Deux façons standard de transformer l'histogramme des β̂^* en intervalle
  de confiance de β (Efron & Tibshirani, 1993) :
</p>
<ul>
  <li>
    <strong>Percentile.</strong> Prendre directement les quantiles de la
    loi bootstrap :
    <KatexBlock formula={icPercentile} />
    Simple, mais : si la loi bootstrap est asymétrique ou décentrée par
    rapport à β̂, l'intervalle est souvent inapproprié — pour la variance
    échantillonnale, n = 20, niveau nominal 90 %, la couverture réelle
    tombe à 78 % (Efron & Tibshirani, 1993) ; il n'est qu'exact au
    premier ordre (erreur de couverture de l'ordre de n^{−1/2}).
  </li>
  <li>
    <strong>Studentized (bootstrap-t).</strong> Remplacer σ par σ̂ dans
    chaque réplique : t^* = (β̂^* − β̂)/SE(β̂^*), et
    <KatexBlock formula={icStudentized} />
    La statistique bootstrappée est <strong>pivotal</strong> (sa limite
    ne dépend d'aucun paramètre inconnu) ; l'intervalle est exact au
    second ordre (erreur de couverture de l'ordre de n^{−1}, comme le
    BCa d'Efron, 1987) : il corrige l'asymétrie et la non-stationnarité
    locale de l'écart-type que le percentile ignore.
  </li>
</ul>
<p>
  En pratique : le percentile suffit quand la loi bootstrap de β̂^* est
  proche de symétrique (grand n, erreurs symétriques) ; le studentized
  coûte B fois plus cher (un réajustement complet par réplique pour
  calculer SE(β̂^*)) et est préféré quand l'asymétrie est visible.
</p>
```

## DefinitionBlock 3.4.4.bis — « Wild bootstrap : hétéroscédasticité »

« au-delà du cours » (Wu 1986, Ann. Statist. 14(4): 1261–1295 ;
Mammen 1993, Ann. Statist. 21(1): 255–285)

```
<p>
  Si Var(ε_i) = σ_i² dépend de i (hétéroscédasticité — le « éventail »
  de la leçon 4), le resamplage naïf des résidus est inadapté : Wu (1986)
  montre que les deux variantes classiques (case resampling,
  resamplage i.i.d. des résidus) donnent des <strong>estimateurs de
  variance biaisés</strong>. Le <strong>wild bootstrap</strong> corrige
  cela en pondérant chaque résidu par un poids aléatoire :
</p>
<KatexBlock formula={wildFormula} />
<p>
  où v_i est un poids centré de variance 1, indépendant (Rademacher :
  v_i = ±1 avec probabilité 1/2 ; ou la distribution à deux points de
  Mammen, 1993 : v_i = −0,618 avec probabilité 0,724 et v_i = +1,618
  avec probabilité 0,276, qui matche aussi le troisième moment). Les
  régresseurs restent fixes ; contrairement au resamplage i.i.d. des
  résidus, la variance locale σ_i² est préservée car
  Var(ε̂_i v_i) = ε̂_i². Le wild bootstrap donne des estimateurs de
  variance « bias-robust » sous hétéroscédasticité (Wu, 1986).
</p>
```

## ExampleBlock 3.4.5.bis — « Quand le bootstrap échoue : la maximum (et pourquoi la médiane, elle, passe) »

« au-delà du cours » (Bickel & Freedman 1981, §5 Prop. 5.1 et §6
contre-exemple 2 ; Efron 1979, §3)

```
<p>
  Le principe de 3.4.2.bis a un coût : l'uniformité. Le contre-exemple
  classique (Bickel & Freedman, 1981, §6) est l'estimation du bord
  supérieur θ du support de F uniforme sur (0, θ). La statistique usuelle
  est X_{(n)} ; son pivot n(θ − X_{(n)})/θ a une limite exponentielle
  standard. Le substitut bootstrap naturel — resamplage dans F_n^∧ et
  étude de n(X^*_{(n)} − X_{(n)})/X_{(n)} — <strong>ne fonctionne pas</strong> :
</p>
<KatexBlock formula={maxFailure} />
<p>
  avec P{… = 0 | F_n^∧} → 1 − 1/e ≈ 0,63 : la maximum bootstrappée
  coïncide avec la maximum observée 63 % du temps (on ne peut pas tirer
  au-delà du maximum des données !), et plus généralement la loi
  conditionnelle de n(X_{(n)} − X^*_{(n−k+1)})/X_{(n)} <strong>n'a pas de
  limite faible</strong> (limsup = ∞, liminf = 0). Le bootstrap
  paramétrique (tirer dans l'uniforme (0, X_{(n)}) au lieu de
  F_n^∧) fonctionne à la place. Moral : le bootstrap non paramétrique
  ne voit pas au-delà des données observées.
</p>
<p>
  En sens inverse, la <strong>médiane</strong> — souvent présentée à
  tort comme un cas d'échec — est un cas de <strong>succès</strong> :
  si F a une médiane unique μ et une densité f avec f(μ) > 0, alors
  √n(m^* − m) ⇒ N(0, 1/(4f(μ)²)), la même limite que
  √n(m − μ) (Bickel & Freedman, 1981, Prop. 5.1). C'est le
  <strong>jackknife</strong>, pas le bootstrap, qui échoue pour la
  médiane (Efron, 1979, §3).
</p>
```

## Callout type="intuition" — « Pont vers le bagging (Partie V) »

```
<p>
  Le mécanisme de resamplage de 3.4.1.bis est exactement celui du
  <strong>bagging</strong> (Partie V, leçon 1) : y compris la constante
  (1 − 1/e) ≈ 63,2 % d'observations présentes au moins une fois dans
  l'échantillon bootstrap (et 36,8 % absentes — l'origine de l'erreur
  out-of-bag). La différence d'usage : le bagging <strong>moyenne des
  prédictions</strong> de B modèles bootstrappés pour réduire la
  variance ; le bootstrap <strong>étudie la distribution</strong> d'une
  statistique réestimée pour l'inférence. La même constante refait même
  surface dans le contre-exemple de 3.4.5.bis : la maximum bootstrappée
  égale la maximum observée avec probabilité tendant vers
  1 − 1/e.
</p>
```

## Formules (variables du script, prêtes pour `String.raw`)

```ts
const consistencyMean = String.raw`
  \sqrt{n}\,\bigl(\bar{X}^*_n - \bar{X}_n\bigr) \ \Rightarrow\ \mathcal{N}(0, \sigma^2), \qquad s^{*2}_n \xrightarrow{\;p\;} \sigma^2
`;
const consistencyOls = String.raw`
  \sup_x \Bigl| \mathbb{P}^*\!\bigl(\hat{\beta}^* - \hat{\beta} \le x\bigr) - \mathbb{P}\!\bigl(\hat{\beta} - \beta \le x\bigr) \Bigr| \xrightarrow{\;p\;} 0
`;
const icPercentile = String.raw`
  \mathrm{IC}_{1-\alpha}^{\,\mathrm{perc}}(\beta_j) = \bigl[\, q^*_{\alpha/2},\; q^*_{1-\alpha/2} \,\bigr]
`;
const icStudentized = String.raw`
  \mathrm{IC}_{1-\alpha}^{\,\mathrm{stud}}(\beta_j) = \bigl[\, \hat{\beta}_j - \widehat{se}_j \, t^*_{1-\alpha/2}, \quad \hat{\beta}_j - \widehat{se}_j \, t^*_{\alpha/2} \,\bigr], \qquad t^* = \frac{\hat{\beta}^* - \hat{\beta}}{SE(\hat{\beta}^*)}
`;
const wildFormula = String.raw`
  Y_i^* = X_i\hat{\beta} + \hat{\varepsilon}_i \, v_i, \qquad \mathbb{E}[v_i] = 0,\quad \mathbb{E}[v_i^2] = 1
`;
const maxFailure = String.raw`
  \mathbb{P}^*\!\bigl\{ X^*_{(n)} = X_{(n)} \mid \hat{F}_n \bigr\} \;=\; 1 - \bigl(1 - \tfrac{1}{n}\bigr)^{\!n} \;\xrightarrow{\;n\to\infty\;} 1 - \tfrac{1}{e} \approx 0{,}63
`;
```

## « au-delà du cours » — récapitulatif des limites de fidélité

- Tout le panneau est au-delà de `course_sources/` (le PDF du cours ne
  contient aucun bootstrap ; vérifié). Les seuls faits de cours utilisés
  : les lois exactes de la leçon (Th. 3.3) comme point de départ, et la
  Définition 4.5 de `regularization.typ` (63,2 %) pour le pont — celle-ci
  étant enseignée sur le site (Partie V, leçon 1).
- L'énoncé de 3.4.2.bis est au niveau des résumés de B&F 1981 / Freedman
  1981 ; les hypothèses techniques fines de Freedman (1981) ne sont pas
  reformulées (UNVERIFIED dans research.md).
- Le taux d'erreur du percentile `O(√(log n)/n)` n'est PAS utilisé
  (UNVERIFIED) ; seule la hiérarchie premier ordre / second ordre
  (vérifiée via le résumé d'Efron 1987 et le cadre DiCiccio–Efron/Hall)
  est enseignée.
- Le cas médiane à densité nulle (`f(μ) = 0`, taux `n^{1/3}`) n'est PAS
  dans le brouillon (UNVERIFIED) ; la médiane n'apparaît que comme cas de
  succès (Prop. 5.1, vérifiée).

## Proposed demo

`src/lib/components/demos/LmBootstrapInference.svelte` (naming `Lm*` de la
leçon), via `DeferredDemo` dans le panneau (comme le panneau KKT).

**Idée** : l'envers non gaussien de la démo 3.4 (`LmSamplingDist`). Un
seul échantillon seedé `y = β0 + β1 x + ε` avec `ε` gaussien OU
asymétrique (log-normal centré) ; `x_i` i.i.d. U(0, 10) (design
aléatoire, pour que le resamplage des paires soit exact). On tire
B = 400 échantillons bootstrap, on réajuste la pente, et on compare :

1. Histogramme des B valeurs β̂^*_1 (BarChart) ;
2. Densité bootstrap de β̂^*_1 (normalisée) + courbe gaussienne
   N(β̂_1, SE²) superposée (DensityChart) : la gaussienne est ce que
   l'IC de Student suppose, la densité bootstrap est ce que l'on observe
   sans hypothèse ; marqueurs β̂_1 et β_1 (vrai, connu en simulation) ;
3. Segment de droite graduée (SVG minimal fait main, fallback commenté) :
   IC de Student (t_{n−2}) vs IC bootstrap percentile, avec β_1 ;
4. Metrics : β̂_1, SE bootstrap (vs SE analytique), et **couverture
   empirique sur R = 200 expériences** : % de fois où l'IC Student
   contient β_1 vs % pour l'IC percentile (cible 95 %).

**⚠ Ce que la démo NE dit PAS (vérifié par mesure, seed 97)** — la pente
est une **statistique linéaire** (β̂_1 = β_1 + Σ w_i ε_i) : par le CLT,
sa loi d'échantillonnage reste quasi gaussienne même avec des erreurs
asymétriques (le design x_i ∼ U(0,10) symétrique annule presque
l'asymétrie des ε_i — skew mesuré de la loi bootstrap ≈ 0,00–0,05).
Conséquence mesurée (n = 12, B = 300, R = 400) : couverture de l'IC
Student ≈ 0,94, de l'IC percentile ≈ 0,91 — les deux restent près du
nominal, et c'est l'IC Student qui est ici le mieux calé. La démo
présente donc les deux couvertures comme un **contrôle honnête**, pas
comme une victoire du percentile. Le message pédagogique correct :
pour une statistique linéaire, la théorie gaussienne de la leçon est
déjà robuste ; la valeur du bootstrap est (i) estimer SE et loi **sans
supposer (H3)**, (ii) généraliser à des statistiques non linéaires pour
lesquelles le contraste devient net (le maximum, 3.4.5.bis). La
caption de la démo le dit explicitement (note d'honnêteté sur le toy
model, cf. AGENTS.md).

**Fonctions du module mathématique** (`src/lib/math/bootstrap-inference.ts`,
nouveau — ne pas mélanger avec `bootstrap.ts` qui est le module bagging) :

- `resampleIndices(n, rng): number[]` — n indices avec remise dans
  `[0, n)` ;
- `olsBootstrapSlopes(X, y, B, rng): number[]` — B valeurs de β̂^*_1
  (réutilisation de `olsClosedForm` de `regression.ts`) ;
- `bootstrapStandardError(slopes): number` — écart-type des B valeurs ;
- `quantileOfSorted(values, p): number` — quantile (interpolation
  linéaire, type 7) ;
- `percentileInterval(slopes, alpha): [number, number]` —
  `[q*_{α/2}, q*_{1−α/2}]` ;
- `skewedRegressionSample(n, scenario, seed)` — échantillon seedé,
  `x ~ U(0,10)`, `y = 2 + 1.5 x + ε`, `ε` gaussien ou log-normal centré
  (scénarios 'gaussian' / 'asymmetric') ;
- `bootstrapCoverageStudy({n, B, R, alpha, scenario, seed})` — R
  expériences indépendantes : couverture empirique de l'IC Student vs de
  l'IC percentile pour β_1 ;
- PRNG : `mulberry32` + `combineSeed` importés de `util.ts` (pas de copie
  privée — dette existante de `bootstrap.ts`, pas un modèle à suivre).

**Comportement fini-échantillon mesuré (à documenter dans les tests et la
caption, pas à masquer)** :
- le bootstrap SE de la pente a un biais négatif d'ordre 1/n sous
  erreurs gaussiennes (ratio bootstrap/analytique ≈ 0,82 à n = 30, ≈ 0,95
  à n ≥ 60, → 1 en n → ∞, consistance Bickel & Freedman 1981 /
  Freedman 1981) ;
- avec erreurs log-normales, le SE analytique `σ̂/√sxx` est lui-même
  bruité (σ̂ sous-estime σ car le χ² suppose (H3)) ; le bootstrap SE reste
  calé sur la vraie SE `√(Var(ε)/sxx)` (ratio ≈ 0,99 à n = 300).

Tests (`bootstrap-inference.test.ts`) :
- déterminisme (même seed → mêmes résultats) ;
- `resampleIndices` : valeurs dans `[0,n)`, taille n, et sur un grand
  tirage chaque indice apparaît ≈ (nombre de tirages) fois (borne
  relative, loi binomiale) ;
- `olsBootstrapSlopes` : déterminisme, et sur une droite **sans bruit**
  (y = 2 + 1,5x exactement) chaque réajustement bootstrap redonne
  β̂^*_1 = 1,5 au bit près (cas analytique) et `bootstrapStandardError = 0` ;
- `bootstrapStandardError` : égal à l'écart-type calculé indépendamment
  (dénominateur B−1) ;
- `quantileOfSorted` : valeurs exactes sur `[1..5]`, interpolation entre
  statistiques d'ordre, et `q(p) + q(1−p)` = min + max sur un échantillon
  symétrique ;
- `percentileInterval` : bornes ordonnées, contient la médiane ; quartiles
  exacts sur une liste connue (cas analytique) ;
- cohérence gaussienne : avec erreurs gaussiennes et **grand n** (n ≥ 60)
  et grand B, `bootstrapStandardError` ≈ SE analytique
  `σ/√(Σ(x_i−x̄)²)` (tolérance relative ~10 %, le biais 1/n étant connu) ;
- cohérence sans (H3) : avec erreurs log-normales et grand n,
  `bootstrapStandardError` ≈ vraie SE `√(Var(ε)/sxx)` ;
- couverture : sous (H3) (n = 20, R = 400) les deux couvertures sont
  près de 1−α ; sans (H3) (n = 12, R = 400) on n'assert **pas**
  « percentile > Student » (faux pour la pente) — seulement que les deux
  restent dans une bande raisonnable autour de 1−α ;
- cas dégénérés / entrées invalides : `n < 3`, `B < 1`, `alpha ∉ (0,1)`,
  X vide → erreurs claires (pas de NaN silencieux).
