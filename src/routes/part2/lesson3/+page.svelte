<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part2/lesson3');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>
		{meta?.title ?? 'Arbres de décision'} — Fondations de l'Apprentissage Statistique
	</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Arbres de décision'}
	subtitle="Construction d'arbres de décision avec l'algorithme CART"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<Callout type="note" title="Contenu en cours de rédaction">
			<p>
				Cette leçon n'est pas encore rédigée. Le programme prévu ci-dessous sera
				développé dans la prochaine mise à jour du cours.
			</p>
		</Callout>

		<h2>Programme prévu</h2>
		<ul>
			<li>Algorithme CART : construction de l'arbre, une variable par nœud</li>
			<li>Variables séparatrices et critères d'impureté</li>
			<li>Partitionnement pour la classification et pour la régression</li>
			<li>Règle d'agrégation aux feuilles et sélection de l'arbre</li>
		</ul>
	</TheorySection>
</PageTemplate>
