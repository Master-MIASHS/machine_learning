<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { runAdaBoostWithHistory, evaluateAdaboostBoundary } from '$lib/math/boosting.js';

	const N_SAMPLES = 80;
	const DEFAULT_MAX_ITER = 20;
	const GRID_RES = 32;

	const SVG_W = 460;
	const SVG_H = 380;
	const PAD_L = 48,
		PAD_R = 16,
		PAD_T = 12,
		PAD_B = 36;
	const PLOT_W = SVG_W - PAD_L - PAD_R;
	const PLOT_H = SVG_H - PAD_T - PAD_B;

	const DOMAIN_X: [number, number] = [-1.5, 2.5];
	const DOMAIN_Y: [number, number] = [-1.5, 1.5];

	function makeRng(seed: number): () => number {
		let s = ((seed % 2147483647) + 2147483647) % 2147483647 || 1;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	function randn(rng: () => number): number {
		let u1 = rng(),
			u2 = rng();
		while (u1 === 0) u1 = rng();
		return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	function generateMoons(n: number, seed: number): { X: number[][]; y: number[] } {
		const rng = makeRng(seed + 42);
		const half = Math.floor(n / 2);
		const X: number[][] = [];
		const y: number[] = [];

		for (let i = 0; i < n; i++) {
			let x: number[], label: number;
			if (i < half) {
				const angle = Math.PI * (i / (half - 1 || 1));
				x = [
					0.9 * Math.cos(angle) + 0.45 + randn(rng) * 0.13,
					0.9 * Math.sin(angle) - 0.25 + randn(rng) * 0.13
				];
				label = 1;
			} else {
				const idx = i - half;
				const angle = Math.PI * (idx / (half - 1 || 1));
				x = [
					0.9 * Math.cos(Math.PI + angle) + 0.55 + randn(rng) * 0.13,
					0.9 * Math.sin(Math.PI + angle) + 0.25 + randn(rng) * 0.13
				];
				label = -1;
			}
			X.push(x);
			y.push(label);
		}
		return { X, y };
	}

	let dataSeed = $state(0);
	let currentStep = $state(0);
	let maxIterations = $state(DEFAULT_MAX_ITER);
	let isPlaying = $state(false);

	const data = $derived(generateMoons(N_SAMPLES, dataSeed));

	const history = $derived.by(() => {
		return runAdaBoostWithHistory(data.X, data.y, maxIterations);
	});

	const numModels = $derived(history.models.length);

	$effect(() => {
		if (currentStep > numModels) {
			currentStep = Math.max(0, numModels);
		}
	});

	const activeModels = $derived(history.models.slice(0, currentStep));

	const currentWeights = $derived.by(() => {
		if (history.weightsPerStep.length === 0) return new Array(N_SAMPLES).fill(1 / N_SAMPLES);
		return history.weightsPerStep[Math.min(currentStep, history.weightsPerStep.length - 1)];
	});

	function projX(v: number): number {
		return PAD_L + ((v - DOMAIN_X[0]) / (DOMAIN_X[1] - DOMAIN_X[0])) * PLOT_W;
	}
	function projY(v: number): number {
		return PAD_T + ((DOMAIN_Y[1] - v) / (DOMAIN_Y[1] - DOMAIN_Y[0])) * PLOT_H;
	}

	interface GridCellData {
		sx: number;
		sy: number;
		pred: number;
		margin: number;
	}
	interface GridData {
		cells: GridCellData[];
		cellW: number;
		cellH: number;
	}

	const gridCells = $derived.by((): GridData => {
		if (activeModels.length === 0) return { cells: [], cellW: 0, cellH: 0 };

		const boundary = evaluateAdaboostBoundary(activeModels, DOMAIN_X, DOMAIN_Y, GRID_RES);
		const dx = (DOMAIN_X[1] - DOMAIN_X[0]) / GRID_RES;
		const dy = (DOMAIN_Y[1] - DOMAIN_Y[0]) / GRID_RES;

		const cellW = projX(DOMAIN_X[0] + dx) - projX(DOMAIN_X[0]);
		const cellH = projY(DOMAIN_Y[0]) - projY(DOMAIN_Y[0] + dy);

		const cells: GridCellData[] = [];
		for (let iy = 0; iy < GRID_RES; iy++) {
			const sy = projY(DOMAIN_Y[0] + (iy + 1) * dy);
			for (let ix = 0; ix < GRID_RES; ix++) {
				const sx = projX(DOMAIN_X[0] + ix * dx);
				const pred = boundary.predictions[iy]?.[ix] ?? 0;
				const margin = boundary.margins[iy]?.[ix] ?? 0;
				cells.push({ sx, sy, pred, margin });
			}
		}
		return { cells, cellW, cellH };
	});

	interface BoundaryEdgeData {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}

	const boundaryEdges = $derived.by(() => {
		const gc = gridCells;
		if (!gc.cells || gc.cells.length === 0) return [];

		const edges: BoundaryEdgeData[] = [];
		const cellW = gc.cellW;
		const cellH = gc.cellH;

		function getPred(ix: number, iy: number): number {
			const idx = iy * GRID_RES + ix;
			return gc.cells[idx]?.pred ?? 0;
		}

		for (let iy = 0; iy < GRID_RES - 1; iy++) {
			for (let ix = 0; ix < GRID_RES - 1; ix++) {
				const leftPred = getPred(ix, iy);
				const rightPred = getPred(ix + 1, iy);
				const belowPred = getPred(ix, iy + 1);

				if (leftPred !== rightPred && leftPred !== 0 && rightPred !== 0) {
					const midX = gc.cells[iy * GRID_RES + ix].sx + cellW / 2;
					const topY = gc.cells[iy * GRID_RES + ix].sy - 1;
					const botY = topY + cellH + 2;
					edges.push({ x1: midX, y1: topY, x2: midX, y2: botY });
				}
				if (leftPred !== belowPred && leftPred !== 0 && belowPred !== 0) {
					const midY = gc.cells[iy * GRID_RES + ix].sy + cellH / 2;
					const leftX = gc.cells[iy * GRID_RES + ix].sx - 1;
					const rightX = leftX + cellW + 2;
					edges.push({ x1: leftX, y1: midY, x2: rightX, y2: midY });
				}
			}
		}
		return edges;
	});

	const stumpLine = $derived.by(() => {
		if (currentStep < 1) return null;
		const stump = history.models[currentStep - 1].stump;
		if (!stump) return null;

		if (stump.featureIdx === 0) {
			return {
				x1: projX(stump.threshold),
				y1: PAD_T,
				x2: projX(stump.threshold),
				y2: SVG_H - PAD_B
			};
		} else {
			const sy = projY(stump.threshold);
			return { x1: PAD_L, y1: sy, x2: SVG_W - PAD_R, y2: sy };
		}
	});

	const projectedPoints = $derived.by(() => {
		const maxW = Math.max(...currentWeights, 1 / N_SAMPLES);
		return data.X.map((x, i) => ({
			cx: projX(x[0]),
			cy: projY(x[1]),
			label: data.y[i],
			r: 2.5 + (currentWeights[i] / maxW) * 5.5
		}));
	});

	const xTicks = $derived.by(() => {
		const ticks: { val: number; px: number }[] = [];
		for (let i = 0; i <= 4; i++) {
			const v = DOMAIN_X[0] + (i / 4) * (DOMAIN_X[1] - DOMAIN_X[0]);
			ticks.push({ val: v, px: projX(v) });
		}
		return ticks;
	});

	const yTicks = $derived.by(() => {
		const ticks: { val: number; py: number }[] = [];
		for (let i = 0; i <= 4; i++) {
			const v = DOMAIN_Y[0] + (i / 4) * (DOMAIN_Y[1] - DOMAIN_Y[0]);
			ticks.push({ val: v, py: projY(v) });
		}
		return ticks;
	});

	const currentError = $derived(currentStep >= 1 ? history.errors[currentStep - 1] : null);
	const currentAlpha = $derived(currentStep >= 1 ? history.alphas[currentStep - 1] : null);

	const cumulativeError = $derived.by(() => {
		if (currentStep < 1 || history.cumulativeErrors.length === 0) return 0;
		return history.cumulativeErrors[Math.min(currentStep, history.cumulativeErrors.length) - 1];
	});

	const ensembleAccuracy = $derived((1 - cumulativeError) * 100);

	const stumpDescription = $derived.by(() => {
		if (currentStep < 1) return 'Aucune itération';
		const s = history.models[currentStep - 1].stump;
		const featureName = s.featureIdx === 0 ? 'x₁' : 'x₂';
		return `${featureName} ≤ ${s.threshold.toFixed(2)} → classe ${s.leftValue > 0 ? '+1' : '−1'}`;
	});

	function stepForward() {
		if (currentStep < numModels) currentStep++;
	}
	function stepBackward() {
		if (currentStep > 0) currentStep--;
	}
	function reset() {
		currentStep = 0;
		isPlaying = false;
	}
	function togglePlay() {
		if (currentStep >= numModels) currentStep = 0;
		isPlaying = !isPlaying;
	}

	$effect(() => {
		if (!isPlaying) return;
		const interval = setInterval(() => {
			if (currentStep >= numModels) {
				isPlaying = false;
			} else {
				currentStep++;
			}
		}, 900);
		return () => clearInterval(interval);
	});

	$effect(() => {
		const s = dataSeed;
		void s;
		isPlaying = false;
		currentStep = 0;
	});

	function regenerate() {
		dataSeed++;
	}
</script>

<Figure type="chart">
	<div class="adaboost-demo">
		<header class="demo-header">
			<span class="eyebrow">Ensembles séquentiels</span>
			<h2>AdaBoost — apprentissage par renforcement progressif</h2>
			<p>
				Chaque stump faible ajuste son coup selon les poids d'erreur. L'agrégat pondéré affine la
				frontière de décision itération après itération.
			</p>
		</header>

		<div class="viz-grid">
			<div class="main-plot">
				<svg
					viewBox={`0 0 ${SVG_W} ${SVG_H}`}
					preserveAspectRatio="xMidYMid meet"
					role="img"
					aria-label="Frontière de décision AdaBoost pas à pas"
				>
					<defs>
						<linearGradient id="plot-bg" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="var(--color-surface-2, #14151c)" stop-opacity="0.5" />
							<stop
								offset="100%"
								stop-color="var(--color-surface-2, #14151c)"
								stop-opacity="0.15"
							/>
						</linearGradient>
					</defs>

					<rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="url(#plot-bg)" rx="6" />

					{#if gridCells.cells && gridCells.cells.length > 0}
						{#each gridCells.cells as cell}
							<rect
								x={cell.sx}
								y={cell.sy}
								width={gridCells.cellW}
								height={gridCells.cellH}
								fill={cell.pred === 1
									? 'rgba(96,165,250,0.16)'
									: cell.pred === -1
										? 'rgba(251,113,133,0.16)'
										: 'transparent'}
							/>
						{/each}

						{#each boundaryEdges as edge}
							<line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} class="boundary-edge" />
						{/each}
					{/if}

					{#if stumpLine}
						<line
							class="stump-line"
							x1={stumpLine.x1}
							y1={stumpLine.y1}
							x2={stumpLine.x2}
							y2={stumpLine.y2}
						/>
					{/if}

					{#each projectedPoints as p}
						<circle
							cx={p.cx}
							cy={p.cy}
							r={p.r}
							class="data-dot"
							class:dot-pos={p.label === 1}
							class:dot-neg={p.label === -1}
						/>
					{/each}

					<rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="none" class="plot-frame" />

					{#each xTicks as tick}
						<text x={tick.px} y={SVG_H - 6} text-anchor="middle" class="axis-label"
							>{tick.val.toFixed(1)}</text
						>
					{/each}
					{#each yTicks as tick}
						<text x={PAD_L - 8} y={tick.py + 4} text-anchor="end" class="axis-label"
							>{tick.val.toFixed(1)}</text
						>
					{/each}

					<text x={SVG_W / 2} y={SVG_H - 2} text-anchor="middle" class="axis-title">x₁</text>
					<text
						x={12}
						y={SVG_H / 2}
						text-anchor="middle"
						class="axis-title"
						transform={`rotate(-90, 12, ${SVG_H / 2})`}>x₂</text
					>
				</svg>
			</div>
		</div>

		<div class="bottom-row">
			<div class="controls-panel">
				<Slider bind:value={currentStep} min={0} max={numModels} step={1} label="Étape" />

				<div class="button-row">
					<Button variant="ghost" size="sm" onclick={reset}>⟲ Reset</Button>
					<Button
						variant="ghost"
						size="sm"
						onclick={stepBackward}
						disabled={currentStep <= 0 || numModels === 0}>← Préc.</Button
					>
					<Button variant="primary" size="sm" onclick={togglePlay} disabled={numModels === 0}>
						{isPlaying ? '⏸ Pause' : '▶ Lecture'}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onclick={stepForward}
						disabled={currentStep >= numModels || numModels === 0}>Suiv. →</Button
					>
				</div>

				<Slider
					bind:value={maxIterations}
					min={1}
					max={40}
					step={1}
					label="Nombre maximum d'itérations"
				/>

				<div class="button-row">
					<Button variant="outline" size="sm" onclick={regenerate}>↻ Régénérer les données</Button>
				</div>
			</div>

			<div class="side-panel">
				<div class="panel-title">Métriques de l'itération</div>

				<div class="metric-card metric-hero">
					<span class="metric-label">Itération</span>
					<span class="metric-value metric-step"
						>{currentStep}<span class="metric-of">/{numModels}</span></span
					>
				</div>

				<div class="metric-row">
					<div class="metric-card">
						<span class="metric-label">Erreur εₜ</span>
						{#if currentError !== null}
							<span
								class="metric-value"
								class:good={currentError < 0.5}
								class:bad={currentError >= 0.5}
							>
								{(currentError * 100).toFixed(1)}%
							</span>
						{:else}
							<span class="metric-value metric-empty">—</span>
						{/if}
					</div>

					<div class="metric-card">
						<span class="metric-label">Poids αₜ</span>
						{#if currentAlpha !== null}
							<span class="metric-value metric-alpha">{currentAlpha.toFixed(3)}</span>
						{:else}
							<span class="metric-value metric-empty">—</span>
						{/if}
					</div>
				</div>

				<div class="metric-card">
					<span class="metric-label">Erreur globale</span>
					{#if currentStep > 0}
						<span
							class="metric-value"
							class:good={cumulativeError === 0}
							class:mid={cumulativeError > 0 && cumulativeError < 0.2}
							class:bad={cumulativeError >= 0.2}
						>
							{(cumulativeError * 100).toFixed(1)}%
						</span>
					{:else}
						<span class="metric-value metric-empty">—</span>
					{/if}
				</div>

				<div class="metric-card metric-accent">
					<span class="metric-label">Précision de l'ensemble</span>
					<div class="accuracy-track">
						<div class="accuracy-fill" style:width="{ensembleAccuracy}%"></div>
					</div>
					<span class="metric-value accent-value">{ensembleAccuracy.toFixed(1)}%</span>
				</div>

				<div class="stump-info">
					<span class="stump-label">Stump t = {currentStep > 0 ? currentStep : '—'}</span>
					<span class="stump-eq">{stumpDescription}</span>
				</div>
			</div>
		</div>

		<div class="legend">
			<span><span class="swatch-dot swatch-pos"></span> Classe +1</span>
			<span><span class="swatch-dot swatch-neg"></span> Classe −1</span>
			<span><span class="swatch-rect swatch-bluish"></span> Zone prédite +1</span>
			<span><span class="swatch-rect swatch-reddish"></span> Zone prédite −1</span>
			<span><span class="swatch-line stump-swatch"></span> Stump courant hₜ(x)</span>
			<span><span class="swatch-line boundary-swatch"></span> Frontière agrégée</span>
		</div>

		<p class="caption-note">
			<strong>Pédagogie :</strong> Les points grossissent quand leur poids wᵢ augmente — le modèle « se
			concentre » sur les exemples difficiles. Les stumps successifs (ligne pointillée) affinent progressivement
			la frontière de l'ensemble pondéré.
		</p>
	</div>
</Figure>

<style>
	.adaboost-demo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		padding: 0.5rem;
	}

	.demo-header {
		text-align: center;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.eyebrow {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--color-belief);
		opacity: 0.85;
	}

	.demo-header h2 {
		font-size: 1.2rem;
		margin: 0;
		color: var(--color-text);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.demo-header p {
		font-size: 0.83rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0;
	}

	/* ─── Plot container: fixed aspect-ratio so the flex row can never
	       collapse it to near-zero height regardless of svg attribute/CSS
	       height conflicts. This is the actual fix for the 2px bug. ── */
	.viz-grid {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		gap: 1rem;
		justify-content: center;
		width: 100%;
		max-width: 700px;
	}

	.main-plot {
		width: 100%;
		max-width: 480px;
		aspect-ratio: 460 / 380;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--color-border);
		background: var(--color-surface, transparent);
	}

	.main-plot svg {
		display: block;
		width: 100%;
		height: 100%;
		user-select: none;
	}

	.plot-frame {
		stroke: var(--color-border);
		stroke-width: 1;
		opacity: 0.6;
	}

	.boundary-edge {
		stroke: var(--color-epistemic, #a78bfa);
		stroke-width: 1;
		opacity: 0.5;
	}

	.data-dot {
		stroke: rgba(255, 255, 255, 0.75);
		stroke-width: 0.9;
		opacity: 0.92;
		transition: r 0.25s ease;
	}
	.data-dot.dot-pos {
		fill: #60a5fa;
	}
	.data-dot.dot-neg {
		fill: #fb7185;
	}

	.stump-line {
		stroke: #fbbf24;
		stroke-width: 2.5;
		stroke-dasharray: 6 4;
		filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
		animation:
			stump-march 1.1s linear infinite,
			stump-blink 2.5s ease-in-out infinite;
	}

	@keyframes stump-march {
		to {
			stroke-dashoffset: -20;
		}
	}
	@keyframes stump-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.55;
		}
	}

	.axis-label {
		fill: var(--color-text-muted);
		font-size: 9px;
		font-family: var(--font-mono, monospace);
	}
	.axis-title {
		font-size: 10px;
		fill: var(--color-text-muted);
		font-weight: 600;
	}

	/* ─── Bottom row container ────────────────────────── */
	.bottom-row {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		align-items: stretch;
		width: 100%;
		max-width: 700px;
	}

	/* ─── Side panel ────────────────────────────────────── */
	.side-panel {
		min-width: 190px;
		max-width: 220px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.panel-title {
		font-size: 0.66rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
		color: var(--color-text-muted);
		padding-left: 2px;
	}

	.metric-row {
		display: flex;
		gap: 0.5rem;
	}
	.metric-row .metric-card {
		flex: 1;
	}

	.metric-card {
		background: var(--color-surface, transparent);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 0.55rem 0.7rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		transition: border-color 0.2s ease;
	}

	.metric-card.metric-hero {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-belief) 14%, transparent),
			transparent
		);
		border-color: color-mix(in srgb, var(--color-belief) 35%, var(--color-border));
	}

	.metric-card.metric-accent {
		border-color: color-mix(in srgb, var(--color-positive, #34d399) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-positive, #34d399) 7%, transparent);
	}

	.metric-label {
		font-size: 0.63rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.metric-value {
		font-family: var(--font-mono, monospace);
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.15;
	}

	.metric-value.metric-empty {
		color: var(--color-text-muted);
		opacity: 0.35;
	}
	.metric-value.good {
		color: #34d399;
	}
	.metric-value.mid {
		color: #60a5fa;
	}
	.metric-value.bad {
		color: #fb7185;
	}

	.metric-value.metric-step {
		font-size: 1.7rem;
		color: var(--color-belief);
	}
	.metric-of {
		font-size: 0.95rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.metric-value.metric-alpha {
		color: #fbbf24;
	}

	.accuracy-track {
		height: 5px;
		border-radius: 3px;
		background: var(--color-border);
		overflow: hidden;
		margin: 0.15rem 0 0.1rem;
	}
	.accuracy-fill {
		height: 100%;
		border-radius: 3px;
		background: linear-gradient(90deg, #34d399, #60a5fa);
		transition: width 0.4s ease;
	}
	.accent-value {
		color: #34d399;
	}

	.stump-info {
		background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), transparent);
		border: 1px solid rgba(251, 191, 36, 0.3);
		border-radius: 10px;
		padding: 0.5rem 0.65rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stump-label {
		font-size: 0.6rem;
		color: #d97706;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 700;
	}

	.stump-eq {
		font-size: 0.76rem;
		color: #b45309;
		font-family: var(--font-mono, monospace);
		line-height: 1.4;
	}

	/* ─── Controls ──────────────────────────────────────── */
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		flex: 1;
		padding: 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: 14px;
		background: var(--color-surface-2);
	}

	.button-row {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0.1rem 0;
	}

	/* ─── Legend ─────────────────────────────────────── */
	.legend {
		display: flex;
		gap: 0.9rem;
		font-size: 0.71rem;
		color: var(--color-text-muted);
		flex-wrap: wrap;
		justify-content: center;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		background: var(--color-surface-2, transparent);
	}

	.swatch-dot {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		vertical-align: middle;
		margin-right: 4px;
	}
	.swatch-pos {
		background: #60a5fa;
	}
	.swatch-neg {
		background: #fb7185;
	}

	.swatch-rect {
		display: inline-block;
		width: 12px;
		height: 10px;
		border-radius: 3px;
		vertical-align: middle;
		margin-right: 4px;
	}
	.swatch-bluish {
		background: rgba(96, 165, 250, 0.3);
	}
	.swatch-reddish {
		background: rgba(251, 113, 133, 0.3);
	}

	.swatch-line {
		display: inline-block;
		width: 16px;
		height: 2px;
		border-radius: 1px;
		vertical-align: middle;
		margin-right: 4px;
	}
	.stump-swatch {
		background: #fbbf24;
		height: 2.5px;
	}
	.boundary-swatch {
		background: var(--color-epistemic, #a78bfa);
		opacity: 0.6;
	}

	.caption-note {
		max-width: 620px;
		text-align: center;
		font-size: 0.79rem;
		color: var(--color-text-muted);
		line-height: 1.55;
		padding: 0;
		font-style: italic;
	}

	@media (max-width: 640px) {
		.bottom-row {
			flex-direction: column;
			align-items: center;
			gap: 0.7rem;
		}
		.side-panel {
			width: 100%;
			max-width: 100%;
			min-width: auto;
		}
		.metric-row {
			flex-direction: row;
		}
		.controls-panel {
			width: 100%;
			max-width: 100%;
		}
	}
</style>
