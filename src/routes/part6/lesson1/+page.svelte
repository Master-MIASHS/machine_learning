<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';

	const meta = getPageByPath('/part6/lesson1');
	const tracker = createPageTracker(meta as PageMeta);
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	interface TocEntry {
		id: string;
		label: string;
		description?: string;
		color: 'epistemic' | 'positive' | 'neutral' | 'belief' | 'surprise' | 'agent';
	}

	const tocEntries: TocEntry[] = [
		{
			id: 'introduction',
			label: 'Introduction',
			description: 'Concentration et risque empirique',
			color: 'epistemic'
		},
		{
			id: 'concentration',
			label: 'Inégalités de concentration',
			description: 'Exemples et applications',
			color: 'belief'
		},
		{
			id: 'risque-empirique',
			label: 'Risque empirique',
			description: 'Définition et propriétés',
			color: 'neutral'
		}
	];

	// Mathematical formulas
	const hoeffdingInequality = String.raw`\mathbb{P}\left(\left|\frac{1}{n}\sum_{i=1}^n X_i - \mathbb{E}[X]\right| \geq t\right) \leq 2\exp\left(-\frac{2nt^2}{(b-a)^2}\right)`;
	const empiricalRiskDefinition = String.raw`R_n(h) = \frac{1}{n}\sum_{i=1}^n \ell(h(X_i), Y_i)`;
	const trueRiskDefinition = String.raw`R(h) = \mathbb{E}_{(X,Y)}[\ell(h(X), Y)]`;
	const concentrationBound = String.raw`R(h) - R_n(h) \leq \epsilon(n, \delta)`;
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Concentration et risque empirique'}
	subtitle="Comment quantifier la convergence des estimateurs ?"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>
		<p>
			Dans cette leçon, nous abordons les <strong>inégalités de concentration</strong> et le
			<strong>risque empirique</strong>. Ces outils sont essentiels pour quantifier la convergence
			des estimateurs et comprendre comment les modèles appris sur des échantillons finis se
			comportent en généralisation.
		</p>
		<p>
			Nous commencerons par des exemples d'inégalités de concentration, puis nous définirons le
			risque empirique et ses propriétés. Enfin, nous verrons comment ces concepts s'appliquent à
			l'apprentissage statistique.
		</p>

		<h2 id="concentration">Inégalités de concentration</h2>
		<p>
			Les inégalités de concentration permettent de borner la probabilité qu'une variable aléatoire
			s'écarte de sa moyenne. Elles sont particulièrement utiles pour analyser la convergence des
			estimateurs.
		</p>
		<p>
			Un exemple classique est l'<strong>inégalité de Hoeffding</strong>, qui donne une borne
			exponentielle pour la somme de variables aléatoires bornées. Soient <KatexInline
				formula="X_1, X_2, \dots, X_n"
			/> des variables aléatoires indépendantes et bornées par <KatexInline
				formula="a \leq X_i \leq b"
			/>. Alors, pour tout <KatexInline formula="t > 0" />, on a :
			<KatexBlock formula={hoeffdingInequality} />
			où {`$\mathbb{E}[X]$`} est l'espérance des {`$X_i$`}.
		</p>
		<p>
			D'autres inégalités, comme celles de <strong>Bernstein</strong> ou de
			<strong>McDiarmid</strong>, offrent des bornes plus fines dans certains contextes. Par
			exemple, l'inégalité de Bernstein est utile lorsque les variables aléatoires ont une variance
			limitée.
		</p>

		<h2 id="risque-empirique">Risque empirique</h2>
		<p>
			Le <strong>risque empirique</strong> est une estimation du risque vrai basée sur un
			échantillon fini.
			{`Soit $\mathcal{S}_n = \{(X_i, Y_i)\}_{i=1}^n$ un échantillon de données.`}
			Le risque empirique d'un modèle <KatexInline formula="h" /> est défini par :
			<KatexBlock formula={empiricalRiskDefinition} />
			où <KatexInline formula="\ell" /> est une fonction de perte (par exemple, la perte 0-1 pour la classification).
			Le <strong>risque vrai</strong> est quant à lui défini par :
			<KatexBlock formula={trueRiskDefinition} />
		</p>
		<p>
			L'objectif en apprentissage statistique est de minimiser le risque empirique, tout en
			garantissant que le risque vrai reste faible. Les inégalités de concentration permettent de
			borner la différence entre le risque empirique et le risque vrai. Par exemple, on peut montrer
			que, avec une probabilité <KatexInline formula="1 - \delta" />, on a :
			<KatexBlock formula={concentrationBound} />
			où <KatexInline formula="\epsilon(n, \delta)" /> est une fonction décroissante en <KatexInline
				formula="n"
			/>.
		</p>
		<p>
			Cette notion est centrale en apprentissage statistique, car elle permet de relier la
			performance sur les données d'entraînement à la performance en généralisation.
		</p>

		<Callout type="summary" title="Retenir">
			Les inégalités de concentration et le risque empirique sont des outils fondamentaux pour
			analyser la convergence des estimateurs. Ils permettent de quantifier la confiance que l'on
			peut avoir dans les modèles appris sur des données finies.
		</Callout>
	</TheorySection>
	<Bibliography>
		<BibElement
			authors={['Boucheron, S.', 'Lugosi, G.', 'Massart, P.']}
			year={2013}
			title="Concentration Inequalities: A Nonasymptotic Theory of Independence"
			journal="Oxford University Press."
			link="https://global.oup.com/academic/product/concentration-inequalities-9780199535255"
		/>
	</Bibliography>
</PageTemplate>
