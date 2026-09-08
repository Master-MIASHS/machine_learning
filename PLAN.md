# Plan — Nouvelle partie « Régression linéaire » (Partie IV)

Plan d'intégration d'une partie entièrement consacrée à la régression linéaire,
insérée entre la partie III (Clustering) et l'ancienne partie IV (Régularisation).
Toutes les décisions ont été validées le 8/09/2026 (§2).

## 0. Positionnement éditorial

La partie est écrite du point de vue d'un **statisticien classique français**
(Lèbre, Trottier), à distance du vocabulaire machine learning :

- terminologie des sources : moindres carrés, Gauss–Markov, hypothèses (H1)–(H3),
  résidus standardisés/studentisés, leviers, distance de Cook, VIF, tableau
  d'ANOVA, Student, Fisher, parcimonie, sur-ajustement, *data mining / data snooping* ;
- référence permanente au logiciel R (`lm()`, `summary()`, `confint()`,
  `rstandard()`, `rstudent()`, `cooks.distance()`, `vif()`, `step()`,
  `regsubsets()`), comme dans les sources ;
- place dans le parcours : la partie est le pont entre les parties algorithmiques
  (I–III) et les parties théoriques (VI–X). Elle renvoie vers la régularisation
  (nouvelle partie V — les sources y renvoyent explicitement) et vers la
  régression optimale de Bayes `E[Y|X]` (nouvelle partie VII).

## 1. Sources de vérité (`course_sources/sophie/`)

| Fichier | Contenu | Résultats clés enseignés |
|---|---|---|
| `StatM1S1_2025.pdf` (40 p.) | Modèle linéaire multiple, estimation, inférence gaussienne, MCG | modèle `Y = Xβ + ε` (éq. 1–2), H1/H2, **Théorème 1** `β̂ = (XᵀX)⁻¹XᵀY` + preuve, Gauss–Markov, `σ̂² = SCR/(n−p−1)`, SCR/SCE/SCT, R², R² ajusté, **Théorème 2** (MV = MC), lois d'échantillonnage (`β̂ ~ N`, `(n−p−1)σ̂²/σ² ~ χ²(n−p−1)`, indépendance, `Tj ~ Student(n−p−1)`), IC et test de Student, test F global + tableau d'ANOVA, test F emboîté (`q = 1 ⇒ F = t²`), intervalle de prédiction, MCG `β̂MCG = (Xᵀℱ⁻¹X)⁻¹Xᵀℱ⁻¹Y` |
| `8.validation_du_modele_lineaire_2025.pdf` (97 p.) | Diagnostic du modèle linéaire | rang de X, corrélations 2 à 2, conditionnement `κ = λ1/λp` (règle > 500), corrélation partielle, `VIFj = 1/(1−R²j)` (règle > 10), `Var(β̂j) = σ²/(‖xj‖²(1−R²j))`, graphes de résidus (asymétrie, blocs, hétéroscédasticité, auto-corrélation), résidus partiels `ε̂∆j,i = β̂j·xj,i + ε̂i`, Q-Q plot, matrice chapeau H (symétrique, idempotente), leviers `hii` (`0 ≤ hii ≤ 1`, `Σhii = p+1`, seuil `2(p+1)/n`), résidus standardisés `ri`, studentisés `ti ~ Student(n−p−2)`, distance de Cook `Di = hii·ri²/((p+1)(1−hii))` (seuil > 1), `ε̂(−i)i = ε̂i/(1−hii)` |
| `9.choix_de_modele.pdf` (43 p.) | Choix de modèle et sélection de variables | 3 objectifs (descriptif/explicatif/prédictif), data snooping, compromis biais/variance, R² non comparable entre dimensions, `PRESS`, `Cp = ‖ε̂‖²/σ̂²plein − (n−2(p+1))` (`Cp = p+1` pour le modèle complet), `AIC = −2 log L + 2k`, `BIC = −2 log L + k log n`, best-subset (`2^p`, Leaps and Bound, `p > 30` interdit), forward/backward/both (gloutons), exemple prostate |
| `ModèleLinéaire_ANOVA_ANCOVA.pdf` (11 p.) | Modèle linéaire général : régression, ANOVA, ANCOVA | régresseur vs facteur, codages (sans intercept `β0 = 0`, niveau de référence `contr.treatment`, somme des paramètres `contr.sum`), ANOVA 2 facteurs avec/sans interaction, ANCOVA avec/sans interaction |

## 2. Décisions validées

1. **Renumérotation** : la nouvelle partie est la **Partie IV — Régression
   linéaire** (`/part4`) ; les parties IV–IX actuelles deviennent V–X.
   Dossiers, URL et libellés sont tous changés.
