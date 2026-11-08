<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import { subgradientMethod, weightedL1, type SubgradientStepRule } from '$lib/math/subgradient.js';

	/*
	 * Demo E.3 — lesson « Introduction au sous-gradient » (Part I, expert).
	 * Extension beyond course_sources/. Toy problem (deliberately tiny,
	 * illustrative, not a benchmark): f(w) = |w₁ − 0.5| + 3|w₂ + 0.3|,
	 * f* = 0 at (0.5, −0.3), start (2, 1.5). Subgradient method
	 * w_{k+1} = w_k − t_k g_k (Boyd & Park, EE364b « Subgradient Methods » §3;
	 * Nesterov 2004 §3.2), with g_k = (sign(w₁−0.5), 3·sign(w₂+0.3)).
	 * Shows: f(w_k) is not monotone; constant step stalls at a level ∝ t;
	 * t_k = t₀/√(k+1) keeps improving f_best.
	 */

	interface Props {
		onInteract?: () => void;
	}
	let { onInteract }: Props = $props();

	const ITERS = 300;
	const PROBLEM = weightedL1([1, 3], [0.5, -0.3]);
	const X0 = [2, 1.5];

	let rule = $state<SubgradientStepRule>('constant');
	let t0 = $state(0.2);

	const other = $derived((rule === 'constant' ? 'diminishing' : 'constant') as SubgradientStepRule);
	const run = $derived(subgradientMethod({ ...PROBLEM, x0: X0, step: rule, t0, iters: ITERS }));
	const runOther = $derived(subgradientMethod({ ...PROBLEM, x0: X0, step: other, t0, iters: ITERS }));

	const toPts = (arr: number[]) => arr.map((v, k) => [k, v] as [number, number]);

	const nonMonotoneCount = $derived(
		run.values.reduce((cnt, v, k) => (k > 0 && v > run.values[k - 1] + 1e-15 ? cnt + 1 : cnt), 0)
	);

	const ruleLabel = (r: SubgradientStepRule) => (r === 'constant' ? 'pas constant' : 'pas décroissant');

	const curves = $derived([
		{ points: toPts(run.values), stroke: 'var(--color-belief)', strokeWidth: 1, opacity: 0.45, curve: 'linear' as const },
		{ points: toPts(run.best), stroke: 'var(--color-belief)', strokeWidth: 2.5, curve: 'linear' as const },
		{
			points: toPts(runOther.best),
			stroke: 'var(--color-agent)',
			strokeWidth: 2,
			strokeDasharray: '6 4',
			curve: 'linear' as const
		}
	]);

	function setRule(r: SubgradientStepRule) {
		rule = r;
		onInteract?.();
	}
</script>

<div class="sgm">
	<div class="kind-toggle" role="group" aria-label="Règle de pas">
		<button class:active={rule === 'constant'} onclick={() => setRule('constant')}>
			pas constant t = t₀
		</button>
		<button class:active={rule === 'diminishing'} onclick={() => setRule('diminishing')}>
			pas décroissant t = t₀/√(k+1)
		</button>
	</div>

	<CurveChart
		{curves}
		xDomain={[0, ITERS]}
		yScaleType="log"
		height={250}
		yAxis={true}
		chartLabel="f(w_k) − f*  (échelle log)"
		legend={[
			{ label: `f(w_k), ${ruleLabel(rule)}`, color: 'var(--color-belief)' },
			{ label: `meilleure valeur f_best(k), ${ruleLabel(rule)}`, color: 'var(--color-belief)' },
			{ label: `f_best(k), ${ruleLabel(other)}`, color: 'var(--color-agent)', kind: 'dashed-line' }
		]}
	/>

	<SliderGrid>
		<Slider
			bind:value={t0}
			min={0.01}
			max={1}
			step={0.001}
			logarithmic={true}
			label="t₀"
			onchange={() => onInteract?.()}
		/>
		<div class="stats">
			<div>f_best après {ITERS} itérations : <strong>{run.best[ITERS].toExponential(2)}</strong></div>
			<div>remontées de f(w_k) : <strong>{nonMonotoneCount}</strong> sur {ITERS} pas</div>
		</div>
	</SliderGrid>

	<p class="cap">
		Petit problème synthétique
		<KatexInline formula={String.raw`f(w) = |w_1 - 0.5| + 3\,|w_2 + 0.3|`} /> (minimum
		<KatexInline formula={String.raw`f^\star = 0`} />) — illustration qualitative, pas un
		benchmark. La courbe pâle remonte souvent : la méthode du sous-gradient n'est
		<strong>pas</strong> une méthode de descente, d'où le suivi de la meilleure valeur. À pas constant,
		celle-ci stagne à un niveau proportionnel à <KatexInline formula="t_0" /> ; avec des pas
		décroissants, elle continue de baisser, lentement.
	</p>
</div>

<style>
	.sgm {
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
	.stats {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
	}
</style>
