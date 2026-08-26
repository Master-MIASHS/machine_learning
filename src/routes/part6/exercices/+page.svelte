<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';

	const meta = getPageByPath('/part6/exercices');
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	// ── Table of Contents ──

	const tocEntries: TocEntry[] = [
		{
			id: 'concentration-empirique',
			label: 'Concentration et risque empirique',
			description: '8 exercices — Markov, Tchebychev, Hoeffding, et la limite du classifieur fixé',
			color: 'epistemic'
		},
		{
			id: 'classe-finie',
			label: 'Généralisation pour une classe finie',
			description: '9 exercices — échantillons trompeurs, union bound, Théorèmes 3.1 et 3.2',
			color: 'belief'
		},
		{
			id: 'dimension-vc',
			label: 'Dimension VC, Sauer-Shelah et SVM',
			description: '12 exercices — brisure, coefficient de brisure, Théorèmes 3.3 et 3.4',
			color: 'surprise'
		},
		{
			id: 'limites-vc-double-descente',
			label: 'Limites de VC et double descente',
			description: '9 exercices — Bartlett, double descente, biais implicite, normes, Rademacher',
			color: 'agent'
		}
	];

	// ── Formula variables reused across several exercises ──

	const ermDef = '\\hat h_{\\mathcal S_n} = \\arg\\min_{h\\in\\mathcal H} R_{\\mathcal S_n}(h)';
	const hBadDef = '\\mathcal H_{\\text{bad}} = \\{h\\in\\mathcal H : R(h) > \\varepsilon\\}';
	const mDef =
		'\\mathcal M = \\{\\mathcal S_n : \\exists\\, h\\in\\mathcal H_{\\text{bad}},\\ R_{\\mathcal S_n}(h)=0\\}';
	const separableStatement =
		'\\mathbb{P}^n\\big(R(\\hat h_{\\mathcal S_n}) > \\varepsilon\\big) \\le |\\mathcal H|\\, e^{-n\\varepsilon}';
	const separableCorollary = 'R(\\hat h_{\\mathcal S_n}) \\le \\frac{\\log(|\\mathcal H|/\\delta)}{n}';
	const uniformRiskBound =
		'R(\\hat h_{\\mathcal S_n}) \\le R_{\\mathcal S_n}(\\hat h_{\\mathcal S_n}) + \\sqrt{\\frac{\\log|\\mathcal H|+\\log(2/\\delta)}{2n}}';
	const vcBoundStatement =
		'\\mathbb{P}^n\\Big(\\forall h\\in\\mathcal H,\\ |R(h)-R_{\\mathcal S_n}(h)| \\le \\sqrt{\\frac{8d\\log(2en/d) + 8\\log(4/\\delta)}{n}}\\Big) \\ge 1-\\delta';
	const svmVCDimBound =
		'\\|X_i\\|_2 \\le R \\text{ p.s.} \\implies \\mathrm{VCdim}(\\mathcal H_\\gamma) \\le \\left\\lfloor \\frac{R^2}{\\gamma^2} \\right\\rfloor';
	const bftBound =
		'R(h) - R_{\\mathcal S_n}(h) = \\tilde{O}\\left( \\frac{\\left(\\prod_{l=1}^L \\|W_l\\|_{\\mathrm{op}}\\right) \\cdot \\left(\\sum_{l=1}^L \\|W_l\\|_F^{2/3}\\right)^{3/2}}{\\sqrt{n}} \\right)';
	const rademacherBound =
		'\\sup_{h\\in\\mathcal H} |R(h) - R_{\\mathcal S_n}(h)| \\le 2\\,\\widehat{\\mathfrak R}_n(\\mathcal H) + \\sqrt{\\frac{\\log(2/\\delta)}{2n}}';
	const vcDimNetwork = '\\mathrm{VCdim}(\\mathcal H) = O\\big(W\\, L \\log W\\big)';
</script>

