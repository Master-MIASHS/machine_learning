<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateConcentricRings,
		kmeansLloyd,
		assignToNearestCenter,
		type Point
	} from '$lib/math/clustering.js';

	const W = 440;
	const H = 380;
	const X_MIN = -5;
	const X_MAX = 5;
	const Y_MIN = -5;
	const Y_MAX = 5;
	const PAD = 4;
	const GRID = 44;

	const CLUSTER_COLORS = ['var(--color-belief)', 'var(--color-agent)', 'var(--color-positive)'];

	// Deux anneaux concentriques : 12 points internes (r ≈ 1.5, indices 0–11)
	// puis 12 points externes (r ≈ 3.5, indices 12–23).
	const points = generateConcentricRings(12, 55);
	const N_INNER = 12;

	// Exécution 2D (Lloyd, k = 3, initialisation k-means++, graine fixe 4).
	const run2d = kmeansLloyd(points, 3, 4, { init: 'pp' });
	const labels2d = run2d.states[run2d.states.length - 1].labels;
	const centers2d = run2d.states[run2d.states.length - 1].centers;
	const iw2d = run2d.states[run2d.states.length - 1].inertia;

	// Levée radiale φ(x, y) = (x, y, ‖x‖²) : sépare les anneaux par le rayon.
	// SIMULATION ILLUSTRATIVE — les sources du cours mentionnent seulement
	// « l'astuce du noyau » (frame « Remarques ») et renvoient à la section
	// 12.4.3 d'Azencott, sans la formuler ; c'est la levée radiale classique.
	const lifted: Point[] = points.map(([x, y]) => [x, y, x * x + y * y]);
	const runLift = kmeansLloyd(lifted, 3, 4, { init: 'pp' });
	const labelsLift = runLift.states[runLift.states.length - 1].labels;
	const iwlift = runLift.states[runLift.states.length - 1].inertia;

	// Anneaux retrouvés par la levée ? Les 12 points internes forment un
	// cluster unique et aucun cluster ne mélange internes et externes.
	const ringsRecovered = (() => {
		const innerCluster = labelsLift[0];
		const innerAll = labelsLift.slice(0, N_INNER).every((l) => l === innerCluster);
		if (!innerAll) return false;
		// Un cluster « mélange » les anneaux s'il contient des points internes
		// et des points externes.
		const outerCount = new Array(3).fill(0);
		const total = new Array(3).fill(0);
		labelsLift.forEach((l, i) => {
			total[l]++;
			if (i >= N_INNER) outerCount[l]++;
		});
		return outerCount.every((o, l) => o === 0 || o === total[l]);
	})();

	let useKernel = $state(false);

	const activeLabels = $derived(useKernel ? labelsLift : labels2d);

	const scatterPoints = $derived(points.map((p, i) => ({ x: p[0], y: p[1], group: activeLabels[i] })));

	function colorByGroup(d: { group?: string | number }): string {
		return CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];
	}

	// Fond de Voronoï des centres 2D : grille 44×44, chaque cellule peinte de
	// la couleur du centre le plus proche (assignToNearestCenter).
	// FALLBACK : SVG fait main — aucun composant du projet ne dessine un
	// diagramme de Voronoï ; à remplacer par un vrai composant s'il existe.
	function projectX(x: number): number {
		return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
	}

	function projectY(y: number): number {
		return PAD + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);
	}

	const voronoiCells = (() => {
		const step = (X_MAX - X_MIN) / GRID;
		const cells: { x: number; y: number; w: number; h: number; color: string }[] = [];
		for (let i = 0; i < GRID; i++) {
			for (let j = 0; j < GRID; j++) {
				const xc = X_MIN + (i + 0.5) * step;
				const yc = Y_MIN + (j + 0.5) * step;
				const label = assignToNearestCenter([[xc, yc]], centers2d)[0];
				cells.push({
					x: projectX(X_MIN + i * step),
					y: projectY(Y_MIN + (j + 1) * step),
					w: projectX(X_MIN + (i + 1) * step) - projectX(X_MIN + i * step),
					h: projectY(Y_MIN + j * step) - projectY(Y_MIN + (j + 1) * step),
					color: CLUSTER_COLORS[label % CLUSTER_COLORS.length]
				});
			}
		}
		return cells;
	})();
</script>

<div class="shape-demo">
	<div class="controls">
		<Toggle
			bind:checked={useKernel}
			label="astuce du noyau φ(x, y) = (x, y, x² + y²)"
		/>
	</div>

	<p class="hint">
		Avec l'astuce du noyau, la partition affichée est celle calculée par Lloyd sur les points
		levés φ(x, y) = (x, y, x² + y²), projetée ici en 2D. Le fond coloré est le diagramme de
		Voronoï des centres de l'exécution 2D (toujours affiché) : cellules convexes contre anneaux
		courbes.
	</p>

	<div class="plot-stack">
		<svg class="voronoi-bg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
			{#each voronoiCells as cell, idx (idx)}
				<rect x={cell.x} y={cell.y} width={cell.w} height={cell.h} fill={cell.color} opacity="0.08" />
			{/each}
		</svg>
		<ScatterPlot
			points={scatterPoints}
			domainX={[X_MIN, X_MAX]}
			domainY={[Y_MIN, Y_MAX]}
			width={W}
			height={H}
			colorBy={colorByGroup}
			defaultSize={5}
			showAxes={true}
			showLabels={true}
		>
			{#snippet snippetOverlay()}
				<!-- Croix des centres 2D (projection = miroir du pad = 4 de
				     ScatterPlot.svelte). -->
				{#each centers2d as c, idx (idx)}
					{@const cx = projectX(c[0])}
					{@const cy = projectY(c[1])}
					<g stroke="var(--color-text)" stroke-width="2" opacity="0.75" pointer-events="none">
						<line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} />
						<line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} />
					</g>
				{/each}
			{/snippet}
		</ScatterPlot>
	</div>

	<Metrics align="left">
		<div class="cell">
			<span class="label">I_W (2D)</span>
			<span class="value">{iw2d.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">I_W (φ-levé)</span>
			<span class="value">{iwlift.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">anneaux retrouvés ?</span>
			<span class="value">{ringsRecovered ? 'oui' : 'non'}</span>
		</div>
	</Metrics>

	<p class="caption">
		Les centroïdes forment un diagramme de Voronoï : les clusters de K-moyennes sont donc convexes,
		et les deux anneaux ne peuvent pas être retrouvés en 2D. L'astuce du noyau — élever les données
		par φ(x, y) = (x, y, x² + y²) avant d'appliquer Lloyd — rend les anneaux séparables et permet de
		les retrouver. Ici c'est une simulation illustrative : les sources du cours mentionnent seulement
		l'astuce du noyau et renvoient à la section 12.4.3 d'Azencott, sans la formuler. Les deux
		inerties I_W sont calculées dans des espaces de dimensions différentes (2D et 3D) : elles ne sont
		donc pas directement comparables et ne sont données qu'à titre indicatif.
	</p>
</div>

<style>
	.shape-demo {
		display: grid;
		gap: 1rem;
	}

	.controls {
		display: grid;
		gap: 0.9rem;
	}

	.hint {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.plot-stack {
		position: relative;
		width: 100%;
		max-width: 440px;
		margin: 0 auto;
		aspect-ratio: 440 / 380;
	}

	/* Les deux calques SVG (fond de Voronoï + ScatterPlot) partagent le même
	   viewBox 440×380 : ils coïncident pixel par pixel. */
	.plot-stack svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
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
