<script lang="ts">
	// Part V, expert lesson /part5/double-descente — ridge regularization tames the peak.
	// Asymptotic excess risk in the isotropic model (Hastie, Montanari, Rosset &
	// Tibshirani 2022: Theorem 1 for λ = 0, Corollary 5 for λ > 0), objective
	// (1/n)||y − Xb||² + λ||b||²; optimal λ* = σ²γ/r². Extension beyond
	// course_sources/ (regularization.typ gives Ridge and its shrinkage factors,
	// not its high-dimensional risk). All curves are closed-form: cheap.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import {
		optimalRidgeLambda,
		ridgeAsymptoticRisk,
		ridgelessAsymptoticRisk
	} from '$lib/math/double-descent';
	import { linspace } from '$lib/math/util';

	const SIGMA2 = 1;
	const GAMMA_MAX = 4;

	let logLambda = $state(-1.5); // λ = 10^logLambda
	let r2 = $state(4);
	let showDecomposition = $state(false);

	const lambda = $derived(10 ** logLambda);
	const yMax = $derived(Math.max(2.5 * r2, 3));

	const grid = linspace(0.02, GAMMA_MAX, 400);
	const clip = (y: number): number => Math.min(y, yMax);

	const ridgelessUnder = $derived(
		grid
			.filter((g) => g < 0.995)
			.map((g): [number, number] => [g, clip(ridgelessAsymptoticRisk(g, r2, SIGMA2).risk)])
	);
	const ridgelessOver = $derived(
		grid
			.filter((g) => g > 1.005)
			.map((g): [number, number] => [g, clip(ridgelessAsymptoticRisk(g, r2, SIGMA2).risk)])
	);
	const ridgeCurve = $derived(
		grid.map((g) => ({ g, ...ridgeAsymptoticRisk(g, lambda, r2, SIGMA2) }))
	);
	const optimalCurve = $derived(
		grid.map((g): [number, number] => [
			g,
			ridgeAsymptoticRisk(g, optimalRidgeLambda(g, r2, SIGMA2), r2, SIGMA2).risk
		])
	);

	const atOne = $derived(ridgeAsymptoticRisk(1, lambda, r2, SIGMA2));
	const optAtOne = $derived(
		ridgeAsymptoticRisk(1, optimalRidgeLambda(1, r2, SIGMA2), r2, SIGMA2).risk
	);

	const curves = $derived.by(() => {
		const c: {
			points: [number, number][];
			stroke: string;
			strokeWidth: number;
			strokeDasharray?: string;
			opacity?: number;
		}[] = [
			{ points: ridgelessUnder, stroke: 'var(--color-text-muted)', strokeWidth: 1.5 },
			{ points: ridgelessOver, stroke: 'var(--color-text-muted)', strokeWidth: 1.5 },
			{
				points: ridgeCurve.map((q): [number, number] => [q.g, clip(q.risk)]),
				stroke: 'var(--color-surprise)',
				strokeWidth: 2.5
			},
			{
				points: optimalCurve,
				stroke: 'var(--color-positive)',
				strokeWidth: 2,
				strokeDasharray: '6 3'
			},
			{
				points: [
					[0, r2],
					[GAMMA_MAX, r2]
				],
				stroke: 'var(--color-text-muted)',
				strokeWidth: 1,
				strokeDasharray: '2 2'
			}
		];
		if (showDecomposition) {
			c.push(
				{
					points: ridgeCurve.map((q): [number, number] => [q.g, clip(q.bias)]),
					stroke: 'var(--color-belief)',
					strokeWidth: 1.5,
					strokeDasharray: '3 2'
				},
				{
					points: ridgeCurve.map((q): [number, number] => [q.g, clip(q.variance)]),
					stroke: 'var(--color-agent)',
					strokeWidth: 1.5,
					strokeDasharray: '3 2'
				}
			);
		}
		return c;
	});

	const legend = $derived([
		{ label: 'λ → 0 (norme minimale)', color: 'var(--color-text-muted)' },
		{ label: `Ridge, λ = ${lambda.toExponential(1)}`, color: 'var(--color-surprise)' },
		{
			label: 'Ridge optimal λ* = σ²γ/r²',
			color: 'var(--color-positive)',
			kind: 'dashed-line' as const
		},
		{
			label: 'modèle nul (risque r²)',
			color: 'var(--color-text-muted)',
			kind: 'dashed-line' as const
		},
		...(showDecomposition
			? [
					{
						label: 'biais² (λ choisi)',
						color: 'var(--color-belief)',
						kind: 'dashed-line' as const
					},
					{
						label: 'variance (λ choisi)',
						color: 'var(--color-agent)',
						kind: 'dashed-line' as const
					}
				]
			: [])
	]);
</script>

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={260}
		yAxis={true}
		xDomain={[0, GAMMA_MAX]}
		yDomain={[0, yMax]}
		{curves}
		vlines={[{ x: 1, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'γ = 1' }]}
		{legend}
	/>
	{#snippet caption()}
		Risque en excès limite (bruit <KatexInline formula={String.raw`\sigma^2 = 1`} /> non compté) en fonction
		de <KatexInline formula={String.raw`\gamma = p/n`} />, modèle isotrope
		<KatexInline formula={String.raw`x \sim \mathcal N(0, I_p)`} />,
		<KatexInline formula={String.raw`\|\beta\|^2 = r^2`} />, objectif
		<KatexInline formula={String.raw`\tfrac1n\|y - Xb\|^2 + \lambda\|b\|^2`} />. Formules exactes
		dans la limite <KatexInline formula={String.raw`n, p \to \infty`} /> (Hastie et al., 2022) ; les courbes
		sont tronquées en haut du graphique.
	{/snippet}
</Figure>

<div class="controls">
	<Slider min={-3} max={1} step={0.1} bind:value={logLambda} label="log₁₀ λ" />
	<Slider min={0.5} max={8} step={0.5} bind:value={r2} label="Rapport signal/bruit r²/σ²" />
	<Toggle bind:checked={showDecomposition} label="Afficher biais² et variance" />
</div>

<Metrics align="left">
	<div class="cell">
		<span class="label">Risque en γ = 1, λ choisi</span>
		<span class="value">{atOne.risk.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Risque en γ = 1, λ* = {optimalRidgeLambda(1, r2, SIGMA2).toFixed(3)}</span>
		<span class="value">{optAtOne.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Risque en γ = 1, λ → 0</span>
		<span class="value">∞</span>
	</div>
</Metrics>

<style>
	.controls {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
</style>
