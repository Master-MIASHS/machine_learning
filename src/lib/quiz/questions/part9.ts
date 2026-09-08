import type { QuizQuestion } from '../types.js';

export const PART9: QuizQuestion[] = [
	{
		id: 'p9-l1-q1',
		tags: ['p9/l1'],
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
		id: 'p9-l1-q2',
		tags: ['p9/l1'],
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
		id: 'p9-l1-q3',
		tags: ['p9/l1'],
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
		id: 'p9-l1-q4',
		tags: ['p9/l1'],
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
		id: 'p9-l1-q5',
		tags: ['p9/l1'],
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
		id: 'p9-l2-q1',
		tags: ['p9/l2'],
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
		id: 'p9-l2-q2',
		tags: ['p9/l2'],
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
		id: 'p9-l2-q3',
		tags: ['p9/l2'],
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
		id: 'p9-l2-q4',
		tags: ['p9/l2'],
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
		id: 'p9-l2-q5',
		tags: ['p9/l2'],
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
		id: 'p9-l3-q1',
		tags: ['p9/l3'],
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
		id: 'p9-l3-q2',
		tags: ['p9/l3'],
		question:
			"D'après les exemples de la leçon, quelle est la dimension VC des hyperplans de ℝ^d ?",
		options: ['d', '2d', 'd + 1', 'd²'],
		answerIndex: 2,
		explanation:
			"La leçon donne une série d'exemples à dimension VC croissante : seuils sur ℝ (VCdim = 1, l'étiquetage (1, 0) étant impossible sur une paire ordonnée), intervalles sur ℝ (VCdim = 2, l'étiquetage (1, 0, 1) impossible sur un triplet ordonné), hyperplans de ℝ^d (VCdim = d + 1)."
	},
	{
		id: 'p9-l3-q3',
		tags: ['p9/l3'],
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
		id: 'p9-l3-q4',
		tags: ['p9/l3'],
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
		id: 'p9-l3-q5',
		tags: ['p9/l3'],
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
		id: 'p9-l4-q1',
		tags: ['p9/l4'],
		question:
			"Pour un réseau de neurones à L couches et W paramètres, la dimension VC donnée par Bartlett (1998) est de l'ordre de :",
		options: ['O(W + L)', 'O(W L log W)', 'O(log W / L)', 'O(n)'],
		answerIndex: 1,
		explanation:
			"La leçon cite VCdim = O(W L log W) pour les réseaux à fonctions d'activation seuil."
	},
	{
		id: 'p9-l4-q2',
		tags: ['p9/l4'],
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
		id: 'p9-l4-q3',
		tags: ['p9/l4'],
		question: "Dans le phénomène de double descente, le seuil d'interpolation correspond à :",
		options: ['W très petit devant n', 'W très grand devant n', 'W environ égal à n', 'n égal à 0'],
		answerIndex: 2,
		explanation:
			'Au seuil W ≈ n, le modèle commence à interpoler et le risque explose avant de redescendre en régime sur-paramétré.'
	},
	{
		id: 'p9-l4-q4',
		tags: ['p9/l4'],
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
	},
	{
		id: 'p9-syn-q1',
		tags: ['p9/synthese'],
		question: "Quelle est la forme exacte de l'inégalité de Hoeffding, selon la leçon ?",
		options: [
			"Pour des variables i.i.d. Z_i dans [0, 1] : P(|(1/n) Σ Z_i - E[Z_1]| ≥ ε) ≤ 2 e^{-2nε²}, et l'exposant devient -2nε²/(b-a)² pour des variables dans [a, b].",
			"Pour des variables i.i.d. Z_i dans [0, 1] : P(|(1/n) Σ Z_i - E[Z_1]| ≥ ε) ≤ e^{-nε²}, sans facteur 2, et l'exposant devient -nε²/(b-a)².",
			"Pour des variables i.i.d. Z_i dans [0, 1] : P(|(1/n) Σ Z_i - E[Z_1]| ≥ ε) ≤ 2 e^{-nε}, et l'exposant devient -nε/(b-a)².",
			'Pour des variables i.i.d. Z_i dans [0, 1] : P(|(1/n) Σ Z_i - E[Z_1]| ≥ ε) ≤ 1/(4nε²), la même borne que celle de Tchebychev.'
		],
		answerIndex: 0,
		explanation:
			"Hoeffding exploite le bornage : décroissance exponentielle 2 e^{-2nε²} à deux queues, sans connaître la variance, au prix d'une hypothèse supplémentaire — connaître une borne uniforme sur les observations ; sur [a, b], l'exposant est -2nε²/(b-a)²."
	},
	{
		id: 'p9-syn-q2',
		tags: ['p9/synthese'],
		question: 'Quand n augmente, comment se comportent les trois bornes pour la moyenne empirique, selon la leçon ?',
		options: [
			'La borne de Markov reste constante, celle de Tchebychev décroît comme 1/n et celle de Hoeffding décroît exponentiellement.',
			'Les trois bornes décroissent comme 1/n, à des constantes près.',
			'Markov décroît exponentiellement, Tchebychev comme 1/n et Hoeffding reste constante.',
			'Les trois bornes décroissent exponentiellement, mais à des vitesses différentes.'
		],
		answerIndex: 0,
		explanation:
			"Markov ne contrôle que l'espérance et ne s'améliore donc pas avec n ; Tchebychev exploite Var(Z̄_n) = σ²/n et décroît en 1/n ; Hoeffding exploite le bornage et décroît comme e^{-2nε²} — souvent plus informative que Tchebychev pour les grands échantillons, mais elle exige de connaître une borne uniforme."
	},
	{
		id: 'p9-syn-q3',
		tags: ['p9/synthese'],
		question: "Quel est le mécanisme de la démonstration de l'inégalité de Markov, selon la leçon ?",
		options: [
			"On minore Z par t·1_{Z ≥ t} presque sûrement, puis on prend l'espérance : E[Z] ≥ t·P(Z ≥ t).",
			"On applique l'inégalité triangulaire à E[|Z|], puis on divise par E[Z].",
			'On applique la loi des grands nombres à Z/t.',
			"On décompose Z en partie positive et partie négative, puis on borne chacune par sa variance."
		],
		answerIndex: 0,
		explanation:
			"La minoration Z ≥ t·1_{Z ≥ t} est vérifiée sur {Z < t} (membre de droit nul) et sur {Z ≥ t} (où Z ≥ t) ; l'espérance, qui préserve les inégalités, donne E[Z] ≥ E[t·1_{Z ≥ t}] = t·P(Z ≥ t), d'où la borne en divisant par t."
	},
	{
		id: 'p9-syn-q4',
		tags: ['p9/synthese'],
		question: "Quel énoncé en forme de risque donne le corollaire du cas séparable (Théorème 3.1) ?",
		options: [
			'Avec probabilité 1 - δ, R(ĥ) ≤ log(|H|/δ)/n.',
			'Avec probabilité 1 - δ, R(ĥ) ≤ log(|H|·δ)/n.',
			'Avec probabilité 1 - δ, R(ĥ) ≤ (log|H| + log(2/δ))/(2n), sans racine carrée.',
			'Avec probabilité 1 - δ, R(ĥ) = 0, par réalisabilité.'
		],
		answerIndex: 0,
		explanation:
			'En résolvant δ = |H|e^{-nε} en ε, le corollaire donne ε = log(|H|/δ)/n, soit R(ĥ) ≤ log(|H|/δ)/n avec probabilité 1 - δ : une vitesse en 1/n, nettement plus rapide que la vitesse 1/√n du cas non séparable.'
	},
	{
		id: 'p9-syn-q5',
		tags: ['p9/synthese'],
		question: "Dans la démonstration du Théorème 3.1, quel est le rôle de l'ensemble M des « échantillons trompeurs » ?",
		options: [
			"C'est l'ensemble des échantillons sur lesquels au moins une hypothèse mauvaise h (R(h) > ε) a un risque empirique nul ; {R(ĥ) > ε} est inclus dans M, ce qui autorise l'union bound sur H_bad.",
			"C'est l'ensemble des hypothèses de H qui font exactement ε erreurs sur l'échantillon.",
			"C'est l'ensemble des échantillons de taille inférieure à log(|H|/δ)/ε.",
			"C'est l'ensemble des hypothèses h avec R(h) = 0, sur lequel on applique Hoeffding."
		],
		answerIndex: 0,
		explanation:
			"Étapes 1 et 2 de la preuve : par réalisabilité, R_Sn(h*) = 0 donc R_Sn(ĥ) = 0 ; si R(ĥ) > ε, alors ĥ ∈ H_bad et l'échantillon est trompeur, d'où {R(ĥ) > ε} ⊂ M ; l'union bound donne P^n(M) ≤ Σ_{h∈H_bad} P^n(R_Sn(h) = 0) ≤ |H| e^{-nε}."
	},
	{
		id: 'p9-syn-q6',
		tags: ['p9/synthese'],
		question: "Dans la constante de la borne du Théorème 3.2, d'où vient le facteur 2 présent dans log(2/δ) ?",
		options: [
			"Il vient des deux queues de l'inégalité de Hoeffding (2 e^{-2nt²}) et de la calibration δ = 2|H|e^{-2nt²}, résolue en t.",
			"Il vient du fait que l'union bound compte chaque hypothèse deux fois.",
			"C'est une constante technique sans origine, optimisable en la remplaçant par 1.",
			'Il vient de la borne 1/4 de la variance des indicateurs de Bernoulli.'
		],
		answerIndex: 0,
		explanation:
			"Hoeffding appliquée à un h fixé donne P(|R_Sn(h) - R(h)| ≥ t) ≤ 2 e^{-2nt²} ; l'union bound sur H donne P(∃ h, |écart| ≥ t) ≤ 2|H| e^{-2nt²} ; la calibration δ = 2|H|e^{-2nt²} résout t = sqrt((log|H| + log(2/δ))/(2n)) : le 2 de log(2/δ) est celui des deux queues."
	},
	{
		id: 'p9-syn-q7',
		tags: ['p9/synthese'],
		question: "Quel est l'apport central du Théorème 3.2 par rapport à la borne de Hoeffding pour un h fixé ?",
		options: [
			"La borne est uniforme : elle vaut simultanément pour tout h ∈ H, ce qui permet de l'appliquer au minimiseur ĥ bien que celui-ci soit une fonction aléatoire de l'échantillon.",
			"Elle remplace l'hypothèse i.i.d. par la seule échangeabilité.",
			'Elle supprime le terme log|H| de la borne.',
			"Elle donne une convergence presque sûre au lieu d'une convergence en probabilité."
		],
		answerIndex: 0,
		explanation:
			"Le passage du contrôle h-fixé au contrôle uniforme est l'ingrédient essentiel, au prix de log|H| : puisque |R(h) - R_Sn(h)| ≤ t pour tout h à la fois, la décomposition R(ĥ) = [R(ĥ) - R_Sn(ĥ)] + R_Sn(ĥ) donne R(ĥ) ≤ R_Sn(ĥ) + t pour le ĥ effectivement choisi, même aléatoire."
	},
	{
		id: 'p9-syn-q8',
		tags: ['p9/synthese'],
		question: "Quel est l'énoncé exact du Théorème 3.3 (borne VC) pour une classe de dimension VC d < +∞ ?",
		options: [
			'Avec probabilité 1 - δ, |R(h) - R_Sn(h)| ≤ sqrt((8d·log(2en/d) + 8·log(4/δ))/n), simultanément pour tout h.',
			'Avec probabilité 1 - δ, |R(h) - R_Sn(h)| ≤ sqrt((d·log(2en/d) + log(2/δ))/(2n)), simultanément pour tout h.',
			'Avec probabilité 1 - δ, |R(h) - R_Sn(h)| ≤ 8d·log(2en/d) + 8·log(4/δ), sans division par n.',
			'Avec probabilité 1 - δ, |R(h) - R_Sn(h)| ≤ sqrt((8|H|·log(2en/|H|) + 8·log(4/δ))/n), avec |H| fini.'
		],
		answerIndex: 0,
		explanation:
			"La structure est la même qu'au Théorème 3.2 — racine d'un terme de complexité sur n — mais log|H| est remplacé par 8d·log(2en/d), un terme fini même quand |H| est infini, comme pour les hyperplans de ℝ^d ; le terme 8·log(4/δ) porte la confiance 1 - δ."
	},
	{
		id: 'p9-syn-q9',
		tags: ['p9/synthese'],
		question: "Quel est l'énoncé exact du lemme de Sauer-Shelah (1972) ?",
		options: [
			"Si VCdim(H) = d < +∞, alors le coefficient de brisure Π_H(m) ≤ Σ_{i=0}^{d} C(m, i) pour tout m ; l'enveloppe (em/d)^d n'est valable que pour m ≥ d.",
			'Si VCdim(H) = d, alors Π_H(m) ≤ (em/d)^d pour tout m, y compris m < d.',
			"Si VCdim(H) = d, alors Π_H(m) = 2^d exactement, quelle que soit la taille de l'ensemble considéré.",
			'Si VCdim(H) = d, alors Π_H(m) ≤ d^m pour tout m, sans condition sur m.'
		],
		answerIndex: 0,
		explanation:
			"Le lemme borne le nombre de dichotomies réalisables par une somme de coefficients binomiaux ; (em/d)^d n'en est qu'une enveloppe, valide pour m ≥ d. Le basculement de la croissance exponentielle 2^m à la croissance polynomiale de degré d est ce qui rend une borne de généralisation possible même pour une classe infinie."
	},
	{
		id: 'p9-syn-q10',
		tags: ['p9/synthese'],
		question: "Selon les exemples de la leçon, pourquoi les seuils ont-ils une dimension VC de 1 et les intervalles une dimension VC de 2 ?",
		options: [
			"Tout singleton est brisé, mais sur une paire ordonnée l'étiquetage (1, 0) est impossible pour les seuils, et sur un triplet ordonné l'étiquetage (1, 0, 1) est impossible pour les intervalles.",
			'Les seuils ne brisent aucun ensemble non vide, et les intervalles ne brisent aucune paire.',
			"L'étiquetage (1, 0) est impossible sur une paire ordonnée pour les intervalles, et l'étiquetage (1, 0, 1) pour les seuils.",
			"Les seuils et les intervalles ont tous deux une dimension VC de 1, aucune paire n'étant brisée."
		],
		answerIndex: 0,
		explanation:
			"Exemples à dimension VC croissante de la leçon : seuils sur ℝ (VCdim = 1), intervalles sur ℝ (VCdim = 2), hyperplans de ℝ^d (VCdim = d + 1) ; l'obstruction est toujours un étiquetage « alterné » impossible sur les points ordonnés."
	},
	{
		id: 'p9-syn-q11',
		tags: ['p9/synthese'],
		question: "Comment la leçon définit-elle la classe H_γ des classifieurs à marge γ ?",
		options: [
			"H_γ = {h_{w,b} : ‖w‖_2 = 1, séparant l'échantillon avec marge γ}, où h_{w,b}(x) = sgn(w^T x - b) et Y_i(w^T X_i - b) ≥ γ pour tout i.",
			"H_γ = {h_{w,b} : ‖w‖_2 ≤ γ}, séparant exactement l'échantillon, sans normalisation de la norme.",
			'H_γ = {h_{w,b} : ‖w‖_2 = γ}, sans aucune condition sur les marges des observations.',
			"H_γ = {h_{w,b} : b = 0, séparant avec marge γ}, les hyperplans passant par l'origine seulement."
		],
		answerIndex: 0,
		explanation:
			"La définition fait intervenir la normalisation ‖w‖_2 = 1 — c'est elle qui rend la marge γ comparable d'un classifieur à l'autre — et la condition Y_i(w^T X_i - b) ≥ γ sur toutes les observations de l'échantillon."
	},
	{
		id: 'p9-syn-q12',
		tags: ['p9/synthese'],
		question: "Quel est l'énoncé complet du Théorème 3.4 (Vapnik, 1995) quand ‖X_i‖_2 ≤ R presque sûrement ?",
		options: [
			'VCdim(H_γ) ≤ floor(R²/γ²), et avec probabilité 1 - δ : |R(h) - R_Sn(h)| ≤ sqrt((8 floor(R²/γ²)·log(2enγ²/R²) + 8·log(4/δ))/n) ; la borne ne dépend pas de la dimension ambiante d.',
			'VCdim(H_γ) ≤ R²/γ², et avec probabilité 1 - δ : |R(h) - R_Sn(h)| ≤ sqrt((8d·log(2en/d) + 8·log(4/δ))/n), avec la dimension ambiante d.',
			'VCdim(H_γ) = d + 1, comme pour tous les hyperplans, et la borne est sqrt((8d·log(2en/d) + 8·log(4/δ))/n).',
			"VCdim(H_γ) ≤ floor(R²/γ²), mais la borne ne vaut que sous l'hypothèse de réalisabilité."
		],
		answerIndex: 0,
		explanation:
			"Théorème 3.4 : la dimension VC de la classe des classifieurs à marge ne dépend que du rapport R²/γ², pas de la dimension de l'espace d'entrée — c'est ce qui explique que le SVM puisse généraliser correctement en très grande dimension, à condition d'une marge suffisamment grande relative à l'échelle des données."
	},
	{
		id: 'p9-syn-q13',
		tags: ['p9/synthese'],
		question: 'Quelle extension du SVM la leçon signale-t-elle explicitement comme hors du support du cours ?',
		options: [
			'Le kernel trick, qui transpose les hyperplans dans des espaces de caractéristiques de dimension infinie : il est donné comme complément, au-delà du cours.',
			"La borne du Théorème 3.4 elle-même, qui n'est qu'un résultat heuristique.",
			"L'usage de la perte quadratique au lieu de la perte charnière.",
			"La normalisation ‖w‖_2 = 1, qui simplifierait excessivement la définition de la marge."
		],
		answerIndex: 0,
		explanation:
			"Le cartouche « Ce que cette borne dit vraiment » l'énonce explicitement : la version à noyau, qui travaille en dimension infinie, ne fait pas partie du support du cours et est donnée comme complément."
	},
	{
		id: 'p9-syn-q14',
		tags: ['p9/synthese'],
		question: 'Quels sont les trois régimes du phénomène de double descente, selon la leçon ?',
		options: [
			"Sous-paramétré (W ≪ n) : courbe en U classique ; seuil d'interpolation (W ≈ n) : le risque explose ; sur-paramétré (W ≫ n) : le risque redescend et peut atteindre des niveaux très bas malgré l'interpolation exacte — un phénomène non expliqué par la théorie VC.",
			'Sous-paramétré : le risque explose ; seuil : le risque est minimal ; sur-paramétré : le risque repart à la hausse.',
			'Les trois régimes correspondent à n < d, n = d, n > d, avec le minimum toujours atteint au seuil n = d.',
			'Le risque est monotone décroissant en W dans tous les régimes.'
		],
		answerIndex: 0,
		explanation:
			"La leçon décrit précisément ces trois régimes en fonction du nombre de paramètres W à n fixé : le minimum n'est pas au seuil d'interpolation, et la redescension du régime sur-paramétré invalide la vision classique du compromis biais-variance, sans être expliquée par la théorie VC."
	},
	{
		id: 'p9-syn-q15',
		tags: ['p9/synthese'],
		question: "Dans la figure de la leçon (régression linéaire par pseudo-inverse, d = 50), que se passe-t-il dans les trois régimes n < d, n = d, n > d ?",
		options: [
			"n < d : système sous-déterminé, la pseudo-inverse renvoie la solution de norme minimale ; n = d : interpolation exacte β̂ = X⁻¹y (R_Sn = 0) mais X est mal conditionnée et l'erreur de test explose ; n > d : système sur-déterminé, moindres carrés, et l'erreur de test converge vers l'erreur irréductible σ².",
			"n < d : moindres carrés ; n = d : solution de norme minimale ; n > d : explosion permanente de l'erreur de test.",
			'Les trois régimes donnent la même erreur de test, la pseudo-inverse étant indépendante de n.',
			"n = d est le régime optimal : l'erreur de test y est minimale et l'interpolation parfaite y est sans coût."
		],
		answerIndex: 0,
		explanation:
			"C'est le mécanisme illustré par la figure : au seuil n = d, l'interpolation exacte coïncide avec un mal conditionnement maximal de X, d'où l'explosion de l'erreur de test ; le minimum global n'est pas atteint au seuil mais après, et la convergence est vers σ², l'erreur de Bayes irréductible du modèle."
	},
	{
		id: 'p9-syn-q16',
		tags: ['p9/synthese'],
		question: "Selon la remarque de lecture de la leçon, où est le minimum global de l'erreur de test, et comment les deux points de vue se rapportent-ils ?",
		options: [
			"Le minimum n'est pas au seuil d'interpolation mais après ; le point de vue du phénomène (W variable à n fixé) et celui de la figure (n variable à d fixé) sont duaux, le seuil étant toujours l'égalité entre nombre de paramètres et nombre d'observations.",
			"Le minimum est exactement au seuil, où l'interpolation devient possible.",
			"Les deux points de vue sont contradictoires : l'un prédit une explosion, l'autre une redescension.",
			"Le minimum n'existe pas : l'erreur de test diverge quand n → +∞."
		],
		answerIndex: 0,
		explanation:
			'La remarque de lecture souligne la dualité : le phénomène fait varier W à n fixé, la figure fait varier n à d fixé, mais dans les deux cas le seuil critique est l\'égalité entre nombre de paramètres et nombre d\'observations, avec un minimum de l\'erreur de test atteint au-delà du seuil.'
	},
	{
		id: 'p9-syn-q17',
		tags: ['p9/synthese'],
		question: 'Que dit la borne par normes de Bartlett, Foster et Telgarsky (2017) ?',
		options: [
			"Avec probabilité 1 - δ, R(h) - R_Sn(h) = Õ((Π_l ‖W_l‖_op)·(Σ_l ‖W_l‖_F^{2/3})^{3/2} / √n), où ‖·‖_op est la norme spectrale et ‖·‖_F la norme de Frobenius ; elle est indépendante de la profondeur et de la largeur en tant que telles.",
			"Elle borne l'excès de risque par O(W·L·log W / n), la dimension VC de Bartlett (1998).",
			"Elle n'est non triviale que si les poids sont nuls.",
			'Elle est une borne sur la variance : Var(R_Sn(h)) ≤ (Π_l ‖W_l‖_F)/n.'
		],
		answerIndex: 0,
		explanation:
			"La borne ne dépend que des normes des poids (spectrales et de Frobenius), pas de la profondeur ou de la largeur en tant que telles : elle peut rester non triviale même pour des réseaux très larges, si les poids restent petits — l'une des pistes modernes, sans qu'aucune ne soit complète."
	},
	{
		id: 'p9-syn-q18',
		tags: ['p9/synthese'],
		question: "Que sont la complexité de Rademacher empirique et sa borne de généralisation, selon la leçon ?",
		options: [
			"R̂_n(H) = E_σ[sup_{h∈H} (1/n) Σ σ_i h(X_i)], avec σ_i de loi de Rademacher (±1 équiprobables) indépendantes de l'échantillon ; avec probabilité 1 - δ : sup_{h∈H} |R(h) - R_Sn(h)| ≤ 2R̂_n(H) + sqrt(log(2/δ)/(2n)) ; son avantage est d'être data-dependent.",
			'R̂_n(H) = max_{h∈H} (R(h) - R_Sn(h)), calculée sans variable aléatoire ; la borne est sqrt(log|H|/(2n)).',
			'R̂_n(H) est la dimension VC de H ; la borne est sqrt(8d·log(2en/d)/n).',
			'R̂_n(H) ne dépend que de la taille de H, et la borne exige que H soit fini.'
		],
		answerIndex: 0,
		explanation:
			'Le sup est pris sur la classe mais moyenné sur des bruits de Rademacher σ_i indépendants des données : la complexité est donc data-dependent — elle mesure la complexité de H sur l\'échantillon effectif, et peut être bornée indépendamment du nombre de paramètres pour des réseaux à poids contraints en norme.'
	},
	{
		id: 'p9-syn-q19',
		tags: ['p9/synthese'],
		question: "Vers quoi déplacent les explications modernes (biais implicite, borne BFT, Rademacher) la question de la généralisation, selon la leçon ?",
		options: [
			"D'« combien de paramètres ? » vers « quelle solution l'optimisation sélectionne-t-elle, et combien est-elle régulière ? » — sans qu'aucune explication ne soit complète : la généralisation des réseaux profonds reste un sujet de recherche actif.",
			'Vers le calcul exact de la dimension VC des réseaux profonds.',
			'Vers la preuve que le sur-ajustement est impossible en sur-paramétré.',
			"Vers l'abandon de la théorie de la généralisation au profit de l'heuristique."
		],
		answerIndex: 0,
		explanation:
			"Le « Retenir » de la leçon le résume : les pistes modernes déplacent la question du nombre de paramètres vers la régularité de la solution sélectionnée par l'optimisation — « sans qu'aucune ne fournisse une explication complète », la généralisation des réseaux profonds restant un sujet de recherche actif."
	},
	{
		id: 'p9-syn-q20',
		tags: ['p9/synthese'],
		question: "Quel lien permet-on de faire, à l'échelle de la partie, entre le biais implicite de la descente de gradient et le Théorème 3.4 ?",
		options: [
			"La descente de gradient sur la régression logistique (données linéairement séparables) converge vers le classifieur de marge maximale — exactement le type de classifieur contrôlé par le Théorème 3.4, dont la dimension VC ≤ floor(R²/γ²) est indépendante de la dimension ambiante.",
			"Le biais implicite prouve que la dimension VC des réseaux de neurones est bornée par la taille de l'échantillon.",
			'Le Théorème 3.4 montre que la descente de gradient converge toujours vers la solution de plus grande norme.',
			"Les deux résultats sont sans rapport : l'un porte sur l'optimisation, l'autre sur la complexité."
		],
		answerIndex: 0,
		explanation:
			"Synthèse de la partie : l'optimiseur sélectionne implicitement des solutions régulières de marge maximale (Zhang et al., 2017 ; Soudry et al., 2018) — la solution SVM — et c'est précisément la classe des classifieurs à marge qui bénéficie de la borne de Vapnik (1995) indépendante de la dimension : la bonne généralisation du régime sur-paramétré s'explique partiellement par la marge, pas par le nombre de paramètres."
	}
];
