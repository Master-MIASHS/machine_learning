<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	import Quiz from '$lib/components/narrative/Quiz.svelte';
	import { getQuizQuestions } from '$lib/quiz';

	const meta = getPageByPath('/part1/methodes-proximales');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz = getQuizQuestions('p1/proximal');
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
			label: 'Pourquoi des méthodes proximales ?',
			description: 'Le Lasso n’est ni lisse ni lisseable',
			color: 'epistemic'
		},
		{
			id: 'operateur-proximal',
			label: "L'opérateur proximal",
			description: 'Un compromis, une formule, une géométrie',
			color: 'positive'
		},
		{
			id: 'descente-proximale',
			label: 'Descente proximale (ISTA)',
			description: 'Gradient + proximal, taux O(1/k)',
			color: 'belief'
		},
		{
			id: 'fista',
			label: 'FISTA : l’accélération',
			description: 'Le momentum de Nesterov, taux O(1/k²)',
			color: 'belief'
		},
		{
			id: 'admm',
			label: "L'ADMM",
			description: 'Éclatement de variables et multiplicateur',
			color: 'surprise'
		},
		{
			id: 'liaison-sous-gradient-fenchel',
			label: 'Sous-gradient, Fenchel, Douglas–Rachford',
			description: 'Trois identités, un même objet',
			color: 'neutral'
		},
		{
			id: 'exemple-logistique',
			label: 'Exemple guidé : FISTA logistique',
			description: 'Le pseudo-code, sans système à résoudre',
			color: 'agent'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'La boîte à outils proximale',
			color: 'epistemic'
		}
	];

	/* ---------------------------- formules KaTeX ---------------------------- */

	const lassoModel = String.raw`\hat\theta_{\mathrm{Lasso}} = \arg\min_{\theta}\; \lVert y - X\theta \rVert_2^2 + \lambda \lVert \theta \rVert_1`;

	const proxDef = String.raw`\operatorname{prox}_{f}(v) = \arg\min_{x}\; f(x) + \tfrac{1}{2}\lVert x - v \rVert^{2}`;

	const proxLambda = String.raw`\operatorname{prox}_{\lambda f}(v) = \arg\min_{x}\; f(x) + \frac{1}{2\lambda}\lVert x - v \rVert^{2}`;

	const proxAdmmConv = String.raw`\operatorname{prox}_{f,\rho}(v) = \arg\min_{x}\; f(x) + \tfrac{\rho}{2}\lVert x - v \rVert^{2}`;

	const softThresh = String.raw`S(v,\,\lambda) = (v - \lambda)_{+} - (-v - \lambda)_{+} = \mathrm{sign}(v)\,\max(|v| - \lambda,\, 0)`;

	const ridgeProx = String.raw`\operatorname{prox}_{\lambda \cdot \frac{\rho}{2}\lVert\cdot\rVert_2^2}(v) = \frac{\lambda}{\lambda + \rho}\, v`;

	const resolvent = String.raw`\operatorname{prox}_{\lambda f} = (I + \lambda\,\partial f)^{-1}`;

	const resolventChar = String.raw`0 \in \partial f(z) + \tfrac{1}{\lambda}(z - x)`;

	const moreau = String.raw`v = \operatorname{prox}_{f}(v) + \operatorname{prox}_{f^{*}}(v)`;

	const ista = String.raw`x^{k+1} = \operatorname{prox}_{\frac{1}{L}\, g}\!\left( x^{k} - \frac{1}{L}\,\nabla f(x^{k}) \right)`;

	const istaLasso = String.raw`\theta^{k+1} = S_{\lambda/L}\!\left( \theta^{k} - \frac{1}{L}\, X^{\top}(X\theta^{k} - y) \right)`;

	const bt31 = String.raw`F(x^{k}) - F(x^{*}) \le \frac{L\,\lVert x^{0} - x^{*}\rVert^{2}}{2k}`;

	const fistaStep1 = String.raw`x^{k} = \operatorname{prox}_{\frac{1}{L}\, g}\!\left( y^{k} - \frac{1}{L}\,\nabla f(y^{k}) \right)`;

	const fistaStep2 = String.raw`t_{k+1} = \frac{1 + \sqrt{1 + 4\,t_{k}^{2}}}{2}`;

	const fistaStep3 = String.raw`y^{k+1} = x^{k} + \frac{t_{k} - 1}{t_{k+1}}\,(x^{k} - x^{k-1})`;

	const bt44 = String.raw`F(x^{k}) - F(x^{*}) \le \frac{2L\,\lVert x^{0} - x^{*}\rVert^{2}}{(k + 1)^{2}}`;

	const admmX = String.raw`x^{k+1} = \arg\min_{x}\; f(x) + \frac{\rho}{2}\lVert Ax + Bz^{k} - c + u^{k}\rVert^{2}`;

	const admmZ = String.raw`z^{k+1} = \arg\min_{z}\; g(z) + \frac{\rho}{2}\lVert Ax^{k+1} + Bz - c + u^{k}\rVert^{2}`;

	const admmU = String.raw`u^{k+1} = u^{k} + Ax^{k+1} + Bz^{k+1} - c`;

	const lassoAdmmX = String.raw`x^{k+1} = (A^{\top}A + \rho I)^{-1}\big( A^{\top}b + \rho(z^{k} - u^{k}) \big)`;

	const lassoAdmmZ = String.raw`z^{k+1} = S_{\lambda/\rho}(x^{k+1} + u^{k})`;

	const lassoAdmmU = String.raw`u^{k+1} = u^{k} + x^{k+1} - z^{k+1}`;

	const moreauYosida = String.raw`e_{\lambda}f(v) = \min_{x}\; f(x) + \frac{1}{2\lambda}\lVert x - v \rVert^{2}`;

	const douglas1 = String.raw`x^{k+1} = \operatorname{prox}_{\lambda f}(z^{k} - u^{k})`;

	const douglas2 = String.raw`z^{k+1} = \operatorname{prox}_{\lambda g}(x^{k+1} + u^{k})`;

	const douglas3 = String.raw`u^{k+1} = u^{k} + x^{k+1} - z^{k+1}`;

	const logLoss = String.raw`\ell(\theta) = \sum_{i}\log\big(1 + e^{-y_{i}\, x_{i}^{\top}\theta}\big)`;

	const logLipschitz = String.raw`L = \tfrac{1}{4}\,\lambda_{\max}(X^{\top}X)`;
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Méthodes proximales : prox, FISTA et ADMM'}
	subtitle="L'opérateur proximal, la descente proximale, son accélération FISTA et l'ADMM"
	prev={prevMeta}
	next={nextMeta}
