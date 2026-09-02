<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import ConditionalRegressionExplorer from '$lib/components/demos/ConditionalRegressionExplorer.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';

	const meta = getPageByPath('/part6/lesson2');
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
			description: 'De la classification à la régression : deux pertes, deux prédicteurs optimaux',
			color: 'epistemic'
		},
		{
			id: 'perte-l2',
			label: 'Perte quadratique',
			description: 'La moyenne conditionnelle, et sa lecture biais-variance',
			color: 'belief'
		},
		{
			id: 'perte-l1',
			label: 'Perte absolue',
			description: 'La médiane conditionnelle, via la fonction de répartition',
			color: 'surprise'
		},
		{
			id: 'comparaison',
			label: 'Comparer les deux prédicteurs',
			description: 'Explorer moyenne et médiane sur une même distribution',
			color: 'neutral'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const l2Loss = '\\ell(y,\\hat y) = (y-\\hat y)^2';
	const l1Loss = '\\ell(y,\\hat y) = |y-\\hat y|';
	//const regressionThmCases =
	//('h^*(x) = \\mathbb{E}[Y \\mid X=x] \\quad (L_2) \\qquad\\qquad h^*(x) = \\text{Med}(Y \\mid X=x) \\quad (L_1)');

	// L2 proof
	const l2RiskDef = 'R(h) = \\mathbb{E}[(Y-h(X))^2]';
	const l2Decompose = 'R(h) = \\mathbb{E}_X\\big[\\mathbb{E}[(Y-h(X))^2 \\mid X]\\big]';
	const mDef = 'm(x) = \\mathbb{E}[Y \\mid X=x]';
	const biasVarianceSplit =
		'\\mathbb{E}[(Y-c)^2 \\mid X=x] = \\underbrace{\\mathbb{E}[(Y-m(x))^2 \\mid X=x]}_{\\text{ne dépend pas de } c} + \\underbrace{(m(x)-c)^2}_{\\ge 0}';
	const crossTermZero = '\\mathbb{E}[Y - m(x) \\mid X=x] = \\mathbb{E}[Y\\mid X=x] - m(x) = 0';
	const l2Minimizer =
		'h^*(x) = \\arg\\min_{c \\in \\mathbb{R}} \\mathbb{E}[(Y-c)^2 \\mid X=x] = m(x)';
	const l2GlobalGap = 'R(h) - R(h^*) = \\mathbb{E}_X\\big[(m(X)-h(X))^2\\big] \\ge 0';

	// L1 proof
	const l1RiskDef = 'R(h) = \\mathbb{E}[\\,|Y-h(X)|\\,]';
	const gDef = 'g(c) = \\mathbb{E}[\\,|Y-c| \\mid X=x\\,]';
	const gIntegral =
		'g(c) = \\int_{-\\infty}^{c} (c-y) f_{Y\\mid x}(y)\\,dy + \\int_{c}^{+\\infty} (y-c) f_{Y\\mid x}(y)\\,dy';
	const gDerivative =
		"g'(c) = F_{Y\\mid x}(c) - \\big(1 - F_{Y\\mid x}(c)\\big) = 2F_{Y\\mid x}(c) - 1";
	const gCriticalPoint =
		"g'(c) = 0 \\iff F_{Y\\mid x}(c) = \\tfrac{1}{2} \\iff c = \\text{Med}(Y\\mid X=x)";
	const gConvexity = "g''(c) = 2f_{Y\\mid x}(c) \\ge 0";
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Régression : moyenne et médiane conditionnelles'}
	subtitle="La même logique de décision conditionnelle, appliquée à des sorties réelles"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			La leçon précédente a montré que le classifieur optimal se déduit d'une minimisation
			<strong>ponctuelle</strong> du risque conditionnel : conditionner sur <KatexInline
				formula={String.raw`X=x`}
			/> réduit un problème global à une suite de petits problèmes locaux, résolus indépendamment en chaque
			point. Cette même démarche s'applique telle quelle à la régression, où <KatexInline
				formula={String.raw`Y \in \mathbb{R}`}
			/> plutôt que <KatexInline formula={String.raw`Y \in \{0,1\}`} />. Deux choix de perte usuels
			donnent deux prédicteurs optimaux différents — et cette différence n'est pas anecdotique, elle
			a des conséquences directes sur la robustesse du prédicteur aux valeurs extrêmes.
		</p>

		<TheoremBlock number="1.2" title="Prédicteurs optimaux en régression">
			<ol>
				<li>
					<strong>Erreur quadratique (<KatexInline formula={String.raw`L_2`} />)</strong> : <KatexInline
						formula={l2Loss}
					/>. Le prédicteur optimal est la <strong>moyenne conditionnelle</strong> :
					<KatexBlock formula={String.raw`h^*(x) = \mathbb{E}[Y \mid X=x]`} />
				</li>
				<li>
					<strong>Erreur absolue (<KatexInline formula={String.raw`L_1`} />)</strong> : <KatexInline
						formula={l1Loss}
					/>. Le prédicteur optimal est la <strong>médiane conditionnelle</strong> de <KatexInline
						formula={String.raw`Y`}
					/> sachant <KatexInline formula={String.raw`X=x`} />.
				</li>
			</ol>
		</TheoremBlock>

		<h2 id="perte-l2">Perte quadratique : la moyenne conditionnelle</h2>

		<p>
			Soit <KatexInline formula={String.raw`h : \mathcal{X} \to \mathbb{R}`} /> un prédicteur mesurable,
			on cherche à minimiser <KatexInline formula={l2RiskDef} />. Comme en classification, on
			conditionne :
		</p>
		<KatexBlock formula={l2Decompose} />
		<p>
			et on pose <KatexInline formula={mDef} />, pour raisonner à <KatexInline
				formula={String.raw`x`}
			/> fixé.
		</p>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				<strong>Décomposition biais-variance conditionnelle.</strong> Pour toute constante <KatexInline
					formula={String.raw`c \in \mathbb{R}`}
				/>, on écrit <KatexInline formula={String.raw`Y - c = (Y - m(x)) + (m(x) - c)`} /> et on développe
				le carré. Le terme croisé s'annule car <KatexInline formula={crossTermZero} />, ce qui
				laisse :
			</p>
			<KatexBlock formula={biasVarianceSplit} />
			<p>
				Le premier terme ne dépend pas de <KatexInline formula={String.raw`c`} /> — c'est la part
				<strong>irréductible</strong> du risque, la variance résiduelle de <KatexInline
					formula={String.raw`Y`}
				/> autour de sa moyenne conditionnelle. Le second terme, <KatexInline
					formula={String.raw`(m(x)-c)^2 \ge 0`}
				/>, est le seul levier disponible : il est minimal (et nul) uniquement pour <KatexInline
					formula={String.raw`c = m(x)`}
				/>. D'où :
			</p>
			<KatexBlock formula={l2Minimizer} />
			<p>
				<strong>Optimalité globale.</strong> En reprenant la décomposition avec <KatexInline
					formula={String.raw`c = h(x)`}
				/> puis en prenant l'espérance sur <KatexInline formula={String.raw`X`} />, on obtient :
			</p>
			<KatexBlock formula={l2GlobalGap} />
			<p>
				avec égalité si et seulement si <KatexInline formula={String.raw`h(x) = m(x)`} /> pour presque
				tout <KatexInline formula={String.raw`x`} />. ∎
			</p>
		</div>

		<Callout type="intuition" title="Biais-variance, version conditionnelle">
			Cette décomposition est une miniature, <em
				>en un seul point <KatexInline formula={String.raw`x`} /></em
			>, de la décomposition biais-variance que vous retrouverez plus tard à l'échelle globale d'un
			algorithme d'apprentissage. Ici, le « biais » est l'écart entre la prédiction candidate <KatexInline
				formula={String.raw`c`}
			/> et la vraie moyenne conditionnelle <KatexInline formula={String.raw`m(x)`} />, et la «
			variance » est le bruit résiduel de <KatexInline formula={String.raw`Y`} /> autour de cette moyenne
			— un bruit qu'aucun prédicteur, aussi bon soit-il, ne peut éliminer.
		</Callout>

		<h2 id="perte-l1">Perte absolue : la médiane conditionnelle</h2>

		<p>
			Pour <KatexInline formula={l1RiskDef} />, le même argument de conditionnement ramène le
			problème à minimiser, pour presque tout <KatexInline formula={String.raw`x`} /> :
		</p>
		<KatexBlock formula={gDef} />

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				En supposant que <KatexInline formula={String.raw`Y \mid X=x`} /> admet une densité conditionnelle
				<KatexInline formula={String.raw`f_{Y\mid x}`} />, on sépare l'intégrale en deux selon le
				signe de <KatexInline formula={String.raw`y-c`} /> :
			</p>
			<KatexBlock formula={gIntegral} />
			<p>
				On dérive sous le signe intégrale (théorème de Leibniz) : le premier terme contribue <KatexInline
					formula={String.raw`F_{Y\mid x}(c)`}
				/>, le second <KatexInline formula={String.raw`-(1-F_{Y\mid x}(c))`} />, d'où :
			</p>
			<KatexBlock formula={gDerivative} />
			<p>La condition d'optimalité <KatexInline formula={String.raw`g'(c)=0`} /> donne alors :</p>
			<KatexBlock formula={gCriticalPoint} />
			<p>
				c'est-à-dire la médiane conditionnelle. On vérifie qu'il s'agit bien d'un minimum global : <KatexInline
					formula={gConvexity}
				/>, donc <KatexInline formula={String.raw`g`} /> est convexe. ∎
			</p>
		</div>

		<Callout type="warning" title="La médiane n'est pas toujours unique">
			Quand <KatexInline formula={String.raw`Y \mid X=x`} /> a une distribution discrète (comme dans le
			widget ci-dessous), il peut exister tout un intervalle de valeurs <KatexInline
				formula={String.raw`c`}
			/> vérifiant
			<KatexInline formula={String.raw`F_{Y\mid x}(c) = 1/2`} /> exactement — la médiane n'est alors définie
			qu'à un choix de convention près (par exemple, la plus petite valeur atteignant le seuil). Cela
			ne remet pas en cause l'optimalité : toutes ces valeurs atteignent le même risque <KatexInline
				formula={String.raw`L_1`}
			/> minimal.
		</Callout>

		<h2 id="comparaison">Comparer les deux prédicteurs</h2>

		<p>
			La différence entre moyenne et médiane conditionnelles n'est pas qu'un détail technique : la
			moyenne est <strong>sensible aux valeurs extrêmes</strong> (une seule observation très
			éloignée peut la déplacer arbitrairement loin), alors que la médiane y est
			<strong>robuste</strong>
			— c'est le prix, et le bénéfice, du passage de <KatexInline formula={String.raw`L_2`} /> à <KatexInline
				formula={String.raw`L_1`}
			/>. Le widget ci-dessous utilise une distribution conditionnelle volontairement asymétrique,
			pour que cet écart entre les deux prédicteurs soit visible plutôt que théorique.
		</p>
		<Callout type="note" title="Note sur la médiane empirique">
			Il est important de noter que la médiane empirique (calculée sur un échantillon de données)
			est souvent non unique, notamment lorsque la taille de l'échantillon est paire.
		</Callout>

		<InteractiveSection
			number="1.1"
			title="Moyenne vs. médiane conditionnelle"
			onInteract={tracker.trackInteraction}
		>
			<ConditionalRegressionExplorer />
		</InteractiveSection>

		<Callout type="summary" title="Retenir">
			Conditionner sur <KatexInline formula={String.raw`X=x`} /> réduit, ici comme en classification,
			un problème global à une minimisation ponctuelle. Le choix de la perte détermine seul le prédicteur
			optimal : <KatexInline formula={String.raw`L_2`} /> sélectionne la moyenne conditionnelle (sensible
			aux valeurs extrêmes), <KatexInline formula={String.raw`L_1`} /> sélectionne la médiane conditionnelle
			(robuste). Cette logique — décomposer le risque par conditionnement, puis minimiser point par point
			— est le fil conducteur qui reliera aussi les leçons sur la consistance et la généralisation.
		</Callout>
	</TheorySection>
	<Bibliography>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer Science & Business Media."
			link="https://hastie.su.domains/ElemStatLearn/"
		/>
		<BibElement
			authors={['Bishop, C. M.']}
			year={2006}
			title="Pattern Recognition and Machine Learning"
			journal="Springer."
			link="https://www.microsoft.com/en-us/research/uploads/prod/2006/01/biszman.pdf"
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
