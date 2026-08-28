<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import ExercisePanel from '$lib/components/narrative/ExercisePanel.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import KatexBlock from '$lib/components/narrative/KatexBlock.svelte';
	import TableOfContents, { type TocEntry } from '$lib/components/narrative/TableOfContents.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';

	const meta = getPageByPath('/part7/exercices');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);

	// ── Table of Contents ──

	const tocEntries: TocEntry[] = [
		{
			id: 'pertes-proxy',
			label: 'De la perte 0-1 aux pertes proxy',
			description: '4 exercices — convexité, logistique et entropie croisée, sensibilité à la marge',
			color: 'epistemic'
		},
		{
			id: 'calibration',
			label: 'Calibration des pertes',
			description: '4 exercices — risque conditionnel, critère φ′(0)<0, signe du minimiseur',
			color: 'belief'
		},
		{
			id: 'decomposition-erreur',
			label: "Décomposition de l'erreur",
			description: '4 exercices — télescopage, termes A/B/C, cas favorable, synthèse critique',
			color: 'surprise'
		}
	];

	// ── Formula variables (stored in script so Svelte never parses backslashes) ──

	// Ex 7.1
	const phi01 = '\\varphi_{0,1}(t) = \\mathbf 1_{\\{t < 0\\}}';
	const phi01Violation =
		'\\varphi_{0,1}\\!\\left(-\\tfrac12\\right) = 1 \\;>\\; \\tfrac12 = \\tfrac12\\,\\varphi_{0,1}(-1) + \\tfrac12\\,\\varphi_{0,1}(0)';

	// Ex 7.2
	const sigmaDef = 'p = \\sigma(f(x)) = \\dfrac{1}{1+e^{-f(x)}}';
	const ceLoss = '\\ell(y, f(x)) = -y\\ln p - (1-y)\\ln(1-p)';
	const ceY1 = '-\\ln p = \\ln(1+e^{-f(x)}) = \\varphi(f(x)) = \\varphi(y f(x))';
	const ceY0 = '-\\ln(1-p) = \\ln(1+e^{f(x)}) = \\varphi(-f(x)) = \\varphi(y f(x)),\\; y f(x) = -f(x)';

	// Ex 7.3
	const logDeriv = "\\varphi'(t) = -\\dfrac{e^{-t}}{1+e^{-t}} = -\\dfrac{1}{1+e^{t}} = -\\sigma(t)";
	const logSecond = "\\varphi''(t) = \\dfrac{e^{t}}{(1+e^{t})^{2}} = \\sigma(t)\\bigl(1-\\sigma(t)\\bigr) > 0";
	const logPrime0 = "\\varphi'(0) = -\\tfrac12 < 0";

	// Ex 7.4
	const tMinus2 =
		't = -2 :\\;\\; \\varphi_{0,1} = 1,\\quad \\varphi_{\\mathrm{hinge}} = 3,\\quad \\varphi_{\\log} = \\ln(1+e^{2}) \\approx 2.127,\\quad \\varphi_{\\exp} = e^{2} \\approx 7.389';
	const tPlus2 =
		't = +2 :\\;\\; \\varphi_{0,1} = 0,\\quad \\varphi_{\\mathrm{hinge}} = 0,\\quad \\varphi_{\\log} = \\ln(1+e^{-2}) \\approx 0.127,\\quad \\varphi_{\\exp} = e^{-2} \\approx 0.135';
	const tPlus100 =
		't = +100 :\\;\\; \\varphi_{0,1} = 0,\\quad \\varphi_{\\mathrm{hinge}} = 0,\\quad \\varphi_{\\log} = \\ln(1+e^{-100}) \\approx e^{-100},\\quad \\varphi_{\\exp} = e^{-100}';

	// Ex 7.5
	const critSq =
		'C_\\varphi(\\alpha,\\eta) = \\eta(\\alpha-1)^{2} + (1-\\eta)(\\alpha+1)^{2} = \\alpha^{2} + 2(1-2\\eta)\\alpha + 1';
	const sqMin = '\\alpha^{*} = 2\\eta - 1,\\qquad C_\\varphi^{*}(\\eta) = 1 - (2\\eta-1)^{2}';
	const sqPrime0 = "\\varphi'(t) = 2(t-1),\\qquad \\varphi'(0) = -2 < 0";

	// Ex 7.6
	const fourPrimes =
		"\\varphi'_{\\log}(0) = -\\tfrac12,\\qquad \\varphi'_{\\mathrm{hinge}}(0) = -1,\\qquad \\varphi'_{\\exp}(0) = -1,\\qquad \\varphi'_{\\mathrm{sq}}(0) = -2";
	const logPrimeT = "\\varphi'(t) = -\\sigma(t)";
	const expPrimeT = "\\varphi'(t) = -e^{-t}";
	const sqPrimeT = "\\varphi'(t) = -2(1-t)";

	// Ex 7.7
	const logCrit = 'C_\\varphi(\\alpha,\\eta) = \\eta\\,\\ln(1+e^{-\\alpha}) + (1-\\eta)\\,\\ln(1+e^{\\alpha})';
	const logCritPrime = "(C_\\varphi)'(\\alpha,\\eta) = (1-\\eta)\\,\\sigma(\\alpha) - \\eta\\,\\sigma(-\\alpha)";
	const logCritSecond =
		"(C_\\varphi)''(\\alpha,\\eta) = (1-\\eta)\\,\\sigma(\\alpha)\\bigl(1-\\sigma(\\alpha)\\bigr) + \\eta\\,\\sigma(-\\alpha)\\bigl(1-\\sigma(-\\alpha)\\bigr) > 0";
	const logitSolution = "\\alpha^{*} = \\tfrac12\\,\\ln\\!\\dfrac{\\eta}{1-\\eta} = \\operatorname{logit}(\\eta)";
	const eta09 = "\\alpha^{*}(0.9) = \\tfrac12\\ln 9 = \\ln 3 \\approx 1.099";

	// Ex 7.8
	const halfCrit =
		'C_\\varphi\\!\\left(\\alpha,\\tfrac12\\right) = \\tfrac12\\ln(1+e^{-\\alpha}) + \\tfrac12\\ln(1+e^{\\alpha}) = \\tfrac12\\ln\\!\\bigl(2 + e^{\\alpha} + e^{-\\alpha}\\bigr)';
	const halfMin = 'C_\\varphi\\!\\left(0,\\tfrac12\\right) = \\tfrac12\\ln 4 = \\ln 2 \\approx 0.693';

	// Ex 7.9
	const telescoping = 'a - d = (a-b) + (b-c) + (c-d)';
	const riskTelescoping =
		'R(h_{\\hat f}) - R^{*} = \\underbrace{R(h_{\\hat f}) - R(h_{f^{*}})}_{A} + \\underbrace{R(h_{f^{*}}) - R(h_{f^{**}})}_{B} + \\underbrace{R(h_{f^{**}}) - R^{*}}_{C}';

	// Ex 7.10
	const logitMargin = 'x \\mapsto \\operatorname{logit}(\\eta(x))';

	// Ex 7.11
	const bZero = 'R_\\varphi(f^{*}) = R_\\varphi(f^{**}) = R_\\varphi^{*} \\;\\Rightarrow\\; f^{*} = f^{**}';
	const cZero = 'C = R(h_{f^{**}}) - R^{*} = 0';
	const onlyA = 'R(h_{\\hat f}) - R^{*} = A';

	// Ex 7.12
	const counterex = "\\varphi(t) = t^{2},\\qquad \\varphi'(0) = 0";
	const critT2 = 'C_\\varphi(\\alpha,\\eta) = \\eta\\,\\alpha^{2} + (1-\\eta)\\,\\alpha^{2} = \\alpha^{2},\\qquad \\alpha^{*} = 0\\;\\text{quel que soit }\\eta';
