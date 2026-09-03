<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import {
		generateKnnDataset,
		kNearestNeighbors,
		knnDecisionField,
		type Knn2DModel
	} from '$lib/math/consistency';
	import {
		generateKnnRegressionDataset,
		knnClassificationPredict,
		knnRegressionNeighbors,
		knnRegressionPredict,
		knnVoteCounts
	} from '$lib/math/knn';

	const DOMAIN = 3;
	const SCATTER_SIZE = 420;
	const SCATTER_PAD = 4;
	const MODEL: Knn2DModel = { radius: 2, temperature: 0.3 };

	interface QueryPoint {
		x1: number;
		x2: number;
	}

	interface DisplayPoint {
		x: number;
		y: number;
		group: 'field-0' | 'field-1' | 'data-0' | 'data-1' | 'neighbor' | 'regression';
		value?: number;
	}

	let n = $state(100);
	let k = $state(3);
	let regressionMode = $state(false);
	let showBoundary = $state(true);
	let query = $state<QueryPoint>({ x1: 0.6, x2: 0.6 });

	const kMax = $derived(Math.max(1, Math.min(n, 25)));

	$effect(() => {
		if (k > kMax) k = kMax;
	});

	const classificationDataset = $derived(generateKnnDataset(n, MODEL, DOMAIN, 42));
	const regressionDataset = $derived(generateKnnRegressionDataset(n, 42, DOMAIN));

	const classificationNeighbors = $derived(kNearestNeighbors(query, classificationDataset, k));
	const regressionNeighbors = $derived(knnRegressionNeighbors(regressionDataset, query, k));
	const voteCounts = $derived(knnVoteCounts(classificationDataset, query, k));
	// Convention pédagogique : en cas d'égalité, le widget retient la classe 1 (B).
	const classificationPrediction = $derived(knnClassificationPredict(classificationDataset, query, k));
	const regressionPrediction = $derived(knnRegressionPredict(regressionDataset, query, k));

	const decisionField = $derived(
		showBoundary && !regressionMode ? knnDecisionField(classificationDataset, k, DOMAIN, 18) : []
	);

	const scatterPoints = $derived.by((): DisplayPoint[] => {
		if (regressionMode) {
			return regressionDataset.map((point) => ({
				x: point.x1,
				y: point.x2,
				group: regressionNeighbors.includes(point) ? 'neighbor' : 'regression',
				value: point.y
			}));
		}

		return [
			...decisionField.map((cell): DisplayPoint => ({
				x: cell.x1,
				y: cell.x2,
				group: cell.predicted === 1 ? 'field-1' : 'field-0'
			})),
			...classificationDataset.map((point): DisplayPoint => ({
				x: point.x1,
				y: point.x2,
				group: classificationNeighbors.includes(point)
					? 'neighbor'
					: point.label === 1
						? 'data-1'
						: 'data-0'
			}))
		];
	});

	function colorByGroup(point: { group?: string | number; value?: number }): string | number {
		switch (point.group) {
			case 'field-1':
				return 'var(--color-belief)';
			case 'field-0':
				return 'var(--color-surprise)';
			case 'neighbor':
				return 'var(--color-text)';
			case 'data-1':
				return 'var(--color-belief)';
			case 'data-0':
				return 'var(--color-surprise)';
			case 'regression':
				return point.value ?? 0;
			default:
				return 'var(--color-text-muted)';
		}
	}

	function sizeByGroup(point: { group?: string | number }): number {
		if (point.group === 'field-0' || point.group === 'field-1') return 2;
		if (point.group === 'neighbor') return 7;
		return 4;
	}

	// Keep this projection synchronized with ScatterPlot.svelte's internal pad=4.
	function projectX(x: number): number {
		return SCATTER_PAD + ((x + DOMAIN) / (2 * DOMAIN)) * (SCATTER_SIZE - 2 * SCATTER_PAD);
	}

	function projectY(y: number): number {
		return SCATTER_PAD + ((DOMAIN - y) / (2 * DOMAIN)) * (SCATTER_SIZE - 2 * SCATTER_PAD);
	}

	const queryX = $derived(projectX(query.x1));
	const queryY = $derived(projectY(query.x2));

	function setQueryFromPointer(event: PointerEvent) {
		const target = event.currentTarget as SVGRectElement;
		const svg = target.ownerSVGElement;
		const ctm = svg?.getScreenCTM();
		if (!svg || !ctm) return;

		const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
		query = {
			x1: Math.max(
				-DOMAIN,
				Math.min(
					DOMAIN,
					((point.x - SCATTER_PAD) / (SCATTER_SIZE - 2 * SCATTER_PAD)) * 2 * DOMAIN - DOMAIN
				)
			),
			x2: Math.max(
				-DOMAIN,
				Math.min(
					DOMAIN,
					DOMAIN - ((point.y - SCATTER_PAD) / (SCATTER_SIZE - 2 * SCATTER_PAD)) * 2 * DOMAIN
				)
			)
		};
	}

	// Keyboard users get a deterministic fallback: Enter/Space places the query at the center.
	function handlePlotKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		query = { x1: 0, x2: 0 };
	}

	function distanceToQuery(point: { x1: number; x2: number }): number {
		return Math.hypot(point.x1 - query.x1, point.x2 - query.x2);
	}
</script>

