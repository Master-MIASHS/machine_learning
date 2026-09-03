<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import { generateKnnDataset, type Knn2DModel } from '$lib/math/consistency';
	import { kFoldIndices, knnCVAccuracyCurve, leavePOutCount } from '$lib/math/cross-validation';

	const DOMAIN = 3;
	const SCATTER_SIZE = 360;
	const MODEL: Knn2DModel = { radius: 2, temperature: 0.3 };
	const CANDIDATE_KS = Array.from({ length: 15 }, (_, index) => index + 1);
	const FOLD_COLORS = [
		'var(--color-belief)',
		'var(--color-positive)',
		'var(--color-epistemic)',
		'var(--color-neutral)',
		'var(--color-agent)',
		'var(--color-surprise)',
		'var(--color-evidence)',
		'var(--color-text-muted)'
	];

	let n = $state(100);
	let kFolds = $state(5);
	let selectedFold = $state(0);
	let leaveOutP = $state(2);

	const dataset = $derived(generateKnnDataset(n, MODEL, DOMAIN, 42));
	const folds = $derived(kFoldIndices(n, kFolds, 19));
	const maxCandidateK = $derived(Math.min(CANDIDATE_KS.length, n - Math.ceil(n / kFolds)));
	const candidateKs = $derived(CANDIDATE_KS.filter((candidateK) => candidateK <= maxCandidateK));

	$effect(() => {
		if (selectedFold >= kFolds) selectedFold = kFolds - 1;
	});

	const cvCurve = $derived(knnCVAccuracyCurve(dataset, candidateKs, kFolds, 23));
	const bestResult = $derived.by(() => {
		if (cvCurve.length === 0) return { k: 1, accuracy: 0 };
		return cvCurve.reduce((best, point) => (point.accuracy > best.accuracy ? point : best));
	});
	const errorCurve = $derived(
		cvCurve.map((point): [number, number] => [point.k, 1 - point.accuracy])
	);
	const bestError = $derived(1 - bestResult.accuracy);

	const foldOf = $derived.by(() => {
		const assignments = new Map<number, number>();
		folds.forEach((fold, foldIndex) => fold.forEach((index) => assignments.set(index, foldIndex)));
		return assignments;
	});

	const foldPoints = $derived(
		dataset.map((point, index) => ({
			x: point.x1,
			y: point.x2,
			group: foldOf.get(index) === selectedFold ? 'held-out' : `fold-${foldOf.get(index)}`
		}))
	);

	function foldColor(point: { group?: string | number }): string {
		const group = point.group;
		if (group === 'held-out') return 'var(--color-surprise)';
		if (typeof group !== 'string' || !group.startsWith('fold-')) return 'var(--color-text-muted)';
		return FOLD_COLORS[Number(group.slice(5)) % FOLD_COLORS.length];
	}

	function foldSize(point: { group?: string | number }): number {
		return point.group === 'held-out' ? 6 : 4;
	}

	const leavePCount = $derived(leavePOutCount(n, leaveOutP));
	const leaveOneOutCount = $derived(leavePOutCount(n, 1));

	function formatCombinationCount(count: number): string {
		return count >= 1_000_000 ? count.toExponential(2) : count.toLocaleString('fr-FR');
	}
</script>

