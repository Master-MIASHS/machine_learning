<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import RadioGroup from '$lib/components/controls/RadioGroup.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import { generateBlobs, type Point } from '$lib/math/clustering.js';
	import {
		componentsAtThreshold,
		gapMetrics,
		generateChainedDisks,
		generateDisksPair,
		meanGapCurve,
		mstKruskal,
		mstPathMaxEdge
	} from '$lib/math/mst.js';

	// Cadrage interne (non visible) : la caractérisation MST et la consistance
	// de Hartigan ne figurent pas dans course_sources/ — voir
	// expert/part3/lesson1/single-linkage-mst-hartigan.research.md (Gower &
	// Ross 1969 ; Hartigan 1975/1981 ; Penrose 1995 ; Sibson 1973).
	//
	// Jeux de données : petits modèles synthétiques seedés (pas de données de
	// cours) — deux disques compacts (proposition à deux populations,
	// déterministe), deux blobs gaussiens aux paramètres de la leçon (le gap
	// observé se referme avec n), deux disques + chaîne de points (chaînage).

	type Preset = 'disks' | 'gauss' | 'chain';

	const SEED = 20260914;
	const N_GRID: number[] = [10, 30, 60, 100, 150, 200, 300];
	const REPLICATES = 8;
	const DEFAULT_T: Record<Preset, number> = { disks: 3, gauss: 4, chain: 2 };

	// Projection du ScatterPlot miroir pour la surcharge MST : pad = 4,
	// plotW = width − 8 (cf. `project` dans charts/ScatterPlot.svelte).
	const W = 400;
	const H = 350;
	const PAD = 4;

	let preset = $state<Preset>('disks');
	let nPerPop = $state(40);
	let t = $state(DEFAULT_T.disks);
	let showMst = $state(true);

	// Le seuil repasse à sa valeur propre quand le préréglage change.
	$effect(() => {
		t = DEFAULT_T[preset];
	});

	const data = $derived.by((): { points: Point[]; labels: number[] } => {
		if (preset === 'disks') return generateDisksPair(nPerPop, SEED, 1, 6);
		if (preset === 'gauss') {
			const pts = generateBlobs(2, nPerPop, SEED);
			return {
				points: pts,
				labels: Array.from({ length: 2 * nPerPop }, (_, i) => (i < nPerPop ? 0 : 1))
			};
		}
		return generateChainedDisks(nPerPop, Math.max(3, Math.round(nPerPop / 5)), SEED, 1, 6, 0.8);
	});

	const points = $derived(data.points);
	const labels = $derived(data.labels);
	const n = $derived(points.length);

	const domainX = $derived<[number, number]>(preset === 'gauss' ? [-5.5, 5.5] : [-4.5, 4.5]);
	const domainY = $derived<[number, number]>(preset === 'gauss' ? [-3, 3] : [-2.5, 2.5]);

	const mst = $derived(mstKruskal(points));

	// Composantes du graphe de seuil G_t — les clusters de single-linkage
	// (théorème de Gower & Ross 1969 : mêmes composantes que le sous-arbre MST
	// d'arêtes de poids ≤ t).
	const gT = $derived(componentsAtThreshold(points, t));

	// Métriques à deux populations : pour le préréglage « chaînage », les
	// points de la chaîne (étiquette 2) sont exclus du max intra / min inter.
	const twoPop = $derived.by((): { points: Point[]; labels: number[] } => {
		if (preset !== 'chain') return { points, labels };
		const idx = labels.map((l, i) => (l < 2 ? i : -1)).filter((i) => i >= 0);
		return { points: idx.map((i) => points[i]), labels: idx.map((i) => labels[i]) };
	});
	const gap = $derived(gapMetrics(twoPop.points, twoPop.labels));

	// Récupération : G_t a exactement deux composantes et chaque vraie classe
	// tient dans une composante (proposition du cas à deux populations).
	const recovered = $derived.by((): boolean => {
		if (preset === 'chain') return false;
		if (gT.count !== 2) return false;
		const compOfLabel = new Map<number, number>();
		for (let i = 0; i < n; i++) {
			const seen = compOfLabel.get(labels[i]);
			if (seen === undefined) compOfLabel.set(labels[i], gT.labels[i]);
			else if (seen !== gT.labels[i]) return false;
		}
		const [c0, c1] = [...compOfLabel.values()];
		return c0 !== c1;
	});

	// Courbe du gap observé g(n) = min inter − max intra (moyenne de
	// REPLICATES réplicas seedés) : disques → g(n) > 0 pour tout n (limite
	// δ − 4r = 2) ; gaussiennes (paramètres de la leçon) → g(n) croise 0 vers
	// n ≈ 100–150 (fichier de recherche, §3.3).
	const gapCurve = $derived.by((): [number, number][] => {
		if (preset === 'chain') return [];
		const make =
			preset === 'disks'
				? (nv: number, s: number) => generateDisksPair(nv, s, 1, 6)
				: (nv: number, s: number) => ({
						points: generateBlobs(2, nv, s),
						labels: Array.from({ length: 2 * nv }, (_, i) => (i < nv ? 0 : 1))
					});
		const c = meanGapCurve(SEED, N_GRID, REPLICATES, make);
		return c.n.map((nv, i) => [nv, c.meanGap[i]] as [number, number]);
	});

	const curveYDomain = $derived.by((): [number, number] => {
		const ys = gapCurve.map((p) => p[1]);
		if (ys.length === 0) return [0, 1];
		const lo = Math.min(0, ...ys);
		const hi = Math.max(0, ...ys);
		return [lo - 0.3, hi + 0.3];
	});

	const scatterPoints = $derived.by(() =>
		points.map((p, i) => ({ x: p[0], y: p[1], group: gT.labels[i] as number }))
	);
	// Palette à angle d'or déterministe : les couleurs de composantes sont
	// dynamiques (une par composante de G_t), donc hors variables de thème ;
	// les couleurs sémantiques du site restent sur les annotations.
	const compColor = (c: number): string => `hsl(${(c * 137.508) % 360} 60% 42%)`;

	// Surcharge MST : arêtes projetées, celles de poids ≤ t mises en évidence
	// (leur sous-graphe connexe = les composantes de G_t, d'après Gower &
	// Ross 1969 — la démo lit littéralement le théorème).
	const mstEdges = $derived.by(() => {
		const plotW = W - PAD * 2;
		const plotH = H - PAD * 2;
		const px = (x: number): number => PAD + ((x - domainX[0]) / (domainX[1] - domainX[0])) * plotW;
		const py = (y: number): number => PAD + ((domainY[1] - y) / (domainY[1] - domainY[0])) * plotH;
		return mst.edges.map((e) => {
			const a = points[e.u];
			const b = points[e.v];
			return {
				x1: px(a[0]),
				y1: py(a[1]),
				x2: px(b[0]),
				y2: py(b[1]),
				on: e.weight <= t
			};
		});
	});

	// Préréglage « chaînage » : niveau de la fusion qui relie un point de
	// chaque disque dans le MST — bien plus petit que le min inter, la
	// signature du chaînage dans le dendrogramme.
	const chainBridgeLevel = $derived.by((): number | null => {
		if (preset !== 'chain') return null;
		const a = labels.indexOf(0);
		const b = labels.indexOf(1);
		if (a < 0 || b < 0) return null;
		return mstPathMaxEdge(mst, a, b);
	});
