<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import Minibar from '$lib/components/charts/Minibar.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { buildDecisionStump, permutationImportance } from '$lib/math/random-forest';
	import { mulberry32 } from '$lib/math/util';

	// ─── Constants ──────────────────────────────────────────────
	const N_TRAIN = 200;
	const N_TEST = 150;
	const D_FEATURES = 8; // fixed number of features for this demo
	const NUM_PERMS = 6; // permutations per feature for permutation importance

	// Seeded RNG: mulberry32 from $lib/math/util (shared, deterministic).

	function randn(rng: () => number): number {
		let u1 = rng(),
			u2 = rng();
		while (u1 === 0) u1 = rng();
		return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	function shuffle(arr: number[], rng: () => number): void {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}

	// ─── Synthetic data with k important features ──────────────
	function generateData(k: number, seed: number) {
		const rng = mulberry32(seed);
		const n = N_TRAIN + N_TEST;

		// Generate D_FEATURES independent Gaussian features
		const X: number[][] = Array.from({ length: n }, () =>
			Array.from({ length: D_FEATURES }, () => randn(rng))
		);

		// Target depends only on the first k features (logistic regression style)
		const weights = Array.from({ length: k }, (_, i) => 1.0 - i * 0.2); // decreasing signal strength

		const y = Array.from({ length: n }, (_v, i) => {
			let score = 0;
			for (let f = 0; f < k; f++) {
				score += weights[f] * X[i][f];
			}
			const prob = 1 / (1 + Math.exp(-score));
			return rng() < prob ? 1 : 0;
		});

		return { X, y };
	}

	// ─── Stump prediction helper ──────────────────────
	function predictStump(stump: ReturnType<typeof buildDecisionStump>, x: number[]): number {
		const raw = x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
		return Math.round(raw); // class 0 or 1
	}

	// ─── State ──────────────────────────────────────────────
	let kImportant = $state(3); // number of truly informative features
	let numTrees = $state(40); // forest size
	let method = $state<'impurity' | 'permutation'>('impurity');
	let dataSeed = $state(0);

	const K_MIN = 1;
	const K_MAX = D_FEATURES - 1; // keep at least one noise feature visible

	// ─── Derived: dataset ──────────────────────────────
	const allData = $derived(generateData(kImportant, dataSeed * 7919 + 42));

	const trainX = $derived(allData.X.slice(0, N_TRAIN));
	const trainY = $derived(allData.y.slice(0, N_TRAIN));
	const testX = $derived(allData.X.slice(N_TRAIN));
	const testY = $derived(allData.y.slice(N_TRAIN));

	// ─── Derived: forest of stumps ──────────────────────
	interface ForestStump {
		stump: ReturnType<typeof buildDecisionStump>;
		hue: number;
	}

	const forest = $derived.by(() => {
		const trees: ForestStump[] = [];
		for (let t = 0; t < numTrees; t++) {
			const rng = mulberry32(t * 1301 + dataSeed * 97);

			// Bootstrap sample from training data
			const bootIndices = Array.from({ length: N_TRAIN }, () => Math.floor(rng() * N_TRAIN));
			const bootX = bootIndices.map((i) => trainX[i]);
			const bootY = bootIndices.map((i) => trainY[i]);

			// Random feature subset (m ≈ √d for diversity)
			const m = Math.max(1, Math.round(Math.sqrt(D_FEATURES)));
			const allFeatures = Array.from({ length: D_FEATURES }, (_, i) => i);
			shuffle(allFeatures, rng);
			const selectedFeatures = allFeatures.slice(0, m);

			trees.push({
				stump: buildDecisionStump(bootX, bootY, selectedFeatures, true),
				hue: (t * 137.508) % 360
			});
		}
		return trees;
	});

	// ─── Forest predictor function ──────────────────────
	function predictForest(X: number[][]): number[] {
		return X.map((row) => {
			let votes1 = 0;
			for (const t of forest) {
				if (predictStump(t.stump, row) === 1) votes1++;
			}
			return votes1 > forest.length / 2 ? 1 : 0;
		});
	}

	// ─── Derived: impurity-based importance ──────────────
	const impurityImportance = $derived.by(() => {
		if (forest.length === 0) return new Array(D_FEATURES).fill(0);

		const scores = new Array(D_FEATURES).fill(0);

		for (const tree of forest) {
			const s = tree.stump;
			// The stump's Gini decrease (ΔImpureté, Définition 6.2) is attributed
			// to the feature it split on — the Mean Decrease Impurity score.
			// (Stumps here always come from buildDecisionStump, so the field is
			// set; `?? 0` guards the optional type only.)
			scores[s.featureIdx] += s.giniDecrease ?? 0;
		}

		// Normalize to [0, 1] by max total decrease
		const maxScore = Math.max(...scores);
		return scores.map((v) => (maxScore > 0 ? v / maxScore : 0));
	});

	// ─── Derived: permutation importance (auto-memoised by $derived) ──
	const permutationImportanceScores = $derived.by(() => {
		if (forest.length === 0) return new Array(D_FEATURES).fill(0);

		const raw = permutationImportance(predictForest, testX, testY, NUM_PERMS, dataSeed * 53 + 17);

		// Normalize: clamp negatives to 0, scale to [0, 1]
		const clamped = raw.map((v) => Math.max(0, v));
		const maxVal = Math.max(...clamped);
		if (maxVal > 0) return clamped.map((v) => v / maxVal);
		return new Array(D_FEATURES).fill(0);
	});

	// ─── Derived: active importance scores ──────────────
	const currentScores = $derived(
		method === 'impurity' ? impurityImportance : permutationImportanceScores
	);

	// ─── Derived: labels for BarChart (two-line) ──────
	const chartLabels = $derived(
		Array.from({ length: D_FEATURES }, (_, i) => ({
			primary: `x${i}`,
			secondary: i < kImportant ? 'important' : 'noise'
		}))
	);

	// ─── Derived: per-feature display colors ──────────────
	const featureColors = $derived(
		Array.from({ length: D_FEATURES }, (_, i) => {
			if (i < kImportant) return 'var(--color-positive)';
			return 'var(--color-text-muted)';
		})
	);

	// ─── Derived: metrics ──────────────────────────────
	const topFeatureIdx = $derived.by(() => {
		let best = 0;
		for (let i = 1; i < currentScores.length; i++) {
			if (currentScores[i] > currentScores[best]) best = i;
		}
		return best;
	});

	const topFeatureIsCorrect = $derived(topFeatureIdx < kImportant);

	const detectedImportant = $derived(
		currentScores.filter((v, i) => v > 0.3 && i < kImportant).length // true positives (thresholded)
	);

	const falsePositives = $derived(
		currentScores.filter((v, i) => v > 0.3 && i >= kImportant).length
	);

	// Pearson correlation between impurity and permutation methods
	const methodCorrelation = $derived.by(() => {
		const n = D_FEATURES;
		const meanI = impurityImportance.reduce((a, b) => a + b, 0) / n;
		const meanP =
			(permutationImportanceScores ?? new Array(D_FEATURES).fill(0)).reduce((a, b) => a + b, 0) / n;

		let cov = 0,
			stdI = 0,
			stdP = 0;
		for (let i = 0; i < n; i++) {
			const di = impurityImportance[i] - meanI;
			const dp = (permutationImportanceScores ?? new Array(D_FEATURES).fill(0))[i] - meanP;
			cov += di * dp;
			stdI += di * di;
			stdP += dp * dp;
		}

		const denom = Math.sqrt(stdI * stdP);
		return denom > 1e-9 ? cov / denom : 0;
	});

	// ─── Derived: BarChart yMax (slightly above max for breathing room) ──
	// ─── Controls ──────────────────────────────────────
	function regenerateData() {
		dataSeed += 1;
	}
</script>

<div class="demo-wrap">
	<!-- Header -->
	<div class="header">
		<h2>Importance des features — Random Forest</h2>
		<p class="subtitle">
			Correction de la feature selection. Deux méthodes: diminution moyenne d'impureté (Gini) et
			importance par permutation.
			{D_FEATURES} features au total, dont {kImportant} sont réellement informatives.
		</p>
	</div>

	<!-- Main bar chart -->
	<Figure type="chart">
		<div class="method-toggle-row">
			<Button
				variant={method === 'impurity' ? 'outline' : 'ghost'}
				size="sm"
				selected={method === 'impurity'}
				onclick={() => (method = 'impurity')}>Diminution d'impureté (Gini)</Button
			>
			<Button
				variant={method === 'permutation' ? 'outline' : 'ghost'}
				size="sm"
				selected={method === 'permutation'}
				onclick={() => (method = 'permutation')}>Importance par permutation</Button
			>
		</div>

		<BarChart
			values={currentScores}
			labels={chartLabels}
			color="var(--color-belief)"
			height={200}
			yMax={1.05}
			showValues={true}
			yTicks={[0, 0.25, 0.5, 0.75, 1]}
		/>

		{#snippet caption()}
			Méthode : {method === 'impurity'
				? "diminution d'impureté Gini (Σ Δ impureté par feature)"
				: 'importance par permutation (' + NUM_PERMS + ' permutations)'} | Top feature: x{topFeatureIdx}
			({(currentScores[topFeatureIdx] * 100).toFixed(0)}%)
		{/snippet}
	</Figure>

	<!-- Per-feature minibars with importance coloring -->
	<div class="minibar-section">
		{#each currentScores as score, i}
			<Minibar label={`x${i}`} value={score} max={1} color={featureColors[i]} showValue={true} />
		{/each}
	</div>

	<!-- Metrics Panel -->
	<Metrics align="center">
		<div class="cell">
			<span class="label">Top feature</span>
			<span
				class="value"
				style:color={topFeatureIsCorrect ? 'var(--color-positive)' : 'var(--color-surprise)'}
				>x{topFeatureIdx}</span
			>
			<span class="unit"
				>{topFeatureIsCorrect ? '✓ correct' : '✗ bruit détecté comme important'}</span
			>
		</div>

		<div class="cell">
			<span class="label">VP détectés</span>
			<span class="value" style:color="var(--color-positive)">{detectedImportant}</span>
			<span class="unit">/ {kImportant} véritables (seuil >30%)</span>
		</div>

		<div class="cell">
			<span class="label">Faux positifs</span>
			<span class="value" style:color="var(--color-surprise)">{falsePositives}</span>
			<span class="unit">bruits >30%</span>
		</div>

		<div class="cell">
			<span class="label">Corrélation méthodes</span>
			<span class="value" style:color="var(--color-belief)">{methodCorrelation.toFixed(2)}</span>
			<span class="unit">Gini ↔ permutation</span>
		</div>

		<div class="cell">
			<span class="label">Arbres</span>
			<span class="value" style:color="var(--color-text)">{numTrees}</span>
			<span class="unit">dans la forêt</span>
		</div>
	</Metrics>

	<!-- Controls -->
	<div class="controls-panel">
		<Slider
			bind:value={kImportant}
			min={K_MIN}
			max={K_MAX}
			step={1}
			label="Features informatives (k)"
		/>
		<Slider bind:value={numTrees} min={5} max={100} step={5} label="Nombre d'arbres" />

		<div class="actions-row">
			<Button variant="outline" size="sm" onclick={regenerateData}>🔄 Nouvelles données</Button>
			<span class="info-label"
				>{N_TRAIN + N_TEST} échantillons | {D_FEATURES} features | m ≈ √{D_FEATURES} = {Math.round(
					Math.sqrt(D_FEATURES)
				)}</span
			>
		</div>
	</div>

	<!-- Insight box -->
	<div class="insight-box">
		<span class="icon">📊</span>
		<p>
			La <strong>diminution d'impureté Gini</strong> mesure combien chaque feature contribue à
			séparer les classes — elle est rapide mais biaisée en faveur des features utilisées plus
			souvent. L'<strong>importance par permutation</strong> shuffle chaque feature et observe la
			dégradation de performance — c'est plus honnête car indépendant du processus de split, mais
			coûteux en calcul ({NUM_PERMS} permutations × {D_FEATURES} features). Quand les deux méthodes concordent
			(corr = {methodCorrelation.toFixed(2)}), on a une forte confiance dans le classement.
		</p>
	</div>
</div>

<style>
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
		max-width: 640px;
	}

	.subtitle {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	/* ─── Method toggle buttons inside Figure ────────────── */
	.method-toggle-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	/* ─── Minibar section ────────────────────────────── */
	.minibar-section {
		width: 100%;
		max-width: 640px;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
	}

	/* ─── Controls panel ────────────────────────────── */
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 640px;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.info-label {
		font-family: var(--font-mono, monospace);
		font-size: 0.72rem;
		color: var(--color-text-muted);
		margin-left: auto;
	}

	/* ─── Insight box ────────────────────────────── */
	.insight-box {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		padding: 0.65rem 1rem;
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		border-radius: 6px;
		width: 100%;
		max-width: 640px;
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
