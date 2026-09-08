<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Quiz from '$lib/components/narrative/Quiz.svelte';
	import { getQuizQuestions } from '$lib/quiz';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part10/quiz');
	createPageTracker(meta as PageMeta);

	// Whole part: the curated synthèse questions plus every lesson quiz in Part IX.
	const quiz = getQuizQuestions('p10');

	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title
		>{meta?.title ?? 'Quiz de synthèse — Partie X'} — Fondations de l'Apprentissage Statistique</title
	>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Quiz de synthèse — Partie X'}
	subtitle="Vérifiez vos acquis sur les pertes proxy, la calibration et la décomposition de l'erreur"
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
