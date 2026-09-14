<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import RadioGroup from '$lib/components/controls/RadioGroup.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		bootstrapCoverageStudy,
		bootstrapStandardError,
		olsBootstrapSlopes,
		percentileInterval,
		skewedRegressionSample,
		type BootstrapErrorScenario,
		type CoverageStudy
	} from '$lib/math/bootstrap-inference.js';
	import { gaussianPDF } from '$lib/math/gaussian.js';
	import { olsFit, tConfidenceInterval } from '$lib/math/linear-model.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';

	const B = 400;
	const B_COV = 200;
	const R_COV = 100;
	const ALPHA = 0.05;
	const SEED = 21;
	const N_BINS = 12;

	// La couverture est déterministe par (n, scénario) : on ne la calcule
	// qu'une fois par combinaison (R × B réajustements ≈ 20 000, trop lourd
	// pour chaque glissement du slider sans cache).
	const coverageCache = new Map<string, CoverageStudy>();
	function coverageFor(n: number, scenario: BootstrapErrorScenario): CoverageStudy {
		const key = `${n}|${scenario}`;
		const hit = coverageCache.get(key);
		if (hit) return hit;
		const res = bootstrapCoverageStudy({ n, B: B_COV, R: R_COV, alpha: ALPHA, scenario, seed: SEED });
		coverageCache.set(key, res);
		return res;
	}

	let n = $state(15);
	let scenario = $state<BootstrapErrorScenario>('gaussian');

	const sample = $derived(skewedRegressionSample(n, scenario, SEED));
	const fit = $derived(olsFit(sample.X, sample.y));
	const b1 = $derived(fit.beta[1]);
	const se1 = $derived(fit.seBeta[1]);

	const slopes = $derived.by(() => {
		const rng = mulberry32(combineSeed(SEED, n * 10 + (scenario === 'gaussian' ? 1 : 2)));
		return olsBootstrapSlopes(sample.X, sample.y, B, rng);
	});
	const bootSE = $derived(bootstrapStandardError(slopes));

	const histo = $derived.by(() => {
		const lo = Math.min(...slopes),
			hi = Math.max(...slopes);
		const w = (hi - lo) / N_BINS || 1;
		const counts = new Array<number>(N_BINS).fill(0);
		for (const e of slopes) counts[Math.min(N_BINS - 1, Math.floor((e - lo) / w))]++;
		return {
			counts,
			centers: counts.map((_, i) => lo + (i + 0.5) * w),
			width: w
		};
	});

	// Densité bootstrap (histogramme normalisé) vs la gaussienne N(β̂₁, SE²)
	// que l'IC de Student de la leçon suppose implicitement.
	const bootDensity = $derived(
		histo.counts.map((c, i) => [histo.centers[i], c / (B * histo.width)] as [number, number])
	);
	const gaussCurve = $derived.by(() => {
		const lo = b1 - 3.5 * se1,
			hi = b1 + 3.5 * se1;
		return Array.from({ length: 101 }, (_, i) => {
			const t = lo + ((hi - lo) * i) / 100;
			return [t, gaussianPDF(t, { mu: b1, sigma2: se1 ** 2 })] as [number, number];
		});
	});

	const icT = $derived(tConfidenceInterval(b1, se1, ALPHA, n - 2));
	const icP = $derived(percentileInterval(slopes, ALPHA));
	const coverage = $derived(coverageFor(n, scenario));

	// Droite graduée comparant les deux intervalles : SVG minimal fait main
	// (fallback — aucun composant de graphe ne dessine d'intervalles sur une
	// ligne ; à remplacer par un composant dédié si on en construit un).
	const axis = $derived.by(() => {
		const lo = Math.min(icT[0], icP[0], sample.beta[1]);
		const hi = Math.max(icT[1], icP[1], b1);
		const pad = (hi - lo) * 0.08 || 0.1;
		const d0 = lo - pad;
		const d1 = hi + pad;
		const W = 640;
		const ml = 18;
		const mr = 18;
		const sx = (v: number) => ml + ((v - d0) / (d1 - d0)) * (W - ml - mr);
		return { d0, d1, W, sx, axisY: 40 };
	});
</script>

