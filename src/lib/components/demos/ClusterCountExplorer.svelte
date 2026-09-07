<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateBlobs,
		hierarchicalAgglomerative,
		cutPartition,
		cutByThreshold,
		silhouette,
		daviesBouldin
	} from '$lib/math/clustering.js';

	const K_MIN = 2;
	const K_MAX = 9;
	const SCATTER_W = 380;
	const SCATTER_H = 300;

	const CLUSTER_COLORS = [
		'var(--color-belief)',
		'var(--color-agent)',
		'var(--color-surprise)',
		'var(--color-positive)',
		'var(--color-text-muted)'
	];

	// Même jeu de données que le démo CAH pas-à-pas ; liaison de Ward, comme
	// suggéré par la frame « Choix du nombre de clusters » (évaluation par la
	// silhouette).
	const points = generateBlobs(3, 6, 5);
	const h = hierarchicalAgglomerative(points, 'ward');
	const maxH = Math.max(...h.merges.map((m) => m.height));

	interface KRow {
		K: number;
		s: number | null;
		d: number | null;
	}

	// Évaluation de chaque coupe K du dendrogramme (silhouette à maximiser,
	// Davies-Bouldin à minimiser) ; null si le critère n'est pas défini.
	const rows: KRow[] = [];
	for (let k = K_MIN; k <= K_MAX; k++) {
		const labelsK = cutPartition(h, k);
		let s: number | null = null;
		let d: number | null = null;
		try {
			s = silhouette(points, labelsK).sGlobal;
		} catch {
			s = null;
		}
		try {
			d = daviesBouldin(points, labelsK).DGlobal;
		} catch {
			d = null;
		}
		rows.push({ K: k, s, d });
	}

	const bestS = rows.reduce((best, row) =>
		row.s !== null && (best.s === null || row.s > best.s) ? row : best
	);
	const bestD = rows.reduce((best, row) =>
		row.d !== null && (best.d === null || row.d < best.d) ? row : best
	);

	let mode = $state<'k' | 'r'>('k');
	let K = $state(3);
	let r = $state(Math.round((maxH / 2) * 10) / 10);

	const currentLabels = $derived(mode === 'k' ? cutPartition(h, K) : cutByThreshold(h, r));
	const nbClusters = $derived(new Set(currentLabels).size);
	const currentS = $derived.by((): string => {
		try {
			return silhouette(points, currentLabels).sGlobal.toFixed(2);
		} catch {
			return '—';
		}
	});
	const currentD = $derived.by((): string => {
		try {
			return daviesBouldin(points, currentLabels).DGlobal.toFixed(2);
		} catch {
			return '—';
		}
	});

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

	const scatterPoints = $derived(points.map((p, i) => ({ x: p[0], y: p[1], group: currentLabels[i] })));

	const colorBy = (d: { group?: string | number }): string =>
		CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];

	const sPoints = rows
		.filter((row) => row.s !== null)
		.map((row) => [row.K, row.s] as [number, number]);
	const dPoints = rows
		.filter((row) => row.d !== null)
		.map((row) => [row.K, row.d] as [number, number]);

	const sVLines = $derived.by((): {
		x: number;
		stroke?: string;
		label?: string;
		strokeWidth?: number;
		opacity?: number;
		strokeDasharray?: string;
	}[] => {
		const lines: {
			x: number;
			stroke?: string;
			label?: string;
			strokeWidth?: number;
			opacity?: number;
			strokeDasharray?: string;
		}[] = [
			{ x: bestS.K, stroke: 'var(--color-positive)', label: `max (K = ${bestS.K})`, strokeWidth: 1.5 }
		];
		if (mode === 'k') {
			lines.unshift({ x: K, stroke: 'var(--color-agent)', label: `K = ${K}`, strokeWidth: 1.5, opacity: 0.9 });
		}
		return lines;
	});

	const dVLines = $derived.by((): {
		x: number;
		stroke?: string;
		label?: string;
		strokeWidth?: number;
		opacity?: number;
		strokeDasharray?: string;
	}[] => {
		const lines: {
			x: number;
			stroke?: string;
			label?: string;
			strokeWidth?: number;
			opacity?: number;
			strokeDasharray?: string;
		}[] = [
			{ x: bestD.K, stroke: 'var(--color-positive)', label: `min (K = ${bestD.K})`, strokeWidth: 1.5 }
		];
		if (mode === 'k') {
			lines.unshift({ x: K, stroke: 'var(--color-agent)', label: `K = ${K}`, strokeWidth: 1.5, opacity: 0.9 });
		}
		return lines;
	});
</script>

<div class="cc-demo">
	<div class="controls">
		<div class="control-row">
			<span class="control-label">mode</span>
			<div class="radio-group">
				<RadioButton value="k" label="fixer K" bind:groupValue={mode} />
				<RadioButton value="r" label="seuil r" bind:groupValue={mode} />
			</div>
		</div>
		{#if mode === 'k'}
			<Slider min={K_MIN} max={K_MAX} step={1} bind:value={K} label="nombre de clusters K" />
		{:else}
			<Slider min={0} max={Math.round(maxH)} step={0.1} bind:value={r} label="seuil r" />
		{/if}
	</div>

	<div class="grid">
		<div class="panel">
			<h3>silhouette globale s(K) — à maximiser</h3>
			<CurveChart
				curves={[{ points: sPoints, stroke: 'var(--color-belief)', curve: 'linear' }]}
				xDomain={[K_MIN, K_MAX]}
				height={170}
				yAxis={true}
				nTicks={8}
				vlines={sVLines}
				chartLabel={`meilleur K = ${bestS.K}`}
			/>
		</div>
		<div class="panel">
			<h3>indice de Davies-Bouldin D(K) — à minimiser</h3>
			<CurveChart
				curves={[{ points: dPoints, stroke: 'var(--color-agent)', curve: 'linear' }]}
				xDomain={[K_MIN, K_MAX]}
				height={170}
				yAxis={true}
				nTicks={8}
				vlines={dVLines}
				chartLabel={`meilleur K = ${bestD.K}`}
			/>
		</div>
		<div class="panel">
			<h3>partition courante — {nbClusters} cluster{nbClusters > 1 ? 's' : ''}</h3>
			<ScatterPlot
				points={scatterPoints}
				domainX={domainX}
				domainY={domainY}
				width={SCATTER_W}
				height={SCATTER_H}
				colorBy={colorBy}
				defaultSize={4.5}
			/>
		</div>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">{mode === 'k' ? 'K fixé' : 'seuil r'}</span>
			<span class="value">{mode === 'k' ? K : r.toFixed(1)}</span>
		</div>
		<div class="cell">
			<span class="label">clusters obtenus</span>
			<span class="value">{nbClusters}</span>
		</div>
		<div class="cell">
			<span class="label">silhouette s</span>
			<span class="value">{currentS}</span>
		</div>
		<div class="cell">
			<span class="label">Davies-Bouldin D</span>
			<span class="value">{currentD}</span>
		</div>
	</Metrics>

	<p class="caption">
		Chaque nœud du dendrogramme est une partition candidate. On évalue chaque taille K par la
		silhouette (à maximiser) ou l'indice de Davies-Bouldin (à minimiser) et on choisit la
		meilleure. En mode seuil, on arrête simplement de fusionner dès que la distance minimale
		dépasse r.
	</p>
</div>

<style>
	.cc-demo {
		display: grid;
		gap: 1rem;
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

	.radio-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
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
