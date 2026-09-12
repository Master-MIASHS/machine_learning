<script lang="ts">
	import { onDestroy } from 'svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import CurveChart from '../charts/CurveChart.svelte';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────────────────────────────
	const N_POINTS = 100;
	const X_MIN = -3;
	const X_MAX = 3;
	const NOISE_STD = 1.2;
	const MAX_MODELS = 50;

	const xValues = Array.from({ length: N_POINTS }, (_, i) => {
		return X_MIN + (i / (N_POINTS - 1)) * (X_MAX - X_MIN);
	});

	function trueFunction(x: number): number {
		return Math.sin(x) + 0.3 * x;
	}

	const truePoints = $derived(xValues.map((x): [number, number] => [x, trueFunction(x)]));

	function randn(rng: () => number): number {
		let u1 = rng(),
			u2 = rng();
		while (u1 === 0) u1 = rng();
		return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	// ─── State ────────────────────────────────────────────────────────────────
	let m = $state(5);
	let seed = $state(0);
	let playing = $state(false);
	let animTimer: ReturnType<typeof setInterval> | null = null;

	function generateAllModels(): number[][] {
		// La graine pilote réellement le tirage : même graine → mêmes modèles.
		const rng = mulberry32(seed + 1);
		const models: number[][] = [];
		for (let j = 0; j < MAX_MODELS; j++) {
			const preds: number[] = [];
			for (let i = 0; i < N_POINTS; i++) {
				preds.push(trueFunction(xValues[i]) + NOISE_STD * randn(rng));
			}
			models.push(preds);
		}
		return models;
	}

	const models: number[][] = $derived.by(() => {
		void seed;
		return generateAllModels();
	});

	const ensemblePoints: [number, number][] = $derived.by(() => {
		if (m <= 0) return [];
		return xValues.map((_, i) => {
			let sum = 0;
			for (let j = 0; j < m; j++) sum += models[j][i];
			return [xValues[i], sum / m] as [number, number];
		});
	});

	const curves = $derived.by(() => {
		if (!models.length || !ensemblePoints.length) return [];

		const result: Array<{
			points: [number, number][];
			stroke?: string;
			strokeWidth?: number;
			opacity?: number;
		}> = [];

		for (let j = 0; j < m; j++) {
			const pts: [number, number][] = xValues.map((_, i) => [xValues[i], models[j][i]]);
			const hue = (j * 137.508 + 120) % 360;
			const opacity = Math.max(0.04, 0.35 / Math.sqrt(m));
			result.push({ points: pts, stroke: `hsl(${hue}, 65%, 55%)`, strokeWidth: 0.7, opacity });
		}

		result.push({
			points: ensemblePoints,
			stroke: 'var(--color-positive)',
			strokeWidth: 3,
			opacity: 0.95
		});

		result.push({
			points: truePoints,
			stroke: 'var(--color-text)',
			strokeWidth: 2.5,
			opacity: 0.9
		});

		return result;
	});

	const legend = $derived.by(() => [
		{
			label: m === 1 ? '1 modèle' : `${m} modèles (individuels)`,
			color: `hsl(215, 65%, 55%)`,
			kind: 'line' as const
		},
		{ label: `Moyenne d'ensemble (m=${m})`, color: 'var(--color-positive)', kind: 'line' as const },
		{ label: 'Fonction vraie', color: 'var(--color-text)', kind: 'line' as const }
	]);

	const varianceMetrics = $derived.by(() => {
		if (!models.length || m <= 0) {
			return { individualVar: 0, ensembleVar: 0, reductionRatio: 0, theoreticalReduction: 1 };
		}

		let sumIndividualMSE = 0;
		for (let j = 0; j < m; j++) {
			for (let i = 0; i < N_POINTS; i++) {
				const err = models[j][i] - trueFunction(xValues[i]);
				sumIndividualMSE += err * err;
			}
		}
		const individualVar = sumIndividualMSE / (m * N_POINTS);

		let sumEnsembleMSE = 0;
		for (let i = 0; i < N_POINTS; i++) {
			const err = ensemblePoints[i][1] - trueFunction(xValues[i]);
			sumEnsembleMSE += err * err;
		}
		const ensembleVar = sumEnsembleMSE / N_POINTS;

		const reductionRatio = individualVar > 0 ? individualVar / ensembleVar : 0;
		const theoreticalReduction = m;

		return { individualVar, ensembleVar, reductionRatio, theoreticalReduction };
	});

	const varianceCurve = $derived.by(() => {
		if (!models.length) return [];
		const curve: { m: number; variance: number }[] = [];
		const runningSum = new Array(N_POINTS).fill(0);
		for (let mm = 1; mm <= MAX_MODELS; mm++) {
			for (let i = 0; i < N_POINTS; i++) runningSum[i] += models[mm - 1][i];
			let sumMSE = 0;
			for (let i = 0; i < N_POINTS; i++) {
				const avg = runningSum[i] / mm;
				const err = avg - trueFunction(xValues[i]);
				sumMSE += err * err;
			}
			curve.push({ m: mm, variance: sumMSE / N_POINTS });
		}
		return curve;
	});

	const sigma1 = $derived(varianceCurve[0]?.variance ?? 1);

	const sparkW = 440;
	const sparkH = 110;
	const sparkPad = { l: 40, r: 10, t: 8, b: 20 };

	function sparkX(mm: number): number {
		return sparkPad.l + ((mm - 1) / (MAX_MODELS - 1)) * (sparkW - sparkPad.l - sparkPad.r);
	}
	function sparkY(v: number, lo: number, hi: number): number {
		const logV = Math.log10(Math.max(v, 1e-6));
		return sparkPad.t + (1 - (logV - lo) / (hi - lo)) * (sparkH - sparkPad.t - sparkPad.b);
	}

	// FIX: Include both empirical and theoretical values to guarantee accurate sizing bounds
	const sparkBounds = $derived.by(() => {
		if (!varianceCurve.length) return { lo: -2, hi: 0 };
		const empiricalVals = varianceCurve.map((p) => Math.log10(Math.max(p.variance, 1e-6)));
		const theoreticalVals = varianceCurve.map((p) => Math.log10(Math.max(sigma1 / p.m, 1e-6)));
		const allVals = [...empiricalVals, ...theoreticalVals];
		return { lo: Math.min(...allVals) - 0.2, hi: Math.max(...allVals) + 0.2 };
	});

	const empiricalPath = $derived.by(() => {
		if (!varianceCurve.length) return '';
		const { lo, hi } = sparkBounds;
		return varianceCurve
			.map(
				(p, i) =>
					`${i === 0 ? 'M' : 'L'}${sparkX(p.m).toFixed(1)},${sparkY(p.variance, lo, hi).toFixed(1)}`
			)
			.join(' ');
	});

	const theoreticalPath = $derived.by(() => {
		if (!varianceCurve.length) return '';
		const { lo, hi } = sparkBounds;
		return varianceCurve
			.map(
				(p, i) =>
					`${i === 0 ? 'M' : 'L'}${sparkX(p.m).toFixed(1)},${sparkY(sigma1 / p.m, lo, hi).toFixed(1)}`
			)
			.join(' ');
	});

	function play() {
		if (playing) return;
		if (m >= MAX_MODELS) m = 1;
		playing = true;
		animTimer = setInterval(() => {
			m = Math.min(m + 1, MAX_MODELS);
			if (m >= MAX_MODELS) stopAnim();
		}, 120);
	}
	function pause() {
		stopAnim();
	}
	function stopAnim() {
		if (animTimer !== null) clearInterval(animTimer);
		animTimer = null;
		playing = false;
	}
	onDestroy(stopAnim);

	function regenerate() {
		stopAnim();
		seed += 1;
	}
</script>

<div class="demo-wrap">
	<div class="header">
		<h2>Réduction de variance par agrégation d'ensembles</h2>
		<p class="subtitle">
			Moyenner <strong>m</strong> modèles indépendants et non biaisés réduit la variance par un
			facteur
			<strong>m</strong> — théorème fondamental du Bagging.
		</p>
	</div>

	<Figure type="chart" style="width:100%">
		<CurveChart
			{curves}
			height={280}
			xDomain={[X_MIN, X_MAX]}
			yDomain={[-4, 4]}
			nTicks={7}
			yAxis={true}
			{legend}
			chartLabel="f(x) vs prédictions"
		/>

		{#snippet caption()}
			M = {m} modèles | σ² agrégé ≈ σ² / m = {varianceMetrics.ensembleVar.toFixed(3)}
		{/snippet}
	</Figure>

	<Metrics align="center">
		<div class="cell">
			<span class="label">σ² individuel</span>
			<span class="value" style:color="var(--color-surprise)"
				>{varianceMetrics.individualVar.toFixed(4)}</span
			>
			<span class="unit">MSE moyen</span>
		</div>

		<div class="cell">
			<span class="label">σ² agrégé</span>
			<span class="value" style:color="var(--color-positive)"
				>{varianceMetrics.ensembleVar.toFixed(4)}</span
			>
			<span class="unit">≈ σ² / {m}</span>
		</div>

		<div class="cell">
			<span class="label">Réduction ×</span>
			<span class="value" style:color="var(--color-belief)"
				>{varianceMetrics.reductionRatio.toFixed(1)}</span
			>
			<span class="unit">(théorique : {varianceMetrics.theoreticalReduction})</span>
		</div>
	</Metrics>

	<div class="controls-panel">
		<Slider bind:value={m} min={1} max={MAX_MODELS} step={1} label="Nombre de modèles (m)" />

		<div class="actions-row">
			{#if playing}
				<Button variant="outline" size="sm" onclick={pause}>⏸ Pause</Button>
			{:else}
				<Button variant="outline" size="sm" onclick={play}>▶ Balayer m automatiquement</Button>
			{/if}
			<Button variant="outline" size="sm" onclick={regenerate}>🔄 Re-générer le bruit</Button>
			<span class="noise-label">σ = {NOISE_STD}</span>
		</div>
	</div>

	<div class="decay-panel">
		<div class="decay-title">Variance de l'ensemble en fonction de m (échelle log)</div>
		<svg
			viewBox={`0 0 ${sparkW} ${sparkH}`}
			width="100%"
			height={sparkH}
			role="img"
			aria-label="Décroissance de la variance en fonction de m"
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

			<path
				d={theoreticalPath}
				fill="none"
				stroke="var(--color-belief)"
				stroke-width="1.5"
				stroke-dasharray="4 3"
				opacity="0.7"
			/>
			<path d={empiricalPath} fill="none" stroke="var(--color-positive)" stroke-width="2.5" />

			{#if varianceCurve.length}
				{@const cur = varianceCurve[Math.min(m, MAX_MODELS) - 1]}
				{#if cur}
					<circle
						cx={sparkX(cur.m)}
						cy={sparkY(cur.variance, sparkBounds.lo, sparkBounds.hi)}
						r="4"
						fill="var(--color-positive)"
						stroke="#fff"
						stroke-width="1.5"
					/>
				{/if}
			{/if}

			<text
				x={sparkPad.l - 4}
				y={sparkH - sparkPad.b + 12}
				font-size="9"
				fill="var(--color-text-muted)">m=1</text
			>
			<text
				x={sparkW - sparkPad.r}
				y={sparkH - sparkPad.b + 12}
				text-anchor="end"
				font-size="9"
				fill="var(--color-text-muted)">m={MAX_MODELS}</text
			>
		</svg>
		<p class="decay-caption">
			<span style="color: var(--color-positive)">■</span> variance empirique &nbsp;
			<span style="color: var(--color-belief)">┄</span> variance théorique σ²/m
		</p>
	</div>

	<div class="insight-box">
		<span class="icon">💡</span>
		<p>
			Chaque modèle est <strong>non biaisé</strong> (E[ε]=0) mais bruyant. La moyenne d'ensemble
			converge vers la vraie fonction car les erreurs indépendantes se <strong>compensent</strong>.
			Avec <strong>{m}</strong> modèles, l'erreur quadratique est divisée par ~<strong
				>{Math.round(varianceMetrics.reductionRatio)}</strong
			>.
		</p>
	</div>
</div>

<style>
	/* Styles remain unchanged */
	.demo-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}
	h2 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-text);
	}
	.header {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
		max-width: 480px;
	}
	.subtitle {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 480px;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}
	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.noise-label {
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}
	.decay-panel {
		width: 100%;
		max-width: 480px;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
	}
	.decay-title {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		text-align: center;
	}
	.decay-caption {
		margin: 0;
		font-size: 0.74rem;
		color: var(--color-text-muted);
		text-align: center;
	}
	.insight-box {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		padding: 0.65rem 1rem;
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		border-radius: 6px;
		width: 100%;
		max-width: 480px;
	}
	.insight-box p {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text);
	}
	.icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}
</style>
