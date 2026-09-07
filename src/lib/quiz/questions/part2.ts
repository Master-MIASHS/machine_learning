import type { QuizQuestion } from '../types.js';

export const PART2: QuizQuestion[] = [
	{
		id: 'p2-l1-a-q1',
		tags: ['p2/l1/a'],
		question: '« Chat ou non ? » — décider si une photo est une photo de chat',
		options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
		answerIndex: 0,
		explanation:
			'Les photos sont associées à des étiquettes (CHAT / NON-CHAT) : le modèle apprend à prédire l’étiquette à partir des données.'
	},
	{
		id: 'p2-l1-a-q2',
		tags: ['p2/l1/a'],
		question: 'Reconnaissance de chiffres manuscrits',
		options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
		answerIndex: 0,
		explanation:
			'Chaque chiffre manuscrit est fourni avec son étiquette (le chiffre) : données étiquetées, donc apprentissage supervisé.'
	},
	{
		id: 'p2-l1-a-q3',
		tags: ['p2/l1/a'],
		question: 'Segmentation de marché',
		options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
		answerIndex: 1,
		explanation:
			"On cherche à identifier des groupes d'usagers au comportement similaire, sans étiquettes fournies : c'est du clustering, un problème non supervisé (Partie III)."
	},
	{
		id: 'p2-l1-a-q4',
		tags: ['p2/l1/a'],
		question: 'Prédiction de clics',
		options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
		answerIndex: 0,
		explanation:
			"On prédit un clic (ou non) à partir des données d'exposition : les étiquettes binaires sont observées, donc apprentissage supervisé."
	},
	{
		id: 'p2-l1-a-q5',
		tags: ['p2/l1/a'],
		question: "Segmentation d'image",
		options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
		answerIndex: 1,
		explanation:
			'Illustration d’une segmentation non supervisée : les pixels sont regroupés sans étiquettes fournies. Une segmentation supervisée est aussi possible.'
	},
	{
		id: 'p2-l1-a-q6',
		tags: ['p2/l1/a'],
		question: "Compression d'image",
		options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
		answerIndex: 1,
		explanation:
			'Illustration d’une compression par clustering (k-moyennes), donc non supervisée ; d’autres méthodes de compression existent.'
	},
	{
		id: 'p2-l1-b-q1',
		tags: ['p2/l1/b'],
		question: 'Identifier en quelle langue un texte est écrit',
		options: ['Régression', 'Classification'],
		answerIndex: 1,
		explanation: 'Classification multi-classe : le label est la langue du texte.'
	},
	{
		id: 'p2-l1-b-q2',
		tags: ['p2/l1/b'],
		question: 'Identifier si une transaction financière est frauduleuse ou non',
		options: ['Régression', 'Classification'],
		answerIndex: 1,
		explanation: 'Classification binaire : fraude / non-fraude.'
	},
	{
		id: 'p2-l1-b-q3',
		tags: ['p2/l1/b'],
		question: 'Prédire la probabilité de développer une maladie',
		options: ['Régression', 'Classification'],
		answerIndex: 0,
		explanation: 'Régression : la sortie est une quantité réelle (une probabilité dans [0, 1]).'
	},
	{
		id: 'p2-l1-b-q4',
		tags: ['p2/l1/b'],
		question: "Prédire l'espèce d'une plante donnée",
		options: ['Régression', 'Classification'],
		answerIndex: 1,
		explanation: 'Classification multi-classe : le label est l’espèce.'
	},
	{
		id: 'p2-l1-b-q5',
		tags: ['p2/l1/b'],
		question: "Prédire le prix d'une action en bourse",
		options: ['Régression', 'Classification'],
		answerIndex: 0,
		explanation: 'Régression : la sortie est un prix, une quantité réelle.'
	},
	{
		id: 'p2-l1-b-q6',
		tags: ['p2/l1/b'],
		question: 'Prédire le nombre de clics sur un lien',
		options: ['Régression', 'Classification'],
		answerIndex: 0,
		explanation: 'Régression : le nombre de clics est une quantité réelle (non finie en général).'
	}
];
