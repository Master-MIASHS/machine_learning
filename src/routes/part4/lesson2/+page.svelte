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
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { TocEntry } from '$lib/components/narrative/TableOfContents.svelte';

	const meta = getPageByPath('/part4/lesson2');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Formules (course_sources/sophie/ModèleLinéaire_ANOVA_ANCOVA.pdf) ──
	const anovaEq = String.raw`Y_{j,k} = \beta_0 + \beta_j + \varepsilon_{j,k}`;
	const twoWayEq = String.raw`Y_{ijk} = \beta_0 + \alpha_i + \beta_j + \varepsilon_{ijk}`;
	const twoWayInterEq = String.raw`Y_{ijk} = \beta_0 + \alpha_i + \beta_j + \gamma_{ij} + \varepsilon_{ijk}`;
	const ancovaEq = String.raw`Y_{jk} = \beta_0 + \beta_j + \delta\, x_{jk} + \varepsilon_{jk}`;
	const ancovaInterEq = String.raw`Y_{jk} = \beta_0 + \beta_j + (\delta + \delta_j)\, x_{jk} + \varepsilon_{jk}`;

	const tocEntries: TocEntry[] = [
		{ id: 'natures', label: '2.1 Deux natures de covariables', color: 'belief' },
		{ id: 'ecriture-anova', label: "2.2 L'ANOVA : un paramètre par niveau", color: 'neutral' },
		{ id: 'contraintes', label: '2.3 Les contraintes de plein rang', color: 'positive' },
		{ id: 'deux-facteurs', label: '2.4 ANOVA à deux facteurs et interaction', color: 'surprise' },
		{ id: 'ancova', label: '2.5 ANCOVA : facteurs et régresseurs mélangés', color: 'agent' }
	];
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Le modèle linéaire général : ANOVA et ANCOVA'}
	subtitle="Covariables qualitatives, codages des facteurs, interaction et analyse de covariance"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="natures">2.1 Deux natures de covariables</h2>

		<p>
			Les <strong>modèles linéaires</strong> (LM) englobent deux grandes familles :
		</p>
		<ul>
			<li>
				les modèles de <strong>régession linéaire</strong> — les covariables sont des
				<strong>régresseurs</strong> : des variables quantitatives (on explique par
				exemple la teneur en ozone par la température ou la nébulosité) ;
			</li>
			<li>
				les modèles d'<strong>analyse de la variance</strong> (ANOVA) — les covariables
				sont des <strong>facteurs</strong> : des variables qualitatives (on explique la
				teneur en ozone par la direction du vent ou la saison).
			</li>
		</ul>

		<p>
			Tout dépend donc de la matrice <KatexInline formula="X" /> des covariables… mais
			<KatexInline formula="Y" /> ne change pas : on cherche dans les deux cas à
			expliquer une <strong>mesure numérique</strong>. On peut même mélanger les deux
			natures de covariables — ce sont les modèles d'<strong>analyse de covariance</strong>
			(ANCOVA), §2.5.
		</p>

		<DefinitionBlock number="1" title="Définition (régresseur vs facteur)">
			<p>
				Un <strong>régresseur</strong> prend des valeurs numériques : une infinité de
				valeurs possibles, souvent toutes différentes dans l'échantillon — donc une
				valeur de <KatexInline formula="Y" /> différente pour chaque valeur de
				<KatexInline formula="X" />. Un <strong>facteur</strong> prend des
				<strong>niveaux</strong> : un nombre fini et faible de modalités — les valeurs
				observées de <KatexInline formula="Y" /> se répètent dans chaque niveau.
			</p>
		</DefinitionBlock>

		<h2 id="ecriture-anova">2.2 L'ANOVA : un paramètre par niveau</h2>

		<p>
			Dans un modèle de régression simple
			<KatexInline formula={String.raw`Y_i = \beta_0 + \beta_1 x_i + \varepsilon_i`} />,
			on cherche la part de variabilité de <KatexInline formula="Y" /> induite par les
			variations du régresseur : un paramètre par régresseur, où
			<KatexInline formula={String.raw`\beta_0`} /> est l'intercept (niveau moyen de
			<KatexInline formula="Y" /> quand <KatexInline formula={String.raw`x = 0`} />) et
			<KatexInline formula={String.raw`\beta_1`} /> la pente (impact d'un accroissement de
			1 de <KatexInline formula="x" />).
		</p>

		<p>
			Pour un facteur, il y a <strong>plusieurs observations de Y pour chaque niveau</strong>
			: on note <KatexInline formula={String.raw`y_{j,k}`} /> la réponse de l'individu
			<KatexInline formula="k" /> dans le niveau <KatexInline formula="j" />, et le modèle
			d'ANOVA est
		</p>

		<KatexBlock formula={anovaEq} />

		<p>
			on cherche la part de variabilité de <KatexInline formula="Y" /> induite par les
			différents niveaux du facteur. Il y a <strong>un paramètre par niveau</strong> du
			facteur :
		</p>
		<ul>
			<li>
				<KatexInline formula={String.raw`\beta_0`} /> — l'intercept, valeur moyenne des
				<KatexInline formula="y" /> observés ;
			</li>
			<li>
				<KatexInline formula={String.raw`\beta_j`} /> — l'impact du niveau
				<KatexInline formula="j" /> du facteur sur la réponse.
			</li>
		</ul>

		<h2 id="contraintes">2.3 Les contraintes de plein rang</h2>

		<p>
			L'estimateur des moindres carrés
			<KatexInline formula={String.raw`\hat{\beta} = (X^{\mathrm{T}}X)^{-1}X^{\mathrm{T}}Y`} />
			exige que <KatexInline formula={String.raw`X^{\mathrm{T}}X`} /> soit inversible,
			c'est-à-dire que <KatexInline formula="X" /> soit <strong>de plein rang</strong> :
			la dimension de l'espace engendré par les colonnes de
			<KatexInline formula="X" /> vaut le nombre de colonnes
			<KatexInline formula="p" />. Avec un facteur à <KatexInline formula="J" /> niveaux,
			on ne peut pas prendre la colonne de chaque niveau <em>et</em> une constante — les
			colones seraient linéairement dépendantes. On impose donc une <strong>contrainte</strong>,
			et il en existe trois usuelles :
		</p>

		<DefinitionBlock number="2" title="Contrainte : sans intercept">
			<p>
				<KatexInline formula={String.raw`\beta_0 = 0`} /> (pas de colonne de constantes).
				Pour tout niveau <KatexInline formula={String.raw`j \in \{1, \dots, J\}`} />,
				<KatexInline formula={String.raw`\beta_j`} /> est directement la
				<strong>valeur moyenne de la réponse dans le niveau <em>j</em></strong>.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="3" title="Contrainte : niveau de référence">
			<p>
				<KatexInline formula={String.raw`\beta_1 = 0`} /> — le niveau 1 sert de
				référence : <KatexInline formula={String.raw`\beta_0`} /> est la moyenne de la
				réponse dans le niveau 1, et pour
				<KatexInline formula={String.raw`j \in \{2, \dots, J\}`} />,
				<KatexInline formula={String.raw`\beta_j`} /> est l'<strong>écart</strong> de la
				réponse du niveau <KatexInline formula="j" /> au niveau 1. C'est le codage
				<KatexInline formula={String.raw`\texttt{contr.treatment}`} /> de R.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="4" title="Contrainte : somme des paramètres">
			<p>
				<KatexInline formula={String.raw`\sum_{j=1}^{J}\beta_j = 0`} /> —
				<KatexInline formula={String.raw`\beta_0`} /> est la <strong>moyenne des
				paramètres</strong> (moyenne générale), pour
				<KatexInline formula={String.raw`j \in \{1, \dots, J-1\}`} /> la moyenne du
				niveau <KatexInline formula="j" /> vaut
				<KatexInline formula={String.raw`\beta_0 + \beta_j`} />, et celle du niveau
				<KatexInline formula="J" /> vaut
				<KatexInline formula={String.raw`\beta_0 - \sum_{j=1}^{J-1}\beta_j`} />.
				C'est le codage <KatexInline formula={String.raw`\texttt{contr.sum}`} /> de R.
			</p>
		</DefinitionBlock>

		<p>
			La contrainte rend les paramètres identifiables : l'ajustement
			<KatexInline formula={String.raw`\hat{Y}`} /> (et les moyennes par niveau) est le
			même dans les trois cas, seules la matrice <KatexInline formula="X" /> et
			l'interprétation des <KatexInline formula={String.raw`\beta_j`} /> changent.
		</p>

		<InteractiveSection number="2.1" title="Trois codages d'un facteur" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmAnovaCoding.svelte')} />
		</InteractiveSection>

		<h2 id="deux-facteurs">2.4 ANOVA à deux facteurs et interaction</h2>

		<p>
			Soit <KatexInline formula={String.raw`F_1`} /> (à <KatexInline formula={String.raw`J_1`} />
			modalités) et <KatexInline formula={String.raw`F_2`} /> (à
			<KatexInline formula={String.raw`J_2`} /> modalités) deux facteurs, avec plusieurs
			observations de <KatexInline formula="Y" /> à chaque <strong>croisement</strong> d'une
			modalité de <KatexInline formula={String.raw`F_1`} /> et d'une de
			<KatexInline formula={String.raw`F_2`} /> :
			<KatexInline formula={String.raw`y_{ijk}`} /> est l'observation de l'individu
			<KatexInline formula="k" /> au croisement du niveau <KatexInline formula="i" /> de
			<KatexInline formula={String.raw`F_1`} /> et du niveau
			<KatexInline formula="j" /> de <KatexInline formula={String.raw`F_2`} />. Le modèle
			à <strong>effets principaux</strong> est
		</p>

		<KatexBlock formula={twoWayEq} />

		<p>
			il compte <KatexInline formula={String.raw`1 + J_1 + J_2`} /> paramètres :
			<KatexInline formula={String.raw`\beta_0`} /> est la valeur moyenne des
			<KatexInline formula="y" /> observés, <KatexInline formula={String.raw`\alpha_i`} />
			l'impact du niveau <KatexInline formula="i" /> de
			<KatexInline formula={String.raw`F_1`} />,
			<KatexInline formula={String.raw`\beta_j`} /> celui du niveau
			<KatexInline formula="j" /> de <KatexInline formula={String.raw`F_2`} />.
			Contraintes usuelles : niveaux de référence
			<KatexInline formula={String.raw`\alpha_1 = 0`} /> et
			<KatexInline formula={String.raw`\beta_1 = 0`} /> — alors pour
			<KatexInline formula={String.raw`i \in \{2, \dots, J_1\}`} />,
			<KatexInline formula={String.raw`\alpha_i`} /> est l'écart du niveau
			<KatexInline formula="i" /> au niveau 1 de
			<KatexInline formula={String.raw`F_1`} />, de même pour
			<KatexInline formula={String.raw`\beta_j`} />.
		</p>

		<p>
			L'additivité des effets principaux signifie que
			<KatexInline formula={String.raw`\alpha_i`} /> est l'effet du niveau
			<KatexInline formula="i" /> de <KatexInline formula={String.raw`F_1`} />
			<strong>quel que soit</strong> le niveau de
			<KatexInline formula={String.raw`F_2`} />, et réciproquement. Mais il arrive que le
			niveau <KatexInline formula="i" /> de
			<KatexInline formula={String.raw`F_1`} /> ait un <strong>effet différent selon le
			niveau</strong> de <KatexInline formula={String.raw`F_2`} /> : par exemple,
			l'orientation du vent n'a pas le même effet avec ou sans pluie. On ajoute alors les
			termes d'<strong>interaction</strong>
			<KatexInline formula={String.raw`\gamma_{ij}`} /> :
		</p>

		<KatexBlock formula={twoWayInterEq} />

		<p>
			avec les contraintes
			<KatexInline formula={String.raw`\gamma_{i1} = 0`} /> pour tout
			<KatexInline formula="i" /> et <KatexInline formula={String.raw`\gamma_{1j} = 0`} />
			pour tout <KatexInline formula="j" />. Dans R, l'interaction est désignée par
			<KatexInline formula={String.raw`F_1 : F_2`} />, et le modèle complet par
			<KatexInline formula={String.raw`Y \sim F_1 + F_2 + F_1 : F_2`} />, abrégé
			<KatexInline formula={String.raw`Y \sim F_1 * F_2`} />.
		</p>

		<ExampleBlock number="1" title="Exemple (vent × pluie)">
			<p>
				Pour une parcelle, la teneur en ozone dépend de la direction du vent
				(<KatexInline formula={String.raw`F_1`} />) et de la présence de pluie
				(<KatexInline formula={String.raw`F_2`} />). Sans interaction, l'effet d'un
				vent de nord est identique qu'il pleuve ou non ; avec interaction
				<KatexInline formula={String.raw`\gamma_{ij}`} />, l'effet du vent de nord
				peut être nul par temps sec et fort par temps de pluie — l'effet de
				<KatexInline formula={String.raw`F_1`} /> <em>interagit</em> avec celui de
				<KatexInline formula={String.raw`F_2`} />.
			</p>
		</ExampleBlock>

		<InteractiveSection number="2.2" title="Interaction entre deux facteurs" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmInteractionPlot.svelte')} />
		</InteractiveSection>

		<h2 id="ancova">2.5 ANCOVA : facteurs et régresseurs mélangés</h2>

		<p>
			Dans un modèle d'<strong>analyse de covariance</strong>, la partie explicative
			mélange un régresseur <KatexInline formula="X" /> et un facteur
			<KatexInline formula="F" />. Sans interaction
			<KatexInline formula={String.raw`Y \sim X + F`} />, le modèle est
		</p>

		<KatexBlock formula={ancovaEq} />

		<p>
			: l'effet du facteur n'a d'impact <strong>que sur l'intercept</strong> — les
			droites de régression de chaque niveau sont <strong>parallèles</strong>. Avec
			interaction <KatexInline formula={String.raw`Y \sim X * F`} />,
		</p>

		<KatexBlock formula={ancovaInterEq} />

		<p>
			: l'effet du facteur a un impact sur l'intercept <strong>et</strong> sur la pente
			— les droites de chaque niveau ne sont plus parallèles.
		</p>

		<Callout type="insight" title="Dans R">
			<p>
				Le facteur est codé automatiquement selon
				<code>contr.treatment</code> (ou <code>contr.sum</code> via
				<code>options(contrasts = c("contr.sum", "contr.treatment"))</code>) ;
				<code>summary()</code> d'un <code>lm</code> renvoie un tableau d'ANOVA avec
				les sommes de carrés par effet — à comparer au §1.6 de la leçon précédente.
			</p>
		</Callout>

		<Callout type="note" title="Vers la suite">
			<p>
				Avec des erreurs gaussiennes, on pourra tester si un facteur (ou une
				interaction) est significatif — le <strong>test F</strong> de la
				<a href="/part4/lesson3">leçon 3</a>. Et si les facteurs sont corrélés entre
				eux, le diagnostic de la <a href="/part4/lesson4">leçon 4</a> s'appliquera
				à la matrice de design complète.
			</p>
		</Callout>
	</TheorySection>
</PageTemplate>
