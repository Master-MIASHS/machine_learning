import type { QuizQuestion } from '../types.js';

export const PART5: QuizQuestion[] = [
	{
		id: 'p5-l1-q1',
		tags: ['p5/l1'],
		question: "D'après la leçon, de quoi est constitué le prédicteur Top-K bayésien S*(x) ?",
		options: [
			'Les K classes ayant les plus grands scores estimés p_c(x) produits par le modèle.',
			'Les K classes ayant les plus grandes probabilités conditionnelles vraies η_c(x).',
			'Les K classes ayant les plus grandes probabilités a priori P(Y = c).',
			'Les K classes ayant la plus grande incertitude a posteriori au point x.'
		],
		answerIndex: 1,
		explanation:
			"Le meilleur ensemble de taille K fixe maximise la masse de probabilité captée Σ_{c∈S} η_c(x) : c'est exactement les K classes les plus probables au sens de la vérité η(x) — et non de son estimation p(x) (section « Le risque Top-K bayésien »)."
	},
	{
		id: 'p5-l1-q2',
		tags: ['p5/l1'],
		question:
			'Exemple numérique de la leçon : avec 5 classes et η(x) = (0.50, 0.25, 0.15, 0.07, 0.03), quel est le risque bayésien Top-3 en ce point x ?',
		options: ['0.05', '0.15', '0.10', '0.25'],
		answerIndex: 2,
		explanation:
			'Le risque ponctuel vaut 1 - (0.50 + 0.25 + 0.15) = 0.10. La masse restante 0.07 + 0.03 est irréductiblement hors du Top-3 en ce point, quel que soit le modèle utilisé.'
	},
	{
		id: 'p5-l1-q3',
		tags: ['p5/l1'],
		question: "D'après la leçon, que fait le Temperature Scaling avec T > 1 ?",
		options: [
			'Il aplatit la distribution des scores, rendant le modèle moins confiant, sans modifier le classement des classes.',
			'Il resserre la distribution et rend le modèle plus confiant.',
			"Il modifie le classement des classes et donc l'ensemble Top-K.",
			"Il garantit la diminution de l'ECE pour tout modèle initial."
		],
		answerIndex: 0,
		explanation:
			"Avec T > 1 la distribution softmax s'aplatit (moins de confiance), avec T < 1 elle se resserre ; comme le rééchelonnage est une fonction strictement croissante des logits, le classement — et donc le prédicteur Top-K — est inchangé, seul le choix de K par seuillage est affecté (section « Calibration de la confiance »)."
	},
	{
		id: 'p5-l1-q4',
		tags: ['p5/l1'],
		question:
			'La règle K* = plus petit K tel que Acc@K ≥ tau (seuil de précision cible) a quel statut, selon la leçon ?',
		options: [
			'Elle est décision-théoriquement optimale, car elle adapte K à chaque point x.',
			'Elle garantit la couverture tau en chaque point x, individuellement.',
			'Elle nécessite de connaître les probabilités vraies η(x) pour être calculée.',
			"Elle fixe un K global pour tout l'espace, approximation grossière de la règle pointwise optimale K(x)."
		],
		answerIndex: 3,
		explanation:
			"Le cartouche d'avertissement « Un K global n'est pas optimal point par point » précise qu'un K unique est une approximation commode mais sous-optimale de la règle locale K(x) — plus petite valeur telle que la masse cumulative de η soit ≥ tau — idée que la prédiction conformelle formalisera sans connaître η."
	},
	{
		id: 'p5-l1-q5',
		tags: ['p5/l1'],
		question:
			"Pourquoi choisir K par seuillage de la masse cumulative exige un modèle calibré, alors qu'un K fixé ne l'exige pas ?",
		options: [
			'Parce que le risque Top-K bayésien dépend des valeurs exactes de η.',
			'Parce que le K fixé ne dépend que du classement des classes, tandis que le seuillage dépend des valeurs des scores.',
			"Parce que l'ECE doit être strictement nulle pour utiliser un seuil quelconque.",
			"Parce que le classement estimé p(x) n'est jamais celui de la vérité η(x)."
		],
		answerIndex: 1,
		explanation:
			'La leçon opère la séparation nette : S*(x) = Top_K(η(x)) ne dépend que du classement des η_c(x), pas de leurs valeurs ; mais dès que K est choisi par seuil de masse, les valeurs de p(x) comptent et doivent approcher η_c(x) elles-mêmes, pas seulement leur rang.'
	},
	{
		id: 'p5-l2-q1',
		tags: ['p5/l2'],
		question:
			'Sur quoi repose, selon la leçon, la garantie de couverture marginale P(Y ∈ C(X)) ≥ 1 - alpha de la prédiction conformelle scindée ?',
		options: [
			'Sur le fait que le modèle p(x) soit bien calibré en valeur.',
			'Sur le fait que les scores de non-conformité soient presque sûrement distincts.',
			"Sur le fait que l'ensemble de calibration soit strictement plus grand que l'ensemble d'entraînement.",
			"Sur l'échangeabilité des données (X_1, Y_1), ..., (X_n, Y_n), (X, Y), hypothèse plus faible que i.i.d."
		],
		answerIndex: 3,
		explanation:
			"La garantie est exacte en échantillon fini et model-free : elle ne repose sur aucune hypothèse sur la forme du classificateur, seulement sur l'échangeabilité des données — les données i.i.d. étant toujours échangeables (section « Garantie de couverture »)."
	},
	{
		id: 'p5-l2-q2',
		tags: ['p5/l2'],
		question:
			'La garantie de couverture est marginale, et non conditionnelle. Quelle est la conséquence directe soulignée par la leçon ?',
		options: [
			"L'ensemble de prédiction sous- couvre en chaque point x de l'espace d'entrée.",
			'La garantie est automatiquement violée dès que le modèle est mal calibré.',
			"Un ensemble peut respecter la couverture moyenne 1 - alpha tout en sous-couvrant fortement dans certaines régions de l'espace.",
			'La couverture est exactement égale à 1 - alpha en chaque point x.'
		],
		answerIndex: 2,
		explanation:
			"La probabilité est prise sur le tirage conjoint de (X, Y) : c'est une garantie moyenne sur toute la population de x. La garantie conditionnelle P(Y ∈ C(X) | X = x) ≥ 1 - alpha n'est pas fournie et ne peut en général pas être obtenue de façon distribution-free (la leçon cite Barber et al., 2021, dans la Définition 10.1)."
	},
	{
		id: 'p5-l2-q3',
		tags: ['p5/l2'],
		question:
			"Selon la section « Le prédicteur oracle et le dual du Top-K », quelle est la dualité entre le Top-K et l'ensemble conforme oracle ?",
		options: [
			'Le Top-K fixe la couverture et maximise la taille ; le conforme fixe la taille et minimise la masse capturée.',
			"Le Top-K fixe la taille K et maximise la masse capturée ; l'ensemble conforme oracle fixe la masse cible 1 - alpha et minimise la taille.",
			'Les deux problèmes fixent la taille K et ne diffèrent que par le score utilisé.',
			"Le Top-K fixe la masse cible et minimise la taille ; l'ensemble conforme oracle fixe la taille et maximise la masse."
		],
		answerIndex: 1,
		explanation:
			'Les deux problèmes sont duaux : on fixe soit la taille K (Top-K), soit la couverture 1 - alpha (conforme oracle) ; dans les deux cas la solution est un ensemble de niveau de η(x) — seule la contrainte active change.'
	},
	{
		id: 'p5-l2-q4',
		tags: ['p5/l2'],
		question:
			'Pourquoi la garantie de couverture tient-elle quel que soit le modèle p(x), même médiocre ou aléatoire ?',
		options: [
			'Parce que le quantile empirique converge toujours vers le quantile vrai de η.',
			'Parce que le score de rang est invariant à la miscalibration près.',
			'Parce que la garantie est conditionnelle à X, qui ne dépend pas du modèle.',
			"Parce que la qualité de p(x) n'affecte que la taille des ensembles (l'efficacité), pas la validité de la garantie."
		],
		answerIndex: 3,
		explanation:
			"Le cartouche « Validité contre efficacité » est explicite : la garantie ne dépend que de l'échangeabilité des scores, pas de la qualité de p(x) ; un modèle mal calibré reste valide sous conformalisation mais produit des ensembles inutilement larges."
	},
	{
		id: 'p5-l2-q5',
		tags: ['p5/l2'],
		question:
			'Que se passe-t-il si on choisit alpha = 0.01 au lieu de alpha = 0.1, selon la section « Le seuil quantile » ?',
		options: [
			"La garantie est plus forte (99 %) mais au prix d'ensembles souvent triviaux.",
			'La garantie est la même mais les ensembles sont toujours plus petits.',
			'La garantie est de 99 % et les ensembles sont garantis réduits à une seule classe.',
			"La garantie n'est plus valable qu'asymptotiquement, quand n est grand."
		],
		answerIndex: 0,
		explanation:
			"Le niveau alpha contrôle le compromis : alpha = 0.1 garantit une couverture d'au moins 90 % avec des ensembles plus larges ; un alpha plus petit (0.01) fournit une garantie plus forte (99 %) mais au prix d'ensembles souvent triviaux."
	},
	{
		id: 'p5-l3-q1',
		tags: ['p5/l3'],
		question:
			"Pour les intervalles de largeur constante, quel est le score de non-conformité et quelle est la forme de l'ensemble de prédiction ?",
		options: [
			'Score |y - f(x)| / (sigma(x) + epsilon) : intervalle de largeur variable selon x.',
			'Score |y - f(x)| : intervalle [f(x) - q, f(x) + q] de largeur identique en tout point de prédiction.',
			'Score f(x) - y : intervalle asymétrique centré en zéro.',
			'Score 1 - p_y(x) : ensemble de cardinalité variable.'
		],
		answerIndex: 1,
		explanation:
			"Le score est la valeur absolue du résidu ; le quantile q des résidus absolus sur l'ensemble de calibration donne un intervalle symétrique centré sur la prédiction du modèle, avec la même « marge d'erreur » pour tous les points, indépendamment de x (section « Intervalles de largeur constante »)."
	},
	{
		id: 'p5-l3-q2',
		tags: ['p5/l3'],
		question:
			"Selon la leçon, quand l'intervalle constant est-il une bonne approximation de l'ensemble oracle (région de densité maximale) ?",
		options: [
			'Quand le modèle est suffisamment complexe, quelle que soit la structure des erreurs.',
			'Quand la densité de Y sachant X est multimodale.',
			"Quand l'ensemble de calibration est petit, car le quantile q est alors plus robuste.",
			"Quand la largeur oracle ne dépend pas de x, c'est-à-dire sous homoscédasticité."
		],
		answerIndex: 3,
		explanation:
			"Le cartouche d'avertissement « Ce que l'oracle révèle sur l'intervalle constant » est explicite : dès que la largeur de la région de densité maximale varie avec x, l'intervalle constant est nécessairement trop large à certains endroits et trop étroit à d'autres — il n'approxime l'oracle que si la largeur ne dépend pas de x, précisément la condition d'homoscédasticité."
	},
	{
		id: 'p5-l3-q3',
		tags: ['p5/l3'],
		question:
			'En régression quantile conforme (CQR), pourquoi corrige-t-on la paire de quantiles appris par une calibration conforme ?',
		options: [
			"Parce que rien ne garantit, en échantillon fini, que les quantiles appris couvrent exactement 1 - alpha ; l'étape conforme mesure cette erreur de calibration et la corrige par un décalage uniforme Q.",
			"Parce que la régression quantile n'est pas un problème convexe et ne peut pas être optimisée.",
			"Parce que l'étape conforme augmente la largeur moyenne afin de rendre la méthode robuste.",
			'Parce que les quantiles appris sont biaisés vers la moyenne conditionnelle.'
		],
		answerIndex: 0,
		explanation:
			"Le cartouche « Pourquoi corriger une régression quantile déjà entraînée ? » explique que les quantiles estimés sont eux-mêmes des approximations : l'étape de calibration mesure l'écart sur des données indépendantes et le corrige par un décalage uniforme Q, combinant la forme adaptative de la régression quantile et la garantie exacte de la prédiction conforme, quelle que soit la qualité des quantiles."
	},
	{
		id: 'p5-l3-q4',
		tags: ['p5/l3'],
		question:
			'En CQR, le score s(x, y) = max(q_lo(x) - y, y - q_hi(x)) est de quel signe, et que mesure-t-il ?',
		options: [
			"Toujours positif, il mesure la distance au bord le plus proche de l'intervalle.",
			"Positif quand y est hors de l'intervalle estimé (dépassement), négatif quand y est à l'intérieur (marge restante).",
			"Négatif quand y est hors de l'intervalle estimé, positif quand y est à l'intérieur.",
			"Il mesure l'incertitude locale sigma(x) du modèle."
		],
		answerIndex: 1,
		explanation:
			"La leçon définit un score signé de dépassement : positif et mesurant le dépassement si y tombe hors de l'intervalle [q_lo(x), q_hi(x)], négatif et mesurant la marge restante s'il tombe à l'intérieur (section « Régression quantile conforme (CQR) »)."
	},
	{
		id: 'p5-l3-q5',
		tags: ['p5/l3'],
		question:
			"Une méthode respecte la couverture empirique 1 - alpha sur l'ensemble de test, mais la couverture échoue systématiquement dans une région de l'espace d'entrée. Quel indicateur d'évaluation détecte ce problème ?",
		options: [
			'La largeur moyenne des intervalles.',
			'Le taux de couverture empirique.',
			"L'efficacité conditionnelle, qui vérifie l'homogénéité de la couverture à travers les régions de l'espace d'entrée.",
			"Le quantile conforme Q calculé sur l'ensemble de calibration."
		],
		answerIndex: 2,
		explanation:
			"La section « Évaluation des intervalles de prédiction » définit l'efficacité conditionnelle comme la vérification que la couverture ne dépend pas excessivement des valeurs de X : c'est l'indicateur subtil qui détecte les échecs locaux que la couverture marginale — celle garantie par le théorème — ne peut pas voir."
	},
	{
		id: 'p5-syn-q1',
		tags: ['p5/synthese'],
		question: 'Quel est le prédicteur Top-K bayésien S*(x) pour un point x ?',
		options: [
			"L'ensemble des K classes ayant les plus grands scores estimés p(x)",
			"L'ensemble des K classes ayant les plus grandes probabilités conditionnelles vraies η(x)",
			"L'ensemble des K classes ayant les probabilités a priori les plus élevées",
			"L'ensemble des classes dont la probabilité dépasse un seuil fixe"
		],
		answerIndex: 1,
		explanation:
			'Le prédicteur Top-K bayésien maximise la masse de probabilité captée en choisissant les K classes les plus probables au sens de la vérité η(x).'
	},
	{
		id: 'p5-syn-q2',
		tags: ['p5/synthese'],
		question: 'Quelle est la propriété de la courbe K ↦ Acc@K ?',
		options: [
			'Elle est monotone décroissante',
			'Elle est constante',
			'Elle est monotone croissante',
			'Elle suit une courbe en U'
		],
		answerIndex: 2,
		explanation:
			"Comme les ensembles Top-K sont emboîtés (Top-K ⊆ Top-K+1), l'exactitude ne peut que croître ou rester stable lorsque K augmente."
	},
	{
		id: 'p5-syn-q3',
		tags: ['p5/synthese'],
		question: "Quel est l'effet du Temperature Scaling sur le prédicteur Top-K pour un K fixé ?",
		options: [
			"Il modifie le classement des classes et donc l'ensemble Top-K",
			"Il ne modifie pas le classement des classes, donc l'ensemble Top-K reste inchangé",
			'Il rend le modèle systématiquement plus confiant',
			"Il annule l'exactitude Top-1"
		],
		answerIndex: 1,
		explanation:
			'Le Temperature Scaling est une fonction strictement croissante des logits ; il modifie les valeurs des probabilités (calibration) mais préserve rigoureusement leur ordre.'
	},
	{
		id: 'p5-syn-q4',
		tags: ['p5/synthese'],
		question:
			'Pourquoi le choix de K par seuillage de la masse cumulative exige-t-il un modèle calibré ?',
		options: [
			'Parce que le classement des classes ne suffit plus, les valeurs exactes des scores comptent',
			'Parce que le risque bayésien dépend uniquement des rangs',
			"Parce que l'ECE doit être nulle pour tout seuil",
			'Parce que le modèle doit être linéaire'
		],
		answerIndex: 0,
		explanation:
			'Pour un K fixé, seul le classement compte. Mais pour choisir K tel que Σ p_c ≥ τ, on a besoin que p_c soit une bonne approximation de η_c.'
	},
	{
		id: 'p5-syn-q5',
		tags: ['p5/synthese'],
		question:
			"Quel est le gain marginal de risque lorsque l'on passe d'un ensemble Top-(K-1) à un ensemble Top-K ?",
		options: [
			"L'espérance de la probabilité de la K-ième classe la plus probable, E[η_(K)(X)]",
			"L'exactitude Top-1",
			'La variance du modèle',
			"Il n'y a pas de gain systématique"
		],
		answerIndex: 0,
		explanation:
			'Le gain marginal est précisément la probabilité moyenne de la K-ième classe la plus vraisemblable : R_{K-1}* - R_K* = E[η_{(K)}(X)].'
	},
	{
		id: 'p5-syn-q6',
		tags: ['p5/synthese'],
		question:
			'Sur quelle hypothèse fondamentale repose la garantie de couverture de la prédiction conformelle ?',
		options: [
			"L'indépendance et l'identité de distribution (i.i.d.) stricte",
			"L'échangeabilité des données",
			'La normalité des résidus',
			'La convexité de la fonction de perte'
		],
		answerIndex: 1,
		explanation:
			"La garantie repose sur l'échangeabilité, une hypothèse plus faible que i.i.d. (les données i.i.d. sont toujours échangeables)."
	},
	{
		id: 'p5-syn-q7',
		tags: ['p5/synthese'],
		question: 'Quelle est la différence entre couverture marginale et couverture conditionnelle ?',
		options: [
			'La couverture marginale est plus forte que la conditionnelle',
			'La couverture conditionnelle est garantie par le théorème de base du Split Conformal',
			'La couverture marginale est une moyenne globale, tandis que la conditionnelle doit tenir pour chaque x',
			"Il n'y a aucune différence mathématique"
		],
		answerIndex: 2,
		explanation:
			'La garantie conformelle est marginale : elle assure que la moyenne de la couverture sur toute la population est ≥ 1-α, mais ne garantit pas la couverture point par point.'
	},
	{
		id: 'p5-syn-q8',
		tags: ['p5/synthese'],
		question:
			'Sous quelle condition la borne supérieure de couverture (1 - α + 1/(n+1)) est-elle exacte ?',
		options: [
			'Quand le modèle est parfaitement calibré',
			"Quand les scores de non-conformité sont presque sûrement distincts (pas d'égalités)",
			"Quand l'ensemble de calibration est infini",
			'Quand on utilise le score de rang'
		],
		answerIndex: 1,
		explanation:
			'Si les scores sont distincts, les rangs sont uniformément distribués sur {1, ..., n+1}, et la probabilité de couverture devient exactement (ceil((n+1)(1-α)))/(n+1).'
	},
	{
		id: 'p5-syn-q9',
		tags: ['p5/synthese'],
		question: "Quel est le lien de dualité entre le Top-K et l'ensemble conforme oracle ?",
		options: [
			"Le Top-K fixe la couverture et maximise la taille ; l'oracle fixe la taille et minimise la masse",
			"Le Top-K fixe la taille K et maximise la masse ; l'oracle fixe la couverture 1-α et minimise la taille",
			'Ils sont identiques pour tout modèle calibré',
			"L'un traite la classification, l'autre la régression"
		],
		answerIndex: 1,
		explanation:
			"Les deux sont des ensembles de niveau de η(x). Le Top-K maximise la masse pour une taille fixée, l'oracle minimise la taille pour une masse fixée."
	},
	{
		id: 'p5-syn-q10',
		tags: ['p5/synthese'],
		question:
			"Dans la prédiction conformelle, quel est l'impact d'un modèle p(x) très médiocre sur la garantie de couverture ?",
		options: [
			'La garantie de couverture est violée',
			'La garantie reste valide, mais les ensembles de prédiction deviennent inutilement larges',
			'Le modèle devient automatiquement calibré',
			'La couverture devient conditionnelle'
		],
		answerIndex: 1,
		explanation:
			"La validité est model-free. La qualité du modèle n'affecte que l'efficacité (la taille des ensembles), pas la validité de la garantie."
	},
	{
		id: 'p5-syn-q11',
		tags: ['p5/synthese'],
		question:
			"Comment le score APS (Adaptive Prediction Sets) s'adapte-t-il différemment du score de rang ?",
		options: [
			'Il ignore les probabilités pour ne garder que le rang',
			"Il utilise la masse cumulative des probabilités pour ajuster la taille de l'ensemble à la distribution",
			"Il fixe la taille de l'ensemble indépendamment des données",
			'Il ne fonctionne que pour le Top-1'
		],
		answerIndex: 1,
		explanation:
			'Le score APS utilise le complément de la somme des probabilités des classes au moins aussi probables que la vraie classe, permettant une adaptation fine à la forme de la distribution.'
	},
	{
		id: 'p5-syn-q12',
		tags: ['p5/synthese'],
		question: "Que se passe-t-il si l'ensemble de calibration est trop petit (n < 1/α - 1) ?",
		options: [
			'La garantie de couverture est annulée',
			"L'ensemble de prédiction devient systématiquement vide",
			"L'ensemble de prédiction devient systématiquement l'ensemble de toutes les classes",
			'Le quantile q devient nul'
		],
		answerIndex: 2,
		explanation:
			"Si n est trop petit, le rang requis k = ceil((n+1)(1-α)) dépasse n, forçant la prise du score maximum et l'inclusion de toutes les classes."
	},
	{
		id: 'p5-syn-q13',
		tags: ['p5/synthese'],
		question:
			"En régression, quel est l'ensemble de prédiction optimal (oracle) pour une couverture fixée 1-α ?",
		options: [
			'Un intervalle centré sur la moyenne',
			"L'ensemble des points dont la densité conditionnelle f(y|x) est supérieure à un seuil (HDR)",
			'Un intervalle de largeur constante',
			"La valeur unique qui minimise l'erreur quadratique"
		],
		answerIndex: 1,
		explanation:
			"L'oracle en régression est une région de densité maximale (Highest Density Region), qui minimise la largeur moyenne pour une masse de probabilité donnée."
	},
	{
		id: 'p5-syn-q14',
		tags: ['p5/synthese'],
		question:
			"Quand un intervalle de largeur constante est-il une approximation optimale de l'oracle en régression ?",
		options: [
			'Quand les données sont fortement hétéroscédastiques',
			'Sous homoscédasticité (la variance des erreurs ne dépend pas de x)',
			"Quand l'ensemble de calibration est très petit",
			'Uniquement pour les modèles linéaires'
		],
		answerIndex: 1,
		explanation:
			"L'intervalle constant suppose que la marge d'erreur est la même partout. C'est optimal si la largeur de la région de densité maximale est constante (homoscédasticité)."
	},
	{
		id: 'p5-syn-q15',
		tags: ['p5/synthese'],
		question: 'Quelle est la formule du score de conformité pour les intervalles adaptatifs ?',
		options: [
			's(x, y) = |y - f(x)|',
			's(x, y) = (y - f(x))^2',
			's(x, y) = |y - f(x)| / (σ(x) + ε)',
			's(x, y) = 1 - p_y(x)'
		],
		answerIndex: 2,
		explanation:
			"Le score adaptatif normalise l'erreur absolue par une estimation de l'incertitude locale σ(x), permettant des intervalles plus étroits là où le modèle est confiant."
	},
	{
		id: 'p5-syn-q16',
		tags: ['p5/synthese'],
		question:
			'Que signifie un score positif dans le cadre de la Régression Quantile Conforme (CQR) ?',
		options: [
			"L'observation y est à l'intérieur de l'intervalle estimé",
			"L'observation y a dépassé les bornes de l'intervalle estimé",
			'Le modèle est parfaitement calibré',
			"L'incertitude locale est nulle"
		],
		answerIndex: 1,
		explanation:
			"En CQR, le score s(x, y) = max(q_lo(x) - y, y - q_hi(x)) est positif si y est hors de l'intervalle et négatif s'il est à l'intérieur."
	},
	{
		id: 'p5-syn-q17',
		tags: ['p5/synthese'],
		question: "Quel est l'objectif principal de la Régression Quantile Conforme (CQR) ?",
		options: [
			'Remplacer la prédiction ponctuelle par une moyenne',
			'Combiner la forme adaptative des quantiles appris avec une garantie de couverture exacte via calibration',
			"Supprimer le besoin d'un ensemble de calibration",
			'Réduire la variance du modèle en utilisant le bootstrap'
		],
		answerIndex: 1,
		explanation:
			"CQR utilise des régressions quantiles pour suivre l'hétéroscédasticité, puis applique un décalage uniforme Q calculé sur calibration pour garantir la couverture."
	},
	{
		id: 'p5-syn-q18',
		tags: ['p5/synthese'],
		question:
			"Quelle métrique permet de détecter si un système d'intervalles échoue dans certaines régions de l'espace d'entrée ?",
		options: [
			'Le taux de couverture empirique global',
			'La largeur moyenne des intervalles',
			"L'efficacité conditionnelle",
			"L'erreur quadratique moyenne"
		],
		answerIndex: 2,
		explanation:
			"L'efficacité conditionnelle vérifie l'homogénéité de la couverture. Une bonne couverture marginale peut cacher des échecs locaux graves."
	},
	{
		id: 'p5-syn-q19',
		tags: ['p5/synthese'],
		question:
			"L'estimation de l'incertitude locale σ(x) peut être réalisée par laquelle de ces méthodes ?",
		options: [
			'Bootstrap et Bagging',
			'Régression quantile',
			'Réseaux bayésiens',
			'Toutes les réponses précédentes'
		],
		answerIndex: 3,
		explanation:
			"Toutes ces méthodes permettent d'estimer la variabilité locale des prédictions pour construire des intervalles adaptatifs."
	},
	{
		id: 'p5-syn-q20',
		tags: ['p5/synthese'],
		question:
			"Quel est l'impact d'une augmentation de la taille de l'ensemble de calibration sur la précision des intervalles ?",
		options: [
			'Elle diminue la garantie de couverture',
			'Elle rend les intervalles systématiquement plus larges',
			'Elle stabilise le quantile q et rapproche la couverture empirique de la garantie théorique',
			"Elle n'a aucun effet sur la largeur des intervalles"
		],
		answerIndex: 2,
		explanation:
			"Un ensemble de calibration plus grand réduit la variance de l'estimation du quantile q, rendant les intervalles plus stables et plus proches de l'optimalité théorique."
	}
];
