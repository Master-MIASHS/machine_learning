# Recherche — Leçon « La double descente » (`/part5/double-descente`)

Rapport de revue de littérature (novembre 2026) ayant servi à rédiger
`src/routes/part5/double-descente/+page.svelte` et `src/lib/math/double-descent.ts`.
Chaque affirmation de la leçon qui dépasse `course_sources/` est rattachée ici
à une source **lue** (PDF arXiv / version éditeur), avec un indicateur de
confiance.

## Ancrage dans `course_sources/`

- `course_sources/typst/theorie.typ`, § « Limites de la théorie VC pour les
  réseaux de neurones » → « Le paradoxe de la double descente » : les trois
  régimes (bloc « Phénomène de double descente (Belkin et al., 2019) »), la
  figure pseudo-inverse (`d = 50`, mauvais conditionnement de `X` au seuil),
  le biais implicite de la descente de gradient vers la marge maximale.
- `course_sources/typst/regularization.typ` : Définition 5.1 (Ridge),
  Proposition 5.1 (facteurs de rétrécissement `σ_j²/(σ_j²+λ)`).
- `course_sources/typst/optim.typ` : Proposition 2.6.2 (Ridge bien posé).

Tout le reste est une **extension** tirée de la littérature ci-dessous.

## Conventions à respecter (pièges repérés)

- **Risque** : Hastie et al. (2022) et Schaeffer et al. (2023) utilisent le
  risque en excès (sans `σ²`) ; Belkin–Hsu–Xu (2020) et Nakkiran et al. (2021)
  incluent `σ²`. La leçon affiche les deux et les distingue.
- **λ de Ridge** : Hastie et al. utilisent `(1/n)‖y − Xb‖² + λ‖b‖²`, d'où
  `λ* = σ²γ/r²` ; Nakkiran et al. utilisent `‖Xb − y‖² + λ‖b‖²`, d'où
  `λ_opt = dσ²/‖β*‖²` (= `n` fois le précédent). Vérifié cohérent.
- **« Monotone »** : Hastie et al. prouvent domination de l'interpolant et
  absence de divergence, pas la monotonie en `γ` (dans le cas mal spécifié,
  le Ridge optimal semble avoir un minimum vers `γ = 1`). La monotonie
  (en `n`) est le Théorème 1 de Nakkiran–Venkat–Kakade–Ma, sous covariables
  gaussiennes isotropes uniquement.

## Régression linéaire, conditionnement, Ridge

