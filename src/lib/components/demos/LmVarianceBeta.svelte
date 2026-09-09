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
	const SPREAD_MIN = 2;
	const SPREAD_MAX = 20;
	let spread = $state(10);

	const estimates = $derived(
		repeatedSlopeSamples({
			n: N_A,
			spread,
			beta0: 2,
			beta1: BETA1_TRUE,
			sigma: SIGMA,
			B: 200,
			seed: 9
		})
	);
	const varAnalytic = $derived(varBetaJ(SIGMA ** 2, linspace(0, spread, N_A), 0));
	const seAnalytic = $derived(Math.sqrt(varAnalytic));

	// Domaine FIXE, calé sur le pire cas (spread minimal ⇒ variance maximale).
	// C'est ce qui rend la concentration visible : le cadre ne bouge plus,
	// seule la distribution à l'intérieur se resserre.
	const SE_MAX = Math.sqrt(varBetaJ(SIGMA ** 2, linspace(0, SPREAD_MIN, N_A), 0));
	const DOMAIN_LO = BETA1_TRUE - 4 * SE_MAX;
	const DOMAIN_HI = BETA1_TRUE + 4 * SE_MAX;

	const N_BINS = 12;
	const histo = $derived.by(() => {
		const lo = DOMAIN_LO,
			hi = DOMAIN_HI;
		const w = (hi - lo) / N_BINS;
		const counts = new Array<number>(N_BINS).fill(0);
		for (const e of estimates) {
			const idx = Math.min(N_BINS - 1, Math.max(0, Math.floor((e - lo) / w)));
			counts[idx]++;
		}
		return {
			counts,
			centers: counts.map((_, i) => lo + (i + 0.5) * w),
			varSample: estimates.reduce((a, e) => a + (e - BETA1_TRUE) ** 2, 0) / estimates.length
		};
	});

	const gaussCurve = $derived.by(() => {
		return Array.from({ length: 101 }, (_, i) => {
			const t = DOMAIN_LO + ((DOMAIN_HI - DOMAIN_LO) * i) / 100;
			return [t, gaussianPDF(t, { mu: BETA1_TRUE, sigma2: varAnalytic })] as [number, number];
		});
	});

	// ── Effet "wow" : bracket de concentration (pur CSS, cadre fixe) ──
	const concentration = $derived(SE_MAX / seAnalytic); // ≥ 1, croît avec spread
	const concentrationT = $derived(Math.min(1, Math.max(0, (concentration - 1) / 9)));
	const bracketWidthPct = $derived(((4 * seAnalytic) / (DOMAIN_HI - DOMAIN_LO)) * 100);
	const isVeryConcentrated = $derived(concentration > 5);

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
		La précision de β̂ est portée par (XᵀX)⁻¹ : écartez les valeurs de x (panneau A) ou corrélez deux
		prédicteurs (panneau B) et observez la variance des estimateurs. Le panneau A est affiché sur
		une échelle fixe (calée sur le pire cas) pour rendre le resserrement visible.
	</p>

	<div class="panel">
		<h3>un régresseur : Var(β̂1) = σ² / Σ(xi − x̄)²</h3>
		<div class="control-row">
			<span class="control-label">étalement de x ∈ [0, étalement]</span>
			<Slider min={SPREAD_MIN} max={SPREAD_MAX} step={1} bind:value={spread} label="etalage de x" />
		</div>

		<div class="conf-bracket" class:hot={isVeryConcentrated}>
			<div class="conf-track">
				<div
					class="conf-fill"
					style="width: {bracketWidthPct}%; background: color-mix(in srgb, var(--color-agent) {(
						concentrationT * 100
					).toFixed(0)}%, var(--color-surprise));"
				></div>
			</div>
			<div class="conf-meta">
				<span>β̂1 ± 2·SE, sur cadre fixe [{DOMAIN_LO.toFixed(1)}, {DOMAIN_HI.toFixed(1)}]</span>
				<span class="conf-ratio">×{concentration.toFixed(1)} plus précis que le pire cas</span>
			</div>
			{#if isVeryConcentrated}
				<span class="hot-badge">🔥 haute précision</span>
			{/if}
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
		σ̂·√((XᵀX)⁻¹ⱼⱼ). Quand ρ → 1, (XᵀX)⁻¹ devient mal conditionné : SE, VIF et κ explosent alors que
		le modèle explique toujours aussi bien Y (les VIF et le conditionnement κ sont les diagnostics de
		collinéarité de 8.validation_du_modele_lineaire_2025.pdf, amorce de la leçon 4). Simulations seedées :
		panneau A, n = 20 et 200 tirages ; panneau B, n = 100, σ = 1.
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

	.conf-bracket {
		position: relative;
		display: grid;
		gap: 0.35rem;
		padding: 0.6rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--color-belief) 6%, transparent);
	}

	.conf-track {
		position: relative;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
	}

	.conf-fill {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		border-radius: 999px;
		transition:
			width 0.35s ease,
			background 0.35s ease;
	}

	.conf-meta {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.conf-ratio {
		font-weight: 600;
		color: var(--color-text);
	}

	.hot-badge {
		position: absolute;
		top: -0.5rem;
		right: 0.5rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 600;
		background: color-mix(in srgb, var(--color-agent) 20%, transparent);
		color: var(--color-agent);
		animation: pop-in 0.3s ease;
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: scale(0.7);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
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
