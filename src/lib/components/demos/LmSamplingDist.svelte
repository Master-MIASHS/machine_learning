<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { gaussianPDF } from '$lib/math/gaussian.js';
	import {
		repeatedSlopeIntervals,
		tDensity,
		varBetaJ
	} from '$lib/math/linear-model.js';
	import { linspace } from '$lib/math/util.js';

	const BETA0 = 1;
	const BETA1 = 2;
	const B = 200;
	const SEED = 21;
	const ALPHA = 0.05;

	let n = $state(15);
	let sigma = $state(1);
	let spread = $state(10);

	const intervals = $derived(
		repeatedSlopeIntervals({ n, spread, beta0: BETA0, beta1: BETA1, sigma, B, alpha: ALPHA, seed: SEED })
	);
	const ests = $derived(intervals.map((r) => r.est));

	// Var(β̂1) = σ²/Σ(xi−x̄)² = σ²·varBetaJ(1, x, 0) (varBetaJ renvoie σ²/‖x−x̄‖²).
	const x = $derived(linspace(0, spread, n));
	const varAnalytic = $derived(sigma ** 2 * varBetaJ(1, x, 0));
	const seAnalytic = $derived(Math.sqrt(varAnalytic));

	const N_BINS = 12;
	const histo = $derived.by(() => {
		const lo = Math.min(...ests),
			hi = Math.max(...ests);
		const w = (hi - lo) / N_BINS || 1;
		const counts = new Array<number>(N_BINS).fill(0);
		for (const e of ests) counts[Math.min(N_BINS - 1, Math.floor((e - lo) / w))]++;
		return {
			counts,
			centers: counts.map((_, i) => lo + (i + 0.5) * w),
			varSample: ests.reduce((a, e) => a + (e - BETA1) ** 2, 0) / ests.length
		};
	});

	const gaussCurve = $derived.by(() => {
		const lo = BETA1 - 4 * seAnalytic,
			hi = BETA1 + 4 * seAnalytic;
		return Array.from({ length: 101 }, (_, i) => {
			const t = lo + ((hi - lo) * i) / 100;
			return [t, gaussianPDF(t, { mu: BETA1, sigma2: varAnalytic })] as [number, number];
		});
	});

	// Loi de Student à n−p−1 = n−3 ddl : la loi de T = (β̂1−β1)/(σ̂/√Σ(xi−x̄)²).
	const tCurve = $derived.by(() => {
		const df = n - 3;
		return Array.from({ length: 201 }, (_, i) => {
			const t = -4 + (8 * i) / 200;
			return [t, tDensity(t, df)] as [number, number];
		});
	});

	const coverage = $derived(
		intervals.filter((r) => r.lo <= BETA1 && r.hi >= BETA1).length / intervals.length
	);
</script>

<div class="lm-sample">
	<p class="intro">
		Sous (H3), β̂1 suit N(β1, σ²(XᵀX)⁻¹)₁₁ et la statistique T suit Student
		n−p−1. B = 200 tirages seedés (n, σ, étalement de x ajustables) : l'historgramme
		des estimateurs suit la gaussienne théorique, et la couverture empirique des
		intervalles de confiance t doit rester près de 95 %.
	</p>

	<div class="controls">
		<Slider min={5} max={40} step={1} bind:value={n} label="n (observations)" />
		<Slider min={0.5} max={3} step={0.1} bind:value={sigma} label="σ (bruit)" />
		<Slider min={2} max={20} step={1} bind:value={spread} label="étalement de x ∈ [0, s]" />
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>β̂1 sur B = 200 échantillons</h3>
			<BarChart
				values={histo.counts}
				labels={histo.centers.map((c) => c.toFixed(1))}
				yMax={Math.max(...histo.counts)}
				color="var(--color-belief)"
				height={170}
				showValues={false}
			/>
		</div>
		<div class="panel">
			<h3>loi théorique N(β1, σ²/Σ(xi−x̄)²)</h3>
			<DensityChart
				curves={[
					{
						points: gaussCurve,
						stroke: 'var(--color-agent)',
						fill: 'var(--color-agent)',
						fillOpacity: 0.08,
						curve: 'basis'
					}
				]}
				observations={[{ x: BETA1, label: 'β1' }]}
				height={170}
			/>
		</div>
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>loi de T — Student(n−3)</h3>
			<DensityChart
				curves={[
					{
						points: tCurve,
						stroke: 'var(--color-surprise)',
						fill: 'var(--color-surprise)',
						fillOpacity: 0.08,
						curve: 'basis'
					}
				]}
				xDomain={[-4, 4]}
				height={170}
			/>
		</div>
		<Metrics>
			<div class="cell">
				<span class="label">couverture empirique (α = 5 %)</span>
				<span class="value">{(coverage * 100).toFixed(1)} %</span>
			</div>
			<div class="cell">
				<span class="label">Var(β̂1) — analytique</span>
				<span class="value">{varAnalytic.toFixed(4)}</span>
			</div>
			<div class="cell">
				<span class="label">Var(β̂1) — 200 tirages</span>
				<span class="value">{histo.varSample.toFixed(4)}</span>
			</div>
			<div class="cell">
				<span class="label">ddl résiduels (n−p−1)</span>
				<span class="value">{n - 3}</span>
			</div>
		</Metrics>
	</div>

	<p class="caption">
		StatM1S1_2025.pdf, §6.2–6.3 : β̂ ∼ N(β, σ²(XᵀX)⁻¹), T = (β̂j−βj)/(σ̂√[(XᵀX)⁻¹]ⱼⱼ) ∼
		Student(n−p−1), et IC à 95 % : β̂j ± tₙ₋ₚ₋₁(0.975)·σ̂√[(XᵀX)⁻¹]ⱼⱼ. Simulations
		seedées (β0 = 1, β1 = 2) ; la couverture fluctue d'un tirage à l'autre mais
		reste proche de 95 %.
	</p>
</div>

<style>
	.lm-sample {
		display: grid;
		gap: 1.25rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
		gap: 0.9rem;
	}

	.grid2 {
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
</style>
