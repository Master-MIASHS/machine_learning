<script lang="ts">
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { twoFactorData, twoWayAnovaDesign } from '$lib/math/linear-model.js';

	// F1 = pluie (non/oui), F2 = direction du vent (N/S/O) — l'exemple
	// « l'orientation du vent n'a pas le même effet avec ou sans pluie »
	// (ModèleLinéaire_ANOVA_ANCOVA.pdf, Interaction).
	const N_PER = 15;
	const SEED = 31;
	const f1Names = ['pluie : non', 'pluie : oui'];
	const f2Names = ['N', 'S', 'O'];

	let interaction = $state(true);

	const data = $derived(twoFactorData({ nPerCell: N_PER, iLevels: 2, jLevels: 3, interaction, seed: SEED }));

	// Moyennes par croisement (i = pluie, j = vent).
	const cellMeans = $derived.by(() => {
		const m: number[][] = [[], []];
		for (let i = 0; i < 2; i++)
			for (let j = 0; j < 3; j++) {
				const vals = data.y.filter((_, k) => data.iLevels[k] === i && data.jLevels[k] === j);
				m[i].push(vals.reduce((a, b) => a + b, 0) / vals.length);
			}
		return m;
	});

	const curves = $derived([
		{
			points: cellMeans[0].map((v, j) => [j, v] as [number, number]),
			stroke: 'var(--color-belief)',
			curve: 'linear' as const
		},
		{
			points: cellMeans[1].map((v, j) => [j, v] as [number, number]),
			stroke: 'var(--color-agent)',
			curve: 'linear' as const
		}
	]);
	const curveDots = $derived([
		...cellMeans[0].map((v, j) => ({ x: j, y: v, fill: 'var(--color-belief)' })),
		...cellMeans[1].map((v, j) => ({ x: j, y: v, fill: 'var(--color-agent)' }))
	]);

	// Aperçu de la matrice de design : une ligne par croisement (6 cellules).
	const designPreview = $derived.by(() => {
		const rows = twoWayAnovaDesign(data.iLevels, data.jLevels, interaction);
		return [0, 15, 30, 45, 60, 75].map((k) => ({
			label: `${f1Names[data.iLevels[k]]} × ${f2Names[data.jLevels[k]]}`,
			row: rows[k]
		}));
	});
	const colHeaders = $derived(
		interaction ? ['β0', 'α₂', 'β₁', 'β₂', 'γ₂₁', 'γ₂₂'] : ['β0', 'α₂', 'β₁', 'β₂']
	);
</script>

<div class="lm-inter">
	<p class="intro">
		Deux facteurs : la pluie (F1) et la direction du vent (F2). Sans interaction,
		l'effet du vent est le même avec ou sans pluie (droites parallèles) ; avec
		interaction γij, l'effet de l'un dépend de l'autre (droites qui se croisent).
	</p>

	<div class="controls">
		<Toggle checked={interaction} label="interaction F1 × F2" onchange={(v) => (interaction = v)} />
	</div>

	<div class="grid">
		<div class="panel">
			<h3>interaction plot — moyenne par croisement</h3>
			<CurveChart
				curves={curves}
				xDomain={[0, 2]}
				height={210}
				yAxis={true}
				nTicks={3}
				curveDots={curveDots}
				legend={[
					{ label: f1Names[0], color: 'var(--color-belief)' },
					{ label: f1Names[1], color: 'var(--color-agent)' }
				]}
			/>
			<p class="axisnote">axe horizontal : direction du vent (N, S, O)</p>
		</div>
		<div class="panel">
			<h3>matrice de design X (une ligne par croisement)</h3>
			<table>
				<thead>
					<tr>
						<th>cellule</th>
						{#each colHeaders as c (c)}
							<th>{c}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each designPreview as d, i (i)}
						<tr>
							<td class="cellname">{d.label}</td>
							{#each d.row as v, ci (i + '-' + ci)}
								<td>{v}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<Metrics>
		{#each cellMeans as row, i (i)}
			{#each row as m, j (i + '-' + j)}
				<div class="cell">
					<span class="label">{f1Names[i].replace('pluie : ', '')} × {f2Names[j]}</span>
					<span class="value">{m.toFixed(2)}</span>
				</div>
			{/each}
		{/each}
	</Metrics>

	<p class="caption">
		ModèleLinéaire_ANOVA_ANCOVA.pdf : sans interaction Yijk = β0 + αi + βj + εijk
		(additivité des effets principaux) ; avec interaction on ajoute γij avec les
		contraintes γi1 = γ1j = 0 — en R : Y ~ F1*F2. Mêmes seeds pour les deux modes :
		deux réalisations du modèle, à comparer par la forme des droites.
	</p>
</div>

<style>
	.lm-inter {
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

	.axisnote {
		margin: 0.4rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.panel :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
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

	td.cellname {
		color: var(--color-text-muted);
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
