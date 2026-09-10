<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
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
	</Bibliography>
</PageTemplate>
