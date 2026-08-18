<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	// import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import ClassificationIsEasierThanRegression from '$lib/components/demos/ClassificationIsEasierThanRegression.svelte';

	const meta = getPageByPath('/part4/exercices');
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	// ── Table of Contents ──

	// ── Formula variables (stored in script so Svelte never parses backslashes) ──
	const exBayesExcess = String.raw`L_n-L^*=2\,\mathbb{E}\!\left[\left|\eta(X)-\frac12\right|\mathbf{1}_{\{g_n(X)\neq g^*(X)\}}\right]`;

	const exSplit = String.raw`\begin{aligned}
		A_n
		&:=\mathbb{E}\!\left[
			|\eta(X)-\eta_n(X)|
			\mathbf{1}_{\{g_n(X)\neq g^*(X)\}}
			\right] \\[2mm]
		&\leq
		\mathbb{E}\!\left[
			|\eta(X)-\eta_n(X)|
			\mathbf{1}_{\{|\eta(X)-1/2|\leq\varepsilon\}}
			\right] \\
		&\quad+
		\mathbb{E}\!\left[
			|\eta(X)-\eta_n(X)|
			\mathbf{1}_{\{g_n(X)\neq g^*(X)\}}
			\mathbf{1}_{\{|\eta(X)-1/2|>\varepsilon\}}
			\right].
		\end{aligned}`;

	const exCauchy = String.raw`\mathbb{E}\!\left[
			|\eta(X)-\eta_n(X)|
			\mathbf{1}_{A}
			\right]
		\leq
		\sqrt{\mathbb{E}\!\left[(\eta_n(X)-\eta(X))^2\right]}
		\sqrt{\mathbb{P}(A)}`;

	const exImplication = String.raw`g_n(X)\neq g^*(X)
		\quad\text{et}\quad
		\left|\eta(X)-\frac12\right|>\varepsilon
		\quad\Longrightarrow\quad
		|\eta_n(X)-\eta(X)|>\varepsilon`;

	const exMargin = String.raw`\mathbb{P}\!\left(
			\left|\eta(X)-\frac12\right|\leq\varepsilon
		\right)
		\longrightarrow 0
		\qquad\text{quand }\varepsilon\downarrow0`;

	const exFinal = String.raw`\frac{\mathbb{E}[L_n]-L^*}
			{\mathbb{E}[(\eta_n(X)-\eta(X))^2]}
		\longrightarrow 0`;
</script>

