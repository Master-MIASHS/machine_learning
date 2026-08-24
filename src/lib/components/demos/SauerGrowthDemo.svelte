<script lang="ts">
	// Part VI — Lemme de Sauer-Shelah.
	//
	// Plotted in log2 space, not raw values: 2^m and the polynomial
	// Sauer-Shelah bound differ by many orders of magnitude once m > d, so a
	// linear y-axis would flatten the polynomial curve to invisibility. In
	// log2 space, log2(2^m) = m exactly (a straight diagonal line), and
	// sauerShelahBound(m,d) == 2^m identically for m <= d — so the two curves
	// are drawn ON TOP OF EACH OTHER up to m=d, then visibly split apart
	// exactly at the threshold. That split IS the "switch from exponential to
	// polynomial growth" the task asks to show.

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import { trivialGrowthBound, sauerShelahBound, sauerShelahEnvelope } from '$lib/math/vc';

	const M_MIN = 1;
	const M_MAX = 60;

	let d = $state(5);
	let m = $state(20);

	const mGrid = Array.from({ length: M_MAX - M_MIN + 1 }, (_, i) => M_MIN + i);

	const trivialPoints = $derived(
		mGrid.map((mm): [number, number] => [mm, Math.log2(trivialGrowthBound(mm))])
	);
	const sauerPoints = $derived(
		mGrid.map((mm): [number, number] => [mm, Math.log2(sauerShelahBound(mm, d))])
	);
	// sauerShelahEnvelope requires m >= d.
	const envelopePoints = $derived(
		mGrid
			.filter((mm) => mm >= d)
			.map((mm): [number, number] => [mm, Math.log2(sauerShelahEnvelope(mm, d))])
	);

	const mClampedForEnvelope = $derived(Math.max(m, d));

	const trivialAtM = $derived(trivialGrowthBound(m));
	const sauerAtM = $derived(sauerShelahBound(m, d));
	const envelopeAtM = $derived(m >= d ? sauerShelahEnvelope(m, d) : null);

	function formatBig(value: number): string {
		return value >= 1e6 ? value.toExponential(2) : value.toFixed(0);
	}
</script>

<Figure type="chart">
	<CurveChart
		curves={[
			{ points: trivialPoints, stroke: 'var(--color-text-muted)', strokeWidth: 2 },
			{ points: sauerPoints, stroke: 'var(--color-belief)', strokeWidth: 2 },
			{
				points: envelopePoints,
				stroke: 'var(--color-surprise)',
				strokeWidth: 2,
				strokeDasharray: '4 4'
			}
		]}
		xDomain={[M_MIN, M_MAX]}
		yAxis={true}
		vlines={[
			{ x: d, stroke: 'var(--color-belief)', strokeDasharray: '2 2', label: 'm = d (seuil)' },
			{ x: m, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'm choisi' }
		]}
		curveDots={[
			{ x: m, y: Math.log2(trivialAtM), fill: 'var(--color-text-muted)' },
			{ x: m, y: Math.log2(sauerAtM), fill: 'var(--color-belief)' },
			...(envelopeAtM !== null
				? [{ x: mClampedForEnvelope, y: Math.log2(envelopeAtM), fill: 'var(--color-surprise)' }]
				: [])
		]}
		legend={[
			{ label: '2^m (borne triviale)', color: 'var(--color-text-muted)' },
			{ label: 'Σ C(m,i), i=0..d (Sauer-Shelah)', color: 'var(--color-belief)' },
			{ label: '(em/d)^d (enveloppe, m≥d)', color: 'var(--color-surprise)', kind: 'dashed-line' }
		]}
	/>

	{#snippet caption()}
		Axe Y en échelle log₂. Pour m ≤ d, la borne de Sauer-Shelah coïncide <em>exactement</em> avec 2^m
		(les deux courbes se superposent) — la contrainte de VC-dimension n'a encore aucun effet. À partir
		de m = d, les courbes se séparent : la croissance devient polynomiale au lieu d'exponentielle. L'enveloppe
		(em/d)^d n'est définie que pour m ≥ d et reste toujours au-dessus de la borne exacte.
	{/snippet}
</Figure>

<Slider min={1} max={20} step={1} bind:value={d} label="Dimension VC (d)" />
<Slider min={M_MIN} max={M_MAX} step={1} bind:value={m} label="Nombre de points (m)" />

<Metrics align="left">
	<div class="cell">
		<span class="label">2^m</span>
		<span class="value">{formatBig(trivialAtM)}</span>
	</div>
	<div class="cell">
		<span class="label">Σ C(m,i)</span>
		<span class="value">{formatBig(sauerAtM)}</span>
	</div>
	<div class="cell">
		<span class="label">(em/d)^d</span>
		<span class="value">{envelopeAtM !== null ? formatBig(envelopeAtM) : 'n/a (m < d)'}</span>
	</div>
</Metrics>