<div class="lm-boot">
	<p class="intro">
		Même échantillon seedé <strong>y = 2 + 1,5x + ε</strong> (xᵢ ∼ U(0,10)),
		mais sans supposer (H3) : on ré-échantillonne B = 400 fois les paires
		(xᵢ, yᵢ) avec remise et on réajuste la pente à chaque fois. L'histogramme
		des β̂*₁ est l'estimation bootstrap de la loi d'échantillonnage de β̂₁ —
		et les deux intervalles à 95 % (Student, de la leçon ; percentile
		bootstrap) sont comparés avec leur couverture empirique sur R = 100
		expériences seedées.
	</p>

	<div class="controls">
		<Slider min={5} max={40} step={1} bind:value={n} label="n (observations)" />
		<RadioGroup label="erreurs ε :">
			<RadioButton value="gaussian" label="gaussiennes (H3)" bind:groupValue={scenario} size="md" />
			<RadioButton value="asymmetric" label="asymétriques" bind:groupValue={scenario} size="md" />
		</RadioGroup>
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>β̂*₁ sur B = 400 échantillons bootstrap</h3>
			<BarChart
				values={histo.counts}
				labels={histo.centers.map((c) => c.toFixed(1))}
				yMax={Math.max(...histo.counts)}
				color="var(--color-agent)"
				height={170}
				showValues={false}
			/>
		</div>
		<div class="panel">
			<h3>loi bootstrap vs gaussienne N(β̂₁, SE²) supposée</h3>
			<DensityChart
				curves={[
					{
						points: gaussCurve,
						stroke: 'var(--color-belief)',
						fill: 'var(--color-belief)',
						fillOpacity: 0.08,
						curve: 'basis'
					},
					{
						points: bootDensity,
						stroke: 'var(--color-agent)',
						fill: 'none',
						curve: 'basis'
					}
				]}
				observations={[
					{ x: sample.beta[1], label: 'β₁', stroke: 'var(--color-positive)' },
					{ x: b1, label: 'β̂₁', stroke: 'var(--color-text-muted)' }
				]}
				legend={[
					{ label: 'N(β̂₁, SE²) — hypothèse de la leçon', color: 'var(--color-belief)', kind: 'fill' },
					{ label: 'densité bootstrap (B = 400)', color: 'var(--color-agent)', kind: 'line' }
				]}
				height={170}
			/>
		</div>
	</div>

	<div class="panel">
		<h3>intervalles à 95 % pour β₁</h3>
		<svg viewBox={`0 0 ${axis.W} 92`} role="img" aria-label="Comparaison des intervalles de confiance à 95 % de l'IC de Student et de l'IC bootstrap percentile pour la pente">
			<!-- axe -->
			<line x1="10" x2={axis.W - 10} y1={axis.axisY} y2={axis.axisY} stroke="var(--color-text-muted)" stroke-opacity="0.5" stroke-width="1" />
			<!-- IC de Student (symétrique, loi exacte sous H3) -->
			<line x1={axis.sx(icT[0])} x2={axis.sx(icT[1])} y1={22} y2={22} stroke="var(--color-surprise)" stroke-width="7" stroke-linecap="round" opacity="0.85" />
			<text x={axis.sx(icT[1])} y={14} text-anchor="end" font-size="11" fill="var(--color-surprise)">IC Student</text>
			<!-- IC percentile bootstrap -->
			<line x1={axis.sx(icP[0])} x2={axis.sx(icP[1])} y1={58} y2={58} stroke="var(--color-agent)" stroke-width="7" stroke-linecap="round" opacity="0.85" />
			<text x={axis.sx(icP[1])} y={50} text-anchor="end" font-size="11" fill="var(--color-agent)">IC percentile (B = 400)</text>
			<!-- marqueurs β₁ (vrai) et β̂₁ -->
			<line x1={axis.sx(sample.beta[1])} x2={axis.sx(sample.beta[1])} y1={10} y2={74} stroke="var(--color-positive)" stroke-width="1.5" stroke-dasharray="4 3" />
			<text x={axis.sx(sample.beta[1])} y={86} text-anchor="middle" font-size="11" fill="var(--color-positive)">β₁ = {sample.beta[1].toFixed(2)}</text>
			<circle cx={axis.sx(b1)} cy={axis.axisY} r="3.5" fill="var(--color-text-muted)" />
		</svg>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">β̂₁ (réajustement OLS)</span>
			<span class="value">{b1.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">SE analytique σ̂/√Σ(xᵢ−x̄)²</span>
			<span class="value">{se1.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">SE bootstrap (B = 400)</span>
			<span class="value">{bootSE.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">couverture IC Student (R = 100, cible 95 %)</span>
			<span class="value">{(coverage.studentCoverage * 100).toFixed(1)} %</span>
		</div>
		<div class="cell">
			<span class="label">couverture IC percentile (R = 100, cible 95 %)</span>
			<span class="value">{(coverage.percentileCoverage * 100).toFixed(1)} %</span>
		</div>
	</Metrics>

	<p class="caption">
	Petit problème synthétique seedé (β₀ = 2, β₁ = 1,5 ; illustration des
	mécanismes, pas un benchmark) : B = 400 réajustements pour la loi
	bootstrap, R = 100 expériences (B = 200) pour les couvertures, qui
	fluctuent d'environ ±4 %. Pour la pente — une statistique
	<strong>linéaire</strong> — la loi d'échantillonnage reste quasi
	gaussienne même avec des erreurs asymétriques (théorème de la limite
	centrale) : l'IC de Student de la leçon reste calé sur 95 %, et l'IC
	percentile aussi, sauf pour de très petits n où son bruit Monte Carlo
	(B = 200) le fait dériver davantage. Les
	contrastes spectaculaires du bootstrap (notamment l'échec sur le
	maximum, 3.4.5.bis) concernent des statistiques non linéaires.
	</p>
</div>

<style>
	.lm-boot {
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
