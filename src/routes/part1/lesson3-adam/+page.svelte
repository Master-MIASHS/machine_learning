<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
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
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	import AdamMomentsVisualizer from '$lib/components/demos/AdamMomentsVisualizer.svelte';
	import AdamStepByStep from '$lib/components/demos/AdamStepByStep.svelte';
	import AdamBiasCorrectionExplorer from '$lib/components/demos/AdamBiasCorrectionExplorer.svelte';
	import EffectiveLearningRateExplorer from '$lib/components/demos/EffectiveLearningRateExplorer.svelte';
	import Beta2NonStationarityExplorer from '$lib/components/demos/Beta2NonStationarityExplorer.svelte';
	import AdamVsAdamWDecayExplorer from '$lib/components/demos/AdamVsAdamWDecayExplorer.svelte';
	import AdamFailureModesLab from '$lib/components/demos/AdamFailureModesLab.svelte';

	const meta = getPageByPath('/part1/lesson3-adam');
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
			label: 'Pourquoi Adam ?',
			description: 'Le problème que SGD laisse derrière lui',
			color: 'epistemic'
		},
		{
			id: 'running-example',
			label: 'Un exemple pour toute la leçon',
			description: 'Deux paramètres, deux échelles',
			color: 'positive'
		},
		{
			id: 'de-sgd-a-adam',
			label: 'De SGD à Adam',
			description: 'Une idée après l’autre',
			color: 'neutral'
		},
		{
			id: 'momentum',
			label: 'Momentum : se souvenir de la direction',
			description: 'Filtrer le bruit et accumuler l’inertie',
			color: 'belief'
		},
		{
			id: 'second-moment',
			label: 'Second moment : se souvenir de l’échelle',
			description: 'Pourquoi le gradient seul ne suffit pas',
			color: 'belief'
		},
		{
			id: 'deux-moments',
			label: 'Les deux mémoires ensemble',
			description: 'Direction contre échelle',
			color: 'neutral'
		},
		{
			id: 'algorithme',
			label: 'L’algorithme Adam complet',
			description: 'Chaque quantité, une étape à la fois',
			color: 'positive'
		},
		{
			id: 'biais',
			label: 'Pourquoi corriger le biais ?',
			description: 'Que signifie commencer à zéro ?',
			color: 'surprise'
		},
		{
			id: 'preconditionneur',
			label: 'Adam comme préconditionneur',
			description: 'Un taux effectif par paramètre',
			color: 'belief'
		},
		{
			id: 'beta',
			label: 'β₁, β₂ et ε',
			description: 'Trois mécanismes différents',
			color: 'neutral'
		},
		{
			id: 'learning-rate',
			label: 'Le learning rate',
			description: 'Adaptatif ne signifie pas automatique',
			color: 'agent'
		},
		{
			id: 'generalisation',
			label: 'Optimisation et généralisation',
			description: 'Deux questions différentes',
			color: 'surprise'
		},
		{
			id: 'adamw',
			label: 'Adam vs AdamW',
			description: 'Pourquoi découpler le weight decay',
			color: 'positive'
		},
		{
			id: 'echecs',
			label: 'Quand Adam échoue',
			description: 'Comprendre les modes d’échec',
			color: 'surprise'
		},
		{
			id: 'diagnostic',
			label: 'Diagnostiquer un entraînement',
			description: 'Lire la dynamique avant de modifier le modèle',
			color: 'agent'
		},
		{
			id: 'exercises',
			label: 'Exercices de compréhension',
			description: 'Prédire avant de calculer',
			color: 'epistemic'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'Le modèle mental à retenir',
			color: 'epistemic'
		}
	];

	const gd = String.raw`\theta_{t+1}=\theta_t-\alpha g_t`;

	const m = String.raw`m_t=\beta_1m_{t-1}+(1-\beta_1)g_t`;

	const v = String.raw`v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^{\odot 2}`;

	// const adam = String.raw`
	// \begin{aligned}
	// m_t&=\beta_1m_{t-1}+(1-\beta_1)g_t\\
	// v_t&=\beta_2v_{t-1}+(1-\beta_2)g_t^2\\
	// \hat m_t&=\frac{m_t}{1-\beta_1^t}\\
	// \hat v_t&=\frac{v_t}{1-\beta_2^t}\\
	// \theta_t&=\theta_{t-1}
	// -\alpha\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}
	// \end{aligned}`;

	const effectiveRate = String.raw`
	\alpha_{t,i}^{\mathrm{eff}}
	=
	\frac{\alpha}{\sqrt{\hat v_{t,i}}+\epsilon}`;

	const adamDirection = String.raw`
	\frac{\hat m_{t,i}}
	{\sqrt{\hat v_{t,i}}+\epsilon}`;

	const biasCorrection = String.raw`
	\mathbb{E}[m_{t,i}]
	=
	(1-\beta_1^t)\mathbb{E}[g_{t,i}],
	\qquad
	\mathbb{E}[v_{t,i}]
	=
	(1-\beta_2^t)\mathbb{E}[g_{t,i}^2]`;

	const adamw = String.raw`
	\theta_t
	=
	(1-\alpha\lambda)\theta_{t-1}
-
\alpha
\frac{\hat m_t}
{\sqrt{\hat v_t}+\epsilon}`;

	const updateRatio = String.raw`
	\rho_t
	=
	\frac{\|\Delta\theta_t\|}
	{\|\theta_t\|+\delta}`;
</script>

<PageTemplate
	title={meta?.title ?? 'Adam : comprendre l’optimiseur adaptatif'}
	subtitle="Construire l’algorithme à partir d’un problème : mémoire, échelle, normalisation et diagnostic"
	prev={prevMeta}
	next={nextMeta}
