<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import TopKExplorer from '$lib/components/demos/TopKExplorer.svelte';
	import ConfidenceCalibration from '$lib/components/demos/ConfidenceCalibration.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';

	const meta = getPageByPath('/part3/lesson1');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	interface TocEntry {
		id: string;
		label: string;
		description: string;
		color: 'epistemic' | 'positive' | 'neutral' | 'belief' | 'surprise' | 'agent';
	}

	const tocEntries: TocEntry[] = [
		{
			id: 'risque-topk',
			label: 'Le risque Top-K bayésien',
			description: 'Exactitude bayésienne et risque',
			color: 'epistemic'
		},
		{
			id: 'choix-adaptatif',
			label: 'Choix adaptatif de K',
			description: 'Seuil de précision cible et optimalité',
			color: 'belief'
		},
		{
			id: 'calibration-confiance',
			label: 'Calibration de la confiance',
			description: 'Classement vs valeurs, ECE',
			color: 'positive'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'Récapitulatif sur la classification Top-K',
			color: 'neutral'
		}
	];
</script>

<svelte:head>
	<title>{meta?.title ?? 'Classification Top-K'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Classification Top-K'}
	subtitle="Décider avec plusieurs classes candidates : risque Top-K, choix adaptatif et calibration"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />
		<p>
			La classification usuelle retient une unique prédiction : la classe la plus probable. Cette
			approche, appelée <strong>Top-1</strong>, est simple mais rigide — elle ne donne aucune marge
			de manœuvre lorsqu'une classe alternative est presque aussi vraisemblable que la gagnante. La
			<strong>classification Top-K</strong>
			répond à cette limite en renvoyant un <em>ensemble</em> de K classes candidates, offrant un compromis
			entre coverage et précision.
		</p>

		<p>
			Pour raisonner rigoureusement sur ce compromis, il faut d'abord nommer l'objet théorique qui
			gouverne toute la classification : la <strong>probabilité conditionnelle de classe</strong>.
			Pour un problème à C classes, on note
		</p>

		<KatexBlock
			formula={String.raw`\eta_c(x) = \mathbb{P}(Y = c \mid X = x), \qquad c = 1, \dots, C`}
		/>

		<p>
			Le vecteur <KatexInline formula={String.raw`\eta(x) = (\eta_1(x), \dots, \eta_C(x))`} />
			résume tout ce qu'il y a à savoir sur <KatexInline formula="Y" /> une fois
			<KatexInline formula="x" /> observé — c'est la quantité que tout classificateur cherche, explicitement
			ou non, à approcher. Un modèle produit en pratique une estimation
			<KatexInline formula={String.raw`\hat{p}(x) = (p_1, \dots, p_C)`} /> de <KatexInline
				formula={String.raw`\eta(x)`}
			/>, jamais <KatexInline formula={String.raw`\eta(x)`} /> lui-même. Le <strong>Top-K</strong>
			de
			<KatexInline formula="x" /> tel qu'observé par le modèle est alors :
		</p>

		<KatexBlock
			formula={String.raw`\text{Top}_K(\hat{p}(x)) = \{ c \mid \text{le rang de } p_c \text{ parmi } \{p_1, \dots, p_C\} \leq K \}`}
		/>

		<p>
			Un échantillon est dit <strong>correct</strong> si la vraie étiquette
			<KatexInline formula="y" /> appartient à cet ensemble :
			<KatexInline formula={String.raw`y \in \text{Top}_K(\hat{p}(x))`} />.
		</p>

		<Callout type="definition" title="Exactitude Top-K (Accuracy@K)">
			L'exactitude Top-K est la fraction d'échantillons dont la vraie classe figure dans le Top-K
			prédit :
		</Callout>

		<KatexBlock
			formula={String.raw`\text{Acc@}K = \frac{1}{N} \sum_{i=1}^{N} \mathbb{1}\big(y_i \in \text{Top}_K(\hat{p}(x_i))\big)`}
		/>

		<p>
			Pour <KatexInline formula="K = 1" />, cette métrique se réduit à l'exactitude usuelle. Pour <KatexInline
				formula="K = C"
			/>, elle vaut toujours 1 (toutes les classes sont incluses). La courbe <KatexInline
				formula={String.raw`K \mapsto \text{Acc@}K`}
			/> est donc monotone croissante et relie l'exactitude Top-1 à 100%.
		</p>
	</TheorySection>

	<TheorySection>
		<h2 id="risque-topk">Le risque Top-K bayésien</h2>

		<p>
			<KatexInline formula={String.raw`\text{Acc@}K`} /> est une quantité <em>empirique</em>,
			calculée sur un échantillon fini avec les scores estimés <KatexInline
				formula={String.raw`\hat{p}`}
			/>. Il est instructif de se demander : que se passe-t-il à la limite, si le modèle disposait
			des véritables probabilités <KatexInline formula={String.raw`\eta(x)`} /> ? Quel est le meilleur
			ensemble de taille K possible, et quelle exactitude peut-il espérer atteindre ?
		</p>

		<p>
			Formalisons la classification Top-K comme un problème de décision. Un prédicteur d'ensembles
			est une fonction <KatexInline
				formula={String.raw`S : \mathcal{X} \to \mathcal{P}(\{1,\dots,C\})`}
			/>
			qui associe à <KatexInline formula="x" /> un sous-ensemble de classes de taille
			<KatexInline formula="K" />. On lui associe la perte <KatexInline
				formula={String.raw`\ell(S(x), y) = \mathbb{1}(y \notin S(x))`}
			/> — l'échec est de laisser la vraie classe hors de l'ensemble — et le risque :
		</p>

		<KatexBlock
			formula={String.raw`R(S) = \mathbb{E}_{(X,Y)}\big[\, \mathbb{1}(Y \notin S(X)) \,\big] = 1 - \text{Acc@}K`}
		/>

		<p>
			Conditionnellement à <KatexInline formula="X = x" />, ce risque s'écrit directement en
			fonction de <KatexInline formula={String.raw`\eta(x)`} /> :
		</p>

		<KatexBlock
			formula={String.raw`\mathbb{P}(Y \notin S \mid X = x) = 1 - \mathbb{P}(Y \in S \mid X = x) = 1 - \sum_{c \in S} \eta_c(x)`}
		/>

		<Callout type="intuition" title="D'où vient cette formule ?">
			<KatexInline formula={String.raw`Y \in S`} /> est l'union disjointe des événements
			<KatexInline formula={String.raw`\{Y = c\}`} /> pour <KatexInline formula="c \in S" />, donc <KatexInline
				formula={String.raw`\mathbb{P}(Y \in S \mid x) = \sum_{c \in S} \mathbb{P}(Y=c\mid x) = \sum_{c\in S}\eta_c(x)`}
			/>. Manquer la classe est l'événement complémentaire.
		</Callout>

		<p>
			Le meilleur ensemble <KatexInline formula="S(x)" /> de taille fixée <KatexInline
				formula="K"
			/> est donc celui qui <strong>maximise la masse de probabilité captée</strong>
			<KatexInline formula={String.raw`\sum_{c \in S} \eta_c(x)`} />. Or pour tout ensemble
			<KatexInline formula="S" /> de cardinal K, cette somme est majorée par la somme des K plus grandes
			valeurs parmi <KatexInline formula={String.raw`\eta_1(x), \dots, \eta_C(x)`} /> — c'est la définition
			même des statistiques d'ordre. En notant
		</p>

		<KatexBlock
			formula={String.raw`\eta_{(1)}(x) \geq \eta_{(2)}(x) \geq \cdots \geq \eta_{(C)}(x)`}
		/>

		<p>
			le rangement décroissant des probabilités conditionnelles, l'égalité n'est atteinte que
			lorsque
		</p>

		<KatexBlock
			formula={String.raw`S^*(x) = \{ c \mid \eta_c(x) \text{ est parmi les } K \text{ plus grandes valeurs} \} = \text{Top}_K(\eta(x))`}
		/>

		<p>
			c'est-à-dire lorsque <KatexInline formula="S" /> contient exactement les K classes les plus probables
			<em>au sens de la vérité</em>
			<KatexInline formula={String.raw`\eta(x)`} />, et non de son estimation <KatexInline
				formula={String.raw`\hat{p}(x)`}
			/>. <KatexInline formula="S^*(x)" /> est le <strong>prédicteur Top-K bayésien</strong> : aucun
			autre ensemble de taille K ne peut faire mieux, en moyenne, sur ce point <KatexInline
				formula="x"
			/>.
		</p>

		<Callout type="definition" title="Risque Top-K bayésien">
			En substituant <KatexInline formula={String.raw`S^*(x)`} /> dans l'expression du risque et en moyennant
			sur <KatexInline formula="X" />, on obtient le plus petit risque Top-K atteignable par
			n'importe quel classificateur :
		</Callout>

		<KatexBlock
			formula={String.raw`R_K^* = \mathbb{E}_X\!\left[\, 1 - \sum_{k=1}^{K} \eta_{(k)}(X) \,\right]`}
		/>

		<p>
			C'est la généralisation directe du <strong>risque bayésien</strong> classique de la
			classification : pour <KatexInline formula="K = 1" />, on retrouve
			<KatexInline formula={String.raw`R_1^* = \mathbb{E}_X[1 - \eta_{(1)}(X)]`} />, le risque du
			classificateur <KatexInline formula={String.raw`\arg\max_c \eta_c(x)`} />
			— la règle de décision optimale usuelle. Pour <KatexInline formula="K = C" />, la somme épuise
			tout le simplexe (<KatexInline formula={String.raw`\sum_c \eta_c(x) = 1`} />) et
			<KatexInline formula="R_C^* = 0" />.
		</p>

		<p>
			La décroissance de <KatexInline formula={String.raw`K \mapsto R_K^*`} /> a une interprétation exacte
			: le gain marginal obtenu en passant de K−1 à K classes est précisément la probabilité moyenne de
			la K-ième classe la plus vraisemblable,
		</p>

		<KatexBlock
			formula={String.raw`R_{K-1}^* - R_K^* = \mathbb{E}_X\big[\eta_{(K)}(X)\big] \;\geq\; 0`}
		/>

		<p>
			ce qui explique la forme de la courbe <KatexInline formula={String.raw`\text{Acc@}K`} /> observée
			empiriquement : les premiers incréments de K rapportent beaucoup lorsque
			<KatexInline formula={String.raw`\eta(x)`} /> est concentrée sur peu de classes, et de moins en
			moins à mesure qu'on absorbe la queue de la distribution.
		</p>
		<ExampleBlock title="Exemple numérique"
			>Soit <KatexInline formula="C = 5" /> classes avec
			<KatexInline formula={String.raw`\eta(x) = (0.50,\ 0.25,\ 0.15,\ 0.07,\ 0.03)`} /> déjà triées par
			ordre décroissant en <KatexInline formula="x" />.
			<table>
				<thead>
					<tr>
						<th>K</th>
						<th><KatexInline formula={String.raw`\sum_{k=1}^K \eta_{(k)}(x)`} /></th>
						<th>Risque <KatexInline formula={String.raw`1 - \sum_{k=1}^K \eta_{(k)}(x)`} /></th>
					</tr>
				</thead>
				<tbody>
					<tr><td>1</td><td>0.50</td><td>0.50</td></tr>
					<tr><td>2</td><td>0.75</td><td>0.25</td></tr>
					<tr><td>3</td><td>0.90</td><td>0.10</td></tr>
					<tr><td>4</td><td>0.97</td><td>0.03</td></tr>
					<tr><td>5</td><td>1.00</td><td>0.00</td></tr>
				</tbody>
			</table>
		</ExampleBlock>

		<p>
			Au point <KatexInline formula="x" />, il est impossible de faire mieux que 10% de risque avec
			un ensemble de taille 3 — quel que soit le modèle utilisé — car la masse restante,
			<KatexInline formula="0.07 + 0.03" />, est irréductiblement hors du Top-3.
		</p>
	</TheorySection>

	<InteractiveSection
		number="9.1"
		title="Classification Top-K"
		onInteract={tracker.trackInteraction}
	>
		<TopKExplorer />
	</InteractiveSection>

	<TheorySection>
		<p>
			Ce résultat éclaire aussi ce que <KatexInline formula={String.raw`\text{Acc@}K`} /> mesure en pratique
			: c'est un estimateur de <KatexInline formula={String.raw`1 - R_K(\text{Top}_K(\hat{p}))`} />,
			le complément du risque obtenu avec les scores <em>estimés</em>
			<KatexInline formula={String.raw`\hat{p}`} />, et non le risque bayésien
			<KatexInline formula={String.raw`R_K^*`} />. Les deux coïncident seulement si le classement
			induit par <KatexInline formula={String.raw`\hat{p}(x)`} /> — pas nécessairement ses valeurs exactes
			— correspond à celui de <KatexInline formula={String.raw`\eta(x)`} />, pour chaque <KatexInline
				formula="x"
			/>. On y reviendra dans la section sur la calibration.
		</p>
	</TheorySection>

	<TheorySection>
		<h2 id="choix-adaptatif">Choix adaptatif de K</h2>

		<p>
			La question pratique est : <em>quel K choisir ?</em> Un K trop petit risque de manquer la
			vraie classe, tandis qu'un K trop grand rend l'ensemble de prédiction peu informatif.
			L'approche la plus courante consiste à fixer un <strong>seuil de précision cible</strong>
			<KatexInline formula={String.raw`\tau`} /> et à rechercher le plus petit K le satisfaisant :
		</p>

		<KatexBlock
			formula={String.raw`K^* = \arg\min_{K} \left\{ K \;\middle|\; \text{Acc@}K \geq \tau \right\}`}
		/>

		<Callout type="intuition" title="Interprétation">
			Ce choix garantit que, sur l'ensemble de référence, au moins une fraction
			<KatexInline formula={String.raw`\tau`} /> des échantillons voit leur vraie classe incluse dans
			l'ensemble de prédiction. C'est un compromis direct entre la taille de l'ensemble (<KatexInline
				formula="K"
			/>) et sa fiabilité (<KatexInline formula={String.raw`\tau`} />).
		</Callout>

		<p>
			Cette règle est particulièrement utile en <strong>diagnostic médical</strong> ou en
			<strong>détection de fraude</strong>, où il est préférable de signaler un petit ensemble de
			suspects plutôt que de passer à côté d'un vrai cas positif.
		</p>

		<Callout type="warning" title="Un K global n'est pas optimal point par point">
			Le K<sup>*</sup> ci-dessus est un <strong>K unique, fixé pour tout l'espace</strong>
			<KatexInline formula={String.raw`\mathcal{X}`} />. Mais <KatexInline
				formula={String.raw`\eta(x)`}
			/> varie d'un point à l'autre : à certains
			<KatexInline formula="x" /> la masse est très concentrée (un seul K=1 suffit), à d'autres elle est
			diffuse sur de nombreuses classes proches. La règle décision-théoriquement optimale pour garantir
			une couverture <KatexInline formula={String.raw`\tau`} /> au meilleur coût moyen choisirait un <KatexInline
				formula="K(x)"
			/> <em>local</em>, la plus petite valeur telle que
			<KatexInline formula={String.raw`\sum_{k=1}^{K(x)} \eta_{(k)}(x) \geq \tau`} />. Un K global
			n'est qu'une approximation grossière — commode, mais sous-optimale — de cette règle
			adaptative. C'est exactement l'idée qui sera formalisée par la
			<strong>prédiction conformelle</strong>
			dans la leçon suivante, sans même nécessiter de connaître <KatexInline
				formula={String.raw`\eta(x)`}
			/>.
		</Callout>
	</TheorySection>

	<!-- <InteractiveSection tag="Démo 9.2">
		<AccuracyKCutoff />
	</InteractiveSection> -->

	<TheorySection>
		<h2 id="calibration-confiance">Calibration de la confiance</h2>

		<p>
			On a vu que l'ensemble Top-K bayésien <KatexInline
				formula={String.raw`S^*(x) = \text{Top}_K(\eta(x))`}
			/> ne dépend que du <strong>classement</strong> des <KatexInline
				formula={String.raw`\eta_c(x)`}
			/>, pas de leurs valeurs exactes. Un modèle dont les scores
			<KatexInline formula={String.raw`\hat{p}(x)`} /> classent correctement les classes — même s'ils
			sont mal calibrés en valeur absolue — produit donc déjà le bon ensemble Top-K pour un
			<KatexInline formula="K" /> fixé.
		</p>

		<p>
			En revanche, dès qu'on veut choisir <KatexInline formula="K" /> <em>via</em> un seuil de masse
			cumulée (comme <KatexInline formula={String.raw`K^*`} /> ci-dessus, ou la règle adaptative
			<KatexInline formula="K(x)" />), les <strong>valeurs</strong> de
			<KatexInline formula={String.raw`\hat{p}(x)`} /> comptent, pas seulement leur ordre. C'est là qu'intervient
			la <strong>calibration</strong> : un modèle est dit calibré si, chaque fois qu'il prédit une
			confiance de <KatexInline formula="c" />, sa précision empirique autour de
			<KatexInline formula="c" /> correspond bien à <KatexInline formula="c" /> — autrement dit, si
			<KatexInline formula={String.raw`\hat{p}_c(x)`} /> est une bonne approximation de
			<KatexInline formula={String.raw`\eta_c(x)`} /> elle-même, et pas seulement de son rang.
		</p>

		<p>
			Un modèle <strong>surconfiant</strong> surestime systématiquement sa certitude (p. ex. prédire
			90% de confiance mais n'avoir raison que dans 70% des cas). À l'inverse, un modèle
			<strong>sous-confiant</strong> sous-estime ses performances.
		</p>

		<Callout type="warning" title="Modèles modernes et calibration">
			Les réseaux de profondeur importante, notamment les ensembles (Random Forest, Boosting), ont
			tendance à produire des scores extrêmes. Sans calibration a posteriori, les seuils dérivés de
			ces scores peuvent être trompeurs — même si le classement Top-K, lui, reste correct.
		</Callout>

		<p>
			La <strong>méthode de Temperature Scaling</strong> (Guo et al., 2017) applique un facteur de
			température <KatexInline formula="T" /> aux logits avant softmax :
		</p>

		<KatexBlock
			formula={String.raw`\sigma\left(\frac{z_i}{T}\right) = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}`}
		/>

		<p>
			Avec <KatexInline formula="T &gt; 1" />, la distribution s'aplatit (le modèle devient moins
			confiant) ; avec <KatexInline formula="T &lt; 1" />, elle se resserre. Le paramètre <KatexInline
				formula="T"
			/> est appris sur un ensemble de calibration pour minimiser l'<strong
				>Error de Calibration Attendue</strong
			>
			(ECE). Point important : le rééchelonnage par température est une fonction
			<strong>strictement croissante</strong> des logits, donc elle ne modifie jamais le classement
			des classes — elle laisse le prédicteur Top-K inchangé et n'affecte que le choix de
			<KatexInline formula="K" /> par seuillage.
		</p>

		<ExpertPanel title="Expected Calibration Error (ECE)">
			<p>
				L'ECE mesure l'écart moyen entre confiance prédite et précision empirique, pondéré par la
				taille de chaque bin :
			</p>
			<KatexBlock
				formula={String.raw`\text{ECE} = \sum_{b=1}^{B} \frac{|b|}{N} \big| \text{acc}(b) - \text{conf}(b) \big|`}
			/>
			<p>
				Où <KatexInline formula="b" /> désigne chaque bin de confiance,
				<KatexInline formula={String.raw`\text{acc}(b)`} /> est la précision empirique dans ce bin, et
				<KatexInline formula={String.raw`\text{conf}(b)`} /> la confiance moyenne prédite.
			</p>
		</ExpertPanel>
	</TheorySection>

	<InteractiveSection
		number="9.3"
		title="Calibration de la confiance"
		onInteract={tracker.trackInteraction}
	>
		<ConfidenceCalibration />
	</InteractiveSection>

	<TheorySection>
		<h2 id="synthese">Synthèse</h2>

		<p>
			La classification Top-K généralise la classification standard en renvoyant un ensemble de
			candidats plutôt qu'une unique prédiction. Vue à travers les probabilités conditionnelles
			<KatexInline formula={String.raw`\eta_c(x)`} />, elle admet une solution bayésienne exacte :
			le meilleur ensemble de taille K est celui des K classes les plus probables, et le risque
			associé vaut <KatexInline formula={String.raw`1 - \sum_{k=1}^K \eta_{(k)}(x)`} /> — la masse de
			probabilité laissée hors de l'ensemble. Cette décomposition sépare nettement deux exigences distinctes
			sur un modèle : un <strong>bon classement</strong> des classes (suffisant pour un K fixé) et
			une <strong>bonne calibration</strong> des valeurs (nécessaire dès qu'on choisit K par
			seuillage). Ces outils forment le socle de la <strong>prédiction d'ensembles</strong>, dont la
			forme la plus aboutie — une garantie de couverture valide sans connaître
			<KatexInline formula={String.raw`\eta(x)`} /> — est la <em>prédiction conformelle</em>,
			abordée dans la leçon suivante.
		</p>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Guo, C.', 'Pleiss, G.', 'Sun, Y.', 'Weinberger, K. Q.']}
			year={2017}
			title="On Calibration of Modern Neural Networks"
			journal="Proceedings of the 34th International Conference on Machine Learning (ICML)."
			link="https://arxiv.org/abs/1706.04599"
		/>
		<BibElement
			authors={['Lapin, M.', 'Hein, M.', 'Schiele, B.']}
			year={2016}
			title="Loss Functions for Top-k Error: Analysis and Insights"
			journal="Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp. 1468–1477."
			link="https://arxiv.org/abs/1512.00486"
		/>
		<BibElement
			authors={['Devroye, L.', 'Györfi, L.', 'Lugosi, G.']}
			year={1996}
			title="A Probabilistic Theory of Pattern Recognition"
			journal="Springer-Verlag."
			link="https://doi.org/10.1007/978-1-4612-0711-5"
		/>
	</Bibliography>
</PageTemplate>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		overflow: hidden;
	}

	thead {
		background-color: #f9fafb;
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		border-bottom: 1px solid #e5e7eb;
	}

	td {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: #1f2937;
		border-bottom: 1px solid #e5e7eb;
	}

	tbody tr:hover {
		background-color: #f3f4f6;
		transition: background-color 0.15s ease;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}
</style>
