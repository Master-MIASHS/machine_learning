<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	import Quiz from '$lib/components/narrative/Quiz.svelte';
	import { getQuizQuestions } from '$lib/quiz';

	const meta = getPageByPath('/part4/bootstrap-theorie');
	const tracker = createPageTracker(meta as PageMeta);

	const quiz = getQuizQuestions('p4/bootstrap');
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
		{ id: 'introduction', label: 'De la recette à la théorie', description: 'Pourquoi la recette pose des questions de théorie', color: 'epistemic' },
		{ id: 'cadre', label: 'Cadre formel', description: 'Loi empirique, ré-échantillonnage, réestimation', color: 'positive' },
		{ id: 'von-mises', label: 'Fonctionnels de von Mises', description: 'La classe des statistiques dont le bootstrap s’occupe', color: 'belief' },
		{ id: 'consistance', label: 'Consistance', description: 'Efron 1982 ; Bickel & Freedman 1981 ; Freedman 1981', color: 'belief' },
		{ id: 'preuve', label: 'Esquisse de preuve', description: 'La compensation des deux erreurs', color: 'neutral' },
		{ id: 'intervalles', label: 'Intervalles bootstrap', description: 'Basic, percentile, studentized — ordres de précision', color: 'agent' },
		{ id: 'bca', label: 'L’intervalle BCa', description: 'Correction de biais et accélération (Efron 1987)', color: 'agent' },
		{ id: 'double-bootstrap', label: 'Le double bootstrap', description: 'Calibrer la couverture elle-même', color: 'agent' },
		{ id: 'wild', label: 'Wild bootstrap', description: 'Hétéroscédasticité (Wu 1986 ; Mammen 1993)', color: 'surprise' },
		{ id: 'echecs', label: 'Quand le bootstrap échoue', description: 'Le maximum, les U-statistiques — et la médiane qui passe', color: 'surprise' },
		{ id: 'exercices', label: 'Exercices', description: 'Fonctions d’influence, le maximum, la variance wild', color: 'epistemic' },
		{ id: 'quiz', label: 'Quiz', description: '8 questions de synthèse', color: 'positive' }
	];

	/* ---------------------------- formules KaTeX ---------------------------- */

	// ── Cadre (E.1) ──
	const SN = String.raw`S_n = \{(X_1, Y_1), \ldots, (X_n, Y_n)\}`;
	const FhatN = String.raw`\hat{F}_n`;
	const XiYi = String.raw`(X_i, Y_i)`;
	const SNStar = String.raw`S_n^{*}`;
	const ThBetaStar = String.raw`\hat{\beta}^{*}`;
	const ThBetaStarDef = String.raw`\hat{\beta}^{*} = \hat{\beta}\bigl(S_n^{*}\bigr) = (X^{*\top}X^{*})^{-1} X^{*\top} Y^{*}`;
	const ThBetaCentered = String.raw`\hat{\beta}^{*} - \hat{\beta}`;
	const ThBetaCenteredTrue = String.raw`\hat{\beta} - \beta`;
	const YStarResid = String.raw`Y_i^{*} = X_i\hat{\beta} + \hat{\varepsilon}_{j(i)}`;
	const EpsHatJi = String.raw`\hat{\varepsilon}_{j(i)}`;
	const EpsHats = String.raw`\hat{\varepsilon}_1, \ldots, \hat{\varepsilon}_n`;
	const ThBeta = String.raw`\hat{\beta}`;
	const BetaJ = String.raw`\beta_j`;

	// ── Von Mises (E.2) ──
	const GF = String.raw`g : \mathcal{F} \to \mathbb{R}`;
	const GMoy = String.raw`g(F) = \int x\, dF(x)`;
	const GBeta = String.raw`\beta \mapsto \hat{\beta}`;
	const vmDeriv = String.raw`g'(F)(G - F) \;=\; \left. \frac{d}{d\theta}\, g\bigl(F + \theta (G - F)\bigr) \right|_{\theta = 0} \;=\; \int \psi(x, F)\, dG(x)`;
	const PsiXF = String.raw`\psi(x, F)`;
	const psiCentered = String.raw`\int \psi(x, F)\, dF(x) = 0`;
	const vmTaylor = String.raw`g(\hat{F}_n) - g(F) \;=\; \int \psi(x, F)\, d(\hat{F}_n - F) \;+\; \Delta_n, \qquad \Delta_n = o_p\!\left( \int \psi\, d(\hat{F}_n - F) \right)`;
	const psi2Int = String.raw`\int \psi^2(x, F)\, dF(x) < \infty`;
	const vmCLT = String.raw`\sqrt{n}\,\bigl\{ g(\hat{F}_n) - g(F) \bigr\} \ \Rightarrow\ \mathcal{N}\!\left( 0,\ \int \psi^2(x, F)\, dF(x) \right)`;
	const vmBoot = String.raw`\sqrt{n}\,\bigl\{ g(\hat{F}_n^{*}) - g(\hat{F}_n) \bigr\} \;=\; \sqrt{n} \int \psi(x, \hat{F}_n)\, d(\hat{F}_n^{*} - \hat{F}_n) \;+\; \delta_n^{*}`;
	const deltaCond = String.raw`\delta_n^{*} \xrightarrow{\;p\;} 0 \ \text{conditionnellement aux données}`;
	const psiCons = String.raw`\int \bigl\{ \psi(x, \hat{F}_n) - \psi(x, F) \bigr\}^2\, d\hat{F}_n \xrightarrow{\;p.s.\;} 0`;
	const psiMoy = String.raw`\psi(x, F) = x - \mu`;
	const vmMoy = String.raw`\sqrt{n}( \bar{X}_n - \mu ) \Rightarrow \mathcal{N}(0, \sigma^2)`;
	const psiMed = String.raw`\psi(x, F) = \frac{1/2 - \mathbb{1}\{ x \le m \}}{f(m)}`;
	const vmMed = String.raw`\sqrt{n}\,(m - m_F) \Rightarrow \mathcal{N}\!\left( 0,\ \frac{1}{4 f(m)^2} \right)`;
	const gW = String.raw`g(H) = \iint w(x, y)\, dH(x)\, dH(y)`;

	// ── Consistance (E.3) ──
	const Sigma2 = String.raw`\sigma^2`;
	const X1Xn = String.raw`(X_1, \ldots, X_n)`;
	const consMean = String.raw`\sqrt{m}\, \bigl( \bar{X}^{*}_{m} - \bar{X}_{n} \bigr) \ \Rightarrow\ \mathcal{N}(0, \sigma^2)`;
	const consMeanVar = String.raw`s^{*2}_{m} \xrightarrow{\;p\;} \sigma^2 \quad \text{(en probabilité conditionnelle)}`;
	const XBarStar = String.raw`\bar{X}^{*}_{m}`;
	const sStar = String.raw`s^{*}_{m}`;
	const QStar = String.raw`Q^{*} = \frac{\sqrt{m}\, (\bar{X}^{*}_{m} - \bar{X}_{n})}{s^{*}_{m}}`;
	const Qn = String.raw`Q_n = \frac{\sqrt{n}\, (\bar{X}_{n} - \mu)}{s_{n}}`;
	const XiRk = String.raw`X_i \in \mathbb{R}^k`;
	const norm2 = String.raw`\mathrm{E}\, \| X_1 \|^2 < \infty`;
	const XTX = String.raw`X^\top X`;
	const consOls = String.raw`\sup_x \Bigl| \mathbb{P}^{*}\!\bigl( \hat{\beta}^{*} - \hat{\beta} \le x \bigr) - \mathbb{P}\!\bigl( \hat{\beta} - \beta \le x \bigr) \Bigr| \xrightarrow{\;p\;} 0`;
	const ZNFF = String.raw`Z_n\bigl( (X_1, \ldots, X_n),\, F \bigr)`;
	const ZnF = String.raw`Z_n\bigl( (X_1, \ldots, X_n),\, F \bigr)`;
	const ZmStar = String.raw`Z_m^{*}\bigl( (X_1^{*}, \ldots, X_m^{*}),\, \hat{F}_n \bigr)`;

	// ── Preuve (E.4) ──
	const sqrtNClass = String.raw`\sqrt{n}\, (\bar{X}_n - \mu)`;
	const sqrtNBoot = String.raw`\sqrt{n}\, (\bar{X}^{*}_{n} - \bar{X}_{n})`;
	const Mu = String.raw`\mu`;
	const XBarN = String.raw`\bar{X}_n`;
	const Gamma2 = String.raw`\Gamma_2 = \bigl\{ G : \int x^2\, dG(x) < \infty \bigr\}`;
	const x2Converge = String.raw`\int x^2\, dG_n(x) \to \int x^2\, dG(x)`;
	const d2Def = String.raw`d_2(G, H)^2 = \inf_{(X, Y)} \mathrm{E}\bigl\{ (X - Y)^2 \bigr\}`;
	const FhatNConv = String.raw`\hat{F}_n \overset{d_2}{\to} F`;
	const Gm = String.raw`G^{(m)}`;
	const moyG = String.raw`\frac{1}{\sqrt{m}} \sum_{i = 1}^{m} \bigl( Z_i(G) - \mathrm{E}_G Z \bigr)`;
	const d2Contr = String.raw`d_2\bigl( G^{(m)},\, H^{(m)} \bigr) \le d_2(G, H)`;
	const FhatNm = String.raw`\hat{F}_n^{\,(m)}`;
	const Fm = String.raw`F^{\,(m)}`;

	// ── Intervalles (E.5) ──
	const icBasic = String.raw`\mathrm{IC}_{1-\alpha}^{\,\mathrm{basic}}(\theta) = \bigl[\, 2\hat{\theta} - q^{*}_{1-\alpha/2}, \quad 2\hat{\theta} - q^{*}_{\alpha/2} \,\bigr]`;
	const icPerc = String.raw`\mathrm{IC}_{1-\alpha}^{\,\mathrm{perc}}(\theta) = \bigl[\, q^{*}_{\alpha/2},\; q^{*}_{1-\alpha/2} \,\bigr]`;
	const icStud = String.raw`\mathrm{IC}_{1-\alpha}^{\,\mathrm{stud}}(\theta) = \bigl[\, \hat{\theta} - \widehat{se}_{\hat{\theta}}\, t^{*}_{1-\alpha/2}, \quad \hat{\theta} - \widehat{se}_{\hat{\theta}}\, t^{*}_{\alpha/2} \,\bigr], \qquad t^{*} = \frac{\hat{\theta}^{*} - \hat{\theta}}{\widehat{se}_{\hat{\theta}^{*}}}`;
	const OInvSqrtN = String.raw`O(n^{-1/2})`;
	const OInvN = String.raw`O(n^{-1})`;
	const SEThBetaStar = String.raw`SE(\hat{\beta}^{*})`;

	// ── BCa (E.6) ──
	const z0 = String.raw`z_0`;
	const bcaZ0 = String.raw`z_0 = \Phi^{-1}\bigl( G(\hat{\theta}) \bigr) = \Phi^{-1}\!\left( \frac{\#\{ \hat{\theta}^{*(b)} < \hat{\theta} \}}{B} \right)`;
	const bcaA = String.raw`a \approx \frac{\mathrm{SKEW}\bigl( i_{\hat{\theta}} \bigr)}{6} = \frac{\mu_3\bigl( i_{\hat{\theta}} \bigr)}{6\, \mu_2\bigl( i_{\hat{\theta}} \bigr)^{3/2}}`;
	const bcaAlpha12 = String.raw`\alpha_1 = \Phi\!\left( z_0 + \frac{(z_0 + z_{\alpha/2})\, a}{1 - a (z_0 + z_{\alpha/2})} \right), \qquad \alpha_2 = \Phi\!\left( z_0 + \frac{(z_0 + z_{1-\alpha/2})\, a}{1 - a (z_0 + z_{1-\alpha/2})} \right)`;
	const bcaIC = String.raw`\mathrm{IC}_{1-\alpha}^{\,\mathrm{BCa}}(\theta) = \bigl[\, q^{*}_{\alpha_1},\; q^{*}_{\alpha_2} \,\bigr]`;
	const bcaZ = String.raw`z[\alpha] = z_0 + \frac{(z_0 + z_{\alpha})\, a}{1 - a (z_0 + z_{\alpha})}`;
	const ChiScale = String.raw`\hat{\theta} \sim \theta\, \chi^2_{19}/19`;
	const iTheta = String.raw`i_{\hat{\theta}}`;

	// ── Double bootstrap (E.7) ──
	const I0 = String.raw`I_0(\alpha;\, X,\, X^{*})`;
	const Alpha = String.raw`\alpha`;
	const PiAlpha = String.raw`\pi(\alpha) = \mathrm{P}\bigl\{ \theta \in I_0(\alpha;\, X,\, X^{*}) \bigr\}`;
	const piHat = String.raw`\hat{\pi}(\alpha) = \mathrm{P}^{*}\bigl\{ \hat{\theta} \in I_0(\alpha;\, X^{*},\, X^{**}) \ \big|\ X \bigr\}`;
	const piHatEq = String.raw`\hat{\pi}(\bar{\alpha}) = \alpha`;
	const i1 = String.raw`I_1(\alpha) = I_0\bigl( \bar{\alpha};\, X,\, X^{*} \bigr)`;
	const OInvN32 = String.raw`O(n^{-3/2})`;

	// ── Wild bootstrap (E.8) ──
	const SigmaI2 = String.raw`\sigma_i^2`;
	const SigmaIdem = String.raw`\sigma_i^2 = \sigma^2`;
	const wild = String.raw`Y_i^{*} = X_i \hat{\beta} + \hat{\varepsilon}_i \, v_i, \qquad i = 1, \ldots, n`;
	const YStarWild = String.raw`Y^{*} = X\hat{\beta} + \hat{\varepsilon} \odot v`;
	const vMoments = String.raw`\mathbb{E}[v_i] = 0, \qquad \mathbb{E}[v_i^2] = 1`;
	const wildVar = String.raw`\mathrm{Var}^{*}\bigl( \hat{\varepsilon}_i v_i \mid X \bigr) = \hat{\varepsilon}_i^2`;
	const SigmaI2Eps = String.raw`\sigma_i^2 \approx \hat{\varepsilon}_i^2`;
	const rademacher = String.raw`v_i = \pm 1 \ \text{avec probabilité } 1/2`;
	const mammen = String.raw`v_i = -\tfrac{\sqrt{5} - 1}{2} \approx -0.618 \ \text{c.p. } \tfrac{5 + \sqrt{5}}{10} \approx 0.7236, \qquad v_i = +\tfrac{\sqrt{5} + 1}{2} \approx 1.618 \ \text{c.p. } \tfrac{5 - \sqrt{5}}{10} \approx 0.2764`;
	const mammenMoments = String.raw`\mathbb{E}[v] = 0,\ \mathbb{E}[v^2] = 1,\ \mathbb{E}[v^3] = 1`;
	const SigmaI2Fan = String.raw`\sigma_i^2 = \bigl( 1 + 2 x_i / 10 \bigr)^2`;

	// ── Échecs (E.9) ──
	const Theta = String.raw`\hat{\theta} = X_{(n)}`;
	const maxPivot = String.raw`\frac{n\, (\theta - X_{(n)})}{\theta}`;
	const maxPivotBoot = String.raw`\frac{n\, (X^{*}_{(n)} - X_{(n)})}{X_{(n)}}`;
	const maxFail = String.raw`\mathbb{P}^{*}\!\bigl\{ X^{*}_{(n)} = X_{(n)} \mid \hat{F}_n \bigr\} \;=\; 1 - \bigl( 1 - \tfrac{1}{n} \bigr)^{\!n} \;\xrightarrow{\;n \to \infty\;} 1 - \tfrac{1}{e} \approx 0{,}63`;
	const oneMinus1e = String.raw`1 - 1/e \approx 0{,}63`;
	const maxSpacing = String.raw`\frac{n\, \bigl( X_{(n)} - X^{*}_{(n-k+1)} \bigr)}{X_{(n)}}`;
	const FtildeN = String.raw`\tilde{F}_n`;
	const FtildeConv = String.raw`\tilde{F}_n \to F \ \text{en } T_2`;
	const diagCond = String.raw`\int w^2(x, x)\, dF(x) < \infty`;
	const uStatFail = String.raw`\bigl| R_{n2}\bigl( X_1^{*}, \ldots, X_n^{*};\, \hat{F}_n \bigr) \bigr|`;
	const fMuPos = String.raw`f(\mu) > 0`;
	const medBoot = String.raw`\sqrt{n}\, (m^{*} - m) \ \Rightarrow\ \mathcal{N}\!\left( 0,\ \frac{1}{4 f(\mu)^2} \right)`;
	const medTrue = String.raw`\sqrt{n}\, (m - \mu)`;
	const fMuZero = String.raw`f(\mu) = 0`;

	// ── Pont bagging (callout) ──
	const VarM = String.raw`\sigma^2 / M`;

	// ── Exercices ──
	const gVar = String.raw`g(F) = \int x^2\, dF(x) - \bigl( \int x\, dF(x) \bigr)^2`;
	const psiVar = String.raw`\psi(x, F) = (x - \mu)^2 - \sigma^2`;
	const varDir = String.raw`g\bigl( F + t(G' - F) \bigr)`;
	const psiVarDeriv = String.raw`g'(F)(G' - F) = \int \bigl( (x - \mu)^2 - \sigma^2 \bigr)\, d(G' - F)(x)`;
	const Mu4 = String.raw`\mu_4 = \mathrm{E}\bigl[ (X - \mu)^4 \bigr]`;
	const medPerturb = String.raw`m_{G} \approx m + \frac{G(m) - 1/2}{f(m)}`;
	const varMedCalc = String.raw`\mathrm{E}\bigl[ \psi^2 \bigr] = \frac{ \mathbb{E}\bigl[ (1/2 - \mathbb{1}\{ X \le m \})^2 \bigr] }{ f(m)^2 } = \frac{1/4}{f(m)^2}`;
	const varMed = String.raw`\mathrm{Var}\bigl( \psi(X, F) \bigr) = \frac{1}{4 f(m)^2}`;
	const XOrd = String.raw`X_{(1)} < \cdots < X_{(n)}`;
	const XStarOrd = String.raw`X^{*}_{(1)} < \cdots < X^{*}_{(n)}`;
	const pMaxEq = String.raw`\mathbb{P}^{*}\bigl\{ X^{*}_{(n)} = X_{(n)} \mid \hat{F}_n \bigr\}`;
	const pMaxCalc = String.raw`\mathbb{P}^{*}\bigl\{ X^{*}_{(n)} = X_{(n)} \mid \hat{F}_n \bigr\} = 1 - \bigl(1 - \tfrac{1}{n}\bigr)^{n} \xrightarrow{n \to \infty} 1 - \tfrac{1}{e}`;
	const maxBound = String.raw`X^{*}_{(n)} \le X_{(n)}`;
	const L0 = String.raw`L\bigl( \{0\} \bigr)`;
	const XiPP = String.raw`X^{**}_i`;
	const XiPScaled = String.raw`X^{**}_i / X_{(n)}`;
	const paramMaxPivot = String.raw`\frac{n\, \bigl( X_{(n)} - X^{**}_{(n)} \bigr)}{X_{(n)}}`;
	const paramMaxCalc = String.raw`\frac{n\, \bigl( X_{(n)} - X^{**}_{(n)} \bigr)}{X_{(n)}} \ \xRightarrow{\;d\;}\ n \bigl( 1 - U_{(n)} \bigr) \ \Rightarrow\ \mathrm{Exp}(1)`;
	const yiBetaX = String.raw`y_i = \beta x_i + \varepsilon_i`;
	const wildSlope = String.raw`\hat{\beta}^{*} = \frac{\sum_i x_i Y_i^{*}}{\sum_i x_i^2}`;
	const bhatIdentity = String.raw`\hat{\beta} = \frac{\sum_i x_i y_i}{\sum_i x_i^2}`;
	const wildSlopeFormula = String.raw`\hat{\beta}^{*} = \hat{\beta} + \frac{\sum_i x_i \hat{\varepsilon}_i v_i}{\sum_i x_i^2}`;
	const wildVarExact = String.raw`\mathrm{Var}^{*}\bigl( \hat{\beta}^{*} - \hat{\beta} \mid X \bigr) = \frac{\sum_i x_i^2 \hat{\varepsilon}_i^2}{\bigl( \sum_i x_i^2 \bigr)^2}`;
	const wildSlopeDeriv = String.raw`\hat{\beta}^{*} = \frac{\sum_i x_i (X_i \hat{\beta} + \hat{\varepsilon}_i v_i)}{\sum_i x_i^2} = \frac{\sum_i x_i \hat{\beta} x_i}{\sum_i x_i^2} + \frac{\sum_i x_i \hat{\varepsilon}_i v_i}{\sum_i x_i^2}`;
	const wildVarCalc = String.raw`\mathrm{Var}^{*}\bigl( \hat{\beta}^{*} - \hat{\beta} \mid X \bigr) = \frac{ \sum_i x_i^2 \hat{\varepsilon}_i^2 \, \mathbb{E}[v_i^2] }{ \bigl( \sum_i x_i^2 \bigr)^2 } = \frac{ \sum_i x_i^2 \hat{\varepsilon}_i^2 }{ \bigl( \sum_i x_i^2 \bigr)^2 }`;
	const seHomos = String.raw`\widehat{SE}_{\mathrm{homos}} = \frac{\hat{\sigma}}{\sqrt{\sum_i (x_i - \bar{x})^2}}`;
	const sigma2hat = String.raw`\hat{\sigma}^2 = \frac{1}{n} \sum_i \hat{\varepsilon}_i^2`;
	const varBetaTrue = String.raw`\mathrm{Var}(\hat{\beta}) = \frac{\sum_i x_i^2 \sigma_i^2}{\bigl( \sum_i x_i^2 \bigr)^2}`;
	const varBetaTrueCalc = String.raw`\mathrm{Var}(\hat{\beta}) = \frac{ \sum_i x_i^2 \, \mathrm{Var}(\varepsilon_i) }{ \bigl( \sum_i x_i^2 \bigr)^2 } = \frac{ \sum_i x_i^2 \sigma_i^2 }{ \bigl( \sum_i x_i^2 \bigr)^2 }`;
	const epsInd = String.raw`\varepsilon_i`;
	const seHomosValue = String.raw`\widehat{SE}_{\mathrm{homos}}^2 = \frac{ \hat{\sigma}^2 }{ \sum_i (x_i - \bar{x})^2 }`;
	const sigma2hatValue = String.raw`\hat{\sigma}^2 = \frac{1}{n} \sum_i \hat{\varepsilon}_i^2 \to \frac{1}{n} \sum_i \sigma_i^2`;
	const fanMismatch = String.raw`\frac{1}{n} \sum_i \sigma_i^2 \ne \sigma^2 \ \text{en général}`;
	const sigmaI2Fan = String.raw`\sigma_i^2 = \bigl( 1 + 2 x_i / 10 \bigr)^2`;
	const ThetaKnown = String.raw`\theta = 4`;
	const medSE = String.raw`\theta / (2\sqrt{n})`;
	const fUnif = String.raw`f = 1/\theta`;

	// Petites formules inline (String.raw : les guillemets d'attribut
	// interprètent les échappements JS, d'où les constantes).
	const XSeq = String.raw`X_1, X_2, \ldots`;
	const MNtoInf = String.raw`m, n \to \infty`;
	const NtoInf = String.raw`n \to \infty`;
	const InvSqrtN = String.raw`1/\sqrt{n}`;
	const OneMinusAlpha = String.raw`1-\alpha`;
	const BBi = String.raw`B \times B_i`;
	const OpenTheta = String.raw`(0, \theta)`;
	const MuOnly = String.raw`\mu`;
	const SqrtN = String.raw`\sqrt{n}`;
	const EX2Inf = String.raw`EX_1^2 = \infty`;
	const PLeM = String.raw`P(X \le m) = 1/2`;
	const NExp = String.raw`n(1 - U_{(n)}) \Rightarrow \mathrm{Exp}(1)`;
	const EpsI2 = String.raw`\hat{\varepsilon}_i^2`;
	const XDoubleStar = String.raw`X^{**}`;
	const ZeroToXn = String.raw`(0, X_{(n)})`;
	const DiagKernel = String.raw`e^{1/(x-y)}`;
	const XiStar = String.raw`X_i^{*}`;
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Théorie du bootstrap'}
	subtitle="Consistance, intervalles, wild bootstrap, échecs — et le pont vers le bagging"
	prev={prevMeta}
	next={nextMeta}
