<script lang="ts">
	/**
	 * Explore the five surrogate losses from calibration.ts against the
	 * non-optimizable 0-1 loss: pick a loss, drag the margin t, see phi(t),
	 * its local slope drawn as a tangent segment, and the numeric gradient —
	 * always next to the flat/discontinuous 0-1 reference curve.
	 *
	 * Reuses LossFunctionExplorer.svelte's patterns directly: same
	 * DensityChart curves-array call shape, same button-row loss selector
	 * with active-state dot styling, same SliderGrid wrapping. This is a
	 * calibration-focused view built on top of that pattern, not a rewrite.
	 */

	import Figure from '$lib/components/charts/Figure.svelte';
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import { getLoss, checkCalibration, type LossId } from '$lib/math/calibration';

	// Only the five losses this step asks for — squaredMargin/shiftedSquared
	// are calibration.ts's non-calibrated counter-examples, used elsewhere
	// (CalibrationCriterionDemo), not here.
	const SELECTABLE_IDS: LossId[] = ['zeroOne', 'logistic', 'hinge', 'exponential', 'brier'];
	const COLORS: Record<LossId, string> = {
		zeroOne: 'var(--color-text-muted)',
		logistic: 'var(--color-belief)',
		hinge: 'var(--color-surprise)',
		exponential: 'var(--color-agent, #8b5cf6)',
		brier: 'var(--color-positive, #4caf50)',
		squaredMargin: 'var(--color-text-muted)',
		shiftedSquared: 'var(--color-text-muted)'
	};

	const options = SELECTABLE_IDS.map((id) => ({ id, loss: getLoss(id), color: COLORS[id] }));

	let selectedId = $state<LossId>('logistic');
	let t = $state(0.5);

	const selected = $derived(getLoss(selectedId));
	const zeroOneLoss = $derived(getLoss('zeroOne'));
	const selectedColor = $derived(COLORS[selectedId]);

	const xDomain: [number, number] = [-3, 3];
	const N = 200;

	function grid(): number[] {
		return Array.from(
			{ length: N },
			(_, i) => xDomain[0] + (xDomain[1] - xDomain[0]) * (i / (N - 1))
		);
	}

	const selectedValues = $derived(grid().map((z) => selected.phi(z)));
	const zeroOneValues = $derived(grid().map((z) => zeroOneLoss.phi(z)));

	// Auto-scaled y-axis, following LossFunctionExplorer's convention: true
	// max over the domain (for the currently selected loss — exponential and
	// brier both grow large at t=-3), 10% headroom, floored at 1 so the flat
	// 0-1 curve never looks like a razor-thin sliver.
	const yMax = $derived.by(() => {
		const finite = selectedValues.filter((v) => Number.isFinite(v));
		const maxV = finite.length ? Math.max(...finite) : 1;
		return Math.max(1, maxV * 1.1);
	});

	const selectedPoints = $derived(
		grid().map((z, i): [number, number] => [z, Math.min(selectedValues[i], yMax)])
	);

	// φ(t) = 1{t<0} jumps at t = 0, but the grid never lands exactly on 0:
	// with plain linear interpolation the drop would span one grid step
	// (≈ 3 px). Splice the two jump points (0, 1) and (0, 0) in so the curve
	// is flat at 1 up to t = 0, drops vertically right at t = 0 (two points
	// at the same x → a vertical SVG segment), and stays flat at 0 after —
	// exactly the definition, since φ(0) = 0.
	const zeroOnePoints = $derived.by((): [number, number][] => {
		const xs = grid();
		const pts = xs.map((z, i): [number, number] => [z, zeroOneValues[i]]);
		const firstNonNegative = xs.findIndex((z) => z >= 0);
		const at = firstNonNegative === -1 ? pts.length : firstNonNegative;
		return [...pts.slice(0, at), [0, 1], [0, 0], ...pts.slice(at)];
	});

	// Tangent segment at the current t: phi(t) + dphi(t)*(z-t), over a short
	// fixed window — its own curve entry, same shape as the other two, no
	// dependency on DensityChart having any overlay mechanism.
	const phiAtT = $derived(selected.phi(t));
	const slopeAtT = $derived(selected.dphi(t));
	const TANGENT_HALF_WIDTH = 0.5;
	const tangentPoints = $derived(
		[
			[t - TANGENT_HALF_WIDTH, phiAtT - TANGENT_HALF_WIDTH * slopeAtT],
			[t + TANGENT_HALF_WIDTH, phiAtT + TANGENT_HALF_WIDTH * slopeAtT]
		].map(([z, v]): [number, number] => [z, Math.min(Math.max(v, 0), yMax)]) as [number, number][]
	);

	const curves = $derived([
		{ points: selectedPoints, stroke: selectedColor, fill: selectedColor, fillOpacity: 0.15 },
		{
			points: zeroOnePoints,
			stroke: 'var(--color-text-muted)',
			fill: 'var(--color-text-muted)',
			fillOpacity: 0.05,
			// step function: linear so the discontinuity at t = 0 stays a
			// vertical drop instead of a smoothed slope
			curve: 'linear' as const
		},
		{ points: tangentPoints, stroke: selectedColor, fill: 'none', fillOpacity: 0 }
	]);

	const legend = $derived([
		{ label: `${selected.label} (φ)`, color: selectedColor, kind: 'line' as const },
		{
			label: 'Perte 0-1 (non optimisable)',
			color: 'var(--color-text-muted)',
			kind: 'line' as const
		},
		{ label: 'Tangente en t', color: selectedColor, kind: 'line' as const }
	]);

	const calibration = $derived(checkCalibration(selected));
