<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';

	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';

	// Demo components
	import AdaBoostStepByStep from '$lib/components/demos/AdaBoostStepByStep.svelte';
	import ExponentialLossVisualizer from '$lib/components/demos/ExponentialLossVisualizer.svelte';
	import MarginDistribution from '$lib/components/demos/MarginDistribution.svelte';
	import GradientBoostingDemo from '$lib/components/demos/GradientBoostingDemo.svelte';
	import BoostingComparison from '$lib/components/demos/BoostingComparison.svelte';

	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import Quiz, { type QuizItem } from '$lib/components/narrative/Quiz.svelte';

	const meta = getPageByPath('/part4/lesson3');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question:
				"Dans AdaBoost, que devient le poids α_t d'un classifieur faible lorsque son erreur pondérée ε_t tend vers 0 ?",
			options: [
				'α_t tend vers 0',
				'α_t devient négatif',
				'α_t est fixé à 1',
				'α_t tend vers +∞ : le classifieur reçoit tout le poids'
			],
			answerIndex: 3,
			explanation:
				"α_t = (1/2) ln((1−ε_t)/ε_t) encode la fiabilité du classifieur : si ε_t → 0 alors α_t → +∞ (très fiable) ; si ε_t = 0,5 alors α_t = 0 (le modèle n'apporte rien, c'est le hasard) ; l'algorithme s'arrête dès que ε_t ≥ 1/2."
		},
		{
			question:
				"Dans la mise à jour des poids d'AdaBoost, un exemple correctement classé par h_t voit son poids multiplié par le facteur exp(−α_t) < 1. Que signifie cela ?",
			options: [
				'son poids diminue, si bien que les classifieurs faibles suivants se concentrent davantage sur les exemples mal classés',
				"l'exemple est ignoré par la suite par tous les classifieurs",
				'son étiquette est inversée',
				"l'algorithme s'arrête"
			],
			answerIndex: 0,
			explanation:
				"Section « Mise à jour adaptative des poids » : si la prédiction est correcte, le facteur est exp(−α_t) < 1 (le poids diminue) ; si elle est incorrecte, il est exp(+α_t) > 1 (le poids augmente). C'est ce mécanisme de rétroaction qui rend l'algorithme adaptatif : à chaque itération, il se concentre sur les exemples « difficiles »."
		},
		{
			question:
				"Selon le théorème 7.1, pourquoi l'erreur d'entraînement d'AdaBoost décroît-elle exponentiellement tant que chaque classifieur faible vérifie ε_t < 1/2 ?",
			options: [
				'parce que la perte exponentielle est bornée par 1',
				"parce que le nombre d'exemples n augmente",
				"parce que Z_t < 1 et que l'erreur d'entraînement est bornée par le produit des facteurs Z_t",
				'parce que la marge géométrique devient infinie'
			],
			answerIndex: 2,
			explanation:
				"Théorème 7.1 : l'erreur d'entraînement du classifieur final est bornée par Π Z_t ; aussi longtemps que ε_t < 1/2, on a Z_t < 1, et le produit décroît exponentiellement avec le nombre d'itérations. C'est ce qui justifie qu'il suffit d'apprenants faibles, légèrement meilleurs que le hasard (erreur < 50 %), pour construire un apprenant fort."
		},
		{
			question:
				'Quelle affirmation distingue correctement AdaBoost du gradient boosting, selon la section « Points de divergence » ?',
			options: [
				'AdaBoost entraîne ses modèles en parallèle, le GBM en séquentiel',
				"AdaBoost repère les exemples tandis que le GBM ajuste des pseudo-résidus ; AdaBoost minimise une perte exponentielle fixe, le GBM accepte n'importe quelle perte différentiable",
				'AdaBoost est plus robuste au bruit, car sa pénalité exponentielle est douce',
				"Le GBM ne fonctionne qu'avec la perte quadratique"
			],
			answerIndex: 1,
			explanation:
				"AdaBoost change la distribution de données (poids w_i), le GBM change l'objectif à prédire (résidus). AdaBoost minimise une perte exponentielle fixe — très sévère face aux outliers, un point bruité voit son poids exploser — tandis que le GBM accepte n'importe quelle perte différentiable et est plus robuste avec un taux d'apprentissage η faible."
		},
		{
			question:
				'Quelle est la différence entre la marge fonctionnelle (définition 7.2) et la marge géométrique (définition 7.3) ?',
			options: [
				'aucune : les deux grandeurs sont identiques',
				'la marge fonctionnelle est toujours négative',
				"la marge géométrique n'est utilisée que pour la régression",
				"la marge géométrique normalise la marge fonctionnelle par la somme Σ|α_t|, la rendant indépendante de l'échelle des poids, comme pour les SVM"
			],
			answerIndex: 3,
			explanation:
				"Définition 7.3 : la marge géométrique m̄_i = Y_i F(X_i) / Σ|α_t| divise la marge fonctionnelle par le poids total des classifieurs ; dans ce cadre, Σ|α_t| joue le rôle de la norme du vecteur de paramètres. Elle mesure la distance réelle d'un point à la frontière de décision, indépendamment de l'échelle des α_t — par analogie avec les SVM."
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
			id: 'introduction-boosting',
			label: 'Introduction au Boosting',
			description: 'Séquentialité vs parallélisme',
			color: 'neutral'
		},
		{
			id: 'adaboost',
			label: "L'algorithme AdaBoost",
			description: 'Répondération adaptative et apprentissage faible',
			color: 'epistemic'
		},
		{
			id: 'perte-exponentielle',
			label: 'Perte exponentielle et margins',
			description: 'Surrogates, convexité et margins',
			color: 'belief'
		},
		{
			id: 'distribution-margins',
			label: 'Distribution des margins et généralisation',
			description: 'Risque de surapprentissage et théorie',
			color: 'positive'
		},
		{
			id: 'gradient-boosting',
			label: 'Gradient Boosting',
			description: "Descente de gradient dans l'espace des fonctions",
			color: 'surprise'
		},
		{
			id: 'methodes-modernes',
			label: 'Méthodes modernes : XGBoost, LightGBM et CatBoost',
			description: 'Limitations du GB classique et extensions',
			color: 'agent'
		},
		{
			id: 'comparaison-synthese',
			label: 'Comparaison et synthèse',
			description: 'Choisir entre AdaBoost et Gradient Boosting',
			color: 'neutral'
		},
		{
			id: 'synthese-comparaison',
			label: 'Synthèse et comparaison des méthodes',
			description: 'Tableau comparatif, guide de choix, bonnes pratiques',
			color: 'belief'
		}
	];

	// ── Formula variables (stored in script so Svelte never parses backslashes) ──

	// AdaBoost algorithm formulas
	const initWeights = 'w_i^{(1)} = \\frac{1}{n}, \\quad i = 1,\\dots,n';
	const weightedError =
		'\\varepsilon_t = \\sum_{i=1}^{n} w_i^{(t)} \\; 1\\{h_t(X_i) \\neq Y_i\\} = \\mathbb{E}_{w^{(t)}}[h_t(X) \\neq Y]';
	const alphaT =
		'\\alpha_t = \\frac{1}{2}\\,\\ln\\!\\left(\\frac{1 - \\varepsilon_t}{\\varepsilon_t}\\right)';
	const weightUpdate =
		'w_i^{(t+1)} = \\frac{w_i^{(t)}}{Z_t} \\; \\exp\\bigl(-\\alpha_t Y_i h_t(X_i)\\bigr)';
	const normalizationFactor =
		'Z_t = \\sum_{i=1}^{n} w_i^{(t)} \\exp\\bigl(-\\alpha_t Y_i h_t(X_i)\\bigr)';
	const finalPrediction =
		'H(x) = \\operatorname{sign}\\!\\left(\\sum_{t=1}^{T} \\alpha_t h_t(x)\\right)';
	const tRange = 't = 1, \\dots, T';

	// AdaBoost training error bound — Theorem 7.1
	const trainingErrorBound =
		'\\frac{1}{n}\\sum_{i=1}^{n} 1\\{H(X_i) \\neq Y_i\\} \\leq \\prod_{t=1}^{T} Z_t';
	const expLossBound = '\\exp\\bigl(-Y_i F(X_i)\\bigr)';

	// Inline references — AdaBoost section
	const dataLabelled = '(X_i, Y_i)_{i=1}^n';
	const yInLabels = 'Y_i \\in \\{-1, +1\\}';
	const TVar = 'T';
	const h_t = 'h_t';
	const wAt_t = 'w^{(t)}';
	const epsilon_t_to_0 = '\\varepsilon_t \\to 0';
	const alpha_t_to_inf = '\\alpha_t \\to +\\infty';
	const epsilon_eq_half = '\\varepsilon_t = 0.5';
	const alpha_eq_zero = '\\alpha_t = 0';
	const epsilon_ge_half = '\\varepsilon_t \\geq 1/2';
	const epsilon_gt_half = '\\varepsilon_t > 0.5';
	const alpha_lt_zero = '\\alpha_t < 0';
	const iSym = 'i';
	const expAlphaFactor = '\\exp(-\\alpha_t Y_i h_t(X_i))';
	const yEqHtX = 'Y_i = h_t(X_i)';
	const expMinusAlphaLt1 = '\\exp(-\\alpha_t) < 1';
	const expPlusAlphaGt1 = '\\exp(+\\alpha_t) > 1';
	const Z_t = 'Z_t';
	const epsilon_lt_half = '\\varepsilon_t < 0.5';
	const Z_lt_1 = 'Z_t < 1';
	const w_i = 'w_i';

	// Exponential loss — Section 3
	const exponentialLoss = 'L(y, f(x)) = \\exp\\bigl(-y\\,f(x)\\bigr)';
	const negMarginExp = '-y\\,f(x)';
	const derivExpLoss = '\\frac{\\partial}{\\partial f}\\exp(-y\\,f) = -y\\;\\exp(-y\\,f)';
	const yfx = 'y\\,f(x)';
	const fSym = 'f';
	const expMinusyf = '\\exp(-y\\,f)';

	// Functional margin — Definition 7.2
	const functionalMarginDef =
		'm_i = Y_i F(X_i) \\quad\\text{où}\\quad F(x) = \\sum_{t=1}^{T} \\alpha_t h_t(x)';
	const m_i = 'm_i';
	const marginPositive = 'm_i > 0';
	const marginNegative = 'm_i < 0';
	const marginZero = 'm_i = 0';

	// Callout — loss 0-1 indicator
	const loss01Indicator = '\\mathbb{1}\\{y\\,f(x) < 0\\}';

	// Generalization bound by margins — Theorem 7.2
	const generalizationMarginBound =
		'\\mathrm{err}_{gen}(H) \\leq \\frac{N_{\\rho}(T)}{n} + O\\left(\\sqrt{\\frac{d\\log(n/d)+\\log(1/\\delta)}{n\\rho^2}}\\right)';
	const rhoGt0 = '\\rho > 0';
	const N_rho_T = 'N_{\\rho}(T)';

	// Geometric margin — Definition 7.3
	const geometricMarginDef = '\\bar{m}_i = \\frac{Y_i F(X_i)}{\\sum_{t=1}^{T} |\\alpha_t|}';
	const alphaSumDenom = '\\sum_{t=1}^{T} |\\alpha_t|';
	const alpha_tSym = '\\alpha_t';

	// Exercise 7.1 — margin computation helpers
	const F_x_i = 'F(x_i)';
	const m_i_formula = 'm_i = Y_i \\cdot F(x_i)';
	const marginLt0 = 'm_i < 0';
	const abs_m_i = '|m_i|';
	const alpha_1_val = '\\alpha_1 = 0.6';
	const alpha_2_val = '\\alpha_2 = 0.4';
	const alpha_3_val = '\\alpha_3 = 0.8';
	const Y_i_eq_plus1 = 'Y_i = +1';
	const plusOne = '+1';
	const minusOne = '-1';

	// Gradient Boosting — Section 5
	const gbInit =
		'F_0(x) = \\underset{\\gamma}{\\arg\\min}\\; \\sum_{i=1}^{n} L\\bigl(Y_i, \\gamma\\bigr)';
	const pseudoResiduals =
		'r_{it} = -\\left[\\frac{\\partial L(Y_i, F(x_i))}{\\partial F(x_i)}\\right]_{F = F_{t-1}}';
	const r_it = 'r_{it}';
	const squaredLossResidual = 'r_i = Y_i - F(X_i)';
	const squaredLossDef = 'L(y, f) = \\frac{1}{2}(y - f)^2';
	const gammaOptimization =
		'\\gamma_t = \\underset{\\gamma}{\\arg\\min}\\; \\sum_{i=1}^{n} L\\bigl(Y_i, F_{t-1}(X_i) + \\gamma h_t(X_i)\\bigr)';
	const gbUpdate = 'F_t(x) = F_{t-1}(x) + \\eta \\; \\gamma_t \\; h_t(x)';
	const etaSymbol = '\\eta';
	const gbFinalPrediction = 'F_T(x)';

	// Inline references — Gradient Boosting section
	const F_x = 'F(x)';
	const thetaSym = '\\theta';
	const gdUpdateBlock =
		'\\theta^{(t)} = \\theta^{(t-1)} - \\eta \\nabla_{\\theta} J(\\theta^{(t-1)})';
	const gbGradBlock = 'F_t(x) = F_{t-1}(x) - \\eta \\; h_t(x)';
	const thetaInRd = '\\theta \\in \\mathbb{R}^d';
	const FfuncSpace = 'F : \\mathcal{X} \\to \\mathbb{R}';

	// Section 6 — Comparison
	const etaRange = '\\eta \\in [0.01, 0.3]';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Boosting (AdaBoost, Gradient Boosting)'}
	subtitle="Apprentissage séquentiel : AdaBoost, pertes exponentielles, marges et gradient boosting"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- SECTION 1 : INTRODUCTION AU BOOSTING -->
	<TheorySection>
		<TableOfContents entries={tocEntries} />
		<h2 id="introduction-boosting">Introduction au Boosting</h2>
		<p>
			Les méthodes de <strong>boosting</strong> constituent une famille d'algorithmes ensemblistes
			séquentiels. Contrairement au bagging, qui entraîne des modèles <em>en parallèle</em>, le
			boosting construit un ensemble de manière <em>séquentielle</em> : chaque nouveau modèle s'efforce
			de corriger les erreurs commises par les précédents.
		</p>

		<h3>Séquentiel vs Parallèle</h3>
		<p>
			Cette distinction fondamentale entraîne des différences majeures entre les deux approches :
		</p>
		<ol>
			<li>
				<strong>Bagging</strong> — Les modèles sont entraînés indépendamment. L'agrégation réduit la
				<strong>variance</strong>. Chaque modèle utilise un échantillon bootstrap du jeu
				d'entraînement.
			</li>
			<li>
				<strong>Boosting</strong> — Les modèles s'appuient les uns sur les autres. L'itération
				réduit le
				<strong>biais</strong>. Chaque modèle « se concentre » sur les exemples que les précédents
				ont mal classés.
			</li>
		</ol>

		<Callout type="intuition" title="Différence philosophique">
			<p>
				Tandis que le bagging repose sur la <strong>distribution du risque</strong> (diversifier les
				erreurs), le boosting repose sur l'<strong>accumulation progressive de savoir-faire</strong
				>. Les apprenants faibles deviennent, par itération, un classifieur puissant.
			</p>
		</Callout>

		<h3>Les apprenants faibles</h3>
		<p>
			L'idée centrale du boosting est qu'il suffit d'<strong>apprenants faibles</strong> — des
			modèles légèrement meilleurs que le hasard (taux d'erreur strictement inférieur à 50 % pour la
			classification binaire). En les combinant de manière intelligente, on obtient un
			<em>apprenant fort</em>
			dont l'erreur d'apprentissage peut être rendue arbitrairement petite. Ce résultat contre-intuitif
			a été rigoureusement démontré par Freund et Schapire en 1995 avec la naissance d'<strong
				>AdaBoost</strong
			>.
		</p>

		<Callout type="summary" title="Points clés">
			<ul>
				<li><strong>Séquentionnel</strong> : chaque itération dépend des précédentes</li>
				<li>
					<strong>Réduction de biais</strong> : on affine progressivement la frontière de décision
				</li>
				<li>
					<strong>Apprenants faibles</strong> : stumps (arbres de profondeur 1)...
				</li>
			</ul>
		</Callout>
	</TheorySection>

	<!-- SECTION 2 : L'ALGORITHME ADA BOOST -->
	<TheorySection>
		<h2 id="adaboost">L'algorithme AdaBoost</h2>
		<p>
			AdaBoost (Adaptive Boosting) est le premier algorithme de boosting avec des garanties
			théoriques. Il fonctionne par répondération adaptative des exemples : à chaque itération, les
			points mal classés voient leur poids augmenter, forçant l'apprenant faible suivant à s'en
			préoccuper davantage.
		</p>

		<DefinitionBlock number="7.1" title="AdaBoost (Adaptive Boosting)">
			<p>
				Soit un jeu de données étiqueté <KatexInline formula={dataLabelled} /> avec <KatexInline
					formula={yInLabels}
				/>. L'algorithme produit <KatexInline formula={TVar} /> classifieurs faibles pondérés :
			</p>

			<div class="algo-block">
				<h3>Algorithme AdaBoost</h3>
				<p>
					<strong>Initialisation :</strong> Poids uniformes <KatexInline formula={initWeights} />
				</p>
				<ol>
					<li>Pour chaque itération <KatexInline formula={tRange} /> :</li>
					<ul>
						<li>
							a. Entraîner un classifieur faible <KatexInline formula={h_t} /> sur la distribution de
							poids courante
							<KatexInline formula={wAt_t} />
						</li>
						<li>b. Calculer l'erreur pondérée :<br /><KatexBlock formula={weightedError} /></li>
						<li>
							c. Si <KatexInline formula={epsilon_ge_half} /> : arrêter (le classifieur faible ne
							fait pas mieux que le hasard).
						</li>
						<li>d. Calculer le poids du classifieur :<br /><KatexBlock formula={alphaT} /></li>
						<li>
							e. Mettre à jour les poids des exemples :<br /><KatexBlock formula={weightUpdate} />
						</li>
						<li>
							où <KatexInline formula={normalizationFactor} /> est le facteur de normalisation.
						</li>
					</ul>
					<li>
						<strong>Sortie :</strong> Classifieur final :<br /><KatexBlock
							formula={finalPrediction}
						/>
					</li>
				</ol>
			</div>
		</DefinitionBlock>

		<h3>Interprétation des poids αₜ</h3>
		<p>
			Le coefficient <KatexInline formula={alphaT} /> encode la fiabilité de chaque classifieur faible
			:
		</p>
		<ul>
			<li>
				Si <KatexInline formula={epsilon_t_to_0} />, alors <KatexInline formula={alpha_t_to_inf} /> —
				le modèle est très fiable.
			</li>
			<li>
				Si <KatexInline formula={epsilon_eq_half} />, alors <KatexInline formula={alpha_eq_zero} /> —
				le modèle n'apporte rien (hasard).
			</li>
			<li>
				Si <KatexInline formula={epsilon_gt_half} />, alors <KatexInline formula={alpha_lt_zero} /> —
				le modèle est pire que le hasard. Dans l'algorithme des notes, on s'arrête dès que
				<KatexInline formula={epsilon_ge_half} /> ; certaines variantes ne s'arrêtent pas et
				inversent le classifieur (<KatexInline formula={alpha_lt_zero} />) — extension au-delà du
				cours.
			</li>
		</ul>

		<h3>Mise à jour adaptative des poids</h3>
		<p>
			L'exemple <KatexInline formula={iSym} /> reçoit un facteur multiplicatif <KatexInline
				formula={expAlphaFactor}
			/>. Si la prédiction est correcte (<KatexInline formula={yEqHtX} />), ce facteur vaut <KatexInline
				formula={expMinusAlphaLt1}
			/> — le poids diminue. Si elle est incorrecte, il vaut <KatexInline
				formula={expPlusAlphaGt1}
			/> — le poids augmente. C'est ce mécanisme de rétroaction qui rend l'algorithme
			<em>adaptatif</em>.
		</p>

		<TheoremBlock number="7.1" title="Borne supérieure sur l'erreur d'entraînement">
			<p>
				L'erreur d'entraînement du classifieur final AdaBoost est bornée par le produit des facteurs
				de normalisation :
			</p>
			<KatexBlock formula={trainingErrorBound} />
			<p>
				D'où une borne exponentielle alternative : chaque exemple contribue au plus de <KatexInline
					formula={expLossBound}
				/>, et la moyenne sur tous les exemples décroît si les facteurs <KatexInline
					formula={Z_t}
				/> sont inférieurs à 1.
			</p>
			<p>
				Aussi longtemps que chaque classifieur faible est <strong>meilleur que le hasard</strong>
				(<KatexInline formula={epsilon_lt_half} />, on a <KatexInline formula={Z_lt_1} />, et
				l'erreur d'entraînement décroît exponentiellement avec le nombre d'itérations.
			</p>
		</TheoremBlock>

		<Callout type="intuition" title="Pourquoi AdaBoost fonctionne-t-il ?">
			<p>
				L'intuition est la suivante : à chaque étape, l'algorithme se concentre davantage sur les
				exemples « difficiles » — ceux que les classifieurs précédents ont mal traités. Les poids <KatexInline
					formula={w_i}
				/> augmentent pour ces exemples, forçant les nouveaux apprenants à s'y ajuster. Le résultat est
				une frontière de décision qui se complexifie progressivement là où c'est nécessaire.
			</p>
		</Callout>

		<InteractiveSection
			number="7.1"
			title="AdaBoost pas à pas"
			onInteract={tracker.trackInteraction}
		>
			<AdaBoostStepByStep />
		</InteractiveSection>
	</TheorySection>

	<!-- SECTION 3 : PERTE EXPONENTIELLE ET MARGINS -->
	<TheorySection>
		<h2 id="perte-exponentielle">Perte exponentielle et margins</h2>
		<p>
			Une interprétation d'AdaBoost est qu'il minimise la <strong>perte exponentielle</strong>. Ce
			n'est pas un choix arbitraire : cette perte agit comme une surrogate de la perte 0-1 (qui
			compte les erreurs), mais offre un critère différentiable et convexe.
		</p>

		<h3>Perte exponentielle</h3>
		<p>Pour chaque observation, la perte s'écrit :</p>
		<KatexBlock formula={exponentialLoss} />
		<p>
			L'exposant <KatexInline formula={negMarginExp} /> est l'<strong>opposé de la marge</strong>.
			Plus la marge <KatexInline formula={yfx} /> est grande et positive, plus la perte décroît rapidement
			vers 0. À l'inverse, un classifieur qui se trompe fortement subit une pénalité exponentielle.
		</p>

		<h3>Dérivée de la perte</h3>
		<p>La dérivée par rapport à <KatexInline formula={fSym} /> vaut :</p>
		<KatexBlock formula={derivExpLoss} />
		<p>
			La magnitude du gradient est proportionnelle à <KatexInline formula={expMinusyf} /> — les exemples
			mal classés génèrent un signal plus fort, exactement comme le font les poids dans AdaBoost. C'est
			ce lien formel entre la répondération et la descente de gradient qui justifie l'algorithme.
		</p>

		<DefinitionBlock number="7.2" title="Marge fonctionnelle">
			<p>Pour chaque observation <KatexInline formula={iSym} />, la marge fonctionnelle est :</p>
			<KatexBlock formula={functionalMarginDef} />
			<ul>
				<li>
					<KatexInline formula={marginPositive} /> ⟹ classification correcte (plus <KatexInline
						formula={m_i}
					/> est grand, plus le classifieur est « confiant »)
				</li>
				<li><KatexInline formula={marginNegative} /> ⟹ erreur de classification</li>
				<li><KatexInline formula={marginZero} /> ⟹ la frontière passe exactement par ce point</li>
			</ul>
		</DefinitionBlock>

		<Callout type="insight" title="Pourquoi la perte exponentielle ?">
			<p>
				La vraie perte à minimiser est la <strong>perte 0-1</strong> : <KatexInline
					formula={loss01Indicator}
				/>. Mais cette fonction est discontinue et non convexe — impossible à optimiser directement.
				La perte exponentielle est une approximation supérieure lisse qui pénalise sévèrement les
				erreurs tout en restant différentiable. Elle n'est pas la seule possibilité, mais c'est
				celle qui émerge naturellement du cadre d'AdaBoost.
			</p>
		</Callout>

		<InteractiveSection
			number="7.2"
			title="Perte exponentielle"
			onInteract={tracker.trackInteraction}
		>
			<ExponentialLossVisualizer />
		</InteractiveSection>
	</TheorySection>

	<!-- SECTION 4 : DISTRIBUTION DES MARGINS ET GÉNÉRALISATION -->
	<TheorySection>
		<h2 id="distribution-margins">Distribution des <em>margins</em> et généralisation</h2>
		<p>
			Si l'erreur d'entraînement décroît exponentiellement avec AdaBoost, le risque de
			surapprentissage est réel. La théorie des margins fournit une réponse : la généralisation
			dépend non pas uniquement du nombre d'itérations mais de la <strong
				>distribution des margins</strong
			> dans l'espace des observations.
		</p>

		<TheoremBlock number="7.2" title="Borne de généralisation par les marges">
			<p>
				Soit <KatexInline formula={rhoGt0} /> un seuil de marge et
				<KatexInline formula={N_rho_T} /> le nombre d'exemples d'entraînement dont la marge fonctionnelle
				vérifie
				<KatexInline formula={'y_i F(X_i) \\leq \\rho'} />. Alors, avec grande probabilité :
			</p>

			<KatexBlock formula={generalizationMarginBound} />

			<p>
				La borne dépend donc de la proportion d'exemples ayant une petite marge. Schapire et al.
				(1998) montrent que le boosting améliore la généralisation en déplaçant progressivement la
				distribution des marges vers des valeurs positives élevées, et pas seulement en réduisant
				l'erreur d'entraînement.
			</p>
		</TheoremBlock>

		<h3>Maximisation des <em>margins</em></h3>
		<p>
			Une observation empirique clé : après convergence de l'erreur d'entraînement (celle-ci atteint
			0), AdaBoost continue à augmenter le minimum et la moyenne des margins. Ce phénomène, appelé <em
				>margin maximization</em
			>, rappelle celui du perceptron ou des SVM — la largeur de la séparation entre classes
			détermine les performances en généralisation.
		</p>

		<DefinitionBlock number="7.3" title="Marge géométrique">
			<p>
				La marge géométrique normalise la marge fonctionnelle par le poids total des classifieurs :
			</p>
			<KatexBlock formula={geometricMarginDef} />
			<p>
				Dans ce cadre, <KatexInline formula={alphaSumDenom} /> joue le rôle de la norme du vecteur de
				paramètres. La marge géométrique est analogue à celle des SVM : elle mesure la distance réelle
				d'un point à la frontière de décision, indépendamment de l'échelle des poids <KatexInline
					formula={alpha_tSym}
				/>.
			</p>
		</DefinitionBlock>

		<Callout type="summary" title="Pourquoi les margins comptent">
			<ul>
				<li>
					Une grande marge minimale ⟹ meilleure généralisation, même avec erreur d'entraînement
					nulle
				</li>
				<li>AdaBoost maximise naturellement la marge moyenne lors de la phase post-convergence</li>
				<li>La borne dépend du nombre de « petites margins » — pas seulement de l'erreur brute</li>
			</ul>
		</Callout>

		<InteractiveSection
			number="7.3"
			title="Histogramme des margins"
			onInteract={tracker.trackInteraction}
		>
			<MarginDistribution />
		</InteractiveSection>

		<ExercisePanel number="7.1" title="Calcul de margins">
			{#snippet solution()}
				<p>
					Pour chaque point, on calcule <KatexInline formula={F_x_i} /> comme somme pondérée des prédictions
					des T classifieurs. La marge est alors simplement <KatexInline formula={m_i_formula} />.
					Les points avec <KatexInline formula={marginLt0} /> sont ceux mal classés par l'ensemble ; plus
					<KatexInline formula={abs_m_i} /> est grand, plus la prédiction est confiante.
				</p>
			{/snippet}
			<p>
				Soit un ensemble de 3 stumps avec <KatexInline formula={alpha_1_val} />, <KatexInline
					formula={alpha_2_val}
				/> et <KatexInline formula={alpha_3_val} />. Pour un exemple d'étiquette <KatexInline
					formula={Y_i_eq_plus1}
				/> dont les prédictions sont respectivement <KatexInline formula={plusOne} />, <KatexInline
					formula={minusOne}
				/> et <KatexInline formula={plusOne} />, calculez la marge fonctionnelle. Ce point est-il
				correctement classé ?
			</p>
		</ExercisePanel>
	</TheorySection>

	<!-- SECTION 5 : GRADIENT BOOSTING -->
	<TheorySection>
		<h2 id="gradient-boosting">Gradient Boosting (Friedman, 2001)</h2>
		<p>
			Les travaux de Jerome Friedman généralisent le boosting au-delà d'AdaBoost et de la perte
			exponentielle. Gradient Boosting consiste à voir le problème comme une <strong
				>descente de gradient dans l'espace des fonctions</strong
			>. Au lieu d'ajuster des paramètres, on ajuste progressivement une fonction <KatexInline
				formula={F_x}
			/> en suivant la direction du gradient négatif d'une perte quelconque.
		</p>

		<h3>Descente de gradient fonctionnelle</h3>
		<p>
			Rappelons que la descente de gradient classique itère sur un vecteur de paramètres <KatexInline
				formula={thetaSym}
			/> :
		</p>
		<KatexBlock formula={gdUpdateBlock} />
		<p>
			Dans le gradient boosting, on remplace <KatexInline formula={thetaSym} /> par une fonction <KatexInline
				formula={F_x}
			/> et le gradient analytique par des <strong>pseudo-résidus</strong> que l'on approxime avec des
			apprenants faibles (généralement des arbres de décision) :
		</p>
		<KatexBlock formula={gbGradBlock} />
		<p>
			où <KatexInline formula={etaSymbol} /> est le taux d'apprentissage et <KatexInline
				formula={h_t}
			/> approxime le gradient de la fonction de perte.
		</p>

		<DefinitionBlock number="7.4" title="Algorithme Gradient Boosting">
			<div class="algo-block">
				<h3>Gradient Boosting Machine</h3>
				<p>
					<strong>Initialisation :</strong>
					<KatexInline formula={gbInit} />
				</p>
				<ol>
					<li>Pour chaque itération <KatexInline formula={tRange} /> :</li>
					<ul>
						<li>a. Calculer les pseudo-résidus :<br /><KatexBlock formula={pseudoResiduals} /></li>
						<li>
							b. Ajuster un apprenant faible <KatexInline formula={h_t} /> sur <KatexInline
								formula={r_it}
							/>
						</li>
						<li>c. Optimiser le pas :<br /><KatexBlock formula={gammaOptimization} /></li>
						<li>d. Mettre à jour le modèle :<br /><KatexBlock formula={gbUpdate} /></li>
					</ul>
					<li><strong>Sortie :</strong> <KatexInline formula={gbFinalPrediction} /></li>
				</ol>
			</div>
		</DefinitionBlock>

		<h3>Cas concret : perte quadratique</h3>
		<p>
			Pour la régression avec <KatexInline formula={squaredLossDef} />, le pseudo-résidu se
			simplifie en :
		</p>
		<KatexBlock formula={squaredLossResidual} />
		<p>
			C'est exactement le résidu classique. Chaque arbre de l'ensemble apprend donc à prédire ce que
			le modèle actuel n'a pas encore capturé — d'où le nom <em>gradient</em> boosting : on « remonte
			» vers la fonction cible en suivant la pente des erreurs.
		</p>

		<Callout type="intuition" title="Paramètres vs Fonctions">
			<p>
				Il y a une analogie directe entre descente de gradient ordinaire et boosting : là où on
				itère sur un vecteur <KatexInline formula={thetaInRd} />, le boosting itère dans l'espace
				fonctionnel <KatexInline formula={FfuncSpace} />. Les apprenants faibles jouent le rôle de
				directions de descente, et le taux d'apprentissage <KatexInline formula={etaSymbol} /> contrôle
				la taille du pas — exactement comme dans SGD. Cette perspective unifie boosting et optimisation
				numérique.
			</p>
		</Callout>

		<InteractiveSection
			number="7.4"
			title="Gradient Boosting pas à pas"
			onInteract={tracker.trackInteraction}
		>
			<GradientBoostingDemo />
		</InteractiveSection>
	</TheorySection>

	<!-- SECTION 6 : MÉTHODES MODERNES (XGBOOST, LIGHTGBM, CATBOOST) -->
	<TheorySection>
		<h2 id="methodes-modernes">Méthodes modernes : XGBoost, LightGBM et CatBoost</h2>

		<h3>Limitations du Gradient Boosting classique</h3>
		<ul>
			<li><strong>Lenteur</strong> : construction séquentielle des arbres</li>
			<li><strong>Mémoire</strong> : stockage de tous les arbres</li>
			<li><strong>Overfitting</strong> : tendance au surajustement sans régularisation</li>
		</ul>

		<h3>XGBoost (eXtreme Gradient Boosting)</h3>
		<p>XGBoost améliore le gradient boosting traditionnel par :</p>

		<DefinitionBlock title="Innovations de XGBoost">
			<ul>
				<li><strong>Régularisation L1/L2</strong> sur les poids des feuilles</li>
				<li><strong>Approximation d'ordre 2</strong> (utilisation de la hessienne)</li>
				<li><strong>Gestion des valeurs manquantes</strong> native</li>
				<li><strong>Parallélisation</strong> de la construction des arbres</li>
				<li><strong>Pré-tri des features</strong> pour l'efficacité</li>
			</ul>
		</DefinitionBlock>

		<h3>LightGBM et CatBoost</h3>
		<ul>
			<li>
				<strong>LightGBM</strong> : croissance des arbres en largeur d'abord (<em>leaf-wise</em>) au
				lieu de niveau par niveau
			</li>
			<li>
				<strong>CatBoost</strong> : gestion native des variables catégorielles sans pré-traitement
			</li>
		</ul>

		<h3>Hyperparamètres critiques</h3>
		<table>
			<thead>
				<tr>
					<th>Paramètre</th>
					<th>Description</th>
					<th>Valeurs typiques</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>n_estimators</code></td>
					<td>Nombre d'arbres</td>
					<td>100-1000</td>
				</tr>
				<tr>
					<td><code>learning_rate</code></td>
					<td>Taux d'apprentissage</td>
					<td>0.01-0.3</td>
				</tr>
				<tr>
					<td><code>max_depth</code></td>
					<td>Profondeur max des arbres</td>
					<td>3-8</td>
				</tr>
				<tr>
					<td><code>subsample</code></td>
					<td>Fraction d'exemples par arbre</td>
					<td>0.8-1.0</td>
				</tr>
				<tr>
					<td><code>colsample_bytree</code></td>
					<td>Fraction de features par arbre</td>
					<td>0.8-1.0</td>
				</tr>
				<tr>
					<td><code>reg_alpha</code></td>
					<td>Régularisation L1</td>
					<td>0-10</td>
				</tr>
				<tr>
					<td><code>reg_lambda</code></td>
					<td>Régularisation L2</td>
					<td>1-10</td>
				</tr>
			</tbody>
		</table>
	</TheorySection>

	<!-- SECTION 7 : COMPARAISON ET SYNTHÈSE -->
	<TheorySection>
		<h2 id="comparaison-synthese">Comparaison et synthèse</h2>
		<p>
			AdaBoost et le Gradient Boosting partagent la même philosophie séquentielle mais diffèrent sur
			plusieurs points fondamentaux. Comprendre ces différences guide le choix du bon algorithme
			pour chaque situation.
		</p>

		<h3>Points de divergence</h3>
		<ul>
			<li>
				<strong>Mécanisme d'adaptation</strong> : AdaBoost répondère les exemples (poids <KatexInline
					formula={w_i}
				/>), tandis que le GBM ajuste des résidus. Le premier change la distribution de données, le
				second change l'objectif à prédire.
			</li>
			<li>
				<strong>Perte optimisée</strong> : AdaBoost minimise implicitement la perte exponentielle (fixe).
				Le GBM accepte n'importe quelle perte différentiable — quadratique pour la régression, log-loss
				pour la classification…
			</li>
			<li>
				<strong>Robustesse au bruit</strong> : La pénalité exponentielle d'AdaBoost est très sévère
				face aux outliers. Un point bruité voit son poids exploser et fausser les itérations
				suivantes. Le GBM, avec un taux d'apprentissage faible (<KatexInline formula={etaSymbol} /> petit),
				est plus robuste car chaque pas est limité.
			</li>
			<li>
				<strong>Taux d'apprentissage</strong> : AdaBoost calcule automatiquement <KatexInline
					formula={alpha_tSym}
				/> à partir de l'erreur ; il n'y a pas de « learning rate » explicite. Le GBM utilise un <KatexInline
					formula={etaSymbol}
				/> fixe ou adaptatif qui contrôle directement la vitesse de convergence et le risque de surapprentissage.
			</li>
		</ul>

		<ExercisePanel number="7.2" title="Quel boosting choisir ?">
			{#snippet solution()}
				<p>
					Pour un jeu de données propre avec des classes bien séparées, AdaBoost est simple et
					efficace. En présence de bruit ou d'outliers, le Gradient Boosting avec <KatexInline
						formula={etaSymbol}
					/> faible (par exemple 0.1) offre un contrôle plus fin. Pour la régression, seul le GBM s'applique
					directement. Si on souhaite une perte personnalisée (quantile loss, Huber…), le cadre du GBM
					est conçu pour cela.
				</p>
			{/snippet}
			<p>
				Situation A : classification binaire sur un jeu propre de 10 000 échantillons avec des
				features textuelles.<br />
				Situation B : régression sur des données financières bruyantes avec des valeurs aberrantes.<br
				/>
				Pour chaque cas, argumentez le choix entre AdaBoost et Gradient Boosting.
			</p>
		</ExercisePanel>

		<Callout type="warning" title="Surapprentissage et régularisation">
			<p>
				Le boosting est sensible à la <strong>suroptimisation</strong>. Au-delà d'un certain nombre
				d'itérations, le modèle commence à mémoriser le bruit. Trois techniques principales limitent
				ce risque :
			</p>
			<ol>
				<li>
					<strong>Taux d'apprentissage faible</strong> (<KatexInline formula={etaRange} />) — réduit
					l'impact de chaque itération et nécessite plus d'itérations pour converger, mais produit
					un modèle plus stable.
				</li>
				<li>
					<strong>Early stopping</strong> — arrêter l'entraînement quand l'erreur sur un ensemble de validation
					cesse de diminuer.
				</li>
				<li>
					<strong>Subsampling</strong> (Stochastic Gradient Boosting) — utiliser une fraction des données
					à chaque itération pour induire de la diversité, analogue au bootstrap du bagging.
				</li>
			</ol>
		</Callout>

		<InteractiveSection
			number="7.5"
			title="Comparaison AdaBoost vs GBM"
			onInteract={tracker.trackInteraction}
		>
			<BoostingComparison />
		</InteractiveSection>

		<Callout type="summary" title="Synthèse du cours sur le Boosting">
			<ul>
				<li>
					<strong>AdaBoost</strong> : répondération adaptative, perte exponentielle, borne d'entraînement
					garantie. Sensible au bruit.
				</li>
				<li>
					<strong>Margins</strong> : la généralisation dépend de la distribution des marges, pas seulement
					de l'erreur brute. AdaBoost maximise les margins après convergence.
				</li>
				<li>
					<strong>Gradient Boosting</strong> : descente de gradient fonctionnelle, perte flexible
					(quadratique, log-loss…), robuste avec <KatexInline formula={etaSymbol} /> faible.
				</li>
				<li>
					<strong>Régularisation</strong> : learning rate, early stopping et subsampling sont indispensables
					pour éviter le surapprentissage.
				</li>
			</ul>
		</Callout>
	</TheorySection>

	<!-- SECTION 8 : SYNTHÈSE ET COMPARAISON DES MÉTHODES -->
	<TheorySection>
		<h2 id="synthese-comparaison">Synthèse et comparaison des méthodes</h2>

		<h3>Tableau comparatif</h3>
		<table>
			<thead>
				<tr>
					<th>Méthode</th>
					<th>Parallélisation</th>
					<th>Stabilité</th>
					<th>Interprétabilité</th>
					<th>Performance</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Vote majoritaire</td>
					<td>✓</td>
					<td>++</td>
					<td>+++</td>
					<td>+</td>
				</tr>
				<tr>
					<td>Bagging</td>
					<td>✓</td>
					<td>++</td>
					<td>++</td>
					<td>++</td>
				</tr>
				<tr>
					<td>Random Forest</td>
					<td>✓</td>
					<td>++</td>
					<td>++</td>
					<td>+++</td>
				</tr>
				<tr>
					<td>AdaBoost</td>
					<td>✗</td>
					<td>+</td>
					<td>+</td>
					<td>++</td>
				</tr>
				<tr>
					<td>Gradient Boosting</td>
					<td>✗</td>
					<td>+</td>
					<td>+</td>
					<td>+++</td>
				</tr>
				<tr>
					<td>XGBoost</td>
					<td>Partiel</td>
					<td>+</td>
					<td>+</td>
					<td>++++</td>
				</tr>
			</tbody>
		</table>

		<h3>Guide de choix</h3>
		<Callout type="insight" title="Quand utiliser quoi ?">
			<p><strong>Random Forest</strong> :</p>
			<ul>
				<li>Premier choix pour un modèle robuste et interprétable</li>
				<li>Données mixtes (catégorielles + numériques)</li>
				<li>Besoin d'importance des variables</li>
			</ul>
			<p><strong>XGBoost / LightGBM</strong> :</p>
			<ul>
				<li>Compétitions de machine learning</li>
				<li>Optimisation fine des performances</li>
				<li>Grands jeux de données</li>
			</ul>
			<p><strong>Bagging</strong> :</p>
			<ul>
				<li>Modèles de base instables (arbres profonds, réseaux de neurones)</li>
				<li>Réduction de variance</li>
			</ul>
			<p><strong>AdaBoost</strong> :</p>
			<ul>
				<li>Modèles de base simples (stumps)</li>
				<li>Classification binaire</li>
				<li>Données avec structure séquentielle</li>
			</ul>
		</Callout>

		<h3>Bonnes pratiques</h3>
		<Callout type="summary" title="Recommandations pratiques">
			<ol>
				<li><strong>Commencer simple</strong> : Random Forest avec paramètres par défaut</li>
				<li><strong>Valider rigoureusement</strong> : cross-validation pour éviter l'overfitting</li>
				<li><strong>Diversifier les modèles de base</strong> : différents algorithmes, hyperparamètres</li>
				<li><strong>Surveiller la complexité</strong> : plus de modèles ne garantit pas une amélioration</li>
				<li><strong>Exploiter l'OOB</strong> : estimation gratuite de l'erreur de généralisation</li>
			</ol>
		</Callout>

		<ExercisePanel title="Projet final">
			<p>Implémentez et comparez sur un jeu de données réel :</p>
			<ol>
				<li>Un modèle Random Forest</li>
				<li>Un modèle XGBoost</li>
				<li>Un ensemble combinant différents types d'algorithmes</li>
			</ol>
			<p>Analysez les trade-offs performance/complexité/interprétabilité.</p>
		</ExercisePanel>

		<InteractiveSection
			number="7.6"
			title="Quiz — Boosting : AdaBoost et gradient boosting"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<!-- BIBLIOGRAPHY -->
	<Bibliography>
		<BibElement
			authors={['Freund, Y.', 'Schapire, R. E.']}
			year={1997}
			title="A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting"
			journal="Journal of Computer and System Sciences, Vol. 55, No. 1, pp. 119-139."
			link="https://doi.org/10.1006/jcss.1997.1504"
		/>
		<BibElement
			authors={['Friedman, J. H.']}
			year={2001}
			title="Greedy Function Approximation: A Gradient Boosting Machine"
			journal="The Annals of Statistics, Vol. 29, No. 5, pp. 1189-1232."
			link="https://www.jstor.org/stable/2699986"
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

	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	thead {
		background: var(--color-surface-2);
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
	}

	td {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--color-border);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}
</style>
