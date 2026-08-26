<script lang="ts">
	/**
	 * Théorème 4.1 (Bartlett, Jordan, McAuliffe 2006) made visual: a
	 * calibrated loss and a non-calibrated counterexample side by side,
	 * driven by one shared η. Each panel plots C_phi(alpha, eta) over
	 * alpha with its minimizer alpha*, and reports phi'(0) plus whether
	 * the minimizer's sign tracks eta - 1/2 (pointwise calibration).
	 *
	 * Reuses the sibling demos' patterns: the button-row loss selector and
	 * .readout block from CalibratedLossExplorer, the C_phi curve with
	 * vlines/curveDots from ConditionalCalibrationDemo. All math comes
	 * from calibration.ts — nothing is computed inline here.
	 */

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import {
		getLoss,
		checkCalibration,
		pointwiseCalibration,
		conditionalPhiRiskCurve,
		conditionalPhiRiskMinimizer,
		type LossId,
		type PointwiseCalibration
	} from '$lib/math/calibration';

	const CALIBRATED_IDS: LossId[] = ['logistic', 'hinge', 'exponential', 'brier'];
	const NON_CALIBRATED_IDS: LossId[] = ['squaredMargin', 'shiftedSquared'];

	const COLORS: Record<LossId, string> = {
		zeroOne: 'var(--color-text-muted)',
		logistic: 'var(--color-belief)',
		hinge: 'var(--color-surprise)',
		exponential: 'var(--color-agent, #8b5cf6)',
		brier: 'var(--color-positive, #4caf50)',
		squaredMargin: 'var(--color-neutral, #fbbf24)',
		shiftedSquared: 'var(--color-epistemic, #a78bfa)'
	};

	const calibratedOptions = CALIBRATED_IDS.map((id) => ({
		id,
		loss: getLoss(id),
		color: COLORS[id]
	}));
	const nonCalibratedOptions = NON_CALIBRATED_IDS.map((id) => ({
		id,
		loss: getLoss(id),
		color: COLORS[id]
	}));

	let eta = $state(0.7);
	let calibratedId = $state<LossId>('logistic');
	let nonCalibratedId = $state<LossId>('squaredMargin');

	const ALPHA_MIN = -4;
	const ALPHA_MAX = 4;
	const alphaGrid = Array.from(
		{ length: 200 },
		(_, i) => ALPHA_MIN + (ALPHA_MAX - ALPHA_MIN) * (i / 199)
	);
	const minimizerOpts = { alphaMin: ALPHA_MIN, alphaMax: ALPHA_MAX };

	// the minimizer is resolved to ~1e-8 by the ternary refinement, so a
	// minimizer this close to 0 is numerically unsigned (raw sign = noise)
	const SIGN_TOLERANCE = 1e-6;

	const calibrated = $derived(getLoss(calibratedId));
	const nonCalibrated = $derived(getLoss(nonCalibratedId));
	const calibratedColor = $derived(COLORS[calibratedId]);
	const nonCalibratedColor = $derived(COLORS[nonCalibratedId]);

	const calibratedRisk = $derived(conditionalPhiRiskCurve(eta, alphaGrid, calibrated));
	const nonCalibratedRisk = $derived(conditionalPhiRiskCurve(eta, alphaGrid, nonCalibrated));
	const calibratedPoints = $derived(
		alphaGrid.map((a, i): [number, number] => [a, calibratedRisk[i]])
	);
	const nonCalibratedPoints = $derived(
		alphaGrid.map((a, i): [number, number] => [a, nonCalibratedRisk[i]])
	);

	const calibratedMin = $derived(conditionalPhiRiskMinimizer(eta, calibrated, minimizerOpts));
	const nonCalibratedMin = $derived(conditionalPhiRiskMinimizer(eta, nonCalibrated, minimizerOpts));

	const calibratedCheck = $derived(checkCalibration(calibrated));
	const nonCalibratedCheck = $derived(checkCalibration(nonCalibrated));

	const calibratedPointwise = $derived(pointwiseCalibration(eta, calibrated));
	const nonCalibratedPointwise = $derived(pointwiseCalibration(eta, nonCalibrated));

	const etaSign: -1 | 0 | 1 = $derived(eta > 0.5 ? 1 : eta < 0.5 ? -1 : 0);

	function alphaSign(alpha: number): -1 | 0 | 1 {
		return alpha > SIGN_TOLERANCE ? 1 : alpha < -SIGN_TOLERANCE ? -1 : 0;
	}

	function signLabel(s: -1 | 0 | 1): string {
		return s === 1 ? '> 0' : s === -1 ? '< 0' : '= 0';
	}

	function tracksLabel(p: PointwiseCalibration): string {
		return p.tracksEta === null ? 'η = 1/2 : non contraint' : p.tracksEta ? 'Oui' : 'Non';
	}

	function tracksColor(p: PointwiseCalibration): string {
		return p.tracksEta === false ? 'var(--color-surprise)' : 'var(--color-belief)';
	}
