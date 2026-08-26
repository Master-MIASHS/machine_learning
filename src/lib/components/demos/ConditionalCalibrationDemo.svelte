<script lang="ts">
	// Part VII — Calibration ponctuelle (theorie.typ "Calibration").
	// Plots C_phi(alpha, eta) over alpha for a fixed eta and loss, marking
	// both the true minimizer and the alpha the slider currently points at —
	// so the sign of the minimizer relative to eta-1/2 (the calibration
	// criterion) is directly visible rather than just computed.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';

	import {
		getLoss,
		conditionalPhiRiskCurve,
		conditionalPhiRisk,
		conditionalPhiRiskMinimizer,
		pointwiseCalibration,
		type LossId
	} from '$lib/math/calibration';

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
	let eta = $state(0.7);
	let alpha = $state(1);

	const selected = $derived(getLoss(selectedId));
	const selectedColor = $derived(COLORS[selectedId]);

	const ALPHA_MIN = -4;
	const ALPHA_MAX = 4;
	const alphaGrid = Array.from(
		{ length: 200 },
		(_, i) => ALPHA_MIN + (ALPHA_MAX - ALPHA_MIN) * (i / 199)
	);

	const riskCurve = $derived(conditionalPhiRiskCurve(eta, alphaGrid, selected));
	const curvePoints = $derived(alphaGrid.map((a, i): [number, number] => [a, riskCurve[i]]));

	const minimizer = $derived(
		conditionalPhiRiskMinimizer(eta, selected, { alphaMin: ALPHA_MIN, alphaMax: ALPHA_MAX })
	);
	const riskAtAlpha = $derived(conditionalPhiRisk(alpha, eta, selected));

	const calibrationCheck = $derived(pointwiseCalibration(eta, selected));

	const etaSign: -1 | 0 | 1 = $derived(eta > 0.5 ? 1 : eta < 0.5 ? -1 : 0);

	function signLabel(s: -1 | 0 | 1): string {
		return s === 1 ? '> 0' : s === -1 ? '< 0' : '= 0';
	}
</script>

<div class="explorer">
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

	<Figure type="chart">
		<CurveChart
			curves={[{ points: curvePoints, stroke: selectedColor, strokeWidth: 2 }]}
			xDomain={[ALPHA_MIN, ALPHA_MAX]}
			yAxis={true}
			vlines={[
				{ x: 0, stroke: 'var(--color-text-muted)', strokeDasharray: '2 2', label: 'α = 0' },
				{
					x: minimizer.alpha,
					stroke: 'var(--color-belief)',
					strokeDasharray: '4 4',
					label: 'α* (minimiseur)'
				},
				{ x: alpha, stroke: 'var(--color-text)', strokeDasharray: '2 4', label: 'α choisi' }
			]}
			curveDots={[
				{ x: minimizer.alpha, y: minimizer.risk, fill: 'var(--color-belief)' },
				{ x: alpha, y: riskAtAlpha, fill: 'var(--color-text)' }
			]}
			legend={[{ label: `C_φ(α, η=${eta.toFixed(2)})`, color: selectedColor }]}
		/>

		{#snippet caption()}
			Le minimiseur α* (pointillés bleus) est ce que la calibration ponctuelle contraint : son signe
			doit correspondre à celui de η − 1/2 pour tout η ≠ 1/2. Le point noir suit le curseur α
			ci-dessous, indépendamment du minimiseur — déplacez-le pour comparer un choix arbitraire au
			minimum réel.
		{/snippet}
	</Figure>

	<Slider min={0} max={1} step={0.01} bind:value={eta} label="η" />
	<Slider
		min={ALPHA_MIN}
		max={ALPHA_MAX}
		step={0.05}
		bind:value={alpha}
		label="α (candidat, indépendant du minimiseur)"
	/>

	<div class="readout" style:--opt-color={selectedColor}>
		<div class="readout-row">
			<span class="readout-label">η − 1/2</span>
			<span class="readout-value">{(eta - 0.5).toFixed(2)} ({signLabel(etaSign)})</span>
		</div>
		<div class="readout-row">
			<span class="readout-label">α* (minimiseur)</span>
			<span class="readout-value"
				>{minimizer.alpha.toFixed(3)} ({signLabel(
					calibrationCheck.expectedSign === 0
						? 0
						: minimizer.alpha > 0
							? 1
							: minimizer.alpha < 0
								? -1
								: 0
				)})</span
			>
		</div>
		<div class="readout-row">
			<span class="readout-label">Signe(α*) = Signe(η − 1/2) ?</span>
			<span
				class="readout-value"
				style:color={calibrationCheck.tracksEta === false
					? 'var(--color-surprise)'
					: 'var(--color-belief)'}
			>
				{calibrationCheck.tracksEta === null
					? 'η = 1/2 : non contraint'
					: calibrationCheck.tracksEta
						? 'Oui'
						: 'Non'}
			</span>
		</div>
	</div>
</div>

<style>
	.explorer {
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
</style>
