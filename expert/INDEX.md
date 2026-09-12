# INDEX — briefs expert

Manifeste des 64 briefs de recherche (52 panneaux `ExpertPanel` + 12 leçons
expert). Tous en `pending` : aucun agent n'a été spawné.

Colonnes : **id** (lien vers le brief) · **titre** · **type** (`panel`/`lesson`)
· **level** (`m1+`/`m2`/`research`) · **prio** (1 haute, 2 moyenne, 3 frontière)
· **statut** (`pending` → `researching` → `drafted` → `reviewed` →
`implemented`).

Légende des statuts et prompt de spawn : voir [README.md](README.md).

## Priorités

- **Prio 1 (haute)** — ponts entre parties, parts sans contenu expert, leçons
  sans panneau : à spawnner en premier.
- **Prio 2 (moyenne)** — autres panneaux et leçons.
- **Prio 3 (frontière de recherche)** — niveau M2/doctorat, à traiter après
  les tiers 1–2 (distinguer prouvé/heuristique/UNVERIFIED).

## Part I — Optimisation (13)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p1-l1-kkt-dualite-lagrangienne](part1/lesson1/kkt-dualite-lagrangienne.md) | Conditions KKT et dualité lagrangienne | panel | m2 | 1 | pending |
| [p1-l1-sous-gradient-optimisation-non-lisse](part1/lesson1/sous-gradient-optimisation-non-lisse.md) | Sous-gradient et optimisation non lisse | panel | m2 | 2 | pending |
| [p1-l2-conditionnement-taux-gd](part1/lesson2/conditionnement-taux-gd.md) | Nombre de conditionnement et taux de convergence de la descente de gradient | panel | m2 | 2 | pending |
| [p1-l2-fenchel-legendre-dualite](part1/lesson2/fenchel-legendre-dualite.md) | Dualité de Fenchel–Legendre | panel | m2 | 2 | pending |
| [p1-l3-nesterov-preuve-ode](part1/lesson3/nesterov-preuve-ode.md) | Nesterov accéléré vu comme une ODE amortie | panel | m2 | 2 | pending |
| [p1-l3-bornes-minimax-convexe](part1/lesson3/bornes-minimax-convexe.md) | Bornes minimax de l'optimisation convexe au premier ordre | panel | m2 | 2 | pending |
| [p1-l3-adam-convergence-adam-adaptive-methods](part1/lesson3-adam/convergence-adam-adaptive-methods.md) | Convergence d'Adam : ce qui est réellement prouvé | panel | research | 3 | pending |
| [p1-l4-reduction-variance-svrg-sarah](part1/lesson4/reduction-variance-svrg-sarah.md) | Réduction de variance : SVRG et SARAH | panel | m2 | 2 | pending |
| [p1-l4-sgd-regularisation-implicite](part1/lesson4/sgd-regularisation-implicite.md) | Le SGD comme régularisateur implicite | panel | research | 3 | pending |
| [p1-l4-quasi-newton-lbfgs-gradient-naturel](part1/lesson4/quasi-newton-lbfgs-gradient-naturel.md) | Quasi-Newton (L-BFGS) et gradient naturel | panel | m2 | 2 | pending |
| [p1-lesson-dualite-convexe-kkt](part1/lessons/dualite-convexe-kkt.md) | Dualité convexe et conditions KKT | lesson | m2 | 1 | pending |
| [p1-lesson-methodes-proximales-fista-admm](part1/lessons/methodes-proximales-fista-admm.md) | Méthodes proximales et premier ordre moderne (prox, FISTA, ADMM) | lesson | m2 | 1 | pending |
| [p1-lesson-optimisation-non-convexe-deep-learning](part1/lessons/optimisation-non-convexe-deep-learning.md) | Optimisation non convexe en deep learning | lesson | research | 3 | pending |

## Part II — Classification supervisée (7)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p2-l1-estimateurs-noyau-nadaraya-watson](part2/lesson1/estimateurs-noyau-nadaraya-watson.md) | Estimateurs à noyau : Nadaraya–Watson et Parzen | panel | m2 | 2 | pending |
| [p2-l1-maudit-dimension-quantitatif](part2/lesson1/maudit-dimension-quantitatif.md) | Le maudit de la dimension, quantitativement | panel | m2 | 2 | pending |
| [p2-l2-fisher-lda](part2/lesson2/fisher-lda.md) | Discriminant linéaire de Fisher et LDA | panel | m2 | 2 | pending |
| [p2-l2-biais-implicite-sgd-max-margin](part2/lesson2/biais-implicite-sgd-max-margin.md) | Biais implicite du SGD : vers la solution max-margin | panel | research | 3 | pending |
| [p2-l3-impurete-vue-informationnelle](part2/lesson3/impurete-vue-informationnelle.md) | Critères d'impureté : vue informationnelle | panel | m2 | 2 | pending |
| [p2-l4-svm-dualite-kkt](part2/lesson4/svm-dualite-kkt.md) | Dualité KKT de la SVM : vecteurs support et parcimonie | panel | m2 | 1 | pending |
| [p2-lesson-rkhs-methodes-noyau](part2/lessons/rkhs-methodes-noyau.md) | Espaces de Hilbert à noyau (RKHS) et méthodes à noyau | lesson | m2 | 1 | pending |

