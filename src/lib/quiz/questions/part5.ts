import type { QuizQuestion } from '../types.js';

export const PART5: QuizQuestion[] = [
	{
		id: 'p5-l1-q1',
		tags: ['p5/l1'],
		question:
			"D'après le théorème 5.1, que devient la variance de l'agrégation (moyenne de m prédicteurs à erreurs centrées et indépendantes) ?",
		options: [
			'elle est multipliée par m',
			'elle reste inchangée',
			'elle est divisée par m²',
			'elle est divisée par m'
		],
		answerIndex: 3,
		explanation:
			"Théorème 5.1 : sous l'indépendance, les termes croisés E[ε_j ε_k] (j ≠ k) s'annulent et il reste (1/m) E[ε²] : la variance est réduite d'un facteur m. Le callout « Remarque cruciale » rappelle que cela ne fonctionne que si les modèles font des erreurs complémentaires."
	},
	{
		id: 'p5-l1-q2',
		tags: ['p5/l1'],
		question:
			"L'exemple 5.1.1 considère m prédicteurs dont les erreurs ont une corrélation constante ρ : la variance agrégée vaut ρσ² + (1−ρ)σ²/m. Que se passe-t-il quand m tend vers l'infini ?",
		options: [
			'la variance tend vers 0',
			'la variance tend vers ρσ², quel que soit le nombre de modèles ajoutés',
			'la variance diverge',
			'la variance tend vers σ²'
		],
		answerIndex: 1,
		explanation:
			"Seul le second terme décroît en 1/m ; le premier terme ρσ² ne dépend pas de m : au-delà d'un certain point, ajouter des modèles n'apporte plus qu'un gain marginal. C'est donc la corrélation entre modèles, et non leur nombre, qui borne le gain possible — la motivation du bagging et des forêts aléatoires, qui cherchent à réduire activement ρ."
	},
	{
		id: 'p5-l1-q3',
		tags: ['p5/l1'],
		question:
			"Dans un échantillon bootstrap de taille n tiré avec remise dans les n points du jeu d'entraînement, quelle proportion des points originaux est en moyenne absente de l'échantillon ?",
		options: [
			'environ 1/e ≈ 36,8 %',
			'environ 1/2 = 50 %',
			'exactement 1/n',
			'aucune : avec n tirages, tous les points sont forcément présents'
		],
		answerIndex: 0,
		explanation:
			"Définition 5.5 et callout « Pourquoi 63.2 % ? » : la probabilité qu'un point ne soit pas sélectionné lors d'un tirage est 1 − 1/n ; après n tirages indépendants, (1 − 1/n)ⁿ → e^(−1) ≈ 0,368. Environ 36,8 % des points sont donc out-of-bag et environ 63,2 % sont présents au moins une fois."
	},
	{
		id: 'p5-l1-q4',
		tags: ['p5/l1'],
		question:
			"Selon le théorème 5.6 et le callout d'intuition qui l'accompagne, sur quel type de modèle de base le bagging est-il le plus utile ?",
		options: [
			'sur les modèles stables, déjà à faible variance (comme la régression linéaire)',
			'uniquement sur les modèles probabilistes qui sortent des distributions',
			'sur les modèles instables, dont les prédictions changent beaucoup avec de petites variations des données (arbres non élagués, réseaux de neurones)',
			'uniquement lorsque le modèle de base est convexe'
		],
		answerIndex: 2,
		explanation:
			"Le théorème 5.6 (variance baggée = σ²/M si les modèles sont décorrélés) est le plus utile pour les modèles instables : le bootstrap rend l'hypothèse d'indépendance approximativement vraie en entraînant chaque modèle sur un sous-échantillon différent. Un modèle déjà stable (régression linéaire), à variance faible, a en revanche essentiellement rien à gagner de l'agrégation."
	},
	{
		id: 'p5-l1-q5',
		tags: ['p5/l1'],
		question: "Quel est l'intérêt principal de l'erreur out-of-bag (OOB) (définition 5.7) ?",
		options: [
			'elle réentraîne chaque modèle sur les points manquants de son bootstrap',
			"elle fournit une estimation de l'erreur de généralisation sans ensemble de validation séparé",
			'elle remplace le bootstrap par un sous-échantillonnage aléatoire sans remise',
			"elle garantit que le biais de l'agrégat est nul"
		],
		answerIndex: 1,
		explanation:
			"Chaque exemple (x_i, y_i) est évalué uniquement par les modèles dont l'échantillon bootstrap ne contenait pas cet exemple (l'ensemble C_i), exactement comme s'il s'agissait d'un ensemble de test indépendant : une estimation non biaisée de la généralisation, sans avoir mis de côté la moindre donnée au départ."
	},
	{
		id: 'p5-l2-q1',
		tags: ['p5/l2'],
		question:
			"D'après le théorème 6.1, quelle est la variance asymptotique (M → ∞) de l'agrégat de M arbres dont la corrélation moyenne par paires est ρ̄ et la variance individuelle σ² ?",
		options: ['ρ̄σ²', '0', 'σ²', '(1−ρ̄)σ²/M'],
		answerIndex: 0,
		explanation:
			"Théorème 6.1 : Var(agrégé) = ρ̄σ² + (1−ρ̄)σ²/M ; quand M → ∞, le second terme s'annule et la variance reste bornée inférieurement par ρ̄σ², quel que soit le nombre d'arbres. C'est donc la corrélation, et non M, qui borne le gain — d'où l'intérêt de réduire ρ̄ directement."
	},
	{
		id: 'p5-l2-q2',
		tags: ['p5/l2'],
		question: 'Par rapport au bagging pur, que fait le Random Forest pour décorreler les arbres ?',
		options: [
			'il diminue la taille des échantillons bootstrap',
			'à chaque nœud, la division est choisie parmi un sous-ensemble aléatoire de m features plutôt que parmi toutes les d',
			'il remplace le vote majoritaire par un vote pondéré',
			"il augmente le nombre d'arbres"
		],
		answerIndex: 1,
		explanation:
			"Définition 6.3 (division optimale restreinte) : à chaque nœud, on tire un sous-ensemble aléatoire F_t de m features et on maximise le gain d'impureté uniquement sur ce sous-ensemble. Cette contrainte structurelle force les arbres à explorer des partitions différentes et réduit directement la corrélation ρ̄ ; le bagging pur (m = d) ne réduit que le terme (1−ρ̄)σ²/M."
	},
	{
		id: 'p5-l2-q3',
		tags: ['p5/l2'],
		question:
			'Selon les règles empiriques de la définition 6.4, quelle est la valeur typique de m (nombre de features par division) pour la classification ?',
		options: ['m ≈ d/3', 'm = d', 'm = 1', 'm = √d'],
		answerIndex: 3,
		explanation:
			'Définition 6.4 : m = √d pour la classification et m ≈ d/3 pour la régression. Ces valeurs offrent un compromis entre la qualité individuelle des divisions (m grand → biais faible) et la diversité entre arbres (m petit → corrélation ρ̄ faible).'
	},
	{
		id: 'p5-l2-q4',
		tags: ['p5/l2'],
		question:
			'Parmi d = 100 features, une seule (x_1) est fortement prédictive (exemple 6.4.1). Avec m = 10 (≈ √d), que se passe-t-il à chaque nœud ?',
		options: [
			'x_1 est choisie à chaque division, comme en bagging pur',
			'x_1 est exclue de tous les arbres',
			"x_1 est candidate avec une probabilité d'environ 10 % ; dans les autres nœuds, les arbres sont forcés de diviser sur des features bruitées, ce qui les décorrèle fortement",
			'la forêt converge vers un arbre unique'
		],
		answerIndex: 2,
		explanation:
			"Exemple 6.4.1 : avec m = √100 = 10, x_1 est vue par un nœud avec une probabilité de 10/100 ; dans les 90 % de nœuds restants, l'arbre divise sur les 99 features bruitées. Chaque arbre est individuellement plus faible, mais ρ̄ chute fortement : dans ce cas, le compromis biais/décorrélation du théorème 6.1 penche très en faveur d'un petit m."
	},
	{
		id: 'p5-l2-q5',
		tags: ['p5/l2'],
		question:
			"Pourquoi la leçon recommande-t-elle l'importance par permutation plutôt que la diminution moyenne de l'impureté (MDI) pour une sélection de features critique ?",
		options: [
			"parce qu'elle est beaucoup moins coûteuse à calculer",
			'parce que la MDI est biaisée en faveur des features à nombreuses modalités et des nœuds hauts, un artefact du critère de Gini',
			'parce que la permutation ne nécessite aucun ensemble de validation',
			"parce que la MDI utilise des informations non disponibles à l'entraînement"
		],
		answerIndex: 1,
		explanation:
			"Callout « Attention au biais » : l'importance par impureté surévalue systématiquement les features continues et celles avec de nombreuses modalités — un artefact du critère de Gini lui-même, pas une propriété des données. L'importance par permutation mesure la dégradation réelle de la performance quand la feature est détruite : plus honnête, mais coûteuse (P réévaluations par feature)."
	},
	{
		id: 'p5-l3-q1',
		tags: ['p5/l3'],
		question:
			"Dans AdaBoost, que devient le poids α_t d'un classifieur faible lorsque son erreur pondérée ε_t tend vers 0 ?",
		options: [
			'α_t tend vers 0',
			'α_t devient négatif',
			'α_t est fixé à 1',
			'α_t tend vers +∞ : le classifieur reçoit tout le poids'
		],
		answerIndex: 3,
		explanation:
			"α_t = (1/2) ln((1−ε_t)/ε_t) encode la fiabilité du classifieur : si ε_t → 0 alors α_t → +∞ (très fiable) ; si ε_t = 0,5 alors α_t = 0 (le modèle n'apporte rien, c'est le hasard) ; l'algorithme s'arrête dès que ε_t ≥ 1/2."
	},
	{
		id: 'p5-l3-q2',
		tags: ['p5/l3'],
		question:
			"Dans la mise à jour des poids d'AdaBoost, un exemple correctement classé par h_t voit son poids multiplié par le facteur exp(−α_t) < 1. Que signifie cela ?",
		options: [
			'son poids diminue, si bien que les classifieurs faibles suivants se concentrent davantage sur les exemples mal classés',
			"l'exemple est ignoré par la suite par tous les classifieurs",
			'son étiquette est inversée',
			"l'algorithme s'arrête"
		],
		answerIndex: 0,
		explanation:
			"Section « Mise à jour adaptative des poids » : si la prédiction est correcte, le facteur est exp(−α_t) < 1 (le poids diminue) ; si elle est incorrecte, il est exp(+α_t) > 1 (le poids augmente). C'est ce mécanisme de rétroaction qui rend l'algorithme adaptatif : à chaque itération, il se concentre sur les exemples « difficiles »."
	},
	{
		id: 'p5-l3-q3',
		tags: ['p5/l3'],
		question:
			"Selon le théorème 7.1, pourquoi l'erreur d'entraînement d'AdaBoost décroît-elle exponentiellement tant que chaque classifieur faible vérifie ε_t < 1/2 ?",
		options: [
			'parce que la perte exponentielle est bornée par 1',
			"parce que le nombre d'exemples n augmente",
			"parce que Z_t < 1 et que l'erreur d'entraînement est bornée par le produit des facteurs Z_t",
			'parce que la marge géométrique devient infinie'
		],
		answerIndex: 2,
		explanation:
			"Théorème 7.1 : l'erreur d'entraînement du classifieur final est bornée par Π Z_t ; aussi longtemps que ε_t < 1/2, on a Z_t < 1, et le produit décroît exponentiellement avec le nombre d'itérations. C'est ce qui justifie qu'il suffit d'apprenants faibles, légèrement meilleurs que le hasard (erreur < 50 %), pour construire un apprenant fort."
	},
	{
		id: 'p5-l3-q4',
		tags: ['p5/l3'],
		question:
			'Quelle affirmation distingue correctement AdaBoost du gradient boosting, selon la section « Points de divergence » ?',
		options: [
			'AdaBoost entraîne ses modèles en parallèle, le GBM en séquentiel',
			"AdaBoost repère les exemples tandis que le GBM ajuste des pseudo-résidus ; AdaBoost minimise une perte exponentielle fixe, le GBM accepte n'importe quelle perte différentiable",
			'AdaBoost est plus robuste au bruit, car sa pénalité exponentielle est douce',
			"Le GBM ne fonctionne qu'avec la perte quadratique"
		],
		answerIndex: 1,
		explanation:
			"AdaBoost change la distribution de données (poids w_i), le GBM change l'objectif à prédire (résidus). AdaBoost minimise une perte exponentielle fixe — très sévère face aux outliers, un point bruité voit son poids exploser — tandis que le GBM accepte n'importe quelle perte différentiable et est plus robuste avec un taux d'apprentissage η faible."
	},
	{
		id: 'p5-l3-q5',
		tags: ['p5/l3'],
		question:
			'Quelle est la différence entre la marge fonctionnelle (définition 7.2) et la marge géométrique (définition 7.3) ?',
		options: [
			'aucune : les deux grandeurs sont identiques',
			'la marge fonctionnelle est toujours négative',
			"la marge géométrique n'est utilisée que pour la régression",
			"la marge géométrique normalise la marge fonctionnelle par la somme Σ|α_t|, la rendant indépendante de l'échelle des poids, comme pour les SVM"
		],
		answerIndex: 3,
		explanation:
			"Définition 7.3 : la marge géométrique m̄_i = Y_i F(X_i) / Σ|α_t| divise la marge fonctionnelle par le poids total des classifieurs ; dans ce cadre, Σ|α_t| joue le rôle de la norme du vecteur de paramètres. Elle mesure la distance réelle d'un point à la frontière de décision, indépendamment de l'échelle des α_t — par analogie avec les SVM."
	},
	{
		id: 'p5-l4-q1',
		tags: ['p5/l4'],
		question:
			'Pourquoi la solution Ridge reste-t-elle définie même si X transpose X est singulière ?',
		options: [
			'Parce que la norme L1 crée des zéros exacts',
			'Parce que lambda I rend la matrice régularisée inversible',
			'Parce que la validation croisée élimine les colonnes redondantes',
			'Parce que Ridge standardise automatiquement les variables'
		],
		answerIndex: 1,
		explanation:
			'La leçon précise que le terme lambda I garantit que la matrice à inverser est définie positive. La formule fermée reste donc valable même quand p dépasse n.'
	},
	{
		id: 'p5-l4-q2',
		tags: ['p5/l4'],
		question:
			'Dans le cas de colonnes orthonormales, si le coefficient OLS vaut 0.8 et lambda vaut 1.0, la solution Lasso vaut :',
		options: ['1.8', '0.8', '0', '-0.2'],
		answerIndex: 2,
		explanation:
			'Le soft-thresholding calcule max(0.8 − 1.0, 0), donc 0. Le coefficient passe exactement à zéro, ce qui réalise une sélection de variables.'
	},
	{
		id: 'p5-l4-q3',
		tags: ['p5/l4'],
		question: "Dans l'objectif Elastic Net, alpha = 0 correspond à :",
		options: ['Lasso pur', 'Sans régularisation', 'Une perte 0-1', 'Ridge pur'],
		answerIndex: 3,
		explanation:
			'La leçon indique que alpha = 1 donne le Lasso pur et alpha = 0 donne le Ridge pur.'
	},
	{
		id: 'p5-l4-q4',
		tags: ['p5/l4'],
		question:
			'Sous une descente de gradient simple, le weight decay L2 multiplie le poids courant par :',
		options: ['(1 - eta lambda)', '(1 + eta lambda)', 'eta lambda', 'lambda / 2'],
		answerIndex: 0,
		explanation:
			"La définition 8.6 décrit une érosion multiplicative par (1 - eta lambda) avant l'application du gradient de la tâche."
	},
	{
		id: 'p5-syn-q1',
		tags: ['p5/synthese'],
		question: "Quel est l'objectif principal du Bagging (Bootstrap Aggregating) ?",
		options: [
			'Réduire le biais du modèle',
			"Réduire la variance de l'estimateur",
			'Éliminer totalement le bruit des données',
			"Accélérer le temps d'entraînement"
		],
		answerIndex: 1,
		explanation:
			'Le Bagging réduit la variance en moyennant plusieurs modèles entraînés sur des échantillons bootstrap, sans affecter significativement le biais.'
	},
	{
		id: 'p5-syn-q2',
		tags: ['p5/synthese'],
		question:
			'Dans une forêt aléatoire, pourquoi sélectionne-t-on un sous-ensemble de variables (mtry) à chaque nœud ?',
		options: [
			'Pour réduire la complexité computationnelle uniquement',
			'Pour forcer les arbres à être identiques',
			'Pour décorréler les arbres et réduire la variance globale',
			'Pour augmenter le biais de chaque arbre'
		],
		answerIndex: 2,
		explanation:
			'En limitant les variables disponibles, on évite que tous les arbres ne fassent la même division dominante, ce qui réduit la corrélation entre eux.'
	},
	{
		id: 'p5-syn-q3',
		tags: ['p5/synthese'],
		question:
			"Quelle est la probabilité asymptotique (N → ∞) qu'une observation ne figure pas dans un échantillon Bootstrap ?",
		options: ['0.5', '0.632', '1/e (environ 0.368)', '0.25'],
		answerIndex: 2,
		explanation:
			"La probabilité d'exclusion tend vers (1 - 1/N)^N, ce qui converge vers e⁻¹ ≈ 0.368."
	},
	{
		id: 'p5-syn-q4',
		tags: ['p5/synthese'],
		question: "Qu'est-ce que l'erreur Out-of-Bag (OOB) ?",
		options: [
			"L'erreur mesurée sur le jeu de test final",
			"L'erreur calculée en utilisant uniquement les arbres qui n'ont pas vu l'exemple concerné",
			"La différence entre l'erreur d'entraînement et l'erreur de test",
			"L'erreur commise sur les variables exclues"
		],
		answerIndex: 1,
		explanation:
			"L'erreur OOB est une estimation honnête de la généralisation car chaque point est prédit par des arbres entraînés sans lui."
	},
	{
		id: 'p5-syn-q5',
		tags: ['p5/synthese'],
		question: 'Comment AdaBoost ajuste-t-il les poids des exemples entre deux itérations ?',
		options: [
			'Il donne plus de poids aux exemples faciles',
			'Il distribue les poids uniformément',
			'Il augmente le poids des exemples mal classés',
			'Il diminue le poids des exemples les plus bruités'
		],
		answerIndex: 2,
		explanation:
			'AdaBoost force le modèle suivant à se concentrer sur les erreurs du précédent en augmentant le poids des exemples mal classés.'
	},
	{
		id: 'p5-syn-q6',
		tags: ['p5/synthese'],
		question: "Le Gradient Boosting (GBDT) diffère d'AdaBoost principalement par :",
		options: [
			"L'utilisation de modèles parallèles",
			"L'optimisation d'une fonction de perte via des pseudo-résidus (gradients)",
			"L'absence de taux d'apprentissage",
			"L'utilisation exclusive de modèles très profonds"
		],
		answerIndex: 1,
		explanation:
			'GBDT généralise le boosting en ajustant chaque nouveau modèle pour suivre la direction négative du gradient de la perte.'
	},
	{
		id: 'p5-syn-q7',
		tags: ['p5/synthese'],
		question:
			"Quel est l'effet du 'shrinkage' (taux d'apprentissage η < 1) dans le Gradient Boosting ?",
		options: [
			'Il accélère la convergence',
			"Il réduit le besoin en nombre d'arbres",
			"Il ralentit l'apprentissage pour améliorer la généralisation",
			'Il élimine le besoin de pseudo-résidus'
		],
		answerIndex: 2,
		explanation:
			'Le shrinkage réduit la contribution de chaque arbre, forçant le modèle à apprendre plus lentement et plus robustement.'
	},
	{
		id: 'p5-syn-q8',
		tags: ['p5/synthese'],
		question:
			"Dans la régularisation Ridge (L2), quel est l'effet sur les coefficients colinéaires ?",
		options: [
			"Il en annule un et garde l'autre",
			'Il les partage équitablement',
			'Il les rend tous nuls',
			'Il augmente leur valeur'
		],
		answerIndex: 1,
		explanation:
			"Ridge distribue les poids entre les variables corrélées, contrairement au Lasso qui a tendance à n'en choisir qu'une."
	},
	{
		id: 'p5-syn-q9',
		tags: ['p5/synthese'],
		question:
			'Quelle propriété fondamentale du Lasso (L1) le rend utile pour la sélection de variables ?',
		options: [
			'Il rend la fonction objective strictement convexe',
			'Il produit des solutions creuses (certains coefficients sont strictement nuls)',
			'Il garantit que tous les coefficients sont identiques',
			'Il élimine le besoin de standardisation'
		],
		answerIndex: 1,
		explanation:
			'La forme en losange de la contrainte L1 favorise les solutions où les coins (axes) sont touchés, annulant ainsi certains poids.'
	},
	{
		id: 'p5-syn-q10',
		tags: ['p5/synthese'],
		question: "L'Elastic Net est une combinaison de Ridge et Lasso. Pourquoi l'utiliser ?",
		options: [
			'Pour combiner la sélection de variables (L1) et la stabilité face aux corrélations (L2)',
			"Parce qu'il est beaucoup plus rapide à calculer que Ridge",
			"Parce qu'il ne nécessite pas de hyperparamètre lambda"
		],
		answerIndex: 0,
		explanation:
			"L'Elastic Net offre le meilleur des deux mondes : la sparsité du Lasso et l'effet de groupe du Ridge."
	},
	{
		id: 'p5-syn-q11',
		tags: ['p5/synthese'],
		question:
			'Pourquoi est-il indispensable de standardiser les données avant un Lasso ou un Ridge ?',
		options: [
			'Pour rendre les données gaussiennes',
			"Pour éviter que l'échelle d'une variable n'influence disproportionnément sa pénalité",
			'Pour supprimer les valeurs aberrantes',
			'Pour transformer les variables catégorielles en numériques'
		],
		answerIndex: 1,
		explanation:
			"Comme la pénalité s'applique uniformément aux coefficients, une variable avec une petite échelle aura un coefficient naturellement grand, et sera donc plus pénalisée."
	},
	{
		id: 'p5-syn-q12',
		tags: ['p5/synthese'],
		question:
			"Selon le compromis biais-variance, que se passe-t-il quand on augmente la complexité d'un modèle ?",
		options: [
			'Le biais augmente et la variance diminue',
			'Le biais diminue et la variance augmente',
			'Les deux augmentent',
			'Les deux diminuent'
		],
		answerIndex: 1,
		explanation:
			"Un modèle plus complexe s'ajuste mieux aux données (moins de biais) mais devient plus sensible aux fluctuations (plus de variance)."
	},
	{
		id: 'p5-syn-q13',
		tags: ['p5/synthese'],
		question: "Quel est l'impact d'un nombre d'arbres M très élevé dans une Forêt Aléatoire ?",
		options: [
			'Le modèle finit par surapprendre (overfitting)',
			"L'erreur de généralisation converge vers une limite stable",
			'La variance du modèle augmente indéfiniment',
			'Le biais du modèle augmente proportionnellement'
		],
		answerIndex: 1,
		explanation:
			"Contrairement au Boosting, augmenter M dans une Random Forest ne cause pas d'overfitting ; cela stabilise simplement la prédiction."
	},
	{
		id: 'p5-syn-q14',
		tags: ['p5/synthese'],
		question:
			"Dans le Gradient Boosting, quelle valeur constante est utilisée pour initialiser F₀ lors d'une perte L2 ?",
		options: [
			'Le zéro',
			'La médiane des cibles',
			'La moyenne des cibles',
			'La valeur la plus fréquente'
		],
		answerIndex: 2,
		explanation:
			"Pour la perte quadratique, la constante qui minimise l'erreur globale est la moyenne empirique."
	},
	{
		id: 'p5-syn-q15',
		tags: ['p5/synthese'],
		question:
			'Quelle est la différence majeure entre le vote dur et le vote doux dans un ensemble de classifieurs ?',
		options: [
			'Le vote dur est plus lent',
			'Le vote doux utilise les probabilités de confiance, le vote dur utilise uniquement la classe finale',
			'Le vote doux ne fonctionne que pour le Boosting',
			"Il n'y a aucune différence en pratique"
		],
		answerIndex: 1,
		explanation:
			'Le vote doux pondère les décisions par la confiance du modèle, ce qui est généralement plus performant.'
	}
];
