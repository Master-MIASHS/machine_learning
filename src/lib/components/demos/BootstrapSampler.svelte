<script lang="ts">
	import { onDestroy } from 'svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	// ── Animation handle (plain, not reactive — it's an implementation detail) ──
	let animInterval: ReturnType<typeof setInterval> | null = null;

	// ── Core state ────────────────────────────────────────────────
	let N = $state(20);
	let counts = $state<number[]>([]);
	let animating = $state(false);
	let animStep = $state(0);
	let lastDrawnIndex = $state<number | null>(null);

	// ── Convergence study state ───────────────────────────────
	let convergenceSizes = $state<number[]>([]);
	let convergenceEmpirical = $state<number[]>([]);
	let runningConvergence = $state(false);

	const THEORETICAL_INCLUSION = 1 - 1 / Math.E; // ≈ 0.632

	function generateSample(n: number): number[] {
		const result = new Array(n).fill(0);
		for (let i = 0; i < n; i++) {
			const idx = Math.floor(Math.random() * n);
			result[idx]++;
		}
		return result;
	}

	// FIX 3: always tear down any running animation first, regardless of which
	// branch is about to run. The previous version never did this, so clicking
	// "Nouveau tirage" (or changing N) while an animated draw was still
	// in-flight left the old interval alive, silently corrupting `counts` after
	// it had just been reset.
	function stopAnimation() {
		if (animInterval !== null) {
			clearInterval(animInterval);
			animInterval = null;
		}
		animating = false;
	}

	function newSample(animate = false) {
		stopAnimation();

		counts = new Array(N).fill(0);
		lastDrawnIndex = null;
		animStep = 0;

		if (animate) {
			animating = true;
			const draws: number[] = [];
			for (let i = 0; i < N; i++) {
				draws.push(Math.floor(Math.random() * N));
			}

			animInterval = setInterval(
				() => {
					if (animStep < N) {
						lastDrawnIndex = draws[animStep];
						counts[lastDrawnIndex]++;
						animStep++;
					} else {
						stopAnimation();
						lastDrawnIndex = null;
					}
				},
				Math.max(30, 800 / N)
			);
		} else {
			counts = generateSample(N);
			animStep = N;
			lastDrawnIndex = null;
		}
	}

	// FIX 2: drive resampling from N itself via a plain tracked comparison,
	// instead of relying on a Slider `onchange` prop that this component's
	// Slider API doesn't appear to support (every other usage in this codebase
	// only wires up `bind:value`). This guarantees `counts` is always
	// regenerated at the correct length whenever N changes, regardless of how
	// the Slider reports changes internally.
	let prevN = $state(-1);
	$effect(() => {
		if (prevN >= 0 && N !== prevN) {
			newSample(false);
		}
		prevN = N;
	});

	onDestroy(stopAnimation);

	// ── Derived statistics ────────────────────────────────
	const completed = $derived(!animating || animStep >= N);

	const oobCount = $derived(counts.filter((c) => c === 0).length);
	const includedCount = $derived(N - oobCount);
	const inclusionFraction = $derived(N > 0 ? includedCount / N : 0);
	const oobFraction = $derived(N > 0 ? oobCount / N : 0);

	const uniqueInSample = $derived(counts.filter((c) => c > 0).length);

	const avgMultiplicityIncluded = $derived.by(() => {
		if (includedCount === 0) return 0;
		return N / includedCount;
	});

	const maxCount = $derived(counts.length > 0 ? Math.max(...counts) : 0);
	const onceCount = $derived(counts.filter((c) => c === 1).length);
	const multiCount = $derived(counts.filter((c) => c > 1).length);

	function pointClass(i: number): string {
		if (!completed && i === lastDrawnIndex) return 'point-flash';
		const c = counts[i];
		if (c === 0) return 'point-oob';
		if (c === 1) return 'point-once';
		return 'point-multi';
	}

	function runConvergenceStudy() {
		if (runningConvergence) return;
		runningConvergence = true;

		const sizes = [5, 10, 15, 20, 30, 40, 50, 75, 100, 500, 1000, 10000];
		convergenceSizes = [];
		convergenceEmpirical = [];

		const runNext = (idx: number) => {
			if (idx >= sizes.length) {
				runningConvergence = false;
				return;
			}

			const n = sizes[idx];
			let totalIncluded = 0;
			const kSamples = Math.max(100, Math.floor(500 / (n / 20)));

			for (let s = 0; s < kSamples; s++) {
				const sample = generateSample(n);
				totalIncluded += sample.filter((c) => c > 0).length;
			}

			convergenceSizes[idx] = n;
			convergenceEmpirical[idx] = totalIncluded / (kSamples * n);

			setTimeout(() => runNext(idx + 1), 50);
		};

		runNext(0);
	}

	const convergenceReady = $derived(convergenceSizes.length > 0 && !runningConvergence);

	newSample(false);
