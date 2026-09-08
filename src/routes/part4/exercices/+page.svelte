<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/exercices');
	createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Feuille d’exercices — Partie IV'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Feuille d’exercices — Partie IV'}
	subtitle="Exercices sur la régression linéaire"
	prev={prevMeta}
	next={nextMeta}
>
	<Callout type="note" title="Page en construction">
		La feuille d'exercices de la partie IV (moindres carrés, inférence de Student et de
		Fisher, diagnostic, choix de modèle) sera rédigée lors de la phase D, avec les
		corrigés en mode enseignant.
	</Callout>
</PageTemplate>
