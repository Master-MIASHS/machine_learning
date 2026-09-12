<script lang="ts">
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { gaussianSample } from '$lib/math/gaussian.js';
	import {
		meanResponseInterval,
		olsFit,
		predictionInterval,
		predictionLeverage,
		withIntercept
	} from '$lib/math/linear-model.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';

	const N = 15;
	const SEED = 13;
	let alpha = $state(0.05);
	const rng = mulberry32(combineSeed(SEED, 1));
	const x = Array.from({ length: N }, () => rng() * 10);
	const y = x.map((xi) => 2 + 1.5 * xi + gaussianSample({ mu: 0, sigma2: 1 }, mulberry32(combineSeed(SEED, xi * 100 + 2))));
	const X = withIntercept(x.map((v) => [v]));
	const fit = $derived(olsFit(X, y));
	const df = $derived(fit.n - fit.p - 1);

	let x0 = $state(5);

	// Grille des bandes : pour chaque x, levier v0ᵀ(XᵀX)⁻¹v0 avec v0 = (1, x)
	// (StatM1S1_2025.pdf, §6.8).
	const GRID = 41;
	const bands = $derived.by(() => {
		const out = [];
		for (let i = 0; i < GRID; i++) {
			const gx = (10 * i) / (GRID - 1);
			const yhat = fit.beta[0] + fit.beta[1] * gx;
			const lev = predictionLeverage(X, [1, gx]);
			const [ciLo, ciHi] = meanResponseInterval(yhat, fit.sigma2, lev, alpha, df);
			const [piLo, piHi] = predictionInterval(yhat, fit.sigma2, lev, alpha, df);
			out.push({ gx, yhat, ciLo, ciHi, piLo, piHi });
		}
		return out;
	});

	const atX0 = $derived.by(() => {
		const yhat = fit.beta[0] + fit.beta[1] * x0;
		const lev = predictionLeverage(X, [1, x0]);
		const [ciLo, ciHi] = meanResponseInterval(yhat, fit.sigma2, lev, alpha, df);
		const [piLo, piHi] = predictionInterval(yhat, fit.sigma2, lev, alpha, df);
		return { yhat, lev, ciLo, ciHi, piLo, piHi };
	});

	// ── SVG manuel (fallback : aucune chart component ne dessine de bandes) ──
	const W = 460;
	const H = 260;
	const PAD = 32;
	const yLo = $derived(Math.min(...y, ...bands.map((b) => b.piLo)) - 1);
	const yHi = $derived(Math.max(...y, ...bands.map((b) => b.piHi)) + 1);
	const sx = (v: number) => PAD + ((v - 0) / 10) * (W - 2 * PAD);
	const sy = (v: number) => H - PAD - ((v - yLo) / (yHi - yLo)) * (H - 2 * PAD);

	const bandArea = (upper: (b: (typeof bands)[number]) => number, lower: (b: (typeof bands)[number]) => number) => {
		const up = bands.map((b, i) => `${i === 0 ? 'M' : 'L'}${sx(b.gx).toFixed(1)},${sy(upper(b)).toFixed(1)}`);
		const dn = bands
			.map((b) => `L${sx(b.gx).toFixed(1)},${sy(lower(b)).toFixed(1)}`)
			.reverse();
		return up.join(' ') + ' ' + dn.join(' ') + ' Z';
	};

	const piArea = $derived(bandArea((b) => b.piHi, (b) => b.piLo));
	const ciArea = $derived(bandArea((b) => b.ciHi, (b) => b.ciLo));
	const lineEnds = $derived([
		[sx(0), sy(fit.beta[0])],
		[sx(10), sy(fit.beta[0] + 10 * fit.beta[1])]
	]);
</script>

