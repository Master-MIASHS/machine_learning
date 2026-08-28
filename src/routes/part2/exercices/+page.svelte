<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part2/exercices');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	const tocEntries: TocEntry[] = [
		{
			id: 'aggregation-bagging',
			label: 'Agrégation et Bagging',
			description: "Variance d'un ensemble, vote majoritaire, BMA, Bootstrap, OOB",
			color: 'epistemic'
		},
		{
			id: 'forets-aleatoires',
			label: 'Forêts Aléatoires',
			description:
				"Corrélation d'arbres, division optimale restreinte, Gini, importance des variables",
			color: 'positive'
		},
		{
			id: 'boosting',
			label: 'Boosting',
			description: 'AdaBoost, perte exponentielle, marges, GBDT, pseudo-résidus',
			color: 'surprise'
		},
		{
			id: 'regularisation',
			label: 'Régularisation L1 & L2',
			description: 'Biais-variance, Ridge, Lasso, Elastic Net, optimisation',
			color: 'agent'
		}
	];

	// --- Math Formulas Variables for Clean Template Rendering ---
	// Lesson 5
	const f51 = String.raw`\text{Var}\left(\frac{1}{m}\sum_{j=1}^m \hat{y}_j(X)\right) = \frac{\sigma^2}{m}`;
	const f52 = String.raw`\text{Var}(\hat{y}(X)) = \rho \sigma^2 + \frac{1-\rho}{m} \sigma^2`;
	const f55 = String.raw`P\left(\sum_{j=1}^m \mathbb{I}(h_j(x) \neq y) \ge \frac{m}{2}\right) \le e^{-2m(1/2 - e)^2}`;

	const f75 = String.raw`E_t \le \prod_{t=1}^T Z_t = \prod_{t=1}^T 2\sqrt{\epsilon_t(1 - \epsilon_t)}`;

	// Lesson 8
	const f81 = String.raw`\mathbb{E}[(y - \hat{f}(x))^2] = \text{Biais}(\hat{f}(x))^2 + \text{Var}(\hat{f}(x)) + \sigma^2`;
	const f83 = String.raw`\hat{w}_{\text{Ridge}} = (X^\top X + n\lambda I)^{-1}X^\top y`;
	const f85 = String.raw`S_{\gamma}(z) = \text{sign}(z)\max(|z| - \gamma, 0)`;
</script>

