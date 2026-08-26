<script lang="ts">
	// Part VII — Décomposition de l'erreur (theorie.typ "Décomposition de
	// l'erreur", Théorème 4.2):
	//   R(h_{f̂_S}) - R* = A (estimation) + B (calibration) + C (approximation)
	//
	// Illustrative simulation on simulateExcessRiskDecompositionMean
	// (calibration.ts): a fixed distribution (Bayes risk 0.15); the estimation
	// term A is the mean of N_REPLICATES half-normal draws with scale
	// sqrt(R*(1-R*)/n) — the theorem controls A in expectation, at rate
	// 1/sqrt(n) (Part VI concentration bounds), so the displayed A is exactly
	// proportional to 1/sqrt(n); the calibration term B shrinks with the
	// class capacity and vanishes at capacity 1 (f** in cal(F)); the
	// approximation term C is the exact 0-1 gap between the global
	// phi-minimizer and the Bayes classifier on a discrete eta law
	// (phiMinimizerZeroOneGap) — 0 for a calibrated phi, strictly positive
	// otherwise.
	// Not a proof: the point is to make the three terms individually visible
	// and to see which knob controls which one.

	import StackedBar from '$lib/components/charts/StackedBar.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import {
		getLoss,
		checkCalibration,
		simulateExcessRiskDecompositionMean,
		phiMinimizerZeroOneGap,
		type LossId
	} from '$lib/math/calibration';

	// Two calibrated + two non-calibrated losses: term C switches on/off,
	// which is the "C = 0 si phi calibrée" clause of Théorème 4.2.
	const SELECTABLE_IDS: LossId[] = ['logistic', 'hinge', 'squaredMargin', 'shiftedSquared'];
	const COLORS: Record<LossId, string> = {
		zeroOne: 'var(--color-text-muted)',
		logistic: 'var(--color-belief)',
		hinge: 'var(--color-surprise)',
		exponential: 'var(--color-agent, #818cf8)',
		brier: 'var(--color-positive, #4caf50)',
		squaredMargin: 'var(--color-neutral)',
		shiftedSquared: 'var(--color-epistemic)'
	};

	const options = SELECTABLE_IDS.map((id) => {
		const loss = getLoss(id);
		return {
			id,
			label: loss.label,
			color: COLORS[id],
			calibrated: checkCalibration(loss).calibrated
		};
	});

	// Fixed problem: Bayes risk of the underlying distribution, fixed seed
	// (the simulation is deterministic in n / capacity / loss), number of
	// Monte-Carlo draws for the estimation term (mean over replicates — the
	// theorem controls A in expectation), and the symmetric discrete eta law
	// used to compute term C.
	const BAYES_RISK = 0.15;
	const SEED = 1;
	const N_REPLICATES = 200;
	const ETA_WEIGHTS: [number, number][] = [
		[0.3, 0.5],
		[0.7, 0.5]
	];

	const TERM_COLORS = ['var(--color-epistemic)', 'var(--color-neutral)', 'var(--color-surprise)'];

	// KaTeX formulas with braces must be JS strings (attribute values cannot
	// contain raw { } in Svelte), backslashes doubled as in the lesson pages.
	const excessRiskFormula = 'R(h_{\\hat{f}_S}) - R^*';
	const termAFormula = 'R(h_{\\hat{f}_S}) - R(h_{f^*})';
	const termBFormula = 'R(h_{f^*}) - R(h_{f^{**}})';
	const termCFormula = 'R(h_{f^{**}}) - R^*';
	const riskFbbFormula = 'R(h_{f^{**}})';
	const riskFstarFormula = 'R(h_{f^*})';
	const riskHatFormula = 'R(h_{\\hat{f}_S})';
	const scaleFormula = '\\sqrt{R^*(1-R^*)/n}';
	const rateFormula = '1/\\sqrt{n}';
	const etaLawFormula = '\\eta \\in \\{0.3, 0.7\\}';
	const fbbInFFormula = 'f^{**} \\in \\mathcal{F}';

	let n = $state(200);
	let classCapacity = $state(0.5);
	let selectedId = $state<LossId>('logistic');

	const selected = $derived(getLoss(selectedId));
	const selectedColor = $derived(COLORS[selectedId]);

	const calibrationGap = $derived(phiMinimizerZeroOneGap(selected, ETA_WEIGHTS));

	const sim = $derived(
		simulateExcessRiskDecompositionMean(
			{ n, classCapacity, calibrationGap, bayesRisk: BAYES_RISK, seed: SEED },
			N_REPLICATES
		)
	);

	const barValues = $derived([sim.estimation, sim.calibration, sim.approximation]);
</script>