<div class="lm-predband">
	<p class="intro">
		Dans une prédiction, deux incertitudes : celle de la <strong>moyenne</strong> de
		la réponse en <KatexInline formula="x0" /> (bande étroite) et celle d'une
		<strong>nouvelle observation</strong> qui ajoute le bruit ε (bande large). Les deux
		s'élargissent en s'éloignant de <KatexInline formula={String.raw`\bar{x}`} />, via le
		levier <KatexInline formula={String.raw`v_0^\top(X^\topX)^{-1}v_0`} />.
	</p>

	<Slider min={0} max={10} step={0.1} bind:value={x0} label="valeur de prédiction x₀" />
	<Slider min={0.01} max={0.2} step={0.01} bind:value={alpha} label="seuil α (bandes à (1−α)·100 %)" />

	<!-- SVG manuel : fallback tant qu'aucune chart component ne supporte les bandes. -->
	<svg viewBox={`0 0 ${W} ${H}`} class="plot" role="img" aria-label="Bandes de confiance et de prédiction autour de la droite ajustée">
		<path d={piArea} fill="var(--color-agent)" opacity="0.13" />
		<path d={ciArea} fill="var(--color-belief)" opacity="0.28" />
		<line x1={sx(0)} y1={sy(yLo)} x2={sx(0)} y2={sy(yHi)} stroke="var(--color-border)" stroke-width="1" />
		<line x1={sx(0)} y1={sy(yHi)} x2={sx(10)} y2={sy(yHi)} stroke="var(--color-border)" stroke-width="1" />
		<line x1={sx(0)} y1={sy(0)} x2={sx(10)} y2={sy(0)} stroke="var(--color-border)" stroke-width="1" stroke-dasharray="3 3" />
		<line x1={lineEnds[0][0]} y1={lineEnds[0][1]} x2={lineEnds[1][0]} y2={lineEnds[1][1]} stroke="var(--color-text)" stroke-width="1.5" />
		{#each y as yi, i (i)}
			<circle cx={sx(x[i])} cy={sy(yi)} r="3.5" fill="var(--color-belief)" opacity="0.8" />
		{/each}
		<!-- marqueur x0 : segment de l'intervalle de prédiction + bornes -->
		<line
			x1={sx(x0)}
			y1={sy(atX0.piLo)}
			x2={sx(x0)}
			y2={sy(atX0.piHi)}
			stroke="var(--color-surprise)"
			stroke-width="2.5"
		/>
		<line
			x1={sx(x0)}
			y1={sy(atX0.ciLo)}
			x2={sx(x0)}
			y2={sy(atX0.ciHi)}
			stroke="var(--color-belief)"
			stroke-width="4.5"
			opacity="0.9"
		/>
		<circle cx={sx(x0)} cy={sy(atX0.yhat)} r="4" fill="var(--color-text)" />
		<text x={sx(x0) + 6} y={sy(atX0.yhat) - 6} class="lbl">x₀ = {x0.toFixed(1)}</text>
	</svg>

	<div class="legend">
		<span>
			<i class="sw" style="background: color-mix(in srgb, var(--color-belief) 45%, transparent)"></i>IC
			{Math.round((1 - alpha) * 100)} % de la moyenne
		</span>
		<span>
			<i class="sw" style="background: color-mix(in srgb, var(--color-agent) 25%, transparent)"></i>Intervalle de
			prédiction {Math.round((1 - alpha) * 100)} %
		</span>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">ŷ(x₀)</span>
			<span class="value">{atX0.yhat.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">IC moyenne [; ]</span>
			<span class="value">{atX0.ciLo.toFixed(2)} ; {atX0.ciHi.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">prédiction [; ]</span>
			<span class="value">{atX0.piLo.toFixed(2)} ; {atX0.piHi.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">levier v0ᵀ(XᵀX)⁻¹v0</span>
			<span class="value">{atX0.lev.toFixed(4)}</span>
		</div>
	</Metrics>

	<p class="caption">
		StatM1S1_2025.pdf, §6.8 : prévision ŷ0 = β̂0 + β̂1x0 avec v0 = (1, x0) ; l'intervalle
		de prédiction est ŷ0 ± tₙ₋ₚ₋₁(1−α/2)·σ̂√(1 + v0ᵀ(XᵀX)⁻¹v0). L'intervalle de
		confiance de la <em>moyenne</em> est la même formule sans le « + 1 » (aucun bruit de
		nouvelle observation) — extension immédiate de la formule du cours. Nuage seedé
		(n = 15, pente vraie 1.5).
	</p>
</div>

<style>
	.lm-predband {
		display: grid;
		gap: 1.25rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}


	.plot {
		display: block;
		max-width: 100%;
		height: auto;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.lbl {
		font-size: 11px;
		fill: var(--color-text-muted);
	}

	.legend {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.legend .sw {
		display: inline-block;
		width: 0.9rem;
		height: 0.6rem;
		border-radius: 0.15rem;
		margin-right: 0.35rem;
		vertical-align: middle;
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
