<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateBlobs,
		clusterSizes,
		clusterCentroid,
		homogeneity,
		separability,
		daviesBouldin,
		silhouette,
		inertiaTotal,
		inertiaIntra,
		inertiaInter,
		type Point
	} from '$lib/math/clustering.js';

	// Frames « Homogénéité », « Séparabilité », « Indice de Davies-Bouldin »,
	// « Coefficient de silhouette », « Inertie intra et inter classes » of
	// marine/Cours/CM/coursClassif-5-Clustering.tex.

	const W = 440;
	const H = 440;
	const PAD = 4; // mirrors ScatterPlot.svelte's internal pad = 4 px
	const X_MIN = -6;
	const X_MAX = 7;
	const Y_MIN = -6.5;
	const Y_MAX = 6.5;
	const K = 3;
	const CLUSTER_COLORS = ['var(--color-belief)', 'var(--color-agent)', 'var(--color-surprise)'];

	const points: Point[] = generateBlobs(3, 8, 21);
	let labels = $state<number[]>(points.map((_, i) => Math.floor(i / 8)));
	let inspected = $state(1); // UI value 1..3, cluster index = inspected − 1

	const inspectedIdx = $derived(inspected - 1);

	const sizes = $derived(clusterSizes(labels, K));

	const centroids = $derived.by((): (Point | null)[] =>
		Array.from({ length: K }, (_, c) => (sizes[c] > 0 ? clusterCentroid(points, labels, c) : null))
	);

	const homogeneityGlobal = $derived(homogeneity(points, labels).TGlobal);

	// Empty clusters make separability / Davies-Bouldin throw: display « — ».
	const separabilityGlobal = $derived.by((): number | null => {
		try {
			return separability(points, labels).SGlobal;
		} catch {
			return null;
		}
	});

	const daviesBouldinGlobal = $derived.by((): number | null => {
		try {
			return daviesBouldin(points, labels).DGlobal;
		} catch {
			return null;
		}
	});

	// Silhouette needs ≥ 2 non-empty clusters; degenerate case → « — ».
	const silhouetteGlobal = $derived.by((): number | null => {
		try {
			return silhouette(points, labels).sGlobal;
		} catch {
			return null;
		}
	});

	const inertiaIntraValue = $derived(inertiaIntra(points, labels));
	const inertiaInterValue = $derived(inertiaInter(points, labels));
	const inertiaTotalValue = $derived(inertiaTotal(points));

	const scatterPoints = $derived(points.map((pt, i) => ({ x: pt[0], y: pt[1], group: labels[i] })));

	function colorByCluster(d: { group?: string | number }): string {
		const c = typeof d.group === 'number' ? d.group : 0;
		return CLUSTER_COLORS[c] ?? CLUSTER_COLORS[0];
	}

	// Mirrors ScatterPlot.svelte's internal projection exactly (pad = 4 px):
	// px = 4 + (x − xMin)/(xMax − xMin)·(width − 8), py = 4 + (yMax − y)/(yMax − yMin)·(height − 8).
	function projectX(v: number): number {
		return PAD + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
	}
	function projectY(v: number): number {
		return PAD + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);
	}

	function cycleLabel(i: number) {
		labels = labels.map((l, j) => (j === i ? (l + 1) % K : l));
	}

	function cycleFromKey(i: number) {
		return (event: KeyboardEvent) => {
			// Keyboard affordance is coarser than pointer: Enter/Space only
			// cycles the cluster; there is no arbitrary re-placement.
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			cycleLabel(i);
		};
	}
</script>

