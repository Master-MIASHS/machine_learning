<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';

	const meta = getPageByPath('/part2/practice/travaux-pratiques');

	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
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
			<a href="/notebooks/part2/1_ensembles.ipynb" target="_blank" rel="noopener noreferrer"
				>Notebook : Méthodes Ensemblistes</a
			>
		</li>
		<li>
			<a
				href="/notebooks/part2/2_bayesian_linear_regression.ipynb"
				target="_blank"
				rel="noopener noreferrer">Notebook : Régression Linéaire Bayésienne</a
			>
		</li>
	</ul>
</PageTemplate>
