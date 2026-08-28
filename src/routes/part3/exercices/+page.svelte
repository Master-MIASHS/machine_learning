<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import { getPageByPath, getNextPage, getPrevPage } from '$lib/navigation.js';

	const meta = getPageByPath('/part3/exercices');
	const prevMeta = $derived(getPrevPage(meta?.index ?? 0));
	const nextMeta = $derived(getNextPage(meta?.index ?? 0));

	const tocEntries: TocEntry[] = [
		{
			id: 'classification-top-k-etalonnage',
			label: 'Classification Top-K & Étalonnage',
			description:
				'Exercices 9.1 à 9.20 : Évaluation Top-K, ECE/MCE, Platt Scaling, régression isotonique et limites des métriques.',
			color: 'epistemic'
		},
		{
			id: 'prediction-conforme-classification',
			label: 'Prédiction Conforme en Classification',
			description:
				'Exercices 10.1 à 10.20 : Échangeabilité, validité en échantillon fini, scores APS/SAPS et couverture conditionnelle.',
			color: 'surprise'
		},
		{
			id: 'prediction-conforme-regression',
			label: 'Régression Conforme',
			description:
				'Exercices 11.1 à 11.20 : Intervalles constants et adaptatifs, CQR, bootstrap et métriques d’évaluation.',
			color: 'agent'
		},
		{
			id: 'classification-average-k',
			label: 'Classification Average-K (Conception)',
			description:
				'Exercices 12.1 à 12.5 : Optimisation de la taille moyenne contrainte, Lagrangien, règle de seuil et inversion de CDF.',
			color: 'neutral'
		}
	];
</script>

