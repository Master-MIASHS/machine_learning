<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import BayesDecisionExplorer from '$lib/components/demos/BayesDecisionExplorer.svelte';
	import BayesRiskNoiseDemo from '$lib/components/demos/BayesRiskNoiseDemo.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';

	const meta = getPageByPath('/part4/lesson1');
	const tracker = createPageTracker(meta as PageMeta);
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
			description: 'Risque théorique et le problème de la décision optimale',
			color: 'epistemic'
		},
		{
			id: 'risque-conditionnel',
			label: 'Risque conditionnel',
			description:
				'Décomposer le risque par conditionnement sur X, la probabilité a posteriori η(x)',
			color: 'neutral'
		},
		{
			id: 'classifieur-bayes',
			label: 'Le classifieur de Bayes',
			description: 'Théorème 1.1 — la règle de décision optimale et sa démonstration',
			color: 'belief'
		},
		{
			id: 'risque-bayes',
			label: 'Risque de Bayes et séparabilité',
			description: 'R* = E[min(η, 1−η)] — quand le problème est-il séparable ?',
			color: 'surprise'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const calX = '\\mathcal{X}';
	const calYDef = '\\mathcal{Y} = \\{0,1\\}';
	const hMapping = 'h : \\mathcal{X} \\to \\mathcal{Y}';
	const riskTheorique = 'L(h) = \\mathbb{E}[\\ell(h(X), Y)]';
	const zeroOneLoss = '\\ell(y,\\hat y) = \\mathbb{1}_{y \\neq \\hat y}';
	const riskZeroOne = 'R(h) = \\mathbb{E}[\\mathbb{1}_{h(X) \\neq Y}] = \\mathbb{P}(h(X) \\neq Y)';

	const etaDef = '\\eta(x) = \\mathbb{P}(Y=1 \\mid X=x)';

	const conditionalRiskDef = 'r(\\hat y, x) = \\mathbb{P}(\\hat y \\neq Y \\mid X = x)';
	const riskDecompose =
		'R(h) = \\mathbb{E}_X\\big[\\mathbb{E}[\\mathbb{1}_{h(X)\\neq Y} \\mid X]\\big] = \\mathbb{E}_X[r(h(X), X)]';
	const decomposeJustification =
		'R(h) = \\mathbb{E}_X[r(h(X), X)],\\quad r(\\cdot, x) \\ge 0\\ \\forall x';

	const bayesClassifierCases =
		'h^*(x) = \\begin{cases} 1 & \\text{si } \\eta(x) \\ge 1/2 \\\\ 0 & \\text{sinon} \\end{cases}';

	const r1x = 'r(1,x) = \\mathbb{P}(Y \\neq 1 \\mid X=x) = 1-\\eta(x)';
	const r0x = 'r(0,x) = \\mathbb{P}(Y \\neq 0 \\mid X=x) = \\eta(x)';
	const argminAction = 'h^*(x) = \\arg\\min_{a \\in \\{0,1\\}} r(a,x)';
	const thresholdCondition = 'r(1,x) \\le r(0,x)';
	const thresholdDerivation =
		'1-\\eta(x) \\le \\eta(x) \\iff 1 \\le 2\\eta(x) \\iff \\eta(x) \\ge \\tfrac{1}{2}';

	const globalGapDef = 'R(h) - R(h^*) = \\mathbb{E}_X\\big[r(h(X),X) - r(h^*(X),X)\\big]';
	const pointwiseOptimality =
		'r(h^*(x), x) \\le r(a,x),\\quad \\forall a \\in \\{0,1\\},\\ \\forall x';
	const nonNegativeGap = 'r(h(x), x) - r(h^*(x), x) \\ge 0 \\quad \\forall x';
	const globalOptimality =
		'R(h) - R(h^*) = \\mathbb{E}_X[\\underbrace{r(h(X),X) - r(h^*(X),X)}_{\\ge 0}] \\ge 0';

	const bayesRiskDef = 'R^* = R(h^*) = \\mathbb{E}_X[\\min(\\eta(X), 1-\\eta(X))]';
	const separableCondition = 'R^* = 0 \\iff \\eta(x) \\in \\{0,1\\} \\ \\text{p.s.}';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Décision bayésienne et classifieur optimal'}
	subtitle="Le prédicteur de Bayes : la décision optimale sous connaissance parfaite de la distribution"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			On se place dans le cadre de l'apprentissage supervisé binaire : un espace d'entrée <KatexInline
				formula={calX}
			/> (typiquement <KatexInline formula={String.raw`\mathbb{R}^d`} />) et un espace de sortie <KatexInline
				formula={calYDef}
			/>. Les couples <KatexInline formula={String.raw`(X,Y)`} /> sont tirés i.i.d. selon une distribution
			inconnue <KatexInline formula={String.raw`P_{X,Y}`} />, et on cherche un classifieur <KatexInline
				formula={hMapping}
			/> qui minimise le <strong>risque théorique</strong> :
		</p>
		<KatexBlock formula={riskTheorique} />
		<p>
			Pour la perte 0-1 (<KatexInline formula={zeroOneLoss} />), ce risque se réduit simplement à la
			probabilité d'erreur :
		</p>
		<KatexBlock formula={riskZeroOne} />
		<p>
			Une question précède toute considération d'algorithme ou d'échantillon fini : <em
				>si l'on connaissait <KatexInline formula={String.raw`P_{X,Y}`} /> parfaitement, quelle serait
				la meilleure décision possible ?</em
			>
			C'est la question du <strong>prédicteur de Bayes</strong>, qui sert de référence absolue à
			laquelle tout algorithme d'apprentissage sera comparé dans les leçons suivantes.
		</p>

		<h2 id="risque-conditionnel">Risque conditionnel</h2>

		<p>
			La clé pour trouver le classifieur optimal est de <strong
				>conditionner sur la position <KatexInline formula="X" /></strong
			>
			plutôt que de raisonner globalement. On introduit d'abord la quantité qui résume toute l'information
			utile sur <KatexInline formula="Y" /> en un point <KatexInline formula="x" /> :
		</p>

		<DefinitionBlock title="Probabilité a posteriori">
			<p>Pour <KatexInline formula={String.raw`x \in \mathcal{X}`} />, on note :</p>
			<KatexBlock formula={etaDef} />
			<p>
				la probabilité que <KatexInline formula="Y=1" /> sachant que <KatexInline formula="X=x" />.
				C'est toute l'information dont on a besoin sur <KatexInline formula="Y" />, puisque <KatexInline
					formula="Y \mid X=x"
				/> suit une loi de Bernoulli de paramètre <KatexInline formula="\eta(x)" />.
			</p>
		</DefinitionBlock>

		<p>Par la loi des espérances totales, le risque se décompose comme :</p>
		<KatexBlock formula={riskDecompose} />

		<DefinitionBlock title="Risque conditionnel">
			<p>
				Pour une décision <KatexInline formula={String.raw`\hat y \in \{0,1\}`} /> et un point <KatexInline
					formula="x"
				/>, on définit le risque conditionnel :
			</p>
			<KatexBlock formula={conditionalRiskDef} />
		</DefinitionBlock>

		<p>
			Puisque <KatexInline formula={decomposeJustification} />, minimiser <KatexInline
				formula="R(h)"
			/> revient à minimiser <KatexInline formula="r(h(x), x)" />
			<strong>pour presque tout <KatexInline formula="x" /></strong> — on peut donc raisonner point par
			point plutôt que globalement. C'est cette réduction qui rend le problème traitable.
		</p>

		<h2 id="classifieur-bayes">Le classifieur de Bayes</h2>

		<TheoremBlock number="1.1" title="Classifieur de Bayes">
			<p>
				Pour la perte 0-1, le classifieur optimal en <KatexInline formula="x" /> est donné par :
			</p>
			<KatexBlock formula={bayesClassifierCases} />
			<p>
				où <KatexInline formula="\eta(x)" /> est la probabilité a posteriori définie ci-dessus.
			</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				<strong>Étape 1 — Calcul explicite du risque conditionnel.</strong> Pour <KatexInline
					formula="x"
				/> fixé, <KatexInline formula="Y \mid X=x" /> est de Bernoulli de paramètre <KatexInline
					formula="\eta(x)"
				/>. On calcule <KatexInline formula="r(a,x)" /> pour chaque décision <KatexInline
					formula={String.raw`"a \in \{0,1\}`}
				/> :
			</p>
			<KatexBlock formula={r1x} />
			<KatexBlock formula={r0x} />
			<p>
				<strong>Étape 2 — Minimisation ponctuelle.</strong> La décision optimale en <KatexInline
					formula="x"
				/> est <KatexInline formula={argminAction} />. On choisit <KatexInline formula="a=1" /> si et
				seulement si <KatexInline formula={thresholdCondition} />, c'est-à-dire :
			</p>
			<KatexBlock formula={thresholdDerivation} />
			<p>
				d'où <KatexInline formula={bayesClassifierCases} /> — c'est exactement la règle annoncée.
			</p>
			<p>
				<strong>Étape 3 — Optimalité globale.</strong> Il reste à vérifier que <KatexInline
					formula="h^*"
				/> minimise bien <KatexInline formula="R(h)" /> parmi <em>tous</em> les classifieurs, pas
				seulement point par point. Pour <KatexInline formula="h" /> quelconque :
			</p>
			<KatexBlock formula={globalGapDef} />
			<p>
				Par construction de <KatexInline formula="h^*" /> à l'étape 2, on a <KatexInline
					formula={pointwiseOptimality}
				/>, donc :
			</p>
			<KatexBlock formula={nonNegativeGap} />
			<p>Par positivité de l'espérance, on conclut :</p>
			<KatexBlock formula={globalOptimality} />
			<p>
				Ainsi <KatexInline formula="R(h^*) \le R(h)" /> pour tout classifieur <KatexInline
					formula="h"
				/> mesurable. ∎
			</p>
		</div>

		<Callout type="insight" title="Interprétation du seuil">
			La règle <KatexInline formula="\eta(x) \ge 1/2" /> dit simplement :
			<strong>prédire la classe majoritaire</strong>
			au point <KatexInline formula="x" />. C'est l'intuition la plus naturelle possible — le
			résultat non trivial n'est pas la règle elle-même, mais le fait qu'elle soit
			<em>prouvablement optimale</em> pour la perte 0-1, et qu'aucune autre règle de décision ne puisse
			faire mieux en moyenne.
		</Callout>

		<InteractiveSection
			number="1.1"
			title="Décision bayésienne"
			onInteract={tracker.trackInteraction}
		>
			<BayesDecisionExplorer />
		</InteractiveSection>

		<h2 id="risque-bayes">Risque de Bayes et séparabilité</h2>

		<p>
			Le classifieur de Bayes <KatexInline formula="h^*" /> atteint le risque minimal possible, qu'on
			appelle le <strong>risque de Bayes</strong> :
		</p>
		<KatexBlock formula={bayesRiskDef} />

		<p>
			C'est une borne <em>irréductible</em> : aucun algorithme, aussi sophistiqué soit-il et même
			avec une infinité de données, ne peut faire mieux que <KatexInline formula="R^*" /> — c'est la part
			du risque due au chevauchement intrinsèque des deux classes, pas à un manque de données ou un mauvais
			choix de modèle.
		</p>

		<Callout type="intuition" title="Séparabilité">
			<p>On vérifie facilement que :</p>
			<KatexBlock formula={separableCondition} />
			<p>
				c'est-à-dire que le risque de Bayes est nul exactement quand le problème est
				<strong>séparable</strong> : à chaque point <KatexInline formula="x" />, une seule classe
				est possible avec certitude. Dès que <KatexInline formula="\eta(x)" /> s'éloigne de <KatexInline
					formula={String.raw`\{0,1\}`}
				/> pour se rapprocher de <KatexInline formula="1/2" />, le problème devient plus
				<strong>bruité</strong>
				— même le classifieur optimal se trompe alors avec une probabilité non nulle.
			</p>
		</Callout>

		<InteractiveSection
			number="1.2"
			title="Séparabilité et bruit"
			onInteract={tracker.trackInteraction}
		>
			<BayesRiskNoiseDemo />
		</InteractiveSection>

		<Callout type="summary" title="Retenir">
			Le classifieur de Bayes prédit la classe majoritaire au point <KatexInline formula="x" /> (<KatexInline
				formula="\eta(x) \ge 1/2"
			/>) et atteint le risque minimal <KatexInline formula="R^*" /> — une borne irréductible qui ne dépend
			que du chevauchement des classes, jamais de l'algorithme utilisé. La leçon suivante transpose cette
			même logique de décision conditionnelle au cas de la régression : la perte quadratique sélectionne
			la <strong>moyenne</strong> conditionnelle, la perte absolue la
			<strong>médiane</strong> conditionnelle.
		</Callout>
	</TheorySection>

	<ExpertPanel title="Pourquoi le conditionnement suffit">
		<p>
			Le point subtil est que l'optimalité du classifieur de Bayes ne dépend pas d'une hypothèse de
			régularité sur <KatexInline formula={String.raw`P_{(X, Y)}`} />. La décomposition
			<KatexInline formula={riskDecompose} /> est une conséquence directe de la propriété de l'espérance
			conditionnelle.
		</p>

		<p>
			Plus précisément, si <KatexInline formula="h^*" /> minimise le risque conditionnel
			<KatexInline formula="r(a,x)" /> pour <KatexInline formula="P_X" />-presque tout
			<KatexInline formula="x" />, alors l'inégalité
			<KatexInline formula={nonNegativeGap} /> vaut presque sûrement. L'espérance préserve cette inégalité,
			ce qui donne immédiatement l'optimalité globale.
		</p>

		<p>
			C'est un exemple général d'un principe important en théorie de la décision :
			<strong
				>une décision optimale conditionnellement à l'information disponible est optimale
				globalement</strong
			>, dès lors que le risque global est l'espérance du risque conditionnel.
		</p>

		<p>
			La qualification « presque tout » est essentielle : lorsque <KatexInline formula="P(X=x)=0" />
			pour un point particulier, modifier <KatexInline formula="h(x)" /> en ce point ne change pas le
			risque. Le prédicteur de Bayes n'est donc défini de manière unique que
			<em>presque sûrement</em> par rapport à <KatexInline formula="P_X" />.
		</p>
	</ExpertPanel>
	<Bibliography>
		<BibElement
			authors={['Devroye, L.', 'Györfi, L.', 'Lugosi, G.']}
			year={1996}
			title="A Probabilistic Theory of Pattern Recognition"
			journal="Springer Series in Statistics. New York: Springer."
			link="https://doi.org/10.1007/978-1-4612-0711-5"
		/>
		<BibElement
			authors={['Duda, R. O.', 'Hart, P. E.', 'Stork, D. G.']}
			year={2000}
			title="Pattern Classification (2nd ed.)"
			journal="Wiley-Interscience."
			link="https://www.wiley-vch.de/en/areas-interest/engineering/pattern-classification-978-0-471-05669-0"
		/>
		<BibElement
			authors={['James, G.', 'Witten, D.', 'Hastie, T.', 'Tibshirani, R.']}
			year={2021}
			title="An Introduction to Statistical Learning: with Applications in R (2nd ed.)"
			journal="Springer Texts in Statistics. New York: Springer."
			link="https://doi.org/10.1007/978-1-0716-1418-1"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.proof-block {
		padding: 1rem 1.5rem;
		margin: 1rem 0;
		border-left: 3px solid var(--color-positive, #4caf50);
		background-color: color-mix(in srgb, var(--color-positive, #4caf50) 5%, transparent);
		border-radius: 0 6px 6px 0;
		font-size: 0.95em;
		line-height: 1.7;
	}

	.proof-block p {
		margin: 0.4rem 0;
	}
</style>
