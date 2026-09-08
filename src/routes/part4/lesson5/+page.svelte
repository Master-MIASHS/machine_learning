<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/lesson5');
	createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Choix de modèle et sélection de variables'}
	subtitle="Critères AIC/BIC/Cp et algorithmes de sélection"
	prev={prevMeta}
	next={nextMeta}
>
	<Callout type="note" title="Page en construction">
		La leçon « Choix de modèle et sélection de variables » sera rédigée à partir de
		<code>course_sources/sophie/9.choix_de_modele.pdf</code>.
	</Callout>
</PageTemplate>
