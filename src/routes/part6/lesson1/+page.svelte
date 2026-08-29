<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import ConcentrationInequalityExplorer from '$lib/components/demos/ConcentrationInequalityExplorer.svelte';
	import EmpiricalMeanConvergenceDemo from '$lib/components/demos/EmpiricalMeanConvergenceDemo.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part6/lesson1');
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
			description: 'Borner l\u2019écart entre risque empirique et risque théorique',
			color: 'epistemic'
		},
		{
			id: 'inegalites-markov-tchebychev',
			label: 'Markov et Bienaymé-Tchebychev',
			description: 'Les deux inégalités fondamentales, et comment la seconde dérive de la première',
			color: 'belief'
		},
		{
			id: 'convergence-moyenne-empirique',
			label: 'Convergence de la moyenne empirique',
			description: 'La loi des grands nombres, version quantitative',
			color: 'surprise'
		},
		{
			id: 'limite-classifieur-fixe',
			label: 'Les limites du contrôle pour un classifieur fixé',
			description: 'Pourquoi cette borne ne suffit pas encore pour apprendre',
			color: 'neutral'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const markovStatement =
		'Z \\ge 0 \\text{ p.s.},\\ t>0 \\implies \\mathbb{P}(Z \\ge t) \\le \\frac{\\mathbb{E}[Z]}{t}';
	const markovMinoration = 'Z \\ge t\\,\\mathbb{1}_{Z \\ge t} \\quad \\text{p.s.}';
	const markovExpectation =
		'\\mathbb{E}[Z] \\ge \\mathbb{E}[t\\,\\mathbb{1}_{Z\\ge t}] = t\\,\\mathbb{P}(Z \\ge t)';

	const chebyshevStatement =
		'\\mathrm{Var}(Z) < \\infty,\\ \\varepsilon>0 \\implies \\mathbb{P}(|Z-\\mathbb{E}[Z]| \\ge \\varepsilon) \\le \\frac{\\mathrm{Var}(Z)}{\\varepsilon^2}';
	const chebyshevViaMarkov =
		'\\mathbb{P}\\big((Z-\\mathbb{E}[Z])^2 \\ge \\varepsilon^2\\big) \\le \\frac{\\mathbb{E}[(Z-\\mathbb{E}[Z])^2]}{\\varepsilon^2} = \\frac{\\mathrm{Var}(Z)}{\\varepsilon^2}';
	const chebyshevEventEquality =
		'\\{(Z-\\mathbb{E}[Z])^2 \\ge \\varepsilon^2\\} = \\{|Z-\\mathbb{E}[Z]| \\ge \\varepsilon\\}';
	const hoeffdingStatement =
		'Z_1,\\dots,Z_n\\in[0,1]\\text{ i.i.d.} \\implies \\mathbb{P}\\left(\\left|\\frac1n\\sum_{i=1}^n Z_i-\\mathbb{E}[Z_1]\\right|\\ge\\varepsilon\\right)\\le 2e^{-2n\\varepsilon^2}';

	const iidSetup =
		'Z_1,\\dots,Z_n \\text{ i.i.d.},\\quad \\mu=\\mathbb{E}[Z_1],\\quad \\sigma^2=\\mathrm{Var}(Z_1)<+\\infty';
	const empiricalMeanDef = '\\bar Z_n = \\frac1n\\sum_{i=1}^n Z_i';
	const empiricalMeanMoments =
		'\\mathbb{E}[\\bar Z_n] = \\mu, \\qquad \\mathrm{Var}(\\bar Z_n) = \\frac{\\sigma^2}{n}';
	const empiricalMeanChebyshev =
		'\\mathbb{P}(|\\bar Z_n - \\mu| \\ge \\varepsilon) \\le \\frac{\\sigma^2}{n\\varepsilon^2} \\xrightarrow[n\\to+\\infty]{} 0';

	const fixedClassifierZ = 'Z_i = \\mathbb{1}_{h(X_i) \\neq Y_i}';
	const fixedClassifierVar = '\\mathrm{Var}(Z_i) = R(h)\\big(1-R(h)\\big) \\le \\tfrac14';
	const fixedClassifierBound =
		'\\mathbb{P}\\big(|R_n(h) - R(h)| \\ge \\varepsilon\\big) \\le \\frac{R(h)(1-R(h))}{n\\varepsilon^2} \\le \\frac{1}{4n\\varepsilon^2}';

	const supGap = '\\sup_{h\\in\\mathcal H} |R_n(h) - R(h)|';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Concentration et risque empirique'}
	subtitle="Markov, Tchebychev, et pourquoi contrôler un seul classifieur ne suffit pas encore"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			La Partie V a établi <em>que</em> certains algorithmes convergent vers le risque de Bayes.
			Cette partie s'attaque à une question complémentaire : <em>à quelle vitesse</em>, et avec
			quelles garanties quantitatives ? Le point de départ est toujours le même problème :
			<KatexInline formula={'R_n(h)'} /> (calculable, à partir des données) doit servir de substitut à
			<KatexInline formula={'R(h)'} /> (inconnu, dépend de <KatexInline formula={'h'} />). Les
			<strong>inégalités de concentration</strong> quantifient précisément la probabilité que ces deux
			quantités s'écartent l'une de l'autre — c'est l'outil de base sur lequel reposera toute la suite
			de cette partie.
		</p>

		<h2 id="inegalites-markov-tchebychev">Markov et Bienaymé-Tchebychev</h2>

		<TheoremBlock title="Inégalité de Markov">
			<p>
				Soit <KatexInline formula={'Z\\ge 0'} /> une variable aléatoire réelle positive. Alors :
			</p>
			<KatexBlock formula={markovStatement} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				On minore <KatexInline formula={'Z'} /> par <KatexInline
					formula={'t\\,\\mathbb{1}_{Z\\ge t}'}
				/>
				: <KatexBlock formula={markovMinoration} /> (l'inégalité se vérifie séparément sur les deux événements
				<KatexInline formula={'Z<t'} /> et <KatexInline formula={'Z\\ge t'} />). En prenant
				l'espérance, qui préserve l'inégalité :
			</p>
			<KatexBlock formula={markovExpectation} />
			<p>
				On divise par <KatexInline formula={'t>0'} />. ∎
			</p>
		</div>

		<TheoremBlock title="Inégalité de Bienaymé-Tchebychev">
			<p>
				Soit <KatexInline formula={'Z'} /> une variable aléatoire réelle de variance finie. Alors :
			</p>
			<KatexBlock formula={chebyshevStatement} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				On applique Markov à la variable positive <KatexInline formula={'(Z-\\mathbb{E}[Z])^2'} /> avec
				le seuil
				<KatexInline formula={'\\varepsilon^2'} /> :
			</p>
			<KatexBlock formula={chebyshevViaMarkov} />
			<p>
				Or les événements <KatexInline formula={chebyshevEventEquality} /> coïncident (une inégalité au
				carré équivaut à l'inégalité en valeur absolue), d'où le résultat. ∎
			</p>
		</div>

		<Callout type="insight" title="Hoeffding : exploiter le bornage">
			<p>
				Lorsque les observations sont indépendantes et bornées, on peut obtenir une décroissance
				exponentielle de la probabilité d'écart, sans connaître la variance :
			</p>
			<KatexBlock formula={hoeffdingStatement} />
			<p>
				Pour des variables dans un intervalle général <KatexInline formula={'[a,b]'} />, le terme
				d'exposant devient <KatexInline formula={'-2n\\varepsilon^2/(b-a)^2'} />. Hoeffding est donc
				souvent plus informative que Tchebychev pour les grands échantillons, mais elle exige une
				hypothèse supplémentaire : connaître une borne uniforme sur les observations.
			</p>
		</Callout>

		<Callout type="insight" title="Tchebychev, c'est Markov appliqué intelligemment">
			Il n'y a pas deux outils indépendants ici : Tchebychev <em>est</em> Markov, appliqué à la
			bonne variable (le carré de l'écart à la moyenne plutôt qu'à la variable elle-même). C'est ce
			choix qui transforme une borne portant sur <KatexInline formula={'Z'} /> en une borne portant sur
			la <strong>variance</strong> — une quantité bien plus informative dès que l'on s'intéresse à la
			dispersion autour d'une moyenne plutôt qu'à la variable brute.
		</Callout>

		<InteractiveSection
			number="1.1"
			title="Markov, Tchebychev et Hoeffding en parallèle"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> La courbe empirique estime la probabilité d'un écart ; les
				trois autres courbes la majorent. Faites augmenter <KatexInline formula={'n'} /> : Markov reste
				constante, Tchebychev décroît comme <KatexInline formula={'1/n'} />, tandis que Hoeffding
				décroît exponentiellement comme <KatexInline formula={'e^{-2n\\varepsilon^2}'} />.
			</p>
			<ConcentrationInequalityExplorer />
		</InteractiveSection>

		<h2 id="convergence-moyenne-empirique">Convergence de la moyenne empirique</h2>

		<p>
			Ces deux inégalités suffisent à établir la consistance en probabilité de la moyenne empirique
			— le prototype de la convergence du risque empirique vers le risque théorique.
		</p>

		<p>
			Soit <KatexInline formula={iidSetup} />. On pose <KatexInline formula={empiricalMeanDef} />.
		</p>

		<p>Par linéarité de l'espérance et indépendance :</p>
		<KatexBlock formula={empiricalMeanMoments} />

		<p>
			Par Bienaymé-Tchebychev, appliqué directement à <KatexInline formula={empiricalMeanDef} /> :
		</p>
		<KatexBlock formula={empiricalMeanChebyshev} />

		<p>
			Donc <KatexInline formula={empiricalMeanDef} /> converge en probabilité vers <KatexInline
				formula={'\\mu'}
			/> — c'est la loi des grands nombres, sous sa forme quantitative : non seulement la convergence
			a lieu, mais on sait <em>à quelle vitesse</em> (en <KatexInline formula={'1/\\sqrt n'} /> sur l'écart
			typique, puisque la probabilité de dépassement décroît en <KatexInline formula={'1/n'} />).
		</p>

		<InteractiveSection
			number="1.2"
			title="Trajectoires, enveloppe et distribution finale"
			onInteract={tracker.trackInteraction}
		>
			<EmpiricalMeanConvergenceDemo />
		</InteractiveSection>

		<h2 id="limite-classifieur-fixe">Les limites du contrôle pour un classifieur fixé</h2>

		<p>
			Appliquons directement ce résultat au risque empirique. Pour <KatexInline formula={'h'} />
			<strong>fixé</strong>, on pose <KatexInline formula={fixedClassifierZ} />. Alors
			<KatexInline formula={'R_n(h)=\\frac1n\\sum_i Z_i'} /> et <KatexInline
				formula={'R(h)=\\mathbb{E}[Z_i]'}
			/>. Comme
			<KatexInline formula={'Z_i'} /> est de Bernoulli, sa variance est connue exactement :
		</p>
		<KatexBlock formula={fixedClassifierVar} />
		<p>
			(le maximum de <KatexInline formula={'R(h)(1-R(h))'} /> sur <KatexInline
				formula={'R(h)\\in[0,1]'}
			/> est atteint en <KatexInline formula={'R(h)=1/2'} />, où il vaut <KatexInline
				formula={'1/4'}
			/>). En injectant dans le résultat de la section précédente :
		</p>
		<KatexBlock formula={fixedClassifierBound} />

		<Callout type="warning" title="Cette borne ne suffit pas encore">
			Cette borne est valable pour <KatexInline formula={'h'} />
			<strong>fixé à l'avance</strong>, indépendamment des données. Elle ne contrôle
			<strong>pas</strong>
			l'écart
			<KatexBlock formula={supGap} />
			sur une classe entière de classifieurs — c'est pourtant précisément ce dont on a besoin en apprentissage,
			puisqu'on ne choisit jamais un <KatexInline formula={'h'} /> arbitraire à l'avance : on sélectionne
			<KatexInline formula={'\\hat h_{\\mathcal S_n}'} /> après avoir vu les données, en minimisant <KatexInline
				formula={'R_n(h)'}
			/> sur <KatexInline formula={'\\mathcal H'} />. Un contrôle valable pour chaque <KatexInline
				formula={'h'}
			/> pris isolément ne dit rien sur celui, potentiellement trompeur, que l'algorithme finit par choisir.
		</Callout>

		<Callout type="summary" title="Retenir">
			Markov borne <KatexInline formula={'\\mathbb{P}(Z\\ge t)'} /> pour <KatexInline
				formula={'Z\\ge 0'}
			/> positive ; Tchebychev, qui en découle en l'appliquant au carré de l'écart à la moyenne, borne
			<KatexInline formula={'\\mathbb{P}(|Z-\\mathbb{E}[Z]|\\ge\\varepsilon)'} /> via la variance. Appliquée
			au risque empirique d'un classifieur fixé, cette dernière donne une borne explicite en <KatexInline
				formula={'1/(n\\varepsilon^2)'}
			/> — mais seulement pour <em>un</em>
			classifieur choisi sans regarder les données. La leçon suivante étend ce contrôle à une classe <KatexInline
				formula={'\\mathcal H'}
			/> entière, d'abord finie, via l'union bound.
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
		<BibElement
			authors={['Shalev-Shwartz, S.', 'Ben-David, S.']}
			year={2014}
			title="Understanding Machine Learning: From Theory to Algorithms"
			journal="Cambridge University Press."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>
		<BibElement
			authors={['Hoeffding, W.']}
			year={1963}
			title="Probability inequalities for sums of bounded random variables"
			journal="Journal of the American Statistical Association, 58(301), 13-30."
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

	.demo-guide {
		margin: 0.75rem 0;
		padding: 0.8rem 1rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-epistemic, #4f7cac) 8%, transparent);
		line-height: 1.65;
	}
</style>