2. **5 leçons** : l'ANOVA/ANCOVA fait l'objet d'une **leçon 2 à part entière**.
3. **Jeux de données** : on intègre les vrais `swiss` et `prostate` s'ils sont
   faciles à trouver et vérifiables contre les valeurs du PDF ; sinon on les
   remplace par des analogues synthétiques signalés comme tels. `longley` est
   listé intégralement dans le PDF : il est embarqué tel quel.
4. **Quiz de synthèse** : oui, la partie IV a une page quiz.
5. **MCG** : section normale du cours (leçon 3), pas de page expert.
6. **TP** : R Markdown complet, rédigé dans ce plan de travail (phase D).

## 3. TODO 1 — Intégration : mises à jour

### 3.1 Principe

La sidebar est 100 % pilotée par `PAGES`/`PART_NAMES` (`src/lib/navigation.ts`) :
aucun composant à modifier pour la navigation. Le dépôt a déjà renumbéré des
parties (test existant « keeps renumbered content: regularization at IV,
set-valued at V, loss at IX ») : la renumérotation est la convention établie.

### 3.2 Liste exhaustive des mises à jour

**A. Routes**
1. `git mv` dans l'ordre décroissant : `src/routes/part9` → `part10`,
   `part8` → `part9`, `part7` → `part8`, `part6` → `part7`,
   `part5` → `part6`, `part4` → `part5`.
2. Nouvel arbre `src/routes/part4/` :
   - `lesson1/+page.svelte` — Le modèle linéaire et les moindres carrés
   - `lesson2/+page.svelte` — Le modèle linéaire général : ANOVA et ANCOVA
   - `lesson3/+page.svelte` — Inférence dans le modèle gaussien
   - `lesson4/+page.svelte` — Validation et diagnostic du modèle
   - `lesson5/+page.svelte` — Choix de modèle et sélection de variables
   - `quiz/+page.svelte`, `exercices/+page.svelte`,
     `practice/travaux-pratiques/+page.svelte`

**B. `src/lib/navigation.ts`**
1. Insérer après `part3/practice/travaux-pratiques` : 5 leçons + quiz +
   exercices + TP, tous `part: 4`.
2. Renumérer les entrées anciennes : `path` `/partN/...` → `/part(N+1)/...`,
   `part: N` → `N+1` (N = 4…9).
3. `PART_NAMES` :
   - `4: 'IV — Régression linéaire'`
   - `5: 'V — Régularisation'`
   - `6: 'VI — Set-valued'`
   - `7: 'VII — Optimum de Bayes'`
   - `8: 'VIII — Consistance'`
   - `9: 'IX — Généralisation'`
   - `10: 'X — Fonctions de perte'`

**C. `src/lib/navigation.test.ts`**
1. Test « places the reserved parts between Part I and the regularization part
   (now IV) » → la page après `part3/practice` est `part4/lesson1` (régression)
   et `part4/practice/travaux-pratiques` précède `part5/lesson1`.
2. Test « keeps renumbered content » → régularisation V (`/part5/lesson1`),
   set-valued VI, loss X (`/part10/lesson1`).
3. `PART_NAMES` 1…9 → 1…10.
4. « no next for last page » : `/part9/exercices` → `/part10/exercices`.
5. Nouveau test : les pages de la partie IV enregistrées dans l'ordre
   (lesson1→…→lesson5→quiz→exercices→practice), `part === 4`.

**D. Base de quiz (`src/lib/quiz/`)**
1. Renommer `questions/part4.ts`…`part9.ts` → `part5.ts`…`part10.ts` ;
   exports `PART4`→`PART5` … `PART9`→`PART10`.
2. Renumérer **tous les tags** `p4`…`p9` (y compris `pN/lM`, `pN/lM/<slug>`,
   `pN/synthese`) → `p5`…`p10` dans chaque fichier.
3. Renumérer les références textuelles `partN/lessonM` dans les explications
   (constatées dans `part6.ts`, `part7.ts`).
4. `questions/index.ts` : imports, ordre du spread, commentaire « 1..9 » →
   « 1..10 ».
5. Pages quiz déplacées : `getPageByPath('/partN/quiz')` → `/part(N+1)/quiz`,
   `getQuizQuestions('pN')` → `'p(N+1)'`, titres « Partie IV »…« Partie IX » →
   « V »…« X ».
6. Nouveau `questions/part4.ts` : questions taguées `p4/l1`…`p4/l5` +
   `p4/synthese` (~20 questions).

