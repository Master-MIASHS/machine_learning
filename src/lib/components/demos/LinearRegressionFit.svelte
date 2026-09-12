<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { olsClosedForm } from '$lib/math/regression.js';
	import { withIntercept } from '$lib/math/linear-model.js';

	let trueW = $state(1.5);
	let noiseLevel = $state(0.8);
	const N = 40;

	function genData(tw: number, n: number) {
		const pts: Array<{ x: number; y: number }> = [];
		let s = 42;
		for (let i = 0; i < N; i++) {
			s = (s * 16807) % 2147483647;
			const x = -3 + 6 * ((s - 1) / 2147483646);
			s = (s * 16807) % 2147483647;
			const e = ((s - 1) / 2147483646 - 0.5) * 2 * n;
			pts.push({ x, y: tw * x + e });
		}
		return pts;
	}

	let dataPoints = $state(genData(1.5, 0.8));

	$effect(() => {
		dataPoints = genData(trueW, noiseLevel);
		gdW = 0;
		gdB = 0;
		running = false;
		if (aid) cancelAnimationFrame(aid);
	});

	// Ajustement MCO complet y = b + w·x (colonne d'intercept dans X) :
	// β̂ = (XᵀX)⁻¹Xᵀy — la droite OLS doit inclure l'intercept, sinon elle
	// est parallèle (mais décalée) à la droite vers laquelle GD converge.
	const ols = $derived.by(() => {
		const X = withIntercept(dataPoints.map((p) => [p.x]));
		const y = dataPoints.map((p) => p.y);
		const beta = olsClosedForm(X, y);
		return { b: beta[0], w: beta[1] };
	});

	let gdW = $state(0);
	let gdB = $state(0);
	let running = $state(false);
	let aid: number | null = null;

	function step() {
		if (!running) return;
		let dw = 0,
			db = 0;
		for (const p of dataPoints) {
			const e = gdW * p.x + gdB - p.y;
			dw += e * p.x;
			db += e;
		}
		// Pas 0.05 : stable car 0.05 < 2/λ_max, avec λ_max ≈ 3,1 la plus
		// grande valeur propre de la Hessienne (1/N)·XᵀX de ce design.
		gdW -= (0.05 * dw) / N;
		gdB -= (0.05 * db) / N;
		if (Math.abs(dw) > 1e-8 || Math.abs(db) > 1e-8) aid = requestAnimationFrame(step);
		else running = false;
	}

	function toggle() {
		if (!running) {
			gdW = 0;
			gdB = 0;
			running = true;
			step();
		} else {
			running = false;
			if (aid) cancelAnimationFrame(aid);
		}
	}

	const dx: [number, number] = [-3.5, 3.5];
	const dy = $derived.by(() => {
		const v = dataPoints.map((p) => p.y);
		return [Math.min(...v) - 1, Math.max(...v) + 1] as [number, number];
	});

	function tx(x: number): number {
		return 4 + ((x - dx[0]) / (dx[1] - dx[0])) * 392;
	}
	function ty(y: number): number {
		return 4 + ((dy[1] - y) / (dy[1] - dy[0])) * 342;
	}

	const olsL = $derived.by(
		() =>
			[tx(dx[0]), ty(ols.w * dx[0] + ols.b), tx(dx[1]), ty(ols.w * dx[1] + ols.b)] as number[]
	);
	const gdL = $derived.by(() => {
		const b = gdB;
		return [tx(dx[0]), ty(gdW * dx[0] + b), tx(dx[1]), ty(gdW * dx[1] + b)] as number[];
	});
</script>

<div class="linreg">
	<Figure type="chart">
		<ScatterPlot points={dataPoints} domainX={dx} domainY={dy} width={400} height={350}>
			{#snippet snippetOverlay()}
				<line
					x1={olsL[0]}
					y1={olsL[1]}
					x2={olsL[2]}
					y2={olsL[3]}
					stroke="#10b981"
					stroke-width="2.5"
					opacity="0.7"
				/>
				<line
					x1={gdL[0]}
					y1={gdL[1]}
					x2={gdL[2]}
					y2={gdL[3]}
					stroke="#f59e0b"
					stroke-width="2.5"
					opacity="0.8"
				/>
			{/snippet}
		</ScatterPlot>
	</Figure>

	<div class="ctrls">
		<Button onclick={toggle}>{running ? '⏸ Pause' : '▶ Gradient Descent'}</Button>
	</div>

	<SliderGrid>
		<div class="grp">
			<div class="gttl">Données</div>
			<Slider bind:value={trueW} min={-2} max={3} step={0.1} label="pente" />
			<Slider bind:value={noiseLevel} min={0.1} max={2} step={0.1} label="bruit" />
		</div>
		<div class="grp">
			<div class="gttl">Résultats</div>
			<div class="rw"><span style="color:#f59e0b">w_GD</span> ≈ {gdW.toFixed(3)}</div>
			<div class="rw"><span style="color:#10b981">w_OLS</span> = {ols.w.toFixed(3)}</div>
			<div class="rw"><span style="color:#f59e0b">b_GD</span> ≈ {gdB.toFixed(3)}</div>
			<div class="rw"><span style="color:#10b981">b_OLS</span> = {ols.b.toFixed(3)}</div>
		</div>
	</SliderGrid>

	<p class="cap">
		<span style="color:#f59e0b">Orange</span> : GD &nbsp;|&nbsp;
		<span style="color:#10b981">Vert</span> : OLS <KatexInline
			formula={String.raw`(X^\top X)^{-1} X^\top y`}
		/>
	</p>
</div>

<style>
	.linreg {
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
	.ctrls {
		display: flex;
		gap: 0.5rem;
	}
	.rw {
		font-size: 0.82rem;
		font-family: 'SF Mono', 'Fira Code', monospace, system-ui;
		padding: 0.15rem 0;
	}
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		text-align: center;
	}
</style>
