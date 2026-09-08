import type { QuizQuestion } from '../types.js';

export const PART8: QuizQuestion[] = [
	{
		id: 'p8-l1-q1',
		tags: ['p8/l1'],
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
		id: 'p8-l1-q2',
		tags: ['p8/l1'],
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
		id: 'p8-l1-q3',
		tags: ['p8/l1'],
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
		id: 'p8-l1-q4',
		tags: ['p8/l1'],
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
		id: 'p8-l1-q5',
		tags: ['p8/l1'],
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
		id: 'p8-l2-q1',
		tags: ['p8/l2'],
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
		id: 'p8-l2-q2',
		tags: ['p8/l2'],
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
		id: 'p8-l2-q3',
		tags: ['p8/l2'],
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
		id: 'p8-l2-q4',
		tags: ['p8/l2'],
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
		id: 'p8-l2-q5',
		tags: ['p8/l2'],
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
	},
	{
		id: 'p8-syn-q1',
		tags: ['p8/synthese'],
		question:
			"Selon la Définition 1.2, quelle est l'expression exacte de la consistance en moyenne quadratique de (h_n) ?",
		options: [
			"E[(R(h_n) - R*)²] → 0 quand n → +∞ : c'est l'amplitude moyenne au carré des écarts du risque appris au risque de Bayes qui tend vers zéro.",
			'E[|R(h_n) - R*|] → 0 : la convergence en moyenne absolue des écarts.',
			"(E[R(h_n)] - R*)² → 0 : c'est l'espérance du risque, et non le risque lui-même, qui converge vers R*.",
			"Var(R(h_n)) → 0 : seule la variance du risque autour de son espérance doit s'annuler."
		],
		answerIndex: 0,
		explanation:
			"Définition 1.2 (part8/lesson1) : la consistance en moyenne quadratique est E[(R(h_n) - R*)²] → 0 ; le cartouche « Trois façons de dire « converge » » note qu'elle contrôle l'amplitude des écarts, pas seulement leur fréquence."
	},
	{
		id: 'p8-syn-q2',
		tags: ['p8/synthese'],
		question:
			'Quelle implication entre la consistance en moyenne quadratique et la consistance en probabilité est garantie par la leçon part8/lesson1 ?',
		options: [
			'La consistance en probabilité implique la consistance en moyenne quadratique, qui est la notion la plus forte des trois.',
			'La consistance en moyenne quadratique implique la consistance en probabilité ; la réciproque ne tient pas en général.',
			'Les deux notions sont équivalentes dès que R(h_n) est non négative.',
			'Aucune implication ne tient entre les deux : ce sont des notions indépendantes.'
		],
		answerIndex: 1,
		explanation:
			"Section « Relations entre les notions » (part8/lesson1) : la leçon établit que la consistance en moyenne quadratique implique la consistance en probabilité, et que celle-ci est la notion la plus faible des trois — elle n'implique en général ni l'une ni l'autre des deux autres."
	},
	{
		id: 'p8-syn-q3',
		tags: ['p8/synthese'],
		question:
			'Que dit exactement la leçon part8/lesson1 du rapport entre la consistance presque sûre et la consistance en moyenne quadratique ?',
		options: [
			"Elles ne se comparent pas directement entre elles : chacune contrôle un aspect différent de la convergence — une trajectoire unique contre l'amplitude moyenne des écarts — et l'une peut tenir sans l'autre.",
			'La consistance presque sûre implique la consistance en moyenne quadratique, par un argument de type Portmanteau.',
			"La consistance en moyenne quadratique implique la consistance presque sûre, car contrôler l'amplitude contrôle aussi la trajectoire.",
			'Elles sont équivalentes pour toute suite de classifieurs appris sur un échantillon i.i.d.'
		],
		answerIndex: 0,
		explanation:
			"Part7/lesson1, section « Relations entre les notions » : « La consistance presque sûre et la consistance en moyenne quadratique, elles, ne se comparent pas directement entre elles — chacune contrôle un aspect différent de la convergence (trajectoire unique contre amplitude moyenne des écarts), et l'une peut tenir sans l'autre »."
	},
	{
		id: 'p8-syn-q4',
		tags: ['p8/synthese'],
		question:
			"Pourquoi la leçon part8/lesson1 introduit-elle trois notions distinctes de consistance plutôt qu'une seule ?",
		options: [
			"Parce que les mathématiciens n'ont pas réussi à s'accorder sur une définition unique de la convergence.",
			"Parce que R* dépend de l'échantillon, il faut mesurer la convergence par rapport à chaque réalisation de l'échantillon.",
			"Parce que h_n dépend de l'échantillon aléatoire S_n, le risque R(h_n) est lui-même une variable aléatoire : « converger vers R* » peut se formaliser de plusieurs façons, plus ou moins exigeantes.",
			'Parce que la perte 0-1 est non convexe, ce qui rend la notion de convergence ambiguë.'
		],
		answerIndex: 2,
		explanation:
			"Section « Trois notions de consistance » (part8/lesson1) : « Puisque h_n dépend de l'échantillon aléatoire S_n, le risque R(h_n) est lui-même une variable aléatoire. « Converger vers R* » peut donc se formaliser de plusieurs façons, plus ou moins exigeantes. »"
	},
	{
		id: 'p8-syn-q5',
		tags: ['p8/synthese'],
		question:
			'Comment la leçon part8/lesson1 interprète-t-elle la consistance presque sûre, P(lim R(h_n) = R*) = 1 ?',
		options: [
			"Comme une affirmation sur une seule trajectoire infinie de (R(h_n)) : avec probabilité 1, cette trajectoire finit par entrer dans n'importe quel voisinage de R* et n'en ressort plus jamais.",
			"Comme une affirmation sur la fréquence des grands écarts : la probabilité de s'écarter de R* de plus de ε devient rare.",
			"Comme une affirmation sur la moyenne : l'écart moyen entre R(h_n) et R* tend vers zéro.",
			'Comme une affirmation point par point : R(h_n) = R* pour tout n suffisamment grand, avec probabilité 1.'
		],
		answerIndex: 0,
		explanation:
			"Cartouche « Trois façons de dire « converge » » (part8/lesson1) : la convergence presque sûre est une affirmation sur une seule trajectoire infinie de (R(h_n)) : avec probabilité 1, elle finit par entrer dans n'importe quel voisinage de R* et n'en ressort plus jamais."
	},
	{
		id: 'p8-syn-q6',
		tags: ['p8/synthese'],
		question:
			"Dans le compromis approximation / estimation, quel est le problème d'une classe de modèles trop riche, pour un n donné ?",
		options: [
			"Son terme d'estimation décroît trop lentement pour un n donné : la classe s'adapte trop finement à l'échantillon, et l'écart entre le meilleur classifieur théorique de H et celui effectivement appris reste grand.",
			"Son terme d'approximation ne atteint jamais 0, car une classe riche ne contient jamais le classifieur de Bayes.",
			"Le risque R(h_n) devient non mesurable, et le théorème de Stone ne s'applique plus.",
			"Le risque de Bayes R* devient strictement négatif, si bien que la borne irréductible n'a plus de sens."
		],
		answerIndex: 0,
		explanation:
			"Part7/lesson1, section « Décomposition approximation / estimation » : « une classe trop pauvre a un terme d'approximation qui ne bougera jamais, quel que soit n ; une classe trop riche a un terme d'estimation qui décroît trop lentement pour un n donné »."
	},
	{
		id: 'p8-syn-q7',
		tags: ['p8/synthese'],
		question:
			"Quelle est l'identité exacte de la décomposition du risque d'un classifieur appris, telle que la leçon part8/lesson1 l'énonce ?",
		options: [
			"R(h_n) - R* = [R(h_n) - inf_{h∈H} R(h)] - [inf_{h∈H} R(h) - R*] : l'écart global est la différence des deux termes.",
			"R(h_n) - R* = [R(h_n) - R(h*)] + [inf_{h∈H} R(h) - R*] : le terme d'estimation compare directement h_n au classifieur de Bayes.",
			'R(h_n) - R* = [R(h_n) - inf_{h∈H} R(h)] × [inf_{h∈H} R(h) - R*] : les deux termes se multiplient dans la décomposition.',
			"R(h_n) - R* = [R(h_n) - inf_{h∈H} R(h)] + [inf_{h∈H} R(h) - R*] : le premier terme est le terme d'estimation, le second le terme d'approximation."
		],
		answerIndex: 3,
		explanation:
			"Part7/lesson1, section « Décomposition approximation / estimation » : R(h_n) - R* = [R(h_n) - inf_{h∈H} R(h)] (terme d'estimation) + [inf_{h∈H} R(h) - R*] (terme d'approximation, ou biais)."
	},
	{
		id: 'p8-syn-q8',
		tags: ['p8/synthese'],
		question: 'Comment la Définition 1.2 de part8/lesson1 fait-elle le lien avec la Partie VII ?',
		options: [
			'Elle redéfinit η(x) comme la moyenne conditionnelle de Y sachant X = x, pour relier la consistance à la régression.',
			'Elle réécrit explicitement le risque de Bayes comme R* = R(h*) = E_X[min(η(X), 1 - η(X))], le risque caractérisé par le Théorème 1.1 de la Partie VII.',
			"Elle suppose R* = 0 : la consistance n'aurait de sens que pour des problèmes séparables.",
			"Elle remplace R* par le risque empirique, la moyenne des erreurs sur l'échantillon : la consistance se mesure sur les données."
		],
		answerIndex: 1,
		explanation:
			'Définition 1.2 (part8/lesson1) se conclut par « où R* = R(h*) = E_X[min(η(X), 1 - η(X))] est le risque de Bayes », renvoyant au Théorème 1.1 de la Partie VII qui caractérise le classifieur de Bayes et son risque minimal.'
	},
	{
		id: 'p8-syn-q9',
		tags: ['p8/synthese'],
		question:
			'En complément, au-delà du cours (dû à Cover et Hart, 1967) : quelle identité asymptotique la leçon part8/lesson2 attribue-t-elle au risque du 1-NN ?',
		options: [
			'limsup E[R(h_n^{1-NN})] (quand n → +∞) = 2 E[η(X)(1 - η(X))], en supposant que P_X admet une densité.',
			'limsup E[R(h_n^{1-NN})] (quand n → +∞) = E[η(X)(1 - η(X))] = R* : le 1-NN est universellement consistant.',
			'lim R(h_n^{1-NN}) (quand n → +∞) = R* presque sûrement : la convergence tient sans hypothèse de densité sur P_X.',
			"limsup E[R(h_n^{1-NN})] (quand n → +∞) = 2 R*, quel que soit η : l'asymptotique ne dépend que du risque de Bayes."
		],
		answerIndex: 0,
		explanation:
			"Cartouche « Erreur du 1-NN » (part8/lesson2), explicitement donné « comme complément, au-delà du cours » et dû à Cover et Hart (1967) : sous l'hypothèse que P_X admet une densité, limsup E[R(h_n^{1-NN})] (quand n → +∞) = 2 E[η(X)(1 - η(X))]."
	},
	{
		id: 'p8-syn-q10',
		tags: ['p8/synthese'],
		question:
			'En complément, au-delà du cours : pourquoi la borne de Cover-Hart montre-t-elle que le 1-NN peut laisser un écart résiduel strictement positif, quel que soit n ?',
		options: [
			'Parce que la borne supérieure est strictement inférieure à R* pour tout R* ∈ (0,1) : le 1-NN sous-estime systématiquement le risque de Bayes.',
			"Parce que l'écart 2R*(1 - R*/2) - R* s'annule pour tout R* ∈ (0, 1/2), les problèmes peu bruités étant bien gérés.",
			"Parce que la borne supérieure 2R*(1 - R*/2) est strictement supérieure à R* pour tout R* ∈ (0,1) : l'écart 2R*(1 - R*/2) - R* = R*(1 - R*) est strictement positif et ne s'annule que pour R* ∈ {0, 1}.",
			'Parce que la borne vaut exactement R* dès que R* ≤ 1/4, ce qui couvre la plupart des problèmes séparables.'
		],
		answerIndex: 2,
		explanation:
			"Cartouche « Erreur du 1-NN » (part8/lesson2, complément au-delà du cours, Cover et Hart 1967) : « La borne supérieure est strictement supérieure à R* pour tout R* ∈ (0,1) : l'écart 2R*(1 - R*/2) - R* = R*(1 - R*) est strictement positif, et ne s'annule que pour R* ∈ {0,1} »."
	},
	{
		id: 'p8-syn-q11',
		tags: ['p8/synthese'],
		question:
			'En complément, au-delà du cours : quelle distribution la leçon part8/lesson2 donne-t-elle pour montrer que le risque asymptotique du 1-NN peut rester strictement au-dessus du risque de Bayes ?',
		options: [
			'η(X) ∈ {c, 1 - c} presque sûrement avec c ∈ (0, 1/2) : alors R* = c, mais le risque asymptotique du 1-NN vaut 2c(1 - c), strictement plus grand que c.',
			'η(X) ∈ {0, 1} presque sûrement : le problème est séparable (R* = 0), mais le 1-NN conserve un risque asymptotique strictement positif.',
			"η(X) = 1/2 presque sûrement : le cas le plus bruité, où l'identité de Cover-Hart donne un risque asymptotique strictement supérieur à R* = 1/2.",
			'Une loi gaussienne centrée de variance 1 : la symétrie de la gaussienne garantit un risque asymptotique strictement supérieur à R*.'
		],
		answerIndex: 0,
		explanation:
			'Cartouche « Erreur du 1-NN » (part8/lesson2, complément au-delà du cours) : « si η(X) ∈ {c,1-c} presque sûrement avec c ∈ (0,1/2), alors R* = c mais le risque asymptotique vaut 2c(1-c) > c » — une distribution pour laquelle le 1-NN reste strictement au-dessus du risque de Bayes.'
	},
	{
		id: 'p8-syn-q12',
		tags: ['p8/synthese'],
		question:
			'Pourquoi la leçon part8/lesson2 affirme-t-elle que la condition k(n) → +∞ du Théorème 2.1 est « nécessaire, et pas seulement une commodité technique de la démonstration » ?',
		options: [
			"Parce que la borne de Cover-Hart (complément, au-delà du cours) montre qu'un k fixé peut laisser un écart résiduel strictement positif, quel que soit n : c'est cette impossibilité générale — pas seulement l'exemple numérique — qui rend la condition nécessaire.",
			"Parce que le théorème de Stone l'énonce explicitement comme condition nécessaire dans son énoncé.",
			"Parce que sans k(n) → +∞, le classifieur k-NN n'est même plus défini.",
			"Parce que la borne de Cover-Hart fait partie du support du cours et que l'Exercice 2.1 la démontre."
		],
		answerIndex: 0,
		explanation:
			"Part7/lesson2 : la borne de Cover-Hart (donnée en complément, au-delà du cours) montre que la borne supérieure est strictement au-dessus de R* dès que R* ∈ (0,1) : « il existe des distributions non séparables pour lesquelles un k fixé laisse un écart résiduel strictement positif, quel que soit n. C'est cette impossibilité générale — pas seulement l'exemple numérique — qui rend la condition k(n) → +∞ du Théorème 2.1 nécessaire, et pas seulement une commodité technique de la démonstration. »"
	},
	{
		id: 'p8-syn-q13',
		tags: ['p8/synthese'],
		question:
			'Quel est, selon la leçon part8/lesson2, le statut du Théorème 2.1 de Stone au sujet des deux conditions sur k(n) ?',
		options: [
			"C'est un résultat de suffisance : k(n) → +∞ et k(n)/n → 0 suffisent à la consistance universelle ; la nécessité de la seconde condition, k(n)/n → 0, n'est pas discutée dans le cours.",
			"C'est un résultat de nécessité : sans les deux conditions, la consistance universelle est impossible.",
			'Le théorème établit que les deux conditions sont nécessaires et suffisantes, la nécessité de k(n)/n → 0 étant démontrée via la borne de Cover-Hart.',
			"C'est un résultat heuristique : Stone n'affirme aucune convergence, il suggère seulement un compromis biais-variance."
		],
		answerIndex: 0,
		explanation:
			'Part7/lesson2 présente le Théorème 2.1 comme un résultat de suffisance (« Si le paramètre k = k(n) vérifie ... alors le classifieur k-NN est universellement consistant ») ; la leçon discute la nécessité de la première condition via la borne de Cover-Hart (au-delà du cours), mais ne discute pas la nécessité de la seconde condition k(n)/n → 0.'
	},
	{
		id: 'p8-syn-q14',
		tags: ['p8/synthese'],
		question:
			'Sous quelle forme la leçon part8/lesson2 énonce-t-elle la conclusion du Théorème 2.1 de Stone ?',
		options: [
			'Presque sûrement, pour toute distribution P : P(lim R(h_n^{k-NN}) (quand n → +∞) = R*) = 1.',
			'En espérance, pour toute distribution P sur ℝ^d × {0,1} : E[R(h_n^{k-NN})] → R* quand n → +∞.',
			'En probabilité, et seulement pour les distributions P à densité sur ℝ^d.',
			"Pour toute distribution P, le risque empirique, la moyenne des erreurs sur l'échantillon, converge vers R* en espérance."
		],
		answerIndex: 1,
		explanation:
			'Énoncé du Théorème 2.1 (part8/lesson2) : la convergence est énoncée en espérance, « E[R(h_n^{k-NN})] → R* », pour toute distribution P sur ℝ^d × {0,1}, sans hypothèse sur la distribution elle-même.'
	},
	{
		id: 'p8-syn-q15',
		tags: ['p8/synthese'],
		question:
			'Dans la « Lecture biais-variance des deux conditions » (part8/lesson2), quel rôle joue chacune des deux conditions du Théorème 2.1 ?',
		options: [
			"k(n) → +∞ contrôle la variance — moyenner sur davantage de voisins lisse le bruit d'échantillonnage par la loi des grands nombres ; k(n)/n → 0 contrôle le biais — les k(n) voisins restent proches de x, si bien que la moyenne locale capture η en x.",
			"k(n) → +∞ contrôle le biais — plus il y a de voisins, plus la moyenne locale s'approche de la frontière de décision ; k(n)/n → 0 contrôle la variance.",
			"Les deux conditions contrôlent la même chose : elles sont redondantes et l'une implique l'autre.",
			"k(n) → +∞ contrôle l'approximation (la classe s'enrichit) ; k(n)/n → 0 contrôle l'estimation (le bruit d'échantillon)."
		],
		answerIndex: 0,
		explanation:
			"Cartouche « Lecture biais-variance des deux conditions » (part8/lesson2) : k(n) → +∞ réduit la variance de l'estimation locale de η(x) — « en moyennant sur davantage de voisins, la loi des grands nombres lisse le bruit d'échantillonnage » — et k(n)/n → 0 réduit le biais, garantissant que les k(n) voisins restent de plus en plus proches de x."
	}
];