>
	<TableOfContents entries={tocEntries} />
	<TheorySection>
		<h2 id="introduction">Pourquoi Adam ?</h2>

		<p>
			Dans la leçon précédente, nous avons vu que la descente de gradient transforme un gradient en
			déplacement dans l’espace des paramètres. L’idée semble simple :
		</p>

		<KatexBlock formula={gd} />

		<p>
			Mais cette formule cache plusieurs difficultés. Le gradient que nous observons à l’instant
			<t>t</t> est souvent <strong>bruité</strong>, les différentes coordonnées peuvent avoir des
			<strong>échelles très différentes</strong>, et la géométrie du problème peut changer pendant
			l’entraînement.
		</p>

		<Callout type="intuition" title="Le problème de départ">
			<p>
				SGD regarde essentiellement le gradient <strong>maintenant</strong>. Adam demande :
			</p>
			<ul>
				<li>Quelle direction semble persistante ?</li>
				<li>Quelle est l’échelle typique des gradients dans chaque coordonnée ?</li>
				<li>Comment utiliser ces deux informations pour choisir le déplacement ?</li>
			</ul>
		</Callout>

		<h3>Une expérience mentale</h3>

		<p>
			Imaginons deux paramètres <KatexInline formula={'\\theta_1'} /> et
			<KatexInline formula={'\\theta_2'} />.
		</p>

		<p>
			Pour <KatexInline formula={'\\theta_1'} />, les gradients sont typiquement de l’ordre de 100.
			Pour <KatexInline formula={'\\theta_2'} />, ils sont plutôt de l’ordre de 0.01.
		</p>

		<p>Un même learning rate global traite pourtant les deux coordonnées.</p>

		<ExercisePanel title="Question à se poser">
			<p>
				Si les deux paramètres sont importants, mais que leurs gradients ont des échelles très
				différentes, devrait-on nécessairement faire exactement le même déplacement relatif dans les
				deux directions ?
			</p>
			{#snippet solution()}
				<p>
					Non. Adam ne résout pas tous les problèmes d’optimisation, mais il introduit précisément
					une manière de tenir compte de cette information locale.
				</p>
			{/snippet}
		</ExercisePanel>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 2. RUNNING EXAMPLE                                        -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="running-example">Un exemple pour toute la leçon</h2>

		<p>
			Pour comprendre Adam, nous allons utiliser le même petit exemple mental tout au long de la
			page.
		</p>

		<ExampleBlock number="2.1" title="Deux paramètres, deux comportements">
			<p>Considérons un modèle possédant deux paramètres.</p>

			<ul>
				<li>
					<code>θ₁</code> reçoit des gradients relativement grands mais qui changent souvent de signe.
				</li>
				<li>
					<code>θ₂</code> reçoit des gradients plus petits mais presque toujours positifs.
				</li>
			</ul>

			<p>
				SGD voit seulement le gradient courant. Adam va construire progressivement deux souvenirs :
				le souvenir de la <strong>direction</strong> et celui de la <strong>magnitude</strong>.
			</p>
		</ExampleBlock>

		<div class="comparison">
			<div class="comparison-card">
				<h3>θ₁</h3>
				<p class="large-number">+8, −7, +9, −8, +7…</p>
				<p>Gradient important mais direction instable.</p>
			</div>

			<div class="comparison-card">
				<h3>θ₂</h3>
				<p class="large-number">+0.2, +0.3, +0.25, +0.2…</p>
				<p>Gradient faible mais direction persistante.</p>
			</div>
		</div>

		<Callout type="insight" title="La question fondamentale">
			<p>
				Le gradient instantané ne raconte pas toute l’histoire. Adam cherche à transformer une
				<strong>suite de gradients</strong> en une décision de mise à jour.
			</p>
		</Callout>

		<p>
			Cette idée de mémoire est essentielle : Adam n’est pas une fonction qui transforme simplement
			<code>gₜ</code> en <code>Δθₜ</code>. Il possède un <strong>état interne</strong>.
		</p>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 3. SGD → MOMENTUM → RMSPROP                               -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="de-sgd-a-adam">De SGD à Adam</h2>

		<p>Plutôt que de présenter Adam comme une formule complète, construisons-le progressivement.</p>

		<h3>Étape 1 — SGD</h3>

		<KatexBlock formula={gd} />

		<p>
			À chaque étape, SGD reçoit un gradient et déplace les paramètres dans la direction opposée. Il
			n’a pas de mémoire explicite du gradient précédent.
		</p>

		<Callout type="warning" title="Une conséquence">
			<p>
				Si les gradients sont bruités, SGD peut effectuer une trajectoire en zigzag. Deux gradients
				successifs peuvent même pointer dans des directions opposées.
			</p>
		</Callout>

		<h3 id="momentum">Étape 2 — ajouter une mémoire de direction</h3>

		<p>
			Une première idée consiste à ne plus utiliser directement le gradient courant. On peut
			construire une moyenne exponentielle des gradients.
		</p>

		<KatexBlock formula={m} />

		<p>
			Le paramètre <KatexInline formula={'\\beta_1'} /> contrôle la quantité de mémoire.
		</p>

		<div class="parameter-grid">
			<div>
				<strong>β₁ petit</strong>
				<p>Réagit rapidement aux nouveaux gradients.</p>
			</div>
			<div>
				<strong>β₁ grand</strong>
				<p>Conserve longtemps l’information passée.</p>
			</div>
		</div>

		<Callout type="intuition" title="Une analogie">
			<p>
				Imaginez marcher sur un sol où quelqu’un vous pousse légèrement à chaque instant. Le
				gradient est la poussée instantanée. Le momentum agit comme une inertie : il évite que votre
				direction change complètement à chaque petite perturbation.
			</p>
		</Callout>

		<h3>Étape 3 — la direction ne suffit pas</h3>

		<p>
			Le momentum répond à la question :
			<strong>« quelle direction semble persistante ? »</strong>
		</p>

		<p>
			Mais il ne répond pas à une autre question :
			<strong>« quelle est l’échelle habituelle du gradient dans cette coordonnée ? »</strong>
		</p>

		<p>C’est ici qu’intervient une seconde mémoire.</p>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 4. SECOND MOMENT                                          -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="second-moment">Le second moment : mémoriser l’échelle</h2>

		<p>
			Le paramètre <KatexInline formula={'\\theta \\in \\mathbb{R}^d'} /> est un vecteur multidimensionnel,
			et le gradient <KatexInline formula={'g_t \\in \\mathbb{R}^d'} /> l'est aussi. Pour estimer l'échelle
			propre à chaque paramètre sans que les changements de signe ne s'annulent, on s'intéresse au carré
			du gradient calculé <strong>élément par élément</strong> (produit de Hadamard, noté <KatexInline
				formula={'g_t^{\\odot 2}'}
			/> ou <KatexInline formula={'g_t \\odot g_t'} />) :
		</p>

		<KatexBlock formula={v} />

		<p>
			Chaque coordonnée de <KatexInline formula={'v_t'} /> étant une moyenne pondérée de termes positifs,
			cette quantité mesure essentiellement une
			<strong>échelle récente du gradient pour chaque coordonnée</strong>.
		</p>

		<ExampleBlock number="4.1" title="Pourquoi prendre le carré ?">
			<p>
				Supposons que les gradients successifs pour une coordonnée donnée <KatexInline
					formula={'i'}
				/> soient :
			</p>

			<p class="sequence">
				<code>+10, −10, +10, −10, …</code>
			</p>

			<p>La moyenne de ces gradients peut être proche de zéro :</p>

			<KatexBlock formula={String.raw`\frac{1}{T}\sum_{t=1}^T g_{t,i} \approx 0`} />

			<p>Mais leurs carrés (qui sont des scalaires bien définis) restent importants :</p>

			<KatexBlock formula={String.raw`\frac{1}{T}\sum_{t=1}^T g_{t,i}^2 \approx 100`} />

			<p>
				Le premier moment dit donc : <strong
					>« la direction moyenne pour cette coordonnée est incertaine »</strong
				>. Le second dit : <strong>« la magnitude de ses gradients est pourtant grande »</strong>.
			</p>
		</ExampleBlock>

		<Callout type="warning" title="Attention au vocabulaire">
			<p>
				Chaque composante de <KatexInline formula={'v_t'} /> est un
				<strong>second moment brut</strong>. Ce n’est pas directement une variance centrée.
			</p>

			<p>La variance pour une coordonnée donnée <KatexInline formula={'i'} /> serait :</p>

			<KatexBlock
				formula={String.raw`\operatorname{Var}(g_i)=\mathbb{E}[g_i^2]-\mathbb{E}[g_i]^2`}
			/>
		</Callout>

		<h3>Pourquoi diviser par une racine ?</h3>

		<p>
			Le second moment est une quantité au carré. Pour revenir à une échelle comparable à celle du
			gradient, on prend sa racine carrée, calculée <strong>élément par élément</strong> sur le vecteur
			:
		</p>

		<KatexBlock formula={String.raw`\sqrt{\hat v_t}`} />

		<p>
			On obtient alors pour chaque coordonnée une sorte de mesure de la magnitude récente du
			gradient.
		</p>

		<Callout type="insight" title="La construction commence à apparaître">
			<p>Nous avons maintenant :</p>
			<ul>
				<li><strong>m̂</strong> : une direction lissée ;</li>
				<li><strong>√v̂</strong> : une échelle locale.</li>
			</ul>

			<p>Le ratio des deux va devenir le cœur d’Adam.</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 5. TWO MOMENTS                                            -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="deux-moments">Les deux mémoires du gradient</h2>

		<div class="two-columns">
			<div>
				<h3>Premier moment : direction</h3>

				<KatexBlock formula={m} />

				<p>
					Le premier moment conserve une information signée. Il indique dans quelle direction le
					gradient semble se déplacer.
				</p>

				<p>
					Il apporte surtout du <strong>lissage temporel</strong>.
				</p>
			</div>

			<div>
				<h3>Second moment : échelle</h3>

				<KatexBlock formula={v} />

				<p>Le second moment élimine le signe et conserve une information sur la magnitude.</p>

				<p>
					Il apporte surtout une <strong>normalisation par coordonnée</strong>.
				</p>
			</div>
		</div>

		<h3>Le ratio central</h3>

		<KatexBlock formula={adamDirection} />

		<p>C’est probablement l’expression la plus importante pour comprendre Adam.</p>

		<p>
			Si une coordonnée <KatexInline formula={'i'} /> possède habituellement de très grands gradients,
			son
			<KatexInline formula={'\\sqrt{\\hat v_{t,i}}'} /> devient grand et son déplacement est réduit.
		</p>

		<p>
			Si la coordonnée <KatexInline formula={'i'} /> possède des gradients beaucoup plus petits, son dénominateur
			est plus petit et elle peut recevoir une mise à jour relativement plus importante.
		</p>

		<Callout type="intuition" title="Une forme de normalisation">
			<p>
				Adam ne demande plus simplement :
				<strong>« quel est le gradient ? »</strong>
			</p>

			<p>
				Il demande plutôt :
				<strong>« quelle est la direction du gradient relativement à son échelle récente ? »</strong
				>
			</p>
		</Callout>

		<InteractiveSection
			number="5.1"
			title="Explorer les deux mémoires du gradient"
			onInteract={tracker.trackInteraction}
		>
			<AdamMomentsVisualizer />
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 6. FULL ALGORITHM                                         -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="algorithme">L’algorithme Adam complet</h2>

		<p>
			Nous pouvons maintenant assembler les pièces de manière rigoureuse dans l'espace
			multidimensionnel.
		</p>

		<DefinitionBlock number="6.1" title="Adam">
			<p>
				Soit un modèle avec <KatexInline formula={'d'} /> paramètres <KatexInline
					formula={'\\theta_t \\in \\mathbb{R}^d'}
				/>. À l’étape <KatexInline formula={'t'} />, on observe le vecteur de gradient
				<KatexInline formula={'g_t=\\nabla_\\theta L_t(\\theta_{t-1}) \\in \\mathbb{R}^d'} />.
			</p>

			<p>
				On entretient deux états internes (les mémoires de direction et d'échelle), représentés par
				des vecteurs de même dimension et initialisés au vecteur nul :
			</p>

			<KatexBlock
				formula={String.raw`m_0=\mathbf{0} \in \mathbb{R}^d,\qquad v_0=\mathbf{0} \in \mathbb{R}^d`}
			/>

			<p>
				Toutes les opérations vectorielles suivantes (le carré, la racine carrée, et la division)
				sont effectuées
				<strong>élément par élément</strong> (produit de Hadamard).
			</p>
		</DefinitionBlock>

		<h3>1. Mettre à jour la mémoire de direction (premier moment lissé)</h3>

		<KatexBlock formula={m} />

		<h3>2. Mettre à jour la mémoire d’échelle (second moment lissé)</h3>

		<p>
			On utilise le carré élément par élément du gradient, noté <KatexInline
				formula={'g_t^{\\odot 2}'}
			/> :
		</p>

		<KatexBlock formula={v} />

		<h3>3. Corriger le biais initial</h3>

		<p>
			On divise chaque vecteur par son coefficient de correction (qui est un scalaire) pour
			compenser l'initialisation à zéro :
		</p>

		<KatexBlock
			formula={String.raw`
			\hat m_t=\frac{m_t}{1-\beta_1^t},
			\qquad
			\hat v_t=\frac{v_t}{1-\beta_2^t}`}
		/>

		<h3>4. Construire le déplacement (mise à jour adaptative)</h3>

		<p>
			La racine carrée et la division du vecteur <KatexInline formula={'\\hat m_t'} /> par <KatexInline
				formula={'\\sqrt{\\hat v_t}+\\epsilon'}
			/> sont effectuées élément par élément :
		</p>

		<KatexBlock
			formula={String.raw`
			\Delta\theta_t
			=
			-\alpha
			\frac{\hat m_t}
			{\sqrt{\hat v_t}+\epsilon}`}
		/>

		<h3>5. Modifier les paramètres</h3>

		<KatexBlock formula={String.raw`\theta_t=\theta_{t-1}+\Delta\theta_t`} />

		<Callout type="summary" title="Adam en une phrase">
			<p>
				<strong>
					Adam lisse le gradient, estime son échelle, corrige l’initialisation de ses deux mémoires,
					puis utilise leur ratio pour produire la mise à jour.
				</strong>
			</p>
		</Callout>

		<InteractiveSection number="6.1" title="Adam pas à pas" onInteract={tracker.trackInteraction}>
			<AdamStepByStep />
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 7. BIAS                                                   -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="biais">Pourquoi corriger le biais ?</h2>

		<p>
			Le terme « correction du biais » peut sembler abstrait. Le problème est en réalité très
			concret : <strong>les deux mémoires commencent artificiellement à zéro</strong>.
		</p>

		<ExampleBlock number="7.1" title="Un gradient constant">
			<p>Supposons pour simplifier que :</p>

			<KatexBlock formula={String.raw`g_t=g\qquad\text{pour tout }t`} />

			<p>Au premier pas :</p>

			<KatexBlock
				formula={String.raw`
				m_1
				=
				(1-\beta_1)g`}
			/>

			<p>
				Si <KatexInline formula={'\\beta_1=0.9'} />, alors :
			</p>

			<KatexBlock formula={String.raw`m_1=0.1g`} />

			<p>La mémoire contient seulement 10 % de la valeur vers laquelle elle devrait tendre.</p>
		</ExampleBlock>

		<p>
			Plus généralement, sous l’hypothèse d’un gradient stationnaire (où chaque coordonnée <KatexInline
				formula={'i'}
			/> du gradient a une espérance constante au cours du temps) :
		</p>

		<KatexBlock formula={biasCorrection} />

		<TheoremBlock number="7.1" title="Correction de l’initialisation">
			<p>
				Les facteurs
				<KatexInline formula={'1-\\beta_1^t'} /> et
				<KatexInline formula={'1-\\beta_2^t'} />
				quantifient l’effet de l’initialisation à zéro.
			</p>

			<p>
				Les diviser permet de ramener les estimateurs vers l’échelle de la quantité qu’ils cherchent
				à représenter.
			</p>
		</TheoremBlock>

		<Callout type="insight" title="Pourquoi surtout au début ?">
			<p>
				Pour <KatexInline formula={'t'} /> grand, les puissances
				<KatexInline formula={'\\beta^t'} /> deviennent petites et
				<KatexInline formula={'1-\\beta^t\\approx1'} />.
			</p>

			<p>La correction est donc particulièrement importante pendant les premiers pas.</p>
		</Callout>

		<InteractiveSection
			number="7.1"
			title="Voir la correction du biais"
			onInteract={tracker.trackInteraction}
		>
			<AdamBiasCorrectionExplorer />
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 8. PRECONDITIONER                                         -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="preconditionneur">Adam comme préconditionneur</h2>

		<p>
			Une autre manière très utile de comprendre Adam consiste à regrouper le dénominateur avec le
			learning rate.
		</p>

		<KatexBlock formula={effectiveRate} />

		<p>On peut alors écrire :</p>

		<KatexBlock
			formula={String.raw`
			\Delta\theta_{t,i}
			=
			-\alpha_{t,i}^{\mathrm{eff}}
			\hat m_{t,i}`}
		/>

		<p>
			Cette écriture révèle quelque chose d’important :
			<strong>Adam possède un taux effectif différent pour chaque coordonnée</strong>.
		</p>

		<div class="flow">
			<div>gradient brut</div>
			<div>→</div>
			<div>m̂ : direction</div>
			<div>→</div>
			<div>v̂ : échelle</div>
			<div>→</div>
			<div>normalisation</div>
			<div>→</div>
			<div>mise à jour</div>
		</div>

		<Callout type="warning" title="Mais Adam ne supprime pas α">
			<p>
				Le facteur global <KatexInline formula={'\\alpha'} /> reste présent. Adam adapte les pas
				<strong>relativement entre les coordonnées</strong>, mais il ne choisit pas magiquement
				l’échelle globale appropriée.
			</p>
		</Callout>

		<InteractiveSection
			number="8.1"
			title="Explorer le taux d’apprentissage effectif"
			onInteract={tracker.trackInteraction}
		>
			<EffectiveLearningRateExplorer />
		</InteractiveSection>

		<Callout type="warning" title="Ce n’est pas Newton">
			<p>
				Le préconditionneur d’Adam est essentiellement diagonal et construit à partir des gradients
				passés. Adam n’est donc pas une approximation directe de la Hessienne.
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 9. BETAS                                                   -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="beta">β₁, β₂ et ε : trois rôles différents</h2>

		<h3>β₁ : combien de temps se souvenir de la direction ?</h3>

		<p>Le coefficient β₁ contrôle la mémoire du premier moment.</p>

		<p>
			Une valeur élevée signifie que les anciens gradients continuent à influencer fortement la
			direction actuelle.
		</p>

		<ExercisePanel title="Prédiction">
			<p>
				Si la fonction de perte change brutalement de régime, que se passe-t-il si β₁ est très élevé
				?
			</p>
			{#snippet solution()}
				<p>
					La réponse attendue est : <strong
						>la mémoire peut continuer à pousser dans l’ancienne direction</strong
					>.
				</p>
			{/snippet}
		</ExercisePanel>

		<h3>β₂ : combien de temps se souvenir de l’échelle ?</h3>

		<p>Le second moment possède sa propre mémoire (calculée avec le carré élément par élément) :</p>

		<KatexBlock formula={String.raw`v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^{\odot 2}`} />

		<p>Une approximation intuitive de l’échelle de mémoire est :</p>

		<KatexBlock formula={String.raw`N_{\mathrm{mémoire}}\sim\frac{1}{1-\beta_2}`} />

		<p>Ainsi, β₂ = 0.999 correspond à une mémoire beaucoup plus longue que β₂ = 0.9.</p>

		<Callout type="insight" title="Stabilité contre adaptabilité">
			<ul>
				<li>mémoire longue → estimation plus stable ;</li>
				<li>mémoire courte → adaptation plus rapide ;</li>
				<li>mais mémoire longue → risque de conserver une information devenue obsolète.</li>
			</ul>
		</Callout>

		<InteractiveSection
			number="9.1"
			title="β₂ et non-stationnarité"
			onInteract={tracker.trackInteraction}
		>
			<Beta2NonStationarityExplorer />
		</InteractiveSection>

		<h3>ε : le petit terme qui peut devenir important</h3>

		<p>Adam ajoute :</p>

		<p>
			Pour chaque coordonnée <KatexInline formula={'i'} />, Adam ajoute un terme de régularisation
			numérique :
		</p>

		<KatexBlock
			formula={String.raw`
			\frac{1}{\sqrt{\hat v_{t,i}}+\epsilon}`}
		/>

		<p>
			Lorsque <KatexInline formula={'\\sqrt{\\hat v_{t,i}}'} /> est grand devant ε, celui-ci a très peu
			d’effet.
		</p>

		<p>
			Lorsque <KatexInline formula={'\\sqrt{\\hat v_{t,i}}'} /> devient extrêmement petit, ε contrôle
			directement la taille du dénominateur.
		</p>

		<Callout type="warning" title="Ne pas interpréter ε comme un simple détail numérique">
			<p>
				ε est nécessaire pour éviter certaines divisions problématiques, mais sa position dans la
				formule signifie également qu’il peut modifier la dynamique lorsque les gradients sont très
				petits.
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 10. LEARNING RATE                                         -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="learning-rate">Le learning rate</h2>

		<p>
			L’une des idées fausses les plus fréquentes est :
			<strong>« Adam adapte automatiquement le learning rate. »</strong>
		</p>

		<p>La formulation correcte est plus subtile.</p>

		<p>
			Adam adapte les taux <strong>relatifs entre coordonnées</strong> à partir de
			<KatexInline formula={'\\hat v_t'} />, mais le facteur global
			<KatexInline formula={'\\alpha'} /> reste fixé par l’utilisateur ou par un scheduler.
		</p>

		<KatexBlock
			formula={String.raw`
		\alpha_{t,i}^{\mathrm{eff}}
		=
		\frac{\alpha}
		{\sqrt{\hat v_{t,i}}+\epsilon}`}
		/>

		<h3>Si α est trop grand</h3>

		<ul>
			<li>oscillations ;</li>
			<li>perte qui augmente ;</li>
			<li>mises à jour excessivement grandes ;</li>
			<li>éventuellement divergence.</li>
		</ul>

		<h3>Si α est trop petit</h3>

		<ul>
			<li>apprentissage très lent ;</li>
			<li>stagnation apparente ;</li>
			<li>risque de ne pas exploiter correctement la capacité du modèle.</li>
		</ul>

		<Callout type="intuition" title="Une séparation utile">
			<p>
				<strong>Adam décide comment répartir le pas entre les coordonnées.</strong>
			</p>
			<p>
				<strong>α décide de l’échelle globale de ces pas.</strong>
			</p>
		</Callout>

		<p>
			Les warmups, decays et autres schedules modifient ensuite cette échelle globale au cours du
			temps.
		</p>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 11. GENERALISATION                                        -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="generalisation">Optimisation et généralisation</h2>

		<p>Un optimiseur est évalué sur au moins deux dimensions différentes :</p>

		<div class="comparison">
			<div class="comparison-card">
				<h3>Question 1</h3>
				<p>À quelle vitesse la perte d’entraînement diminue-t-elle ?</p>
			</div>

			<div class="comparison-card">
				<h3>Question 2</h3>
				<p>Quelle performance obtient-on sur des données non vues ?</p>
			</div>
		</div>

		<p>Ces deux questions ne sont pas équivalentes.</p>

		<ExampleBlock number="11.1" title="Deux trajectoires possibles">
			<p>Imaginez deux entraînements :</p>

			<ul>
				<li>Adam atteint très rapidement une perte d’entraînement faible ;</li>
				<li>
					SGD descend plus lentement mais atteint finalement une meilleure performance de
					validation.
				</li>
			</ul>

			<p>
				On ne peut pas conclure que SGD est « meilleur » ou qu’Adam est « mauvais » sans préciser le
				critère.
			</p>
		</ExampleBlock>

		<Callout type="warning" title="Attention aux slogans">
			<p>
				« SGD généralise mieux qu’Adam » n’est pas une loi universelle. Le résultat dépend notamment
				du modèle, du dataset, du budget d’entraînement, de la régularisation et des
				hyperparamètres.
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 12. ADAMW                                                  -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="adamw">Adam vs AdamW</h2>

		<p>
			Le weight decay est souvent présenté comme une simple pénalité L2. Avec Adam, cette
			équivalence devient subtile.
		</p>

		<h3>Adam avec pénalité L2</h3>

		<p>On modifie la fonction objectif :</p>

		<KatexBlock
			formula={String.raw`
			L_{\mathrm{total}}(\theta)
			=
			L(\theta)
			+
			\frac{\lambda}{2}\|\theta\|^2`}
		/>

		<p>Le gradient devient :</p>

		<KatexBlock
			formula={String.raw`
			\nabla L_{\mathrm{total}}
			=
			\nabla L+\lambda\theta`}
		/>

		<p>
			Le terme de régularisation entre alors dans le gradient et est lui-même soumis aux mécanismes
			adaptatifs d’Adam.
		</p>

		<h3>AdamW</h3>

		<p>AdamW sépare explicitement la décroissance des poids de la mise à jour adaptative :</p>

		<KatexBlock formula={adamw} />

		<Callout type="insight" title="L’idée importante">
			<p>
				Avec AdamW, la régularisation n’est plus traitée comme une composante du gradient qui doit
				ensuite passer par la normalisation adaptative.
			</p>

			<p>On impose directement une contraction des paramètres.</p>
		</Callout>

		<InteractiveSection
			number="12.1"
			title="Adam et AdamW : comparer les trajectoires"
			onInteract={tracker.trackInteraction}
		>
			<AdamVsAdamWDecayExplorer />
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 13. FAILURE MODES                                         -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="echecs">Quand Adam échoue</h2>

		<p>Comprendre Adam signifie aussi comprendre pourquoi il peut mal se comporter.</p>

		<h3>Échec 1 — learning rate trop grand</h3>

		<p>L’adaptation coordonnée ne protège pas contre une échelle globale excessive.</p>

		<h3>Échec 2 — mémoire trop lente</h3>

		<p>
			Des valeurs élevées de β₁ ou β₂ peuvent conserver une information qui n’est plus pertinente.
		</p>

		<h3>Échec 3 — gradients extrêmement faibles</h3>

		<p>La contribution de ε peut devenir non négligeable.</p>

		<h3>Échec 4 — optimisation réussie, généralisation médiocre</h3>

		<p>Une faible perte d’entraînement n’implique pas une bonne performance hors échantillon.</p>

		<h3>Échec 5 — problème structurel du modèle</h3>

		<p>
			Changer d’optimiseur ne corrige pas nécessairement une architecture mal adaptée, des données
			mal normalisées ou un signal absent.
		</p>

		<Callout type="warning" title="Un optimiseur n’est pas un détecteur de problème">
			<p>Si l’entraînement ne fonctionne pas, il faut distinguer :</p>
			<ol>
				<li>un problème de dynamique d’optimisation ;</li>
				<li>un problème de données ;</li>
				<li>un problème de représentation ;</li>
				<li>un problème d’objectif ;</li>
				<li>un problème de capacité du modèle.</li>
			</ol>
		</Callout>

		<InteractiveSection
			number="13.1"
			title="Laboratoire des modes d’échec"
			onInteract={tracker.trackInteraction}
		>
			<AdamFailureModesLab />
		</InteractiveSection>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 14. DIAGNOSTIC                                            -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="diagnostic">Diagnostiquer un entraînement</h2>

		<p>
			Avant de changer l’architecture ou de remplacer Adam, il est utile de regarder les quantités
			qui décrivent réellement la dynamique.
		</p>

		<h3>Les cinq quantités à surveiller</h3>

		<div class="metric-grid">
			<div>
				<strong>Loss</strong>
				<p>Le problème est-il effectivement optimisé ?</p>
			</div>

			<div>
				<strong>‖g‖</strong>
				<p>Quelle est l’échelle du gradient courant ?</p>
			</div>

			<div>
				<strong>‖Δθ‖</strong>
				<p>Quelle est la taille réelle du déplacement ?</p>
			</div>

			<div>
				<strong>‖θ‖</strong>
				<p>Quelle est l’échelle des paramètres ?</p>
			</div>

			<div>
				<strong>v̂</strong>
				<p>Quelle échelle de gradient Adam mémorise-t-il ?</p>
			</div>
		</div>

		<p>Un ratio particulièrement utile est :</p>

		<KatexBlock formula={updateRatio} />

		<p>
			Il donne une idée de l’importance relative de la mise à jour par rapport à l’échelle des
			paramètres.
		</p>

		<table class="diagnostic">
			<thead>
				<tr>
					<th>Symptôme</th>
					<th>Première inspection</th>
					<th>Hypothèse possible</th>
				</tr>
			</thead>

			<tbody>
				<tr>
					<td>Perte qui explose</td>
					<td>α, ‖Δθ‖</td>
					<td>Pas trop grands</td>
				</tr>

				<tr>
					<td>Entraînement bloqué</td>
					<td>αeff, v̂</td>
					<td>Pas effectif trop faible</td>
				</tr>

				<tr>
					<td>Réaction lente</td>
					<td>β₁, β₂</td>
					<td>Mémoire trop longue</td>
				</tr>

				<tr>
					<td>Instabilité initiale</td>
					<td>Premiers pas, α</td>
					<td>Échelle initiale inadaptée</td>
				</tr>

				<tr>
					<td>Train excellent, validation faible</td>
					<td>Validation, weight decay</td>
					<td>Généralisation</td>
				</tr>

				<tr>
					<td>Un groupe de paramètres apprend très peu</td>
					<td>v̂ par groupe</td>
					<td>Échelle adaptative défavorable</td>
				</tr>
			</tbody>
		</table>

		<Callout type="insight" title="Principe de diagnostic">
			<p>
				<strong>Mesurer avant de modifier.</strong>
			</p>

			<p>
				Un changement d’optimiseur sans diagnostic change plusieurs propriétés de la dynamique en
				même temps et rend souvent la cause du problème plus difficile à identifier.
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 15. EXERCISES                                             -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="exercises">Exercices de compréhension</h2>

		<h3>Exercice 1 — prédire le signe</h3>

		<ExercisePanel title="Un changement brutal de direction">
			<p>Le gradient vaut successivement :</p>
			<p class="sequence">
				<code>+5, +5, +5, −5</code>
			</p>
			<p>
				Avec un β₁ élevé, le quatrième gradient va-t-il immédiatement inverser la direction de <KatexInline
					formula={'m_t'}
				/> ?
			</p>
			{#snippet solution()}
				<p>
					Non : <KatexInline formula={'m_t'} /> contient encore une forte contribution des trois gradients
					précédents.
				</p>
			{/snippet}
		</ExercisePanel>

		<h3>Exercice 2 — même direction, échelles différentes</h3>

		<ExercisePanel title="Deux coordonnées">
			<p>Deux paramètres ont des gradients persistants :</p>
			<ul>
				<li><code>θ₁ : g ≈ 100</code></li>
				<li><code>θ₂ : g ≈ 0.1</code></li>
			</ul>
			<p>Quel mécanisme d’Adam réduit la différence d’échelle entre leurs mises à jour ?</p>
			{#snippet solution()}
				<p>
					Regardez le rôle de la normalisation par coordonnée avec <KatexInline
						formula={'\\sqrt{\\hat v_{t,i}}'}
					/>.
				</p>
			{/snippet}
		</ExercisePanel>

		<h3>Exercice 3 — β₂ et changement de régime</h3>

		<ExercisePanel title="Un changement soudain">
			<p>
				Pendant 10 000 itérations, les gradients sont grands. Puis le problème entre dans une région
				où ils deviennent très petits.
			</p>
			<p>Que peut-il se passer si β₂ est très proche de 1 ?</p>
			{#snippet solution()}
				<p>
					La mémoire de <KatexInline formula={'v_t'} /> ne disparaît pas immédiatement.
				</p>
			{/snippet}
		</ExercisePanel>

		<h3>Exercice 4 — reconstruire Adam</h3>

		<ExercisePanel title="Sans regarder la formule">
			<p>Essayez de reconstruire Adam à partir des quatre questions suivantes :</p>

			<ol>
				<li>Comment lisser la direction ?</li>
				<li>Comment mémoriser l’échelle ?</li>
				<li>Pourquoi corriger les deux mémoires au début ?</li>
				<li>Comment transformer ces deux informations en déplacement ?</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>EMA du gradient → <KatexInline formula={'m_t'} />.</li>
					<li>
						EMA du carré élément par élément → <KatexInline formula={'v_t'} /> (noté <KatexInline
							formula={'v_t = \\beta_2v_{t-1}+(1-\\beta_2)g_t^{\\odot 2}'}
						/>).
					</li>
					<li>
						Division par <KatexInline formula={'1-\\beta^t'} /> → correction du biais initial.
					</li>
					<li>
						<KatexInline formula={'\\hat m_{t,i}/(\\sqrt{\\hat v_{t,i}}+\\epsilon)'} /> (ou sa version
						vectorielle) → direction normalisée.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- 16. SYNTHESIS                                             -->
	<!-- ========================================================= -->

	<TheorySection>
		<h2 id="synthese">Synthèse : le modèle mental d’Adam</h2>

		<p>
			Si vous ne devez retenir qu’une seule représentation mentale, imaginez Adam comme
			<strong>un observateur qui regarde une série temporelle de gradients</strong>.
		</p>

		<div class="mental-model">
			<div class="mental-step">
				<span>1</span>
				<strong>Observer</strong>
				<p>Le gradient courant <KatexInline formula={'g_t'} />.</p>
			</div>

			<div class="mental-step">
				<span>2</span>
				<strong>Mémoriser la direction</strong>
				<p><KatexInline formula={'m_t'} /> filtre les changements rapides.</p>
			</div>

			<div class="mental-step">
				<span>3</span>
				<strong>Mémoriser l’échelle</strong>
				<p>
					<KatexInline formula={'v_t'} /> mesure l’amplitude récente (carré élément par élément).
				</p>
			</div>

			<div class="mental-step">
				<span>4</span>
				<strong>Normaliser</strong>
				<p>Le ratio (élément par élément) compare direction et échelle.</p>
			</div>

			<div class="mental-step">
				<span>5</span>
				<strong>Déplacer</strong>
				<p><KatexInline formula={'\\alpha'} /> fixe l’échelle globale du mouvement.</p>
			</div>
		</div>

		<Callout type="summary" title="Les idées essentielles">
			<ol>
				<li>
					<strong>Adam possède une mémoire.</strong>
					Il ne dépend pas uniquement du gradient instantané.
				</li>

				<li>
					<strong>Il possède deux mémoires.</strong>
					Le premier moment encode une direction lissée ; le second moment encode une échelle.
				</li>

				<li>
					<strong
						>La division par <KatexInline formula={'\\sqrt{\\hat v_t}'} /> (élément par élément) est une
						normalisation adaptative par coordonnée.</strong
					>
				</li>

				<li>
					<strong>La correction du biais compense l’initialisation à zéro</strong>
					des deux mémoires.
				</li>

				<li>
					<strong>β₁ contrôle principalement la mémoire directionnelle.</strong>
				</li>

				<li>
					<strong>β₂ contrôle principalement la mémoire de l’échelle.</strong>
				</li>

				<li>
					<strong>ε stabilise le dénominateur</strong>
					et peut influencer la dynamique lorsque les gradients sont très petits.
				</li>

				<li>
					<strong>α reste essentiel.</strong>
					Adam adapte les pas relativement entre coordonnées mais ne choisit pas automatiquement l’échelle
					globale idéale.
				</li>

				<li>
					<strong>Adam n’est pas Newton.</strong>
					Il ne construit pas une approximation complète de la Hessienne.
				</li>

				<li>
					<strong>AdamW sépare le weight decay de la mise à jour adaptative.</strong>
				</li>

				<li>
					<strong
						>Une bonne optimisation n’implique pas nécessairement une bonne généralisation.</strong
					>
				</li>

				<li>
					<strong
						>Diagnostiquer la dynamique est souvent plus informatif que changer immédiatement
						d’optimiseur.</strong
					>
				</li>
			</ol>

			<p>
				<strong>
					Le bon modèle mental n’est donc pas « Adam est un SGD plus intelligent ». C’est plutôt :
					Adam transforme l’historique des gradients en une estimation de direction et d’échelle,
					puis utilise ces estimations pour construire une mise à jour adaptative.
				</strong>
			</p>
		</Callout>
	</TheorySection>

	<!-- ========================================================= -->
	<!-- BIBLIOGRAPHY                                               -->
	<!-- ========================================================= -->

	<Bibliography>
		<BibElement
			authors={['Kingma, D. P.', 'Ba, J.']}
			year={2015}
			title="Adam: A Method for Stochastic Optimization"
			journal="ICLR"
			link="https://arxiv.org/abs/1412.6980"
		/>

		<BibElement
			authors={['Duchi, J.', 'Hazan, E.', 'Singer, Y.']}
			year={2011}
			title="Adaptive Subgradient Methods for Online Learning and Stochastic Optimization"
			journal="JMLR, 12, 2121–2159"
		/>

		<BibElement
			authors={['Reddi, S. J.', 'Kale, S.', 'Kumar, S.']}
			year={2018}
			title="On the Convergence of Adam and Beyond"
			journal="ICLR"
		/>

		<BibElement
			authors={['Wilson, A. C.', 'Roelofs, R.', 'Stern, M.', 'Srebro, N.', 'Recht, B.']}
			year={2017}
			title="The Marginal Value of Adaptive Gradient Methods in Machine Learning"
			journal="NeurIPS"
		/>

		<BibElement
			authors={['Loshchilov, I.', 'Hutter, F.']}
			year={2019}
			title="Decoupled Weight Decay Regularization"
			journal="ICLR"
		/>

		<BibElement
			authors={['Sahu, S.', 'Sarkar, A.', 'Hogan, C. J.', 'Wells, M. T.']}
			year={2026}
			title="Adapt or Forget: Provable Tradeoffs Between Adam and SGD in Nonstationary Optimization"
			journal="arXiv preprint"
			link="https://arxiv.org/abs/2605.04269"
		/>
	</Bibliography>
</PageTemplate>

<style>
	.two-columns {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.two-columns > div {
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.comparison {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.comparison-card {
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.comparison-card h3 {
		margin-top: 0;
	}

	.large-number {
		font-size: 1.2rem;
		font-family: monospace;
	}

	.sequence {
		text-align: center;
		font-size: 1.15rem;
	}

	.parameter-grid,
	.metric-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 1.5rem 0;
	}

	.parameter-grid > div,
	.metric-grid > div {
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.parameter-grid p,
	.metric-grid p {
		margin-bottom: 0;
		color: var(--color-text-muted);
	}

	.flow {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 2rem 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font-weight: 600;
	}

	.flow > div {
		padding: 0.4rem 0.7rem;
	}

	.mental-model {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 2rem 0;
	}

	.mental-step {
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.mental-step > span {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		margin-bottom: 0.75rem;
		border-radius: 50%;
		background: var(--color-surface-raised, var(--color-surface));
		border: 1px solid var(--color-border);
		font-weight: 700;
	}

	.mental-step p {
		color: var(--color-text-muted);
	}

	.diagnostic {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}

	.diagnostic th,
	.diagnostic td {
		padding: 0.7rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	.diagnostic th {
		color: var(--color-text-muted);
	}

	@media (max-width: 900px) {
		.mental-model {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 650px) {
		.two-columns,
		.comparison,
		.parameter-grid,
		.metric-grid {
			grid-template-columns: 1fr;
		}

		.mental-model {
			grid-template-columns: 1fr;
		}

		.flow {
			flex-direction: column;
		}
	}
</style>
