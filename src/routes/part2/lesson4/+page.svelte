<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';

	// Demo components
	import BiasVarianceDecomposition from '$lib/components/demos/BiasVarianceDecomposition.svelte';
	import RegularizationContour from '$lib/components/demos/RegularizationContour.svelte';
	import LassoPathExplorer from '$lib/components/demos/LassoPathExplorer.svelte';
	import ElasticNetBlend from '$lib/components/demos/ElasticNetBlend.svelte';
	import ShrinkageFactorDemo from '$lib/components/demos/ShrinkageFactorDemo.svelte';
	import IllConditionningExplosionDemo from '$lib/components/demos/IllConditionningExplosionDemo.svelte';

	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getNextPage, getPrevPage, type PageMeta } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';

	const meta = getPageByPath('/part2/lesson4');
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
			id: 'introduction-reg',
			label: 'Introduction à la régularisation',
			description: 'Overfitting et compromis biais-variance',
			color: 'neutral'
		},
		{
			id: 'ridge-regression',
			label: 'Ridge Regression (L2)',
			description: 'Pénalité quadratique et solution fermée',
			color: 'epistemic'
		},
		{
			id: 'lasso-regression',
			label: 'Lasso Regression (L1)',
			description: 'Solution sparse',
			color: 'belief'
		},
		{
			id: 'elastic-net',
			label: 'Elastic Net (L1 + L2)',
			description: 'Combinaison de Ridge et Lasso',
			color: 'positive'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'Comparatif Ridge, Lasso et Elastic Net',
			color: 'neutral'
		},
		{
			id: 'weight-decay',
			label: 'Weight decay',
			description: 'Régularisation L2 en deep lerning',
			color: 'agent'
		}
	];

	// ── Formula variables (stored in script so Svelte never parses backslashes) ──

	// Statistical model behind the loss — this is what was missing: the least-squares
	// term is not "just a distance", it is (up to a constant) the negative log-likelihood
	// under a linear-Gaussian model. Everything else in the page follows from this.
	const dataModel =
		'y = X w^{\\star} + \\varepsilon, \\qquad \\varepsilon \\sim \\mathcal{N}(0, \\sigma^2 I_n)';
	const negLogLik =
		'-\\log p(y \\mid X, w) = \\frac{1}{2\\sigma^2} \\|y - Xw\\|_2^2 + \\text{cste}(\\sigma^2)';

	// General regularized objective
	const generalObjective = '\\mathcal{L}(w) = \\frac{1}{n}\\|y - Xw\\|^2_2 + \\lambda \\, R(w)';

	// Bayesian / MAP derivation of Ridge and Lasso from priors on w
	const mapGeneral =
		'\\hat{w}_{\\text{MAP}} = \\arg\\max_w \\; \\log p(y \\mid X, w) + \\log p(w) = \\arg\\min_w \\; \\|y - Xw\\|_2^2 - 2\\sigma^2 \\log p(w)';
	const mapRidgePrior = 'w_j \\overset{\\text{iid}}{\\sim} \\mathcal{N}(0, \\tau^2)';
	const mapRidgeResult =
		'\\hat{w}_{\\text{MAP}} = \\arg\\min_w \\; \\|y - Xw\\|_2^2 + \\frac{\\sigma^2}{\\tau^2} \\|w\\|_2^2 \\quad\\Longrightarrow\\quad \\lambda = \\frac{\\sigma^2}{\\tau^2}';
	const mapLassoPrior = 'w_j \\overset{\\text{iid}}{\\sim} \\text{Laplace}(0, b)';
	const mapLassoResult =
		'\\hat{w}_{\\text{MAP}} = \\arg\\min_w \\; \\|y - Xw\\|_2^2 + \\frac{2\\sigma^2}{b} \\|w\\|_1 \\quad\\Longrightarrow\\quad \\lambda = \\frac{2\\sigma^2}{b}';

	// Bias-variance decomposition — conditioning made explicit: expectation is over
	// draws of the training set D, at a fixed query point x0, y0 = f(x0) + noise.
	const biasVarianceDecomp =
		'\\mathbb{E}_{D}\\bigl[(y_0 - \\hat{f}_D(x_0))^2 \\mid x_0\\bigr] = \\operatorname{Bias}^2\\bigl(\\hat{f}(x_0)\\bigr) + \\operatorname{Var}_D\\bigl(\\hat{f}(x_0)\\bigr) + \\sigma^2';

	// Ridge objective
	const ridgeObjective = '\\min_{w} \\; \\|y - Xw\\|^2_2 + \\lambda \\, \\|w\\|^2_2';

	// Ridge closed-form solution
	const ridgeSolution = 'w^{*}_{\\text{Ridge}} = (X^T X + \\lambda I)^{-1} X^T y';

	// Ridge in eigen-directions
	const ridgeEigenform =
		'\\hat{w}_i^{\\text{Ridge}} = \\frac{d_i}{d_i + \\lambda} \\; \\hat{w}_i^{\\text{OLS}}';

	// Shrinkage factor
	const shrinkageFactor = 'S_i(\\lambda) = \\frac{d_i}{d_i + \\lambda}';

	// Effective degrees of freedom of Ridge — the classical (non-CV) bridge to AIC/Cp
	const effectiveDf =
		'\\operatorname{df}(\\lambda) = \\sum_{i=1}^{p} \\frac{d_i}{d_i + \\lambda} = \\operatorname{tr}\\bigl(X(X^TX+\\lambda I)^{-1}X^T\\bigr)';
	const aicRidge =
		'\\operatorname{AIC}(\\lambda) = n \\log(\\hat\\sigma^2_\\lambda) + 2\\,\\operatorname{df}(\\lambda)';

	// Lasso objective
	const lassoObjective = '\\min_{w} \\; \\|y - Xw\\|^2_2 + \\lambda \\, \\|w\\|_1';

	// Soft-thresholding operator
	const softThreshold = 'S(w, \\lambda) = \\operatorname{sign}(w) \\cdot \\max(|w| - \\lambda, 0)';

	// Lasso with orthonormal features
	const lassoOrtho =
		'\\hat{w}_i^{\\text{Lasso}} = \\operatorname{sign}(\\hat{w}_i^{\\text{OLS}}) \\cdot \\max\\bigl(|\\hat{w}_i^{\\text{OLS}}| - \\lambda, 0\\bigr)';

	// Elastic Net objective
	const elasticNetObjective =
		'\\min_{w} \\; \\|y - Xw\\|^2_2 + \\lambda \\alpha \\, \\|w\\|_1 + \\frac{\\lambda(1-\\alpha)}{2}\\|w\\|^2_2';

	// Cross-validation error
	const cvError =
		'\\operatorname{CV}(\\lambda) = \\frac{1}{K} \\sum_{k=1}^{K} \\frac{1}{n_k} \\sum_{i \\in \\text{fold}_k} (y_i - \\hat{f}_{-k}(x_i))^2';

	// Lambda opt
	const lambdaOpt =
		'\\hat{\\lambda}_{\\text{opt}} = \\operatorname*{arg\\,min}_{\\lambda} \\; \\operatorname{CV}(\\lambda)';

	// One standard error rule (s_opt is now defined here too, so it is never typed
	// inline again — that inline copy was the source of the KaTeX escaping bug below)
	const oneSeRule =
		'\\hat{\\lambda}_{1se} = \\max \\bigl\\{ \\lambda : \\operatorname{CV}(\\lambda) \\leq \\operatorname{CV}(\\hat{\\lambda}_{\\text{opt}}) + s_{\\text{opt}} \\bigr\\}';
	const sOptDef = 's_{\\text{opt}}';

	// Ridge constraint geometry — was inconsistently using "d" for the ambient
	// dimension while the rest of the page (and DefinitionBlock 8.1/8.2) uses "p"
	const ridgeConstraint = '\\sum_{i=1}^{p} w_i^2 \\leq t';

	// Lasso constraint geometry
	const lassoConstraint = '\\sum_{i=1}^{p} |w_i| \\leq t';

	// Coordinate descent update for Lasso
	const coordDescentUpdate = 'w_j^{(k+1)} = \\frac{S\\bigl(z_j, \\lambda\\bigr)}{X_j^T X_j}';

	// z_j in coordinate descent
	const zJ = 'z_j = X_j^T (y - \\sum_{i \\neq j} X_i w_i^{(k)})';

	// Elastic net alpha limits
	const alphaPureLasso = '\\alpha = 1 \\;\\Rightarrow\\; \\text{Lasso pur}';
	const alphaPureRidge = '\\alpha = 0 \\;\\Rightarrow\\; \\text{Ridge pur}';

	// Exercise formulas
	const exW_ols = 'w^{OLS} = \\begin{pmatrix} 3.0 \\\\ -1.5 \\\\ 0.8 \\end{pmatrix}';
	const exLambdaVal = '\\lambda = 1.0';

	// Weight decay — descente de gradient sur la perte L2-régularisée
	const l2GradObjective =
		'\\mathcal{L}_{\\text{reg}}(w) = \\mathcal{L}(w) + \\frac{\\lambda}{2} \\|w\\|_2^2';
	const l2GradUpdate = 'w_{t+1} = w_t - \\eta \\nabla_w \\mathcal{L}(w_t) - \\eta \\lambda \\, w_t';
	const weightDecayUpdate =
		'w_{t+1} = \\underbrace{(1 - \\eta\\lambda)}_{\\text{decay factor} \\, < 1} \\, w_t \\; - \\; \\eta \\nabla_w \\mathcal{L}(w_t)';
	const pureDecayLimit =
		'\\nabla_w \\mathcal{L}(w_t) = 0 \\;\\Longrightarrow\\; w_{t+1} = (1-\\eta\\lambda)\\, w_t';

	// AdamW — decoupled weight decay (Loshchilov & Hutter 2019)
	const adamL2Coupled =
		'\\tilde{g}_t = \\nabla_w \\mathcal{L}(w_t) + \\lambda w_t \\quad (\\text{puis } \\tilde{g}_t \\text{ passe dans Adam})';
	const adamWDecoupled =
		'w_{t+1} = w_t - \\eta \\, \\hat{m}_t / (\\sqrt{\\hat{v}_t} + \\epsilon) \\; - \\; \\eta \\lambda \\, w_t';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Régularisation L1/L2/Elastic Net'}
	subtitle="Contrôler le biais-variance avec Ridge, Lasso, Elastic Net et validation croisée"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ═══════════════════════════════════════════ -->
	<!-- SECTION 1 : Modèle, introduction & Bias-Variance -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<TableOfContents entries={tocEntries} />
		<h2 id="introduction-reg">Introduction à la régularisation</h2>

		<p>
			Lorsque le nombre de variables <strong>p</strong> approche ou dépasse celui des observations
			<strong>n</strong>, le modèle risque de s'ajuster à du bruit plutôt qu'au signal réel. On
			observe alors un phénomène d'<em>overfitting</em>, caractérisé par une excellente performance
			sur les données d'entraînement mais une capacité de généralisation très faible. La
			<strong>régularisation</strong> est la technique fondamentale qui permet de contrôler ce compromis
			entre biais et variance.
		</p>

		<h3>Le modèle statistique sous-jacent</h3>

		<p>
			Avant d'écrire la moindre pénalité, il faut fixer ce que l'on suppose sur les données. On se
			place dans le modèle linéaire gaussien classique :
		</p>

		<KatexBlock formula={dataModel} />

		<p>
			où <KatexInline formula={'w^{\\star}'} /> est le vecteur de coefficients inconnu que l'on cherche
			à estimer. Sous ce modèle, la vraisemblance des données est gaussienne, et sa log-vraisemblance
			négative s'écrit :
		</p>

		<KatexBlock formula={negLogLik} />

		<DefinitionBlock number="8.0" title="Moindres carrés = maximum de vraisemblance">
			<p>
				Minimiser <KatexInline formula={'\\|y - Xw\\|_2^2'} /> n'est donc pas un choix arbitraire de distance
				: c'est exactement le <strong>maximum de vraisemblance (MLE)</strong> sous le modèle
				linéaire gaussien. Cette observation est ce qui permet, plus loin, d'interpréter la
				régularisation comme l'ajout d'un <strong>a priori</strong> sur w plutôt que comme une pénalité
				ad hoc.
			</p>
		</DefinitionBlock>

		<Callout type="warning" title="Standardiser avant de régulariser">
			<p>
				Le terme de pénalité <KatexInline formula={'R(w)'} /> traite chaque coefficient symétriquement,
				mais <KatexInline formula={'w_j'} /> dépend de l'échelle de la variable
				<KatexInline formula={'X_j'} />. Sans standardisation (centrer-réduire chaque colonne de X),
				<KatexInline formula={'\\lambda'} /> pénalise arbitrairement plus fort les variables mesurées
				dans de petites unités. En pratique, on standardise systématiquement X avant Ridge, Lasso ou Elastic
				Net, et on ne pénalise jamais l'intercept.
			</p>
		</Callout>

		<h3>Décomposition biais-variance</h3>

		<p>
			Pour comprendre pourquoi la régularisation fonctionne, il faut d'abord rappeler la
			décomposition classique de l'erreur quadratique moyenne attendue, en un point de requête
			<KatexInline formula={'x_0'} /> fixé, l'espérance étant prise sur les tirages aléatoires de l'ensemble
			d'entraînement <KatexInline formula={'D'} /> :
		</p>

		<KatexBlock formula={biasVarianceDecomp} />

		<p>
			Où <strong>Biais</strong> mesure à quel point notre estimateur est systématiquement éloigné de
			la vérité (erreur asymptotique),
			<strong>Variance</strong> mesure sa sensibilité aux fluctuations de D, et
			<KatexInline formula={'\\sigma^2'} /> est le bruit irréductible, hérité du modèle ci-dessus. La
			régularisation agit en augmentant légèrement le biais pour réduire drastiquement la variance.
		</p>

		<h3>Forme générale d'un problème régularisé</h3>

		<p>
			On ajoute à la perte empirique un terme de pénalité <em>R(w)</em>, pondéré par le paramètre de
			régularisation
			<KatexInline formula={'\\lambda \\geq 0'} /> :
		</p>

		<KatexBlock formula={generalObjective} />

		<p>
			Les choix les plus courants pour R(w) sont la norme L2 (Ridge), la norme L1 (Lasso), ou une
			combinaison des deux (Elastic Net). Le paramètre <KatexInline formula={'\\lambda'} /> contrôle l'intensité
			de la régularisation : plus il est élevé, plus les coefficients sont contraints vers zéro.
		</p>

		<ExpertPanel title="Dérivation bayésienne : régularisation comme MAP">
			<p>
				L'intuition « la pénalité L2 est un prior gaussien, la pénalité L1 est un prior de Laplace »
				n'est pas une métaphore : c'est une dérivation exacte. Sous un prior <KatexInline
					formula={'p(w)'}
				/> sur les coefficients, l'estimateur du <strong>maximum a posteriori (MAP)</strong> maximise
				la log-vraisemblance plus le log-prior, ce qui, en combinant avec la log-vraisemblance gaussienne
				ci-dessus, donne :
			</p>
			<KatexBlock formula={mapGeneral} />
			<p>
				<strong>Cas Ridge.</strong> Sous un prior gaussien indépendant sur chaque coefficient,
			</p>
			<KatexBlock formula={mapRidgePrior} />
			<p>
				le MAP se réduit exactement à l'objectif Ridge, avec une correspondance explicite entre λ et
				le rapport des variances :
			</p>
			<KatexBlock formula={mapRidgeResult} />
			<p>
				<strong>Cas Lasso.</strong> Sous un prior de Laplace (double-exponentielle), dont la densité a
				un pic pointu en zéro,
			</p>
			<KatexBlock formula={mapLassoPrior} />
			<p>le MAP se réduit à l'objectif Lasso :</p>
			<KatexBlock formula={mapLassoResult} />
			<p>
				C'est ce pic pointu du prior de Laplace en <KatexInline formula={'w_j = 0'} /> — la densité gaussienne,
				elle, est plate en zéro — qui est la raison probabiliste profonde pour laquelle le MAP sous Laplace
				produit des coefficients exactement nuls alors que le MAP sous gaussien n'en produit jamais. L'argument
				géométrique du diamant, présenté plus loin, en est la contrepartie visuelle.
			</p>
		</ExpertPanel>

		<InteractiveSection
			number="8.1"
			title="Décomposition biais-variance"
			onInteract={tracker.trackInteraction}
		>
			<BiasVarianceDecomposition />
		</InteractiveSection>
	</TheorySection>

	<!-- ═══════════════════════════════════════════ -->
	<!-- SECTION 2 : Ridge Regression (L2)          -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="ridge-regression">Ridge Regression (Régularisation L2)</h2>

		<p>
			Introduite par Hoerl &amp; Kennard en 1970, la <strong>Ridge Regression</strong> ajoute une pénalité
			quadratique sur les coefficients. C'est la forme de régularisation la plus classique et elle dispose
			d'une solution fermée élégante.
		</p>

		<DefinitionBlock number="8.1" title="Ridge Regression">
			<p>
				Soit <KatexInline formula={'y \\in \\mathbb{R}^n'} /> le vecteur réponse et
				<KatexInline formula={'X \\in \\mathbb{R}^{n \\times p}'} /> la matrice de design, dont les colonnes
				sont supposées centrées-réduites. Le solveur Ridge minimise :
			</p>
			<KatexBlock formula={ridgeObjective} />
			<p>
				où <KatexInline formula={'\\lambda > 0'} /> est le paramètre de régularisation. La contrainte
				équivalente en formulation bornée est :
			</p>
			<KatexBlock formula={ridgeConstraint} />
		</DefinitionBlock>

		<h3>Solution fermée</h3>

		<p>Deriver l'objectif par rapport à w et égaliser à zéro donne une solution analytique :</p>

		<KatexBlock formula={ridgeSolution} />

		<p>
			Cette formule est valable même lorsque <KatexInline formula={'X^T X'} /> est singulière (ce qui
			arrive quand p > n). Le terme <KatexInline formula={'\\lambda I'} /> garantit que la matrice à inverser
			est toujours définie positive.
		</p>

		<h3>Interprétation géométrique</h3>

		<p>
			Dans l'espace des coefficients, les courbes de niveau de la fonction MSE sont des ellipses
			centrées sur le solveur OLS. La contrainte Ridge est un <strong>cercle</strong> (en 2D) centré
			à l'origine. La solution Ridge est le point de contact entre l'ellipse de MSE minimale et le
			disque de contrainte. Plus <KatexInline formula={'\\lambda'} /> augmente, plus le cercle rétrécit,
			forçant les coefficients vers zéro sans jamais les atteindre exactement.
		</p>

		<InteractiveSection
			number="8.2"
			title="Contours de régularisation"
			onInteract={tracker.trackInteraction}
		>
			<RegularizationContour />
		</InteractiveSection>

		<h3>Réduction dans les directions propres</h3>

		<p>
			Si on exprime le problème dans la base des vecteurs propres de <KatexInline
				formula={String.raw`X^\top X`}
			/> avec valeurs propres
			<KatexInline formula={'d_1 \\geq d_2 \\geq \\dots \\geq d_p > 0'} />, chaque direction est
			affectée indépendamment par un facteur de rétrécissement :
		</p>

		<KatexBlock formula={ridgeEigenform} />

		<p>Le facteur de rétrécissement pour la direction i est :</p>

		<KatexBlock formula={shrinkageFactor} />

		<p>
			Ce facteur vaut 1 quand <KatexInline formula={'\\lambda = 0'} /> (solution OLS inchangée) et tend
			vers 0 quand
			<KatexInline formula={'\\lambda \\to +\\infty'} />. Les directions avec de petites valeurs
			propres sont plus fortement réduites, ce qui stabilise l'inversion matricielle.
		</p>

		<InteractiveSection
			number="8.5"
			title="Facteurs de rétrécissement"
			onInteract={tracker.trackInteraction}
		>
			<ShrinkageFactorDemo />
		</InteractiveSection>

		<h3>Degrés de liberté effectifs</h3>

		<p>
			Sommer les facteurs de rétrécissement sur toutes les directions propres donne une quantité qui
			généralise, pour Ridge, la notion de « nombre de paramètres » d'un modèle linéaire classique :
		</p>

		<KatexBlock formula={effectiveDf} />

		<p>
			<KatexInline formula={'\\operatorname{df}(\\lambda)'} /> vaut exactement p quand
			<KatexInline formula={'\\lambda = 0'} /> (OLS complet) et tend vers 0 quand
			<KatexInline formula={'\\lambda \\to +\\infty'} />. C'est ce qui permet, sans recourir à la
			validation croisée, de sélectionner λ par un critère classique de type AIC ou C<sub>p</sub> de Mallows
			:
		</p>

		<KatexBlock formula={aicRidge} />

		<Callout type="summary" title="Ridge en résumé">
			<ul>
				<li><strong>Solution fermée :</strong> toujours calculable via la formule matricielle</li>
				<li>
					<strong>Rétrécissement uniforme :</strong> réduit tous les coefficients vers zéro mais ne les
					annule jamais
				</li>
				<li>
					<strong>Idéal quand :</strong> beaucoup de variables sont corrélées et toutes contribuent à
					la prédiction
				</li>
			</ul>
		</Callout>
	</TheorySection>

	<ExpertPanel title="Analyse Mathématique : Conditionnement et Régularisation L2">
		<p>
			Le phénomène d'explosion visuel de la démonstration ci-dessous s'explique entièrement par la
			théorie du
			<strong>conditionnement matriciel</strong>. Dans cette section, nous allons dériver
			rigoureusement les équations qui régissent cette instabilité et démontrer mathématiquement
			comment la régularisation Ridge résout ce problème.
		</p>

		<h3>1. Le conditionnement d'un système linéaire</h3>
		<p>
			Considérons le système linéaire <KatexInline formula={String.raw`Ax = y`} /> où
			<KatexInline formula={String.raw`A \in \mathbb{R}^{p \times p}`} /> est une matrice inversible.
			Supposons que le vecteur de mesures
			<KatexInline formula={String.raw`y`} /> soit entaché d'une perturbation minuscule <KatexInline
				formula={String.raw`\delta y`}
			/> (erreur de mesure ou d'arrondi numérique), entraînant une erreur <KatexInline
				formula={String.raw`\delta x`}
			/> sur la solution retrouvée, de sorte que :
		</p>
		<KatexBlock
			formula={String.raw`A(x + \delta x) = y + \delta y \implies A\delta x = \delta y \implies \delta x = A^{-1}\delta y`}
		/>
		<p>
			En prenant la norme de ces équations et en appliquant les propriétés de sous-multiplicativité
			des normes matricielles induites, on obtient d'une part :
		</p>
		<KatexBlock formula={String.raw`\|\delta x\| \le \|A^{-1}\| \cdot \|\delta y\|`} />
		<p>
			Et d'autre part, comme <KatexInline formula={String.raw`\|y\| \le \|A\| \cdot \|x\|`} />, on a
			l'inégalité <KatexInline formula={String.raw`\frac{1}{\|x\|} \le \frac{\|A\|}{\|y\|}`} />. En
			combinant ces deux résultats, on obtient la borne de sensibilité fondamentale :
		</p>
		<KatexBlock
			formula={String.raw`\frac{\|\delta x\|}{\|x\|} \le \left( \|A\| \cdot \|A^{-1}\| \right) \frac{\|\delta y\|}{\|y\|}`}
		/>

		<p>
			Le terme multiplicatif entre parenthèses est défini comme le <strong>conditionnement</strong>
			de la matrice <KatexInline formula={String.raw`A`} />, noté <KatexInline
				formula={String.raw`\kappa(A)`}
			/> :
		</p>
		<DefinitionBlock number="8.4" title="Conditionnement d'une matrice (norme L2)">
			<KatexBlock
				formula={String.raw`\kappa(A) = \|A\|_2 \cdot \|A^{-1}\|_2 = \frac{\sigma_{\max}(A)}{\sigma_{\min}(A)}`}
			/>
			<p>
				Où <KatexInline formula={String.raw`\sigma_{\max}(A)`} /> et <KatexInline
					formula={String.raw`\sigma_{\min}(A)`}
				/> sont respectivement la plus grande et la plus petite valeur singulière de <KatexInline
					formula={String.raw`A`}
				/>.
			</p>
		</DefinitionBlock>

		<h3>2. Application numérique à l'exemple de la démo</h3>
		<p>Dans notre démonstration interactive, nous utilisons la matrice :</p>
		<KatexBlock
			formula={String.raw`A = \begin{pmatrix} 1.98 & 2.00 \\ 1.00 & 1.01 \end{pmatrix}, \quad \det(A) = 1.98 \times 1.01 - 2.00 \times 1.00 = -0.0002`}
		/>
		<p>
			L'inversion exacte de <KatexInline formula={String.raw`A`} /> par la formule analytique de la comatrice
			donne :
		</p>
		<KatexBlock
			formula={String.raw`A^{-1} = \frac{1}{-0.0002} \begin{pmatrix} 1.01 & -2.00 \\ -1.00 & 1.98 \end{pmatrix} = \begin{pmatrix} -5050 & 10000 \\ 5000 & -9900 \end{pmatrix}`}
		/>
		<p>
			Les valeurs singulières de <KatexInline formula={String.raw`A`} /> sont environ <KatexInline
				formula={String.raw`\sigma_{\max} \approx 3.003`}
			/> et
			<KatexInline formula={String.raw`\sigma_{\min} \approx 0.000067`} />, ce qui donne un
			conditionnement gigantesque :
		</p>
		<KatexBlock formula={String.raw`\kappa(A) \approx 15\,000`} />
		<p>
			Une simple erreur d'arrondi sur la mesure de <KatexInline formula={String.raw`y`} />, passant
			du vecteur exact <KatexInline formula={String.raw`y = (3.98, 2.01)`} /> à sa version arrondie
			<KatexInline formula={String.raw`y_{\text{arrondi}} = (4.00, 2.00)`} />, produit une
			perturbation <KatexInline formula={String.raw`\delta y = (0.02, -0.01)`} /> de norme extrêmement
			faible :
			<KatexInline formula={String.raw`\|\delta y\|_2 \approx 0.022`} /> (soit environ <KatexInline
				formula={String.raw`0.5\%`}
			/> d'erreur relative). Cependant, l'erreur sur <KatexInline formula={String.raw`x`} /> est projetée
			dans la direction d'instabilité :
		</p>
		<KatexBlock
			formula={String.raw`\delta x = A^{-1}\delta y = \begin{pmatrix} -5050 & 10000 \\ 5000 & -9900 \end{pmatrix} \begin{pmatrix} 0.02 \\ -0.01 \end{pmatrix} = \begin{pmatrix} -201 \\ 199 \end{pmatrix}`}
		/>
		<p>
			L'erreur induite <KatexInline formula={String.raw`\|\delta x\|_2 \approx 283`} /> est
			<strong>12 000 fois plus grande</strong>
			que la perturbation initiale sur
			<KatexInline formula={String.raw`y`} />, déplaçant la solution estimée de <KatexInline
				formula={String.raw`x_{\text{vrai}} = (1, 1)`}
			/> vers <KatexInline formula={String.raw`\hat{x} = (-200, 200)`} />.
		</p>

		<h3>3. Le problème des équations normales en Apprentissage</h3>
		<p>
			Dans un problème de moindres carrés ordinaires (OLS), nous cherchons à minimiser la perte
			empirique <KatexInline formula={String.raw`\|y - Xw\|_2^2`} />, ce qui conduit à résoudre le
			système des équations normales :
		</p>
		<KatexBlock formula={String.raw`X^\top X w = X^\top y`} />
		<p>
			Le conditionnement de la matrice à inverser est le carré de celui de la matrice de design :
		</p>
		<KatexBlock formula={String.raw`\kappa(X^\top X) = \kappa(X)^2`} />
		<p>
			Si les variables de <KatexInline formula={String.raw`X`} /> présentent une colinéarité même modérée
			(par exemple <KatexInline formula={String.raw`\kappa(X) \approx 100`} />), alors la matrice
			des corrélations <KatexInline formula={String.raw`X^\top X`} /> devient extrêmement instable (<KatexInline
				formula={String.raw`\kappa(X^\top X) \approx 10\,000`}
			/>). Les coefficients estimés s'envolent alors, compensant des variations microscopiques du
			bruit par des valeurs de poids gigantesques de signes opposés.
		</p>

		<h3>4. Comment la régularisation Ridge (L2) stabilise le spectre</h3>
		<p>
			La régularisation Ridge modifie les équations normales en introduisant un terme
			d'amortissement diagonal <KatexInline formula={String.raw`\lambda I`} /> :
		</p>
		<KatexBlock formula={String.raw`(X^\top X + \lambda I)w_{\text{Ridge}} = X^\top y`} />
		<p>
			Soit <KatexInline formula={String.raw`X^\top X = V D V^\top`} /> la décomposition spectrale (éléments
			propres) de la matrice symétrique semi-définie positive <KatexInline
				formula={String.raw`X^\top X`}
			/>, avec des valeurs propres <KatexInline formula={String.raw`d_i \ge 0`} />. Les valeurs
			propres de la matrice régularisée deviennent :
		</p>
		<KatexBlock formula={String.raw`\text{Sp}(X^\top X + \lambda I) = \{d_i + \lambda\}_{i=1}^p`} />
		<p>Par conséquent, le nouveau conditionnement du système régularisé s'écrit :</p>
		<KatexBlock
			formula={String.raw`\kappa(X^\top X + \lambda I) = \frac{d_{\max} + \lambda}{d_{\min} + \lambda}`}
		/>

		<Callout type="intuition" title="L'effet de relèvement spectral">
			Même si la plus petite valeur propre <KatexInline formula={String.raw`d_{\min}`} /> est arbitrairement
			proche de zéro (en présence de colinéarité parfaite ou lorsque <KatexInline
				formula={String.raw`p > n`}
			/>), dès que <KatexInline formula={String.raw`\lambda > 0`} />, la plus petite valeur propre
			de l'opérateur régularisé est strictement minorée par <KatexInline
				formula={String.raw`\lambda`}
			/>. Le conditionnement est alors immédiatement borné supérieurement :
			<KatexBlock
				formula={String.raw`\kappa(X^\top X + \lambda I) \le \frac{d_{\max} + \lambda}{\lambda} \approx \frac{d_{\max}}{\lambda}`}
			/>
			Ce relèvement spectral stabilise de manière drastique l'inversion numérique, limitant géométriquement
			l'amplitude des poids et garantissant la robustesse du modèle face aux fluctuations d'échantillonnage.
			Vous pouvez observer cet effet stabilisateur en direct en manipulant le curseur <KatexInline
				formula={String.raw`\lambda`}
			/> de la démo ci-dessous.
		</Callout>

		<InteractiveSection
			number="8.5.bis"
			title="Conditionnement"
			onInteract={tracker.trackInteraction}
		>
			<IllConditionningExplosionDemo />
		</InteractiveSection>
	</ExpertPanel>

	<!-- ═══════════════════════════════════════════ -->
	<!-- SECTION 3 : Lasso Regression (L1)          -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="lasso-regression">Lasso Regression (Régularisation L1)</h2>

		<p>
			Proposé par <strong>Tibshirani en 1996</strong>, le Lasso (<em
				>Least Absolute Shrinkage and Selection Operator</em
			>) remplace la norme L2 par une norme L1. Cette modification apparemment mineure change
			radicalement les propriétés de la solution : contrairement à Ridge, le Lasso peut produire des
			coefficients
			<strong>exactement nuls</strong>, offrant ainsi une
			<strong>sélection automatique de variables</strong>.
		</p>

		<DefinitionBlock number="8.2" title="Lasso Regression">
			<p>Le solveur Lasso minimise l'objectif suivant :</p>
			<KatexBlock formula={lassoObjective} />
			<p>La contrainte équivalente en formulation bornée est :</p>
			<KatexBlock formula={lassoConstraint} />
		</DefinitionBlock>

		<h3>L'opérateur de seuillage doux (soft-thresholding)</h3>

		<p>
			Dans le cas où les colonnes de X sont orthonormales, le Lasso se résout analytiquement grâce à
			l'opérateur de soft-thresholding :
		</p>

		<KatexBlock formula={softThreshold} />

		<p>Et la solution Lasso s'écrit :</p>

		<KatexBlock formula={lassoOrtho} />

		<p>
			Contrairement à Ridge qui multiplie par un facteur <KatexInline formula={'S_i(\\lambda)'} />,
			le Lasso <strong>soustrait</strong> une constante <KatexInline formula={'\\lambda'} />. Une
			fois qu'un coefficient franchi le seuil <KatexInline formula={'|w^{OLS}| \\leq \\lambda'} />,
			il devient exactement zéro et reste nul pour tout
			<KatexInline formula={'\\lambda'} /> supérieur. C'est ce mécanisme qui permet la sélection de variables.
		</p>

		<h3>Interprétation géométrique : pourquoi L1 produit-il des zéros ?</h3>

		<Callout type="intuition" title="L'argument géométrique de la sparsité">
			<p>
				La contrainte L1 forme un <strong>diamant</strong> (en 2D) dont les coins sont situés sur
				les axes. Les courbes de niveau du MSE sont des ellipses. Le point d'optimalité est
				l'endroit où l'ellipse touche premièrement le diamant. Comme ce diamant a des
				<em>sommets</em>, il y a une probabilité non nulle que le contact se produise exactement sur
				un sommet, c'est-à-dire sur un coin où un coefficient est exactement zéro. Avec Ridge
				(cercle lisse), cela ne peut pas arriver — le contact se fait toujours sur une arête courbe,
				produisant deux coefficients non nuls. C'est la contrepartie géométrique du prior de Laplace
				pointu en zéro évoqué plus haut.
			</p>
		</Callout>

		<h3>Résolution par descente de coordonnées</h3>

		<p>
			Lorsque les colonnes de X ne sont pas orthonormales, il n'existe pas de solution fermée.
			L'algorithme standard repose sur la <strong>descente de coordonnées</strong>, qui met à jour
			chaque coefficient individuellement en projetant sur l'opérateur de soft-thresholding :
		</p>

		<KatexBlock formula={coordDescentUpdate} />

		<p>
			Où <KatexInline formula={'X_j'} /> est la j-ième colonne de X et z<sub>j</sub> représente la corrélation
			partielle :
		</p>

		<KatexBlock formula={zJ} />

		<p>
			L'algorithme itère sur toutes les coordonnées jusqu'à convergence. À chaque étape, le
			soft-thresholding garantit que les petits coefficients sont éliminés.
		</p>

		<InteractiveSection
			number="8.3"
			title="Parcours des coefficients Lasso"
			onInteract={tracker.trackInteraction}
		>
			<LassoPathExplorer />
		</InteractiveSection>

		<Callout type="warning" title="Quand le Lasso peut faire fausse route">
			<p>
				Si deux variables sont fortement corrélées, le Lasso a tendance à en sélectionner <strong
					>une seule</strong
				> de manière quasi aléatoire. Cela peut rendre la solution instable et peu interprétable. De plus,
				quand p > n, le Lasso ne sélectionne au maximum que n variables.
			</p>
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════════ -->
	<!-- SECTION 4 : Elastic Net (L1 + L2 blend)    -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="elastic-net">Elastic Net (Mélange L1 et L2)</h2>

		<p>
			L'<strong>Elastic Net</strong>, proposé par Zou &amp; Hastie en 2005, combine les avantages de
			Ridge et du Lasso dans un seul modèle. Elle résout deux limites du Lasso : la sélection
			instable face à des variables corrélées, et la limitation à n variables quand p > n.
		</p>

		<DefinitionBlock number="8.3" title="Elastic Net">
			<p>L'objectif Elastic Net est :</p>
			<KatexBlock formula={elasticNetObjective} />
			<p>
				Où <KatexInline formula={'\\lambda \\geq 0'} /> contrôle la force globale de la régularisation
				et
				<KatexInline formula={'\\alpha \\in [0,1]'} /> contrôle le mélange entre L1 et L2 :
			</p>
		</DefinitionBlock>

		<p>Les cas limites correspondent aux méthodes classiques :</p>

		<ul>
			<li><KatexInline formula={alphaPureLasso} /></li>
			<li><KatexInline formula={alphaPureRidge} /></li>
		</ul>

		<h3>Pourquoi combiner L1 et L2 ?</h3>

		<p>Le terme L2 joue deux rôles complémentaires au terme L1 :</p>

		<ol>
			<li>
				<strong>Sélection de variables (L1) :</strong> le composant L1 produit des zéros exacts, offrant
				une sélection automatique et un modèle parcimonieux
			</li>
			<li>
				<strong>Stabilité face à la corrélation (L2) :</strong> le composant L2 groupe les variables fortement
				corrélées avec des coefficients similaires, au lieu de choisir arbitrairement une seule
			</li>
		</ol>

		<p>
			Dans la pratique, l'Elastic Net est souvent préférable aux deux méthodes séparées. Le
			paramètre <KatexInline formula={'\\alpha'} /> permet d'ajuster le compromis en fonction de la structure
			des données : on choisira un <KatexInline formula={'\\alpha'} /> proche de 1 quand les variables
			sont peu corrélées, et plus faible quand elles le sont.
		</p>

		<InteractiveSection
			number="8.4"
			title="Mélange Elastic Net"
			onInteract={tracker.trackInteraction}
		>
			<ElasticNetBlend />
		</InteractiveSection>
	</TheorySection>

	<!-- ═══════════════════════════════════════════ -->
	<!-- SECTION 5 : Sélection de λ                 -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<h2>Sélection du paramètre λ par validation croisée</h2>

		<p>
			Les méthodes précédentes admettent un paramètre de régularisation <KatexInline
				formula={'\\lambda'}
			/> qui contrôle l'intensité du biais introduit. Choisir ce paramètre est crucial : une valeur trop
			faible ne réduit pas assez la variance, tandis qu'une valeur trop forte biaise excessivement le
			modèle. La <strong>validation croisée</strong> est la méthode standard pour estimer la
			performance de généralisation et sélectionner le meilleur <KatexInline
				formula={'\\lambda'}
			/>.
		</p>

		<Callout type="intuition" title="CV n'est pas la seule route">
			<p>
				Pour Ridge, la section précédente a montré que <KatexInline
					formula={'\\operatorname{df}(\\lambda)'}
				/> se calcule en forme close, ce qui rend possible une sélection de λ par AIC, BIC ou C<sub
					>p</sub
				> de Mallows, sans repasser plusieurs fois sur les données. Pour Lasso, la notion de degrés de
				liberté effectifs existe aussi (le nombre de coefficients non nuls le long du chemin LARS en est
				un estimateur non biaisé sous conditions, Zou, Hastie &amp; Tibshirani 2007), mais elle est plus
				fragile — la validation croisée reste, en pratique, le choix par défaut le plus robuste pour Lasso
				et Elastic Net.
			</p>
		</Callout>

		<h3>Procédure de validation croisée à K plis</h3>

		<ol>
			<li>
				Partitionner les données en <KatexInline formula={'K'} /> groupes (plis) de taille approximativement
				égale
			</li>
			<li>Pour chaque pli k = 1, ..., K :</li>
			<ul>
				<li>
					Entraîner le modèle sur les K-1 plis restants pour une valeur donnée de <KatexInline
						formula={'\\lambda'}
					/>
				</li>
				<li>Évaluer l'erreur quadratique moyenne sur le pli k</li>
			</ul>
			<li>Faire la moyenne des K erreurs pour obtenir l'estimation croisée :</li>
		</ol>

		<KatexBlock formula={cvError} />

		<p>
			On répète ce processus sur un large gamut de valeurs pour <KatexInline
				formula={'\\lambda'}
			/>, puis on sélectionne :
		</p>

		<KatexBlock formula={lambdaOpt} />

		<h3>La règle du « une écart-type »</h3>

		<p>
			En pratique, on préfère souvent choisir une valeur de <KatexInline formula={'\\lambda'} /> plus
			grande que le minimiseur exact :
		</p>

		<KatexBlock formula={oneSeRule} />

		<p>
			Où <KatexInline formula={sOptDef} /> est l'écart-type de l'erreur croisée à l'optimum. Cette règle
			produit un modèle parcimonieux (moins de variables non nulles) tout en restant dans une marge statistiquement
			acceptable de performance. C'est un compromis classique entre simplicité du modèle et précision.
		</p>

		<Callout type="warning" title="Le piège du surajustement de λ">
			<p>
				Si vous utilisez la même validation croisée pour sélectionner <KatexInline
					formula={'\\lambda'}
				/> et évaluer le modèle, votre estimation de performance sera optimiste. L'idéal est d'utiliser
				une validation croisée imbriquée : un cycle extérieur pour évaluer la généralisation, et un cycle
				intérieur pour sélectionner <KatexInline formula={'\\lambda'} />.
			</p>
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════════ -->
	<!-- EXERCISE                                   -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<h2>Exercice d'application</h2>

		<ExercisePanel number="8.1" title="Calcul de facteurs de rétrécissement et seuillage">
			{#snippet solution()}
				<p>
					Pour Ridge : le facteur <KatexInline formula={shrinkageFactor} /> donne les valeurs suivantes
					pour chaque direction propre : S₁ = 5/(5 + 2) ≈ 0,714 ; S₂ = 2/(2 + 2) = 0,5 ; S₃ = 0,5/(0,5
					+ 2) ≈ 0,2. On observe bien que la direction faible (d=0,5) est beaucoup plus réduite.
				</p>
				<p>
					Pour Lasso : S(w₁=3.0, λ=1.0) = 3.0 - 1.0 = <strong>2.0</strong>. S(w₂=−1.5, λ=1.0) =
					sign(−1.5) · max(1.5 − 1.0, 0) = <strong>−0.5</strong>. S(w₃=0.8, λ=1.0) = sign(0.8) ·
					max(0.8 − 1.0, 0) = <strong>0</strong> (le coefficient est annulé !).
				</p>
			{/snippet}

			<p>
				Supposons que vous avez un problème de régression avec 3 caractéristiques. La décomposition
				spectrale de la matrice de design donne les valeurs propres :
				<KatexInline formula={'d_1 = 5'} />, <KatexInline formula={'d_2 = 2'} /> et <KatexInline
					formula={'d_3 = 0,5'}
				/>. Les coefficients OLS estimés sont :
			</p>

			<KatexBlock formula={exW_ols} />

			<p>
				<strong>a)</strong> Calculer les facteurs de rétrécissement Ridge pour <KatexInline
					formula={'\\lambda = 2'}
				/>. Commenter la différence d'amplitude entre directions.
			</p>

			<p>
				<strong>b)</strong> Calculer les coefficients Lasso en utilisant le soft-thresholding avec <KatexInline
					formula={exLambdaVal}
				/>. Quel coefficient est annulé et pourquoi ?
			</p>
		</ExercisePanel>
	</TheorySection>

	<!-- ═══════════════════════════════════════════ -->
	<!-- SYNTHESIS CALLOUT                          -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="synthese">Synthèse</h2>

		<Callout type="summary" title="Ridge vs Lasso vs Elastic Net — tableau comparatif">
			<ul>
				<li>
					<strong>Ridge (L2) :</strong> rétrécit uniformément, jamais de zéros exacts. Prior
					gaussien. Idéal pour stabiliser l'inversion matricielle et gérer la multicolinéarité.
					Degrés de liberté et sélection de λ en forme close disponibles (AIC/C<sub>p</sub>)
				</li>
				<li>
					<strong>Lasso (L1) :</strong> produit des zéros exacts via le soft-thresholding. Prior de Laplace.
					Permet une sélection automatique de variables mais peut être instable avec des corrélations
					fortes, et son inférence post-sélection n'est pas standard
				</li>
				<li>
					<strong>Elastic Net :</strong> combine les deux approches. Sélection de variables (L1) + stabilité
					pour corrélées (L2). Souvent le meilleur choix en pratique
				</li>
			</ul>
			<p style="margin-top: 0.5rem;">
				Dans tous les cas, la sélection du paramètre <KatexInline formula={'\\lambda'} /> par validation
				croisée est une étape obligatoire et critique pour obtenir un bon compromis biais-variance, et
				les variables doivent être standardisées en amont.
			</p>
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════════ -->
	<!-- SECTION : Deep Learning — Weight Decay      -->
	<!-- ═══════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="weight-decay">Régularisation en Deep Learning : le Weight Decay</h2>

		<p>
			En deep learning, on ne parle presque jamais de « pénalité Ridge » mais de
			<strong>weight decay</strong>. Ce n'est pas un simple changement de vocabulaire : c'est la
			même pénalité L2 vue à travers la lentille de la <em>descente de gradient</em>, ce qui donne à
			l'objet un nom directement lisible dans la règle de mise à jour.
		</p>

		<h3>D'où vient le nom</h3>

		<p>
			Reprenons l'objectif régularisé en norme L2, appliqué cette fois à un réseau de neurones dont
			les poids sont <KatexInline formula={'w'} /> et la perte (cross-entropy, MSE, etc.) est <KatexInline
				formula={'\\mathcal{L}(w)'}
			/> :
		</p>

		<KatexBlock formula={l2GradObjective} />

		<p>
			En optimisation par moindres carrés, on résolvait ce problème par une formule fermée. En deep
			learning, on ne dispose pas de solution fermée : on descend le gradient. Le gradient de la
			pénalité <KatexInline formula={'\\frac{\\lambda}{2}\\|w\\|_2^2'} /> par rapport à <KatexInline
				formula={'w'}
			/> vaut simplement <KatexInline formula={'\\lambda w'} />, donc une étape de descente de
			gradient sur l'objectif régularisé s'écrit :
		</p>

		<KatexBlock formula={l2GradUpdate} />

		<p>Qu'on peut regrouper en factorisant le terme en <KatexInline formula={'w_t'} /> :</p>

		<KatexBlock formula={weightDecayUpdate} />

		<DefinitionBlock number="8.6" title="Weight decay">
			<p>
				À chaque pas d'optimisation, le poids <KatexInline formula={'w_t'} /> est d'abord
				<strong>multiplié</strong> par un facteur <KatexInline
					formula={'(1 - \\eta\\lambda) < 1'}
				/>
				— indépendamment du gradient de la tâche — avant que la mise à jour usuelle
				<KatexInline formula={'-\\eta \\nabla_w \\mathcal{L}(w_t)'} /> ne soit appliquée. C'est cette
				érosion multiplicative géométrique, pas à pas, qui donne son nom au « weight decay » : les poids
				<em>décroissent</em> vers zéro à chaque itération, exactement comme une désintégration exponentielle,
				sauf quand le gradient de la tâche les tire dans l'autre sens.
			</p>
		</DefinitionBlock>

		<p>
			Le cas limite est éclairant : si le gradient de la perte de tâche est nul en un point donné
			(un minimum local plat, ou un poids qui ne contribue plus à la prédiction), la mise à jour se
			réduit à :
		</p>

		<KatexBlock formula={pureDecayLimit} />

		<p>
			c'est-à-dire une pure décroissance géométrique vers 0. Le weight decay est donc exactement le
			Ridge de la Section 2, mais formulé comme une règle de mise à jour locale plutôt que comme un
			problème d'optimisation global — la seule différence est le point de vue : algébrique
			(solution fermée) contre itératif (une étape de gradient à la fois).
		</p>

		<Callout type="intuition" title="Pourquoi cette forme est-elle intuitive ?">
			<p>
				Sans pénalité, un poids inutile ne bouge plus une fois que son gradient s'annule — rien ne
				le pousse vers zéro. Avec le weight decay, même un poids au gradient nul continue de
				rétrécir à chaque itération. C'est un mécanisme d'« oubli actif » : en l'absence de signal
				disant explicitement de garder un poids grand, le réseau le laisse décroître. Cela favorise
				des solutions à faible norme, exactement comme l'argument bayésien MAP sous prior gaussien
				vu en introduction — sauf qu'ici le prior agit littéralement à chaque pas de gradient plutôt
				qu'une seule fois au moment de résoudre le système.
			</p>
		</Callout>

		<ExpertPanel title="Le piège moderne : weight decay ≠ L2 avec Adam">
			<p>
				Cette équivalence <em>weight decay = L2</em> n'est exacte que pour la descente de gradient
				(SGD) simple. Avec des optimiseurs adaptatifs comme <strong>Adam</strong>, elle se brise —
				et pendant des années, la plupart des implémentations de deep learning l'ont ignoré, ce qui
				a dégradé silencieusement les performances de généralisation.
			</p>
			<p>
				L'implémentation naïve (« L2 régularisation ») ajoute <KatexInline formula={'\\lambda w'} />
				au gradient <em>avant</em> qu'Adam ne le fasse passer dans ses moments adaptatifs :
			</p>
			<KatexBlock formula={adamL2Coupled} />
			<p>
				Le problème : Adam renormalise chaque coordonnée par sa variance historique de gradient
				<KatexInline formula={'\\sqrt{\\hat{v}_t}'} />. Les poids qui reçoivent de gros gradients de
				tâche voient donc leur pénalité <KatexInline formula={'\\lambda w'} /> automatiquement
				<strong>atténuée</strong> par cette renormalisation — l'intensité effective de la régularisation
				dépend alors de la géométrie du gradient, ce qui n'était jamais l'intention.
			</p>
			<p>
				<strong>AdamW</strong> (Loshchilov &amp; Hutter, 2019) corrige cela en
				<strong>découplant</strong>
				la décroissance de poids du calcul du gradient adaptatif : le pas d'Adam se calcule normalement
				sur le gradient de tâche seul, puis le terme <KatexInline formula={'-\\eta\\lambda w_t'} /> est
				appliqué séparément, en dehors de la renormalisation :
			</p>
			<KatexBlock formula={adamWDecoupled} />
			<p>
				C'est ce découplage qui restaure la propriété originale du weight decay — une décroissance
				géométrique uniforme, indépendante de l'historique du gradient — et qui explique pourquoi
				AdamW est aujourd'hui l'optimiseur par défaut pour l'entraînement des grands réseaux
				(Transformers compris) plutôt qu'Adam avec pénalité L2 classique.
			</p>
		</ExpertPanel>

		<Callout type="summary" title="Weight decay en résumé">
			<ul>
				<li>
					<strong>Même pénalité, autre point de vue :</strong> le weight decay est la pénalité L2 (Ridge)
					vue comme une règle de mise à jour itérative plutôt que comme un problème résolu en forme fermée
				</li>
				<li>
					<strong>Le nom vient de la mise à jour :</strong> chaque pas multiplie le poids par un
					facteur
					<KatexInline formula={'(1-\\eta\\lambda) < 1'} />, une décroissance géométrique explicite
					dans l'équation elle-même
				</li>
				<li>
					<strong>Équivalence conditionnelle :</strong> exacte sous SGD, rompue sous les optimiseurs adaptatifs
					(Adam) sauf si le weight decay est découplé du gradient adaptatif (AdamW)
				</li>
			</ul>
		</Callout>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Tibshirani, R.']}
			year={1996}
			title="Regression Shrinkage and Selection via the Lasso"
			journal="Journal of the Royal Statistical Society, Series B, 58(1), 267–288."
			link="https://doi.org/10.1111/j.2517-6161.1996.tb02080.x"
		/>
		<BibElement
			authors={['Zou, H.', 'Hastie, T.']}
			year={2005}
			title="Regularization and Variable Selection via the Elastic Net"
			journal="Journal of the Royal Statistical Society, Series B, 67(2), 301–320."
			link="https://doi.org/10.1111/j.1467-9868.2005.00503.x"
		/>
		<BibElement
			authors={['Hoerl, A.E.', 'Kennard, R.W.']}
			year={1970}
			title="Ridge Regression: Biased Estimation for Nonorthogonal Problems"
			journal="Technometrics, 12(1), 55–67."
			link="https://doi.org/10.1080/00401706.1970.10488634"
		/>
		<BibElement
			authors={['Zou, H.', 'Hastie, T.', 'Tibshirani, R.']}
			year={2007}
			title="On the 'Degrees of Freedom' of the Lasso"
			journal="The Annals of Statistics, 35(5), 2173–2192."
			link="https://doi.org/10.1214/009053607000000127"
		/>
		<BibElement
			authors={['Lee, J.D.', 'Sun, D.L.', 'Sun, Y.', 'Taylor, J.E.']}
			year={2016}
			title="Exact Post-Selection Inference, with Application to the Lasso"
			journal="The Annals of Statistics, 44(3), 907–927."
			link="https://doi.org/10.1214/15-AOS1371"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer. 2ᵉ édition."
			link="https://web.stanford.edu/~hastie/ElemStatLearn/"
		/>
	</Bibliography>
</PageTemplate>