<svelte:head>
	<title>{meta?.title ?? 'Exercices'} — Régularisation et Optimisation</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Exercices — Classifieur et régression optimaux'}
	subtitle="Optimum de Bayes"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<!--<TableOfContents entries={tocEntries} />-->
		<h2 id="expert-theorem-6-5">Pourquoi la classification est plus facile que la régression</h2>

		<p>
			Cette série d'exercices reconstruit progressivement le <strong
				>théorème 6.5 de Devroye, Györfi et Lugosi</strong
			>. L'idée fondamentale est surprenante : pour classer, il n'est pas nécessaire d'estimer
			précisément toute la fonction
			<KatexInline formula={String.raw`\eta(x)`} />. Il suffit de savoir de quel côté de
			<KatexInline formula={String.raw`1/2`} /> elle se trouve.
		</p>

		<InteractiveSection title="Classification is easier than regression">
			L'animation ci-dessous permet de jouer avec le bruit de la vraie probabilité, la qualité de
			l'approximation et le bruit autour de l'approximation. Étudiez dans quel scénario le
			classifieur résultat devient incorrect par rapport à l'optimum de Bayes.
			<ClassificationIsEasierThanRegression />
		</InteractiveSection>

		<ExercisePanel number="1" title="Le coût d'une erreur de décision">
			<p>
				On note
				<KatexInline formula={String.raw`\eta(x)=\mathbb{P}(Y=1\mid X=x)`} />,
				<KatexInline formula={String.raw`g^*(x)=\mathbf{1}_{\{\eta(x)\geq1/2\}}`} />
				le classifieur de Bayes et
				<KatexInline formula={String.raw`g_n(x)=\mathbf{1}_{\{\eta_n(x)\geq1/2\}}`} />
				le classifieur construit à partir d'un estimateur <KatexInline
					formula={String.raw`\eta_n`}
				/>.
			</p>

			<p>
				Montrer que le risque conditionnel de <KatexInline formula={String.raw`g^*`} /> en
				<KatexInline formula={String.raw`x`} /> vaut
				<KatexInline formula={String.raw`\min(\eta(x),1-\eta(x))`} /> et que, lorsque
				<KatexInline formula={String.raw`g_n(x)\neq g^*(x)`} />, la différence entre les deux
				risques conditionnels vaut
				<KatexInline formula={String.raw`2|\eta(x)-1/2|`} />.
			</p>

			{#snippet solution()}
				<p>
					Si <KatexInline formula={String.raw`g^*(x)=1`} />, alors
					<KatexInline formula={String.raw`\eta(x)\geq1/2`} /> et le risque de Bayes est
					<KatexInline formula={String.raw`1-\eta(x)`} />. Si <KatexInline
						formula={String.raw`g^*(x)=0`}
					/>, il vaut <KatexInline formula={String.raw`\eta(x)`} />. Dans les deux cas :
				</p>

				<KatexBlock formula={String.raw`r(g^*(x),x)=\min(\eta(x),1-\eta(x))`} />

				<p>
					Si <KatexInline formula={String.raw`g_n`} /> choisit l'autre classe, son risque conditionnel
					est <KatexInline formula={String.raw`\max(\eta(x),1-\eta(x))`} />. La différence vaut donc
				</p>

				<KatexBlock
					formula={String.raw`\max(\eta(x),1-\eta(x))-\min(\eta(x),1-\eta(x))
					=2\left|\eta(x)-\frac12\right|.`}
				/>

				<p>
					En intégrant sur <KatexInline formula={String.raw`X`} />, on obtient l'identité
					fondamentale :
				</p>

				<KatexBlock formula={exBayesExcess} />
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2" title="Relier l'erreur de classification à l'erreur de régression">
			<p>
				Dans l'expression précédente, on ne connaît pas directement
				<KatexInline formula={String.raw`|\eta(X)-1/2|`} />. Montrer que, sur l'événement
				<KatexInline formula={String.raw`{g_n(X)\neq g^*(X)}`} />, on peut écrire
			</p>

			<KatexBlock
				formula={String.raw`\left|\eta(X)-\frac12\right|
				\leq |\eta(X)-\eta_n(X)|.`}
			/>

			<p>En déduire la borne :</p>

			<KatexBlock
				formula={String.raw`L_n-L^*
				\leq
				2\,\mathbb{E}\!\left[
					|\eta(X)-\eta_n(X)|
					\mathbf{1}_{\{g_n(X)\neq g^*(X)\}}
				\right].`}
			/>

			{#snippet solution()}
				<p>
					Si les deux classifieurs prennent des décisions différentes, alors
					<KatexInline formula={String.raw`\eta_n(X)`} /> et <KatexInline
						formula={String.raw`\eta(X)`}
					/>
					sont de part et d'autre du seuil <KatexInline formula={String.raw`1/2`} />. La distance
					entre eux est donc au moins la distance de
					<KatexInline formula={String.raw`\eta(X)`} /> au seuil :
				</p>

				<KatexBlock
					formula={String.raw`g_n(X)\neq g^*(X)
					\quad\Longrightarrow\quad
					|\eta_n(X)-\eta(X)|
					\geq
					\left|\eta(X)-\frac12\right|.`}
				/>

				<p>
					En remplaçant le terme dans l'identité de l'exercice précédent, on obtient immédiatement
					la borne demandée.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="3" title="Séparer les zones faciles et difficiles">
			<p>
				Fixons <KatexInline formula={String.raw`\varepsilon>0`} />. Séparer l'espérance de
				l'exercice précédent en deux régions :
			</p>

			<KatexBlock formula={exSplit} />

			<p>
				Pourquoi cette séparation est-elle pertinente ? Que représente la région
				<KatexInline formula={String.raw`|\eta(X)-1/2|\leq\varepsilon`} /> ?
			</p>

			{#snippet solution()}
				<p>
					La région proche de <KatexInline formula={String.raw`1/2`} /> correspond aux points pour lesquels
					les deux classes sont difficiles à distinguer. Une petite erreur d'estimation peut alors inverser
					la décision.
				</p>

				<p>
					À l'inverse, lorsque
					<KatexInline formula={String.raw`|\eta(X)-1/2|>\varepsilon`} />, la vraie probabilité est
					suffisamment éloignée du seuil pour que la classification soit robuste aux petites erreurs
					d'estimation.
				</p>

				<p>
					C'est précisément cette distinction qui permet d'obtenir un taux de convergence plus
					rapide pour la classification que pour l'estimation de <KatexInline
						formula={String.raw`\eta`}
					/> elle-même.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="4" title="Contrôler la première région">
			<p>
				Montrer, en utilisant l'inégalité de Cauchy-Schwarz, que pour tout événement
				<KatexInline formula={String.raw`A`} /> :
			</p>

			<KatexBlock formula={exCauchy} />

			<p>
				Appliquer cette inégalité à
				<KatexInline formula={String.raw`A=\{|\eta(X)-1/2|\leq\varepsilon\}`} />. En déduire que le
				premier terme de <KatexInline formula={String.raw`A_n`} /> est borné par
			</p>

			<KatexBlock
				formula={String.raw`\sqrt{\mathbb{E}[(\eta_n(X)-\eta(X))^2]}\,
				\sqrt{\mathbb{P}(|\eta(X)-1/2|\leq\varepsilon)}.`}
			/>

			{#snippet solution()}
				<p>
					L'inégalité de Cauchy-Schwarz appliquée aux variables
					<KatexInline formula={String.raw`|\eta_n(X)-\eta(X)|`} /> et
					<KatexInline formula={String.raw`\mathbf{1}_A`} /> donne directement le résultat. Or <KatexInline
						formula={String.raw`\mathbf{1}_A^2=\mathbf{1}_A`}
					/>, donc
				</p>

				<KatexBlock
					formula={String.raw`\mathbb{E}[
						|\eta_n-\eta|\mathbf{1}_A]
					\leq
					\sqrt{\mathbb{E}[(\eta_n-\eta)^2]}
					\sqrt{\mathbb{P}(A)}.`}
				/>

				<p>
					Le premier facteur mesure l'erreur globale de régression, tandis que le second mesure la
					masse de probabilité située près de la frontière de décision.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="5" title="Pourquoi les erreurs loin du seuil disparaissent">
			<p>Montrer l'implication :</p>

			<KatexBlock formula={exImplication} />

			<p>
				En déduire que, pour tout <KatexInline formula={String.raw`\varepsilon>0`} />,
			</p>

			<KatexBlock
				formula={String.raw`\mathbb{P}\!\left(
					g_n(X)\neq g^*(X),
					\left|\eta(X)-\frac12\right|>\varepsilon
				\right)
				\leq
				\mathbb{P}\!\left(|\eta_n(X)-\eta(X)|>\varepsilon\right).`}
			/>

			<p>
				Si <KatexInline formula={String.raw`\eta_n`} /> est consistant au sens
				<KatexInline formula={String.raw`L^2`} />, montrer que le membre de droite tend vers zéro.
			</p>

			{#snippet solution()}
				<p>
					Si les deux décisions sont différentes, <KatexInline formula={String.raw`\eta_n`} />
					et <KatexInline formula={String.raw`\eta`} /> sont de part et d'autre de
					<KatexInline formula={String.raw`1/2`} />. Si <KatexInline formula={String.raw`\eta`} /> est
					à une distance supérieure à <KatexInline formula={String.raw`\varepsilon`} /> du seuil, il faut
					donc nécessairement déplacer <KatexInline formula={String.raw`\eta`} /> d'au moins <KatexInline
						formula={String.raw`\varepsilon`}
					/> pour franchir le seuil.
				</p>

				<p>L'implication demandée en découle. Puis, par l'inégalité de Markov :</p>

				<KatexBlock
					formula={String.raw`\mathbb{P}(|\eta_n-\eta|>\varepsilon)
					\leq
					\frac{\mathbb{E}[(\eta_n-\eta)^2]}{\varepsilon^2}
					\longrightarrow0.`}
				/>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="6" title="La masse autour de la frontière">
			<p>Justifier que</p>

			<KatexBlock formula={exMargin} />

			<p>
				sous la seule condition
				<KatexInline formula={String.raw`\mathbb{P}(\eta(X)=1/2)=0`} />. Pourquoi cette hypothèse
				est-elle naturelle dans le contexte du théorème ?
			</p>

			{#snippet solution()}
				<p>
					Les événements
					<KatexInline formula={String.raw`{|\eta(X)-1/2|\leq\varepsilon}`} />
					décroissent lorsque <KatexInline formula={String.raw`\varepsilon\downarrow0`} /> et leur intersection
					est exactement
					<KatexInline formula={String.raw`{\eta(X)=1/2}`} />.
				</p>

				<p>Par continuité décroissante de la mesure :</p>

				<KatexBlock
					formula={String.raw`\lim_{\varepsilon\downarrow0}
					\mathbb{P}\!\left(
						\left|\eta(X)-\frac12\right|\leq\varepsilon
					\right)
					=
					\mathbb{P}\!\left(\eta(X)=\frac12\right).`}
				/>

				<p>
					Si cette dernière probabilité est nulle, la masse située arbitrairement près de la
					frontière peut être rendue arbitrairement petite.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="7" title="Assembler les deux régions">
			<p>
				On suppose maintenant
				<KatexInline formula={String.raw`\mathbb{E}[(\eta_n(X)-\eta(X))^2]\to0`} />. À partir des
				exercices précédents, montrer que pour tout
				<KatexInline formula={String.raw`\varepsilon>0`} /> :
			</p>

			<KatexBlock
				formula={String.raw`\begin{aligned}
				L_n-L^*
				\leq 2\Bigg[
				&\sqrt{\mathbb{E}[(\eta_n-\eta)^2]}
				\sqrt{\mathbb{P}(|\eta-1/2|\leq\varepsilon)}
				\\
				&+
				\sqrt{\mathbb{E}[(\eta_n-\eta)^2]}
				\sqrt{\mathbb{P}(g_n\neq g^*,|\eta-1/2|>\varepsilon)}
				\Bigg].
				\end{aligned}`}
			/>

			<p>
				Expliquer comment choisir d'abord <KatexInline formula={String.raw`\varepsilon`} />, puis
				<KatexInline formula={String.raw`n`} />, pour montrer que
				<KatexInline
					formula={String.raw`L_n-L^*=o\!\left(\sqrt{\mathbb{E}[(\eta_n-\eta)^2]}\right)`}
				/>.
			</p>

			{#snippet solution()}
				<p>
					Le second facteur du deuxième terme tend vers zéro pour tout
					<KatexInline formula={String.raw`\varepsilon>0`} /> grâce à l'exercice 5. Le premier facteur
					de chaque terme est l'erreur
					<KatexInline formula={String.raw`L^2`} />, qui tend vers zéro.
				</p>

				<p>
					Pour obtenir le résultat de petit-o, on divise l'inégalité par
					<KatexInline formula={String.raw`\sqrt{\mathbb{E}[(\eta_n-\eta)^2]}`} />. Pour un <KatexInline
						formula={String.raw`\varepsilon`}
					/> fixé, on fait tendre
					<KatexInline formula={String.raw`n`} /> vers l'infini : le terme correspondant aux points éloignés
					de la frontière disparaît. Il reste une quantité contrôlée par
					<KatexInline formula={String.raw`\sqrt{\mathbb{P}(|\eta-1/2|\leq\varepsilon)}`} />.
				</p>

				<p>
					On fait ensuite tendre <KatexInline formula={String.raw`\varepsilon`} /> vers zéro. L'hypothèse
					de l'exercice 6 permet de rendre cette quantité arbitrairement petite.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="8" title="Théorème 6.5 — conclusion">
			<p>
				On suppose que <KatexInline formula={String.raw`\eta_n`} /> est un estimateur consistant de la
				fonction de régression au sens
			</p>

			<KatexBlock
				formula={String.raw`\mathbb{E}\!\left[(\eta_n(X)-\eta(X))^2\right]\longrightarrow0.`}
			/>

			<p>En reprenant l'argument précédent, établir la conclusion :</p>

			<KatexBlock formula={exFinal} />

			<p>
				Interpréter ce résultat en termes de difficulté relative de la régression et de la
				classification.
			</p>

			{#snippet solution()}
				<p>
					Le résultat signifie que l'excès de risque de classification disparaît
					<strong>strictement plus vite</strong> que l'erreur quadratique de l'estimation de la probabilité
					a posteriori :
				</p>

				<KatexBlock
					formula={String.raw`L_n-L^*
				=o\!\left(
					\mathbb{E}[(\eta_n(X)-\eta(X))^2]
				\right).`}
				/>

				<p>
					La raison profonde est que la classification ne demande pas de connaître
					<KatexInline formula={String.raw`\eta(x)`} /> avec précision partout. Elle demande seulement
					de déterminer si <KatexInline formula={String.raw`\eta(x)`} /> est au-dessus ou au-dessous de
					<KatexInline formula={String.raw`1/2`} />.
				</p>

				<p>
					L'erreur d'estimation n'est donc pénalisante que lorsqu'elle provoque un franchissement de
					la frontière de décision. Loin de
					<KatexInline formula={String.raw`1/2`} />, même une estimation relativement imprécise
					donne la bonne classe. La classification « jette » ainsi une grande partie de
					l'information que la régression doit estimer.
				</p>
			{/snippet}
		</ExercisePanel>

		<Callout type="insight" title="L'idée à retenir">
			<p>
				<strong>Régression :</strong> il faut estimer précisément la valeur de
				<KatexInline formula={String.raw`\eta(x)`} />.
			</p>
			<p>
				<strong>Classification :</strong> il suffit généralement de savoir de quel côté de <KatexInline
					formula={String.raw`1/2`}
				/> elle se trouve.
			</p>
			<p>
				Une erreur de régression loin de la frontière n'a aucune conséquence sur la décision. C'est
				pourquoi une même estimation de <KatexInline formula={String.raw`\eta`} />
				peut produire une classification très précise alors qu'elle reste relativement imprécise en termes
				de probabilité.
			</p>
		</Callout>
	</TheorySection>
</PageTemplate>
