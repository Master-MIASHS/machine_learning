import type { QuizQuestion } from '../types.js';

export const PART9: QuizQuestion[] = [
	{
		id: 'p9-l1-q1',
		tags: ['p9/l1'],
		question:
			"Pourquoi la leçon dit-elle que la perte 0-1 n'est pas directement optimisable par descente de gradient ?",
		options: [
			"Parce qu'elle n'est pas bornée",
			"Parce qu'elle est non convexe, discontinue et que son gradient est nul presque partout",
			"Parce qu'elle dépend de la dimension VC",
			"Parce qu'elle est trop facile à calculer"
		],
		answerIndex: 1,
		explanation: 'Ces propriétés empêchent un gradient de fournir une direction de descente utile.'
	},
	{
		id: 'p9-l1-q2',
		tags: ['p9/l1'],
		question: 'Si y = +1 et f(x) = -3, la marge t = y f(x) vaut :',
		options: ['-3', '3', '0', '+1'],
		answerIndex: 0,
		explanation:
			'La marge est négative, ce qui signifie que le signe de f(x) est opposé à y et que le classifieur se trompe.'
	},
	{
		id: 'p9-l1-q3',
		tags: ['p9/l1'],
		question: "La perte charnière utilisée par le SVM s'écrit :",
		options: ['log(1 + exp(-t))', 'exp(-t)', 'max(0, 1 - y f(x))', '(1 - y f(x))²'],
		answerIndex: 2,
		explanation: 'La leçon associe la charnière max(0, 1 - y f(x)) au SVM.'
	},
	{
		id: 'p9-l1-q4',
		tags: ['p9/l1'],
		question: 'La perte logistique et la cross-entropy sont :',
		options: [
			'deux pertes sans rapport avec la marge',
			'identiques uniquement pour les réseaux très profonds',
			'deux approximations différentes de la perte 0-1',
			'identiques à un changement de convention près entre étiquettes -1/+1 et 0/1'
		],
		answerIndex: 3,
		explanation:
			'La leçon montre que la cross-entropy redonne la perte logistique sous ce changement de convention.'
	},
	{
		id: 'p9-l2-q1',
		tags: ['p9/l2'],
		question:
			"Pour une perte convexe positive, le Théorème 4.1 affirme qu'elle est calibrée si et seulement si :",
		options: [
			"phi'(0) > 0",
			'phi(0) = 0',
			"elle est différentiable en 0 et phi'(0) < 0",
			'C_phi(0, eta) est toujours linéaire'
		],
		answerIndex: 2,
		explanation: "C'est le critère local de calibration de Bartlett, Jordan et McAuliffe (2006)."
	},
	{
		id: 'p9-l2-q2',
		tags: ['p9/l2'],
		question: "Dans la preuve, la dérivée du risque conditionnel C_phi en 0 s'écrit :",
		options: ["(2 eta - 1) phi'(0)", "eta phi'(0)", "phi'(0) / (2 eta - 1)", "(1 - 2 eta) phi'(0)"],
		answerIndex: 0,
		explanation:
			"Ce signe dépend de (2 eta - 1) et de phi'(0), ce qui place le minimiseur du bon côté de 0."
	},
	{
		id: 'p9-l2-q3',
		tags: ['p9/l2'],
		question: 'Pour la perte logistique, la pente en 0 vaut :',
		options: ['-1', '-2', '0', '-1/2'],
		answerIndex: 3,
		explanation: "La leçon calcule phi'(t) = -exp(-t)/(1 + exp(-t)), donc phi'(0) = -1/2."
	},
	{
		id: 'p9-l2-q4',
		tags: ['p9/l2'],
		question: "La perte charnière est calibrée malgré son point d'angle parce que :",
		options: [
			"son point d'angle est en 0",
			"son point d'angle est en 1, donc elle est différentiable en 0 avec une pente négative",
			'sa pente en 0 est positive',
			'elle vaut 0 pour toutes les marges'
		],
		answerIndex: 1,
		explanation:
			"La leçon souligne que la charnière a son point d'angle en t = 1, pas en 0, et que sa pente en 0 est -1."
	},
	{
		id: 'p9-l3-q1',
		tags: ['p9/l3'],
		question: 'Dans la décomposition A + B + C du Théorème 4.2, le terme A correspond à :',
		options: [
			"l'écart d'approximation entre le minimiseur global et le classifieur de Bayes",
			"l'écart d'estimation dû à l'utilisation d'un échantillon fini",
			'le coût de la restriction à la classe F',
			'la variance du gradient stochastique'
		],
		answerIndex: 1,
		explanation:
			"A mesure l'écart entre le modèle appris sur l'échantillon et le meilleur modèle de la classe pour le phi-risque."
	},
	{
		id: 'p9-l3-q2',
		tags: ['p9/l3'],
		question: "Le terme B s'annule dès que :",
		options: [
			'f** ∈ F',
			"phi'(0) > 0",
			"la taille de l'échantillon est petite",
			'le terme A est négatif'
		],
		answerIndex: 0,
		explanation:
			"B mesure le coût de la restriction à F ; la leçon indique qu'il est nul si le minimiseur global f** appartient à F."
	},
	{
		id: 'p9-l3-q3',
		tags: ['p9/l3'],
		question: "Le terme C s'annule lorsque :",
		options: [
			'f** ∈ F',
			"la taille de l'échantillon est grande",
			'F est une classe finie',
			'la perte phi est calibrée'
		],
		answerIndex: 3,
		explanation:
			"C mesure l'écart entre le minimiseur global du phi-risque et le classifieur de Bayes ; une perte calibrée rend ce terme nul."
	},
	{
		id: 'p9-l3-q4',
		tags: ['p9/l3'],
		question: "Si phi est calibrée et si f** ∈ F, l'excès de risque 0-1 se réduit à :",
		options: ['A + B', 'B + C', 'A seul', 'A + C'],
		answerIndex: 2,
		explanation: "Dans ce cas favorable, B et C sont nuls, il ne reste que le terme d'estimation A."
	}
];
