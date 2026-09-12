<script lang="ts">
	import { onDestroy } from 'svelte';
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import { paraboloid, rosenbrock, ellipse } from '$lib/math/test-functions.js';
	import { gdStep } from '$lib/math/gradient-descent.js';

	interface FuncOption {
		key: string;
		label: string;
		func: typeof paraboloid;
		defaultAlpha: number;
		startPoint: [number, number];
		color: string;
	}

	const funcOptions: FuncOption[] = [
		{
			key: 'paraboloid',
			label: 'Paraboloïde (x² + 4y²)',
			func: paraboloid,
			defaultAlpha: 0.1,
			startPoint: [-2.5, 2],
			color: '#3b82f6'
		},
		{
			key: 'rosenbrock',
			label: 'Rosenbrock ((1−x)² + 100(y−x²)²)',
			func: rosenbrock,
			defaultAlpha: 0.001,
			startPoint: [-1.5, 2],
			color: '#ef4444'
		},
		{
			key: 'ellipse',
			label: 'Ellipse (x²/4 + y²)',
			func: ellipse,
			defaultAlpha: 0.3,
			startPoint: [-3, -3],
			color: '#10b981'
		}
	];

	let selectedKey = $state('paraboloid');
	let containerWidth = $state(420);
	let alpha = $state(0.1);
	let stepIntervalMs = $state(150);
	let playing = $state(false);
	let diverged = $state(false);
	let animTimer: ReturnType<typeof setInterval> | null = null;

	const opt = $derived(funcOptions.find((o) => o.key === selectedKey)!);
	const func = $derived(opt.func);
	const defaultDomain: [[number, number], [number, number]] = [
		[-3, 3],
		[-3, 3]
	];
	const domain = $derived(func.domain ?? defaultDomain);
	const aspect = $derived((domain[1][1] - domain[1][0]) / (domain[0][1] - domain[0][0]));
	const width = $derived(Math.min(containerWidth, 480));
	const height = $derived(Math.round(width * aspect));

	const pad = 36; // Export du padding pour l'utiliser dans le clipPath

	let trajectory: { x: number; y: number; fVal: number }[] = $state([]);
	// Normes ‖∇f(x⁽ᵏ⁾)‖ accumulées pas à pas : mêmes valeurs et même ordre
	// que l'ancien $derived, mais on n'évalue le gradient que pour le point
	// nouvellement ajouté (coût O(1) par pas au lieu de recalculer tout
	// l'historique à O(k), soit O(k²) sur une longue animation).
	let gradNorms: number[] = $state([]);

	function gradNormAt(x: number, y: number): number {
		const g = func.grad(x, y);
		return Math.max(1e-10, Math.hypot(g[0], g[1]));
	}

	const lastPoint = $derived(trajectory[trajectory.length - 1] ?? null);
	const lastGrad = $derived.by((): [number, number] => {
		if (!lastPoint) return [0, 0];
		return func.grad(lastPoint.x, lastPoint.y);
	});
	const lastGradNorm = $derived(Math.hypot(lastGrad[0], lastGrad[1]));
	const isConverged = $derived(lastGradNorm < 1e-3);
	const stepCount = $derived(Math.max(0, trajectory.length - 1));

	// Prédiction brute (permet de voir l'overflow réel de la flèche)
	const nextPredictedPoint = $derived.by(() => {
		if (!lastPoint || isConverged || diverged) return null;
		const [nx, ny] = gdStep(lastPoint.x, lastPoint.y, func.grad, alpha);
		return { x: nx, y: ny };
	});

	function reset() {
		stopAnim();
		diverged = false;
		const sp = opt.startPoint;
		trajectory = [{ x: sp[0], y: sp[1], fVal: func.f(sp[0], sp[1]) }];
		gradNorms = [gradNormAt(sp[0], sp[1])];
	}

	function step() {
		if (isConverged || diverged || !nextPredictedPoint) return;

		const nx = nextPredictedPoint.x;
		const ny = nextPredictedPoint.y;
		const fVal = func.f(nx, ny);

		// Ajout du point non-clamped pour autoriser l'overflow mathématique et graphique
		trajectory = [...trajectory, { x: nx, y: ny, fVal }];
		gradNorms = [...gradNorms, gradNormAt(nx, ny)];

		// On vérifie la divergence si on sort massivement des limites ou si la valeur diverge
		if (
			!Number.isFinite(fVal) ||
			Math.abs(nx) > domain[0][1] * 3 ||
			Math.abs(ny) > domain[1][1] * 3
		) {
			diverged = true;
			stopAnim();
		}
	}

	function play() {
		if (playing) return;
		if (trajectory.length === 0) reset();
		playing = true;
		animTimer = setInterval(() => {
			if (isConverged || diverged) {
				stopAnim();
				return;
			}
			step();
		}, stepIntervalMs);
	}

	function pause() {
		stopAnim();
	}

	function stopAnim() {
		if (animTimer !== null) clearInterval(animTimer);
		animTimer = null;
		playing = false;
	}

	$effect(() => {
		void stepIntervalMs;
		if (playing) {
			if (animTimer !== null) clearInterval(animTimer);
			animTimer = setInterval(() => {
				if (isConverged || diverged) {
					stopAnim();
					return;
				}
				step();
			}, stepIntervalMs);
		}
	});

	function selectFunc(key: string) {
		stopAnim();
		selectedKey = key;
		const o = funcOptions.find((o2) => o2.key === key)!;
		alpha = o.defaultAlpha;
		reset();
	}

	reset();

	onDestroy(stopAnim);

	function projX(x: number): number {
		return pad + ((x - domain[0][0]) / (domain[0][1] - domain[0][0])) * (width - pad * 2);
	}
	function projY(y: number): number {
		return pad + ((domain[1][1] - y) / (domain[1][1] - domain[1][0])) * (height - pad * 2);
	}

	function segmentColor(i: number): string {
		const total = trajectory.length - 1;
		if (total === 0) return '#f59e0b';
		const t = i / total;
		const r = Math.round(245 * (1 - t) + 16 * t);
		const g = Math.round(158 * (1 - t) + 163 * t);
		const b = Math.round(11 * (1 - t) + 129 * t);
		return `rgb(${r},${g},${b})`;
	}

	const trajectorySegments = $derived.by(() => {
		if (trajectory.length < 2) return [];
		const segs = [];
		for (let i = 1; i < trajectory.length; i++) {
			segs.push({
				d: `M${projX(trajectory[i - 1].x).toFixed(1)},${projY(trajectory[i - 1].y).toFixed(1)} L${projX(trajectory[i].x).toFixed(1)},${projY(trajectory[i].y).toFixed(1)}`,
				color: segmentColor(i - 1)
			});
		}
		return segs;
	});

	const sparkW = 400;
	const sparkH = 90;
	const sparkPad = { l: 34, r: 10, t: 8, b: 18 };

	const sparkPath = $derived.by(() => {
		const hist = gradNorms;
		if (hist.length < 2) return '';
		const logs = hist.map((v) => Math.log10(v));
		const lo = Math.min(...logs, -6);
		const hi = Math.max(...logs, 1);
		const span = hi - lo || 1;
		return logs
			.map((lv, i) => {
				const px = sparkPad.l + (i / (hist.length - 1)) * (sparkW - sparkPad.l - sparkPad.r);
				const py = sparkPad.t + (1 - (lv - lo) / span) * (sparkH - sparkPad.t - sparkPad.b);
				return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
			})
			.join(' ');
	});
