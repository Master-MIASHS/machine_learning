import type { QuizQuestion } from '../types.js';

export const PART8: QuizQuestion[] = [
	{
		id: 'p8-l1-q1',
		tags: ['p8/l1'],
		question: "Que dit l'inégalité de Markov, selon la leçon ?",
		options: [
			'Pour toute variable aléatoire Z de variance finie : P(|Z - E[Z]| ≥ ε) ≤ Var(Z)/ε².',
			'Pour toute variable aléatoire Z : P(Z ≥ t) ≤ e^{-t} E[Z].',
			'Pour des variables i.i.d. Z_i dans [0, 1] : P(|(1/n) Σ Z_i - E[Z_1]| ≥ ε) ≤ 2 e^{-2nε²}.',
			'Pour une variable aléatoire Z ≥ 0 presque sûrement et t > 0 : P(Z ≥ t) ≤ E[Z]/t.'
		],
		answerIndex: 3,
		explanation:
			"Markov : pour Z ≥ 0 presque sûrement et t > 0, P(Z ≥ t) ≤ E[Z]/t ; la démonstration minore Z par t·1_{Z ≥ t} presque sûrement, puis prend l'espérance, qui préserve l'inégalité."
	},
	{
		id: 'p8-l1-q2',
		tags: ['p8/l1'],
		question:
			"Comment l'inégalité de Bienaymé-Tchebychev se déduit-elle de celle de Markov, selon la démonstration de la leçon ?",
		options: [
			'En appliquant Markov à la variable positive (Z - E[Z])² avec le seuil ε², et en notant que les événements {(Z - E[Z])² ≥ ε²} et {|Z - E[Z]| ≥ ε} coïncident.',
			'En appliquant Markov à Z elle-même avec le seuil ε, puis en élevant la borne obtenue au carré.',
			"Par l'inégalité triangulaire des espérances, appliquée à |Z - E[Z]|.",
			'En supposant que Z est gaussienne, cas où les deux inégalités deviennent équivalentes.'
		],
		answerIndex: 0,
		explanation:
			"Le cartouche « Tchebychev, c'est Markov appliqué intelligemment » résume : le choix est d'appliquer Markov au carré de l'écart à la moyenne plutôt qu'à la variable elle-même — ce qui transforme une borne portant sur Z en une borne portant sur la variance, bien plus informative pour la dispersion autour d'une moyenne."
	},
	{
		id: 'p8-l1-q3',
		tags: ['p8/l1'],
		question:
			"Pour la moyenne empirique (1/n) Σ Z_i de n variables i.i.d. de moyenne μ et de variance σ², que donne l'inégalité de Tchebychev ?",
		options: [
			'P(|(1/n) Σ Z_i - μ| ≥ ε) ≤ σ²/ε², une borne indépendante de n.',
			"P(|(1/n) Σ Z_i - μ| ≥ ε) ≤ σ²/(n ε²) → 0, soit un écart typique d'ordre 1/√n.",
			'P(|(1/n) Σ Z_i - μ| ≥ ε) ≤ 2 e^{-nε}, une décroissance exponentielle en n.',
			'La moyenne empirique converge presque sûrement vers μ mais pas en probabilité.'
		],
		answerIndex: 1,
		explanation:
			"Avec E[(1/n) Σ Z_i] = μ et Var((1/n) Σ Z_i) = σ²/n, Tchebychev donne la borne σ²/(n ε²) qui s'annule quand n → +∞ : c'est la loi des grands nombres sous forme quantitative — on sait que la convergence a lieu, et à quelle vitesse (1/√n sur l'écart typique, la probabilité de dépassement décroissant en 1/n)."
	},
	{
		id: 'p8-l1-q4',
		tags: ['p8/l1'],
		question:
			"Pour un classifieur h fixé à l'avance, quelle borne explicite la leçon déduit-elle pour P(|R_n(h) - R(h)| ≥ ε) ?",
		options: [
			'1/(n ε²), puisque les indicateurs Z_i sont de Bernoulli.',
			'R(h)/n, par Markov appliqué directement au risque empirique.',
			'1/(4 n ε²), puisque Var(Z_i) = R(h)(1 - R(h)) est majoré par 1/4, atteint en R(h) = 1/2.',
			'2 e^{-2nε²}, par Hoeffding, sans hypothèse supplémentaire.'
		],
		answerIndex: 2,
		explanation:
			'Les indicateurs Z_i = 1_{h(X_i) ≠ Y_i} sont de Bernoulli avec variance exacte R(h)(1 - R(h)) ; cette quantité est maximisée en 1/4 pour R(h) = 1/2, ce qui donne la borne explicite 1/(4n ε²) (section « Les limites du contrôle pour un classifieur fixé »).'
	},
	{
		id: 'p8-l1-q5',
		tags: ['p8/l1'],
		question:
			'Pourquoi cette borne ne suffit-elle pas à contrôler le classifieur ĥ effectivement choisi par minimisation du risque empirique R_n sur une classe H ?',
		options: [
			'Parce que la borne exige que n soit supérieur à 1000 pour être non triviale.',
			"Parce qu'elle n'est valable que pour h fixé à l'avance, indépendamment des données : elle ne contrôle pas le sup de l'écart sur toute la classe, et ĥ dépend de l'échantillon.",
			"Parce que R_n(h) est toujours supérieur à R(h), si bien que l'écart est toujours positif.",
			'Parce que la perte 0-1 est NP-difficile à minimiser.'
		],
		answerIndex: 1,
		explanation:
			"Le cartouche d'avertissement « Cette borne ne suffit pas encore » est explicite : en apprentissage, on ne choisit jamais un h arbitraire à l'avance — on sélectionne ĥ après avoir vu les données, en minimisant R_n sur H — et un contrôle valable pour chaque h pris isolément ne dit rien sur celui, potentiellement trompeur, que l'algorithme finit par choisir."
	},
	{
		id: 'p8-l2-q1',
		tags: ['p8/l2'],
		question:
			'Selon le Théorème 3.1 (cas séparable, |H| < +∞), sous réalisabilité, quelle borne obtient-on pour le minimiseur du risque empirique ?',
		options: [
			'P(R(ĥ) > ε) ≤ 2|H| e^{-2nε²}, pour tout ε > 0.',
			'R(ĥ) ≤ log(|H|/δ)/n, de façon déterministe, sans aucune probabilité.',
			'P(R(ĥ) > ε) ≤ |H| e^{-nε}, pour tout ε > 0 ; en particulier n ≥ log(|H|/δ)/ε suffit pour avoir confiance 1 - δ.',
			'P(R(ĥ) > ε) ≤ e^{-nε}/|H|, pour tout ε > 0.'
		],
		answerIndex: 2,
		explanation:
			"Théorème 3.1 : sous réalisabilité, le minimiseur du risque empirique a un risque empirique nul ; l'événement d'échec est inclus dans l'union sur les hypothèses mauvaises de l'événement où elles sont trompées par l'échantillon, et l'union bound donne |H| e^{-nε} (démonstration en quatre étapes : réduction aux échantillons trompeurs, union bound, borne par hypothèse, conclusion)."
	},
	{
		id: 'p8-l2-q2',
		tags: ['p8/l2'],
		question:
			"Selon le Théorème 3.2 (cas non séparable, |H| < +∞), qu'a-t-on avec probabilité 1 - δ ?",
		options: [
			'R(ĥ) ≤ R_Sn(ĥ) + sqrt((log|H| + log(2/δ)) / (2n)), la borne étant uniforme sur la classe.',
			'R(ĥ) ≤ log(|H|/δ)/n, avec la même vitesse que dans le cas séparable.',
			'R(ĥ) ≤ 2 R_Sn(ĥ), sans aucune dépendance à |H|.',
			'sup_{h∈H} |R(h) - R_Sn(h)| ≤ log(1/δ)/n, sans le terme log|H|.'
		],
		answerIndex: 0,
		explanation:
			"Théorème 3.2 : Hoeffding appliqué à un h fixé donne P(|R_Sn(h) - R(h)| ≥ t) ≤ 2 e^{-2nt²} ; l'union bound sur H (P(∃ h, |écart| ≥ t) ≤ 2|H| e^{-2nt²}) et la calibration δ = 2|H| e^{-2nt²} donnent l'écart uniforme sqrt((log|H| + log(2/δ))/(2n)), qui s'applique à ĥ bien qu'il soit une fonction aléatoire de l'échantillon."
	},
	{
		id: 'p8-l2-q3',
		tags: ['p8/l2'],
		question:
			'Pourquoi le cas séparable converge-t-il plus vite (en 1/n) que le cas non séparable (en 1/√n), selon la leçon ?',
		options: [
			"Parce que l'union bound est plus efficace quand |H| est petit.",
			"Parce que la réalisabilité permet un argument purement combinatoire sur les échantillons trompeurs — une hypothèse mauvaise est trompée ou non, c'est binaire — et sans elle on doit se rabattre sur une concentration probabiliste plus générale mais plus lente.",
			"Parce que l'inégalité de Hoeffding ne s'applique pas aux variables de Bernoulli.",
			'Parce que dans le cas non séparable, le risque empirique est toujours nul.'
		],
		answerIndex: 1,
		explanation:
			"La section « Comparer les deux régimes » explique : sans classifieur parfait dans H, il n'y a plus le critère du « risque empirique nul », et on perd l'argument combinatoire des échantillons trompeurs (binaire : trompé ou non) au profit d'une concentration probabiliste plus générale mais plus lente à converger."
	},
	{
		id: 'p8-l2-q4',
		tags: ['p8/l2'],
		question:
			"Dans le cas séparable, qu'est-ce qui garantit que le minimiseur du risque empirique ĥ a un risque empirique nul ?",
		options: [
			"Le fait que l'échantillon soit suffisamment grand.",
			'Le fait que la perte 0-1 soit continue.',
			'Le fait que toutes les hypothèses de H ne fassent aucune erreur sur les données.',
			'La réalisabilité : h* ∈ H vérifie R_Sn(h*) = 0, et ĥ, qui minimise R_Sn sur H, a donc R_Sn(ĥ) = 0.'
		],
		answerIndex: 3,
		explanation:
			"Étape 1 de la démonstration du Théorème 3.1 : par réalisabilité, R_Sn(h*) = 0 toujours, donc aussi R_Sn(ĥ) = 0 puisque c'est le minimiseur — c'est ce qui rend possible la réduction aux « échantillons trompeurs »."
	},
	{
		id: 'p8-l2-q5',
		tags: ['p8/l2'],
		question:
			'Que représente le terme log|H| dans les bornes, et quelle mise en garde la leçon y attache-t-elle ?',
		options: [
			"Le biais de la classe H, qui s'annule quand n grandit.",
			"Le nombre d'échantillons trompeurs effectivement observés dans l'échantillon.",
			"Le prix de la recherche dans H : doubler |H| ne coûte qu'une observation supplémentaire — mais en pratique, la sélection de paramètres fait croître |H| de façon exponentielle, ce que le coût logarithmique masque.",
			'La variance du risque empirique, qui ne dépend que de δ.'
		],
		answerIndex: 2,
		explanation:
			"Le cartouche « Un coût seulement logarithmique — mais attention » l'énonce : log|H| est le prix de la recherche dans la classe (doubler |H| ne coûte qu'une observation supplémentaire à ε et δ fixés), mais cette économie est trompeuse en pratique, car une grille d'hyperparamètres fait croître |H| de façon exponentielle en amont."
	},
	{
		id: 'p8-l3-q1',
		tags: ['p8/l3'],
		question: "Selon la leçon, que signifie dire qu'une classe H brise un ensemble C de m points ?",
		options: [
			'Que H contient au moins m classifieurs.',
			'Que tout étiquetage de C est réalisable : pour tout (y_1, ..., y_m) dans {0,1}^m, il existe h ∈ H avec h(x_i) = y_i pour tout i — autrement dit, H réalise les 2^m dichotomies.',
			'Que H sépare les points de C avec une marge strictement positive.',
			"Que C est nécessairement contenu dans l'échantillon d'entraînement."
		],
		answerIndex: 1,
		explanation:
			"Définition de la brisure : H réalise toutes les dichotomies de C, c'est-à-dire que le nombre d'étiquetages réalisables sur C est exactement 2^m ; la dimension VC est la plus grande taille m d'un ensemble brisé, avec la convention VCdim = +∞ si H brise des ensembles de taille arbitraire."
	},
	{
		id: 'p8-l3-q2',
		tags: ['p8/l3'],
		question:
			"D'après les exemples de la leçon, quelle est la dimension VC des hyperplans de ℝ^d ?",
		options: ['d', '2d', 'd + 1', 'd²'],
		answerIndex: 2,
		explanation:
			"La leçon donne une série d'exemples à dimension VC croissante : seuils sur ℝ (VCdim = 1, l'étiquetage (1, 0) étant impossible sur une paire ordonnée), intervalles sur ℝ (VCdim = 2, l'étiquetage (1, 0, 1) impossible sur un triplet ordonné), hyperplans de ℝ^d (VCdim = d + 1)."
	},
	{
		id: 'p8-l3-q3',
		tags: ['p8/l3'],
		question:
			'Quel est le rôle essentiel du lemme de Sauer-Shelah dans la démonstration de la borne de généralisation VC ?',
		options: [
			"Il borne le nombre de dichotomies réalisables sur m points de façon polynomiale en m — (em/d)^d dès que VCdim = d < +∞ — au lieu de 2^m : c'est ce qui permet d'appliquer l'union bound aux dichotomies réalisables plutôt qu'à H, même quand H est infini.",
			"Il montre que |H| est fini pour toute classe d'hyperplans.",
			'Il donne une borne inférieure sur la dimension VC en fonction de n.',
			"Il montre que l'union bound est inutile dès que H est fini."
		],
		answerIndex: 0,
		explanation:
			"Le cartouche « Le point essentiel » résume : le basculement de la croissance exponentielle (2^m) à la croissance polynomiale en m (de degré d) est ce qui rend une borne de généralisation possible même pour une classe infinie ; la démonstration (omise dans la leçon) raffine l'union bound de la leçon précédente en l'appliquant aux dichotomies effectivement réalisables sur l'échantillon."
	},
	{
		id: 'p8-l3-q4',
		tags: ['p8/l3'],
		question:
			'Selon le Théorème 3.4 (Vapnik, 1995), si ||X_i||_2 ≤ R presque sûrement, que peut-on dire de VCdim(H_gamma), la classe des classifieurs linéaires de norme 1 séparant avec marge gamma ?',
		options: [
			'Elle est égale à d + 1, comme pour tous les hyperplans de ℝ^d.',
			"Elle est majorée par n, la taille de l'échantillon.",
			'Elle est infinie, puisque H_gamma contient une infinité de classifieurs.',
			'Elle est majorée par floor(R²/gamma²) : elle ne dépend que du rapport entre le rayon des données et la marge, pas de la dimension ambiante d.'
		],
		answerIndex: 3,
		explanation:
			"Théorème 3.4 : VCdim(H_gamma) ≤ floor(R²/gamma²) ; le cartouche d'insistion souligne que cette dimension VC ne dépend pas de la dimension de l'espace d'entrée — seulement du rapport R²/gamma² — ce qui explique que le SVM peut généraliser correctement même en très grande dimension, à condition d'une marge suffisamment grande relative à l'échelle des données."
	},
	{
		id: 'p8-l3-q5',
		tags: ['p8/l3'],
		question: 'Dans le Théorème 3.3 (borne VC), que remplace-t-on, par rapport au Théorème 3.2 ?',
		options: [
			'log|H| est remplacé par log n, qui croît plus lentement.',
			'log|H| est remplacé par le terme d log(2en/d), qui reste fini même quand |H| est infini — par exemple pour les hyperplans de ℝ^d.',
			"log|H| est remplacé par log(2/δ) seul, la complexité de la classe n'entrant plus.",
			"log|H| est remplacé par n, la taille de l'échantillon."
		],
		answerIndex: 1,
		explanation:
			"La leçon l'énonce explicitement : la structure de la borne est la même qu'au Théorème 3.2 (racine d'un terme de complexité sur n), à ceci près que log|H| a été remplacé par d log(2en/d) — un terme qui, lui, reste fini même quand |H| ne l'est pas."
	},
	{
		id: 'p8-l4-q1',
		tags: ['p8/l4'],
		question:
			"Pour un réseau de neurones à L couches et W paramètres, la dimension VC donnée par Bartlett (1998) est de l'ordre de :",
		options: ['O(W + L)', 'O(W L log W)', 'O(log W / L)', 'O(n)'],
		answerIndex: 1,
		explanation:
			"La leçon cite VCdim = O(W L log W) pour les réseaux à fonctions d'activation seuil."
	},
	{
		id: 'p8-l4-q2',
		tags: ['p8/l4'],
		question:
			"Pour que la borne VC soit non triviale pour un réseau moderne, la leçon indique qu'il faudrait :",
		options: [
			'un n très grand devant W L log W, soit environ 10^10',
			"un n de l'ordre de 10^6",
			'W plus petit que n',
			'une interpolation exacte des données'
		],
		answerIndex: 0,
		explanation:
			"Les jeux de données habituels sont plutôt de l'ordre de 10^6 à 10^7, donc la borne VC devient triviale."
	},
	{
		id: 'p8-l4-q3',
		tags: ['p8/l4'],
		question: "Dans le phénomène de double descente, le seuil d'interpolation correspond à :",
		options: ['W très petit devant n', 'W très grand devant n', 'W environ égal à n', 'n égal à 0'],
		answerIndex: 2,
		explanation:
			'Au seuil W ≈ n, le modèle commence à interpoler et le risque explose avant de redescendre en régime sur-paramétré.'
	},
	{
		id: 'p8-l4-q4',
		tags: ['p8/l4'],
		question:
			'Selon la leçon, pour la régression logistique sur des données linéairement séparables, la descente de gradient converge vers :',
		options: [
			'la solution de norme maximale',
			'le classifieur de marge maximale avec une pénalité explicite',
			'la solution des moindres carrés exacte',
			'le classifieur de marge maximale, même sans régularisation explicite'
		],
		answerIndex: 3,
		explanation:
			"C'est le biais implicite de l'optimiseur décrit par Zhang et al. (2017) et Soudry et al. (2018)."
	}
];
