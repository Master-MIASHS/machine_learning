// Source of truth for all navigation — used by Sidebar, progress tracking, and page metadata
import { resolve } from '$app/paths';
import type { RouteId } from '$app/types';

export interface PageMeta {
	path: RouteId;
	title: string;
	part: number | null; // null for home and intro
	index: number | null;
	expert?: boolean;
	readonly resolvedPath: string;
}

// 1. Raw static definitions
const RAW_PAGES = [
	{ path: '/', title: 'Accueil', part: null },
	{ path: '/intro', title: 'Introduction', part: null },

	// Partie I — Optimisation
	{ path: '/part1/lesson1', title: "Conditions d'un minimum", part: 1 },
	{ path: '/part1/lesson2', title: "Fonctions d'optimisation en ML", part: 1 },
	{ path: '/part1/lesson3', title: 'Descente de gradient & accélération', part: 1 },
	{
		path: '/part1/lesson3-adam',
		title: 'Adam : comprendre l’optimiseur adaptatif',
		part: 1,
		expert: true
	},
	{ path: '/part1/lesson4', title: 'SGD, CD & Newton', part: 1 },
	{ path: '/part1/quiz', title: 'Quiz de synthèse', part: 1 },
	{ path: '/part1/exercices', title: 'Exercices', part: 1 },
	{ path: '/part1/practice/travaux-pratiques', title: 'Travaux pratiques', part: 1 },

	// Partie II — Classification supervisée
	{
		path: '/part2/lesson1',
		title: 'Cadre de l’apprentissage supervisé & k-NN',
		part: 2
	},
	{
		path: '/part2/lesson2',
		title: 'Classifieurs linéaires & régression logistique',
		part: 2
	},
	{ path: '/part2/lesson3', title: 'Arbres de décision', part: 2 },
	{ path: '/part2/lesson4', title: 'Support Vector Machines (SVM)', part: 2 },
	{ path: '/part2/exercices', title: 'Exercices', part: 2 },
	{ path: '/part2/practice/travaux-pratiques', title: 'Travaux pratiques', part: 2 },

	// Partie III — Clustering
	{ path: '/part3/lesson1', title: 'Clustering hiérarchique', part: 3 },
	{ path: '/part3/lesson2', title: 'K-moyennes & évaluation', part: 3 },
	{ path: '/part3/exercices', title: 'Exercices', part: 3 },
	{ path: '/part3/practice/travaux-pratiques', title: 'Travaux pratiques', part: 3 },

	// Partie IV — Régression linéaire
	{ path: '/part4/lesson1', title: 'Le modèle linéaire et les moindres carrés', part: 4 },
	{ path: '/part4/lesson2', title: 'Le modèle linéaire général : ANOVA et ANCOVA', part: 4 },
	{ path: '/part4/lesson3', title: 'Inférence dans le modèle gaussien', part: 4 },
	{ path: '/part4/lesson4', title: 'Validation et diagnostic du modèle', part: 4 },
	{ path: '/part4/lesson5', title: 'Choix de modèle et sélection de variables', part: 4 },
	{ path: '/part4/quiz', title: 'Quiz de synthèse', part: 4 },
	{ path: '/part4/exercices', title: 'Exercices', part: 4 },
	{ path: '/part4/practice/travaux-pratiques', title: 'Travaux pratiques', part: 4 },

	// Partie V — Régularisation
	{ path: '/part5/lesson1', title: 'Méthodes ensemblistes et Bagging', part: 5 },
	{ path: '/part5/lesson2', title: 'Random Forest & sélection de features', part: 5 },
	{ path: '/part5/lesson3', title: 'Boosting (AdaBoost, Gradient Boosting)', part: 5 },
	{ path: '/part5/lesson4', title: 'Régularisation L1/L2/Elastic Net', part: 5 },
	{ path: '/part5/quiz', title: 'Quiz de synthèse', part: 5 },
	{ path: '/part5/exercices', title: 'Exercices', part: 5 },
	{ path: '/part5/practice/travaux-pratiques', title: 'Travaux pratiques', part: 5 },

	// Partie VI — Set-valued
	{ path: '/part6/lesson1', title: 'Classification Top-K', part: 6 },
	{ path: '/part6/lesson2', title: 'Prédiction conformelle', part: 6 },
	{ path: '/part6/lesson3', title: 'Intervalles de prédiction', part: 6 },
	{ path: '/part6/quiz', title: 'Quiz de synthèse', part: 6 },
	{ path: '/part6/exercices', title: 'Exercices', part: 6 },

	// Partie VII — Optimum de Bayes
	{ path: '/part7/lesson1', title: 'Classifieur optimal', part: 7 },
	{ path: '/part7/lesson2', title: 'Régression optimale', part: 7 },
	{ path: '/part7/quiz', title: 'Quiz de synthèse', part: 7 },
	{ path: '/part7/exercices', title: 'Exercices', part: 7 },

	// Partie VIII — Consistance
	{ path: '/part8/lesson1', title: 'Convergence', part: 8 },
	{ path: '/part8/lesson2', title: 'Consistance k-NN', part: 8 },
	{ path: '/part8/quiz', title: 'Quiz de synthèse', part: 8 },
	{ path: '/part8/exercices', title: 'Exercices', part: 8 },

	// Partie IX — Généralisation
	{ path: '/part9/lesson1', title: 'Concentration et risque empirique', part: 9 },
	{ path: '/part9/lesson2', title: 'Généralisation pour une classe finie', part: 9 },
	{
		path: '/part9/lesson3',
		title: 'Dimension VC, Sauer-Shelah et SVM',
		part: 9
	},
	{
		path: '/part9/lesson4',
		title: 'Limites de VC et double descente',
		part: 9
	},
	{ path: '/part9/quiz', title: 'Quiz de synthèse', part: 9 },
	{ path: '/part9/exercices', title: 'Exercices', part: 9 },

	// Partie X — Fonctions de perte
	{ path: '/part10/lesson1', title: 'De la perte 0-1 aux pertes proxy', part: 10 },
	{ path: '/part10/lesson2', title: 'Calibration des pertes convexes', part: 10 },
	{ path: '/part10/lesson3', title: 'Décomposition de l’erreur', part: 10 },
	{ path: '/part10/quiz', title: 'Quiz de synthèse', part: 10 },
	{ path: '/part10/exercices', title: 'Exercices', part: 10 }
] as const;

// 2. Hydrate indices and inject runtime resolved path property
export const PAGES: PageMeta[] = RAW_PAGES.map((page, idx) => ({
	...page,
	index: idx,
	get resolvedPath() {
		return (resolve as (route: string, params?: unknown) => string)(page.path);
	}
}));

export const PART_NAMES: Record<number, string> = {
	1: 'I — Optimisation',
	2: 'II — Classification supervisée',
	3: 'III — Clustering',
	4: 'IV — Régression linéaire',
	5: 'V — Régularisation',
	6: 'VI — Set-valued',
	7: 'VII — Optimum de Bayes',
	8: 'VIII — Consistance',
	9: 'IX — Généralisation',
	10: 'X — Fonctions de perte'
};

export function getPageByPath(path: string): PageMeta | undefined {
	return PAGES.find((p) => p.path === path);
}

export function getAdjacentPages(
	currentPath: string,
	includeExpert: boolean
): { prev: PageMeta | undefined; next: PageMeta | undefined } {
	const visible = PAGES.filter((p) => includeExpert || !p.expert);
	const idx = visible.findIndex((p) => p.path === currentPath);
	if (idx < 0) return { prev: undefined, next: undefined };
	return { prev: visible[idx - 1], next: visible[idx + 1] };
}