</script>

<div class="bootstrap-sampler">
	<!-- ── Controls row ──────────────────────────────── -->
	<div class="controls-section">
		<div class="slider-group">
			<Slider bind:value={N} min={5} max={100} step={1} label="Nombre de points (N)" />
		</div>

		<div class="buttons-row">
			<Button variant="primary" size="sm" onclick={() => newSample(true)}>▶ Tirage animé</Button>
			<Button variant="outline" size="sm" onclick={() => newSample(false)}>Nouveau tirage</Button>
			<Button
				variant="outline"
				size="sm"
				disabled={runningConvergence}
				onclick={runConvergenceStudy}
			>
				{runningConvergence ? '⏳' : '📊'} Convergence (1 − 1/e)
			</Button>
		</div>
	</div>

	<!-- ── Progress during animation ──────────────── -->
	{#if animating}
		<div class="anim-progress">
			<div class="anim-bar" style:width="{(animStep / N) * 100}%"></div>
			<span class="anim-label">{animStep}/{N} tirages</span>
		</div>
	{:else if completed && animStep >= N}
		<div class="anim-progress done">
			<span class="anim-label">✓ Échantillon bootstrap complet</span>
		</div>
	{/if}

	<!-- ── Panel 1: Original dataset ──────────────────────── -->
	<figure class="panel panel-original">
		<figcaption class="panel-title">Données originales — {N} points indexés</figcaption>

		{#if N <= 50}
			<div class="dots-row">
				{#each [...Array(N).keys()] as i}
					<div class={pointClass(i)}>
						{String(i + 1).padStart(N >= 10 ? 2 : 1, '0')}
					</div>
				{/each}
			</div>

			<div class="legend-row">
				<span class="legend-item legend-once">● Inclus (×1)</span>
				<span class="legend-item legend-multi">● Dupliqué (≥×2)</span>
				<span class="legend-item legend-oob">○ Hors sac (OOB)</span>
			</div>
		{:else}
			<div class="summary-bands">
				<div class="band band-once" style:width="{(onceCount / N) * 100}%"></div>
				<div class="band band-multi" style:width="{(multiCount / N) * 100}%"></div>
				<div class="band band-oob" style:width="{(oobCount / N) * 100}%"></div>
			</div>
			<div class="summary-labels">
				<span style:color="var(--color-positive)">×1 : {onceCount}</span>
				<span style:color="var(--color-surprise)">≥×2 : {multiCount}</span>
				<span style:color="var(--color-text-muted)">OOB : {oobCount}</span>
			</div>
		{/if}
	</figure>

	<!-- ── Panel 2: Bootstrap sample histogram ─────────── -->
	<figure class="panel panel-histogram">
		<figcaption class="panel-title">
			Fréquence d'apparition dans l'échantillon bootstrap
			{#if completed}
				(N = {uniqueInSample} points distincts extraits){/if}
		</figcaption>

		<div class="histogram-container">
			{#each [...Array(N).keys()] as i}
				{@const c = counts[i] ?? 0}
				{@const pct = maxCount > 0 ? (c / maxCount) * 100 : 0}

				<div class="bar-wrapper" data-index={i}>
					{#if completed && c > 0}
						<span class="bar-count">{c}</span>
					{/if}
					<div
						class={`bar ${c === 0 ? 'bar-oob' : c === 1 ? 'bar-once' : 'bar-multi'}`}
						style:height="{Math.max(pct, 2)}%"
					></div>
					{#if N <= 30}
						<span class="bar-label">{i + 1}</span>
					{/if}
				</div>
			{/each}
		</div>
	</figure>

	<!-- ── Live inclusion gauge (wow #1: real-time single-draw convergence) ── -->
	<div class="gauge-panel">
		<div class="gauge-title">Fraction incluse en direct</div>
		<div class="gauge-track">
			<div class="gauge-fill" style:width="{inclusionFraction * 100}%"></div>
			<div class="gauge-target" style:left="{THEORETICAL_INCLUSION * 100}%"></div>
		</div>
		<div class="gauge-labels">
			<span>0%</span>
			<span class="gauge-target-label" style:left="{THEORETICAL_INCLUSION * 100}%">
				1 − 1/e ≈ 63.2%
			</span>
			<span>100%</span>
		</div>
	</div>

	<!-- ── Statistics metrics row ──────────────────────── -->
	<Metrics align="center">
		<div class="cell">
			<span class="label">Points inclus</span>
			<span class="value">{includedCount}/{N}</span>
		</div>
		<div class="cell style-operator"></div>

		<div class="cell">
			<span class="label">Fraction incluse</span>
			<span
				class="value"
				style:color={Math.abs(inclusionFraction - THEORETICAL_INCLUSION) < 0.05
					? 'var(--color-positive)'
					: undefined}
			>
				{(inclusionFraction * 100).toFixed(1)}%
			</span>
			<span class="unit">théor. {Math.round(THEORETICAL_INCLUSION * 100)}%</span>
		</div>
		<div class="cell style-operator"></div>

		<div class="cell">
			<span class="label">OOB (hors sac)</span>
			<span class="value">{oobCount}/{N}</span>
		</div>
		<div class="cell style-operator"></div>

		<div class="cell">
			<span class="label">Fraction OOB</span>
			<span class="value">{(oobFraction * 100).toFixed(1)}%</span>
			<span class="unit">théor. {Math.round((1 - THEORETICAL_INCLUSION) * 100)}%</span>
		</div>
		<div class="cell style-operator"></div>

		<div class="cell">
			<span class="label">Mult. moy.</span>
			<span class="value">{avgMultiplicityIncluded.toFixed(2)}</span>
		</div>
		<div class="cell style-operator"></div>

		<div class="cell">
			<span class="label">Max répétitions</span>
			<span class="value">{maxCount}</span>
		</div>
	</Metrics>

	<!-- ── Mathematical explanation callout ─────────────── -->
	<div class="math-callout">
		<p class="callout-title">Pourquoi ≈ 63,2 % ?</p>
		<p class="callout-text">
			Pour un point donné, la probabilité de <strong>ne pas être sélectionné</strong> en un seul tirage
			est (N−1)/N. Après N tirages indépendants :
		</p>
		<div class="formula-row">
			<span class="formula">P(OOB) = ((N−1)/N)^N → e⁻¹ ≈ 0,368 quand N → ∞</span>
		</div>
		<p class="callout-text">
			Donc P(inclus) = 1 − P(OOB) → 1 − 1/e ≈ <strong>63,2 %</strong>. Les {oobCount} points OOB constituent
			un ensemble naturel pour la validation croisée.
		</p>
	</div>

	<!-- ── Convergence chart panel (wow #2: cross-N asymptotic behavior) ─── -->
	{#if convergenceReady || runningConvergence}
		<figure class="panel panel-convergence">
			<figcaption class="panel-title">Convergence empirique vers 1 − 1/e ≈ 63,2 %</figcaption>

			<div class="conv-chart">
				<div class="conv-plot">
					<!-- Ligne de référence à 63.2% sur une échelle max de 80% (0.63212 / 0.8 * 100 = 79.0%) -->
					<div class="conv-ref-line" style:bottom="{(THEORETICAL_INCLUSION / 0.8) * 100}%"></div>
					<span class="conv-ref-label" style:bottom="{(THEORETICAL_INCLUSION / 0.8) * 100}%">
						théorique: {(THEORETICAL_INCLUSION * 100).toFixed(1)}%
					</span>

					{#each convergenceEmpirical as empiricalValue, i (i)}
						{@const emp = empiricalValue ?? 0}
						<div class="conv-bar-wrapper">
							<div
								class="conv-bar"
								style:height="{(emp / 0.8) * 100}%"
								style:opacity={runningConvergence && !convergenceEmpirical[i] ? 0 : 1}
							>
								{#if !runningConvergence || convergenceEmpirical[i]}
									<span class="conv-bar-value">{(emp * 100).toFixed(1)}%</span>
								{/if}
							</div>
						</div>
					{/each}

					<!-- Axe Y linéaire de 0% à 80% (hauteur projetée sur 80% max) -->
					<div class="conv-y-axis">
						<span class="conv-y-tick" style:bottom="100%">80%</span>
						<span class="conv-y-tick" style:bottom="{(0.63212 / 0.8) * 100}%">≈ 63%</span>
						<span class="conv-y-tick" style:bottom="{(0.4 / 0.8) * 100}%">40%</span>
						<span class="conv-y-tick" style:bottom="{(0.2 / 0.8) * 100}%">20%</span>
						<span class="conv-y-tick conv-y-zero" style:bottom="0%">0%</span>
					</div>
				</div>

				<div class="conv-x-labels">
					{#each convergenceSizes as size (size)}
						<span class="conv-x-label">N={size}</span>
					{/each}
				</div>
			</div>

			<p class="conv-caption">
				Fraction empirique de points inclus dans un échantillon bootstrap, moyennée sur plusieurs
				tirages. On observe la convergence rapide vers 1 − 1/e ≈ 63,2 % dès N > 20.
			</p>
		</figure>
	{/if}

	<!-- ── Pedagogical footer ─────────────────────── -->
	<p class="footer-note">
		L'échantillonnage bootstrap tire N fois <strong>avec remise</strong>. Chaque point original a
		donc une chance d'être sélectionné plusieurs fois, pas du tout (OOB), ou exactement une fois.
		Cette propriété est à la base du Bagging : chaque arbre d'une forêt aléatoire s'entraîne sur un
		bootstrap différent et bénéficie des {oobCount} points OOB pour l'évaluation gratuite.
	</p>
</div>

<style>
	.bootstrap-sampler {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
	}

	.controls-section {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.slider-group {
		width: 100%;
	}

	.buttons-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}

	.anim-progress {
		position: relative;
		height: 15px;
		background: var(--color-surface-2);
		border-radius: 3px;
		overflow: hidden;
		display: flex;
		align-items: center;

		&.done {
			background: color-mix(in srgb, var(--color-positive) 15%, transparent);
		}
	}

	.anim-bar {
		height: 100%;
		background: var(--color-belief);
		border-radius: 3px;
		transition: width 0.06s linear;
	}

	.anim-label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-text-muted);
	}

	.panel {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);

		.panel-title {
			margin: 0;
			font-size: 0.75rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-text-muted);
			text-align: center;
		}
	}

	.dots-row {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.point-flash,
	.point-once,
	.point-multi,
	.point-oob {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		border: 2px solid transparent;
		transition:
			background 0.3s,
			border-color 0.3s,
			transform 0.15s,
			box-shadow 0.15s;
		user-select: none;
	}

	.point-flash {
		background: var(--color-belief);
		color: white;
		transform: scale(1.25);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-belief) 30%, transparent);
		border-color: var(--color-belief);
	}

	.point-once {
		background: color-mix(in srgb, var(--color-positive) 20%, transparent);
		color: var(--color-positive);
		border-color: var(--color-positive);
	}

	.point-multi {
		background: color-mix(in srgb, var(--color-surprise) 25%, transparent);
		color: var(--color-surprise);
		border-color: var(--color-surprise);
	}

	.point-oob {
		background: color-mix(in srgb, var(--color-text-muted) 8%, transparent);
		color: var(--color-border);
		border-color: var(--color-border);
	}

	.legend-row {
		display: flex;
		justify-content: center;
		gap: 1rem;
		font-size: 0.75rem;
		padding-top: 0.25rem;
		border-top: 1px solid var(--color-border);

		.legend-item {
			display: flex;
			align-items: center;
			gap: 0.25rem;
		}

		.legend-once {
			color: var(--color-positive);
		}
		.legend-multi {
			color: var(--color-surprise);
		}
		.legend-oob {
			color: var(--color-border);
		}
	}

	.summary-bands {
		display: flex;
		height: 24px;
		border-radius: 6px;
		overflow: hidden;
	}

	.band {
		transition: width 0.3s ease;
		min-width: 0;
	}

	.band-once {
		background: var(--color-positive);
	}
	.band-multi {
		background: var(--color-surprise);
	}
	.band-oob {
		background: var(--color-border);
	}

	.summary-labels {
		display: flex;
		justify-content: center;
		gap: 1rem;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
	}

	.histogram-container {
		display: flex;
		align-items: flex-end;
		gap: 1px;
		height: 140px;
		padding: 0.25rem 0;
		position: relative;
		overflow-x: auto;
	}

	.bar-wrapper {
		flex: 1;
		min-width: 3px;
		max-width: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		gap: 1px;
	}

	.bar-count {
		font-family: var(--font-mono);
		font-size: 0.5625rem;
		color: var(--color-text-muted);
		line-height: 1;
	}

	.bar {
		width: 100%;
		max-width: 18px;
		min-width: 2px;
		border-radius: 2px 2px 0 0;
		transition:
			height 0.15s ease,
			background 0.3s ease;

		&.bar-once {
			background: var(--color-positive);
		}
		&.bar-multi {
			background: var(--color-surprise);
		}
		&.bar-oob {
			background: color-mix(in srgb, var(--color-border) 40%, transparent);
		}
	}

	.bar-label {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--color-text-muted);
		line-height: 1;
		margin-top: 2px;
	}

	.gauge-panel {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.6rem 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
	}

	.gauge-title {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		text-align: center;
	}

	.gauge-track {
		position: relative;
		height: 14px;
		background: var(--color-border);
		border-radius: 7px;
		overflow: hidden;
	}

	.gauge-fill {
		height: 100%;
		background: var(--color-belief);
		border-radius: 7px;
		transition: width 0.15s linear;
	}

	.gauge-target {
		position: absolute;
		top: -2px;
		bottom: -2px;
		width: 2px;
		background: var(--color-surprise);
	}

	.gauge-labels {
		position: relative;
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--color-text-muted);
		height: 1.2em;
	}

	.gauge-target-label {
		position: absolute;
		transform: translateX(-50%);
		color: var(--color-surprise);
		white-space: nowrap;
	}

	.math-callout {
		padding: 0.75rem 1rem;
		background: color-mix(in srgb, var(--color-belief) 6%, transparent);
		border-left: 3px solid var(--color-belief);
		border-radius: 0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;

		.callout-title {
			margin: 0;
			font-size: 0.8125rem;
			font-weight: 700;
			color: var(--color-belief);
		}

		.callout-text {
			margin: 0;
			font-size: 0.8125rem;
			line-height: 1.5;
			color: var(--color-text);
		}
	}

	.formula-row {
		padding: 0.375rem 0.75rem;
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		border-radius: var(--radius-sm, 4px);
		margin: 0.25rem 0;

		.formula {
			font-family: var(--font-mono);
			font-size: 0.8125rem;
			color: var(--color-text);
			font-weight: 600;
		}
	}

	.panel-convergence {
		background: var(--color-surface-2, transparent);
	}

	.conv-chart {
		position: relative;
		height: 180px;
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		overflow-x: auto;
	}

	.conv-plot,
	.conv-x-labels {
		display: flex;
		gap: 6px;
		padding-left: 3rem;
		box-sizing: border-box;
		min-width: 100%;
	}

	.conv-plot {
		position: relative;
		align-items: flex-end;
		min-height: 0;
	}

	.conv-y-axis {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 2.5rem;
		display: flex;
		flex-direction: column-reverse;
		justify-content: space-between;

		.conv-y-tick {
			font-family: var(--font-mono);
			font-size: 0.5625rem;
			color: var(--color-text-muted);
			text-align: right;
			position: absolute;
			right: 4px;

			&.conv-y-zero {
				transform: translateY(50%);
			}
		}
	}

	.conv-bar-wrapper {
		flex: 1;
		min-width: 20px;
		max-width: 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		gap: 2px;
	}

	.conv-bar {
		width: 80%;
		max-width: 36px;
		background: var(--color-belief);
		border-radius: 3px 3px 0 0;
		transition:
			height 0.4s ease,
			opacity 0.2s ease;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 2px;

		.conv-bar-value {
			font-family: var(--font-mono);
			font-size: 0.5rem;
			color: white;
			line-height: 1;
		}
	}

	.conv-x-label {
		flex: 1;
		min-width: 20px;
		max-width: 40px;
		font-family: var(--font-mono);
		font-size: 0.5625rem;
		color: var(--color-text-muted);
		padding-top: 4px;
		text-align: center;
	}

	.conv-ref-line {
		position: absolute;
		left: 3rem;
		right: 0;
		height: 2px;
		background: var(--color-surprise);
		opacity: 0.6;
		pointer-events: none;

		&::after {
			content: '';
			position: absolute;
			top: -4px;
			left: 0;
			right: 0;
			height: 10px;
			/*border-top: 2px dashed var(--color-surprise);*/
		}
	}

	.conv-ref-label {
		position: absolute;
		left: 3rem;
		transform: translateY(-100%);
		font-family: var(--font-mono);
		font-size: 0.625rem;
		color: var(--color-surprise);
	}

	.conv-caption {
		margin: 0;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
		text-align: center;
		padding-top: 0.375rem;
		border-top: 1px solid var(--color-border);
	}

	.footer-note {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.55;
		color: var(--color-text-muted);
		text-align: justify;

		strong {
			color: inherit;
		}
	}

	@media (max-width: 600px) {
		.bootstrap-sampler {
			padding: 0.75rem;
		}

		.point-flash,
		.point-once,
		.point-multi,
		.point-oob {
			width: 22px;
			height: 22px;
			font-size: 0.5625rem;
		}

		.dots-row {
			gap: 3px;
		}

		.histogram-container {
			height: 100px;
		}

		.conv-chart {
			height: 140px;
		}

		.buttons-row {
			justify-content: center;
		}
	}
</style>
