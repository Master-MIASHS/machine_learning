<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import { proxL1 } from '$lib/math/proximal.js';

	/*
	 * 1-D illustration of the proximal operator (expert lesson « Méthodes
	 * proximales », Part I — au-delà du cours).
	 *
	 * Two penalties, one shared quadratic weight (PB14 eq. (1.2) convention,
	 * prox_{λf}(v) = argmin f(x) + (1/(2λ))(x−v)²):
	 *   f = |·|        → argmin = S(v, λ) = sign(v)·max(|v|−λ, 0)  (PB14 (6.9))
	 *   f = ½·(·)²     → argmin = λv/(λ+1)                         (Ridge shrinkage)
	 * The red dot is the argmin of the drawn curve; the dashed line marks the
	 * anchor v (where the quadratic term is zero).
	 */

	let v = $state(2.2);
	let lambda = $state(1);
	let kind = $state<'l1' | 'l2'>('l1');

	const X_MIN = -4;
	const X_MAX = 4;
	const N_PTS = 240;

	// Fixed SVG frame; data → screen mapping below.
	const W = 460;
	const H = 240;
	const PAD_L = 14;
	const PAD_R = 14;
	const PAD_T = 16;
	const PAD_B = 30;

	const fOf = (x: number): number =>
		kind === 'l1' ? Math.abs(x) + ((x - v) ** 2) / (2 * lambda) : 0.5 * x * x + ((x - v) ** 2) / (2 * lambda);

	// l1: x* = S(v, λ) — computed via the tested proximal module [PB14 (6.9)].
	// l2: prox of f = (ρ/2)‖·‖² with parameter λ and ρ = 1: x* = λv/(λ+1),
	// computed directly (proxL2Squared([v], 1/λ) gives the same value).
	const xStar = $derived(kind === 'l1' ? proxL1([v], lambda)[0] : (lambda * v) / (lambda + 1));

	const pts = $derived.by(
		() =>
			Array.from({ length: N_PTS }, (_, i) => {
				const x = X_MIN + ((X_MAX - X_MIN) * i) / (N_PTS - 1);
				return [x, fOf(x)] as [number, number];
			}),
	);

	const yMax = $derived(Math.max(...pts.map(([, yv]) => yv)) * 1.08);

	const sx = (x: number) => PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - PAD_L - PAD_R);
	const sy = (y: number) => H - PAD_B - (y / yMax) * (H - PAD_T - PAD_B);

	const path = $derived(pts.map(([x, yv], i) => `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(2)} ${sy(yv).toFixed(2)}`).join(' '));

	const zeroXs = $derived(Array.from({ length: 13 }, (_, i) => X_MIN + i));

	const ariaLabel = $derived(
		kind === 'l1'
			? `Courbe x ↦ |x| + (x − ${v.toFixed(2)})²/(2·${lambda.toFixed(2)}) avec son minimum en S(v, λ) = ${xStar.toFixed(3)}`
			: `Courbe x ↦ x²/2 + (x − ${v.toFixed(2)})²/(2·${lambda.toFixed(2)}) avec son minimum en λv/(λ+1) = ${xStar.toFixed(3)}`
	);
</script>

