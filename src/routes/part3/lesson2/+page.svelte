<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import ConformalPredictionDemo from '$lib/components/demos/ConformalPredictionDemo.svelte';
	import ConformityScoreComparison from '$lib/components/demos/ConformityScoreComparison.svelte';
	import QuantileThresholdVisualizer from '$lib/components/demos/QuantileThresholdVisualizer.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getNextPage, getPrevPage, type PageMeta } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';

	const meta = getPageByPath('/part3/lesson2');
	const tracker = createPageTracker(meta as PageMeta);
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	interface TocEntry {
		id: string;
		label: string;
		description: string;
		color: 'epistemic' | 'positive' | 'neutral' | 'belief' | 'surprise' | 'agent';
	}

	const tocEntries: TocEntry[] = [
		{
			id: 'algo-conformal',
			label: 'Algorithme de prédiction conformelle',
			description: 'Split de calibration et scores',
			color: 'epistemic'
		},
		{
			id: 'garantie-couverture',
			label: 'Garantie de couverture',
			description: 'Échangeabilité et validité',
			color: 'belief'
		},
		{
			id: 'score-rang',
			label: 'Score de non-conformité par rang',
			description: 'Lien avec le Top-K',
			color: 'positive'
		},
		{
			id: 'oracle-dual',
			label: 'Le prédicteur oracle et le dual du Top-K',
			description: 'Optimalité et ensemble de niveau',
			color: 'surprise'
		},
		{
			id: 'scores-probabilistes',
			label: 'Scores de non-conformité probabilistes',
			description: 'APS et scores 1-p',
			color: 'neutral'
		},
		{
			id: 'seuil-quantile',
			label: 'Le seuil quantile',
			description: 'Calcul du quantile de calibration',
			color: 'epistemic'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'Récapitulatif sur la prédiction conformelle',
			color: 'neutral'
		}
	];

	// ─── Formula constants ─────────────────────────────
	// NOTE: curly braces here do NOT need backslash-escaping. Svelte's brace-parsing only
	// applies inside markup, never inside <script> blocks — these are plain JS template
	// strings. `\{` / `\}` in KaTeX renders a literal brace *glyph*; it does not open/close
	// a TeX group. Escaping the grouping braces of \mathcal{}, \text{}, \hat{}, \mathbb{}
	// broke every one of these formulas (e.g. \mathcal\{X\} does NOT pass X to \mathcal).
	// Braces are only escaped below where a literal { } glyph is genuinely intended
	// (set-builder notation, \big\{ ... \big\}).
	const F_SCORE_DEF = String.raw`s: \mathcal{X} \times \mathcal{Y} \to \mathbb{R}`;
	const F_DTRAIN = String.raw`\mathcal{D}_{\text{train}}`;
	const F_DCAL = String.raw`\mathcal{D}_{\text{cal}} = \{(X_i, Y_i)\}_{i=1}^n`;
	const F_HAT_F = String.raw`\hat{f}`;
	const F_SI = String.raw`S_i = s(X_i, Y_i) \quad \text{pour } i = 1, \dots, n`;
	const F_PRED_SET = String.raw`\mathcal{C}(x) = \big\{ y \in \mathcal{Y} \;:\; s(x, y) \leq \hat{q} \big\}`;
	const F_HAT_Q = String.raw`\hat{q}`;
	const F_K_INDEX = String.raw`\lceil (n+1)(1-\alpha) \rceil`;
	const F_SCORES = String.raw`\{S_i\}`;
	const F_EXCH_DATA = String.raw`(X_1, Y_1), \dots, (X_n, Y_n), (X, Y)`;
	const F_COVERAGE_THEOREM = String.raw`\mathbb{P}\big(Y \in \mathcal{C}(X)\big) \geq 1 - \alpha`;
	const F_COVERAGE_UPPER = String.raw`1 - \alpha \;\leq\; \mathbb{P}\big(Y \in \mathcal{C}(X)\big) \;\leq\; 1 - \alpha + \frac{1}{n+1}`;
	const F_COND_COVERAGE_WANTED = String.raw`\mathbb{P}\big(Y \in \mathcal{C}(X) \;\big|\; X = x\big) \geq 1 - \alpha \quad \text{pour (presque) tout } x`;
	const F_RANK_SCORE = String.raw`s(x, y) = \text{rang de } y \text{ parmi les classes, triées par } \hat{p} \text{ décroissant}`;
	const F_1MINUSP = String.raw`s(x, y) = 1 - \hat{p}_y(x)`;
	const F_CUMULATIVE = String.raw`s(x, y) = 1 - \sum_{j \,:\, \hat{p}_j(x) \geq \hat{p}_y(x)} \hat{p}_j(x)`;
	const F_QUANTILE_BLOCK = String.raw`\hat{q} = \text{sorted\_scores}\big[\, \lceil (n+1)(1-\alpha) \rceil - 1 \,\big]`;
	const F_ETA = String.raw`\eta_c(x) = \mathbb{P}(Y = c \mid X = x)`;
	const F_ORACLE_SCORE = String.raw`s^*(x, y) = 1 - \eta_y(x)`;
	const F_ORACLE_SET = String.raw`\mathcal{C}^*(x) = \{\, y \;:\; \eta_y(x) \geq t^* \,\}`;
	const F_ORACLE_COVERAGE = String.raw`\mathbb{P}\big(\eta_Y(X) \geq t^*\big) = 1 - \alpha`;
	const F_TOPK_DUAL = String.raw`\underbrace{\max_{|S|=K} \sum_{c \in S} \eta_c(x)}_{\text{Top-}K} \qquad \longleftrightarrow \qquad \underbrace{\min_{S \,:\, \sum_{c \in S} \eta_c(x) \geq 1-\alpha} |S|}_{\text{ensemble conforme oracle}}`;
