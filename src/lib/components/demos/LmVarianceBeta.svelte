<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { gaussianPDF } from '$lib/math/gaussian.js';
	import { linspace } from '$lib/math/util.js';
	import {
		correlatedPredictors,
		covarianceBeta,
		conditionNumber,
		repeatedSlopeSamples,
		vif,
		varBetaJ
	} from '$lib/math/linear-model.js';

	// ── Panneau A : un régresseur — Var(β̂1) = σ²/Σ(xi−x̄)² ──
	const N_A = 20;
	const BETA1_TRUE = 3;
	const SIGMA = 1;
	let spread = $state(10);

	const estimates = $derived(
		repeatedSlopeSamples({ n: N_A, spread, beta0: 2, beta1: BETA1_TRUE, sigma: SIGMA, B: 200, seed: 9 })
	);
	const varAnalytic = $derived(varBetaJ(SIGMA ** 2, linspace(0, spread, N_A), 0));
	const seAnalytic = $derived(Math.sqrt(varAnalytic));

	const N_BINS = 12;
	const histo = $derived.by(() => {
		const lo = Math.min(...estimates),
			hi = Math.max(...estimates);
		const w = (hi - lo) / N_BINS || 1;
		const counts = new Array<number>(N_BINS).fill(0);
		for (const e of estimates) counts[Math.min(N_BINS - 1, Math.floor((e - lo) / w))]++;
		return {
			counts,
			centers: counts.map((_, i) => lo + (i + 0.5) * w),
			varSample: estimates.reduce((a, e) => a + (e - BETA1_TRUE) ** 2, 0) / estimates.length
		};
	});

	const gaussCurve = $derived.by(() => {
		const se = seAnalytic;
		const lo = BETA1_TRUE - 4 * se,
			hi = BETA1_TRUE + 4 * se;
		return Array.from({ length: 101 }, (_, i) => {
			const t = lo + ((hi - lo) * i) / 100;
			return [t, gaussianPDF(t, { mu: BETA1_TRUE, sigma2: varAnalytic })] as [number, number];
		});
	});

	// ── Panneau B : deux régresseurs corrélés — Var(β̂) = σ²(XᵀX)⁻¹ ──
	let rho = $state(0.5);
	const twoPred = $derived.by(() => {
		const { x1, x2 } = correlatedPredictors(100, rho, 7);
		const X = x1.map((v, i) => [1, v, x2[i]]);
		const C = covarianceBeta(X, SIGMA ** 2);
		const V = vif(X);
		return {
			se1: Math.sqrt(C[1][1]),
			se2: Math.sqrt(C[2][2]),
			vif1: V[0],
			vif2: V[1],
			kappa: conditionNumber(X)
		};
	});
</script>

<div class="lm-vbeta">
	<p class="intro">
		La précision de β̂ est portée par (XᵀX)⁻¹ : écartez les valeurs de x (panneau A) ou
		corrélez deux prédicteurs (panneau B) et observez la variance des estimateurs.
	</p>

	<div class="panel">
		<h3>un régresseur : Var(β̂1) = σ² / Σ(xi − x̄)²</h3>
		<div class="control-row">
			<span class="control-label">étalement de x ∈ [0, étalement]</span>
			<Slider min={2} max={20} step={1} bind:value={spread} label="etalage de x" />
		</div>
		<div class="grid2">
			<BarChart
				values={histo.counts}
				labels={histo.centers.map((c) => c.toFixed(1))}
				yMax={Math.max(...histo.counts)}
				color="var(--color-belief)"
				height={170}
				showValues={false}
			/>
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
				observations={[{ x: BETA1_TRUE, label: 'β1' }]}
				height={170}
			/>
		</div>
		<Metrics>
			<div class="cell">
				<span class="label">Var(β̂1) — analytique</span>
				<span class="value">{varAnalytic.toFixed(5)}</span>
			</div>
			<div class="cell">
				<span class="label">Var(β̂1) — 200 tirages</span>
				<span class="value">{histo.varSample.toFixed(5)}</span>
			</div>
			<div class="cell">
				<span class="label">SE(β̂1)</span>
				<span class="value">{seAnalytic.toFixed(4)}</span>
			</div>
		</Metrics>
	</div>

	<div class="panel">
		<h3>deux régresseurs corrélés : SE(β̂j) = σ̂·√((XᵀX)⁻¹ⱼⱼ)</h3>
		<div class="control-row">
			<span class="control-label">corrélation ρ(x1, x2)</span>
			<Slider min={0} max={0.95} step={0.05} bind:value={rho} label="correlation rho" />
		</div>
		<Metrics>
			<div class="cell">
				<span class="label">SE(β̂1)</span>
				<span class="value">{twoPred.se1.toFixed(4)}</span>
			</div>
			<div class="cell">
				<span class="label">SE(β̂2)</span>
				<span class="value">{twoPred.se2.toFixed(4)}</span>
			</div>
			<div class="cell">
				<span class="label">VIF₁</span>
				<span class="value">{twoPred.vif1.toFixed(2)}</span>
			</div>
			<div class="cell">
				<span class="label">VIF₂</span>
				<span class="value">{twoPred.vif2.toFixed(2)}</span>
			</div>
			<div class="cell">
				<span class="label">κ (conditionnement)</span>
				<span class="value">{twoPred.kappa.toFixed(1)}</span>
			</div>
		</Metrics>
	</div>

	<p class="caption">
		StatM1S1_2025.pdf, §I.4.3 : σ̂²β̂ = σ̂²(XᵀX)⁻¹ — chaque écart-type de coefficient est
		σ̂·√((XᵀX)⁻¹ⱼⱼ). Quand ρ → 1, (XᵀX)⁻¹ devient mal conditionné : SE, VIF et κ
		explosent alors que le modèle explique toujours aussi bien Y (amorce de la leçon 4).
		Simulations seedées (n = 100, σ = 1).
	</p>
</div>

<style>
	.lm-vbeta {
		display: grid;
		gap: 1.25rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.panel {
		display: grid;
		gap: 0.9rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.panel h3 {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text);
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
		gap: 1rem;
		align-items: start;
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
