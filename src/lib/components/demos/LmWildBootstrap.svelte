<script lang="ts">
	import RadioGroup from '$lib/components/controls/RadioGroup.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		bootstrapStandardError,
		heteroRegressionSample,
		residualBootstrapSlopes,
		trueSlopeSE,
		wildBootstrapSlopes,
		type TrueSE,
		type WildWeights
	} from '$lib/math/bootstrap-inference.js';
	import { olsFit } from '$lib/math/linear-model.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';

	const B = 400;
	const R = 200;
	const SEED = 21;

	// La vraie SE est déterministe par n : on ne la calcule qu'une fois par
	// valeur (R réajustements ≈ 200, trop lourd pour chaque glissement sans
	// cache — même pattern que la démo d'inférence bootstrap de la leçon 3).
	const trueSECache = new Map<number, TrueSE>();
	function trueSEFor(n: number): TrueSE {
		const hit = trueSECache.get(n);
		if (hit) return hit;
		const res = trueSlopeSE({ n, R, seed: SEED });
		trueSECache.set(n, res);
		return res;
	}

	let n = $state(60);
	let weights = $state<WildWeights>('rademacher');

	const sample = $derived(heteroRegressionSample(n, SEED));
	const fit = $derived(olsFit(sample.X, sample.y));
	const b0 = $derived(fit.beta[0]);
	const b1 = $derived(fit.beta[1]);
	const seHomos = $derived(fit.seBeta[1]);

	const naiveSlopes = $derived.by(() => {
		const rng = mulberry32(combineSeed(SEED, n * 100 + 1));
		return residualBootstrapSlopes(sample.X, sample.y, B, rng);
	});
	const wildSlopes = $derived.by(() => {
		const rng = mulberry32(combineSeed(SEED, n * 100 + 2));
		return wildBootstrapSlopes(sample.X, sample.y, B, rng, weights);
	});
	const naiveSE = $derived(bootstrapStandardError(naiveSlopes));
	const wildSE = $derived(bootstrapStandardError(wildSlopes));
	const trueSE = $derived(trueSEFor(n).se);

	const naiveRatio = $derived(naiveSE / trueSE);
	const wildRatio = $derived(wildSE / trueSE);

	// Nuage de points + droite ajustée + éventail σ(x) = 1 + 2x/10 : SVG
	// minimal fait main (fallback — les composants de graphe existants ne
	// dessinent pas de bande d'hétéroscédasticité autour d'une droite ; à
	// remplacer par un composant dédié si on en construit un).
	const plot = $derived.by(() => {
		const W = 640;
		const H = 240;
		const ml = 34;
		const mr = 12;
		const mt = 12;
		const mb = 26;
		const x0 = 0;
		const x1 = 10;
		const ys = sample.y;
		let lo = Math.min(...ys);
		let hi = Math.max(...ys);
		lo = Math.min(lo, b0 - 3.4);
		hi = Math.max(hi, b0 + 10 * b1 + 3.4);
		const sx = (v: number) => ml + ((v - x0) / (x1 - x0)) * (W - ml - mr);
		const sy = (v: number) => mt + (1 - (v - lo) / (hi - lo)) * (H - mt - mb);
		// Éventail : 21 sections entre 0 et 10, bordées par β̂(x) ± σ(x).
		const upper: string[] = [];
		const lower: string[] = [];
		for (let i = 0; i <= 20; i++) {
			const x = (i / 20) * 10;
			const band = sample.sigma2(x) > 0 ? Math.sqrt(sample.sigma2(x)) : 0;
			upper.push(`${sx(x).toFixed(1)},${sy(b0 + b1 * x + band).toFixed(1)}`);
			lower.push(`${sx(x).toFixed(1)},${sy(b0 + b1 * x - band).toFixed(1)}`);
		}
		const fanPath = `M ${upper.join(' L ')} L ${lower.reverse().join(' L ')} Z`;
		return { W, H, mt, mb, sx, sy, fanPath, x0, x1 };
	});
</script>

