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
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import VCShatteringExplorer from '$lib/components/demos/VCShatteringExplorer.svelte';
	import SauerGrowthDemo from '$lib/components/demos/SauerGrowthDemo.svelte';
	import MarginVCExplorer from '$lib/components/demos/MarginVCExplorer.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import Quiz, { type QuizItem } from '$lib/components/demos/Quiz.svelte';

	const meta = getPageByPath('/part8/lesson3');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question: "Selon la leçon, que signifie dire qu'une classe H brise un ensemble C de m points ?",
			options: [
				'Que H contient au moins m classifieurs.',
				'Que tout étiquetage de C est réalisable : pour tout (y_1, ..., y_m) dans {0,1}^m, il existe h ∈ H avec h(x_i) = y_i pour tout i — autrement dit, H réalise les 2^m dichotomies.',
				'Que H sépare les points de C avec une marge strictement positive.',
				"Que C est nécessairement contenu dans l'échantillon d'entraînement."
			],
			answerIndex: 1,
			explanation:
				"Définition de la brisure : H réalise toutes les dichotomies de C, c'est-à-dire que le nombre d'étiquetages réalisables sur C est exactement 2^m ; la dimension VC est la plus grande taille m d'un ensemble brisé, avec la convention VCdim = +∞ si H brise des ensembles de taille arbitraire."
		},
		{
			question: "D'après les exemples de la leçon, quelle est la dimension VC des hyperplans de ℝ^d ?",
			options: ['d', '2d', 'd + 1', 'd²'],
			answerIndex: 2,
			explanation:
				"La leçon donne une série d'exemples à dimension VC croissante : seuils sur ℝ (VCdim = 1, l'étiquetage (1, 0) étant impossible sur une paire ordonnée), intervalles sur ℝ (VCdim = 2, l'étiquetage (1, 0, 1) impossible sur un triplet ordonné), hyperplans de ℝ^d (VCdim = d + 1)."
		},
		{
			question:
				'Quel est le rôle essentiel du lemme de Sauer-Shelah dans la démonstration de la borne de généralisation VC ?',
			options: [
				"Il borne le nombre de dichotomies réalisables sur m points de façon polynomiale en m — (em/d)^d dès que VCdim = d < +∞ — au lieu de 2^m : c'est ce qui permet d'appliquer l'union bound aux dichotomies réalisables plutôt qu'à H, même quand H est infini.",
				"Il montre que |H| est fini pour toute classe d'hyperplans.",
				'Il donne une borne inférieure sur la dimension VC en fonction de n.',
				"Il montre que l'union bound est inutile dès que H est fini."
			],
			answerIndex: 0,
			explanation:
				"Le cartouche « Le point essentiel » résume : le basculement de la croissance exponentielle (2^m) à la croissance polynomiale en m (de degré d) est ce qui rend une borne de généralisation possible même pour une classe infinie ; la démonstration (omise dans la leçon) raffine l'union bound de la leçon précédente en l'appliquant aux dichotomies effectivement réalisables sur l'échantillon."
		},
		{
			question:
				'Selon le Théorème 3.4 (Vapnik, 1995), si ||X_i||_2 ≤ R presque sûrement, que peut-on dire de VCdim(H_gamma), la classe des classifieurs linéaires de norme 1 séparant avec marge gamma ?',
			options: [
				'Elle est égale à d + 1, comme pour tous les hyperplans de ℝ^d.',
				"Elle est majorée par n, la taille de l'échantillon.",
				'Elle est infinie, puisque H_gamma contient une infinité de classifieurs.',
				'Elle est majorée par floor(R²/gamma²) : elle ne dépend que du rapport entre le rayon des données et la marge, pas de la dimension ambiante d.'
			],
			answerIndex: 3,
			explanation:
				"Théorème 3.4 : VCdim(H_gamma) ≤ floor(R²/gamma²) ; le cartouche d'insistion souligne que cette dimension VC ne dépend pas de la dimension de l'espace d'entrée — seulement du rapport R²/gamma² — ce qui explique que le SVM peut généraliser correctement même en très grande dimension, à condition d'une marge suffisamment grande relative à l'échelle des données."
		},
		{
			question: 'Dans le Théorème 3.3 (borne VC), que remplace-t-on, par rapport au Théorème 3.2 ?',
			options: [
				'log|H| est remplacé par log n, qui croît plus lentement.',
				'log|H| est remplacé par le terme d log(2en/d), qui reste fini même quand |H| est infini — par exemple pour les hyperplans de ℝ^d.',
				"log|H| est remplacé par log(2/δ) seul, la complexité de la classe n'entrant plus.",
				"log|H| est remplacé par n, la taille de l'échantillon."
			],
			answerIndex: 1,
			explanation:
				"La leçon l'énonce explicitement : la structure de la borne est la même qu'au Théorème 3.2 (racine d'un terme de complexité sur n), à ceci près que log|H| a été remplacé par d log(2en/d) — un terme qui, lui, reste fini même quand |H| ne l'est pas."
		}
	];
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

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
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
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
				formula={String.raw`|\mathcal H|`}
			/> — inutilisable dès que <KatexInline formula={String.raw`|\mathcal H|`} /> est infinie, ce
			qui est le cas de la quasi-totalité des classes utilisées en pratique : hyperplans de
			<KatexInline
				formula={String.raw`\mathbb R^d`}
			/>, réseaux de neurones, ou plus généralement toute classe paramétrée par des réels. Il faut
			une notion de complexité qui ne mesure pas le <em>cardinal</em> de <KatexInline
				formula={String.raw`\mathcal H`}
			/> mais sa capacité à <strong>discriminer des points</strong> — c'est l'objet de la dimension de
			Vapnik-Chervonenkis.
		</p>

		<h2 id="brisure-dimension-vc">Brisure et dimension VC</h2>

		<DefinitionBlock title="Brisure">
			<p>
				On dit que <KatexInline formula={String.raw`\mathcal H`} /> <strong>brise</strong> un
				ensemble fini <KatexInline formula={String.raw`C = \{x_1,\dots,x_m\}`} /> si tout
				étiquetage est réalisable :
			</p>
			<KatexBlock formula={shatteringDef} />
			<p>Autrement dit, <KatexInline formula={String.raw`\mathcal H`} /> réalise toutes les
			dichotomies :</p>
			<KatexBlock formula={shatteringCount} />
		</DefinitionBlock>

		<DefinitionBlock title="Dimension de Vapnik-Chervonenkis">
			<KatexBlock formula={vcdimDef} />
			<p>
				Si <KatexInline formula={String.raw`\mathcal H`} /> brise des ensembles de taille
				arbitraire, on pose <KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H) = +\infty`} />.
			</p>
		</DefinitionBlock>

		<ExampleBlock title="Trois exemples de dimension VC croissante">
			<p>
				<strong>Seuils sur <KatexInline formula={String.raw`\mathbb R`} /></strong> (<KatexInline
					formula={thresholdsFamily}
				/>) : tout singleton est brisé, mais aucune paire ordonnée <KatexInline
					formula={String.raw`\{x_1, x_2\}`}
				/> ne l'est (l'étiquetage <KatexInline formula={String.raw`(1, 0)`} /> est impossible).
				<KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H) = 1`} />.
			</p>
			<p>
				<strong>Intervalles sur <KatexInline formula={String.raw`\mathbb R`} /></strong> (<KatexInline
					formula={intervalsFamily}
				/>) : toute paire est brisée, mais aucun triplet ordonné ne l'est (l'étiquetage
				<KatexInline formula={String.raw`(1, 0, 1)`} /> est impossible). <KatexInline
					formula={String.raw`\mathrm{VCdim}(\mathcal H) = 2`} />.
			</p>
			<p>
				<strong>Hyperplans de <KatexInline formula={String.raw`\mathbb R^d`} /></strong> (<KatexInline
					formula={hyperplanesFamily}
				/>) : <KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H) = d+1`} />.
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
				C'est le nombre maximal de dichotomies que <KatexInline
					formula={String.raw`\mathcal H`} /> peut réaliser sur
				<KatexInline formula={String.raw`m`} /> points quelconques.
			</p>
		</DefinitionBlock>

		<TheoremBlock title="Lemme de Sauer-Shelah (1972)">
			<p>
				Si <KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H) = d < +\infty`} />, alors
				pour tout <KatexInline formula={String.raw`m \in \mathbb N`} /> :
			</p>
			<KatexBlock formula={sauerShelahStatement} />
			<p>En particulier, pour <KatexInline formula={String.raw`m \ge d`} /> :</p>
			<KatexBlock formula={sauerShelahEnvelope} />
		</TheoremBlock>

		<Callout type="insight" title="Le point essentiel">
			Le coefficient de brisure est <strong>polynomial</strong> en <KatexInline
				formula={String.raw`m`}
			/>
			(de degré <KatexInline formula={String.raw`d`} />) dès que la dimension VC est finie — contre
			<KatexInline formula={String.raw`2^m`} /> dans le cas général. C'est ce basculement, de la
			croissance exponentielle à la croissance polynomiale exactement au rang <KatexInline
				formula={String.raw`d`}
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
				formula={String.raw`\mathcal H`}
			/>, en remplaçant <KatexInline formula={String.raw`\log|\mathcal H|`} /> par un terme faisant
			intervenir <KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H)`} /> — c'est le rôle joué
			par le lemme de Sauer-Shelah dans la démonstration (omise ici, elle raffine l'argument d'union
			bound de la leçon précédente en l'appliquant non plus à
			<KatexInline formula={String.raw`\mathcal H`} /> tout entier mais aux dichotomies effectivement
			réalisables sur l'échantillon).
		</p>

		<TheoremBlock number="3.3" title="Borne VC">
			<p>
				Soit <KatexInline formula={String.raw`\mathcal H`} /> de dimension VC finie <KatexInline
					formula={String.raw`d`}
				/>. Pour tout <KatexInline formula={String.raw`\delta \in (0,1)`} />, avec probabilité
				<KatexInline formula={String.raw`1-\delta`} /> :
			</p>
			<KatexBlock formula={vcBoundStatement} />
		</TheoremBlock>

		<p>
			La structure est la même qu'au Théorème 3.2 (racine d'un terme de complexité sur
			<KatexInline formula={String.raw`n`} />), à ceci près que
			<KatexInline formula={String.raw`\log|\mathcal H|`} /> a été remplacé par
			<KatexInline formula={String.raw`d\log(2en/d)`} /> — un terme qui, lui, reste fini même quand
			<KatexInline formula={String.raw`|\mathcal H|`} /> ne l'est pas.
		</p>

		<h2 id="application-svm">Application : borne VC pour le SVM</h2>

		<p>
			Le SVM (Support Vector Machine) cherche l'hyperplan de marge maximale. La théorie VC en donne
			une borne de généralisation particulièrement élégante, car la dimension VC dépend de la marge
			— pas de la dimension ambiante <KatexInline formula={String.raw`d`} /> de l'espace d'entrée.
		</p>

		<DefinitionBlock title="Classifieur à marge">
			<p>
				Soit <KatexInline formula={String.raw`\mathcal X = \mathbb R^d`} />. Le classifieur
				<KatexInline
					formula={marginClassifierDef}
				/> classe l'échantillon avec marge <KatexInline formula={String.raw`\gamma > 0`} /> si :
			</p>
			<KatexBlock formula={marginCondition} />
			<p>
				On note <KatexInline formula={String.raw`\mathcal H_\gamma`} /> la classe des classifieurs
				linéaires de norme <KatexInline formula={String.raw`\|w\|_2 = 1`} /> qui séparent les
				données avec marge <KatexInline formula={String.raw`\gamma`} /> :
			</p>
			<KatexBlock formula={marginFamily} />
		</DefinitionBlock>

		<TheoremBlock number="3.4" title="Borne VC pour le SVM (Vapnik, 1995)">
			<p>
				Supposons <KatexInline formula={svmVCDimBound} />. En appliquant le Théorème 3.3, pour tout
				<KatexInline formula={String.raw`\delta \in (0,1)`} />, avec probabilité <KatexInline
					formula={String.raw`1-\delta`} /> :
			</p>
			<KatexBlock formula={svmFullBound} />
		</TheoremBlock>

		<Callout type="insight" title="Ce que cette borne dit vraiment">
			La dimension VC de <KatexInline formula={String.raw`\mathcal H_\gamma`} /> ne dépend
			<strong>pas</strong> de <KatexInline formula={String.raw`d`} />, la dimension de l'espace
			d'entrée — seulement du rapport <KatexInline formula={String.raw`R^2/\gamma^2`} /> entre le
			rayon des données et la marge obtenue. Un SVM peut ainsi généraliser correctement même en très
			grande dimension, à condition d'obtenir une marge suffisamment grande relative à l'échelle des
			données. L'extension évoquée — dimension infinie via le kernel trick (SVM à noyau) — ne fait pas
			partie du support du cours : elle est donnée ici comme complément, au-delà du cours. C'est tout
			l'intérêt de maximiser la marge plutôt que de se contenter d'une séparation quelconque.
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
			pas par son cardinal — elle reste finie pour des classes infinies comme les hyperplans
			(<KatexInline formula={String.raw`\mathrm{VCdim} = d+1`} />). Le lemme de Sauer-Shelah
			transforme cette borne combinatoire en une borne polynomiale sur le nombre de dichotomies
			réalisables, ce qui permet d'étendre le théorème de généralisation à
			<KatexInline formula={String.raw`\mathcal H`} />. Appliquée aux classifieurs à marge, cette
			théorie explique pourquoi le SVM généralise bien
			indépendamment de la dimension ambiante — un résultat qui ne tiendra plus, comme le montrera
			la leçon suivante, face aux réseaux de neurones modernes.
		</Callout>

		<InteractiveSection
			number="3.4"
			title="Quiz — Dimension VC, Sauer-Shelah et SVM"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Vapnik, V. N.']}
			year={1998}
			title="Statistical Learning Theory"
			journal="Wiley."
			link="https://www.wiley.com/en-us/Statistical+Learning+Theory-p-9780471152125"
		/>
		<BibElement
			authors={['Shalev-Shwartz, S.', 'Ben-David, S.']}
			year={2014}
			title="Understanding Machine Learning: From Theory to Algorithms"
			journal="Cambridge University Press."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>
		<BibElement
			authors={['Vapnik, V. N.']}
			year={1995}
			title="The Nature of Statistical Learning Theory"
			journal="Springer-Verlag."
		/>
		<BibElement
			authors={['Sauer, N.']}
			year={1972}
			title="On the density of families of sets"
			journal="Journal of Combinatorial Theory, Series A, 13(1), 145-147."
		/>
		<BibElement
			authors={['Shelah, S.']}
			year={1972}
			title="A combinatorial problem; stability and order for models and theories in infinitary languages"
			journal="Pacific Journal of Mathematics, 41(1), 247-261."
		/>
	</Bibliography>
</PageTemplate>
