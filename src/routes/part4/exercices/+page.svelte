<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part4/exercices');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Table of contents ──

	const tocEntries: TocEntry[] = [
		{
			id: 'estimation',
			label: 'Estimation par moindres carrés',
			description: 'Exercices 4.1–4.2 — calcul manuel de β̂ (bien-être), intervalles de Student (longley)',
			color: 'epistemic'
		},
		{
			id: 'inference',
			label: 'Inférence globale et diagnostic',
			description: 'Exercices 4.3–4.4 — tableau d’ANOVA et test F emboîté, VIF et conditionnement (longley)',
			color: 'belief'
		},
		{
			id: 'facteurs-modeles',
			label: 'Facteurs et choix de modèle',
			description: 'Exercices 4.5–4.6 — encodage d’un facteur (trois codages), AIC vs BIC (données simulées)',
			color: 'surprise'
		},
		{
			id: 'complements',
			label: 'Compléments : interactions, ANCOVA, résidus partiels, MCG, pas à pas',
			description: 'Exercices 4.7–4.11 — test de l’interaction (2 facteurs), ANCOVA, résidus partiels (prostate), MCG (erreurs AR(1)), sélection pas à pas (prostate)',
			color: 'agent'
		}
	];

	// ── Formula variables (stored in script so Svelte never parses backslashes) ──

	// Ex 4.1
	const xtx =
		'X^{\\top}X = \\begin{pmatrix} 10 & 7 & 242 & 388 \\\\ 7 & 13 & 204 & 360 \\\\ 242 & 204 & 6820 & 9679 \\\\ 388 & 360 & 9679 & 16184 \\end{pmatrix}';
	const xty =
		'X^{\\top}y = \\begin{pmatrix} 337 \\\\ 215 \\\\ 8483 \\\\ 12902 \\end{pmatrix}';
	const invxtx =
		'(X^{\\top}X)^{-1} = \\begin{pmatrix} 7.9183 & 2.4750 & -0.0493 & -0.2154 \\\\ 2.4750 & 0.9790 & -0.0132 & -0.0732 \\\\ -0.0493 & -0.0132 & 0.0013 & 0.0007 \\\\ -0.2154 & -0.0732 & 0.0007 & 0.0064 \\end{pmatrix}';
	const betaHat =
		'\\hat\\beta = (X^{\\top}X)^{-1}X^{\\top}y = \\begin{pmatrix} 3.2195 \\\\ -12.0562 \\\\ 0.5803 \\\\ 0.6411 \\end{pmatrix}';
	const eqReg =
		'\\hat y = 3.2195 - 12.0562\\,X_{\\mathrm{NbEnfU}} + 0.5803\\,X_{\\mathrm{BEU}} + 0.6411\\,X_{\\mathrm{NSE}}';
	const predVal =
		'\\hat y = 3.2195 - 12.0562 + 0.5803 \\times 30 + 0.6411 \\times 50 = 40.6273 \\approx 41';

	// Ex 4.2
	const icFormula =
		'\\mathrm{IC} \\, \\hat\\beta_j = \\hat\\beta_j \\pm t_{n-p-1}(1-\\alpha/2)\\;\\mathrm{se}(\\hat\\beta_j)';
	const icB1 =
		'\\mathrm{IC}(\\beta_{\\mathrm{GNP}}) = 0.0882 \\pm 2.57058 \\times 0.0262 = [\\,0.0209\\,;\\, 0.1555\\,]';
	const icB2 =
		'\\mathrm{IC}(\\beta_{\\mathrm{Pop}}) = -0.7570 \\pm 2.57058 \\times 0.3167 = [\\,-1.571\\,;\\, 0.057\\,]';

	// Ex 4.3
	const fGlobal =
		'F = \\dfrac{\\mathrm{SCE}/p}{\\mathrm{SCR}/(n-p-1)}';
	const fNested =
		'F_q = \\dfrac{(\\mathrm{SCE} - \\mathrm{SCE}_q)/q}{\\mathrm{SCR}/(n-p-1)} = \\dfrac{(R^2 - R_q^2)/q}{(1 - R^2)/(n-p-1)}';
	const fNestedVal =
		'F = \\dfrac{(0.9221 - 0.8331)/1}{(1 - 0.9221)/5} = 5.715';

	// Ex 4.4
	const vifFormula = '\\mathrm{VIF}_j = \\dfrac{1}{1 - R_j^2}';
	const kappaFormula = '\\kappa = \\lambda_1 / \\lambda_p';

	// Ex 4.5
	const modelFacteur = 'Y_{jk} = \\beta_0 + \\beta_j + \\varepsilon_{jk}';

	// Ex 4.6
	const aicFormula = '\\mathrm{AIC} = -2\\log \\hat L + 2k';
	const bicFormula = '\\mathrm{BIC} = -2\\log \\hat L + k\\log n';
</script>

