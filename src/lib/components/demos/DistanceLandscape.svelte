<script lang="ts">
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		euclidean,
		manhattan,
		minkowski,
		chebyshev,
		mahalanobis,
		minkowskiUnitBall,
		mahalanobisUnitBall,
		generateBlobs
	} from '$lib/math/clustering.js';

	// Frames « Choix d'une distance » and « Distances — variables
	// quantitatives » of marine/Cours/CM/coursClassif-5-Clustering.tex.

	// Hand-rolled SVG: no existing chart component supports draggable points
	// plus a unit-ball overlay; swap for a real component if one gets built.
	const W = 440;
	const H = 380;
	const PAD = 4; // same convention as ScatterPlot.svelte (pad = 4 px)
	// Fixed domain (no auto-rescale while dragging). domainY is [−6, 8] (14
	// units) rather than [−5.5, 6.5] so that pixels-per-unit match in both
	// axes (27 px/unit): the Euclidean unit ball stays round instead of being
	// drawn as an ellipse.
	const X_MIN = -7;
	const X_MAX = 9;
	const Y_MIN = -6;
	const Y_MAX = 8;

	type NormKey = 'euclidienne' | 'manhattan' | 'minkowski' | 'chebyshev' | 'mahalanobis';

	const background = generateBlobs(2, 5, 11);
	const backgroundProjected = background.map((p): [number, number] => [
		PAD + ((p[0] - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD),
		PAD + ((Y_MAX - p[1]) / (Y_MAX - Y_MIN)) * (H - 2 * PAD)
	]);

	let norm = $state<NormKey>('euclidienne');
	let p = $state(2);
	let rho = $state(0);
	let x = $state([-1, 2]);
	let y = $state([2, -1]);
	let dragging = $state<'x' | 'y' | null>(null);

	function clampX(v: number): number {
		return Math.max(X_MIN, Math.min(X_MAX, v));
	}
	function clampY(v: number): number {
		return Math.max(Y_MIN, Math.min(Y_MAX, v));
	}

	// Same projection as ScatterPlot.svelte (pad = 4 px); the unit ball is in
	// data units, not pixels.
	function projectX(v: number): number {
		return PAD + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
	}
	function projectY(v: number): number {
		return PAD + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);
	}

	// Screen → data coordinates via getScreenCTM().inverse(): robust to the
	// CSS scaling of the SVG (width: 100%), unlike offsetX/offsetY.
	function toData(event: PointerEvent): [number, number] | null {
		const svg = (event.currentTarget as SVGCircleElement).ownerSVGElement;
		const ctm = svg?.getScreenCTM();
		if (!svg || !ctm) return null;
		const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
		const dx = X_MIN + ((pt.x - PAD) / (W - 2 * PAD)) * (X_MAX - X_MIN);
		const dy = Y_MAX - ((pt.y - PAD) / (H - 2 * PAD)) * (Y_MAX - Y_MIN);
		return [dx, dy];
	}

	function startDrag(which: 'x' | 'y') {
		return (event: PointerEvent) => {
			(event.currentTarget as SVGCircleElement).setPointerCapture(event.pointerId);
			dragging = which;
			event.preventDefault();
		};
	}

	function moveDrag(which: 'x' | 'y') {
		return (event: PointerEvent) => {
			if (dragging !== which) return;
			const data = toData(event);
			if (!data) return;
			const clamped: [number, number] = [clampX(data[0]), clampY(data[1])];
			if (which === 'x') x = clamped;
			else y = clamped;
		};
	}

	function endDrag() {
		return (event: PointerEvent) => {
			const el = event.currentTarget as SVGCircleElement;
			if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
			dragging = null;
		};
	}

	const KEY_DELTAS: Record<string, [number, number]> = {
		ArrowLeft: [-0.25, 0],
		ArrowRight: [0.25, 0],
		ArrowUp: [0, 0.25],
		ArrowDown: [0, -0.25]
	};

	function moveKey(which: 'x' | 'y') {
		return (event: KeyboardEvent) => {
			// Keyboard affordance is coarser than pointer: fixed 0.25-unit
			// steps, no free placement.
			const delta = KEY_DELTAS[event.key];
			if (!delta) return;
			event.preventDefault();
			const current = which === 'x' ? x : y;
			const next: [number, number] = [
				clampX(current[0] + delta[0]),
				clampY(current[1] + delta[1])
			];
			if (which === 'x') x = next;
			else y = next;
		};
	}

	const distance = $derived.by((): number => {
		switch (norm) {
			case 'euclidienne':
				return euclidean(x, y);
			case 'manhattan':
				return manhattan(x, y);
			case 'minkowski':
				return minkowski(x, y, p);
			case 'chebyshev':
				return chebyshev(x, y);
			case 'mahalanobis':
				return mahalanobis(x, y, [[1, rho], [rho, 1]]);
		}
	});

	const formula = $derived.by((): string => {
		switch (norm) {
			case 'euclidienne':
				return 'd(x,y) = √(Σᵢ(xᵢ−yᵢ)²)';
			case 'manhattan':
				return 'd(x,y) = Σᵢ|xᵢ−yᵢ|';
			case 'minkowski':
				return 'd(x,y) = (Σᵢ|xᵢ−yᵢ|ᵖ)^{1/p}';
			case 'chebyshev':
				return 'd(x,y) = maxᵢ|xᵢ−yᵢ|';
			case 'mahalanobis':
				return 'd(x,y) = √((x−y)ᵀΣ⁻¹(x−y))';
		}
	});

	const unitBall = $derived.by((): { r: number; theta: number }[] => {
		switch (norm) {
			case 'euclidienne':
				return minkowskiUnitBall(2);
			case 'manhattan':
				return minkowskiUnitBall(1);
			case 'minkowski':
				return minkowskiUnitBall(p);
			case 'chebyshev':
				return minkowskiUnitBall(Infinity);
			case 'mahalanobis':
				return mahalanobisUnitBall([[1, rho], [rho, 1]]);
		}
	});

	const ballPath = $derived.by(() => {
		const parts = unitBall.map((b, i) => {
			const cx = x[0] + b.r * Math.cos(b.theta);
			const cy = x[1] + b.r * Math.sin(b.theta);
			return `${i === 0 ? 'M' : 'L'}${projectX(cx).toFixed(2)} ${projectY(cy).toFixed(2)}`;
		});
		return `${parts.join(' ')} Z`;
	});
