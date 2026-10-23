<script lang="ts">
	import { onDestroy } from 'svelte';
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import { paraboloid, rosenbrock } from '$lib/math/test-functions.js';

	interface FuncOption {
		key: string;
		label: string;
		func: typeof paraboloid;
		defaultSliceY: number;
		defaultAlpha: number;
		defaultXStart: number;
		domain: [number, number];
		taylorHalfWidth: number;
		color: string;
		isExactlyQuadratic: boolean;
		alphaMin: number;
		alphaMax: number;
		alphaStep: number;
		useLogScale: boolean;
	}

	const funcOptions: FuncOption[] = [
		{
			key: 'paraboloid',
			label: 'Paraboloïde (x² + 4y²)',
			func: paraboloid,
			defaultSliceY: 0.5,
			defaultAlpha: 0.1,
			defaultXStart: -2,
			domain: [-3.5, 3.5],
			taylorHalfWidth: 1.5,
			color: '#3b82f6',
			isExactlyQuadratic: true,
			alphaMin: 0.01,
			alphaMax: 0.5,
			alphaStep: 0.005,
			useLogScale: false
		},
		{
			key: 'rosenbrock',
			label: 'Rosenbrock ((1−x)² + 100(y−x²)²)',
			func: rosenbrock,
			defaultSliceY: 1,
			defaultAlpha: 0.001,
			defaultXStart: -1.5,
			domain: [-2.5, 2.5],
			taylorHalfWidth: 0.6,
			color: '#ef4444',
			isExactlyQuadratic: false,
			// BUG FIX 1: Activation du log scale pour Rosenbrock comme décrit
			alphaMin: -4, // log10(0.0001)
			alphaMax: -2.5, // log10(0.003)
			alphaStep: 0.01,
			useLogScale: true
		}
	];

	let selectedKey = $state('paraboloid');
	const opt = $derived(funcOptions.find((o) => o.key === selectedKey)!);

	let xStart = $state(-2);

	// Svelte 5 : On sépare les deux états physiques du slider pour éviter les conflits d'effets
	let rawAlphaLinear = $state(0.1);
	let rawAlphaLog = $state(-3);

	// On dérive de manière sûre la valeur alpha réelle utilisée par les maths
	let alphaVal = $derived(opt.useLogScale ? Math.pow(10, rawAlphaLog) : rawAlphaLinear);

	let playing = $state(false);
	let animTimer: ReturnType<typeof setInterval> | null = null;

	const func = $derived(opt.func);
	const sliceY = $derived(opt.defaultSliceY);
	const [xMin, xMax] = $derived(opt.domain);

	// BUG FIX 2: Initialisation immédiate sécurisée pour éviter le tableau vide au premier cycle $derived
	let stepHistory: { x: number; fVal: number }[] = $state([{ x: -2, fVal: paraboloid.f(-2, 0.5) }]);

	function fSlice(x: number): number {
		return func.f(x, sliceY);
	}
	function gradSlice(x: number): number {
		const [gx] = func.grad(x, sliceY);
		return gx;
	}
	function hessSliceAt(x: number): number {
		const eps = 1e-5;
		const [g1] = func.grad(x - eps, sliceY);
		const [g2] = func.grad(x + eps, sliceY);
		return (g2 - g1) / (2 * eps);
	}

	const gradAtX = $derived(gradSlice(xStart));
	const hessVal = $derived(hessSliceAt(xStart));
	const fAtX = $derived(fSlice(xStart));

	const xAfterGD = $derived(xStart - alphaVal * gradAtX);
	const fAfterGD = $derived(fSlice(xAfterGD));

	function taylor1(x: number): number {
		return fAtX + gradAtX * (x - xStart);
	}
	function taylor2(x: number): number {
		return fAtX + gradAtX * (x - xStart) + 0.5 * hessVal * (x - xStart) ** 2;
	}

	const taylorXMin = $derived(Math.max(xMin, xStart - opt.taylorHalfWidth));
	const taylorXMax = $derived(Math.min(xMax, xStart + opt.taylorHalfWidth));

	const N = 100;
	const N_TAYLOR = 40;

	function makePoints(
		fn: (x: number) => number,
		lo: number,
		hi: number,
		n: number
	): [number, number][] {
		return Array.from({ length: n }, (_, i) => {
			const x = lo + (i / (n - 1)) * (hi - lo);
			return [x, fn(x)];
		});
	}

	const truePoints = $derived(makePoints(fSlice, xMin, xMax, N));

	const yMaxVal = $derived.by(() => {
		const allY = truePoints.map((p) => p[1]);
		return Math.max(...allY) * 1.15;
	});

	function clampToChart(points: [number, number][]): [number, number][] {
		return points.map(([x, y]) => [x, Math.max(0, Math.min(yMaxVal, y))]);
	}

	const curvesData = $derived([
		{ points: truePoints, stroke: opt.color, strokeWidth: 2.5 },
		{
			points: clampToChart(makePoints(taylor1, taylorXMin, taylorXMax, N_TAYLOR)),
			stroke: '#f59e0b',
			strokeWidth: 2,
			strokeDasharray: '6 4' as const
		},
		{
			points: clampToChart(makePoints(taylor2, taylorXMin, taylorXMax, N_TAYLOR)),
			stroke: '#8b5cf6',
			strokeWidth: 2,
			strokeDasharray: '3 3' as const
		}
	]);

	const curveDotsData = $derived([
		{ x: xStart, y: fAtX, r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 },
		{ x: xAfterGD, y: fAfterGD, r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 },
		...stepHistory.slice(0, -1).map((s, i) => ({
			x: s.x,
			y: s.fVal,
			r: 3.5,
			fill: opt.color,
			stroke: 'none',
			strokeWidth: 0,
			opacity: 0.25 + 0.5 * (i / Math.max(1, stepHistory.length - 1))
		}))
	]);

	const vlinesData = $derived([
		{ x: xStart, stroke: '#ef4444', label: 'x⁽ᵏ⁾' },
		{ x: xAfterGD, stroke: '#22c55e', label: 'x⁽ᵏ⁺¹⁾' }
	]);

	const legendData = $derived([
		{ label: `f(x, y=${sliceY.toFixed(1)})`, color: opt.color, kind: 'line' as const },
		{ label: 'Taylor 1 (linéaire, local)', color: '#f59e0b', kind: 'dashed-line' as const },
		{ label: 'Taylor 2 (quadratique, local)', color: '#8b5cf6', kind: 'dashed-line' as const }
	]);

	function resetHistory() {
		stopAnim();
		stepHistory = [{ x: xStart, fVal: fAtX }];
	}

	function animStep() {
		const last = stepHistory[stepHistory.length - 1];
		const g = gradSlice(last.x);
		if (Math.abs(g) < 1e-4) {
			stopAnim();
			return;
		}
		const nx = Math.max(xMin, Math.min(xMax, last.x - alphaVal * g));
		const nf = fSlice(nx);
		if (!Number.isFinite(nf)) {
			stopAnim();
			return;
		}
		stepHistory = [...stepHistory, { x: nx, fVal: nf }];
		xStart = nx;
		if (stepHistory.length > 60) stopAnim();
	}

	function play() {
		if (playing) return;
		if (stepHistory.length === 0) resetHistory();
		playing = true;
		animTimer = setInterval(animStep, 220);
	}
	function pause() {
		stopAnim();
	}
	function stopAnim() {
		if (animTimer !== null) clearInterval(animTimer);
		animTimer = null;
		playing = false;
	}

	onDestroy(stopAnim);

	function handleFuncChange(newKey: string) {
		stopAnim();
		selectedKey = newKey;
		const o = funcOptions.find((o2) => o2.key === newKey)!;
		xStart = o.defaultXStart;

		if (o.useLogScale) {
			rawAlphaLog = Math.log10(o.defaultAlpha);
		} else {
			rawAlphaLinear = o.defaultAlpha;
		}
		// Svelte 5 : Exécuter le reset après avoir configuré les nouveaux états initiaux
		stepHistory = [{ x: o.defaultXStart, fVal: o.func.f(o.defaultXStart, o.defaultSliceY) }];
	}

	// Déclencheur initial synchrone sur le jeu par défaut
	handleFuncChange('paraboloid');
