<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';

	const meta = getPageByPath('/part5/exercices');
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	// ── Table of Contents ──

	const tocEntries: TocEntry[] = [
		{
			id: 'consistance-decomposition',
			label: 'Consistance et décomposition approximation/estimation',
			description: '10 exercices — les trois notions, leurs relations, le compromis biais-variance',
			color: 'belief'
		},
		{
			id: 'consistance-universelle-knn',
			label: 'Consistance universelle et k-NN',
			description: '10 exercices — théorème de Stone, choix de k(n)',
			color: 'surprise'
		}
	];

	// ── Formula variables reused across several exercises ──

	const stoneConditions =
		'k(n) \\xrightarrow[n\\to+\\infty]{} +\\infty \\quad\\text{et}\\quad \\frac{k(n)}{n} \\xrightarrow[n\\to+\\infty]{} 0';
</script>

<svelte:head>
	<title>{meta?.title ?? 'Exercices'} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Exercices — Consistance'}
	subtitle="Les trois notions de consistance, la décomposition approximation/estimation, et le théorème de Stone"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="consistance-decomposition">Consistance et décomposition approximation/estimation</h2>

		<p>
			Cette section propose dix exercices sur les trois notions de consistance de la Définition 1.2,
			leurs relations, et la décomposition du risque en termes d'approximation et d'estimation.
			Chaque exercice est accompagné d'une solution détaillée, accessible en cliquant sur « Voir la
			solution ».
		</p>

		<ExercisePanel number="1.1" title="Vérifier la consistance en probabilité">
			{#snippet solution()}
				<p>
					Pour tout <KatexInline formula={String.raw`\varepsilon>0`} /> fixé, dès que <KatexInline
						formula={String.raw`n > 1/\varepsilon`}
					/>, on a <KatexInline formula={String.raw`1/n < \varepsilon`} />, donc
					<KatexInline formula={String.raw`\mathbb{P}(R(h_n)-R^*>\varepsilon) \le 1/n \to 0`} />
					quand <KatexInline formula={String.raw`n\to+\infty`} />. La suite est donc consistante en
					probabilité.
				</p>
			{/snippet}
			<p>
				Soit une suite <KatexInline formula={String.raw`(h_n)`} /> telle que
				<KatexInline formula={String.raw`\mathbb{P}(R(h_n)-R^*>\varepsilon) \le 1/n`} /> pour tout
				<KatexInline formula={String.raw`\varepsilon>0`} /> et tout <KatexInline
					formula={String.raw`n\ge1`}
				/>. Montrez que <KatexInline formula={String.raw`(h_n)`} /> est consistante en probabilité.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.2" title="De la moyenne quadratique à la probabilité">
			{#snippet solution()}
				<p>
					Par l'inégalité de Markov appliquée à la variable positive
					<KatexInline formula={String.raw`(R(h_n)-R^*)^2`} /> avec le seuil <KatexInline
						formula={String.raw`\varepsilon^2`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}\big(R(h_n)-R^* > \varepsilon\big) = \mathbb{P}\big((R(h_n)-R^*)^2 > \varepsilon^2\big) \le \frac{\mathbb{E}[(R(h_n)-R^*)^2]}{\varepsilon^2}.`}
				/>
				<p>
					Si <KatexInline formula={String.raw`(h_n)`} /> est consistante en moyenne quadratique, le numérateur
					tend vers <KatexInline formula={String.raw`0`} /> pour <KatexInline
						formula={String.raw`n\to+\infty`}
					/>, donc le majorant tend vers <KatexInline formula={String.raw`0`} /> pour tout <KatexInline
						formula={String.raw`\varepsilon`}
					/> fixé : <KatexInline formula={String.raw`(h_n)`} /> est donc aussi consistante en probabilité.
				</p>
			{/snippet}
			<p>
				En utilisant l'inégalité de Markov, déduisez la consistance en probabilité à partir de la
				consistance en moyenne quadratique.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.3" title="De la convergence presque sûre à la probabilité">
			{#snippet solution()}
				<p>
					Fixons <KatexInline formula={String.raw`\varepsilon>0`} /> et posons <KatexInline
						formula={String.raw`A_n = \{R(h_n)-R^*>\varepsilon\}`}
					/>. Si <KatexInline formula={String.raw`\mathbb{P}(\lim_n R(h_n)=R^*)=1`} /> — soit sur
					l'événement <KatexInline formula={String.raw`\Omega_0`} /> de probabilité 1 — alors, pour
					presque toute réalisation, la suite <KatexInline formula={String.raw`(R(h_n))_n`} /> converge
					vers <KatexInline formula={String.raw`R^*`} /> : chaque événement <KatexInline
						formula={String.raw`A_n`}
					/> ne se produit donc qu'un nombre fini de fois, presque sûrement.
				</p>
				<p>
					Posons <KatexInline formula={String.raw`C_m = \bigcup_{n\ge m} A_n`} /> : c'est une suite
					décroissante d'événements, et
				</p>
				<KatexBlock
					formula={String.raw`\bigcap_{m\ge 1} C_m = \limsup_{n\to+\infty} A_n \;\subset\; \Omega_0^c`}
				/>
				<p>
					Par continuité de la mesure (de haut en bas),
					<KatexInline
						formula={String.raw`\mathbb{P}(C_m) \downarrow \mathbb{P}\bigl(\limsup_{n\to+\infty} A_n\bigr) \le \mathbb{P}(\Omega_0^c) = 0`}
					/>
					, et comme <KatexInline formula={String.raw`A_n \subset C_n`} />, on en déduit
					<KatexInline formula={String.raw`\mathbb{P}(A_n) \le \mathbb{P}(C_n) \to 0`} /> — c'est la
					consistance en probabilité.
				</p>
			{/snippet}
			<p>
				En partant directement de la définition de la convergence presque sûre, esquissez pourquoi
				elle implique la consistance en probabilité.
			</p>
		</ExercisePanel>

		<ExercisePanel
			number="1.4"
			title="Probabilité et moyenne quadratique pour de vrais classifieurs"
		>
			{#snippet solution()}
				<p>
					Non — pour de vrais classifieurs, l'implication de l'Exercice 1.2 se renverse. En effet,
					les risques sont bornés : <KatexInline
						formula={String.raw`R(h_n)-R^* \in [0,1]`}
					/>. Fixons <KatexInline formula={String.raw`\varepsilon>0`} /> et découpons l'espérance du
					carré selon que <KatexInline formula={String.raw`R(h_n)-R^*`} /> dépasse
					<KatexInline formula={String.raw`\varepsilon`} /> ou non :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{E}[(R(h_n)-R^*)^2] \;=\; \mathbb{E}\bigl[(R(h_n)-R^*)^2 \mathbb{1}_{\{R(h_n)-R^*\le\varepsilon\}}\bigr] \;+\; \mathbb{E}\bigl[(R(h_n)-R^*)^2 \mathbb{1}_{\{R(h_n)-R^*>\varepsilon\}}\bigr] \;\le\; \varepsilon^2 + \mathbb{P}(R(h_n)-R^*>\varepsilon).`}
				/>
				<p>
					Par consistance en probabilité, le second terme tend vers 0, donc
					<KatexInline formula={String.raw`\limsup_n \mathbb{E}[(R(h_n)-R^*)^2] \le \varepsilon^2`} />
					pour tout <KatexInline formula={String.raw`\varepsilon>0`} /> ; en laissant
					<KatexInline formula={String.raw`\varepsilon\downarrow 0`} />, on obtient
					<KatexInline formula={String.raw`\mathbb{E}[(R(h_n)-R^*)^2]\to 0`} /> : la consistance en
					moyenne quadratique suit. Pour des risques bornés, les deux notions sont donc
					<strong>équivalentes</strong>.
				</p>
				<p>
					La hiérarchie stricte (consistance en probabilité sans consistance en moyenne quadratique)
					n'apparaît que pour des variables <strong>non bornées</strong> : par exemple, si
					<KatexInline formula={String.raw`X_n = n\,\mathbb{1}_{A_n}`} /> avec
					<KatexInline formula={String.raw`\mathbb{P}(A_n)=1/n^2`} />, alors
					<KatexInline formula={String.raw`\mathbb{P}(|X_n|>\varepsilon) \le 1/n^2 \to 0`} />
					(convergence en probabilité) mais
					<KatexInline formula={String.raw`\mathbb{E}[X_n^2] = n^2 \times 1/n^2 = 1 \not\to 0`} />.
					Le mécanisme « événement rare mais de grande amplitude » n'est tout simplement pas
					disponible pour de vrais risques, bornés par construction par <KatexInline
						formula={String.raw`1`}
					/>.
				</p>
			{/snippet}
			<p>
				Peut-on avoir consistance en probabilité sans consistance en moyenne quadratique pour une
				suite de vrais classifieurs ? Justifiez.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.5" title="Calcul numérique de la décomposition">
			{#snippet solution()}
				<p>
					Le terme d'approximation vaut <KatexInline
						formula={String.raw`\inf_{\mathcal H} R(h) - R^* = 0.35 - 0.2 = 0.15`}
					/>. Le terme d'estimation vaut <KatexInline
						formula={String.raw`R(h_n) - \inf_{\mathcal H} R(h) = 0.42 - 0.35 = 0.07`}
					/>. La somme des deux, <KatexInline formula={String.raw`0.22`} />, redonne bien
					<KatexInline formula={String.raw`R(h_n)-R^* = 0.42-0.2 = 0.22`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`R^*=0.2`} />, <KatexInline
					formula={String.raw`\inf_{\mathcal H}R(h) = 0.35`}
				/>, et <KatexInline formula={String.raw`R(h_n)=0.42`} />. Calculez le terme d'approximation
				et le terme d'estimation, et vérifiez que leur somme redonne l'excès de risque total.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.6" title="Un cas où le terme d'approximation ne peut pas s'annuler">
			{#snippet solution()}
				<p>
					Si la vraie frontière de Bayes est un cercle, aucun classifieur linéaire ne peut la
					représenter exactement : pour tout hyperplan, il existe toujours une région du plan mal
					classée (soit à l'intérieur du cercle classée comme extérieure, soit l'inverse). Le
					meilleur hyperplan minimise cette erreur résiduelle sans jamais l'annuler, donc
					<KatexInline formula={String.raw`\inf_{\mathcal H} R(h) > R^*`} /> strictement, pour
					<strong>toute</strong> classe <KatexInline formula={String.raw`\mathcal H`} /> d'hyperplans,
					quelle que soit sa paramétrisation exacte. Comme ce terme ne dépend pas des données, aucune
					quantité de données supplémentaires (aucune augmentation de <KatexInline
						formula={String.raw`n`}
					/>) ne peut le faire diminuer : seul un changement de classe <KatexInline
						formula={String.raw`\mathcal H`}
					/> (vers une classe capable de représenter des frontières courbes) le peut.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\mathcal H`} /> la classe de tous les classifieurs linéaires
				(hyperplans) de <KatexInline formula={String.raw`\mathbb{R}^2`} />, et supposons que la
				vraie frontière de Bayes est un cercle. Expliquez pourquoi le terme d'approximation
				<KatexInline formula={String.raw`\inf_{\mathcal H}R(h)-R^*`} /> reste strictement positif quel
				que soit <KatexInline formula={String.raw`n`} />, et ce que cela implique pour la
				consistance de tout algorithme restreint à <KatexInline formula={String.raw`\mathcal H`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.7" title="Lire des trajectoires de convergence simulées">
			{#snippet solution()}
				<p>
					À mesure que <KatexInline formula={String.raw`n`} /> augmente, les trajectoires individuelles
					se resserrent progressivement autour de <KatexInline formula={String.raw`R^*`} />, et la
					fraction de trajectoires en dehors de la bande <KatexInline
						formula={String.raw`[R^*, R^*+\varepsilon]`}
					/> diminue. Pour un <KatexInline formula={String.raw`\varepsilon`} /> fixé, cette fraction (qui
					estime <KatexInline formula={String.raw`\mathbb{P}(R(h_n)-R^*>\varepsilon)`} />) tend vers
					0 — c'est une illustration empirique de la consistance en probabilité. Le fait que chaque
					trajectoire individuelle, une fois entrée durablement dans la bande, n'en ressort
					quasiment plus, est ce qui donne une intuition (mais pas une preuve — un nombre fini de
					simulations ne peut jamais établir un résultat asymptotique presque sûr) de la convergence
					presque sûre.
				</p>
			{/snippet}
			<p>
				En reprenant le principe de la démo « Trajectoires de convergence » de la Leçon 1 (sans
				besoin de la ré-exécuter) : décrivez ce que devraient montrer, qualitativement, les
				trajectoires simulées et la fraction dépassant <KatexInline
					formula={String.raw`\varepsilon`}
				/>
				à mesure que <KatexInline formula={String.raw`n`} /> augmente, si l'algorithme sous-jacent est
				effectivement consistant.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.8" title="Complexité optimale en fonction de n">
			{#snippet solution()}
				<p>
					Le risque appris s'écrit <KatexInline formula={String.raw`f(c) = A/c + Bc/n`} />. En
					annulant la dérivée par rapport à <KatexInline formula={String.raw`c`} /> :
				</p>
				<KatexBlock
					formula={String.raw`f'(c) = -A/c^2 + B/n = 0 \iff c^2 = An/B \iff c^* = \sqrt{An/B}.`}
				/>
				<p>
					La complexité optimale croît comme <KatexInline formula={String.raw`\sqrt{n}`} /> : plus on
					dispose de données, plus on peut se permettre une classe riche sans que le terme d'estimation
					n'explose. C'est la même structure mathématique que le <KatexInline
						formula={String.raw`k^*(n)`}
					/> optimal du modèle jouet k-NN vu dans les démonstrations interactives.
				</p>
			{/snippet}
			<p>
				Soit un modèle jouet où le terme d'approximation vaut <KatexInline
					formula={String.raw`A/c`}
				/> et le terme d'estimation vaut <KatexInline formula={String.raw`Bc/n`} /> (<KatexInline
					formula={String.raw`c`}
				/> désignant la complexité de la classe). Trouvez la complexité <KatexInline
					formula={String.raw`c^*`}
				/> qui minimise le risque appris total, en fonction de <KatexInline
					formula={String.raw`n`}
				/>, <KatexInline formula={String.raw`A`} /> et <KatexInline formula={String.raw`B`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.9" title="Vrai ou faux">
			<p>Indiquez si chaque affirmation est vraie ou fausse, en justifiant brièvement.</p>
			<ol>
				<li>La consistance en probabilité est la notion la plus exigeante des trois.</li>
				<li>
					Si <KatexInline formula={String.raw`h^* \in \mathcal H`} />, le terme d'approximation est
					nul.
				</li>
				<li>Le terme d'estimation peut être négatif.</li>
				<li>
					Une classe <KatexInline formula={String.raw`\mathcal H`} /> plus riche a toujours un terme d'approximation
					plus petit ou égal.
				</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<strong>Faux.</strong> C'est au contraire la plus <strong>faible</strong> — elle est impliquée
						par les deux autres (Exercices 1.2 et 1.3), mais n'implique aucune des deux en général.
					</li>
					<li>
						<strong>Vrai.</strong> Si le classifieur de Bayes appartient à la classe, le meilleur
						élément de la classe l'atteint exactement, donc <KatexInline
							formula={String.raw`\inf_{\mathcal H}R(h) = R(h^*) = R^*`}
						/>.
					</li>
					<li>
						<strong>Faux.</strong>
						<KatexInline formula={String.raw`R(h_n) \ge \inf_{\mathcal H}R(h)`} /> par définition de l'infimum,
						donc le terme d'estimation
						<KatexInline formula={String.raw`R(h_n)-\inf_{\mathcal H}R(h)`} /> est toujours
						<KatexInline formula={String.raw`\ge 0`} />.
					</li>
					<li>
						<strong>Vrai.</strong> Élargir <KatexInline formula={String.raw`\mathcal H`} /> ne peut qu'ajouter
						des candidats à l'infimum, jamais en retirer — le terme d'approximation est donc monotone
						décroissant (au sens large) avec la richesse de la classe.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="1.10" title="Compléter l'argument presque sûr ⟹ probabilité">
			{#snippet solution()}
				<p>
					Fixons <KatexInline formula={String.raw`\varepsilon>0`} />. Posons
					<KatexInline formula={String.raw`A_n = \{R(h_n)-R^*>\varepsilon\}`} /> et <KatexInline
						formula={String.raw`B_N = \bigcup_{n\ge N} A_n`}
					/>. La convergence presque sûre signifie que <KatexInline
						formula={String.raw`\mathbb{P}(\bigcap_{N\ge1} B_N) = 0`}
					/> (l'événement « <KatexInline formula={String.raw`A_n`} /> se produit une infinité de fois
					» est de probabilité nulle). Comme <KatexInline formula={String.raw`B_N`} /> est une suite décroissante
					d'événements, la continuité de la mesure donne <KatexInline
						formula={String.raw`\mathbb{P}(B_N) \to \mathbb{P}(\bigcap_N B_N) = 0`}
					/>. Or <KatexInline formula={String.raw`A_N \subset B_N`} />, donc <KatexInline
						formula={String.raw`\mathbb{P}(A_N) \le \mathbb{P}(B_N) \to 0`}
					/> : c'est exactement la consistance en probabilité.
				</p>
			{/snippet}
			<p>
				En posant <KatexInline formula={String.raw`A_n = \{R(h_n)-R^*>\varepsilon\}`} /> et
				<KatexInline formula={String.raw`B_N = \bigcup_{n\ge N} A_n`} />, complétez l'argument de
				l'Exercice 1.3 pour obtenir une preuve rigoureuse (plutôt qu'une esquisse) de l'implication
				presque sûr ⟹ probabilité.
			</p>
		</ExercisePanel>

		<h2 id="consistance-universelle-knn">Consistance universelle et k-NN</h2>

		<p>
			Cette section propose dix exercices sur la consistance universelle, le théorème de Stone, le
			choix pratique de <KatexInline formula={String.raw`k(n)`} />, et la lecture biais-variance du
			k-NN.
		</p>

		<ExercisePanel number="2.1" title="Vérifier les conditions de Stone pour k(n) = √n">
			{#snippet solution()}
				<p>
					<KatexInline formula={String.raw`k(n)=\sqrt n \to +\infty`} /> quand <KatexInline
						formula={String.raw`n\to+\infty`}
					/> : la première condition est vérifiée. Le rapport <KatexInline
						formula={String.raw`k(n)/n = 1/\sqrt n \to 0`}
					/> : la seconde condition l'est aussi. <KatexInline formula={String.raw`k(n)=\sqrt n`} /> satisfait
					donc les conditions de Stone, et le k-NN associé est universellement consistant.
				</p>
			{/snippet}
			<p>
				Vérifiez que <KatexInline formula={String.raw`k(n)=\sqrt n`} /> satisfait les deux conditions
				de Stone <KatexInline formula={stoneConditions} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.2" title="Vérifier les conditions de Stone pour k(n) = ⌊log n⌋">
			{#snippet solution()}
				<p>
					<KatexInline formula={String.raw`\lfloor \log n \rfloor \to +\infty`} /> (lentement, mais sans
					borne) quand <KatexInline formula={String.raw`n\to+\infty`} /> : première condition vérifiée.
					Et
					<KatexInline formula={String.raw`\log(n)/n \to 0`} /> (le logarithme croît infiniment plus lentement
					que <KatexInline formula={String.raw`n`} />) : seconde condition également vérifiée.
					<KatexInline formula={String.raw`k(n)=\lfloor\log n\rfloor`} /> satisfait donc, lui aussi, les
					conditions de Stone — même s'il grandit beaucoup plus lentement que
					<KatexInline formula={String.raw`\sqrt n`} />, ce qui aura un effet pratique sur la
					vitesse de convergence (non garantie par le seul théorème d'universalité).
				</p>
			{/snippet}
			<p>
				Vérifiez que <KatexInline formula={String.raw`k(n)=\lfloor\log n\rfloor`} /> satisfait également
				les deux conditions de Stone.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.3" title="Un choix qui échoue : k(n) = n/2">
			{#snippet solution()}
				<p>
					<KatexInline formula={String.raw`k(n)=n/2 \to +\infty`} /> : la première condition est vérifiée.
					Mais le rapport <KatexInline formula={String.raw`k(n)/n = 1/2`} /> est
					<strong>constant</strong>, il ne tend donc pas vers <KatexInline
						formula={String.raw`0`}
					/> : la seconde condition échoue. En utilisant la moitié de l'échantillon comme voisinage à
					chaque prédiction, on moyenne systématiquement sur une région bien trop large pour capturer
					la valeur locale de <KatexInline formula={String.raw`\eta(x)`} /> — le biais introduit ne s'annule
					jamais, quelle que soit la taille de l'échantillon.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`k(n)=n/2`} />. Laquelle des deux conditions de Stone
				échoue, et pourquoi cela empêche-t-il la consistance universelle ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.4" title="Un choix qui échoue : k(n) constant">
			{#snippet solution()}
				<p>
					Si <KatexInline formula={String.raw`k(n)=k_0`} /> est une constante fixée (indépendante de
					<KatexInline formula={String.raw`n`} />), alors <KatexInline
						formula={String.raw`k(n) \not\to +\infty`}
					/> : la première condition de Stone échoue dès le départ (le rapport
					<KatexInline formula={String.raw`k(n)/n = k_0/n \to 0`} /> tend bien vers 0, mais cela ne suffit
					pas — les <strong>deux</strong> conditions sont requises simultanément). Le nombre de
					voisins moyennés reste borné pour toujours, donc la variance de l'estimation locale de
					<KatexInline formula={String.raw`\eta(x)`} /> ne diminue jamais avec <KatexInline
						formula={String.raw`n`}
					/> — c'est exactement la situation étudiée pour <KatexInline
						formula={String.raw`k_0=1`}
					/> dans la Leçon 2 (section « Pourquoi k fixe ne suffit pas »), et quantifiée à
					l'exercice 2.10.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`k(n)=k_0`} /> une constante. Laquelle des deux conditions
				de Stone échoue cette fois, et quelle conséquence concrète cela a-t-il sur la variance de l'estimation
				locale de <KatexInline formula={String.raw`\eta`} /> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.5" title="Comparer plusieurs lois k(n)">
			<p>
				Pour chacune des lois suivantes, indiquez si elle satisfait les conditions de Stone.
				Justifiez brièvement.
			</p>
			<ol>
				<li><KatexInline formula={String.raw`k(n) = n^{0.3}`} /></li>
				<li><KatexInline formula={String.raw`k(n) = n`} /></li>
				<li><KatexInline formula={String.raw`k(n) = 5`} /></li>
				<li><KatexInline formula={String.raw`k(n) = \sqrt{n}/\log n`} /></li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<strong>Satisfait Stone.</strong>
						<KatexInline formula={String.raw`n^{0.3} \to +\infty`} /> et
						<KatexInline formula={String.raw`n^{0.3}/n = n^{-0.7} \to 0`} />.
					</li>
					<li>
						<strong>Échoue.</strong>
						<KatexInline formula={String.raw`k(n)=n \to +\infty`} /> bien, mais
						<KatexInline formula={String.raw`k(n)/n = 1 \not\to 0`} />.
					</li>
					<li>
						<strong>Échoue.</strong> Constante, donc <KatexInline
							formula={String.raw`k(n) \not\to +\infty`}
						/>.
					</li>
					<li>
						<strong>Satisfait Stone.</strong>
						<KatexInline formula={String.raw`\sqrt n/\log n \to +\infty`} /> (le numérateur domine) et
						<KatexInline
							formula={String.raw`\frac{\sqrt n/\log n}{n} = \frac{1}{\sqrt n \log n} \to 0`}
						/>.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2.6" title="Lecture qualitative biais-variance">
			{#snippet solution()}
				<p>
					Pour <KatexInline formula={String.raw`k`} /> proche de <KatexInline
						formula={String.raw`1`}
					/>, la variance domine : chaque prédiction repose sur très peu de voisins, donc elle est
					très sensible au bruit d'échantillonnage individuel — le risque est élevé, dominé par la
					variance. Pour <KatexInline formula={String.raw`k`} /> proche de <KatexInline
						formula={String.raw`n`}
					/>, le biais domine : le voisinage utilisé couvre presque tout l'espace, la prédiction
					devient quasiment constante (proche de la fréquence globale de la classe majoritaire) et
					perd toute sensibilité à la position locale de <KatexInline formula={String.raw`x`} /> — le
					risque est à nouveau élevé, mais cette fois dominé par le biais. Entre les deux, il existe un
					<KatexInline formula={String.raw`k`} /> intermédiaire qui minimise la somme des deux effets.
				</p>
			{/snippet}
			<p>
				Pour <KatexInline formula={String.raw`n`} /> fixé, décrivez qualitativement ce qui domine — biais
				ou variance — lorsque <KatexInline formula={String.raw`k`} /> est proche de <KatexInline
					formula={String.raw`1`}
				/>, puis lorsque <KatexInline formula={String.raw`k`} /> est proche de <KatexInline
					formula={String.raw`n`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.7" title="Retrouver k*(n) pour le modèle jouet k-NN">
			{#snippet solution()}
				<p>
					On minimise <KatexInline formula={String.raw`f(k) = V/k + Bk/n`} /> par rapport à <KatexInline
						formula={String.raw`k`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`f'(k) = -V/k^2 + B/n = 0 \iff k^2 = \frac{Vn}{B} \iff k^* = \sqrt{\frac{Vn}{B}}.`}
				/>
				<p>
					On vérifie que <KatexInline formula={String.raw`k^*(n) = \sqrt{Vn/B}`} /> satisfait bien les
					conditions de Stone : <KatexInline formula={String.raw`k^*(n) \to +\infty`} /> (croissance en
					<KatexInline formula={String.raw`\sqrt n`} />), et <KatexInline
						formula={String.raw`k^*(n)/n = \sqrt{V/(Bn)} \to 0`}
					/>. Le compromis biais-variance optimal du modèle jouet <em>tombe automatiquement</em> dans
					le régime que Stone identifie comme universellement consistant.
				</p>
			{/snippet}
			<p>
				Pour le modèle jouet de risque excédentaire k-NN <KatexInline
					formula={String.raw`V/k + B(k/n)`}
				/> (variance en <KatexInline formula={String.raw`1/k`} />, biais en <KatexInline
					formula={String.raw`k/n`}
				/>), retrouvez par le calcul la valeur <KatexInline formula={String.raw`k^*(n)`} /> qui le minimise,
				et vérifiez qu'elle satisfait les conditions de Stone.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.8" title="Vrai ou faux">
			<p>Indiquez si chaque affirmation est vraie ou fausse, en justifiant brièvement.</p>
			<ol>
				<li>
					La consistance universelle est une conséquence automatique de la consistance simple.
				</li>
				<li>
					Le théorème de Stone garantit la consistance du k-NN pour <strong>toute</strong>
					distribution
					<KatexInline formula={String.raw`P_{X,Y}`} />.
				</li>
				<li>
					Si <KatexInline formula={String.raw`k(n)\to+\infty`} /> mais <KatexInline
						formula={String.raw`k(n)/n \to c > 0`}
					/>
					pour une constante <KatexInline formula={String.raw`c`} />, le k-NN reste universellement
					consistant.
				</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<strong>Faux.</strong> C'est l'inverse : la consistance simple (pour une distribution donnée)
						est une conséquence de la consistance universelle, pas le contraire. Un algorithme peut être
						consistant pour certaines distributions particulières sans être universellement consistant.
					</li>
					<li>
						<strong>Vrai.</strong> C'est exactement l'énoncé du Théorème 2.1 — aucune hypothèse sur <KatexInline
							formula={String.raw`P_{X,Y}`}
						/> n'est requise, seulement les deux conditions sur <KatexInline
							formula={String.raw`k(n)`}
						/>.
					</li>
					<li>
						<strong>Faux.</strong> Si le rapport <KatexInline formula={String.raw`k(n)/n`} /> tend vers
						une constante strictement positive plutôt que vers <KatexInline
							formula={String.raw`0`}
						/>, la seconde condition de Stone échoue — c'est la même situation que l'Exercice 2.3.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2.9" title="Pourquoi ce théorème est-il remarquable ?">
			{#snippet solution()}
				<p>
					Un algorithme paramétrique (régression logistique, SVM linéaire...) suppose implicitement
					une forme pour la frontière de décision ; si cette forme ne correspond pas à la vraie
					frontière, le terme d'approximation reste strictement positif pour toujours, quel que soit <KatexInline
						formula={String.raw`n`}
					/> (cf. Exercice 1.6). Le k-NN, en laissant
					<KatexInline formula={String.raw`k(n)`} /> croître avec <KatexInline
						formula={String.raw`n`}
					/>, adapte continuellement la richesse effective de son « modèle » à la quantité de
					données disponible — il n'y a jamais de classe <KatexInline
						formula={String.raw`\mathcal H`}
					/> fixée a priori dont le terme d'approximation pourrait bloquer la convergence. C'est cette
					adaptivité qui permet d'obtenir un résultat valable pour <strong>toute</strong> distribution,
					sans aucune hypothèse structurelle — une garantie qu'aucune méthode paramétrique ne peut offrir.
				</p>
			{/snippet}
			<p>
				En une ou deux phrases : pourquoi le théorème de Stone est-il un résultat particulièrement
				fort comparé aux résultats de consistance vus à la Leçon 1, qui supposaient une classe
				<KatexInline formula={String.raw`\mathcal H`} /> fixée ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.10" title="Appliquer la borne du 1-NN">
			{#snippet solution()}
				<p>
					Avec <KatexInline formula={String.raw`R^*=0.1`} /> :
				</p>
				<KatexBlock
					formula={String.raw`2R^*\left(1-\tfrac{R^*}{2}\right) = 2 \times 0.1 \times 0.95 = 0.19.`}
				/>
				<p>
					Le risque asymptotique du 1-NN est donc majoré par <KatexInline
						formula={String.raw`0.19`}
					/>, soit <strong>presque le double</strong> du risque de Bayes <KatexInline
						formula={String.raw`0.1`}
					/>. C'est un écart considérable pour un algorithme aussi simple, et il illustre
					concrètement pourquoi le Théorème 2.1 exige <KatexInline
						formula={String.raw`k(n)\to+\infty`}
					/> plutôt que de se contenter d'un <KatexInline formula={String.raw`k`} /> fixe, même petit.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`R^*=0.1`} />. Calculez la borne
				<KatexInline formula={String.raw`2R^*\left(1-\tfrac{R^*}{2}\right)`} /> sur le risque asymptotique du
				1-NN, et comparez-la au risque de Bayes.
			</p>
		</ExercisePanel>
	</TheorySection>
</PageTemplate>
