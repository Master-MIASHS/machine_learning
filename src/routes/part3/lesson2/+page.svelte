<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import Quiz, { type QuizItem } from '$lib/components/narrative/Quiz.svelte';
	import KMeansLloydAnimator from '$lib/components/demos/KMeansLloydAnimator.svelte';
	import KMeansRestartsDemo from '$lib/components/demos/KMeansRestartsDemo.svelte';
	import ElbowCriterionDemo from '$lib/components/demos/ElbowCriterionDemo.svelte';
	import OutlierDetectionDemo from '$lib/components/demos/OutlierDetectionDemo.svelte';
	import ClusterShapeDemo from '$lib/components/demos/ClusterShapeDemo.svelte';
	import InternalEvaluationDemo from '$lib/components/demos/InternalEvaluationDemo.svelte';
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

	// ── Quiz — K-moyennes & évaluation ──
	// Questions et réponses fidèles aux frames « Algorithme de Lloyd »,
	// « Répétition de la procédure », « Choix de K », « Complexité
	// algorithmique », « Données aberrantes », « Remarques » et
	// « Évaluation d'un clustering » des diapositives.
	const quiz: QuizItem[] = [
		{
			question:
				'À l’étape 2 de Lloyd, on affecte chaque x_i au centroïde le plus proche. Cela revient à…',
			options: [
				'regarder dans quelle cellule du diagramme de Voronoï induit par les centroïdes se trouve x_i',
				'calculer la distance entre toutes les paires de points',
				'construire un arbre de décision',
				'calculer le centroïde global des données'
			],
			answerIndex: 0,
			explanation:
				'L’affectation au centroïde le plus proche est exactement l’appartenance à une cellule du diagramme de Voronoï induit par μ_1, …, μ_K.'
		},
		{
			question: 'À l’étape 3 de Lloyd, le centroïde μ_k du cluster 𝒞_k est recalculé comme…',
			options: [
				'la moyenne des points de 𝒞_k',
				'le point de 𝒞_k le plus éloigné du centroïde global',
				'un point choisi aléatoirement',
				"le point de 𝒞_k le plus proche de l'observation courante"
			],
			answerIndex: 0,
			explanation: 'μ_k devient la moyenne arithmétique des observations du cluster 𝒞_k.'
		},
		{
			question:
				'Proposition (preuve : lemme 22.1, UML) : pendant l’algorithme de Lloyd, l’inertie intra-classes…',
			options: [
				'augmente à chaque itération',
				'diminue à chaque itération',
				'reste constante',
				'augmente d’abord puis diminue'
			],
			answerIndex: 1,
			explanation:
				"Chaque itération (affectation puis recalcul) diminue ou laisse inchangée l'inertie : elle est donc non croissante."
		},
		{
			question:
				'Comme l’inertie diminue à chaque itération, l’algorithme peut s’arrêter dans un minimum local. La recommandation usuelle est de…',
			options: [
				"s'arrêter à la première itération",
				'repéter la procédure avec différentes initialisations aléatoires et garder la meilleure partition',
				'augmenter la dimension d des données',
				'choisir les centroïdes initiaux en les triant'
			],
			answerIndex: 1,
			explanation:
				'On redémarre la procédure plusieurs fois avec des initialisations aléatoires différentes et on garde la meilleure partition.'
		},
		{
			question: 'L’inertie intra-classe diminue forcément plus K augmente. Pour choisir K, on…',
			options: [
				'choisit K = n (inertie nulle)',
				'minimise l’inertie sans contrainte',
				'utilise le critère du coude : on choisit K au niveau du changement de pente',
				'choisit K au hasard'
			],
			answerIndex: 2,
			explanation:
				"Minimiser l'inertie sans contrainte donnerait K = n ; on choisit K au niveau du coude, là où la décroissance s'atténue."
		},
		{
			question:
				'Pour t itérations, la complexité de l’algorithme de Lloyd est O(ndKt). K et t étant négligeables devant n, cet algorithme est…',
			options: [
				'quadratique en n, comme le clustering hiérarchique',
				'linéaire en n : les distances aux n−1 autres points sont remplacées par les distances à K centroïdes',
				'exponentielle en n',
				'indépendante de n'
			],
			answerIndex: 1,
			explanation:
				"Chaque observation n'est comparée qu'à K centroïdes, pas aux n−1 autres points : coût linéaire en n."
		},
		{
			question: 'Une observation très éloignée des autres, dans K-moyennes…',
			options: [
				'est ignorée par l’algorithme',
				'se retrouve seule dans un cluster, tandis que le reste des données est partitionné en K−1 clusters',
				'est affectée au plus gros cluster',
				'empêche la convergence de l’algorithme'
			],
			answerIndex: 1,
			explanation:
				'L’algorithme des K-moyennes est sensible aux données aberrantes : une observation très éloignée finit seule dans un cluster.'
		},
		{
			question: 'Cette sensibilité aux données aberrantes peut être exploitée pour…',
			options: [
				'détecter les observations aberrantes (celles qui sont seules dans un cluster)',
				'réduire la dimension des données',
				'choisir les centroïdes initiaux',
				'calculer le coude'
			],
			answerIndex: 0,
			explanation:
				'Les observations aberrantes sont précisément celles qui sont seules dans un cluster : on peut donc les détecter avec K-moyennes.'
		},
		{
			question: 'Les clusters trouvés par K-moyennes sont…',
			options: [
				'nécessairement non convexes',
				'convexes (les centroïdes forment un diagramme de Voronoï)',
				'nécessairement circulaires',
				'indépendants du choix de la distance'
			],
			answerIndex: 1,
			explanation:
				'Les centroïdes forment un diagramme de Voronoï, dont les cellules sont convexes.'
		},
		{
			question: 'Comme les clusters sont convexes, deux anneaux concentriques en 2D…',
			options: [
				'sont parfaitement retrouvés par K-moyennes',
				"ne peuvent pas être retrouvés par K-moyennes en 2D (l'astuce du noyau permet d'obtenir des clusters non convexes, Azencott §12.4.3)",
				'exigent K = 2',
				'sont retrouvés par le lien complet'
			],
			answerIndex: 1,
			explanation:
				"Des cellules convexes ne peuvent pas couper des anneaux ; l'astuce du noyau (Azencott, section 12.4.3) permet d'obtenir des clusters non convexes."
		},
		{
			question: 'Le clustering n’étant pas supervisé, l’évaluation interne utilise…',
			options: [
				"l'indice de Rand calculé avec les étiquettes",
				'des critères qui ne dépendent pas d’une vérité terrain, comme le coefficient de silhouette global ou l’indice de Davies-Bouldin global',
				'la matrice de confusion',
				"l'opinion a priori d'un expert"
			],
			answerIndex: 1,
			explanation:
				'L’évaluation interne (silhouette, Davies-Bouldin) ne dépend d’aucune étiquette ; l’indice de Rand relève de l’évaluation externe a priori.'
		},
		{
			question:
				'Si l’on dispose d’un jeu de données (partiellement) étiqueté, l’évaluation externe peut vérifier a priori que le clustering retrouve les classes (par exemple avec l’indice de…)',
			options: ['Rand', 'silhouette', 'Bell', 'coude'],
			answerIndex: 0,
			explanation:
				"L'indice de Rand compare le partitionnement aux classes connues (évaluation externe a priori)."
		}
	];
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
			authors={['Demangeot, M.']}
			year={2022}
			title="Clustering — diapositives du cours M1 MIASHS « Régularisation et Optimisation »"
			journal="Université de Provence."
		/>
	</Bibliography>
</PageTemplate>
