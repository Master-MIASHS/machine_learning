<script lang="ts">
	/**
	 * Démo « Évaluer un modèle avec l'AUC » (part2/lesson2).
	 *
	 * Scores synthétiques à deux classes (generateScoreSamples : N(0,1) vs
	 * N(separation,1)) ; la courbe ROC est tracée pour tous les seuils, avec
	 * le point d'exploitation courant (seuil α) et la matrice de confusion
	 * associée. AUC = aire sous la courbe (méthode des trapèzes), égale à
	 * P(score+ > score−) (testée dans roc.test.ts).
	 *
	 * « Classifieur parfait » (séparation 4) et « classifieur aléatoire »
	 * (séparation 0) matérialisent les deux cas limites des diapositives.
	 */
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		generateScoreSamples,
		rocCurve,
		rocPoint,
		aucTrapezoidal
	} from '$lib/math/roc';
	import { confusionMatrix } from '$lib/math/metrics';

	const DEFAULTS = { n: 100, separation: 1.5, threshold: 0 };

	let n = $state(DEFAULTS.n);
	let separation = $state(DEFAULTS.separation);
	let threshold = $state(DEFAULTS.threshold);

	const { scores, labels } = $derived(generateScoreSamples(n, separation, 42));

	const curve = $derived(rocCurve(scores, labels));
	const auc = $derived(aucTrapezoidal(curve));
	const operatingPoint = $derived(rocPoint(scores, labels, threshold));

	const confusion = $derived(
		confusionMatrix(
			scores.map((s, i): [0 | 1, 0 | 1] => [labels[i], s >= threshold ? 1 : 0])
		)
	);

	const rocLayer = $derived({
		points: curve.map((p): [number, number] => [p.fpr, p.tpr]),
		stroke: 'var(--color-belief)',
		strokeWidth: 2.5
	});
	const diagonalLayer = $derived({
		points: [
			[0, 0],
			[1, 1]
		] as [number, number][],
		stroke: 'var(--color-text-muted)',
		strokeWidth: 1.5,
		strokeDasharray: '6 4'
	});

	function reset(): void {
		n = DEFAULTS.n;
		separation = DEFAULTS.separation;
		threshold = DEFAULTS.threshold;
	}

	function perfectClassifier(): void {
		separation = 4;
		threshold = 1;
	}

	function randomClassifier(): void {
		separation = 0;
		threshold = 0;
	}

	const pct = (v: number): string => `${(v * 100).toFixed(1)} %`;
</script>

