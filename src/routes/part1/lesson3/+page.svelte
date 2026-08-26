<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';

	// Demo components
	import GradientDescentAnimator from '$lib/components/demos/GradientDescentAnimator.svelte';
	import LearningRateComparison from '$lib/components/demos/LearningRateComparison.svelte';
	import MomentumVisualizer from '$lib/components/demos/MomentumVisualizer.svelte';
	import NesterovExplorer from '$lib/components/demos/NesterovExplorer.svelte';
	import TaylorStepVisualizer from '$lib/components/demos/TaylorStepVisualizer.svelte';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part1/lesson3');
	const tracker = createPageTracker(meta as PageMeta);
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	// ── Table of Contents ────────────────────────────────

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
			description: 'Les algorithmes les plus utilisés en optimisation',
			color: 'epistemic'
		},
		{
			id: 'descente-gradient-classique',
			label: 'Descente de gradient classique',
			description: 'Principe général, mise à jour itérative',
			color: 'neutral'
		},
		{
			id: 'intuition-geometrique',
			label: 'Intuition géométrique',
			description: 'Direction de plus forte descente par Cauchy-Schwarz',
			color: 'belief'
		},
		{
			id: 'justification-taylor',
			label: 'Justification par développement limité',
			description: "Décroissance locale par Taylor à l'ordre 1",
			color: 'positive'
		},
		{
			id: 'choix-pas-apprentissage',
			label: "Choix du pas d'apprentissage",
			description: 'Pas constant, recherche linéaire, pas décroissant',
			color: 'neutral'
		},
		{
			id: 'convergence-fonctions-convexes',
			label: 'Convergence pour les fonctions convexes',
			description: 'Taux O(1/k), forte convexité, taux linéaire',
			color: 'belief'
		},
		{
			id: 'momentum-acceleres',
			label: 'Momentum et méthodes accélérées',
			description: 'Polyak, moyenne exponentielle mobile',
			color: 'surprise'
		},
		{
			id: 'methode-nesterov',
			label: 'Méthode de Nesterov',
			description: 'NAG — gradient anticipé, taux O(1/k²)',
			color: 'agent'
		},
		{
			id: 'synthese-lecon',
			label: 'Synthèse de la leçon',
			description: 'Récapitulatif des algorithmes et hyperparamètres',
			color: 'epistemic'
		}
	];

	// ── Formulas ────────────────────────────────────────

	// GD algorithm
	const gdUpdate = 'x^{(k+1)} = x^{(k)} - \\alpha_k \\nabla f(x^{(k)})';
	const gdAlpha = '\\alpha_k > 0';
	const kIter = 'k';

	// Direction of steepest descent
	const stepestDir =
		'd^* = \\arg\\min_{\\|d\\|=1} \\nabla f(x)^{\\top} d = -\\frac{\\nabla f(x)}{\\|\\nabla f(x)\\|}';
	const directionalDeriv =
		'\\nabla f(x)^{\\top} d = \\|\\nabla f(x)\\| \\cdot \\|d\\| \\cdot \\cos(\\theta) = \\|\\nabla f(x)\\| \\cos(\\theta)';

	// Taylor decay
	const taylorDecay = 'f(x - \\alpha \\nabla f(x)) < f(x)';
	const taylorExp1 = String.raw`\begin{aligned}f(x - \alpha \nabla f(x)) &= f(x) + \nabla f(x)^{\top} (-\alpha \nabla f(x)) + o(\alpha \|\nabla f(x)\|) \\&= f(x) - \alpha \|\nabla f(x)\|^2 + o(\alpha)\end{aligned}`;
	const taylorDominant = '-\\alpha \\|\\nabla f(x)\\|^2';

	// Step sizes
	const constantStep = '\\alpha_k = \\alpha';
	const lineSearch = '\\alpha_k = \\arg\\min_{\\alpha > 0} f(x^{(k)} - \\alpha \\nabla f(x^{(k)}))';
	const decrStep1 = '\\alpha_k = \\alpha_0 / k';
	const decrStep2 = '\\alpha_k = \\alpha_0 / \\sqrt{k}';

	// Convergence theorem
	const convTheorem = 'f(x^{(k)}) - f(x^*) \\leq \\frac{L\\|x^{(0)} - x^*\\|^2}{2k}';
	const rateO1k = '\\mathcal{O}(1/k)';

	// Strong convexity rate
	const strongConvRate = '\\mathcal{O}(e^{-\\mu k / L})';

	// Linear regression GD
	const lrGradUpdate = String.raw`\begin{aligned}
	w^{(k+1)} &= w^{(k)} - \alpha \nabla f(w^{(k)}) \\
	&= w^{(k)} - \frac{\alpha}{n} X^{\top}(X w^{(k)} - y) \\
	&= w^{(k)} - \frac{\alpha}{n} \sum_{i=1}^n (w^{(k)\top} x_i - y_i) x_i
	\end{aligned}`;

	const lrCost = '\\mathcal{O}(n d)';

	// Momentum
	const momVel = String.raw`\begin{aligned}
	v^{(k+1)} &= \beta v^{(k)} + \nabla f(x^{(k)}) \\
	x^{(k+1)} &= x^{(k)} - \alpha v^{(k+1)}
	\end{aligned}`;

	const momBeta = '\\beta \\in [0, 1)';
	const momTypical = '\\beta = 0.9';
	const momUnrolled = 'v^{(k)} = \\sum_{i=0}^{k-1} \\beta^i \\nabla f(x^{(k-1-i)})';

	// Nesterov
	const nagLookahead = String.raw`\begin{aligned}\tilde{x}^{(k)} &= x^{(k)} + \beta (x^{(k)} - x^{(k-1)}) \\x^{(k+1)} &= \tilde{x}^{(k)} - \alpha \nabla f(\tilde{x}^{(k)})\end{aligned}`;
	const nagRate = '\\mathcal{O}(1/k^2)';

	// Gradient
	const nablaGrad = '\\nabla f(x)';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Descente de gradient & accélération'}
	subtitle="Algorithmes de premier ordre : de la descente de gradient classique à l'accélération de Nesterov"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ════════════════════════════════════════════════ -->
	<!-- INTRODUCTION                                     -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			Les algorithmes de descente de gradient sont les méthodes les plus utilisées en optimisation,
			notamment en machine learning. L'idée fondamentale est d'itérer dans la direction opposée au
			gradient pour diminuer la valeur de la fonction objectif.
		</p>

		<Callout type="intuition" title="L'intuition clé">
			Si le gradient <KatexInline formula={nablaGrad} /> pointe vers la direction de plus forte croissance,
			alors −∇f(x) pointe vers la direction de plus forte descente. En suivant cette direction pas à pas,
			on descend progressivement vers un minimum.
		</Callout>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- DESCENTE DE GRADIENT CLASSIQUE                    -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="descente-gradient-classique">Descente de gradient classique</h2>

		<h3>Principe général</h3>

		<p>
			Pour minimiser une fonction différentiable, on construit une suite d'itérés en suivant le
			gradient négatif :
		</p>

		<DefinitionBlock number="3.1" title="Algorithme de descente de gradient">
			Soit une fonction <KatexInline formula={'f : \\mathbb{R}^d \\to \\mathbb{R}'} /> différentiable.
			À partir d'un point initial <KatexInline formula={'x^{(0)}'} />, on itère :
			<KatexBlock formula={gdUpdate} />
			où <KatexInline formula={gdAlpha} /> est le
			<strong>pas d'apprentissage</strong> (learning rate) à l'itération <KatexInline
				formula={kIter}
			/>.
		</DefinitionBlock>

		<Callout type="intuition" title="Learning Rate Scheduler">
			Le pas d'apprentissage peut être constant ou évoluer selon une politique particulière. On
			parle de <em>learning rate scheduler</em>. Les stratégies courantes incluent le decay
			exponentiel, le step decay, et le warm-up suivi de decay.
		</Callout>

		<InteractiveSection
			number="3.1"
			title="Animation de la descente de gradient"
			onInteract={tracker.trackInteraction}
		>
			<GradientDescentAnimator />
		</InteractiveSection>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- INTUITION GÉOMÉTRIQUE                             -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="intuition-geometrique">Intuition géométrique</h2>

		<p>
			Pourquoi se déplacer dans la direction −∇f(x) est-il une bonne idée ? La réponse vient de
			l'analyse des dérivées directionnelles.
		</p>

		<TheoremBlock number="3.2" title="Direction de plus forte descente">
			Le gradient négatif −∇f(x) est la direction de <strong>plus forte descente</strong> de f en x,
			c'est-à-dire parmi toutes les directions unitaires d avec ‖d‖ = 1, celle qui minimise la
			dérivée directionnelle :
			<KatexBlock formula={stepestDir} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			Pour minimiser la dérivée directionnelle ∇f(x)ᵀd sous la contrainte ‖d‖ = 1 :
			<KatexBlock formula={directionalDeriv} />
			où θ est l'angle entre ∇f(x) et d. Le minimum est atteint pour cos(θ) = −1, c'est-à-dire θ = π,
			soit :
			<KatexBlock formula={'d^* = -\\frac{\\nabla f(x)}{\\|\\nabla f(x)\\|}'} />
		</div>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- JUSTIFICATION TAYLOR                              -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="justification-taylor">Justification par développement limité</h2>

		<TheoremBlock number="3.3" title="Décroissance locale">
			Si f est C¹ et ∇f(x) ≠ 0, alors pour α suffisamment petit :
			<KatexBlock formula={taylorDecay} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			Par développement de Taylor à l'ordre 1 :
			<KatexBlock formula={taylorExp1} />
			Pour α assez petit, le terme <KatexInline formula={taylorDominant} /> domine, donc la décroissance
			est garantie.
		</div>

		<Callout type="warning" title="Remarque cruciale">
			Cette décroissance n'est garantie que <strong>localement</strong>, pour un pas α suffisamment
			petit. Ce n'est pas non plus une preuve de convergence globale — elle montre seulement qu'un
			pas suffit à diminuer localement la fonction.
		</Callout>

		<InteractiveSection
			number="3.2"
			title="Visualisation du pas de Taylor"
			onInteract={tracker.trackInteraction}
		>
			<TaylorStepVisualizer />
		</InteractiveSection>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- CHOIX DU PAS D'APPRENTISSAGE                      -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="choix-pas-apprentissage">Choix du pas d'apprentissage</h2>

		<p>Le choix du pas α est critique pour la convergence. Trois stratégies principales :</p>

		<h3>Cas 1 : Pas constant</h3>

		<KatexBlock formula={constantStep} />

		<ul>
			<li>Simple à implémenter</li>
			<li>
				Nécessite un réglage délicat : trop grand → divergence, trop petit → convergence lente
			</li>
		</ul>

		<h3>Cas 2 : Recherche linéaire (line search)</h3>

		<p>À chaque itération, on choisit α qui minimise :</p>
		<KatexBlock formula={lineSearch} />

		<ul>
			<li>Garantit une décroissance maximale à chaque itération</li>
			<li>Coûteux en calcul — nécessite des évaluations supplémentaires de f</li>
		</ul>

		<h3>Cas 3 : Pas décroissant</h3>

		<p>Par exemple <KatexInline formula={decrStep1} /> ou <KatexInline formula={decrStep2} /></p>

		<ul>
			<li>Garantit la convergence sous certaines conditions (théorèmes de Robbins-Monro)</li>
			<li>Utilisé en pratique avec des variantes adaptatives (Adam, RMSprop)</li>
		</ul>

		<InteractiveSection
			number="3.3"
			title="Comparaison des pas d'apprentissage"
			onInteract={tracker.trackInteraction}
		>
			<LearningRateComparison />
		</InteractiveSection>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- CONVERGENCE CONVEXE                               -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="convergence-fonctions-convexes">Convergence pour les fonctions convexes</h2>

		<TheoremBlock number="3.4" title="Convergence — cas convexe">
			Supposons que f est convexe, L-lisse (gradient L-Lipschitz) et admet un minimum x*. Si on
			choisit αₖ = 1/L (pas constant), alors :
			<KatexBlock formula={convTheorem} />
			Convergence en <KatexInline formula={rateO1k} />.
		</TheoremBlock>

		<Callout type="intuition" title="Forte convexité">
			Pour les fonctions <strong>fortement convexes</strong>, on obtient une convergence
			<strong>exponentielle</strong> en <KatexInline formula={strongConvRate} />, où μ est le
			paramètre de forte convexité et L la constante de Lipschitz du gradient. Le rapport L/μ est le
			<noscript><em>condition number</em></noscript> de la Hessienne.
		</Callout>

		<ExampleBlock number="3.5" title="Descente de gradient pour les moindres carrés">
			Pour <KatexInline formula={String.raw`f(w) = \frac{1}{2n} \|y - Xw\|^2`} />, l'algorithme
			devient :
			<KatexBlock formula={lrGradUpdate} />

			<strong>Coût par itération :</strong>
			<KatexInline formula={lrCost} /> où n = nombre d'exemples, d = dimension.
		</ExampleBlock>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- MOMENTUM ET MÉTHODES ACCÉLÉRÉES                   -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="momentum-acceleres">Momentum et méthodes accélérées</h2>

		<p>
			Lorsque la fonction présente des vallées étroites ou un conditionnement défavorable, le GD
			classique oscille beaucoup. L'idée du momentum est d'accumuler une vitesse pour amortir ces
			oscillations.
		</p>

		<h3>Gradient avec momentum</h3>

		<DefinitionBlock number="3.6" title="Gradient avec momentum (Polyak)">
			On maintient une <strong>vitesse</strong> v⁽ᵏ⁾ qui accumule les gradients passés :
			<KatexBlock formula={momVel} />
			où <KatexInline formula={momBeta} /> est le <strong>coefficient de momentum</strong>
			(typiquement <KatexInline formula={momTypical} />).
		</DefinitionBlock>

		<Callout type="intuition" title="Pourquoi ça marche ?">
			Le momentum permet d'<strong>accélérer</strong> dans les directions où le gradient est
			cohérent d'itération en itération, et d'<strong>amortir</strong> les oscillations quand le gradient
			change de signe. On peut le voir comme une moyenne exponentielle pondérée des gradients récents
			:
		</Callout>

		<TheoremBlock number="3.7" title="Développement de la vitesse">
			En déroulant la récurrence :
			<KatexBlock formula={momUnrolled} />
			Le momentum donne plus de poids aux gradients récents (décroissance exponentielle en βⁱ).
		</TheoremBlock>

		<InteractiveSection
			number="3.4"
			title="Effet du momentum"
			onInteract={tracker.trackInteraction}
		>
			<MomentumVisualizer />
		</InteractiveSection>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- MÉTHODE DE NESTEROV                               -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="methode-nesterov">Méthode de Nesterov</h2>

		<p>
			Nesterov (1983) a montré qu'une petite modification du momentum permet d'atteindre le taux de
			convergence optimal.
		</p>

		<DefinitionBlock number="3.8" title="Nesterov Accelerated Gradient (NG)">
			Variante « anticipative » du momentum : au lieu d'évaluer le gradient en x⁽ᵏ⁾, on l'évalue en
			un point anticipé x̃⁽ᵏ⁾ :
			<KatexBlock formula={nagLookahead} />
			On évalue le gradient au point « anticipé » <KatexInline formula={'\\tilde{x}^{(k)}'} />.
		</DefinitionBlock>

		<Callout type="intuition" title="Avantage théorique">
			Convergence en <KatexInline formula={nagRate} /> pour les fonctions convexes, contre
			<KatexInline formula={rateO1k} /> sans accélération. C'est un gain quadratique dans le taux de convergence
			!
		</Callout>

		<InteractiveSection
			number="3.5"
			title="Comparaison Nesterov vs Classique"
			onInteract={tracker.trackInteraction}
		>
			<NesterovExplorer />
		</InteractiveSection>

		<div class="synthesis-table">
			<h3>Synthèse : GD, Momentum et Nesterov</h3>
			<table>
				<thead>
					<tr>
						<th>Méthode</th>
						<th>Taux de convergence</th>
						<th>Idée clé</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>GD classique</strong></td>
						<td><KatexInline formula={rateO1k} /></td>
						<td>Suivre −∇f(x)</td>
					</tr>
					<tr>
						<td><strong>Momentum (Polyak)</strong></td>
						<td><KatexInline formula={rateO1k} /> en théorie</td>
						<td>Moyenne exp. des gradients passés</td>
					</tr>
					<tr>
						<td><strong>Nesterov (NG)</strong></td>
						<td><KatexInline formula={nagRate} /></td>
						<td>Évaluation anticipée du gradient</td>
					</tr>
				</tbody>
			</table>
		</div>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- SYNTHÈSE FINALE                                   -->
	<!-- ════════════════════════════════════════════════ -->

	<TheorySection>
		<h2 id="synthese-lecon">Synthèse de la leçon</h2>

		<p>Cette leçon couvre les fondements des algorithmes itératifs d'optimisation :</p>

		<ul>
			<li>
				<strong>Descente de gradient :</strong> −∇f(x) est la direction de plus forte descente. Un pas
				α suffisamment petit garantit une décroissance locale par l'argument de Taylor.
			</li>
			<li>
				<strong>Choix du pas :</strong> Pas constant (simple mais délicat), line search (optimal mais
				coûteux), decay (convergent sous conditions).
			</li>
			<li>
				<strong>Taux de convergence :</strong> En O(1/k) pour les fonctions convexes L-lisses avec GD
				et α = 1/L. Exponentiel pour les fonctions fortement convexes.
			</li>
			<li>
				<strong>Momentum :</strong> Améliore le comportement pratique en amortissant les oscillations,
				via une moyenne exponentielle des gradients passés.
			</li>
			<li>
				<strong>Nesterov :</strong> Atteint le taux optimal O(1/k²) grâce à l'évaluation du gradient au
				point anticipé.
			</li>
		</ul>

		<Callout type="summary" title="Retenir">
			Le gradient négatif donne la direction de plus forte descente locale. Le choix du pas α et
			l'utilisation de momentum/Nesterov sont les leviers pratiques pour accélérer la convergence.
			Une leçon experte optionnelle sur l'optimiseur Adam suit cette leçon ; la leçon 4 de la partie
			aborde ensuite le SGD, la coordinate descent et la méthode de Newton-Raphson.
		</Callout>
	</TheorySection>

	<!-- ════════════════════════════════════════════════ -->
	<!-- BIBLIOGRAPHIE                                     -->
	<!-- ════════════════════════════════════════════════ -->

	<Bibliography>
		<BibElement
			authors={['Nesterov, Y.']}
			year={1983}
			title="A method of solving a convex programming problem with convergence rate O(1/k²)"
			journal="Soviet Mathematics Doklady, 27(2), 372–376."
		/>

		<BibElement
			authors={['Polyak, B. T.']}
			year={1964}
			title="Some methods of speeding up the convergence of iteration methods"
			journal="USSR Computational Mathematics and Mathematical Physics, 4(5), 1–17."
			link="https://doi.org/10.1016/0041-5553(64)90137-5"
		/>

		<BibElement
			authors={['Robbins, H.', 'Monro, S.']}
			year={1951}
			title="A stochastic approximation method"
			journal="Annals of Mathematical Statistics, 22(3), 400–407."
			link="https://doi.org/10.1214/aoms/1177729684"
		/>

		<BibElement
			authors={['Bottou, L.']}
			year={2010}
			title="Large-scale machine learning with stochastic gradient descent"
			journal="Proceedings of COMPSTAT'2010, 177–186."
			link="https://doi.org/10.1007/978-3-642-13190-5_19"
		/>

		<BibElement
			authors={['Duchi, J.', 'Hazan, E.', 'Singer, Y.']}
			year={2011}
			title="Adaptive subgradient methods for online learning and stochastic optimization"
			journal="Journal of Machine Learning Research, 12(Jul), 2121–2159."
			link="https://jmlr.org/papers/v12/duchi11a.html"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.proof-block {
		margin: 1rem 0;
		padding: 0.75rem 1rem;
		background: var(--color-surface-2, rgba(255, 255, 255, 0.03));
		border-left: 3px solid var(--color-text-muted);
		border-radius: 0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.proof-block p {
		margin: 0.25rem 0;
	}

	.synthesis-table {
		margin: 1.5rem 0;
	}

	.synthesis-table h3 {
		margin-bottom: 0.75rem;
		font-size: 1rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		max-width: 600px;
		margin: 0 auto;
	}

	th,
	td {
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	th {
		color: var(--color-text-muted);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	tbody tr:hover {
		background: var(--color-surface-2, rgba(255, 255, 255, 0.03));
	}
</style>
