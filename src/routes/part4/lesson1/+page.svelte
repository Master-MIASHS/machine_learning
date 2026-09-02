<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import VarianceReductionDemo from '$lib/components/demos/VarianceReductionDemo.svelte';
	import EnsembleBoundaryVisualizer from '$lib/components/demos/EnsembleBoundaryVisualizer.svelte';
	import BootstrapSampler from '$lib/components/demos/BootstrapSampler.svelte';
	import BaggingConvergence from '$lib/components/demos/BaggingConvergence.svelte';
	import OOBErrorTracker from '$lib/components/demos/OOBErrorTracker.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';

	const meta = getPageByPath('/part4/lesson1');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Table of Contents ──

	interface TocEntry {
		id: string;
		label: string;
		description?: string;
		color: 'epistemic' | 'positive' | 'neutral' | 'belief' | 'surprise' | 'agent';
	}

	const tocEntries: TocEntry[] = [
		{
			id: 'introduction',
			label: 'Introduction aux méthodes ensemblistes',
			description: 'Réduction de variance par agrégation de prédicteurs',
			color: 'epistemic'
		},
		{
			id: 'approche-naive',
			label: "L'approche naïve",
			description: 'Vote majoritaire, moyenne, conditions de succès',
			color: 'neutral'
		},
		{
			id: 'bma',
			label: 'Bayesian Model Averaging',
			description: 'Pondération bayésienne par vraisemblance a posteriori',
			color: 'belief'
		},
		{
			id: 'bagging',
			label: 'Bagging (Bootstrap Aggregating)',
			description: 'Création de diversité par échantillonnage bootstrap, erreur OOB',
			color: 'positive'
		}
	];

	// ── Formula variables (stored in script so Svelte never parses backslashes) ──

	// Core objects
	const calX = '\\mathcal{X}';
	const calY = '\\mathcal{Y}';
	const xyInXY = 'X, Y \\in \\mathcal{X} \\times \\mathcal{Y}';
	const PJoint = '\\mathbb{P}';
	const hMap = 'h: \\mathcal{X} \\to \\mathcal{Y}';
	const snDef = 'S_n = \\{(X_i, Y_i)\\}_{i=1}^n \\sim \\mathbb{P}^n';

	// Empirical risk
	const empRiskBlock = 'L_n(h) = \\frac{1}{n}\\sum_{i=1}^{n} \\ell\\bigl(h(X_i), Y_i\\bigr)';
	const ellSym = '\\ell';

	// Theorem 5.1 — Variance reduction
	const predictorsFamily = '\\{y_j\\}_{j=1}^m';
	const aggAvg = '\\hat{y}(x) = \\frac{1}{m}\\sum_{j=1}^{m} y_j(x)';
	const predictorModel = '\\hat{y}_j(x) = y(x) + \\varepsilon_j';
	const epsCentered = '\\mathbb{E}[\\varepsilon_j] = 0';
	const varDecompStep1 =
		'\\bigl(y(X) - \\hat{y}(X)\\bigr)^2 = \\Bigl(\\tfrac{1}{m}\\sum_{j=1}^{m} \\varepsilon_j\\Bigr)^2';
	const varEq1 =
		'\\mathbb{E}\\Bigl[\\bigl(y(X) - \\tfrac{1}{m}\\sum_{j=1}^{m} \\hat{y}_j(X)\\bigr)^2\\Bigr] = \\mathbb{E}\\Bigl[\\bigl(\\tfrac{1}{m}\\sum_{j=1}^{m} \\varepsilon_j\\bigr)^2\\Bigr]';
	const varExpand =
		'\\Bigl(\\tfrac{1}{m}\\sum_{j=1}^{m} \\varepsilon_j\\Bigr)^2 = \\frac{1}{m^2}\\sum_{j=1}^m \\varepsilon_j^2 + \\frac{1}{m^2}\\sum_{j \\neq k} \\varepsilon_j \\varepsilon_k';
	const epsIndependant = '\\mathbb{E}[\\varepsilon_j \\varepsilon_k] = 0';
	const jneqk = 'j \\neq k';
	const varReduced =
		'\\mathbb{E}\\Bigl[\\bigl(\\tfrac{1}{m}\\sum_{j=1}^{m} \\varepsilon_j\\bigr)^2\\Bigr] = \\frac{1}{m}\\,\\mathbb{E}[\\varepsilon^2]';
	const mSym = 'm';
	const varCorrelated =
		'\\mathbb{E}\\Bigl[\\bigl(\\tfrac{1}{m}\\sum_{j=1}^{m} \\varepsilon_j\\bigr)^2\\Bigr] = \\rho\\,\\sigma_\\varepsilon^2 + \\frac{1-\\rho}{m}\\,\\sigma_\\varepsilon^2';
	const rhoSym = '\\rho';
	const rhoLimitInfty = '\\lim_{m \\to \\infty} \\text{Var} = \\rho\\,\\sigma_\\varepsilon^2';

	// Majority voting
	const modelsFamily = '\\{h_j\\}_{j=1}^m';
	const majorityVoteBlock =
		'\\hat{y}(x) = \\underset{c \\in \\mathcal{Y}}{\\arg\\max}\\; \\sum_{j=1}^{m} \\mathbb{1}[h_j(x) = c]';
	const indicatorFn = '\\mathbb{1}[\\cdot]';

	// Average regression
	const avgRegBlock = '\\hat{y}(x) = \\frac{1}{m}\\sum_{j=1}^{m} h_j(x)';

	// Condorcet / error threshold exercise
	const errLtHalf = 'e < 0.5';
	const majorityFailsBlock =
		'\\mathbb{P}(\\text{vote majoritaire faux}) = \\mathbb{P}\\Bigl(\\text{Binomial}(m, e) > m/2\\Bigr)';
	const hoeffdingBound =
		'\\mathbb{P}\\Bigl(\\text{Binomial}(m, e) > m/2\\Bigr) \\leq \\exp\\bigl(-2m(0.5 - e)^2\\bigr)';
	const errGeHalf = 'e \\geq 0.5';

	// BMA
	const mSymCap = 'M';
	const modelFamilyCal = '\\{\\mathcal{M}_j\\}_{j=1}^M';
	const bmaBlock =
		'p(y|x, \\mathcal{D}) = \\sum_{j=1}^{M} p(y|x, \\mathcal{M}_j, \\mathcal{D})\\; p(\\mathcal{M}_j | \\mathcal{D})';
	const predModelJ = 'p(y|x, \\mathcal{M}_j, \\mathcal{D})';
	const posteriorWeight = 'p(\\mathcal{M}_j | \\mathcal{D})';
	const modelIndex = 'j';
	const bayesPosterior =
		'p(\\mathcal{M}_j | \\mathcal{D}) = \\frac{p(\\mathcal{D} | \\mathcal{M}_j)\\; p(\\mathcal{M}_j)}{\\sum_{k=1}^{M} p(\\mathcal{D} | \\mathcal{M}_k)\\; p(\\mathcal{M}_k)}';
	const likelihoodJ = 'p(\\mathcal{D} | \\mathcal{M}_j)';
	const priorJ = 'p(\\mathcal{M}_j)';
	const logPosteriorBlock =
		'\\log p(\\mathcal{M}_j | \\mathcal{D}) = \\log p(\\mathcal{D} | \\mathcal{M}_j) + \\log p(\\mathcal{M}_j) - \\log\\sum_{k=1}^{M} e^{\\log p(\\mathcal{D} | \\mathcal{M}_k) + \\log p(\\mathcal{M}_k)}';
	const logLikelihood =
		'\\log p(\\mathcal{D} | \\mathcal{M}_j) = \\sum_{i=1}^n \\log p(y_i | x_i, \\mathcal{M}_j)';

	// Bootstrap
	const snDefShort = 'S_n = \\{(X_i, Y_i)\\}_{i=1}^n';
	const nSym = 'n';
	const sBoot = 'S_n^*';
	const inclPct = '(1 - 1/e) \\approx 63.2\\%';
	const oobPct = '1/e \\approx 36.8\\%';
	const oneMinusOneOverN = '1 - 1/n';
	const probNotSelected = '(1 - 1/n)^n \\to e^{-1} \\approx 0.368';

	// Algorithm
	const snShort = 'S_n';
	const algoA = '\\mathcal{A}';
	const jLoop = 'j = 1, \\dots, M';
	const bootSampleJ = 'S_n^{(j)}';
	const modelTrained = 'h_j = \\mathcal{A}(S_n^{(j)})';

	// Theorem 5.6 — Bagging variance
	const sigmaSq = '\\sigma^2';
	const sigmaReduction = '\\sigma^2 / M';

	// OOB
	const xiYi = '(x_i, y_i)';
	const oobEstimate =
		'\\widehat{\\text{Err}}_{\\text{OOB}} = \\frac{1}{n}\\sum_{i=1}^n \\ell\\Bigl(\\tfrac{1}{|C_i|}\\sum_{j \\in C_i} h_j(x_i),\\; y_i\\Bigr)';
	const CiDef = 'C_i = \\{j : (x_i,y_i) \\notin S_n^{(j)}\\}';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Méthodes ensemblistes et Bagging'}
	subtitle="Agrégation de modèles : réduction de variance, vote, BMA, bootstrap et erreur out-of-bag"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- SECTION 1: INTRODUCTION -->
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction aux méthodes ensemblistes</h2>
		<p>
			La Partie I de ce cours s'est concentrée sur un seul modèle à la fois : comment garantir
			l'existence d'un minimum (Leçon 1 de la Partie I), le cas particulier des fonctions de perte en
			<em>machine learning</em>, et par quels algorithmes on atteint le minimum (Leçons 3 et 4 de la
			Partie I). Cette nouvelle partie
			change de perspective : plutôt que d'optimiser <em>un</em> modèle du mieux possible, les
			<strong>méthodes ensemblistes</strong> combinent plusieurs modèles, chacun potentiellement imparfait,
			pour obtenir des performances supérieures à celles de n'importe lequel d'entre eux pris isolément.
			C'est l'une des idées les plus efficaces et les plus robustes de tout l'apprentissage automatique
			moderne — des forêts aléatoires jusqu'au boosting, en passant par les ensembles de réseaux de neurones.
		</p>

		<h3>Cadre théorique</h3>
		<p>
			Soit <KatexInline formula={calX} /> notre espace d'entrée et <KatexInline formula={calY} /> notre
			espace de sortie. Soit <KatexInline formula={xyInXY} /> deux variables aléatoires et soit <KatexInline
				formula={PJoint}
			/> leur mesure jointe. Notre objectif est de trouver une application <KatexInline
				formula={hMap}
			/> qui minimise une certaine erreur que nous noterons <KatexInline formula="L" />.
		</p>
		<p>
			N'ayant pas accès aux variables aléatoires elles-mêmes, nous collectons un jeu de données <KatexInline
				formula={snDef}
			/> et construisons le risque empirique :
		</p>
		<KatexBlock formula={empRiskBlock} />
		<p>
			où <KatexInline formula={ellSym} /> définit une erreur élémentaire pour une unique prédiction. Ce
			cadre est identique à celui utilisé implicitement en Leçon 2 de la Partie I, où <KatexInline
				formula="L_n"
			/> jouait déjà le rôle de fonction objectif à minimiser — la nouveauté ici est que nous allons combiner
			<em>plusieurs</em>
			solutions <KatexInline formula="h" /> plutôt que d'en chercher une seule.
		</p>

		<h3>Motivation théorique — Réduction de variance</h3>
		<p>
			Pourquoi combiner des modèles devrait-il fonctionner ? Le résultat suivant, élémentaire mais
			fondamental, en donne la première justification rigoureuse : moyenner des estimateurs bruités
			mais indépendants réduit strictement leur variance, sans jamais introduire de biais
			supplémentaire.
		</p>

		<TheoremBlock number="5.1" title="Réduction de variance par agrégation">
			<p>
				Considérons une famille de prédicteurs <KatexInline formula={predictorsFamily} /> et leur agrégation
				:
			</p>
			<KatexBlock formula={aggAvg} />
			<p>
				Si chaque prédicteur vérifie <KatexInline formula={predictorModel} /> où <KatexInline
					formula="\varepsilon_j"
				/> est un bruit centré (<KatexInline formula={epsCentered} />), alors :
			</p>
			<KatexBlock formula={varEq1} />
			<p>
				Si de plus les erreurs sont indépendantes (<KatexInline formula={epsIndependant} /> pour <KatexInline
					formula={jneqk}
				/>), alors :
			</p>
			<KatexBlock formula={varReduced} />
			<p>La variance est <strong>réduite d'un facteur <KatexInline formula={mSym} /></strong> !</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				Puisque <KatexInline formula={String.raw`\hat{y}(X) = \tfrac{1}{m}\sum_j \hat{y}_j(X)`} /> et
				que chaque <KatexInline formula={String.raw`\hat{y}_j(X) = y(X) + \varepsilon_j`} />,
				l'écart entre la vraie valeur et l'agrégation se réduit exactement au bruit moyen :
			</p>
			<KatexBlock formula={varDecompStep1} />
			<p>En développant le carré de la somme :</p>
			<KatexBlock formula={varExpand} />
			<p>
				Le premier terme a pour espérance <KatexInline
					formula={String.raw`\sigma_\varepsilon^2 / m`}
				/> (où <KatexInline
					formula={String.raw`\sigma_\varepsilon^2 = \mathbb{E}[\varepsilon^2]`}
				/>). Sous l'hypothèse d'indépendance, chaque terme croisé <KatexInline
					formula={String.raw`\mathbb{E}[\varepsilon_j \varepsilon_k]`}
				/> pour <KatexInline formula={jneqk} /> s'annule exactement — c'est précisément l'hypothèse <KatexInline
					formula={epsIndependant}
				/>. Il ne reste donc que le premier terme, ce qui donne <KatexInline
					formula={varReduced}
				/>. ∎
			</p>
		</div>

		<Callout type="warning" title="Remarque cruciale">
			<p>
				Cette réduction de variance n'est effective que si les modèles font des erreurs <strong
					>complémentaires</strong
				>. Si tous les modèles se trompent de la même manière, l'agrégation n'apporte rien.
			</p>
		</Callout>

		<ExampleBlock number="5.1.1" title="Le cas réaliste : erreurs corrélées">
			<p>
				En pratique, les prédicteurs <KatexInline formula="h_j" /> sont tous entraînés sur un même jeu
				de données ou partageant une grande partie, et souvent avec le même algorithme — leurs erreurs
				ne sont donc jamais parfaitement indépendantes. Si l'on suppose une corrélation constante
				<KatexInline formula={rhoSym} /> entre chaque paire d'erreurs, un calcul similaire à la démonstration
				ci-dessus donne :
			</p>
			<KatexBlock formula={varCorrelated} />
			<p>
				Le second terme continue de décroître en <KatexInline formula="1/m" />, exactement comme
				dans le cas indépendant. Mais le premier terme, <KatexInline
					formula="\rho\,\sigma_\varepsilon^2"
				/>, ne dépend pas de <KatexInline formula="m" /> : ajouter des modèles au-delà d'un certain point
				n'apporte donc plus qu'un gain marginal, et la variance résiduelle est bornée inférieurement par
			</p>
			<KatexBlock formula={rhoLimitInfty} />
			<p>
				Cette observation est la motivation directe des méthodes vues plus loin dans cette leçon (le
				bagging) et dans la suite du cours (les forêts aléatoires) : l'objectif n'est pas seulement
				d'agréger des modèles, mais de <strong
					>réduire activement la corrélation <KatexInline formula={rhoSym} /> entre eux</strong
				>, précisément parce que c'est ce terme, et non le nombre de modèles, qui borne le gain
				possible.
			</p>
		</ExampleBlock>

		<InteractiveSection
			number="5.1"
			title="Variance par agrégation"
			onInteract={tracker.trackInteraction}
		>
			<VarianceReductionDemo />
		</InteractiveSection>
	</TheorySection>

	<!-- SECTION 2: APPROCHE NAÏVE -->
	<TheorySection>
		<h2 id="approche-naive">L'approche naïve : combiner plusieurs modèles</h2>
		<p>
			Le Théorème 5.1 nous dit que moyenner des prédicteurs bruités réduit la variance — mais il
			suppose que les modèles agrégés produisent des valeurs numériques continues. Formalisons
			maintenant comment cette idée s'adapte aux deux cadres les plus courants de l'apprentissage
			supervisé : la classification et la régression.
		</p>

		<DefinitionBlock number="5.2" title="Vote majoritaire">
			<p>
				Pour un problème de classification avec <KatexInline formula={mSym} /> modèles <KatexInline
					formula={modelsFamily}
				/>, la prédiction finale est :
			</p>
			<KatexBlock formula={majorityVoteBlock} />
			<p>où <KatexInline formula={indicatorFn} /> est la fonction indicatrice.</p>
		</DefinitionBlock>

		<InteractiveSection
			number="5.2"
			title="Frontières de décision"
			onInteract={tracker.trackInteraction}
		>
			<EnsembleBoundaryVisualizer />
		</InteractiveSection>

		<DefinitionBlock number="5.3" title="Moyenne pour la régression">
			<p>
				Pour un problème de régression avec <KatexInline formula={mSym} /> modèles <KatexInline
					formula={modelsFamily}
				/>, la prédiction finale est :
			</p>
			<KatexBlock formula={avgRegBlock} />
			<p>
				C'est exactement l'agrégation étudiée dans le Théorème 5.1 — le vote majoritaire (Définition
				5.2) en est l'analogue pour des sorties discrètes.
			</p>
		</DefinitionBlock>

		<h3>Conditions de succès</h3>
		<p>L'agrégation naïve fonctionne bien si trois conditions sont satisfaites :</p>
		<ol>
			<li><strong>Diversité</strong> : Les modèles font des erreurs différentes.</li>
			<li><strong>Qualité individuelle</strong> : Chaque modèle est meilleur que le hasard.</li>
			<li><strong>Indépendance</strong> : Les erreurs sont décorrélées.</li>
		</ol>

		<Callout type="warning" title="Attention">
			<p>
				Si tous les modèles se trompent sur les mêmes exemples, l'agrégation n'améliore rien ! Le
				défi principal est donc de <strong>créer de la diversité</strong> entre les modèles — un problème
				que l'approche naïve ne résout pas d'elle-même : entraîner le même algorithme sur le même jeu
				de données produit toujours le même modèle. C'est précisément la limite que le bagging, en fin
				de leçon, est conçu pour lever.
			</p>
		</Callout>

		<ExercisePanel number="5.1" title="Majorité vs Individu">
			{#snippet solution()}
				<p>
					Notons <KatexInline formula="e < 0.5" /> le taux d'erreur commun à chaque classifieur, et supposons
					les erreurs indépendantes. Le vote majoritaire se trompe si et seulement si
					<strong>strictement plus de la moitié</strong> des <KatexInline formula={mSym} /> classifieurs
					se trompent simultanément — un événement dont la probabilité suit une loi binomiale :
				</p>
				<KatexBlock formula={majorityFailsBlock} />
				<p>
					Par l'inégalité de concentration de Hoeffding (applicable car chaque classifieur se trompe
					de façon indépendante avec probabilité <KatexInline formula="e" />) :
				</p>
				<KatexBlock formula={hoeffdingBound} />
				<p>
					Puisque <KatexInline formula={errLtHalf} />, le terme <KatexInline
						formula="(0.5 - e)^2"
					/> est strictement positif, donc cette borne
					<strong>décroît exponentiellement vite vers 0</strong>
					quand <KatexInline formula={mSym} /> augmente. Le vote majoritaire est donc arbitrairement plus
					précis que chaque classifieur individuel, à condition d'ajouter suffisamment de modèles indépendants.
					C'est le <strong>théorème du jury de Condorcet</strong>
					(1785), l'un des tout premiers résultats mathématiques sur l'agrégation de décisions. Notez
					que si <KatexInline formula={errGeHalf} />, l'inégalité s'inverse : agréger des
					classifieurs individuellement pires que le hasard ne fait qu'empirer la situation à mesure
					que <KatexInline formula={mSym} /> augmente — la condition <KatexInline
						formula={errLtHalf}
					/> est donc essentielle, pas une simplification technique.
				</p>
			{/snippet}
			<p>
				Démontrez que le vote majoritaire améliore la précision quand chaque classifieur individuel
				a un taux d'erreur <KatexInline formula={errLtHalf} /> et que les erreurs sont indépendantes.
			</p>
		</ExercisePanel>
	</TheorySection>

	<!-- SECTION 3: BAYESIAN MODEL AVERAGING -->
	<TheorySection>
		<h2 id="bma">Bayesian Model Averaging (BMA)</h2>
		<p>
			L'agrégation naïve (Section 2) donne le même poids à chaque modèle, qu'il soit excellent ou
			médiocre. L'approche bayésienne corrige ce défaut en pondérant chaque modèle selon sa
			vraisemblance a posteriori — une formalisation directe du principe intuitif « faire davantage
			confiance aux modèles qui expliquent mieux les données observées ».
		</p>

		<DefinitionBlock number="5.4" title="Bayesian Model Averaging">
			<p>
				Soit une famille de <KatexInline formula={mSymCap} /> modèles probabilistes <KatexInline
					formula={modelFamilyCal}
				/>. Pour une nouvelle observation <KatexInline formula="x" />, la prédiction BMA est :
			</p>
			<KatexBlock formula={bmaBlock} />
			<p>où :</p>
			<ul>
				<li>
					<KatexInline formula={predModelJ} /> : prédiction du modèle <KatexInline
						formula={modelIndex}
					/> conditionnellement aux données
				</li>
				<li>
					<KatexInline formula={posteriorWeight} /> : probabilité a posteriori du modèle <KatexInline
						formula={modelIndex}
					/>
				</li>
			</ul>
		</DefinitionBlock>

		<h3>Calcul des poids a posteriori</h3>
		<p>La probabilité a posteriori de chaque modèle se calcule via la règle de Bayes :</p>
		<KatexBlock formula={bayesPosterior} />
		<p>
			où <KatexInline formula={likelihoodJ} /> est la vraisemblance des données sous le modèle <KatexInline
				formula={modelIndex}
			/>, et <KatexInline formula={priorJ} /> la probabilité a priori (souvent uniforme).
		</p>

		<Callout type="intuition" title="Un rasoir d'Occam automatique">
			<p>
				Un avantage souvent sous-estimé du BMA est qu'il pénalise <em>implicitement</em> les modèles
				trop complexes, sans qu'aucun terme de régularisation explicite ne soit ajouté à la main. Un
				modèle avec beaucoup de paramètres peut s'ajuster à un plus grand nombre de jeux de données
				possibles, ce qui dilue sa vraisemblance <KatexInline
					formula={String.raw`p(\mathcal{D}|\mathcal{M}_j)`}
				/> sur chacun d'entre eux individuellement (la vraisemblance totale, intégrée sur tous les jeux
				de données possibles, doit sommer à 1). Ce phénomène, parfois appelé « rasoir d'Occam bayésien
				», favorise naturellement les modèles parcimonieux sans nécessiter de terme de pénalité additionnel
				— une idée que nous retrouverons sous une forme différente lorsque nous étudierons la régularisation
				explicite (Ridge, Lasso) dans les leçons suivantes.
			</p>
		</Callout>

		<Callout type="intuition" title="Implémentation pratique">
			<p>
				En pratique, on travaille avec les log-probabilités pour éviter les problèmes numériques :
			</p>
			<KatexBlock formula={logPosteriorBlock} />
		</Callout>

		<ExercisePanel number="5.2" title="BMA pour la classification">
			{#snippet solution()}
				<p>
					Pour un modèle probabiliste, la log-vraisemblance est <KatexInline
						formula={logLikelihood}
					/>. Il suffit d'accumuler cette somme pour chaque modèle <KatexInline
						formula={String.raw`\mathcal{M}_j`}
					/> sur le jeu d'entraînement, d'y ajouter le log-prior <KatexInline
						formula={String.raw`\log p(\mathcal{M}_j)`}
					/> (nul si le prior est uniforme), puis de normaliser via la formule de la Callout ci-dessus
					(le terme <KatexInline formula={String.raw`\text{logsumexp}	`} /> évite les débordements numériques
					de l'exponentiation).
				</p>
			{/snippet}
			<p>
				Implémentez un classifieur BMA qui pondère les prédictions de plusieurs modèles selon leur
				log-vraisemblance sur les données d'entraînement.
			</p>
		</ExercisePanel>

		<Callout type="summary" title="Avantages et limites du BMA">
			<ul>
				<li><strong>✓</strong> Prise en compte rigoureuse de l'incertitude sur les modèles</li>
				<li><strong>✓</strong> Poids adaptatifs selon les performances</li>
				<li>
					<strong>✗</strong> Nécessite des modèles probabilistes (qui sortent des distributions)
				</li>
				<li><strong>✗</strong> Sensible au choix des a priori</li>
			</ul>
		</Callout>
	</TheorySection>

	<!-- SECTION 4: BAGGING -->
	<TheorySection>
		<h2 id="bagging">Bagging (Bootstrap Aggregating)</h2>
		<p>
			La difficulté principale avec l'agrégation naïve (Section 2) et le BMA (Section 3) est que,
			pour une classe de modèles donnée, un même jeu d'apprentissage produit toujours la même
			solution : entraîner dix fois le même arbre de décision sur les mêmes données donne dix fois
			le même arbre, et l'agréger avec lui-même n'apporte évidemment aucune réduction de variance.
			Or nous avons vu dans l'Exemple 5.1.1 que c'est justement la corrélation entre modèles qui
			borne le gain de l'agrégation. Le <strong>bagging</strong> (Bootstrap Aggregating) résout ce
			problème en créant artificiellement de la variabilité entre les jeux d'entraînement, via des
			<strong>échantillons bootstrap</strong>.
		</p>

		<DefinitionBlock number="5.5" title="Échantillon Bootstrap">
			<p>
				Soit <KatexInline formula={snDefShort} /> un jeu de données de taille <KatexInline
					formula={nSym}
				/>. Un échantillon bootstrap <KatexInline formula={sBoot} /> est obtenu en tirant <KatexInline
					formula={nSym}
				/> points aléatoirement <strong>avec remise</strong> dans <KatexInline formula={snShort} />.
			</p>
			<p><strong>Propriétés clés :</strong></p>
			<ul>
				<li>Certains points apparaissent plusieurs fois</li>
				<li>Environ <KatexInline formula={inclPct} /> des points originaux sont présents</li>
				<li>Environ <KatexInline formula={oobPct} /> des points sont absents (out-of-bag)</li>
			</ul>
		</DefinitionBlock>

		<InteractiveSection
			number="5.3"
			title="Échantillonnage Bootstrap"
			onInteract={tracker.trackInteraction}
		>
			<BootstrapSampler />
		</InteractiveSection>

		<Callout type="intuition" title="Pourquoi 63.2% ?">
			<p>
				La probabilité qu'un point donné ne soit pas sélectionné lors d'un tirage est <KatexInline
					formula={oneMinusOneOverN}
				/>. Après <KatexInline formula={nSym} /> tirages indépendants (avec remise, donc chaque tirage
				est indépendant des précédents), cette probabilité devient <KatexInline
					formula={probNotSelected}
				/>. Donc environ 63.2% des points sont inclus au moins une fois, et les 36.8% restants
				forment naturellement un ensemble de validation gratuit pour ce modèle particulier — c'est
				précisément l'idée exploitée par l'erreur out-of-bag, définie plus loin.
			</p>
		</Callout>

		<div class="algo-block">
			<h3>Algorithme du Bagging</h3>
			<p>
				<strong>Entrée :</strong> Jeu de données <KatexInline formula={snShort} />, algorithme
				d'apprentissage <KatexInline formula={algoA} />, nombre de modèles <KatexInline
					formula={mSymCap}
				/>
			</p>
			<ol>
				<li>Pour chaque <KatexInline formula={jLoop} /> :</li>
				<ul>
					<li>
						Générer un échantillon bootstrap <KatexInline formula={bootSampleJ} /> à partir de <KatexInline
							formula={snShort}
						/>
					</li>
					<li>Entraîner un modèle <KatexInline formula={modelTrained} /></li>
				</ul>
				<li>
					<strong>Sortie :</strong> Prédiction agrégée par moyenne (régression, Définition 5.3) ou vote
					majoritaire (classification, Définition 5.2)
				</li>
			</ol>
		</div>

		<InteractiveSection
			number="5.4"
			title="Convergence du Bagging"
			onInteract={tracker.trackInteraction}
		>
			<BaggingConvergence />
		</InteractiveSection>

		<TheoremBlock number="5.6" title="Réduction de variance par bagging">
			<p>
				Si les modèles de base ont une variance <KatexInline formula={sigmaSq} /> et sont décorrélés,
				alors le modèle baggé a une variance <KatexInline formula={sigmaReduction} />.
			</p>
			<p>
				Ce résultat est une application directe du Théorème 5.1 : le bootstrap ne change rien à la
				formule elle-même, il ne fait que fournir un mécanisme concret pour rendre l'hypothèse
				d'indépendance <em>approximativement</em> vraie en pratique, en entraînant chaque modèle sur un
				sous-échantillon différent plutôt que sur les données identiques.
			</p>
			<p>
				En pratique, les modèles ne sont jamais totalement décorrélés (ils partagent la même
				distribution sous-jacente, comme le montre l'Exemple 5.1.1), mais le bagging réduit
				significativement la variance pour les modèles <strong>instables</strong> (arbres de décision,
				réseaux de neurones).
			</p>
		</TheoremBlock>

		<Callout type="intuition" title="Intuition clé">
			<p>
				Le bagging stabilise les algorithmes <strong>instables</strong> — ceux qui changent beaucoup avec
				de petites variations des données, comme un arbre de décision non élagué, dont la structure entière
				peut changer si un seul point d'entraînement est déplacé. Il n'aide en revanche pas les algorithmes
				déjà stables (comme la régression linéaire) : leur variance étant déjà faible, il n'y a essentiellement
				rien à réduire, et le bagging n'apporte alors qu'un coût de calcul supplémentaire sans bénéfice
				statistique.
			</p>
		</Callout>

		<h3>Out-of-Bag (OOB) Error</h3>
		<DefinitionBlock number="5.7" title="Out-of-Bag Error">
			<p>
				Pour chaque exemple <KatexInline formula={xiYi} />, notons <KatexInline formula={CiDef} />
				l'ensemble des modèles pour lesquels cet exemple n'était <strong>pas</strong> présent dans l'échantillon
				bootstrap d'entraînement. L'erreur out-of-bag s'écrit :
			</p>
			<KatexBlock formula={oobEstimate} />
			<p>
				Autrement dit, chaque exemple est évalué uniquement par les modèles qui ne l'ont
				<strong>jamais vu</strong> pendant leur propre entraînement — exactement comme s'il s'agissait
				d'un ensemble de test indépendant, mais sans avoir eu besoin de mettre de côté la moindre donnée
				au départ.
			</p>
			<p>
				L'erreur OOB fournit une estimation non biaisée de l'erreur de généralisation <strong
					>sans ensemble de validation séparé</strong
				>.
			</p>
		</DefinitionBlock>

		<InteractiveSection
			number="5.5"
			title="Erreur Out-of-Bag"
			onInteract={tracker.trackInteraction}
		>
			<OOBErrorTracker />
		</InteractiveSection>

		<ExercisePanel number="5.3" title="Bagging vs Arbre seul">
			{#snippet solution()}
				<p>
					Avec 100 arbres baggés, on observe typiquement une réduction significative de la variance
					des prédictions comparée à un arbre unique — l'erreur de test diminue notamment sur les
					exemples proches des frontières de décision, là où un arbre isolé est le plus instable (un
					petit changement dans les données d'entraînement suffit à déplacer la frontière). Le gain
					de précision moyen est généralement plus modeste que la réduction de variance elle-même,
					car le biais des arbres individuels — inchangé par le bagging, voir le Théorème 5.6 —
					reste une composante de l'erreur totale que l'agrégation ne corrige pas.
				</p>
			{/snippet}
			<p>
				Comparez les performances d'un arbre de décision seul vs un modèle baggé avec 100 arbres.
				Observez la différence de variance et de précision.
			</p>
		</ExercisePanel>

		<Callout type="summary" title="Retenir">
			<ul>
				<li>
					Le <strong>bagging</strong> crée de la diversité via le bootstrap (échantillonnage avec remise)
					— répondant directement à la limite identifiée dans l'Exemple 5.1.1 : la corrélation entre modèles
					borne le gain de l'agrégation.
				</li>
				<li>
					Il est particulièrement efficace pour les modèles <strong>instables</strong> à haute variance,
					et n'apporte rien aux modèles déjà stables.
				</li>
				<li>L'erreur OOB offre une estimation gratuite de la généralisation.</li>
				<li>
					Le gain dépend du degré de <strong>décorrélation</strong> entre les modèles de base.
				</li>
			</ul>
		</Callout>
	</TheorySection>

	<!-- BIBLIOGRAPHY -->
	<Bibliography>
		<BibElement
			authors={['Breiman, L.']}
			year={1996}
			title="Bagging Predictors"
			journal="Machine Learning."
			link="https://doi.org/10.1007/BF00058655"
		/>
		<BibElement
			authors={['Breiman, L.']}
			year={2001}
			title="Random Forests"
			journal="Machine Learning."
			link="https://doi.org/10.1023/A:1010933404324"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer Science & Business Media, Second Edition."
			link="https://hastie.su.domains/ElemStatLearn/"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.algo-block {
		background: var(--color-surface-raised);
		border-left: 3px solid var(--color-belief);
		padding: 1rem 1.25rem;
		margin: 1rem 0;
		border-radius: 4px;
	}

	.algo-block h3 {
		margin-top: 0;
	}

	.algo-block ol {
		padding-left: 1.5rem;
	}

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
