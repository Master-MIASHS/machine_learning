<script lang="ts">
	/**
	 * Leçon 4 — SGD, CD & Newton
	 * Partie I : Optimisation (Leçon 4/4)
	 */
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';

	// ── Demos ──
	import SGDvsGDComparison from '$lib/components/demos/SGDvsGDComparison.svelte';
	import GradientVarianceDemo from '$lib/components/demos/GradientVarianceDemo.svelte';
	import CoordinateDescentAnim from '$lib/components/demos/CoordinateDescentAnim.svelte';
	import NewtonAnimator from '$lib/components/demos/NewtonAnimator.svelte';
	import ConvergenceRace from '$lib/components/demos/ConvergenceRace.svelte';

	// ── Navigation ──
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part1/lesson4');
	const tracker = createPageTracker(meta as PageMeta);
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	// ── TOC entries ──
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
			description: 'Contexte et contraintes pratiques',
			color: 'neutral'
		},
		{
			id: 'sgd',
			label: 'Descente de gradient stochastique (SGD)',
			description: 'Estimateur sans biais, mini-batch, convergence',
			color: 'epistemic'
		},
		{
			id: 'coordinate-descent',
			label: 'Coordinate Descent',
			description: 'Optimisation coordonnée par coordonnée, Lasso',
			color: 'positive'
		},
		{
			id: 'newton-raphson',
			label: 'Méthode de Newton-Raphson',
			description: 'Hessienne, convergence quadratique locale',
			color: 'surprise'
		},
		{
			id: 'synthese-methodes',
			label: 'Synthèse : quelle méthode choisir ?',
			description: 'Comparaison coût/précision des 4 méthodes',
			color: 'neutral'
		}
	];

	// ── Symboles atomiques ──
	const fSym = 'f';
	const xSym = 'x';
	const dSym = 'd';
	const nSym = 'n';
	const LSym = 'L';
	const ikSym = 'i_k';
	const BkSym = 'B_k';
	const BSym = 'B';
	const alphakSym = '\\alpha_k';
	const setOneToN = '\\{1, \\dots, n\\}';
	const xStarSym = 'x^*';
	const c1Sym = 'c_1';
	const LHSym = 'L_H';

	// ── Section 1 : SGD ──
	const fMeanForm = 'f(x) = \\frac{1}{n} \\sum_{i=1}^{n} f_i(x)';
	const sgdUpdate = 'x^{(k+1)} = x^{(k)} - \\alpha_k \\nabla f_{i_k}(x^{(k)})';
	const miniBatchUpdate =
		'x^{(k+1)} = x^{(k)} - \\alpha_k \\frac{1}{B} \\sum_{i \\in B_k} \\nabla f_i(x^{(k)})';
	const exactGradMean = '\\nabla f(x) = \\frac{1}{n} \\sum_{i=1}^n \\nabla f_i(x)';
	const sgdUnbiasedE = '\\mathbb{E}[\\nabla f_i(x)] = \\nabla f(x)';
	const sgdUnbiasedProof =
		'\\mathbb{E}[\\nabla f_{i_k}(x)] = \\sum_{i=1}^n \\frac{1}{n} \\nabla f_i(x) = \\nabla f(x)';
	const sgdCostCompare = '\\text{Coût GD par pas} = n \\times \\text{Coût SGD par pas}';
	const robbinsMonroCond =
		'\\sum_{k=0}^{\\infty} \\alpha_k = +\\infty, \\quad \\sum_{k=0}^{\\infty} \\alpha_k^2 < +\\infty';
	const sgdConvergence = '\\mathbb{E}[\\|x^{(k)} - x^*\\|^2] \\to 0';
	const stepConstant = '\\alpha_k = \\alpha';
	const stepPoly = '\\alpha_k = \\frac{\\alpha_0}{1 + \\gamma k}';
	const stepCosine =
		'\\alpha_k = \\frac{\\alpha_{\\min}}{2} + \\frac{\\alpha_0 - \\alpha_{\\min}}{2} \\left(1 + \\cos(\\pi k / K)\\right)';
	const gammaPos = '\\gamma > 0';
	const sgdPropStep = '\\alpha_k = \\frac{\\alpha}{\\sqrt{k}}';
	const sgdPropAvg = '\\bar{x}_K = \\frac{1}{K} \\sum_{k=1}^{K} x^{(k)}';
	const sgdPropRate = '\\mathbb{E}[f(\\bar{x}_K)] - f(x^*) = O(1/\\sqrt{K})';
	const batchTypical = 'B \\in \\{32, 64, 128, 256\\}';

	// ── Section 2 : Coordinate Descent ──
	const separableForm = 'f(x) = \\sum_{j=1}^d g_j(x_j)';
	const cdUpdate =
		'x^{(k+1)}_j = \\arg\\min_{t}\\; f\\big(x^{(k+1)}_1, \\dots, x^{(k+1)}_{j-1},\\; t,\\; \\dots,\\; x^{(k)}_d\\big)';
	const cdJacobi = 'x^{(k+1)}_i = \\arg\\min_t f(x^{(k)}_1, \\dots, t, \\dots, x^{(k)}_d)';
	const cdGreedy = 'i = \\arg\\max_j \\left|\\tfrac{\\partial f}{\\partial x_j}(x)\\right|';
	const cdRate = 'f(x^{(k)}) - f^* = O(d/k)';
	const fRdToR = 'f : \\mathbb{R}^d \\to \\mathbb{R}';
	const softThreshold = 'x_j^{(k+1)} = \\text{sign}(z_j)\\max(|z_j| - \\lambda, 0)';
	const lassoObjective = 'f(x) = \\tfrac{1}{2}\\|Ax - b\\|^2 + \\lambda \\|x\\|_1';

	// ── Section 3 : Newton ──
	const taylor2 =
		'f(y) \\approx f(x) + \\nabla f(x)^\\top (y - x) + \\tfrac{1}{2}(y-x)^\\top H_f(x)(y-x)';
	const quadModelZero = '\\nabla q(y) = 0 \\iff H_f(x)(y - x) + \\nabla f(x) = 0';
	const newtonStep = 'x^{(k+1)} = x^{(k)} - [H_f(x^{(k)})]^{-1} \\nabla f(x^{(k)})';
	const hessDef = 'H_f(x)_{ij} = \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}(x)';
	const rateQuadric = '\\|e_{k+1}\\| \\leq C \\|e_k\\|^2';
	const newtonExactQuad = 'f(x) = \\tfrac{1}{2}x^\\top Q x - b^\\top x';
	const modelEqualsF = 'q(y) \\equiv f(y)';
	const newtonDir = 'd_k = -[H_f(x^{(k)})]^{-1}\\nabla f(x^{(k)})';
	const armijoCond =
		'f(x^{(k)} + \\alpha_k d_k) \\leq f(x^{(k)}) + c_1 \\alpha_k \\nabla f(x^{(k)})^\\top d_k';
	const hessianCostCubic = 'O(d^3)';
	const eDefNewton = 'e_k = x^{(k)} - x^*';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'SGD, CD & Newton'}
	subtitle="Optimisation avancée : approches stochastiques, par coordonnées et méthodes du second ordre"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ═══════════════════════════════════════ -->
	<!-- INTRODUCTION                            -->
	<!-- ═══════════════════════════════════════ -->

	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			Les trois leçons précédentes ont établi les fondements théoriques de l'optimisation sans
			contrainte : les conditions qui caractérisent un minimum (Leçon 1), le rôle privilégié de la
			convexité pour passer d'une garantie locale à une garantie globale (Leçon 2), et l'algorithme
			de référence — la descente de gradient — avec sa justification par développement de Taylor
			(Leçon 3). Cette dernière leçon de la Partie I complète ce tableau en présentant trois
			familles d'algorithmes qui répondent chacune à une <strong>contrainte pratique</strong>
			différente rencontrée dès qu'on quitte le cadre théorique pour appliquer ces méthodes à des problèmes
			réels d'apprentissage automatique.
		</p>

		<p>Ces trois contraintes, et les réponses algorithmiques qui leur correspondent, sont :</p>

		<ul>
			<li>
				<strong>Le volume de données</strong> — quand <KatexInline formula={nSym} /> est de l'ordre du
				million ou plus, calculer le gradient exact à chaque itération devient prohibitif. La
				<strong>descente de gradient stochastique (SGD)</strong> répond à ce problème en remplaçant le
				gradient exact par une estimation aléatoire, beaucoup moins coûteuse à calculer.
			</li>
			<li>
				<strong>La structure du problème</strong> — quand la fonction objectif se décompose
				naturellement selon les coordonnées de la variable, ou que la régularisation utilisée (L1,
				Lasso) a une forme explicite coordonnée par coordonnée, la
				<strong>descente coordonnée (CD)</strong> exploite directement cette structure plutôt que de traiter
				toutes les variables simultanément.
			</li>
			<li>
				<strong>L'information disponible</strong> — quand la fonction est deux fois différentiable
				et que calculer sa Hessienne est réalisable, la <strong>méthode de Newton</strong> exploite l'information
				de courbure pour converger en un nombre d'itérations spectaculairement plus faible que la simple
				descente de gradient — au prix d'un coût de calcul par itération beaucoup plus élevé.
			</li>
		</ul>

		<Callout type="intuition" title="Pourquoi trois méthodes plutôt qu'une seule ?">
			Aucun algorithme ne domine universellement tous les autres. Le choix dépend du coût par
			évaluation de gradient (ou de Hessienne), de la dimension du problème, et de la structure de
			la fonction objectif. Cette leçon montre comment chaque méthode exploite une propriété
			différente du problème pour converger efficacement — et, tout aussi important, dans quelles
			circonstances chacune devient impraticable. La section de synthèse en fin de leçon compare
			explicitement les quatre méthodes vues dans cette partie (GD compris) sur ces critères.
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════ -->
	<!-- SECTION 1 — SGD (Stochastic GD)         -->
	<!-- ═══════════════════════════════════════ -->

	<TheorySection>
		<h2 id="sgd">1. Descente de gradient stochastique (SGD)</h2>

		<p>
			En apprentissage automatique, la fonction objectif à minimiser est presque toujours une
			<strong>moyenne empirique</strong> sur un ensemble d'exemples d'entraînement :
		</p>

		<KatexBlock formula={fMeanForm} />

		<p>
			où chaque <KatexInline formula={String.raw`f_i`} /> représente la perte du modèle sur l'exemple
			<KatexInline formula={String.raw`i`} /> (c'est exactement la structure étudiée en détail dans la
			Leçon 2, où nous avions vu que la convexité, la différentiabilité et la coercivité se transmettent
			de chaque terme <KatexInline formula={String.raw`f_i`} /> à la moyenne <KatexInline
				formula={fSym}
			/>). Chaque <KatexInline formula={String.raw`f_i`} /> pris individuellement est en général une fonction
			simple et peu coûteuse à différentier. Le problème vient du nombre de termes : dès que <KatexInline
				formula={nSym}
			/> atteint quelques centaines de milliers — ce qui est la norme, pas l'exception, en apprentissage
			moderne —
			<strong>chaque évaluation du gradient exact</strong> nécessite de parcourir l'intégralité du jeu
			de données. Une seule itération de descente de gradient standard devient alors elle-même un calcul
			coûteux, avant même de parler du nombre d'itérations nécessaires pour converger.
		</p>

		<h3>1.1 L'idée centrale : remplacer le gradient exact par une estimation</h3>

		<p>
			L'idée de SGD est aussi simple que radicale : plutôt que de calculer, à chaque itération, le
			gradient complet
		</p>

		<KatexBlock formula={exactGradMean} />

		<p>
			on tire un unique indice aléatoire <KatexInline formula={ikSym} /> et on utilise le gradient d'un
			seul terme, <KatexInline formula={String.raw`\nabla f_{i_k}(x)`} />, comme
			<em>estimation</em>
			du gradient complet. Le coût d'une itération passe ainsi de <KatexInline
				formula={String.raw`O(n)`}
			/> évaluations de gradient à <KatexInline formula={String.raw`O(1)`} /> :
		</p>
		<KatexBlock formula={sgdCostCompare} />

		<DefinitionBlock number="4.1" title="Descente de gradient stochastique (SGD)">
			<p>
				Soit <KatexInline formula={fMeanForm} /> avec chaque <KatexInline
					formula={String.raw`f_i`}
				/>
				différentiable. L'algorithme SGD itère :
			</p>
			<KatexBlock formula={sgdUpdate} />
			<p>
				où <KatexInline formula={ikSym} /> est tiré uniformément dans <KatexInline
					formula={setOneToN}
				/>, et <KatexInline formula={String.raw`(\alpha_k)_{k \geq 0}`} /> est une suite de pas positifs.
			</p>
		</DefinitionBlock>

		<p>
			À première vue, remplacer le vrai gradient par un seul terme choisi au hasard semble une
			approximation grossière — et de fait, la direction suivie à chaque itération individuelle peut
			être très éloignée de la véritable direction de plus forte pente. Ce qui rend la méthode
			viable n'est pas la précision d'un pas isolé, mais une propriété statistique de l'estimateur,
			valable en moyenne sur de nombreuses itérations.
		</p>

		<TheoremBlock number="4.2" title="L'estimateur SGD est sans biais">
			<p>
				Pour tout <KatexInline formula={xSym} />, l'espérance du gradient stochastique coïncide avec
				le gradient exact :
			</p>
			<KatexBlock formula={sgdUnbiasedE} />

			<Callout type="proof" title="Esquisse de démonstration">
				<p>
					Puisque <KatexInline formula={ikSym} /> est uniforme sur <KatexInline
						formula={setOneToN}
					/> :
				</p>
				<KatexBlock formula={sgdUnbiasedProof} />
			</Callout>

			<p>
				Ce résultat justifie que SGD suit globalement la bonne direction : chaque pas individuel est
				bruité, mais en espérance, il pointe exactement là où pointerait le gradient exact. Le bruit
				s'annule en moyenne sans jamais biaiser systématiquement la trajectoire dans une mauvaise
				direction.
			</p>
		</TheoremBlock>

		<Callout type="intuition" title="Le compromis coût / bruit en une phrase">
			Le calcul d'une seule étape de GD nécessite l'évaluation du gradient sur les <KatexInline
				formula={nSym}
			/> données, tandis qu'un pas de SGD utilise un seul exemple. Une itération de GD est donc
			<KatexInline formula={nSym} /> fois plus coûteuse qu'une itération de SGD — mais chaque pas de SGD
			est beaucoup plus bruité. L'expérience ci-dessous permet de visualiser directement ce compromis
			: la trajectoire de SGD est visiblement plus erratique que celle de GD, mais progresse à une vitesse
			comparable en termes de temps de calcul total.
		</Callout>

		<InteractiveSection
			number="4.1"
			title="Comparaison SGD vs GD"
			onInteract={tracker.trackInteraction}
		>
			<SGDvsGDComparison />
		</InteractiveSection>

		<!-- ═══════════════════════════════════════ -->
		<!-- SECTION 1.2 — Mini-batch SGD            -->
		<!-- ═══════════════════════════════════════ -->

		<h3>1.2 Mini-batch : le compromis pratique</h3>

		<p>
			Entre les deux extrêmes — le SGD pur, qui utilise un seul exemple et produit une trajectoire
			très bruitée, et le gradient exact, dont le coût par itération explose avec
			<KatexInline formula={nSym} /> — la pratique standard consiste à utiliser un
			<strong>mini-lot</strong> (mini-batch) de taille intermédiaire.
		</p>

		<DefinitionBlock number="4.3" title="Mini-batch Gradient Descent">
			<p>
				Soit <KatexInline formula={BkSym} /> un sous-ensemble aléatoire de taille <KatexInline
					formula={BSym}
				/> tiré de <KatexInline formula={setOneToN} />. L'itération est :
			</p>
			<KatexBlock formula={miniBatchUpdate} />
		</DefinitionBlock>

		<p>
			C'est la formule interpole exactement entre les deux cas extrêmes : en posant <KatexInline
				formula={String.raw`B=1`}
			/>, on retrouve le SGD pur (Définition 4.1) ; en posant <KatexInline
				formula={String.raw`B=n`}
			/>, on retrouve le gradient exact. Le paramètre <KatexInline formula={BSym} /> permet donc de choisir
			continûment un point sur ce spectre.
		</p>

		<Callout type="intuition" title="Le compromis coût / variance">
			En pratique, les tailles typiques en deep learning sont <KatexInline formula={batchTypical} /> —
			elles donnent le meilleur rapport précision/coût pour la plupart des applications. Augmenter <KatexInline
				formula={BSym}
			/> réduit la variance du bruit de gradient — approximativement selon une loi en <KatexInline
				formula={String.raw`1/B`}
			/>, comme le montre le graphique interactif ci-dessous — mais augmente proportionnellement le
			coût de calcul d'un pas. Doubler la taille du batch ne fait donc pas nécessairement progresser
			deux fois plus vite : cela réduit le bruit tout en doublant le coût, un arbitrage qui dépend
			du problème et du matériel disponible.
		</Callout>

		<InteractiveSection
			number="4.2"
			title="Variance du gradient stochastique"
			onInteract={tracker.trackInteraction}
		>
			<GradientVarianceDemo />
		</InteractiveSection>

		<!-- ═══════════════════════════════════════ -->
		<!-- SECTION 1.3 — Convergence du SGD        -->
		<!-- ═══════════════════════════════════════ -->

		<h3>1.3 Convergence asymptotique du SGD</h3>

		<p>
			Le caractère sans biais de l'estimateur (Théorème 4.2) ne suffit pas, à lui seul, à garantir
			la convergence de l'algorithme : un estimateur non biaisé mais dont le bruit ne diminue jamais
			peut très bien osciller indéfiniment autour du minimum sans jamais s'en approcher. C'est le
			rôle de la suite de pas <KatexInline formula={alphakSym} /> : elle doit décroître suffisamment vite
			pour amortir progressivement le bruit stochastique, mais rester assez grande, assez longtemps, pour
			permettre à l'algorithme d'explorer l'espace et de ne pas se figer prématurément loin de l'optimum.
		</p>

		<TheoremBlock number="4.4" title="Convergence du SGD — conditions de Robbins-Monro">
			<p>
				Soit <KatexInline formula={fSym} /> convexe et <KatexInline formula={LSym} />
				-lipschitzienne. Si la suite de pas satisfait :
			</p>
			<KatexBlock formula={robbinsMonroCond} />
			<p>
				alors <KatexInline formula={sgdConvergence} /> (convergence en espérance).
			</p>
		</TheoremBlock>

		<p>
			Ces deux conditions ont chacune un rôle précis, qu'il vaut la peine de dissocier. La première,
			<KatexInline formula={String.raw`\sum \alpha_k = +\infty`} />, garantit que la somme cumulée
			des pas est suffisamment grande pour que l'algorithme puisse parcourir n'importe quelle
			distance finie depuis son point de départ — sans elle, les pas pourraient décroître trop vite
			et l'algorithme resterait bloqué avant d'atteindre l'optimum. La seconde, <KatexInline
				formula={String.raw`\sum \alpha_k^2 < +\infty`}
			/>, garantit que le bruit accumulé au fil des itérations reste borné — sans elle, la variance
			du bruit stochastique ne s'amortirait jamais et empêcherait toute convergence précise.
		</p>

		<ExampleBlock number="4.5" title="Plans de décroissance classiques">
			<ul>
				<li>
					<strong>Pas constant :</strong>
					<KatexInline formula={stepConstant} /> — ne satisfait pas Robbins-Monro (la seconde somme diverge),
					et converge donc seulement vers un
					<strong>voisinage</strong> de l'optimum, pas exactement vers lui. C'est néanmoins le choix le
					plus courant en deep learning, où l'on privilégie souvent la vitesse initiale à la précision
					asymptotique exacte.
				</li>
				<li>
					<strong>Décroissance polynomiale :</strong>
					<KatexInline formula={stepPoly} /> — satisfait les conditions de Robbins-Monro pour tout
					<KatexInline formula={gammaPos} />, et garantit donc la convergence exacte en espérance.
				</li>
				<li>
					<strong>Cosine annealing :</strong>
					<KatexInline formula={stepCosine} /> — ne satisfait pas non plus Robbins-Monro au sens strict
					(le pas ne tend généralement pas vers 0 sur un horizon fini <KatexInline
						formula={String.raw`K`}
					/>), mais est très populaire en deep learning car elle combine une décroissance
					progressive avec des redémarrages permettant d'échapper à des minima locaux médiocres.
				</li>
			</ul>
		</ExampleBlock>

		<TheoremBlock number="4.11" title="Convergence du SGD (Proposition 3.11 des notes)">
			<p>
				Pour une fonction convexe et <KatexInline formula={LSym} />-lisse, avec pas décroissant
				<KatexInline formula={sgdPropStep} /> :
			</p>
			<KatexBlock formula={sgdPropRate} />
			<p>
				où <KatexInline formula={sgdPropAvg} /> est la moyenne des itérés.
			</p>
		</TheoremBlock>
	</TheorySection>

	<!-- ═══════════════════════════════════════ -->
	<!-- SECTION 2 — Coordinate Descent          -->
	<!-- ═══════════════════════════════════════ -->

	<TheorySection>
		<h2 id="coordinate-descent">2. Coordinate Descent (Descente coordonnée)</h2>

		<p>
			SGD répond à une contrainte de <em>volume</em> : trop d'exemples pour calculer un gradient
			exact à chaque pas. La descente coordonnée (CD) répond à une contrainte différente, de
			<em>structure</em> : plutôt que de mettre à jour simultanément les <KatexInline
				formula={dSym}
			/> composantes de la variable d'optimisation, on ne modifie qu'une seule composante à la fois, en
			la fixant à sa valeur optimale exacte étant donné toutes les autres.
		</p>

		<p>Cette stratégie est particulièrement efficace lorsque :</p>
		<ul>
			<li>
				Le calcul du gradient complet est coûteux, mais la minimisation le long d'un seul axe est
				simple ;
			</li>
			<li>
				La fonction se décompose naturellement en une somme séparable par coordonnées, <KatexInline
					formula={separableForm}
				/> ;
			</li>
			<li>
				La régularisation L1 (Lasso) induit des solutions creuses — CD exploite cette structure
				explicitement, comme le montre l'Exemple 4.6.1 ci-dessous.
			</li>
		</ul>

		<DefinitionBlock number="4.6" title="Coordinate Descent cyclique">
			<p>
				Soit <KatexInline formula={fRdToR} />. À chaque itération <KatexInline
					formula={String.raw`k`}
				/>, on choisit une coordonnée <KatexInline formula={String.raw`j_k`} /> (par cycle : <KatexInline
					formula={String.raw`1,2,\dots,d,1,2,\dots`}
				/>) et on met à jour :
			</p>
			<KatexBlock formula={cdUpdate} />
			<p>
				Autrement dit, on résout exactement le problème de minimisation à une seule variable obtenu
				en fixant les coordonnées non encore traitées à leur valeur courante, tout en conservant,
				pour les coordonnées déjà traitées, leurs valeurs fraîchement mises à jour.
			</p>
			<p>
				Chaque valeur mise à jour est utilisée immédiatement pour les coordonnées suivantes : ce
				n'est pas la méthode de Jacobi.
			</p>
		</DefinitionBlock>

		<Callout type="note" title="Variante de Jacobi et stratégies de parcours (optionnel)">
			<p>
				La <strong>variante de Jacobi</strong> met à jour toutes les coordonnées à partir de l'état
				à l'itération <KatexInline formula={String.raw`k`} /> :
			</p>
			<KatexBlock formula={cdJacobi} />
			<p>
				La descente par coordonnées, de style Gauss–Seidel, exploite au contraire les valeurs
				fraîchement calculées dès qu'elles sont disponibles — c'est ce qui lui fait généralement
				converger plus vite. Trois stratégies de parcours des coordonnées : <strong>cyclique</strong
				>
				(ordre fixe <KatexInline formula={String.raw`1, 2, \dots, d, 1, 2, \dots`} />,
				<strong>aléatoire</strong>
				(tirage uniforme d'une coordonnée à chaque itération) et
				<strong>glouton</strong> (coordonnée de plus grande composante de gradient, <KatexInline
					formula={cdGreedy}
				/> — coûteux).
			</p>
		</Callout>

		<p>
			L'outil interactif ci-dessous anime cette procédure sur une fonction à deux variables : à
			chaque étape, on observe la trajectoire se déplacer strictement le long de l'axe <KatexInline
				formula="x"
			/> ou de l'axe <KatexInline formula="y" />, jamais en diagonale — c'est la signature visuelle
			caractéristique de CD, très différente du chemin plus direct suivi par la descente de gradient
			classique.
		</p>

		<InteractiveSection
			number="4.3"
			title="Animation du Coordinate Descent"
			onInteract={tracker.trackInteraction}
		>
			<CoordinateDescentAnim />
		</InteractiveSection>

		<h3>2.1 Analyse théorique</h3>

		<TheoremBlock number="4.7" title="Convergence du CD cyclique">
			<p>
				Soit <KatexInline formula={fSym} /> convexe, <KatexInline formula="C^1" />-lipschitzienne
				par coordonnée avec constante <KatexInline formula="L_j" /> pour chaque coordonnée <KatexInline
					formula="j"
				/>. Alors :
			</p>
			<KatexBlock formula={cdRate} />
			<p>
				Le taux dépend linéairement de la dimension <KatexInline formula={dSym} /> — c'est le prix à payer
				pour n'optimiser qu'une seule coordonnée à la fois : il faut, en quelque sorte,
				<KatexInline formula={dSym} /> fois plus d'itérations pour que chaque coordonnée ait eu l'occasion
				d'être mise à jour un nombre comparable de fois.
			</p>
		</TheoremBlock>

		<ExampleBlock number="4.7.1" title="Coordinate descent pour le Lasso">
			<p>
				Considérons l'objectif Lasso : <KatexInline formula={lassoObjective} />, avec <KatexInline
					formula="\lambda > 0"
				/>. Bien que le terme <KatexInline formula="\|x\|_1" /> ne soit pas différentiable en
				<KatexInline formula="0" />, la minimisation exacte le long d'une seule coordonnée <KatexInline
					formula="x_j"
				/> (en fixant les autres) admet une solution explicite, appelée
				<strong>seuillage doux</strong> (soft-thresholding) :
			</p>
			<KatexBlock formula={softThreshold} />
			<p>
				où <KatexInline formula="z_j" /> est la valeur qui minimiserait le terme quadratique seul. Cette
				formule explicite est exactement ce qui rend CD si naturel pour le Lasso : chaque mise à jour
				de coordonnée a un coût de calcul minime, et le résultat révèle directement quelles coordonnées
				sont poussées à exactement zéro (d'où la sparsité de la solution), sans qu'aucune approximation
				itérative supplémentaire ne soit nécessaire à chaque pas.
			</p>
		</ExampleBlock>

		<Callout type="intuition" title="Pourquoi CD marche bien en pratique">
			Dans les problèmes de régression Lasso, chaque mise à jour coordonnée a une forme explicite
			(seuillage doux), comme on vient de le voir. Cela rend CD non seulement efficace, mais aussi
			<strong>interprétable</strong> : on observe directement, coordonnée par coordonnée, quelles variables
			deviennent nulles et lesquelles restent actives — une transparence rarement disponible avec les
			méthodes de gradient classiques appliquées à des objectifs non lisses.
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════ -->
	<!-- SECTION 3 — Méthode de Newton           -->
	<!-- ═══════════════════════════════════════ -->

	<TheorySection>
		<h2 id="newton-raphson">3. La méthode de Newton-Raphson</h2>

		<p>
			SGD et CD répondent toutes deux à des contraintes de coût ou de structure en simplifiant
			<em>chaque itération</em> — mais elles n'exploitent, comme la descente de gradient classique,
			que l'information du <strong>premier ordre</strong> : la direction du gradient. La méthode de Newton
			prend le chemin inverse : elle accepte un coût par itération beaucoup plus élevé en échange d'une
			information beaucoup plus riche, la courbure locale de la fonction, capturée par sa matrice Hessienne.
			Cette information provient directement du développement de Taylor à l'ordre 2, déjà rencontré dans
			la démonstration de la CSSO en Leçon 1 :
		</p>

		<KatexBlock formula={taylor2} />

		<p>
			L'idée de Newton est de prendre cette approximation quadratique <em>au sérieux</em> : plutôt
			que de simplement suivre la direction de plus forte pente comme le fait la descente de
			gradient, on calcule directement le minimum exact de ce modèle quadratique local, noté
			<KatexInline formula="q(y)" />, et on saute directement à ce point.
		</p>

		<p>Le minimum du modèle quadratique satisfait la condition du premier ordre :</p>

		<KatexBlock formula={quadModelZero} />

		<p>
			En résolvant cette équation linéaire pour <KatexInline formula="y" />, on obtient directement
			la direction de Newton :
		</p>

		<DefinitionBlock number="4.8" title="Méthode de Newton (sans amortissement)">
			<p>
				Soit <KatexInline formula="f \in C^2" />, strictement convexe, avec Hessienne inversible.
				L'itération est :
			</p>
			<KatexBlock formula={newtonStep} />
			<p>où l'Hessienne est la matrice des dérivées secondes :</p>
			<KatexBlock formula={hessDef} />
		</DefinitionBlock>

		<p>
			Comparée à la descente de gradient (<KatexInline
				formula={String.raw`x^{k + 1} = x^{k} - \alpha \nabla f(x^{k})`}
			/>), la différence structurelle est que le pas n'est plus scalaire (<KatexInline
				formula="\alpha"
			/>) mais une transformation linéaire complète de l'espace, donnée par l'inverse de la
			Hessienne. C'est précisément cette transformation qui permet à Newton de "voir" la courbure
			différente selon chaque direction — un avantage majeur sur des fonctions dont les courbes de
			niveau sont très allongées, où le gradient seul indique souvent une direction de descente très
			inefficace.
		</p>

		<InteractiveSection
			number="4.4"
			title="Animation de la méthode de Newton"
			onInteract={tracker.trackInteraction}
		>
			<NewtonAnimator />
		</InteractiveSection>

		<h3>3.1 Propriété fondamentale : convergence quadratique</h3>

		<p>
			La propriété qui rend Newton si attractif — et qui justifie son coût élevé par itération — est
			sa vitesse de convergence locale, qualitativement différente de celle des méthodes de premier
			ordre.
		</p>

		<TheoremBlock number="4.9" title="Convergence quadratique locale">
			<p>
				Soit <KatexInline formula="f \in C^2" />, strictement convexe, avec <KatexInline
					formula={xStarSym}
				/> minimum global. Notons <KatexInline formula={eDefNewton} /> l'erreur à l'itération <KatexInline
					formula="k"
				/>. Si l'Hessienne est <KatexInline formula={LHSym} />-lipschitzienne autour de <KatexInline
					formula={xStarSym}
				/>, alors pour tout point initial suffisamment proche de <KatexInline formula={xStarSym} /> :
			</p>
			<KatexBlock formula={rateQuadric} />
			<p>
				Cela signifie que le nombre de chiffres significatifs corrects <strong>double</strong> à chaque
				itération, une fois suffisamment proche de l'optimum — une vitesse de convergence sans commune
				mesure avec la convergence linéaire (au mieux) de la descente de gradient.
			</p>
		</TheoremBlock>

		<Callout type="intuition" title="Newton sur un quadratique pur">
			<p>
				Si <KatexInline formula={newtonExactQuad} />, le modèle de Taylor d'ordre 2 est exact — non
				pas une approximation locale, mais une égalité valable sur tout l'espace :
				<KatexInline formula={modelEqualsF} />. Newton converge donc en un seul pas, quelle que soit
				l'inclinaison ou le conditionnement de la fonction quadratique : l'Hessienne est constante
				et l'approximation quadratique est parfaite partout, pas seulement au voisinage du point
				courant.
			</p>
			<p>
				Sur une fonction non quadratique (par exemple Rosenbrock), cette exactitude disparaît :
				Newton a besoin de plusieurs itérations, mais leur nombre de chiffres corrects double
				néanmoins rapidement une fois suffisamment proche du minimum — c'est exactement le phénomène
				que l'animation ci-dessus permet d'observer directement en comparant plusieurs fonctions
				test.
			</p>
		</Callout>

		<h3>3.2 Amortissement et recherche de ligne</h3>

		<p>
			Le Théorème 4.9 est un résultat <strong>local</strong> : il ne s'applique que "pour tout point initial
			suffisamment proche" du minimum. Loin de l'optimum, la direction de Newton peut être mal conditionnée,
			voire pointer dans une direction qui n'est pas du tout une direction de descente — en particulier
			si l'Hessienne n'est pas définie positive en ce point (un point-selle, par exemple, comme ceux rencontrés
			dans les contre-exemples de la Leçon 1). Pour rendre la méthode robuste sur tout le domaine, et
			pas seulement près du minimum, on introduit un pas amorti :
		</p>

		<DefinitionBlock number="4.10" title="Newton amorti (Damped Newton)">
			<p>
				Calculer la direction de Newton <KatexInline formula={newtonDir} />, puis chercher un pas
				<KatexInline formula="\alpha_k > 0" /> satisfaisant la condition d'Armijo :
			</p>
			<KatexBlock formula={armijoCond} />
			<p>
				où <KatexInline formula={c1Sym} /> est une petite constante (typiquement <KatexInline
					formula="10^{-4}"
				/>). Cette condition garantit que le pas choisi produit une décroissance suffisante de <KatexInline
					formula={fSym}
				/>, même quand le pas complet <KatexInline formula="\alpha_k = 1" /> (celui utilisé dans la Définition
				4.8) ne le ferait pas.
			</p>
		</DefinitionBlock>

		<Callout type="warning" title="Limites de Newton en grande dimension">
			L'Hessienne est une matrice <KatexInline formula="d \times d" />. Son inversion coûte
			<KatexInline formula={hessianCostCubic} /> — un coût cubique en la dimension, à comparer au coût
			linéaire <KatexInline formula="O(d)" /> d'un pas de gradient ou de CD. En apprentissage automatique,
			où <KatexInline formula="d" /> peut dépasser le million de paramètres (un réseau de neurones typique,
			par exemple), la méthode de Newton exacte est tout simplement inapplicable : stocker la Hessienne
			elle-même (<KatexInline formula="d^2" /> nombres) dépasserait déjà la mémoire disponible. On utilise
			alors des variantes qui n'exigent pas de former ni d'inverser la Hessienne complète : Quasi-Newton
			(BFGS et ses variantes à mémoire limitée comme L-BFGS), gradient conjugué non linéaire, ou des approximations
			diagonales de la Hessienne (utilisées par exemple dans Adam).
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════ -->
	<!-- SECTION 4 — SYNTHÈSE COMPARATIVE        -->
	<!-- ═══════════════════════════════════════ -->

	<TheorySection>
		<h2 id="synthese-methodes">4. Synthèse : quelle méthode choisir ?</h2>

		<p>
			Cette partie du cours a présenté quatre méthodes d'optimisation : la descente de gradient
			classique (Leçon 3), et les trois variantes de cette leçon — SGD, CD, et Newton. Chacune fait
			un arbitrage différent entre le coût de calcul par itération et le nombre d'itérations
			nécessaires pour converger, ce qui explique pourquoi aucune ne domine systématiquement les
			autres :
		</p>

		<div class="synthesis-table">
			<table>
				<thead>
					<tr>
						<th>Méthode</th>
						<th>Coût/itération</th>
						<th>Taux</th>
						<th>Cas d'usage</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td data-label="Méthode"><strong>GD</strong></td>
						<td data-label="Coût/itération">O(d × n)</td>
						<td data-label="Taux">Linéaire (si fortement convexe)</td>
						<td data-label="Cas d'usage">Fonctions lisses, petit dataset</td>
					</tr>
					<tr>
						<td data-label="Méthode"><strong>SGD</strong></td>
						<td data-label="Coût/itération">O(d) — mini-batch O(B×d)</td>
						<td data-label="Taux">O(1/√k) en espérance</td>
						<td data-label="Cas d'usage">Grand dataset, deep learning</td>
					</tr>
					<tr>
						<td data-label="Méthode"><strong>CD</strong></td>
						<td data-label="Coût/itération">O(d) par coordonnée</td>
						<td data-label="Taux">O(d/k)</td>
						<td data-label="Cas d'usage">Lasso, fonctions séparables</td>
					</tr>
					<tr>
						<td data-label="Méthode"><strong>Newton</strong></td>
						<td data-label="Coût/itération">O(d³)</td>
						<td data-label="Taux">Quadratique (local)</td>
						<td data-label="Cas d'usage">Fonctions C², d modérée</td>
					</tr>
				</tbody>
			</table>
		</div>

		<p>
			La course de convergence ci-dessous permet de comparer directement les quatre méthodes sur la
			même fonction, en temps réel : observez non seulement <em>quelle</em> méthode atteint le
			minimum en premier en nombre d'itérations, mais aussi la <em>forme</em> de chaque trajectoire —
			la ligne lisse et monotone de GD et Newton, contre l'allure en escalier de CD et la trajectoire
			bruitée de SGD.
		</p>

		<InteractiveSection
			number="4.5"
			title="Course de convergence"
			onInteract={tracker.trackInteraction}
		>
			<ConvergenceRace />
		</InteractiveSection>

		<div class="synthesis-note">
			<h3>Note sur le compromis coût/précision</h3>
			<p>
				Dans la course ci-dessus, Newton atteint l'optimum en très peu d'itérations — c'est la
				convergence quadratique du Théorème 4.9 à l'œuvre. Mais chaque itération coûte
				<KatexInline formula={hessianCostCubic} />. Pour <KatexInline formula="d = 10^6" />
				variables (un ordre de grandeur courant en deep learning), GD ou SGD sont les seuls choix viables,
				même s'ils nécessitent objectivement beaucoup plus d'itérations pour converger : le produit (coût
				par itération) × (nombre d'itérations) reste, dans ce régime, largement en faveur des méthodes
				de premier ordre.
			</p>
		</div>

		<Callout type="summary" title="Retenir de cette leçon">
			<ul>
				<li>
					<strong>SGD</strong> remplace un gradient exact coûteux par une estimation sans biais (Théorème
					4.2) — idéal pour les grands datasets, au prix d'une trajectoire bruitée dont l'amplitude doit
					être contrôlée par le choix du pas (conditions de Robbins-Monro, Théorème 4.4).
				</li>
				<li>
					<strong>Mini-batch SGD</strong> réduit la variance du bruit (approximativement en
					<KatexInline formula="1/B" />) tout en restant <KatexInline formula="O(B \times d)" /> par itération.
					<KatexInline formula={batchTypical} /> correspond aux tailles typiques en pratique.
				</li>
				<li>
					<strong>Coordinate Descent</strong> optimise une coordonnée à la fois, exactement — efficace
					pour les fonctions séparables et les problèmes L1, où chaque mise à jour a souvent une forme
					explicite (seuillage doux pour le Lasso).
				</li>
				<li>
					<strong>Méthode de Newton</strong> exploite l'information de courbure (Hessienne) pour une
					convergence quadratique locale (Théorème 4.9), mais coûte
					<KatexInline formula={hessianCostCubic} /> par itération — impraticable en très grande dimension
					sans approximation (Quasi-Newton, L-BFGS).
				</li>
				<li>
					Aucune méthode ne domine universellement : le choix dépend du coût d'évaluation, de la
					dimension du problème, et de la structure de la fonction objectif.
				</li>
			</ul>
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════════════════ -->
	<!-- BIBLIOGRAPHIE                           -->
	<!-- ═══════════════════════════════════════ -->

	<Bibliography>
		<BibElement
			authors={['Bottou, L.']}
			year={2010}
			title="Large-scale machine learning with stochastic gradient descent"
			journal="Proceedings of COMPSTAT'2010."
			link="https://hal.inria.fr/inria-00577394/document"
		/>

		<BibElement
			authors={['Nesterov, Y.']}
			year={2004}
			title="Introductory Lectures on Convex Optimization: A Basic Course"
			journal="Kluwer Academic Publishers."
			link="https://link.springer.com/book/10.1007/978-1-4419-8853-9"
		/>

		<BibElement
			authors={['Shalev-Shwartz, S.', 'Ben-David, S.']}
			year={2014}
			title="Understanding Machine Learning: From Theory to Algorithms"
			journal="Cambridge University Press."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>

		<BibElement
			authors={['Bubeck, S.']}
			year={2015}
			title="Convex Optimization: Algorithms and Complexity"
			journal="Foundations and Trends® in Machine Learning."
			link="https://arxiv.org/abs/1405.4980"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.synthesis-table {
		margin: 1rem 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;
	}

	th,
	td {
		padding: 0.5rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	th {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	tbody tr:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.synthesis-note {
		padding: 1rem;
		margin: 1rem 0;
		border-radius: var(--radius-md, 8px);
		background: rgba(125, 125, 125, 0.06);
	}

	.synthesis-note h3 {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.synthesis-note p {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
	}

	@media (max-width: 700px) {
		table,
		thead,
		tbody,
		th,
		td,
		tr {
			display: block;
		}

		tr {
			margin-bottom: 0.75rem;
			padding: 0.5rem;
			border: 1px solid var(--color-border);
			border-radius: 6px;
		}

		th,
		td {
			border: none;
			text-align: right;
			padding: 0.2rem 0;
		}

		td::before {
			content: attr(data-label);
			float: left;
			font-weight: 600;
			color: var(--color-text-muted);
		}
	}
</style>