**E. Références croisées (texte + liens) — 65 occurrences identifiées**
| Fichier | Changements |
|---|---|
| `routes/intro/+page.svelte` | insérer « Partie IV — Régression linéaire » (1 phrase descriptive) ; renumérer les libellés V–X |
| `routes/part2/lesson1` | VI→VII, VII→VIII, VIII→IX, IX→X (texte + liens `resolve('/part6…9')` → `'/part7…10'`) |
| `routes/part2/lesson2` | IX→X (texte + liens `/part9` → `/part10`) |
| `routes/part2/lesson4` | IV→V (`/part4/lesson4` → `/part5/lesson4`), VIII→IX (`/part8/lesson3` → `/part9/lesson3`), IX→X (`/part9/…` → `/part10/…`) |
| `routes/part5/exercices` (futur part6) | titre « Partie V » → VI |
| `routes/part6/exercices` (futur part7) | « Partie IX » → X |
| `routes/part7/lesson1` (futur part8) | « Partie VI » → VII |
| `routes/part8/lesson1` (futur part9) | « Partie VII » → VIII |
| `routes/part9/lesson1, lesson3, exercices` (futur part10) | « Partie VI » / « partie VI » → VII |
| pages quiz part4…part9 (déplacées) | titres « Partie IV »…« IX » → « V »…« X » |
| `demos/LinearClassifierExplorer.svelte` | « Partie IX » → X |
| `demos/KNNConsistencyDemo.svelte` | « Partie VII.1 » → VIII.1 |
| `demos/RiskDecompositionDemo.svelte` | « partie VI » → VII |

**F. Travaux pratiques**
1. Nouveau `static/rmd/TP6-RegressionLineaire_enonce.Rmd` (complet : swiss,
   longley, prostate — calqué sur les TP existants et sur les TP3/TP4 des
   sources).
