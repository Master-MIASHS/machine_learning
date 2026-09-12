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
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { TocEntry } from '$lib/components/narrative/TableOfContents.svelte';

	const meta = getPageByPath('/part4/lesson4');
	const tracker = createPageTracker(meta as PageMeta);
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Formules (course_sources/sophie/8.validation_du_modele_lineaire_2025.pdf) ──
	const partialCor = String.raw`\hat{\beta}_j \ \propto\ \mathrm{cor}\!\left(X_j,\ Y \,\middle|\, (X_k)_{k \neq j}\right)`;
	const covCor = String.raw`\mathrm{cov}(\hat{\beta}_i, \hat{\beta}_j) \ \propto\ -\,\mathrm{cor}\!\left(X_i, X_j \mid X_k,\ k \neq i, j\right)`;
	const kappa = String.raw`\kappa = \frac{\lambda_1}{\lambda_p}`;
	const vif = String.raw`\mathrm{VIF}_j = \frac{1}{1 - R_j^2}`;
	const varBeta = String.raw`\mathrm{Var}(\hat{\beta}_j) = \frac{\sigma^2}{\|x_j - \bar{x}_j\|^2}\ \cdot\ \frac{1}{1 - R_j^2}`;
	const resZero = String.raw`\hat{\varepsilon}^\top1_n = \hat{\varepsilon}^\top X\lambda = 0, \qquad \lambda = (1, 0, \dots, 0)`;
	const partialRes = String.raw`\hat{\varepsilon}^{\Delta_j}_i = \hat{\beta}_j\, x_{j,i} + \hat{\varepsilon}_i \ = \ y_i - \sum_{k \neq j} \hat{\beta}_k\, x_{k,i}`;
	const hiiBounds = String.raw`0 \le h_{ii} \le 1 \qquad \text{et} \qquad \sum_{i=1}^{n} h_{ii} = p + 1`;
	const hiiThr = String.raw`h_{ii} > \frac{2(p+1)}{n}`;
	const residStd = String.raw`r_i = \frac{\hat{\varepsilon}_i}{\hat{\sigma}\sqrt{1 - h_{ii}}}`;
	const residStud = String.raw`t_i = \frac{\hat{\varepsilon}_i}{\hat{\sigma}^{(-i)}\sqrt{1 - h_{ii}}} \sim \text{Student}(n-p-2)`;
	const cook = String.raw`D_i = \frac{h_{ii}\ \hat{\varepsilon}_i^2}{(p+1)(1-h_{ii})^2\,\hat{\sigma}^2} = \frac{h_{ii}\ r_i^2}{(p+1)(1-h_{ii})}`;
	const deletedRes = String.raw`\hat{\varepsilon}^{(-i)}_i = \frac{\hat{\varepsilon}_i}{1 - h_{ii}}`;

	const tocEntries: TocEntry[] = [
		{ id: 'rang', label: 'Rang de X et colinéarité', color: 'belief' },
		{ id: 'colin', label: 'Effets de la colinéarité et indicateurs', color: 'neutral' },
		{ id: 'residus', label: 'Graphes des résidus', color: 'positive' },
		{ id: 'partiels', label: 'Résidus partiels et Q-Q plot', color: 'surprise' },
		{ id: 'influence', label: 'Observations influentes', color: 'agent' },
		{ id: 'bref', label: 'En bref : le jeu de données propre', color: 'belief' }
	];
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Validation et diagnostic du modèle'}
	subtitle="Colinéarité, graphes de résidus, résidus partiels, leviers et distances de Cook"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="rang">Rang de X et colinéarité</h2>

		<Callout type="note" title="Rappel des trois hypothèses du modèle linéaire">
			<p>
				Le modèle <KatexInline formula={String.raw`Y = X\beta + \varepsilon`} />
				repose sur : (H1) <KatexInline formula={String.raw`\mathrm{rang}(X) = p+1`} /> ; (H2) les erreurs
				sont centrées, de même variance et non corrélées entre elles,
				<KatexInline
					formula={String.raw`\mathbb{E}(\varepsilon) = 0_n \ \text{et}\ \Sigma_\varepsilon = \sigma^2 I_n`}
				/> ; (H3) les erreurs sont gaussiennes,
				<KatexInline formula={String.raw`\varepsilon_i \sim \mathcal{N}(0, \sigma^2)`} />. Les
				caractéristiques <KatexInline formula="X" /> sont considérées comme
				<strong>fixes</strong> : données, et non variables aléatoires — elles sont aussi supposées exemptes
				d’erreur de mesure. C’est une hypothèse peu réaliste, mais sans elle il faudrait ajuster des modèles
				d’erreur de mesure bien plus complexes.
			</p>
		</Callout>

		<p>
			Toute l’estimation de la leçon 1 repose sur
			<KatexInline formula={String.raw`(X^\topX)^{-1}`} /> : il faut donc d’abord vérifier que
			cette inversion est licite. Géométriquement, la régression est la
			<strong>projection orthogonale</strong>
			de
			<KatexInline formula="Y" /> sur le sous-espace engendré par les colonnes de
			<KatexInline formula="X" />, de dimension
			<KatexInline formula={String.raw`p+1`} /> :
		</p>

		<KatexBlock formula={String.raw`\hat{Y} = X\hat{\beta} = HY`} />

		<DefinitionBlock number="4.1" title="Matrice chapeau (hat matrix) et plein rang">
			<p>
				La matrice
				<KatexInline formula={String.raw`H = X(X^\topX)^{-1}X^\top`} />, appelée
				<strong>matrice chapeau</strong>
				(hat matrix), est la projection orthogonale sur
				<KatexInline formula={String.raw`\mathrm{sev}(X)`} /> : elle est
				<strong>symétrique</strong> et <strong>idempotente</strong>
				<KatexInline formula={String.raw`H^2 = H`} />. Si les
				<KatexInline formula={String.raw`p+1`} /> colonnes de
				<KatexInline formula="X" /> n’engendrent pas un sous-espace de dimension
				<KatexInline formula={String.raw`p+1`} /> (colinéarité), alors
				<KatexInline formula={String.raw`X^\topX`} /> n’est pas inversible et l’équation
				<KatexInline formula={String.raw`X^\topY = X^\topX\,\beta`} />
				n’a <strong>pas de solution unique</strong>.
			</p>
			<p>
				Condition nécessaire : <KatexInline formula={String.raw`n > p+1`} />. Quand
				<KatexInline formula={String.raw`n > p+1`} />,
				<KatexInline formula="X" /> est très souvent de plein rang — une colinéarité
				<em>parfaite</em>
				est rare. En pratique, on vérifie le rang avec
				<code>qr(x)$rank</code> en R, puis on étudie la
				<strong>matrice des corrélations 2 à 2</strong> des prédicteurs pour repérer les colinéarités
				imparfaites.
			</p>
		</DefinitionBlock>

		<h2 id="colin">Effets de la colinéarité et indicateurs</h2>

		<p>
			Des prédicteurs corrélés entre eux partagent une information commune : le modèle « ne sait pas
			» à qui l’attribuer.
		</p>

		<TheoremBlock number="4.2" title="Effets de la colinéarité entre prédicteurs">
			<p>
				Dans le modèle <KatexInline formula={String.raw`Y = X\beta + \varepsilon`} />
				:
			</p>
			<ul>
				<li>
					l’estimateur de
					<KatexInline formula={String.raw`\beta_j`} /> est proportionnel à la corrélation
					<strong>partielle</strong>
					entre
					<KatexInline formula={String.raw`X_j`} /> et
					<KatexInline formula="Y" /> sachant les autres :
					<KatexBlock formula={partialCor} />
					c’est l’« effet » de
					<KatexInline formula={String.raw`X_j`} /> sur
					<KatexInline formula="Y" /> une fois retiré l’effet des autres caractéristiques ;
				</li>
				<li>
					et les estimateurs de deux variables corrélées ont une covariance négative :
					<KatexBlock formula={covCor} />
					les variables fortement corrélées se <strong>partagent l’importance</strong> dans le modèle.
				</li>
			</ul>
			<p>
				Conséquences : à l’extrême, avec une variable dupliquée
				<KatexInline
					formula={String.raw`Y = \beta_0 + \beta_1 X + \beta_2 X + \varepsilon = \beta_0 + (\beta_1 + \beta_2) X + \varepsilon`}
				/>, les coefficients <KatexInline formula={String.raw`\beta_1, \beta_2`} /> ne sont
				<strong>pas identifiables</strong>
				(infinité de solutions) ; dans le cas général, les coefficients sont mal estimés, peuvent
				avoir des
				<strong>signes opposés</strong>, et certains passent sous le seuil de significativité.
				Numériquement,
				<KatexInline formula={String.raw`X^\topX`} /> est mal conditionnée : difficulté de convergence
				et manque de précision.
			</p>
		</TheoremBlock>

		<Callout type="note" title="Rappel : la corrélation partielle">
			<p>
				La corrélation partielle entre deux variables
				<KatexInline formula={String.raw`X_1`} /> et
				<KatexInline formula={String.raw`X_2`} /> sachant un groupe de variables
				<KatexInline formula="Z" /> mesure la corrélation qui reste entre elles une fois « retirée » la
				partie explicable par
				<KatexInline formula="Z" /> : on régresse
				<KatexInline formula={String.raw`X_1`} /> et
				<KatexInline formula={String.raw`X_2`} /> sur
				<KatexInline formula="Z" />, et la corrélation partielle est la corrélation des deux
				vecteurs de résidus obtenus,
				<KatexInline
					formula={String.raw`\mathrm{cor}(X_1, X_2 \mid Z) = \mathrm{cor}(\hat{\varepsilon}_{X_1 \mid Z},\, \hat{\varepsilon}_{X_2 \mid Z})`}
				/>.
			</p>
		</Callout>

		<p>
			Les solutions : calculer le VIF de chaque variable, recourir à l’ACP pour identifier les
			liens, <strong>analyse spectrale</strong> de la matrice des corrélations 2 à 2 (étudier les
			vecteurs propres associés aux plus petites valeurs propres), écart ou regroupement des
			prédicteurs posant problème (<em>un à un</em>), régression sur composantes principales (ACP)
			ou régression
			<strong>Partiel Least Square (PLS)</strong>, sélection de variables, ou régularisation — voir
			la <a href="/part5/lesson4">partie V</a>. Mais avant d’agir, on quantifie le problème avec
			deux indicateurs.
		</p>

		<DefinitionBlock number="4.3" title="Indice de conditionnement κ">
			<p>
				Soit <KatexInline formula="R" /> la matrice des corrélations empiriques des
				<KatexInline formula={String.raw`p`} /> variables explicatives, symétrique positive de rang
				<KatexInline formula={String.raw`\le p`} />
				(<KatexInline formula={String.raw`< p`} /> s’il y a colinéarité), et
				<KatexInline formula={String.raw`\lambda_1 \ge \dots \ge \lambda_p`} />
				ses valeurs propres. S’il existe une relation linéaire parfaite entre un ensemble de variables,
				une des valeurs propres vaut
				<KatexInline formula="0" />. On définit l’indice de conditionnement
			</p>
			<KatexBlock formula={kappa} />
			<p>
				<strong>Règle courante :</strong>
				<KatexInline formula={String.raw`\kappa > 500`} /> signifie une colinéarité trop forte.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="4.4" title="Facteur d’inflation de la variance (VIF)">
			<p>
				Soit <KatexInline formula={String.raw`R_j^2`} /> le coefficient de détermination de la régression
				de
				<KatexInline formula={String.raw`X_j`} /> sur les
				<KatexInline formula={String.raw`p-1`} /> autres régresseurs : proche de
				<KatexInline formula="0" /> si
				<KatexInline formula={String.raw`X_j`} /> n’est pas une fonction linéaire des autres, proche de
				<KatexInline formula="1" /> en cas de multi-colinéarité. Le VIF vaut
			</p>
			<KatexBlock formula={vif} />
			<p>
				<KatexInline formula={String.raw`\mathrm{VIF}_j`} /> est exactement le facteur par lequel la variance
				de
				<KatexInline formula={String.raw`\hat{\beta}_j`} /> est gonflée par rapport à ce qu’elle serait
				sans colinéarité :
			</p>
			<KatexBlock formula={varBeta} />
			<p>
				<strong>Règle courante :</strong> forte colinéarité dès
				<KatexInline formula={String.raw`\mathrm{VIF}_j > 10`} /> (c’est-à-dire
				<KatexInline formula={String.raw`R_j^2 > 0{,}9`} />).
			</p>
		</DefinitionBlock>

		<InteractiveSection
			number="4.5"
			title="Colinéarité, conditionnement, VIF"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmCollinearity.svelte')} />
		</InteractiveSection>

		<h2 id="residus">Graphes des résidus</h2>

		<p>
			La vérification de (H1) ne dépend que de la matrice
			<KatexInline formula="X" />. Pour les hypothèses sur le terme d’erreur — (H2) : erreurs
			centrées, de même variance, non corrélées ; (H3) : loi normale — on est « un peu malin » : on
			inspecte les
			<strong>résidus estimés</strong>
			<KatexInline formula={String.raw`\hat{\varepsilon}_i = y_i - \hat{y}_i`} />. Le diagnostic
			graphique est un outil puissant : il fournit des informations que les indicateurs statistiques
			appréhendent mal.
		</p>

		<DefinitionBlock number="4.6" title="Les résidus et leurs graphes">
			<p>
				Dans un modèle avec constante, la moyenne des résidus est
				<strong>nulle par construction</strong> : le vecteur des résidus est orthogonal aux
				variables explicatives
				<KatexInline formula={String.raw`\hat{\varepsilon}^\top X = 0`} />, et comme
			</p>
			<KatexBlock formula={resZero} />
			<p>
				cette moyenne nulle ne préjuge en rien de la pertinence de la régression. Pour un modèle
				valide, les graphes attendus — résidus toujours en ordonnée — sont :
			</p>
			<ul>
				<li>
					<strong>vs la réponse</strong>
					<KatexInline formula="Y" /> : les résidus répartis aléatoirement autour de 0, sans valeur différente
					selon
					<KatexInline formula="Y" /> ;
				</li>
				<li>
					<strong>vs chaque variable explicative</strong>
					<KatexInline formula={String.raw`X_i`} /> : aucune relation entre le terme d’erreur et les variables
					explicatives (indépendance par hypothèse, à confirmer visuellement) ;
				</li>
				<li>
					<strong>vs le temps</strong> (données temporelles) : détection de ruptures de structure et d’auto-corrélations.
				</li>
			</ul>
			<p>
				Les pathologies classiques ont leur signature :
				<strong>asymétrie</strong> (plusieurs populations mélangées, ou variable importante
				manquante), <strong>blocs</strong> (non-linéarité),
				<strong>hétéroscédasticité</strong> (variance non constante),
				<strong>auto-corrélation</strong> (données temporelles). Pour
				<KatexInline formula="n" /> grand : ajouter un lissage
				<KatexInline formula={String.raw`\texttt{ksmooth()}`} /> ou
				<KatexInline formula={String.raw`\texttt{lowess()}`} /> et un histogramme.
			</p>
			<p>
				Chaque signature a son diagnostic et son remède. <strong>Asymétrie</strong> : les données
				mêlent souvent plusieurs populations (par exemple des tranches d’âges) ou une variable
				importante manque — chercher ce qui discrimine les groupes (analyse descriptive, experts du
				domaine) pour affiner le modèle (deux modèles distincts, ajouter une variable…).
				<strong>Blocs</strong>
				: la relation est en réalité non-linéaire — ajouter une variable transformée (carré,
				logarithme…) ou recourir à une régression non-linéaire.
				<strong>Hétéroscédasticité</strong> : variable manquante ou lien non-linéaire entre <KatexInline
					formula="Y"
				/> et un prédicteur — consulter les experts et ajouter des variables, éventuellement transformées.
				<strong>Auto-corrélation</strong> (données temporelles) :
				<strong>positive</strong> quand des « blocs » de résidus restent de même signe,
				<strong>négative</strong> quand les résidus alternent positifs et négatifs — tenter alors d’identifier
				le processus temporel des erreurs.
			</p>
		</DefinitionBlock>

		<InteractiveSection
			number="4.7"
			title="La clinique des résidus"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmResidualClinic.svelte')} />
		</InteractiveSection>

		<h2 id="partiels">Résidus partiels et Q-Q plot</h2>

		<p>
			Pour étudier le lien réel entre
			<KatexInline formula="Y" /> et une variable explicative
			<KatexInline formula={String.raw`X_j`} />, le nuage de points brut
			<KatexInline formula={String.raw`(x_{j,i}, y_i)`} /> n’est pas fiable : les autres variables explicatives
			influencent aussi
			<KatexInline formula="Y" /> et brouillent l’impression. On veut le lien entre
			<KatexInline formula={String.raw`X_j`} /> et
			<KatexInline formula="Y" />
			<strong>conditionnellement</strong> aux autres variables — d’où les résidus partiels.
		</p>

		<DefinitionBlock number="4.8" title="Résidus partiels">
			<p>
				Le résidu partiel associé à
				<KatexInline formula={String.raw`X_j`} /> pour l’individu
				<KatexInline formula="i" /> est
			</p>
			<KatexBlock formula={partialRes} />
			<p>
				: il <strong>enlève l’effet estimé</strong> de toutes les variables explicatives autres que
				<KatexInline formula={String.raw`X_j`} /> sur
				<KatexInline formula="Y" />. La nature du lien entre
				<KatexInline formula={String.raw`X_j`} /> et
				<KatexInline formula="Y" /> se lit sur le nuage
				<KatexInline formula={String.raw`(x_{j,i}, \hat{\varepsilon}^{\Delta_j}_i)`} />
				: s’il s’ajuste par une droite, le lien est linéaire ; sinon, il est non-linéaire — on cherche
				alors une transformation de
				<KatexInline formula={String.raw`X_j`} /> (polynômes
				<KatexInline formula={String.raw`x^2, x^3, \dots`} />,
				<KatexInline formula={String.raw`\texttt{exp()}`} />,
				<KatexInline formula={String.raw`\texttt{ln()}`} />…) à remplacer ou à ajouter au modèle.
			</p>
			<p>
				Enfin, le <strong>Q-Q plot</strong> des résidus — quantiles observés contre quantiles
				théoriques de
				<KatexInline formula={String.raw`\mathcal{N}(0,1)`} /> — permet de se faire une idée de la
				<strong>normalité</strong> des résidus, c’est-à-dire de vérifier (H3) : des points alignés sur
				la diagonale indiquent la normalité ; une courbure en S signale une asymétrie, et des queues qui
				s’écartent de la droite signalent des queues plus lourdes (ou plus légères) que la gaussienne.
			</p>
		</DefinitionBlock>

		<InteractiveSection
			number="4.9"
			title="Résidus partiels : voir le lien masqué"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmPartialResidual.svelte')} />
		</InteractiveSection>

		<h2 id="influence">Observations influentes</h2>

		<p>
			Le critère des moindres carrés peut être très sensible à des observations
			<strong>hors norme</strong>. Trois notions distinctes — à ne pas confondre :
		</p>

		<DefinitionBlock number="4.10" title="Atypique, levier, influent">
			<ul>
				<li>
					un point <strong>atypique</strong> (ou aberrant) s’écarte résolument des autres — erreur de
					recueil, individu hors population, ou simple variabilité d’échantillonnage ;
				</li>
				<li>
					un point est un <strong>levier</strong> quand les variables explicatives
					<KatexInline formula={String.raw`x_i`} /> sont éloignées du barycentre : il pèse fort sur la
					prédiction, même avec un résidu modéré ;
				</li>
				<li>
					un point est <strong>influent</strong> quand son écart modifie sensiblement les
					coefficients — combinaison levier <em>et</em>
					résidu.
				</li>
			</ul>
			<p>
				<strong>Un point atypique n’est pas forcément influent</strong> : un gros résidu au centre du
				nuage ne déplace guère la droite, tandis qu’un résidu modéré en bout de nuage peut la faire pivoter.
				Le moyen sûr de le vérifier : recalculer la régression en écartant le point.
			</p>
		</DefinitionBlock>

		<TheoremBlock number="4.11" title="Leviers et matrice chapeau">
			<p>
				Comme
				<KatexInline formula={String.raw`\hat{Y} = HY`} /> et
				<KatexInline formula={String.raw`H`} />, symétrique et idempotente,
				<KatexInline formula={String.raw`\mathrm{V}(\hat{Y}) = \sigma^2 H`} /> : la variance du
				<KatexInline formula={String.raw`i`} />-ème ajusté vaut
				<KatexInline formula={String.raw`h_{ii}\,\sigma^2`} />. La composante diagonale
				<KatexInline formula={String.raw`h_{ii}`} /> est le <strong>levier</strong>
				de l’observation
				<KatexInline formula="i" /> : plus il est élevé, plus
				<KatexInline formula={String.raw`y_i`} /> contribue à la prédiction de
				<KatexInline formula={String.raw`\hat{y}_i`} />.
			</p>
			<KatexBlock formula={hiiBounds} />
			<p>
				(démonstrations : valeurs propres d’une idempotente dans
				<KatexInline formula={String.raw`\{0,1\}`} />, donc
				<KatexInline formula={String.raw`0 \le h_{ii} = e_i^\top H e_i \le 1`} />
				; et
				<KatexInline
					formula={String.raw`\sum_i h_{ii} = \mathrm{tr}(H) = \mathrm{rang}(H) = p+1`}
				/>). En pratique,
				<KatexInline formula="i" /> est un <strong>point levier</strong> si
			</p>
			<KatexBlock formula={hiiThr} />
		</TheoremBlock>

		<DefinitionBlock number="4.12" title="Résidus standardisés et studentisés">
			<p>
				De même,
				<KatexInline formula={String.raw`\hat{\varepsilon} = (I_n - H)Y`} />
				donne
				<KatexInline formula={String.raw`\mathrm{V}(\hat{\varepsilon}_i) = (1 - h_{ii})\sigma^2`} />
				: les résidus observés ne sont
				<strong>pas homoscédastiques</strong>. Pour les rendre comparables, on les standardise :
			</p>
			<KatexBlock formula={residStd} />
			<p>
				Mais
				<KatexInline formula={String.raw`\hat{\varepsilon}_i`} /> n’est pas indépendant de
				<KatexInline formula={String.raw`\hat{\sigma}`} /> — on remplace donc
				<KatexInline formula={String.raw`\hat{\sigma}`} /> par
				<KatexInline formula={String.raw`\hat{\sigma}^{(-i)}`} />, l’estimation obtenue
				<strong>sans l’observation</strong>
				<KatexInline formula="i" /> :
			</p>
			<KatexBlock formula={residStud} />
			<p>
				(numérateur et dénominateur indépendants ; sous (H3), loi de Student à
				<KatexInline formula={String.raw`n-p-2`} /> degrés de liberté). En pratique,
				<KatexInline formula={String.raw`|t_i| > \texttt{qt}(0{,}975,\ n-p-2)`} />
				(une valeur proche de 2) signale un résidu
				<strong>atypique</strong>. En R :
				<code>rstandard()</code> et <code>rstudent()</code>.
			</p>
		</DefinitionBlock>

		<TheoremBlock number="4.13" title="Distance de Cook">
			<p>
				La <strong>distance de Cook</strong> mesure l’influence de
				<KatexInline formula="i" /> sur l’ensemble des prévisions :
				<KatexInline formula={String.raw`D_i`} /> est la distance (normalisée) entre les ajustements
				<KatexInline formula={String.raw`\hat{Y}`} /> et
				<KatexInline formula={String.raw`\hat{Y}^{(-i)}`} /> obtenus en écartant l’observation
				<KatexInline formula="i" />. Elle se calcule
				<strong>sans refaire</strong>
				<KatexInline formula="n" /> régressions, comme fonction des leviers et des résidus standardisés
				:
			</p>
			<KatexBlock formula={cook} />
			<p>
				La même astuce donne l’erreur de test (prédiction de
				<KatexInline formula={String.raw`y_i`} /> par le modèle estimé sans
				<KatexInline formula="i" />) :
			</p>
			<KatexBlock formula={deletedRes} />
			<p>
				<strong>Stratégie :</strong> comparer les
				<KatexInline formula={String.raw`D_i`} /> à
				<KatexInline formula="1" /> (
				<code>cooks.distance()</code> en R) — une valeur
				<KatexInline formula={String.raw`D_i > 1`} /> signale une observation
				<strong>influen<em>te</em></strong> — puis l’expliquer en regardant, pour ces observations, leur
				résidu studentisé (atypique ?) et leur levier (éloigné ?).
			</p>
		</TheoremBlock>

		<ExampleBlock number="4.14" title="Que faire des observations influentes ?">
			<p>Il n’y a pas de remède universel :</p>
			<ul>
				<li>
					<strong>supprimer</strong> l’observation (attention : cela peut rendre influentes de
					<em>nouvelles</em> observations) ;
				</li>
				<li>
					<strong>corriger</strong> une erreur de mesure ;
				</li>
				<li>
					construire une estimation <strong>robuste</strong> ;
				</li>
				<li>
					<strong>ne rien faire</strong>.
				</li>
			</ul>
			<p>
				La décision dépend du contexte et doit être <strong>argumentée</strong> — par exemple, un point
				levier peut tout à fait appartenir à la population (viabilité d’échantillonnage).
			</p>
		</ExampleBlock>

		<InteractiveSection
			number="4.15"
			title="Leviers, résidus studentisés et distance de Cook"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/LmLeverageCook.svelte')} />
		</InteractiveSection>

		<h2 id="bref">En bref : le jeu de données propre</h2>

		<DefinitionBlock number="4.16" title="Checklist de validation du modèle linéaire">
			<p>
				À cette étape, on doit avoir un <strong>jeu de données propre</strong>
				pour le modèle linéaire :
			</p>
			<ul>
				<li>
					pas de multi-colinéarité dans la matrice <KatexInline formula="X" /> (plein rang, conditionnement,
					VIF) ;
				</li>
				<li>
					le graphe des points <KatexInline formula={String.raw`(y_i, \hat{y}_i)`} /> est à peu près aligné
					selon la <strong>droite de pente 1</strong> (et celui des <KatexInline
						formula={String.raw`(\hat{y}_i, \hat{\varepsilon}_i)`}
					/> ne montre aucune structure) ;
				</li>
				<li>
					relations <strong>linéaires</strong> entre variables explicatives et variable à expliquer (résidus
					partiels) ;
				</li>
				<li>
					résidus <strong>« sans structure »</strong> : variance constante, indépendance des observations,
					distribution symétrique (Q-Q plot) ;
				</li>
				<li>
					pas d’observation aberrante ou trop influente (
					<KatexInline formula={String.raw`|t_i|`} />, leviers,
					<KatexInline formula={String.raw`D_i`} />).
				</li>
			</ul>
		</DefinitionBlock>

		<Callout type="note" title="Vers la suite">
			<p>
				Jeu de données propre ne veut pas dire modèle unique : il reste à
				<strong>sélectionner</strong> le bon sous-ensemble de variables et à l’interpréter —
				critères de comparaison, algorithmes de sélection, dans la
				<a href="/part4/lesson5">leçon 5</a>.
			</p>
		</Callout>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Cook, R. D.']}
			year={1977}
			title="Detection of Influential Observations in Linear Regression"
			journal="Technometrics, 19(1), 15–18."
			link="https://doi.org/10.1080/00401706.1977.10489493"
		/>
	</Bibliography>
</PageTemplate>
