<script lang="ts">
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
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	import Quiz from '$lib/components/narrative/Quiz.svelte';
	import { getQuizQuestions } from '$lib/quiz';

	const meta = getPageByPath('/part2/rkhs-methodes-noyau');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz = getQuizQuestions('p2/rkhs');
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
			label: 'De l’astuce du noyau à la théorie',
			description: 'Quel objet justifie le kernel trick ?',
			color: 'epistemic'
		},
		{
			id: 'theoreme-mercer',
			label: 'Le théorème de Mercer',
			description: 'La forme spectrale du noyau',
			color: 'positive'
		},
		{
			id: 'rkhs',
			label: 'Les espaces de Hilbert à noyau',
			description: 'Définition, unicité, construction',
			color: 'belief'
		},
		{
			id: 'theoreme-representant',
			label: 'Le théorème du représentant',
			description: 'L’infini se réduit à ℝⁿ',
			color: 'belief'
		},
		{
			id: 'krr',
			label: 'La régression à noyau ridge',
			description: 'Forme close, pont ridge, limites',
			color: 'surprise'
		},
		{
			id: 'noyaux-universels',
			label: 'Noyaux universels et consistance',
			description: 'Le gaussien est universel',
			color: 'neutral'
		},
		{
			id: 'ponts',
			label: 'Les ponts : SVM, k-NN, NTK',
			description: 'Un cadre, trois lectures',
			color: 'agent'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'La boîte à outils RKHS',
			color: 'epistemic'
		}
	];

	/* ---------------------------- formules KaTeX ---------------------------- */

	const evalMap = String.raw`L_x : f \mapsto f(x)`;

	const riesz = String.raw`f(x) = \langle f,\, K_x \rangle_{\mathcal{H}} \qquad \forall f \in \mathcal{H}`;

	const rkhsKernel = String.raw`K(x, y) := \langle K_x,\, K_y \rangle_{\mathcal{H}}`;

	const hs0 = String.raw`\mathcal{H}_0 = \operatorname{span}\{ K_x : x \in X \}`;

	const hs0Inner = String.raw`\big\langle \sum_j b_j\, K_{y_j},\; \sum_i a_i\, K_{x_i} \big\rangle := \sum_{i,j} a_i\, b_j\, K(y_j, x_i)`;

	const reproProp = String.raw`f(x) = \langle f,\, K(\cdot, x) \rangle_{\mathcal{H}_K}`;

	const mercerPos = String.raw`\int_a^b \int_a^b K(x,y)\, f(x)\, f(y)\, dx\, dy \ge 0`;

	const mercerOp = String.raw`(T_K f)(x) = \int_a^b K(x,y)\, f(y)\, dy`;

	const mercer = String.raw`K(x,y) = \sum_{i=1}^{\infty} \lambda_i\, \phi_i(x)\, \phi_i(y)`;

	const featureMap = String.raw`\phi(x) = \big( \sqrt{\lambda_1}\,\phi_1(x),\; \sqrt{\lambda_2}\,\phi_2(x),\; \dots \big) \in \ell^2`;

	const spectralSpace = String.raw`f(x) = \sum_{i=1}^{\infty} c_i\, \phi_i(x), \qquad \sum_i \frac{c_i^2}{\lambda_i} < \infty`;

	const spectralNorm = String.raw`\lVert f \rVert^2_{\mathcal{H}_K} = \sum_i \frac{c_i^2}{\lambda_i}`;

	const representerObj = String.raw`f \;\longmapsto\; E\big( (x_1, y_1, f(x_1)),\, \dots,\, (x_n, y_n, f(x_n)) \big) \;+\; g\big( \lVert f \rVert_{\mathcal{H}_K} \big)`;

	const representer = String.raw`f^\star(\cdot) = \sum_{i=1}^{n} \alpha_i\, K(\cdot, x_i)`;

	const krrObj = String.raw`f^\star_\lambda \in \arg\min_{f \in \mathcal{H}_K}\; \frac{1}{n} \sum_{i=1}^{n} \big( y_i - f(x_i) \big)^2 \;+\; \lambda\, \lVert f \rVert^2_{\mathcal{H}_K}`;

	const krrAlpha = String.raw`f^\star_\lambda(\cdot) = \sum_{i=1}^{n} \alpha^\star_i\, K(\cdot, x_i), \qquad \alpha^\star = \big( K + n\lambda\, I_n \big)^{-1} y`;

	const krrNorm = String.raw`\lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K} = \alpha^{\star\top} K\, \alpha^\star = y^\top K\, \big( K + n\lambda I_n \big)^{-2} y`;

	const krrPhi = String.raw`\Phi(\alpha) = \frac{1}{n} \lVert y - K\alpha \rVert^2 + \lambda\, \alpha^\top K \alpha`;

	const krrGrad = String.raw`\nabla_\alpha \Phi = \frac{2}{n} K\big( K\alpha - y \big) + 2\lambda K \alpha = 0`;

	const ridgeBridge = String.raw`K\, \alpha^\star = X \, \big( X^\top X + n\lambda\, I \big)^{-1} X^\top y`;

	const gaussianKernel = String.raw`K(x, x') = \exp\big( -\gamma\, \lVert x - x' \rVert^2 \big), \qquad \gamma > 0`;

	const fourierGauss = String.raw`\hat k(\omega) = \frac{1}{(2\pi\gamma)^{d/2}}\, \exp\big( -\lVert \omega \rVert^2 / (4\gamma) \big)`;

	const consistency = String.raw`\lambda_n \to 0 \quad \text{et} \quad n\, \lambda_n \to +\infty \quad \Longrightarrow \quad \big\lVert f^\star_{n,\lambda_n} - f^\star_\mu \big\rVert_{L^2(\mu)} \xrightarrow{\ \mathbb{P}\ } 0`;

	const svmDual = String.raw`\widehat\alpha \in \arg\max_{\alpha}\; \sum_{i=1}^{n} \alpha_i \;-\; \frac{1}{2} \sum_{i,\ell} \alpha_i \alpha_\ell\, y_i\, y_\ell\, K(x_i, x_\ell)`;

	const boxKernel = String.raw`\hat f(x) = \frac{ \sum_{i=1}^n \mathbf{1}\big\{ \lVert x_i - x \rVert \le r_k(x) \big\}\, y_i }{ \sum_{i=1}^n \mathbf{1}\big\{ \lVert x_i - x \rVert \le r_k(x) \big\} }`;

	const ntkDef = String.raw`K_{\mathrm{ntk}}(x, x') = \big\langle \nabla_\theta f_\theta(x),\; \nabla_\theta f_\theta(x') \big\rangle`;

	// Exercice 1 (KRR 2×2).
	const k2Mat = String.raw`K = \begin{pmatrix} 1 & \rho \\ \rho & 1 \end{pmatrix}`;

	const ex1Alpha = String.raw`\alpha^\star = \frac{1 + 2\lambda + \rho}{D} \begin{pmatrix} 1 \\ -1 \end{pmatrix}, \qquad D = (1 + 2\lambda)^2 - \rho^2`;

	const ex1Norm = String.raw`\lVert f^\star \rVert^2 = 2\,\alpha_1^2\, (1 - \rho) = \frac{2\, (1 + 2\lambda + \rho)^2\, (1 - \rho)}{D^2}`;

	const ex1Inv = String.raw`K^{-1} y = \frac{1}{1 - \rho} \begin{pmatrix} 1 \\ -1 \end{pmatrix}`;

	// Exercice 2 (décroissance de la norme).
	const hSpectral = String.raw`h(\lambda) = \sum_i \frac{\mu_i\, (Q^\top y)_i^2}{(\mu_i + n\lambda)^2}`;
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Espaces de Hilbert à noyau (RKHS) et méthodes à noyau'}
	subtitle="Mercer, théorème du représentant, régression à noyau ridge, noyaux universels et consistance"
	prev={prevMeta}
	next={nextMeta}
