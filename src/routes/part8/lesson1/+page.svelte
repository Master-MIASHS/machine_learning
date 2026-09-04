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
	import Quiz, { type QuizItem } from '$lib/components/demos/Quiz.svelte';

	const meta = getPageByPath('/part8/lesson1');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question: "Que dit l'inégalité de Markov, selon la leçon ?",
			options: [
				'Pour toute variable aléatoire Z de variance finie : P(|Z - E[Z]| ≥ ε) ≤ Var(Z)/ε².',
				'Pour toute variable aléatoire Z : P(Z ≥ t) ≤ e^{-t} E[Z].',
				'Pour des variables i.i.d. Z_i dans [0, 1] : P(|(1/n) Σ Z_i - E[Z_1]| ≥ ε) ≤ 2 e^{-2nε²}.',
				'Pour une variable aléatoire Z ≥ 0 presque sûrement et t > 0 : P(Z ≥ t) ≤ E[Z]/t.'
			],
			answerIndex: 3,
			explanation:
				"Markov : pour Z ≥ 0 presque sûrement et t > 0, P(Z ≥ t) ≤ E[Z]/t ; la démonstration minore Z par t·1_{Z ≥ t} presque sûrement, puis prend l'espérance, qui préserve l'inégalité."
		},
		{
			question:
				"Comment l'inégalité de Bienaymé-Tchebychev se déduit-elle de celle de Markov, selon la démonstration de la leçon ?",
			options: [
				'En appliquant Markov à la variable positive (Z - E[Z])² avec le seuil ε², et en notant que les événements {(Z - E[Z])² ≥ ε²} et {|Z - E[Z]| ≥ ε} coïncident.',
				'En appliquant Markov à Z elle-même avec le seuil ε, puis en élevant la borne obtenue au carré.',
				"Par l'inégalité triangulaire des espérances, appliquée à |Z - E[Z]|.",
				'En supposant que Z est gaussienne, cas où les deux inégalités deviennent équivalentes.'
			],
			answerIndex: 0,
			explanation:
				"Le cartouche « Tchebychev, c'est Markov appliqué intelligemment » résume : le choix est d'appliquer Markov au carré de l'écart à la moyenne plutôt qu'à la variable elle-même — ce qui transforme une borne portant sur Z en une borne portant sur la variance, bien plus informative pour la dispersion autour d'une moyenne."
		},
		{
			question:
				"Pour la moyenne empirique (1/n) Σ Z_i de n variables i.i.d. de moyenne μ et de variance σ², que donne l'inégalité de Tchebychev ?",
			options: [
				'P(|(1/n) Σ Z_i - μ| ≥ ε) ≤ σ²/ε², une borne indépendante de n.',
				"P(|(1/n) Σ Z_i - μ| ≥ ε) ≤ σ²/(n ε²) → 0, soit un écart typique d'ordre 1/√n.",
				'P(|(1/n) Σ Z_i - μ| ≥ ε) ≤ 2 e^{-nε}, une décroissance exponentielle en n.',
				'La moyenne empirique converge presque sûrement vers μ mais pas en probabilité.'
			],
			answerIndex: 1,
			explanation:
				"Avec E[(1/n) Σ Z_i] = μ et Var((1/n) Σ Z_i) = σ²/n, Tchebychev donne la borne σ²/(n ε²) qui s'annule quand n → +∞ : c'est la loi des grands nombres sous forme quantitative — on sait que la convergence a lieu, et à quelle vitesse (1/√n sur l'écart typique, la probabilité de dépassement décroissant en 1/n)."
		},
		{
			question:
				"Pour un classifieur h fixé à l'avance, quelle borne explicite la leçon déduit-elle pour P(|R_n(h) - R(h)| ≥ ε) ?",
			options: [
				'1/(n ε²), puisque les indicateurs Z_i sont de Bernoulli.',
				'R(h)/n, par Markov appliqué directement au risque empirique.',
				'1/(4 n ε²), puisque Var(Z_i) = R(h)(1 - R(h)) est majoré par 1/4, atteint en R(h) = 1/2.',
				'2 e^{-2nε²}, par Hoeffding, sans hypothèse supplémentaire.'
			],
			answerIndex: 2,
			explanation:
				'Les indicateurs Z_i = 1_{h(X_i) ≠ Y_i} sont de Bernoulli avec variance exacte R(h)(1 - R(h)) ; cette quantité est maximisée en 1/4 pour R(h) = 1/2, ce qui donne la borne explicite 1/(4n ε²) (section « Les limites du contrôle pour un classifieur fixé »).'
		},
		{
			question:
				'Pourquoi cette borne ne suffit-elle pas à contrôler le classifieur ĥ effectivement choisi par minimisation du risque empirique R_n sur une classe H ?',
			options: [
				'Parce que la borne exige que n soit supérieur à 1000 pour être non triviale.',
				"Parce qu'elle n'est valable que pour h fixé à l'avance, indépendamment des données : elle ne contrôle pas le sup de l'écart sur toute la classe, et ĥ dépend de l'échantillon.",
				"Parce que R_n(h) est toujours supérieur à R(h), si bien que l'écart est toujours positif.",
				'Parce que la perte 0-1 est NP-difficile à minimiser.'
			],
			answerIndex: 1,
			explanation:
				"Le cartouche d'avertissement « Cette borne ne suffit pas encore » est explicite : en apprentissage, on ne choisit jamais un h arbitraire à l'avance — on sélectionne ĥ après avoir vu les données, en minimisant R_n sur H — et un contrôle valable pour chaque h pris isolément ne dit rien sur celui, potentiellement trompeur, que l'algorithme finit par choisir."
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
			La Partie VII a établi <em>que</em> certains algorithmes convergent vers le risque de Bayes.
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

		<InteractiveSection
			number="1.3"
			title="Quiz — Concentration : Markov, Tchebychev, Hoeffding"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
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
