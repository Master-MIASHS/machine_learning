<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part1/practice/travaux-pratiques');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Travaux pratiques'}
	subtitle="Entraînement sur les conditions d'optimalité et les algorithmes de descente de gradient"
	prev={prevMeta}
	next={nextMeta}
>
	<p>Veuillez télécharger et compléter les notebooks suivants :</p>
	<ul>
		<li>
			<a href="/notebooks/part1/2_optimization.ipynb" target="_blank" rel="noopener noreferrer"
				>Notebook : Optimisation</a
			>
		</li>
	</ul>
</PageTemplate>