>
	<TableOfContents entries={tocEntries} />
	<TheorySection>
		<!-- ========================================================= -->
		<!-- INTRODUCTION                                              -->
		<!-- ========================================================= -->
		<h2 id="introduction">De la recette à la théorie</h2>

		<p>
			La leçon 3 de cette partie donne les <strong>lois exactes</strong> d'échantillonnage —
			gaussienne, khi-deux, Student — du modèle linéaire, <strong>mais uniquement sous (H3)</strong>,
			l'hypothèse d'erreurs gaussiennes (Théorème 3.3). Le panneau expert de cette leçon y greffe une
			alternative entièrement non paramétrique : le <strong>bootstrap</strong> (Efron, 1979) —
			remplacer la loi inconnue <KatexInline formula="F" /> par la loi empirique
			<KatexInline formula={FhatN} /> et « ré-échantillonner » dessus. Ce panneau donne
			l'<em>recette</em> : resamplage avec remise, réestimation, histogramme des
			<KatexInline formula={ThBetaStar} />.
		</p>
		<p>
			La recette pose immédiatement des questions de <em>théorie</em> : <strong>converge-t-elle</strong>
			vers la bonne distribution d'échantillonnage, et sous quelles conditions ? Les
			<strong>intervalles</strong> qu'elle produit (percentile, studentized, BCa) sont-ils exacts au
			même ordre que l'intervalle de Student ? Que faire en <strong>hétéroscédasticité</strong>, où le
			resamplage naïf des résidus trahit le modèle ? Et surtout — <strong>quand échoue-t-elle</strong> ?
			Cette leçon expert répond : le bootstrap est consistant pour les fonctionnels de von Mises (dont la
			moyenne et <KatexInline formula={ThBeta} /> des moindres carrés) grâce à une
			<em>compensation de deux erreurs</em> qu'on rend rigoureuse avec une distance adaptée ; il produit
			des intervalles exacts au premier ou au second ordre ; il se corrige en wild bootstrap sous
			hétéroscédasticité ; et il échoue, de façon structurelle, sur les statistiques d'ordre comme le
			maximum. Le fil est celui des sources primaires : Efron (1979, 1982, 1987), Bickel &amp; Freedman
			(1981), Freedman (1981), Wu (1986), Mammen (1993), Athreya (1987), Beran (1987), Hall &amp; Martin
			(1988), DiCiccio, Martin &amp; Young (1992).
		</p>

		<Callout type="note" title="Leçon expert — la théorie derrière la recette du bootstrap">
			<p>
				Cette leçon développe la <strong>théorie</strong> du bootstrap déjà introduit en recette dans
				le panneau expert de la leçon 3 (resamplage, réestimation, intervalles percentile/studentized,
				wild bootstrap, contre-exemple du maximum). Rien n'est réenseigné à ce niveau : on part de la
				recette et on la théorise — consistance (pourquoi ça marche), hiérarchie de précision des
				intervalles, wild bootstrap, échecs. Chaque résultat est attribué dans le texte et dans la
				bibliographie.
			</p>
		</Callout>

		<!-- ========================================================= -->
		<!-- E.1 CADRE FORMEL                                          -->
		<!-- ========================================================= -->
		<h2 id="cadre">Cadre formel</h2>

		<DefinitionBlock number="E.1" title="Cadre formel : loi empirique, échantillon bootstrap, réestimation">
			<p>
				Soit <KatexInline formula={SN} /> l'échantillon observé de la leçon 3 et
				<KatexInline formula={FhatN} /> la <strong>loi empirique</strong> : la distribution qui met
				une masse <KatexInline formula="1/n" /> en chaque point
				<KatexInline formula={XiYi} />. Le bootstrap non paramétrique (Efron, 1979) est
				l'algorithme à trois étapes du panneau 3.4.1.bis de la leçon 3, qu'on formalise ici :
			</p>
			<ol>
				<li>
					<strong>Resamplage.</strong> Tirer un échantillon bootstrap
					<KatexInline formula={SNStar} /> de taille <KatexInline formula="n" /> dans
					<KatexInline formula={FhatN} />, <strong>avec remise</strong> — chaque
					<KatexInline formula={XiYi} /> est tirée avec probabilité <KatexInline formula="1/n" />,
					indépendamment des autres.
				</li>
				<li>
					<strong>Réestimation.</strong> Appliquer la <strong>même</strong> recette d'estimation à
					l'échantillon bootstrap : <KatexInline formula={ThBetaStarDef} />.
				</li>
				<li>
					<strong>Loi bootstrap.</strong> La distribution (conditionnelle aux données) de
					<KatexInline formula={ThBetaCentered} /> est l'approximation bootstrap de la distribution
					d'échantillonnage de <KatexInline formula={ThBetaCenteredTrue} />. En pratique, on la
					calcule par Monte Carlo : B tirages indépendants, histogramme des B valeurs (Efron, 1979,
					« méthode 2 »).
				</li>
			</ol>
			<p>
				<strong>Argument de cohérence (Fisher, Efron 1979 §2).</strong> Si la vraie loi F coïncidait
				avec <KatexInline formula={FhatN} />, la loi de <KatexInline formula={ThBetaStar} /> serait
				<em>exactement</em> la loi de <KatexInline formula={ThBeta} /> : le bootstrap rend
				l'approximation exacte au point central de la classe des lois plausibles. C'est une
				heuristique — la question est de savoir quand elle devient un théorème. C'est l'objet de E.3.
			</p>
			<p>
				Pour la régression, Efron (1979, §7) décrit aussi la variante par <strong>resamplage des
				résidus</strong> : régresseurs fixes, <KatexInline formula={YStarResid} /> avec
				<KatexInline formula={EpsHatJi} /> tiré au hasard parmi
				<KatexInline formula={EpsHats} />. Elle exploite l'information que les
				<KatexInline formula="x_i" /> sont fixés, mais suppose une même loi d'erreur pour tout i
				(homoscédasticité) — l'hypothèse que le wild bootstrap (E.8) lève.
			</p>
		</DefinitionBlock>

		<!-- ========================================================= -->
		<!-- E.2 VON MISES                                             -->
		<!-- ========================================================= -->
		<h2 id="von-mises">Fonctionnels de von Mises</h2>

		<DefinitionBlock number="E.2" title="Fonctionnels de von Mises et fonctions d'influence">
			<p>
				La question « pour quelle statistique le bootstrap marche-t-il ? » a une réponse précise : les
				<strong>fonctionnels de von Mises</strong>. Un fonctionnel est une application
				<KatexInline formula={GF} /> d'une loi vers les réels — la moyenne
				<KatexInline formula={GMoy} />, la variance, un quantile,
				<KatexInline formula={GBeta} /> dans un modèle. Il est de <strong>von Mises</strong> en F
				s'il est <strong>Gâteaux-différentiable</strong> en F avec une dérivée représentable comme une
				intégrale (Bickel &amp; Freedman, 1981, eq. 3.8) :
			</p>
			<KatexBlock formula={vmDeriv} />
			<p>
				où <KatexInline formula={PsiXF} /> ne dépend de G que par intégration.
				<KatexInline formula={PsiXF} /> est la <strong>fonction d'influence</strong> de g en F — et
				elle est nécessairement centrée : <KatexInline formula={psiCentered} />. « Such g are often
				called von Mises functionals » (Bickel &amp; Freedman, 1981).
			</p>
			<p>
				L'importance de ce cadre vient de la <strong>décomposition de von Mises</strong> (Taylor,
				eq. 3.10) :
			</p>
			<KatexBlock formula={vmTaylor} />
			<p>et du fait que, si <KatexInline formula={psi2Int} />, alors</p>
			<KatexBlock formula={vmCLT} />
			<p>
				— c'est le CLT non paramétrique : il ne demande que l'existence de
				<KatexInline formula="ψ" /> et son carré intégrable, pas de loi fermée.
				<strong>Le bootstrap commute avec cette linéarisation exactement comme le CLT</strong>
				(Bickel &amp; Freedman, 1981, eq. 3.6) : la même décomposition vaut
				<em>conditionnellement</em> aux données,
			</p>
			<KatexBlock formula={vmBoot} />
			<p>
				avec <KatexInline formula={deltaCond} /> — sous deux conditions simples (p. 1201) :
				<KatexInline formula={psi2Int} /> (déjà supposée) et la convergence de la fonction
				d'influence évaluée en la loi empirique vers celle évaluée en F :
				<KatexInline formula={psiCons} />.
			</p>
			<p>
				<strong>Exemples.</strong> Moyenne : <KatexInline formula={psiMoy} />,
				<KatexInline formula={vmMoy} /> — c'est le cas du Théorème 2.1 de Bickel &amp; Freedman.
				Médiane m (F de densité f, f(m) &gt; 0) : <KatexInline formula={psiMed} />, d'où
				<KatexInline formula={vmMed} /> — la même limite que le bootstrap (Prop. 5.1 de Bickel
				&amp; Freedman, 1981 ; E.9). Le cadre couvre aussi les U-statistiques (Th. 3.1 : fonctionnels
				<KatexInline formula={gW} /> de noyau symétrique
				<KatexInline formula="w" />), la statistique de Wilcoxon, et — vectorisé — les moindres
				carrés.
			</p>
		</DefinitionBlock>

		<!-- ========================================================= -->
		<!-- E.3 CONSISTANCE                                           -->
		<!-- ========================================================= -->
		<h2 id="consistance">Consistance</h2>

		<TheoremBlock number="E.3" title="Consistance du bootstrap (Efron 1982 ; Bickel & Freedman 1981 ; Freedman 1981)">
			<p>
				<strong>Théorème (moyenne — Bickel &amp; Freedman, 1981, Th. 2.1).</strong> Soit
				<KatexInline formula={XSeq} /> i.i.d. de variance finie et positive
				<KatexInline formula={Sigma2} />. Le long de presque toutes les suites d'échantillons,
				conditionnellement à <KatexInline formula={X1Xn} />, quand
				<KatexInline formula={MNtoInf} /> :
			</p>
			<KatexBlock formula={consMean} />
			<KatexBlock formula={consMeanVar} />
			<p>
				où <KatexInline formula={XBarStar} /> et <KatexInline formula={sStar} /> sont la moyenne et la
				variance de l'échantillon bootstrap. La conséquence immédiate (p. 1198) : le
				<strong>pivot bootstrap</strong> <KatexInline formula={QStar} /> a la même limite
				<KatexInline formula="N(0,1)" /> que le pivot classique <KatexInline formula={Qn} />. La
				version vectorielle (Th. 2.2), pour <KatexInline formula={XiRk} /> avec
				<KatexInline formula={norm2} />, remplace <KatexInline formula={Sigma2} /> par la matrice de
				covariance théorique.
			</p>
			<p>
				<strong>Cas des moindres carrés (Freedman, 1981).</strong> Vectoriser le Th. 2.2 ne donne pas
				directement <KatexInline formula={ThBeta} /> — il faut traiter la non-linéarité de
				l'inversion de <KatexInline formula={XTX} />. Freedman (1981) le fait pour la régression à
				nombre de paramètres fixé : l'approximation bootstrap de la distribution de l'estimateur des
				moindres carrés est <strong>valide, avec bornes d'erreur explicites</strong> (résumé) ;
				Bickel &amp; Freedman (1981, §7) en notent la proximité du cas de la moyenne. Sous des
				conditions légères (p fixé, moments des erreurs contrôlés) :
			</p>
			<KatexBlock formula={consOls} />
			<p>
				— la forme « sup-norme » de la consistance : la loi bootstrap de
				<KatexInline formula={ThBetaCentered} /> converge uniformément vers la loi
				d'échantillonnage vraie de <KatexInline formula={ThBetaCenteredTrue} />, pour tout x (la
				limite étant continue).
			</p>
			<p>
				<strong>Formulation générale (Bickel &amp; Freedman, 1981, fin de §2).</strong> Reprenant le
				cadre d'Efron — une statistique <KatexInline formula={ZNFF} /> dépendant des données
				<em>et</em> de la loi — : si la loi de <KatexInline formula={ZnF} /> converge faiblement vers
				une limite quand <KatexInline formula={NtoInf} />, alors la loi conditionnelle de
				<KatexInline formula={ZmStar} /> donnée <KatexInline formula={X1Xn} /> converge faiblement
				vers <strong>la même limite</strong>, avec probabilité 1 quand
				<KatexInline formula={MNtoInf} />. (La version de Bickel &amp; Freedman est plus
				forte que celle d'Efron : convergence presque sûre plutôt qu'en probabilité.) Le travail de
				Singh (1981), publié dans le même numéro des <em>Annals</em>, a étudié en parallèle la
				précision asymptotique de l'approximation.
			</p>
		</TheoremBlock>

		<!-- ========================================================= -->
		<!-- E.4 PREUVE                                                -->
		<!-- ========================================================= -->
		<h2 id="preuve">Esquisse de preuve</h2>

		<TheoremBlock number="E.4" title="Esquisse de preuve : la compensation des deux erreurs">
			<p>
				La preuve du Th. 2.1 est courte mais elle exige un outil. Comparer le classique
				<KatexInline formula={sqrtNClass} /> et le bootstrap <KatexInline formula={sqrtNBoot} /> : il
				y a <strong>deux erreurs</strong> — le paramètre <KatexInline formula={Mu} /> est remplacé par
				<KatexInline formula={XBarN} /> (changement d'ordre critique
				<KatexInline formula={InvSqrtN} />, « qui ne peut être ignoré »), et les
				<KatexInline formula="X" /> sont remplacés par des
				<KatexInline formula="X^*" /> (F remplacée par <KatexInline formula={FhatN} />). «
				<em>In fact, these two errors cancel each other to a large extent</em> » (p. 1197) — et la
				preuve formalise exactement cette phrase :
			</p>
			<ol>
				<li>
					<strong>Une distance qui voit les moments.</strong> Sur <KatexInline formula={Gamma2} />,
					la <strong>distance de Mallows d₂</strong> : <KatexInline formula="G_n = G" /> signifie
					convergence faible <strong>et</strong> <KatexInline formula={x2Converge} /> ;
					<KatexInline formula={d2Def} /> (infimum sur les couplages ; Mallows 1972). La loi forte
					donne <KatexInline formula={FhatNConv} /> le long de presque toutes les suites
					(eq. 2.1).
				</li>
				<li>
					<strong>La moyenne est une contraction en d₂.</strong> Si <KatexInline formula={Gm} />
					désigne la loi de <KatexInline formula={moyG} /> (m tirages de G, centrés et réduits), le
					Lemme 3 de Mallows (1972) donne <KatexInline formula={d2Contr} />.
				</li>
				<li>
					<strong>Assemblage.</strong> Conditionnellement aux données, la loi de
					<KatexInline formula={sqrtNBoot} /> est <em>exactement</em>
					<KatexInline formula={FhatNm} />. Comme <KatexInline formula={FhatN} /> est proche de F en
					d₂ (1.) et que la moyenne est une contraction (2.), <KatexInline formula={FhatNm} /> est
					proche de <KatexInline formula={Fm} /> — et le CLT classique s'applique à
					<KatexInline formula={Fm} />.
				</li>
			</ol>
			<p>
				La compensation n'est pas un accident : la première erreur (remplacer
				<KatexInline formula={Mu} /> par <KatexInline formula={XBarN} />) est
				<em>du bon ordre</em> et de la <em>bonne forme</em> (la loi de
				<KatexInline formula={XBarN} /> est elle-même approchée par le bootstrap), si bien que la loi
				du pivot ne « change pas beaucoup » quand <KatexInline formula={FhatN} /> est remplacée par F
				— c'est ce que formalisent les deux premières étapes.
			</p>
			<p>
				<strong>Pourquoi la variance finie est la condition juste.</strong> La topologie d₂ mesure
				précisément « convergence faible + convergence du second moment ». Si la variance est
				infinie, <KatexInline formula={FhatN} /> ne converge pas en d₂ — et le bootstrap de la moyenne
				devient <strong>inconstant</strong> : Athreya (1987) montre que si
				<KatexInline formula="X_1" /> est dans le domaine d'attraction d'une loi stable, la version
				bootstrap de la moyenne normalisée a une limite qui est une <em>distribution aléatoire</em>
				(qui dépend de l'échantillon), et non la loi stable théorique. La condition du Th. 2.1 est
				donc essentielle, pas technique.
			</p>
		</TheoremBlock>

		<!-- ========================================================= -->
		<!-- E.5 INTERVALLES                                           -->
		<!-- ========================================================= -->
		<h2 id="intervalles">Intervalles bootstrap</h2>

		<DefinitionBlock number="E.5" title="Basic, percentile, studentized — et leurs ordres de précision">
			<p>
				Transformer l'histogramme des <KatexInline formula={ThBetaStar} /> en intervalle de confiance
				de <KatexInline formula={BetaJ} /> se fait de trois façons standard (Efron &amp; Tibshirani,
				1993 ; Davison &amp; Hinkley, 1997) :
			</p>
			<ul>
				<li>
					<strong>Basic (reverse percentile).</strong> Par symétrie autour de
					<KatexInline formula={ThBeta} /> :
					<KatexBlock formula={icBasic} />
					« l'intervalle centré » — correct pour une loi symétrique centrée, approximativement.
				</li>
				<li>
					<strong>Percentile.</strong> Lire directement les quantiles de la loi bootstrap :
					<KatexBlock formula={icPerc} />
					Simple et invariant par transformation, mais : si la loi bootstrap est asymétrique ou
					décentrée par rapport à <KatexInline formula={ThBeta} />, l'intervalle est souvent
					inapproprié (Efron &amp; Tibshirani, 1993) — pour la variance échantillonnale,
					<KatexInline formula="n = 20" />, niveau nominal 90 %, la couverture réelle tombe à 78 %.
				</li>
				<li>
					<strong>Studentized (bootstrap-t).</strong> Remplacer l'écart-type par son estimateur
					dans <em>chaque</em> réplique :
					<KatexBlock formula={icStud} />
					La statistique bootstrappée est <strong>pivotal</strong> (sa limite ne dépend d'aucun
					paramètre inconnu) — c'est ce qui achète un ordre de précision.
				</li>
			</ul>
			<p>
				<strong>Hiérarchie de précision</strong> (cadre DiCiccio &amp; Efron ; Hall, 1988, pour la
				comparaison théorique) : on dit qu'un intervalle est <strong>exact au premier ordre</strong>
				si son erreur de couverture est <KatexInline formula={OInvSqrtN} />,
				<strong>au second ordre</strong> si elle est <KatexInline formula={OInvN} />. Le basic et le
				percentile sont au premier ordre ; le studentized (et le BCa de E.6) au second. En pratique :
				le percentile suffit quand la loi bootstrap de <KatexInline formula={ThBeta} /> est proche de
				symétrique (grand n, erreurs symétriques) ; le studentized coûte B réajustements complets
				(un <KatexInline formula={SEThBetaStar} /> par réplique) et est préféré quand l'asymétrie est
				visible.
			</p>
		</DefinitionBlock>

		<!-- ========================================================= -->
		<!-- E.6 BCA                                                   -->
		<!-- ========================================================= -->
		<h2 id="bca">L'intervalle BCa</h2>

		<DefinitionBlock number="E.6" title="L'intervalle BCa : correction de biais et accélération (Efron 1987)">
			<p>
				Pourquoi le percentile échoue-t-il ? Deux défauts, que l'intervalle
				<strong>BCa</strong> (<em>bias-corrected and accelerated</em>, Efron 1987) corrige
				automatiquement :
			</p>
			<ul>
				<li>
					<strong>Biais.</strong> La loi bootstrap n'est pas centrée sur
					<KatexInline formula={ThBeta} /> — son centre s'en décale de
					<KatexInline formula={z0} /> « écarts-types » (constante de biais).
				</li>
				<li>
					<strong>Accélération.</strong> L'écart-type de <KatexInline formula={ThBeta} />
					<em>varie</em> avec le paramètre — l'« unité naturelle » change le long de l'axe
					(constante <KatexInline formula="a" />) ; un intervalle symétrique en
					<KatexInline formula={ThBeta} /> n'est pas symétrique sur l'échelle qui rendrait la loi
					normale.
				</li>
			</ul>
			<p>
				Les deux constantes se calculent <strong>directement du bootstrap</strong>, sans connaître la
				transformation normalisante (Efron, 1987, sec. 4) :
			</p>
			<KatexBlock formula={bcaZ0} />
			<p>
				— la proportion de répliques bootstrap en dessous de
				<KatexInline formula={ThBeta} />, rapportée à l'échelle normale (eq. 4.1) ; et
			</p>
			<KatexBlock formula={bcaA} />
			<p>
				où <KatexInline formula={iTheta} /> est la fonction score évaluée en
				<KatexInline formula={ThBeta} /> (eq. 4.4–4.5) — en pratique, la skewness des valeurs
				d'influence (ou son estimateur jackknife, Efron &amp; Tibshirani, 1993). Les bornes de
				l'IC BCa à niveau <KatexInline formula={OneMinusAlpha} /> sont alors
			</p>
			<KatexBlock formula={bcaAlpha12} />
			<KatexBlock formula={bcaIC} />
			<p>
				avec <KatexInline formula={bcaZ} /> (eq. 3.8–3.9, 3.14 d'Efron 1987). Si
				<KatexInline formula="z_0 = a = 0" />, on retombe exactement sur le percentile ; si
				<KatexInline formula="a = 0" />, on obtient l'intervalle <strong>BC</strong>
				(<em>bias-corrected</em>, Efron 1981, 1982a) — la correction de biais seule ne fait « que la
				moitié du chemin » vers l'asymétrie exacte (Table 2 d'Efron 1987, famille
				<KatexInline formula={ChiScale} />). Le BCa est <strong>second-order correct</strong> — « in
				a wide variety of problems » (résumé d'Efron, 1987) — et invariant par transformation
				monotone. Pour les problèmes à plusieurs paramètres, <KatexInline formula="a" /> se calcule
				dans la direction la moins favorable (construction de Stein, 1956 ; sec. 6 d'Efron 1987) ; la
				preuve générale de second ordre n'existe pas encore dans ce cadre (p. 172 d'Efron 1987) —
				l'expérience, elle, est solide.
			</p>
		</DefinitionBlock>

		<!-- ========================================================= -->
		<!-- E.7 DOUBLE BOOTSTRAP                                      -->
		<!-- ========================================================= -->
		<h2 id="double-bootstrap">Le double bootstrap</h2>

		<DefinitionBlock number="E.7" title="Le double bootstrap : calibrer la couverture elle-même">
			<p>
				Le studentized et le BCa sont exacts au second ordre — mais leur erreur de couverture reste de
				l'ordre de <KatexInline formula={OInvN} />. Le <strong>double bootstrap</strong>
				(<em>iterated bootstrap</em>) va un cran plus loin : il <strong>estime et corrige l'erreur de
				couverture du bootstrap lui-même</strong>. Développé dans la seconde moitié des années 1980
				par plusieurs équipes — Beran (1987) pour les ensembles de confiance, Hall &amp; Martin (1988)
				et DiCiccio &amp; Romano (1988) pour les intervalles ; voir Martin (1992) pour la vue
				d'ensemble — il s'énonce ainsi (DiCiccio, Martin &amp; Young, 1992, sec. 2) :
			</p>
			<ol>
				<li>
					Soit <KatexInline formula={I0} /> un IC bootstrap non corrigé de niveau nominal
					<KatexInline formula={Alpha} /> (p. ex. percentile), construit à partir de l'échantillon
					<KatexInline formula="X" /> et d'un resamplage <KatexInline formula="X^*" />. Sa
					couverture réelle <KatexInline formula={PiAlpha} /> diffère de
					<KatexInline formula={Alpha} />.
				</li>
				<li>
					L'approximation bootstrap de cette couverture (eq. 1) :
					<KatexBlock formula={piHat} />
					— sur B resamplages <strong>externes</strong> <KatexInline formula="X^*" />, on refait un
					bootstrap <strong>interne</strong> <KatexInline formula={XDoubleStar} /> et on compte la
					proportion de <KatexInline formula={ThBeta} /> tombant dans l'IC calculé sur
					<KatexInline formula="X^*" /> (eq. 2).
				</li>
				<li>
					On résolve <KatexInline formula={piHatEq} /> et on retourne
					<KatexBlock formula={i1} />
				</li>
			</ol>
			<p>
				L'intervalle ainsi <strong>calibré</strong> a une erreur de couverture un ordre de mieux — de
				l'ordre de <KatexInline formula={OInvN32} /> au lieu de <KatexInline formula={OInvN} /> (Beran,
				1987 ; DiCiccio &amp; Romano, 1988). Le prix :
				<KatexInline formula={BBi} /> opérations de resamplage pour un seul intervalle — « la
				construction d'un seul intervalle très précis peut prendre des heures, voire des jours »
				(DiCiccio, Martin &amp; Young, 1992) ; les variantes par approximation saddlepoint (cet
				article) réduisent drastiquement le coût, mais sortent du cadre de cette leçon.
			</p>
			<p>
				<strong>Limite essentielle.</strong> Le double bootstrap corrige un
				<em>biais de couverture</em> — il ne répare pas une <em>inconsistance</em>. Pour le maximum
				(E.9), l'échec est structurel : aucun resamplage interne ne peut dépasser le maximum externe,
				quelle que soit la profondeur de l'itération (cf. aussi Hall, Härdle &amp; Simar, 1993, sur
				l'inconsistance des estimateurs de distribution de paramètres classés).
			</p>
		</DefinitionBlock>

		<!-- ========================================================= -->
		<!-- E.8 WILD BOOTSTRAP                                        -->
		<!-- ========================================================= -->
		<h2 id="wild">Wild bootstrap</h2>

		<DefinitionBlock number="E.8" title="Wild bootstrap : hétéroscédasticité (Wu 1986 ; Mammen 1993)">
			<p>
				La leçon 4 de cette partie diagnostique l'hétéroscédasticité — le « éventail » :
				<KatexInline formula={SigmaI2} /> dépend de i. Le resamplage naïf la trahit : Wu (1986)
				montre que les deux variantes classiques du bootstrap de régression — le resamplage des paires
				et le resamplage i.i.d. des résidus — donnent des <strong>estimateurs de variance
				biaisés</strong> sous hétéroscédasticité (le resamplage i.i.d. des résidus impose implicitement
				<KatexInline formula={SigmaIdem} />). Le <strong>wild bootstrap</strong> corrige cela en
				pondérant chaque résidu par un poids aléatoire (Wu, 1986) :
			</p>
			<KatexBlock formula={wild} />
			<p>
				avec <KatexInline formula="v_i" /> i.i.d., indépendants des données,
				<KatexInline formula={vMoments} /> ; les régresseurs restent fixes, on réajuste le modèle sur
				<KatexInline formula={YStarWild} />. La variance locale est préservée car
				<KatexInline formula={wildVar} /> — contrairement au resamplage i.i.d. des résidus, la
				structure <KatexInline formula={SigmaI2Eps} /> n'est pas lissée. Les deux choix de poids
				standards :
			</p>
			<ul>
				<li>
					<strong>Rademacher</strong> : <KatexInline formula={rademacher} /> ;
				</li>
				<li>
					<strong>Mammen (1993)</strong> : à deux points, <KatexInline formula={mammen} /> — avec
					<KatexInline formula={mammenMoments} /> (vérifiable par calcul direct) ; l'ajustement du
					troisième moment améliore l'approximation de second ordre (Mammen, 1993, qui applique le
					wild bootstrap aux modèles linéaires de grande dimension et aux tests F).
				</li>
			</ul>
			<p>
				Le wild bootstrap donne des estimateurs de variance « <em>bias-robust</em> » sous
				hétéroscédasticité (Wu, 1986) — c'est-à-dire qu'ils convergent vers la bonne variance même si
				la forme exacte de <KatexInline formula={SigmaI2} /> est mal spécifiée.
			</p>
		</DefinitionBlock>

		<!-- ========================================================= -->
		<!-- E.9 ÉCHECS                                                -->
		<!-- ========================================================= -->
		<h2 id="echecs">Quand le bootstrap échoue</h2>

		<ExampleBlock number="E.9" title="Le maximum, les U-statistiques — et pourquoi la médiane, elle, passe">
			<p>
				Le principe d'uniformité de E.4 a un prix. Le contre-exemple canonique (Bickel &amp; Freedman,
				1981, §6) : F uniforme sur <KatexInline formula={OpenTheta} />, et
				<KatexInline formula={Theta} /> — le bord supérieur du support. Le pivot usuel
				<KatexInline formula={maxPivot} /> a une limite exponentielle standard. Le substitut bootstrap
				naturel — resamplage dans <KatexInline formula={FhatN} /> et étude de
				<KatexInline formula={maxPivotBoot} /> — <strong>ne fonctionne pas</strong> :
			</p>
			<KatexBlock formula={maxFail} />
			<p>
				avec probabilité tendant vers <KatexInline formula={oneMinus1e} /> : la maximum bootstrappée
				coïncide avec la maximum observée 63 % du temps — on ne peut pas tirer au-delà du maximum des
				données. Plus généralement, la loi conditionnelle de
				<KatexInline formula={maxSpacing} /> <strong>n'a pas de limite faible</strong> (limsup = +∞,
				liminf = 0, presque sûrement, pour chaque k) — « this unpleasant behavior cannot be mended by
				simple smoothing » (p. 1210). Le diagnostic est celui de E.4 :
				<strong>défaut d'uniformité</strong> de la convergence de <KatexInline formula={FhatN} /> vers
				F au voisinage du bord du support.
			</p>
			<p>
				<strong>Le bootstrap paramétrique répare le maximum.</strong> Tirer dans l'uniforme
				<KatexInline formula={ZeroToXn} /> (le modèle paramétrique adapté, estimé par la maximum
				observée) au lieu de <KatexInline formula={FhatN} />, la loi bootstrap du pivot retrouve la
				limite exponentielle (Bickel &amp; Freedman, 1981, §6) — cohérent avec le résultat de p. 1199
				: resamplage dans n'importe quel estimateur <KatexInline formula={FtildeN} /> de F marche dès
				que <KatexInline formula={FtildeConv} /> (convergence faible <em>et</em> du second moment).
				Moral : le bootstrap non paramétrique ne voit pas au-delà des données observées ; si la famille
				paramétrique le voit, on l'utilise.
			</p>
			<p>
				<strong>Deuxième échec : la U-statistique à noyau singulier</strong> (contre-exemple 1,
				p. 1209–1210). Le Théorème 3.1 exige <KatexInline formula={diagCond} /> (condition de von
				Mises sur la diagonale). Sans elle, la partie du noyau <em>sur</em> la diagonale — alimentée
				par les <strong>collisions</strong> du resamplage (le nombre de paires tirées deux fois suit
				asymptotiquement un Poisson(1)) — peut dominer : <KatexInline formula={uStatFail} /> peut
				tendre vers +∞ en probabilité (exemple : F uniforme sur (0,1), noyau de type
				<KatexInline formula={DiagKernel} /> sur la diagonale). Là encore, c'est l'uniformité qui
				manque.
			</p>
			<p>
				<strong>En sens inverse, la médiane est un cas de succès</strong> — souvent présentée à tort
				comme un cas d'échec. Si F a une médiane unique <KatexInline formula={MuOnly} /> et une densité f
				avec <KatexInline formula={fMuPos} />, alors, conditionnellement aux données,
				<KatexInline formula={medBoot} /> — la même limite que <KatexInline formula={medTrue} />
				(Bickel &amp; Freedman, 1981, Prop. 5.1). C'est le <strong>jackknife</strong>, pas le
				bootstrap, qui échoue pour la médiane (Efron, 1979, §3). Si la densité s'annule en la médiane
				(<KatexInline formula={fMuZero} />), le taux <KatexInline formula={SqrtN} /> ne tient plus
				et le bootstrap doit être mené à une échelle différente — une branche entière de la théorie
				(Léger &amp; Macgibbon, 2006) que cette leçon ne détaille pas.
			</p>
			<p>
				<strong>Enfin, la variance doit être finie.</strong> Athreya (1987) : si
				<KatexInline formula={EX2Inf} /> (domaine d'attraction d'une loi stable), la version
				bootstrap de la moyenne normalisée converge vers une <strong>distribution aléatoire</strong>
				(qui dépend de l'échantillon), pas vers la loi stable théorique — le bootstrap de la moyenne
				est inconstant. La condition du Th. 2.1 n'est pas technique.
			</p>
		</ExampleBlock>

		<!-- ========================================================= -->
		<!-- E.10 DÉMO WILD BOOTSTRAP                                  -->
		<!-- ========================================================= -->
		<InteractiveSection number="E.10" title="Wild bootstrap sous hétéroscédasticité" onInteract={tracker.trackInteraction}>
			<p>
				<strong>Explorer :</strong> le design en éventail ci-dessous a
				<KatexInline formula={SigmaI2Fan} /> croissant avec
				<KatexInline formula="x" />. Comparez les quatre erreurs-types de la pente : la formule du
				cours (homoscédastique), le resamplage naïf des résidus, le wild bootstrap (Rademacher ou
				Mammen), et la vraie erreur-type (connue en simulation). Le naïf est biaisé, le wild est calé
				— c'est le résultat de Wu (1986) en image.
			</p>
			<DeferredDemo load={() => import('$lib/components/demos/LmWildBootstrap.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- E.11 DÉMO STATISTIQUES D'ORDRE                            -->
		<!-- ========================================================= -->
		<InteractiveSection number="E.11" title="Maximum (échec) et médiane (succès)" onInteract={tracker.trackInteraction}>
			<p>
				<strong>Explorer :</strong> échantillon uniforme
				<KatexInline formula={OpenTheta} /> seedé, <KatexInline formula={ThetaKnown} /> (connu en
				simulation). L'histogramme du maximum bootstrap porte une masse ≈ 63 % sur la maximum
				observée — le pivot n'a pas de limite (E.9), alors que la courbe exponentielle est la vraie
				loi du pivot. La médiane, elle, se bootstrappe proprement : l'histogramme est lisse et son
				écart-type colle à <KatexInline formula={medSE} /> (densité
				<KatexInline formula={fUnif} />). Le toggle « bootstrap paramétrique » montre la réparation du
				maximum par le resamplage dans <KatexInline formula={ZeroToXn} />.
			</p>
			<DeferredDemo load={() => import('$lib/components/demos/BootstrapOrderStats.svelte')} />
		</InteractiveSection>

		<!-- ========================================================= -->
		<!-- PONT BAGGING                                              -->
		<!-- ========================================================= -->
		<Callout type="intuition" title="Pont vers le bagging (Partie V)">
			<p>
				Le mécanisme de resamplage d'E.1 est <strong>exactement</strong> celui du
				<strong>bagging</strong> (<a href="/part5/lesson1">Partie V, leçon 1</a>) : même tirage avec
				remise, même constante <KatexInline formula="1 - 1/e" /> ≈ 63,2 % d'observations présentes au
				moins une fois dans l'échantillon bootstrap (et 36,8 % absentes — l'origine de l'erreur
				out-of-bag, Définition 4.6 de la Partie V). La différence d'usage : le bagging
				<strong>moyenne les prédictions</strong> de B modèles bootstrappés pour réduire la variance
				(Théorème 4.2 de la Partie V : variance <KatexInline formula={VarM} /> si décorrélés) ; le
				bootstrap <strong>étudie la distribution</strong> d'une statistique réestimée pour
				l'inférence. La même constante refait même surface dans le contre-exemple d'E.9 : la maximum
				bootstrappée égale la maximum observée avec probabilité tendant vers
				<KatexInline formula="1 - 1/e" />.
			</p>
		</Callout>

		<!-- ========================================================= -->
		<!-- EXERCICES                                                 -->
		<!-- ========================================================= -->
		<h2 id="exercices">Exercices</h2>

		<ExercisePanel number="1" title="Fonctions d'influence (E.13.1)">
			<p>
				(E.2) Montrer que les fonctions d'influence ci-dessous sont celles des fonctionnels indiqués,
				en vérifiant la condition de centrage <KatexInline formula={psiCentered} /> et le moment
				<KatexInline formula="E_F[ψ^2]" /> :
			</p>
			<ol>
				<li>
					Moyenne <KatexInline formula={GMoy} /> : <KatexInline formula={psiMoy} />. (Trivial —
					sert de contrôle.)
				</li>
				<li>
					Variance <KatexInline formula={gVar} /> : <KatexInline formula={psiVar} />.
					<em>(Indice : différencier <KatexInline formula={varDir} /> en
					<KatexInline formula="G = F + t(G' - F)" />.)</em>
				</li>
				<li>
					Médiane m (f(m) &gt; 0) : <KatexInline formula={psiMed} />, d'où
					<KatexInline formula={varMed} /> — retrouver la variance limite de la Prop. 5.1 de
					Bickel &amp; Freedman (1981).
				</li>
			</ol>
			{#snippet solution()}
				<p>
					(1) <KatexInline formula={psiMoy} />, centrage évident,
					<KatexInline formula="E[ψ^2] = σ^2" />.
				</p>
				<p>
					(2) <KatexInline formula={varDir} /> ; la dérivée en
					<KatexInline formula="t = 0" /> vaut <KatexInline formula={psiVarDeriv} /> — la fonction
					d'influence de la variance. Centrage :
					<KatexInline formula="E[(X-μ)^2 - σ^2] = 0" /> ; moment
					<KatexInline formula="E[ψ^2] = μ_4 - σ^4" /> (où <KatexInline formula={Mu4} />) — d'où le
					CLT de la variance.
				</p>
				<p>
					(3) Si <KatexInline formula="G" /> est proche de F, la médiane de G vaut
					<KatexInline formula={medPerturb} /> au premier ordre en
					<KatexInline formula="G - F" /> (car <KatexInline formula="G(m + δ) ≈ 1/2 + f(m)δ" />) ;
					la dérivée donne <KatexInline formula={psiMed} />. Centrage :
					<KatexInline formula={PLeM} />. Moment :
					<KatexInline formula={varMedCalc} /> — c'est exactement la variance asymptotique de la
					Prop. 5.1, que le bootstrap reproduit conditionnellement.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="2" title="Le maximum et la constante 1 − 1/e (E.13.2)">
			<p>
				(E.9) Soit <KatexInline formula={XOrd} /> les statistiques d'ordre d'un échantillon de taille
				n, et <KatexInline formula={XStarOrd} /> celles d'un échantillon bootstrap tiré dans la loi
				empirique.
			</p>
			<ol>
				<li>
					Calculer exactement <KatexInline formula={pMaxEq} /> et sa limite.
				</li>
				<li>
					Montrer que <KatexInline formula={maxBound} /> — le bootstrap maximum ne dépasse jamais le
					maximum observée. En déduire que <KatexInline formula={maxPivotBoot} /> ne peut pas avoir
					une limite non dégénérée : si elle existait et était continue, sa masse au point 0 devrait
					être <KatexInline formula={oneMinus1e} />, alors que la vraie loi du pivot
					<KatexInline formula={maxPivot} /> est exponentielle (continue, masse nulle en 0).
				</li>
				<li>
					(Bonus) Avec le bootstrap paramétrique — tirage dans
					<KatexInline formula={ZeroToXn} /> — montrer que
					<KatexInline formula={paramMaxPivot} /> converge faiblement vers la loi exponentielle
					standard.
				</li>
			</ol>
			{#snippet solution()}
				<p>
					(1) <KatexInline formula={XStarOrd} /> vaut <KatexInline formula={XOrd} /> si au moins un
					tirage retombe sur <KatexInline formula={XOrd} /> ; les n tirages indépendants évitent
					<KatexInline formula={XOrd} /> avec probabilité
					<KatexInline formula="(1 - 1/n)^n" />. D'où <KatexInline formula={pMaxCalc} />.
				</p>
				<p>
					(2) Chaque <KatexInline formula={XiStar} /> est une copie d'un
					<KatexInline formula="X_i" />, donc <KatexInline formula={maxBound} />. Si la loi
					conditionnelle de <KatexInline formula={maxPivotBoot} /> convergeait vers une loi continue
					L, alors <KatexInline formula={L0} /> — mais on vient de calculer
					<KatexInline formula={oneMinus1e} />, et L(0) = 0 pour toute loi continue : contradiction
					(la vraie limite, exponentielle, est continue).
				</p>
				<p>
					(3) Si <KatexInline formula={XiPP} /> i.i.d. uniformes sur
					<KatexInline formula={ZeroToXn} />, alors <KatexInline formula={XiPScaled} /> i.i.d.
					uniformes sur (0,1), et <KatexInline formula={paramMaxCalc} /> — le classique
					<KatexInline formula={NExp} />.
				</p>
			{/snippet}
		</ExercisePanel>

		<ExercisePanel number="3" title="Wild bootstrap : identité de variance (E.13.3)">
			<p>
				(E.8) Régression simple sans intercept, <KatexInline formula={yiBetaX} />, régresseurs fixes,
				<KatexInline formula={SigmaI2} /> non supposé constant. Les poids du wild bootstrap vérifient
				<KatexInline formula={vMoments} /> et sont indépendants des données.
			</p>
			<ol>
				<li>
					Montrer que <KatexInline formula={wildSlope} /> — i.e. le wild bootstrap de la pente est
					<KatexInline formula={wildSlopeFormula} />.
				</li>
				<li>
					En déduire <KatexInline formula={wildVarExact} /> (espérance sur les poids).
				</li>
				<li>
					Comparer avec la formule homoscédastique du cours <KatexInline formula={seHomos} /> (où
					<KatexInline formula={sigma2hat} />). Montrer que sous l'éventail
					<KatexInline formula={sigmaI2Fan} />, l'estimateur wild converge vers la vraie variance
					<KatexInline formula={varBetaTrue} /> de <KatexInline formula={ThBeta} />, alors que la
					formule homoscédastique ne converge vers elle en général pas.
				</li>
			</ol>
			{#snippet solution()}
				<p>
					(1) Par linéarité, <KatexInline formula={wildSlopeDeriv} /> et
					<KatexInline formula={bhatIdentity} />, d'où
					<KatexInline formula={wildSlopeFormula} />.
				</p>
				<p>
					(2) Indépendance des <KatexInline formula="v_i" /> et
					<KatexInline formula={vMoments} /> : <KatexInline formula={wildVarCalc} />.
				</p>
				<p>
					(3) Vraie variance (poids <KatexInline formula="x_i" /> fixes,
					<KatexInline formula={epsInd} /> indépendants) :
					<KatexInline formula={varBetaTrueCalc} />. L'estimateur wild remplace
					<KatexInline formula={SigmaI2} /> par
					<KatexInline formula={EpsI2} />, qui converge vers
					<KatexInline formula={SigmaI2} /> — il est <em>robust</em>. La formule homoscédastique
					vaut <KatexInline formula={seHomosValue} /> avec
					<KatexInline formula={sigma2hatValue} /> : sous l'éventail,
					<KatexInline formula={fanMismatch} /> en général (égalité seulement si les
					<KatexInline formula={SigmaI2} /> sont constants). C'est le contenu heuristique du
					résultat de Wu (1986).
				</p>
			{/snippet}
		</ExercisePanel>

		<!-- ========================================================= -->
		<!-- QUIZ                                                      -->
		<!-- ========================================================= -->
		<h2 id="quiz">Quiz</h2>

		<InteractiveSection number="E.14" title="Quiz — théorie du bootstrap" onInteract={tracker.trackInteraction}>
			<Quiz items={quiz} />
		</InteractiveSection>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Efron, B.']}
			year={1979}
			title="Bootstrap Methods: Another Look at the Jackknife"
			journal="The Annals of Statistics, 7(1):1–26."
			link="https://doi.org/10.1214/aos/1176344139"
		/>

		<BibElement
			authors={['Efron, B.']}
			year={1982}
			title="The Jackknife, the Bootstrap and Other Resampling Plans"
			journal="CBMS-NSF Regional Conference Series in Applied Mathematics, vol. 38. SIAM, Philadelphia."
			link="https://doi.org/10.1137/1.9781611970319"
		/>

		<BibElement
			authors={['Efron, B.']}
			year={1987}
			title="Better Bootstrap Confidence Intervals"
			journal="Journal of the American Statistical Association, 82(397):171–185."
			link="https://doi.org/10.1080/01621459.1987.10478410"
		/>

		<BibElement
			authors={['Bickel, P. J.', 'Freedman, D. A.']}
			year={1981}
			title="Some Asymptotic Theory for the Bootstrap"
			journal="The Annals of Statistics, 9(6):1196–1217."
			link="https://doi.org/10.1214/aos/1176345637"
		/>

		<BibElement
			authors={['Freedman, D. A.']}
			year={1981}
			title="Bootstrapping Regression Models"
			journal="The Annals of Statistics, 9(6):1218–1228."
			link="https://doi.org/10.1214/aos/1176345638"
		/>

		<BibElement
			authors={['Singh, K.']}
			year={1981}
			title="On the Asymptotic Accuracy of Efron's Bootstrap"
			journal="The Annals of Statistics, 9(6):1187–1195."
		/>

		<BibElement
			authors={['Wu, C. F. J.']}
			year={1986}
			title="Jackknife, Bootstrap and Other Resampling Methods in Regression Analysis"
			journal="The Annals of Statistics, 14(4):1261–1295."
			link="https://doi.org/10.1214/aos/1176350142"
		/>

		<BibElement
			authors={['Mammen, E.']}
			year={1993}
			title="Bootstrap and Wild Bootstrap for High Dimensional Linear Models"
			journal="The Annals of Statistics, 21(1):255–285."
			link="https://doi.org/10.1214/aos/1176349025"
		/>

		<BibElement
			authors={['Athreya, K. B.']}
			year={1987}
			title="Bootstrap of the Mean in the Infinite Variance Case"
			journal="The Annals of Statistics, 15(2):724–731."
			link="https://doi.org/10.1214/aos/1176350371"
		/>

		<BibElement
			authors={['Beran, R.']}
			year={1987}
			title="Prepivoting to Reduce Level Error of Confidence Sets"
			journal="Biometrika, 74(3):457–468."
			link="https://doi.org/10.1093/biomet/74.3.457"
		/>

		<BibElement
			authors={['Hall, P.', 'Martin, R.']}
			year={1988}
			title="On Bootstrap Resampling and Iteration"
			journal="Biometrika, 75(4):661–671."
			link="https://doi.org/10.1093/biomet/75.4.661"
		/>

		<BibElement
			authors={['Hall, P.']}
			year={1988}
			title="Theoretical Comparison of Bootstrap Confidence Intervals"
			journal="The Annals of Statistics, 16(1)."
			link="https://doi.org/10.1214/aos/1176350933"
		/>

		<BibElement
			authors={['DiCiccio, T. J.', 'Romano, J. P.']}
			year={1988}
			title="A Review of Bootstrap Confidence Intervals"
			journal="Journal of the Royal Statistical Society A, 50:338–354."
			link="https://doi.org/10.1111/j.2517-6161.1988.tb01732.x"
		/>

		<BibElement
			authors={['DiCiccio, T. J.', 'Martin, M. A.', 'Young, G. A.']}
			year={1992}
			title="Fast and Accurate Approximate Double Bootstrap Confidence Intervals"
			journal="Biometrika, 79(2):285–295."
			link="https://doi.org/10.2307/2336840"
		/>

		<BibElement
			authors={['Martin, M. A.']}
			year={1992}
			title="On the Double Bootstrap"
			journal="Computing Science and Statistics (24th Symposium on the Interface). Springer, 73–78."
			link="https://doi.org/10.1007/978-1-4612-2856-1_9"
		/>

		<BibElement
			authors={['Hall, P.', 'Härdle, W.', 'Simar, L.']}
			year={1993}
			title="On the Inconsistency of Bootstrap Distribution Estimators"
			journal="Computational Statistics & Data Analysis, 16(1):11–18."
			link="https://doi.org/10.1016/0167-9473(93)90241-K"
		/>

		<BibElement
			authors={['Léger, C.', 'Macgibbon, B.']}
			year={2006}
			title="On the Bootstrap in Cube Root Asymptotics"
			journal="Canadian Journal of Statistics, 34(1):29–44."
			link="https://doi.org/10.1002/cjs.5550340104"
		/>

		<BibElement
			authors={['Efron, B.', 'Tibshirani, R. J.']}
			year={1993}
			title="An Introduction to the Bootstrap"
			journal="Monographs on Statistics and Applied Probability, vol. 57. Chapman & Hall, Boca Raton."
		/>

		<BibElement
			authors={['Davison, A. C.', 'Hinkley, D. V.']}
			year={1997}
			title="Bootstrap Methods and Their Application"
			journal="Cambridge University Press."
		/>

		<BibElement
			authors={['DiCiccio, T. J.', 'Efron, B.']}
			year={1996}
			title="Bootstrap Confidence Intervals"
			journal="Statistical Science, 11(3):189–212."
			link="https://doi.org/10.1214/ss/1032280214"
		/>
	</Bibliography>
</PageTemplate>
