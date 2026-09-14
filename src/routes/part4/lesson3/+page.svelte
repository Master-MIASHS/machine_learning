<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { TocEntry } from '$lib/components/narrative/TableOfContents.svelte';

	const meta = getPageByPath('/part4/lesson3');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Formules (course_sources/sophie/StatM1S1_2025.pdf, §I.6–I.7, diapos 22–40) ──
	const h3Vec = String.raw`\varepsilon \sim \mathcal{N}_n(0_n, \sigma^2 I_n)`;
	const loglik = String.raw`\ell(\beta, \sigma^2) = -\tfrac{n}{2}\log(2\pi) - \tfrac{n}{2}\log\sigma^2 - \tfrac{1}{2\sigma^2}\|Y - X\beta\|^2`;
	const mle = String.raw`\hat{\beta}^{\mathrm{MV}} = \hat{\beta}, \qquad \hat{\sigma}^{2}_{\mathrm{MV}} = \frac{\mathrm{SCR}}{n}`;
	const loisBeta = String.raw`\hat{\beta} \sim \mathcal{N}_{p+1}\!\left(\beta,\ \sigma^2 (X^\top X)^{-1}\right)`;
	const loisChisq = String.raw`\frac{(n-p-1)\hat{\sigma}^2}{\sigma^2} \sim \chi^2(n-p-1)`;
	const loisT = String.raw`T_{j-1} = \frac{\hat{\beta}_j - \beta_j}{\hat{\sigma}\sqrt{(X^\top X)^{-1}_{jj}}} \sim \text{Student}(n-p-1)`;
	const icBeta = String.raw`IC_{1-\alpha}(\beta_j) = \hat{\beta}_j \pm t_{n-p-1}(1-\alpha/2)\ \hat{\sigma}\sqrt{(X^\top X)^{-1}_{jj}}`;
	const fGlobal = String.raw`F = \frac{\mathrm{SCE}/p}{\mathrm{SCR}/(n-p-1)} \sim F_{p,\,n-p-1}`;
	const fNested = String.raw`F_q = \frac{(R^2 - R_q^2)/q}{(1 - R^2)/(n-p-1)} \sim F_{q,\,n-p-1}`;
	const icMoy = String.raw`\hat{y}_0 \pm t_{n-p-1}(1-\alpha/2)\ \hat{\sigma}\sqrt{v_0^\top(X^\top X)^{-1}v_0}`;
	const icPred = String.raw`\hat{y}_0 \pm t_{n-p-1}(1-\alpha/2)\ \hat{\sigma}\sqrt{1 + v_0^\top(X^\top X)^{-1}v_0}`;
	const h2prime = String.raw`\mathrm{Cov}(\varepsilon) = \sigma^2 \mathcal{F}`;
	const varOlsCorr = String.raw`\mathrm{Var}(\hat{\beta}) = \sigma^2 (X^\top X)^{-1} X^\top\mathcal{F}X (X^\top X)^{-1}`;
	const gls = String.raw`\hat{\beta}_{\mathrm{MCG}} = (X^\top\mathcal{F}^{-1}X)^{-1} X^\top\mathcal{F}^{-1} Y`;
	const glsVar = String.raw`\mathrm{Var}(\hat{\beta}_{\mathrm{MCG}}) = \sigma^2 (X^\top\mathcal{F}^{-1}X)^{-1}`;
	const glsSig = String.raw`\hat{\sigma}^{2}_{\mathrm{MCG}} = \frac{(Y - X\hat{\beta}_{\mathrm{MCG}})^\top\mathcal{F}^{-1}(Y - X\hat{\beta}_{\mathrm{MCG}})}{n-p-1}`;

	// ── Formules du panneau expert « bootstrap » (expert/part4/lesson3/
	//    bootstrap-theorie.md + .research.md ; sources primaires citées là) ──
	const bootConsMean = String.raw`\sqrt{n}\,\bigl(\bar{X}^{*}_{n} - \bar{X}_{n}\bigr) \ \Rightarrow\ \mathcal{N}(0, \sigma^2), \qquad s^{*2}_{n} \xrightarrow{\;p\;} \sigma^2`;
	const bootConsOls = String.raw`\sup_x \Bigl| \mathbb{P}^{*}\!\bigl(\hat{\beta}^{*} - \hat{\beta} \le x\bigr) - \mathbb{P}\!\bigl(\hat{\beta} - \beta \le x\bigr) \Bigr| \xrightarrow{\;p\;} 0`;
	const bootIcPerc = String.raw`\mathrm{IC}_{1-\alpha}^{\,\mathrm{perc}}(\beta_j) = \bigl[\, q^{*}_{\alpha/2},\; q^{*}_{1-\alpha/2} \,\bigr]`;
	const bootIcStud = String.raw`\mathrm{IC}_{1-\alpha}^{\,\mathrm{stud}}(\beta_j) = \bigl[\, \hat{\beta}_j - \widehat{se}_j \, t^{*}_{1-\alpha/2}, \quad \hat{\beta}_j - \widehat{se}_j \, t^{*}_{\alpha/2} \,\bigr], \qquad t^{*} = \frac{\hat{\beta}^{*} - \hat{\beta}}{SE(\hat{\beta}^{*})}`;
	const bootWild = String.raw`Y^{*}_{i} = X_{i}\hat{\beta} + \hat{\varepsilon}_{i} \, v_{i}, \qquad \mathbb{E}[v_{i}] = 0,\quad \mathbb{E}[v_{i}^{2}] = 1`;
	const bootMaxFail = String.raw`\mathbb{P}^{*}\!\bigl\{ X^{*}_{(n)} = X_{(n)} \mid \hat{F}_{n} \bigr\} \;=\; 1 - \bigl(1 - \tfrac{1}{n}\bigr)^{\!n} \;\xrightarrow{\;n\to\infty\;} 1 - \tfrac{1}{e} \approx 0{,}63`;

	const tocEntries: TocEntry[] = [
		{ id: 'h3', label: 'L’hypothèse gaussienne (H3)', color: 'belief' },
		{ id: 'mv', label: 'Maximum de vraisemblance', color: 'neutral' },
		{ id: 'lois', label: 'Lois d’échantillonnage', color: 'positive' },
		{ id: 'student', label: 'Intervalles de confiance et test de Student', color: 'surprise' },
		{ id: 'fisher', label: 'Inférence sur le modèle : le test F', color: 'agent' },
		{ id: 'prev', label: 'Prévisions', color: 'belief' },
		{ id: 'mcg', label: 'Moindres carrés généralisés', color: 'neutral' }
	];
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Inférence dans le modèle gaussien'}
	subtitle="Lois d’échantillonnage, tests de Student et de Fisher, prévisions, moindres carrés généralisés"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="h3">L’hypothèse gaussienne (H3)</h2>

		<p>
			Les leçons précédentes ont donné, sous (H1)–(H2) : l’estimateur
			<KatexInline formula={String.raw`\hat{\beta} = (X^\top X)^{-1}X^\topY`} />, ses propriétés
			(sans biais,
			<KatexInline formula={String.raw`\mathrm{Var}(\hat{\beta}) = \sigma^2 (X^\top X)^{-1}`} />),
			et l’estimateur sans biais
			<KatexInline formula={String.raw`\hat{\sigma}^2 = \mathrm{SCR}/(n-p-1)`} />. Mais
			<strong>aucune loi</strong>
			: on ne sait pas à quoi ressemble la distribution de <KatexInline
				formula={String.raw`\hat{\beta}`}
			/> dans l’échantillonnage, donc on ne peut ni construire d’intervalle de confiance, ni conduire
			de test. Pour de l’inférence exacte en petit échantillon, on raffortit (H2) en une hypothèse de
			loi complète.
		</p>

		<DefinitionBlock number="3.1" title="Hypothèse (H3) : erreurs gaussiennes">
			<p>
				Les erreurs <KatexInline formula={String.raw`\varepsilon_i`} /> sont
				<strong>indépendantes</strong> et suivent la loi normale
				<KatexInline formula={String.raw`\mathcal{N}(0, \sigma^2)`} />. En forme vectorielle :
			</p>
			<KatexBlock formula={h3Vec} />
			<p>
				(H3) implique (H2) :
				<KatexInline formula={String.raw`\mathrm{E}[\varepsilon] = 0_n`} /> et
				<KatexInline formula={String.raw`\mathrm{Cov}(\varepsilon) = \sigma^2 I_n`} />. Tous les
				résultats de la leçon 1 restent donc valides ; (H3) apporte en plus les
				<strong>lois exactes</strong> de tous les estimateurs ci-dessous — sans approximation asymptotique.
			</p>
		</DefinitionBlock>

		<h2 id="mv">Maximum de vraisemblance</h2>

		<p>
			Sous (H3),
			<KatexInline
				formula={String.raw`Y = X\beta + \varepsilon \sim \mathcal{N}_n(X\beta, \sigma^2 I_n)`}
			/>
			: la densité de
			<KatexInline formula="Y" /> est la vraisemblance de
			<KatexInline formula={String.raw`(\beta, \sigma^2)`} />. Le
			<strong>log-vraisemblance</strong> vaut
		</p>

		<KatexBlock formula={loglik} />

		<p>
			À <KatexInline formula={String.raw`\sigma^2`} /> fixé, maximiser
			<KatexInline formula={String.raw`\ell`} /> par rapport à
			<KatexInline formula="\beta" /> revient à minimiser
			<KatexInline formula={String.raw`\|Y - X\beta\|^2`} /> : c’est exactement le problème des moindres
			carrés.
		</p>

		<TheoremBlock number="3.2" title="Théorème 2 (maximum de vraisemblance)">
			<p>Sous (H1)–(H3), les estimateurs du maximum de vraisemblance sont</p>
			<KatexBlock formula={mle} />
			<p>
				avec <KatexInline formula={String.raw`\hat{\beta}`} /> l’estimateur des
				<strong>moindres carrés ordinaires</strong> de la leçon 1, et
				<KatexInline formula={String.raw`\mathrm{SCR}`} /> la somme des carrés des résidus. Le Théorème
				2 des sources ne donne que
				<KatexInline formula={String.raw`\hat{\beta}^{\mathrm{MV}} = \hat{\beta}`} />
				;
				<KatexInline formula={String.raw`\hat{\sigma}^2_{\mathrm{MV}} = \mathrm{SCR}/n`} />
				vient de la remarque qui suit (dérivée du log-vraisemblance par rapport à
				<KatexInline formula={String.raw`\sigma^2`} /> nulle).
			</p>
		</TheoremBlock>

		<p>
			Attention à la différence de dénominateur :
			<KatexInline formula={String.raw`\hat{\sigma}^2_{\mathrm{MV}} = \mathrm{SCR}/n`} />
			est <strong>biaisé</strong> (il sous-estime
			<KatexInline formula={String.raw`\sigma^2`} />), tandis que
			<KatexInline formula={String.raw`\hat{\sigma}^2 = \mathrm{SCR}/(n-p-1)`} />
			est <strong>sans biais</strong> — c’est lui que l’on utilise partout dans le cours. La raison
			apparaîtra avec la loi du khi-deux ci-dessous : le vecteur des résidus vit dans un sous-espace
			de dimension
			<KatexInline formula={String.raw`n - p - 1`} />, d’où les
			<KatexInline formula={String.raw`n - p - 1`} /> degrés de liberté.
		</p>

		<h2 id="lois">Lois d’échantillonnage</h2>

		<p>
			Sous (H3), <KatexInline formula="Y" /> est gaussienne. Comme
			<KatexInline formula={String.raw`\hat{\beta} = (X^\top X)^{-1}X^\topY`} />
			et
			<KatexInline formula={String.raw`\hat{\varepsilon} = Y - X\hat{\beta}`} /> sont des
			<strong>combinaisons linéaires</strong>
			de
			<KatexInline formula="Y" />, ils sont gaussiens — et leurs lois s’obtiennent exacte.
		</p>

		<TheoremBlock number="3.3" title="Lois d’échantillonnage sous (H3)">
			<p>
				Sous (H1)–(H3), avec <KatexInline formula="p" /> régresseurs (
				<KatexInline formula={String.raw`p+1`} /> paramètres au total) :
			</p>
			<ul>
				<li>
					<KatexBlock formula={loisBeta} />
				</li>
				<li>
					<KatexBlock formula={loisChisq} />
				</li>
				<li>
					<KatexInline formula={String.raw`\hat{\beta}`} /> et
					<KatexInline formula={String.raw`\hat{\sigma}^2`} /> sont
					<strong>indépendants</strong> ;
				</li>
				<li>
					et donc, pour chaque coefficient
					<KatexInline formula={String.raw`j \in \{0, \dots, p\}`} />
					(les sources indexent
					<KatexInline formula={String.raw`j = 1, \dots, p+1`} />
					, le
					<KatexInline formula={String.raw`\beta_0`} />
					étant en
					<KatexInline formula={String.raw`j = 1`} />
					) :
					<KatexBlock formula={loisT} />
				</li>
			</ul>
		</TheoremBlock>

		<p>
			Lire la dernière ligne : le numérateur
			<KatexInline formula={String.raw`\hat{\beta}_j - \beta_j`} /> est gaussien, le dénominateur contient
			<KatexInline formula={String.raw`\hat{\sigma}`} /> (une racine de khi-deux
			<strong>indépendante</strong>) — leur rapport est exactement une variable de Student à <KatexInline
				formula={String.raw`n-p-1`}
			/> degrés de liberté. C’est le remplacement du
			<KatexInline formula={String.raw`\sigma`} /> inconnu par
			<KatexInline formula={String.raw`\hat{\sigma}`} /> qui transforme la gaussienne en loi de Student.
		</p>

		<InteractiveSection
			number="3.4"
			title="Lois d’échantillonnage de β̂, simulation"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmSamplingDist.svelte')} />
		</InteractiveSection>

		<!-- Panneau expert (mode expert uniquement) : le bootstrap — estimer la
		     loi d'échantillonnage sans (H3). Le cours ne traite pas le
		     bootstrap ; le contenu provient des sources primaires citées dans
		     expert/part4/lesson3/bootstrap-theorie.md et
		     bootstrap-theorie.research.md. -->
		<ExpertPanel title="Le bootstrap : estimer la loi d’échantillonnage sans (H3)">
			<p>
				Le Théorème 3.3 de cette leçon donne des <strong>lois exactes</strong> — gaussienne,
				khi-deux, Student — mais <strong>uniquement sous (H3)</strong>, l’hypothèse d’erreurs
				gaussiennes. Sans (H3), la distribution d’échantillonnage de <KatexInline
					formula={String.raw`\hat{\beta}`}
				/> est inconnue, et l’intervalle de confiance <KatexInline
					formula={String.raw`\hat{\beta} \pm t \cdot SE`}
				/> n’a plus de justification exacte (il ne reste que l’approximation asymptotique du théorème
				de la limite centrale). Il existe une alternative entièrement non paramétrique : au lieu de supposer
				une loi pour les erreurs, on suppose que
				<strong>les données observées sont représentatives de la population</strong>, et on «
				ré-échantillonne » dessus. C’est le <strong>bootstrap</strong> (Efron, 1979).
			</p>

			<DefinitionBlock
				number="3.4.1.bis"
				title="Bootstrap non paramétrique : resamplage et réestimation"
			>
				<p>
					Soit <KatexInline formula={String.raw`S_n = \{(X_1, Y_1), \dots, (X_n, Y_n)\}`} /> l’échantillon
					observé de la leçon, et <KatexInline formula={String.raw`\hat{F}_{n}`} /> la
					<strong>loi empirique</strong>
					: la distribution qui met une masse <KatexInline formula={String.raw`1/n`} />
					en chaque point <KatexInline formula={String.raw`(X_i, Y_i)`} />. L’algorithme du
					bootstrap non paramétrique est :
				</p>
				<ol>
					<li>
						<strong>Resamplage.</strong> Tirer un échantillon bootstrap <KatexInline
							formula={String.raw`S^{*}_{n}`}
						/>
						de taille <KatexInline formula="n" /> dans <KatexInline
							formula={String.raw`\hat{F}_{n}`}
						/>,
						<strong>avec remise</strong> — chaque observation <KatexInline
							formula={String.raw`(X_i, Y_i)`}
						/>
						est tirée avec probabilité <KatexInline formula={String.raw`1/n`} />, indépendamment des
						autres ;
					</li>
					<li>
						<strong>Réestimation.</strong> Ajuster le même modèle (moindres carrés) sur
						<KatexInline formula={String.raw`S^{*}_{n}`} /> : <KatexInline
							formula={String.raw`\hat{\beta}^{*} = (X^{* \top}X^{*})^{-1} X^{* \top} Y^{*}`}
						/>
						;
					</li>
					<li>
						<strong>Itération Monte Carlo.</strong> Répéter <KatexInline formula="B" /> fois (
						<KatexInline formula={String.raw`B \approx 100 - 1000`} />) avec des tirages
						indépendants, et prendre pour <strong>loi bootstrap</strong> de <KatexInline
							formula={String.raw`\hat{\beta}^{*}`}
						/>
						l’histogramme des <KatexInline formula="B" /> valeurs.
					</li>
				</ol>
				<p>
					La loi d’échantillonnage de <KatexInline formula={String.raw`\hat{\beta}`} /> (centrée, c’est-à-dire
					<KatexInline formula={String.raw`\hat{\beta}^{*} - \hat{\beta}`} /> à la place de
					<KatexInline formula={String.raw`\hat{\beta} - \beta`} />) est approchée par la loi
					bootstrap de
					<KatexInline formula={String.raw`\hat{\beta}^{*} - \hat{\beta}`} />, conditionnelle aux
					données. L’argument de justification (Efron, 1979) : la loi de <KatexInline
						formula={String.raw`\hat{\beta}^{*}`}
					/>
					serait <strong>exactement</strong> la loi de <KatexInline
						formula={String.raw`\hat{\beta}`}
					/> si la vraie loi coïncidait avec la loi empirique <KatexInline
						formula={String.raw`\hat{F}_{n}`}
					/> — le bootstrap rend l’approximation exacte au point central de la classe des lois plausibles.
				</p>
				<p>
					Pour la régression, on peut aussi faire du <strong>resamplage des résidus</strong> (Efron,
					1979) : on garde <KatexInline formula="X" /> fixe et on rejoue <KatexInline
						formula={String.raw`Y^{*}_{i} = X_{i}\hat{\beta} + \hat{\varepsilon}^{*}_{i}`}
					/>
					avec <KatexInline formula={String.raw`\hat{\varepsilon}^{*}_{i}`} /> tiré au hasard parmi les
					résidus <KatexInline
						formula={String.raw`\hat{\varepsilon}_{1}, \dots, \hat{\varepsilon}_{n}`}
					/>. Cette variante utilise l’information que les régresseurs sont fixés, mais suppose une
					même loi d’erreur pour tout <KatexInline formula="i" /> (homoscédasticité) ; elle est remplacée
					par le wild bootstrap (3.4.4.bis) quand cette hypothèse échoue.
				</p>
			</DefinitionBlock>

			<TheoremBlock number="3.4.2.bis" title="Consistance du bootstrap">
				<p>
					Le bootstrap n’est pas une recette magique : il converge vers la bonne loi sous des
					conditions précises. Pour la moyenne (cas modèle), le résultat s’énonce ainsi.
				</p>
				<p>
					<strong>Moyenne (Bickel & Freedman, 1981, Théorème 2.1).</strong> Soit <KatexInline
						formula={String.raw`X_1, X_2, \dots`}
					/>
					i.i.d. de variance finie positive <KatexInline formula={String.raw`\sigma^{2}`} />. Le
					long de presque toutes les suites d’échantillons, conditionnellement à <KatexInline
						formula={String.raw`(X_1, \dots, X_n)`}
					/>, quand <KatexInline formula={String.raw`n \to \infty`} /> :
				</p>
				<KatexBlock formula={bootConsMean} />
				<p>
					où <KatexInline formula={String.raw`\bar{X}^{*}_{n}`} /> et <KatexInline
						formula={String.raw`s^{*2}_{n}`}
					/>
					sont la moyenne et la variance de l’échantillon bootstrap. Les deux erreurs du bootstrap — remplacer
					la loi inconnue par <KatexInline formula={String.raw`\hat{F}_{n}`} />, et centrer en
					<KatexInline formula={String.raw`\bar{X}_{n}`} /> plutôt qu’en la vraie moyenne (erreur de l’ordre
					de <KatexInline formula={String.raw`1/\sqrt{n}`} />, du bon ordre de grandeur) — se
					<strong>compensent</strong> ; c’est ce que la preuve établit formellement. La même preuve,
					vectorisée (Théorème 2.2), couvre les vecteurs <KatexInline
						formula={String.raw`(X_i, Y_i)`}
					/>, et Freedman (1981) l’applique au cas qui nous intéresse :
				</p>
				<KatexBlock formula={bootConsOls} />
				<p>
					Sous des conditions légères (nombre de paramètres fixé, moments des erreurs contrôlés), la
					loi bootstrap de <KatexInline formula={String.raw`\hat{\beta}^{*} - \hat{\beta}`} /> converge
					vers la loi d’échantillonnage vraie de <KatexInline
						formula={String.raw`\hat{\beta} - \beta`}
					/>, avec bornes d’erreur explicites (Freedman, 1981).
				</p>
				<p>
					<strong>Principe général (Bickel & Freedman, 1981).</strong> Le bootstrap fonctionne pour
					une statistique <KatexInline formula={String.raw`T_n`} /> si, en notant <KatexInline
						formula="g(G)"
					/>
					la limite de sa loi d’échantillonnage : (i) <KatexInline formula={String.raw`T_n`} /> converge
					faiblement vers <KatexInline formula="g(G)" /> pour toute loi <KatexInline formula="G" /> d’un
					voisinage de <KatexInline formula="F" /> ; (ii) cette convergence est
					<strong>uniforme</strong>
					sur le voisinage ; (iii) <KatexInline formula={String.raw`G \mapsto g(G)`} /> est continue.
					L’échec vient toujours d’un défaut d’uniformité (3.4.5.bis).
				</p>
			</TheoremBlock>

			<DefinitionBlock
				number="3.4.3.bis"
				title="Intervalles bootstrap : percentile contre studentized"
			>
				<p>
					Deux façons standard de transformer l’histogramme des <KatexInline
						formula={String.raw`\hat{\beta}^{*}`}
					/>
					en intervalle de confiance de <KatexInline formula={String.raw`\beta_j`} /> (Efron & Tibshirani,
					1993) :
				</p>
				<ul>
					<li>
						<strong>Percentile.</strong> Prendre directement les quantiles de la loi bootstrap :
						<KatexBlock formula={bootIcPerc} />
						Simple, mais : si la loi bootstrap est asymétrique ou décentrée par rapport à
						<KatexInline formula={String.raw`\hat{\beta}_j`} />, l’intervalle est souvent
						inapproprié — pour la variance échantillonnale, <KatexInline formula="n" /> = 20, niveau nominal
						90 %, la couverture réelle tombe à 78 % (Efron & Tibshirani, 1993) ; il n’est qu’exact au
						premier ordre (erreur de couverture de l’ordre de <KatexInline
							formula={String.raw`n^{-1/2}`}
						/>).
					</li>
					<li>
						<strong>Studentized (bootstrap-t).</strong> Remplacer <KatexInline
							formula={String.raw`\sigma`}
						/>
						par son estimateur dans chaque réplique : <KatexInline
							formula={String.raw`t^{*} = (\hat{\beta}^{*} - \hat{\beta}_j) / SE(\hat{\beta}^{*})`}
						/>
						, et
						<KatexBlock formula={bootIcStud} />
						La statistique bootstrappée est <strong>pivotal</strong> (sa limite ne dépend d’aucun
						paramètre inconnu) ; l’intervalle est exact au second ordre (erreur de couverture de
						l’ordre de <KatexInline formula={String.raw`n^{-1}`} />, comme le BCa d’Efron, 1987) :
						il corrige l’asymétrie et la non-stationnarité locale de l’écart-type que le percentile
						ignore.
					</li>
				</ul>
				<p>
					En pratique : le percentile suffit quand la loi bootstrap de <KatexInline
						formula={String.raw`\hat{\beta}^{*}`}
					/>
					est proche de symétrique (grand <KatexInline formula="n" />, erreurs symétriques) ; le
					studentized côte <KatexInline formula="B" /> fois plus cher (un réajustement complet par réplique
					pour calculer <KatexInline formula={String.raw`SE(\hat{\beta}^{*})`} />) et est préféré
					quand l’asymétrie est visible.
				</p>
			</DefinitionBlock>

			<DefinitionBlock number="3.4.4.bis" title="Wild bootstrap : hétéroscédasticité">
				<p>
					Si <KatexInline formula={String.raw`\mathrm{Var}(\varepsilon_i) = \sigma_i^{2}`} /> dépend de
					<KatexInline formula="i" /> (hétéroscédasticité — l’« éventail » de la leçon 4), le resamplage
					naïf des résidus est inadapté : Wu (1986) montre que deux des méthodes classiques (case resampling,
					resamplage i.i.d. des résidus) donnent des
					<strong>estimateurs de variance biaisés</strong>. Le
					<strong>wild bootstrap</strong> corrige cela en pondérant chaque résidu par un poids aléatoire
					:
				</p>
				<KatexBlock formula={bootWild} />
				<p>
					où <KatexInline formula="v_i" /> est un poids centré de variance 1, indépendant (Rademacher
					:
					<KatexInline formula={String.raw`v_i = \pm 1`} /> avec probabilité 1/2 ; ou la distribution
					à deux points de Mammen, 1993 : <KatexInline formula={String.raw`v_i = -0{,}618`} /> avec probabilité
					0,724 et <KatexInline formula={String.raw`v_i = +1{,}618`} /> avec probabilité 0,276, qui matche
					aussi le troisième moment). Les régresseurs restent fixes ; contrairement au resamplage i.i.d.
					des résidus, la variance locale <KatexInline formula={String.raw`\sigma_i^{2}`} /> est préservée
					car
					<KatexInline
						formula={String.raw`\mathrm{Var}(\hat{\varepsilon}_i v_i) = \hat{\varepsilon}_i^{2}`}
					/>. Le wild bootstrap donne des estimateurs de variance « bias-robust » sous
					hétéroscédasticité (Wu, 1986).
				</p>
			</DefinitionBlock>

			<ExampleBlock
				number="3.4.5.bis"
				title="Quand le bootstrap échoue : le maximum (et pourquoi la médiane, elle, passe)"
			>
				<p>
					Le principe de 3.4.2.bis a un coût : l’uniformité. Le contre-exemple classique (Bickel &
					Freedman, 1981) est l’estimation du bord supérieur <KatexInline
						formula={String.raw`\theta`}
					/> du support de
					<KatexInline formula="F" /> uniforme sur <KatexInline
						formula={String.raw`(0, \theta)`}
					/>. La statistique usuelle est <KatexInline formula={String.raw`X_{(n)}`} /> ; son pivot
					<KatexInline formula={String.raw`n(\theta - X_{(n)}) / \theta`} /> a une limite exponentielle
					standard. Le substitut bootstrap naturel — resamplage dans <KatexInline
						formula={String.raw`\hat{F}_{n}`}
					/>
					et étude de <KatexInline formula={String.raw`n(X^{*}_{(n)} - X_{(n)}) / X_{(n)}`} /> —
					<strong>ne fonctionne pas</strong> :
				</p>
				<KatexBlock formula={bootMaxFail} />
				<p>
					la maximum bootstrappée coïncide avec la maximum observée 63 % du temps (on ne peut pas
					tirer au-delà du maximum des données !), et plus généralement la loi conditionnelle de <KatexInline
						formula={String.raw`n(X_{(n)} - X^{*}_{(n-k+1)}) / X_{(n)}`}
					/>
					<strong>n’a pas de limite faible</strong> (limsup = ∞, liminf = 0). Le bootstrap
					<strong>paramétrique</strong> (tirer dans l’uniforme sur <KatexInline
						formula={String.raw`(0, X_{(n)})`}
					/>
					au lieu de <KatexInline formula={String.raw`\hat{F}_{n}`} />) fonctionne à la place. Moral
					: le bootstrap non paramétrique ne voit pas au-delà des données observées.
				</p>
				<p>
					En sens inverse, la <strong>médiane</strong> — souvent présentée à tort comme un cas
					d’échec — est un cas de <strong>succès</strong> : si <KatexInline formula="F" /> a une médiane
					unique
					<KatexInline formula={String.raw`\mu`} /> et une densité <KatexInline formula="f" /> avec
					<KatexInline formula={String.raw`f(\mu) > 0`} />, alors, conditionnellement aux données,
					<KatexInline
						formula={String.raw`\sqrt{n}(m^{*} - m) \Rightarrow \mathcal{N}(0, 1/(4 f(\mu)^{2}))`}
					/>
					— la même limite que <KatexInline formula={String.raw`\sqrt{n}(m - \mu)`} /> (Bickel & Freedman,
					1981, Proposition 5.1). C’est le <strong>jackknife</strong>, pas le bootstrap, qui échoue
					pour la médiane (Efron, 1979).
				</p>
			</ExampleBlock>

			<Callout type="intuition" title="Pont vers le bagging (Partie V)">
				<p>
					Le mécanisme de resamplage de 3.4.1.bis est exactement celui du <strong>bagging</strong>
					(Partie V, leçon 1) : y compris la constante <KatexInline formula={String.raw`1 - 1/e`} /> ≈
					63,2 % d’observations présentes au moins une fois dans l’échantillon bootstrap (et 36,8 % absentes
					— l’origine de l’erreur out-of-bag). La différence d’usage : le bagging
					<strong>moyenne les prédictions</strong>
					de <KatexInline formula="B" /> modèles bootstrappés pour réduire la variance ; le bootstrap
					<strong>étudie la distribution</strong>
					d’une statistique réestimée pour l’inférence. La même constante refait même surface dans
					le contre-exemple de 3.4.5.bis : la maximum bootstrappée égale la maximum observée avec
					une probabilité tendant vers
					<KatexInline formula={String.raw`1 - 1/e`} />.
				</p>
			</Callout>

			<p>
				<strong>Explorer :</strong> passez aux erreurs asymétriques — l’histogramme des
				<KatexInline formula={String.raw`\hat{\beta}^{*}_{1}`} /> reste proche de la gaussienne que la
				théorie de la leçon suppose (la pente est une statistique linéaire : le théorème de la limite
				centrale fait le travail), et l’intervalle de Student reste calé sur sa couverture nominale de
				95 %. Les contrastes où le bootstrap devient décisif — ou échoue — sont ceux des statistiques
				non linéaires, comme le maximum du bloc 3.4.5.bis.
			</p>
			<DeferredDemo load={() => import('$lib/components/demos/LmBootstrapInference.svelte')} />
		</ExpertPanel>

		<h2 id="student">Intervalles de confiance et test de Student</h2>

		<p>
			<KatexInline formula={String.raw`T_{j-1}`} /> suit une loi de Student connue : on peut l’inverser
			pour un intervalle de confiance, et le comparer à un seuil pour un test.
		</p>

		<DefinitionBlock number="3.5" title="Intervalle de confiance de βj">
			<p>
				Avec confiance
				<KatexInline formula={String.raw`1 - \alpha`} /> :
			</p>
			<KatexBlock formula={icBeta} />
			<p>
				où <KatexInline formula={String.raw`t_{n-p-1}(1-\alpha/2)`} /> est le quantile
				<KatexInline formula={String.raw`1-\alpha/2`} /> de la loi de Student à
				<KatexInline formula={String.raw`n-p-1`} /> degrés de liberté. La demi-largeur
				<KatexInline formula={String.raw`\hat{\sigma}\sqrt{(X^\top X)^{-1}_{jj}}`} />
				est l’<strong>erreur-type</strong> de
				<KatexInline formula={String.raw`\hat{\beta}_j`} /> : elle croît avec
				<KatexInline formula={String.raw`\hat{\sigma}`} /> et diminue quand la dispersion des <KatexInline
					formula="x"
				/> augmente
				<KatexInline formula={String.raw`((X^\top X)^{-1}_{jj} \propto 1/\text{dispersion})`} />.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="3.6" title="Test de Student (un coefficient à la fois)">
			<p>
				Pour tester
				<KatexInline formula={String.raw`H_0 : \beta_j = 0`} /> contre
				<KatexInline formula={String.raw`H_1 : \beta_j \neq 0`} /> au niveau
				<KatexInline formula="\alpha" /> : on calcule
			</p>
			<KatexBlock
				formula={String.raw`T_{j-1} = \frac{\hat{\beta}_j}{\hat{\sigma}\sqrt{(X^\top X)^{-1}_{jj}}}`}
			/>
			<p>
				et l’on <strong>rejette</strong>
				<KatexInline formula={String.raw`H_0`} /> si
				<KatexInline formula={String.raw`|T_{j-1}| > t_{n-p-1}(1-\alpha/2)`} />. Rejeter
				<KatexInline formula={String.raw`H_0`} />, c’est conclure que
				<KatexInline formula={String.raw`\beta_j \neq 0`} /> : la variable correspondante
				<strong>explique significativement</strong>
				<KatexInline formula="Y" /> (à ce niveau).
			</p>
		</DefinitionBlock>

		<ExampleBlock number="3.7" title="Exemple : longley (États-Unis, 1955–1962)">
			<p>
				<KatexInline formula="n" /> = 8 années ; la réponse
				<KatexInline formula="Y" /> est le nombre d’actifs ayant un emploi (millions), expliquée par <KatexInline
					formula={String.raw`X_1`}
				/> = PNB (milliards de dollars) et <KatexInline formula={String.raw`X_2`} /> = population du pays
				(millions). L’ajustement par moindres carrés renvoie
				<KatexInline formula={String.raw`\hat{\sigma}^2 = 0{,}2563`} /> et
			</p>
			<table class="data-table">
				<thead>
					<tr>
						<th>paramètre</th>
						<th>β̂</th>
						<th>erreur-type</th>
						<th>T = β̂/SE</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>β0 (constante)</td>
						<td>120,0801</td>
						<td>26,8533</td>
						<td>4,471</td>
					</tr>
					<tr>
						<td>β1 (PNB)</td>
						<td>0,0882</td>
						<td>0,0262</td>
						<td>3,369</td>
					</tr>
					<tr>
						<td>β2 (population)</td>
						<td>−0,7570</td>
						<td>0,3167</td>
						<td>−2,391</td>
					</tr>
				</tbody>
			</table>
			<p>
				Avec <KatexInline formula={String.raw`n - p - 1 = 5`} /> degrés de liberté,
				<KatexInline formula={String.raw`t_5(97{,}5\,\%) = 2{,}57058`} /> :
			</p>
			<ul>
				<li>
					<KatexInline formula={String.raw`IC_{95\,\%}(\beta_1) = [0{,}02089\ ;\ 0{,}15547]`} />
					: 0 n’en fait pas partie — le PNB a un effet positif
					<strong>significatif</strong> au niveau 5 % ;
				</li>
				<li>
					<KatexInline formula={String.raw`|\text{T}| = 2{,}391 < 2{,}57058`} />
					pour <KatexInline formula={String.raw`\beta_2`} /> : la population, tout seule, n’explique
					<strong>pas significativement</strong> le nombre de salariés au niveau 5 %.
				</li>
			</ul>
		</ExampleBlock>

		<h2 id="fisher">Inférence sur le modèle : le test F</h2>

		<p>
			Le test de Student ne regarde qu’un coefficient à la fois. Pour tester le modèle <strong
				>entier</strong
			> — toutes les pentes nulles à la fois — on ’utilise la loi de Fisher.
		</p>

		<TheoremBlock number="3.8" title="Test F global et test F emboîté">
			<p>Sous (H1)–(H3) :</p>
			<ul>
				<li>
					<strong>Test global.</strong> Pour tester
					<KatexInline formula={String.raw`H_0 : \beta_1 = \cdots = \beta_p = 0`} />
					contre
					<KatexInline formula={String.raw`H_1`} /> : au moins une pente non nulle, on calcule
					<KatexBlock formula={fGlobal} />
					qui, <em>sous</em>
					<KatexInline formula={String.raw`H_0`} />, suit la loi de Fisher à
					<KatexInline formula={String.raw`p`} /> et
					<KatexInline formula={String.raw`n-p-1`} /> degrés de liberté. On rejette si
					<KatexInline formula={String.raw`F > F_{p,\,n-p-1}(1-\alpha)`} />.
				</li>
				<li>
					<strong>Test emboîté.</strong> On suppose un modèle
					<strong>complet</strong> (
					<KatexInline formula={String.raw`R^2`} />) emboîtant un modèle
					<strong>réduit</strong> obtenu en fixant
					<KatexInline formula="q" /> coefficients à zéro (
					<KatexInline formula={String.raw`R_q^2`} />). Pour tester
					<KatexInline formula={String.raw`H_0`} /> : ces
					<KatexInline formula="q" /> coefficients sont nuls, on calcule
					<KatexBlock formula={fNested} />
					qui, sous
					<KatexInline formula={String.raw`H_0`} />, suit
					<KatexInline formula={String.raw`F_{q,\,n-p-1}`} />.
				</li>
			</ul>
			<p>
				Cas particulier important : si
				<KatexInline formula={String.raw`q = 1`} />, alors
				<KatexInline formula={String.raw`F = T^2`} /> — le test F emboîté est
				<strong>exactement</strong> le test de Student (au carré), même région de rejet.
			</p>
		</TheoremBlock>

		<p>
			Le test global se lit dans le <strong>tableau d’ANOVA</strong> de la régession :
		</p>

		<table class="data-table">
			<thead>
				<tr>
					<th>source</th>
					<th>ddl</th>
					<th>SC</th>
					<th>SCmoyen</th>
					<th>F</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>régression</td>
					<td>p</td>
					<td>SCE</td>
					<td>SCE/p</td>
					<td>(SCE/p)/(SCR/(n−p−1))</td>
				</tr>
				<tr>
					<td>résiduel</td>
					<td>n−p−1</td>
					<td>SCR</td>
					<td>SCR/(n−p−1)</td>
					<td></td>
				</tr>
				<tr>
					<td>total</td>
					<td>n−1</td>
					<td>SCT</td>
					<td></td>
					<td></td>
				</tr>
			</tbody>
		</table>

		<p>
			l’idée du test : sous
			<KatexInline formula={String.raw`H_0`} />, la variation expliquée par les régresseurs (SCE/p)
			et la variation résiduelle (SCR/(n−p−1)) sont deux estimations de la même variance
			<KatexInline formula={String.raw`\sigma^2`} /> — leur rapport suit la loi de Fisher. Si le rapport
			est grand,
			<KatexInline formula={String.raw`H_0`} /> est improbable.
		</p>

		<InteractiveSection
			number="3.9"
			title="Test de Student contre test de Fisher"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmStudentFisher.svelte')} />
		</InteractiveSection>

		<h2 id="prev">Prévisions</h2>

		<p>
			On observe de nouvelles covariables
			<KatexInline formula={String.raw`v_0 = (1, x_{10}, \dots, x_{p0})`} /> et on vise la réponse correspondante.
			L’estimateur naturel est
			<KatexInline formula={String.raw`\hat{y}_0 = v_0^\top\hat{\beta}`} />, mais il faut distinguer
			deux cibles différentes.
		</p>

		<DefinitionBlock number="3.10" title="Confiance (moyenne) vs prédiction (nouvelle observation)">
			<ul>
				<li>
					<strong>Moyenne de la réponse</strong> :
					<KatexInline formula={String.raw`\mathrm{E}[Y_0] = v_0^\top\beta`} />
					est une quantité <em>lisse</em>, estimée par
					<KatexInline formula={String.raw`\hat{y}_0`} /> avec variance
					<KatexInline formula={String.raw`\sigma^2 v_0^\top(X^\top X)^{-1}v_0`} />
					— intervalle de confiance (extension immédiate de la formule du cours, au-delà des diapos, qui
					ne donnent que l’intervalle de prédiction) :
					<KatexBlock formula={icMoy} />
				</li>
				<li>
					<strong>Nouvelle observation</strong> :
					<KatexInline formula={String.raw`Y_0 = v_0^\top\beta + \varepsilon_0`} />
					portée par son propre bruit
					<KatexInline formula={String.raw`\varepsilon_0`} /> — intervalle de
					<strong>prédiction</strong> :
					<KatexBlock formula={icPred} />
				</li>
			</ul>
			<p>
				Le terme
				<KatexInline formula={String.raw`+1`} /> sous la racine (variance de
				<KatexInline formula={String.raw`\varepsilon_0`} />) rend l’intervalle de prédiction
				<strong>toujours plus large</strong>
				que l’intervalle de confiance. Les deux s’élargissent quand
				<KatexInline formula={String.raw`v_0`} /> s’éloigne du barycentre des observations — l’effet levier
				<KatexInline formula={String.raw`v_0^\top(X^\top X)^{-1}v_0`} />.
			</p>
		</DefinitionBlock>

		<InteractiveSection
			number="3.11"
			title="Intervalle de confiance contre intervalle de prédiction"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmPredictionBand.svelte')} />
		</InteractiveSection>

		<h2 id="mcg">Moindres carrés généralisés</h2>

		<p>
			Jusqu’ici,
			<KatexInline formula={String.raw`\mathrm{Cov}(\varepsilon) = \sigma^2 I_n`} />
			: erreurs indépendantes, variance constante. C’est souvent faux — par exemple dans les séries temporelles,
			les erreurs sont
			<strong>autocorrélées</strong>. On généralise l’hypothèse.
		</p>

		<DefinitionBlock number="3.12" title="Hypothèse (H2′) : covariance non triviale">
			<p>
				<KatexInline formula={String.raw`\mathrm{E}[\varepsilon] = 0_n`} /> et
			</p>
			<KatexBlock formula={h2prime} />
			<p>
				où <KatexInline formula={String.raw`\mathcal{F}`} /> est symétrique, définie positive, de rang
				<KatexInline formula="n" /> (par exemple la matrice de corrélation AR(1),
				<KatexInline formula={String.raw`\mathcal{F}_{ij} = \rho^{|i-j|}`} />).
			</p>
		</DefinitionBlock>

		<p>
			Sous (H2′), les moindres carrés ordinaires restent <strong>sans biais</strong>, mais ne sont
			plus BLUE : leur variance devient
		</p>

		<KatexBlock formula={varOlsCorr} />

		<p>
			— qui n’est plus
			<KatexInline formula={String.raw`\sigma^2(X^\top X)^{-1}`} />, et que l’on ne peut pas
			minimiser par OLS. La solution :
		</p>

		<TheoremBlock number="3.13" title="Moindres carrés généralisés (MCG)">
			<p>
				L’estimateur des <strong>moindres carrés généralisés</strong> est
			</p>
			<KatexBlock formula={gls} />
			<p>
				<strong>Blanchiment.</strong> Écrivons la décomposition de Cholesky <KatexInline
					formula={String.raw`\mathcal{F} = PP^\top`}
				/>
				et multiplions le modèle par
				<KatexInline formula={String.raw`P^{-1}`} /> :
				<KatexInline formula={String.raw`P^{-1}Y = P^{-1}X\beta + P^{-1}\varepsilon`} />
				avec
				<KatexInline formula={String.raw`\mathrm{Cov}(P^{-1}\varepsilon) = \sigma^2 I_n`} />. Les
				erreurs sont devenues <strong>blanches</strong> : le MCG est exactement le OLS appliqué au modèle
				blanchi.
			</p>
			<p>
				Propriétés sous (H2′) : le MCG est <strong>sans biais</strong>, sa variance vaut
			</p>
			<KatexBlock formula={glsVar} />
			<p>
				il est <strong>BLUE</strong> (meilleur estimateur linéaire sans biais), et
				<KatexInline formula={String.raw`\sigma^2`} /> s’estime par
			</p>
			<KatexBlock formula={glsSig} />
			<p>
				Sous (H3) avec erreurs corrélées (
				<KatexInline
					formula={String.raw`\varepsilon \sim \mathcal{N}_n(0_n, \sigma^2 \mathcal{F})`}
				/>
				), les mêmes types de tests (Student, Fisher) s’appliquent, avec la variance MCG à la place de
				<KatexInline formula={String.raw`\sigma^2(X^\top X)^{-1}`} />.
			</p>
		</TheoremBlock>

		<InteractiveSection
			number="3.14"
			title="OLS contre MCG : briser (H2)"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmGls.svelte')} />
		</InteractiveSection>

		<Callout type="note" title="Vers la suite">
			<p>
				Comment détecter en pratique qu’une hypothèse est brisée — hétéroscédasticité,
				autocorrélation, non-linéarité, observations influentes ? Avec les <strong
					>graphes de résidus</strong
				>
				et les diagnostics de la <a href="/part4/lesson4">leçon 4</a> (leviers, distances de Cook, résidus
				partiels).
			</p>
		</Callout>
	</TheorySection>
	<Bibliography>
		<BibElement
			authors={['Efron, B.']}
			year={1979}
			title="Bootstrap Methods: Another Look at the Jackknife"
			journal="The Annals of Statistics 7(1), 1–26."
			link="https://doi.org/10.1214/aos/1176344139"
		/>
		<BibElement
			authors={['Bickel, P. J.', 'Freedman, D. A.']}
			year={1981}
			title="Some Asymptotic Theory for the Bootstrap"
			journal="The Annals of Statistics 9(6), 1196–1217."
			link="https://doi.org/10.1214/aos/1176345637"
		/>
		<BibElement
			authors={['Freedman, D. A.']}
			year={1981}
			title="Bootstrapping Regression Models"
			journal="The Annals of Statistics 9(6), 1218–1228."
			link="https://doi.org/10.1214/aos/1176345638"
		/>
		<BibElement
			authors={['Efron, B.']}
			year={1982}
			title="The Jackknife, the Bootstrap and Other Resampling Plans"
			journal="CBMS-NSF Regional Conference Series in Applied Mathematics, vol. 38. SIAM, Philadelphia."
			link="https://doi.org/10.1137/1.9781611970319"
		/>
		<BibElement
			authors={['Wu, C. F. J.']}
			year={1986}
			title="Jackknife, Bootstrap and Other Resampling Methods in Regression Analysis"
			journal="The Annals of Statistics 14(4), 1261–1295."
			link="https://doi.org/10.1214/aos/1176350142"
		/>
		<BibElement
			authors={['Efron, B.']}
			year={1987}
			title="Better Bootstrap Confidence Intervals"
			journal="Journal of the American Statistical Association 82(397), 171–185."
			link="https://doi.org/10.1080/01621459.1987.10478410"
		/>
		<BibElement
			authors={['Efron, B.', 'Tibshirani, R. J.']}
			year={1993}
			title="An Introduction to the Bootstrap"
			journal="Monographs on Statistics and Applied Probability, vol. 57. Chapman & Hall, Boca Raton."
		/>
		<BibElement
			authors={['Mammen, E.']}
			year={1993}
			title="Bootstrap and Wild Bootstrap for High Dimensional Linear Models"
			journal="The Annals of Statistics 21(1), 255–285."
			link="https://doi.org/10.1214/aos/1176349025"
		/>
		<BibElement
			authors={['Davison, A. C.', 'Hinkley, D. V.']}
			year={1997}
			title="Bootstrap Methods and Their Application"
			journal="Cambridge University Press."
		/>
	</Bibliography>
</PageTemplate>

<style>
	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		margin: 0.75rem 0;
	}

	.data-table th,
	.data-table td {
		padding: 0.35rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.data-table th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
	}
</style>
