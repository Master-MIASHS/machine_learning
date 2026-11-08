<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import { lassoOrthonormal1D, lassoSubdiffGraph, ridgeOrthonormal1D } from '$lib/math/subgradient.js';

	/*
	 * Demo E.2 — lesson « Introduction au sous-gradient » (Part I, expert).
	 * Extension beyond course_sources/: one coordinate of the orthonormal
	 * lasso, F(w) = ½(w − z)² + λ|w|. We draw the set-valued map
	 * w ↦ ∂F(w) = w − z + λ∂|w| (two slope-1 branches and a vertical jump at
	 * w = 0) and read the minimizer where it meets the horizontal axis
	 * (criterion 0 ∈ ∂F). Closed form S(z, λ) — Tibshirani (1996),
	 * Hastie et al. (2009) Table 3.4. Ridge ½(w − z)² + (λ/2)w² gives
	 * z/(1 + λ) for comparison. Complements ProxOperator1D (which draws the
	 * objective itself) rather than duplicating it.
	 */

	interface Props {
		onInteract?: () => void;
	}
	let { onInteract }: Props = $props();

	const R = 4;
	const Y_LIM = 6;

	let z = $state(1.6);
	let lambda = $state(1);

	const g = $derived(lassoSubdiffGraph(z, lambda, R));
	const wStar = $derived(lassoOrthonormal1D(z, lambda));
	const wRidge = $derived(ridgeOrthonormal1D(z, lambda));

	const curves = $derived([
		{
			points: [
				[-R, 0],
				[R, 0]
			] as [number, number][],
			stroke: 'var(--color-text-muted)',
			strokeWidth: 1,
			strokeDasharray: '5 4',
			curve: 'linear' as const
		},
		{ points: g.left as [number, number][], stroke: 'var(--color-belief)', strokeWidth: 2.5, curve: 'linear' as const },
		{ points: g.jump as [number, number][], stroke: 'var(--color-agent)', strokeWidth: 4, curve: 'linear' as const },
		{ points: g.right as [number, number][], stroke: 'var(--color-belief)', strokeWidth: 2.5, curve: 'linear' as const }
	]);

	const zeroSelected = $derived(wStar === 0);
</script>

<div class="lasso-sd">
	<CurveChart
		{curves}
		xDomain={[-R, R]}
		yDomain={[-Y_LIM, Y_LIM]}
		height={250}
		yAxis={true}
		vlines={[{ x: z, strokeDasharray: '3 3', opacity: 0.6, label: 'z' }]}
		curveDots={[{ x: wStar, y: 0, r: 6, fill: 'var(--color-surprise)', stroke: 'var(--color-bg)', strokeWidth: 2 }]}
		legend={[
			{ label: 'w ↦ w − z ± λ (branches)', color: 'var(--color-belief)' },
			{ label: 'saut en w = 0 : [−z − λ, −z + λ]', color: 'var(--color-agent)' },
			{ label: 'niveau 0', color: 'var(--color-text-muted)', kind: 'dashed-line' }
		]}
	/>

	<SliderGrid>
		<Slider bind:value={z} min={-3} max={3} step={0.05} label="z = coefficient MCO" onchange={() => onInteract?.()} />
		<Slider bind:value={lambda} min={0} max={3} step={0.05} label="λ" onchange={() => onInteract?.()} />
	</SliderGrid>

	<div class="result-box">
		<span>
			Lasso : <KatexInline formula={String.raw`w^\star = S(z,\lambda) = ${wStar.toFixed(3)}`} />
		</span>
		<span class="sep">·</span>
		<span>
			Ridge : <KatexInline formula={String.raw`\tfrac{z}{1+\lambda} = ${wRidge.toFixed(3)}`} />
		</span>
	</div>

	<p class="cap">
		{#if zeroSelected}
			Ici <KatexInline formula={String.raw`|z| \le \lambda`} /> : le segment vertical en
			<KatexInline formula="w = 0" /> contient <KatexInline formula="0" />, donc
			<KatexInline formula={String.raw`0 \in \partial F(0)`} /> et la coordonnée est
			<strong>exactement nulle</strong>. Le Ridge, lui, ne fait que la rétrécir.
		{:else}
			Ici <KatexInline formula={String.raw`|z| > \lambda`} /> : le saut en
			<KatexInline formula="0" /> ne contient pas <KatexInline formula="0" />, la solution est sur
			une branche et vaut <KatexInline formula={String.raw`z \mp \lambda`} /> — un décalage de
			<KatexInline formula={String.raw`\lambda`} /> vers <KatexInline formula="0" />. Diminuez
			<KatexInline formula="|z|" /> ou augmentez <KatexInline formula={String.raw`\lambda`} /> pour voir
			la coordonnée s'annuler.
		{/if}
	</p>
</div>

<style>
	.lasso-sd {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	.result-box {
		align-self: center;
		padding: 0.4rem 0.9rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--color-surface-2, transparent);
		font-size: 0.92rem;
	}
	.sep {
		margin: 0 0.6rem;
		color: var(--color-text-muted);
	}
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
	}
</style>
