<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import {
		generateBlobs,
		hierarchicalAgglomerative,
		cutPartition,
		dendrogramLayout,
		type Linkage
	} from '$lib/math/clustering.js';

	const N = 18;
	const SCATTER_W = 380;
	const SCATTER_H = 330;
	// Doit rester synchronisé avec le pad interne de ScatterPlot.svelte (pad = 4 px).
	const SCATTER_PAD = 4;

	// Géométrie du dendrogramme dessiné à la main.
	// FALLBACK : aucun composant « dendrogramme » n'existe encore ; si un tel
	// composant est construit, ce SVG doit être remplacé par le vrai composant.
	const DENDRO_W = 460;
	const DENDRO_H = 380;
	const DENDRO_ML = 52; // marge gauche : place pour les étiquettes x1..x18
	const DENDRO_MR = 16;
	const DENDRO_TOP = 24;
	const DENDRO_BOT = 348; // y = 0 (les feuilles)
	const DENDRO_AXIS_X = 30;

	const LINKAGES: { key: Linkage; label: string }[] = [
		{ key: 'single', label: 'lien simple' },
		{ key: 'complete', label: 'lien complet' },
		{ key: 'average', label: 'lien moyen' },
		{ key: 'centroid', label: 'lien centroïdal' },
		{ key: 'ward', label: 'distance de Ward' }
	];

	const CLUSTER_COLORS = [
		'var(--color-belief)',
		'var(--color-agent)',
		'var(--color-surprise)',
		'var(--color-positive)',
		'var(--color-text-muted)'
	];

	// Deux lignes horizontales (x = 1..9 à y = −1 et y = +1) : rend les
	// différences de liaison très visibles, comme dans le TP.
	const linesDataset: number[][] = [];
	for (let x = 1; x <= 9; x++) {
		linesDataset.push([x, -1]);
		linesDataset.push([x, 1]);
	}

	let dataset = $state<'blobs' | 'lines'>('blobs');
	let linkage = $state<Linkage>('ward');
	let t = $state(0);
	let K = $state(3);
	let playing = $state(false);

	const points = $derived(dataset === 'blobs' ? generateBlobs(3, 6, 5) : linesDataset);

	const h = $derived(hierarchicalAgglomerative(points, linkage));
	const layout = $derived(dendrogramLayout(h));

	// id de nœud → membres feuilles (feuilles 0..n−1 puis nœuds internes dans
	// l'ordre des fusions) : sert à mettre en évidence les deux clusters
	// fusionnés à l'étape t et à tracer la partition courante.
	const nodeMembers = $derived.by((): number[][] => {
		const map: number[][] = [];
		for (let i = 0; i < N; i++) map.push([i]);
		for (let m = 0; m < h.merges.length; m++) {
			const { a, b } = h.merges[m];
			map.push([...map[a], ...map[b]]);
		}
		return map;
	});

	// Partition courante à l'étape t : après t fusions il reste n − t clusters
	// (t = 0 → singletons).
	const labels = $derived(cutPartition(h, N - t));

	const lastMerge = $derived(t >= 1 ? h.merges[t - 1] : null);

	const highlighted = $derived.by((): number[] => {
		if (!lastMerge) return [];
		return [...nodeMembers[lastMerge.a], ...nodeMembers[lastMerge.b]];
	});

	const mergeCentroids = $derived.by((): [number, number][] => {
		if (!lastMerge) return [];
		const centroid = (node: number): [number, number] => {
			const members = nodeMembers[node];
			const cx = members.reduce((s, i) => s + points[i][0], 0) / members.length;
			const cy = members.reduce((s, i) => s + points[i][1], 0) / members.length;
			return [cx, cy];
		};
		return [centroid(lastMerge.a), centroid(lastMerge.b)];
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

	// Projection identique à celle de ScatterPlot.svelte (pad = 4) :
	// px = 4 + (x − xMin)/(xMax − xMin)·(width − 8),
	// py = 4 + (yMax − y)/(yMax − yMin)·(height − 8).
	const projX = (x: number): number =>
		SCATTER_PAD + ((x - domainX[0]) / (domainX[1] - domainX[0])) * (SCATTER_W - 2 * SCATTER_PAD);
	const projY = (y: number): number =>
		SCATTER_PAD + ((domainY[1] - y) / (domainY[1] - domainY[0])) * (SCATTER_H - 2 * SCATTER_PAD);

	const scatterPoints = $derived(points.map((p, i) => ({ x: p[0], y: p[1], group: labels[i] })));

	const colorBy = (d: { group?: string | number }): string =>
		CLUSTER_COLORS[Number(d.group ?? 0) % CLUSTER_COLORS.length];

	const maxH = $derived(Math.max(...h.merges.map((m) => m.height)));
	const dendroDx = $derived((DENDRO_W - DENDRO_ML - DENDRO_MR) / (N - 1));
	const xOf = (node: number): number => DENDRO_ML + layout.x[node] * dendroDx;
	// hauteur → y svg : 0 en bas (DENDRO_BOT), hauteur max de fusion près du
	// haut avec ~8 % de marge.
	const yOf = (height: number): number =>
		DENDRO_BOT - (height / (maxH * 1.08)) * (DENDRO_BOT - DENDRO_TOP);

	const drawnMerges = $derived(h.merges.slice(0, t));
	// Coupe K : la partition après n − K fusions correspond à couper le
	// dendrogramme à la hauteur de la (n − K)-ième fusion, celle qui relierait
	// deux des K clusters.
	const cutHeight = $derived(h.merges[N - K].height);

	const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
	const subscript = (i: number): string =>
		String(i)
			.split('')
			.map((c) => SUBSCRIPTS[Number(c)])
			.join('');
	const leafLabel = (i: number): string => `x${subscript(i + 1)}`;

	function stepBack() {
		if (t > 0) t--;
	}

	function stepForward() {
		if (t < N - 1) t++;
	}

	function togglePlay() {
		if (!playing && t >= N - 1) t = 0;
		playing = !playing;
	}

	// On arrête la lecture (et donc on efface l'intervalle) quand le jeu de
	// données ou la liaison change.
	$effect(() => {
		void dataset;
		void linkage;
		playing = false;
	});

	$effect(() => {
		if (!playing) return;
		const interval = setInterval(() => {
			if (t >= N - 1) playing = false;
			else t++;
		}, 700);
		return () => clearInterval(interval);
	});
</script>

<div class="cah-demo">
	<div class="controls">
		<div class="control-row">
			<span class="control-label">jeu de données</span>
			<div class="radio-group">
				<RadioButton value="blobs" label="3 nuages" bind:groupValue={dataset} />
				<RadioButton value="lines" label="2 lignes" bind:groupValue={dataset} />
			</div>
		</div>
		<div class="control-row">
			<span class="control-label">liaison</span>
			<div class="radio-group">
				{#each LINKAGES as l (l.key)}
					<RadioButton value={l.key} label={l.label} bind:groupValue={linkage} />
				{/each}
			</div>
		</div>
		<div class="control-row sliders">
			<Slider min={0} max={N - 1} step={1} bind:value={t} label="étape t" />
			<Slider min={2} max={12} step={1} bind:value={K} label="coupe K" />
		</div>
		<div class="control-row buttons">
			<Button variant="outline" onclick={stepBack} disabled={t === 0}>‹ Précédent</Button>
			<Button variant="outline" onclick={stepForward} disabled={t === N - 1}>Suivant ›</Button>
			<Button variant="primary" onclick={togglePlay}>{playing ? 'Pause' : 'Lecture'}</Button>
		</div>
		<details class="linkage-legend">
			<summary>Interprétation des liaisons (frames « Distance entre deux clusters »)</summary>
			<ul>
				<li>
					<strong>lien simple</strong> —
					<KatexInline
						formula={String.raw`d(\mathcal{C}_k,\mathcal{C}_\ell)=\min_{(x,y)\in\mathcal{C}_k\times\mathcal{C}_\ell}\,d(x,y)`}
					/>
					: fusion si deux éléments des clusters sont proches.
				</li>
				<li>
					<strong>lien complet</strong> —
					<KatexInline
						formula={String.raw`d(\mathcal{C}_k,\mathcal{C}_\ell)=\max_{(x,y)\in\mathcal{C}_k\times\mathcal{C}_\ell}\,d(x,y)`}
					/>
					: fusion si tous les éléments des clusters sont proches.
				</li>
				<li>
					<strong>lien moyen</strong> —
					<KatexInline
						formula={String.raw`d(\mathcal{C}_k,\mathcal{C}_\ell)=\tfrac{1}{|\mathcal{C}_k|\,|\mathcal{C}_\ell|}\sum_{x\in\mathcal{C}_k}\sum_{y\in\mathcal{C}_\ell}d(x,y)`}
					/>
					: fusion si la distance moyenne entre éléments est faible.
				</li>
				<li>
					<strong>lien centroïdal</strong> —
					<KatexInline formula={String.raw`d(\mathcal{C}_k,\mathcal{C}_\ell)=d(\mu_k,\mu_\ell)`} />
					: fusion si la distance entre centroïdes est faible.
				</li>
				<li>
					<strong>distance de Ward</strong> —
					<KatexInline
						formula={String.raw`d(\mathcal{C}_k,\mathcal{C}_\ell)=\tfrac{|\mathcal{C}_k|\,|\mathcal{C}_\ell|}{|\mathcal{C}_k|+|\mathcal{C}_\ell|}\,\lVert\mu_k-\mu_\ell\rVert^{2}`}
					/>
					: gain de variance intra-classe de la fusion (Proposition, frame
					« Distance entre deux clusters »).
				</li>
			</ul>
		</details>
	</div>

	<div class="panels">
		<section class="panel">
			<h3>Partition courante — après {t} fusion{t > 1 ? 's' : ''}</h3>
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
					{#if lastMerge}
						{#each highlighted as idx (idx)}
							<circle
								cx={projX(points[idx][0])}
								cy={projY(points[idx][1])}
								r="8"
								fill="none"
								stroke="var(--color-surprise)"
								stroke-width="1.5"
								opacity="0.9"
								pointer-events="none"
							/>
						{/each}
						<line
							x1={projX(mergeCentroids[0][0])}
							y1={projY(mergeCentroids[0][1])}
							x2={projX(mergeCentroids[1][0])}
							y2={projY(mergeCentroids[1][1])}
							stroke="var(--color-surprise)"
							stroke-width="1.5"
							stroke-dasharray="4 3"
							pointer-events="none"
						/>
						<text
							x={(projX(mergeCentroids[0][0]) + projX(mergeCentroids[1][0])) / 2}
							y={(projY(mergeCentroids[0][1]) + projY(mergeCentroids[1][1])) / 2 - 6}
							text-anchor="middle"
							font-size="11"
							font-weight="600"
							fill="var(--color-surprise)"
							pointer-events="none"
						>d = {lastMerge.height.toFixed(2)}</text>
					{/if}
				{/snippet}
			</ScatterPlot>
		</section>

		<section class="panel">
			<h3>Dendrogramme — {t} fusion{t > 1 ? 's' : ''} sur {N - 1}</h3>
			<!-- FALLBACK : SVG dessiné à la main, aucun composant dendrogramme
			     n'existe encore (remplacer par un vrai composant s'il est créé). -->
			<svg
				viewBox={`0 0 ${DENDRO_W} ${DENDRO_H}`}
				class="dendro-svg"
				role="img"
				aria-label={`Dendrogramme du CAH : ${N} feuilles (x₁ à x₁₈) et ${t} fusions affichées sur ${N - 1}. La hauteur de chaque barre est la distance entre les deux clusters fusionnés ; la ligne pointillée verte est la coupe K.`}
			>
				<line
					x1={DENDRO_AXIS_X}
					y1={DENDRO_TOP}
					x2={DENDRO_AXIS_X}
					y2={DENDRO_BOT}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				<line
					x1={DENDRO_AXIS_X}
					y1={DENDRO_BOT}
					x2={DENDRO_W - DENDRO_MR}
					y2={DENDRO_BOT}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				{#each [0, maxH / 2, maxH] as v (v)}
					<line
						x1={DENDRO_AXIS_X - 4}
						y1={yOf(v)}
						x2={DENDRO_AXIS_X}
						y2={yOf(v)}
						stroke="var(--color-border)"
						stroke-width="1"
					/>
					<text x={DENDRO_AXIS_X - 7} y={yOf(v) + 3} text-anchor="end" class="dendro-tick">
						{v.toFixed(2)}
					</text>
				{/each}

				<line
					x1={DENDRO_ML - 6}
					y1={yOf(cutHeight)}
					x2={DENDRO_W - DENDRO_MR}
					y2={yOf(cutHeight)}
					stroke="var(--color-positive)"
					stroke-width="1.5"
					stroke-dasharray="6 4"
					opacity={t === N - 1 ? 1 : 0.35}
					pointer-events="none"
				/>
				<text
					x={DENDRO_W - DENDRO_MR - 2}
					y={yOf(cutHeight) - 4}
					text-anchor="end"
					class="dendro-cut-label"
					opacity={t === N - 1 ? 1 : 0.35}
				>
					coupe K
				</text>

				{#each drawnMerges as m, mIdx (N + mIdx)}
					{@const isLatest = mIdx === t - 1}
					<g
						stroke={isLatest ? 'var(--color-surprise)' : 'var(--color-text-muted)'}
						stroke-width={isLatest ? 2.4 : 1.2}
					>
						<line
							x1={xOf(m.a)}
							y1={yOf(layout.y[m.a])}
							x2={xOf(m.a)}
							y2={yOf(m.height)}
						/>
						<line
							x1={xOf(m.b)}
							y1={yOf(layout.y[m.b])}
							x2={xOf(m.b)}
							y2={yOf(m.height)}
						/>
						<line
							x1={xOf(m.a)}
							y1={yOf(m.height)}
							x2={xOf(m.b)}
							y2={yOf(m.height)}
						/>
					</g>
				{/each}

				{#each layout.leafOrder as leaf (leaf)}
					<line
						x1={xOf(leaf)}
						y1={DENDRO_BOT}
						x2={xOf(leaf)}
						y2={DENDRO_BOT - 4}
						stroke="var(--color-text-muted)"
						stroke-width="1"
					/>
					<text
						x={xOf(leaf) - 4}
						y={DENDRO_BOT + 3}
						text-anchor="end"
						class="dendro-leaf"
					>
						{leafLabel(leaf)}
					</text>
				{/each}
			</svg>
		</section>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">étape</span>
			<span class="value">{t} / {N - 1}</span>
		</div>
		<div class="cell">
			<span class="label">clusters actuels</span>
			<span class="value">{N - t}</span>
		</div>
		<div class="cell">
			<span class="label">dernière distance de fusion</span>
			<span class="value">{lastMerge ? lastMerge.height.toFixed(2) : '—'}</span>
		</div>
	</Metrics>

	<p class="caption">
		À chaque itération, les deux clusters les plus proches (selon la liaison choisie) sont
		fusionnés. La longueur d'une branche du dendrogramme est la distance entre les deux
		clusters fusionnés. Faites glisser la coupe K pour voir la partition correspondante.
	</p>
</div>

<style>
	.cah-demo {
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

	.sliders {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem 1.5rem;
		align-items: end;
	}

	.linkage-legend {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-2);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.linkage-legend summary {
		cursor: pointer;
		font-weight: 500;
		color: var(--color-text);
	}

	.linkage-legend ul {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.3rem;
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

	.dendro-tick,
	.dendro-leaf {
		fill: var(--color-text-muted);
		font-size: 9px;
		font-family: var(--font-mono);
	}

	.dendro-cut-label {
		fill: var(--color-positive);
		font-size: 10px;
		font-weight: 600;
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
