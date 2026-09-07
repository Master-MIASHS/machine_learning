<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateBlobsWithOutliers,
		kmeansLloyd,
		type Point
	} from '$lib/math/clustering.js';

	const W = 440;
	const H = 360;
	const X_MIN = -14;
	const X_MAX = 14;
	const Y_MIN = -14;
	const Y_MAX = 14;
	const PAD = 4;

	// Centres des 3 nuages gaussiens (générateur generateBlobs : centres sur un
	// cercle de rayon 4, angle 2πj/3).
	const BLOB_CENTERS: Point[] = [0, 1, 2].map((j) => [
		4 * Math.cos((2 * Math.PI * j) / 3),
		4 * Math.sin((2 * Math.PI * j) / 3)
	]);

	const REAL_CLUSTER_COLORS = ['var(--color-belief)', 'var(--color-agent)', 'var(--color-positive)'];

	let nOutliers = $state(2);

	const K = $derived(3 + nOutliers);

	const data = $derived(generateBlobsWithOutliers(3, 7, nOutliers, 77));
	const points = $derived(data.points);
	const outlierIndices = $derived(data.outlierIndices);

	// Exécution déterministe : centres initiaux = les points aberrants (dans
	// l'ordre) puis les 3 centres de nuages — exactement K centres. On « laisse
	// une cellule de plus par aberrante » pour observer le phénomène.
	const run = $derived.by(() => {
		const initialCenters: Point[] = [
			...outlierIndices.map((i) => points[i]),
			...BLOB_CENTERS
		];
		return kmeansLloyd(points, K, 9, { initialCenters });
	});

	const finalLabels = $derived(run.states[run.states.length - 1].labels);

	const clusterSizes = $derived.by((): number[] => {
		const s = new Array(K).fill(0);
		for (const l of finalLabels) s[l]++;
		return s;
	});

	const detectedIndices = $derived.by((): number[] => {
		const out: number[] = [];
		finalLabels.forEach((l, i) => {
			if (clusterSizes[l] === 1) out.push(i);
		});
		return out.sort((a, b) => a - b);
	});

	const detectedSet = $derived(new Set(detectedIndices));

	const allDetected = $derived(
		outlierIndices.length > 0 &&
			outlierIndices.every((i) => detectedIndices.includes(i)) &&
			detectedIndices.every((i) => outlierIndices.includes(i))
	);

	// Correspondance cluster réel (multi-points) → couleur, dans l'ordre des
	// indices de cluster.
	const realClusterColor = $derived.by((): (c: number) => string => {
		const ids = Array.from(new Set(finalLabels))
			.filter((c) => clusterSizes[c] > 1)
			.sort((a, b) => a - b);
		return (c: number) => REAL_CLUSTER_COLORS[ids.indexOf(c)] ?? 'var(--color-text-muted)';
	});

	interface DisplayPoint {
		x: number;
		y: number;
		group: number | 'aberrant';
	}

	const scatterPoints = $derived.by((): DisplayPoint[] =>
		points.map((p, i) => ({ x: p[0], y: p[1], group: detectedSet.has(i) ? 'aberrant' : finalLabels[i] }))
	);

	function colorByGroup(d: { group?: string | number }): string {
		if (d.group === 'aberrant') return 'var(--color-surprise)';
		return realClusterColor(Number(d.group ?? 0));
	}

	function sizeByGroup(d: { group?: string | number }): number {
		return d.group === 'aberrant' ? 5.5 : 4.5;
	}

	// Miroir de la projection interne de ScatterPlot.svelte (pad = 4) pour
	// superposer l'anneau et l'étiquette des points détectés.
	function projectX(x: number): number {
		return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
	}

	function projectY(y: number): number {
		return PAD + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);
	}

	const detectedText = $derived(detectedIndices.length === 0 ? 'aucun' : detectedIndices.join(', '));
	const trueText = $derived(outlierIndices.length === 0 ? 'aucune' : outlierIndices.join(', '));
</script>

<div class="outlier-demo">
	<div class="controls">
		<Slider min={0} max={5} step={1} bind:value={nOutliers} label="nb d'observations aberrantes" />
	</div>

	<p class="hint">
		Augmentez le nombre d'observations aberrantes : chacune est très éloignée des nuages et finit
		seule dans un cluster — c'est précisément ce qui la signale comme aberrante.
	</p>

	<div class="plot-panel">
		<ScatterPlot
			points={scatterPoints}
			domainX={[X_MIN, X_MAX]}
			domainY={[Y_MIN, Y_MAX]}
			width={W}
			height={H}
			colorBy={colorByGroup}
			sizeBy={sizeByGroup}
			showAxes={true}
			showLabels={true}
		>
			{#snippet snippetOverlay()}
				<!-- Anneau + étiquette sur chaque point détecté comme aberrant
				     (projection = miroir du pad = 4 de ScatterPlot.svelte). -->
				{#each detectedIndices as i (i)}
					{@const px = projectX(points[i][0])}
					{@const py = projectY(points[i][1])}
					<circle
						cx={px}
						cy={py}
						r="9"
						fill="none"
						stroke="var(--color-surprise)"
						stroke-width="2"
						pointer-events="none"
					/>
					<text
						x={px}
						y={py - 12}
						text-anchor="middle"
						font-size="9"
						fill="var(--color-surprise)"
						pointer-events="none"
					>
						aberrante
					</text>
				{/each}
			{/snippet}
		</ScatterPlot>
	</div>

	<Metrics align="left">
		<div class="cell">
			<span class="label">K</span>
			<span class="value">{K}</span>
		</div>
		<div class="cell">
			<span class="label">clusters de taille 1</span>
			<span class="value">{detectedIndices.length}</span>
		</div>
		<div class="cell">
			<span class="label">indices détectés</span>
			<span class="value">{detectedText}</span>
		</div>
		<div class="cell">
			<span class="label">vraies aberrantes</span>
			<span class="value">{trueText}</span>
		</div>
		<div class="cell">
			<span class="label">toutes détectées ?</span>
			<span class="value">
				{#if nOutliers === 0}
					aucune aberrante — partition régulière en 3 clusters
				{:else if allDetected}
					oui
				{:else}
					non
				{/if}
			</span>
		</div>
	</Metrics>

	<p class="caption">
		L'algorithme des K-moyennes est sensible aux données aberrantes : une observation très éloignée
		finit seule dans un cluster, le reste des données formant K − 1 clusters. On peut exploiter ce
		comportement pour détecter les aberrantes — ce sont celles qui sont seules dans un cluster.
		Ici, on choisit K = 3 + nb d'aberrantes : on laisse une cellule de plus par aberrante pour
		voir le phénomène. Le partitionnement en K-médoïdes (le médoïde d'une classe est l'observation
		la plus centrale de la classe, à dissimilarité moyenne minimale) est plus robuste.
	</p>
</div>

<style>
	.outlier-demo {
		display: grid;
		gap: 1rem;
	}

	.controls {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem 1.5rem;
		align-items: end;
	}

	.hint {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.plot-panel {
		min-width: 0;
	}

	.plot-panel :global(svg) {
		max-width: 100%;
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

	@media (max-width: 700px) {
		.controls {
			grid-template-columns: 1fr;
		}
	}
</style>
