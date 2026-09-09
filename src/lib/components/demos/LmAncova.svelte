<script lang="ts">
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { ancovaData, ancovaDesign, anovaDesign, olsFit } from '$lib/math/linear-model.js';

	// ANCOVA : facteur (3 niveaux) + régresseur x — ModèleLinéaire_ANOVA_ANCOVA.pdf,
	// diapo 11 : sans interaction Yjk = β0 + βj + δ·xjk (R: Y ~ X + F, droites
	// parallèles) ; avec interaction Yjk = β0 + βj + (δ + δj)·xjk (R: Y ~ X * F).
	// Données synthétiques seedées (les diapos ne donnent pas d'exemple chiffré).
	const K = 3;
	const N_PER = 14;
	const X_MAX = 10;
	const BETA0 = 2;
	const LEVEL_OFFSETS = [0, 1.5, -1]; // βj (niveau 1 = référence, offset 0)
	const SLOPE = 0.8;
	const DELTA_SLOPES = [0, -0.45, 0.4]; // δj, utilisés si interaction
	const SIGMA = 0.6;
	const SEED = 17;
	const levelNames = ['niveau 1', 'niveau 2', 'niveau 3'];
	const levelColors = ['var(--color-belief)', 'var(--color-agent)', 'var(--color-surprise)'];

	let interaction = $state(false);

	const data = $derived(
		ancovaData({
			nPerLevel: N_PER,
			levels: K,
			xMax: X_MAX,
			beta0: BETA0,
			alphas: LEVEL_OFFSETS,
			slope: SLOPE,
			deltaSlopes: interaction ? DELTA_SLOPES : undefined,
			sigma: SIGMA,
			seed: SEED
		})
	);

	const fit = $derived(olsFit(ancovaDesign(data.levels, data.x, interaction), data.y));
	// R² du modèle ANOVA seul (facteur sans le régresseur) : contribution de x.
	const fitFactorOnly = $derived(olsFit(anovaDesign(data.levels, 'treatment'), data.y));

	// Droites ajustées par niveau : design sur la grille {0, 10} pour les 3
	// niveaux (toujours avec le jeu COMPLET de niveaux — un design mono-niveau
	// aurait une dimension de colonnes fausse).
	const gridLevels = [0, 1, 2, 0, 1, 2];
	const gridX = [0, 0, 0, X_MAX, X_MAX, X_MAX];
	const gridDesign = $derived(ancovaDesign(gridLevels, gridX, interaction));
	const lineEnds = $derived.by(() => {
		const beta = fit.beta;
		return [0, 1, 2].map((j) => {
			const lo = gridDesign[j].reduce((s, v, c) => s + v * beta[c], 0);
			const hi = gridDesign[j + 3].reduce((s, v, c) => s + v * beta[c], 0);
			return [lo, hi] as [number, number];
		});
	});

	// Pente estimée par niveau : colonne δ (index 1 + (K−1)) + δj si interaction.
	const slopes = $derived.by(() => {
		const beta = fit.beta;
		const deltaIdx = 1 + (K - 1);
		const interIdx = 1 + (K - 1) + 1;
		return [0, 1, 2].map((j) => beta[deltaIdx] + (j >= 1 && interaction ? beta[interIdx + (j - 1)] : 0));
	});

	const points = $derived(
		data.x.map((xi, i) => ({ x: xi, y: data.y[i], group: data.levels[i] }))
	);

	// Domaines : x fixe, y calé sur les données et les droites (marge 12 %).
	const domainX = $derived.by((): [number, number] => [0, X_MAX]);
	const domainY = $derived.by((): [number, number] => {
		const all = [...data.y, ...lineEnds.flat()];
		const lo = Math.min(...all),
			hi = Math.max(...all);
		const pad = (hi - lo) * 0.12 || 1;
		return [lo - pad, hi + pad];
	});

	// Projection miroir de ScatterPlot (pad = 4, voir charts/ScatterPlot.svelte)
	// pour tracer les droites ajustées dans le snippetOverlay.
	const W = 420;
	const H = 300;
	const PAD = 4;
	const projX = (v: number): number => PAD + ((v - domainX[0]) / (domainX[1] - domainX[0])) * (W - 2 * PAD);
	const projY = (v: number): number => PAD + ((domainY[1] - v) / (domainY[1] - domainY[0])) * (H - 2 * PAD);
</script>

<div class="lm-ancova">
	<p class="intro">
		Un facteur (3 niveaux) <strong>et</strong> un régresseur x. Sans interaction, le facteur ne
		décale que l'intercept : les droites sont <strong>parallèles</strong>. Avec interaction,
		chaque niveau a sa pente.
	</p>

	<div class="controls">
		<Toggle checked={interaction} label="interaction facteur × x" onchange={(v) => (interaction = v)} />
	</div>

	<div class="grid">
		<div class="panel">
			<h3>{interaction ? 'Y ~ x * F — pentes propres à chaque niveau' : 'Y ~ x + F — droites parallèles'}</h3>
			<ScatterPlot
				{points}
				{domainX}
				{domainY}
				width={W}
				height={H}
				defaultSize={4}
				colorBy={(d) => levelColors[d.group as number] ?? 'var(--color-belief)'}
			>
				{#snippet snippetOverlay()}
					<g pointer-events="none">
						{#each lineEnds as [lo, hi], j (j)}
							<line
								x1={projX(0)}
								y1={projY(lo)}
								x2={projX(X_MAX)}
								y2={projY(hi)}
								stroke={levelColors[j]}
								stroke-width="2.5"
							/>
						{/each}
					</g>
				{/snippet}
			</ScatterPlot>
			<div class="legend">
				{#each levelNames as name, j (j)}
					<span class="chip">
						<i class="swatch" style="background: {levelColors[j]}"></i>
						{name}
					</span>
				{/each}
			</div>
		</div>
		<div class="panel">
			<h3>ajustement MCO par niveau</h3>
			<table>
				<thead>
					<tr>
						<th>niveau</th>
						<th>valeur à x = 0</th>
						<th>pente</th>
					</tr>
				</thead>
				<tbody>
					{#each levelNames as name, j (j)}
						<tr>
							<td class="cellname">
								<span class="dot" style="background: {levelColors[j]}"></span>
								{name}
							</td>
							<td>{lineEnds[j][0].toFixed(2)}</td>
							<td>{slopes[j].toFixed(2)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<Metrics>
				<div class="cell">
					<span class="label">R² — modèle {interaction ? 'avec interaction' : 'parallèle'}</span>
					<span class="value">{fit.rSquared.toFixed(3)}</span>
				</div>
				<div class="cell">
					<span class="label">R² — facteur seul (sans x)</span>
					<span class="value">{fitFactorOnly.rSquared.toFixed(3)}</span>
				</div>
			</Metrics>
		</div>
	</div>

	<p class="caption">
		ModèleLinéaire_ANOVA_ANCOVA.pdf (diapo 11) : sans interaction, l'effet du facteur n'a un impact
		que sur l'intercept (R : <code>Y ~ x + F</code>) ; avec interaction, sur l'intercept
		<strong>et</strong> la pente (R : <code>Y ~ x * F</code>). Données synthétiques seedées — les
		diapos ne fournissent pas d'exemple chiffré ; les droites sont l'ajustement MCO.
	</p>
</div>

<style>
	.lm-ancova {
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

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.9rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.swatch {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 999px;
		display: inline-block;
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
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--color-text);
		font-size: 0.75rem;
	}

	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		display: inline-block;
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
