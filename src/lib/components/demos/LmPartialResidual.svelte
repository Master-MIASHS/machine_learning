<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { gaussianSample } from '$lib/math/gaussian.js';
	import {
		olsFit,
		partialResiduals,
		withIntercept
	} from '$lib/math/linear-model.js';
	import { combineSeed, linspace, mulberry32 } from '$lib/math/util.js';

	// Vrai modèle : Y = 1 + 0.5·x1 + 0.8·x1² − 1.5·x2 + N(0,1) avec x2
	// confondu avec x1 (x2 = x1 + N(0,1)) : l'effet linéaire de x2 (coefficient
	// −1.5) déforme le nuage brut en un « V » asymétrique — la courbure de x1
	// n'est lisible qu'après retrait de l'effet estimé de x2
	// (8.validation…, « Graphes des résidus partiels »).
	const N = 80;
	const SEED = 23;
	const rng = mulberry32(combineSeed(SEED, 1));
	const x1 = linspace(-2, 2, N);
	const x2 = x1.map((v) => v + gaussianSample({ mu: 0, sigma2: 1 }, rng));
	const y = x1.map((v, i) => 1 + 0.5 * v + 0.8 * v * v - 1.5 * x2[i] + gaussianSample({ mu: 0, sigma2: 1 }, rng));

	let addSquare = $state(false);

	const fitNo = $derived(olsFit(withIntercept(x1.map((v, i) => [v, x2[i]])), y));
	const fitYes = $derived(olsFit(withIntercept(x1.map((v, i) => [v, v * v, x2[i]])), y));

	const fit = $derived(addSquare ? fitYes : fitNo);
	const partial = $derived(partialResiduals(withIntercept(x1.map((v, i) => (addSquare ? [v, v * v, x2[i]] : [v, x2[i]]))), fit, 1));

	const rawPts = $derived(x1.map((v, i) => ({ x: v, y: y[i] })));
	const partPts = $derived(x1.map((v, i) => ({ x: v, y: partial[i] })));
</script>

<div class="lm-partial">
	<p class="intro">
		Le lien réel entre <KatexInline formula="X1" /> et <KatexInline formula="Y" /> est
		quadratique, mais <KatexInline formula="X2" /> est confondue avec
		<KatexInline formula="X1" /> et entre dans le modèle avec un coefficient négatif :
		l'effet linéaire de <KatexInline formula="X2" /> déforme le nuage brut. Les
		<strong>résidus partiels</strong>
		<KatexInline formula={String.raw`\hat{\varepsilon}^{\Delta_1}_i = \hat{\beta}_1 x_{1i} + \hat{\varepsilon}_i`} />
		enlèvent l'effet estimé des <em>autres</em> variables : la relation quadratique
		entre <KatexInline formula="X1" /> et <KatexInline formula="Y" /> s'y lit nettement,
		ce que le nuage brut ne permet pas de conclure. Ajouter
		<KatexInline formula="X1^2" /> au modèle rend alors le résidu partiel linéaire —
		c'est le rôle du diagnostic.
	</p>

	<div class="controls">
		<Toggle checked={addSquare} label="ajouter x1² au modèle" onchange={(v) => (addSquare = v)} />
	</div>

	<div class="grid2">
		<div class="panel">
			<h3>nuage brut (X1, Y) — déformé par X2</h3>
			<ScatterPlot
				points={rawPts}
				domainX={[-2, 2]}
				domainY={[Math.min(...y) - 0.5, Math.max(...y) + 0.5]}
				height={200}
				defaultColor="var(--color-text-muted)"
				defaultSize={3}
			/>
		</div>
		<div class="panel">
			<h3>résidus partiels (X1, β̂1X1 + ε̂)</h3>
			<ScatterPlot
				points={partPts}
				domainX={[-2, 2]}
				domainY={[Math.min(...partial) - 0.5, Math.max(...partial) + 0.5]}
				height={200}
				defaultColor="var(--color-belief)"
				defaultSize={3}
			/>
		</div>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">R² sans x1²</span>
			<span class="value">{fitNo.rSquared.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">R² avec x1²</span>
			<span class="value">{fitYes.rSquared.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">modèle affiché</span>
			<span class="value">{addSquare ? 'avec x1² (linéaire)' : 'sans x1² (courbure)'}</span>
		</div>
	</Metrics>

	<p class="caption">
		8.validation_du_modele_lineaire_2025.pdf, §8.4 : le résidu partiel de Xj pour
		l'individu i vaut β̂j·xji + ε̂i (ou yi − Σk≠j β̂k xki) : il enlève l'effet estimé
		des autres variables. Si le nuage (xji, ε̂Δj,i) s'ajuste par une droite, le lien est
		linéaire ; sinon, on cherche une transformation (polynômes, exp, ln…) à ajouter
		au modèle. n = 80, seedé.
	</p>
</div>

<style>
	.lm-partial {
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
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.grid2 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
		gap: 1.25rem;
		align-items: start;
	}

	.panel {
		min-width: 0;
		display: grid;
		gap: 0.5rem;
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
