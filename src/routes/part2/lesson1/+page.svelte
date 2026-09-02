<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part2/lesson1');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>
		{meta?.title ?? 'Cadre de l’apprentissage supervisé & k-NN'} — Fondations de
		l'Apprentissage Statistique
	</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Cadre de l’apprentissage supervisé & k-NN'}
	subtitle="Le cadre de l'apprentissage supervisé et la méthode des k plus proches voisins"
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
			<li>Apprentissage supervisé et non supervisé : objectifs et exemples</li>
			<li>
				Cadre de la classification : variables, étiquettes, modèles, fonction de coût
				et risque
			</li>
			<li>Méthode des k plus proches voisins : principe, qualités et limites</li>
		</ul>
	</TheorySection>
</PageTemplate>
