<script lang="ts">
	import { onDestroy } from 'svelte';
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import { paraboloid, saddle } from '$lib/math/test-functions.js';

	interface FuncOption {
		key: string;
		label: string;
		func: typeof paraboloid;
		color: string;
	}

	const funcOptions: FuncOption[] = [
		{ key: 'paraboloid', label: 'Paraboloïde (x² + 4y²)', func: paraboloid, color: '#22c55e' },
		{ key: 'saddle', label: 'Selle (x² − y²)', func: saddle, color: '#ef4444' }
	];

	const C_MIN = -2;
	const C_MAX = 20;

	// How much larger than the visible plotting window we probe to distinguish
	// "genuinely unbounded" from "bounded, but bigger than the tiny viewport".
	const PROBE_SCALE = 10;

	let selectedKey = $state('paraboloid');
	let cLevel = $state(5);
	let touchesBoundaryOnScreen = $state(false); // bound from ContourPlot — window-clipping only
	let playing = $state(false);

	const currentOption = $derived(funcOptions.find((o) => o.key === selectedKey) ?? funcOptions[0]);
	const currentFunc = $derived(currentOption.func);
	const domain = $derived(
		(currentFunc.domain ?? [
			[-3, 3],
			[-3, 3]
		]) as [[number, number], [number, number]]
	);

	// A much larger domain used only to test genuine unboundedness, never rendered.
	const probeDomain = $derived([
		scaleAxis(domain[0]),
		scaleAxis(domain[1])
	] as [[number, number], [number, number]]);
	function scaleAxis([lo, hi]: [number, number]): [number, number] {
		const center = (lo + hi) / 2;
		const half = ((hi - lo) / 2) * PROBE_SCALE;
		return [center - half, center + half];
	}

	// Does the sublevel set {x | f(x) <= c} touch the edge of a given domain?
	// Cheap perimeter-only sampling — no need to fill the whole grid.
	function edgeTouches(
		f: (x: number, y: number) => number,
		c: number,
		dom: [[number, number], [number, number]]
	): boolean {
		const [xMin, xMax] = dom[0];
		const [yMin, yMax] = dom[1];
		const steps = 150;
		for (let i = 0; i <= steps; i++) {
			const x = xMin + (i / steps) * (xMax - xMin);
			if (f(x, yMin) <= c || f(x, yMax) <= c) return true;
		}
		for (let j = 0; j <= steps; j++) {
			const y = yMin + (j / steps) * (yMax - yMin);
			if (f(xMin, y) <= c || f(xMax, y) <= c) return true;
		}
		return false;
	}

	const AREA_SAMPLES = 50;
	const cVals = Array.from(
		{ length: AREA_SAMPLES },
		(_, k) => C_MIN + (k / (AREA_SAMPLES - 1)) * (C_MAX - C_MIN)
	);

	// First c at which the set exceeds the small VISIBLE window — purely a
	// viewport artifact, not a coercivity signal.
	const windowExceedC = $derived.by(() => {
		for (const c of cVals) {
			if (edgeTouches(currentFunc.f, c, domain)) return c;
		}
		return null;
	});

	// First c at which the set touches the edge of the much larger PROBE domain —
	// this is the real signal of unboundedness (non-coercivity).
	const trueEscapeC = $derived.by(() => {
		for (const c of cVals) {
			if (edgeTouches(currentFunc.f, c, probeDomain)) return c;
		}
		return null;
	});

	// If it escapes even at the very first (most restrictive) c tested, the
	// function is unbounded for every level — not just "past some threshold".
	const isAlwaysUnbounded = $derived(trueEscapeC !== null && trueEscapeC <= C_MIN + 1e-9);
	const isCoercive = $derived(trueEscapeC === null);

	// ── Area of the sublevel set within the VISIBLE domain (for the mini chart) ──
	const AREA_GRID = 70;
	const areaCurve = $derived.by(() => {
		const [xMin, xMax] = domain[0];
		const [yMin, yMax] = domain[1];
		const domainArea = (xMax - xMin) * (yMax - yMin);

		const grid: number[] = [];
		for (let j = 0; j < AREA_GRID; j++) {
			const y = yMin + (j / (AREA_GRID - 1)) * (yMax - yMin);
			for (let i = 0; i < AREA_GRID; i++) {
				const x = xMin + (i / (AREA_GRID - 1)) * (xMax - xMin);
				grid.push(currentFunc.f(x, y));
			}
		}

		return cVals.map((c) => {
			let count = 0;
			for (const v of grid) if (v <= c) count++;
			return { c, area: (count / grid.length) * domainArea, domainArea };
		});
	});

	const currentArea = $derived.by(() => {
		const curve = areaCurve;
		if (curve.length < 2) return 0;
		if (cLevel <= curve[0].c) return curve[0].area;
		if (cLevel >= curve[curve.length - 1].c) return curve[curve.length - 1].area;
		for (let i = 0; i < curve.length - 1; i++) {
			if (cLevel >= curve[i].c && cLevel <= curve[i + 1].c) {
				const t = (cLevel - curve[i].c) / (curve[i + 1].c - curve[i].c);
				return curve[i].area + t * (curve[i + 1].area - curve[i].area);
			}
		}
		return curve[curve.length - 1].area;
	});

	// ── Mini chart SVG layout ──
	const chartW = 400;
	const chartH = 110;
	const chartPad = { l: 40, r: 12, t: 10, b: 24 };

	function chartX(c: number): number {
		return chartPad.l + ((c - C_MIN) / (C_MAX - C_MIN)) * (chartW - chartPad.l - chartPad.r);
	}
	function chartY(area: number, domainArea: number): number {
		return chartPad.t + (1 - area / domainArea) * (chartH - chartPad.t - chartPad.b);
	}

	const areaPath = $derived.by(() => {
		const curve = areaCurve;
		if (!curve.length) return '';
		return curve
			.map(
				(s, i) =>
					`${i === 0 ? 'M' : 'L'}${chartX(s.c).toFixed(1)},${chartY(s.area, s.domainArea).toFixed(1)}`
			)
			.join(' ');
	});

	const domainArea = $derived((domain[0][1] - domain[0][0]) * (domain[1][1] - domain[1][0]));

	// ── Autoplay: sweep c across its range ──
	let rafId: number | null = null;
	let direction = 1;

	function playTick() {
		const speed = 0.09;
		let next = cLevel + direction * speed;
		if (next >= C_MAX) {
			next = C_MAX;
			direction = -1;
		} else if (next <= C_MIN) {
			next = C_MIN;
			direction = 1;
		}
		cLevel = next;
		rafId = requestAnimationFrame(playTick);
	}

	function togglePlay() {
		playing = !playing;
		if (playing) {
			rafId = requestAnimationFrame(playTick);
		} else if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function stopPlay() {
		if (rafId) cancelAnimationFrame(rafId);
		rafId = null;
		playing = false;
	}

	function selectFunc(key: string) {
		stopPlay();
		selectedKey = key;
	}

	onDestroy(stopPlay);
</script>

<div class="demo-wrap">
	<ContourPlot
		f={currentFunc.f}
		{domain}
		width={400}
		height={350}
		gridSize={90}
		numLevels={12}
		sublevel={cLevel}
		bind:sublevelTouchesBoundary={touchesBoundaryOnScreen}
	/>

	<div class="options-row">
		{#each funcOptions as opt}
			<button
				class:active={selectedKey === opt.key}
				style:--opt-color={opt.color}
				onclick={() => selectFunc(opt.key)}
			>
				<span class="dot" style:background={opt.color}></span>
				{opt.label}
			</button>
		{/each}
	</div>

	<div class="controls">
		<SliderGrid>
			<div class="group">
				<div class="group-title">Sous-niveau</div>
				<Slider bind:value={cLevel} min={C_MIN} max={C_MAX} step={0.1} label="c" />
			</div>
		</SliderGrid>

		<button class="play-btn" class:playing onclick={togglePlay}>
			{playing ? '⏸ Pause' : '▶ Balayer c automatiquement'}
		</button>
	</div>

	<div class="info-panel">
		<span class={`badge ${isCoercive ? 'coercive' : 'non-coercive'}`}>
			{isCoercive ? '✓ Borné (coercive)' : '✗ Non borné (non coercive)'}
		</span>

		{#if touchesBoundaryOnScreen && isCoercive}
			<span class="window-note">
				⚠ Le sous-niveau sort de la fenêtre d'affichage — mais reste bel et bien borné, ce n'est
				qu'un effet de zoom.
			</span>
		{/if}

		<p class="description">
			L'ensemble sous-niveau <code>{`{x | f(x) ≤ ${cLevel.toFixed(1)}}`}</code> — en vert sur le
			graphique — {#if isCoercive}
				reste <strong>toujours borné</strong>, quel que soit c.
				{#if windowExceedC !== null}
					À partir de c ≈ {windowExceedC.toFixed(1)}, il dépasse simplement la petite fenêtre
					affichée à l'écran — cela ne remet <strong>pas</strong> en cause la coercivité de la fonction.
				{/if}
			{:else if isAlwaysUnbounded}
				<strong>n'est jamais borné</strong>, quel que soit c : il s'échappe vers l'infini dans au
				moins une direction dès la valeur minimale testée. C'est le signe direct d'une absence de
				coercivité.
			{:else}
				devient <strong>non borné</strong> à partir de c ≈ {trueEscapeC?.toFixed(1)}.
			{/if}
		</p>

		<div class="area-chart" class:danger={!isCoercive && isAlwaysUnbounded}>
			<div class="area-chart-title">Aire du sous-niveau (fenêtre visible) en fonction de c</div>

			{#if isAlwaysUnbounded}
				<div class="always-unbounded-banner">
					Cette fonction s'échappe vers l'infini pour <strong>toute</strong> valeur de c — il n'y a pas
					de seuil à identifier.
				</div>
			{/if}

			<svg
				viewBox={`0 0 ${chartW} ${chartH}`}
				width="100%"
				height={chartH}
				role="img"
				aria-label="Aire du sous-niveau en fonction de c"
			>
				<line
					x1={chartPad.l}
					y1={chartH - chartPad.b}
					x2={chartW - chartPad.r}
					y2={chartH - chartPad.b}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				<line
					x1={chartPad.l}
					y1={chartPad.t}
					x2={chartPad.l}
					y2={chartH - chartPad.b}
					stroke="var(--color-border)"
					stroke-width="1"
				/>

				<!-- amber marker: exceeds the small visible window (informational only) -->
				{#if windowExceedC !== null}
					<line
						x1={chartX(windowExceedC)}
						y1={chartPad.t}
						x2={chartX(windowExceedC)}
						y2={chartH - chartPad.b}
						stroke="#f59e0b"
						stroke-width="1.5"
						stroke-dasharray="3 3"
						opacity="0.6"
					/>
					<text
						x={chartX(windowExceedC)}
						y={chartPad.t - 1}
						text-anchor="middle"
						font-size="8"
						fill="#f59e0b"
					>
						fenêtre
					</text>
				{/if}

				<!-- red marker: genuine escape to infinity (only when it's a threshold, not "always") -->
				{#if trueEscapeC !== null && !isAlwaysUnbounded}
					<line
						x1={chartX(trueEscapeC)}
						y1={chartPad.t}
						x2={chartX(trueEscapeC)}
						y2={chartH - chartPad.b}
						stroke="#ef4444"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						opacity="0.8"
					/>
					<text
						x={chartX(trueEscapeC)}
						y={chartPad.t - 1}
						text-anchor="middle"
						font-size="8"
						fill="#ef4444"
					>
						fuite
					</text>
				{/if}

				<path d={areaPath} fill="none" stroke={currentOption.color} stroke-width="2" />

				<line
					x1={chartX(cLevel)}
					y1={chartPad.t}
					x2={chartX(cLevel)}
					y2={chartH - chartPad.b}
					stroke="var(--color-text-muted)"
					stroke-width="1"
					opacity="0.4"
				/>
				<circle
					cx={chartX(cLevel)}
					cy={chartY(currentArea, domainArea)}
					r="4"
					fill={currentOption.color}
					stroke="#fff"
					stroke-width="1.5"
				/>

				<text
					x={chartPad.l - 4}
					y={chartH - chartPad.b + 12}
					text-anchor="start"
					font-size="8"
					fill="var(--color-text-muted)"
				>
					c={C_MIN}
				</text>
				<text
					x={chartW - chartPad.r}
					y={chartH - chartPad.b + 12}
					text-anchor="end"
					font-size="8"
					fill="var(--color-text-muted)"
				>
					c={C_MAX}
				</text>
			</svg>

			<p class="area-caption">Aire visible actuelle ≈ {currentArea.toFixed(2)}</p>
		</div>
	</div>
</div>

<style>
	.demo-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
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

	.controls {
		font-size: 0.875rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: 400px;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.group-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.play-btn {
		padding: 0.3rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text, inherit);
	}
	.play-btn.playing {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.info-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
		width: 100%;
		max-width: 400px;
	}
	.badge {
		font-weight: 700;
		padding: 0.3rem 1rem;
		border-radius: var(--radius-sm, 4px);
		font-size: 0.9rem;
	}
	.coercive {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}
	.non-coercive {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.window-note {
		font-size: 0.72rem;
		color: #f59e0b;
		text-align: center;
		font-weight: 600;
	}

	.description {
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		text-align: center;
		margin: 0;
	}
	code {
		background: rgba(0, 0, 0, 0.06);
		padding: 0.1em 0.3em;
		border-radius: 3px;
		font-size: 0.85rem;
	}

	.area-chart {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		border-top: 1px dashed var(--color-border);
		padding-top: 0.5rem;
	}
	.area-chart.danger {
		background: rgba(239, 68, 68, 0.05);
		border-radius: var(--radius-sm, 4px);
	}
	.area-chart-title {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		text-align: center;
	}
	.always-unbounded-banner {
		font-size: 0.75rem;
		color: #ef4444;
		text-align: center;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
	}
	.area-caption {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-align: center;
	}
</style>
