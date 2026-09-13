<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import RadioGroup from '$lib/components/controls/RadioGroup.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import {
		paraboleObjective,
		quarticObjective,
		lagrangianParabole,
		lagrangianQuartic,
		dualMinimizerParabole,
		dualFunctionParabole,
		dualGapParabole,
		dualArgminQuartic,
		dualFunctionQuartic,
		kktCheckParabole,
		quarticKktPoints,
		PARABOLE_OPTIMUM,
		QUARTIC_OPTIMUM
	} from '$lib/math/duality.js';
	import { linspace } from '$lib/math/util.js';

	// Au-delà du cours : la dualité lagrangienne et les KKT ne figurent pas dans
	// course_sources/ (optim.typ traite uniquement du cas sans contrainte).
	// Source : Boyd & Vandenberghe, Convex Optimization, CUP 2004, ch. 5
	// (https://web.stanford.edu/~boyd/cvxbook/).

	type Mode = 'convex' | 'nonconvex';

	// Grilles et courbes statiques (f et g ne dépendent pas du slider) —
	// calculées une seule fois au chargement du module.
	const X_GRID_CONVEX = linspace(-1.5, 1.5, 240);
	const X_GRID_QUARTIC = linspace(-1.7, 1.7, 240);
	const LAMBDA_GRID = linspace(0, 4, 161);

	const F_CONVEX_PTS: [number, number][] = X_GRID_CONVEX.map((x) => [x, paraboleObjective(x)]);
	const F_QUARTIC_PTS: [number, number][] = X_GRID_QUARTIC.map((x) => [x, quarticObjective(x)]);
	const G_CONVEX_PTS: [number, number][] = LAMBDA_GRID.map((l) => [l, dualFunctionParabole(l)]);
	// g de (Q) : infimum numérique (scan borné + golden section) — voir
	// src/lib/math/duality.ts (dualFunctionQuartic).
	const G_QUARTIC_PTS: [number, number][] = LAMBDA_GRID.map((l) => [l, dualFunctionQuartic(l)]);

	let mode = $state<Mode>('convex');
	let lambda = $state(2);

	const xOfLambda = $derived(mode === 'convex' ? dualMinimizerParabole(lambda) : dualArgminQuartic(lambda));
	const gOfLambda = $derived(mode === 'convex' ? dualFunctionParabole(lambda) : dualFunctionQuartic(lambda));
	const gap = $derived(
		mode === 'convex' ? dualGapParabole(lambda) : QUARTIC_OPTIMUM.primal - gOfLambda
	);
	const pStar = $derived(mode === 'convex' ? PARABOLE_OPTIMUM.primal : QUARTIC_OPTIMUM.primal);
	const kkt = $derived(kktCheckParabole(xOfLambda, lambda));
	const quarticPoints = quarticKktPoints();

	const lCurvePts = $derived.by((): [number, number][] =>
		mode === 'convex'
			? X_GRID_CONVEX.map((x) => [x, lagrangianParabole(x, lambda)])
			: X_GRID_QUARTIC.map((x) => [x, lagrangianQuartic(x, lambda)])
	);

	const xDomain = $derived<[number, number]>(mode === 'convex' ? [-1.5, 1.5] : [-1.7, 1.7]);

	const kktRows = $derived([
		{
			label: 'Faisabilité primal : x(λ) ≤ 0',
			value: `x(λ) = ${xOfLambda.toFixed(2)}`,
			ok: kkt.primalFeasible
		},
		{ label: 'Faisabilité dual : λ ≥ 0', value: `λ = ${lambda.toFixed(2)}`, ok: kkt.dualFeasible },
		{
			label: 'Complémentarité : λ·x(λ) = 0',
			value: `λ·x(λ) = ${(lambda * xOfLambda).toFixed(3)}`,
			ok: kkt.complementarySlackness
		},
		{
			label: 'Stationnarité : 2(x(λ) − 1) + λ = 0',
			value: `résidu = ${kkt.stationarityResidual.toFixed(3)}`,
			ok: kkt.stationarity
		}
	]);
</script>

