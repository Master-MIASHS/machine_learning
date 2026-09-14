<script lang="ts">
	import { onDestroy } from 'svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import {
		runProxLasso,
		estimateReferenceValue,
		demoLassoData,
		type ProxAlgorithm
	} from '$lib/math/proximal.js';

	/*
	 * « Race » ISTA vs FISTA vs ADMM sur un Lasso (expert lesson « Méthodes
	 * proximales », Part I — au-delà du cours).
	 *
	 * Petit problème synthétique seedé (n = 60, d = 12, vrai θ* creux à 4
	 * éléments). Les trois trajectoires F(θ^k) − F* sont tracées en échelle
	 * log-y : ISTA suit O(1/k) (BT09 thm 3.1, droite), FISTA O(1/k²) (BT09
	 * thm 4.4, courbe) ; ADMM converge (BPC11 §3.2) et suit ISTA en pratique
	 * — aucun taux en valeur n'est enseigné pour l'ADMM. Ce n'est PAS un
	 * benchmark : sur un
	 * problème réel, les constantes et le coût d'une itération changent tout
	 * (l'étape x^k d'ADMM résout ici un système 12×12 à chaque itération).
	 * F* est estimé par une longue passe FISTA (4000 itérations), pas par un
	 * solveur exact.
	 */

	const N = 60;
	const D = 12;
	const MAX_ITER = 400;
	const REF_ITER = 4000;

	// Données fixes (module scope) : même problème à chaque chargement de page
	// (constructeur seedé du module proximal — testé dans proximal.test.ts).
	const { X, y } = demoLassoData(N, D, 42);

	/* ---------------------------- controls ---------------------------- */

	let algo = $state<ProxAlgorithm>('ista');
	let lambda = $state(0.4);
	let rho = $state(1);
	let k = $state(MAX_ITER);
	let playing = $state(false);

	/* ---------------------------- math ---------------------------- */

	const refValue = $derived(estimateReferenceValue(X, y, lambda, REF_ITER));

	const runs = $derived.by(() => ({
		ista: runProxLasso('ista', X, y, lambda, { maxIter: MAX_ITER, referenceValue: refValue }),
		fista: runProxLasso('fista', X, y, lambda, { maxIter: MAX_ITER, referenceValue: refValue }),
		admm: runProxLasso('admm', X, y, lambda, { maxIter: MAX_ITER, rho, referenceValue: refValue })
	}));

	const active = $derived(runs[algo]);

	const gapAt = $derived(active.objectiveGap[Math.min(k, MAX_ITER)]);
	const sparsityAt = $derived(active.sparsity[Math.min(k, MAX_ITER)]);
	const zSparsityAt = $derived(algo === 'admm' ? active.zSparsity![Math.min(k, MAX_ITER)] : null);

	const pointsOf = (gaps: number[]): [number, number][] =>
		gaps.map((g, i) => [i, g] as [number, number]);

	const curves = $derived([
		{
			points: pointsOf(runs.ista.objectiveGap),
			stroke: algo === 'ista' ? 'var(--color-text)' : 'var(--color-text-muted)',
			strokeWidth: algo === 'ista' ? 2.5 : 1.8,
			opacity: algo === 'ista' ? 1 : 0.75,
			curve: 'linear' as const
		},
		{
			points: pointsOf(runs.fista.objectiveGap),
			stroke: 'var(--color-belief)',
			strokeWidth: algo === 'fista' ? 2.5 : 1.8,
			opacity: algo === 'fista' ? 1 : 0.75,
			curve: 'linear' as const
		},
		{
			points: pointsOf(runs.admm.objectiveGap),
			stroke: 'var(--color-surprise)',
			strokeWidth: algo === 'admm' ? 2.5 : 1.8,
			opacity: algo === 'admm' ? 1 : 0.75,
			curve: 'linear' as const
		}
	]);

	const currentDot = $derived([
		{
			x: k,
			y: gapAt,
			r: 5.5,
			fill:
				algo === 'ista' ? 'var(--color-text)' : algo === 'fista' ? 'var(--color-belief)' : 'var(--color-surprise)',
			stroke: 'var(--color-bg)',
			strokeWidth: 2,
			bar: true,
			barOpacity: 0.25
		}
	]);

	/* ---------------------------- animation ---------------------------- */

	let rafId: number | null = null;

	function stopLoop() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function tick() {
		rafId = null;
		if (!playing) return;
		if (k < MAX_ITER) {
			k += 1;
			rafId = requestAnimationFrame(tick);
		} else {
			playing = false;
		}
	}

	function togglePlay() {
		stopLoop();
		if (!playing && k >= MAX_ITER) k = 0;
		playing = !playing;
		if (playing) rafId = requestAnimationFrame(tick);
	}

	function reset() {
		stopLoop();
		playing = false;
		k = 0;
	}

	// Un changement de problème (λ, ρ) ou d'algorithme remet la course à zéro.
	$effect(() => {
		void lambda;
		void rho;
		void algo;
		stopLoop();
		playing = false;
		k = 0;
	});

	onDestroy(stopLoop);
</script>

