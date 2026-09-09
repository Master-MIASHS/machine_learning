<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { aic, bic, olsFit, polynomialDesign, polynomialFamily } from '$lib/math/linear-model.js';

	const TRUE_DEGREE = 2;
	const D_MAX = 8;
	const SIGMA = 1.2;
	const SEED = 3;
	// Même vrai polynôme pour tous les n : les coefficients ne dépendent que du seed.
	const nValues = Array.from({ length: 19 }, (_, i) => 50 + 25 * i); // 50 … 500

	let n = $state(100);

	function sweepAt(nn: number) {
		const { x, y } = polynomialFamily({ n: nn, degree: TRUE_DEGREE, sigma: SIGMA, seed: SEED });
		const aics: [number, number][] = [];
		const bics: [number, number][] = [];
		for (let d = 0; d <= D_MAX; d++) {
			const fit = olsFit(polynomialDesign(x, d), y);
			aics.push([d, aic(fit.sse, nn, d + 1)]);
			bics.push([d, bic(fit.sse, nn, d + 1)]);
		}
		const argmin = (pts: [number, number][]) => pts.reduce((b, p) => (p[1] < b[1] ? p : b))[0];
		return { aics, bics, dAic: argmin(aics), dBic: argmin(bics) };
	}

	const cur = $derived(sweepAt(n));

	// Courbes d* (n) : calculées une seule fois (indépendantes du slider).
	const overN = $derived.by(() =>
		nValues.map((nn) => {
			const s = sweepAt(nn);
			return { nn, dAic: s.dAic, dBic: s.dBic };
		})
	);
	const aicByN = $derived(overN.map((r) => [r.nn, r.dAic] as [number, number]));
	const bicByN = $derived(overN.map((r) => [r.nn, r.dBic] as [number, number]));
</script>

<div class="lm-abc">
	<p class="intro">
		Même famille de modèles (polynômes de degré 0 à 8, vrai degré 2) pour
		<KatexInline formula={String.raw`n`} /> croissant. AIC pénalise chaque paramètre par
		<KatexInline formula="2" /> ; BIC par
		<KatexInline formula={String.raw`\log n`} /> : pour
		<KatexInline formula={String.raw`n > e^2 \approx 7{,}4`} />, la pénalité BIC est plus
		forte, donc BIC est plus <strong>parcimonieux</strong>.
	</p>

	<div class="control-row">
		<Slider min={50} max={500} step={25} bind:value={n} label="n (observations)" />
	</div>

	<div class="panel">
		<h3>AIC et BIC vs degré (n = {n})</h3>
		<CurveChart
			curves={[
				{ points: cur.aics, stroke: 'var(--color-surprise)', curve: 'linear' },
				{ points: cur.bics, stroke: 'var(--color-agent)', curve: 'linear' }
			]}
			xDomain={[0, D_MAX]}
			height={200}
			legend={[
				{ label: 'AIC', color: 'var(--color-surprise)' },
				{ label: 'BIC', color: 'var(--color-agent)' }
			]}
			vlines={[
				{ x: cur.dAic, stroke: 'var(--color-surprise)', strokeDasharray: '4 3', label: `AIC : d* = ${cur.dAic}` },
				{ x: cur.dBic, stroke: 'var(--color-agent)', strokeDasharray: '4 3', label: `BIC : d* = ${cur.dBic}`, labelOffset: -16 }
			]}
		/>
	</div>

	<div class="panel">
		<h3>degré sélectionné d* en fonction de n (vrai degré : 2)</h3>
		<CurveChart
			curves={[
				{ points: aicByN, stroke: 'var(--color-surprise)', curve: 'linear' },
				{ points: bicByN, stroke: 'var(--color-agent)', curve: 'linear' }
			]}
			xDomain={[50, 500]}
			yDomain={[0, D_MAX + 0.5]}
			height={200}
			legend={[
				{ label: 'd* — AIC', color: 'var(--color-surprise)' },
				{ label: 'd* — BIC', color: 'var(--color-agent)' }
			]}
		/>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">vrai degré</span>
			<span class="value">{TRUE_DEGREE}</span>
		</div>
		<div class="cell">
			<span class="label">d* — AIC (n = {n})</span>
			<span class="value">{cur.dAic}</span>
		</div>
		<div class="cell">
			<span class="label">d* — BIC (n = {n})</span>
			<span class="value">{cur.dBic}</span>
		</div>
		<div class="cell">
			<span class="label">pénalité par paramètre</span>
			<span class="value">AIC : 2 · BIC : log n = {Math.log(n).toFixed(2)}</span>
		</div>
	</Metrics>

	<p class="caption">
		9.choix_de_modele.pdf, « Critère d’information d’Akaike (AIC) » et « Critère
		d’information bayésien BIC » : AIC = −2 log L + 2k, BIC = −2 log L + k log n ; BIC
		« est plus parcimonieux que le critère AIC puisqu’il pénalise davantage le nombre
		de variables ». Ici (observation empirique du simulateur) d*(BIC) ≤ d*(AIC), et
		l’écart entre les deux critères s’accentue avec n — la différence de pénalité par
		paramètre, log n − 2, croît avec n. Même polynôme vrai pour tous les n
		(coefficient fixé par le seed), σ = 1,2, degrees 0…8, seedé.
	</p>
</div>

<style>
	.lm-abc {
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