<div class="roc-demo">
	<!-- ════════════════ Metrics panel ═══════════════ -->
	<Metrics align="center">
		<div class="cell">
			<span class="label">AUC</span>
			<span class="value">{auc.toFixed(3)}</span>
		</div>
		<div class="cell">
			<span class="label">Seuil α</span>
			<span class="value">{threshold.toFixed(1)}</span>
		</div>
		<div class="cell">
			<span class="label">Sensibilité (TPR)</span>
			<span class="value">{pct(operatingPoint.tpr)}</span>
		</div>
		<div class="cell">
			<span class="label">Faux positifs (FPR)</span>
			<span class="value">{pct(operatingPoint.fpr)}</span>
		</div>
	</Metrics>

	<div class="roc-grid">
		<!-- ════════════════ ROC curve ═══════════════ -->
		<div class="curve-panel">
			<CurveChart
				curves={[rocLayer, diagonalLayer]}
				xDomain={[0, 1]}
				yDomain={[0, 1]}
				curve="linear"
				height={300}
				yAxis={true}
				nTicks={5}
				nYTicks={5}
				curveDots={[
					{
						x: operatingPoint.fpr,
						y: operatingPoint.tpr,
						r: 6,
						fill: 'var(--color-positive)',
						stroke: 'var(--color-bg)',
						strokeWidth: 2,
						bar: true,
						barFill: 'var(--color-positive)',
						barOpacity: 0.35
					}
				]}
				chartLabel={`AUC = ${auc.toFixed(3)}`}
				legend={[
					{ label: 'Courbe ROC', color: 'var(--color-belief)' },
					{ label: 'Classifieur aléatoire (AUC = 0,5)', color: 'var(--color-text-muted)', kind: 'dashed-line' }
				]}
			/>
		</div>

		<!-- ════════════════ Confusion matrix at threshold ═══════════════ -->
		<!--
			Tableau 2×2 fait main (fallback, pas HeatmapGrid) : même pattern que
			ConfusionMatrixMetricsDemo — en-têtes prédite/réelle + étiquettes TN/FP/FN/TP.
		-->
		<div class="matrix-panel">
			<div class="mp-title">Matrice de confusion au seuil α = {threshold.toFixed(1)}</div>
			<table class="cm-table">
				<caption class="sr-only">
					Matrice de confusion : classe prédite en lignes, classe réelle en colonnes
				</caption>
				<thead>
					<tr>
						<th class="corner" scope="col"><span class="sr-only">Classe prédite</span></th>
						<th scope="col">Réel 0</th>
						<th scope="col">Réel 1</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">Prédit 0</th>
						<td class="ok">
							<span class="tag">TN</span>
							<span class="count">{confusion.tn}</span>
						</td>
						<td class="err">
							<span class="tag">FN</span>
							<span class="count">{confusion.fn}</span>
						</td>
					</tr>
					<tr>
						<th scope="row">Prédit 1</th>
						<td class="err">
							<span class="tag">FP</span>
							<span class="count">{confusion.fp}</span>
						</td>
						<td class="ok">
							<span class="tag">TP</span>
							<span class="count">{confusion.tp}</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<!-- ════════════════ Presets ═══════════════ -->
	<div class="presets">
		<Button variant="outline" size="sm" onclick={reset}>Réinitialiser</Button>
		<Button variant="outline" size="sm" onclick={perfectClassifier}>Classifieur quasi parfait</Button>
		<Button variant="outline" size="sm" onclick={randomClassifier}>Classifieur aléatoire</Button>
	</div>

	<!-- ════════════════ Controls ═══════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Scores simulés</div>
			<Slider bind:value={n} min={20} max={300} step={20} label="Observations par classe" />
			<Slider bind:value={separation} min={0} max={4} step={0.1} label="Séparation des classes" />
		</div>
		<div class="grp">
			<div class="gttl">Règle de décision</div>
			<Slider bind:value={threshold} min={-3} max={7} step={0.1} label="Seuil α (prédit +1 si score ≥ α)" />
		</div>
	</SliderGrid>

	<!-- ════════════════ Caption ═══════════════ -->
	<p class="cap">
		Chaque point de la courbe ROC correspond à un seuil α : en abscisse le taux de faux
		positifs FPR, en ordonnée la sensibilité TPR. Le point coloré est le point d'exploitation
		courant (voir matrice de confusion). L'AUC (aire sous la courbe) est la probabilité qu'un
		score positif tiré au hasard dépasse un score négatif : 1 pour un classifieur parfait,
		0,5 pour un classifieur aléatoire (diagonale). C'est cette aire, calculée sur un jeu de
		validation, qui sert à comparer des modèles — pas un seuil en particulier.
	</p>
</div>

<style>
	.roc-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.roc-grid {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: 1.25rem;
		align-items: start;
	}

	@media (max-width: 800px) {
		.roc-grid {
			grid-template-columns: 1fr;
		}
	}

	.curve-panel {
		min-width: 0;
	}

	.matrix-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.mp-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: center;
	}

	.cm-table {
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}

	.cm-table th,
	.cm-table td {
		border: 1px solid var(--color-border);
		padding: 0.5rem 1.25rem;
		min-width: 4.5rem;
		text-align: center;
	}

	.cm-table thead th,
	.cm-table tbody th {
		color: var(--color-text-muted);
		font-weight: 600;
		background: var(--color-surface-2);
	}

	.cm-table .corner {
		border: none;
		background: none;
	}

	.cm-table td.ok {
		background: color-mix(in srgb, var(--color-positive) 16%, transparent);
	}

	.cm-table td.err {
		background: color-mix(in srgb, var(--color-surprise) 16%, transparent);
	}

	.cm-table .tag {
		display: block;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.cm-table .count {
		display: block;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
