<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
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
	import DistanceLandscape from '$lib/components/demos/DistanceLandscape.svelte';
	import PartitionCriteriaExplorer from '$lib/components/demos/PartitionCriteriaExplorer.svelte';
	import BellNumberGrowth from '$lib/components/demos/BellNumberGrowth.svelte';
	import CahStepByStep from '$lib/components/demos/CahStepByStep.svelte';
	import ClusterCountExplorer from '$lib/components/demos/ClusterCountExplorer.svelte';
	import { asset } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part3/lesson1');
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
			label: 'Clustering : objectif et exemples',
			description: 'Apprentissage non supervisé, clusters, applications',
			color: 'epistemic'
		},
		{
			id: 'distances',
			label: "Choix d'une distance",
			description: 'Définition ; variables quantitatives, qualitatives et mixtes',
			color: 'belief'
		},
		{
			id: 'criteres',
			label: 'Mesurer une bonne partition',
			description: 'Homogénéité, séparabilité, Davies-Bouldin, silhouette, inerties',
			color: 'agent'
		},
		{
			id: 'partitions',
			label: 'Choisir une partition',
			description: 'Nombre de Bell et stratégies itératives',
			color: 'surprise'
		},
		{
			id: 'cah',
			label: 'Principe du clustering hiérarchique',
			description: 'Agglomératif vs divisif ; la CAH',
			color: 'positive'
		},
		{
			id: 'liaisons',
			label: 'Distance entre deux clusters',
			description: 'Liens simple, complet, moyen, centroïdal ; Ward',
			color: 'belief'
		},
		{
			id: 'dendrogramme',
			label: 'Dendrogramme',
			description: 'Visualiser l’arborescence ; couper l’arbre',
			color: 'neutral'
		},
		{
			id: 'choix-k',
			label: 'Choix du nombre de clusters',
			description: 'Seuil r, évaluation des nœuds, complexité',
			color: 'surprise'
		},
		{
			id: 'quiz',
			label: 'Quiz',
			description: 'Vérifier sa compréhension',
			color: 'epistemic'
		}
	];

	// ── Formules (frames de marine/Cours/CM/coursClassif-5-Clustering.tex) ──

	// Frame « Clustering -- Objectif ».
	const partitionObjet = String.raw`\{x_1, \dots, x_n\} = \bigcup_{k=1}^{K} \mathcal{C}_k`;

	// Frame « Choix d'une distance ».
	const distanceDef = String.raw`d : \mathcal{X} \times \mathcal{X} \to \mathbb{R}_+`;
	const distanceSymetrie = String.raw`\forall x, y \in \mathcal{X}, \; d(x, y) = d(y, x)`;
	const distanceSeparation = String.raw`\forall x, y \in \mathcal{X}, \; d(x, y) = 0 \iff x = y`;
	const distanceTriangulaire = String.raw`\forall x, y, z \in \mathcal{X}, \; d(x, y) \leq d(x, z) + d(z, y)`;

	// Frame « Distances -- variables quantitatives ».
	const distanceEuclidienne = String.raw`d(x, y) = \lVert x - y \rVert_2 = \sqrt{\sum_{i=1}^{d} (x_i - y_i)^2}`;
	const distanceManhattan = String.raw`d(x, y) = \lVert x - y \rVert_1 = \sum_{i=1}^{d} |x_i - y_i|`;
	const distanceMinkowski = String.raw`d(x, y) = \left( \sum_{i=1}^{d} (x_i - y_i)^p \right)^{1/p}`;
	const distanceChebyshev = String.raw`d(x, y) = \max_{i \in \{1, \dots, d\}} |x_i - y_i|`;
	const distanceMahalanobis = String.raw`d(x, y) = \sqrt{(x - y)^\top \Sigma^{-1} (x - y)}`;

	// Frame « Homogénéité ».
	const centroide = String.raw`\mu_{\mathcal{C}} = \dfrac{1}{|\mathcal{C}|} \sum_{x \in \mathcal{C}} x`;
	const homogeneite = String.raw`T_k = \dfrac{1}{|\mathcal{C}_k|} \sum_{x \in \mathcal{C}_k} d(x, \mu_k)`;
	const homogeneiteGlobale = String.raw`T = \dfrac{1}{K} \sum_{k=1}^{K} T_k`;

	// Frame « Séparabilité ».
	const separabilite = String.raw`S_{k\ell} = d(\mu_k, \mu_\ell)`;
	const separabiliteGlobale = String.raw`S = \dfrac{2}{K(K - 1)} \sum_{k=1}^{K} \sum_{\ell = k+1}^{K} S_{k\ell}`;

	// Frame « Indice de Davies-Bouldin ».
	const daviesBouldin = String.raw`D_k = \max_{\ell \neq k} \dfrac{T_k + T_\ell}{S_{k\ell}}`;
	const daviesBouldinGlobal = String.raw`D = \dfrac{1}{K} \sum_{k=1}^{K} D_k`;

	// Frame « Coefficient de silhouette ».
	const silhouette = String.raw`s(x) = \dfrac{b(x) - a(x)}{\max(a(x), \, b(x))} \in [-1, 1]`;
	const silhouetteA = String.raw`a(x) = \dfrac{1}{|\mathcal{C}_{k(x)}| - 1} \sum_{y \in \mathcal{C}_{k(x)}, \, y \neq x} d(x, y)`;
	const silhouetteB = String.raw`b(x) = \min_{\ell \neq k(x)} \dfrac{1}{|\mathcal{C}_\ell|} \sum_{y \in \mathcal{C}_\ell} d(x, y)`;
	const silhouetteGlobal = String.raw`s = \dfrac{1}{n} \sum_{i=1}^{n} s(x_i)`;

	// Frame « Inertie intra et inter classes ».
	const muGlobal = String.raw`\mu = \dfrac{1}{n} \sum_{i=1}^{n} x_i`;
	const inertieDecomposition = String.raw`I = \sum_{i=1}^{n} \lVert x_i - \mu \rVert^2 = \sum_{k=1}^{K} \sum_{x_i \in \mathcal{C}_k} \lVert x_i - \mu_k \rVert^2 + \sum_{k=1}^{K} |\mathcal{C}_k| \, \lVert \mu_k - \mu \rVert^2`;
	const inertieIntra = String.raw`I_W = \sum_{k=1}^{K} \sum_{x_i \in \mathcal{C}_k} \lVert x_i - \mu_k \rVert^2`;
	const inertieInter = String.raw`I_B = \sum_{k=1}^{K} |\mathcal{C}_k| \, \lVert \mu_k - \mu \rVert^2`;

	// Frame « Choix d'une partition » (argmin, nombre de Bell).
	const partitionOptimale = String.raw`\mathcal{C}^* = \arg\min_{K \in \{1, \dots, n\}} \; \min_{\mathcal{C}_1, \dots, \mathcal{C}_K} \; R(\mathcal{C}_1, \dots, \mathcal{C}_K)`;
	const nombreBell = String.raw`B_n = \dfrac{1}{e} \sum_{K \geq 1} \dfrac{K^n}{K !}`;

	// Frames « Distance entre deux clusters » (liens + Ward).
	const lienSimple = String.raw`d(\mathcal{C}_k, \mathcal{C}_\ell) = \min_{(x, y) \in \mathcal{C}_k \times \mathcal{C}_\ell} d(x, y)`;
	const lienComplet = String.raw`d(\mathcal{C}_k, \mathcal{C}_\ell) = \max_{(x, y) \in \mathcal{C}_k \times \mathcal{C}_\ell} d(x, y)`;
	const lienMoyen = String.raw`d(\mathcal{C}_k, \mathcal{C}_\ell) = \dfrac{1}{|\mathcal{C}_k|} \, \dfrac{1}{|\mathcal{C}_\ell|} \sum_{x \in \mathcal{C}_k} \sum_{y \in \mathcal{C}_\ell} d(x, y)`;
	const lienCentroidal = String.raw`d(\mathcal{C}_k, \mathcal{C}_\ell) = d(\mu_k, \mu_\ell)`;
	const distanceWard = String.raw`d(\mathcal{C}_k, \mathcal{C}_\ell) = \dfrac{|\mathcal{C}_k| \, |\mathcal{C}_\ell|}{|\mathcal{C}_k| + |\mathcal{C}_\ell|} \, \lVert \mu_k - \mu_\ell \rVert^2`;

	// ── Panneau expert : single-linkage, MST, consistance de Hartigan ──
	// Cadrage interne (non visible) : la section « Clustering hiérarchique » de
	// course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex enseigne les
	// liaisons de façon algorithmique et énonce la proposition Ward sans preuve ;
	// la structure MST et la consistance de Hartigan n'y figurent pas.
	// Sources : Gower & Ross (1969), JRSS-C 18(1):54–64 ; Hartigan (1975) et
	// (1981), JASA 76(374):388–394 ; Penrose (1995), J. Multivariate Analysis
	// 53:94–109 ; Ward (1963), JASA 58(301):236–244 ; Sibson (1973), Computer
	// Journal 16(1):30–34 ; Lance & Williams (1966), Computer Journal
	// 9(4):373–380 (cf. expert/part3/lesson1/single-linkage-mst-hartigan.research.md).
	const grapheSeuil = String.raw`G_t = (V, E_t), \qquad E_t = \{ (i, j) : d(x_i, x_j) \le t \}`;
	const slLecture = String.raw`\text{clusters au seuil } t \;=\; \text{composantes connexes de } G_t`;
	const niveauFusion = String.raw`\lambda(A, B) = \max_{e \, \in \, \mathrm{chemin}_T(A, B)} \; w(e)`;
	const identiteMinimax = String.raw`\max_{e \, \in \, \mathrm{chemin}_T(i, j)} w(e) \;=\; \min_{P} \; \max_{e \in P} \; w(e)`;
	const inertieEnsemble = String.raw`I(S) = \sum_{x \in S} \lVert x - c_S \rVert^2, \qquad c_S = \dfrac{1}{|S|} \sum_{x \in S} x`;
	const lemmeInertie = String.raw`I(A \cup B) = I(A) + I(B) + \dfrac{|A| \, |B|}{|A| + |B|} \, \lVert c_A - c_B \rVert^2`;
	const rapportDensite = String.raw`\dfrac{\inf_{x \, \in \, A \cup A'} f(x)}{\sup_{P \, : \, A \to A'} \; \inf_{x \in P} \, f(x)}`;
	const gapObserve = String.raw`g_n = \min_{\text{inter}} d \;-\; \max_{\text{intra}} d`;
	const lanceWilliamsSingle = String.raw`d(S, A \cup B) = \min\big(d(S, A), \; d(S, B)\big)`;

	// Frame « Choix du nombre de clusters ».
	const seuilAlpha = String.raw`r = \alpha \cdot \max_{(x, y) \in \{x_1, \dots, x_n\}} d(x, y)`;

	// ── Quiz ──
	const quiz = getQuizQuestions('p3/l1');
