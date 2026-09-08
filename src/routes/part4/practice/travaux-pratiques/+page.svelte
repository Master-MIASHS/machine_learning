<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/practice/travaux-pratiques');
	createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Travaux pratiques'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Travaux pratiques'}
	subtitle="Régression linéaire : estimation, diagnostic, inférence et sélection (R)"
	prev={prevMeta}
	next={nextMeta}
>
	<Callout type="note" title="Page en construction">
		L'énoncé des travaux pratiques (R Markdown : données swiss, longley et prostate)
		sera ajouté dans <code>static/rmd/</code> lors de la phase D.
	</Callout>
</PageTemplate>