<svelte:head>
	<title>{meta?.title ?? 'Exercices'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	prev={prevMeta}
	next={nextMeta}
	title={meta?.title ?? 'Exercices — Boosting et régularisation'}
	subtitle="Entraînement sur bagging, forêts aléatoires, boosting et régularisation L1/L2"
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<!-- ==========================================
         SECTION 5: AGRÉGATION ET BAGGING
         ========================================== -->
		<h2 id="aggregation-bagging">Agrégation et Bagging</h2>
		<p>
			Cette section aborde la réduction de variance par combinaison de modèles, le vote majoritaire,
			le bootstrap et le principe du Bagging.
		</p>

		<ExercisePanel number="5.1" title="Réduction théorique de la variance">
			{#snippet solution()}
				<p>
					Puisque les estimateurs <KatexInline formula={String.raw`\hat{y}_j(X)`} /> sont supposés indépendants
					et de même variance <KatexInline formula={String.raw`\sigma^2`} />, nous appliquons
					directement les propriétés de la variance pour des variables indépendantes :
				</p>
				<KatexBlock
					formula={String.raw`\text{Var}(\hat{y}_{\text{agg}}(X)) = \text{Var}\left(\frac{1}{m}\sum_{j=1}^m \hat{y}_j(X)\right) = \frac{1}{m^2} \sum_{j=1}^m \text{Var}(\hat{y}_j(X)) = \frac{1}{m^2} (m\sigma^2) = \frac{\sigma^2}{m}`}
				/>
				<p>
					La variance de l'agrégat décroît donc de manière strictement linéaire avec le nombre de
					modèles <KatexInline formula={String.raw`m`} />.
				</p>
			{/snippet}
			<p>
				Démontrez la formule <KatexInline formula={f51} /> pour un ensemble de <KatexInline
					formula={String.raw`m`}
				/> prédicteurs non biaisés, indépendants et de même variance <KatexInline
					formula={String.raw`\sigma^2`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.2" title="Agrégation avec erreurs corrélées">
			{#snippet solution()}
				<p>En développant la variance d'une somme de variables aléatoires corrélées :</p>
				<KatexBlock
					formula={String.raw`\text{Var}\left(\frac{1}{m}\sum_j \hat{y}_j\right) = \frac{1}{m^2} \left[ \sum_j \text{Var}(\hat{y}_j) + \sum_{j \neq k} \text{Cov}(\hat{y}_j, \hat{y}_k) \right]`}
				/>
				<p>
					Puisque <KatexInline formula={String.raw`\text{Var}(\hat{y}_j) = \sigma^2`} /> et que la corrélation
					est <KatexInline
						formula={String.raw`\rho = \text{Cov}(\hat{y}_j, \hat{y}_k)/\sigma^2`}
					/>, nous avons <KatexInline
						formula={String.raw`\text{Cov}(\hat{y}_j, \hat{y}_k) = \rho\sigma^2`}
					/>. Le nombre de termes croisés dans la double somme est <KatexInline
						formula={String.raw`m(m-1)`}
					/>. Ainsi :
				</p>
				<KatexBlock
					formula={String.raw`\text{Var}(\hat{y}(X)) = \frac{1}{m^2} \left[ m\sigma^2 + m(m-1)\rho\sigma^2 \right] = \frac{\sigma^2}{m} + \frac{m-1}{m}\rho\sigma^2 = \rho\sigma^2 + \frac{1-\rho}{m}\sigma^2`}
				/>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`m`} /> prédicteurs de variance identique <KatexInline
					formula={String.raw`\sigma^2`}
				/> mais corrélés entre eux d'un facteur constant <KatexInline
					formula={String.raw`\rho \in (0, 1)`}
				/>. Établissez la formule :
				<KatexBlock formula={f52} />
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.3" title="Limite asymptotique d'agrégation">
			{#snippet solution()}
				<p>
					En prenant la limite quand <KatexInline formula={String.raw`m \to \infty`} /> dans la formule
					de l'exercice précédent :
				</p>
				<KatexBlock
					formula={String.raw`\lim_{m \to \infty} \left( \rho \sigma^2 + \frac{1-\rho}{m} \sigma^2 \right) = \rho \sigma^2 + 0 = \rho \sigma^2`}
				/>
				<p>
					<strong>Interprétation :</strong> Même avec une infinité de modèles agrégés, la variance
					ne peut pas descendre en dessous du seuil <KatexInline
						formula={String.raw`\rho\sigma^2`}
					/>. C'est la raison pour laquelle le Bagging cherche à construire des arbres les plus
					décorrélés possibles (ce qui sera maximisé par les Forêts Aléatoires).
				</p>
			{/snippet}
			<p>
				En utilisant le résultat de l'exercice 5.2, calculez la limite de la variance de l'ensemble
				lorsque <KatexInline formula={String.raw`m \to \infty`} /> et interprétez physiquement le rôle
				de la corrélation <KatexInline formula={String.raw`\rho`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.4" title="Probabilité de succès du vote majoritaire">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`Y_j = \mathbb{I}(h_j(x) = y)`} /> la variable indiquant
					si le classifieur <KatexInline formula={String.raw`j`} /> est correct. <KatexInline
						formula={String.raw`Y_j \sim \mathcal{B}(1-e)`}
					/> avec <KatexInline formula={String.raw`1-e = 0.65`} />. Le vote majoritaire de <KatexInline
						formula={String.raw`m=3`}
					/> classifieurs est correct si au moins <KatexInline formula={String.raw`2`} /> d'entre eux
					prennent la bonne décision. La probabilité de succès est :
				</p>
				<KatexBlock
					formula={String.raw`P(S \ge 2) = \binom{3}{2} (0.65)^2 (0.35)^1 + \binom{3}{3} (0.65)^3 = 3 \times 0.4225 \times 0.35 + 0.274625 = 0.443625 + 0.274625 = 0.71825`}
				/>
				<p>
					La probabilité d'erreur de l'ensemble est donc <KatexInline
						formula={String.raw`1 - 0.71825 = 0.28175`}
					/> (soit <KatexInline formula={String.raw`28.18\%`} />), ce qui est inférieur à l'erreur
					individuelle de <KatexInline formula={String.raw`35\%`} />.
				</p>
			{/snippet}
			<p>
				On dispose de <KatexInline formula={String.raw`m = 3`} /> classifieurs binaires indépendants ayant
				chacun un taux d'erreur de <KatexInline formula={String.raw`e = 0.35`} />. Calculez la
				probabilité exacte que le vote majoritaire commette une erreur.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.5" title="Borne de Hoeffding pour le vote majoritaire">
			{#snippet solution()}
				<p>
					Notons <KatexInline formula={String.raw`X_j = \mathbb{I}(h_j(x) \neq y)`} /> avec <KatexInline
						formula={String.raw`\mathbb{E}[X_j] = e < 0.5`}
					/>. L'erreur majoritaire survient si <KatexInline
						formula={String.raw`\frac{1}{m}\sum X_j \ge \frac{1}{2}`}
					/>. En écrivant cela sous forme de déviation par rapport à la moyenne :
				</p>
				<KatexBlock
					formula={String.raw`P\left(\frac{1}{m}\sum_{j=1}^m X_j - e \ge \frac{1}{2} - e\right) \le \exp\left(-2m\left(\frac{1}{2} - e\right)^2\right)`}
				/>
				<p>
					Puisque <KatexInline formula={String.raw`e < 0.5`} />, le terme <KatexInline
						formula={String.raw`1/2 - e`}
					/> est strictement positif, assurant que la probabilité d'erreur décroît exponentiellement vers
					0 à mesure que <KatexInline formula={String.raw`m \to \infty`} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={String.raw`m`} /> classifieurs indépendants ayant le même taux d'erreur
				<KatexInline formula={String.raw`e < 0.5`} />. En utilisant l'inégalité de Hoeffding,
				démontrez la borne <KatexInline formula={f55} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.6" title="BMA : Calcul de probabilité a posteriori">
			{#snippet solution()}
				<p>
					Par le théorème de Bayes, la probabilité a posteriori de chaque modèle est proportionnelle
					à sa vraisemblance multipliée par sa probabilité a priori :
				</p>
				<KatexBlock
					formula={String.raw`P(\mathcal{M}_1 | S_n) = \frac{P(S_n | \mathcal{M}_1) P(\mathcal{M}_1)}{P(S_n | \mathcal{M}_1) P(\mathcal{M}_1) + P(S_n | \mathcal{M}_2) P(\mathcal{M}_2)}`}
				/>
				<p>
					Puisque <KatexInline formula={String.raw`P(\mathcal{M}_1) = P(\mathcal{M}_2) = 0.5`} />,
					ces poids a priori s'annulent :
				</p>
				<KatexBlock
					formula={String.raw`P(\mathcal{M}_1 | S_n) = \frac{0.08}{0.08 + 0.02} = 0.8 \qquad \text{et} \qquad P(\mathcal{M}_2 | S_n) = 0.2`}
				/>
				<p>
					La prédiction finale par BMA est donc :
					<KatexInline
						formula={String.raw`y_{\text{BMA}} = 0.8 \times 12 + 0.2 \times 15 = 9.6 + 3.0 = 12.6`}
					/>.
				</p>
			{/snippet}
			<p>
				Dans un cadre de Bayesian Model Averaging (BMA), on considère deux modèles <KatexInline
					formula={String.raw`\mathcal{M}_1`}
				/> et <KatexInline formula={String.raw`\mathcal{M}_2`} /> équiprobables a priori. Leurs vraisemblances
				pour les données observées sont <KatexInline
					formula={String.raw`P(S_n|\mathcal{M}_1) = 0.08`}
				/> et <KatexInline formula={String.raw`P(S_n|\mathcal{M}_2) = 0.02`} />. Leurs prédictions
				pour un point donné sont <KatexInline formula={String.raw`12`} /> et <KatexInline
					formula={String.raw`15`}
				/>. Calculez les poids a posteriori des modèles ainsi que la prédiction BMA finale.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.7" title="Stabilité numérique du BMA par Log-Sum-Exp">
			{#snippet solution()}
				<p>
					Les vraisemblances <KatexInline formula={String.raw`P(S_n|\mathcal{M}_j)`} /> sont souvent extrêmement
					proches de 0 sur de grands échantillons, ce qui provoque un "underflow" numérique (arrondi à
					0 par la machine). En passant en échelle logarithmique :
				</p>
				<KatexBlock
					formula={String.raw`\log P(\mathcal{M}_j|S_n) = \log P(S_n|\mathcal{M}_j) + \log P(\mathcal{M}_j) - \log \sum_k e^{\log P(S_n|\mathcal{M}_k) + \log P(\mathcal{M}_k)}`}
				/>
				<p>
					Le calcul du dénominateur se fait via la fonction stable <KatexInline
						formula={String.raw`\text{logsumexp}(x_1, \ldots, x_M) = x_{\max} + \log \sum e^{x_i - x_{\max}}`}
					/>, évitant ainsi tout dépassement de capacité numérique.
				</p>
			{/snippet}
			<p>
				Pourquoi est-il crucial, lors de l'implémentation pratique du BMA, de calculer les poids via
				l'opérateur logarithmique <KatexInline formula={String.raw`\text{logsumexp}`} /> ? Formulez l'expression
				mathématique de ce calcul stabilisé.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.8" title="Bootstrap : Probabilité théorique d'inclusion">
			{#snippet solution()}
				<p>
					1. À chaque tirage avec remise, la probabilité de ne pas sélectionner un exemple
					spécifique <KatexInline formula={String.raw`x_i`} /> est <KatexInline
						formula={String.raw`1 - 1/N`}
					/>.
				</p>
				<p>
					2. Les <KatexInline formula={String.raw`N`} /> tirages étant indépendants, la probabilité qu'il
					ne soit jamais sélectionné est <KatexInline formula={String.raw`(1 - 1/N)^N`} />.
				</p>
				<p>
					3. Par définition de la fonction exponentielle, <KatexInline
						formula={String.raw`\lim_{N \to \infty} (1 - 1/N)^N = e^{-1} \approx 0.368`}
					/>.
				</p>
				<p>
					4. La probabilité d'inclusion d'un exemple dans l'échantillon bootstrap est donc le
					complémentaire : <KatexInline formula={String.raw`1 - e^{-1} \approx 0.632`} /> (soit environ
					<KatexInline formula={String.raw`63.2\%`} />).
				</p>
			{/snippet}
			<p>
				Démontrez que la probabilité pour qu'une observation donnée de la base initiale de taille <KatexInline
					formula={String.raw`N`}
				/> ne figure <em>pas</em> dans un échantillon Bootstrap de taille <KatexInline
					formula={String.raw`N`}
				/> tend vers <KatexInline formula={String.raw`1/e`} /> lorsque <KatexInline
					formula={String.raw`N \to \infty`}
				/>. En déduire le pourcentage attendu de données uniques présentes dans un échantillon
				bootstrap.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.9" title="Taux d'inclusion exact pour petit N">
			{#snippet solution()}
				<p>
					Calculons la valeur exacte de la probabilité d'exclusion <KatexInline
						formula={String.raw`P_{\text{excl}} = (1 - 1/N)^N`}
					/> pour différentes tailles :
				</p>
				<ul>
					<li>
						Pour <KatexInline formula={String.raw`N=2`} /> : <KatexInline
							formula={String.raw`(1/2)^2 = 0.250 \implies P_{\text{incl}} = 75.0\%`}
						/>.
					</li>
					<li>
						Pour <KatexInline formula={String.raw`N=5`} /> : <KatexInline
							formula={String.raw`(4/5)^5 = 0.32768 \implies P_{\text{incl}} = 67.23\%`}
						/>.
					</li>
					<li>
						Pour <KatexInline formula={String.raw`N=10`} /> : <KatexInline
							formula={String.raw`(9/10)^{10} = 0.34868 \implies P_{\text{incl}} = 65.13\%`}
						/>.
					</li>
				</ul>
				<p>
					On constate que même pour de très petites valeurs de <KatexInline
						formula={String.raw`N`}
					/>, l'approximation asymptotique de <KatexInline formula={String.raw`63.2\%`} /> est rapidement
					atteinte.
				</p>
			{/snippet}
			<p>
				Calculez la probabilité exacte d'inclusion d'une observation donnée dans un échantillon
				bootstrap pour <KatexInline formula={String.raw`N = 2`} />, <KatexInline
					formula={String.raw`N = 5`}
				/> et <KatexInline formula={String.raw`N = 10`} />. Comparez avec la limite asymptotique.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.10" title="Rôle des arbres profonds dans le Bagging">
			{#snippet solution()}
				<p>
					Le Bagging réduit la variance de l'ensemble par moyennage, mais n'affecte pas (ou très
					peu) le biais. Pour maximiser la performance :
				</p>
				<ul>
					<li>
						On utilise des modèles à <strong>faible biais</strong> (très profonds, surappris), qui
						ont naturellement une <strong>forte variance</strong>.
					</li>
					<li>
						Le processus d'agrégation élimine cette forte variance par moyennage, fournissant au
						final un modèle à la fois peu biaisé et peu variant.
					</li>
				</ul>
			{/snippet}
			<p>
				Expliquez pourquoi il est recommandé d'utiliser des arbres de décision de grande profondeur
				(sans élagage) comme modèles de base dans le cadre du Bagging, plutôt que des arbres très
				simplifiés (stumps).
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.11" title="Erreur Out-of-Bag (OOB) vs Validation Croisée">
			{#snippet solution()}
				<p>
					<strong>Différences majeures :</strong>
				</p>
				<ul>
					<li>
						<strong>Coût computationnel :</strong> La validation croisée nécessite de ré-entraîner <KatexInline
							formula={String.raw`K`}
						/> fois l'ensemble complet. L'erreur OOB est obtenue "gratuitement" durant l'entraînement
						de l'ensemble, sans aucun apprentissage supplémentaire.
					</li>
					<li>
						<strong>Mécanisme :</strong> Pour chaque point <KatexInline
							formula={String.raw`x_i`}
						/>, on prédit sa valeur uniquement en utilisant la sous-forêt constituée des arbres
						entraînés sur des bootstraps ne contenant pas <KatexInline formula={String.raw`x_i`} /> (environ
						<KatexInline formula={String.raw`36.8\%`} /> des arbres).
					</li>
				</ul>
			{/snippet}
			<p>
				Expliquez le principe de l'erreur Out-of-Bag (OOB). En quoi se distingue-t-elle de la
				validation croisée classique en termes de coût algorithmique ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.12" title="Estimation du nombre d'arbres OOB">
			{#snippet solution()}
				<p>
					La probabilité qu'un arbre donné n'inclue pas un exemple spécifique est d'environ <KatexInline
						formula={String.raw`e^{-1} \approx 0.368`}
					/>. Le nombre d'arbres n'incluant pas cet exemple suit une loi binomiale <KatexInline
						formula={String.raw`\mathcal{B}(M, e^{-1})`}
					/>.
				</p>
				<p>
					L'espérance du nombre d'arbres OOB pour cet exemple est :
					<KatexBlock
						formula={String.raw`"\mathbb{E}[M_{\text{OOB}}] = M \times e^{-1} \approx 100 \times 0.368 = 36.8 \text{ arbres}`}
					/>
					Chaque point dispose donc en moyenne d'environ 37 arbres pour formuler sa prédiction OOB.
				</p>
			{/snippet}
			<p>
				Dans une forêt de Bagging contenant <KatexInline formula={String.raw`M = 100`} /> arbres, déterminez
				le nombre moyen d'arbres qui serviront à prédire la valeur Out-of-Bag d'une observation spécifique
				du jeu d'apprentissage.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.13" title="Vote majoritaire dur vs vote majoritaire doux">
			{#snippet solution()}
				<p>
					<strong>Définitions :</strong>
				</p>
				<ul>
					<li>
						<strong>Vote dur (Hard Voting) :</strong> Chaque classifieur prédit une classe discrète <KatexInline
							formula={String.raw`c \in \{0, 1\}`}
						/>. On sélectionne la classe ayant obtenu la majorité absolue des voix.
					</li>
					<li>
						<strong>Vote doux (Soft Voting) :</strong> Chaque classifieur renvoie une probabilité <KatexInline
							formula={String.raw`P(y=1|x)`}
						/>. On calcule la moyenne de ces probabilités sur l'ensemble des arbres, puis on
						applique le seuil de décision (0.5).
					</li>
				</ul>
				<p>
					Le vote doux est généralement plus performant car il préserve l'incertitude et l'intensité
					de confiance de chaque prédicteur individuel.
				</p>
			{/snippet}
			<p>
				Quelle est la différence fondamentale entre le vote majoritaire "dur" (hard voting) et le
				vote majoritaire "doux" (soft voting) pour un problème de classification ? Lequel est
				généralement à privilégier ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.14" title="BMA vs Bagging">
			{#snippet solution()}
				<p>
					<strong>Distinction essentielle :</strong>
				</p>
				<ul>
					<li>
						Le <strong>BMA</strong> suppose qu'un seul des modèles du candidat est le "vrai" modèle générateur
						des données. Les probabilités a posteriori évaluent la certitude que chaque modèle soit le
						bon. Le BMA cherche à réduire l'incertitude sur la sélection de modèle.
					</li>
					<li>
						Le <strong>Bagging</strong> ne suppose pas de "vrai" modèle unique. Il combine des modèles
						intentionnellement perturbés par échantillonnage pour lisser les fluctuations numériques (réduction
						empirique de la variance).
					</li>
				</ul>
			{/snippet}
			<p>
				Comparez les hypothèses philosophiques qui sous-tendent l'agrégation de modèles bayésiens
				(BMA) et le Bagging.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.15" title="Sensibilité du Bagging aux valeurs aberrantes">
			{#snippet solution()}
				<p>
					Le Bagging est moyennement robuste aux valeurs aberrantes (outliers) : bien que
					l'échantillonnage bootstrap exclue un outlier spécifique dans environ <KatexInline
						formula={String.raw`36.8\%`}
					/> des arbres de base, les <KatexInline formula={String.raw`63.2\%`} /> restants l'intégreront
					et seront lourdement déformés si la métrique d'arbre sous-jacente y est sensible (ex: perte
					L2). La robustesse dépend donc principalement de la robustesse intrinsèque des modèles de base
					utilisés.
				</p>
			{/snippet}
			<p>
				Analysez l'impact de la présence de valeurs aberrantes (outliers) majeurs dans le jeu de
				données d'apprentissage sur un modèle de Bagging d'arbres.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.16" title="Agrégation de modèles stables">
			{#snippet solution()}
				<p>
					Le Bagging n'offre aucun gain sur les classifieurs dits <strong>stables</strong> (ex:
					régression linéaire ou régression logistique). En effet, de légères perturbations du jeu
					de données par bootstrap produisent des coefficients de régression presque identiques.
					Ainsi, la corrélation <KatexInline formula={String.raw`\rho`} /> entre les modèles de base tend
					vers 1, ce qui annule l'effet de réduction de variance décrit dans la formule de l'exercice
					5.2.
				</p>
			{/snippet}
			<p>
				Pourquoi le Bagging de modèles linéaires simples (comme la régression par moindres carrés)
				n'apporte-t-il généralement aucune amélioration de performance par rapport à un modèle
				linéaire unique ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.17" title="Calcul d'un poids optimal d'agrégation">
			{#snippet solution()}
				<p>
					Nous voulons minimiser <KatexInline
						formula={String.raw`\text{Var}(w_1 \hat{y}_1 + w_2 \hat{y}_2) = w_1^2 \sigma_1^2 + w_2^2 \sigma_2^2`}
					/> sous la contrainte <KatexInline formula={String.raw`w_1 + w_2 = 1`} />. En remplaçant <KatexInline
						formula={String.raw`w_2`}
					/> par <KatexInline formula={String.raw`1 - w_1`} />, nous devons minimiser :
				</p>
				<KatexBlock formula={String.raw`f(w_1) = w_1^2 \sigma_1^2 + (1-w_1)^2 \sigma_2^2`} />
				<p>
					En annulant la dérivée : <KatexInline
						formula={String.raw`2 w_1 \sigma_1^2 - 2(1 - w_1)\sigma_2^2 = 0 \implies w_1(\sigma_1^2 + \sigma_2^2
          w_1(\sigma_1^2 + \sigma_2^2) = \sigma_2^2 \implies w_1^* = \frac{\sigma_2^2}{\sigma_1^2 + \sigma_2^2`}
					/>. Par symétrie, <KatexInline
						formula={String.raw`w_2^* = \frac{\sigma_1^2}{\sigma_1^2 + \sigma_2^2}`}
					/>.
				</p>
				<p>
					<strong>Interprétation :</strong> Le poids alloué à chaque prédicteur est inversement proportionnel
					à sa propre variance. Un modèle plus incertain (variance élevée) se voit attribuer un poids
					plus faible dans la décision finale.
				</p>
			{/snippet}
			<p>
				Soit deux prédicteurs non biaisés et indépendants <KatexInline
					formula={String.raw`\hat{y}_1`}
				/> et <KatexInline formula={String.raw`\hat{y}_2`} />, de variances respectives <KatexInline
					formula={String.raw`\sigma_1^2`}
				/> et <KatexInline formula={String.raw`\sigma_2^2`} />. On construit le prédicteur agrégé
				pondéré <KatexInline
					formula={String.raw`\hat{y}_{\text{agg}} = w_1 \hat{y}_1 + w_2 \hat{y}_2`}
				/> sous la contrainte <KatexInline formula={String.raw`w_1 + w_2 = 1`} />. Déterminez les
				poids optimaux <KatexInline formula={String.raw`w_1^*`} /> et <KatexInline
					formula={String.raw`w_2^*`}
				/> qui minimisent la variance de <KatexInline formula={String.raw`\hat{y}_{\text{agg}}`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.18" title="Impact de la taille de l'échantillon de bootstrap">
			{#snippet solution()}
				<p>
					Si l'on réduit la taille des échantillons bootstrap à <KatexInline
						formula={String.raw`N_{\text{boot}} \ll N`}
					/> :
				</p>
				<ul>
					<li>
						<strong>Biais :</strong> Le biais individuel de chaque arbre augmente car ils apprennent sur
						moins de données.
					</li>
					<li>
						<strong>Variance / Corrélation :</strong> La variance et la corrélation <KatexInline
							formula={String.raw`\rho`}
						/> entre les arbres diminuent car les échantillons bootstrap partagent moins de points communs,
						ce qui augmente l'efficacité du moyennage.
					</li>
				</ul>
				<p>
					À l'inverse, si <KatexInline formula={String.raw`N_{\text{boot}} \gg N`} />, les
					échantillons bootstrap deviennent presque identiques au jeu de données d'origine,
					maximisant la corrélation <KatexInline formula={String.raw`\rho \to 1`} /> et détruisant l'avantage
					du Bagging.
				</p>
			{/snippet}
			<p>
				Analysez les effets sur le compromis biais-variance de la forêt si l'on modifie la taille de
				chaque échantillon de bootstrap pour qu'elle soit très inférieure à <KatexInline
					formula={String.raw`N`}
				/>, ou au contraire très supérieure à <KatexInline formula={String.raw`N`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.19" title="Subbagging vs Bagging classique">
			{#snippet solution()}
				<p>
					Le <strong>Subbagging</strong> consiste à échantillonner <em>sans remise</em> des
					sous-ensembles de taille <KatexInline formula={String.raw`K < N`} /> (généralement <KatexInline
						formula={String.raw`K = 0.5N`}
					/> ou <KatexInline formula={String.raw`K = 0.632N`} />) au lieu d'échantillonner avec
					remise.
				</p>
				<p>
					Sur le plan théorique et empirique, le Subbagging produit des résultats extrêmement
					proches du Bagging classique en termes de performance prédictive et de décorrélation, tout
					en étant parfois légèrement plus rapide à exécuter car il n'y a pas de gestion des
					doublons.
				</p>
			{/snippet}
			<p>
				Qu'est-ce que le "Subbagging" et en quoi se distingue-t-il du Bagging classique sur le plan
				de la théorie d'échantillonnage ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="5.20" title="Synthèse et validation des concepts">
			{#snippet solution()}
				<ol>
					<li>
						<strong>Faux.</strong> Le Bagging n'aide pas à réduire le biais, il réduit principalement
						la variance.
					</li>
					<li>
						<strong>Vrai.</strong> L'erreur OOB fournit une estimation honnête, non biaisée de l'erreur
						de généralisation sans besoin d'un jeu de test séparé.
					</li>
					<li>
						<strong>Faux.</strong> Environ <KatexInline formula={String.raw`63.2\%`} /> des données uniques
						sont incluses dans chaque échantillon bootstrap, les <KatexInline
							formula={String.raw`36.8\%`}
						/> restants sont Out-Of-Bag.
					</li>
					<li>
						<strong>Vrai.</strong> Plus les arbres sont corrélés, plus la variance finale de l'ensemble
						reste proche de la variance d'un seul arbre.
					</li>
				</ol>
			{/snippet}
			<p>Répondez par Vrai ou Faux en justifiant brièvement :</p>
			<ol>
				<li>Le Bagging permet d'ajuster le biais d'un modèle sous-appris.</li>
				<li>
					L'erreur OOB est calculée sur des données n'ayant jamais servi à entraîner l'arbre de base
					évalué.
				</li>
				<li>Chaque échantillon de bootstrap contient exactement 50% de données originales.</li>
				<li>
					L'efficacité du Bagging dépend crucialement de la faible corrélation entre les erreurs des
					estimateurs individuels.
				</li>
			</ol>
		</ExercisePanel>

		<!-- ==========================================
                   SECTION 6: FORÊTS ALÉATOIRES
                   ========================================== -->
		<h2 id="forets-aleatoires">Forêts Aléatoires (Random Forests)</h2>
		<p>
			Cette section explore les mécanismes des Forêts Aléatoires : décorrélation des arbres par
			sélection de features, critères de division optimale, importance des variables et convergence.
		</p>

		<ExercisePanel number="6.1" title="Démonstration de la variance d'une forêt">
			{#snippet solution()}
				<p>
					En utilisant la décomposition de la variance d'un estimateur moyenné de <KatexInline
						formula={String.raw`M`}
					/> variables corrélées (établie à l'exercice 5.2) :
				</p>
				<KatexBlock
					formula={String.raw`\text{Var}\left(\frac{1}{M}\sum_{j=1}^M T_j(X)\right) = \bar{\rho} \sigma^2 + \frac{1-\bar{\rho}}{M}\sigma^2`}
				/>
				<p>
					Ici, <KatexInline formula={String.raw`T_j(X)`} /> représente le <KatexInline
						formula={String.raw`j`}
					/>-ème arbre de la forêt, <KatexInline formula={String.raw`\sigma^2`} /> la variance d'un seul
					arbre, et <KatexInline formula={String.raw`\bar{\rho}`} /> la corrélation moyenne entre les
					arbres. Cette formule démontre que la sélection aléatoire de variables, en réduisant la corrélation
					<KatexInline formula={String.raw`\bar{\rho}`} />, diminue directement la variance globale
					de la forêt.
				</p>
			{/snippet}
			<p>
				Démontrez le lien direct entre la formule de variance de Theorem 6.1 et la diminution
				induite par la sélection aléatoire de variables (notée <KatexInline
					formula={String.raw`m < d`}
				/>) propre aux Forêts Aléatoires.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.2" title="Impact du paramètre de sélection de variables">
			{#snippet solution()}
				<p>
					Le paramètre <KatexInline formula={String.raw`m`} /> (souvent noté
					<code>max_features</code>
					ou <code>mtry</code>) régit la force de la décorrélation :
				</p>
				<ul>
					<li>
						<strong>Si <KatexInline formula={String.raw`m`} /> diminue :</strong> La corrélation <KatexInline
							formula={String.raw`\bar{\rho}`}
						/> diminue (ce qui est bénéfique pour réduire la variance globale), mais la variance individuelle
						de chaque arbre <KatexInline formula={String.raw`\sigma^2`} /> augmente ainsi que son biais
						(car l'arbre dispose de choix de divisions de moins bonne qualité).
					</li>
					<li>
						<strong>Si <KatexInline formula={String.raw`m`} /> augmente :</strong> Les arbres
						deviennent plus performants individuellement (faible biais), mais très corrélés entre
						eux (<KatexInline formula={String.raw`\bar{\rho} \to 1`} />), ce qui rapproche la forêt
						d'un simple Bagging d'arbres.
					</li>
				</ul>
			{/snippet}
			<p>
				Discutez de l'influence du paramètre de taille du sous-espace aléatoire <KatexInline
					formula={String.raw`m`}
				/> (nombre de variables tirées au hasard à chaque nœud) sur le compromis biais-variance d'une
				forêt de décision.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.3" title="Calcul de l'impureté de Gini">
			{#snippet solution()}
				<p>La formule de Gini pour un nœud binaire à deux classes (0 et 1) est :</p>
				<KatexBlock formula={String.raw`I_G(t) = 1 - (p_0^2 + p_1^2)`} />
				<p>
					Ici, la proportion de la classe positive est <KatexInline
						formula={String.raw`p_1 = 30 / (30 + 70) = 0.3`}
					/> et <KatexInline formula={String.raw`p_0 = 0.7`} />.
				</p>
				<KatexBlock
					formula={String.raw`I_G(t) = 1 - (0.7^2 + 0.3^2) = 1 - (0.49 + 0.09) = 1 - 0.58 = 0.42`}
				/>
				<p>
					L'indice d'impureté de Gini de ce nœud vaut donc <KatexInline
						formula={String.raw`0.42`}
					/>.
				</p>
			{/snippet}
			<p>
				Soit un nœud <KatexInline formula={String.raw`t`} /> contenant 100 exemples d'apprentissage, dont
				30 de la classe positive (1) et 70 de la classe négative (0). Calculez l'impureté de Gini <KatexInline
					formula={String.raw`I_G(t)`}
				/> de ce nœud.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.4" title="Calcul du gain de division par l'indice de Gini">
			{#snippet solution()}
				<p>
					L'impureté initiale du nœud parent est <KatexInline
						formula={String.raw`I_G(t) = 0.42`}
					/>. Le nœud fils gauche contient 40 exemples dont 10 positifs (<KatexInline
						formula={String.raw`p_{L,1} = 0.25, \; p_{L,0} = 0.75`}
					/>) :
				</p>
				<KatexBlock
					formula={String.raw`I_G(t_L) = 1 - (0.25^2 + 0.75^2) = 1 - (0.0625 + 0.5625) = 0.375`}
				/>
				<p>
					Le nœud fils droit contient 60 exemples dont 20 positifs (<KatexInline
						formula={String.raw`p_{R,1} = 1/3, \; p_{R,0} = 2/3`}
					/>) :
				</p>
				<KatexBlock
					formula={String.raw`I_G(t_R) = 1 - ((1/3)^2 + (2/3)^2) = 1 - (1/9 + 4/9) = 4/9 \approx 0.444`}
				/>
				<p>Le gain de Gini de cette division est :</p>
				<KatexBlock
					formula={String.raw`\Delta I_G = 0.42 - \frac{40}{100}(0.375) - \frac{60}{100}(0.444) = 0.42 - 0.15 - 0.266 = 0.004`}
				/>
				<p>
					Le gain généré par cette division est extrêmement faible (<KatexInline
						formula={String.raw`0.004`}
					/>), indiquant une séparation peu discriminante.
				</p>
			{/snippet}
			<p>
				En reprenant le nœud de l'exercice 6.3, on propose une division <KatexInline
					formula={String.raw`s`}
				/> qui sépare les données ainsi : le nœud de gauche <KatexInline
					formula={String.raw`t_L`}
				/> contient 40 exemples (dont 10 positifs) et le nœud de droite <KatexInline
					formula={String.raw`t_R`}
				/> contient 60 exemples (dont 20 positifs). Calculez le gain de division de Gini <KatexInline
					formula={String.raw`\Delta I_G(s, t)`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.5" title="Probabilité d'inclure la meilleure feature">
			{#snippet solution()}
				<p>
					Le problème revient à calculer la probabilité d'obtenir au moins une fois la variable
					informative <KatexInline formula={String.raw`X_1`} /> lors d'un tirage sans remise de <KatexInline
						formula={String.raw`m`}
					/> éléments parmi <KatexInline formula={String.raw`d`} />. Il est plus facile de calculer
					la probabilité complémentaire (ne jamais tirer <KatexInline formula={String.raw`X_1`} />)
					:
				</p>
				<KatexBlock
					formula={String.raw`P(\text{Exclusion}) = \frac{\binom{d-1}{m}}{\binom{d}{m}} = \frac{(d-1)!}{m!(d-1-m)!} \times \frac{m!(d-m)!}{d!} = \frac{d-m}{d} = 1 - \frac{m}{d}`}
				/>
				<p>La probabilité d'inclure la variable clé dans le sous-espace est donc :</p>
				<KatexBlock
					formula={String.raw`P(\text{Inclusion}) = 1 - P(\text{Exclusion}) = \frac{m}{d}`}
				/>
				<p>
					Pour <KatexInline formula={String.raw`d=100`} /> et <KatexInline
						formula={String.raw`m = \sqrt{100} = 10`}
					/>, la probabilité d'inclure cette variable clé à chaque nœud est de seulement <KatexInline
						formula={String.raw`10\%`}
					/>. Cela permet aux <KatexInline formula={String.raw`90\%`} /> des nœuds restants d'explorer
					d'autres variables, décorrélant fortement les arbres.
				</p>
			{/snippet}
			<p>
				Soit un jeu de données comportant <KatexInline formula={String.raw`d`} /> variables prédictives,
				dont une seule variable <KatexInline formula={String.raw`X_1`} /> est fortement informative. Déterminez
				la probabilité exacte que <KatexInline formula={String.raw`X_1`} /> fasse partie du sous-ensemble
				aléatoire de taille <KatexInline formula={String.raw`m`} /> sélectionné à un nœud donné.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.6" title="Règle empirique de classification">
			{#snippet solution()}
				<p>
					Pour la classification, la règle par défaut est <KatexInline
						formula={String.raw`m = \lfloor \sqrt{d} \rfloor`}
					/>.
				</p>
				<p>
					Pour <KatexInline formula={String.raw`d = 400`} /> variables, le nombre de caractéristiques
					évaluées à chaque nœud est <KatexInline formula={String.raw`m = \sqrt{400} = 20`} />.
					L'intérêt de cette valeur est de trouver un bon compromis entre la puissance prédictive de
					chaque arbre (qui chuterait si <KatexInline formula={String.raw`m`} /> était trop petit) et
					la décorrélation indispensable (qui s'annulerait si <KatexInline
						formula={String.raw`m \to d`}
					/>).
				</p>
			{/snippet}
			<p>
				Pour un problème de classification binaire comportant <KatexInline
					formula={String.raw`d = 400`}
				/> variables, déterminez la valeur recommandée par défaut de <KatexInline
					formula={String.raw`m`}
				/> d'après les règles empiriques classiques de Leo Breiman. Justifiez l'intérêt de ce choix.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.7" title="Règle empirique de régression">
			{#snippet solution()}
				<p>
					Pour la régression, la règle par défaut est <KatexInline
						formula={String.raw`m = \lfloor d / 3 \rfloor`}
					/>.
				</p>
				<p>
					Pour <KatexInline formula={String.raw`d = 150`} /> variables, le nombre de variables examinées
					est <KatexInline formula={String.raw`150 / 3 = 50`} />. La régression nécessite
					généralement d'évaluer plus de variables simultanément que la classification pour lisser
					convenablement la surface de réponse continue et maintenir un biais raisonnable.
				</p>
			{/snippet}
			<p>
				Pour un problème de régression comportant <KatexInline formula={String.raw`d = 150`} /> variables,
				quelle est la valeur de <KatexInline formula={String.raw`m`} /> recommandée par défaut ? Expliquez
				pourquoi cette valeur est proportionnellement plus grande que pour la classification.
			</p>
		</ExercisePanel>

		<ExercisePanel
			number="6.8"
			title="Calcul de l'importance des caractéristiques par impureté (MDI)"
		>
			{#snippet solution()}
				<p>
					L'importance MDI d'une variable correspond à la somme pondérée des diminutions d'impureté
					de Gini sur tous les nœuds où cette variable a été choisie pour la division. Le premier
					nœud (parent) engendre une baisse de <KatexInline formula={String.raw`0.12`} />, pondérée
					par la proportion d'exemples <KatexInline formula={String.raw`200 / 200 = 1.0`} />. Le
					second nœud engendre une baisse de <KatexInline formula={String.raw`0.08`} />, pondérée
					par la proportion d'exemples <KatexInline formula={String.raw`80 / 200 = 0.4`} />.
				</p>
				<KatexBlock
					formula={String.raw`\text{MDI}(X_2) = (1.0 \times 0.12) + (0.4 \times 0.08) = 0.12 + 0.032 = 0.152`}
				/>
				<p>
					L'importance brute MDI de la variable <KatexInline formula={String.raw`X_2`} /> pour cet arbre
					est de <KatexInline formula={String.raw`0.152`} />.
				</p>
			{/snippet}
			<p>
				Dans un arbre de décision d'une forêt, la variable <KatexInline formula={String.raw`X_2`} /> est
				utilisée pour scinder deux nœuds : le nœud racine (contenant l'intégralité des 200 points, réduction
				d'impureté de <KatexInline formula={String.raw`0.12`} />) et un sous-nœud gauche (contenant
				80 points, réduction d'impureté de <KatexInline formula={String.raw`0.08`} />). Calculez la
				contribution cumulée de <KatexInline formula={String.raw`X_2`} /> à l'importance Mean Decrease
				in Impurity (MDI) dans cet arbre.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.9" title="Biais systématique du MDI pour les variables catégorielles">
			{#snippet solution()}
				<p>
					L'importance par réduction d'impureté (MDI) souffre d'un biais majeur en faveur des
					variables possédant un <strong>grand nombre de modalités uniques</strong> (comme les identifiants
					ou les variables continues).
				</p>
				<p>
					Puisqu'un arbre de décision cherche la meilleure division parmi toutes les valeurs
					possibles d'une variable, une variable à forte cardinalité offre de multiples points de
					coupure arbitraires. Même si cette variable est totalement décorrélée de la cible, elle
					permettra de réduire artificiellement l'impureté sur l'échantillon d'apprentissage par pur
					surapprentissage, gonflant indûment son score MDI.
				</p>
			{/snippet}
			<p>
				Pourquoi le critère d'importance des variables MDI (Mean Decrease Impurity) est-il
				sévèrement biaisé en faveur des variables catégorielles à haute cardinalité (grand nombre de
				catégories) ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.10" title="Importance par permutation (MDA)">
			{#snippet solution()}
				<p>
					Le calcul de l'importance par permutation (Mean Decrease Accuracy) d'une variable
					s'effectue en 4 étapes clés :
				</p>
				<ol>
					<li>
						Mesurer l'erreur Out-of-Bag (OOB) originale de chaque arbre sur sa fraction de données
						non apprises.
					</li>
					<li>
						Perturber aléatoirement (mélanger) les valeurs de la variable d'intérêt uniquement dans
						le jeu de données OOB.
					</li>
					<li>Prédire à nouveau l'erreur OOB modifiée sur ces arbres.</li>
					<li>
						Calculer la différence d'erreur moyenne : si la variable est cruciale, perturber ses
						valeurs détruit la performance et fait bondir l'erreur d'évaluation.
					</li>
				</ol>
			{/snippet}
			<p>
				Décrivez l'algorithme de calcul de l'importance des variables par permutation (Mean Decrease
				Accuracy, MDA). En quoi cette technique résout-elle le biais identifié à l'exercice 6.9 ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.11" title="Forêts Aléatoires vs Arbres de décision uniques">
			{#snippet solution()}
				<p>
					L'avantage fondamental des Forêts Aléatoires réside dans la <strong
						>stabilité de l'estimation</strong
					> :
				</p>
				<ul>
					<li>
						<strong>Variance :</strong> Un arbre de décision unique est extrêmement sensible aux variations
						locales du jeu d'apprentissage (forte variance). Une forêt lisse ces instabilités en moyennant
						des centaines d'arbres décorrélés.
					</li>
					<li>
						<strong>Généralisation :</strong> La forêt réduit drastiquement le risque de surapprentissage
						tout en préservant la capacité non linéaire d'ajustement des arbres profonds.
					</li>
				</ul>
			{/snippet}
			<p>
				Quel est le principal avantage d'une forêt aléatoire par rapport à un arbre de décision
				unique construit sur le même jeu de données ? Répondez en termes de biais et de variance.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.12" title="Convergence mathématique du Random Forest">
			{#snippet solution()}
				<p>
					<strong>Non, il n'y a aucun risque de surapprentissage</strong> en augmentant indéfiniment
					le nombre d'arbres <KatexInline formula={String.raw`M`} />.
				</p>
				<p>
					En vertu de la loi forte des grands nombres, lorsque <KatexInline
						formula={String.raw`M \to \infty`}
					/>, l'erreur de généralisation d'une forêt aléatoire converge presque sûrement vers une
					limite théorique stable (Theorem 6.5). Ajouter des arbres au-delà d'un certain seuil ne
					fait que stabiliser la prédiction et consommer du temps de calcul, sans dégrader la
					performance.
				</p>
			{/snippet}
			<p>
				Est-il possible de provoquer un surapprentissage (overfitting) en augmentant indéfiniment le
				nombre d'arbres <KatexInline formula={String.raw`M`} /> dans une forêt aléatoire ? Justifiez à
				l'aide des résultats de convergence asymptotique de Leo Breiman.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.13" title="Robustesse face aux variables redondantes">
			{#snippet solution()}
				<p>
					Si l'on ajoute 10 copies identiques d'une variable informative <KatexInline
						formula={String.raw`X_1`}
					/> :
				</p>
				<ul>
					<li>
						<strong>Performance prédictive :</strong> Elle reste inchangée car les arbres trouveront toujours
						l'information utile.
					</li>
					<li>
						<strong>Importances MDI et MDA :</strong> Les scores d'importance vont s'effondrer pour la
						variable originale car l'information est désormais partagée et diluée entre les 10 copies
						colinéaires. L'utilisateur pourrait croire à tort que cette variable est devenue inutile.
					</li>
				</ul>
			{/snippet}
			<p>
				Analysez le comportement d'une forêt aléatoire et l'impact sur l'importance de ses
				caractéristiques (MDI) si l'on ajoute dans le jeu de données 10 variables qui sont des
				copies parfaites de la variable la plus prédictive.
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.14" title="Optimisation numérique : les Extra-Trees">
			{#snippet solution()}
				<p>
					Les <strong>Extremely Randomized Trees (Extra-Trees)</strong> poussent l'aléa encore plus loin
					:
				</p>
				<ul>
					<li>
						Au lieu de chercher le seuil de coupure optimal (le split maximisant le gain de Gini)
						pour chaque variable sélectionnée, ils tirent des <strong
							>seuils de coupure totalement au hasard</strong
						> pour chaque variable candidate.
					</li>
					<li>
						Cela accélère considérablement l'apprentissage (pas d'évaluation de tous les seuils de
						coupure possibles) et réduit encore plus la corrélation <KatexInline
							formula={String.raw`\bar{\rho}`}
						/> entre les arbres, au prix d'une légère augmentation du biais individuel.
					</li>
				</ul>
			{/snippet}
			<p>
				Quelle est la différence méthodologique fondamentale entre une Forêt Aléatoire classique et
				l'algorithme des Forêts Extrêmement Aléatoires (Extra-Trees) ? Quel est l'intérêt
				informatique majeur de cette variante ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.15" title="Gestion des données manquantes par Surrogate Splits">
			{#snippet solution()}
				<p>
					Les "surrogate splits" (divisions de secours) sont des règles alternatives apprises à
					chaque nœud :
				</p>
				<p>
					Si la variable de division principale <KatexInline formula={String.raw`X_j`} /> est manquante
					pour un exemple à tester, l'arbre utilise une autre variable <KatexInline
						formula={String.raw`X_k`}
					/> dont le comportement de division mime au plus près celui de <KatexInline
						formula={String.raw`X_j`}
					/>. Cela permet de propager l'exemple à gauche ou à droite de manière robuste sans avoir
					recours à une imputation préalable des données manquantes.
				</p>
			{/snippet}
			<p>
				Expliquez le principe de la gestion des données manquantes par les arbres de décision via le
				mécanisme des divisions de substitution ("surrogate splits").
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.16" title="Élagage et forêts aléatoires">
			{#snippet solution()}
				<p>
					Dans une forêt aléatoire, il est de coutume de laisser les arbres croître jusqu'à leur
					taille maximale (sans élagage) pour deux raisons :
				</p>
				<ol>
					<li>
						Un arbre profond a un biais extrêmement faible. Bien que sa variance individuelle soit
						immense, le processus de moyennage sur des centaines d'arbres élimine cette variance.
					</li>
					<li>
						Élaguer les arbres augmenterait artificiellement le biais individuel de chaque
						estimateur, réduisant l'expressivité de la forêt finale.
					</li>
				</ol>
			{/snippet}
			<p>
				Pourquoi n'est-il généralement pas nécessaire d'élaguer (pruning) les arbres de décision
				individuels au sein d'une Forêt Aléatoire ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.17" title="Forêts obliques vs orthogonales">
			{#snippet solution()}
				<p>
					<strong>Comparaison :</strong>
				</p>
				<ul>
					<li>
						<strong>Orthogonales (classiques) :</strong> Les divisions s'effectuent sur une seule
						variable à la fois (<KatexInline formula={String.raw`X_j \le s`} />), ce qui crée des
						frontières de décision parallèles aux axes de l'espace.
					</li>
					<li>
						<strong>Obliques :</strong> Les divisions s'effectuent sur des combinaisons linéaires de
						plusieurs variables (<KatexInline formula={String.raw`\sum w_i X_i \le s`} />). Elles
						sont beaucoup plus performantes pour modéliser des corrélations complexes et des
						diagonales, mais leur recherche de division est beaucoup plus coûteuse.
					</li>
				</ul>
			{/snippet}
			<p>
				Qu'est-ce qu'une "forêt oblique" par rapport à une forêt aléatoire orthogonale classique ?
				Quel type de frontière de décision cela permet-il de tracer ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.18" title="Robustesse des Forêts Aléatoires face aux bruits de labels">
			{#snippet solution()}
				<p>
					Grâce à l'effet régulateur du bootstrap et du moyennage, les forêts aléatoires sont
					remarquablement robustes au bruit sur la variable cible. Quelques arbres apprendront des
					règles aberrantes basées sur les labels bruités, mais la majorité silencieuse des autres
					arbres (ne contenant pas ces points bruités dans leurs bootstraps respectifs) dominera et
					maintiendra la cohérence de la décision globale.
				</p>
			{/snippet}
			<p>
				Discutez de la sensibilité et de la robustesse d'une forêt aléatoire face à un jeu de
				données contenant un taux modéré de labels bruités (erreurs d'étiquetage).
			</p>
		</ExercisePanel>

		<ExercisePanel number="6.19" title="Vrai ou Faux sur les Forêts Aléatoires">
			{#snippet solution()}
				<ol>
					<li>
						<strong>Vrai.</strong> Contrairement aux modèles linéaires ou de réseaux de neurones, les
						arbres n'effectuent que des comparaisons de seuils et sont donc insensibles aux transformations
						monotones.
					</li>
					<li>
						<strong>Faux.</strong> Le paramètre critique à optimiser est <KatexInline
							formula={String.raw`m`}
						/> (mtry).
					</li>
					<li>
						<strong>Vrai.</strong> Les forêts aléatoires s'adaptent très bien aux problèmes où la
						dimension <KatexInline formula={String.raw`d`} /> est bien supérieure au nombre d'exemples
						<KatexInline formula={String.raw`n`} />.
					</li>
					<li>
						<strong>Faux.</strong> L'importance par permutation nécessite des données Out-of-Bag (ou de
						test) pour être calculée rigoureusement.
					</li>
				</ol>
			{/snippet}
			<p>Répondez par Vrai ou Faux en justifiant brièvement :</p>
			<ol>
				<li>
					Les forêts aléatoires sont insensibles à la mise à l'échelle (scaling/normalization) des
					variables continues.
				</li>
				<li>
					Le nombre d'arbres <KatexInline formula={String.raw`M`} /> est l'hyperparamètre qui requiert
					la recherche sur grille (grid search) la plus minutieuse car il peut causer du surapprentissage.
				</li>
				<li>
					Les forêts de décision gèrent nativement les cas où <KatexInline
						formula={String.raw`d \gg n`}
					/>.
				</li>
				<li>
					L'importance par permutation (MDA) se calcule uniquement à partir des données
					d'apprentissage qui ont servi à construire les arbres.
				</li>
			</ol>
		</ExercisePanel>

		<ExercisePanel number="6.20" title="Bilan : Optimisation des hyperparamètres critiques">
			{#snippet solution()}
				<p>
					Pour optimiser une forêt aléatoire, la hiérarchie des hyperparamètres à régler est la
					suivante :
				</p>
				<ol>
					<li>
						<strong
							><code>max_features</code> / <code>mtry</code> (<KatexInline
								formula={String.raw`m`}
							/>) :</strong
						> Le plus important. Détermine la corrélation globale de la forêt.
					</li>
					<li>
						<strong><code>min_samples_leaf</code> / <code>max_depth</code> :</strong> Contrôle la régularisation
						et la taille des feuilles individuelles des arbres.
					</li>
					<li>
						<strong><code>n_estimators</code> (<KatexInline formula={String.raw`M`} />) :</strong> Doit
						simplement être choisi "suffisamment grand" (ex: 500 ou 1000) pour garantir la convergence
						statistique, sans besoin d'optimisation par grille.
					</li>
				</ol>
			{/snippet}
			<p>
				Dressez une synthèse méthodologique de l'ordre d'importance et de l'optimisation des
				hyperparamètres d'une forêt aléatoire lors d'une phase de tuning de modèle.
			</p>
		</ExercisePanel>

		<!-- ==========================================
                   SECTION 7: BOOSTING
                   ========================================== -->
		<h2 id="boosting">Boosting</h2>
		<p>
			Cette section examine les techniques d'apprentissage séquentiel par Boosting : AdaBoost, la
			théorie des marges, les fonctions de perte et le Gradient Boosting (GBDT).
		</p>

		<ExercisePanel number="7.1" title="Algorithme AdaBoost pas à pas">
			{#snippet solution()}
				<p>
					1. Initialisation des poids : <KatexInline formula={String.raw`w_i^{(1)} = 1/5 = 0.2`} /> pour
					les 5 exemples.
				</p>
				<p>
					2. Erreur pondérée du premier classifieur : <KatexInline formula={String.raw`h_1`} /> se trompe
					sur un seul point de poids 0.2.
					<KatexInline formula={String.raw`\epsilon_1 = 0.2`} />.
				</p>
				<p>
					3. Calcul du poids de vote du modèle <KatexInline formula={String.raw`\alpha_1`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\alpha_1 = \frac{1}{2} \ln\left(\frac{1 - 0.2}{0.2}\right) = \frac{1}{2} \ln(4) \approx 0.693`}
				/>
				<p>
					Le premier classifieur aura une influence de <KatexInline formula={String.raw`0.693`} /> dans
					l'agrégat final.
				</p>
			{/snippet}
			<p>
				Sur un jeu de données de <KatexInline formula={String.raw`N = 5`} /> points, un classifieur de
				base <KatexInline formula={String.raw`h_1`} /> commet une erreur sur une seule observation. Calculez
				son erreur pondérée initiale <KatexInline formula={String.raw`\epsilon_1`} /> et son coefficient
				d'importance de vote <KatexInline formula={String.raw`\alpha_1`} /> selon les règles d'AdaBoost.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.2" title="Mise à jour des poids d'AdaBoost">
			{#snippet solution()}
				<p>
					Reprenons les valeurs : <KatexInline formula={String.raw`w_i^{(1)} = 0.2`} />, <KatexInline
						formula={String.raw`\alpha_1 = 0.693`}
					/>. Le facteur de normalisation vaut :
				</p>
				<KatexBlock
					formula={String.raw`Z_1 = 2 \sqrt{\epsilon_1(1-\epsilon_1)} = 2 \sqrt{0.2 \times 0.8} = 2 \sqrt{0.16} = 0.8`}
				/>
				<p>
					Pour les 4 exemples correctement classés (<KatexInline
						formula={String.raw`y_i h_1(x_i) = 1`}
					/>) :
				</p>
				<KatexBlock
					formula={String.raw`w_{\text{correct}} = \frac{0.2 \times e^{-0.693}}{0.8} = \frac{0.2 \times 0.5}{0.8} = 0.125`}
				/>
				<p>
					Pour l'exemple mal classé (<KatexInline formula={String.raw`y_i h_1(x_i) = -1`} />) :
				</p>
				<KatexBlock
					formula={String.raw`w_{\text{incorrect}} = \frac{0.2 \times e^{0.693}}{0.8} = \frac{0.2 \times 2.0}{0.8} = 0.500`}
				/>
				<p>
					<strong>Vérification :</strong> La somme des nouveaux poids est bien <KatexInline
						formula={String.raw`4 \times 0.125 + 0.500 = 1.0`}
					/>. On observe que le point mal classé concentre désormais <KatexInline
						formula={String.raw`50\%`}
					/> du poids total pour l'itération suivante.
				</p>
			{/snippet}
			<p>
				À l'aide des résultats de l'exercice 7.1, calculez la valeur du facteur de normalisation <KatexInline
					formula={String.raw`Z_1`}
				/>, puis déterminez les nouveaux poids <KatexInline formula={String.raw`w_i^{(2)}`} /> pour les
				exemples correctement classés et pour l'exemple incorrectement classé.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.3" title="Preuve de la formule d'importance d'AdaBoost">
			{#snippet solution()}
				<p>
					AdaBoost cherche à minimiser la somme des poids de l'étape suivante, ce qui équivaut à
					minimiser le facteur de normalisation <KatexInline formula={String.raw`Z_t(\alpha)`} /> par
					rapport à <KatexInline formula={String.raw`\alpha`} /> :
				</p>
				<KatexBlock
					formula={String.raw`Z_t(\alpha) = \sum_{i=1}^N w_i^{(t)} e^{-\alpha y_i h_t(x_i)} = \sum_{y_i = h_t(x_i)} w_i^{(t)} e^{-\alpha} + \sum_{y_i \neq h_t(x_i)} w_i^{(t)} e^{\alpha} = (1 - \epsilon_t)e^{-\alpha} + \epsilon_t e^{\alpha}`}
				/>
				<p>
					En annulant la dérivée par rapport à <KatexInline formula={String.raw`\alpha`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\frac{\partial Z_t}{\partial \alpha} = -(1 - \epsilon_t)e^{-\alpha} + \epsilon_t e^{\alpha} = 0 \implies \epsilon_t e^{\alpha} = (1 - \epsilon_t)e^{-\alpha} \implies e^{2\alpha} = \frac{1 - \epsilon_t}{\epsilon_t}`}
				/>
				<p>
					En prenant le logarithme népérien et en divisant par 2, on retrouve bien l'expression
					optimale : <KatexInline
						formula={String.raw`\alpha_t = \frac{1}{2} \ln\left(\frac{1 - \epsilon_t}{\epsilon_t}\right)`}
					/>.
				</p>
			{/snippet}
			<p>
				Démontrez de façon rigoureuse que le coefficient <KatexInline
					formula={String.raw`\alpha_t`}
				/> défini par AdaBoost est bien la valeur optimale qui minimise le facteur de normalisation <KatexInline
					formula={String.raw`Z_t`}
				/> à l'étape <KatexInline formula={String.raw`t`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.4" title="AdaBoost et perte exponentielle">
			{#snippet solution()}
				<p>
					Montrons que la mise à jour récursive des poids implique que le poids final d'un exemple
					est directement lié à la perte exponentielle globale :
				</p>
				<p>
					Par définition, à chaque étape <KatexInline
						formula={String.raw`w_i^{(t+1)} = w_i^{(t)} \frac{e^{-\alpha_t y_i h_t(x_i)}}{Z_t}`}
					/>. En déroulant la récurrence depuis <KatexInline
						formula={String.raw`w_i^{(1)} = 1/N`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`w_i^{(T+1)} = \frac{1}{N} \frac{e^{-\sum_{t=1}^T \alpha_t y_i h_t(x_i)}}{\prod_{t=1}^T Z_t} = \frac{1}{N \prod Z_t} e^{-y_i F_T(x_i)}`}
				/>
				<p>
					Le poids d'un exemple est donc proportionnel à sa perte exponentielle <KatexInline
						formula={String.raw`"L(y_i, F_T(x_i)) = e^{-y_i F_T(x_i)}`}
					/>, validant le fait qu'AdaBoost est un algorithme de descente de gradient coordonnée sur
					la perte exponentielle.
				</p>
			{/snippet}
			<p>
				Établissez la relation mathématique prouvant que la mise à jour séquentielle des poids dans
				AdaBoost équivaut à minimiser de manière gloutonne la perte exponentielle globale <KatexInline
					formula={String.raw`L(y, f(x)) = e^{-y f(x)}`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.5" title="Borne supérieure de l'erreur d'apprentissage">
			{#snippet solution()}
				<p>
					Notons que si le classifieur commet une erreur de prédiction sur l'exemple <KatexInline
						formula={String.raw`i`}
					/>, alors <KatexInline formula={String.raw`y_i F_T(x_i) \le 0`} />, ce qui implique <KatexInline
						formula={String.raw`e^{-y_i F_T(x_i)} \ge 1`}
					/>. Ainsi, nous pouvons majorer la fonction indicatrice d'erreur :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{I}(\text{sign}(F_T(x_i)) \neq y_i) \le e^{-y_i F_T(x_i)}`}
				/>
				<p>
					En sommant sur tout le jeu d'apprentissage de taille <KatexInline
						formula={String.raw`N`}
					/> et en exploitant le résultat de l'exercice précédent :
				</p>
				<KatexBlock
					formula={String.raw`\frac{1}{N}\sum_{i=1}^N \mathbb{I}(F_T(x_i) \neq y_i) \le \frac{1}{N}\sum_{i=1}^N e^{-y_i F_T(x_i)} = \sum_{i=1}^N w_i^{(T+1)} \prod_{t=1}^T Z_t = \prod_{t=1}^T Z_t`}
				/>
				<p>
					Puisque <KatexInline formula={String.raw`\sum w_i^{(T+1)} = 1`} />, l'erreur
					d'apprentissage est bien bornée supérieurement par le produit des facteurs de
					normalisation <KatexInline formula={String.raw`\prod_{t=1}^T Z_t`} />.
				</p>
			{/snippet}
			<p>
				Démontrez le théorème 7.1 établissant que l'erreur d'apprentissage d'AdaBoost est majorée
				par le produit des facteurs de normalisation successifs :
				<KatexBlock formula={f75} />
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.6" title="AdaBoost sur classifieur parfait ou inversé">
			{#snippet solution()}
				<p>Analysons les deux situations extrêmes :</p>
				<ul>
					<li>
						<strong>Si <KatexInline formula={String.raw`\epsilon_t = 0`} /> :</strong> Le
						classifieur est parfait. La formule donne <KatexInline
							formula={String.raw`\alpha_t = \frac{1}{2} \ln(1/0) = +\infty`}
						/>. AdaBoost attribue un poids infini à ce classifieur et l'algorithme s'arrête, la
						prédiction étant parfaite.
					</li>
					<li>
						<strong>Si <KatexInline formula={String.raw`\epsilon_t = 1`} /> :</strong> Le
						classifieur se trompe systématiquement. <KatexInline
							formula={String.raw`\alpha_t = \frac{1}{2} \ln(0/1) = -\infty`}
						/>. AdaBoost l'intègre avec un coefficient négatif, ce qui revient à inverser
						systématiquement toutes ses prédictions pour en faire un classifieur parfait !
					</li>
				</ul>
			{/snippet}
			<p>
				Qu'advient-il de la valeur de <KatexInline formula={String.raw`\alpha_t`} /> si un classifieur
				de base obtient un taux d'erreur <KatexInline formula={String.raw`\epsilon_t = 0`} /> ? Et s'il
				obtient un taux d'erreur de <KatexInline formula={String.raw`\epsilon_t = 1`} /> ? En quoi cela
				témoigne-t-il de l'élégance de la méthode ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.7" title="Calcul de la marge fonctionnelle d'un point">
			{#snippet solution()}
				<p>
					La marge fonctionnelle d'un point <KatexInline formula={String.raw`(x_i, y_i)`} /> est définie
					par <KatexInline formula={String.raw`m_i = y_i F(x_i)`} />. Ici, <KatexInline
						formula={String.raw`y_i = 1`}
					/> et les votes des modèles pondérés sont :
				</p>
				<ul>
					<li>Modèle 1 (poids 0.7) : prédiction <KatexInline formula={String.raw`+1`} /></li>
					<li>Modèle 2 (poids 0.4) : prédiction <KatexInline formula={String.raw`-1`} /></li>
					<li>Modèle 3 (poids 0.2) : prédiction <KatexInline formula={String.raw`+1`} /></li>
				</ul>
				<p>
					La valeur continue de la prédiction cumulée est <KatexInline
						formula={String.raw`F(x_i) = 0.7(1) + 0.4(-1) + 0.2(1) = 0.7 - 0.4 + 0.2 = 0.5`}
					/>.
				</p>
				<p>
					La marge fonctionnelle vaut <KatexInline
						formula={String.raw`m_i = y_i F(x_i) = 1 \times 0.5 = 0.5`}
					/>. Elle est positive, ce qui signifie que le point est classé correctement par
					l'ensemble.
				</p>
			{/snippet}
			<p>
				Soit un ensemble composé de trois classifieurs de poids respectifs <KatexInline
					formula={String.raw`\alpha_1=0.7`}
				/>, <KatexInline formula={String.raw`\alpha_2=0.4`} /> et <KatexInline
					formula={String.raw`\alpha_3=0.2`}
				/>. Pour un exemple positif (<KatexInline formula={String.raw`y_i = 1`} />), les prédictions
				individuelles sont <KatexInline formula={String.raw`h_1(x_i) = 1`} />, <KatexInline
					formula={String.raw`h_2(x_i) = -1`}
				/> et <KatexInline formula={String.raw`h_3(x_i) = 1`} />. Calculez la marge fonctionnelle <KatexInline
					formula={String.raw`m_i`}
				/> de cet exemple.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.8" title="Théorie des marges et non-surapprentissage">
			{#snippet solution()}
				<p>
					L'erreur d'apprentissage d'AdaBoost tombe souvent à 0 après seulement quelques dizaines
					d'itérations. Pourtant, continuer à ajouter des arbres améliore encore l'erreur de test
					(phénomène qui contredit la théorie classique de la complexité VC).
				</p>
				<p>
					<strong>Explication :</strong> Même lorsque l'erreur d'apprentissage est nulle (tous les
					points ont une marge positive), continuer les itérations pousse les exemples
					d'apprentissage loin de la frontière de décision, ce qui
					<strong>augmente la marge géométrique minimale</strong>. Une marge plus grande se traduit
					par une meilleure capacité de généralisation (Théorème 7.2) et immunise le modèle contre
					le surapprentissage.
				</p>
			{/snippet}
			<p>
				Expliquez pourquoi le Boosting continue souvent à améliorer l'erreur de généralisation sur
				le jeu de test même après que l'erreur d'apprentissage a atteint zéro. Faites référence au
				concept de marge géométrique.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.9" title="Gradient Boosting : Pseudo-résidus L2">
			{#snippet solution()}
				<p>
					La fonction de perte quadratique pour un exemple est <KatexInline
						formula={String.raw`L(y_i, F(x_i)) = \frac{1}{2}(y_i - F(x_i))^2`}
					/>. Le pseudo-résidu <KatexInline formula={String.raw`r_{it}`} /> correspond à l'opposé du gradient
					de la perte par rapport à la prédiction actuelle :
				</p>
				<KatexBlock
					formula={String.raw`r_{it} = -\left[\frac{\partial L(y_i, F(x_i))}{\partial F(x_i)}\right]_{F=F_{t-1}} = -\left[-(y_i - F(x_i))\right]_{F=F_{t-1}} = y_i - F_{t-1}(x_i)`}
				/>
				<p>
					<strong>Conclusion :</strong> Pour la perte quadratique, le pseudo-résidu est exactement égal
					au résidu usuel (la différence entre la vraie valeur et la prédiction du modèle actuel). L'arbre
					de l'étape suivante va donc tout simplement chercher à prédire l'erreur résiduelle.
				</p>
			{/snippet}
			<p>
				Dans le cadre du Gradient Boosting, démontrez que pour la perte quadratique <KatexInline
					formula={String.raw`L(y, F) = \frac{1}{2}(y - F)^2`}
				/>, le pseudo-résidu <KatexInline formula={String.raw`r_{it}`} /> calculé à chaque étape correspond
				exactement au résidu classique <KatexInline formula={String.raw`y_i - F_{t-1}(x_i)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.10" title="Gradient Boosting : Pseudo-résidus L1">
			{#snippet solution()}
				<p>
					La fonction de perte absolue est <KatexInline
						formula={String.raw`L(y_i, F(x_i)) = |y_i - F(x_i)|`}
					/>. Calculons le gradient par rapport à la prédiction :
				</p>
				<KatexBlock
					formula={String.raw`\frac{\partial |y_i - F(x_i)|}{\partial F(x_i)} = -\text{sign}(y_i - F(x_i))`}
				/>
				<p>Le pseudo-résidu vaut donc :</p>
				<KatexBlock formula={String.raw`r_{it} = \text{sign}(y_i - F_{t-1}(x_i))`} />
				<p>
					<strong>Conclusion :</strong> Contrairement à la perte L2, l'arbre de l'étape suivante
					cherche uniquement à prédire la <em>direction</em> de l'erreur (signe positif ou négatif), indépendamment
					de son amplitude. Cela rend le Gradient Boosting L1 extrêmement robuste aux valeurs aberrantes
					(outliers).
				</p>
			{/snippet}
			<p>
				Pour une fonction de perte absolue (perte L1) <KatexInline
					formula={String.raw`L(y, F) = |y - F|`}
				/>, déterminez l'expression des pseudo-résidus <KatexInline formula={String.raw`r_{it}`} />.
				Comparez leur robustesse aux outliers avec celle des pseudo-résidus L2.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.11" title="Initialisation optimale pour la perte L2">
			{#snippet solution()}
				<p>
					Le modèle initial constant <KatexInline formula={String.raw`F_0(x)`} /> est défini par le paramètre
					constant qui minimise la perte globale sur le jeu d'apprentissage :
				</p>
				<KatexBlock
					formula={String.raw`F_0(x) = \arg\min_{\gamma} \sum_{i=1}^N \frac{1}{2}(y_i - \gamma)^2`}
				/>
				<p>
					En annulant la dérivée par rapport à <KatexInline formula={String.raw`\gamma`} /> :
				</p>
				<KatexBlock
					formula={String.raw`-\sum_{i=1}^N (y_i - \gamma) = 0 \implies N\gamma = \sum_{i=1}^N y_i \implies \gamma = \frac{1}{N}\sum_{i=1}^N y_i`}
				/>
				<p>
					Le prédicteur initial optimal <KatexInline formula={String.raw`F_0`} /> est donc tout simplement
					la <strong>moyenne empirique</strong> de la cible sur le jeu de données d'apprentissage.
				</p>
			{/snippet}
			<p>
				Démontrez que le modèle initial optimal <KatexInline formula={String.raw`F_0(x)`} /> pour le Gradient
				Boosting avec perte quadratique est la moyenne arithmétique des valeurs de la cible.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.12" title="Initialisation optimale pour la perte L1">
			{#snippet solution()}
				<p>Pour la perte absolue L1 :</p>
				<KatexBlock formula={String.raw`F_0(x) = \arg\min_{\gamma} \sum_{i=1}^N |y_i - \gamma|`} />
				<p>
					La valeur constante qui minimise la somme des écarts absolus sur un jeu de points est, par
					définition, la <strong>médiane</strong> des observations.
				</p>
				<p>
					Ainsi, <KatexInline formula={String.raw`F_0(x) = \text{médiane}(y_1, \dots, y_N)`} />.
				</p>
			{/snippet}
			<p>
				Quel est le modèle constant d'initialisation <KatexInline formula={String.raw`F_0(x)`} /> optimal
				pour le Gradient Boosting sous la perte absolue L1 ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.13" title="Stochastic Gradient Boosting">
			{#snippet solution()}
				<p>
					Le <strong>Stochastic Gradient Boosting</strong> introduit une étape d'échantillonnage aléatoire
					à chaque itération :
				</p>
				<ul>
					<li>
						Chaque arbre de boosting successif est entraîné uniquement sur une fraction (ex: 50% à
						80%) tirée au hasard et sans remise du jeu de données d'apprentissage.
					</li>
					<li>
						Cette technique réduit significativement la corrélation entre les arbres successifs,
						améliore l'effet régulateur contre le surapprentissage et réduit la durée de calcul de
						chaque itération.
					</li>
				</ul>
			{/snippet}
			<p>
				Expliquez le principe du "Stochastic Gradient Boosting" proposé par Jerome Friedman et
				précisez ses bénéfices en termes de généralisation et de temps de calcul.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.14" title="Rôle du taux d'apprentissage (Shrinkage)">
			{#snippet solution()}
				<p>
					La mise à jour de la prédiction cumulée s'écrit <KatexInline
						formula={String.raw`F_t(x) = F_{t-1}(x) + \eta \sum \gamma_{jt} \mathbb{I}(x \in R_{jt})`}
					/>.
				</p>
				<p>
					Réduire <KatexInline formula={String.raw`\eta`} /> (ex: <KatexInline
						formula={String.raw`\eta = 0.01`}
					/>) oblige chaque arbre à ne corriger qu'une infime fraction de l'erreur résiduelle. Cela
					permet d'avancer de manière prudente dans l'espace des fonctions de décision, évitant de
					surajuster le modèle aux fluctuations locales. En contrepartie, il faut augmenter
					proportionnellement le nombre d'arbres <KatexInline formula={String.raw`T`} /> pour atteindre
					la convergence.
				</p>
			{/snippet}
			<p>
				Pourquoi l'introduction d'un taux d'apprentissage <KatexInline
					formula={String.raw`\eta \in (0, 1]`}
				/> (appelé <em>shrinkage</em>) est-elle essentielle dans le Gradient Boosting ? Quel est son
				impact sur le nombre total d'itérations requis ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.15" title="Sensibilité d'AdaBoost au bruit">
			{#snippet solution()}
				<p>
					AdaBoost utilise la <strong>perte exponentielle</strong>, qui est extrêmement sensible aux
					valeurs aberrantes et aux erreurs d'étiquetage.
				</p>
				<p>
					Si un exemple est très bruité ou impossible à classer correctement, AdaBoost va s'obstiner
					sur ce point difficile et va démultiplier son poids d'itération en itération (<KatexInline
						formula={String.raw`e^{\alpha y_i h(x_i)}`}
					/>). Les classifieurs suivants vont alors concentrer toutes leurs ressources à tenter de
					classifier correctement cet unique point bruité, dégradant la frontière de décision sur le
					reste des données saines.
				</p>
			{/snippet}
			<p>
				Expliquez pourquoi l'algorithme AdaBoost classique est particulièrement vulnérable aux
				bruits de labels et aux données aberrantes (outliers).
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.16" title="Formulation du Tree Boosting (GBDT)">
			{#snippet solution()}
				<p>
					Dans le GBDT, après avoir partitionné l'espace en régions disjointes <KatexInline
						formula={String.raw`R_{jt}`}
					/> à l'aide d'un arbre de régression, on ré-optimise la valeur prédite <KatexInline
						formula={String.raw`\gamma_{jt}`}
					/> dans chaque feuille <KatexInline formula={String.raw`j`} /> en résolvant :
				</p>
				<KatexBlock
					formula={String.raw`\gamma_{jt} = \arg\min_{\gamma} \sum_{x_i \in R_{jt}} L(y_i, F_{t-1}(x_i) + \gamma)`}
				/>
				<p>
					Cette étape de recalibrage de la constante de la feuille pour la perte globale <KatexInline
						formula={String.raw`L`}
					/> est cruciale : elle garantit que la prédiction finale de l'arbre est optimale pour la perte
					ciblée (par exemple, la médiane des résidus pour la perte L1, ou des approximations de Newton
					pour la log-perte), et non pas simplement une moyenne des pseudo-résidus.
				</p>
			{/snippet}
			<p>
				Une fois la structure de l'arbre déterminée à l'étape <KatexInline
					formula={String.raw`t`}
				/>, comment calcule-t-on la valeur optimale <KatexInline
					formula={String.raw`\gamma_{jt}`}
				/> à prédire dans chaque feuille <KatexInline formula={String.raw`j`} /> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.17" title="XGBoost vs GBDT Classique">
			{#snippet solution()}
				<p>
					<strong>XGBoost</strong> propose deux améliorations mathématiques majeures :
				</p>
				<ol>
					<li>
						<strong>Régularisation :</strong> Il intègre directement des pénalités L1 (<KatexInline
							formula={String.raw`\alpha`}
						/>) et L2 (<KatexInline formula={String.raw`\lambda`} />) sur la structure des arbres
						(poids des feuilles) dans la fonction objective pour limiter le surapprentissage.
					</li>
					<li>
						<strong>Développement de Taylor au second ordre :</strong> Au lieu d'utiliser une simple
						approximation au premier ordre (comme Friedman), XGBoost formule son gain de division à
						l'aide du gradient (premier ordre) et du <strong>Hessien</strong> (second ordre) de la perte,
						permettant une convergence beaucoup plus rapide pour des pertes complexes.
					</li>
				</ol>
			{/snippet}
			<p>
				Quelles sont les deux innovations mathématiques majeures introduites par l'algorithme
				XGBoost par rapport au Gradient Boosting classique de Friedman ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.18" title="Perte robuste de Huber">
			{#snippet solution()}
				<p>
					La perte de Huber se comporte comme une perte L2 pour de petites erreurs et comme une
					perte L1 pour des erreurs supérieures à un seuil <KatexInline
						formula={String.raw`\delta`}
					/> :
				</p>
				<ul>
					<li>
						Elle est continue et différentiable partout (contrairement à la perte L1 qui n'est pas
						dérivable en 0), ce qui facilite l'optimisation par gradient.
					</li>
					<li>
						Elle est robuste aux outliers (croissance linéaire de la perte pour de grandes erreurs),
						évitant le comportement quadratique de la perte L2.
					</li>
				</ul>
			{/snippet}
			<p>
				Qu'est-ce que la fonction de perte robuste de Huber ? Quel est son avantage pour le Gradient
				Boosting par rapport aux pertes pures L1 et L2 ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.19" title="Vrai ou Faux sur le Boosting">
			{#snippet solution()}
				<ol>
					<li>
						<strong>Faux.</strong> Contrairement au Bagging, le Boosting est un processus
						strictement séquentiel (l'arbre <KatexInline formula={String.raw`t`} /> dépend de l'arbre
						<KatexInline formula={String.raw`t-1`} />), ce qui empêche la parallélisation native de
						la construction des arbres.
					</li>
					<li>
						<strong>Vrai.</strong> C'est la base théorique d'AdaBoost : combiner des classifieurs à peine
						meilleurs qu'un tirage aléatoire pour former un classifieur fort.
					</li>
					<li>
						<strong>Faux.</strong> Un taux d'apprentissage trop élevé (<KatexInline
							formula={String.raw`\eta = 1`}
						/>) provoque souvent un surapprentissage rapide et empêche de trouver le minimum global
						de manière stable.
					</li>
					<li>
						<strong>Vrai.</strong> Le boosting corrigeant séquentiellement les erreurs des étapes précédentes,
						il finit par surapprendre de manière dramatique si l'on ajoute trop d'arbres sur un jeu de
						données contenant du bruit.
					</li>
				</ol>
			{/snippet}
			<p>Répondez par Vrai ou Faux en justifiant brièvement :</p>
			<ol>
				<li>
					On peut facilement paralléliser la construction de tous les arbres d'un modèle de Gradient
					Boosting pour accélérer l'apprentissage.
				</li>
				<li>
					Les apprenants de base (weak learners) dans AdaBoost peuvent avoir des performances à
					peine supérieures à 50% de précision.
				</li>
				<li>
					Il est toujours préférable de régler le taux d'apprentissage <KatexInline
						formula={String.raw`\eta`}
					/> à sa valeur maximale 1 pour converger plus vite.
				</li>
				<li>
					Contrairement aux forêts aléatoires, le Boosting est sensible au surapprentissage si le
					nombre d'arbres est excessivement élevé.
				</li>
			</ol>
		</ExercisePanel>

		<ExercisePanel number="7.20" title="Bilan : Bagging vs Boosting">
			{#snippet solution()}
				<table>
					<thead>
						<tr>
							<th>Caractéristique</th>
							<th>Bagging</th>
							<th>Boosting</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Architecture</td>
							<td>Parallèle / Indépendante</td>
							<td>Séquentielle / Dépendante</td>
						</tr>
						<tr>
							<td>Action principale</td>
							<td>Réduction de variance</td>
							<td>Réduction de biais</td>
						</tr>
						<tr>
							<td>Arbres de base</td>
							<td>Profonds (faible biais, forte variance)</td>
							<td>Peu profonds / Stumps (fort biais)</td>
						</tr>
						<tr>
							<td>Sensibilité au bruit</td>
							<td>Très robuste</td>
							<td>Sensible (risque d'overfitting)</td>
						</tr>
					</tbody>
				</table>
			{/snippet}
			<p>
				Dressez un tableau comparatif synthétique confrontant le Bagging et le Boosting sur les
				aspects suivants : mode de construction (séquentiel/parallèle), objectif principal
				(biais/variance), profondeur typique des arbres de base et sensibilité au bruit de données.
			</p>
		</ExercisePanel>

		<!-- ==========================================
                   SECTION 8: RÉGULARISATION L1 & L2
                   ========================================== -->
		<h2 id="regularisation">Régularisation L1 et L2</h2>
		<p>
			Cette section traite du compromis biais-variance, de la régularisation Ridge (L2), du Lasso
			(L1), de l'Elastic Net, et de leurs aspects géométriques et algorithmiques.
		</p>

		<ExercisePanel number="8.1" title="Décomposition Biais-Variance formelle">
			{#snippet solution()}
				<p>
					Soit <KatexInline formula={String.raw`y = f(x) + \varepsilon`} /> avec <KatexInline
						formula={String.raw`\mathbb{E}[\varepsilon] = 0`}
					/> et <KatexInline formula={String.raw`\text{Var}(\varepsilon) = \sigma^2`} />.
					Développons l'erreur quadratique moyenne d'un prédicteur <KatexInline
						formula={String.raw`\hat{f}`}
					/> au point <KatexInline formula={String.raw`x`} /> :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{E}[(y - \hat{f}(x))^2] = \mathbb{E}[(f(x) + \varepsilon - \hat{f}(x))^2] = \mathbb{E}[((f(x) - \mathbb{E}[\hat{f}(x)]) + (\mathbb{E}[\hat{f}(x)] - \hat{f}(x)) + \varepsilon)^2]`}
				/>
				<p>
					En développant le carré, tous les termes croisés s'annulent sous l'espérance car <KatexInline
						formula={String.raw`\varepsilon`}
					/> est indépendant de <KatexInline formula={String.raw`\hat{f}(x)`} /> et <KatexInline
						formula={String.raw`\mathbb{E}[\hat{f}(x) - \mathbb{E}[\hat{f}(x)]] = 0`}
					/>. Il reste :
				</p>
				<KatexBlock
					formula={String.raw`\mathbb{E}[(y - \hat{f}(x))^2] = (f(x) - \mathbb{E}[\hat{f}(x)])^2 + \mathbb{E}[(\mathbb{E}[\hat{f}(x)] - \hat{f}(x))^2] + \mathbb{E}[\varepsilon^2]`}
				/>
				<p>
					On identifie respectivement : <KatexInline
						formula={String.raw`\text{Biais}(\hat{f}(x))^2 + \text{Var}(\hat{f}(x)) + \sigma^2`}
					/> (le bruit irréductible).
				</p>
			{/snippet}
			<p>
				Démontrez la formule de décomposition de l'erreur quadratique moyenne <KatexInline
					formula={f81}
				/> pour un estimateur quelconque <KatexInline formula={String.raw`\hat{f}(x)`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.2" title="Équivalence des formulations de régularisation">
			{#snippet solution()}
				<p>
					L'équivalence repose sur les conditions d'optimalité de Karush-Kuhn-Tucker (KKT).
					Considérons le problème sous contrainte : <KatexInline
						formula={String.raw`\min_w \mathcal{L}(w)`}
					/> s.t. <KatexInline formula={String.raw`\|w\|_2^2 \le t`} />. Le Lagrangien s'écrit :
				</p>
				<KatexBlock
					formula={String.raw`\mathcal{L}(w, \lambda) = \frac{1}{2n}\|y - Xw\|_2^2 + \frac{\lambda}{2}(\|w\|_2^2 - t)`}
				/>
				<p>
					Pour une valeur de contrainte <KatexInline formula={String.raw`t`} /> rendant la contrainte
					active, il existe un multiplicateur de Lagrange unique <KatexInline
						formula={String.raw`\lambda > 0`}
					/> tel que la solution du Lagrangien coïncide exactement avec la solution du problème pénalisé
					(formule de Tikhonov). La relation est monotone : réduire <KatexInline
						formula={String.raw`t`}
					/> équivaut à augmenter la pénalité <KatexInline formula={String.raw`\lambda`} />.
				</p>
			{/snippet}
			<p>
				Expliquez rigoureusement pourquoi la formulation pénalisée (Lagrangienne) et la formulation
				sous contrainte (Tikhonov) d'un problème de régularisation sont mathématiquement
				équivalentes.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.3" title="Dérivation de la solution analytique Ridge">
			{#snippet solution()}
				<p>
					Le coût à minimiser est : <KatexInline
						formula={String.raw`J(w) = \frac{1}{2}(y - Xw)^\top(y - Xw) + \frac{n\lambda}{2} w^\top w`}
					/>. Développons ce coût :
				</p>
				<KatexBlock
					formula={String.raw`J(w) = \frac{1}{2}\left( y^\top y - 2 w^\top X^\top y + w^\top X^\top X w \right) + \frac{n\lambda}{2} w^\top w`}
				/>
				<p>
					Calculons le gradient par rapport à <KatexInline formula={String.raw`w`} /> :
				</p>
				<KatexBlock formula={String.raw`\nabla_w J(w) = -X^\top y + X^\top X w + n\lambda w`} />
				<p>En annulant ce gradient pour trouver le minimum :</p>
				<KatexBlock
					formula={String.raw`(X^\top X + n\lambda I) w = X^\top y \implies w^* = (X^\top X + n\lambda I)^{-1} X^\top y`}
				/>
			{/snippet}
			<p>
				Retrouvez la solution analytique de la régression Ridge <KatexInline formula={f83} /> en calculant
				et en annulant le gradient de la fonction objectif correspondante.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.4" title="Interprétation géométrique L1 vs L2">
			{#snippet solution()}
				<p>L'explication réside dans la géométrie des courbes de niveau de la pénalité :</p>
				<ul>
					<li>
						<strong>Lasso (L1) :</strong> La boule unité <KatexInline
							formula={String.raw`\|w\|_1 \le t`}
						/> est un polyèdre (un losange en 2D) possédant des angles pointus situés directement sur
						les axes de coordonnées (où certaines composantes <KatexInline
							formula={String.raw`w_j = 0`}
						/>). Les courbes de niveau de la perte quadratique (des ellipses) ont de fortes chances
						de toucher d'abord un de ces angles pointus, annulant ainsi des coefficients.
					</li>
					<li>
						<strong>Ridge (L2) :</strong> La boule de contrainte <KatexInline
							formula={String.raw`\|w\|_2 \le t`}
						/> est lisse et sphérique. Le point de contact avec l'ellipse de perte se produit presque
						toujours en un point générique hors des axes, réduisant les coefficients sans jamais les annuler
						strictement.
					</li>
				</ul>
			{/snippet}
			<p>
				À l'aide d'un argument géométrique (dessin des contours de la perte et des boules de
				contraintes en 2D), expliquez pourquoi le Lasso produit des solutions creuses
				(parcimonieuses) tandis que Ridge ne le fait pas.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.5" title="Opérateur de seuillage doux (Lasso 1D)">
			{#snippet solution()}
				<p>
					En dimension 1 avec <KatexInline formula={String.raw`X^\top X = n`} />, la fonction de
					coût simplifiée s'écrit :
					<KatexInline
						formula={String.raw`J(w) = \frac{1}{2}(w - w_{\text{OLS}})^2 + \lambda |w|`}
					/>. Analysons selon le signe de <KatexInline formula={String.raw`w`} /> :
				</p>
				<ul>
					<li>
						Si <KatexInline formula={String.raw`w > 0`} />, <KatexInline
							formula={String.raw`\partial J = w - w_{\text{OLS}} + \lambda = 0 \implies w^* = w_{\text{OLS}} - \lambda`}
						/> (valide uniquement si <KatexInline
							formula={String.raw`w_{\text{OLS}} > \lambda`}
						/>).
					</li>
					<li>
						Si <KatexInline formula={String.raw`w < 0`} />, <KatexInline
							formula={String.raw`\partial J = w - w_{\text{OLS}} - \lambda = 0 \implies w^* = w_{\text{OLS}} + \lambda`}
						/> (valide uniquement si <KatexInline
							formula={String.raw`w_{\text{OLS}} < -\lambda`}
						/>).
					</li>
					<li>
						Si <KatexInline formula={String.raw`|w_{\text{OLS}}| \le \lambda`} />, la solution
						optimale est rabattue exactement à <KatexInline formula={String.raw`w^* = 0`} />.
					</li>
				</ul>
				<p>
					Ceci correspond exactement à l'opérateur de seuillage doux : <KatexInline
						formula={String.raw`\hat{w} = \text{sign}(w_{\text{OLS}}) \max(|w_{\text{OLS}}| - \lambda, 0)`}
					/>.
				</p>
			{/snippet}
			<p>
				En dimension <KatexInline formula={String.raw`d = 1`} />, démontrez que la solution du Lasso
				est donnée par l'opérateur de seuillage doux (Soft-Thresholding) :
				<KatexBlock formula={f85} />
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.6" title="Opérateur de contraction linéaire (Ridge 1D)">
			{#snippet solution()}
				<p>
					En dimension 1 avec <KatexInline formula={String.raw`X^\top X = n`} />, le coût du Ridge
					est <KatexInline
						formula={String.raw`J(w) = \frac{1}{2}(w - w_{\text{OLS}})^2 + \frac{\lambda}{2} w^2`}
					/>. Dérivons par rapport à <KatexInline formula={String.raw`w`} /> :
				</p>
				<KatexBlock
					formula={String.raw`J'(w) = w - w_{\text{OLS}} + \lambda w = 0 \implies w(1 + \lambda) = w_{\text{OLS}} \implies w^* = \frac{1}{1 + \lambda} w_{\text{OLS}}`}
				/>
				<p>
					Le coefficient Ridge est obtenu par une simple contraction linéaire (division par un
					facteur constant <KatexInline formula={String.raw`1+\lambda`} />) de la solution
					classique. Contrairement au Lasso, le coefficient ne s'annule jamais pour des valeurs
					finies de <KatexInline formula={String.raw`\lambda`} />.
				</p>
			{/snippet}
			<p>
				En dimension <KatexInline formula={String.raw`d=1`} />, déterminez la solution analytique de
				la régression Ridge et mettez-la sous la forme d'un opérateur de contraction linéaire de la
				solution OLS.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.7" title="Invertibilité garantie grâce à la régularisation Ridge">
			{#snippet solution()}
				<p>
					La matrice de covariance empirique <KatexInline formula={String.raw`X^\top X`} /> est semi-définie
					positive, ses valeurs propres sont positives ou nulles (<KatexInline
						formula={String.raw`\lambda_j \ge 0`}
					/>). Lorsque <KatexInline formula={String.raw`d > n`} />, le rang de <KatexInline
						formula={String.raw`X^\top X`}
					/> est au maximum <KatexInline formula={String.raw`n < d`} />, ce qui implique qu'au moins <KatexInline
						formula={String.raw`d-n`}
					/> valeurs propres sont nulles, rendant la matrice non inversible.
				</p>
				<p>
					En ajoutant le terme Ridge <KatexInline formula={String.raw`n\lambda I`} /> (avec <KatexInline
						formula={String.raw`\lambda > 0`}
					/>), les nouvelles valeurs propres de la matrice <KatexInline
						formula={String.raw`X^\top X + n\lambda I`}
					/> deviennent <KatexInline formula={String.raw`\lambda_j + n\lambda`} />. Puisque <KatexInline
						formula={String.raw`n\lambda > 0`}
					/>, toutes les valeurs propres sont strictement positives. La matrice est donc définie
					positive et garantie d'être inversible, offrant une solution unique stable.
				</p>
			{/snippet}
			<p>
				Expliquez comment la régularisation Ridge résout mathématiquement le problème de la
				non-invertibilité de la matrice <KatexInline formula={String.raw`X^\top X`} /> lorsque le nombre
				de variables <KatexInline formula={String.raw`d`} /> est strictement supérieur au nombre d'exemples
				<KatexInline formula={String.raw`n`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.8" title="Colinéarité et régression Ridge">
			{#snippet solution()}
				<p>
					Soit deux variables colinéaires <KatexInline formula={String.raw`X_1 = X_2`} />. Ridge
					pénalise la somme des carrés <KatexInline formula={String.raw`w_1^2 + w_2^2`} />. Pour
					prédire un effet cumulé constant <KatexInline formula={String.raw`C = w_1 + w_2`} />,
					Ridge va minimiser :
				</p>
				<KatexBlock formula={String.raw`w_1^2 + w_2^2 \quad \text{s.t.} \quad w_1 + w_2 = C`} />
				<p>
					La solution de ce problème quadratique sous contrainte est obtenue pour l'égalité parfaite
					: <KatexInline formula={String.raw`w_1 = w_2 = C/2`} />.
				</p>
				<p>
					<strong>Propriété :</strong> Ridge gère la colinéarité en
					<strong>partageant équitablement</strong> les coefficients entre les variables fortement corrélées.
				</p>
			{/snippet}
			<p>
				Soit deux caractéristiques identiques <KatexInline formula={String.raw`X_1 = X_2`} />.
				Comment la régularisation Ridge distribue-t-elle les coefficients <KatexInline
					formula={String.raw`w_1`}
				/> et <KatexInline formula={String.raw`w_2`} /> ? Justifiez par un calcul de minimisation.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.9" title="Colinéarité et Lasso : instabilité de sélection">
			{#snippet solution()}
				<p>
					Pour deux variables identiques <KatexInline formula={String.raw`X_1 = X_2`} /> et un effet cumulé
					<KatexInline formula={String.raw`w_1 + w_2 = C`} />, le Lasso pénalise la norme L1 : <KatexInline
						formula={String.raw`|w_1| + |w_2|`}
					/>.
				</p>
				<p>
					Sous la contrainte d'effet constant, la valeur de la pénalité vaut <KatexInline
						formula={String.raw`|w_1| + |C - w_1|`}
					/>, qui est constante et égale à <KatexInline formula={String.raw`|C|`} /> pour toute combinaison
					où <KatexInline formula={String.raw`w_1`} /> et <KatexInline formula={String.raw`w_2`} /> ont
					le même signe.
				</p>
				<p>
					Il y a donc une <strong>infinité de solutions optimales</strong> pour le Lasso (par
					exemple, <KatexInline formula={String.raw`w_1 = C`} /> et <KatexInline
						formula={String.raw`w_2 = 0`}
					/>, ou inversement). En pratique, le Lasso va sélectionner l'une des variables de manière
					totalement arbitraire selon les perturbations numériques du solveur, ce qui rend le modèle
					instable pour l'interprétation.
				</p>
			{/snippet}
			<p>
				Reprenez l'hypothèse de colinéarité de l'exercice 8.8 (<KatexInline
					formula={String.raw`X_1 = X_2`}
				/>). Montrez que le Lasso n'offre pas de solution unique pour ce couple de variables et
				discutez des conséquences sur la sélection de variables.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.10" title="Elastic Net : Synthèse et stabilisation">
			{#snippet solution()}
				<p>La fonction objective de l'Elastic Net est :</p>
				<KatexBlock
					formula={String.raw`\min_{w} \frac{1}{2n}\|y - Xw\|_2^2 + \lambda \left( \alpha \|w\|_1 + \frac{1-\alpha}{2} \|w\|_2^2 \right)`}
				/>
				<p>
					<strong>Avantage double :</strong> La partie L1 (<KatexInline
						formula={String.raw`\alpha`}
					/>) génère de la sparsité en annulant des coefficients non informatifs, tandis que la
					partie L2 (<KatexInline formula={String.raw`1-\alpha`} />) stabilise le comportement face
					aux variables corrélées en forçant un effet de groupe (les variables corrélées sont
					sélectionnées ensemble au lieu d'une seule de manière aléatoire).
				</p>
			{/snippet}
			<p>
				Donnez la formulation de l'Elastic Net. Expliquez en quoi cette formulation résout
				simultanément les faiblesses respectives du Lasso (instabilité face aux corrélations) et de
				Ridge (absence de sélection de variables).
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.11" title="Ridge : Décomposition en éléments propres">
			{#snippet solution()}
				<p>
					Soit la décomposition SVD de la matrice des données <KatexInline
						formula={String.raw`X = UDV^\top`}
					/>. Alors <KatexInline formula={String.raw`X^\top X = V D^2 V^\top`} />. Exprimons la
					solution Ridge à l'aide de cette décomposition :
				</p>
				<KatexBlock
					formula={String.raw`\hat{w}_{\text{Ridge}} = (V D^2 V^\top + n\lambda I)^{-1} V D U^\top y = V (D^2 + n\lambda I)^{-1} D U^\top y`}
				/>
				<p>
					Pour chaque composante principale <KatexInline formula={String.raw`j`} />, le coefficient
					est contracté par un facteur :
				</p>
				<KatexBlock formula={String.raw`f_j = \frac{d_j^2}{d_j^2 + n\lambda}`} />
				<p>
					Si une composante principale a une très faible valeur propre <KatexInline
						formula={String.raw`d_j^2 \ll n\lambda`}
					/>, son coefficient associé est drastiquement réduit vers 0. C'est l'effet de filtrage des
					directions de faible variance, souvent associées au bruit.
				</p>
			{/snippet}
			<p>
				En exploitant la décomposition en valeurs singulières (SVD) de <KatexInline
					formula={String.raw`X`}
				/>, démontrez comment la régularisation Ridge filtre en priorité les coefficients associés
				aux directions de faible variance (petites valeurs singulières de <KatexInline
					formula={String.raw`X^\top X`}
				/>).
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.12" title="Degrés de liberté effectifs de Ridge">
			{#snippet solution()}
				<p>
					Les degrés de liberté effectifs d'un ajustement linéaire régularisé Ridge se calculent par
					la trace de la matrice de projection (Hat matrix) <KatexInline
						formula={String.raw`H(\lambda)`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`df(\lambda) = \text{tr}(H(\lambda)) = \text{tr}\left( X(X^\top X + n\lambda I)^{-1}X^\top \right) = \text{tr}\left( X^\top X(X^\top X + n\lambda I)^{-1} \right)`}
				/>
				<p>
					En utilisant les valeurs singulières <KatexInline formula={String.raw`d_j`} /> de <KatexInline
						formula={String.raw`X`}
					/> :
				</p>
				<KatexBlock
					formula={String.raw`df(\lambda) = \sum_{j=1}^d \frac{d_j^2}{d_j^2 + n\lambda}`}
				/>
				<p>
					On vérifie que si <KatexInline formula={String.raw`\lambda = 0`} />, <KatexInline
						formula={String.raw`df(0) = d`}
					/> (nombre de variables total). Si <KatexInline
						formula={String.raw`\lambda \to \infty`}
					/>, <KatexInline formula={String.raw`df(\lambda) \to 0`} />.
				</p>
			{/snippet}
			<p>
				Définissez le concept de "degrés de liberté effectifs" (effective degrees of freedom) pour
				la régression Ridge et établissez sa formule de calcul en fonction des valeurs singulières
				de <KatexInline formula={String.raw`X`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.13" title="Descente par coordonnées pour le Lasso">
			{#snippet solution()}
				<p>
					L'algorithme optimise la fonction objectif coordonnée par coordonnée de manière itérative
					: Pour chaque variable <KatexInline formula={String.raw`j`} />, on fixe tous les autres
					coefficients <KatexInline formula={String.raw`w_{k \neq j}`} /> et on calcule le résidu partiel
					<KatexInline
						formula={String.raw`\rho_j = \sum_{i=1}^n x_{ij}(y_i - \sum_{k \neq j} w_k x_{ik})`}
					/>.
				</p>
				<p>
					Le problème se ramène à une minimisation unidimensionnelle équivalente à l'exercice 8.5.
					La mise à jour du coefficient <KatexInline formula={String.raw`w_j`} /> est donnée par :
				</p>
				<KatexBlock formula={String.raw`w_j^{(k+1)} = \frac{S_{n\lambda}(\rho_j)}{\|X_j\|_2^2}`} />
				<p>
					Cette méthode est extrêmement efficace pour le Lasso car la mise à jour par seuillage doux
					est analytique et très rapide, évitant des inversions de matrices coûteuses.
				</p>
			{/snippet}
			<p>
				Décrivez le principe de fonctionnement de l'algorithme de Descente par Coordonnées
				(Coordinate Descent) utilisé pour résoudre le problème d'optimisation non différentiable du
				Lasso.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.14" title="Règle de l'écart-type pour la validation croisée">
			{#snippet solution()}
				<p>La règle du "One Standard Error" (1-SE Rule) consiste à :</p>
				<ol>
					<li>
						Trouver le paramètre <KatexInline formula={String.raw`\lambda_{\min}`} /> qui donne l'erreur
						moyenne minimale de validation croisée.
					</li>
					<li>Calculer l'écart-type (Standard Error, SE) de cette erreur au point optimal.</li>
					<li>
						Sélectionner le modèle le plus parcimonieux (c'est-à-dire le plus grand <KatexInline
							formula={String.raw`\lambda`}
						/> pour le Lasso) dont l'erreur reste inférieure à <KatexInline
							formula={String.raw`\text{Erreur}(\lambda_{\min}) + 1\text{SE}`}
						/>.
					</li>
				</ol>
				<p>
					Cette règle permet d'éviter le surapprentissage en favorisant systématiquement un modèle
					plus simple et plus robuste dès lors que sa perte de performance par rapport à l'optimum
					théorique n'est pas statistiquement significative.
				</p>
			{/snippet}
			<p>
				Expliquez le principe de la règle du "One Standard Error" (1-SE Rule) utilisée lors de la
				sélection de l'hyperparamètre <KatexInline formula={String.raw`\lambda`} /> par validation croisée
				pour les modèles régularisés.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.15" title="Interprétation bayésienne du Ridge">
			{#snippet solution()}
				<p>
					Supposons un modèle <KatexInline formula={String.raw`y = Xw + \varepsilon`} /> avec un bruit
					gaussien <KatexInline
						formula={String.raw`\varepsilon \sim \mathcal{N}(0, \sigma^2 I)`}
					/>. La vraisemblance est :
					<KatexInline
						formula={String.raw`P(y|X, w) \propto \exp\left(-\frac{1}{2\sigma^2}\|y - Xw\|_2^2\right)`}
					/>.
				</p>
				<p>
					Si l'on pose un a priori gaussien centré sur les coefficients : <KatexInline
						formula={String.raw`w \sim \mathcal{N}(0, \tau^2 I)`}
					/>, sa densité est <KatexInline
						formula={String.raw`P(w) \propto \exp\left(-\frac{1}{2\tau^2}\|w\|_2^2\right)`}
					/>. La probabilité a posteriori s'écrit par la formule de Bayes : <KatexInline
						formula={String.raw`P(w|X,y) \propto P(y|X,w)P(w)`}
					/>. En prenant le logarithme négatif :
				</p>
				<KatexBlock
					formula={String.raw`-\log P(w|X,y) = \frac{1}{2\sigma^2}\|y - Xw\|_2^2 + \frac{1}{2\tau^2}\|w\|_2^2 + C`}
				/>
				<p>
					Maximiser cette probabilité a posteriori (estimation MAP) équivaut à minimiser le coût
					Ridge en posant <KatexInline formula={String.raw`\lambda = \sigma^2 / \tau^2`} />.
				</p>
			{/snippet}
			<p>
				Démontrez que la régression Ridge équivaut mathématiquement à la recherche du Maximum A
				Posteriori (MAP) d'une régression linéaire sous l'hypothèse d'un a priori Gaussien sur les
				coefficients <KatexInline formula={String.raw`w`} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.16" title="Interprétation bayésienne du Lasso">
			{#snippet solution()}
				<p>
					En conservant la même vraisemblance gaussienne, supposons cette fois un a priori de
					Laplace (double exponentiel) sur les coefficients :
					<KatexInline formula={String.raw`P(w) \propto \exp\left(-\frac{1}{b}\|w\|_1\right)`} />.
				</p>
				<p>La log-probabilité a posteriori négative s'écrit :</p>
				<KatexBlock
					formula={String.raw`-\log P(w|X,y) = \frac{1}{2\sigma^2}\|y - Xw\|_2^2 + \frac{1}{b}\|w\|_1 + C`}
				/>
				<p>
					Maximiser cette a posteriori (MAP) équivaut à minimiser la fonction objective du Lasso
					avec <KatexInline formula={String.raw`\lambda = 2\sigma^2 / b`} />.
				</p>
			{/snippet}
			<p>
				Démontrez que la régression Lasso équivaut à la recherche du Maximum A Posteriori (MAP)
				d'une régression linéaire sous l'hypothèse d'un a priori de Laplace sur les coefficients <KatexInline
					formula={String.raw`w`}
				/>.
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.17" title="Nécessité absolue de la standardisation">
			{#snippet solution()}
				<p>
					La pénalité de régularisation applique le même traitement <KatexInline
						formula={String.raw`\lambda`}
					/> à tous les coefficients <KatexInline formula={String.raw`w_j`} /> sans distinction d'échelle.
				</p>
				<p>
					Si une variable <KatexInline formula={String.raw`X_1`} /> est mesurée en mètres (valeurs de
					1 à 10) et une autre <KatexInline formula={String.raw`X_2`} /> en millimètres (valeurs de 1000
					à 10000), le coefficient <KatexInline formula={String.raw`w_1`} /> devra être 1000 fois plus
					grand que <KatexInline formula={String.raw`w_2`} /> pour avoir le même effet physique sur la
					cible. La pénalité va donc écraser de manière disproportionnée le coefficient <KatexInline
						formula={String.raw`w_1`}
					/> uniquement en raison de son unité de mesure. Standardiser les données ramène toutes les variables
					à la même échelle (variance unitaire), garantissant une pénalisation équitable.
				</p>
			{/snippet}
			<p>
				Pourquoi est-il absolument indispensable de centrer et de réduire (standardiser) les
				variables prédictives avant de procéder à l'entraînement d'un modèle Ridge ou Lasso ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.18" title="Exclusion de l'intercept de la pénalité">
			{#snippet solution()}
				<p>
					L'ordonnée à l'origine (intercept, noté <KatexInline formula={String.raw`w_0`} />)
					représente la valeur moyenne de la cible lorsque toutes les caractéristiques sont nulles.
				</p>
				<p>
					Si l'on pénalisait <KatexInline formula={String.raw`w_0`} />, la solution dépendrait du
					choix de l'origine du repère des données (par exemple, ajouter une constante globale à la
					cible <KatexInline formula={String.raw`y`} /> modifierait de manière complexe tous les coefficients).
					Exclure l'intercept de la pénalisation garantit que le modèle est invariant par translation
					globale de la cible ou des variables explicatives.
				</p>
			{/snippet}
			<p>
				Pourquoi l'ordonnée à l'origine (intercept) ne doit-elle jamais être pénalisée dans les
				formulations du Ridge et du Lasso ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="8.19" title="Vrai ou Faux sur la Régularisation L1/L2">
			{#snippet solution()}
				<ol>
					<li>
						<strong>Vrai.</strong> Ridge possède une solution analytique globale unique car son coût est
						strictement convexe et différentiable partout.
					</li>
					<li>
						<strong>Faux.</strong> Augmenter <KatexInline formula={String.raw`\lambda`} /> contraint plus
						fortement les coefficients, ce qui augmente le biais du modèle mais réduit sa variance.
					</li>
					<li>
						<strong>Vrai.</strong> Pour un modèle Lasso, si <KatexInline
							formula={String.raw`\lambda`}
						/> est choisi suffisamment grand, tous les coefficients sans exception sont mis à 0.
					</li>
					<li>
						<strong>Faux.</strong> Le Lasso est extrêmement efficace pour la sélection de variables
						lorsque <KatexInline formula={String.raw`d \gg n`} />, car il peut sélectionner au
						maximum <KatexInline formula={String.raw`n`} /> variables uniques avant de saturer.
					</li>
				</ol>
			{/snippet}
			<p>Répondez par Vrai ou Faux en justifiant brièvement :</p>
			<ol>
				<li>
					La régression Ridge possède toujours une solution analytique unique, même si <KatexInline
						formula={String.raw`d > n`}
					/>.
				</li>
				<li>
					Augmenter la valeur de l'hyperparamètre <KatexInline formula={String.raw`\lambda`} /> réduit
					le biais du modèle.
				</li>
				<li>
					Il existe une valeur critique de <KatexInline formula={String.raw`\lambda`} /> au-delà de laquelle
					tous les coefficients du Lasso valent strictement 0.
				</li>
				<li>
					Le Lasso est inapplicable lorsque la dimension <KatexInline formula={String.raw`d`} /> est strictement
					supérieure au nombre d'exemples <KatexInline formula={String.raw`n`} />.
				</li>
			</ol>
		</ExercisePanel>

		<ExercisePanel number="8.20" title="Bilan synthétique : Ridge vs Lasso">
			{#snippet solution()}
				<table>
					<thead>
						<tr>
							<th>Propriété</th>
							<th>Ridge (L2)</th>
							<th>Lasso (L1)</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Forme de la pénalité</td>
							<td><KatexInline formula={String.raw`w_j^2`} /></td>
							<td><KatexInline formula={String.raw`|w_j|`} /></td>
						</tr>
						<tr>
							<td>Solution analytique</td>
							<td>Oui (formule fermée)</td>
							<td>Non (optimisation numérique)</td>
						</tr>
						<tr>
							<td>Sélection de variables</td>
							<td>Non (réduction vers 0 sans annulation)</td>
							<td>Oui (coefficients mis à 0 pile)</td>
						</tr>
						<tr>
							<td>Variables colinéaires</td>
							<td>Partage équitable des poids</td>
							<td>Sélection arbitraire d'une seule variable</td>
						</tr>
					</tbody>
				</table>
			{/snippet}
			<p>
				Dressez un tableau comparatif exhaustif opposant la régression Ridge et le Lasso sur les
				critères suivants : expression de la pénalité, existence d'une solution analytique sous
				forme fermée, capacité de sélection automatique de variables et comportement en présence de
				variables hautement corrélées.
			</p>
		</ExercisePanel>
	</TheorySection>
</PageTemplate>

<style>
	th,
	td {
		padding: 0.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
</style>
