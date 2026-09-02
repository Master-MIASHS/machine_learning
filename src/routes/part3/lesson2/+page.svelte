<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part3/lesson2');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>
		{meta?.title ?? 'K-moyennes & évaluation'} — Fondations de l'Apprentissage Statistique
	</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'K-moyennes & évaluation'}
	subtitle="Algorithme de Lloyd (k-moyennes) et évaluation d'un clustering"
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
			<li>Algorithme de Lloyd (k-moyennes) : principe et variantes</li>
			<li>Choix de k, complexité algorithmique et données aberrantes</li>
			<li>
				Évaluation : homogénéité, coefficient de silhouette, indice de Davies-Bouldin,
				inerties intra et inter classes
			</li>
		</ul>
	</TheorySection>
</PageTemplate>
