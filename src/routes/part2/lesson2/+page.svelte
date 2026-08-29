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
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';

	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';

	const meta = getPageByPath('/part2/lesson2');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── KaTeX formulas (stored as JS variables to avoid Svelte escape issues) ────
	const mSym = 'm';
	const dSym = 'd';
	const mTreesSym = 'M';
	const nSamples = 'n';
	const pSym = 'P';
	const rhoBar = '\\bar{\\rho}';
	const sigmaSq = '\\sigma^2';
	const sqrtD = '\\sqrt{d}';
	const dOver3 = 'd / 3';
	const jLoop = 'j = 1, \\ldots, M';

	// Correlation-variance derivation
	const treesFamily = '\\{h_j\\}_{j=1}^M';
	const treeAvgBlock = '\\hat{y}(x) = \\frac{1}{M}\\sum_{j=1}^{M} h_j(x)';
	const treeErrModel = 'h_j(x) = y(x) + \\varepsilon_j';
	const pairwiseCorrDef =
		'\\rho_{jk} = \\frac{\\mathbb{E}[\\varepsilon_j \\varepsilon_k]}{\\sigma^2}, \\quad j \\neq k';
	const rhoBarDef = '\\bar\\rho = \\frac{1}{M(M-1)}\\sum_{j \\neq k} \\rho_{jk}';
	const varExpandForest =
		'\\text{Var}\\Bigl[\\tfrac{1}{M}\\sum_{j=1}^M \\varepsilon_j\\Bigr] = \\frac{1}{M^2}\\sum_{j=1}^M \\sigma^2 + \\frac{1}{M^2}\\sum_{j \\neq k} \\rho_{jk}\\,\\sigma^2';
	const varAgreeFormula =
		'\\text{Var}_{\\text{agrégé}} = \\bar\\rho \\cdot \\sigma^2 + (1 - \\bar\\rho) \\cdot \\frac{\\sigma^2}{M}';
	const varLimitInfty =
		'\\lim_{M \\to \\infty} \\text{Var}_{\\text{agrégé}} = \\bar\\rho\\,\\sigma^2';

	// Gini / split formalism
	const giniDef = '\\text{Gini}(t) = 1 - \\sum_{c \\in \\mathcal{Y}} p_c(t)^2';
	const pcDef = 'p_c(t) = \\text{proportion des points de classe } c \\text{ au nœud } t';
	const splitGainDef =
		'\\Delta \\text{Impureté}_t = \\text{Gini}(t) - \\frac{n_L}{n_t}\\text{Gini}(t_L) - \\frac{n_R}{n_t}\\text{Gini}(t_R)';
	const bestSplitDef =
		'j^*, s^* = \\underset{j \\in \\mathcal{F}_t,\\ s}{\\arg\\max}\\ \\Delta \\text{Impureté}_t(j, s)';
	const fTDef = '\\mathcal{F}_t \\subset \\{1, \\ldots, d\\}, \\ |\\mathcal{F}_t| = m';

	const errTestFormula =
		'\\text{Erreur}_{\\text{test}}(m) \\approx \\underbrace{\\text{biais}(m)}_{\\nearrow \\text{ quand } m \\searrow} + \\underbrace{\\bar\\rho(m)\\,\\sigma^2}_{\\nearrow \\text{ quand } m \\nearrow}';
	const importanceImpurityFormula =
		'\\text{Importance}(x_j) = \\frac{1}{M} \\sum_{k=1}^{M} \\sum_{t \\in T_k : split(t)=j} \\Delta \\text{Impureté}_t';
	const importancePermFormula =
		'\\text{Importance}_{perm}(x_j) = \\frac{1}{P} \\sum_{p=1}^{P} \\bigl( \\text{Score}(X^{orig}) - \\text{Score}(X^{perm, j}_p) \\bigr)';

	// Table of Content

	const tocEntries: TocEntry[] = [
		{
			id: 'motivation',
			label: 'Motivation du Random Forest',
			description: 'Comprendre le besoin de décorréler structurellement les arbres.',
			color: 'epistemic'
		},
		{
			id: 'algorithme',
			label: 'Algorithme complet',
			description: 'Le double mécanisme de bootstrap et de restriction des features.',
			color: 'positive'
		},
		{
			id: 'choix-features',
			label: 'Le paramètre de division m',
			description: 'Règles de sélection et arbitrage biais/décorrélation.',
			color: 'surprise'
		},
		{
			id: 'importance',
			label: 'Importance des features',
			description: 'Calculer la contribution de chaque variable (MDI & MDA).',
			color: 'agent'
		}
	];
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Random Forest & sélection de features'}
	subtitle="Décorréler les arbres par bootstrap et sélection aléatoire de variables"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ═══════════════════════════════════════════════ -->
	<!-- Section 1 : Motivation — Pourquoi Random Forest ? -->
	<!-- ═══════════════════════════════════════════════ -->
	<TheorySection>
		<TableOfContents entries={tocEntries} />
		<h2 id="motivation">Motivation du Random Forest</h2>

		<p>
			Dans la leçon précédente, nous avons établi le résultat central du bagging (Théorème 5.6) :
			agréger <KatexInline formula={mTreesSym} /> modèles <strong>décorrélés</strong> réduit la
			variance d'un facteur <KatexInline formula={mTreesSym} />. Mais nous avons aussi vu, dans
			l'Exemple 5.1.1, que cette réduction n'est jamais parfaite en pratique : si les modèles
			partagent une corrélation résiduelle <KatexInline formula={rhoBar} />, la variance de
			l'ensemble ne peut pas descendre en dessous de <KatexInline
				formula={String.raw`\bar\rho\,\sigma^2`}
			/>, quel que soit le nombre de modèles ajoutés. Le bootstrap, à lui seul, ne suffit
			généralement pas à rendre cette corrélation résiduelle négligeable.
		</p>

		<p>
			C'est précisément le problème que rencontre le <strong
				>bagging appliqué aux arbres de décision</strong
			> : même entraînés sur des échantillons bootstrap différents, les arbres restent fortement corrélés
			dès que certaines features sont particulièrement prédictives.
		</p>

		<Callout type="warning" title="Problème du bagging pur">
			<p>
				Même avec des échantillons bootstrap différents, les arbres peuvent être très corrélés si :
			</p>
			<ul>
				<li>Quelques features sont très prédictives</li>
				<li>Ces features dominent toujours les divisions aux nœuds racines</li>
				<li>Les arbres résultants ont des structures similaires</li>
			</ul>
			<p>
				Dans ce cas, <KatexInline formula={rhoBar} /> reste élevé malgré le bootstrap, et d'après le résultat
				de l'Exemple 5.1.1, ajouter davantage d'arbres n'apporte qu'un gain marginal.
			</p>
		</Callout>

		<p>
			L'idée clé du <strong>Random Forest</strong>, introduite par Breiman (2001), est d'introduire
			une source supplémentaire de diversité, agissant directement sur la cause du problème plutôt
			que sur son symptôme : à chaque nœud, on ne considère qu'un
			<strong>sous-ensemble aléatoire de features</strong>
			pour choisir la meilleure division. Cette contrainte force les arbres à explorer différentes dimensions
			du problème et réduit fortement la corrélation <KatexInline formula={rhoBar} />
			entre modèles.
		</p>

		<h3>Formalisation : la variance en fonction de la corrélation</h3>

		<p>
			Reprenons et généralisons l'Exemple 5.1.1 de la leçon précédente pour un ensemble d'arbres, en
			autorisant chaque paire d'arbres à avoir sa propre corrélation plutôt qu'une valeur unique
			supposée.
		</p>

		<TheoremBlock number="6.1" title="Variance d'un ensemble en fonction de la corrélation moyenne">
			<p>
				Soit <KatexInline formula={treesFamily} /> une famille d'arbres, chacun vérifiant <KatexInline
					formula={treeErrModel}
				/> avec <KatexInline formula={String.raw`\mathbb{E}[\varepsilon_j] = 0`} /> et <KatexInline
					formula={String.raw`\text{Var}(\varepsilon_j) = \sigma^2`}
				/> pour tout <KatexInline formula="j" />. Notons la corrélation moyenne entre paires
				distinctes :
			</p>
			<KatexBlock formula={rhoBarDef} />
			<p>Alors la variance de l'agrégation <KatexInline formula={treeAvgBlock} /> vaut :</p>
			<KatexBlock formula={varAgreeFormula} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				Comme dans la preuve du Théorème 5.1, l'écart entre l'agrégation et la vraie fonction se
				réduit au bruit moyen, dont on développe le carré :
			</p>
			<KatexBlock formula={varExpandForest} />
			<p>
				où l'on a utilisé la définition <KatexInline formula={pairwiseCorrDef} /> pour réécrire chaque
				covariance <KatexInline formula={String.raw`\mathbb{E}[\varepsilon_j\varepsilon_k]`} /> comme
				<KatexInline formula={String.raw`\rho_{jk}\sigma^2`} />. Il y a <KatexInline formula="M" /> termes
				diagonaux (chacun contribuant <KatexInline formula={String.raw`\sigma^2`} />) et <KatexInline
					formula="M(M-1)"
				/> termes croisés, dont la moyenne est par définition <KatexInline formula={rhoBar} />. En
				divisant par <KatexInline formula="M^2" /> :
			</p>
			<KatexBlock
				formula={String.raw`\frac{M\sigma^2}{M^2} + \frac{M(M-1)\,\bar\rho\,\sigma^2}{M^2} = \frac{\sigma^2}{M} + \frac{M-1}{M}\bar\rho\,\sigma^2`}
			/>
			<p>
				ce qui se réarrange exactement en <KatexInline formula={varAgreeFormula} />. ∎
			</p>
		</div>

		<p>
			Ce théorème rend explicite ce que l'Exemple 5.1.1 laissait entrevoir : en faisant tendre <KatexInline
				formula={String.raw`M \to \infty`}
			/>, le second terme s'annule mais le premier persiste :
		</p>
		<KatexBlock formula={varLimitInfty} />
		<p>
			Le Random Forest agit donc en réduisant directement <KatexInline formula={rhoBar} /> là où le bagging
			pur ne réduit que le second terme, <KatexInline
				formula={String.raw`(1-\bar\rho)\sigma^2/M`}
			/>, par l'effet limité du bootstrap seul.
		</p>
	</TheorySection>

	<InteractiveSection number="6.1" title="Stump de décision" onInteract={tracker.trackInteraction}>
		<DeferredDemo load={() => import('$lib/components/demos/DecisionTreeStump.svelte')} />
	</InteractiveSection>

	<!-- ═══════════════════════════════════════════════ -->
	<!-- Section 2 : Algorithme Random Forest -->
	<!-- ═══════════════════════════════════════════════ -->
	<TheorySection>
		<h2 id="algorithme">Algorithme du Random Forest</h2>

		<p>
			Avant de formaliser l'algorithme complet, rappelons brièvement comment un arbre de décision
			choisit ses divisions, car c'est précisément ce mécanisme que le Random Forest va contraindre.
		</p>

		<DefinitionBlock number="6.2" title="Impureté de Gini et division optimale">
			<p>
				Pour un nœud <KatexInline formula="t" /> contenant <KatexInline formula="n_t" /> points, l'impureté
				de Gini est :
			</p>
			<KatexBlock formula={giniDef} />
			<p>
				où <KatexInline formula={pcDef} />. Une division candidate sur la feature <KatexInline
					formula="j"
				/> au seuil <KatexInline formula="s" /> sépare <KatexInline formula="t" /> en un nœud gauche <KatexInline
					formula="t_L"
				/> et un nœud droit <KatexInline formula="t_R" />, avec un gain d'impureté :
			</p>
			<KatexBlock formula={splitGainDef} />
			<p>
				Un arbre de décision classique choisit, à chaque nœud, la division qui maximise ce gain
				parmi <strong>toutes</strong> les <KatexInline formula={dSym} /> features disponibles :
			</p>
			<KatexBlock
				formula={String.raw`j^*, s^* = \arg\max_{j \in \{1,\ldots,d\},\ s} \Delta \text{Impureté}_t(j, s)`}
			/>
		</DefinitionBlock>

		<p>
			C'est cette dernière étape (maximisation) que le Random Forest modifie. Le Random Forest
			combine deux mécanismes aléatoires : le
			<strong>bootstrap des données</strong> (comme le bagging classique, Définition 5.5) et la
			<strong>sélection aléatoire de features</strong> à chaque nœud.
		</p>

		<DefinitionBlock number="6.3" title="Division optimale restreinte (Random Forest)">
			<p>
				À chaque nœud <KatexInline formula="t" />, on tire d'abord un sous-ensemble aléatoire de
				features <KatexInline formula={fTDef} />, puis on maximise le gain d'impureté uniquement sur
				ce sous-ensemble :
			</p>
			<KatexBlock formula={bestSplitDef} />
			<p>
				Quand <KatexInline formula="m = d" />, cette définition coïncide exactement avec la division
				classique de la Définition 6.2 : on retrouve le bagging pur appliqué aux arbres. C'est la
				valeur <KatexInline formula="m < d" /> qui introduit la décorrélation structurelle étudiée au
				Théorème 6.1.
			</p>
		</DefinitionBlock>

		<div class="algo-block">
			<h3>Algorithme 6.1 — Random Forest</h3>
			<p>
				<strong>Paramètres :</strong>
				<KatexInline formula={mTreesSym} /> = nombre d'arbres,
				<KatexInline formula={mSym} /> = nombre de features à considérer par division.
			</p>
			<ol>
				<li>Pour chaque arbre <KatexInline formula={jLoop} /> :</li>
				<ul>
					<li>Générer un échantillon bootstrap de taille <KatexInline formula={nSamples} /></li>
					<li>
						Construire un arbre en appliquant la Définition 6.3 à chaque nœud (division optimale
						restreinte à <KatexInline formula={mSym} /> features tirées aléatoirement)
					</li>
				</ul>
				<li>
					<strong>Sortie :</strong> Prédiction agrégée des <KatexInline formula={mTreesSym} /> arbres
					(vote majoritaire ou moyenne, Définitions 5.2–5.3)
				</li>
			</ol>
		</div>

		<p>
			La différence avec le bagging pur est que chaque arbre n'a accès qu'à un sous-ensemble
			aléatoire de features pour chaque décision. Cette contrainte locale force une
			<strong>décorrélation structurelle</strong> : même si tous les arbres voient potentiellement les
			mêmes données (ou des données très similaires, via le bootstrap), ils explorent des espaces de partition
			différents à chaque nœud.
		</p>

		<Callout type="intuition" title="Intuition">
			<p>
				Pensez-y comme un panel d'experts : le bagging donne à chaque expert une partie différente
				des documents (bootstrap), tandis que le Random Forest fait en plus que chaque expert ne
				consulte qu'un sous-ensemble aléatoire de sources à chaque question posée (sélection de
				features par nœud, pas seulement par arbre). Les conclusions sont donc plus diversifiées et
				l'agrégation plus robuste — même deux experts ayant lu exactement les mêmes documents
				peuvent aboutir à des raisonnements différents s'ils sont forcés de consulter des sources
				différentes à chaque étape de leur analyse.
			</p>
		</Callout>

		<ExercisePanel number="6.1" title="Impact de la sélection aléatoire">
			{#snippet solution()}
				<p>
					Avec <KatexInline formula={mSym} /> = 1, chaque division ne considère qu'une seule feature choisie
					au hasard — d'après la Définition 6.3, la « division optimale » est alors juste le meilleur
					seuil sur cette unique feature, qui n'a aucune raison d'être informative. Les arbres sont donc
					très divers (car chacun explore une direction différente), mais individuellement faibles. Avec
					<KatexInline formula={mSym} /> =
					<KatexInline formula={dSym} />, la Définition 6.3 coïncide exactement avec la division
					classique (Définition 6.2) : on retrouve le bagging pur, où toutes les features sont
					visibles à chaque nœud — et donc le problème de corrélation élevée identifié en
					introduction. La valeur optimale se situe entre les deux, typiquement autour de <KatexInline
						formula={sqrtD}
					/> (Définition 6.4 ci-dessous) : assez de features pour que chaque division reste informative,
					assez peu pour forcer une réelle diversité entre arbres.
				</p>
			{/snippet}
			<p>
				Que se passe-t-il si on prend <KatexInline formula={mSym} /> = 1 (une seule feature par division)
				? Et si <KatexInline formula={mSym} /> = <KatexInline formula={dSym} /> (toutes les features)
				? Justifiez à l'aide des Définitions 6.2 et 6.3.
			</p>
		</ExercisePanel>
	</TheorySection>

	<InteractiveSection
		number="6.2"
		title="Croissance d'une forêt"
		onInteract={tracker.trackInteraction}
	>
		<DeferredDemo load={() => import('$lib/components/demos/ForestGrowthAnimation.svelte')} />
	</InteractiveSection>

	<!-- ═══════════════════════════════════════════════ -->
	<!-- Section 3 : Choix des hyperparamètres m → √d -->
	<!-- ═══════════════════════════════════════════════ -->
	<TheorySection>
		<h2 id="choix-features">Choix du nombre de features par division</h2>

		<p>
			L'hyperparamètre <KatexInline formula={mSym} /> est le levier principal du Random Forest. Le Théorème
			6.1 nous dit que réduire <KatexInline formula={mSym} /> réduit <KatexInline
				formula={rhoBar}
			/>, et donc la variance asymptotique de l'ensemble — mais cette relation n'est pas gratuite :
			un <KatexInline formula={mSym} /> trop petit prive chaque division de features réellement informatives,
			augmentant le <strong>biais</strong> individuel de chaque arbre. Les règles empiriques suivantes
			reflètent cet arbitrage biais/décorrélation, et sont largement adoptées :
		</p>

		<DefinitionBlock number="6.4" title="Règles empiriques pour m">
			<ul>
				<li>
					<strong>Classification :</strong>
					<KatexInline formula={mSym} /> = <KatexInline formula={sqrtD} />, où <KatexInline
						formula={dSym}
					/> est le nombre total de features
				</li>
				<li>
					<strong>Régression :</strong>
					<KatexInline formula={mSym} /> ≈ <KatexInline formula={dOver3} />
				</li>
			</ul>

			<p>
				Ces valeurs offrent un bon compromis entre diversité (plus petite <KatexInline
					formula={mSym}
				/>, donc <KatexInline formula={rhoBar} /> plus faible) et qualité individuelle des divisions (plus
				grande <KatexInline formula={mSym} />, donc biais plus faible). La règle
				<KatexInline formula={sqrtD} /> pour la classification vient du fait que dans un problème à <KatexInline
					formula={dSym}
				/> features, le nombre de sous-espaces de taille <KatexInline formula={mSym} /> croît très rapidement
				avec <KatexInline formula={mSym} />, et <KatexInline formula={sqrtD} /> offre empiriquement le
				meilleur point d'équilibre entre explorer suffisamment de sous-espaces distincts et garder chaque
				division localement pertinente.
			</p>
		</DefinitionBlock>

		<Callout type="intuition" title="Pourquoi √d ?">
			<p>
				L'idée heuristique est que <KatexInline formula={sqrtD} /> donne à chaque nœud suffisamment de
				choix pour trouver une bonne division, mais assez peu de features pour forcer la diversité entre
				arbres. Quand les features sont corrélées entre elles, réduire <KatexInline
					formula={mSym}
				/> amplifie encore plus l'effet de décorrélation entre arbres (au sens du <KatexInline
					formula={rhoBar}
				/> du Théorème 6.1) : sélectionner un petit sous-ensemble augmente la probabilité que différentes
				combinaisons de features corrélées soient retenues d'un arbre à l'autre.
			</p>
		</Callout>

		<p>
			On peut résumer l'arbitrage complet en une seule expression qualitative pour l'erreur de test
			en fonction de <KatexInline formula={mSym} /> :
		</p>

		<KatexBlock formula={errTestFormula} />

		<ExampleBlock number="6.4.1" title="Cas extrême : une seule feature vraiment informative">
			<p>
				Supposons que, parmi <KatexInline formula="d = 100" /> features, une seule, disons <KatexInline
					formula="x_1"
				/>, soit fortement prédictive, les 99 autres n'étant que du bruit. Avec le bagging pur (<KatexInline
					formula="m = d"
				/>), <KatexInline formula="x_1" /> est choisie à la racine de <strong>presque tous</strong>
				les arbres (elle offre systématiquement le meilleur gain d'impureté) : les arbres sont donc structurellement
				très similaires près de la racine, et <KatexInline formula={rhoBar} />
				reste élevé malgré le bootstrap.
			</p>
			<p>
				Avec <KatexInline formula="m = \sqrt{100} = 10" />, chaque nœud n'a qu'environ <KatexInline
					formula="10/100 = 10\%"
				/> de chances de voir <KatexInline formula="x_1" /> parmi les features candidates. Dans les 90%
				de nœuds restants, l'arbre est forcé de diviser sur une combinaison des 99 features bruitées restantes
				— ce qui semble à première vue dégrader chaque arbre individuellement, mais décorrèle fortement
				les arbres entre eux. C'est un cas où le compromis biais/décorrélation du Théorème 6.1 penche
				très fortement en faveur d'un petit <KatexInline formula={mSym} /> : la perte de qualité individuelle
				est largement compensée par la chute de <KatexInline formula={rhoBar} />.
			</p>
		</ExampleBlock>
	</TheorySection>

	<!-- <InteractiveSection tag="Exploration des sous-ensembles">
		<DeferredDemo load={() => import('$lib/components/demos/FeatureSubsetExplorer.svelte')} />
	</InteractiveSection> -->

	<!-- ═══════════════════════════════════════════════ -->
	<!-- Section 4 : Importance des features -->
	<!-- ═══════════════════════════════════════════════ -->
	<TheorySection>
		<h2 id="importance">Estimation de l'importance des variables</h2>

		<p>
			L'un des atouts majeurs du Random Forest est sa capacité à fournir une mesure d'<strong
				>importance des features</strong
			>
			de manière naturelle — un sous-produit direct de l'algorithme, sans calcul supplémentaire coûteux.
			Deux méthodes principales sont utilisées, avec des propriétés statistiques très différentes.
		</p>

		<h3>Diminution moyenne de l'impureté (Mean Decrease Impurity)</h3>

		<p>
			Pour chaque arbre, on enregistre la réduction d'impureté <KatexInline
				formula={String.raw`\Delta\text{Impureté}_t`}
			/> (Définition 6.2) apportée par chaque division. En moyennant cette contribution sur tous les arbres
			de la forêt et en la regroupant par feature, on obtient un score :
		</p>

		<KatexBlock formula={importanceImpurityFormula} />

		<p>
			Cette méthode est rapide car elle utilise les informations déjà calculées pendant
			l'entraînement — aucun passage supplémentaire sur les données n'est nécessaire. Elle est
			toutefois <strong>biaisée</strong> en faveur des features avec beaucoup de modalités ou celles utilisées
			dans les nœuds hauts (qui voient plus d'échantillons, et donc contribuent mécaniquement à des gains
			d'impureté cumulés plus élevés, indépendamment de leur pertinence réelle).
		</p>

		<h3>Importance par permutation</h3>

		<p>
			Pour chaque feature, on permute aléatoirement ses valeurs sur un ensemble de validation
			(détruisant ainsi toute association entre cette feature et la cible, tout en préservant les
			distributions marginales) et on mesure la dégradation de performance qui en résulte :
		</p>

		<KatexBlock formula={importancePermFormula} />

		<p>
			Où <KatexInline formula={pSym} /> est le nombre de permutations. Cette méthode est plus honnête
			car elle mesure directement l'impact de chaque feature sur la performance finale, indépendamment
			du processus de construction des arbres. Les features véritablement informatives verront leur permutation
			dégrader fortement les prédictions, puisque le modèle perd un signal réel ; les features non informatives
			ou redondantes ne changeront presque rien au score, même permutées.
		</p>

		<Callout type="warning" title="Attention au biais">
			<p>
				L'importance par impureté surévalue systématiquement les features continues et celles avec
				de nombreuses modalités — un artefact du critère de Gini lui-même (Définition 6.2), pas une
				propriété des données. L'importance par permutation est plus fiable statistiquement mais
				coûteuse en calcul (elle nécessite <KatexInline formula={pSym} /> réévaluations complètes du modèle
				par feature) — privilégiez-la pour la sélection de features critique, où un biais systématique
				aurait des conséquences importantes.
			</p>
		</Callout>
	</TheorySection>

	<InteractiveSection
		number="6.3"
		title="Importance des features"
		onInteract={tracker.trackInteraction}
	>
		<DeferredDemo load={() => import('$lib/components/demos/FeatureImportanceChart.svelte')} />
	</InteractiveSection>

	<!-- ═══════════════════════════════════════════════ -->
	<!-- Section 5 : Avantages et synthèse -->
	<!-- ═══════════════════════════════════════════════ -->
	<TheorySection>
		<h2 id="avantages">Avantages des Random Forest</h2>

		<p>
			Le Random Forest est l'un des algorithmes les plus utilisés en pratique grâce à plusieurs
			avantages majeurs, dont plusieurs découlent directement des résultats théoriques établis plus
			haut :
		</p>

		<div class="advantages-grid">
			<div class="advantage-card">
				<strong>✓ Performance prête à l'emploi</strong>
				Peu d'hyperparamètres à tuner. La valeur par défaut <KatexInline formula={mSym} /> = <KatexInline
					formula={sqrtD}
				/> (Définition 6.4) fonctionne bien dans la plupart des cas.
			</div>
			<div class="advantage-card">
				<strong>✓ Robuste au surajustement</strong>
				L'agrégation de nombreux arbres décorrélés (Théorème 6.1) rend le modèle naturellement régularisé,
				même avec des arbres profonds non-élagués.
			</div>
			<div class="advantage-card">
				<strong>✓ Données mixtes</strong>
				Gère simultanément variables catégorielles et numériques sans normalisation préalable — un héritage
				direct de la structure des arbres de décision individuels.
			</div>
			<div class="advantage-card">
				<strong>✓ Importance des variables</strong>
				Fournit automatiquement un classement d'importance (deux méthodes vues en Section 4), utile pour
				la sélection de features et l'interprétabilité.
			</div>
			<div class="advantage-card">
				<strong>✓ Estimation OOB</strong>
				Les échantillons hors-bag (environ 36,8% de chaque itération bootstrap, cf. la leçon
				précédente) fournissent
				une estimation gratuite de la performance sans validation croisée séparée.
			</div>
			<div class="advantage-card">
				<strong>✓ Parallélisation naturelle</strong>
				Chaque arbre s'entraîne indépendamment (Algorithme 6.1) — l'entraînement se parallélise parfaitement
				sur plusieurs cœurs.
			</div>
		</div>

		<TheoremBlock number="6.5" title="Convergence asymptotique du Random Forest">
			<p>
				Sous des hypothèses raisonnables (arbres complètement développés, <KatexInline
					formula="m < d"
				/>, données i.i.d.), l'erreur de généralisation du Random Forest converge vers l'erreur de
				Bayes quand le nombre d'arbres <KatexInline formula={mTreesSym} /> tend vers l'infini et la taille
				des données augmente.
			</p>
			<p>
				Ce résultat, démontré par Breiman (2001), repose sur deux propriétés complémentaires : la
				consistance des estimateurs individuels (chaque arbre, pris seul, converge vers une bonne
				approximation locale à mesure que la taille des données croît), et la décorrélation induite
				par la sélection aléatoire de features — formalisée précisément par le Théorème 6.1
				ci-dessus, qui garantit que la variance de l'ensemble reste bornée par <KatexInline
					formula="\bar\rho\,\sigma^2"
				/> plutôt que de stagner à la variance individuelle <KatexInline formula={sigmaSq} />.
			</p>
		</TheoremBlock>

		<ExercisePanel number="6.2" title="Random Forest vs Bagging pur">
			{#snippet solution()}
				<p>
					Avec <KatexInline formula="m = 3" /> (≈ <KatexInline formula="\sqrt{9}" />), chaque
					division ne voit que 3 features parmi 9 (Définition 6.3) — la diversité entre arbres est
					maximale, réduisant fortement <KatexInline formula={rhoBar} />. D'après le Théorème 6.1,
					la variance asymptotique de l'ensemble, <KatexInline formula="\bar\rho\,\sigma^2" />, est
					donc elle aussi fortement réduite. Avec <KatexInline formula="m = 9" />, on retrouve
					exactement le bagging pur (Définition 6.3 coïncide avec la Définition 6.2 quand <KatexInline
						formula="m=d"
					/>) : les features les plus prédictives dominent systématiquement, comme illustré dans
					l'Exemple 6.4.1, et les arbres restent corrélés comme en bagging classique — la variance
					asymptotique reste alors proche de <KatexInline formula={sigmaSq} /> tout entier, avec un gain
					d'agrégation beaucoup plus limité.
				</p>
			{/snippet}
			<p>
				On dispose d'un jeu de données avec 9 features. Pourquoi <KatexInline formula={mSym} /> = 3 est-il
				préférable à <KatexInline formula={mSym} /> = 9 ? Que se passe-t-il pour la corrélation entre
				arbres dans les deux cas ? Appuyez-vous sur le Théorème 6.1.
			</p>
		</ExercisePanel>

		<Callout type="summary" title="Retenir">
			<ul>
				<li>
					<strong>Motivation :</strong> Le bagging pur laisse les arbres corrélés (<KatexInline
						formula={rhoBar}
					/> élevé) — la sélection aléatoire de features à chaque nœud (Définition 6.3) résout ce problème
					en réduisant directement <KatexInline formula={rhoBar} />.
				</li>
				<li>
					<strong>Résultat clé :</strong> La variance de l'ensemble vaut <KatexInline
						formula="\bar\rho\sigma^2 + (1-\bar\rho)\sigma^2/M"
					/> (Théorème 6.1) — elle ne peut jamais descendre en dessous de <KatexInline
						formula="\bar\rho\sigma^2"
					/>, d'où l'intérêt de réduire <KatexInline formula={rhoBar} /> directement plutôt que de se
					reposer uniquement sur <KatexInline formula={mTreesSym} />.
				</li>
				<li>
					<strong>Algorithme :</strong> Bootstrap + sélection de <KatexInline formula={mSym} /> features
					aléatoires à chaque nœud (Algorithme 6.1) → agrégation par vote/moyenne.
				</li>
				<li>
					<strong>Règle pratique :</strong>
					<KatexInline formula={sqrtD} /> pour la classification, <KatexInline formula={dOver3} /> pour
					la régression (Définition 6.4) — un compromis entre biais individuel et décorrélation.
				</li>
				<li>
					<strong>Valeur ajoutée :</strong> Importance des features (impureté ou permutation, Section
					4), estimation OOB, robustesse naturelle au surajustement.
				</li>
			</ul>
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════════════ -->
	<!-- Bibliographie -->
	<!-- ═══════════════════════════════════════════════ -->
	<Bibliography>
		<BibElement
			authors={['Breiman, L.']}
			year={2001}
			title="Random Forests"
			journal="Machine Learning, 45(1), 5–32."
			link="https://doi.org/10.1023/A:1010933404324"
		/>
		<BibElement
			authors={['Geurts, P.', 'Ernst, D.', 'Wehenkel, L.']}
			year={2006}
			title="Extremely randomized trees"
			journal="Machine Learning, 63(1), 3–42."
			link="https://doi.org/10.1007/s10994-006-6226-1"
		/>
		<BibElement
			authors={['Louppe, G.', 'et al.']}
			year={2014}
			title="Understanding Random Forests: From Theory to Practice"
			journal="arXiv preprint arXiv:1407.7502."
			link="https://arxiv.org/abs/1407.7502"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.algo-block {
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 1rem 1.25rem;
		margin: 1.25rem 0;
	}

	.algo-block h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		color: var(--color-belief);
	}

	.algo-block ol,
	.algo-block ul {
		padding-left: 1.25rem;
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

	/* ─── Advantages grid ────────────── */
	.advantages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 0.75rem;
		margin: 1rem 0;
	}

	.advantage-card {
		padding: 0.75rem 1rem;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.advantage-card strong {
		display: block;
		color: var(--color-positive);
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	ul {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	li {
		margin-bottom: 0.25rem;
	}

	@media (max-width: 640px) {
		.advantages-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
