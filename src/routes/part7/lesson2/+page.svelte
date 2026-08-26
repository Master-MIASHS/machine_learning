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
	import ConditionalCalibrationDemo from '$lib/components/demos/ConditionalCalibrationDemo.svelte';
	import CalibrationCriterionDemo from '$lib/components/demos/CalibrationCriterionDemo.svelte';
	import CalibratedLossExplorer from '$lib/components/demos/CalibratedLossExplorer.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part7/lesson2');
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
			id: 'question',
			label: 'La question posée',
			description: 'Minimiser un proxy mène-t-il au classifieur de Bayes ?',
			color: 'epistemic'
		},
		{
			id: 'definition-calibration',
			label: 'Définition de la calibration',
			description: 'Convergence du φ-risque ⇒ convergence du risque 0-1',
			color: 'belief'
		},
		{
			id: 'calibration-ponctuelle',
			label: 'La calibration ponctuelle',
			description: 'Cφ(α, η) et le signe du minimiseur',
			color: 'surprise'
		},
		{
			id: 'criterium',
			label: 'Le critère φ′(0) < 0',
			description: 'Théorème 4.1 et sa démonstration',
			color: 'neutral'
		},
		{
			id: 'verification-exemples',
			label: 'Vérification sur les pertes usuelles',
			description: 'Logistique, charnière, exponentielle, Brier',
			color: 'agent'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const calibratedImplication =
		'R_\\phi(f_n) \\xrightarrow[n\\to+\\infty]{} R_\\phi^* \\implies R(h_{f_n}) \\xrightarrow[n\\to+\\infty]{} R^*';

	const totalExpectation =
		'R_\\phi(f) = \\mathbb{E}_X\\big[C_\\varphi\\big(f(X),\\, \\eta(X)\\big)\\big]';
	const conditionalRisk =
		'C_\\varphi(\\alpha, \\eta) = \\eta\\, \\varphi(\\alpha) + (1-\\eta)\\, \\varphi(-\\alpha)';
	const conditionalBayesRisk =
		'C_\\varphi^*(\\eta) = \\inf_{\\alpha \\in \\mathbb R} C_\\varphi(\\alpha, \\eta)';
	const pointwiseAbove =
		'\\eta > 1/2 \\Longleftrightarrow \\arg\\min_{\\alpha \\in \\mathbb R} C_\\varphi(\\alpha, \\eta) \\subset \\mathbb R_+^*';
	const pointwiseBelow =
		'\\eta < 1/2 \\Longleftrightarrow \\arg\\min_{\\alpha \\in \\mathbb R} C_\\varphi(\\alpha, \\eta) \\subset \\mathbb R_-^*';

	const recallPos = '\\arg\\min g \\subset \\mathbb R_+^* \\iff g\'_+(0) < 0';
	const recallNeg = '\\arg\\min g \\subset \\mathbb R_-^* \\iff g\'_-(0) > 0';
	const minimizerCondition = 'g\'_-(\\alpha^*) \\le 0 \\le g\'_+(\\alpha^*)';

	const cphiDerivRight =
		'(C_\\varphi)_+(0)^\\prime = \\eta\\, \\varphi\'_+(0) - (1-\\eta)\\, \\varphi\'_-(0)';
	const cphiDerivLeft =
		'(C_\\varphi)_-(0)^\\prime = \\eta\\, \\varphi\'_-(0) - (1-\\eta)\\, \\varphi\'_+(0)';
	const eqAbove =
		'\\arg\\min_{\\alpha \\in \\mathbb R} C_\\varphi(\\alpha, \\eta) \\subset \\mathbb R_+^* \\iff \\eta\\, \\varphi\'_+(0) - (1-\\eta)\\, \\varphi\'_-(0) < 0';
	const eqBelow =
		'\\arg\\min_{\\alpha \\in \\mathbb R} C_\\varphi(\\alpha, \\eta) \\subset \\mathbb R_-^* \\iff \\eta\\, \\varphi\'_-(0) - (1-\\eta)\\, \\varphi\'_+(0) > 0';
	const limitEta =
		'\\tfrac12\\, \\varphi\'_+(0) - \\tfrac12\\, \\varphi\'_-(0) \\le 0 \\iff \\varphi\'_+(0) \\le \\varphi\'_-(0)';
	const convexityOrder = '\\varphi\'_-(0) \\le \\varphi\'_+(0)';
	const sandwich = '\\varphi\'_-(0) \\le \\varphi\'_+(0) \\le \\varphi\'_-(0)';
	const cphiDerivAtZero = '(C_\\varphi)\'(0) = (2\\eta - 1)\\, \\varphi\'(0)';
	const caseAbove =
		'(C_\\varphi)\'_+(0) = (2\\eta-1)\\, \\varphi\'(0) < 0, \\quad \\text{donc} \\quad \\arg\\min_{\\alpha} C_\\varphi(\\alpha, \\eta) \\subset \\mathbb R_+^*';
	const caseBelow =
		'(C_\\varphi)\'_-(0) = (2\\eta-1)\\, \\varphi\'(0) > 0, \\quad \\text{donc} \\quad \\arg\\min_{\\alpha} C_\\varphi(\\alpha, \\eta) \\subset \\mathbb R_-^*';

	const logisticDeriv = '\\varphi\'(t) = -\\frac{e^{-t}}{1+e^{-t}}';

	const phiDivergesNeg = '\\varphi(t) \\to +\\infty \\;\\;\\text{quand}\\;\\; t \\to -\\infty';
	const cphiDivergesAtEnds =
		'C_\\varphi(\\alpha, \\eta) \\to +\\infty \\;\\;\\text{quand}\\;\\; \\alpha \\to \\pm\\infty';
	const brierGrowth = '\\varphi(t) \\sim t^2 \\;\\;(t \\to +\\infty)';
	const hingeZero = '\\varphi(t) = 0 \\;\\;\\text{dès}\\;\\; t \\ge 1';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Calibration des pertes convexes'}
	subtitle="Quand minimiser une perte proxy garantit d'approcher le classifieur de Bayes"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="question">La question posée</h2>

		<p>
			La leçon précédente a remplacé la perte 0-1 — critère optimal mais NP-difficile à
			minimiser — par des pertes de substitution <KatexInline formula={'\\varphi'} />, et défini le
			<KatexInline formula={'\\varphi'} />-risque <KatexInline formula={'R_\\varphi(f)'} /> et le
			<KatexInline formula={'\\varphi'} />-risque de Bayes <KatexInline formula={'R_\\varphi^*'} />.
			La question fondamentale reste entière : <em>minimiser une perte proxy</em> <KatexInline
				formula={'\\varphi'}
			/>
			<em> conduit-il bien à un classifieur proche du classifieur de Bayes ?</em> Pour les pertes
			convexes, la réponse est gouvernée par une seule quantité : la pente de <KatexInline
				formula={'\\varphi'}
			/> en 0.
		</p>

		<h2 id="definition-calibration">Définition de la calibration</h2>

		<DefinitionBlock title="Perte calibrée">
			<p>
				Une fonction de perte <KatexInline
					formula={'\\varphi : \\mathbb R \\to \\mathbb R_+'}
				/>
				<strong>convexe et positive</strong> est dite <strong>calibrée</strong> si pour tout
				<KatexInline formula={'\\eta \\in [0,1]'} /> et toute suite <KatexInline
					formula={'(f_n)'}
				/>
				de fonctions mesurables :
			</p>
			<KatexBlock formula={calibratedImplication} />
			<p>
				Autrement dit, minimiser le <KatexInline formula={'\\varphi'} />-risque conduit bien à
				minimiser le risque 0-1.
			</p>
		</DefinitionBlock>

		<p>
			L'idée est la suivante : si <KatexInline formula={'\\varphi'} /> est calibrée, on peut travailler
			avec <KatexInline formula={'R_\\varphi'} /> (convexe, différentiable) plutôt qu'avec
			<KatexInline formula={'R'} /> (discontinu), et la convergence dans l'espace des
			<KatexInline formula={'\\varphi'} />-risques entraîne la convergence dans l'espace des risques
			0-1.
		</p>

		<h2 id="calibration-ponctuelle">La calibration ponctuelle</h2>

		<p>
			Par la loi des espérances totales, on peut écrire <KatexInline formula={'R_\\varphi(f)'} />
			terme à terme :
		</p>
		<KatexBlock formula={totalExpectation} />
		<p>
			où <KatexInline formula={'\\eta(x) = P(Y=1 \\mid X=x)'} /> et le <strong>risque
			conditionnel</strong> est :
		</p>
		<KatexBlock formula={conditionalRisk} />
		<p>
			Le <KatexInline formula={'\\varphi'} />-risque de Bayes conditionnel est :
		</p>
		<KatexBlock formula={conditionalBayesRisk} />

		<p>
			Pour les quatre pertes usuelles, <KatexInline formula={phiDivergesNeg} /> ; alors, pour
			<KatexInline formula={'\\eta \\in (0,1)'} />, <KatexInline formula={cphiDivergesAtEnds} /> — le
			terme <KatexInline formula={'\\varphi(-\\alpha)'} /> explose quand <KatexInline
				formula={'\\alpha \\to +\\infty'}
			/>
			, et le terme <KatexInline formula={'\\varphi(\\alpha)'} /> quand <KatexInline
				formula={'\\alpha \\to -\\infty'} /> — : l'infimum de la définition précédente est donc
			atteint en un <KatexInline formula={'\\alpha^*'} /> fini, ce qui rend le minimiseur ponctuel bien
			défini.
		</p>

		<DefinitionBlock title="Calibration ponctuelle">
			<p>
				<KatexInline formula={'\\varphi'} /> est <strong>ponctuellement calibrée</strong> en
				<KatexInline formula={'\\eta'} /> si tout minimiseur <KatexInline
					formula={'\\alpha^*(\\eta)'}
				/>
				de <KatexInline formula={'\\alpha \\mapsto C_\\varphi(\\alpha, \\eta)'} /> vérifie :
			</p>
			<KatexBlock formula={pointwiseAbove} />
			<KatexBlock formula={pointwiseBelow} />
			<p>
				c'est-à-dire que le signe du prédicteur optimal pour <KatexInline
					formula={'\\varphi'}
				/>
				coïncide avec celui du classifieur de Bayes.
			</p>
		</DefinitionBlock>

		<InteractiveSection
			number="2.1"
			title="Le signe du minimiseur suit-il η ?"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> La courbe <KatexInline
					formula={String.raw`C_\varphi(\alpha, \eta)`}
				/>
				est convexe en <KatexInline formula={'\\alpha'} />, et son minimiseur <KatexInline
					formula={'\\alpha^*'}
				/>
				est marqué. Déplacez <KatexInline formula={'\\eta'} /> : pour une perte calibrée, le signe de
				<KatexInline formula={'\\alpha^*'} /> suit systématiquement celui de <KatexInline
					formula={'\\eta - 1/2'}
				/>
				; la perte 0-1, elle, fait sauter <KatexInline formula={'\\alpha^*'} /> de façon discontinue
				et ne s'optimise pas.
			</p>
			<ConditionalCalibrationDemo />
		</InteractiveSection>

		<h2 id="criterium">Le critère φ′(0) &lt; 0</h2>

		<p>
			La bonne nouvelle, c'est que la condition de calibration est <strong>locale</strong> : pour une
			perte convexe, elle ne dépend que du comportement de <KatexInline formula={'\\varphi'} /> au
			voisinage de 0.
		</p>

		<TheoremBlock title="Théorème 4.1 (Bartlett, Jordan, McAuliffe, 2006)">
			<p>
				Soit <KatexInline formula={'\\varphi : \\mathbb R \\to \\mathbb R_+'} /> convexe et positive.
				Alors <KatexInline formula={'\\varphi'} /> est calibrée si et seulement si
				<KatexInline formula={'\\varphi'} /> est différentiable en 0 et <KatexInline
					formula={'\\varphi\'(0) < 0'}
				/>.
			</p>
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				On étudie la calibration ponctuelle en <KatexInline formula={'\\eta'} />. Puisque
				<KatexInline formula={'\\varphi'} /> est convexe, <KatexInline
					formula={'C_\\varphi(\\cdot, \\eta)'}
				/>
				est convexe pour tout <KatexInline formula={'\\eta \\in [0,1]'} />. On caractérise la
				localisation des minimiseurs via les dérivées à gauche et à droite en 0.
			</p>
		</div>

		<Callout type="note" title="Rappel : localisation des minimiseurs d'une fonction convexe">
			<p>
				Pour une fonction convexe <KatexInline formula={'g : \\mathbb R \\to \\mathbb R'} />, on a :
			</p>
			<KatexBlock formula={recallPos} />
			<KatexBlock formula={recallNeg} />
			<p>
				En effet, par convexité, <KatexInline formula={'g\'_+'} /> est croissante et
				<KatexInline formula={'g\'_-(t) \\le g\'_+(t)'} /> pour tout <KatexInline
					formula={'t'}
				/>. Un minimiseur <KatexInline formula={'\\alpha^*'} /> vérifie <KatexInline
					formula={minimizerCondition}
				/>. Donc <KatexInline formula={'\\alpha^* > 0'} /> si et seulement si
				<KatexInline formula={'g\'_+(0) < 0'} /> (sinon 0 serait déjà minimiseur), et
				<KatexInline formula={'\\alpha^* < 0'} /> si et seulement si
				<KatexInline formula={'g\'_-(0) > 0'} />.
			</p>
		</Callout>

		<div class="proof-block">
			<p>
				On calcule les dérivées à gauche et à droite de <KatexInline
					formula={'C_\\varphi(\\cdot, \\eta)'}
				/>
				en 0. Puisque <KatexInline formula={'\\varphi'} /> est convexe, elle admet des dérivées à
				gauche et à droite en tout point, et en particulier en 0. Par la règle de dérivation de
				<KatexInline formula={'\\alpha \\mapsto \\varphi(-\\alpha)'} />, dont les dérivées à gauche et
				à droite en 0 sont <KatexInline formula={'-\\varphi\'_+(0)'} /> et
				<KatexInline formula={'-\\varphi\'_-(0)'} /> respectivement :
			</p>
			<KatexBlock formula={cphiDerivRight} />
			<KatexBlock formula={cphiDerivLeft} />
			<p>En combinant avec le rappel, on obtient les équivalences :</p>
			<KatexBlock formula={eqAbove} />
			<KatexBlock formula={eqBelow} />
		</div>

		<div class="proof-block">
			<p>
				<strong>(⇒) Si</strong> <KatexInline formula={'\\varphi'} />
				<strong>est calibrée, alors</strong> <KatexInline formula={'\\varphi'} />
				<strong>est différentiable en 0 et</strong> <KatexInline
					formula={'\\varphi\'(0) < 0'}
				/>
				<strong>.</strong>
			</p>
			<p>
				Supposons <KatexInline formula={'\\varphi'} /> calibrée. Pour tout <KatexInline
					formula={'\\eta > 1/2'}
				/>, la condition de calibration impose <KatexInline
					formula={'\\arg\\min C_\\varphi(\\cdot, \\eta) \\subset \\mathbb R_+^*'}
				/>, soit <KatexInline
					formula={'\\eta\\, \\varphi\'_+(0) - (1-\\eta)\\, \\varphi\'_-(0) < 0'}
				/>. Cette inégalité est stricte pour tout <KatexInline formula={'\\eta > 1/2'} />. En faisant
				tendre <KatexInline formula={'\\eta \\to 1/2^+'} />, on obtient à la limite :
			</p>
			<KatexBlock formula={limitEta} />
			<p>
				Or la convexité de <KatexInline formula={'\\varphi'} /> implique toujours
				<KatexInline formula={convexityOrder} />. En combinant :
			</p>
			<KatexBlock formula={sandwich} />
			<p>
				donc <KatexInline formula={'\\varphi\'_+(0) = \\varphi\'_-(0)'} /> :
				<KatexInline formula={'\\varphi'} /> est <em>différentiable en 0</em>, et on note
				<KatexInline formula={'\\varphi\'(0) = \\varphi\'_+(0) = \\varphi\'_-(0)'} />.
			</p>
			<p>
				Les équivalences deviennent alors <KatexInline formula={cphiDerivAtZero} />. La condition de
				calibration pour <KatexInline formula={'\\eta > 1/2'} /> impose
				<KatexInline formula={'(2\\eta-1)\\, \\varphi\'(0) < 0'} />, soit
				<KatexInline formula={'\\varphi\'(0) < 0'} /> puisque <KatexInline
					formula={'2\\eta - 1 > 0'}
				/>.
			</p>
		</div>

		<div class="proof-block">
			<p>
				<strong>(⇐) Si</strong> <KatexInline formula={'\\varphi'} />
				<strong>est différentiable en 0 et</strong> <KatexInline formula={'\\varphi\'(0) < 0'} />
				<strong>, alors</strong> <KatexInline formula={'\\varphi'} />
				<strong>est calibrée.</strong>
			</p>
			<p>
				Supposons <KatexInline formula={'\\varphi\'(0) < 0'} />. Alors
				<KatexInline formula={cphiDerivAtZero} /> :
			</p>
			<ul>
				<li>
					Si <KatexInline formula={'\\eta > 1/2'} /> : <KatexInline
						formula={'(2\\eta-1) > 0'}
					/>
					et <KatexInline formula={'\\varphi\'(0) < 0'} />, donc <KatexInline
						formula={caseAbove}
					/>
					✓
				</li>
				<li>
					Si <KatexInline formula={'\\eta < 1/2'} /> : <KatexInline
						formula={'(2\\eta-1) < 0'}
					/>
					et <KatexInline formula={'\\varphi\'(0) < 0'} />, donc <KatexInline
						formula={caseBelow}
					/>
					✓
				</li>
			</ul>
			<p>
				Dans les deux cas, le minimiseur de <KatexInline
					formula={'C_\\varphi(\\cdot, \\eta)'}
				/>
				est du bon signe : <KatexInline formula={'\\varphi'} /> est ponctuellement calibrée pour tout
				<KatexInline formula={'\\eta \\neq 1/2'} />, donc calibrée au sens de la définition. ∎
			</p>
		</div>

		<InteractiveSection
			number="2.2"
			title="La face perte du critère : φ et sa pente en 0"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> La définition de la calibration est énoncée en termes du
				minimiseur de <KatexInline formula={String.raw`C_\varphi(\alpha, \eta)`} />, mais le
				théorème montre qu'elle ne dépend que de la perte <KatexInline formula={'\\varphi'} />
				elle-même : sa pente en 0. Sélectionnez chaque perte et ramenez <KatexInline
					formula={'t'}
				/>
				vers 0 : la valeur de <KatexInline formula={"\\varphi'(0)"} /> affichée est négative pour les
				quatre (−1/2, −1, −1, −2) — c'est la face « perte » de l'équivalence, en contraste avec le
				widget 2.1, qui montrait <KatexInline formula={String.raw`C_\varphi`} />. Le théorème est
				précisément le pont entre les deux objets.
			</p>
			<CalibratedLossExplorer />
		</InteractiveSection>

		<h2 id="verification-exemples">Vérification sur les pertes usuelles</h2>

		<ul>
			<li>
				<strong>Logistique</strong> : <KatexInline formula={'\\varphi(t) = \\log(1 + e^{-t})'} />,
				<KatexInline formula={logisticDeriv} />, <KatexInline
					formula={'\\varphi\'(0) = -1/2 < 0'}
				/>. ✓
			</li>
			<li>
				<strong>Charnière</strong> : <KatexInline formula={'\\varphi(t) = \\max(0, 1-t)'} />,
				<KatexInline formula={'\\varphi\'(0^-) = -1 < 0'} />. ✓ — attention : le point d'angle de la
				charnière est en <KatexInline formula={'t = 1'} />, <em>pas</em> en 0 ; elle est donc
				différentiable en 0, et le critère s'applique sans ambiguïté.
			</li>
			<li>
				<strong>Exponentielle</strong> : <KatexInline formula={'\\varphi(t) = e^{-t}'} />,
				<KatexInline formula={'\\varphi\'(0) = -1 < 0'} />. ✓
			</li>
			<li>
				<strong>Carrée</strong> : <KatexInline formula={'\\varphi(t) = (1-t)^2'} />,
				<KatexInline formula={'\\varphi\'(0) = -2 < 0'} />. ✓
			</li>
		</ul>

		<p>
			À noter : la Brier est la seule des quatre qui ne s'annule pas quand
			<KatexInline formula={'t \\to +\\infty'} /> — elle croît comme <KatexInline
				formula={brierGrowth}
			/>
			et pénalise donc aussi les grandes marges correctes (défaut connu du moindres carrés), tandis que
			la charnière vaut <KatexInline formula={hingeZero} />.
		</p>

		<p>
			Les quatre pertes de substitution de la leçon précédente sont donc calibrées : minimiser leur
			<KatexInline formula={'\\varphi'} />-risque empirique jusqu'à sa borne inférieure conduit au
			classifieur de Bayes. La leçon suivante quantifiera ce qui se passe quand on ne descend que
			jusqu'à <em>près</em> de la borne : la décomposition estimation / calibration / approximation.
		</p>

		<InteractiveSection
			number="2.3"
			title="Calibrée ou non : le signe du minimiseur en parallèle"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> À gauche, une perte calibrée ; à droite, un contre-exemple
				non calibrée, sous le même <KatexInline formula={'\\eta'} />. Avec la marge carrée
				<KatexInline formula={'t^2'} />, <KatexInline formula={'\\varphi\'(0) = 0'} /> et
				<KatexInline formula={'\\alpha^*'} /> reste collé à 0 quelle que soit <KatexInline
					formula={'\\eta'}
				/> ; avec la marge décalée <KatexInline formula={'(1+t)^2'} />,
				<KatexInline formula={'\\varphi\'(0) > 0'} /> et <KatexInline formula={'\\alpha^*'} /> est du
				mauvais signe des deux côtés de <KatexInline formula={'\\eta = 1/2'} />. Le critère
				<KatexInline formula={'\\varphi\'(0) < 0'} /> n'est pas une curiosité formelle : c'est
				précisément ce qui sépare les deux panneaux.
			</p>
			<CalibrationCriterionDemo />
		</InteractiveSection>

		<Callout type="summary" title="Retenir">
			Une perte convexe positive <KatexInline formula={'\\varphi'} /> est calibrée si et seulement
			si elle est différentiable en 0 avec <KatexInline formula={'\\varphi\'(0) < 0'} /> (Théorème
			4.1). La preuve réduit tout au signe du minimiseur du risque conditionnel
			<KatexInline formula={String.raw`C_\varphi(\alpha, \eta)`} /> en <KatexInline
				formula={String.raw`\eta`}
			/>, lequel est gouverné par la pente <KatexInline formula={String.raw`\varphi'(0)`} /> via
			<KatexInline formula={String.raw`(C_\varphi)'(0) = (2\eta - 1)\, \varphi'(0)`} />. Logistique
			(<KatexInline formula={'-1/2'} />), charnière (<KatexInline formula={'-1'} />), exponentielle
			(<KatexInline formula={'-1'} />) et Brier (<KatexInline formula={'-2'} />) sont toutes
			calibrées — la charnière malgré son point d'angle, qui est en 1 et non en 0.
		</Callout>
	</TheorySection>
	<Bibliography>
		<BibElement
			authors={['Bartlett, P. L.', 'Jordan, M. I.', 'McAuliffe, J.']}
			year={2006}
			title="Convexity, Classification, and Risk Bounds"
			journal="Journal of the American Statistical Association, 101(473), 138-156."
		/>
	</Bibliography>
</PageTemplate>

<style>
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

	.proof-block ul {
		margin: 0.4rem 0;
		padding-left: 1.25rem;
	}

	.demo-guide {
		margin: 0.75rem 0;
		padding: 0.8rem 1rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-epistemic, #4f7cac) 8%, transparent);
		line-height: 1.65;
	}
</style>