>
	<TableOfContents entries={tocEntries} />
	<TheorySection>
		<!-- ========================================================= -->
		<!-- 1. INTRODUCTION                                           -->
		<!-- ========================================================= -->
		<h2 id="introduction">Pourquoi des méthodes proximales ?</h2>

		<p>
			Vous connaissez déjà trois familles d'algorithmes d'optimisation : la descente de gradient,
			dont le Théorème 3.4 établit un taux <KatexInline formula={String.raw`O(1/k)`} />
			pour les fonctions convexes <KatexInline formula={String.raw`L`} />-lisses ; Newton, dont la
			convergence devient quadratique près d'un minimum strict ; et le SGD, dont la rapidité se paie
			en variance. Le <strong>Lasso</strong>, lui, a été introduit comme
			<em>modèle</em> :
		</p>

		<KatexBlock formula={lassoModel} />

		<p>
			(Définition 5.2), avec l'algorithme LARS (Algorithme 5.1) comme <em>méthode</em> de calcul
			associée. Mais l'objectif du Lasso est <strong>convexe et non lisse</strong> — le terme <KatexInline
				formula={String.raw`\lVert\theta\rVert_1`}
			/> n'est pas différentiable en 0 : ni la descente de gradient (pas de gradient), ni Newton (pas
			de Hessienne) ne s'appliquent directement. Et la descente par coordonnées, enseignée, traite les
			coordonnées <em>une à une</em> — elle sérialise ce qui est parallélisable.
		</p>

		<p>
			<strong>La question de la leçon</strong> : quelle famille d'algorithmes calcule concrètement
			le Lasso (et bien plus) en traitant les coordonnées <em>en parallèle</em>, en ne nécessitant
			que des produits matrice-vecteur, et dont on sait <em>exactement</em>
			le taux de convergence ? <strong>Les méthodes proximales</strong> — l'opérateur proximal, la descente
			proximale (ISTA), son accélération (FISTA) et l'ADMM.
		</p>

		<!-- ========================================================= -->
		<!-- 2. OPÉRATEUR PROXIMAL                                     -->
		<!-- ========================================================= -->
		<h2 id="operateur-proximal">L'opérateur proximal</h2>

		<DefinitionBlock title="Opérateur proximal">
			<p>
				Soit <KatexInline formula={String.raw`f : \mathbb{R}^n \to \mathbb{R} \cup \{+\infty\}`} /> une
				fonction convexe fermée propre. L'opérateur proximal de <KatexInline formula="f" /> est l'application
			</p>
			<KatexBlock formula={proxDef} />
			<p>
				et, pour <KatexInline formula={String.raw`\lambda > 0`} />, le proximal de
				<KatexInline formula="f" /> avec paramètre <KatexInline formula={String.raw`\lambda`} /> :
			</p>
			<KatexBlock formula={proxLambda} />
			<p>
				Le minimiseur existe et est <strong>unique</strong> pour tout
				<KatexInline formula="v" /> : la fonction minimisée est fortement convexe (le terme quadratique)
				même si <KatexInline formula="f" /> ne l'est pas, et même si
				<KatexInline formula={String.raw`\operatorname{dom} f`} /> est un sous-ensemble propre de
				<KatexInline formula={String.raw`\mathbb{R}^n`} /> — les fonctions à valeur
				<KatexInline formula={String.raw`+\infty`} /> encodent des contraintes.
			</p>
			<p>
				<strong>Lecture</strong> : <KatexInline formula={String.raw`\operatorname{prox}_{f}(v)`} /> est
				le compromis entre « rester près de <KatexInline formula="v" /> » (terme quadratique) et « descendre
				<KatexInline formula="f" /> » (terme <KatexInline formula={String.raw`f(x)`} />). Pour <KatexInline
					formula={String.raw`f = \iota_{C}`}
				/> (fonction indicatrice d'un ensemble fermé convexe <KatexInline formula="C" />),
				<KatexInline formula={String.raw`\operatorname{prox}_{f}(v) = \Pi_{C}(v)`} /> : le proximal
				<strong>généralise la projection</strong>.
			</p>
		</DefinitionBlock>

		<Callout type="warning" title="Deux conventions coexistent dans la littérature">
			<p>Deux écritures du même objet circulent :</p>
			<ul>
				<li>
					Parikh &amp; Boyd 2014, eq. (1.2) : <KatexInline formula={proxLambda} />
				</li>
				<li>
					Boyd et al. 2011, §4.1 : <KatexInline formula={proxAdmmConv} />
				</li>
			</ul>
			<p>
				C'est le <strong>même</strong> opérateur avec un reparamétrage :
				<KatexInline formula={String.raw`\operatorname{prox}_{f,\rho}`} /> (ADMM) =
				<KatexInline formula={String.raw`\operatorname{prox}_{\frac{1}{\rho} f}`} /> (Parikh &amp; Boyd).
				Le reste de la leçon utilise la convention Parikh &amp; Boyd. Conséquence pratique : dans l'ADMM
				(section 5), le seuillage doux apparaît avec le paramètre
				<KatexInline formula={String.raw`\lambda/\rho`} />, alors qu'en descente proximale (section
				3) il apparaît avec <KatexInline formula={String.raw`\lambda/L`} />.
			</p>
		</Callout>

		<ExampleBlock title="Soft-thresholding : le proximal du ‖·‖₁">
			<p>
				Pour <KatexInline formula={String.raw`f = \lVert\cdot\rVert_1`} />, la minimisation est
				séparable coordonnée par coordonnée. En une dimension :
				<KatexInline formula={String.raw`\min_{x}\; |x| + \frac{1}{2\lambda}(x - v)^2`} />.
			</p>
			<ul>
				<li>
					Si <KatexInline formula={String.raw`v > \lambda`} /> : le minimum est en
					<KatexInline formula={String.raw`x = v - \lambda`} /> (le sous-différentiel de
					<KatexInline formula={String.raw`|x|`} /> vaut <KatexInline formula={String.raw`\{1\}`} /> et
					l'équation <KatexInline formula={String.raw`1 + (x - v)/\lambda = 0`} /> donne
					<KatexInline formula={String.raw`x = v - \lambda`} />).
				</li>
				<li>
					Si <KatexInline formula={String.raw`|v| \le \lambda`} /> : le minimum est en
					<KatexInline formula="0" /> (0 appartient à
					<KatexInline formula={String.raw`\partial |0| = [-1, 1]`} /> et
					<KatexInline formula={String.raw`-\tfrac{1}{\lambda} v \in [-1, 1]`} /> exactement quand
					<KatexInline formula={String.raw`|v| \le \lambda`} />).
				</li>
				<li>
					Si <KatexInline formula={String.raw`v < -\lambda`} /> : symétriquement,
					<KatexInline formula={String.raw`x = v + \lambda`} />.
				</li>
			</ul>
			<p>D'où l'opérateur de <strong>seuillage doux</strong> :</p>
			<KatexBlock formula={softThresh} />
			<p>
				<strong>C'est la clé du Lasso</strong> : <KatexInline formula={String.raw`S(v, \lambda)`} /> annule
				<em>exactement</em> les coordonnées dont la magnitude est
				<KatexInline formula={String.raw`\le \lambda`} /> (les « petites » coordonnées), et rétrécit les
				autres. On retrouve mot pour mot la propriété de sélection automatique de variables enseignée
				à la Partie V, leçon 4 (Définition 5.2 et le losange L1) — maintenant avec une
				<strong>formule exacte</strong> et un algorithme pour l'obtenir sans LARS.
			</p>
		</ExampleBlock>

		<ExampleBlock title="Le proximal du ½ρ‖·‖₂² (calcul direct)">
			<p>
				Pour <KatexInline formula={String.raw`g(x) = \frac{\rho}{2}\lVert x \rVert_2^2`} /> (Ridge) :
				<KatexInline
					formula={String.raw`\min_{x}\; \frac{\rho}{2}\lVert x\rVert_2^2 + \frac{1}{2\lambda}\lVert x - v\rVert^2`}
				/>
				est quadratique strictement convexe ; l'équation du premier ordre
				<KatexInline formula={String.raw`\rho x + \frac{x - v}{\lambda} = 0`} /> donne
			</p>
			<KatexBlock formula={ridgeProx} />
			<p>
				Contrairement au Lasso, <strong>aucune coordonnée n'est annulée</strong> : le Ridge rétrécit
				uniformément (facteur
				<KatexInline formula={String.raw`\frac{\lambda}{\lambda + \rho} < 1`} />). C'est exactement
				la différence de comportement Ridge vs Lasso de la Partie V, leçon 4, vue du côté de
				l'algorithme.
			</p>
		</ExampleBlock>

		<TheoremBlock title="Proximal = résolvante du sous-différentiel">
			<p>
				Pour <KatexInline formula="f" /> convexe fermée propre et
				<KatexInline formula={String.raw`\lambda > 0`} /> :
			</p>
			<KatexBlock formula={resolvent} />
			<p>
				c'est-à-dire que <KatexInline
					formula={String.raw`z = \operatorname{prox}_{\lambda f}(x)`}
				/>
				<strong>si et seulement si</strong>
			</p>
			<KatexBlock formula={resolventChar} />
			<p>
				<strong>Esquisse de la preuve</strong> (Parikh & Boyd 2014 §3.2) :
				<KatexInline formula={String.raw`z \in (I + \lambda\partial f)^{-1}(x)`} /> ⟺
				<KatexInline formula={String.raw`x \in z + \lambda\partial f(z)`} /> ⟺
				<KatexInline formula={String.raw`0 \in \partial f(z) + \frac{1}{\lambda}(z - x)`} /> ⟺
				<KatexInline
					formula={String.raw`0 \in \partial_{z}\big( f(z) + \frac{1}{2\lambda}\lVert z - x\rVert^2 \big)`}
				/>, qui est la condition nécessaire et suffisante (forte convexité) pour que
				<KatexInline formula="z" /> minimise cette fonction. L'opérateur
				<KatexInline formula={String.raw`(I + \lambda\partial f)^{-1}`} /> est la
				<em>résolvante</em>
				de
				<KatexInline formula={String.raw`\partial f`} /> : c'est une <strong>fonction</strong>
				(valeur simple), bien que <KatexInline formula={String.raw`\partial f`} /> soit une relation à
				valeurs en ensembles — car le proximal minimise une fonction fortement convexe.
			</p>
			<p>
				<strong>Pourquoi c'est important</strong> : la condition d'optimalité d'un problème
				composite <KatexInline formula={String.raw`\min f(x) + g(x)`} /> (<KatexInline
					formula="f"
				/>
				lisse, <KatexInline formula="g" /> non lisse) est
				<KatexInline formula={String.raw`0 \in \nabla f(x^{*}) + \partial g(x^{*})`} />. Le théorème
				ci-dessus dit que <KatexInline formula={String.raw`x^{*}`} /> la satisfait
				<strong>si et seulement si</strong>
				<KatexInline
					formula={String.raw`x^{*} = \operatorname{prox}_{\lambda g}(x^{*} - \lambda\nabla f(x^{*}))`}
				/> — le point fixe d'un opérateur qu'on <em>sait construire</em>. C'est le pont vers la
				section suivante.
			</p>
		</TheoremBlock>

		<TheoremBlock title="Décomposition de Moreau">
			<p>
				Pour toute fonction convexe fermée propre <KatexInline formula="f" /> et tout <KatexInline
					formula="v"
				/> :
			</p>
			<KatexBlock formula={moreau} />
			<p>
				où <KatexInline formula={String.raw`f^{*}`} /> est la conjugée convexe de
				<KatexInline formula="f" /> (« This property, known as Moreau decomposition, is the main relationship
				between proximal operators and duality. »).
			</p>
			<p>
				<strong>Conséquence pratique</strong> (Parikh & Boyd 2014 §6.5.2) : comme
				<KatexInline formula={String.raw`\lVert\cdot\rVert_1^{*} = \iota_{B}`} /> avec
				<KatexInline formula={String.raw`B = \{w \mid \lVert w \rVert_{\infty} \le \lambda\}`} /> (boule
				duale), on a <KatexInline
					formula={String.raw`\operatorname{prox}_{\lambda \lVert\cdot\rVert_1}(v) = v - \Pi_{B}(v)`}
				/> : le soft-thresholding s'obtient en <em>tronquant</em>
				<KatexInline formula="v" /> en
				<KatexInline formula={String.raw`[-\lambda, \lambda]`} /> et en soustrayant. Le proximal d'une
				norme se ramène toujours à une projection sur la boule duale — un résultat de dualité/Fenchel
				directement exploitable (cf. le panneau expert « Conditions KKT et dualité lagrangienne » de la
				Partie I, leçon 1).
			</p>
		</TheoremBlock>

		<InteractiveSection
			number="E.1"
			title="Le proximal en 1D : visualiser le compromis"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/ProxOperator1D.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 3. DESCENTE PROXIMALE (ISTA)                              -->
		<!-- ========================================================= -->
		<h2 id="descente-proximale">La descente proximale (ISTA)</h2>

		<DefinitionBlock title="Algorithme ISTA / descente proximale">
			<p>
				Pour minimiser <KatexInline formula={String.raw`F(x) = f(x) + g(x)`} /> (<KatexInline
					formula="f"
				/>,
				<KatexInline formula="g" /> convexes fermées propres, <KatexInline formula="f" /> différentiable
				à gradient <KatexInline formula={String.raw`L`} />-Lipschitz) :
			</p>
			<KatexBlock formula={ista} />
			<p>
				avec pas constant <KatexInline formula={String.raw`\lambda = 1/L`} /> (plus généralement tout
				<KatexInline formula={String.raw`\lambda \in (0, 1/L]`} />, et même <KatexInline
					formula={String.raw`\lambda < 2/L`}
				/> pour la convergence — Parikh & Boyd 2014 §4.2). Chaque itération :
				<strong
					>un pas de gradient sur la partie lisse, puis un proximal sur la partie non lisse</strong
				>
				— d'où le nom
				<em>forward-backward</em> (Euler explicite sur <KatexInline formula="f" />, implicite sur
				<KatexInline formula="g" /> ; Parikh & Boyd 2014 §4.2 « Forward-backward integration of gradient flow »).
			</p>
			<p>
				Pour le Lasso avec <KatexInline
					formula={String.raw`f(\theta) = \frac{1}{2}\lVert y - X\theta \rVert_2^2`}
				/> et
				<KatexInline formula={String.raw`g(\theta) = \lambda\lVert\theta\rVert_1`} /> :
				<KatexInline formula={String.raw`\nabla f(\theta) = X^{\top}(X\theta - y)`} />,
				<KatexInline formula={String.raw`L = \lambda_{\max}(X^{\top}X)`} />, et le pas devient
			</p>
			<KatexBlock formula={istaLasso} />
			<p>
				c'est l'<strong>ISTA</strong> (iterative shrinkage-thresholding algorithm, Parikh & Boyd 2014 §7.1.1 /
				Beck & Teboulle 2009 eq. (1.4)–(1.5)). Le facteur
				<KatexInline formula={String.raw`\frac{1}{2}`} /> dans
				<KatexInline formula={String.raw`f(\theta) = \frac{1}{2}\lVert y - X\theta\rVert_2^2`} /> est
				une convention d'écriture qui ne change pas les minimiseurs de la Définition 5.2 du cours ; elle
				fait de
				<KatexInline formula={String.raw`\nabla f(\theta) = X^{\top}(X\theta - y)`} /> le gradient naturel
				(sans facteur 2) et de <KatexInline formula={String.raw`L = \lambda_{\max}(X^{\top}X)`} /> la
				constante de Lipschitz exacte.
			</p>
		</DefinitionBlock>

		<TheoremBlock title="Taux O(1/k)">
			<p>
				Soit <KatexInline formula={String.raw`\{x^{k}\}`} /> la suite ISTA (pas constant
				<KatexInline formula={String.raw`1/L`} /> ou backtracking). Alors pour tout
				<KatexInline formula={String.raw`k \ge 1`} /> et tout minimiseur
				<KatexInline formula={String.raw`x^{*}`} /> :
			</p>
			<KatexBlock formula={bt31} />
			<p>
				(avec un facteur <KatexInline formula={String.raw`\alpha = \eta > 1`} /> en plus en mode backtracking).
				C'est le même <strong>ordre</strong> de taux que la descente de gradient convexe (Théorème
				3.4 :
				<KatexInline
					formula={String.raw`f(x^{k}) - f(x^{*}) \le \frac{L\lVert x^{0} - x^{*}\rVert^{2}}{2k}`}
				/>) — mais valable pour un problème <strong>non lisse</strong>. Conséquence : obtenir une
				précision <KatexInline formula={String.raw`\varepsilon`} /> en valeur coûte
				<KatexInline formula={String.raw`O(L\lVert x^{0} - x^{*}\rVert^2/\varepsilon)`} /> itérations,
				chacune coutant un produit matrice-vecteur par <KatexInline formula={String.raw`X`} /> et par
				<KatexInline formula={String.raw`X^{\top}`} /> (Parikh & Boyd 2014 §7.1.1) — la partie proximale ne dépend pas
				de la dimension <KatexInline formula="d" />.
			</p>
		</TheoremBlock>

		<Callout type="insight" title="Un algorithme, trois visages (Parikh & Boyd 2014 §4.2, « Special cases »)">
			<ul>
				<li>
					<KatexInline formula={String.raw`g = \iota_{C}`} /> (contrainte) :
					<KatexInline formula={String.raw`\operatorname{prox} = \Pi_{C}`} /> →
					<strong>gradient projeté</strong>.
				</li>
				<li>
					<KatexInline formula="f = 0" /> → <strong>algorithme du point proximal</strong>
					(résolvante itérée).
				</li>
				<li>
					<KatexInline formula="g = 0" /> → <strong>descente de gradient classique</strong>.
				</li>
			</ul>
			<p>
				La descente proximale est donc le cadre qui contient les trois algorithmes appris en Partie
				I <em>et</em> le Lasso.
			</p>
		</Callout>

		<ExampleBlock
			title="Pourquoi le taux ne peut pas être meilleur, sans accélération (Parikh & Boyd 2014 §4.3, Beck & Teboulle 2009 §1.2)"
		>
			<p>
				Le taux <KatexInline formula={String.raw`O(1/k)`} /> de l'ISTA est
				<strong>optimal au pire cas</strong> parmi les méthodes au premier ordre (au même titre que
				celui du gradient pour les fonctions lisses, sens de Nemirovsky–Yudin 1979). L'accélération
				de Nesterov (1983) prouve qu'on peut faire
				<KatexInline formula={String.raw`O(1/k^2)`} /> pour les fonctions lisses — la question ouverte
				(1983 → 2009) était : et pour un problème <em>composite</em> (lisse + non lisse) ? FISTA (Beck
				&amp; Teboulle 2009) répond oui, sans changer le coût d'itération. C'est l'objet de la section
				suivante.
			</p>
		</ExampleBlock>

		<!-- ========================================================= -->
		<!-- 4. FISTA                                                  -->
		<!-- ========================================================= -->
		<h2 id="fista">FISTA : l'accélération</h2>

		<DefinitionBlock title="Algorithme FISTA">
			<p>
				Même problème <KatexInline formula={String.raw`\min f(x) + g(x)`} />,
				<KatexInline formula={String.raw`\nabla f`} />
				<KatexInline formula={String.raw`L`} />-Lipschitz. FISTA ajoute à l'ISTA un
				<strong>point extrapolé</strong>
				<KatexInline formula={String.raw`y^{k}`} /> (le momentum) :
			</p>
			<div class="algo">
				<p class="algo-line">
					<strong>Entrée</strong> : <KatexInline formula={String.raw`L = L(f)`} />,
					<KatexInline formula={String.raw`x^{0}`} />
				</p>
				<p class="algo-line">
					<strong>Étape 0</strong> : <KatexInline formula={String.raw`y^{1} = x^{0}`} />,
					<KatexInline formula={String.raw`t_{1} = 1`} />
				</p>
				<p class="algo-line">
					<strong>Étape <em>k</em></strong> (<KatexInline formula={String.raw`k \ge 1`} />) :
				</p>
				<KatexBlock formula={fistaStep1} />
				<p class="algo-annot">(4.1)</p>
				<KatexBlock formula={fistaStep2} />
				<p class="algo-annot">(4.2)</p>
				<KatexBlock formula={fistaStep3} />
				<p class="algo-annot">(4.3)</p>
			</div>
			<p>
				Le seul changement par rapport à l'ISTA : le proximal est évalué au point
				<em>extrapolé</em>
				<KatexInline formula={String.raw`y^{k}`} /> (mélange de
				<KatexInline formula={String.raw`x^{k}`} /> et <KatexInline
					formula={String.raw`x^{k-1}`}
				/>) plutôt qu'à <KatexInline formula={String.raw`x^{k-1}`} />. Le coût d'itération est
				<strong>identique</strong> (un gradient + un proximal) ; le surcoût de (4.2)–(4.3) est
				marginal (Beck & Teboulle 2009 §4). La récurrence (4.2) donne
				<KatexInline formula={String.raw`t_{k} \ge \frac{k+1}{2}`} /> (Beck & Teboulle 2009, Lemme 4.3) — le « momentum
				» croît linéairement.
			</p>
			<p>
				<strong>Variante backtracking</strong> (Beck & Teboulle 2009 §4) : si <KatexInline
					formula={String.raw`L`}
				/> est inconnu, on choisit <KatexInline formula={String.raw`L_{k}`} /> par backtracking (le plus
				petit
				<KatexInline formula={String.raw`\bar{L} = \eta^{i_{k}} L_{k-1}`} /> tel que le modèle quadratique
				majorant soit vérifié) ; le taux est alors garanti avec
				<KatexInline formula={String.raw`\alpha = \eta`} /> au lieu de
				<KatexInline formula={String.raw`\alpha = 1`} /> (Parikh & Boyd 2014 §4.2–§4.3 donnent la même line search).
			</p>
		</DefinitionBlock>

		<TheoremBlock title="Taux O(1/k²) — optimal">
			<p>
				Soit <KatexInline formula={String.raw`\{x^{k}\}`} /> la suite FISTA (pas constant). Alors pour
				tout <KatexInline formula={String.raw`k \ge 1`} /> et tout minimiseur
				<KatexInline formula={String.raw`x^{*}`} /> :
			</p>
			<KatexBlock formula={bt44} />
			<p>
				Comparaison avec l'ISTA : <KatexInline formula={String.raw`C/k`} /> contre
				<KatexInline formula={String.raw`2C/(k+1)^2`} />. Pour atteindre une précision
				<KatexInline formula={String.raw`\varepsilon`} /> :
				<KatexInline formula={String.raw`O(\sqrt{C/\varepsilon})`} /> itérations au lieu de
				<KatexInline formula={String.raw`O(C/\varepsilon)`} /> — <strong>le carré s'épare</strong> (Beck & Teboulle 2009
				: « which clearly improves ISTA »).
			</p>
			<p>
				Ce taux est <strong>optimal au pire cas</strong> parmi les méthodes au premier ordre pour les
				problèmes convexes composites lisse + convexe : il ne peut pas être amélioré sans information
				supplémentaire (Beck & Teboulle 2009 §1.2, §4, d'après Nesterov 1983 et Nemirovsky–Yudin 1979 ; Parikh & Boyd 2014 §4.3 « cannot
				be improved further »).
			</p>
		</TheoremBlock>

		<Callout type="warning" title="Ce que le théorème dit — et ne dit pas">
			<p>
				Le Théorème 4.4 borne <KatexInline formula={String.raw`F(x^{k}) - F^{*}`} />,
				<strong>pas</strong>
				<KatexInline formula={String.raw`\lVert x^{k} - x^{*}\rVert`} />. La convergence de la
				<em>suite</em>
				<KatexInline formula={String.raw`\{x^{k}\}`} /> vers un minimiseur est un résultat distinct, qui
				vient du cadre forward-backward (Combettes &amp; Wajs 2005, Théorème 3.4 — section 6) : la suite
				converge faiblement (toujours) et fortement sous des hypothèses usuelles (dimension finie + conditions
				standard). Ne jamais écrire « FISTA converge en
				<KatexInline formula={String.raw`O(1/k^2)`} /> » sans préciser :
				<strong>en valeur objective</strong>.
			</p>
		</Callout>

		<InteractiveSection
			number="E.2"
			title="ISTA vs FISTA vs ADMM sur un Lasso synthétique"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/FistaLassoAnimator.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 5. ADMM                                                   -->
		<!-- ========================================================= -->
		<h2 id="admm">L'ADMM</h2>

		<DefinitionBlock title="ADMM : éclatement de variables">
			<p>
				L'ADMM (alternating direction method of multipliers) résout des problèmes où l'objectif est <strong
					>séparable après éclatement</strong
				> de la variable :
			</p>
			<KatexBlock
				formula={String.raw`\min_{x,\, z}\; f(x) + g(z) \qquad \text{sous} \qquad Ax + Bz = c`}
			/>
			<p>
				(<KatexInline formula="f" />, <KatexInline formula="g" /> convexes —
				<strong>les deux peuvent être non lisses</strong>, contrairement à la descente proximale.)
				L'itération ADMM (forme échangée, <KatexInline formula={String.raw`u = y/\rho`} />) :
			</p>
			<KatexBlock formula={admmX} />
			<KatexBlock formula={admmZ} />
			<KatexBlock formula={admmU} />
			<p>
				<KatexInline formula={String.raw`\rho > 0`} /> est la pénalité de la lagrangienne augmentée ;
				<KatexInline formula={String.raw`u^{k}`} /> est la somme cumulée des résidus (Boyd et al. 2011 §3.1.1).
			</p>
			<p>
				<strong>Mécanique</strong> (Boyd et al. 2011 §3.1) : on forme la lagrangienne augmentée
				<KatexInline
					formula={String.raw`L_{\rho}(x, z, y) = f(x) + g(z) + y^{\top}(Ax + Bz - c) + \frac{\rho}{2}\lVert Ax + Bz - c\rVert^2`}
				/>
				et on fait un <strong>seul pas Gauss–Seidel</strong> sur
				<KatexInline formula={String.raw`(x, z)`} /> (<KatexInline formula="x" />, puis
				<KatexInline formula="z" />, puis le dual) au lieu de minimiser conjointement — c'est cette
				alternance qui permet le découplage (« ADMM can be viewed as a version of the method of
				multipliers where a single Gauss–Seidel pass over <em>x</em> and
				<em>z</em> is used instead of the usual joint minimization. »).
			</p>
		</DefinitionBlock>

		<TheoremBlock title="Convergence de l'ADMM">
			<p>Sous deux hypothèses :</p>
			<ol>
				<li>
					<KatexInline formula="f" /> et <KatexInline formula="g" /> convexes fermées propres (peuvent
					être non différentiables, valoir <KatexInline formula={String.raw`+\infty`} />) ;
				</li>
				<li>
					la lagrangienne non augmentée <KatexInline formula={String.raw`L_{0}`} /> possède un point selle
					(⟹ dualité forte),
				</li>
			</ol>
			<p>
				les itérations ADMM <strong>convergent</strong> (résultat « basic but still very general » ;
				preuve en annexe A de Boyd et al. 2011). Aucun rang minimum n'est exigé de
				<KatexInline formula="A" /> ou <KatexInline formula="B" />.
			</p>
			<p>
				La leçon n'enseigne <strong>pas</strong> de taux en valeur pour l'ADMM : les taux
				<KatexInline formula={String.raw`O(1/k)`} /> / <KatexInline
					formula={String.raw`O(1/k^2)`}
				/> de l'ADMM sont des résultats de la littérature plus récente, non vérifiés ici — ne pas les
				énoncer.
			</p>
		</TheoremBlock>

		<DefinitionBlock title="L'ADMM appliqué au Lasso">
			<p>
				Lasso <KatexInline
					formula={String.raw`\min \frac{1}{2}\lVert Ax - b\rVert^2 + \lambda\lVert x\rVert_1`}
				/>, écrit <KatexInline formula={String.raw`\min f(x) + g(z)`} /> sous
				<KatexInline formula={String.raw`x - z = 0`} /> avec
				<KatexInline formula={String.raw`f(x) = \frac{1}{2}\lVert Ax - b\rVert^2`} />,
				<KatexInline formula={String.raw`g(z) = \lambda\lVert z\rVert_1`} />. Les deux minimisations
				ont une forme close (Boyd et al. 2011 §6.4) :
			</p>
			<KatexBlock formula={lassoAdmmX} />
			<p class="algo-annot">← un Ridge (système symétrique défini positif)</p>
			<KatexBlock formula={lassoAdmmZ} />
			<p class="algo-annot">← soft-thresholding</p>
			<KatexBlock formula={lassoAdmmU} />
			<p class="algo-annot">← dual</p>
			<p>
				<KatexInline formula={String.raw`A^{\top}A + \rho I`} /> est
				<strong>toujours inversible</strong>
				(<KatexInline formula={String.raw`\rho > 0`} />) ; sa factorisation se calcule une fois pour
				toutes (« The x-update is essentially a ridge regression … ADMM can be interpreted as a
				method for solving the lasso problem by iteratively carrying out ridge regression. » — Boyd et al. 2011
				§6.4).
			</p>
			<p>
				<strong>Généralisation</strong> (Boyd et al. 2011 §6.3) : pour <em>n'importe quelle</em> perte convexe <KatexInline
					formula={String.raw`\ell`}
				/>,
				<KatexInline formula={String.raw`\min \ell(x) + \lambda\lVert x\rVert_1`} /> se résout par le
				même schéma — le x-update devient un proximal de
				<KatexInline formula={String.raw`\ell`} /> (Newton si
				<KatexInline formula={String.raw`\ell`} /> est lisse, système linéaire si
				<KatexInline formula={String.raw`\ell`} /> est quadratique). L'ADMM transforme un problème
				<KatexInline formula={String.raw`\ell + \lambda\lVert\cdot\rVert_1`} /> en une
				<strong>séquence de problèmes</strong>
				<KatexInline formula={String.raw`\ell`} /> <em>quadratiquement régularisés</em> — ce qui le rend
				indispensable pour le Lasso logistique, le Lasso poisson, etc. (hors périmètre de cette leçon).
			</p>
		</DefinitionBlock>

		<Callout type="summary" title="Le choix en pratique (Parikh & Boyd 2014 §4.4, Boyd et al. 2011 §6.4)">
			<table class="choice-table">
				<thead>
					<tr>
						<th></th>
						<th>Descente proximale (ISTA/FISTA)</th>
						<th>ADMM</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Découpage</td>
						<td>
							<KatexInline formula="f" /> lisse + <KatexInline formula="g" /> non lisse
						</td>
						<td>
							<KatexInline formula={String.raw`f(x)`} /> + <KatexInline
								formula={String.raw`g(z)`}
							/>,
							<strong>les deux non lisses possibles</strong>, sous contrainte linéaire
						</td>
					</tr>
					<tr>
						<td>Coût d'itération</td>
						<td>2 produits matrice-vecteur + seuillage</td>
						<td>Résolution d'un système (Ridge) + seuillage</td>
					</tr>
					<tr>
						<td>Taux prouvé (valeur)</td>
						<td>
							<KatexInline formula={String.raw`O(1/k)`} /> (ISTA),
							<KatexInline formula={String.raw`O(1/k^2)`} /> (FISTA)
						</td>
						<td>Convergence (Boyd et al. 2011 §3.2) ; pas de taux enseigné ici</td>
					</tr>
					<tr>
						<td>Itérés sparses</td>
						<td>
							<KatexInline formula={String.raw`x^{k}`} /> « presque sparses »
						</td>
						<td>
							<KatexInline formula={String.raw`z^{k}`} /> <strong>exactement sparses</strong> (Parikh & Boyd 2014 §4.4)
						</td>
					</tr>
					<tr>
						<td>Répartition</td>
						<td>Naturellement parallèle (produits)</td>
						<td>Découpable sur les exemples/features (Boyd et al. 2011 ch. 7–8, hors périmètre)</td>
					</tr>
				</tbody>
			</table>
			<p>
				En pratique, pour un Lasso de taille moyenne : <strong>FISTA</strong> si on veut la
				convergence en valeur la plus rapide ; <strong>ADMM</strong> (ou la descente par coordonnées enseignée)
				si on veut des itérés exactement sparses à chaque pas ou un découpage distribué.
			</p>
		</Callout>

		<!-- ========================================================= -->
		<!-- 6. TOUT-EN-UN : SOUS-GRADIENT / FENCHEL / DOUGLAS-RACHFORD -->
		<!-- ========================================================= -->
		<h2 id="liaison-sous-gradient-fenchel">
			Le tout-en-un : sous-gradient, Fenchel, Douglas–Rachford
		</h2>

		<Callout
			type="insight"
			title="Trois identités, un même objet (Parikh & Boyd 2014 ch. 3, « Interpretations »)"
		>
			<p>
				L'opérateur proximal apparaît simultanément dans trois cadres — c'est ce qui le rend central
				:
			</p>
			<ol>
				<li>
					<strong>Sous-différentiel</strong> (Parikh & Boyd 2014 §3.2, eq. (3.4)) :
					<KatexInline formula={resolvent} />. Le proximal est la <em>résolvante</em> du
					sous-différentiel ; itérer
					<KatexInline formula={String.raw`(I + \lambda\partial g)^{-1}(I - \lambda\nabla f)`} />
					(descente proximale) cherche le point fixe équivalent à
					<KatexInline formula={String.raw`0 \in \nabla f(x^{*}) + \partial g(x^{*})`} />.
				</li>
				<li>
					<strong>Fenchel / dualité</strong> (Parikh & Boyd 2014 §2.5, eq. (2.4)) :
					<KatexInline formula={moreau} /> (Moreau) — le proximal de
					<KatexInline formula="f" /> et celui de sa conjugée se complètent comme deux projections orthogonales.
					En particulier, le soft-thresholding se calcule par troncature (projection sur la boule duale,
					Parikh & Boyd 2014 §6.5.2).
				</li>
				<li>
					<strong>Régularisation de Moreau–Yosida</strong> (Parikh & Boyd 2014 §3.1) : l'enveloppe
					<KatexInline formula={moreauYosida} /> est convexe et
					<strong>différentiable</strong> même si <KatexInline formula="f" /> ne l'est pas — le proximal
					« lisse » les fonctions.
				</li>
			</ol>
			<p>
				Ces angles sont le fil rouge du panneau expert « Conditions KKT et dualité lagrangienne » de
				la Partie I, leçon 1 ; cette leçon se contente d'énoncer les identités, sans les preuves
				générales.
			</p>
		</Callout>

		<Callout type="note" title="Nom alternatif : Douglas–Rachford splitting (Parikh & Boyd 2014 §4.4)">
			<p>
				Pour <KatexInline formula={String.raw`\min f(x) + g(x)`} /> <strong>sans</strong> contrainte
				(<KatexInline formula={String.raw`A = I`} />, <KatexInline formula={String.raw`B = -I`} />,
				<KatexInline formula={String.raw`c = 0`} />), l'ADMM (section 5) se réécrit, avec la
				convention Parikh &amp; Boyd :
			</p>
			<KatexBlock formula={douglas1} />
			<KatexBlock formula={douglas2} />
			<KatexBlock formula={douglas3} />
			<p>
				Parikh & Boyd 2014 l'appelle aussi <strong>Douglas–Rachford splitting</strong> et signale : « This method
				converges under more or less the most general possible conditions; see [Boyd et al. 2011, §3.2] for
				details. » C'est la méthode de splitting la plus générale pour la somme de deux convexes —
				la descente proximale (section 3) en est le cas particulier où <KatexInline formula="f" /> est
				lisse (on peut alors évaluer
				<KatexInline formula={String.raw`\nabla f`} /> au lieu de son proximal). La convergence générale
				(faible, et forte sous conditions) est celle du Théorème 3.4 de Combettes &amp; Wajs 2005 : pas
				proximal
				<KatexInline formula={String.raw`\gamma \in \, ]0, 2/L[`} />, relaxation
				<KatexInline formula={String.raw`\lambda \in \, ]0, 1]`} />.
			</p>
		</Callout>

		<h3>Ce que ça veut dire pour le Lasso du cours</h3>
		<p>
			Pour le Lasso de la Partie V (leçon 4), on sait maintenant <strong>trois</strong> façons de le calculer
			:
		</p>
		<ul>
			<li>
				<strong>LARS</strong> (Algorithme 5.1 — enseigné) : calcule tout le <em>lasso path</em> en un
				coup (Définition 5.3), exploitant la structure linéaire par morceaux.
			</li>
			<li>
				<strong>Descente par coordonnées</strong> (Algorithme 3.13 — enseignée, implémentée dans le
				cours) : un sweep = <KatexInline formula="d" />
				résolutions 1D par seuillage doux.
			</li>
			<li>
				<strong>FISTA / ADMM</strong> (cette leçon) : scalables en parallèle, taux connu (FISTA), itérés
				sparses (ADMM).
			</li>
		</ul>
		<p>
			Les méthodes produisent le même
			<KatexInline formula={String.raw`\hat\theta_{\mathrm{Lasso}}(\lambda)`} /> (l'unicité du minimiseur
			tient à la convexité stricte de
			<KatexInline formula={String.raw`\frac{1}{2}\lVert y - X\theta\rVert^2`} /> lorsque
			<KatexInline formula="X" /> est de rang colonne plein, plus la convexité de
			<KatexInline formula={String.raw`\lambda\lVert\theta\rVert_1`} />). Le choix est un compromis
			<em>algorithme</em> (coût, parallélisme, précision), pas un compromis
			<em>statistique</em> — les estimateurs sont identiques.
		</p>

		<!-- ========================================================= -->
		<!-- 7. EXEMPLE GUIDÉ : FISTA LOGISTIQUE                       -->
		<!-- ========================================================= -->
		<h2 id="exemple-logistique">Exemple guidé : FISTA sur un Lasso logistique</h2>

		<ExampleBlock title="FISTA, sans système à résoudre">
			<p>Lasso logistique (réponse binaire) :</p>
			<KatexBlock
				formula={String.raw`\min_{\theta}\; \ell(\theta) + \lambda\lVert\theta\rVert_1`}
			/>
			<KatexBlock formula={logLoss} />
			<p>
				où <KatexInline formula={String.raw`y_i \in \{-1, +1\}`} />.
				<KatexInline formula={String.raw`\ell`} /> est convexe et
				<KatexInline formula={String.raw`C^{1,1}`} />. Borne de Lipschitz
				<strong>vérifiée par calcul direct</strong> (Hessien) :
				<KatexInline formula={String.raw`\nabla^2 \ell(\theta) = X^{\top} D(\theta) X`} /> où
				<KatexInline formula={String.raw`D(\theta)`} /> est diagonale avec
				<KatexInline formula={String.raw`D_{ii} = \sigma(s_i)(1 - \sigma(s_i))`} />
				(<KatexInline formula={String.raw`s_i = y_i x_i^{\top}\theta`} />,
				<KatexInline formula={String.raw`\sigma`} /> la sigmoïde) — chaque diagonale vaut au plus <KatexInline
					formula={String.raw`\frac{1}{4}`}
				/> (maximum de
				<KatexInline formula={String.raw`p(1-p)`} />), donc
				<KatexInline formula={String.raw`\nabla^2 \ell \preceq \frac{1}{4} X^{\top}X`} /> et
			</p>
			<KatexBlock formula={logLipschitz} />
			<p>borne valide (calcul fait ici, aucune source nécessaire). FISTA (Beck & Teboulle 2009 (4.1)–(4.3)) :</p>
			<pre class="pseudo">{`Entrée : X (n×d), y (n), λ, L = (1/4)·λ_max(XᵀX)
θ⁰ = 0 ;  y¹ = 0 ;  t₁ = 1
Pour k = 1, 2, 3, … :
    s_i = y_i x_iᵀ yᵏ
    g   = −Xᵀ ( y ⊙ ( e^{−s} / (1 + e^{−s}) ) )        # ∇ℓ en yᵏ
    θᵏ  = S_{λ/L}( yᵏ − (1/L)·g )                       # (4.1) : prox_{(1/L)·λ‖·‖₁}
    t_{k+1} = (1 + √(1 + 4 t_k²)) / 2                    # (4.2)
    y^{k+1} = θᵏ + ((t_k − 1)/t_{k+1})(θᵏ − θ^{k−1})    # (4.3)
Arrêt : ‖θᵏ − θ^{k−1}‖ < tol  ou  k = K_max`}</pre>
			<p>
				Chaque itération : un produit <KatexInline formula={String.raw`X^{\top}(\cdot)`} />
				(<KatexInline formula={String.raw`n \times d`} />), un seuillage (<KatexInline
					formula="d"
				/>) — <strong>pas de système à résoudre</strong>. C'est la différence structurelle avec
				l'ADMM sur le même problème (Boyd et al. 2011 §6.3 : x-update = Newton sur la logistique régularisée).
				La deuxième démo de cette page implémente la version <strong>moindres carrés</strong> du même
				pseudo-code (<KatexInline
					formula={String.raw`\ell(\theta) = \frac{1}{2}\lVert y - X\theta\rVert^2`}
				/>), où <KatexInline formula={String.raw`L = \lambda_{\max}(X^{\top}X)`} /> est calculée exactement.
			</p>
		</ExampleBlock>

		<!-- ========================================================= -->
		<!-- 8. SYNTHÈSE                                               -->
		<!-- ========================================================= -->
		<h2 id="synthese">Synthèse</h2>

		<Callout type="summary" title="La boîte à outils proximale">
			<ol>
				<li>
					<strong>L'opérateur proximal</strong>
					<KatexInline formula={proxLambda} /> est l'outil : unique, généralise la projection, et se calcule
					par soft-thresholding pour
					<KatexInline formula={String.raw`\lVert\cdot\rVert_1`} /> (Parikh & Boyd 2014 eq. (1.2), (6.9)).
				</li>
				<li>
					<strong>ISTA</strong> (Parikh & Boyd 2014 eq. (4.6), Beck & Teboulle 2009 Thm 3.1) : gradient + proximal,
					<KatexInline formula={String.raw`O(1/k)`} /> en valeur — le « gradient » des problèmes composites.
				</li>
				<li>
					<strong>FISTA</strong> (Beck & Teboulle 2009 (4.1)–(4.3), Thm 4.4) : + momentum
					<KatexInline formula={String.raw`t_{k}`} />, <KatexInline
						formula={String.raw`O(1/k^2)`}
					/> — optimal au pire cas ; coût d'itération identique.
				</li>
				<li>
					<strong>ADMM</strong> (Boyd et al. 2011 eq. (3.5)–(3.7)) : éclatement + multiplicateur ; Lasso = «
					Ridge itérée + seuillage » ; itérés
					<KatexInline formula={String.raw`z^{k}`} /> exactement sparses.
				</li>
				<li>
					<strong>Le lien profond</strong> : <KatexInline
						formula={String.raw`\operatorname{prox} = (I + \lambda\partial f)^{-1}`}
					/>
					(Parikh & Boyd 2014 (3.4)), Moreau <KatexInline formula={moreau} /> (Parikh & Boyd 2014 (2.4)), Douglas–Rachford = ADMM
					sans contrainte (Parikh & Boyd 2014 §4.4) — sous-gradient et Fenchel se rejoignent dans un seul objet.
				</li>
			</ol>
		</Callout>

		<ExercisePanel number="1" title="Proximaux élémentaires">
			<p>
				Soit <KatexInline formula={String.raw`v = (3, -0.5, 2)^{\top}`} />,
				<KatexInline formula={String.raw`\lambda = 1`} />.
			</p>
			<ol>
				<li>
					Calculer <KatexInline
						formula={String.raw`\operatorname{prox}_{\lVert\cdot\rVert_1}(v)`}
					/>
					(soft-thresholding, Parikh & Boyd 2014 (6.9)).
				</li>
				<li>
					Calculer
					<KatexInline
						formula={String.raw`\operatorname{prox}_{\frac{1}{2}\lVert\cdot\rVert_2^2}(v)`}
					/>
					(section 2, <KatexInline formula={String.raw`\rho = 1`} />).
				</li>
				<li>
					Vérifier la décomposition de Moreau (Parikh & Boyd 2014 (2.4)) : montrer que
					<KatexInline
						formula={String.raw`v = \operatorname{prox}_{\lVert\cdot\rVert_1}(v) + \Pi_{\lVert\cdot\rVert_{\infty} \le 1}(v)`}
					/> en identifiant <KatexInline
						formula={String.raw`\operatorname{prox}_{\lVert\cdot\rVert_1^{*}}(v) = \Pi_{B}(v)`}
					/>.
				</li>
			</ol>
			{#snippet solution()}
				<p>
					(a) <KatexInline formula={String.raw`S(3,1) = 2`} />,
					<KatexInline formula={String.raw`S(-0.5, 1) = 0`} /> (car
					<KatexInline formula={String.raw`|-0.5| \le 1`} />),
					<KatexInline formula={String.raw`S(2,1) = 1`} /> →
					<KatexInline formula={String.raw`(2, 0, 1)^{\top}`} />. (b)
					<KatexInline formula={String.raw`\frac{1}{1+1} v = (1.5, -0.25, 1)^{\top}`} />. (c)
					<KatexInline formula={String.raw`\Pi_{B}(v) = (1, -0.5, 1)^{\top}`} /> (troncature en
					<KatexInline formula={String.raw`[-1, 1]`} />) ;
					<KatexInline
						formula={String.raw`(2,0,1)^{\top} + (1,-0.5,1)^{\top} = (3, -0.5, 2)^{\top} = v`}
					/> ✓.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2" title="Combien d'itérations ?">
			<p>
				Un Lasso <KatexInline
					formula={String.raw`\min \frac{1}{2}\lVert y - X\theta\rVert^2 + \lambda\lVert\theta\rVert_1`}
				/>
				avec <KatexInline formula={String.raw`\lVert X^{\top}X \rVert = 100`} />,
				<KatexInline formula={String.raw`\lVert \theta^{0} - \theta^{*}\rVert = 10`} />,
				<KatexInline formula={String.raw`\theta^{0} = 0`} />. On veut
				<KatexInline formula={String.raw`F(\theta^{k}) - F^{*} \le 10^{-4}`} />.
			</p>
			<ol>
				<li>Borne supérieure du nombre d'itérations ISTA (Beck & Teboulle 2009 Thm 3.1).</li>
				<li>Borne supérieure pour FISTA (Beck & Teboulle 2009 Thm 4.4).</li>
				<li>Pourquoi ces bornes sont des majorations au pire cas, pas des prédictions ?</li>
			</ol>
			{#snippet solution()}
				<p>
					<KatexInline
						formula={String.raw`C = L\lVert\theta^{0} - \theta^{*}\rVert^2 = 100 \cdot 100 = 10^{4}`}
					/>.
				</p>
				<p>
					(a) ISTA : <KatexInline
						formula={String.raw`\frac{L\lVert\cdot\rVert^2}{2k} \le \varepsilon`}
					/> ⟹
					<KatexInline
						formula={String.raw`k \ge \frac{C}{2\varepsilon} = \frac{10^4}{2 \cdot 10^{-4}} = 5 \cdot 10^{7}`}
					/>
					itérations.
				</p>
				<p>
					(b) FISTA : <KatexInline formula={String.raw`\frac{2C}{(k+1)^2} \le \varepsilon`} /> ⟹
					<KatexInline formula={String.raw`(k+1)^2 \ge 2 \cdot 10^{8}`} /> ⟹
					<KatexInline
						formula={String.raw`k + 1 \ge \sqrt{2} \cdot 10^{4} \approx 1.41 \cdot 10^{4}`}
					/> ⟹
					<KatexInline formula={String.raw`k \ge 14\,142`} />.
				</p>
				<p>
					(c) Les deux taux sont des <strong>bornes au pire cas</strong>
					(Nemirovsky–Yudin) : valables pour tout problème
					<KatexInline formula={String.raw`L`} />-lisse + convexe, serrées pour une famille
					adversaire de problèmes, mais le comportement réel sur un problème donné dépend du
					conditionnement et de la géométrie (les taux asymptotiques exacts dépendent de propriétés
					supplémentaires — hors périmètre). L'écart
					<KatexInline formula={String.raw`5 \cdot 10^{7}`} /> contre
					<KatexInline formula={String.raw`1.4 \cdot 10^{4}`} /> itérations est précisément le « carré
					» du Théorème 4.4 :
					<KatexInline formula={String.raw`O(\sqrt{C/\varepsilon})`} /> au lieu de
					<KatexInline formula={String.raw`O(C/\varepsilon)`} />.
				</p>
			{/snippet}
		</ExercisePanel>

		<InteractiveSection
			number="E.3"
			title="Quiz — prox, FISTA et ADMM"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- BIBLIOGRAPHY                                               -->
	<!-- ========================================================= -->

	<Bibliography>
		<BibElement
			authors={['Parikh, N.', 'Boyd, S.']}
			year={2014}
			title="Proximal Algorithms"
			journal="Foundations and Trends in Optimization, 1(3):123–231."
			link="https://web.stanford.edu/~boyd/papers/prox_algs.html"
		/>

		<BibElement
			authors={['Beck, A.', 'Teboulle, M.']}
			year={2009}
			title="A Fast Iterative Shrinkage-Thresholding Algorithm for Linear Inverse Problems"
			journal="SIAM Journal on Imaging Sciences, 2(1):183–202."
			link="https://www.tau.ac.il/~becka/FISTA.pdf"
		/>

		<BibElement
			authors={['Boyd, S.', 'Parikh, N.', 'Chu, E.', 'Peleato, B.', 'Eckstein, J.']}
			year={2011}
			title="Distributed Optimization and Statistical Learning via the Alternating Direction Method of Multipliers"
			journal="Foundations and Trends in Machine Learning, 3(1):1–122."
			link="https://web.stanford.edu/~boyd/papers/admm_distr_stats.html"
		/>

		<BibElement
			authors={['Combettes, P. L.', 'Wajs, V. R.']}
			year={2005}
			title="Signal Recovery by Proximal Forward-Backward Splitting"
			journal="Multiscale Modeling and Simulation, 4(4):1164–1200."
			link="https://pcombet.math.ncsu.edu/mms1.pdf"
		/>

		<BibElement
			authors={['Nesterov, Y. E.']}
			year={1983}
			title="A method for solving the convex programming problem with convergence rate O(1/k²)"
			journal="Dokl. Akad. Nauk SSSR, 269:543–547 (en russe) — cité par Beck & Teboulle 2009, ref. 27."
		/>
	</Bibliography>
</PageTemplate>

<style>
	.algo {
		margin: 0.75rem 0;
	}
	.algo-line {
		margin: 0.15rem 0;
	}
	.algo-annot {
		margin: -0.35rem 0 0.6rem 1.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	pre.pseudo {
		background: var(--color-surface-2, rgba(127, 127, 127, 0.08));
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.9rem 1.1rem;
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		line-height: 1.55;
		overflow-x: auto;
	}

	.choice-table {
		width: 100%;
		border-collapse: collapse;
		margin: 0.5rem 0 0.75rem;
		font-size: 0.85rem;
	}
	.choice-table th,
	.choice-table td {
		padding: 0.55rem 0.65rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}
	.choice-table th {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.choice-table td:first-child {
		font-weight: 600;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	@media (max-width: 700px) {
		.choice-table {
			font-size: 0.75rem;
		}
		.choice-table td:first-child {
			white-space: normal;
		}
	}
</style>