</script>

<svelte:head>
	<title>{meta?.title ?? 'Prédiction conformelle'} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Prédiction conformelle'}
	subtitle="Garantir la couverture par scores de non-conformité, calibration et seuils quantiles"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ═══════════ Introduction ═══════════ -->
	<TheorySection>
		<TableOfContents entries={tocEntries} />
		<p>
			La classification Top-K précédente retourne un ensemble de taille fixe. La
			<strong>prédiction conformelle</strong> va plus loin : elle construit des ensembles de
			prédiction avec une <em>garantie théorique rigoureuse</em> sur la couverture de la vraie
			étiquette, et ce <strong>sans hypothèse paramétrique</strong> sur le modèle sous-jacent.
		</p>

		<p>
			L'idée centrale est simple : utiliser un ensemble de calibration pour mesurer à quel point
			chaque paire (prédiction, étiquette) est <em>atypique</em> vis-à-vis du modèle appris, puis
			employer cette mesure pour décider quelles classes inclure dans l'ensemble de prédiction d'un
			nouvel échantillon. La variante présentée ici — un unique ensemble de calibration, disjoint de
			l'entraînement — est la <strong>prédiction conformelle scindée</strong> (<em
				>split conformal</em
			>). Elle est nettement moins coûteuse que la version originale (<em>full conformal</em>, Vovk
			et al. 2005), qui réentraîne le modèle pour chaque étiquette candidate, au prix d'ensembles en
			général légèrement plus larges.
		</p>

		<Callout type="definition" title="Score de non-conformité">
			Un <strong>score de non-conformité</strong> (le terme standard de la littérature, cf. Vovk et
			al. 2005 — on parle parfois improprement de « score de conformité ») est une fonction
			<KatexInline formula={F_SCORE_DEF} />
			qui mesure à quel point une paire <KatexInline formula="(x, y)" /> est <em>atypique</em> pour
			le modèle appris. Plus le score est <em>faible</em>, plus la paire est conforme — le nom du
			score porte sur ce qu'il mesure (l'atypicité), pas sur le sens de l'échelle.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Algorithme ═══════════ -->
	<TheorySection>
		<h2 id="algo-conformal">Algorithme de prédiction conformelle</h2>

		<p>
			Soit un modèle entraîné sur
			<KatexInline formula={F_DTRAIN} />, et un ensemble indépendant de calibration
			<KatexInline formula={F_DCAL} />.
		</p>

		<ExpertPanel title="Algorithme pas à pas">
			<p>
				<strong>Étape 1 — Entraînement :</strong> Apprendre un classificateur
				<KatexInline formula={F_HAT_F} /> sur <KatexInline formula={F_DTRAIN} />.
			</p>
			<p>
				<strong>Étape 2 — Calibration :</strong> Calculer les scores de non-conformité sur
				<KatexInline formula={F_DCAL} /> :
			</p>
			<KatexBlock formula={F_SI} />
			<p>
				<strong>Étape 3 — Prédiction :</strong> Pour un nouvel échantillon
				<KatexInline formula="x" />, construire l'ensemble de prédiction :
			</p>
			<KatexBlock formula={F_PRED_SET} />
			<p>
				où <KatexInline formula={F_HAT_Q} /> est le quantile d'ordre
				<KatexInline formula={F_K_INDEX} /> des scores <KatexInline formula={F_SCORES} />.
			</p>
		</ExpertPanel>
	</TheorySection>

	<!-- ═══════════ Démo 10.1 — Pipeline animé ═══════════ -->
	<InteractiveSection
		number="10.1"
		title="Construction conforme pas à pas"
		onInteract={tracker.trackInteraction}
	>
		<ConformalPredictionDemo />
	</InteractiveSection>

	<!-- ═══════════ Garantie théorique ═══════════ -->
	<TheorySection>
		<h2 id="garantie-couverture">Garantie de couverture</h2>

		<Callout type="definition" title="Théorème — Garantie de couverture">
			Sous l'hypothèse
			<strong>d'échangeabilité</strong> (plus faible que i.i.d.) des données
			<KatexInline formula={F_EXCH_DATA} />, la prédiction conformelle garantit :
		</Callout>

		<KatexBlock formula={F_COVERAGE_THEOREM} />

		<p>
			Cette garantie est <strong>exacte en échantillon fini</strong> et
			<strong>model-free</strong> : elle ne repose sur aucune hypothèse sur la forme du classificateur.
			L'hypothèse d'échangeabilité signifie que la distribution jointe est invariante par permutation
			des observations.
		</p>

		<p>
			La borne inférieure n'est pas la seule information disponible : lorsque les scores
			<KatexInline formula={F_SCORES} /> sont presque sûrement distincts (typique avec des scores continus),
			la couverture est en fait <strong>encadrée</strong>, et pas seulement minorée :
		</p>

		<KatexBlock formula={F_COVERAGE_UPPER} />

		<p>
			Autrement dit, la méthode n'est pas seulement valide, elle est aussi <em>presque serrée</em> —
			elle ne sur-couvre pas de façon incontrôlée, à un terme en
			<KatexInline formula={String.raw`1/(n+1)`} /> près qui s'annule quand l'ensemble de calibration
			grandit.
		</p>

		<DefinitionBlock number="10.1" title="Couverture marginale vs. couverture conditionnelle">
			<p>
				Il faut lire <KatexInline formula={F_COVERAGE_THEOREM} /> précisément : la probabilité est prise
				sur le tirage conjoint de <KatexInline formula="(X, Y)" /> — c'est une garantie
				<strong>marginale</strong>, moyennée sur toute la population des <KatexInline
					formula="x"
				/>. Ce que l'on voudrait souvent, une garantie <strong>conditionnelle</strong> valable pour
				chaque <KatexInline formula="x" /> individuellement,
			</p>
			<KatexBlock formula={F_COND_COVERAGE_WANTED} />
			<p>
				n'est <strong>pas</strong> ce que le théorème fournit, et ne peut en général pas être
				obtenue sans hypothèse supplémentaire sur <KatexInline formula={String.raw`\hat{p}`} /> ou sur
				<KatexInline formula={String.raw`P`} /> : Foygel Barber, Candès, Ramdas &amp; Tibshirani (2021)
				montrent qu'aucune méthode distribution-free non triviale n'atteint la couverture conditionnelle
				exacte pour toute distribution continue de <KatexInline formula="X" />. En pratique, un
				ensemble peut donc sous-couvrir fortement sur certaines régions de
				<KatexInline formula="X" /> tout en respectant la moyenne globale — c'est précisément ce que les
				scores adaptatifs (section suivante) atténuent, sans l'éliminer complètement.
			</p>
		</DefinitionBlock>

		<Callout type="intuition" title="Quand l'échangeabilité tient-elle ?">
			Les données i.i.d. sont toujours échangeables. En pratique, on considère souvent l'hypothèse
			satisfaite si les données de calibration et de test proviennent d'une même distribution — mais
			c'est précisément ce qui échoue pour des données spatialement ou temporellement structurées :
			l'autocorrélation spatiale (typique en SDM) ou un déplacement de distribution dans le temps (<em
				>covariate shift</em
			>, dérive de concept) rompent l'échangeabilité, et la garantie de couverture n'est alors plus
			assurée telle quelle. Une série temporelle n'est échangeable que sous stationnarité stricte,
			une hypothèse forte et rarement vérifiée en pratique. La
			<strong>prédiction conformelle pondérée</strong> (Tibshirani, Barber, Candès &amp; Ramdas 2019)
			corrige la couverture sous covariate shift lorsque le ratio de densités est connu ou estimable ;
			l'extension à l'autocorrélation spatiale reste un axe de recherche actif.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Démo 10.3 — Vérification de la couverture ═══════════ -->
	<!-- <InteractiveSection tag="Démo 10.3">
		<CoverageVerifier />
	</InteractiveSection> -->

	<!-- ═══════════ Score de rang ═══════════ -->
	<TheorySection>
		<h2 id="score-rang">Score de non-conformité par rang</h2>

		<p>
			Le choix le plus naturel en classification est le <strong>rang de la vraie classe</strong>
			dans le classement par probabilité décroissante :
		</p>

		<KatexBlock formula={F_RANK_SCORE} />

		<Callout type="insight" title="Lien avec le Top-K">
			Avec ce score, la prédiction conformelle redonne exactement le <strong>Top-K validé</strong>
			de la leçon précédente. Si <KatexInline formula={F_HAT_Q} /> est le quantile choisi, alors
			<KatexInline formula={F_PRED_SET} /> contient les classes de rang
			<KatexInline formula={String.raw`\leq \hat{q}`} />.
		</Callout>

		<p>
			Ce score produit des ensembles discrets : la taille de
			<KatexInline formula={String.raw`\mathcal{C}(x)`} /> est un entier entre 1 et le nombre de classes.
			Il est particulièrement simple à interpréter mais peut être trop grossier quand les probabilités
			prédites contiennent plus d'information que le seul ordre.
		</p>
	</TheorySection>

	<!-- ═══════════ Le prédicteur oracle : lien avec η(x) ═══════════ -->
	<TheorySection>
		<h2 id="oracle-dual">Le prédicteur oracle et le dual du Top-K</h2>

		<p>
			On peut pousser le lien avec la leçon précédente jusqu'à sa forme la plus nette en se
			demandant : que ferait la prédiction conformelle si l'on connaissait la vraie probabilité
			conditionnelle <KatexInline formula={F_ETA} /> plutôt qu'une estimation
			<KatexInline formula={String.raw`\hat{p}`} /> ? C'est le régime <strong>oracle</strong> — la version
			population de la méthode, sans bruit d'estimation.
		</p>

		<p>
			Avec le score <KatexInline formula={F_ORACLE_SCORE} />, le seuil de calibration devient un
			seuil de probabilité <KatexInline formula="t^*" /> choisi pour que la masse
			<KatexInline formula={F_ORACLE_COVERAGE} /> exactement, et l'ensemble de prédiction oracle est un
			<strong>ensemble de niveau</strong>
			de <KatexInline formula={String.raw`\eta`} /> :
		</p>

		<KatexBlock formula={F_ORACLE_SET} />

		<Callout type="insight" title="Optimalité de l'ensemble de niveau">
			Sadinle, Lei &amp; Wasserman (2019) montrent que <KatexInline
				formula={String.raw`\mathcal{C}^*(x)`}
			/>
			n'est pas seulement valide : parmi <em>tous</em> les ensembles atteignant une couverture
			marginale d'au moins <KatexInline formula={String.raw`1-\alpha`} />, c'est celui qui
			<strong>minimise la taille moyenne</strong>
			<KatexInline formula={String.raw`\mathbb{E}[|\mathcal{C}(X)|]`} />. C'est l'exact pendant,
			côté couverture fixée, du résultat de la leçon précédente sur le Top-K à cardinalité fixée.
			Noter que cette optimalité, comme le théorème de couverture lui-même, est
			<strong>marginale</strong>
			— elle ne dit rien de la taille optimale conditionnelle à un <KatexInline formula="x" /> donné.
		</Callout>

		<p>
			Les deux problèmes sont en réalité <strong>duaux</strong> l'un de l'autre : le Top-K fixe la
			taille <KatexInline formula="K" /> et maximise la masse de probabilité captée ; l'ensemble conforme
			oracle fixe la masse cible
			<KatexInline formula={String.raw`1-\alpha`} /> et minimise la taille. Les deux solutions sont des
			ensembles de niveau de <KatexInline formula={String.raw`\eta(x)`} /> — seule la contrainte active
			change :
		</p>

		<KatexBlock formula={F_TOPK_DUAL} />

		<Callout type="warning" title="Validité contre efficacité">
			Ce régime oracle n'existe qu'en théorie : en pratique on remplace
			<KatexInline formula={String.raw`\eta`} /> par <KatexInline formula={String.raw`\hat{p}`} />,
			et le quantile empirique <KatexInline formula={F_HAT_Q} /> remplace le seuil
			<KatexInline formula="t^*" />. La force de la méthode est que la
			<strong>garantie de couverture</strong>
			tient <em>quel que soit</em>
			<KatexInline formula={String.raw`\hat{p}`} /> — même un modèle médiocre, voire aléatoire — car elle
			ne dépend que de l'échangeabilité des scores, pas de la qualité de <KatexInline
				formula={String.raw`\hat{p}`}
			/>. Ce que la qualité de
			<KatexInline formula={String.raw`\hat{p}`} /> détermine, c'est uniquement l'<strong
				>efficacité</strong
			>
			— la taille des ensembles obtenus, aussi proche ou non de celle de
			<KatexInline formula={String.raw`\mathcal{C}^*`} />. Un modèle mal calibré reste
			<em>valide</em> sous conformalisation, mais produit des ensembles inutilement larges.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Scores probabilistes ═══════════ -->
	<TheorySection>
		<h2 id="scores-probabilistes">Scores de non-conformité probabilistes</h2>

		<p>
			Pour exploiter l'information quantitative des probabilités, on peut utiliser des scores plus
			raffinés :
		</p>

		<Callout type="definition" title="Score 1-p̂">
			<KatexInline formula={F_1MINUSP} /> — Plus la probabilité de la vraie classe est élevée, plus le
			score est faible (plus conforme). C'est l'analogue empirique direct du score oracle
			<KatexInline formula={F_ORACLE_SCORE} /> introduit ci-dessus.
		</Callout>

		<Callout type="definition" title="Score cumulatif (APS)">
			<KatexInline formula={F_CUMULATIVE} /> — Somme des probabilités des classes au moins aussi probables
			que
			<KatexInline formula="y" />, puis complément à 1. C'est le score
			<strong>Adaptive Prediction Sets</strong> de Romano, Sesia &amp; Candès (2020), introduit
			précisément pour améliorer la couverture conditionnelle par rapport au score
			<KatexInline formula={F_1MINUSP} /> — sans l'atteindre exactement, pour la raison donnée plus haut
			(10.1).
		</Callout>

		<p>
			Ces scores produisent des ensembles de taille variable pour chaque échantillon. Ils permettent
			une adaptation fine : les échantillons pour lesquels le modèle est confiant auront des
			ensembles petits, tandis que les échantillons ambigus recevront des ensembles plus larges.
		</p>
	</TheorySection>

	<!-- ═══════════ Démo 10.2 — Comparaison des scores ═══════════ -->
	<InteractiveSection
		number="10.2"
		title="Séries de confiance"
		onInteract={tracker.trackInteraction}
	>
		<ConformityScoreComparison />
	</InteractiveSection>

	<!-- ═══════════ Le quantile ═══════════ -->
	<TheorySection>
		<h2 id="seuil-quantile">Le seuil quantile</h2>

		<p>
			Le paramètre critique de la méthode est le <strong>quantile</strong>
			<KatexInline formula={F_HAT_Q} /> des scores de calibration. Il détermine directement la taille
			des ensembles de prédiction : un seuil élevé inclut plus de classes, un seuil bas les restreint.
		</p>

		<KatexBlock formula={F_QUANTILE_BLOCK} />

		<p>
			Le niveau de signification
			<KatexInline formula="\alpha" /> contrôle le compromis :
			<KatexInline formula="\alpha = 0.1" /> garantit une couverture d'au moins 90 %, mais produit des
			ensembles plus larges. Un
			<KatexInline formula="\alpha" /> plus petit (p. ex. 0.01) fournit une garantie plus forte (99 %)
			mais au prix d'ensembles souvent triviaux.
		</p>

		<Callout type="warning" title="Petits échantillons de calibration">
			Lorsque l'ensemble de calibration est petit, la garantie théorique reste exacte mais les
			ensembles de prédiction peuvent être plus larges que nécessaire. La précision empirique
			converge vers la garantie théorique lorsque la taille de calibration augmente.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Démo 10.4 — Visualisation du quantile ═══════════ -->
	<InteractiveSection
		number="10.4"
		title="L'effet du niveau de confiance"
		onInteract={tracker.trackInteraction}
	>
		<QuantileThresholdVisualizer />
	</InteractiveSection>

	<!-- ═══════════ Synthèse ═══════════ -->
	<TheorySection>
		<h2 id="synthese">Synthèse</h2>

		<p>
			La prédiction conformelle transforme un classificateur standard en un dispositif de
			<strong>prédiction d'ensembles</strong> avec garantie probabiliste <em>marginale</em>. Les
			trois ingrédients essentiels sont :
		</p>

		<ul>
			<li>
				Un <strong>score de non-conformité</strong> qui mesure à quel point (x, y) est atypique
			</li>
			<li>Un <strong>ensemble de calibration</strong> indépendant pour estimer le seuil</li>
			<li>Un <strong>quantile</strong> qui garantit la couverture à un niveau choisi</li>
		</ul>

		<p>
			Le choix du score influence la taille des ensembles et leur adaptativité : le score de rang
			produit des ensembles discrets (Top-K), tandis que les scores probabilistes comme l'APS
			adaptent la taille à chaque échantillon, se rapprochant — sans l'atteindre — de la couverture
			conditionnelle. Dans les deux cas, la structure sous-jacente est la même : un ensemble de
			niveau de
			<KatexInline formula={String.raw`\eta(x)`} />, contrainte soit par sa cardinalité (Top-K),
			soit par sa couverture (conforme). La différence entre les deux leçons n'est donc pas de
			nature, mais de <em>quelle contrainte on fixe</em> — et la prédiction conformelle a l'avantage
			de rester valide même quand <KatexInline formula={String.raw`\eta`} /> est mal estimée, à condition
			que l'échangeabilité tienne. La méthode s'étend naturellement à la régression, où elle produit des
			<strong>intervalles de prédiction</strong> — comme nous le verrons dans la prochaine leçon.
		</p>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Angelopoulos, A. N.', 'Bates, S.']}
			year={2021}
			title="A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification"
			journal="arXiv preprint arXiv:2107.07511."
			link="https://arxiv.org/abs/2107.07511"
		/>
		<BibElement
			authors={['Vovk, V.', 'Gammerman, A.', 'Shafer, G.']}
			year={2005}
			title="Algorithmic Learning in a Random World"
			journal="Springer."
			link="https://doi.org/10.1007/b106715"
		/>
		<BibElement
			authors={['Sadinle, M.', 'Lei, J.', 'Wasserman, L.']}
			year={2019}
			title="Least Ambiguous Set-Valued Classifiers With Bounded Error Levels"
			journal="Journal of the American Statistical Association, 114(525), 223–234."
			link="https://arxiv.org/abs/1609.00451"
		/>
		<BibElement
			authors={['Romano, Y.', 'Sesia, M.', 'Candès, E.']}
			year={2020}
			title="Classification with Valid and Adaptive Coverage"
			journal="Advances in Neural Information Processing Systems (NeurIPS)."
			link="https://arxiv.org/abs/2006.02544"
		/>
		<BibElement
			authors={['Barber, R.F.', 'Candès, E.J.', 'Ramdas, A.', 'Tibshirani, R.J.']}
			year={2021}
			title="The Limits of Distribution-Free Conditional Predictive Inference"
			journal="Information and Inference: A Journal of the IMA, 10(2), 455–482."
			link="https://arxiv.org/abs/1903.04684"
		/>
		<BibElement
			authors={['Tibshirani, R.J.', 'Barber, R.F.', 'Candès, E.J.', 'Ramdas, A.']}
			year={2019}
			title="Conformal Prediction Under Covariate Shift"
			journal="Advances in Neural Information Processing Systems (NeurIPS)."
			link="https://arxiv.org/abs/1904.06019"
		/>
	</Bibliography>
</PageTemplate>
