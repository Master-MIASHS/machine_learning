<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import VCShatteringExplorer from '$lib/components/demos/VCShatteringExplorer.svelte';
	import SauerGrowthDemo from '$lib/components/demos/SauerGrowthDemo.svelte';
	import MarginVCExplorer from '$lib/components/demos/MarginVCExplorer.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part6/lesson3');
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
			description: 'Quand |H| = +∞, il faut une mesure de complexité plus fine que le cardinal',
			color: 'epistemic'
		},
		{
			id: 'brisure-dimension-vc',
			label: 'Brisure et dimension VC',
			description: 'Seuils, intervalles, hyperplans — trois exemples de VCdim croissante',
			color: 'belief'
		},
		{
			id: 'coefficient-brisure-sauer-shelah',
			label: 'Coefficient de brisure et lemme de Sauer-Shelah',
			description: 'De la croissance exponentielle à la croissance polynomiale',
			color: 'surprise'
		},
		{
			id: 'theoreme-generalisation-vc',
			label: 'Théorème de généralisation VC',
			description: 'Théorème 3.3 — une borne uniforme même pour |H| infini',
			color: 'neutral'
		},
		{
			id: 'application-svm',
			label: 'Application : borne VC pour le SVM',
			description:
				'Théorème 3.4 — la dimension VC dépend de la marge, pas de la dimension ambiante',
			color: 'agent'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const shatteringDef =
		'\\forall (y_1,\\dots,y_m)\\in\\{0,1\\}^m,\\ \\exists h\\in\\mathcal H,\\ h(x_i)=y_i\\ \\forall i';
	const shatteringCount = '|\\{(h(x_1),\\dots,h(x_m)) : h\\in\\mathcal H\\}| = 2^m';
	const vcdimDef =
		'\\mathrm{VCdim}(\\mathcal H) = \\sup\\{m\\in\\mathbb N : \\exists\\, C\\subset\\mathcal X,\\ |C|=m,\\ \\mathcal H \\text{ brise } C\\}';

	const thresholdsFamily =
		'\\mathcal H = \\{x\\mapsto\\mathbb{1}_{x\\ge\\theta} : \\theta\\in\\mathbb R\\}';
	const intervalsFamily = '\\mathcal H = \\{x\\mapsto\\mathbb{1}_{x\\in[a,b]} : a\\le b\\}';
	const hyperplanesFamily =
		'\\mathcal H = \\{x\\mapsto\\mathbb{1}_{w^\\top x \\ge b} : w\\in\\mathbb R^d,\\ b\\in\\mathbb R\\}';

	const growthCoeffDef =
		'\\Pi_{\\mathcal H}(m) = \\max_{C\\subset\\mathcal X,\\ |C|=m} |\\{(h(x_1),\\dots,h(x_m)) : h\\in\\mathcal H\\}| \\quad (\\le 2^m)';
	const sauerShelahStatement =
		'\\mathrm{VCdim}(\\mathcal H)=d<+\\infty \\implies \\Pi_{\\mathcal H}(m) \\le \\sum_{i=0}^d \\binom{m}{i}';
	const sauerShelahEnvelope =
		'\\Pi_{\\mathcal H}(m) \\le \\left(\\frac{em}{d}\\right)^d \\quad (m\\ge d)';

	const vcBoundStatement =
		'\\mathbb{P}^n\\Big(\\forall h\\in\\mathcal H,\\ |R(h)-R_{\\mathcal S_n}(h)| \\le \\sqrt{\\frac{8d\\log(2en/d) + 8\\log(4/\\delta)}{n}}\\Big) \\ge 1-\\delta';

	const marginClassifierDef = 'h_{w,b}(x) = \\mathrm{sgn}(w^\\top x - b)';
	const marginCondition = '\\forall i,\\quad Y_i(w^\\top X_i - b) \\ge \\gamma';
	const marginFamily =
		'\\mathcal H_\\gamma = \\{h_{w,b} : \\|w\\|_2=1,\\ h_{w,b} \\text{ sépare avec marge } \\gamma\\}';
	const svmVCDimBound =
		'\\|X_i\\|_2 \\le R \\text{ p.s.} \\implies \\mathrm{VCdim}(\\mathcal H_\\gamma) \\le \\left\\lfloor \\frac{R^2}{\\gamma^2} \\right\\rfloor';
	const svmFullBound =
		'|R(h)-R_{\\mathcal S_n}(h)| \\le \\sqrt{\\frac{8\\lfloor R^2/\\gamma^2\\rfloor \\log(2en\\gamma^2/R^2) + 8\\log(4/\\delta)}{n}}';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Dimension VC, Sauer-Shelah et SVM'}
	subtitle="Mesurer la complexité d'une classe infinie sans jamais compter ses éléments"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			Les bornes de la leçon précédente reposent entièrement sur <KatexInline
				formula={String.raw``}
			/> — inutilisable dès que <KatexInline formula={String.raw``} /> est infinie, ce qui est le cas
			de la quasi-totalité des classes utilisées en pratique : hyperplans de <KatexInline
				formula={String.raw``}
			/>, réseaux de neurones, ou plus généralement toute classe paramétrée par des réels. Il faut
			une notion de complexité qui ne mesure pas le <em>cardinal</em> de <KatexInline
				formula={String.raw``}
			/> mais sa capacité à <strong>discriminer des points</strong> — c'est l'objet de la dimension de
			Vapnik-Chervonenkis.
		</p>

		<h2 id="brisure-dimension-vc">Brisure et dimension VC</h2>

		<DefinitionBlock title="Brisure">
			<p>
				On dit que <KatexInline formula={String.raw``} /> <strong>brise</strong> un ensemble fini
				<KatexInline formula={String.raw``} /> si tout étiquetage est réalisable :
			</p>
			<KatexBlock formula={shatteringDef} />
			<p>Autrement dit, <KatexInline formula={String.raw``} /> réalise toutes les dichotomies :</p>
			<KatexBlock formula={shatteringCount} />
		</DefinitionBlock>

		<DefinitionBlock title="Dimension de Vapnik-Chervonenkis">
			<KatexBlock formula={vcdimDef} />
			<p>
				Si <KatexInline formula={String.raw``} /> brise des ensembles de taille arbitraire, on pose
				<KatexInline formula={String.raw``} />.
			</p>
		</DefinitionBlock>

		<ExampleBlock title="Trois exemples de dimension VC croissante">
			<p>
				<strong>Seuils sur <KatexInline formula={String.raw``} /></strong> (<KatexInline
					formula={thresholdsFamily}
				/>) : tout singleton est brisé, mais aucune paire ordonnée <KatexInline
					formula={String.raw``}
				/> ne l'est (l'étiquetage <KatexInline formula={String.raw``} /> est impossible). <KatexInline
					formula={String.raw``}
				/>.
			</p>
			<p>
				<strong>Intervalles sur <KatexInline formula={String.raw``} /></strong> (<KatexInline
					formula={intervalsFamily}
				/>) : toute paire est brisée, mais aucun triplet ordonné ne l'est (<KatexInline
					formula={String.raw``}
				/> impossible). <KatexInline formula={String.raw``} />.
			</p>
			<p>
				<strong>Hyperplans de <KatexInline formula={String.raw``} /></strong> (<KatexInline
					formula={hyperplanesFamily}
				/>) : <KatexInline formula={String.raw``} />.
			</p>
		</ExampleBlock>

		<InteractiveSection
			number="3.1"
			title="Briser un ensemble de points"
			onInteract={tracker.trackInteraction}
		>
			<VCShatteringExplorer />
		</InteractiveSection>

		<h2 id="coefficient-brisure-sauer-shelah">Coefficient de brisure et lemme de Sauer-Shelah</h2>

		<p>
			La dimension VC permet de borner le nombre de dichotomies effectivement réalisables sur un
			échantillon fini, via le <strong>coefficient de brisure</strong>.
		</p>

		<DefinitionBlock title="Coefficient de brisure">
			<KatexBlock formula={growthCoeffDef} />
			<p>
				C'est le nombre maximal de dichotomies que <KatexInline formula={String.raw``} /> peut réaliser
				sur <KatexInline formula={String.raw``} /> points quelconques.
			</p>
		</DefinitionBlock>

		<TheoremBlock title="Lemme de Sauer-Shelah (1972)">
			<p>
				Si <KatexInline formula={String.raw``} />, alors pour tout
				<KatexInline formula={String.raw``} /> :
			</p>
			<KatexBlock formula={sauerShelahStatement} />
			<p>En particulier, pour <KatexInline formula={String.raw``} /> :</p>
			<KatexBlock formula={sauerShelahEnvelope} />
		</TheoremBlock>

		<Callout type="insight" title="Le point essentiel">
			Le coefficient de brisure est <strong>polynomial</strong> en <KatexInline
				formula={String.raw``}
			/>
			(de degré <KatexInline formula={String.raw``} />) dès que la dimension VC est finie — contre
			<KatexInline formula={String.raw``} /> dans le cas général. C'est ce basculement, de la croissance
			exponentielle à la croissance polynomiale exactement au rang <KatexInline
				formula={String.raw``}
			/>, qui rend une borne de généralisation possible même pour une classe infinie.
		</Callout>

		<InteractiveSection
			number="3.2"
			title="De la croissance exponentielle à la croissance polynomiale"
			onInteract={tracker.trackInteraction}
		>
			<SauerGrowthDemo />
		</InteractiveSection>

		<h2 id="theoreme-generalisation-vc">Théorème de généralisation VC</h2>

		<p>
			On peut maintenant énoncer une borne de généralisation valable même pour <KatexInline
				formula={String.raw``}
			/>, en remplaçant <KatexInline formula={String.raw``} /> par un terme faisant intervenir
			<KatexInline formula={String.raw``} /> — c'est le rôle joué par le lemme de Sauer-Shelah dans la
			démonstration (omise ici, elle raffine l'argument d'union bound de la leçon précédente en l'appliquant
			non plus à <KatexInline formula={String.raw``} /> tout entier mais aux dichotomies effectivement
			réalisables sur l'échantillon).
		</p>

		<TheoremBlock number="3.3" title="Borne VC">
			<p>
				Soit <KatexInline formula={String.raw``} /> de dimension VC finie <KatexInline
					formula={String.raw``}
				/>. Pour tout <KatexInline formula={String.raw``} />, avec probabilité <KatexInline
					formula={String.raw``}
				/> :
			</p>
			<KatexBlock formula={vcBoundStatement} />
		</TheoremBlock>

		<p>
			La structure est la même qu'au Théorème 3.2 (racine d'un terme de complexité sur <KatexInline
				formula={String.raw``}
			/>), à ceci près que <KatexInline formula={String.raw``} /> a été remplacé par
			<KatexInline formula={String.raw``} /> — un terme qui, lui, reste fini même quand
			<KatexInline formula={String.raw``} /> ne l'est pas.
		</p>

		<h2 id="application-svm">Application : borne VC pour le SVM</h2>

		<p>
			Le SVM (Support Vector Machine) cherche l'hyperplan de marge maximale. La théorie VC en donne
			une borne de généralisation particulièrement élégante, car la dimension VC dépend de la marge
			— pas de la dimension ambiante <KatexInline formula={String.raw``} /> de l'espace d'entrée.
		</p>

		<DefinitionBlock title="Classifieur à marge">
			<p>
				Soit <KatexInline formula={String.raw``} />. Le classifieur <KatexInline
					formula={marginClassifierDef}
				/> classe l'échantillon avec marge <KatexInline formula={String.raw``} /> si :
			</p>
			<KatexBlock formula={marginCondition} />
			<p>
				On note <KatexInline formula={String.raw``} /> la classe des classifieurs linéaires de norme <KatexInline
					formula={String.raw``}
				/> séparant les données avec marge <KatexInline formula={String.raw``} /> :
			</p>
			<KatexBlock formula={marginFamily} />
		</DefinitionBlock>

		<TheoremBlock number="3.4" title="Borne VC pour le SVM (Vapnik, 1995)">
			<p>
				Supposons <KatexInline formula={svmVCDimBound} />. En appliquant le Théorème 3.3, pour tout <KatexInline
					formula={String.raw``}
				/>, avec probabilité <KatexInline formula={String.raw``} /> :
			</p>
			<KatexBlock formula={svmFullBound} />
		</TheoremBlock>

		<Callout type="insight" title="Ce que cette borne dit vraiment">
			La dimension VC de <KatexInline formula={String.raw``} /> ne dépend <strong>pas</strong> de <KatexInline
				formula={String.raw``}
			/>, la dimension de l'espace d'entrée — seulement du rapport
			<KatexInline formula={String.raw``} /> entre le rayon des données et la marge obtenue. Un SVM peut
			ainsi généraliser correctement même en très grande dimension (voire en dimension infinie, via le
			kernel trick), à condition d'obtenir une marge suffisamment grande relative à l'échelle des données.
			C'est tout l'intérêt de maximiser la marge plutôt que de se contenter d'une séparation quelconque.
		</Callout>

		<InteractiveSection
			number="3.3"
			title="Marge, rayon et dimension VC"
			onInteract={tracker.trackInteraction}
		>
			<MarginVCExplorer />
		</InteractiveSection>

		<Callout type="summary" title="Retenir">
			La dimension VC mesure la complexité d'une classe par sa capacité à discriminer des points,
			pas par son cardinal — elle reste finie pour des classes infinies comme les hyperplans (<KatexInline
				formula={String.raw``}
			/>). Le lemme de Sauer-Shelah transforme cette borne combinatoire en une borne polynomiale sur
			le nombre de dichotomies réalisables, ce qui permet d'étendre le théorème de généralisation à <KatexInline
				formula={String.raw``}
			/>. Appliquée aux classifieurs à marge, cette théorie explique pourquoi le SVM généralise bien
			indépendamment de la dimension ambiante — un résultat qui ne tiendra plus, comme le montrera
			la leçon suivante, face aux réseaux de neurones modernes.
		</Callout>
	</TheorySection>
</PageTemplate>