## Part III — Clustering (6)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p3-l1-single-linkage-mst-hartigan](part3/lesson1/single-linkage-mst-hartigan.md) | Single-linkage, arbres couvrants minimaux et consistance de Hartigan | panel | m2 | 1 | pending |
| [p3-l1-clustering-model-based-bmdp](part3/lesson1/clustering-model-based-bmdp.md) | Vue model-based : BMDP et priors de partition | panel | research | 3 | pending |
| [p3-l2-kmeanspp-garantie](part3/lesson2/kmeanspp-garantie.md) | k-means++ : une initialisation avec garantie | panel | m2 | 1 | pending |
| [p3-l2-kmeans-em-dur](part3/lesson2/kmeans-em-dur.md) | K-moyennes comme EM dur sur un mélange gaussien | panel | m2 | 2 | pending |
| [p3-lesson-clustering-spectral-laplacien](part3/lessons/clustering-spectral-laplacien.md) | Clustering spectral et laplacien de graphe | lesson | m2 | 2 | pending |
| [p3-lessons-melange-gaussien-em](part3/lessons/melange-gaussien-em.md) | Mélange gaussien et algorithme EM | lesson | m2 | 2 | pending |

## Part IV — Régression linéaire (10)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p4-l1-frisch-waugh-lovell](part4/lesson1/frisch-waugh-lovell.md) | Lemme de Frisch–Waugh–Lovell et géométrie des coefficients partiels | panel | m2 | 2 | pending |
| [p4-l1-ols-asymptotique-design-aleatoire](part4/lesson1/ols-asymptotique-design-aleatoire.md) | OLS en design aléatoire : asymptotique et Cramér–Rao | panel | m2 | 2 | pending |
| [p4-l2-tests-multiples-fdr-tukey](part4/lesson2/tests-multiples-fdr-tukey.md) | Tests multiples après ANOVA : Tukey, Bonferroni, FDR | panel | m2 | 2 | pending |
| [p4-l3-bootstrap-theorie](part4/lesson3/bootstrap-theorie.md) | Le bootstrap : estimer la loi d'échantillonnage sans gaussienne | panel | m2 | 1 | pending |
| [p4-l3-regression-lineaire-bayesienne](part4/lesson3/regression-lineaire-bayesienne.md) | Régression linéaire bayésienne : shrinkage et pont vers le Ridge | panel | m2 | 2 | pending |
| [p4-l4-robust-m-estimateurs-huber](part4/lesson4/robust-m-estimateurs-huber.md) | Robustesse : M-estimateurs, Huber et point de rupture | panel | m2 | 2 | pending |
| [p4-l5-cv-inegalite-oracle](part4/lesson5/cv-inegalite-oracle.md) | Validation croisée : inégalité oracle de Yang–Barron | panel | m2 | 2 | pending |
| [p4-l5-bic-aic-cv](part4/lesson5/bic-aic-cv.md) | AIC vs BIC : deux objectifs, deux pénalités | panel | m2 | 2 | pending |
| [p4-lesson-glm-modeles-lineaires-generalises](part4/lessons/glm-modeles-lineaires-generalises.md) | Modèles linéaires généralisés (GLM) | lesson | m2 | 2 | pending |
| [p4-lesson-bootstrap-theorie](part4/lessons/bootstrap-theorie.md) | Théorie du bootstrap | lesson | m2 | 1 | pending |

## Part V — Régularisation (8)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p5-l1-bagging-oob-63-2](part5/lesson1/bagging-oob-63-2.md) | Pourquoi 63,2 % et pourquoi l'erreur OOB est (presque) non biaisée | panel | m2 | 2 | pending |
| [p5-l2-rf-consistance-clt-honest](part5/lesson2/rf-consistance-clt-honest.md) | Consistance et normalité asymptotique des Random Forest | panel | m2 | 2 | pending |
| [p5-l3-boosting-descente-gradient-fonctionnelle](part5/lesson3/boosting-descente-gradient-fonctionnelle.md) | Boosting comme descente de gradient en espace fonctionnel | panel | m2 | 1 | pending |
| [p5-l3-boosting-margins-weak-to-strong](part5/lesson3/boosting-margins-weak-to-strong.md) | Margins, structural risk minimization et théorème weak-to-strong | panel | m2 | 1 | pending |
| [p5-l4-lasso-oracle-irrepresentable](part5/lesson4/lasso-oracle-irrepresentable.md) | Lasso : inégalité oracle et condition irrepresentable | panel | m2 | 1 | pending |
| [p5-l4-lasso-bic-equivalence](part5/lesson4/lasso-bic-equivalence.md) | Lasso et BIC : la double pénalité et l'équivalence | panel | m2 | 2 | pending |
| [p5-lesson-lasso-haute-dimension](part5/lessons/lasso-haute-dimension.md) | Lasso en haute dimension (p ≫ n) : théorie complète | lesson | m2 | 2 | pending |
| [p5-lesson-boosting-weak-to-strong](part5/lessons/boosting-weak-to-strong.md) | Boosting : de l'apprenant faible à l'apprenant fort | lesson | m2 | 2 | pending |

