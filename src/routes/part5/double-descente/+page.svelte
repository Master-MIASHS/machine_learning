<script lang="ts">
	// Part V, expert lesson (/part5/double-descente) — La double descente.
	//
	// ANCHOR IN course_sources/: theorie.typ, § "Limites de la théorie VC pour les
	// réseaux de neurones" → "Le paradoxe de la double descente" (three regimes,
	// pseudo-inverse figure, ill-conditioning of X at the threshold, implicit bias
	// of GD → max margin); regularization.typ Définition 5.1 + Proposition 5.1
	// (Ridge, shrinkage factors); optim.typ Proposition 2.6.2 (Ridge well-posed).
	// Everything else (finite-sample and asymptotic risk formulas, Marchenko–
	// Pastur, Cover, classification and deep-learning results) is an EXTENSION
	// from the primary literature, verified in
	// expert/part5/lessons/double-descente.research.md. Math lives in
	// src/lib/math/double-descent.ts.
	//
	// Numbering: blocks continue the part's displayed sequence after lesson 4
	// (whose blocks are 5.x) as 6.x; InteractiveSection / ExercisePanel use 5.n
	// (local sequence of this standalone expert lesson).

	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Quiz from '$lib/components/narrative/Quiz.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import { getPageByPath, getAdjacentPages, type PageMeta } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import { getQuizQuestions } from '$lib/quiz';

	const meta = getPageByPath('/part5/double-descente');
	const tracker = createPageTracker(meta as PageMeta);
	const quiz = getQuizQuestions('p5/double-descente');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	const tocEntries: TocEntry[] = [
		{
			id: 'introduction',
			label: 'Au-delà de la courbe en U',
			description: 'Seuil d’interpolation, trois régimes, un peu d’histoire',
			color: 'neutral'
		},
		{
			id: 'regression-lineaire',
			label: 'Régression linéaire : la norme minimale',
			description: 'Formule exacte du risque, limite asymptotique',
			color: 'epistemic'
		},
		{
			id: 'conditionnement',
			label: 'Pourquoi un pic ? Le conditionnement',
			description: 'Valeurs singulières, Marchenko–Pastur, Bai–Yin',
			color: 'surprise'
		},
		{
			id: 'regularisation',
			label: 'La régularisation efface le pic',
			description: 'Ridge, pénalité optimale, arrêt précoce',
			color: 'positive'
		},
		{
			id: 'classification',
			label: 'Double descente en classification',
			description: 'Perte 0-1, séparabilité de Cover, marge maximale',
			color: 'belief'
		},
		{
			id: 'deep-learning',
			label: 'Double descente en deep learning',
			description: 'Largeur, époques, données ; complexité effective',
			color: 'agent'
		},
		{
			id: 'synthese',
			label: 'Synthèse',
			description: 'Ce qu’il faut retenir et ce qui reste ouvert',
			color: 'neutral'
		}
	];

	// ── Formulas (kept in script so Svelte never parses braces/backslashes) ──

	// Notation
	const designMatrix = String.raw`X \in \mathbb{R}^{n \times p}`;
	const aspectRatio = String.raw`\gamma = p/n`;
	const linearModel = String.raw`y = x^\top \beta + \varepsilon, \qquad x \sim \mathcal{N}(0, I_D),\quad \varepsilon \sim \mathcal{N}(0, \sigma^2)`;
	const minNormEstimator = String.raw`\hat\beta = X_T^{+}\, y = \arg\min \bigl\{ \|b\|_2 \;:\; b \text{ minimise } \|y - X_T b\|_2^2 \bigr\}`;
	const testRisk = String.raw`\mathcal{R}(\hat\beta) = \mathbb{E}\bigl[(y_0 - x_0^\top \hat\beta)^2\bigr]`;
	const excessRisk = String.raw`\mathcal{R}(\hat\beta) - \sigma^2 = \mathbb{E}\,\|\hat\beta - \beta\|_2^2 \quad (\text{covariables isotropes})`;

	// Proposition 6.2
	const interpolates = String.raw`X X^{+} = I_n \quad\Longrightarrow\quad X\hat\beta = y`;

	// Theorem 6.3 (Belkin, Hsu & Xu 2020, Theorem 1)
	const bhxRisk = String.raw`\mathbb{E}\bigl[(y_0 - x_0^\top\hat\beta)^2\bigr] = \begin{cases} \bigl(\|\beta_{T^c}\|^2 + \sigma^2\bigr)\Bigl(1 + \dfrac{p}{n - p - 1}\Bigr) & \text{si } p \le n-2,\\[2mm] +\infty & \text{si } n-1 \le p \le n+1,\\[2mm] \|\beta_T\|^2\Bigl(1 - \dfrac{n}{p}\Bigr) + \bigl(\|\beta_{T^c}\|^2 + \sigma^2\bigr)\Bigl(1 + \dfrac{n}{p - n - 1}\Bigr) & \text{si } p \ge n+2. \end{cases}`;
	const effectiveNoise = String.raw`y = X_T\beta_T + \underbrace{X_{T^c}\beta_{T^c} + \varepsilon}_{=:\ \xi \,\sim\, \mathcal{N}(0,\ \|\beta_{T^c}\|^2 + \sigma^2)}`;
	const underDecomp = String.raw`\hat\beta - \beta_T = X_T^{+}\xi, \qquad \mathbb{E}\,\|X_T^{+}\xi\|^2 = \tilde\sigma^2\, \mathbb{E}\,\mathrm{tr}\bigl((X_T^\top X_T)^{-1}\bigr) = \tilde\sigma^2 \frac{p}{n-p-1}`;
	const overDecomp = String.raw`\hat\beta - \beta_T = -\,(I - \Pi)\,\beta_T + X_T^{+}\xi, \qquad \mathbb{E}\,\|(I-\Pi)\beta_T\|^2 = \Bigl(1 - \frac{n}{p}\Bigr)\|\beta_T\|^2`;
	const overVariance = String.raw`\mathbb{E}\,\|X_T^{+}\xi\|^2 = \tilde\sigma^2\, \mathbb{E}\,\mathrm{tr}\bigl((X_T X_T^\top)^{-1}\bigr) = \tilde\sigma^2 \frac{n}{p-n-1}`;
	const tildeSigma = String.raw`\tilde\sigma^2 = \|\beta_{T^c}\|^2 + \sigma^2`;

	// Corollary 6.4 (Hastie et al. 2022, Theorem 1)
	const hastieRidgeless = String.raw`\mathcal{R}(\hat\beta) - \sigma^2 \;\xrightarrow{\text{p.s.}}\; \begin{cases} \sigma^2 \dfrac{\gamma}{1-\gamma} & \text{si } \gamma < 1 \quad (\text{biais nul}),\\[2mm] \underbrace{r^2\Bigl(1 - \dfrac{1}{\gamma}\Bigr)}_{\text{biais}} + \underbrace{\sigma^2 \dfrac{1}{\gamma - 1}}_{\text{variance}} & \text{si } \gamma > 1. \end{cases}`;
	const localMin = String.raw`\gamma^\star = \frac{\sqrt{\mathrm{SNR}}}{\sqrt{\mathrm{SNR}} - 1}, \qquad \mathrm{SNR} = r^2/\sigma^2 > 1`;

	// Proposition 6.5 — variance and singular values
	const svd = String.raw`X = \sum_{i=1}^{r} s_i\, u_i v_i^\top, \qquad s_1 \ge \dots \ge s_r > 0`;
	const minNormSvd = String.raw`\hat\beta = X^{+}y = \sum_{i=1}^{r} \frac{u_i^\top y}{s_i}\, v_i`;
	const varianceSvd = String.raw`\mathbb{E}_\varepsilon\bigl\|\hat\beta - \mathbb{E}_\varepsilon[\hat\beta]\bigr\|^2 = \sigma^2 \sum_{i=1}^{r} \frac{1}{s_i^2} \;\ge\; \frac{\sigma^2}{s_r^2}`;
	const noisePart = String.raw`\hat\beta - \mathbb{E}_\varepsilon[\hat\beta] = \sum_{i=1}^{r} \frac{u_i^\top \varepsilon}{s_i}\, v_i, \qquad u_i^\top\varepsilon \overset{\text{iid}}{\sim} \mathcal{N}(0, \sigma^2)`;

	// Theorem 6.6 — Marchenko–Pastur / Bai–Yin
	const mpDensity = String.raw`f_\gamma(s) = \frac{\sqrt{(s_+ - s)(s - s_-)}}{2\pi \gamma\, s}\, \mathbf{1}_{[s_-, s_+]}(s), \qquad s_\pm = (1 \pm \sqrt{\gamma})^2`;
	const baiYin = String.raw`\lambda_{\min}^{+}\Bigl(\tfrac{1}{n} X^\top X\Bigr) \xrightarrow{\text{p.s.}} (1 - \sqrt{\gamma})^2, \qquad \lambda_{\max}\Bigl(\tfrac{1}{n} X^\top X\Bigr) \xrightarrow{\text{p.s.}} (1 + \sqrt{\gamma})^2`;
	const conditionLimit = String.raw`\kappa \longrightarrow \Bigl(\frac{1 + \sqrt{\gamma}}{1 - \sqrt{\gamma}}\Bigr)^2 \xrightarrow[\gamma \to 1]{} +\infty`;

	// Ridge (1/n normalisation)
	const ridgeNormalized = String.raw`\hat\beta_\lambda = \arg\min_b \; \frac{1}{n}\|y - Xb\|_2^2 + \lambda \|b\|_2^2 = (X^\top X + n\lambda I_p)^{-1} X^\top y`;
	const ridgeSvd = String.raw`\hat\beta_\lambda = \sum_{i=1}^{r} \frac{s_i}{s_i^2 + n\lambda}\,(u_i^\top y)\, v_i = \sum_{i=1}^{r} \underbrace{\frac{s_i^2}{s_i^2 + n\lambda}}_{\text{rétrécissement}} \frac{u_i^\top y}{s_i}\, v_i`;
	const ridgeVariance = String.raw`\mathbb{E}_\varepsilon\bigl\|\hat\beta_\lambda - \mathbb{E}_\varepsilon[\hat\beta_\lambda]\bigr\|^2 = \sigma^2 \sum_{i=1}^{r} \frac{s_i^2}{(s_i^2 + n\lambda)^2} \;\le\; \sigma^2\, \frac{\min(n,p)}{4 n \lambda} \;\le\; \frac{\sigma^2}{4\lambda}`;
	const amgm = String.raw`(s^2 + c)^2 - 4 c s^2 = (s^2 - c)^2 \ge 0 \quad\Longrightarrow\quad \frac{s^2}{(s^2 + c)^2} \le \frac{1}{4c}`;

	// Theorem 6.8 (Hastie et al. 2022, Corollary 5)
	const hastieRidge = String.raw`\mathcal{R}(\hat\beta_\lambda) - \sigma^2 \;\xrightarrow{\text{p.s.}}\; \underbrace{r^2 \lambda^2\, m'(-\lambda)}_{\text{biais}} + \underbrace{\sigma^2 \gamma \bigl(m(-\lambda) - \lambda\, m'(-\lambda)\bigr)}_{\text{variance}}`;
	const stieltjes = String.raw`m(z) = \int \frac{\mathrm{d}\mu_\gamma(s)}{s - z} = \frac{1 - \gamma - z - \sqrt{(1 - \gamma - z)^2 - 4\gamma z}}{2\gamma z}`;
	const lambdaStar = String.raw`\lambda^\star = \frac{\sigma^2 \gamma}{r^2}, \qquad \mathcal{R}(\hat\beta_{\lambda^\star}) - \sigma^2 \to \sigma^2 \gamma\, m(-\lambda^\star)`;
	const bayesLink = String.raw`\beta \sim \mathcal{N}\Bigl(0, \tfrac{r^2}{p} I_p\Bigr) \quad\Longrightarrow\quad \mathbb{E}[\beta \mid X, y] = \hat\beta_{\lambda} \ \text{ avec } \ \lambda = \frac{\sigma^2}{n\, r^2/p} = \frac{\sigma^2 \gamma}{r^2}`;
	const nakkiranMonotone = String.raw`\bar{\mathcal{R}}\bigl(\hat\beta^{\,\mathrm{opt}}_{n+1}\bigr) \le \bar{\mathcal{R}}\bigl(\hat\beta^{\,\mathrm{opt}}_{n}\bigr) \quad \text{pour tous } n,\ d,\ \beta^\star,\ \sigma > 0`;

	// Classification
	const sigmoidOpen = String.raw`\sigma(z) = \frac{1}{1 + e^{-z}} \in \,]0, 1[ \quad \text{pour tout } z \in \mathbb{R}`;
	const logisticRisk = String.raw`\widehat{L}(w) = \frac{1}{n} \sum_{i=1}^{n} \log\bigl(1 + e^{-y_i\, w^\top x_i}\bigr) = -\frac{1}{n} \sum_{i=1}^{n} \log \sigma\bigl(y_i\, w^\top x_i\bigr)`;
	const strictSep = String.raw`\exists\, w \in \mathbb{R}^p : \quad y_i\, w^\top x_i > 0 \quad \text{pour tout } i`;
	const rayLimit = String.raw`\widehat{L}(t w) = \frac{1}{n} \sum_{i=1}^{n} \log\bigl(1 + e^{-t\, y_i w^\top x_i}\bigr) \xrightarrow[t \to +\infty]{} 0`;
	const coerciveBound = String.raw`\widehat{L}(w) \ge \frac{1}{n} \log\bigl(1 + e^{c \|w\|}\bigr) \ge \frac{c}{n}\, \|w\|, \qquad c = \min_{\|u\| = 1} \, \max_{i} \bigl(-y_i\, u^\top x_i\bigr) > 0`;
	const hingeZero = String.raw`\max\bigl(0,\, 1 - y_i\, w^\top x_i\bigr) = 0 \iff y_i\, w^\top x_i \ge 1`;
	const coverCount = String.raw`C(n, d) = 2 \sum_{k=0}^{d-1} \binom{n-1}{k}`;
	const coverProba = String.raw`\mathbb{P}(\text{séparable}) = \frac{C(n,d)}{2^n} = \mathbb{P}\bigl(\mathrm{Bin}(n-1, \tfrac12) \le d - 1\bigr), \qquad \mathbb{P}(\text{séparable}) = \tfrac12 \ \text{ si } n = 2d`;
	const coverRecursion = String.raw`C(n+1, d) = C(n, d) + C(n, d-1)`;
	const candesSur = String.raw`h_{\mathrm{MLE}}(\beta_0, \gamma_0) = \min_{t_0, t_1} \mathbb{E}\bigl[(t_0 Y + t_1 V - Z)_+^2\bigr]`;
	const angleError = String.raw`\mathbb{P}\bigl(\operatorname{sign}(x^\top \hat w) \neq y\bigr) = \eta + (1 - 2\eta)\, \frac{\angle(\hat w, \beta)}{\pi}`;
	const svmEqualsLs = String.raw`p > 10\, n \ln n + n - 1`;
	const chatterjiLong = String.raw`\mathbb{P}\bigl(\operatorname{sign}(\hat w^\top x) \neq y\bigr) \le \eta + \exp\bigl(-c\, \|\mu\|^4 / p\bigr)`;

	// Deep learning
	const emc = String.raw`\mathrm{EMC}_{\mathcal{D}, \epsilon}(\mathcal{T}) = \max\bigl\{ n \;:\; \mathbb{E}_{S \sim \mathcal{D}^n}\bigl[\mathrm{Error}_S(\mathcal{T}(S))\bigr] \le \epsilon \bigr\}`;
	const rfModel = String.raw`f(x) = \sum_{k=1}^{N} a_k\, \sigma(\langle w_k, x\rangle), \qquad w_k \text{ tirés au hasard puis figés}`;
	const geigerScaling = String.raw`\|f_N - \bar f_N\| \sim N^{-1/4}, \qquad \epsilon_N - \epsilon_\infty \sim N^{-1/2}`;
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'La double descente'}
	subtitle="De la régression linéaire aux réseaux profonds : interpolation, conditionnement et régularisation"
	prev={prevMeta}
	next={nextMeta}
