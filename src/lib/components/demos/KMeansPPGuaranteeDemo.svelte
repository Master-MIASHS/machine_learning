<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import {
		generateBlobs,
		kmeansLloyd,
		type KMeansResult,
		type Point
	} from '$lib/math/clustering.js';

	// ── Formules (script : Svelte ne parse pas les backslashes dans le template) ──
	const phiOpt = String.raw`\varphi_{\mathrm{OPT}}`;
	const boundFormula = String.raw`8(\ln 3 + 2) \cdot \varphi_{\mathrm{OPT}}`;
	const avBoundFormula = String.raw`\mathbb E[\phi] \le 8(\ln k + 2)\,\varphi_{\mathrm{OPT}}`;

	// Démonstration de la garantie de k-means++ (Arthur & Vassilvitskii, SODA 2007,
	// Théorème 3.1 : E[φ] ≤ 8(ln k + 2)·φ_OPT, borne pire cas en espérance sur le
	// tirage du seeding). Voir expert/part3/lesson2/kmeanspp-garantie.research.md.
	// Mêmes données que KMeansRestartsDemo (section 2.2 de la leçon) :
	// 24 points, 3 nuages gaussiens bien séparés, K = 3.

	const SCATTER_W = 340;
	const SCATTER_H = 300;
	// Doit rester synchronisé avec le pad interne de ScatterPlot.svelte (pad = 4 px).
	const SCATTER_PAD = 4;
	const K = 3;
	const N_RANDOM = 30;
	// Facteur de la borne du Théorème 3.1 (A&V 2007) pour k = 3 : ≈ 24.79.
	const BOUND_FACTOR = 8 * (Math.log(K) + 2);

	const CLUSTER_COLORS = [
		'var(--color-belief)',
		'var(--color-agent)',
		'var(--color-surprise)',
		'var(--color-positive)',
		'var(--color-text-muted)'
	];

	const points = generateBlobs(3, 8, 21);

	// Centroïdes analytiques de generateBlobs(3, 8, 21) : k nuages de spread 0.7
	// placés sur un cercle de rayon 4 (angles 0, 2π/3, 4π/3).
	const TRUE_CENTERS: Point[] = [
		[4, 0],
		[-2, 2 * Math.sqrt(3)],
		[-2, -2 * Math.sqrt(3)]
	];

	// Référence φ_OPT : Lloyd initialisé aux vrais centroïdes (partition « évidente »)
	// — minimum global 25.1849, déjà documenté dans KMeansRestartsDemo.
	const optRun = kmeansLloyd(points, K, 0, { initialCenters: TRUE_CENTERS });
	const optCost = optRun.states.at(-1)!.inertia;
	const boundCost = BOUND_FACTOR * optCost;

	// Le bouton « Réinitialiser » incrémente cette graine : nouveaux 30 tirages
	// aléatoires et nouveau tirage k-means++.
	let baseSeed = $state(31101);

	const randomRuns: KMeansResult[] = $derived.by(() => {
		const runs = [];
		for (let i = 0; i < N_RANDOM; i++) {
			runs.push(kmeansLloyd(points, K, baseSeed + i, { init: 'random' }));
		}
		return runs;
	});
	const randomFinals = $derived(
		randomRuns.map((r) => r.states[r.states.length - 1].inertia)
	);
	const ppRun = $derived(kmeansLloyd(points, K, baseSeed + 1000, { init: 'pp' }));
	const ppCost = $derived(ppRun.states[ppRun.states.length - 1].inertia);

	const worstIdx = $derived.by(() => {
		let b = 0;
		for (let i = 1; i < N_RANDOM; i++) {
			if (randomFinals[i] > randomFinals[b]) b = i;
		}
		return b;
	});
	const worstCost = $derived(randomFinals[worstIdx]);

	const domainX = $derived.by((): [number, number] => {
		const xs = points.map((p) => p[0]);
		const lo = Math.min(...xs);
		const hi = Math.max(...xs);
		const pad = (hi - lo) * 0.12 || 1;
		return [lo - pad, hi + pad];
	});

	const domainY = $derived.by((): [number, number] => {
		const ys = points.map((p) => p[1]);
		const lo = Math.min(...ys);
		const hi = Math.max(...ys);
		const pad = (hi - lo) * 0.12 || 1;
		return [lo - pad, hi + pad];
	});

	// Projection identique à celle de ScatterPlot.svelte (pad = 4) :
	// px = 4 + (x − xMin)/(xMax − xMin)·(width − 8),
	// py = 4 + (yMax − y)/(yMax − yMin)·(height − 8).
	const projX = (x: number): number =>
		SCATTER_PAD + ((x - domainX[0]) / (domainX[1] - domainX[0])) * (SCATTER_W - 2 * SCATTER_PAD);
	const projY = (y: number): number =>
		SCATTER_PAD + ((domainY[1] - y) / (domainY[1] - domainY[0])) * (SCATTER_H - 2 * SCATTER_PAD);

	const worstState = $derived(randomRuns[worstIdx].states[randomRuns[worstIdx].states.length - 1]);
	const ppState = $derived(ppRun.states[ppRun.states.length - 1]);

	const worstPoints = $derived(
		points.map((p, i) => ({ x: p[0], y: p[1], group: worstState.labels[i] }))
	);
	const ppPoints = $derived(
		points.map((p, i) => ({ x: p[0], y: p[1], group: ppState.labels[i] }))
	);

	const colorBy = (d: { group?: string | number }): string =>
		CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];

	// Courbe : strip des coûts finaux des 30 runs aléatoires (x = 1..30) ;
	// le run k-means++ (une seule valeur) est un point sur la droite (x = 31) —
	// il coïncide ici exactement avec φ_OPT (les deux lignes se superposeraient
	// sinon, puisque sur ces données bien séparées le seeding k-means++ est
	// pratiquement toujours exact).
	const randomCurve = $derived(randomFinals.map((v, i) => [i + 1, v] as [number, number]));
	const optCurve: [number, number][] = [
		[1, optCost],
		[31, optCost]
	];
	const boundCurve: [number, number][] = [
		[1, boundCost],
		[31, boundCost]
	];
	const ppDot = $derived({
		x: 31,
		y: ppCost,
		r: 5,
		fill: 'var(--color-belief)',
		stroke: 'var(--color-bg)',
		strokeWidth: 1.5
	});

	function reseed() {
		baseSeed += 101;
	}
