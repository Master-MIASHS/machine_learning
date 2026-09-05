<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import Quiz, { type QuizItem } from '$lib/components/narrative/Quiz.svelte';
	import KNNClassifierExplorer from '$lib/components/demos/KNNClassifierExplorer.svelte';
	import CurseOfDimensionalityDemo from '$lib/components/demos/CurseOfDimensionalityDemo.svelte';
	import ConditionalRegressionExplorer from '$lib/components/demos/ConditionalRegressionExplorer.svelte';
	import BayesDecisionExplorer from '$lib/components/demos/BayesDecisionExplorer.svelte';
	import ConfusionMatrixMetricsDemo from '$lib/components/demos/ConfusionMatrixMetricsDemo.svelte';
	import KnnCrossValidationSelector from '$lib/components/demos/KnnCrossValidationSelector.svelte';
	import { asset } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part2/lesson1');
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
			label: "Qu'est-ce que l'apprentissage automatique ?",
			description: 'Définitions, exemples, ingrédients et objectif',
			color: 'epistemic'
		},
		{
			id: 'types-apprentissage',
			label: 'Supervisé vs. non supervisé',
			description: 'Contexte et objectif de chaque type ; aperçu du clustering',
			color: 'neutral'
		},
		{
			id: 'cadre-supervise',
			label: 'Cadre de l’apprentissage supervisé',
			description: 'Données, étiquettes, types de problèmes selon la nature de 𝓎',
			color: 'belief'
		},
		{
			id: 'knn',
			label: 'k-NN : exemple introductif',
			description: '« Qui se ressemble s’assemble », qualités et défauts',
			color: 'agent'
		},
		{
			id: 'formulation-probabiliste',
			label: 'Formulation formelle',
			description: 'Fonction de coût, risque, règle de décision optimale h*',
			color: 'belief'
		},
		{
			id: 'risque-empirique',
			label: 'Minimisation empirique',
			description: 'Risque empirique R_n, biais inductif, modélisation i.i.d.',
			color: 'epistemic'
		},
		{
			id: 'metriques',
			label: 'Évaluer un modèle',
			description: 'Matrice de confusion, métriques binaires et multiclasse',
			color: 'surprise'
		},
		{
			id: 'generalisation',
			label: 'Sur-apprentissage et biais-variance',
			description: 'Capacité de généralisation, compromis biais-variance pour k-NN',
			color: 'surprise'
		},
		{
			id: 'selection-modele',
			label: 'Sélectionner un modèle',
			description: 'Train/test, validation croisée, troisième jeu de données',
			color: 'positive'
		}
	];

	// ── Quiz A — « Est-ce de l'apprentissage supervisé ou non supervisé ? » ──
	// Frame « Quizz » des diapositives (6 exemples de la frame « Quelques exemples »).
	const quizA: QuizItem[] = [
		{
			question: '« Chat ou non ? » — décider si une photo est une photo de chat',
			options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
			answerIndex: 0,
			explanation:
				'Les photos sont associées à des étiquettes (CHAT / NON-CHAT) : le modèle apprend à prédire l’étiquette à partir des données.'
		},
		{
			question: 'Reconnaissance de chiffres manuscrits',
			options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
			answerIndex: 0,
			explanation:
				'Chaque chiffre manuscrit est fourni avec son étiquette (le chiffre) : données étiquetées, donc apprentissage supervisé.'
		},
		{
			question: 'Segmentation de marché',
			options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
			answerIndex: 1,
			explanation:
				"On cherche à identifier des groupes d'usagers au comportement similaire, sans étiquettes fournies : c'est du clustering, un problème non supervisé (Partie III)."
		},
		{
			question: 'Prédiction de clics',
			options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
			answerIndex: 0,
			explanation:
				"On prédit un clic (ou non) à partir des données d'exposition : les étiquettes binaires sont observées, donc apprentissage supervisé."
		},
		{
			question: "Segmentation d'image",
			options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
			answerIndex: 1,
			explanation:
				'Illustration d’une segmentation non supervisée : les pixels sont regroupés sans étiquettes fournies. Une segmentation supervisée est aussi possible.'
		},
		{
			question: "Compression d'image",
			options: ['Apprentissage supervisé', 'Apprentissage non supervisé'],
			answerIndex: 1,
			explanation:
				'Illustration d’une compression par clustering (k-moyennes), donc non supervisée ; d’autres méthodes de compression existent.'
		}
	];

	// ── Quiz B — « Régression ou classification ? » ──
	// Frame « Types d'apprentissage supervisé -- Quizz » : les 6 questions et
	// leurs réponses exactes telles que révélées dans les diapositives.
	const quizB: QuizItem[] = [
		{
			question: 'Identifier en quelle langue un texte est écrit',
			options: ['Régression', 'Classification'],
			answerIndex: 1,
			explanation: 'Classification multi-classe : le label est la langue du texte.'
		},
		{
			question: 'Identifier si une transaction financière est frauduleuse ou non',
			options: ['Régression', 'Classification'],
			answerIndex: 1,
			explanation: 'Classification binaire : fraude / non-fraude.'
		},
		{
			question: 'Prédire la probabilité de développer une maladie',
			options: ['Régression', 'Classification'],
			answerIndex: 0,
			explanation: 'Régression : la sortie est une quantité réelle (une probabilité dans [0, 1]).'
		},
		{
			question: "Prédire l'espèce d'une plante donnée",
			options: ['Régression', 'Classification'],
			answerIndex: 1,
			explanation: 'Classification multi-classe : le label est l’espèce.'
		},
		{
			question: "Prédire le prix d'une action en bourse",
			options: ['Régression', 'Classification'],
			answerIndex: 0,
			explanation: 'Régression : la sortie est un prix, une quantité réelle.'
		},
		{
			question: 'Prédire le nombre de clics sur un lien',
			options: ['Régression', 'Classification'],
			answerIndex: 0,
			explanation: 'Régression : le nombre de clics est une quantité réelle (non finie en général).'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const calY = '\\mathcal{Y}';
	const calH = '\\mathcal{H}';
	const calF = '\\mathcal{F}';
	const calNK = '\\mathcal{N}_K';
	const PXY = 'P_{X,Y}';

	const hMapping = 'h : \\mathcal{X} \\to \\mathcal{Y}';

	const costDef = '\\ell : \\mathcal{Y} \\times \\mathcal{Y} \\to \\mathbb{R}_+';
	const costProps =
		"\\ell(y, y) = 0 \\; \\forall y \\in \\mathcal{Y}, \\qquad \\ell(y, y') > 0 \\; \\forall y \\neq y' \\in \\mathcal{Y}";

	const riskDef = 'R(h) = \\mathbb{E}_{P_{X,Y}}\\left[\\,\\ell\\left(h(X), Y\\right)\\,\\right]';
	const hStarDef = 'h^* = \\arg\\min_{h \\in \\mathcal{F}} R(h)';

	const l2loss = "\\ell(y, y') = (y - y')^2";
	const l1loss = "\\ell(y, y') = |y - y'|";
	const l01loss = "\\ell(y, y') = \\mathbb{1}\\{y \\neq y'\\}";

	const quadAssumptions =
		'\\mathbb{E}\\left[Y^2\\right] < +\\infty \\;\\;\\text{et}\\;\\; \\mathbb{E}\\left[\\left(h(X)\\right)^2\\right] < +\\infty';
	const quadStep1 =
		'R(h) = \\mathbb{E}_{X,Y}\\left[\\left(Y-h(X)\\right)^2\\right] = \\mathbb{E}_{X}\\left[\\mathbb{E}_{Y\\mid X}\\left[\\left(Y-h(X)\\right)^2 \\mid X\\right]\\right]';
	const quadStep2 =
		'R(h) = \\int_{\\mathcal{X}} f_X(x) \\int_{\\mathcal{Y}} \\left(y-h(x)\\right)^2 \\, f_{Y\\mid X}(y\\mid x) \\, dy \\, dx';
	const gxDef =
		'g_x : t \\mapsto t^2 - 2t \\int_{\\mathcal{Y}} y \\, f_{Y\\mid X}(y\\mid x) \\, dy';
	const gxDeriv =
		"g_x'(t) = 0 \\iff t = \\int_{\\mathcal{Y}} y \\, f_{Y\\mid X}(y\\mid x) \\, dy = \\mathbb{E}\\left[Y \\mid X = x\\right]";
	const gxSecond = "g_x''(t) = 2 > 0";
	const hStarL2 = 'h^*(x) = \\mathbb{E}\\left[Y \\mid X = x\\right]';
	const hStarL1 = 'h^*(x) = \\text{médiane}\\left(Y \\mid X = x\\right)';
	const hStar01 =
		'h^*(x) = \\arg\\max_{k \\in \\mathcal{Y}} \\mathbb{P}\\left[Y = k \\mid X = x\\right]';

	const knnClass =
		'h_{\\text{KNN}}(x) = \\arg\\max_{k \\in \\mathcal{Y}} \\;\\sum_{i \\, : \\, x_i \\in \\mathcal{N}_K(x)} \\mathbb{1}\\{y_i = k\\}';
	const knnReg =
		'h_{\\text{KNN}}(x) = \\dfrac{1}{K} \\sum_{i \\, : \\, x_i \\in \\mathcal{N}_K(x)} y_i';
	const knnComplexity = 'O(nd) \\;+\\; O(n \\log K)';

	const empiricalRiskObs = '\\dfrac{1}{n} \\sum_{i=1}^n \\ell\\left(h(x_i), y_i\\right)';
	const hatHDef = '\\hat{h}^* = \\arg\\min_{h \\in \\mathcal{H}} R_n(h)';
	const inductiveBias =
		'\\mathcal{H} = \\left\\{ h : x \\in \\mathbb{R}^d \\mapsto \\phi\\left(\\langle a, x \\rangle + b\\right), \\; \\phi : \\mathbb{R} \\to \\mathcal{Y}, \\; a \\in \\mathbb{R}^d, \\; b \\in \\mathbb{R} \\right\\}';
	const linearRegressionOpt =
		'\\left(\\widehat{a}, \\widehat{b}\\right) = \\arg\\min_{a \\in \\mathbb{R}^d, \\, b \\in \\mathbb{R}} \\; \\dfrac{1}{n} \\sum_{i=1}^n \\ell\\left(\\langle a, x_i \\rangle + b, y_i\\right)';
	const iidModel = '(X_1, Y_1), \\dots, (X_n, Y_n) \\;\\overset{\\text{i.i.d.}}{\\sim}\\; P_{X,Y}';
	const RnDef = 'R_n(h) = \\dfrac{1}{n} \\sum_{i=1}^n \\ell\\left(h(X_i), Y_i\\right)';

	const accuracyDef =
		'\\text{Accuracy} = \\dfrac{\\text{TP} + \\text{TN}}{\\text{TP} + \\text{TN} + \\text{FP} + \\text{FN}}';
	const sensitivityDef = '\\text{Sensibilité} = \\dfrac{\\text{TP}}{\\text{TP} + \\text{FN}}';
	const precisionDef = '\\text{Précision} = \\dfrac{\\text{TP}}{\\text{TP} + \\text{FP}}';
	const f1Def =
		'\\text{F1} = 2\\,\\dfrac{\\text{Précision} \\cdot \\text{Rappel}}{\\text{Précision} + \\text{Rappel}} = \\dfrac{2\\,\\text{TP}}{2\\,\\text{TP} + \\text{FP} + \\text{FN}}';
	const specificityDef = '\\text{Spécificité} = \\dfrac{\\text{TN}}{\\text{TN} + \\text{FP}}';

	const macroAvg = '\\text{macro\\_average\\_score} = \\dfrac{1}{C} \\sum_{i=1}^C m_i';
	const weightAvg =
		'\\text{weight\\_average\\_score} = \\sum_{i=1}^C \\dfrac{m_i \\times \\text{support}_i}{\\text{nb. de données}}';

	const mseDef =
		'\\text{MSE} = \\dfrac{1}{n} \\sum_{i=1}^n \\left(y_i - \\widehat{h}(x_i)\\right)^2';
	const rmseDef =
		'\\text{RMSE} = \\sqrt{\\dfrac{1}{n} \\sum_{i=1}^n \\left(y_i - \\widehat{h}(x_i)\\right)^2}';

	const memorizationRule =
		'h(x) = \\begin{cases} y_i & \\text{si } x = x_i, \\; i \\in \\llbracket 1, n \\rrbracket \\\\ \\text{une valeur de } \\mathcal{Y} \\text{ choisie aléatoirement} & \\text{sinon} \\end{cases}';
	const memorizationError = '\\dfrac{1}{n} \\sum_{i=1}^n \\ell\\left(h(x_i), y_i\\right) = 0';

	const binomNP = '\\binom{n}{p}';
</script>

<svelte:head>
	<title
		>{meta?.title ?? 'Cadre de l’apprentissage supervisé & k-NN'} — Fondations de l'Apprentissage Statistique</title
	>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Cadre de l’apprentissage supervisé & k-NN'}
	subtitle="Le cadre de l'apprentissage supervisé et la méthode des k plus proches voisins"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Qu'est-ce que l'apprentissage automatique ?</h2>

		<p>
			L'apprentissage automatique (<em>machine learning</em>) regroupe des méthodes qui
			appartiennent à l'apprentissage statistique. La question est posée dès la première page de
			<em>Understanding Machine Learning</em> de Shalev-Shwartz &amp; Ben-David :
		</p>
		<Callout type="note" title="Définition (Shalev-Shwartz &amp; Ben-David, 2014)">
			<em
				>« We wish to program computers so that they can “learn” from input available to them. »</em
			>
			— On souhaite programmer des ordinateurs de telle sorte qu'ils puissent
			<em>apprendre</em> à partir des entrées mises à leur disposition.
		</Callout>
		<p>Deux formulations complémentaires de ce que « apprendre » veut dire :</p>
		<Callout type="note" title="Définitions">
			<ul>
				<li>
					<em
						>« Learning is the process of converting experience ( = data) into expertise or
						knowledge »</em
					> — l'apprentissage est le processus qui convertit l'expérience (les données) en savoir-faire
					ou en connaissance (Shalev-Shwartz &amp; Ben-David, 2014).
				</li>
				<li>
					« L'apprentissage est une modification d'un comportement sur la base d'une expérience »
					(Fabien Benureau, 2015, formulation reprise dans Azencott).
				</li>
			</ul>
		</Callout>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img src={asset('/images/part2/mouse.png')} alt="Souris" />
				<figcaption>Le rat : expérience classique d'apprentissage par association.</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/pigeon.png')} alt="Pigeon" />
				<figcaption>Le pigeon : une autre expérience classique d'apprentissage.</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Expériences évoquées par Shalev-Shwartz &amp; Ben-David (2014, pp. 19–21).
		</p>

		<p>
			Les diapositives ouvrent sur trois questions qui structureront cette leçon :
			<strong>qu'est-ce que l'apprentissage ?</strong>
			<strong>Pourquoi utiliser l'apprentissage automatique ?</strong>
			<strong>Quels sont les différents types d'apprentissage ?</strong>
		</p>

		<Callout type="warning" title="Information a priori">
			Il est souvent utile d'avoir recours à de l'<strong>information a priori</strong> : les connaissances
			que l'on a du problème avant de regarder les données orientent le choix du modèle.
		</Callout>

		<h3>Quelques exemples</h3>

		<figure class="figure-grid three-col">
			<figure class="lesson-figure">
				<img src={asset('/images/part2/guinesse.png')} alt="Chat" />
				<figcaption>
					Chat ou non ? — <a href="https://www.instagram.com/guinesse_thecat/?hl=fr">guinesse_thecat</a> (Instagram).
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/gorky.png')} alt="Corgi" />
				<figcaption>
					NON-CHAT : <a href="https://fr.wikipedia.org/wiki/Welsh_Corgi_Pembroke">Welsh Corgi Pembroke</a> (Wikipédia).
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/nombres.png')} alt="Grille de chiffres manuscrits" />
				<figcaption>Reconnaissance de chiffres manuscrits.</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/segmentation.png')} alt="Segmentation de marché" />
				<figcaption>
					Segmentation de marché : identifier des groupes d'usagers au comportement similaire afin
					de mieux comprendre leur profil.
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/clics.png')} alt="Prédiction de clics" />
				<figcaption>Prédiction de clics.</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/segmentationImage.png')} alt="Pixels regroupés en régions" />
				<figcaption>Segmentation d'image.</figcaption>
			</figure>
		</figure>
		<figure class="lesson-figure wide">
			<div class="triple-img">
				<img src={asset('/images/part2/compr.png')} alt="Version originale" />
				<img src={asset('/images/part2/compr2.png')} alt="Version compressée (16 couleurs)" />
				<img src={asset('/images/part2/compr3.png')} alt="Version compressée (4 couleurs)" />
			</div>
			<figcaption>
				Compression d'image : image originale, image compressée (16 couleurs), image compressée (4
				couleurs).
			</figcaption>
		</figure>
		<p class="attribution">
			Images tirées de la présentation de Chloé-Agathe Azencott, Mines de Paris (Fontainebleau,
			2019), de <a href="https://larevueia.fr/quest-ce-que-la-segmentation-dimages/">La revue IA</a>
			et de <a href="https://towardsdatascience.com/image-compression-using-k-means-clustering-aa0c91bb0eeb">Towards Data Science</a>, selon les diapositives.
		</p>

		<h3>Ingrédients et objectif</h3>

		<p>Deux ingrédients sont nécessaires à tout problème d'apprentissage :</p>
		<ul>
			<li><strong>Les données</strong> ;</li>
			<li>
				<strong>L'algorithme d'apprentissage</strong> : une procédure qui, à partir des données,
				produit ou fournit un <em>modèle</em>.
			</li>
		</ul>
		<p>
			Pour « chat ou non », le modèle estime si une photo est une photo de chat ou non ; pour la
			segmentation de marché, le modèle retourne des groupes d'individus.
		</p>

		<Callout type="warning" title="Garbage in, garbage out">
			Si les données ne sont pas pertinentes ou sont de mauvaise qualité, le modèle produit ne sera
			pas satisfaisant. Il est important que le <em>data scientist</em> prépare les données : supprimer
			les données aberrantes, gérer les données manquantes, sélectionner une représentation pertinente,
			etc.
		</Callout>

		<p>
			<strong>Objectif :</strong> modéliser un phénomène à partir de données ou d'exemples. Le
			modèle est obtenu en <strong>optimisant un certain critère</strong> — par exemple, minimiser les
			erreurs de classification pour « chat ou non », ou maximiser la proximité entre individus d'un même
			groupe pour la segmentation de marché.
		</p>

		<h3>Pourquoi utiliser le machine learning ?</h3>

		<p>L'apprentissage automatique peut servir à résoudre des problèmes :</p>
		<ul>
			<li>
				que l'on sait résoudre, mais dont on ne sait pas formaliser algorithmiquement la manière
				dont on les résout
				<em>(ex. : reconnaissance d'images, compréhension du langage naturel)</em> ;
			</li>
			<li>
				que l'on ne sait pas résoudre parce que les données sont complexes et volumineuses
				<em>(ex. : données astrophysiques, données génomiques)</em> ;
			</li>
			<li>
				que l'on sait résoudre, mais avec des procédures (déterministes) trop gourmandes en
				ressources informatiques
				<em>
					(ex. : prédiction d'interactions entre molécules de grande taille, pour lesquelles les
					simulations sont très lourdes)
				</em>
				.
			</li>
		</ul>

		<h2 id="types-apprentissage">Supervisé vs. non supervisé</h2>

		<p>Il existe deux principaux types d'apprentissage :</p>
		<ol>
			<li><strong>l'apprentissage supervisé</strong> ;</li>
			<li><strong>l'apprentissage non supervisé</strong>.</li>
		</ol>
		<p>
			Cette liste n'est pas du tout exhaustive : l'apprentissage automatique est un champ vaste, et
			d'autres types d'apprentissage existent, comme l'apprentissage semi-supervisé et
			l'apprentissage par renforcement.
		</p>

		<h3>Apprentissage supervisé</h3>
		<p>
			<strong>Contexte :</strong> on observe des <strong>données</strong>
			<KatexInline formula="x_1, \dots, x_n" /> pour <KatexInline formula="n" /> individus ainsi que des
			<strong>étiquettes</strong>
			<KatexInline formula="y_1, \dots, y_n" /> associées
			<em>(ex. : x_i = (âge, genre, diplôme) et y_i = salaire de l'individu i)</em>.
		</p>
		<p>
			<strong>Objectif :</strong> apprendre un modèle à partir de <KatexInline
				formula="(x_1, y_1), \dots, (x_n, y_n)"
			/>
			qui prédit (au mieux) l'étiquette <KatexInline formula="y" /> pour tout nouvel individu de donnée
			<KatexInline formula="x" />.
		</p>
		<p>
			L'analogie des diapositives : un <em>algorithme classique</em> (par exemple un modèle
			météorologique déterministe) reçoit les ingrédients et la recette, et produit le gâteau. Un
			<em>algorithme d'apprentissage supervisé</em> reçoit les ingrédients <em>et le gâteau</em>, et
			produit la <strong>recette</strong>.
		</p>

		<h3>Apprentissage non supervisé</h3>
		<p>
			<strong>Contexte :</strong> on observe des <strong>données</strong>
			<KatexInline formula="x_1, \dots, x_n" />
			pour <KatexInline formula="n" /> individus mais <strong>sans étiquettes</strong> associées (on dit
			qu'elles sont non étiquetées).
		</p>
		<p>
			<strong>Objectif :</strong> modéliser les observations <KatexInline
				formula="x_1, \dots, x_n"
			/>
			pour mieux les comprendre. En pratique, on détermine une fonction sur <KatexInline
				formula={String.raw`{x_1, \dots, x_n}`}
			/>
			qui vérifie certaines propriétés. Les principaux problèmes traités en apprentissage non supervisé
			sont :
		</p>
		<ul>
			<li>
				<strong>le clustering ou partitionnement</strong> (= classification non supervisée) :
				identifier des groupes dans les données, afin d'extraire de l'information sur leurs
				caractéristiques générales. Ce sera l'objet de la Partie III —
				<a href="/part3/lesson1">aperçu ici</a> ;
			</li>
			<li>
				<strong>la réduction de dimension</strong> : trouver une représentation des données dans un espace
				de dimension plus faible que celui d'origine, pour réduire les temps de calcul et l'espace mémoire,
				mieux visualiser les données, ou améliorer les performances d'un algorithme supervisé entraîné
				ensuite sur ces données ;
			</li>
			<li>
				<strong>l'estimation de densité</strong> : les données <KatexInline
					formula="x_1, \dots, x_n"
				/>
				étant supposées être des réalisations (indépendantes) d'une variable aléatoire <KatexInline
					formula="X"
				/>, il s'agit d'estimer sa loi à partir des données.
			</li>
		</ul>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img src={asset('/images/part2/genesGroupes.png')} alt="Gènes regroupés par clusters" />
				<figcaption>
					Clustering : identification de gènes similaires — permet de faire des hypothèses sur le
					rôle des gènes.
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/adnEurope.png')} alt="Génomes projetés en deux dimensions" />
				<figcaption>
					Réduction de dimension : visualisation de génomes en 2D — correspondance entre la
					structure des génomes et la position géographique des individus.
				</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Image de gènes tirée de la présentation de Chloé-Agathe Azencott (Mines de Paris,
			Fontainebleau, 2019) ; image de génomes tirée de l'article de November et al. (2008).
		</p>

		<h3>La suite de la partie</h3>
		<p>Dans la suite de cette partie II, on discute en détail de l'apprentissage supervisé :</p>
		<ul>
			<li>
				leçon 2 — classifieurs linéaires et régression logistique :
				<a href="/part2/lesson2">lien</a> ;
			</li>
			<li>
				leçon 3 — arbres de décision :
				<a href="/part2/lesson3">lien</a> ;
			</li>
			<li>
				leçon 4 — Support Vector Machines (SVM) :
				<a href="/part2/lesson4">lien</a> ;
			</li>
			<li>
				Partie III — clustering (non supervisé) :
				<a href="/part3/lesson1">lien</a>.
			</li>
		</ul>

		<InteractiveSection
			number="1.1"
			title="Quiz — supervisé ou non supervisé ?"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quizA} />
		</InteractiveSection>

		<h2 id="cadre-supervise">Cadre de l'apprentissage supervisé</h2>

		<p>
			<strong>Contexte :</strong> on observe une donnée <KatexInline
				formula={String.raw`x \in \mathcal{X}`}
			/>
			et on souhaite prédire son label associé <KatexInline
				formula={String.raw`y \in \mathcal{Y}`}
			/> qui n'a pas été observé
			<em>(ex. : x = (âge, genre, diplôme) et y = salaire pour un individu)</em>.
		</p>
		<ul>
			<li>
				<KatexInline formula="x" /> : donnée observée, donnée d'entrée, variables explicatives ;
			</li>
			<li>
				<KatexInline formula="y" /> : label, étiquette, cible, variable à expliquer, variable réponse.
			</li>
		</ul>

		<p>
			<strong>Objectif :</strong> trouver un <strong>modèle</strong> ou une
			<strong>règle de décision</strong>, c'est-à-dire une fonction (mesurable) <KatexInline
				formula={hMapping}
			/>, telle que <KatexInline formula="h(x)" />
			soit le plus proche possible de <KatexInline formula="y" />.
		</p>
		<p>
			<strong>Remarque :</strong> on va voir par la suite qu'une règle de décision <KatexInline
				formula="h"
			/>
			dépend (entre autres) du type de problème d'apprentissage supervisé considéré, c'est-à-dire de la
			nature de <KatexInline formula={calY} />, l'espace des labels.
		</p>

		<DefinitionBlock title="Types de problèmes selon la nature de 𝓎">
			<ul>
				<li>
					<KatexInline formula={String.raw`\mathcal{Y} \subset \mathbb{R}`} /> non fini :
					<strong>problème de régression</strong> ;
				</li>
				<li>
					<KatexInline formula={String.raw`\mathrm{Card}(\mathcal{Y}) = 2`} /> :
					<strong>problème de classification bivariée (binaire)</strong>. Quel que soit <KatexInline
						formula={calY}
					/>, on se ramène souvent aux cas <KatexInline
						formula={String.raw`\mathcal{Y} = \{0, 1\}`}
					/>
					ou <KatexInline formula={String.raw`\mathcal{Y} = \{-1, 1\}`} /> ;
				</li>
				<li>
					<KatexInline formula={String.raw`\mathrm{Card}(\mathcal{Y}) = C > 2`} /> :
					<strong>problème de classification multi-classe</strong>. Quel que soit <KatexInline
						formula={calY}
					/>, on se ramène souvent au cas <KatexInline
						formula={String.raw`\mathcal{Y} = \{1, \dots, C\}`}
					/>.
				</li>
			</ul>
		</DefinitionBlock>

		<ExampleBlock title="Identifier des spams">
			<p>
				Données : des e-mails ; étiquettes : SPAM ou NON-SPAM. C'est un problème de classification
				binaire.
			</p>
			<div class="triple-img two-up">
				<img src={asset('/images/part2/spam.jpeg')} alt="E-mail de spam" />
				<img src={asset('/images/part2/nonspam.jpeg')} alt="E-mail non-spam" />
			</div>
		</ExampleBlock>

		<InteractiveSection
			number="1.2"
			title="Quiz — régression ou classification ?"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quizB} />
		</InteractiveSection>

		<h2 id="knn">k-NN : exemple introductif</h2>

		<p>
			On observe des données <KatexInline formula={String.raw`x_1, \dots, x_n \in \mathcal{X}`} /> ainsi
			que des étiquettes <KatexInline formula={String.raw`y_1, \dots, y_n \in \mathcal{Y}`} /> et l'on
			souhaite estimer l'étiquette d'une nouvelle observation <KatexInline
				formula={String.raw`x \in \mathcal{X}`}
			/>.
		</p>
		<Callout type="intuition" title="Qui se ressemble s’assemble">
			On étiquette <KatexInline formula="x" /> en fonction des étiquettes <KatexInline
				formula="y_i"
			/>
			des <KatexInline formula="K" /> points <KatexInline formula="x_i" /> du jeu de données dont il est
			le plus proche.
		</Callout>
		<p>
			On note <KatexInline formula={`${calNK}(x)`} /> l'ensemble des <KatexInline formula="K" /> plus
			proches voisins de <KatexInline formula="x" /> parmi <KatexInline
				formula={String.raw`x_1, \dots, x_n`}
			/>.
		</p>

		<p>
			<strong>Algorithme des K plus proches voisins (KNN) — classification.</strong> Si
			<KatexInline formula={String.raw`\mathcal{Y} = \{1, \dots, C\}`} /> (problème de classification),
			<KatexInline formula="x" /> prend l'étiquette
			<strong>majoritaire</strong> parmi celles de ses <KatexInline formula="K" /> plus proches voisins
			:
		</p>
		<KatexBlock formula={knnClass} />
		<p>
			<strong>Algorithme des K plus proches voisins (KNN) — régression.</strong> Si
			<KatexInline formula={String.raw`\mathcal{Y} = \mathbb{R}`} /> (problème de régression),
			<KatexInline formula="x" /> prend comme étiquette la <strong>moyenne</strong> de celles de ses
			<KatexInline formula="K" /> plus proches voisins :
		</p>
		<KatexBlock formula={knnReg} />

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/knn.png')}
				alt="Points de deux classes A et B autour d'une requête"
			/>
			<figcaption>
				k-NN : avec <em>K</em> = 3, la classe B est prédite ; avec <em>K</em> = 7, la classe A est prédite.
			</figcaption>
		</figure>
		<p class="attribution">
			Image tirée du site <a href="https://www.ejable.com/tech-corner/ai-machine-learning-and-deep-learning/k-nearest-neighbors/">Ejable</a>
			(slides de Marine Demangeot).
		</p>

		<p><strong>Hyperparamètres du modèle :</strong></p>
		<ul>
			<li>
				la <strong>distance</strong> entre deux points <KatexInline formula="x" /> et
				<KatexInline formula="x'" /> (elle permet de déterminer <KatexInline
					formula={`${calNK}(x)`}
				/>) : elle est généralement choisie en fonction du type de données ; souvent on considère la
				distance euclidienne ;
			</li>
			<li>
				le <strong>nombre de voisins K</strong> considéré : il est choisi par
				<em>validation croisée</em> (section « Sélectionner un modèle » ci-dessous).
			</li>
		</ul>

		<InteractiveSection number="1.3" title="Explorateur k-NN" onInteract={tracker.trackInteraction}>
			<KNNClassifierExplorer />
		</InteractiveSection>

		<h3>Qualités et défauts</h3>

		<p>L'algorithme des <KatexInline formula="K" /> plus proches voisins est :</p>
		<ul>
			<li>simple à implémenter ;</li>
			<li>méthode non-paramétrique : pas d'hypothèses particulières sur le modèle ;</li>
			<li>
				peut s'adapter à de nombreux types de données, si une représentation et une distance adaptées sont définies ;
			</li>
			<li>
				intensif en temps de calcul : il faut calculer <KatexInline formula="n" /> distances (compléxité
				de l'ordre de <KatexInline formula={String.raw`O(nd)`} />
				avec <KatexInline formula={String.raw`\dim(\mathcal{X}) = d`} />) puis trouver les
				<KatexInline formula="K" /> plus petites de ces distances (compléxité de l'ordre de
				<KatexInline formula={String.raw`O(n \log K)`} />) ;
			</li>
			<li>
				susceptible de ne pas marcher en grande dimension, c'est-à-dire quand
				<KatexInline formula="d" />
				est grand (<em>fléau de la dimension</em>) — <em>Pourquoi ?</em>
			</li>
		</ul>

		<Callout
			type="insight"
			title="Pourquoi le fléau de la dimension ? (complément, au-delà du cours)"
		>
			<p>
				Les diapositives posent la question sans y répondre ; voici l'explication standard. En
				grande dimension, les <em>distances se concentrent</em> : pour des points tirés au hasard
				dans le cube
				<KatexInline formula={String.raw`[0,1]^d`} />, la distance au point le plus proche et celle
				au point le plus éloigné deviennent presque égales — le ratio
				<KatexInline formula={String.raw`d_{\min} / d_{\max}`} />
				tend vers 1 quand <KatexInline formula="d" />
				croît. La « proximité » sur laquelle repose k-NN perd alors son pouvoir discriminant, ce qui explique
				que la méthode puisse ne plus marcher quand <KatexInline formula="d" />
				est grand. La démo 1.4 illustre ce phénomène sur un échantillon fini.
			</p>
		</Callout>

		<InteractiveSection
			number="1.4"
			title="Fléau de la dimension"
			onInteract={tracker.trackInteraction}
		>
			<CurseOfDimensionalityDemo />
		</InteractiveSection>

		<Callout
			type="note"
			title="Standardisation préalable (complément, remarques du TP2 — au-delà du cours)"
		>
			Lorsque les variables des données ne sont pas à la même échelle (par exemple un âge et un
			salaire), la distance euclidienne est dominée par les variables à plus grande échelle. Il faut
			alors
			<strong>standardiser</strong> les données avant d'appliquer k-NN, par exemple par
			standardisation z-score de chaque variable : <KatexInline
				formula={String.raw`z = (x - \text{moyenne}) / \text{écart-type}`}
			/>.
		</Callout>

		<Callout type="definition" title="TP1 — La main à la pâte avec les KNN">
			<p>
				Faire le TP1 :
				<a href={asset('/rmd/TP1-KNN_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
					>TP1 — KNN (énoncé R Markdown)</a
				>.
			</p>
			<p>Deux remarques suite au TP ouvrent la suite de la leçon :</p>
			<ul>
				<li>besoin d'évaluer les performances des différents modèles possibles ;</li>
				<li>
					besoin d'évaluer les performances du modèle sur des données sur lesquelles la règle de
					décision ne dépend pas (donc non utilisées pour la construire).
				</li>
			</ul>
		</Callout>
		<p>
			L'algorithme des k plus proches voisins sera ensuite étudié rigoureusement — conditions de
			consistance du prédicteur k-NN (règle de Stone) — dans la
			<a href="/part7/lesson2">Partie VII</a>.
		</p>

		<h2 id="formulation-probabiliste">Formulation formelle</h2>

		<p>
			<strong>Objectif :</strong> trouver une <strong>règle de décision</strong>
			<KatexInline formula={hMapping} />
			(mesurable) telle que <KatexInline formula="h(x)" /> soit le plus proche possible de
			<KatexInline formula="y" />, <strong>pour n'importe quel</strong>
			<KatexInline formula={String.raw`x \in \mathcal{X}`} />.
		</p>
		<p>
			Puisqu'on ne veut pas fixer un <KatexInline formula="x" /> en particulier (on voudrait une règle
			de décision qui fonctionne dans n'importe quel cas), on modélise la variable
			<KatexInline formula="x" /> par un <strong>vecteur aléatoire</strong>
			<KatexInline formula="X" />.
		</p>
		<Callout type="warning" title="Même donnée, étiquette différente">
			Pour <KatexInline
				formula={String.raw`(x_1, y_1), (x_2, y_2) \in \mathcal{X} \times \mathcal{Y}`}
			/> tels que
			<KatexInline formula="x_1 = x_2" />, on peut observer <KatexInline
				formula={String.raw`y_1 \neq y_2`}
			/>
			<em
				>(ex. : erreurs lors de l'acquisition des données, manque d'informations, phénomène étudié
				de nature aléatoire)</em
			>.
		</Callout>
		<p>
			Sachant <KatexInline formula="X" />, on modélise la variable <KatexInline formula="y" /> par une
			variable aléatoire <KatexInline formula="Y" />. La loi de probabilité jointe de
			<KatexInline formula="(X, Y)" /> est notée <KatexInline formula={PXY} />.
		</p>
		<p>
			L'objectif devient alors : trouver <KatexInline formula={hMapping} /> (mesurable) telle que la
			<strong>distance entre</strong>
			<KatexInline formula="Y" /> et <KatexInline formula="h(X)" />
			soit la plus petite possible. Question : comment mesurer cette distance ?
		</p>

		<DefinitionBlock title="Fonction de coût">
			<p>
				Une fonction <KatexInline formula={costDef} /> est une <strong>fonction de coût</strong> si :
			</p>
			<KatexBlock formula={costProps} />
			<p>
				En pratique, on choisit <KatexInline formula={String.raw`\ell`} /> telle que, pour tout
				<KatexInline formula={String.raw`(x, y) \in \mathcal{X} \times \mathcal{Y}`} />,
				<KatexInline formula={String.raw`\ell\left(y, h(x)\right)`} />
				soit d'autant plus grande que <KatexInline formula="h(x)" /> est éloignée du (vrai) label
				<KatexInline formula="y" /> : <KatexInline formula={String.raw`\ell`} /> permet alors de quantifier
				la qualité d'une prédiction.
			</p>
		</DefinitionBlock>

		<ExampleBlock title="Exemples de fonctions de coût">
			<ul>
				<li>
					<KatexInline formula={String.raw`\ell(y, y') = |y - y'|`} /> (coût absolu) ;
				</li>
				<li>
					<KatexInline formula={String.raw`\ell(y, y') = (y - y')^2`} /> (coût quadratique) ;
				</li>
				<li>
					<KatexInline formula={String.raw`\ell(y, y') = \mathbb{1}\{y \neq y'\}`} /> (coût 0/1).
				</li>
			</ul>
		</ExampleBlock>

		<Callout type="warning" title="Une variable aléatoire, pas un nombre">
			<KatexInline formula={String.raw`\ell\left(Y, h(X)\right)`} /> est une variable aléatoire qui ne
			fournit pas une évaluation numérique de la distance entre <KatexInline formula="Y" /> et
			<KatexInline formula="h(X)" /> : on s'intéresse plutôt à son <strong>espérance</strong>.
		</Callout>

		<DefinitionBlock title="Risque">
			<p>
				Le <strong>risque</strong>
				<KatexInline formula="R" /> associé à une règle de décision
				<KatexInline formula="h" /> et à une fonction de coût <KatexInline
					formula={String.raw`\ell`}
				/> est donné par :
			</p>
			<KatexBlock formula={riskDef} />
			<p>
				Le risque <KatexInline formula="R(h)" /> fournit l'erreur moyenne de prévision que commet
				<KatexInline formula="h" /> sur l'ensemble des valeurs possibles
				<KatexInline formula={String.raw`x \in \mathcal{X}`} /> : il peut être vu comme une distance entre
				<KatexInline formula="h(X)" /> et <KatexInline formula="Y" />.
			</p>
		</DefinitionBlock>

		<p>L'objectif est de trouver la <strong>règle de décision optimale</strong> :</p>
		<KatexBlock formula={hStarDef} />
		<p>
			où <KatexInline formula={calF} /> est l'ensemble des fonctions <KatexInline
				formula={hMapping}
			/>
			mesurables.
		</p>

		<Callout type="warning" title="Une loi inconnue">
			Cette règle de décision optimale dépend de la <strong>loi</strong>
			<KatexInline formula={PXY} />
			<strong>qui est inconnue</strong>. Explicitons quand même cette fonction pour quelques
			fonctions de coût <KatexInline formula={String.raw`\ell`} /> usuelles.
		</Callout>

		<h3>Coût quadratique : la moyenne conditionnelle</h3>

		<p>
			Soit la fonction de coût <KatexInline formula={l2loss} />. En supposant que nous avons accès à
			<KatexInline formula={PXY} />, quelle est la règle de décision <KatexInline formula="h^*" />
			optimale, c'est-à-dire que vaut <KatexInline formula={hStarDef} /> ?
		</p>
		<p>
			Supposons que <KatexInline formula={PXY} /> admet une densité et que
			<KatexInline formula={quadAssumptions} />.
		</p>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				Par la formule de l'espérance totale (conditionnement sur <KatexInline formula="X" />) puis
				en écrivant les espérances comme des intégrales :
			</p>
			<KatexBlock formula={quadStep1} />
			<KatexBlock formula={quadStep2} />
			<p>
				Pour minimiser <KatexInline formula="R(h)" />, il suffit donc de minimiser, pour tout
				<KatexInline formula={String.raw`x \in \mathcal{X}`} />, la fonction
			</p>
			<KatexBlock formula={gxDef} />
			<p>
				Soient <KatexInline formula="g_x'" /> et <KatexInline formula="g_x''" /> les dérivées première
				et seconde de <KatexInline formula="g_x" /> respectivement :
			</p>
			<KatexBlock formula={gxDeriv} />
			<p>et</p>
			<KatexBlock formula={gxSecond} />
			<p>
				donc <KatexInline formula={String.raw`t = \mathbb{E}[Y \mid X = x]`} /> est un
				<strong>minimum global</strong> de <KatexInline formula="g_x" />.
			</p>
		</div>

		<TheoremBlock title="Résultat — règle optimale pour le coût quadratique">
			<p>
				La règle de décision optimale <KatexInline formula="h^*" /> qui minimise <KatexInline
					formula={String.raw`R(h) = \mathbb{E}_{P_{X,Y}}\left[(Y - h(X))^2\right]`}
				/>
				est donnée, pour tout <KatexInline formula={String.raw`x \in \mathcal{X}`} />, par
			</p>
			<KatexBlock formula={hStarL2} />
		</TheoremBlock>

		<InteractiveSection
			number="1.5"
			title="Régression conditionnelle — moyenne vs. médiane"
			onInteract={tracker.trackInteraction}
		>
			<ConditionalRegressionExplorer />
		</InteractiveSection>
		<p class="forward-ref">
			L'exploration ci-dessus, issue de la Partie VI, sera étudiée rigoureusement (théorème et
			preuve générale) dans la <a href="/part6/lesson2">leçon 2 de la Partie VI</a>.
		</p>

		<h3>Coût absolu et coût 0/1</h3>

		<Callout type="insight" title="Coût absolu : la médiane conditionnelle">
			<p>
				Soit <KatexInline formula={l1loss} />. La règle de décision optimale <KatexInline
					formula="h^*"
				/>
				qui minimise <KatexInline
					formula={String.raw`R(h) = \mathbb{E}_{P_{X,Y}}\left[\,|Y - h(X)|\,\right]`}
				/>
				est donnée, pour tout <KatexInline formula={String.raw`x \in \mathcal{X}`} />, par
			</p>
			<KatexBlock formula={hStarL1} />
			<p class="muted-note">
				Une médiane conditionnelle peut ne pas être unique ; toute médiane minimise alors le coût
				absolu.
			</p>
		</Callout>

		<Callout type="insight" title="Coût 0/1 : le classifieur de Bayes">
			<p>
				Soit <KatexInline formula={l01loss} />. La règle de décision optimale <KatexInline
					formula="h^*"
				/>
				qui minimise <KatexInline
					formula={String.raw`R(h) = \mathbb{E}_{P_{X,Y}}\left[\mathbb{1}[Y \neq h(X)]\right]`}
				/>
				est donnée, pour tout <KatexInline formula={String.raw`x \in \mathcal{X}`} />, par
			</p>
			<KatexBlock formula={hStar01} />
			<p>
				Elle est connue sous le nom de <strong>classifieur de Bayes</strong>. Sa démonstration
				rigoureuse (décomposition du risque conditionnel) est donnée dans la
				<a href="/part6/lesson1">leçon 1 de la Partie VI</a>.
			</p>
		</Callout>

		<InteractiveSection
			number="1.6"
			title="Décision bayésienne"
			onInteract={tracker.trackInteraction}
		>
			<BayesDecisionExplorer />
		</InteractiveSection>
		<p class="forward-ref">
			Widget repris de la <a href="/part6/lesson1">Partie VI</a> : le risque conditionnel des deux actions
			et le seuil η(x) = 1/2 qui définit le classifieur de Bayes.
		</p>

		<Callout type="warning" title="Pas d'accès à la règle optimale">
			La loi <KatexInline formula={PXY} /> est inconnue : quelle que soit la fonction de coût utilisée,
			nous n'avons pas accès à la règle de décision optimale <KatexInline formula="h^*" />.
			<strong>On va utiliser les données observées</strong>
			<KatexInline
				formula={String.raw`(x_1, y_1), \dots, (x_n, y_n) \in \mathcal{X} \times \mathcal{Y}`}
			/>.
		</Callout>

		<h2 id="risque-empirique">Minimisation empirique</h2>

		<p>
			<KatexInline formula="h^*" /> est inconnue. On va donc utiliser les données observées
			<KatexInline formula={String.raw`(x_1, y_1), \dots, (x_n, y_n)`} /> pour approcher
			<KatexInline formula="R(h)" /> par son <strong>estimation empirique</strong> :
		</p>
		<KatexBlock formula={empiricalRiskObs} />
		<p>L'objectif devient alors :</p>
		<KatexBlock formula={hatHDef} />
		<Callout type="note" title="Remarque">
			Plus le nombre d'observations est grand, meilleure est l'estimation empirique de
			<KatexInline formula="R(h)" />.
		</Callout>

		<p>
			En pratique, on cherche <KatexInline formula={String.raw`\hat{h}^*`} /> dans un sous-ensemble
			<KatexInline formula={`${calH} \\subset ${calF}`} />, car pour certaines raisons (nature du
			problème, sur-apprentissage) on pense qu'il est préférable de restreindre notre recherche à
			<KatexInline formula={calH} />. Le choix de <KatexInline formula={calH} /> représente donc une
			<strong>information a priori</strong> ; on appelle cela un <strong>biais inductif</strong>.
		</p>

		<ExampleBlock title="Modèles linéaires">
			<p>Avec <KatexInline formula={String.raw`\mathcal{X} \subset \mathbb{R}^d`} /> :</p>
			<KatexBlock formula={inductiveBias} />
			<p>
				Si <KatexInline formula={String.raw`\phi`} /> est la fonction identité, on est dans le cas de
				la
				<strong>régression linéaire</strong> : on cherche alors
			</p>
			<KatexBlock formula={linearRegressionOpt} />
			<p>
				Les solutions <KatexInline formula={String.raw`\widehat{a}`} /> et <KatexInline
					formula={String.raw`\widehat{b}`}
				/>
				s'expriment en fonction des données <KatexInline
					formula={String.raw`(x_1, y_1), \dots, (x_n, y_n)`}
				/>
				: les données permettent donc <em>d'apprendre</em> / <em>d'estimer</em> un modèle.
			</p>
		</ExampleBlock>

		<DefinitionBlock title="Estimateur empirique du risque">
			<p>
				On utilise les données <KatexInline formula={String.raw`(x_1, y_1), \dots, (x_n, y_n)`} /> car
				on fait l'hypothèse qu'elles peuvent être modélisées par des vecteurs aléatoires <KatexInline
					formula={iidModel}
				/>.
			</p>
			<p>
				Modéliser l'échantillon par des vecteurs aléatoires nous permet de prendre en compte
				l'incertitude liée à l'échantillonnage (le choix des <KatexInline formula="x_i" />) et
				l'incertitude sur les étiquettes <KatexInline formula="y_i" /> sachant les données
				<KatexInline formula="x_i" />. On introduit ainsi
				<strong>l'estimateur empirique du risque</strong>
				<KatexInline formula="R_n" /> défini par
			</p>
			<KatexBlock formula={RnDef} />
			<p>
				On peut alors s'intéresser aux propriétés des variables aléatoires <KatexInline
					formula="R_n(h)"
				/>
				et <KatexInline formula={String.raw`\arg\min_{h \in \mathcal{H}} R_n(h)`} />.
			</p>
		</DefinitionBlock>
		<p>
			Les propriétés de <KatexInline formula="R_n(h)" /> — en particulier le fait qu'elle converge vers
			<KatexInline formula="R(h)" /> et que la minimisation empirique produise un bon prédicteur — font
			l'objet de la <a href="/part8/lesson1">Partie VIII</a> (concentration et risque empirique).
		</p>

		<h2 id="metriques">Évaluer un modèle</h2>

		<p>
			À l'aide des données, on a appris un modèle <KatexInline formula="h" /> — par exemple un classifieur
			k-NN ou un modèle linéaire <KatexInline
				formula={String.raw`h(x) = \langle \hat{a}, x \rangle + \hat{b}`}
			/>.
			<strong>Question :</strong> quelles sont les performances de <KatexInline formula="h" /> ?
		</p>

		<DefinitionBlock title="Métrique">
			<p>
				Une <strong>métrique</strong> est un score qui permettra d'évaluer les performances d'un modèle.
			</p>
			<p>Les métriques choisies vont dépendre des données, du modèle et de la problématique.</p>
		</DefinitionBlock>

		<h3>Classification binaire</h3>

		<p>
			Dans le cas <KatexInline formula={String.raw`\mathcal{Y} = \{0, 1\}`} />, on commence par la
			<strong>matrice de confusion</strong> :
		</p>
		<table class="confusion-binary">
			<caption> Classe réelle en colonnes, classe prédite en lignes. </caption>
			<thead>
				<tr>
					<th colspan="2"></th>
					<th colspan="2">Classe réelle</th>
				</tr>
				<tr>
					<th colspan="2"></th>
					<th>0</th>
					<th>1</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th rowspan="2">Classe prédite</th>
					<th>0</th>
					<td>vrais négatifs (TN)</td>
					<td>faux négatifs (FN)</td>
				</tr>
				<tr>
					<th>1</th>
					<td>faux positifs (FP)</td>
					<td>vrais positifs (TP)</td>
				</tr>
			</tbody>
		</table>
		<ul>
			<li>
				<strong>Vrais positifs (TP)</strong> : exemples positifs correctement classifiés par le modèle
				;
			</li>
			<li>
				<strong>Vrais négatifs (TN)</strong> : exemples négatifs correctement classifiés par le modèle
				;
			</li>
			<li>
				<strong>Faux positifs (FP)</strong> : exemples négatifs étiquetés positifs par le modèle ;
			</li>
			<li>
				<strong>Faux négatifs (FN)</strong> : exemples positifs étiquetés négatifs par le modèle.
			</li>
		</ul>

		<p>
			<strong>Accuracy</strong> — proportion d'exemples bien classés :
		</p>
		<KatexBlock formula={accuracyDef} />
		<Callout type="warning" title="Attention aux données déséquilibrées">
			Utiliser l'accuracy comme métrique principale pour évaluer un modèle de classification peut
			poser problème lorsqu'on a des données déséquilibrées, car elle ne reflète pas la capacité du
			modèle à bien classer la classe minoritaire, qui peut être la classe « de plus grande
			importance ».
		</Callout>

		<p>
			<strong>Rappel ou sensibilité</strong> — proportion d'exemples positifs correctement classifiés,
			c'est-à-dire taux de vrais positifs :
		</p>
		<KatexBlock formula={sensitivityDef} />
		<Callout type="warning" title="Sensibilité facile à tricher">
			Il est facile d'avoir une bonne sensibilité en prédisant que tous les exemples sont positifs.
			On regarde donc aussi la précision.
		</Callout>

		<p>
			<strong>Précision</strong> — proportion de prédictions correctes parmi les prédictions positives
			:
		</p>
		<KatexBlock formula={precisionDef} />
		<Callout type="warning" title="Précision facile à tricher">
			On peut avoir une bonne précision (au détriment du rappel) en faisant très peu de prédictions
			positives, car cela réduit le risque qu'elles soient erronées.
		</Callout>

		<p>
			<strong>F-mesure ou F1-score</strong> — moyenne harmonique de la précision et du rappel :
		</p>
		<KatexBlock formula={f1Def} />

		<p>
			<strong>Spécificité</strong> — proportion d'exemples négatifs correctement classifiés, c'est-à-dire
			le taux de vrais négatifs :
		</p>
		<KatexBlock formula={specificityDef} />
		<Callout type="warning" title="Spécificité facile à tricher">
			Il est facile d'avoir une bonne spécificité en prédisant que tous les exemples sont négatifs.
			Il est donc également intéressant de regarder la spécificité et la sensibilité en même temps.
		</Callout>

		<p>
			<strong>AUC</strong> — l'aire sous la courbe ROC : elle mesure la capacité du modèle à séparer
			correctement les classes. La courbe ROC et l'AUC seront présentées dans la partie sur la
			régression logistique —
			<a href="/part2/lesson2">leçon 2 de cette partie</a>.
		</p>

		<InteractiveSection
			number="1.7"
			title="Matrice de confusion et métriques"
			onInteract={tracker.trackInteraction}
		>
			<ConfusionMatrixMetricsDemo />
		</InteractiveSection>

		<Callout
			type="note"
			title="Comparer à un modèle naïf (complément, notes des diapositives — au-delà du cours)"
		>
			Avant de se réjouir d'un score, comparez-le à un <strong>modèle naïf</strong> : en classification
			binaire, le modèle « prédire toujours la classe majoritaire » atteint une accuracy égale à la proportion
			de la classe majoritaire — un modèle qui ne fait pas mieux est inutile. Le préréglage « prédire
			toujours positif » de la démo 1.7 matérialise ce piège sur données déséquilibrées : sensibilité
			parfaite, accuracy égale à la proportion de positifs seulement.
		</Callout>

		<h3>Classification multiclasse</h3>

		<p>
			Dans le cas <KatexInline formula={String.raw`\mathcal{Y} = \{1, \dots, C\}`} />, la matrice de
			confusion est une matrice <KatexInline formula="M" /> avec <KatexInline formula="C" /> lignes et
			<KatexInline formula="C" /> colonnes, où <KatexInline formula={String.raw`M_{i,j}`} />
			représente le nombre d'exemples de la classe <KatexInline formula="i" /> pour lesquels l'étiquette
			<KatexInline formula="j" /> a été prédite :
		</p>
		<figure class="lesson-figure wide">
			<img src={asset('/images/part2/confusionC.png')} alt="Matrice de confusion multiclasse" />
			<figcaption>Matrice de confusion multiclasse C × C.</figcaption>
		</figure>

		<p>
			On peut calculer les métriques précédentes pour chaque classe
			<KatexInline formula={String.raw`i \in \{1, \dots, C\}`} /> en considérant que les autres classes
			forment une seule et même classe (stratégie <strong>One Versus All</strong>, OVA). On combine
			ensuite les métriques <KatexInline formula="m_i" /> de chaque classe pour obtenir un score global
			:
		</p>
		<ul>
			<li>
				<strong>Macro-average</strong> :
				<KatexBlock formula={macroAvg} />
				— permet de ne pas négliger les classes rares ;
			</li>
			<li>
				<strong>Weight-average</strong> :
				<KatexBlock formula={weightAvg} />
				— chaque classe est pondérée par son <em>support</em>, c'est-à-dire le nombre d'observations
				dans cette classe ; les classes très représentées ont beaucoup de poids ;
			</li>
			<li>
				<strong>Micro-average</strong> : correspond à l'accuracy, c'est-à-dire la proportion d'exemples
				bien classés.
			</li>
		</ul>
		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/average.png')}
				alt="Macro-average, weight-average et micro-average"
			/>
			<figcaption>Macro-average, weight-average et micro-average.</figcaption>
		</figure>

		<ExercisePanel number="1" title="Macro-average vs. micro-average">
			<p>
				Pour chacune des situations ci-dessous (précision par classe, stratégie One Versus All) :
			</p>
			<ol>
				<li>
					calculer la précision de cette classification multiclasse via la méthode du macro-average
					puis celle du micro-average ;
				</li>
				<li>
					commenter les résultats : quelle différence observe-t-on entre la méthode macro-average et
					la méthode micro-average ?
				</li>
			</ol>
			<table class="exercise-table">
				<caption>Effectifs (TP, FP) par classe</caption>
				<thead>
					<tr>
						<th></th>
						<th colspan="2">Situation 1</th>
						<th colspan="2">Situation 2</th>
					</tr>
					<tr>
						<th></th>
						<th>TP</th>
						<th>FP</th>
						<th>TP</th>
						<th>FP</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th>Classe A</th>
						<td>1</td>
						<td>1</td>
						<td>0</td>
						<td>2</td>
					</tr>
					<tr>
						<th>Classe B</th>
						<td>10</td>
						<td>90</td>
						<td>90</td>
						<td>10</td>
					</tr>
					<tr>
						<th>Classe C</th>
						<td>1</td>
						<td>1</td>
						<td>0</td>
						<td>2</td>
					</tr>
					<tr>
						<th>Classe D</th>
						<td>1</td>
						<td>1</td>
						<td>0</td>
						<td>2</td>
					</tr>
				</tbody>
			</table>
			{#snippet solution()}
				<p>
					La précision de la classe <KatexInline formula="i" /> (OVA) est
					<KatexInline formula={String.raw`m_i = TP_i / (TP_i + FP_i)`} />.
				</p>
				<p><strong>Situation 1 :</strong></p>
				<ul>
					<li>
						précisions par classe : <KatexInline
							formula={String.raw`m_A = 1/2, \quad m_B = 10/100 = 0{,}1, \quad m_C = 1/2, \quad m_D = 1/2`}
						/> ;
					</li>
					<li>
						macro-average : <KatexInline
							formula={String.raw`(0{,}5 + 0{,}1 + 0{,}5 + 0{,}5)/4 = 0{,}4`}
						/> ;
					</li>
					<li>
						micro-average : <KatexInline
							formula={String.raw`13 / (13 + 93) = 13/106 \approx 0{,}123`}
						/>, avec
						<KatexInline formula={String.raw`\sum_i TP_i = 13`} /> et
						<KatexInline formula={String.raw`\sum_i FP_i = 93`} />.
					</li>
				</ul>
				<p><strong>Situation 2 :</strong></p>
				<ul>
					<li>
						précisions par classe : <KatexInline
							formula={String.raw`m_A = 0/2 = 0, \quad m_B = 90/100 = 0{,}9, \quad m_C = 0, \quad m_D = 0`}
						/> ;
					</li>
					<li>
						macro-average : <KatexInline formula={String.raw`(0 + 0{,}9 + 0 + 0)/4 = 0{,}225`} /> ;
					</li>
					<li>
						micro-average : <KatexInline
							formula={String.raw`90 / (90 + 16) = 90/106 \approx 0{,}849`}
						/>.
					</li>
				</ul>
				<p><strong>Commentaire.</strong></p>
				<ul>
					<li>
						Situation 1 : le macro-average (<KatexInline formula={String.raw`0{,}4`} />) est
						<strong>plus élevé</strong> que le micro-average (<KatexInline
							formula={String.raw`13/106 \approx 0{,}123`}
						/>) — les trois petites classes A, C, D, correctement prédites à moitié, gonflent la
						moyenne simple et masquent la très mauvaise précision (0,1) de la classe dominante B.
					</li>
					<li>
						Situation 2 : le macro-average (<KatexInline formula={String.raw`0{,}225`} />) est
						<strong>plus faible</strong> que le micro-average (<KatexInline
							formula={String.raw`90/106 \approx 0{,}849`}
						/>) — la classe dominante B (précision 0,9) domine le micro-average, tandis que le
						macro-average pénalise les trois classes jamais prédites (précision 0).
					</li>
				</ul>
				<p>
					Les deux moyennes peuvent donc raconter des histoires opposées : le choix de la moyenne
					fait partie du choix de la métrique, et le macro-average est précisément celui qui «
					permet de ne pas négliger les classes rares ».
				</p>
			{/snippet}
		</ExercisePanel>

		<h3>Régression</h3>

		<p>
			Pour un problème de régression, les métriques habituelles sont le
			<strong>MSE</strong> (Mean Square Error) — la moyenne des erreurs — :
		</p>
		<KatexBlock formula={mseDef} />
		<p>et le <strong>RMSE</strong> (Root Mean Square Error) :</p>
		<KatexBlock formula={rmseDef} />

		<h2 id="generalisation">Sur-apprentissage et biais-variance</h2>

		<ExampleBlock title="Un algorithme par mémorisation">
			<p>
				On observe des données <KatexInline formula={String.raw`x_1, \dots, x_n \in \mathcal{X}`} /> ainsi
				que des étiquettes <KatexInline formula={String.raw`y_1, \dots, y_n \in \mathcal{Y}`} /> et l'on
				souhaite estimer l'étiquette d'une nouvelle observation <KatexInline
					formula={String.raw`x \in \mathcal{X}`}
				/>. Considérons l'algorithme dont la règle de décision est donnée par
			</p>
			<KatexBlock formula={memorizationRule} />
			<p>
				Cet algorithme a une erreur empirique nulle quelle que soit la fonction de coût
				<KatexInline formula={String.raw`\ell`} /> choisie :
			</p>
			<KatexBlock formula={memorizationError} />
			<p>
				Il fait donc de bonnes prédictions sur les données utilisées pour le construire, mais fera
				de très mauvaises prédictions pour toute nouvelle observation.
			</p>
		</ExampleBlock>

		<DefinitionBlock title="Capacité de généralisation">
			<p>
				On appelle <strong>capacité de généralisation</strong> la capacité d'un modèle à faire des prédictions
				correctes sur de nouvelles données, qui n'ont pas été utilisées pour le construire.
			</p>
		</DefinitionBlock>

		<p>Deux cas où les modèles généralisent mal :</p>
		<ul>
			<li>
				<strong>Sur-apprentissage</strong> : le modèle, plutôt que de capturer la nature des objets
				à étiqueter, modélise aussi le bruit et ne sera pas en mesure de généraliser — on dit que le
				modèle <em>sur-apprend</em>. Un modèle qui sur-apprend est généralement un modèle trop
				complexe, qui <em>colle</em> trop aux données car il a aussi capturé leur bruit ;
			</li>
			<li>
				<strong>Sous-apprentissage</strong> : le modèle est trop simple pour avoir de bonnes
				performances même sur les données utilisées pour le construire — on dit que le modèle
				<strong>sous-apprend</strong>.
			</li>
		</ul>
		<Callout type="note" title="Sources de bruit">
			Les données peuvent être bruitées par des erreurs de mesure, des erreurs d'étiquetage, ou
			parce que les variables mesurées ne suffisent pas à modéliser le phénomène qui nous intéresse.
		</Callout>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img
					src={asset('/images/part2/generalisation1.png')}
					alt="Courbes de sur-apprentissage et sous-apprentissage"
				/>
				<figcaption>
					Sur-apprentissage, sous-apprentissage et bon compromis (classification).
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/generalisation2.png')} alt="Ajustements de polynômes" />
				<figcaption>
					Sur-apprentissage, sous-apprentissage et bon compromis (régression polynomiale).
				</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Images tirées de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</p>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img src={asset('/images/part2/1NN_1.png')} alt="Frontière de décision 1-NN" />
				<figcaption>
					k-NN avec <em>K</em> = 1 : frontière très sinueuse — sur-apprentissage.
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/15NN.png')} alt="Frontière de décision 15-NN" />
				<figcaption>
					k-NN avec <em>K</em> = 15 : frontière plus lisse — bon compromis.
				</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Frontières de décision des k-NN pour de la classification binaire, tirées de l'ouvrage
			<em>The Elements of Statistical Learning</em>.
		</p>
		<p>
			Et quand <KatexInline formula="K = n" />, où <KatexInline formula="n" /> est le nombre de données
			observées ? <em>Réponse : sous-apprentissage.</em>
		</p>

		<h3>Compromis biais-variance avec les KNN</h3>

		<p>
			On entraîne un algorithme des <KatexInline formula="K" /> plus proches voisins à partir de données
			observées <KatexInline
				formula={String.raw`(x_1, y_1), \dots, (x_n, y_n) \in \mathbb{R}^d \times \{1, \dots, C\}`}
			/>
			et on note <KatexInline formula="h" /> le modèle résultant. La qualité du modèle
			<KatexInline formula="h" /> va dépendre du <strong>biais</strong> et de la
			<strong>variance</strong> qui lui sont associés ; on souhaiterait qu'ils soient les plus petits
			possible.
		</p>
		<ul>
			<li>
				<strong>Le biais</strong> de <KatexInline formula="h" /> correspond en quelque sorte à la capacité
				de <KatexInline formula="h" /> à bien prédire l'étiquette d'une nouvelle donnée
				<KatexInline formula="x" /> : est-ce que <KatexInline formula="h(x)" /> est loin ou non de sa
				vraie étiquette <KatexInline formula="y" /> (inconnue) ? Plus <KatexInline formula="h(x)" />
				vise à côté de <KatexInline formula="y" />, plus le biais est élevé ;
			</li>
			<li>
				<strong>La variance</strong> de <KatexInline formula="h" /> reflète la capacité du modèle à capturer
				le bruit dans les données, et donc à sur-apprendre. Dans ce cas, on observe une forte variation
				de <KatexInline formula="h(x)" /> en fonction des données d'entraînement
				<KatexInline formula={String.raw`(x_1, y_1), \dots, (x_n, y_n)`} />.
			</li>
		</ul>
		<ul>
			<li>
				<KatexInline formula="K" /> diminue : la <strong>variance augmente</strong>, le
				<strong>biais diminue</strong> ;
			</li>
			<li>
				<KatexInline formula="K" /> augmente : le <strong>biais augmente</strong>, la
				<strong>variance diminue</strong>.
			</li>
		</ul>
		<Callout type="insight" title="Un compromis">
			Lorsqu'on choisit <KatexInline formula="K" />, il y a un <strong>compromis</strong> à faire entre
			le biais et la variance.
		</Callout>

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/complexite1.png')}
				alt="Biais, variance et complexité du modèle"
			/>
			<figcaption>Biais, variance et complexité du modèle.</figcaption>
		</figure>
		<p class="attribution">
			Image trouvée sur <a href="https://openclassrooms.com/fr/courses/4011851-initiez-vous-au-machine-learning/4092326-trouvez-le-bon-compromis-entre-biais-et-variance">OpenClassrooms</a>.
		</p>

		<p>
			La décomposition formelle de l'erreur en biais et variance est donnée dans la
			<a href="/part9/lesson1">Partie IX</a>, et les conditions sous lesquelles le prédicteur k-NN
			est consistant (règle de Stone) dans la <a href="/part7/lesson2">Partie VII</a>.
		</p>

		<h2 id="selection-modele">Sélectionner un modèle</h2>

		<Callout type="warning" title="Rappel — le sur-apprentissage">
			Un modèle peut faire de très bonnes prédictions sur les données utilisées pour le construire,
			mais de très mauvaises prédictions pour de nouvelles observations.
		</Callout>
		<p>
			Évaluer un modèle demande des données étiquetées qui n'ont <strong>pas servi</strong> à le
			construire. Pour cela, on divise le jeu de données en un <strong>jeu d'apprentissage</strong>
			et un <strong>jeu de test</strong> réservé à l'évaluation finale :
		</p>
		<ul>
			<li>
				<strong>le jeu d'apprentissage</strong> : sous-ensemble des données sur lequel on va apprendre
				un modèle ;
			</li>
			<li>
				<strong>le jeu de test</strong> : sous-ensemble des données sur lequel on va évaluer le
				modèle sélectionné, sans l'utiliser pour ajuster les hyperparamètres.
			</li>
		</ul>
		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/trainingset.png')}
				alt="Découpage en jeu d'apprentissage et jeu de test"
			/>
			<figcaption>Jeu d'apprentissage et jeu de test.</figcaption>
		</figure>

		<Callout type="warning" title="Une séparation arbitraire">
			La séparation d'un jeu de données en un jeu d'entraînement et un jeu de test est arbitraire.
			Le risque est de créer, par hasard, des jeux de données qui ne sont pas représentatifs.
		</Callout>
		<p>
			On pourrait donc reproduire plusieurs fois la procédure apprentissage/test, puis moyenner les
			résultats obtenus. C'est l'idée de la <strong>validation croisée</strong> :
		</p>
		<ol>
			<li>
				on divise le jeu de données en <KatexInline formula="M" /> parties de tailles sensiblement similaires
				;
			</li>
			<li>
				pour chaque partie <KatexInline formula={String.raw`i \in \llbracket 1, M \rrbracket`} />,
				on entraîne un même modèle sur l'ensemble des autres <KatexInline formula="M - 1" /> parties,
				puis on évalue le modèle appris sur la partie <KatexInline formula="i" /> ;
			</li>
			<li>on moyenne les performances des <KatexInline formula="M" /> modèles appris.</li>
		</ol>
		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/crossvalidation.png')}
				alt="Principe de la validation croisée"
			/>
			<figcaption>Validation croisée K-fold.</figcaption>
		</figure>

		<p>Différentes manières de faire de la validation croisée :</p>
		<ul>
			<li>
				l'approche <strong>holdout</strong> : on divise le jeu de données en 2 — un jeu d'apprentissage
				et un jeu de test. Attention : si le test est trop petit, la variance de la métrique mesurée (par
				exemple le RMSE) va être grande, c'est-à-dire l'estimation de la performance du modèle fluctue
				beaucoup d'un échantillon à l'autre… Et si le test est trop grand, notre modèle ne voit pas assez
				de données ;
			</li>
			<li>
				l'approche <strong>K-fold</strong> (ci-dessus) : on divise le jeu de données en
				<KatexInline formula="K" /> groupes de taille sensiblement similaires ;
			</li>
			<li>
				l'approche <strong>Leave-p-out</strong> : on fixe la taille du jeu de test égale à
				<KatexInline formula="p" />, puis on teste toutes les combinaisons possibles
				<KatexInline formula={binomNP} /> ;
			</li>
			<li>
				cas particulier : l'approche <strong>Leave-1-out</strong> : le nombre de tests à faire est
				donc de taille <KatexInline formula={String.raw`\binom{n}{1} = n`} />.
			</li>
		</ul>

		<h3>Un troisième jeu de données ?</h3>
		<p>
			Pour un problème de classification binaire, on souhaite choisir entre 3 modèles différents
			(par exemple 1NN, 10NN, 15NN). On peut entraîner ces 3 modèles sur le jeu d'apprentissage,
			puis les évaluer sur le jeu de test, et sélectionner celui qui a la meilleure performance sur
			le jeu de test. Mais comment évaluer la performance générale de ce modèle choisi ? On a déjà
			utilisé le jeu de test pour sélectionner le modèle : il ne représente donc plus un jeu
			indépendant composé de données nouvelles.
		</p>
		<p>
			On divise donc le jeu de données en un <strong>jeu d'apprentissage</strong>, un
			<strong>jeu de validation</strong> et un <strong>jeu de test</strong> :
		</p>
		<ul>
			<li>
				<strong>le jeu d'apprentissage</strong> : sous-ensemble des données sur lequel on va apprendre
				des modèles ;
			</li>
			<li>
				<strong>le jeu de validation</strong> : sous-ensemble des données sur lequel on va évaluer les
				modèles (choix du modèle) ;
			</li>
			<li>
				<strong>le jeu de test</strong> : sous-ensemble des données sur lequel on va évaluer la performance
				du modèle choisi.
			</li>
		</ul>
		<Callout type="note" title="Remarque sur le nommage">
			Dans la littérature, <strong>le jeu de validation</strong> est très souvent utilisé pour
			ajuster les hyperparamètres et sélectionner le modèle, tandis que le <strong>jeu de test</strong>
			sert à estimer la performance finale. On inverse parfois les noms : l'important est de retenir
			qu'un jeu utilisé pour sélectionner un modèle ne doit plus être présenté comme une évaluation
			indépendante. Le troisième jeu sert à
			<strong>évaluer les performances d'un modèle sélectionné</strong>.
		</Callout>

		<Callout type="definition" title="TP2 — Toujours plus de KNN">
			<p>
				Faire le TP2 :
				<a href={asset('/rmd/TP2-KNN_enonce.Rmd')} target="_blank" rel="noopener noreferrer"
					>TP2 — KNN (énoncé R Markdown)</a
				>.
			</p>
			<p>Remarques suite au TP :</p>
			<ul>
				<li>
					besoin de standardiser les données lorsqu'elles ne sont pas à la même échelle (voir
					complément TP2) ;
				</li>
				<li>
					les métriques utilisées pour évaluer les performances des modèles (accuracy, F1-score) ne
					sont pas forcément équivalentes — c'est le cas par exemple lorsque les classes ne sont pas
					équilibrées ;
				</li>
				<li>
					importance d'évaluer les performances des modèles via un échantillon de validation, de
					préférence avec une procédure de validation croisée.
				</li>
			</ul>
		</Callout>

		<InteractiveSection
			number="1.8"
			title="Validation croisée"
			onInteract={tracker.trackInteraction}
		>
			<KnnCrossValidationSelector />
		</InteractiveSection>

		<Callout type="summary" title="Retenir">
			<p>
				L'apprentissage automatique convertit l'expérience (les données) en capacité de prédiction,
				en
				<strong>optimisant un critère</strong> — et la qualité des données conditionne tout (<em
					>garbage in, garbage out</em
				>).
			</p>
			<p>
				En apprentissage <strong>supervisé</strong>, on observe des couples
				<KatexInline formula="(x_i, y_i)" /> et on cherche une règle de décision
				<KatexInline formula={hMapping} /> ; la nature de <KatexInline formula={calY} /> distingue la
				régression, la classification binaire et la classification multi-classe.
			</p>
			<p>
				k-NN incarne le principe « <em>qui se ressemble s'assemble</em> » : vote majoritaire en
				classification, moyenne en régression ; hyperparamètres : la distance et
				<KatexInline formula="K" /> (choisi par validation croisée) ; défauts : coût
				<KatexInline formula={knnComplexity} /> et fléau de la dimension.
			</p>
			<p>
				La formalisation probabiliste introduit le <strong>risque</strong>
				<KatexInline formula={riskDef} />
				et la règle optimale <KatexInline formula="h^*" />, qui dépend de la loi inconnue
				<KatexInline formula={PXY} /> : coût quadratique
				<KatexInline formula={String.raw`\Rightarrow h^*(x) = \mathbb{E}[Y \mid X=x]`} />, coût
				absolu <KatexInline formula={String.raw`\Rightarrow`} />
				médiane conditionnelle, coût 0/1 <KatexInline formula={String.raw`\Rightarrow`} />
				classifieur de Bayes.
			</p>
			<p>
				Face à cette loi inconnue, on minimise le <strong>risque empirique</strong>
				<KatexInline formula={RnDef} />
				dans une classe <KatexInline formula={calH} /> (biais inductif), en modélisant l'échantillon comme
				i.i.d. selon <KatexInline formula={PXY} />.
			</p>
			<p>
				On évalue ensuite les performances avec des métriques adaptées — matrice de confusion,
				accuracy (prudence avec le déséquilibre !), sensibilité, précision, F1, spécificité,
				macro/micro-average, MSE/RMSE — et toujours en comparant à un modèle naïf.
			</p>
			<p>
				Enfin, la capacité de <strong>généralisation</strong> est le fil rouge : éviter le
				sur-apprentissage (modèle qui capture le bruit) et le sous-apprentissage, arbitrer le
				compromis biais-variance via <KatexInline formula="K" />, et sélectionner le modèle avec un
				jeu de test — de préférence par validation croisée et un troisième jeu de données.
			</p>
		</Callout>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Azencott, C. A.']}
			year={2011}
			title="Introduction au Machine Learning"
			journal="Dunod. ISBN : 978-2-10-084143-1."
			link="http://cazencott.info/dotclear/public/lectures/IntroML_Azencott.pdf"
		/>
		<BibElement
			authors={['Shalev-Shwartz, S.', 'Ben-David, S.']}
			year={2014}
			title="Understanding Machine Learning: From Theory to Algorithms"
			journal="Cambridge University Press."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer Science & Business Media, Second Edition."
			link="https://hastie.su.domains/ElemStatLearn/"
		/>
		<BibElement
			authors={['Novembre, J.', 'Johnson, T.', 'Bryc, K.', 'et al.']}
			year={2008}
			title="Genes mirror geography within Europe"
			journal="Nature, 456, 98–101. DOI : 10.1038/nature07331."
			link="https://www.nature.com/articles/nature07331"
		/>
		<BibElement
			authors={['Benureau, F. C.']}
			year={2015}
			title="L’auto-exploration des espaces sensorimoteurs chez les robots"
			journal="Thèse de doctorat."
			link="https://fabien.benureau.com/docs/phd_benureau.pdf"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.confusion-binary {
		width: 100%;
		max-width: 28rem;
		margin: 0.5rem auto;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.confusion-binary caption {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.confusion-binary th,
	.confusion-binary td {
		border: 1px solid var(--color-border);
		padding: 0.5rem 0.75rem;
		text-align: center;
	}

	.confusion-binary thead th,
	.confusion-binary tbody th {
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.confusion-binary td {
		color: var(--color-text);
	}

	.exercise-table {
		width: 100%;
		max-width: 30rem;
		margin: 0.75rem 0;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.exercise-table caption {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.exercise-table th,
	.exercise-table td {
		border: 1px solid var(--color-border);
		padding: 0.4rem 0.75rem;
		text-align: center;
	}

	.exercise-table thead th {
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.exercise-table tbody th {
		text-align: left;
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

	.forward-ref {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

</style>