2. Page `part4/practice/travaux-pratiques/+page.svelte` avec le lien
   « TP 7 — Régression linéaire » (poursuite de la numérotation d'affichage ;
   noter l'off-by-one préexistant `TP5-Clustering` → « TP 6 »).

**G. Divers**
1. Store de progression : **aucun changement** (clé = chemin, localStorage
   `fep_progress`) ; les entrées des utilisateurs sur les anciens chemins
   deviennent orphelines — acceptable, à documenter dans le commit.
2. Page d'accueil et pages `/demo` : aucune référence à des numéros de partie
   (vérifié) — aucun changement.
3. `src/lib/quiz/index.ts` : commentaire « part N (1..9) » → « (1..10) ».

## 4. TODO 2 — Structure de la partie (5 leçons)

### Leçon 1 — « Le modèle linéaire et les moindres carrés »
Sources : `StatM1S1_2025.pdf` §I.1–I.5
- **1.1 Introduction : l'exemple swiss** — fécondité en Suisse 1888 ;
  4 régressions simples (tableau β̂0, β̂1, R² : 0.1247 / 0.4406 / 0.2150 /
  0.1735) vs régression multiple (R² ajusté 0.6707).
- **1.2 Le modèle** — `Yi = β0 + Σj βj xij + εi` (éq. 1) ; (H1) plein rang ;
  (H2) `E(ε) = 0`, `Σε = σ²In`.
- **1.3 Écriture matricielle et géométrie** — `Y = Xβ + ε` (éq. 2) ; matrice
  chapeau `H = X(XᵀX)⁻¹Xᵀ` ; projection orthogonale sur `Vect(X)` ;
  `ε̂ ⟂ Vect(X)`.
- **1.4 Estimateur des moindres carrés** — **Théorème 1**
  `β̂ = (XᵀX)⁻¹XᵀY` + éléments de preuve (dérivation de `‖Y−Xβ‖²`) ; sans
  biais ; `Var(β̂) = σ²(XᵀX)⁻¹` ; **Gauss–Markov**.
- **1.5 Résidus et estimation de σ²** — `ε̂ = (I−H)Y` ;
  `σ̂² = SCR/(n−p−1)` ; écart-types des coefficients
  `σ̂²[(XᵀX)⁻¹]jj`.
- **1.6 Sommes de carrés et R²** — SCR/SCE/SCT, `SCT = SCE + SCR`,
  `R² = SCE/SCT`, R² ajusté `1 − (n−1)/(n−p−1) · SCR/SCT`.
- **1.7 Exemple numérique : bien-être** (10 individus, 3 régresseurs,
  tableau p. 15 du PDF) — `XTX`, `(XTX)⁻¹`, `Xᵀy`,
  `β̂ = (3.2195, −12.0562, 0.5803, 0.6411)`, `σ̂² = 16.8852`, prédiction 40.63
  pour (1 enfant, BEU 30, NSE 50).
- Renvoi : « et si les covariables sont qualitatives ? » → leçon 2.

### Leçon 2 — « Le modèle linéaire général : ANOVA et ANCOVA »
Source : `ModèleLinéaire_ANOVA_ANCOVA.pdf` (intégrant)
- **2.1 Deux natures de covariables** — les modèles linéaires englobent la
  régression (covariables = régresseurs, variables quantitatives) et l'ANOVA
  (covariables = facteurs, variables qualitatives) ; Y reste une mesure
  numérique ; mélange des deux = ANCOVA. Régresseur (valeur numérique, une
  infinité de valeurs) vs facteur (niveaux, nombre fini, répétitions des Y).
- **2.2 Écriture de l'ANOVA** — `Yj,k = β0 + βj + εj,k` ; 1 paramètre par
  niveau ; `β0` : valeur moyenne des y observées ; `βj` : impact du niveau j ;
  forme de la matrice X.
- **2.3 Les contraintes de plein rang** — `β̂ = (XᵀX)⁻¹XᵀY` exige
  `rang(X) = p` :
  - **sans intercept** (`β0 = 0`) : `βj` = moyenne de la réponse au niveau j ;
  - **niveau de référence** (`β1 = 0`, R `contr.treatment`) : `β0` = moyenne du
    niveau 1, `βj` = écart du niveau j au niveau 1 ;
  - **somme des paramètres** (`Σj βj = 0`, R `contr.sum`) : `β0` = moyenne
    générale, `β0 + βj` = moyenne du niveau j.
- **2.4 ANOVA à 2 facteurs** — `Yijk = β0 + αi + βj + εijk` (effets
  principaux, additivité) ; contraintes de référence ; **interaction**
  `Yijk = β0 + αi + βj + γij + εijk` : le niveau i de F1 a un effet différent
  selon le niveau j de F2 (ex. : orientation du vent × pluie) ; R :
  `Y ~ F1*F2` ; contraintes `γi1 = 0`, `γ1j = 0`.
- **2.5 ANCOVA** — sans interaction `Yjk = β0 + βj + δ·xjk + εjk` (le facteur
  n'agit que sur l'intercept, droites parallèles) ; avec interaction
  `Yjk = β0 + βj + (δ + δj)·xjk + εjk` (le facteur agit sur l'intercept ET la
  pente, droites non parallèles).

### Leçon 3 — « Inférence dans le modèle gaussien »
Source : `StatM1S1_2025.pdf` §I.6–I.7
- **3.1 Hypothèse (H3)** — erreurs gaussiennes ⇒ indépendances ;
  `ε ~ Nn(0n, σ²In)`.
- **3.2 Maximum de vraisemblance** — **Théorème 2** `β̂MV = β̂` ;
  log-vraisemblance ; `σ̂²MV = SCR/n` (biaisé) vs `σ̂²` (sans biais).
- **3.3 Lois d'échantillonnage** — `β̂ ~ Np+1(β, σ²(XᵀX)⁻¹)` ;
  `(n−p−1)σ̂²/σ² ~ χ²(n−p−1)` ; indépendance `β̂`/`σ̂²` ;
  `Tj ~ Student(n−p−1)`.
- **3.4 Intervalles de confiance et test de Student** — IC à `1−α` de `βj` ;
  test `H0 : βj = 0`, rejet si `|Tj| > tn−p−1(1−α/2)` ; **exemple longley**
  (8 années, 1955–1962, tableau p. 29 du PDF) : `t5(97.5 %) = 2.57058`,
  IC(β1) = [0.02089 ; 0.15547], T = 4.471 / 3.369 / −2.391.
- **3.5 Inférence sur le modèle (test F)** — test global
  `F = (SCE/p)/(SCR/(n−p−1)) ~ Fp,n−p−1` + **tableau d'ANOVA** ; modèle
  réduit : `Fq = ((R²−Rq²)/q)/((1−R²)/(n−p−1)) ~ Fq,n−p−1` ;
  `q = 1 ⇒ F = t²` (même test que Student).
- **3.6 Prévisions** — `ŷ0` ; IC de la réponse moyenne
  `σ̂√(v0ᵀ(XᵀX)⁻¹v0)` ; **intervalle de prédiction**
  `σ̂√(1 + v0ᵀ(XᵀX)⁻¹v0)` ; distinction moyenne vs nouvelle observation.
- **3.7 Moindres carrés généralisés** — (H2′) `Σε = σ²ℱ` (ℱ symétrique
  définie positive, rang n) ; OLS reste sans biais mais plus BLUE,
  `Var(β̂) = σ²(XᵀX)⁻¹XᵀℱX(XᵀX)⁻¹` ; **MCG**
  `β̂MCG = (Xᵀℱ⁻¹X)⁻¹Xᵀℱ⁻¹Y` ; blanchiment : `ℱ = PPᵀ`, on multiplie le modèle
  par `P⁻¹` ; propriétés (sans biais, `Var = σ²(Xᵀℱ⁻¹X)⁻¹`, BLUE) ;
  `σ̂²MCG = ‖Y − Xβ̂MCG‖²ℱ⁻¹/(n−p−1)` ; mêmes types de tests sous (H3).

### Leçon 4 — « Validation et diagnostic du modèle »
Source : `8.validation_du_modele_lineaire_2025.pdf` (intégrant)
- **4.1 Rang de X et colinéarité** — « votre modèle est-il valide ? » ;
  vérification de (H1) : `qr()` en R, matrice des corrélations 2 à 2,
  valeurs propres, **conditionnement** `κ = λ1/λp` (règle `κ > 500`).
- **4.2 Effets de la colinéarité** — `β̂j ∝ cor(Xj, Y | autres)` ;
  `cov(β̂i, β̂j) ∝ −cor(Xi, Xj | restes)` ; non-identifiabilité (variable
  dupliquée : infinité de solutions) ; coefficients aux signes opposés ;
  **VIF** `= 1/(1−R²j)` (règle > 10) ;
  `Var(β̂j) = σ²/(‖xj‖²(1−R²j))` ; conséquences numériques (mauvais
  conditionnement de `XᵀX`) ; solutions : écart/regrouper les prédicteurs,
  ACP, **régularisation → renvoi vers la partie V**.
- **4.3 Graphes des résidus** — `ε̂i = yi − ŷi` ; moyenne nulle par
  construction (`eᵀX = 0`, démonstration avec `λ = (1,0,…,0)`) ; résidus vs Y,
  vs chaque Xi, vs temps ; pathologies : **asymétrie** (plusieurs
  populations, variable manquante), **blocs** (non-linéarité),
  **hétéroscédasticité** (variance non constante), **auto-corrélation**
  (données temporelles) ; grand n : lissage (`ksmooth()`, `lowess()`) +
  histogramme.
- **4.4 Résidus partiels et Q-Q plot** — `ε̂∆j,i = β̂j xj,i + ε̂i` : enlève
  l'effet estimé des autres variables ; détection de non-linéarité ;
  transformations (polynômes, `exp()`, `ln()`) ; **Q-Q plot** des résidus
  pour (H3).
- **4.5 Observations influentes** — atypique (s'écarte des autres) vs levier
  (loin du barycentre) vs influent (pèse sur les résultats) ; un point
  atypique n'est pas forcément influent ; **matrice chapeau H** (symétrique,
  idempotente) ; **leviers** `hii` : `0 ≤ hii ≤ 1`, `Σhii = p+1`, seuil
  `hii > 2(p+1)/n` ; **résidus standardisés**
  `ri = ε̂i/(σ̂√(1−hii))` ; **studentisés**
  `ti = ε̂i/(σ̂(−i)√(1−hii)) ~ Student(n−p−2)` (numérateur/dénominateur
  indépendants), seuil `|ti| > qt(0.975, n−p−2)` ≈ 2 ; **distance de Cook**
  `Di = hii·ri²/((p+1)(1−hii))` (seuil > 1) ;
  `ε̂(−i)i = ε̂i/(1−hii)` (pas besoin de n recalculs) ; que faire :
  supprimer / corriger / robuste / ne rien faire — à argumenter.
- **4.6 En bref** — le « jeu de données propre » : pas de multicolinéarité,
  linéarité, résidus sans structure, pas d'observation trop influente.

### Leçon 5 — « Choix de modèle et sélection de variables »
Source : `9.choix_de_modele.pdf` (intégrant)
- **5.1 Trois objectifs** — descriptif (exploratoire, ACP, recherche pas à
  pas) / explicatif (connaissance a priori, interprétabilité, inférence) /
  prédictif (parcimonie, compromis biais/variance) ; *data mining /
  data snooping* : n petit + recherche longue ⇒ faux « bon » modèle.
- **5.2 Compromis biais/variance** — polynômes de degré croissant : R² croît,
  `R² = 1` à l'interpolation ; R² seulement comparable à dimension égale ;
  deux façons de biaiser : sélection de variables, rétrécissement (ridge) ;
  rappel des solutions à la colinéarité (leçon 4) → partie V.
- **5.3 Critères de comparaison** — `PRESS` (Allen) :
  `Σi ε̂(−i)²i` ; **Mallows Cp** `= ‖ε̂‖²/σ̂²plein − (n−2(p+1))` : σ² estimé
  sur le modèle **complet** (sinon biaisé), `Cp = p+1` pour lui, viser
  `Cp ≈ k+1` ; **AIC** `= −2 log L + 2k` ; **BIC** `= −2 log L + k log n`
  (plus parcimonieux).
- **5.4 Algorithmes de sélection** — best-subset (`2^p` modèles, Leaps and
  Bound, impossible pour `p > 30`) ; **forward** (de `S = ∅`), **backward**
  (du modèle plein, ne marche pas si `n < p`), **both** ; caractère glouton
  (biais important, variance/complexité contrôlée) ; **exemple prostate**
  (97 observations, 8 variables : `lpsa ~ lcavol + lweight + svi + lbph + age`
  choisi par AIC) ; impact de la corrélation entre prédicteurs sur les
  méthodes (TP).
- **5.5 Pont vers la partie V** — Lasso (L1) / Ridge (L2) comme alternatives
  biaisées : renvoi explicite vers la leçon 4 de la partie V.

### Pages de synthèse
- **Quiz de synthèse** — questions `p4/synthese` + par leçon
  (`p4/l1`…`p4/l5`), ~20 questions : formules (β̂, VIF, Cp, AIC, BIC, Cook),
  seuils (κ > 500, VIF > 10, Di > 1), pièges (R² non comparable, atypique ≠
  influent, `F = t²`, codages ANOVA, σ̂²MV biaisé).
- **Exercices** — style classique avec mode enseignant : calcul manuel de β̂
  (données bien-être), IC de Student (longley), tableau d'ANOVA + test F
  emboîté, VIF et conditionnement, encodage d'un facteur (3 codages, même
  ajustement), comparaison AIC/BIC sur un jeu simulé.
