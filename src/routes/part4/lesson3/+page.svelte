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

	// ── Formules (course_sources/sophie/StatM1S1_2025.pdf, §I.6–I.7) ──
	const h3Vec = String.raw`\varepsilon \sim \mathcal{N}_n(0_n, \sigma^2 I_n)`;
	const loglik = String.raw`\ell(\beta, \sigma^2) = -\tfrac{n}{2}\log(2\pi) - \tfrac{n}{2}\log\sigma^2 - \tfrac{1}{2\sigma^2}\|Y - X\beta\|^2`;
	const mle = String.raw`\hat{\beta}^{\mathrm{MV}} = \hat{\beta}, \qquad \hat{\sigma}^{2}_{\mathrm{MV}} = \frac{\mathrm{SCR}}{n}`;
	const loisBeta = String.raw`\hat{\beta} \sim \mathcal{N}_{p+1}\!\left(\beta,\ \sigma^2 (X^{\mathrm{T}}X)^{-1}\right)`;
	const loisChisq = String.raw`\frac{(n-p-1)\hat{\sigma}^2}{\sigma^2} \sim \chi^2(n-p-1)`;
	const loisT = String.raw`T_{j-1} = \frac{\hat{\beta}_j - \beta_j}{\hat{\sigma}\sqrt{(X^{\mathrm{T}}X)^{-1}_{jj}}} \sim \text{Student}(n-p-1)`;
	const icBeta = String.raw`IC_{1-\alpha}(\beta_j) = \hat{\beta}_j \pm t_{n-p-1}(1-\alpha/2)\ \hat{\sigma}\sqrt{(X^{\mathrm{T}}X)^{-1}_{jj}}`;
	const fGlobal = String.raw`F = \frac{\mathrm{SCE}/p}{\mathrm{SCR}/(n-p-1)} \sim F_{p,\,n-p-1}`;
	const fNested = String.raw`F_q = \frac{(R^2 - R_q^2)/q}{(1 - R^2)/(n-p-1)} \sim F_{q,\,n-p-1}`;
	const icMoy = String.raw`\hat{y}_0 \pm t_{n-p-1}(1-\alpha/2)\ \hat{\sigma}\sqrt{v_0^{\mathrm{T}}(X^{\mathrm{T}}X)^{-1}v_0}`;
	const icPred = String.raw`\hat{y}_0 \pm t_{n-p-1}(1-\alpha/2)\ \hat{\sigma}\sqrt{1 + v_0^{\mathrm{T}}(X^{\mathrm{T}}X)^{-1}v_0}`;
	const h2prime = String.raw`\mathrm{Cov}(\varepsilon) = \sigma^2 \mathcal{F}`;
	const varOlsCorr = String.raw`\mathrm{Var}(\hat{\beta}) = \sigma^2 (X^{\mathrm{T}}X)^{-1} X^{\mathrm{T}}\mathcal{F}X (X^{\mathrm{T}}X)^{-1}`;
	const gls = String.raw`\hat{\beta}_{\mathrm{MCG}} = (X^{\mathrm{T}}\mathcal{F}^{-1}X)^{-1} X^{\mathrm{T}}\mathcal{F}^{-1} Y`;
	const glsVar = String.raw`\mathrm{Var}(\hat{\beta}_{\mathrm{MCG}}) = \sigma^2 (X^{\mathrm{T}}\mathcal{F}^{-1}X)^{-1}`;
	const glsSig = String.raw`\hat{\sigma}^{2}_{\mathrm{MCG}} = \frac{(Y - X\hat{\beta}_{\mathrm{MCG}})^{\mathrm{T}}\mathcal{F}^{-1}(Y - X\hat{\beta}_{\mathrm{MCG}})}{n-p-1}`;

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
			<KatexInline formula={String.raw`\hat{\beta} = (X^{\mathrm{T}}X)^{-1}X^{\mathrm{T}}Y`} />,
			ses propriétés (sans biais,
			<KatexInline formula={String.raw`\mathrm{Var}(\hat{\beta}) = \sigma^2 (X^{\mathrm{T}}X)^{-1}`} />),
			et l’estimateur sans biais
			<KatexInline formula={String.raw`\hat{\sigma}^2 = \mathrm{SCR}/(n-p-1)`} />.
			Mais <strong>aucune loi</strong> : on ne sait pas à quoi ressemble la
			distribution de <KatexInline formula={String.raw`\hat{\beta}`} /> dans
			l’échantillonnage, donc on ne peut ni construire d’intervalle de confiance, ni
			conduire de test. Pour de l’inférence exacte en petit échantillon, on
			raffortit (H2) en une hypothèse de loi complète.
		</p>

		<DefinitionBlock number="3.1" title="Hypothèse (H3) : erreurs gaussiennes">
			<p>
				Les erreurs <KatexInline formula={String.raw`\varepsilon_i`} /> sont
				<strong>indépendantes</strong> et suivent la loi normale
				<KatexInline formula={String.raw`\mathcal{N}(0, \sigma^2)`} />. En forme
				vectorielle :
			</p>
			<KatexBlock formula={h3Vec} />
			<p>
				(H3) implique (H2) :
				<KatexInline formula={String.raw`\mathrm{E}[\varepsilon] = 0_n`} /> et
				<KatexInline formula={String.raw`\mathrm{Cov}(\varepsilon) = \sigma^2 I_n`} />.
				Tous les résultats de la leçon 1 restent donc valides ; (H3) apporte en
				plus les <strong>lois exactes</strong> de tous les estimateurs ci-dessous —
				sans approximation asymptotique.
			</p>
		</DefinitionBlock>

		<h2 id="mv">Maximum de vraisemblance</h2>

		<p>
			Sous (H3),
			<KatexInline formula={String.raw`Y = X\beta + \varepsilon \sim \mathcal{N}_n(X\beta, \sigma^2 I_n)`} />
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
			<KatexInline formula={String.raw`\|Y - X\beta\|^2`} /> : c’est exactement le
			problème des moindres carrés.
		</p>

		<TheoremBlock number="3.2" title="Théorème 2 (maximum de vraisemblance)">
			<p>
				Sous (H1)–(H3), les estimateurs du maximum de vraisemblance sont
			</p>
			<KatexBlock formula={mle} />
			<p>
				avec <KatexInline formula={String.raw`\hat{\beta}`} /> l’estimateur des
				<strong>moindres carrés ordinaires</strong> de la leçon 1, et
				<KatexInline formula={String.raw`\mathrm{SCR}`} /> la somme des carrés des
				résidus.
			</p>
		</TheoremBlock>

		<p>
			Attention à la différence de dénominateur :
			<KatexInline formula={String.raw`\hat{\sigma}^2_{\mathrm{MV}} = \mathrm{SCR}/n`} />
			est <strong>biaisé</strong> (il sous-estime
			<KatexInline formula={String.raw`\sigma^2`} />), tandis que
			<KatexInline formula={String.raw`\hat{\sigma}^2 = \mathrm{SCR}/(n-p-1)`} />
			est <strong>sans biais</strong> — c’est lui que l’on utilise partout dans le
			cours. La raison apparaîtra avec la loi du khi-deux ci-dessous : le vecteur des
			résidus vit dans un sous-espace de dimension
			<KatexInline formula={String.raw`n - p - 1`} />, d’où les
			<KatexInline formula={String.raw`n - p - 1`} /> degrés de liberté.
		</p>

		<h2 id="lois">Lois d’échantillonnage</h2>

		<p>
			Sous (H3), <KatexInline formula="Y" /> est gaussienne. Comme
			<KatexInline formula={String.raw`\hat{\beta} = (X^{\mathrm{T}}X)^{-1}X^{\mathrm{T}}Y`} />
			et
			<KatexInline formula={String.raw`\hat{\varepsilon} = Y - X\hat{\beta}`} /> sont
			des <strong>combinaisons linéaires</strong> de
			<KatexInline formula="Y" />, ils sont gaussiens — et leurs lois s’obtiennent
			exacte.
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
					<KatexInline formula={String.raw`j \in \{0, \dots, p\}`} /> :
					<KatexBlock formula={loisT} />
				</li>
			</ul>
		</TheoremBlock>

		<p>
			Lire la dernière ligne : le numérateur
			<KatexInline formula={String.raw`\hat{\beta}_j - \beta_j`} /> est gaussien, le
			dénominateur contient
			<KatexInline formula={String.raw`\hat{\sigma}`} /> (une racine de khi-deux
			<strong>indépendante</strong>) — leur rapport est exactement une variable de
			Student à <KatexInline formula={String.raw`n-p-1`} /> degrés de liberté. C’est
			le remplacement du
			<KatexInline formula={String.raw`\sigma`} /> inconnu par
			<KatexInline formula={String.raw`\hat{\sigma}`} /> qui transforme la gaussienne
			en loi de Student.
		</p>

		<InteractiveSection number="3.4" title="Lois d’échantillonnage de β̂, simulation" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmSamplingDist.svelte')} />
		</InteractiveSection>

		<h2 id="student">Intervalles de confiance et test de Student</h2>

		<p>
			<KatexInline formula={String.raw`T_{j-1}`} /> suit une loi de Student connue :
			on peut l’inverser pour un intervalle de confiance, et le comparer à un
			seuil pour un test.
		</p>

		<DefinitionBlock number="3.5" title="Intervalle de confiance de βj">
			<p>
				Avec confiance
				<KatexInline formula={String.raw`1 - \alpha`} /> :
			</p>
			<KatexBlock formula={icBeta} />
			<p>
				où <KatexInline formula={String.raw`t_{n-p-1}(1-\alpha/2)`} /> est le
				quantile
				<KatexInline formula={String.raw`1-\alpha/2`} /> de la loi de Student à
				<KatexInline formula={String.raw`n-p-1`} /> degrés de liberté. La
				demi-largeur
				<KatexInline formula={String.raw`\hat{\sigma}\sqrt{(X^{\mathrm{T}}X)^{-1}_{jj}}`} />
				est l’<strong>erreur-type</strong> de
				<KatexInline formula={String.raw`\hat{\beta}_j`} /> : elle croît avec
				<KatexInline formula={String.raw`\hat{\sigma}`} /> et diminue quand la
				dispersion des <KatexInline formula="x" /> augmente
				<KatexInline formula={String.raw`((X^{\mathrm{T}}X)^{-1}_{jj} \propto 1/\text{dispersion})`} />.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="3.6" title="Test de Student (un coefficient à la fois)">
			<p>
				Pour tester
				<KatexInline formula={String.raw`H_0 : \beta_j = 0`} /> contre
				<KatexInline formula={String.raw`H_1 : \beta_j \neq 0`} /> au niveau
				<KatexInline formula="\alpha" /> : on calcule
			</p>
			<KatexBlock formula={String.raw`T_{j-1} = \frac{\hat{\beta}_j}{\hat{\sigma}\sqrt{(X^{\mathrm{T}}X)^{-1}_{jj}}}`} />
			<p>
				et l’on <strong>rejette</strong>
				<KatexInline formula={String.raw`H_0`} /> si
				<KatexInline formula={String.raw`|T_{j-1}| > t_{n-p-1}(1-\alpha/2)`} />.
				Rejeter
				<KatexInline formula={String.raw`H_0`} />, c’est conclure que
				<KatexInline formula={String.raw`\beta_j \neq 0`} /> : la variable
				correspondante <strong>explique significativement</strong>
				<KatexInline formula="Y" /> (à ce niveau).
			</p>
		</DefinitionBlock>

		<ExampleBlock number="3.7" title="Exemple : longley (États-Unis, 1955–1962)">
			<p>
				<KatexInline formula="n" /> = 8 années ; la réponse
				<KatexInline formula="Y" /> est le nombre d’actifs ayant un emploi
				(millions), expliquée par <KatexInline formula={String.raw`X_1`} /> = PNB
				(milliards de dollars) et <KatexInline formula={String.raw`X_2`} /> =
				population du pays (millions). L’ajustement par moindres carrés renvoie
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
					pour <KatexInline formula={String.raw`\beta_2`} /> : la population,
					tout seule, n’explique <strong>pas significativement</strong> le
					nombre de salariés au niveau 5 %.
				</li>
			</ul>
		</ExampleBlock>

		<h2 id="fisher">Inférence sur le modèle : le test F</h2>

		<p>
			Le test de Student ne regarde qu’un coefficient à la fois. Pour tester le
			modèle <strong>entier</strong> — toutes les pentes nulles à la fois — on
		’utilise la loi de Fisher.
		</p>

		<TheoremBlock number="3.8" title="Test F global et test F emboîté">
			<p>
				Sous (H1)–(H3) :
			</p>
			<ul>
				<li>
					<strong>Test global.</strong> Pour tester
					<KatexInline formula={String.raw`H_0 : \beta_1 = \cdots = \beta_p = 0`} />
					contre
					<KatexInline formula={String.raw`H_1`} /> : au moins une pente non
					nulle, on calcule
					<KatexBlock formula={fGlobal} />
					qui, <em>sous</em>
					<KatexInline formula={String.raw`H_0`} />, suit la loi de Fisher à
					<KatexInline formula={String.raw`p`} /> et
					<KatexInline formula={String.raw`n-p-1`} /> degrés de liberté. On
					rejette si
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
				<strong>exactement</strong> le test de Student (au carré), même région de
				rejet.
			</p>
		</TheoremBlock>

		<p>
			Le test global se lit dans le <strong>tableau d’ANOVA</strong> de la
			régession :
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
			<KatexInline formula={String.raw`H_0`} />, la variation expliquée par les
			régresseurs (SCE/p) et la variation résiduelle (SCR/(n−p−1)) sont deux
			estimations de la même variance
			<KatexInline formula={String.raw`\sigma^2`} /> — leur rapport suit la loi de
			Fisher. Si le rapport est grand,
			<KatexInline formula={String.raw`H_0`} /> est improbable.
		</p>

		<InteractiveSection number="3.9" title="Test de Student contre test de Fisher" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmStudentFisher.svelte')} />
		</InteractiveSection>

		<h2 id="prev">Prévisions</h2>

		<p>
			On observe de nouvelles covariables
			<KatexInline formula={String.raw`v_0 = (1, x_{10}, \dots, x_{p0})`} /> et on
			vise la réponse correspondante. L’estimateur naturel est
			<KatexInline formula={String.raw`\hat{y}_0 = v_0^{\mathrm{T}}\hat{\beta}`} />,
			mais il faut distinguer deux cibles différentes.
		</p>

		<DefinitionBlock number="3.10" title="Confiance (moyenne) vs prédiction (nouvelle observation)">
			<ul>
				<li>
					<strong>Moyenne de la réponse</strong> :
					<KatexInline formula={String.raw`\mathrm{E}[Y_0] = v_0^{\mathrm{T}}\beta`} />
					est une quantité <em>lisse</em>, estimée par
					<KatexInline formula={String.raw`\hat{y}_0`} /> avec variance
					<KatexInline formula={String.raw`\sigma^2 v_0^{\mathrm{T}}(X^{\mathrm{T}}X)^{-1}v_0`} />
					— intervalle de confiance :
					<KatexBlock formula={icMoy} />
				</li>
				<li>
					<strong>Nouvelle observation</strong> :
					<KatexInline formula={String.raw`Y_0 = v_0^{\mathrm{T}}\beta + \varepsilon_0`} />
					portée par son propre bruit
					<KatexInline formula={String.raw`\varepsilon_0`} /> — intervalle de
					<strong>prédiction</strong> :
					<KatexBlock formula={icPred} />
				</li>
			</ul>
			<p>
				Le terme
				<KatexInline formula={String.raw`+1`} /> sous la racine (variance de
				<KatexInline formula={String.raw`\varepsilon_0`} />) rend l’intervalle de
				prédiction <strong>toujours plus large</strong> que l’intervalle de
				confiance. Les deux s’élargissent quand
				<KatexInline formula={String.raw`v_0`} /> s’éloigne du barycentre des
				observations — l’effet levier
				<KatexInline formula={String.raw`v_0^{\mathrm{T}}(X^{\mathrm{T}}X)^{-1}v_0`} />.
			</p>
		</DefinitionBlock>

		<InteractiveSection number="3.11" title="Intervalle de confiance contre intervalle de prédiction" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmPredictionBand.svelte')} />
		</InteractiveSection>

		<h2 id="mcg">Moindres carrés généralisés</h2>

		<p>
			Jusqu’ici,
			<KatexInline formula={String.raw`\mathrm{Cov}(\varepsilon) = \sigma^2 I_n`} />
			: erreurs indépendantes, variance constante. C’est souvent faux — par exemple
			dans les séries temporelles, les erreurs sont
			<strong>autocorrélées</strong>. On généralise l’hypothèse.
		</p>

		<DefinitionBlock number="3.12" title="Hypothèse (H2′) : covariance non triviale">
			<p>
				<KatexInline formula={String.raw`\mathrm{E}[\varepsilon] = 0_n`} /> et
			</p>
			<KatexBlock formula={h2prime} />
			<p>
				où <KatexInline formula={String.raw`\mathcal{F}`} /> est symétrique,
				définie positive, de rang
				<KatexInline formula="n" /> (par exemple la matrice de corrélation
				AR(1),
				<KatexInline formula={String.raw`\mathcal{F}_{ij} = \rho^{|i-j|}`} />).
			</p>
		</DefinitionBlock>

		<p>
			Sous (H2′), les moindres carrés ordinaires restent <strong>sans biais</strong>,
			mais ne sont plus BLUE : leur variance devient
		</p>

		<KatexBlock formula={varOlsCorr} />

		<p>
			— qui n’est plus
			<KatexInline formula={String.raw`\sigma^2(X^{\mathrm{T}}X)^{-1}`} />, et que
			l’on ne peut pas minimiser par OLS. La solution :
		</p>

		<TheoremBlock number="3.13" title="Moindres carrés généralisés (MCG)">
			<p>
				L’estimateur des <strong>moindres carrés généralisés</strong> est
			</p>
			<KatexBlock formula={gls} />
			<p>
				<strong>Blanchiment.</strong> Écrivons la décomposition
				de Cholesky <KatexInline formula={String.raw`\mathcal{F} = PP^{\mathrm{T}}`} />
				et multiplions le modèle par
				<KatexInline formula={String.raw`P^{-1}`} /> :
				<KatexInline formula={String.raw`P^{-1}Y = P^{-1}X\beta + P^{-1}\varepsilon`} />
				avec
				<KatexInline formula={String.raw`\mathrm{Cov}(P^{-1}\varepsilon) = \sigma^2 I_n`} />.
				Les erreurs sont devenues <strong>blanches</strong> : le MCG est
				exactement le OLS appliqué au modèle blanchi.
			</p>
			<p>
				Propriétés sous (H2′) : le MCG est <strong>sans biais</strong>, sa
				variance vaut
			</p>
			<KatexBlock formula={glsVar} />
			<p>
				il est <strong>BLUE</strong> (meilleur estimateur linéaire sans biais), et
				<KatexInline formula={String.raw`\sigma^2`} /> s’estime par
			</p>
			<KatexBlock formula={glsSig} />
			<p>
				Sous (H3) avec erreurs corrélées (
				<KatexInline formula={String.raw`\varepsilon \sim \mathcal{N}_n(0_n, \sigma^2 \mathcal{F})`} />
				), les mêmes types de tests (Student, Fisher) s’appliquent, avec la
				variance MCG à la place de
				<KatexInline formula={String.raw`\sigma^2(X^{\mathrm{T}}X)^{-1}`} />.
			</p>
		</TheoremBlock>

		<InteractiveSection number="3.14" title="OLS contre MCG : briser (H2)" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmGls.svelte')} />
		</InteractiveSection>

		<Callout type="note" title="Vers la suite">
			<p>
				Comment détecter en pratique qu’une hypothèse est brisée —
				hétéroscédasticité, autocorrélation, non-linéarité, observations
				influentes ? Avec les <strong>graphes de résidus</strong> et les
				diagnostics de la <a href="/part4/lesson4">leçon 4</a> (leviers,
				distances de Cook, résidus partiels).
			</p>
		</Callout>
	</TheorySection>
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
