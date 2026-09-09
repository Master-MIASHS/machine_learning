<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import HeatmapGrid from '$lib/components/charts/HeatmapGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { gaussianSample } from '$lib/math/gaussian.js';
	import {
		conditionNumber,
		correlatedPredictors,
		correlationMatrix,
		covarianceBeta,
		olsFit,
		vif,
		withIntercept
	} from '$lib/math/linear-model.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';

	const N = 100;
	const SEED = 5;
	const rng = mulberry32(combineSeed(SEED, 1));
	const noise = Array.from({ length: N }, () => gaussianSample({ mu: 0, sigma2: 1 }, rng));

	let rho = $state(0.5);

	const model = $derived.by(() => {
		const { x1, x2 } = correlatedPredictors(N, rho, SEED);
		const y = x1.map((v, i) => 1 + 2 * v + 2 * x2[i] + noise[i]);
		const X = withIntercept(x1.map((v, i) => [v, x2[i]]));
		const fit = olsFit(X, y);
		const V = vif(X);
		const C = covarianceBeta(X, fit.sigma2);
		return {
			fit,
			kappa: conditionNumber(X),
			vif1: V[0],
			vif2: V[1],
			var1: C[1][1],
			var2: C[2][2]
		};
	});

	const corr = $derived(correlationMatrix([correlatedPredictors(N, rho, SEED).x1, correlatedPredictors(N, rho, SEED).x2]));

	// Courbe VIF1(ρ) pour montrer le seuil VIF > 10.
	const vifCurve = $derived.by(() => {
		const pts = [];
		for (let i = 0; i <= 20; i++) {
			const r = (0.99 * i) / 20;
			const { x1, x2 } = correlatedPredictors(N, r, SEED);
			const X = withIntercept(x1.map((v, j) => [v, x2[j]]));
			pts.push([r, vif(X)[0]] as [number, number]);
		}
		return pts;
	});

	const fmt = (v: number) => (v >= 1000 ? v.toExponential(2) : v.toFixed(2));
</script>

<div class="lm-collin">
	<p class="intro">
		Deux prédicteurs corrélés se partagent l'information : les coefficients restent
		estimables mais <strong>mal estimés</strong> — les variances (et le
		conditionnement) explosent, les signes peuvent même s'inverser, alors que le R²
		du modèle reste élevé.
	</p>

	<div class="control-row">
		<span class="control-label">corrélation ρ(x1, x2)</span>
		<Slider min={0} max={0.99} step={0.01} bind:value={rho} label="rho" />
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>matrice des corrélations 2 à 2</h3>
			<div class="corr">
				<HeatmapGrid data={corr} colorScale="cyan" showValues />
			</div>
		</div>
		<div class="panel">
			<h3>VIF₁ en fonction de ρ (seuil 10)</h3>
			<CurveChart
				curves={[
					{ points: vifCurve, stroke: 'var(--color-surprise)', curve: 'linear' }
				]}
				xDomain={[0, 0.99]}
				vlines={[{ x: 0.9, stroke: 'var(--color-border)', label: 'ρ = 0.9' }]}
				height={170}
			/>
		</div>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">κ (conditionnement)</span>
			<span class="value">{model.kappa >= 100 ? model.kappa.toExponential(2) : model.kappa.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">VIF₁ (seuil 10)</span>
			<span class="value">{model.vif1 >= 100 ? model.vif1.toExponential(2) : model.vif1.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">VIF₂ (seuil 10)</span>
			<span class="value">{model.vif2 >= 100 ? model.vif2.toExponential(2) : model.vif2.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">Var(β̂1)</span>
			<span class="value">{fmt(model.var1)}</span>
		</div>
		<div class="cell">
			<span class="label">Var(β̂2)</span>
			<span class="value">{fmt(model.var2)}</span>
		</div>
		<div class="cell">
			<span class="label">β̂1 (vrai : 2)</span>
			<span class="value">{model.fit.beta[1].toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">β̂2 (vrai : 2)</span>
			<span class="value">{model.fit.beta[2].toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">R² du modèle</span>
			<span class="value">{model.fit.rSquared.toFixed(3)}</span>
		</div>
	</Metrics>

	<p class="caption">
		8.validation_du_modele_lineaire_2025.pdf, §8.1–8.2 : β̂j ∝ cor(Xj, Y | autres),
		cov(β̂i, β̂j) ∝ −cor(Xi, Xj | restes) ; VIFj = 1/(1−Rj²) avec
		Var(β̂j) = σ²/(‖xj−x̄j‖²(1−Rj²)) ; seuils usuels κ &gt; 500 et VIF &gt; 10.
		À ρ → 1, XᵀX est mal conditionnée : R² élevé ≠ coefficients bien estimés.
		n = 100, β vrais = (1, 2, 2), seedé.
	</p>
</div>

<style>
	.lm-collin {
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

	.corr {
		width: 100%;
		max-width: 200px;
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
