<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { swiss, responseVector, designMatrix } from '$lib/data/linear-regression.js';
	import { olsFit, adjustedRSquared } from '$lib/math/linear-model.js';

	const y = responseVector(swiss);
	const n = y.length;
	const regNames = ['Agriculture', 'Education', 'Catholic', 'InfantMortality'];
	const allRows = designMatrix(swiss); // [1, agri, educ, catho, imm]

	let flags = $state([true, true, true, true]);
	const p = $derived(flags.filter(Boolean).length);

	const fit = $derived.by(() => {
		const X = allRows.map((row) => [row[0], ...[row[1], row[2], row[3], row[4]].filter((_, j) => flags[j])]);
		return olsFit(X, y);
	});

	const barValues = $derived([fit.sseExplained, fit.sse, fit.sst]);
	const barLabels = $derived([
		{ primary: 'SCE', secondary: 'expliquée' },
		{ primary: 'SCR', secondary: 'résiduelle' },
		{ primary: 'SCT', secondary: 'totale' }
	]);
</script>

<div class="lm-ss">
	<p class="intro">
		Jeu de données <code>swiss</code> (47 cantons francophones, fécondité en 1888) :
		incluez ou excluez des régresseurs et comparez les sommes de carrés SCE, SCR, SCT
		ainsi que R² et R² ajusté.
	</p>

	<div class="controls">
		{#each regNames as name, i (name)}
			<Toggle checked={flags[i]} label={name} onchange={(v) => (flags[i] = v)} />
		{/each}
	</div>

	<div class="grid">
		<div class="panel">
			<h3>décomposition SCT = SCE + SCR</h3>
			<BarChart values={barValues} labels={barLabels} yMax={fit.sst} color="var(--color-belief)" height={190} />
		</div>
		<div class="panel">
			<h3>qualité d'ajustement</h3>
			<p class="r2line">
				R² = <strong>{fit.rSquared.toFixed(4)}</strong>
			</p>
			<p class="r2line">
				R² ajusté = <strong>{adjustedRSquared(fit.rSquared, n, p).toFixed(4)}</strong>
			</p>
			<p class="note">
				R² ne diminue jamais quand on ajoute un régresseur ; R² ajusté le pénalise
				(terme (n−1)/(n−p−1)).
			</p>
		</div>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">n</span>
			<span class="value">{n}</span>
		</div>
		<div class="cell">
			<span class="label">p (régresseurs)</span>
			<span class="value">{p}</span>
		</div>
		<div class="cell">
			<span class="label">SCE</span>
			<span class="value">{fit.sseExplained.toFixed(1)}</span>
		</div>
		<div class="cell">
			<span class="label">SCR</span>
			<span class="value">{fit.sse.toFixed(1)}</span>
		</div>
		<div class="cell">
			<span class="label">SCT</span>
			<span class="value">{fit.sst.toFixed(1)}</span>
		</div>
	</Metrics>

	<p class="caption">
		StatM1S1_2025.pdf, §I.5 : SCR = ‖Y − Ŷ‖², SCE = ‖Ŷ − ȳ1‖², SCT = ‖Y − ȳ1‖², avec
		SCT = SCE + SCR et R² = SCE/SCT. Le modèle complet (4 régresseurs) donne
		R² ajusté = 0.6707 (tableau p. 5 du PDF).
	</p>
</div>

<style>
	.lm-ss {
		display: grid;
		gap: 1rem;
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
		gap: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
		gap: 1.25rem;
		align-items: start;
	}

	.panel {
		min-width: 0;
	}

	.panel h3 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.panel :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}

	.r2line {
		margin: 0.25rem 0;
		font-size: 0.9375rem;
	}

	.note {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.5;
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