<svelte:head>
	<title>{meta?.title ?? 'Feuille d’exercices — Partie III'} — Régularisation et Optimisation</title
	>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Feuille d’exercices — Partie III'}
	subtitle="Exercices sur Top-K, étalonnage, prédiction conforme et intervalles de régression"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<!-- ════════════════════════ SECTION 9 ════════════════════════ -->
		<h2 id="classification-top-k-etalonnage">Classification Top-K & Étalonnage</h2>
		<p>
			Cette première série d'exercices aborde les fondements théoriques de l'évaluation Top-K,
			l'importance de l'étalonnage (calibration) des probabilités prédites, ainsi que les méthodes
			d'ajustement classiques.
		</p>

		<ExercisePanel number="9.1" title="Définition formelle de l'erreur Top-K">
			{#snippet solution()}
				<p>
					Par définition, la prédiction <KatexInline
						formula={String.raw`\text{Top}_K(\hat{p}(x))`}
					/> contient les indices des <KatexInline formula={String.raw`K`} /> plus grandes valeurs de
					<KatexInline formula={String.raw`\hat{p}(x)`} />. L'indicateur d'erreur vaut <KatexInline
						formula={String.raw`1`}
					/> si la classe réelle <KatexInline formula={String.raw`y`} /> n'y figure pas, et <KatexInline
						formula={String.raw`0`}
					/> sinon. On peut donc l'écrire à l'aide des indicatrices de rang :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{I}(y \notin \text{Top}_K(\hat{p}(x))) = \mathbb{I}\left( \sum_{c=1}^C \mathbb{I}(\hat{p}_c(x) \ge \hat{p}_y(x)) > K \right)`}
				/>
				<p>
					Cette formulation montre clairement que l'erreur se produit lorsque le nombre de classes
					jugées plus probables que la classe réelle surpasse <KatexInline
						formula={String.raw`K`}
					/>.
				</p>
			{/snippet}
			<p>
				Formulez mathématiquement l'indicateur d'erreur d'une prédiction <KatexInline
					formula={String.raw`\text{Top}_K`}
				/> pour une observation <KatexInline formula={String.raw`(x, y)`} /> en utilisant uniquement des
				fonctions indicatrices sur le vecteur de probabilités estimées <KatexInline
					formula={String.raw`\hat{p}(x)`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.2" title="L'Oracle Top-K bayésien">
			{#snippet solution()}
				<p>
					Le classifieur optimal (l'oracle) cherche à maximiser la probabilité de couverture <KatexInline
						formula={String.raw`\mathbb{P}(Y \in S(X))`}
					/> sous la contrainte <KatexInline formula={String.raw`|S(x)| \le K`} /> pour tout <KatexInline
						formula={String.raw`x`}
					/>. En décomposant par espérance conditionnelle :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y \in S(X)) = \mathbb{E}_X \left[ \sum_{c \in S(X)} \eta_c(X) \right]`}
				/>
				<p>
					Pour maximiser cette somme point par point sous la contrainte de cardinal maximal <KatexInline
						formula={String.raw`K`}
					/>, la stratégie gloutonne est optimale : il faut choisir les <KatexInline
						formula={String.raw`K`}
					/> classes possédant les plus grandes probabilités a posteriori <KatexInline
						formula={String.raw`\eta_c(x)`}
					/>. Ainsi, <KatexInline formula={String.raw`S^*(x) = \text{Top}_K(\eta(x))`} />.
				</p>
			{/snippet}
			<p>
				Démontrez que le classifieur d'ensemble optimal (au sens du risque d'erreur minimal) sous la
				contrainte que la taille de l'ensemble de prédiction <KatexInline
					formula={String.raw`S(x)`}
				/> soit exactement <KatexInline formula={String.raw`K`} /> est donné par l'oracle <KatexInline
					formula={String.raw`S^*(x) = \text{Top}_K(\eta(x))`}
				/>, où <KatexInline formula={String.raw`\eta_c(x) = \mathbb{P}(Y=c|X=x)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.3" title="Calcul numérique du risque conditionnel Top-2">
			{#snippet solution()}
				<p>
					L'oracle Top-2 sélectionne les deux classes ayant les probabilités les plus élevées : <KatexInline
						formula={String.raw`S^*(x) = \{1, 2\}`}
					/>. La probabilité conditionnelle que la classe réelle appartienne à cet ensemble est :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y \in S^*(x) \mid X=x) = \eta_1(x) + \eta_2(x) = 0.50 + 0.30 = 0.80`}
				/>
				<p>
					Le risque conditionnel Top-2 est le complément à 1 : <KatexInline
						formula={String.raw`1 - 0.80 = 0.20`}
					/> (soit 20%).
				</p>
			{/snippet}
			<p>
				Soit un problème à 4 classes avec <KatexInline
					formula={String.raw`\eta(x) = (0.50, 0.30, 0.15, 0.05)`}
				/>. Déterminez l'ensemble oracle Top-2 <KatexInline formula={String.raw`S^*(x)`} /> et calculez
				le risque conditionnel associé.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.4" title="Croissance monotone de l'exactitude Top-K">
			{#snippet solution()}
				<p>
					Par définition, pour tout vecteur de probabilités <KatexInline
						formula={String.raw`\hat{p}(x)`}
					/>, les ensembles Top-K sont emboîtés :
				</p>
				<KatexBlock
					formula={String.raw`\text{Top}_K(\hat{p}(x)) \subseteq \text{Top}_{K+1}(\hat{p}(x))`}
				/>
				<p>
					Il s'ensuit que pour toute étiquette réelle <KatexInline formula={String.raw`y`} />, si <KatexInline
						formula={String.raw`y \in \text{Top}_K(\hat{p}(x))`}
					/>, alors <KatexInline formula={String.raw`y \in \text{Top}_{K+1}(\hat{p}(x))`} />. En
					prenant l'espérance, on obtient directement <KatexInline
						formula={String.raw`\text{Acc@}K \le \text{Acc@}(K+1)`}
					/>.
				</p>
			{/snippet}
			<p>
				Démontrez que l'exactitude Top-K (<KatexInline formula={String.raw`\text{Acc@}K`} />) est
				une fonction mathématiquement non-décroissante de <KatexInline formula={String.raw`K`} /> pour
				tout <KatexInline formula={String.raw`K \in \{1, \dots, C-1\}`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.5" title="Cas limite de l'exactitude Top-C">
			{#snippet solution()}
				<p>
					Puisque l'espace des étiquettes <KatexInline formula={String.raw`\mathcal{Y}`} /> contient exactement
					<KatexInline formula={String.raw`C`} /> classes, nous avons <KatexInline
						formula={String.raw`\text{Top}_C(\hat{p}(x)) = \mathcal{Y}`}
					/> pour tout <KatexInline formula={String.raw`x`} />. Ainsi, la classe réelle <KatexInline
						formula={String.raw`y`}
					/> appartient trivialement à <KatexInline
						formula={String.raw`\text{Top}_C(\hat{p}(x))`}
					/> avec une probabilité de 1. L'exactitude <KatexInline
						formula={String.raw`\text{Acc@}C`}
					/> est donc toujours égale à 100%, indépendamment de la qualité ou de la calibration du modèle.
				</p>
			{/snippet}
			<p>
				Expliquez pourquoi <KatexInline formula={String.raw`\text{Acc@}C`} /> (où <KatexInline
					formula={String.raw`C`}
				/> est le nombre total de classes) est trivialement égale à 1, quel que soit le modèle ou la distribution
				de données.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.6" title="L'exactitude Top-1 minore-t-elle l'exactitude Top-K ?">
			{#snippet solution()}
				<p>
					<strong>Non.</strong> Contre-exemple : <KatexInline formula={String.raw`C = 2`} /> classes,
					<KatexInline formula={String.raw`\hat{p}(x) = (0.4,\ 0.6)`} />, et <KatexInline formula="Y" />
					presque sûrement la classe de probabilité <KatexInline formula="0.4" />. Alors
					<KatexInline formula={String.raw`\text{Top}_1(\hat{p}(x))`} /> renvoie la classe de
					probabilité <KatexInline formula="0.6" />, donc <KatexInline
						formula={String.raw`\text{Acc@}1 = 0`}
					/>, tandis que <KatexInline formula={String.raw`\text{Acc@}2 = 1`} /> (toutes les classes
					sont incluses). L'inégalité demandée donnerait <KatexInline
						formula={String.raw`0 \ge \frac{1}{2}`}
					/>, manifestement faux.
				</p>
				<p>
					La seule relation générale est la monotonie
					<KatexInline
						formula={String.raw`\text{Acc@}1 \le \text{Acc@}K \le \dots \le \text{Acc@}C = 1`}
					/>
					, qui découle directement du fait que
					<KatexInline
						formula={String.raw`\text{Top}_K(\hat{p}(x)) \supseteq \text{Top}_1(\hat{p}(x))`}
					/>
					pour tout <KatexInline formula="x" />.
				</p>
			{/snippet}
			<p>
				L'inégalité <KatexInline formula={String.raw`\text{Acc@}1 \ge \frac{1}{K} \text{Acc@}K`} /> est-elle
				toujours vraie ? Répondez par oui ou par non et justifiez ; si non, donnez un contre-exemple.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.7" title="Étalonnage fort vs étalonnage faible">
			{#snippet solution()}
				<p>
					Un classifieur est <strong>fortement étalonné</strong> si <KatexInline
						formula={String.raw`\mathbb{P}(Y=c \mid \hat{p}(X) = p) = p_c`}
					/> pour tout vecteur de probabilité <KatexInline formula={String.raw`p`} />. Il est
					<strong>faiblement étalonné</strong> (au sens du Top-1) si la confiance associée à sa prédiction
					maximale correspond à sa probabilité d'être correcte :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y = \hat{y}(X) \mid \max_c \hat{p}_c(X) = \tau) = \tau`}
				/>
				<p>
					L'étalonnage fort implique l'étalonnage faible par sommation sur les fibres de la
					prédiction. La réciproque est fausse, car l'étalonnage faible ne garantit pas la validité
					des probabilités affectées aux classes non majoritaires.
				</p>
			{/snippet}
			<p>
				Définissez formellement la différence entre l'étalonnage fort (multiclasse) et l'étalonnage
				faible (concentré sur la classe prédite majoritaire). L'un implique-t-il l'autre ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.8" title="Calcul de l'ECE (Expected Calibration Error)">
			{#snippet solution()}
				<p>
					La formule de l'ECE est la moyenne pondérée des écarts absolus entre confiance et
					exactitude :
				</p>
				<KatexBlock
					formula={String.raw`\text{ECE} = \sum_{b=1}^B \frac{|B_b|}{N} \left| \text{acc}(B_b) - \text{conf}(B_b) \right|`}
				/>
				<p>Appliquons-la au tableau :</p>
				<ul>
					<li>
						Bin 1 : <KatexInline
							formula={String.raw`\frac{100}{1000} \cdot |0.35 - 0.30| = 0.1 \cdot 0.05 = 0.005`}
						/>
					</li>
					<li>
						Bin 2 : <KatexInline
							formula={String.raw`\frac{500}{1000} \cdot |0.55 - 0.60| = 0.5 \cdot 0.05 = 0.025`}
						/>
					</li>
					<li>
						Bin 3 : <KatexInline
							formula={String.raw`\frac{400}{1000} \cdot |0.85 - 0.80| = 0.4 \cdot 0.05 = 0.020`}
						/>
					</li>
				</ul>
				<p>
					En sommant, <KatexInline formula={String.raw`ECE = 0.005 + 0.025 + 0.020 = 0.050`} /> (soit
					5.0%).
				</p>
			{/snippet}
			<p>
				Soit un échantillon de validation de <KatexInline formula={String.raw`N = 1000`} /> points répartis
				en 3 bins d'étalonnage :
			</p>
			<table class="w-full text-center border my-2">
				<thead>
					<tr class="bg-muted"
						><th>Bin</th><th>Nombre de points</th><th>Exactitude</th><th>Confiance moyenne</th></tr
					>
				</thead>
				<tbody>
					<tr><td>1</td><td>100</td><td>35%</td><td>30%</td></tr>
					<tr><td>2</td><td>500</td><td>55%</td><td>60%</td></tr>
					<tr><td>3</td><td>400</td><td>85%</td><td>80%</td></tr>
				</tbody>
			</table>
			<p>Calculez l'ECE de ce modèle.</p>
		</ExercisePanel>

		<ExercisePanel number="9.9" title="Maximum Calibration Error (MCE)">
			{#snippet solution()}
				<p>La MCE se concentre sur le pire écart observé à l'échelle des bins d'étalonnage :</p>
				<KatexBlock
					formula={String.raw`\text{MCE} = \max_{b \in \{1,\dots,B\}} \left| \text{acc}(B_b) - \text{conf}(B_b) \right|`}
				/>
				<p>
					Pour l'exercice précédent, les écarts absolus par bin sont tous de 5% (<KatexInline
						formula={String.raw`0.05`}
					/>). La MCE vaut donc <KatexInline formula={String.raw`0.05`} /> (5.0%). La MCE est très utile
					dans les applications critiques (médecine, conduite autonome) où l'on veut garantir qu'aucune
					sous-population (définie par une tranche de confiance) ne subit une erreur d'étalonnage disproportionnée.
				</p>
			{/snippet}
			<p>
				Définissez la métrique de la MCE (Maximum Calibration Error), calculez-la sur les données de
				l'exercice 9.8 et expliquez sa pertinence par rapport à l'ECE dans les cas d'usage à haute
				sécurité.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.10" title="Propriété de préservation du Temperature Scaling">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`z_i(x)`} /> les logits d'entrée. Le modèle étalonné par
					température calcule :
				</p>
				<KatexBlock
					formula={String.raw`\hat{p}_i(x; T) = \frac{\exp(z_i(x) / T)}{\sum_j \exp(z_j(x) / T)}`}
				/>
				<p>
					Puisque la fonction exponentielle et la division par un scalaire positif <KatexInline
						formula={String.raw`T > 0`}
					/> sont des transformations strictement croissantes, nous avons :
				</p>
				<KatexBlock
					formula={String.raw`z_a(x) > z_b(x) \iff \frac{z_a(x)}{T} > \frac{z_b(x)}{T} \iff \exp\left(\frac{z_a(x)}{T}\right) > \exp\left(\frac{z_b(x)}{T}\right)`}
				/>
				<p>
					Par conséquent, l'ordre des probabilités après softmax reste strictement inchangé. Les
					ensembles Top-K et la classe prédite majoritaire (Top-1) sont rigoureusement identiques
					pour toutes les valeurs de <KatexInline formula={String.raw`T > 0`} />.
				</p>
			{/snippet}
			<p>
				Démontrez algébriquement que la méthode de recalibration par température (Temperature
				Scaling), qui consiste à diviser tous les logits par un scalaire <KatexInline
					formula={String.raw`T > 0`}
				/> avant d'appliquer la fonction softmax, ne modifie pas la prédiction Top-1 ni le classement
				relatif des classes (Top-K).
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.11" title="Platt Scaling sous forme de régression logistique">
			{#snippet solution()}
				<p>
					La méthode historique de Platt s'applique aux sorties brutes <KatexInline
						formula={String.raw`f(x)`}
					/> d'un SVM. Elle modélise la probabilité calibrée par une sigmoïde :
				</p>
				<KatexBlock
					formula={String.raw`\hat{P}(Y=1 \mid f(x)) = \sigma(A f(x) + B) = \frac{1}{1 + \exp(-(A f(x) + B))}`}
				/>
				<p>
					Les paramètres <KatexInline formula={String.raw`A`} /> et <KatexInline
						formula={String.raw`B`}
					/> sont trouvés en minimisant la perte d'entropie croisée binaire sur un ensemble de calibration
					indépendant <KatexInline formula={String.raw`\mathcal{D}_{\text{cal}}`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\min_{A, B} -\sum_{i \in \mathcal{D}_{\text{cal}}} \left[ y_i \log \sigma(A f(x_i) + B) + (1-y_i) \log(1 - \sigma(A f(x_i) + B)) \right]`}
				/>
			{/snippet}
			<p>
				Présentez la formulation mathématique du Platt Scaling pour le cas binaire et explicitez
				l'objectif d'optimisation sous-jacent (fonction de perte et jeu de données utilisé).
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.12" title="Généralisations multiclasses : Vector vs Matrix Scaling">
			{#snippet solution()}
				<p>
					En multiclasse, le Platt Scaling se généralise aux logits <KatexInline
						formula={String.raw`z(x)`}
					/>.
				</p>
				<ul>
					<li>
						<strong>Vector Scaling :</strong> Applique un facteur d'échelle et un biais distincts
						par classe : <KatexInline formula={String.raw`W`} /> est diagonale. Le nombre de paramètres
						à estimer est de <KatexInline formula={String.raw`2C`} />.
					</li>
					<li>
						<strong>Matrix Scaling :</strong> Permet des interactions linéaires entre toutes les
						classes : <KatexInline formula={String.raw`W`} /> est une matrice pleine. Le nombre de paramètres
						est de <KatexInline formula={String.raw`C^2 + C`} />.
					</li>
				</ul>
				<p>
					Le Matrix Scaling présente un risque de surapprentissage (overfitting) très élevé dès que
					le nombre de classes <KatexInline formula={String.raw`C`} /> grandit, contrairement au Vector
					Scaling ou au Temperature Scaling (qui ne possède qu'un unique paramètre <KatexInline
						formula={String.raw`T`}
					/>).
				</p>
			{/snippet}
			<p>
				Comparez les méthodes de recalibration multiclasses <em>Vector Scaling</em> et
				<em>Matrix Scaling</em>
				(définies par la transformation linéaire des logits <KatexInline
					formula={String.raw`W z(x) + b`}
				/>) en termes de nombre de paramètres libres et de risques de surapprentissage.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.13" title="Calibration non paramétrique : Histogram Binning">
			{#snippet solution()}
				<p>
					L'intervalle de confiance considéré <KatexInline formula={String.raw`[0.4, 0.6[`} /> constitue
					un bin unique. Durant la calibration, <KatexInline formula={String.raw`40`} /> échantillons
					y sont tombés. La probabilité révisée pour ce bin est estimée par la fréquence empirique des
					exemples positifs :
				</p>
				<KatexBlock
					formula={String.raw`\hat{\theta} = \frac{\sum_{i \in B} y_i}{|B|} = \frac{10}{10 + 30} = 0.25`}
				/>
				<p>
					Tout nouvel exemple pour lequel la prédiction initiale du modèle tombe dans l'intervalle <KatexInline
						formula={String.raw`[0.4, 0.6[`}
					/> se verra attribuer la probabilité recalibrée finale de <KatexInline
						formula={String.raw`0.25`}
					/> (25%).
				</p>
			{/snippet}
			<p>
				Dans un schéma d'Histogram Binning à 5 classes de confiance de largeur égale, un bin couvre
				la plage <KatexInline formula={String.raw`[0.4, 0.6[`} />. Pendant la calibration, 40 points
				de données tombent dans ce bin, parmi lesquels 10 appartiennent à la classe positive. Quelle
				probabilité calibrée sera attribuée à un point de test dont le score initial est de 0.52 ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.14" title="Optimisation par Régression Isotonique">
			{#snippet solution()}
				<p>La régression isotonique cherche à résoudre le problème d'optimisation suivant :</p>
				<KatexBlock
					formula={String.raw`\min_{g} \sum_{i \in \mathcal{D}_{\text{cal}}} (g(\hat{p}_i) - y_i)^2 \quad \text{s.t.} \quad g(a) \le g(b) \text{ pour tout } a \le b`}
				/>
				<p>
					L'algorithme de référence est le <strong>Pool Adjacent Violators (PAV)</strong>.
					Contrairement à l'Histogram Binning, elle ne requiert pas de fixer arbitrairement le
					nombre ou les bornes des bins : elle ajuste automatiquement des paliers constants en
					fusionnant les régions qui violent la contrainte de monotonie.
				</p>
			{/snippet}
			<p>
				Formulez le problème mathématique de la régression isotonique pour la calibration et
				décrivez brièvement le rôle de l'algorithme PAV (Pool Adjacent Violators).
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.15" title="ECE vs Perte Logarithmique">
			{#snippet solution()}
				<p>
					Considérons un problème binaire avec une probabilité a posteriori vraie <KatexInline
						formula={String.raw`\eta(x) = 0.5`}
					/> pour tous les points d'une population.
				</p>
				<ul>
					<li>
						<strong>Modèle A :</strong> Prédit constamment <KatexInline
							formula={String.raw`0.5`}
						/>. Son exactitude est de 50%, sa confiance est de 50%. Son ECE est de 0.
					</li>
					<li>
						<strong>Modèle B :</strong> Prédit <KatexInline formula={String.raw`0.9`} /> pour la moitié
						des points et <KatexInline formula={String.raw`0.1`} /> pour l'autre moitié. Son exactitude
						moyenne est aussi de 50% mais sa confiance est de 90%. Son ECE est très élevé (<KatexInline
							formula={String.raw`0.4`}
						/>).
					</li>
				</ul>
				<p>
					Le modèle A est parfaitement calibré (ECE = 0) mais inutile pour discriminer
					individuellement les points. La perte de Cross-Entropy pénalise le manque de discernement
					et favorise les probabilités proches de 0 ou 1 si les données sont séparables, tandis que
					l'ECE ne mesure que la cohérence statistique des groupes.
				</p>
			{/snippet}
			<p>
				Donnez un exemple théorique de classifieur qui présente une ECE égale à 0 (calibration
				parfaite) mais qui s'avère totalement inutile en pratique pour trier les instances de
				manière sélective. Comparez l'objectif de l'ECE et de la Cross-Entropy.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.16" title="Biais statistique de l'estimateur de l'ECE">
			{#snippet solution()}
				<p>
					L'estimateur standard de l'ECE utilise un partitionnement en bins fixes. À cause de la
					présence de la valeur absolue dans le calcul de la différence entre exactitude et
					confiance :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{E}\left[ \left| \text{acc}(B_b) - \text{conf}(B_b) \right| \right] \ge \left| \mathbb{E}[\text{acc}(B_b)] - \mathbb{E}[\text{conf}(B_b)] \right|`}
				/>
				<p>
					Même si le modèle sous-jacent est parfaitement calibré, les fluctuations d'échantillonnage
					au sein de chaque bin (surtout si le nombre de points par bin est petit) produisent des
					écarts empiriques non nuls qui s'additionnent de manière positive. L'estimateur de l'ECE
					classique est donc systématiquement <strong>biaisé vers le haut</strong>.
				</p>
			{/snippet}
			<p>
				Expliquez pourquoi l'estimateur empirique classique de l'ECE, calculé à partir d'un nombre
				fini de bins et d'échantillons, est un estimateur biaisé (et déterminez le sens du biais).
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.17" title="Top-K Softmax pour l'entraînement">
			{#snippet solution()}
				<p>
					Pendant l'entraînement standard par Cross-Entropy, le gradient pousse à maximiser la
					probabilité de la bonne classe par rapport à <em>toutes</em> les autres classes. Dans un
					objectif Top-K Softmax (par exemple avec la perte de charnière de classement), le gradient
					ne pénalise la probabilité de la bonne classe que si celle-ci ne se trouve pas dans les <KatexInline
						formula={String.raw`K`}
					/> scores les plus élevés. Cela permet au modèle de ne pas forcer la séparation des classes
					complexes tant qu'elles restent dans le peloton de tête, augmentant ainsi la flexibilité de
					la frontière de décision au détriment de l'exactitude Top-1.
				</p>
			{/snippet}
			<p>
				Comment l'utilisation d'une fonction de perte ciblant directement la performance Top-K lors
				de l'entraînement (comme la perte de classement ou les surrogates lisses) influence-t-elle
				la répartition des probabilités par rapport à la Cross-Entropy classique ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.18" title="Le phénomène de sur-confiance des réseaux profonds">
			{#snippet solution()}
				<p>
					Les architectures profondes modernes (comme les ResNets ou les Transformers) atteignent
					souvent une excellente exactitude mais souffrent d'une décalibration prononcée
					(sur-confiance). Cela s'explique par la déconnexion entre la perte d'entraînement
					(Cross-Entropy) et l'erreur de classification : le réseau continue d'optimiser l'entropie
					croisée en augmentant l'amplitude des logits pour rapprocher les probabilités softmax de
					1, bien après que l'erreur de classification a convergé à zéro. L'étalonnage se dégrade
					donc massivement durant les époques tardives d'entraînement.
				</p>
			{/snippet}
			<p>
				Pourquoi les réseaux de neurones profonds modernes ont-ils tendance à être extrêmement mal
				étalonnés (produisant des confiances très proches de 100% même en cas d'erreur) alors que
				leurs ancêtres plus simples (comme les réseaux de neurones à une couche cachée) l'étaient
				moins ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.19" title="Décomposition du score de Brier">
			{#snippet solution()}
				<p>
					Le score de Brier (erreur quadratique moyenne des probabilités) se décompose de manière
					unique en trois composantes additives :
				</p>
				<KatexBlock
					formula={String.raw`\text{BS} = \text{Fiabilité} - \text{Résolution} + \text{Incertitude}`}
				/>
				<ul>
					<li>
						<strong>Fiabilité (Reliability) :</strong> Mesure directement le défaut de calibration (proche
						de l'ECE au carré). Idéalement égale à 0.
					</li>
					<li>
						<strong>Résolution :</strong> Capacité du modèle à faire des prédictions discriminantes (éloignées
						de la moyenne globale). Idéalement maximale.
					</li>
					<li>
						<strong>Incertitude :</strong> La variance intrinsèque des données (liée au bruit de Bayes).
					</li>
				</ul>
			{/snippet}
			<p>
				Formulez la décomposition théorique du Score de Brier en trois composantes (Fiabilité,
				Résolution et Incertitude) et expliquez le rôle de chacune pour caractériser la qualité d'un
				système de prévision probabiliste.
			</p>
		</ExercisePanel>

		<ExercisePanel number="9.20" title="Vrai ou Faux : Étalonnage">
			{#snippet solution()}
				<ol>
					<li>
						<strong>VRAI :</strong> Diviser par <KatexInline formula={String.raw`T > 1`} /> écrase les
						écarts de logits et adoucit la distribution (augmentation de l'entropie), réduisant les confiances
						excessives.
					</li>
					<li>
						<strong>FAUX :</strong> La régression isotonique est hautement non paramétrique et nécessite
						d'assez grands jeux de données de validation pour éviter le surapprentissage locale. Pour
						de petits jeux, le Temperature Scaling est préférable.
					</li>
					<li>
						<strong>VRAI :</strong> L'ECE n'impose aucune contrainte de monotonie globale, contrairement
						à la perte logarithmique.
					</li>
					<li>
						<strong>VRAI :</strong> Par définition, l'ECE groupe les points par bins de confiance, tandis
						que la calibration forte exige l'égalité point par point sur tout l'espace d'entrée.
					</li>
				</ol>
			{/snippet}
			<p>Répondez par Vrai ou Faux en justifiant brièvement :</p>
			<ol>
				<li>
					Une température <KatexInline formula={String.raw`T > 1`} /> diminue systématiquement la confiance
					des prédictions d'un modèle.
				</li>
				<li>
					La régression isotonique est toujours la meilleure méthode de calibration lorsque
					l'ensemble de calibration est de très petite taille (ex: <KatexInline
						formula={String.raw`N < 50`}
					/>).
				</li>
				<li>
					Un modèle peut avoir une ECE de 0% tout en ayant une erreur de classification de 100%.
				</li>
				<li>
					La calibration forte est une condition mathématique plus stricte que la calibration
					mesurée par l'ECE.
				</li>
			</ol>
		</ExercisePanel>

		<!-- ════════════════════════ SECTION 10 ════════════════════════ -->
		<h2 id="prediction-conforme-classification">Prédiction Conforme en Classification</h2>
		<p>
			Cette section se concentre sur le formalisme de la prédiction conforme (Split Conformal)
			appliquée à la classification multiclasse, avec des garanties théoriques de couverture exactes
			à échantillon fini.
		</p>

		<ExercisePanel number="10.1" title="La notion d'échangeabilité">
			{#snippet solution()}
				<p>
					Une suite de variables aléatoires <KatexInline formula={String.raw`Z_1, \dots, Z_N`} /> est
					<strong>échangeable</strong> si leur loi jointe est invariante par toute permutation des indices
					:
				</p>
				<KatexBlock
					formula={String.raw`P(Z_1, \dots, Z_N) = P(Z_{\pi(1)}, \dots, Z_{\pi(N)}) \quad \forall \pi \in \mathfrak{S}_N`}
				/>
				<p>
					Si des variables sont indépendantes et identiquement distribuées (i.i.d.), leur loi jointe
					se factorise sous forme de produit marginal : <KatexInline
						formula={String.raw`\prod P(Z_i)`}
					/>, ce qui est trivialement symétrique par rapport aux indices. L'i.i.d. implique donc
					l'échangeabilité. La réciproque est fausse : par exemple, le tirage sans remise dans une
					urne produit des variables échangeables mais dépendantes.
				</p>
			{/snippet}
			<p>
				Définissez mathématiquement la notion d'<strong>échangeabilité</strong> d'une suite de variables
				aléatoires et démontrez pourquoi l'hypothèse i.i.d. (indépendantes et identiquement distribuées)
				en est un cas particulier.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.2" title="Score de conformité de base">
			{#snippet solution()}
				<p>
					Le score est défini par <KatexInline formula={String.raw`s(x,y) = 1 - \hat{p}_y(x)`} />.
					Calculons les scores pour les 3 classes possibles :
				</p>
				<ul>
					<li>Classe 1 : <KatexInline formula={String.raw`s(x, 1) = 1 - 0.70 = 0.30`} /></li>
					<li>Classe 2 : <KatexInline formula={String.raw`s(x, 2) = 1 - 0.20 = 0.80`} /></li>
					<li>Classe 3 : <KatexInline formula={String.raw`s(x, 3) = 1 - 0.10 = 0.90`} /></li>
				</ul>
				<p>
					La règle de décision de l'ensemble conforme est : <KatexInline
						formula={String.raw`\mathcal{C}(x) = \{ c \in \mathcal{Y} \mid s(x,c) \le \hat{q} \}`}
					/>.
				</p>
				<ul>
					<li>
						Si <KatexInline formula={String.raw`\hat{q} = 0.85`} /> : les classes 1 et 2 ont un score
						<KatexInline formula={String.raw`\le 0.85`} />. Ainsi, <KatexInline
							formula={String.raw`\mathcal{C}(x) = \{1, 2\}`}
						/>.
					</li>
					<li>
						Si <KatexInline formula={String.raw`\hat{q} = 0.25`} /> : aucun score n'est inférieur à <KatexInline
							formula={String.raw`0.25`}
						/>. L'ensemble est vide : <KatexInline
							formula={String.raw`\mathcal{C}(x) = \emptyset`}
						/>.
					</li>
				</ul>
			{/snippet}
			<p>
				Soit un classifieur de test renvoyant le vecteur <KatexInline
					formula={String.raw`\hat{p}(x) = (0.70, 0.20, 0.10)`}
				/> pour les classes <KatexInline formula={String.raw`\{1, 2, 3\}`} />. En utilisant le score
				de non-conformité de base <KatexInline formula={String.raw`s(x,y) = 1 - \hat{p}_y(x)`} />,
				donnez les ensembles de prédiction conformes obtenus pour deux valeurs de seuil distinctes : <KatexInline
					formula={String.raw`\hat{q} = 0.85`}
				/> puis <KatexInline formula={String.raw`\hat{q} = 0.25`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.3" title="Preuve de la garantie de couverture (Borne inférieure)">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`S_1, \dots, S_n`} /> les scores calculés sur l'ensemble
					de calibration indépendant <KatexInline formula={String.raw`\mathcal{D}_{\text{cal}}`} />,
					et <KatexInline formula={String.raw`S_{n+1} = s(X_{\text{test}}, Y_{\text{test}})`} /> le score
					sur le point de test. Par l'hypothèse d'échangeabilité, la variable <KatexInline
						formula={String.raw`S_{n+1}`}
					/> a la même probabilité d'occuper n'importe quel rang parmi les <KatexInline
						formula={String.raw`n+1`}
					/> scores ordonnés. Le quantile choisi est <KatexInline
						formula={String.raw`\hat{q} = \text{valeur au rang } \lceil (n+1)(1-\alpha) \rceil`}
					/> des scores <KatexInline formula={String.raw`S_1, \dots, S_n`} />. La probabilité que <KatexInline
						formula={String.raw`S_{n+1} \le \hat{q}`}
					/> est équivalente à la probabilité que <KatexInline formula={String.raw`S_{n+1}`} /> ne fasse
					pas partie des plus grands scores restants. Par définition des quantiles empiriques, cela correspond
					précisément à la proportion de rangs inférieurs ou égaux, garantissant :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y_{\text{test}} \in \mathcal{C}(X_{\text{test}})) = \mathbb{P}(S_{n+1} \le \hat{q}) \ge \frac{\lceil (n+1)(1-\alpha) \rceil}{n+1} \ge 1 - \alpha`}
				/>
			{/snippet}
			<p>
				Démontrez la validité de la borne inférieure de couverture marginale : <KatexInline
					formula={String.raw`\mathbb{P}(Y_{\text{test}} \in \mathcal{C}(X_{\text{test}})) \ge 1-\alpha`}
				/> dans le cadre du Split Conformal Prediction, en détaillant l'utilisation de l'échangeabilité
				des scores de calibration.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.4" title="Borne supérieure de couverture">
			{#snippet solution()}
				<p>
					Si les scores de non-conformité proviennent d'une distribution continue, la probabilité
					d'obtenir deux scores exactement identiques (égalité stricte) est nulle : <KatexInline
						formula={String.raw`P(S_i = S_j) = 0`}
					/>. Les rangs des <KatexInline formula={String.raw`n+1`} /> scores échangeables sont alors uniques
					et distribués de manière strictement uniforme sur <KatexInline
						formula={String.raw`\{1, \dots, n+1\}`}
					/>. La probabilité que le score de test <KatexInline formula={String.raw`S_{n+1}`} /> soit strictement
					inférieur ou égal au quantile empirique <KatexInline formula={String.raw`\hat{q}`} /> correspond
					exactement à la probabilité que son rang soit inférieur ou égal à <KatexInline
						formula={String.raw`k = \lceil (n+1)(1-\alpha) \rceil`}
					/>. On obtient ainsi :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(S_{n+1} \le \hat{q}) = \frac{\lceil (n+1)(1-\alpha) \rceil}{n+1} < 1 - \alpha + \frac{1}{n+1}`}
				/>
			{/snippet}
			<p>
				Démontrez que sous l'hypothèse d'une distribution continue des scores (pas d'égalités ex
				æquo), la couverture du Split Conformal est bornée supérieurement par :
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y_{\text{test}} \in \mathcal{C}(X_{\text{test}})) \le 1 - \alpha + \frac{1}{n+1}`}
				/>
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.5" title="Score cumulatif APS (Adaptive Prediction Sets)">
			{#snippet solution()}
				<p>
					Le score cumulatif est le complément à 1 de la somme des probabilités de <strong>toutes</strong>
					les classes au moins aussi probables que la vraie classe <KatexInline
						formula={String.raw`y`}
					/>, égalités incluses :
				</p>
				<KatexBlock
					formula={String.raw`s(x, y) = 1 - \sum_{j \,:\, \hat{p}_j(x) \geq \hat{p}_y(x)} \hat{p}_j(x)`}
				/>
				<p>
					Contrairement au score simple <KatexInline formula={String.raw`1-\hat{p}_y`} />, ce score
					prend en compte l'ensemble de la distribution de probabilité (la forme de la queue). Il
					s'adapte dynamiquement en produisant de grands ensembles lorsque le modèle hésite entre
					plusieurs classes, et de très petits ensembles lorsque le modèle est confiant sur une
					poignée d'alternatives.
				</p>
			{/snippet}
			<p>
				Expliquez le fonctionnement du score de conformité cumulatif (méthode APS de Romano et al.)
				et décrivez en quoi il offre des propriétés d'adaptabilité supérieures au score simple <KatexInline
					formula={String.raw`1-\hat{p}_y`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.6" title="Score SAPS (Sorted Adaptive Prediction Sets)">
			{#snippet solution()}
				<p>
					On part du score cumulatif des notes — le complément à 1 de la somme des probabilités des
					classes au moins aussi probables que la vraie classe — auquel on ajoute un terme de
					pénalité de régularisation (variante illustrative) pour éviter de rajouter trop facilement
					des classes très peu probables :
				</p>
				<KatexBlock
					formula={String.raw`s(x, y) = 1 - \sum_{j \,:\, \hat{p}_j(x) \geq \hat{p}_y(x)} \hat{p}_j(x) + \lambda (r(y) - k)_+`}
				/>
				<p>
					Où <KatexInline formula={String.raw`r(y)`} /> est le rang de la vraie classe, <KatexInline
						formula={String.raw`k`}
					/> est un paramètre de taille cible et <KatexInline formula={String.raw`\lambda`} /> est une
					pénalité positive. La notation <KatexInline formula={String.raw`(x)_+ = \max(0, x)`} />
					pénalise les ensembles qui dépassent la taille <KatexInline formula={String.raw`k`} />. Cela
					permet d'éviter que le classifieur conforme n'ajoute systématiquement un grand nombre de
					classes à faible probabilité uniquement pour satisfaire marginalement la couverture,
					améliorant ainsi la lisibilité de la prédiction conforme.
				</p>
			{/snippet}
			<p>
				<em>(Exercice optionnel, au-delà du cours.)</em> Décrivez le mécanisme de régularisation du
				score « SAPS » (variante illustrative, non issue des notes) et expliquez comment
				l'introduction d'un paramètre de pénalité de taille modifie la composition des ensembles de
				prédiction conformes.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.7" title="Cas limite de la taille de calibration">
			{#snippet solution()}
				<p>
					Le rang du quantile empirique est donné par <KatexInline
						formula={String.raw`k = \lceil (n+1)(1-\alpha) \rceil`}
					/>. Si la taille de l'échantillon <KatexInline formula={String.raw`n`} /> vérifie <KatexInline
						formula={String.raw`n < \frac{1}{\alpha} - 1`}
					/>, on obtient <KatexInline
						formula={String.raw`(n+1)(1-\alpha) = n + 1 - (n+1)\alpha > n`}
					/>. Puisque le rang maximal possible est <KatexInline formula={String.raw`n`} /> pour l'échantillon
					de calibration, cela impose de prendre <KatexInline formula={String.raw`k = n+1`} />. Le
					seuil <KatexInline formula={String.raw`\hat{q}`} /> est alors égal à la valeur maximale possible
					du score de conformité. Par conséquent, l'ensemble de prédiction sera systématiquement l'ensemble
					de toutes les classes possibles pour garantir de manière conservatrice la couverture marginale.
				</p>
			{/snippet}
			<p>
				Montrez algébriquement ce qu'il se passe pour le calcul du quantile <KatexInline
					formula={String.raw`\hat{q}`}
				/> si le nombre de données de calibration <KatexInline formula={String.raw`n`} /> est strictement
				inférieur à <KatexInline formula={String.raw`1/\alpha - 1`} />. Quelle est la conséquence
				pratique sur les ensembles de prédiction ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.8" title="Comportement limite par rapport à alpha">
			{#snippet solution()}
				<p>
					Analysons les deux limites physiques de l'erreur autorisée <KatexInline
						formula={String.raw`\alpha`}
					/> :
				</p>
				<ul>
					<li>
						<strong
							>Quand <KatexInline formula={String.raw`\alpha \to 0`} /> (erreur nulle tolérée) :</strong
						>
						La couverture ciblée est de 100%. Le rang <KatexInline
							formula={String.raw`\lceil (n+1)(1-\alpha) \rceil \to n+1`}
						/>, ce qui pousse le quantile <KatexInline formula={String.raw`\hat{q}`} /> vers sa valeur
						maximale historique. L'ensemble conforme devient <KatexInline
							formula={String.raw`\mathcal{C}(x) = \mathcal{Y}`}
						/> pour tous les points de test.
					</li>
					<li>
						<strong
							>Quand <KatexInline formula={String.raw`\alpha \to 1`} /> (aucune garantie requise) :</strong
						>
						Le quantile requis tend vers le minimum de l'échantillon de calibration. Les ensembles conformes
						se réduisent à l'ensemble vide <KatexInline formula={String.raw`\emptyset`} /> (ou presque
						vide).
					</li>
				</ul>
			{/snippet}
			<p>
				Analysez et décrivez le comportement asymptotique des ensembles de prédiction conformes <KatexInline
					formula={String.raw`\mathcal{C}(x)`}
				/> dans les deux cas extrêmes : <KatexInline formula={String.raw`\alpha \to 0`} /> et <KatexInline
					formula={String.raw`\alpha \to 1`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.9" title="Couverture marginale vs couverture conditionnelle">
			{#snippet solution()}
				<p>
					La <strong>couverture marginale</strong> garantit que :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y_{\text{test}} \in \mathcal{C}(X_{\text{test}})) \ge 1 - \alpha`}
				/>
				<p>
					C'est une moyenne globale calculée sur toutes les réalisations conjointes possibles de <KatexInline
						formula={String.raw`X`}
					/> et <KatexInline formula={String.raw`Y`} />. La
					<strong>couverture conditionnelle</strong>
					exige que cette garantie tienne pour <em>chaque sous-groupe ou point individuel</em> de l'espace
					d'entrée :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y_{\text{test}} \in \mathcal{C}(X_{\text{test}}) \mid X_{\text{test}} = x) \ge 1 - \alpha \quad \forall x`}
				/>
				<p>
					La couverture marginale n'implique pas la couverture conditionnelle. Par exemple, un
					modèle peut avoir une couverture de 95% en moyenne en couvrant à 100% les zones faciles de
					l'espace d'entrée et à 0% les zones difficiles (comme les populations minoritaires).
				</p>
			{/snippet}
			<p>
				Expliquez mathématiquement pourquoi la garantie de couverture marginale fournie par la
				prédiction conforme n'implique pas nécessairement une couverture conditionnelle uniforme
				point par point sur tout l'espace d'entrée.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.10" title="Split Conformal vs Full Conformal">
			{#snippet solution()}
				<p>Comparatif entre les deux approches :</p>
				<ul>
					<li>
						<strong>Split Conformal :</strong> Sépare les données en d'entraînement et de calibration.
						Le modèle est entraîné une seule fois. Très rapide mais l'efficacité dépend de la taille de
						la partition de calibration.
					</li>
					<li>
						<strong>Full Conformal :</strong> Pour chaque nouveau point de test <KatexInline
							formula={String.raw`x`}
						/>, on tente d'attribuer successivement chaque classe possible <KatexInline
							formula={String.raw`y`}
						/>. On réentraîne le modèle complet sur <KatexInline
							formula={String.raw`\mathcal{D} \cup \{(x, y)\}`}
						/> pour recalculer les scores de conformité. C'est extrêmement coûteux (nécessite d'entraîner
						<KatexInline formula={String.raw`C`} /> modèles par point de test) mais cela utilise de manière
						optimale toutes les données disponibles.
					</li>
				</ul>
			{/snippet}
			<p>
				Comparez la méthode <em>Split Conformal</em> (conforme par séparation) et la méthode
				historique <em>Full Conformal</em> en termes de coût algorithmique de calcul et de conservation
				des données d'apprentissage.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.11" title="Invariance par transformation monotone">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`g`} /> une transformation strictement croissante appliquée
					aux scores. Le score révisé est <KatexInline formula={String.raw`S'_i = g(S_i)`} />. Comme
					la fonction conserve rigoureusement l'ordre des éléments :
				</p>
				<KatexBlock formula={String.raw`S_i \le S_j \iff g(S_i) \le g(S_j)`} />
				<p>
					Le quantile d'ordre <KatexInline formula={String.raw`1-\alpha`} /> des scores transformés sera
					exactement <KatexInline formula={String.raw`\hat{q}' = g(\hat{q})`} />. La condition
					d'inclusion dans l'ensemble conforme devient :
				</p>
				<KatexBlock
					formula={String.raw`c \in \mathcal{C}'(x) \iff g(s(x, c)) \le g(\hat{q}) \iff s(x, c) \le \hat{q} \iff c \in \mathcal{C}(x)`}
				/>
				<p>
					Le choix d'appliquer une transformation monotone strictement croissante aux scores n'a
					donc absolument aucune influence sur le résultat final de l'ensemble conforme.
				</p>
			{/snippet}
			<p>
				Démontrez que l'application d'une fonction strictement croissante <KatexInline
					formula={String.raw`g`}
				/> sur le score de conformité n'altère en rien la composition des ensembles de prédiction conformes
				finaux.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.12" title="Garantie sous décalage de covariables (Covariate Shift)">
			{#snippet solution()}
				<p>
					En cas de décalage de covariables (la distribution marginale <KatexInline
						formula={String.raw`P_X`}
					/> change entre l'apprentissage et le test mais pas la loi conditionnelle <KatexInline
						formula={String.raw`P_{Y|X}`}
					/>), les scores de calibration et de test ne sont plus échangeables. Tibshirani et al. ont
					proposé le <strong>Weighted Conformal Prediction</strong> : on calcule des poids
					d'importance <KatexInline formula={String.raw`w(x) = q(x)/p(x)`} /> (rapport des densités de
					test et de calibration). Le calcul du quantile empirique devient un quantile pondéré par ces
					coefficients de vraisemblance, ce qui permet de conserver une garantie exacte malgré le décalage.
				</p>
			{/snippet}
			<p>
				L'hypothèse d'échangeabilité tient-elle toujours en cas de décalage de covariables
				(Covariate Shift) ? Comment la méthode de prédiction conforme peut-elle être modifiée pour
				restaurer la garantie de couverture dans ce cadre ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.13" title="Exercice numérique pas à pas">
			{#snippet solution()}
				<p>Suivons rigoureusement les étapes de l'algorithme :</p>
				<ol>
					<li>
						Les scores de non-conformité de calibration sont : <KatexInline
							formula={String.raw`s_i = 1 - \hat{p}_{y_i}(x_i)`}
						/>.
					</li>
					<li>
						Valeurs obtenues : <KatexInline
							formula={String.raw`s = (0.2, 0.4, 0.35, 0.1, 0.85)`}
						/>.
					</li>
					<li>
						Ordonnons ces 5 scores : <KatexInline
							formula={String.raw`0.1 \le 0.2 \le 0.35 \le 0.4 \le 0.85`}
						/>.
					</li>
					<li>
						Le rang du quantile est <KatexInline
							formula={String.raw`k = \lceil (n+1)(1-\alpha) \rceil = \lceil (5+1)(0.80) \rceil = \lceil 4.8 \rceil = 5`}
						/>.
					</li>
					<li>
						Le score au rang 5 est la valeur maximale : <KatexInline
							formula={String.raw`\hat{q} = 0.85`}
						/>.
					</li>
					<li>
						On inclut les classes de test dont le score <KatexInline
							formula={String.raw`1 - p_c \le 0.85`}
						/>, soit <KatexInline formula={String.raw`p_c \ge 0.15`} />.
					</li>
					<li>
						Pour le point de test <KatexInline
							formula={String.raw`\hat{p}(x_{\text{test}}) = (0.7, 0.2, 0.1)`}
						/> : les classes 1 (0.7) et 2 (0.2) respectent cette condition. L'ensemble conforme est <KatexInline
							formula={String.raw`\mathcal{C}(x_{\text{test}}) = \{1, 2\}`}
						/>.
					</li>
				</ol>
			{/snippet}
			<p>
				Soit un ensemble de calibration indépendant de <KatexInline formula={String.raw`n = 5`} /> points
				avec les probabilités prédites pour la classe réelle suivantes : <KatexInline
					formula={String.raw`0.8, 0.6, 0.65, 0.9, 0.15`}
				/>. En fixant <KatexInline formula={String.raw`\alpha = 0.20`} /> et en employant le score simple
				<KatexInline formula={String.raw`1 - p_y`} />, calculez le seuil <KatexInline
					formula={String.raw`\hat{q}`}
				/> et déterminez l'ensemble de prédiction pour un point de test possédant les scores de confiance
				<KatexInline formula={String.raw`(0.70, 0.20, 0.10)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.14" title="Interprétation d'un ensemble de prédiction vide">
			{#snippet solution()}
				<p>
					L'ensemble conforme <KatexInline formula={String.raw`\mathcal{C}(x)`} /> est vide si et seulement
					si tous les scores de non-conformité possibles sont strictement supérieurs au seuil calibré
					: <KatexInline formula={String.raw`s(x, c) > \hat{q} \quad \forall c \in \mathcal{Y}`} />.
					Dans le cas du score simple, cela signifie que toutes les probabilités de classe sont très
					faibles : <KatexInline formula={String.raw`\hat{p}_c(x) < 1 - \hat{q}`} /> pour toutes les classes.
					C'est un signal d'alarme précieux : cela indique que le point de test <KatexInline
						formula={String.raw`x`}
					/> est atypique, se situe dans une zone d'incertitude extrême ou provient d'une distribution
					différente de celle d'entraînement (donnée hors-distribution ou OOD).
				</p>
			{/snippet}
			<p>
				Expliquez sous quelles conditions un ensemble de prédiction conforme peut se révéler vide et
				interprétez ce résultat du point de vue de la détection d'anomalies ou de données
				hors-distribution.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.15" title="Interprétation d'un ensemble contenant toutes les classes">
			{#snippet solution()}
				<p>
					À l'inverse de l'exercice précédent, l'ensemble contient toutes les classes si tous les
					scores possibles sont inférieurs au seuil <KatexInline formula={String.raw`\hat{q}`} />.
					Cela signifie que le modèle est incapable d'exclure une quelconque classe avec un niveau
					de confiance suffisant. C'est typique d'une zone de haute entropie (frontière de décision
					complexe entre de nombreuses classes) ou d'un modèle globalement très peu performant. Pour
					garantir la couverture de <KatexInline formula={String.raw`1-\alpha`} /> sur ce point, le système
					doit admettre qu'il n'en sait rien et proposer toutes les options.
				</p>
			{/snippet}
			<p>
				Expliquez à l'inverse quand un ensemble contient toutes les classes possibles <KatexInline
					formula={String.raw`\mathcal{C}(x) = \mathcal{Y}`}
				/> et comment interpréter cette situation pour l'utilisateur final.
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.16" title="Relation directe entre calibration et efficacité">
			{#snippet solution()}
				<p>
					Le théorème de couverture conforme garantit la validité (le taux de couverture de 95% est
					assuré) <em>même si le modèle de base est totalement décalibré ou faux</em>. Cependant, la
					<strong
						>qualité d'étalonnage du modèle influence l'efficacité (la taille des ensembles)</strong
					>. Si un modèle est bien calibré, ses probabilités reflètent fidèlement la réalité : ses
					prédictions correctes auront des confiances élevées, ce qui conduira à un seuil <KatexInline
						formula={String.raw`\hat{q}`}
					/> bas et donc à des ensembles conformes étroits (souvent réduits à un singleton). Un modèle
					mal calibré forcera la méthode conforme à élargir démesurément ses ensembles pour rattraper
					ses erreurs de confiance.
				</p>
			{/snippet}
			<p>
				Expliquez la phrase suivante : « La prédiction conforme garantit la validité de la
				couverture indépendamment de l'étalonnage du modèle de base, mais l'étalonnage de ce dernier
				régit l'efficacité de la méthode. »
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.17" title="Évaluation : Métriques de taille">
			{#snippet solution()}
				<p>
					Pour évaluer un système de prédiction conforme, on utilise principalement deux indicateurs
					d'efficacité :
				</p>
				<ul>
					<li>
						<strong>Taille moyenne (Average Set Size) :</strong>
						<KatexInline
							formula={String.raw`\text{Size}_{\text{avg}} = \frac{1}{M} \sum_{i=1}^M |\mathcal{C}(x_i)|`}
						/>. On cherche à la minimiser.
					</li>
					<li>
						<strong>Variance de la taille (Size Variance) :</strong> Mesure la dispersion de la taille
						des ensembles. Une variance élevée montre que le modèle adapte bien sa précision locale en
						distinguant les zones faciles (petits ensembles) des zones complexes (grands ensembles).
					</li>
				</ul>
			{/snippet}
			<p>
				Quelles sont les métriques quantitatives clés pour évaluer l'efficacité pratique d'une
				méthode de prédiction conforme en classification, au-delà de la simple vérification du taux
				de couverture ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.18" title="Gestion des égalités (scores identiques)">
			{#snippet solution()}
				<p>
					Lorsque les scores de conformité prennent des valeurs discrètes ou identiques, de
					nombreuses égalités peuvent se produire. Cela peut empêcher d'atteindre exactement le taux <KatexInline
						formula={String.raw`1-\alpha`}
					/> et rendre la méthode conservatrice. Pour y remédier, on introduit une
					<strong>randomisation auxiliaire</strong>
					: pour chaque point, on ajoute un petit bruit uniforme au score <KatexInline
						formula={String.raw`S_i' = S_i + U`}
					/> (avec <KatexInline formula={String.raw`U \sim \mathcal{U}(0, \epsilon)`} />), ou l'on
					tire aléatoirement l'inclusion de la classe frontière avec une probabilité calculée pour
					interpoler exactement le quantile. Cela permet de restaurer mathématiquement la garantie
					exacte de couverture.
				</p>
			{/snippet}
			<p>
				Pourquoi la présence de scores de conformité identiques (égalités) pose-t-elle un problème
				pour garantir une couverture exacte ? Comment les algorithmes conformes résolvent-ils ce cas
				?
			</p>
		</ExercisePanel>

		<ExercisePanel number="10.19" title="Vrai ou Faux : Prédiction Conforme">
			{#snippet solution()}
				<ol>
					<li>
						<strong>FAUX :</strong> C'est l'inverse. La prédiction conforme classique garantit une
						couverture <em>marginale</em> exacte, la couverture conditionnelle stricte étant impossible
						à garantir en échantillon fini sans hypothèses fortes supplémentaires sur la distribution.
					</li>
					<li>
						<strong>VRAI :</strong> L'hypothèse de base requise est uniquement l'échangeabilité des données,
						ce qui n'impose aucune contrainte de linéarité ou de régularité sur le modèle de prédiction.
					</li>
					<li>
						<strong>VRAI :</strong> En échantillon fini, le fait de réserver une partie des données pour
						la calibration prive le modèle d'une partie de sa base d'apprentissage, ce qui peut légèrement
						dégrader la performance globale du classifieur sous-jacent.
					</li>
					<li>
						<strong>FAUX :</strong> Si le modèle est parfait (oracle), les ensembles de prédiction conformes
						seront optimaux et de taille minimale, mais la garantie de couverture de 95% reste mathématiquement
						respectée dans tous les cas.
					</li>
				</ol>
			{/snippet}
			<p>Répondez par Vrai ou Faux en justifiant brièvement :</p>
			<ol>
				<li>
					La prédiction conforme classique garantit une couverture conditionnelle stricte pour tout
					point individuel <KatexInline formula={String.raw`x`} />.
				</li>
				<li>
					On peut appliquer la prédiction conforme sur un réseau de neurones boîte noire non
					linéaire ou sur une forêt aléatoire.
				</li>
				<li>
					Le Split Conformal souffre d'un compromis d'efficacité dû au fait que le modèle n'est pas
					entraîné sur l'intégralité des données disponibles.
				</li>
				<li>
					Si le modèle de base a un taux d'erreur de 50%, la prédiction conforme ne peut pas
					atteindre une couverture de 95%.
				</li>
			</ol>
		</ExercisePanel>

		<ExercisePanel number="10.20" title="Synthèse : Choix du score de conformité">
			{#snippet solution()}
				<table class="w-full text-center border my-2 text-sm">
					<thead>
						<tr class="bg-muted"
							><th>Score</th><th>Formule mathématique</th><th>Avantages</th><th>Limites</th></tr
						>
					</thead>
					<tbody>
						<tr>
							<td>Score simple</td>
							<td><KatexInline formula={String.raw`1 - p_y`} /></td>
							<td>Très simple à implémenter</td>
							<td>N'est pas adaptatif (seuil fixe global de probabilité)</td>
						</tr>
						<tr>
							<td>APS</td>
							<td>Somme triée des probabilités</td>
							<td>Totalement adaptatif, respecte la forme locale</td>
							<td>Peut inclure de nombreuses classes à très faible probabilité</td>
						</tr>
						<tr>
							<td>SAPS</td>
							<td>APS + pénalité de taille</td>
							<td>Évite d'inclure les classes non pertinentes (régularisé)</td>
							<td>Introduit deux hyperparamètres supplémentaires à régler</td>
						</tr>
					</tbody>
				</table>
			{/snippet}
			<p>
				Dressez un tableau récapitulatif comparant le score simple <KatexInline
					formula={String.raw`1-\hat{p}_y`}
				/>, le score cumulatif (APS) et le score cumulatif régularisé (SAPS) en indiquant leurs
				définitions, leurs forces et leurs faiblesses respectives.
			</p>
		</ExercisePanel>

		<!-- ════════════════════════ SECTION 11 ════════════════════════ -->
		<h2 id="prediction-conforme-regression">Régression Conforme</h2>
		<p>
			Cette section applique le principe de prédiction conforme au cas continu de la régression,
			pour construire des intervalles de confiance rigoureux (largeur constante, largeur adaptative
			par normalisation, ou CQR).
		</p>

		<ExercisePanel number="11.1" title="Dérivation de l'intervalle de largeur constante">
			{#snippet solution()}
				<p>
					Le score de conformité est le résidu absolu : <KatexInline
						formula={String.raw`S_i = |y_i - \hat{f}(x_i)|`}
					/>. Soit <KatexInline formula={String.raw`\hat{q}`} /> le quantile approprié de ces scores sur
					l'ensemble de calibration. Par définition, l'intervalle conforme est formé par les valeurs de
					<KatexInline formula={String.raw`y`} /> telles que :
				</p>
				<KatexBlock
					formula={String.raw`|y - \hat{f}(x)| \le \hat{q} \iff -\hat{q} \le y - \hat{f}(x) \le \hat{q} \iff \hat{f}(x) - \hat{q} \le y \le \hat{f}(x) + \hat{q}`}
				/>
				<p>
					On obtient ainsi l'intervalle symétrique : <KatexInline
						formula={String.raw`\mathcal{C}(x) = [\hat{f}(x) - \hat{q}, \hat{f}(x) + \hat{q}]`}
					/>. La largeur de cet intervalle est de <KatexInline formula={String.raw`2\hat{q}`} /> pour
					tout point <KatexInline formula={String.raw`x`} />, elle est donc parfaitement constante.
				</p>
			{/snippet}
			<p>
				En utilisant le score de conformité basé sur le résidu absolu <KatexInline
					formula={String.raw`s(x,y) = |y - \hat{f}(x)|`}
				/>, démontrez algébriquement que l'intervalle conforme résultant est un intervalle de
				largeur constante centré sur la prédiction du modèle.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.2" title="Garantie formelle en régression conforme">
			{#snippet solution()}
				<p>
					La garantie de couverture est identique au cas discret de la classification. Si les
					couples <KatexInline formula={String.raw`(X_i, Y_i)`} /> sont échangeables, alors les scores
					de résidus absolus de calibration et de test le sont également. On obtient donc exactement la
					même garantie à échantillon fini :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y_{\text{test}} \in [\hat{f}(X_{\text{test}}) - \hat{q}, \hat{f}(X_{\text{test}}) + \hat{q}]) \ge 1 - \alpha`}
				/>
				<p>
					Cette probabilité est définie de manière marginale sur le tirage de l'ensemble
					d'entraînement, de calibration et du couple de test.
				</p>
			{/snippet}
			<p>
				Énoncez formellement la garantie théorique de couverture obtenue pour l'intervalle de
				régression conforme de l'exercice 11.1 et précisez les hypothèses statistiques requises.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.3" title="Régression Quantile Conforme (CQR)">
			{#snippet solution()}
				<p>
					La CQR (Conformalized Quantile Regression) combine la régression quantile et la prédiction
					conforme. Au lieu d'un modèle de moyenne, on entraîne deux modèles de quantiles de base : <KatexInline
						formula={String.raw`\hat{q}_{\alpha/2}(x)`}
					/> et <KatexInline formula={String.raw`\hat{q}_{1-\alpha/2}(x)`} />. Le score de
					conformité mesure l'erreur par rapport à ces deux bornes :
				</p>
				<KatexBlock
					formula={String.raw`s(x, y) = \max\left( \hat{q}_{\alpha/2}(x) - y, \, y - \hat{q}_{1-\alpha/2}(x) \right)`}
				/>
				<p>
					Le score est négatif si la vraie valeur est déjà dans l'intervalle prédit par les
					quantiles bruts, et positif sinon. Le quantile conforme <KatexInline
						formula={String.raw`\hat{q}`}
					/> calculé sur ces scores sert de terme d'ajustement global appliqué aux bornes pour garantir
					la couverture exacte de <KatexInline formula={String.raw`1-\alpha`} />.
				</p>
			{/snippet}
			<p>
				Expliquez le principe de la méthode CQR (Conformalized Quantile Regression) de Romano et al.
				et donnez l'expression du score de conformité associé.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.4" title="CQR symétrique vs asymétrique">
			{#snippet solution()}
				<p>La CQR peut utiliser deux approches pour la calibration :</p>
				<ul>
					<li>
						<strong>Sémantique symétrique :</strong> Utilise un seul et unique score de
						non-conformité (défini à l'exercice 11.3) et applique le même décalage <KatexInline
							formula={String.raw`\hat{q}`}
						/> aux deux bornes.
					</li>
					<li>
						<strong>Sémantique asymétrique :</strong> Calcule séparément deux quantiles de
						non-conformité : un pour le dépassement de la borne supérieure (<KatexInline
							formula={String.raw`s_{\text{sup}} = y - \hat{q}_{1-\alpha/2}(x)`}
						/>) et un pour le dépassement de la borne inférieure (<KatexInline
							formula={String.raw`s_{\text{inf}} = \hat{q}_{\alpha/2}(x) - y`}
						/>). Cela produit deux termes d'ajustement distincts <KatexInline
							formula={String.raw`\hat{q}_{\text{sup}}`}
						/> et <KatexInline formula={String.raw`\hat{q}_{\text{inf}}`} />, permettant de corriger
						des biais systématiques asymétriques du modèle de régression quantile sous-jacent.
					</li>
				</ul>
			{/snippet}
			<p>
				Distinguez le fonctionnement d'une calibration CQR symétrique d'une calibration CQR
				asymétrique. Quel est l'intérêt d'une approche asymétrique ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.5" title="Score normalisé localement (Intervalle adaptatif)">
			{#snippet solution()}
				<p>
					Le score normalisé est <KatexInline
						formula={String.raw`s(x, y) = \frac{|y - \hat{f}(x)|}{\sigma(x) + \varepsilon}`}
					/>. Soit <KatexInline formula={String.raw`\hat{q}`} /> le quantile de ces scores sur l'ensemble
					de calibration. Le point <KatexInline formula={String.raw`y`} /> appartient à l'ensemble conforme
					si et seulement si :
				</p>
				<KatexBlock
					formula={String.raw`\frac{|y - \hat{f}(x)|}{\sigma(x) + \varepsilon} \le \hat{q} \iff |y - \hat{f}(x)| \le \hat{q} (\sigma(x) + \varepsilon)`}
				/>
				<p>L'intervalle de prédiction conforme s'écrit donc :</p>
				<KatexBlock
					formula={String.raw`\mathcal{C}(x) = \left[ \hat{f}(x) - \hat{q} (\sigma(x) + \varepsilon), \, \hat{f}(x) + \hat{q} (\sigma(x) + \varepsilon) \right]`}
				/>
				<p>
					La largeur de cet intervalle est de <KatexInline
						formula={String.raw`2 \hat{q} (\sigma(x) + \varepsilon)`}
					/>. Elle varie donc directement de manière proportionnelle à l'estimation locale du bruit
					de données <KatexInline formula={String.raw`\sigma(x)`} />.
				</p>
			{/snippet}
			<p>
				Soit un score de conformité normalisé localement : <KatexInline
					formula={String.raw`s(x,y) = \frac{|y - \hat{f}(x)|}{\sigma(x) + \varepsilon}`}
				/>, où <KatexInline formula={String.raw`\sigma(x)`} /> est un estimateur de l'écart-type local
				et <KatexInline formula={String.raw`\varepsilon > 0`} /> un terme de régularisation. Dérivez l'expression
				analytique de l'intervalle conforme adaptatif associé.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.6" title="Estimation de l'incertitude locale par Bootstrap">
			{#snippet solution()}
				<p>
					Pour estimer <KatexInline formula={String.raw`\sigma(x)`} />, on peut utiliser le
					bootstrap :
				</p>
				<ol>
					<li>
						On tire <KatexInline formula={String.raw`B`} /> échantillons de bootstrap de l'ensemble d'entraînement.
					</li>
					<li>
						On entraîne un modèle de régression <KatexInline formula={String.raw`f_b`} /> sur chaque échantillon.
					</li>
					<li>
						Pour un point <KatexInline formula={String.raw`x`} />, on calcule l'écart-type empirique
						des prédictions des modèles bootstrap :
					</li>
				</ol>
				<KatexBlock
					formula={String.raw`\sigma(x) = \sqrt{\frac{1}{B-1} \sum_{b=1}^B (f_b(x) - \bar{f}(x))^2}`}
				/>
				<p>
					Où <KatexInline formula={String.raw`\bar{f}(x) = \frac{1}{B}\sum f_b(x)`} /> est la prédiction
					moyenne de l'ensemble (bagging).
				</p>
			{/snippet}
			<p>
				Présentez le protocole d'estimation de la variance locale <KatexInline
					formula={String.raw`\sigma(x)`}
				/> en utilisant une approche par Bootstrap (Bagging) sur un modèle de régression arbitraire.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.7" title="Robustesse face à un mauvais estimateur d'incertitude">
			{#snippet solution()}
				<p>
					C'est une propriété majeure de la prédiction conforme : <strong
						>la garantie de couverture de 95% reste mathématiquement préservée</strong
					>, même si l'estimateur <KatexInline formula={String.raw`\sigma(x)`} /> de la variance est complètement
					faux ou biaisé (par exemple s'il s'agit d'une constante arbitraire ou de valeurs erronées).
					La seule conséquence d'un mauvais estimateur <KatexInline
						formula={String.raw`\sigma(x)`}
					/> est une <strong>perte d'efficacité (largeur sous-optimale)</strong> : l'intervalle sera
					trop large dans certaines zones et trop étroit dans d'autres, perdant sa capacité
					d'adaptation locale idéale, mais sans jamais violer la couverture marginale globale de <KatexInline
						formula={String.raw`1-\alpha`}
					/>.
				</p>
			{/snippet}
			<p>
				Si notre estimateur de l'incertitude locale <KatexInline formula={String.raw`\sigma(x)`} /> est
				de très mauvaise qualité, la garantie de couverture de l'intervalle conforme adaptatif de l'exercice
				11.5 est-elle compromise ? Qu'est-ce qui est affecté en pratique ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.8" title="Évaluation : Largeur moyenne de l'intervalle">
			{#snippet solution()}
				<p>
					L'efficacité de l'intervalle sur un échantillon de test de taille <KatexInline
						formula={String.raw`M`}
					/> se mesure par sa largeur moyenne :
				</p>
				<KatexBlock
					formula={String.raw`\text{Width}_{\text{avg}} = \frac{1}{M} \sum_{i=1}^M \left( \text{borne\_sup}(x_i) - \text{borne\_inf}(x_i) \right)`}
				/>
				<p>
					Pour l'intervalle constant de largeur <KatexInline formula={String.raw`2\hat{q}`} />, la
					largeur moyenne est simplement de <KatexInline formula={String.raw`2\hat{q}`} />. Pour
					l'intervalle adaptatif, elle vaut <KatexInline
						formula={String.raw`\frac{2\hat{q}}{M} \sum (\sigma(x_i) + \varepsilon)`}
					/>. À couverture égale (ex: 95%), la méthode la plus efficace est celle qui minimise cette
					largeur moyenne.
				</p>
			{/snippet}
			<p>
				Définissez mathématiquement la métrique de <strong>largeur moyenne</strong> de l'intervalle conforme
				et expliquez pourquoi elle constitue le critère principal d'efficacité à couverture fixe.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.9" title="Évaluation : Indice de couverture conditionnelle">
			{#snippet solution()}
				<p>
					Pour mesurer empiriquement si un intervalle adaptatif approche la couverture
					conditionnelle, on procède par partitionnement :
				</p>
				<ol>
					<li>
						On découpe l'espace des entrées en bins disjoints <KatexInline
							formula={String.raw`X_1, \dots, X_G`}
						/> (par exemple sur l'axe d'une variable ou selon la valeur de l'incertitude).
					</li>
					<li>
						On calcule le taux de couverture indépendant dans chaque groupe <KatexInline
							formula={String.raw`g`}
						/> : <KatexInline formula={String.raw`C_g`} />.
					</li>
					<li>
						On calcule l'écart quadratique moyen de couverture (Conditional Coverage Violations) :
					</li>
				</ol>
				<KatexBlock
					formula={String.raw`\text{CVV} = \frac{1}{G} \sum_{g=1}^G \left( C_g - (1-\alpha) \right)^2`}
				/>
				<p>
					Plus cet indice est proche de 0, plus la couverture est uniforme et proche de la
					couverture conditionnelle idéale.
				</p>
			{/snippet}
			<p>
				Concevez un protocole expérimental et formulez un indicateur mathématique permettant
				d'évaluer la qualité de la <strong>couverture conditionnelle</strong> d'une méthode de régression
				conforme.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.10" title="La méthode Jackknife+">
			{#snippet solution()}
				<p>
					Le Jackknife+ évite de scinder les données en entraînement et calibration en utilisant une
					approche de type validation croisée « leave-one-out » (LOO). Soit <KatexInline
						formula={String.raw`\hat{f}_{-i}`}
					/> le modèle entraîné en excluant le point <KatexInline formula={String.raw`i`} />, et les
					résidus associés <KatexInline formula={String.raw`R_i = |y_i - \hat{f}_{-i}(x_i)|`} />.
					Pour un nouveau point <KatexInline formula={String.raw`x`} />, l'intervalle construit est
					:
				</p>
				<KatexBlock
					formula={String.raw`\mathcal{C}_{\text{J}+}(x) = \left[ \min_i \left( \hat{f}_{-i}(x) - R_i \right) , \, \max_i \left( \hat{f}_{-i}(x) + R_i \right) \right]`}
				/>
				<p>
					Le théorème de Barber et al. démontre que cet intervalle garantit une couverture
					rigoureuse de <KatexInline formula={String.raw`1 - 2\alpha`} /> (souvent très proche de <KatexInline
						formula={String.raw`1-\alpha`}
					/> en pratique), sans exiger de partition de calibration séparée, au prix d'un coût de calcul
					élevé (réentraînement de <KatexInline formula={String.raw`n`} /> modèles).
				</p>
			{/snippet}
			<p>
				Présentez la formulation mathématique des intervalles de la méthode <strong
					>Jackknife+</strong
				> de Barber et al. et donnez sa garantie de couverture théorique.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.11" title="Comparaison : Jackknife-minmax vs Jackknife+">
			{#snippet solution()}
				<p>
					Le Jackknife-minmax est une version plus conservatrice du Jackknife+. L'intervalle se
					formule par :
				</p>
				<KatexBlock
					formula={String.raw`\mathcal{C}_{\text{minmax}}(x) = \left[ \min_j \hat{f}_{-j}(x) - q_{1-\alpha}, \, \max_j \hat{f}_{-j}(x) + q_{1-\alpha} \right]`}
				/>
				<p>
					Où <KatexInline formula={String.raw`q_{1-\alpha}`} /> est le quantile des résidus LOO. Cet intervalle
					est mathématiquement plus large ou égal à celui du Jackknife+, garantissant une couverture de
					<KatexInline formula={String.raw`1-\alpha`} /> totale mais au prix d'intervalles souvent trop
					conservateurs (trop larges) en pratique. Le Jackknife+ offre un bien meilleur compromis de taille.
				</p>
			{/snippet}
			<p>
				Comparez la méthode <em>Jackknife-minmax</em> et la méthode <em>Jackknife+</em> en termes de conservatisme
				des intervalles de prédiction produits.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.12" title="CV+ (Validation Croisée Conforme)">
			{#snippet solution()}
				<p>
					La méthode CV+ généralise le Jackknife+ au cadre du K-fold cross-validation pour réduire
					le coût computationnel. Au lieu de réentraîner <KatexInline formula={String.raw`n`} /> modèles
					(LOO), on n'en entraîne que <KatexInline formula={String.raw`K`} /> (typiquement <KatexInline
						formula={String.raw`K=5`}
					/> ou <KatexInline formula={String.raw`K=10`} />). Soit <KatexInline
						formula={String.raw`B(i)`}
					/> le bloc contenant le point <KatexInline formula={String.raw`i`} />, et <KatexInline
						formula={String.raw`\hat{f}_{-B(i)}`}
					/> le modèle entraîné sans ce bloc. Les résidus sont définis par <KatexInline
						formula={String.raw`R_i = |y_i - \hat{f}_{-B(i)}(x_i)|`}
					/>. La formule d'intervalle pour un point <KatexInline formula={String.raw`x`} /> reste la même
					que celle du Jackknife+, en remplaçant les modèles LOO par les modèles de bloc correspondants.
					Elle conserve la garantie théorique de couverture de <KatexInline
						formula={String.raw`1-2\alpha`}
					/>.
				</p>
			{/snippet}
			<p>
				Décrivez le principe de la méthode <strong>CV+</strong> (Cross-Validation Conforme) et expliquez
				pourquoi elle est computationnellement plus avantageuse que le Jackknife+.
			</p>
		</ExercisePanel>

		<ExercisePanel
			number="11.13"
			title="Impact d'un unique point aberrant (outlier) en calibration"
		>
			{#snippet solution()}
				<p>
					Dans le cadre de l'intervalle conforme de <strong>largeur constante</strong>, le seuil <KatexInline
						formula={String.raw`\hat{q}`}
					/> est calculé globalement sur tous les résidus. L'introduction d'un point aberrant (outlier)
					avec un résidu absolu colossal <KatexInline
						formula={String.raw`R_{\text{outlier}} \gg 0`}
					/> va décaler vers le haut la distribution empirique des résidus. Si la taille de l'échantillon
					<KatexInline formula={String.raw`n`} /> est faible ou si la proportion d'outliers est significative
					par rapport à <KatexInline formula={String.raw`\alpha`} />, le quantile <KatexInline
						formula={String.raw`\hat{q}`}
					/> va augmenter fortement. Comme l'intervalle est constant, tous les points de test recevront
					un intervalle artificiellement élargi, détériorant massivement l'efficacité globale pour s'adapter
					à une seule anomalie.
				</p>
			{/snippet}
			<p>
				Analysez l'impact de l'introduction d'un unique point aberrant (outlier) extrême dans
				l'ensemble de calibration sur la largeur des intervalles conformes constants de l'ensemble
				de test.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.14" title="Régression conforme multidimensionnelle">
			{#snippet solution()}
				<p>
					Si la cible <KatexInline formula={String.raw`Y \in \mathbb{R}^d`} />, l'ensemble conforme
					n'est plus un intervalle mais une région (par exemple une ellipse ou une boîte dans <KatexInline
						formula={String.raw`\mathbb{R}^d`}
					/>). On définit un score de non-conformité basé sur une norme (la distance euclidienne ou
					la distance de Mahalanobis) :
				</p>
				<KatexBlock formula={String.raw`s(x, y) = \|y - \hat{f}(x)\|_2`} />
				<p>
					Soit <KatexInline formula={String.raw`\hat{q}`} /> le quantile de ces scores. La région conforme
					de test est une boule de rayon <KatexInline formula={String.raw`\hat{q}`} /> centrée sur la
					prédiction vectorielle du modèle :
				</p>
				<KatexBlock
					formula={String.raw`\mathcal{C}(x) = \{ y \in \mathbb{R}^d \mid \|y - \hat{f}(x)\|_2 \le \hat{q} \}`}
				/>
				<p>
					Cette région garantit un taux de couverture marginal de <KatexInline
						formula={String.raw`1-\alpha`}
					/> en dimension <KatexInline formula={String.raw`d`} />.
				</p>
			{/snippet}
			<p>
				Comment peut-on étendre le cadre de la régression conforme pour traiter le cas d'une
				variable cible multidimensionnelle <KatexInline formula={String.raw`Y \in \mathbb{R}^d`} /> ?
				Proposez une formulation pour le score et la région géométrique conforme de test.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.15" title="Calibration locale par partitionnement (Binning)">
			{#snippet solution()}
				<p>
					La calibration locale par partitionnement (Binning Conformal Regression) procède ainsi :
				</p>
				<ol>
					<li>
						On sépare l'espace des entrées en <KatexInline formula={String.raw`M`} /> régions disjointes
						(bins) <KatexInline formula={String.raw`B_1, \dots, B_M`} />.
					</li>
					<li>On partitionne l'ensemble de calibration selon ces bins.</li>
					<li>
						On calcule de manière indépendante un quantile de calibration <KatexInline
							formula={String.raw`\hat{q}_m`}
						/> pour chaque bin <KatexInline formula={String.raw`B_m`} />.
					</li>
					<li>
						Pour un nouveau point <KatexInline formula={String.raw`x \in B_m`} />, l'intervalle est
						construit à l'aide du seuil local <KatexInline formula={String.raw`\hat{q}_m`} />.
					</li>
				</ol>
				<p>
					Cette méthode améliore grandement la couverture conditionnelle locale mais nécessite que
					chaque bin contienne suffisamment de points de calibration pour pouvoir calculer des
					quantiles stables.
				</p>
			{/snippet}
			<p>
				Décrivez le mécanisme de calibration locale par partitionnement (Binning) en régression et
				comparez ses avantages et limites par rapport à la calibration globale.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.16" title="Rôle de la constante de lissage epsilon">
			{#snippet solution()}
				<p>
					Le score normalisé s'écrit <KatexInline
						formula={String.raw`s(x,y) = |y - \hat{f}(x)| / (\sigma(x) + \varepsilon)`}
					/>. La constante <KatexInline formula={String.raw`\varepsilon > 0`} /> remplit deux rôles majeurs
					:
				</p>
				<ul>
					<li>
						<strong>Stabilité numérique :</strong> Elle empêche une division par zéro si
						l'estimateur de l'incertitude locale s'annule : <KatexInline
							formula={String.raw`\sigma(x) = 0`}
						/>.
					</li>
					<li>
						<strong>Régulation de l'incertitude :</strong> Si <KatexInline
							formula={String.raw`\varepsilon`}
						/> est très grand, la normalisation locale est atténuée et la largeur tend vers celle d'un
						intervalle constant. Si <KatexInline formula={String.raw`\varepsilon \to 0`} />,
						l'intervalle devient hyper-sensible aux faibles valeurs de <KatexInline
							formula={String.raw`\sigma(x)`}
						/>. C'est donc un paramètre de lissage contrôlant la transition entre intervalles
						constants et adaptatifs.
					</li>
				</ul>
			{/snippet}
			<p>
				Dans la formule du score normalisé localement, quel est le rôle mathématique et l'impact
				pratique du choix de la constante de lissage <KatexInline
					formula={String.raw`\varepsilon`}
				/> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.17" title="La métrique combinée CWC">
			{#snippet solution()}
				<p>
					La métrique CWC (Coverage Width-based Criterion) pénalise à la fois une mauvaise
					couverture et des intervalles trop larges :
				</p>
				<KatexBlock
					formula={String.raw`\text{CWC} = \text{Width}_{\text{avg}} \cdot \left( 1 + \gamma \cdot \mathbb{I}( \text{Cov} < 1-\alpha ) \cdot \exp(-\eta(\text{Cov} - (1-\alpha))) \right)`}
				/>
				<p>
					Où <KatexInline formula={String.raw`\text{Cov}`} /> est la couverture empirique et <KatexInline
						formula={String.raw`\gamma, \eta`}
					/> sont des paramètres de pénalité positifs. La CWC reste égale à la largeur moyenne tant que
					la couverture minimale de <KatexInline formula={String.raw`1-\alpha`} /> est respectée. Dès
					que la couverture descend en dessous de ce seuil critique, la CWC explose de manière exponentielle.
					Elle permet de pénaliser lourdement les modèles d'intervalles invalides.
				</p>
			{/snippet}
			<p>
				Définissez la métrique combinée <strong>CWC</strong> (Coverage Width-based Criterion) et expliquez
				pourquoi elle s'avère pertinente pour guider le choix d'un modèle d'intervalle.
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.18" title="Construction d'intervalles unilatéraux">
			{#snippet solution()}
				<p>
					Pour construire un intervalle unilatéral inférieur (par exemple pour garantir que la vraie
					valeur ne descend pas en dessous de la borne inférieure avec une probabilité <KatexInline
						formula={String.raw`1-\alpha`}
					/>), on adapte le score :
				</p>
				<KatexBlock formula={String.raw`s_{\text{unilat}}(x, y) = \hat{f}(x) - y`} />
				<p>
					Soit <KatexInline formula={String.raw`\hat{q}`} /> le quantile d'ordre <KatexInline
						formula={String.raw`1-\alpha`}
					/> de ces scores (non absolus) de calibration. Le point de test respectera la couverture si
					:
				</p>
				<KatexBlock
					formula={String.raw`\hat{f}(x) - y \le \hat{q} \iff y \ge \hat{f}(x) - \hat{q}`}
				/>
				<p>
					L'intervalle de prédiction conforme unilatéral est alors : <KatexInline
						formula={String.raw`\mathcal{C}(x) = [\hat{f}(x) - \hat{q}, \, +\infty[`}
					/>.
				</p>
			{/snippet}
			<p>
				Comment adapter le score de conformité et l'algorithme de régression conforme pour
				construire un intervalle <strong>unilatéral</strong> de la forme <KatexInline
					formula={String.raw`[\text{borne\_inf}(x), +\infty[`}
				/> avec une garantie de couverture de <KatexInline formula={String.raw`1-\alpha`} /> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="11.19" title="Vrai ou Faux : Régression Conforme">
			{#snippet solution()}
				<ol>
					<li>
						<strong>FAUX :</strong> L'erreur absolue mesure la dispersion moyenne des résidus bruts, tandis
						que la CQR cible directement les quantiles de la distribution conditionnelle, ce qui la rend
						beaucoup plus robuste et précise face aux asymétries et bruits hétéroscédastiques locaux.
					</li>
					<li>
						<strong>VRAI :</strong> Le théorème de validité conforme ne repose sur aucune hypothèse paramétrique
						concernant la distribution des erreurs (comme la normalité des résidus).
					</li>
					<li>
						<strong>FAUX :</strong> Bien que la garantie de couverture de <KatexInline
							formula={String.raw`1-2\alpha`}
						/> du Jackknife+ soit théoriquement plus faible que le <KatexInline
							formula={String.raw`1-\alpha`}
						/> classique, en pratique sa couverture observée est presque identique à <KatexInline
							formula={String.raw`1-\alpha`}
						/>, tout en évitant de diviser le jeu de données.
					</li>
					<li>
						<strong>VRAI :</strong> Si l'échangeabilité des données n'est pas vérifiée, la distribution
						des erreurs passées n'a aucune raison statistique de refléter les erreurs futures, invalidant
						ainsi les fondements mathématiques de la garantie conforme.
					</li>
				</ol>
			{/snippet}
			<p>Répondez par Vrai ou Faux en justifiant brièvement :</p>
			<ol>
				<li>
					La méthode CQR produit des intervalles identiques en tout point à la méthode de
					normalisation par écart-type absolue de l'erreur.
				</li>
				<li>
					La régression conforme offre des garanties valides même si les résidus ne suivent pas une
					loi normale.
				</li>
				<li>
					La méthode Jackknife+ produit des intervalles systématiquement deux fois plus larges que
					la méthode Split Conformal car sa garantie théorique est de <KatexInline
						formula={String.raw`1-2\alpha`}
					/> au lieu de <KatexInline formula={String.raw`1-\alpha`} />.
				</li>
				<li>
					Une rupture temporelle violant l'échangeabilité des données détruit la garantie
					mathématique de couverture de la régression conforme.
				</li>
			</ol>
		</ExercisePanel>

		<ExercisePanel number="11.20" title="Bilan : Comparatif des méthodes de régression">
			{#snippet solution()}
				<table class="w-full text-center border my-2 text-xs">
					<thead>
						<tr class="bg-muted"
							><th>Méthode</th><th>Score utilisé</th><th>Adaptabilité locale</th><th
								>Coût de calcul</th
							></tr
						>
					</thead>
					<tbody>
						<tr>
							<td>Largeur constante</td>
							<td><KatexInline formula={String.raw`|y - \hat{f}(x)|`} /></td>
							<td>Nulle (largeur uniforme)</td>
							<td>Très faible (un seul entraînement)</td>
						</tr>
						<tr>
							<td>Normalisation locale</td>
							<td
								><KatexInline
									formula={String.raw`\frac{|y - \hat{f}(x)|}{\sigma(x) + \varepsilon}`}
								/></td
							>
							<td>Moyenne (mise à l'échelle locale par l'écart-type)</td>
							<td>Moyen (entraînement du modèle de variance)</td>
						</tr>
						<tr>
							<td>CQR</td>
							<td
								><KatexInline
									formula={String.raw`\max(\hat{q}_{\alpha/2} - y, y - \hat{q}_{1-\alpha/2})`}
								/></td
							>
							<td>Maximale (s'adapte à la forme de la distribution locale)</td>
							<td>Moyen à élevé (deux régressions quantiles de base)</td>
						</tr>
					</tbody>
				</table>
			{/snippet}
			<p>
				Dressez un tableau récapitulatif comparant la régression conforme à largeur constante, la
				régression conforme normalisée localement et la CQR en fonction de leurs scores, de leur
				capacité d'adaptation locale et de leur coût de calcul.
			</p>
		</ExercisePanel>

		<!-- ════════════════════════ SECTION 12 ════════════════════════ -->
		<h2 id="classification-average-k">Classification Average-K (Conception)</h2>
		<p>
			La classification <strong>Average-K</strong> propose un cadre dual de la prédiction conforme.
			Au lieu de contraindre le risque d'erreur (conduire à une taille d'ensemble variable pour
			garantir une couverture de <KatexInline formula={String.raw`1-\alpha`} />), l'Average-K fixe
			de manière stricte la <strong>taille moyenne attendue</strong> de l'ensemble de prédiction
			(notée <KatexInline formula={String.raw`\kappa`} />) et cherche à minimiser le risque d'erreur
			sous cette contrainte. C'est un outil précieux pour calibrer des flux à bande passante fixe
			(ex: un opérateur humain qui traite exactement 2 prédictions en moyenne par dossier).
		</p>

		<Callout type="definition" title="Le cadre Average-K">
			Soit <KatexInline formula={String.raw`\mathcal{C}(X) \subseteq \mathcal{Y}`} /> un classifieur d'ensemble.
			On cherche à résoudre le problème d'optimisation sous contrainte :
			<KatexBlock
				formula={String.raw`\min_{\mathcal{C}} \mathbb{P}(Y \notin \mathcal{C}(X)) \quad \text{s.t.} \quad \mathbb{E}[|\mathcal{C}(X)|] \le \kappa`}
			/>
			où <KatexInline formula={String.raw`\kappa \ge 1`} /> est la contrainte sur le nombre moyen de classes
			suggérées.
		</Callout>

		<ExercisePanel number="12.1" title="Formalisation théorique et Lagrangien">
			{#snippet solution()}
				<p>
					La contrainte de taille s'écrit <KatexInline
						formula={String.raw`\mathbb{E}[|\mathcal{C}(X)|] \le \kappa`}
					/>. En introduisant un multiplicateur de Lagrange <KatexInline
						formula={String.raw`\lambda \ge 0`}
					/>, nous formulons le Lagrangien :
				</p>
				<KatexBlock
					formula={String.raw`\mathcal{L}(\mathcal{C}, \lambda) = \mathbb{P}(Y \notin \mathcal{C}(X)) + \lambda \left( \mathbb{E}[|\mathcal{C}(X)|] - \kappa \right)`}
				/>
				<p>
					Exprimons chaque terme en fonction des probabilités conditionnelles vraies <KatexInline
						formula={String.raw`\eta_c(x) = \mathbb{P}(Y=c|X=x)`}
					/>. La probabilité d'erreur s'écrit :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(Y \notin \mathcal{C}(X)) = 1 - \mathbb{P}(Y \in \mathcal{C}(X)) = 1 - \mathbb{E}_X\left[ \sum_{c=1}^C \eta_c(X) \mathbb{I}(c \in \mathcal{C}(X)) \right]`}
				/>
				<p>La taille attendue de l'ensemble s'exprime par :</p>
				<KatexBlock
					formula={String.raw`\mathbb{E}[|\mathcal{C}(X)|] = \mathbb{E}_X\left[ \sum_{c=1}^C \mathbb{I}(c \in \mathcal{C}(X)) \right]`}
				/>
				<p>En injectant ces deux expressions dans le Lagrangien, on obtient :</p>
				<KatexBlock
					formula={String.raw`\mathcal{L}(\mathcal{C}, \lambda) = 1 - \lambda\kappa + \mathbb{E}_X \left[ \sum_{c=1}^C (\lambda - \eta_c(X)) \mathbb{I}(c \in \mathcal{C}(X)) \right]`}
				/>
				<p>
					Cette réécriture décompose magnifiquement le problème global en une somme d'optimisations
					locales, point par point.
				</p>
			{/snippet}
			<p>
				Formulez le problème d'optimisation de la classification Average-K sous la forme d'un
				Lagrangien avec un multiplicateur de Lagrange <KatexInline
					formula={String.raw`\lambda \ge 0`}
				/>. Montrez que minimiser ce Lagrangien équivaut à minimiser l'expression :
				<KatexBlock
					formula={String.raw`\mathbb{E}_X \left[ \sum_{c=1}^C (\lambda - \eta_c(X)) \mathbb{I}(c \in \mathcal{C}(X)) \right]`}
				/>
			</p>
		</ExercisePanel>

		<ExercisePanel number="12.2" title="Dérivation du classifieur optimal (Seuil)">
			{#snippet solution()}
				<p>
					L'expression trouvée à l'exercice 12.1 s'optimise en minimisant le terme à l'intérieur de
					l'espérance pour chaque réalisation de <KatexInline formula={String.raw`X=x`} /> de manière
					indépendante. Pour un <KatexInline formula={String.raw`x`} /> donné, nous voulons choisir l'état
					de chaque variable d'inclusion <KatexInline
						formula={String.raw`\mathbb{I}(c \in \mathcal{C}(x)) \in \{0, 1\}`}
					/> afin de minimiser la somme :
				</p>
				<KatexBlock
					formula={String.raw`\sum_{c=1}^C (\lambda - \eta_c(x)) \mathbb{I}(c \in \mathcal{C}(x))`}
				/>
				<p>
					Chaque terme de cette somme est indépendant. Pour minimiser la somme, nous devons activer
					l'indicateur (choisir <KatexInline formula={String.raw`1`} />) si et seulement si son
					coefficient associé est strictement négatif :
				</p>
				<KatexBlock formula={String.raw`\lambda - \eta_c(x) < 0 \iff \eta_c(x) > \lambda`} />
				<p>
					En cas d'égalité <KatexInline formula={String.raw`\eta_c(x) = \lambda`} />, le choix
					n'affecte pas la valeur de la somme. Nous en déduisons la règle de décision optimale du
					classifieur Average-K :
				</p>
				<KatexBlock
					formula={String.raw`\mathcal{C}_\lambda^*(x) = \{ c \in \mathcal{Y} \mid \eta_c(x) \ge \lambda \}`}
				/>
				<p>
					C'est un résultat remarquable : le classifieur optimal est un <strong
						>classifieur de seuil</strong
					>
					où la probabilité a posteriori doit dépasser exactement la valeur du multiplicateur de Lagrange
					<KatexInline formula={String.raw`\lambda`} />.
				</p>
			{/snippet}
			<p>
				En minimisant point par point l'espérance obtenue à l'exercice 12.1, démontrez que le
				classifieur d'ensemble optimal <KatexInline
					formula={String.raw`\mathcal{C}^*_\lambda(x)`}
				/> est un classifieur basé sur un seuillage des probabilités conditionnelles réelles, où le seuil
				est exactement égal à <KatexInline formula={String.raw`\lambda`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="12.3" title="Définition de la fonction de taille attendue">
			{#snippet solution()}
				<p>
					Soit la fonction <KatexInline
						formula={String.raw`G(\lambda) = \mathbb{E}[|\mathcal{C}_\lambda^*(X)|]`}
					/>. En remplaçant par l'expression du classifieur optimal de seuil :
				</p>
				<KatexBlock
					formula={String.raw`G(\lambda) = \mathbb{E}_X\left[ \sum_{c=1}^C \mathbb{I}(\eta_c(X) \ge \lambda) \right] = \sum_{c=1}^C \mathbb{P}(\eta_c(X) \ge \lambda)`}
				/>
				<p>
					Pour tout <KatexInline formula={String.raw`\lambda_1 \le \lambda_2`} />, l'événement <KatexInline
						formula={String.raw`\{\eta_c(X) \ge \lambda_2\} \subseteq \{\eta_c(X) \ge \lambda_1\}`}
					/>. Par monotonicité de la mesure de probabilité, nous avons donc :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{P}(\eta_c(X) \ge \lambda_2) \le \mathbb{P}(\eta_c(X) \ge \lambda_1) \quad \forall c`}
				/>
				<p>
					En sommant ces inégalités, on prouve que <KatexInline
						formula={String.raw`G(\lambda_2) \le G(\lambda_1)`}
					/>. La fonction de taille moyenne attendue <KatexInline
						formula={String.raw`G(\lambda)`}
					/> est donc une <strong>fonction monotone non-croissante</strong> du seuil <KatexInline
						formula={String.raw`\lambda`}
					/>.
				</p>
			{/snippet}
			<p>
				Définissez la fonction <KatexInline formula={String.raw`G(\lambda)`} /> représentant la taille
				moyenne attendue de l'ensemble optimal en fonction du seuil <KatexInline
					formula={String.raw`\lambda`}
				/>. Démontrez que cette fonction est monotone non-croissante sur l'intervalle <KatexInline
					formula={String.raw`[0, 1]`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="12.4" title="Optimalité de lambda via fonction de répartition inverse">
			{#snippet solution()}
				<p>
					Pour respecter exactement la contrainte de budget <KatexInline
						formula={String.raw`\mathbb{E}[|\mathcal{C}(X)|] \le \kappa`}
					/>, nous voulons trouver le plus petit seuil <KatexInline formula={String.raw`\lambda`} /> (pour
					inclure le plus de classes possibles et donc minimiser l'erreur) tel que la taille ne dépasse
					pas <KatexInline formula={String.raw`\kappa`} />. Cela correspond mathématiquement à
					définir le seuil optimal par :
				</p>
				<KatexBlock
					formula={String.raw`\lambda^* = \inf \{ \lambda \in [0, 1] \mid G(\lambda) \le \kappa \}`}
				/>
				<p>
					Puisque <KatexInline
						formula={String.raw`G(\lambda) = \sum \mathbb{P}(\eta_c(X) \ge \lambda)`}
					/>, <KatexInline formula={String.raw`G`} /> est une somme de fonctions de survie (compléments
					à 1 de la fonction de répartition cumulative CDF). La formulation de <KatexInline
						formula={String.raw`\lambda^*`}
					/> est donc rigoureusement la définition de la
					<strong
						>fonction de répartition cumulative inverse généralisée (ou fonction quantile)</strong
					> de la distribution globale des probabilités du modèle.
				</p>
			{/snippet}
			<p>
				Expliquez comment le seuil optimal <KatexInline formula={String.raw`\lambda^*`} /> satisfaisant
				la contrainte de taille <KatexInline formula={String.raw`\kappa`} /> se déduit de <KatexInline
					formula={String.raw`G`}
				/> et faites le lien mathématique avec l'inversion d'une fonction de répartition cumulative (CDF).
			</p>
		</ExercisePanel>

		<ExercisePanel number="12.5" title="Comparaison philosophique : Conforme vs Average-K">
			{#snippet solution()}
				<p>Comparaison des deux approches :</p>
				<table class="w-full text-center border my-2 text-xs">
					<thead>
						<tr class="bg-muted"
							><th>Caractéristique</th><th>Prédiction Conforme</th><th>Classification Average-K</th
							></tr
						>
					</thead>
					<tbody>
						<tr>
							<td><strong>Variable contrôlée</strong></td>
							<td>Le risque d'erreur (borné par <KatexInline formula={String.raw`\alpha`} />)</td>
							<td
								>La taille moyenne attendue (bornée par <KatexInline
									formula={String.raw`\kappa`}
								/>)</td
							>
						</tr>
						<tr>
							<td><strong>Comportement par point</strong></td>
							<td>Taille d'ensemble hautement variable selon l'incertitude locale</td>
							<td
								>Seuil de confiance rigoureusement uniforme (<KatexInline
									formula={String.raw`\lambda`}
								/>)</td
							>
						</tr>
						<tr>
							<td><strong>Cas d'usage idéal</strong></td>
							<td>Systèmes critiques exigeant des garanties de sécurité absolues</td>
							<td>Flux opérationnels industriels avec contrainte de ressources</td>
						</tr>
					</tbody>
				</table>
			{/snippet}
			<p>
				Résumez de manière conceptuelle et philosophique la différence fondamentale entre le cadre
				de la prédiction conforme (contrôle du risque, taille d'ensemble variable) et celui de la
				classification Average-K (contrôle des ressources, risque d'erreur variable).
			</p>
		</ExercisePanel>
	</TheorySection>
</PageTemplate>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}
	th,
	td {
		border: 1px solid var(--state-error-border, #ddd);
		padding: 8px;
	}
</style>
