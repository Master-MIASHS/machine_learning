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
	}
];
