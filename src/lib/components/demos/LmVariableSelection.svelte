<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import {
		adjustedRSquared,
		aic,
		backwardSelection,
		bestSubset,
		bic,
		forwardSelection,
		mallowCp,
		olsFit,
		selectionProblem,
		stepwiseBoth,
		type SelectionCriterion
	} from '$lib/math/linear-model.js';

	const { X, y, trueSupport } = selectionProblem(7);
	const n = X.length;
	const p = X[0].length - 1;
	const names = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8'];

	const yMean = y.reduce((a, b) => a + b, 0) / n;
	const sst = y.reduce((a, v) => a + (v - yMean) ** 2, 0);
	const sigma2Full = $derived(olsFit(X, y).sigma2);

	type CritKey = 'cp' | 'aic' | 'bic' | 'r2adj';
	const critLabels: Record<CritKey, string> = {
		cp: 'Cp de Mallows',
		aic: 'AIC',
		bic: 'BIC',
		r2adj: 'R² ajusté'
	};
	let critKey = $state<CritKey>('aic');

	const criterion = $derived.by((): SelectionCriterion => {
		switch (critKey) {
			case 'cp':
				return (rss, nn, k) => mallowCp(rss, nn, k, sigma2Full);
			case 'aic':
				return aic;
			case 'bic':
				return bic;
			case 'r2adj':
				return (rss, nn, k) => -adjustedRSquared(1 - rss / sst, nn, k - 1);
		}
	});

	const results = $derived.by(() => {
		const c = criterion;
		return {
			bs: bestSubset(X, y, c),
			fwd: forwardSelection(X, y, c),
			bwd: backwardSelection(X, y, c),
			both: stepwiseBoth(X, y, c)
		};
	});

	const curve = $derived(results.bs.perSize.map((r) => [r.size, r.value] as [number, number]));

	const fmt = (v: number) => (Math.abs(v) >= 10000 ? v.toExponential(2) : v.toFixed(2));
</script>