| Affirmation (leçon) | Source | Confiance |
|---|---|---|
| Risque exact fini de `X_T⁺y`, trois cas `p ≤ n−2`, `n−1 ≤ p ≤ n+1` (∞), `p ≥ n+2` (Thm 6.3) | Belkin, Hsu, Xu, *SIAM J. Math. Data Sci.* 2(4):1167–1180, 2020, **Théorème 1** ; arXiv:1903.07571 | VERIFIED |
| Seconde descente gagnante si `‖β‖²/σ² > D/(D−n−1)` (T aléatoire) | idem, **Corollaire 1** | VERIFIED |
| `E B_X = r²(1 − n/p)` (invariance par rotation) | Hastie et al., §3.1 | VERIFIED |
| Limite `σ²γ/(1−γ)` ; `r²(1−1/γ) + σ²/(γ−1)` (Thm 6.4), hypothèse moment `4+η` | Hastie, Montanari, Rosset, Tibshirani, *Ann. Statist.* 50(2):949–986, 2022, **Théorème 1** (numérotation arXiv v5) | VERIFIED |
| Minimum local `γ = √SNR/(√SNR−1)` si SNR > 1 | idem, après Thm 1 | VERIFIED |
| Ridge : `r²λ²m'(−λ) + σ²γ(m(−λ) − λm'(−λ))`, `λ* = σ²γ/r²`, risque `σ²γ m(−λ*)` ; domination stricte | idem, **Corollaire 5** (§6.1), §1.1 | VERIFIED |
| LOO / GCV atteignent l'optimum asymptotiquement | idem, Théorème 7 | VERIFIED |
| `V_X = (σ²/n) Tr(Σ̂⁺Σ)` | idem, Lemme 1 | VERIFIED |
| Marchenko–Pastur : densité, bords `(1±√γ)²`, atome `1−1/γ` | Marchenko & Pastur, *Math. USSR-Sb.* 1(4):457–483, 1967 | PARTIAL (énoncé standard, texte primaire non ouvert ; cohérent avec Advani et al. éq. 14) |
| Plus petite valeur propre non nulle → `(1−√γ)²` | Bai & Yin, *Ann. Probab.* 21(3):1275–1294, 1993 | PARTIAL (résumé de l'abstract) |
| Modes de petite valeur propre : terme `σ²/λ_i`, divergence MP en `α = 1`, arrêt précoce optimal ≈ L2 optimal | Advani, Saxe, Sompolinsky, *Neural Networks* 132:428–446, 2020 (lu : arXiv:1710.03667 v1) | VERIFIED |
| Trois ingrédients du pic (petites valeurs singulières, test le long de ces modes, résidus projetés) | Schaeffer et al., arXiv:2303.14151, 2023 | VERIFIED |
| Monotonie en `n` du Ridge optimal (non asymptotique), modèle de projections pour la taille ; contre-exemple non gaussien | Nakkiran, Venkat, Kakade, Ma, ICLR 2021, arXiv:2003.01897, **Thm 1, Thm 3, §4.1** | VERIFIED |
| Préhistoire : Opper et al. 1990, Duin 2000, pseudo-inverse | Loog, Viering, Mey, Krijthe, Tax, *PNAS* 117(20):10625–10626, 2020 | VERIFIED |

Non retenu dans le texte visible : Vallet, Cailton & Refregier (1989) — titre
non vérifié ; la leçon parle seulement de « travaux de physique statistique de
la fin des années 1980 ».

## Classification

| Affirmation | Source | Confiance |
|---|---|---|
| Belkin et al. : perte carrée, erreur 0-1 et carrée rapportées ; pic RFF à `N = n` ; « no predictive ability for classification » ; réseau 1 couche cachée, seuil `n·K` | Belkin, Hsu, Ma, Mandal, *PNAS* 116(32):15849–15854, 2019 | VERIFIED |
| Prop. 6.10 : risque logistique > 0 ; séparable ⇒ infimum 0 non atteint (pas de MLE) ; non séparable ⇒ coercif, MLE existe ; position générale ⇒ dichotomie | Résultat élémentaire, **démontré dans la leçon** (pas de source externe ; cohérent avec Candès & Sur 2020, où l'existence du MLE équivaut à la non-séparabilité) | PROUVÉ |
| `C(N,d) = 2Σ_{k<d} binom(N−1,k)` ; `P(2d,d) = 1/2` | Cover, *IEEE Trans. Electron. Comput.* EC-14(3):326–334, 1965, Thm 1, éq. (20)–(24) | VERIFIED (OCR partiellement brouillé, récurrence lisible) |
| Transition d'existence du MLE logistique, `h_MLE(0,0) = 1/2`, décroissance en le signal | Candès & Sur, *Ann. Statist.* 48(1):27–42, 2020, Thm 1 | VERIFIED |
| Pic au seuil de séparabilité `κ* < 1/2` (ML puis SVM via GD) | Deng, Kammoun, Thrampoulidis, *Inf. Inference* 11(2):435–495, 2022 | VERIFIED (contenu) ; DOI non trouvé |
| Perte carrée : seuil `κ = 1`, erreur → 1/2 quel que soit le SNR | Kini & Thrampoulidis, ISIT 2020, pp. 2527–2532, Remarque 2 | VERIFIED |
| Perceptron pseudo-inverse : `G(1) = 0,5` (hasard) | Opper, Kinzel, Kleinz, Nehl, *J. Phys. A* 23(11):L581–L586, 1990 | VERIFIED |
| GD logistique sur données séparables → direction SVM, norme en `log t` | Soudry et al., *JMLR* 19:1–57, 2018, Thm 3 | VERIFIED |
| Tous vecteurs de support si `d > 10n ln n + n − 1` (isotrope, étiquettes fixées) ; SVM = interpolant min-norme | Muthukumar, Narang, Subramanian, Belkin, Hsu, Sahai, *JMLR* 22(222), 2021, Thm 11 | VERIFIED |
| Régimes où classer réussit et régresser échoue | idem, Thm 13 | VERIFIED |
| Dimensions effectives ; `d = O(n)` ne suffit pas (converse faible) | Hsu, Muthukumar, Xu, AISTATS 2021, PMLR 130:91–99, Thm 1 & 3 | VERIFIED (la nécessité de `Ω(n log n)` est due à Ardeshir et al., non affirmée dans la leçon) |
| Marge maximale bénigne : erreur ≤ `η + exp(−c‖μ‖⁴/p)` sous `p ≳ n²`, `‖μ‖²≳ log` | Chatterji & Long, *JMLR* 22(129):1–30, 2021, Thm 4 | VERIFIED |

## Deep learning

| Affirmation | Source | Confiance |
|---|---|---|
| Ajustement d'étiquettes aléatoires ; régularisation « ni nécessaire ni suffisante » | Zhang, Bengio, Hardt, Recht, Vinyals, ICLR 2017 | VERIFIED |
| Définition exacte de l'EMC ; hypothèse de double descente généralisée (informelle, `ε = 0,1` heuristique) | Nakkiran, Kaplun, Bansal, Yang, Barak, Sutskever, ICLR 2020 / *J. Stat. Mech.* 2021:124003, Déf. 1, Hyp. 1 | VERIFIED |
| ResNet18 `[k,2k,4k,8k]`, `k = 64` standard ; CIFAR-10 15 % de bruit (Fig. 1) ; plateau sans bruit sur CIFAR-10, pic sur CIFAR-100 ; epoch-wise ; « 4,5× plus de données » pire (Transformers) ; le pic suit le seuil ; disparaît souvent avec arrêt précoce optimal | idem | VERIFIED (aucune largeur de pic chiffrée dans le texte — ne pas en inventer) |
| Biais monotone, variance unimodale | Yang, Yu, You, Steinhardt, Ma, ICML 2020, PMLR 119:10767–10777 | VERIFIED (Neal et al. 2018 ne disent PAS « unimodale ») |
| Régime paresseux : pic dû aux variances bruit + initialisation ; ensemble de K modèles → 1/K ; K → ∞ plat | d'Ascoli, Refinetti, Biroli, Krzakala, ICML 2020, PMLR 119:2280–2290 | VERIFIED |
| Jamming `N*` (perte charnière quadratique), `N* ≠ P` en général, cusp supprimé par arrêt précoce | Spigler et al., *J. Phys. A* 52(47):474001, 2019 | VERIFIED |
| `‖f_N − f̄_N‖ ∼ N^{-1/4}`, `ε_N − ε_∞ ∼ N^{-1/2}` ; moyenne de 20 réseaux quasi plate | Geiger et al., *J. Stat. Mech.* 2020:023401 | VERIFIED |
| NTK constant en largeur infinie → régression à noyau | Jacot, Gabriel, Hongler, NeurIPS 2018 | VERIFIED (pages non vérifiées) |
| Features aléatoires : pic en `N = n`, biais ET variance piquent, subsiste sans bruit, λ l'efface, optimum à largeur infinie | Mei & Montanari, *CPAM* 75(4):667–766, 2022 | VERIFIED |
| Double descente en époques = superposition de compromis par couches ; corrigée par pas par couche | Heckel & Yilmaz, ICLR 2021 | VERIFIED |
| CNN CIFAR-100, weight decay optimal → erreur essentiellement monotone ; pas de λ unique | Nakkiran, Venkat, Kakade, Ma, ICLR 2021, §5 | VERIFIED |
| Nombre effectif de paramètres → courbes en U | Curth, Jeffares, van der Schaar, NeurIPS 2023 | VERIFIED (abstract) |

## Modèles jouets des démos (simplifications assumées)

- **5.1** modèle « variables faibles » de Belkin–Hsu–Xu, courbe exacte + Monte-Carlo (n ≤ 40, D = 3n).
- **5.2** spectre empirique (n = 40) vs Marchenko–Pastur / Bai–Yin (asymptotiques).
- **5.3** formules asymptotiques exactes de Hastie et al. (aucune simulation).
- **5.4** modèle « spiked » : 5 variables informatives de variance 1 + 195 non
  informatives de variance 0,02 ; classifieur moindres carrés sur ±1 ; erreur
  0-1 exacte par la formule de l'angle dans la géométrie de Σ.
- **5.5** réseau 2 couches à première couche ReLU figée, entrée 1-D, n = 20,
  plan stratifié (en 1-D, des points i.i.d. peuvent être arbitrairement
  proches et rendre toute interpolation explosive — artefact de basse
  dimension) ; médiane sur 15 tirages (queue lourde près de N = n).