<div class="kkt-demo">
	<RadioGroup label="Problème">
		<RadioButton value="convex" bind:groupValue={mode} label="Convexe : (x − 1)², x ≤ 0" />
		<RadioButton value="nonconvex" bind:groupValue={mode} label="Non convexe : x⁴ − x², x ≤ 0" />
	</RadioGroup>

	<Slider min={0} max={4} step={0.01} bind:value={lambda} label="Multiplicateur de Lagrange λ" />

	<div class="charts-grid">
		<div class="chart-cell">
			<h4>Lagrangienne et objectif (espace x)</h4>
			<CurveChart
				curves={[
					{
						points: mode === 'convex' ? F_CONVEX_PTS : F_QUARTIC_PTS,
						stroke: 'var(--color-text-muted)',
						strokeDasharray: '6 4'
					},
					{ points: lCurvePts, stroke: 'var(--color-belief)' }
				]}
				xDomain={xDomain}
				vlines={
					mode === 'convex'
						? [
								{ x: 0, stroke: 'var(--color-surprise)', label: 'x = 0' },
								{ x: xOfLambda, stroke: 'var(--color-positive)', label: 'x(λ)' }
							]
						: [
								{ x: 0, stroke: 'var(--color-surprise)', label: 'x = 0' },
								{ x: -1 / Math.SQRT2, stroke: 'var(--color-positive)', label: '−1/√2' }
							]
				}
				curveDots={
					mode === 'convex'
						? [
								{ x: 0, y: PARABOLE_OPTIMUM.primal, fill: 'var(--color-positive)' },
								{ x: xOfLambda, y: gOfLambda, fill: 'var(--color-belief)' }
							]
						: [
								{ x: quarticPoints[0].x, y: quarticPoints[0].fValue, fill: 'var(--color-positive)' },
								{ x: quarticPoints[1].x, y: quarticPoints[1].fValue, fill: 'var(--color-surprise)' },
								{ x: xOfLambda, y: gOfLambda, fill: 'var(--color-belief)' }
							]
				}
				legend={[
					{ label: mode === 'convex' ? 'f(x) = (x − 1)²' : 'f(x) = x⁴ − x²', color: 'var(--color-text-muted)', kind: 'dashed-line' },
					{ label: 'L(x, λ) = f(x) + λx', color: 'var(--color-belief)' }
				]}
				chartLabel="x ≤ 0"
			/>
		</div>
		<div class="chart-cell">
			<h4>Fonction duale g(λ) = infₓ L(x, λ)</h4>
			<CurveChart
				curves={[{ points: mode === 'convex' ? G_CONVEX_PTS : G_QUARTIC_PTS, stroke: 'var(--color-belief)' }]}
				xDomain={[0, 4]}
				vlines={
					mode === 'convex'
						? [{ x: PARABOLE_OPTIMUM.lambdaStar, stroke: 'var(--color-positive)', label: 'λ* = 2' }]
						: []
				}
				curveDots={
					mode === 'convex'
						? [
								{
									x: PARABOLE_OPTIMUM.lambdaStar,
									y: PARABOLE_OPTIMUM.dual,
									fill: 'var(--color-positive)'
								}
							]
						: [{ x: 0, y: QUARTIC_OPTIMUM.primal, fill: 'var(--color-positive)' }]
				}
				legend={[
					{
						label:
							mode === 'convex'
								? 'g(λ) = λ − λ²/4, maximum 1 en λ* = 2'
								: 'g(λ) — infimum numérique, g(0) = p* = −1/4',
						color: 'var(--color-belief)'
					}
				]}
			/>
		</div>
	</div>

	{#if mode === 'convex'}
		<div class="kkt-panel">
			<h4>Conditions KKT du couple (x(λ), λ)</h4>
			<p class="kkt-hint">
				La stationnarité est vérifiée par construction (x(λ) minimise L en x) ; ce sont la
				faisabilité primal et la complémentarité qui sélectionnent λ* = 2.
			</p>
			<ul class="kkt-rows">
				{#each kktRows as row}
					<li class="kkt-row" class:ok={row.ok}>
						<span class="kkt-status" aria-hidden="true">{row.ok ? '✓' : '✗'}</span>
						<span class="kkt-label">{row.label}</span>
						<span class="kkt-value">{row.value}</span>
					</li>
				{/each}
			</ul>
			{#if kkt.allSatisfied}
				<p class="kkt-banner">
					Toutes les conditions KKT sont satisfaites : (x(λ), λ) = (0, 2) est le point KKT unique —
					dualité forte (Slater), écart nul.
				</p>
			{/if}
		</div>
	{:else}
		<div class="kkt-panel">
			<h4>Points KKT de x⁴ − x² sous x ≤ 0</h4>
			<ul class="kkt-cards">
				{#each quarticPoints as p}
					<li class="kkt-card" class:trap={p.role === 'local-maximum'}>
						<span class="kkt-card-badge" class:min={p.role === 'global-minimum'}>
							{p.role === 'global-minimum' ? 'minimum global' : 'maximum local — piège'}
						</span>
						<p class="kkt-card-body">
							x = {p.role === 'global-minimum' ? '−1/√2 ≈ −0.707' : '0'}, λ = 0,
							f(x) = {p.fValue.toFixed(2)} — les 4 conditions KKT sont satisfaites.
						</p>
					</li>
				{/each}
			</ul>
			<p class="kkt-banner trap-banner">
				Deux points KKT, dont un maximum local : hors convexité, satisfaire les KKT ne suffit
				pas à être optimal.
			</p>
		</div>
	{/if}

	<div class="metrics">
		<div class="metric">
			<span class="metric-label">p*</span>
			<span class="metric-value">{pStar === PARABOLE_OPTIMUM.primal ? '1' : '−1/4'}</span>
		</div>
		<div class="metric">
			<span class="metric-label">g(λ)</span>
			<span class="metric-value">{gOfLambda.toFixed(3)}</span>
		</div>
		<div class="metric">
			<span class="metric-label">écart p* − g(λ)</span>
			<span class="metric-value">{gap.toFixed(3)}</span>
		</div>
		<div class="metric">
			<span class="metric-label">x(λ)</span>
			<span class="metric-value">{xOfLambda.toFixed(3)}</span>
		</div>
	</div>

	<p class="demo-note">
		Au-delà du cours — Boyd &amp; Vandenberghe (2004), ch. 5. Dans le mode non convexe,
		g(λ) et x(λ) sont calculés numériquement (scan borné sur [−2, 2] + golden section).
	</p>
</div>

<style>
	.kkt-demo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 700px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	.chart-cell h4 {
		margin: 0 0 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.kkt-panel {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.875rem 1rem;
		background: var(--color-surface-2, transparent);
	}

	.kkt-panel h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.kkt-hint {
		margin: 0 0 0.625rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.kkt-rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.kkt-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-sm, 6px);
		border: 1px solid var(--color-border);
		font-size: 0.8125rem;
	}

	.kkt-row.ok {
		border-color: color-mix(in srgb, var(--color-positive) 45%, transparent);
		background: color-mix(in srgb, var(--color-positive) 7%, transparent);
	}

	.kkt-status {
		font-weight: 700;
		color: var(--color-surprise);
	}

	.kkt-row.ok .kkt-status {
		color: var(--color-positive);
	}

	.kkt-label {
		flex: 1;
	}

	.kkt-value {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.kkt-cards {
		list-style: none;
		margin: 0 0 0.625rem;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.625rem;
	}

	@media (max-width: 700px) {
		.kkt-cards {
			grid-template-columns: 1fr;
		}
	}

	.kkt-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 6px);
		padding: 0.625rem 0.75rem;
	}

	.kkt-card.trap {
		border-color: color-mix(in srgb, var(--color-surprise) 45%, transparent);
		background: color-mix(in srgb, var(--color-surprise) 6%, transparent);
	}

	.kkt-card-badge {
		display: inline-block;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-surprise);
		margin-bottom: 0.375rem;
	}

	.kkt-card-badge.min {
		color: var(--color-positive);
	}

	.kkt-card-body {
		margin: 0;
		font-size: 0.8125rem;
	}

	.kkt-banner {
		margin: 0.625rem 0 0;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm, 6px);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 9%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-positive) 35%, transparent);
	}

	.kkt-banner.trap-banner {
		color: var(--color-surprise);
		background: color-mix(in srgb, var(--color-surprise) 8%, transparent);
		border-color: color-mix(in srgb, var(--color-surprise) 35%, transparent);
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.625rem;
	}

	@media (max-width: 700px) {
		.metrics {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 6px);
	}

	.metric-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.metric-value {
		font-family: var(--font-mono);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-belief);
	}

	.demo-note {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
