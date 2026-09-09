<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { gaussianSample } from '$lib/math/gaussian.js';
	import {
		aic,
		bic,
		mallowCp,
		olsFit,
		polynomialDesign,
		polynomialFamily,
		polynomialTestMSE,
		polyValue
	} from '$lib/math/linear-model.js';
	import { combineSeed, linspace, mulberry32 } from '$lib/math/util.js';

	const N = 15;
	const SEED = 11;
	const SIGMA = 0.8;
	const D_MAX = N - 1;
	const TRUE_DEGREE = 2;

	const { x, y, trueBeta } = polynomialFamily({ n: N, degree: TRUE_DEGREE, sigma: SIGMA, seed: SEED });

	// Jeu de test « frais » : 40 nouveaux points (nouvelles x + nouveau bruit)
	// tirés du même vrai polynôme.
	const rngTest = mulberry32(combineSeed(SEED, 99));
	const xTest = linspace(0, 10, 40);
	const yTest = xTest.map((xi) => polyValue(trueBeta, xi) + SIGMA * gaussianSample({ mu: 0, sigma2: 1 }, rngTest));

	let d = $state(TRUE_DEGREE);

	const sweep = $derived.by(() => {
		const rows = [];
		for (let k = 0; k <= D_MAX; k++) {
			const fit = olsFit(polynomialDesign(x, k), y);
			rows.push({
				k,
				r2: fit.rSquared,
				mse: polynomialTestMSE(fit, xTest, yTest),
				fit
			});
		}
		return rows;
	});

	// Critères pour d ≤ 13 : à d = 14, RSS = 0 (interpolation) et
	// AIC/BIC → −∞, critères dégénérés — on ne les trace pas.
	const crit = $derived.by(() => {
		const sigma2Full = sweep[D_MAX - 1].fit.sse / (N - D_MAX);
		const aics: [number, number][] = [];
		const bics: [number, number][] = [];
		const cps: [number, number][] = [];
		for (const r of sweep.slice(0, D_MAX)) {
			aics.push([r.k, aic(r.fit.sse, N, r.k + 1)]);
			bics.push([r.k, bic(r.fit.sse, N, r.k + 1)]);
			cps.push([r.k, mallowCp(r.fit.sse, N, r.k + 1, sigma2Full)]);
		}
		const argmin = (pts: [number, number][]) => pts.reduce((b, p) => (p[1] < b[1] ? p : b))[0];
		return { aics, bics, cps, dAic: argmin(aics), dBic: argmin(bics), dCp: argmin(cps) };
	});

	const row = $derived(sweep[d]);
	const grid = linspace(0, 10, 121);
	const fitCurve = $derived(grid.map((xi) => [xi, polyValue(row.fit.beta, xi)] as [number, number]));
	const trueCurve = $derived(grid.map((xi) => [xi, polyValue(trueBeta, xi)] as [number, number]));
	const dots = $derived(x.map((xi, i) => ({ x: xi, y: y[i] })));
</script>

