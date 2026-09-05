<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import PredictionIntervalVisualizer from '$lib/components/demos/PredictionIntervalVisualizer.svelte';
	import AdaptiveIntervalDemo from '$lib/components/demos/AdaptiveIntervalDemo.svelte';
	import BootstrapUncertainty from '$lib/components/demos/BootstrapUncertainty.svelte';
	import IntervalQualityDashboard from '$lib/components/demos/IntervalQualityDashboard.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Quiz, { type QuizItem } from '$lib/components/narrative/Quiz.svelte';

	const meta = getPageByPath('/part5/lesson3');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question:
				"Pour les intervalles de largeur constante, quel est le score de non-conformité et quelle est la forme de l'ensemble de prédiction ?",
			options: [
				'Score |y - f(x)| / (sigma(x) + epsilon) : intervalle de largeur variable selon x.',
				'Score |y - f(x)| : intervalle [f(x) - q, f(x) + q] de largeur identique en tout point de prédiction.',
				'Score f(x) - y : intervalle asymétrique centré en zéro.',
				'Score 1 - p_y(x) : ensemble de cardinalité variable.'
			],
			answerIndex: 1,
			explanation:
				"Le score est la valeur absolue du résidu ; le quantile q des résidus absolus sur l'ensemble de calibration donne un intervalle symétrique centré sur la prédiction du modèle, avec la même « marge d'erreur » pour tous les points, indépendamment de x (section « Intervalles de largeur constante »)."
		},
		{
			question:
				"Selon la leçon, quand l'intervalle constant est-il une bonne approximation de l'ensemble oracle (région de densité maximale) ?",
			options: [
				'Quand le modèle est suffisamment complexe, quelle que soit la structure des erreurs.',
				'Quand la densité de Y sachant X est multimodale.',
				"Quand l'ensemble de calibration est petit, car le quantile q est alors plus robuste.",
				"Quand la largeur oracle ne dépend pas de x, c'est-à-dire sous homoscédasticité."
			],
			answerIndex: 3,
			explanation:
				"Le cartouche d'avertissement « Ce que l'oracle révèle sur l'intervalle constant » est explicite : dès que la largeur de la région de densité maximale varie avec x, l'intervalle constant est nécessairement trop large à certains endroits et trop étroit à d'autres — il n'approxime l'oracle que si la largeur ne dépend pas de x, précisément la condition d'homoscédasticité."
		},
		{
			question:
				'En régression quantile conforme (CQR), pourquoi corrige-t-on la paire de quantiles appris par une calibration conforme ?',
			options: [
				"Parce que rien ne garantit, en échantillon fini, que les quantiles appris couvrent exactement 1 - alpha ; l'étape conforme mesure cette erreur de calibration et la corrige par un décalage uniforme Q.",
				"Parce que la régression quantile n'est pas un problème convexe et ne peut pas être optimisée.",
				"Parce que l'étape conforme augmente la largeur moyenne afin de rendre la méthode robuste.",
				'Parce que les quantiles appris sont biaisés vers la moyenne conditionnelle.'
			],
			answerIndex: 0,
			explanation:
				"Le cartouche « Pourquoi corriger une régression quantile déjà entraînée ? » explique que les quantiles estimés sont eux-mêmes des approximations : l'étape de calibration mesure l'écart sur des données indépendantes et le corrige par un décalage uniforme Q, combinant la forme adaptative de la régression quantile et la garantie exacte de la prédiction conforme, quelle que soit la qualité des quantiles."
		},
		{
			question:
				'En CQR, le score s(x, y) = max(q_lo(x) - y, y - q_hi(x)) est de quel signe, et que mesure-t-il ?',
			options: [
				"Toujours positif, il mesure la distance au bord le plus proche de l'intervalle.",
				"Positif quand y est hors de l'intervalle estimé (dépassement), négatif quand y est à l'intérieur (marge restante).",
				"Négatif quand y est hors de l'intervalle estimé, positif quand y est à l'intérieur.",
				"Il mesure l'incertitude locale sigma(x) du modèle."
			],
			answerIndex: 1,
			explanation:
				"La leçon définit un score signé de dépassement : positif et mesurant le dépassement si y tombe hors de l'intervalle [q_lo(x), q_hi(x)], négatif et mesurant la marge restante s'il tombe à l'intérieur (section « Régression quantile conforme (CQR) »)."
		},
		{
			question:
				"Une méthode respecte la couverture empirique 1 - alpha sur l'ensemble de test, mais la couverture échoue systématiquement dans une région de l'espace d'entrée. Quel indicateur d'évaluation détecte ce problème ?",
			options: [
				'La largeur moyenne des intervalles.',
				'Le taux de couverture empirique.',
				"L'efficacité conditionnelle, qui vérifie l'homogénéité de la couverture à travers les régions de l'espace d'entrée.",
				"Le quantile conforme Q calculé sur l'ensemble de calibration."
			],
			answerIndex: 2,
			explanation:
				"La section « Évaluation des intervalles de prédiction » définit l'efficacité conditionnelle comme la vérification que la couverture ne dépend pas excessivement des valeurs de X : c'est l'indicateur subtil qui détecte les échecs locaux que la couverture marginale — celle garantie par le théorème — ne peut pas voir."
		}
	];
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	interface TocEntry {
		id: string;
		label: string;
		description: string;
		color: 'epistemic' | 'positive' | 'neutral' | 'belief' | 'surprise' | 'agent';
	}

	const tocEntries: TocEntry[] = [
		{
			id: 'intervalles-constants',
			label: 'Intervalles de largeur constante',
			description: 'Fondements et intuition',
			color: 'neutral'
		},
		{
			id: 'impl-constants',
			label: 'Implémentation des intervalles constants',
			description: 'Algorithme pas à pas',
			color: 'epistemic'
		},
		{
			id: 'regime-oracle',
			label: 'Le régime oracle : régions de densité maximale',
			description: "L'optimalité théorique",
			color: 'belief'
		},
		{
			id: 'intervalles-adaptatifs',
			label: 'Intervalles adaptatifs',
			description: "Adaptation à l'hétéroscédasticité",
			color: 'positive'
		},
		{
			id: 'incertitude-locale',
			label: "Estimation de l'incertitude locale",
			description: 'Bootstrap et variance locale',
			color: 'surprise'
		},
		{
			id: 'cqr',
			label: 'Régression quantile conforme (CQR)',
			description: 'Correction des quantiles entraînés',
			color: 'epistemic'
		},
		{
			id: 'evaluation-intervalles',
			label: 'Évaluation des intervalles de prédiction',
			description: 'Métriques de couverture et de largeur',
			color: 'neutral'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'Récapitulatif sur la régression conformelle',
			color: 'neutral'
		}
	];

	// ─── Formula constants ─────────────────────────────
	// Same fix as the previous two lessons: curly braces inside <script> are never
	// touched by Svelte's brace-parsing (that only applies to markup), so escaping the
	// grouping braces of \mathcal{}, \hat{}, \mathbb{} was pure breakage — \mathcal\{C\}
	// does not pass C as an argument to \mathcal, it prints a literal brace glyph.
	const F_OBJECTIVE = String.raw`\mathcal{C}(x) = [a(x), b(x)]`;
	const F_COVERAGE = String.raw`\mathbb{P}(Y \in [a(X), b(X)]) \geq 1 - \alpha`;
	const F_HAT_F = String.raw`\hat{f}`;
	const F_SCORE_CONSTANT = String.raw`s(x, y) = |y - \hat{f}(x)|`;
	const F_INTERVAL = String.raw`\mathcal{C}(x) = [\hat{f}(x) - q, \hat{f}(x) + q]`;
	const F_SCORE_ADAPTIVE = String.raw`s(x, y) = \frac{|y - \hat{f}(x)|}{\sigma(x) + \varepsilon}`;
	const F_COVERAGE_RATE = String.raw`\frac{1}{n} \sum_{i=1}^{n} \mathbb{1}[y_i \in [a(x_i), b(x_i)]]`;
	const F_AVG_WIDTH = String.raw`\frac{1}{n} \sum_{i=1}^{n} (b(x_i) - a(x_i))`;
	const F_SIGMA = String.raw`\sigma(x)`;
	const F_EPSILON = String.raw`\varepsilon > 0`;

	// ─── New: oracle / density-level-set formalism ─────
	const F_DENSITY = String.raw`f_{Y \mid X}(y \mid x)`;
	const F_ORACLE_HDR = String.raw`\mathcal{C}^*(x) = \{\, y \;:\; f_{Y \mid X}(y \mid x) \geq t(x) \,\}`;
	const F_ORACLE_HDR_MASS = String.raw`\int_{\mathcal{C}^*(x)} f_{Y \mid X}(y \mid x) \, dy = 1 - \alpha`;
	const F_QUANTILE_FUNC = String.raw`Q_{Y \mid X}(\tau \mid x) = \inf\{\, y \;:\; F_{Y \mid X}(y \mid x) \geq \tau \,\}`;
	const F_SYMMETRIC_ORACLE = String.raw`\mathcal{C}^*(x) = \big[\, Q_{Y \mid X}(\alpha/2 \mid x), \; Q_{Y \mid X}(1 - \alpha/2 \mid x) \,\big]`;

	// ─── New: conformalized quantile regression (CQR) ──
	const F_QLO_QHI = String.raw`\hat{q}_{lo}(x), \; \hat{q}_{hi}(x)`;
	const F_CQR_SCORE = String.raw`s(x, y) = \max\big(\hat{q}_{lo}(x) - y, \; y - \hat{q}_{hi}(x)\big)`;
	const F_CQR_INTERVAL = String.raw`\mathcal{C}(x) = \big[\, \hat{q}_{lo}(x) - Q, \; \hat{q}_{hi}(x) + Q \,\big]`;