<div class="race">
	<div class="algo-toggle" role="group" aria-label="Algorithme suivi">
		<button class:active={algo === 'ista'} onclick={() => (algo = 'ista')}>ISTA</button>
		<button class:active={algo === 'fista'} onclick={() => (algo = 'fista')}>FISTA</button>
		<button class:active={algo === 'admm'} onclick={() => (algo = 'admm')}>ADMM</button>
	</div>

	<Figure type="chart">
		<CurveChart
			curves={curves}
			xDomain={[0, MAX_ITER]}
			yScaleType="log"
			curve="linear"
			height={280}
			yAxis
			nTicks={6}
			nYTicks={4}
			curveDots={currentDot}
			legend={[
				{ label: 'ISTA — O(1/k)', color: 'var(--color-text)', kind: 'line' },
				{ label: 'FISTA — O(1/k²)', color: 'var(--color-belief)', kind: 'line' },
				{ label: 'ADMM — converge (BPC11 §3.2)', color: 'var(--color-surprise)', kind: 'line' }
			]}
		/>
	</Figure>

	<div class="metrics">
		<div class="metric">
			<div class="m-label">itération</div>
			<div class="m-value">{k} / {MAX_ITER}</div>
		</div>
		<div class="metric">
			<div class="m-label">F(θ<sup>k</sup>) − F*</div>
			<div class="m-value">{gapAt.toExponential(2)}</div>
		</div>
		<div class="metric">
			<div class="m-label">‖θ<sup>k</sup>‖₀</div>
			<div class="m-value">{sparsityAt} / {D}</div>
		</div>
		{#if zSparsityAt !== null}
			<div class="metric">
				<div class="m-label">‖z<sup>k</sup>‖₀ (exactement creux)</div>
				<div class="m-value">{zSparsityAt} / {D}</div>
			</div>
		{/if}
	</div>

	<div class="controls">
		<button class="play" onclick={togglePlay}>
			{#if playing}⏸ Pause{:else if k >= MAX_ITER}↻ Rejouer{:else}▶ Lancer{/if}
		</button>
		<button class="reset" onclick={reset}>k = 0</button>
		<div class="slider-wrap">
			<Slider bind:value={k} min={0} max={MAX_ITER} step={1} label="itération k" />
		</div>
	</div>

	<SliderGrid>
		<div class="grp">
			<div class="gttl">Régularisation</div>
			<Slider bind:value={lambda} min={0.05} max={2} step={0.05} label="λ" />
		</div>
		<div class="grp">
			<div class="gttl">Paramètre d'amortissement (ADMM)</div>
			<Slider bind:value={rho} min={0.1} max={5} step={0.1} label="ρ" disabled={algo !== 'admm'} />
		</div>
	</SliderGrid>

	<p class="cap">
		F(θ<sup>k</sup>) − F* en échelle log. ISTA descend en ligne droite
		(ordre O(1/k), BT09 thm 3.1), FISTA en courbe (ordre O(1/k²), BT09
		thm 4.4) ; ADMM converge (BPC11 §3.2) et suit ici ISTA en pratique —
		pas de taux en valeur enseigné pour l'ADMM dans cette leçon.
		{#if algo === 'admm'}
			Pour ADMM, c'est l'itérat <KatexInline formula="x^k" /> qui est tracé (F(x^k)) ;
			l'itérat <KatexInline formula="z^k" />, obtenu par soft-thresholding, est
			<strong>exactement</strong> creux (PB14 §4.4) — comparez les compteurs
			<KatexInline formula={String.raw`\|z^k\|_0`} /> et
			<KatexInline formula={String.raw`\|x^k\|_0`} />.
		{:else}
			<KatexInline formula="F(\theta^k)" /> n'est pas monotone pour FISTA
			(BT09 lemme 4.3 : c'est une fonction modifiée qui descend) — les
			petits à-coups sont normaux.
		{/if}
		<br />
		<i>
			Petit problème synthétique seedé (n = 60, d = 12, 4 coefficients non
			nuls). Illustration des ordres théoriques, pas un benchmark : F* est
			estimé par une passe FISTA de {REF_ITER} itérations, et l'étape
			x<sup>k</sup> d'ADMM résout un système 12×12 à chaque itération.
		</i>
	</p>
</div>

<style>
	.race {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.algo-toggle {
		display: flex;
		gap: 0.5rem;
	}
	.algo-toggle button {
		padding: 0.3rem 0.9rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text, inherit);
	}
	.algo-toggle button.active {
		background: var(--color-belief);
		color: white;
		border-color: var(--color-belief);
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.5rem;
	}
	.metric {
		padding: 0.45rem 0.6rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--color-surface-2, transparent);
	}
	.m-label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}
	.m-value {
		font-size: 1.05rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		font-family: var(--font-mono);
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.play,
	.reset {
		padding: 0.35rem 0.9rem;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: 600;
	}
	.play {
		background: var(--color-belief);
		color: white;
		border-color: var(--color-belief);
	}
	.slider-wrap {
		flex: 1;
		min-width: 180px;
	}

	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.gttl {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.cap {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