<div class="cv-selector">
	<SliderGrid variant="outline">
		<Slider bind:value={n} min={40} max={180} step={10} label="Nombre d'observations n" />
		<Slider bind:value={kFolds} min={2} max={8} step={1} label="Nombre de folds K" />
		<Slider bind:value={selectedFold} min={0} max={kFolds - 1} step={1} label="Fold tenu à part" />
		<Slider
			bind:value={leaveOutP}
			min={1}
			max={Math.min(8, n - 1)}
			step={1}
			label="p dans leave-p-out"
		/>
	</SliderGrid>

	<div class="main-grid">
		<Figure type="chart">
			<CurveChart
				curves={[
					{ points: errorCurve, stroke: 'var(--color-surprise)', strokeWidth: 2.5, curve: 'linear' }
				]}
				xDomain={[1, maxCandidateK]}
				yDomain={[0, 1]}
				height={270}
				nTicks={Math.min(8, candidateKs.length)}
				nYTicks={5}
				yAxis={true}
				curveDots={[
					{
						x: bestResult.k,
						y: bestError,
						r: 6,
						fill: 'var(--color-positive)',
						stroke: 'var(--color-bg)',
						strokeWidth: 2
					}
				]}
				vlines={[
					{
						x: bestResult.k,
						stroke: 'var(--color-positive)',
						strokeDasharray: '4 3',
						label: `k* = ${bestResult.k}`
					}
				]}
				legend={[{ label: 'Erreur de validation croisée', color: 'var(--color-surprise)' }]}
				chartLabel="Erreur CV = 1 − précision"
			/>
		</Figure>

		<Figure type="chart">
			<ScatterPlot
				points={foldPoints}
				domainX={[-DOMAIN, DOMAIN]}
				domainY={[-DOMAIN, DOMAIN]}
				width={SCATTER_SIZE}
				height={SCATTER_SIZE}
				colorBy={foldColor}
				sizeBy={foldSize}
				showAxes={true}
				showLabels={false}
			/>
			{#snippet caption()}
				Le fold {selectedFold + 1} est tenu à part (rose) ; les autres folds servent à entraîner le modèle.
			{/snippet}
		</Figure>
	</div>

	<div class="best-result" aria-live="polite">
		<span class="result-label">Meilleur choix selon la validation croisée</span>
		<strong>k = {bestResult.k}</strong>
		<span>erreur CV : {(bestError * 100).toFixed(1)} %</span>
	</div>

	<div class="schemes-grid">
		<section class="scheme-card">
			<h3>Holdout</h3>
			<p>Une seule séparation entre un ensemble d'entraînement et un ensemble de validation.</p>
			<div class="scheme-visual">
				<span class="train-block"></span><span class="validation-block"></span>
			</div>
			<small>Rapide, mais dépend fortement du découpage choisi.</small>
		</section>

		<section class="scheme-card active-scheme">
			<h3>K-fold</h3>
			<p>Chaque observation est utilisée une fois pour valider et K − 1 fois pour entraîner.</p>
			<div class="mini-folds">
				{#each folds as fold, foldIndex}
					<span
						class:held-out={foldIndex === selectedFold}
						style:background={foldColor({ group: `fold-${foldIndex}` })}
						title={`Fold ${foldIndex + 1} : ${fold.length} observations`}
					></span>
				{/each}
			</div>
			<small>{kFolds} entraînements/validations, puis moyenne des erreurs.</small>
		</section>

		<section class="scheme-card">
			<h3>Leave-p-out</h3>
			<p>On réserve successivement p observations pour la validation.</p>
			<strong class="count"
				>C({n}, {leaveOutP}) = {Number.isFinite(leavePCount)
					? formatCombinationCount(leavePCount)
					: '∞'}</strong
			>
			<small>Le nombre de découpages croît rapidement avec p.</small>
		</section>

		<section class="scheme-card">
			<h3>Leave-one-out</h3>
			<p>Cas particulier de leave-p-out avec p = 1.</p>
			<strong class="count">C({n}, 1) = {leaveOneOutCount.toLocaleString('fr-FR')}</strong>
			<small>Il faut entraîner n modèles : coûteux, mais chaque observation est testée.</small>
		</section>
	</div>

	<p class="caption">
		La validation croisée estime l'erreur de généralisation pour comparer plusieurs valeurs de k. Le
		meilleur k est celui qui minimise l'erreur moyenne sur les observations tenues à part ; il est
		ensuite réentraîné sur toutes les données disponibles.
	</p>
</div>

<style>
	.cv-selector {
		display: grid;
		gap: 1rem;
	}
	.main-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
		gap: 1rem;
		align-items: start;
	}
	.main-grid :global(figure) {
		margin: 0;
	}
	.best-result {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
		padding: 0.8rem 1rem;
		border-left: 3px solid var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 8%, transparent);
	}
	.result-label {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}
	.best-result strong {
		color: var(--color-positive);
		font-family: var(--font-mono);
		font-size: 1.15rem;
	}
	.best-result span:last-child {
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}
	.schemes-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
	}
	.scheme-card {
		display: grid;
		gap: 0.5rem;
		padding: 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}
	.active-scheme {
		border-color: var(--color-belief);
	}
	.scheme-card h3 {
		margin: 0;
		color: var(--color-text);
		font-size: 0.95rem;
	}
	.scheme-card p,
	.scheme-card small {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8rem;
		line-height: 1.45;
	}
	.count {
		color: var(--color-surprise);
		font-family: var(--font-mono);
		font-size: 0.95rem;
	}
	.scheme-visual,
	.mini-folds {
		display: flex;
		height: 1.25rem;
		gap: 2px;
	}
	.scheme-visual span,
	.mini-folds span {
		flex: 1;
		border-radius: 3px;
	}
	.train-block {
		background: var(--color-belief);
	}
	.validation-block {
		background: var(--color-surprise);
	}
	.mini-folds span {
		opacity: 0.45;
	}
	.mini-folds span.held-out {
		opacity: 1;
		box-shadow: 0 0 0 2px var(--color-bg);
	}
	.caption {
		margin: 0;
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-epistemic);
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
		color: var(--color-text-muted);
		font-size: 0.82rem;
		line-height: 1.55;
	}
	@media (max-width: 850px) {
		.main-grid {
			grid-template-columns: 1fr;
		}
		.schemes-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 520px) {
		.schemes-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

