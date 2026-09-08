<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part4/quiz');
	createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Quiz de synthèse — Partie IV'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Quiz de synthèse — Partie IV'}
	subtitle="Vérifiez vos acquis sur la régression linéaire"
	prev={prevMeta}
	next={nextMeta}
>
	<Callout type="note" title="Page en construction">
		Les questions du quiz de synthèse de la partie IV (tags
		<code>p4/synthese</code> et <code>p4/l1</code>–<code>p4/l5</code>) seront ajoutées à
		la base de quiz lors de la phase D.
	</Callout>
</PageTemplate>