- **TP** — R Markdown complet : swiss (estimation + diagnostic), longley
  (inférence), prostate (validation + sélection : `regsubsets`, `step`).

## 5. TODO 3 — Widgets interactifs

Convention : simulateurs seedés (`mulberry32` + `combineSeed` de
`src/lib/math/util.ts`) ; chaque widget cite sa source dans la légende ;
simplifications signalées dans la légende et les commentaires ; couleur via
variables CSS du thème.

### Leçon 1
| Widget | Interaction | Affichage | Apport pédagogique |
|---|---|---|---|
| **W1.1 Ajuster la droite par moindres carrés** | sliders β0, β1 sur un nuage 2D (~15 points) ; bouton « Moindres carrés » qui snap vers (β̂0, β̂1) | SSE en direct, segments de résidus verticaux, paysage de SSE(β0, β1) en contours avec le minimum | OLS = minimisation de la somme des carrés ; unicité du minimum sous (H1) |
| **W1.2 Sommes de carrés et R²** | cases à cocher : les 4 régresseurs swiss | barres SCE/SCR/SCT, R² et R² ajusté recalculés | sens de R² ; R² croît avec p, R² ajusté pénalise (amorce leçon 5) |
| **W1.3 Dispersion de X et variance de β̂** | slider d'étalement de x (et de ρ entre 2 prédicteurs) | IC de la pente sur échantillons répétés ; `Var(β̂1)` ∝ `1/Σ(xi−x̄)²` | la précision de l'estimation est portée par `(XᵀX)⁻¹` |

