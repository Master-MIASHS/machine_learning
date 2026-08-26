<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import CalibratedLossExplorer from '$lib/components/demos/CalibratedLossExplorer.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part7/lesson1');
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
			id: 'pourquoi-pas-0-1',
			label: 'Pourquoi ne pas minimiser la perte 0-1 ?',
			description: 'NP-difficile, discontinue, gradient nul presque partout',
			color: 'epistemic'
		},
		{
			id: 'formulation-marge',
			label: 'La formulation par la marge',
			description: 'ℓφ(f(x), y) = φ(y·f(x)) et le φ-risque',
			color: 'belief'
		},
		{
			id: 'pertes-usuelles',
			label: 'Quatre pertes de substitution',
			description: 'Logistique, charnière, exponentielle, Brier',
			color: 'surprise'
		},
		{
			id: 'logistique-cross-entropy',
			label: 'Logistique et cross-entropy',
			description: 'La même perte sous deux conventions',
			color: 'neutral'
		},
		{
			id: 'vers-calibration',
			label: 'La question qui reste',
			description: 'Minimiser un proxy mène-t-il au classifieur de Bayes ?',
			color: 'agent'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const bayes01Risk = 'R(h) = P(h(X) \\neq Y)';
	const empirical01Objective =
		'\\hat h_0 = \\arg\\min_{h \\in \\mathcal H} R_S(h) = \\arg\\min_{h \\in \\mathcal H} \\frac1n \\sum_{i=1}^n \\mathbb{1}_{h(X_i) \\neq Y_i}';

	const deepLearning01 = '\\frac1n \\sum_{i=1}^n \\mathbb{1}_{y_i f_\\theta(x_i) < 0}';
	const deepLearningLogistic = '\\frac1n \\sum_{i=1}^n \\log(1 + e^{-y_i f_\\theta(x_i)})';

	const marginLoss = '\\ell_\\phi(f(x), y) = \\phi(y f(x))';
	const phi01Def = '\\phi_{0\\text{-}1}(t) = \\mathbb{1}_{t < 0}';
	const phi01Check =
		'\\ell_{\\phi_{0\\text{-}1}}(f(x), y) = \\mathbb{1}_{y f(x) < 0} = \\mathbb{1}_{\\operatorname{sgn}(f(x)) \\neq y}';
	const phiRiskDef = 'R_\\phi(f) = \\mathbb{E}[\\phi(Y f(X))]';
	const phiRiskBayes = 'R_\\phi^* = \\inf_{f : \\mathcal X \\to \\mathbb R} R_\\phi(f)';

	const logisticLoss = '\\ell_{\\log}(y, f(x)) = \\log(1 + e^{-y f(x)})';
	const crossEntropyLoss =
		'\\ell_{\\mathrm{CE}}(\\tilde y, f(x)) = -\\tilde y \\log \\sigma(f(x)) - (1-\\tilde y)\\log(1 - \\sigma(f(x)))';
	const sigmoidDef = '\\sigma(t) = \\frac{1}{1 + e^{-t}}';
	const sigmoidIdentity =
		'1 - \\sigma(t) = \\frac{e^{-t}}{1+e^{-t}} = \\frac{1}{1+e^{t}} = \\sigma(-t)';
	const logSigmoid =
		'\\log \\sigma(t) = -\\log(1 + e^{-t}) \\quad \\text{et} \\quad \\log(1 - \\sigma(t)) = -\\log(1 + e^{t})';
	const ceCaseOne =
		'\\ell_{\\mathrm{CE}}(1, f(x)) = -\\log \\sigma(f(x)) = \\log(1 + e^{-f(x)}) = \\log(1 + e^{-y f(x)}) = \\ell_{\\log}(+1, f(x))';
	const ceCaseZero =
		'\\ell_{\\mathrm{CE}}(0, f(x)) = -\\log(1 - \\sigma(f(x))) = -\\log \\sigma(-f(x)) = \\log(1 + e^{f(x)}) = \\log(1 + e^{-(-1) f(x)}) = \\ell_{\\log}(-1, f(x))';
	const conventionChange =
		'\\tilde y = \\frac{y+1}{2} \\in \\{0,1\\} \\Longleftrightarrow y = 2\\tilde y - 1 \\in \\{-1,+1\\}';
	const ceEquivalence =
		'\\ell_{\\mathrm{CE}}(\\tilde y, f(x)) = \\ell_{\\log}(2\\tilde y - 1, f(x)) = \\log(1 + e^{-(2\\tilde y - 1) f(x)})';
	const logisticModel = 'P(Y = 1 \\mid X = x) = \\sigma(f(x))';
</script>

<svelte:head>
	<title>{meta?.title} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'De la perte 0-1 aux pertes proxy'}
	subtitle="Pourquoi la perte 0-1 ne s'optimise pas, et comment les pertes de substitution la remplacent"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="pourquoi-pas-0-1">Pourquoi ne pas minimiser la perte 0-1 ?</h2>

		<p>
			La Partie IV a caractérisé le classifieur de Bayes <KatexInline formula={'h^*'} /> : il minimise
			le risque 0-1 <KatexInline formula={bayes01Risk} />, la quantité la plus naturelle possible
			pour évaluer un classifieur. L'idée la plus directe serait donc de minimiser le risque
			empirique 0-1 sur la classe <KatexInline formula={'\\mathcal H'} /> :
		</p>
		<KatexBlock formula={empirical01Objective} />

		<p>
			Malheureusement, ce problème est <strong>NP-difficile</strong> en général : la perte 0-1 est non
			convexe, discontinue, et son gradient est nul presque partout. On ne peut tout simplement pas l'optimiser
			par descente de gradient.
		</p>

		<Callout type="insight" title="Deep learning : la perte logistique en pratique">
			<p>
				En pratique, on paramètre <KatexInline formula={'h'} /> par un réseau de neurones
				<KatexInline formula={'f_\\theta : \\mathcal X \\to \\mathbb R'} /> et on pose
				<KatexInline formula={'h_\\theta(x) = \\operatorname{sgn}(f_\\theta(x))'} />. On ne minimise
				pas :
			</p>
			<KatexBlock formula={deepLearning01} />
			<p>
				mais la <strong>perte logistique</strong> (ou cross-entropy) :
			</p>
			<KatexBlock formula={deepLearningLogistic} />
			<p>
				qui est convexe en <KatexInline formula={'f_\\theta(x_i)'} />, différentiable, et dont le
				gradient donne une direction de descente utile.
			</p>
		</Callout>

		<p>
			De même, le SVM minimise la perte charnière <KatexInline formula={'\\max(0, 1 - y f(x))'} />,
			et AdaBoost minimise implicitement la perte exponentielle <KatexInline
				formula={'e^{-y f(x)}'}
			/>.
		</p>

		<p>
			La question fondamentale est alors : <em>minimiser une perte proxy</em>
			<KatexInline formula={'\\phi'} />
			<em> conduit-il bien à un classifieur proche de</em>
			<KatexInline formula={'h^*'} />
			<em> ?</em> C'est l'objet de la calibration, étudiée à la leçon suivante.
		</p>

		<h2 id="formulation-marge">La formulation par la marge</h2>

		<p>
			On se place en classification binaire <KatexInline formula={'\\mathcal Y = \\{-1, +1\\}'} />.
			Un modèle est une fonction <KatexInline formula={'f : \\mathcal X \\to \\mathbb R'} />, et la
			décision associée est <KatexInline formula={'h_f(x) = \\operatorname{sgn}(f(x))'} />. La
			<strong>marge</strong>
			<KatexInline formula={'t = y f(x)'} /> mesure la justesse de la prédiction : elle est positive quand
			le signe est bon, et plus grande en valeur absolue quand la prédiction est plus « confiante ».
		</p>

		<p>
			On remplace la perte 0-1 par une <strong>perte de substitution</strong>
			<KatexInline formula={'\\phi : \\mathbb R \\to \\mathbb R_+'} />
			appliquée à la marge :
		</p>
		<KatexBlock formula={marginLoss} />

		<p>
			<strong>Vérification sur la perte 0-1.</strong> On pose <KatexInline formula={phi01Def} />.
			Alors :
		</p>
		<KatexBlock formula={phi01Check} />
		<p>
			ce qui redonne bien la perte 0-1 usuelle : la marge <KatexInline formula={'y f(x)'} /> est négative
			si et seulement si <KatexInline formula={'f(x)'} /> et <KatexInline formula={'y'} />
			sont de signes opposés, c'est-à-dire quand le classifieur se trompe. La perte 0-1 est donc une perte
			de substitution au sens propre — la seule, hélas, qui ne puisse pas s'optimiser.
		</p>

		<DefinitionBlock title="φ-risque et φ-risque de Bayes">
			<p>
				Le <KatexInline formula={'\\phi'} />-risque d'un modèle <KatexInline formula={'f'} /> est :
			</p>
			<KatexBlock formula={phiRiskDef} />
			<p>et le <KatexInline formula={'\\phi'} />-risque de Bayes est :</p>
			<KatexBlock formula={phiRiskBayes} />
		</DefinitionBlock>

		<h2 id="pertes-usuelles">Quatre pertes de substitution usuelles</h2>

		<p>Les exemples standard de pertes de substitution sont les suivants.</p>

		<table>
			<thead>
				<tr>
					<th>Perte</th>
					<th>Expression φ(t)</th>
					<th>Usage</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Logistique</td>
					<td><KatexInline formula={String.raw`\log(1 + e^{-t})`} /></td>
					<td>Régression logistique, deep learning</td>
				</tr>
				<tr>
					<td>Charnière</td>
					<td><KatexInline formula={String.raw`\max(0, 1 - t)`} /></td>
					<td>SVM</td>
				</tr>
				<tr>
					<td>Exponentielle</td>
					<td><KatexInline formula={String.raw`e^{-t}`} /></td>
					<td>AdaBoost</td>
				</tr>
				<tr>
					<td>Carrée (Brier)</td>
					<td><KatexInline formula={String.raw`(1 - t)^2`} /></td>
					<td>Least-squares classification</td>
				</tr>
			</tbody>
		</table>

		<p>
			Ces pertes partagent la propriété qui les rend exploitables : elles sont convexes et
			différentiables (la charnière, non différentiable en <KatexInline formula={'t = 1'} />, l'est
			néanmoins en <KatexInline formula={'t = 0'} />, où sa pente vaut <KatexInline
				formula={'-1'}
			/>) — là où la perte 0-1 est plate presque partout. On vérifie par ailleurs que les quatre
			sont telles que <KatexInline formula={"\\varphi'(0) < 0"} /> ; cette propriété jouera un rôle central
			dans le critère de calibration de la leçon suivante.
		</p>

		<InteractiveSection
			number="1.1"
			title="Pertes de substitution face à la perte 0-1"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Chaque perte de substitution est affichée à côté de la perte
				0-1, plate et discontinue. Déplacez la marge <KatexInline formula={'t'} /> : la pente locale et
				le gradient de la perte sélectionnée sont non nuls presque partout, alors que ceux de la 0-1 sont
				nuls hors de <KatexInline formula={'t = 0'} />. Ramenez <KatexInline formula={'t'} />
				vers 0 : la pente <KatexInline formula={"\\varphi'(0)"} /> qui s'y lit est précisément la quantité
				sur laquelle reposera le critère de calibration.
			</p>
			<CalibratedLossExplorer />
		</InteractiveSection>

		<h2 id="logistique-cross-entropy">Logistique et cross-entropy : la même perte</h2>

		<p>
			Dans l'exemple du deep learning, la perte logistique était écrite avec la convention
			<KatexInline formula={'y \\in \\{-1, +1\\}'} /> et la sortie <KatexInline
				formula={'f(x) \\in \\mathbb R'}
			/>. Dans la littérature probabiliste, la même perte est appelée
			<strong>cross-entropy</strong>, avec la convention <KatexInline
				formula={'\\tilde y \\in \\{0, 1\\}'}
			/> et la sortie
			<KatexInline formula={'\\sigma(f(x)) \\in (0,1)'} />. Ces deux formulations sont identiques à
			un changement de convention près.
		</p>

		<ExercisePanel title="Équivalence entre perte logistique et cross-entropy">
			<p>
				En classification binaire, on dispose de deux formulations de la perte : la <em
					>perte logistique</em
				>
				(convention <KatexInline formula={'y \\in \\{-1, +1\\}'} />, sortie
				<KatexInline formula={'f(x) \\in \\mathbb R'} />) :
			</p>
			<KatexBlock formula={logisticLoss} />
			<p>
				et la <em>cross-entropy</em> (convention <KatexInline
					formula={'\\tilde y \\in \\{0, 1\\}'}
				/>, sortie <KatexInline formula={'\\sigma(f(x)) \\in (0,1)'} />) :
			</p>
			<KatexBlock formula={crossEntropyLoss} />
			<p>
				où <KatexInline formula={sigmoidDef} /> est la fonction sigmoïde. Montrer que ces deux pertes
				sont identiques à un changement de convention près.
			</p>
			<p>
				<em>Indication :</em> exprimer <KatexInline formula={'\\sigma(f(x))'} /> et
				<KatexInline formula={'1 - \\sigma(f(x))'} /> en fonction de <KatexInline
					formula={'e^{f(x)}'}
				/>, puis traiter séparément les cas <KatexInline formula={'\\tilde y = 1'} /> et
				<KatexInline formula={'\\tilde y = 0'} />, correspondant respectivement à
				<KatexInline formula={'y = +1'} /> et <KatexInline formula={'y = -1'} />.
			</p>

			{#snippet solution()}
				<p><strong>Solution :</strong></p>

				<p><strong>Étape 1 — Intuition.</strong></p>
				<p>
					Les deux formulations encodent la même idée : pénaliser le modèle quand il est confiant
					dans la mauvaise direction. La perte logistique le fait via la marge
					<KatexInline formula={'y f(x)'} /> (négative quand <KatexInline formula={'f'} /> et
					<KatexInline formula={'y'} /> sont de signes opposés), et la cross-entropy via la log-vraisemblance
					d'un modèle de Bernoulli de paramètre <KatexInline formula={'\\sigma(f(x))'} />.
				</p>

				<p><strong>Étape 2 — Rappels sur la sigmoïde.</strong></p>
				<p>On note que :</p>
				<KatexBlock formula={sigmoidIdentity} />
				<p>Donc :</p>
				<KatexBlock formula={logSigmoid} />

				<p>
					<strong
						>Étape 3 — Cas <KatexInline formula={'\\tilde y = 1'} /> (correspondant à
						<KatexInline formula={'y = +1'} />).</strong
					>
				</p>
				<KatexBlock formula={ceCaseOne} />

				<p>
					<strong
						>Étape 4 — Cas <KatexInline formula={'\\tilde y = 0'} /> (correspondant à
						<KatexInline formula={'y = -1'} />).</strong
					>
				</p>
				<KatexBlock formula={ceCaseZero} />

				<p><strong>Conclusion.</strong></p>
				<p>
					Les deux pertes sont identiques sous le changement de convention <KatexInline
						formula={conventionChange}
					/>
					:
				</p>
				<KatexBlock formula={ceEquivalence} />

				<p><strong>Interprétation probabiliste.</strong></p>
				<p>La cross-entropy est la log-vraisemblance négative du modèle probabiliste :</p>
				<KatexBlock formula={logisticModel} />
				<p>
					Minimiser la cross-entropy revient donc à maximiser la vraisemblance du modèle logistique,
					ce qui justifie son usage en deep learning : on cherche les paramètres
					<KatexInline formula={'\\theta'} /> qui rendent les labels observés les plus probables sous
					le modèle <KatexInline formula={'\\sigma(f_\\theta)'} />.
				</p>
			{/snippet}
		</ExercisePanel>

		<h2 id="vers-calibration">La question qui reste</h2>

		<Callout type="summary" title="Retenir">
			La perte 0-1 est le critère théoriquement optimal, mais NP-difficile à minimiser : non
			convexe, discontinue, gradient nul presque partout. La formulation par la marge
			<KatexInline formula={marginLoss} /> permet de la remplacer par une perte de substitution
			<KatexInline formula={'\\phi'} /> convexe et différentiable — logistique, charnière, exponentielle
			ou Brier — dont le risque <KatexInline formula={'R_\\phi(f)'} /> se minimise par descente de gradient.
			La perte logistique est exactement la cross-entropy du modèle logistique, à un changement de convention
			près.
		</Callout>

		<Callout type="note" title="Que veut dire « calibrée » ?">
			<p>
				On dit qu'une perte de substitution <KatexInline formula={'\\varphi'} /> est
				<strong>calibrée</strong> quand elle « fonctionne » pour la classification : toute suite de
				modèles qui amène le <KatexInline formula={'\\varphi'} />-risque vers sa borne inférieure
				amène aussi le risque 0-1 vers la sienne — minimiser le proxy conduit alors bien au
				classifieur de Bayes. La définition formelle, et le critère <KatexInline
					formula={"\\varphi'(0) < 0"}
				/>
				qui caractérise les pertes convexes calibrées, font l'objet de la leçon suivante.
			</p>
		</Callout>

		<p>
			Il reste à répondre à la question posée en introduction : minimiser <KatexInline
				formula={'R_\\phi'}
			/> conduit-il bien à un classifieur proche du classifieur de Bayes ? La leçon suivante introduit
			les pertes calibrées et le critère <KatexInline formula={"\\varphi'(0) < 0"} /> qui répond à cette
			question.
		</p>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Bartlett, P. L.', 'Jordan, M. I.', 'McAuliffe, J.']}
			year={2006}
			title="Convexity, Classification, and Risk Bounds"
			journal="Journal of the American Statistical Association, 101(473), 138-156."
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
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.demo-guide {
		margin: 0.75rem 0;
		padding: 0.8rem 1rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-epistemic, #4f7cac) 8%, transparent);
		line-height: 1.65;
	}
</style>
