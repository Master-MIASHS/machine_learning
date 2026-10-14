<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
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

	const meta = getPageByPath('/part1/dualite-convexe-kkt');
	const tracker = createPageTracker(meta as PageMeta);
	const quiz = getQuizQuestions('p1/dualite');
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
		{ id: 'introduction', label: 'Pourquoi la dualité ?', description: 'Un second problème, des bornes certifiées', color: 'epistemic' },
		{ id: 'exemple-conducteur', label: 'Un problème 2-D de bout en bout', description: 'Lagrangienne, duale, gap, KKT en forme close', color: 'positive' },
		{ id: 'cadre-general', label: 'La dualité lagrangienne générale', description: 'Forme standard, borne inférieure, duale convexe', color: 'belief' },
		{ id: 'dualite-forte', label: 'Dualité forte, Slater et sensibilité', description: 'Le théorème, la géométrie, les prix marginaux', color: 'belief' },
		{ id: 'kkt', label: 'Les conditions KKT', description: 'Nécessité, suffisance, water-filling', color: 'surprise' },
		{ id: 'fil-svm', label: 'Fil A — la SVM', description: 'La dualité qui paie', color: 'agent' },
		{ id: 'fil-lasso', label: 'Fil B — le Lasso', description: 'La dualité moins exploitable', color: 'agent' },
		{ id: 'gap-strict', label: 'Quand la dualité forte échoue', description: 'Le piège, le gap strict, la primale non bornée', color: 'surprise' },
		{ id: 'synthese', label: 'Synthèse et limites', description: 'Le tableau de bord', color: 'epistemic' }
	];

	/* ---------------------------- formules KaTeX ---------------------------- */

	// Section 2 — exemple conducteur.
	const condProblem = String.raw`\text{(P)} \qquad \min_{(x,\, y)}\; (x - 1)^{2} + (y - 1)^{2} \qquad \text{s.c.}\; x + y \le 1`;
	const condSolution = String.raw`x^{*} = y^{*} = \tfrac{1}{2}, \qquad p^{*} = (1/2 - 1)^{2} + (1/2 - 1)^{2} = \tfrac{1}{2}`;
	const condLagrangian = String.raw`L(x, y, \lambda) = (x - 1)^{2} + (y - 1)^{2} + \lambda\, (x + y - 1), \qquad \lambda \ge 0`;
	const condStationarity = String.raw`\frac{\partial L}{\partial x} = 2(x - 1) + \lambda = 0 \;\Longrightarrow\; x(\lambda) = 1 - \tfrac{\lambda}{2}, \qquad \frac{\partial L}{\partial y} = 2(y - 1) + \lambda = 0 \;\Longrightarrow\; y(\lambda) = 1 - \tfrac{\lambda}{2}`;
	const condDualFunction = String.raw`g(\lambda) = L\!\left(1 - \tfrac{\lambda}{2},\, 1 - \tfrac{\lambda}{2},\, \lambda\right) = 2\cdot\left(-\tfrac{\lambda}{2}\right)^{2} + \lambda\,\big(2(1 - \tfrac{\lambda}{2}) - 1\big) = \tfrac{\lambda^{2}}{2} + \lambda(1 - \lambda) = \lambda - \tfrac{\lambda^{2}}{2}`;
	const condDualOpt = String.raw`d^{*} = g(1) = 1 - \tfrac{1}{2} = \tfrac{1}{2} \qquad\Longrightarrow\qquad p^{*} = d^{*} = \tfrac{1}{2}`;
	const condGap = String.raw`\operatorname{gap}(\lambda) \;:=\; p^{*} - g(\lambda) = \tfrac{1}{2} - \left(\lambda - \tfrac{\lambda^{2}}{2}\right) = \tfrac{(\lambda - 1)^{2}}{2}`;
	const condKkt = String.raw`\begin{aligned} \text{stationnarité}\quad & 2(x - 1) + \lambda = 0, \quad 2(y - 1) + \lambda = 0 \\ \text{faisabilité primale}\quad & x + y \le 1 \\ \text{faisabilité duale}\quad & \lambda \ge 0 \\ \text{complémentarité}\quad & \lambda\, (x + y - 1) = 0 \end{aligned}`;

	// Section 3 — cadre général.
	const stdForm = String.raw`\min_{x}\; f_{0}(x) \qquad \text{s.c.}\; f_{i}(x) \le 0 \ (i = 1, \dots, m), \quad h_{j}(x) = 0 \ (j = 1, \dots, p)`;
	const stdLagrangian = String.raw`L(x, \lambda, \nu) = f_{0}(x) + \sum_{i} \lambda_{i}\, f_{i}(x) + \sum_{j} \nu_{j}\, h_{j}(x)`;
	const stdDualFunction = String.raw`g(\lambda, \nu) = \inf_{x}\; L(x, \lambda, \nu), \qquad \text{domaine : } \{(\lambda, \nu) \mid \lambda \ge 0,\; g > -\infty\}`;
	const lowerBound = String.raw`g(\lambda, \nu) = \inf_{x}\, L(x, \lambda, \nu) \le f_{0}(x) \le p^{*}`;
	const stdDual = String.raw`\text{(D)} \qquad \max_{(\lambda,\, \nu)}\; g(\lambda, \nu) \qquad \text{s.c.}\; \lambda \ge 0`;
	const weakDuality = String.raw`d^{*} \le p^{*}`;
	const hiddenConstraint = String.raw`g(\lambda, \nu) = \begin{cases} -\,b^{\top}\nu & \text{si } c + A^{\top}\nu - \lambda = 0, \\ -\infty & \text{sinon.} \end{cases}`;

	// Section 4 — dualité forte.
	const strongDuality = String.raw`d^{*} = p^{*}`;
	const slaterProblem = String.raw`\min_{x}\; f_{0}(x) \qquad \text{s.c.}\; f_{i}(x) \le 0 \ (i = 1, \dots, m), \quad Ax = b`;
	const slaterCondition = String.raw`f_{i}(x) < 0 \ (i = 1, \dots, m), \qquad Ax = b`;
	const sepSets = String.raw`\begin{aligned} G &= \big\{ \big( f_{1}(x), \dots, f_{m}(x),\, h_{1}(x), \dots, h_{p}(x),\, f_{0}(x) \big) \,\big|\, x \in D \big\} \\ A &= G + \mathbb{R}^{m}_{+} \times \{0\} \times \mathbb{R}_{+} \end{aligned}`;
	const sepEq = String.raw`p^{*} = (\lambda, \nu, 1)^{\top}(0, 0, p^{*}) \ge g(\lambda, \nu) \quad \text{pour un certain } (\lambda, \nu) \text{ avec } \lambda \ge 0`;
	const saddleIneq = String.raw`\sup_{\lambda \ge 0}\; \inf_{x}\, L(x, \lambda) \;\le\; \inf_{x}\; \sup_{\lambda \ge 0}\, L(x, \lambda)`;
	const saddleEq = String.raw`\sup_{\lambda}\, \inf_{x}\, L(x, \lambda) = \inf_{x}\, \sup_{\lambda}\, L(x, \lambda) = p^{*} = d^{*}`;
	const sensGlobal = String.raw`p^{*}(u, v) \ge p^{*}(0, 0) - \lambda^{*\top} u - \nu^{*\top} v`;
	const sensLocal = String.raw`\lambda_{i}^{*} = -\, \frac{\partial p^{*}}{\partial u_{i}}(0, 0), \qquad \nu_{j}^{*} = -\, \frac{\partial p^{*}}{\partial v_{j}}(0, 0)`;
	const sensClosed = String.raw`p^{*}(u) = 2\cdot\big(x^{*}(u) - 1\big)^{2} = \tfrac{(1 - u)^{2}}{2} \qquad (u \le 1)`;

	// Section 5 — KKT.
	const kktProblem = String.raw`\min_{x}\; f_{0}(x) \qquad \text{s.c.}\; f_{i}(x) \le 0 \ (i = 1, \dots, m), \quad h_{j}(x) = 0 \ (j = 1, \dots, p)`;
	const kktConditions = String.raw`\begin{aligned} \text{(i)}\;\; & \text{faisabilité primale} \quad f_{i}(x) \le 0 \ (i = 1 \dots m), \quad h_{j}(x) = 0 \ (j = 1 \dots p) \\ \text{(ii)}\;\; & \text{faisabilité duale} \quad \lambda_{i} \ge 0 \ (i = 1 \dots m) \\ \text{(iii)}\;\; & \text{complémentarité} \quad \lambda_{i}\, f_{i}(x) = 0 \ (i = 1 \dots m) \\ \text{(iv)}\;\; & \text{stationnarité} \quad \nabla f_{0}(x) + \sum_{i} \lambda_{i}\, \nabla f_{i}(x) + \sum_{j} \nu_{j}\, \nabla h_{j}(x) = 0 \end{aligned}`;
	const kktSuf2 = String.raw`\sum_{i} \lambda_{i}\, f_{i}(\hat{x}) \ge \left(\sum_{i} \lambda_{i}\, \nabla f_{i}(x)\right)^{\top}(\hat{x} - x)`;
	const kktSuf3 = String.raw`\sum_{j} \nu_{j}\, h_{j}(\hat{x}) = \left(\sum_{j} \nu_{j}\, \nabla h_{j}(x)\right)^{\top}(\hat{x} - x)`;
	const kktSufChain = String.raw`f_{0}(\hat{x}) \ge L(\hat{x}, \lambda, \nu) \ge f_{0}(x)`;
	const waterfillProblem = String.raw`\min_{x}\; -\, \sum_{i} \log(\alpha_{i} + x_{i}) \quad (\alpha_{i} > 0) \qquad \text{s.c.}\; x_{i} \ge 0, \quad \sum_{i} x_{i} = 1`;
	const waterfillSolution = String.raw`x_{i}^{*} = \max\left(0,\; \tfrac{1}{\nu^{*}} - \alpha_{i}\right), \qquad \sum_{i} \max\left(0,\; \tfrac{1}{\nu^{*}} - \alpha_{i}\right) = 1`;

	// Section 6 — SVM.
	const svmPrimal = String.raw`\min_{(w,\, b)}\; \tfrac{1}{2}\, \lVert w \rVert_{2}^{2} \qquad \text{s.c.}\; y_{i}\, (w^{\top} x_{i} + b) \ge 1, \quad i = 1, \dots, n`;
	const svmLagrangian = String.raw`L(w, b, \alpha) = \tfrac{1}{2}\, \lVert w \rVert^{2} - \sum_{i} \alpha_{i}\, \big[ y_{i}\, (w^{\top} x_{i} + b) - 1 \big]`;
	const svmDual = String.raw`(D_{\mathrm{SVM}}) \qquad \max_{\alpha}\; \sum_{i} \alpha_{i} - \tfrac{1}{2} \sum_{i} \sum_{j} \alpha_{i} \alpha_{j}\, y_{i} y_{j}\, x_{i}^{\top} x_{j} \qquad \text{s.c.}\; \sum_{i} \alpha_{i} y_{i} = 0, \quad \alpha_{i} \ge 0`;

	// Section 7 — Lasso.
	const lassoPen = String.raw`(P_{\lambda}) \qquad \min_{\theta}\; \tfrac{1}{2}\, \lVert y - X\theta \rVert_{2}^{2} + \lambda\, \lVert \theta \rVert_{1}`;
	const lassoConstr = String.raw`(P_{t}) \qquad \min_{\theta}\; \tfrac{1}{2}\, \lVert y - X\theta \rVert_{2}^{2} \qquad \text{s.c.}\; \lVert \theta \rVert_{1} \le t`;
	const lassoDualG = String.raw`g(\lambda) = \inf_{\theta}\, \big[ \tfrac{1}{2}\, \lVert y - X\theta \rVert_{2}^{2} + \lambda\, \lVert \theta \rVert_{1} \big] - \lambda t =: p_{\mathrm{pen}}(\lambda) - \lambda t`;
	const lassoIncl = String.raw`0 \in -\, X^{\top} (y - X\theta(\lambda)) + \lambda\, \partial \lVert \theta(\lambda) \rVert_{1}`;
	const lassoFenchel = String.raw`(D_{\lambda}) \qquad \max_{u}\; \tfrac{1}{2}\, \lVert (I - P_{X})\, y \rVert_{2}^{2} + u^{\top} (X^{\top} X)^{-1} X^{\top} y - \tfrac{1}{2}\, u^{\top} (X^{\top} X)^{-1} u \qquad \text{s.c.}\; \lVert u \rVert_{\infty} \le \lambda, \quad u \in \mathbb{R}^{d}`;
	const lassoKkt = String.raw`\begin{aligned} \theta^{*}_{i} \neq 0 \;\; \Longrightarrow \;\; (X^{\top} r^{*})_{i} = \lambda\, \mathrm{sgn}(\theta^{*}_{i}) & \quad \text{(le gradient est saturé à } \pm \lambda \text{)} \\ \theta^{*}_{i} = 0 \;\; \Longrightarrow \;\; \left\lVert (X^{\top} r^{*})_{i} \right\rVert \le \lambda & \quad \text{(le gradient ne dépasse pas } \lambda \text{)} \end{aligned} \qquad (r^{*} = y - X\theta^{*})`;

	// Section 8 — gap strict.
	const trapProblem = String.raw`\min_{x}\; (x - 2)^{2} \qquad \text{s.c.}\; x^{2} \ge 1 \quad (\text{i.e. } 1 - x^{2} \le 0 \text{ — NON convexe})`;
	const trapDual = String.raw`g(\lambda) = \begin{cases} -\, \dfrac{\lambda\, (3 + \lambda)}{1 - \lambda} & \text{si } \lambda \in [0, 1), \\ -\infty & \text{si } \lambda \ge 1. \end{cases}`;
	const unboundedProblem = String.raw`\min_{x}\; x \qquad \text{s.c.}\; x^{2} \ge 1`;
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Dualité convexe et conditions KKT'}
	subtitle="Lagrangienne, duale, dualité forte, Slater, conditions KKT — et ce que SVM et Lasso en font"
	prev={prevMeta}
	next={nextMeta}
