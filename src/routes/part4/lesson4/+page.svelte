<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/lesson4');
	createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Validation et diagnostic du modèle'}
	subtitle="Colinéarité, résidus et observations influentes"
	prev={prevMeta}
	next={nextMeta}
>
	<Callout type="note" title="Page en construction">
		La leçon « Validation et diagnostic du modèle » sera rédigée à partir de
		<code>course_sources/sophie/8.validation_du_modele_lineaire_2025.pdf</code>.
	</Callout>
</PageTemplate>
