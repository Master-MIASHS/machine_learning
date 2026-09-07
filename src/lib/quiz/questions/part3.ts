import type { QuizQuestion } from '../types.js';

export const PART3: QuizQuestion[] = [
	{
		id: 'p3-l1-q1',
		tags: ['p3/l1'],
		question: 'Une fonction d : 𝓧 × 𝓧 → ℝ₊ est une distance si elle vérifie…',
		options: [
			'la symétrie, la séparation (d(x,y)=0 ⇔ x=y) et l’inégalité triangulaire',
			'la symétrie et l’inégalité triangulaire seulement',
			'la positivité et la bornitude par 1',
			'la symétrie et la séparation seulement'
		],
		answerIndex: 0,
		explanation: 'Les trois propriétés de la définition (frame « Choix d’une distance »).'
	},
	{
		id: 'p3-l1-q2',
		tags: ['p3/l1'],
		question: 'L’homogénéité globale T = (1/K) Σ T_k d’un clustering de taille K mesure…',
		options: [
			'la distance moyenne des observations au centroïde de leur cluster — on la veut la plus petite possible',
			'la distance entre les centroïdes — on la veut la plus grande possible',
			'le nombre total de points — on le veut grand',
			'la variance totale du jeu de données'
		],
		answerIndex: 0
	},
	{
		id: 'p3-l1-q3',
		tags: ['p3/l1'],
		question:
			'La séparabilité globale S = 2/(K(K−1)) Σ_{k<ℓ} d(μ_k, μ_ℓ) est la moyenne des distances entre centroïdes. On souhaite S…',
		options: ['le plus petit possible', 'le plus élevé possible', 'égal à l’homogénéité T', 'nul'],
		answerIndex: 1
	},
	{
		id: 'p3-l1-q4',
		tags: ['p3/l1'],
		question: 'L’indice de Davies-Bouldin D_k = max_{ℓ≠k} (T_k+T_ℓ)/S_{kℓ} correspond à…',
		options: [
			'le meilleur cas du cluster 𝒞_k en termes d’homogénéité/séparabilité',
			'le « pire des cas » du cluster 𝒞_k en termes d’homogénéité/séparabilité',
			'la moyenne des T_k sur tous les clusters',
			'la distance entre 𝒞_k et le centroïde global'
		],
		answerIndex: 1
	},
	{
		id: 'p3-l1-q5',
		tags: ['p3/l1'],
		question:
			'Le coefficient de silhouette s(x) = (b(x)−a(x))/max(a(x),b(x)) est proche de 1 lorsque…',
		options: [
			'x est très éloigné de son propre cluster',
			'l’assignation de x à son cluster est satisfaisante : a(x) ≪ b(x)',
			'le clustering comporte exactement deux clusters',
			'x est le centroïde de son cluster'
		],
		answerIndex: 1,
		explanation:
			'a(x) : distance moyenne aux autres points de son cluster ; b(x) : plus petite distance moyenne vers un autre cluster.'
	},
	{
		id: 'p3-l1-q6',
		tags: ['p3/l1'],
		question:
			'L’inertie totale I = Σ ‖x_i − μ‖² se décompose en I = I_W + I_B. Minimiser I_W revient à…',
		options: [
			'minimiser I',
			'maximiser I_B (I est fixée, indépendante de la partition)',
			'augmenter K',
			'maximiser le coefficient de silhouette'
		],
		answerIndex: 1
	},
	{
		id: 'p3-l1-q7',
		tags: ['p3/l1'],
		question:
			'En CAH à lien simple, d(𝒞_k,𝒞_ℓ) = min d(x,y) : les deux clusters sont agglomérés si…',
		options: [
			'tous les éléments de 𝒞_k sont proches de tous les éléments de 𝒞_ℓ',
			'la distance moyenne entre les deux clusters est faible',
			'deux de leurs éléments sont proches',
			'leurs centroïdes sont proches'
		],
		answerIndex: 2
	},
	{
		id: 'p3-l1-q8',
		tags: ['p3/l1'],
		question:
			'La distance de Ward d(𝒞_k,𝒞_ℓ) = |𝒞_k||𝒞_ℓ|/(|𝒞_k|+|𝒞_ℓ|) ‖μ_k−μ_ℓ‖² correspond, par la Proposition, à…',
		options: [
			'le gain de variance intra-classe lors de la fusion de 𝒞_k et 𝒞_ℓ (passage de K à K−1 classes)',
			'la perte de variance inter-classe lors de la séparation des deux clusters',
			'la distance entre les deux centroïdes',
			'la distance minimale entre deux éléments des clusters'
		],
		answerIndex: 0
	},
	{
		id: 'p3-l1-q9',
		tags: ['p3/l1'],
		question: 'Pour le lien complet, d(𝒞_k,𝒞_k) ≠ 0 dès que |𝒞_k| > 1. Que montre-t-on ?',
		options: [
			'que le lien complet est une distance au sens mathématique',
			'que les distances entre clusters ne sont pas forcément des distances au sens mathématique',
			'que la CAH est incorrecte',
			"que l'inégalité triangulaire est toujours satisfaite"
		],
		answerIndex: 1
	},
	{
		id: 'p3-l1-q10',
		tags: ['p3/l1'],
		question:
			'Dans le dendrogramme d’un clustering hiérarchique, la longueur d’une branche est égale à…',
		options: [
			'au nombre de points du cluster associé',
			'à la distance entre les deux clusters qu’elle connecte',
			'à la hauteur de l’arbre',
			'à l’indice de la fusion correspondante'
		],
		answerIndex: 1
	},
	{
		id: 'p3-l1-q11',
		tags: ['p3/l1'],
		question:
			'Le nombre de Bell B₅₀ ≈ 1,86·10⁴⁷ compte les partitions possibles d’un ensemble de 50 éléments. Conséquence :',
		options: [
			'l’exploration exhaustive de toutes les partitions est envisageable',
			'l’exploration exhaustive est impossible : on utilise des algorithmes itératifs',
			'seul K = 2 est raisonnable',
			'la CAH explore toutes les partitions'
		],
		answerIndex: 1
	},
	{
		id: 'p3-l2-q1',
		tags: ['p3/l2'],
		question:
			'À l’étape 2 de Lloyd, on affecte chaque x_i au centroïde le plus proche. Cela revient à…',
		options: [
			'regarder dans quelle cellule du diagramme de Voronoï induit par les centroïdes se trouve x_i',
			'calculer la distance entre toutes les paires de points',
			'construire un arbre de décision',
			'calculer le centroïde global des données'
		],
		answerIndex: 0,
		explanation:
			'L’affectation au centroïde le plus proche est exactement l’appartenance à une cellule du diagramme de Voronoï induit par μ_1, …, μ_K.'
	},
	{
		id: 'p3-l2-q2',
		tags: ['p3/l2'],
		question: 'À l’étape 3 de Lloyd, le centroïde μ_k du cluster 𝒞_k est recalculé comme…',
		options: [
			'la moyenne des points de 𝒞_k',
			'le point de 𝒞_k le plus éloigné du centroïde global',
			'un point choisi aléatoirement',
			"le point de 𝒞_k le plus proche de l'observation courante"
		],
		answerIndex: 0,
		explanation: 'μ_k devient la moyenne arithmétique des observations du cluster 𝒞_k.'
	},
	{
		id: 'p3-l2-q3',
		tags: ['p3/l2'],
		question:
			'Proposition (preuve : lemme 22.1, UML) : pendant l’algorithme de Lloyd, l’inertie intra-classes…',
		options: [
			'augmente à chaque itération',
			'diminue à chaque itération',
			'reste constante',
			'augmente d’abord puis diminue'
		],
		answerIndex: 1,
		explanation:
			"Chaque itération (affectation puis recalcul) diminue ou laisse inchangée l'inertie : elle est donc non croissante."
	},
	{
		id: 'p3-l2-q4',
		tags: ['p3/l2'],
		question:
			'Comme l’inertie diminue à chaque itération, l’algorithme peut s’arrêter dans un minimum local. La recommandation usuelle est de…',
		options: [
			"s'arrêter à la première itération",
			'repéter la procédure avec différentes initialisations aléatoires et garder la meilleure partition',
			'augmenter la dimension d des données',
			'choisir les centroïdes initiaux en les triant'
		],
		answerIndex: 1,
		explanation:
			'On redémarre la procédure plusieurs fois avec des initialisations aléatoires différentes et on garde la meilleure partition.'
	},
	{
		id: 'p3-l2-q5',
		tags: ['p3/l2'],
		question: 'L’inertie intra-classe diminue forcément plus K augmente. Pour choisir K, on…',
		options: [
			'choisit K = n (inertie nulle)',
			'minimise l’inertie sans contrainte',
			'utilise le critère du coude : on choisit K au niveau du changement de pente',
			'choisit K au hasard'
		],
		answerIndex: 2,
		explanation:
			"Minimiser l'inertie sans contrainte donnerait K = n ; on choisit K au niveau du coude, là où la décroissance s'atténue."
	},
	{
		id: 'p3-l2-q6',
		tags: ['p3/l2'],
		question:
			'Pour t itérations, la complexité de l’algorithme de Lloyd est O(ndKt). K et t étant négligeables devant n, cet algorithme est…',
		options: [
			'quadratique en n, comme le clustering hiérarchique',
			'linéaire en n : les distances aux n−1 autres points sont remplacées par les distances à K centroïdes',
			'exponentielle en n',
			'indépendante de n'
		],
		answerIndex: 1,
		explanation:
			"Chaque observation n'est comparée qu'à K centroïdes, pas aux n−1 autres points : coût linéaire en n."
	},
	{
		id: 'p3-l2-q7',
		tags: ['p3/l2'],
		question: 'Une observation très éloignée des autres, dans K-moyennes…',
		options: [
			'est ignorée par l’algorithme',
			'se retrouve seule dans un cluster, tandis que le reste des données est partitionné en K−1 clusters',
			'est affectée au plus gros cluster',
			'empêche la convergence de l’algorithme'
		],
		answerIndex: 1,
		explanation:
			'L’algorithme des K-moyennes est sensible aux données aberrantes : une observation très éloignée finit seule dans un cluster.'
	},
	{
		id: 'p3-l2-q8',
		tags: ['p3/l2'],
		question: 'Cette sensibilité aux données aberrantes peut être exploitée pour…',
		options: [
			'détecter les observations aberrantes (celles qui sont seules dans un cluster)',
			'réduire la dimension des données',
			'choisir les centroïdes initiaux',
			'calculer le coude'
		],
		answerIndex: 0,
		explanation:
			'Les observations aberrantes sont précisément celles qui sont seules dans un cluster : on peut donc les détecter avec K-moyennes.'
	},
	{
		id: 'p3-l2-q9',
		tags: ['p3/l2'],
		question: 'Les clusters trouvés par K-moyennes sont…',
		options: [
			'nécessairement non convexes',
			'convexes (les centroïdes forment un diagramme de Voronoï)',
			'nécessairement circulaires',
			'indépendants du choix de la distance'
		],
		answerIndex: 1,
		explanation: 'Les centroïdes forment un diagramme de Voronoï, dont les cellules sont convexes.'
	},
	{
		id: 'p3-l2-q10',
		tags: ['p3/l2'],
		question: 'Comme les clusters sont convexes, deux anneaux concentriques en 2D…',
		options: [
			'sont parfaitement retrouvés par K-moyennes',
			"ne peuvent pas être retrouvés par K-moyennes en 2D (l'astuce du noyau permet d'obtenir des clusters non convexes, Azencott §12.4.3)",
			'exigent K = 2',
			'sont retrouvés par le lien complet'
		],
		answerIndex: 1,
		explanation:
			"Des cellules convexes ne peuvent pas couper des anneaux ; l'astuce du noyau (Azencott, section 12.4.3) permet d'obtenir des clusters non convexes."
	},
	{
		id: 'p3-l2-q11',
		tags: ['p3/l2'],
		question: 'Le clustering n’étant pas supervisé, l’évaluation interne utilise…',
		options: [
			"l'indice de Rand calculé avec les étiquettes",
			'des critères qui ne dépendent pas d’une vérité terrain, comme le coefficient de silhouette global ou l’indice de Davies-Bouldin global',
			'la matrice de confusion',
			"l'opinion a priori d'un expert"
		],
		answerIndex: 1,
		explanation:
			'L’évaluation interne (silhouette, Davies-Bouldin) ne dépend d’aucune étiquette ; l’indice de Rand relève de l’évaluation externe a priori.'
	},
	{
		id: 'p3-l2-q12',
		tags: ['p3/l2'],
		question:
			'Si l’on dispose d’un jeu de données (partiellement) étiqueté, l’évaluation externe peut vérifier a priori que le clustering retrouve les classes (par exemple avec l’indice de…)',
		options: ['Rand', 'silhouette', 'Bell', 'coude'],
		answerIndex: 0,
		explanation:
			"L'indice de Rand compare le partitionnement aux classes connues (évaluation externe a priori)."
	}
];