### Leçon 2
| Widget | Interaction | Affichage | Apport pédagogique |
|---|---|---|---|
| **W2.1 Encodage des facteurs** | radio : sans intercept / référence / somme ; facteur à 3 niveaux (ex. direction du vent) | matrice de design X, interprétation de chaque β, moyennes par niveau (identiques dans les 3 codages) | non-uniqueté des paramètres, unicité de l'ajustement ; choix de référence |
| **W2.2 Interaction à 2 facteurs** | 2 facteurs (ex. vent × pluie) ; bascule « avec / sans interaction » | grille des moyennes par croisement, interaction plot (droites parallèles vs qui se croisent), matrice X avec les termes γij | additivité des effets principaux vs interaction ; lecture d'un plan factoriel |

### Leçon 3
| Widget | Interaction | Affichage | Apport pédagogique |
|---|---|---|---|
| **W3.1 Lois d'échantillonnage de β̂** | sliders n, σ², étalement de x ; B = 200 tirages seedés | histogramme de β̂1 vs `N(β1, σ²(XᵀX)⁻¹)11` ; densité Student(n−p−1) ; IC + couverture empirique sur les B échantillons | lien entre inférence gaussienne et couverture des IC |
| **W3.2 Test de Student vs test de Fisher** | longley fixe ; choix du coefficient ; puis sliders R², Rq², q, n pour le test emboîté | t observé, région de rejet sur la courbe t ; F vs valeur critique ; cas `q = 1` montrant `F = t²` ; tableau d'ANOVA | équivalence des tests ; lecture du tableau d'ANOVA |
| **W3.3 Int. de prédiction vs int. de confiance** | slider x0 sur un nuage 1D | deux bandes (moyenne étroite, prédiction large) qui s'élargissent en s'éloignant de x̄ | moyenne de la réponse vs nouvelle observation ; effet levier `v0ᵀ(XᵀX)⁻¹v0` |
| **W3.4 Moindres carrés généralisés** | slider ρ d'erreurs AR(1) | comparaison OLS vs MCG (blanchiment P) : variances simulées de l'estimateur ; `Σε` affiché | quand (H2) est brisée, OLS n'est plus BLUE ; le blanchiment restaure les propriétés |

