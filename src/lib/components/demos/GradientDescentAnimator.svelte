<script lang="ts">
	import { onDestroy } from 'svelte';
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import { paraboloid, rosenbrock, residualNorm } from '$lib/math/test-functions.js';
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
			// Départ par défaut (0, 0) : piégé dans le minimum local lisse (0.096, 2.605), f ≈ 0.625.
			// Départ vers (3.5, −0.5) : atteint un minimum global non lisse et y zigzague
			// (cf. residualNorm dans test-functions.ts et ses tests).
			key: 'residualNorm',
			label: '√((x²+y−2)² + (x+y²−7)²)',
			func: residualNorm,
			defaultAlpha: 0.03,
			startPoint: [0, 0],
			color: '#a855f7'
		}
	];

	// Plafond d'itérations : sans lui, une trajectoire qui ne converge jamais au sens
	// ‖∇f‖ < 1e-3 (pointe de cône de residualNorm) animerait indéfiniment.
	const MAX_STEPS = 2000;

	let selectedKey = $state('paraboloid');
	// Point de départ contrôlable (sliders, clic sur le graphe, clavier) ; réinitialisé au
	// point par défaut de la fonction quand on change de fonction.
	let x0 = $state(-2.5);
	let y0 = $state(2);
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
	const hitMaxSteps = $derived(stepCount >= MAX_STEPS);
	// Itéré proche d'un zéro de f (minimum global) alors que ‖∇f‖ reste grand : signature
	// d'un minimum non différentiable (pointe de cône). Seuils choisis pour residualNorm,
	// où ‖∇f‖ ≥ σ_min(J) ≈ 3 au voisinage des zéros (cf. tests).
	// Le bandeau est volontairement mémorisé : près de la pointe, un pas peut sortir
	// brièvement du seuil f < 0.3, ce qui ne signifie pas que le régime oscillant a cessé.
	// On recherche donc la signature dans toute la trajectoire courante plutôt que sur
	// le seul dernier point. Les états convergence/divergence restent prioritaires dans
	// le rendu ci-dessous.
	const hasConeOscillation = $derived(
		selectedKey === 'residualNorm' &&
		trajectory.some((point, i) => point.fVal < 0.3 && (gradNorms[i] ?? 0) > 1)
	);
	const coneOscillation = $derived(hasConeOscillation && !isConverged && !diverged);
	const stopped = $derived(isConverged || diverged || hitMaxSteps);

	// Prédiction brute (permet de voir l'overflow réel de la flèche)
	const nextPredictedPoint = $derived.by(() => {
		if (!lastPoint || stopped) return null;
		const [nx, ny] = gdStep(lastPoint.x, lastPoint.y, func.grad, alpha);
		return { x: nx, y: ny };
	});

	function reset() {
		stopAnim();
		diverged = false;
		trajectory = [{ x: x0, y: y0, fVal: func.f(x0, y0) }];
		gradNorms = [gradNormAt(x0, y0)];
	}

	function step() {
		if (stopped || !nextPredictedPoint) return;

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
			if (stopped) {
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
		x0 = o.startPoint[0];
		y0 = o.startPoint[1];
		reset();
	}

	function setStart(x: number, y: number) {
		x0 = Math.min(domain[0][1], Math.max(domain[0][0], x));
		y0 = Math.min(domain[1][1], Math.max(domain[1][0], y));
		reset();
	}

	function resetStartToDefault() {
		setStart(opt.startPoint[0], opt.startPoint[1]);
	}

	const startStepX = $derived((domain[0][1] - domain[0][0]) / 200);
	const startStepY = $derived((domain[1][1] - domain[1][0]) / 200);

	// Clic sur le graphe → nouveau point de départ. Conversion écran → SVG via
	// getScreenCTM().inverse() (robuste au redimensionnement CSS), puis inverse de projX/projY
	// (même `pad` = 36 que ContourPlot).
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

	// Équivalent clavier (plus limité que le pointeur) : les flèches déplacent le point de
	// départ d'un pas de slider (×10 avec Maj), Entrée/Espace relance depuis ce point.
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
			reset();
		}
	}

	reset();

	onDestroy(stopAnim);

	function projX(x: number): number {
		return pad + ((x - domain[0][0]) / (domain[0][1] - domain[0][0])) * (width - pad * 2);
	}
	function projY(y: number): number {
		return pad + ((domain[1][1] - y) / (domain[1][1] - domain[1][0])) * (height - pad * 2);
	}
	function unprojX(px: number): number {
		return domain[0][0] + ((px - pad) / (width - pad * 2)) * (domain[0][1] - domain[0][0]);
	}
	function unprojY(py: number): number {
		return domain[1][1] - ((py - pad) / (height - pad * 2)) * (domain[1][1] - domain[1][0]);
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
		<div class="grp start-group">
			<div class="gttl">Point de départ</div>
			<div class="start-sliders">
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
		</div>
	</SliderGrid>

	<div class="transport">
		<button class="btn" onclick={reset}>⟲ Reset</button>
		<button class="btn" onclick={resetStartToDefault}>⌖ Départ par défaut</button>
		<button class="btn" onclick={step} disabled={stopped}>▶ Step</button>
		{#if playing}
			<button class="btn btn-warn" onclick={pause}>⏸ Pause</button>
		{:else}
			<button class="btn btn-primary" onclick={play} disabled={stopped}>⏵ Play</button>
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
			{#if selectedKey === 'residualNorm' && lastPoint && lastPoint.fVal > 0.1}
				— mais f(x⁽ᵏ⁾) ≈ {lastPoint.fVal.toFixed(3)} &gt; 0 : minimum local, pas global. Déplacez le point
				de départ.
			{/if}
		</div>
	{:else if coneOscillation}
		<div class="status-banner warn">
			↯ Oscillation autour du minimum : f n'est pas différentiable en x* (pointe de cône), donc ‖∇f‖
			≈ {lastGradNorm.toFixed(2)} ne s'annule pas et le pas constant fait zigzaguer. Réduire α resserre
			la zone ; seul un pas décroissant (méthode du sous-gradient) converge.
		</div>
	{:else if hitMaxSteps}
		<div class="status-banner warn">Arrêt après {MAX_STEPS} pas sans convergence.</div>
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

			<!-- Zone cliquable : place le point de départ (équivalent clavier : flèches + Entrée). -->
			<rect
				class="click-canvas"
				x={pad}
				y={pad}
				width={width - pad * 2}
				height={height - pad * 2}
				fill="transparent"
				role="button"
				tabindex="0"
				aria-label="Placer le point de départ : cliquer sur le graphe, ou flèches du clavier puis Entrée"
				onclick={handleCanvasClick}
				onkeydown={handleCanvasKey}
			/>

			<g clip-path="url(#graph-clip)">
				<circle
					cx={projX(x0)}
					cy={projY(y0)}
					r="7"
					fill="none"
					stroke="#f59e0b"
					stroke-width="2"
					stroke-dasharray="3 2"
				/>
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
						(lastIdx / Math.max(1, gradNorms.length - 1)) * (sparkW - sparkPad.l - sparkPad.r)}
					cy={sparkH - sparkPad.b}
					r="3.5"
					fill={opt.color}
					opacity="0"
				/>
			{/if}
		</svg>
		<p class="spark-caption">
			Une pente qui reste linéaire (en log) signale une convergence géométrique — typique d'une
			fonction fortement convexe à gradient Lipschitz, comme le paraboloïde. Un plateau
			(‖∇f‖ qui ne descend plus) près d'un minimum signale au contraire un minimum non
			différentiable, comme les deux minima globaux de √((x²+y−2)² + (x+y²−7)²).
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
		min-width: 0;
		width: 100%;
	}
	.gttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		min-height: 2.2em;
		display: flex;
		align-items: flex-start;
	}

	/* SliderGrid fournit la structure ; cette démo a trois groupes et doit donc
	   garder des colonnes de même largeur, même lorsque le troisième groupe passe
	   sur la ligne suivante. */
	.demo-wrap :global(.sliders-grid) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: 1rem;
		row-gap: 0.9rem;
		align-items: start;
	}
	.start-group {
		grid-column: 1 / -1;
	}
	.start-sliders {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	@media (max-width: 520px) {
		.demo-wrap :global(.sliders-grid) {
			grid-template-columns: 1fr;
			row-gap: 0.75rem;
		}

		.gttl {
			min-height: 0;
		}

		.start-sliders {
			gap: 0.75rem;
		}
	}
	@media (max-width: 360px) {
		.start-sliders {
			grid-template-columns: 1fr;
		}
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
	.status-banner.warn {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		max-width: 480px;
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
	.click-canvas {
		pointer-events: all;
		cursor: crosshair;
	}
	.click-canvas:focus-visible {
		outline: 2px solid #f59e0b;
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
