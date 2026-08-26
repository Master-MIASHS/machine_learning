<script lang="ts">
	// Part V — Consistance — Théorème 2.1 (Stone, 1977), consistance du k-NN.
	//
	// Two views side by side conceptually: a real 2D dataset with an actual
	// k-NN classifier (neighborhood + decision boundary, from the geometric
	// helpers added to consistency.ts), and the abstract risk-vs-k curve from
	// the P5.1 toy formula (knnExcessRiskCurve) for the same n.

	import Figure from '$lib/components/charts/Figure.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		generateKnnDataset,
		kNearestNeighbors,
		knnDecisionField,
		knnExcessRiskCurve,
		knnOptimalK,
		type Knn2DModel,
		type KnnRiskModel
	} from '$lib/math/consistency';
	import { linspace } from '$lib/math/util'; // TODO: confirm path

	const knn2DModel: Knn2DModel = { radius: 2, temperature: 0.3 };
	const riskModel: KnnRiskModel = { varianceConst: 4, biasConst: 1 };
	const DOMAIN = 3;
	// Fixed query point, off-center so the active neighborhood is visually
	// interesting (not perfectly symmetric around the boundary).
	const QUERY = { x1: 0.6, x2: 0.6 };

	let n = $state(100);
	let k = $state(9);
	let useStoneRule = $state(false);

	const kMax = $derived(Math.max(2, Math.min(n, 30)));

	$effect(() => {
		if (useStoneRule) {
			k = Math.max(1, Math.min(Math.round(Math.sqrt(n)), n));
		} else if (k > kMax) {
			k = kMax;
		}
	});

	// Regenerating on n change (seed fixed) — since the PRNG stream is shared,
	// growing n appends new points rather than reshuffling existing ones.
	const dataset = $derived(generateKnnDataset(n, knn2DModel, DOMAIN, 42));

	const neighbors = $derived(kNearestNeighbors(QUERY, dataset, k));
	const neighborhoodRadius = $derived(
		Math.sqrt(Math.max(...neighbors.map((p) => (p.x1 - QUERY.x1) ** 2 + (p.x2 - QUERY.x2) ** 2)))
	);

	const decisionField = $derived(knnDecisionField(dataset, k, DOMAIN, 18));

	interface ScatterGroupPoint {
		x: number;
		y: number;
		group: 'field-1' | 'field-0' | 'neighbor' | 'data-1' | 'data-0';
	}

	const scatterPoints = $derived.by((): ScatterGroupPoint[] => [
		// Background decision field — small, one dot per grid cell.
		...decisionField.map((c): ScatterGroupPoint => ({
			x: c.x1,
			y: c.x2,
			group: c.predicted === 1 ? 'field-1' : 'field-0'
		})),
		// Actual data points — larger; the k active neighbors get their own group.
		...dataset.map((p): ScatterGroupPoint => {
			const isNeighbor = neighbors.includes(p);
			return {
				x: p.x1,
				y: p.x2,
				group: isNeighbor ? 'neighbor' : p.label === 1 ? 'data-1' : 'data-0'
			};
		})
	]);

	function colorByGroup(d: { group?: string | number }): string {
		switch (d.group) {
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
			default:
				return 'var(--color-text-muted)';
		}
	}

	function sizeByGroup(d: { group?: string | number }): number {
		if (d.group === 'field-1' || d.group === 'field-0') return 2;
		if (d.group === 'neighbor') return 6;
		return 4;
	}

	// ─── Scatter projection (mirrors ScatterPlot.svelte's internal pad=4) ──────
	const SCATTER_SIZE = 420;
	const SCATTER_PAD = 4;
	const scatterDomain: [number, number] = [-DOMAIN, DOMAIN];

	function projX(x: number): number {
		const [min, max] = scatterDomain;
		return SCATTER_PAD + ((x - min) / (max - min)) * (SCATTER_SIZE - SCATTER_PAD * 2);
	}
	function projY(y: number): number {
		const [min, max] = scatterDomain;
		return SCATTER_PAD + ((max - y) / (max - min)) * (SCATTER_SIZE - SCATTER_PAD * 2);
	}
	const pxPerUnit = (SCATTER_SIZE - SCATTER_PAD * 2) / (scatterDomain[1] - scatterDomain[0]);

	// ─── Abstract risk-vs-k curve (P5.1 toy model), for the current n ──────────
	const kGrid = $derived(linspace(1, kMax, Math.min(kMax, 40)).map((v) => Math.round(v)));
	const riskCurvePoints = $derived(
		knnExcessRiskCurve(n, kGrid, riskModel).map((p): [number, number] => [p.k, p.excessRisk])
	);
	const kStar = $derived(knnOptimalK(n, riskModel));
