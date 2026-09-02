<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part2/lesson2');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>
		{meta?.title ?? 'Classifieurs linéaires & régression logistique'} — Fondations de
		l'Apprentissage Statistique
	</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Classifieurs linéaires & régression logistique'}
	subtitle="Classifieurs linéaires, régression logistique et évaluation par l'AUC"
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
			<li>Classifieurs linéaires : formulation et optimisation</li>
			<li>Classifieurs linéaires et non linéaires</li>
			<li>Régression logistique : cas binaire et multiclasse</li>
			<li>Évaluation d'un modèle avec l'AUC</li>
		</ul>
	</TheorySection>
</PageTemplate>
