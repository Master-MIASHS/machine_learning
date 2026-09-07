<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateBlobs,
		kmeansLloyd,
		assignToNearestCenter,
		type Point
	} from '$lib/math/clustering.js';

	const SCATTER_W = 440;
	const SCATTER_H = 360;
	// Doit rester synchronisé avec le pad interne de ScatterPlot.svelte (pad = 4 px).
	const SCATTER_PAD = 4;
	// Résolution de la grille de rendu du diagramme de Voronoï.
	const GRID_N = 44;
	// Graine par défaut : l'exécution de Lloyd est déterministe.
	// Le bouton « Réinitialiser » incrémente cette graine pour re-tirer les
	// centroïdes initiaux (nouveau tirage aléatoire ou nouveau k-means++).
	const SEED = 42;
	let seed = $state(SEED);

	const CLUSTER_COLORS = [
		'var(--color-belief)',
		'var(--color-agent)',
		'var(--color-surprise)',
		'var(--color-positive)',
		'var(--color-text-muted)'
	];

	// « 2 lignes » : 18 points, x = 1..9 à y = −1 et x = 1..9 à y = +1.
	const linesDataset: Point[] = [];
	for (let x = 1; x <= 9; x++) {
		linesDataset.push([x, -1]);
		linesDataset.push([x, 1]);
	}

	let dataset = $state<'blobs' | 'lines'>('blobs');
	let K = $state(3);
	let init = $state<'random' | 'pp'>('random');
	let t = $state(0);
	let playing = $state(false);
	let showVoronoi = $state(false);

	const points = $derived(dataset === 'blobs' ? generateBlobs(3, 8, 21) : linesDataset);

	// Exécution complète de Lloyd (frame « Algorithme de Lloyd »), recalculée
	// quand le jeu de données, K, l'initialisation ou la graine changent.
	const result = $derived(kmeansLloyd(points, K, seed, { init }));

	// À chaque recomputation : on repart de t = 0 et on arrête la lecture.
	$effect(() => {
		void dataset;
		void K;
		void init;
		void seed;
		t = 0;
		playing = false;
	});

	const iterations = $derived(result.iterations);
	// Garde-fou : pendant la transition d'un changement de paramètre, t ne
	// dépasse jamais le nombre d'états disponibles.
	const tClamped = $derived(Math.min(t, iterations));
	const currentState = $derived(result.states[tClamped]);

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
		points.map((p, i) => ({ x: p[0], y: p[1], group: currentState.labels[i] }))
	);

	const colorBy = (d: { group?: string | number }): string =>
		CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];

	// Diagramme de Voronoï des centroïdes courants (étape 2 de la frame
	// « Algorithme de Lloyd » : chaque point xᵢ se trouve dans la cellule de
	// son centroïde le plus proche).
	// FALLBACK : aucun composant « diagramme de Voronoï » n'existe encore ; le
	// domaine est échantillonné sur une grille 44×44 et chaque cellule est
	// colorée selon le centroïde le plus proche (assignToNearestCenter sur
	// les centres de cellule). Remplacer par un vrai composant s'il est créé.
	// La grille est dessinée dans le snippetOverlay, donc AU-DESSUS des
	// points : l'opacité 0.08 garde les points et les centroïdes nettement
	// visibles (les cellules sont décoratives, pointer-events désactivés).
	const voronoiLabels = $derived.by((): number[] => {
		if (!showVoronoi) return [];
		const [x0, x1] = domainX;
		const [y0, y1] = domainY;
		const cells: Point[] = [];
		for (let j = 0; j < GRID_N; j++) {
			// j = 0 → rangée du haut du SVG (y = yMax en données).
			const cy = y1 - ((j + 0.5) / GRID_N) * (y1 - y0);
			for (let i = 0; i < GRID_N; i++) {
				cells.push([x0 + ((i + 0.5) / GRID_N) * (x1 - x0), cy]);
			}
		}
		return assignToNearestCenter(cells, currentState.centers);
	});

	const cellW = (SCATTER_W - 2 * SCATTER_PAD) / GRID_N;
	const cellH = (SCATTER_H - 2 * SCATTER_PAD) / GRID_N;

	const inertiaCurve = $derived(
		result.states.map((s, i) => [i, s.inertia] as [number, number])
	);

	function stepBack() {
		if (tClamped > 0) t--;
	}

	function stepForward() {
		if (tClamped < iterations) t++;
	}

	function togglePlay() {
		if (!playing && tClamped >= iterations) t = 0;
		playing = !playing;
	}

	// Réinitialiser : nouvelle graine → re-tirage des centroïdes initiaux
	// (aléatoire si init « random », nouveau k-means++ si init « pp »).
	// L'effet ci-dessus remet t à 0 et arrête la lecture.
	function resetCenters() {
		seed += 1;
	}

	// Lecture : t avance de 1 toutes les 700 ms jusqu'à t = T, puis s'arrête.
	// L'intervalle est effacé au nettoyage de l'effet (changement d'état,
	// démontage du composant).
	$effect(() => {
		if (!playing) return;
		const interval = setInterval(() => {
			if (tClamped >= iterations) playing = false;
			else t++;
		}, 700);
		return () => clearInterval(interval);
	});