</script>

<svelte:head>
	<title>{meta?.title} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Exercices — Fonctions de perte'}
	subtitle="12 exercices sur les trois leçons de la partie : pertes proxy, calibration des pertes convexes et décomposition de l'erreur"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<TableOfContents entries={tocEntries} />

		<h2 id="pertes-proxy">De la perte 0-1 aux pertes proxy</h2>

		<p>
			Ces quatre exercices couvrent la motivation de la partie : l'indésirabilité de la perte 0-1,
			l'équivalence logistique / entropie croisée, la convexité de la logistique, et la sensibilité
			à la marge.
		</p>

		<ExercisePanel number="7.1" title="La perte 0-1 n'est ni convexe ni lisse">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Le graphe est un escalier : <KatexInline
						formula={'\\varphi_{0,1}(t) = 1'}
					/>
					pour <KatexInline formula={'t < 0'} />, <KatexInline formula={'\\varphi_{0,1}(t) = 0'} />
					pour <KatexInline formula={'t \\ge 0'} />, avec un saut en <KatexInline
						formula={'t = 0'}
					/>.
				</p>
				<p>
					<strong>(b)</strong> Prenons <KatexInline formula={'t_1 = -1'} />, <KatexInline
						formula={'t_2 = 0'}
					/>, <KatexInline formula={'\\lambda = \\tfrac12'} />. Le point milieu vaut
					<KatexInline formula={'-\\tfrac12'} />, et la convexité exigerait
					<KatexInline formula={phi01Violation} />. L'inégalité est fausse : <KatexInline
						formula={phi01}
					/>
					n'est <strong>pas convexe</strong>.
				</p>
				<p>
					<strong>(c)</strong> Non : <KatexInline formula={'\\varphi_{0,1}'} /> est
					<strong>décontinue</strong> en <KatexInline formula={'t = 0'} /> (la limite à gauche vaut
					<KatexInline formula={'1'} />, la valeur <KatexInline formula={'0'} />), donc a fortiori
					pas différentiable.
				</p>
				<p>
					<strong>(d)</strong> Ni convexe ni lisse, la perte 0-1 ne fournit ni gradient fiable ni
					garantie d'optimalité : la minimisation du risque empirique 0-1 est un problème
					combinatoire (NP-difficile en général). C'est toute la motivation des pertes proxy.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={phi01} />. (a) Décrivez le graphe. (b) Montrez que
				<KatexInline formula={'\\varphi_{0,1}'} /> n'est pas convexe en utilisant
				<KatexInline formula={'t_1 = -1'} />, <KatexInline formula={'t_2 = 0'} />,
				<KatexInline formula={'\\lambda = \\tfrac12'} />. (c) Est-elle différentiable en
				<KatexInline formula={'t = 0'} /> ? (d) Qu'en déduire pour la minimisation du risque
				empirique 0-1 ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.2" title="Logistique et entropie croisée sont la même perte">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Comme <KatexInline formula={'p = \\dfrac{e^{f(x)}}{e^{f(x)} + 1}'} />
					, on a <KatexInline formula={'\\dfrac{1}{p} = 1 + e^{-f(x)}'} />, d'où
					<KatexInline formula={'-\\ln p = \\ln(1+e^{-f(x)})'} />.
				</p>
				<p>
					<strong>(b)</strong> Comme <KatexInline
						formula={'1-p = \\dfrac{1}{1+e^{f(x)}}'}
					/>, on a <KatexInline formula={'-\\ln(1-p) = \\ln(1+e^{f(x)})'} />.
				</p>
				<p>
					<strong>(c)</strong> Si <KatexInline formula={'y = 1'} /> : <KatexInline
						formula={ceY1}
					/>. Si <KatexInline formula={'y = 0'} /> : <KatexInline formula={ceY0} />. Dans les deux
					cas, <KatexInline formula={'\\ell(y, f(x)) = \\varphi(y f(x))'} /> avec
					<KatexInline formula={'\\varphi(t) = \\ln(1+e^{-t})'} /> : l'entropie croisée est
					bien la perte logistique vue en formulation marge, et son interprétation en négatif de
					log-vraisemblance justifie son usage omniprésent en deep learning.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={sigmaDef} /> et la perte d'entropie croisée <KatexInline
					formula={ceLoss}
				/>. (a) Montrez que <KatexInline formula={'-\\ln p = \\ln(1+e^{-f(x)})'} />. (b) Montrez que
				<KatexInline formula={'-\\ln(1-p) = \\ln(1+e^{f(x)})'} />. (c) Montrer que pour
				<KatexInline formula={'y \\in \\{0,1\\}'} />, la perte d'entropie croisée s'écrit
				<KatexInline formula={'\\varphi(y f(x))'} /> avec <KatexInline
					formula={'\\varphi(t) = \\ln(1+e^{-t})'}
				/>
				: c'est la perte logistique.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.3" title="Convexité de la perte logistique">
			{#snippet solution()}
				<p>
					On calcule <KatexInline formula={logDeriv} />. Comme <KatexInline
						formula={'\\sigma(t) > 0'}
					/>
					pour tout <KatexInline formula={'t'} />, on a <KatexInline
						formula={"\\varphi'(t) < 0"}
					/>
					: <KatexInline formula={'\\varphi'} /> est <strong>strictement décroissante</strong>.
				</p>
				<p>
					Puis <KatexInline formula={logSecond} /> : <KatexInline formula={'\\varphi'} /> est
					<strong>strictement convexe</strong>. Enfin <KatexInline formula={logPrime0} />, ce qui
					prédit (et confirme avec le critère de la leçon 2) que la logistique est calibrée.
				</p>
			{/snippet}
			<p>
				Montrez que <KatexInline formula={'\\varphi(t) = \\ln(1+e^{-t})'} /> est strictement convexe
				et strictement décroissante sur <KatexInline formula={'\\mathbb R'} />, en calculant
				<KatexInline formula={"\\varphi'(t)"} /> et <KatexInline formula={"\\varphi''(t)"} />. Que
				vaut <KatexInline formula={"\\varphi'(0)"} /> ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.4" title="Sensibilité à la marge">
			{#snippet solution()}
				<p>
					Pour <KatexInline formula={'y = 1'} />, la marge est <KatexInline
						formula={'t = y f(x) = f(x)'}
					/>, donc <KatexInline formula={'t = -2'} /> si <KatexInline formula={'f(x) = -2'} /> et
					<KatexInline formula={'t = +2'} /> si <KatexInline formula={'f(x) = +2'} />.
				</p>
				<p>
					<strong>Mauvaise prédiction</strong> (<KatexInline formula={'f(x) = -2'} />) :
				</p>
				<KatexBlock formula={tMinus2} />
				<p>
					<strong>Bonne prédiction</strong> (<KatexInline formula={'f(x) = +2'} />) :
				</p>
				<KatexBlock formula={tPlus2} />
				<p>
					Les quatre pertes sont bien décroissantes en <KatexInline formula={'t'} /> : la bonne
					prédiction est toujours moins pénalisée que la mauvaise. Mais la marge compte
					<KatexInline formula={'f(x) = +100'} /> :
				</p>
				<KatexBlock formula={tPlus100} />
				<p>
					La 0-1 et la hinge <strong>saturent</strong> dès que <KatexInline formula={'t \\ge 1'} />
					(perte nulle, la marge ne compte plus), tandis que la logistique et l'exponentielle
					poursuivent à diminuer <strong>exponentiellement</strong> avec la marge : elles
					« récompensent » les prédictions très confiantes. C'est ce qu'on observe dans le
					parcours interactif 1.1.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={'y = 1'} />. Comparez les quatre pertes usuelles
				(<KatexInline formula={'\\varphi_{0,1}'} />, hinge, logistique, exponentielle) pour
				<KatexInline formula={'f(x) = -2'} /> (mauvaise prédiction) et <KatexInline
					formula={'f(x) = +2'}
				/>
				(bonne prédiction) en tabulant les huit valeurs. Puis comparez <KatexInline
					formula={'f(x) = +2'}
				/>
				avec <KatexInline formula={'f(x) = +100'} /> : quelles pertes continuent de distinguer ces
				deux cas ?
			</p>
		</ExercisePanel>

		<h2 id="calibration">Calibration des pertes</h2>

		<p>
			Ces quatre exercices exploitent le critère de la leçon 2 : une perte convexe et différentiable
			en 0 est calibrée si et seulement si <KatexInline formula={"\\varphi'(0) < 0"} /> ; ils
			consistent à l'appliquer et à en explorer les conséquences sur le minimiseur du risque
			conditionnel.
		</p>

		<ExercisePanel number="7.5" title="Risque conditionnel d'une perte quadratique décalée">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Développement : <KatexInline formula={critSq} />.
				</p>
				<p>
					<strong>(b)</strong> C'est une quadratique en <KatexInline formula={'\\alpha'} /> de
					coefficient principal <KatexInline formula={'1 > 0'} /> : le minimum est atteint en
					<KatexInline formula={'\\alpha^{*} = -(1-2\\eta) = 2\\eta - 1'} />. En reportant :
					<KatexInline formula={sqMin} />. Vérifications : <KatexInline formula={'\\eta = 1'} />
					donne <KatexInline formula={'C_\\varphi^{*} = 0'} /> (on prédit correctement avec
					confiance), <KatexInline formula={'\\eta = \\tfrac12'} /> donne
					<KatexInline formula={'C_\\varphi^{*} = 1'} />.
				</p>
				<p>
					<strong>(c)</strong> <KatexInline formula={sqPrime0} /> et <KatexInline
						formula={'\\varphi'}
					/>
					est convexe et différentiable : par le Théorème 4.1, <KatexInline
						formula={'\\varphi'}
					/>
					est <strong>calibrée</strong>. On retrouve bien que le signe de
					<KatexInline formula={'\\alpha^{*} = 2\\eta-1'} /> est celui de
					<KatexInline formula={'\\eta - \\tfrac12'} />.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={'\\varphi(t) = (t-1)^{2}'} />. (a) Calculez
				<KatexInline formula={'C_\\varphi(\\alpha,\\eta) = \\eta\\,\\varphi(\\alpha) + (1-\\eta)\\,\\varphi(-\\alpha)'}
				/>. (b) Trouvez <KatexInline formula={'\\alpha^{*} = \\arg\\min_{\\alpha} C_\\varphi(\\alpha,\\eta)'}
				/>
				et <KatexInline formula={'C_\\varphi^{*}(\\eta)'} />. (c) <KatexInline
					formula={'\\varphi'}
				/>
				est-elle calibrée ? Justifiez.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.6" title="Le critère φ′(0) < 0 sur les quatre pertes usuelles">
			{#snippet solution()}
				<p>
					Logistique : <KatexInline formula={logPrimeT} />, donc
					<KatexInline formula={"\\varphi'(0) = -\\tfrac12"} />. Hinge : <KatexInline
						formula={'\\varphi(t) = (1-t)_{+}'}
					/>
					est affine de pente <KatexInline formula={'-1'} /> sur un voisinage de
					<KatexInline formula={'0'} /> (la rupture est en <KatexInline formula={'t = 1'} />),
					donc <KatexInline formula={"\\varphi'(0) = -1"} />. Exponentielle : <KatexInline
						formula={expPrimeT}
					/>, donc <KatexInline formula={"\\varphi'(0) = -1"} />. Quadratique : <KatexInline
						formula={sqPrimeT}
					/>, donc <KatexInline formula={"\\varphi'(0) = -2"} />.
				</p>
				<KatexBlock formula={fourPrimes} />
				<p>
					Toutes les valeurs sont strictement négatives, et les quatre pertes sont convexes et
					différentiables en 0 : par le Théorème 4.1, elles sont toutes
					<strong>calibrées</strong>.
				</p>
			{/snippet}
			<p>
				Pour les pertes <KatexInline formula={'\\varphi_{\\log(t)} = \\ln(1+e^{-t})'} />,
				<KatexInline formula={'\\varphi_{\\mathrm{hinge}}(t) = (1-t)_{+}'} />, <KatexInline
					formula={'\\varphi_{\\exp}(t) = e^{-t}'}
				/>
				et <KatexInline formula={'\\varphi_{\\mathrm{sq}}(t) = (1-t)^{2}'} />, calculez
				<KatexInline formula={"\\varphi'(0)"} /> dans chaque cas et concluez sur la calibration de
				chacune.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.7" title="Signe du minimiseur pour la logistique">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Dérivation terme à terme : <KatexInline
						formula={logCritPrime}
					/>
					puis <KatexInline formula={logCritSecond} /> (car
					<KatexInline formula={'\\sigma(s)(1-\\sigma(s)) > 0'} />). Donc
					<KatexInline formula={'C_\\varphi(\\cdot,\\eta)'} /> est strictement convexe en
					<KatexInline formula={'\\alpha'} /> et admet un minimum unique.
				</p>
				<p>
					<strong>(b)</strong> En <KatexInline formula={'\\alpha = 0'} />,
					<KatexInline formula={"(C_\\varphi)'(0,\\eta) = \\tfrac{1-2\\eta}{2}"} />. Comme la
					dérivée est strictement croissante : si <KatexInline
						formula={'\\eta > \\tfrac12'}
					/>, elle est négative en 0 et s'annule pour <KatexInline
						formula={'\\alpha^{*} > 0'}
					/>, et symétriquement si <KatexInline formula={'\\eta < \\tfrac12'} />. Le signe de
					<KatexInline formula={'\\alpha^{*}'} /> est donc bien celui de
					<KatexInline formula={'\\eta - \\tfrac12'} />.
				</p>
				<p>
					<strong>(c)</strong> L'équation <KatexInline formula={"(C_\\varphi)'(\\alpha,\\eta) = 0"}
					/>
					s'écrit <KatexInline
						formula={'\\sigma(\\alpha) / \\sigma(-\\alpha) = \\eta/(1-\\eta)'}
					/>, or <KatexInline
						formula={'\\sigma(\\alpha)/\\sigma(-\\alpha) = e^{2\\alpha}'}
					/>, d'où <KatexInline formula={logitSolution} />. Pour <KatexInline
						formula={'\\eta = 0.9'}
					/>: <KatexInline formula={eta09} />, cohérent avec <KatexInline
						formula={'\\alpha^{*} > 0'}
					/>. La marge optimale est exactement le logit de la probabilité de classe — c'est le
					risque conditionnel qui fixe l'échelle de la marge.
				</p>
			{/snippet}
			<p>
				Soit <KatexInline formula={logCrit} />. (a) Montrez que
				<KatexInline formula={"(C_\\varphi)''(\\alpha,\\eta) > 0"}
				/>, donc que le minimum est unique. (b) Montrez que le signe de
				<KatexInline formula={'\\alpha^{*}'} /> est le signe de
				<KatexInline formula={'\\eta - \\tfrac12'} />. (c) Résolvez
				<KatexInline formula={"(C_\\varphi)'(\\alpha^{*},\\eta) = 0"}
				/>, montrez que <KatexInline formula={logitSolution} /> et calculez
				<KatexInline formula={"\\alpha^{*}(0.9)"} />.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.8" title="Le cas limite η = 1/2">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Si <KatexInline formula={'\\eta = \\tfrac12'} />, la fonction
					<KatexInline formula={'\\alpha \\mapsto C_\\varphi(\\alpha,\\tfrac12)'} /> est paire et
					strictement convexe (les pertes usuelles le sont), donc son unique minimum est atteint
					en <KatexInline formula={'\\alpha^{*} = 0'} />.
				</p>
				<p>
					<strong>(b)</strong> <KatexInline formula={halfCrit} /> ; le minimum en
					<KatexInline formula={'\\alpha = 0'} /> vaut <KatexInline formula={halfMin} />.
				</p>
				<p>
					<strong>(c)</strong> Non. En <KatexInline formula={'f = 0'} />, la règle
					<KatexInline formula={'h = \\mathbf 1_{f > 0}'} /> n'est pas déterminée (on peut choisir
					<KatexInline formula={'0'} /> ou <KatexInline formula={'1'} />), et les deux choix
					font une erreur avec probabilité <KatexInline formula={'\\tfrac12'} /> : aucun n'est
					moins bon. Le classifieur de Bayes n'est donc pas unique en ces points — c'est
					exactement le reflet de <KatexInline formula={'\\alpha^{*} = 0'} />, une marge nulle
					qui ne tranche pas.
				</p>
			{/snippet}
			<p>
				(a) Pour une perte convexe, que vaut <KatexInline formula={'\\alpha^{*}'} /> quand
				<KatexInline formula={'\\eta = \\tfrac12'} /> ? (b) Pour la logistique, calculez
				<KatexInline formula={halfCrit} />
				et la valeur minimale de <KatexInline
					formula={'C_\\varphi(\\cdot,\\tfrac12)'}
				/>. (c) Le classifieur de Bayes est-il identifiable sans ambiguïté en un point
				<KatexInline formula={'x'} /> tel que <KatexInline formula={'\\eta(x) = \\tfrac12'} /> ?
			</p>
		</ExercisePanel>

		<h2 id="decomposition-erreur">Décomposition de l'erreur</h2>

		<p>
			Ces quatre exercices retravaillent le Théorème 4.2 : l'identité de décomposition, l'interprétation
			des trois termes, le cas favorable, et une synthèse critique.
		</p>

		<ExercisePanel number="7.9" title="L'identité de décomposition, version algébrique">
			{#snippet solution()}
				<p>
					Toutes les quantités intermédiaires s'annulent : <KatexInline formula={telescoping} />.
				</p>
				<p>
					Spécialisons avec <KatexInline formula={'a = R(h_{\\hat f})'} />, <KatexInline
						formula={'b = R(h_{f^{*}})'}
					/>, <KatexInline formula={'c = R(h_{f^{**}})'} />, <KatexInline
						formula={'d = R^{*}'}
					/>:
				</p>
				<KatexBlock formula={riskTelescoping} />
				<p>
					Le terme <KatexInline formula={'A'} /> compare le modèle appris au meilleur modèle de la
					classe : c'est le terme d'<strong>estimation</strong>. Le terme <KatexInline
						formula={'B'}
					/>
					compare le meilleur modèle de la classe au meilleur modèle global : c'est le terme de
					<strong>calibration</strong>. Le terme <KatexInline formula={'C'} /> compare le meilleur
					modèle global au classifieur de Bayes : c'est le terme
					d'<strong>approximation</strong>.
				</p>
			{/snippet}
			<p>
				Soient <KatexInline formula={'a, b, c, d \\in \\mathbb R'} />. Montrer que
				<KatexInline formula={telescoping} />. En vous inspirant de cette identité, spécialisez à
				<KatexInline formula={'a = R(h_{\\hat f})'} />, <KatexInline
					formula={'b = R(h_{f^{*}})'}
				/>, <KatexInline formula={'c = R(h_{f^{**}})'} />, <KatexInline
					formula={'d = R^{*}'}
				/>
				et identifiez les trois termes <KatexInline formula={'A'} />, <KatexInline
					formula={'B'}
				/>, <KatexInline formula={'C'} /> du Théorème 4.2.
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.10" title="Logistique sur les hyperplans : quels termes s'annulent ?">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> Oui. La logistique est calibrée (<KatexInline
						formula={"\\varphi'(0) = -\\tfrac12 < 0"}
					/>, Théorème 4.1), donc <KatexInline formula={'h_{f^{**}} = h^{*}'} /> p.s. et
					<KatexInline formula={'C = 0'} />.
				</p>
				<p>
					<strong>(b)</strong> Non. <KatexInline formula={'B'} /> s'annule si
					<KatexInline formula={'f^{**} \\in \\mathcal F'} />, c'est-à-dire si la marge de Bayes
					<KatexInline formula={logitMargin} />
					est affine — ce qui n'est pas le cas en général (frontière de décision non linéaire).
				</p>
				<p>
					<strong>(c)</strong> Non. <KatexInline formula={'A'} /> est le prix de l'échantillon fini ;
					il est contrôlé <em>en espérance</em> par les inégalités de concentration uniformes de la
					partie VI (classe finie ou borne VC), mais n'est pas nul pour un échantillon donné.
				</p>
			{/snippet}
			<p>
				On minimise le <KatexInline formula={'\\varphi'} />-risque logistique empirique sur la classe
				<KatexInline formula={'\\mathcal F'} /> des hyperplans affines. Parmi les trois termes
				<KatexInline formula={'A'} />, <KatexInline formula={'B'} />, <KatexInline
					formula={'C'}
				/>
				du Théorème 4.2 : (a) <KatexInline formula={'C'} /> est-il nul ? (b) <KatexInline
					formula={'B'}
				/>
				l'est-il nécessairement ? (c) <KatexInline formula={'A'} /> l'est-il ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.11" title="Le cas favorable : φ calibrée et f** ∈ F">
			{#snippet solution()}
				<p>
					<strong>(a)</strong> <KatexInline formula={'f^{**}'} /> atteint le minimum global
					<KatexInline formula={'R_\\varphi^{*} = \\inf R_\\varphi'} />. Comme
					<KatexInline formula={'f^{**} \\in \\mathcal F'} />, la restriction de
					<KatexInline formula={'R_\\varphi'} /> à <KatexInline
						formula={'\\mathcal F'}
					/>
					est minimisée en <KatexInline formula={'f^{**}'} /> ; et <KatexInline
						formula={'f^{*}'}
					/>
					minimise cette même restriction, donc <KatexInline formula={bZero} /> (à un ensemble de
					probabilité nulle près si l'argmin n'est pas unique).
				</p>
				<p>
					<strong>(b)</strong> <KatexInline formula={'B = R(h_{f^{*}}) - R(h_{f^{**}}) = 0'} />, et
					comme <KatexInline formula={'\\varphi'} /> est calibrée, <KatexInline
						formula={cZero}
					/>.
				</p>
				<p>
					<strong>(c)</strong> Il ne reste que <KatexInline formula={onlyA} /> : l'excès de risque
					est <strong>purément un terme d'estimation</strong>, contrôlé en espérance par la
					concentration uniforme. C'est le régime idéal, et le message pratique de la partie :
					bonne perte (calibrée) + classe expressive (contenant <KatexInline
						formula={'f^{**}'}
					/>) + assez de données.
				</p>
			{/snippet}
			<p>
				Supposez que <KatexInline formula={'\\varphi'} /> soit calibrée et que
				<KatexInline formula={'f^{**} \\in \\mathcal F'} />. (a) Pourquoi
				<KatexInline formula={'f^{*} = f^{**}'} /> ? (b) Que valent alors
				<KatexInline formula={'B'} /> et <KatexInline formula={'C'} /> ? (c) À quoi se réduit
				l'excès de risque 0-1 ?
			</p>
		</ExercisePanel>

		<ExercisePanel number="7.12" title="Synthèse : « perte convexe donc Bayes-optimal » ?">
			{#snippet solution()}
				<p>
					L'affirmation confond trois conditions indépendantes, qui correspondent aux trois
					termes :
				</p>
				<ul>
					<li>
						<KatexInline formula={'A'} /> : minimiser le risque <strong>empirique</strong> ne
						minimise pas le risque <strong>populationnel</strong> ; il faut de la concentration
						uniforme (classe finie, ou borne de VC) et un échantillon assez grand.
					</li>
					<li>
						<KatexInline formula={'B'} /> : la classe <KatexInline
							formula={'\\mathcal F'}
						/>
						doit contenir <KatexInline formula={'f^{**}'} />, sinon l'approximation reste
						bornée par l'expressivité de la classe.
					</li>
					<li>
						<KatexInline formula={'C'} /> : la convexité ne suffit pas à la calibration ; il faut
						<KatexInline formula={"\\varphi'(0) < 0"} />.
					</li>
				</ul>
				<p>
					Contre-exemple pour la troisième condition : <KatexInline formula={counterex} />. Cette
					perte est convexe et différentiable, mais <KatexInline formula={critT2}
					/>, donc le classifieur ne dépend pas de <KatexInline
						formula={'\\eta'}
					/> : <KatexInline formula={'\\varphi'} /> n'est <strong>pas calibrée</strong> et
					<KatexInline formula={'C'} /> peut être strictement positif.
				</p>
				<p>
					La version correcte de l'affirmation : <KatexInline
						formula={'\\varphi'}
					/>
					calibrée + <KatexInline formula={'f^{**} \\in \\mathcal F'} /> + concentration uniforme ⇒
					l'excès de risque 0-1 tend vers 0 avec <KatexInline formula={'n'} />.
				</p>
			{/snippet}
			<p>
				Un collègue affirme : « Si j'optimise une perte convexe, mon classifieur est garanti
				Bayes-optimal. » À l'aide des trois termes <KatexInline formula={'A'} />, <KatexInline
					formula={'B'}
				/>, <KatexInline formula={'C'} />, décomposez ce qui manque dans cette affirmation, et
				donnez un contre-exemple de perte convexe non calibrée.
			</p>
		</ExercisePanel>
	</TheorySection>
</PageTemplate>