<div class="decomposition-demo">
	<div class="options-row">
		{#each options as opt (opt.id)}
			<button
				class:active={selectedId === opt.id}
				style:--opt-color={opt.color}
				onclick={() => (selectedId = opt.id)}
			>
				<span class="dot" style:background={opt.color}></span>
				{opt.label}
				<span class="badge">{opt.calibrated ? 'calibrée' : 'non calibrée'}</span>
			</button>
		{/each}
	</div>

	<SliderGrid>
		<div class="group">
			<div class="group-title">Échantillon</div>
			<Slider bind:value={n} min={10} max={2000} step={10} label="Taille d'échantillon n" />
		</div>
		<div class="group">
			<div class="group-title">Classe cal(F)</div>
			<Slider
				bind:value={classCapacity}
				min={0}
				max={1}
				step={0.01}
				label="Capacité de la classe (1 ⇒ f** ∈ F)"
			/>
		</div>
	</SliderGrid>

	<div class="bar-section">
		<div class="bar-header">
			<span class="bar-title">
				Excès de risque <KatexInline formula={excessRiskFormula} />
			</span>
			<span class="bar-total">{sim.total.toFixed(4)}</span>
		</div>
		<StackedBar
			values={barValues}
			colors={TERM_COLORS}
			max={1}
			aria-label="Décomposition de l'excès de risque 0-1 : terme d'estimation A, terme de calibration B, terme d'approximation C"
		/>
		<div class="bar-scale">
			<span>0</span>
			<span>1</span>
		</div>
		<ul class="legend">
			<li>
				<span class="dot" style:background={TERM_COLORS[0]}></span>
				<span class="legend-label">
					A — estimation <KatexInline formula={termAFormula} />
				</span>
				<span class="legend-value">{sim.estimation.toFixed(4)}</span>
			</li>
			<li>
				<span class="dot" style:background={TERM_COLORS[1]}></span>
				<span class="legend-label">
					B — calibration <KatexInline formula={termBFormula} />
				</span>
				<span class="legend-value">{sim.calibration.toFixed(4)}</span>
			</li>
			<li>
				<span class="dot" style:background={TERM_COLORS[2]}></span>
				<span class="legend-label">
					C — approximation <KatexInline formula={termCFormula} />
				</span>
				<span class="legend-value">{sim.approximation.toFixed(4)}</span>
			</li>
		</ul>
	</div>

	<div class="readout" style:--opt-color={selectedColor}>
		<div class="readout-row">
			<span class="readout-label"><KatexInline formula="R^*" /> (risque de Bayes)</span>
			<span class="readout-value">{sim.rBayes.toFixed(4)}</span>
		</div>
		<div class="readout-row">
			<span class="readout-label">
				<KatexInline formula={riskFbbFormula} /> (minimiseur global du φ-risque)
			</span>
			<span class="readout-value">{sim.rDoubleStar.toFixed(4)}</span>
		</div>
		<div class="readout-row">
			<span class="readout-label"><KatexInline formula={riskFstarFormula} /> (meilleur modèle de cal(F))</span>
			<span class="readout-value">{sim.rStar.toFixed(4)}</span>
		</div>
		<div class="readout-row">
			<span class="readout-label"><KatexInline formula={riskHatFormula} /> (risque appris)</span>
			<span class="readout-value">{sim.rHat.toFixed(4)}</span>
		</div>
	</div>

	<p class="note">
		Démonstration <strong>illustrative</strong>, pas une preuve : A est la moyenne de
		{N_REPLICATES} tirages de demi-loi normale d'échelle <KatexInline formula={scaleFormula} />,
		le théorème le contrôlant en espérance, au taux <KatexInline formula={rateFormula} /> (bornes de
		concentration de la partie VI) ; B est proportionnel à la lacune de capacité ; C est l'écart 0-1
		exact entre le minimiseur global du φ-risque et le classifieur de Bayes pour une loi discrète
		<KatexInline formula={etaLawFormula} />. Augmentez n pour réduire A ; passez la capacité à 1
		pour annuler B (<KatexInline formula={fbbInFFormula} />) ; choisissez une perte non calibrée
		pour rendre C strictement positif.
	</p>
</div>

<style>
	.decomposition-demo {
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
	button .badge {
		font-size: 0.625rem;
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
		border: 1px solid currentColor;
		opacity: 0.7;
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

	.bar-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}
	.bar-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.bar-title {
		font-size: 0.85rem;
	}
	.bar-total {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 0.9rem;
	}
	.bar-scale {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-text-muted);
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}
	.legend .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		flex: none;
	}
	.legend-label {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--color-text-muted);
	}
	.legend-value {
		font-family: var(--font-mono);
		font-weight: 600;
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
