<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import ImpurityCriteriaExplorer from '$lib/components/demos/ImpurityCriteriaExplorer.svelte';
	import CartDepthExplorer from '$lib/components/demos/CartDepthExplorer.svelte';
	import { asset } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part2/lesson3');
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
			id: 'intro',
			label: 'Pourquoi les arbres de décision',
			description: "Modèles hiérarchiques, variables qualitatives, classes multimodales",
			color: 'epistemic'
		},
		{
			id: 'cart',
			label: "L'algorithme CART",
			description: 'Partitionnement glouton, récursif et divisif',
			color: 'belief'
		},
		{
			id: 'separation-lineaire',
			label: 'Binarisation et construction itérative',
			description: 'Un arbre s’exprime toujours comme arbre binaire',
			color: 'surprise'
		},
		{
			id: 'variable-separatrice',
			label: 'Une seule variable par nœud',
			description: 'Binaire, nominale, continue, ordinale, discrète',
			color: 'agent'
		},
		{
			id: 'partition-espace',
			label: 'Frontières orthogonales aux axes',
			description: 'Plusieurs séparateurs parallèles aux axes ⇒ frontière non linéaire',
			color: 'positive'
		},
		{
			id: 'regle-agregation',
			label: "Règle d'agrégation aux feuilles",
			description: 'Vote majoritaire (classification), moyenne (régression)',
			color: 'epistemic'
		},
		{
			id: 'impurete',
			label: "Critères d'impureté",
			description: 'Gini, entropie, erreur de classification, gain d’information',
			color: 'belief'
		},
		{
			id: 'partitionnement-regression',
			label: 'Critère MSE (régression)',
			description: 'Minimiser l’erreur quadratique pondérée',
			color: 'surprise'
		},
		{
			id: 'selection-arbre',
			label: 'Sélection de l’arbre',
			description: 'Sous-/sur-apprentissage, hyperparamètres, élagage',
			color: 'agent'
		},
		{
			id: 'limites',
			label: 'Limites : apprenants faibles',
			description: 'Pourquoi passer aux méthodes ensemblistes',
			color: 'positive'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──
	const trainData =
		'(x_1, y_1), \\dots, (x_n, y_n) \\in \\mathcal{X} \\times \\mathcal{Y}';

	const regionBinaryL = 'R_l(x^j) = \\{ x \\in \\mathcal{X} : x^j = 1 \\}';
	const regionBinaryM = 'R_m(x^j) = \\{ x \\in \\mathcal{X} : x^j = 0 \\}';
	const regionNominalL = 'R_l(x^j, \\mathcal{S}) = \\{ x \\in \\mathcal{X} : x^j \\in \\mathcal{S} \\}';
	const regionNominalM =
		'R_m(x^j, \\mathcal{S}) = \\{ x \\in \\mathcal{X} : x^j \\notin \\mathcal{S} \\}';
	const regionContL = 'R_l(x^j, s) = \\{ x \\in \\mathcal{X} : x^j < s \\}';
	const regionContM = 'R_m(x^j, s) = \\{ x \\in \\mathcal{X} : x^j \\geq s \\}';

	const aggClassification =
		'f(x) = \\sum_{j=1}^{r} \\mathbb{1}\\{x \\in R_j\\}\\, \\arg\\max_{k \\in \\{1,\\dots,C\\}} \\sum_{\\substack{i \\in \\{1,\\dots,n\\} \\\\ x_i \\in R_j}} \\mathbb{1}\\{y_i = k\\}';
	const aggRegression =
		'f(x) = \\sum_{j=1}^{r} \\mathbb{1}\\{x \\in R_j\\}\\, \\dfrac{1}{\\lvert R_j \\rvert} \\sum_{\\substack{i \\in \\{1,\\dots,n\\} \\\\ x_i \\in R_j}} y_i';

	const infoGain =
		'\\mathcal{IG}(R_l, R_m) = \\mathcal{I}(R) - \\dfrac{n_l}{n}\\,\\mathcal{I}\\!\\left(R_l(x^j, \\text{seuil})\\right) - \\dfrac{n_m}{n}\\,\\mathcal{I}\\!\\left(R_m(x^j, \\text{seuil})\\right)';
	const gini = '\\mathcal{I}_{\\mathcal{G}}(R) = \\sum_{k=1}^{C} p_k(1 - p_k) = \\sum_{k=1}^{C}\\!\\sum_{k^{\\prime} \\neq k} p_k\\, p_{k^{\\prime}}';
	const entropy = '\\mathcal{I}_{\\mathcal{E}}(R) = -\\sum_{k} p_k \\log_2(p_k)';
	const misclassification = '\\mathcal{I}_{EC}(R) = 1 - \\max_{k}\\, p_k';

	const mseRegion = '\\mathrm{MSE}(R) = \\dfrac{1}{n}\\sum_i (y_i - \\bar{y})^2';
	const mseObjective =
		'\\dfrac{n_l}{n}\\,\\mathrm{MSE}(R_l) + \\dfrac{n_m}{n}\\,\\mathrm{MSE}(R_m)';

	const costComplexity =
		'C_{\\lambda}(T) = \\sum_{l=1}^{|T|} n_l\\, \\mathcal{I}(R_l) + \\lambda\\, |T|';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Arbres de décision'}
	subtitle="Construction d'arbres de décision avec l'algorithme CART"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<p class="forward-ref">
			Rappel : le paradigme ERM, la sélection de modèles par validation croisée et les
			métriques d'évaluation sont établis dans la <a href="/part2/lesson1">leçon 1</a> ;
			les classifieurs linéaires (dont la régression logistique) et le multiclasse
			One-Versus-All dans la <a href="/part2/lesson2">leçon 2</a>. On s'y réfère sans les
			représenter.
		</p>

		<h2 id="intro">Pourquoi les arbres de décision</h2>

		<p>
			Les modèles étudiés jusqu'ici — principalement les k-NN et la régression
			logistique — étiquettent une observation <KatexInline formula={'x \\in \\mathcal{X}'} />
			en une seule étape, et ils utilisent <strong>le même ensemble de variables, avec la
			même importance, pour toutes les régions</strong> de l'espace. Ce n'est pas adapté
			aux situations où les classes ont une distribution <strong>multimodale</strong> :
			suivant la région de l'espace considérée, ce sont de <em>différentes</em> variables
			qui déterminent l'étiquette.
		</p>

		<ExampleBlock title="Exemple — symptômes d'une maladie">
			<p>
				Les symptômes d'une maladie ne sont pas les mêmes selon l'âge du patient :
				au-dessous de 2 ans, on regarde d'abord la fièvre ; au-dessus de 60 ans,
				la pression artérielle devient le symptôme discriminant. Un modèle unique
				qui pondère les mêmes variables partout ne saisit pas cette structure ;
				un modèle <strong>hiérarchique</strong>, qui change de variable selon la
				sous-population, si.
			</p>
		</ExampleBlock>

		<p>
			Les <strong>arbres de décision</strong> sont précisément ce type de modèle
			hiérarchique : ils se comportent comme une série successive de tests
			conditionnels, où chaque test dépend des tests précédents et de leur résultat —
			on parcourt l'arbre de haut en bas, comme un « livre dont vous êtes le héros ».
		</p>

		<DefinitionBlock number="3.1" title="Arbre de décision">
			<p>
				Un <strong>arbre de décision</strong> est un modèle de prédiction représenté
				sous la forme d'un arbre. Chaque <em>nœud</em> teste une condition sur
				<em>une seule</em> variable, et chacun de ses <em>enfants</em> correspond à une
				réponse possible à cette condition. Les <em>feuilles</em> de l'arbre
				correspondent à une étiquette.
			</p>
		</DefinitionBlock>

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/arbreFruits.png')}
				alt="Arbre de décision classant des fruits selon leur couleur, leur taille et leur forme"
			/>
			<figcaption>
				Arbre de décision distinguant pommes, oranges et poires. Tiré de l'ouvrage
				<em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
			</figcaption>
		</figure>

		<p>Les arbres de décision</p>
		<ul>
			<li>
				permettent de traiter des <strong>variables qualitatives</strong> (couleur du
				fruit, taille) sans requérir de représentation numérique ni de notion de
				similarité — on parle d'<em>apprentissage non métrique</em>. Ils sont donc
				adaptés aux données <strong>hétérogènes</strong> (mélange de variables
				quantitatives et qualitatives).
			</li>
			<li>
				permettent de traiter un problème de
				<strong>classification multiclasse</strong> sans passer par des
				classifications binaires (contrairement à la régression logistique, qui
				nécessite la stratégie One-Versus-All vue en leçon 2).
			</li>
			<li>
				permettent de traiter des <strong>classes multimodales</strong> : l'étiquette
				« pomme » est ici affectée à un fruit grand <em>et</em> rouge <em>ou</em> à un
				fruit jaune et rond — deux modes distincts que les k-NN (qui agrègent par
				distance locale) et la régression logistique (un seul hyperplan global) ne
				saisissent pas de façon naturelle.
			</li>
		</ul>

		<Callout type="note" title="Légèrement étoffé par rapport aux slides">
			<p>
				Les diapositives se contentaient de poser la question « et pour les k-NN ? et
				pour la régression logistique ? ». Les trois comparaisons ci-dessus (non
				métrique, multiclasse sans OVA, classes multimodales) sont une réponse
				consistant à cette question, fidèle à l'intention du cours.
			</p>
		</Callout>

		<h2 id="cart">L'algorithme CART</h2>

		<p>
			Pour construire des arbres de décision, on peut utiliser l'algorithme
			<strong>CART</strong> (<em>Classification And Regression Tree</em>). C'est un
			algorithme de <strong>partitionnement</strong> de l'espace par une approche
			<strong>gloutonne, récursive et divisive</strong> qui apprend un
			<strong>arbre binaire</strong> à partir des données d'apprentissage
			<KatexInline formula={trainData} />.
		</p>

		<ol>
			<li>
				Chaque nœud sépare <strong>linéairement</strong> le jeu de données : chaque
				nœud a <em>exactement deux</em> enfants (pas de perte de généralité, car tout
				arbre peut être ré-exprimé comme un arbre binaire).
			</li>
			<li>
				Pour partitionner les données, on n'utilise qu'<strong>une seule variable</strong>
				par nœud. Pour des variables numériques, la frontière de décision produite est
				alors <strong>orthogonale à l'axe</strong> de cette variable.
			</li>
			<li>
				À l'arrivée dans une feuille, on utilise une <strong>règle
				d'agrégation</strong> (vote pour la classification, moyenne pour la régression)
				pour estimer l'étiquette de <KatexInline formula="x" />.
			</li>
		</ol>

		<h2 id="separation-lineaire">Binarisation et construction itérative</h2>

		<p>
			Comme annoncé au premier point, tout arbre — même non binaire — peut être
			ré-exprimé comme un <strong>arbre binaire</strong>. Une condition à trois issues
			devient une cascade de conditions binaires :
		</p>

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/arbreFruits2.png')}
				alt="Un arbre de décision non binaire ré-exprimé comme un arbre binaire"
			/>
			<figcaption>
				À gauche un arbre dont un nœud a trois enfants ; à droite le même modèle
				ré-exprimé sous forme d'arbre binaire. Tiré de l'ouvrage <em>Introduction au
				Machine Learning</em> de Chloé-Agathe Azencott.
			</figcaption>
		</figure>

		<Callout type="note" title="Remarque">
			<p>
				La construction de l'arbre est <strong>itérative, nœud par nœud</strong>, en
				partant de la racine : à chaque étape, on choisit la meilleure coupure pour la
				région courante, puis on applique récursivement le même procédé aux deux
				enfants.
			</p>
		</Callout>

		<h2 id="variable-separatrice">Une seule variable par nœud</h2>

		<p>
			À chaque nœud d'un arbre construit par CART correspond une
			<strong>variable séparatrice</strong> <KatexInline formula={'x^j'} /> selon laquelle
			les données sont partitionnées. Cette variable définit deux régions
			<KatexInline formula={'R_l'} /> et <KatexInline formula={'R_m'} />, correspondant
			aux enfants du nœud. La façon de choisir la coupure dépend du <strong>type de
			variable</strong> :
		</p>

		<table>
			<thead>
				<tr>
					<th>Type de variable</th>
					<th>Coupure</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<strong>Binaire</strong> (quali ou quanti)
					</td>
					<td>
						<p>
							<KatexInline formula={regionBinaryL} />
						</p>
						<p>
							<KatexInline formula={regionBinaryM} />
						</p>
					</td>
				</tr>
				<tr>
					<td>
						<strong>Qualitative nominale</strong> (plus de deux modalités)
					</td>
					<td>
						<p>
							Pour un sous-ensemble <KatexInline formula={'\\mathcal{S}'} /> de modalités
							sélectionnées (souvent <KatexInline formula={'\\dim(\\mathcal{S}) = 1'} />) :
						</p>
						<p>
							<KatexInline formula={regionNominalL} />
						</p>
						<p>
							<KatexInline formula={regionNominalM} />
						</p>
					</td>
				</tr>
				<tr>
					<td>
						<strong>Quantitative continue</strong>
					</td>
					<td>
						<p>
							Pour un <strong>point de séparation</strong>
							<KatexInline formula="s" /> :
						</p>
						<p>
							<KatexInline formula={regionContL} />
						</p>
						<p>
							<KatexInline formula={regionContM} />
						</p>
					</td>
				</tr>
				<tr>
					<td>
						<strong>Qualitative ordinale</strong>
					</td>
					<td>
						Soit traitée comme variable <em>continue</em> (séparation par seuil, en
						respectant l'ordre des modalités), soit comme variable <em>nominale</em>
						(regroupement de modalités).
					</td>
				</tr>
				<tr>
					<td>
						<strong>Quantitative discrète</strong>
					</td>
					<td>
						Souvent traitée comme <em>continue</em> (seuil). Si elle prend peu de
						valeurs, on peut aussi la traiter comme <em>nominale</em> (regroupement
						de modalités), au prix de perdre la notion d'ordre.
					</td>
				</tr>
			</tbody>
		</table>

		<h2 id="partition-espace">Frontières orthogonales aux axes</h2>

		<p>
			Puisque chaque nœud teste une seule variable quantitative continue, chaque coupure
			produit une frontière <strong>orthogonale à un axe</strong>. En composant ces
			coupures, l'arbre partitionne l'espace en régions rectangulaires :
		</p>

		<figure class="lesson-figure wide">
			<div class="triple-img">
				<img
					src={asset('/images/part2/data_tree.png')}
					alt="Nuage de points de données"
				/>
				<img
					src={asset('/images/part2/data_tree_cart.png')}
					alt="Mêmes points avec les frontières de partition orthogonales aux axes"
				/>
				<img
					src={asset('/images/part2/the_tree.png')}
					alt="Arbre de décision correspondant à la partition"
				/>
			</div>
			<figcaption>
				De gauche à droite : les données, la partition de l'espace en régions
				(rectangles) par des seuils successifs, et l'arbre de décision correspondant.
			</figcaption>
		</figure>

		<ul>
			<li>
				l'algorithme construit non pas un, mais <strong>plusieurs séparateurs
				linéaires</strong>, afin de produire une frontière de décision
				<strong>non linéaire</strong> (en escalier) ;
			</li>
			<li>
				utiliser des séparateurs <strong>parallèles aux axes</strong> favorise
				l'<strong>interprétabilité</strong> (chaque règle est de la forme
				« variable &le; seuil ») ;
			</li>
			<li>
				chaque point de l'espace <KatexInline formula={'\\mathcal{X}'} /> n'appartient
				qu'à <strong>une unique région</strong> à un instant donné — les régions
				formeront une partition de
				<KatexInline formula={'\\mathcal{X}'} />.
			</li>
		</ul>

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/cart.jpg')}
				alt="Autre exemple de partition CART sur un jeu de données plus dense"
			/>
			<figcaption>
				Autre exemple de partition CART : plus les nœud se multiplient, plus la
				frontière (en escalier) épouse les nuages de points.
			</figcaption>
		</figure>

		<Callout type="insight" title="Remarque">
			<p>
				Un arbre de décision partitionne l'espace
				<KatexInline formula={'\\mathcal{X}'} /> des observations en
				<strong>autant de régions qu'il a de feuilles</strong> dans l'arbre final
				construit.
			</p>
		</Callout>

		<ExercisePanel number="3.1" title="Quel arbre pour la partition suivante ?">
			<figure class="lesson-figure">
				<img
					src={asset('/images/part2/exemplePartition.png')}
					alt="Partition de l'espace en plusieurs régions rectangulaires"
				/>
				<figcaption>
					Une partition de l'espace en régions rectangulaires.
				</figcaption>
			</figure>
			<p>
				Combien de feuilles a l'arbre de décision qui produit cette partition ?
				Comment le lire ?
			</p>
			{#snippet solution()}
				<p><strong>Solution :</strong></p>
				<p>
					Le principe à retenir est celui de la remarque ci-dessus :
					<strong>le nombre de régions de la partition est égal au nombre de
					feuilles</strong> de l'arbre. Chaque région rectangulaire est une feuille ;
					chaque coupure rectiligne (verticale ou horizontale) qui apparaît quand on
					descend dans l'arbre est un nœud interne.
				</p>
				<p>
					On lit la partition de haut en bas : la première coupure est celle qui
					traverse toute la largeur (ou toute la hauteur) du carré — elle correspond
					à la racine, et teste une variable (l'axe vertical si la coupure est
					verticale). Chaque sous-rectangle ainsi obtenu est à son tour coupé par la
					suivante ligne présente dans la figure, jusqu'à obtenir exactement les
					régions dessinées. Autrement dit : on « assemble » l'arbre en ajoutant, un
					à un, les traits visibles dans la partition, chacun devenant un nœud qui
					dédouble la région qu'il coupe en deux.
				</p>
				<p>
					<em>Note de lecture :</em> la partition étant déterminée par ses traits,
					toute lecture qui reproduit la même famille de rectangles est un arbre
					valide ; l'ordre exact des coupures n'est pas unique, mais le nombre de
					feuilles (donc de régions) l'est.
				</p>
			{/snippet}
		</ExercisePanel>

		<h2 id="regle-agregation">Règle d'agrégation aux feuilles</h2>

		<p>
			Supposons que l'algorithme ait partitionné le jeu de données en
			<KatexInline formula="r" /> régions <KatexInline formula={'R_1, R_2, \\dots, R_r'} />.
			Toutes les observations qui tombent dans une même feuille — i.e. qui appartiennent
			à une même région — reçoivent la même étiquette.
		</p>

		<DefinitionBlock number="3.2" title="Règle d'agrégation">
			<p>
				<strong>Classification.</strong> L'étiquette prédite d'un nouveau point
				<KatexInline formula="x" /> tombant dans une région est l'étiquette
				<strong>majoritaire</strong> des observations d'apprentissage de cette région :
			</p>
			<KatexBlock formula={aggClassification} />
			<p>
				<strong>Régression.</strong> L'étiquette prédite est la <strong>moyenne</strong>
				des observations d'apprentissage de la région :
			</p>
			<KatexBlock formula={aggRegression} />
		</DefinitionBlock>

		<h2 id="impurete">Critères d'impureté (classification)</h2>

		<p>
			Pour un nœud (une région <KatexInline formula="R" />), <em>comment</em> choisir la
			bonne séparation — la bonne variable séparatrice et le bon seuil ? En
			classification, on choisit le découpage qui <strong>maximise le gain
			d'information</strong>, c'est-à-dire la variable
			<KatexInline formula={'x^j'} /> et le seuil (
			<KatexInline formula="s" /> pour une variable continue,
			<KatexInline formula={'\\mathcal{S}'} /> pour une variable discrète) qui maximisent
		</p>
		<KatexBlock formula={infoGain} />
		<p>
			où <KatexInline formula={'\\mathcal{I}'} /> est un
			<strong>critère d'impureté</strong>, qui quantifie à quel point la région est
			« polluée » par des éléments des classes qui n'y sont pas majoritaires,
			<KatexInline formula="n" /> le nombre de points d'entraînement dans
			<KatexInline formula="R" />, et
			<KatexInline formula={'n_l, n_m'} /> ceux de
			<KatexInline formula={'R_l'} /> et <KatexInline formula={'R_m'} />.
		</p>

		<DefinitionBlock number="3.3" title="Les trois critères d'impureté">
			<p>
				Soit <KatexInline formula={'p_k'} /> la proportion d'éléments de la classe
				<KatexInline formula="k" /> dans la région <KatexInline formula="R" />.
			</p>
			<p>
				<strong>Impureté de Gini</strong> — probabilité qu'un exemple soit mal étiqueté
				s'il était étiqueté aléatoirement selon la distribution des étiquettes de
				<KatexInline formula="R" /> :
			</p>
			<KatexBlock formula={gini} />
			<p>
				<strong>Entropie</strong> — la quantité d'information supplémentaire nécessaire
				pour étiqueter correctement les exemples de
				<KatexInline formula="R" /> :
			</p>
			<KatexBlock formula={entropy} />
			<p>
				<strong>Erreur de classification</strong> — proportion des exemples qui
				n'appartiennent pas à la classe majoritaire :
			</p>
			<KatexBlock formula={misclassification} />
		</DefinitionBlock>

		<Callout type="note" title="Démo limitée au cas binaire">
			<p>
				Les démonstrations interactives ci-dessous se limitent à
				<strong>2 classes</strong> pour rester lisibles ; les formules ci-dessus sont
				générales à <KatexInline formula="C" /> classes.
			</p>
		</Callout>

		<InteractiveSection
			number="3.1"
			title="Gain d'information et critères d'impureté"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Choisissez une variable
				<KatexInline formula={'x_1'} /> ou <KatexInline formula={'x_2'} /> et déplacez le
				seuil : les trois critères (Gini, entropie, erreur de classification)
				s'actualisent en direct, et le gain d'information est l'écart entre
				l'impureté du parent et celle pondérée des enfants. Coupez sur
				<KatexInline formula={'x_1'} /> (variable informative) : le gain est fort.
				Coupez sur <KatexInline formula={'x_2'} /> : il reste quasi nul. Le bouton
				« Seuil optimal » place le seuil qui maximise le gain pour le critère actif.
			</p>
			<ImpurityCriteriaExplorer />
		</InteractiveSection>

		<h2 id="partitionnement-regression">Critère MSE (régression)</h2>

		<p>
			En régression, l'agrégation d'une feuille est la <strong>moyenne</strong> des
			cibles. On évalue donc une région par son <strong>Mean-Squared Error</strong>
			relativement à cette moyenne :
		</p>
		<KatexBlock formula={mseRegion} />
		<p>
			et l'on cherche le découpage (variable et seuil) qui <strong>minimise</strong> le
			critère pondéré
		</p>
		<KatexBlock formula={mseObjective} />
		<Callout type="note" title="Remarque">
			<p>
				On calcule le MSE relativement à la moyenne précisément parce que celle-ci est
				la prédiction associée à un nœud fixé : minimiser la dispersion autour de la
				moyenne, c'est choisir la coupure qui rend les prédictions de chaque enfant le
				plus homogènes possibles.
			</p>
		</Callout>

		<h2 id="selection-arbre">Sélection de l'arbre</h2>

		<p>
			À quel moment <strong>arrêter</strong> la construction ? Le dilemme est le même que
			pour tout modèle :
		</p>
		<ul>
			<li>
				un arbre <strong>peu profond</strong> risque de mal modéliser le problème
				(<strong>sous-apprentissage</strong>) ;
			</li>
			<li>
				un arbre <strong>trop profond</strong> risque de « trop coller aux données »,
				y compris au bruit (<strong>sur-apprentissage</strong>).
			</li>
		</ul>

		<p>
			<strong>Stratégie n°1 — limiter la complexité.</strong> On fixe un (ou plusieurs)
			hyperparamètres et on les choisit par <strong>validation croisée</strong> (définie
			en leçon 1) :
		</p>
		<ul>
			<li>la profondeur maximale ;</li>
			<li>le nombre maximal de feuilles ;</li>
			<li>le nombre minimal d'exemples dans une feuille / un nœud.</li>
		</ul>

		<Callout type="insight" title="Biais et variance en fonction de la profondeur">
			<p>
				<em>Question des diapositives (laissée à l'oral) : comment se comportent le
				biais et la variance en fonction de la profondeur de l'arbre ?</em> — À
				profondeur faible, l'arbre est trop simple pour saisir la structure : le
				<strong>biais est élevé</strong>, la variance faible (sous-apprentissage). À
				profondeur grande, l'arbre colle à l'échantillon d'entraînement : le
				<strong>biais est faible</strong> mais la <strong>variance élevée</strong>
				(sur-apprentissage). La démo ci-dessous matérialise exactement ce compromis
				en traçant la précision sur l'entraînement et sur le test.
			</p>
		</Callout>

		<InteractiveSection
			number="3.2"
			title="Construction CART — partition, arbre et compromis biais/variance"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Un motif 2×2 (échiquier) avec un peu de bruit
				d'étiquette : un stump (profondeur 1) ne sépare rien de mieux que le hasard,
				la profondeur 2–4 capture les quatre quadrants, et au-delà l'arbre
				« mémorise » le bruit. Faites varier la profondeur et le nombre minimal
				d'exemples par feuille : regardez la partition se raffiner, l'arbre se
				ramifier, et l'écart train/test se creuser quand la variance prend le dessus.
			</p>
			<CartDepthExplorer />
		</InteractiveSection>

		<p>
			<strong>Stratégie n°2 — élagage.</strong> On apprend un arbre
			<strong>sans limite</strong> sur l'ensemble d'apprentissage, puis on le
			<strong>ré-visitent</strong> sur un ensemble de validation en ne gardant que les
			branches qui apportent une amélioration. C'est une méthode de
			<strong>régularisation</strong> qui contrôle la complexité de l'arbre, mesurée
			par le nombre de régions qu'il définit. On cherche à minimiser le
			<strong>coût en complexité</strong> d'un arbre <KatexInline formula="T" /> :
		</p>
		<KatexBlock formula={costComplexity} />
		<p>
			où <KatexInline formula={'|T|'} /> est le nombre de régions définies par
			<KatexInline formula="T" /> et <KatexInline formula={'\\lambda > 0'} /> un
			hyperparamètre qui pondère l'importance relative de l'erreur et de la
			complexité.
		</p>

		<Callout type="note" title="Simplification assumée">
			<p>
				Nous n'implémentons <strong>pas</strong> l'algorithme d'élagage par liaison
				faible (
				<em>weakest-link pruning</em>
				) : il est nettement plus délicat à implémenter correctement qu'il n'y paraît.
				La démo ci-dessus approxe l'effet de la régularisation par un contrôle
				<strong>direct</strong> de la profondeur et de la taille minimale des feuilles
				(stratégie n°1), qui produit le même effet qualitatif — contraindre la
				complexité <KatexInline formula={'|T|'} /> pour éviter le sur-apprentissage.
			</p>
		</Callout>

		<h2 id="limites">Limites : des apprenants faibles</h2>

		<Callout type="warning" title="⚠ Les arbres seuls sont fragiles">
			<p>
				Les arbres de décision ont tendance à donner des modèles
				<strong>trop simples</strong> et peu robustes : leurs performances sont à
				peine supérieures à celles d'un classifieur aléatoire, et ils sont sensibles
				à de petites variations des données. On les qualifie
				d'<strong>apprenants faibles</strong> (<em>weak learners</em>).
			</p>
			<p>
				Heureusement, il est possible d'y remédier grâce aux
				<strong>méthodes ensemblistes</strong> — bagging, forêts aléatoires,
				boosting — étudiées dans la
				<a href="/part4/lesson1">Partie 4, leçon 1</a> (bagging) et la
				<a href="/part4/lesson2">leçon 2</a> (forêts aléatoires).
			</p>
		</Callout>

		<Callout type="summary" title="Retenir">
			<p>
				Un <strong>arbre de décision</strong> est un modèle hiérarchique : chaque
				nœud teste <strong>une seule variable</strong>, chaque feuille une
				étiquette. Il traite les variables qualitatives (apprentissage non
				métrique), le multiclasse sans OVA, et les classes multimodales — là où
				k-NN et régression logistique sont limités.
			</p>
			<p>
				<strong>CART</strong> construit un arbre binaire par partitionnement
				glouton, récursif et divisif : une seule variable par nœud, coupures
				orthogonales aux axes, donc une frontière non linéaire (en escalier)
				formée de rectangles — un arbre a autant de régions que de feuilles.
			</p>
			<p>
				On choisit la meilleure coupure en <strong>maximisant le gain
				d'information</strong> <KatexInline formula={'\\mathcal{IG}'} />, à partir
				d'un critère d'impureté — <strong>Gini</strong>,
				<strong>entropie</strong> ou
				<strong>erreur de classification</strong> (classification) ; en régression
				on <strong>minimise le MSE</strong> pondéré. L'étiquette d'une feuille est le
				<strong>vote majoritaire</strong> (classification) ou la
				<strong>moyenne</strong> (régression).
			</p>
			<p>
				Pour <strong>arrêter</strong> la construction, on borne la complexité
				(profondeur, nombre de feuilles, taille minimale d'une feuille) par
				validation croisée, ou on <strong>élague</strong> en minimisant le coût
				<KatexInline formula={'C_\\lambda(T)'} /> — compromis biais/variance selon
				la profondeur. Un arbre seul est un <strong>apprenant faible</strong> :
				c'est en l'agrégeant (bagging, forêts, boosting) qu'on en tire un bon
				classifieur.
			</p>
		</Callout>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Azencott, C. A.']}
			year={2011}
			title="Introduction au Machine Learning"
			journal="Dunod. ISBN : 978-2-10-084143-1."
			link="http://cazencott.info/dotclear/public/lectures/IntroML_Azencott.pdf"
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

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		overflow: hidden;
	}

	thead {
		background: color-mix(in srgb, var(--color-epistemic, #4f7cac) 8%, transparent);
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
	}

	td {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: top;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	td p {
		margin: 0.25rem 0;
	}

	.lesson-figure {
		margin: 1rem auto;
		max-width: 26rem;
		text-align: center;
	}

	.lesson-figure.wide {
		max-width: 46rem;
	}

	.lesson-figure img {
		width: 100%;
		height: auto;
		border-radius: 6px;
		border: 1px solid var(--color-border);
	}

	.lesson-figure figcaption {
		margin-top: 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.triple-img {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.triple-img img {
		width: 100%;
		height: auto;
		border-radius: 6px;
		border: 1px solid var(--color-border);
	}

	.demo-guide {
		margin: 0.75rem 0;
		padding: 0.8rem 1rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-epistemic, #4f7cac) 8%, transparent);
		line-height: 1.65;
	}

	.forward-ref {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}
</style>