<div class="lm-poly">
	<p class="intro">
		Polynômes de degrés croissants sur un vrai polynôme de degré
		<KatexInline formula={String.raw`2`} /> (
		<KatexInline formula={String.raw`n = 15`} /> points). Le R² d’entraînement croît avec le
		degré et atteint 1 à l’interpolation — mais l’erreur de test, mesurée sur
		un échantillon frais, est en <strong>U</strong> : sous-ajustement à gauche
		(biais), sur-ajustement à droite (variance).
	</p>

	<div class="control-row">
		<Slider min={0} max={D_MAX} step={1} bind:value={d} label="degré d" />
	</div>

	<div class="panel">
		<h3>ajustement au degré d (vrai polynôme en pointillés)</h3>
		<CurveChart
			curves={[
				{ points: trueCurve, stroke: 'var(--color-text-muted)', strokeDasharray: '5 4', curve: 'basis' },
				{ points: fitCurve, stroke: 'var(--color-belief)', curve: 'basis' }
			]}
			curveDots={dots.map((p) => ({ x: p.x, y: p.y, r: 3, fill: 'var(--color-agent)' }))}
			xDomain={[0, 10]}
			height={230}
			legend={[
				{ label: 'vrai polynôme (degré 2)', color: 'var(--color-text-muted)', kind: 'dashed-line' },
				{ label: `ajustement degré ${d}`, color: 'var(--color-belief)' }
			]}
		/>
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>R² entraînement vs degré — → 1 à l’interpolation</h3>
			<CurveChart
				curves={[{ points: sweep.map((r) => [r.k, r.r2] as [number, number]), stroke: 'var(--color-belief)', curve: 'linear' }]}
				curveDots={[{ x: d, y: row.r2, r: 4, fill: 'var(--color-agent)' }]}
				xDomain={[0, D_MAX]}
				yDomain={[0, 1.05]}
				vlines={[{ x: D_MAX, stroke: 'var(--color-surprise)', strokeDasharray: '4 3', label: 'd = n−1 : RSS = 0' }]}
				height={170}
			/>
		</div>
		<div class="panel">
			<h3>erreur de test (MSE, échelle log) — en U</h3>
			<CurveChart
				curves={[{ points: sweep.map((r) => [r.k, r.mse] as [number, number]), stroke: 'var(--color-surprise)', curve: 'linear' }]}
				curveDots={[{ x: d, y: row.mse, r: 4, fill: 'var(--color-agent)' }]}
				xDomain={[0, D_MAX]}
				yScaleType="log"
				height={170}
			/>
		</div>
	</div>

	<div class="panel">
		<h3>critères pénalisés vs degré (tracés pour d ≤ 13)</h3>
		<CurveChart
			curves={[
				{ points: crit.cps, stroke: 'var(--color-positive)', curve: 'linear' },
				{ points: crit.bics, stroke: 'var(--color-agent)', curve: 'linear' },
				{ points: crit.aics, stroke: 'var(--color-surprise)', curve: 'linear' }
			]}
			xDomain={[0, D_MAX - 1]}
			height={190}
			legend={[
				{ label: 'Cp de Mallows', color: 'var(--color-positive)' },
				{ label: 'BIC', color: 'var(--color-agent)' },
				{ label: 'AIC', color: 'var(--color-surprise)' }
			]}
		/>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">vrai degré</span>
			<span class="value">{TRUE_DEGREE}</span>
		</div>
		<div class="cell">
			<span class="label">R² entraînement (d = {d})</span>
			<span class="value">{row.r2.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">erreur de test (d = {d})</span>
			<span class="value">{row.mse.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">d* — Cp</span>
			<span class="value">{crit.dCp}</span>
		</div>
		<div class="cell">
			<span class="label">d* — BIC</span>
			<span class="value">{crit.dBic}</span>
		</div>
		<div class="cell">
			<span class="label">d* — AIC</span>
			<span class="value">{crit.dAic}</span>
		</div>
	</Metrics>

	<p class="caption">
		9.choix_de_modele.pdf, « Illustration : Compromis Biais/Variance » (figures 1–2) :
		le R² croît avec le nombre de paramètres et vaut 1 quand le polynôme interpole ;
		il ne peut comparer que des modèles de même dimension. Les critères pénalisés
		estiment de combien l’erreur d’entraînement sous-estime la vraie erreur («
		optimisme ») ; ici Cp et BIC repèrent un degré proche du vrai, AIC moins
		parcimonieux. À d = n−1, RSS = 0 : AIC/BIC → −∞ (critères dégénérés, non tracés).
		Reference Cp : σ̂² estimé au modèle d = n−2 (1 ddl). n = 15, σ = 0,8, seedé ; jeu
		de test : 40 points frais.
	</p>
</div>

<style>
	.lm-poly {
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
		max-width: 22rem;
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

	.grid2 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
		gap: 1.25rem;
		align-items: start;
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
