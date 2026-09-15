<script lang="ts">
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		bootstrapMaxPivots,
		bootstrapMedians,
		bootstrapStandardError,
		exponentialPDF,
		medianSEUniform,
		parametricBootstrapMaxPivots,
		quantileOfSorted,
		uniformSample
	} from '$lib/math/bootstrap-inference.js';
	import { gaussianPDF } from '$lib/math/gaussian.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';

	const THETA = 4;
	const B = 500;
	const SEED = 21;
	const N_BINS = 14;

	let n = $state(30);
	let parametric = $state(false);

	const sample = $derived(uniformSample(n, THETA, SEED));
	const xMax = $derived(Math.max(...sample));
	const m = $derived(quantileOfSorted([...sample].toSorted((a, b) => a - b), 0.5));

	const naivePivots = $derived.by(() => {
		const rng = mulberry32(combineSeed(SEED, n * 10 + 1));
		return bootstrapMaxPivots(sample, B, rng);
	});
	const paramPivots = $derived.by(() => {
		const rng = mulberry32(combineSeed(SEED, n * 10 + 2));
		return parametricBootstrapMaxPivots(sample, B, rng);
	});
	const pivots = $derived(parametric ? paramPivots : naivePivots);
	const medians = $derived.by(() => {
		const rng = mulberry32(combineSeed(SEED, n * 10 + 3));
		return bootstrapMedians(sample, B, rng);
	});

	const coincidence = $derived(pivots.filter((p) => p === 0).length / B);
	const theoryCoincidence = $derived(1 - (1 - 1 / n) ** n);
	const bootMedianSE = $derived(bootstrapStandardError(medians));
	const medSETheory = $derived(medianSEUniform(THETA, n));

	// Histogramme du pivot + densité exponentielle de référence : SVG minimal
	// fait main (fallback — BarChart ne superpose pas de courbe de densité,
	// et le pic en 0 exige une échelle tronquée ; à remplacer par un
	// composant dédié si on en construit un).
	const pivotPlot = $derived.by(() => {
		const W = 640;
		const H = 220;
		const ml = 30;
		const mr = 12;
		const mt = 26;
		const mb = 26;
		const NB = 24;
		const dmax = Math.max(3, 1.05 * Math.max(...pivots));
		const w = dmax / NB;
		const counts = new Array<number>(NB).fill(0);
		for (const p of pivots) counts[Math.min(NB - 1, Math.floor(p / w))]++;
		const spike = counts[0];
		const tailMax = Math.max(1, ...counts.slice(1));
		const plotH = H - mt - mb;
		const sx = (v: number) => ml + (v / dmax) * (W - ml - mr);
		const hTail = (c: number) => (c / tailMax) * 0.72 * plotH;
		// Courbe exponentielle en équivalent de counts (densité × B × w),
		// tracée à partir de la première bin non dégénérée (le pivot est
		// exactement 0 sur le pic, la limite Exp(1) est continue en 0).
		const curve: string[] = [];
		for (let i = 0; i <= 100; i++) {
			const x = w + ((dmax - w) * i) / 100;
			const countEq = exponentialPDF(x) * B * w;
			const y = mt + plotH - Math.min(hTail(countEq), 0.72 * plotH);
			curve.push(`${sx(x).toFixed(1)},${y.toFixed(1)}`);
		}
		return { W, H, ml, mr, mt, mb, w, dmax, NB, counts, spike, plotH, sx, hTail, curvePath: `M ${curve.join(' L ')}` };
	});

	// Histogramme normalisé des médianes bootstrap vs N(m, θ²/(4n)).
	const medHisto = $derived.by(() => {
		const lo = Math.min(...medians);
		const hi = Math.max(...medians);
		const w = (hi - lo) / N_BINS || 1;
		const counts = new Array<number>(N_BINS).fill(0);
		for (const e of medians) counts[Math.min(N_BINS - 1, Math.floor((e - lo) / w))]++;
		return {
			counts,
			centers: counts.map((_, i) => lo + (i + 0.5) * w),
			width: w
		};
	});
	const medDensity = $derived(
		medHisto.counts.map((c, i) => [medHisto.centers[i], c / (B * medHisto.width)] as [number, number])
	);
	const medGauss = $derived.by(() => {
		const se = medSETheory;
		const lo = Math.max(0, m - 3.5 * se);
		const hi = Math.min(THETA, m + 3.5 * se);
		return Array.from({ length: 101 }, (_, i) => {
			const t = lo + ((hi - lo) * i) / 100;
			return [t, gaussianPDF(t, { mu: m, sigma2: se ** 2 })] as [number, number];
		});
	});