</script>

<div class="criterion-demo">
	<Slider min={0} max={1} step={0.01} bind:value={eta} label="η = P(Y=1|X=x)" />

	<div class="panels">
		<section class="panel" aria-label="Perte calibrée">
			<div class="panel-title">
				<span class="dot" style:background={calibratedColor}></span>
				Perte calibrée
			</div>

			<div class="options-row">
				{#each calibratedOptions as opt (opt.id)}
					<button
						class:active={calibratedId === opt.id}
						style:--opt-color={opt.color}
						onclick={() => (calibratedId = opt.id)}
					>
						<span class="dot" style:background={opt.color}></span>
						{opt.loss.label}
					</button>
				{/each}
			</div>

			<Figure type="chart">
				<CurveChart
					curves={[{ points: calibratedPoints, stroke: calibratedColor, strokeWidth: 2 }]}
					xDomain={[ALPHA_MIN, ALPHA_MAX]}
					yAxis={true}
					vlines={[
						{
							x: 0,
							stroke: 'var(--color-text-muted)',
							strokeDasharray: '2 2',
							label: 'α = 0'
						},
						{
							x: calibratedMin.alpha,
							stroke: calibratedColor,
							strokeDasharray: '4 4',
							label: 'α*'
						}
					]}
					curveDots={[{ x: calibratedMin.alpha, y: calibratedMin.risk, fill: calibratedColor }]}
					legend={[{ label: `C_φ(α, η=${eta.toFixed(2)})`, color: calibratedColor }]}
				/>
				{#snippet caption()}
					<KatexInline formula={String.raw`C_\varphi(\alpha, \eta)`} /> et son minimiseur <KatexInline
						formula={String.raw`\alpha^\star`}
					/> : le signe d'<KatexInline formula={String.raw`\alpha^\star`} /> suit celui de <KatexInline
						formula={String.raw`\eta - 1/2`}
					/>. La courbe tracée est le risque conditionnel <KatexInline
						formula={String.raw`C_\varphi(\alpha, \eta) = \eta\,\varphi(\alpha) + (1-\eta)\,\varphi(-\alpha)`}
					/>, non la perte <KatexInline formula={String.raw`\varphi`} /> elle-même.
				{/snippet}
			</Figure>

			<div class="readout" style:--opt-color={calibratedColor}>
				<div class="readout-row">
					<span class="readout-label"><KatexInline formula="\varphi'(0)" /> et calibration</span>
					<span
						class="readout-value"
						style:color={calibratedCheck.calibrated
							? 'var(--color-belief)'
							: 'var(--color-surprise)'}
					>
						{calibratedCheck.phiPrimeAtZero !== null
							? calibratedCheck.phiPrimeAtZero.toFixed(2)
							: 'non différentiable'}
						— {calibratedCheck.calibrated ? 'calibrée' : 'non calibrée'}
					</span>
				</div>
				<div class="readout-row">
					<span class="readout-label"
						><KatexInline formula={String.raw`\alpha^\star`} /> (minimiseur)</span
					>
					<span class="readout-value"
						>{calibratedMin.alpha.toFixed(3)} ({signLabel(alphaSign(calibratedMin.alpha))})</span
					>
				</div>
				<div class="readout-row">
					<span class="readout-label"><KatexInline formula={String.raw`\eta - 1/2`} /></span>
					<span class="readout-value">{(eta - 0.5).toFixed(2)} ({signLabel(etaSign)})</span>
				</div>
				<div class="readout-row">
					<span class="readout-label"
						><KatexInline
							formula={String.raw`\text{Signe}(\alpha^\star) = \text{Signe}(\eta - 1/2)`}
						/> ?</span
					>
					<span class="readout-value" style:color={tracksColor(calibratedPointwise)}
						>{tracksLabel(calibratedPointwise)}</span
					>
				</div>
			</div>
		</section>

		<section class="panel" aria-label="Perte non calibrée">
			<div class="panel-title">
				<span class="dot" style:background={nonCalibratedColor}></span>
				Perte non calibrée
			</div>

			<div class="options-row">
				{#each nonCalibratedOptions as opt (opt.id)}
					<button
						class:active={nonCalibratedId === opt.id}
						style:--opt-color={opt.color}
						onclick={() => (nonCalibratedId = opt.id)}
					>
						<span class="dot" style:background={opt.color}></span>
						{opt.loss.label}
					</button>
				{/each}
			</div>

			<Figure type="chart">
				<CurveChart
					curves={[{ points: nonCalibratedPoints, stroke: nonCalibratedColor, strokeWidth: 2 }]}
					xDomain={[ALPHA_MIN, ALPHA_MAX]}
					yAxis={true}
					vlines={[
						{
							x: 0,
							stroke: 'var(--color-text-muted)',
							strokeDasharray: '2 2',
							label: 'α = 0'
						},
						{
							x: nonCalibratedMin.alpha,
							stroke: nonCalibratedColor,
							strokeDasharray: '4 4',
							label: 'α*'
						}
					]}
					curveDots={[
						{ x: nonCalibratedMin.alpha, y: nonCalibratedMin.risk, fill: nonCalibratedColor }
					]}
					legend={[{ label: `C_φ(α, η=${eta.toFixed(2)})`, color: nonCalibratedColor }]}
				/>
				{#snippet caption()}
					<KatexInline formula={String.raw`C_\varphi(\alpha, \eta)`} /> et son minimiseur <KatexInline
						formula={String.raw`\alpha^\star`}
					/> : le signe d'<KatexInline formula={String.raw`\alpha^\star`} /> ne suit pas celui de <KatexInline
						formula={String.raw`\eta - 1/2`}
					/>. La courbe tracée est le risque conditionnel <KatexInline
						formula={String.raw`C_\varphi(\alpha, \eta) = \eta\,\varphi(\alpha) + (1-\eta)\,\varphi(-\alpha)`}
					/>, non la perte <KatexInline formula={String.raw`\varphi`} /> elle-même.
				{/snippet}
			</Figure>

			<div class="readout" style:--opt-color={nonCalibratedColor}>
				<div class="readout-row">
					<span class="readout-label"><KatexInline formula="\varphi'(0)" /> et calibration</span>
					<span
						class="readout-value"
						style:color={nonCalibratedCheck.calibrated
							? 'var(--color-belief)'
							: 'var(--color-surprise)'}
					>
						{nonCalibratedCheck.phiPrimeAtZero !== null
							? nonCalibratedCheck.phiPrimeAtZero.toFixed(2)
							: 'non différentiable'}
						— {nonCalibratedCheck.calibrated ? 'calibrée' : 'non calibrée'}
					</span>
				</div>
				<div class="readout-row">
					<span class="readout-label"
						><KatexInline formula={String.raw`\alpha^\star`} /> (minimiseur)</span
					>
					<span class="readout-value"
						>{nonCalibratedMin.alpha.toFixed(3)} ({signLabel(
							alphaSign(nonCalibratedMin.alpha)
						)})</span
					>
				</div>
				<div class="readout-row">
					<span class="readout-label"><KatexInline formula={String.raw`\eta - 1/2`} /></span>
					<span class="readout-value">{(eta - 0.5).toFixed(2)} ({signLabel(etaSign)})</span>
				</div>
				<div class="readout-row">
					<span class="readout-label"
						><KatexInline
							formula={String.raw`\text{Signe}(\alpha^\star) = \text{Signe}(\eta - 1/2)`}
						/> ?</span
					>
					<span class="readout-value" style:color={tracksColor(nonCalibratedPointwise)}
						>{tracksLabel(nonCalibratedPointwise)}</span
					>
				</div>
			</div>
		</section>
	</div>

	<Metrics align="left">
		<div class="cell">
			<span class="label">φ′(0) — {calibrated.label}</span>
			<span class="value"
				>{calibratedCheck.phiPrimeAtZero !== null
					? calibratedCheck.phiPrimeAtZero.toFixed(2)
					: '—'}</span
			>
		</div>
		<div class="cell">
			<span class="label"
				><KatexInline formula={String.raw`\alpha^\star`} /> — {calibrated.label}</span
			>
			<span class="value">{calibratedMin.alpha.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label"
				>Signe suit <KatexInline formula={String.raw`\eta`} /> — {calibrated.label}</span
			>
			<span class="value" style:color={tracksColor(calibratedPointwise)}
				>{tracksLabel(calibratedPointwise)}</span
			>
		</div>
		<div class="cell">
			<span class="label"
				><KatexInline formula={String.raw`\varphi'(0)`} /> — {nonCalibrated.label}</span
			>
			<span class="value"
				>{nonCalibratedCheck.phiPrimeAtZero !== null
					? nonCalibratedCheck.phiPrimeAtZero.toFixed(2)
					: '—'}</span
			>
		</div>
		<div class="cell">
			<span class="label"
				><KatexInline formula={String.raw`\alpha^\star`} /> — {nonCalibrated.label}</span
			>
			<span class="value">{nonCalibratedMin.alpha.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label"
				>Signe suit <KatexInline formula={String.raw`\eta`} /> — {nonCalibrated.label}</span
			>
			<span class="value" style:color={tracksColor(nonCalibratedPointwise)}
				>{tracksLabel(nonCalibratedPointwise)}</span
			>
		</div>
	</Metrics>

	<p class="note">
		Théorème 4.1 : une perte convexe positive est calibrée si et seulement si elle est
		différentiable en 0 avec <KatexInline formula="\varphi'(0) &lt; 0" />. Comme
		<KatexInline formula="(C_\varphi)'(0) = (2\eta - 1)\,\varphi'(0)" />, une pente négative en 0
		pousse le minimiseur du bon côté : <KatexInline formula={String.raw`\alpha^\star \gt 0`} /> si <KatexInline
			formula={String.raw`\eta \gt 1/2, \alpha^\star \lt 0`}
		/> sinon. Avec la marge carrée
		<KatexInline formula="t^2" />, <KatexInline formula="\varphi'(0) = 0" /> et <KatexInline
			formula={String.raw`\alpha^\star`}
		/> reste collé à 0 quelle que soit <KatexInline formula={String.raw`\eta`} /> ; avec la marge décalée
		<KatexInline formula="(1+t)^2" />,
		<KatexInline formula="\varphi'(0) = 2 > 0" /> et <KatexInline
			formula={String.raw`\alpha^\star`}
		/> est du mauvais signe des deux côtés de <KatexInline formula={String.raw`\eta = 1/2`} />. La
		charnière est différentiable en 0 (son point d'angle est en t = 1), avec
		<KatexInline formula="\varphi'(0) = -1" /> : elle est calibrée. Les courbes tracées sont les
		risques conditionnels <KatexInline
			formula={String.raw`C_\varphi(\alpha, \eta) = \eta\,\varphi(\alpha) + (1-\eta)\,\varphi(-\alpha)`}
		/>, et non les pertes <KatexInline formula={String.raw`\varphi`} /> elles-mêmes : pour
		<KatexInline formula={String.raw`\eta \in (0,1)`} /> elles divergent en
		<KatexInline formula={String.raw`\alpha \to \pm\infty`} /> — y compris pour une perte qui s'annule en
		<KatexInline formula={String.raw`t \to +\infty`} />, le terme <KatexInline
			formula={String.raw`\varphi(-\alpha)`}
		/>
		explosant quand <KatexInline formula={String.raw`\alpha \to +\infty`} /> — ce qui garantit un
		minimiseur <KatexInline formula={String.raw`\alpha^\star`} /> fini.
	</p>
</div>

<style>
	.criterion-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface, transparent);
	}

	.panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
	}

	.panel-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
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

	.note {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0;
	}

	@media (max-width: 900px) {
		.panels {
			grid-template-columns: 1fr;
		}
	}
</style>
