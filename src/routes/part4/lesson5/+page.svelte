<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { TocEntry } from '$lib/components/narrative/TableOfContents.svelte';

	const meta = getPageByPath('/part4/lesson5');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Formules (course_sources/sophie/9.choix_de_modele.pdf) ──
	const subEq = String.raw`Y \approx X_S \beta_S`;
	const pressEq = String.raw`PRESS = \sum_{i=1}^{n} \left( \hat{\varepsilon}^{(-i)}_i \right)^2`;
	const errOpt = String.raw`\hat{err} \ = \ \|\hat{\varepsilon}\|^2 \ + \ \text{« optimisme »}`;
	const cpEq = String.raw`C_p \ = \ \frac{\|\hat{\varepsilon}\|^2}{\hat{\sigma}^2} \ - \ \left( n - 2(p+1) \right)`;
	const aicEq = String.raw`AIC \ = \ -2\log(L) + 2k`;
	const bicEq = String.raw`BIC \ = \ -2\log(L) + k\log(n)`;

	const tocEntries: TocEntry[] = [
		{ id: 'objectifs', label: 'Trois objectifs de modélisation', color: 'belief' },
		{ id: 'biaisvariance', label: 'Le compromis biais/variance', color: 'neutral' },
		{ id: 'criteres', label: 'Critères de comparaison de modèles', color: 'positive' },
		{ id: 'algorithmes', label: 'Algorithmes de sélection de sous-ensembles', color: 'surprise' },
		{ id: 'prostate', label: 'Exemple : cancer de la prostate', color: 'agent' },
		{ id: 'pont', label: 'Pont vers la partie V', color: 'belief' }
	];
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Choix de modèle et sélection de variables'}
	subtitle="Compromis biais/variance, critères Cp, AIC, BIC, algorithmes best-subset et pas à pas"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="objectifs">Trois objectifs de modélisation</h2>

		<p>
			De façon un peu schématique, la pratique de la modélisation statistique
			s’associe à trois objectifs, qui peuvent être poursuivis en
			complémentarité.
		</p>

		<DefinitionBlock number="5.1" title="Objectif descriptif, explicatif, prédictif">
			<ul>
				<li>
					<strong>Descriptif.</strong> Rechercher de façon
					<strong>exploratoire</strong> les liaisons entre
					<KatexInline formula="Y" /> et d’autres variables, potentiellement
					explicatives, <KatexInline formula={String.raw`X_j`} /> — qui peuvent
					être nombreuses — afin par exemple d’en sélectionner un sous-ensemble.
					Les analyses en composantes principales peuvent y contribuer, et des
					algorithmes de recherche (pas à pas) moins performants mais
					économiques en temps de calcul s’imposent si
					<KatexInline formula="p" /> est grand. <strong>Attention :</strong> si
					<KatexInline formula="n" /> est petit et la recherche suffisamment
					longue avec beaucoup de variables explicatives, il sera toujours
					possible de trouver un « bon » modèle expliquant
					<KatexInline formula="Y" /> — l’effet <em>data mining</em> (désormais
					appelé <em>data snooping</em>) des modèles économétriques.
				</li>
				<li>
					<strong>Explicatif.</strong> Sous-tendu par une connaissance
					<strong>a priori</strong> du domaine, dont des résultats théoriques
					peuvent vouloir être confirmés, infirmés ou précisés par l’estimation
					des paramètres. Le modèle doit être
					<strong>interprétable</strong> ; les résultats inférentiels de la
					leçon 3 conduisent le bon test pour la décision recherchée.
				</li>
				<li>
					<strong>Prédictif.</strong> L’accent est mis sur la qualité des
					prévisions — la situation de l’apprentissage statistique. On cherche
					des modèles <strong>parcimonieux</strong>, avec un nombre volontairement
					restreint de variables pour réduire
					<KatexInline formula={String.raw`V(\hat{Y})`} /> : le modèle peut
					favoriser des estimateurs <strong>biaisés</strong> au profit d’une
					variance plus faible (le théorème de Gauss-Markov ne concerne que les
					estimateurs sans biais). Tout est affaire de
					<strong>compromis entre biais et variance</strong> : un bon modèle
					n’est plus celui qui explique le mieux les données au sens d’un
					<KatexInline formula="R²" /> maximum, mais celui qui conduit aux
					prévisions les plus fiables.
				</li>
			</ul>
		</DefinitionBlock>

		<h2 id="biaisvariance">Le compromis biais/variance</h2>

		<p>
			L’illustration classique : on ajuste des
			<strong>polynômes de degrés croissants</strong> à un jeu de données simulé.
			Le coefficient de détermination croît logiquement avec le nombre de
			paramètres, et atteint la valeur 1 quand le polynôme
			<strong>interpole</strong> les observations.
		</p>

		<DefinitionBlock number="5.2" title="R² n’est pas un critère de sélection">
			<p>
				Le <KatexInline formula="R²" /> ne peut être un bon critère de sélection
				de modèles : il ne sert qu’à
				<strong>comparer des modèles de même dimension</strong>, car sinon il
				conduit à sélectionner le modèle le plus complexe — le plus grand espace
				de projection — et donc au <strong>sur-ajustement</strong>.
			</p>
			<p>
				Il y a principalement deux façons de
				<strong>biaiser</strong> un modèle linéaire dans le but de restreindre la
				variance :
			</p>
			<ul>
				<li>
					en <strong>réduisant le nombre de variables explicatives</strong>,
					c’est-à-dire en simplifiant le modèle (sélection de variables selon un
					critère donné, ou pénalisation Lasso en norme
					<KatexInline formula={String.raw`l_1`} />) ;
				</li>
				<li>
					en <strong>contraignant les paramètres</strong>, en les rétrécissant
					(<em>shrinkage</em>), par une régression ridge qui opère une
					régularisation par pénalisation en norme
					<KatexInline formula={String.raw`l_2`} /> — voir la
					<a href="/part5/lesson4">partie V</a> de ce cours.
				</li>
			</ul>
			<p>
				Dans les deux cas, une plus faible erreur de prédiction est attendue en
				ajustant le compromis biais/variance. (Rappel de la leçon 4 : la
				colinéarité entre prédicteurs se traite par la sélection de variables ou
				par la régularisation.)
			</p>
		</DefinitionBlock>

		<InteractiveSection number="5.3" title="Polynômes et sur-ajustement" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmPolynomialOverfit.svelte')} />
		</InteractiveSection>

		<h2 id="criteres">Critères de comparaison de modèles</h2>

		<p>
			La <strong>sélection de variables</strong> répond à la problématique :
			lorsqu’on augmente le nombre de variables, on intègre de plus en plus
			d’information, mais le nombre de paramètres à estimer augmente et avec lui
			<KatexInline formula={String.raw`V(\hat{Y}_i)`} />. On recherche donc un
			(petit) ensemble
			<KatexInline formula="S" /> de <KatexInline formula="k" /> variables parmi
			<KatexInline formula="p" /> tels que
		</p>

		<KatexBlock formula={subEq} />

		<p>
			Pour trouver le compromis, il faut
			<KatexInline formula="1" /> un <strong>critère</strong> pour évaluer la
			qualité du modèle, et
			<KatexInline formula="2" /> un <strong>algorithme</strong> pour déterminer les
			<KatexInline formula="k" /> variables qui l’optimisent.
		</p>

		<DefinitionBlock number="5.4" title="PRESS de Allen et principe des critères pénalisés">
			<p>
				On a déjà vu certains critères : la statistique du
				<strong>F de Fisher</strong> (leçon 3), le
				<KatexInline formula={String.raw`R^2 = \mathrm{SCE}/\mathrm{SCT}`} />
				— qui <strong>ne permet pas de comparer des modèles de dimension
				différente</strong> — et le
				<KatexInline formula={String.raw`R^2`} /> ajusté.
			</p>
			<p>
				À partir du vecteur des erreurs de test
				<KatexInline formula={String.raw`\hat{\varepsilon}^{(-i)}_i`} />
				(leçon 4 : régression refaite sans l’observation
				<KatexInline formula="i" />), on calcule la somme des carrés de ces
				résidus, appelée le <strong>PRESS de Allen</strong>
				(<em>Predicted Residual Sum of Squares</em>) :
			</p>
			<KatexBlock formula={pressEq} />
			<p>
				Principe général des <strong>critères pénalisés</strong> : plutôt que
				d’estimer l’erreur de prédiction par l’erreur de test (coûteux — c’est le
				principe de la validation croisée), on estime de
				<strong>combien l’erreur d’entraînement sous-estime la vraie erreur</strong>,
				sans ajuster d’autres modèles :
			</p>
			<KatexBlock formula={errOpt} />
		</DefinitionBlock>

		<DefinitionBlock number="5.5" title="Le Cp de Mallows">
			<p>
				La statistique du
				<KatexInline formula={String.raw`C_p`} /> est définie par
			</p>
			<KatexBlock formula={cpEq} />
			<p>
				avec un piège : on ne peut pas estimer
				<KatexInline formula={String.raw`\sigma^2`} /> par
				<KatexInline formula={String.raw`\hat{\sigma}^2 = \|\hat{\varepsilon}\|^2/(n-p-1)`} />
				sur le modèle qu’on est en train d’évaluer. Solution : on estime
				<KatexInline formula={String.raw`\sigma^2`} /> par la somme des carrés des
				résidus du <strong>modèle complet</strong>, qui fait intervenir toutes
				les variables explicatives. Pour ce modèle complet, qui a
				<KatexInline formula={String.raw`p+1`} /> paramètres, on a donc toujours
				<KatexInline formula={String.raw`C_p = p+1`} /> ; pour les autres modèles,
				<KatexInline formula={String.raw`C_p`} /> prend d’autres valeurs.
			</p>
			<p>
				Il est d’usage de rechercher le modèle qui
				<strong>minimise</strong> le
				<KatexInline formula={String.raw`C_p`} /> tout en fournissant une valeur
				<strong>inférieure et proche de</strong>
				<KatexInline formula={String.raw`k+1`} /> pour un modèle avec
				<KatexInline formula="k" /> variables explicatives — ce qui revient à
				considérer que le modèle complet est moins fiable qu’un modèle réduit
				(possiblement biaisé, mais d’estimation plus précise).
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="5.6" title="Critère d’information d’Akaike (AIC)">
			<p>
				L’AIC s’applique aux modèles estimés par le
				<strong>maximum de vraisemblance</strong> : analyses de variance,
				régressions linéaires multiples, régressions logistiques et de Poisson.
				Il est défini par
			</p>
			<KatexBlock formula={aicEq} />
			<p>
				où <KatexInline formula="L" /> est la vraisemblance et
				<KatexInline formula="k" /> le nombre de
				<strong>paramètres libres</strong> dans le modèle. La déviance
				<KatexInline formula={String.raw`-2\log(L)`} /> est pénalisée par 2 fois
				le nombre de paramètres libres : l’AIC représente un compromis entre la
				qualité de l’ajustement (vraisemblance) et la complexité du modèle —
				augmenter le nombre de paramètres améliore nécessairement la qualité de
				l’ajustement, mais limite la valeur générale du modèle, et ainsi sa
				capacité de prédiction.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="5.7" title="Critère d’information bayésien (BIC)">
			<p>
				Le BIC est défini par
			</p>
			<KatexBlock formula={bicEq} />
			<p>
				où <KatexInline formula="L" /> est la vraisemblance,
				<KatexInline formula="k" /> le nombre de paramètres libres et
				<KatexInline formula="n" /> le nombre d’observations. Il est
				<strong>plus parcimonieux</strong> que le critère AIC puisqu’il pénalise
				davantage le nombre de variables présentes dans le modèle.
			</p>
		</DefinitionBlock>

		<InteractiveSection number="5.8" title="AIC contre BIC : la force de la pénalité" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmAicBic.svelte')} />
		</InteractiveSection>

		<h2 id="algorithmes">Algorithmes de sélection de sous-ensembles</h2>

		<DefinitionBlock number="5.9" title="Recherche exhaustive (best-subset)">
			<p>
				Pour <KatexInline formula={String.raw`k = 0 \dots p`} />, trouver le
				sous-ensemble de
				<KatexInline formula="k" /> variables qui donne la plus petite erreur
				<KatexInline formula={String.raw`\|\hat{\varepsilon}\|^2`} /> (SCR) parmi
				les
				<KatexInline formula={String.raw`\binom{p}{k}`} /> modèles.
			</p>
			<ul>
				<li>se généralise à d’autres critères (
					<KatexInline formula={String.raw`R^2`} /> ajusté, AIC, BIC, …) ;</li>
				<li>existe un algorithme efficace (<em>Leaps and Bound</em>) ;</li>
				<li><strong>impossible pour</strong>
					<KatexInline formula="p" /> grand (dès que
					<KatexInline formula={String.raw`p > 30`} />) : le nombre de modèles
					<KatexInline formula={String.raw`2^p`} /> explose.
				</li>
			</ul>
		</DefinitionBlock>

		<DefinitionBlock number="5.10" title="Sélection pas à pas (forward, backward, both)">
			<ul>
				<li>
					<strong>Avant (forward).</strong> Commencer avec
					<KatexInline formula={String.raw`S = \varnothing`} /> ; à l’étape
					<KatexInline formula="k" />, trouver la variable qui ajoutée à
					<KatexInline formula="S" /> donne le meilleur modèle ; réitérer
					jusqu’au modèle à
					<KatexInline formula="p" /> variables. Approprié lorsque
					<KatexInline formula="p" /> est grand.
				</li>
				<li>
					<strong>Both.</strong> Même principe, mais à chaque étape on prend le
					meilleur modèle lorsqu’une variable est <em>ajoutée ou enlevée</em>.
				</li>
				<li>
					<strong>Arrière (backward).</strong> Commencer avec le modèle plein
					<KatexInline formula={String.raw`S = \{1, \dots, p\}`} /> ; à chaque
					étape, enlever la variable ayant le moins d’influence sur
					l’ajustement ; réitérer jusqu’au modèle nul.
					<strong>Ne fonctionne pas si</strong>
					<KatexInline formula={String.raw`n < p`} />.
				</li>
			</ul>
			<p>
				Tous ces algorithmes gloutons (<em>greedy</em>) identifient le meilleur
				modèle en terme de SCR ou
				<KatexInline formula={String.raw`R^2`} /> ajusté, AIC, BIC, … — au prix
				d’un <strong>biais important</strong>, avec variance/complexité
				contrôlée.
			</p>
		</DefinitionBlock>

		<InteractiveSection number="5.11" title="Sélection de variables : quatre algorithmes en compétition" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmVariableSelection.svelte')} />
		</InteractiveSection>

		<h2 id="prostate">Exemple : cancer de la prostate</h2>

		<p>
			Données du cancer de la prostate :
			<KatexInline formula={String.raw`n = 97`} /> observations,
			<KatexInline formula={String.raw`p = 8`} /> prédicteurs
			<KatexInline formula={String.raw`(\texttt{lcavol}, \texttt{lweight}, \texttt{age}, \texttt{lbph}, \texttt{svi}, \texttt{lcp}, \texttt{gleason}, \texttt{pgg45})`} />,
			réponse <KatexInline formula={String.raw`\texttt{lpsa}`} />. En R,
			<code>regsubsets()</code> (package
			<code>leaps</code>) pour le best-subset et
			<code>step()</code> (package <code>MASS</code>) pour le pas à pas.
		</p>

		<ExampleBlock number="5.12" title="Pas à pas avec AIC : le modèle retenu">
			<p>
				Le modèle nul
				<KatexInline formula={String.raw`\texttt{lpsa} \sim 1`} /> a un AIC de
				<KatexInline formula={String.raw`28{,}84`} />. La sélection
				<strong>forward</strong> (
				<KatexInline formula={String.raw`k = 2`} />) ajoute les variables dans
				l’ordre
			</p>
			<table class="data-table">
				<thead>
					<tr>
						<th>étape</th>
						<th>variable ajoutée</th>
						<th>AIC</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>1</td>
						<td>lcavol</td>
						<td>−44,37</td>
					</tr>
					<tr>
						<td>2</td>
						<td>lweight</td>
						<td>−52,69</td>
					</tr>
					<tr>
						<td>3</td>
						<td>svi</td>
						<td>−60,68</td>
					</tr>
					<tr>
						<td>4</td>
						<td>lbph</td>
						<td>−61,35</td>
					</tr>
					<tr>
						<td>5</td>
						<td>age</td>
						<td>−61,37</td>
					</tr>
				</tbody>
			</table>
			<p>
				et s’arrête : le modèle retenu est
				<KatexInline formula={String.raw`\texttt{lpsa} \sim \texttt{lcavol} + \texttt{lweight} + \texttt{svi} + \texttt{lbph} + \texttt{age}`} />
				(coefficients estimés
				<KatexInline formula={String.raw`0{,}951,\ 0{,}566,\ 0{,}424,\ 0{,}721,\ 0{,}112,\ -0{,}015`} />).
			</p>
			<ul>
				<li>
					La sélection <strong>backward</strong>, partie du modèle plein
					(AIC =
					<KatexInline formula={String.raw`-58{,}32`} />), enlève dans l’ordre
					<code>gleason</code>, <code>lcp</code>, <code>pgg45</code> — et
					aboutit au <strong>même modèle à 5 variables</strong>.
				</li>
				<li>
					Le pas à pas <strong>both</strong> reproduit le chemin forward.
				</li>
				<li>
					avec le BIC (
					<KatexInline formula={String.raw`k = \log n`} />), la pénalité par
					paramètre vaut
					<KatexInline formula={String.raw`\log 97 \approx 4{,}57`} /> au lieu
					de 2 : la sélection est plus parcimonieuse.
				</li>
			</ul>
		</ExampleBlock>

		<h2 id="pont">Pont vers la partie V</h2>

		<Callout type="note" title="Vers la suite">
			<p>
				Lorsque plusieurs prédicteurs ont des effets similaires sur la réponse, la
				sélection de prédicteurs interprétables est très difficile (l’un peut
				remplacer l’autre). L’alternative : <strong>régulariser</strong> en
				contraintant les paramètres dans un espace approprié — pénalité en norme
				L1 (<strong>Lasso</strong>, qui sélectionne aussi des variables) ou
				L2 (<strong>Ridge</strong>) — pour stabiliser l’estimation et faciliter
				l’interprétabilité : voir la
				<a href="/part5/lesson4">leçon « Régularisation L1/L2/Elastic Net » de la
				partie V</a>.
			</p>
		</Callout>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Akaike, H.']}
			year={1974}
			title="A New Look at the Statistical Model Identification"
			journal="IEEE Transactions on Automatic Control, 19(6), 716–723."
			link="https://doi.org/10.1109/TAC.1974.1100705"
		/>
		<BibElement
			authors={['Allen, D. M.']}
			year={1974}
			title="The Relationship Between Variable Selection and Data Augmentation and a Method for Prediction"
			journal="Technometrics, 16(1), 125–127."
			link="https://doi.org/10.1080/00401706.1974.10489157"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer (source du jeu de données prostate du package ESL)."
			link="https://web.stanford.edu/~hastie/ElemStatLearn/"
		/>
		<BibElement
			authors={['Mallows, C. L.']}
			year={1973}
			title="Some Comments on Cp"
			journal="Technometrics, 15(4), 661–675."
			link="https://doi.org/10.2307/1267380"
		/>
		<BibElement
			authors={['Schwarz, G.']}
			year={1978}
			title="Estimating the Dimension of a Model"
			journal="The Annals of Statistics, 6(2), 461–464."
			link="https://doi.org/10.1214/aos/1176344136"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		margin: 0.75rem 0;
	}

	.data-table th,
	.data-table td {
		padding: 0.35rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.data-table th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
	}
</style>
