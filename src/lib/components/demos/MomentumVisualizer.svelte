<script lang="ts">
	import { onDestroy } from 'svelte';
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import { paraboloid, rosenbrock, residualNorm } from '$lib/math/test-functions.js';

	interface FuncOption {
		key: string;
		label: string;
		func: typeof paraboloid;
		defaultAlpha: number;
		defaultBeta: number;
		alphaRange: { min: number; max: number; step: number };
		startPoint: [number, number];
		color: string;
	}

	const funcOptions: FuncOption[] = [
		{
			key: 'rosenbrock',
			label: 'Rosenbrock ((1−x)² + 100(y−x²)²)',
			func: rosenbrock,
			defaultAlpha: 0.001,
			defaultBeta: 0.9,
			alphaRange: { min: 0.0001, max: 0.005, step: 0.0001 },
			startPoint: [-1.5, 2],
			color: '#ef4444'
		},
		{
			key: 'paraboloid',
			label: 'Paraboloïde (x² + 4y²)',
			func: paraboloid,
			defaultAlpha: 0.1,
			defaultBeta: 0.9,
			alphaRange: { min: 0.01, max: 1.0, step: 0.01 },
			startPoint: [-2.5, 2],
			color: '#3b82f6'
		},
		{
			// Départ par défaut (−3.5, 0), α = 0.01, β = 0.9 : le GD classique tombe dans le
			// minimum global (−2.245, −3.041), le momentum est emporté vers l'autre,
			// (2.055, −2.224). Les deux sont des pointes de cône : zigzag résiduel au fond.
			key: 'residualNorm',
			label: '√((x²+y−2)² + (x+y²−7)²)',
			func: residualNorm,
			defaultAlpha: 0.01,
			defaultBeta: 0.9,
			alphaRange: { min: 0.001, max: 0.1, step: 0.001 },
			startPoint: [-3.5, 0],
			color: '#a855f7'
		}
	];

	let selectedKey = $state('rosenbrock');
	// Point de départ contrôlable (sliders, clic sur l'un des graphes, clavier) ;
	// réinitialisé au point par défaut quand on change de fonction.
	let x0 = $state(-1.5);
	let y0 = $state(2);
	let alpha = $state(0.001);
	let beta = $state(0.9);
	let maxSteps = $state(150);
	let playing = $state(false);
	let visibleSteps = $state(0);
	let animTimer: ReturnType<typeof setInterval> | null = null;

	const opt = $derived(funcOptions.find((o) => o.key === selectedKey)!);
	const func = $derived(opt.func);
	const f = $derived(func.f);
	const grad = $derived(func.grad);

	const defaultDomain: [[number, number], [number, number]] = [
		[-3, 3],
		[-3, 3]
	];
	const domain = $derived(func.domain ?? defaultDomain);
	const startX = $derived(x0);
	const startY = $derived(y0);

	// Limites du slider d'apprentissage propres à chaque fonction
	const alphaMin = $derived(opt.alphaRange.min);
	const alphaMax = $derived(opt.alphaRange.max);
	const alphaStep = $derived(opt.alphaRange.step);

	const gdPoints = $derived.by(() => {
		let x = startX,
			y = startY;
		const traj = [{ x, y }];
		for (let k = 0; k < maxSteps; k++) {
			const [gx, gy] = grad(x, y);
			if (Math.hypot(gx, gy) < 1e-8) break;
			x -= alpha * gx;
			y -= alpha * gy;
			if (!isFinite(f(x, y))) break;
			traj.push({ x, y });
		}
		return traj;
	});

	const momPoints = $derived.by(() => {
		let x = startX,
			y = startY;
		let vx = 0,
			vy = 0;
		const traj = [{ x, y }];
		for (let k = 0; k < maxSteps; k++) {
			const [gx, gy] = grad(x, y);
			if (Math.hypot(gx, gy) < 1e-8) break;
			vx = beta * vx + gx;
			vy = beta * vy + gy;
			x -= alpha * vx;
			y -= alpha * vy;
			if (!isFinite(f(x, y))) break;
			traj.push({ x, y });
		}
		return traj;
	});

	const maxAvailableSteps = $derived(Math.max(gdPoints.length, momPoints.length));

	function oscillationScore(points: { x: number; y: number }[]): number {
		let flips = 0;
		let prevDy: number | null = null;
		for (let i = 1; i < points.length; i++) {
			const dy = points[i].y - points[i - 1].y;
			if (
				prevDy !== null &&
				Math.sign(dy) !== 0 &&
				Math.sign(prevDy) !== 0 &&
				Math.sign(dy) !== Math.sign(prevDy)
			) {
				flips++;
			}
			if (Math.sign(dy) !== 0) prevDy = dy;
		}
		return flips;
	}
	const gdOscillations = $derived(oscillationScore(gdPoints));
	const momOscillations = $derived(oscillationScore(momPoints));

	let rowWidth = $state(680);
	const gapPx = 16;
	const chartW = $derived(Math.max(140, Math.min(320, (rowWidth - gapPx) / 2 - 24)));
	// Doit refléter le padding interne de ContourPlot (pad = 36) pour que les trajectoires
	// tombent sur les bonnes courbes de niveau.
	const pad = 36;
	const aspect = $derived((domain[1][1] - domain[1][0]) / (domain[0][1] - domain[0][0]));
	const chartH = $derived(Math.round(chartW * aspect));

	function projX(x: number) {
		return pad + ((x - domain[0][0]) / (domain[0][1] - domain[0][0])) * (chartW - pad * 2);
	}
	function projY(y: number) {
		return pad + ((domain[1][1] - y) / (domain[1][1] - domain[1][0])) * (chartH - pad * 2);
	}
	function unprojX(px: number) {
		return domain[0][0] + ((px - pad) / (chartW - pad * 2)) * (domain[0][1] - domain[0][0]);
	}
	function unprojY(py: number) {
		return domain[1][1] - ((py - pad) / (chartH - pad * 2)) * (domain[1][1] - domain[1][0]);
	}

	const startStepX = $derived((domain[0][1] - domain[0][0]) / 200);
	const startStepY = $derived((domain[1][1] - domain[1][0]) / 200);

	function setStart(x: number, y: number) {
		x0 = Math.min(domain[0][1], Math.max(domain[0][0], x));
		y0 = Math.min(domain[1][1], Math.max(domain[1][0], y));
	}

	// Clic sur l'un des graphes → nouveau point de départ (commun aux deux méthodes).
	// Conversion écran → SVG via getScreenCTM().inverse(), puis inverse de projX/projY.
	function handleCanvasClick(event: MouseEvent & { currentTarget: SVGRectElement }) {
		const svg = event.currentTarget.ownerSVGElement;
		const ctm = svg?.getScreenCTM();
		if (!svg || !ctm) return;
		const pt = svg.createSVGPoint();
		pt.x = event.clientX;
		pt.y = event.clientY;
		const p = pt.matrixTransform(ctm.inverse());
		setStart(unprojX(p.x), unprojY(p.y));
	}

	// Équivalent clavier (plus limité que le pointeur) : flèches = déplacer le point de départ
	// d'un pas de slider (×10 avec Maj), Entrée/Espace = lancer la course.
	function handleCanvasKey(event: KeyboardEvent) {
		const k = event.shiftKey ? 10 : 1;
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-k * startStepX, 0],
			ArrowRight: [k * startStepX, 0],
			ArrowUp: [0, k * startStepY],
			ArrowDown: [0, -k * startStepY]
		};
		const mv = moves[event.key];
		if (mv) {
			event.preventDefault();
			setStart(x0 + mv[0], y0 + mv[1]);
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			play();
		}
	}

	function pathFor(points: { x: number; y: number }[], upTo: number): string {
		const slice = points.slice(0, upTo + 1);
		if (slice.length < 2) return '';
		let d = `M${projX(slice[0].x)},${projY(slice[0].y)}`;
		for (let i = 1; i < slice.length; i++) {
			d += ` L${projX(slice[i].x)},${projY(slice[i].y)}`;
		}
		return d;
	}

	const gdVisible = $derived(Math.min(visibleSteps, gdPoints.length - 1));
	const momVisible = $derived(Math.min(visibleSteps, momPoints.length - 1));

	const gdPathVisible = $derived(pathFor(gdPoints, gdVisible));
	const momPathVisible = $derived(pathFor(momPoints, momVisible));

	const gdCurrent = $derived(gdPoints[gdVisible] ?? gdPoints[0]);
	const momCurrent = $derived(momPoints[momVisible] ?? momPoints[0]);

	const gdEnd = $derived(f(gdCurrent.x, gdCurrent.y));
	const momEnd = $derived(f(momCurrent.x, momCurrent.y));

	const bothSettled = $derived(
		visibleSteps >= gdPoints.length - 1 && visibleSteps >= momPoints.length - 1
	);

	function resetAnim() {
		stopAnim();
		visibleSteps = 0;
	}

	function tick() {
		if (bothSettled) {
			stopAnim();
			return;
		}
		visibleSteps++;
	}

	function play() {
		if (playing) return;
		if (bothSettled) resetAnim();
		playing = true;
		animTimer = setInterval(tick, 40);
	}
	function pause() {
		stopAnim();
	}
	function stopAnim() {
		if (animTimer !== null) clearInterval(animTimer);
		animTimer = null;
		playing = false;
	}

	function selectFunc(key: string) {
		stopAnim();
		selectedKey = key;
		const o = funcOptions.find((o2) => o2.key === key)!;
		alpha = o.defaultAlpha;
		beta = o.defaultBeta;
		x0 = o.startPoint[0];
		y0 = o.startPoint[1];
		resetAnim();
	}

	onDestroy(stopAnim);

	$effect(() => {
		void alpha;
		void beta;
		void maxSteps;
		void x0;
		void y0;
		resetAnim();
	});
