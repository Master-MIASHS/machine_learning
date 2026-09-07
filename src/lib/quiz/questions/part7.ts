import type { QuizQuestion } from '../types.js';

export const PART7: QuizQuestion[] = [
	{
		id: 'p7-l1-q1',
		tags: ['p7/l1'],
		question:
			'Selon la Définition 1.2, que signifie dire que (h_n) est fortement consistant (consistant presque sûrement) ?',
		options: [
			'Que P(R(h_n) - R* > ε) → 0 pour tout ε > 0.',
			'Que E[(R(h_n) - R*)²] → 0.',
			'Que P(lim R(h_n) = R*) = 1 : avec probabilité 1, la trajectoire des risques converge vers le risque de Bayes.',
			'Que R(h_n) = R* pour tout n supérieur à un certain n_0.'
		],
		answerIndex: 2,
		explanation:
			"La Définition 1.2 distingue trois notions : en probabilité (les grands écarts deviennent rares), en moyenne quadratique (l'amplitude des écarts est contrôlée) et presque sûrement — une affirmation sur une seule trajectoire infinie qui, avec probabilité 1, finit par entrer dans tout voisinage de R* et n'en ressort plus jamais."
	},
	{
		id: 'p7-l1-q2',
		tags: ['p7/l1'],
		question:
			'Quelle implication entre les trois notions de consistance est garantie par la leçon ?',
		options: [
			'La consistance en probabilité implique la consistance en moyenne quadratique.',
			'La consistance presque sûre implique la consistance en probabilité.',
			'La consistance en probabilité implique la consistance presque sûre.',
			'La consistance en moyenne quadratique implique la consistance presque sûre.'
		],
		answerIndex: 1,
		explanation:
			"La leçon établit que la consistance presque sûre et la consistance en moyenne quadratique impliquent toutes deux la consistance en probabilité : celle-ci est la notion la plus faible des trois, et n'implique en général ni l'une ni l'autre ; presque sûre et moyenne quadratique ne se comparent pas directement entre elles."
	},
	{
		id: 'p7-l1-q3',
		tags: ['p7/l1'],
		question:
			'Un algorithme peut très bien mémoriser ses données sans jamais généraliser. Pourquoi, dans le langage de la décomposition approximation / estimation ?',
		options: [
			"Parce que si le terme d'approximation — propriété structurelle de la classe H, indépendante des données — ne tend pas vers zéro, la somme des deux termes ne peut tendre vers zéro, quel que soit n.",
			'Parce que R(h_n) est toujours une fonction croissante de n.',
			"Parce que le risque de Bayes R* est toujours strictement positif, si bien que l'écart ne peut s'annuler.",
			"Parce que le terme d'estimation est toujours minoré par 1/n, quelle que soit la classe H."
		],
		answerIndex: 0,
		explanation:
			"La décomposition R(h_n) - R* = terme d'estimation + terme d'approximation montre que la consistance exige que la somme des deux termes tende vers 0 : une classe trop pauvre a un terme d'approximation qui ne bougera jamais, quel que soit n, et aucun volume de données ne le supprimera."
	},
	{
		id: 'p7-l1-q4',
		tags: ['p7/l1'],
		question:
			"Dans la décomposition R(h_n) - R* = terme d'estimation + terme d'approximation, que mesure le terme d'approximation ?",
		options: [
			"L'écart entre le meilleur classifieur théorique de la classe et celui effectivement appris sur l'échantillon ; il s'annule quand n → ∞.",
			'La variance de R(h_n) autour de son espérance.',
			"La même quantité que le terme d'estimation, calculée sur un ensemble de validation.",
			'inf_{h∈H} R(h) - R* : il vaut 0 si h* ∈ H, ne dépend pas des données et mesure la capacité de la classe à approcher le classifieur de Bayes.'
		],
		answerIndex: 3,
		explanation:
			"La leçon définit le terme d'approximation (ou biais) comme inf_{h∈H} R(h) - R* : il vaut 0 si h* ∈ H et est une propriété purement structurelle du choix de H, indépendante des données ; c'est le terme d'estimation qui tend vers 0 quand n → ∞, sous des conditions de régularité sur H."
	},
	{
		id: 'p7-l1-q5',
		tags: ['p7/l1'],
		question:
			"Une suite de classifieurs telle que P(R(h_n) - R* > ε) → 0 pour tout ε > 0, mais dont la trajectoire continue à s'écarter occasionnellement de R* à chaque rang, sans jamais se stabiliser : que peut-on en dire ?",
		options: [
			'Elle est consistante presque sûrement.',
			"Elle est consistante en moyenne quadratique, puisque l'amplitude des écarts est bornée.",
			"Elle est consistante en probabilité mais pas presque sûrement : la réciproque de l'implication « presque sûre ⇒ en probabilité » est fausse.",
			'Cette situation ne peut pas se produire pour une suite de risques.'
		],
		answerIndex: 2,
		explanation:
			"La leçon le souligne dans le cartouche d'insight : la probabilité d'excès peut tendre vers 0 tout en continuant, avec probabilité non nulle à chaque rang, à s'écarter occasionnellement — sans jamais se stabiliser complètement, d'où la fausseté de la réciproque."
	},
	{
		id: 'p7-l2-q1',
		tags: ['p7/l2'],
		question: "Selon la Définition 1.3, qu'est-ce qu'un algorithme universellement consistant ?",
		options: [
			"Un algorithme consistant sur une distribution P fixée, choisie à l'avance.",
			'Un algorithme qui converge vers le risque de Bayes en moyenne quadratique seulement.',
			"Un algorithme pour lequel (h_n) est consistant pour toute distribution P sur l'espace d'entrée-sortie, sans hypothèse sur η.",
			'Un algorithme qui exige une hypothèse de régularité sur η pour converger.'
		],
		answerIndex: 2,
		explanation:
			'Définition 1.3 : la consistance universelle doit tenir pour toute distribution P_{X,Y}, quelle que soit la structure du problème — séparable, très bruité, en haute dimension, avec des frontières de décision arbitrairement complexes — et sans aucune hypothèse de régularité sur η.'
	},
	{
		id: 'p7-l2-q2',
		tags: ['p7/l2'],
		question:
			'Selon le théorème de Stone (Théorème 2.1), quelles conditions la suite k(n) doit-elle vérifier pour que le classifieur k-NN soit universellement consistant ?',
		options: [
			'k(n) → +∞ et k(n)/n → 0.',
			"k(n) fixé, plus grand que la dimension d de l'espace.",
			"k(n)/n → 1, afin que le voisinage recouvre l'espace.",
			'k(n) → 0 et k(n)/n → +∞.'
		],
		answerIndex: 0,
		explanation:
			'Théorème 2.1 (Stone, 1977) : deux conditions purement quantitatives sur une seule suite k(n), sans aucune hypothèse sur la distribution elle-même, suffisent à garantir la convergence vers le risque de Bayes en classification binaire sur ℝ^d.'
	},
	{
		id: 'p7-l2-q3',
		tags: ['p7/l2'],
		question:
			'Dans la lecture biais-variance des deux conditions, quel rôle joue la condition k(n)/n → 0 ?',
		options: [
			'Elle applique la loi des grands nombres aux étiquettes du voisinage.',
			"Elle réduit la variance de l'estimation locale de η(x).",
			"Elle garantit que l'échantillon reste i.i.d. quand n grandit.",
			"Elle garantit que les k(n) voisins utilisés restent de plus en plus proches de x, si bien que la moyenne locale ne dilue pas η sur un voisinage trop large : c'est le contrôle du biais."
		],
		answerIndex: 3,
		explanation:
			"Le cartouche « Lecture biais-variance des deux conditions » attribue à k(n) → +∞ le contrôle de la variance (moyenner sur davantage de voisins lisse le bruit d'échantillonnage) et à k(n)/n → 0 le contrôle du biais : si k croît trop vite relativement à n, les voisins sont trop éloignés et la moyenne locale ne capture plus la valeur de η en x."
	},
	{
		id: 'p7-l2-q4',
		tags: ['p7/l2'],
		question:
			'La borne de Cover-Hart (donnée en complément, au-delà du cours) fournit, pour le 1-NN, limsup E[R(h_n)] ≤ 2R*(1 - R*/2). Pour R* = 0.1, que donne-t-elle ?',
		options: [
			'Un risque asymptotique égal à 0.1, puisque k = 1 est le cas le plus simple.',
			'Une borne supérieure de 2 × 0.1 × 0.95 = 0.19, strictement supérieure à R* : un k fixé peut laisser un écart résiduel, quel que soit n.',
			'Une borne supérieure de 0.05, la moitié du risque de Bayes.',
			"Rien : la borne ne s'applique que lorsque k(n) → ∞."
		],
		answerIndex: 1,
		explanation:
			"L'Exercice 2.1 de la leçon calcule la borne : pour R* = 0.1, on obtient 0.19, « près du double du risque de Bayes » ; la borne est strictement au-dessus de R* pour tout R* ∈ (0, 1), ce qui montre que la condition k(n) → +∞ du Théorème 2.1 est nécessaire et pas seulement une commodité technique de la démonstration."
	},
	{
		id: 'p7-l2-q5',
		tags: ['p7/l2'],
		question:
			'Selon la leçon, pourquoi un algorithme qui suppose une frontière de décision linéaire (modèle paramétrique) ne peut-il jamais être universellement consistant ?',
		options: [
			"Parce que la taille de l'échantillon est toujours finie en pratique.",
			'Parce que la perte 0-1 est non convexe et NP-difficile.',
			"Parce que dès que la vraie frontière est non linéaire, le terme d'approximation de la classe reste strictement positif, quel que soit n : aucune quantité de données ne le supprime.",
			'Parce que le classifieur de Bayes est toujours linéaire pour des données i.i.d.'
		],
		answerIndex: 2,
		explanation:
			"Le cartouche « Pourquoi ce n'est pas évident » le souligne : un modèle qui impose une classe restrictive a un terme d'approximation non nul sur les problèmes hors de sa classe, alors que la consistance universelle exige la convergence pour toute distribution — d'où le besoin d'une classe dont la richesse s'adapte elle-même à n, comme le k-NN avec k = k(n)."
	}
];
