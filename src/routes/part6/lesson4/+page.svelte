<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import DoubleDescentDemo from '$lib/components/demos/DoubleDescentDemo.svelte';
	import NeuralGeneralizationExplorer from '$lib/components/demos/NeuralGeneralizationExplorer.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part6/lesson4');
	const tracker = createPageTracker(meta as PageMeta);
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	const tocEntries: TocEntry[] = [
		{
			id: 'introduction',
			label: 'Introduction',
			description: 'Une borne en √(VCdim/n) qui sature sur les réseaux modernes',
			color: 'epistemic'
		},
		{
			id: 'dimension-vc-reseaux',
			label: 'Dimension VC des réseaux de neurones',
			description: 'Bartlett (1998) — VCdim en O(W·L·log W), et pourquoi la borne devient triviale',
			color: 'belief'
		},
		{
			id: 'paradoxe-double-descente',
			label: 'Le paradoxe de la double descente',
			description: 'Sous-paramétré, seuil d’interpolation, sur-paramétré — Belkin et al. (2019)',
			color: 'surprise'
		},
		{
			id: 'pourquoi-ils-generalisent',
			label: 'Pourquoi les réseaux généralisent-ils malgré tout ?',
			description: 'Régularisation implicite de SGD, bornes par normes, complexité de Rademacher',
			color: 'agent'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const hypothesisClass = '\\mathcal H';
	const risk = 'R(h)';
	const sample = '\\mathcal S_n';
	// const delta = '\\delta';
	const confidence = '1-\\delta';
	const nSym = 'n';
	const paramsW = 'W';
	const layersL = 'L';
	const logCardinality = '\\log|\\mathcal H|';
	const vcDim = '\\mathrm{VCdim}';
	const designMatrix = 'X';

	// Dimension VC des réseaux (Bartlett 1998)
	const vcDimNetwork = '\\mathrm{VCdim}(\\mathcal H) = O\\big(W\\, L \\log W\\big)';
	const vcBoundNetwork =
		'|R(h) - R_{\\mathcal S_n}(h)| = O\\left(\\sqrt{\\frac{W L \\log W}{n}}\\right)';
	const modernParams = 'W \\sim 10^8 \\text{ à } 10^{11}';
	const nRequired = 'n \\gg W L \\log W \\approx 10^{10}';
	const typicalSample = 'n \\approx 10^6 \\text{ à } 10^7';

	// Double descent (Belkin et al. 2019)
	const underparamRegime = 'W \\ll n';
	const thresholdRegime = 'W \\approx n';
	const overparamRegime = 'W \\gg n';
	const exactInterpolation = 'R_{\\mathcal S_n}(\\hat h) = 0';

	// Mécanisme : régression linéaire par pseudo-inverse (figure du cours)
	const pseudoInvDim = 'd = 50';
	const nBelowD = 'n < d';
	const nEqualsD = 'n = d';
	const nAboveD = 'n > d';
	const pseudoInvSolution = '\\hat\\beta = X^{-1} y';
	const irreducibleNoise = '\\sigma^2 = 1';
	const dimParam = 'd';

	// Borne par normes (Bartlett, Foster, Telgarsky 2017)
	const weightMatrices = 'W_1, \\dots, W_L';
	const bftBound =
		'R(h) - R_{\\mathcal S_n}(h) = \\tilde{O}\\left( \\frac{\\left(\\prod_{l=1}^L \\|W_l\\|_{\\mathrm{op}}\\right) \\cdot \\left(\\sum_{l=1}^L \\|W_l\\|_F^{2/3}\\right)^{3/2}}{\\sqrt{n}} \\right)';
	const spectralNorm = '\\|\\cdot\\|_{\\mathrm{op}}';
	const frobeniusNorm = '\\|\\cdot\\|_F';

	// Complexité de Rademacher
	const rademacherComplexity =
		'\\widehat{\\mathfrak R}_n(\\mathcal H) = \\mathbb E_{\\sigma}\\left[\\sup_{h\\in\\mathcal H} \\frac{1}{n}\\sum_{i=1}^n \\sigma_i\\, h(X_i)\\right]';
	const rademacherVariables =
		'\\sigma_1,\\dots,\\sigma_n \\text{ i.i.d. de loi de Rademacher},\\quad \\mathbb P(\\sigma_i = \\pm 1) = \\tfrac{1}{2}';
	const lawPowN = 'P^n';
	const rademacherBound =
		'\\sup_{h\\in\\mathcal H} |R(h) - R_{\\mathcal S_n}(h)| \\le 2\\,\\widehat{\\mathfrak R}_n(\\mathcal H) + \\sqrt{\\frac{\\log(2/\\delta)}{2n}}';
	const complexityOrder = 'W L \\log W';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Limites de VC et double descente'}
	subtitle="Quand la borne VC devient triviale et que les réseaux de neurones généralisent quand même"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			Le Théorème 3.3 a étendu la borne de généralisation aux classes infinies en remplaçant
			<KatexInline formula={logCardinality} /> par un terme en <KatexInline formula={vcDim} /> — la dimension
			de Vapnik-Chervonenkis. Appliquée aux réseaux de neurones, cette borne se heurte toutefois à une
			limitation sérieuse : la dimension VC d'un réseau croît avec son nombre de paramètres
			<KatexInline formula={paramsW} />, et les réseaux modernes en possèdent des centaines de
			millions, voire des dizaines de milliards.
		</p>

		<h2 id="dimension-vc-reseaux">Dimension VC des réseaux de neurones</h2>

		<TheoremBlock title="Dimension VC des réseaux de neurones (Bartlett, 1998)">
			<p>
				Pour un réseau de neurones à fonctions d'activation seuil, à <KatexInline
					formula={layersL}
				/> couches et <KatexInline formula={paramsW} /> paramètres :
			</p>
			<KatexBlock formula={vcDimNetwork} />
		</TheoremBlock>

		<p>La borne VC donne donc une erreur de généralisation de l'ordre de :</p>
		<KatexBlock formula={vcBoundNetwork} />

		<ExampleBlock title="Pourquoi la borne devient triviale en pratique">
			<p>
				Pour un réseau moderne, <KatexInline formula={modernParams} /> paramètres. Pour que la borne soit
				non triviale (inférieure à 1), il faudrait :
			</p>
			<KatexBlock formula={nRequired} />
			<p>
				ce qui est <em>astronomiquement</em> plus grand que les datasets d'entraînement habituels (<KatexInline
					formula={typicalSample}
				/>). La borne VC est donc inutilisable en pratique pour les réseaux profonds.
			</p>
		</ExampleBlock>

		<h2 id="paradoxe-double-descente">Le paradoxe de la double descente</h2>

		<p>
			Ce qui rend la situation encore plus paradoxale, c'est que les réseaux de neurones modernes
			généralisent <em>bien</em> en pratique, même dans des régimes où :
		</p>

		<ul>
			<li>
				le nombre de paramètres <KatexInline formula={paramsW} /> dépasse largement
				<KatexInline formula={nSym} /> (<strong>régime sur-paramétré</strong>,
				<KatexInline formula={overparamRegime} />) ;
			</li>
			<li>
				le risque empirique est exactement nul (<KatexInline formula={exactInterpolation} />
				<strong>interpolation</strong>).
			</li>
		</ul>

		<TheoremBlock title="Phénomène de double descente (Belkin et al., 2019)">
			<p>
				En traçant le risque de généralisation en fonction de la complexité du modèle (nombre de
				paramètres), on observe non pas la courbe en U classique du compromis biais-variance, mais
				une
				<strong>double descente</strong> :
			</p>
			<ol>
				<li>
					<strong>Régime sous-paramétré</strong> (<KatexInline formula={underparamRegime} />) : la
					courbe en U classique, le risque augmente quand le modèle est trop complexe.
				</li>
				<li>
					<strong>Seuil d'interpolation</strong> (<KatexInline formula={thresholdRegime} />) : le
					risque explose car le modèle commence à interpoler mais pas encore bien.
				</li>
				<li>
					<strong>Régime sur-paramétré</strong> (<KatexInline formula={overparamRegime} />) : le
					risque
					<em>redescend</em> et peut atteindre des niveaux très bas, malgré l'interpolation.
				</li>
			</ol>
			<p>
				Ce phénomène invalide la vision classique du compromis biais-variance et n'est pas expliqué
				par la théorie VC.
			</p>
		</TheoremBlock>

		<ExampleBlock title="Le mécanisme, vu sur la régression linéaire par pseudo-inverse">
			<p>
				La figure du cours illustre ce phénomène pour la régression linéaire par pseudo-inverse en
				dimension <KatexInline formula={pseudoInvDim} />, en faisant varier la taille de
				l'échantillon
				<KatexInline formula={nSym} /> autour du seuil <KatexInline formula={nEqualsD} /> :
			</p>
			<ul>
				<li>
					Pour <KatexInline formula={nBelowD} /> (régime sous-paramétré), le système est sous-déterminé
					: la pseudo-inverse trouve la solution de norme minimale parmi une infinité de solutions, et
					l'erreur de test est élevée.
				</li>
				<li>
					En <KatexInline formula={nEqualsD} />, le système est exactement déterminé :
					<KatexInline formula={pseudoInvSolution} /> interpole parfaitement les données (risque empirique
					nul) mais l'erreur de test explose car la matrice <KatexInline formula={designMatrix} />
					est mal conditionnée.
				</li>
				<li>
					Pour <KatexInline formula={nAboveD} /> (régime sur-paramétré), le système est sur-déterminé
					: la pseudo-inverse calcule la solution aux moindres carrés, l'erreur de test redescend et converge
					vers l'erreur de Bayes irréductible <KatexInline formula={irreducibleNoise} />.
				</li>
			</ul>
			<p>
				Le minimum global de l'erreur de test n'est pas atteint au seuil d'interpolation mais
				<em>après</em>, dans le régime sur-paramétré.
			</p>
			<p>
				<strong>Remarque de lecture.</strong> La définition du phénomène fait varier le nombre de
				paramètres <KatexInline formula={paramsW} /> à <KatexInline formula={nSym} /> fixe, tandis que
				la démonstration ci-dessous fixe le nombre de paramètres <KatexInline formula={dimParam} /> et
				fait varier <KatexInline formula={nSym} />. Les deux points de vue sont duaux : le seuil est
				toujours l'égalité entre le nombre de paramètres et le nombre d'observations.
			</p>
		</ExampleBlock>

		<InteractiveSection
			number="4.1"
			title="Double descente par pseudo-inverse"
			onInteract={tracker.trackInteraction}
		>
			<DoubleDescentDemo />
		</InteractiveSection>

		<h2 id="pourquoi-ils-generalisent">Pourquoi les réseaux généralisent-ils malgré tout ?</h2>

		<p>
			Plusieurs pistes théoriques ont été explorées, sans qu'aucune ne fournisse une explication
			complète.
		</p>

		<h3>Régularisation implicite de la descente de gradient stochastique (SGD)</h3>

		<p>
			En pratique, on n'atteint pas le minimiseur global du risque empirique <KatexInline
				formula={risk}
			/> mais une solution trouvée par SGD. Il a été montré que SGD a un biais vers les solutions de
			<strong>norme minimale</strong> :
		</p>

		<TheoremBlock
			title="Biais implicite de la descente de gradient (Zhang et al., 2017 ; Soudry et al., 2018)"
		>
			<p>
				Pour la régression logistique sur des données linéairement séparables, la descente de
				gradient converge vers le classifieur de <strong>marge maximale</strong>, c'est-à-dire la
				solution SVM, même sans régularisation explicite.
			</p>
		</TheoremBlock>

		<p>
			Ce biais implicite de l'optimiseur vers des solutions régulières explique partiellement la
			bonne généralisation.
		</p>

		<h3>Bornes basées sur la norme des poids</h3>

		<p>
			Plutôt que de compter les paramètres, on peut mesurer la complexité par la norme des poids.
			Bartlett et al. (2017) montrent :
		</p>

		<TheoremBlock title="Borne par normes (Bartlett, Foster, Telgarsky, 2017)">
			<p>
				Pour un réseau à <KatexInline formula={layersL} /> couches de matrices de poids
				<KatexInline formula={weightMatrices} />, avec probabilité <KatexInline
					formula={confidence}
				/> :
			</p>
			<KatexBlock formula={bftBound} />
			<p>
				où <KatexInline formula={spectralNorm} /> est la norme spectrale et
				<KatexInline formula={frobeniusNorm} /> la norme de Frobenius.
			</p>
		</TheoremBlock>

		<p>
			Cette borne est <strong>indépendante de la profondeur et de la largeur</strong> du réseau en tant
			que tels, et dépend uniquement des normes des poids. Elle peut être non triviale même pour des réseaux
			très larges, si les poids restent petits.
		</p>

		<InteractiveSection
			number="4.2"
			title="Borne VC contre borne par normes"
			onInteract={tracker.trackInteraction}
		>
			<NeuralGeneralizationExplorer />
		</InteractiveSection>

		<h3>Complexité de Rademacher</h3>

		<p>
			Une alternative à la dimension VC est la <strong>complexité de Rademacher</strong>, qui mesure
			la capacité d'une classe à s'adapter à du bruit aléatoire :
		</p>

		<DefinitionBlock title="Complexité de Rademacher empirique">
			<KatexBlock formula={rademacherComplexity} />
			<p>
				où <KatexInline formula={rademacherVariables} />, indépendantes de l'échantillon
				<KatexInline formula={sample} />.
			</p>
		</DefinitionBlock>

		<TheoremBlock title="Borne de Rademacher">
			<p>
				Avec probabilité <KatexInline formula={confidence} /> sous <KatexInline formula={lawPowN} /> :
			</p>
			<KatexBlock formula={rademacherBound} />
		</TheoremBlock>

		<p>
			L'avantage de la complexité de Rademacher sur la dimension VC est qu'elle est
			<strong>data-dependent</strong> : elle dépend de l'échantillon <KatexInline
				formula={sample}
			/> et pas seulement de la classe <KatexInline formula={hypothesisClass} />. Pour des réseaux
			dont les poids sont contraints en norme, elle peut être bornée indépendamment du nombre de
			paramètres.
		</p>

		<Callout type="summary" title="Retenir">
			La borne VC compte la capacité de la classe à briser des points ; appliquée à un réseau à
			<KatexInline formula={paramsW} /> paramètres, elle devient triviale dès que
			<KatexInline formula={nSym} /> est plus petit que <KatexInline formula={complexityOrder} />,
			condition hors de portée des datasets réels. La double descente ajoute un second paradoxe :
			même quand le modèle interpole exactement les données d'entraînement (<KatexInline
				formula={overparamRegime}
			/>, risque empirique nul), le risque de généralisation peut rester très bas. Les explications
			modernes — régularisation implicite de SGD, bornes par normes des poids, complexité de
			Rademacher data-dependent — déplacent la question de « combien de paramètres ? » vers « quelle
			solution l'optimisation sélectionne-t-elle, et combien est-elle régulière ? ». Aucune n'est
			complète : la généralisation des réseaux profonds reste un sujet de recherche actif.
		</Callout>
	</TheorySection>
	<Bibliography>
		<BibElement
			authors={['Bartlett, P. L.']}
			year={1998}
			title="The sample complexity of pattern classification with neural networks: the size of the weights is more important than the size of the network"
			journal="IEEE Transactions on Information Theory, 44(2), 525-536."
		/>
		<BibElement
			authors={['Belkin, M.', 'Hsu, D.', 'Ma, S.', 'Mandal, S.']}
			year={2019}
			title="Reconciling modern machine-learning practice and the classical bias–variance trade-off"
			journal="PNAS, 116(32), 15849-15854."
		/>
		<BibElement
			authors={['Bartlett, P. L.', 'Foster, D. J.', 'Telgarsky, M.']}
			year={2017}
			title="Spectrally-normalized margin bounds for neural networks"
			journal="NeurIPS 2017."
		/>
		<BibElement
			authors={['Zhang, C.', 'Bengio, S.', 'Hardt, M.', 'Recht, B.', 'Vinyals, O.']}
			year={2017}
			title="Understanding deep learning requires rethinking generalization"
			journal="ICLR 2017."
		/>
		<BibElement
			authors={['Soudry, D.', 'Hoffer, E.', 'Nacson, M. S.', 'Gunasekar, S.', 'Srebro, N.']}
			year={2018}
			title="The implicit bias of gradient descent on separable data"
			journal="Journal of Machine Learning Research, 19(1), 2822-2878."
		/>
	</Bibliography>
</PageTemplate>