</script>

<div class="mom-demo">
	<h3 class="section-title">Momentum : amortissement des oscillations</h3>

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
			<Slider bind:value={alpha} min={alphaMin} max={alphaMax} step={alphaStep} label="α" />
		</div>
		<div class="grp">
			<div class="gttl">Momentum</div>
			<Slider bind:value={beta} min={0} max={0.99} step={0.01} label="β" />
		</div>
		<div class="grp">
			<div class="gttl">Point de départ</div>
			<Slider
				value={x0}
				min={domain[0][0]}
				max={domain[0][1]}
				step={startStepX}
				label="x₀"
				onchange={(v) => setStart(v, y0)}
			/>
			<Slider
				value={y0}
				min={domain[1][0]}
				max={domain[1][1]}
				step={startStepY}
				label="y₀"
				onchange={(v) => setStart(x0, v)}
			/>
		</div>
		<div class="grp">
			<div class="gttl">Nombre d'étapes max</div>
			<Slider bind:value={maxSteps} min={10} max={300} step={5} label="k" />
		</div>
	</SliderGrid>

	<div class="transport">
		<button class="btn" onclick={resetAnim}>⟲ Reset</button>
		<button class="btn" onclick={() => setStart(opt.startPoint[0], opt.startPoint[1])}
			>⌖ Départ par défaut</button
		>
		<button class="btn" onclick={tick} disabled={playing || bothSettled}>▶ Un pas</button>
		{#if playing}
			<button class="btn btn-warn" onclick={pause}>⏸ Pause</button>
		{:else}
			<button class="btn btn-primary" onclick={play} disabled={bothSettled}
				>⏵ Lancer la course</button
			>
		{/if}
		<div class="stats-inline">k = {visibleSteps} / {maxAvailableSteps - 1}</div>
	</div>

	<div class="panels-row" bind:clientWidth={rowWidth}>
		<!-- GD without momentum -->
		<div class="panel">
			<span class="panel-label" style="--clr: #94a3b8">GD classique (sans momentum)</span>
			<div class="chart-container" style:width="{chartW}px" style:height="{chartH}px">
				<ContourPlot {f} {domain} width={chartW} height={chartH} numLevels={8} />
				<svg class="traj-overlay" width={chartW} height={chartH}>
					<!-- Zone cliquable : place le point de départ (clavier : flèches, Entrée). -->
					<rect
						class="click-canvas"
						x={pad}
						y={pad}
						width={chartW - pad * 2}
						height={chartH - pad * 2}
						fill="transparent"
						role="button"
						tabindex="0"
						aria-label="Placer le point de départ : cliquer sur le graphe, ou flèches du clavier puis Entrée"
						onclick={handleCanvasClick}
						onkeydown={handleCanvasKey}
					/>
					<path d={gdPathVisible} fill="none" stroke="#94a3b8" stroke-width="2.5" opacity="0.9" />
					<circle
						cx={projX(startX)}
						cy={projY(startY)}
						r="4"
						fill="#fff"
						stroke="#94a3b8"
						stroke-width="2"
					/>
					<circle cx={projX(gdCurrent.x)} cy={projY(gdCurrent.y)} r="5" fill="#94a3b8" />
				</svg>
			</div>
			<div class="stats">
				k = {gdVisible} | f = {gdEnd.toFixed(4)} | {gdOscillations} oscillation{gdOscillations === 1
					? ''
					: 's'}
			</div>
		</div>

		<!-- Momentum -->
		<div class="panel panel-highlighted">
			<span class="panel-label" style="--clr: #22c55e">GD + Momentum (β = {beta.toFixed(2)})</span>
			<div class="chart-container" style:width="{chartW}px" style:height="{chartH}px">
				<ContourPlot {f} {domain} width={chartW} height={chartH} numLevels={8} />
				<svg class="traj-overlay" width={chartW} height={chartH}>
					<!-- Zone cliquable : place le point de départ (clavier : flèches, Entrée). -->
					<rect
						class="click-canvas"
						x={pad}
						y={pad}
						width={chartW - pad * 2}
						height={chartH - pad * 2}
						fill="transparent"
						role="button"
						tabindex="0"
						aria-label="Placer le point de départ : cliquer sur le graphe, ou flèches du clavier puis Entrée"
						onclick={handleCanvasClick}
						onkeydown={handleCanvasKey}
					/>
					<path d={momPathVisible} fill="none" stroke="#22c55e" stroke-width="2.5" opacity="0.9" />
					<circle
						cx={projX(startX)}
						cy={projY(startY)}
						r="4"
						fill="#fff"
						stroke="#22c55e"
						stroke-width="2"
					/>
					<circle cx={projX(momCurrent.x)} cy={projY(momCurrent.y)} r="5" fill="#22c55e" />
				</svg>
			</div>
			<div class="stats">
				k = {momVisible} | f = {momEnd.toFixed(4)} | {momOscillations} oscillation{momOscillations ===
				1
					? ''
					: 's'}
			</div>
		</div>
	</div>

	<div class="race-summary">
		<div class="race-title">Oscillations (sign flips de la vitesse y)</div>
		<div class="race-row">
			<span class="race-label" style="color:#94a3b8">Sans momentum</span>
			<div class="race-track">
				<div
					class="race-bar"
					style:width="{maxAvailableSteps
						? (gdOscillations / Math.max(1, gdOscillations, momOscillations)) * 100
						: 0}%"
					style:background="#94a3b8"
				></div>
			</div>
			<span class="race-value">{gdOscillations}</span>
		</div>
		<div class="race-row">
			<span class="race-label" style="color:#22c55e">Avec momentum</span>
			<div class="race-track">
				<div
					class="race-bar"
					style:width="{maxAvailableSteps
						? (momOscillations / Math.max(1, gdOscillations, momOscillations)) * 100
						: 0}%"
					style:background="#22c55e"
				></div>
			</div>
			<span class="race-value">{momOscillations}</span>
		</div>
	</div>

	<div class="callout-intuition">
		💡 Sur la vallée étroite (Ellipse) ou courbée (Rosenbrock), le GD classique accumule des
		oscillations orthogonales massives. Le Momentum additionne les gradients successifs dans la
		direction du minimum et annule les oscillations parasites. Sur √((x²+y−2)² + (x+y²−7)²), qui a
		deux minima globaux (f = 0) et un minimum local (f ≈ 0,625), l'inertie peut faire changer de
		bassin : déplacez le point de départ pour le constater. Au fond des minima globaux, la fonction
		n'est pas différentiable et les deux méthodes zigzaguent sans converger exactement.
	</div>