<div class="prox1d">
	<Figure type="chart">
		<svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel}>
			<!-- x axis -->
			<line x1={PAD_L} y1={sy(0)} x2={W - PAD_R} y2={sy(0)} stroke="var(--color-border)" stroke-width="1.5" />
			{#each zeroXs as tick (tick)}
				<line x1={sx(tick)} y1={sy(0)} x2={sx(tick)} y2={sy(0) + 4} stroke="var(--color-border)" />
				<text
					x={sx(tick)}
					y={sy(0) + 15}
					text-anchor="middle"
					fill="var(--color-text-muted)"
					font-size="10"
					font-family="var(--font-mono)"
				>
					{tick}
				</text>
			{/each}

			<!-- anchor v : the quadratic term vanishes here -->
			<line
				x1={sx(v)}
				y1={PAD_T}
				x2={sx(v)}
				y2={sy(0)}
				stroke="var(--color-text-muted)"
				stroke-width="1"
				stroke-dasharray="4 3"
				opacity="0.7"
			/>
			<text x={sx(v)} y={PAD_T - 4} text-anchor="middle" fill="var(--color-text-muted)" font-size="10.5">
				v = {v.toFixed(2)}
			</text>

			<!-- penalty curve -->
			<path d={path} fill="none" stroke="var(--color-belief)" stroke-width="2.5" stroke-linejoin="round" />

			<!-- argmin marker -->
			<line
				x1={sx(xStar)}
				y1={sy(fOf(xStar))}
				x2={sx(xStar)}
				y2={sy(0)}
				stroke="var(--color-surprise)"
				stroke-width="1"
				stroke-dasharray="3 3"
				opacity="0.8"
			/>
			<circle cx={sx(xStar)} cy={sy(fOf(xStar))} r="5.5" fill="var(--color-surprise)" stroke="var(--color-bg)" stroke-width="2" />
		</svg>
	</Figure>

	<SliderGrid>
		<div class="grp">
			<div class="gttl">Point d'ancrage</div>
			<Slider bind:value={v} min={X_MIN} max={X_MAX} step={0.05} label="v" />
		</div>
		<div class="grp">
			<div class="gttl">Paramètre proximal</div>
			<Slider bind:value={lambda} min={0.1} max={3} step={0.05} label="λ" />
		</div>
	</SliderGrid>

	<div class="kind-toggle" role="group" aria-label="Choix de la pénalité">
		<button class:active={kind === 'l1'} onclick={() => (kind = 'l1')}>
			f = ‖·‖₁ (Lasso)
		</button>
		<button class:active={kind === 'l2'} onclick={() => (kind = 'l2')}>
			f = ½‖·‖₂² (Ridge)
		</button>
	</div>

	<div class="result-box">
		<span class="result-label">argmin :</span>
		{#if kind === 'l1'}
			<KatexInline
				formula={String.raw`x^* = S(v, \lambda) = \mathrm{sign}(v)\,\max(|v| - \lambda, 0) = ${xStar.toFixed(4)}`}
			/>
		{:else}
			<KatexInline
				formula={String.raw`x^* = \frac{\lambda}{\lambda + 1}\,v = ${xStar.toFixed(4)}`}
			/>
		{/if}
	</div>

	<p class="cap">
		{#if kind === 'l1'}
			La courbe est <KatexInline
				formula={String.raw`x \mapsto |x| + \tfrac{1}{2\lambda}(x - v)^2`}
			/>
			. Le terme quadratique tire <KatexInline formula="x" /> vers
			<KatexInline formula="v" /> ; le terme
			<KatexInline formula="|x|" /> tire vers
			<KatexInline formula="0" /> — et <strong>annule exactement</strong> la solution dès que
			<KatexInline formula={String.raw`|v| \le \lambda`} /> (c'est le soft-thresholding, PB14 eq. (6.9) :
			la sélection de variables du Lasso, coordonnée par coordonnée).
		{:else}
			La courbe est <KatexInline
				formula={String.raw`x \mapsto \tfrac{1}{2}x^2 + \tfrac{1}{2\lambda}(x - v)^2`}
			/>
			. Le Ridge rétrécit uniformément vers zéro (facteur
			<KatexInline formula={String.raw`\frac{\lambda}{\lambda+1}`} />)
			mais n'annule <strong>jamais</strong> une coordonnée non nulle : la différence comportementale
			Lasso vs Ridge de la Partie V, vue du côté de l'algorithme.
		{/if}
	</p>
</div>

<style>
	.prox1d {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.gttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.kind-toggle {
		display: flex;
		gap: 0.5rem;
		align-self: center;
	}
	.kind-toggle button {
		padding: 0.3rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text, inherit);
	}
	.kind-toggle button.active {
		background: var(--color-belief);
		color: white;
		border-color: var(--color-belief);
	}

	.result-box {
		align-self: center;
		padding: 0.4rem 0.9rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--color-surface-2, transparent);
		font-size: 0.95rem;
	}
	.result-label {
		color: var(--color-text-muted);
		font-weight: 600;
		margin-right: 0.5rem;
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
	.cap strong {
		color: inherit;
	}
</style>
