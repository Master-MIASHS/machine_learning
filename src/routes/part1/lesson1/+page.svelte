<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import ContourLandscape from '$lib/components/demos/ContourLandscape.svelte';
	import GradientField from '$lib/components/demos/GradientField.svelte';
	import HessianExplorer from '$lib/components/demos/HessianExplorer.svelte';
	import ConvexityDemo from '$lib/components/demos/ConvexityDemo.svelte';
	import CoercivityVisualizer from '$lib/components/demos/CoercivityVisualizer.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part1/lesson1');
	const tracker = createPageTracker(meta as PageMeta);
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	interface TocEntry {
		id: string;
		label: string;
		description?: string;
		color: 'epistemic' | 'positive' | 'neutral' | 'belief' | 'surprise' | 'agent';
	}

	const tocEntries: TocEntry[] = [
		{
			id: 'introduction',
			label: 'Introduction',
			description: "Le problème fondamental de l'optimisation en ML",
			color: 'epistemic'
		},
		{
			id: 'definitions-preliminaires',
			label: 'Définitions préliminaires',
			description: 'Minima locaux, globaux, stricts',
			color: 'neutral'
		},
		{
			id: 'conditions-necessaires',
			label: "Conditions nécessaires d'optimalité",
			description: 'CNO du 1er et 2ème ordre (∇f=0, H⪰0)',
			color: 'belief'
		},
		{
			id: 'conditions-suffisantes',
			label: "Conditions suffisantes d'optimalité",
			description: 'CSSO — Hessien défini positif implique minimum strict',
			color: 'positive'
		},
		{
			id: 'convexite-minimum-global',
			label: 'Convexité et minimum global',
			description: 'Convexité garantit que local ⇒ global',
			color: 'surprise'
		},
		{
			id: 'contres-exemples',
			label: 'Contre-exemples et cas limites',
			description: 'Quand les conditions échouent ou sont inconclusives',
			color: 'agent'
		},
		{
			id: 'coercivite-existence',
			label: "Coercivité et existence d'un minimum global",
			description: 'Théorème de Weierstrass, compacité des ensembles de niveau',
			color: 'epistemic'
		},
		{
			id: 'synthese-hierarchie',
			label: 'Synthèse — Hiérarchie des conditions',
			description: 'Récapitulatif visuel des implications',
			color: 'neutral'
		}
	];

	// ── Formula variables (stored in script so Svelte never parses backslashes) ──

	// Core objects
	const fOmegaR = 'f : \\Omega \\to \\mathbb{R}';
	const omegaSubsetRn = '\\Omega \\subseteq \\mathbb{R}^n';
	const omegaSym = '\\Omega';
	const fSym = 'f';
	const xSym = 'x';
	const xStarSym = 'x^*';
	const epsSym = '\\varepsilon';
	const epsPos = '\\varepsilon > 0';
	const xStarInOmega = 'x^* \\in \\Omega';
	const ballDef = 'B(x^*, \\varepsilon)';
	const xyInOmegaLambda = 'x, y \\in \\Omega,\\ \\lambda \\in [0, 1]';

	// Minima definitions
	const minLocalIneq = 'f(x^*) \\le f(x),\\quad \\forall x \\in B(x^*, \\varepsilon) \\cap \\Omega';
	const minGlobalIneq = 'f(x^*) \\le f(x),\\quad \\forall x \\in \\Omega';

	// Optimality conditions
	const nablaZero = '\\nabla f(x^*) = 0';
	const hessSemiPos = 'H_f(x^*) \\succeq 0';
	const hessDefPos = 'H_f(x^*) \\succ 0';

	// Taylor-expansion proof sketches
	const taylorOrder1 = 'f(x^* + t d) = f(x^*) + t\\, \\nabla f(x^*)^\\top d + o(t)';
	const taylorOrder1Contra = 'f(x^* + t d) - f(x^*) \\approx t\\, \\nabla f(x^*)^\\top d';
	const taylorOrder2WithZeroGrad =
		'f(x^* + t d) = f(x^*) + \\frac{t^2}{2} d^\\top H_f(x^*) d + o(t^2)';
	const cssoStrictIneq =
		'f(x^* + t d) - f(x^*) \\ge \\frac{t^2}{2}\\, \\mu \\|d\\|^2 + o(t^2) > 0 \\text{ pour } t \\text{ petit}';

	// Convexity
	const convexityIneq = 'f(\\lambda x + (1-\\lambda)y) \\le \\lambda f(x) + (1-\\lambda)f(y)';
	const nablaIffGlobal = '\\nabla f(x^*) = 0 \\iff x^* \\text{ est un minimum global de } f';
	const tangentBelowIneq =
		'f(y) \\ge f(x) + \\nabla f(x)^\\top (y-x), \\quad \\forall x, y \\in \\Omega';
	const strictConvexIneq =
		'f(\\lambda x + (1-\\lambda) y) < \\lambda f(x) + (1-\\lambda) f(y), \\quad \\forall x \\neq y,\\ \\lambda \\in (0,1)';
	const quadFormConvex =
		'f(x) = x^\\top A x,\\quad A \\succeq 0 \\ \\Longrightarrow\\ f \\text{ convexe}';

	// Coercivity
	const hessianMatrix = 'H_f(0,0)=\\begin{pmatrix} 2 & 0 \\\\ 0 & 0 \\end{pmatrix}';
	const coerciveLimit = '\\lim_{\\|x\\|\\to +\\infty} f(x) = +\\infty';
	const sublevelSet = '\\{x \\mid f(x) \\le c\\}';
	const sublevelClosedBounded =
		'\\{x \\mid f(x) \\le c\\} \\ \\text{fermé (par continuité) et borné (par coercivité)} \\ \\Longrightarrow\\ \\text{compact}';
	const paraboloidCoercive =
		'f(x,y) = x^2 + y^2, \\quad f(x,y) \\to +\\infty \\ \\text{quand}\\ \\|(x,y)\\| \\to \\infty';

	// Example 1.8: f(x) = x⁴ − x²
	const fx4mx2 = 'f(x) = x^4 - x^2';
	const gradFx4 = '\\nabla f(x) = 4x^3 - 2x';
	const hessFx4 = "f''(x) = 12x^2 - 2";
	const pmSqrt2 = 'x = \\pm 1/\\sqrt{2}';
	const fxxAtPm = "f''(\\pm 1/\\sqrt{2}) = 4 > 0";
	const xZero = 'x = 0';
	const fppZeroNeg2 = "f''(0) = -2";
	const gradZeroCheck = '4(1/\\sqrt{2})^3 - 2(1/\\sqrt{2}) = 0';
	const hessPositive = '12(1/2) - 2 = 4 > 0';
	const fx4mx2Values = 'f(0) = 0, \\quad f(\\pm 1/\\sqrt{2}) = -\\tfrac{1}{4}';

	// Example 1.9: f(x) = x³
	const fx3 = 'f(x) = x^3';
	const fpx3x2 = "f'(x) = 3x^2";
	const fppx6x = "f''(x) = 6x";
	const yx3 = 'y = x^3';
	const fppAtZeroIsZero = "f''(0) = 0";

	// Example 1.10: f(x,y) = x² − x⁴ − y⁴ (two-variable — do NOT reuse fx4mx2 here)
	const fx2y2 = 'f(x,y) = x^2 - x^4 - y^4';
	const eigenvals = '\\lambda_1 = 2 > 0,\\ \\lambda_2 = 0';
	const xAbsLarge = '|x| \\to \\infty';
	const negX4 = '-x^4';
	const fToNegInf = 'f \\to -\\infty';
	const semiPosNeqMin = '\\text{semi-défini positif} \\\\neq \\text{minimum garanti}';

	// Exercise 1.3
	const fxMy = 'f(x,0) = x^2-x^4';
	const fyx = 'f(0,y)=-y^4';
	const fyxNonPositive = 'f(0,y) = -y^4 \\le 0';
	const fxMyNonNegative = 'f(x,0) = x^2(1-x^2) \\ge 0';
	const originPoint = '(0,0)';
	const yAxis = 'y';
	const xAxis = 'x';
	const yEqualsZero = 'y = 0';
	const hessianPsdNeqMin = '\\text{Hessien PSD} \\\\neq \\text{minimum garanti}';

	// Coercivity callout
	const fExpNeg = 'f(x) = e^{-x}';

	// Synthesis table
	const fDiffOmegaOpen = 'f \\text{ différentiable}, \\Omega \\text{ ouvert}';
	const fTwiceDiff = 'f \\text{ deux fois différentiable}';
	const fConvexDiff = 'f \\text{ convexe et différentiable}';
	const fContCoerciveRn = 'f \\text{ continue et coercive sur } \\mathbb{R}^n';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? "Conditions d'existence d'un minimum"}
	subtitle=" Bases mathématiques de l'optimisation : optimalité, existence et convexité"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			Presque tous les algorithmes d'apprentissage automatique se ramènent, au fond, à un seul
			problème : trouver un point <KatexInline formula={xStarSym} /> qui minimise une fonction objectif
			<KatexInline formula={fSym} />. Que l'on entraîne une régression linéaire, un SVM, ou un
			réseau de neurones profond, la question mathématique sous-jacente est toujours la même :
			<em>comment reconnaître et garantir l'existence d'un minimum ?</em>
		</p>

		<p>À l'issue de ce chapitre, vous devrez être capable de :</p>

		<ol>
			<li>
				<strong>Reconnaître un minimum</strong> — si l'on nous présente un point candidat <KatexInline
					formula={xStarSym}
				/>, quelles conditions vérifiables permettent de confirmer (ou d'infirmer) qu'il s'agit bien
				d'un minimum ? C'est l'objet des <em>conditions nécessaires</em> et
				<em>suffisantes</em> d'optimalité (gradient nul, signe du Hessien).
			</li>
			<li>
				<strong>Passer du local au global</strong> — un minimum local n'est en général qu'une
				garantie faible : il peut exister de meilleurs points ailleurs. La <em>convexité</em> est la propriété
				structurelle qui permet, sous certaines hypothèses, de transformer une garantie locale en garantie
				globale.
			</li>
			<li>
				<strong>Garantir l'existence</strong> — avant même de chercher à caractériser un minimum, il
				faut s'assurer qu'il en existe un ! La <em>coercivité</em>, combinée au théorème de
				Weierstrass, répond à cette question.
			</li>
			<li>
				<strong>Savoir où ces garanties échouent</strong> — chaque théorème repose sur des hypothèses
				précises (différentiabilité, ouverture du domaine, convexité…). Nous verrons plusieurs contre-exemples
				soigneusement choisis pour illustrer ce qui se passe quand une hypothèse est violée.
			</li>
		</ol>

		<h2 id="definitions-preliminaires">Définitions préliminaires</h2>

		<p>
			Soit <KatexInline formula={fOmegaR} /> une fonction définie sur un ensemble <KatexInline
				formula={omegaSubsetRn}
			/>. On distingue deux notions de minimum, qui ne coïncident pas en général.
		</p>

		<DefinitionBlock number="1.1" title="Minimum local">
			<p>
				On dit que <KatexInline formula={xStarInOmega} /> est un <strong>minimum local</strong> s'il
				existe <KatexInline formula={epsPos} /> tel que :
			</p>
			<KatexBlock formula={minLocalIneq} />
			<p>
				où <KatexInline formula={ballDef} /> désigne la boule ouverte centrée en <KatexInline
					formula={xStarSym}
				/> de rayon <KatexInline formula={epsSym} />. Intuitivement, <KatexInline
					formula={xStarSym}
				/> est un minimum local si <strong>aucun point suffisamment proche</strong> ne fait strictement
				mieux — mais des points plus lointains pourraient très bien exister.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="1.2" title="Minimum global">
			<p>
				On dit que <KatexInline formula={xStarInOmega} /> est un <strong>minimum global</strong> si :
			</p>
			<KatexBlock formula={minGlobalIneq} />
			<p>
				Tout minimum global est automatiquement un minimum local (en prenant <KatexInline
					formula={epsSym}
				/> arbitrairement grand), mais l'inverse est faux en général — c'est précisément ce que montreront
				les Exemples 1.8 et 1.9 plus bas.
			</p>
		</DefinitionBlock>

		<Callout type="warning" title="L'existence n'est jamais garantie a priori">
			Ces deux définitions supposent implicitement qu'un minimum <em>existe</em>. Ce n'est pas
			toujours le cas ! Par exemple, <KatexInline formula={String.raw`f(x) = x`} /> sur <KatexInline
				formula={String.raw`\mathbb{R}`}
			/> n'admet aucun minimum (elle décroît indéfiniment), et <KatexInline
				formula={String.raw`f(x) = 1/x`}
			/> sur
			<KatexInline formula={String.raw`(0, +\infty)`} /> non plus (son infimum, <KatexInline
				formula="0"
			/>, n'est jamais atteint). Nous reviendrons sur les conditions garantissant l'existence d'un
			minimum global dans la section sur la coercivité, en fin de leçon.
		</Callout>

		<InteractiveSection
			number="1.1"
			title="Paysage d'optimisation"
			onInteract={tracker.trackInteraction}
		>
			<ContourLandscape />
		</InteractiveSection>

		<h2 id="conditions-necessaires">Conditions nécessaires d'optimalité</h2>

		<p>
			Première question : si l'on trouve un point candidat au minimum, quelles propriétés doit-il
			vérifier ? Ces conditions sont dites <strong>nécessaires</strong> : tout minimum local doit
			les satisfaire, mais un point qui les satisfait n'est pas nécessairement un minimum. Elles
			servent surtout à <em>éliminer</em> des candidats : si un point ne vérifie pas la CNO, ce n'est
			certainement pas un minimum.
		</p>

		<TheoremBlock number="1.3" title="CNO — Condition nécessaire du premier ordre">
			<p>
				Soit <KatexInline formula={fOmegaR} /> différentiable sur <KatexInline
					formula={omegaSym}
				/>, avec <KatexInline formula={omegaSym} /> ouvert. Si <KatexInline formula={xStarSym} /> est
				un minimum local, alors :
			</p>
			<KatexBlock formula={nablaZero} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Idée de la démonstration :</strong></p>
			<p>
				Fixons une direction <KatexInline formula={String.raw`d \in \mathbb{R}^n`} /> quelconque. Comme
				<KatexInline formula={omegaSym} /> est ouvert, pour <KatexInline formula={String.raw`t`} /> suffisamment
				petit, le point <KatexInline formula={String.raw`x^* + td`} /> reste dans <KatexInline
					formula={omegaSym}
				/>. Le développement de Taylor à l'ordre 1 donne :
			</p>
			<KatexBlock formula={taylorOrder1} />
			<p>
				Si <KatexInline formula={String.raw`\nabla f(x^*)^\top d \neq 0`} />, on peut choisir le
				signe de <KatexInline formula={String.raw`t`} /> (positif ou négatif) pour que <KatexInline
					formula={taylorOrder1Contra}
				/> soit strictement négatif — ce qui contredirait le fait que <KatexInline
					formula={xStarSym}
				/> soit un minimum local. Cette contradiction devant être évitée pour <strong>toute</strong>
				direction <KatexInline formula={String.raw`d`} />, on en conclut <KatexInline
					formula={nablaZero}
				/>.
			</p>
		</div>

		<Callout type="warning" title="Attention !">
			Cette condition est <strong>nécessaire mais pas suffisante</strong>. Un point où le gradient
			s'annule (on l'appelle un <strong>point critique</strong> ou
			<strong>point stationnaire</strong>) peut être un minimum, un maximum, ou un point-selle. Il
			faut examiner l'ordre 2 pour trancher — c'est l'objet du théorème suivant.
		</Callout>

		<TheoremBlock number="1.4" title="CNSO — Condition nécessaire du second ordre">
			<p>
				Soit <KatexInline formula={fSym} /> deux fois différentiable sur <KatexInline
					formula={omegaSym}
				/>, avec <KatexInline formula={omegaSym} /> ouvert. Si <KatexInline formula={xStarSym} /> est
				un minimum local, alors :
			</p>
			<ol>
				<li><KatexInline formula={nablaZero} /> (gradient nul)</li>
				<li>
					<KatexInline formula={hessSemiPos} />, c'est-à-dire que la matrice hessienne est
					<strong>semi-définie positive</strong>
				</li>
			</ol>
			<p>
				Un point critique avec Hessien semi-défini positif peut encore être un minimum ou un
				point-selle — la condition reste nécessaire, pas suffisante (voir l'Exemple 1.10 pour un cas
				explicite).
			</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Idée de la démonstration :</strong></p>
			<p>
				Le premier point découle du théorème 1.3. Pour le second, on pousse le développement de
				Taylor à l'ordre 2, en utilisant <KatexInline formula={nablaZero} /> :
			</p>
			<KatexBlock formula={taylorOrder2WithZeroGrad} />
			<p>
				Si <KatexInline formula={String.raw`d^\top H_f(x^*) d < 0`} /> pour une direction <KatexInline
					formula={String.raw`d`}
				/>, alors <KatexInline formula={String.raw`f(x^*+td) < f(x^*)`} /> pour <KatexInline
					formula={String.raw`t`}
				/> assez petit — contredisant la minimalité locale. Donc <KatexInline
					formula={String.raw`d^\top H_f(x^*) d \ge 0`}
				/> pour toute direction <KatexInline formula={String.raw`d`} />, ce qui est exactement la
				définition de <KatexInline formula={hessSemiPos} />.
			</p>
		</div>

		<InteractiveSection
			number="1.2"
			title="Champ de gradient"
			onInteract={tracker.trackInteraction}
		>
			<GradientField />
		</InteractiveSection>

		<h2 id="conditions-suffisantes">Conditions suffisantes d'optimalité</h2>

		<p>
			L'inverse est-il vrai ? Si le Hessien est bien défini positif en un point critique, peut-on
			conclure qu'on a bel et bien un minimum ? Contrairement aux conditions précédentes, une
			condition <strong>suffisante</strong> garantit la conclusion — mais au prix d'une hypothèse plus
			forte, qui ne sera pas toujours vérifiée en pratique.
		</p>

		<TheoremBlock number="1.5" title="CSSO — Condition suffisante du second ordre">
			<p>
				Soit <KatexInline formula={fSym} /> deux fois différentiable sur <KatexInline
					formula={omegaSym}
				/>, avec <KatexInline formula={omegaSym} /> ouvert. Si en un point <KatexInline
					formula={xStarSym}
				/> :
			</p>
			<ol>
				<li><KatexInline formula={nablaZero} /> (gradient nul)</li>
				<li>
					<KatexInline formula={hessDefPos} />, c'est-à-dire que la matrice hessienne est
					<strong>définie positive</strong>
				</li>
			</ol>
			<p>Alors <KatexInline formula={xStarSym} /> est un <strong>minimum local strict</strong>.</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Idée de la démonstration :</strong></p>
			<p>
				Comme <KatexInline formula={String.raw`H_f(x^*)`} /> est définie positive, il existe <KatexInline
					formula={String.raw`\mu > 0`}
				/> (la plus petite valeur propre de <KatexInline formula={String.raw`H_f(x^*)`} />) tel que <KatexInline
					formula={String.raw`d^\top H_f(x^*) d \ge \mu \|d\|^2`}
				/> pour tout <KatexInline formula={String.raw`d`} />. Le développement de Taylor à l'ordre 2
				donne alors, pour <KatexInline formula={String.raw`t`} /> assez petit :
			</p>
			<KatexBlock formula={cssoStrictIneq} />
			<p>
				Le terme dominant étant strictement positif, on a <KatexInline
					formula={String.raw`f(x^*+td) > f(x^*)`}
				/> pour tout <KatexInline formula={String.raw`d \neq 0`} /> et <KatexInline
					formula={String.raw`t`}
				/> assez petit : <KatexInline formula={xStarSym} /> est donc un minimum local strict.
			</p>
		</div>

		<ExampleBlock number="1.5.1" title="Un premier exemple complet : la parabole">
			<p>
				Reprenons le cas le plus simple, <KatexInline formula={String.raw`f(x) = x^2`} />. On a <KatexInline
					formula={String.raw`f'(x) = 2x`}
				/>, qui s'annule uniquement en <KatexInline formula={String.raw`x=0`} /> (CNO). La dérivée seconde
				<KatexInline formula={String.raw`f''(x) = 2`} /> est constante et strictement positive, donc la
				CSSO est satisfaite : <KatexInline formula={String.raw`x=0`} /> est un minimum local strict. En
				dimension 2, le même raisonnement s'applique à <KatexInline
					formula={String.raw`f(x,y) = x^2+y^2`}
				/> : le gradient <KatexInline formula={String.raw`(2x,2y)`} /> s'annule en <KatexInline
					formula={String.raw`(0,0)`}
				/>, et le Hessien <KatexInline formula={String.raw`2I_2`} /> est défini positif — <KatexInline
					formula={String.raw`(0,0)`}
				/> est un minimum local strict. Ce sont les exemples les plus simples pour ancrer l'intuition
				avant d'aborder des cas plus subtils.
			</p>
		</ExampleBlock>

		<InteractiveSection
			number="1.3"
			title="Courbure du Hessien"
			onInteract={tracker.trackInteraction}
		>
			<HessianExplorer />
		</InteractiveSection>

		<h2 id="convexite-minimum-global">Convexité et minimum global</h2>

		<p>
			Les conditions précédentes ne parlent que de minima <strong>locaux</strong>. La convexité est
			la propriété structurelle qui permet de passer d'un minimum local à un minimum global — c'est
			sans doute la notion la plus importante de toute l'optimisation continue, car elle est à la
			base de la quasi-totalité des garanties théoriques utilisées en apprentissage automatique
			(régression linéaire, régression logistique, SVM…).
		</p>

		<DefinitionBlock number="1.6" title="Fonction convexe">
			<p>
				Soit <KatexInline formula={omegaSubsetRn} /> un ensemble convexe. Une fonction <KatexInline
					formula={fOmegaR}
				/> est <strong>convexe</strong> si pour tout <KatexInline formula={xyInOmegaLambda} /> :
			</p>
			<KatexBlock formula={convexityIneq} />
			<p>
				Autrement dit, la corde reliant deux points du graphe reste toujours <strong
					>au-dessus</strong
				> du graphe. Géométriquement, cela signifie que la fonction n'a « pas de bosse » entre deux points
				quelconques.
			</p>
		</DefinitionBlock>

		<Callout type="intuition" title="Convexité stricte">
			On dit que <KatexInline formula={fSym} /> est <strong>strictement convexe</strong> si
			l'inégalité ci-dessus est stricte pour tout <KatexInline formula={String.raw`x \neq y`} /> :
			<KatexBlock formula={strictConvexIneq} />
			Cette notion plus fine garantit non seulement l'existence d'un minimum global (si la fonction en
			admet un), mais aussi son <strong>unicité</strong> — un point que nous approfondirons dans la leçon
			suivante, en lien avec la régularisation Ridge.
		</Callout>

		<InteractiveSection
			number="1.4"
			title="Visualiser la convexité"
			onInteract={tracker.trackInteraction}
		>
			<ConvexityDemo />
		</InteractiveSection>

		<TheoremBlock
			number="1.7"
			title="Condition nécessaire et suffisante pour les fonctions convexes"
		>
			<p>
				Soit <KatexInline formula={fOmegaR} /> convexe et différentiable, avec <KatexInline
					formula={omegaSym}
				/> convexe ouvert. Alors :
			</p>
			<KatexBlock formula={nablaIffGlobal} />
			<p>
				C'est le résultat fondamental de l'optimisation convexe : en contexte convexe, la CNO
				devient à la fois nécessaire et suffisante, et elle garantit un optimum <strong
					>global</strong
				> — un saut qualitatif énorme par rapport au cas général, où le gradient nul ne garantissait même
				pas un minimum local strict sans information sur le Hessien.
			</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Idée de la démonstration (sens direct) :</strong></p>
			<p>
				Pour une fonction convexe et différentiable, on dispose d'une caractérisation équivalente
				par le premier ordre : le graphe de <KatexInline formula={fSym} /> reste toujours au-dessus de
				son plan tangent en tout point,
			</p>
			<KatexBlock formula={tangentBelowIneq} />
			<p>
				En prenant <KatexInline formula={String.raw`x = x^*`} /> avec <KatexInline
					formula={String.raw`\nabla f(x^*) = 0`}
				/>, l'inégalité se simplifie en <KatexInline formula={String.raw`f(y) \ge f(x^*)`} /> pour tout
				<KatexInline formula={String.raw`y \in \Omega`} /> — c'est-à-dire exactement la définition d'un
				minimum global.
			</p>
		</div>

		<p>
			Ce théorème explique pourquoi de nombreuses fonctions de perte utilisées en apprentissage
			automatique sont convexes : dès qu'on peut le montrer, la recherche du minimum se réduit à
			résoudre <KatexInline formula={nablaZero} />, sans avoir à se soucier de minima locaux
			parasites.
		</p>

		<ExampleBlock number="1.7.1" title="Convexité d'une forme quadratique">
			<p>
				Une classe de fonctions convexes très utile en pratique : si <KatexInline
					formula={String.raw`A`}
				/> est une matrice symétrique semi-définie positive, alors :
			</p>
			<KatexBlock formula={quadFormConvex} />
			<p>
				En effet, la Hessienne de <KatexInline formula={String.raw`f(x) = x^\top A x`} /> est constante
				et égale à
				<KatexInline formula={String.raw`2A`} />, donc semi-définie positive partout — ce qui,
				d'après un critère équivalent à la Définition 1.6 (convexité via la Hessienne, que nous
				établirons formellement dans la leçon suivante), suffit à garantir la convexité de <KatexInline
					formula={String.raw`f`}
				/>. C'est exactement la structure de la perte des moindres carrés que nous retrouverons au
				prochain chapitre.
			</p>
		</ExampleBlock>

		<h2 id="contres-exemples">Contre-exemples et cas limites</h2>

		<p>
			Chaque théorème énoncé ci-dessus repose sur des hypothèses précises — différentiabilité,
			ouverture du domaine, signe strict du Hessien, convexité… Il est essentiel de comprendre
			pourquoi chaque hypothèse compte, car en pratique (réseaux de neurones, fonctions non lisses),
			ces hypothèses sont loin d'être automatiquement vérifiées. Voici trois contre-exemples
			classiques, chacun isolant l'échec d'une hypothèse précise.
		</p>

		<ExampleBlock number="1.8" title="f(x) = x⁴ − x² : minima globaux sans convexité">
			<p>
				Soit <KatexInline formula={fx4mx2} />. On a <KatexInline formula={gradFx4} /> et <KatexInline
					formula={hessFx4}
				/>. Les points critiques sont en <KatexInline formula={xZero} /> et <KatexInline
					formula={pmSqrt2}
				/>.
			</p>
			<ul>
				<li><KatexInline formula={fxxAtPm} /> — ce sont des minima locaux (et globaux)</li>
				<li>
					<KatexInline formula={fppZeroNeg2} />, strictement négatif : c'est un maximum local
				</li>
			</ul>
			<p>
				En évaluant la fonction en ces points, <KatexInline formula={fx4mx2Values} /> : les deux points
				<KatexInline formula={pmSqrt2} /> sont bien les minima globaux (la fonction tend vers <KatexInline
					formula={String.raw`+\infty`}
				/> aux deux infinis, dominée par le terme <KatexInline formula={String.raw`x^4`} />).
			</p>
			<p>
				Cette fonction possède donc des minima globaux mais n'est <strong>pas convexe</strong>, car
				sa courbure en <KatexInline formula={xZero} /> est strictement négative — une corde reliant deux
				points situés de part et d'autre de l'origine passerait sous le graphe localement. Cela montre
				que la convexité est une condition <strong>suffisante</strong>, mais non
				<strong>nécessaire</strong>, pour l'existence d'un minimum : le Théorème 1.7 ne s'applique
				pas ici, et pourtant un minimum global existe bel et bien — il faut simplement le trouver
				par un autre moyen (ici, en énumérant les points critiques).
			</p>
		</ExampleBlock>

		<ExercisePanel number="1.1" title="Points critiques de x⁴ − x²">
			{#snippet solution()}
				<p>
					Le gradient s'annule : <KatexInline formula={gradZeroCheck} />. La dérivée seconde vaut
					<KatexInline formula={hessPositive} />, donc minimum strict par CSSO.
				</p>
			{/snippet}
			<p>
				Vérifiez manuellement que les points <KatexInline formula={pmSqrt2} /> sont bien des minima en
				évaluant le gradient et la dérivée seconde.
			</p>
		</ExercisePanel>

		<ExampleBlock number="1.9" title="f(x) = x³ : point critique sans optimum">
			<p>
				Soit <KatexInline formula={fx3} />. On a <KatexInline formula={fpx3x2} /> qui s'annule en
				<KatexInline formula={xZero} />, et <KatexInline formula={fppx6x} /> qui vaut aussi <KatexInline
					formula={fppAtZeroIsZero}
				/> en <KatexInline formula={xZero} />. Le point <KatexInline formula={xZero} /> est donc un point
				critique, mais il n'est ni minimum ni maximum — c'est un <strong>point d'inflexion</strong>.
			</p>
			<p>
				Cet exemple montre que l'annulation du gradient seule ne suffit pas (la CNO ne fait
				qu'éliminer des candidats, elle n'en confirme aucun), et que même un Hessien nul laisse le
				point indécis : la CNSO est satisfaite (<KatexInline formula={String.raw`0 \ge 0`} />) sans
				qu'il s'agisse d'un minimum. Il faut alors examiner les ordres supérieurs (ici, le signe de <KatexInline
					formula={String.raw`f'''(0) = 6 \neq 0`}
				/> révèle un point d'inflexion) ou changer complètement d'approche.
			</p>
		</ExampleBlock>

		<ExercisePanel number="1.2" title="L'inflexion cubique">
			{#snippet solution()}
				<p>
					La fonction traverse l'horizontale sans rebondir : elle est strictement croissante de part
					et d'autre. Le gradient s'annule mais ne change pas de signe.
				</p>
			{/snippet}
			<p>
				Dessinez la courbe <KatexInline formula={yx3} /> et observez pourquoi le point en <KatexInline
					formula={xZero}
				/> n'est pas un extremum.
			</p>
		</ExercisePanel>

		<ExampleBlock
			number="1.10"
			title="f(x,y) = x² − x⁴ − y⁴ : Hessien semi-défini positif, mais selle"
		>
			<p>
				Soit la fonction <KatexInline formula={fx2y2} /> à deux variables. Le gradient s'annule en l'origine
				et le Hessien vaut :
			</p>
			<KatexBlock formula={hessianMatrix} />
			<p>
				Ce Hessien a les valeurs propres <KatexInline formula={eigenvals} />, donc il est
				<strong>semi-défini positif</strong> — la CNSO est bien vérifiée. Pourtant, en regardant
				l'axe <KatexInline formula={xSym} /> pour <KatexInline formula={xAbsLarge} />, le terme <KatexInline
					formula={negX4}
				/> domine et fait tendre <KatexInline formula={fToNegInf} />. L'origine n'est pas un minimum
				— c'est un point-selle dégénéré, où la courbure d'ordre 2 seule ne détecte pas la
				décroissance d'ordre 4 dans la direction <KatexInline formula={xSym} />.
			</p>
			<p>
				Cet exemple montre précisément pourquoi la CNSO ne suffit pas : <KatexInline
					formula={semiPosNeqMin}
				/>. Il faut un Hessien <strong>strictement</strong> défini positif (CSSO, Théorème 1.5) pour conclure
				avec certitude.
			</p>
		</ExampleBlock>

		<ExercisePanel number="1.3" title="Le cas du selle dégénéré">
			{#snippet solution()}
				<p>
					Le long de l'axe des <KatexInline formula={yAxis} /> : <KatexInline
						formula={fyxNonPositive}
					/>, avec égalité uniquement en <KatexInline formula={yEqualsZero} />. L'origine est donc
					un <strong>maximum strict</strong> le long de cette direction — ce qui suffit déjà à
					exclure que ce soit un minimum (local ou global) de <KatexInline formula={fSym} />.
				</p>
				<p>
					Pourtant, le long de l'axe des <KatexInline formula={xAxis} /> : <KatexInline
						formula={fxMyNonNegative}
					/> près de l'origine, donc c'est au contraire un <strong>minimum local</strong> sur cet
					axe. Le Hessien (valeurs propres <KatexInline formula={eigenvals} />) ne voit que la
					courbure d'ordre 2 et reste semi-défini positif — il ne détecte pas la décroissance
					d'ordre 4 le long de <KatexInline formula={yAxis} />. C'est exactement le piège de la CNSO
					: <KatexInline formula={hessianPsdNeqMin} />.
				</p>
			{/snippet}
			<p>
				Montrez que <KatexInline formula={fyx} /> admet un maximum strict en l'origine (donc que l'origine
				ne peut pas être un minimum de <KatexInline formula={fSym} />), alors que <KatexInline
					formula={fxMy}
				/> admet au contraire un minimum local en l'origine. Que révèle cette contradiction sur ce que
				le Hessien peut ou ne peut pas détecter en <KatexInline formula={originPoint} /> ?
			</p>
		</ExercisePanel>

		<h2 id="coercivite-existence">Coercivité et existence d'un minimum global</h2>

		<p>
			La question ultime, celle que l'on aurait dû poser avant même de chercher à caractériser un
			minimum : <strong>existe-t-il au moins un minimum ?</strong> Rien dans les théorèmes
			précédents ne garantit une réponse positive — l'Exemple d'introduction (<KatexInline
				formula={String.raw`f(x)=x`}
			/>) le montre bien. La coercivité, combinée à un domaine fermé, donne une réponse affirmative
			sous des conditions simples et faciles à vérifier en pratique.
		</p>

		<DefinitionBlock number="1.11" title="Fonction coercive">
			<p>
				Une fonction <KatexInline formula={fOmegaR} /> est <strong>coercive</strong> si :
			</p>
			<KatexBlock formula={coerciveLimit} />
			<p>
				Géométriquement, la fonction « remonte à l'infini » dans <strong>toutes</strong> les
				directions — il ne suffit pas qu'elle augmente le long d'un seul axe, comme le montrera
				l'Exercice 1.3 ci-dessus dans le sens contraire (un axe où elle augmente ne suffit pas à
				garantir un minimum si un autre axe fait diverger la fonction vers <KatexInline
					formula={String.raw`-\infty`}
				/>).
			</p>
		</DefinitionBlock>

		<ExampleBlock number="1.11.1" title="Le paraboloïde : l'exemple canonique de fonction coercive">
			<p>
				La fonction <KatexInline formula={paraboloidCoercive} />. En effet, en coordonnées polaires <KatexInline
					formula={String.raw`x = r\cos\theta, \ y = r\sin\theta`}
				/>, on a <KatexInline formula={String.raw`f = r^2`} /> indépendamment de la direction <KatexInline
					formula={String.raw`\theta`}
				/> — la fonction croît de façon identique dans toutes les directions, ce qui est la signature
				visuelle d'une fonction coercive : ses courbes de niveau sont des ensembles bornés (ici, des cercles)
				qui s'agrandissent uniformément.
			</p>
		</ExampleBlock>

		<InteractiveSection
			number="1.5"
			title="Visualiser la coercivité"
			onInteract={tracker.trackInteraction}
		>
			<CoercivityVisualizer />
		</InteractiveSection>

		<TheoremBlock number="1.12" title="Théorème de Weierstrass généralisé">
			<p>
				Soit <KatexInline formula={fOmegaR} /> continue sur <KatexInline formula={omegaSubsetRn} />.
				Si :
			</p>
			<ol>
				<li><KatexInline formula={omegaSym} /> est <strong>fermé et non vide</strong>, ET</li>
				<li>
					<KatexInline formula={fSym} /> est <strong>coercive</strong> (ou <KatexInline
						formula={omegaSym}
					/> est compact)
				</li>
			</ol>
			<p>Alors <KatexInline formula={fSym} /> admet <strong>au moins un minimum global</strong>.</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Idée de la démonstration :</strong></p>
			<p>
				Le théorème de Weierstrass classique affirme qu'une fonction continue sur un ensemble <strong
					>compact</strong
				>
				(fermé et borné, en dimension finie) atteint effectivement son minimum et son maximum. Le rôle
				de la coercivité est de <strong>fabriquer</strong> un tel ensemble compact à partir d'un
				domaine <KatexInline formula={omegaSym} /> qui n'est peut-être pas borné : on fixe n'importe quel
				point <KatexInline formula={String.raw`x_0 \in \Omega`} />, on pose <KatexInline
					formula={String.raw`c = f(x_0)`}
				/>, et on considère le sous-niveau <KatexInline formula={sublevelSet} />. Ce sous-niveau est
				:
			</p>
			<KatexBlock formula={sublevelClosedBounded} />
			<p>
				Il est non vide (il contient <KatexInline formula={String.raw`x_0`} />), donc <KatexInline
					formula={String.raw`f`}
				/> y atteint son minimum par le théorème de Weierstrass classique. Et ce minimum sur le sous-niveau
				est en fait un minimum sur <KatexInline formula={omegaSym} /> tout entier, puisque tout point
				hors du sous-niveau a une valeur strictement supérieure à <KatexInline
					formula={String.raw`c = f(x_0)`}
				/>, qui est déjà atteinte. ∎
			</p>
		</div>

		<Callout type="intuition" title="Pourquoi la coercivité ?">
			Si <KatexInline formula={fSym} /> n'est pas coercive, elle peut s'échapper vers un infimum sans
			jamais l'atteindre. Exemple : <KatexInline formula={fExpNeg} /> sur les réels tend vers 0 quand
			<KatexInline formula={String.raw`x \to +\infty`} />, mais ne l'atteint jamais — l'infimum <KatexInline
				formula="0"
			/> n'est pas un minimum. La coercivité ferme cette porte en forçant la fonction à augmenter loin
			de l'origine, dans <strong>toutes</strong> les directions simultanément.
		</Callout>

		<Callout type="warning" title="Les deux hypothèses sont indépendantes">
			Le Théorème 1.12 a <strong>deux</strong> hypothèses distinctes, et aucune ne peut être omise.
			Un domaine fermé sans coercivité ne suffit pas (ex : <KatexInline
				formula={String.raw`f(x)=e^{-x}`}
			/> sur <KatexInline formula={String.raw`[0,+\infty)`} />, fermé mais non coercive, sans
			minimum). Une fonction coercive sur un domaine non fermé ne suffit pas non plus (ex : <KatexInline
				formula={String.raw`f(x)=x^2`}
			/> sur <KatexInline formula={String.raw`(0,1)`} />, coercive au sens large mais l'ouverture du
			domaine exclut le vrai minimum en <KatexInline formula={String.raw`x=0`} />). Les deux
			conditions travaillent ensemble.
		</Callout>

		<h2 id="synthese-hierarchie">Synthèse — Hiérarchie des conditions</h2>

		<p>
			Le tableau suivant récapitule les résultats vus dans cette leçon, du plus faible (simple
			élimination de candidats) au plus fort (garantie d'existence globale).
		</p>

		<div class="synthesis-table">
			<table>
				<thead>
					<tr>
						<th>Type</th>
						<th>Hypothèse</th>
						<th>Résultat</th>
						<th>Garantie</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Nécessaire (1er ordre)</td>
						<td><KatexInline formula={fDiffOmegaOpen} /></td>
						<td><KatexInline formula={nablaZero} /></td>
						<td>Critique</td>
					</tr>
					<tr>
						<td>Nécessaire (2ᵉ ordre)</td>
						<td><KatexInline formula={fTwiceDiff} /></td>
						<td><KatexInline formula={nablaZero} />, <KatexInline formula={hessSemiPos} /></td>
						<td>Critique + courbure ≥ 0</td>
					</tr>
					<tr>
						<td>Suffisant (2ᵉ ordre)</td>
						<td><KatexInline formula={fTwiceDiff} /></td>
						<td><KatexInline formula={nablaZero} />, <KatexInline formula={hessDefPos} /></td>
						<td>Minimum local strict</td>
					</tr>
					<tr>
						<td>Convexité + CNO</td>
						<td><KatexInline formula={fConvexDiff} /></td>
						<td><KatexInline formula={nablaIffGlobal} /></td>
						<td>Minimum global</td>
					</tr>
					<tr>
						<td>Coercivité + continuité</td>
						<td><KatexInline formula={fContCoerciveRn} /></td>
						<td>Existence d'un minimum global</td>
						<td>Global garanti</td>
					</tr>
				</tbody>
			</table>
		</div>

		<Callout type="summary" title="Retenir">
			L'ordre logique pour analyser un problème d'optimisation est : (1) chercher les points
			critiques (gradient nul), (2) classifier chaque point avec le Hessien (semi-défini positif ?
			défini positif ?), (3) vérifier la convexité pour garantir l'optimalité globale d'un point
			critique unique, et (4) vérifier la coercivité (et la fermeture du domaine) si l'on veut
			s'assurer, en amont, qu'un minimum existe bel et bien avant même de le chercher. En pratique,
			l'ordre est souvent inversé : on vérifie d'abord (3) et (4) sur la fonction de perte
			<em>avant</em> de lancer un algorithme, précisément pour savoir à quoi s'attendre de sa convergence.
		</Callout>
	</TheorySection>
</PageTemplate>

<style>
	.synthesis-table {
		margin: 1.5rem 0;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	th,
	td {
		padding: 0.6rem 0.8rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	th {
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		background: var(--color-surface-2);
	}

	tbody tr:hover {
		background: var(--color-surface-1, transparent);
	}

	.proof-block {
		padding: 1rem 1.5rem;
		margin: 1rem 0;
		border-left: 3px solid var(--color-positive, #4caf50);
		background-color: color-mix(in srgb, var(--color-positive, #4caf50) 5%, transparent);
		border-radius: 0 6px 6px 0;
		font-size: 0.95em;
		line-height: 1.7;
	}

	.proof-block p {
		margin: 0.4rem 0;
	}
</style>
