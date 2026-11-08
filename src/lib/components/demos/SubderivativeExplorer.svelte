<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import {
		convex1D,
		convex1DSubdifferential,
		isSubgradient1D,
		supportLineSegment,
		type Convex1DName
	} from '$lib/math/subgradient.js';
	import { linspace } from '$lib/math/util.js';

	/*
	 * Demo E.1 — lesson « Introduction au sous-gradient » (Part I, expert).
	 * Extension beyond course_sources/ (subderivatives are not in the
	 * sources). A slope c is a subderivative of f at x0 iff the line
	 * y ↦ f(x0) + c(y − x0) stays below the graph of f
	 * (Boyd et al., EE364b « Subgradients »). The validity check is done on a
	 * fine grid (isSubgradient1D) — exact for these piecewise-linear /
	 * quadratic functions since the grid contains the kinks 0 and 1.
	 */

	interface Props {
		onInteract?: () => void;
	}
	let { onInteract }: Props = $props();

	const X_MIN = -3;
	const X_MAX = 3;
	const GRID = linspace(X_MIN, X_MAX, 1201);

	const FUNCS: { name: Convex1DName; label: string; tex: string }[] = [
		{ name: 'abs', label: '|x|', tex: String.raw`f(x) = |x|` },
		{ name: 'relu', label: 'max(0, x)', tex: String.raw`f(x) = \max(0, x)` },
		{ name: 'hinge', label: 'max(0, 1 − x)', tex: String.raw`f(x) = \max(0, 1 - x)` },
		{ name: 'square', label: 'x²', tex: String.raw`f(x) = x^2` }
	];

	let kind = $state<Convex1DName>('abs');
	let x0 = $state(0);
	let c = $state(0.5);

	const f = $derived(convex1D(kind));
	const fx0 = $derived(f(x0));
	const graph = $derived(GRID.map((x) => [x, f(x)] as [number, number]));
	const yMax = $derived(Math.max(...graph.map((p) => p[1])));
	const box = $derived({ xMin: X_MIN, xMax: X_MAX, yMin: -1.5, yMax: yMax });

	const sub = $derived(convex1DSubdifferential(kind, x0));
	const valid = $derived(isSubgradient1D(f, x0, c, GRID));
	const seg = $derived(supportLineSegment(fx0, x0, c, box));

	const lineColor = $derived(valid ? 'var(--color-positive)' : 'var(--color-surprise)');

	const curves = $derived([
		{ points: graph, stroke: 'var(--color-belief)', strokeWidth: 2.5, curve: 'linear' as const },
		...(seg
			? [{ points: seg as [number, number][], stroke: lineColor, strokeWidth: 2, curve: 'linear' as const }]
			: [])
	]);

	const fmt = (v: number) => (Math.abs(v) < 1e-12 ? '0' : v.toFixed(2));
	const subTex = $derived(
		sub[0] === sub[1]
			? String.raw`\partial f(${fmt(x0)}) = \{${fmt(sub[0])}\}`
			: String.raw`\partial f(${fmt(x0)}) = [${fmt(sub[0])},\, ${fmt(sub[1])}]`
	);

	function pick(name: Convex1DName) {
		kind = name;
		onInteract?.();
	}
	function snapInside() {
		c = (sub[0] + sub[1]) / 2;
		onInteract?.();
	}
</script>

<div class="subder">
	<div class="kind-toggle" role="group" aria-label="Choix de la fonction convexe">
		{#each FUNCS as fn (fn.name)}
			<button class:active={kind === fn.name} onclick={() => pick(fn.name)}>{fn.label}</button>
		{/each}
	</div>

	<CurveChart
		{curves}
		xDomain={[X_MIN, X_MAX]}
		yDomain={[box.yMin, box.yMax]}
		height={240}
		yAxis={true}
		curveDots={[{ x: x0, y: fx0, r: 5, fill: 'var(--color-agent)', stroke: 'var(--color-bg)', strokeWidth: 2 }]}
		legend={[
			{ label: 'graphe de f', color: 'var(--color-belief)' },
			{ label: valid ? 'droite sous le graphe' : 'droite qui coupe le graphe', color: lineColor }
		]}
	/>

	<SliderGrid>
		<Slider bind:value={x0} min={-2} max={2.5} step={0.05} label="point x₀" onchange={() => onInteract?.()} />
		<Slider bind:value={c} min={-3} max={3} step={0.05} label="pente c" onchange={() => onInteract?.()} />
	</SliderGrid>

	<div class="result-box" class:ok={valid} class:ko={!valid}>
		<KatexInline formula={FUNCS.find((fn) => fn.name === kind)?.tex ?? ''} /> ;
		<KatexInline formula={subTex} /> —
		{#if valid}
			<strong>c = {fmt(c)} est une sous-dérivée</strong>
		{:else}
			<strong>c = {fmt(c)} n'est pas une sous-dérivée</strong>
		{/if}
		<button class="snap" onclick={snapInside}>placer c au milieu de ∂f(x₀)</button>
	</div>

	<p class="cap">
		Faites glisser la pente : la droite passe au vert exactement quand
		<KatexInline formula="c" /> appartient à l'intervalle
		<KatexInline formula={String.raw`[f'_-(x_0),\, f'_+(x_0)]`} />. Là où
		<KatexInline formula="f" /> est dérivable, cet intervalle se réduit à un seul point (la dérivée) ;
		en un point anguleux, tout un éventail de pentes convient.
	</p>
</div>

<style>
	.subder {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	.kind-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-self: center;
	}
	.kind-toggle button,
	.snap {
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
	.snap {
		margin-left: 0.5rem;
	}
	.result-box {
		align-self: center;
		padding: 0.4rem 0.9rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--color-surface-2, transparent);
		font-size: 0.9rem;
		border-left: 3px solid transparent;
	}
	.result-box.ok {
		border-left-color: var(--color-positive);
	}
	.result-box.ko {
		border-left-color: var(--color-surprise);
	}
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
	}
</style>