</script>

<div class="loss-explorer">
	<Figure type="chart">
		<DensityChart {curves} {xDomain} {yMax} height={220} nTicks={6} {legend} />
	</Figure>

	<div class="options-row">
		{#each options as opt (opt.id)}
			<button
				class:active={selectedId === opt.id}
				style:--opt-color={opt.color}
				onclick={() => (selectedId = opt.id)}
			>
				<span class="dot" style:background={opt.color}></span>
				{opt.loss.label}
			</button>
		{/each}
	</div>

	<SliderGrid>
		<div class="group">
			<div class="group-title">Marge</div>
			<Slider bind:value={t} min={-3} max={3} step={0.05} label="t = y·f(x)" />
		</div>
	</SliderGrid>

	<div class="readout" style:--opt-color={selectedColor}>
		<div class="readout-row">
			<span class="readout-label"><KatexInline formula="\varphi(t)" /></span>
			<span class="readout-value">{phiAtT.toFixed(3)}</span>
		</div>
		<div class="readout-row">
			<span class="readout-label"
				>Pente locale / gradient <KatexInline formula="\varphi'(t)" /></span
			>
			<span class="readout-value">{slopeAtT.toFixed(3)}</span>
		</div>
		<div class="readout-row">
			<span class="readout-label">Perte 0-1 en t (contraste)</span>
			<span class="readout-value"
				>{zeroOneLoss.phi(t).toFixed(0)} — pente {zeroOneLoss.dphi(t).toFixed(0)}, presque partout</span
			>
		</div>
		<div class="readout-row">
			<span class="readout-label"><KatexInline formula="\varphi'(0)" /> et calibration</span>
			<span
				class="readout-value"
				style:color={calibration.calibrated ? 'var(--color-belief)' : 'var(--color-surprise)'}
			>
				{calibration.differentiableAtZero
					? calibration.phiPrimeAtZero?.toFixed(3)
					: 'non différentiable'}
				— {calibration.calibrated ? 'calibrée' : 'non calibrée'}
			</span>
		</div>
	</div>

	<p class="note">
		La perte 0-1 est plate (gradient nul) presque partout et discontinue en t=0 — aucune direction
		de descente n'existe. Chaque perte de substitution offre au contraire une pente non nulle en
		tout point différentiable, ce qui la rend optimisable par descente de gradient. Le critère de
		calibration (Théorème 4.1) ne dépend que du signe de <KatexInline formula="\varphi'(0)" /> : déplacez
		t vers 0 pour voir cette pente précise.
	</p>
</div>

<style>
	.loss-explorer {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface, transparent);
	}

	.options-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
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
	button .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}
	button.active {
		background: var(--opt-color);
		color: white;
		border-color: var(--opt-color);
	}
	button.active .dot {
		background: white !important;
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

	.readout {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.6rem 0.75rem;
		background: color-mix(in srgb, var(--opt-color) 5%, transparent);
		font-size: 0.85rem;
	}
	.readout-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.readout-label {
		color: var(--color-text-muted);
	}
	.readout-value {
		font-family: var(--font-mono);
		font-weight: 600;
		text-align: right;
	}

	.note {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0;
	}
</style>