<svelte:head>
	<title>{meta?.title ?? 'Exercices'} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Exercices — Généralisation'}
	subtitle="38 exercices sur les quatre leçons de la partie : concentration, classes finies, dimension VC et double descente"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="concentration-empirique">Concentration et risque empirique</h2>

		<p>
			Cette section propose huit exercices sur les inégalités de Markov et de Bienaymé-Tchebychev, la
			concentration de la moyenne empirique, et la limite du contrôle pour un classifieur fixé (Leçon 1).
			Chaque exercice est accompagné d'une solution détaillée, accessible en cliquant sur « Voir la
			solution ».
		</p>

		<ExercisePanel number="1.1" title="Appliquer Markov à une loi exponentielle">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Par Markov, avec <KatexInline formula={String.raw`\mathbb{E}[Z] = 1/2`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Z \ge 3) \le \frac{\mathbb{E}[Z]}{3} = \frac{1/2}{3} = \frac16 \approx 0.17.`}
				/>
				<p>
					<strong>(b)</strong> La valeur exacte vaut <KatexInline
						formula={String.raw`\mathbb{P}(Z\ge 3) = e^{-2\times 3} = e^{-6} \approx 2.48\times 10^{-3}`}
					/>. Markov surestime donc la probabilité d'un facteur d'environ <KatexInline
						formula={String.raw`e^6/6 \approx 67`}
					/>. L'inégalité n'utilise que l'espérance : elle est aveugle à la décroissance rapide de la
					queue de la loi exponentielle, et c'est ce qui explique l'écart.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Z`} /> suivant une loi exponentielle de paramètre <KatexInline
					formula={String.raw`2`}
				/> (densité <KatexInline formula={String.raw`2e^{-2x}\mathbb{1}_{x\ge 0}`} />, espérance
				<KatexInline formula={String.raw`1/2`} />).
			</p>
			<p>
				<strong>(a)</strong> Utilisez l'inégalité de Markov pour borner <KatexInline
					formula={String.raw`\mathbb{P}(Z\ge 3)`} />.
			</p>
			<p>
				<strong>(b)</strong> Comparez avec la valeur exacte de <KatexInline
					formula={String.raw`\mathbb{P}(Z\ge 3)`} />. Que remarquez-vous ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.2" title="Markov est parfois exact">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> On a <KatexInline formula={String.raw`\mathbb{E}[Z] = p\,a`} /> et
					<KatexInline formula={String.raw`\mathbb{P}(Z\ge a) = p`} />.
				</p>
				<p>
					<strong>(b)</strong> En appliquant Markov avec le seuil <KatexInline
						formula={String.raw`t = a`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Z \ge a) \le \frac{\mathbb{E}[Z]}{a} = \frac{pa}{a} = p = \mathbb{P}(Z\ge a).`}
				/>
				<p>
					La borne est atteinte à l'égalité. La constante de Markov ne peut donc pas être améliorée
					: il existe des variables pour lesquelles l'inégalité est une égalité. Remarquons la
					distinction avec l'Exercice 1.1 : Markov est <em>optimal en général</em> (on ne peut pas
					faire mieux sans hypothèse supplémentaire), mais peut être très <em>loin d'être
					optimale pour une variable donnée</em>.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Z`} /> qui prend la valeur <KatexInline
					formula={String.raw`a>0`}
				/> avec probabilité <KatexInline formula={String.raw`p\in(0,1)`} />, et la valeur <KatexInline
					formula={String.raw`0`} /> sinon.
			</p>
			<p>
				<strong>(a)</strong> Calculez <KatexInline formula={String.raw`\mathbb{E}[Z]`} /> et
				<KatexInline formula={String.raw`\mathbb{P}(Z\ge a)`} />.
			</p>
			<p>
				<strong>(b)</strong> Montrez que l'inégalité de Markov appliquée au seuil <KatexInline
					formula={String.raw`t=a`}
				/>
				est une égalité. Qu'apporte cela sur l'optimalité de la constante de Markov ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.3" title="Retrouver Tchebychev à partir de Markov">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`W = (Z-\mathbb{E}[Z])^2 \ge 0`} />. En appliquant Markov
					à <KatexInline formula={String.raw`W`} /> avec le seuil <KatexInline
						formula={String.raw`\varepsilon^2`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}\big((Z-\mathbb{E}[Z])^2 \ge \varepsilon^2\big) \le \frac{\mathbb{E}[(Z-\mathbb{E}[Z])^2]}{\varepsilon^2} = \frac{\mathrm{Var}(Z)}{\varepsilon^2}.`}
				/>
				<p>
					Or les deux événements coïncident : <KatexInline
						formula={String.raw`\{(Z-\mathbb{E}[Z])^2 \ge \varepsilon^2\} = \{|Z-\mathbb{E}[Z]| \ge \varepsilon\}`}
					/>. On obtient donc bien <KatexInline
						formula={String.raw`\mathbb{P}(|Z-\mathbb{E}[Z]| \ge \varepsilon) \le \mathrm{Var}(Z)/\varepsilon^2`}
					/>. L'astuce est de choisir la <em>bonne</em> variable positive : le carré de l'écart à la
					moyenne, et non la variable elle-même.
				</p>
			{/snippet}
			<p>
				Retrouvez la démonstration de l'inégalité de Bienaymé-Tchebychev en appliquant Markov à la
				variable positive <KatexInline formula={String.raw`(Z-\mathbb{E}[Z])^2`} /> avec le seuil
				<KatexInline formula={String.raw`\varepsilon^2`} />. Écrivez chaque étape.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.4" title="Tchebychev en chiffres">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> On a <KatexInline formula={String.raw`\mathrm{Var}(Z)/\varepsilon^2 = 4/9 \approx 0.44`}
					/>.
				</p>
				<p>
					<strong>(b)</strong> La même formule donne <KatexInline
						formula={String.raw`4/1 = 4`}
					/> : la « borne » dépasse 1, donc elle est triviale (toute probabilité est
					<KatexInline formula={String.raw`\le 1`} />).
				</p>
				<p>
					<strong>(c)</strong> Tchebychev n'est informative que lorsque <KatexInline
						formula={String.raw`\varepsilon > \sqrt{\mathrm{Var}(Z)}`}
					/> — ici <KatexInline formula={String.raw`\varepsilon > 2`} />. En dessous de
					<KatexInline formula={String.raw`\varepsilon = 1`} />, on demande une probabilité sur un
					écart <em>inférieur</em> à l'échelle typique de dispersion (une déviation standard) : la
					borne ne peut plus être inférieure à 1.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Z`} /> avec <KatexInline
					formula={String.raw`\mathbb{E}[Z]=10`}
				/> et <KatexInline formula={String.raw`\mathrm{Var}(Z)=4`} />.
			</p>
			<p>
				<strong>(a)</strong> Borner <KatexInline formula={String.raw`\mathbb{P}(|Z-10|\ge 3)`} /> par
				Bienaymé-Tchebychev.
			</p>
			<p>
				<strong>(b)</strong> Faire de même avec <KatexInline formula={String.raw`\varepsilon = 1`} />.
				La borne est-elle informative ?
			</p>
			<p>
				<strong>(c)</strong> Pour quels <KatexInline formula={String.raw`\varepsilon`} /> la borne de
				Tchebychev peut-elle être informative ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.5" title="Variance de la moyenne empirique">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Par linéarité de l'espérance :
					<KatexInline formula={String.raw`\mathbb{E}[\bar Z_n] = \frac1n\sum_i \mathbb{E}[Z_i] = \frac1n\cdot n\,\mu = \mu`}
					/>. Pour la variance, les termes croisés s'annulent par indépendance :
				</p>
				<KatexBlock
					formula={String.raw`\mathrm{Var}(\bar Z_n) = \frac{1}{n^2}\sum_{i=1}^n \mathrm{Var}(Z_i) = \frac{n\,\sigma^2}{n^2} = \frac{\sigma^2}{n}.`}
				/>
				<p>
					<strong>(b)</strong> L'écart-type de <KatexInline formula={String.raw`\bar Z_{100}`} /> vaut
					<KatexInline formula={String.raw`\sqrt{0.25/100} = 0.5/10 = 0.05`} /> : la moyenne d'une
					centaine d'observations a un écart-type <em>dix fois plus petit</em> que celui d'une
					seule — c'est le gain en <KatexInline formula={String.raw`1/\sqrt n`} /> de la
					moyennisation.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Z_1,\dots,Z_n`} /> i.i.d. de moyenne <KatexInline
					formula={String.raw`\mu`}
				/> et de variance <KatexInline formula={String.raw`\sigma^2<+\infty`} />, et posons
				<KatexInline formula={String.raw`\bar Z_n = \frac1n\sum_{i=1}^n Z_i`} />.
			</p>
			<p>
				<strong>(a)</strong> Montrez que <KatexInline formula={String.raw`\mathbb{E}[\bar Z_n]=\mu`} />
				et <KatexInline formula={String.raw`\mathrm{Var}(\bar Z_n)=\sigma^2/n`} />.
			</p>
			<p>
				<strong>(b)</strong> Avec <KatexInline formula={String.raw`\sigma = 0.5`} /> et
				<KatexInline formula={String.raw`n = 100`} />, calculez l'écart-type de
				<KatexInline formula={String.raw`\bar Z_n`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.6" title="Hoeffding contre Tchebychev">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Une variable de Bernoulli de paramètre <KatexInline
						formula={String.raw`1/2`}
					/> a une variance <KatexInline formula={String.raw`1/4`} />, donc
					<KatexInline formula={String.raw`\mathrm{Var}(\bar Z_n) = \frac{1/4}{500} = \frac{1}{2000}`}
					/>. Par Bienaymé-Tchebychev :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}\big(|\bar Z_n - \tfrac12| \ge 0.1\big) \le \frac{1/2000}{0.01} = 0.05.`}
				/>
				<p>
					<strong>(b)</strong> Les <KatexInline formula={String.raw`Z_i`} /> sont dans
					<KatexInline formula={String.raw`[0,1]`} />, donc Hoeffding s'applique directement :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}\big(|\bar Z_n - \tfrac12| \ge 0.1\big) \le 2e^{-2\times 500 \times 0.1^2} = 2e^{-10} \approx 9.08\times 10^{-5}.`}
				/>
				<p>
					<strong>(c)</strong> Hoeffding est plus de 550 fois plus petite que Tchebychev. La
					décroissance en <KatexInline formula={String.raw`e^{-2n\varepsilon^2}`} /> (exponentielle en
					<KatexInline formula={String.raw`n`} />) finit toujours par dominer la décroissance en
					<KatexInline formula={String.raw`1/n`} /> : c'est le prix payé pour l'hypothèse
					supplémentaire de bornage des observations — ici trivialement vérifiée puisque
					<KatexInline formula={String.raw`Z_i\in\{0,1\}`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Z_1,\dots,Z_{500}`} /> i.i.d. de loi de Bernoulli de
				paramètre <KatexInline formula={String.raw`1/2`} />.
			</p>
			<p>
				<strong>(a)</strong> Borner <KatexInline
					formula={String.raw`\mathbb{P}(|\bar Z_n - 1/2| \ge 0.1)`} /> par Bienaymé-Tchebychev.
			</p>
			<p>
				<strong>(b)</strong> Refaire la même estimation par l'inégalité de Hoeffding.
			</p>
			<p>
				<strong>(c)</strong> Comparer les deux bornes. Quelle est la leçon sur le rôle du bornage des
				observations ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.7" title="La borne du classifieur fixé">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Les <KatexInline formula={String.raw`Z_i`} /> sont de Bernoulli de
					paramètre <KatexInline formula={String.raw`1-R(h) = 0.7`} />, donc
					<KatexInline formula={String.raw`\mathrm{Var}(Z_i) = R(h)(1-R(h)) = 0.3\times 0.7 = 0.21`}
					/>.
				</p>
				<p>
					<strong>(b)</strong> Avec <KatexInline formula={String.raw`n\varepsilon^2 = 400\times 0.01 = 4`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`\frac{0.21}{4} = 0.0525 \quad\text{(borne exacte)}, \qquad \frac{1}{4\times 4} = \frac{1}{16} = 0.0625 \quad\text{(borne grossière)}.`}
				/>
				<p>
					Les deux bornes sont inférieures à 1, donc informatives : avec 400 exemples, le risque
					empirique de ce classifieur fixé est à moins de <KatexInline
						formula={String.raw`0.1`}
					/> de son risque théorique avec une probabilité d'au moins <KatexInline
						formula={String.raw`1-0.0525 \approx 0.95`}
					/>.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`h`} /> un classifieur fixé avec
				<KatexInline formula={String.raw`R(h) = 0.3`} />, et <KatexInline
					formula={String.raw`\mathcal S_n`}
				/> un échantillon de taille <KatexInline formula={String.raw`n = 400`} />.
			</p>
			<p>
				<strong>(a)</strong> Calculez exactement <KatexInline
					formula={String.raw`\mathrm{Var}(Z_i)`} /> avec
				<KatexInline formula={String.raw`Z_i = \mathbb{1}_{h(X_i)\neq Y_i}`} />.
			</p>
			<p>
				<strong>(b)</strong> Avec <KatexInline formula={String.raw`\varepsilon = 0.1`} />, calculez la
				borne <KatexInline formula={String.raw`\mathrm{Var}(Z_i)/(n\varepsilon^2)`} /> et la borne
				grossière <KatexInline formula={String.raw`1/(4n\varepsilon^2)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.8" title="Pourquoi cette borne ne suffit pas pour l'ERM">
			{#snippet solution()}
				<p>
					La borne de l'Exercice 1.7 est valable pour un <KatexInline formula={String.raw`h`} />
					<strong>fixé avant</strong> de voir les données : elle contrôle la probabilité, sur
					l'échantillon <KatexInline formula={String.raw`\mathcal S_n`} />, que l'écart
					<KatexInline formula={String.raw`|R_{\mathcal S_n}(h)-R(h)|`} /> dépasse
					<KatexInline formula={String.raw`\varepsilon`} /> pour ce <KatexInline
						formula={String.raw`h`}
					/> donné. Or <KatexInline formula={String.raw`\hat h_{\mathcal S_n}`} /> n'est pas fixé
					à l'avance : c'est une <em>fonction de</em> <KatexInline
						formula={String.raw`\mathcal S_n`}
					/>, choisie précisément en minimisant <KatexInline
						formula={String.raw`R_{\mathcal S_n}(h)`}
					/> — donc en suivant les fluctuations de l'échantillon que la borne est censée contrôler.
					Refaire la borne « après coup » pour le <KatexInline formula={String.raw`h`} /> choisi
					n'est plus légitime : le choix et l'événement contrôlé ne sont plus indépendants. Il
					faut une garantie <strong>uniforme</strong>, valable simultanément pour tous les
					<KatexInline formula={String.raw`h\in\mathcal H`} /> — c'est exactement l'objet de
					l'union bound de la section suivante.
				</p>
			{/snippet}
			<p>
				La borne de l'Exercice 1.7 est établie pour un classifieur <KatexInline
					formula={String.raw`h`}
				/> fixé à l'avance, indépendamment des données. Expliquez en deux ou trois phrases pourquoi on
				ne peut pas l'appliquer directement à <KatexInline formula={ermDef} />, le classifieur appris
				sur le même échantillon <KatexInline formula={String.raw`\mathcal S_n`} />.
			</p>
		</ExercisePanel>

		<h2 id="classe-finie">Généralisation pour une classe finie</h2>

		<p>
			Cette section propose neuf exercices sur la généralisation pour une classe <KatexInline
				formula={String.raw`\mathcal H`}
			/> finie : échantillons trompeurs, union bound, et les bornes des Théorèmes 3.1 (cas séparable) et
			3.2 (cas non séparable) de la Leçon 2.
		</p>

		<ExercisePanel number="2.1" title="L'échantillon trompeur">
			{#snippet solution()}
				<p>
					Supposons <KatexInline formula={String.raw`R(\hat h_{\mathcal S_n}) > \varepsilon`} />. Par
					réalisabilité, il existe <KatexInline formula={String.raw`h^*\in\mathcal H`} /> avec
					<KatexInline formula={String.raw`R(h^*)=0`} />, donc <KatexInline
						formula={String.raw`R_{\mathcal S_n}(h^*)=0`}
					/> sur tout échantillon. Comme <KatexInline formula={String.raw`\hat h_{\mathcal S_n}`} />
					minimise le risque empirique sur <KatexInline formula={String.raw`\mathcal H`} />, on a
					<KatexInline
						formula={String.raw`R_{\mathcal S_n}(\hat h_{\mathcal S_n}) \le R_{\mathcal S_n}(h^*) = 0`}
					/>
					donc <KatexInline formula={String.raw`R_{\mathcal S_n}(\hat h_{\mathcal S_n}) = 0`} />. Or
					<KatexInline formula={String.raw`R(\hat h_{\mathcal S_n})>\varepsilon`} />, donc
					<KatexInline formula={String.raw`\hat h_{\mathcal S_n}\in\mathcal H_{\text{bad}}`} />, et il
					fait zéro erreur sur <KatexInline formula={String.raw`\mathcal S_n`} /> : par définition,
					<KatexInline formula={String.raw`\mathcal S_n\in\mathcal M`} />. L'inclusion est établie.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\mathcal H`} /> fini, réalisable (il existe
				<KatexInline formula={String.raw`h^*\in\mathcal H`} /> avec <KatexInline
					formula={String.raw`R(h^*)=0`}
				/>) et <KatexInline formula={ermDef} />. On pose <KatexInline formula={hBadDef} /> et
				<KatexInline formula={mDef} />. Montrez l'inclusion
				<KatexInline
					formula={String.raw`\{R(\hat h_{\mathcal S_n}) > \varepsilon\} \subset \mathcal M`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.2" title="Un échantillon trompeur est rare">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Les <KatexInline formula={String.raw`n`} /> essais sont i.i.d., et
					<KatexInline formula={String.raw`R_{\mathcal S_n}(h)=0`} /> signifie qu'aucun essai n'a
					échoué. Chaque essai réussit avec probabilité <KatexInline
						formula={String.raw`1-R(h)`}
					/>, donc par indépendance :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}^n\big(R_{\mathcal S_n}(h)=0\big) = (1-R(h))^n.`}
				/>
				<p>
					<strong>(b)</strong> On a <KatexInline formula={String.raw`0.8^{20} \approx 0.0115`} />,
					tandis que <KatexInline formula={String.raw`e^{-2} \approx 0.135`} />. Comme
					<KatexInline formula={String.raw`R(h) = 0.2 > \varepsilon = 0.1`} />, on a bien
					<KatexInline
						formula={String.raw`(1-R(h))^n < (1-\varepsilon)^n \le e^{-n\varepsilon}`}
					/>
					: la borne exponentielle est correcte, mais beaucoup moins serrée ici — l'écart vient du
					passage <KatexInline formula={String.raw`(1-R(h))^n \le (1-\varepsilon)^n`} />, grossier
					lorsque <KatexInline formula={String.raw`R(h)`} /> est bien plus grand que
					<KatexInline formula={String.raw`\varepsilon`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`h\in\mathcal H_{\text{bad}}`} />, c'est-à-dire
				<KatexInline formula={String.raw`R(h)>\varepsilon`} />.
			</p>
			<p>
				<strong>(a)</strong> Montrez que
				<KatexInline formula={String.raw`\mathbb{P}^n\big(R_{\mathcal S_n}(h)=0\big) = (1-R(h))^n`} />.
			</p>
			<p>
				<strong>(b)</strong> Avec <KatexInline formula={String.raw`R(h) = 0.2`} />,
				<KatexInline formula={String.raw`n = 20`} /> et <KatexInline
					formula={String.raw`\varepsilon = 0.1`}
				/>, comparez <KatexInline formula={String.raw`(1-R(h))^n`} /> et <KatexInline
					formula={String.raw`e^{-n\varepsilon}`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.3" title="La démonstration de l'union bound">
			{#snippet solution()}
				<p>
					Par définition de <KatexInline formula={String.raw`\mathcal M`} />, un échantillon
					<KatexInline formula={String.raw`\mathcal S_n`} /> est trompeur si et seulement s'il
					appartient à au moins un des événements <KatexInline
						formula={String.raw`A_h = \{R_{\mathcal S_n}(h)=0\}`}
					/> pour <KatexInline formula={String.raw`h\in\mathcal H_{\text{bad}}`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\mathcal M = \bigcup_{h\in\mathcal H_{\text{bad}}} A_h \implies \mathbb{P}^n(\mathcal M) \le \sum_{h\in\mathcal H_{\text{bad}}} \mathbb{P}^n(A_h).`}
				/>
				<p>
					La propriété utilisée est la <strong>subadditivité</strong> de la probabilité
					(inégalité de Boole), valable pour toute union finie d'événements, sans aucune hypothèse
					d'indépendance. Le caractère <strong>fini</strong> de <KatexInline
						formula={String.raw`\mathcal H_{\text{bad}}`}
					/> est ici essentiel : la somme a un nombre fini de termes, et le majorant
					<KatexInline formula={String.raw`\le |\mathcal H|`} /> (utilisé à la suite) n'a de sens
					que pour un cardinal fini.
				</p>
			{/snippet}
			<p>
				L'ensemble des échantillons trompeurs <KatexInline formula={mDef} /> s'écrit comme une union
				sur <KatexInline formula={String.raw`\mathcal H_{\text{bad}}`} /> d'événements
				<KatexInline formula={String.raw`A_h = \{R_{\mathcal S_n}(h)=0\}`} />.
			</p>
			<p>
				Écrivez <KatexInline
					formula={String.raw`\mathbb{P}^n(\mathcal M) \le \sum_{h\in\mathcal H_{\text{bad}}} \mathbb{P}^n(A_h)`}
				/>, et précisez quelle propriété de la mesure de probabilité est utilisée.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.4" title="Reconstituer la preuve du Théorème 3.1">
			{#snippet solution()}
				<p>
					L'ordre correct est <strong>C, A, B, D</strong> :
				</p>
				<ol>
					<li>
						<strong>C</strong> — réduction aux échantillons trompeurs :
						<KatexInline
							formula={String.raw`\{R(\hat h_{\mathcal S_n}) > \varepsilon\} \subset \mathcal M`}
						/>
						(Exercice 2.1).
					</li>
					<li>
						<strong>A</strong> — union bound sur
						<KatexInline formula={String.raw`\mathcal H_{\text{bad}}`} /> (Exercice 2.3).
					</li>
					<li>
						<strong>B</strong> — borne par hypothèse : pour
						<KatexInline formula={String.raw`h\in\mathcal H_{\text{bad}}`} />,
						<KatexInline
							formula={String.raw`R_{\mathcal S_n}(h)=0 \implies (1-R(h))^n < (1-\varepsilon)^n \le e^{-n\varepsilon}`}
						/>
						(Exercice 2.2).
					</li>
					<li>
						<strong>D</strong> — conclusion : la somme a au plus
						<KatexInline formula={String.raw`|\mathcal H_{\text{bad}}| \le |\mathcal H|`} /> termes,
						donc <KatexInline formula={separableStatement} />.
					</li>
				</ol>
				<p>
					Chaque étape n'utilise que la précédente : cette modularité est ce qui rend la preuve
					adaptable — c'est exactement l'étape B que l'on remplace par Hoeffding dans le cas non
					séparable (Théorème 3.2).
				</p>
			{/snippet}
			<p>
				Réordonnez les quatre étapes suivantes dans le bon ordre pour reconstituer la démonstration du
				Théorème 3.1, et indiquez ce que chacune établit :
			</p>
			<ol>
				<li>
					<strong>A</strong> : <KatexInline
						formula={String.raw`\mathbb{P}^n(\mathcal M) \le \sum_{h\in\mathcal H_{\text{bad}}} \mathbb{P}^n\big(R_{\mathcal S_n}(h)=0\big)`}
				/>
				</li>
				<li>
					<strong>B</strong> : pour <KatexInline formula={String.raw`h\in\mathcal H_{\text{bad}}`} />,
					<KatexInline
						formula={String.raw`\mathbb{P}^n\big(R_{\mathcal S_n}(h)=0\big) = (1-R(h))^n \le e^{-n\varepsilon}`}
					/>
				</li>
				<li>
					<strong>C</strong> : <KatexInline
						formula={String.raw`\{R(\hat h_{\mathcal S_n}) > \varepsilon\} \subset \mathcal M`}
				/>
				</li>
				<li>
					<strong>D</strong> : <KatexInline formula={String.raw`\mathbb{P}^n(R(\hat h_{\mathcal S_n})>\varepsilon) \le |\mathcal H|\,e^{-n\varepsilon}`}
				/>
				</li>
			</ol>
		</ExercisePanel>

		<ExercisePanel number="2.5" title="Taille d'échantillon séparable">
			{#snippet solution()}
				<p>
					Le Théorème 3.1 garantit <KatexInline
						formula={String.raw`\mathbb{P}^n(R(\hat h_{\mathcal S_n})>\varepsilon) \le \delta`}
					/> dès que <KatexInline formula={String.raw`n \ge \frac{\log(|\mathcal H|/\delta)}{\varepsilon}`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`n \ge \frac{\log(100/0.01)}{0.1} = \frac{\log(10^4)}{0.1} \approx \frac{9.21}{0.1} = 92.1.`}
				/>
				<p>
					Il suffit donc de <KatexInline formula={String.raw`n \ge 93`} /> exemples. Avec 93
					exemples, la probabilité que le risque de l'ERM dépasse <KatexInline
						formula={String.raw`0.1`}
					/> est au plus <KatexInline formula={String.raw`0.01`} /> — et cela sans aucune hypothèse
					sur la distribution, seulement la réalisabilité.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`|\mathcal H| = 100`} />. Pour une confiance
				<KatexInline formula={String.raw`1-\delta`} /> avec <KatexInline
					formula={String.raw`\delta = 0.01`}
				/> et une garantie de risque <KatexInline formula={String.raw`\varepsilon = 0.1`} />, calculez
				la taille d'échantillon <KatexInline formula={String.raw`n`} /> garantie par le Théorème 3.1.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.6" title="Le corollaire en chiffres">
			{#snippet solution()}
				<p>
					Avec probabilité au moins <KatexInline formula={String.raw`0.99`} /> :
				</p>
				<KatexBlock
					formula={String.raw`R(\hat h_{\mathcal S_n}) \le \frac{\log(100/0.01)}{100} \approx \frac{9.21}{100} \approx 0.092.`}
				/>
				<p>
					La borne garantie (≈ 0.092) est inférieure à l'<KatexInline
						formula={String.raw`\varepsilon = 0.1`}
					/> de l'Exercice 2.5 — ce qui est cohérent, puisque <KatexInline
						formula={String.raw`n = 100 > 93`}
					/>. Le corollaire reformule la même garantie sous la forme d'une borne sur le risque
					plutôt que sur la probabilité de la dépasser.
				</p>
			{/snippet}
			<p>
				Avec les données de l'Exercice 2.5 (<KatexInline
					formula={String.raw`|\mathcal H| = 100`}
				/>, <KatexInline formula={String.raw`\delta = 0.01`} />) et un échantillon de taille
				<KatexInline formula={String.raw`n = 100`} />, que donne le corollaire
				<KatexInline formula={separableCorollary} /> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.7" title="Quand Hoeffding est triviale">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> On obtient <KatexInline
						formula={String.raw`2e^{-2\times 25\times 0.01} = 2e^{-0.5} \approx 1.21`}
					/> : la « borne » dépasse 1, donc elle est triviale — une probabilité est toujours
					<KatexInline formula={String.raw`\le 1`} />, la majoration ne porte aucune information.
				</p>
				<p>
					<strong>(b)</strong> La borne est informative dès que
					<KatexInline formula={String.raw`2e^{-2nt^2} < 1`} />, c'est-à-dire
					<KatexInline
						formula={String.raw`e^{-2nt^2} < \tfrac12 \iff 2nt^2 > \log 2 \iff t > \sqrt{\frac{\log 2}{2n}}`}
					/>. Avec <KatexInline formula={String.raw`n = 25`} /> :
				</p>
				<KatexBlock
					formula={String.raw`t > \sqrt{\frac{\log 2}{50}} \approx 0.118.`}
				/>
				<p>
					Avec seulement 25 exemples, Hoeffding ne devient informative que pour des écarts
					supérieurs à ≈ 0.118 : pour un petit <KatexInline formula={String.raw`n`} />, la borne
					exponentielle ne « paie » que sur les grandes déviations.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`|\mathcal H| = 1`} />, donc <KatexInline
					formula={String.raw`\mathcal H = \{h\}`}
				/> un classifieur fixé. On dispose de l'inégalité de Hoeffding
				<KatexInline
					formula={String.raw`\mathbb{P}\big(|R_{\mathcal S_n}(h)-R(h)| \ge t\big) \le 2e^{-2nt^2}`}
				/>.
			</p>
			<p>
				<strong>(a)</strong> Avec <KatexInline formula={String.raw`n = 25`} /> et
				<KatexInline formula={String.raw`t = 0.1`} />, que donne la borne ? Est-elle informative ?
			</p>
			<p>
				<strong>(b)</strong> À partir de quelle valeur de <KatexInline formula={String.raw`t`} /> la
				borne devient-elle informative (inférieure à 1) ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.8" title="D'où vient la borne uniforme du Théorème 3.2">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> L'événement « il existe <KatexInline
						formula={String.raw`h`}
					/> dont l'écart dépasse <KatexInline formula={String.raw`t`}
					/>, c'est l'union sur <KatexInline formula={String.raw`\mathcal H`} /> des événements
					contrôlés par Hoeffding pour chaque <KatexInline formula={String.raw`h`} /> fixé. Par
					subadditivité :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}^n\big(\exists\, h\in\mathcal H,\ |R_{\mathcal S_n}(h)-R(h)| \ge t\big) \le \sum_{h\in\mathcal H} 2e^{-2nt^2} = 2|\mathcal H|\,e^{-2nt^2}.`}
				/>
				<p>
					<strong>(b)</strong> En posant <KatexInline
						formula={String.raw`2|\mathcal H|e^{-2nt^2} = \delta`}
					/> et en résolvant :
				</p>
				<KatexBlock
					formula={String.raw`e^{-2nt^2} = \frac{\delta}{2|\mathcal H|} \iff 2nt^2 = \log\frac{2|\mathcal H|}{\delta} = \log|\mathcal H| + \log(2/\delta) \iff t = \sqrt{\frac{\log|\mathcal H| + \log(2/\delta)}{2n}}.`}
				/>
				<p>
					<strong>(c)</strong> L'événement contrôlé en (a) porte sur <strong>tous</strong> les
					<KatexInline formula={String.raw`h\in\mathcal H`} /> simultanément : il est un événement
					au sens du tirage <KatexInline formula={String.raw`\mathcal S_n`} />, et non d'un
					<KatexInline formula={String.raw`h`} /> particulier. Il couvre donc le cas
					<KatexInline formula={String.raw`h = \hat h_{\mathcal S_n}`}
					/>, quelle que soit la valeur que prend <KatexInline
						formula={String.raw`\hat h_{\mathcal S_n}`}
					/>. C'est cette <em>uniformité en</em> <KatexInline
						formula={String.raw`h`}
					/> — et non l'indépendance de <KatexInline
						formula={String.raw`h`}
					/> des données — qui autorise à appliquer la borne au classifieur choisi après coup.
				</p>
			{/snippet}
			<p>
				<strong>(a)</strong> En appliquant l'union bound à la borne de Hoeffding pour <KatexInline
					formula={String.raw`h`}
				/> fixé, établissez
				<KatexInline
					formula={String.raw`\mathbb{P}^n\big(\exists\, h\in\mathcal H,\ |R_{\mathcal S_n}(h)-R(h)| \ge t\big) \le 2|\mathcal H|\,e^{-2nt^2}`}
				/>.
			</p>
			<p>
				<strong>(b)</strong> En posant <KatexInline
					formula={String.raw`2|\mathcal H|e^{-2nt^2} = \delta`}
				/>, montrez que la résolution pour <KatexInline formula={String.raw`t`} /> donne
				<KatexInline
					formula={String.raw`t = \sqrt{\frac{\log|\mathcal H| + \log(2/\delta)}{2n}}`}
				/>.
			</p>
			<p>
				<strong>(c)</strong> Pourquoi cette borne peut-elle ensuite s'appliquer à
				<KatexInline formula={String.raw`\hat h_{\mathcal S_n}`} />, bien que
				<KatexInline formula={String.raw`\hat h_{\mathcal S_n}`} /> dépende de
				<KatexInline formula={String.raw`\mathcal S_n`} /> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.9" title="1/n ou 1/√n ?">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Dans le cas séparable, le corollaire donne <KatexInline
						formula={String.raw`R(\hat h) \le \frac{\log(|\mathcal H|/\delta)}{n}`}
					/> : décroissance en <KatexInline formula={String.raw`1/n`} />. Dans le cas non
					séparable, la borne vaut <KatexInline formula={uniformRiskBound} /> : le terme
					additif décroît en <KatexInline formula={String.raw`1/\sqrt n`} />, donc la convergence
					est plus lente, d'un facteur <KatexInline formula={String.raw`\sqrt n`} />.
				</p>
				<p>
					<strong>(b)</strong> En régime séparable, l'argument est purement combinatoire : un
					échantillon trompeur est un événement <em>binaire</em> (une hypothèse mauvaise fait
					<em>zéro</em> erreur), dont la probabilité décroît <em>exponentiellement</em> en
					<KatexInline formula={String.raw`n`} />, <KatexInline
						formula={String.raw`(1-R(h))^n \le e^{-n\varepsilon}`}
					/> ; l'union bound, qui inverse cette exponentielle, donne
					<KatexInline formula={String.raw`\log|\mathcal H|/n`} />. En l'absence de
					réalisabilité, il n'y a plus d'événement binaire à compter : on doit passer par une
					concentration de type Hoeffding, qui décroît en <KatexInline
						formula={String.raw`e^{-2nt^2}`}
					/> en le <em>carré</em> de la déviation ; inverser cette exponentielle en
					<KatexInline formula={String.raw`n`} /> donne
					<KatexInline formula={String.raw`t \propto 1/\sqrt n`} />. Le prix de l'absence d'un
					<KatexInline formula={String.raw`h^*`} /> de risque nul est précisément la perte d'une
					racine carrée.
				</p>
			{/snippet}
			<p>
				<strong>(a)</strong> Dans le cas séparable, le corollaire donne
				<KatexInline formula={String.raw`R(\hat h) \le \frac{\log(|\mathcal H|/\delta)}{n`} /> ; dans
				le cas non séparable, la borne de risque est <KatexInline
					formula={uniformRiskBound}
				/>. Comparez les deux vitesses de convergence en fonction de <KatexInline
					formula={String.raw`n`}
				/>.
			</p>
			<p>
				<strong>(b)</strong> Expliquez pourquoi la réalisabilité est ce qui permet l'accélération en
					<KatexInline formula={String.raw`1/n`} />.
			</p>
		</ExercisePanel>

		<h2 id="dimension-vc">Dimension VC, Sauer-Shelah et SVM</h2>

		<p>
			Cette section propose douze exercices sur la brisure et la dimension VC, le coefficient de
			brisure et le lemme de Sauer-Shelah, la borne VC (Théorème 3.3), et l'application au SVM
			(Théorème 3.4) de la Leçon 3.
		</p>

		<ExercisePanel number="3.1" title="Un singleton est brisé">
			{#snippet solution()}
				<p>
					Un singleton <KatexInline formula={String.raw`\{x_0\}`} /> admet exactement deux
					étiquetages :
				</p>
				<ul>
					<li>
						l'étiquetage <KatexInline formula={String.raw`0`} /> : choisir <KatexInline
							formula={String.raw`\theta > x_0`}
						/>
						(ou <KatexInline formula={String.raw`\theta = x_0 + 1`} />, par exemple), alors
						<KatexInline formula={String.raw`\mathbb{1}_{x_0 \ge \theta} = 0`} /> ;
					</li>
					<li>
						l'étiquetage <KatexInline formula={String.raw`1`} /> : choisir <KatexInline
							formula={String.raw`\theta \le x_0`}
						/>
						(ou <KatexInline formula={String.raw`\theta = x_0`} />, par exemple), alors
						<KatexInline formula={String.raw`\mathbb{1}_{x_0 \ge \theta} = 1`} />.
					</li>
				</ul>
				<p>
					Les deux étiquetages sont réalisés : <KatexInline formula={String.raw`\mathcal H`} />
					brise tout singleton.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\mathcal H = \{x \mapsto \mathbb{1}_{x \ge \theta} : \theta \in \mathbb R\}`}
				/> la classe des seuils. Montrez que <KatexInline formula={String.raw`\mathcal H`} /> brise
				tout singleton <KatexInline formula={String.raw`\{x_0\} \subset \mathbb R`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.2" title="Une paire ne l'est pas : VCdim = 1">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Il y a <KatexInline formula={String.raw`2^2 = 4`} /> étiquetages de la
					paire ordonnée <KatexInline formula={String.raw`(x_1, x_2)`} /> : (0,0), (0,1), (1,0), (1,1).
					Le seul qui échappe est <KatexInline formula={String.raw`(1, 0)`} />. En effet, si
					<KatexInline formula={String.raw`\mathbb{1}_{x_1 \ge \theta} = 1`} /> alors
					<KatexInline formula={String.raw`x_1 \ge \theta`} /> ; comme <KatexInline
						formula={String.raw`x_1 < x_2`}
					/>, on en déduit <KatexInline formula={String.raw`x_2 > x_1 \ge \theta`} />, donc
					<KatexInline formula={String.raw`\mathbb{1}_{x_2 \ge \theta} = 1`} />, et non 0.
					L'étiquetage (1,0) est donc impossible : au plus 3 dichotomies sont réalisées sur toute
					paire.
				</p>
				<p>
					<strong>(b)</strong> Les singletons sont brisés (Exercice 3.1) et aucune paire ne l'est :
					<KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H) = 1`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\mathcal H = \{x \mapsto \mathbb{1}_{x \ge \theta} : \theta \in \mathbb R\}`}
				/> la classe des seuils.
			</p>
			<p>
				<strong>(a)</strong> Montrez qu'aucune paire ordonnée <KatexInline
					formula={String.raw`\{x_1, x_2\}`} />, <KatexInline formula={String.raw`x_1 < x_2`} />,
				n'est brisée : donnez l'étiquetage impossible.
			</p>
			<p>
				<strong>(b)</strong> Déduisez-en <KatexInline
					formula={String.raw`\mathrm{VCdim}(\mathcal H)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.3" title="Deux points, quatre étiquetages">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`x_1 < x_2`} />. Pour chacun des quatre étiquetages :
				</p>
				<ul>
					<li>
						<KatexInline formula={String.raw`(0, 0)`} /> : l'intervalle <KatexInline
							formula={String.raw`[x_2+1,\, x_2+2]`}
						/> ne contient ni <KatexInline formula={String.raw`x_1`} /> ni
						<KatexInline formula={String.raw`x_2`} /> ;
					</li>
					<li>
						<KatexInline formula={String.raw`(1, 0)`} /> : l'intervalle dégénéré
						<KatexInline formula={String.raw`[x_1,\, x_1] = \{x_1\}`} /> contient
						<KatexInline formula={String.raw`x_1`} /> mais pas <KatexInline
							formula={String.raw`x_2`}
						/> ;
					</li>
					<li>
						<KatexInline formula={String.raw`(0, 1)`} /> : l'intervalle dégénéré
						<KatexInline formula={String.raw`[x_2,\, x_2] = \{x_2\}`} /> contient
						<KatexInline formula={String.raw`x_2`} /> mais pas <KatexInline
							formula={String.raw`x_1`}
						/> ;
					</li>
					<li>
						<KatexInline formula={String.raw`(1, 1)`} /> : l'intervalle
						<KatexInline formula={String.raw`[x_1,\, x_2]`} /> contient les deux points.
					</li>
				</ul>
				<p>
					Les <KatexInline formula={String.raw`2^2 = 4`} /> étiquetages sont tous réalisés : toute
					paire est brisée par la classe des intervalles.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline
					formula={String.raw`\mathcal H = \{x \mapsto \mathbb{1}_{x \in [a,b]} : a \le b\}`}
				/>
				la classe des intervalles. Montrez que <KatexInline formula={String.raw`\mathcal H`} /> brise
				toute paire <KatexInline formula={String.raw`\{x_1, x_2\}`} />, <KatexInline
					formula={String.raw`x_1 < x_2`}
				/> : donnez un intervalle <KatexInline formula={String.raw`[a,b]`} /> pour chacun des quatre
				étiquetages.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.4" title="Un triplet ne l'est pas : VCdim = 2">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Il y a <KatexInline formula={String.raw`2^3 = 8`} /> étiquetages du
					triplet ordonné. Celui qui échappe est <KatexInline
						formula={String.raw`(1, 0, 1)`}
					/> : si <KatexInline formula={String.raw`x_1`} /> et <KatexInline
						formula={String.raw`x_3`}
					/> appartiennent à un intervalle <KatexInline formula={String.raw`[a,b]`} />, alors
					<KatexInline formula={String.raw`a \le x_1`} /> et <KatexInline
						formula={String.raw`x_3 \le b`}
					/> ; comme <KatexInline formula={String.raw`x_1 < x_2 < x_3`} />, on en déduit
					<KatexInline formula={String.raw`a \le x_1 < x_2 < x_3 \le b`} />, donc
					<KatexInline formula={String.raw`x_2 \in [a,b]`} /> — contradiction avec l'étiquette 0 en
					<KatexInline formula={String.raw`x_2`} />.
				</p>
				<p>
					<strong>(b)</strong> Les paires sont brisées (Exercice 3.3) et aucun triplet ne l'est :
					<KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H) = 2`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline
					formula={String.raw`\mathcal H = \{x \mapsto \mathbb{1}_{x \in [a,b]} : a \le b\}`}
				/>
				la classe des intervalles.
			</p>
			<p>
				<strong>(a)</strong> Montrez qu'aucun triplet ordonné <KatexInline
					formula={String.raw`\{x_1 < x_2 < x_3\}`}
				/> n'est brisé : donnez l'étiquetage impossible.
			</p>
			<p>
				<strong>(b)</strong> Déduisez-en <KatexInline
					formula={String.raw`\mathrm{VCdim}(\mathcal H)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.5" title="Les demi-plans de R²">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Soient <KatexInline formula={String.raw`A, B, C`} /> trois points
					n'alignés. Pour chaque étiquetage, il faut séparer les points étiquetés 1 des points
					étiquetés 0 par une droite. Le cas trivial (tout 0 ou tout 1) se résout par une droite
					lointaine. Dans le cas mélangé, un seul point est d'un côté et deux de l'autre : le
					contraire étant symétrique, prenons un point <KatexInline
						formula={String.raw`P`}
					/> à séparer de <KatexInline formula={String.raw`Q, R`} />. Les ensembles
					<KatexInline formula={String.raw`\{P\}`} /> et
					<KatexInline formula={String.raw`[Q, R]`} /> sont deux convexes compacts disjoints —
					<KatexInline formula={String.raw`P`} /> n'est pas sur la droite
					<KatexInline formula={String.raw`(QR)`} /> puisque les points ne sont pas alignés — donc
					il existe une droite de séparation stricte, qui réalise l'étiquetage demandé. Les huit
					étiquetages sont réalisables : <KatexInline formula={String.raw`\mathcal H`} /> brise tout
					triplet non aligné.
				</p>
				<p>
					<strong>(b)</strong> Soient <KatexInline
						formula={String.raw`v_1, v_2, v_3, v_4`}
					/> les sommets du carré, dans l'ordre. Les diagonales ont le même milieu, donc
					<KatexInline formula={String.raw`v_1 + v_3 = v_2 + v_4`} />. Considérons l'étiquetage
					<KatexInline formula={String.raw`(1, 0, 1, 0)`} />. S'il était réalisé par un demi-plan
					fermé <KatexInline formula={String.raw`\{x : w^\top x \ge b\}`} />, on aurait
					<KatexInline formula={String.raw`w^\top v_1 \ge b`} /> et <KatexInline
						formula={String.raw`w^\top v_3 \ge b`}
					/>, donc <KatexInline formula={String.raw`w^\top(v_1 + v_3) \ge 2b`} />, c'est-à-dire
					<KatexInline formula={String.raw`w^\top(v_2 + v_4) \ge 2b`} />. Mais ni
					<KatexInline formula={String.raw`v_2`} /> ni <KatexInline
						formula={String.raw`v_4`}
					/> n'est dans le demi-plan, donc <KatexInline
						formula={String.raw`w^\top v_2 < b`}
					/> et <KatexInline formula={String.raw`w^\top v_4 < b`} />, soit
					<KatexInline formula={String.raw`w^\top(v_2 + v_4) < 2b`} /> : contradiction.
					L'étiquetage (1,0,1,0) n'est pas réalisable : le carré n'est pas brisé.
				</p>
				<p>
					Triplets brisés, quadruplets jamais brisés : <KatexInline
						formula={String.raw`\mathrm{VCdim}(\mathcal H) = 3`}
					/> dans <KatexInline formula={String.raw`\mathbb R^2`} />. Plus généralement, les
					hyperplans de <KatexInline formula={String.raw`\mathbb R^d`} /> ont
					<KatexInline formula={String.raw`\mathrm{VCdim} = d+1`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline
					formula={String.raw`\mathcal H = \{x \mapsto \mathbb{1}_{w^\top x \ge b} : w \in \mathbb R^2,\ b \in \mathbb R\}`}
				/>
				la classe des demi-plans fermés de <KatexInline formula={String.raw`\mathbb R^2`} />.
			</p>
			<p>
				<strong>(a)</strong> Montrez que <KatexInline formula={String.raw`\mathcal H`} /> brise tout
				triplet de points non alignés.
			</p>
			<p>
				<strong>(b)</strong> Montrez que <KatexInline formula={String.raw`\mathcal H`} /> ne brise pas
				les quatre sommets d'un carré : donnez l'étiquetage impossible et justifiez-le à l'aide d'une
				relation entre les sommets.
			</p>
			<p>Concluez : <KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H) = 3`} />.</p>
		</ExercisePanel>

		<ExercisePanel number="3.6" title="Le coefficient de brisure des seuils">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`C = \{x_1 < \dots < x_m\}`} /> un ensemble de
					<KatexInline formula={String.raw`m`} /> points distincts. Un seuil <KatexInline
						formula={String.raw`\theta`}
					/> classe en 1 un <em>suffixe</em> de la suite ordonnée : il existe un entier
					<KatexInline formula={String.raw`k \in \{0, \dots, m\}`} /> tel que
					<KatexInline
						formula={String.raw`(h(x_1), \dots, h(x_m)) = (0, \dots, 0, 1, \dots, 1)`}
					/>
					avec <KatexInline formula={String.raw`m-k`} /> uns (on place <KatexInline
						formula={String.raw`\theta`}
					/> entre <KatexInline formula={String.raw`x_k`} /> et
					<KatexInline formula={String.raw`x_{k+1}`} />, ou en dehors de
					<KatexInline formula={String.raw`[x_1, x_m]`} /> pour les cas extrêmes). Il y a exactement
					<KatexInline formula={String.raw`m+1`} /> tels suffixes, et aucun autre étiquetage n'est
					réalizable :
				</p>
				<KatexBlock
					formula={String.raw`\Pi_{\mathcal H}(m) = m+1.`}
				/>
				<p>
					Remarquons que c'est exactement la borne de Sauer-Shelah avec
					<KatexInline formula={String.raw`d = 1`} /> :
					<KatexInline
						formula={String.raw`\binom{m}{0} + \binom{m}{1} = 1 + m`}
					/>
					— elle est atteinte à l'égalité.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\mathcal H = \{x \mapsto \mathbb{1}_{x \ge \theta} : \theta \in \mathbb R\}`}
				/> la classe des seuils. Montrez que son coefficient de brisure vaut
				<KatexInline formula={String.raw`\Pi_{\mathcal H}(m) = m+1`} /> pour tout
				<KatexInline formula={String.raw`m \ge 1`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.7" title="Le coefficient de brisure des intervalles">
			{#snippet solution()}
				<p>
					Comme pour les seuils, fixons <KatexInline
						formula={String.raw`C = \{x_1 < \dots < x_m\}`}
					/>. L'intersection d'un intervalle <KatexInline
						formula={String.raw`[a,b]`}
					/> avec <KatexInline formula={String.raw`C`} /> est un bloc de points
					<strong>consecutifs</strong> (éventuellement vide), caractérisé par ses bornes :
				</p>
				<ul>
					<li>
						bloc vide (étiquetage tout 0) : <KatexInline formula={String.raw`1`} /> ;
					</li>
					<li>
						bloc d'un seul point : <KatexInline formula={String.raw`m`} /> choix ;
					</li>
					<li>
						bloc de deux points ou plus : caractérisé par ses deux bornes, donc
						<KatexInline formula={String.raw`\frac{m(m-1)}{2}`} /> paires.
					</li>
				</ul>
				<p>Le total est :</p>
				<KatexBlock
					formula={String.raw`\Pi_{\mathcal H}(m) = 1 + m + \frac{m(m-1)}{2}.`}
				/>
				<p>
					Or la somme de Sauer-Shelah avec <KatexInline formula={String.raw`d = 2`} /> vaut
					<KatexInline
						formula={String.raw`\sum_{i=0}^{2} \binom{m}{i} = 1 + m + \frac{m(m-1)}{2}`}
					/>
					: les deux expressions sont identiques. Pour la classe des intervalles, la borne de
					Sauer-Shelah est donc <strong>atteinte à l'égalité</strong> :
					<KatexInline formula={String.raw`\Pi_{\mathcal H}(m) = \sum_{i=0}^{2} \binom{m}{i}`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline
					formula={String.raw`\mathcal H = \{x \mapsto \mathbb{1}_{x \in [a,b]} : a \le b\}`}
				/>
				la classe des intervalles.
			</p>
			<p>
				<strong>(a)</strong> Montrez que sur <KatexInline formula={String.raw`m`} /> points ordonnés,
				les étiquetages réalisables sont exactement les blocs de points consécutifs, et en déduisez
				<KatexInline
					formula={String.raw`\Pi_{\mathcal H}(m) = 1 + m + \frac{m(m-1)}{2}`}
				/>.
			</p>
			<p>
				<strong>(b)</strong> Vérifiez que cette expression est égale à
				<KatexInline formula={String.raw`\sum_{i=0}^{2} \binom{m}{i`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.8" title="Sauer-Shelah en chiffres">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> On a
					<KatexInline
						formula={String.raw`\binom{10}{0} + \binom{10}{1} + \binom{10}{2} = 1 + 10 + 45 = 56`}
					/>, tandis que <KatexInline formula={String.raw`2^{10} = 1024`} /> : le nombre de
					dichotomies réalisables est au plus 56, soit environ 18 fois moins que le nombre total
					d'étiquetages.
				</p>
				<p>
					<strong>(b)</strong> Avec <KatexInline formula={String.raw`d = 3`} /> :
					<KatexInline
						formula={String.raw`1 + 10 + 45 + \binom{10}{3} = 1 + 10 + 45 + 120 = 176`}
					/>, encore très loin de <KatexInline formula={String.raw`1024`} />.
				</p>
				<p>
					La borne polynomiale en <KatexInline formula={String.raw`m`} /> (de degré
					<KatexInline formula={String.raw`d`} />) remplace la croissance exponentielle : dès que
					<KatexInline formula={String.raw`m \gg d`} />, le rapport
					<KatexInline formula={String.raw`2^m / \sum_{i \le d} \binom{m}{i}`} /> croît
					exponentiellement, et la perte d'information est considérable.
				</p>
			{/snippet}
			<p>
				Le lemme de Sauer-Shelah affirme que si <KatexInline
					formula={String.raw`\mathrm{VCdim}(\mathcal H) = d < +\infty`}
				/>, alors <KatexInline
					formula={String.raw`\Pi_{\mathcal H}(m) \le \sum_{i=0}^{d} \binom{m}{i}`}
				/> pour tout <KatexInline formula={String.raw`m`} />.
			</p>
			<p>
				<strong>(a)</strong> Avec <KatexInline formula={String.raw`d = 2`} /> et
				<KatexInline formula={String.raw`m = 10`} />, calculez la borne et comparez-la à
				<KatexInline formula={String.raw`2^{10}`} />.
			</p>
			<p>
				<strong>(b)</strong> Faites de même avec <KatexInline formula={String.raw`d = 3`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.9" title="Le basculement exponentiel vers polynomial">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> On compare les logarithmes. On a
					<KatexInline
						formula={String.raw`\log\left(\frac{em}{10}\right)^{10} = 10\,(1 + \log m - \log 10)`}
					/>
					et <KatexInline formula={String.raw`\log 2^m = m\log 2`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\begin{array}{c|c|c} m & \log\left(\frac{em}{10}\right)^{10} & \log 2^m \\ \hline 20 & 10(1 + 2.996 - 2.303) \approx 16.93 & 20 \times 0.693 \approx 13.86 \\ 30 & 10(1 + 3.401 - 2.303) \approx 20.99 & 30 \times 0.693 \approx 20.79 \\ 40 & 10(1 + 3.689 - 2.303) \approx 23.86 & 40 \times 0.693 \approx 27.73 \end{array}`}
				/>
				<p>
					<strong>(b)</strong> L'enveloppe polynomiale <KatexInline
						formula={String.raw`(em/10)^{10}`}
					/> reste supérieure à <KatexInline formula={String.raw`2^m`} /> jusqu'à
					<KatexInline formula={String.raw`m \approx 31`} /> (le basculement est entre
					<KatexInline formula={String.raw`m = 30`} /> et <KatexInline
						formula={String.raw`m = 40`}
					/>, c'est-à-dire autour de <KatexInline formula={String.raw`m \approx 3d`} />), puis
					<KatexInline formula={String.raw`2^m`} /> la dépasse et ne cesse de l'éloigner.
					Interprétation : pour <KatexInline formula={String.raw`m`} />, inférieur à quelques fois
					<KatexInline formula={String.raw`d`} />, la borne de Sauer-Shelah peut être supérieure à
					<KatexInline formula={String.raw`2^m`} />, donc triviale ; au-delà, le nombre de
					dichotomies réalisables est <em>polynomial</em> en <KatexInline
						formula={String.raw`m`}
					/> de degré <KatexInline formula={String.raw`d`} />, alors que le nombre total
					<KatexInline formula={String.raw`2^m`} /> est exponentiel — c'est précisément ce
					basculement qui rend une borne de généralisation possible pour une classe infinie.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`d = 10`} />. On dispose de la double majoration
				<KatexInline
					formula={String.raw`\Pi_{\mathcal H}(m) \le \min\left(2^m,\ \left(\frac{em}{d}\right)^d\right)`}
				/>.
			</p>
			<p>
				<strong>(a)</strong> Calculez <KatexInline
					formula={String.raw`\log\left(\frac{em}{10}\right)^{10}`}
				/>
				et <KatexInline formula={String.raw`\log 2^m`} /> pour <KatexInline
					formula={String.raw`m = 20`}
				/>, <KatexInline formula={String.raw`30`} /> et <KatexInline
					formula={String.raw`40`}
				/>.
			</p>
			<p>
				<strong>(b)</strong> À partir de quelle valeur de <KatexInline formula={String.raw`m`} />
				l'exponentielle <KatexInline formula={String.raw`2^m`} /> domine-t-elle clairement
				l'enveloppe <KatexInline formula={String.raw`(em/10)^{10}`} /> ? Qu'apporte cela sur le
				sens de <KatexInline formula={String.raw`\mathrm{VCdim} = 10`} /> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.10" title="La borne VC en chiffres">
			{#snippet solution()}
				<p>
					Le terme de complexité vaut :
				</p>
				<KatexBlock
					formula={String.raw`8d\log(2en/d) + 8\log(4/\delta) = 16\log(2e \times 100 / 2) + 8\log(80) = 16\log(271.8) + 8\log(80) \approx 16 \times 5.605 + 8 \times 4.382 \approx 89.7 + 35.1 \approx 124.8.`}
				/>
				<p>
					<strong>(a)</strong> Avec <KatexInline formula={String.raw`n = 100`} /> :
					<KatexInline
						formula={String.raw`\sqrt{124.8/100} \approx \sqrt{1.25} \approx 1.12`}
					/>. La borne dépasse 1, donc elle est <strong>triviale</strong> — une borne sur un
					écart de risques (tous deux dans <KatexInline formula={String.raw`[0,1]`} />) supérieure
					à 1 ne porte aucune information.
				</p>
				<p>
					<strong>(b)</strong> Avec <KatexInline formula={String.raw`n = 1000`} /> :
					<KatexInline
						formula={String.raw`\sqrt{124.8/1000} \approx \sqrt{0.125} \approx 0.35`}
					/>. La borne devient informative : avec une confiance de 95 %, le risque théorique est à
					moins de ≈ 0.35 du risque empirique, <em>uniformément</em> sur toute la classe
					<KatexInline formula={String.raw`\mathcal H`} />, y compris pour le classifieur appris.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\mathcal H`} /> de dimension VC <KatexInline
					formula={String.raw`d = 2`}
				/>, et <KatexInline formula={String.raw`\mathcal S_n`} /> un échantillon de taille
				<KatexInline formula={String.raw`n`} />. Le Théorème 3.3 affirme que pour tout
				<KatexInline formula={String.raw`\delta \in (0,1)`} />, avec probabilité au moins
				<KatexInline formula={String.raw`1-\delta`} /> :
				<KatexInline formula={vcBoundStatement} />.
			</p>
			<p>
				<strong>(a)</strong> Avec <KatexInline formula={String.raw`n = 100`} /> et
				<KatexInline formula={String.raw`\delta = 0.05`} />, calculez la borne. Est-elle informative ?
			</p>
			<p>
				<strong>(b)</strong> Faites de même avec <KatexInline formula={String.raw`n = 1000`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.11" title="La VCdim du SVM">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Avec <KatexInline formula={String.raw`R = 1`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\gamma = 0.5 : \quad \left\lfloor \frac{1}{0.25} \right\rfloor = 4, \qquad \gamma = 0.1 : \quad \left\lfloor \frac{1}{0.01} \right\rfloor = 100.`}
				/>
				<p>
					<strong>(b)</strong> La borne croît comme <KatexInline
						formula={String.raw`R^2/\gamma^2`}
					/> : si les données s'éloignent de l'origine (<KatexInline
						formula={String.raw`R`}
					/> plus grand) ou si la marge obtenue est petite (<KatexInline
						formula={String.raw`\gamma`}
					/> plus petit), la complexité effective de la classe augmente. Maximiser la marge, c'est
					précisément minimiser ce rapport — et donc la complexité qui entre dans la borne de
					généralisation.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\|X_i\|_2 \le R = 1`} /> presque sûrement, et
				<KatexInline formula={String.raw`\mathcal H_\gamma`} /> la classe des hyperplans de marge
				<KatexInline formula={String.raw`\gamma`} /> (avec <KatexInline
					formula={String.raw`\|w\|_2 = 1`}
				/>). Le Théorème 3.4 affirme
				<KatexInline formula={svmVCDimBound} />.
			</p>
			<p>
				<strong>(a)</strong> Calculez cette borne pour <KatexInline
					formula={String.raw`\gamma = 0.5`}
				/> et <KatexInline formula={String.raw`\gamma = 0.1`} />.
			</p>
			<p>
				<strong>(b)</strong> Que se passe-t-il lorsque <KatexInline formula={String.raw`R`} />
				augmente ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.12" title="L'effet de la marge">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> On a
					<KatexInline
						formula={String.raw`\frac{R^2}{(2\gamma)^2} = \frac{R^2}{4\gamma^2} = \frac14 \cdot \frac{R^2}{\gamma^2}`}
					/>
					: la borne est divisée par 4. Doubler la marge divise la complexité effective par 4 — la
					marge est l'unique « levier » de complexité dans cette borne.
				</p>
				<p>
					<strong>(b)</strong> Pour les hyperplans ordinaires, <KatexInline
						formula={String.raw`\mathrm{VCdim} = d+1`}
					/>, donc la borne VC est inutilisable dès que <KatexInline
						formula={String.raw`d`}
					/> est grand (ou que les caractéristiques vivent dans un espace de Hilbert de
					dimension infinie, via le kernel trick). En revanche, <KatexInline
						formula={String.raw`\lfloor R^2/\gamma^2 \rfloor`}
					/> ne dépend que de la géométrie de la solution apprise : un problème bien séparé en
					1000 dimensions peut avoir une complexité effective bien plus petite que
					<KatexInline formula={String.raw`d+1 = 1001`}
					/>. C'est pourquoi le SVM peut généraliser correctement même lorsque le nombre de
					caractéristiques dépasse largement la taille de l'échantillon.
				</p>
			{/snippet}
			<p>
				Rappel : <KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H_\gamma) \le \lfloor R^2/\gamma^2 \rfloor`}
				/>.
			</p>
			<p>
				<strong>(a)</strong> Si la marge double, <KatexInline
					formula={String.raw`\gamma \to 2\gamma`}
				/>, comment varie la borne <KatexInline
					formula={String.raw`\lfloor R^2/\gamma^2 \rfloor`}
				/> ?
			</p>
			<p>
				<strong>(b)</strong> La borne <KatexInline
					formula={String.raw`\lfloor R^2/\gamma^2 \rfloor`}
				/> ne fait pas intervenir la dimension ambiante <KatexInline
					formula={String.raw`d`}
				/>. Expliquez en une phrase pourquoi c'est un atout du SVM comparé à la borne
				<KatexInline formula={String.raw`\mathrm{VCdim} = d+1`} /> des hyperplans.
			</p>
		</ExercisePanel>

		<h2 id="limites-vc-double-descente">Limites de VC et double descente</h2>

		<p>
			Cette section propose neuf exercices sur les limites de la théorie VC pour les réseaux de
			neurones : la borne de Bartlett, le paradoxe de la double descente, la régularisation implicite
			de SGD, les bornes par normes des poids, et la complexité de Rademacher (Leçon 4).
		</p>

		<ExercisePanel number="4.1" title="Bartlett en chiffres">
			{#snippet solution()}
				<p>
					On a <KatexInline formula={String.raw`\log W = \log(10^8) = 8\log 10 \approx 18.42`} />,
					donc :
				</p>
				<KatexBlock
					formula={String.raw`W\,L\log W = 10^8 \times 10 \times 18.42 \approx 1.84 \times 10^{10}.`}
				/>
				<p>
					La dimension VC du réseau est de l'ordre de <KatexInline
						formula={String.raw`10^{10}`}
					/> : des dizaines de milliards. C'est le même ordre de grandeur que le nombre de
					paramètres lui-même, multiplié par un facteur logarithmique.
				</p>
			{/snippet}
			<p>
				Bartlett (1998) montre que pour un réseau à fonctions d'activation seuil, à
				<KatexInline formula={String.raw`L`} /> couches et <KatexInline
					formula={String.raw`W`}
				/> paramètres : <KatexInline formula={vcDimNetwork} />.
			</p>
			<p>
				Avec <KatexInline formula={String.raw`W = 10^8`} /> paramètres et
				<KatexInline formula={String.raw`L = 10`} /> couches, donnez un ordre de grandeur de la
				dimension VC du réseau.
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.2" title="Une borne triviale">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Pour que <KatexInline
						formula={String.raw`\sqrt{\mathrm{VCdim}/n} < 1`}
					/>, il faut <KatexInline formula={String.raw`n \gg \mathrm{VCdim}`} /> : pour le réseau
					de l'Exercice 4.1, il faudrait <KatexInline
						formula={String.raw`n \gtrsim 10^{10}\text{ à }10^{11}`}
					/> exemples.
				</p>
				<p>
					<strong>(b)</strong> Les jeux de données typiques comptent <KatexInline
						formula={String.raw`10^6 \text{ à } 10^7`}
					/> exemples, soit 1000 à 10000 fois moins. La borne VC vaut donc
					<KatexInline formula={String.raw`\ge 1`} />, c'est-à-dire qu'elle est triviale, sur tout
					jeu de données réaliste : elle ne peut pas expliquer la bonne généralisation observée en
					pratique. La théorie VC « ne peut rien dire » précisément là où la pratique fonctionne
					mieux qu'elle ne le prédit.
				</p>
			{/snippet}
			<p>
				La borne VC donne une erreur de généralisation de l'ordre de
				<KatexInline formula={String.raw`\sqrt{\mathrm{VCdim}/n}`} /> (à facteurs logarithmiques
				près).
			</p>
			<p>
				<strong>(a)</strong> Pour le réseau de l'Exercice 4.1 (<KatexInline
					formula={String.raw`\mathrm{VCdim} \approx 1.8\times 10^{10}`}
				/>), quelle taille d'échantillon <KatexInline formula={String.raw`n`} /> faut-il pour que la
				borne soit inférieure à 1, donc informative ?
			</p>
			<p>
				<strong>(b)</strong> Comparez avec la taille des jeux de données d'entraînement typiques
				(<KatexInline formula={String.raw`10^6 \text{ à } 10^7`} />). Que concluez-vous ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.3" title="Lire la courbe de double descente">
			{#snippet solution()}
				<p>
					Dans la démo de la Leçon 4 (régression linéaire par pseudo-inverse, taille
					d'échantillon <KatexInline formula={String.raw`n`} /> fixée par le curseur,
					dimension <KatexInline formula={String.raw`d`} /> variant autour du seuil
					<KatexInline formula={String.raw`d = n`} />) :
				</p>
				<ul>
					<li>
						<KatexInline formula={String.raw`d < n`} /> (régime sous-paramétré) : le système est
						sur-déterminé, la pseudo-inverse calcule la solution aux moindres carrés ; l'erreur de
						test suit le compromis biais-variance classique (biais décroissant, variance
						croissante avec d).
					</li>
					<li>
						<KatexInline formula={String.raw`d = n`} /> (seuil d'interpolation) : le système est
						exactement déterminé, la matrice de conception est mal conditionnée et l'erreur de
						test <strong>explose</strong>.
					</li>
				<li>
					<KatexInline formula={String.raw`d > n`} /> (régime sur-paramétré) : le système est
					sous-déterminé, la pseudo-inverse choisit la solution de norme minimale parmi une
					infinité de solutions — le risque empirique est nul (interpolation) ; l'erreur de
					test, explosée au seuil, redescend avec d vers un niveau bas, légèrement supérieur
					au bruit irréductible <KatexInline formula={String.raw`\sigma^2 = 1`} /> : la solution
					de norme minimale ne capture que la composante du signal dans le sous-espace de rang
					<KatexInline formula={String.raw`n`} /> engendré par les observations (biais résiduel
					<KatexInline formula={String.raw`(1 - n/d)\,\|\beta\|`} />).
				</li>
				</ul>
				<p>
					Le risque empirique est nul (interpolation) pour <KatexInline
						formula={String.raw`d \ge n`} /> ; c'est l'erreur de <em>test</em> qui explose
					précisément au seuil, et le minimum global de l'erreur de test est atteint
					<em>après</em> le seuil, dans le régime sur-paramétré — d'où la « double descente ».
				</p>
			{/snippet}
			<p>
				Dans la démonstration interactive de la Leçon 4 (régression linéaire par pseudo-inverse,
				taille d'échantillon <KatexInline formula={String.raw`n`} /> fixée par le curseur,
				dimension <KatexInline formula={String.raw`d`} /> variant autour du seuil
				<KatexInline formula={String.raw`d = n`} />), décrivez qualitativement ce qui arrive à
				l'erreur de test dans les trois régimes <KatexInline
					formula={String.raw`d < n`}
				/>, <KatexInline formula={String.raw`d = n`} /> et <KatexInline
					formula={String.raw`d > n`}
				/> . Dans quel(s) régime(s) le modèle interpole-t-il les données (risque empirique nul) ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.4" title="Pourquoi l'explosion au seuil ?">
			{#snippet solution()}
				<p>
					À <KatexInline formula={String.raw`n = d`} />, la matrice de conception <KatexInline
						formula={String.raw`X`}
					/> est carrée et (en général) inversible : la solution <KatexInline
						formula={String.raw`\hat\beta = X^{-1}y`}
					/> interpole exactement les données, donc le risque empirique est bien nul. Mais
					<KatexInline formula={String.raw`X`} /> est proche de la singularité : elle est
					<strong>mal conditionnée</strong>, et son inverse amplifie énormément le bruit présent
					dans <KatexInline formula={String.raw`y`} />. La solution obtenue a une norme gigantesque
					: elle passe exactement par tous les points bruités, mais oscille fortement entre eux.
					Le risque empirique nul est donc, au seuil, le <em>pire</em> indicateur possible de la
					qualité de généralisation — c'est le point exact où l'interpolation capte le bruit
					plutôt que le signal.
				</p>
			{/snippet}
			<p>
				Dans la démo de l'Exercice 4.3, expliquez en deux ou trois phrases pourquoi l'erreur de test
				explose précisément au seuil <KatexInline formula={String.raw`n = d`} />, alors même que le
				risque empirique y est nul.
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.5" title="Bornes par normes contre VC">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> La borne de Bartlett-Foster-Telgarsky dépend des <strong>normes
					des poids</strong> — la norme spectrale <KatexInline
						formula={String.raw`\|\cdot\|_{\mathrm{op}}`}
					/> (produit sur les couches) et la norme de Frobenius <KatexInline
						formula={String.raw`\|\cdot\|_F`}
					/> (somme sur les couches) — et non du <em>nombre de paramètres</em>
					<KatexInline formula={String.raw`W`} />, qui contrôle la borne VC.
				</p>
				<p>
					<strong>(b)</strong> Un réseau très large (<KatexInline
						formula={String.raw`W \approx 10^8`}
					/> paramètres, donc <KatexInline
						formula={String.raw`\mathrm{VCdim} \approx 10^{10}`}
					/> et borne VC triviale pour tout <KatexInline formula={String.raw`n`} /> réaliste) mais
					dont les poids sont petits — par exemple <KatexInline
						formula={String.raw`\|W_l\|_{\mathrm{op}} \le 1`}
					/> et <KatexInline formula={String.raw`\|W_l\|_F`} /> bornés, comme le produisent
					l'initialisation soignée ou la régularisation — peut avoir une borne BFT bien
					inférieure à 1, donc informative, alors même que la borne VC dépasse 1. Les deux bornes
					ne mesurent pas la même chose : la capacité de la classe (VC) contre la
					<strong>régularité de la solution sélectionnée</strong> (BFT).
				</p>
			{/snippet}
			<p>
				Bartlett, Foster, Telgarsky (2017) montrent que pour un réseau à <KatexInline
					formula={String.raw`L`}
				/> couches de matrices de poids <KatexInline
					formula={String.raw`W_1, \dots, W_L`}
				/>, avec probabilité au moins <KatexInline
					formula={String.raw`1-\delta`}
				/> : <KatexInline formula={bftBound} />.
			</p>
			<p>
				<strong>(a)</strong> Sur quoi cette borne dépend-elle, à la différence de la borne VC ?
			</p>
			<p>
				<strong>(b)</strong> Décrivez un scénario où la borne BFT est informative alors que la borne
				VC est triviale.
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.6" title="La complexité de Rademacher">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> La complexité de Rademacher empirique est
					<strong>data-dependent</strong> : elle est calculée sur l'échantillon
					<KatexInline formula={String.raw`\mathcal S_n`} /> (les <KatexInline
						formula={String.raw`X_i`}
					/> fixés, en moyennant sur les bruits <KatexInline
						formula={String.raw`\sigma_i`}
					/>). La dimension VC, en revanche, est une propriété intrinsèque de la classe
					<KatexInline formula={String.raw`\mathcal H`} />, indépendante de toute donnée
					particulière.
				</p>
				<p>
					<strong>(b)</strong> Une classe « difficile » au sens VC peut se comporter simplement
					sur un échantillon particulier — par exemple des données bien séparées, pour lesquelles
					beaucoup de dichotomies de la classe ne sont pas cohérentes avec les observations.
					<KatexInline formula={String.raw`\widehat{\mathfrak R}_n(\mathcal H)`} /> mesure alors
					la capacité effective de la classe à s'adapter au bruit <em>sur cet échantillon</em>,
					qui peut être très inférieure à la dimension VC, qui est un pire cas sur tous les
					échantillons possibles. La borne s'adapte aux données : elle peut être informative dans
					des situations où la borne VC est triviale.
				</p>
			{/snippet}
			<p>
				La complexité de Rademacher empirique est
				<KatexInline
					formula={String.raw`\widehat{\mathfrak R}_n(\mathcal H) = \mathbb E_{\sigma}\left[\sup_{h\in\mathcal H} \frac{1}{n}\sum_{i=1}^n \sigma_i\, h(X_i)\right]`}
				/>
				où les <KatexInline formula={String.raw`\sigma_i`} /> sont des variables de Rademacher, et
				la borne de Rademacher s'écrit <KatexInline formula={rademacherBound} />.
			</p>
			<p>
				<strong>(a)</strong> Quelle est la différence essentielle entre
				<KatexInline formula={String.raw`\widehat{\mathfrak R}_n(\mathcal H)`} /> et
				<KatexInline formula={String.raw`\mathrm{VCdim}(\mathcal H)`} /> ?
			</p>
			<p>
				<strong>(b)</strong> Expliquez pourquoi cette différence rend la borne de Rademacher
				potentiellement plus informative pour un échantillon donné.
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.7" title="Le biais implicite de SGD">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Les réseaux profonds entraînés par SGD atteignent en pratique un
					risque empirique nul (interpolation) : dans cette situation, la solution
					<KatexInline formula={String.raw`h`} /> qui interpole les données n'est pas unique — il
					y en a une infinité, de régularité très différente. Le biais implicite montre que
					l'optimisation ne sélectionne pas une solution arbitraire : elle converge systématiquement
					vers la solution <strong>la plus régulière</strong> de la famille des solutions
					interpolantes — ici, celle de marge maximale, qui est exactement la solution du SVM. Or
					c'est précisément la régularité de la solution (la marge, les normes) qui contrôle la
					généralisation : la marge via le Théorème 3.4, les normes via la borne par normes de la
					Leçon 4 (Bartlett, Foster, Telgarsky, 2017). Le biais implicite explique donc une
					part de la bonne généralisation des réseaux qui « sur-apprennent » leurs données.
				</p>
				<p>
					<strong>(b)</strong> La question change de sujet : on ne se demande plus « la classe est-elle
					trop riche ? » (question de capacité, à laquelle la théorie VC répond de façon triviale
					pour les réseaux), mais « quelle solution l'algorithme d'optimisation sélectionne-t-il
					parmi toutes celles qui s'ajustent aux données, et combien cette solution est-elle
					régulière ? ». La généralisation devient une question sur le <em>couple</em>
					algorithme-données, et non plus sur la classe seule.
				</p>
			{/snippet}
			<p>
				Il est montré (Zhang et al., 2017 ; Soudry et al., 2018) que pour la régression logistique
				sur des données linéairement séparables, la descente de gradient converge vers le
				classifieur de <strong>marge maximale</strong> — la solution du SVM — même sans
				régularisation explicite.
			</p>
			<p>
				<strong>(a)</strong> Pourquoi ce résultat est-il intéressant pour comprendre la
				généralisation des réseaux profonds ?
			</p>
			<p>
				<strong>(b)</strong> En une phrase : vers quelle nouvelle question déplace-t-il l'analyse de
				la généralisation ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="4.8" title="Vrai ou faux">
			<p>Indiquez si chaque affirmation est vraie ou fausse, en justifiant brièvement.</p>
			<ol>
				<li>
					La dimension VC de la classe des hyperplans de <KatexInline
						formula={String.raw`\mathbb R^d`}
					/> vaut <KatexInline formula={String.raw`d`} />.
				</li>
				<li>
					Le lemme de Sauer-Shelah ne donne une borne non triviale que lorsque
					<KatexInline formula={String.raw`m \le d`} />.
				</li>
				<li>
					La borne <KatexInline
						formula={String.raw`\mathrm{VCdim}(\mathcal H_\gamma) \le \lfloor R^2/\gamma^2 \rfloor`}
					/>
					dépend de la dimension ambiante <KatexInline formula={String.raw`d`} />.
				</li>
				<li>Dans la double descente, l'erreur de test explose au seuil d'interpolation.</li>
				<li>
					La complexité de Rademacher <KatexInline
						formula={String.raw`\widehat{\mathfrak R}_n(\mathcal H)`} /> est indépendante de
					l'échantillon <KatexInline formula={String.raw`\mathcal S_n`} />.
				</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<strong>Faux.</strong> Les hyperplans de <KatexInline
							formula={String.raw`\mathbb R^d`}
						/> brisent <KatexInline formula={String.raw`d+1`} /> points en position générale
						(Exercice 3.5) et n'en brisent jamais <KatexInline
							formula={String.raw`d+2`}
						/> : <KatexInline formula={String.raw`\mathrm{VCdim} = d+1`} />.
					</li>
					<li>
						<strong>Faux.</strong> Le lemme est valable pour <strong>tout</strong>
						<KatexInline formula={String.raw`m`} />. Pour <KatexInline
							formula={String.raw`m \le d`} />, la somme
						<KatexInline
							formula={String.raw`\sum_{i=0}^{d} \binom{m}{i} = 2^m`}
						/>
						reproduit le nombre total d'étiquetages : la borne y est triviale (elle
						redonne <KatexInline formula={String.raw`\Pi_{\mathcal H}(m) \le 2^m`} />). Elle
						devient <em>non</em> triviale pour <KatexInline formula={String.raw`m > d`} />,
						lorsque la somme est strictement plus petite que
						<KatexInline formula={String.raw`2^m`} /> (Exercice 3.9).
					</li>
					<li>
						<strong>Faux.</strong> La borne ne dépend que de <KatexInline
							formula={String.raw`R`}
						/> et <KatexInline formula={String.raw`\gamma`} />, jamais de
						<KatexInline formula={String.raw`d`} /> — c'est précisément sa force (Exercices
						3.11 et 3.12).
					</li>
					<li>
						<strong>Vrai.</strong> Au seuil, la matrice de conception est mal conditionnée et la
						solution interpolante a une norme gigantesque (Exercice 4.4).
					</li>
					<li>
						<strong>Faux.</strong> <KatexInline
							formula={String.raw`\widehat{\mathfrak R}_n(\mathcal H)`}
						/> est data-dependent : elle est calculée sur
						<KatexInline formula={String.raw`\mathcal S_n`}
						/> (Exercice 4.6). C'est exactement ce qui la distingue de la dimension VC.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="4.9" title="Synthèse">
			{#snippet solution()}
				<p>
					La borne VC compte la capacité de la classe : pour un réseau à <KatexInline
						formula={String.raw`W`}
					/> paramètres, cette capacité est de l'ordre de <KatexInline
						formula={String.raw`WL\log W`}
					/> (Bartlett), soit <KatexInline formula={String.raw`10^{10}`} /> ou plus pour les
					architectures modernes ; la borne <KatexInline
						formula={String.raw`\sqrt{\mathrm{VCdim}/n}`}
					/> dépasse donc 1 pour tout <KatexInline formula={String.raw`n`} /> réaliste — la
					théorie répond « aucune information » là où la pratique généralise bien. La racine du
					problème est que la classe est immense mais que l'algorithme ne l'explore pas : la
					régularisation implicite de SGD sélectionne des solutions régulières (marge maximale,
					petites normes), dont la complexité est mesurée par les normes des poids (borne
					Bartlett-Foster-Telgarsky) ou par la capacité d'ajustement au bruit sur l'échantillon
					(complexité de Rademacher data-dependent), et non par le nombre de paramètres. Parmi ces
					trois outils, la borne par normes traite le plus directement la racine du problème :
					c'est elle qui remplace le <em>comptage</em> des paramètres — source de la trivialité —
					par une mesure de la régularité <em>effective</em> de la solution apprise.
				</p>
			{/snippet}
			<p>
				En trois ou quatre phrases : expliquez pourquoi la borne VC — le résultat central de la
				théorie statistique de l'apprentissage — devient inutile pour les réseaux de neurones
				modernes, et lequel des outils modernes (biais implicite de SGD, bornes par normes, complexité
				de Rademacher) traite le plus directement la racine du problème.
			</p>
		</ExercisePanel>
	</TheorySection>
</PageTemplate>
