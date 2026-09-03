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
	import LinearClassifierExplorer from '$lib/components/demos/LinearClassifierExplorer.svelte';
	import RocCurveExplorer from '$lib/components/demos/RocCurveExplorer.svelte';
	import { asset } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part2/lesson2');
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
			id: 'classification',
			label: 'Classification et classifieur linéaire',
			description: "Prédire la classe d'une observation ; la frontière de décision",
			color: 'epistemic'
		},
		{
			id: 'formulation',
			label: 'Formulation des classifieurs linéaires',
			description: 'Fonctions affines L_d, classes d\'hypothèse H_φ',
			color: 'belief'
		},
		{
			id: 'optimisation',
			label: 'Optimisation dans H_φ',
			description: 'ERM restreint ; linéaire vs. non linéaire',
			color: 'surprise'
		},
		{
			id: 'demi-espaces',
			label: 'Le classifieur des demi-espaces',
			description: 'sign(⟨w,x⟩+b), et pourquoi son risque ne s\'optimise pas',
			color: 'agent'
		},
		{
			id: 'regression-logistique',
			label: 'La régression logistique',
			description: 'La sigmoïde pour nuancer la confiance',
			color: 'positive'
		},
		{
			id: 'interpretation-geometrique',
			label: 'Interprétation géométrique',
			description: 'z, σ(z) et la distance à l\'hyperplan',
			color: 'epistemic'
		},
		{
			id: 'regle-decision',
			label: 'Règle de décision et seuil α',
			description: 'Probabilité prédite, seuil de confiance minimal',
			color: 'belief'
		},
		{
			id: 'choix-cout',
			label: 'Choix de la fonction de coût',
			description: 'Dériver log(1+e^{−yz}) cas par cas',
			color: 'surprise'
		},
		{
			id: 'auc-roc',
			label: 'Évaluer un modèle avec l\'AUC',
			description: 'Courbe ROC, seuil, aire sous la courbe',
			color: 'agent'
		},
		{
			id: 'multiclasse',
			label: 'Régression logistique multiclasse',
			description: 'Une stratégie par classe, et au-delà',
			color: 'neutral'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const calHphi = '\\mathcal{H}_\\phi';
	const calF = '\\mathcal{F}';

	const yMulti = '\\mathcal{Y} = \\{1, \\dots, C\\}';

	const erm =
		'\\hat{f}^* = \\arg\\min_{f \\in \\mathcal{F}} \\; \\frac{1}{n} \\sum_{i=1}^n \\ell\\left(y_i, f(x_i)\\right)';

	const LdDef =
		'L_d = \\left\\{h_{\\mathbf{w},b} : \\mathbf{x} \\mapsto \\langle \\mathbf{w}, \\mathbf{x}\\rangle + b, \\; \\mathbf{w} \\in \\mathbb{R}^d, \\; b \\in \\mathbb{R}\\right\\}';
	const hyperplaneEq = '\\langle \\mathbf{w}, \\mathbf{x}\\rangle + b = 0';
	const lineSlope = '-\\dfrac{w_1}{w_2}';
	const lineIntercept = '-\\dfrac{b}{w_2}';
	const HphiDef =
		'\\mathcal{H}_\\phi := \\left\\{ \\mathbf{x} \\mapsto \\phi \\circ h_{\\mathbf{w},b}(\\mathbf{x}), \\; h_{\\mathbf{w},b} \\in L_d \\right\\}';
	const optiEq =
		'\\left(\\widehat{\\mathbf{w}},\\widehat{b}\\right) = \\arg\\min_{\\mathbf{w} \\in \\mathbb{R}^d, \\; b \\in \\mathbb{R}} \\; \\frac{1}{n} \\sum_{i=1}^n \\ell\\left(y_i, \\phi\\left(\\langle \\mathbf{w}, x_i\\rangle + b\\right)\\right)';

	const signDef = '\\phi_{\\mathrm{sign}}(z) = \\mathrm{sign}(z)';
	const halfSpaceClass = 'h(x) = \\mathrm{sign}\\left(\\langle \\mathbf{w}, x\\rangle + b\\right)';
	const zExample = 'z = \\langle (1,1), (2,-1)\\rangle + 0 = 1';
	const zExample2 = 'z = \\langle (1,1), (-3,1)\\rangle + 0 = -2';

	const sigmoidDef = '\\phi_{\\mathrm{sig}}(z) = \\dfrac{1}{1 + \\exp(-z)}, \\qquad z \\in \\mathbb{R}';
	const sigmoidLimits =
		'\\lim_{z \\to -\\infty} \\phi_{\\mathrm{sig}}(z) = 0 \\qquad \\text{et} \\qquad \\lim_{z \\to +\\infty} \\phi_{\\mathrm{sig}}(z) = 1';

	const probInterpretation =
		'\\phi_{\\mathrm{sig}}\\left(\\langle \\mathbf{w}, x\\rangle + b\\right) = \\mathbb{P}(Y = 1 \\mid X = x)';
	const decisionRule =
		'\\hat{y} = 1 \\;\\text{si}\\; \\phi_{\\mathrm{sig}}\\left(\\langle \\mathbf{w}, x\\rangle + b\\right) \\ge \\alpha, \\qquad \\hat{y} = 0 \\;\\text{sinon}';
	const decisionRuleDefault =
		'\\hat{y} = 1 \\;\\text{si}\\; \\phi_{\\mathrm{sig}} \\ge 0.5, \\qquad \\hat{y} = 0 \\;\\text{sinon}';

	const lossY1 = '\\ell = -\\log \\phi_{\\mathrm{sig}}(z)';
	const lossYm1 =
		'\\ell = -\\log\\left(1 - \\phi_{\\mathrm{sig}}(z)\\right) = -\\log \\phi_{\\mathrm{sig}}(-z)';
	const sigmoidSymmetry = '1 - \\sigma(t) = \\sigma(-t)';
	const lossY1Unif =
		'-\\log \\sigma(z) = \\log\\left(1 + e^{-z}\\right) = \\log\\left(1 + e^{-yz}\\right) \\;\\;\\text{(pour } y = +1\\text{)}';
	const lossYm1Unif =
		'-\\log \\sigma(-z) = \\log\\left(1 + e^{z}\\right) = \\log\\left(1 + e^{-yz}\\right) \\;\\;\\text{(pour } y = -1\\text{)}';
	const logisticLossFinal = '\\ell(y, z) = \\log\\left(1 + \\exp(-yz)\\right)';
	const logRegObjective =
		'\\left(\\widehat{\\mathbf{w}},\\widehat{b}\\right) = \\arg\\min_{\\mathbf{w} \\in \\mathbb{R}^d, \\; b \\in \\mathbb{R}} \\; \\frac{1}{n} \\sum_{i=1}^n \\log\\left(1 + \\exp\\left(-y_i \\left[\\langle \\mathbf{w}, x_i\\rangle + b\\right]\\right)\\right)';

	const tprDef = '\\mathrm{TPR}(\\alpha) = \\dfrac{\\mathrm{TP}}{\\mathrm{TP} + \\mathrm{FN}} = \\text{sensibilité}';
	const fprDef =
		'\\mathrm{FPR}(\\alpha) = \\dfrac{\\mathrm{FP}}{\\mathrm{FP} + \\mathrm{TN}} = 1 - \\text{spécificité}';
	const aucDef =
		'\\mathrm{AUC} = \\text{aire sous la courbe ROC} = \\mathbb{P}\\left(\\text{score}_{+} > \\text{score}_{-}\\right)';

	const softmaxDef =
		'\\mathbb{P}(Y = k \\mid X = x) = \\dfrac{e^{z_k}}{\\sum_{j=1}^{C} e^{z_j}}, \\qquad z_k = \\langle \\mathbf{w}_k, x\\rangle + b_k';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Classifieurs linéaires & régression logistique'}
	subtitle="Classifieurs linéaires, régression logistique et évaluation par l'AUC"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<p class="forward-ref">
			Rappel : le cadre de l'apprentissage supervisé, la minimisation du risque
			empirique (paradigme ERM) et la sélection de modèles par validation croisée sont
			établis dans la <a href="/part2/lesson1">leçon 1</a>. On s'y réfère ici sans les
			représenter.
		</p>

		<h2 id="classification">Classification et classifieur linéaire</h2>

		<p>
			On se place en <strong>classification</strong> :
			<KatexInline formula={yMulti} /> et on cherche à prédire à quelle classe
			appartient une nouvelle observation <KatexInline formula={'x \\in \\mathcal{X}'} />.
		</p>

		<ExampleBlock title="Exemple 2D — données linéairement séparables">
			<p>
				Soit <KatexInline formula={'\\mathcal{X} = \\mathbb{R}^2'} /> et
				<KatexInline formula={'\\mathcal{Y} = \\{0, 1\\}'} />. Les deux groupes de
				la figure se prêtent bien à être discriminés par une droite :
			</p>
			<figure class="lesson-figure">
				<img src={asset('/images/part2/separable.png')} alt="Deux groupes de points séparés par une droite" />
				<figcaption>
					Données de deux classes, séparables par une droite. Tirée de l'ouvrage
					<em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
				</figcaption>
			</figure>
			<p>On souhaiterait discriminer les deux groupes à l'aide d'un classifieur linéaire.</p>
		</ExampleBlock>

		<ExercisePanel number="2.1" title="Qu'est-ce qu'un classifieur linéaire ?">
			<p>
				Comme sur la figure ci-dessus, on dispose de deux groupes de points dans le plan,
				chacun associé à une étiquette. Qu'est-ce qu'un classifieur linéaire ?
			</p>
			{#snippet solution()}
				<p><strong>Solution :</strong></p>
				<p>
					Dans le cas de la classification binaire, un <strong>classifieur linéaire</strong>
					découpe <KatexInline formula={'\\mathcal{X}'} /> en deux parties séparées par un
					<strong>hyperplan</strong> (autrement dit une droite quand
					<KatexInline formula={'d = 2'} />) : d'un côté de l'hyperplan, les points ont
					l'étiquette 0, de l'autre, ils ont l'étiquette 1. Autrement dit,
					<strong>la frontière de décision est un hyperplan</strong>.
				</p>
				<p>
					La figure de gauche (frontière droite) est un classifieur linéaire ; celle de
					droite (frontière courbe) n'en est pas un :
				</p>
				<div class="triple-img two-up">
					<img
						src={asset('/images/part2/separabledroite.png')}
						alt="Nuage de points séparé par une droite"
					/>
					<img
						src={asset('/images/part2/separablecourbe.png')}
						alt="Nuage de points séparé par une courbe"
					/>
				</div>
			{/snippet}
		</ExercisePanel>

		<h2 id="formulation">Formulation des classifieurs linéaires</h2>

		<p>
			On a vu dans la leçon 1 qu'on cherche le classifieur qui minimise le risque
			empirique (pour une fonction de coût <KatexInline formula={'\\ell'} /> donnée) :
		</p>
		<KatexBlock formula={erm} />
		<p>
			Mais plutôt que de chercher <KatexInline formula={'\\hat{f}^*'} /> dans le plus grand
			ensemble <KatexInline formula={calF} /> des fonctions mesurables, on restreint notre
			recherche à un sous-ensemble <KatexInline
				formula={'\\mathcal{H} \\subset \\mathcal{F}'}
			/>
			: <strong>biais inductif</strong> (le choix de
			<KatexInline formula={'\\mathcal{H}'} /> encode une information a priori sur le
			problème). À quoi correspond l'ensemble <KatexInline formula={'\\mathcal{H}'} />
			des classifieurs linéaires ?
		</p>

		<p>
			Puisqu'un classifieur linéaire estime l'étiquette d'un point en fonction de sa
			position par rapport à un hyperplan séparateur, un classifieur linéaire est composé
			de <strong>deux parties</strong> :
		</p>
		<ol>
			<li>une partie qui sélectionne / fixe un hyperplan ;</li>
			<li>
				une partie qui dit où un point <KatexInline formula="x" /> se situe par rapport à
				cet hyperplan, et donc qui estime l'étiquette de <KatexInline formula="x" />.
			</li>
		</ol>

		<p>
			<strong>Partie 1 — l'hyperplan.</strong> On considère l'ensemble des fonctions
			affines de <KatexInline formula={'\\mathbb{R}^d'} /> dans
			<KatexInline formula={'\\mathbb{R}'} /> :
		</p>
		<KatexBlock formula={LdDef} />
		<p>
			À chaque fonction affine <KatexInline formula={'h_{\\mathbf{w},b}'} /> on peut
			associer l'hyperplan d'équation
			<KatexInline formula={hyperplaneEq} />. En classification, pour un point
			<KatexInline formula="x" />, la valeur
			<KatexInline formula={'h_{\\mathbf{w},b}(x)'} /> donne de l'information sur la
			position de <KatexInline formula="x" /> par rapport à cet hyperplan.
		</p>

		<Callout type="note" title="Remarque — dimension 2">
			<p>
				Quand <KatexInline formula={'d = 2'} />, la droite d'équation
				<KatexInline formula={hyperplaneEq} /> avec
				<KatexInline formula={'\\mathbf{w} = (w_1, w_2)'} /> et
				<KatexInline formula={'\\mathbf{x} = (x_1, x_2)'} /> correspond à la droite de
				pente <KatexInline formula={lineSlope} /> et d'ordonnée à l'origine
				<KatexInline formula={lineIntercept} />.
			</p>
		</Callout>

		<p>
			<strong>Partie 2 — l'étiquette.</strong> Savoir où un point se situe par rapport à
			l'hyperplan et en déduire son étiquette est géré par une fonction
			<KatexInline formula={'\\phi'} />. Les classifieurs linéaires sont donc les fonctions
			s'écrivant comme la composée d'une fonction affine avec une fonction
			<KatexInline formula={'\\phi'} /> :
		</p>

		<DefinitionBlock number="2.1" title="Classes d'hypothèses des classifieurs linéaires">
			<p>
				Les <strong>classifieurs linéaires</strong> sont toutes les fonctions appartenant
				aux ensembles <KatexInline formula={calHphi} />, avec
				<KatexInline formula={'\\phi : \\mathbb{R} \\to \\mathcal{Y}'} />, définis par :
			</p>
			<KatexBlock formula={HphiDef} />
			<p>
				Les ensembles <KatexInline formula={calHphi} /> sont appelés
				<strong>classes d'hypothèse</strong>.
			</p>
		</DefinitionBlock>

		<p>Deux remarques :</p>
		<ul>
			<li>
				la classe des classifieurs linéaires contient aussi bien des classifieurs utilisés
				pour des problèmes de régression que pour des problèmes de classification (ou
				pour les deux, comme nous le verrons pour la régression logistique) ;
			</li>
			<li>
				souvent, le choix de la fonction <KatexInline formula={'\\phi'} /> considérée
				dépend du type de problème (classification ou régression) ainsi que de la
				fonction de coût <KatexInline formula={'\\ell'} /> considérée.
			</li>
		</ul>

		<h2 id="optimisation">Optimisation dans H_φ</h2>

		<p>
			On cherche donc <KatexInline formula={'\\hat{f}^*'} /> qui minimise le risque
			empirique lorsque, pour une fonction <KatexInline formula={'\\phi'} /> choisie
			adéquatement, on restreint notre recherche à <KatexInline formula={calHphi} />. La
			fonction <KatexInline formula={'\\phi'} /> étant fixée, on se retrouve à chercher
			<KatexInline
				formula={'\\left(\\widehat{\\mathbf{w}},\\widehat{b}\\right)'}
			/>
			qui minimise le risque empirique :
		</p>
		<KatexBlock formula={optiEq} />

		<h3>Les classifieurs linéaires sont-ils pertinents ?</h3>

		<p>
			Si on fait le choix de se restreindre à la famille des classifieurs linéaires
			<KatexInline formula={'\\mathcal{H}'} /> pour prédire l'étiquette d'un nouveau
			point, c'est qu'on a de bonnes raisons de penser que ce type de classifieurs aura
			des chances d'avoir de bonnes performances. En classification binaire par exemple,
			c'est le cas lorsque les données observées semblent être plus ou moins
			<strong>linéairement séparables</strong> ; si les données sont loin d'être
			linéairement séparables, on préfèrera un classifieur non linéaire :
		</p>

		<figure class="lesson-figure wide">
			<div class="triple-img">
				<img
					src={asset('/images/part2/separable.png')}
					alt="Deux classes linéairement séparables"
				/>
				<img
					src={asset('/images/part2/nonseparable.png')}
					alt="Deux classes non linéairement séparables"
				/>
				<img
					src={asset('/images/part2/nonseparablecercle.png')}
					alt="Deux classes séparables par un cercle"
				/>
			</div>
			<figcaption>
				De gauche à droite : données linéairement séparables, non linéairement séparables,
				séparables par un cercle (donc par un classifieur non linéaire).
			</figcaption>
		</figure>

		<Callout type="warning" title="Remarque — la séparabilité est difficile à juger en grande dimension">
			En dimension 2, il est facile d'estimer si les données semblent plutôt linéairement
			séparables. Mais dès que la dimension augmente, c'est plus difficile ! C'est pourquoi
			il est important d'avoir un avis d'experts sur les données.
		</Callout>

		<h3>Classifieurs linéaires et non linéaires dans ce cours</h3>

		<table>
			<thead>
				<tr>
					<th>Classifieurs linéaires</th>
					<th>Classifieurs non linéaires</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<ul>
							<li>la régression logistique (cette leçon)</li>
							<li>
								les SVM (<a href="/part2/lesson4">leçon 4</a>)
							</li>
						</ul>
					</td>
					<td>
						<ul>
							<li>
								l'algorithme des KNN — régression et classification (
								<a href="/part2/lesson1">leçon 1</a>)
							</li>
						</ul>
						<ul>
							<li>
								les arbres de décision — CART, régression et classification (
								<a href="/part2/lesson3">leçon 3</a>)
							</li>
						</ul>
						<ul>
							<li>
								les SVM à noyaux (<a href="/part2/lesson4">leçon 4</a>)
							</li>
						</ul>
					</td>
				</tr>
			</tbody>
		</table>

		<h2 id="demi-espaces">Le classifieur des demi-espaces</h2>

		<Callout type="note" title="Reconstruction pédagogique">
			<p>
				Les diapositives originales laissent cette section (classifieur des
				demi-espaces) au tableau blanc : seules l'introduction et la question
				« confiance en la prédiction : proche ou pas de la droite » y sont écrites.
				Le contenu ci-dessous est une reconstruction minimale et fidèle de cette
				partie, à partir de l'encadrement des diapositives et de la Partie IX.
			</p>
		</Callout>

		<p>
			Sans perte de généralité, on suppose
			<KatexInline formula={'\\mathcal{Y} = \\{-1, 1\\}'} />. Avant de voir la
			régression logistique, on s'intéresse à un premier classifieur linéaire :
			<strong>le classifieur des demi-espaces</strong>. C'est le cas particulier de la
			définition 2.1 où l'on prend
			<KatexInline formula={signDef} /> :
		</p>
		<KatexBlock formula={halfSpaceClass} />
		<p>
			Le plan est découpé par l'hyperplan
			<KatexInline formula={hyperplaneEq} /> en deux <em>demi-espaces</em> ; l'étiquette
			prédite est celle du demi-espace dans lequel tombe <KatexInline formula="x" />.
		</p>

		<ExampleBlock number="2.1" title="Demi-espaces en dimension 2">
			<p>
				Soit <KatexInline formula={'\\mathbf{w} = (1, 1)'} /> et
				<KatexInline formula={'b = 0'} /> : l'hyperplan est la droite
				<KatexInline formula={'x_1 + x_2 = 0'} />.
			</p>
			<ul>
				<li>
					pour <KatexInline formula={'x = (2, -1)'} /> :
					<KatexInline formula={zExample} /> > 0, donc
					<KatexInline formula={'h(x) = +1'} /> ;
				</li>
				<li>
					pour <KatexInline formula={'x = (-3, 1)'} /> :
					<KatexInline formula={zExample2} /> &lt; 0, donc
					<KatexInline formula={'h(x) = -1'} /> ;
				</li>
				<li>
					pour <KatexInline formula={'x = (1, -1)'} />, le point est
					<strong>sur</strong> l'hyperplan : on adopte la convention
					<KatexInline formula={'\\mathrm{sign}(0) = +1'} /> (choix arbitraire,
					peu important en pratique).
				</li>
			</ul>
		</ExampleBlock>

		<Callout type="warning" title="Le risque du classifieur des demi-espaces ne s'optimise pas">
			<p>
				Avec <KatexInline formula={'\\phi = \\mathrm{sign}'} /> et le coût 0/1, le
				risque empirique restreint à la classe des demi-espaces est
				<strong>non convexe et discontinu</strong> en
				<KatexInline formula={'(\\mathbf{w}, b)'} /> : le gradient est nul presque
				partout, et la descente de gradient ne peut pas être utilisée. La
				caractérisation complète de ce problème (NP-difficulté, formulation par la
				marge) est donnée dans la
				<a href="/part9/lesson1">Partie IX, leçon 1</a>.
			</p>
			<p>
				C'est précisément la <strong>motivation</strong> de la régression logistique
				qui suit : on garde la structure linéaire en
				<KatexInline formula={'(\\mathbf{w}, b)'} />, mais on lisse la sortie pour
				rendre le risque optimisable.
			</p>
		</Callout>

		<h2 id="regression-logistique">La régression logistique</h2>

		<p>
			Au lieu de prendre <KatexInline formula={'\\phi(z) = \\mathrm{sign}(z)'} />, on
			considère la <strong>fonction sigmoïde</strong>, qui retourne un nombre dans
			<KatexInline formula={'[0, 1]'} /> afin de nuancer la confiance en la
			labellisation effectuée :
		</p>

		<DefinitionBlock number="2.2" title="Fonction sigmoïde">
			<KatexBlock formula={sigmoidDef} />
			<p>
				La sigmoïde est croissante et
				<KatexInline formula={sigmoidLimits} />.
			</p>
		</DefinitionBlock>

		<h2 id="interpretation-geometrique">Interprétation géométrique de la sigmoïde</h2>

		<p>
			Soit <KatexInline formula="x" /> et l'hyperplan
			<KatexInline formula={hyperplaneEq} />. La valeur
			<KatexInline formula={'z = \\langle \\mathbf{w}, x\\rangle + b'} /> encode la
			position de <KatexInline formula="x" /> par rapport à
			<KatexInline formula="H" />, et la sigmoïde la traduit en « confiance » :
		</p>

		<table>
			<thead>
				<tr>
					<th>Position de x</th>
					<th>Valeur de z</th>
					<th>Valeur de σ(z)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>x au-dessus et loin de H</td>
					<td>z &gt; 0, très grand</td>
					<td>σ(z) proche de 1</td>
				</tr>
				<tr>
					<td>x en dessous et loin de H</td>
					<td>z &lt; 0, |z| très grand</td>
					<td>σ(z) proche de 0</td>
				</tr>
				<tr>
					<td>x proche de H</td>
					<td>z proche de 0</td>
					<td>σ(z) proche de 1/2</td>
				</tr>
			</tbody>
		</table>

		<p>
			Autrement dit, la sigmoïde transforme la <em>distance</em> signée à
			l'hyperplan en un degré de <strong>confiance en la prédiction</strong> : plus le
			point est loin de la frontière, plus la prédiction est confiante ; près de la
			frontière, le modèle est « hésitant » (valeur proche de 1/2).
		</p>

		<InteractiveSection
			number="2.1"
			title="Classifieur linéaire : demi-espaces face à la sigmoïde"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Déplacez l'hyperplan avec les curseurs
				<KatexInline formula={'w_1'} />, <KatexInline formula={'w_2'} />,
				<KatexInline formula={'b'} />, et placez le point requête par clic. Comparez
				la décision par signe (demi-espaces) et celle par seuillage de la sigmoïde :
				elles ne diffèrent que quand <KatexInline formula={'\\alpha \\neq 0.5'} />.
				Le risque logistique empirique (lissé, optimisable) et le risque 0-1
				(discontinu) sont affichés en continu — c'est l'écart entre ces deux risques
				que la Partie IX met en perspective.
			</p>
			<LinearClassifierExplorer />
		</InteractiveSection>

		<h2 id="regle-decision">Règle de décision et seuil α</h2>

		<p>
			Puisque <KatexInline formula={'\\phi_{\\mathrm{sig}}(z)'} /> renvoie un nombre
			dans <KatexInline formula={'[0, 1]'} /> — et non directement une étiquette —, il
			faut décider quelle étiquette <KatexInline formula={'\\hat{y}'} /> prédire pour
			une observation <KatexInline formula="x" />, c'est-à-dire quelle
			<strong>règle de décision</strong> adopter.
		</p>

		<p>
			L'étiquette prédite est la même que celle du classifieur des demi-espaces, sauf
			qu'ici la sigmoïde permet de nuancer l'estimation : si
			<KatexInline formula="x" /> est proche de l'hyperplan,
			<KatexInline formula={'\\phi_{\\mathrm{sig}}(z)'} /> est proche de
			<KatexInline formula={'1/2'} /> ; si <KatexInline formula="x" /> est loin de
			l'hyperplan, <KatexInline formula={'\\phi_{\\mathrm{sig}}(z)'} /> est proche de 0
			ou de 1.
		</p>

		<Callout type="insight" title="Interprétation probabiliste">
			<KatexInline formula={probInterpretation} /> : la sortie de la régression
			logistique s'interprète comme la probabilité pour que l'étiquette de
			<KatexInline formula="x" /> soit égale à 1.
		</Callout>

		<p>
			La règle de décision consiste alors à seuiller cette probabilité. De manière
			générale, on décide que <KatexInline formula={'\\hat{y} = 1'} /> si
			<KatexInline formula={'\\phi_{\\mathrm{sig}} \\ge \\alpha'} />, avec
			<KatexInline formula={'\\alpha \\in \\,]0, 1['} />, <KatexInline
				formula={'\\hat{y} = 0'} /> sinon :
		</p>
		<KatexBlock formula={decisionRule} />
		<p>
			Le seuil <KatexInline formula={'\\alpha'} /> représente le
			<strong>niveau de confiance minimal</strong> qu'on est prêt à accepter pour
			décider que <KatexInline formula={'\\hat{y} = 1'} />. Le choix par défaut est
			<KatexInline formula={'\\alpha = 0.5'} /> :
		</p>
		<KatexBlock formula={decisionRuleDefault} />
		<p>
			Un seuil <KatexInline formula={'\\alpha < 0.5'} /> a du sens quand on accepte
			de sur-prédire la classe positive plutôt que de la manquer — par exemple en
			diagnostic médical, où un faux négatif (malade déclaré sain) est bien plus
			grievement préjudiciable qu'un faux positif (sain déclaré malade) :
		</p>

		<ExampleBlock number="2.2" title="TP3 — le seuil α en cancérologie">
			<p>
				Les données du <a
					href={asset('/rmd/TP3-RegLog_enonce.Rmd')}
					target="_blank"
					rel="noopener noreferrer"
					>TP3 — régression logistique</a
				>
				portent sur 53 patients atteints du cancer de
				la prostate : on veut prédire l'atteinte du système lymphatique
				(<KatexInline formula={'lymph'} />), dont la mesure directe nécessite une
				intervention chirurgicale. Rater une atteinte (faux négatif) expose le
				patient à un traitement insuffisant : baisser le seuil
				<KatexInline formula={'\\alpha'} /> sous 0.5 — prédire « atteinte » dès
				qu'une probabilité modérée le suggère — est alors un choix justifié, au
				prix de faux positifs supplémentaires.
			</p>
		</ExampleBlock>

		<h2 id="choix-cout">Choix de la fonction de coût</h2>

		<Callout type="note" title="Reconstruction pédagogique">
			<p>
				Les diapositives présentent cette dérivation en trois frames à trous
				(cas <KatexInline formula={'y = 1'} />, cas
				<KatexInline formula={'y = -1'} />, allure de la perte), à compléter au
				tableau. La rédaction ci-dessous est une reconstruction fidèle du
				déroulé, en réutilisant les identités de la sigmoïde déjà démontrées dans
				la <a href="/part9/lesson1">Partie IX</a>.
			</p>
		</Callout>

		<p>
			Maintenant que <KatexInline formula={'\\phi = \\phi_{\\mathrm{sig}}'} /> a été
			choisie, quelle fonction de coût <KatexInline formula={'\\ell'} /> adopter ?
			La fonction de coût va nous permettre de trouver les paramètres
			<KatexInline
				formula={'(\\widehat{\\mathbf{w}}, \\widehat{b})'}
			/>
			qui vérifient l'équation de minimisation. On souhaite que la pénalisation ne
			dépende plus <em>uniquement</em> de la position de
			<KatexInline formula="x" /> par rapport à l'hyperplan (signe de
			<KatexInline formula="z" />) mais <strong>également de sa distance</strong> à
			l'hyperplan : une prédiction confiante dans le mauvais sens doit être
			beaucoup plus pénalisée qu'une prédiction hésitante.
		</p>

		<h3>Cas y = +1</h3>
		<p>
			Si la vraie étiquette est <KatexInline formula={'y = 1'} />, on veut une
			pénalisation <strong>décroissante</strong> de
			<KatexInline formula={'\\phi_{\\mathrm{sig}}(z)'} /> : plus la probabilité
			prédite est élevée, moins on pénalise. On prend donc :
		</p>
		<KatexBlock formula={lossY1} />
		<p>
			vérifions le comportement : si
			<KatexInline formula={'\\phi_{\\mathrm{sig}}(z) \\to 1'} /> (prédiction
			correcte et confiante), la perte tend vers 0 ; si
			<KatexInline formula={'\\phi_{\\mathrm{sig}}(z) \\to 0'} /> (prédiction
			erronée et confiante), elle diverge ; au seuil d'hésitation
			<KatexInline formula={'\\phi_{\\mathrm{sig}}(z) = 1/2'} />, elle vaut
			<KatexInline formula={'\\log 2'} />.
		</p>

		<h3>Cas y = −1</h3>
		<p>
			Si la vraie étiquette est <KatexInline formula={'y = -1'} />, on veut une
			pénalisation <strong>croissante</strong> de
			<KatexInline formula={'\\phi_{\\mathrm{sig}}(z)'} />, donc décroissante de
			<KatexInline formula={'1 - \\phi_{\\mathrm{sig}}(z)'} /> :
		</p>
		<KatexBlock formula={lossYm1} />
		<p>
			où la dernière égalité utilise l'identité
			<KatexInline formula={sigmoidSymmetry} />
			(démontrée dans la <a href="/part9/lesson1">Partie IX, leçon 1</a> — section
			« Logistique et cross-entropy »).
		</p>

		<h3>Une formule unique</h3>
		<p>
			On veut donc une fonction <KatexInline formula={'\\ell'} /> qui augmente quand
			<KatexInline
				formula={'1 + \\exp\\left(-y\\left(\\langle \\mathbf{w}, x\\rangle + b\\right)\\right)'}
			/>
			augmente : on considère la fonction <KatexInline formula={'\\log'} />. En
			explicitant les deux cas (avec
			<KatexInline formula={'z = \\langle \\mathbf{w}, x\\rangle + b'} />) :
		</p>
		<KatexBlock formula={lossY1Unif} />
		<KatexBlock formula={lossYm1Unif} />
		<p>Les deux cas s'unifient en la <strong>perte logistique</strong> :</p>
		<KatexBlock formula={logisticLossFinal} />
		<p>
			Que vaut cette perte en fonction de <KatexInline formula="z" /> ? Pour
			<KatexInline formula={'y = 1'} />,
			<KatexInline
				formula={'z \\mapsto \\log(1 + e^{-z})'}
			/>
			décroît de <KatexInline formula={'+\\infty'} /> (quand
			<KatexInline formula={'z \\to -\\infty'} />) vers 0 (quand
			<KatexInline formula={'z \\to +\\infty'} />) ; pour
			<KatexInline formula={'y = -1'} />, c'est l'image miroir :
			<KatexInline
				formula={'z \\mapsto \\log(1 + e^{z})'}
			/>
			croît de 0 vers <KatexInline formula={'+\\infty'} />. Dans les deux cas la
			fonction est convexe, vaut <KatexInline formula={'\\log 2'} /> en
			<KatexInline formula={'z = 0'} />, et a un gradient non nul presque
			partout — là où la perte 0-1 est plate : c'est ce qui rend la descente de
			gradient possible.
		</p>

		<p>
			À partir des données d'apprentissage
			<KatexInline
				formula={'(x_1, y_1), \\dots, (x_n, y_n) \\in \\mathcal{X} \\times \\mathcal{Y}'}
			/>
			, on cherche donc <KatexInline
				formula={'(\\widehat{\\mathbf{w}}, \\widehat{b})'}
			/>
			tels que :
		</p>
		<KatexBlock formula={logRegObjective} />

		<Callout type="note" title="Remarque">
			<p>
				Les paramètres <KatexInline formula={'\\widehat{\\mathbf{w}}'} /> et
				<KatexInline formula={'\\widehat{b}'} /> de l'hyperplan optimal dépendent
				des données d'apprentissage.
			</p>
			<p>Pour une nouvelle observation <KatexInline formula="x" /> :</p>
			<KatexBlock formula={'\\hat{y} = 1 \\;\\text{si}\\; \\phi_{\\mathrm{sig}}\\left(\\langle \\widehat{\\mathbf{w}}, x\\rangle + \\widehat{b}\\right) \\ge 0.5, \\qquad \\hat{y} = 0 \\;\\text{sinon}'} />
		</Callout>

		<p>
			La perte obtenue est exactement la perte logistique de la
			<a href="/part9/lesson1">Partie IX</a>, où elle est reliée rigoureusement à
			la cross-entropy et étudiée comme perte de substitution (marge
			<KatexInline formula={'y f(x)'} />). La question « minimiser cette perte
			mène-t-elle bien au classifieur de Bayes ? » (calibration) y est traitée dans
			la <a href="/part9/lesson2">leçon 2 de la Partie IX</a>.
		</p>

		<Callout type="insight" title="Demi-espaces, régression linéaire seuillée, régression logistique">
			<p>
				<em
					>Question des diapositives : quelle différence entre le classifieur
					des demi-espaces et celui de la régression linéaire ?</em
				>
			</p>
			<p>
				Chacun est un classifieur linéaire <KatexInline formula={calHphi} /> au
				sens de la définition 2.1 — ils n'ont pas la même fonction
				<KatexInline formula={'\\phi'} /> ni le même coût :
			</p>
			<ul>
				<li>
					<strong>demi-espaces</strong> :
					<KatexInline formula={'\\phi = \\mathrm{sign}'} />, coût 0/1 —
					risque non convexe, discontinu, non optimisable ;
				</li>
				<li>
					<strong>régression linéaire seuillée</strong> :
					<KatexInline formula={'\\phi = \\mathrm{id}'} /> (sortie réelle) avec
					coût quadratique (perte « Carrée (Brier) » du tableau de la
					<a href="/part9/lesson1">Partie IX</a>), puis seuillage de la sortie à
					0.5 — risque convexe, mais la sortie n'a pas d'interprétation en
					probabilité ;
				</li>
				<li>
					<strong>régression logistique</strong> :
					<KatexInline formula={'\\phi = \\phi_{\\mathrm{sig}}'} />, coût
					logistique — risque convexe <em>et</em> sortie interprétable comme
					probabilité, c'est le meilleur des deux mondes.
				</li>
			</ul>
		</Callout>

		<h2 id="auc-roc">Évaluer un modèle avec l'AUC</h2>

		<Callout type="note" title="Reconstruction pédagogique">
			<p>
				Les diapositives annoncent cette section (performance en fonction du
				seuil, cas du classifieur parfait, cas du classifieur aléatoire,
				exercice) mais laissent le développement au tableau. La rédaction
				ci-dessous suit le déroulé du
				<a
					href={asset('/rmd/TP3-RegLog_enonce.Rmd')}
					target="_blank"
					rel="noopener noreferrer"
					>TP3</a
				>
				(prédictions, seuil, matrice de confusion, courbe ROC, AUC).
			</p>
		</Callout>

		<p>
			Une fois les paramètres <KatexInline formula={'(\\mathbf{w}, b)'} /> d'un
			modèle de régression logistique ajustés, on peut regarder les performances
			du modèle en termes de classification grâce aux métriques vues dans la
			leçon 1 (accuracy, sensibilité, précision, etc.). Mais toutes ces métriques
			dépendent du seuil <KatexInline formula={'\\alpha'} /> : on cherche donc à
			regarder <strong>comment évoluent les performances quand on fait varier
			<KatexInline formula={'\\alpha'} /></strong>.
		</p>

		<DefinitionBlock number="2.3" title="Courbe ROC">
			<p>
				La <strong>courbe ROC</strong> (Receiver Operating Characteristic) est
				la courbe paramétrée par le seuil
				<KatexInline formula={'\\alpha'} />, qui associe à chaque seuil le
				couple (FPR, TPR) :
			</p>
			<ul>
				<li>
					l'abscisse est le taux de faux positifs
					<KatexInline formula={fprDef} /> ;
				</li>
				<li>
					l'ordonnée est le taux de vrais positifs, c'est-à-dire la
					sensibilité <KatexInline formula={tprDef} /> (définie dans la
					leçon 1).
				</li>
			</ul>
		</DefinitionBlock>

		<p>Deux cas limites, matérialisés dans la démo ci-dessous :</p>
		<ul>
			<li>
				<strong>classifieur parfait</strong> : il existe un seuil qui sépare
				totalement les deux classes — la courbe passe par le coin haut-gauche
				(0, 1) et l'aire sous la courbe vaut 1 ;
			</li>
			<li>
				<strong>classifieur aléatoire</strong> : les scores sont
				indépendants des étiquettes — la courbe est la diagonale et l'aire vaut
				0,5.
			</li>
		</ul>

		<InteractiveSection
			number="2.2"
			title="Courbe ROC et AUC"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Chaque point de la courbe correspond à un
				seuil <KatexInline formula={'\\alpha'} /> : déplacez le curseur de seuil
				et comparez le point d'exploitation avec la matrice de confusion
				associée. Changez la séparation des classes : la courbe s'éloigne de la
				diagonale (classifieur aléatoire) vers le coin (0,1) (classifieur
				parfait), et l'AUC suit. L'AUC est l'outil pour <em>comparer</em> des
				modèles — pas le seuil lui-même.
			</p>
			<RocCurveExplorer />
		</InteractiveSection>

		<p>
			L'<strong>AUC</strong> (Area Under the Curve), calculée sur l'échantillon de
			validation, est l'aire sous la courbe ROC :
		</p>
		<KatexBlock formula={aucDef} />
		<p>
			Autrement dit, l'AUC est la probabilité qu'un score positif tiré au hasard
			dépasse un score négatif tiré au hasard : c'est une mesure de la capacité du
			modèle à <em>classer correctement</em> (ranger les positifs au-dessus des
			négatifs) <strong>quelle que soit</strong> la valeur du seuil. L'AUC peut
			servir à choisir entre différents modèles sur un jeu de validation.
		</p>

		<ExercisePanel number="2.2" title="Tracer une courbe ROC à la main">
			<p>
				Un modèle de régression logistique donne les scores (sorties du modèle
				<KatexInline formula={'z = \\langle \\widehat{\\mathbf{w}}, x\\rangle + \\widehat{b}'} />)
				suivants sur un échantillon de validation :
			</p>
			<table class="exercise-table">
				<caption>Scores et étiquettes réelles</caption>
				<thead>
					<tr>
						<th>Observation</th>
						<th>1</th>
						<th>2</th>
						<th>3</th>
						<th>4</th>
						<th>5</th>
						<th>6</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th>Score</th>
						<td>0.4</td>
						<td>0.7</td>
						<td>1.1</td>
						<td>0.2</td>
						<td>1.5</td>
						<td>0.9</td>
					</tr>
					<tr>
						<th>Étiquette réelle</th>
						<td>0</td>
						<td>1</td>
						<td>1</td>
						<td>0</td>
						<td>1</td>
						<td>0</td>
					</tr>
				</tbody>
			</table>
			<p>
				La règle de décision est « prédire 1 si score ≥ α ». Pour chaque seuil
				<KatexInline formula={'\\alpha \\in \\{0.5, 0.8, 1.2\\}'} /> :
			</p>
			<ol>
				<li>donner la matrice de confusion (TP, FP, TN, FN) ;</li>
				<li>calculer TPR et FPR, et donner le point ROC correspondant.</li>
			</ol>
			<p>
				<em
					>Indication :</em> il y a 3 positifs et 3 négatifs dans
					l'échantillon ; trier les scores en ordre décroissant suffit à
					déterminer quand chaque observation change de prédiction.
				</p>
			{#snippet solution()}
				<p><strong>Solution :</strong></p>
				<p>
					Positifs : observations 2 (0.7), 3 (1.1), 5 (1.5). Négatifs : 1
					(0.4), 4 (0.2), 6 (0.9).
				</p>
				<p>
					<strong>α = 1.2.</strong> Prédit 1 : seule l'observation 5 (1.5 ≥
					1.2). TP = 1, FN = 2, FP = 0, TN = 3.
				</p>
				<KatexBlock formula={'\\mathrm{TPR} = 1/3, \\qquad \\mathrm{FPR} = 0/3 = 0 \\quad \\Rightarrow \\quad \\text{point } \\left(0, \\tfrac{1}{3}\\right)'} />
				<p>
					<strong>α = 0.8.</strong> Prédit 1 : observations 3 (1.1), 5 (1.5), 6
					(0.9). TP = 2 (obs. 3, 5), FN = 1 (obs. 2), FP = 1 (obs. 6), TN = 2
					(obs. 1, 4).
				</p>
				<KatexBlock formula={'\\mathrm{TPR} = 2/3, \\qquad \\mathrm{FPR} = 1/3 \\quad \\Rightarrow \\quad \\text{point } \\left(\\tfrac{1}{3}, \\tfrac{2}{3}\\right)'} />
				<p>
					<strong>α = 0.5.</strong> Prédit 1 : observations 2 (0.7), 3 (1.1), 5
					(1.5), 6 (0.9). TP = 3, FN = 0, FP = 1 (obs. 6), TN = 2.
				</p>
				<KatexBlock formula={'\\mathrm{TPR} = 3/3 = 1, \\qquad \\mathrm{FPR} = 1/3 \\quad \\Rightarrow \\quad \\text{point } \\left(\\tfrac{1}{3}, 1\\right)'} />
				<p><strong>Lecture.</strong></p>
				<p>
					En descendant le seuil de 1.2 à 0.5, la courbe ROC progresse de
					<KatexInline formula={'(0, 1/3)'} /> à
					<KatexInline formula={'(1/3, 2/3)'} /> puis
					<KatexInline formula={'(1/3, 1)'} /> : on gagne toujours en
					sensibilité, parfois au prix de faux positifs. La courbe complète
					s'obtient en répétant le calcul pour tous les seuils distincts (ici
					1.5, 1.1, 0.9, 0.7, 0.4, 0.2) : elle part de (0,0) quand le seuil
					est très haut (rien n'est prédit positif) et finit en (1,1) quand il
					est très bas (tout est prédit positif) — exactement ce que fait la
					démo interactive ci-dessus.
				</p>
			{/snippet}
		</ExercisePanel>

		<h2 id="multiclasse">La régression logistique multiclasse</h2>

		<Callout type="note" title="Reconstruction minimale">
			<p>
				Les diapositives s'arrêtent à « plusieurs stratégies possibles » pour
				<KatexInline formula={'\\mathcal{Y} = \\{1, \\dots, C\\}'} />. La
				stratégie décrite ci-dessous est celle standard du cours (une
				régression logistique par classe) ; le complément softmax est signalé
				comme extension au-delà du cours.
			</p>
		</Callout>

		<p>
			En multiclasse, <KatexInline formula={yMulti} />, la stratégie la plus simple
			est la stratégie <strong>One-Versus-All (OVA)</strong> — déjà rencontrée
			dans la leçon 1 pour les métriques multiclasse : on entraîne
			<KatexInline formula="C" /> régressions logistiques binaires, la
			<KatexInline formula="k" />-ième opposant la classe
			<KatexInline formula="k" /> aux autres, et on prédit la classe dont la
			probabilité prédite est la plus élevée. Chaque modèle est évalué (matrice
			de confusion, AUC) en binaire, puis les prédictions sont combinées comme
			dans la leçon 1.
		</p>

		<Callout type="insight" title="Extension — régression logistique multinomiale (au-delà du cours)">
			<p>
				Plutôt que <KatexInline formula="C" /> modèles binaires indépendants, on
				peut généraliser directement la sigmoïde en <strong>softmax</strong> :
			</p>
			<KatexBlock formula={softmaxDef} />
			<p>
				avec <KatexInline formula="C" /> hyperplans, et on maximise la
				cross-entropy multinomiale (généralisation de la vraisemblance de
				Bernoulli). La régression logistique binaire est le cas
				<KatexInline formula={'C = 2'} /> : par invariance à translation,
				<KatexInline
					formula={'\\mathbb{P}(Y = 1 \\mid X = x) = \\sigma(z_1 - z_0)'}
				/>. Cette extension n'est pas développée dans les diapositives.
			</p>
		</Callout>

		<Callout type="summary" title="Retenir">
			<p>
				Un <strong>classifieur linéaire</strong> est une composée
				<KatexInline formula={'\\phi \\circ h_{\\mathbf{w},b}'} /> : une
				fonction affine <KatexInline
					formula={'h_{\\mathbf{w},b}(x) = \\langle \\mathbf{w}, x\\rangle + b'}
				/>
				(qui fixe l'hyperplan de décision) et une fonction
				<KatexInline formula={'\\phi'} /> (qui transforme la position en
				étiquette). Les ensembles
				<KatexInline formula={calHphi} /> sont les classes d'hypothèse ; on
				optimise
				<KatexInline formula={'(\\mathbf{w}, b)'} /> en minimisant le risque
				empirique restreint à <KatexInline formula={calHphi} />.
			</p>
			<p>
				Le <strong>classifieur des demi-espaces</strong>
				<KatexInline formula={'\\phi = \\mathrm{sign}'} /> avec coût 0/1 a un
				risque non convexe et discontinu : il ne s'optimise pas. La
				<strong>régression logistique</strong> remplace le signe par la
				<strong>sigmoïde</strong>, qui transforme la distance signée à
				l'hyperplan en confiance (1/2 près de la frontière, 0 ou 1 loin d'elle)
				et s'interprète comme
				<KatexInline formula={'\\mathbb{P}(Y = 1 \\mid X = x)'} /> ; la perte
				associée <KatexInline
					formula={'\\log(1 + e^{-yz})'}
				/>
				, dérivée cas par cas, est convexe et optimisable, et s'unifie avec la
				cross-entropy (Partie IX).
			</p>
			<p>
				La décision seuille cette probabilité :
				<KatexInline formula={'\\hat{y} = 1'} /> si
				<KatexInline formula={'\\sigma \\ge \\alpha'} /> ; le seuil
				<KatexInline formula={'\\alpha'} /> encode le compromis
				faux-positifs / faux-négatifs.
			</p>
			<p>
				Pour <strong>évaluer</strong>, on ne regarde pas une métrique à un seuil
				fixe mais la <strong>courbe ROC</strong> (FPR vs. TPR quand
				<KatexInline formula={'\\alpha'} /> varie) : le classifieur parfait
				atteint le coin (0,1) (AUC = 1), l'aléatoire suit la diagonale (AUC =
				0,5). L'<strong>AUC</strong>, égale à
				<KatexInline
					formula={'\\mathbb{P}(\\text{score}_+ > \\text{score}_-)'}
				/>
				, compare des modèles sur un jeu de validation, indépendamment du
				seuil.
			</p>
			<p>
				En multiclasse, la stratégie OVA entraîne une régression logistique par
				classe ; le softmax en est la généralisation multinomiale directe
				(au-delà du cours).
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
			journal="Cambridge University Press. DOI : 10.1017/CBO9781107298019."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning"
			journal="Springer New York. DOI : 10.1007/978-0-387-84858-7."
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

	td ul {
		margin: 0.25rem 0;
		padding-left: 1.1rem;
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

	.triple-img.two-up {
		grid-template-columns: repeat(2, 1fr);
		max-width: 30rem;
		margin: 0.75rem auto;
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

	.exercise-table {
		width: 100%;
		max-width: 34rem;
		margin: 0.75rem 0;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.exercise-table caption {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.exercise-table th,
	.exercise-table td {
		border: 1px solid var(--color-border);
		padding: 0.4rem 0.75rem;
		text-align: center;
	}

	.exercise-table thead th {
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.exercise-table tbody th {
		text-align: left;
	}

	.forward-ref {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}
</style>
