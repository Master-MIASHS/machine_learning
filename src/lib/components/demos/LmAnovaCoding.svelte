<script lang="ts">
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { gaussianSample } from '$lib/math/gaussian.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';
	import { anovaDesign, olsFit, type FactorCoding } from '$lib/math/linear-model.js';

	// Facteur « direction du vent » à 3 niveaux (ex. ANOVA des sources),
	// 8 observations par niveau ; moyennes 15/25/35 + N(0, 3²), seedé.
	const LEVELS = [0, 1, 2];
	const N_PER = 8;
	const TRUE_MEANS = [15, 25, 35];
	const rng = mulberry32(combineSeed(41, 1));
	const levels: number[] = [];
	const y: number[] = [];
	for (const lvl of LEVELS)
		for (let k = 0; k < N_PER; k++) {
			levels.push(lvl);
			y.push(TRUE_MEANS[lvl] + gaussianSample({ mu: 0, sigma2: 9 }, rng));
		}
	const N = y.length;
	const levelNames = ['N (nord)', 'S (sud)', 'O (ouest)'];

	let coding = $state<FactorCoding>('none');

	const fit = $derived(olsFit(anovaDesign(levels, coding), y));

	const colNames = $derived.by((): string[] => {
		if (coding === 'none') return ['β̂_N', 'β̂_S', 'β̂_O'];
		if (coding === 'treatment') return ['β̂0 (réf. N)', 'β̂1 (S − N)', 'β̂2 (O − N)'];
		return ['β̂0 (moy. générale)', 'β̂1', 'β̂2'];
	});

	// Moyenne par niveau : issue des données (invariante) et ajustée Xβ̂ (invariante).
	const dataMeans = LEVELS.map((lvl) => {
		const vals = y.filter((_, i) => levels[i] === lvl);
		return vals.reduce((a, b) => a + b, 0) / vals.length;
	});
	const fittedMeans = LEVELS.map((lvl) => fit.yHat[lvl * N_PER]);

	// Expression de la moyenne du niveau j en fonction des β̂, selon le codage.
	const meanExpr = (lvl: number): string => {
		if (coding === 'none') return `β̂${'NSO'[lvl]}`;
		if (coding === 'treatment') return lvl === 0 ? 'β̂0' : `β̂0 + β̂${lvl}`;
		if (lvl === 0) return 'β̂0 + β̂1';
		if (lvl === 1) return 'β̂0 + β̂2';
		return 'β̂0 − β̂1 − β̂2';
	};

	const designPreview = $derived(anovaDesign(levels, coding).slice(0, 6));

	const interpretation = $derived.by((): string => {
		if (coding === 'none')
			return 'Sans intercept (β0 = 0) : chaque β̂ est directement la moyenne de la réponse dans son niveau.';
		if (coding === 'treatment')
			return 'Niveau de référence (R : contr.treatment) : β̂0 = moyenne du niveau N, β̂j = écart du niveau j à la référence.';
		return 'Somme des paramètres (R : contr.sum) : β̂0 = moyenne générale, et la somme des β̂ « effets » vaut 0.';
	});
</script>

<div class="lm-anova">
	<p class="intro">
		Trois façons de coder un facteur à 3 niveaux pour que X soit de plein rang : les
		moyennes par niveau (et l'ajustement) restent identiques, seules l'interprétation
		des β̂ et la matrice X changent.
	</p>

	<div class="controls">
		<RadioButton value="none" label="sans intercept" groupValue={coding} />
		<RadioButton value="treatment" label="niveau de référence" groupValue={coding} />
		<RadioButton value="sum" label="somme des paramètres" groupValue={coding} />
	</div>

	<p class="interp">{interpretation}</p>

	<div class="grid">
		<div class="panel">
			<h3>matrice de design X (6 premières lignes sur {N})</h3>
			<table>
				<thead>
					<tr>
						<th></th>
						{#each colNames as c (c)}
							<th>{c}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each designPreview as row, i (i)}
						<tr>
							<td class="lvl">{levels[i]} · y = {y[i].toFixed(1)}</td>
							{#each row as v (v + '-' + i)}
								<td>{v}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="panel">
			<h3>moyennes par niveau</h3>
			<table>
				<thead>
					<tr>
						<th>niveau</th>
						<th>moyenne (données)</th>
						<th>ajustée (Xβ̂)</th>
						<th>expression en β̂</th>
					</tr>
				</thead>
				<tbody>
					{#each LEVELS as lvl, li (li)}
						<tr>
							<td>{levelNames[lvl]}</td>
							<td>{dataMeans[lvl].toFixed(2)}</td>
							<td>{fittedMeans[lvl].toFixed(2)}</td>
							<td class="expr">{meanExpr(lvl)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<Metrics>
		{#each fit.beta as b, j (j)}
			<div class="cell">
				<span class="label">{colNames[j]}</span>
				<span class="value">{b.toFixed(2)}</span>
			</div>
		{/each}
	</Metrics>

	<p class="caption">
		ModèleLinéaire_ANOVA_ANCOVA.pdf, « Les contraintes dans les modèles d'ANOVA » :
		β̂ = (XᵀX)⁻¹XᵀY exige rang(X) = p ; les trois codages donnent le même ajustement
		(mêmes moyennes par niveau) mais des paramètres non uniques — c'est la contrainte
		qui choisit l'interprétation.
	</p>
</div>

<style>
	.lm-anova {
		display: grid;
		gap: 1rem;
	}

	.intro,
	.interp {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.interp {
		padding: 0.6rem 0.9rem;
		border-left: 3px solid var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		color: var(--color-text);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
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

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		padding: 0.3rem 0.5rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
	}

	td.lvl {
		color: var(--color-text-muted);
	}

	td.expr {
		font-family: var(--font-mono, monospace);
		font-size: 0.75rem;
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