<svelte:head>
	<title>{meta?.title ?? 'Exercices — Partie IV'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Exercices — Partie IV'}
	subtitle="11 exercices sur la régression linéaire : moindres carrés, inférence, diagnostic, facteurs, ANCOVA, MCG et choix de modèle (corrigés en mode enseignant)"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="estimation">Estimation par moindres carrés</h2>

		<ExercisePanel number="4.1" title="Calcul manuel de β̂ (données bien-être)">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> En multipliant, on retrouve bien
					<KatexBlock formula={xtx} />
					et
					<KatexBlock formula={xty} />
				</p>
				<p>
					<strong>(b)</strong> En multipliant
					<KatexInline formula={'(X^{\\top}X)^{-1}'} />
					par
					<KatexInline formula={'X^{\\top}y'} />
					:
					<KatexBlock formula={betaHat} />
					soit l’équation de régression
					<KatexBlock formula={eqReg} />
					Les résidus
					<KatexInline formula={'\\hat\\varepsilon = y - X\\hat\\beta'} />
					vérifient
					<KatexInline formula={'\\|\\hat\\varepsilon\\|^2 = 101.31'} />
					d’où
					<KatexInline formula={'\\hat\\sigma^2 = 101.31/(10-4) = 16.8852'} />
					et
					<KatexInline formula={'R^2 = 0.7655'} />
					: le modèle explique environ 77 % de la variation du score.
				</p>
				<p>
					<strong>(c)</strong>
					<KatexBlock formula={predVal} />
					On prédit un score de bien-être d’environ 41, sept ans après l’université.
				</p>
			{/snippet}
			<p>
				Un des objectifs de l’étude dont est tiré cet exemple était de prédire le sentiment de
				bien-être (score) sept ans après l’université, à partir de variables mesurées durant la
				scolarité :
			</p>
			<table class="data-table">
				<thead>
					<tr>
						<th>Individu</th>
						<th>NbEnfU</th>
						<th>BEU</th>
						<th>NSE</th>
						<th>BE</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>1</td><td>2</td><td>17</td><td>52</td><td>21</td></tr>
					<tr><td>2</td><td>2</td><td>20</td><td>56</td><td>26</td></tr>
					<tr><td>3</td><td>0</td><td>21</td><td>27</td><td>37</td></tr>
					<tr><td>4</td><td>0</td><td>18</td><td>34</td><td>40</td></tr>
					<tr><td>5</td><td>0</td><td>31</td><td>29</td><td>35</td></tr>
					<tr><td>6</td><td>1</td><td>34</td><td>38</td><td>37</td></tr>
					<tr><td>7</td><td>0</td><td>20</td><td>38</td><td>35</td></tr>
					<tr><td>8</td><td>0</td><td>17</td><td>25</td><td>26</td></tr>
					<tr><td>9</td><td>2</td><td>48</td><td>53</td><td>42</td></tr>
					<tr><td>10</td><td>0</td><td>16</td><td>36</td><td>38</td></tr>
				</tbody>
			</table>
			<p>
				Soit
				<KatexInline formula={'Y = X\\beta + \\varepsilon'} />
				avec
				<KatexInline formula={'X \\in \\mathbb{R}^{10 \\times 4}'} />
				(colonne d’intercept, puis
				<KatexInline formula={'X_1 = X_{\\mathrm{NbEnfU}}'} />, <KatexInline formula={'X_2 = X_{\\mathrm{BEU}}'} />,
				<KatexInline formula={'X_3 = X_{\\mathrm{NSE}}'} />
				).
			</p>
			<p>
				<strong>(a)</strong> Calculer les matrices
				<KatexInline formula={'X^{\\top}X'} />
				(4 × 4) et
				<KatexInline formula={'X^{\\top}y'} />
				(4 × 1). Une calculatrice est autorisée.
			</p>
			<p>
				<strong>(b)</strong> L’inverse de
				<KatexInline formula={'X^{\\top}X'} />
				étant donné par
				<KatexBlock formula={invxtx} />
				en déduire
				<KatexInline formula={'\\hat\\beta'} />
				et l’équation de régression. Calculer ensuite
				<KatexInline formula={'\\hat\\sigma^2'} />
				et
				<KatexInline formula={'R^2'} />
				.
			</p>
			<p>
				<strong>(c)</strong> Prédire le score de bien-être d’un ancien étudiant ayant eu 1 enfant
				durant sa scolarité, avec un score de bien-être
				<KatexInline formula={'\\mathrm{BEU} = 30'} />
				et un niveau socio-économique des parents
				<KatexInline formula={'\\mathrm{NSE} = 50'} />
				.
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.2" title="Intervalle de confiance de Student (longley)">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Avec
					<KatexInline formula={'n = 8'} />, <KatexInline formula={'p = 2'} />
					on a
					<KatexInline formula={'t_5(97.5\\%) = 2.57058'} />
					et l’intervalle de confiance s’écrit
					<KatexInline formula={icFormula} />
					. Donc
					<KatexBlock formula={icB1} />
					et
					<KatexBlock formula={icB2} />
				</p>
				<p>
					<strong>(b)</strong> La statistique de Student vaut
					<KatexInline formula={'t = -0.7570/0.3167 = -2.391'} />
					. Comme
					<KatexInline formula={'|t| = 2.391 < 2.57058'} />
					(on 5 degrés de liberté), on ne rejette pas
					<KatexInline formula={'H_0 : \\beta_{\\mathrm{Pop}} = 0'} />
					à 5 % : la population n’est pas significative, ce que confirme l’intervalle
					<KatexInline formula={icB2} />
					qui contient 0.
				</p>
				<p>
					<strong>(c)</strong> L’écart-type de
					<KatexInline formula={'\\hat\\beta_0'} />
					vaut 26.85, très large : l’intercept correspond à une extrapolation en
					<KatexInline formula={'X = 0'} />
					(loin du nuage, GNP entre 397 et 555), et sa variance est portée par
					<KatexInline formula={'(X^{\\top}X)^{-1}'} />
					. Une large dispersion de
					<KatexInline formula={'X'} />
					stabilise les pentes mais déstabilise l’intercept.
				</p>
			{/snippet}
			<p>
				Le jeu de données longley (1955–1962, États-Unis) relie le nombre d’actifs ayant un
				emploi
				<KatexInline formula={'\\mathrm{Actifs}'} />
				(en millions) au PNB
				<KatexInline formula={'\\mathrm{GNP}'} />
				(en milliards) et à la population
				<KatexInline formula={'\\mathrm{Population}'} />
				(en millions) :
			</p>
			<table class="data-table">
				<thead>
					<tr>
						<th>Année</th>
						<th>Actifs</th>
						<th>GNP</th>
						<th>Population</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>1955</td><td>66.019</td><td>397.469</td><td>117.388</td></tr>
					<tr><td>1956</td><td>67.857</td><td>419.180</td><td>118.734</td></tr>
					<tr><td>1957</td><td>68.169</td><td>442.769</td><td>120.445</td></tr>
					<tr><td>1958</td><td>66.513</td><td>444.546</td><td>121.950</td></tr>
					<tr><td>1959</td><td>68.655</td><td>482.704</td><td>123.366</td></tr>
					<tr><td>1960</td><td>69.564</td><td>502.601</td><td>125.368</td></tr>
					<tr><td>1961</td><td>69.331</td><td>518.173</td><td>127.852</td></tr>
					<tr><td>1962</td><td>70.551</td><td>554.894</td><td>130.081</td></tr>
				</tbody>
			</table>
			<p>
				L’ajustement du modèle
				<KatexInline formula={'Y = \\beta_0 + \\beta_1\\,\\mathrm{GNP} + \\beta_2\\,\\mathrm{Population} + \\varepsilon'} />
				donne
				<KatexInline formula={'\\hat\\beta = (120.0801,\\; 0.0882,\\; -0.7570)^{\\top}'} />
				avec les écarts-types
				<KatexInline formula={'\\mathrm{se} = (26.8533,\\; 0.0262,\\; 0.3167)^{\\top}'} />
				.
			</p>
			<p>
				<strong>(a)</strong> Calculer les intervalles de confiance à 95 % de
				<KatexInline formula={'\\beta_{\\mathrm{GNP}}'} />
				et de
				<KatexInline formula={'\\beta_{\\mathrm{Pop}}'} />
				(
				<KatexInline formula={'t_5(97.5\\%) = 2.57058'} />
				).
			</p>
			<p>
				<strong>(b)</strong> À 5 %, conclure le test de
				<KatexInline formula={'H_0 : \\beta_{\\mathrm{Pop}} = 0'} />
				.
			</p>
			<p>
				<strong>(c)</strong> Pourquoi l’intervalle de confiance de
				<KatexInline formula={'\\beta_0'} />
				est-il si large ?
			</p>
		</ExercisePanel>

		<h2 id="inference">Inférence globale et diagnostic</h2>

		<ExercisePanel number="4.3" title="Tableau d’ANOVA et test F emboîté (longley)">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Avec
					<KatexInline formula={'n = 8'} />, <KatexInline formula={'p = 2'} />
					on a
					<KatexInline formula={'\\mathrm{SCT} = 16.4550'} />
					,
					<KatexInline formula={'\\mathrm{SCE} = 15.1736'} />
					,
					<KatexInline formula={'\\mathrm{SCR} = 1.2814'} />
					(
					<KatexInline formula={'\\mathrm{SCT} = \\mathrm{SCE} + \\mathrm{SCR}'} />
					). Le tableau d’ANOVA est :
				</p>
				<table class="data-table">
					<thead>
						<tr>
							<th>Source</th>
							<th>d.d.l</th>
							<th>Somme des carrés</th>
							<th>Variance</th>
							<th>F</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Régression</td>
							<td>2</td>
							<td>15.1736</td>
							<td>7.5868</td>
							<td>29.60</td>
						</tr>
						<tr>
							<td>Erreur</td>
							<td>5</td>
							<td>1.2814</td>
							<td>0.2563</td>
							<td></td>
						</tr>
						<tr>
							<td>Total</td>
							<td>7</td>
							<td>16.4550</td>
							<td></td>
							<td></td>
						</tr>
					</tbody>
				</table>
				<p>
					La statistique vaut
					<KatexInline formula={fGlobal} />
					, soit
					<KatexInline formula={'F = 7.5868/0.2563 = 29.60'} />
					. Comme
					<KatexInline formula={'29.60 > F_{2,5}(0.95) = 5.786'} />
					, on rejette
					<KatexInline formula={'H_0 : \\beta_1 = \\beta_2 = 0'} />
					: le modèle global est significatif.
				</p>
				<p>
					<strong>(b)</strong> Pour tester
					<KatexInline formula={'H_0 : \\beta_{\\mathrm{Pop}} = 0'} />
					, on compare le modèle complet
					<KatexInline formula={'(R^2 = 0.9221)'} />
					au modèle réduit GNP seul
					<KatexInline formula={'(R_q^2 = 0.8331)'} />
					, avec
					<KatexInline formula={'q = 1'} />
					:
					<KatexBlock formula={fNested} />
					donc
					<KatexBlock formula={fNestedVal} />
					Comme
					<KatexInline formula={'5.715 < F_{1,5}(0.95) = 6.608'} />
					, on ne rejette pas
					<KatexInline formula={'H_0'} />
					: la population n’apporte rien d’utile une fois le PNB dans le modèle.
				</p>
				<p>
					<strong>(c)</strong>
					<KatexInline formula={'F = (-2.391)^2 = 5.715 = t^2'} />
					: pour
					<KatexInline formula={'q = 1'} />
					, le test F emboîté est exactement le test de Student au carré — même région de
					rejet, même décision.
				</p>
			{/snippet}
			<p>
				On reprend les données longley de l’exercice 4.2. L’ajustement du modèle complet
				<KatexInline formula={'(\\mathrm{GNP},\\, \\mathrm{Population})'} />
				donne
				<KatexInline formula={'R^2 = 0.9221'} />
				et
				<KatexInline formula={'\\mathrm{SCR} = 1.2814'} />
				; le modèle réduit GNP seul donne
				<KatexInline formula={'R_q^2 = 0.8331'} />
				.
			</p>
			<p>
				<strong>(a)</strong> Compléter le tableau d’ANOVA (degrés de liberté, sommes de carrés
				<KatexInline formula={'\\mathrm{SCE}'} />
				,
				<KatexInline formula={'\\mathrm{SCR}'} />
				,
				<KatexInline formula={'\\mathrm{SCT}'} />
				, variances, statistique
				<KatexInline formula={fGlobal} />
				) et conclure le test global de
				<KatexInline formula={'H_0 : \\beta_1 = \\beta_2 = 0'} />
				à 5 %
				(
				<KatexInline formula={'F_{2,5}(0.95) = 5.786'} />
				).
			</p>
			<p>
				<strong>(b)</strong> Construire le test emboîté de
				<KatexInline formula={'H_0 : \\beta_{\\mathrm{Pop}} = 0'} />
				avec la statistique
				<KatexInline formula={fNested} />
				et conclure à 5 %
				(
				<KatexInline formula={'F_{1,5}(0.95) = 6.608'} />
				).
			</p>
			<p>
				<strong>(c)</strong> Comparer la statistique obtenue au carré de la statistique de Student
				de l’exercice 4.2
				<KatexInline formula={'(t = -2.391)'} />
				. Que se passe-t-il quand
				<KatexInline formula={'q = 1'} />
				?
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.4" title="VIF et conditionnement (longley)">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Le
					<KatexInline formula={'R^2'} />
					de la régression d’un prédicteur sur l’autre vaut
					<KatexInline formula={'R_j^2 = \\rho^2 = 0.9906^2 = 0.9813'} />
					. Donc
					<KatexBlock formula={vifFormula} />
					soit
					<KatexInline formula={'\\mathrm{VIF}_{\\mathrm{GNP}} = \\mathrm{VIF}_{\\mathrm{Pop}} = 1/(1-0.9813) \\approx 53.4'} />
					. Comme
					<KatexInline formula={'53.4 > 10'} />
					, la règle courante signale une colinéarité forte.
				</p>
				<p>
					<strong>(b)</strong> La matrice de corrélation des deux prédicteurs a pour valeurs
					propres
					<KatexInline formula={'1 + \\rho = 1.9906'} />
					et
					<KatexInline formula={'1 - \\rho = 0.0094'} />
					, donc
					<KatexBlock formula={kappaFormula} />
					soit
					<KatexInline formula={'\\kappa = 1.9906/0.0094 \\approx 211.7'} />
					, inférieur au seuil 500.
				</p>
				<p>
					<strong>(c)</strong> Les deux indicateurs réagissent différemment : le VIF dépasse
					loin le seuil 10 tandis que
					<KatexInline formula={'\\kappa'} />
					reste sous 500. Avec deux prédicteurs,
					<KatexInline formula={'\\mathrm{VIF} = 1/(1-\\rho^2)'} />
					croît plus vite que
					<KatexInline formula={'\\kappa = (1+\\rho)/(1-\\rho)'} />
					lorsque
					<KatexInline formula={'\\rho \\to 1'} />
					. Dans tous les cas, le message est le même : les variances de
					<KatexInline formula={'\\hat\\beta_{\\mathrm{GNP}}'} />
					et
					<KatexInline formula={'\\hat\\beta_{\\mathrm{Pop}}'} />
					sont multipliées par un facteur ≈ 53, d’où les écarts-types larges (0.3167) et la
					perte de pouvoir des tests des exercices 4.2–4.3 — malgré un
					<KatexInline formula={'R^2 = 0.9221'} />
					élevé.
				</p>
			{/snippet}
			<p>
				Sur longley, la corrélation entre les deux prédicteurs vaut
				<KatexInline formula={'\\rho \\approx 0.9906'} />
				.
			</p>
			<p>
				<strong>(a)</strong> Calculer les VIF de
				<KatexInline formula={'\\mathrm{GNP}'} />
				et de
				<KatexInline formula={'\\mathrm{Population}'} />
				avec
				<KatexInline formula={vifFormula} />
				où
				<KatexInline formula={'R_j^2'} />
				est le
				<KatexInline formula={'R^2'} />
				de la régression de
				<KatexInline formula={'X_j'} />
				sur l’autre prédicteur. Comparer au seuil usuel.
			</p>
			<p>
				<strong>(b)</strong> La matrice de corrélation des deux prédicteurs a pour valeurs propres
				<KatexInline formula={'1 + \\rho'} />
				et
				<KatexInline formula={'1 - \\rho'} />
				. Calculer l’indice de conditionnement
				<KatexInline formula={kappaFormula} />
				et le comparer au seuil 500.
			</p>
			<p>
				<strong>(c)</strong> Les deux critères sont-ils d’accord sur ces données ? Que dit le VIF
				du sort des variances de
				<KatexInline formula={'\\hat\\beta_j'} />
				?
			</p>
		</ExercisePanel>

		<h2 id="facteurs-modeles">Facteurs et choix de modèle</h2>

		<ExercisePanel number="4.5" title="Encodage d’un facteur : trois codages, même ajustement">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Sans intercept, chaque colonne est un indicateur de niveau et
					<KatexInline formula={'\\hat\\beta'} />
					est simplement le vecteur des moyennes par niveau :
					<KatexInline formula={'\\hat\\beta = (4,\\; 8,\\; 12)^{\\top}'} />
					.
				</p>
				<p>
					<strong>(b)</strong> Avec le niveau N comme référence
					<KatexInline formula={'(\\beta_N = 0)'} />
					:
					<KatexInline formula={'\\hat\\beta_0 = 4'} />
					(moyenne du niveau N),
					<KatexInline formula={'\\hat\\beta_E = 8 - 4 = 4'} />
					(écart E − N),
					<KatexInline formula={'\\hat\\beta_S = 12 - 4 = 8'} />
					(écart S − N).
				</p>
				<p>
					<strong>(c)</strong> Avec la contrainte
					<KatexInline formula={'\\beta_N + \\beta_E + \\beta_S = 0'} />
					:
					<KatexInline formula={'\\hat\\beta_0 = 8'} />
					(moyenne générale),
					<KatexInline formula={'\\hat\\beta_N = 4 - 8 = -4'} />, <KatexInline
						formula={'\\hat\\beta_E = 0'}
					/>,
					<KatexInline formula={'\\hat\\beta_S = 12 - 8 = 4'} />
					; on vérifie
					<KatexInline formula={'\\hat\\beta_0 + \\hat\\beta_j ='} />
					la moyenne du niveau
					<KatexInline formula={'j'} />
					.
				</p>
				<p>
					<strong>(d)</strong> Les valeurs ajustées sont
					<KatexInline formula={'(4, 4, 8, 8, 12, 12)'} />
					dans les trois codages :
					<KatexInline formula={'\\mathrm{SCR} = 6'} />
					,
					<KatexInline formula={'\\mathrm{SCT} = 70'} />
					,
					<KatexInline formula={'R^2 = 64/70 \\approx 0.914'} />
					. Les paramètres dépendent du codage, l’ajustement (et le
					<KatexInline formula={'R^2'} />
					) non.
				</p>
			{/snippet}
			<p>
				On observe une variable réponse selon la direction du vent, facteur à trois niveaux
				<KatexInline formula={'\\{N, E, S\\}'} />
				, deux observations par niveau :
			</p>
			<table class="data-table">
				<thead>
					<tr>
						<th>Niveau</th>
						<th>N</th>
						<th>E</th>
						<th>S</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>Obs 1</td><td>3</td><td>7</td><td>11</td></tr>
					<tr><td>Obs 2</td><td>5</td><td>9</td><td>13</td></tr>
				</tbody>
			</table>
			<p>
				Le modèle est
				<KatexInline formula={modelFacteur} />
				avec un paramètre par niveau.
			</p>
			<p>
				<strong>(a)</strong> Encodage sans intercept (une colonne indicatrice par niveau) : écrire
				<KatexInline formula={'X'} />
				(6 × 3) et calculer
				<KatexInline formula={'\\hat\\beta'} />
				. Interpréter chaque paramètre.
			</p>
			<p>
				<strong>(b)</strong> Encodage de référence (niveau N) : écrire
				<KatexInline formula={'X'} />
				et interpréter
				<KatexInline formula={'\\hat\\beta_0'} />
				et chaque
				<KatexInline formula={'\\hat\\beta_j'} />
				.
			</p>
			<p>
				<strong>(c)</strong> Encodage somme
				<KatexInline formula={'(\\sum_j \\beta_j = 0)'} />
				: calculer les paramètres et interpréter
				<KatexInline formula={'\\hat\\beta_0'} />
				.
			</p>
			<p>
				<strong>(d)</strong> Comparer les valeurs ajustées
				<KatexInline formula={'\\hat Y'} />
				et le
				<KatexInline formula={'R^2'} />
				dans les trois codages. Que peut-on conclure sur l’unicité des paramètres ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.6" title="AIC vs BIC sur un jeu simulé">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Le calcul (avec
					<KatexInline formula={'\\mathrm{RSS}_d'} />
					la somme des carrés résiduels du polynôme de degré
					<KatexInline formula={'d'} />
					et
					<KatexInline formula={'k = d+1'} />
					) donne :
				</p>
				<table class="data-table">
					<thead>
						<tr>
							<th>d</th>
							<th>0</th>
							<th>1</th>
							<th>2</th>
							<th>3</th>
							<th>4</th>
							<th>5</th>
							<th>6</th>
							<th>7</th>
							<th>8</th>
							<th>9</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>AIC</td>
							<td>95.86</td>
							<td>62.09</td>
							<td>4.58</td>
							<td>4.25</td>
							<td>1.82</td>
							<td>3.54</td>
							<td>4.30</td>
							<td>−0.28</td>
							<td>−0.48</td>
							<td>−0.20</td>
						</tr>
						<tr>
							<td>BIC</td>
							<td>96.57</td>
							<td>63.50</td>
							<td>6.71</td>
							<td>7.08</td>
							<td>5.36</td>
							<td>7.79</td>
							<td>9.26</td>
							<td>5.38</td>
							<td>5.89</td>
							<td>6.88</td>
						</tr>
					</tbody>
				</table>
				<p>
					<strong>(b)</strong> L’AIC minimise en
					<KatexInline formula={'d = 8'} />
					(
					<KatexInline formula={'\\mathrm{AIC} = -0.48'} />
					) ; le BIC minimise en
					<KatexInline formula={'d = 4'} />
					(
					<KatexInline formula={'\\mathrm{BIC} = 5.36'} />
					).
				</p>
				<p>
					<strong>(c)</strong> Le vrai degré est
					<KatexInline formula={'d = 2'} />
					(ici le Cp de Mallows le sélectionne aussi — avec la convention de la démo 5.3,
					où
					<KatexInline formula={'\\hat\\sigma^2'} />
					est estimé sur le modèle de degré maximal
					<KatexInline formula={'d = 13'} />
					, et non sur le modèle de degré 9 ; sur la plage
					<KatexInline formula={'d \\le 9'} />
					seule, le Cp minimise en
					<KatexInline formula={'d = 4'} />
					). Avec
					<KatexInline formula={'n = 15'} />
					,
					<KatexInline formula={'\\log n = 2.71'} />
					: la pénalité BIC
					<KatexInline formula={'k\\log n'} />
					n’est que 1,36 fois la pénalité AIC
					<KatexInline formula={'2k'} />
					— insuffisante pour stopper la sélection de termes superflus. Quand
					<KatexInline formula={'n'} />
					croît,
					<KatexInline formula={'k\\log n \\gg 2k'} />
					et le BIC devient nettement plus parcimonieux (leçon 5, démo 5.8) : c’est la
					différence fondamentale entre les deux critères, au-delà de l’aspect numérique
					particulier à ce petit échantillon.
				</p>
			{/snippet}
			<p>
				On simule, comme dans la démo 5.3 de la leçon 5, une réponse suivant un vrai polynôme de
				degré
				<KatexInline formula={'d^* = 2'} />
				avec
				<KatexInline formula={'n = 15'} />
				observations et un bruit gaussien de variance
				<KatexInline formula={'\\sigma^2 = 0.64'} />
				(
				<KatexInline formula={'\\sigma = 0.8'} />
				), avec la graine 11.
			</p>
			<p>
				<strong>(a)</strong> Pour chaque degré
				<KatexInline formula={'d = 0, \\ldots, 9'} />
				, ajuster le polynôme et calculer
				<KatexInline formula={aicFormula} />
				et
				<KatexInline formula={bicFormula} />
				avec
				<KatexInline formula={'k = d+1'} />
				coefficients (la log-vraisemblance gaussienne maximisée vaut
				<KatexInline formula={'\\log \\hat L = -\\tfrac{n}{2}\\log(\\mathrm{RSS}/n) - \\tfrac{n}{2}(1 + \\log 2\\pi)'} />
				; les termes constants, indépendants de
				<KatexInline formula={'d'} />
				, ne changent pas l’argmin et peuvent être ignorés).
			</p>
			<p>
				<strong>(b)</strong> Quel degré sélectionne chaque critère ?
			</p>
			<p>
				<strong>(c)</strong> Le vrai degré est
				<KatexInline formula={'d^* = 2'} />
				. Commenter le comportement de l’AIC et du BIC avec
				<KatexInline formula={'n = 15'} />
				, puis expliquer ce qui change quand
				<KatexInline formula={'n'} />
				devient grand (pénalités
				<KatexInline formula={'2k'} />
				contre
				<KatexInline formula={'k\\log n'} />
				).
			</p>
		</ExercisePanel>

		<h2 id="complements">
			Compléments : interactions, ANCOVA, résidus partiels, MCG, pas à pas
		</h2>

		<ExercisePanel number="4.7" title="ANOVA à deux facteurs : tester l’interaction">
			<p>
				On génère un jeu de données à deux facteurs (comme la démo 2.7, <KatexInline formula={'twoFactorData'} />) :
				F1 = pluie (2 niveaux : non / oui), F2 = vent (3 niveaux : N / S / O), 5 observations par cellule,
				avec un effet d’interaction non nul. Les moyennes cellulaires observées sont :
			</p>
			<div class="data-table">
				<table>
					<thead>
						<tr>
							<th></th>
							<th>vent N</th>
							<th>vent S</th>
							<th>vent O</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<th>pluie non</th>
							<td>−1,702</td>
							<td>1,362</td>
							<td>−1,211</td>
						</tr>
						<tr>
							<th>pluie oui</th>
							<td>−6,089</td>
							<td>−2,390</td>
							<td>−2,972</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p>
				(a) Ajuster le modèle additif <KatexInline formula={'Y = \\beta_0 + \\alpha_i + \\beta_j'} /> (codage par référence)
				et le modèle avec interaction <KatexInline formula={'Y = \\beta_0 + \\alpha_i + \\beta_j + \\gamma_{ij}'} /> :
				on obtient <KatexInline formula={'\\mathrm{SCR}_{\\mathrm{add}} = 29{,}453'} /> et
				<KatexInline formula={'\\mathrm{SCR}_{\\mathrm{int}} = 20{,}071'} />
				(<KatexInline formula={'\\mathrm{SCT} = 168{,}391'} />).
			</p>
			<p>
				(b) Effectuer le test du F imbriqué pour l’interaction, avec
				<KatexInline formula={'q = (2-1)(3-1) = 2'} />, <KatexInline formula={'n = 30'} />,
				<KatexInline formula={'p = 5'} /> : calculer F et le comparer à la valeur critique
				<KatexInline formula={'F_{0{,}95\\,;\\,2,\\,24} = 3{,}403'} />.
			</p>
			<p>
				(c) Conclure au seuil de 5 %, et vérifier la conclusion à partir du tableau des moyennes cellulaires.
			</p>
			{#snippet solution()}
				<p>
					(a) Le modèle additif donne <KatexInline formula={'\\mathrm{SCR}_{\\mathrm{add}} = 29{,}453'} />
					(<KatexInline formula={'R^2_q = 0{,}8251'} />) et le modèle avec interaction
					<KatexInline formula={'\\mathrm{SCR}_{\\mathrm{int}} = 20{,}071'} />
					(<KatexInline formula={'R^2 = 0{,}8808'} />).
				</p>
				<p>
					(b) <KatexInline formula={'F = \\frac{(29{,}453 - 20{,}071)\\, / \\,2}{20{,}071 \\, / \\, 24} = 5{,}610'} />,
					degrés de liberté <KatexInline formula={'(2,\\,24)'} />, valeur critique 3,403.
				</p>
				<p>
					(c) Comme <KatexInline formula={'5{,}610 > 3{,}403'} />, on rejette l’hypothèse nulle d’absence
					d’interaction au seuil de 5 % : l’effet de la pluie dépend du vent. Le tableau confirme — la différence
					entre les lignes « oui » et « non » vaut −4,387 pour N, −3,752 pour S et −1,761 pour O : l’effet de
					la pluie n’est pas constant d’un vent à l’autre, c’est-à-dire que les moyennes ne sont pas alignées
					en un réseau parallèle, signature exacte d’une interaction.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="4.8" title="ANCOVA : droites parallèles et apport de la covariable">
			<p>
				Facteur F à 3 niveaux et covariable continue <KatexInline formula={'x \\in [0, 10]'} /> : 10 observations
				par niveau, générées avec le modèle (vrai) <KatexInline formula={'y = 1 + \\alpha_j + 0{,}8\\,x + \\varepsilon'} />,
				<KatexInline formula={'\\alpha = (0,\\,1{,}5,\\,-1)'} />, <KatexInline formula={'\\sigma = 0{,}5'} />
				(<KatexInline formula={'ancovaData'} />, seed 11).
			</p>
			<p>
				(a) Ajuster le modèle ANCOVA sans interaction (R : <KatexInline formula={'Y ~ x + F'} />) : quelle est la
				pente commune estimée ? Quelles sont les ordonnées à l’origine (<KatexInline formula={'x = 0'} />) des
				trois droites ajustées ?
			</p>
			<p>
				(b) Quel est l’apport de la covariable après le facteur ? Comparer le modèle à facteur seul
				(<KatexInline formula={'\\mathrm{SCR} = 195{,}980'} />, <KatexInline formula={'R^2 = 0{,}227'} />)
				au modèle ANCOVA (<KatexInline formula={'\\mathrm{SCR} = 8{,}361'} />, <KatexInline formula={'R^2 = 0{,}967'} />)
				par un test du F imbriqué (<KatexInline formula={'q = 1'} />, <KatexInline formula={'n = 30'} />,
				<KatexInline formula={'p = 3'} />, valeur critique <KatexInline formula={'F_{0{,}95\\,;\\,1,\\,26} = 4{,}225'} />).
			</p>
			<p>
				(c) Le modèle avec interaction (R : <KatexInline formula={'Y ~ x * F'} />) donne
				<KatexInline formula={'\\mathrm{SCR} = 7{,}434'} />. Effectuer le test du F imbriqué pour l’interaction
				(<KatexInline formula={'q = 2'} />, <KatexInline formula={'p = 5'} />, valeur critique
				<KatexInline formula={'F_{0{,}95\\,;\\,2,\\,24} = 3{,}403'} />) et conclure : l’hypothèse de droites
				parallèles est-elle acceptable ?
			</p>
			{#snippet solution()}
				<p>
					(a) La pente commune estimée vaut <KatexInline formula={'\\delta\\,\\hat{} = 0{,}841'} />
					(valeur vraie 0,8). Les ordonnées à l’origine des trois droites sont 0,732, 2,005 et −0,220 pour les
					niveaux 1, 2, 3 : les trois droites sont affines de pente identique — le facteur agit uniquement sur
					l’ordonnée à l’origine, ce qui est précisément le modèle ANCOVA à lignes parallèles.
				</p>
				<p>
					(b) <KatexInline formula={'F = \\frac{(195{,}980 - 8{,}361)\\, / \\,1}{8{,}361 \\, / \\, 26} = 583{,}42 > 4{,}225'} /> :
					après avoir expliqué la part de variance due au facteur, la covariable en explique encore une part très
					significative. C’est l’intérêt de l’ANCOVA : facteur et covariable sont ajustés l’un par rapport à
					l’autre, ce qui réduit la variance résiduelle (8,361 contre 195,980).
				</p>
				<p>
					(c) <KatexInline formula={'F = \\frac{(8{,}361 - 7{,}434)\\, / \\,2}{7{,}434 \\, / \\, 24} = 1{,}497 < 3{,}403'} /> :
					l’interaction n’est pas significative. L’hypothèse de droites parallèles
					(<KatexInline formula={'Y ~ x + F'} />) est acceptable : le gain de SCR (0,927) n’est pas à la hauteur
					des deux degrés de liberté dépensés.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="4.9" title="Résidus partiels : voir la relation masquée (prostate)">
			<p>
				Données prostate (<KatexInline formula={'n = 97'} />), modèle complet
				<KatexInline formula={'lpsa ~ lcavol + lweight + age + lbph + svi + lcp + gleason + pgg45'} /> avec
				<KatexInline formula={'\\hat{\\boldsymbol{\\beta}} = (0{,}669,\\;0{,}587,\\;0{,}454,\\;-0{,}020,\\;0{,}107,\\;0{,}766,\\;-0{,}105,\\;0{,}045,\\;0{,}005)'} />.
			</p>
			<p>
				(a) Calculer les résidus partiels de <KatexInline formula={'lcavol'} /> :
				<KatexInline formula={'\\hat{\\varepsilon}_{\\Delta,i} = \\hat{\\beta}_{lcavol}\\,x_{lcavol,i} + \\hat{\\varepsilon}_i = y_i - \\sum_{k \\neq lcavol} \\hat{\\beta}_k\\,x_{k,i}'} />,
				où la somme porte sur toutes les autres colonnes de la matrice de conception, intercept compris.
				Donner les cinq premières valeurs et vérifier l’identité
				<KatexInline formula={'\\hat{\\varepsilon}_{\\Delta,i} = y_i - \\sum_{k \\neq j} \\hat{\\beta}_k x_{k,i}'} />
				sur l’observation 1 (<KatexInline formula={'(y_1, x_1) = (-0{,}431,\\;-0{,}580,\\;2{,}770,\\;50,\\;-1{,}386,\\;0,\\;-1{,}386,\\;6,\\;0)'} />).
			</p>
			<p>
				(b) Pourquoi le nuage brut <KatexInline formula={'(lcavol,\\, y)'} /> est-il peu fiable pour étudier la
				relation <KatexInline formula={'lcavol \\to lpsa'} /> ?
			</p>
			<p>
				(c) Qu’indique une courbure systématique du nuage
				<KatexInline formula={'(lcavol,\\, \\hat{\\varepsilon}_{\\Delta})'} />, et quels sont les remèdes usuels ?
			</p>
			{#snippet solution()}
				<p>
					(a) Les cinq premiers résidus partiels de <KatexInline formula={'lcavol'} /> valent
					−1,646 ; −1,470 ; −1,006 ; −1,454 ; −0,909. Pour l’observation 1, la somme des effets estimés des
					autres prédicteurs vaut
					<KatexInline formula={'0{,}669 + 0{,}454 \\times 2{,}770 - 0{,}020 \\times 50 - 0{,}107 \\times (-1{,}386) + (-0{,}105) \\times (-1{,}386) + 0{,}045 \\times 6 \\approx 1{,}215'} />
					(les termes <KatexInline formula={'svi'} /> et <KatexInline formula={'pgg45'} /> sont nuls pour cette
					observation), donc
					<KatexInline formula={'\\hat{\\varepsilon}_{\\Delta,1} = -0{,}431 - 1{,}215 \\approx -1{,}646'} />,
					conforme à la table.
				</p>
				<p>
					(b) Les autres prédicteurs influencent aussi <KatexInline formula={'lpsa'} /> (notamment
					<KatexInline formula={'lweight'} /> et <KatexInline formula={'svi'} />) et sont corrélés à
					<KatexInline formula={'lcavol'} /> : le nuage brut mêle l’effet de
					<KatexInline formula={'lcavol'} /> aux effets de ces variables. Le résidu partiel retire leurs effets
					estimés et isole la relation conditionnelle entre <KatexInline formula={'lcavol'} /> et
					<KatexInline formula={'lpsa'} /> (leçon 4, bloc sur les résidus partiels).
				</p>
				<p>
					(c) Une courbure systématique indique que la relation entre
					<KatexInline formula={'lcavol'} /> et <KatexInline formula={'lpsa'} /> n’est pas linéaire : on cherche
					alors une transformation de <KatexInline formula={'lcavol'} /> (polynôme
					<KatexInline formula={'lcavol^2'} />, logarithme, exponentielle…) à ajouter ou substituer dans le
					modèle (leçon 4, bloc « diagnostic de la linéarité »).
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="4.10" title="MCG à corrélation AR(1) connue">
			<p>
				Régression simple <KatexInline formula={'y_i = 2 + 1{,}5\\,x_i + \\varepsilon_i'} /> avec
				<KatexInline formula={'x_i = 10 i / 29'} /> (<KatexInline formula={'i = 0, \\dots, 29'} />) et des erreurs de
				moyenne nulle de matrice de covariance <KatexInline formula={'\\Sigma_\\varepsilon = \\mathcal{F}'} /> où
				<KatexInline formula={'\\mathcal{F}_{ij} = \\rho^{|i-j|}'} />, <KatexInline formula={'\\rho = 0{,}7'} />
				(variance des innovations <KatexInline formula={'\\sigma^2 = 1'} /> ; la variance stationnaire des
				<KatexInline formula={'\\varepsilon_i'} /> vaut <KatexInline formula={'1 / (1 - \\rho^2) \\approx 1{,}905'} />).
			</p>
			<p>
				(a) L’estimateur MCO <KatexInline formula={'\\hat{\\beta}_1'} /> reste non biaisé, mais sa variance n’est
				plus <KatexInline formula={'\\sigma^2 (X^{\\top}X)^{-1}'} /> : c’est
				<KatexInline formula={'\\sigma^2 (X^{\\top}X)^{-1} X^{\\top} \\mathcal{F} X (X^{\\top}X)^{-1}'} />.
				La calculer (numériquement).
			</p>
			<p>
				(b) Pour le MCG (le <KatexInline formula={'\\mathcal{F}'} /> est connu) :
				<KatexInline formula={'\\hat{\\beta}_{\\mathrm{MCG}} = (X^{\\top}\\mathcal{F}^{-1}X)^{-1} X^{\\top}\\mathcal{F}^{-1} Y'} />,
				<KatexInline formula={'\\mathrm{Var}(\\hat{\\beta}_{\\mathrm{MCG}}) = \\sigma^2 (X^{\\top}\\mathcal{F}^{-1}X)^{-1}'} />.
				Calculer <KatexInline formula={'\\mathrm{Var}(\\hat{\\beta}_{1,\\mathrm{MCG}})'} />.
			</p>
			<p>
				(c) Comparer les deux variances et recalculer leur rapport pour <KatexInline formula={'\\rho = 0{,}9'} />.
				Commenter au regard de la propriété BLUE (leçon 3, section MCG).
			</p>
			{#snippet solution()}
				<p>
					(a) <KatexInline formula={'\\mathrm{Var}_{\\mathrm{MCO}}(\\hat{\\beta}_1) \\approx 0{,}03056'} />.
				</p>
				<p>
					(b) <KatexInline formula={'\\mathrm{Var}_{\\mathrm{MCG}}(\\hat{\\beta}_1) \\approx 0{,}02705'} />.
				</p>
				<p>
					(c) Le rapport vaut ≈ 1,13 : sous l’hypothèse (H2′) d’erreurs autocorrélées, la variance de
					<KatexInline formula={'\\hat{\\beta}_{1,\\mathrm{MCO}}'} /> est gonflée, tandis que le MCG — estimateur
					BLEU — a la plus petite variance. Le gain croît avec <KatexInline formula={'\\rho'} /> : pour
					<KatexInline formula={'\\rho = 0{,}9'} />, <KatexInline formula={'\\mathrm{Var}_{\\mathrm{MCO}} \\approx 0{,}12152'} />
					contre <KatexInline formula={'\\mathrm{Var}_{\\mathrm{MCG}} \\approx 0{,}09732'} /> (rapport ≈ 1,25).
					Pratiquement, <KatexInline formula={'\\mathcal{F}'} /> s’inverse numériquement (fonction
					<KatexInline formula={'solve(F)'} /> de R) ; les matrices <KatexInline formula={'X^{\\top}\\mathcal{F}^{-1}X'} />
					et <KatexInline formula={'X^{\\top}\\mathcal{F}^{-1}Y'} /> s’assemblent ensuite comme dans le MCO.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="4.11" title="Sélection pas à pas (prostate) : AIC vs BIC">
			<p>
				Données prostate (<KatexInline formula={'n = 97'} />, <KatexInline formula={'p = 8'} /> prédicteurs).
				Les critères sont ceux de la leçon 5 : <KatexInline formula={'\\mathrm{AIC} = -2 \\log L + 2k'} />
				(<KatexInline formula={'k'} /> paramètre en plus de la variance) et
				<KatexInline formula={'\\mathrm{BIC} = -2 \\log L + k \\log n'} />.
			</p>
			<p>
				(a) Sélection pas à pas avant (forward) avec l’AIC : donner la trajectoire (variable ajoutée à chaque pas
				valeur de l’AIC correspondante) et le modèle final.
			</p>
			<p>
				(b) Sélection pas à pas arrière (backward) avec l’AIC, en partant du modèle complet
				(<KatexInline formula={'\\mathrm{AIC} = -58{,}322'} />) : quelles variables sont retirées, dans quel
				ordre ? Quel est le modèle final ?
			</p>
			<p>
				(c) Que donne la stratégie « both » (forward puis backward) avec l’AIC ? Expliquer sa similarité avec
				l’issue de (a).
			</p>
			<p>
				(d) Refaire la stratégie « both » avec le BIC : donner la trajectoire et le modèle final, et commenter la
				différence avec l’AIC (rappelez-vous de l’exercice 4.6).
			</p>
			{#snippet solution()}
				<p>
					(a) <KatexInline formula={'\\mathrm{AIC} = 28{,}837'} /> (modèle constant) ; + lcavol →
					<KatexInline formula={'-44{,}366'} /> ; + lweight → <KatexInline formula={'-52{,}690'} /> ;
					+ svi → <KatexInline formula={'-60{,}676'} /> ; + lbph → <KatexInline formula={'-61{,}352'} /> ;
					+ age → <KatexInline formula={'-61{,}374'} />. Aucun ajout supplémentaire ne diminue l’AIC : le modèle
					final est <KatexInline formula={'lpsa ~ lcavol + lweight + svi + lbph + age'} /> (5 variables).
				</p>
				<p>
					(b) Depuis <KatexInline formula={'\\mathrm{AIC} = -58{,}322'} /> (modèle complet) : − gleason →
					<KatexInline formula={'-60{,}231'} /> ; − lcp → <KatexInline formula={'-60{,}789'} /> ;
					− pgg45 → <KatexInline formula={'-61{,}374'} />. On retrouve exactement le même modèle final que (a) —
					ici, avant et arrière convergent.
				</p>
				<p>
					(c) La stratégie « both » reproduit d’abord la trajectoire forward à l’identique (elle part du modèle
					constant), puis n’effectue aucun retrait améliorant le critère : même modèle final que (a).
				</p>
				<p>
					(d) Avec le BIC : <KatexInline formula={'31{,}412'} /> → + lcavol <KatexInline formula={'-39{,}217'} />
					→ + lweight <KatexInline formula={'-44{,}966'} /> → + svi <KatexInline formula={'-50{,}377'} />, puis
					arrêt : le modèle final est <KatexInline formula={'lpsa ~ lcavol + lweight + svi'} /> (3 variables).
					La pénalité du BIC, <KatexInline formula={'k \\log n \\approx 4{,}57'} /> par paramètre, est plus de
					deux fois celle de l’AIC (<KatexInline formula={'2k = 2'} />) : un paramètre doit apporter un gain de
					bon ajustement plus important pour être retenu, et le modèle sélectionné est donc plus parcimonieux
					(leçon 5, bloc sur le BIC ; exercice 4.6).
				</p>
			{/snippet}
		</ExercisePanel>
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
