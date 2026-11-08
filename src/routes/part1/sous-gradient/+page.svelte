<script lang="ts">
	/*
	 * Expert lesson « Introduction au sous-gradient » (Part I).
	 *
	 * Content boundary (internal note, not learner-facing): subderivatives,
	 * subgradients, the optimality rule 0 ∈ ∂f and the subgradient method are
	 * NOT in course_sources/ (grep-verified). Anchors in the sources:
	 *  - course_sources/typst/optim.typ, Exemple 2.8 (Lasso: ‖w‖₁ convexe, non
	 *    différentiable) ;
	 *  - course_sources/typst/regularization.typ, Définition 5.2 (Lasso
	 *    ‖y − Xθ‖² + λ‖θ‖₁, no ½ ⇒ orthonormal threshold λ/2).
	 * Every result below is attributed in the prose to the primary literature
	 * (Rockafellar 1970; Boyd et al., EE364b notes; Nesterov 2004;
	 * Tibshirani 1996; Hastie et al. 2009) — see
	 * expert/part1/lessons/sous-gradient-introduction.research.md.
	 * All numbers come from src/lib/math/subgradient.ts (tested).
	 */
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
	import Quiz from '$lib/components/narrative/Quiz.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import { getQuizQuestions } from '$lib/quiz';

	const meta = getPageByPath('/part1/sous-gradient');
	const tracker = createPageTracker(meta as PageMeta);
	const quiz = getQuizQuestions('p1/sous-gradient');
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
		{ id: 'pourquoi', label: 'Pourquoi ?', description: 'Quand ∇f = 0 ne veut plus rien dire', color: 'epistemic' },
		{ id: 'sous-derivee', label: 'La sous-dérivée', description: 'Une fonction d’une variable', color: 'belief' },
		{ id: 'sous-gradient', label: 'Le sous-gradient', description: 'Passage à ℝᵈ et règle de Fermat', color: 'belief' },
		{ id: 'lasso-orthonormal', label: 'Le Lasso orthonormal', description: 'Seuillage doux par 0 ∈ ∂F', color: 'positive' },
		{ id: 'methode', label: 'La méthode du sous-gradient', description: 'Un algorithme simple mais lent', color: 'agent' },
		{ id: 'exercices', label: 'Exercices', description: 'Calculer des sous-différentiels', color: 'neutral' },
		{ id: 'synthese', label: 'Synthèse et quiz', description: 'Ce qu’il faut retenir', color: 'epistemic' }
	];

	// ── 1. Motivation ──
	const absNoDeriv = String.raw`\frac{|h| - |0|}{h} = \operatorname{sign}(h) \xrightarrow[h \to 0^\pm]{} \pm 1`;
	const lassoGeneric = String.raw`F(w) = \tfrac{1}{2}\|y - Xw\|^2 + \lambda \|w\|_1, \qquad \|w\|_1 = \sum_{j=1}^d |w_j|`;

	// ── 2. Sous-dérivée ──
	const subderivIneq = String.raw`f(y) \;\ge\; f(x) + c\,(y - x) \qquad \text{pour tout } y \in \mathbb{R}`;
	const oneSided = String.raw`f'_-(x) = \lim_{h \to 0^+} \frac{f(x) - f(x-h)}{h}, \qquad f'_+(x) = \lim_{h \to 0^+} \frac{f(x+h) - f(x)}{h}`;
	const subdiffInterval = String.raw`\partial f(x) = \big[\, f'_-(x),\; f'_+(x) \,\big]`;
	const proofRight = String.raw`y > x : \quad \frac{f(y) - f(x)}{y - x} \ge c \;\; \xrightarrow[y \downarrow x]{} \;\; f'_+(x) \ge c`;
	const proofLeft = String.raw`y < x : \quad \frac{f(x) - f(y)}{x - y} \le c \;\; \xrightarrow[y \uparrow x]{} \;\; f'_-(x) \le c`;
	const absSub = String.raw`\partial |\cdot|(x) = \begin{cases} \{-1\} & x < 0 \\ [-1,\, 1] & x = 0 \\ \{+1\} & x > 0 \end{cases}`;

	// ── 3. Sous-gradient ──
	const subgradIneq = String.raw`f(y) \;\ge\; f(x) + \langle g,\, y - x \rangle \qquad \text{pour tout } y \in \mathbb{R}^d`;
	const sumRule = String.raw`\partial (f_1 + f_2)(x) = \partial f_1(x) + \partial f_2(x) = \{\, g_1 + g_2 : g_1 \in \partial f_1(x),\ g_2 \in \partial f_2(x) \,\}`;
	const sepRule = String.raw`f(w) = \sum_{j=1}^d f_j(w_j) \;\Longrightarrow\; \partial f(w) = \partial f_1(w_1) \times \cdots \times \partial f_d(w_d)`;
	const l1Sub = String.raw`\partial \|w\|_1 = \Big\{ g \in \mathbb{R}^d : \; g_j = \operatorname{sign}(w_j) \text{ si } w_j \neq 0, \;\; g_j \in [-1, 1] \text{ si } w_j = 0 \Big\}`;
	const l1Example = String.raw`\partial \|\cdot\|_1(2,\, 0,\, -3) = \{\, (1,\, s,\, -1) : s \in [-1, 1] \,\}`;
	const fermat = String.raw`x^\star \in \arg\min_{x \in \mathbb{R}^d} f(x) \quad \Longleftrightarrow \quad 0 \in \partial f(x^\star)`;
	const fermatProof = String.raw`0 \in \partial f(x^\star) \iff \forall y,\; f(y) \ge f(x^\star) + \langle 0,\, y - x^\star \rangle = f(x^\star)`;

	// ── Règles de dérivation (rappels) et leurs analogues ──
	const ruleLinear = String.raw`(\alpha f + \beta g)'(x) = \alpha f'(x) + \beta g'(x), \qquad \nabla(\alpha f + \beta g) = \alpha \nabla f + \beta \nabla g`;
	const ruleChain = String.raw`(g \circ f)'(x) = g'\big(f(x)\big)\, f'(x), \qquad \nabla_x\, g\big(h(x)\big) = g'\big(h(x)\big)\, \nabla h(x)`;
	const ruleChainAffine = String.raw`h(x) = f(Ax + b) \;\Longrightarrow\; \nabla h(x) = A^\top \nabla f(Ax + b)`;
	const ruleLeibniz = String.raw`(fg)'(x) = f'(x)\, g(x) + f(x)\, g'(x), \qquad (fg)^{(k)} = \sum_{j=0}^{k} \binom{k}{j} f^{(j)} g^{(k-j)}`;
	const subLinear = String.raw`\alpha, \beta \ge 0 \;\Longrightarrow\; \partial(\alpha f_1 + \beta f_2)(x) = \alpha\, \partial f_1(x) + \beta\, \partial f_2(x)`;
	const subAffine = String.raw`h(x) = f(Ax + b) \;\Longrightarrow\; \partial h(x) = A^\top \partial f(Ax + b) = \{\, A^\top g : g \in \partial f(Ax + b) \,\}`;
	const subAffineProof = String.raw`h(y) = f(Ay + b) \;\ge\; f(Ax + b) + \langle g,\, A(y - x) \rangle = h(x) + \langle A^\top g,\, y - x \rangle`;
	const hingeModel = String.raw`\ell(w) = \max\big(0,\, 1 - y\, w^\top x\big) = h\big(y\, x^\top w\big), \qquad h(t) = \max(0,\, 1 - t)`;
	const hingeModelSub = String.raw`\partial \ell(w) = y\, x\; \partial h\big(y\, w^\top x\big) = \begin{cases} \{-y\, x\} & y\, w^\top x < 1 \\ \{-s\, y\, x : s \in [0, 1]\} & y\, w^\top x = 1 \\ \{0\} & y\, w^\top x > 1 \end{cases}`;
	const productCounter = String.raw`f(x) = x,\quad g(x) = x^2 \ \text{(convexes)} \qquad\Longrightarrow\qquad (fg)(x) = x^3 \ \text{(non convexe)}`;

	// ── 4. Lasso orthonormal ──
	const lassoOrthoPb = String.raw`\min_{w \in \mathbb{R}^d} \; F(w) = \tfrac{1}{2}\|y - Xw\|^2 + \lambda \|w\|_1, \qquad X^\top X = I_d,\; \lambda \ge 0`;
	const expand = String.raw`\tfrac{1}{2}\|y - Xw\|^2 = \tfrac{1}{2}\|y\|^2 - \langle w,\, X^\top y \rangle + \tfrac{1}{2} w^\top \underbrace{X^\top X}_{= I_d} w = \tfrac{1}{2}\|w - z\|^2 + \tfrac{1}{2}\big(\|y\|^2 - \|z\|^2\big)`;
	const zDef = String.raw`z = X^\top y = (X^\top X)^{-1} X^\top y = \hat w^{\mathrm{MCO}}`;
	const separated = String.raw`F(w) = \sum_{j=1}^d \Big[ \tfrac{1}{2}(w_j - z_j)^2 + \lambda |w_j| \Big] + \text{cste}`;
	const phi = String.raw`\varphi(w) = \tfrac{1}{2}(w - z)^2 + \lambda |w|, \qquad \partial \varphi(w) = w - z + \lambda\, \partial|\cdot|(w)`;
	const caseA = String.raw`w > 0 : \quad 0 = w - z + \lambda \iff w = z - \lambda, \quad \text{cohérent ssi } z > \lambda`;
	const caseB = String.raw`w < 0 : \quad 0 = w - z - \lambda \iff w = z + \lambda, \quad \text{cohérent ssi } z < -\lambda`;
	const caseC = String.raw`w = 0 : \quad 0 \in -z + \lambda[-1, 1] \iff |z| \le \lambda`;
	const softThr = String.raw`\hat w_j = S(z_j, \lambda) = \operatorname{sign}(z_j)\, \max\big(|z_j| - \lambda,\; 0\big) = \begin{cases} z_j - \lambda & z_j > \lambda \\ 0 & |z_j| \le \lambda \\ z_j + \lambda & z_j < -\lambda \end{cases}`;
	const ridgeOrtho = String.raw`\min_w \tfrac{1}{2}\|y - Xw\|^2 + \tfrac{\lambda}{2}\|w\|^2 \quad \Longrightarrow \quad \hat w_j^{\mathrm{Ridge}} = \frac{z_j}{1 + \lambda}`;
	const convention = String.raw`\|y - Xw\|^2 + \lambda\|w\|_1 = 2\Big[ \tfrac{1}{2}\|y - Xw\|^2 + \tfrac{\lambda}{2}\|w\|_1 \Big] \quad \Longrightarrow \quad \text{seuil } \tfrac{\lambda}{2}`;

	// ── 5. Méthode du sous-gradient ──
	const sgStep = String.raw`w_{k+1} = w_k - t_k\, g_k, \qquad g_k \in \partial f(w_k), \quad t_k > 0`;
	const notDescentF = String.raw`f(w) = |w_1| + 2|w_2|, \qquad w = (1, 0), \qquad g = (1, 2) \in \partial f(w) = \{1\} \times [-2, 2]`;
	const notDescentVal = String.raw`f(w - t g) = |1 - t| + 2\,|{-2t}| = 1 + 3t > f(w) \qquad (0 < t < 1)`;
	const fBest = String.raw`f_{\mathrm{best}}^{(k)} = \min_{0 \le i \le k} f(w_i)`;
	const sgBound = String.raw`f_{\mathrm{best}}^{(k)} - f^\star \;\le\; \frac{R^2 + G^2 \sum_{i=0}^{k-1} t_i^2}{2 \sum_{i=0}^{k-1} t_i}`;
	const sgRate = String.raw`t_i = \frac{R}{G\sqrt{k}} \;\; (0 \le i < k) \quad \Longrightarrow \quad f_{\mathrm{best}}^{(k)} - f^\star \le \frac{R\,G}{\sqrt{k}}`;

	// ── Exercices ──
	const hinge = String.raw`h(x) = \max(0,\, 1 - x)`;
	const hingeSol = String.raw`\partial h(x) = \begin{cases} \{-1\} & x < 1 \\ [-1,\, 0] & x = 1 \\ \{0\} & x > 1 \end{cases}`;
	const ex2w = String.raw`w = (0,\, -2,\, 0.5)`;
	const ex2Sol = String.raw`\partial \|\cdot\|_1(w) = \{\, (s,\, -1,\, 1) : s \in [-1, 1] \,\}`;
	const ex3z = String.raw`z = X^\top y = (3,\; -0.5,\; 1.2), \qquad \lambda = 1`;
	const ex3Sol = String.raw`\hat w = \big(S(3, 1),\; S(-0.5, 1),\; S(1.2, 1)\big) = (2,\; 0,\; 0.2)`;
	const ex3SolBis = String.raw`\big(S(3, \tfrac12),\; S(-0.5, \tfrac12),\; S(1.2, \tfrac12)\big) = (2.5,\; 0,\; 0.7)`;
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Introduction au sous-gradient'}
	subtitle="Sous-dérivée, sous-gradient, règle de Fermat et seuillage doux du Lasso orthonormal"
	prev={prevMeta}
	next={nextMeta}