</script>

<div class="order-stats">
	<p class="intro">
		Échantillon seedé de taille n de l'uniforme sur <strong>(0, θ)</strong>
		avec <strong>θ = 4 connu</strong> (simulation). À gauche, le pivot du
		maximum <strong>n(X₍ₙ₎ − X*₍ₙ₎)/X₍ₙ₎</strong> : l'histogramme porte un
		pic en 0 (la maximum bootstrappée ne peut pas dépasser la maximum
		observée) — pas de limite faible, alors que la courbe exponentielle est
		la vraie loi du pivot. À droite, la médiane, elle, se bootstrappe
		proprement. Le toggle montre la réparation du maximum par le bootstrap
		paramétrique (tirage dans (0, X₍ₙ₎)).
	</p>

	<div class="controls">
		<Slider min={5} max={200} step={5} bind:value={n} label="n (observations)" />
		<Toggle bind:checked={parametric} label="bootstrap paramétrique U(0, X₍ₙ₎)" />
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>{parametric ? 'pivot du maximum (paramétrique) vs Exp(1)' : 'pivot du maximum (non paramétrique) vs Exp(1)'}</h3>
			<svg viewBox={`0 0 ${pivotPlot.W} ${pivotPlot.H}`} role="img" aria-label="Histogramme du pivot bootstrap du maximum avec sa masse en 0 et courbe exponentielle de référence">
				<!-- axe -->
				<line x1={pivotPlot.ml - 6} x2={pivotPlot.W - pivotPlot.mr} y1={pivotPlot.mt + pivotPlot.plotH} y2={pivotPlot.mt + pivotPlot.plotH} stroke="var(--color-text-muted)" stroke-opacity="0.5" stroke-width="1" />
				<!-- barre du pic en 0 (hauteur non à l'échelle, masse annotée) -->
				<rect x={pivotPlot.sx(0)} y={pivotPlot.mt + pivotPlot.plotH - 0.38 * pivotPlot.plotH} width={pivotPlot.sx(pivotPlot.w) - pivotPlot.sx(0)} height={0.38 * pivotPlot.plotH} fill="var(--color-surprise)" fill-opacity="0.75" />
				<text x={pivotPlot.sx(pivotPlot.w / 2)} y={pivotPlot.mt + 16} text-anchor="middle" font-size="11" font-weight="600" fill="var(--color-surprise)">
					{parametric ? '—' : `masse ≈ ${(coincidence * 100).toFixed(0)} %`}
				</text>
				<!-- barres de la queue (échelle propre) -->
				{#each pivotPlot.counts as c, i}
					{#if i > 0}
						<rect x={pivotPlot.sx(i * pivotPlot.w) + 1} y={pivotPlot.mt + pivotPlot.plotH - pivotPlot.hTail(c)} width={pivotPlot.sx((i + 1) * pivotPlot.w) - pivotPlot.sx(i * pivotPlot.w) - 2} height={pivotPlot.hTail(c)} fill="var(--color-agent)" fill-opacity="0.6" rx="2" />
					{/if}
				{/each}
				<!-- densité Exp(1) de référence -->
				<path d={pivotPlot.curvePath} fill="none" stroke="var(--color-belief)" stroke-width="2" />
				<!-- graduations -->
				{#each [0, 1, 2, 3] as xt}
					{#if xt <= pivotPlot.dmax}
						<text x={pivotPlot.sx(xt)} y={pivotPlot.mt + pivotPlot.plotH + 16} text-anchor="middle" font-size="11" fill="var(--color-text-muted)">{xt}</text>
					{/if}
				{/each}
			</svg>
			<p class="mini">
				{#if !parametric}
					masse théorique en 0 : 1 − (1−1/n)ⁿ ≈ {theoryCoincidence.toFixed(3)} — la
					limite Exp(1) (courbe bleue) est continue en 0 : le pivot n'a pas de
					limite faible (Bickel &amp; Freedman, 1981, §6).
				{:else}
					tirage dans (0, X₍ₙ₎) : le pivot n(1 − U₍ₙ₎) épouse la courbe Exp(1) —
					la réparation par le bootstrap paramétrique (Bickel &amp; Freedman, 1981, §6).
				{/if}
			</p>
		</div>
		<div class="panel">
			<h3>médiane bootstrap vs N(m, θ²/4n) — Prop. 5.1</h3>
			<DensityChart
				curves={[
					{
						points: medGauss,
						stroke: 'var(--color-belief)',
						fill: 'var(--color-belief)',
						fillOpacity: 0.08,
						curve: 'basis'
					},
					{
						points: medDensity,
						stroke: 'var(--color-agent)',
						fill: 'none',
						curve: 'basis'
					}
				]}
				observations={[{ x: m, label: 'm', stroke: 'var(--color-positive)' }]}
				legend={[
					{ label: 'N(m, θ²/4n) — théorie', color: 'var(--color-belief)', kind: 'fill' },
					{ label: `médianes bootstrap (B = ${B})`, color: 'var(--color-agent)', kind: 'line' }
				]}
				height={170}
			/>
			<p class="mini">
				avec f = 1/θ, l'écart-type limite de la médiane vaut θ/(2√n) —
				le bootstrap le reproduit (cas de succès, en contraste avec le
				maximum).
			</p>
		</div>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">X₍ₙ₎ (maximum observée)</span>
			<span class="value">{xMax.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">coïncidence X*₍ₙ₎ = X₍ₙ₎ (B = 500)</span>
			<span class="value">{(coincidence * 100).toFixed(1)} %</span>
		</div>
		<div class="cell">
			<span class="label">1 − (1−1/n)ⁿ (exact par construction)</span>
			<span class="value">{(theoryCoincidence * 100).toFixed(1)} %</span>
		</div>
		<div class="cell">
			<span class="label">SE bootstrap de la médiane (B = 500)</span>
			<span class="value">{bootMedianSE.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">SE théorique θ/(2√n)</span>
			<span class="value">{medSETheory.toFixed(4)}</span>
		</div>
	</Metrics>

	<p class="caption">
	Petit problème synthétique seedé (θ = 4 connu ; illustration du
	contre-exemple de Bickel &amp; Freedman (1981, §6), pas un benchmark).
	La bosse en 0 est <strong>exacte par construction</strong> : 1 −
	(1−1/n)ⁿ → 1 − 1/e ≈ 63 %, et la hauteur de la barre violette n'est pas à
	l'échelle (la queue est échelonnée séparément pour rester lisible). Dans
	l'usage réel, θ est inconnu — c'est précisément le pivot qu'on chercherait
	à approcher, et la limite exponentielle ne se voit que parce que la
	simulation donne θ. La médiane, fonctionnel de von Mises (f(m) &gt; 0),
	reste calée à ±10 % de θ/(2√n) pour n modéré (bruit Monte Carlo, B = 500).
	</p>
</div>

<style>
	.order-stats {
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
		align-items: center;
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

	.mini {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.cell .label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.cell .value {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text);
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