>
	<!-- ═══════════════════════════ 1. Introduction ═══════════════════════════ -->
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="introduction">Au-delà de la courbe en U</h2>

		<p>
			La leçon précédente a présenté la régularisation comme un arbitrage entre biais et variance :
			quand la complexité du modèle augmente, le biais diminue, la variance augmente, et le risque
			de test dessine une courbe en U dont il faut trouver le creux. Ce tableau est juste… tant que
			le modèle ne peut pas <em>interpoler</em> les données. Les réseaux de neurones modernes
			possèdent bien plus de paramètres que d'observations, atteignent un risque d'entraînement nul,
			et généralisent pourtant très bien. Belkin, Hsu, Ma &amp; Mandal (2019) ont proposé de
			réconcilier ces deux mondes par une courbe unique, qu'ils ont baptisée
			<strong>double descente</strong>.
		</p>

		<DefinitionBlock number="6.1" title="Seuil d'interpolation et double descente">
			<p>
				Pour une famille de modèles indexée par sa complexité (nombre de paramètres
				<KatexInline formula="p" />) et un échantillon de taille <KatexInline formula="n" />, le
				<strong>seuil d'interpolation</strong> est la plus petite complexité à partir de laquelle la
				procédure d'apprentissage annule le risque d'entraînement — ou, pour une perte qui ne
				s'annule jamais comme la perte logistique, l'erreur de classification d'entraînement (voir
				la Proposition 6.10). On parle de
				<strong>double descente</strong> lorsque le risque de test, tracé en fonction de la complexité,
				présente trois régimes :
			</p>
			<ol>
				<li>
					<strong>sous-paramétré</strong> (<KatexInline formula={String.raw`p \ll n`} />) : la
					courbe en U classique ;
				</li>
				<li>
					<strong>critique</strong> (<KatexInline formula={String.raw`p \approx n`} />) : le modèle
					interpole tout juste, et le risque de test présente un pic, parfois infini ;
				</li>
				<li>
					<strong>sur-paramétré</strong> (<KatexInline formula={String.raw`p \gg n`} />) : le risque
					redescend, parfois sous le minimum du régime sous-paramétré, bien que le modèle interpole
					les données.
				</li>
			</ol>
		</DefinitionBlock>

		<p>
			La Partie IX (leçon 4) rencontrera ce phénomène sous l'angle de la théorie VC, qu'il met en
			défaut. Ici, on le dissèque : on montre <em>exactement</em> d'où vient le pic dans le cas
			linéaire, pourquoi il s'agit d'un problème de <strong>conditionnement</strong>, comment la
			<strong>régularisation</strong> le supprime, puis on suit le phénomène en classification et en deep
			learning.
		</p>

		<Callout type="note" title="Un phénomène plus ancien que son nom">
			<p>
				Loog, Viering, Mey, Krijthe &amp; Tax (2020) retracent une « préhistoire » de la double
				descente. Dès la fin des années 1980, des travaux de physique statistique observaient un pic
				de l'erreur de l'estimateur par pseudo-inverse ; Opper, Kinzel, Kleinz &amp; Nehl (1990)
				montrent, pour un perceptron appris par pseudo-inverse, que la capacité de généralisation
				retombe exactement au niveau du hasard lorsque le nombre d'exemples égale le nombre de
				paramètres. Duin (2000) observe la même forme sur données réelles avec le discriminant de
				Fisher par pseudo-inverse.
			</p>
		</Callout>

		<h3>Notations</h3>
		<p>
			Dans toute la leçon, <KatexInline formula={designMatrix} /> est la matrice de design (une observation
			par ligne), <KatexInline formula={aspectRatio} /> le rapport d'aspect, et l'on note
			<KatexInline formula={String.raw`X^{+}`} /> la pseudo-inverse de Moore–Penrose (Théorème 2.6.1.bis,
			Partie I, leçon 2). On distingue soigneusement deux mesures du risque, que la littérature emploie
			l'une ou l'autre :
		</p>
		<KatexBlock formula={testRisk} />
		<KatexBlock formula={excessRisk} />
		<p>
			La première (risque de test, bruit inclus) est celle de Belkin, Hsu &amp; Xu (2020) ; la
			seconde (risque en excès) est celle de Hastie, Montanari, Rosset &amp; Tibshirani (2022).
			Elles diffèrent de la constante <KatexInline formula={String.raw`\sigma^2`} />.
		</p>
	</TheorySection>

	<!-- ═══════════════════════════ 2. Régression linéaire ═══════════════════════════ -->
	<TheorySection>
		<h2 id="regression-lineaire">Régression linéaire : l'estimateur de norme minimale</h2>

		<p>
			Le cadre le plus simple où la double descente se calcule exactement est la régression linéaire
			gaussienne avec des « variables faibles » : la réponse dépend de <KatexInline formula="D" /> variables,
			mais le modèle n'en utilise qu'un sous-ensemble <KatexInline formula="T" /> de taille
			<KatexInline formula="p" />. Faire croître <KatexInline formula="p" /> revient à faire croître la
			complexité du modèle.
		</p>
		<KatexBlock formula={linearModel} />
		<p>
			On ajuste le modèle par moindres carrés sur les colonnes <KatexInline formula="T" /> ; lorsque plusieurs
			solutions existent (<KatexInline formula={String.raw`p > n`} />), on retient celle de norme
			minimale — c'est la limite de Ridge quand <KatexInline
				formula={String.raw`\lambda \to 0^+`}
			/>, et c'est aussi la solution vers laquelle converge la descente de gradient initialisée en 0
			(elle reste dans l'espace engendré par les lignes de <KatexInline formula="X_T" />) :
		</p>
		<KatexBlock formula={minNormEstimator} />

		<TheoremBlock number="6.2" title="Interpolation au-delà du seuil">
			<p>
				Si <KatexInline formula={String.raw`p \ge n`} /> et <KatexInline formula="X_T" /> est de rang
				<KatexInline formula="n" /> (ce qui a lieu presque sûrement pour un design gaussien), alors
			</p>
			<KatexBlock formula={interpolates} />
			<p>
				et le risque d'entraînement est nul. Le seuil d'interpolation de l'estimateur de norme
				minimale est donc <KatexInline formula="p = n" />.
			</p>
		</TheoremBlock>
		<Callout type="proof" title="Démonstration">
			<p>
				Avec la SVD <KatexInline formula={String.raw`X_T = U\Sigma V^\top`} /> de rang
				<KatexInline formula="n" />, la matrice <KatexInline formula="U" /> est carrée orthogonale et
				<KatexInline
					formula={String.raw`X_T X_T^{+} = U \Sigma \Sigma^{+} U^\top = U I_n U^\top = I_n`}
				/>. Pour une matrice gaussienne, les <KatexInline formula="n" /> lignes sont presque sûrement
				linéairement indépendantes dès que <KatexInline formula={String.raw`p \ge n`} />. ∎
			</p>
		</Callout>

		<h3>Le risque exact, à taille finie</h3>
		<p>
			Belkin, Hsu &amp; Xu (2020, Théorème 1) donnent l'espérance exacte du risque de test, pour
			tout
			<KatexInline formula="n" /> et tout <KatexInline formula="p" />. Notons
			<KatexInline formula={String.raw`\beta_T`} /> la partie du vrai paramètre portée par les variables
			utilisées et <KatexInline formula={String.raw`\beta_{T^c}`} /> celle portée par les variables ignorées.
		</p>

		<TheoremBlock number="6.3" title="Risque de l'estimateur de norme minimale">
			<p>
				Sous le modèle ci-dessus, avec <KatexInline formula={String.raw`\hat\beta = X_T^{+}y`} />
				complété par des zéros hors de <KatexInline formula="T" />, et
				<KatexInline formula={String.raw`(x_0, y_0)`} /> un nouveau couple indépendant :
			</p>
			<KatexBlock formula={bhxRisk} />
		</TheoremBlock>

		<Callout type="proof" title="Démonstration (esquisse)">
			<p>
				<strong>Réduction.</strong> Les variables ignorées étant gaussiennes et indépendantes de
				<KatexInline formula="X_T" />, elles se comportent comme un bruit supplémentaire :
			</p>
			<KatexBlock formula={effectiveNoise} />
			<p>
				avec <KatexInline formula={tildeSigma} />, indépendant de <KatexInline formula="X_T" />. Et
				comme <KatexInline formula={String.raw`x_0`} /> est isotrope,
				<KatexInline
					formula={String.raw`\mathcal{R}(\hat\beta) = \mathbb{E}\|\hat\beta - \beta_T\|^2 + \tilde\sigma^2`}
				/>.
			</p>
			<p>
				<strong>Cas <KatexInline formula={String.raw`p \le n - 2`} />.</strong> L'estimateur est sans
				biais :
			</p>
			<KatexBlock formula={underDecomp} />
			<p>
				la dernière égalité venant de ce que <KatexInline formula={String.raw`X_T^\top X_T`} /> suit une
				loi de Wishart et que l'espérance de son inverse vaut <KatexInline
					formula={String.raw`I_p/(n - p - 1)`}
				/> (résultat classique, déjà utilisé par Breiman &amp; Freedman, 1983).
			</p>
			<p>
				<strong>Cas <KatexInline formula={String.raw`p \ge n + 2`} />.</strong> Notons
				<KatexInline formula={String.raw`\Pi = X_T^{+} X_T`} /> le projecteur orthogonal sur l'espace
				(de dimension <KatexInline formula="n" />) engendré par les lignes de <KatexInline
					formula="X_T"
				/>. Alors
			</p>
			<KatexBlock formula={overDecomp} />
			<p>
				par invariance par rotation de la loi gaussienne (un sous-espace de dimension
				<KatexInline formula="n" /> uniformément réparti « capte » en moyenne une fraction
				<KatexInline formula="n/p" /> de l'énergie d'un vecteur fixé). Le terme de bruit, orthogonal au
				premier, vérifie
			</p>
			<KatexBlock formula={overVariance} />
			<p>
				car <KatexInline formula={String.raw`X_T X_T^\top`} /> est une matrice de Wishart
				<KatexInline formula={String.raw`n \times n`} /> à <KatexInline formula="p" /> degrés de liberté.
				Pour <KatexInline formula={String.raw`|p - n| \le 1`} />, ces espérances d'inverses sont
				infinies. ∎
			</p>
		</Callout>

		<p>Trois lectures de ce théorème :</p>
		<ul>
			<li>
				<strong>Le pic est une divergence de variance.</strong> Les facteurs
				<KatexInline formula={String.raw`p/(n-p-1)`} /> et <KatexInline
					formula={String.raw`n/(p-n-1)`}
				/> explosent au seuil, quel que soit le signal : c'est le bruit
				<KatexInline formula={String.raw`\tilde\sigma^2`} /> qui est amplifié.
			</li>
			<li>
				<strong>Le biais ne réapparaît qu'au-delà du seuil.</strong> Pour <KatexInline
					formula={String.raw`p > n`}
				/>, l'interpolant de norme minimale ne voit qu'une fraction <KatexInline formula="n/p" /> du signal
				: le terme <KatexInline formula={String.raw`(1 - n/p)\|\beta_T\|^2`} /> est le prix à payer pour
				choisir, parmi une infinité d'interpolants, le plus « petit ».
			</li>
			<li>
				<strong>La seconde descente peut gagner.</strong> Si chaque variable ajoutée apporte un peu
				de signal (variables faibles), le risque en <KatexInline formula="p = D" /> peut être inférieur
				à tout ce qu'on obtient pour <KatexInline formula={String.raw`p \le n`} /> : Belkin, Hsu &amp;
				Xu l'établissent (Corollaire 1) pour un sous-ensemble <KatexInline formula="T" /> tiré au hasard,
				dès que le rapport signal sur bruit <KatexInline
					formula={String.raw`\|\beta\|^2/\sigma^2`}
				/>
				dépasse <KatexInline formula={String.raw`D/(D - n - 1)`} />. En revanche, si l'on sait
				ordonner les variables de la plus utile à la moins utile, l'optimum reste dans le régime
				sous-paramétré.
			</li>
		</ul>

		<h3>La limite en grande dimension</h3>
		<p>
			Quand <KatexInline formula="n" /> et <KatexInline formula="p" /> tendent vers l'infini proportionnellement,
			la formule se simplifie. Hastie, Montanari, Rosset &amp; Tibshirani (2022, Théorème 1) l'établissent
			bien au-delà du cas gaussien : il suffit que les coordonnées de
			<KatexInline formula="x" /> soient i.i.d. centrées réduites avec un moment d'ordre
			<KatexInline formula={String.raw`4 + \eta`} /> fini.
		</p>

		<TheoremBlock number="6.4" title="Risque asymptotique de l'interpolant de norme minimale">
			<p>
				Modèle bien spécifié (<KatexInline formula="T" /> contient tout le signal), covariables isotropes,
				<KatexInline formula={String.raw`\|\beta\|^2 = r^2`} />, <KatexInline
					formula={String.raw`p/n \to \gamma \in (0, \infty)`}
				/>. Conditionnellement à <KatexInline formula="X" /> :
			</p>
			<KatexBlock formula={hastieRidgeless} />
		</TheoremBlock>

		<p>
			Dans ce modèle bien spécifié, le régime sous-paramétré n'a pas de biais : la branche gauche
			n'est pas un U mais une montée pure de la variance. Pour <KatexInline
				formula={String.raw`\gamma \to \infty`}
			/>, le risque tend vers <KatexInline formula="r^2" />, celui du prédicteur nul. Et lorsque le
			rapport signal sur bruit dépasse 1, la branche sur-paramétrée admet un minimum local en
		</p>
		<KatexBlock formula={localMin} />
		<p>
			(il suffit d'annuler la dérivée de <KatexInline
				formula={String.raw`r^2(1 - 1/\gamma) + \sigma^2/(\gamma - 1)`}
			/>).
		</p>

		<InteractiveSection
			number="5.1"
			title="Double descente de l'estimateur de norme minimale"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo
				load={() => import('$lib/components/demos/LinearDoubleDescentExplorer.svelte')}
			/>
		</InteractiveSection>

		<ExercisePanel number="5.1" title="Lire la formule exacte">
			<p>
				On prend <KatexInline formula="n = 10" />, <KatexInline
					formula={String.raw`\sigma^2 = 1`}
				/>
				et un modèle bien spécifié (<KatexInline formula={String.raw`\beta_{T^c} = 0`} />,
				<KatexInline formula={String.raw`\|\beta_T\|^2 = 1`} />).
			</p>
			<ol>
				<li>
					Calculer le risque de test pour <KatexInline formula="p = 5" /> et pour
					<KatexInline formula="p = 20" />.
				</li>
				<li>
					Pour <KatexInline formula="p = 20" />, quelle part du risque en excès est due au biais,
					quelle part à la variance ?
				</li>
				<li>
					Que vaut la limite du risque quand <KatexInline formula={String.raw`p \to \infty`} /> à
					<KatexInline formula="n" /> fixé ? Interpréter.
				</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<KatexInline formula={String.raw`p = 5`} /> : <KatexInline
							formula={String.raw`1 \cdot (1 + 5/4) = 2{,}25`}
						/>. <KatexInline formula={String.raw`p = 20`} /> :
						<KatexInline
							formula={String.raw`1\cdot(1 - 10/20) + 1 \cdot (1 + 10/9) = 0{,}5 + 2{,}111 \approx 2{,}611`}
						/>.
					</li>
					<li>
						Risque en excès <KatexInline formula={String.raw`\approx 1{,}611`} /> : biais
						<KatexInline formula={String.raw`0{,}5`} />, variance <KatexInline
							formula={String.raw`10/9 \approx 1{,}111`}
						/>.
					</li>
					<li>
						<KatexInline formula={String.raw`\|\beta_T\|^2 \cdot 1 + \sigma^2 \cdot 1 = 2`} /> : la variance
						disparaît (le bruit est dilué sur une infinité de directions) mais le biais tend vers <KatexInline
							formula={String.raw`\|\beta_T\|^2`}
						/> — l'interpolant de norme minimale tend vers le prédicteur nul. Ici, à signal fixé, le sur-paramétrage
						pur ne bat donc pas le modèle à <KatexInline formula="p = 5" /> ; il faut que les variables
						ajoutées apportent du signal (variables faibles) pour que la seconde descente l'emporte.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>
	</TheorySection>

	<!-- ═══════════════════════════ 3. Conditionnement ═══════════════════════════ -->
	<TheorySection>
		<h2 id="conditionnement">Pourquoi un pic ? Le conditionnement</h2>

		<p>
			Le Théorème 6.3 dit <em>que</em> la variance explose au seuil ; la décomposition en valeurs
			singulières dit <em>pourquoi</em>. Écrivons
		</p>
		<KatexBlock formula={svd} />
		<p>
			de sorte que l'estimateur de norme minimale (Théorème 2.6.1.bis, Partie I, leçon 2) s'écrit
		</p>
		<KatexBlock formula={minNormSvd} />

		<TheoremBlock number="6.5" title="Variance et petites valeurs singulières">
			<p>
				À design <KatexInline formula="X" /> fixé et pour un bruit
				<KatexInline formula={String.raw`\varepsilon \sim \mathcal N(0, \sigma^2 I_n)`} /> :
			</p>
			<KatexBlock formula={varianceSvd} />
		</TheoremBlock>
		<Callout type="proof" title="Démonstration">
			<p>En remplaçant <KatexInline formula={String.raw`y = X\beta + \varepsilon`} /> :</p>
			<KatexBlock formula={noisePart} />
			<p>
				car les <KatexInline formula={String.raw`u_i`} /> sont orthonormés. Les
				<KatexInline formula={String.raw`v_i`} /> étant orthonormés, la norme au carré vaut
				<KatexInline formula={String.raw`\sum_i (u_i^\top\varepsilon)^2 / s_i^2`} />, d'espérance
				<KatexInline formula={String.raw`\sigma^2 \sum_i 1/s_i^2`} />. ∎
			</p>
		</Callout>

		<p>
			La variance est gouvernée par la <strong>plus petite valeur singulière non nulle</strong>
			<KatexInline formula="s_r" /> : une direction dans laquelle les données d'entraînement ne varient
			presque pas est une direction où le bruit est divisé par un nombre minuscule. On retrouve l'analogue
			de l'indice de conditionnement <KatexInline
				formula={String.raw`\kappa = \lambda_1/\lambda_p`}
			/> de la Définition 4.3 (Partie IV, leçon 4), et le phénomène qui ralentit la descente de gradient
			sur une hessienne mal conditionnée (Partie I, leçon 2). Reste à savoir comment se comporte
			<KatexInline formula="s_r" /> pour une matrice aléatoire : c'est l'objet de la théorie des matrices
			aléatoires.
		</p>

		<TheoremBlock number="6.6" title="Spectre d'une matrice de covariance empirique">
			<p>
				Soit <KatexInline formula={designMatrix} /> à coefficients i.i.d. centrés de variance 1, avec
				<KatexInline formula={String.raw`p/n \to \gamma`} />. D'après Marchenko &amp; Pastur (1967),
				la distribution empirique des valeurs propres de <KatexInline
					formula={String.raw`\tfrac1n X^\top X`}
				/> converge vers la loi de densité
			</p>
			<KatexBlock formula={mpDensity} />
			<p>
				complétée, si <KatexInline formula={String.raw`\gamma > 1`} />, d'un atome de masse
				<KatexInline formula={String.raw`1 - 1/\gamma`} /> en 0. D'après Bai &amp; Yin (1993) (moment
				d'ordre 4 fini), les valeurs propres extrêmes non nulles convergent vers les bords du support
				:
			</p>
			<KatexBlock formula={baiYin} />
		</TheoremBlock>

		<p>
			Le conditionnement de <KatexInline formula={String.raw`X^\top X`} /> restreint à son spectre non
			nul vérifie donc
		</p>
		<KatexBlock formula={conditionLimit} />
		<p>
			Au seuil d'interpolation, le bord gauche du support de Marchenko–Pastur touche 0 : il y a des
			valeurs propres arbitrairement petites, et la somme <KatexInline
				formula={String.raw`\sum_i 1/s_i^2`}
			/> explose. Ni trop peu de variables (<KatexInline formula={String.raw`\gamma \ll 1`} />, la
			matrice est « haute » et bien conditionnée), ni beaucoup trop (<KatexInline
				formula={String.raw`\gamma \gg 1`}
			/>, la matrice est « large » et ses <KatexInline formula="n" /> directions sont bien séparées) :
			c'est la matrice <em>carrée</em> qui est mal conditionnée. Advani, Saxe &amp; Sompolinsky
			(2020) l'expriment sur la dynamique d'apprentissage : en régression linéaire entraînée par
			descente de gradient, chaque mode propre de valeur propre <KatexInline
				formula={String.raw`\lambda_i`}
			/> contribue à l'erreur un terme de bruit proportionnel à <KatexInline
				formula={String.raw`1/\lambda_i`}
			/>, et la distribution de Marchenko–Pastur diverge près de l'origine en
			<KatexInline formula={String.raw`\gamma = 1`} />.
		</p>

		<InteractiveSection
			number="5.2"
			title="Spectre et conditionnement autour du seuil"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo load={() => import('$lib/components/demos/GramSpectrumExplorer.svelte')} />
		</InteractiveSection>

		<Callout type="insight" title="Trois ingrédients, tous nécessaires">
			<p>
				Schaeffer et al. (2023) décomposent l'erreur de l'interpolant le long des vecteurs
				singuliers et isolent trois conditions qui doivent être réunies pour qu'un pic apparaisse :
			</p>
			<ol>
				<li>
					les données d'entraînement ont une variance faible mais non nulle dans certaines
					directions singulières ;
				</li>
				<li>les données de test varient de façon notable le long de ces directions ;</li>
				<li>
					les résidus (bruit, ou part du signal non représentable) se projettent fortement sur ces
					directions.
				</li>
			</ol>
			<p>
				Supprimer l'un des trois — par exemple en tronquant les petites valeurs singulières, ou en
				l'absence de bruit dans un modèle bien spécifié — supprime le pic.
			</p>
		</Callout>
	</TheorySection>

	<!-- ═══════════════════════════ 4. Régularisation ═══════════════════════════ -->
	<TheorySection>
		<h2 id="regularisation">La régularisation efface le pic</h2>

		<p>
			Si le pic vient de la division par de petites valeurs singulières, le remède s'impose : ne
			plus diviser par <KatexInline formula={String.raw`s_i`} /> quand <KatexInline
				formula={String.raw`s_i`}
			/>
			est petit. C'est exactement ce que fait Ridge (Définition 5.1, leçon 4). Pour comparer aux résultats
			asymptotiques, on adopte ici la normalisation de Hastie et al. :
		</p>
		<KatexBlock formula={ridgeNormalized} />
		<Callout type="note" title="Convention sur λ">
			<p>
				Le <KatexInline formula={String.raw`\lambda`} /> de la Définition 5.1 (objectif
				<KatexInline formula={String.raw`\|y - Xw\|^2 + \lambda\|w\|^2`} />) vaut
				<KatexInline formula="n" /> fois celui utilisé ici. Les chemins de régularisation sont les mêmes.
			</p>
		</Callout>
		<p>Dans la base singulière, on retrouve les facteurs de rétrécissement de la leçon 4 :</p>
		<KatexBlock formula={ridgeSvd} />

		<TheoremBlock number="6.7" title="La variance de Ridge reste bornée">
			<p>
				Pour tout <KatexInline formula={String.raw`\lambda > 0`} /> et tout design <KatexInline
					formula="X"
				/>,
			</p>
			<KatexBlock formula={ridgeVariance} />
			<p>indépendamment du conditionnement de <KatexInline formula="X" />.</p>
		</TheoremBlock>
		<Callout type="proof" title="Démonstration">
			<p>
				Même calcul que pour la Proposition 6.5, avec le coefficient
				<KatexInline formula={String.raw`s_i/(s_i^2 + n\lambda)`} /> à la place de
				<KatexInline formula={String.raw`1/s_i`} />. Puis, pour tout <KatexInline
					formula={String.raw`c > 0`}
				/> :
			</p>
			<KatexBlock formula={amgm} />
			<p>
				appliqué avec <KatexInline formula={String.raw`c = n\lambda`} /> à chacun des
				<KatexInline formula={String.raw`r \le \min(n,p)`} /> termes. ∎
			</p>
		</Callout>

		<p>
			La borne est atteinte quand <KatexInline formula={String.raw`s_i^2 = n\lambda`} /> : Ridge plafonne
			la contribution de chaque direction au lieu de la laisser exploser. En grande dimension, on dispose
			même du risque exact, exprimé avec la <strong>transformée de Stieltjes</strong> de la loi de
			Marchenko–Pastur <KatexInline formula={String.raw`\mu_\gamma`} /> (atome en 0 compris) :
		</p>
		<KatexBlock formula={stieltjes} />
		<p>
			(on choisit la détermination de la racine pour laquelle <KatexInline
				formula={String.raw`m(-\lambda) > 0`}
			/> quand <KatexInline formula={String.raw`\lambda > 0`} />).
		</p>

		<TheoremBlock number="6.8" title="Risque asymptotique de Ridge et pénalité optimale">
			<p>
				Sous les hypothèses du Théorème 6.4 et pour <KatexInline
					formula={String.raw`\lambda > 0`}
				/>
				(Hastie et al., 2022, Corollaire 5) :
			</p>
			<KatexBlock formula={hastieRidge} />
			<p>Ce risque limite est minimal en</p>
			<KatexBlock formula={lambdaStar} />
			<p>
				et le Ridge optimalement réglé a un risque strictement inférieur à celui de l'interpolant de
				norme minimale pour toutes les valeurs de <KatexInline formula={String.raw`\gamma`} /> et du rapport
				signal sur bruit ; en particulier, il reste fini en <KatexInline
					formula={String.raw`\gamma = 1`}
				/>.
			</p>
		</TheoremBlock>

		<p>
			La valeur de <KatexInline formula={String.raw`\lambda^\star`} /> n'est pas une coïncidence : c'est
			la pénalité de l'estimateur MAP — ici égal à la moyenne a posteriori — sous un a priori gaussien
			isotrope de même énergie que le vrai paramètre (voir la dérivation bayésienne de la leçon 4, avec
			<KatexInline formula={String.raw`\tau^2 = r^2/p`} />) :
		</p>
		<KatexBlock formula={bayesLink} />

		<InteractiveSection
			number="5.3"
			title="Ridge et double descente : risque asymptotique"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo
				load={() => import('$lib/components/demos/RidgeDoubleDescentExplorer.svelte')}
			/>
		</InteractiveSection>

		<p>
			Nakkiran, Venkat, Kakade &amp; Ma (2021) précisent en quel sens la régularisation optimale «
			supprime » la double descente.
		</p>
		<TheoremBlock number="6.9" title="Monotonie du Ridge optimal">
			<p>
				Covariables gaussiennes isotropes <KatexInline
					formula={String.raw`x \sim \mathcal N(0, I_d)`}
				/>, réponse <KatexInline
					formula={String.raw`y = \langle x, \beta^\star\rangle + \mathcal N(0, \sigma^2)`}
				/>. Avec la pénalité optimale (qui, dans la normalisation non divisée par <KatexInline
					formula="n"
				/>, vaut <KatexInline formula={String.raw`d\sigma^2/\|\beta^\star\|^2`} />), le risque de
				test moyen est non croissant en la taille d'échantillon, de façon non asymptotique :
			</p>
			<KatexBlock formula={nakkiranMonotone} />
			<p>
				Un énoncé analogue vaut en fonction de la taille du modèle pour un modèle de projections
				aléatoires.
			</p>
		</TheoremBlock>

		<Callout type="warning" title="Ce que « supprimer le pic » veut dire">
			<ul>
				<li>
					Le Théorème 6.9 suppose des covariables gaussiennes <em>isotropes</em> ; pour des covariances
					quelconques, la monotonie n'est que conjecturée, et les auteurs exhibent un contre-exemple non
					gaussien à bruit hétéroscédastique.
				</li>
				<li>
					Le Théorème 6.8 garantit l'absence de divergence et la domination de l'interpolant, pas la
					monotonie en <KatexInline formula={String.raw`\gamma`} /> : dans un modèle mal spécifié, le
					Ridge optimal peut avoir son minimum près de <KatexInline
						formula={String.raw`\gamma = 1`}
					/>.
				</li>
				<li>
					En pratique, <KatexInline formula={String.raw`\lambda^\star`} /> dépend de quantités inconnues
					(<KatexInline formula={String.raw`r^2, \sigma^2`} />) ; Hastie et al. montrent que la
					validation croisée leave-one-out et la GCV l'atteignent asymptotiquement.
				</li>
			</ul>
		</Callout>

		<p>
			<strong>Régularisation implicite.</strong> On n'a pas toujours besoin d'une pénalité
			explicite. Advani, Saxe &amp; Sompolinsky (2020) montrent, pour la descente de gradient en
			régression linéaire, que l'<strong>arrêt précoce</strong> optimal donne une erreur très proche
			de celle de la pénalité <KatexInline formula="L_2" /> optimale : arrêter l'optimisation avant que
			les modes de petite valeur propre ne soient appris revient à ne pas diviser par ces petites valeurs
			propres.
		</p>

		<ExercisePanel number="5.2" title="Borne de variance de Ridge et vecteur singulier critique">
			<ol>
				<li>
					Démontrer l'inégalité <KatexInline formula={String.raw`s^2/(s^2 + c)^2 \le 1/(4c)`} /> et préciser
					le cas d'égalité.
				</li>
				<li>
					Une matrice <KatexInline formula="X" /> a deux valeurs singulières <KatexInline
						formula={String.raw`s_1 = 10`}
					/> et <KatexInline formula={String.raw`s_2 = 0{,}01`} />. Comparer la variance
					<KatexInline formula={String.raw`\sigma^2 \sum 1/s_i^2`} /> de l'estimateur de norme minimale
					et celle de Ridge pour <KatexInline formula={String.raw`n\lambda = 1`} />.
				</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<KatexInline formula={String.raw`(s^2 + c)^2 - 4cs^2 = (s^2 - c)^2 \ge 0`} />, avec
						égalité si et seulement si <KatexInline formula={String.raw`s^2 = c`} />.
					</li>
					<li>
						Norme minimale : <KatexInline
							formula={String.raw`\sigma^2(10^{-2} + 10^{4}) \approx 10^4\,\sigma^2`}
						/>, dominée par la petite valeur singulière. Ridge : <KatexInline
							formula={String.raw`\sigma^2\bigl(\tfrac{100}{101^2} + \tfrac{10^{-4}}{(1{,}0001)^2}\bigr) \approx 0{,}0099\,\sigma^2`}
						/>. La direction mal conditionnée est quasiment éteinte (facteur de rétrécissement
						<KatexInline formula={String.raw`\approx 10^{-4}`} />) au lieu d'être amplifiée.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>
	</TheorySection>

	<!-- ═══════════════════════════ 5. Classification ═══════════════════════════ -->
	<TheorySection>
		<h2 id="classification">Double descente en classification</h2>

		<p>
			Le phénomène n'est pas propre à la perte quadratique. Dans l'expérience fondatrice de Belkin
			et al. (2019) — des features de Fourier aléatoires sur MNIST — l'erreur 0-1 de test présente
			elle aussi un pic au seuil d'interpolation <KatexInline formula="N = n" />, où le prédicteur «
			n'a aucune capacité prédictive pour la classification », avant de redescendre sous le minimum
			de la courbe en U. Mais en classification, la position du seuil dépend de la
			<strong>perte</strong>
			utilisée pour l'entraînement.
		</p>

		<h3>Perte carrée : le seuil est p = n</h3>
		<p>
			Si l'on ajuste les étiquettes <KatexInline formula={String.raw`\pm 1`} /> par moindres carrés puis
			que l'on classe par <KatexInline formula={String.raw`\operatorname{sign}(x^\top\hat w)`} />,
			tout ce qui précède s'applique à <KatexInline formula={String.raw`\hat w`} /> : le seuil d'interpolation
			est <KatexInline formula="p = n" />. Kini &amp; Thrampoulidis (2020) montrent dans un modèle
			gaussien que l'erreur de test tend alors vers <KatexInline formula="1/2" /> quand
			<KatexInline formula={String.raw`p/n \to 1`} />, quel que soit le rapport signal sur bruit :
			au seuil, le classifieur ne fait pas mieux que le hasard. C'est le résultat d'Opper et al.
			(1990) pour le perceptron par pseudo-inverse, vu trente ans plus tard. Pour des covariables
			gaussiennes, l'erreur d'un classifieur linéaire se calcule exactement à partir de son angle
			avec le vrai paramètre (si une fraction <KatexInline formula={String.raw`\eta`} /> des étiquettes
			est inversée) :
		</p>
		<KatexBlock formula={angleError} />

		<h3>Régression logistique : on n'interpole jamais exactement</h3>
		<p>
			Jusqu'ici, « interpoler » avait un sens précis, hérité de la régression linéaire : le modèle
			reproduit <em>exactement</em> les réponses, <KatexInline formula={String.raw`f(x_i) = y_i`} />
			pour tout <KatexInline formula="i" />, et le risque d'entraînement vaut 0. En régression
			logistique, ce sens n'existe plus. Le modèle prédit une probabilité
			<KatexInline formula={String.raw`\mathbb{P}(Y = 1 \mid x) = \sigma(w^\top x)`} /> à travers la sigmoïde
			(Définition 2.2, Partie II, leçon 2), qui n'atteint jamais 0 ni 1 :
		</p>
		<KatexBlock formula={sigmoidOpen} />
		<p>
			Avec des étiquettes <KatexInline formula={String.raw`y_i \in \{-1, +1\}`} />, la
			log-vraisemblance négative moyenne — le risque empirique logistique — s'écrit
		</p>
		<KatexBlock formula={logisticRisk} />
		<p>
			Chaque terme est <strong>strictement positif</strong> : aucune valeur de
			<KatexInline formula="w" /> ne donne la probabilité 1 à l'étiquette observée, donc aucun paramètre
			n'annule ce risque. La seule chose que le modèle puisse reproduire exactement, ce sont les
			<em>étiquettes</em>
			via le signe de <KatexInline formula={String.raw`w^\top x_i`} />, c'est-à-dire annuler
			l'erreur 0-1 d'entraînement — ce qui exige que les données soient linéairement séparables. La
			proposition suivante précise ce qui se passe alors.
		</p>

		<TheoremBlock number="6.10" title="Perte logistique et séparabilité">
			<p>
				Soient <KatexInline formula={String.raw`(x_i, y_i)_{i \le n}`} />, <KatexInline
					formula={String.raw`y_i \in \{-1, +1\}`}
				/>, et <KatexInline formula={String.raw`\widehat{L}`} /> le risque logistique ci-dessus.
			</p>
			<ol>
				<li>
					Pour tout <KatexInline formula="w" />, <KatexInline
						formula={String.raw`\widehat{L}(w) > 0`}
					/> : le risque logistique ne s'annule jamais.
				</li>
				<li>
					<strong>Cas séparable.</strong> S'il existe un séparateur strict,
					<KatexBlock formula={strictSep} />
					<span
						>alors <KatexInline formula={String.raw`\inf_w \widehat{L}(w) = 0`} /> mais cet infimum n'est
						pas atteint : l'estimateur du maximum de vraisemblance
						<strong>n'existe pas</strong>.</span
					>
				</li>
				<li>
					<strong>Cas non séparable.</strong> Si pour tout <KatexInline
						formula={String.raw`w \neq 0`}
					/> il existe <KatexInline formula="i" /> avec <KatexInline
						formula={String.raw`y_i\, w^\top x_i < 0`}
					/>, alors <KatexInline formula={String.raw`\widehat{L}`} /> est coercive et admet un minimiseur
					: le maximum de vraisemblance existe, et son risque est strictement positif.
				</li>
				<li>
					Si les <KatexInline formula={String.raw`x_i`} /> sont en position générale (toute famille d'au
					plus <KatexInline formula="p" /> d'entre eux est libre), on est toujours dans l'un des deux
					cas précédents.
				</li>
			</ol>
		</TheoremBlock>
		<Callout type="proof" title="Démonstration">
			<p>
				<strong>1.</strong> Chaque terme <KatexInline formula={String.raw`\log(1 + e^{-z})`} /> est strictement
				positif car <KatexInline formula={String.raw`e^{-z} > 0`} />.
			</p>
			<p>
				<strong>2.</strong> Si <KatexInline formula="w" /> sépare strictement, chaque
				<KatexInline formula={String.raw`y_i w^\top x_i`} /> est <KatexInline
					formula={String.raw`> 0`}
				/>, et le long du rayon <KatexInline formula={String.raw`t w`} /> :
			</p>
			<KatexBlock formula={rayLimit} />
			<p>Avec le point 1, l'infimum vaut 0 et n'est atteint en aucun point.</p>
			<p>
				<strong>3.</strong> La fonction <KatexInline
					formula={String.raw`u \mapsto \max_i(-y_i u^\top x_i)`}
				/> est continue et, par hypothèse, strictement positive sur la sphère unité, qui est compacte
				: son minimum <KatexInline formula="c" /> est donc <KatexInline
					formula={String.raw`> 0`}
				/>. Pour
				<KatexInline formula={String.raw`w = \|w\| u`} />, le terme de l'indice <KatexInline
					formula="i"
				/> réalisant le maximum vérifie <KatexInline
					formula={String.raw`-y_i w^\top x_i \ge c\|w\|`}
				/>, d'où
			</p>
			<KatexBlock formula={coerciveBound} />
			<p>
				Une fonction convexe, continue et coercive admet un minimiseur, de risque strictement
				positif par le point 1.
			</p>
			<p>
				<strong>4.</strong> Supposons qu'aucun des deux cas ne s'applique : il existe
				<KatexInline formula={String.raw`w \neq 0`} /> avec <KatexInline
					formula={String.raw`y_i w^\top x_i \ge 0`}
				/> pour tout <KatexInline formula="i" />, l'égalité ayant lieu pour un ensemble non vide
				<KatexInline formula="Z" /> d'indices. Les <KatexInline formula={String.raw`x_i`} />,
				<KatexInline formula={String.raw`i \in Z`} />, sont orthogonaux à <KatexInline
					formula="w"
				/> : ils engendrent un sous-espace strict, donc (position générale) <KatexInline
					formula={String.raw`|Z| \le p - 1`}
				/> et ils sont linéairement indépendants. On peut alors choisir <KatexInline formula="u" /> avec
				<KatexInline formula={String.raw`y_i u^\top x_i = 1`} /> pour <KatexInline
					formula={String.raw`i \in Z`}
				/>, et <KatexInline formula={String.raw`w + \varepsilon u`} /> sépare strictement pour
				<KatexInline formula={String.raw`\varepsilon > 0`} /> assez petit : contradiction. ∎
			</p>
		</Callout>

		<p>
			Dans le cas séparable, la descente de gradient sur <KatexInline
				formula={String.raw`\widehat{L}`}
			/> ne converge donc vers aucun point : la norme de <KatexInline formula="w" /> diverge, les probabilités
			prédites <KatexInline formula={String.raw`\sigma(y_i w^\top x_i)`} /> tendent vers 1 sur tous les
			points d'entraînement <em>sans jamais l'atteindre</em>, et le risque logistique tend vers 0
			sans s'annuler. On parle parfois d'<strong>interpolation à la limite</strong> : ce qui est interpolé,
			ce sont les étiquettes (erreur 0-1 nulle), pas les probabilités. On peut résumer les trois sens
			du mot « interpoler » rencontrés dans cette leçon :
		</p>
		<ul>
			<li>
				<strong>Perte carrée</strong> (régression, ou moindres carrés sur les étiquettes
				<KatexInline formula={String.raw`\pm 1`} />) : <KatexInline
					formula={String.raw`f(x_i) = y_i`}
				/> exactement, risque d'entraînement exactement nul, atteint dès <KatexInline
					formula="p = n"
				/> (Proposition 6.2).
			</li>
			<li>
				<strong>Perte charnière</strong> (SVM) : <KatexInline formula={hingeZero} />. Dès que les
				données sont strictement séparables, il suffit de dilater un séparateur pour annuler
				<em>exactement</em> le risque : le seuil est celui de séparabilité.
			</li>
			<li>
				<strong>Perte logistique</strong> : le risque n'est jamais nul (Proposition 6.10) ; au-delà du
				seuil de séparabilité, l'erreur 0-1 d'entraînement est nulle et le risque logistique n'est qu'arbitrairement
				petit, au prix de poids de norme infinie à la limite.
			</li>
		</ul>

		<Callout type="note" title="La régularisation rétablit l'existence">
			<p>
				Avec une pénalité <KatexInline formula={String.raw`\lambda \|w\|^2`} />, <KatexInline
					formula={String.raw`\lambda > 0`}
				/>, l'objectif devient fortement convexe et coercif : il admet un unique minimiseur même
				pour des données séparables, et les probabilités prédites restent dans <KatexInline
					formula={String.raw`]0,1[`}
				/> à distance de 0 et de 1. C'est l'analogue logistique de ce que Ridge fait au pic de la régression
				(Proposition 6.7) ; l'arrêt précoce de la descente de gradient joue le même rôle.
			</p>
		</Callout>

		<h3>Le seuil de séparabilité</h3>
		<p>
			En régression logistique, le seuil d'interpolation de la Définition 6.1 est donc un
			<strong>seuil de séparabilité</strong> : la plus petite dimension à partir de laquelle l'échantillon
			devient linéairement séparable. Pour des étiquettes aléatoires, il est donné par un théorème classique
			de Cover.
		</p>

		<TheoremBlock number="6.11" title="Théorème de comptage de Cover">
			<p>
				D'après Cover (1965), parmi les <KatexInline formula={String.raw`2^n`} /> étiquetages de
				<KatexInline formula="n" /> points en position générale de <KatexInline
					formula={String.raw`\mathbb R^d`}
				/>, le nombre de ceux qui sont séparables par un hyperplan passant par l'origine est
			</p>
			<KatexBlock formula={coverCount} />
			<p>En particulier, pour des étiquettes équiprobables et indépendantes des points,</p>
			<KatexBlock formula={coverProba} />
		</TheoremBlock>
		<Callout type="proof" title="Démonstration (idée)">
			<p>
				On ajoute un <KatexInline formula={String.raw`(n+1)`} />-ième point <KatexInline
					formula="x"
				/>. Chaque étiquetage séparable des <KatexInline formula="n" /> premiers points se prolonge d'au
				moins une façon ; il se prolonge des <em>deux</em> façons si et seulement s'il est séparable
				par un hyperplan passant aussi par <KatexInline formula="x" />, c'est-à-dire par un
				hyperplan d'un problème de dimension <KatexInline formula="d-1" /> (projection orthogonale à
				<KatexInline formula="x" />). D'où la récurrence
			</p>
			<KatexBlock formula={coverRecursion} />
			<p>
				avec <KatexInline formula={String.raw`C(1, d) = 2`} />, que la formule annoncée vérifie
				(règle de Pascal). La symétrie de la loi <KatexInline
					formula={String.raw`\mathrm{Bin}(2d-1, \tfrac12)`}
				/> donne la probabilité <KatexInline formula="1/2" /> en <KatexInline formula="n = 2d" />. ∎
			</p>
		</Callout>

		<p>
			Avec des étiquettes informatives, la transition arrive plus tôt. Candès &amp; Sur (2020)
			montrent, pour la régression logistique à covariables gaussiennes avec <KatexInline
				formula={String.raw`p/n \to \kappa`}
			/>, que l'estimateur du maximum de vraisemblance existe avec probabilité tendant vers 1 si
			<KatexInline formula={String.raw`\kappa < h_{\mathrm{MLE}}`} /> et vers 0 si
			<KatexInline formula={String.raw`\kappa > h_{\mathrm{MLE}}`} />, avec
		</p>
		<KatexBlock formula={candesSur} />
		<p>
			où <KatexInline formula={String.raw`X, Z \sim \mathcal N(0,1)`} /> sont indépendantes,
			<KatexInline formula={String.raw`\mathbb P(Y = 1 \mid X) = \sigma(\beta_0 + \gamma_0 X)`} />,
			<KatexInline formula={String.raw`V = YX`} />, et <KatexInline
				formula={String.raw`\gamma_0^2`}
			/>
			mesure la force du signal. Sans signal, <KatexInline
				formula={String.raw`h_{\mathrm{MLE}}(0,0) = 1/2`}
			/> et l'on retrouve Cover ; plus le signal est fort, plus <KatexInline
				formula={String.raw`h_{\mathrm{MLE}}`}
			/> est petit.
		</p>
		<p>
			Que fait la descente de gradient au-delà de ce seuil ? Sur des données séparables, elle n'a
			pas de minimiseur : la norme des poids croît comme <KatexInline
				formula={String.raw`\log t`}
			/>, et leur <em>direction</em> converge vers celle du SVM à marge maximale (Soudry et al.,
			2018 — c'est le biais implicite rencontré en Partie IX, leçon 4). Deng, Kammoun &amp;
			Thrampoulidis (2022) calculent l'erreur exacte de ce classifieur en grande dimension : maximum
			de vraisemblance en dessous du seuil de séparabilité, marge maximale au-dessus. La courbe
			présente une double descente dont le pic est au seuil de séparabilité <KatexInline
				formula={String.raw`\kappa^\star < 1/2`}
			/>, et non en <KatexInline formula="p = n" />.
		</p>

		<h3>Quand toutes les pertes se rejoignent</h3>
		<TheoremBlock number="6.12" title="Prolifération des vecteurs de support">
			<p>
				Muthukumar, Narang, Subramanian, Belkin, Hsu &amp; Sahai (2021) montrent que pour des
				covariables gaussiennes isotropes et des étiquettes fixées, dès que
				<KatexInline formula={svmEqualsLs} />, avec grande probabilité <strong>tous</strong> les
				points d'entraînement sont vecteurs de support du SVM à marge dure. Le SVM coïncide alors
				avec l'interpolant de norme minimale des étiquettes <KatexInline
					formula={String.raw`\pm 1`}
				/> par moindres carrés.
			</p>
		</TheoremBlock>
		<p>
			Hsu, Muthukumar &amp; Xu (2021) étendent la condition aux covariances anisotropes (en termes
			de dimensions effectives) et montrent qu'une dimension de l'ordre de <KatexInline
				formula="n"
			/> ne suffit pas dans le cas isotrope. Ainsi, très loin du seuil, perte carrée, perte charnière
			et perte logistique (via le biais implicite) produisent le même classifieur. Deux conséquences remarquables
			:
		</p>
		<ul>
			<li>
				<strong>Classer est plus facile que régresser.</strong> Muthukumar et al. exhibent des régimes
				sur-paramétrés où l'interpolant classe bien (erreur 0-1 → 0) alors que, vu comme régresseur, il
				ne fait pas mieux que le prédicteur nul.
			</li>
			<li>
				<strong>Sur-apprentissage bénin.</strong> Chatterji &amp; Long (2021) montrent, dans un
				modèle de mélange où une fraction <KatexInline formula={String.raw`\eta`} /> des étiquettes est
				corrompue, que le classifieur à marge maximale interpole les étiquettes bruitées tout en vérifiant,
				avec grande probabilité,
				<KatexBlock formula={chatterjiLong} />
				<span
					>pour une dimension <KatexInline formula="p" /> suffisamment grande devant
					<KatexInline formula={String.raw`n^2`} /> et un écart entre classes
					<KatexInline formula={String.raw`\|\mu\|`} /> suffisant : on approche l'erreur de Bayes
					<KatexInline formula={String.raw`\eta`} /> malgré l'interpolation.</span
				>
			</li>
		</ul>

		<InteractiveSection
			number="5.4"
			title="Double descente de l'erreur 0-1"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo
				load={() => import('$lib/components/demos/ClassificationDoubleDescentExplorer.svelte')}
			/>
		</InteractiveSection>

		<ExercisePanel number="5.3" title="Capacité d'un séparateur linéaire">
			<ol>
				<li>
					Calculer <KatexInline formula={String.raw`C(n, 1)`} /> et interpréter géométriquement.
				</li>
				<li>
					Vérifier que <KatexInline formula={String.raw`C(n, d) = 2^n`} /> pour <KatexInline
						formula={String.raw`n \le d`}
					/>.
				</li>
				<li>
					Pour <KatexInline formula="n = 40" /> points, à partir de quelle dimension
					<KatexInline formula="d" /> des étiquettes aléatoires sont-elles séparables avec probabilité
					au moins 1/2 ? Comparer au seuil d'interpolation de la perte carrée.
				</li>
			</ol>
			{#snippet solution()}
				<ol>
					<li>
						<KatexInline formula={String.raw`C(n,1) = 2\binom{n-1}{0} = 2`} /> : en dimension 1, un «
						hyperplan » passant par l'origine sépare la demi-droite positive de la négative ; seuls les
						deux étiquetages « signe de <KatexInline formula="x" /> » et son opposé sont réalisables.
					</li>
					<li>
						Si <KatexInline formula={String.raw`n \le d`} />, la somme porte sur
						<KatexInline formula={String.raw`k = 0, \dots, n-1`} /> (les termes suivants sont nuls) :
						<KatexInline formula={String.raw`2 \cdot 2^{n-1} = 2^n`} />. Tous les étiquetages sont
						réalisables : les points sont pulvérisés.
					</li>
					<li>
						Par symétrie de la loi binomiale, <KatexInline
							formula={String.raw`\mathbb P(\mathrm{Bin}(39, \tfrac12) \le 19) = \tfrac12`}
						/> : la probabilité <KatexInline
							formula={String.raw`\mathbb P(\mathrm{Bin}(39, \tfrac12) \le d-1)`}
						/> atteint 1/2 dès que <KatexInline formula={String.raw`d - 1 \ge 19`} />, soit
						<KatexInline formula={String.raw`d \ge 20 = n/2`} />. Le seuil de séparabilité est donc
						deux fois plus tôt que le seuil <KatexInline formula="p = n" /> de la perte carrée.
					</li>
				</ol>
			{/snippet}
		</ExercisePanel>
	</TheorySection>

	<!-- ═══════════════════════════ 6. Deep learning ═══════════════════════════ -->
	<TheorySection>
		<h2 id="deep-learning">Double descente en deep learning</h2>

		<p>
			Zhang, Bengio, Hardt, Recht &amp; Vinyals (2017) ont montré que des réseaux de neurones
			standards atteignent une erreur d'entraînement nulle sur CIFAR-10 et ImageNet même lorsque les
			étiquettes sont remplacées par des étiquettes aléatoires, et que la régularisation explicite «
			peut améliorer la généralisation, mais n'est ni nécessaire ni suffisante ». Un réseau moderne
			est donc, en général, au-delà de son seuil d'interpolation. Belkin et al. (2019) observent la
			double descente pour un réseau à une couche cachée sur MNIST, avec un seuil situé à
			<KatexInline formula={String.raw`n \cdot K`} /> paramètres pour <KatexInline formula="K" /> classes
			(une sortie par classe).
		</p>

		<h3>Trois axes : largeur, époques, données</h3>
		<p>
			Nakkiran, Kaplun, Bansal, Yang, Barak &amp; Sutskever (2020) ont systématisé ces observations
			sur des ResNet18 de largeur variable <KatexInline formula={String.raw`[k, 2k, 4k, 8k]`} /> (le ResNet18
			standard correspond à <KatexInline formula="k = 64" />), des CNN à 5 couches et des
			Transformers. Pour comparer des procédures d'entraînement très différentes, ils remplacent le
			nombre de paramètres par une complexité <em>effective</em>.
		</p>

		<DefinitionBlock number="6.13" title="Complexité effective d'un modèle">
			<p>
				Pour une procédure d'entraînement <KatexInline formula={String.raw`\mathcal T`} /> (architecture,
				optimiseur, durée…), une distribution <KatexInline formula={String.raw`\mathcal D`} /> et un seuil
				<KatexInline formula={String.raw`\epsilon > 0`} />, la <strong>complexité effective</strong>
				est la plus grande taille d'échantillon que la procédure parvient à ajuster à
				<KatexInline formula={String.raw`\epsilon`} /> près :
			</p>
			<KatexBlock formula={emc} />
			<p>
				où <KatexInline formula={String.raw`\mathrm{Error}_S`} /> est l'erreur moyenne sur l'échantillon
				d'entraînement <KatexInline formula="S" />.
			</p>
		</DefinitionBlock>

		<p>
			Leur <strong>hypothèse de double descente généralisée</strong>, formulée de façon informelle,
			est la suivante : si la complexité effective est très inférieure à <KatexInline
				formula="n"
			/>, toute modification qui l'augmente diminue l'erreur de test ; si elle est très supérieure,
			de même ; si elle est proche de <KatexInline formula="n" />, l'augmenter peut aussi bien
			diminuer qu'augmenter l'erreur. Les auteurs soulignent eux-mêmes que le choix de
			<KatexInline formula={String.raw`\epsilon`} /> est heuristique (<KatexInline
				formula={String.raw`\epsilon = 0{,}1`}
			/>) et que « très inférieur / supérieur » n'est pas formalisé. Ce point de vue unifie trois
			formes du phénomène :
		</p>
		<ul>
			<li>
				<strong>En largeur</strong> (model-wise) : à durée d'entraînement fixée, l'erreur de test en
				fonction de <KatexInline formula="k" /> présente un pic, d'autant plus marqué qu'il y a du bruit
				d'étiquettes (CIFAR-10 avec 15 % d'étiquettes corrompues dans leur figure principale ; sans bruit,
				CIFAR-10 montre plutôt un plateau, CIFAR-100 un pic).
			</li>
			<li>
				<strong>En époques</strong> (epoch-wise) : pour un grand modèle, l'erreur de test diminue, augmente,
				puis diminue à nouveau au fil de l'entraînement — « entraîner plus longtemps peut corriger le
				sur-apprentissage ». Les modèles moyens montrent un U classique, les petits une décroissance monotone.
			</li>
			<li>
				<strong>En données</strong> (sample-wise) : augmenter <KatexInline formula="n" /> déplace le seuil
				vers des modèles plus grands, si bien qu'il existe des tailles de modèle pour lesquelles
				<em>plus de données nuit</em> — pour des Transformers de traduction, multiplier les données par
				4,5 dégrade l'erreur de test.
			</li>
		</ul>
		<p>
			Toute modification qui repousse le seuil d'interpolation (bruit d'étiquettes, augmentation de
			données, davantage d'exemples) repousse le pic vers des modèles plus grands. Et beaucoup de
			ces pics disparaissent avec un <strong>arrêt précoce</strong> optimal.
		</p>

		<h3>Quelle variance explose ?</h3>
		<p>
			Dans un réseau, le prédicteur dépend des données <em>et</em> de l'initialisation aléatoire. Plusieurs
			travaux décomposent le risque en conséquence :
		</p>
		<ul>
			<li>
				Yang, Yu, You, Steinhardt &amp; Ma (2020) mesurent biais et variance de ResNet de largeur
				croissante : le biais décroît de façon monotone tandis que la variance est
				<strong>unimodale</strong> (elle croît puis décroît) ; la double descente apparaît quand le bruit
				d'étiquettes gonfle le pic de variance.
			</li>
			<li>
				Dans le régime « paresseux », d'Ascoli, Refinetti, Biroli &amp; Krzakala (2020) montrent que
				le sur-apprentissage au seuil est entièrement dû à la variance liée au bruit et à celle liée
				à l'initialisation. Moyenner <KatexInline formula="K" /> modèles initialisés indépendamment atténue
				ces deux termes en <KatexInline formula="1/K" /> ; à la limite d'un ensemble infini, l'erreur
				de test reste constante au-delà du seuil.
			</li>
			<li>
				Spigler et al. (2019) et Geiger et al. (2020) relient le pic, pour la perte charnière
				quadratique, à une transition de « jamming » en <KatexInline
					formula={String.raw`N^\star`}
				/>
				paramètres — en général différent de <KatexInline formula="n" /> — où la norme de la sortie diverge.
				Au-delà, les fluctuations dues à l'initialisation décroissent :
				<KatexBlock formula={geigerScaling} />
				<span
					>et le pic disparaît avec l'arrêt précoce, ou presque entièrement en moyennant une
					vingtaine de réseaux.</span
				>
			</li>
		</ul>

		<h3>Le pont avec le cas linéaire</h3>
		<p>
			Pourquoi l'analyse linéaire des sections précédentes éclaire-t-elle les réseaux ? Jacot,
			Gabriel &amp; Hongler (2018) montrent que, dans la limite de largeur infinie et avec une
			initialisation adaptée, le noyau tangent du réseau reste constant pendant l'entraînement :
			apprendre le réseau revient à faire une régression à noyau. Le modèle le plus simple de ce
			régime est le réseau à deux couches dont la première est tirée au hasard et <strong
				>figée</strong
			> :
		</p>
		<KatexBlock formula={rfModel} />
		<p>
			Seule la couche de sortie est apprise : c'est une régression linéaire sur
			<KatexInline formula="N" /> variables aléatoires, et tout ce qui précède s'applique avec
			<KatexInline formula="p = N" />. Mei &amp; Montanari (2022) en calculent le risque exact en
			grande dimension : pic au seuil <KatexInline formula="N = n" />, divergent quand
			<KatexInline formula={String.raw`\lambda \to 0`} />, qui subsiste même sans bruit
			(contrairement au cas linéaire bien spécifié, biais et variance y présentent tous deux un
			pic), et qu'une pénalité suffisante efface ; avec la pénalité optimale, le meilleur risque est
			atteint pour une largeur infinie.
		</p>

		<InteractiveSection
			number="5.5"
			title="Un réseau à première couche figée : double descente en largeur"
			onInteract={tracker.trackInteraction}
		>
			<DeferredDemo
				load={() => import('$lib/components/demos/RandomFeaturesDoubleDescent.svelte')}
			/>
		</InteractiveSection>

		<Callout type="warning" title="Les limites de ce pont">
			<p>
				Un vrai réseau apprend aussi ses couches internes : il n'est pas dans le régime paresseux,
				et la double descente en époques n'a pas d'équivalent direct dans le modèle à features
				figées. Heckel &amp; Yilmaz (2021) l'expliquent par la superposition de plusieurs compromis
				biais-variance, dus à des couches apprises à des vitesses différentes ; ajuster les pas
				d'apprentissage par couche supprime le second pic. Et Curth, Jeffares &amp; van der Schaar
				(2023) rappellent que l'abscisse « nombre de paramètres » mélange souvent plusieurs axes de
				complexité : mesurée par un nombre <em>effectif</em> de paramètres, la courbe redevient souvent
				un U ordinaire.
			</p>
		</Callout>

		<h3>Et en pratique ?</h3>
		<p>
			Nakkiran, Venkat, Kakade &amp; Ma (2021) entraînent des CNN de largeur variable sur CIFAR-100
			avec différents niveaux de weight decay (la pénalité <KatexInline formula="L_2" /> de la leçon 4)
			: les modèles pas ou peu régularisés présentent une double descente, alors que l'erreur des modèles
			<em>optimalement</em> régularisés est essentiellement monotone en la largeur — mais aucune valeur
			unique de la pénalité n'est optimale pour toutes les largeurs. Pour le praticien, la leçon est double
			: il n'y a pas lieu de craindre les grands modèles, mais un modèle dont la taille est proche du
			seuil d'interpolation, entraîné sans régularisation ni arrêt précoce, sur des données bruitées,
			est dans la pire zone possible.
		</p>
	</TheorySection>

	<!-- ═══════════════════════════ 7. Synthèse ═══════════════════════════ -->
	<TheorySection>
		<h2 id="synthese">Synthèse</h2>

		<Callout type="summary" title="Retenir">
			<ul>
				<li>
					La double descente est une <strong>divergence de variance</strong> au seuil d'interpolation,
					suivie d'une seconde descente où, parmi une infinité d'interpolants, l'algorithme choisit celui
					de norme minimale.
				</li>
				<li>
					En régression linéaire, tout se calcule : risque exact à taille finie (Théorème 6.3) et
					limite asymptotique (Théorème 6.4). Le pic vient de la plus petite valeur singulière de
					<KatexInline formula="X" />, qui tend vers 0 quand <KatexInline
						formula={String.raw`p/n \to 1`}
					/> (Théorème 6.6) : c'est un problème de <strong>conditionnement</strong>.
				</li>
				<li>
					Ridge plafonne l'amplification de chaque direction (Proposition 6.7) ; bien réglé, il
					supprime le pic et domine l'interpolant (Théorèmes 6.8 et 6.9). L'arrêt précoce joue un
					rôle semblable.
				</li>
				<li>
					En classification, le seuil dépend de la perte : <KatexInline formula="p = n" /> pour la perte
					carrée, la transition de séparabilité (<KatexInline formula={String.raw`p \le n/2`} />)
					pour la logistique et la marge maximale. Très loin du seuil, toutes coïncident
					(Proposition 6.12).
				</li>
				<li>
					En deep learning, le phénomène se décline en largeur, en époques et en données ; il est
					amplifié par le bruit d'étiquettes, atténué par la régularisation, l'arrêt précoce et les
					ensembles. Les modèles linéaires et à features aléatoires en donnent une explication
					quantitative dans le régime paresseux, pas une théorie complète.
				</li>
			</ul>
		</Callout>

		<InteractiveSection
			number="5.6"
			title="Quiz — La double descente"
			onInteract={tracker.trackInteraction}
		>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Belkin, M.', 'Hsu, D.', 'Ma, S.', 'Mandal, S.']}
			year={2019}
			title="Reconciling modern machine-learning practice and the classical bias–variance trade-off"
			journal="Proceedings of the National Academy of Sciences, 116(32), 15849–15854."
			link="https://doi.org/10.1073/pnas.1903070116"
		/>
		<BibElement
			authors={['Loog, M.', 'Viering, T.', 'Mey, A.', 'Krijthe, J. H.', 'Tax, D. M. J.']}
			year={2020}
			title="A brief prehistory of double descent"
			journal="Proceedings of the National Academy of Sciences, 117(20), 10625–10626."
			link="https://doi.org/10.1073/pnas.2001875117"
		/>
		<BibElement
			authors={['Opper, M.', 'Kinzel, W.', 'Kleinz, J.', 'Nehl, R.']}
			year={1990}
			title="On the ability of the optimal perceptron to generalise"
			journal="Journal of Physics A: Mathematical and General, 23(11), L581–L586."
		/>
		<BibElement
			authors={['Duin, R. P. W.']}
			year={2000}
			title="Classifiers in almost empty spaces"
			journal="Proceedings of the 15th International Conference on Pattern Recognition (ICPR)."
		/>
		<BibElement
			authors={['Belkin, M.', 'Hsu, D.', 'Xu, J.']}
			year={2020}
			title="Two models of double descent for weak features"
			journal="SIAM Journal on Mathematics of Data Science, 2(4), 1167–1180."
			link="https://doi.org/10.1137/20M1336072"
		/>
		<BibElement
			authors={['Breiman, L.', 'Freedman, D.']}
			year={1983}
			title="How many variables should be entered in a regression equation?"
			journal="Journal of the American Statistical Association, 78(381), 131–136."
		/>
		<BibElement
			authors={['Hastie, T.', 'Montanari, A.', 'Rosset, S.', 'Tibshirani, R. J.']}
			year={2022}
			title="Surprises in high-dimensional ridgeless least squares interpolation"
			journal="The Annals of Statistics, 50(2), 949–986."
			link="https://doi.org/10.1214/21-AOS2133"
		/>
		<BibElement
			authors={['Marchenko, V. A.', 'Pastur, L. A.']}
			year={1967}
			title="Distribution of eigenvalues for some sets of random matrices"
			journal="Mathematics of the USSR-Sbornik, 1(4), 457–483."
			link="https://www.mathnet.ru/eng/sm4101"
		/>
		<BibElement
			authors={['Bai, Z. D.', 'Yin, Y. Q.']}
			year={1993}
			title="Limit of the smallest eigenvalue of a large dimensional sample covariance matrix"
			journal="The Annals of Probability, 21(3), 1275–1294."
			link="https://doi.org/10.1214/aop/1176989118"
		/>
		<BibElement
			authors={['Advani, M. S.', 'Saxe, A. M.', 'Sompolinsky, H.']}
			year={2020}
			title="High-dimensional dynamics of generalization error in neural networks"
			journal="Neural Networks, 132, 428–446."
			link="https://doi.org/10.1016/j.neunet.2020.08.022"
		/>
		<BibElement
			authors={[
				'Schaeffer, R.',
				'Khona, M.',
				'Robertson, Z.',
				'Boopathy, A.',
				'Pistunova, K.',
				'Rocks, J. W.',
				'Fiete, I. R.',
				'Koyejo, O.'
			]}
			year={2023}
			title="Double descent demystified: identifying, interpreting & ablating the sources of a deep learning puzzle"
			journal="arXiv:2303.14151."
			link="https://arxiv.org/abs/2303.14151"
		/>
		<BibElement
			authors={['Nakkiran, P.', 'Venkat, P.', 'Kakade, S.', 'Ma, T.']}
			year={2021}
			title="Optimal regularization can mitigate double descent"
			journal="International Conference on Learning Representations (ICLR)."
			link="https://arxiv.org/abs/2003.01897"
		/>
		<BibElement
			authors={['Cover, T. M.']}
			year={1965}
			title="Geometrical and statistical properties of systems of linear inequalities with applications in pattern recognition"
			journal="IEEE Transactions on Electronic Computers, EC-14(3), 326–334."
			link="https://doi.org/10.1109/PGEC.1965.264137"
		/>
		<BibElement
			authors={['Candès, E. J.', 'Sur, P.']}
			year={2020}
			title="The phase transition for the existence of the maximum likelihood estimate in high-dimensional logistic regression"
			journal="The Annals of Statistics, 48(1), 27–42."
			link="https://doi.org/10.1214/18-AOS1789"
		/>
		<BibElement
			authors={['Soudry, D.', 'Hoffer, E.', 'Nacson, M. S.', 'Gunasekar, S.', 'Srebro, N.']}
			year={2018}
			title="The implicit bias of gradient descent on separable data"
			journal="Journal of Machine Learning Research, 19, 1–57."
			link="https://arxiv.org/abs/1710.10345"
		/>
		<BibElement
			authors={['Deng, Z.', 'Kammoun, A.', 'Thrampoulidis, C.']}
			year={2022}
			title="A model of double descent for high-dimensional binary linear classification"
			journal="Information and Inference: A Journal of the IMA, 11(2), 435–495."
			link="https://arxiv.org/abs/1911.05822"
		/>
		<BibElement
			authors={['Kini, G. R.', 'Thrampoulidis, C.']}
			year={2020}
			title="Analytic study of double descent in binary classification: the impact of loss"
			journal="IEEE International Symposium on Information Theory (ISIT), 2527–2532."
			link="https://arxiv.org/abs/2001.11572"
		/>
		<BibElement
			authors={[
				'Muthukumar, V.',
				'Narang, A.',
				'Subramanian, V.',
				'Belkin, M.',
				'Hsu, D.',
				'Sahai, A.'
			]}
			year={2021}
			title="Classification vs regression in overparameterized regimes: does the loss function matter?"
			journal="Journal of Machine Learning Research, 22(222), 1–69."
			link="https://arxiv.org/abs/2005.08054"
		/>
		<BibElement
			authors={['Hsu, D.', 'Muthukumar, V.', 'Xu, J.']}
			year={2021}
			title="On the proliferation of support vectors in high dimensions"
			journal="Proceedings of AISTATS, PMLR 130, 91–99."
			link="https://arxiv.org/abs/2009.10670"
		/>
		<BibElement
			authors={['Chatterji, N. S.', 'Long, P. M.']}
			year={2021}
			title="Finite-sample analysis of interpolating linear classifiers in the overparameterized regime"
			journal="Journal of Machine Learning Research, 22(129), 1–30."
			link="https://arxiv.org/abs/2004.12019"
		/>
		<BibElement
			authors={['Zhang, C.', 'Bengio, S.', 'Hardt, M.', 'Recht, B.', 'Vinyals, O.']}
			year={2017}
			title="Understanding deep learning requires rethinking generalization"
			journal="International Conference on Learning Representations (ICLR)."
			link="https://arxiv.org/abs/1611.03530"
		/>
		<BibElement
			authors={[
				'Nakkiran, P.',
				'Kaplun, G.',
				'Bansal, Y.',
				'Yang, T.',
				'Barak, B.',
				'Sutskever, I.'
			]}
			year={2021}
			title="Deep double descent: where bigger models and more data hurt"
			journal="Journal of Statistical Mechanics: Theory and Experiment, 2021(12), 124003 (ICLR 2020)."
			link="https://doi.org/10.1088/1742-5468/ac3a74"
		/>
		<BibElement
			authors={['Yang, Z.', 'Yu, Y.', 'You, C.', 'Steinhardt, J.', 'Ma, Y.']}
			year={2020}
			title="Rethinking bias-variance trade-off for generalization of neural networks"
			journal="Proceedings of ICML, PMLR 119, 10767–10777."
			link="https://arxiv.org/abs/2002.11328"
		/>
		<BibElement
			authors={["d'Ascoli, S.", 'Refinetti, M.', 'Biroli, G.', 'Krzakala, F.']}
			year={2020}
			title="Double trouble in double descent: bias and variance(s) in the lazy regime"
			journal="Proceedings of ICML, PMLR 119, 2280–2290."
			link="https://arxiv.org/abs/2003.01054"
		/>
		<BibElement
			authors={[
				'Spigler, S.',
				'Geiger, M.',
				"d'Ascoli, S.",
				'Sagun, L.',
				'Biroli, G.',
				'Wyart, M.'
			]}
			year={2019}
			title="A jamming transition from under- to over-parametrization affects generalization in deep learning"
			journal="Journal of Physics A: Mathematical and Theoretical, 52(47), 474001."
			link="https://doi.org/10.1088/1751-8121/ab4c8b"
		/>
		<BibElement
			authors={[
				'Geiger, M.',
				'Jacot, A.',
				'Spigler, S.',
				'Gabriel, F.',
				'Sagun, L.',
				"d'Ascoli, S.",
				'Biroli, G.',
				'Hongler, C.',
				'Wyart, M.'
			]}
			year={2020}
			title="Scaling description of generalization with number of parameters in deep learning"
			journal="Journal of Statistical Mechanics: Theory and Experiment, 2020(2), 023401."
			link="https://doi.org/10.1088/1742-5468/ab633c"
		/>
		<BibElement
			authors={['Jacot, A.', 'Gabriel, F.', 'Hongler, C.']}
			year={2018}
			title="Neural tangent kernel: convergence and generalization in neural networks"
			journal="Advances in Neural Information Processing Systems 31 (NeurIPS)."
			link="https://arxiv.org/abs/1806.07572"
		/>
		<BibElement
			authors={['Mei, S.', 'Montanari, A.']}
			year={2022}
			title="The generalization error of random features regression: precise asymptotics and the double descent curve"
			journal="Communications on Pure and Applied Mathematics, 75(4), 667–766."
			link="https://doi.org/10.1002/cpa.22008"
		/>
		<BibElement
			authors={['Heckel, R.', 'Yilmaz, F. F.']}
			year={2021}
			title="Early stopping in deep networks: double descent and how to eliminate it"
			journal="International Conference on Learning Representations (ICLR)."
			link="https://arxiv.org/abs/2007.10099"
		/>
		<BibElement
			authors={['Curth, A.', 'Jeffares, A.', 'van der Schaar, M.']}
			year={2023}
			title="A U-turn on double descent: rethinking parameter counting in statistical learning"
			journal="Advances in Neural Information Processing Systems 36 (NeurIPS)."
			link="https://arxiv.org/abs/2310.18988"
		/>
	</Bibliography>
</PageTemplate>
