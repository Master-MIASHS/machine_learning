<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	import {
		generateSyntheticData,
		polyEval,
		ridgeSolver,
		polynomialFeatures
	} from '$lib/math/bias-variance.js';

	/* ------------------------------------------------------------------ */
	/* Controls                                                            */
	/* ------------------------------------------------------------------ */

	let degree = $state(5);
	let kFolds = $state(5);
	let numSamples = $state(100);

	const maxDegree = 8;

	/* ------------------------------------------------------------------ */
	/* Data                                                                 */
	/* ------------------------------------------------------------------ */

	const synthData = $derived.by(() => generateSyntheticData(numSamples, 0.3));

	/*
	 * Lambda is sampled logarithmically because ridge regularization
	 * spans several orders of magnitude.
	 */
	const lambdas = $derived(Array.from({ length: 120 }, (_, i) => Math.exp(-8 + (16 * i) / 119)));

	/* ------------------------------------------------------------------ */
	/* Cross validation                                                    */
	/* ------------------------------------------------------------------ */

	const cvResult = $derived.by(() => {
		const xs = synthData.xs;
		const ys = synthData.ys;

		const n = xs.length;
		const foldSize = Math.floor(n / kFolds);

		const folds = Array.from({ length: kFolds }, (_, fold) => {
			const start = fold * foldSize;
			const end = fold === kFolds - 1 ? n : start + foldSize;

			return {
				valIdx: Array.from({ length: end - start }, (_, i) => start + i),

				trainIdx: Array.from({ length: n }, (_, i) => i).filter((i) => i < start || i >= end)
			};
		});

		const scores: number[] = [];
		const stds: number[] = [];

		for (const lambda of lambdas) {
			const foldScores: number[] = [];

			for (const fold of folds) {
				const xTrain = fold.trainIdx.map((i) => xs[i]);

				const yTrain = fold.trainIdx.map((i) => ys[i]);

				const xVal = fold.valIdx.map((i) => xs[i]);

				const yVal = fold.valIdx.map((i) => ys[i]);

				const X = polynomialFeatures(xTrain, degree);

				const coeffs = ridgeSolver(X, yTrain, lambda);

				let mse = 0;

				for (let i = 0; i < xVal.length; i++) {
					const pred = polyEval(coeffs, xVal[i]);

					mse += (pred - yVal[i]) ** 2;
				}

				foldScores.push(mse / xVal.length);
			}

			const mean = foldScores.reduce((a, b) => a + b, 0) / foldScores.length;

			scores.push(mean);

			const variance =
				foldScores.reduce((acc, value) => acc + (value - mean) ** 2, 0) /
				Math.max(1, foldScores.length - 1);

			stds.push(Math.sqrt(variance));
		}

		return {
			scores,
			stds
		};
	});

	/* ------------------------------------------------------------------ */
	/* Training error                                                      */
	/* ------------------------------------------------------------------ */

	const trainError = $derived.by(() => {
		const X = polynomialFeatures(synthData.xs, degree);

		return lambdas.map((lambda) => {
			const coeffs = ridgeSolver(X, synthData.ys, lambda);

			let mse = 0;

			for (let i = 0; i < synthData.xs.length; i++) {
				const pred = polyEval(coeffs, synthData.xs[i]);

				mse += (pred - synthData.ys[i]) ** 2;
			}

			return mse / synthData.xs.length;
		});
	});

	/* ------------------------------------------------------------------ */
	/* CurveChart data                                                     */
	/* ------------------------------------------------------------------ */

	const curves = $derived([
		{
			points: lambdas.map(
				(lambda, i) => [Math.log10(lambda), cvResult.scores[i]] as [number, number]
			),

			stroke: '#ef4444',
			strokeWidth: 2.5
		},

		{
			points: lambdas.map((lambda, i) => [Math.log10(lambda), trainError[i]] as [number, number]),

			stroke: '#3b82f6',
			strokeWidth: 2.5
		}
	]);

	/* ------------------------------------------------------------------ */
	/* Optimal lambda                                                      */
	/* ------------------------------------------------------------------ */

	const optIdx = $derived.by(() => {
		let best = 0;

		for (let i = 1; i < cvResult.scores.length; i++) {
			if (cvResult.scores[i] < cvResult.scores[best]) {
				best = i;
			}
		}

		return best;
	});

	const optLambda = $derived(lambdas[optIdx]);

	const optLogLambda = $derived(Math.log10(optLambda));

	const vlines = $derived([
		{
			x: optLogLambda,
			stroke: '#22c55e',
			strokeWidth: 2,
			label: `λ* = ${optLambda.toFixed(3)}`,
			opacity: 0.8
		}
	]);

	const legend = [
		{
			label: 'Erreur validation (CV)',
			color: '#ef4444',
			kind: 'line' as const
		},
		{
			label: 'Erreur entraînement',
			color: '#3b82f6',
			kind: 'line' as const
		}
	];

	/* ------------------------------------------------------------------ */
	/* Axis domain                                                         */
	/* ------------------------------------------------------------------ */

	const xDomain = $derived([Math.log10(lambdas[0]), Math.log10(lambdas[lambdas.length - 1])] as [
		number,
		number
	]);