## Part VI — Set-valued (3)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p6-l1-scoring-rules-propres](part6/lesson1/scoring-rules-propres.md) | Scoring rules propres : Brier, log score, et calibration | panel | m2 | 2 | pending |
| [p6-l2-couverture-conditionnelle-conformal](part6/lesson2/couverture-conditionnelle-conformal.md) | Couverture conditionnelle de la prédiction conformelle | panel | m2 | 2 | pending |
| [p6-l3-conformal-shift-aci](part6/lesson3/conformal-shift-aci.md) | Prédiction conformelle sous dérive : adaptive conformal inference | panel | research | 3 | pending |

## Part VII — Optimum de Bayes (4)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p7-l1-auc-statistique-rang-eta](part7/lesson1/auc-statistique-rang-eta.md) | AUC comme statistique de rang de η | panel | m2 | 2 | pending |
| [p7-l1-classification-selective-abstention](part7/lesson1/classification-selective-abstention.md) | Classification sélective et abstention | panel | m2 | 2 | pending |
| [p7-l2-lp-loss-quantile-regression](part7/lesson2/lp-loss-quantile-regression.md) | Lp-perte, quantiles conditionnels et régression quantile | panel | m2 | 2 | pending |
| [p7-l2-scoring-rules-regression-gneiting](part7/lesson2/scoring-rules-regression-gneiting.md) | Évaluer une prédiction : scoring rules propres en régression | panel | m2 | 2 | pending |

## Part VIII — Consistance (3)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p8-l1-lln-fort-erm-consistance-ps](part8/lesson1/lln-fort-erm-consistance-ps.md) | Loi forte des grands nombres et consistance presque sûre de l'ERM | panel | m2 | 1 | pending |
| [p8-l2-stone-theoreme-minimax](part8/lesson2/stone-theoreme-minimax.md) | Théorème de Stone en détail et borne minimax non paramétrique | panel | m2 | 1 | pending |
| [p8-lesson-taux-non-parametriques-minimax](part8/lessons/taux-non-parametriques-minimax.md) | Taux non paramétriques et minimax | lesson | m2 | 2 | pending |

## Part IX — Généralisation (6)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p9-l1-mc-diarmid-pac](part9/lesson1/mc-diarmid-pac.md) | Inégalité de McDiarmid et définition PAC | panel | m2 | 1 | pending |
| [p9-l2-convergence-uniforme-fonction-croissance](part9/lesson2/convergence-uniforme-fonction-croissance.md) | Convergence uniforme et fonction de croissance | panel | m2 | 2 | pending |
| [p9-l3-rademacher-complexity-vc](part9/lesson3/rademacher-complexity-vc.md) | Complexité de Rademacher : une complexité dépendante des données | panel | m2 | 2 | pending |
| [p9-l3-borne-marge-tsybakov](part9/lesson3/borne-marge-tsybakov.md) | Condition de marge de Tsybakov et taux de généralisation | panel | m2 | 2 | pending |
| [p9-l4-overfitting-benin-interpolation](part9/lesson4/overfitting-benin-interpolation.md) | Overfitting bénin et interpolation | panel | research | 3 | pending |
| [p9-lesson-ntk-generalisation-moderne](part9/lessons/ntk-generalisation-moderne.md) | Généralisation moderne : NTK et régularisation implicite | lesson | research | 3 | pending |

## Part X — Fonctions de perte (4)

| id | titre | type | level | prio | statut |
|---|---|---|---|---|---|
| [p10-l1-regret-substitution-bartlett](part10/lesson1/regret-substitution-bartlett.md) | Borne de regret de substitution (Bartlett) | panel | m2 | 1 | pending |
| [p10-l2-margin-condition-taux-calibration](part10/lesson2/margin-condition-taux-calibration.md) | Rôle de la condition de Tsybakov dans le taux de calibration | panel | m2 | 2 | pending |
| [p10-l2-calibration-cost-sensitive](part10/lesson2/calibration-cost-sensitive.md) | Calibration cost-sensitive (pertes asymétriques) | panel | m2 | 2 | pending |
| [p10-l3-decomposition-exces-risque](part10/lesson3/decomposition-exces-risque.md) | Décomposition de l'excès de risque et lien avec le biais-variance | panel | m2 | 2 | pending |