<div class="partition">
	<div class="controls">
		<div class="control-row">
			<span class="control-label">Cluster inspecté</span>
			<div class="radio-group">
				<RadioButton value={1} label="1" bind:groupValue={inspected} />
				<RadioButton value={2} label="2" bind:groupValue={inspected} />
				<RadioButton value={3} label="3" bind:groupValue={inspected} />
			</div>
		</div>
		<p class="hint">
			Cliquez sur un point (ou ciblez-le au clavier avec Tab et validez avec Entrée) pour le
			passer dans le cluster suivant.
		</p>
	</div>

	<ScatterPlot
		points={scatterPoints}
		domainX={[X_MIN, X_MAX]}
		domainY={[Y_MIN, Y_MAX]}
		width={W}
		height={H}
		colorBy={colorByCluster}
		defaultSize={5}
		showAxes={true}
		showLabels={true}
	>
		{#snippet snippetOverlay()}
			<!-- homogénéité T: inspected cluster's points → its own centroid -->
			{#if centroids[inspectedIdx]}
				{#each points as pt, i (i)}
					{#if labels[i] === inspectedIdx}
						<line
							x1={projectX(pt[0])}
							y1={projectY(pt[1])}
							x2={projectX(centroids[inspectedIdx]![0])}
							y2={projectY(centroids[inspectedIdx]![1])}
							stroke="var(--color-belief)"
							stroke-width="1"
							opacity="0.35"
							pointer-events="none"
						/>
					{/if}
				{/each}
			{/if}

			<!-- séparabilité S: inspected centroid ↔ other non-empty centroids -->
			{#if centroids[inspectedIdx]}
				{#each centroids as c, ci (ci)}
					{#if c && ci !== inspectedIdx}
						<line
							x1={projectX(centroids[inspectedIdx]![0])}
							y1={projectY(centroids[inspectedIdx]![1])}
							x2={projectX(c[0])}
							y2={projectY(c[1])}
							stroke="var(--color-surprise)"
							stroke-width="1.5"
							opacity="0.5"
							pointer-events="none"
						/>
					{/if}
				{/each}
			{/if}

			<!-- Centroids as ~9 px crosses; an empty cluster has no centroid. -->
			{#each centroids as c, ci (ci)}
				{#if c}
					<path
						d="M {projectX(c[0]) - 4.5} {projectY(c[1])} H {projectX(c[0]) + 4.5} M {projectX(c[0])} {projectY(c[1]) - 4.5} V {projectY(c[1]) + 4.5}"
						stroke="var(--color-text)"
						stroke-width="1.5"
						pointer-events="none"
					/>
				{/if}
			{/each}

			<!-- Hit areas: ScatterPlot does not expose per-point interaction, so
			     transparent circles drawn in the same SVG capture the clicks.
			     Keyboard affordance is coarser than pointer (cycle only, no
			     arbitrary placement). -->
			{#each points as pt, i (i)}
				<circle
					cx={projectX(pt[0])}
					cy={projectY(pt[1])}
					r="9"
					fill="transparent"
					class="point-hit"
					tabindex="0"
					role="button"
					aria-label={`Point ${i + 1}, cluster ${labels[i] + 1} — Entrée pour passer au cluster suivant`}
					onclick={() => cycleLabel(i)}
					onkeydown={cycleFromKey(i)}
				/>
			{/each}
		{/snippet}
	</ScatterPlot>

	<Metrics align="left">
		<div class="cell">
			<span class="label">T (homogénéité)</span>
			<span class="value">{homogeneityGlobal.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">S (séparabilité)</span>
			<span class="value">{separabilityGlobal !== null ? separabilityGlobal.toFixed(2) : '—'}</span>
		</div>
		<div class="cell">
			<span class="label">D (Davies-Bouldin)</span>
			<span class="value">{daviesBouldinGlobal !== null ? daviesBouldinGlobal.toFixed(2) : '—'}</span>
		</div>
		<div class="cell">
			<span class="label">s (silhouette)</span>
			<span class="value">{silhouetteGlobal !== null ? silhouetteGlobal.toFixed(2) : '—'}</span>
		</div>
		<div class="cell">
			<span class="label">I_W (intra)</span>
			<span class="value">{inertiaIntraValue.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">I_B (inter)</span>
			<span class="value">{inertiaInterValue.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">I (totale)</span>
			<span class="value">{inertiaTotalValue.toFixed(2)}</span>
		</div>
	</Metrics>

	<p class="caption">
		Cliquez sur un point pour le passer dans le cluster suivant. Regardez les critères réagir : T
		et I_W mesurent l'homogénéité (à minimiser), S la séparabilité (à maximiser), D et I_W se
		minimisent, s se maximise. Notez que I = I_W + I_B toujours.
	</p>
</div>

<style>
	.partition {
		display: grid;
		gap: 1rem;
	}

	.controls {
		display: grid;
		gap: 0.5rem;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.control-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		min-width: 4.5rem;
	}

	.radio-group {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.hint {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.point-hit {
		cursor: pointer;
	}

	.point-hit:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: 2px;
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
