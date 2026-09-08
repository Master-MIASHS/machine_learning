<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/lesson1');
	createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Le modèle linéaire et les moindres carrés'}
	subtitle="Moindres carrés, Gauss–Markov et coefficient de détermination"
	prev={prevMeta}
	next={nextMeta}
>
	<Callout type="note" title="Page en construction">
		La leçon « Le modèle linéaire et les moindres carrés » sera rédigée à partir de
		<code>course_sources/sophie/StatM1S1_2025.pdf</code> (section I).
	</Callout>
</PageTemplate>