<div class="knn-explorer">
	<div class="controls">
		<Slider min={20} max={200} step={1} bind:value={n} label="Taille de l'échantillon n" />
		<Slider min={1} max={kMax} step={1} bind:value={k} label="Nombre de voisins k" />
		<Toggle bind:checked={regressionMode} label="Mode régression" />
		{#if !regressionMode}
			<Toggle bind:checked={showBoundary} label="Afficher la frontière de décision" />
		{/if}
	</div>

	<div class="explorer-grid">
		<div class="plot-panel">
			<ScatterPlot
				points={scatterPoints}
				domainX={[-DOMAIN, DOMAIN]}
				domainY={[-DOMAIN, DOMAIN]}
				width={SCATTER_SIZE}
				height={SCATTER_SIZE}
				colorBy={colorByGroup}
				sizeBy={sizeByGroup}
				showAxes={true}
				showLabels={true}
			>
				{#snippet snippetOverlay()}
					<rect
						x={SCATTER_PAD}
						y={SCATTER_PAD}
						width={SCATTER_SIZE - 2 * SCATTER_PAD}
						height={SCATTER_SIZE - 2 * SCATTER_PAD}
						fill="transparent"
						role="button"
						tabindex="0"
						aria-label="Placer le point requête dans le plan"
						onpointerdown={setQueryFromPointer}
						onkeydown={handlePlotKeydown}
					/>
					{#each regressionMode ? regressionNeighbors : classificationNeighbors as neighbor (neighbor)}
						<line
							x1={queryX}
							y1={queryY}
							x2={projectX(neighbor.x1)}
							y2={projectY(neighbor.x2)}
							stroke="var(--color-text)"
							stroke-width="1"
							stroke-dasharray="3 3"
							opacity="0.55"
							pointer-events="none"
						/>
					{/each}
					<circle
						cx={queryX}
						cy={queryY}
						r="7"
						fill="var(--color-text)"
						stroke="var(--color-bg)"
						stroke-width="2"
						pointer-events="none"
					/>
				{/snippet}
			</ScatterPlot>
			<p class="plot-hint">
				Cliquez dans le plan pour déplacer la requête. Au clavier, Entrée la place au centre.
			</p>
		</div>

		<aside class="result-panel" aria-live="polite">
			<p class="eyebrow">Point requête</p>
			<p class="query-coordinates">({query.x1.toFixed(2)}, {query.x2.toFixed(2)})</p>

			{#if regressionMode}
				<p class="prediction-label">Prédiction par moyenne</p>
				<p class="prediction-value">ŷ = {regressionPrediction.toFixed(2)}</p>
				<p class="explanation">
					La sortie est la moyenne des valeurs des {k} voisins les plus proches.
				</p>
			{:else}
				<p class="prediction-label">Vote majoritaire</p>
				<p class="prediction-value">Classe {classificationPrediction === 1 ? 'B' : 'A'}</p>
				<table>
					<caption>Votes parmi les {k} voisins</caption>
					<tbody>
						<tr><th scope="row">Classe A</th><td>{voteCounts[0]}</td></tr>
						<tr><th scope="row">Classe B</th><td>{voteCounts[1]}</td></tr>
					</tbody>
				</table>
				<p class="explanation">
					Chaque point relié à la requête appartient à son voisinage de taille k. En cas d'égalité,
					la convention de ce widget retient la classe B.
				</p>
			{/if}

			<p class="distance-note">
				Distance au voisin le plus proche : {distanceToQuery(
					regressionMode ? regressionNeighbors[0] : classificationNeighbors[0]
				).toFixed(2)}
			</p>
		</aside>
	</div>

	<p class="caption">
		{#if regressionMode}
			Mode régression : la couleur des points encode la valeur observée (échelle divergente) et la
			sortie est la moyenne des voisins. Ce jeu de données est un modèle illustratif pour visualiser
			le mécanisme du k-NN.
		{:else}
			Mode classification : bleu = classe B, rose = classe A, et les points reliés sont les k plus
			proches voisins. La frontière affichée est une approximation discrète calculée sur une grille.
		{/if}
	</p>
</div>

<style>
	.knn-explorer {
		display: grid;
		gap: 1rem;
	}

	.controls {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem 1.5rem;
		align-items: end;
	}

	.explorer-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(12rem, 16rem);
		gap: 1.25rem;
		align-items: start;
	}

	.plot-panel {
		min-width: 0;
	}

	.plot-panel :global(svg) {
		max-width: 100%;
		margin: 0 auto;
	}

	.plot-hint,
	.caption,
	.explanation,
	.distance-note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.plot-hint {
		margin-top: 0.5rem;
		text-align: center;
	}

	.result-panel {
		display: grid;
		gap: 0.45rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.eyebrow,
	.prediction-label {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.query-coordinates,
	.prediction-value {
		margin: 0;
		font-family: var(--font-mono);
	}

	.query-coordinates {
		color: var(--color-text);
	}

	.prediction-value {
		color: var(--color-belief);
		font-size: 1.4rem;
		font-weight: 700;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	caption {
		margin-bottom: 0.35rem;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		text-align: left;
	}

	th,
	td {
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
	}

	td {
		color: var(--color-belief);
		font-family: var(--font-mono);
		text-align: right;
	}

	.distance-note {
		padding-top: 0.45rem;
		border-top: 1px solid var(--color-border);
	}

	.caption {
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-epistemic);
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
	}

	@media (max-width: 700px) {
		.controls,
		.explorer-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
