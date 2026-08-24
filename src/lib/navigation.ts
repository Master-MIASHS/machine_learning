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
	{ path: '/part1/lesson4', title: 'SGD, CD & Newton', part: 1 },
	{ path: '/part1/exercices', title: 'Exercices', part: 1 },
	{ path: '/part1/practice/travaux-pratiques', title: 'Travaux pratiques', part: 1 },

	// Partie II — Régularisation
	{ path: '/part2/lesson1', title: 'Méthodes ensemblistes et Bagging', part: 2 },
	{ path: '/part2/lesson2', title: 'Random Forest & sélection de features', part: 2 },
	{ path: '/part2/lesson3', title: 'Boosting (AdaBoost, Gradient Boosting)', part: 2 },
	{ path: '/part2/lesson4', title: 'Régularisation L1/L2/Elastic Net', part: 2 },
	{ path: '/part2/exercices', title: 'Exercices', part: 2 },
	{ path: '/part2/practice/travaux-pratiques', title: 'Travaux pratiques', part: 2 },

	// Partie III — Prédiction d'ensembles
	{ path: '/part3/lesson1', title: 'Classification Top-K', part: 3 },
	{ path: '/part3/lesson2', title: 'Prédiction conformelle', part: 3 },
	{ path: '/part3/lesson3', title: 'Intervalles de prédiction', part: 3 },
	{ path: '/part3/exercices', title: 'Exercices', part: 3 },

	// Partie IV – Bayes optimum
	{ path: '/part4/lesson1', title: 'Classifieur optimal', part: 4 },
	{ path: '/part4/lesson2', title: 'Régression optimale', part: 4 },
	{ path: '/part4/exercices', title: 'Exercices', part: 4 },

	// Partie V – Convergence
	{ path: '/part5/lesson1', title: 'Convergence', part: 5 },
	{ path: '/part5/lesson2', title: 'Consistance k-NN', part: 5 },
	{ path: '/part5/exercices', title: 'Exercices', part: 5 },

	// Part VI – Généralisation
	{ path: '/part6/lesson1', title: 'Concentration et risque empirique', part: 6 }
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
	2: 'Partie II — Régularisation',
	3: 'Partie III — Set-valued',
	4: 'Partie IV — Optimum de Bayes',
	5: 'Partie V — Consistance',
	6: 'Partie VI — Généralisation',
	7: 'Partie VII — Fonctions de perte'
};

export function getPageByPath(path: string): PageMeta | undefined {
	return PAGES.find((p) => p.path === path);
}

export function getNextPage(currentIndex: number): PageMeta | undefined {
	return PAGES[currentIndex + 1];
}

export function getPrevPage(currentIndex: number): PageMeta | undefined {
	return PAGES[currentIndex - 1];
}