</script>

<div class="taylor-demo">
	<h3 class="section-title">Justification par développement de Taylor</h3>
	<p class="sub-title">
		f(x − α∇f) ≈ f(x) − α‖∇f‖² + o(α) — le terme −α‖∇f‖² assure la décroissance locale quand α est
		petit.
	</p>

	<div class="options-row">
		{#each funcOptions as o}
			<button
				class:active={selectedKey === o.key}
				style:--opt-color={o.color}
				onclick={() => handleFuncChange(o.key)}
			>
				<span class="dot" style:background={o.color}></span>
				{o.label}
			</button>
		{/each}
	</div>

	<SliderGrid>
		<div class="grp">
			<div class="gttl">Point de départ</div>
			<Slider bind:value={xStart} min={xMin} max={xMax} step={0.05} label="x⁽ᵏ⁾" />
		</div>
		<div class="grp">
			<div class="gttl">Taux d'apprentissage {opt.useLogScale ? '(échelle log)' : ''}</div>
			{#if opt.useLogScale}
				<Slider
					bind:value={rawAlphaLog}
					min={opt.alphaMin}
					max={opt.alphaMax}
					step={opt.alphaStep}
					label="log10(α)"
				/>
			{:else}
				<Slider
					bind:value={rawAlphaLinear}
					min={opt.alphaMin}
					max={opt.alphaMax}
					step={opt.alphaStep}
					label="α"
				/>
			{/if}
		</div>
	</SliderGrid>

	<div class="transport">
		<button class="btn" onclick={resetHistory}>⟲ Reset</button>
		<button class="btn" onclick={animStep} disabled={playing}>▶ Un pas</button>
		{#if playing}
			<button class="btn btn-warn" onclick={pause}>⏸ Pause</button>
		{:else}
			<button class="btn btn-primary" onclick={play}>⏵ Descente animée</button>
		{/if}
		<div class="stats">k = {stepHistory.length - 1}</div>
	</div>

	<DensityChart
		curves={curvesData}
		xDomain={[xMin, xMax]}
		yMax={yMaxVal}
		height={300}
		nTicks={6}
		curveDots={curveDotsData}
		vlines={vlinesData}
		legend={legendData}
	/>

	<div class="info-grid">
		<div class="info-item info-red">
			<span class="label">f(x⁽ᵏ⁾)</span>
			<span class="value">{fAtX.toFixed(4)}</span>
		</div>
		<div class="info-item info-green">
			<span class="label">f(x⁽ᵏ⁺¹⁾)</span>
			<span class="value">{fAfterGD.toFixed(4)}</span>
		</div>
		<div class="info-item info-amber">
			<span class="label">Δf (exact)</span>
			<span class="value">{(fAfterGD - fAtX).toFixed(4)}</span>
		</div>
		<div class="info-item info-purple">
			<span class="label">−α·f'(x⁽ᵏ⁾)² (Taylor 1)</span>
			<span class="value">{(-alphaVal * gradAtX ** 2).toFixed(4)}</span>
		</div>
	</div>

	{#if fAfterGD < fAtX}
		<div class="callout-good">
			✓ Décroissance confirmée : f(x⁽ᵏ⁺¹⁾) &lt; f(x⁽ᵏ⁾). Le terme −α‖∇f‖² domine pour α petit.
		</div>
	{:else}
		<div class="callout-warn">
			⚠ Pas trop grand : le développement limité ne garantit la décroissance que localement (α
			suffisamment petit).
		</div>
	{/if}
</div>

<style>
	/* Conservé à l'identique de votre design initial */
	.taylor-demo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		font-size: 0.875rem;
	}
	.section-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		text-align: center;
	}
	.sub-title {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		text-align: center;
		max-width: 550px;
		line-height: 1.4;
	}
	.options-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.options-row button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text, inherit);
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}
	.options-row button .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}
	.options-row button.active {
		background: var(--opt-color);
		color: white;
		border-color: var(--opt-color);
	}
	.options-row button.active .dot {
		background: white !important;
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
	.transport {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.btn {
		padding: 0.3rem 0.75rem;
		border-radius: var(--radius-sm, 4px);
		border: 1px solid var(--color-border);
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.8rem;
	}
	.btn:hover:not(:disabled) {
		background: var(--color-surface-3, rgba(255, 255, 255, 0.1));
	}
	.btn-primary {
		border-color: #3b82f6;
		color: #3b82f6;
	}
	.btn-warn {
		border-color: #f59e0b;
		color: #f59e0b;
	}
	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.stats {
		font-family: var(--font-mono, monospace);
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.5rem;
		width: 100%;
		max-width: 600px;
	}
	.info-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.4rem;
		border-radius: var(--radius-sm, 4px);
		font-size: 0.8rem;
	}
	.info-item .label {
		color: var(--color-text-muted);
		font-size: 0.85rem;
		margin-bottom: 0.15rem;
	}
	.info-item .value {
		font-family: var(--font-mono, monospace);
		font-weight: 600;
	}
	.info-red {
		border-left: 3px solid #ef4444;
		background: rgba(239, 68, 68, 0.05);
	}
	.info-green {
		border-left: 3px solid #22c55e;
		background: rgba(34, 197, 94, 0.05);
	}
	.info-amber {
		border-left: 3px solid #f59e0b;
		background: rgba(245, 158, 11, 0.05);
	}
	.info-purple {
		border-left: 3px solid #8b5cf6;
		background: rgba(139, 92, 246, 0.05);
	}
	.callout-good {
		background: rgba(34, 197, 94, 0.1);
		border-left: 3px solid #22c55e;
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
		max-width: 600px;
		text-align: center;
		line-height: 1.4;
	}
	.callout-warn {
		background: rgba(245, 158, 11, 0.1);
		border-left: 3px solid #f59e0b;
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
		max-width: 600px;
		text-align: center;
		line-height: 1.4;
	}
</style>