>
	<TableOfContents entries={tocEntries} />

	<!-- ========================================================= -->
	<!-- 1. POURQUOI                                               -->
	<!-- ========================================================= -->
	<TheorySection>
		<h2 id="pourquoi">Pourquoi ? Quand ∇f = 0 ne veut plus rien dire</h2>

		<p>
			Toute la Partie I s'est appuyée sur la différentiabilité : la condition nécessaire du premier
			ordre (Théorème 1.3, Partie I, leçon 1) demande <KatexInline formula={String.raw`\nabla f(x^\star) = 0`} />,
			et la descente de gradient (leçon 3) avance dans la direction <KatexInline formula={String.raw`-\nabla f`} />.
			Mais la fonction convexe la plus simple qui soit, <KatexInline formula={String.raw`f(x) = |x|`} />, n'a
			pas de dérivée en son minimum :
		</p>
		<KatexBlock formula={absNoDeriv} />
		<p>
			Les taux d'accroissement à gauche et à droite ne coïncident pas : il y a un « coin ». Ce n'est pas
			une curiosité : la pénalité du Lasso,
		</p>
		<KatexBlock formula={lassoGeneric} />
		<p>
			est convexe mais <strong>non différentiable</strong> dès qu'une coordonnée <KatexInline formula="w_j" />
			est nulle, et ce sont précisément ces points qui nous intéressent, puisque le Lasso est utilisé pour
			produire des coefficients exactement nuls. Il faut donc une notion qui remplace la dérivée aux coins
			et une condition d'optimalité qui remplace <KatexInline formula={String.raw`\nabla f = 0`} />.
		</p>

		<Callout type="intuition" title="L'idée en une phrase">
			<p>
				Pour une fonction convexe dérivable, la tangente reste <em>sous</em> le graphe. En un coin, il n'y a
				plus une tangente, mais tout un éventail de droites qui restent sous le graphe : leurs pentes
				forment le <strong>sous-différentiel</strong>.
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 2. SOUS-DÉRIVÉE                                           -->
	<!-- ========================================================= -->
	<TheorySection>
		<h2 id="sous-derivee">La sous-dérivée (une variable)</h2>

		<h3>Rappels : trois règles de dérivation</h3>
		<p>
			Avant de remplacer la dérivée, rappelons les trois règles qui permettent de la
			<em>calculer</em> sans revenir à la définition par taux d'accroissement. On verra plus loin
			(section suivante) lesquelles survivent quand la fonction a des coins.
		</p>
		<TheoremBlock title="Règles de dérivation (rappels)">
			<ol>
				<li>
					<strong>Linéarité.</strong> Pour <KatexInline formula="f, g" /> dérivables et
					<KatexInline formula={String.raw`\alpha, \beta \in \mathbb{R}`} /> :
					<KatexBlock formula={ruleLinear} />
				</li>
				<li>
					<strong>Composition (règle de la chaîne).</strong> Pour <KatexInline formula="f" />,
					<KatexInline formula="g" />, <KatexInline formula="h" /> dérivables (<KatexInline
						formula={String.raw`h : \mathbb{R}^d \to \mathbb{R}`}
					/>) :
					<KatexBlock formula={ruleChain} />
					<span>Cas particulier le plus utile en apprentissage, la composition avec une application affine :</span>
					<KatexBlock formula={ruleChainAffine} />
				</li>
				<li>
					<strong>Produit (formule de Leibniz).</strong> Pour <KatexInline formula="f, g" /> dérivables
					(resp. <KatexInline formula="k" /> fois dérivables) :
					<KatexBlock formula={ruleLeibniz} />
				</li>
			</ol>
		</TheoremBlock>
		<p>
			Toutes trois supposent la dérivabilité <em>en chaque point</em>. Elles tombent en défaut dès que
			l'une des fonctions a un coin au point considéré — c'est exactement la situation de
			<KatexInline formula={String.raw`|x|`} /> en 0.
		</p>

		<DefinitionBlock number="E.1" title="Sous-dérivée, sous-différentiel">
			<p>
				Soit <KatexInline formula={String.raw`f : \mathbb{R} \to \mathbb{R}`} /> convexe et
				<KatexInline formula={String.raw`x \in \mathbb{R}`} />. Un réel <KatexInline formula="c" /> est une
				<strong>sous-dérivée</strong> de <KatexInline formula="f" /> en <KatexInline formula="x" /> si
			</p>
			<KatexBlock formula={subderivIneq} />
			<p>
				L'ensemble des sous-dérivées en <KatexInline formula="x" /> est le <strong>sous-différentiel</strong>
				<KatexInline formula={String.raw`\partial f(x)`} />.
			</p>
		</DefinitionBlock>

		<p>
			Géométriquement, <KatexInline formula={String.raw`c \in \partial f(x)`} /> signifie que la droite de
			pente <KatexInline formula="c" /> passant par <KatexInline formula={String.raw`(x, f(x))`} /> reste
			partout sous le graphe de <KatexInline formula="f" /> : c'est une <em>droite d'appui</em>. Le résultat
			suivant relie cette définition globale aux dérivées à gauche et à droite.
		</p>

		<TheoremBlock number="E.2" title="Proposition — sous-différentiel en dimension 1">
			<p>
				Si <KatexInline formula={String.raw`f : \mathbb{R} \to \mathbb{R}`} /> est convexe, les dérivées
				à gauche et à droite
			</p>
			<KatexBlock formula={oneSided} />
			<p>
				existent en tout point, vérifient <KatexInline formula={String.raw`f'_-(x) \le f'_+(x)`} />, et
			</p>
			<KatexBlock formula={subdiffInterval} />
			<p>
				En particulier <KatexInline formula={String.raw`\partial f(x)`} /> est un intervalle fermé non vide,
				réduit au singleton <KatexInline formula={String.raw`\{f'(x)\}`} /> exactement quand
				<KatexInline formula="f" /> est dérivable en <KatexInline formula="x" /> (Rockafellar, 1970).
			</p>
		</TheoremBlock>

		<Callout type="proof" title="Preuve de l'inclusion ⊂ (la réciproque est admise)">
			<p>
				Soit <KatexInline formula={String.raw`c \in \partial f(x)`} />. On divise l'inégalité de la
				définition par <KatexInline formula="y - x" />, en distinguant son signe :
			</p>
			<KatexBlock formula={proofRight} />
			<KatexBlock formula={proofLeft} />
			<p>
				donc <KatexInline formula={String.raw`f'_-(x) \le c \le f'_+(x)`} />. L'inclusion réciproque repose
				sur la croissance des pentes d'une fonction convexe ; nous l'admettons.
			</p>
		</Callout>

		<ExampleBlock number="E.3" title="Quatre fonctions de référence">
			<ul>
				<li>
					<strong>Valeur absolue.</strong> <KatexBlock formula={absSub} />
				</li>
				<li>
					<strong>ReLU</strong> <KatexInline formula={String.raw`\max(0, x)`} /> :
					<KatexInline formula={String.raw`\{0\}`} /> pour <KatexInline formula="x<0" />,
					<KatexInline formula="[0, 1]" /> en <KatexInline formula="0" />,
					<KatexInline formula={String.raw`\{1\}`} /> pour <KatexInline formula="x>0" />.
				</li>
				<li>
					<strong>Charnière</strong> <KatexInline formula={String.raw`\max(0, 1 - x)`} /> (perte de la SVM,
					Partie II, leçon 4) : le coin est en <KatexInline formula="x = 1" />, avec
					<KatexInline formula={String.raw`\partial f(1) = [-1, 0]`} />.
				</li>
				<li>
					<strong>Carré</strong> <KatexInline formula="x^2" /> : dérivable partout, donc
					<KatexInline formula={String.raw`\partial f(x) = \{2x\}`} /> ; aucune autre pente ne convient.
				</li>
			</ul>
		</ExampleBlock>

		<InteractiveSection number="2.1" title="Droites d'appui et sous-dérivées" onInteract={tracker.trackInteraction}>
			<DeferredDemo
				load={() => import('$lib/components/demos/SubderivativeExplorer.svelte')}
			/>
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 3. SOUS-GRADIENT                                          -->
	<!-- ========================================================= -->
	<TheorySection>
		<h2 id="sous-gradient">Le sous-gradient (plusieurs variables)</h2>

		<p>
			En dimension <KatexInline formula="d" />, la pente devient un vecteur et la droite d'appui un
			hyperplan d'appui. La définition est la même, avec un produit scalaire.
		</p>

		<DefinitionBlock number="E.4" title="Sous-gradient">
			<p>
				Soit <KatexInline formula={String.raw`f : \mathbb{R}^d \to \mathbb{R}`} /> convexe. Un vecteur
				<KatexInline formula={String.raw`g \in \mathbb{R}^d`} /> est un <strong>sous-gradient</strong> de
				<KatexInline formula="f" /> en <KatexInline formula="x" /> si
			</p>
			<KatexBlock formula={subgradIneq} />
			<p>
				L'ensemble des sous-gradients en <KatexInline formula="x" /> est le sous-différentiel
				<KatexInline formula={String.raw`\partial f(x) \subset \mathbb{R}^d`} />.
			</p>
		</DefinitionBlock>

		<TheoremBlock number="E.5" title="Proposition — propriétés et règles de calcul">
			<p>
				Soient <KatexInline formula={String.raw`f, f_1, f_2 : \mathbb{R}^d \to \mathbb{R}`} /> convexes.
			</p>
			<ol>
				<li>
					<KatexInline formula={String.raw`\partial f(x)`} /> est un ensemble <strong>non vide, convexe et
					compact</strong> ; si <KatexInline formula="f" /> est différentiable en <KatexInline formula="x" />,
					alors <KatexInline formula={String.raw`\partial f(x) = \{\nabla f(x)\}`} />.
				</li>
				<li>
					<strong>Homogénéité :</strong> pour <KatexInline formula={String.raw`\alpha > 0`} />,
					<KatexInline formula={String.raw`\partial(\alpha f)(x) = \alpha\, \partial f(x)`} />.
				</li>
				<li>
					<strong>Somme :</strong> <KatexBlock formula={sumRule} />
				</li>
				<li>
					<strong>Fonctions séparables :</strong> <KatexBlock formula={sepRule} />
				</li>
			</ol>
			<p>
				(Boyd et al., notes « Subgradients », §2–3 ; voir aussi Rockafellar, 1970.)
			</p>
		</TheoremBlock>

		<Callout type="proof" title="Preuve des points 2 et 4">
			<p>
				<strong>Point 2.</strong> On multiplie l'inégalité de la définition par
				<KatexInline formula={String.raw`\alpha > 0`} /> (et par <KatexInline formula={String.raw`1/\alpha`} /> pour
				l'inclusion inverse).
			</p>
			<p>
				<strong>Point 4, inclusion ⊃.</strong> Si <KatexInline formula={String.raw`g_j \in \partial f_j(w_j)`} />
				pour tout <KatexInline formula="j" />, on somme les <KatexInline formula="d" /> inégalités
				<KatexInline formula={String.raw`f_j(v_j) \ge f_j(w_j) + g_j(v_j - w_j)`} />.
				<strong>Inclusion ⊂.</strong> Si <KatexInline formula={String.raw`g \in \partial f(w)`} />, on applique la
				définition à un point <KatexInline formula="v" /> qui ne diffère de <KatexInline formula="w" /> que par sa
				<KatexInline formula="j" />-ième coordonnée : tous les autres termes se simplifient et il reste
				<KatexInline formula={String.raw`f_j(v_j) \ge f_j(w_j) + g_j(v_j - w_j)`} />, c'est-à-dire
				<KatexInline formula={String.raw`g_j \in \partial f_j(w_j)`} />.
			</p>
		</Callout>

		<h3>Que deviennent les règles de dérivation ?</h3>
		<p>
			Reprenons les trois règles rappelées au début de la section 2. Quand toutes les fonctions sont
			dérivables, <KatexInline formula={String.raw`\partial f(x) = \{\nabla f(x)\}`} /> (point 1
			ci-dessus) et l'on retrouve les règles classiques. Aux coins, en revanche, le bilan est contrasté.
		</p>
		<ul>
			<li>
				<strong>Linéarité : oui, mais seulement à coefficients positifs.</strong> Les points 2 et 3
				donnent
				<KatexBlock formula={subLinear} />
				<span
					>Un coefficient négatif est exclu : <KatexInline formula={String.raw`-|x|`} /> n'est plus convexe,
					et aucune droite ne reste sous son graphe en 0 (l'inégalité de la Définition E.1 imposerait
					à la fois <KatexInline formula={String.raw`c \le -1`} /> et <KatexInline
						formula={String.raw`c \ge 1`}
					/>).</span
				>
			</li>
			<li>
				<strong>Composition : oui avec une application affine.</strong> Pour
				<KatexInline formula="f" /> convexe, <KatexInline
					formula={String.raw`A \in \mathbb{R}^{m \times d}`}
				/> et <KatexInline formula={String.raw`b \in \mathbb{R}^m`} /> (Boyd et al., notes « Subgradients
				», §3.3) :
				<KatexBlock formula={subAffine} />
				<span
					>L'inclusion <KatexInline formula={String.raw`\supset`} /> se vérifie en une ligne : si
					<KatexInline formula={String.raw`g \in \partial f(Ax + b)`} />, alors pour tout
					<KatexInline formula="y" /></span
				>
				<KatexBlock formula={subAffineProof} />
				<span
					>donc <KatexInline formula={String.raw`A^\top g \in \partial h(x)`} /> ; l'inclusion réciproque
					est admise. Pour une fonction intérieure non affine, la règle de la chaîne ne se transpose pas
					telle quelle : elle demande des hypothèses supplémentaires que nous n'abordons pas ici.</span
				>
			</li>
			<li>
				<strong>Produit : pas d'analogue.</strong> Le produit de deux fonctions convexes n'est en général
				pas convexe :
				<KatexBlock formula={productCounter} />
				<span
					>Le sous-différentiel de <KatexInline formula="fg" /> n'a donc même pas de sens dans le cadre convexe
					de cette leçon, et il n'existe pas de « formule de Leibniz » pour les sous-gradients.</span
				>
			</li>
		</ul>

		<ExampleBlock title="Perte charnière d'un classifieur linéaire">
			<p>
				Pour une observation <KatexInline formula={String.raw`(x, y)`} />, <KatexInline
					formula={String.raw`y \in \{-1, +1\}`}
				/>, la perte de la SVM (Partie II, leçon 4) est une composition affine :
			</p>
			<KatexBlock formula={hingeModel} />
			<p>
				avec <KatexInline formula={String.raw`A = y\, x^\top`} /> (une ligne) et <KatexInline formula="b = 0" />.
				La règle de composition affine et le sous-différentiel de <KatexInline formula="h" /> (Exemple
				E.3, ou Exercice 1) donnent
			</p>
			<KatexBlock formula={hingeModelSub} />
			<p>
				Les points bien classés avec une marge suffisante ne contribuent pas ; ceux qui sont exactement
				sur la marge contribuent par tout un segment de sous-gradients.
			</p>
		</ExampleBlock>

		<ExampleBlock number="E.6" title="Le sous-différentiel de la norme ℓ₁">
			<p>
				Comme <KatexInline formula={String.raw`\|w\|_1 = \sum_j |w_j|`} /> est séparable, le point 4 et
				l'Exemple E.3 donnent
			</p>
			<KatexBlock formula={l1Sub} />
			<p>Par exemple :</p>
			<KatexBlock formula={l1Example} />
			<p>
				Le sous-différentiel n'est « gros » que dans les directions où la coordonnée est nulle ; c'est là
				que se joue la parcimonie.
			</p>
		</ExampleBlock>

		<p>Voici enfin le résultat qui remplace la condition du premier ordre.</p>

		<TheoremBlock number="E.7" title="Règle de Fermat">
			<p>
				Soit <KatexInline formula={String.raw`f : \mathbb{R}^d \to \mathbb{R}`} /> convexe. Alors
			</p>
			<KatexBlock formula={fermat} />
		</TheoremBlock>

		<Callout type="proof" title="Preuve">
			<p>Il suffit de lire la définition avec <KatexInline formula="g = 0" /> :</p>
			<KatexBlock formula={fermatProof} />
			<p>ce qui est exactement la définition d'un minimiseur global.</p>
		</Callout>

		<Callout type="insight" title="Ce que dit (et ne dit pas) la règle de Fermat">
			<p>
				Si <KatexInline formula="f" /> est différentiable, <KatexInline formula={String.raw`\partial f(x^\star) = \{\nabla f(x^\star)\}`} />
				et l'on retrouve <KatexInline formula={String.raw`\nabla f(x^\star) = 0`} /> ; pour une fonction
				convexe, c'est alors une condition <em>nécessaire et suffisante</em>. En un coin, en revanche, il
				suffit que <KatexInline formula="0" /> soit <em>l'une</em> des pentes admissibles, une condition
				beaucoup moins exigeante. C'est pour cela que les minimiseurs de fonctions non lisses se logent
				volontiers dans les coins.
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 4. LASSO ORTHONORMAL                                      -->
	<!-- ========================================================= -->
	<TheorySection>
		<h2 id="lasso-orthonormal">Cas particulier : le Lasso à covariables orthonormales</h2>

		<p>
			Appliquons la règle de Fermat au Lasso dans le cas où les colonnes de la matrice de design sont
			orthonormales :
		</p>
		<KatexBlock formula={lassoOrthoPb} />
		<p>
			(L'hypothèse <KatexInline formula={String.raw`X^\top X = I_d`} /> impose <KatexInline formula={String.raw`d \le n`} />.)
			Ce cas, déjà traité par Tibshirani (1996), se résout entièrement à la main.
		</p>

		<h3>Étape 1 — le problème se découple</h3>
		<p>On développe le carré en utilisant <KatexInline formula={String.raw`X^\top X = I_d`} /> :</p>
		<KatexBlock formula={expand} />
		<p>où</p>
		<KatexBlock formula={zDef} />
		<p>
			est l'estimateur des moindres carrés ordinaires (Partie IV, leçon 1). Le second terme ne dépend
			pas de <KatexInline formula="w" />, et la norme <KatexInline formula={String.raw`\ell_1`} /> est
			elle aussi une somme sur les coordonnées :
		</p>
		<KatexBlock formula={separated} />
		<p>
			Minimiser <KatexInline formula="F" /> revient donc à minimiser, <em>séparément</em> pour chaque
			<KatexInline formula="j" />, une fonction d'une seule variable.
		</p>

		<h3>Étape 2 — la règle de Fermat en dimension 1</h3>
		<p>
			Fixons <KatexInline formula="j" /> et notons <KatexInline formula="z = z_j" />. Par la règle de la
			somme (le terme quadratique est dérivable),
		</p>
		<KatexBlock formula={phi} />
		<p>
			La fonction <KatexInline formula={String.raw`\varphi`} /> est strictement convexe, donc a un unique
			minimiseur, caractérisé par <KatexInline formula={String.raw`0 \in \partial \varphi(w)`} />. On
			distingue trois cas selon le signe de <KatexInline formula="w" /> :
		</p>
		<KatexBlock formula={caseA} />
		<KatexBlock formula={caseB} />
		<KatexBlock formula={caseC} />
		<p>
			Les trois conditions sur <KatexInline formula="z" /> sont disjointes et couvrent
			<KatexInline formula={String.raw`\mathbb{R}`} /> : pour chaque <KatexInline formula="z" />, exactement
			un cas est cohérent.
		</p>

		<TheoremBlock number="E.8" title="Lasso orthonormal : seuillage doux">
			<p>
				Si <KatexInline formula={String.raw`X^\top X = I_d`} />, l'unique solution du Lasso
				<KatexInline formula={String.raw`\min_w \tfrac12\|y - Xw\|^2 + \lambda\|w\|_1`} /> est, coordonnée par
				coordonnée,
			</p>
			<KatexBlock formula={softThr} />
			<p>
				où <KatexInline formula={String.raw`z = X^\top y = \hat w^{\mathrm{MCO}}`} />
				(Tibshirani, 1996, §2.2, qui l'établit pour la forme contrainte du Lasso ; Hastie et al., 2009, éq. (3.52) et Table 3.4, pour la forme pénalisée ci-dessus).
			</p>
		</TheoremBlock>

		<Callout type="insight" title="Lecture : d'où viennent les zéros">
			<p>
				Une coordonnée est <strong>exactement nulle</strong> si et seulement si
				<KatexInline formula={String.raw`|z_j| \le \lambda`} />, c'est-à-dire si <KatexInline formula="0" />
				appartient au segment <KatexInline formula={String.raw`-z_j + \lambda[-1, 1]`} /> : le « gros »
				sous-différentiel de <KatexInline formula={String.raw`|\cdot|`} /> en <KatexInline formula="0" />
				absorbe le gradient du terme quadratique. Les autres coordonnées sont décalées de
				<KatexInline formula={String.raw`\lambda`} /> vers zéro. Comparez avec la Ridge, dont l'objectif est
				dérivable :
			</p>
			<KatexBlock formula={ridgeOrtho} />
			<p>
				La Ridge <em>multiplie</em> par un facteur <KatexInline formula={String.raw`1/(1+\lambda) > 0`} /> et
				n'annule donc jamais une coordonnée non nulle.
			</p>
		</Callout>

		<Callout type="warning" title="Attention à la convention de normalisation">
			<p>
				Le seuil dépend du facteur devant le terme quadratique. Avec l'écriture sans
				<KatexInline formula={String.raw`\tfrac12`} /> (celle de la Partie V, leçon 4),
			</p>
			<KatexBlock formula={convention} />
			<p>
				et le seuil devient <KatexInline formula={String.raw`\lambda/2`} />. Avec
				<KatexInline formula={String.raw`\tfrac{1}{2n}\|y - Xw\|^2`} /> (Partie I, leçon 2), il faut
				<KatexInline formula={String.raw`X^\top X = n I_d`} /> pour retrouver le seuil
				<KatexInline formula={String.raw`\lambda`} />. La forme
				<KatexInline formula={String.raw`\operatorname{sign}(z)\max(|z| - \text{seuil}, 0)`} />, elle, ne change pas.
			</p>
		</Callout>

		<p>
			Ce calcul éclaire aussi la descente par coordonnées pour le Lasso (Partie I, leçon 4) : chaque mise à
			jour minimise <KatexInline formula="F" /> en une seule coordonnée, ce qui est exactement un problème
			de la forme <KatexInline formula={String.raw`\varphi`} />, d'où le seuillage doux à chaque pas,
			même quand <KatexInline formula="X" /> n'est pas orthonormale.
		</p>

		<InteractiveSection number="4.1" title="Lire la solution sur le graphe de ∂F" onInteract={tracker.trackInteraction}>
			<DeferredDemo
				load={() => import('$lib/components/demos/LassoOrthoSubdiffDemo.svelte')}
			/>
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 5. MÉTHODE DU SOUS-GRADIENT                               -->
	<!-- ========================================================= -->
	<TheorySection>
		<h2 id="methode">La méthode du sous-gradient (aperçu)</h2>

		<p>
			Quand aucune formule fermée n'est disponible, l'idée la plus simple consiste à remplacer le gradient
			par un sous-gradient quelconque dans la descente de gradient :
		</p>

		<DefinitionBlock number="E.9" title="Méthode du sous-gradient">
			<KatexBlock formula={sgStep} />
		</DefinitionBlock>

		<p>
			Cette ressemblance est trompeuse : <strong>ce n'est pas une méthode de descente</strong>. En un coin,
			l'opposé d'un sous-gradient peut faire monter la fonction, quel que soit le pas :
		</p>
		<KatexBlock formula={notDescentF} />
		<KatexBlock formula={notDescentVal} />
		<p>
			On suit donc la meilleure valeur rencontrée,
			<KatexInline formula={fBest} />, plutôt que la dernière.
		</p>

		<TheoremBlock number="E.10" title="Garantie de convergence (admise)">
			<p>
				Soit <KatexInline formula="f" /> convexe, admettant un minimiseur <KatexInline formula={String.raw`w^\star`} />,
				avec des sous-gradients bornés (<KatexInline formula={String.raw`\|g\| \le G`} />) et
				<KatexInline formula={String.raw`\|w_0 - w^\star\| \le R`} />. Après <KatexInline formula="k" /> pas,
			</p>
			<KatexBlock formula={sgBound} />
			<p>
				(Boyd & Park, notes « Subgradient Methods », §3.2–3.3 ; voir aussi Nesterov, 2004.) En particulier :
			</p>
			<ul>
				<li>
					à pas constant <KatexInline formula={String.raw`t_i = t`} />, la borne tend vers
					<KatexInline formula={String.raw`G^2 t / 2`} /> : on n'atteint qu'un voisinage de l'optimum ;
				</li>
				<li>
					si <KatexInline formula={String.raw`t_i \to 0`} /> et <KatexInline formula={String.raw`\sum_i t_i = \infty`} />
					(par exemple <KatexInline formula={String.raw`t_i = t_0/\sqrt{i+1}`} />), la borne tend vers
					<KatexInline formula="0" /> ;
				</li>
				<li>à horizon <KatexInline formula="k" /> fixé, le meilleur pas constant donne <KatexBlock formula={sgRate} /></li>
			</ul>
		</TheoremBlock>

		<p>
			Un taux en <KatexInline formula={String.raw`O(1/\sqrt{k})`} /> est lent : pour gagner un facteur 10
			sur la précision, il faut 100 fois plus d'itérations, quand la descente de gradient sur une fonction
			lisse converge en <KatexInline formula={String.raw`O(1/k)`} /> (Théorème 3.4, Partie I, leçon 3).
			C'est le prix de la généralité : la méthode n'utilise qu'un sous-gradient à chaque pas, rien de la
			structure du problème.
		</p>

		<InteractiveSection number="5.1" title="Pas constant ou pas décroissant ?" onInteract={tracker.trackInteraction}>
			<DeferredDemo
				load={() => import('$lib/components/demos/SubgradientMethodDemo.svelte')}
			/>
		</InteractiveSection>

		<Callout type="note" title="Et ensuite ?">
			<p>
				Pour le Lasso, on peut faire beaucoup mieux en <em>exploitant</em> la structure « lisse + ℓ₁ » :
				c'est l'objet des méthodes proximales (leçon suivante), dont l'opérateur central est précisément le
				seuillage doux obtenu au Théorème E.8.
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 6. EXERCICES                                              -->
	<!-- ========================================================= -->
	<TheorySection>
		<h2 id="exercices">Exercices</h2>

		<ExercisePanel title="Exercice 1 — la perte charnière">
			<p>
				Calculer le sous-différentiel de <KatexInline formula={hinge} /> en tout point, puis en déduire
				l'ensemble de ses minimiseurs grâce à la règle de Fermat.
			</p>
			{#snippet solution()}
				<p>
					Dérivées à gauche et à droite (Proposition E.2) : <KatexBlock formula={hingeSol} />
					On a <KatexInline formula={String.raw`0 \in \partial h(x)`} /> si et seulement si
					<KatexInline formula={String.raw`x \ge 1`} /> : tous les points de
					<KatexInline formula={String.raw`[1, +\infty[`} /> sont des minimiseurs (de valeur
					<KatexInline formula="0" />). Le minimiseur d'une fonction convexe n'est pas forcément unique.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel title="Exercice 2 — sous-gradients de la norme ℓ₁">
			<p>
				Soit <KatexInline formula={ex2w} />. Décrire <KatexInline formula={String.raw`\partial\|\cdot\|_1(w)`} />.
				Les vecteurs <KatexInline formula="(0.3, -1, 1)" /> et <KatexInline formula="(1.2, -1, 1)" /> sont-ils
				des sous-gradients de <KatexInline formula={String.raw`\|\cdot\|_1`} /> en <KatexInline formula="w" /> ?
			</p>
			{#snippet solution()}
				<p>
					Par l'Exemple E.6 : <KatexBlock formula={ex2Sol} />
					Le premier vecteur convient (<KatexInline formula={String.raw`s = 0.3 \in [-1, 1]`} />), pas le
					second (<KatexInline formula="1.2 > 1" />). On le vérifie directement avec
					<KatexInline formula={String.raw`v = (1, -2, 0.5)`} /> :
					<KatexInline formula={String.raw`\|v\|_1 = 3.5 < \|w\|_1 + 1.2 \times 1 = 3.7`} />, ce qui viole
					l'inégalité du sous-gradient.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel title="Exercice 3 — un Lasso orthonormal à la main">
			<p>
				On suppose <KatexInline formula={String.raw`X^\top X = I_3`} /> et
				<KatexInline formula={ex3z} />.
			</p>
			<ol>
				<li>
					Calculer la solution de <KatexInline formula={String.raw`\min_w \tfrac12\|y - Xw\|^2 + \lambda\|w\|_1`} />.
					Quelles variables sont sélectionnées ?
				</li>
				<li>À partir de quelle valeur de <KatexInline formula={String.raw`\lambda`} /> la solution est-elle nulle ?</li>
				<li>
					Même question 1 pour l'objectif <KatexInline formula={String.raw`\|y - Xw\|^2 + \lambda\|w\|_1`} />,
					toujours avec <KatexInline formula={String.raw`\lambda = 1`} />.
				</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						Théorème E.8 : <KatexBlock formula={ex3Sol} /> Les variables 1 et 3 sont sélectionnées ; la
						variable 2 est éliminée car <KatexInline formula={String.raw`|{-0.5}| \le 1`} />.
					</li>
					<li>
						<KatexInline formula={String.raw`\hat w = 0`} /> si et seulement si
						<KatexInline formula={String.raw`\lambda \ge \max_j |z_j| = 3`} />.
					</li>
					<li>
						Le seuil devient <KatexInline formula={String.raw`\lambda/2 = 0.5`} /> :
						<KatexBlock formula={ex3SolBis} />
						La variable 2 est encore éliminée, mais tout juste
						(<KatexInline formula={String.raw`|z_2| = 0.5`} /> est exactement le seuil).
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 7. SYNTHÈSE + QUIZ                                        -->
	<!-- ========================================================= -->
	<TheorySection>
		<h2 id="synthese">Synthèse</h2>

		<Callout type="summary" title="À retenir">
			<ol>
				<li>
					Une <strong>sous-dérivée</strong> (un <strong>sous-gradient</strong> en dimension
					<KatexInline formula="d" />) est la pente d'une droite (d'un hyperplan) d'appui :
					<KatexInline formula={String.raw`f(y) \ge f(x) + \langle g, y - x\rangle`} /> pour tout
					<KatexInline formula="y" />.
				</li>
				<li>
					En dimension 1, <KatexInline formula={String.raw`\partial f(x) = [f'_-(x), f'_+(x)]`} /> ; il se
					réduit à <KatexInline formula={String.raw`\{\nabla f(x)\}`} /> là où <KatexInline formula="f" /> est
					différentiable.
				</li>
				<li>
					<KatexInline formula={String.raw`\partial|\cdot|(0) = [-1, 1]`} />, et
					<KatexInline formula={String.raw`\partial\|w\|_1`} /> se calcule coordonnée par coordonnée.
				</li>
				<li>
					<strong>Règle de Fermat :</strong> pour <KatexInline formula="f" /> convexe,
					<KatexInline formula={String.raw`x^\star`} /> est un minimiseur si et seulement si
					<KatexInline formula={String.raw`0 \in \partial f(x^\star)`} />.
				</li>
				<li>
					Lasso orthonormal : <KatexInline formula={String.raw`\hat w_j = \operatorname{sign}(z_j)\max(|z_j| - \lambda, 0)`} />
					avec <KatexInline formula={String.raw`z = X^\top y`} /> ; les zéros viennent du
					« gros » sous-différentiel en <KatexInline formula="0" />. Le seuil dépend de la normalisation
					(<KatexInline formula={String.raw`\lambda`} /> avec le <KatexInline formula={String.raw`\tfrac12`} />,
					<KatexInline formula={String.raw`\lambda/2`} /> sans).
				</li>
				<li>
					La méthode du sous-gradient n'est pas une méthode de descente ; avec des pas décroissants, elle
					converge en <KatexInline formula={String.raw`O(1/\sqrt{k})`} /> sur la meilleure valeur.
				</li>
			</ol>
		</Callout>

		<InteractiveSection number="7.1" title="Quiz — sous-gradient et Lasso" onInteract={tracker.trackInteraction}>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors="Rockafellar, R. T."
			year={1970}
			title="Convex Analysis"
			journal="Princeton University Press"
		/>
		<BibElement
			authors={['Boyd, S.', 'Duchi, J.', 'Pilanci, M.', 'Vandenberghe, L.']}
			year={2022}
			title="Subgradients"
			journal="Notes de cours EE364b, Stanford University"
			link="https://web.stanford.edu/class/ee364b/lectures/subgradients_notes.pdf"
		/>
		<BibElement
			authors={['Boyd, S.', 'Park, J.']}
			year={2014}
			title="Subgradient Methods"
			journal="Notes de cours EE364b, Stanford University"
			link="https://web.stanford.edu/class/ee364b/lectures/subgrad_method_notes.pdf"
		/>
		<BibElement
			authors="Nesterov, Y."
			year={2004}
			title="Introductory Lectures on Convex Optimization: A Basic Course"
			journal="Kluwer Academic Publishers"
		/>
		<BibElement
			authors="Tibshirani, R."
			year={1996}
			title="Regression Shrinkage and Selection via the Lasso"
			journal="Journal of the Royal Statistical Society, Series B, 58(1), 267–288"
			link="https://doi.org/10.1111/j.2517-6161.1996.tb02080.x"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning (2e éd.)"
			journal="Springer, §3.4 et Table 3.4"
			link="https://doi.org/10.1007/978-0-387-84858-7"
		/>
	</Bibliography>
</PageTemplate>
