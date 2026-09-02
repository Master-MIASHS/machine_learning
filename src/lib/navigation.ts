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
	{ path: '/part1/exercices', title: 'Exercices', part: 1 },
	{ path: '/part1/practice/travaux-pratiques', title: 'Travaux pratiques', part: 1 },

	// Partie II — Classification supervisée (contenu à venir)
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

	// Partie III — Clustering (contenu à venir)
	{ path: '/part3/lesson1', title: 'Clustering hiérarchique', part: 3 },
	{ path: '/part3/lesson2', title: 'K-moyennes & évaluation', part: 3 },
	{ path: '/part3/exercices', title: 'Exercices', part: 3 },
	{ path: '/part3/practice/travaux-pratiques', title: 'Travaux pratiques', part: 3 },

	// Partie IV — Régularisation
	{ path: '/part4/lesson1', title: 'Méthodes ensemblistes et Bagging', part: 4 },
	{ path: '/part4/lesson2', title: 'Random Forest & sélection de features', part: 4 },
	{ path: '/part4/lesson3', title: 'Boosting (AdaBoost, Gradient Boosting)', part: 4 },
	{ path: '/part4/lesson4', title: 'Régularisation L1/L2/Elastic Net', part: 4 },
	{ path: '/part4/exercices', title: 'Exercices', part: 4 },
	{ path: '/part4/practice/travaux-pratiques', title: 'Travaux pratiques', part: 4 },

	// Partie V — Prédiction d'ensembles
	{ path: '/part5/lesson1', title: 'Classification Top-K', part: 5 },
	{ path: '/part5/lesson2', title: 'Prédiction conformelle', part: 5 },
	{ path: '/part5/lesson3', title: 'Intervalles de prédiction', part: 5 },
	{ path: '/part5/exercices', title: 'Exercices', part: 5 },

	// Partie VI – Bayes optimum
	{ path: '/part6/lesson1', title: 'Classifieur optimal', part: 6 },
	{ path: '/part6/lesson2', title: 'Régression optimale', part: 6 },
	{ path: '/part6/exercices', title: 'Exercices', part: 6 },

	// Partie VII – Convergence
	{ path: '/part7/lesson1', title: 'Convergence', part: 7 },
	{ path: '/part7/lesson2', title: 'Consistance k-NN', part: 7 },
	{ path: '/part7/exercices', title: 'Exercices', part: 7 },

	// Part VIII – Généralisation
	{ path: '/part8/lesson1', title: 'Concentration et risque empirique', part: 8 },
	{ path: '/part8/lesson2', title: 'Généralisation pour une classe finie', part: 8 },
	{
		path: '/part8/lesson3',
		title: 'Dimension VC, Sauer-Shelah et SVM',
		part: 8
	},
	{
		path: '/part8/lesson4',
		title: 'Limites de VC et double descente',
		part: 8
	},
	{ path: '/part8/exercices', title: 'Exercices', part: 8 },

	// Partie IX – Fonctions de perte
	{ path: '/part9/lesson1', title: 'De la perte 0-1 aux pertes proxy', part: 9 },
	{ path: '/part9/lesson2', title: 'Calibration des pertes convexes', part: 9 },
	{ path: '/part9/lesson3', title: 'Décomposition de l’erreur', part: 9 },
	{ path: '/part9/exercices', title: 'Exercices', part: 9 }
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
	1: 'Partie I — Optimisation',
	2: 'Partie II — Classification supervisée',
	3: 'Partie III — Clustering',
	4: 'Partie IV — Régularisation',
	5: 'Partie V — Set-valued',
	6: 'Partie VI — Optimum de Bayes',
	7: 'Partie VII — Consistance',
	8: 'Partie VIII — Généralisation',
	9: 'Partie IX — Fonctions de perte'
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
