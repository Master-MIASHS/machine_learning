<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import DeferredDemo from '$lib/components/layout/DeferredDemo.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import TableOfContents from '$lib/components/narrative/TableOfContents.svelte';
	import Callout from '$lib/components/narrative/Callout.svelte';
	import DefinitionBlock from '$lib/components/narrative/DefinitionBlock.svelte';
	import ExampleBlock from '$lib/components/narrative/ExampleBlock.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import InteractiveSection from '$lib/components/narrative/InteractiveSection.svelte';
	import TheoremBlock from '$lib/components/narrative/TheoremBlock.svelte';
	import ExpertPanel from '$lib/components/narrative/ExpertPanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import SvmMarginExplorer from '$lib/components/demos/SvmMarginExplorer.svelte';
	import SvmSoftMarginExplorer from '$lib/components/demos/SvmSoftMarginExplorer.svelte';
	import FeatureMapExplorer from '$lib/components/demos/FeatureMapExplorer.svelte';
	import KernelPSDExplorer from '$lib/components/demos/KernelPSDExplorer.svelte';
	import LossFunctionExplorer from '$lib/components/demos/LossFunctionExplorer.svelte';
	import { asset, resolve } from '$app/paths';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { createPageTracker } from '$lib/stores/progress.svelte';
	import type { PageMeta } from '$lib/navigation.js';

	const meta = getPageByPath('/part2/lesson4');
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
			id: 'donnees-separables',
			label: 'Données séparables ou non ?',
			description: "La première étape pour choisir l'algorithme SVM",
			color: 'epistemic'
		},
		{
			id: 'marge-rigide',
			label: 'SVM à marge rigide',
			description: 'Marge, vecteurs de support, formulations primale et duale',
			color: 'belief'
		},
		{
			id: 'marge-souple',
			label: 'SVM à marge souple',
			description: "Variables d'ajustement, hyperparamètre C, perte hinge",
			color: 'surprise'
		},
		{
			id: 'noyau',
			label: 'SVM à noyau',
			description: 'Espace de redescription, astuce du noyau, Moore–Aronszajn',
			color: 'agent'
		}
	];

	// ── Formula variables (kept in script so Svelte never parses backslashes) ──

	const yBinary = '\\mathcal{Y} = \\{-1, +1\\}';
	const trainData = '(x_1, y_1), \\dots, (x_n, y_n) \\in \\mathbb{R}^d \\times \\mathcal{Y}';
	const hyperplaneSet =
		'H = \\left\\{x \\in \\mathbb{R}^d \\, : \\, \\langle w, x\\rangle + b = 0\\right\\}';
	const hyperplaneParams =
		'(w, b) \\in \\mathbb{R}^d \\times \\mathbb{R}, \\qquad \\vec{w} \\perp H';
	const signClass = '\\mathrm{sign}\\left(\\langle w, x\\rangle + b\\right)';
	const distFormula = 'd(x, H) = \\dfrac{\\left|\\langle w, x\\rangle + b\\right|}{\\|w\\|}';
	const proofCollinear =
		'\\overrightarrow{xp} = k \\cdot \\vec{w}, \\qquad k = -\\dfrac{\\langle w, x\\rangle + b}{\\|w\\|^2}';
	const proofNorm =
		'\\left\\|\\overrightarrow{xp}\\right\\| = k \\, \\|w\\| = \\dfrac{\\left|\\langle w, x\\rangle + b\\right|}{\\|w\\|}';
	const primalOptim2 =
		'\\left(\\widehat{w}, \\widehat{b}\\right) = \\arg\\min_{(w, b) \\,\\in\\, \\mathbb{R}^d \\times \\mathbb{R}} \\; \\dfrac{1}{2}\\, \\|w\\|^2 \\qquad \\text{s.c.} \\qquad y_i\\left(\\langle w, x_i\\rangle + b\\right) \\geq 1, \\;\\; \\forall i \\in \\{1, \\dots, n\\}';
	const hPlus =
		'H_+ = \\left\\{x \\in \\mathbb{R}^d \\, : \\, \\langle \\widehat{w}, x\\rangle + \\widehat{b} = 1\\right\\}';
	const hMinus =
		'H_- = \\left\\{x \\in \\mathbb{R}^d \\, : \\, \\langle \\widehat{w}, x\\rangle + \\widehat{b} = -1\\right\\}';
	const hardClassifier =
		'\\mathrm{sign}\\left[ \\langle \\widehat{w}, x\\rangle + \\widehat{b} \\right]';
	const scaleRemark = 'y_i\\left(\\langle w, x_i\\rangle + b\\right) \\geq 1';
	const dualOptim3 =
		'\\begin{aligned} \\widehat{\\alpha} &= \\arg\\max_{\\alpha \\,\\in\\, \\mathbb{R}^n} \\; \\sum_{i=1}^n \\alpha_i - \\dfrac{1}{2} \\sum_{i=1}^n \\sum_{\\ell=1}^n \\alpha_i \\alpha_\\ell \\, y_i \\, y_\\ell \\, \\langle x_i, x_\\ell\\rangle \\\\ &\\quad \\text{s.c.} \\quad \\sum_{i=1}^n \\alpha_i y_i = 0 \\;\\; \\text{et} \\;\\; \\alpha_i \\geq 0, \\;\\; \\forall i \\in \\{1, \\dots, n\\} \\end{aligned}';
	const dualW = '\\widehat{w} = \\sum_{i=1}^n \\widehat{\\alpha}_i y_i x_i';
	const dualB =
		'\\widehat{b} = 1 - \\min_{\\substack{i \\in \\{1, \\dots, n\\} \\\\ y_i = 1}} \\langle \\widehat{w}, x_i\\rangle';
	const lagrangianFull =
		'\\mathcal{L}(w, b, \\alpha) = \\dfrac{1}{2}\\|w\\|^2 + \\sum_{i=1}^n \\alpha_i \\left(1 - y_i\\left(\\langle w, x_i\\rangle + b\\right)\\right)';
	const lagrangianReduced =
		'\\mathcal{L}(w, \\alpha) = \\dfrac{1}{2}\\|w\\|^2 + \\sum_{i=1}^n \\alpha_i \\left(1 - y_i \\langle w, x_i\\rangle\\right)';
	const primalP =
		'(P) \\; : \\; \\; \\min_{(w, b) \\,\\in\\, \\mathbb{R}^d \\times \\mathbb{R}} \\; \\max_{\\substack{\\alpha \\in \\mathbb{R}^n \\\\ \\alpha_1 \\geq 0, \\dots, \\alpha_n \\geq 0}} \\; \\mathcal{L}(w, b, \\alpha)';
	const dualQ =
		'(Q) \\; : \\; \\; \\max_{\\substack{\\alpha \\in \\mathbb{R}^n \\\\ \\alpha_1 \\geq 0, \\dots, \\alpha_n \\geq 0}} \\; \\min_{(w, b) \\,\\in\\, \\mathbb{R}^d \\times \\mathbb{R}} \\; \\mathcal{L}(w, b, \\alpha)';
	const kktHard =
		'\\widehat{\\alpha}_i \\left[ y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) - 1 \\right] = 0';
	const dualClassifier =
		'\\mathrm{sign}\\left[ \\sum_{i=1}^n \\widehat{\\alpha}_i y_i \\langle x_i, x\\rangle + \\widehat{b} \\right]';

	// SVM à marge souple
	const constraintRigide =
		'\\forall i \\in \\{1, \\dots, n\\} \\qquad y_i\\left(\\langle w, x_i\\rangle + b\\right) \\geq 1';
	const constraintSouple =
		'\\forall i \\in \\{1, \\dots, n\\} \\qquad y_i\\left(\\langle w, x_i\\rangle + b\\right) \\geq 1 - \\xi_i';
	const caseXi0 =
		'\\xi_i = 0 \\;\\;\\Longrightarrow\\;\\; y_i\\left(\\langle w, x_i\\rangle + b\\right) \\geq 1';
	const caseXi1 =
		'0 < \\xi_i \\leq 1 \\;\\;\\Longrightarrow\\;\\; 0 \\leq y_i\\left(\\langle w, x_i\\rangle + b\\right) < 1';
	const caseXi2 =
		'\\xi_i > 1 \\;\\;\\Longrightarrow\\;\\; y_i\\left(\\langle w, x_i\\rangle + b\\right) < 0';
	const softPrimal =
		'\\left(\\widehat{w}, \\widehat{b}, \\widehat{\\xi}\\right) = \\arg\\min_{(w, b, \\xi) \\,\\in\\, \\mathbb{R}^d \\times \\mathbb{R} \\times \\mathbb{R}_+} \\; \\dfrac{1}{2}\\|w\\|^2 + C \\sum_{i=1}^n \\xi_i \\qquad \\text{s.c.} \\qquad y_i\\left(\\langle w, x_i\\rangle + b\\right) \\geq 1 - \\xi_i \\;\\; \\text{et} \\;\\; \\xi_i \\geq 0, \\;\\; \\forall i \\in \\{1, \\dots, n\\}';
	const hingeObjective =
		'(P) \\; : \\; \\; \\min_{(w, b) \\,\\in\\, \\mathbb{R}^d \\times \\mathbb{R}} \\; \\dfrac{1}{2 n C}\\, \\|w\\|^2 + \\dfrac{1}{n} \\sum_{i=1}^n \\ell^{\\mathrm{hinge}}\\left((w, b), (x_i, y_i)\\right)';
	const hingeLoss =
		'\\ell^{\\mathrm{hinge}}\\left((w, b), (x_i, y_i)\\right) = \\max\\left(0, \\; 1 - y_i\\left(\\langle w, x_i\\rangle + b\\right)\\right)';
	const softDual =
		'\\begin{aligned} \\widehat{\\alpha} &= \\arg\\max_{\\alpha \\,\\in\\, \\mathbb{R}^n} \\; \\sum_{i=1}^n \\alpha_i - \\dfrac{1}{2} \\sum_{i=1}^n \\sum_{\\ell=1}^n \\alpha_i \\alpha_\\ell \\, y_i \\, y_\\ell \\, \\langle x_i, x_\\ell\\rangle \\\\ &\\quad \\text{s.c.} \\quad \\sum_{i=1}^n \\alpha_i y_i = 0 \\;\\; \\text{et} \\;\\; 0 \\leq \\alpha_i \\leq C, \\;\\; \\forall i \\in \\{1, \\dots, n\\} \\end{aligned}';
	const softDualB =
		'\\widehat{b} = y_i - \\sum_{j=1}^n \\widehat{\\alpha}_j y_j \\langle x_j, x_i\\rangle \\qquad \\text{pour } (x_i, y_i) \\text{ t.q. } 0 < \\widehat{\\alpha}_i < C';
	const kktSoft =
		'\\widehat{\\alpha}_i \\left[ y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) - 1 + \\xi_i \\right] = 0';
	const kktAbove = 'y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) > 1';
	const kktOn = 'y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) = 1';
	const mDef = 'm_i = y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right)';

	// Panneau expert « Dualité KKT de la SVM : vecteurs support et parcimonie »
	// (expert/part2/lesson4/svm-dualite-kkt.md — dérivation du dual rigide et
	// souple, lecture KKT : ESL 2e éd. ch. 12, S&B ch. 15, B&V ch. 5)
	const dualFuncDef =
		'g(\\alpha) \\;=\\; \\inf_{(w, b) \\, \\in \\, \\mathbb{R}^d \\times \\mathbb{R}} \\; \\mathcal{L}(w, b, \\alpha)';
	const dualMaxG = '\\max_{\\alpha \\, \\geq \\, 0} \\; g(\\alpha) \\;=\\; (Q)';
	const kktGradW =
		'\\nabla_w \\, \\mathcal{L}(w, b, \\alpha) \\;=\\; w - \\sum_{i=1}^n \\alpha_i y_i x_i \\;=\\; 0 \\quad \\Longrightarrow \\quad w(\\alpha) \\;=\\; \\sum_{i=1}^n \\alpha_i y_i x_i';
	const kktGradB =
		'\\frac{\\partial \\, \\mathcal{L}(w, b, \\alpha)}{\\partial b} \\;=\\; - \\sum_{i=1}^n \\alpha_i y_i';
	const kktSubst =
		'\\mathcal{L}(w(\\alpha), b, \\alpha) \\;=\\; \\sum_{i=1}^n \\alpha_i - \\frac{1}{2} \\left\\| \\sum_{i=1}^n \\alpha_i y_i x_i \\right\\|^2 - b \\sum_{i=1}^n \\alpha_i y_i \\;=\\; \\sum_{i=1}^n \\alpha_i - \\frac{1}{2} \\sum_{i=1}^n \\sum_{\\ell=1}^n \\alpha_i \\alpha_\\ell \\, y_i y_\\ell \\, \\langle x_i, x_\\ell \\rangle';
	const kktDualFunc =
		'g(\\alpha) \\;=\\; \\begin{cases} \\displaystyle \\sum_{i=1}^n \\alpha_i - \\frac{1}{2} \\sum_{i=1}^n \\sum_{\\ell=1}^n \\alpha_i \\alpha_\\ell \\, y_i y_\\ell \\, \\langle x_i, x_\\ell \\rangle & \\text{si } \\alpha \\geq 0 \\text{ et } \\sum_{i=1}^n \\alpha_i y_i = 0, \\\\[1.2em] -\\infty & \\text{sinon}. \\end{cases}';
	const kktSparsityW =
		'\\widehat{w} \\;=\\; \\sum_{i=1}^n \\widehat{\\alpha}_i y_i x_i \\;=\\; \\sum_{i \\, : \\, \\widehat{\\alpha}_i > 0} \\widehat{\\alpha}_i y_i x_i';
	const kktSparseClassify =
		'\\operatorname{sign}\\left[ \\sum_{i \\, : \\, \\widehat{\\alpha}_i > 0} \\widehat{\\alpha}_i \\, y_i \\, \\langle x_i, x \\rangle + \\widehat{b} \\right]';
	const kktSpanS = 'S = \\operatorname{span}\\{\\phi(x_1), \\dots, \\phi(x_n)\\}';
	const kktProjection =
		'\\|w\\|^2_{\\mathcal{H}} \\;=\\; \\|P_S w\\|^2_{\\mathcal{H}} + \\|v\\|^2_{\\mathcal{H}} \\;\\geq\\; \\|P_S w\\|^2_{\\mathcal{H}} \\qquad \\text{et} \\qquad \\langle w, \\phi(x_i)\\rangle_{\\mathcal{H}} \\;=\\; \\langle P_S w, \\phi(x_i)\\rangle_{\\mathcal{H}}';
	const kktKernelStation =
		'w = \\sum_{i=1}^n \\alpha_i y_i \\phi(x_i), \\qquad \\langle \\phi(x_i), \\phi(x_\\ell)\\rangle_{\\mathcal{H}} = K(x_i, x_\\ell)';
	const kktSoftLagr =
		'\\mathcal{L}(w, b, \\xi, \\alpha, \\mu) \\;=\\; \\frac{1}{2}\\|w\\|^2 + \\sum_{i=1}^n \\alpha_i \\left(1 - y_i\\left(\\langle w, x_i\\rangle + b\\right)\\right) + \\sum_{i=1}^n \\bigl(C - \\alpha_i - \\mu_i\\bigr)\\, \\xi_i';
	const kktXiBound = '\\min_{\\xi_i \\geq 0} \\, (C - \\alpha_i - \\mu_i)\\, \\xi_i';
	const kktSoftKKT =
		'\\begin{aligned} & y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) - 1 + \\widehat{\\xi}_i \\; \\geq\\; 0 && \\text{(faisabilité primal)} \\\\ & 0 \\; \\leq\\; \\widehat{\\alpha}_i \\; \\leq\\; C, \\qquad \\sum_{i=1}^n \\widehat{\\alpha}_i y_i = 0 && \\text{(faisabilité dual)} \\\\ & \\widehat{\\alpha}_i \\left[ y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) - 1 + \\widehat{\\xi}_i \\right] = 0 && \\text{(écart complémentaire)} \\\\ & \\bigl(C - \\widehat{\\alpha}_i\\bigr)\\, \\widehat{\\xi}_i = 0 && \\text{(écart complémentaire des slacks)} \\end{aligned}';
	const kktEx1Dual =
		'\\max_{\\alpha} \\; \\alpha_1 + \\alpha_2 + \\alpha_3 - \\frac{1}{2}\\left( \\alpha_1^2 + \\alpha_2^2 + \\alpha_3^2 + 2\\alpha_1\\alpha_2 + 4\\alpha_1\\alpha_3 + 4\\alpha_2\\alpha_3 \\right) \\quad \\text{s.c.} \\quad \\alpha \\geq 0, \\; \\alpha_1 - \\alpha_2 + \\alpha_3 = 0';
	const kktEx2Slacks =
		'\\xi_1(b) = \\max\\left(0, \\tfrac{1}{2} - b\\right), \\qquad \\xi_2(b) = \\max\\left(0, \\tfrac{1}{2} + b\\right), \\qquad \\xi_3(b) = \\max\\left(0, \\tfrac{5}{4} - b\\right)';
	const kktEx2Bset = '\\left[\\tfrac{1}{2}, \\tfrac{5}{4}\\right]';

	// SVM à noyau
	const phiMap = '\\phi : \\mathcal{X} \\to \\mathcal{H}';
	const kernelDual =
		'\\begin{aligned} \\widehat{\\alpha} &= \\arg\\max_{\\alpha \\,\\in\\, \\mathbb{R}^n} \\; \\sum_{i=1}^n \\alpha_i - \\dfrac{1}{2} \\sum_{i=1}^n \\sum_{\\ell=1}^n \\alpha_i \\alpha_\\ell \\, y_i \\, y_\\ell \\, \\left\\langle \\phi(x_i), \\phi(x_\\ell)\\right\\rangle \\\\ &\\quad \\text{s.c.} \\quad \\sum_{i=1}^n \\alpha_i y_i = 0 \\;\\; \\text{et} \\;\\; 0 \\leq \\alpha_i \\leq C, \\;\\; \\forall i \\in \\{1, \\dots, n\\} \\end{aligned}';
	const kernelB =
		'\\widehat{b} = y_i - \\sum_{j=1}^n \\widehat{\\alpha}_j y_j \\left\\langle \\phi(x_j), \\phi(x_i)\\right\\rangle \\qquad \\text{pour } i \\in \\{1, \\dots, n\\} \\text{ t.q. } 0 < \\widehat{\\alpha}_i < C';
	const kernelClassifier =
		'f(x) = \\mathrm{sign}\\left[ \\sum_{i=1}^n \\alpha_i y_i \\left\\langle \\phi(x_i), \\phi(x)\\right\\rangle + \\widehat{b} \\right]';
	const phiEx =
		'\\phi : x = (x_1, \\dots, x_d) \\in \\mathbb{R}^d \\;\\longmapsto\\; \\left(1, \\, x_1, \\dots, x_d, \\, x_1 x_1, x_1 x_2, \\dots, x_d x_d\\right) \\in \\mathbb{R}^{1 + d + d^2}';
	const kernelEx =
		'\\begin{aligned} \\left\\langle \\phi(x), \\phi(\\tilde{x})\\right\\rangle &= 1 + \\sum_{i=1}^d x_i \\tilde{x}_i + \\sum_{i=1}^d \\sum_{j=1}^d x_i \\tilde{x}_i x_j \\tilde{x}_j \\\\ &= 1 + \\langle x, \\tilde{x}\\rangle + \\langle x, \\tilde{x}\\rangle^2 = K(x, \\tilde{x}) \\end{aligned}';
	const kernelDef =
		'K : (x, \\tilde{x}) \\in \\mathcal{X} \\times \\mathcal{X} \\;\\longmapsto\\; \\left\\langle \\phi(x), \\phi(\\tilde{x})\\right\\rangle \\in \\mathbb{R}';
	const symmDef =
		'K(x, \\tilde{x}) = K(\\tilde{x}, x), \\;\\; \\forall x, \\tilde{x} \\in \\mathcal{X}';
	const psdDef =
		'\\forall m \\in \\mathbb{N}, \\; \\forall x_1, \\dots, x_m \\in \\mathcal{X}, \\; \\forall a_1, \\dots, a_m \\in \\mathbb{R} \\qquad \\sum_{i=1}^m \\sum_{j=1}^m a_i a_j \\, K(x_i, x_j) \\geq 0';
	const mooreAronszajn =
		'\\forall x, \\tilde{x} \\in \\mathcal{X} \\qquad K(x, \\tilde{x}) = \\left\\langle \\phi(x), \\phi(\\tilde{x})\\right\\rangle';
	const gramMat = 'M_{i, j} = K(x_i, x_j)';
	const kLinear = 'K(x, \\tilde{x}) = \\langle x, \\tilde{x}\\rangle';
	const kCosine =
		'K(x, \\tilde{x}) = \\dfrac{\\langle x, \\tilde{x}\\rangle}{\\|x\\| \\, \\|\\tilde{x}\\|}';
	const kQuad =
		'K(x, \\tilde{x}) = \\left(\\langle x, \\tilde{x}\\rangle + c\\right)^2, \\qquad c \\in \\mathbb{R}_+';
	const kPoly =
		'K(x, \\tilde{x}) = \\left(\\langle x, \\tilde{x}\\rangle + c\\right)^d, \\qquad c \\in \\mathbb{R}_+, \\; d \\in \\mathbb{N}';
	const kGauss =
		'K(x, \\tilde{x}) = \\exp\\left\\{ -\\dfrac{1}{2} (x - \\tilde{x})^\\top \\Sigma^{-1} (x - \\tilde{x}) \\right\\}, \\qquad \\Sigma \\in \\mathbb{R}^{d \\times d} \\text{ s.d.p.}';
	const kGaussIso =
		'K(x, \\tilde{x}) = \\exp\\left\\{ -\\dfrac{\\|x - \\tilde{x}\\|^2}{2 \\sigma^2} \\right\\}, \\qquad \\sigma \\in \\mathbb{R}_+^*';
	const finalDual =
		'\\begin{aligned} \\widehat{\\alpha} &= \\arg\\max_{\\alpha \\,\\in\\, \\mathbb{R}^n} \\; \\sum_{i=1}^n \\alpha_i - \\dfrac{1}{2} \\sum_{i=1}^n \\sum_{\\ell=1}^n \\alpha_i \\alpha_\\ell \\, y_i \\, y_\\ell \\, K(x_i, x_\\ell) \\\\ &\\quad \\text{s.c.} \\quad \\sum_{i=1}^n \\alpha_i y_i = 0 \\;\\; \\text{et} \\;\\; 0 \\leq \\alpha_i \\leq C, \\;\\; \\forall i \\in \\{1, \\dots, n\\} \\end{aligned}';
	const finalB =
		'\\widehat{b} = y_i - \\sum_{j=1}^n \\widehat{\\alpha}_j y_j K(x_j, x_i) \\qquad \\text{pour } i \\in \\{1, \\dots, n\\} \\text{ t.q. } 0 < \\widehat{\\alpha}_i < C';
	const finalClassifier =
		'f(x) = \\mathrm{sign}\\left[ \\sum_{i=1}^n \\widehat{\\alpha}_i y_i \\, K(x_i, x) + \\widehat{b} \\right]';

	// Exercices
	const ex1data = '\\left\\{(1, 0, +1), \\; (-1, 0, -1)\\right\\} \\subset \\mathbb{R}^2';
	const ex1H = 'H : x_1 = 0';
	const ex1dist =
		'd\\left((1, 0), H\\right) = \\dfrac{|1|}{\\|(1, 0)\\|} = 1 \\qquad d\\left((-1, 0), H\\right) = \\dfrac{|{-1}|}{\\|(1, 0)\\|} = 1';
	const ex1primal =
		'\\dfrac{1}{2}\\|w\\|^2 \\geq \\dfrac{1}{2} w_1^2 \\geq \\dfrac{1}{2}\\left(1 + |b|\\right)^2 \\geq \\dfrac{1}{2}';
	const ex1dualObj = '\\alpha_1 + \\alpha_2 - \\dfrac{1}{2}\\left(\\alpha_1 + \\alpha_2\\right)^2';
	const ex1dualW = '\\widehat{w} = \\tfrac{1}{2}(+1)(1, 0) + \\tfrac{1}{2}(-1)(-1, 0) = (1, 0)';
	const ex1dualB = '\\widehat{b} = 1 - \\langle (1, 0), (1, 0)\\rangle = 0';
	const ex3K =
		'K(x, \\tilde{x}) = \\left(\\langle x, \\tilde{x}\\rangle + c\\right)^2, \\qquad c \\in \\mathbb{R}_+';
	const ex3phi =
		'\\phi(x) = \\left(c, \\; \\sqrt{2c}\\, (x_1, \\dots, x_d), \\; (x_i x_j)_{i, j \\in \\{1, \\dots, d\\}}\\right) \\in \\mathbb{R}^{1 + d + d^2}';
	const ex3check =
		'\\begin{aligned} \\left\\langle \\phi(x), \\phi(\\tilde{x})\\right\\rangle &= c^2 + 2c \\, \\langle x, \\tilde{x}\\rangle + \\left(\\sum_{i=1}^d x_i \\tilde{x}_i\\right)\\left(\\sum_{j=1}^d x_j \\tilde{x}_j\\right) \\\\ &= c^2 + 2c \\, \\langle x, \\tilde{x}\\rangle + \\langle x, \\tilde{x}\\rangle^2 = \\left(\\langle x, \\tilde{x}\\rangle + c\\right)^2 \\end{aligned}';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Support Vector Machines (SVM)'}
	subtitle="Marges, vecteurs de support et SVM à noyau"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<p>
			Les <strong>Support Vector Machines</strong> (SVM) constituent le quatrième classifieur
			binaire étudié dans ce cours, après le
			<a href={resolve('/part2/lesson1')}>k-NN</a> (leçon 1), la
			<a href={resolve('/part2/lesson2')}>régression logistique</a> (leçon 2) et les
			<a href={resolve('/part2/lesson3')}>arbres de décision</a> (leçon 3). On se place en
			classification binaire, <KatexInline formula={yBinary} />. Le choix de l'algorithme SVM dépend
			des données : la première étape est de savoir si elles sont linéairement séparables ou non,
			puis, selon le cas, on construit la SVM à marge rigide (données séparables), la SVM à marge
			souple (quelques erreurs tolérées) ou la SVM à noyau (séparation impossible dans l'espace
			d'origine, mais possible après transformation).
		</p>

		<h2 id="donnees-separables">Données séparables ou non ?</h2>

		<p>
			Le choix de l'algorithme SVM utilisé dépend des données. Une première étape est de savoir si
			les données sont <strong>linéairement séparables</strong> ou non :
		</p>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img
					src={asset('/images/part2/separable.png')}
					alt="Deux classes séparées par une droite"
				/>
				<figcaption>Linéairement séparables.</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img
					src={asset('/images/part2/nonseparable1b.png')}
					alt="Deux classes non séparables linéairement, à quelques observations près"
				/>
				<figcaption>Non séparables linéairement, à quelques observations près.</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Tirées de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</p>

		<p>
			À gauche, une droite suffit à séparer les deux classes : les données sont linéairement
			séparables. À droite, aucune droite ne sépare parfaitement les deux classes — mais peut-être
			seulement à quelques observations près (du bruit ?). Chaque cas correspond à un algorithme SVM
			différent, que nous étudions dans l'ordre.
		</p>

		<h2 id="marge-rigide">SVM à marge rigide</h2>

		<p>
			Quand les données sont linéairement séparables, on cherche l'hyperplan de
			<strong>maximale marge</strong>. Commençons par les définitions :
		</p>

		<DefinitionBlock number="4.1" title="Séparabilité linéaire">
			<p>
				Un jeu de données <KatexInline formula={trainData} /> est
				<strong>linéairement séparable</strong> s'il existe au moins un hyperplan dans <KatexInline
					formula={'\\mathbb{R}^d'}
				/> tel que tous les points positifs <KatexInline formula={'y_i = 1'} /> soient d'un côté de cet
				hyperplan et tous les points négatifs <KatexInline formula={'y_i = -1'} />
				de l'autre.
			</p>
		</DefinitionBlock>

		<p>
			Tout hyperplan <KatexInline formula="H" /> de
			<KatexInline formula={'\\mathbb{R}^d'} /> est donné par
			<KatexInline formula={hyperplaneSet} /> avec
			<KatexInline formula={hyperplaneParams} />. Pour tout nouveau point
			<KatexInline formula="x" />, on estime son étiquette par
			<KatexInline formula={signClass} /> ; par convention, on choisit
			<KatexInline formula={'(w, b)'} /> tel que l'angle entre
			<KatexInline formula={'\\vec{w}'} /> et tout point positif soit inférieur à
			<KatexInline formula={'90^\\circ'} /> — les points positifs sont alors du côté où <KatexInline
				formula={'\\langle w, x\\rangle + b > 0'}
			/>.
		</p>

		<p>
			Un hyperplan séparateur ne fait <strong>aucune erreur de classification</strong>
			sur les données d'apprentissage :
			<KatexInline formula={'(w, b)'} /> minimise le risque empirique pour le coût 0/1 (<a
				href={resolve('/part2/lesson1')}>leçon 1</a
			>) — c'est donc un candidat naturel pour <KatexInline
				formula={'(\\widehat{w}, \\widehat{b})'}
			/>.
		</p>

		<Callout type="warning" title="Il existe une infinité d'hyperplans séparateurs">
			<p>
				On cherche donc l'hyperplan dont la distance à l'observation la plus proche est la plus
				grande possible : cette observation sera à
				<strong>équidistance</strong> des observations positive et négative les plus proches.
			</p>
		</Callout>

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/hyperplanbest.png')}
				alt="Hyperplan séparateur équidistant des observations positive et négative les plus proches"
			/>
			<figcaption>
				L'hyperplan équidistant des observations positive et négative les plus proches. Tirée de{' '}
				<a
					href="https://edisciplinas.usp.br/pluginfile.php/5078086/course/section/5978681/chapSVM.pdf"
					target="_blank"
					rel="noopener noreferrer">cet ouvrage</a
				>.
			</figcaption>
		</figure>

		<p>
			Ce choix n'est pas anodin : l'hyperplan équidistant des observations positive et négative les
			plus proches permet de ne pas être sensible à un petit changement dans les données — par
			exemple aux erreurs de mesure.
		</p>

		<DefinitionBlock number="4.2" title="Marge">
			<p>
				La <strong>marge</strong>
				<KatexInline formula={'\\gamma'} /> d'un hyperplan séparateur est la distance de cet hyperplan
				à l'observation du jeu d'apprentissage la plus proche.
			</p>
			<p>
				<strong>Objectif :</strong> chercher l'hyperplan séparateur
				<strong>qui maximise sa marge</strong>
				<KatexInline formula={'\\gamma'} />. Cet hyperplan sera à une distance <KatexInline
					formula={'\\gamma'}
				/>
				d'au moins une observation négative et d'au moins une observation positive.
			</p>
		</DefinitionBlock>

		<DefinitionBlock number="4.3" title="Vecteurs de support">
			<p>
				On appelle <strong>vecteurs de support</strong> les points
				<KatexInline formula={'x_i'} /> du jeu d'apprentissage situés à une distance <KatexInline
					formula={'\\gamma'}
				/> de l'hyperplan séparateur
				<KatexInline formula="H" />. Ils <em>soutiennent</em> les hyperplans
				<KatexInline formula="H_+" /> et <KatexInline formula="H_-" /> situés à une distance <KatexInline
					formula={'\\gamma'}
				/> de
				<KatexInline formula="H" />.
			</p>
		</DefinitionBlock>

		<p>
			Ce qui distingue ces points des autres est une propriété de
			<strong>robustesse</strong> : un déplacement léger d'au moins un des vecteurs de support peut
			modifier l'hyperplan séparateur
			<KatexInline formula="H" /> qui maximise
			<KatexInline formula={'\\gamma'} />, tandis que
			<KatexInline formula="H" /> ne change pas si l'on déplace légèrement une observation qui n'est pas
			vecteur de support. Et même si un vecteur de support est légèrement déplacé et que cela entraîne
			une modification de
			<KatexInline formula="H" />, ce dernier reste un hyperplan séparateur : la méthode est donc
			robuste à de légères perturbations des données d'apprentissage.
		</p>

		<InteractiveSection
			number="4.1"
			title="Marge, vecteurs de support et robustesse"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Déplacez l'hyperplan séparateur
				<KatexInline formula={'w_1 x + w_2 y + b = 0'} /> sur un nuage 2D à deux classes : la marge fonctionnelle
				<KatexInline
					formula={'m_{\\min} = \\min_i y_i\\left(\\langle w, x_i\\rangle + b\\right)'}
				/>, la marge géométrique
				<KatexInline formula={'\\gamma = m_{\\min} / \\|w\\|'} />, la zone d'indécision et les
				points les plus proches s'actualisent en direct. Comparez avec la solution de la SVM à marge
				rigide (duale résolue avec un
				<KatexInline formula="C" /> très grand) : seuls les vecteurs de support déterminent l'hyperplan
				optimal — déplacer l'un d'eux peut le modifier, déplacer une observation non-SV ne le change pas.
			</p>
			<SvmMarginExplorer />
		</InteractiveSection>

		<DefinitionBlock number="4.4" title="Zone d'indécision">
			<p>
				La zone située entre <KatexInline formula="H_+" /> et
				<KatexInline formula="H_-" /> est appelée <strong>zone d'indécision</strong> ; elle ne contient
				aucune observation.
			</p>
			<p>
				Maximiser la marge permet donc de minimiser l'incertitude sur la classe à attribuer à une
				nouvelle observation
				<KatexInline formula="x" /> qui tombe près de l'hyperplan séparateur
				<KatexInline formula="H" />.
			</p>
		</DefinitionBlock>

		<h3>La distance d'un point à un hyperplan</h3>

		<p>
			Comment trouver l'hyperplan séparateur qui maximise la marge ? Il faut d'abord savoir mesurer
			la distance d'un point à un hyperplan :
		</p>

		<TheoremBlock title="Proposition — distance d'un point à un hyperplan">
			<p>
				Soit un hyperplan <KatexInline formula="H" /> d'équation
				<KatexInline formula={'\\langle w, x\\rangle + b = 0'} /> avec
				<KatexInline formula={'(w, b) \\in \\mathbb{R}^d \\times \\mathbb{R}'} />. La distance entre
				un point <KatexInline formula={'x \\in \\mathbb{R}^d'} />
				et <KatexInline formula="H" />, c'est-à-dire la distance entre
				<KatexInline formula="x" /> et son projeté orthogonal sur
				<KatexInline formula="H" />, est donnée par
			</p>
			<KatexBlock formula={distFormula} />
			<p>
				où <KatexInline formula={'\\|\\cdot\\|'} /> désigne la distance euclidienne.
			</p>
		</TheoremBlock>

		<ExpertPanel title="Preuve (non demandée)">
			<p>
				Soit <KatexInline formula={'x \\in \\mathbb{R}^d'} /> et
				<KatexInline formula="p" /> son projeté orthogonal sur l'hyperplan
				<KatexInline formula="H" /> d'équation
				<KatexInline formula={'\\langle w, x\\rangle + b = 0'} />.
			</p>
			<p>
				Puisque <KatexInline formula={'\\overrightarrow{xp}'} /> et
				<KatexInline formula={'\\vec{w}'} /> sont colinéaires, alors
			</p>
			<KatexBlock formula={proofCollinear} />
			<p>
				(voir la partie sur la régression logistique,
				<a href={resolve('/part2/lesson2')}>leçon 2</a>). Ainsi,
			</p>
			<KatexBlock formula={proofNorm} />
		</ExpertPanel>

		<h3>Formulation primale</h3>

		<TheoremBlock title="Proposition — SVM à marge rigide (formulation primale)">
			<p>
				Soit <KatexInline
					formula={'(\\widehat{w}, \\widehat{b}) \\in \\mathbb{R}^d \\times \\mathbb{R}'}
				/>
				des paramètres qui vérifient
			</p>
			<KatexBlock formula={primalOptim2} />
			<p>
				Alors <KatexInline
					formula={'H = \\left\\{x \\in \\mathbb{R}^d, \\; \\langle \\widehat{w}, x\\rangle + \\widehat{b} = 0\\right\\}'}
				/>
				est un hyperplan séparateur qui maximise la marge. En particulier, il existe
				<KatexInline formula={'i, j \\in \\{1, \\dots, n\\}'} /> tels que
				<KatexInline formula={'x_i \\in H_+'} /> avec
				<KatexInline formula={hPlus} /> et <KatexInline formula={'x_j \\in H_-'} />
				avec <KatexInline formula={hMinus} />.
			</p>
		</TheoremBlock>

		<ul>
			<li>
				le problème défini par l'équation ci-dessus est un <strong
					>problème d'optimisation convexe</strong
				> ;
			</li>
			<li>
				il est de plus un <strong>problème d'optimisation quadratique</strong> : de nombreuses solutions
				ont été proposées pour résoudre ce type de problème.
			</li>
		</ul>

		<p>
			Quelle étiquette attribuer à un nouveau point <KatexInline formula="x" /> ? Le
			<strong>classifieur SVM à marge rigide</strong> est
		</p>
		<KatexBlock formula={hardClassifier} />
		<p>
			avec <KatexInline formula={'(\\widehat{w}, \\widehat{b})'} /> la solution de la formulation primale
			ci-dessus.
		</p>

		<Callout type="note" title="Remarque — la contrainte fixe l'échelle de (w, b)">
			<p>
				L'hyperplan <KatexInline formula="H" /> est invariant par multiplication de
				<KatexInline formula={'(w, b)'} /> par un scalaire non nul : le même hyperplan admet <KatexInline
					formula={'(w, b)'}
				/> et
				<KatexInline formula={'(k w, k b)'} /> pour
				<KatexInline formula={'k > 0'} />. C'est la contrainte
				<KatexInline formula={scaleRemark} /> qui fixe cette échelle (et l'orientation de <KatexInline
					formula={'\\vec{w}'}
				/>) — sans elle, le minimum de
				<KatexInline formula={'\\dfrac{1}{2}\\|w\\|^2'} /> serait triviallement
				<KatexInline formula={'(w, b) = (0, 0)'} />.
			</p>
		</Callout>

		<h3>Formulation duale</h3>

		<TheoremBlock title="Proposition — SVM à marge rigide (formulation duale)">
			<p>
				Soit <KatexInline
					formula={'\\widehat{\\alpha} = (\\widehat{\\alpha}_1, \\dots, \\widehat{\\alpha}_n) \\in \\mathbb{R}^n'}
				/>
				qui vérifie
			</p>
			<KatexBlock formula={dualOptim3} />
			<p>Alors le couple <KatexInline formula={'(\\widehat{w}, \\widehat{b})'} /> défini par</p>
			<KatexBlock formula={dualW} />
			<p>et</p>
			<KatexBlock formula={dualB} />
			<p>
				est identique à la solution de la formulation primale ci-dessus. Preuve : section 10.1.3 de
				l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
			</p>
		</TheoremBlock>

		<p>
			Le problème duale est, lui aussi, un <strong
				>problème d'optimisation convexe et quadratique</strong
			>
			; il est appelé <em>problème d'optimisation dual</em> et est obtenu à partir du
			<em>problème d'optimisation primal</em>
			de la manière suivante. Le problème primal
			<KatexInline formula={'(P)'} /> induit par la formulation primale peut se réécrire à l'aide de son
			Lagrangien :
		</p>
		<KatexBlock formula={lagrangianFull} />
		<p>
			Le terme en <KatexInline formula="b" />, égal à
			<KatexInline formula={'-b \\sum_{i=1}^n \\alpha_i y_i'} />, s'annule sous la contrainte <KatexInline
				formula={'\\sum_{i=1}^n \\alpha_i y_i = 0'}
			/> : c'est pourquoi on écrit souvent le Lagrangien réduit
		</p>
		<KatexBlock formula={lagrangianReduced} />
		<p>On a alors</p>
		<KatexBlock formula={primalP} />
		<p>
			et, en inversant le <KatexInline formula={'\\min'} /> et le
			<KatexInline formula={'\\max'} /> dans
			<KatexInline formula={'(P)'} />, on obtient le problème dual
		</p>
		<KatexBlock formula={dualQ} />
		<p>
			De manière générale, n'importe quelles solutions
			<KatexInline formula={'p^*'} /> de <KatexInline formula={'(P)'} /> et
			<KatexInline formula={'q^*'} /> de <KatexInline formula={'(Q)'} /> vérifient toujours <KatexInline
				formula={'q^* \\leq p^*'}
			/> (<em>dualité faible</em>). Mais comme <KatexInline formula={'(P)'} /> est un problème d'optimisation
			convexe avec des contraintes affines, on a
			<KatexInline formula={'p^* = q^*'} /> (<em>condition de Slater</em>) — le saut de dualité <KatexInline
				formula={'p^* - q^*'}
			/> est nul.
		</p>

		<Callout type="insight" title="Interprétation géométrique — conditions de Karush-Kuhn-Tucker">
			<p>
				Les solutions <KatexInline formula={'\\widehat{\\alpha}'} /> et
				<KatexInline formula={'(\\widehat{w}, \\widehat{b})'} /> vérifient les
				<em>conditions d'optimalité de Karush-Kuhn-Tucker</em>, dont la
				<em>condition d'écart complémentaire</em> : pour tout
				<KatexInline formula={'i \\in \\{1, \\dots, n\\}'} />,
			</p>
			<KatexBlock formula={kktHard} />
			<p>Il y a alors deux possibilités :</p>
			<ul>
				<li>
					si <KatexInline formula={'x_i'} /> est <em>à l'extérieur</em> des hyperplans <KatexInline
						formula="H_+"
					/> et
					<KatexInline formula="H_-" />, c'est-à-dire
					<KatexInline formula={kktAbove} />, alors
					<KatexInline formula={'\\widehat{\\alpha}_i = 0'} /> ;
				</li>
				<li>
					si <KatexInline formula={'\\widehat{\\alpha}_i > 0'} /> alors
					<KatexInline formula={kktOn} />, c'est-à-dire
					<KatexInline formula={'x_i \\in H_+'} /> ou
					<KatexInline formula={'x_i \\in H_-'} /> :
					<KatexInline formula={'x_i'} /> est donc un vecteur de support.
				</li>
			</ul>
			<p>
				La formulation duale permet d'identifier des vecteurs de support (pas forcément tous). Ce
				sont seulement ces vecteurs de support qui sont utilisés pour construire le classifieur à
				marge rigide.
			</p>
		</Callout>

		<!-- Panneau expert (mode expert uniquement) : dérivation du dual de la
		     SVM et lecture KKT (vecteurs support, parcimonie, apparition du
		     noyau). Contenu au-delà du cours — voir expert/part2/lesson4/
		     svm-dualite-kkt.md et svm-dualite-kkt.research.md. -->
		<ExpertPanel title="Dualité KKT de la SVM : vecteurs support et parcimonie">
			<p>
				La leçon a énoncé la formulation duale (Proposition) et les conditions KKT qu'elle
				satisfait, en renvoyant la preuve à la référence citée. Ce panneau fait le travail : il
				calcule le <KatexInline formula={'\\min_{(w, b)}'} /> de la lagrangienne, et on voit sortir
				<strong>exactement</strong> la duale de la leçon — avec sa contrainte <KatexInline
					formula={'\\sum_i \\alpha_i y_i = 0'}
				/>
				(marge rigide), puis <KatexInline formula={'0 \\leq \\alpha_i \\leq C'} /> (marge souple) —
				et la condition d'écart complémentaire devient une <strong>boussole</strong> : elle dit
				quels points portent le classifieur (les vecteurs support), d'où la parcimonie de la SVM,
				et pourquoi le noyau entre sans modifier le primal. C'est l'application directe, fil rouge,
				de la dualité convexe de la
				<a href={resolve('/part1/lesson1')}>Partie I, leçon 1</a> (panneau « Conditions KKT et
				dualité lagrangienne »).
			</p>

			<DefinitionBlock number="4.4.bis" title="Fonction duale de la formulation rigide">
				<p>À la lagrangienne de la leçon</p>
				<KatexBlock formula={lagrangianFull} />
				<p>on associe la <strong>fonction duale</strong></p>
				<KatexBlock formula={dualFuncDef} />
				<p>
					c'est-à-dire la meilleure minoration de la valeur optimale <KatexInline
						formula={'p^*'}
					/>
					du primal que produit le vecteur de multiplicateurs <KatexInline formula={'\\alpha'} />
					(dualité faible, Partie I). Le problème dual est alors
				</p>
				<KatexBlock formula={dualMaxG} />
				<p>
					qui est précisément le <KatexInline formula={'(Q)'} /> écrit dans la leçon. La leçon
					s'arrête à l'énoncé : on va maintenant <strong>calculer</strong> <KatexInline
						formula={'g(\\alpha)'}
					/>.
				</p>
			</DefinitionBlock>

			<TheoremBlock title="Dérivation du dual rigide">
				<p>
					Soit <KatexInline formula={'\\alpha \\geq 0'} /> fixé. La lagrangienne est quadratique
					strictement convexe en <KatexInline formula={'w'} /> et affine en <KatexInline
						formula={'b'}
					/>, donc <KatexInline formula={'\\inf_{(w, b)} \\mathcal{L}'} /> est soit
					<KatexInline formula={'-\\infty'} />, soit atteint au point où les dérivées s'annulent.
				</p>
				<p>
					<strong>Stationnarité en <KatexInline formula={'w'} />.</strong>
				</p>
				<KatexBlock formula={kktGradW} />
				<p>
					<strong>Stationnarité en <KatexInline formula={'b'} />.</strong>
				</p>
				<KatexBlock formula={kktGradB} />
				<p>
					La lagrangienne est affine en <KatexInline formula={'b'} /> de pente <KatexInline
						formula={'- \\sum_i \\alpha_i y_i'}
					/>
					: son infimum sur <KatexInline formula={'\\mathbb{R}'} /> est fini <strong
						>si et seulement si</strong>
					<KatexInline formula={'\\sum_{i=1}^n \\alpha_i y_i = 0'} />
					(sinon <KatexInline formula={'g(\\alpha) = -\\infty'} />). C'est la première contrainte
					du dual — elle n'était pas une hypothèse, elle sort du calcul.
				</p>
				<p>
					<strong>Substitution.</strong> En <KatexInline formula={'w = w(\\alpha)'} /> :
				</p>
				<KatexBlock formula={kktSubst} />
				<p>
					le terme en <KatexInline formula={'b'} /> s'annulant sous la contrainte. On a donc
				</p>
				<KatexBlock formula={kktDualFunc} />
				<p>
					Le dual de la leçon (la Proposition « formulation duale » de la section ci-dessus) n'est
					rien d'autre que <KatexInline formula={'\\max_{\\alpha \\geq 0} g(\\alpha)'} />. Comme le
					primal est convexe et que Slater tient (la leçon), la dualité forte donne <KatexInline
						formula={'p^* = q^*'}
					/>, et la solution <KatexInline formula={'\\widehat{\\alpha}'} /> du dual satisfait les
					conditions KKT (Partie I, leçon 1).
				</p>
			</TheoremBlock>

			<TheoremBlock title="Complémentarité : les vecteurs support, et la parcimonie">
				<p>L'écart complémentaire de la leçon,</p>
				<KatexBlock formula={kktHard} />
				<p>découpe le jeu de données en deux :</p>
				<ul>
					<li>
						<KatexInline formula={'\\widehat{\\alpha}_i > 0'} /> implique <KatexInline
							formula={'y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) = 1'}
						/>
						: le point est <strong>sur la marge</strong> (<KatexInline formula={'x_i \\in H_+'} />
						ou <KatexInline formula={'x_i \\in H_-'} />) — c'est la définition du vecteur
						support ;
					</li>
					<li>
						<KatexInline formula={'\\widehat{\\alpha}_i = 0'} /> n'impose rien : le point est en
						général <strong>à l'extérieur</strong> de la marge (<KatexInline
							formula={'y_i\\left(\\langle \\widehat{w}, x_i\\rangle + \\widehat{b}\\right) > 1'}
						/>).
					</li>
				</ul>
				<p>
					Et <KatexInline formula={'w'} /> ne dépend que des vecteurs support :
				</p>
				<KatexBlock formula={kktSparsityW} />
				<p>
					<strong>Proposition — retirer un point non vecteur support ne change pas la
					solution.</strong> Soit <KatexInline formula={'x_k'} /> avec <KatexInline
						formula={'\\widehat{\\alpha}_k = 0'}
					/>, et le même problème rigide résolu sur les <KatexInline formula={'n - 1'} /> points
					restants. Alors la valeur optimale est inchangée, <KatexInline formula={'\\widehat{w}'} />
					aussi, et <KatexInline formula={'\\widehat{b}'} /> aussi dès qu'il était unique (le cas
					général : un <KatexInline formula={'\\widehat{\\alpha}_i'} /> intérieur) ; le vecteur
					<KatexInline formula={'\\widehat{\\alpha}'} />, restreint, reste dual optimal.
				</p>
				<div class="proof-block">
					<p>
						<strong>Idée de la démonstration :</strong> notons <KatexInline formula={'p^*'} /> et
						<KatexInline formula={'q^*'} /> les valeurs optimales du primal/dual complets, et
						<KatexInline formula={'p^*_{\\mathrm{red}}'} /> et <KatexInline
							formula={'q^*_{\\mathrm{red}}'}
						/>
						celles du problème réduit.
					</p>
					<p>
						<strong>(i)</strong> <KatexInline formula={'(\\widehat{w}, \\widehat{b})'} /> satisfait
						les contraintes du primal réduit (c'étaient des contraintes du primal complet) :
						<KatexInline
							formula={'p^*_{\\mathrm{red}} \\leq \\tfrac{1}{2}\\|\\widehat{w}\\|^2 = p^*'}
						/>
						.
					</p>
					<p>
						<strong>(ii)</strong> le vecteur <KatexInline formula={'\\widehat{\\alpha}'} /> (avec
						<KatexInline formula={'\\widehat{\\alpha}_k = 0'} />) est dual admissible pour le
						problème réduit (<KatexInline formula={'0 \\leq \\alpha_i'} /> et <KatexInline
							formula={'\\sum_i \\alpha_i y_i = 0'}
						/>
						toujours satisfaites), et y atteint la même valeur <KatexInline formula={'q^*'} /> —
						les termes en <KatexInline formula={'\\widehat{\\alpha}_k'} /> de l'objectif valant
						<KatexInline formula={'0'} /> : <KatexInline formula={'q^*_{\\mathrm{red}} \\geq q^*'}
						/>
						. Réciproquement, le dual réduit est le dual complet où l'on impose <KatexInline
							formula={'\\alpha_k = 0'}
						/>
						(un sous-problème) : <KatexInline formula={'q^*_{\\mathrm{red}} \\leq q^*'} />. Donc
						<KatexInline formula={'q^*_{\\mathrm{red}} = q^*'} />.
					</p>
					<p>
						<strong>(iii)</strong> les contraintes du problème réduit sont affines en
						<KatexInline formula={'(w, b)'} /> et il est réalisable (<KatexInline
							formula={'(\\widehat{w}, \\widehat{b})'}
						/>, cf. (i)) : Slater tient (variante B&amp;V pour contraintes affines, eq. 5.27,
						déjà citée dans le panneau « Conditions KKT et dualité lagrangienne » de la Partie I,
						leçon 1), donc <KatexInline formula={'p^*_{\\mathrm{red}} = q^*_{\\mathrm{red}}'} />.
					</p>
					<p>
						D'où <KatexInline
							formula={'p^*_{\\mathrm{red}} = q^*_{\\mathrm{red}} = q^* = p^*'}
						/>
						, <KatexInline formula={'(\\widehat{w}, \\widehat{b})'} /> reste primal optimal pour le
						problème réduit, et <KatexInline formula={'\\widehat{\\alpha}'} /> restreint reste dual
						optimal ; la stationnarité lui associe le même <KatexInline
							formula={'\\widehat{w} = \\sum_{i \\neq k} \\widehat{\\alpha}_i y_i x_i'}
						/>, unique (convexité stricte de <KatexInline formula={'\\tfrac{1}{2}\\|w\\|^2'} />),
						et le même <KatexInline formula={'\\widehat{b}'} /> quand il était unique. (Même
						argument que Hastie, Tibshirani &amp; Friedman, ESL 2e éd., §12.2.2 : « leaving out an
						observation that is not a support vector will not change the solution ».)
					</p>
					<p>
						<strong>Point d'attention :</strong> en l'absence de point intérieur (<KatexInline
							formula={'0 < \\widehat{\\alpha}_i < C'}
						/>, <KatexInline formula={'\\widehat{b}'} /> n'est pas unique (cf. exemple 2
						ci-dessous) : retirer <KatexInline formula={'x_k'} /> retire une borne de KKT sur
						<KatexInline formula={'b'} />
						, l'ensemble des <KatexInline formula={'b'} /> optimales ne peut que s'élargir, et
						<KatexInline formula={'\\widehat{w}'} /> — lui — reste le même. ∎
					</p>
				</div>
			</TheoremBlock>

			<Callout type="intuition" title="La parcimonie de la SVM">
				<p>Prédire avec la SVM, c'est évaluer</p>
				<KatexBlock formula={kktSparseClassify} />
				<p>
					seule la <strong>liste des vecteurs support</strong> (et leurs <KatexInline
						formula={'\\widehat{\\alpha}_i'}
					/>) est nécessaire — les autres points n'interviennent ni dans <KatexInline
						formula={'\\widehat{w}'}
					/>
					ni dans le classifieur. Deux conséquences :
				</p>
				<ul>
					<li>
						le nombre de vecteurs support — typiquement bien inférieur à <KatexInline
							formula={'n'}
						/>
						— contrôle le coût de la prédiction, et non la taille du jeu d'entraînement ;
					</li>
					<li>
						l'écart complémentaire garantit les vecteurs support <strong>avec</strong>
						<KatexInline formula={'\\widehat{\\alpha}_i > 0'} />, pas l'inverse : un point peut
						être sur la marge avec <KatexInline formula={'\\widehat{\\alpha}_i = 0'} /> — c'est le
						« pas forcément tous » de la leçon, qu'on va voir en action dans l'exemple 2
						ci-dessous.
					</li>
				</ul>
			</Callout>

			<TheoremBlock title="L'apparition du noyau — le primal reste inchangé">
				<p>
					La leçon écrit le dual noyau (produits scalaires <KatexInline
						formula={'\\langle \\phi(x_i), \\phi(x_\\ell)\\rangle'}
					/>) et note l'astuce : <KatexInline formula={'\\phi'} /> n'intervient que via ces produits
					scalaires. Pourquoi, alors, le <strong>primal</strong> dans l'espace de redescription
					<KatexInline formula={'\\mathcal{H}'} /> a-t-il les mêmes solutions ? Argument de
					projection (le cas fini-dimensionnel est l'instance <KatexInline
						formula={'\\mathcal{H} = \\mathbb{R}^d'}
					/>
					) :
				</p>
				<p>
					Soit <KatexInline formula={kktSpanS} /> et <KatexInline formula={'P_S'} /> la projection
					orthogonale de <KatexInline formula={'\\mathcal{H}'} /> sur <KatexInline formula={'S'} />.
					Tout <KatexInline formula={'w \\in \\mathcal{H}'} /> se décompose <KatexInline
						formula={'w = P_S w + v'}
					/>
					avec <KatexInline formula={'v \\in S^\\perp'} /> :
				</p>
				<KatexBlock formula={kktProjection} />
				<p>
					(les deux dernières relations car <KatexInline formula={'\\phi(x_i) \\in S'} /> et
					<KatexInline formula={'v \\perp S'} />). Le projeté <KatexInline formula={'P_S w'} />
					satisfait donc <strong>les mêmes contraintes</strong> que <KatexInline formula={'w'} />
					avec une norme <strong>au plus aussi grande</strong> : la valeur optimale du primal dans
					<KatexInline formula={'\\mathcal{H}'} /> vaut celle du problème restreint à <KatexInline
						formula={'S'}
					/>. Plus : si <KatexInline formula={'w'} /> est optimal et <KatexInline
						formula={'v \\neq 0'}
					/>, alors <KatexInline formula={'P_S w'} /> est strictement meilleur — contradiction.
					<strong>Tout</strong> <KatexInline formula={'w'} /> optimal appartient à <KatexInline
						formula={'S'}
					/>.
				</p>
				<p>
					Sur <KatexInline formula={'S'} />, la stationnarité du dual (calculée dans le bloc
					précédent) écrit
				</p>
				<KatexBlock formula={kktKernelStation} />
				<p>
					et le dual ne contient plus que ces produits scalaires : c'est exactement le dual noyau de
					la leçon. Le primal reste inchangé, et toute la machine — dual, <KatexInline
						formula={'\\widehat{w}'}
					/>, <KatexInline formula={'\\widehat{b}'} />, classifieur — ne demande que les valeurs de
					<KatexInline formula={'K'} /> sur le nuage : d'où l'apparition du noyau. (L'existence de
					<KatexInline formula={'\\mathcal{H}'} /> et de <KatexInline formula={'\\phi'} /> associées
					à <KatexInline formula={'K'} /> est le Théorème Moore–Aronszajn de la leçon ; « the
					solution must be in the linear span of the examples, a fact we will use later to derive
					SVM with kernels », Shalev-Shwartz &amp; Ben-David, ch. 15 §15.4.)
				</p>
			</TheoremBlock>

			<TheoremBlock title="Marge souple — d'où vient 0 ≤ αᵢ ≤ C, les trois régimes">
				<p>
					La section « SVM à marge souple » de la leçon donne le primal (les variables
					d'ajustement <KatexInline formula={'\\xi_i'} />) et énonce le dual avec la contrainte
					<KatexInline formula={'0 \\leq \\alpha_i \\leq C'} /> : voici d'où elle sort.
					Multiplicateurs <KatexInline formula={'\\alpha_i \\geq 0'} /> pour <KatexInline
						formula={'1 - \\xi_i - y_i\\left(\\langle w, x_i\\rangle + b\\right) \\leq 0'}
					/>
					et <KatexInline formula={'\\mu_i \\geq 0'} /> pour <KatexInline formula={'- \\xi_i \\leq 0'}
					/>
					:
				</p>
				<KatexBlock formula={kktSoftLagr} />
				<ul>
					<li>
						<strong>Minimisation en <KatexInline formula={'\\xi_i \\geq 0'} /></strong> :
						<KatexInline formula={kktXiBound} /> est fini (vaut <KatexInline formula={'0'} />, en
						<KatexInline formula={'\\xi_i = 0'} />) <strong>ssi</strong> <KatexInline
							formula={'C - \\alpha_i - \\mu_i \\geq 0'}
						/>. L'objectif du dual ne dépendant pas de <KatexInline formula={'\\mu'} />, on pose
						<KatexInline formula={'\\mu_i = C - \\alpha_i'} />, ce qui donne exactement la
						<strong>contrainte en boîte</strong> <KatexInline
							formula={'0 \\leq \\alpha_i \\leq C'}
						/>
						du dual de la leçon.
					</li>
					<li>
						<strong>Minimisation en <KatexInline formula={'w'} /> et <KatexInline formula={'b'}
						/></strong>
						: comme pour la marge rigide — <KatexInline
							formula={'w = \\sum_i \\alpha_i y_i x_i'}
						/>
						et la contrainte <KatexInline formula={'\\sum_i \\alpha_i y_i = 0'} />.
					</li>
				</ul>
				<p>Les conditions KKT complètes (la leçon n'en énonce que la troisième) :</p>
				<KatexBlock formula={kktSoftKKT} />
				<p>
					Notons <KatexInline formula={mDef} /> la marge fonctionnelle. Les trois régimes, et leur
					<strong>preuve</strong> :
				</p>
				<ol>
					<li>
						<strong><KatexInline formula={'m_i > 1'} /> (extérieur de la marge)</strong> :
						l'objectif primal étant croissant en <KatexInline formula={'\\xi_i'} /> (coefficient
						<KatexInline formula={'C > 0'} />), le slack optimal vaut <KatexInline
							formula={'\\widehat{\\xi}_i = \\max(0, 1 - m_i) = 0'}
						/>
						; l'écart complémentaire <KatexInline
							formula={'\\widehat{\\alpha}_i (m_i - 1) = 0'}
						/>
						avec <KatexInline formula={'m_i - 1 > 0'} /> donne alors <strong
							><KatexInline formula={'\\widehat{\\alpha}_i = 0'} /></strong>
						— la leçon l'énonce, on vient de le dériver.
					</li>
					<li>
						<strong><KatexInline formula={'m_i = 1'} /> (sur la marge)</strong> : <KatexInline
							formula={'\\widehat{\\xi}_i = 0'}
						/>
						et <KatexInline formula={'\\widehat{\\alpha}_i \\in [0, C]'} /> — libre ; les points
						<KatexInline formula={'0 < \\widehat{\\alpha}_i < C'} /> (intérieurs) sont ceux qui
						servent à la formule de <KatexInline formula={'\\widehat{b}'} /> de la leçon.
					</li>
					<li>
						<strong><KatexInline formula={'m_i < 1'} /> (dans la marge, y compris mal classé si
						<KatexInline formula={'m_i < 0'} />)</strong> : <KatexInline
							formula={'\\widehat{\\xi}_i = 1 - m_i > 0'}
						/>, et la quatrième condition <KatexInline
							formula={'(C - \\widehat{\\alpha}_i)\\,\\widehat{\\xi}_i = 0'}
						/>
						donne <strong><KatexInline formula={'\\widehat{\\alpha}_i = C'} /></strong> — Hastie,
						Tibshirani &amp; Friedman, ESL 2e éd., (12.12)+(12.15).
					</li>
				</ol>
				<p>
					Deux nuances : la réciproque du point 3 est fausse — <KatexInline
						formula={'\\widehat{\\alpha}_i = C'}
					/>
					n'empêche pas <KatexInline formula={'\\widehat{\\xi}_i = 0'} /> ; et le point 2 ne force
					pas <KatexInline formula={'\\widehat{\\alpha}_i > 0'} /> — un point peut être
					<strong>sur</strong> la marge avec <KatexInline formula={'\\widehat{\\alpha}_i = 0'} />
					(le « pas forcément tous » de la leçon).
				</p>
			</TheoremBlock>

			<ExampleBlock title="Exemple — trois points, marge rigide">
				<p>
					Reprenons l'Exercice 1 de la leçon, <KatexInline formula={'x_1 = (1, 0)'} /> avec
					<KatexInline formula={'y_1 = +1'} />, et <KatexInline formula={'x_2 = (-1, 0)'} /> avec
					<KatexInline formula={'y_2 = -1'} />, et ajoutons <KatexInline formula={'x_3 = (2, 0)'} />
					avec <KatexInline formula={'y_3 = +1'} /> — bien classé, loin de la marge. Le dual est
				</p>
				<KatexBlock formula={kktEx1Dual} />
				<p>
					matrice <KatexInline formula={'\\langle x_i, x_\\ell\\rangle'} /> : <KatexInline
						formula={'x_1 \\cdot x_2 = -1'}
					/>, <KatexInline formula={'x_1 \\cdot x_3 = 2'} />, <KatexInline
						formula={'x_2 \\cdot x_3 = -2'}
					/>. La solution est <KatexInline
						formula={'\\widehat{\\alpha} = (\\tfrac{1}{2}, \\tfrac{1}{2}, 0)'}
					/>
					:
				</p>
				<ul>
					<li>
						<KatexInline
							formula={'\\widehat{w} = \\tfrac{1}{2}(1, 0) + \\tfrac{1}{2}(-1)(-1, 0) = (1, 0)'}
						/>, <KatexInline
							formula={'\\widehat{b} = 1 - \\langle (1, 0), (1, 0)\\rangle = 0'}
						/>
						;
					</li>
					<li>
						marges fonctionnelles <KatexInline formula={'m = (1, 1, 2)'} /> : <KatexInline
							formula={'x_1'}
						/>, <KatexInline formula={'x_2'} /> sur la marge (<KatexInline
							formula={'\\widehat{\\alpha}_1 = \\widehat{\\alpha}_2 = \\tfrac{1}{2} > 0'}
						/>, <KatexInline formula={'x_3'} /> à l'extérieur (<KatexInline formula={'m_3 = 2 > 1'}
						/>, <KatexInline formula={'\\widehat{\\alpha}_3 = 0'} />) — la complémentarité
						<KatexInline formula={'\\widehat{\\alpha}_i (m_i - 1) = 0'} /> est vérifiée point par
						point : <KatexInline formula={'(0, 0, 0)'} /> ;
					</li>
					<li>
						<KatexInline
							formula={'p^* = q^* = \\tfrac{1}{2}\\|\\widehat{w}\\|^2 = \\tfrac{1}{2}'}
						/>
						: dualité forte, écart nul.
					</li>
				</ul>
				<p>
					<KatexInline formula={'x_3'} /> n'est pas vecteur support : selon le bloc précédent,
					retirer <KatexInline formula={'x_3'} /> reproduit exactement l'Exercice 1 — même
					<KatexInline formula={'(\\widehat{w}, \\widehat{b})'} />, mêmes <KatexInline
						formula={'\\widehat{\\alpha}_1 = \\widehat{\\alpha}_2 = \\tfrac{1}{2}'}
					/>. Le troisième point n'a <strong>aucun</strong> effet sur le classifieur.
				</p>
			</ExampleBlock>

			<ExampleBlock title="Exemple — trois points, marge souple, C = 1">
				<p>
					Mêmes deux premiers points, mais <KatexInline
						formula={'x_3 = (-\\tfrac{1}{2}, 0)'}
					/>
					avec <KatexInline formula={'y_3 = +1'} /> : cette fois <KatexInline formula={'x_3'} /> est
					<strong>dans la marge</strong> (même côté que <KatexInline formula={'x_1'} />). La solution
					du dual (contraintes <KatexInline formula={'0 \\leq \\alpha_i \\leq 1'} />, <KatexInline
						formula={'\\alpha_1 - \\alpha_2 + \\alpha_3 = 0'}
					/>) est <KatexInline formula={'\\widehat{\\alpha} = (0, 1, 1)'} /> :
				</p>
				<ul>
					<li>
						<KatexInline
							formula={'\\widehat{w} = (-1)(-1, 0) + (1)(-\\tfrac{1}{2}, 0) = (\\tfrac{1}{2}, 0)'}
						/>
						; avec le choix <KatexInline formula={'\\widehat{b} = \\tfrac{1}{2}'} />, marges
						fonctionnelles <KatexInline formula={'m = (1, 0, \\tfrac{1}{4})'} /> et slacks
						<KatexInline formula={'\\widehat{\\xi} = (0, 1, \\tfrac{3}{4})'} /> ;
					</li>
					<li>
						objectif primal <KatexInline
							formula={'\\tfrac{1}{2}\\|\\widehat{w}\\|^2 + C(\\widehat{\\xi}_1 + \\widehat{\\xi}_2 + \\widehat{\\xi}_3) = \\tfrac{1}{8} + \\tfrac{7}{4} = \\tfrac{15}{8}'}
						/>
						; objectif dual <KatexInline formula={'\\tfrac{15}{8}'} /> : <strong
							>dualité forte, écart nul</strong>
						;
					</li>
					<li>
						les quatre conditions KKT sont vérifiées point par point (en particulier <KatexInline
							formula={'(C - \\widehat{\\alpha}_i)\\,\\widehat{\\xi}_i = (1, 0, 0) \\cdot (0, 1, \\tfrac{3}{4}) = 0'}
						/>).
					</li>
				</ul>
				<p>Les trois régimes du bloc précédent, <strong>en un seul exemple</strong> :</p>
				<table>
					<thead>
						<tr>
							<th>Point</th>
							<th>m_i</th>
							<th>ξ_i</th>
							<th>α_i</th>
							<th>Régime</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><KatexInline formula={'x_1 = (1, 0)'} /></td>
							<td><KatexInline formula={'1'} /></td>
							<td><KatexInline formula={'0'} /></td>
							<td><KatexInline formula={'0'} /></td>
							<td>
								<strong
									>sur la marge, mais <KatexInline formula={'\\widehat{\\alpha}_1 = 0'} /></strong
								>
								— le « pas forcément tous »
							</td>
						</tr>
						<tr>
							<td><KatexInline formula={'x_2 = (-1, 0)'} /></td>
							<td><KatexInline formula={'0'} /></td>
							<td><KatexInline formula={'1'} /></td>
							<td><KatexInline formula={'C = 1'} /></td>
							<td>
								mal classé (outlier), <KatexInline formula={'\\widehat{\\alpha}_2 = C'} />
							</td>
						</tr>
						<tr>
							<td><KatexInline formula={'x_3 = (-\\tfrac{1}{2}, 0)'} /></td>
							<td><KatexInline formula={'\\tfrac{1}{4}'} /></td>
							<td><KatexInline formula={'\\tfrac{3}{4}'} /></td>
							<td><KatexInline formula={'C = 1'} /></td>
							<td>
								dans la marge, bien classé, <KatexInline formula={'\\widehat{\\alpha}_3 = C'} />
							</td>
						</tr>
					</tbody>
				</table>
				<p>
					Aucun <KatexInline formula={'\\widehat{\\alpha}_i'} /> n'est ici intérieur (<KatexInline
						formula={'0 < \\widehat{\\alpha}_i < C'}
					/>) : <KatexInline formula={'\\widehat{b}'} /> n'est <strong>pas unique</strong>. Pour le
					voir, fixons <KatexInline formula={'\\widehat{w} = (\\tfrac{1}{2}, 0)'} /> et faisons
					varier <KatexInline formula={'b'} /> : les slacks optimaux sont
				</p>
				<KatexBlock formula={kktEx2Slacks} />
				<p>
					et pour tout <KatexInline formula={'b \\in ' + kktEx2Bset} /> l'objectif primal vaut
					<KatexInline formula={'\\tfrac{1}{8} + \\tfrac{7}{4} = \\tfrac{15}{8}'} /> (les termes en
					<KatexInline formula={'b'} /> se compensent), tandis qu'il est strictement plus grand pour
					<KatexInline formula={'b < \\tfrac{1}{2}'} /> ou <KatexInline formula={'b > \\tfrac{5}{4}'}
					/>
					: l'ensemble des <KatexInline formula={'b'} /> optimales est exactement <KatexInline
						formula={kktEx2Bset}
					/>. C'est la remarque de la leçon (« il est possible de prendre une valeur au hasard dans
					un certain intervalle pour <KatexInline formula={'\\widehat{b}'} /> »), rendue concrète ;
					le choix <KatexInline formula={'\\widehat{b} = \\tfrac{1}{2}'} /> ci-dessus est la borne
					inférieure de cet intervalle.
				</p>
			</ExampleBlock>

			<Callout type="summary" title="Le pont Partie I → Partie II">
				<p>
					Rien de nouveau sous le soleil : le panneau « Conditions KKT et dualité lagrangienne » de
					la
					<a href={resolve('/part1/lesson1')}>Partie I, leçon 1</a> (lagrangienne, fonction duale,
					dualité faible, Slater, dualité forte, conditions KKT) s'applique mot pour mot au QP de la
					SVM, et fait tout le travail :
				</p>
				<ol>
					<li>
						la <strong>contrainte</strong> <KatexInline formula={'\\sum_i \\alpha_i y_i = 0'} /> du
						dual (et la boîte <KatexInline formula={'0 \\leq \\alpha_i \\leq C'} /> en souple) sont
						les <strong>conditions de finitude</strong> de <KatexInline
							formula={'\\min_{(w, b, \\xi)} \\mathcal{L}'}
						/>
						— elles ne se posent pas, elles s'obtiennent ;
					</li>
					<li>
						la <strong>complémentarité</strong> sélectionne les vecteurs support (<KatexInline
							formula={'\\alpha_i > 0'}
						/>, et <KatexInline formula={'w'} /> ne vit que sur eux : la <strong>parcimonie</strong>
						est un théorème, pas une propriété empirique ;
					</li>
					<li>
						le <strong>noyau</strong> entre parce que toute solution vit dans le span des
						observations — le primal, lui, ne change pas.
					</li>
				</ol>
				<p>
					Plus loin dans le cours, cette même marge maximale paie en généralisation : la borne VC de
					la SVM dépend du rapport marge/rayon des données, et <strong>non</strong> de la dimension
					ambiante — <a href={resolve('/part9/lesson3')}>Théorème 3.4 (Partie IX, leçon 3)</a>.
				</p>
			</Callout>

			<p>
				<strong>Explorer :</strong> faites glisser <KatexInline formula={'C'} /> — les barres des
				<KatexInline formula={'\\widehat{\\alpha}_i'} /> se placent sur <KatexInline formula={'0'} />
				ou sur <KatexInline formula={'C'} />, les régimes des points changent, et les résidus KKT
				restent ≈ 0 ; retirez des points de <KatexInline formula={'\\widehat{\\alpha}_i = 0'} /> et
				vérifiez que la frontière ne bouge pas.
			</p>
			<DeferredDemo load={() => import('$lib/components/demos/SvmAlphaKktExplorer.svelte')} />
		</ExpertPanel>

		<Callout type="note" title="Complexité algorithmique">
			<p>
				La formulation primale est un problème d'optimisation en
				<KatexInline formula={'d + 1'} /> dimensions, tandis que la formulation duale est un problème
				en <KatexInline formula="n" /> dimensions. Avec peu de données et beaucoup de variables explicatives,
				on préférera la formulation duale ; dans le cas inverse, on préférera résoudre le problème primal.
			</p>
		</Callout>

		<ExercisePanel title="Exercice 1 — une SVM à deux points, à la main">
			<p>
				Considérons le jeu de données à deux points
				<KatexInline formula={ex1data} /> (les deux premières composantes sont les coordonnées, la troisième
				l'étiquette).
			</p>
			<ol>
				<li>
					Vérifier que <KatexInline formula={ex1H} /> est un hyperplan séparateur ; donner sa marge.
				</li>
				<li>
					Montrer que la solution du problème primal est
					<KatexInline formula={'(\\widehat{w}, \\widehat{b}) = ((1, 0), 0)'} />
					et que la marge vaut <KatexInline formula={'\\gamma = 1'} />. Le couple opposé <KatexInline
						formula={'(-(1, 0), 0)'}
					/> définit le même hyperplan : en est-il aussi une solution du primal ?
				</li>
				<li>
					Résoudre le problème dual : montrer que
					<KatexInline formula={'\\widehat{\\alpha} = (1/2, 1/2)'} /> satisfait les contraintes et qu'il
					donne bien
					<KatexInline formula={'\\widehat{w}'} /> et
					<KatexInline formula={'\\widehat{b}'} />.
				</li>
			</ol>
			<p>
				<em>Exercice d'entraînement.</em>
			</p>
			{#snippet solution()}
				<p>
					<strong>(a)</strong> L'hyperplan <KatexInline formula={ex1H} /> est l'hyperplan d'équation <KatexInline
						formula={'\\langle (1, 0), x\\rangle = 0'}
					/> : le point positif <KatexInline formula={'(1, 0)'} /> a pour projection
					<KatexInline formula={'1 > 0'} />, le point négatif
					<KatexInline formula={'(-1, 0)'} /> a pour projection
					<KatexInline formula={'-1 < 0'} /> — les deux points sont de part et d'autre de <KatexInline
						formula="H"
					/>, qui est donc séparateur. Sa marge est la distance à l'observation la plus proche :
				</p>
				<KatexBlock formula={ex1dist} />
				<p>
					donc <KatexInline formula={'\\gamma = 1'} />.
				</p>
				<p>
					<strong>(b)</strong> Les contraintes du primal sont
					<KatexInline formula={'w_1 + b \\geq 1'} /> (pour
					<KatexInline formula={'x_1 = (1, 0), y_1 = +1'} />) et
					<KatexInline formula={'w_1 - b \\geq 1'} /> (pour
					<KatexInline formula={'x_2 = (-1, 0), y_2 = -1'} />), soit
					<KatexInline formula={'w_1 \\geq 1 + |b|'} />. L'objectif est majoré en dessous par
				</p>
				<KatexBlock formula={ex1primal} />
				<p>
					avec égalité seulement si <KatexInline formula={'b = 0'} />,
					<KatexInline formula={'w_1 = 1'} /> et <KatexInline formula={'w_2 = 0'} /> : la solution est
					donc unique,
					<KatexInline formula={'(\\widehat{w}, \\widehat{b}) = ((1, 0), 0)'} />, et <KatexInline
						formula={'\\gamma = 1 / \\|\\widehat{w}\\| = 1'}
					/>. Le couple opposé <KatexInline formula={'(-(1, 0), 0)'} /> définit bien le même hyperplan
					<KatexInline formula={'x_1 = 0'} />, mais il ne vérifie pas la contrainte
					<KatexInline formula={'y_1\\left(\\langle w, x_1\\rangle + b\\right) = -1 \\geq 1'} /> : il
					n'en est donc pas une solution. C'est la contrainte
					<KatexInline formula={scaleRemark} /> qui fixe l'orientation (et l'échelle) de <KatexInline
						formula={'(w, b)'}
					/>.
				</p>
				<p>
					<strong>(c)</strong> Ici
					<KatexInline formula={'\\langle x_1, x_1\\rangle = \\langle x_2, x_2\\rangle = 1'} />,
					<KatexInline formula={'\\langle x_1, x_2\\rangle = -1'} /> et
					<KatexInline formula={'y_1 y_2 = -1'} />, donc la double somme du dual vaut <KatexInline
						formula={'\\alpha_1^2 + 2\\alpha_1\\alpha_2 + \\alpha_2^2 = (\\alpha_1 + \\alpha_2)^2'}
					/>, et le problème dual s'écrit : maximiser
				</p>
				<KatexBlock formula={ex1dualObj} />
				<p>
					sous les contraintes <KatexInline formula={'\\alpha_1 - \\alpha_2 = 0'} />
					et <KatexInline formula={'\\alpha_i \\geq 0'} />. Le candidat
					<KatexInline formula={'\\widehat{\\alpha} = (1/2, 1/2)'} /> est admissible : <KatexInline
						formula={'\\widehat{\\alpha}_1 - \\widehat{\\alpha}_2 = 0'}
					/>
					et <KatexInline formula={'\\widehat{\\alpha}_i \\geq 0'} />. Il donne
				</p>
				<KatexBlock formula={ex1dualW} />
				<p>et</p>
				<KatexBlock formula={ex1dualB} />
				<p>
					ce qui retrouve exactement la solution du primal. (C'est bien le maximum : en posant <KatexInline
						formula={'\\alpha_1 = \\alpha_2 = \\alpha'}
					/>, l'objectif <KatexInline formula={'2\\alpha - 2\\alpha^2'} 					/> est maximisé en <KatexInline
						formula={'\\alpha = 1/2'}
					/>.)
				</p>
			{/snippet}
		</ExercisePanel>

		<h2 id="marge-souple">SVM à marge souple</h2>

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/nonseparable1.png')}
				alt="Deux classes non séparables linéairement"
			/>
			<figcaption>
				Données non séparables linéairement. Tirée de l'ouvrage
				<em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
			</figcaption>
		</figure>

		<Callout
			type="warning"
			title="Données non séparables linéairement, mais seulement à quelques observations près (bruit ?)"
		>
			<p>
				Si les données ne sont pas linéairement séparables, les problèmes de maximisation précédents
				n'ont pas de solution (les contraintes sont contradictoires). On va quand même séparer
				linéairement les données en maximisant la marge, mais en <strong
					>autorisant maintenant quelques erreurs de classification</strong
				>.
			</p>
		</Callout>

		<h3>La variable d'ajustement ξ_i</h3>

		<p>
			La contrainte de séparabilité des SVM à marge rigide exige que tous les points du jeu
			d'entraînement soient bien classés :
		</p>
		<KatexBlock formula={constraintRigide} />
		<p>
			On <strong>relâche</strong> cette contrainte pour la SVM à marge souple : un point du jeu d'entraînement
			peut maintenant se trouver dans la zone d'indécision :
		</p>
		<KatexBlock formula={constraintSouple} />
		<p>
			où <KatexInline formula={'\\xi_i \\geq 0'} />, appelée <em>variable d'ajustement</em> (<em
				>slack variable</em
			>
			en anglais), mesure à quel point la contrainte de séparation a été enfreinte, c'est-à-dire à quel
			point
			<KatexInline formula={'(x_i, y_i)'} /> échoue à être bien séparé. Trois cas :
		</p>

		<DefinitionBlock number="4.5" title="Variable d'ajustement — les trois cas">
			<ul>
				<li>
					<KatexInline formula={caseXi0} /> :
					<KatexInline formula={'(x_i, y_i)'} /> est bien classé et est en dehors de la zone d'indécision
					;
				</li>
				<li>
					<KatexInline formula={caseXi1} /> :
					<KatexInline formula={'(x_i, y_i)'} /> est bien classé mais est dans la zone d'indécision ;
				</li>
				<li>
					<KatexInline formula={caseXi2} /> :
					<KatexInline formula={'(x_i, y_i)'} /> est mal classé (et peut être dans la zone d'indécision
					ou non).
				</li>
			</ul>
		</DefinitionBlock>

		<h3>Le compromis entre marge et outliers</h3>

		<p>Deux objectifs, en tension :</p>
		<ul>
			<li>
				on souhaite minimiser le nombre d'<em>outliers</em>, c'est-à-dire des observations qui sont
				dans la zone d'indécision ou qui sont mal classées, pour faire le moins d'erreurs de
				classification possible : cela revient à minimiser <KatexInline
					formula={'\\sum_{i=1}^n \\xi_i'}
				/> ;
			</li>
			<li>
				on souhaite toujours minimiser
				<KatexInline formula={'\\dfrac{1}{2}\\|w\\|^2'} /> pour maximiser la marge.
			</li>
		</ul>

		<Callout type="warning" title="Un compromis à arbitrer">
			Lorsque <KatexInline formula={'\\sum_{i=1}^n \\xi_i'} /> diminue, la marge diminue et inversement.
			Il faut donc faire un compromis entre maximiser la marge et minimiser le nombre d'outliers.
		</Callout>

		<h3>Formulation primale</h3>

		<TheoremBlock title="Problème d'optimisation primal — SVM à marge souple">
			<p>
				On cherche <KatexInline
					formula={'(\\widehat{w}, \\widehat{b}, \\widehat{\\xi}) \\in \\mathbb{R}^d \\times \\mathbb{R} \\times \\mathbb{R}_+'}
				/>
				tels que
			</p>
			<KatexBlock formula={softPrimal} />
		</TheoremBlock>

		<p>
			Le paramètre <KatexInline formula={'C \\in \\mathbb{R}_+'} /> permet d'indiquer une préférence entre
			maximiser la marge et minimiser le nombre d'outliers :
		</p>
		<ul>
			<li>
				si <KatexInline formula="C" /> est <strong>large</strong>, on préfère minimiser le nombre
				d'outliers ;
			</li>
			<li>
				si <KatexInline formula="C" /> est <strong>petit</strong>, on accorde moins d'importance au
				fait qu'il y ait des outliers.
			</li>
		</ul>
		<p>
			<strong
				>Le paramètre <KatexInline formula="C" /> est un hyperparamètre que l'utilisateur doit choisir.</strong
			>
			Ce choix peut être guidé en comparant, pour différentes valeurs de <KatexInline
				formula="C"
			/>, les performances des modèles sur les données de validation (<a href={resolve('/part2/lesson1')}
				>leçon 1</a
			>).
		</p>

		<h3>Réécriture en risque empirique régularisé (perte hinge)</h3>

		<p>
			Quand <KatexInline formula={'C > 0'} />, la fonction objectif du problème de minimisation <KatexInline
				formula={'(P)'}
			/> est croissante en chaque
			<KatexInline formula={'\\xi_i'} /> : le minimum en
			<KatexInline formula={'\\xi_i \\geq 0'} /> sous la contrainte
			<KatexInline formula={'y_i\\left(\\langle w, x_i\\rangle + b\\right) \\geq 1 - \\xi_i'} />
			s'atteint en <KatexInline
				formula={'\\xi_i = \\max\\left(0, \\, 1 - y_i\\left(\\langle w, x_i\\rangle + b\\right)\\right)'}
			/>
			, et <KatexInline formula={'(P)'} /> peut se réécrire
		</p>
		<KatexBlock formula={hingeObjective} />
		<p>où</p>
		<KatexBlock formula={hingeLoss} />
		<p>
			est la fonction de coût <em>hinge</em>. Le problème
			<KatexInline formula={'(P)'} /> peut donc être vu comme un problème de
			<strong>minimisation du risque empirique régularisé</strong> : la fonction de régularisation <KatexInline
				formula={'w \\mapsto \\dfrac{1}{2 n C}\\|w\\|^2'}
			/>
			(pénalité L2) permet d'éviter le sur-apprentissage.
		</p>

		<p>
			La perte <KatexInline formula={'\\ell^{\\mathrm{hinge}}'} /> et la régularisation L2 ont déjà été
			rencontrées dans ce cours : fonctions de coût (
			<a href={resolve('/part1/lesson2')}>Partie I, leçon 2</a>), régularisation L2 (
			<a href={resolve('/part5/lesson4')}>Partie V, leçon 4</a>), perte de substitution de la perte 0-1 (
			<a href={resolve('/part10/lesson1')}>Partie X, leçon 1</a>) et calibration (
			<a href={resolve('/part10/lesson2')}>Partie X, leçon 2</a>).
		</p>

		<InteractiveSection
			number="4.2"
			title="Rappel : la perte hinge"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Comparez la perte hinge
				<KatexInline formula={'\\ell^{\\mathrm{hinge}}(z) = \\max(0, 1 - z)'} />
				aux pertes MSE et logistique : elle est nulle pour
				<KatexInline formula={'z \\geq 1'} />, linéaire pour
				<KatexInline formula={'z < 1'} />, et non différentiable seulement en
				<KatexInline formula={'z = 1'} />. C'est elle qui apparaît dans l'objectif de la SVM à marge
				souple.
			</p>
			<LossFunctionExplorer />
		</InteractiveSection>

		<figure class="lesson-figure wide">
			<img
				src={asset('/images/part2/softSVMseparable.png')}
				alt="Frontière de décision rigide (rouge) et souple (verte) sur des données séparables"
			/>
			<figcaption>
				Même quand les données sont séparables, la frontière de la marge rigide (rouge) risque de ne
				pas bien généraliser ; la frontière souple (verte) évite le sur-apprentissage. Image tirée
				de l'article{' '}
				<a
					href="https://towardsdatascience.com/support-vector-machines-soft-margin-formulation-and-kernel-trick-4c9729dc8efe"
					target="_blank"
					rel="noopener noreferrer"
					>Support Vector Machines — Soft Margin Formulation and Kernel Trick</a
				>, Towards Data Science.
			</figcaption>
		</figure>

		<InteractiveSection
			number="4.3"
			title="Le paramètre C : compromis entre marge et outliers"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Choisissez un preset (« Bruit », « Quasi séparables », « Petit
				jeu ») et faites varier
				<KatexInline formula="C" /> sur une échelle logarithmique
				<KatexInline formula={'10^{-2}'} /> à <KatexInline formula={'10^3'} /> : la frontière de décision,
				les hyperplans de support, les outliers (cercles) et les points mal classés (carrés) évoluent
				avec
				<KatexInline formula="C" />. Les courbes
				<KatexInline formula={'\\gamma(C)'} /> (marge) et
				<KatexInline formula={'\\sum_i \\xi_i(C)'} /> (outliers) évoluent en sens inverse — le compromis
				de la formulation primale, en direct. Dans le preset « Quasi séparables », la référence « marge
				rigide »
				<KatexInline formula={'C \\to \\infty'} /> est tracée.
			</p>
			<SvmSoftMarginExplorer />
		</InteractiveSection>

		<h3>Formulation duale</h3>

		<TheoremBlock title="Proposition — SVM à marge souple (formulation duale)">
			<p>
				Soit <KatexInline
					formula={'\\widehat{\\alpha} = (\\widehat{\\alpha}_1, \\dots, \\widehat{\\alpha}_n) \\in \\mathbb{R}^n'}
				/>
				qui vérifie
			</p>
			<KatexBlock formula={softDual} />
			<p>Alors le couple <KatexInline formula={'(\\widehat{w}, \\widehat{b})'} /> défini par</p>
			<KatexBlock formula={dualW} />
			<p>et</p>
			<KatexBlock formula={softDualB} />
			<p>
				est identique à la solution de la formulation primale ci-dessus. Preuve : section 10.2.2 de
				l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
			</p>
		</TheoremBlock>

		<Callout type="note" title="Remarque — l'absence (rare) de vecteur de support intérieur">
			<p>
				Il est possible (mais rare) qu'il n'existe pas
				<KatexInline formula={'i \\in \\{1, \\dots, n\\}'} /> tel que
				<KatexInline formula={'0 < \\widehat{\\alpha}_i < C'} /> ; dans ce cas, il est possible de prendre
				une valeur au hasard dans un certain intervalle pour
				<KatexInline formula={'\\widehat{b}'} />, mais il est plutôt conseillé de changer <KatexInline
					formula="C"
				/> pour obtenir
				<KatexInline formula={'0 < \\widehat{\\alpha}_i < C'} />.
			</p>
		</Callout>

		<p>
			Comme le primal, le problème duale est un <strong
				>problème d'optimisation convexe et quadratique</strong
			>. Le <strong>classifieur SVM à marge souple</strong> s'écrit
		</p>
		<KatexBlock formula={dualClassifier} />

		<TheoremBlock title="Interprétation géométrique — SVM à marge souple">
			<p>
				Les solutions <KatexInline formula={'\\widehat{\\alpha}'} /> et
				<KatexInline formula={'(\\widehat{w}, \\widehat{b})'} /> vérifient les
				<em>conditions d'optimalité de Karush-Kuhn-Tucker</em>, dont la
				<em>condition d'écart complémentaire</em> qui stipule que, pour tout
				<KatexInline formula={'i \\in \\{1, \\dots, n\\}'} />,
			</p>
			<KatexBlock formula={kktSoft} />
			<p>Il y a alors deux conséquences :</p>
			<ul>
				<li>
					si <KatexInline formula={'x_i'} /> est <em>au-dessus</em> de
					<KatexInline formula="H_+" /> pour <KatexInline formula={'y_i = 1'} />
					et <em>en dessous</em> de <KatexInline formula="H_-" /> pour
					<KatexInline formula={'y_i = -1'} />, c'est-à-dire
					<KatexInline formula={kktAbove} />, alors
					<KatexInline formula={'\\xi_i = 0'} /> et donc
					<KatexInline formula={'\\widehat{\\alpha}_i = 0'} /> ;
				</li>
				<li>
					si <KatexInline formula={'\\widehat{\\alpha}_i > 0'} /> alors :
					<ul>
						<li>
							si <KatexInline formula={'\\xi_i = 0'} /> alors
							<KatexInline formula={kktOn} />, c'est-à-dire
							<KatexInline formula={'x_i \\in H_+'} /> si
							<KatexInline formula={'y_i = 1'} /> et
							<KatexInline formula={'x_i \\in H_-'} /> si
							<KatexInline formula={'y_i = -1'} /> :
							<KatexInline formula={'x_i'} /> est donc un
							<strong>vecteur de support</strong> ;
						</li>
						<li>
							si <KatexInline formula={'\\xi_i \\neq 0'} /> alors
							<KatexInline formula={'x_i'} /> est un <strong>outlier</strong>.
						</li>
					</ul>
				</li>
			</ul>
			<p>
				La formulation duale permet d'identifier des vecteurs de support (pas forcément tous) et des
				outliers (pas forcément tous). Ce sont seulement ces vecteurs de support et outliers qui
				sont utilisés pour construire le classifieur à marge souple.
			</p>
		</TheoremBlock>

		<ExercisePanel title="Exercice 2 — vecteurs de support et outliers à partir d'une solution">
			<p>
				On suppose que
				<KatexInline formula={'(\\widehat{w}, \\widehat{b}) = ((1, 0), 0)'} /> est une solution optimale
				de la SVM à marge souple sur les 5 points suivants :
			</p>
			<table class="exercise-table">
				<caption>Données d'apprentissage</caption>
				<thead>
					<tr>
						<th>Observation</th>
						<th>x₁</th>
						<th>x₂</th>
						<th>x₃</th>
						<th>x₄</th>
						<th>x₅</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th>Coordonnées</th>
						<td>(2, 0)</td>
						<td>(1, 0.5)</td>
						<td>(−0.5, 0)</td>
						<td>(−1, 0)</td>
						<td>(−3, 0)</td>
					</tr>
					<tr>
						<th>Étiquette y_i</th>
						<td>+1</td>
						<td>+1</td>
						<td>−1</td>
						<td>−1</td>
						<td>−1</td>
					</tr>
				</tbody>
			</table>
			<ol>
				<li>
					Pour chaque <KatexInline formula="i" />, calculer
					<KatexInline formula={mDef} />.
				</li>
				<li>
					En utilisant la condition d'écart complémentaire, dire pour chaque point : est-il hors de
					la marge
					<KatexInline formula={'(\\widehat{\\alpha}_i = 0)'} />, vecteur de support <KatexInline
						formula={'(0 < \\widehat{\\alpha}_i < C)'}
					/>, ou outlier <KatexInline formula={'(\\xi_i \\neq 0)'} /> ?
				</li>
			</ol>
			<p>
				<em>Exercice d'entraînement.</em>
			</p>
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Avec
					<KatexInline formula={'(\\widehat{w}, \\widehat{b}) = ((1, 0), 0)'} />, on a <KatexInline
						formula={'m_i = y_i \\cdot x_{i,1}'}
					/> :
				</p>
				<KatexBlock
					formula={'m_1 = 2, \\qquad m_2 = 1, \\qquad m_3 = \\tfrac{1}{2}, \\qquad m_4 = 1, \\qquad m_5 = 3'}
				/>
				<p>
					<strong>(b)</strong> La condition d'écart complémentaire dit
					<KatexInline formula={'\\widehat{\\alpha}_i \\left[m_i - 1 + \\xi_i\\right] = 0'} />
					avec <KatexInline formula={'\\xi_i = \\max(0, 1 - m_i)'} /> :
				</p>
				<ul>
					<li>
						<KatexInline formula={'x_1'} /> :
						<KatexInline formula={'m_1 = 2 > 1'} /> — hors de la marge :
						<KatexInline formula={'\\xi_1 = 0'} /> et
						<KatexInline formula={'\\widehat{\\alpha}_1 = 0'} /> ;
					</li>
					<li>
						<KatexInline formula={'x_2'} /> :
						<KatexInline formula={'m_2 = 1'} /> — sur
						<KatexInline formula="H_+" /> :
						<KatexInline formula={'\\xi_2 = 0'} /> et
						<KatexInline formula={'x_2'} /> est un vecteur de support ;
					</li>
					<li>
						<KatexInline formula={'x_3'} /> :
						<KatexInline formula={'0 < m_3 = 1/2 < 1'} /> — dans la zone d'indécision (bien classé) :
						<KatexInline formula={'\\xi_3 = 1 - 1/2 = 1/2 \\neq 0'} />,
						<KatexInline formula={'x_3'} /> est un outlier (et
						<KatexInline formula={'\\widehat{\\alpha}_3 = C'} />, d'après les conditions de
						Karush-Kuhn-Tucker) ;
					</li>
					<li>
						<KatexInline formula={'x_4'} /> :
						<KatexInline formula={'m_4 = 1'} /> — sur
						<KatexInline formula="H_-" /> :
						<KatexInline formula={'\\xi_4 = 0'} /> et
						<KatexInline formula={'x_4'} /> est un vecteur de support ;
					</li>
					<li>
						<KatexInline formula={'x_5'} /> :
						<KatexInline formula={'m_5 = 3 > 1'} /> — hors de la marge :
						<KatexInline formula={'\\xi_5 = 0'} /> et
						<KatexInline formula={'\\widehat{\\alpha}_5 = 0'} />.
					</li>
				</ul>
			{/snippet}
		</ExercisePanel>

		<h2 id="noyau">SVM à noyau</h2>

		<h3>Problématique</h3>

		<figure class="figure-grid two-col">
			<figure class="lesson-figure">
				<img
					src={asset('/images/part2/nonseparablecercle.png')}
					alt="Points en anneau, non séparables linéairement"
				/>
				<figcaption>Non séparables linéairement, même à quelques observations près.</figcaption>
			</figure>
			<figure class="lesson-figure">
				<img
					src={asset('/images/part2/separabledim.png')}
					alt="Les mêmes points séparés dans l'espace de redescription"
				/>
				<figcaption>
					Séparables dans l'espace de redescription après
					<KatexInline formula={'\\phi(x_1, x_2) \\mapsto \\left(x_1^2, x_2^2\\right)'} />
					.
				</figcaption>
			</figure>
		</figure>
		<p class="attribution">
			Tirées de l'ouvrage <em>Introduction au Machine Learning</em> de Chloé-Agathe Azencott.
		</p>

		<Callout
			type="warning"
			title="Les données ne sont pas séparables linéairement (même à quelques observations près)"
		>
			<p>
				Ici ni la SVM à marge rigide, ni la SVM à marge souple (qui n'autorise que peu d'erreurs) ne
				suffisent : la frontière de décision recherchée n'est simplement pas linéaire.
			</p>
		</Callout>

		<p>
			L'idée est de <strong>transformer les données</strong> par une application
			<KatexInline formula={phiMap} /> afin de les séparer linéairement dans l'<em
				>espace de redescription</em
			>
			<KatexInline formula={'\\mathcal{H}'} /> en utilisant une SVM à marge souple.
		</p>

		<InteractiveSection
			number="4.4"
			title="L'espace de redescription : φ et séparabilité"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Un disque de points de classe
				<KatexInline formula={'+1'} /> entouré d'un anneau de points de classe
				<KatexInline formula={'-1'} /> n'est pas séparable linéairement dans
				<KatexInline formula={'\\mathbb{R}^2'} />. Changez de mode : « Sans transformation », « <KatexInline
					formula={'\\phi(x) = (x_1^2, x_2^2)'}
				/> » (la transformation quadratique) ou « polynomial de degré 2 » — les points levés deviennent
				linéairement séparables dans l'espace de redescription, et la SVM y retrouve un hyperplan de décision.
				Dans les trois modes, la duale à marge souple est résolue dans l'espace
				<strong>d'origine</strong> à partir de la matrice de Gram
				<KatexInline formula={'K(x_i, x_j) = \\langle \\phi(x_i), \\phi(x_j)\\rangle'} /> : le dual ne
				voit que des produits scalaires — c'est l'astuce du noyau.
			</p>
			<FeatureMapExplorer />
		</InteractiveSection>

		<h3>Formulation duale sur les données transformées</h3>

		<TheoremBlock title="Problème duale — SVM à marge souple sur données transformées">
			<p>
				On cherche <KatexInline
					formula={'\\widehat{\\alpha} = (\\widehat{\\alpha}_1, \\dots, \\widehat{\\alpha}_n) \\in \\mathbb{R}^n'}
				/>
				qui vérifie
			</p>
			<KatexBlock formula={kernelDual} />
			<p>
				avec <KatexInline formula={'\\widehat{w}'} /> défini comme précédemment (formulation duale de
				la SVM à marge souple) et
				<KatexInline formula={'\\widehat{b}'} /> défini par
			</p>
			<KatexBlock formula={kernelB} />
			<p>Le classifieur s'écrit</p>
			<KatexBlock formula={kernelClassifier} />
		</TheoremBlock>

		<h3>L'astuce du noyau</h3>

		<p>
			L'application <KatexInline formula={'\\phi'} /> intervient dans le problème d'optimisation ci-dessus
			et dans l'expression du classifieur
			<strong>uniquement via les produits scalaires</strong>
			<KatexInline formula={'\\left\\langle \\phi(x_j), \\phi(x_i)\\right\\rangle'} />
			, <KatexInline formula={'i, j \\in \\{1, \\dots, n\\}'} />.
		</p>

		<Callout type="warning" title="Un calcul qui peut coûter cher">
			La dimension de <KatexInline formula={'\\mathcal{H}'} /> peut être grande, et donc le calcul de
			<KatexInline formula={'\\left\\langle \\phi(x_j), \\phi(x_i)\\right\\rangle'} />
			coûteux. Comment calculer ces produits scalaires de manière plus efficace ?
		</Callout>

		<ExampleBlock title="Exemple — une application φ de dimension 1+d+d²">
			<p>
				Soit <KatexInline formula={phiEx} />. Alors :
			</p>
			<KatexBlock formula={kernelEx} />
			<p>
				La complexité algorithmique passe de
				<KatexInline formula={'O(d^2)'} /> (double somme explicite) à
				<KatexInline formula={'O(d)'} /> (un produit scalaire, puis un carré).
			</p>
		</ExampleBlock>

		<DefinitionBlock number="4.6" title="Noyau">
			<p>
				Soit la fonction <KatexInline formula="K" />, appelée <strong>noyau</strong>, définie par
			</p>
			<KatexBlock formula={kernelDef} />
		</DefinitionBlock>

		<Callout type="insight" title="L'astuce du noyau (kernel trick)">
			Au lieu de calculer <KatexInline formula={'\\phi(x_i)'} /> et
			<KatexInline formula={'\\phi(x_j)'} /> puis de calculer
			<KatexInline formula={'\\left\\langle \\phi(x_i), \\phi(x_j)\\right\\rangle'} />
			, on calcule directement <KatexInline formula={'K(x_i, x_j)'} />.
		</Callout>

		<p>Quelques remarques :</p>
		<ul>
			<li>
				l'astuce du noyau intervient dans le cadre du problème d'optimisation
				<strong>dual</strong> ;
			</li>
			<li>
				il est souvent plus efficace en temps de calcul de calculer
				<KatexInline formula={'K(x_i, x_j)'} /> plutôt que
				<KatexInline formula={'\\phi(x_i)'} />,
				<KatexInline formula={'\\phi(x_j)'} /> puis
				<KatexInline formula={'\\left\\langle \\phi(x_i), \\phi(x_j)\\right\\rangle'} />
				;
			</li>
			<li>
				il n'y a pas besoin de connaître <KatexInline formula={'\\phi'} />
				explicitement, il suffit de connaître le noyau
				<KatexInline formula="K" />. Aussi,
				<KatexInline formula="K" /> peut être choisi de manière arbitraire (hyperparamètre), du moment
				que l'existence de
				<KatexInline formula={'\\phi'} /> est garantie.
			</li>
		</ul>
		<p>
			<strong>Question.</strong> Soit
			<KatexInline formula={'K : \\mathcal{X} \\times \\mathcal{X} \\to \\mathbb{R}'} />
			. Qu'est-ce qui garantit qu'il existe
			<KatexInline formula={'\\phi : \\mathcal{X} \\to \\mathcal{H}'} /> telle que
			<KatexInline
				formula={'K(x, \\tilde{x}) = \\left\\langle \\phi(x), \\phi(\\tilde{x})\\right\\rangle'}
			/>
			?
		</p>

		<InteractiveSection
			number="4.5"
			title="Noyaux et frontière de décision"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Les données (disque de classe
				<KatexInline formula={'+1'} />, anneau de classe
				<KatexInline formula={'-1'} />) ne sont pas séparables linéairement dans
				<KatexInline formula={'\\mathbb{R}^2'} />. La même duale à marge souple (mêmes contraintes,
				formulation duale ci-dessus) est résolue dans l'espace d'origine avec un noyau linéaire,
				quadratique
				<KatexInline formula={'(c = 1)'} />, polynomial
				<KatexInline formula={'(d = 3, c = 0.5)'} /> ou gaussien
				<KatexInline formula={'(\\gamma'} /> au curseur), à
				<KatexInline formula="C" /> fixé : la frontière de décision
				<KatexInline formula={'\\{f = 0\\}'} /> change radicalement d'un noyau à l'autre. La duale ne
				calcule que la matrice
				<KatexInline formula={'K(x_i, x_j)'} /> — jamais
				<KatexInline formula={'\\phi'} />.
			</p>
			<DeferredDemo load={() => import('$lib/components/demos/KernelSvmExplorer.svelte')} />
		</InteractiveSection>

		<h3>Propriétés du noyau K</h3>

		<DefinitionBlock number="4.7" title="Symétrique, semi-définie positive">
			<p>
				Soit une fonction
				<KatexInline formula={'K : \\mathcal{X} \\times \\mathcal{X} \\mapsto \\mathbb{R}'} />
				:
			</p>
			<ul>
				<li>
					<KatexInline formula="K" /> est dite <strong>symétrique</strong> si
					<KatexInline formula={symmDef} /> ;
				</li>
				<li>
					<KatexInline formula="K" /> est dite <strong>semi-définie positive</strong>
					si
					<KatexBlock formula={psdDef} />
				</li>
			</ul>
		</DefinitionBlock>

		<TheoremBlock title="Théorème Moore–Aronszajn">
			<p>
				Soit
				<KatexInline formula={'K : \\mathcal{X} \\times \\mathcal{X} \\mapsto \\mathbb{R}'} />
				une fonction symétrique et semi-définie positive : alors il existe un espace (de Hilbert) <KatexInline
					formula={'\\mathcal{H}'}
				/> et une application
				<KatexInline formula={'\\phi : \\mathcal{X} \\to \\mathcal{H}'} /> telle que
			</p>
			<KatexBlock formula={mooreAronszajn} />
			<p>
				On choisit donc le noyau <KatexInline formula="K" /> tel qu'il soit symétrique et semi-défini
				positif.
			</p>
		</TheoremBlock>

		<Callout type="note" title="Remarque — matrice de Gram">
			Soit un noyau <KatexInline formula="K" /> et des observations
			<KatexInline formula={'x_1, \\dots, x_n'} /> : la matrice
			<KatexInline formula={'M \\in \\mathbb{R}^{n \\times n}'} /> définie par
			<KatexInline formula={gramMat} /> est appelée <em>matrice de Gram</em>.
		</Callout>

		<InteractiveSection
			number="4.6"
			title="Noyaux valides : symétrique et semi-défini positif"
			onInteract={tracker.trackInteraction}
		>
			<p class="demo-guide">
				<strong>À observer.</strong> Choisissez un noyau candidat — valides : linéaire, cosinus,
				quadratique, polynomial, gaussien, et même « cube »
				<KatexInline formula={'K = \\langle x, \\tilde{x}\\rangle^3'} /> (polynomial homogène) — ou le
				suspect « négatif »
				<KatexInline formula={'K = -\\langle x, \\tilde{x}\\rangle'} /> : la matrice de Gram <KatexInline
					formula={'6 \\times 6'}
				/>
				<KatexInline formula={gramMat} /> s'affiche, et sa plus petite valeur propre teste la semi-définition
				positive — à l'erreur numérique près, elle doit être
				<KatexInline formula={'\\geq 0'} />. Le théorème de Moore–Aronszajn dit que « symétrique et
				semi-définie positive » suffit à garantir l'existence de
				<KatexInline formula={'\\phi'} />. Cliquez « Nouveaux points » pour re-tirer l'échantillon.
			</p>
			<KernelPSDExplorer />
		</InteractiveSection>

		<ExercisePanel title="Exercice 3 — le noyau quadratique sous forme de produit scalaire">
			<p>
				Écrire le noyau <KatexInline formula={ex3K} /> sous forme d'un produit scalaire <KatexInline
					formula={'\\left\\langle \\phi(x), \\phi(\\tilde{x})\\right\\rangle'}
				/>
				.
			</p>
			<p>
				<em>À la suite de la section « Propriétés du noyau K ».</em>
			</p>
			{#snippet solution()}
				<p>
					Prendre <KatexInline formula={ex3phi} />. Vérification :
				</p>
				<KatexBlock formula={ex3check} />
				<p>
					Le premier terme vient de la composante constante
					<KatexInline formula="c" />, le second du bloc
					<KatexInline formula={'\\sqrt{2c}\\, x'} />, et le troisième du bloc
					<KatexInline formula={'(x_i x_j)'} /> :
					<KatexInline
						formula={'\\left(\\sum_{i=1}^d x_i \\tilde{x}_i\\right)\\left(\\sum_{j=1}^d x_j \\tilde{x}_j\\right) = \\langle x, \\tilde{x}\\rangle^2'}
					/>
					.
				</p>
			{/snippet}
		</ExercisePanel>

		<h3>Exemples de noyau</h3>

		<p>Pour <KatexInline formula={'x, \\tilde{x} \\in \\mathbb{R}^d'} /> :</p>

		<table>
			<thead>
				<tr>
					<th>Noyau</th>
					<th>Formule</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Linéaire</td>
					<td>
						<KatexInline formula={kLinear} />
					</td>
				</tr>
				<tr>
					<td>Cosinus</td>
					<td>
						<KatexInline formula={kCosine} />
					</td>
				</tr>
				<tr>
					<td>Quadratique</td>
					<td>
						<KatexInline formula={kQuad} />
					</td>
				</tr>
				<tr>
					<td>Polynomial</td>
					<td>
						<KatexInline formula={kPoly} />
					</td>
				</tr>
				<tr>
					<td>Gaussien (général)</td>
					<td>
						<KatexInline formula={kGauss} />
					</td>
				</tr>
				<tr>
					<td>Gaussien (isotrope)</td>
					<td>
						<KatexInline formula={kGaussIso} />
					</td>
				</tr>
			</tbody>
		</table>

		<h3>Formulation duale avec le noyau</h3>

		<TheoremBlock title="Problème duale — SVM à marge souple et à noyau">
			<p>
				On cherche <KatexInline
					formula={'\\widehat{\\alpha} = (\\widehat{\\alpha}_1, \\dots, \\widehat{\\alpha}_n) \\in \\mathbb{R}^n'}
				/>
				qui vérifie
			</p>
			<KatexBlock formula={finalDual} />
			<p>
				avec <KatexInline formula={'\\widehat{w}'} /> défini comme précédemment (formulation duale de
				la SVM à marge souple) et
				<KatexInline formula={'\\widehat{b}'} /> défini par
			</p>
			<KatexBlock formula={finalB} />
		</TheoremBlock>

		<p>
			<strong
				>Le paramètre <KatexInline formula="C" /> et le noyau
				<KatexInline formula="K" /> sont des hyperparamètres que l'utilisateur doit choisir.</strong
			>
			Ce choix peut être guidé en comparant, pour différents noyaux
			<KatexInline formula="K" /> et constantes <KatexInline formula="C" />, les performances des
			modèles sur les données de validation.
		</p>
		<p>Le <strong>classifieur SVM à noyau</strong> s'écrit</p>
		<KatexBlock formula={finalClassifier} />

		<Callout type="insight" title="Prolongements — la SVM au-delà du binaire">
			<p>
				La SVM s'étend naturellement à :
			</p>
			<ul>
				<li>
					la classification multi-classe,
					<KatexInline formula={'\\mathcal{Y} = \\{1, \\dots, C\\}'} /> ;
				</li>
				<li>
					la régression, <KatexInline formula={'\\mathcal{Y} = \\mathbb{R}'} />
					(SVM de régression).
				</li>
			</ul>
			<p>
				L'astuce du noyau s'applique aussi à d'autres algorithmes d'apprentissage linéaires, comme
				la régression ridge (
				<a href={resolve('/part5/lesson4')}>Partie V, leçon 4</a>). Quant à l'évaluation théorique de la SVM,
				la borne de généralisation via la dimension VC est développée dans la
				<a href={resolve('/part9/lesson3')}>Partie IX, leçon 3</a>.
			</p>
		</Callout>

		<p>
			Pour mettre en pratique ces résultats sur de vraies données, les{' '}
			<a href={resolve('/part2/practice/travaux-pratiques')}>travaux pratiques de la partie 2</a>{' '}
			(TP5 — SVM) appliquent la SVM à un problème de classification réel.
		</p>
	</TheorySection>

	<Bibliography>
		<BibElement
			authors={['Azencott, C. A.']}
			year={2022}
			title="Introduction au Machine Learning"
			journal="Dunod, 2ᵉ édition."
			link="https://www.dunod.com/sciences-techniques/introduction-au-machine-learning-2"
		/>
		<BibElement
			authors={['Shalev-Shwartz, S.', 'Ben-David, S.']}
			year={2014}
			title="Understanding Machine Learning: From Theory to Algorithms"
			journal="Cambridge University Press."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer Science & Business Media, Second Edition."
			link="https://hastie.su.domains/ElemStatLearn/"
		/>
	</Bibliography>
</PageTemplate>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		overflow: hidden;
	}

	thead {
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
	}

	td {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: top;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.lesson-figure {
		margin: 1rem auto;
		max-width: 26rem;
		text-align: center;
	}

	.lesson-figure.wide {
		max-width: 46rem;
	}

	.lesson-figure img {
		width: 100%;
		height: auto;
		border-radius: 6px;
		border: 1px solid var(--color-border);
	}

	.lesson-figure figcaption {
		margin-top: 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.demo-guide {
		margin: 0.75rem 0;
		padding: 0.8rem 1rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
		line-height: 1.65;
	}

	.exercise-table {
		width: 100%;
		max-width: 34rem;
		margin: 0.75rem 0;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.exercise-table caption {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.exercise-table th,
	.exercise-table td {
		border: 1px solid var(--color-border);
		padding: 0.4rem 0.75rem;
		text-align: center;
	}

	.exercise-table thead th {
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.exercise-table tbody th {
		text-align: left;
	}

	.proof-block {
		padding: 1rem 1.5rem;
		margin: 1rem 0;
		border-left: 3px solid var(--color-positive, #4caf50);
		background-color: color-mix(in srgb, var(--color-positive, #4caf50) 5%, transparent);
		border-radius: 0 6px 6px 0;
		font-size: 0.95em;
		line-height: 1.7;
	}

	.proof-block p {
		margin: 0.4rem 0;
	}
</style>
