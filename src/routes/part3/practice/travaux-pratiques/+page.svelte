<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import { asset } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part3/practice/travaux-pratiques');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Travaux pratiques'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Travaux pratiques'}
	subtitle="Clustering hiérarchique, k-moyennes et évaluation"
	prev={prevMeta}
	next={nextMeta}
>
	<p>Énoncés des travaux pratiques (R Markdown) :</p>
	<ul>
		<li>
			<a href={asset('/rmd/TP5-Clustering_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
				>TP 6 — Clustering</a
			>
		</li>
	</ul>
</PageTemplate>