<div class="lm-sel">
	<p class="intro">
		Problème simulé seedé :
		<KatexInline formula={String.raw`n = 100`} />,
		<KatexInline formula={String.raw`p = 8`} /> prédicteurs —
		<strong>x1, x2, x3</strong> sont réellement liés à
		<KatexInline formula="Y" /> ; <strong>x4</strong> est nulle mais corrélée avec
		x1 (<KatexInline formula={String.raw`\rho \approx 0{,}9`} />) ; x5–x8 sont du bruit
		pur. Quatre algorithmes cherchent le meilleur sous-ensemble selon le critère
		choisi.
	</p>

	<div class="controls">
		{#each Object.entries(critLabels) as [key, label] (key)}
			<RadioButton value={key} label={label} groupValue={critKey} />
		{/each}
	</div>

	<div class="panel">
		<h3>meilleure valeur du critère vs taille du sous-ensemble (best-subset)</h3>
		<CurveChart
			curves={[{ points: curve, stroke: 'var(--color-belief)', curve: 'linear' }]}
			xDomain={[0, p]}
			height={180}
			chartLabel={critLabels[critKey]}
		/>
	</div>

	<div class="grid4">
		<div class="algo">
			<h3>best-subset (exhaustif)</h3>
			<div class="chips">
				{#each names as name, j (name)}
					<span class="chip" class:sel={results.bs.best.subset.includes(j)} class:truth={trueSupport.includes(j)} class:corr={j === 3}>{name}</span>
				{/each}
			</div>
			<p class="meta">
				{2 ** p} modèles évalués · {critLabels[critKey]} = {fmt(results.bs.best.value)}
			</p>
		</div>
		<div class="algo">
			<h3>avant (forward)</h3>
			<div class="chips">
				{#each names as name, j (name)}
					<span class="chip" class:sel={results.fwd.best.includes(j)} class:truth={trueSupport.includes(j)} class:corr={j === 3}>{name}</span>
				{/each}
			</div>
			<p class="meta">
				{results.fwd.steps.length} étapes · {critLabels[critKey]} = {fmt(results.fwd.steps[results.fwd.steps.length - 1].value)}
			</p>
		</div>
		<div class="algo">
			<h3>arrière (backward)</h3>
			<div class="chips">
				{#each names as name, j (name)}
					<span class="chip" class:sel={results.bwd.best.includes(j)} class:truth={trueSupport.includes(j)} class:corr={j === 3}>{name}</span>
				{/each}
			</div>
			<p class="meta">
				{results.bwd.steps.length} étapes · {critLabels[critKey]} = {fmt(results.bwd.steps[results.bwd.steps.length - 1].value)}
			</p>
		</div>
		<div class="algo">
			<h3>both (pas à pas double)</h3>
			<div class="chips">
				{#each names as name, j (name)}
					<span class="chip" class:sel={results.both.best.includes(j)} class:truth={trueSupport.includes(j)} class:corr={j === 3}>{name}</span>
				{/each}
			</div>
			<p class="meta">
				{results.both.steps.length} étapes · {critLabels[critKey]} = {fmt(results.both.steps[results.both.steps.length - 1].value)}
			</p>
		</div>
	</div>

	<p class="legend">
		<span class="chip sel truth">x1</span> sélectionnée, vraie ·
		<span class="chip corr">x4</span> nulle mais corrélée avec x1 ·
		<span class="chip">x5</span> bruit
	</p>

	<Metrics>
		<div class="cell">
			<span class="label">nombre de modèles (2^p)</span>
			<span class="value">{2 ** p}</span>
		</div>
		<div class="cell">
			<span class="label">vrai support</span>
			<span class="value">{trueSupport.map((j) => names[j]).join(', ')}</span>
		</div>
		<div class="cell">
			<span class="label">best-subset</span>
			<span class="value">{results.bs.best.subset.map((j) => names[j]).join(', ') || '∅'}</span>
		</div>
		<div class="cell">
			<span class="label">forward / backward / both</span>
			<span class="value">
				{results.fwd.best.map((j) => names[j]).join(', ') || '∅'} /
				{results.bwd.best.map((j) => names[j]).join(', ') || '∅'} /
				{results.both.best.map((j) => names[j]).join(', ') || '∅'}
			</span>
		</div>
	</Metrics>

	<p class="caption">
		9.choix_de_modele.pdf, « Recherche exhaustive » et « Sélection pas à pas » : le
		best-subset évalue tous les 2^p modèles (algorithme Leaps and Bound, impossible
		dès p &gt; 30) ; forward / backward / both sont <strong>gloutons</strong> (biais
		important, variance/complexité contrôlée ; backward ne fonctionne pas si n &lt; p).
		Les algorithmes gloutons peuvent manquer le meilleur sous-ensemble et la
		corrélation entre prédicteurs perturbe la sélection (x4 peut être retenue à la
		place ou en plus de x1) — cf. leçon 4. Seed 7.
	</p>
</div>

<style>
	.lm-sel {
		display: grid;
		gap: 1.25rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.panel {
		min-width: 0;
		display: grid;
		gap: 0.6rem;
	}

	.panel h3 {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.panel :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}

	.grid4 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
		gap: 1rem;
	}

	.algo {
		display: grid;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.algo h3 {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.chip {
		font-size: 0.75rem;
		padding: 0.1rem 0.45rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		color: var(--color-text-muted);
	}

	.chip.sel {
		background: color-mix(in srgb, var(--color-belief) 25%, transparent);
		border-color: var(--color-belief);
		color: var(--color-text);
		font-weight: 600;
	}

	.chip.truth {
		border-style: solid;
		border-color: var(--color-positive);
	}

	.chip.corr {
		border-style: dashed;
		border-color: var(--color-surprise);
	}

	.meta {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.legend {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}

	.legend .chip {
		font-size: 0.7rem;
	}

	.caption {
		margin: 0;
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-epistemic);
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
</style>
