<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import { asset } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part2/practice/travaux-pratiques');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Travaux pratiques'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Travaux pratiques'}
	subtitle="k-NN, régression logistique, arbres de décision et SVM"
	prev={prevMeta}
	next={nextMeta}
>
	<p>Énoncés des travaux pratiques (R Markdown) :</p>
	<ul>
		<li>
			<a href={asset('/rmd/TP1-KNN_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
				>TP 1 — KNN : le jeu de données Pima Indians Diabetes</a
			>
		</li>
		<li>
			<a href={asset('/rmd/TP2-KNN_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
				>TP 2 — KNN : le jeu de données Iris</a
			>
		</li>
		<li>
			<a href={asset('/rmd/TP3-RegLog_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
				>TP 3 — Régression logistique : les données prostate</a
			>
		</li>
		<li>
			<a href={asset('/rmd/TP4-Arbres_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
				>TP 4 — Arbres de décision</a
			>
		</li>
		<li>
			<a href={asset('/rmd/TP5-SVM_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
				>TP 5 — Support Vector Machines (SVM)</a
			>
		</li>
	</ul>
</PageTemplate>