</script>

<div class="pp-demo">
	<p class="intro">
		Mêmes données que la section 2.2, même K = 3. À gauche : le pire des {N_RANDOM} runs
		Lloyd avec initialisation aléatoire uniforme (un minimum local) ; à droite : un run
		k-means++. La courbe (échelle logarithmique) compare leurs coûts finaux à
		<KatexInline formula={phiOpt} /> (référence : Lloyd initialisé aux vrais centroïdes des 3
		nuages) et à la borne <KatexInline formula={boundFormula} /> du théorème d'Arthur–Vassilvitskii.
	</p>

	<div class="controls">
		<Button variant="outline" onclick={reseed}>Réinitialiser (nouveau tirage)</Button>
	</div>

	<div class="panels">
		<section class="panel">
			<h3>pire run aléatoire (minimum local)</h3>
			<ScatterPlot
				points={worstPoints}
				domainX={domainX}
				domainY={domainY}
				width={SCATTER_W}
				height={SCATTER_H}
				colorBy={colorBy}
				defaultSize={4.5}
			>
				{#snippet snippetOverlay()}
					{#each worstState.centers as c, ci (ci)}
						<g pointer-events="none">
							<circle
								cx={projX(c[0])}
								cy={projY(c[1])}
								r="7.5"
								fill="var(--color-bg)"
								opacity="0.85"
							/>
							<line
								x1={projX(c[0]) - 6}
								y1={projY(c[1])}
								x2={projX(c[0]) + 6}
								y2={projY(c[1])}
								stroke={CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}
								stroke-width="3"
								stroke-linecap="round"
							/>
							<line
								x1={projX(c[0])}
								y1={projY(c[1]) - 6}
								x2={projX(c[0])}
								y2={projY(c[1]) + 6}
								stroke={CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}
								stroke-width="3"
								stroke-linecap="round"
							/>
						</g>
					{/each}
				{/snippet}
			</ScatterPlot>
		</section>

		<section class="panel">
			<h3>run k-means++ (D² sampling + Lloyd)</h3>
			<ScatterPlot
				points={ppPoints}
				domainX={domainX}
				domainY={domainY}
				width={SCATTER_W}
				height={SCATTER_H}
				colorBy={colorBy}
				defaultSize={4.5}
			>
				{#snippet snippetOverlay()}
					{#each ppState.centers as c, ci (ci)}
						<g pointer-events="none">
							<circle
								cx={projX(c[0])}
								cy={projY(c[1])}
								r="7.5"
								fill="var(--color-bg)"
								opacity="0.85"
							/>
							<line
								x1={projX(c[0]) - 6}
								y1={projY(c[1])}
								x2={projX(c[0]) + 6}
								y2={projY(c[1])}
								stroke={CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}
								stroke-width="3"
								stroke-linecap="round"
							/>
							<line
								x1={projX(c[0])}
								y1={projY(c[1]) - 6}
								x2={projX(c[0])}
								y2={projY(c[1]) + 6}
								stroke={CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}
								stroke-width="3"
								stroke-linecap="round"
							/>
						</g>
					{/each}
				{/snippet}
			</ScatterPlot>
		</section>

		<section class="panel">
			<h3>coût final φ (échelle log)</h3>
			<CurveChart
				curves={[
					{ points: randomCurve, stroke: 'var(--color-surprise)', curve: 'linear', strokeWidth: 1.5 },
					{ points: optCurve, stroke: 'var(--color-positive)', strokeDasharray: '6 4', curve: 'linear' },
					{
						points: boundCurve,
						stroke: 'var(--color-agent)',
						strokeDasharray: '2 4',
						opacity: 0.75,
						curve: 'linear'
					}
				]}
				xDomain={[1, 31]}
				yDomain={[8, 800]}
				yScaleType="log"
				height={190}
				nTicks={5}
				yAxis={true}
				curveDots={[ppDot]}
				legend={[
					{ label: 'coûts finaux — 30 runs aléatoires', color: 'var(--color-surprise)' },
					{ label: 'k-means++ (1 run)', color: 'var(--color-belief)' },
					{ label: 'φ_OPT', color: 'var(--color-positive)', kind: 'dashed-line' },
					{ label: 'borne 8(ln 3 + 2)·φ_OPT', color: 'var(--color-agent)', kind: 'dashed-line' }
				]}
				chartLabel="coût final φ"
			/>
		</section>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">pire run aléatoire</span>
			<span class="value">{worstCost.toFixed(1)}  ({(worstCost / optCost).toFixed(2)} × φ_OPT)</span>
		</div>
		<div class="cell">
			<span class="label">k-means++</span>
			<span class="value">{ppCost.toFixed(1)}  ({(ppCost / optCost).toFixed(2)} × φ_OPT)</span>
		</div>
		<div class="cell">
			<span class="label">borne du théorème</span>
			<span class="value">8(ln 3 + 2) ≈ {BOUND_FACTOR.toFixed(1)}</span>
		</div>
	</Metrics>

	<p class="caption">
		Petit jeu de données seedé (24 points, 3 nuages — mêmes données que la section 2.2). La
		garantie <KatexInline formula={avBoundFormula} /> (Arthur &amp; Vassilvitskii 2007) est en
		espérance sur le tirage du seeding et pire cas sur toutes les données : elle est très au-dessus
		des coûts observés ici, et un tirage isolé peut la violer. Le run k-means++ tombe sur ces
		données bien séparées exactement sur <KatexInline formula={phiOpt} /> (1 itération de Lloyd) —
		c'est le régime O(1) sous séparation d'Ostrovsky et al. (2006). Les itérations de Lloyd ne
		font que diminuer le coût (Proposition de la leçon) : la borne s'applique donc aussi au coût
		final. « Réinitialiser » redessine les 30 tirages aléatoires et le tirage k-means++ : la
		garantie est une moyenne sur les tirages, pas une promesse par run.
	</p>
</div>

<style>
	.pp-demo {
		display: grid;
		gap: 1rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.controls {
		display: flex;
	}

	.panels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
		gap: 1.25rem;
		align-items: start;
	}

	.panel {
		min-width: 0;
	}

	.panel h3 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.panel :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}

	.caption {
		margin: 0;
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-epistemic);
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
</style>