</script>

<svelte:head>
	<title
		>{meta?.title ?? 'Clustering hiérarchique'} — Fondations de l'Apprentissage Statistique</title
	>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Clustering hiérarchique'}
	subtitle="Distances, partitionnement hiérarchique et dendrogrammes"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Clustering : objectif et exemples</h2>

		<p>
			<strong>Contexte :</strong> on observe des <strong>données</strong>
			<KatexInline formula={String.raw`x_1, \dots, x_n \in \mathcal{X}`} /> pour
			<KatexInline formula="n" /> individus mais <strong>sans étiquettes</strong> associées (on dit qu'elles
			sont non étiquetées).
		</p>
		<p>
			<strong>Objectif :</strong> séparer les données en sous-groupes homogènes, appelés
			<strong>clusters</strong>
			<KatexInline formula={partitionObjet} />. Cela permet d'extraire de l'information sur les
			données et de mieux comprendre leurs caractéristiques générales : c'est une
			<strong>analyse exploratoire des données</strong>.
		</p>
		<Callout type="note" title="Origine du cours">
			Ce cours s'inspire très largement de l'ouvrage
			<em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</Callout>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img src={asset('/images/part3/genesGroupes.png')} alt="Gènes regroupés par clusters" />
				<figcaption>
					Identification de gènes similaires : permet de faire des hypothèses sur le rôle des gènes.
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img src={asset('/images/part3/segmentation.png')} alt="Segmentation de marché" />
				<figcaption>
					Segmentation de marché : identifier des groupes d'usagers au comportement similaire afin
					de mieux comprendre leur profil.
				</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Images tirées d'une présentation donnée par Chloé-Agathe Azencott en 2019 aux Mines de Paris
			(Fontainebleau).
		</p>

		<h3>Autres applications</h3>

		<p><strong>Compression d'image :</strong></p>
		<figure class="lesson-figure wide">
			<div class="triple-img">
				<figure class="lesson-figure">
					<img src={asset('/images/part3/compr.png')} alt="Version originale" />
					<figcaption>Image originale</figcaption>
				</figure>
				<figure class="lesson-figure">
					<img src={asset('/images/part3/compr2.png')} alt="Version compressée (16 couleurs)" />
					<figcaption>Image compressée (16 couleurs)</figcaption>
				</figure>
				<figure class="lesson-figure">
					<img src={asset('/images/part3/compr3.png')} alt="Version compressée (4 couleurs)" />
					<figcaption>Image compressée (4 couleurs)</figcaption>
				</figure>
			</div>
		</figure>
		<p class="attribution">
			Image tirée du site
			<a
				href="https://towardsdatascience.com/image-compression-using-k-means-clustering-aa0c91bb0eeb"
				>Towards Data Science</a
			>.
		</p>

		<p><strong>Annotation d'un corpus de texte :</strong></p>
		<figure class="lesson-figure">
			<img src={asset('/images/part3/texte.jpg')} alt="Corpus de textes regroupés par sujet" />
			<figcaption>
				En regroupant automatiquement les textes par sujet, on détermine les sujets abordés par les
				textes d'un même cluster en n'en lisant que quelques-uns.
			</figcaption>
		</figure>
		<p class="attribution">
			Image tirée du site
			<a
				href="https://fr.dreamstime.com/illustration-stock-remettez-dessin-du-texte-des-graphiques-papier-feuille-image81266457"
				>Dreamstime</a
			>.
		</p>

		<Callout type="intuition" title="Un problème non supervisé">
			Pas d'étiquettes : le clustering est un <strong>apprentissage non supervisé</strong>
			(contrairement à la Partie II). Il n'existe pas de partition « vraie » : c'est le choix de la distance
			et du critère qui définit la qualité du résultat — le fil rouge de cette leçon.
		</Callout>

		<h2 id="distances">Choix d'une distance</h2>

		<p>
			<strong>Objectif :</strong> séparer les données en sous-groupes, appelés
			<strong>clusters</strong>, tels que chaque cluster soit le plus <strong>homogène</strong>
			possible et que les clusters entre eux soient les plus
			<strong>distincts</strong>/<strong>séparés</strong> possible : on souhaite que les individus similaires
			soient dans le même cluster et que les individus dissimilaires soient dans des clusters différents.
		</p>
		<p>
			<strong>Question :</strong> comment mesurer la distance entre deux individus ? On la mesure à
			l'aide d'une fonction <KatexInline formula="d" /> appelée <strong>distance</strong>.
		</p>

		<DefinitionBlock title="Distance">
			<p>
				Soit un ensemble <KatexInline formula={String.raw`\mathcal{X}`} />. Une fonction
				<KatexInline formula={distanceDef} /> est appelée <em>distance</em> si elle vérifie les propriétés
				suivantes :
			</p>
			<ul>
				<li>
					<KatexInline formula={distanceSymetrie} /> <strong>(Symétrie)</strong> ;
				</li>
				<li>
					<KatexInline formula={distanceSeparation} /> <strong>(Séparation)</strong> ;
				</li>
				<li>
					<KatexInline formula={distanceTriangulaire} />
					<strong>(Inégalité triangulaire)</strong>.
				</li>
			</ul>
		</DefinitionBlock>

		<h3>Variables quantitatives</h3>

		<p>
			<KatexInline
				formula={String.raw`x = (x_1, \dots, x_d), \; y = (y_1, \dots, y_d) \in \mathbb{R}^d`}
			/>
			: variables <strong>quantitatives</strong>. Exemples de distances :
		</p>
		<ul>
			<li>
				<strong>Euclidienne</strong> — <KatexInline formula={distanceEuclidienne} /> ;
			</li>
			<li>
				<strong>Manhattan</strong> — <KatexInline formula={distanceManhattan} /> ;
			</li>
			<li>
				<strong>Minkowski</strong> — <KatexInline formula={distanceMinkowski} />, avec
				<KatexInline formula={String.raw`p \in \mathbb{R}^*`} /> ;
			</li>
			<li>
				<strong>Chebyshev</strong> — <KatexInline formula={distanceChebyshev} /> ;
			</li>
			<li>
				<strong>Mahalanobis</strong> — <KatexInline formula={distanceMahalanobis} />, avec
				<KatexInline formula={String.raw`\Sigma`} /> : matrice de variance-covariance empirique.
			</li>
		</ul>
		<Callout type="note" title="Remarque">
			On considère souvent la distance euclidienne, que l'on notera plus simplement
			<KatexInline formula={String.raw`\lVert \cdot \rVert`} /> par la suite.
		</Callout>

		<h3>Variables qualitatives ou mixtes</h3>

		<p>
			<KatexInline formula={String.raw`x = (x_1, \dots, x_d), \; y = (y_1, \dots, y_d)`} /> : variables
			<strong>qualitatives</strong>. Exemple de distances : distance du
			<KatexInline formula={String.raw`\chi^2`} />, distance de Jaccard, distance de Gower.
		</p>
		<Callout type="note" title="Remarque">
			Ces distances ne sont pas des distances au sens mathématique : la distance du
			<KatexInline formula={String.raw`\chi^2`} /> ne respecte par exemple pas la propriété de symétrie.
		</Callout>
		<p>
			Variables <strong>mixtes</strong> (quantitatives et qualitatives) : stratégies possibles :
		</p>
		<ul>
			<li>rendre les variables quantitatives qualitatives (découpage en classes) ;</li>
			<li>rendre les variables qualitatives quantitatives (ex. : encodage one-hot) ;</li>
			<li>
				rendre toutes les variables qualitatives puis faire une analyse des correspondances
				multiples (ACM) et considérer les coordonnées (quantitatives) des individus dans les
				nouveaux axes.
			</li>
		</ul>

		<InteractiveSection
			number="1.1"
			title="Paysage des distances"
			onInteract={tracker.trackInteraction}
		>
			<DistanceLandscape />
		</InteractiveSection>
		<p>
			Glissez les deux points, changez la norme : la boule unité et la valeur de
			<KatexInline formula={String.raw`d(x, y)`} /> changent. La distance de Mahalanobis prend en compte
			la structure de covariance <KatexInline formula={String.raw`\Sigma`} />.
		</p>

		<h2 id="criteres">Mesurer une bonne partition</h2>

		<p>
			<strong>Question :</strong> une fois la distance choisie, quelle partition (clustering) choisir
			? Deux stratégies opposées :
		</p>
		<ul>
			<li>
				ne pas séparer les points proches l'un de l'autre
				<em>(ex. : le clustering hiérarchique avec lien simple)</em> ;
			</li>
			<li>
				ne pas avoir des points trop éloignés dans le même cluster
				<em>(ex. : l'algorithme des 2-moyennes)</em>.
			</li>
		</ul>
		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img
					src={asset('/images/part3/clusterligne1.png')}
					alt="Clustering hiérarchique à lien simple sur deux lignes de points"
				/>
				<figcaption>
					Stratégie de ne pas séparer les points proches l'un de l'autre (clustering hiérarchique à
					lien simple).
				</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img
					src={asset('/images/part3/clusterligne2.png')}
					alt="2-moyennes sur deux lignes de points"
				/>
				<figcaption>
					Stratégie de ne pas avoir des points trop éloignés dans le même cluster (2-moyennes).
				</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Figure tirée de l'ouvrage <em>Understanding Machine Learning: From Theory to Algorithms</em>
			(Shalev-Shwartz &amp; Ben-David).
		</p>
		<p>
			On voudrait choisir la partition qui minimise un certain critère (à choisir) qui dépend de
			l'homogénéité et de la séparabilité des clusters.
		</p>

		<DefinitionBlock title="Centroïde d'un cluster">
			<p>
				On appelle <em>centroïde</em> du cluster <KatexInline formula={String.raw`\mathcal{C}`} />
				le point défini par
			</p>
			<KatexBlock formula={centroide} />
			<p>
				avec <KatexInline formula={String.raw`|\mathcal{C}|`} /> le nombre d'observations dans
				<KatexInline formula={String.raw`\mathcal{C}`} />.
			</p>
		</DefinitionBlock>

		<p>
			Le fait que des observations proches appartiennent au même cluster peut se traduire par la
			notion d'homogénéité.
		</p>
		<DefinitionBlock title="Homogénéité">
			<p>
				On appelle <em>homogénéité</em> du cluster <KatexInline
					formula={String.raw`\mathcal{C}_k`}
				/>
				(<em>tightness</em> en anglais) la moyenne des distances des observations de ce cluster à
				son centroïde <KatexInline formula={String.raw`\mu_k`} /> :
			</p>
			<KatexBlock formula={homogeneite} />
			<p>
				L'<em>homogénéité globale</em> d'un clustering <KatexInline
					formula={String.raw`\mathcal{D}`}
				/>
				de taille <KatexInline formula="K" /> est donnée par
			</p>
			<KatexBlock formula={homogeneiteGlobale} />
			<p>
				<strong>Remarque :</strong> on souhaite <KatexInline formula="T" /> le plus petit possible.
			</p>
		</DefinitionBlock>
		<figure class="lesson-figure">
			<img
				src={asset('/images/part3/homogene.png')}
				alt="Illustration de l'homogénéité d'un cluster"
			/>
			<figcaption>Illustration de l'homogénéité d'un cluster.</figcaption>
		</figure>
		<p class="attribution">
			Image tirée de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</p>

		<p>
			Pour quantifier à quel point les clusters sont distants les uns des autres, nous pouvons
			utiliser le critère de séparabilité.
		</p>
		<DefinitionBlock title="Séparabilité">
			<p>
				On appelle <em>séparabilité</em> des clusters <KatexInline
					formula={String.raw`\mathcal{C}_k`}
				/>
				et <KatexInline formula={String.raw`\mathcal{C}_\ell`} /> la distance entre leurs centroïdes :
			</p>
			<KatexBlock formula={separabilite} />
			<p>
				La <em>séparabilité globale</em> d'un clustering <KatexInline
					formula={String.raw`\mathcal{D}`}
				/>
				de taille <KatexInline formula="K" /> se calcule comme la moyenne des séparabilités des clusters
				deux à deux :
			</p>
			<KatexBlock formula={separabiliteGlobale} />
			<p>
				<strong>Remarque :</strong> on souhaite <KatexInline formula="S" /> le plus élevé possible.
			</p>
		</DefinitionBlock>
		<figure class="lesson-figure">
			<img
				src={asset('/images/part3/separabilite.png')}
				alt="Illustration de la séparabilité entre deux clusters"
			/>
			<figcaption>Illustration de la séparabilité entre deux clusters.</figcaption>
		</figure>
		<p class="attribution">
			Image tirée de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</p>

		<DefinitionBlock title="Indice de Davies-Bouldin">
			<p>
				On appelle <em>indice de Davies-Bouldin</em> du cluster <KatexInline
					formula={String.raw`\mathcal{C}_k`}
				/>
				la valeur
			</p>
			<KatexBlock formula={daviesBouldin} />
			<p>
				Cela revient donc à regarder le « pire des cas » en termes d'homogénéité et de séparabilité.
				L'<em>indice de Davies-Bouldin global</em> d'un clustering
				<KatexInline formula={String.raw`\mathcal{D}`} /> de taille
				<KatexInline formula="K" /> se calcule comme la moyenne des indices de Davies-Bouldin des clusters
				:
			</p>
			<KatexBlock formula={daviesBouldinGlobal} />
			<p>
				<strong>Objectif :</strong> on souhaite trouver le clustering
				<KatexInline formula={String.raw`\mathcal{D}`} /> qui minimise
				<KatexInline formula="D" />.
			</p>
		</DefinitionBlock>

		<DefinitionBlock title="Coefficient de silhouette">
			<p>
				On appelle <strong>coefficient de silhouette</strong> de l'observation
				<KatexInline formula={String.raw`x \in \{x_1, \dots, x_n\}`} /> la valeur
			</p>
			<KatexBlock formula={silhouette} />
			<p>avec</p>
			<KatexBlock formula={silhouetteA} />
			<KatexBlock formula={silhouetteB} />
			<p>
				c'est-à-dire que <KatexInline formula={String.raw`a(x)`} /> est la distance moyenne de
				<KatexInline formula="x" /> à tous les autres éléments du cluster
				<KatexInline formula={String.raw`\mathcal{C}_{k(x)}`} /> auquel il appartient, et
				<KatexInline formula={String.raw`b(x)`} /> est la plus petite valeur que pourrait prendre
				<KatexInline formula={String.raw`a(x)`} /> si <KatexInline formula="x" /> appartenait à un autre
				cluster. Le <em>coefficient de silhouette global</em> se calcule comme la moyenne des coefficients
				de silhouette :
			</p>
			<KatexBlock formula={silhouetteGlobal} />
			<p>
				<strong>Remarque :</strong> le coefficient de silhouette de
				<KatexInline formula="x" /> est d'autant plus proche de 1 que son assignation au cluster
				<KatexInline formula={String.raw`\mathcal{C}_{k(x)}`} /> est satisfaisante.
			</p>
			<p>
				<strong>Objectif :</strong> on souhaite trouver le clustering
				<KatexInline formula={String.raw`\mathcal{D}`} /> qui maximise
				<KatexInline formula="s" />.
			</p>
		</DefinitionBlock>

		<h3>Inertie intra et inter classes</h3>

		<p>
			<strong>Contexte :</strong> on observe des données
			<KatexInline formula={String.raw`x_1, \dots, x_n \in \mathbb{R}^d`} />. On note
			<KatexInline formula={muGlobal} /> et on considère la distance euclidienne.
		</p>
		<p>
			On peut également quantifier la notion d'homogénéité et de séparabilité d'un clustering
			<KatexInline formula={String.raw`\mathcal{D}`} /> de taille
			<KatexInline formula="K" /> de
			<KatexInline formula={String.raw`\{x_1, \dots, x_n\}`} /> à travers la notion d'
			<em>inertie</em> donnée par
		</p>
		<KatexBlock formula={inertieDecomposition} />
		<p>Aussi, <KatexInline formula="I" /> se décompose en deux parties :</p>
		<ul>
			<li>
				<KatexInline formula={inertieIntra} /> : <strong>inertie intra-classes</strong> qui mesure l'homogénéité
				au sein des classes ;
			</li>
			<li>
				<KatexInline formula={inertieInter} /> : <strong>inertie inter-classes</strong> qui mesure l'hétérogénéité
				entre les classes, c'est-à-dire à quel point les classes sont bien séparées.
			</li>
		</ul>
		<p>
			<strong>Objectif :</strong> on souhaite trouver le clustering
			<KatexInline formula={String.raw`\mathcal{D}`} /> qui maximise
			<KatexInline formula="I_B" /> ou, de manière équivalente, qui minimise
			<KatexInline formula="I_W" />.
		</p>
		<Callout type="note" title="Remarque">
			Le poids <KatexInline formula={String.raw`|\mathcal{C}_k|`} /> dans
			<KatexInline formula="I_B" /> prend en compte la taille des clusters.
		</Callout>

		<InteractiveSection
			number="1.2"
			title="Homogénéité vs séparabilité"
			onInteract={tracker.trackInteraction}
		>
			<PartitionCriteriaExplorer />
		</InteractiveSection>
		<p>
			Cliquez sur un point pour le passer dans le cluster suivant :
			<KatexInline formula="T" />, <KatexInline formula="S" />,
			<KatexInline formula="D" />, <KatexInline formula="s" />,
			<KatexInline formula="I_W" />, <KatexInline formula="I_B" />,
			<KatexInline formula="I" /> réagissent en direct.
		</p>

		<Callout type="intuition" title="Un jeu d'équilibre">
			L'homogénéité et la séparabilité sont en tension : faire des clusters très petits augmente
			l'homogénéité mais fait chuter la séparabilité. La décomposition
			<KatexInline formula={String.raw`I = I_W + I_B`} />, avec
			<KatexInline formula="I" /> indépendant de la partition, rend ce compromis précis.
		</Callout>

		<h2 id="partitions">Choisir une partition</h2>

		<p>
			<strong>Contexte :</strong> on souhaite partitionner des données
			<KatexInline formula={String.raw`x_1, \dots, x_n \in \mathcal{X}`} />. On voudrait choisir la
			partition <KatexInline formula={String.raw`\mathcal{C}^*`} /> qui minimise un certain critère
			<KatexInline formula="R" /> (à choisir) qui dépend de l'homogénéité et de la séparabilité des clusters
			:
		</p>
		<KatexBlock formula={partitionOptimale} />
		<p>
			avec <KatexInline formula={String.raw`R(\mathcal{C}_1, \dots, \mathcal{C}_K)`} /> l'indice de Davies-Bouldin
			global, le coefficient de silhouette global — que l'on cherchera alors à maximiser — ou la variance
			intra-classes du clustering
			<KatexInline formula={String.raw`\mathcal{D} = \{\mathcal{C}_1, \dots, \mathcal{C}_K\}`} />.
		</p>

		<Callout type="warning" title="Trop de partitions possibles">
			Le nombre de partitions possibles <KatexInline formula={String.raw`B_n`} />, appelé
			<strong>nombre de Bell</strong>, est trop grand ; on ne peut pas explorer toutes les
			possibilités :
			<KatexInline formula={nombreBell} />
			Les diapositives indiquent
			<KatexInline formula={String.raw`B_{50} \geq 10^{48}`} />.
		</Callout>

		<Callout type="note" title="À propos de B₅₀">
			Les diapositives indiquent <KatexInline formula={String.raw`B_{50} \geq 10^{48}`} />. La
			valeur exacte est
			<KatexInline
				formula={String.raw`B_{50} = 185\,724\,268\,771\,078\,270\,438\,257\,767\,181\,908\,917\,499\,221\,852\,770 \approx 1{,}86 \cdot 10^{47}`}
			/>
			: l'ordre de grandeur reste astronomique, mais l'inégalité exacte est
			<KatexInline formula={String.raw`B_{50} \geq 10^{47}`} />.
		</Callout>

		<p>
			On va donc utiliser des <strong>algorithmes itératifs</strong> qui visent à explorer un sous-ensemble
			de partitions dans lequel on espère que se trouve la partition optimale.
		</p>

		<h3>Stratégies itératives</h3>

		<p>Différents algorithmes itératifs existent, dont les plus courants :</p>
		<ul>
			<li>
				les algorithmes agglomératifs ou divisifs : la <strong>classification hiérarchique</strong>
				;
			</li>
			<li>
				les algorithmes par partitionnement : les <strong>K-moyennes</strong> ;
			</li>
			<li>
				les algorithmes probabilistes : les <strong>modèles de mélange</strong>.
			</li>
		</ul>

		<InteractiveSection number="1.3" title="Nombres de Bell" onInteract={tracker.trackInteraction}>
			<BellNumberGrowth />
		</InteractiveSection>
		<p>
			La croissance de <KatexInline formula={String.raw`B_n`} /> rend l'exploration exhaustive impossible
			dès <KatexInline formula="n" /> modéré : d'où le recours aux algorithmes itératifs.
		</p>

		<h2 id="cah">Principe du clustering hiérarchique</h2>

		<p>
			Le <strong>clustering hiérarchique</strong> est un algorithme itératif qui propose une
			partition des données
			<KatexInline formula={String.raw`\{x_1, \dots, x_n\}`} /> pour toute taille
			<KatexInline formula={String.raw`k \in \{1, \dots, n\}`} /> possible de partition. Cet algorithme
			fonctionne par <strong>récurrence</strong> : chaque nouvelle partition est obtenue à partir de l'ancienne
			partition.
		</p>
		<p><strong>Deux stratégies :</strong></p>
		<ul>
			<li>
				<strong>Clustering agglomératif</strong> : initialement, chaque observation forme un cluster
				de taille 1. À chaque itération de l'algorithme, on trouve les deux clusters les plus
				proches, et on les agglomère en un seul cluster, et ce jusqu'à ne plus avoir qu'un unique
				cluster contenant les <KatexInline formula="n" /> observations.
			</li>
			<li>
				<strong>Clustering divisif</strong> : initialement, toutes les observations sont dans un
				même cluster de taille <KatexInline formula="n" />. À chaque itération, on sépare un cluster
				en deux jusqu'à ce que chaque cluster ne contienne plus qu'une seule observation.
			</li>
		</ul>
		<Callout type="insight" title="Focus">
			Par la suite, on s'intéresse au <strong>clustering agglomératif</strong>, aussi appelé
			<strong>classification ascendante hiérarchique</strong> (CAH).
		</Callout>
		<p>
			<strong>Question :</strong> comment mesurer la distance entre deux clusters ?
		</p>

		<h2 id="liaisons">Distance entre deux clusters</h2>

		<p>
			Soit <KatexInline formula={String.raw`\mathcal{C}_k`} /> et
			<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> deux clusters. Exemples de distance/dissimilarité
			entre <KatexInline formula={String.raw`\mathcal{C}_k`} /> et
			<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> :
		</p>
		<ul>
			<li>
				<strong>lien simple</strong> : <KatexInline formula={lienSimple} /> —
				<KatexInline formula={String.raw`\mathcal{C}_k`} /> et
				<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> sont agglomérés si deux de leurs éléments
				sont proches ;
			</li>
			<li>
				<strong>lien complet</strong> : <KatexInline formula={lienComplet} /> —
				<KatexInline formula={String.raw`\mathcal{C}_k`} /> et
				<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> sont agglomérés si tous leurs éléments
				sont proches ;
			</li>
			<li>
				<strong>lien moyen</strong> : <KatexInline formula={lienMoyen} /> —
				<KatexInline formula={String.raw`\mathcal{C}_k`} /> et
				<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> sont agglomérés si la distance moyenne
				entre un élément de <KatexInline formula={String.raw`\mathcal{C}_k`} /> et un élément de <KatexInline
					formula={String.raw`\mathcal{C}_\ell`}
				/> est faible ;
			</li>
			<li>
				<strong>lien centroïdal</strong> : <KatexInline formula={lienCentroidal} /> —
				<KatexInline formula={String.raw`\mathcal{C}_k`} /> et
				<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> sont agglomérés si la distance entre leurs
				centroïdes est faible.
			</li>
		</ul>
		<Callout type="note" title="Remarque">
			Ces distances s'attachent à garantir la séparabilité des clusters. Ce ne sont pas forcément
			des distances au sens mathématique : par exemple, pour le lien complet,
			<KatexInline formula={String.raw`d(\mathcal{C}_k, \mathcal{C}_k) \neq 0`} /> si
			<KatexInline formula={String.raw`|\mathcal{C}_k| > 1`} />.
		</Callout>

		<p><strong>Distance de Ward :</strong></p>
		<KatexBlock formula={distanceWard} />
		<TheoremBlock title="Proposition">
			<p>
				La distance de Ward <KatexInline formula={String.raw`d(\mathcal{C}_k, \mathcal{C}_\ell)`} />
				correspond au <strong>gain de variance intra-classe</strong> (de manière équivalente, à la
				perte d'inertie inter-classes) lorsque l'on fusionne les classes
				<KatexInline formula={String.raw`\mathcal{C}_k`} /> et
				<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> pour passer de
				<KatexInline formula="K" /> à <KatexInline formula={String.raw`K - 1`} /> classes.
			</p>
			<p>
				Ainsi, <KatexInline formula={String.raw`\mathcal{C}_k`} /> et
				<KatexInline formula={String.raw`\mathcal{C}_\ell`} /> sont agglomérés si la fusion de ces deux
				clusters minimise le gain de variance intra-classe de la nouvelle partition : on maximise l'homogénéité.
			</p>
		</TheoremBlock>
		<Callout type="note" title="Remarque">
			<p>
				La distance de Ward maximise aussi la séparabilité entre les clusters, puisqu'elle minimise
				la perte de variance inter-classe.
			</p>
			<p>
				La distance de Ward prend en compte les effectifs des groupes : création de groupes
				équilibrés. (Les diapositives illustrent cette remarque par une figure qui n'est pas
				reproduite sur le site.)
			</p>
		</Callout>

		<ExpertPanel title="Single-linkage, arbres couvrants minimaux et consistance de Hartigan">
			<p>
				La leçon a présenté quatre critères de liaison comme des recettes : à chaque étape,
				fusionner la paire de clusters la plus proche au sens du critère. Deux questions
				naturelles restent sans réponse. <em>Pourquoi</em> le single-linkage fusionne-t-il « si
				tôt » (le défaut de « chaînage », illustré en fin de panneau), et <em>que vaut</em> le
				dendrogramme qu'il produit ? La réponse surprenante est que le single-linkage n'est pas
				seulement un algorithme glouton : c'est l'unique liaison qui encode un objet
				mathématique exact — un <strong>arbre couvrant minimal</strong> — et c'est précisément
				cette structure qui lui donne un résultat de <strong>consistance</strong> (Hartigan
				1975, 1981) que les autres liaisons n'ont pas. On en profite pour prouver la proposition
				Ward ci-dessus, énoncée sans preuve : la distance de Ward n'est rien d'autre que
				l'augmentation exacte de l'inertie intra-clusters causée par la fusion.
			</p>

			<p>
				Soient <KatexInline formula="n" /> points <KatexInline
					formula={String.raw`\{x_1, \dots, x_n\}`}
				/> et une distance <KatexInline formula="d" />. Pour un seuil <KatexInline
					formula={String.raw`t \ge 0`}
				/>, notons <KatexInline formula="G_t" /> le graphe simple sur
				<KatexInline formula="[n]" /> dont les arêtes sont les paires
				<KatexInline formula={String.raw`\{i, j\}`} /> avec <KatexInline
					formula={String.raw`d(x_i, x_j) \le t`}
				/> :
			</p>
			<KatexBlock formula={grapheSeuil} />
			<p>
				La partition du <strong>single-linkage</strong> au seuil
				<KatexInline formula="t" /> a une lecture immédiate : deux points sont dans le même
				cluster s'ils sont <strong>connectés</strong> dans
				<KatexInline formula="G_t" /> — c'est la clôture transitive de « deux éléments
				proches » :
			</p>
			<KatexBlock formula={slLecture} />

			<TheoremBlock title="Le single-linkage est un arbre couvrant minimal (Gower–Ross, 1969)">
				<p>
					Soit <KatexInline formula="T" /> un arbre couvrant minimal (MST) du graphe complet
					sur <KatexInline formula="[n]" /> pondéré par <KatexInline formula="d" />. Pour tout
					<KatexInline formula={String.raw`t \ge 0`} />, les composantes connexes de
					<KatexInline formula="G_t" /> sont exactement les composantes connexes du
					sous-graphe de <KatexInline formula="T" /> formé des arêtes de poids
					<KatexInline formula={String.raw`\le t`} />.
				</p>
				<p>
					<strong>Idée de la preuve.</strong> L'inclusion « arêtes du MST de poids
					<KatexInline formula={String.raw`\le t`} /> ⇒ arêtes de
					<KatexInline formula="G_t" /> » est triviale, donc chaque composante du sous-arbre
					est contenue dans une composante de <KatexInline formula="G_t" />. Réciproquement,
					soient <KatexInline formula="i, j" /> reliés par un chemin dans
					<KatexInline formula="G_t" />. On examine ce chemin arête par arête, dans l'ordre
					de Kruskal : si une arête <KatexInline formula={String.raw`e = \{u, v\}`} /> du
					chemin est <strong>rejetée</strong> par Kruskal, c'est que
					<KatexInline formula="u" /> et <KatexInline formula="v" /> sont déjà reliés dans la
					forêt en cours par un chemin d'arêtes <strong>acceptées</strong>, toutes de poids
					<KatexInline formula={String.raw`\le w(e)`} /> — Kruskal ne rejette que des arêtes
					dont les extrémités sont déjà connectées, et la forêt ne contient que des arêtes
					déjà traitées, donc de poids <KatexInline formula={String.raw`\le w(e)`} />. On
					remplace <KatexInline formula="e" /> dans le chemin par ce chemin : on ne dépasse
					jamais le poids de <KatexInline formula="e" />, donc on reste sous le seuil
					<KatexInline formula="t" />. À la fin, le chemin ne contient plus que des arêtes
					acceptées par Kruskal, c'est-à-dire des arêtes de <KatexInline formula="T" /> : les
					deux points sont reliés dans le MST sous le seuil.
					<KatexInline formula={String.raw`\square`} />
				</p>
			</TheoremBlock>

			<p>
				Deux conséquences immédiates. D'abord, le <strong>niveau de fusion</strong>
				<KatexInline formula={String.raw`\lambda(A, B)`} /> de deux clusters
				<KatexInline formula="A" /> et <KatexInline formula="B" /> dans le dendrogramme de
				single-linkage est le poids de la plus lourde arête du chemin unique de
				<KatexInline formula="T" /> reliant <KatexInline formula="A" /> à
				<KatexInline formula="B" /> :
			</p>
			<KatexBlock formula={niveauFusion} />
			<p>
				Ensuite, l'<strong>identité minimax</strong> : pour <KatexInline
					formula={String.raw`i \neq j`}
				/>, cette plus lourde arête coïncide avec le meilleur chemin possible au sens du goulot
				d'étranglement,
			</p>
			<KatexBlock formula={identiteMinimax} />
			<p>
				où le minimum parcourt tous les chemins <KatexInline formula="P" /> de
				<KatexInline formula="i" /> à <KatexInline formula="j" />.
				<em>Justification :</em> soit <KatexInline formula="e" /> la plus lourde arête du
				chemin de <KatexInline formula="T" /> entre <KatexInline formula="i" /> et
				<KatexInline formula="j" />, et <KatexInline formula="S" /> la composante de
				<KatexInline formula={String.raw`T \setminus e`} /> contenant
				<KatexInline formula="i" /> ; <KatexInline formula="e" /> est la plus légère arête
				traversant le cut <KatexInline
					formula={String.raw`(\,S, V \setminus S\,)`}
				/> (propriété du cut, conséquence de Kruskal), donc tout chemin de
				<KatexInline formula="i" /> à <KatexInline formula="j" /> traverse ce cut par une
				arête de poids <KatexInline formula={String.raw`\ge w(e)`} />, et le chemin de
				<KatexInline formula="T" /> montre que l'égalité est atteinte.
			</p>
			<p>
				Le <strong>chaînage</strong>, enfin, n'est plus une curiosité : la connexité dans
				<KatexInline formula="G_t" /> est transitive, donc une chaîne de paires de points
				proches — même mince, même formée de bruit — fusionne tous les clusters qu'elle
				touche. Le single-linkage ne mesure que la connexité d'un graphe de seuil, jamais la
				compacité ; on va voir que ce défaut a une conséquence plus grave encore : il fait
				tomber la consistance dès que la dimension vaut 2 ou plus.
			</p>

			<Callout type="proof" title="La proposition Ward, prouvée">
				<p>
					Pour un ensemble fini <KatexInline formula="S" />, notons
					<KatexInline formula={String.raw`c_S`} /> sa centroïde et
				</p>
				<KatexBlock formula={inertieEnsemble} />
				<p>son inertie intra (somme des carrés des écarts à la centroïde). Comme</p>
				<KatexBlock
					formula={String.raw`c_{A \cup B} = \dfrac{|A| \, c_A + |B| \, c_B}{|A| + |B|}`}
				/>
				<p>
					et que <KatexInline formula={String.raw`\sum_{x \in A} (x - c_A)`} /> est
					orthogonal à <KatexInline formula={String.raw`c_A - c_{A \cup B}`} /> (décomposition
					« axe parallèle »), on obtient
				</p>
				<KatexBlock formula={lemmeInertie} />
				<p>
					Fusionner <KatexInline formula="A" /> et <KatexInline formula="B" /> dans une
					partition augmente donc la somme des inerties intra-clusters
					<strong>exactement</strong> de la distance de Ward
					<KatexInline formula={String.raw`d_W^2(A, B)`} /> : le pas glouton de Ward, qui
					choisit la paire de plus petite distance de Ward, est exactement le pas qui
					minimise l'augmentation de variance intra-classe. Comme l'inertie totale
					<KatexInline
						formula={String.raw`\sum_x \lVert x - c \rVert^2`}
					/> (avec <KatexInline formula="c" /> la centroïde globale) est constante et
					s'écrit <KatexInline
						formula={String.raw`I_{\text{intra}} + I_{\text{inter}}`}
					/>, la perte d'inertie inter-classes est la même quantité — c'est la seconde
					formulation de la proposition. <strong>Nuance :</strong> le pas est
					<em>glouton</em> — il minimise l'augmentation à l'étape courante, sans aucune
					optimalité globale sur la suite des fusions ; la preuve ne promet jamais plus que
					cela.
				</p>
			</Callout>

			<p>
				Quel est le « vrai » regroupement d'une distribution de
				<KatexInline formula={String.raw`\mathbb{R}^d`} /> ? Hartigan (1975) propose une
				réponse géométrique : pour une densité <KatexInline formula="f" /> et un niveau
				<KatexInline formula={String.raw`\lambda`} />, les <strong>clusters denses</strong> de niveau
				<KatexInline formula={String.raw`\lambda`} /> sont les composantes connexes de la région
			</p>
			<KatexBlock
				formula={String.raw`\text{clusters denses de niveau } \lambda \;=\; \text{composantes connexes de } \{ x : f(x) \ge \lambda \}`}
			/>
			<p>
				Quand <KatexInline formula={String.raw`\lambda`} /> diminue, ces composantes apparaissent et
				fusionnent : on obtient une hiérarchie emboîtée, l'<strong>arbre de clusters de la
				densité</strong>. La question de consistance est alors : le dendrogramme de
				single-linkage, calculé sur un échantillon de taille
				<KatexInline formula="n" />, converge-t-il vers cet arbre quand
				<KatexInline formula={String.raw`n \to \infty`} /> ?
			</p>

			<TheoremBlock title="Consistance de Hartigan (1975, 1981)">
				<ol>
					<li>
						<strong>En dimension 1, oui</strong> : le single-linkage est consistant — le
						dendrogramme empirique converge vers l'arbre de clusters de la densité
						(Hartigan 1981).
					</li>
					<li>
						<strong>En dimension <KatexInline
							formula={String.raw`d \ge 2`}
						/>, non</strong> : Hartigan le montre par une réduction à la
						<em>percolation de continuum</em>, rendue formelle par Penrose (1995). Le
						mécanisme est celui du chaînage : deux hauts plateaux de densité peuvent être
						reliés par un col de densité positive mais petite ; dès que le seuil couvre le
						col, la connexité franchit le pont, et le cluster empirique englobe un morceau
						de la région voisine.
					</li>
					<li>
						<strong>Une version plus faible survit — la consistance fractionnaire</strong> :
						il suffit que le cluster empirique contienne un « morceau substantiel » de la
						région vraie et soit très proche du reste. Hartigan (1981) l'établit pour deux
						régions <KatexInline formula="A" />, <KatexInline formula="A'" /> dès que le
						rapport
					</li>
				</ol>
				<KatexBlock formula={rapportDensite} />
				<p>
					(densité sur les régions / pire densité le long des chemins qui les relient) est
					« suffisamment grand » ; <strong>Penrose (1995) referme l'écart : le seuil exact
					est</strong> <KatexInline formula={String.raw`> 1`} />.
				</p>
			</TheoremBlock>

			<TheoremBlock title="Deux populations bien séparées : le cas qu'on prouve soi-même">
				<p>
					Soient <KatexInline formula="P, Q" /> deux populations de
					<strong>support compact</strong>, à distance <KatexInline
						formula={String.raw`\delta > 0`}
					/> l'une de l'autre, et <KatexInline
						formula={String.raw`X_1, \dots, X_n`}
					/> i.i.d. de loi de support inclus dans
					<KatexInline formula={String.raw`P \cup Q`} />. Si <KatexInline
						formula={String.raw`D_{\max}`}
					/> majorise les distances intra-population, alors pour tout
					<KatexInline formula={String.raw`t`} /> avec <KatexInline
						formula={String.raw`D_{\max} < t < \delta`}
					/> : chaque population échantillonnée est une <strong>clique</strong> de
					<KatexInline formula="G_t" /> (toutes ses paires sont à distance
					<KatexInline formula={String.raw`\le D_{\max} < t`} />), et aucune arête ne relie
					<KatexInline formula="P" /> à <KatexInline formula="Q" /> (toutes les distances
					inter sont <KatexInline formula={String.raw`\ge \delta > t`} />). Les composantes de
					<KatexInline formula="G_t" /> sont donc <strong>exactement</strong> les deux
					populations — <strong>déterministiquement, pour tout échantillon et toute taille
					<KatexInline formula="n" /></strong> : aucune concentration n'est nécessaire. Le
					dendrogramme de single-linkage a alors pour dernière fusion la séparation
					<KatexInline formula={String.raw`P \mid Q`} /> : couper l'arbre à tout niveau de
					<KatexInline formula={String.raw`(D_{\max}, \delta)`} /> donne la vraie
					partition.
				</p>
				<p>
					<strong>Et si le support n'est pas compact ?</strong> C'est ici que l'intuition
					trahit. Pour deux blobs gaussiens d'écart-type <KatexInline formula={String.raw`\sigma`} /> et
					de centre à distance <KatexInline formula={String.raw`\delta`} />, la plus grande distance
					intra-croît comme <KatexInline
						formula={String.raw`O(\sigma \sqrt{\log n})`}
					/> tandis que la plus petite distance inter-décroît comme
					<KatexInline formula={String.raw`\delta - O(\sigma \sqrt{\log n})`} /> : le
					<em>gap observé</em>
				</p>
				<KatexBlock formula={gapObserve} />
				<p>
					<strong>se referme avec</strong> <KatexInline formula="n" />. Avec les paramètres
					des démonstrations de la leçon (<KatexInline
						formula={String.raw`\sigma = 0{,}7`}
					/> et <KatexInline formula={String.raw`\delta = 8`} />), une simulation seedée
					(50 réplicas par <KatexInline formula="n" />) donne
					<KatexInline
						formula={String.raw`\mathbb{P}(g_n > 0) = 1{,}00`}
					/> à <KatexInline formula="n = 10" />, <KatexInline
						formula={String.raw`0{,}68`}
					/> à <KatexInline formula="n = 100" /> et <KatexInline
						formula={String.raw`0{,}10`}
					/> seulement à <KatexInline formula="n = 300" /> : au-delà d'une centaine de
					points par blob, <strong>aucun seuil ne sépare plus les deux blobs</strong> — les
					queues gaussiennes font le pont, c'est le chaînage. La consistance de Hartigan
					n'est donc pas un énoncé sur « un seuil fixe » : c'est un énoncé sur la
					<strong>convergence du dendrogramme entier</strong> vers l'arbre de clusters de la
					densité, où l'index des niveaux est un <em>niveau de densité</em>
					<KatexInline formula={String.raw`\lambda`} /> (et non une distance), avec un seuil
					d'échantillon qui dépend de <KatexInline formula="n" />. En
					<KatexInline formula="d = 1" /> cette convergence a lieu (Hartigan 1981) ; en
					<KatexInline formula={String.raw`d \ge 2`} /> elle échoue (Penrose 1995) — le pont
					de densité positive est le même objet que la chaîne de points ci-dessus.
				</p>
				<p>
					C'est exactement ce phénomène — le franchissement des cols — que des versions
					<strong>robustes</strong> du single-linkage corrigent : Wishart (1969) ne connecte
					un point que s'il a au moins <KatexInline formula="k" /> voisins à distance
					<KatexInline formula={String.raw`\le r`} /> (ce qui ignore les ponts minces), et
					Chaudhuri–Dasgupta (2010) rendent cette idée consistante avec deux paramètres
					<KatexInline formula={String.raw`(k, \alpha)`} />.
				</p>
			</TheoremBlock>

			<Callout type="intuition" title="Pourquoi pas complete/average ? Et la complexité ?">
				<p>
					<strong>Pas de caractérisation comparable.</strong> Dans la littérature
					consultée, aucune identité de type MST ne s'attache au lien complet
					(<KatexInline formula={String.raw`d_{\max}`} />) ou au lien moyen (UPGMA) ; et ce qui est vrai
					en sens inverse est plus fort : <strong>c'est le single-linkage qui est
					unique</strong>. Carlsson & Mémoli (2010) montrent que parmi les méthodes
					hiérarchiques agglomératives, le single-linkage est la seule à satisfaire
					simultanément trois axiomes naturels (dont la <em>fonctorialité</em>, analogue d'un
					des axiomes de Kleinberg 2003 — qui prouve lui-même qu'aucune méthode ne peut
					satisfaire tous ses axiomes). Le single-linkage n'est pas « le meilleur » critère :
					c'est le seul dont la structure soit <em>exacte</em>, et c'est ce qui le rend
					analysable (MST, consistance) quand les autres restent des heuristiques. Côté
					comportement, le lien complet est anti-chaining mais biaise vers des clusters
					globulaires de taille comparable ; le lien moyen est un compromis plus robuste que
					le single-linkage, au même biais globulaire.
				</p>
				<p>
					<strong>Complexité.</strong> La leçon comptait
					<KatexInline formula="O(d n^2)" /> par itération (recalcul de toutes les distances
					de paires à chaque fusion). Trois améliorations classiques :
				</p>
				<ul>
					<li>
						<strong>récurrences de Lance–Williams (1966)</strong> : la distance d'un
						cluster <KatexInline formula="S" /> au nouveau cluster
						<KatexInline formula={String.raw`A \cup B`} /> s'écrit comme combinaison
						linéaire des distances <KatexInline formula={String.raw`d(S, A)`} /> et
						<KatexInline formula={String.raw`d(S, B)`} /> (coefficients dépendant du
						critère et des effectifs) ; pour le single-linkage, elle se réduit à
					</li>
				</ul>
				<KatexBlock formula={lanceWilliamsSingle} />
				<p>
					mise à jour en <KatexInline formula={String.raw`O(n)`} /> par fusion,
					<KatexInline formula={String.raw`O(d n^2)`} /> au total ;
				</p>
				<ul>
					<li>
						<strong>SLINK (Sibson, 1973)</strong> : pour le single-linkage seulement,
						<KatexInline formula={String.raw`O(n^2)`} /> temps et
						<KatexInline formula={String.raw`O(n)`} /> mémoire — on n'a même pas besoin de
						la matrice de distances complète ;
					</li>
					<li>
						<strong>par le MST</strong> : Prim sur le graphe complet (matrice de
						distances) en <KatexInline formula={String.raw`O(n^2)`} />, puis Kruskal sur
						les <KatexInline formula={String.raw`n - 1`} /> arêtes de l'arbre en
						<KatexInline formula={String.raw`O(n \log n)`} /> — le théorème ci-dessus
						transforme la construction du dendrogramme en deux problèmes de graphes
						classiques (le lien complet a son algorithme analogue, CLINK, de Defays 1977,
						en <KatexInline formula={String.raw`O(n^2)`} />).
					</li>
				</ul>
				<p>
					<strong>Contraste spectral.</strong> Le MST réapparaît dans le clustering spectral
					(plus tard dans le cours) — mais seulement pour <em>caler le paramètre</em> du
					graphe de <KatexInline formula={String.raw`\varepsilon`} />-voisins (von Luxburg 2007) :
					aucune consistance hiérarchique n'y est en jeu. L'apparition du MST en
					single-linkage est la seule qui donne une <em>preuve</em>.
				</p>
			</Callout>

			<DeferredDemo
				load={() => import('$lib/components/demos/SingleLinkageMstExplorer.svelte')}
				placeholder="Chargement de la démonstration MST…"
			/>
			<p>
				Trois paysages : deux disques à support compact (la proposition à deux populations —
				à tout seuil dans le gap, la partition est la vraie, pour tout échantillon), deux
				blobs gaussiens aux paramètres de la leçon (le gap observé se referme quand
				<KatexInline formula="n" /> croît), et une chaîne de points entre deux disques (le
				chaînage). Les arêtes vertes du MST sont celles de poids inférieur au seuil
				<KatexInline formula="t" /> : leur sous-graphe connexe est exactement le clusterage de
				single-linkage au seuil
				<KatexInline formula="t" /> — c'est le théorème de Gower–Ross qu'on lit dans la
				figure.
			</p>
		</ExpertPanel>

		<InteractiveSection number="1.4" title="CAH pas-à-pas" onInteract={tracker.trackInteraction}>
			<CahStepByStep />
		</InteractiveSection>
		<p>
			Suivez les fusions itération par itération, changez de liaison (le dendrogramme change
			radicalement, notamment sur le jeu « 2 lignes »), et déplacez la coupe
			<KatexInline formula="K" />.
		</p>

		<h2 id="dendrogramme">Dendrogramme</h2>

		<p>
			Le résultat d'un clustering hiérarchique (agglomératif ou divisif) peut se visualiser sous la
			forme d'un <strong>dendrogramme</strong>.
		</p>
		<figure class="lesson-figure">
			<img
				src={asset('/images/part3/dendogramme.png')}
				alt="Dendrogramme d'un clustering hiérarchique"
			/>
			<figcaption>Dendrogramme d'un clustering hiérarchique.</figcaption>
		</figure>
		<p class="attribution">
			Image tirée de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</p>
		<Callout type="note" title="Remarque">
			La longueur d'une branche de l'arbre est égale à la distance entre les deux clusters qu'elle
			connecte.
		</Callout>

		<h2 id="choix-k">Choix du nombre de clusters</h2>

		<p>
			L'un des atouts du clustering hiérarchique est qu'il ne requiert pas de spécifier au préalable
			le nombre de groupes : le dendrogramme permet d'explorer l'ensemble des partitions
			envisageables. Toutefois, il reste indispensable, à un moment donné, de déterminer le nombre
			de clusters retenus.
		</p>
		<p>Il y a différentes manières de choisir le nombre de clusters :</p>
		<ol>
			<li>
				On arrête de fusionner des clusters dès que la distance minimale entre les clusters dépasse
				un certain seuil <KatexInline formula={String.raw`r \in \mathbb{R}^*`} />. Ce seuil peut
				être choisi arbitrairement ou égal à <KatexInline formula={seuilAlpha} /> avec
				<KatexInline formula={String.raw`\alpha < 1`} />. On peut aussi faire cela visuellement en
				coupant le dendrogramme avant qu'une branche ne soit trop grande.
			</li>
			<li>
				On peut évaluer les différentes partitions trouvées, c'est-à-dire les différents nœuds du
				dendrogramme, à l'aide d'une mesure de performance (par ex. le coefficient de silhouette),
				et choisir la partition avec la meilleure performance.
			</li>
		</ol>

		<Callout type="warning" title="Complexité algorithmique">
			La complexité algorithmique du clustering hiérarchique est élevée : à chaque itération, pour
			décider quels clusters regrouper, il faut calculer les distances deux à deux entre toutes les
			paires possibles de
			<KatexInline formula={String.raw`\{x_1, \dots, x_n\}`} /> :
			<KatexInline formula={String.raw`O(dn^2)`} /> opérations.
		</Callout>

		<InteractiveSection
			number="1.5"
			title="Choix du nombre de clusters"
			onInteract={tracker.trackInteraction}
		>
			<ClusterCountExplorer />
		</InteractiveSection>
		<p>
			Fixez <KatexInline formula="K" /> ou un seuil <KatexInline formula="r" />, puis comparez la
			partition obtenue aux courbes du coefficient de silhouette (à maximiser) et de l'indice de
			Davies-Bouldin (à minimiser).
		</p>

		<h2 id="quiz">Quiz</h2>

		<Callout type="summary" title="Retenir">
			<ul>
				<li>
					Une distance <KatexInline formula={distanceDef} /> est symétrique, séparante et vérifie l'inégalité
					triangulaire ; variables quantitatives : euclidienne (souvent notée
					<KatexInline formula={String.raw`\lVert \cdot \rVert`} />), manhattan, minkowski,
					chebyshev, mahalanobis.
				</li>
				<li>
					Mesurer une partition : <KatexInline formula="T" /> (homogénéité, à minimiser),
					<KatexInline formula="S" /> (séparabilité, à maximiser),
					<KatexInline formula="D" /> (Davies-Bouldin, à minimiser),
					<KatexInline formula="s" /> (silhouette, à maximiser) ;
					<KatexInline formula={String.raw`I = I_W + I_B`} /> avec
					<KatexInline formula="I" /> indépendante de la partition : maximiser
					<KatexInline formula="I_B" /> revient à minimiser
					<KatexInline formula="I_W" />.
				</li>
				<li>
					Le nombre de partitions <KatexInline formula={String.raw`B_n`} /> (nombre de Bell) est trop
					grand (<KatexInline formula={String.raw`B_{50} \approx 1{,}86 \cdot 10^{47}`} />) : on
					utilise des algorithmes itératifs — classification hiérarchique, K-moyennes, modèles de
					mélange.
				</li>
				<li>
					La CAH est agglomérative et fonctionne par récurrence ; liaisons simple, complet, moyen,
					centroïdal et Ward, cette dernière correspondant au gain de variance intra-classe de la
					fusion (Proposition).
				</li>
				<li>
					Dendrogramme : la longueur d'une branche est la distance entre les deux clusters fusionnés
					; le nombre de clusters se choisit par un seuil
					<KatexInline formula="r" /> ou en évaluant les nœuds (ex. coefficient de silhouette).
				</li>
				<li>
					Complexité : <KatexInline formula={String.raw`O(dn^2)`} /> — à chaque itération, distances deux
					à deux entre toutes les paires possibles.
				</li>
			</ul>
		</Callout>

		<InteractiveSection
			number="1.6"
			title="Quiz — Clustering hiérarchique"
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
		<!-- Panneau expert : single-linkage, MST, consistance de Hartigan. -->
		<BibElement
			authors={['Gower, J. C.', 'Ross, M. A.']}
			year={1969}
			title="Minimum Spanning Trees and Single Linkage Cluster Analysis"
			journal="Journal of the Royal Statistical Society. Series C (Applied Statistics), 18(1), 54–64."
			link="https://doi.org/10.2307/2346439"
		/>
		<BibElement
			authors={['Sibson, R.']}
			year={1973}
			title="SLINK: an optimally efficient algorithm for the single-link cluster method"
			journal="The Computer Journal, 16(1), 30–34."
			link="https://doi.org/10.1093/comjnl/16.1.30"
		/>
		<BibElement
			authors={['Lance, W. G.', 'Williams, W. H.']}
			year={1966}
			title="A General Theory of Classificatory Sorting Strategies: 1. Hierarchical Systems"
			journal="The Computer Journal, 9(4), 373–380."
		/>
		<BibElement
			authors={['Ward, J. H.']}
			year={1963}
			title="Hierarchical Grouping to Optimize an Objective Function"
			journal="Journal of the American Statistical Association, 58(301), 236–244."
		/>
		<BibElement
			authors={['Hartigan, J. A.']}
			year={1975}
			title="Clustering Algorithms"
			journal="Wiley, New York."
			link="https://archive.org/details/clusteringalgori0000hart"
		/>
		<BibElement
			authors={['Hartigan, J. A.']}
			year={1981}
			title="Consistency of single linkage for high-density clusters"
			journal="Journal of the American Statistical Association, 76(374), 388–394."
		/>
		<BibElement
			authors={['Penrose, M.']}
			year={1995}
			title="Single linkage clustering and continuum percolation"
			journal="Journal of Multivariate Analysis, 53, 94–109."
		/>
		<BibElement
			authors={['Wishart, D.']}
			year={1969}
			title="Mode analysis: a generalization of nearest neighbor which reduces chaining effects"
			journal="Proceedings of the Colloquium on Numerical Taxonomy, University of St Andrews, 282–308."
		/>
		<BibElement
			authors={['Chaudhuri, K.', 'Dasgupta, S.']}
			year={2010}
			title="Rates of convergence for the cluster tree"
			journal="Advances in Neural Information Processing Systems (NeurIPS), 2010."
			link="https://proceedings.neurips.cc/paper/2010/file/b534ba68236ba543ae44b22bd110a1d6-Paper.pdf"
		/>
		<BibElement
			authors={['Carlsson, G.', 'Mémoli, F.']}
			year={2010}
			title="Characterization, stability and convergence of hierarchical clustering methods"
			journal="Journal of Machine Learning Research, 11, 1425–1470."
		/>
		<BibElement
			authors={['Defays, D.']}
			year={1977}
			title="An efficient algorithm for a complete-link method"
			journal="The Computer Journal, 20(4), 364–366."
			link="https://doi.org/10.1093/comjnl/20.4.364"
		/>
		<BibElement
			authors={['de Amorim, R. C.']}
			year={2015}
			title="Ward's hierarchical clustering method"
			journal="Revue, version libre (repository de l'Université d'Essex)."
			link="https://repository.essex.ac.uk/20365/1/MW_Ward.pdf"
		/>
		<BibElement
			authors={['Kleinberg, J.']}
			year={2003}
			title="An impossibility theorem for clustering"
			journal="Advances in Neural Information Processing Systems, 463–470."
		/>
		<BibElement
			authors={['von Luxburg, U.']}
			year={2007}
			title="A tutorial on spectral clustering"
			journal="arXiv preprint arXiv:0711.0189."
			link="https://arxiv.org/abs/0711.0189"
		/>
	</Bibliography>
</PageTemplate>