</script>

<div class="landscape">
	<div class="controls">
		<div class="control-row">
			<span class="control-label">Distance</span>
			<div class="radio-group">
				<RadioButton value={'euclidienne'} label="euclidienne" bind:groupValue={norm} />
				<RadioButton value={'manhattan'} label="manhattan" bind:groupValue={norm} />
				<RadioButton value={'minkowski'} label="minkowski (p)" bind:groupValue={norm} />
				<RadioButton value={'chebyshev'} label="chebyshev" bind:groupValue={norm} />
				<RadioButton value={'mahalanobis'} label="mahalanobis (ρ)" bind:groupValue={norm} />
			</div>
		</div>
		{#if norm === 'minkowski'}
			<Slider min={1} max={10} step={0.5} bind:value={p} label="exposant p" />
		{/if}
		{#if norm === 'mahalanobis'}
			<Slider min={-0.9} max={0.9} step={0.1} bind:value={rho} label="corrélation ρ" />
		{/if}
	</div>

	<!-- Hand-rolled SVG fallback (draggable points + unit ball); see comment above. -->
	<svg
		viewBox="0 0 440 380"
		class="plot"
		role="img"
		aria-label="Paysage des distances : les points x et y, le segment xy et la boule unité de la distance choisie, centrée en x"
	>
		{#each backgroundProjected as bp (bp)}
			<circle cx={bp[0]} cy={bp[1]} r="3" fill="var(--color-text-muted)" opacity="0.4" />
		{/each}

		<path
			d={ballPath}
			fill="var(--color-agent)"
			fill-opacity="0.06"
			stroke="var(--color-agent)"
			stroke-width="1.5"
			stroke-dasharray="5 4"
			pointer-events="none"
		/>

		<line
			x1={projectX(x[0])}
			y1={projectY(x[1])}
			x2={projectX(y[0])}
			y2={projectY(y[1])}
			stroke="var(--color-text)"
			stroke-width="1.5"
			opacity="0.5"
			pointer-events="none"
		/>

		<circle
			cx={projectX(x[0])}
			cy={projectY(x[1])}
			r="7"
			class="handle"
			fill="var(--color-belief)"
			stroke="var(--color-bg)"
			stroke-width="2"
			tabindex="0"
			role="button"
			aria-label="Point x — glissez pour le déplacer, ou utilisez les flèches (pas de 0,25)"
			onpointerdown={startDrag('x')}
			onpointermove={moveDrag('x')}
			onpointerup={endDrag()}
			onpointercancel={endDrag()}
			onkeydown={moveKey('x')}
		/>
		<text
			x={projectX(x[0]) + 11}
			y={projectY(x[1]) - 8}
			class="pt-label"
			fill="var(--color-belief)"
			pointer-events="none"
		>x</text>

		<circle
			cx={projectX(y[0])}
			cy={projectY(y[1])}
			r="7"
			class="handle"
			fill="var(--color-surprise)"
			stroke="var(--color-bg)"
			stroke-width="2"
			tabindex="0"
			role="button"
			aria-label="Point y — glissez pour le déplacer, ou utilisez les flèches (pas de 0,25)"
			onpointerdown={startDrag('y')}
			onpointermove={moveDrag('y')}
			onpointerup={endDrag()}
			onpointercancel={endDrag()}
			onkeydown={moveKey('y')}
		/>
		<text
			x={projectX(y[0]) + 11}
			y={projectY(y[1]) - 8}
			class="pt-label"
			fill="var(--color-surprise)"
			pointer-events="none"
		>y</text>
	</svg>
	<p class="plot-hint">
		Glissez x et y (au clavier : Tab pour cibler un point, flèches pour le déplacer par pas de
		0,25).
	</p>

	<Metrics align="left">
		<div class="cell">
			<span class="label">d(x, y)</span>
			<span class="value">{distance.toFixed(2)}</span>
		</div>
		<div class="cell">
			<span class="label">Formule</span>
			<span class="value formula">{formula}</span>
		</div>
	</Metrics>

	<p class="caption">
		Glissez x et y : la boule unité (pointillés) change de forme avec la norme, et la distance
		d(x, y) se lit sur l'indicateur.
	</p>
</div>

<style>
	.landscape {
		display: grid;
		gap: 1rem;
	}

	.controls {
		display: grid;
		gap: 0.75rem;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.control-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		min-width: 4.5rem;
	}

	.radio-group {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.plot {
		display: block;
		width: 100%;
		height: auto;
		user-select: none;
		touch-action: none;
	}

	.handle {
		cursor: grab;
	}

	.handle:active {
		cursor: grabbing;
	}

	.handle:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: 2px;
	}

	.pt-label {
		font-size: 15px;
		font-style: italic;
		font-weight: 600;
	}

	.plot-hint,
	.caption {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.plot-hint {
		margin-top: -0.5rem;
		text-align: center;
	}

	.caption {
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-epistemic);
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
	}

	/* The formula is a long mono string: shrink it so it fits its cell. */
	.formula {
		font-size: 0.8125rem;
		font-weight: 500;
	}
</style>