</script>

<svelte:head>
	<title>{meta?.title ?? 'Intervalles de prédiction'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Intervalles de prédiction'}
	subtitle="Construire des intervalles fiables : largeur constante, adaptation locale et régression quantile conforme"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ═══════════ Introduction ═══════════ -->
	<TheorySection>
		<TableOfContents entries={tocEntries} />
		<p>
			La prédiction conformelle en classification construit des ensembles de classes à partir de
			<KatexInline formula={String.raw`\eta_c(x) = \mathbb{P}(Y = c \mid X = x)`} />. En
			<strong>régression</strong>, <KatexInline formula="Y" /> est continue : il n'y a plus de classes
			à énumérer, mais l'objet théorique sous-jacent joue exactement le même rôle. C'est la
			<strong>densité conditionnelle</strong>
			<KatexInline formula={F_DENSITY} /> — l'analogue continu de <KatexInline
				formula="\eta_c(x)"
			/>. Un <strong>intervalle de prédiction</strong>
			<KatexInline formula={F_OBJECTIVE} /> remplace l'ensemble de classes, avec la même exigence : contenir
			la valeur vraie de <KatexInline formula="Y" /> avec une garantie probabiliste.
		</p>

		<p>
			L'objectif est double : garantir que l'intervalle couvre la valeur réelle avec une probabilité
			suffisante, tout en le rendant le plus <em>étroit possible</em>. Ce compromis entre couverture
			et précision définit toute la richesse de la régression conformelle.
		</p>

		<Callout type="definition" title="Objectif en régression conformelle">
			Construire <KatexInline formula={F_OBJECTIVE} /> tel que :
			<KatexBlock formula={F_COVERAGE} />
			L'intervalle doit être le plus <em>petit possible</em> tout en respectant la contrainte de couverture.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Intervalles de largeur constante ═══════════ -->
	<TheorySection>
		<h2 id="intervalles-constants">Intervalles de largeur constante</h2>

		<p>
			L'approche la plus simple utilise un score de conformité basé sur l'<strong
				>erreur absolue</strong
			>
			entre la prédiction du modèle et la valeur observée. L'idée est intuitive : plus une observation
			s'est éloignée de la prédiction, moins elle est « conforme » au modèle.
		</p>

		<Callout type="definition" title="Score de conformité constant">
			Le score de conformité est la valeur absolue du résidu :
			<KatexBlock formula={F_SCORE_CONSTANT} />
			L'ensemble de prédiction devient alors un intervalle symétrique centré sur la prédiction :
			<KatexBlock formula={F_INTERVAL} />
			où <KatexInline formula="q" /> est le quantile d'ordre approprié des résidus absolus sur l'ensemble
			de calibration.
		</Callout>

		<p>
			Ce score produit des intervalles de <strong>largeur constante</strong> — indépendante du point de
			prédiction. En d'autres termes, chaque prédiction bénéficie de la même « marge d'erreur », calibrée
			davantage par les pires cas observés sur l'ensemble de calibration. Cette simplicité est à la fois
			un avantage (robustesse, facilité de mise en œuvre) et une limitation (aucune adaptation locale).
		</p>

		<Callout type="intuition" title="Quand les intervalles constants suffisent-ils ?">
			Les intervalles de largeur constante sont appropriés lorsque la variance des erreurs est
			<strong>homoscédastique</strong> — c'est-à-dire que la dispersion des résidus est uniforme dans
			tout l'espace d'entrée. C'est souvent le cas pour des données bien prétraitées ou des modèles linéaires
			sur des variables gaussiennes.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Démo 11.1 — Visualisation des intervalles ═══════════ -->
	<InteractiveSection
		number="11.1"
		title="Visualisation des intervalles"
		onInteract={tracker.trackInteraction}
	>
		<PredictionIntervalVisualizer />
	</InteractiveSection>

	<!-- ═══════════ Implémentation des intervalles constants ═══════════ -->
	<TheorySection>
		<h2 id="impl-constants">Implémentation des intervalles constants</h2>

		<p>
			L'algorithme se décompose en trois étapes nettes, directement calquées sur le cadre général de
			la prédiction conformelle.
		</p>

		<ExpertPanel title="Algorithme pas à pas">
			<p>
				<strong>Étape 1 — Entraînement :</strong> Apprendre un régresseur
				<KatexInline formula={F_HAT_F} /> sur les données d'entraînement.
			</p>
			<p>
				<strong>Étape 2 — Calibration :</strong> Sur l'ensemble de calibration, calculer les résidus
				absolus <KatexInline formula={F_SCORE_CONSTANT} /> pour chaque observation, puis extraire le quantile
				<KatexInline formula="q" /> correspondant au niveau de confiance <KatexInline
					formula="1 - \alpha"
				/>.
			</p>
			<p>
				<strong>Étape 3 — Prédiction :</strong> Pour chaque nouvelle observation
				<KatexInline formula="x" />, retourner l'intervalle
				<KatexInline formula={F_INTERVAL} />.
			</p>
		</ExpertPanel>

		<p>
			En pratique, l'implémentation est très compacte. On calcule les résidus sur la calibration, on
			en tire le quantile approprié (avec l'ajustement classique pour garantir la couverture en
			échantillon fini), puis on applique ce seuil uniformément aux prédictions de test. La largeur
			d'intervalle est identique pour tous les points — d'où le nom « largeur constante ».
		</p>
	</TheorySection>

	<!-- ═══════════ Le régime oracle : régions de densité maximale ═══════════ -->
	<TheorySection>
		<h2 id="regime-oracle">Le régime oracle : régions de densité maximale</h2>

		<p>
			Comme en classification, il est instructif de se demander ce que ferait la méthode si l'on
			connaissait la vraie loi conditionnelle de <KatexInline formula="Y" /> plutôt qu'un modèle appris.
			Parmi <em>tous</em> les ensembles <KatexInline formula={String.raw`\mathcal{C}(x)`} /> de masse
			<KatexInline formula="1-\alpha" />, quel est le plus étroit ?
		</p>

		<p>
			Si <KatexInline formula={F_DENSITY} /> est unimodale, la réponse est géométriquement intuitive :
			pour une masse de probabilité fixée, la région la plus compacte est celle qui empile la densité
			la plus haute — une <strong>région de densité maximale</strong> (« highest density region »),
			c'est-à-dire un <strong>ensemble de niveau</strong> de la densité :
		</p>

		<KatexBlock formula={F_ORACLE_HDR} />

		<p>
			où le seuil <KatexInline formula="t(x)" /> est choisi pour que la masse capturée soit exactement
			<KatexInline formula="1-\alpha" /> :
		</p>

		<KatexBlock formula={F_ORACLE_HDR_MASS} />

		<Callout type="insight" title="Le même principe, trois fois">
			C'est exactement la structure rencontrée deux fois déjà : en classification à K fixé (leçon
			1), l'ensemble optimal était le niveau supérieur de <KatexInline formula="\eta(x)" /> ; en classification
			conforme (leçon 2), l'ensemble oracle à couverture fixée était de nouveau un niveau de <KatexInline
				formula="\eta(x)"
			/>. Ici, avec <KatexInline formula="Y" /> continue, c'est un niveau de <KatexInline
				formula={F_DENSITY}
			/>. La prédiction d'ensembles, en classification comme en régression, revient toujours à
			découper l'espace des sorties par un seuil sur une fonction de vraisemblance conditionnelle.
		</Callout>

		<p>
			Dans le cas particulier — fréquent en pratique — où <KatexInline formula={F_DENSITY} /> est symétrique
			et unimodale, la région de densité maximale coïncide avec l'intervalle centré sur les quantiles
			conditionnels symétriques. En notant la fonction quantile conditionnelle
		</p>

		<KatexBlock formula={F_QUANTILE_FUNC} />

		<p>l'intervalle oracle devient simplement :</p>

		<KatexBlock formula={F_SYMMETRIC_ORACLE} />

		<Callout type="warning" title="Ce que l'oracle révèle sur l'intervalle constant">
			L'intervalle constant de la section précédente,
			<KatexInline formula={F_INTERVAL} />, n'est une bonne approximation de
			<KatexInline formula={String.raw`{\mathcal{C}^*(x)`} /> que si la <em>largeur</em> de la
			région oracle,
			<KatexInline
				formula={String.raw`Q_{Y\mid X}(1-\alpha/2\mid x) - Q_{Y\mid X}(\alpha/2\mid x)`}
			/>, ne dépend pas de <KatexInline formula="x" /> — précisément la condition d'homoscédasticité évoquée
			plus haut. Dès que cette largeur varie avec <KatexInline formula="x" />, l'intervalle constant
			est nécessairement trop large à certains endroits et trop étroit à d'autres : il ne peut pas
			suivre un oracle dont la forme change d'un point à l'autre.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Intervalles adaptatifs ═══════════ -->
	<TheorySection>
		<h2 id="intervalles-adaptatifs">Intervalles adaptatifs</h2>

		<p>
			Les intervalles constants souffrent d'un défaut majeur : ils ne tiennent aucun compte de l'<em
				>incertitude locale</em
			> du modèle. Or, dans la plupart des situations réelles, certaines régions de l'espace d'entrée
			sont naturellement plus difficiles à prédire que d'autres. Un intervalle uniformément large gaspille
			de l'information dans les zones faciles, et reste insuffisant dans les zones difficiles.
		</p>

		<p>
			Les <strong>intervalles adaptatifs</strong> résolvent ce problème en normalisant l'erreur pour chaque
			point par une estimation de son incertitude locale :
		</p>

		<Callout type="definition" title="Score de conformité adaptatif">
			Le score est normalisé par l'incertitude locale :
			<KatexBlock formula={F_SCORE_ADAPTIVE} />
			où <KatexInline formula={F_SIGMA} /> est une estimation de l'incertitude locale et
			<KatexInline formula={F_EPSILON} /> évite la division par zéro.
		</Callout>

		<p>
			Le principe est simple : si le modèle prédit avec précision un point (faible incertitude
			locale), une erreur modérée sera fortement pénalisée et l'intervalle sera étroit. Si le modèle
			est incertain (forte variance locale), la même erreur sera considérée comme attendue et
			l'intervalle s'élargira. L'avantage est clair : les intervalles sont
			<strong>plus étroits dans les régions de forte confiance</strong> et
			<strong>plus larges dans les régions incertaines</strong>.
		</p>

		<Callout type="insight" title="Hétéroscédasticité">
			Lorsque la variance des résidus n'est pas constante — on dit que les données sont
			<strong>hétéroscédastiques</strong> — les intervalles adaptatifs sont nettement plus efficaces que
			les intervalles constants. Ils s'adaptent à la structure locale des erreurs au lieu d'appliquer
			une marge uniforme.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Démo 11.2 — Comparaison constant vs adaptatif ═══════════ -->
	<InteractiveSection
		number="11.2"
		title="Comparaison constant vs adaptatif"
		onInteract={tracker.trackInteraction}
	>
		<AdaptiveIntervalDemo />
	</InteractiveSection>

	<!-- ═══════════ Estimation de l'incertitude locale ═══════════ -->
	<TheorySection>
		<h2 id="incertitude-locale">Estimation de l'incertitude locale</h2>

		<p>
			L'utilisation du score adaptatif pose la question pratique : comment estimer
			<KatexInline formula={F_SIGMA} /> de manière fiable ? Plusieurs approches sont couramment employées,
			chacune avec ses propres compromis en termes de coût computationnel et de précision.
		</p>

		<ExpertPanel title="Méthodes d'estimation de σ(x)">
			<p>
				<strong>1. Bootstrap :</strong> Entraîner le modèle sur plusieurs échantillons bootstrap (rechantillonnage
				avec remise) et calculer l'écart-type des prédictions pour chaque point. Cette méthode capture
				directement la variabilité induite par les fluctuations de l'ensemble d'entraînement.
			</p>
			<p>
				<strong>2. Bagging :</strong> Variante du bootstrap où l'on moyenne les prédictions d'un ensemble
				de modèles. La variance des prédictions individuelles sert d'estimateur de l'incertitude.
			</p>
			<p>
				<strong>3. Régression quantile :</strong> Entraînement séparé sur les quantiles supérieurs et
				inférieurs (p. ex. 84e et 16e percentiles). La différence entre ces quantiles fournit une estimation
				de la dispersion locale.
			</p>
			<p>
				<strong>4. Réseaux bayésiens :</strong> Dans les modèles probabilistes, la variance a posteriori
				des prédictions offre une estimation directe et cohérente de l'incertitude. Mais le coût computationnel
				est généralement plus élevé.
			</p>
		</ExpertPanel>

		<p>
			Le <strong>bootstrap</strong> est probablement l'approche la plus répandue : elle est non paramétrique,
			facile à mettre en œuvre, et compatible avec n'importe quel algorithme d'apprentissage. Le principe
			est d'observer comment les prédictions varient quand on change légèrement l'ensemble d'entraînement.
		</p>
	</TheorySection>

	<!-- ═══════════ Démo 11.3 — Bootstrap ═══════════ -->
	<InteractiveSection
		number="11.3"
		title="Incertitude par Bootstrap"
		onInteract={tracker.trackInteraction}
	>
		<BootstrapUncertainty />
	</InteractiveSection>

	<!-- ═══════════ Régression quantile conforme (CQR) ═══════════ -->
	<TheorySection>
		<h2 id="cqr">Régression quantile conforme (CQR)</h2>

		<p>
			Le score adaptatif <KatexInline formula={F_SCORE_ADAPTIVE} /> approxime l'adaptation à l'hétéroscédasticité
			en passant par une estimation séparée de <KatexInline formula={F_SIGMA} />. Une approche plus
			directe consiste à estimer la forme de l'intervalle oracle
			<KatexInline formula={F_SYMMETRIC_ORACLE} /> elle-même, via une
			<strong>régression quantile</strong>, puis à corriger cette estimation par calibration
			conforme. C'est le principe de la
			<strong>régression quantile conforme</strong> (CQR).
		</p>

		<ExpertPanel title="Algorithme CQR">
			<p>
				<strong>Étape 1 — Régression quantile :</strong> Apprendre deux fonctions
				<KatexInline formula={F_QLO_QHI} />, estimant respectivement les quantiles conditionnels
				<KatexInline formula="\alpha/2" /> et <KatexInline formula="1-\alpha/2" /> de
				<KatexInline formula="Y" /> sachant <KatexInline formula="X" /> (p. ex. par régression quantile
				ou forêts quantiles).
			</p>
			<p>
				<strong>Étape 2 — Score de conformité :</strong> Sur l'ensemble de calibration, calculer le score
				signé de dépassement :
			</p>
			<KatexBlock formula={F_CQR_SCORE} />
			<p>
				Ce score est positif si <KatexInline formula="y" /> tombe hors de l'intervalle estimé
				<KatexInline formula={String.raw`[\hat{q}_{lo}(x), \hat{q}_{hi}(x)]`} /> (il mesure alors le dépassement),
				et négatif s'il tombe à l'intérieur (il mesure la marge restante).
			</p>
			<p>
				<strong>Étape 3 — Calibration et prédiction :</strong> Calculer le quantile
				<KatexInline formula="Q" /> des scores de calibration au niveau
				<KatexInline formula={String.raw`\lceil (n+1)(1-\alpha) \rceil`} />, puis retourner :
			</p>
			<KatexBlock formula={F_CQR_INTERVAL} />
		</ExpertPanel>

		<Callout type="insight" title="Pourquoi corriger une régression quantile déjà entraînée ?">
			Les quantiles <KatexInline formula={F_QLO_QHI} /> estimés à l'étape 1 sont eux-mêmes des approximations
			: rien ne garantit, en échantillon fini, qu'ils couvrent exactement
			<KatexInline formula="1-\alpha" /> des observations. L'étape 2 mesure précisément cette erreur de
			calibration sur des données indépendantes, et l'étape 3 la corrige par un décalage uniforme
			<KatexInline formula="Q" />. Le résultat hérite de la <strong>forme adaptative</strong> de la
			régression quantile (l'intervalle suit l'hétéroscédasticité) et de la
			<strong>garantie exacte</strong> de la prédiction conforme — quelle que soit la qualité de
			<KatexInline formula={F_QLO_QHI} />, exactement comme la validité de la leçon précédente ne
			dépendait pas de la qualité du classificateur sous-jacent.
		</Callout>
	</TheorySection>

	<!-- ═══════════ Évaluation des intervalles ═══════════ -->
	<TheorySection>
		<h2 id="evaluation-intervalles">Évaluation des intervalles de prédiction</h2>

		<p>
			La validation d'une méthode d'intervalles de prédiction repose sur plusieurs métriques
			complémentaires. Aucune mesure seule ne suffit : on doit vérifier à la fois que la garantie de
			couverture est respectée et que les intervalles ne sont pas artificiellement larges.
		</p>

		<Callout type="definition" title="Métriques d'évaluation">
			<p>
				<strong>Taux de couverture empirique :</strong> Fraction d'observations de test dont la
				valeur vraie est incluse dans l'intervalle de prédiction :
				<KatexBlock formula={F_COVERAGE_RATE} />
			</p>
			<p>
				<strong>Largeur moyenne :</strong> Moyenne des largeurs d'intervalle sur l'ensemble de test
				:
				<KatexBlock formula={F_AVG_WIDTH} />
			</p>
			<p>
				<strong>Efficacité conditionnelle :</strong> Vérifier que la couverture est homogène à
				travers les différentes régions de l'espace d'entrée, et ne dépend pas excessivement des
				valeurs de <KatexInline formula="X" />.
			</p>
		</Callout>

		<p>
			Un bon système d'intervalles doit atteindre un taux de couverture proche (ou supérieur) de
			<KatexInline formula="1 - \alpha" /> tout en minimisant la largeur moyenne. L'efficacité conditionnelle
			est l'indicateur le plus subtil : si les intervalles couvrent bien globalement mais échouent systématiquement
			dans certaines régions, la méthode est jugée inégale — c'est exactement ce que la couverture
			<em>marginale</em> garantie par le théorème de la leçon précédente ne peut pas détecter.
		</p>

		<Callout type="warning" title="Exercice d'application">
			<p>
				Comparez les intervalles constants et adaptatifs (ou CQR) sur un jeu de données
				<strong>hétéroscédastique</strong> :
			</p>
			<ol>
				<li>
					Construisez les deux types d'intervalles et vérifiez empiriquement la garantie de
					couverture pour différents niveaux <KatexInline formula="\alpha" />
				</li>
				<li>Analysez l'efficacité (largeur d'intervalle) des deux approches</li>
				<li>
					Évaluez l'efficacité conditionnelle : la couverture est-elle uniforme dans toutes les
					régions ?
				</li>
			</ol>
		</Callout>
	</TheorySection>

	<!-- ═══════════ Démo 11.4 — Dashboard qualité ═══════════ -->
	<InteractiveSection
		number="11.4"
		title="Dashboard de qualité des intervalles"
		onInteract={tracker.trackInteraction}
	>
		<IntervalQualityDashboard />
	</InteractiveSection>

	<!-- ═══════════ Synthèse ═══════════ -->
	<TheorySection>
		<h2 id="synthese">Synthèse</h2>

		<p>
			La régression conformelle étend le cadre de la prédiction d'ensembles au cas continu, en
			remplaçant la probabilité conditionnelle discrète <KatexInline formula="\eta_c(x)" /> par la densité
			conditionnelle <KatexInline formula={F_DENSITY} />. L'oracle reste, dans les deux cas, un
			ensemble de niveau ; seule la nature de l'objet niveau change. Le passage de classes discrètes
			à des <strong>intervalles de prédiction</strong> introduit des choix de conception importants :
		</p>

		<ul>
			<li>
				<strong>Intervalles constants</strong> — simples et robustes, optimaux seulement sous homoscédasticité,
				car ils ne peuvent approximer une région de densité maximale de largeur variable
			</li>
			<li>
				<strong>Intervalles adaptatifs</strong> — ajustent leur largeur à l'incertitude locale via un
				score normalisé, efficaces pour les données hétéroscédastiques
			</li>
			<li>
				<strong>CQR</strong> — estime directement la forme de l'intervalle oracle par régression quantile,
				puis corrige la couverture par calibration conforme
			</li>
			<li>
				<strong>Estimation de l'incertitude</strong> — bootstrap, bagging, régression quantile ou
				méthodes bayésiennes pour estimer <KatexInline formula={F_SIGMA} />
			</li>
		</ul>

		<p>
			L'évaluation rigoureuse combine le taux de couverture (respect de la garantie), la largeur
			moyenne (précision) et l'efficacité conditionnelle (équité). Ensemble, ces indicateurs
			permettent de choisir entre les approches en fonction de la structure des données et des
			exigences applicatives. La garantie de couverture demeure <strong
				>exacte en échantillon fini</strong
			> sous l'hypothèse d'échangeabilité, indépendamment du modèle sous-jacent — que ce modèle soit un
			simple régresseur ponctuel ou une paire de régressions quantiles comme en CQR.
		</p>

		<InteractiveSection
			number="11.5"
			title="Quiz — Intervalles de prédiction et régression conformelle"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Vovk, V.', 'Gammerman, A.', 'Shafer, G.']}
			year={2005}
			title="Algorithmic Learning in a Random World"
			journal="Springer."
			link="https://doi.org/10.1007/b106715"
		/>
		<BibElement
			authors={['Romano, Y.', 'Patterson, E.', 'Candès, E. J.']}
			year={2019}
			title="Conformalized Quantile Regression"
			journal="Advances in Neural Information Processing Systems (NeurIPS), Vol. 32."
			link="https://arxiv.org/abs/1905.03222"
		/>
		<BibElement
			authors={['Barber, R. F.', 'Candès, E. J.', 'Ramdas, A.', 'Tibshirani, R. J.']}
			year={2021}
			title="Predictive Inference with the Jackknife+"
			journal="Annals of Statistics, 49(1), 486–507."
			link="https://arxiv.org/abs/1905.02928"
		/>
	</Bibliography>
</PageTemplate>
