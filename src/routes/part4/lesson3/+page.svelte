<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/lesson3');
	createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Inférence dans le modèle gaussien'}
	subtitle="Maximum de vraisemblance, Student, Fisher et prévisions"
	prev={prevMeta}
	next={nextMeta}
>
	<Callout type="note" title="Page en construction">
		La leçon « Inférence dans le modèle gaussien » sera rédigée à partir de
		<code>course_sources/sophie/StatM1S1_2025.pdf</code> (sections I.6–I.7).
	</Callout>
</PageTemplate>
