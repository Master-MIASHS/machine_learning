<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part2/lesson4');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>
		{meta?.title ?? 'Support Vector Machines (SVM)'} — Fondations de l'Apprentissage
		Statistique
	</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Support Vector Machines (SVM)'}
	subtitle="Marges, vecteurs de support et SVM à noyau"
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
			<li>Séparabilité linéaire : marges et vecteurs de support</li>
			<li>SVM à marge rigide : formulations primale et duale</li>
			<li>SVM à marge souple : variables d'ajustement et pénalisation</li>
			<li>SVM à noyau : l'astuce du noyau et exemples de noyaux</li>
		</ul>
	</TheorySection>
</PageTemplate>
