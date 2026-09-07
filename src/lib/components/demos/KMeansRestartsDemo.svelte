<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateBlobs,
		kmeansLloyd,
		type KMeansResult,
		type Point
	} from '$lib/math/clustering.js';

	const SCATTER_W = 340;
	const SCATTER_H = 300;
	// Doit rester synchronisé avec le pad interne de ScatterPlot.svelte (pad = 4 px).
	const SCATTER_PAD = 4;
	const N_RESTARTS = 20;

	const CLUSTER_COLORS = [
		'var(--color-belief)',
		'var(--color-agent)',
		'var(--color-surprise)',
		'var(--color-positive)',
		'var(--color-text-muted)'
	];

	const points = generateBlobs(3, 8, 21);

	// Exécution « malchanceuse » : les 3 centroïdes de départ sont des points
	// de données pris dans le nuage 0 (les points sont en ordre de nuage,
	// indices 0..7). NOTE : le tirage [p0, p1, p2] d'origine converge en fait
	// vers le minimum global (vérifié numériquement) ; en énumérant les 56
	// triplets de points du nuage 0, 23 tombent dans un minimum local. Le
	// triplet (0, 2, 7) ci-dessous donne le plus lisible d'entre eux : le
	// nuage 0 est coupé en deux (3 + 5 points) tandis que les nuages 1 et 2
	// fusionnent en un seul cluster de 16 points, I_W ≈ 198.45 au lieu de
	// 25.18 pour le minimum global.
	const badInit: Point[] = [points[0], points[2], points[7]];
	const badRun = kmeansLloyd(points, 3, 0, { initialCenters: badInit });
	const badFinal = badRun.states[badRun.states.length - 1];

	// N redémarrages déterministes (seeds 21865..21884, initialisation
	// aléatoire de points de données). Plage choisie pour la lisibilité : les
	// redémarrages 1 et 2 tombent dans le même minimum local que
	// l'initialisation malchanceuse (I_W = 198.4546, bit-à-bit identique à
	// badFinal.inertia), le 3e dans un autre minimum local (I_W = 201.1652),
	// et à partir du 4e on atteint le minimum global (I_W = 25.1849) — la
	// courbe du meilleur I_W chute donc visiblement à i = 4 puis plateaute.
	const restarts: { inertia: number; run: KMeansResult }[] = [];
	for (let i = 0; i < N_RESTARTS; i++) {
		const run = kmeansLloyd(points, 3, 21865 + i, { init: 'random' });
		restarts.push({ inertia: run.states[run.states.length - 1].inertia, run });
	}
	// bestAfter[i] = meilleure inertie finale parmi les i+1 premiers
	// redémarrages (courbe non croissante, plateau au minimum global).
	const bestAfter: number[] = [];
	{
		let runningBest = Infinity;
		for (const r of restarts) {
			runningBest = Math.min(runningBest, r.inertia);
			bestAfter.push(runningBest);
		}
	}

	let nstart = $state(5);

	const bestIdx = $derived.by(() => {
		let best = 0;
		for (let i = 1; i < nstart; i++) {
			if (restarts[i].inertia < restarts[best].inertia) best = i;
		}
		return best;
	});
	const bestFinal = $derived(restarts[bestIdx].run.states[restarts[bestIdx].run.states.length - 1]);
	const bestInertiaN = $derived(bestAfter[nstart - 1]);
	// Gain en % par rapport au minimum local ; null si les deux sont égaux.
	const gainPct = $derived(
		badFinal.inertia === bestInertiaN
			? null
			: ((badFinal.inertia - bestInertiaN) / badFinal.inertia) * 100
	);

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

	const badPoints = $derived(
		points.map((p, i) => ({ x: p[0], y: p[1], group: badFinal.labels[i] }))
	);
	const bestPoints = $derived(
		points.map((p, i) => ({ x: p[0], y: p[1], group: bestFinal.labels[i] }))
	);

	const colorBy = (d: { group?: string | number }): string =>
		CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];

	const bestCurve = $derived(bestAfter.map((v, i) => [i + 1, v] as [number, number]));
	const badCurve = [
		[1, badFinal.inertia],
		[N_RESTARTS, badFinal.inertia]
	] as [number, number][];
</script>

<div class="restarts-demo">
	<p class="intro">
		Mêmes données, même K = 3 : tout dépend de l'initialisation. À gauche, une
		initialisation malchanceuse (3 points de données pris dans le même nuage) ; à
		droite, la meilleure partition parmi n redémarrages aléatoires.
	</p>

	<div class="controls">
		<div class="control-row">
			<span class="control-label">redémarrages</span>
			<Slider
				min={1}
				max={N_RESTARTS}
				step={1}
				bind:value={nstart}
				label="nombre de redémarrages"
			/>
		</div>
	</div>

	<div class="panels">
		<section class="panel">
			<h3>initialisation malchanceuse (minimum local)</h3>
			<ScatterPlot
				points={badPoints}
				domainX={domainX}
				domainY={domainY}
				width={SCATTER_W}
				height={SCATTER_H}
				colorBy={colorBy}
				defaultSize={4.5}
			>
				{#snippet snippetOverlay()}
					{#each badFinal.centers as c, ci (ci)}
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
			<h3>meilleure des {nstart} initialisation{nstart > 1 ? 's' : ''}</h3>
			<ScatterPlot
				points={bestPoints}
				domainX={domainX}
				domainY={domainY}
				width={SCATTER_W}
				height={SCATTER_H}
				colorBy={colorBy}
				defaultSize={4.5}
			>
				{#snippet snippetOverlay()}
					{#each bestFinal.centers as c, ci (ci)}
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
			<h3>I_W après i redémarrages</h3>
			<CurveChart
				curves={[
					{ points: bestCurve, stroke: 'var(--color-belief)', curve: 'linear' },
					{
						points: badCurve,
						stroke: 'var(--color-surprise)',
						strokeDasharray: '6 4',
						curve: 'linear'
					}
				]}
				xDomain={[1, N_RESTARTS]}
				height={160}
				nTicks={5}
				yAxis={true}
				vlines={[
					{
						x: nstart,
						stroke: 'var(--color-agent)',
						label: `n = ${nstart}`,
						strokeWidth: 1.5
					}
				]}
				legend={[
					{ label: 'meilleur I_W après i redémarrages', color: 'var(--color-belief)' },
					{
						label: 'I_W du minimum local',
						color: 'var(--color-surprise)',
						kind: 'dashed-line'
					}
				]}
				chartLabel="I_W finale vs redémarrages"
			/>
		</section>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">I_W (minimum local)</span>
			<span class="value">{badFinal.inertia.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">I_W (meilleur après {nstart})</span>
			<span class="value">{bestInertiaN.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">gain</span>
			<span class="value">{gainPct === null ? '0 %' : `${gainPct.toFixed(2)} %`}</span>
		</div>
	</Metrics>

	<p class="caption">
		La Proposition garantit que l'inertie intra-classes diminue à chaque itération
		(preuve : lemme 22.1 de Shalev-Shwartz &amp; Ben-David) — mais l'algorithme peut
		s'arrêter dans un minimum local. Solution : répéter la procédure avec différentes
		initialisations aléatoires et garder la meilleure partition.
	</p>
</div>

<style>
	.restarts-demo {
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
		display: grid;
		gap: 0.9rem;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.control-label {
		min-width: 7.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
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