</script>

<Figure type="chart">
	<ScatterPlot
		points={scatterPoints}
		domainX={scatterDomain}
		domainY={scatterDomain}
		width={SCATTER_SIZE}
		height={SCATTER_SIZE}
		colorBy={colorByGroup}
		sizeBy={sizeByGroup}
		showAxes={true}
		showLabels={false}
	>
		{#snippet snippetOverlay()}
			<circle
				cx={projX(QUERY.x1)}
				cy={projY(QUERY.x2)}
				r={neighborhoodRadius * pxPerUnit}
				fill="none"
				stroke="var(--color-text)"
				stroke-width="1.5"
				stroke-dasharray="4 4"
				opacity="0.7"
			/>
			<circle
				cx={projX(QUERY.x1)}
				cy={projY(QUERY.x2)}
				r="5"
				fill="var(--color-text)"
				stroke="var(--color-bg)"
				stroke-width="1.5"
			/>
		{/snippet}
	</ScatterPlot>

	{#snippet caption()}
		Fond : région prédite par le k-NN (bleu = classe 1, orange = classe 0). Points : données
		réelles, colorées par leur vraie étiquette. Le point noir est la requête ; le cercle en
		pointillés délimite ses k plus proches voisins (en noir).
	{/snippet}
</Figure>

<div class="slider-row">
	<Slider min={20} max={300} step={1} bind:value={n} label="Taille d'échantillon n" />
	<Slider
		min={1}
		max={kMax}
		step={1}
		bind:value={k}
		label="k (nombre de voisins)"
		disabled={useStoneRule}
	/>
</div>

<label class="stone-toggle">
	<input type="checkbox" bind:checked={useStoneRule} />
	Utiliser k(n) = ⌊√n⌋ (règle de Stone)
</label>

<Figure type="chart">
	<CurveChart
		curves={[{ points: riskCurvePoints, stroke: 'var(--color-belief)', strokeWidth: 2 }]}
		xDomain={[1, kMax]}
		yAxis={true}
		vlines={[
			{ x: k, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'k choisi' },
			{
				x: kStar,
				stroke: 'var(--color-surprise)',
				strokeDasharray: '2 2',
				label: 'k* (modèle abstrait)'
			}
		]}
		legend={[{ label: 'risque excédentaire (modèle abstrait)', color: 'var(--color-belief)' }]}
	/>

	{#snippet caption()}
		Risque excédentaire k-NN selon le modèle jouet V/k + B(k/n) de la Partie V.1, pour n fixé au
		curseur ci-dessus. Ce n'est pas le risque du jeu de données affiché plus haut — c'est le modèle
		abstrait qui motive pourquoi ni k trop petit (variance) ni k trop grand (biais) ne conviennent.
	{/snippet}
</Figure>

<Metrics align="left">
	<div class="cell">
		<span class="label">k / n</span>
		<span class="value">{(k / n).toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">k* (modèle abstrait)</span>
		<span class="value">{kStar.toFixed(1)}</span>
	</div>
	<div class="cell">
		<span class="label">Règle de Stone</span>
		<span class="value">{useStoneRule ? 'active' : 'manuelle'}</span>
	</div>
</Metrics>

<p class="note">
	Démonstration <strong>illustrative</strong>, pas une preuve : les points affichés proviennent
	d'un tirage simulé à graine fixe (régénéré à chaque changement de <KatexInline
		formula={'n'}
	/>) ; la consistance universelle de k-NN est un énoncé du théorème de Stone, pas une
	propriété de ce tirage particulier.
</p>

<style>
	.note {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0.75rem 0 0;
	}
	.slider-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem 1.5rem;
		margin-top: 0.5rem;
	}

	@media (max-width: 600px) {
		.slider-row {
			grid-template-columns: 1fr;
		}
	}

	.stone-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--color-text);
	}
</style>
