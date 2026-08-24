<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import { getPageByPath, getNextPage, getPrevPage, type PageMeta } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';

	const meta = getPageByPath('/part1/practice/travaux-pratiques');
	const tracker = createPageTracker(meta as PageMeta);
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
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