</script>

<div class="demo-wrap" bind:clientWidth={containerWidth}>
	<div class="options-row">
		{#each funcOptions as o}
			<button
				class:active={selectedKey === o.key}
				style:--opt-color={o.color}
				onclick={() => selectFunc(o.key)}
			>
				<span class="dot" style:background={o.color}></span>
				{o.label}
			</button>
		{/each}
	</div>

	<SliderGrid>
		<div class="grp">
			<div class="gttl">Taux d'apprentissage</div>
			<Slider bind:value={alpha} min={0.0001} max={1} step={0.0001} label="α" />
		</div>
		<div class="grp">
			<div class="gttl">Vitesse de lecture</div>
			<Slider bind:value={stepIntervalMs} min={30} max={500} step={10} label="ms / pas" />
		</div>
	</SliderGrid>

	<div class="transport">
		<button class="btn" onclick={reset}>⟲ Reset</button>
		<button class="btn" onclick={step} disabled={isConverged || diverged}>▶ Step</button>
		{#if playing}
			<button class="btn btn-warn" onclick={pause}>⏸ Pause</button>
		{:else}
			<button class="btn btn-primary" onclick={play} disabled={isConverged || diverged}
				>⏵ Play</button
			>
		{/if}

		<div class="stats">
			k = {stepCount} | f(x⁽ᵏ⁾) = {lastPoint ? lastPoint.fVal.toFixed(4) : '—'}
		</div>
	</div>

	{#if diverged}
		<div class="status-banner danger">✗ Divergence détectée — réduisez α et relancez.</div>
	{:else if isConverged}
		<div class="status-banner success">
			✓ Convergé — ‖∇f(x⁽ᵏ⁾)‖ ≈ {lastGradNorm.toExponential(2)}
		</div>
	{/if}

	<div class="chart-container">
		<ContourPlot f={func.f} {domain} {width} {height} />
		<svg class="overlay" {width} {height} viewBox={`0 0 ${width} ${height}`}>
			<defs>
				<polygon id="arrowhead" points="0,0 -8,-4 -3,0 -8,4" fill="#ef4444" />
				<clipPath id="graph-clip">
					<rect x={pad} y={pad} width={width - pad * 2} height={height - pad * 2} />
				</clipPath>
			</defs>

			<g clip-path="url(#graph-clip)">
				{#each trajectorySegments as seg}
					<path
						d={seg.d}
						fill="none"
						stroke={seg.color}
						stroke-width="2.5"
						stroke-linecap="round"
					/>
				{/each}

				{#each trajectory as pt, i (i)}
					<circle
						cx={projX(pt.x)}
						cy={projY(pt.y)}
						r={i === trajectory.length - 1 ? 5 : 3}
						fill={segmentColor(i)}
					/>
				{/each}

				{#if nextPredictedPoint}
					{@const ex = projX(nextPredictedPoint.x)}
					{@const ey = projY(nextPredictedPoint.y)}
					<line
						x1={projX(lastPoint.x)}
						y1={projY(lastPoint.y)}
						x2={ex}
						y2={ey}
						stroke="#ef4444"
						stroke-width="3"
						marker-end="url(#arrowhead)"
					/>
					<text
						x={(projX(lastPoint.x) + ex) / 2 + 8}
						y={(projY(lastPoint.y) + ey) / 2 - 4}
						fill="#ef4444"
						font-size="10"
						font-weight="600">−∇f</text
					>
				{/if}
			</g>
		</svg>
	</div>

	<div class="legend">
		<span class="legend-item"><span class="swatch swatch-start"></span>Début</span>
		<span class="legend-item"><span class="swatch swatch-end"></span>Fin</span>
		<span class="legend-item"><span class="swatch swatch-grad"></span>−∇f(x⁽ᵏ⁾)</span>
	</div>

	<div class="spark-panel">
		<div class="spark-title">‖∇f(x⁽ᵏ⁾)‖ en fonction de k (échelle log)</div>
		<svg
			viewBox={`0 0 ${sparkW} ${sparkH}`}
			width="100%"
			height={sparkH}
			role="img"
			aria-label="Convergence du gradient"
		>
			<line
				x1={sparkPad.l}
				y1={sparkH - sparkPad.b}
				x2={sparkW - sparkPad.r}
				y2={sparkH - sparkPad.b}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<line
				x1={sparkPad.l}
				y1={sparkPad.t}
				x2={sparkPad.l}
				y2={sparkH - sparkPad.b}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<path d={sparkPath} fill="none" stroke={opt.color} stroke-width="2" />
			{#if gradNorms.length > 0}
				{@const lastIdx = gradNorms.length - 1}
				<circle
					cx={sparkPad.l +
						(lastIdx / Math.max(1, gradNorms.length - 1)) *
							(sparkW - sparkPad.l - sparkPad.r)}
					cy={sparkH - sparkPad.b}
					r="3.5"
					fill={opt.color}
					opacity="0"
				/>
			{/if}
		</svg>
		<p class="spark-caption">
			Une pente qui reste linéaire (en log) signale une convergence géométrique — typique d'une
			fonction fortement convexe à gradient Lipschitz, comme le paraboloïde ou l'ellipse.
		</p>
	</div>
</div>

<style>
	/* ... Votre CSS d'origine ... */
	.demo-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
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
		font-size: 0.8rem;
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
		font-size: 0.85rem;
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
		margin-left: auto;
		font-family: var(--font-mono, monospace);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: right;
		min-width: 200px;
	}
	.status-banner {
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.35rem 0.9rem;
		border-radius: var(--radius-sm, 4px);
		text-align: center;
	}
	.status-banner.success {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}
	.status-banner.danger {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}
	.chart-container {
		position: relative;
	}
	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.legend {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.swatch {
		width: 12px;
		height: 3px;
		border-radius: 2px;
	}
	.swatch-start {
		background: #f59e0b;
	}
	.swatch-end {
		background: #10a381;
	}
	.swatch-grad {
		background: #ef4444;
		height: 12px;
		width: 3px;
	}
	.spark-panel {
		width: 100%;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
	}
	.spark-title {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		text-align: center;
	}
	.spark-caption {
		margin: 0;
		font-size: 0.74rem;
		color: var(--color-text-muted);
		text-align: center;
	}
</style>
