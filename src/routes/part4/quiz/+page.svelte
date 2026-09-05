<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Quiz, { type QuizItem } from '$lib/components/narrative/Quiz.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/quiz');
	createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question: "Quel est l'objectif principal du Bagging (Bootstrap Aggregating) ?",
			options: [
				'Réduire le biais du modèle',
				"Réduire la variance de l'estimateur",
				'Éliminer totalement le bruit des données',
				"Accélérer le temps d'entraînement"
			],
			answerIndex: 1,
			explanation:
				'Le Bagging réduit la variance en moyennant plusieurs modèles entraînés sur des échantillons bootstrap, sans affecter significativement le biais.'
		},
		{
			question:
				'Dans une forêt aléatoire, pourquoi sélectionne-t-on un sous-ensemble de variables (mtry) à chaque nœud ?',
			options: [
				'Pour réduire la complexité computationnelle uniquement',
				'Pour forcer les arbres à être identiques',
				'Pour décorréler les arbres et réduire la variance globale',
				'Pour augmenter le biais de chaque arbre'
			],
			answerIndex: 2,
			explanation:
				'En limitant les variables disponibles, on évite que tous les arbres ne fassent la même division dominante, ce qui réduit la corrélation entre eux.'
		},
		{
			question:
				"Quelle est la probabilité asymptotique (N → ∞) qu'une observation ne figure pas dans un échantillon Bootstrap ?",
			options: ['0.5', '0.632', '1/e (environ 0.368)', '0.25'],
			answerIndex: 2,
			explanation:
				"La probabilité d'exclusion tend vers (1 - 1/N)^N, ce qui converge vers e⁻¹ ≈ 0.368."
		},
		{
			question: "Qu'est-ce que l'erreur Out-of-Bag (OOB) ?",
			options: [
				"L'erreur mesurée sur le jeu de test final",
				"L'erreur calculée en utilisant uniquement les arbres qui n'ont pas vu l'exemple concerné",
				"La différence entre l'erreur d'entraînement et l'erreur de test",
				"L'erreur commise sur les variables exclues"
			],
			answerIndex: 1,
			explanation:
				"L'erreur OOB est une estimation honnête de la généralisation car chaque point est prédit par des arbres entraînés sans lui."
		},
		{
			question: 'Comment AdaBoost ajuste-t-il les poids des exemples entre deux itérations ?',
			options: [
				'Il donne plus de poids aux exemples faciles',
				'Il distribue les poids uniformément',
				'Il augmente le poids des exemples mal classés',
				'Il diminue le poids des exemples les plus bruités'
			],
			answerIndex: 2,
			explanation:
				'AdaBoost force le modèle suivant à se concentrer sur les erreurs du précédent en augmentant le poids des exemples mal classés.'
		},
		{
			question: "Le Gradient Boosting (GBDT) diffère d'AdaBoost principalement par :",
			options: [
				"L'utilisation de modèles parallèles",
				"L'optimisation d'une fonction de perte via des pseudo-résidus (gradients)",
				"L'absence de taux d'apprentissage",
				"L'utilisation exclusive de modèles très profonds"
			],
			answerIndex: 1,
			explanation:
				'GBDT généralise le boosting en ajustant chaque nouveau modèle pour suivre la direction négative du gradient de la perte.'
		},
		{
			question:
				"Quel est l'effet du 'shrinkage' (taux d'apprentissage η < 1) dans le Gradient Boosting ?",
			options: [
				'Il accélère la convergence',
				"Il réduit le besoin en nombre d'arbres",
				"Il ralentit l'apprentissage pour améliorer la généralisation",
				'Il élimine le besoin de pseudo-résidus'
			],
			answerIndex: 2,
			explanation:
				'Le shrinkage réduit la contribution de chaque arbre, forçant le modèle à apprendre plus lentement et plus robustement.'
		},
		{
			question:
				"Dans la régularisation Ridge (L2), quel est l'effet sur les coefficients colinéaires ?",
			options: [
				"Il en annule un et garde l'autre",
				'Il les partage équitablement',
				'Il les rend tous nuls',
				'Il augmente leur valeur'
			],
			answerIndex: 1,
			explanation:
				"Ridge distribue les poids entre les variables corrélées, contrairement au Lasso qui a tendance à n'en choisir qu'une."
		},
		{
			question:
				'Quelle propriété fondamentale du Lasso (L1) le rend utile pour la sélection de variables ?',
			options: [
				'Il rend la fonction objective strictement convexe',
				'Il produit des solutions creuses (certains coefficients sont strictement nuls)',
				'Il garantit que tous les coefficients sont identiques',
				'Il élimine le besoin de standardisation'
			],
			answerIndex: 1,
			explanation:
				'La forme en losange de la contrainte L1 favorise les solutions où les coins (axes) sont touchés, annulant ainsi certains poids.'
		},
		{
			question: "L'Elastic Net est une combinaison de Ridge et Lasso. Pourquoi l'utiliser ?",
			options: [
				'Pour combiner la sélection de variables (L1) et la stabilité face aux corrélations (L2)',
				"Parce qu'il est beaucoup plus rapide à calculer que Ridge",
				"Parce qu'il ne nécessite pas de hyperparamètre lambda"
			],
			answerIndex: 0,
			explanation:
				"L'Elastic Net offre le meilleur des deux mondes : la sparsité du Lasso et l'effet de groupe du Ridge."
		},
		{
			question:
				'Pourquoi est-il indispensable de standardiser les données avant un Lasso ou un Ridge ?',
			options: [
				'Pour rendre les données gaussiennes',
				"Pour éviter que l'échelle d'une variable n'influence disproportionnément sa pénalité",
				'Pour supprimer les valeurs aberrantes',
				'Pour transformer les variables catégorielles en numériques'
			],
			answerIndex: 1,
			explanation:
				"Comme la pénalité s'applique uniformément aux coefficients, une variable avec une petite échelle aura un coefficient naturellement grand, et sera donc plus pénalisée."
		},
		{
			question:
				"Selon le compromis biais-variance, que se passe-t-il quand on augmente la complexité d'un modèle ?",
			options: [
				'Le biais augmente et la variance diminue',
				'Le biais diminue et la variance augmente',
				'Les deux augmentent',
				'Les deux diminuent'
			],
			answerIndex: 1,
			explanation:
				"Un modèle plus complexe s'ajuste mieux aux données (moins de biais) mais devient plus sensible aux fluctuations (plus de variance)."
		},
		{
			question: "Quel est l'impact d'un nombre d'arbres M très élevé dans une Forêt Aléatoire ?",
			options: [
				'Le modèle finit par surapprendre (overfitting)',
				"L'erreur de généralisation converge vers une limite stable",
				'La variance du modèle augmente indéfiniment',
				'Le biais du modèle augmente proportionnellement'
			],
			answerIndex: 1,
			explanation:
				"Contrairement au Boosting, augmenter M dans une Random Forest ne cause pas d'overfitting ; cela stabilise simplement la prédiction."
		},
		{
			question:
				"Dans le Gradient Boosting, quelle valeur constante est utilisée pour initialiser F₀ lors d'une perte L2 ?",
			options: [
				'Le zéro',
				'La médiane des cibles',
				'La moyenne des cibles',
				'La valeur la plus fréquente'
			],
			answerIndex: 2,
			explanation:
				"Pour la perte quadratique, la constante qui minimise l'erreur globale est la moyenne empirique."
		},
		{
			question:
				'Quelle est la différence majeure entre le vote dur et le vote doux dans un ensemble de classifieurs ?',
			options: [
				'Le vote dur est plus lent',
				'Le vote doux utilise les probabilités de confiance, le vote dur utilise uniquement la classe finale',
				'Le vote doux ne fonctionne que pour le Boosting',
				"Il n'y a aucune différence en pratique"
			],
			answerIndex: 1,
			explanation:
				'Le vote doux pondère les décisions par la confiance du modèle, ce qui est généralement plus performant.'
		}
	];

	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Quiz de synthèse — Partie IV'}
	subtitle="Vérifiez vos acquis sur le Bagging, le Boosting et la Régularisation"
	prev={prevMeta}
	next={nextMeta}
>
	<div class="quiz-container">
		<Quiz items={quiz} maxQuestions={10} />
	</div>
</PageTemplate>

<style>
	.quiz-container {
		max-width: 800px;
		margin: 0 auto;
	}
</style>