</script>

<div class="kmeans-anim">
	<p class="intro">
		Suivez l'algorithme de Lloyd pas à pas : à chaque itération, chaque point rejoint le
		centroïde le plus proche (étape 2), puis chaque centroïde devient la moyenne de son
		cluster (étape 3). Faites varier K, l'initialisation, et activez le diagramme de
		Voronoï pour voir les cellules de chaque centroïde. Le bouton « Réinitialiser »
		re-tire les centroïdes initiaux : nouveau tirage aléatoire si l'initialisation est
		aléatoire, nouveau k-means++ sinon.
	</p>

	<div class="controls">
		<div class="control-row">
			<span class="control-label">jeu de données</span>
			<div class="radio-group">
				<RadioButton value="blobs" label="3 nuages" bind:groupValue={dataset} />
				<RadioButton value="lines" label="2 lignes" bind:groupValue={dataset} />
			</div>
		</div>
		<div class="control-row">
			<span class="control-label">initialisation</span>
			<div class="radio-group">
				<RadioButton
					value="random"
					label="aléatoire (points de données)"
					bind:groupValue={init}
				/>
				<RadioButton value="pp" label="k-means++" bind:groupValue={init} />
			</div>
		</div>
		<div class="control-row sliders">
			<Slider min={2} max={5} step={1} bind:value={K} label="nombre de clusters K" />
			<Slider min={0} max={iterations} step={1} bind:value={t} label="itération t" />
		</div>
		<div class="control-row buttons">
			<Button variant="outline" onclick={stepBack} disabled={tClamped === 0}>
				‹ Précédent
			</Button>
			<Button variant="outline" onclick={stepForward} disabled={tClamped === iterations}>
				Suivant ›
			</Button>
			<Button variant="primary" onclick={togglePlay}>{playing ? 'Pause' : 'Lecture'}</Button>
			<Button variant="outline" onclick={resetCenters}>Réinitialiser</Button>
			<Toggle bind:checked={showVoronoi} label="diagramme de Voronoï" />
		</div>
	</div>

	<div class="panels">
		<section class="panel">
			<h3>Affectations et centroïdes à l'itération {tClamped}</h3>
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
					{#if showVoronoi}
						{#each voronoiLabels as lab, idx (idx)}
							{@const i = idx % GRID_N}
							{@const j = (idx - i) / GRID_N}
							<rect
								x={SCATTER_PAD + i * cellW}
								y={SCATTER_PAD + j * cellH}
								width={cellW + 0.3}
								height={cellH + 0.3}
								fill={CLUSTER_COLORS[lab % CLUSTER_COLORS.length]}
								opacity="0.08"
								pointer-events="none"
							/>
						{/each}
					{/if}
					<!-- Centroïdes : croix ✚ plus grande que les points, avec un
					     fond pour les détacher du nuage et de la grille. -->
					{#each currentState.centers as c, ci (ci)}
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
			<h3>Inertie intra-classes</h3>
			<CurveChart
				curves={[
					{ points: inertiaCurve, stroke: 'var(--color-belief)', curve: 'linear' }
				]}
				xDomain={[0, iterations]}
				height={100}
				nTicks={iterations + 1}
				vlines={[
					{
						x: tClamped,
						stroke: 'var(--color-agent)',
						label: `t = ${tClamped}`,
						strokeWidth: 1.5
					}
				]}
				chartLabel="I_W(t) — non croissante (Proposition)"
			/>
		</section>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">itération</span>
			<span class="value">{tClamped} / {iterations}</span>
		</div>
		<div class="cell">
			<span class="label">I_W(t)</span>
			<span class="value">{currentState.inertia.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">convergence</span>
			<span class="value">{tClamped === iterations && result.converged ? 'oui (t = T)' : 'non'}</span>
		</div>
	</Metrics>

	<p class="caption">
		1. Choisir K centroïdes initiaux. 2. Affecter chaque point au centroïde le plus proche
		(cellule du diagramme de Voronoï). 3. Recalculer chaque centroïde comme la moyenne de son
		cluster. Répéter 2–3 jusqu'à ce que les affectations ne changent plus. Faites glisser t
		(ou Lecture) pour voir la convergence.
	</p>
</div>

<style>
	.kmeans-anim {
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

	.radio-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.sliders {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem 1.5rem;
		align-items: end;
	}

	.buttons {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.panels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
		gap: 1.25rem;
		align-items: start;
	}

	.panel {
		min-width: 0;
	}

	.panel h3 {
		margin: 0 0 0.5rem;
		font-size: 0.9375rem;
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
		.sliders {
			grid-template-columns: 1fr;
		}
	}
</style>