</div>

<style>
	.mom-demo {
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

	.options-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 0.2rem;
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
		transition: all 0.15s ease;
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

	.stats-inline {
		font-family: var(--font-mono, monospace);
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.panels-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		width: 100%;
		justify-items: center;
	}

	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 0.65rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		width: 100%;
	}

	.panel-highlighted {
		border-color: rgba(34, 197, 94, 0.3);
		box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.1);
	}

	.panel-label {
		font-size: 0.72rem;
		color: var(--clr, inherit);
		font-weight: 600;
		text-align: center;
	}

	.chart-container {
		position: relative;
	}

	.traj-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.click-canvas {
		pointer-events: all;
		cursor: crosshair;
	}
	.click-canvas:focus-visible {
		outline: 2px solid var(--color-text-muted);
	}

	.stats {
		font-family: var(--font-mono, monospace);
		font-size: 0.72rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	.race-summary {
		width: 100%;
		max-width: 480px;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
	}
	.race-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		text-align: center;
	}
	.race-row {
		display: grid;
		grid-template-columns: 8rem 1fr 2rem;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.76rem;
	}
	.race-label {
		font-weight: 600;
		white-space: nowrap;
	}
	.race-track {
		height: 10px;
		background: var(--color-border);
		border-radius: 4px;
		overflow: hidden;
	}
	.race-bar {
		height: 100%;
		border-radius: 4px;
		transition: width 0.1s linear;
	}
	.race-value {
		font-family: var(--font-mono, monospace);
		text-align: right;
		color: var(--color-text-muted);
	}

	.callout-intuition {
		background: rgba(245, 158, 11, 0.1);
		border-left: 3px solid #f59e0b;
		color: var(--color-text-muted);
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
		max-width: 600px;
		text-align: center;
		line-height: 1.4;
	}
</style>
