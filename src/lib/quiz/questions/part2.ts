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
	},
	{
		id: 'p2-rkhs-q1',
		tags: ['p2/rkhs'],
		question:
			'Un noyau K symétrique et semi-défini positif sur un ensemble X implique… (théorème de Moore–Aronszajn, forme complète)',
		options: [
			"l'existence d'un unique RKHS H_K dont K est le noyau reproduisant",
			'que K est nécessairement continu',
			"qu'il existe plusieurs espaces de Hilbert distincts portant K",
			'que K est nécessairement universel'
		],
		answerIndex: 0,
		explanation:
			'K symétrique et PSD ⟺ il existe un unique espace de Hilbert de fonctions H_K pour lequel K est le noyau reproduisant (construction : complétion de span{K(·,x)}). Continuité et universalité ne sont pas garanties — ce sont des propriétés supplémentaires.'
	},
	{
		id: 'p2-rkhs-q2',
		tags: ['p2/rkhs'],
		question:
			'Théorème du représentant : sous quelle condition sur g tout minimiseur de « E (valeurs aux xᵢ) + g(‖f‖_H) » s’écrit Σᵢ αᵢ K(·, xᵢ) ?',
		options: ['g strictement croissante sur [0, +∞)', 'g convexe', 'E convexe', 'K universel'],
		answerIndex: 0,
		explanation:
			"E est indifférente à la composante de f orthogonale à span{K(·, xᵢ)} (la propriété reproduisante ne voit que les valeurs aux xᵢ) ; g strictement croissante rend cette composante strictement pénalisée, donc nulle au minimiseur. La convexité de g ou de E n'est pas la condition, et l'universalité n'intervient pas."
	},
	{
		id: 'p2-rkhs-q3',
		tags: ['p2/rkhs'],
		question:
			'KRR avec l’objectif (1/n)·Σᵢ (yᵢ − f(xᵢ))² + λ·‖f‖²_HK : la solution canonique est…',
		options: [
			'α* = (K + nλI)⁻¹ y',
			'α* = (K + λI)⁻¹ y',
			'α* = (1/n)(K + λI)⁻¹ y',
			'α* = K(K + λI)⁻¹ y'
		],
		answerIndex: 0,
		explanation:
			'Le théorème du représentant réduit à α ∈ ℝⁿ et ‖f‖² = αᵀKα ; l’équation du premier ordre donne K(K + nλI)α = Ky, d’où α* = (K + nλI)⁻¹y. Le facteur n vient du 1/n de la perte — les autres écritures correspondent à d’autres conventions d’objectif (scikit-learn omet le 1/n).'
	},
	{
		id: 'p2-rkhs-q4',
		tags: ['p2/rkhs'],
		question: 'Lequel de ces noyaux est universel sur un compact de ℝᵈ ?',
		options: [
			'le gaussien exp(−‖x − x′‖² / (2σ²))',
			'le noyau linéaire xᵀx′',
			'tout noyau symétrique semi-défini positif',
			'le noyau boîte 1{‖x − x′‖ ≤ r}'
		],
		answerIndex: 0,
		explanation:
			"D'après Bochner + Micchelli–Xu–Zhang (2006) : un noyau invariant par translation est universel si et seulement si sa mesure spectrale est strictement positive ; la transformée de Fourier du noyau gaussien est une densité gaussienne strictement positive partout. Le noyau linéaire a un RKHS fini (fonctions affines), et le noyau boîte n'est pas continu."
	},
	{
		id: 'p2-rkhs-q5',
		tags: ['p2/rkhs'],
		question:
			'Pour que la KRR à noyau universel soit consistante en L²(μ) quand n → ∞, il faut que le paramètre λₙ vérifie…',
		options: [
			'λₙ → 0 et n·λₙ → +∞',
			'λₙ → +∞',
			'λₙ constant > 0',
			'n·λₙ → 0'
		],
		answerIndex: 0,
		explanation:
			'λₙ → 0 fait disparaître le biais (sinon f* → 0) ; n·λₙ → +∞ garde assez de régularisation pour contrôler le bruit (variance). C’est le même arbitrage biais/variance que pour le k-NN (Partie VIII, leçon 2), avec λₙ = n^(−1/3) comme exemple valide.'
	}
];
