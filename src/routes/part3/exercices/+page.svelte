<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part3/exercices');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Exercices'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Exercices'}
	subtitle="Clustering hiérarchique, k-moyennes et évaluation"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<Callout type="note" title="Feuille d'exercices en cours de rédaction">
			<p>
				Les exercices de cette partie seront ajoutés dans la prochaine mise à jour
				du cours.
			</p>
		</Callout>

		<h2>Thèmes couverts</h2>
		<ul>
			<li>Clustering hiérarchique et dendrogrammes</li>
			<li>Algorithme des k-moyennes</li>
			<li>Évaluation d'un clustering</li>
		</ul>
	</TheorySection>
</PageTemplate>