<div class="lm-wild">
	<p class="intro">
		Régression simple seedée <strong>y = 2 + 1,5x + ε</strong> avec
		<strong>éventail</strong> : Var(εᵢ) = σ²(xᵢ) = (1 + 2xᵢ/10)² —
		l'écart-type des erreurs passe de 1 à 3 quand x va de 0 à 10, et (H3)
		est en défaut. Quatre erreurs-types de la pente β̂₁ sont comparées : la
		formule homoscédastique du cours, le resamplage naïf des résidus
		(Wu, 1986), le wild bootstrap (Rademacher ou Mammen) et la vraie
		erreur-type mesurée sur R = 200 expériences seedées.
	</p>

	<div class="controls">
		<Slider min={10} max={200} step={5} bind:value={n} label="n (observations)" />
		<RadioGroup label="poids du wild bootstrap :">
			<RadioButton value="rademacher" label="Rademacher (±1)" bind:groupValue={weights} size="md" />
			<RadioButton value="mammen" label="Mammen (−0,618 / +1,618)" bind:groupValue={weights} size="md" />
		</RadioGroup>
	</div>

	<div class="panel">
		<h3>design en éventail — droite ajustée et σ(x) = 1 + 2x/10 (connu en simulation)</h3>
		<svg viewBox={`0 0 ${plot.W} ${plot.H}`} role="img" aria-label="Nuage de points de la régression en éventail, droite ajustée et bande d'incertitude σ(x) = 1 + 2x/10">
			<!-- éventail -->
			<path d={plot.fanPath} fill="var(--color-surprise)" fill-opacity="0.08" stroke="var(--color-surprise)" stroke-opacity="0.35" stroke-width="1" />
			<!-- axes -->
			<line x1={plot.sx(0)} x2={plot.sx(plot.x1)} y1={plot.H - plot.mb + 4} y2={plot.H - plot.mb + 4} stroke="var(--color-text-muted)" stroke-opacity="0.5" stroke-width="1" />
			<line x1={plot.sx(0)} x2={plot.sx(0)} y1={plot.mt} y2={plot.H - plot.mb + 4} stroke="var(--color-text-muted)" stroke-opacity="0.5" stroke-width="1" />
			<!-- graduations x -->
			{#each [0, 5, 10] as xt}
				<text x={plot.sx(xt)} y={plot.H - plot.mb + 18} text-anchor="middle" font-size="11" fill="var(--color-text-muted)">{xt}</text>
			{/each}
			<!-- droite ajustée -->
			<line x1={plot.sx(0)} y1={plot.sy(b0)} x2={plot.sx(10)} y2={plot.sy(b0 + 10 * b1)} stroke="var(--color-belief)" stroke-width="2" />
			<!-- points -->
			{#each sample.X as row, i}
				<circle cx={plot.sx(row[1])} cy={plot.sy(sample.y[i])} r="2.5" fill="var(--color-agent)" fill-opacity="0.65" />
			{/each}
		</svg>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">β̂₁ (réajustement OLS)</span>
			<span class="value">{b1.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">SE du cours (homoscédastique)</span>
			<span class="value">{seHomos.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">SE résidus i.i.d. (naïf, B = 400)</span>
			<span class="value">{naiveSE.toFixed(4)} <small>× {naiveRatio.toFixed(2)} vs vraie</small></span>
		</div>
		<div class="cell">
			<span class="label">SE wild {weights === 'rademacher' ? 'Rademacher' : 'Mammen'} (B = 400)</span>
			<span class="value">{wildSE.toFixed(4)} <small>× {wildRatio.toFixed(2)} vs vraie</small></span>
		</div>
		<div class="cell">
			<span class="label">SE vraie (R = 200 expériences)</span>
			<span class="value">{trueSE.toFixed(4)}</span>
		</div>
	</Metrics>

	<p class="caption">
	Petit problème synthétique seedé (β₀ = 2, β₁ = 1,5 ; illustration du
	résultat de Wu (1986), pas un benchmark) : B = 400 réajustements par
	méthode, R = 200 expériences pour la SE vraie. La pente est une
	statistique <strong>linéaire</strong>, les trois distributions bootstrap
	racent donc quasi gaussiennes — le contraste est dans la <strong>valeur</strong>
	de la SE : le resamplage naïf des résidus impose implicitement une
	variance constante et sous-estime la SE sur cet éventail (rapport ≈ 0,88
	ici), tandis que le wild bootstrap préserve la variance locale
	ε̂ᵢ² et reste calé (rapport ≈ 1). La SE du cours, elle, suppose (H3).
	Les rapports fluctuent d'environ ±5 % (bruit Monte Carlo, B = 400).
	</p>
</div>

<style>
	.lm-wild {
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

	.cell .value small {
		font-size: 0.7rem;
		font-weight: 400;
		color: var(--color-text-muted);
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
