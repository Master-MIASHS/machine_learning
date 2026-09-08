<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { gaussianSample } from '$lib/math/gaussian.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';
	import { olsFit, sseSimple, withIntercept } from '$lib/math/linear-model.js';

	// Nuage seedé : y ≈ 1 + 1.2x + N(0, 1.5²), 15 points, x ∈ [0, 10]
	// (illustratif — pas un jeu de données des sources).
	const N = 15;
	const SEED = 21;
	const rng = mulberry32(combineSeed(SEED, 1));
	const x: number[] = [];
	const y: number[] = [];
	for (let i = 0; i < N; i++) {
		const xi = 10 * rng();
		x.push(xi);
		y.push(1 + 1.2 * xi + gaussianSample({ mu: 0, sigma2: 2.25 }, rng));
	}

	const fit = olsFit(withIntercept(x.map((v) => [v])), y);
	const beta0Hat = fit.beta[0];
	const beta1Hat = fit.beta[1];
	const sseOls = fit.sse;

	const B0_MIN = -10,
		B0_MAX = 20,
		B1_MIN = -2,
		B1_MAX = 4;
	let b0 = $state(0);
	let b1 = $state(2);

	const sseCurrent = $derived(sseSimple(x, y, b0, b1));

	const W = 380;
	const H = 250;
	// Doit rester synchronisé avec le pad interne de ScatterPlot.svelte (pad = 4 px).
	const PAD = 4;
	const domainX = $derived.by((): [number, number] => {
		const lo = Math.min(...x),
			hi = Math.max(...x);
		const pad = (hi - lo) * 0.15 || 1;
		return [lo - pad, hi + pad];
	});
	const domainY = $derived.by((): [number, number] => {
		const lo = Math.min(...y),
			hi = Math.max(...y);
		const pad = (hi - lo) * 0.15 || 1;
		return [lo - pad, hi + pad];
	});
	const projX = (v: number): number => PAD + ((v - domainX[0]) / (domainX[1] - domainX[0])) * (W - 2 * PAD);
	const projY = (v: number): number => PAD + ((domainY[1] - v) / (domainY[1] - domainY[0])) * (H - 2 * PAD);

	const points = $derived(x.map((xi, i) => ({ x: xi, y: y[i] })));

	function snapToOls() {
		b0 = beta0Hat;
		b1 = beta1Hat;
	}
</script>

<div class="lm-ols">
	<p class="intro">
		Faites glisser β0 et β1 et observez la somme des carrés des résidus SSE(β0, β1) : la
		droite qui la minimise est l'ajustement des moindres carrés (Théorème 1).
	</p>

	<div class="controls">
		<div class="control-row">
			<span class="control-label">intercept β0</span>
			<Slider min={B0_MIN} max={B0_MAX} step={0.1} bind:value={b0} label="intercept beta0" />
		</div>
		<div class="control-row">
			<span class="control-label">pente β1</span>
			<Slider min={B1_MIN} max={B1_MAX} step={0.05} bind:value={b1} label="pente beta1" />
		</div>
		<div class="control-row">
			<Button onclick={snapToOls}>Moindres carrés (β̂)</Button>
		</div>
	</div>

	<div class="grid">
		<div class="panel">
			<h3>nuage et droite β0 + β1·x</h3>
			<ScatterPlot
				points={points}
				domainX={domainX}
				domainY={domainY}
				width={W}
				height={H}
				defaultColor="var(--color-belief)"
				defaultSize={4.5}
			>
				{#snippet snippetOverlay()}
					<g pointer-events="none">
						{#each x as xi, i (i)}
							<line
								x1={projX(xi)}
								y1={projY(y[i])}
								x2={projX(xi)}
								y2={projY(b0 + b1 * xi)}
								stroke="var(--color-surprise)"
								stroke-width="1.5"
								opacity="0.55"
							/>
						{/each}
						<line
							x1={projX(domainX[0])}
							y1={projY(b0 + b1 * domainX[0])}
							x2={projX(domainX[1])}
							y2={projY(b0 + b1 * domainX[1])}
							stroke="var(--color-agent)"
							stroke-width="2.5"
						/>
					</g>
				{/snippet}
			</ScatterPlot>
		</div>
		<div class="panel">
			<h3>paysage SSE(β0, β1) — minimum unique sous (H1)</h3>
			<ContourPlot
				f={(a: number, b: number) => sseSimple(x, y, a, b)}
				domain={[
					[B0_MIN, B0_MAX],
					[B1_MIN, B1_MAX]
				]}
				width={W}
				height={H}
				markers={[{ x: beta0Hat, y: beta1Hat }]}
				sublevel={sseCurrent}
			/>
		</div>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">SSE(β0, β1)</span>
			<span class="value">{sseCurrent.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">SSE min (MCO)</span>
			<span class="value">{sseOls.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">β̂0</span>
			<span class="value">{beta0Hat.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">β̂1</span>
			<span class="value">{beta1Hat.toFixed(3)}</span>
		</div>
	</Metrics>

	<p class="caption">
		StatM1S1_2025.pdf, §I.4 (Théorème 1) : sous (H1), ‖Y − Xβ‖² est minimisé de façon
		unique en β̂ = (XᵀX)⁻¹XᵀY. Le bouton « Moindres carrés » snap la droite vers (β̂0, β̂1)
		et le niveau de contour mis en évidence passe alors au minimum. Nuage illustratif
		seedé (pas un jeu de données des sources).
	</p>
</div>

<style>
	.lm-ols {
		display: grid;
		gap: 1rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.controls {
		display: grid;
		gap: 0.9rem;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.control-label {
		min-width: 7.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
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
