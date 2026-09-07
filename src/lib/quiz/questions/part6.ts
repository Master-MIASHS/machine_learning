import type { QuizQuestion } from '../types.js';

export const PART6: QuizQuestion[] = [
	{
		id: 'p6-l1-q1',
		tags: ['p6/l1'],
		question: "D'après le Théorème 1.1, quel est le classifieur de Bayes pour la perte 0-1 ?",
		options: [
			'h*(x) = 1 si η(x) > 1/2, h*(x) = 0 si η(x) < 1/2, et tout choix si η(x) = 1/2.',
			'h*(x) = 1 si η(x) ≥ 1/2, et h*(x) = 0 sinon.',
			'h*(x) = 1 si η(x) ≥ 1/3, et h*(x) = 0 sinon.',
			'h*(x) = la classe de plus grande probabilité a priori, indépendamment de x.'
		],
		answerIndex: 1,
		explanation:
			"Théorème 1.1 : la décision optimale en x minimise le risque conditionnel — on choisit l'action 1 si et seulement si r(1, x) = 1 - η(x) ≤ r(0, x) = η(x), c'est-à-dire si et seulement si η(x) ≥ 1/2 : on prédit la classe majoritaire au point x."
	},
	{
		id: 'p6-l1-q2',
		tags: ['p6/l1'],
		question: "Quelle est l'expression du risque de Bayes R*, le risque minimal atteint par h* ?",
		options: [
			"L'espérance de η(X) sur X.",
			"L'espérance de η(X)(1 - η(X)) sur X.",
			"L'espérance de min(η(X), 1 - η(X)) sur X.",
			'Le minimum du risque 0-1 restreint aux classifieurs linéaires.'
		],
		answerIndex: 2,
		explanation:
			"La leçon définit R* = R(h*) = E[min(η(X), 1 - η(X))] : c'est une borne irréductible due au chevauchement intrinsèque des classes — aucun algorithme, même avec une infinité de données, ne peut faire mieux."
	},
	{
		id: 'p6-l1-q3',
		tags: ['p6/l1'],
		question: 'Quand le risque de Bayes R* est-il égal à zéro ?',
		options: [
			"Quand les classes sont linéairement séparables dans l'espace d'entrée.",
			"Quand η(x) = 1/2 presque sûrement, c'est-à-dire quand le problème est maximalement bruité.",
			"Quand la taille d'échantillon n est suffisamment grande.",
			'Quand η(x) ∈ {0, 1} presque sûrement : le problème est alors séparable.'
		],
		answerIndex: 3,
		explanation:
			"Le cartouche « Séparabilité » vérifie que R* = 0 si et seulement si η(x) ∈ {0, 1} presque sûrement, c'est-à-dire quand à chaque point une seule classe est possible avec certitude ; dès que η s'éloigne de {0, 1} vers 1/2, le problème devient bruité et le classifieur optimal se trompe avec une probabilité non nulle."
	},
	{
		id: 'p6-l1-q4',
		tags: ['p6/l1'],
		question:
			"Dans la démonstration du Théorème 1.1, pourquoi l'optimalité pointwise de h* suffit-elle à son optimalité globale ?",
		options: [
			"Parce que R(h) - R(h*) = E[r(h(X), X) - r(h*(X), X)] est l'espérance d'un terme non négatif.",
			"Parce que la perte 0-1 est une perte convexe sur l'espace des classifieurs.",
			'Parce que η(x) est différentiable en tout point x.',
			"Parce que l'échantillon est i.i.d., ce qui garantit la convergence uniforme."
		],
		answerIndex: 0,
		explanation:
			"La loi des espérances totales donne R(h) = E_X[r(h(X), X)]; comme h* minimise r(., x) pour presque tout x, l'écart entre R(h) et R(h*) est l'espérance d'un terme non négatif, donc non négatif — sans aucune hypothèse de régularité sur P (panneau expert « Pourquoi le conditionnement suffit »)."
	},
	{
		id: 'p6-l1-q5',
		tags: ['p6/l1'],
		question: 'En un point x où η(x) = 0.3, que fait le classifieur de Bayes ?',
		options: [
			'Il prédit 1, puisque 0.3 > 0.',
			'Il prédit 0, et se trompe avec une probabilité conditionnelle 0.3.',
			'Il prédit 0, et se trompe avec une probabilité conditionnelle 0.7.',
			"Sa décision dépend de la taille de l'échantillon disponible."
		],
		answerIndex: 1,
		explanation:
			'Comme η(x) = 0.3 < 1/2, on a h*(x) = 0 ; le risque conditionnel de cette décision vaut r(0, x) = η(x) = 0.3, le plus petit des deux (prédire 1 donnerait r(1, x) = 1 - η(x) = 0.7).'
	},
	{
		id: 'p6-l2-q1',
		tags: ['p6/l2'],
		question:
			'Selon le Théorème 1.2, pour la perte quadratique L2, quel est le prédicteur optimal en x ?',
		options: [
			'La médiane conditionnelle de Y sachant X = x.',
			'Le mode conditionnel de Y sachant X = x.',
			"La moyenne empirique de l'échantillon d'entraînement.",
			'La moyenne conditionnelle m(x) = E[Y | X = x].'
		],
		answerIndex: 3,
		explanation:
			"Théorème 1.2 : la perte quadratique sélectionne la moyenne conditionnelle. La décomposition E[(Y - c)² | X = x] = E[(Y - m(x))² | X = x] + (m(x) - c)² montre que seul le second terme est pilotable, et qu'il est minimal (nul) uniquement pour c = m(x)."
	},
	{
		id: 'p6-l2-q2',
		tags: ['p6/l2'],
		question:
			"Dans la preuve du cas L2, pourquoi le terme croisé s'annule-t-il quand on développe (Y - c)² avec Y - c = (Y - m(x)) + (m(x) - c) ?",
		options: [
			'Parce que E[Y - m(x) | X = x] = E[Y | X = x] - m(x) = 0, par la définition même de m(x).',
			'Parce que Y est gaussienne conditionnellement à X.',
			"Parce que l'échantillon est i.i.d.",
			'Parce que la perte quadratique est strictement convexe.'
		],
		answerIndex: 0,
		explanation:
			"m(x) est défini comme E[Y | X = x], donc l'espérance conditionnelle de Y - m(x) s'annule : aucune hypothèse sur la loi de Y n'est nécessaire, en particulier pas de gaussien (preuve du Théorème 1.2, section « Perte quadratique : la moyenne conditionnelle »)."
	},
	{
		id: 'p6-l2-q3',
		tags: ['p6/l2'],
		question:
			"Dans la preuve du cas L1, la fonction g(c) = E[|Y - c| | X = x] admet la dérivée g'(c) = 2F(c) - 1. Que cela implique-t-il ?",
		options: [
			"L'optimum est atteint là où F(c) = 1, c'est-à-dire au maximum du support.",
			"L'optimum est atteint là où la densité f(c) est maximale, c'est-à-dire au mode conditionnel.",
			"L'optimum est atteint là où F(c) = 1/2, c'est-à-dire à la médiane conditionnelle, et g est convexe car g''(c) = 2f(c) ≥ 0.",
			"Il n'existe pas d'optimum sauf si Y | X = x est continue."
		],
		answerIndex: 2,
		explanation:
			"La condition g'(c) = 0 donne F(c) = 1/2, définition de la médiane conditionnelle ; la convexité g''(c) = 2f(c) ≥ 0 garantit qu'il s'agit bien d'un minimum global (preuve du Théorème 1.2, section « Perte absolue : la médiane conditionnelle »)."
	},
	{
		id: 'p6-l2-q4',
		tags: ['p6/l2'],
		question: 'Selon la leçon, quand la médiane conditionnelle peut-elle ne pas être unique ?',
		options: [
			'Jamais : la médiane est toujours unique pour toute distribution.',
			'Quand Y | X = x suit une loi discrète : tout un intervalle de valeurs peut vérifier F(c) = 1/2, et toutes atteignent le même risque L1 minimal.',
			"Uniquement quand la taille d'échantillon est impaire.",
			'Quand Y | X = x est gaussienne, en raison de la symétrie de la cloche.'
		],
		answerIndex: 1,
		explanation:
			"Le cartouche d'avertissement « La médiane n'est pas toujours unique » le signale pour les lois discrètes : la non-uniqueté ne remet pas en cause l'optimalité, toutes ces valeurs atteignant le même risque minimal (la leçon note au passage que la médiane empirique est souvent non unique quand la taille de l'échantillon est paire)."
	},
	{
		id: 'p6-l2-q5',
		tags: ['p6/l2'],
		question:
			'Sur une distribution conditionnelle à longue queue, que dit la leçon des deux prédicteurs optimaux ?',
		options: [
			'La moyenne et la médiane coïncident, en vertu de la loi des grands nombres.',
			"La moyenne est sensible aux valeurs extrêmes, tandis que la médiane y est robuste : c'est le prix et le bénéfice du passage de L2 à L1.",
			'Le prédicteur à perte quadratique est robuste à une observation très éloignée.',
			'La médiane minimise le risque quadratique, et la moyenne minimise le risque absolu.'
		],
		answerIndex: 1,
		explanation:
			"La section « Comparer les deux prédicteurs » souligne qu'une seule observation très éloignée peut déplacer la moyenne arbitrairement loin, alors que la médiane y est robuste — différence qui n'est pas anecdotique, mais qui a des conséquences directes sur la robustesse du prédicteur."
	},
	{
		id: 'p6-syn-q1',
		tags: ['p6/synthese'],
		question:
			'En classification binaire, pourquoi les risques conditionnels des deux décisions valent-ils respectivement r(1,x) = 1 - η(x) et r(0,x) = η(x) ?',
		options: [
			"Parce que Y | X = x suit une loi de Bernoulli de paramètre η(x) : prédire 1 se trompe exactement quand Y = 0, avec probabilité 1 - η(x), et prédire 0 se trompe quand Y = 1, avec probabilité η(x).",
			'Parce que la perte 0-1 est symétrique, les deux risques conditionnels valent η(x) en tout point x.',
			"Parce que η(x) est la probabilité a priori de la classe 1, qui ne dépend pas de x.",
			'Parce que le risque conditionnel mesure la probabilité de prédire juste : r(1,x) = η(x) et r(0,x) = 1 - η(x).'
		],
		answerIndex: 0,
		explanation:
			"Le bloc « Probabilité a posteriori » de part6/lesson1 note que Y | X = x suit une loi de Bernoulli de paramètre η(x) ; c'est ce qui donne directement r(1,x) = 1 - η(x) et r(0,x) = η(x) (Théorème 1.1)."
	},
	{
		id: 'p6-syn-q2',
		tags: ['p6/synthese'],
		question: "Quel enchaînement d'équivalences conduit à la règle de décision du Théorème 1.1 ?",
		options: [
			"r(1,x) ≤ r(0,x) si et seulement si η(x) ≤ 1 - η(x), c'est-à-dire η(x) ≤ 1/2 : on prédit 1 quand la classe 1 est minoritaire au point x.",
			"r(1,x) ≤ r(0,x) si et seulement si 1 - η(x) ≤ η(x), c'est-à-dire η(x) ≥ 1/2 : on prédit 1 exactement quand la classe 1 est la plus probable au point x.",
			"r(1,x) ≤ r(0,x) si et seulement si 1 - η(x) ≤ η(x), c'est-à-dire η(x) ≥ 1/3 : le seuil 1/3 découle de la perte 0-1.",
			"r(1,x) < r(0,x) si et seulement si η(x) > 1/2, c'est-à-dire si la classe 1 a la plus grande probabilité a priori, indépendamment de x."
		],
		answerIndex: 1,
		explanation:
			"Théorème 1.1, section « Le classifieur de Bayes » : on choisit 1 si et seulement si r(1,x) ≤ r(0,x), soit 1 - η(x) ≤ η(x), c'est-à-dire η(x) ≥ 1/2 — la règle « prédire la classe majoritaire » du cartouche « Interprétation du seuil »."
	},
	{
		id: 'p6-syn-q3',
		tags: ['p6/synthese'],
		question: 'Que signifie dire que le risque de Bayes R* est une borne irréductible ?',
		options: [
			"Aucun algorithme, aussi sophistiqué soit-il, même avec une infinité de données, ne peut atteindre un risque inférieur à R* : c'est la part du risque due au chevauchement intrinsèque des classes, pas à un manque de données ni à un mauvais choix de modèle.",
			'Aucun classifieur appris sur un échantillon fini ne peut atteindre R*, mais un algorithme doté de données illimitées peut le dépasser.',
			"R* ne peut être amélioré que si on change de perte : c'est la perte 0-1 qui rend le risque irréductible.",
			"Le risque de Bayes est irréductible car il ne dépend que de l'algorithme utilisé et jamais de la distribution P."
		],
		answerIndex: 0,
		explanation:
			"Section « Risque de Bayes et séparabilité » de part6/lesson1 : R* est une borne irréductible, due au chevauchement intrinsèque des deux classes, pas à un manque de données ou un mauvais choix de modèle."
	},
	{
		id: 'p6-syn-q4',
		tags: ['p6/synthese'],
		question: "Pourquoi le classifieur de Bayes h* n'est-il pas défini de manière unique ?",
		options: [
			"Parce que pour η(x) = 1/2, les deux décisions sont optimales, si bien qu'il existe toujours plusieurs classifieurs atteignant R*.",
			"Parce que η(x) n'est pas identifiable sans hypothèse de régularité sur la loi P.",
			"Parce que h* n'est défini de manière unique que presque sûrement par rapport à P_X : en un point x tel que P(X=x) = 0, modifier h(x) ne change pas le risque.",
			"Parce que le classifieur optimal dépend de l'ordre des observations de l'échantillon d'entraînement."
		],
		answerIndex: 2,
		explanation:
			"Panneau expert « Pourquoi le conditionnement suffit » (part6/lesson1) : la qualification « presque tout » est essentielle — quand P(X=x) = 0, modifier h(x) en ce point ne change rien, et h* n'est donc unique que presque sûrement par rapport à P_X."
	},
	{
		id: 'p6-syn-q5',
		tags: ['p6/synthese'],
		question: 'En un point x où η(x) = 1/2 exactement, que dit la leçon des décisions 0 et 1 ?',
		options: [
			'Les deux risques conditionnels sont égaux, r(1,x) = r(0,x) = 1/2 : les deux décisions sont optimales en x, et la règle énoncée (η(x) ≥ 1/2) fixe la convention en prédisant 1.',
			'Prédire 1 est strictement meilleur : le risque de prédire 1 vaut 0 en ce point.',
			"Les deux décisions sont sous-optimales : le risque minimal en x vaut 1/2 et aucun classifieur ne l'atteint.",
			"Le point x est un point de non-décision : le Théorème 1.1 n'assigne aucune valeur à h*(x) quand η(x) = 1/2."
		],
		answerIndex: 0,
		explanation:
			"À η(x) = 1/2, on a r(1,x) = 1 - η(x) = η(x) = r(0,x) : les deux risques sont égaux, donc les deux actions sont optimales ; l'énoncé du Théorème 1.1 (h*(x) = 1 si η(x) ≥ 1/2) fixe la convention de l'égalité en faveur de 1, sans changer le risque atteint."
	},
	{
		id: 'p6-syn-q6',
		tags: ['p6/synthese'],
		question:
			'Pourquoi minimiser le risque conditionnel r(h(x), x) pour presque tout x suffit-il à minimiser le risque global R(h) ?',
		options: [
			'Par le théorème de convergence dominée, qui garantit la convergence uniforme de r(h(X), X) vers r(h*(X), X).',
			"Parce que la perte 0-1 est convexe et que l'ensemble des classifieurs est compact.",
			"Parce que l'échantillon est i.i.d., ce qui rend R(h) une variable aléatoire de moyenne R(h*).",
			"Par la loi des espérances totales, R(h) = E_X[r(h(X), X)], et comme r(h(x), x) - r(h*(x), x) ≥ 0 pour presque tout x, l'écart R(h) - R(h*) est l'espérance d'un terme non négatif, donc non négatif."
		],
		answerIndex: 3,
		explanation:
			"Panneau expert « Pourquoi le conditionnement suffit » (part6/lesson1) : par la loi des espérances totales R(h) = E_X[r(h(X), X)], et l'optimalité ponctuelle de h* donne r(h(x), x) - r(h*(x), x) ≥ 0 presque sûrement, si bien que l'écart global est l'espérance d'un terme non négatif — sans hypothèse de régularité sur P."
	},
	{
		id: 'p6-syn-q7',
		tags: ['p6/synthese'],
		question:
			"Quelle est l'expression exacte de l'écart entre le risque quadratique d'un prédicteur h et le risque optimal R(h*) ?",
		options: [
			'R(h) - R(h*) = E[(m(X) - h(X))²] ≥ 0, avec égalité si et seulement si h(x) = m(x) pour presque tout x.',
			"R(h) - R(h*) = E[(m(X) - h(X))²] ≥ 0, mais l'écart peut s'annuler pour un h ne coïncidant avec m que sur un ensemble de mesure nulle.",
			"R(h) - R(h*) = E[(Y - h(X))²] - E[(Y - m(X))²] = E[(h(X) - E[Y])²], l'écart dépendant de la moyenne marginale de Y.",
			"R(h) - R(h*) = E[(m(X) - h(X))²] + E[Var(Y | X)], avec égalité si et seulement si h = m : le bruit résiduel compte dans l'écart."
		],
		answerIndex: 0,
		explanation:
			"Démonstration du Théorème 1.2, section « Perte quadratique : la moyenne conditionnelle » : en reprenant la décomposition avec c = h(x) puis en prenant l'espérance sur X, on obtient R(h) - R(h*) = E[(m(X) - h(X))²], nul si et seulement si h(x) = m(x) pour presque tout x."
	},
	{
		id: 'p6-syn-q8',
		tags: ['p6/synthese'],
		question:
			"Dans la décomposition E[(Y - c)² | X = x] = E[(Y - m(x))² | X = x] + (m(x) - c)², quel terme est irréductible, et pourquoi ?",
		options: [
			"Le terme (m(x) - c)² : c'est lui qui encode le bruit résiduel de Y autour de sa moyenne conditionnelle.",
			"Le terme E[(Y - m(x))² | X = x] : c'est la variance conditionnelle de Y autour de sa moyenne conditionnelle, il ne dépend pas de c et aucun prédicteur ne peut l'éliminer.",
			'Les deux termes sont irréductibles : la perte quadratique ne peut être annulée en aucun cas.',
			'Le risque conditionnel E[(Y - c)² | X = x] tout entier, qui est fixe une fois x fixé.'
		],
		answerIndex: 1,
		explanation:
			"Section « Perte quadratique : la moyenne conditionnelle » (preuve du Théorème 1.2) : le premier terme, la variance résiduelle de Y autour de sa moyenne conditionnelle, « ne dépend pas de c » — c'est la part irréductible du risque ; seul le second terme (m(x) - c)² est pilotable, et il est nul uniquement pour c = m(x)."
	},
	{
		id: 'p6-syn-q9',
		tags: ['p6/synthese'],
		question:
			"Quelle hypothèse la preuve du cas L1 du Théorème 1.2 pose-t-elle pour que l'argument g'(c) = 2F(c) - 1 soit valide ?",
		options: [
			"L'existence d'une densité conditionnelle f_{Y|x} : la preuve écrit g(c) comme intégrale, puis dérive sous le signe intégrale (théorème de Leibniz) pour obtenir g'(c) = 2F(c) - 1.",
			'La convexité conjointe de la perte |y - c| en (y, c).',
			'Que Y | X = x ait une moyenne conditionnelle nulle.',
			'Que la fonction de répartition F_{Y|x} soit strictement croissante en tout point.'
		],
		answerIndex: 0,
		explanation:
			"Préambule de la preuve du cas L1, section « Perte absolue : la médiane conditionnelle » : « En supposant que Y | X = x admet une densité conditionnelle f_{Y|x} », on sépare l'intégrale et on dérive sous le signe intégrale par le théorème de Leibniz pour obtenir g'(c) = 2F_{Y|x}(c) - 1."
	},
	{
		id: 'p6-syn-q10',
		tags: ['p6/synthese'],
		question:
			"Selon le cartouche « La médiane n'est pas toujours unique », quelle convention la leçon cite-t-elle pour trancher la non-uniqueté de la médiane quand Y | X = x a une loi discrète ?",
		options: [
			"Choisir la moyenne des deux valeurs médianes, comme pour la médiane empirique d'un échantillon de taille paire.",
			'Choisir la valeur la plus proche de la moyenne conditionnelle m(x).',
			"Par exemple, choisir la plus petite valeur c atteignant le seuil F_{Y|x}(c) = 1/2 — la non-uniqueté ne remet pas en cause l'optimalité, toutes ces valeurs atteignant le même risque L1 minimal.",
			'La médiane est toujours unique pour une loi discrète : la question de la convention ne concerne que les lois continues.'
		],
		answerIndex: 2,
		explanation:
			"Cartouche « La médiane n'est pas toujours unique » (part6/lesson2) : pour une loi discrète, tout un intervalle de c peut vérifier F_{Y|x}(c) = 1/2 exactement, et la médiane n'est définie qu'à un choix de convention près — par exemple la plus petite valeur atteignant le seuil — sans remettre en cause l'optimalité, toutes ces valeurs atteignant le même risque L1 minimal."
	},
	{
		id: 'p6-syn-q11',
		tags: ['p6/synthese'],
		question:
			"Que note la leçon part6/lesson2 à propos de la médiane empirique calculée sur un échantillon de données ?",
		options: [
			"Elle est souvent non unique, notamment lorsque la taille de l'échantillon est paire.",
			"Elle est toujours unique dès que la taille de l'échantillon dépasse 100.",
			'Elle coïncide toujours avec la médiane conditionnelle vraie de la population.',
			"Elle n'est définie que pour les échantillons de taille impaire."
		],
		answerIndex: 0,
		explanation:
			"Note « Note sur la médiane empirique » (part6/lesson2) : la médiane empirique (calculée sur un échantillon de données) est souvent non unique, notamment lorsque la taille de l'échantillon est paire."
	},
	{
		id: 'p6-syn-q12',
		tags: ['p6/synthese'],
		question:
			"Selon la section « Comparer les deux prédicteurs », quelle est la différence de robustesse entre moyenne et médiane conditionnelles ?",
		options: [
			'Les deux prédicteurs sont également sensibles aux valeurs extrêmes, la sensibilité étant inhérente au conditionnement sur X.',
			"Une seule observation très éloignée peut déplacer la moyenne arbitrairement loin, tandis que la médiane y est robuste : c'est le prix et le bénéfice du passage de L2 à L1.",
			'La médiane est sensible aux valeurs extrêmes car elle dépend de la fonction de répartition, tandis que la moyenne est robuste.',
			"La moyenne est robuste par la loi des grands nombres, la médiane ne l'étant que pour les lois symétriques."
		],
		answerIndex: 1,
		explanation:
			"Section « Comparer les deux prédicteurs » (part6/lesson2) : la moyenne est sensible aux valeurs extrêmes (une seule observation très éloignée peut la déplacer arbitrairement loin), alors que la médiane y est robuste — c'est le prix, et le bénéfice, du passage de L2 à L1."
	},
	{
		id: 'p6-syn-q13',
		tags: ['p6/synthese'],
		question:
			'Quel est le principe commun aux trois cas (perte 0-1, L2, L1) traités dans la Partie VI ?',
		options: [
			'Le choix de la perte détermine seul le prédicteur optimal, via la même logique de minimisation ponctuelle du risque conditionnel : la perte 0-1 donne la classe majoritaire, L2 la moyenne conditionnelle, L1 la médiane conditionnelle.',
			'Les trois pertes conduisent au même prédicteur optimal, la différence entre elles n\'affectant que la vitesse de convergence.',
			'Chaque perte exige une hypothèse de régularité supplémentaire sur η, de plus en plus forte de la perte 0-1 à L1.',
			"Le prédicteur optimal dépend de la taille de l'échantillon n, la perte ne jouant qu'un rôle secondaire."
		],
		answerIndex: 0,
		explanation:
			"Cartouche « Retenir » de part6/lesson2 : « Le choix de la perte détermine seul le prédicteur optimal : L2 sélectionne la moyenne conditionnelle (sensible aux valeurs extrêmes), L1 sélectionne la médiane conditionnelle (robuste) », sur la même logique de minimisation ponctuelle du risque conditionnelle déjà vue au Théorème 1.1 pour la perte 0-1."
	},
	{
		id: 'p6-syn-q14',
		tags: ['p6/synthese'],
		question: 'Quelles sont les deux faces du risque irréductible, en classification et en régression ?',
		options: [
			"En classification, R* = E[min(η(X), 1 - η(X))], le chevauchement des classes ; en régression, la variance conditionnelle E[(Y - m(x))² | X = x] espérée sur X : aucun prédicteur ne peut éliminer l'un ni l'autre.",
			"En classification, R* = E[η(X)(1 - η(X))], le produit des deux probabilités ; en régression, la variance marginale Var(Y) de Y.",
			"En classification, le terme d'approximation de la classe choisie ; en régression, le terme d'estimation de l'algorithme.",
			'En classification, E[max(η(X), 1 - η(X))], la probabilité de prédire juste ; en régression, la moyenne conditionnelle m(x) elle-même.'
		],
		answerIndex: 0,
		explanation:
			"En classification, R* = E[min(η(X), 1 - η(X))] (part6/lesson1, section « Risque de Bayes et séparabilité ») ; en régression, la décomposition biais-variance conditionnelle (preuve du Théorème 1.2) identifie la variance résiduelle E[(Y - m(x))² | X = x] comme la part irréductible — un bruit qu'aucun prédicteur, aussi bon soit-il, ne peut éliminer (cartouche « Biais-variance, version conditionnelle »)."
	},
	{
		id: 'p6-syn-q15',
		tags: ['p6/synthese'],
		question:
			"Quel « fil conducteur » la leçon part6/lesson2 identifie-t-elle comme reliant classification, régression, consistance et généralisation ?",
		options: [
			"Conditionner sur X = x réduit un problème global à une minimisation ponctuelle du risque conditionnel en chaque point : cette logique de décomposition par conditionnement est le fil conducteur vers les leçons sur la consistance et la généralisation.",
			'Le théorème central limite, qui justifie la normalité des estimateurs quand la dimension grandit.',
			"La convexité de la perte, qui garantit l'existence d'un minimum global pour toute distribution.",
			"L'hypothèse d'indépendance des observations, sans laquelle aucune des leçons suivantes ne tiendrait."
		],
		answerIndex: 0,
		explanation:
			"Cartouche « Retenir » de part6/lesson2 : « Cette logique — décomposer le risque par conditionnement, puis minimiser point par point — est le fil conducteur qui reliera aussi les leçons sur la consistance et la généralisation »."
	}
];
