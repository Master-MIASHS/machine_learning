<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateBlobs,
		kmeansLloyd,
		silhouette,
		elbowK,
		type KMeansResult
	} from '$lib/math/clustering.js';

	const SCATTER_W = 380;
	const SCATTER_H = 280;
	// Doit rester synchronisé avec le pad interne de ScatterPlot.svelte (pad = 4 px).
	const SCATTER_PAD = 4;

	const CLUSTER_COLORS = [
		'var(--color-belief)',
		'var(--color-agent)',
		'var(--color-surprise)',
		'var(--color-positive)',
		'var(--color-text-muted)'
	];

	// 4 nuages de 7 points : le coude de l'inertie doit se situer autour de
	// K = 4, comme dans la figure « coude.png » de la frame « Choix de K ».
	const points = generateBlobs(4, 7, 7);

	interface KRun {
		K: number;
		run: KMeansResult;
		inertia: number;
		s: number | null;
	}

	// Un run de Lloyd par valeur de K (seeds 55 + K, k-means++), précalculé :
	// I_W(K) = inertie finale ; s(K) = silhouette globale (K ≥ 2 seulement —
	// silhouette jette une erreur pour un seul cluster).
	const runs: KRun[] = [];
	for (let k = 1; k <= 8; k++) {
		const run = kmeansLloyd(points, k, 55 + k, { init: 'pp' });
		const fin = run.states[run.states.length - 1];
		let s: number | null = null;
		try {
			s = silhouette(points, fin.labels).sGlobal;
		} catch {
			s = null;
		}
		runs.push({ K: k, run, inertia: fin.inertia, s });
	}

	const inertiaByK = runs.map((r) => r.inertia);
	// Heuristique ILLUSTRATIVE du coude (point le plus éloigné de la corde de
	// la courbe) : les sources du cours décrivent le coude uniquement
	// visuellement, elles ne donnent aucune formule de détection.
	const kCoude = elbowK(inertiaByK) + 1;

	const sRuns = runs.filter((r) => r.s !== null);
	const argmaxS = sRuns.reduce((best, r) => ((r.s as number) > (best.s as number) ? r : best)).K;

	let K = $state(4);
	const current = $derived(runs[K - 1]);
	const currentFinal = $derived(current.run.states[current.run.states.length - 1]);

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

	const scatterPoints = $derived(
		points.map((p, i) => ({ x: p[0], y: p[1], group: currentFinal.labels[i] }))
	);

	const colorBy = (d: { group?: string | number }): string =>
		CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];

	const inertiaCurve = runs.map((r) => [r.K, r.inertia] as [number, number]);
	const inertiaDots = runs.map((r) => ({ x: r.K, y: r.inertia, fill: 'var(--color-belief)' }));
	const inertiaVLines = $derived([
		{ x: K, stroke: 'var(--color-agent)', label: `K = ${K}`, strokeWidth: 1.5, opacity: 0.9 },
		{ x: kCoude, stroke: 'var(--color-positive)', label: 'coude', strokeWidth: 1.5 }
	]);

	const sCurve = sRuns.map((r) => [r.K, r.s as number] as [number, number]);
	const sDots = sRuns.map((r) => ({ x: r.K, y: r.s as number, fill: 'var(--color-agent)' }));
	const sVLines = $derived([
		...(K >= 2
			? [{ x: K, stroke: 'var(--color-belief)', label: `K = ${K}`, strokeWidth: 1.5, opacity: 0.9 }]
			: []),
		{ x: argmaxS, stroke: 'var(--color-positive)', label: `max (K = ${argmaxS})`, strokeWidth: 1.5 }
	]);
</script>

<div class="elbow-demo">
	<p class="intro">
		K est un hyperparamètre à choisir : parcourez K de 1 à 8 et observez l'inertie
		intra-classes, le coefficient de silhouette et la partition obtenue pour chaque K.
	</p>

	<div class="controls">
		<div class="control-row">
			<span class="control-label">hyperparamètre</span>
			<Slider min={1} max={8} step={1} bind:value={K} label="nombre de clusters K" />
		</div>
	</div>

	<div class="grid">
		<div class="panel">
			<h3>inertie intra-classes I_W(K) — à minimiser</h3>
			<CurveChart
				curves={[
					{ points: inertiaCurve, stroke: 'var(--color-belief)', curve: 'linear' }
				]}
				xDomain={[1, 8]}
				height={180}
				yAxis={true}
				nTicks={8}
				curveDots={inertiaDots}
				vlines={inertiaVLines}
				chartLabel={`coude en K = ${kCoude}`}
			/>
		</div>
		<div class="panel">
			<h3>silhouette s(K) — à maximiser</h3>
			<CurveChart
				curves={[{ points: sCurve, stroke: 'var(--color-agent)', curve: 'linear' }]}
				xDomain={[2, 8]}
				height={180}
				yAxis={true}
				nTicks={7}
				curveDots={sDots}
				vlines={sVLines}
				chartLabel={`meilleur K = ${argmaxS}`}
			/>
		</div>
		<div class="panel">
			<h3>
				partition finale — {K} cluster{K > 1 ? 's' : ''}
			</h3>
			<ScatterPlot
				points={scatterPoints}
				domainX={domainX}
				domainY={domainY}
				width={SCATTER_W}
				height={SCATTER_H}
				colorBy={colorBy}
				defaultSize={4.5}
			>
				{#snippet snippetOverlay()}
					{#each currentFinal.centers as c, ci (ci)}
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
		</div>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">K</span>
			<span class="value">{K}</span>
		</div>
		<div class="cell">
			<span class="label">I_W(K)</span>
			<span class="value">{current.inertia.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">s(K)</span>
			<span class="value">{current.s === null ? '—' : current.s.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">K au coude</span>
			<span class="value">{kCoude}</span>
		</div>
	</Metrics>

	<p class="caption">
		L'inertie diminue forcément quand K augmente (jusqu'à n clusters !), donc on ne peut
		pas juste la minimiser. On choisit K au niveau du coude — le changement de pente — ici
		détecté par une heuristique illustrative (pas dans les sources du cours, qui décrivent
		le coude uniquement visuellement). La figure des diapositives montre un coude autour de
		K = 4 ; la silhouette, critère indépendant, doit désigner le même K.
	</p>
</div>

<style>
	.elbow-demo {
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

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
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
