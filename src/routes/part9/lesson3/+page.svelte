<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import RiskDecompositionDemo from '$lib/components/demos/RiskDecompositionDemo.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import Quiz, { type QuizItem } from '$lib/components/demos/Quiz.svelte';

	const meta = getPageByPath('/part9/lesson3');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz: QuizItem[] = [
		{
			question: 'Dans la décomposition A + B + C du Théorème 4.2, le terme A correspond à :',
			options: [
				"l'écart d'approximation entre le minimiseur global et le classifieur de Bayes",
				"l'écart d'estimation dû à l'utilisation d'un échantillon fini",
				'le coût de la restriction à la classe F',
				'la variance du gradient stochastique'
			],
			answerIndex: 1,
			explanation:
				"A mesure l'écart entre le modèle appris sur l'échantillon et le meilleur modèle de la classe pour le phi-risque."
		},
		{
			question: "Le terme B s'annule dès que :",
			options: [
				'f** ∈ F',
				"phi'(0) > 0",
				"la taille de l'échantillon est petite",
				'le terme A est négatif'
			],
			answerIndex: 0,
			explanation:
				"B mesure le coût de la restriction à F ; la leçon indique qu'il est nul si le minimiseur global f** appartient à F."
		},
		{
			question: "Le terme C s'annule lorsque :",
			options: [
				'f** ∈ F',
				"la taille de l'échantillon est grande",
				'F est une classe finie',
				'la perte phi est calibrée'
			],
			answerIndex: 3,
			explanation:
				"C mesure l'écart entre le minimiseur global du phi-risque et le classifieur de Bayes ; une perte calibrée rend ce terme nul."
		},
		{
			question: "Si phi est calibrée et si f** ∈ F, l'excès de risque 0-1 se réduit à :",
			options: ['A + B', 'B + C', 'A seul', 'A + C'],
			answerIndex: 2,
			explanation: "Dans ce cas favorable, B et C sont nuls, il ne reste que le terme d'estimation A."
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
			id: 'mise-en-place',
			label: 'Mise en place',
			description: 'Trois fonctions à comparer : empirique, meilleure dans F, globale',
			color: 'epistemic'
		},
		{
			id: 'decomposition',
			label: 'Théorème 4.2 : trois termes',
			description: 'Estimation, calibration, approximation',
			color: 'belief'
		},
		{
			id: 'signe-termes',
			label: 'Interprétation de chaque terme',
			description: "Quand B et C s'annulent-ils ?",
			color: 'surprise'
		},
		{
			id: 'cas-benin',
			label: 'Le cas favorable',
			description: 'φ calibrée et f** ∈ F : il ne reste que l’estimation',
			color: 'neutral'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const hatfDef =
		'\\hat f_{\\mathcal F}(\\mathcal S_n) = \\arg\\min_{f \\in \\mathcal F} R_{\\varphi,\\, \\mathcal S_n}(f)';
	const empiricalPhiRisk =
		'R_{\\varphi,\\, \\mathcal S_n}(f) = \\frac1n \\sum_{i=1}^n \\varphi(Y_i f(X_i))';
	const fstarDef = 'f^* = \\arg\\min_{f \\in \\mathcal F} R_\\varphi(f)';
	const fbbDef = 'f^{**} : x \\mapsto \\arg\\min_{\\alpha \\in \\mathbb R} C_\\varphi(\\alpha,\\, \\eta(x))';
	const phiBayesRisk = 'R_\\varphi^* = R_\\varphi(f^{**})';

	const decomposition =
		'R(h_{\\hat f_S}) - R^* = \\underbrace{R(h_{\\hat f_S}) - R(h_{f^*})}_{A} + \\underbrace{R(h_{f^*}) - R(h_{f^{**}})}_{B} + \\underbrace{R(h_{f^{**}}) - R^*}_{C}';
	const telescoping =
		'R(h_{\\hat f_S}) - R^* = R(h_{\\hat f_S}) - R(h_{f^*}) + R(h_{f^*}) - R(h_{f^{**}}) + R(h_{f^{**}}) - R^*';
	const bInequality = 'R_\\varphi(f^*) \\le R_\\varphi(f^{**})';
	const cAtBayes = 'R_\\varphi(f^{**}) = R_\\varphi^*';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Décomposition de l’erreur'}
	subtitle="Estimation, calibration, approximation : où va exactement l'excès de risque ?"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="mise-en-place">Mise en place</h2>

		<p>
			On dispose maintenant de tous les outils pour décomposer l'erreur totale d'un algorithme qui
			minimise un <KatexInline formula={'\\varphi'} />-risque empirique sur une classe
			<KatexInline formula={'\\mathcal F'} />. Soit <KatexInline formula={hatfDef} /> le minimiseur du
			<KatexInline formula={'\\varphi'} />-risque empirique, où :
		</p>
		<KatexBlock formula={empiricalPhiRisk} />

		<p>On note :</p>
		<ul>
			<li>
				<KatexInline formula={fstarDef} /> : le meilleur modèle dans <KatexInline
					formula={'\\mathcal F'}
				/>
				pour le <KatexInline formula={'\\varphi'} />-risque ;
			</li>
			<li>
				<KatexInline formula={fbbDef} /> : le minimiseur du <KatexInline
					formula={'\\varphi'}
				/>-risque global, sans contrainte de classe ;
			</li>
			<li>
				<KatexInline formula={phiBayesRisk} /> : le <KatexInline formula={'\\varphi'} />-risque de
				Bayes.
			</li>
		</ul>

		<p>
			Trois objets sont donc en compétition : le modèle qu'on <em>apprend</em> sur l'échantillon
			<KatexInline formula={'\\hat f_S'} />, le meilleur modèle <em>disponible dans la classe</em>
			<KatexInline formula={'f^*'} />, et le meilleur modèle <em>en absolu</em>
			<KatexInline formula={'f^{**}'} />. La décomposition suivante répartit l'excès de risque 0-1
			selon les écartements successifs de ces trois objets.
		</p>

		<h2 id="decomposition">Théorème 4.2 : la décomposition en trois termes</h2>

		<TheoremBlock title="Théorème 4.2 (Décomposition de l'erreur)">
			<p>L'excès de risque 0-1 se décompose comme :</p>
			<KatexBlock formula={decomposition} />
			<p>
				où <KatexInline formula={'\\hat f_S = \\arg\\min_{f \\in \\mathcal F} R_{\\varphi, S}(f)'} />
				est le minimiseur du <KatexInline formula={'\\varphi'} />-risque empirique,
				<KatexInline formula={fstarDef} /> est le meilleur modèle dans <KatexInline
					formula={'\\mathcal F'}
				/> pour le <KatexInline formula={'\\varphi'} />-risque, et <KatexInline
					formula={'f^{**}'}
				/>
				est le minimiseur global du <KatexInline formula={'\\varphi'} />-risque sur toutes les
				fonctions mesurables. Les trois termes ont les interprétations suivantes :
			</p>
			<ul>
				<li>
					<KatexInline formula={'A'} /> : <em>terme d'estimation</em> — écart dû à l'utilisation
					d'un échantillon fini plutôt que de la vraie distribution ;
				</li>
				<li>
					<KatexInline formula={'B'} /> : <em>terme de calibration</em> — écart entre le meilleur
					modèle dans <KatexInline formula={'\\mathcal F'} /> pour <KatexInline
						formula={'\\varphi'}
					/>
					et le minimiseur global de <KatexInline formula={'\\varphi'} />, mesuré en risque 0-1 ;
					il est nul si <KatexInline formula={'f^{**} \\in \\mathcal F'} /> ;
				</li>
				<li>
					<KatexInline formula={'C'} /> : <em>terme d'approximation</em> — écart entre le
					minimiseur global du <KatexInline formula={'\\varphi'} />-risque et le classifieur de
					Bayes ; il est nul si <KatexInline formula={'\\varphi'} /> est calibrée.
				</li>
			</ul>
		</TheoremBlock>

		<InteractiveSection
			number="3.1"
			title="Les trois termes, visuellement"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> La barre empilée montre
				<KatexInline formula={'R(h_{\\hat f_S}) - R^*'} />
				décomposée en <KatexInline formula={'A + B + C'} />. Trois leviers, trois termes :
				augmentez la taille d'échantillon <KatexInline formula={'n'} /> pour faire fondre
				<KatexInline formula={'A'} /> (au taux <KatexInline formula={'1/\\sqrt n'} /> en moyenne) ;
				passez la capacité de la classe à 1 pour annuler <KatexInline formula={'B'} />
				(<KatexInline formula={'f^{**} \\in \\mathcal F'} />) ; choisissez une perte calibrée pour
				annuler <KatexInline formula={'C'} /> — et regardez ce que fait une perte non calibrée.
			</p>
			<RiskDecompositionDemo />
		</InteractiveSection>

		<h2 id="signe-termes">Interprétation de chaque terme</h2>

		<div class="proof-block">
			<p><strong>Démonstration :</strong></p>
			<p>La décomposition est une identité algébrique :</p>
			<KatexBlock formula={telescoping} />
			<p>Il reste à vérifier le signe de chaque terme.</p>
			<ul>
				<li>
					<strong>Terme <KatexInline formula={'A'} /> :</strong> pas nécessairement positif terme
					à terme, mais contrôlé en espérance par les inégalités de concentration uniformes de la
					partie VI.
				</li>
				<li>
					<strong>Terme <KatexInline formula={'B'} /> :</strong> <KatexInline
						formula={'f^*'}
					/>
					minimise <KatexInline formula={'R_\\varphi'} /> sur <KatexInline
						formula={'\\mathcal F'}
					/>, donc <KatexInline formula={bInequality} />. Mais cela ne dit rien directement sur le
					risque 0-1. Ce terme mesure le <em>coût de la restriction à</em> <KatexInline
						formula={'\\mathcal F'}
					/>
					lorsqu'on optimise <KatexInline formula={'\\varphi'} /> plutôt que la perte 0-1 : même
					si <KatexInline formula={'f^{**} \\in \\mathcal F'} />, le meilleur modèle pour
					<KatexInline formula={'\\varphi'} /> dans <KatexInline formula={'\\mathcal F'} /> n'est
					pas nécessairement le meilleur pour la perte 0-1.
				</li>
				<li>
					<strong>Terme <KatexInline formula={'C'} /> :</strong> <KatexInline
						formula={'f^{**}'}
					/>
					minimise <KatexInline formula={'R_\\varphi'} /> sans contrainte, donc
					<KatexInline formula={cAtBayes} />. Si <KatexInline formula={'\\varphi'} /> est
					calibrée, le minimiseur du <KatexInline formula={'\\varphi'} />-risque a le même signe
					que <KatexInline formula={'\\eta(x) - 1/2'} /> pour presque tout
					<KatexInline formula={'x'} />, donc <KatexInline
						formula={'h_{f^{**}} = h^*'}
					/>
					p.s. et <KatexInline formula={'C = 0'} />.
				</li>
			</ul>
			<p>
				En particulier, si <KatexInline formula={'\\varphi'} /> est calibrée et
				<KatexInline formula={'f^{**} \\in \\mathcal F'} />, le terme <KatexInline
					formula={'C'}
				/>
				et le terme <KatexInline formula={'B'} /> sont tous deux nuls, et l'excès de risque se
				réduit au seul terme d'estimation <KatexInline formula={'A'} />. ∎
			</p>
		</div>

		<h2 id="cas-benin">Le cas favorable</h2>

		<p>
			Les deux clauses du Théorème 4.2 répondent à deux questions différentes, et c'est leur
			combinaison qui donne le résultat le plus utile en pratique.
		</p>

		<Callout type="insight" title="Chaque levier agit sur un seul terme">
			<ul>
				<li>
					Le terme <KatexInline formula={'A'} /> se pilote par la <strong>taille de
					l'échantillon</strong> : c'est le prix de l'empirisme, contrôlé en espérance au taux
					<KatexInline formula={'1/\\sqrt n'} /> par les bornes de concentration.
				</li>
				<li>
					Le terme <KatexInline formula={'B'} /> se pilote par le <strong>choix de la classe</strong>
					<KatexInline formula={'\\mathcal F'} /> : plus la classe est riche, plus
					<KatexInline formula={'f^*'} /> se rapproche du minimiseur global
					<KatexInline formula={'f^{**}'} /> ; il s'annule dès que <KatexInline
						formula={'f^{**} \\in \\mathcal F'}
					/>.
				</li>
				<li>
					Le terme <KatexInline formula={'C'} /> se pilote par le <strong>choix de la perte</strong>
					<KatexInline formula={'\\varphi'} /> : il s'annule dès que <KatexInline
						formula={'\\varphi'}
					/>
					est calibrée, c'est-à-dire dès que <KatexInline formula={'\\varphi\'(0) < 0'} />
					(Théorème 4.1).
				</li>
			</ul>
		</Callout>

		<Callout type="summary" title="Retenir">
			L'excès de risque 0-1 d'un algorithme qui minimise un <KatexInline
				formula={'\\varphi'}
			/>-risque empirique sur une classe <KatexInline formula={'\\mathcal F'} /> se décompose en
			<KatexInline formula={'A + B + C'} /> : estimation (échantillon fini), calibration (restriction
			à la classe, mesurée en risque 0-1) et approximation (écart du minimiseur global du
			<KatexInline formula={'\\varphi'} />-risque au classifieur de Bayes). B s'annule si
			<KatexInline formula={'f^{**} \\in \\mathcal F'} />, C s'annule si <KatexInline
				formula={'\\varphi'}
			/>
			est calibrée ; dans ce cas favorable, seul le terme d'estimation demeure.
		</Callout>

		<InteractiveSection
			number="3.2"
			title="Quiz — Décomposition de l'erreur"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
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
