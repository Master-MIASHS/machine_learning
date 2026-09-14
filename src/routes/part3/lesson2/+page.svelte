<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import Quiz from '$lib/components/narrative/Quiz.svelte';
	import { getQuizQuestions } from '$lib/quiz';
	import KMeansLloydAnimator from '$lib/components/demos/KMeansLloydAnimator.svelte';
	import KMeansRestartsDemo from '$lib/components/demos/KMeansRestartsDemo.svelte';
	import ElbowCriterionDemo from '$lib/components/demos/ElbowCriterionDemo.svelte';
	import OutlierDetectionDemo from '$lib/components/demos/OutlierDetectionDemo.svelte';
	import ClusterShapeDemo from '$lib/components/demos/ClusterShapeDemo.svelte';
	import InternalEvaluationDemo from '$lib/components/demos/InternalEvaluationDemo.svelte';
	import KMeansPPGuaranteeDemo from '$lib/components/demos/KMeansPPGuaranteeDemo.svelte';
	import { asset, resolve } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part3/lesson2');
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
			id: 'fixer-k',
			label: 'Fixer K : le problème',
			description: "Minimiser l'inertie intra-classes ; pourquoi une heuristique",
			color: 'epistemic'
		},
		{
			id: 'lloyd',
			label: 'Algorithme de Lloyd',
			description: 'Initialisation, affectation, recalcul, convergence',
			color: 'belief'
		},
		{
			id: 'convergence',
			label: 'Convergence et minima locaux',
			description: 'Proposition (lemme 22.1, UML) ; redémarrages',
			color: 'agent'
		},
		{
			id: 'choix-k',
			label: 'Choix de K : critère du coude',
			description: "L'inertie diminue forcément quand K augmente",
			color: 'surprise'
		},
		{
			id: 'complexite',
			label: 'Complexité algorithmique',
			description: 'O(ndKt) : linéaire en n',
			color: 'neutral'
		},
		{
			id: 'outliers',
			label: 'Données aberrantes',
			description: 'Clusters singletons, détection, K-médoïdes',
			color: 'surprise'
		},
		{
			id: 'forme',
			label: 'Forme des clusters',
			description: 'Cellules de Voronoï convexes ; anneaux ; astuce du noyau',
			color: 'positive'
		},
		{
			id: 'evaluation',
			label: "Évaluation d'un clustering",
			description: 'Stabilité, évaluation externe et interne',
			color: 'epistemic'
		},
		{
			id: 'quiz',
			label: 'Quiz',
			description: 'Vérifier sa compréhension',
			color: 'epistemic'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──
	// Sources : frames « Principe », « Algorithme de Lloyd », « Répétition de la
	// procédure » et « Complexité algorithmique » de
	// marine/Cours/CM/coursClassif-5-Clustering.tex.

	const dataPoints = String.raw`x_1, \dots, x_n`;
	const muInit = String.raw`\mu_1, \dots, \mu_K`;
	const xi = 'x_i';
	const inertiaSum = String.raw`\sum_{k=1}^{K} \sum_{x \in \mathcal{C}_k} \| x - \mu_k \|^2`;
	const objectiveFormula = String.raw`\mathcal{C}^* = \underset{\mathcal{C}_1, \dots, \mathcal{C}_K}{\text{arg}\, \min} \sum_{k=1}^{K} \sum_{x \in \mathcal{C}_k} \| x - \mu_k \|^2`;
	const assignmentFormula = String.raw`k(x_i) = \underset{k=1, \dots, K}{\text{arg}\, \min} \| x_i - \mu_k \|^2`;
	const recalcFormula = String.raw`\mu_k = \dfrac{1}{\left| \mathcal{C}_k \right|} \sum_{x_i \in \mathcal{C}_k} x_i`;
	const lloydComplexity = String.raw`O(ndKt)`;
	const cahComplexity = String.raw`O(dn^2)`;
	const lambdaN = String.raw`K = \lambda n`;

	// ── Formules du panneau expert « k-means++ : une initialisation avec garantie »
	// (au-delà du cours — voir expert/part3/lesson2/kmeanspp-garantie.md et
	// kmeanspp-garantie.research.md ; sources primaires : Arthur & Vassilvitskii,
	// SODA 2007 ; Bahmani et al., PVLDB 2012 ; Makarychev et al., NeurIPS 2020). ──
	const phiDef = String.raw`\phi(C) = \sum_{x \in X} \min_{c \in C} \| x - c \|^2`;
	const phiOptDef = String.raw`\varphi_{\mathrm{OPT}} = \min_{|C| = k} \phi(C)`;
	const phiOptSym = String.raw`\varphi_{\mathrm{OPT}}`;
	const ratioUnbounded = String.raw`\varphi / \varphi_{\mathrm{OPT}}`;
	const lnk = String.raw`\ln k`;
	const xSetDef = String.raw`X = \{x_1, \dots, x_n\} \subset \mathbb R^d`;
	const dDef = String.raw`D(x) = \min_{c \in C_{i-1}} \| x - c \|`;
	const d2Prob = String.raw`p(x') = \dfrac{D(x')^2}{\sum_{x \in X} D(x)^2}`;
	const avBound = String.raw`\mathbb E[\phi(C)] \le 8(\ln k + 2) \cdot \varphi_{\mathrm{OPT}}`;
	const lemmaUniform = String.raw`\mathbb E[\varphi(A)] = 2\,\varphi_{\mathrm{OPT}}(A)`;
	const lemmaD2 = String.raw`\mathbb E[\varphi(A)] \le 8\,\varphi_{\mathrm{OPT}}(A)`;
	const harmonic = String.raw`H_t = 1 + \frac{1}{2} + \dots + \frac{1}{t} \le 1 + \ln t`;
	const harmonicK = String.raw`H_{k-1} \le 1 + \ln k`;
	const lowerBound = String.raw`\Omega(\ln k)`;
	const bound2020 = String.raw`\mathbb E[\phi(C)] \le 5(\ln k + 2)\,\varphi_{\mathrm{OPT}}`;
	const separation = String.raw`\varphi_{\mathrm{OPT},k} / \varphi_{\mathrm{OPT},k-1} \le \varepsilon^2`;
	const lloydCarry = String.raw`\phi(C^*) \le \phi(C_{\mathrm{seed}})`;
	const Olnk = String.raw`O(\ln k)`;
	const Onkd = String.raw`O(nkd)`;
	const Ologn = String.raw`O(\log n)`;
	const D2x = String.raw`D(x)^2`;
	const ellThetaK = String.raw`\ell = \Theta(k)`;
	const iDotsK = String.raw`i = 2, \dots, k`;
	const ciSample = String.raw`c_i = x' \in X`;
	const phiSym = String.raw`\phi`;
	const cOpt = String.raw`C_{\mathrm{OPT}}`;
	const cSeed = String.raw`C_{\mathrm{seed}}`;

	// ── Quiz — K-moyennes & évaluation ──
	// Questions et réponses fidèles aux frames « Algorithme de Lloyd »,
	// « Répétition de la procédure », « Choix de K », « Complexité
	// algorithmique », « Données aberrantes », « Remarques » et
	// « Évaluation d'un clustering » des diapositives.
	const quiz = getQuizQuestions('p3/l2');
</script>

<svelte:head>
	<title>
		{meta?.title ?? 'K-moyennes & évaluation'} — Fondations de l'Apprentissage Statistique
	</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'K-moyennes & évaluation'}
	subtitle="Algorithme de Lloyd (k-moyennes) et évaluation d'un clustering"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="fixer-k">Fixer K : le problème</h2>

		<p>
			Plutôt que d'explorer toutes les tailles de partition possibles (<a
				href={resolve('/part3/lesson1#partitions')}>choix d'une partition</a
			>, voir leçon 1), il peut être préférable de se fixer un nombre <KatexInline formula="K" /> de clusters
			au préalable, ce qui permet de réduire les temps de calcul.
		</p>

		<p>
			<strong>Objectif.</strong> Pour <KatexInline formula="K" /> fixé, trouver la partition de taille
			<KatexInline formula="K" /> des données <KatexInline formula={dataPoints} /> qui minimise l'inertie
			intra-classes :
		</p>
		<KatexBlock formula={objectiveFormula} />
		<p>
			(Rappel : <KatexInline formula="I_W" />, l'inertie intra-classes, a déjà été vue dans la
			<a href={resolve('/part3/lesson1')}>leçon 1</a> —
			<a href={resolve('/part3/lesson1#criteres')}>inertie intra et inter classes</a>.)
		</p>

		<Callout type="warning" title="Problème difficile">
			Ce problème d'optimisation est trop long à résoudre : il faut explorer un nombre énorme de
			partitions de taille <KatexInline formula="K" />. (Au-delà du cours : on peut montrer qu'il
			est NP-difficile — résultat absent des diapositives.)
		</Callout>
		<p>
			On va donc utiliser une heuristique : <em>l'algorithme de Lloyd</em> (K-moyennes).
		</p>

		<h2 id="lloyd">Algorithme de Lloyd</h2>

		<p>L'algorithme de Lloyd (K-moyennes) procède en quatre étapes :</p>
		<ol>
			<li>
				Choisir <KatexInline formula="K" /> observations <KatexInline formula={muInit} />
				aléatoirement dans l'espace pour servir de centroïdes initiaux. On les choisit en général parmi
				les points de données de manière aléatoire de sorte à les disperser au maximum parmi les données
				: <em>algorithme K-means++</em> (mais ça pourrait être aussi des points choisis aléatoirement
				dans l'espace).
			</li>
			<li>
				Affecter chaque observation <KatexInline formula={xi} /> au centroïde dont elle est le plus proche
				:
				<KatexBlock formula={assignmentFormula} />
				Cela revient à regarder dans quelle cellule du diagramme de Voronoï induit par
				<KatexInline formula={muInit} /> le point <KatexInline formula={xi} /> se trouve.
			</li>
			<li>
				Recalculer les centroïdes de chaque cluster :
				<KatexInline formula={recalcFormula} />
			</li>
			<li>
				Répéter les opérations 2–3 jusqu'à convergence, c'est-à-dire jusqu'à ce que les affectations
				ne changent plus.
			</li>
		</ol>

		<Callout type="note" title="Dans les diapositives">
			<p>
				Les diapositives renvoient à l'animation Wikipédia de la convergence de K-means (<a
					href="https://en.wikipedia.org/wiki/K-means_clustering"
					>https://en.wikipedia.org/wiki/K-means_clustering</a
				>) et à la vidéo « K-Means Clustering Explanation and Visualization » (<a
					href="https://www.youtube.com/watch?v=R2e3Ls9H_fc"
					>https://www.youtube.com/watch?v=R2e3Ls9H_fc</a
				>).
			</p>
		</Callout>

		<InteractiveSection
			number="2.1"
			title="Algorithme de Lloyd, pas à pas"
			onInteract={tracker.trackInteraction}
		>
			<p>
				Changez le jeu de données, <KatexInline formula="K" /> et l'initialisation (aléatoire ou k-means++),
				puis suivez les itérations : à chaque étape, affectation au centroïde le plus proche (cellule
				de Voronoï) puis recalcul des centroïdes. La courbe d'inertie ne fait que descendre.
			</p>
			<KMeansLloydAnimator />
		</InteractiveSection>

		<h2 id="convergence">Convergence et minima locaux</h2>

		<TheoremBlock title="Proposition">
			<p>L'inertie intra-classes</p>
			<KatexBlock formula={inertiaSum} />
			<p>diminue à chaque itération de l'algorithme.</p>
		</TheoremBlock>

		<Callout type="proof" title="Idée de preuve (lemme 22.1, UML)">
			<p>
				Les diapositives renvoient à la preuve du lemme 22.1 de l'ouvrage
				<em>Understanding Machine Learning</em> de Shalev-Shwartz &amp; Ben-David. Chaque itération comporte
				deux phases, et chacune diminue l'inertie :
			</p>
			<ul>
				<li>
					<strong>phase d'affectation</strong> — chaque point est réaffecté au centroïde le plus proche,
					sa distance au centroïde qui lui est associé ne peut donc qu'être inchangée ou diminuer ;
				</li>
				<li>
					<strong>phase de recalcul</strong> — remplacer le centre d'un cluster par la moyenne de ses
					points minimise la somme des carrés des distances aux points du cluster, donc ne peut qu'améliorer
					(ou laisser inchangée) l'inertie.
				</li>
			</ul>
		</Callout>

		<Callout type="warning" title="Minimum local">
			Il est donc possible de tomber dans un minimum local.
		</Callout>
		<p>
			Afin d'améliorer les performances de l'algorithme des K-moyennes, il est souvent recommandé de
			répéter la procédure plusieurs fois avec différentes initialisations aléatoires des centroïdes
			(et de garder la meilleure partition).
		</p>

		<InteractiveSection
			number="2.2"
			title="Minimum local et redémarrages"
			onInteract={tracker.trackInteraction}
		>
			<p>
				Une initialisation malchanceuse (trois centroïdes initiaux dans le même nuage) converge vers
				un minimum local. En répétant la procédure avec des initialisations aléatoires différentes,
				on finit par trouver la bonne partition : regardez la courbe du meilleur
				<KatexInline formula="I_W" /> en fonction du nombre de redémarrages.
			</p>
			<KMeansRestartsDemo />
		</InteractiveSection>

		<!-- Panneau expert (mode expert uniquement) : k-means++ et sa garantie
		     O(log k). Contenu au-delà du cours — voir expert/part3/lesson2/
		     kmeanspp-garantie.md et kmeanspp-garantie.research.md. -->
		<ExpertPanel title="k-means++ : une initialisation avec garantie">
			<p>
				La section précédente propose le remède standard aux minima locaux : redémarrer la
				procédure avec différentes initialisations aléatoires et garder la meilleure
				partition. C'est une heuristique pure : aucune garantie ne vient à la qualité de la
				solution finale, et l'initialisation aléatoire uniforme elle-même peut être
				arbitrairement mauvaise. Arthur &amp; Vassilvitskii (2007) construisent des
				instances « naturelles » — sans placement adverse des centres de départ — sur
				lesquelles le ratio <KatexInline formula={ratioUnbounded} /> du résultat de Lloyd
				est <strong>non borné, même quand <KatexInline formula="n" /> et
				<KatexInline formula="k" /> sont fixes</strong>, et ce <strong>avec haute
				probabilité</strong> : sur des clusters bien séparés, le tirage uniforme met
				inévitablement plusieurs centres de départ dans le même nuage, et la recherche
				locale de Lloyd ne fait que fusionner des nuages — elle ne peut jamais les
				séparer.
			</p>
			<p>
				La question est donc : peut-on choisir les centres de départ de façon à garantir,
				dès l'initialisation, un majorant du coût ? Oui : <strong>k-means++</strong>
				(Arthur &amp; Vassilvitskii 2007) tire les centres proportionnellement au
				<strong>carré</strong> de la distance au centre le plus proche déjà choisi
				(échantillonnage D²), et obtient une garantie d'approximation pire cas en
				espérance, de l'ordre de <KatexInline formula={lnk} />.
			</p>

			<DefinitionBlock number="2.2.1.bis" title="Échantillonnage D² (k-means++)">
				<p>
					Soit <KatexInline formula={xSetDef} />, un nombre de centres
					<KatexInline formula="k" />, et le <strong>potentiel</strong> (coût) d'un
					ensemble <KatexInline formula="C" /> de centres :
				</p>
				<KatexBlock formula={phiDef} />
				<p>
					avec <KatexInline formula={phiOptDef} /> le coût optimal.
				</p>
				<p>
					<strong>Algorithme k-means++</strong> (Arthur–Vassilvitskii 2007, §2.2) :
				</p>
				<ol>
					<li>
						tirer le premier centre <KatexInline formula="c_1" />
						<strong>uniformément au hasard dans X</strong> ;
					</li>
					<li>
						pour <KatexInline formula={iDotsK} />, soit
						<KatexInline formula={dDef} /> la distance de <KatexInline
							formula="x"
						/>
						au centre déjà choisi le plus proche ; tirer <KatexInline
							formula={ciSample}
						/>
						avec probabilité
						<KatexBlock formula={d2Prob} />
					</li>
					<li>lancer ensuite l'algorithme de Lloyd (leçon) depuis ces k centres.</li>
				</ol>
				<p>
					La pondération <KatexInline formula="D^2" />/ΣD² est appelée « D² weighting
					». La phase de seeding fait <KatexInline formula="k - 1" /> passes sur les
					données (mise à jour de tous les <KatexInline formula="D(x)" /> à chaque
					étape) : son coût <KatexInline formula={Onkd} /> est du même ordre de
					grandeur qu'une itération de Lloyd. La leçon a déjà nommé cette
					initialisation à l'étape 1 de l'algorithme de Lloyd (dans le but de
					disperser les centroïdes) ; c'est ici sa définition exacte.
				</p>
			</DefinitionBlock>

			<TheoremBlock number="2.2.2.bis" title="Théorème (Arthur & Vassilvitskii, SODA 2007)">
				<p>
					Si <KatexInline formula="C" /> est l'ensemble des <KatexInline formula="k" />
					centres produits par la phase de seeding de k-means++, alors
				</p>
				<KatexBlock formula={avBound} />
				<ul>
					<li>
						l'espérance est prise sur les tirages du seeding ; la borne est
						<strong>pire cas sur toutes les instances</strong> — aucune hypothèse sur
						la répartition des données ;
					</li>
					<li>
						la borne est démontrée <strong>sur le seeding seul</strong> : les
						itérations de Lloyd ne peuvent ensuite que diminuer
						<KatexInline formula={phiSym} /> (Proposition 2.2.3.bis) ;
					</li>
					<li>
						c'est une borne <strong>en espérance</strong> : un tirage isolé peut être
						mauvais ; c'est la moyenne sur les tirages du seeding qui est majorée.
					</li>
				</ul>
				<p><strong>Idée de la démonstration</strong> (A&V 2007, §3) :</p>
				<p>
					On décompose le coût sur les clusters <KatexInline formula="A" /> d'une
					partition optimale <KatexInline formula={cOpt} />, et on borne
					l'espérance du coût de chaque cluster selon la façon dont les centres sont
					tirés :
				</p>
				<ol>
					<li>
						<strong>Lemme 3.1 — premier centre (tirage uniforme).</strong> Si
						l'unique centre est tiré uniformément dans un cluster optimal
						<KatexInline formula="A" />, alors <KatexInline formula={lemmaUniform} /> :
						c'est la décomposition de la variance autour du centroïde — tirer un
						point au hasard plutôt que le centroïde (qui est le centre optimal du
						cluster) ajoute exactement la variance du cluster ;
					</li>
					<li>
						<strong>Lemme 3.2 — centre tiré avec pondération D².</strong> Si l'on
						ajoute à un clustering quelconque un centre tiré de <KatexInline
							formula="A"
						/>
						avec pondération D², alors <KatexInline formula={lemmaD2} />, par
						l'inégalité triangulaire puis l'inégalité des puissances (cas de
						Cauchy–Schwarz) ;
					</li>
					<li>
						<strong>Lemme 3.3 — récurrence.</strong> En récurrence sur le nombre
						<KatexInline formula="t" /> de centres tirés et le nombre
						<KatexInline formula="u" /> de clusters optimaux encore « non couverts »
						(aucun centre tiré d'eux), l'espérance du potentiel fait intervenir la
						<strong>somme harmonique</strong> <KatexInline formula={harmonic} />.
						Appliquée après le premier centre (<KatexInline formula="t = u = k - 1" />),
						avec <KatexInline formula={harmonicK} />, elle donne la borne du
						théorème. <strong>C'est la somme harmonique qui produit le
						<KatexInline formula={lnk} /></strong> : chaque cluster optimal « paie »
						un facteur lié au moment où il est couvert pour la première fois.
					</li>
				</ol>
				<p>
					<strong>Optimalité de l'ordre.</strong> Le Théorème 4.1 (A&V 2007) construit
					une famille d'instances (k clusters très séparés) sur laquelle
					l'échantillonnage D² n'est pas mieux qu'<KatexInline formula={lowerBound} />-
					compétitif en espérance : l'ordre <KatexInline formula={lnk} /> est
					<strong>optimal à un facteur constant près</strong>. La constante 8 a depuis
					été améliorée en 5 (Makarychev, Reddy &amp; Shan, NeurIPS 2020) :
					<KatexInline formula={bound2020} />, sans changer l'ordre.
				</p>
				<p>
					<strong>Sur les données bien séparées.</strong> Ostrovsky, Rabani, Schulman
					&amp; Swamy (FOCS 2006), qui proposent indépendamment le même seeding,
					prouvent qu'il est <strong>O(1)-compétitif</strong> dès que les données
					admettent une bonne partition en <KatexInline formula="k" /> clusters, à
					savoir <KatexInline formula={separation} /> (ajouter un
					<KatexInline formula="k + 1" />-ième cluster n'apporte presque rien). Le
					régime <KatexInline formula={lnk} /> est donc une borne pire cas : sur des
					données « bien formées », le facteur est borné par une constante.
				</p>
			</TheoremBlock>

			<TheoremBlock number="2.2.3.bis" title="Lloyd après k-means++">
				<p>
					Soit <KatexInline formula={cSeed} /> l'ensemble des centres du
					seeding, et <KatexInline formula="C^*" /> la partition obtenue en exécutant
					l'algorithme de Lloyd depuis <KatexInline formula={cSeed} />.
					D'après la Proposition de la leçon (monotonie de l'inertie intra-classes,
					lemme 22.1 de Shalev-Shwartz &amp; Ben-David), le coût ne fait que diminuer
					le long des itérations de Lloyd :
				</p>
				<KatexBlock formula={lloydCarry} />
				<p>D'où</p>
				<KatexBlock formula={avBound} />
				<p>
					<strong>la garantie se transporte au coût final de k-means++</strong>
					(seeding + Lloyd). Arthur &amp; Vassilvitskii soulignent que c'est le
					raffinement par Lloyd qui rend la méthode efficace en pratique — sur leurs
					jeux de données, le potentiel final est 20 à 1000 fois plus petit qu'avec le
					seeding aléatoire, et la convergence est 2 à 3 fois plus rapide (moins
					d'itérations) — mais la théorie ne quantifie pas ce raffinement : la borne
					ne s'applique qu'au coût du seeding.
				</p>
			</TheoremBlock>

			<p>
				<strong>Redémarrages contre k-means++.</strong> Les redémarrages multiples de la
				section précédente restent une heuristique : chaque essai est un tirage
				indépendant ; « le meilleur des R » s'améliore empiriquement avec R (section
				interactive 2.2), mais aucune garantie pire cas ne s'y attache — le tirage
				uniforme peut être arbitrairement mauvais, comme vu ci-dessus.
				<strong>k-means++</strong> fournit en revanche une garantie pire cas, en
				espérance : <KatexInline formula={Olnk} /> sur tout jeu de données, pour un coût
				de seeding <KatexInline formula={Onkd} /> — du même ordre qu'une itération de
				Lloyd — et en pratique il bat plusieurs redémarrages, tout en convergeant plus
				vite (A&V 2007, §6).
			</p>
			<p>
				<strong>k-means||</strong> (Bahmani, Moseley, Vattani, Kumar &amp;
				Vassilvitskii, PVLDB 2012). Les <KatexInline formula="k - 1" /> passes du seeding
				de k-means++ sont séquentielles par nature ; k-means|| les parallélise : après un
				premier centre uniforme, chacun des <KatexInline formula={Ologn} /> tours
				échantillonne <strong>en parallèle</strong> un lot de points avec une probabilité
				proportionnelle à <KatexInline formula={D2x} /> (environ
				<KatexInline formula={ellThetaK} /> nouveaux points par tour), puis on sélectionne
				les <KatexInline formula="k" /> centres finaux parmi les candidats — pondérés par
				le nombre de points qu'ils attirent — par exemple en réexécutant k-means++ sur
				l'instance pondérée. La garantie <KatexInline formula={Olnk} /> en espérance est
				préservée (Théorème 1 de l'article : si l'étape finale utilise un α-algorithme
				d'approximation, le résultat est un O(α)-algorithme), le coût décroissant
				géométriquement à chaque tour (Théorème 2) ; en pratique, un nombre constant de
				tours (3 à 5) suffit. C'est la variante déployée dans les grands systèmes de
				calcul distribué.
			</p>

			<InteractiveSection number="2.2.bis" title="k-means++ : la garantie en pratique"
				onInteract={tracker.trackInteraction}>
				<p>
					Mêmes données que la section 2.2 : 30 runs Lloyd initialisés au hasard contre
					1 run k-means++, avec la référence <KatexInline formula={phiOptSym} /> (Lloyd
					initialisé aux vrais centroïdes des 3 nuages) et la borne du théorème en
					pointillés. « Réinitialiser » redessine les tirages.
				</p>
				<KMeansPPGuaranteeDemo />
			</InteractiveSection>
		</ExpertPanel>

		<h2 id="choix-k">Choix de K : critère du coude</h2>

		<p>
			Le nombre de clusters <KatexInline formula="K" /> est un hyperparamètre de l'algorithme des K-moyennes
			à choisir. Ce choix peut être fait en minimisant un critère, comme l'inertie intra-classe.
		</p>

		<Callout type="warning" title="Piège">
			L'inertie intra-classe va forcément diminuer plus <KatexInline formula="K" /> augmente ; pour tant,
			on ne veut pas choisir la partition avec <KatexInline formula="n" /> clusters.
		</Callout>

		<p>
			Pour <KatexInline formula="K" /> petit, on observe une décroissance forte de l'inertie intra-classes,
			puis cette décroissance s'atténue au niveau d'un <strong>coude</strong>, là où l'on observe un
			changement de pente. On peut donc choisir <KatexInline formula="K" /> au niveau du coude : c'est
			le <em>critère du coude</em>.
		</p>

		<figure class="lesson-figure">
			<img
				src={asset('/images/part3/coude.png')}
				alt="Courbe de l'inertie intra-classes en fonction de K avec un coude autour de K = 4"
			/>
			<figcaption>
				Critère du coude : la décroissance s'atténue au niveau du coude — ici, le coude se situe
				autour de K = 4.
			</figcaption>
		</figure>
		<p class="attribution">Figure des diapositives du cours M1 MIASHS (Marine Demangeot, 2022).</p>

		<InteractiveSection number="2.3" title="Critère du coude" onInteract={tracker.trackInteraction}>
			<p>
				L'inertie diminue forcément quand <KatexInline formula="K" /> augmente : regardez où la décroissance
				s'atténue (le coude) et vérifiez que le critère de silhouette, indépendant, désigne le même <KatexInline
					formula="K"
				/>.
			</p>
			<ElbowCriterionDemo />
		</InteractiveSection>

		<h2 id="complexite">Complexité algorithmique</h2>

		<p>
			À chaque itération, on calcule <KatexInline formula="K" /> · <KatexInline formula="n" />
			distances en <KatexInline formula="d" /> dimensions. Pour <KatexInline formula="t" />
			itérations, la complexité algorithmique de l'algorithme de Lloyd est donc en
			<KatexInline formula={lloydComplexity} />.
		</p>
		<p>
			Puisque <KatexInline formula="K" /> et <KatexInline formula="t" /> sont négligeables devant
			<KatexInline formula="n" />, cet algorithme est donc linéaire en le nombre d'observations, par
			opposition au clustering hiérarchique dont le coût est quadratique en
			<KatexInline formula="n" /> (si l'on stocke les distances entre les observations). C'est expliqué
			par le fait que le calcul des distances d'une observation <KatexInline formula={xi} />
			aux <KatexInline formula="n" /> − 1 autres points du jeu de données a été remplacé par un calcul
			de sa distance à <KatexInline formula="K" /> centroïdes.
		</p>
		<p>
			Il est possible de combiner K-moyennes et clustering hiérarchique : on fait un K-moyennes avec
			<KatexInline formula={lambdaN} /> (une fraction importante des données), et ensuite on fait un clustering
			hiérarchique ascendant sur le résultat de l'algorithme des K-moyennes.
		</p>

		<h2 id="outliers">Données aberrantes</h2>

		<p>
			L'algorithme des K-moyennes est sensible aux données aberrantes. Si une observation
			<KatexInline formula={xi} /> est très éloignée des autres observations, elle se retrouvera seule
			dans un cluster, tandis que le reste des données sera partitionné en
			<KatexInline formula="K" /> − 1 clusters.
		</p>
		<p>
			Cependant, cela permet d'utiliser l'algorithme des K-moyennes pour détecter les observations
			aberrantes : ce sont celles qui sont seules dans un cluster.
		</p>
		<p>
			Le partitionnement en <strong>K-médoïdes</strong> est une méthode de partitionnement plus robuste
			vis-à-vis des données aberrantes. Le médoïde d'une classe est défini comme le point de la classe
			dont la dissimilarité moyenne avec tous les autres points de la classe est minimale, c'est-à-dire
			qu'il s'agit de l'observation la plus centrale de la classe.
		</p>

		<InteractiveSection
			number="2.4"
			title="K-moyennes et données aberrantes"
			onInteract={tracker.trackInteraction}
		>
			<p>
				Ajoutez des observations aberrantes : chacune finit seule dans son cluster. Les points «
				détectés » (clusters de taille 1) sont exactement les aberrantes injectées.
			</p>
			<OutlierDetectionDemo />
		</InteractiveSection>

		<h2 id="forme">Forme des clusters</h2>

		<p>
			Les centroïdes des clusters trouvés par l'algorithme des K-moyennes forment un diagramme de
			Voronoï. Les clusters sont donc <strong>convexes</strong>.
		</p>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img src={asset('/images/part3/rond1.png')} alt="Deux anneaux concentriques de points" />
				<figcaption>Deux anneaux concentriques : la structure « vraie » des données.</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img
					src={asset('/images/part3/rond2.png')}
					alt="Partitionnement en 3 clusters par K-moyennes de deux anneaux concentriques"
				/>
				<figcaption>
					Partitionnement en 3 clusters par K-moyennes : les anneaux ne sont pas retrouvés (les
					clusters de K-moyennes sont convexes).
				</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Images tirées de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</p>

		<Callout type="insight" title="Astuce du noyau">
			On peut utiliser l'astuce du noyau à <em>l'algorithme de Lloyd</em> pour obtenir des clusters
			non convexes (voir section 12.4.3 de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe
			Azencott).
		</Callout>

		<InteractiveSection
			number="2.5"
			title="Anneaux et astuce du noyau"
			onInteract={tracker.trackInteraction}
		>
			<p>
				En 2D, K-moyennes ne peut pas retrouver les deux anneaux : les cellules de Voronoï sont
				convexes. Avec l'astuce du noyau (élévation
				<KatexInline formula={String.raw`\varphi(x, y) = (x, y, x^2 + y^2)`} /> avant d'appliquer Lloyd
				— simulation illustrative, les sources renvoyant à la section 12.4.3 d'Azencott sans la formuler),
				les anneaux deviennent séparables et sont retrouvés.
			</p>
			<ClusterShapeDemo />
		</InteractiveSection>

		<h2 id="evaluation">Évaluation d'un clustering</h2>

		<p>
			Le clustering n'étant pas supervisé, il nous faut mettre au point des critères d'évaluation
			qui ne dépendent pas d'une vérité terrain (c'est-à-dire d'étiquettes connues). La tâche est
			plus délicate que dans le cadre de l'apprentissage supervisé, dans lequel le but à atteindre
			est beaucoup plus clair.
		</p>

		<h3>Stabilités des clusters</h3>
		<p>
			On veut que le clustering soit robuste : collecter plus de données, perturber ou supprimer
			quelques observations, ou initialiser différemment l'algorithme de partitionnement, ne devrait
			pas changer complètement les conclusions.
		</p>

		<h3>Évaluation externe</h3>
		<ul>
			<li>
				<strong>A posteriori</strong>, un expert peut évaluer la qualité du clustering : les groupes
				sont-ils cohérents, ont-ils du sens ?
			</li>
			<li>
				<strong>A priori</strong>, si on dispose d'un jeu de données (partiellement) étiqueté, on
				peut vérifier si on retrouve les classes avec le clustering (<a
					href="https://fr.wikipedia.org/wiki/Indice_de_Rand">indice de Rand</a
				>).
			</li>
		</ul>

		<h3>Évaluation interne</h3>
		<p>
			On peut mesurer certaines statistiques comme l'indice de Davies-Bouldin global ou le
			coefficient de silhouette global afin de se rendre compte de la qualité du partitionnement en
			terme d'homogénéité des clusters et de séparabilité entre les clusters (définitions :
			<a href={resolve('/part3/lesson1')}>leçon 1</a>,
			<a href={resolve('/part3/lesson1#criteres')}>mesurer une bonne partition</a>).
		</p>

		<InteractiveSection
			number="2.6"
			title="Évaluation interne : silhouette et Davies-Bouldin"
			onInteract={tracker.trackInteraction}
		>
			<p>
				Augmentez la dispersion des nuages : les critères internes (silhouette à maximiser,
				Davies-Bouldin à minimiser) finissent par ne plus désigner le bon nombre de clusters.
			</p>
			<InternalEvaluationDemo />
		</InteractiveSection>

		<h2 id="quiz">Quiz</h2>

		<Callout type="summary" title="Retenir">
			<ul>
				<li>
					Pour <KatexInline formula="K" /> fixé, l'objectif est de minimiser l'inertie intra-classes <KatexInline
						formula="I_W"
					/> ; ce problème d'optimisation est trop long à résoudre — d'où l'heuristique de Lloyd et ses
					quatre étapes : initialisation des centroïdes (k-means++), affectation au centroïde le plus
					proche (cellule de Voronoï), recalcul des centroïdes, itération jusqu'à convergence.
				</li>
				<li>
					Proposition : l'inertie diminue à chaque itération (preuve : lemme 22.1 d'
					<em>Understanding Machine Learning</em>) — mais l'algorithme peut s'arrêter dans un
					minimum local : on redémarre la procédure avec différentes initialisations aléatoires et
					on garde la meilleure partition.
				</li>
				<li>
					<KatexInline formula="K" /> est un hyperparamètre : l'inertie diminue forcément quand
					<KatexInline formula="K" /> augmente, donc on choisit <KatexInline formula="K" /> au niveau
					du coude (critère du coude).
				</li>
				<li>
					Complexité <KatexInline formula={lloydComplexity} /> pour <KatexInline formula="t" />
					itérations : linéaire en <KatexInline formula="n" />, contre
					<KatexInline formula={cahComplexity} /> pour le clustering hiérarchique (distances aux
					<KatexInline formula="K" /> centroïdes au lieu des <KatexInline formula="n" /> − 1 autres points)
					; combinaison possible : K-moyennes avec <KatexInline formula={lambdaN} />, puis
					clustering hiérarchique ascendant.
				</li>
				<li>
					Sensible aux données aberrantes (celles qui finissent seules dans un cluster) —
					exploitable pour les détecter ; le partitionnement en K-médoïdes est plus robuste (médoïde
					= observation la plus centrale de la classe).
				</li>
				<li>
					Les clusters de K-moyennes sont convexes (cellules de Voronoï) — les anneaux ne sont pas
					retrouvés en 2D ; l'astuce du noyau permet d'obtenir des clusters non convexes (Azencott,
					section 12.4.3). Évaluation sans vérité terrain : stabilité, externe (expert a posteriori,
					indice de Rand a priori), interne (silhouette, Davies-Bouldin).
				</li>
			</ul>
		</Callout>

		<InteractiveSection
			number="2.7"
			title="Quiz — K-moyennes & évaluation"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Azencott, C. A.']}
			year={2022}
			title="Introduction au Machine Learning"
			journal="Dunod, 2ᵉ édition."
			link="https://www.dunod.com/sciences-techniques/introduction-au-machine-learning-2"
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
			authors={['Arthur, D.', 'Vassilvitskii, S.']}
			year={2007}
			title="k-means++: The Advantages of Careful Seeding"
			journal="Proceedings of the 18th Annual ACM-SIAM Symposium on Discrete Algorithms (SODA), pp. 1027–1035."
			link="https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf"
		/>
		<BibElement
			authors={['Bahmani, B.', 'Moseley, B.', 'Vattani, A.', 'Kumar, R.', 'Vassilvitskii, S.']}
			year={2012}
			title="Scalable K-Means++"
			journal="Proceedings of the VLDB Endowment (PVLDB), 5(7), pp. 622–627."
			link="https://www.vldb.org/pvldb/vol5/p622_bahmanbahmani_vldb2012.pdf"
		/>
		<BibElement
			authors={['Makarychev, K.', 'Reddy, A.', 'Shan, L.']}
			year={2020}
			title="Improved Guarantees for k-means++ and k-means++ Parallel"
			journal="Advances in Neural Information Processing Systems (NeurIPS), 33, pp. 26739–26750."
			link="https://proceedings.neurips.cc/paper/2020/file/ba304f3809ed31d0ad97b5a2b5df2a39-Paper.pdf"
		/>
		<BibElement
			authors={['Ostrovsky, R.', 'Rabani, Y.', 'Schulman, L.', 'Swamy, C.']}
			year={2006}
			title="The Effectiveness of Lloyd-type Methods for the k-means Problem"
			journal="Proceedings of the 47th Annual IEEE Symposium on Foundations of Computer Science (FOCS)."
		/>
	</Bibliography>
</PageTemplate>
