<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KNNConsistencyDemo from '$lib/components/demos/KNNConsistencyDemo.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';

	const meta = getPageByPath('/part5/lesson2');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	interface TocEntry {
		id: string;
		label: string;
		description?: string;
		color: 'epistemic' | 'positive' | 'neutral' | 'belief' | 'surprise' | 'agent';
	}

	const tocEntries: TocEntry[] = [
		{
			id: 'introduction',
			label: 'Introduction',
			description: 'Une exigence plus forte : converger quelle que soit la distribution',
			color: 'epistemic'
		},
		{
			id: 'consistance-universelle',
			label: 'Consistance universelle',
			description: 'Définition 1.3 — consistant pour toute distribution, sans hypothèse sur η',
			color: 'neutral'
		},
		{
			id: 'theoreme-stone',
			label: 'Le théorème de Stone',
			description: 'Théorème 2.1 — k-NN est universellement consistant si k(n)→∞ et k(n)/n→0',
			color: 'belief'
		},
		{
			id: 'pourquoi-k-fixe-echoue',
			label: 'Pourquoi k fixe ne suffit pas',
			description: "L'exemple du 1-NN",
			color: 'surprise'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const universalConsistDef = 'P_{X,Y} \\text{ sur } \\mathcal{X}\\times\\{0,1\\}';

	const stoneSetup =
		'(X_i,Y_i)_{i=1}^n \\text{ i.i.d. de loi } P_{X,Y} \\text{ sur } \\mathbb{R}^d\\times\\{0,1\\}';
	const stoneConditions =
		'k(n) \\xrightarrow[n\\to+\\infty]{} +\\infty \\quad\\text{et}\\quad \\frac{k(n)}{n} \\xrightarrow[n\\to+\\infty]{} 0';
	const stoneConclusion =
		'\\forall P_{X,Y}, \\quad \\mathbb{E}\\big[R(h_n^{k\\text{-NN}})\\big] \\xrightarrow[n\\to+\\infty]{} R^*';

	const coverHartIdentity = String.raw`\limsup_{n\to+\infty} \mathbb{E}\big[R(h_n^{1\text{-NN}})\big] \;=\; 2\mathbb{E}\big[\eta(X)(1-\eta(X))\big]`;
	const coverHartBound = String.raw`R^* \;\le\; \limsup_{n\to+\infty} \mathbb{E}\big[R(h_n^{1\text{-NN}})\big] \;\le\; 2R^*\left(1-\tfrac{R^*}{2}\right) \;<\; 2R^*`;
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Consistance universelle et k-NN'}
	subtitle="Un algorithme peut-il converger vers le risque de Bayes sans rien supposer sur la distribution ?"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Introduction</h2>

		<p>
			La leçon précédente a montré que la consistance dépend d'un compromis entre le terme
			d'approximation (fixé par le choix de la classe <KatexInline
				formula={String.raw`\mathcal{H}`}
			/>) et le terme d'estimation (qui décroît avec <KatexInline formula={String.raw`n`} />). Mais
			cette analyse supposait implicitement une classe <KatexInline
				formula={String.raw`\mathcal{H}`}
			/> fixée à l'avance. Une question plus ambitieuse se pose : existe-t-il des algorithmes qui convergent
			vers
			<KatexInline formula={String.raw`R^*`} />
			<strong>quelle que soit</strong> la distribution <KatexInline
				formula={String.raw`P_{(X, Y)}`}
			/>, sans jamais fixer de classe restrictive au préalable ? C'est la question de la
			<strong>consistance universelle</strong>, et sa réponse — positive — est l'un des résultats
			les plus marquants de la théorie de l'apprentissage non paramétrique.
		</p>

		<h2 id="consistance-universelle">Consistance universelle</h2>

		<DefinitionBlock number="1.3" title="Consistance universelle">
			<p>
				Un algorithme est dit <strong>universellement consistant</strong> si <KatexInline
					formula={String.raw`(h_n)`}
				/> est consistant pour <strong>toute</strong> distribution <KatexInline
					formula={universalConsistDef}
				/>, sans hypothèse sur <KatexInline formula={String.raw`\eta(x)`} />.
			</p>
		</DefinitionBlock>

		<p>
			C'est une propriété bien plus forte que la consistance simple vue à la leçon précédente : elle
			garantit que l'algorithme converge vers le risque de Bayes quelle que soit la structure du
			problème — qu'il soit séparable, très bruité, en haute dimension, avec des frontières de
			décision arbitrairement complexes. Aucune hypothèse de régularité sur <KatexInline
				formula={String.raw`\eta`}
			/> n'est nécessaire.
		</p>

		<Callout type="insight" title="Pourquoi ce n'est pas évident">
			Rien ne garantit a priori qu'un tel algorithme existe. Un algorithme qui suppose, par exemple,
			que la frontière de décision est linéaire (comme dans un modèle paramétrique) ne peut être
			universellement consistant : dès que la vraie frontière est non linéaire, son terme
			d'approximation reste strictement positif, quel que soit <KatexInline
				formula={String.raw`n`}
			/>. Il faut donc une classe de modèles dont la richesse s'adapte elle-même à <KatexInline
				formula={String.raw`n`}
			/> — c'est exactement l'idée derrière le <KatexInline formula={String.raw`k`} />-NN avec
			<KatexInline formula={String.raw`k=k(n)`} /> variable.
		</Callout>

		<h2 id="theoreme-stone">Le théorème de Stone</h2>

		<TheoremBlock number="2.1" title="Consistance universelle de Stone (1977)">
			<p>
				Soit <KatexInline formula={stoneSetup} />. Si le paramètre <KatexInline
					formula={String.raw`k=k(n)`}
				/> vérifie :
			</p>
			<KatexBlock formula={stoneConditions} />
			<p>
				alors le classifieur <KatexInline formula={String.raw`k`} />-NN est universellement
				consistant :
			</p>
			<KatexBlock formula={stoneConclusion} />
		</TheoremBlock>

		<p>
			Le résultat est remarquable par sa simplicité : deux conditions purement quantitatives sur la
			suite <KatexInline formula={String.raw`k(n)`} />, sans aucune hypothèse sur la distribution
			elle-même, suffisent à garantir la convergence vers le risque de Bayes — dans
			<strong>n'importe quel</strong>
			problème de classification binaire sur <KatexInline formula={String.raw`\mathbb{R}^d`} />.
		</p>

		<Callout type="intuition" title="Lecture biais-variance des deux conditions">
			Les deux conditions du théorème jouent des rôles complémentaires, exactement comme dans la
			décomposition approximation/estimation de la leçon précédente :
			<ul>
				<li>
					<KatexInline formula={String.raw`k(n) \to +\infty`} /> réduit la <strong>variance</strong>
					de l'estimation locale de <KatexInline formula={String.raw`\eta(x)`} /> — en moyennant sur davantage
					de voisins, la loi des grands nombres lisse le bruit d'échantillonnage.
				</li>
				<li>
					<KatexInline formula={String.raw`k(n)/n \to 0`} /> réduit le <strong>biais</strong> — cela
					garantit que les <KatexInline formula={String.raw`k(n)`} /> voisins utilisés restent de plus
					en plus proches de <KatexInline formula={String.raw`x`} /> à mesure que <KatexInline
						formula={String.raw`n`}
					/> grandit, donc que la moyenne locale capture bien la valeur de <KatexInline
						formula={String.raw`\eta`}
					/> en
					<KatexInline formula={String.raw`x`} /> et non une moyenne diluée sur un voisinage trop large.
				</li>
			</ul>
			Prendre <KatexInline formula={String.raw`k`} /> trop petit laisse trop de variance ; prendre
			<KatexInline formula={String.raw`k`} /> trop grand (relativement à <KatexInline
				formula={String.raw`n`}
			/>) introduit du biais en moyennant sur des voisins trop éloignés. C'est exactement la même
			tension biais-variance qu'ailleurs dans ce cours, ici exprimée à travers un seul paramètre
			<KatexInline formula={String.raw`k`} />.
		</Callout>

		<InteractiveSection
			number="2.1"
			title="Voisinage, frontière et compromis biais-variance"
			onInteract={tracker.trackInteraction}
		>
			<KNNConsistencyDemo />
		</InteractiveSection>

		<h2 id="pourquoi-k-fixe-echoue">Pourquoi k fixe ne suffit pas</h2>

		<p>
			Les deux conditions du Théorème 2.1 sont-elles vraiment nécessaires, ou une suite plus simple
			— par exemple <KatexInline formula={String.raw`k(n)=k`} /> constant — suffirait-elle ? La réponse
			est non.
		</p>

		<Callout type="insight" title="Erreur du 1-NN">
			<p>
				Cette borne n'apparaît pas dans le support du cours (l'Exercice 2.1 du support se limite
				à un indice) : elle est due à Cover et Hart (1967) et est donnée ici comme complément,
				au-delà du cours. Pour le classifieur du plus proche voisin (<KatexInline
					formula={String.raw`1`}
				/>-NN, <KatexInline formula={String.raw`k=1`} /> fixé), en supposant <KatexInline
					formula={String.raw`\mathbb{P}_X`}
				/> à densité (cela garantit que plus n est grand, plus le plus proche voisin est
				effectivement proche), le risque asymptotique dépend de <KatexInline
					formula={String.raw`R^*`}
				/> et est donné par :
			</p>
			<KatexBlock formula={coverHartIdentity} />
			<p>
				Plus utilement, il est borné en fonction de <KatexInline formula={String.raw`R^*`} /> seul —
				pour <KatexInline formula={String.raw`0<R^*<1`} /> :
			</p>
			<KatexBlock formula={coverHartBound} />
			<p>
				La borne supérieure est strictement supérieure à <KatexInline
					formula={String.raw`R^*`}
				/> pour tout <KatexInline formula={String.raw`R^*\in(0,1)`} /> : l'écart
				<KatexInline formula={String.raw`2R^*\left(1-\tfrac{R^*}{2}\right)-R^* = R^*(1-R^*)`} /> est
				strictement positif, et ne s'annule que pour <KatexInline
					formula={String.raw`R^*\in\{0,1\}`}
				/>. La borne ne garantit donc pas la convergence vers <KatexInline
					formula={String.raw`R^*`}
				/> : il existe des distributions pour lesquelles le risque asymptotique du 1-NN reste
				strictement au-dessus du risque de Bayes — par exemple, si <KatexInline
					formula={String.raw`\eta(X)\in\{c,1-c\}`}
				/> presque sûrement avec <KatexInline formula={String.raw`c\in(0,1/2)`} />, alors
				<KatexInline formula={String.raw`R^*=c`} /> mais le risque asymptotique vaut
				<KatexInline formula={String.raw`2c(1-c)>c`} />. C'est pour cela que la condition
				<KatexInline formula={String.raw`k(n)\to+\infty`} /> du Théorème 2.1 est nécessaire, et pas
				seulement une commodité technique de la démonstration.
			</p>
		</Callout>

		<ExercisePanel number="2.1" title="Calcul d'erreur">
			{#snippet solution()}
				<p>
					Avec <KatexInline formula={String.raw`R^*=0.1`} /> par exemple, la borne de Cover-Hart donne
					<KatexInline
						formula={String.raw`2R^*\left(1-\tfrac{R^*}{2}\right) = 2\times0.1\times0.95 = 0.19`}
					/>
					: le risque asymptotique du 1-NN est ainsi majoré par <KatexInline
						formula={String.raw`0.19`}
					/>, soit près du double du risque de Bayes. Plus généralement, la borne
					<KatexInline formula={coverHartBound} /> montre que la borne supérieure est strictement
					au-dessus de <KatexInline formula={String.raw`R^*`} /> dès que <KatexInline
						formula={String.raw`R^*\in(0,1)`}
					/> : il existe des distributions non séparables pour lesquelles un <KatexInline
						formula={String.raw`k`}
					/> fixé laisse un écart résiduel strictement positif, quel que soit <KatexInline
						formula={String.raw`n`}
					/>. C'est cette impossibilité générale — pas seulement l'exemple numérique — qui rend la
					condition <KatexInline formula={String.raw`k(n)\to+\infty`} /> du Théorème 2.1 nécessaire,
					et pas seulement une commodité technique de la démonstration.
				</p>
			{/snippet}
			<p>
				En utilisant le résultat énoncé ci-dessus, calculez la borne supérieure du risque
				asymptotique du 1-NN pour <KatexInline formula={String.raw`R^*=0.1`} />.
			</p>
		</ExercisePanel>

		<Callout type="summary" title="Retenir">
			La consistance universelle est une exigence bien plus forte que la simple consistance : elle
			doit tenir pour toute distribution, sans hypothèse sur <KatexInline
				formula={String.raw`\eta`}
			/>. Le théorème de Stone montre que le <KatexInline formula={String.raw`k`} />-NN l'atteint
			dès que
			<KatexInline formula={String.raw`k(n)\to+\infty`} /> (contrôle de la variance) et
			<KatexInline formula={String.raw`k(n)/n\to0`} /> (contrôle du biais) — deux conditions purement
			quantitatives sur une seule suite <KatexInline formula={String.raw`k(n)`} />. La borne de
			Cover-Hart montre que la première condition n'est pas une simple facilité de preuve : sans
			elle, il peut subsister un écart résiduel strictement positif au risque de Bayes, pour
			toujours. Ce résultat clôt la partie
			consacrée à la consistance ; la partie suivante s'attaque à une question complémentaire : non
			plus
			<em>si</em>
			un algorithme converge vers <KatexInline formula={String.raw`R^*`} />, mais
			<em>à quelle vitesse</em>, via les bornes de généralisation.
		</Callout>
	</TheorySection>
	<Bibliography>
		<BibElement
			authors={['Stone, C. J.']}
			year={1977}
			title="Consistent Nonparametric Regression"
			journal="The Annals of Statistics, Vol. 5, No. 4, pp. 595-620."
			link="https://projecteuclid.org/journals/annals-of-statistics/volume-5/issue-4/Consistent-Nonparametric-Regression/10.1214/aos/1176343886.full"
		/>
		<BibElement
			authors={['Cover, T. M.', 'Hart, P. E.']}
			year={1967}
			title="Nearest neighbor pattern classification"
			journal="IEEE Transactions on Information Theory, Vol. 13, No. 1, pp. 21-27."
			link="https://ieeexplore.ieee.org/document/1053964"
		/>
		<BibElement
			authors={['Devroye, L.', 'Györfi, L.', 'Lugosi, G.']}
			year={1996}
			title="A Probabilistic Theory of Pattern Recognition"
			journal="Springer."
			link="https://link.springer.com/book/10.1007/978-1-4612-0221-5"
		/>
	</Bibliography>
</PageTemplate>
