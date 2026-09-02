<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part4/practice/travaux-pratiques');

	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Travaux pratiques'}
	subtitle="Entraînement sur bagging, forêts aléatoires, boosting et régularisation L1/L2"
	prev={prevMeta}
	next={nextMeta}
>
	<p>Veuillez télécharger et compléter les notebooks suivants :</p>
	<ul>
		<li>
			<a href="/notebooks/part4/1_ensembles.ipynb" target="_blank" rel="noopener noreferrer"
				>Notebook : Méthodes Ensemblistes</a
			>
		</li>
		<li>
			<a
				href="/notebooks/part4/2_bayesian_linear_regression.ipynb"
				target="_blank"
				rel="noopener noreferrer">Notebook : Régression Linéaire Bayésienne</a
			>
		</li>
	</ul>
</PageTemplate>
