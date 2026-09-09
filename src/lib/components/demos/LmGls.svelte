<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import HeatmapGrid from '$lib/components/charts/HeatmapGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		ar1Correlation,
		ar1Samples,
		glsClosedForm,
		glsVarianceBeta,
		olsFit,
		olsVarianceWithCorrelation,
		withIntercept
	} from '$lib/math/linear-model.js';
	import { combineSeed, linspace } from '$lib/math/util.js';

	// Erreurs AR(1) : Σε = σ²ℱ, ℱij = ρ^|i−j| (StatM1S1_2025.pdf, §7).
	const N = 20;
	const B = 300;
	const SEED = 42;
	const BETA0 = 1;
	const BETA1 = 2;
	const x = linspace(0, 10, N);
	const X = withIntercept(x.map((v) => [v]));

	let rho = $state(0.5);
	const F = $derived(ar1Correlation(N, rho));

	// ar1Samples a une innovation de variance 1 → variance stationnaire 1/(1−ρ²).
	const sim = $derived.by(() => {
		const ols = new Array<number>(B);
		const gls = new Array<number>(B);
		for (let b = 0; b < B; b++) {
			const eps = ar1Samples(N, rho, combineSeed(SEED, b + 1));
			const y = x.map((xi, i) => BETA0 + BETA1 * xi + eps[i]);
			ols[b] = olsFit(X, y).beta[1];
			gls[b] = glsClosedForm(X, y, F)[1];
		}
		const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
		const varOf = (a: number[]) => {
			const m = mean(a);
			return a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length;
		};
		return { ols, gls, varOls: varOf(ols), varGls: varOf(gls) };
	});

	const sigma2Eff = $derived(1 / (1 - rho * rho));
	const varOlsTheory = $derived(olsVarianceWithCorrelation(X, F, sigma2Eff)[1][1]);
	const varGlsTheory = $derived(glsVarianceBeta(X, F, sigma2Eff)[1][1]);

	const N_BINS = 14;
	const histo = (arr: number[]) => {
		const lo = Math.min(...arr),
			hi = Math.max(...arr);
		const w = (hi - lo) / N_BINS || 1;
		const counts = new Array<number>(N_BINS).fill(0);
		for (const e of arr) counts[Math.min(N_BINS - 1, Math.floor((e - lo) / w))]++;
		return {
			counts,
			centers: counts.map((_, i) => lo + (i + 0.5) * w)
		};
	};
	const histoOls = $derived(histo(sim.ols));
	const histoGls = $derived(histo(sim.gls));
	const sdOls = $derived(Math.sqrt(sim.varOls));
	const sdGls = $derived(Math.sqrt(sim.varGls));
</script>

<div class="lm-gls">
	<p class="intro">
		Quand les erreurs sont corrélées (H2 brisée, (H2′) : Σε = σ²ℱ), OLS reste sans
		biais mais perd Gauss–Markov : sa variance devient
		σ²(XᵀX)⁻¹XᵀℱX(XᵀX)⁻¹. Le MCG (blanchiment ℱ = PPᵀ) récupère
		σ²(Xᵀℱ⁻¹X)⁻¹ — plus petite. B = 300 tirages AR(1) seedés, ρ ajustable.
	</p>

	<div class="control-row">
		<span class="control-label">corrélation AR(1) ρ</span>
		<Slider min={0} max={0.9} step={0.05} bind:value={rho} label="rho" />
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>β̂1 — OLS (écart-type {sdOls.toFixed(3)})</h3>
			<BarChart
				values={histoOls.counts}
				labels={histoOls.centers.map((c) => c.toFixed(1))}
				yMax={Math.max(...histoOls.counts, ...histoGls.counts)}
				color="var(--color-surprise)"
				height={160}
				showValues={false}
			/>
		</div>
		<div class="panel">
			<h3>β̂1 — MCG (écart-type {sdGls.toFixed(3)})</h3>
			<BarChart
				values={histoGls.counts}
				labels={histoGls.centers.map((c) => c.toFixed(1))}
				yMax={Math.max(...histoOls.counts, ...histoGls.counts)}
				color="var(--color-belief)"
				height={160}
				showValues={false}
			/>
		</div>
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>ℱ — matrice de corrélation des erreurs (ρ = {rho.toFixed(2)})</h3>
			<div class="fmat">
				<HeatmapGrid data={F} colorScale="rose" />
			</div>
		</div>
		<Metrics>
			<div class="cell">
				<span class="label">Var OLS(β̂1) — simulée</span>
				<span class="value">{sim.varOls.toFixed(5)}</span>
			</div>
			<div class="cell">
				<span class="label">Var OLS(β̂1) — σ²(XᵀX)⁻¹XᵀℱX(XᵀX)⁻¹</span>
				<span class="value">{varOlsTheory.toFixed(5)}</span>
			</div>
			<div class="cell">
				<span class="label">Var MCG(β̂1) — simulée</span>
				<span class="value">{sim.varGls.toFixed(5)}</span>
			</div>
			<div class="cell">
				<span class="label">Var MCG(β̂1) — σ²(Xᵀℱ⁻¹X)⁻¹</span>
				<span class="value">{varGlsTheory.toFixed(5)}</span>
			</div>
			<div class="cell">
				<span class="label">inflation Var OLS / Var MCG</span>
				<span class="value">{(varOlsTheory / varGlsTheory).toFixed(2)}×</span>
			</div>
		</Metrics>
	</div>

	<p class="caption">
		StatM1S1_2025.pdf, §7 : sous (H2′) avec ℱ connu, β̂MCG = (Xᵀℱ⁻¹X)⁻¹Xᵀℱ⁻¹Y est sans
		biais, de variance σ²(Xᵀℱ⁻¹X)⁻¹ et BLUE — OLS ne l'est plus (sa variance gonfle
		avec ρ). Les deux variances simulées convergent vers les valeurs théoriques
		(variance effective des erreurs = 1/(1−ρ²), innovation N(0,1)). n = 20, β = (1, 2),
		seedées.
	</p>
</div>

<style>
	.lm-gls {
		display: grid;
		gap: 1.25rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.control-label {
		min-width: 11rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.grid2 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
		gap: 1.25rem;
		align-items: start;
	}

	.panel {
		min-width: 0;
		display: grid;
		gap: 0.6rem;
	}

	.panel h3 {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.panel :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}

	.fmat {
		width: 100%;
		max-width: 240px;
		display: flex;
		justify-content: center;
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