>
	<TableOfContents entries={tocEntries} />
	<TheorySection>
		<!-- ========================================================= -->
		<!-- 1. INTRODUCTION                                           -->
		<!-- ========================================================= -->
		<h2 id="introduction">Pourquoi la dualité ?</h2>

		<p>
			La Partie I a donné les outils <em>primal</em> de l'optimisation convexe : conditions
			d'optimalité sans contraintes (leçon 1), convexité (leçon 2), descente de gradient (leçon 3),
			Newton (leçon 4). Tous ces outils résolvent le problème <strong>de face</strong> : on itère
			sur <KatexInline formula="x" />. Il existe une autre stratégie, souvent plus puissante :
			construire un <em>second problème</em>, le <strong>problème duale</strong>, qui fournit des
			<strong>bornes certifiées</strong> sur la valeur optimale — et dont la résolution donne, en
			bonus, le point primal optimal et un <strong>certificat</strong> d'optimalité. C'est la
			<strong>dualité lagrangienne</strong>, et elle est le fil rouge qui relie :
		</p>

		<ul>
			<li>
				la <strong>SVM</strong> (Partie II) : le problème primal est un QP à
				<KatexInline formula="n" /> contraintes ; le problème duale est un QP à
				<KatexInline formula="n" /> variables avec une structure de box — c'est la duale qu'on
				résout, et ses variables non nulles <em>sont</em> les <strong>vecteurs support</strong>
				(panneau de la leçon 4 de la Partie II) ;
			</li>
			<li>
				le <strong>Lasso</strong> (Partie V, Définition 5.2) : où la dualité existe aussi mais est
				<strong>beaucoup moins exploitable</strong> — comprendre <em>pourquoi</em> est l'objet du
				fil B de cette leçon ;
			</li>
			<li>
				l'analyse d'<strong>algorithme</strong> : le gap de dualité est le certificat de qualité
				qu'utilisent les méthodes primal-duales modernes (leçon « méthodes proximales » : ADMM).
			</li>
		</ul>

		<Callout type="summary" title="Ce que vous allez savoir faire">
			<p>
			À la fin de cette leçon, pour tout problème convexe
			<KatexInline formula={String.raw`\min f_{0}(x)`} /> s.t.
			<KatexInline formula={String.raw`f_{i}(x) \le 0,\ h_{j}(x) = 0`}
			/>, vous saurez : écrire la lagrangienne et la fonction duale ; prouver que la duale donne une
			borne inférieure (dualité faible) ; dire quand la borne est exacte (dualité forte, condition de
			Slater) ; écrire et exploiter les conditions KKT (nécessité et suffisance) ; et juger, sur un
			exemple concret (SVM vs Lasso), quand la duale est un outil de calcul — et quand ce n'est qu'un
			outil de certification.
		</p>
		</Callout>

		<p>
			<strong>Le plan.</strong> (1) Un problème 2-D de bout en bout : on fait <em>tout</em> à la main —
			lagrangienne, duale, dualité forte, KKT, courbe de gap — sur un exemple où chaque quantité a une
			forme close. (2) Le cadre général : forme standard, borne inférieure point par point, duale
			toujours convexe, dualité faible, contraintes « cachées » dans le domaine de la duale. (3) Dualité
			forte et Slater : le théorème, l'interprétation géométrique (hyperplan support), la preuve par
			séparation en une phrase, le point de selle, et l'analyse de sensibilité (les multiplicateurs
			comme prix marginaux). (4) Les conditions KKT : énoncé, preuve de nécessité (Slater) et de
			suffisance (convexité). (5) Fil A — la SVM : la dualité qui paie. (6) Fil B — le Lasso : la
			dualité moins exploitable, et ce que ses KKT disent de la parcimonie. (7) Quand la dualité forte
			échoue : le piège non convexe à gap nul, le gap strict convexe sans Slater, la primale non
			bornée. (8) Synthèse.
		</p>

		<!-- ========================================================= -->
		<!-- 2. EXEMPLE CONDUCTEUR                                     -->
		<!-- ========================================================= -->
		<h2 id="exemple-conducteur">Un problème 2-D de bout en bout</h2>

		<DefinitionBlock number="2.1" title="Problème conducteur">
			<p>Considérons le problème à deux variables</p>
			<KatexBlock formula={condProblem} />
			<p>
				Géométriquement, on projette le point <KatexInline formula={String.raw`(1, 1)`} /> sur le
				demi-plan <KatexInline formula={String.raw`x + y \le 1`} />. La solution s'obtient
				immediately — la projection de <KatexInline formula={String.raw`(1, 1)`} /> sur la droite
				<KatexInline formula={String.raw`x + y = 1`} /> est
				<KatexInline formula={String.raw`(1/2, 1/2)`} /> (le point
				<KatexInline formula={String.raw`(1, 1)`} /> est à l'extérieur du demi-plan, donc la
				contrainte est active) :
			</p>
			<KatexBlock formula={condSolution} />
			<p>
				Ce problème est <strong>convexe</strong> (fonction objectif strictement convexe, contrainte
				affine) et admet un point <strong>strictement faisable</strong> —
				<KatexInline formula={String.raw`(0, 0)`} /> satisfait
				<KatexInline formula={String.raw`0 + 0 < 1`} /> strictement — donc la condition de Slater
				tient (on précise ce que cela implique à la section 4). Calculons <em>toute</em> la
				machinerie duale à la main : c'est le même pipeline que pour la SVM ou le Lasso, mais en
				forme close.
			</p>
		</DefinitionBlock>

		<h3>La lagrangienne et la fonction duale</h3>

		<p>
			La contrainte <KatexInline formula={String.raw`x + y \le 1`} /> reçoit un multiplicateur
			<KatexInline formula={String.raw`\lambda \ge 0`} /> (signe : on punit les violations). La
			<strong>lagrangienne</strong> est
		</p>
		<KatexBlock formula={condLagrangian} />
		<p>
			Pour chaque <KatexInline formula={String.raw`\lambda \ge 0`} />, on
			<strong>minimise</strong> <KatexInline formula="L" /> sur
			<KatexInline formula={String.raw`(x, y)`} /> libres : c'est une quadratique, et la
			stationnarité donne
		</p>
		<KatexBlock formula={condStationarity} />
		<p>
			La <strong>fonction duale</strong> est la valeur de ce minimum :
		</p>
		<KatexBlock formula={condDualFunction} />
		<p>
			<KatexInline formula="g" /> est une <strong>parabole concave</strong> de sommet en
			<KatexInline formula={String.raw`\lambda = 1`} />.
		</p>

		<h3>Le problème duale, et l'égalité qui fait tout</h3>

		<p>
			Le <strong>problème duale</strong> est
			<KatexInline formula={String.raw`\max\, g(\lambda)`} /> s.t.
			<KatexInline formula={String.raw`\lambda \ge 0`} />. Le sommet de la parabole est à
			<KatexInline formula={String.raw`\lambda^{*} = 1 \ge 0`} />, donc :
		</p>
		<KatexBlock formula={condDualOpt} />
		<p>
			<strong>Et</strong> <KatexInline formula={String.raw`p^{*} = d^{*} = 1/2`} /> : le gap de
			dualité est <strong>nul</strong>. La duale a donné la valeur optimale de la primale
			<em>sans qu'on ait jamais résolu la primale</em>. C'est la <strong>dualité forte</strong> —
			la section 4 dira exactement pourquoi elle tient ici (convexité + Slater).
		</p>
		<p>
			De plus, le minimiseur de la lagrangienne au multiplicateur optimal redonne le primal :
			<KatexInline formula={String.raw`x(\lambda^{*}) = y(\lambda^{*}) = 1 - 1/2 = 1/2`} /> — la
			recette « résoudre la duale, puis
			<KatexInline formula={String.raw`x^{*} = \arg\min L(x, \lambda^{*})`} /> » fonctionne en 2-D.
		</p>

		<h3>La courbe de gap</h3>

		<p>
			Pour tout <KatexInline formula={String.raw`\lambda \ge 0`} /> (pas seulement l'optimal),
			<KatexInline formula={String.raw`g(\lambda)`} /> est une borne inférieure de
			<KatexInline formula={String.raw`p^{*}`} /> :
		</p>
		<KatexBlock formula={condGap} />
		<p>
			<KatexInline formula={String.raw`\operatorname{gap}(\lambda)`} /> est une
			<strong>parabole tangente à 0</strong> en <KatexInline formula={String.raw`\lambda^{*} = 1`} />
			: nulle au multiplicateur optimal, strictement positive ailleurs. C'est l'image géométrique de la
			dualité faible : <em>chaque</em> point dual faisable certifie une borne, et la meilleure
			certification est <KatexInline formula={String.raw`d^{*}`} />.
		</p>

		<ExampleBlock number="2.2" title="Les KKT du problème conducteur">
			<p>Écrivons les conditions KKT (énoncées et prouvées à la section 5) :</p>
			<KatexBlock formula={condKkt} />
			<p>
				De la stationnarité : <KatexInline formula={String.raw`x = y = 1 - \lambda/2`} />. Deux cas :
				<KatexInline formula={String.raw`\lambda = 0`} /> (contrainte inactive) donnerait
				<KatexInline formula={String.raw`x = y = 1`} />, qui viole
				<KatexInline formula={String.raw`x + y \le 1`} /> — rejeté. Donc
				<KatexInline formula={String.raw`\lambda > 0`} /> et la complémentarité force
				<KatexInline formula={String.raw`x + y = 1`} /> :
				<KatexInline formula={String.raw`2(1 - \lambda/2) = 1`} />, donc
				<KatexInline formula={String.raw`\lambda^{*} = 1`} />, et
				<KatexInline formula={String.raw`x^{*} = y^{*} = 1/2`} />. <strong>Un seul point KKT — et
				c'est l'optimum.</strong> La duale et les KKT racontent la même histoire par deux portes.
			</p>
		</ExampleBlock>

		<Callout type="insight" title="Le pipeline, en quatre objets">
			<ol>
				<li>
					<strong>Lagrangienne</strong> <KatexInline formula={String.raw`L(x, \lambda)`} /> : on
					« achète » la contrainte au prix <KatexInline formula={String.raw`\lambda \ge 0`} />.
				</li>
				<li>
					<strong>Fonction duale</strong>
					<KatexInline formula={String.raw`g(\lambda) = \inf_{x} L(x, \lambda)`} /> : le meilleur
					prix possible une fois le marché fixé — toujours concave, toujours
					<KatexInline formula={String.raw`\le p^{*}`} />.
				</li>
				<li>
					<strong>Problème duale</strong> <KatexInline formula={String.raw`\max g`} /> : la
					meilleure borne certifiée ; <KatexInline formula={String.raw`d^{*} \le p^{*}`} />
					toujours, <KatexInline formula={String.raw`d^{*} = p^{*}`} /> sous qualification
					(Slater).
				</li>
				<li>
					<strong>KKT</strong> : les équations qui relient primal optimal, dual optimal et
					complémentarité — le certificat final.
				</li>
			</ol>
			<p>
				Retenez ce schéma : il est <em>identique</em> pour la SVM (section 6), le Lasso (section 7),
				et pour n'importe quel problème convexe.
			</p>
		</Callout>

		<InteractiveSection
			number="E.1"
			title="Le problème conducteur : gap et KKT"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/DualityGap2D.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 3. CADRE GÉNÉRAL                                          -->
		<!-- ========================================================= -->
		<h2 id="cadre-general">La dualité lagrangienne générale</h2>

		<DefinitionBlock number="3.1" title="Forme standard">
			<p>On considère un problème général — <strong>pas supposé convexe</strong> :</p>
			<KatexBlock formula={stdForm} />
			<p>
				avec domaine <KatexInline formula={String.raw`D = \{x \mid f_{i}(x) \le 0\ \forall i,\ h_{j}(x) = 0\ \forall j\}`} />
				non vide ; on note <KatexInline formula={String.raw`p^{*}`} /> sa valeur optimale (qui peut
				être <KatexInline formula={String.raw`\pm\infty`} /> ou non atteinte — rien n'est supposé).
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="3.2" title="Lagrangienne et fonction duale">
			<p>
				On introduit un multiplicateur <KatexInline formula={String.raw`\lambda_{i} \ge 0`} /> par
				contrainte d'inégalité et un <KatexInline formula={String.raw`\nu_{j} \in \mathbb{R}`} /> par
				contrainte d'égalité. La <strong>lagrangienne</strong> est
			</p>
			<KatexBlock formula={stdLagrangian} />
			<p>
				L'idée (Boyd &amp; Vandenberghe, §5.1.1) : remplacer les contraintes « dures » (fonctions
				indicatrices, un « mur de brique ») par une pénalité linéaire « douce » — zéro si la
				contrainte est respectée, croissante quand elle est violée, pour
				<KatexInline formula={String.raw`\lambda_{i} > 0`} />. La <strong>fonction duale</strong> est
				la valeur optimale de la minimisation de la lagrangienne :
			</p>
			<KatexBlock formula={stdDualFunction} />
			<p>Deux faits immédiats et fondamentaux :</p>
			<ol>
				<li>
					<strong>Borne inférieure point par point</strong> (Boyd &amp; Vandenberghe, eq. (5.2)) :
					si <KatexInline formula="x" /> est faisable et
					<KatexInline formula={String.raw`\lambda \ge 0`} />, alors
					<KatexInline formula={String.raw`L(x, \lambda, \nu) = f_{0}(x) + \sum_{i} \lambda_{i} f_{i}(x) + \sum_{j} \nu_{j} h_{j}(x) \le f_{0}(x)`} />
					(les <KatexInline formula={String.raw`f_{i}(x) \le 0`} /> multipliés par des
					<KatexInline formula={String.raw`\lambda_{i} \ge 0`} /> sont négatifs, les
					<KatexInline formula={String.raw`h_{j}(x) = 0`} /> s'annulent). Donc
				</li>
			</ol>
			<KatexBlock formula={lowerBound} />
			<p>
				pour <strong>tout</strong> <KatexInline formula={String.raw`(\lambda, \nu)`} /> faisable dual
				— <em>même si le problème n'est pas convexe</em>.
			</p>
			<ol start="2">
				<li>
					<strong>Concavité</strong> (Boyd &amp; Vandenberghe, §5.1.2) : pour chaque
					<KatexInline formula="x" /> fixé, <KatexInline formula={String.raw`L(x, \lambda, \nu)`} />
					est <strong>affine</strong> en <KatexInline formula={String.raw`(\lambda, \nu)`} /> ;
					<KatexInline formula="g" /> est l'infimum point par point d'une famille de fonctions
					affines, donc <strong>concave</strong> (possiblement
					<KatexInline formula={String.raw`-\infty`} /> sur une partie de son espace).
				</li>
			</ol>
		</DefinitionBlock>

		<DefinitionBlock number="3.3" title="Problème duale">
			<p>La meilleure borne inférieure disponible dans <KatexInline formula="g" /> est</p>
			<KatexBlock formula={stdDual} />
			<p>
				« This problem is called the Lagrange dual problem associated with the problem (5.1) » — le
				problème d'origine devient la <strong>primale</strong>.
			</p>
			<p>
				<strong>Propriété clé</strong> (Boyd &amp; Vandenberghe, §5.2) : la duale
				<KatexInline formula={String.raw`(D)`} /> est un <strong>problème d'optimisation convexe</strong>{' '}
				(maximisation d'une fonction concave sur un domaine convexe) — « whether or not the primal
				problem is convex ». La dualité <em>transforme toujours</em> le problème en un problème
				convexe, même si la primale ne l'est pas : c'est déjà une moitié de la valeur de la dualité,
				indépendamment du gap.
			</p>
		</DefinitionBlock>

		<h3>Dualité faible</h3>

		<p>
			Notons <KatexInline formula={String.raw`d^{*}`} /> la valeur optimale de la duale. La
			<strong>dualité faible</strong> est l'inégalité
		</p>
		<KatexBlock formula={weakDuality} />
		<p>
			<strong>Preuve.</strong> Pour tout <KatexInline formula={String.raw`(\lambda, \nu)`} /> faisable
			dual, <KatexInline formula={String.raw`g(\lambda, \nu) \le p^{*}`} /> (bloc 3.2, fait 1). En
			prenant le supremum sur le faisable dual, <KatexInline formula={String.raw`d^{*} \le p^{*}`} />.
			∎
		</p>
		<p>
			La différence <KatexInline formula={String.raw`p^{*} - d^{*} \ge 0`} /> est le
			<strong>gap de dualité optimal</strong> : il mesure l'écart entre la primale et la
			<em>meilleure</em> borne inférieure lagrangienne. Conséquences en valeurs infinies (Boyd &amp;
			Vandenberghe, §5.2.2) : si <KatexInline formula={String.raw`p^{*} = -\infty`} /> (primale non
			bornée inférieurement) alors <KatexInline formula={String.raw`d^{*} = -\infty`} /> (la duale est
			infaisable) ; si <KatexInline formula={String.raw`d^{*} = +\infty`} /> alors
			<KatexInline formula={String.raw`p^{*} = +\infty`} /> (la primale est infaisable).
		</p>
		<p>
			<strong>Usage immédiat</strong> : même avec un gap non nul,
			<KatexInline formula={String.raw`d^{*}`} /> est une borne <em>certifiée</em> de
			<KatexInline formula={String.raw`p^{*}`} /> — et la duale est convexe, donc souvent facile à
			résoudre. Exemple (Boyd &amp; Vandenberghe, §5.2.2) : le problème de bipartition
			<KatexInline formula={String.raw`\min x^{\top} W x`} /> s.t.
			<KatexInline formula={String.raw`x_{i}^{2} = 1`} /> (NP-difficile) a pour duale un
			<strong>SDP</strong> <KatexInline formula={String.raw`\max -\, \mathbf{1}^{\top}\nu`} /> s.t.
			<KatexInline formula={String.raw`W + \operatorname{diag}(\nu) \succeq 0`} /> — résoluble en
			<KatexInline formula={String.raw`n = 1000`} />, et sa valeur borne le problème combinatoire.
		</p>

		<h3>Les contraintes cachées dans le domaine de la duale</h3>

		<p>
			Il arrive que <KatexInline formula={String.raw`g(\lambda, \nu) = -\infty`} /> sauf si
			<KatexInline formula={String.raw`(\lambda, \nu)`} /> vérifie des égalités supplémentaires — des
			contraintes qui <strong>n'apparaissaient pas</strong> dans la primale. Exemple type (Boyd &amp;
			Vandenberghe, §5.2.1, LP standard <KatexInline formula={String.raw`\min c^{\top} x`} /> s.t.
			<KatexInline formula={String.raw`Ax = b,\ x \ge 0`} />) :
		</p>
		<KatexBlock formula={hiddenConstraint} />
		<p>
			La contrainte d'égalité <KatexInline formula={String.raw`c + A^{\top}\nu - \lambda = 0`} /> est
			« cachée » dans le domaine fini de <KatexInline formula="g" /> : la duale explicite la fait
			apparaître en contrainte à part entière.
		</p>
		<p>
			<strong>C'est exactement le mécanisme qui produit</strong>
			<KatexInline formula={String.raw`\sum_{i} \alpha_{i} y_{i} = 0`} /> <strong>dans la duale SVM</strong>{' '}
			(section 6) : la contrainte n'est nulle part dans la lagrangienne — elle émerge du fait que
			<KatexInline formula="g" /> n'est finie que sur cette affine. À retenir : <em>quand une
			contrainte « mystérieuse » apparaît dans une duale, c'est le domaine de</em>{' '}
			<KatexInline formula="g" /> <em>qui parle.</em>
		</p>

		<!-- ========================================================= -->
		<!-- 4. DUALITÉ FORTE                                          -->
		<!-- ========================================================= -->
		<h2 id="dualite-forte">Dualité forte, Slater, géométrie et sensibilité</h2>

		<DefinitionBlock number="4.1" title="Dualité forte">
			<p>On dit que <strong>dualité forte</strong> tient si</p>
			<KatexBlock formula={strongDuality} />
			<p>
				— le gap optimal est nul : la meilleure borne lagrangienne est <em>exacte</em>. « Strong
				duality does not, in general hold » (Boyd &amp; Vandenberghe) : il faut des hypothèses
				supplémentaires. La plus simple et la plus utilisée est la condition de Slater.
			</p>
		</DefinitionBlock>

		<TheoremBlock number="4.2" title="Dualité forte sous Slater (théorème de Slater)">
			<p>
				Soit le problème convexe standard <KatexBlock formula={slaterProblem} /> avec
				<KatexInline formula={String.raw`f_{0}, \dots, f_{m}`} /> convexes. S'il existe
				<KatexInline formula={String.raw`x \in \operatorname{relint} D`} /> tel que
			</p>
			<KatexBlock formula={slaterCondition} />
			<p>
				— un point <strong>strictement faisable</strong> — alors <strong>dualité forte</strong> :
				<KatexInline formula={String.raw`d^{*} = p^{*}`} />. De plus, si
				<KatexInline formula={String.raw`d^{*} > -\infty`} />, le dual optimal est
				<strong>atteint</strong> : il existe <KatexInline formula={String.raw`(\lambda^{*}, \nu^{*})`} />{' '}
				faisable dual avec <KatexInline formula={String.raw`g(\lambda^{*}, \nu^{*}) = d^{*} = p^{*}`} />.
			</p>
			<p>
				<strong>Remarque (Slater affiné, Boyd &amp; Vandenberghe, eq. (5.27))</strong> : si les
				<KatexInline formula={String.raw`f_{1}, \dots, f_{k}`} /> sont <strong>affines</strong>, elles
				n'ont pas besoin d'être strictes — <KatexInline formula={String.raw`f_{i}(x) \le 0`} /> suffit
				pour <KatexInline formula={String.raw`i \le k`} />, et il faut le strict pour
				<KatexInline formula={String.raw`i > k`} />. En contraintes linéaires pures, Slater se réduit
				à la faisabilité <em>interne</em>. (Pour le Lasso, section 7 : la contrainte
				<KatexInline formula={String.raw`\lVert \theta \rVert_{1} \le t`} /> n'est pas affine, mais
				<KatexInline formula={String.raw`\theta = 0`} /> est strictement faisable dès
				<KatexInline formula={String.raw`t > 0`} /> — Slater tient.)
			</p>
		</TheoremBlock>

		<h3>Preuve (esquisse) par séparation</h3>

		<p>
			La preuve est géométrique et courte (Boyd &amp; Vandenberghe, §5.3.1–5.3.2). On plonge le
			problème dans <KatexInline formula={String.raw`\mathbb{R}^{m+p+1}`} /> et on définit deux
			ensembles :
		</p>
		<KatexBlock formula={sepSets} />
		<p>
			Si le problème est convexe, <KatexInline formula="A" /> est convexe. Le point
			<KatexInline formula={String.raw`(0, 0, p^{*})`} /> est <strong>extérieur</strong> à
			<KatexInline formula="A" /> (aucun point de <KatexInline formula="G" /> n'a ses
			<KatexInline formula={String.raw`m+p`} /> premières coordonnées
			<KatexInline formula={String.raw`\le 0`} /> et sa dernière coordonnée
			<KatexInline formula={String.raw`\le p^{*}`} /> — sinon <KatexInline formula={String.raw`p^{*}`} />{' '}
			ne serait pas optimale). Le théorème de séparation des convexes (Partie I, leçon 2) donne un
			hyperplan séparant <KatexInline formula="A" /> et
			<KatexInline formula={String.raw`(0, 0, p^{*})`} />. Slater garantit que cet hyperplan peut être
			choisi <strong>non vertical</strong> (normale de coordonnée <KatexInline formula={String.raw`t`} />{' '}
			non nulle, normalisée à 1) — c'est exactement l'équation (5.38) de Boyd &amp; Vandenberghe :
		</p>
		<KatexBlock formula={sepEq} />
		<p>
			— soit <KatexInline formula={String.raw`g(\lambda, \nu) = p^{*}`} />, soit dualité forte. Sans
			Slater, l'hyperplan séparant peut être <em>vertical</em> (multiplicateur de la coordonnée
			objectif nul) : on sépare sans rien apprendre — c'est le mécanisme du contre-exemple de la
			section 8.
		</p>
		<p>
			<strong>Les deux rôles de Slater, précisés</strong> : (i) convexité de
			<KatexInline formula="A" /> — vient de la convexité du problème ; (ii) hyperplan non vertical —
			vient du point strictement faisable (<KatexInline formula={String.raw`\operatorname{relint} D`} />{' '}
			non vide). Retirer l'une des deux hypothèses peut casser la dualité forte : la section 8 le
			 montre dans les deux sens.
		</p>

		<h3>Interprétation point de selle</h3>

		<p>
			La dualité faible est une inégalité <strong>max-min</strong> générale (Boyd &amp; Vandenberghe,
			eq. (5.45), valable sans hypothèse) :
		</p>
		<KatexBlock formula={saddleIneq} />
		<p>
			le membre de gauche étant <KatexInline formula={String.raw`d^{*}`} /> et le membre de droite
			étant <KatexInline formula={String.raw`\ge p^{*}`} />. <strong>Dualité forte, c'est précisément
			l'égalité</strong> :
		</p>
		<KatexBlock formula={saddleEq} />
		<p>
			et le point <KatexInline formula={String.raw`(x^{*}, (\lambda^{*}, \nu^{*}))`} /> qui l'atteint est
			un <strong>point de selle</strong> de <KatexInline formula="L" /> — minimum en
			<KatexInline formula="x" />, maximum en <KatexInline formula={String.raw`(\lambda, \nu)`} /> sur le
			faisable (théorème de minimax de Sion pour les hypothèses générales). L'ordre des optimisations
			est l'objet entier : changer <KatexInline formula={String.raw`\inf/\sup`} /> change de problème —
			et c'est là que la convexité + Slater achètent l'égalité.
		</p>

		<h3>Prix marginaux et analyse de sensibilité</h3>

		<p>
			On <strong>perturbe</strong> les bornes des contraintes :
			<KatexInline formula={String.raw`f_{i}(x) \le u_{i}`} />,
			<KatexInline formula={String.raw`h_{j}(x) = v_{j}`} />, et on note
			<KatexInline formula={String.raw`p^{*}(u, v)`} /> la valeur optimale du problème perturbé
			(Boyd &amp; Vandenberghe, §5.6).
		</p>
		<ol>
			<li>
				<KatexInline formula={String.raw`p^{*}`} /> est <strong>convexe</strong> en
				<KatexInline formula={String.raw`(\, u, v\,)`} />.
			</li>
			<li>
				<strong>Inégalité globale</strong> (eq. (5.57)) : pour tout
				<KatexInline formula={String.raw`(u, v)`} /> faisable,
			</li>
		</ol>
		<KatexBlock formula={sensGlobal} />
		<p>
			— le graphe de <KatexInline formula={String.raw`p^{*}`} /> est <strong>minoré</strong> par
			l'hyperplan tangent dual. C'est <KatexInline formula={String.raw`g(\lambda^{*}, \nu^{*}) \le p^{*}(u, v)`} />{' '}
			réécrit.
		</p>
		<ol start="3">
			<li>
				<strong>Sensibilité locale</strong> (eq. (5.58)) : si
				<KatexInline formula={String.raw`p^{*}`} /> est différentiable en
				<KatexInline formula={String.raw`(0, 0)`} />, alors
			</li>
		</ol>
		<KatexBlock formula={sensLocal} />
		<p>
			<strong>Les multiplicateurs optimaux sont les taux marginaux</strong> :
			<KatexInline formula={String.raw`\lambda_{i}^{*}`} /> dit de combien
			<KatexInline formula={String.raw`p^{*}`} /> baisse si on relâche la contrainte i d'une unité
			(interprétation « shadow price », Boyd &amp; Vandenberghe, §5.4.4).
		</p>
		<p>
			<strong>En forme close sur le problème conducteur</strong> : on perturbe la borne en
			<KatexInline formula={String.raw`x + y \le 1 + u`} />
			(<KatexInline formula={String.raw`u > 0`} /> relâche). La contrainte reste active pour
			<KatexInline formula={String.raw`u < 1`} /> ; par symétrie
			<KatexInline formula={String.raw`x^{*}(u) = y^{*}(u) = (1+u)/2`} />, le multiplicateur vaut
			<KatexInline formula={String.raw`\lambda(u) = 1 - u`} />, et
		</p>
		<KatexBlock formula={sensClosed} />
		<p>
			(au-delà de <KatexInline formula={String.raw`u = 1`} />,
			<KatexInline formula={String.raw`(1, 1)`} /> devient faisable et
			<KatexInline formula={String.raw`p^{*}(u) = 0`} />). Donc
			<KatexInline formula={String.raw`p^{*\prime}(0) = -1`} /> et
			<KatexInline formula={String.raw`\lambda^{*} = -p^{*\prime}(0) = 1`} /> — exactement le
			multiplicateur dual trouvé en section 2 ; et plus généralement
			<KatexInline formula={String.raw`\lambda(u) = -p^{*\prime}(u)`} /> sur
			<KatexInline formula={String.raw`u < 1`} />. Vérifié :
			<KatexInline formula={String.raw`p^{*}(u) \ge p^{*}(0) - \lambda^{*} u`} /> pour tout
			<KatexInline formula="u" /> (inégalité (5.57)).
		</p>

		<InteractiveSection
			number="E.2"
			title="La sensibilité : p*(u) et son prix marginal"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/DualityGap2D.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 5. KKT                                                    -->
		<!-- ========================================================= -->
		<h2 id="kkt">Les conditions KKT</h2>

		<TheoremBlock number="5.1" title="Conditions KKT">
			<p>
				Soit un problème <strong>convexe</strong> <KatexBlock formula={kktProblem} /> avec
				<KatexInline formula={String.raw`f_{0}, f_{i}, h_{j}`} />{' '}
				<strong>différentiables</strong>. Les <strong>conditions KKT</strong> sont :
			</p>
			<KatexBlock formula={kktConditions} />
			<ul>
				<li>
					<strong>Nécessité</strong> (Boyd &amp; Vandenberghe, §5.5.3) : si <strong>Slater</strong>{' '}
					tient et <KatexInline formula={String.raw`x^{*}`} /> est optimal, alors
					<KatexInline formula={String.raw`x^{*}`} /> et les multiplicateurs duaux optimaux
					<KatexInline formula={String.raw`(\lambda^{*}, \nu^{*})`} /> satisfont les KKT.
				</li>
				<li>
					<strong>Suffisance</strong> (Boyd &amp; Vandenberghe, §5.5.3) : si le problème est convexe
					(Slater n'est pas requis pour la suffisance) et qu'un point satisfait les KKT, alors il est{' '}
					<strong>optimal</strong>.
				</li>
			</ul>
			<p>
				<strong>À retenir en une ligne</strong> : <em>convexe + différentiable + Slater ⟹ les KKT sont
				nécessaires et suffisantes pour l'optimalité.</em>
			</p>
		</TheoremBlock>

		<h3>Preuve de la nécessité</h3>

		<p>Quatre ingrédients, tous déjà démontrés dans cette leçon :</p>
		<ol>
			<li>
				<strong>Dualité forte + atteinte</strong> (Slater, bloc 4.2) : il existe
				<KatexInline formula={String.raw`(\lambda^{*}, \nu^{*})`} /> avec
				<KatexInline formula={String.raw`g(\lambda^{*}, \nu^{*}) = p^{*}`} />.
			</li>
			<li>
				<strong>Le primal optimal minimise la lagrangienne au dual optimal</strong> :
				<KatexInline formula={String.raw`x^{*}`} /> minimise
				<KatexInline formula={String.raw`L(x, \lambda^{*}, \nu^{*})`} /> et
				<KatexInline formula={String.raw`L(x^{*}, \lambda^{*}, \nu^{*}) = p^{*} = f_{0}(x^{*})`} /> —
				sinon <KatexInline formula={String.raw`g(\lambda^{*}, \nu^{*}) < p^{*}`} /> (certificat de
				sous-optimale, Boyd &amp; Vandenberghe, §5.5.1).
			</li>
			<li>
				<strong>Complémentarité</strong> (Boyd &amp; Vandenberghe, §5.5.2, eq. (5.48)) :
				<KatexInline formula={String.raw`L(x^{*}, \lambda^{*}, \nu^{*}) = f_{0}(x^{*}) + \sum_{i} \lambda_{i}^{*} f_{i}(x^{*}) + \sum_{j} \nu_{j}^{*} h_{j}(x^{*}) = f_{0}(x^{*})`} />{' '}
				avec <KatexInline formula={String.raw`f_{i}(x^{*}) \le 0`} />,
				<KatexInline formula={String.raw`\lambda_{i}^{*} \ge 0`} />,
				<KatexInline formula={String.raw`h_{j}(x^{*}) = 0`} /> force <strong>chaque</strong> terme
				<KatexInline formula={String.raw`\lambda_{i}^{*} f_{i}(x^{*}) = 0`} />.
			</li>
			<li>
				<strong>Stationnarité</strong> : <KatexInline formula={String.raw`x^{*}`} /> minimise la
				lagrangienne (étape 2) ; la lagrangienne est différentiable et <strong>sans contrainte</strong>{' '}
				en <KatexInline formula="x" /> — donc la condition du premier ordre sans contraintes (Partie I,
				leçon 1) s'applique : <KatexInline formula={String.raw`\nabla_{x} L(x^{*}, \lambda^{*}, \nu^{*}) = 0`} />,
				c'est la condition (iv).
			</li>
		</ol>
		<p>Les conditions (i) et (ii) sont la faisabilité primale et duale. ∎</p>

		<h3>Preuve de la suffisance</h3>

		<p>
			Soit <KatexInline formula={String.raw`\hat{x}`} /> <strong>faisable</strong> pour la primale, et
			<KatexInline formula={String.raw`(x, \lambda, \nu)`} /> un point KKT. Trois inégalités, toutes
			élémentaires :
		</p>
		<ol>
			<li>
				<strong>Convexité de</strong> <KatexInline formula={String.raw`f_{0}`} /> :
				<KatexInline formula={String.raw`f_{0}(\hat{x}) \ge f_{0}(x) + \nabla f_{0}(x)^{\top}(\hat{x} - x)`} /> ;
			</li>
			<li>
				<strong>Convexité des</strong> <KatexInline formula={String.raw`f_{i}`} />, multipliée par
				<KatexInline formula={String.raw`\lambda_{i} \ge 0`} /> et sommée — la
				<strong>complémentarité</strong> (<KatexInline formula={String.raw`\sum_{i} \lambda_{i} f_{i}(x) = 0`} />){' '}
				fait disparaître le terme en <KatexInline formula="x" /> :
			</li>
		</ol>
		<KatexBlock formula={kktSuf2} />
		<ol start="3">
			<li>
				<strong>Affinité des</strong> <KatexInline formula={String.raw`h_{j}`} /> (égalité, pas
				inégalité) :
			</li>
		</ol>
		<KatexBlock formula={kktSuf3} />
		<p>
			En ajoutant (1), (2), (3) et utilisant la <strong>stationnarité</strong>
			<KatexInline formula={String.raw`\nabla f_{0}(x) + \sum_{i} \lambda_{i} \nabla f_{i}(x) + \sum_{j} \nu_{j} \nabla h_{j}(x) = 0`} />,
			le terme en <KatexInline formula={String.raw`(\hat{x} - x)`} /> s'annule :
		</p>
		<KatexBlock formula={kktSufChain} />
		<p>
			pour <strong>tout</strong> <KatexInline formula={String.raw`\hat{x}`} /> faisable :
			<KatexInline formula="x" /> est optimal. ∎
		</p>

		<ExampleBlock number="5.2" title="Water-filling : les KKT comme algorithme">
			<p>Problème d'allocation de puissance (théorie de l'information, Boyd &amp; Vandenberghe, Exemple 5.2) :</p>
			<KatexBlock formula={waterfillProblem} />
			<p>
				On alloue une puissance totale 1 à <KatexInline formula="n" /> canaux de capacité
				<KatexInline formula={String.raw`\log(\alpha_{i} + x_{i})`} />. KKT (multiplicateurs
				<KatexInline formula={String.raw`\lambda_{i} \ge 0`} /> pour
				<KatexInline formula={String.raw`x_{i} \ge 0`} />, <KatexInline formula={String.raw`\nu`} /> libre
				pour la somme) : stationnarité
				<KatexInline formula={String.raw`-1/(\alpha_{i} + x_{i}) - \lambda_{i} + \nu = 0`} />,
				complémentarité <KatexInline formula={String.raw`\lambda_{i} x_{i} = 0`} />, faisabilité. On
				élimine <KatexInline formula={String.raw`\lambda_{i}`} /> (variable d'écart de la
				stationnarité) :
			</p>
			<KatexBlock formula={waterfillSolution} />
			<p>
				— le membre de gauche est une fonction <strong>croissante par morceaux</strong> de
				<KatexInline formula={String.raw`1/\nu^{*}`} /> (cassures aux
				<KatexInline formula={String.raw`\alpha_{i}`} />), donc <KatexInline formula={String.raw`\nu^{*}`} />{' '}
				est unique et se calcule facilement. Interprétation : les
				<KatexInline formula={String.raw`\alpha_{i}`} /> sont les niveaux du sol sur chaque parcelle ; on
				inonde de niveau <KatexInline formula={String.raw`1/\nu^{*}`} /> jusqu'à avoir déposé une
				quantité totale 1 d'eau ; la hauteur d'eau au-dessus de la parcelle i est
				<KatexInline formula={String.raw`x_{i}^{*}`} />.
			</p>
			<p>
				<strong>Le point pédagogique</strong> : la solution est une <strong>sommation de
				soft-threshold décalés</strong> — <KatexInline formula={String.raw`\max(0, \cdot)`} /> coordonnée
				par coordonnée, avec un niveau <KatexInline formula={String.raw`1/\nu^{*}`} /> commun —{' '}
				<em>exactement la même forme que le Lasso en colonnes orthonormales de la section 7</em>{' '}
				(<KatexInline formula={String.raw`\theta^{*} = S_{\lambda}(X^{\top} y)`} />) : les KKT, résolues
				explicitement, <strong>sont</strong> l'algorithme.
			</p>
		</ExampleBlock>

		<Callout type="warning" title="KKT lisses vs KKT non lisses">
			<p>
				Les KKT classiques exigent la différentiabilité. Quand l'objectif ou une contrainte n'est pas
				lisse (le Lasso : <KatexInline formula={String.raw`\lVert \theta \rVert_{1}`} />), la
				stationnarité devient une <strong>inclusion au sens du sous-différentiel</strong> —
				<KatexInline formula={String.raw`0 \in \nabla f_{0}(x^{*}) + \sum_{i} \lambda_{i} \nabla f_{i}(x^{*}) + \partial g(x^{*})`} /> —{' '}
				et tout le reste (faisabilité, complémentarité, suffisance convexe) reste valide. C'est
				exactement ce qui se passe pour le Lasso en section 7. Les KKT ne « cassent » pas en non lisse :
				elles s'élargissent.
			</p>
		</Callout>

		<!-- ========================================================= -->
		<!-- 6. FIL SVM                                                -->
		<!-- ========================================================= -->
		<h2 id="fil-svm">Fil A — la SVM : la dualité qui paie</h2>

		<p>
			Le problème SVM à marge rigide (forme standard <KatexInline formula={String.raw`y_{i} \in \{-1, +1\}`} />)
			est
		</p>
		<KatexBlock formula={svmPrimal} />
		<p>
			Chaque contrainte est <strong>affine</strong> en <KatexInline formula={String.raw`(w, b)`} /> —
			c'est la condition qui fait toute la différence. La lagrangienne (multiplicateurs
			<KatexInline formula={String.raw`\alpha_{i} \ge 0`} />) est
		</p>
		<KatexBlock formula={svmLagrangian} />
		<p>
			Minimiser en <KatexInline formula="w" /> : stationnarité
			<KatexInline formula={String.raw`w - \sum_{i} \alpha_{i} y_{i} x_{i} = 0`} /> ⟹
			<KatexInline formula={String.raw`w^{*} = \sum_{i} \alpha_{i} y_{i} x_{i}`} />. Minimiser en
			<KatexInline formula="b" /> : stationnarité
			<KatexInline formula={String.raw`-\sum_{i} \alpha_{i} y_{i} = 0`} /> — et si
			<KatexInline formula={String.raw`\sum_{i} \alpha_{i} y_{i} \neq 0`} />, la lagrangienne est
			<strong>non bornée inférieurement</strong> en <KatexInline formula="b" /> :
			<KatexInline formula={String.raw`g(\alpha) = -\infty`} />. C'est la <strong>contrainte
			cachée</strong> de la section 3 qui apparaît :
			<KatexInline formula={String.raw`\sum_{i} \alpha_{i} y_{i} = 0`} /> n'est nulle part dans la
			primale, elle émerge du domaine fini de <KatexInline formula="g" />. En substituant
			<KatexInline formula={String.raw`w^{*}`} /> dans <KatexInline formula="L" />, on obtient la
			<strong>duale</strong> (forme close, quadratique) :
		</p>
		<KatexBlock formula={svmDual} />
		<p>
			Tout est <strong>lisse</strong>, tout est <strong>close</strong> : la duale ne dépend des données
			que par les produits scalaires <KatexInline formula={String.raw`x_{i}^{\top} x_{j}`} /> (le « trick
			du noyau » de la Partie II s'applique donc à la duale, pas à la primale — c'est un avantage de
			calcul, pas une curiosité).
		</p>
		<p>
			<strong>Pourquoi « la dualité paie » ici</strong> : (1) la primale a
			<KatexInline formula={String.raw`n + 1`} /> variables et <KatexInline formula="n" /> contraintes
			couplées ; la duale a <KatexInline formula="n" /> variables avec une contrainte d'égalité
			<em>simple</em> et un box — structure idéale pour les solveurs QP et pour les algorithmes à
			coordonnées (SMO). (2) La duale est <strong>invariante par représentation</strong> : elle ne voit
			que le noyau. (3) Ses multiplicateurs <strong>sont la solution</strong> :
			<KatexInline formula={String.raw`w^{*} = \sum_{i} \alpha_{i} y_{i} x_{i}`} /> — la primale se lit
			dans la duale.
		</p>

		<p>
			<strong>Complémentarité et vecteurs support.</strong> Les KKT de la SVM (panneau de la leçon 4 de
			la Partie II pour la démonstration complète) incluent la complémentarité
			<KatexInline formula={String.raw`\alpha_{i}\, [y_{i} (w^{\top} x_{i} + b) - 1] = 0`} />. Lecture :
		</p>
		<ul>
			<li>
				<KatexInline formula={String.raw`\alpha_{i} > 0`} /> ⟹{' '}
				<KatexInline formula={String.raw`y_{i} (w^{\top} x_{i} + b) = 1`} /> — le point est{' '}
				<strong>sur la marge</strong> ;
			</li>
			<li>
				<KatexInline formula={String.raw`\alpha_{i} = 0`} /> — le point n'entre pas dans
				<KatexInline formula={String.raw`w^{*} = \sum \alpha_{i} y_{i} x_{i}`} />.
			</li>
		</ul>
		<p>
			Les seuls points qui construisent le classifieur sont ceux sur la marge : les
			<strong>vecteurs support</strong>. Dans la version à marge souple, la complémentarité s'enrichit en
			régimes : <KatexInline formula={String.raw`\alpha_{i} = 0`} /> (hors marge),
			<KatexInline formula={String.raw`0 < \alpha_{i} < C`} /> (sur la marge),
			<KatexInline formula={String.raw`\alpha_{i} = C`} /> (dans/contre la marge) —{' '}
			<strong>la parcimonie du classifieur est une conséquence directe d'une condition de
			complémentarité lisse</strong>. C'est le cas d'école où la dualité n'est pas un outil de
			certification mais l'algorithme lui-même.
		</p>

		<Callout type="note" title="À voir, pas à re-démontrer">
			<p>
				La démonstration complète de la duale SVM (marge rigide et souple, régimes des
				<KatexInline formula={String.raw`\alpha`} />, construction de <KatexInline formula="b" />, lien
				noyau) est au <strong>panneau de la leçon 4 de la Partie II</strong> — avec démonstration
				interactive des résidus KKT par coefficient. Cette section ne fait que montrer
				<em>où la machine générale de la leçon s'applique</em> : contraintes affines ⟹ duale close et
				exploitable.
			</p>
		</Callout>

		<InteractiveSection
			number="E.3"
			title="Les multiplicateurs α̂ᵢ et les conditions KKT (SVM)"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/SvmAlphaKktExplorer.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 7. FIL LASSO                                              -->
		<!-- ========================================================= -->
		<h2 id="fil-lasso">Fil B — le Lasso : la dualité moins exploitable</h2>

		<p>
			Le Lasso (Définition 5.2 de la Partie V) est
			<KatexInline formula={String.raw`\min_{\theta}\; \lVert y - X\theta \rVert_{2}^{2} + \lambda \lVert \theta \rVert_{1}`} />
			. On enseigne ici la forme équivalente (le facteur
			<KatexInline formula={String.raw`\tfrac{1}{2}`} /> est absorbé dans
			<KatexInline formula={String.raw`\lambda`} /> — même chemin de solutions) :
		</p>
		<KatexBlock formula={lassoPen} />
		<p>La forme <strong>contrainte</strong> (même chemin) est</p>
		<KatexBlock formula={lassoConstr} />
		<p>Comparons la contrainte du Lasso à celle de la SVM :</p>
		<div class="table-wrap">
			<table class="cmp-table">
				<thead>
					<tr>
						<th></th>
						<th>SVM (section 6)</th>
						<th>Lasso</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>contraintes</td>
						<td><KatexInline formula={String.raw`y_{i} (w^{\top} x_{i} + b) \ge 1`} /> — <strong>affines</strong></td>
						<td><KatexInline formula={String.raw`\lVert \theta \rVert_{1} \le t`} /> — <strong>norme, non lisse, non affine</strong></td>
					</tr>
					<tr>
						<td><KatexInline formula="g" /></td>
						<td>quadratique <strong>close</strong></td>
						<td><KatexInline formula={String.raw`p_{\mathrm{pen}}(\lambda) - \lambda t`} /> — <strong>pas de forme close</strong></td>
					</tr>
					<tr>
						<td>duale utile</td>
						<td>box + 1 égalité, lisse</td>
						<td>voir blocs 7.3–7.4</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3>La duale lagrangienne : concave, 1-D, mais coûteuse à évaluer</h3>

		<p>
			Lagrangienne de <KatexInline formula={String.raw`(P_{t})`} /> :
			<KatexInline formula={String.raw`L(\theta, \lambda) = \tfrac{1}{2}\, \lVert y - X\theta \rVert_{2}^{2} + \lambda (\lVert \theta \rVert_{1} - t)`} />
			, <KatexInline formula={String.raw`\lambda \ge 0`} />. La fonction duale est
		</p>
		<KatexBlock formula={lassoDualG} />
		<p>
			où <KatexInline formula={String.raw`p_{\mathrm{pen}}(\lambda)`} /> est la valeur optimale de
			<KatexInline formula={String.raw`(P_{\lambda})`} /> — <strong>le lasso pénalisé lui-même</strong>.
			Trois conséquences :
		</p>
		<ol>
			<li>
				<KatexInline formula={String.raw`p_{\mathrm{pen}}(\lambda)`} /> est <strong>concave</strong> en{' '}
				<KatexInline formula={String.raw`\lambda`} /> (infimum point par point de fonctions affines)
				⟹ <KatexInline formula="g" /> est <strong>concave</strong> ⟹
				<KatexInline formula={String.raw`\max_{\lambda \ge 0} g(\lambda)`} /> est une maximisation
				concave <strong>en une seule variable</strong> (section dorée, recherche ternaire).
			</li>
			<li>
				<strong>Pas de forme close</strong> : chaque évaluation de
				<KatexInline formula={String.raw`g(\lambda)`} /> coûte la résolution d'un lasso complet
				(descente de coordonnées, LARS, ISTA…). C'est le contraste exact avec la SVM : là,
				<KatexInline formula={String.raw`g(\alpha)`} /> se lit en une ligne ; ici,
				<KatexInline formula={String.raw`g(\lambda)`} /> <em>est</em> un sous-problème.
			</li>
			<li>
				<strong>Dualité forte tout de même</strong> : le problème est convexe et Slater tient —
				<KatexInline formula={String.raw`\theta = 0`} /> est strictement faisable dès
				<KatexInline formula={String.raw`t > 0`} /> (<KatexInline formula={String.raw`\lVert 0 \rVert_{1} = 0 < t`} />) —{' '}
				donc <KatexInline formula={String.raw`\max_{\lambda} g(\lambda) = p^{*}`} /> et le dual optimal
				est atteint (théorème de Slater, bloc 4.2). La duale est un <strong>certificat exact</strong>,
				pas une approximation.
			</li>
		</ol>
		<p>
			<strong>Vérification numérique</strong> (figée dans les tests unitaires) : sur plusieurs jeux
			<KatexInline formula={String.raw`(X, y, t)`} />,
			<KatexInline formula={String.raw`\max_{\lambda}\, [p_{\mathrm{pen}}(\lambda) - \lambda t]`} />{' '}
			égale la valeur primale à moins de <KatexInline formula={String.raw`10^{-6}`} /> (primale : descente
			de coordonnées exacte ; duale : section dorée).
		</p>

		<h3>La correspondance des chemins</h3>

		<p>
			<strong>Lemme (correspondance primale-contrainte / primale-pénalisée).</strong> Soit
			<KatexInline formula={String.raw`\theta(\lambda)`} /> une solution de
			<KatexInline formula={String.raw`(P_{\lambda})`} /> et
			<KatexInline formula={String.raw`t = \lVert \theta(\lambda) \rVert_{1}`} />. Alors
			<KatexInline formula={String.raw`\theta(\lambda)`} /> est une solution de
			<KatexInline formula={String.raw`(P_{t})`} />. Réciproquement, toute solution de
			<KatexInline formula={String.raw`(P_{t})`} /> dont la norme est strictement inférieure au maximum du
			chemin est solution de <KatexInline formula={String.raw`(P_{\lambda})`} /> pour un
			<KatexInline formula={String.raw`\lambda \ge 0`} />.
		</p>
		<p>
			<strong>Preuve (sens direct).</strong> Par dualité forte + atteinte (Slater),
			<KatexInline formula={String.raw`\theta(\lambda)`} /> satisfait les KKT de
			<KatexInline formula={String.raw`(P_{\lambda})`} /> — qui, en non lisse, sont l'
			<strong>inclusion</strong>
		</p>
		<KatexBlock formula={lassoIncl} />
		<p>
			c'est-à-dire <KatexInline formula={String.raw`X^{\top} (y - X\theta(\lambda)) = \lambda z`} /> avec{' '}
			<KatexInline formula={String.raw`z \in \partial \lVert \theta(\lambda) \rVert_{1}`} />. Les KKT de{' '}
			<KatexInline formula={String.raw`(P_{t})`} /> sont satisfaites en posant
			<KatexInline formula={String.raw`(\tilde{\theta}, \tilde{\lambda}, \tilde{z}) = (\theta(\lambda), \lambda, z)`} />
			— en particulier la complémentarité car
			<KatexInline formula={String.raw`\lambda \lVert \theta(\lambda) \rVert_{1} = \lambda t`} />. La
			suffisance des KKT convexes (bloc 5.3) donne l'optimalité pour
			<KatexInline formula={String.raw`(P_{t})`} />. ∎
		</p>
		<p>
			C'est le résultat standard « le lasso pénalisé et le lasso contraint tracent le même chemin »
			(Hastie–Tibshirani–Friedman, ESL 2e éd., §3.2 — référence secondaire ; la preuve ci-dessus n'utilise
			que la machine KKT de la section 5). <strong>Vérifié numériquement</strong> :
			<KatexInline formula={String.raw`\theta_{\mathrm{primal}}(t) = \theta_{\mathrm{pen}}(\lambda^{*})`} />{' '}
			à moins de <KatexInline formula={String.raw`10^{-4}`} /> et complémentarité
			<KatexInline formula={String.raw`\lambda^{*} (t - \lVert \theta_{\mathrm{primal}} \rVert_{1}) \approx 0`} />.
		</p>

		<h3>La duale Fenchel du lasso pénalisé</h3>

		<p>
			Une autre porte s'ouvre : écrire <KatexInline formula={String.raw`(P_{\lambda})`} /> sous la forme{' '}
			<KatexInline formula={String.raw`\min_{\theta}\, f(X\theta) + g(\theta)`} /> avec
			<KatexInline formula={String.raw`f(z) = \tfrac{1}{2}\, \lVert y - z \rVert_{2}^{2}`} /> et
			<KatexInline formula={String.raw`g(\theta) = \lambda \lVert \theta \rVert_{1}`} />, et utiliser la{' '}
			<strong>duale de Fenchel</strong> (théorème de minimax de Sion, bloc 4.4). Deux briques : la
			conjugée de <KatexInline formula={String.raw`g = \lambda \lVert \cdot \rVert_{1}`} /> est
			l'indicatrice de la <strong>boule duale</strong> —
			<KatexInline formula={String.raw`g^{*}(u) = 0`} /> si <KatexInline formula={String.raw`\lVert u \rVert_{\infty} \le \lambda`} />,{' '}
			<KatexInline formula={String.raw`+\infty`} /> sinon (conjugée d'une norme = indicatrice de la boule
			de la norme duale, Boyd &amp; Vandenberghe, Exemple 3.26) ; et la minimisation de
			<KatexInline formula={String.raw`f(X\theta) + u^{\top} \theta`} /> se résout par stationnarité
			<KatexInline formula={String.raw`X^{\top} X \theta = X^{\top} y - u`} /> (rang entier en colonnes
			supposé). On obtient la duale Fenchel
		</p>
		<KatexBlock formula={lassoFenchel} />
		<p>
			où <KatexInline formula={String.raw`P_{X} = X (X^{\top} X)^{-1} X^{\top}`} /> est la projection
			orthogonale sur le column space de <KatexInline formula="X" /> et
			<KatexInline formula="d" /> est le nombre de paramètres.
		</p>
		<p>
			<strong>Propriétés (toutes vérifiées numériquement, figées en tests)</strong> :
			<strong>dualité forte</strong> —
			<KatexInline formula={String.raw`\max\, (D_{\lambda}) = \min\, (P_{\lambda})`} /> à la précision
			machine ; <strong>lien primal–dual</strong> — si
			<KatexInline formula={String.raw`\theta^{*}`} /> et <KatexInline formula={String.raw`u^{*}`} /> sont
			optimaux, alors <KatexInline formula={String.raw`u^{*} = X^{\top} (y - X\theta^{*})`} /> ; et en
			dimension 1 (<KatexInline formula={String.raw`X = 1`} />),
			<KatexInline formula={String.raw`(D_{\lambda})`} /> se réduit à
			<KatexInline formula={String.raw`\max_{|u| \le \lambda}\, u y - \tfrac{1}{2} u^{2}`} />, dont le
			maximum est <KatexInline formula={String.raw`u^{*} = \operatorname{clip}(y, -\lambda, \lambda)`} />.
		</p>

		<h3>KKT du Lasso et origine de la parcimonie</h3>

		<p>
			Les KKT de <KatexInline formula={String.raw`(P_{\lambda})`} /> (non lisses — bloc 5.5) sont
			<KatexInline formula={String.raw`0 \in -\, X^{\top} (y - X\theta^{*}) + \lambda\, \partial \lVert \theta^{*} \rVert_{1}`} />,
			soit coordonnée par coordonnée :
		</p>
		<KatexBlock formula={lassoKkt} />
		<p>
			<strong>C'est cette seconde ligne qui produit la parcimonie</strong> : une coordonnée s'annule dès
			que son gradient résiduel n'atteint pas le seuil <KatexInline formula={String.raw`\lambda`} /> — il
			n'y a pas de raison de la « payer » au prix
			<KatexInline formula={String.raw`\lambda`} /> par unité de norme L1. En colonnes orthonormales
			(<KatexInline formula={String.raw`X^{\top} X = I`} />), l'inclusion se résout explicitement :
			<KatexInline formula={String.raw`\theta^{*} = S_{\lambda} (X^{\top} y)`} /> — le
			<strong>soft-thresholding</strong> (leçon « méthodes proximales »), et la parcimonie est
			littéralement le « trou » de <KatexInline formula={String.raw`S_{\lambda}`} /> en 0. En général,
			l'inclusion définit <KatexInline formula={String.raw`\theta^{*}`} /> sans forme close — c'est là que
			les méthodes proximales (ISTA/FISTA) prennent le relais : elles itèrent exactement cette
			condition de point fixe.
		</p>
		<p>
			<strong>Le contraste, formulé</strong> : <strong>SVM</strong> — contraintes affines ⟹ duale close,
			lisse, à structure de box ; les KKT sont des équations ; la parcimonie (vecteurs support) est une{' '}
			<strong>conséquence lisible</strong> de la complémentarité. <strong>Lasso</strong> — contrainte de
			norme non lisse et non affine ⟹ la duale lagrangienne n'a <strong>pas de forme close</strong>
			(chaque évaluation coûte un lasso) ; la duale Fenchel est lisse mais vit en dimension
			<KatexInline formula="d" /> avec <KatexInline formula={String.raw`(X^{\top} X)^{-1}`} />, et la{' '}
			<strong>parcimonie n'apparaît dans aucune duale</strong> — elle est un fait <em>primal</em>, produit
			par le sous-différentiel <KatexInline formula={String.raw`\partial |\cdot|(0) = [-1, 1]`} />. La
			dualité sert de <strong>certificat</strong> (gap nul, valeurs, sensibilité) — pas d'algorithme de
			sélection.
		</p>

		<Callout type="insight" title="Sensibilité du lasso : ce que λ* mesure">
			<p>
				D'après l'analyse de sensibilité (bloc 4.5) : si
				<KatexInline formula={String.raw`p^{*}(t)`} /> (valeur optimale de
				<KatexInline formula={String.raw`(P_{t})`} />) est différentiable en
				<KatexInline formula="t" />, alors <KatexInline formula={String.raw`\lambda^{*} = -\, dp^{*}/dt`} />
				— le multiplicateur optimal dit de combien la perte
				<KatexInline formula={String.raw`\tfrac{1}{2}\, \lVert y - X\theta \rVert^{2}`} /> diminue quand
				on autorise une unité de norme L1 supplémentaire. Sur le chemin du lasso,
				<KatexInline formula={String.raw`\lambda^{*}`} /> décroît avec
				<KatexInline formula="t" /> : au début du chemin (petit
				<KatexInline formula="t" />), chaque unité de
				<KatexInline formula={String.raw`\lVert \theta \rVert_{1}`} /> « achète » beaucoup de perte ;
				plus loin, moins. C'est la lecture économique du paramètre d'hyper-régularisation.
			</p>
		</Callout>

		<InteractiveSection
			number="E.4"
			title="Lasso : primale et duale"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LassoPrimalDualDemo.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 8. GAP STRICT                                             -->
		<!-- ========================================================= -->
		<h2 id="gap-strict">Quand la dualité forte échoue (et quand elle ne la fait pas)</h2>

		<p>
			La preuve de séparation (bloc 4.3) utilise la convexité (pour que
			<KatexInline formula="A" /> soit convexe) et Slater (pour l'hyperplan non vertical). Retirer l'une
			ou l'autre <strong>peut</strong> ouvrir un <strong>gap de dualité strict</strong>{' '}
			<KatexInline formula={String.raw`p^{*} - d^{*} > 0`} /> — mais attention : retirer la convexité
			seule ne le garantit <strong>pas</strong>. Trois cas :
		</p>
		<ol>
			<li>
				<strong>Non convexe</strong> (bloc 8.2) : gap <strong>nul</strong> — la non-convexité ne
				suffit pas à ouvrir un gap (le « piège »).
			</li>
			<li>
				<strong>Convexe mais sans Slater</strong> (bloc 8.3) : l'exercice 5.21 de Boyd &amp;
				Vandenberghe — <strong>gap = 1</strong> ; déjà traité au panneau de la leçon 1 — renvoi, pas
				re-démonstration.
			</li>
			<li>
				<strong>Primale non bornée</strong> (bloc 8.4) :
				<KatexInline formula={String.raw`p^{*} = d^{*} = -\infty`} /> — pas de gap au sens d'un écart
				fini.
			</li>
		</ol>

		<ExampleBlock number="8.1" title="Le piège : non convexe, gap nul">
			<KatexBlock formula={trapProblem} />
			<ul>
				<li>
					<strong>Primale</strong> : l'ensemble faisable est
					<KatexInline formula={String.raw`\{x \le -1\} \cup \{x \ge 1\}`} /> (non convexe). Le piège :
					on est tenté de prendre le « point du bord le plus proche »,
					<KatexInline formula={String.raw`x = 1`} /> — mais <strong>
					<KatexInline formula={String.raw`x = 2`} /> est faisable</strong>{' '}
					(<KatexInline formula={String.raw`2^{2} = 4 \ge 1`} />) et c'est le minimiseur de
					<KatexInline formula={String.raw`(x-2)^{2}`} /> sur tout
					<KatexInline formula={String.raw`\mathbb{R}`} /> :
					<KatexInline formula={String.raw`p^{*} = 0`} />,
					<KatexInline formula={String.raw`x^{*} = 2`} />. La contrainte est
					<strong>inactive</strong> en <KatexInline formula={String.raw`x^{*}`} />
					(<KatexInline formula={String.raw`1 - 2^{2} = -3 < 0`} />).
				</li>
				<li>
					<strong>Lagrangienne</strong> :
					<KatexInline formula={String.raw`L(x, \lambda) = (x-2)^{2} + \lambda (1 - x^{2})`} />
					, <KatexInline formula={String.raw`\lambda \ge 0`} />.
				</li>
			</ul>
			<p><strong>Fonction duale</strong> (forme close) :</p>
			<KatexBlock formula={trapDual} />
			<ul>
				<li>
					<strong>Duale</strong> : <KatexInline formula="g" /> est <strong>décroissante</strong> sur{' '}
					<KatexInline formula={String.raw`[0, 1)`} />
					(<KatexInline formula={String.raw`g(0) = 0`} />,
					<KatexInline formula={String.raw`g(0.2) = -0.8`} />), donc
					<KatexInline formula={String.raw`d^{*} = \sup g = g(0) = 0`} />.
				</li>
				<li>
					<strong>Gap</strong> : <KatexInline formula={String.raw`p^{*} - d^{*} = 0`} /> —{' '}
					<strong>nul, malgré la contrainte non convexe</strong>. KKT satisfaite en
					<KatexInline formula={String.raw`(x^{*} = 2, \lambda^{*} = 0)`} /> (stationnarité
					<KatexInline formula={String.raw`2(x-2) - 2\lambda x = 0`} />, complémentarité
					<KatexInline formula={String.raw`\lambda (1 - x^{2}) = 0`} />).
				</li>
			</ul>
			<p>
				<strong>Lecture</strong> : l'ensemble faisable déconnecté n'empêche pas la duale de
				« rattraper » la primale : le point dual optimal
				<KatexInline formula={String.raw`\lambda^{*} = 0`} /> donne
				<KatexInline formula={String.raw`g(0) = \inf (x-2)^{2} = 0 = p^{*}`} />. Ce dont la preuve de
				séparation a besoin est d'une <strong>condition de qualification</strong>, pas de la convexité
				de l'ensemble faisable en soi.
			</p>
		</ExampleBlock>

		<h3>Le gap strict : convexe sans Slater</h3>

		<p>
			L'exercice 5.21 de Boyd &amp; Vandenberghe (<strong>déjà traité au panneau de la leçon 1</strong>{' '}
			— renvoi, pas re-démonstration) :
			<KatexInline formula={String.raw`\min e^{-x}`} /> s.t.
			<KatexInline formula={String.raw`x^{2}/y \le 0,\ y > 0`} />. Problème <strong>convexe</strong>, mais{' '}
			<strong>Slater échoue</strong> (<KatexInline formula={String.raw`x^{2}/y < 0`} /> est impossible —
			pas de point strictement faisable) : <KatexInline formula={String.raw`p^{*} = 1`} />
			(<strong>atteinte</strong> — la contrainte force <KatexInline formula={String.raw`x = 0`} />),
			fonction duale <KatexInline formula={String.raw`g \equiv 0`} />, donc
			<KatexInline formula={String.raw`d^{*} = 0`} />, <strong>gap = 1</strong>. C'est l'exemple qui
			montre : c'est l'<strong>échec de la condition de qualification</strong> — pas la non-convexité —
			qui ouvre un gap strict.
		</p>

		<ExampleBlock number="8.2" title="Primale non bornée : p* = d* = −∞">
			<KatexBlock formula={unboundedProblem} />
			<p>
				<KatexInline formula={String.raw`p^{*} = -\infty`} />
				(<KatexInline formula={String.raw`x \to -\infty`} /> est faisable et fait descendre
				<KatexInline formula="x" />). La lagrangienne
				<KatexInline formula={String.raw`L(x, \lambda) = x + \lambda (1 - x^{2})`} /> est non bornée
				inférieurement en <KatexInline formula="x" /> pour <strong>tout</strong>{' '}
				<KatexInline formula={String.raw`\lambda \ge 0`} /> (affine pour
				<KatexInline formula={String.raw`\lambda = 0`} />, quadratique non bornée pour
				<KatexInline formula={String.raw`\lambda > 0`} />) :
				<KatexInline formula={String.raw`g \equiv -\infty`} />,
				<KatexInline formula={String.raw`d^{*} = -\infty`} />. Les deux valeurs s'effondrent ensemble —
				c'est le cas « <KatexInline formula={String.raw`p^{*} = -\infty \Longrightarrow d^{*} = -\infty`} /> »{' '}
				de la dualité faible (bloc 3.4) : il n'y a pas d'écart fini à mesurer.
			</p>
		</ExampleBlock>

		<InteractiveSection
			number="E.5"
			title="Le piège : non convexe, gap nul"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/DualityGap2D.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 9. SYNTHÈSE                                               -->
		<!-- ========================================================= -->
		<h2 id="synthese">Synthèse et limites</h2>

		<div class="table-wrap">
			<table class="cmp-table synth-table">
				<thead>
					<tr>
						<th>Question</th>
						<th>Réponse</th>
						<th>Où</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Que vaut <KatexInline formula={String.raw`g(\lambda, \nu)`} /> ?</td>
						<td>Une borne inférieure de <KatexInline formula={String.raw`p^{*}`} />, toujours
						(<KatexInline formula={String.raw`d^{*} \le p^{*}`} />)</td>
						<td>§3, dualité faible</td>
					</tr>
					<tr>
						<td>Quand <KatexInline formula={String.raw`d^{*} = p^{*}`} /> ?</td>
						<td>Convexe + Slater (et dual atteint si <KatexInline formula={String.raw`d^{*} > -\infty`} />)</td>
						<td>§4, bloc 4.2</td>
					</tr>
					<tr>
						<td>Preuve de <KatexInline formula={String.raw`d^{*} = p^{*}`} /> ?</td>
						<td>Séparation de <KatexInline formula="A" /> et <KatexInline formula={String.raw`(0, 0, p^{*})`} />, hyperplan non vertical</td>
						<td>§4, séparation</td>
					</tr>
					<tr>
						<td>Quand les KKT suffisent-elles ?</td>
						<td>Toujours, si convexe + différentiable</td>
						<td>§5, bloc 5.1</td>
					</tr>
					<tr>
						<td>Quand les KKT sont-elles nécessaires ?</td>
						<td>Convexe + différentiable + Slater</td>
						<td>§5, bloc 5.1</td>
					</tr>
					<tr>
						<td>SVM : duale close ?</td>
						<td>Oui — contraintes affines</td>
						<td>§6</td>
					</tr>
					<tr>
						<td>Lasso : duale close ?</td>
						<td>Non — <KatexInline formula={String.raw`g(\lambda) = p_{\mathrm{pen}}(\lambda) - \lambda t`} />, pas de forme close</td>
						<td>§7</td>
					</tr>
					<tr>
						<td>Lasso : dualité forte ?</td>
						<td>Oui — Slater (<KatexInline formula={String.raw`\theta = 0`} />, <KatexInline formula={String.raw`t > 0`} />)</td>
						<td>§7</td>
					</tr>
					<tr>
						<td>Lasso : d'où vient la parcimonie ?</td>
						<td>Du sous-différentiel <KatexInline formula={String.raw`\partial |\cdot|(0)`} /> — primal, pas dual</td>
						<td>§7</td>
					</tr>
					<tr>
						<td>La non-convexité ouvre-t-elle un gap ?</td>
						<td>Non — le piège a gap 0 malgré <KatexInline formula={String.raw`x^{2} \ge 1`} /></td>
						<td>§8, bloc 8.1</td>
					</tr>
					<tr>
						<td>Gap strict possible ?</td>
						<td>Oui : convexe sans Slater (gap 1, panneau leçon 1) ; primale non bornée ⟹ <KatexInline formula={String.raw`p^{*} = d^{*} = -\infty`} /></td>
						<td>§8, blocs 8.2–8.3</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3>Limites et suites</h3>

		<ul>
			<li>
				<strong>Ce que la dualité ne donne pas</strong> : un algorithme primal-duale complet (méthodes
				primal-duales, ADMM en version générale) — objet de la leçon « méthodes proximales » (l'ADMM y
				est présenté comme éclatement de variables avec multiplicateur, c'est-à-dire une dualité
				lagrangienne <em>itérée</em>).
			</li>
			<li>
				<strong>Quand la duale est dégénérée</strong> : si le dual optimal n'est pas atteint
				(<KatexInline formula={String.raw`d^{*}`} /> non fini ou non atteint — possible hors Slater), le
				certificat s'affaiblit : on a une borne, pas de multiplicateurs optimaux, donc pas de KKT ni de
				sensibilité.
			</li>
			<li>
				<strong>Outre la machine lagrangienne</strong> : la dualité Fenchel (utilisée au bloc 7.4) est
				une autre machine — <KatexInline formula={String.raw`\min f + g`} /> s'écrit
				<KatexInline formula={String.raw`\max -f^{*} - g^{*}`} /> — qui couvre les problèmes sans
				contraintes explicites ; la leçon « méthodes proximales » en donne la version algorithmique
				(Moreau, Douglas–Rachford).
			</li>
		</ul>

		<InteractiveSection
			number="E.6"
			title="Quiz — dualité et conditions KKT"
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
			authors={['Boyd, S.', 'Vandenberghe, L.']}
			year={2004}
			title="Convex Optimization"
			journal="Cambridge University Press — ch. 5 (eq. (5.1)–(5.58), Ex. 5.1–5.2, ex. 5.21), §8.6 (eq. (8.20)–(8.25)), §3.3.1 (Ex. 3.26)."
			link="https://web.stanford.edu/~boyd/cvxbook/"
		/>

		<BibElement
			authors={['Nocedal, J.', 'Wright, S.']}
			year={2006}
			title="Numerical Optimization"
			journal="2e éd., SIAM — ch. 12."
		/>

		<BibElement
			authors={['Vapnik, V.']}
			year={1998}
			title="The Nature of Statistical Learning Theory"
			journal="Springer."
		/>

		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning"
			journal="2e éd., Springer — §3.2, §12.2."
			link="https://hastie.su.domains/ElemStatLearn/"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.table-wrap {
		overflow-x: auto;
		margin: 0.75rem 0;
	}

	.cmp-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	.cmp-table th,
	.cmp-table td {
		border: 1px solid var(--color-border);
		padding: 0.5rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}

	.cmp-table thead th {
		background: var(--color-surface-2, transparent);
		font-weight: 600;
	}

	.cmp-table tbody tr:nth-child(even) {
		background: color-mix(in srgb, var(--color-surface-2) 50%, transparent);
	}

	.synth-table td:first-child {
		font-weight: 500;
		white-space: nowrap;
	}
</style>
