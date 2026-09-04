<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import ConsistencyConvergenceDemo from '$lib/components/demos/ConsistencyConvergenceDemo.svelte';
	import ApproximationEstimationDemo from '$lib/components/demos/ApproximationEstimationDemo.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import Quiz, { type QuizItem } from '$lib/components/demos/Quiz.svelte';

	const meta = getPageByPath('/part7/lesson1');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question:
				'Selon la Définition 1.2, que signifie dire que (h_n) est fortement consistant (consistant presque sûrement) ?',
			options: [
				'Que P(R(h_n) - R* > ε) → 0 pour tout ε > 0.',
				'Que E[(R(h_n) - R*)²] → 0.',
				'Que P(lim R(h_n) = R*) = 1 : avec probabilité 1, la trajectoire des risques converge vers le risque de Bayes.',
				'Que R(h_n) = R* pour tout n supérieur à un certain n_0.'
			],
			answerIndex: 2,
			explanation:
				"La Définition 1.2 distingue trois notions : en probabilité (les grands écarts deviennent rares), en moyenne quadratique (l'amplitude des écarts est contrôlée) et presque sûrement — une affirmation sur une seule trajectoire infinie qui, avec probabilité 1, finit par entrer dans tout voisinage de R* et n'en ressort plus jamais."
		},
		{
			question:
				'Quelle implication entre les trois notions de consistance est garantie par la leçon ?',
			options: [
				'La consistance en probabilité implique la consistance en moyenne quadratique.',
				'La consistance presque sûre implique la consistance en probabilité.',
				'La consistance en probabilité implique la consistance presque sûre.',
				'La consistance en moyenne quadratique implique la consistance presque sûre.'
			],
			answerIndex: 1,
			explanation:
				"La leçon établit que la consistance presque sûre et la consistance en moyenne quadratique impliquent toutes deux la consistance en probabilité : celle-ci est la notion la plus faible des trois, et n'implique en général ni l'une ni l'autre ; presque sûre et moyenne quadratique ne se comparent pas directement entre elles."
		},
		{
			question:
				'Un algorithme peut très bien mémoriser ses données sans jamais généraliser. Pourquoi, dans le langage de la décomposition approximation / estimation ?',
			options: [
				"Parce que si le terme d'approximation — propriété structurelle de la classe H, indépendante des données — ne tend pas vers zéro, la somme des deux termes ne peut tendre vers zéro, quel que soit n.",
				'Parce que R(h_n) est toujours une fonction croissante de n.',
				"Parce que le risque de Bayes R* est toujours strictement positif, si bien que l'écart ne peut s'annuler.",
				"Parce que le terme d'estimation est toujours minoré par 1/n, quelle que soit la classe H."
			],
			answerIndex: 0,
			explanation:
				"La décomposition R(h_n) - R* = terme d'estimation + terme d'approximation montre que la consistance exige que la somme des deux termes tende vers 0 : une classe trop pauvre a un terme d'approximation qui ne bougera jamais, quel que soit n, et aucun volume de données ne le supprimera."
		},
		{
			question:
				"Dans la décomposition R(h_n) - R* = terme d'estimation + terme d'approximation, que mesure le terme d'approximation ?",
			options: [
				"L'écart entre le meilleur classifieur théorique de la classe et celui effectivement appris sur l'échantillon ; il s'annule quand n → ∞.",
				'La variance de R(h_n) autour de son espérance.',
				"La même quantité que le terme d'estimation, calculée sur un ensemble de validation.",
				'inf_{h∈H} R(h) - R* : il vaut 0 si h* ∈ H, ne dépend pas des données et mesure la capacité de la classe à approcher le classifieur de Bayes.'
			],
			answerIndex: 3,
			explanation:
				"La leçon définit le terme d'approximation (ou biais) comme inf_{h∈H} R(h) - R* : il vaut 0 si h* ∈ H et est une propriété purement structurelle du choix de H, indépendante des données ; c'est le terme d'estimation qui tend vers 0 quand n → ∞, sous des conditions de régularité sur H."
		},
		{
			question:
				"Une suite de classifieurs telle que P(R(h_n) - R* > ε) → 0 pour tout ε > 0, mais dont la trajectoire continue à s'écarter occasionnellement de R* à chaque rang, sans jamais se stabiliser : que peut-on en dire ?",
			options: [
				'Elle est consistante presque sûrement.',
				"Elle est consistante en moyenne quadratique, puisque l'amplitude des écarts est bornée.",
				"Elle est consistante en probabilité mais pas presque sûrement : la réciproque de l'implication « presque sûre ⇒ en probabilité » est fausse.",
				'Cette situation ne peut pas se produire pour une suite de risques.'
			],
			answerIndex: 2,
			explanation:
				"La leçon le souligne dans le cartouche d'insight : la probabilité d'excès peut tendre vers 0 tout en continuant, avec probabilité non nulle à chaque rang, à s'écarter occasionnellement — sans jamais se stabiliser complètement, d'où la fausseté de la réciproque."
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
			description: "Du classifieur de Bayes à l'algorithme appris sur données finies",
			color: 'epistemic'
		},
		{
			id: 'definitions-consistance',
			label: 'Trois notions de consistance',
			description: 'Définition 1.2 — en probabilité, en moyenne quadratique, presque sûrement',
			color: 'belief'
		},
		{
			id: 'relations-entre-notions',
			label: 'Relations entre les notions',
			description: 'Quelles implications tiennent, et pourquoi pas toutes',
			color: 'neutral'
		},
		{
			id: 'decomposition-approximation-estimation',
			label: 'Décomposition approximation / estimation',
			description: 'Pourquoi la consistance est la question centrale de tout ce cours',
			color: 'surprise'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const hnDef = '(h_n)_{n\\ge1}';
	const sampleDef = '\\mathcal{S}_n = \\{(X_i,Y_i)\\}_{i=1}^n';
	const bayesRiskRef = 'R^* = R(h^*) = \\mathbb{E}_X[\\min(\\eta(X), 1-\\eta(X))]';

	const consistProb =
		'\\forall \\varepsilon>0,\\quad \\mathbb{P}\\big(R(h_n)-R^* > \\varepsilon\\big) \\xrightarrow[n\\to+\\infty]{} 0';
	const consistMS = '\\mathbb{E}\\big[(R(h_n)-R^*)^2\\big] \\xrightarrow[n\\to+\\infty]{} 0';
	const consistAS = '\\mathbb{P}\\Big(\\lim_{n\\to+\\infty} R(h_n) = R^*\\Big) = 1';

	const implicationAS = '\\text{consistance p.s.} \\implies \\text{consistance en probabilité}';
	const implicationMS =
		'\\text{consistance en moyenne quadratique} \\implies \\text{consistance en probabilité}';

	const bestInClass = '\\inf_{h\\in\\mathcal H} R(h)';
	const decompFull =
		"R(h_n) - R^* = \\underbrace{R(h_n) - \\inf_{h\\in\\mathcal H} R(h)}_{\\text{terme d'estimation}} \\;+\\; \\underbrace{\\inf_{h\\in\\mathcal H} R(h) - R^*}_{\\text{terme d'approximation}}";
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Consistance et convergence vers Bayes'}
	subtitle="Dans quelle mesure un algorithme appris sur un échantillon fini approche-t-il le classifieur de Bayes ?"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			La Partie VI a caractérisé le classifieur de Bayes <KatexInline formula={String.raw`h^*`} />,
			optimal sous connaissance <em>parfaite</em> de <KatexInline formula={String.raw`P_{X,Y}`} />,
			et son risque irréductible <KatexInline formula={bayesRiskRef} />. En pratique, on ne connaît
			jamais
			<KatexInline formula={String.raw`P_{X,Y}`} /> : on dispose seulement d'un échantillon fini
			<KatexInline formula={sampleDef} /> i.i.d., à partir duquel un algorithme produit un classifieur
			appris <KatexInline formula={String.raw`h_n`} />.
		</p>

		<p>
			La question qui gouverne tout le reste de ce cours est simple à énoncer :
			<em
				>à mesure que la taille d'échantillon <KatexInline formula={String.raw`n`} /> grandit, le risque
				de
				<KatexInline formula={String.raw`h_n`} /> se rapproche-t-il du risque de Bayes <KatexInline
					formula={String.raw`R^*`}
				/> ?</em
			>
			C'est la question de la <strong>consistance</strong>. Elle n'a rien d'automatique : un
			algorithme peut très bien mémoriser les données sans jamais généraliser, auquel cas
			<KatexInline formula={String.raw`R(h_n)`} /> ne se rapprocherait pas de <KatexInline
				formula={String.raw`R^*`}
			/>, aussi grand que soit <KatexInline formula={String.raw`n`} />.
		</p>

		<h2 id="definitions-consistance">Trois notions de consistance</h2>

		<p>
			Puisque <KatexInline formula={String.raw`h_n`} /> dépend de l'échantillon aléatoire
			<KatexInline formula={String.raw`\mathcal{S}_n`} />, le risque <KatexInline
				formula={String.raw`R(h_n)`}
			/> est lui-même une variable aléatoire. « Converger vers <KatexInline
				formula={String.raw`R^*`}
			/> » peut donc se formaliser de plusieurs façons, plus ou moins exigeantes.
		</p>

		<DefinitionBlock number="1.2" title="Consistance">
			<p>
				Soit <KatexInline formula={hnDef} /> une suite de classifieurs appris sur
				<KatexInline formula={String.raw`\mathcal{S}_n`} />. On dit que <KatexInline
					formula={String.raw`(h_n)`}
				/> est :
			</p>
			<ul>
				<li>
					<strong>consistant en probabilité</strong> si :
					<KatexBlock formula={consistProb} />
				</li>
				<li>
					<strong>consistant en moyenne quadratique</strong> si :
					<KatexBlock formula={consistMS} />
				</li>
				<li>
					<strong>fortement consistant</strong> (ou consistant presque sûrement) si :
					<KatexBlock formula={consistAS} />
				</li>
			</ul>
			<p>où <KatexInline formula={bayesRiskRef} /> est le risque de Bayes.</p>
		</DefinitionBlock>

		<Callout type="intuition" title="Trois façons de dire « converge »">
			Ces trois notions répondent à des questions légèrement différentes. La convergence en
			probabilité dit que les <em>grands</em> écarts deviennent rares. La convergence en moyenne
			quadratique contrôle en plus l'<em>amplitude</em> des écarts, pas seulement leur fréquence. La
			convergence presque sûre est une affirmation sur <em>une seule</em> trajectoire infinie de <KatexInline
				formula={String.raw`(R(h_n))_{n\ge1}`}
			/> : avec probabilité 1, cette trajectoire finit par entrer dans n'importe quel voisinage de <KatexInline
				formula={String.raw`R^*`}
			/> et n'en ressort plus jamais.
		</Callout>

		<InteractiveSection
			number="1.1"
			title="Trajectoires de convergence"
			onInteract={tracker.trackInteraction}
		>
			<ConsistencyConvergenceDemo />
		</InteractiveSection>

		<h2 id="relations-entre-notions">Relations entre les notions</h2>

		<p>
			Ces trois notions ne sont pas indépendantes, mais elles ne sont pas non plus toutes
			équivalentes. On a les implications suivantes :
		</p>
		<KatexBlock formula={implicationAS} />
		<KatexBlock formula={implicationMS} />

		<p>
			Autrement dit, la consistance en probabilité est la notion la <strong>plus faible</strong> des trois
			: elle est impliquée par chacune des deux autres, mais n'implique ni l'une ni l'autre en général.
			La consistance presque sûre et la consistance en moyenne quadratique, elles, ne se comparent pas
			directement entre elles — chacune contrôle un aspect différent de la convergence (trajectoire unique
			contre amplitude moyenne des écarts), et l'une peut tenir sans l'autre.
		</p>

		<Callout type="insight" title="Pourquoi cette hiérarchie n'est pas qu'un détail technique">
			Dans la démonstration ci-dessus (Exercice-type), la convergence presque sûre implique la
			convergence en probabilité par un argument de type Portmanteau : si presque toute trajectoire
			finit par rester dans <KatexInline formula={String.raw`[R^*-\varepsilon, R^*+\varepsilon]`} />
			pour de bon, alors la <em>probabilité</em> de s'en écarter au rang <KatexInline
				formula={String.raw`n`}
			/> tend nécessairement vers 0. La réciproque est fausse : une suite peut avoir une probabilité d'excès
			qui tend vers 0 tout en continuant, avec probabilité non nulle à chaque rang, à s'écarter occasionnellement
			— sans jamais se stabiliser complètement.
		</Callout>

		<h2 id="decomposition-approximation-estimation">Décomposition approximation / estimation</h2>

		<p>
			Pourquoi la consistance est-elle la question centrale de toute la théorie de l'apprentissage ?
			Parce que le risque d'un classifieur appris dans une classe
			<KatexInline formula={String.raw`\mathcal{H}`} /> se décompose naturellement en deux termes de nature
			très différente :
		</p>
		<KatexBlock formula={decompFull} />

		<ul>
			<li>
				Le <strong>terme d'approximation</strong> (ou biais) mesure la capacité de la classe
				<KatexInline formula={String.raw`\mathcal{H}`} /> à approcher le classifieur de Bayes. Il vaut
				<KatexInline formula={String.raw`0`} /> si <KatexInline
					formula={String.raw`h^* \in \mathcal{H}`}
				/>, et ne dépend <strong>pas</strong> des données — c'est une propriété purement
				structurelle du choix de <KatexInline formula={String.raw`\mathcal{H}`} />.
			</li>
			<li>
				Le <strong>terme d'estimation</strong> mesure l'écart entre le meilleur classifieur
				théorique de la classe, <KatexInline formula={bestInClass} />, et celui effectivement appris
				sur <KatexInline formula={String.raw`\mathcal{S}_n`} />. Il tend vers <KatexInline
					formula={String.raw`0`}
				/> quand <KatexInline formula={String.raw`n \to +\infty`} /> sous des conditions de régularité
				sur
				<KatexInline formula={String.raw`\mathcal{H}`} /> — c'est précisément ce que les leçons suivantes
				(généralisation, VC) vont quantifier.
			</li>
		</ul>

		<p>
			La consistance de <KatexInline formula={String.raw`(h_n)`} /> exige que la
			<strong>somme</strong>
			de ces deux termes tende vers 0 — ce qui n'arrive que si le terme d'approximation est nul ou négligeable,
			<em>et</em>
			si le terme d'estimation s'annule effectivement avec <KatexInline formula={String.raw`n`} />.
			Une classe trop pauvre a un terme d'approximation qui ne bougera jamais, quel que soit
			<KatexInline formula={String.raw`n`} /> ; une classe trop riche a un terme d'estimation qui décroît
			trop lentement pour un <KatexInline formula={String.raw`n`} /> donné.
		</p>

		<InteractiveSection
			number="1.2"
			title="Le compromis approximation / estimation"
			onInteract={tracker.trackInteraction}
		>
			<ApproximationEstimationDemo />
		</InteractiveSection>

		<Callout type="summary" title="Retenir">
			La consistance n'est pas une propriété binaire : elle se décline en trois notions de force
			croissante, et sa validité dépend d'un compromis entre la richesse de la classe
			<KatexInline formula={String.raw`\mathcal{H}`} /> (qui contrôle le terme d'approximation) et la
			quantité de données disponibles (qui contrôle la vitesse à laquelle le terme d'estimation s'annule).
			La leçon suivante introduit une notion plus exigeante encore — la
			<strong>consistance universelle</strong> — et montre que l'algorithme des k plus proches
			voisins l'atteint sous des conditions remarquablement simples sur <KatexInline
				formula={String.raw`k(n)`}
			/>.
		</Callout>

		<InteractiveSection
			number="1.3"
			title="Quiz — Consistance"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>
	<Bibliography>
		<BibElement
			authors={['Devroye, L.', 'Györfi, L.', 'Lugosi, G.']}
			year={1996}
			title="A Probabilistic Theory of Pattern Recognition"
			journal="Springer-Verlag."
			link="https://doi.org/10.1007/978-1-4612-0711-5"
		/>
		<BibElement
			authors={['Vapnik, V. N.']}
			year={1998}
			title="Statistical Learning Theory"
			journal="Wiley."
			link="https://www.wiley.com/en-us/Statistical+Learning+Theory-p-9780471152125"
		/>
	</Bibliography>
</PageTemplate>
