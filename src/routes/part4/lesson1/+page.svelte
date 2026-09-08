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

	const meta = getPageByPath('/part4/lesson1');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Formules (course_sources/sophie/StatM1S1_2025.pdf) ──
	const modelEq = String.raw`Y_i = \beta_0 + \beta_1 x_{i1} + \cdots + \beta_p x_{ip} + \varepsilon_i`;
	const matrixEq = String.raw`Y = X\beta + \varepsilon`;
	const h1 = String.raw`\operatorname{rang}(X) = p + 1`;
	const h2 = String.raw`\mathrm{E}(\varepsilon) = 0_n \quad \text{et} \quad \Sigma_\varepsilon = \sigma^2 I_n`;
	const hatEq = String.raw`P_X = X(X^{\mathrm{T}}X)^{-1}X^{\mathrm{T}}`;
	const olsEq = String.raw`\hat{\beta} = (X^{\mathrm{T}}X)^{-1}X^{\mathrm{T}}Y`;
	const sseExpand = String.raw`\|Y - X\beta\|^2 = Y^{\mathrm{T}}Y - 2\beta^{\mathrm{T}}X^{\mathrm{T}}Y + \beta^{\mathrm{T}}X^{\mathrm{T}}X\beta`;
	const normalEq = String.raw`-2X^{\mathrm{T}}Y + 2X^{\mathrm{T}}X\beta = 0`;
	const varBetaEq = String.raw`\Sigma_{\hat{\beta}} = \sigma^2 (X^{\mathrm{T}}X)^{-1}`;
	const residEq = String.raw`\hat{\varepsilon} = Y - \hat{Y} = (I_n - P_X)Y`;
	const sigma2Eq = String.raw`\hat{\sigma}^2 = \frac{1}{n-p-1}\|\hat{\varepsilon}\|^2 = \frac{1}{n-p-1}\sum_{i=1}^{n}\hat{\varepsilon}_i^2`;
	const seEq = String.raw`\hat{\sigma}_{\hat{\beta}_{j-1}} = \sqrt{\hat{\sigma}^2 \, [(X^{\mathrm{T}}X)^{-1}]_{jj}}`;
	const scrEq = String.raw`\mathrm{SCR} = \|Y - \hat{Y}\|^2 = \|\hat{\varepsilon}\|^2`;
	const sceEq = String.raw`\mathrm{SCE} = \|\hat{Y} - \bar{y}\,1\|^2`;
	const sctEq = String.raw`\mathrm{SCT} = \|Y - \bar{y}\,1\|^2`;
	const r2Eq = String.raw`R^2 = \frac{\mathrm{SCE}}{\mathrm{SCT}}`;
	const r2adjEq = String.raw`\tilde{R}^2 = 1 - \frac{n-1}{n-p-1}\cdot\frac{\mathrm{SCR}}{\mathrm{SCT}}`;
	const predEq = String.raw`\hat{y} = 3{,}2195 - 12{,}0562 \times \mathrm{NbEnfU} + 0{,}5803 \times \mathrm{BEU} + 0{,}6411 \times \mathrm{NSE}`;

	const tocEntries: TocEntry[] = [
		{ id: 'exemple-swiss', label: '1.1 Exemple : fécondité en Suisse (1888)', color: 'belief' },
		{ id: 'modele', label: '1.2 Le modèle de régression linéaire multiple', color: 'neutral' },
		{ id: 'matriciel', label: '1.3 Écriture matricielle et géométrie', color: 'neutral' },
		{ id: 'mco', label: '1.4 Estimateur des moindres carrés', color: 'positive' },
		{ id: 'residus', label: '1.5 Résidus et estimation de σ²', color: 'neutral' },
		{ id: 'sommes-carrés', label: '1.6 Sommes de carrés et R²', color: 'surprise' },
		{ id: 'exemple-bien-etre', label: '1.7 Exemple numérique : le bien-être', color: 'agent' }
	];
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Le modèle linéaire et les moindres carrés'}
	subtitle="Moindres carrés, Gauss–Markov et coefficient de détermination"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="exemple-swiss">1.1 Exemple d'introduction : la fécondité en Suisse en 1888</h2>

		<p>
			La régression linéaire multiple est l'extension à plusieurs variables explicatives
			de la régression simple : on cherche l'effet, sur une variable aléatoire
			quantitative <KatexInline formula="Y" />, de plusieurs régresseurs — et,
			éventuellement, à prédire <KatexInline formula="Y" /> à partir d'eux.
		</p>

		<p>
			Le jeu de données <code>swiss</code> (disponible dans R) concerne les 47
			provinces francophones de la Suisse vers 1888. On veut expliquer l'indice de
			fécondité <KatexInline formula="y_i" /> de la province <KatexInline formula="i" />
			par quatre indicateurs : <em>Agriculture</em> (% d'hommes travaillant dans
			l'agriculture), <em>Education</em> (% de conscrits ayant un niveau supérieur à
			l'école primaire), <em>Catholique</em> (% de catholiques) et <em>Mortalité
			infantile</em> (% d'enfants dont l'espérance de vie est inférieure à un an).
		</p>

		<p>
			D'abord, quatre régressions <strong>simples</strong>, une par variable — le
			modèle <KatexInline formula={String.raw`y_i \approx \beta_0 + \beta_1 x_i`} /> :
		</p>

		<table class="data-table">
			<thead>
				<tr>
					<th>Estimation</th>
					<th>β̂0</th>
					<th>β̂1</th>
					<th>R²</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Agriculture</td>
					<td>60.3</td>
					<td>0.194</td>
					<td>0.1247</td>
				</tr>
				<tr>
					<td>Education</td>
					<td>79.6</td>
					<td>−0.862</td>
					<td>0.4406</td>
				</tr>
				<tr>
					<td>Catholique</td>
					<td>64.4</td>
					<td>0.139</td>
					<td>0.2150</td>
				</tr>
				<tr>
					<td>Mortalité infantile</td>
					<td>34.5</td>
					<td>1.787</td>
					<td>0.1735</td>
				</tr>
			</tbody>
		</table>

		<p>
			Même la meilleure variable seule (<em>Education</em>) n'explique que 44 % de la
			variation. On fait mieux en prenant les quatre variables <em>en même temps</em> —
			la régression multiple
			<KatexInline formula={String.raw`y_i \approx \beta_0 + \beta_1 x_{i1} + \beta_2 x_{i2} + \beta_3 x_{i3} + \beta_4 x_{i4}`} /> :
		</p>

		<table class="data-table">
			<thead>
				<tr>
					<th>Estimation</th>
					<th>β̂0</th>
					<th>β̂1</th>
					<th>β̂2</th>
					<th>β̂3</th>
					<th>β̂4</th>
					<th>R² ajusté</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>multiple</td>
					<td>62.1</td>
					<td>−0.155</td>
					<td>−0.98</td>
					<td>0.125</td>
					<td>1.078</td>
					<td>0.6707</td>
				</tr>
			</tbody>
		</table>

		<p>
			Le coefficient de détermination <strong>ajusté</strong> (0.6707), qui tient
			compte du nombre de régresseurs, montre un ajustement nettement meilleur que
			toute régression simple. (Le jeu <code>swiss</code> est embarqué dans le cours
			et vérifié contre ce tableau.)
		</p>

		<h2 id="modele">1.2 Le modèle de régression linéaire multiple</h2>

		<p>
			Soit <KatexInline formula="Y" /> la variable aléatoire à expliquer (variable
			dépendante), et <KatexInline formula={String.raw`x_1, \dots, x_p`} /> <em>p</em>
			régresseurs (variables explicatives) <strong>déterministes</strong> — connus et
			non aléatoires. Pour l'individu <KatexInline formula="i" /> :
		</p>

		<KatexBlock formula={modelEq} />

		<p>
			où <KatexInline formula={String.raw`\beta_0, \dots, \beta_p`} /> sont des
			paramètres inconnus à estimer, et <KatexInline formula={String.raw`\varepsilon_i`} />
			l'erreur aléatoire commise lorsque l'on mesure <KatexInline formula={String.raw`Y_i`} /> —
			une variable aléatoire d'espérance nulle et de variance inconnue
			<KatexInline formula={String.raw`\sigma^2`} />, elle aussi à estimer.
		</p>

		<DefinitionBlock number="(H1)" title="Hypothèse">
			<p>
				La matrice <KatexInline formula="X" /> des covariables est de plein rang :
				<KatexInline formula={h1} />.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="(H2)" title="Hypothèse">
			<p>
				Les erreurs <KatexInline formula={String.raw`\varepsilon_i`} /> sont centrées,
				de même variance et non corrélées entre elles :
			</p>
			<KatexBlock formula={h2} />
		</DefinitionBlock>

		<p>
			Comme en régression simple, on estime les paramètres par la méthode des
			<strong>moindres carrés</strong> : on minimise la somme des carrés
			<KatexInline formula={String.raw`\sum_{i=1}^{n}\left(Y_i - \beta_0 - \sum_{j=1}^{p}\beta_j x_{ij}\right)^2`} />
			par rapport à <KatexInline formula={String.raw`\beta_0, \dots, \beta_p`} />. Les
			paramètres estimés sont notés <KatexInline formula={String.raw`\hat{\beta}_j`} />, la
			valeur ajustée de <KatexInline formula={String.raw`Y_i`} /> vaut
			<KatexInline formula={String.raw`\hat{Y}_i = \hat{\beta}_0 + \sum_{j=1}^{p}\hat{\beta}_j x_{ij}`} />, et
			<KatexInline formula={String.raw`\hat{\varepsilon}_i = Y_i - \hat{Y}_i`} /> est le
			<strong>résidu</strong> (erreur de reconstitution) de l'individu
			<KatexInline formula="i" />.
		</p>

		<h2 id="matriciel">1.3 Écriture matricielle et géométrie</h2>

		<p>
			Notons <KatexInline formula={String.raw`Y = (Y_1, \dots, Y_n)^{\mathrm{T}}`} /> le vecteur colonne des
			observations. Le modèle s'écrit alors (éq. 2 des sources) :
		</p>

		<KatexBlock formula={matrixEq} />

		<p>avec :</p>
		<ul>
			<li>
				<KatexInline formula={String.raw`X = (1, x_1, \dots, x_p)`} /> matrice
				<KatexInline formula={String.raw`n \times (p+1)`} /> de plein rang
				<KatexInline formula="(H1)" />, dont la première colonne est le vecteur de
				uns ;
			</li>
			<li>
				<KatexInline formula={String.raw`\beta = (\beta_0, \dots, \beta_p)^{\mathrm{T}}`} />
				vecteur des paramètres — <KatexInline formula={String.raw`\beta_0`} /> est la
				constante (« intercept » des logiciels anglo-saxons) ;
			</li>
			<li>
				<KatexInline formula={String.raw`\varepsilon = (\varepsilon_1, \dots, \varepsilon_n)^{\mathrm{T}}`} />
				vecteur des erreurs, vérifiant <KatexInline formula="(H2)" />.
			</li>
		</ul>

		<p>
			La matrice
			<KatexInline formula={hatEq} />, appelée <strong>matrice chapeau</strong>, est la
			matrice de <strong>projection orthogonale</strong> sur le sous-espace
			<KatexInline formula={String.raw`\mathrm{Vect}(X)`} /> engendré par les colonnes de
			<KatexInline formula="X" /> : la valeur ajustée
			<KatexInline formula={String.raw`\hat{Y} = P_X Y`} /> est la projection de
			<KatexInline formula="Y" /> sur ce sous-espace, et le vecteur des résidus
			<KatexInline formula={residEq} /> est orthogonal à
			<KatexInline formula={String.raw`\mathrm{Vect}(X)`} /> (
			<KatexInline formula={String.raw`\hat{\varepsilon} \perp \mathrm{Vect}(X)`} />) —
			c'est la propriété géométrique derrière les moindres carrés.
		</p>

		<h2 id="mco">1.4 Estimateur des moindres carrés</h2>

		<TheoremBlock number="1" title="Théorème (MCO)">
			<p>
				Sous l'hypothèse <KatexInline formula="(H1)" />, la matrice
				<KatexInline formula={String.raw`X^{\mathrm{T}}X`} /> étant inversible,
				l'estimateur des moindres carrés <KatexInline formula={String.raw`\hat{\beta}`} />
				de <KatexInline formula={String.raw`\beta`} /> a la forme
			</p>
			<KatexBlock formula={olsEq} />
		</TheoremBlock>

		<div class="proof-block">
			<p><strong>Éléments de preuve.</strong> La fonction à minimiser s'écrit</p>
			<KatexBlock formula={sseExpand} />
			<p>sa dérivée par rapport à <KatexInline formula={String.raw`\beta`} /> vaut</p>
			<KatexBlock formula={normalEq} />
			<p>
				et le poser nul donne bien
				<KatexInline formula={olsEq} /> (les équations
				<KatexInline formula={String.raw`X^{\mathrm{T}}X\hat{\beta} = X^{\mathrm{T}}Y`} />
				s'appellent les <em>équations normales</em>).
			</p>
		</div>

		<p>Sous <KatexInline formula={String.raw`(\mathrm{H1})\text{–}(\mathrm{H2})`} />, l'estimateur vérifie :</p>
		<ul>
			<li>
				<strong>sans biais</strong> : <KatexInline formula={String.raw`\mathrm{E}(\hat{\beta}) = \beta`} /> ;
			</li>
			<li>
				matrice de variance-covariance
				<KatexInline formula={varBetaEq} /> (éq. 3) ;
			</li>
			<li>
				<strong>Gauss–Markov</strong> : parmi les estimateurs sans biais fonctions
				linéaires des <KatexInline formula={String.raw`Y_i`} />,
				<KatexInline formula={String.raw`\hat{\beta}`} /> est de variance minimale —
				il est BLUE (<em>Best Linear Unbiased Estimator</em>).
			</li>
		</ul>

		<InteractiveSection number="1.1" title="Ajuster la droite par moindres carrés" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmOlsFit.svelte')} />
		</InteractiveSection>

		<h2 id="residus">1.5 Résidus et estimation de σ²</h2>

		<p>
			Le vecteur des valeurs ajustées est
			<KatexInline formula={String.raw`\hat{Y} = X\hat{\beta} = P_XY`} />, et celui des
			résidus <KatexInline formula={residEq} />. Un estimateur <strong>sans biais</strong>
			de la variance <KatexInline formula={String.raw`\sigma^2`} /> est
		</p>

		<KatexBlock formula={sigma2Eq} />

		<p>
			(les <KatexInline formula={String.raw`n-p-1`} /> degrés de liberté tiennent
			compte des <KatexInline formula={String.raw`p+1`} /> paramètres estimés). À
			partir de l'éq. (3), en remplaçant
			<KatexInline formula={String.raw`\sigma^2`} /> par
			<KatexInline formula={String.raw`\hat{\sigma}^2`} />, on obtient
			<KatexInline formula={String.raw`\hat{\Sigma}_{\hat{\beta}} = \hat{\sigma}^2 (X^{\mathrm{T}}X)^{-1}`} /> ;
			pour chaque coefficient, l'écart-type estimé vaut
		</p>

		<KatexBlock formula={seEq} />

		<p>
			où <KatexInline formula={String.raw`[(X^{\mathrm{T}}X)^{-1}]_{jj`} /> est
			l'élément n° <KatexInline formula="j" /> de la diagonale. La précision de chaque
			coefficient est donc entièrement portée par la matrice
			<KatexInline formula={String.raw`(X^{\mathrm{T}}X)^{-1}`} /> — en particulier par
			la dispersion des valeurs des régresseurs.
		</p>

		<InteractiveSection number="1.2" title="Dispersion de X et variance de β̂" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmVarianceBeta.svelte')} />
		</InteractiveSection>

		<h2 id="sommes-carrés">1.6 Sommes de carrés et coefficient de détermination</h2>

		<p>On définit les trois <strong>sommes de carrés</strong> :</p>

		<KatexBlock formula={scrEq} />
		<KatexBlock formula={sceEq} />
		<KatexBlock formula={sctEq} />

		<p>
			c'est-à-dire la variation résiduelle, la variation expliquée par le modèle et la
			variation totale. On a alors l'identité
			<KatexInline formula={String.raw`\mathrm{SCT} = \mathrm{SCE} + \mathrm{SCR}`} />, et le
			<strong>coefficient de détermination</strong> est le rapport
		</p>

		<KatexBlock formula={r2Eq} />

		<p>
			— la part de la variation de <KatexInline formula="Y" /> expliquée par le modèle :
			plus <KatexInline formula={String.raw`R^2`} /> est proche de 1, meilleur est
			l'ajustement. Mais <KatexInline formula={String.raw`R^2`} /> ne tient pas compte du
			nombre de régresseurs : on définit le <strong>R² ajusté</strong>
		</p>

		<KatexBlock formula={r2adjEq} />

		<InteractiveSection number="1.3" title="Sommes de carrés et R²" onInteract={tracker.trackInteraction}>
			<DeferredDemo load={() => import('$lib/components/demos/LmSumsOfSquares.svelte')} />
		</InteractiveSection>

		<h2 id="exemple-bien-etre">1.7 Exemple numérique : prédire le sentiment de bien-être</h2>

		<ExampleBlock number="1" title="Exemple (StatM1S1_2025.pdf, p. 15–19)">
			<p>
				Un objectif de l'étude était de prédire le sentiment de bien-être (score « BE »)
				sept ans après la sortie de l'Université, à partir de variables mesurées
				pendant la scolarité : nombre d'enfants durant la scolarité (NbEnfU), bien-être
				à l'Université (BEU) et niveau socio-économique des parents (NSE). Les 10
				individus :
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
				En calculant
				<KatexInline formula={String.raw`\hat{\beta} = (X^{\mathrm{T}}X)^{-1}X^{\mathrm{T}}y`} />
				— avec
				<KatexInline formula={String.raw`X^{\mathrm{T}}X = \begin{pmatrix} 10 & 7 & 242 & 388 \\ 7 & 13 & 204 & 360 \\ 242 & 204 & 6820 & 9679 \\ 388 & 360 & 9679 & 16184 \end{pmatrix}`} />,
				son inverse
				<KatexInline formula={String.raw`(X^{\mathrm{T}}X)^{-1} = \begin{pmatrix} 7.9183 & 2.4750 & -0.0493 & -0.2154 \\ 2.4750 & 0.9790 & -0.0132 & -0.0732 \\ -0.0493 & -0.0132 & 0.0013 & 0.0007 \\ -0.2154 & -0.0732 & 0.0007 & 0.0064 \end{pmatrix}`} />
				et
				<KatexInline formula={String.raw`X^{\mathrm{T}}y = (337,\ 215,\ 8483,\ 12902)^{\mathrm{T}}`} /> —
				on obtient
			</p>
			<KatexBlock formula={String.raw`\hat{\beta} = \begin{pmatrix} 3.2195 \\ -12.0562 \\ 0.5803 \\ 0.6411 \end{pmatrix}`} />
			<p>
				d'où
				<KatexInline formula={String.raw`\hat{\sigma}^2 = \frac{1}{10-4}\|\hat{\varepsilon}\|^2 = 16{,}8852`} />,
				l'équation de régression
			</p>
			<KatexBlock formula={predEq} />
			<p>et la prédiction, pour un ancien étudiant ayant eu 1 enfant à l'Université, un BEU de 30 et un NSE de 50 :</p>
			<KatexBlock formula={String.raw`\hat{y} = 40{,}6273 \approx 41`} />
		</ExampleBlock>

		<Callout type="insight" title="Dans R">
			<p>
				Tout ce que la leçon vient de faire à la main se fait en deux lignes :
				<code>m &lt;- lm(BE ~ NbEnfU + BEU + NSE, data = bienEtre)</code> puis
				<code>summary(m)</code> — qui renvoie β̂, les écarts-types, les statistiques
				<em>T</em>, <KatexInline formula={String.raw`R^2`} /> et le R² ajusté.
			</p>
		</Callout>

		<Callout type="note" title="Vers la suite">
			<p>
				Deux questions restent en suspens. <strong>Et si les covariables sont
				qualitatives</strong> (un facteur à trois niveaux plutôt qu'une mesure) ? C'est
				l'objet de la <a href="/part4/lesson2">leçon 2</a> (ANOVA et ANCOVA). Et si
				on veut des <strong>intervalles de confiance</strong> et des <strong>tests</strong>
				? Il faudra supposer les erreurs gaussiennes — la <a href="/part4/lesson3">leçon 3</a>.
			</p>
		</Callout>
	</TheorySection>
</PageTemplate>

<style>
	.data-table {
		width: 100%;
		max-width: 34rem;
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

	.proof-block {
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 6%, transparent);
		font-size: 0.9375rem;
	}

	.proof-block p {
		margin: 0.4rem 0;
	}
</style>
