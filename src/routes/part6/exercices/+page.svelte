<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import ClassificationIsEasierThanRegression from '$lib/components/demos/ClassificationIsEasierThanRegression.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part6/exercices');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Table of Contents ──

	const tocEntries: TocEntry[] = [
		{
			id: 'risque-classifieur',
			label: 'Risque conditionnel et classifieur de Bayes',
			description:
				'12 exercices — r(a,x), seuil 1/2, risque de Bayes, séparabilité, coûts asymétriques',
			color: 'belief'
		},
		{
			id: 'regression-moyenne-mediane',
			label: 'Régression : moyenne et médiane conditionnelles',
			description:
				'10 exercices — décomposition biais-variance, non-unicité de la médiane, L1 vs L2',
			color: 'surprise'
		},
		{
			id: 'synthese-classification-regression',
			label: 'Synthèse classification / régression',
			description: '3 exercices — le principe commun derrière les deux familles de résultats',
			color: 'neutral'
		},
		{
			id: 'expert-classification-regression',
			label: 'Pourquoi la classification est plus facile que la régression',
			description:
				'Au-delà du cours — reconstruction d\'un résultat de Devroye, Györfi & Lugosi (1996), §6.7',
			color: 'agent'
		}
	];

	// ── Formula variables reused across several exercises ──

	const r0x = 'r(0,x) = \\eta(x)';
	const r1x = 'r(1,x) = 1-\\eta(x)';
	const bayesClassifierCases =
		'h^*(x) = \\begin{cases} 1 & \\text{si } \\eta(x) \\ge 1/2 \\\\ 0 & \\text{sinon} \\end{cases}';
	const mDef = 'm(x) = \\mathbb{E}[Y\\mid X=x]';
	const medDef = '\\mathrm{Med}(Y\\mid X=x)';
	const gDef = 'g(c) = \\mathbb{E}[|Y-c|\\mid X=x]';

	// -- Formula for classification is easier than regression
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
			{\sqrt{\mathbb{E}[(\eta_n(X)-\eta(X))^2]}}
		\longrightarrow 0`;
</script>

<svelte:head>
	<title>{meta?.title ?? 'Exercices'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Exercices — Optimum de Bayes'}
	subtitle="Décision bayésienne, risque conditionnel, et prédicteurs optimaux en régression"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="risque-classifieur">Risque conditionnel et classifieur de Bayes</h2>

		<p>
			Cette section propose douze exercices sur le classifieur de Bayes : calcul du risque
			conditionnel, dérivation du seuil <KatexInline formula={String.raw`1/2`} />, calcul du risque
			de Bayes pour des distributions discrètes ou continues, séparabilité, et une extension
			optionnelle aux coûts asymétriques. Chaque exercice est accompagné d'une solution détaillée,
			accessible en cliquant sur « Voir la solution ».
		</p>

		<ExercisePanel number="1.1" title="Calcul direct du risque conditionnel">
			{#snippet solution()}
				<p>
					<KatexInline formula={String.raw`r(0,x) = \eta(x) = 0.3`} /> et
					<KatexInline formula={String.raw`r(1,x) = 1-\eta(x) = 0.7`} />. Comme
					<KatexInline formula={String.raw`r(0,x) < r(1,x)`} />, l'action optimale est
					<KatexInline formula={String.raw`a=0`} />, avec risque conditionnel de Bayes
					<KatexInline formula={String.raw`\min(0.3, 0.7) = 0.3`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\eta(x) = 0.3`} />. Calculez <KatexInline
					formula={String.raw`r(0,x)`}
				/> et <KatexInline formula={String.raw`r(1,x)`} />, puis déterminez l'action optimale et le
				risque conditionnel de Bayes en <KatexInline formula={String.raw`x`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.2" title="Le cas d'égalité η(x) = 1/2">
			{#snippet solution()}
				<p>
					Ici <KatexInline formula={String.raw`r(0,x) = r(1,x) = 0.5`} /> : les deux actions sont équivalentes
					en risque conditionnel, aucune n'est strictement meilleure. La convention du Théorème 1.1, <KatexInline
						formula={bayesClassifierCases}
					/>, tranche cette égalité en faveur de <KatexInline formula={String.raw`a=1`} /> (l'inégalité
					est large,
					<KatexInline formula={String.raw`\ge`} />, pas stricte). Un autre choix de convention (par
					exemple trancher vers 0) donnerait un classifieur tout aussi optimal, puisque le risque
					conditionnel est identique dans les deux cas — seule la <em>fonction</em>
					<KatexInline formula={String.raw`h^*`} /> change, pas le risque <KatexInline
						formula={String.raw`R^*`}
					/> qu'elle atteint.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\eta(x) = 1/2`} /> exactement. Que valent
				<KatexInline formula={String.raw`r(0,x)`} /> et <KatexInline formula={String.raw`r(1,x)`} /> ?
				Quelle action le Théorème 1.1 prescrit-il, et pourquoi ce choix n'a-t-il pas d'incidence sur la
				valeur du risque atteint ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.3" title="Retrouver algébriquement le seuil 1/2">
			{#snippet solution()}
				<p>
					On part de la condition d'optimalité <KatexInline
						formula={String.raw`r(1,x) \le r(0,x)`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`1-\eta(x) \le \eta(x) \iff 1 \le 2\eta(x) \iff \eta(x) \ge \tfrac12.`}
				/>
				<p>
					C'est exactement la condition du Théorème 1.1 : prédire <KatexInline
						formula={String.raw`1`}
					/>
					est optimal si et seulement si <KatexInline formula={String.raw`\eta(x) \ge 1/2`} />.
				</p>
			{/snippet}
			<p>
				En partant de la définition <KatexInline formula={r0x} /> et <KatexInline formula={r1x} />,
				retrouvez algébriquement la condition <KatexInline formula={String.raw`\eta(x) \ge 1/2`} /> à
				partir de <KatexInline formula={String.raw`r(1,x) \le r(0,x)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.4" title="Risque de Bayes pour une distribution discrète">
			{#snippet solution()}
				<p>
					Pour chaque point, le risque conditionnel de Bayes est
					<KatexInline formula={String.raw`\min(\eta(x_i), 1-\eta(x_i))`} /> :
					<KatexInline formula={String.raw`\min(0.1,0.9)=0.1`} />,
					<KatexInline formula={String.raw`\min(0.5,0.5)=0.5`} />,
					<KatexInline formula={String.raw`\min(0.9,0.1)=0.1`} />. En moyennant sur
					<KatexInline formula={String.raw`\mathbb{P}(X=x_i)=1/3`} /> :
				</p>
				<KatexBlock
					formula={String.raw`R^* = \frac13(0.1+0.5+0.1) = \frac{0.7}{3} \approx 0.233.`}
				/>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`X`} /> prenant trois valeurs équiprobables
				<KatexInline formula={String.raw`x_1,x_2,x_3`} /> (chacune avec probabilité
				<KatexInline formula={String.raw`1/3`} />), avec <KatexInline
					formula={String.raw`\eta(x_1)=0.1,\ \eta(x_2)=0.5,\ \eta(x_3)=0.9`}
				/>. Calculez <KatexInline formula={String.raw`R^*`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.5" title="Cas séparable : R* = 0">
			{#snippet solution()}
				<p>
					Puisque <KatexInline formula={String.raw`\eta(x) \in \{0,1\}`} /> pour tout
					<KatexInline formula={String.raw`x`} />, on a <KatexInline
						formula={String.raw`\min(\eta(x), 1-\eta(x)) = 0`}
					/> partout, donc <KatexInline formula={String.raw`R^* = 0`} />. Le classifieur de Bayes
					<KatexInline formula={String.raw`h^*(x) = \eta(x)`} /> ne se trompe jamais : à chaque
					<KatexInline formula={String.raw`x`} />, la classe est déterminée avec certitude — c'est
					exactement la définition de la séparabilité.
				</p>
			{/snippet}
			<p>
				Soit un problème où <KatexInline formula={String.raw`\eta(x) \in \{0,1\}`} /> pour tout
				<KatexInline formula={String.raw`x`} /> (chaque point appartient à une seule classe avec certitude).
				Montrez que <KatexInline formula={String.raw`R^*=0`} /> et décrivez le comportement de
				<KatexInline formula={String.raw`h^*`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.6" title="Cas maximalement bruité : R* = 1/2">
			{#snippet solution()}
				<p>
					Ici <KatexInline formula={String.raw`\min(\eta(x),1-\eta(x)) = \min(1/2,1/2) = 1/2`} />
					pour tout <KatexInline formula={String.raw`x`} />, donc <KatexInline
						formula={String.raw`R^* = 1/2`}
					/> : c'est le pire cas possible pour un problème de classification binaire — aucun classifieur,
					pas même celui de Bayes, ne peut faire mieux qu'un tirage à pile ou face, car
					<KatexInline formula={String.raw`X`} /> ne contient alors <em>aucune</em> information sur
					<KatexInline formula={String.raw`Y`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\eta(x) = 1/2`} /> pour tout <KatexInline
					formula={String.raw`x`}
				/> (aucune information utile dans <KatexInline formula={String.raw`X`} />). Montrez que
				<KatexInline formula={String.raw`R^* = 1/2`} />, et interprétez ce résultat.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.7" title="Distribution asymétrique à deux points">
			{#snippet solution()}
				<p>
					<KatexInline formula={String.raw`\min(0.2,0.8)=0.2`} /> avec poids
					<KatexInline formula={String.raw`0.6`} />, et <KatexInline
						formula={String.raw`\min(0.8,0.2)=0.2`}
					/> avec poids <KatexInline formula={String.raw`0.4`} />. Donc :
				</p>
				<KatexBlock formula={String.raw`R^* = 0.6\times 0.2 + 0.4\times 0.2 = 0.2.`} />
				<p>
					Puisque <KatexInline formula={String.raw`\eta`} /> est symétrique par rapport à <KatexInline
						formula={String.raw`1/2`}
					/> aux deux points (<KatexInline formula={String.raw`0.2`} /> et son complémentaire <KatexInline
						formula={String.raw`0.8`}
					/>), le risque de Bayes ponctuel est identique aux deux points, et donc indépendant de la
					pondération — ce ne serait pas le cas avec des valeurs de <KatexInline
						formula={String.raw`\eta`}
					/> moins symétriques.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`\eta(x_1)=0.2`} /> avec
				<KatexInline formula={String.raw`\mathbb{P}(X=x_1)=0.6`} />, et <KatexInline
					formula={String.raw`\eta(x_2)=0.8`}
				/> avec <KatexInline formula={String.raw`\mathbb{P}(X=x_2)=0.4`} />. Calculez
				<KatexInline formula={String.raw`R^*`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.8" title="Classifieur de Bayes pour η(x) continue">
			{#snippet solution()}
				<p>
					La frontière est au point où <KatexInline formula={String.raw`\eta(x)=1/2`} />, soit
					<KatexInline formula={String.raw`x=1/2`} /> : <KatexInline
						formula={String.raw`h^*(x) = \mathbb{1}_{x \ge 1/2}`}
					/>. Pour le risque de Bayes, avec <KatexInline
						formula={String.raw`X \sim \mathrm{Unif}[0,1]`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`R^* = \int_0^1 \min(x, 1-x)\,dx = 2\int_0^{1/2} x\,dx = 2\left[\frac{x^2}{2}\right]_0^{1/2} = \frac14.`}
				/>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`X \sim \mathrm{Unif}[0,1]`} /> et <KatexInline
					formula={String.raw`\eta(x) = x`}
				/>. Déterminez la frontière de décision, exprimez <KatexInline formula={String.raw`h^*`} />,
				puis calculez <KatexInline formula={String.raw`R^*`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.9" title="Extension optionnelle : coûts asymétriques">
			{#snippet solution()}
				<p>
					Avec des coûts <KatexInline formula={String.raw`c_0`} /> (coût de prédire 1 quand <KatexInline
						formula={String.raw`Y=0`}
					/>, faux positif) et <KatexInline formula={String.raw`c_1`} /> (coût de prédire 0 quand
					<KatexInline formula={String.raw`Y=1`} />, faux négatif), le risque conditionnel devient :
				</p>
				<KatexBlock formula={String.raw`r(1,x) = c_0(1-\eta(x)), \qquad r(0,x) = c_1\,\eta(x).`} />
				<p>
					L'action <KatexInline formula={String.raw`a=1`} /> est optimale ssi <KatexInline
						formula={String.raw`r(1,x) \le r(0,x)`}
					/>, c'est-à-dire :
				</p>
				<KatexBlock
					formula={String.raw`c_0(1-\eta(x)) \le c_1\,\eta(x) \iff \eta(x) \ge \frac{c_0}{c_0+c_1}.`}
				/>
				<p>
					On retrouve le Théorème 1.1 en posant <KatexInline formula={String.raw`c_0=c_1`} />, ce
					qui redonne le seuil <KatexInline formula={String.raw`1/2`} />. Cette généralisation n'est
					pas démontrée dans le cours mais suit exactement la même démarche que la preuve du
					Théorème 1.1 — seule l'expression du risque conditionnel change.
				</p>
			{/snippet}
			<p>
				<em>(Exercice optionnel, au-delà du cours.)</em> On remplace la perte 0-1 par une perte
				asymétrique : coût <KatexInline formula={String.raw`c_0 > 0`} /> pour un faux positif, coût
				<KatexInline formula={String.raw`c_1 > 0`} /> pour un faux négatif. En reprenant la méthode de
				la démonstration du Théorème 1.1, montrez que le classifieur optimal devient
				<KatexInline formula={String.raw`h^*(x) = \mathbb{1}_{\eta(x) \ge c_0/(c_0+c_1)}`} />, et
				vérifiez que l'on retrouve le seuil <KatexInline formula={String.raw`1/2`} /> quand <KatexInline
					formula={String.raw`c_0=c_1`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.10" title="Vrai ou faux">
			<p>Indiquez si chaque affirmation est vraie ou fausse, en justifiant brièvement.</p>
			<ol>
				<li>Le classifieur de Bayes dépend de l'algorithme d'apprentissage utilisé.</li>
				<li>
					Le risque de Bayes <KatexInline formula={String.raw`R^*`} /> peut être strictement négatif.
				</li>
				<li>
					Si <KatexInline formula={String.raw`\eta(x)\in\{0,1\}`} /> presque sûrement, alors
					<KatexInline formula={String.raw`R^*=0`} />.
				</li>
				<li>Le risque de Bayes est une borne atteinte par au moins un classifieur mesurable.</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<strong>Faux.</strong> Le classifieur de Bayes ne dépend que de <KatexInline
							formula={String.raw`P_{X,Y}`}
						/>, qui est supposée connue exactement — aucune notion d'algorithme ou d'échantillon
						n'intervient dans sa définition.
					</li>
					<li>
						<strong>Faux.</strong>
						<KatexInline formula={String.raw`R^*`} /> est une espérance de quantités de la forme <KatexInline
							formula={String.raw`\min(\eta,1-\eta) \ge 0`}
						/>, donc toujours
						<KatexInline formula={String.raw`R^* \ge 0`} />.
					</li>
					<li>
						<strong>Vrai.</strong> C'est exactement la condition de séparabilité vue à l'Exercice 1.5.
					</li>
					<li>
						<strong>Vrai.</strong> Par définition, <KatexInline
							formula={String.raw`R^* = R(h^*)`}
						/> — c'est le classifieur de Bayes lui-même qui atteint cette valeur (le Théorème 1.1 en donne
						la construction explicite).
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="1.11" title="Compléter la démonstration de l'optimalité globale">
			{#snippet solution()}
				<p>
					Pour <KatexInline formula={String.raw`h`} /> quelconque :
				</p>
				<KatexBlock
					formula={String.raw`R(h) - R(h^*) = \mathbb{E}_X\big[r(h(X),X) - r(h^*(X),X)\big].`}
				/>
				<p>
					Par construction de <KatexInline formula={String.raw`h^*`} /> (minimiseur ponctuel de
					<KatexInline formula={String.raw`r(\cdot,x)`} />), on a <KatexInline
						formula={String.raw`r(h^*(x),x) \le r(a,x)`}
					/> pour tout <KatexInline formula={String.raw`a\in\{0,1\}`} /> et tout <KatexInline
						formula={String.raw`x`}
					/>
					— en particulier pour <KatexInline formula={String.raw`a=h(x)`} />. Donc
					<KatexInline formula={String.raw`r(h(x),x) - r(h^*(x),x) \ge 0`} /> pour tout <KatexInline
						formula={String.raw`x`}
					/>. Par positivité de l'espérance d'une quantité positive :
				</p>
				<KatexBlock formula={String.raw`R(h)-R(h^*) \ge 0 \iff R(h^*) \le R(h).`} />
				<p>
					Ceci vaut pour tout <KatexInline formula={String.raw`h`} /> mesurable, d'où l'optimalité globale.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`h`} /> un classifieur mesurable quelconque. En partant de
				<KatexInline formula={String.raw`R(h) - R(h^*) = \mathbb{E}_X[r(h(X),X) - r(h^*(X),X)]`} />,
				justifiez chaque étape qui permet de conclure <KatexInline
					formula={String.raw`R(h^*) \le R(h)`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="1.12" title="Régions de décision pour un η(x) linéaire par morceaux">
			{#snippet solution()}
				<p>
					Sur <KatexInline formula={String.raw`[0,1]`} />, <KatexInline
						formula={String.raw`\eta(x) = 2x`}
					/> atteint
					<KatexInline formula={String.raw`1/2`} /> en <KatexInline formula={String.raw`x=1/4`} /> : pour
					<KatexInline formula={String.raw`x<1/4`} />, <KatexInline
						formula={String.raw`\eta(x)<1/2`}
					/>, action 0. Sur
					<KatexInline formula={String.raw`[1,2]`} />, <KatexInline
						formula={String.raw`\eta(x)=1`}
					/> partout (au-dessus du seuil), action 1. Donc <KatexInline
						formula={String.raw`h^*(x) = \mathbb{1}_{x \ge 1/4}`}
					/> sur tout le domaine <KatexInline formula={String.raw`[0,2]`} />. Le risque de Bayes,
					avec
					<KatexInline formula={String.raw`X\sim\mathrm{Unif}[0,2]`} /> :
				</p>
				<KatexBlock
					formula={String.raw`R^* = \frac12\int_0^1 \min(2x,1-2x)\,dx + \frac12\int_1^2 \min(1,0)\,dx = \frac12\int_0^{1/4} 2x\,dx = \frac{1}{32}.`}
				/>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`X\sim\mathrm{Unif}[0,2]`} /> avec
				<KatexInline formula={String.raw`\eta(x) = 2x`} /> pour <KatexInline
					formula={String.raw`x\in[0,1]`}
				/> et
				<KatexInline formula={String.raw`\eta(x)=1`} /> pour <KatexInline
					formula={String.raw`x\in(1,2]`}
				/>. Déterminez la région de décision de <KatexInline formula={String.raw`h^*`} />, puis
				calculez <KatexInline formula={String.raw`R^*`} />.
			</p>
		</ExercisePanel>

		<h2 id="regression-moyenne-mediane">Régression : moyenne et médiane conditionnelles</h2>

		<p>
			Cette section propose dix exercices sur les prédicteurs optimaux en régression : calculs
			numériques de moyenne et médiane conditionnelles, vérification de la décomposition
			biais-variance, non-unicité de la médiane, et comparaison de la robustesse entre L1 et L2.
		</p>

		<ExercisePanel number="2.1" title="Calcul de la moyenne conditionnelle">
			{#snippet solution()}
				<KatexBlock
					formula={String.raw`\mathbb{E}[Y\mid X=x] = 2(0.2) + 5(0.5) + 9(0.3) = 0.4+2.5+2.7 = 5.6.`}
				/>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Y\mid X=x`} /> prenant les valeurs
				<KatexInline formula={String.raw`\{2,5,9\}`} /> avec probabilités
				<KatexInline formula={String.raw`\{0.2,0.5,0.3\}`} />. Calculez <KatexInline
					formula={mDef}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.2" title="Calcul de la médiane conditionnelle et comparaison">
			{#snippet solution()}
				<p>
					La fonction de répartition cumulée vaut <KatexInline formula={String.raw`0.2`} /> en
					<KatexInline formula={String.raw`y=2`} />, puis <KatexInline formula={String.raw`0.7`} /> en
					<KatexInline formula={String.raw`y=5`} /> (qui dépasse <KatexInline
						formula={String.raw`1/2`}
					/> pour la première fois). La médiane est donc <KatexInline formula={String.raw`5`} />,
					différente de la moyenne <KatexInline formula={String.raw`5.6`} /> calculée à l'exercice précédent
					— la distribution n'est pas symétrique, donc les deux notions de « centre » divergent.
				</p>
			{/snippet}
			<p>
				Pour la même distribution qu'à l'exercice précédent, calculez <KatexInline
					formula={medDef}
				/>. Coïncide-t-elle avec la moyenne ? Pourquoi ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.3" title="Non-unicité de la médiane conditionnelle">
			{#snippet solution()}
				<p>
					Pour <KatexInline formula={String.raw`c\in[1,3]`} /> :
				</p>
				<KatexBlock formula={String.raw`g(c) = 0.5|1-c| + 0.5|3-c| = 0.5(c-1) + 0.5(3-c) = 1.`} />
				<p>
					La fonction <KatexInline formula={String.raw`g`} /> est donc <strong>constante</strong>
					sur tout l'intervalle <KatexInline formula={String.raw`[1,3]`} /> : n'importe quel <KatexInline
						formula={String.raw`c\in[1,3]`}
					/> minimise le risque L1, pas seulement un point isolé. La médiane conditionnelle n'est ici
					<strong>pas unique</strong>
					— c'est exactement la situation évoquée dans la preuve du Théorème 1.2 : quand la fonction de
					répartition a un palier à hauteur <KatexInline formula={String.raw`1/2`} />, tout point de
					ce palier est un minimiseur valide.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Y\mid X=x`} /> prenant les valeurs <KatexInline
					formula={String.raw`\{1,3\}`}
				/> chacune avec probabilité <KatexInline formula={String.raw`0.5`} />. Calculez <KatexInline
					formula={String.raw`g(c)=\mathbb{E}[|Y-c|\mid X=x]`}
				/> pour <KatexInline formula={String.raw`c\in[1,3]`} />, et montrez que la médiane
				conditionnelle n'est pas unique.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.4" title="Vérification numérique de la décomposition biais-variance">
			{#snippet solution()}
				<p>
					Avec <KatexInline formula={String.raw`m(x)=5.6`} /> (Exercice 2.1) et <KatexInline
						formula={String.raw`c=4`}
					/>
					:
				</p>
				<p>Calcul direct :</p>
				<KatexBlock
					formula={String.raw`\mathbb{E}[(Y-4)^2\mid x] = 0.2(2-4)^2+0.5(5-4)^2+0.3(9-4)^2 = 0.8+0.5+7.5 = 8.8.`}
				/>
				<p>Via la décomposition :</p>
				<KatexBlock
					formula={String.raw`\mathbb{E}[(Y-m(x))^2\mid x] = 0.2(2-5.6)^2+0.5(5-5.6)^2+0.3(9-5.6)^2 = 2.592+0.18+3.468 = 6.24,`}
				/>
				<KatexBlock formula={String.raw`(m(x)-c)^2 = (5.6-4)^2 = 2.56.`} />
				<p>
					Somme : <KatexInline formula={String.raw`6.24+2.56=8.8`} />, identique au calcul direct —
					la décomposition est vérifiée.
				</p>
			{/snippet}
			<p>
				Pour la distribution de l'Exercice 2.1, vérifiez numériquement que
				<KatexInline
					formula={String.raw`\mathbb{E}[(Y-c)^2\mid x] = \mathbb{E}[(Y-m(x))^2\mid x] + (m(x)-c)^2`}
				/>
				pour <KatexInline formula={String.raw`c=4`} />, en calculant les deux membres séparément.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.5" title="Retrouver la moyenne par annulation de la dérivée">
			{#snippet solution()}
				<p>
					On pose <KatexInline formula={String.raw`g(c) = \sum_i p_i(y_i-c)^2`} />. Alors
					<KatexInline formula={String.raw`g'(c) = -2\sum_i p_i(y_i-c)`} />, et
					<KatexInline formula={String.raw`g'(c)=0`} /> donne :
				</p>
				<KatexBlock
					formula={String.raw`\sum_i p_i y_i = c\sum_i p_i = c \implies c = \sum_i p_i y_i = \mathbb{E}[Y\mid x] = 5.6,`}
				/>
				<p>ce qui redonne exactement la moyenne calculée à l'Exercice 2.1.</p>
			{/snippet}
			<p>
				Pour la distribution de l'Exercice 2.1, posez <KatexInline
					formula={String.raw`g(c)=\mathbb{E}[(Y-c)^2\mid x]`}
				/>, calculez <KatexInline formula={String.raw`g'(c)`} /> directement (sans passer par la décomposition
				biais-variance), et retrouvez que le minimiseur est la moyenne conditionnelle.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.6" title="Robustesse : moyenne vs médiane face à un outlier">
			{#snippet solution()}
				<p>
					Moyenne : <KatexInline
						formula={String.raw`\mathbb{E}[Y\mid x] = 1(0.3)+2(0.3)+3(0.3)+100(0.1) = 0.3+0.6+0.9+10 = 11.8.`}
					/>
				</p>
				<p>
					Médiane : cumulative <KatexInline formula={String.raw`0.3`} /> en <KatexInline
						formula={String.raw`1`}
					/>,
					<KatexInline formula={String.raw`0.6`} /> en <KatexInline formula={String.raw`2`} /> (dépasse
					<KatexInline formula={String.raw`1/2`} />), donc <KatexInline
						formula={String.raw`\mathrm{Med}(Y\mid x) = 2`}
					/>.
				</p>
				<p>
					La moyenne (<KatexInline formula={String.raw`11.8`} />) est complètement déplacée par la
					valeur extrême <KatexInline formula={String.raw`100`} />, malgré sa faible probabilité (<KatexInline
						formula={String.raw`0.1`}
					/>), alors que la médiane (<KatexInline formula={String.raw`2`} />) reste au cœur de la
					masse de probabilité — c'est précisément la robustesse évoquée dans la Leçon 2.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Y\mid X=x`} /> prenant les valeurs
				<KatexInline formula={String.raw`\{1,2,3,100\}`} /> avec probabilités
				<KatexInline formula={String.raw`\{0.3,0.3,0.3,0.1\}`} />. Calculez la moyenne et la médiane
				conditionnelles, et commentez l'écart entre les deux.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.7" title="Convexité de g via ses pentes">
			{#snippet solution()}
				<p>
					Pour une distribution discrète, <KatexInline
						formula={String.raw`g(c)=\sum_i p_i|y_i-c|`}
					/> est affine par morceaux entre deux valeurs consécutives <KatexInline
						formula={String.raw`y_i`}
					/>
					. La pente sur chaque morceau est <KatexInline
						formula={String.raw`\sum_{y_i<c} p_i - \sum_{y_i>c} p_i`}
					/>, qui est <strong>croissante</strong> en <KatexInline formula={String.raw`c`} /> (chaque fois
					qu'on dépasse un <KatexInline formula={String.raw`y_i`} />, un terme change de signe,
					augmentant la pente de <KatexInline formula={String.raw`2p_i`} />). Une fonction affine
					par morceaux dont les pentes sont croissantes est convexe — c'est la version discrète de
					<KatexInline formula={String.raw`g''(c)=2f_{Y|x}(c)\ge0`} /> vue dans la démonstration continue.
				</p>
			{/snippet}
			<p>
				Pour une distribution discrète quelconque, montrez que la pente de
				<KatexInline formula={gDef} /> est croissante en <KatexInline formula={String.raw`c`} />, et
				expliquez pourquoi cela implique que <KatexInline formula={String.raw`g`} /> est convexe.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.8" title="Distribution symétrique : moyenne = médiane">
			{#snippet solution()}
				<p>
					Pour <KatexInline formula={String.raw`Y\mid X=x \sim \mathrm{Unif}[a,b]`} />, la moyenne
					est
					<KatexInline formula={String.raw`(a+b)/2`} /> par symétrie. La médiane vérifie
					<KatexInline formula={String.raw`F(c)=1/2`} />, et par la fonction de répartition uniforme
					<KatexInline formula={String.raw`F(c) = (c-a)/(b-a)`} />, donc <KatexInline
						formula={String.raw`c=(a+b)/2`}
					/> également. Les deux prédicteurs coïncident exactement dès que la distribution conditionnelle
					est symétrique — la différence entre L1 et L2 ne se manifeste que pour des distributions asymétriques
					ou à queue lourde (cf. Exercice 2.6).
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`Y\mid X=x \sim \mathrm{Unif}[a,b]`} />. Montrez que la
				moyenne et la médiane conditionnelles coïncident, et expliquez pourquoi ce n'était pas le
				cas dans les Exercices 2.1–2.2.
			</p>
		</ExercisePanel>

		<ExercisePanel number="2.9" title="Vrai ou faux">
			<p>Indiquez si chaque affirmation est vraie ou fausse, en justifiant brièvement.</p>
			<ol>
				<li>Le prédicteur optimal pour L2 est toujours différent du prédicteur optimal pour L1.</li>
				<li>La médiane conditionnelle peut ne pas être unique.</li>
				<li>
					Dans la décomposition biais-variance ponctuelle, le terme
					<KatexInline formula={String.raw`\mathbb{E}[(Y-m(x))^2\mid x]`} /> dépend du choix du prédicteur
					<KatexInline formula={String.raw`c`} />.
				</li>
				<li>La moyenne conditionnelle minimise toujours le risque L1.</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<strong>Faux.</strong> Ils coïncident dès que la distribution conditionnelle est symétrique
						(Exercice 2.8).
					</li>
					<li>
						<strong>Vrai.</strong> Voir l'Exercice 2.3 — un palier de la fonction de répartition à
						hauteur <KatexInline formula={String.raw`1/2`} /> rend tout un intervalle minimiseur.
					</li>
					<li>
						<strong>Faux.</strong> C'est tout l'intérêt de la décomposition : ce terme ne dépend que
						de la distribution de <KatexInline formula={String.raw`Y\mid x`} />, pas de <KatexInline
							formula={String.raw`c`}
						/> — seul le second terme, <KatexInline formula={String.raw`(m(x)-c)^2`} />, en dépend.
					</li>
					<li>
						<strong>Faux.</strong> La moyenne minimise le risque <strong>L2</strong>. C'est la
						médiane qui minimise le risque L1 (Théorème 1.2).
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2.10" title="Compléter la démonstration pour la perte L1">
			{#snippet solution()}
				<p>
					En supposant une densité conditionnelle <KatexInline formula={String.raw`f_{Y|x}`} />, on
					dérive
					<KatexInline formula={String.raw`g(c)=\mathbb{E}[|Y-c|\mid x]`} /> sous le signe intégrale :
				</p>
				<KatexBlock formula={String.raw`g'(c) = F_{Y|x}(c) - (1-F_{Y|x}(c)) = 2F_{Y|x}(c)-1.`} />
				<p>
					La condition <KatexInline formula={String.raw`g'(c)=0`} /> équivaut à
					<KatexInline formula={String.raw`F_{Y|x}(c)=1/2`} />, c'est-à-dire <KatexInline
						formula={String.raw`c=\mathrm{Med}(Y\mid x)`}
					/> par définition de la médiane. Pour vérifier qu'il s'agit bien d'un minimum
					<em>global</em> et non simplement local, on calcule la dérivée seconde :
					<KatexInline formula={String.raw`g''(c) = 2f_{Y|x}(c) \ge 0`} />, qui est toujours
					positive ou nulle (une densité est positive) — <KatexInline formula={String.raw`g`} /> est donc
					convexe, et tout point critique d'une fonction convexe est un minimiseur global.
				</p>
			{/snippet}
			<p>
				En partant de <KatexInline formula={String.raw`g'(c) = 2F_{Y|x}(c) - 1`} />, complétez la
				démonstration du Théorème 1.2 pour la perte L1 : trouvez la condition d'optimalité, puis
				justifiez qu'il s'agit d'un minimum global et non seulement local.
			</p>
		</ExercisePanel>

		<h2 id="synthese-classification-regression">Synthèse classification / régression</h2>

		<p>
			Ces trois derniers exercices prennent du recul sur les deux leçons de cette partie, pour en
			dégager le principe commun.
		</p>

		<ExercisePanel number="3.1" title="Le principe commun : minimisation ponctuelle">
			{#snippet solution()}
				<p>
					Dans les deux cas, on part de <KatexInline
						formula={String.raw`R(h) = \mathbb{E}_X[\text{risque conditionnel}(h(x), x)]`}
					/> par la loi des espérances totales, ce qui permet de minimiser
					<strong>point par point</strong> en <KatexInline formula={String.raw`x`} /> plutôt que globalement.
					Ce qui varie d'un cas à l'autre, c'est uniquement la <em>forme</em> du risque conditionnel
					— <KatexInline formula={String.raw`r(a,x)`} /> pour la perte 0-1,
					<KatexInline formula={String.raw`\mathbb{E}[(Y-c)^2\mid x]`} /> pour L2,
					<KatexInline formula={gDef} /> pour L1 — et donc la nature de la quantité qui la minimise (seuil
					sur <KatexInline formula={String.raw`\eta(x)`} />, moyenne, médiane). Le
					<em>schéma de preuve</em> est, lui, identique dans les trois cas.
				</p>
			{/snippet}
			<p>
				Énoncez, en une ou deux phrases, le principe structurel commun aux démonstrations du
				Théorème 1.1 (classification) et du Théorème 1.2 (régression). Qu'est-ce qui varie d'un
				résultat à l'autre, et qu'est-ce qui reste identique ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.2" title="Vers une théorie générale des pertes">
			{#snippet solution()}
				<p>
					Chaque perte induit sa propre notion de « centre » optimal de la distribution
					conditionnelle de <KatexInline formula={String.raw`Y`} /> : un seuil sur <KatexInline
						formula={String.raw`\eta(x)`}
					/> pour la perte 0-1, la moyenne pour L2, la médiane pour L1. On peut anticiper que
					<em>toute</em> perte convexe <KatexInline formula={String.raw`\ell(y,c)`} /> définit de même
					un prédicteur ponctuel optimal, une sorte de « quantile généralisé » associé à la perte choisie.
					C'est précisément la question qu'aborde la Partie IX de ce cours (fonctions de perte calibrées)
					: quelles pertes de substitution à la perte 0-1 préservent malgré tout l'optimalité du classifieur
					de Bayes ?
				</p>
			{/snippet}
			<p>
				Sans chercher à démontrer quoi que ce soit de nouveau : en généralisant l'intuition des
				Théorèmes 1.1 et 1.2, que pensez-vous qu'il se passerait pour une perte
				<KatexInline formula={String.raw`\ell(y,c)`} /> convexe quelconque, autre que 0-1, L1 ou L2 ?
				Quel type de résultat anticipez-vous ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="3.3" title="Tableau de synthèse">
			<p>
				Complétez le tableau suivant en indiquant, pour chaque perte, le prédicteur optimal et une
				hypothèse nécessaire à sa bonne définition.
			</p>
			<table>
				<thead>
					<tr>
						<th>Perte</th>
						<th>Prédicteur optimal</th>
						<th>Hypothèse requise</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>0-1 (classification)</td>
						<td>?</td>
						<td>?</td>
					</tr>
					<tr>
						<td>L2 (régression)</td>
						<td>?</td>
						<td>?</td>
					</tr>
					<tr>
						<td>L1 (régression)</td>
						<td>?</td>
						<td>?</td>
					</tr>
				</tbody>
			</table>
			{#snippet solution()}
				<table>
					<thead>
						<tr>
							<th>Perte</th>
							<th>Prédicteur optimal</th>
							<th>Hypothèse requise</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>0-1 (classification)</td>
							<td>
								<KatexInline formula={bayesClassifierCases} />
							</td>
							<td
								>Aucune (toujours bien défini, à un choix de convention près en <KatexInline
									formula={String.raw`\eta=1/2`}
								/>)</td
							>
						</tr>
						<tr>
							<td>L2 (régression)</td>
							<td><KatexInline formula={mDef} /></td>
							<td>
								<KatexInline formula={String.raw`\mathbb{E}[|Y|]<\infty`} /> (existence de la moyenne)
							</td>
						</tr>
						<tr>
							<td>L1 (régression)</td>
							<td><KatexInline formula={medDef} /></td>
							<td>
								Toujours bien définie, mais potentiellement <strong>non unique</strong> (Exercice 2.3)
							</td>
						</tr>
					</tbody>
				</table>
			{/snippet}
		</ExercisePanel>

		<h2 id="expert-classification-regression">Pourquoi la classification est plus facile que la régression</h2>

		<Callout type="note" title="Au-delà du cours">
			<p>
				Cette section n'est pas au programme du cours et ne figure pas dans le support :
				elle reconstruit un résultat standard de la littérature, dû à Devroye, Györfi et
				Lugosi (1996), <em>A Probabilistic Theory of Pattern Recognition</em> (§6.7). Il
				s'agit d'un exercice optionnel de niveau expert.
			</p>
		</Callout>

		<p>
			Cette série d'exercices reconstruit progressivement un
			<strong>résultat de Devroye, Györfi et Lugosi (1996)</strong>, <em>A
			Probabilistic Theory of Pattern Recognition</em>, section 6.7. L'idée
			fondamentale est surprenante : pour classer, il n'est pas nécessaire
			d'estimer précisément toute la fonction
			<KatexInline formula={String.raw`\eta(x)`} />. Il suffit de savoir de quel côté de
			<KatexInline formula={String.raw`1/2`} /> elle se trouve.
		</p>

		<InteractiveSection title="Classifier est plus facile que régresser" onInteract={tracker.trackInteraction}>
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

		<ExercisePanel number="8" title="Conclusion : la classification est plus facile que la régression">
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
					<strong>strictement plus vite</strong> que l'erreur quadratique de l'estimation
					de la probabilité a posteriori, à savoir
					<KatexInline
						formula={String.raw`\sqrt{\mathbb{E}[(\eta_n(X)-\eta(X))^2]}`}
					/> :
				</p>

				<KatexBlock
					formula={String.raw`L_n-L^*
				=o\!\left(
					\sqrt{\mathbb{E}[(\eta_n(X)-\eta(X))^2]}
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
