<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateBlobs,
		kmeansLloyd,
		silhouette,
		daviesBouldin,
		type Point
	} from '$lib/math/clustering.js';

	const K_MIN = 2;
	const K_MAX = 6;
	const K_TRUE = 3;
	const W = 380;
	const H = 280;
	const PAD = 4;

	const CLUSTER_COLORS = ['var(--color-belief)', 'var(--color-agent)', 'var(--color-positive)'];

	let spread = $state(0.7);

	const points = $derived(generateBlobs(3, 8, 63, spread));

	interface VLineSpec {
		x: number;
		stroke?: string;
		label?: string;
		strokeWidth?: number;
		opacity?: number;
		labelOffset?: number;
	}

	interface SweepRow {
		K: number;
		s: number | null;
		d: number | null;
		labels: number[];
		centers: Point[];
	}

	// Balayage K = 2…6 : une exécution de Lloyd par K (graine 88 + K,
	// initialisation k-means++) puis évaluation interne du partitionnement
	// final. null = critère non défini (ex. cluster vide).
	const sweep = $derived.by((): SweepRow[] => {
		const rows: SweepRow[] = [];
		for (let K = K_MIN; K <= K_MAX; K++) {
			const run = kmeansLloyd(points, K, 88 + K, { init: 'pp' });
			const last = run.states[run.states.length - 1];
			let s: number | null = null;
			try {
				s = silhouette(points, last.labels).sGlobal;
			} catch {
				s = null;
			}
			let d: number | null = null;
			try {
				d = daviesBouldin(points, last.labels).DGlobal;
			} catch {
				d = null;
			}
			rows.push({ K, s, d, labels: last.labels, centers: last.centers });
		}
		return rows;
	});

	const argmaxS = $derived.by((): number | null => {
		let best: number | null = null;
		let bestVal = -Infinity;
		for (const row of sweep) {
			if (row.s !== null && row.s > bestVal) {
				bestVal = row.s;
				best = row.K;
			}
		}
		return best;
	});

	const argminD = $derived.by((): number | null => {
		let best: number | null = null;
		let bestVal = Infinity;
		for (const row of sweep) {
			if (row.d !== null && row.d < bestVal) {
				bestVal = row.d;
				best = row.K;
			}
		}
		return best;
	});

	const row3 = $derived(sweep.find((r) => r.K === K_TRUE)!);
	const s3 = $derived(row3.s);
	const d3 = $derived(row3.d);

	const k3Designated = $derived(
		argmaxS === null || argminD === null
			? 'critère non défini'
			: argmaxS === K_TRUE && argminD === K_TRUE
				? 'oui'
				: 'non'
	);

	const sPoints = $derived(
		sweep.filter((r) => r.s !== null).map((r) => [r.K, r.s] as [number, number])
	);
	const dPoints = $derived(
		sweep.filter((r) => r.d !== null).map((r) => [r.K, r.d] as [number, number])
	);
	const sDots = $derived(sPoints.map(([x, y]) => ({ x, y, fill: 'var(--color-belief)' })));
	const dDots = $derived(dPoints.map(([x, y]) => ({ x, y, fill: 'var(--color-agent)' })));

	// Ligne en x = 3 (valeur vraie) + ligne en argmax/argmin ; si elles
	// coïncident, la deuxième étiquette est décalée verticalement.
	const sVlines = $derived.by((): VLineSpec[] => {
		const lines: VLineSpec[] = [
			{ x: K_TRUE, stroke: 'var(--color-agent)', label: 'K = 3 (vrai)', strokeWidth: 1.5, opacity: 0.9 }
		];
		if (argmaxS !== null) {
			lines.push({
				x: argmaxS,
				stroke: 'var(--color-positive)',
				label: `argmax (K = ${argmaxS})`,
				strokeWidth: 1.5,
				labelOffset: argmaxS === K_TRUE ? 10 : undefined
			});
		}
		return lines;
	});

	const dVlines = $derived.by((): VLineSpec[] => {
		const lines: VLineSpec[] = [
			{ x: K_TRUE, stroke: 'var(--color-agent)', label: 'K = 3 (vrai)', strokeWidth: 1.5, opacity: 0.9 }
		];
		if (argminD !== null) {
			lines.push({
				x: argminD,
				stroke: 'var(--color-positive)',
				label: `argmin (K = ${argminD})`,
				strokeWidth: 1.5,
				labelOffset: argminD === K_TRUE ? 10 : undefined
			});
		}
		return lines;
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

	const scatterPoints = $derived(
		points.map((p, i) => ({ x: p[0], y: p[1], group: row3.labels[i] }))
	);

	function colorByGroup(d: { group?: string | number }): string {
		return CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];
	}

	// Miroir de la projection interne de ScatterPlot.svelte (pad = 4) pour
	// superposer les croix des centres du partitionnement K = 3.
	function projectX(x: number): number {
		return PAD + ((x - domainX[0]) / (domainX[1] - domainX[0])) * (W - 2 * PAD);
	}

	function projectY(y: number): number {
		return PAD + ((domainY[1] - y) / (domainY[1] - domainY[0])) * (H - 2 * PAD);
	}
</script>

<div class="internal-demo">
	<div class="controls">
		<Slider min={0.3} max={2.5} step={0.05} bind:value={spread} label="dispersion des nuages" />
	</div>

	<p class="hint">
		Faites varier la dispersion : au-delà d'un certain seuil, les trois nuages se confondent et les
		critères internes ne désignent plus forcément K = 3.
	</p>

	<div class="grid">
		<div class="panel">
			<h3>coefficient de silhouette s(K) — à maximiser</h3>
			<CurveChart
				curves={[{ points: sPoints, stroke: 'var(--color-belief)', curve: 'linear' }]}
				xDomain={[K_MIN, K_MAX]}
				height={180}
				yAxis={true}
				nTicks={5}
				vlines={sVlines}
				curveDots={sDots}
			/>
		</div>
		<div class="panel">
			<h3>indice de Davies-Bouldin D(K) — à minimiser</h3>
			<CurveChart
				curves={[{ points: dPoints, stroke: 'var(--color-agent)', curve: 'linear' }]}
				xDomain={[K_MIN, K_MAX]}
				height={180}
				yAxis={true}
				nTicks={5}
				vlines={dVlines}
				curveDots={dDots}
			/>
		</div>
		<div class="panel">
			<h3>partition obtenue pour K = 3</h3>
			<ScatterPlot
				points={scatterPoints}
				domainX={domainX}
				domainY={domainY}
				width={W}
				height={H}
				colorBy={colorByGroup}
				defaultSize={4.5}
				showAxes={true}
				showLabels={true}
			>
				{#snippet snippetOverlay()}
					<!-- Croix des centres (projection = miroir du pad = 4 de
					     ScatterPlot.svelte). -->
					{#each row3.centers as c, idx (idx)}
						{@const cx = projectX(c[0])}
						{@const cy = projectY(c[1])}
						<g
							stroke={CLUSTER_COLORS[idx % CLUSTER_COLORS.length]}
							stroke-width="2"
							opacity="0.8"
							pointer-events="none"
						>
							<line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} />
							<line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} />
						</g>
					{/each}
				{/snippet}
			</ScatterPlot>
		</div>
	</div>

	<Metrics align="left">
		<div class="cell">
			<span class="label">s(3)</span>
			<span class="value">{s3 === null ? '—' : s3.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">D(3)</span>
			<span class="value">{d3 === null ? '—' : d3.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">argmax s</span>
			<span class="value">{argmaxS === null ? '—' : `K = ${argmaxS}`}</span>
		</div>
		<div class="cell">
			<span class="label">K = 3 encore désigné ?</span>
			<span class="value">{k3Designated}</span>
		</div>
	</Metrics>

	<p class="caption">
		Le clustering n'étant pas supervisé, on évalue le partitionnement sans vérité terrain :
		évaluation interne (silhouette, Davies-Bouldin), évaluation externe (indice de Rand si l'on
		dispose de quelques étiquettes, avis d'expert a posteriori) et stabilité (collecter plus de
		données, perturber ou supprimer quelques observations, initialiser différemment ne devrait pas
		changer les conclusions). Ici : en augmentant la dispersion, les nuages se confondent — regardez
		si les critères internes continuent de désigner K = 3.
	</p>
</div>

<style>
	.internal-demo {
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

	@media (max-width: 700px) {
		.controls {
			grid-template-columns: 1fr;
		}
	}
</style>
