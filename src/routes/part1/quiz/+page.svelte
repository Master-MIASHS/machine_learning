<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Quiz, { type QuizItem } from '$lib/components/narrative/Quiz.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part1/quiz');
	createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question:
				"D'après le théorème 1.3 (CNO), si f est différentiable sur un ouvert Ω et que x* est un minimum local, que peut-on conclure ?",
			options: [
				'∇f(x*) = 0',
				'le Hessien en x* est semi-défini positif',
				'x* est nécessairement un minimum global',
				'x* est un minimum local strict'
			],
			answerIndex: 0,
			explanation:
				"La condition nécessaire du premier ordre ne garantit que l'annulation du gradient."
		},
		{
			question:
				"En un point x*, le gradient s'annule et le Hessien est semi-défini positif. Que peut-on conclure ?",
			options: [
				'x* est forcément un minimum local',
				'la condition nécessaire du second ordre est satisfaite, mais x* peut encore être un point-selle',
				'x* est un minimum local strict',
				'x* est un minimum global'
			],
			answerIndex: 1,
			explanation:
				"L'exemple 1.10 montre qu'un Hessien semi-défini positif n'est pas suffisant pour garantir un minimum."
		},
		{
			question:
				'Soit f convexe et différentiable sur un ouvert convexe Ω. Que dit le théorème 1.7 ?',
			options: [
				'∇f(x*) = 0 implique que x* est un minimum local',
				'tout minimum de f est unique',
				'f est nécessairement coercive',
				'∇f(x*) = 0 si et seulement si x* est un minimum global de f'
			],
			answerIndex: 3,
			explanation:
				"En contexte convexe, la CNO devient nécessaire et suffisante pour l'optimalité globale."
		},
		{
			question:
				'La fonction f(x) = x⁴ − x² possède deux minima globaux en ±1/√2 et un maximum local en 0. Que montre cet exemple ?',
			options: [
				"la convexité est nécessaire pour qu'une fonction ait un minimum global",
				"la CNO n'est pas vérifiée aux minima globaux",
				'une fonction peut posséder des minima globaux sans être convexe',
				'le Hessien est toujours défini positif aux minima globaux'
			],
			answerIndex: 2,
			explanation:
				"La convexité est suffisante mais non nécessaire pour l'existence d'un minimum global."
		},
		{
			question:
				"Quelle combinaison d'hypothèses garantit qu'une fonction f définie sur Ω possède au moins un minimum global ?",
			options: [
				'f continue, Ω fermé et non vide, et f coercive ou Ω compact',
				'f continue et coercive, Ω quel que soit le sous-ensemble',
				'f différentiable avec ∇f = 0 en un point',
				'f convexe, Ω ouvert'
			],
			answerIndex: 0,
			explanation: "C'est le théorème de Weierstrass généralisé (1.12)."
		},
		{
			question:
				"Si le Hessien d'une fonction en un point critique est défini positif (H ≻ 0), que peut-on affirmer ?",
			options: [
				'Le point est un minimum global',
				'Le point est un minimum local strict',
				'Le point est un point-selle',
				'Le point est un maximum local'
			],
			answerIndex: 1,
			explanation: "C'est la condition suffisante du second ordre (CSSO)."
		},
		{
			question:
				'Une fonction strictement convexe qui admet un minimum global voit ce minimum être :',
			options: ['Nécessairement nul', 'Non unique', 'Uniquement local', 'Unique'],
			answerIndex: 3,
			explanation: "La stricte convexité interdit l'existence de deux minima globaux distincts."
		},
		{
			question: "Laquelle de ces fonctions n'est PAS coercive sur ℝ ?",
			options: ['f(x) = x⁴ + 1', 'f(x) = x² + sin(x)', 'f(x) = eˣ', 'f(x) = x² + 5'],
			answerIndex: 2,
			explanation: "L'exponentielle tend vers 0 en -∞, elle n'est donc pas coercive."
		},
		{
			question: 'Quelle propriété est conservée par la somme de deux fonctions convexes ?',
			options: ['La différentiabilité', 'La convexité', "L'unicité du minimum", 'La coercivité'],
			answerIndex: 1,
			explanation: 'La somme de fonctions convexes est toujours convexe.'
		},
		{
			question: "Pourquoi la régularisation Ridge (L2) garantit-elle l'unicité du minimum ?",
			options: [
				"Parce qu'elle rend la fonction coercive",
				"Parce qu'elle rend la Hessienne définie positive (H ≻ 0)",
				"Parce qu'elle annule le gradient",
				"Parce qu'elle simplifie la fonction de perte"
			],
			answerIndex: 1,
			explanation:
				"L'ajout de λ||w||² rend la Hessienne définie positive, rendant la fonction strictement convexe."
		},
		{
			question:
				'Concernant la descente de gradient (GD), que signifie un conditionnement élevé (κ >> 1) ?',
			options: [
				'Une convergence très rapide',
				'Un minimum global garanti',
				"Un phénomène d'oscillation et une convergence lente",
				"L'absence de point critique"
			],
			answerIndex: 2,
			explanation:
				"Un fort conditionnement crée des 'vallées' étroites où le gradient oscille sans progresser rapidement."
		},
		{
			question:
				"Quel est l'avantage principal du SGD (Stochastic Gradient Descent) par rapport au GD Batch ?",
			options: [
				'Une convergence plus stable',
				'Un coût computationnel par itération beaucoup plus faible',
				"L'absence de bruit stochastique",
				'Une garantie de convergence vers le minimum global'
			],
			answerIndex: 1,
			explanation:
				'SGD traite un seul échantillon (ou mini-batch) au lieu de n, réduisant la complexité par itération.'
		},
		{
			question:
				"Quelle est la complexité computationnelle typique d'une itération de la méthode de Newton en dimension d ?",
			options: ['O(d)', 'O(d²)', 'O(d³)', 'O(nd)'],
			answerIndex: 2,
			explanation:
				"L'inversion de la Hessienne (ou la résolution du système linéaire) coûte typiquement O(d³)."
		},
		{
			question: 'Le Momentum de Polyak permet principalement de :',
			options: [
				'Remplacer le calcul du gradient',
				'Accélérer la convergence en amortissant les oscillations',
				'Éviter tout minimum local',
				"Supprimer le besoin d'un pas d'apprentissage (learning rate)"
			],
			answerIndex: 1,
			explanation:
				"Le momentum utilise l'inertie des gradients passés pour lisser la trajectoire et accélérer dans les directions constantes."
		},
		{
			question: "La méthode de Nesterov (NAG) s'améliore par rapport au Momentum classique en :",
			options: [
				'Ignorant le gradient actuel',
				'Calculant le gradient au point anticipé par le momentum',
				'Utilisant un pas constant',
				"Évitant l'utilisation de la vitesse"
			],
			answerIndex: 1,
			explanation:
				"NAG calcule le gradient après avoir appliqué l'inertie, permettant une correction plus fine."
		},
		{
			question: 'Quelle est la caractéristique principale de la Descente Coordonnée (CD) ?',
			options: [
				"L'optimisation de toutes les variables simultanément",
				"L'optimisation d'une seule coordonnée à la fois",
				"L'utilisation systématique de la Hessienne",
				"L'absence de pas d'apprentissage"
			],
			answerIndex: 1,
			explanation:
				"CD minimise la fonction le long d'un seul axe à chaque étape, ce qui est efficace pour les fonctions séparables."
		},
		{
			question:
				"L'infimum d'une fonction peut-il être atteint même si la fonction n'est pas coercive ?",
			options: [
				'Jamais',
				'Oui, si le domaine est compact',
				'Oui, si la fonction est convexe',
				'Seulement si le gradient est nul partout'
			],
			answerIndex: 1,
			explanation:
				"Le théorème de Weierstrass classique garantit l'atteinte du minimum sur un compact, même sans coercivité."
		},
		{
			question: 'Pour une fonction quadratique, la méthode de Newton converge en :',
			options: [
				'Une seule itération',
				'O(1/k) itérations',
				'O(log(1/ε)) itérations',
				'Temps infini'
			],
			answerIndex: 0,
			explanation:
				'Newton utilise une approximation quadratique exacte ; si la fonction est quadratique, il trouve le minimum en un pas.'
		},
		{
			question: 'La perte logistique (logistic loss) est-elle convexe ?',
			options: [
				'Non, elle est concave',
				'Oui, elle est convexe',
				'Seulement si les données sont linéairement séparables',
				'Seulement en dimension 1'
			],
			answerIndex: 1,
			explanation:
				"La perte logistique est une composition d'une fonction convexe et d'une application affine, donc convexe."
		},
		{
			question:
				"Quel est le risque principal d'un pas d'apprentissage (learning rate) trop élevé ?",
			options: [
				'Une convergence trop rapide',
				'Une divergence ou des oscillations instables',
				'Une stagnation immédiate au point de départ',
				'Une réduction du bruit stochastique'
			],
			answerIndex: 1,
			explanation:
				"Un pas trop grand peut 'sauter' par-dessus le minimum et conduire la fonction vers l'infini."
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
	title={meta?.title ?? 'Quiz de synthèse — Partie I'}
	subtitle="Vérifiez vos acquis sur les conditions d'optimalité et d'existence"
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