</script>

<div class="mst-demo">
	<RadioGroup label="Paysage">
		<RadioButton value="disks" bind:groupValue={preset} label="Deux disques (compact)" />
		<RadioButton value="gauss" bind:groupValue={preset} label="Deux blobs gaussiens" />
		<RadioButton value="chain" bind:groupValue={preset} label="Chaînage" />
	</RadioGroup>

	<div class="controls-row">
		<div class="slider-cell">
			<Slider min={10} max={150} step={5} bind:value={nPerPop} label="Points par population n" unit="" />
		</div>
		<div class="slider-cell">
			<Slider min={0} max={8} step={0.05} bind:value={t} label="Seuil t (distance)" unit="" />
		</div>
		<Toggle bind:checked={showMst} label="Afficher le MST" />
	</div>

	<div class="charts-grid">
		<div class="chart-cell">
			<h4>Points, MST et graphe de seuil G_t</h4>
			<ScatterPlot
				points={scatterPoints}
				domainX={domainX}
				domainY={domainY}
				width={W}
				height={H}
				colorBy={(d) => compColor(d.group as number)}
			>
				{#snippet snippetOverlay()}
					{#if showMst}
						<g class="mst-layer">
							{#each mstEdges as e}
								<line
									x1={e.x1}
									y1={e.y1}
									x2={e.x2}
									y2={e.y2}
									class="mst-edge"
									class:on={e.on}
								/>
							{/each}
						</g>
					{/if}
				{/snippet}
			</ScatterPlot>
			<p class="preset-caption">
				{#if preset === 'disks'}
					Deux disques uniformes de rayon 1, centres à distance 6 (support compact) : à tout
					t dans le gap, les composantes de G_t sont exactement les deux disques — pour tout
					échantillon.
				{:else if preset === 'gauss'}
					Deux blobs gaussiens (σ = 0,7, centres à distance 8 — les paramètres de la leçon) :
					les queues gaussiennes referment le gap quand n croît, et le chaînage finit par
					faire le pont.
				{:else}
					Deux disques + une chaîne de points espacés de ≈ 0,8 : pour t > 0,8 la chaîne relie
					les deux disques en un seul cluster, alors qu'ils sont à distance ≥ 4 l'un de
					l'autre.
				{/if}
			</p>
		</div>

		<div class="chart-cell">
			<h4>Gap observé g(n) = min inter − max intra</h4>
			{#if preset !== 'chain'}
				<CurveChart
					curves={[
						{ points: gapCurve, stroke: 'var(--color-belief)' },
						{
							points: [
								[N_GRID[0], 0],
								[N_GRID[N_GRID.length - 1], 0]
							],
							stroke: 'var(--color-text-muted)',
							strokeDasharray: '6 4',
							strokeWidth: 1,
							curve: 'linear'
						}
					]}
					xDomain={[N_GRID[0], N_GRID[N_GRID.length - 1]]}
					yDomain={curveYDomain}
					vlines={[{ x: nPerPop, stroke: 'var(--color-surprise)', label: 'n actuel' }]}
					legend={[
						{
							label: 'moyenne sur ' + REPLICATES + ' réplicas seedés',
							color: 'var(--color-belief)'
						}
					]}
					chartLabel={preset === 'disks' ? 'support compact' : 'gaussiennes'}
				/>
				<p class="preset-caption">
					{#if preset === 'disks'}
						Le gap reste strictement positif pour tout n (limite δ − 4r = 2) : la
						proposition à deux populations tient, toute taille d'échantillon confondue.
					{:else}
						Le gap décroît et croise zéro vers n ≈ 100–150 par blob : au-delà, aucun seuil
						t ne sépare plus les deux blobs — les queues gaussiennes font le pont.
					{/if}
				</p>
			{:else}
				<div class="chain-note">
					<p>
						Niveau de la fusion reliant un point de chaque disque dans le MST (plus
						lourde arête du chemin) :
					</p>
					<p class="chain-value">{chainBridgeLevel?.toFixed(2) ?? '—'}</p>
					<p>
						… alors que la plus petite distance entre disques vaut
						{gap.interMin.toFixed(2)}. Le dendrogramme de single-linkage fusionne les deux
						disques à un niveau bien plus bas que leur vraie séparation : c'est la
						signature du chaînage.
					</p>
				</div>
			{/if}
		</div>
	</div>

	{#if preset !== 'chain'}
		{#if recovered}
			<p class="banner ok" role="status">
				À t = {t.toFixed(2)}, les composantes de G_t sont exactement les deux populations : la
				partition en 2 clusters est la vraie.
			</p>
		{:else if gT.count === 1}
			<p class="banner warn" role="status">
				À ce seuil, tout est un seul cluster : un pont (chaînage) relie les deux populations.
			</p>
		{:else}
			<p class="banner info" role="status">
				Le seuil est sous le max intra ({gap.intraMax.toFixed(2)}) : des points d'une même
				population ne sont pas encore reliés.
			</p>
		{/if}
	{/if}

	<div class="metrics">
		<div class="metric">
			<span class="metric-label">composantes de G_t</span>
			<span class="metric-value">{gT.count}</span>
		</div>
		<div class="metric">
			<span class="metric-label">max intra</span>
			<span class="metric-value">{gap.intraMax.toFixed(2)}</span>
		</div>
		<div class="metric">
			<span class="metric-label">min inter</span>
			<span class="metric-value">{gap.interMin.toFixed(2)}</span>
		</div>
		<div class="metric">
			<span class="metric-label">gap observé</span>
			<span class="metric-value" class:pos={gap.gap > 0} class:neg={gap.gap <= 0}>
				{gap.gap.toFixed(2)}
			</span>
		</div>
	</div>

	<p class="demo-note">
		Petit problème synthétique seedé — illustration du mécanisme, pas un benchmark. Théorèmes :
		Gower &amp; Ross (1969) ; Hartigan (1975, 1981) ; Penrose (1995).
	</p>
</div>

<style>
	.mst-demo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.slider-cell {
		flex: 1;
		min-width: 12rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 700px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	.chart-cell h4 {
		margin: 0 0 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.preset-caption {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.chain-note {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 6px);
		padding: 0.875rem 1rem;
		font-size: 0.8125rem;
		height: 100%;
		box-sizing: border-box;
	}

	.chain-note p {
		margin: 0 0 0.5rem;
	}

	.chain-note p:last-child {
		margin-bottom: 0;
	}

	.chain-value {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-surprise);
	}

	.mst-edge {
		stroke: var(--color-text-muted);
		stroke-width: 0.75;
		opacity: 0.3;
	}

	.mst-edge.on {
		stroke: var(--color-positive);
		stroke-width: 1.5;
		opacity: 0.9;
	}

	.banner {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm, 6px);
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.banner.ok {
		color: var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 9%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-positive) 35%, transparent);
	}

	.banner.warn {
		color: var(--color-surprise);
		background: color-mix(in srgb, var(--color-surprise) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-surprise) 35%, transparent);
	}

	.banner.info {
		color: var(--color-text-muted);
		background: color-mix(in srgb, var(--color-text-muted) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-text-muted) 30%, transparent);
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.625rem;
	}

	@media (max-width: 700px) {
		.metrics {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 6px);
	}

	.metric-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.metric-value {
		font-family: var(--font-mono);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-belief);
	}

	.metric-value.pos {
		color: var(--color-positive);
	}

	.metric-value.neg {
		color: var(--color-surprise);
	}

	.demo-note {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