### Leçon 4
| Widget | Interaction | Affichage | Apport pédagogique |
|---|---|---|---|
| **W4.1 La clinique des résidus** | radio : gaussien correct / non-linéarité quadratique / hétéroscédasticité en éventail / asymétrie / auto-corrélation | panneau 2×2 : résidus vs ajustés, résidus vs X1, résidus vs temps, Q-Q plot (+ histogramme) | chaque pathologie a sa signature visuelle ; comment la lire |
| **W4.2 Colinéarité, conditionnement, VIF** | slider ρ entre 2 prédicteurs (0 → 0.999) | heatmap de corrélations, κ, VIF1/VIF2, `Var(β̂1)`, `Var(β̂2)` (échelle log), signes des coefficients qui peuvent s'inverser, R² (élevé malgré tout) | R² élevé ≠ coefficients bien estimés ; seuils κ > 500, VIF > 10 |
| **W4.3 Leviers et distance de Cook** | clic pour ajouter des points (fallback clavier documenté) ; basculer « écarter le point i » | points colorés par hii avec seuil `2(p+1)/n` ; Di listé ; droite et β̂ avant/après écart (`β̂` vs `β̂(−i)`) ; quadrants levier × résidu | distinguer atypique / levier / influent ; la distance de Cook synthétise les deux |
| **W4.4 Résidus partiels** | modèle multiple où X1 a un vrai effet quadratique, confondu avec X2 | côte à côte : nuage brut (X1, Y) (effet masqué) vs résidus partiels (X1, β̂1x1+ε̂) (courbure visible) ; bascule « ajouter x² » | partialling out pour voir le lien réel ; détection de non-linéarité |

### Leçon 5
| Widget | Interaction | Affichage | Apport pédagogique |
|---|---|---|---|
| **W5.1 Polynômes et sur-ajustement** | slider degré d = 0…n−1 (n = 15 points) | courbe ajustée, R² d'entraînement (→ 1 à l'interpolation), erreur de test sur échantillon frais (en U), courbes AIC/BIC/Cp en fonction de d avec leurs argmin | R² n'est pas un critère de sélection ; les critères pénalisés repèrent le bon degré |
| **W5.2 Sélection de variables** | p = 8 prédicteurs (3 pertinents, 1 nul mais corrélé, 4 bruit) ; critère (R² adj / Cp / AIC / BIC) ; boutons best-subset / forward / backward / both | courbe critère vs taille du sous-ensemble, sous-ensembles choisis par algorithme, compteur `2^p` (et note « infeasible pour p > 30 ») | algorithmes gloutons vs exhaustif ; sensibilité au critère |
| **W5.3 AIC vs BIC** | même famille de modèles ; slider n (50 → 500) | deux courbes ; pénalités `2k` vs `k log n` ; modèles sélectionnés | la force de la pénalité : BIC plus parcimonieux, surtout pour grand n |

## 6. Modules de mathématiques (`src/lib/math/`)

**Nouveau module `linear-model.ts` + `linear-model.test.ts`** (docstrings
citant le fichier source `course_sources/sophie/…` et la section/théorème) :
- `hatMatrix`, `leverages`, `standardizedResiduals`, `studentizedResiduals`,
  `cooksDistance`, `deletedResidual` ;
- `sumsOfSquares`, `rSquared`, `adjustedRSquared` ;
- `vif`, `varBetaHat` (réutiliser `olsClosedForm`, `computeConditionNumber`
  de `regression.ts`) ;
- `tQuantile` (Student, via bêta incomplète régulière) et `fQuantile`
  (Fisher) — **n'existent pas dans le dépôt, à implémenter** ;
- `mallowCp`, `aic`, `bic`, `press` ;
- `bestSubset` (exhaustif, p ≤ ~12), `forwardSelection`, `backwardSelection`,
  `stepwiseBoth` ;
- `glsClosedForm` (blanchiment `ℱ = PPᵀ`) ;
- `anovaDesign` (codages none/treatment/sum, 2 facteurs ± interaction),
  `ancovaDesign`, `polynomialDesign` ;
- simulateurs seedés (scénarios de résidus, échantillons répétés, polynômes,
  sélection, AR(1)) avec `combineSeed`.

**Tests (au-delà des formules auto-référentielles) — fixtures issus des PDF :**
- `tQuantile(0.975, 5) ≈ 2.57058` (longley, p. 31) ;
- longley : `β̂ = (120.0801, 0.0882, −0.7570)`, écart-types
  `(26.8533, 0.0262, 0.3167)`, `T = (4.471, 3.369, −2.391)`,
  IC(β1) = [0.02089 ; 0.15547] ;
