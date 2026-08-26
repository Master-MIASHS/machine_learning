<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';

	import { type PageMeta, getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';

	import LossFunctionExplorer from '$lib/components/demos/LossFunctionExplorer.svelte';
	import ConvexSumVisualizer from '$lib/components/demos/ConvexSumVisualizer.svelte';
	import LinearRegressionFit from '$lib/components/demos/LinearRegressionFit.svelte';
	import RidgePathExplorer from '$lib/components/demos/RidgePathExplorer.svelte';
	import HessianConditionNumber from '$lib/components/demos/HessianConditionNumber.svelte';
	import LassoPathExplorer from '$lib/components/demos/LassoPathExplorer.svelte';

	// ── Page metadata ──
	const meta = getPageByPath('/part1/lesson2');
	const tracker = createPageTracker(meta as PageMeta);

	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

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
			label: 'Introduction',
			description: 'Structure en somme des fonctions objectif en ML',
			color: 'epistemic'
		},
		{
			id: 'proprietes-conservation-somme',
			label: 'Propriétés de conservation par somme',
			description: 'Convexité, différentiabilité, coercivité, composition affine',
			color: 'belief'
		},
		{
			id: 'exemples-ml',
			label: 'Exemples en Machine Learning',
			description: 'Moindres carrés, Ridge, Lasso, logistique',
			color: 'positive'
		},
		{
			id: 'non-convexite-deep-learning',
			label: 'Non-convexité en Deep Learning',
			description: 'Pourquoi les réseaux de neurones cassent la convexité',
			color: 'surprise'
		},
		{
			id: 'synthese-proprietes',
			label: 'Synthèse des propriétés conservées',
			description: 'Forte convexité, Lipschitz-continuité du gradient',
			color: 'neutral'
		}
	];

	// ── Symboles atomiques réutilisés dans le texte ──
	const fSym = 'f';
	const fiSym = 'f_i';
	const omegaSym = '\\Omega';
	const xSym = 'x';

	// ── Forme générale ──
	const fSum = 'f(x) = \\frac{1}{n} \\sum_{i=1}^n f_i(x)';
	const xInRd = 'x \\in \\mathbb{R}^d';
	const fiLoss = 'f_i(x)';

	// ── Conservation de la convexité ──
	const sumConvexFormula = 'f(x) = \\sum_{i=1}^n \\alpha_i f_i(x), \\quad \\alpha_i \\ge 0';
	const convexityIneqSingle =
		'f_i(\\lambda x + (1-\\lambda) y) \\le \\lambda f_i(x) + (1-\\lambda) f_i(y)';
	const xyOmegaLambda = 'x, y \\in \\Omega, \\ \\lambda \\in [0,1]';

	const sumConvexProof =
		'\\begin{aligned} f(\\lambda x + (1-\\lambda)y) &= \\sum_{i=1}^n \\alpha_i f_i(\\lambda x + (1-\\lambda)y) \\\\ &\\le \\sum_{i=1}^n \\alpha_i \\left[\\lambda f_i(x) + (1-\\lambda) f_i(y)\\right] \\\\ &= \\lambda \\sum_{i=1}^n \\alpha_i f_i(x) + (1-\\lambda) \\sum_{i=1}^n \\alpha_i f_i(y) \\\\ &= \\lambda f(x) + (1-\\lambda) f(y) \\end{aligned}';

	const hessSumQuadForm =
		'v^\\top H_f(x) v = \\frac{1}{n}\\sum_{i=1}^n v^\\top H_{f_i}(x)\\, v \\ge 0';

	// ── Conservation de la différentiabilité ──
	const gradSum = '\\nabla f(x) = \\frac{1}{n}\\sum_{i=1}^n \\nabla f_i(x)';
	const hessSum = 'H_f(x) = \\frac{1}{n}\\sum_{i=1}^n H_{f_i}(x)';

	// ── Conservation de la coercivité ──
	const coerciveRecall = '\\lim_{\\|x\\| \\to +\\infty} f(x) = +\\infty';
	const coerciveSumBound =
		'f(x) \\ge \\frac{1}{n} f_1(x) + \\frac{1}{n}\\sum_{i=2}^n m_i \\xrightarrow[\\|x\\| \\to +\\infty]{} +\\infty';

	// ── Composition affine ──
	const affineDef = 'A(x) = Mx + b';
	const MInRmn = 'M \\in \\mathbb{R}^{m \\times n}, \\quad b \\in \\mathbb{R}^m';
	const composedConvex = 'f(x) = g(Mx + b)';

	const affineProof =
		'\\begin{aligned} A(\\lambda x + (1-\\lambda)y) &= M(\\lambda x + (1-\\lambda) y) + b \\\\ &= \\lambda (Mx+b) + (1-\\lambda)(My+b) \\\\ &= \\lambda A(x) + (1-\\lambda) A(y) \\end{aligned}';

	const composedConvexProof =
		'\\begin{aligned} f(\\lambda x + (1-\\lambda)y) &= g\\big(A(\\lambda x + (1-\\lambda) y)\\big) \\\\ &= g\\big(\\lambda A(x) + (1-\\lambda) A(y)\\big) \\\\ &\\le \\lambda\\, g(A(x)) + (1-\\lambda)\\, g(A(y)) \\\\ &= \\lambda f(x) + (1-\\lambda) f(y) \\end{aligned}';

	// ── Applications : normes, SVM ──
	const normAffine = 'f(x) = \\|Mx + b\\|_p, \\quad p \\ge 1';
	const svmLoss = 'f(w) = \\sum_{i=1}^n \\max\\big(0,\\ 1 - y_i(w^\\top x_i + b)\\big)';

	// ── Régression linéaire ──
	const mseLoss = 'f(w) = \\frac{1}{2n} \\sum_{i=1}^n (y_i - w^\\top x_i)^2';
	const msePerSample = 'f_i(w) = \\frac{1}{2}(y_i - w^\\top x_i)^2';
	const olsGrad =
		'\\nabla f(w) = -\\frac{1}{n} \\sum_{i=1}^n (y_i - w^\\top x_i)\\, x_i = \\frac{1}{n}\\big(X^\\top X w - X^\\top y\\big)';
	const olsHess = 'H_f(w) = \\frac{1}{n} X^\\top X';
	const olsClosedForm = 'w^* = (X^\\top X)^{-1} X^\\top y';
	const rankCond = '\\operatorname{rang}(X) = d';

	// ── Régularisation Ridge ──
	const ridgeFormula =
		'f_\\lambda(w) = \\frac{1}{2n} \\sum_{i=1}^n (y_i - w^\\top x_i)^2 + \\frac{\\lambda}{2}\\|w\\|^2';
	const ridgeHess = 'H = \\frac{1}{n}X^\\top X + \\lambda I_d';
	const ridgeSolution = 'w^*_\\lambda = (X^\\top X + n\\lambda I_d)^{-1} X^\\top y';
	const ridgePositiveDef =
		'v^\\top H v = \\frac{1}{n}\\|Xv\\|^2 + \\lambda \\|v\\|^2 \\ge \\lambda \\|v\\|^2 > 0, \\quad \\forall v \\neq 0';
	const ridgeLimitZero = 'w^*_\\lambda \\xrightarrow[\\lambda \\to 0]{} w^*';
	const ridgeLimitInfty = 'w^*_\\lambda \\xrightarrow[\\lambda \\to +\\infty]{} 0';

	// ── Régression logistique ──
	const logLossFormula =
		'f(w) = \\frac{1}{n} \\sum_{i=1}^n \\log\\big(1 + e^{-y_i w^\\top x_i}\\big), \\quad y_i \\in \\{-1, +1\\}';
	const logLossPerSample = 'f_i(w) = \\log\\big(1 + e^{-y_i w^\\top x_i}\\big)';
	const logLossSecondDeriv =
		'\\frac{d^2}{dt^2}\\log(1+e^{-t}) = \\sigma(t)\\big(1-\\sigma(t)\\big) \\ge 0, \\quad \\sigma(t) = \\frac{1}{1+e^{-t}}';

	// ── Régularisation générale ──
	const regGeneral = 'f(w) = \\frac{1}{n} \\sum_{i=1}^n \\ell_i(w) + \\lambda\\, r(w)';
	const ridgeReg = 'r(w) = \\|w\\|_2^2';
	const lassoReg = 'r(w) = \\|w\\|_1';
	const elasticNetReg =
		'r(w) = \\alpha \\|w\\|_1 + (1-\\alpha)\\|w\\|_2^2, \\quad \\alpha \\in [0,1]';

	// ── Deep Learning non-convexe ──
	const nnLoss = 'f(\\theta) = \\frac{1}{n} \\sum_{i=1}^n \\ell\\big(h_\\theta(x_i), y_i\\big)';

	// ── Forte convexité ──
	const strongConvexDef =
		'f(\\lambda x + (1-\\lambda)y) \\le \\lambda f(x) + (1-\\lambda) f(y) - \\frac{\\mu}{2}\\lambda(1-\\lambda)\\|x-y\\|^2';
	const strongConvexSumProof =
		'\\frac{1}{n}\\sum_{i=1}^n f_i(\\lambda x+(1-\\lambda)y) \\le \\frac{1}{n}\\sum_{i=1}^n \\left[\\lambda f_i(x) + (1-\\lambda) f_i(y) - \\frac{\\mu}{2}\\lambda(1-\\lambda)\\|x-y\\|^2\\right]';

	// ── Lipschitz-continuité du gradient ──
	const lipschitzGradDef =
		'\\|\\nabla g(x) - \\nabla g(y)\\| \\le L\\|x-y\\|, \\quad \\forall x, y';
	const lipschitzSumProof =
		'\\|\\nabla f(x) - \\nabla f(y)\\| = \\left\\|\\frac{1}{n}\\sum_{i=1}^n \\big[\\nabla f_i(x) - \\nabla f_i(y)\\big]\\right\\| \\le \\frac{1}{n}\\sum_{i=1}^n \\|\\nabla f_i(x) - \\nabla f_i(y)\\| \\le \\frac{1}{n}\\sum_{i=1}^n L_i \\|x-y\\|';
	const lipschitzLBound = 'L = \\frac{1}{n}\\sum_{i=1}^n L_i';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? "Fonctions d'optimisation en ML"}
	subtitle="Structure des fonctions de perte du Machine Learning et propriétés de régularité"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ================= INTRO ================= -->
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			De nombreuses fonctions objectif utilisées en apprentissage automatique peuvent s'écrire comme
			une somme (ou une moyenne) de termes, chacun associé à un exemple d'entraînement. Cette
			structure, appelée <strong>séparabilité</strong>, est au cœur de nombreuses méthodes
			d'optimisation.
		</p>

		<KatexBlock formula={fSum} />

		<DefinitionBlock title="Définition — Fonction de perte séparable">
			<p>
				Une fonction de perte <KatexInline formula={String.raw`f : \mathbb{R}^d \to \mathbb{R}`} /> est
				<strong>séparable</strong> si elle peut s'écrire sous la forme
			</p>

			<KatexBlock formula={fSum} />

			<p>où :</p>

			<ul>
				<li><KatexInline formula={xInRd} /> est le vecteur de paramètres du modèle ;</li>
				<li>
					<KatexInline formula={String.raw`n`} /> est le nombre d'exemples d'entraînement ;
				</li>
				<li>
					<KatexInline formula={fiLoss} /> est la perte associée au
					<KatexInline formula={String.raw`i`} />-ième exemple.
				</li>
			</ul>
		</DefinitionBlock>

		<p>
			La séparabilité permet d'étudier chaque terme <KatexInline formula={fiLoss} /> indépendamment. Dans
			de nombreux cas, des propriétés telles que la convexité, la différentiabilité, la coercivité ou
			la régularité du gradient se <strong>transmettent</strong> naturellement des fonctions individuelles
			à leur somme. Il devient alors possible de démontrer ces propriétés localement, puis d'en déduire
			des garanties sur la fonction objectif entière. En outre, la séparabilité permettra de construire
			des algorithmes d'optimisation comme la descente de gradient stochastique.
		</p>

		<Callout type="intuition" title="Pourquoi cette structure ?">
			La qualité globale du modèle est évaluée en agrégeant les erreurs commises sur chaque exemple
			d'entraînement. Cette décomposition en somme est précisément ce qui rend possibles les preuves
			de cette leçon ainsi que les algorithmes de descente de gradient stochastique (SGD) et leurs
			variantes.
		</Callout>

		<p>
			Pour explorer visuellement comment différentes fonctions de perte se comportent, utilisez
			l'outil ci-dessous.
		</p>

		<InteractiveSection
			number="2.1"
			title="Exploration des fonctions de perte"
			onInteract={tracker.trackInteraction}
		>
			<LossFunctionExplorer />
		</InteractiveSection>
	</TheorySection>

	<!-- ================= CONVEXITY ================= -->
	<TheorySection>
		<h2 id="proprietes-conservation-somme">Propriétés de conservation par somme</h2>

		<p>
			L'une des forces de la structure en somme est que de nombreuses propriétés mathématiques se
			conservent lorsqu'on additionne des fonctions. Au lieu d'étudier la fonction globale
			directement, on analyse chaque terme séparément, puis on combine les résultats.
		</p>

		<h3>Conservation de la convexité</h3>

		<TheoremBlock number="2.1" title="Somme pondérée de fonctions convexes">
			<p>
				Soit <KatexInline formula={omegaSym} /> un ensemble convexe. Si les fonctions <KatexInline
					formula={String.raw`f_1, f_2, \dots, f_n`}
				/> sont toutes convexes sur <KatexInline formula={omegaSym} />, alors toute combinaison
				linéaire à coefficients positifs (i.e. combinaison convexe) :
			</p>
			<KatexBlock formula={sumConvexFormula} />
			<p>
				est elle-même convexe sur <KatexInline formula={omegaSym} />. En particulier, la moyenne
				arithmétique <KatexInline formula={fSum} /> conserve la convexité (cas <KatexInline
					formula={String.raw`\alpha_i = 1/n`}
				/>).
			</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				Soient <KatexInline formula={xyOmegaLambda} />. Pour chaque terme individuel, la convexité
				donne :
			</p>
			<KatexBlock formula={convexityIneqSingle} />
			<p>On calcule alors :</p>
			<KatexBlock formula={sumConvexProof} />
			<p>Donc <KatexInline formula={fSym} /> est convexe. ∎</p>
		</div>

		<InteractiveSection
			number="2.2"
			title="Sommes de fonctions convexes"
			onInteract={tracker.trackInteraction}
		>
			<ConvexSumVisualizer />
		</InteractiveSection>

		<ExercisePanel number="2.1" title="Convexité via la Hessienne">
			<p>
				Démontrez le théorème précédent par un argument sur la Hessienne : supposez que chaque <KatexInline
					formula={fiSym}
				/> est de classe <KatexInline formula={String.raw`C^2`} /> et utilisez le critère de convexité
				par la Hessienne (rappel : une fonction <KatexInline formula={String.raw`C^2`} /> est convexe
				si et seulement si sa Hessienne est semi-définie positive en tout point).
			</p>
			{#snippet solution()}
				<p>
					Si chaque <KatexInline formula={fiSym} /> est convexe, alors <KatexInline
						formula={'H_{f_i}(x)'}
					/> est semi-définie positive pour tout <KatexInline formula={xSym} />. La Hessienne de la
					moyenne est <KatexInline formula={hessSum} />. Pour tout vecteur <KatexInline
						formula={String.raw`v`}
					/> :
				</p>
				<KatexBlock formula={hessSumQuadForm} />
				<p>
					donc chaque terme <KatexInline formula={String.raw`v^\top H_{f_i}(x) v`} /> est non négatif
					par hypothèse. Donc <KatexInline formula={String.raw`H_f`} /> est semi-définie positive partout,
					et
					<KatexInline formula={fSym} /> est convexe. ∎
				</p>
			{/snippet}
		</ExercisePanel>

		<h3>Conservation de la différentiabilité</h3>

		<p>
			Les dérivées s'additionnent aussi, ce qui est fondamental pour les algorithmes de descente de
			gradient.
		</p>

		<TheoremBlock number="2.2" title="Gradient d'une somme">
			<p>
				Si chaque <KatexInline formula={fiSym} /> est différentiable sur <KatexInline
					formula={omegaSym}
				/>, alors le gradient de la moyenne est :
			</p>
			<KatexBlock formula={gradSum} />
		</TheoremBlock>

		<Callout type="intuition" title="Pourquoi c'est important ?">
			Cette propriété permet de calculer le gradient global en moyennant simplement les gradients
			individuels. C'est exactement ce que fait la descente de gradient (et, en particulier, sa
			variante stochastique) : on calcule l'erreur sur un ou plusieurs exemples, on moyenne les
			gradients, et on descend dans cette direction.
		</Callout>

		<TheoremBlock number="2.3" title="Hessienne d'une somme">
			<p>
				Si chaque <KatexInline formula={fiSym} /> est deux fois différentiable, alors :
			</p>
			<KatexBlock formula={hessSum} />
		</TheoremBlock>

		<p>
			Ce résultat est crucial pour le conditionnement numérique du problème d'optimisation. La
			Hessienne détermine la courbure locale de la fonction, et donc la vitesse de convergence des
			algorithmes de type gradient ou Newton.
		</p>

		<h3>Conservation de la coercivité</h3>

		<TheoremBlock number="2.4" title="Somme et coercivité">
			<p>
				Supposons qu'il existe au moins un indice, disons <KatexInline formula={String.raw`i=1`} />,
				tel que <KatexInline formula={String.raw`f_1`} /> est coercive (<KatexInline
					formula={coerciveRecall}
				/>), et que tous les autres termes sont <strong>minorés</strong> : il existe <KatexInline
					formula={String.raw`m_2, \dots, m_n`}
				/> tels que <KatexInline formula={String.raw`f_i(x) \ge m_i`} /> pour tout <KatexInline
					formula={String.raw`i \ge 2`}
				/> et tout <KatexInline formula={String.raw`x`} />. Alors la moyenne <KatexInline
					formula={fSum}
				/> est elle-même coercive.
			</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>En minorant chaque terme sauf le premier par sa borne inférieure, on obtient :</p>
			<KatexBlock formula={coerciveSumBound} />
			<p>
				où la limite à droite provient de la coercivité de <KatexInline
					formula={String.raw`f_1`}
				/>. Donc <KatexInline formula={fSym} /> est coercive. ∎
			</p>
		</div>

		<Callout type="intuition" title="En pratique">
			On ajoute souvent un terme de régularisation coercif (comme le Ridge) précisément pour
			garantir l'existence d'un minimum global via le théorème de Weierstrass. Sans coercivité, la
			fonction peut s'échapper à l'infini sans jamais atteindre de minimum — même si chaque terme
			individuel semble raisonnable.
		</Callout>

		<h3>Conservation par composition affine</h3>

		<TheoremBlock number="2.5" title="Composition affine et convexité">
			<p>
				Soit <KatexInline formula={String.raw`g : \mathbb{R}^m \to \mathbb{R}`} /> une fonction convexe,
				et <KatexInline formula={String.raw`A : \mathbb{R}^n \to \mathbb{R}^m`} /> une application affine
				définie par :
			</p>
			<KatexBlock formula={affineDef} />
			<p>où <KatexInline formula={MInRmn} />. Alors la composée :</p>
			<KatexBlock formula={composedConvex} />
			<p>est convexe sur <KatexInline formula={String.raw`\mathbb{R}^n`} />.</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				Soient <KatexInline formula={String.raw`x, y \in \mathbb{R}^n`} /> et <KatexInline
					formula={String.raw`\lambda \in [0,1]`}
				/>. L'application affine <KatexInline formula={String.raw`A`} /> préserve exactement les combinaisons
				convexes :
			</p>
			<KatexBlock formula={affineProof} />
			<p>On a donc :</p>
			<KatexBlock formula={composedConvexProof} />
			<p>Donc <KatexInline formula={fSym} /> est convexe. ∎</p>
		</div>

		<p>
			Ce théorème explique pourquoi de nombreuses fonctions de perte usuelles sont convexes : elles
			s'écrivent comme la composition d'une fonction convexe simple avec une application affine du
			vecteur de paramètres.
		</p>

		<ExampleBlock number="2.5.1" title="Normes de vecteurs transformés">
			<p>
				Pour tout <KatexInline formula={String.raw`p \ge 1`} />, la fonction :
			</p>
			<KatexBlock formula={normAffine} />
			<p>
				est convexe, car la norme <KatexInline formula={String.raw`\|\cdot\|_p`} /> est convexe et <KatexInline
					formula={affineDef}
				/> est affine. Cela couvre les pénalités <KatexInline formula={String.raw`L_1`} />, <KatexInline
					formula={String.raw`L_2`}
				/>, etc., appliquées à des combinaisons linéaires de paramètres.
			</p>
		</ExampleBlock>

		<ExampleBlock number="2.5.2" title="Support Vector Machine">
			<p>La fonction de perte hinge d'un classifieur SVM :</p>
			<KatexBlock formula={svmLoss} />
			<p>
				est convexe : chaque terme <KatexInline formula={String.raw`t \mapsto \max(0, 1-t)`} /> est convexe
				et croissant, et l'application <KatexInline
					formula={String.raw`w \mapsto y_i(w^\top x_i + b)`}
				/> est affine en <KatexInline formula={String.raw`w`} />. Le théorème 2.5 (composition)
				donne la convexité de chaque terme, et le théorème 2.1 (somme) donne celle de <KatexInline
					formula={String.raw`f`}
				/>. Le problème d'entraînement d'un SVM est donc un problème d'optimisation convexe.
			</p>
		</ExampleBlock>
	</TheorySection>

	<!-- ================= ML EXAMPLES ================= -->
	<TheorySection>
		<h2 id="exemples-ml">Exemples en Machine Learning</h2>

		<p>
			Voyons maintenant comment ces principes abstraits se concrétisent dans les algorithmes
			d'apprentissage les plus courants.
		</p>

		<h3>Régression linéaire par moindres carrés</h3>

		<ExampleBlock number="2.6" title="Moindres carrés ordinaires">
			<p>
				Pour un jeu de données <KatexInline formula={String.raw`\{(x_i, y_i)\}_{i=1}^n`} /> où les <KatexInline
					formula={String.raw`x_i`}
				/> sont des vecteurs dans <KatexInline formula={String.raw`\mathbb{R}^d`} /> et les <KatexInline
					formula={String.raw`y_i`}
				/> des scalaires, la fonction de perte des moindres carrés est :
			</p>
			<KatexBlock formula={mseLoss} />
			<p>Chaque terme individuel :</p>
			<KatexBlock formula={msePerSample} />
			<p>
				est une forme quadratique convexe en <KatexInline formula={String.raw`w`} /> (composition de
				<KatexInline formula={String.raw`t \mapsto t^2`} />, convexe, avec l'application affine <KatexInline
					formula={String.raw`w \mapsto y_i - w^\top x_i`}
				/>). Par le théorème 2.1, la moyenne <KatexInline formula={String.raw`f(w)`} /> est donc convexe.
				On calcule facilement le gradient et la Hessienne :
			</p>
			<KatexBlock formula={olsGrad} />
			<KatexBlock formula={olsHess} />
			<p>
				Notez que la Hessienne ne dépend pas de <KatexInline formula={String.raw`w`} /> : elle est constante.
				Le problème est purement quadratique, ce qui en fait le cas le plus simple d'optimisation convexe.
			</p>
		</ExampleBlock>

		<TheoremBlock number="2.6.1" title="Solution en forme fermée">
			<p>
				Si <KatexInline formula={String.raw`X^\top X`} /> est inversible — ce qui équivaut à <KatexInline
					formula={rankCond}
				/>, c'est-à-dire à l'indépendance linéaire des colonnes de la matrice de design <KatexInline
					formula={String.raw`X`}
				/> — alors le problème admet une solution unique, obtenue en annulant le gradient :
			</p>
			<KatexBlock formula={olsClosedForm} />
		</TheoremBlock>

		<Callout type="warning" title="Quand la matrice n'est pas inversible">
			Si le nombre de variables dépasse le nombre d'observations (<KatexInline
				formula={String.raw`d > n`}
			/>), ou si certaines variables sont linéairement dépendantes, alors <KatexInline
				formula={String.raw`X^\top X`}
			/> est singulière. Le problème est alors mal posé — il existe une infinité de solutions minimisant
			aussi <KatexInline formula={String.raw`f`} /> — et nécessite une régularisation pour être résolu
			de façon unique.
		</Callout>

		<InteractiveSection
			number="2.3"
			title="Ajustement linéaire"
			onInteract={tracker.trackInteraction}
		>
			<LinearRegressionFit />
		</InteractiveSection>

		<!-- Ajouter après le Callout "Quand la matrice n'est pas inversible" -->
		<ExpertPanel title="Solution de norme minimale et pseudo‑inverse de Moore‑Penrose">
			<p>
				Lorsque <KatexInline formula={String.raw`X^\top X`} /> est singulière, l’équation normale
				<KatexInline formula={String.raw`X^\top X w = X^\top y`} /> admet une infinité de solutions. Parmi
				elles, la <strong>solution de plus petite norme</strong> (au sens euclidien) est donnée par
				la <strong>pseudo‑inverse de Moore‑Penrose</strong>
				<KatexInline formula={String.raw`X^+`} />.
			</p>

			<p>
				Soit la décomposition en valeurs singulières (SVD) de <KatexInline
					formula={String.raw`X \in \mathbb{R}^{n \times d}`}
				/> :
			</p>
			<KatexBlock formula={String.raw`X = U \Sigma V^\top,`} />
			<p>
				où <KatexInline formula={String.raw`U`} /> et <KatexInline formula={String.raw`V`} /> sont orthogonales
				et <KatexInline formula={String.raw`\Sigma`} /> est une matrice diagonale rectangulaire contenant
				les valeurs singulières <KatexInline
					formula={String.raw`\sigma_1 \ge \cdots \ge \sigma_r > 0`}
				/>, avec <KatexInline formula={String.raw`r = \mathrm{rang}(X)`} />. La pseudo‑inverse
				s’écrit :
			</p>
			<KatexBlock formula={String.raw`X^+ = V \Sigma^+ U^\top,`} />
			<p>
				où <KatexInline formula={String.raw`\Sigma^+`} /> est la transposée de <KatexInline
					formula={String.raw`\Sigma`}
				/> dans laquelle on a inversé les valeurs singulières non nulles (<KatexInline
					formula={String.raw`\sigma_i \mapsto 1/\sigma_i`}
				/>).
			</p>

			<TheoremBlock number="2.6.1.bis" title="Solution de norme minimale">
				<p>
					La solution <KatexInline formula={String.raw`w^+ = X^+ y`} /> est l’unique vecteur de norme
					minimale parmi toutes les solutions du problème des moindres carrés :
				</p>
				<KatexBlock formula={String.raw`\min_{w \in \mathbb{R}^d} \|Xw - y\|^2`} />
				<p>
					Autrement dit, <KatexInline formula={String.raw`w^+`} /> vérifie
					<KatexInline formula={String.raw`X^\top X w^+ = X^\top y`} /> et, pour toute autre solution
					<KatexInline formula={String.raw`w`} />, on a <KatexInline
						formula={String.raw`\|w^+\| \le \|w\|`}
					/>.
				</p>
			</TheoremBlock>

			<div class="proof-block">
				<p><strong>Démonstration (esquisse) :</strong></p>
				<p>
					En utilisant la SVD, on a <KatexInline formula={String.raw`X = U \Sigma V^\top`} />. Le
					problème des moindres carrés se réécrit :
				</p>
				<KatexBlock
					formula={String.raw`\min_{w} \|U \Sigma V^\top w - y\|^2 = \min_{z = V^\top w} \|\Sigma z - U^\top y\|^2`}
				/>
				<p>
					La solution générale en <KatexInline formula={String.raw`z`} /> est donnée par
					<KatexInline formula={String.raw`z_i = (U^\top y)_i / \sigma_i`} /> pour
					<KatexInline formula={String.raw`i \le r`} />, tandis que les composantes
					<KatexInline formula={String.raw`z_i`} /> pour <KatexInline formula={String.raw`i > r`} /> sont
					arbitraires. La norme <KatexInline formula={String.raw`\|w\| = \|z\|`} /> est minimisée en choisissant
					<KatexInline formula={String.raw`z_i = 0`} /> pour
					<KatexInline formula={String.raw`i > r`} />. On obtient ainsi
					<KatexInline formula={String.raw`w^+ = V \Sigma^+ U^\top y`} />, qui est bien la solution
					de norme minimale. ∎
				</p>
			</div>

			<p>
				<strong>Lien avec la régularisation Ridge :</strong> La solution Ridge
				<KatexInline formula={String.raw`w_\lambda^* = (X^\top X + \lambda I_d)^{-1} X^\top y`} />
				converge vers <KatexInline formula={String.raw`w^+`} /> lorsque
				<KatexInline formula={String.raw`\lambda \to 0^+`} />, même si
				<KatexInline formula={String.raw`X^\top X`} /> est singulière. En effet, en utilisant la SVD,
				on a :
			</p>
			<KatexBlock
				formula={String.raw`
					w_\lambda^*
					= V \left( \Sigma^\top \Sigma + \lambda I_d \right)^{-1} \Sigma^\top U^\top y
					\quad \xrightarrow[\lambda \to 0]{} \quad
					V \Sigma^+ U^\top y = X^+ y.
				`}
			/>
			<p>
				Ainsi, la régularisation Ridge peut être interprétée comme une approximation régularisée de
				la pseudo‑inverse : elle sélectionne la solution de norme minimale tout en stabilisant le
				calcul numérique lorsque la matrice est mal conditionnée.
			</p>
		</ExpertPanel>

		<h3>Régularisation Ridge</h3>
		<Callout type="note">
			Nous étudierons en détail la régression Ridge dans la partie sur la régularisation, où nous
			aborderons ses propriétés théoriques et son comportement dans différents scénarios.
		</Callout>
		<p>
			Lorsque <KatexInline formula={String.raw`X^\top X`} /> n'est pas inversible, ou simplement pour
			améliorer la généralisation du modèle, on ajoute un terme de pénalité quadratique sur les poids
			: la régularisation Ridge (<KatexInline formula={String.raw`L_2`} />).
		</p>

		<TheoremBlock number="2.6.2" title="Régularisation Ridge">
			<p>La fonction objectif régularisée est :</p>
			<KatexBlock formula={ridgeFormula} />
			<p>
				avec <KatexInline formula={String.raw`\lambda > 0`} />. Alors :
			</p>
			<ol>
				<li>
					<KatexInline formula={String.raw`f_\lambda`} /> est <strong>strictement convexe</strong>
				</li>
				<li>
					la Hessienne <KatexInline formula={ridgeHess} /> est <strong>définie positive</strong>,
					quel que soit le rang de <KatexInline formula={String.raw`X`} />
				</li>
				<li>
					le problème admet <strong>toujours</strong> une solution unique :
					<KatexBlock formula={ridgeSolution} />
				</li>
			</ol>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration (idée principale) :</strong></p>
			<p>La Hessienne régularisée vérifie, pour tout vecteur non nul :</p>
			<KatexBlock formula={ridgePositiveDef} />
			<p>
				Puisque <KatexInline formula={String.raw`\lambda > 0`} />, la matrice <KatexInline
					formula={String.raw`H`}
				/> est strictement définie positive — donc toujours inversible, indépendamment du rang de <KatexInline
					formula={String.raw`X`}
				/>. La solution unique s'obtient en résolvant <KatexInline
					formula={String.raw`\nabla f_\lambda(w) = 0`}
				/>. ∎
			</p>
		</div>

		<InteractiveSection
			number="2.4"
			title="Chemin de régularisation Ridge"
			onInteract={tracker.trackInteraction}
		>
			<RidgePathExplorer />
		</InteractiveSection>

		<p>
			On peut explorer l'effet du conditionnement numérique de la Hessienne sur les algorithmes
			d'optimisation avec l'outil suivant. Le <strong>nombre de condition</strong> mesure le rapport entre
			la plus grande et la plus petite valeur propre de la Hessienne : un nombre élevé signifie que la
			fonction est très allongée dans certaines directions, ce qui ralentit considérablement la descente
			de gradient.
		</p>

		<InteractiveSection
			number="2.5"
			title="Conditionnement du Hessien"
			onInteract={tracker.trackInteraction}
		>
			<HessianConditionNumber />
		</InteractiveSection>

		<ExercisePanel number="2.2" title="Comportement asymptotique du Ridge">
			{#snippet solution()}
				<p>
					Quand <KatexInline formula={String.raw`\lambda \to 0`} />, le terme <KatexInline
						formula={String.raw`X^\top X + n\lambda I_d`}
					/> tend vers <KatexInline formula={String.raw`X^\top X`} />, donc <KatexInline
						formula={String.raw`w^*_\lambda`}
					/> converge vers <KatexInline formula={String.raw`(X^\top X)^{-1}X^\top y = w^*`} />.
					Quand <KatexInline formula={String.raw`\lambda \to +\infty`} />, la matrice est dominée
					par <KatexInline formula={String.raw`n\lambda I_d`} />, donc <KatexInline
						formula={String.raw`w^*_\lambda \approx \frac{1}{n\lambda} X^\top y \to 0`}
					/> : tous les poids tendent vers zéro. Géométriquement, le Ridge pénalise les poids de grande
					norme et force la solution à rester proche de l'origine, quel que soit l'alignement des données.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`w^*_\lambda`} /> la solution Ridge et <KatexInline
					formula={String.raw`w^*`}
				/> la solution des moindres carrés ordinaires (quand elle existe).
			</p>
			<ol>
				<li>
					Montrez que <KatexInline formula={ridgeLimitZero} /> (si <KatexInline
						formula={String.raw`X^\top X`}
					/> est inversible).
				</li>
				<li>
					Montrez que <KatexInline formula={ridgeLimitInfty} />, et interprétez ce résultat.
				</li>
				<li>
					Interprétez géométriquement l'effet de <KatexInline formula={String.raw`\lambda`} /> sur la
					solution : comment les poids sont-ils « rétrécis » ?
				</li>
			</ol>
		</ExercisePanel>

		<h3>Régression Lasso</h3>

		<Callout type="note">
			Nous étudierons en détail la régression Lasso dans la partie sur la régularisation, où nous
			aborderons ses propriétés théoriques et son comportement dans différents scénarios.
		</Callout>

		<p>
			Le <strong>Lasso</strong> (Least Absolute Shrinkage and Selection Operator) ajoute une pénalité
			proportionnelle à la norme L1 des poids :
		</p>
		<KatexBlock
			formula={String.raw`
		\min_{w \in \mathbb{R}^d}\left(\frac{1}{2n}\|Xw - y\|^2 + \lambda\,\|w\|_1\right),
		\quad
		\|w\|_1 = \sum_{j=1}^d |w_j|.
					`}
		/>
		<p>
			Pour des features orthonormées (<KatexInline formula={String.raw`X^\top X = I`} />), la
			solution se décompose en coordonnées indépendantes. Chaque poids suit l'<strong
				>opérateur de seuillage doux</strong
			> :
		</p>

		<KatexBlock
			formula={String.raw`
w_j^*(\lambda)
=
\text{sign}(w_j^{\text{OLS}})
\cdot
\max\bigl(|w_j^{\text{OLS}}| - \lambda,\; 0\bigr).
				`}
		/>

		<Callout type="intuition">
			{#snippet children()}
				<p>
					Lorsque <KatexInline formula={String.raw`\lambda \ge |w_j^{\text{OLS}}|`} />, le
					coefficient
					<KatexInline formula={String.raw`w_j^*`} /> devient <strong>exactement nul</strong>.
					Contrairement au Ridge qui rétrécit mais n'annule jamais les poids, le Lasso réalise une
					<strong>sélection automatique de variables</strong>
					en produisant des modèles <strong>sparses</strong>. C'est la propriété fondamentale du L1
					en apprentissage automatique.
				</p>
			{/snippet}
		</Callout>

		<InteractiveSection
			number="2.6"
			title="Chemin de régularisation Lasso"
			onInteract={tracker.trackInteraction}
		>
			<LassoPathExplorer />
		</InteractiveSection>

		<h3>Régression logistique</h3>

		<ExampleBlock number="2.7" title="Log-perte pour classification binaire">
			<p>
				Pour la classification binaire avec des cibles <KatexInline
					formula={String.raw`y_i \\in \\{-1, +1\\}`}
				/>, on utilise la log-perte (perte logistique) :
			</p>
			<KatexBlock formula={logLossFormula} />
			<p>Chaque terme individuel :</p>
			<KatexBlock formula={logLossPerSample} />
			<p>
				est convexe. En effet, en posant <KatexInline formula={String.raw`t = y_i w^\top x_i`} />,
				on vérifie que <KatexInline formula={String.raw`t \mapsto \log(1+e^{-t})`} /> est convexe car
				sa dérivée seconde est toujours non négative :
			</p>
			<KatexBlock formula={logLossSecondDeriv} />
			<p>
				et <KatexInline formula={String.raw`w \mapsto y_i w^\top x_i`} /> est affine. Par le théorème
				2.5 (composition), chaque <KatexInline formula={String.raw`f_i`} /> est convexe, donc par le théorème
				2.1,
				<KatexInline formula={String.raw`f`} /> l'est aussi. Contrairement à la régression linéaire, il
				n'existe pas de forme fermée pour le minimum : il faut recourir à un algorithme itératif (descente
				de gradient, méthode de Newton…). La convexité garantit cependant que tout minimum local trouvé
				est également global.
			</p>
		</ExampleBlock>

		<h3>Régularisation générale</h3>

		<ExampleBlock number="2.8" title="Ridge, Lasso et Elastic Net">
			<p>On ajoute souvent un terme de régularisation à la fonction de perte :</p>
			<KatexBlock formula={regGeneral} />
			<p>
				où <KatexInline formula={String.raw`\lambda \ge 0`} /> contrôle l'intensité de la régularisation.
				Les choix classiques sont :
			</p>
			<ul>
				<li>
					<strong>Ridge</strong> (<KatexInline formula={String.raw`L_2`} />) : <KatexInline
						formula={ridgeReg}
					/> — convexe, différentiable partout, coercive. Elle rétrécit les poids de manière uniforme
					(cf. Théorème 2.6.2).
				</li>
				<li>
					<strong>Lasso</strong> (<KatexInline formula={String.raw`L_1`} />) : <KatexInline
						formula={lassoReg}
					/> — convexe (c'est une norme) mais non différentiable en <KatexInline
						formula={String.raw`w=0`}
					/>. Elle produit des solutions <em>sparse</em> : certains poids sont exactement nuls, réalisant
					une sélection automatique de variables.
				</li>
				<li>
					<strong>Elastic Net</strong> : <KatexInline formula={elasticNetReg} /> — combinaison convexe
					des deux pénalités précédentes (convexité préservée par le théorème 2.1).
				</li>
			</ul>
		</ExampleBlock>

		<ExpertPanel title="Elastic Net : pourquoi combiner Ridge et Lasso">
			L'Elastic Net offre la sparsité du Lasso tout en évitant son instabilité lorsque des variables
			sont fortement corrélées — un problème fréquent en pratique, où le Lasso a tendance à choisir
			arbitrairement une seule variable parmi un groupe corrélé. Voir Zou &amp; Hastie (2005).
		</ExpertPanel>

		<Callout type="summary" title="Synthèse des exemples ML">
			Tous ces problèmes partagent une structure commune : perte convexe + régularisation convexe =
			objectif convexe. Cette garantie théorique est ce qui rend l'apprentissage automatique «
			classique » efficace et prédictible. Quand la convexité disparaît (réseaux de neurones), on
			perd ces garanties mais on gagne en expressivité.
		</Callout>
	</TheorySection>

	<!-- ================= DEEP LEARNING NON-CONVEXITY ================= -->
	<TheorySection>
		<h2 id="non-convexite-deep-learning">Non-convexité en Deep Learning</h2>

		<p>
			Les réseaux de neurones profonds cassent la structure convexe étudiée jusqu'ici. Même si la
			fonction de perte élémentaire est convexe (MSE, log-perte…), la composition non linéaire des
			couches rend le paysage d'optimisation hautement non convexe.
		</p>

		<Callout type="warning" title="Perte de convexité">
			<p>
				Pour un réseau de neurones de paramètres <KatexInline formula={String.raw`\theta`} />,
				l'objectif :
			</p>
			<KatexBlock formula={nnLoss} />
			<p>
				est généralement <strong>non convexe</strong>, même si <KatexInline
					formula={String.raw`\ell`}
				/> est une perte convexe. La raison : la fonction <KatexInline
					formula={String.raw`h_\theta`}
				/> qui représente le réseau n'est <strong>pas affine</strong> en <KatexInline
					formula={String.raw`\theta`}
				/> — le théorème 2.5 (composition affine) ne s'applique donc plus. Les poids des différentes couches
				sont multipliés entre eux, créant un espace de paramètres hautement non linéaire.
			</p>
		</Callout>

		<p><strong>Conséquences :</strong></p>
		<ul>
			<li>
				Les algorithmes d'optimisation ne garantissent plus que des minima locaux, pas globaux.
			</li>
			<li>Le point de départ (initialisation) influence fortement le résultat final.</li>
			<li>
				La Hessienne n'est plus semi-définie positive en général — on trouve des points-selle et des
				maxima locaux.
			</li>
		</ul>

		<Callout type="intuition" title="Paradoxe apparent">
			Malgré la non-convexité théorique, les réseaux de neurones fonctionnent bien en pratique. En
			très haute dimension (millions ou milliards de paramètres), une conjecture largement étayée
			empiriquement est que la plupart des minima locaux ont des performances proches, et que les
			algorithmes de descente de gradient stochastique trouvent en pratique des solutions avec
			d'excellentes propriétés de généralisation. C'est un domaine de recherche actif, encore mal
			compris théoriquement.
		</Callout>

		<ExpertPanel title="Points-selle vs minima locaux">
			En très haute dimension, les points critiques sont majoritairement des points-selle plutôt que
			des minima locaux : il y a simplement trop de directions pour qu'un point soit un minimum dans
			toutes simultanément. Les algorithmes comme SGD avec momentum peuvent échapper aux plateaux en
			exploitant le bruit du gradient stochastique, ce qui aide à traverser les régions de courbure
			faible. Voir Dauphin et al. (2014) &amp; Pascanu et al. (2014).
		</ExpertPanel>
	</TheorySection>

	<!-- ================= SYNTHESIS TABLE ================= -->
	<TheorySection>
		<h2 id="synthese-proprietes">Synthèse des propriétés conservées</h2>

		<p>
			Deux propriétés supplémentaires, très utilisées en analyse de convergence, se conservent
			également par somme : la <strong>forte convexité</strong> et la
			<strong>Lipschitz-continuité du gradient</strong>. Établissons-les avant la synthèse finale.
		</p>

		<DefinitionBlock number="2.9" title="Fonction fortement convexe">
			<p>
				Une fonction <KatexInline formula={String.raw`g`} /> est dite <KatexInline
					formula={String.raw`\mu`}
				/>-<strong>fortement convexe</strong>
				(avec <KatexInline formula={String.raw`\mu > 0`} />) si, pour tout <KatexInline
					formula={String.raw`x, y`}
				/> et tout
				<KatexInline formula={String.raw`\lambda \in [0,1]`} /> :
			</p>
			<KatexBlock formula={strongConvexDef} />
			<p>
				Intuitivement, <KatexInline formula={String.raw`g`} /> est au moins aussi courbée qu'une parabole
				de courbure
				<KatexInline formula={String.raw`\mu`} /> : la forte convexité est une version quantitative de
				la convexité stricte.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="2.10" title="Gradient Lipschitz-continu">
			<p>
				Une fonction <KatexInline formula={String.raw`g`} /> a un gradient <KatexInline
					formula={String.raw`L`}
				/>-<strong>Lipschitz-continu</strong> si :
			</p>
			<KatexBlock formula={lipschitzGradDef} />
			<p>
				Cette condition borne la vitesse à laquelle le gradient peut varier ; elle est utilisée pour
				dériver les pas de descente admissibles dans les garanties de convergence de la descente de
				gradient.
			</p>
		</DefinitionBlock>

		<p>
			Les tableaux ci-dessous résument les propriétés qui se transfèrent des fonctions individuelles
			à la somme moyenne. C'est cette transférabilité qui justifie l'analyse terme par terme et rend
			l'optimisation en ML prédictible.
		</p>

		<div class="synthesis-table">
			<table>
				<thead>
					<tr>
						<th>Propriété</th>
						<th>Conservée par somme ?</th>
						<th>Exemple ML</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Convexité</strong></td>
						<td>✓ Oui (si <KatexInline formula={String.raw`\alpha_i \ge 0`} />)</td>
						<td>Régression linéaire, SVM</td>
					</tr>
					<tr>
						<td><strong>Différentiabilité</strong></td>
						<td>✓ Oui</td>
						<td>Log-perte, MSE</td>
					</tr>
					<tr>
						<td><strong>Coercivité</strong></td>
						<td>✓ Si ≥ 1 terme coercif, les autres minorés</td>
						<td>Ridge (<KatexInline formula={String.raw`\lambda > 0`} />)</td>
					</tr>
					<tr>
						<td><strong>Gradient Lipschitz</strong></td>
						<td>✓ Oui (<KatexInline formula={lipschitzLBound} />)</td>
						<td>Bornes de pas pour la descente de gradient</td>
					</tr>
					<tr>
						<td><strong>Forte convexité</strong></td>
						<td>✓ Oui (même <KatexInline formula={String.raw`\mu`} />)</td>
						<td>Ridge avec <KatexInline formula={String.raw`\lambda > 0`} /></td>
					</tr>
				</tbody>
			</table>
		</div>

		<Callout type="summary" title="Retenir">
			La structure en somme des fonctions de perte en Machine Learning permet de transférer les
			opriétés individuelles à la fonction globale. C'est ce transfert qui facilite l'analyse
			théorique et la conception d'algorithmes d'optimisation efficaces. Quand une propriété est
			conservée, on peut l'étudier sur un seul terme <KatexInline formula={String.raw`f_i`} /> puis la
			généraliser à <KatexInline formula={String.raw`f`} />.
		</Callout>

		<h2>Exercices de consolidation</h2>

		<ExercisePanel number="2.3" title="Forte convexité d'une moyenne">
			<p>
				Montrez que si chaque <KatexInline formula={String.raw`f_i`} /> est <KatexInline
					formula={String.raw`\mu`}
				/>-fortement convexe, alors la moyenne <KatexInline formula={fSum} /> est également <KatexInline
					formula={String.raw`\mu`}
				/>-fortement convexe.
			</p>
			{#snippet solution()}
				<p>
					Par hypothèse, chaque <KatexInline formula={String.raw`f_i`} /> vérifie la définition 2.9. En
					sommant ces
					<KatexInline formula={String.raw`n`} /> inégalités et en divisant par <KatexInline
						formula={String.raw`n`}
					/> :
				</p>
				<KatexBlock formula={strongConvexSumProof} />
				<p>
					Le membre de droite se réécrit exactement comme <KatexInline
						formula={String.raw`\lambda f(x) + (1-\lambda) f(y) - \frac{\mu}{2}\lambda(1-\lambda)\|x-y\|^2`}
					/>, car <KatexInline formula={String.raw`\frac{1}{n}\sum_i \mu = \mu`} /> (le coefficient ne
					dépend pas de <KatexInline formula={String.raw`i`} />). Donc <KatexInline
						formula={String.raw`f`}
					/> est <KatexInline formula={String.raw`\mu`} />-fortement convexe — avec le
					<strong>même</strong>
					module <KatexInline formula={String.raw`\mu`} /> que chaque terme, sans dégradation. ∎
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2.4" title="Lipschitz-continuité du gradient d'une moyenne">
			<p>
				Soit <KatexInline formula={String.raw`f = \frac{1}{n} \sum_{i=1}^n f_i`} />. Démontrez
				rigoureusement que si chaque gradient <KatexInline formula={String.raw`\nabla f_i`} /> est <KatexInline
					formula={String.raw`L_i`}
				/>-Lipschitz-continu (au sens de la Définition 2.10), alors le gradient <KatexInline
					formula={String.raw`\nabla f`}
				/> de la moyenne est <KatexInline formula={String.raw`L`} />-Lipschitz-continu avec <KatexInline
					formula={lipschitzLBound}
				/>.
			</p>
			<p>
				<strong>Indice :</strong> Utilisez l'inégalité triangulaire sur la norme de la somme des gradients,
				puis appliquez l'hypothèse de Lipschitz sur chaque terme.
			</p>
			{#snippet solution()}
				<p>
					En utilisant l'inégalité triangulaire puis l'hypothèse de Lipschitz sur chaque terme :
				</p>
				<KatexBlock formula={lipschitzSumProof} />
				<p>
					La dernière inégalité s'écrit <KatexInline
						formula={String.raw`\|\nabla f(x) - \nabla f(y)\| \le L \|x - y\|`}
					/>, ce qui est exactement la définition de la
					<KatexInline formula="L" />-Lipschitz-continuité de <KatexInline formula="\nabla f" />,
					avec <KatexInline formula={lipschitzLBound} />. ∎
				</p>
			{/snippet}
		</ExercisePanel>
	</TheorySection>

	<!-- ================= BIBLIOGRAPHY ================= -->
	<Bibliography>
		<BibElement
			authors={['Hoerl, A. E.', 'Kennard, R. W.']}
			year={1970}
			title="Ridge regression: Biased estimation for nonorthogonal problems"
			journal="Technometrics, 12(1), 55-67."
			link="https://doi.org/10.1080/00401706.1970.10488634"
		/>
		<BibElement
			authors={['Tibshirani, R.']}
			year={1996}
			title="Regression shrinkage and selection via the lasso"
			journal="Journal of the Royal Statistical Society, Series B, 58(1), 267-288."
			link="https://doi.org/10.1111/j.2517-6161.1996.tb02080.x"
		/>
		<BibElement
			authors={['Boyd, S.', 'Vandenberghe, L.']}
			year={2004}
			title="Convex Optimization"
			journal="Cambridge University Press."
			link="https://web.stanford.edu/~boyd/cvxbook/"
		/>
		<BibElement
			authors={['Zou, H.', 'Hastie, T.']}
			year={2005}
			title="Regularization and variable selection via the elastic net"
			journal="Journal of the Royal Statistical Society, Series B."
			link="https://doi.org/10.1111/j.1467-9868.2005.00503.x"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer Series in Statistics. New York: Springer."
			link="https://hastie.su.domains/ElemStatLearn/"
		/>
		<BibElement
			authors={['Golub, G. H.', 'Van Loan, C. F.']}
			year={2013}
			title="Matrix Computations (4th ed.)"
			journal="Johns Hopkins University Press."
			link="https://www.cs.cornell.edu/cv/GVL4/"
		/>
		<BibElement
			authors={[
				'Dauphin, Y. N.',
				'Pascanu, R.',
				'Gulcehre, C.',
				'Cho, K.',
				'Ganguli, S.',
				'Bengio, Y.'
			]}
			year={2014}
			title="Identifying and attacking the saddle point problem in high-dimensional non-convex optimization"
			journal="Advances in Neural Information Processing Systems (NeurIPS)."
		/>
		<BibElement
			authors={['Bottou, L.', 'Curtis, F. E.', 'Nocedal, J.']}
			year={2018}
			title="Optimization methods for large-scale machine learning"
			journal="SIAM Review, 60(2), 223-311."
			link="https://doi.org/10.1137/16M1080173"
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

	.synthesis-table {
		overflow-x: auto;
		margin: 1.5rem 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95em;
	}

	th,
	td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	th {
		background-color: color-mix(in srgb, var(--color-positive, #4caf50) 8%, transparent);
		font-weight: 600;
		position: sticky;
		top: 0;
	}

	tbody tr:hover {
		background-color: color-mix(in srgb, var(--border-color, #e0e0e0) 30%, transparent);
	}
</style>
