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
	import FiniteClassGeneralizationDemo from '$lib/components/demos/FiniteClassGeneralizationDemo.svelte';
	import UniformConvergenceDemo from '$lib/components/demos/UniformConvergenceDemo.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import Quiz, { type QuizItem } from '$lib/components/demos/Quiz.svelte';

	const meta = getPageByPath('/part8/lesson2');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question:
				'Selon le Théorème 3.1 (cas séparable, |H| < +∞), sous réalisabilité, quelle borne obtient-on pour le minimiseur du risque empirique ?',
			options: [
				'P(R(ĥ) > ε) ≤ 2|H| e^{-2nε²}, pour tout ε > 0.',
				'R(ĥ) ≤ log(|H|/δ)/n, de façon déterministe, sans aucune probabilité.',
				'P(R(ĥ) > ε) ≤ |H| e^{-nε}, pour tout ε > 0 ; en particulier n ≥ log(|H|/δ)/ε suffit pour avoir confiance 1 - δ.',
				'P(R(ĥ) > ε) ≤ e^{-nε}/|H|, pour tout ε > 0.'
			],
			answerIndex: 2,
			explanation:
				"Théorème 3.1 : sous réalisabilité, le minimiseur du risque empirique a un risque empirique nul ; l'événement d'échec est inclus dans l'union sur les hypothèses mauvaises de l'événement où elles sont trompées par l'échantillon, et l'union bound donne |H| e^{-nε} (démonstration en quatre étapes : réduction aux échantillons trompeurs, union bound, borne par hypothèse, conclusion)."
		},
		{
			question:
				"Selon le Théorème 3.2 (cas non séparable, |H| < +∞), qu'a-t-on avec probabilité 1 - δ ?",
			options: [
				'R(ĥ) ≤ R_Sn(ĥ) + sqrt((log|H| + log(2/δ)) / (2n)), la borne étant uniforme sur la classe.',
				'R(ĥ) ≤ log(|H|/δ)/n, avec la même vitesse que dans le cas séparable.',
				'R(ĥ) ≤ 2 R_Sn(ĥ), sans aucune dépendance à |H|.',
				'sup_{h∈H} |R(h) - R_Sn(h)| ≤ log(1/δ)/n, sans le terme log|H|.'
			],
			answerIndex: 0,
			explanation:
				"Théorème 3.2 : Hoeffding appliqué à un h fixé donne P(|R_Sn(h) - R(h)| ≥ t) ≤ 2 e^{-2nt²} ; l'union bound sur H (P(∃ h, |écart| ≥ t) ≤ 2|H| e^{-2nt²}) et la calibration δ = 2|H| e^{-2nt²} donnent l'écart uniforme sqrt((log|H| + log(2/δ))/(2n)), qui s'applique à ĥ bien qu'il soit une fonction aléatoire de l'échantillon."
		},
		{
			question:
				'Pourquoi le cas séparable converge-t-il plus vite (en 1/n) que le cas non séparable (en 1/√n), selon la leçon ?',
			options: [
				"Parce que l'union bound est plus efficace quand |H| est petit.",
				"Parce que la réalisabilité permet un argument purement combinatoire sur les échantillons trompeurs — une hypothèse mauvaise est trompée ou non, c'est binaire — et sans elle on doit se rabattre sur une concentration probabiliste plus générale mais plus lente.",
				"Parce que l'inégalité de Hoeffding ne s'applique pas aux variables de Bernoulli.",
				'Parce que dans le cas non séparable, le risque empirique est toujours nul.'
			],
			answerIndex: 1,
			explanation:
				"La section « Comparer les deux régimes » explique : sans classifieur parfait dans H, il n'y a plus le critère du « risque empirique nul », et on perd l'argument combinatoire des échantillons trompeurs (binaire : trompé ou non) au profit d'une concentration probabiliste plus générale mais plus lente à converger."
		},
		{
			question:
				"Dans le cas séparable, qu'est-ce qui garantit que le minimiseur du risque empirique ĥ a un risque empirique nul ?",
			options: [
				"Le fait que l'échantillon soit suffisamment grand.",
				'Le fait que la perte 0-1 soit continue.',
				'Le fait que toutes les hypothèses de H ne fassent aucune erreur sur les données.',
				'La réalisabilité : h* ∈ H vérifie R_Sn(h*) = 0, et ĥ, qui minimise R_Sn sur H, a donc R_Sn(ĥ) = 0.'
			],
			answerIndex: 3,
			explanation:
				"Étape 1 de la démonstration du Théorème 3.1 : par réalisabilité, R_Sn(h*) = 0 toujours, donc aussi R_Sn(ĥ) = 0 puisque c'est le minimiseur — c'est ce qui rend possible la réduction aux « échantillons trompeurs »."
		},
		{
			question:
				'Que représente le terme log|H| dans les bornes, et quelle mise en garde la leçon y attache-t-elle ?',
			options: [
				"Le biais de la classe H, qui s'annule quand n grandit.",
				"Le nombre d'échantillons trompeurs effectivement observés dans l'échantillon.",
				"Le prix de la recherche dans H : doubler |H| ne coûte qu'une observation supplémentaire — mais en pratique, la sélection de paramètres fait croître |H| de façon exponentielle, ce que le coût logarithmique masque.",
				'La variance du risque empirique, qui ne dépend que de δ.'
			],
			answerIndex: 2,
			explanation:
				"Le cartouche « Un coût seulement logarithmique — mais attention » l'énonce : log|H| est le prix de la recherche dans la classe (doubler |H| ne coûte qu'une observation supplémentaire à ε et δ fixés), mais cette économie est trompeuse en pratique, car une grille d'hyperparamètres fait croître |H| de façon exponentielle en amont."
		}
	];
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
			label: 'Introduction',
			description: "Passer d'un classifieur fixé à toute une classe H",
			color: 'epistemic'
		},
		{
			id: 'cas-separable',
			label: 'Cas séparable',
			description: 'Théorème 3.1 — union bound, échantillons trompeurs, borne en O(log|H|/n)',
			color: 'belief'
		},
		{
			id: 'cas-non-separable',
			label: 'Cas non séparable',
			description: 'Rappel de Hoeffding, Théorème 3.2 — borne uniforme sur H',
			color: 'surprise'
		},
		{
			id: 'comparaison-vitesses',
			label: 'Comparer les deux régimes',
			description: 'O(1/n) contre O(1/√n) — pourquoi la différence de vitesse',
			color: 'neutral'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const supGap = '\\sup_{h\\in\\mathcal H} |R_n(h) - R(h)|';
	const ermDef = '\\hat h_{\\mathcal S_n} = \\arg\\min_{h\\in\\mathcal H} R_{\\mathcal S_n}(h)';
	const hypothesisClass = '\\mathcal H';
	const risk = 'R(h)';
	const empiricalRisk = 'R_{\\mathcal S_n}(h)';
	const sample = '\\mathcal S_n';
	const delta = '\\delta';
	const confidence = '1-\\delta';

	// Cas séparable
	const realizability = '\\exists\\, h^*\\in\\mathcal H,\\ R(h^*)=0';
	const separableStatement =
		'\\mathbb{P}^n\\big(R(\\hat h_{\\mathcal S_n}) > \\varepsilon\\big) \\le |\\mathcal H|\\, e^{-n\\varepsilon}';
	const separableSampleSize = 'n \\ge \\frac{\\log(|\\mathcal H|/\\delta)}{\\varepsilon}';
	const separableCorollary =
		'R(\\hat h_{\\mathcal S_n}) \\le \\frac{\\log(|\\mathcal H|/\\delta)}{n}';

	const hBadDef = '\\mathcal H_{\\text{bad}} = \\{h\\in\\mathcal H : R(h) > \\varepsilon\\}';
	const mDef =
		'\\mathcal M = \\{\\mathcal S_n : \\exists\\, h\\in\\mathcal H_{\\text{bad}},\\ R_{\\mathcal S_n}(h)=0\\}';
	const inclusionEvent =
		'\\{R(\\hat h_{\\mathcal S_n}) > \\varepsilon\\} \\subset \\mathcal M \\implies \\mathbb{P}^n(R(\\hat h_{\\mathcal S_n})>\\varepsilon) \\le \\mathbb{P}^n(\\mathcal M)';
	const unionBoundStep =
		'\\mathbb{P}^n(\\mathcal M) \\le \\sum_{h\\in\\mathcal H_{\\text{bad}}} \\mathbb{P}^n\\big(R_{\\mathcal S_n}(h)=0\\big)';
	const perHypothesisBound =
		'\\mathbb{P}^n\\big(R_{\\mathcal S_n}(h)=0\\big) = (1-R(h))^n < (1-\\varepsilon)^n \\le e^{-n\\varepsilon}';
	const finalSum =
		'\\mathbb{P}^n(R(\\hat h_{\\mathcal S_n})>\\varepsilon) \\le \\sum_{h\\in\\mathcal H_{\\text{bad}}} e^{-n\\varepsilon} \\le |\\mathcal H|\\, e^{-n\\varepsilon}';

	// Cas non séparable
	const hoeffdingRecall =
		'Z_i \\in [0,1] \\text{ i.i.d.} \\implies \\mathbb{P}\\Big(\\Big|\\frac1n\\sum_{i=1}^n Z_i - \\mathbb{E}[Z_1]\\Big| \\ge t\\Big) \\le 2e^{-2nt^2}';
	const hoeffdingOnRisk =
		'\\mathbb{P}^n\\big(|R_{\\mathcal S_n}(h) - R(h)| \\ge t\\big) \\le 2e^{-2nt^2} \\quad (h \\text{ fixé})';

	const uniformStatement =
		'\\mathbb{P}^n\\Big(\\forall h\\in\\mathcal H,\\ |R(h)-R_{\\mathcal S_n}(h)| \\le \\sqrt{\\tfrac{\\log|\\mathcal H|+\\log(2/\\delta)}{2n}}\\Big) \\ge 1-\\delta';
	const uniformRiskBound =
		'R(\\hat h_{\\mathcal S_n}) \\le R_{\\mathcal S_n}(\\hat h_{\\mathcal S_n}) + \\sqrt{\\frac{\\log|\\mathcal H|+\\log(2/\\delta)}{2n}}';

	const unionOverH =
		'\\mathbb{P}^n\\big(\\exists h\\in\\mathcal H,\\ |R_{\\mathcal S_n}(h)-R(h)|\\ge t\\big) \\le 2|\\mathcal H|\\,e^{-2nt^2}';
	const solveForT =
		'\\delta = 2|\\mathcal H|\\,e^{-2nt^2} \\iff t = \\sqrt{\\frac{\\log|\\mathcal H| + \\log(2/\\delta)}{2n}}';
	const finalDecomp =
		'R(\\hat h_{\\mathcal S_n}) = \\underbrace{R(\\hat h_{\\mathcal S_n}) - R_{\\mathcal S_n}(\\hat h_{\\mathcal S_n})}_{\\le\\ t \\text{ (borne uniforme)}} + R_{\\mathcal S_n}(\\hat h_{\\mathcal S_n})';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Généralisation pour une classe finie'}
	subtitle="De l'union bound au cas non séparable : borner l'erreur du classifieur appris, pas seulement d'un classifieur fixé"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			La leçon précédente s'est arrêtée sur une limitation précise : la borne de Tchebychev contrôle <KatexInline
				formula={empiricalRisk}
			/> pour un <KatexInline formula={String.raw`h\in\mathcal{H}`} /> fixé à l'avance, mais rien ne garantit
			qu'elle s'applique au classifieur
			<KatexInline formula={ermDef} /> effectivement choisi par minimisation du risque empirique — puisque
			<KatexInline formula={ermDef} /> dépend précisément des données sur lesquelles on voudrait le contrôler.
			Il faut donc une garantie
			<strong>uniforme</strong>, portant sur <KatexInline formula={supGap} /> plutôt que sur l'écart d'un
			seul <KatexInline formula={risk} />. On commence par le cas le plus simple :
			<KatexInline formula={hypothesisClass} /> fini.
		</p>

		<h2 id="cas-separable">Cas séparable</h2>

		<DefinitionBlock title="Réalisabilité">
			<p>
				On dit que <KatexInline formula={hypothesisClass} /> est <strong>réalisable</strong> (ou que
				le problème est <strong>séparable</strong>) s'il existe <KatexInline
					formula={'h^*\\in\\mathcal H'}
				/> tel que <KatexInline formula={realizability} /> : un classifieur sans erreur appartient à
				<KatexInline formula={hypothesisClass} />.
			</p>
		</DefinitionBlock>

		<p>
			Dans ce cas, on n'a pas besoin d'inégalité de concentration : un argument purement
			combinatoire suffit.
		</p>

		<TheoremBlock number="3.1" title="Cas séparable, |H| < +∞">
			<p>
				On suppose <KatexInline formula={realizability} />. Soit <KatexInline formula={ermDef} />.
				Alors pour tout <KatexInline formula={'\\varepsilon>0'} /> :
			</p>
			<KatexBlock formula={separableStatement} />
			<p>
				En particulier, pour une confiance <KatexInline formula={confidence} />, il suffit que :
			</p>
			<KatexBlock formula={separableSampleSize} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				<strong>Étape 1 — Réduction aux échantillons trompeurs.</strong> Par réalisabilité,
				<KatexInline formula={'R_{\\mathcal S_n}(h^*)=0'} /> toujours, donc
				<KatexInline formula={'R_{\\mathcal S_n}(\\hat h_{\\mathcal S_n})=0'} /> aussi (c'est le minimiseur).
				On introduit <KatexInline formula={hBadDef} /> et l'ensemble des « échantillons trompeurs » <KatexInline
					formula={mDef}
				/>. Si
				<KatexInline formula={'R(\\hat h_{\\mathcal S_n})>\\varepsilon'} />, alors <KatexInline
					formula={'R_{\\mathcal S_n}(\\hat h_{\\mathcal S_n})=0'}
				/> a pourtant un risque empirique nul — l'échantillon a « trompé » l'algorithme :
			</p>
			<KatexBlock formula={inclusionEvent} />
			<p>
				<strong>Étape 2 — Union bound.</strong>
				<KatexInline formula={mDef} /> se réécrit comme une union sur <KatexInline
					formula={hBadDef}
				/>, d'où :
			</p>
			<KatexBlock formula={unionBoundStep} />
			<p>
				<strong>Étape 3 — Borne par hypothèse.</strong> Pour <KatexInline
					formula={'h\\in\\mathcal H_{\\mathrm{bad}}'}
				/> (donc
				<KatexInline formula={'R(h)>\\varepsilon'} />), les observations étant i.i.d. :
			</p>
			<KatexBlock formula={perHypothesisBound} />
			<p><strong>Étape 4 — Conclusion.</strong> En combinant :</p>
			<KatexBlock formula={finalSum} />
			<p>
				En posant <KatexInline formula={'|\\mathcal H|e^{-n\\varepsilon}=\\delta'} /> et en résolvant
				pour <KatexInline formula={'n'} />, on obtient la condition sur la taille d'échantillon. ∎
			</p>
		</div>

		<p>
			Un corollaire immédiat reformule cette garantie directement comme une borne sur le risque,
			plutôt que sur la probabilité de la dépasser :
		</p>
		<Callout type="intuition" title="Corollaire">
			Avec probabilité <KatexInline formula={confidence} /> :
			<KatexBlock formula={separableCorollary} />
		</Callout>

		<InteractiveSection
			number="2.1"
			title="Hypothèses trompeuses et union bound"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>Comment lire la démo.</strong> La bande représente les hypothèses de <KatexInline
					formula={hypothesisClass}
				/>. L'hypothèse bleue est parfaite ; une case orange est une hypothèse mauvaise qui n'a
				pourtant fait aucune erreur sur cet échantillon. Faites varier <KatexInline formula={'n'} /> et
				<KatexInline formula={'|\\mathcal H|'} /> : cherchez le moment où les cases orange deviennent
				rares, puis comparez la fréquence observée à <KatexInline
					formula={'|\\mathcal H|e^{-n\\varepsilon}'}
				/>.
			</p>
			<FiniteClassGeneralizationDemo />
			<p class="demo-takeaway">
				<strong>À retenir :</strong> l'ERM échoue ici uniquement lorsqu'une hypothèse mauvaise passe entre
				les mailles de l'échantillon. L'union bound additionne les probabilités de ces échecs possibles.
			</p>
		</InteractiveSection>

		<Callout type="insight" title="Un coût seulement logarithmique — mais attention">
			Le terme <KatexInline formula={'\\log|\\mathcal H|'} /> est le prix de la recherche dans
			<KatexInline formula={hypothesisClass} /> : doubler la taille de la classe ne coûte qu'une observation
			supplémentaire, à <KatexInline formula={'\\varepsilon'} /> et <KatexInline formula={delta} /> fixés.
			Mais cette économie est trompeuse en pratique : dès qu'on fait de la sélection de paramètres (une
			grille d'hyperparamètres, par exemple), <KatexInline formula={'|\\mathcal H|'} /> croît généralement
			de façon <strong>exponentielle</strong> avec le nombre de paramètres — le coût logarithmique masque
			une explosion combinatoire en amont.
		</Callout>

		<h2 id="cas-non-separable">Cas non séparable</h2>

		<p>
			Sans hypothèse de réalisabilité, <KatexInline formula={hypothesisClass} /> peut avoir un risque
			empirique non nul, et l'argument précédent s'effondre : il n'y a plus d'échantillons « trompeurs
			» au sens strict, puisque même le meilleur classifieur disponible peut légitimement se tromper.
			Il faut un outil de concentration quantifiant l'écart <KatexInline
				formula={'|R_{\\mathcal S_n}(h)-R(h)|'}
			/> pour un <KatexInline formula={'h'} /> quelconque.
		</p>

		<Callout type="intuition" title="Rappel : inégalité de Hoeffding">
			<p>
				Déjà utilisée numériquement dans la démonstration interactive de la leçon précédente, voici
				son énoncé formel. Pour <KatexInline formula={'Z_1,\\ldots,Z_n'} /> indépendantes et <KatexInline
					formula={'Z_i\\in[0,1]'}
				/> :
			</p>
			<KatexBlock formula={hoeffdingRecall} />
			<p>
				Appliquée au risque empirique d'un <KatexInline formula={'h'} /> fixé (<KatexInline
					formula={empiricalRisk}
				/>) :
			</p>
			<KatexBlock formula={hoeffdingOnRisk} />
			<p>
				Comme la borne de Tchebychev de la leçon précédente, celle-ci ne vaut que pour
				<KatexInline formula={'h'} /> fixé.
			</p>
		</Callout>

		<TheoremBlock number="3.2" title="Cas non séparable, |H| < +∞">
			<p>
				Soit <KatexInline formula={hypothesisClass} /> fini et <KatexInline formula={ermDef} />.
				Pour tout <KatexInline formula={'\\delta\\in(0,1)'} />, avec probabilité <KatexInline
					formula={confidence}
				/> :
			</p>
			<KatexBlock formula={uniformStatement} />
			<p>En particulier :</p>
			<KatexBlock formula={uniformRiskBound} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>
				<strong>Étape 1 — Concentration pour <KatexInline formula={'h'} /> fixé.</strong> C'est exactement
				le rappel de Hoeffding ci-dessus.
			</p>
			<p>
				<strong>Étape 2 — Passage à l'uniforme par union bound.</strong> On contrôle non plus un
				<KatexInline formula={'h'} /> fixé mais le pire cas sur <KatexInline
					formula={hypothesisClass}
				/>
				:
			</p>
			<KatexBlock formula={unionOverH} />
			<p>
				<strong>Étape 3 — Calibration en <KatexInline formula={'\\delta'} />.</strong> On pose
				<KatexInline formula={'2|\\mathcal H|e^{-2nt^2}=\\delta'} /> et on résout pour <KatexInline
					formula={'t'}
				/> :
			</p>
			<KatexBlock formula={solveForT} />
			<p>
				<strong>Étape 4 — Application à <KatexInline formula={ermDef} />.</strong> La borne de
				l'étape 3 est <em>uniforme</em> : elle tient simultanément pour tout <KatexInline
					formula={hypothesisClass}
				/>, y compris pour <KatexInline formula={'\\hat h_{\\mathcal S_n}'} /> lui-même, bien qu'il soit
				une fonction aléatoire de <KatexInline formula={sample} /> :
			</p>
			<KatexBlock formula={finalDecomp} />
			<p>d'où le résultat annoncé. ∎</p>
		</div>

		<InteractiveSection
			number="2.2"
			title="h fixé contre ĥ choisie après coup"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>Expérience guidée.</strong> Chaque point compare le risque vrai et le risque
				empirique d'une hypothèse. Le point bleu est choisi avant l'échantillon ; le point orange
				est l'ERM, choisi après avoir vu les données. Augmentez <KatexInline
					formula={'|\\mathcal H|'}
				/> pour amplifier le biais de sélection, puis augmentez <KatexInline formula={'n'} /> pour resserrer
				les bandes. La bande étroite est individuelle ; la bande large paie le fait de vouloir couvrir
				toute la classe.
			</p>
			<UniformConvergenceDemo />
			<p class="demo-takeaway">
				<strong>Question-test :</strong> pourquoi ne peut-on pas appliquer directement la bande bleue
				au point orange ? Parce que le choix de ce point dépend précisément des fluctuations de l'échantillon.
			</p>
		</InteractiveSection>

		<h2 id="comparaison-vitesses">Comparer les deux régimes</h2>

		<p>
			Les deux résultats de cette leçon ont des vitesses de convergence différentes, et cet écart
			n'est pas anodin :
		</p>
		<ul>
			<li>
				<strong>Cas séparable</strong> : le risque décroît en <KatexInline formula={'1/n'} />.
			</li>
			<li>
				<strong>Cas non séparable</strong> : la borne décroît seulement en
				<KatexInline formula={'1/\\sqrt n'} />.
			</li>
		</ul>
		<p>
			C'est précisément le prix de l'absence d'hypothèse de réalisabilité : sans un classifieur
			parfait dans <KatexInline formula={hypothesisClass} />, on perd l'argument combinatoire des
			échantillons trompeurs (binaire : trompé ou non) au profit d'une concentration probabiliste
			plus générale mais plus lente à converger. Dans les deux cas, l'ingrédient commun reste le
			même : passer d'un contrôle pour <KatexInline formula={'h'} /> fixé à un contrôle
			<strong>uniforme</strong> sur <KatexInline formula={hypothesisClass} />, via l'union bound.
		</p>

		<Callout type="summary" title="Retenir">
			Contrôler l'erreur du classifieur <em>appris</em> — et non d'un classifieur fixé à l'avance —
			exige une garantie valable simultanément pour toute la classe <KatexInline
				formula={hypothesisClass}
			/>. L'union bound est l'outil qui permet ce passage, au prix d'un facteur
			<KatexInline formula={'\\log|\\mathcal H|'} />. Le cas séparable, plus simple
			combinatoirement, converge plus vite (<KatexInline formula={'1/n'} />) que le cas général via
			Hoeffding (<KatexInline formula={'1/\\sqrt n'} />). Mais <KatexInline
				formula={'|\\mathcal H|'}
			/> devient inutilisable dès que
			<KatexInline formula={hypothesisClass} /> est infinie — hyperplans, réseaux de neurones, toute classe
			paramétrique continue. La leçon suivante introduit l'outil qui prend le relais dans ce cas : la
			dimension de Vapnik-Chervonenkis.
		</Callout>

		<InteractiveSection
			number="2.3"
			title="Quiz — Généralisation pour une classe finie"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Shalev-Shwartz, S.', 'Ben-David, S.']}
			year={2014}
			title="Understanding Machine Learning: From Theory to Algorithms"
			journal="Cambridge University Press."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>
		<BibElement
			authors={['Boucheron, S.', 'Lugosi, G.', 'Massart, P.']}
			year={2013}
			title="Concentration Inequalities: A Nonasymptotic Theory of Independence"
			journal="Oxford University Press."
			link="https://global.oup.com/academic/product/concentration-inequalities-9780199535255"
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

	.demo-guide,
	.demo-takeaway {
		margin: 0.75rem 0;
		line-height: 1.65;
	}

	.demo-guide {
		padding: 0.8rem 1rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-epistemic, #4f7cac) 8%, transparent);
	}

	.demo-takeaway {
		color: var(--color-text-muted);
	}
</style>
