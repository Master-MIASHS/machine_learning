<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { bellNumber } from '$lib/math/clustering.js';

	// Frame « Choix d'une partition » of
	// marine/Cours/CM/coursClassif-5-Clustering.tex : B_n = (1/e) Σ_{K≥1} Kⁿ/K!
	// is the number of partitions of a set of n elements (nombre de Bell); the
	// exhaustive search of all partitions is impossible.

	let n = $state(12);

	// bellNumber is exact (bigint); the conversion to Number is safe for k ≤ 12
	// (B_12 = 4 213 597, far below 2⁵³).
	const bellCurve = $derived(
		Array.from({ length: 12 }, (_, i): [number, number] => [i + 1, Number(bellNumber(i + 1))])
	);

	const bellN = $derived(Number(bellNumber(n)));

	const bellDots = $derived(
		bellCurve.map(
			([k, b]): { x: number; y: number; r?: number; fill?: string } => ({
				x: k,
				y: b,
				r: k === n ? 6 : 4.5,
				fill: k === n ? 'var(--color-surprise)' : 'var(--color-belief)'
			})
		)
	);
</script>

<div class="bell">
	<Slider min={1} max={12} step={1} bind:value={n} label="n (taille du jeu de données)" />

	<CurveChart
		curves={[{ points: bellCurve, stroke: 'var(--color-belief)', strokeWidth: 2 }]}
		curve="linear"
		yScaleType="log"
		xDomain={[1, 12]}
		height={220}
		yAxis={true}
		chartLabel="B_k, échelle logarithmique"
		vlines={[
			{ x: n, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: `n = ${n}` }
		]}
		curveDots={bellDots}
	/>

	<p class="readout" aria-live="polite">
		B<sub>n</sub> = <strong>{bellN}</strong>
		<span class="readout-sub">nombre de partitions possibles d'un ensemble de n éléments</span>
	</p>

	<Metrics align="left">
		<div class="cell">
			<span class="label">B_n exact</span>
			<span class="value">{bellN}</span>
		</div>
		<div class="cell">
			<span class="label">B_n exponentiel</span>
			<span class="value">{bellN.toExponential(2)}</span>
		</div>
	</Metrics>

	<p class="caption">
		Déjà à n = 12, plus de 4 millions de partitions. À n = 50, B₅₀ ≈ 1,86·10⁴⁷ (les diapositives
		indiquent ≥ 10⁴⁸) : on ne peut pas tout explorer — d'où les algorithmes itératifs.
	</p>
</div>

<style>
	.bell {
		display: grid;
		gap: 1rem;
	}

	.readout {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-2);
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--color-text);
	}

	.readout strong {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-belief);
	}

	.readout-sub {
		font-family: var(--font-sans);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
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