- bien-être : `β̂`, `σ̂² = 16.8852`, prédiction 40.6273 pour (1, 30, 50) ;
- swiss : les 4 R² simples (0.1247, 0.4406, 0.2150, 0.1735) et R² ajusté
  multiple 0.6707 (sert aussi de validation de l'ensemble embarqué) ;
- prostate (si embarqué) : AIC modèle nul 28.84, modèle final −61.37420 ;
- invariants : `SCT = SCE + SCR` ; R² monotone en la dimension du modèle ;
  `F = t²` pour `q = 1` ; `Σhii = p+1` ; `0 ≤ hii ≤ 1` ;
  `deletedResidual ≡ ε̂i/(1−hii)` ; `cooksDistance` vs recalcul
  leave-one-out brut ; `VIF = 1/(1−R²j)` ; invariance des moyennes par niveau
  de l'ANOVA sous les 3 codages ; AIC/BIC vs calculs à la main ;
  `bestSubset` sur un cas trivial connu ; MCG = OLS quand ℱ = I.

## 7. Jeux de données

| Jeu | Origine | Décision |
|---|---|---|
| `longley` (8×3) | Tableau complet p. 29 de `StatM1S1_2025.pdf` | **Embarqué tel quel** |
| bien-être (10×4) | Tableau complet p. 15 de `StatM1S1_2025.pdf` | **Embarqué tel quel** |
| `swiss` (47×5) | Jeu standard R (`datasets::swiss`), cité p. 3 du PDF | **Embarquer le vrai jeu** s'il est facilement trouvable ET qu'il reproduit le tableau de la p. 4 du PDF (R² : 0.1247 / 0.4406 / 0.2150 / 0.1735 ; R² ajusté multiple 0.6707) ; sinon générateur synthétique fidèle au tableau, signalé « illustratif » |
| `prostate` (97×9) | `Prostate.rda` (livre E1071), cité p. 38 du PDF | **Embarquer le vrai jeu** s'il est facilement trouvable ET qu'il reproduit les AIC du PDF (28.84 modèle nul, −61.37420 modèle final) ; sinon analogique synthétique (n = 97, p = 8) signalé « illustratif » |

## 8. Démonstrations (`src/lib/components/demos/`)

16 nouveaux composants, réutilisant `ScatterPlot`, `CurveChart`,
`DensityChart`, `BarChart`, `HeatmapGrid`, `ContourPlot`/`ContourLandscape`,
`Figure` ; SVG manuel documenté (commentaire « fallback ») si un besoin n'est
pas couvert (bandes de prédiction, marqueurs de Cook, interaction plot).

| Leçon | Composants |
|---|---|
| 1 | `LmOlsFit`, `LmSumsOfSquares`, `LmVarianceBeta` |
| 2 | `LmAnovaCoding`, `LmInteractionPlot` |
| 3 | `LmSamplingDist`, `LmStudentFisher`, `LmPredictionBand`, `LmGls` |
| 4 | `LmResidualClinic`, `LmCollinearity`, `LmLeverageCook`, `LmPartialResidual` |
| 5 | `LmPolyOverfit`, `LmVariableSelection`, `LmAicBic` |

## 9. Phases d'exécution

1. **Phase A — Renumérotation mécanique** (aucun changement de contenu) :
   renoms de routes (`git mv`), `navigation.ts`, `navigation.test.ts`, quiz
   (fichiers, tags, textes), références croisées, page TP existantes.
   Vérifier `check`/`test:unit`/`lint`/`build`. Commit dédié.
2. **Phase B — Mathématiques** : `linear-model.ts` + `linear-model.test.ts`
   (fixtures PDF) + jeux de données (recherche/verification swiss & prostate,
   fallback synthétique).
3. **Phase C — Leçons** : 5 pages + 16 demos (2 leçons par itération ; skills
   `interactive-demo`, `math-content-katex`, `page-creation`,
   `chart-visualization`).
4. **Phase D — Quiz, exercices, TP** : `questions/part4.ts` (~20 questions),
   exercices avec mode enseignant (skill `exercises-assessment`),
   `static/rmd/TP6-RegressionLineaire_enonce.Rmd` complet (swiss, longley,
   prostate : estimation, diagnostic, inférence, sélection).
5. **Phase E — Vérification finale** : `npm run check`, `npm run test:unit`,
   `npm run lint`, `npm run build` ; audit de fidélité aux sources (skill
   `academic-content-review`) : chaque théorème/numérotation tracé vers
   `course_sources/sophie/*.pdf` ; légendes honnêtes sur les simplifications ;
   imports vérifiés contre les fichiers réellement lus.

## 10. Checklist de fin de tâche

- [ ] `npm run check`
- [ ] `npm run test:unit`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Chaque fonction de math nouvelle a un test (fixtures PDF + invariants)
- [ ] Chaque widget cite sa source et signale ses simplifications
- [ ] Chaque import pointe vers un fichier réellement lu
- [ ] Chaque citation de théorème/section nomme le fichier
      `course_sources/sophie/*.pdf` d'origine
- [ ] Renumérotation complète : aucun résidu `part4`…`part9` ancien, aucun
      tag `p4`…`p9` ancien, aucun « Partie IV »…« Partie IX » ancien hors
      nouvelle partie