>
	<TableOfContents entries={tocEntries} />
	<TheorySection>
		<!-- ========================================================= -->
		<!-- 1. INTRODUCTION                                           -->
		<!-- ========================================================= -->
		<h2 id="introduction">De l’astuce du noyau à la théorie</h2>

		<p>
			La Partie II a enseigné deux façons de classifier. La première, <strong>locale</strong> : le
			k-NN (leçon 1) ne calcule aucun modèle global — il compare le point interrogé aux points
			proches. La deuxième, <strong>globale</strong> : la SVM à noyau (leçon 4), qui travaille dans un
			espace de features <KatexInline formula={String.raw`\mathcal{H}`} /> de dimension potentiellement
			infinie — mais sans jamais construire l'application
			<KatexInline formula={String.raw`\phi : X \to \mathcal{H}`} />
			, puisque tout se calcule à partir du noyau
			<KatexInline formula={String.raw`K(x, x') = \langle \phi(x), \phi(x') \rangle`} />
			(l'astuce du noyau, et la duale à noyau de la leçon 4).
		</p>

		<p>
			Mais la leçon 4 s'est arrêtée à une question : <strong>quel est exactement l'objet mathématique
			que l'astuce du noyau justifie ?</strong> Le théorème de Moore–Aronszajn enseigné dit qu'il
			<em>existe</em> un espace de Hilbert et un
			<KatexInline formula="\phi" /> — mais il n'en donne ni la structure interne, ni la norme, ni le
			rôle statistique. Cette leçon expert répond : il existe un espace <strong>unique</strong>,
			constructible explicitement, dont la norme mesure la <em>régularité</em> des fonctions — un
			<em>espace de Hilbert à noyau reproduisant</em> (RKHS). Et cette norme est la clé de la
			régularisation par noyau (la régression à noyau ridge, KRR), du théorème du représentant
			(pourquoi il suffit de calculer avec les
			<KatexInline formula="n" />
			points d'entraînement), et de la consistance des estimateurs à noyau.
		</p>

		<Callout type="note" title="Leçon expert — le socle fonctionnel des noyaux">
			<p>
				Cette leçon développe le cadre fonctionnel sous l'astuce du noyau déjà introduite à la
				leçon 4 (noyaux semi-définis positifs, feature maps, duale à noyau — rappelé au début de
				la section 2). Les objets développés ici — théorème de Mercer sous sa forme spectrale,
				RKHS, théorème du représentant, KRR, noyaux universels — complètent ce cadre : ils
				justifient pourquoi l'astuce du noyau est exacte, pourquoi le calcul est fini, et ce que
				la norme de l'espace de features fait (régulariser). Chaque résultat est attribué dans le
				texte et dans la bibliographie.
			</p>
		</Callout>

		<!-- ========================================================= -->
		<!-- 2. THÉORÈME DE MERCER                                     -->
		<!-- ========================================================= -->
		<h2 id="theoreme-mercer">Le théorème de Mercer</h2>

		<Callout type="summary" title="Ce que la leçon 4 a déjà enseigné (rappel)">
			<ul>
				<li>
					Un noyau est une fonction <KatexInline
						formula={String.raw`K : X \times X \to \mathbb{R}`}
					/>
					<strong>symétrique</strong> et <strong>semi-définie positive</strong> (toute combinaison
					<KatexInline formula={String.raw`c^\top K c \ge 0`} />).
				</li>
				<li>
					Théorème de Moore–Aronszajn (version cours) : <KatexInline
						formula={String.raw`K`}
					/>
					symétrique et semi-définie positive
					<KatexInline formula="\Longrightarrow" />
					il existe un espace de Hilbert <KatexInline formula={String.raw`\mathcal{H}`} /> et
					<KatexInline formula={String.raw`\phi : X \to \mathcal{H}`} /> tels que
					<KatexInline formula={String.raw`K(x, x') = \langle \phi(x), \phi(x') \rangle_{\mathcal{H}}`} />.
				</li>
				<li>
					L'astuce du noyau : tout calcul ne dépendant de
					<KatexInline formula="\phi" />
					que par des produits scalaires se calcule avec la matrice de Gram
					<KatexInline formula={String.raw`K_{ij} = K(x_i, x_j)`} /> — c'est ce qui rend la duale à
					noyau de la leçon 4 possible.
				</li>
				<li>
					Exemples enseignés : noyaux linéaire, cosinus, quadratique, polynomial, gaussien
					<KatexInline
						formula={String.raw`\exp\big( -\lVert x - x' \rVert^2 / (2\sigma^2) \big)`}
					/>.
				</li>
			</ul>
			<p>
				(Leçon 4 de la Partie II, sections interactives « Noyaux valides : symétrique et
				semi-défini positif » et « L'espace de redescription : φ et séparabilité » — rien
				n'est réenseigné ici.)
			</p>
		</Callout>

		<TheoremBlock number="E.1" title="Théorème de Mercer (1909)">
			<p>
				Soit <KatexInline formula={String.raw`K : [a,b] \times [a,b] \to \mathbb{R}`} /> continue,
				symétrique et de <em>type positif</em>, c'est-à-dire
			</p>
			<KatexBlock formula={mercerPos} />
			<p>
				pour toute <KatexInline formula={String.raw`f \in L^2([a,b])`} />. Alors il existe une base
				orthornormée <KatexInline formula={String.raw`(\phi_i)`} /> de
				<KatexInline formula={String.raw`L^2([a,b])`} /> formée de <strong>fonctions propres</strong>
				de l'opérateur intégral
			</p>
			<KatexBlock formula={mercerOp} />
			<p>et des <strong>valeurs propres</strong> <KatexInline formula={String.raw`\lambda_i \ge 0`} /> telles que</p>
			<KatexBlock formula={mercer} />
			<p>la convergence étant <strong>absolue et uniforme</strong> sur <KatexInline
				formula={String.raw`[a,b] \times [a,b]`}
			/>.</p>
			<p>
				<strong>Pourquoi un noyau est de type positif</strong> : si
				<KatexInline formula={String.raw`K(x,y) = \langle \phi(x), \phi(y) \rangle`} /> pour un
				<KatexInline formula="\phi" /> à valeurs dans un espace de Hilbert, alors
				<KatexInline
					formula={String.raw`\int_a^b \int_a^b K(x,y)\, f(x) f(y)\, dx\, dy = \Big\lVert \int_a^b \phi(x)\, f(x)\, dx \Big\rVert^2 \ge 0`}
				/>
				— le type positif est la signature intégrale de l'existence d'un feature map.
			</p>
			<p>D'après Mercer (1909), <em>Phil. Trans. R. Soc. Lond. A</em> 209 : 415–446.</p>
		</TheoremBlock>

		<Callout type="insight" title="Mercer vs Moore–Aronszajn : deux théorèmes, deux régimes">
			<ul>
				<li>
					<strong>Moore–Aronszajn</strong> (version cours) :
					<KatexInline formula="X" /> <strong>arbitraire</strong>,
					<KatexInline formula="K" /> seulement symétrique et semi-définie positive
					<KatexInline formula="\Longrightarrow" /> existence de <em>quelque</em> espace de Hilbert
					et de <KatexInline formula="\phi" />. Résultat de <strong>structure</strong> (on ne dit
					rien de la dimension, ni d'une base).
				</li>
				<li>
					<strong>Mercer (1909)</strong> : <KatexInline formula="K" /> <strong>continue</strong> sur
					un <strong>compact</strong> <KatexInline formula={String.raw`[a,b]`} />
					<KatexInline formula="\Longrightarrow" />
					<strong>décomposition spectrale</strong> explicite (opérateur intégral compact
					auto-adjoint, valeurs propres <KatexInline formula={String.raw`\lambda_i \ge 0`} />,
					convergence absolue et uniforme). Résultat <strong>analytique</strong>.
				</li>
			</ul>
			<p>
				Le théorème de Mercer est l'ancêtre historique (1909) ; la version générale de
				Moore–Aronszajn a été mise en forme par Aronszajn (1950). La leçon utilise les deux :
				Mercer pour <em>voir</em> le feature map, Moore–Aronszajn pour
				<em>construire</em> l'espace.
			</p>
		</Callout>

		<ExampleBlock number="E.1" title="Lecture de la décomposition : un feature map visible">
			<p>La décomposition de Mercer donne directement</p>
			<KatexBlock formula={featureMap} />
			<p>
				car <KatexInline
					formula={String.raw`\lVert \phi(x) \rVert_{\ell^2}^2 = \sum_i \lambda_i \phi_i(x)^2 = K(x,x) < \infty`}
				/>
				, et <KatexInline formula={String.raw`K(x,y) = \langle \phi(x), \phi(y) \rangle_{\ell^2}`} />.
				Le feature map n'est plus un objet abstrait : c'est une <strong>suite</strong> de
				fonctions, indexée par le spectre de
				<KatexInline formula={String.raw`T_K`} />. Les valeurs propres
				<KatexInline formula={String.raw`\lambda_i`} />
				mesurent l'<strong>importance</strong> de la direction
				<KatexInline formula={String.raw`\phi_i`} /> — et, on le verra à la section 3, l'inverse
				<KatexInline formula={String.raw`\lambda_i^{-1}`} />
				est le prix, dans la norme du RKHS, d'activer cette direction.
			</p>
			<p>
				<em>
					Illustration : pour le noyau gaussien sur
					<KatexInline formula={String.raw`\mathbb{R}^d`} />
					, les fonctions propres de
					<KatexInline formula={String.raw`T_K`} />
					sont des fonctions hermite-gaussiennes ; la décomposition complète renvoie à la
					littérature.
				</em>
			</p>
		</ExampleBlock>

		<!-- ========================================================= -->
		<!-- 3. RKHS                                                   -->
		<!-- ========================================================= -->
		<h2 id="rkhs">Les espaces de Hilbert à noyau</h2>

		<DefinitionBlock number="E.2" title="Espace de Hilbert à noyau reproduisant (RKHS)">
			<p>
				Un <strong>espace de Hilbert à noyau reproduisant</strong> (RKHS) est un espace de Hilbert
				<KatexInline formula={String.raw`\mathcal{H}`} /> de fonctions réelles sur un ensemble
				<KatexInline formula="X" /> tel que, pour tout
				<KatexInline formula={String.raw`x \in X`} />
				, l'application d'évaluation
			</p>
			<KatexBlock formula={evalMap} />
			<p>soit <strong>continue</strong> (bornée) de <KatexInline
				formula={String.raw`\mathcal{H}`}
			/>
			dans <KatexInline formula={String.raw`\mathbb{R}`} />.</p>
			<p>
				<strong>Équivalence (théorème de Riesz)</strong> :
				<KatexInline formula={String.raw`\mathcal{H}`} />
				est un RKHS <strong>si et seulement si</strong>, pour tout
				<KatexInline formula={String.raw`x \in X`} />, il existe un unique
				<KatexInline formula={String.raw`K_x \in \mathcal{H}`} /> tel que
			</p>
			<KatexBlock formula={riesz} />
			<p>
				Le vecteur <KatexInline formula={String.raw`K_x`} /> est la
				<strong>fonction noyau en</strong> <KatexInline formula="x" /> ; la fonction
			</p>
			<KatexBlock formula={rkhsKernel} />
			<p>
				est le <strong>noyau reproduisant</strong> de
				<KatexInline formula={String.raw`\mathcal{H}`} /> : symétrique, semi-définie positive, et
				<KatexInline formula={String.raw`K(\cdot, x) = K_x \in \mathcal{H}`} />.
			</p>
			<p>
				D'après Aronszajn (1950), <em>Trans. Amer. Math. Soc.</em> 68(3) : 337–404 — définition et
				équivalence Riesz.
			</p>
		</DefinitionBlock>

		<TheoremBlock number="E.3" title="Théorème de Moore–Aronszajn (forme complète)">
			<p>
				Soit <KatexInline formula={String.raw`K : X \times X \to \mathbb{R}`} /> un noyau symétrique
				et semi-défini positif. Alors il existe un <strong>unique</strong> espace de Hilbert de
				fonctions réelles sur <KatexInline formula="X" />, noté
				<KatexInline formula={String.raw`\mathcal{H}_K`} />, pour lequel
				<KatexInline formula="K" /> est le noyau reproduisant.
			</p>
			<p><strong>Construction (esquisse de preuve, d'après Aronszajn 1950)</strong> :</p>
			<ol>
				<li>
					<strong>Espace dense</strong> :
					<KatexBlock formula={hs0} />
					muni du « produit scalaire »
					<KatexBlock formula={hs0Inner} />
					la semi-définie positivité garantit que c'est bien un produit scalaire sur
					<KatexInline formula={String.raw`\mathcal{H}_0`} />.
				</li>
				<li>
					<strong>Complétion</strong> :
					<KatexInline formula={String.raw`\mathcal{H}_K`} />
					= complétion de <KatexInline formula={String.raw`\mathcal{H}_0`} />. Pour
					<KatexInline formula={String.raw`f = \sum_i a_i K_{x_i}`} /> (série convergente en
					norme), la propriété reproduisante tombe par continuité du produit scalaire :
					<KatexBlock formula={String.raw`\langle f, K_x \rangle = \sum_i a_i\, K(x_i, x) = f(x)`} />
				</li>
				<li>
					<strong>Unicité</strong> : si
					<KatexInline formula={String.raw`\mathcal{G}`} />
					est un autre espace de fonctions sur
					<KatexInline formula="X" /> dont
					<KatexInline formula="K" /> est le noyau reproduisant, alors
					<KatexInline formula={String.raw`\mathcal{H}_K \subseteq \mathcal{G}`} />
					(complétude) et
					<KatexInline formula={String.raw`\mathcal{H}_K`} />
					y est <strong>fermé</strong> ; toute
					<KatexInline formula={String.raw`g \in \mathcal{G}`} />
					se décompose en
					<KatexInline formula={String.raw`g = g_{\mathcal{H}} + g_{\perp}`} /> avec
					<KatexInline formula={String.raw`g_{\perp}`} /> orthogonal à
					<KatexInline formula={String.raw`\{ K_x \}`} />, donc
					<KatexInline
						formula={String.raw`g_{\perp}(x) = \langle g_{\perp}, K_x \rangle = 0`}
					/>
					partout — <KatexInline formula={String.raw`g = g_{\mathcal{H}} \in \mathcal{H}_K`} />.
				</li>
			</ol>
			<p>
				<strong>C'est le théorème de la leçon 4, en version complète</strong> : la version cours
				n'énonçait que la direction «
				<KatexInline formula="K" /> semi-définie positive
				<KatexInline formula="\Rightarrow" /> espace de features » ; la version complète ajoute
				(i) la <strong>nature fonctionnelle</strong> de l'espace (ses éléments sont des fonctions,
				pas des features abstraites), (ii) la <strong>reproductibilité</strong>
				<KatexInline formula={reproProp} />
				, (iii) l'<strong>unicité</strong>.
			</p>
		</TheoremBlock>

		<ExampleBlock number="E.2" title="Ce que mesure ‖f‖²_HK : l'énergie spectrale">
			<p>
				Croiser les sections 2 et 3 : si
				<KatexInline formula="K" />
				est continue et semi-définie positive sur
				<KatexInline formula={String.raw`[a,b]`} /> avec décomposition de Mercer
				<KatexInline formula={String.raw`K(x,y) = \sum_i \lambda_i \phi_i(x)\phi_i(y)`} />, alors
				<KatexInline formula={String.raw`\mathcal{H}_K`} />
				est constitué des fonctions
			</p>
			<KatexBlock formula={spectralSpace} />
			<p>avec <strong>norme</strong></p>
			<KatexBlock formula={spectralNorm} />
			<p>
				Lecture : activer une direction spectrale
				<KatexInline formula={String.raw`\phi_i`} />
				coute un facteur
				<KatexInline formula={String.raw`\lambda_i^{-1}`} /> — les directions à
				<strong>petite valeur propre</strong> (haute fréquence, pour les noyaux lissants) sont
				<strong>chères</strong> dans la norme. Une fonction de norme
				<KatexInline formula={String.raw`\mathcal{H}_K`} />
				petite est donc une fonction <strong>lisse / plate</strong> : régulariser par
				<KatexInline formula={String.raw`\lVert f \rVert^2_{\mathcal{H}_K}`} /> (section 5) punit
				précisément les oscillations. C'est le sens mathématique du « lissage » des noyaux
				gaussiens.
			</p>
			<p>
				(Conséquence directe de Mercer + de la construction de la section 3 — calcul immédiat,
				pas un théorème numéroté.)
			</p>
		</ExampleBlock>

		<!-- ========================================================= -->
		<!-- 4. THÉORÈME DU REPRÉSENTANT                                -->
		<!-- ========================================================= -->
		<h2 id="theoreme-representant">Le théorème du représentant</h2>

		<TheoremBlock number="E.4" title="Théorème du représentant">
			<p>
				Soit <KatexInline formula={String.raw`K : \mathcal{X} \times \mathcal{X} \to \mathbb{R}`} />
				un noyau semi-défini positif,
				<KatexInline formula={String.raw`\mathcal{H}_K`} />
				son RKHS, un échantillon
				<KatexInline formula={String.raw`(x_1, y_1), \dots, (x_n, y_n) \in \mathcal{X} \times \mathbb{R}`} />,
				une fonction d'erreur <strong>arbitraire</strong>
				<KatexInline
					formula={String.raw`E : (\mathcal{X} \times \mathbb{R}^2)^n \to \mathbb{R} \cup \{+\infty\}`}
				/>
				et une fonction
				<KatexInline formula={String.raw`g : [0, +\infty[ \to \mathbb{R}`} />
				<strong>strictement croissante</strong>. Tout minimiseur de
			</p>
			<KatexBlock formula={representerObj} />
			<p>admet une représentation</p>
			<KatexBlock formula={representer} />
			<p>avec <KatexInline formula={String.raw`\alpha_i \in \mathbb{R}`} />.</p>
			<p>
				<strong>Esquisse de preuve (d'après Schölkopf, Herbrich &amp; Smola 2001)</strong> :
			</p>
			<ol>
				<li>
					Par décomposition en deux parties orthogonales dans
					<KatexInline formula={String.raw`\mathcal{H}_K`} />, tout
					<KatexInline formula={String.raw`f \in \mathcal{H}_K`} /> s'écrit
					<KatexInline
						formula={String.raw`f = \sum_i \alpha_i K(\cdot, x_i) + v`}
					/>
					avec
					<KatexInline
						formula={String.raw`\langle v, K(\cdot, x_i) \rangle_{\mathcal{H}_K} = 0`}
					/>
					pour tout <KatexInline formula="i" />.
				</li>
				<li>
					La <strong>propriété reproduisante</strong> donne
					<KatexInline formula={String.raw`f(x_j) = \sum_i \alpha_i K(x_i, x_j)`} /> : la valeur de
					<KatexInline formula="f" /> aux points d'entraînement <strong>ne dépend pas de</strong>
					<KatexInline formula="v" /> — donc
					<KatexInline formula="E" /> est <strong>indifférente</strong> à
					<KatexInline formula="v" />.
				</li>
				<li>
					Par contre
					<KatexInline
						formula={String.raw`\lVert f \rVert_{\mathcal{H}_K} = \sqrt{ \lVert \sum_i \alpha_i K(\cdot, x_i) \rVert^2 + \lVert v \rVert^2 } \ge \lVert \sum_i \alpha_i K(\cdot, x_i) \rVert`}
					/>
					avec <strong>striction</strong> si <KatexInline formula={String.raw`v \ne 0`} /> — et
					<KatexInline formula="g" /> étant strictement croissante, tout minimiseur a
					<KatexInline formula={String.raw`v = 0`} />.
				</li>
			</ol>
			<p>
				<strong>Conséquence (le message de la leçon)</strong> : un problème dans un espace de
				dimension <strong>infinie</strong> se réduit à un problème en
				<KatexInline formula="n" /> inconnues
				<KatexInline formula={String.raw`\alpha \in \mathbb{R}^n`} />, dont la seule donnée
				nécessaire est la matrice de Gram
				<KatexInline formula={String.raw`K_{ij} = K(x_i, x_j)`} /> — l'objet déjà vu à la leçon
				4. La SVM à noyau de la leçon 4 est un cas particulier
				(<KatexInline formula="E" /> = perte hinge + contrainte,
				<KatexInline formula={String.raw`g(t) = \tfrac{1}{2} t^2`} />).
			</p>
		</TheoremBlock>

		<Callout type="note" title="Génèse : Kimeldorf & Wahba (1970)">
			<p>
				Le premier énoncé du théorème du représentant est dû à <strong>Kimeldorf &amp; Wahba
				(1970)</strong>, pour le cas particulier
				<KatexInline
					formula={String.raw`E = \frac{1}{n} \sum_i (f(x_i) - y_i)^2`}
				/>
				et
				<KatexInline formula={String.raw`g(t) = \lambda t^2`} />
				(c'est exactement la KRR de la section 5) ; la forme générale (arbitraire
				<KatexInline formula="E" />, <KatexInline formula="g" /> strictement croissante) est due à
				<strong>Schölkopf, Herbrich &amp; Smola (2001)</strong>.
			</p>
		</Callout>

		<!-- ========================================================= -->
		<!-- 5. KRR                                                    -->
		<!-- ========================================================= -->
		<h2 id="krr">La régression à noyau ridge</h2>

		<DefinitionBlock number="E.5" title="Régression à noyau ridge (Kernel Ridge Regression)">
			<p>
				Soit <KatexInline formula={String.raw`(x_i, y_i)_{i=1}^n`} />,
				<KatexInline formula="K" /> un noyau semi-défini positif,
				<KatexInline formula={String.raw`\mathcal{H}_K`} /> son RKHS, et
				<KatexInline formula={String.raw`\lambda > 0`} />. La
				<strong>régularisation à noyau ridge</strong> est
			</p>
			<KatexBlock formula={krrObj} />
			<p>
				Lecture : on cherche la fonction du RKHS qui <strong>ajuste les données</strong> (perte
				quadratique empirique) tout en étant la <strong>plus lisse possible</strong> (norme
				<KatexInline formula={String.raw`\mathcal{H}_K`} />), le paramètre
				<KatexInline formula="\lambda" /> fixant le compromis. C'est la régression ridge de la
				Partie V (leçon 4), transportée dans un espace de dimension infinie — et c'est le
				problème résolu par le théorème du représentant (section 4) avec
				<KatexInline formula={String.raw`g(t) = \lambda t^2`} />.
			</p>
		</DefinitionBlock>

		<TheoremBlock number="E.6" title="Forme close de la KRR">
			<p>
				Sous les hypothèses de la définition E.5, la solution canonique vaut
				<KatexBlock formula={krrAlpha} />
				où <KatexInline formula={String.raw`K_{ij} = K(x_i, x_j)`} /> est la matrice de Gram et
				<KatexInline formula={String.raw`y = (y_1, \dots, y_n)^\top`} />. Si
				<KatexInline formula="K" /> est inversible,
				<KatexInline formula={String.raw`\alpha^\star`} /> est le <strong>unique</strong> minimiseur ;
				sinon la formule donne le minimiseur canonique (les prédictions
				<KatexInline formula={String.raw`K\alpha^\star`} /> et la norme ci-dessous restent uniques).
				En particulier :
			</p>
			<KatexBlock formula={krrNorm} />
			<p><strong>Preuve (deux étapes)</strong> :</p>
			<ol>
				<li>
					<strong>Représentant</strong> (section 4) :
					<KatexInline formula={String.raw`f = \sum_i \alpha_i K(\cdot, x_i)`} />, et la propriété
					reproduisante donne
					<KatexInline
						formula={String.raw`\lVert f \rVert^2_{\mathcal{H}_K} = \sum_{i,j} \alpha_i \alpha_j K(x_i, x_j) = \alpha^\top K \alpha`}
					/>.
					L'objectif devient la fonction quadratique convexe de
					<KatexInline formula="\alpha" /> :
					<KatexBlock formula={krrPhi} />
				</li>
				<li>
					<strong>Conditions d'optimalité</strong> :
					<KatexBlock formula={krrGrad} />
					c'est-à-dire
					<KatexInline
						formula={String.raw`K\big( K + n\lambda I \big)\alpha = K y`}
					/>.
					La matrice <KatexInline formula={String.raw`K + n\lambda I`} /> est
					<strong>toujours inversible</strong> (semi-définie positive +
					<KatexInline formula={String.raw`n\lambda I`} /> définie positive,
					<KatexInline formula={String.raw`\lambda > 0`} />), et
					<KatexInline
						formula={String.raw`\alpha^\star = (K + n\lambda I)^{-1} y`}
					/>
					est l'unique solution de
					<KatexInline formula={String.raw`(K + n\lambda I)\,\alpha = y`} /> ;
					<KatexInline formula={String.raw`\Phi`} /> étant convexe, c'est un minimiseur global —
					le minimiseur <strong>unique</strong> si <KatexInline formula="K" /> est inversible.
					<em>Remarque</em> : la formule reste exacte même si
					<KatexInline formula="K" /> est singulière (points en double) — on n'inverse jamais
					<KatexInline formula="K" /> seul, toujours
					<KatexInline formula={String.raw`K + n\lambda I`} /> (les prédictions
					<KatexInline formula={String.raw`K\alpha^\star`} /> et la norme
					<KatexInline formula={String.raw`\mathcal{H}_K`} /> restent uniques dans tous les
					cas).
				</li>
			</ol>
		</TheoremBlock>

		<Callout type="insight" title="Le pont ridge : la KRR linéaire EST le ridge du cours">
			<p>
				Avec le <strong>noyau linéaire</strong>
				<KatexInline formula={String.raw`K(x, x') = x^\top x'`} /> et la matrice de conception
				<KatexInline formula="X" /> (lignes
				<KatexInline formula={String.raw`x_i^\top`} />), on a
				<KatexInline formula={String.raw`K = X X^\top`} /> et le vecteur des prédictions vaut
			</p>
			<KatexBlock formula={ridgeBridge} />
			<p>
				exactement la solution <strong>ridge</strong> (moindres carrés régularisés) de paramètre
				<KatexInline formula={String.raw`n\lambda`} /> enseignée en Partie V, leçon 4. La KRR est
				donc le <strong>même estimateur</strong> que le ridge, vu du côté du noyau : quand la
				dimension est inférieure à
				<KatexInline formula="n" />, on calcule plutôt par
				<KatexInline formula={String.raw`\beta = (X^\top X + n\lambda I)^{-1} X^\top y`} />
				(coût <KatexInline formula={String.raw`O(n d^2 + d^3)`} />) ; quand le noyau est non
				linéaire ou la dimension infinie, on calcule par
				<KatexInline formula={String.raw`\alpha = (K + n\lambda I)^{-1} y`} />
				(coût <KatexInline formula={String.raw`O(n^3)`} />, indépendant de la « dimension »).
				C'est exactement le compromis dual/primal de la SVM, déjà vu à la leçon 4.
			</p>
		</Callout>

		<Callout type="intuition" title="Les deux limites de λ">
			<ul>
				<li>
					<strong><KatexInline formula={String.raw`\lambda \to 0^+`} /></strong> (si
					<KatexInline formula="K" /> inversible) :
					<KatexInline formula={String.raw`\alpha^\star \to K^{-1} y`} />, donc
					<KatexInline
						formula={String.raw`f^\star_\lambda(x_i) = (K\alpha^\star)_i \to y_i`}
					/>
					— la solution <strong>interpole</strong> les données (perte empirique nulle), au prix
					d'une norme <KatexInline formula={String.raw`\mathcal{H}_K`} /> qui peut diverger
					(la fonction devient très oscillante pour ajuster le bruit).
				</li>
				<li>
					<strong><KatexInline formula={String.raw`\lambda \to +\infty`} /></strong> :
					<KatexInline
						formula={String.raw`\alpha^\star = (K + n\lambda I)^{-1} y \sim \frac{1}{n\lambda}\, y \to 0`}
					/>
					, donc
					<KatexInline formula={String.raw`f^\star_\lambda \to 0`} />
					— la régularisation écrase l'ajustement.
				</li>
			</ul>
			<p>
				Entre les deux, <KatexInline formula="\lambda" /> arbitre biais/variance — la même
				dial que partout dans le cours, maintenant <strong>dans un espace de Hilbert</strong>.
			</p>
		</Callout>

		<InteractiveSection
			number="E.7"
			title="Explorer la KRR : régularisation, interpolation, pont ridge"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/KernelRidgeExplorer.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- 6. NOYAUX UNIVERSELS ET CONSISTANCE                       -->
		<!-- ========================================================= -->
		<h2 id="noyaux-universels">Noyaux universels et consistance</h2>

		<DefinitionBlock number="E.8" title="Noyau universel">
			<p>
				Soit <KatexInline formula="X" /> un espace métrique compact et
				<KatexInline formula="K" /> un noyau continu sur
				<KatexInline formula={String.raw`X \times X`} />.
				<KatexInline formula="K" /> est dit <strong>universel</strong> si son RKHS
				<KatexInline formula={String.raw`\mathcal{H}_K`} /> est <strong>dense dans
				<KatexInline formula={String.raw`C(X)`} /></strong> pour la norme uniforme — c'est-à-dire
				que, pour toute fonction continue
				<KatexInline formula={String.raw`h : X \to \mathbb{R}`} /> et tout
				<KatexInline formula={String.raw`\varepsilon > 0`} />, il existe
				<KatexInline formula={String.raw`f \in \mathcal{H}_K`} /> avec
				<KatexInline formula={String.raw`\lVert f - h \rVert_\infty < \varepsilon`} />.
			</p>
			<p>
				Équivalent : les noyaux universels peuvent <strong>approcher uniformément</strong> toute
				fonction continue sur tout compact.
			</p>
			<p>
				D'après Micchelli, Xu &amp; Zhang (2006), <em>J. Mach. Learn. Res.</em> 7 : 2651–2667.
			</p>
		</DefinitionBlock>

		<TheoremBlock number="E.9" title="Le noyau gaussien est universel">
			<p>Le noyau gaussien</p>
			<KatexBlock formula={gaussianKernel} />
			<p>est <strong>universel</strong> sur tout compact de <KatexInline
				formula={String.raw`\mathbb{R}^d`}
			/>
			(en particulier sur <KatexInline formula={String.raw`[0,1]^d`} />).</p>
			<p>
				<strong>Chaîne d'arguments (d'après Micchelli, Xu &amp; Zhang 2006)</strong> : pour un
				noyau <strong>invariant par translation</strong>
				<KatexInline formula={String.raw`K(x, x') = k(x - x')`} /> sur
				<KatexInline formula={String.raw`\mathbb{R}^d`} />
				,
			</p>
			<ol>
				<li>
					(Théorème de Bochner, classique)
					<KatexInline formula="K" /> est semi-définie positive
					<strong>si et seulement si</strong>
					<KatexInline formula="k" /> est la transformée de Fourier d'une mesure de
					probabilité <KatexInline formula="\mu" /> sur
					<KatexInline formula={String.raw`\mathbb{R}^d`} /> (mesure spectrale).
				</li>
				<li>
					(Micchelli–Xu–Zhang 2006)
					<KatexInline formula="K" /> est universel <strong>si et seulement si</strong> la mesure
					spectrale <KatexInline formula="\mu" /> est
					<strong>strictement positive</strong> (support plein).
				</li>
				<li>
					Pour
					<KatexInline formula={String.raw`k(t) = e^{-\gamma \lVert t \rVert^2}`} />, la
					transformée de Fourier est la <strong>densité gaussienne</strong>
					<KatexBlock formula={fourierGauss} />
					strictement positive <strong>partout</strong> — donc
					<KatexInline formula="K" /> est universel.
				</li>
			</ol>
			<p>
				L'intuition : le spectre du noyau gaussien n'a <strong>aucun trou</strong> (aucune
				fréquence nulle), donc son RKHS contient des fonctions de toutes les fréquences — assez de
				« matière » pour approcher toute fonction continue. Le noyau
				<strong>linéaire</strong>, en revanche, n'est pas universel dès que la dimension de
				l'espace de features est finie : son RKHS est l'espace des fonctions affines, loin
				d'être dense dans
				<KatexInline formula={String.raw`C(X)`} />.
			</p>
		</TheoremBlock>

		<TheoremBlock number="E.10" title="Consistance de la KRR avec noyau universel">
			<p>
				Soit <KatexInline formula={String.raw`(X, \mu)`} /> un espace métrique compact muni d'une
				mesure de probabilité <KatexInline formula="\mu" />,
				<KatexInline formula="K" /> un noyau <strong>universel</strong> continu, et
				<KatexInline formula={String.raw`f^\star_\mu`} /> la projection de carré intégrable de la
				cible dans <KatexInline formula={String.raw`L^2(\mu)`} /> (la fonction de régression). Soit
				<KatexInline formula={String.raw`f^\star_{n,\lambda_n}`} /> l'estimateur KRR
				(définition E.5) calculé sur
				<KatexInline formula="n" /> observations i.i.d. de loi
				<KatexInline formula="\mu" />, de paramètre
				<KatexInline formula={String.raw`\lambda_n > 0`} />. Alors
			</p>
			<KatexBlock formula={consistency} />
			<p>
				<strong>Statut de la preuve</strong> : résultat classique de la littérature des
				estimateurs à noyau — première preuve dans le cadre des RKHS denses : Kimeldorf &amp;
				Wahba (1970) ; expositions modernes : Schölkopf &amp; Smola (2002),
				<em>Learning with Kernels</em>, ch. 4, et Wahba (1990), <em>Spline Models for
				Observational Data</em>, SIAM. La preuve utilise la compacité, la densité de
				<KatexInline formula={String.raw`\mathcal{H}_K`} /> dans
				<KatexInline formula={String.raw`C(X)`} /> et des inégalités de concentration — elle est
				réservée aux ouvrages.
			</p>
			<p><strong>Lecture des deux conditions</strong> (intuition) :</p>
			<ul>
				<li>
					<KatexInline formula={String.raw`\lambda_n \to 0`} /> : la régularisation doit
					<strong>disparaître</strong> (sinon
					<KatexInline
						formula={String.raw`f^\star_{n,\lambda_n} \to 0`}
					/>
					plutôt que vers
					<KatexInline formula={String.raw`f^\star_\mu`} />) — condition de
					<strong>bias</strong> ;
				</li>
				<li>
					<KatexInline formula={String.raw`n\, \lambda_n \to +\infty`} /> : la régularisation
					doit rester <strong>suffisante pour contrôler le bruit</strong> quand
					<KatexInline formula="n" /> croît — condition de <strong>variance</strong>. Les deux à
					la fois : le compromis biais/variance se résout par un
					<KatexInline formula={String.raw`\lambda_n`} /> qui tend vers 0 « assez lentement »
					(par exemple <KatexInline formula={String.raw`\lambda_n = n^{-1/3}`} />).
				</li>
			</ul>
		</TheoremBlock>

		<Callout type="intuition" title="Même dialectique que la consistance du k-NN (Partie VIII, leçon 2)">
			<p>
				La consistance du k-NN (Partie VIII, leçon 2) est la version <strong>locale</strong> de la
				même idée : on y laisse la « flexibilité »
				(<KatexInline formula={String.raw`k \to \infty`} />) et le « contrôle de variance »
				(<KatexInline formula={String.raw`k/n \to 0`} />) s'arbitrer. Ici, la flexibilité est
				portée par la <strong>densité du noyau universel</strong> dans
				<KatexInline formula={String.raw`C(X)`} /> (section E.8), et le contrôle de variance par
				<KatexInline formula={String.raw`\lambda_n`} />. Deux lectures du même phénomène :
				<strong>sans flexibilité suffisante, biais ; sans contrôle, variance</strong>.
			</p>
			<p><em>Lecture pédagogique du parallèle — pas un théorème.</em></p>
		</Callout>

		<!-- ========================================================= -->
		<!-- 7. PONTS                                                  -->
		<!-- ========================================================= -->
		<h2 id="ponts">Les ponts : SVM, k-NN, NTK</h2>

		<Callout type="insight" title="La SVM à noyau est un ERM dans un RKHS">
			<p>
				La duale à noyau enseignée à la leçon 4 s'écrit
				<KatexBlock formula={svmDual} />
				sous contraintes
				<KatexInline formula={String.raw`\sum_i \alpha_i y_i = 0`} /> et
				<KatexInline formula={String.raw`0 \le \alpha_i \le C`} />. C'est un
				<strong>ERM dans le RKHS</strong> : on optimise les valeurs, aux points
				d'entraînement, de
				<KatexInline
					formula={String.raw`f = \sum_i \alpha_i y_i K(\cdot, x_i) \in \mathcal{H}_K`}
				/>
				(perte hinge = la fonction
				<KatexInline formula="E" /> du théorème du représentant), et la régularisation
				<KatexInline
					formula={String.raw`\frac{1}{2}\lVert f \rVert^2_{\mathcal{H}_K} = \frac{1}{2} \sum_{i,\ell} \alpha_i \alpha_\ell\, y_i y_\ell\, K(x_i, x_\ell)`}
				/>
				est <strong>précisément</strong> le terme quadratique de la duale. Le théorème du
				représentant (E.4) justifie rétrospectivement ce que la leçon 4 obtenait par dualité :
				la solution <strong>vit dans</strong>
				<KatexInline formula={String.raw`\operatorname{span}\{ K(\cdot, x_i) \}`} />, et seul le
				Gram importe.
			</p>
			<p>
				Cross-reference : la borne de généralisation de la SVM (Théorème 3.4, Partie IX, leçon
				3, d'après Vapnik 1995) ne dépend que de la <strong>marge</strong>, pas de la
				dimension — ce qui cohabite avec les espaces de features infiniment dimensionnels de
				cette leçon.
			</p>
		</Callout>

		<Callout type="note" title="k-NN : lecture en noyau local">
			<p>
				Le régresseur k-NN de la leçon 1 peut se <strong>lire</strong> comme une régression à
				noyau avec un <strong>noyau uniforme local</strong> (noyau « boîte ») :
				<KatexBlock formula={boxKernel} />
				où <KatexInline formula={String.raw`r_k(x)`} /> est la distance au
				<KatexInline formula="k" />-ième voisin de
				<KatexInline formula="x" /> : c'est la moyenne pondérée des
				<KatexInline formula={String.raw`y_i`} /> avec des poids qui ne dépendent que de la
				proximité. La version pondérée par une fenêtre lisse — l'estimateur de Nadaraya–Watson,
				<KatexInline
					formula={String.raw`\hat f(x) = \frac{\sum_i K_\sigma(x_i, x)\, y_i}{\sum_i K_\sigma(x_i, x)}`}
				/>
				— généralise cette lecture : la moyenne locale devient une moyenne à noyau.
			</p>
			<p>
				<strong>Attention</strong> : ce pont est une <strong>lecture pédagogique</strong>, pas un
				théorème — et le noyau « boîte » n'est pas continu, donc il est <em>hors du cadre</em>
				de Mercer / des noyaux universels (sections 2 et 6). Ne pas écrire que le k-NN est
				« une KRR » : ce n'est pas une minimisation dans un RKHS.
			</p>
		</Callout>

		<Callout type="note" title="NTK : le noyau tangent (pont vers la Partie IX)">
			<p>
				Pour un réseau de neurones
				<KatexInline formula={String.raw`f_\theta : \mathcal{X} \to \mathbb{R}`} /> de paramètres
				<KatexInline formula="\theta" />, on peut définir le
				<strong>noyau tangent neuronal</strong>
				<KatexBlock formula={ntkDef} />
				évalué à l'initialisation — le produit scalaire des <strong>gradients de la
				sortie</strong> par rapport aux paramètres (Jacot, Gabriel &amp; Hongler 2018). Dans la
				limite de largeur infinie, ce noyau <strong>reste constant pendant l'entraînement</strong>
				et la dynamique de la descente de gradient est celle d'un modèle linéaire dans le RKHS
				associé — ce qui relie la généralisation des réseaux profonds à la théorie de cette
				leçon.
			</p>
			<p>
				Hors périmètre : la théorie NTK complète (convergence, généralisation) est réservée à
				une leçon expert de la Partie IX ; ici, une définition et un fil de lecture suffisent.
			</p>
		</Callout>

		<Callout type="note" title="Scalabilité : random features">
			<p>
				La KRR et la SVM coûtent
				<KatexInline formula={String.raw`O(n^3)`} /> /
				<KatexInline formula={String.raw`O(n^2)`} />
				en mémoire/temps à cause du Gram. Pour les noyaux invariants par translation (le
				gaussien en tête), <strong>Rahimi &amp; Recht (2007)</strong> approchent
				<KatexInline formula="K" /> par un <strong>feature map aléatoire fini</strong> :
				<KatexInline
					formula={String.raw`\hat\phi : X \to \mathbb{R}^m`}
				/>
				tiré d'un nombre
				<KatexInline formula={String.raw`m \ll n`} />
				de dimensions aléatoires, tel que
				<KatexInline
					formula={String.raw`K(x, x') \approx \hat\phi(x)^\top \hat\phi(x')`}
				/>
				en moyenne — ce qui ramène la KRR au ridge ordinaire de dimension
				<KatexInline formula="m" />.
			</p>
		</Callout>

		<!-- ========================================================= -->
		<!-- 8. SYNTHESE                                              -->
		<!-- ========================================================= -->
		<h2 id="synthese">Synthèse</h2>

		<Callout type="summary" title="La boîte à outils RKHS">
			<ol>
				<li>
					<strong>Mercer (E.1)</strong> : noyau continu semi-défini positif sur un compact
					<KatexInline formula="\Rightarrow" /> décomposition spectrale
					<KatexInline formula={String.raw`K = \sum_i \lambda_i \phi_i \phi_i`} /> — le
					feature map est <em>visible</em>.
				</li>
				<li>
					<strong>Moore–Aronszajn complet (E.3)</strong> :
					<KatexInline formula="K" /> symétrique et semi-définie positive
					<KatexInline formula="\iff" /> <strong>unique</strong> RKHS
					<KatexInline formula={String.raw`\mathcal{H}_K`} /> ; construction par complétion de
					<KatexInline formula={String.raw`\operatorname{span}\{ K(\cdot, x) \}`} /> ;
					<KatexInline formula={reproProp} />.
				</li>
				<li>
					<strong>La norme = la régularité</strong> :
					<KatexInline formula={spectralNorm} /> — régulariser, c'est punir les hautes
					fréquences (directions à petite valeur propre).
				</li>
				<li>
					<strong>Théorème du représentant (E.4)</strong> : perte (arbitraire, aux points
					d'entraînement) +
					<KatexInline formula={String.raw`g(\lVert f \rVert)`} /> avec
					<KatexInline formula="g" /> strictement croissante
					<KatexInline formula="\Rightarrow" /> minimiseur dans
					<KatexInline formula={String.raw`\operatorname{span}\{ K(\cdot, x_i) \}`} /> —
					l'infini se réduit à
					<KatexInline formula={String.raw`\alpha \in \mathbb{R}^n`} />.
				</li>
				<li>
					<strong>KRR (E.5–E.6)</strong> :
					<KatexInline formula={String.raw`\alpha^\star = (K + n\lambda I)^{-1} y`} /> ; noyau
					linéaire <KatexInline formula="\Rightarrow" /> ridge du cours ;
					<KatexInline formula={String.raw`\lambda \to 0`} /> interpolation,
					<KatexInline formula={String.raw`\lambda \to \infty`} /> trivial.
				</li>
				<li>
					<strong>Universel +
					<KatexInline formula={String.raw`\lambda_n \to 0`} /> +
					<KatexInline formula={String.raw`n\lambda_n \to \infty`} /> (E.8–E.10)</strong> : le
					noyau gaussien est universel ; la KRR est alors <strong>consistante</strong> en
					<KatexInline formula={String.raw`L^2(\mu)`} />.
				</li>
				<li>
					<strong>Ponts</strong> : SVM à noyau = ERM contraint dans
					<KatexInline formula={String.raw`\mathcal{H}_K`} /> (leçon 4, relue) ; k-NN = noyau
					local (lecture) ; NTK = noyau tangent (Partie IX).
				</li>
			</ol>
		</Callout>

		<ExercisePanel number="1" title="KRR à deux points, à la main">
			<p>
				Deux points <KatexInline formula={String.raw`x_1, x_2`} /> avec noyau gaussien,
				<KatexInline formula={String.raw`\lVert x_1 \rVert = \lVert x_2 \rVert = 0`} />,
				<KatexBlock formula={k2Mat} />
				avec <KatexInline formula={String.raw`\rho \in (0,1)`} />
				(donc <KatexInline formula={String.raw`K(x_1, x_2) = \rho`} />),
				<KatexInline formula={String.raw`y = (1, -1)^\top`} />,
				<KatexInline formula={String.raw`n = 2`} />.
			</p>
			<ol>
				<li>
					Écrire
					<KatexInline formula={String.raw`\alpha^\star = (K + 2\lambda I)^{-1} y`} />
					explicitement (inverser
					<KatexInline formula={String.raw`2 \times 2`} />).
				</li>
				<li>
					Calculer
					<KatexInline
						formula={String.raw`\lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K} = \alpha^{\star\top} K \alpha^\star`}
					/>.
				</li>
				<li>
					Vérifier que
					<KatexInline formula={String.raw`\lambda \to 0^+`} />
					donne
					<KatexInline formula={String.raw`f^\star(x_1) \to 1`} />,
					<KatexInline formula={String.raw`f^\star(x_2) \to -1`} /> (interpolation).
				</li>
				<li>
					Que vaut
					<KatexInline formula={String.raw`\alpha^\star`} /> quand
					<KatexInline formula={String.raw`\rho = 0`} /> ? Interpréter (points «
					indépendants »).
				</li>
			</ol>
			{#snippet solution()}
				<p>
					<KatexInline
						formula={String.raw`K + 2\lambda I = \begin{pmatrix} 1 + 2\lambda & \rho \\ \rho & 1 + 2\lambda \end{pmatrix}`}
					/>, déterminant
					<KatexInline formula={String.raw`D = (1 + 2\lambda)^2 - \rho^2`} />, et
					<KatexInline
						formula={String.raw`(K + 2\lambda I)^{-1} = \frac{1}{D} \begin{pmatrix} 1 + 2\lambda & -\rho \\ -\rho & 1 + 2\lambda \end{pmatrix}`}
					/>.
				</p>
				<p>
					(a) <KatexBlock formula={ex1Alpha} />
				</p>
				<p>
					(b)
					<KatexInline formula={String.raw`f^\star(x_1) = \alpha_1 + \rho\, \alpha_2 = \alpha_1 (1 - \rho)`} />,
					donc
					<KatexBlock formula={ex1Norm} />
					(Contrôle : l'identité
					<KatexInline
						formula={String.raw`\lVert f \rVert^2 = \alpha^\top y - n\lambda \lVert \alpha \rVert^2`}
					/>
					— issue de
					<KatexInline formula={String.raw`K\alpha^\star = y - n\lambda \alpha^\star`} /> —
					donne la même valeur.)
				</p>
				<p>
					(c) <KatexInline formula={String.raw`\lambda \to 0`} /> :
					<KatexInline
						formula={String.raw`K^{-1} = \frac{1}{1-\rho^2} \begin{pmatrix} 1 & -\rho \\ -\rho & 1 \end{pmatrix}`}
					/>
					, donc
					<KatexInline formula={ex1Inv} />
					et
					<KatexInline
						formula={String.raw`f^\star(x_i) = (K\alpha^\star)_i \to (K K^{-1} y)_i = y_i`}
					/>
					— interpolation :
					<KatexInline formula={String.raw`f^\star(x_1) \to 1`} />,
					<KatexInline formula={String.raw`f^\star(x_2) \to -1`} /> ✓.
				</p>
				<p>
					(d) <KatexInline formula={String.raw`\rho = 0`} /> :
					<KatexInline formula={String.raw`K = I`} />,
					<KatexInline
						formula={String.raw`\alpha^\star = \frac{1}{1 + 2\lambda}\, (1, -1)^\top`}
					/>
					— chaque point s'ajuste <strong>indépendamment</strong> (pas de couplage par le
					noyau).
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2" title="La norme décroît avec λ">
			<p>
				Soit <KatexInline formula="K" /> semi-définie positive,
				<KatexInline formula={String.raw`y \in \mathbb{R}^n`} />,
				<KatexInline formula={String.raw`\alpha(\lambda) = (K + n\lambda I)^{-1} y`} />, et
				<KatexInline
					formula={String.raw`h(\lambda) = \alpha(\lambda)^\top K\, \alpha(\lambda) = \lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K}`}
				/>.
			</p>
			<ol>
				<li>
					Montrer que <KatexInline formula="h" /> est
					<strong>strictement décroissante</strong> sur
					<KatexInline formula={String.raw`]0, +\infty[`} /> si
					<KatexInline formula={String.raw`K \ne 0`} />.
					<em>(Indice : utiliser la dérivée de
					<KatexInline formula={String.raw`t \mapsto (K + tI)^{-1}`} />, ou la décomposition
					spectrale de
					<KatexInline formula="K" />.)</em>
				</li>
				<li>
					Calculer
					<KatexInline formula={String.raw`\lim_{\lambda \to 0^+} h(\lambda)`} /> et
					<KatexInline formula={String.raw`\lim_{\lambda \to +\infty} h(\lambda)`} />.
				</li>
				<li>
					Relier à la démo E.7 : la courbe
					<KatexInline
						formula={String.raw`\lambda \mapsto \lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K}`}
					/>
					doit être strictement décroissante pour tout choix des glisseurs.
				</li>
			</ol>
			{#snippet solution()}
				<p>
					(a) Spectrale :
					<KatexInline
						formula={String.raw`K = Q \operatorname{diag}(\mu_i) Q^\top`}
					/>
					, donc
					<KatexBlock formula={hSpectral} />
					chaque terme décroît en
					<KatexInline formula="\lambda" /> (dérivée
					<KatexInline
						formula={String.raw`-2n\, \mu_i\, (Q^\top y)_i^2\, / \, (\mu_i + n\lambda)^3 \le 0`}
					/>
					, strict si <KatexInline formula={String.raw`\mu_i > 0`} /> et
					<KatexInline formula={String.raw`(Q^\top y)_i \ne 0`} />).
				</p>
				<p>
					(b)
					<KatexInline formula={String.raw`\lambda \to 0^+`} /> :
					<KatexInline
						formula={String.raw`h \to \sum_{i:\, \mu_i > 0} \frac{(Q^\top y)_i^2}{\mu_i}`}
					/>
					(= <KatexInline formula={String.raw`y^\top K^+ y`} />, i.e.
					<KatexInline
						formula={String.raw`\lVert f_{\text{interp}} \rVert^2`}
					/>
					si <KatexInline formula="K" /> inversible) ;
					<KatexInline formula={String.raw`\lambda \to \infty`} /> :
					<KatexInline
						formula={String.raw`h(\lambda) \sim \dfrac{y^\top K\, y}{n^2 \lambda^2} \to 0`}
					/>.
				</p>
				<p>
					(c) La démo E.7 affiche cette métrique ; l'invariance est testée dans les tests du
					module mathématique (monotonie sur une grille de
					<KatexInline formula="\lambda" />).
				</p>
			{/snippet}
		</ExercisePanel>

		<InteractiveSection
			number="E.11"
			title="Quiz — RKHS et méthodes à noyau"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Mercer, J.']}
			year={1909}
			title="Functions of Positive and Negative Type, and their Connection with the Theory of Integral Equations"
			journal="Philosophical Transactions of the Royal Society of London A, 209(457–458):415–446."
		/>

		<BibElement
			authors={['Aronszajn, N.']}
			year={1950}
			title="Theory of Reproducing Kernels"
			journal="Transactions of the American Mathematical Society, 68(3):337–404."
			link="https://doi.org/10.1090/s0002-9947-1950-0051437-7"
		/>

		<BibElement
			authors={['Kimeldorf, G.', 'Wahba, G.']}
			year={1970}
			title="A variational approach to the estimation of the functional structure of stochastic processes"
			journal="Première forme du théorème du représentant et de la consistance de la KRR."
		/>

		<BibElement
			authors={['Schölkopf, B.', 'Herbrich, J.', 'Smola, A. J.']}
			year={2001}
			title="Learning with Kernels: Support Vector Machines, Regularization, Optimization, and Algorithms"
			journal="MIT Press."
		/>

		<BibElement
			authors={['Schölkopf, B.', 'Smola, A. J.']}
			year={2002}
			title="Learning with Kernels"
			journal="MIT Press (ch. 4 : RKHS, KRR, noyaux universels, consistance)."
		/>

		<BibElement
			authors={['Micchelli, C. A.', 'Xu, Y.', 'Zhang, H.']}
			year={2006}
			title="Universal Kernels"
			journal="Journal of Machine Learning Research, 7(95):2651–2667."
			link="https://jmlr.org/papers/v7/micchelli06a.html"
		/>

		<BibElement
			authors={['Wahba, G.']}
			year={1990}
			title="Spline Models for Observational Data"
			journal="SIAM, CBMS-NSFM 48."
			link="https://doi.org/10.1137/1.9781611970128"
		/>

		<BibElement
			authors={['Jacot, A.', 'Gabriel, F.', 'Hongler, C.']}
			year={2018}
			title="Neural Tangent Kernel: Convergence and Generalization in Neural Networks"
			journal="NeurIPS 2018."
			link="https://arxiv.org/abs/1806.07572"
		/>

		<BibElement
			authors={['Rahimi, A.', 'Recht, B.']}
			year={2007}
			title="Random Features for Large-Scale Kernel Machines"
			journal="NeurIPS 2007."
		/>
	</Bibliography>
</PageTemplate>