</script>

<div class="cv-selector">
	<div class="chart-area">
		<Figure type="chart">
			<CurveChart
				{curves}
				{xDomain}
				height={280}
				nTicks={6}
				yAxis={true}
				{vlines}
				{legend}
				chartLabel="Erreur quadratique"
			/>
		</Figure>
	</div>

	<!-- Optimal lambda -->
	<div class="opt-display">
		<span class="opt-label"> λ optimal : </span>

		<span class="opt-value">
			{optLambda.toFixed(4)}
		</span>

		<span class="opt-desc">
			(min erreur validation :
			{cvResult.scores[optIdx].toFixed(4)})
		</span>
	</div>

	<!-- Controls -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Modèle</div>

			<Slider bind:value={degree} min={1} max={maxDegree} step={1} label="Degré polynôme" />
		</div>

		<div class="grp">
			<div class="gttl">Validation croisée</div>

			<Slider bind:value={kFolds} min={2} max={10} step={1} label="K (folds)" unit="folds" />
		</div>

		<div class="grp">
			<div class="gttl">Données</div>

			<Slider bind:value={numSamples} min={30} max={300} step={10} label="Nombre d'échantillons" />
		</div>
	</SliderGrid>

	<p class="cap">
		La validation croisée sépare les données en plusieurs folds. Pour chaque valeur de
		<KatexInline formula="\\lambda" />, le modèle est entraîné sur une partie des données puis
		évalué sur les données restantes. La ligne verte indique la valeur de
		<KatexInline formula="\\lambda" />
		qui minimise l'erreur de validation. Quand
		<KatexInline formula="\\lambda" />
		est faible, le modèle est peu contraint et peut apprendre le bruit (surapprentissage). Quand
		<KatexInline formula="\\lambda" />
		est trop élevé, la régularisation rend le modèle trop simple (sous-ajustement). L'erreur d'entraînement
		augmente généralement avec la régularisation, car le modèle perd progressivement sa capacité à ajuster
		les données.
	</p>
</div>

<style>
	.cv-selector {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.opt-display {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.82rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface-2, transparent);
		border-radius: var(--radius-sm, 6px);
	}

	.opt-label {
		color: var(--color-text-muted);
		font-weight: 600;
	}
	.opt-value {
		font-family: 'SF Mono', monospace;
		font-size: 0.9rem;
		font-weight: 700;
		color: #22c55e;
	}
	.opt-desc {
		margin-left: auto;
		color: var(--color-text-muted);
		font-size: 0.78rem;
		text-align: right;
	}

	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.gttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
