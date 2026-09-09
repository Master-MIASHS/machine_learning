<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import { gaussianQuantile } from '$lib/math/gaussian.js';
	import {
		olsFit,
		simulateResidualScenario,
		standardizedResiduals,
		withIntercept,
		type ResidualScenario
	} from '$lib/math/linear-model.js';

	const N = 120;
	const SEED = 7;

	const scenarios: Array<{ key: ResidualScenario; label: string }> = [
		{ key: 'gaussian', label: 'gaussien (correct)' },
		{ key: 'quadratic', label: 'non-linéarité' },
		{ key: 'fan', label: 'hétéroscédasticité' },
		{ key: 'asymmetric', label: 'asymétrie' },
		{ key: 'autocorrelated', label: 'auto-corrélation' }
	];
	let scenario = $state<ResidualScenario>('gaussian');

	const data = $derived(simulateResidualScenario(N, scenario, SEED));
	const fit = $derived(olsFit(withIntercept(data.x.map((v) => [v])), data.y));

	const vsFitted = $derived(fit.residuals.map((e, i) => ({ x: fit.yHat[i], y: e })));
	const vsX = $derived(fit.residuals.map((e, i) => ({ x: data.x[i], y: e })));
	const vsTime = $derived(fit.residuals.map((e, i) => ({ x: i + 1, y: e })));

	// Q-Q plot : résidus standardisés triés vs quantiles de N(0,1) (SVG manuel —
	// fallback tant qu'aucune chart component ne dessine de Q-Q plot).
	const qq = $derived.by(() => {
		const r = standardizedResiduals(fit.residuals, fit.leverages, fit.sigma2);
		const sorted = [...r].sort((a, b) => a - b);
		const pts = sorted.map((v, i) => ({
			theo: gaussianQuantile((i + 0.5) / N),
			emp: v
		}));
		const d =
			Math.max(...pts.map((p) => Math.abs(p.theo)), ...pts.map((p) => Math.abs(p.emp))) + 0.2;
		return { pts, d };
	});

	const W = 300;
	const H = 220;
	const PAD = 30;
	const qxs = (v: number) => PAD + ((v + qq.d) / (2 * qq.d)) * (W - 2 * PAD);
	const qys = (v: number) => H - PAD - ((v + qq.d) / (2 * qq.d)) * (H - 2 * PAD);

	const N_BINS = 15;
	const histo = $derived.by(() => {
		const lo = Math.min(...fit.residuals),
			hi = Math.max(...fit.residuals);
		const w = (hi - lo) / N_BINS || 1;
		const counts = new Array<number>(N_BINS).fill(0);
		for (const e of fit.residuals) counts[Math.min(N_BINS - 1, Math.floor((e - lo) / w))]++;
		return {
			counts,
			centers: counts.map((_, i) => lo + (i + 0.5) * w)
		};
	});

	const reading = $derived.by((): string => {
		if (scenario === 'gaussian')
			return 'Nuage sans structure, symétrique, variance constante : rien ne contredit (H2) ni (H3) — le modèle est valide.';
		if (scenario === 'quadratic')
			return 'Résidus en « blocs » (courbe en U) : la vraie relation est non-linéaire — un terme quadratique manque au modèle.';
		if (scenario === 'fan')
			return 'Éventail : la variance des résidus croît avec x — hétéroscédasticité, (H2) est brisée (variance non constante).';
		if (scenario === 'asymmetric')
			return 'Distribution asymétrique (queue à droite) : plusieurs populations mélangées, ou une variable explicative importante manque.';
		return 'Blocs de résidus de même signe successifs dans le temps : auto-corrélation positive — typique des données temporelles (H2 brisée). Si les résidus alternaient positifs/négatifs, ce serait la signature d’une auto-corrélation négative.';
	});
</script>

<div class="lm-clinic">
	<p class="intro">
		Chaque pathologie des hypothèses d'erreur a sa <strong>signature visuelle</strong>
		dans les graphes de résidus. Choisissez un scénario : la moyenne des résidus reste nulle par construction,
		c'est la <em>structure</em> qui change.
	</p>

	<div class="controls">
		{#each scenarios as s (s.key)}
			<RadioButton value={s.key} label={s.label} bind:groupValue={scenario} />
		{/each}
	</div>
	<p class="reading">{reading}</p>

	<div class="grid4">
		<div class="panel">
			<h3>résidus vs valeurs ajustées</h3>
			<ScatterPlot
				points={vsFitted}
				domainX={[Math.min(...fit.yHat), Math.max(...fit.yHat)]}
				domainY={[Math.min(...fit.residuals) - 0.5, Math.max(...fit.residuals) + 0.5]}
				height={170}
				defaultColor="var(--color-belief)"
				defaultSize={2.5}
			/>
		</div>
		<div class="panel">
			<h3>résidus vs X</h3>
			<ScatterPlot
				points={vsX}
				domainX={[0, 10]}
				domainY={[Math.min(...fit.residuals) - 0.5, Math.max(...fit.residuals) + 0.5]}
				height={170}
				defaultColor="var(--color-belief)"
				defaultSize={2.5}
			/>
		</div>
		<div class="panel">
			<h3>résidus vs temps</h3>
			<ScatterPlot
				points={vsTime}
				domainX={[1, N]}
				domainY={[Math.min(...fit.residuals) - 0.5, Math.max(...fit.residuals) + 0.5]}
				height={170}
				defaultColor="var(--color-belief)"
				defaultSize={2.5}
			/>
		</div>
		<div class="panel">
			<h3>Q-Q plot des résidus standardisés</h3>
			<!-- SVG manuel : fallback tant qu'aucune chart component ne dessine de Q-Q plot. -->
			<svg
				viewBox={`0 0 ${W} ${H}`}
				class="qq"
				role="img"
				aria-label="Q-Q plot des résidus standardisés contre la normale"
			>
				<line
					x1={qxs(-qq.d)}
					y1={qys(-qq.d)}
					x2={qxs(qq.d)}
					y2={qys(qq.d)}
					stroke="var(--color-border)"
					stroke-width="1"
					stroke-dasharray="4 3"
				/>
				<line
					x1={PAD}
					y1={qys(0)}
					x2={W - PAD}
					y2={qys(0)}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				<line
					x1={qxs(0)}
					y1={PAD}
					x2={qxs(0)}
					y2={H - PAD}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				{#each qq.pts as p (p.theo + '-' + p.emp)}
					<circle
						cx={qxs(p.theo)}
						cy={qys(p.emp)}
						r="1.6"
						fill="var(--color-belief)"
						opacity="0.65"
					/>
				{/each}
				<text x={W / 2} y={H - 8} class="ax">quantiles théoriques N(0,1)</text>
				<text x={12} y={H / 2} class="ax" transform={`rotate(-90 12 ${H / 2})`}
					>résidus standardisés</text
				>
			</svg>
		</div>
	</div>

	<div class="panel hist">
		<h3>histogramme des résidus</h3>
		<BarChart
			values={histo.counts}
			labels={histo.centers.map((c) => c.toFixed(1))}
			yMax={Math.max(...histo.counts)}
			color="var(--color-agent)"
			height={150}
			showValues={false}
		/>
	</div>

	<p class="caption">
		8.validation_du_modele_lineaire_2025.pdf, §8.3–8.4 : un bon graphe de résidus est sans structure
		apparente (variance constante, indépendance, symétrie, pas de point influent). Les pathologies :
		asymétrie (populations mélangées / variable manquante), blocs (non-linéarité),
		hétéroscédasticité, auto-corrélation (blocs = auto-corrélation positive, alternance = négative).
		Pour n grand : lissage ksmooth()/lowess() + histogramme. Le Q-Q plot porte ici sur les résidus
		standardisés (l’EN BREF §8.6 préconise les résidus studentisés). n = 120, seedé.
	</p>
</div>

<style>
	.lm-clinic {
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

	.reading {
		margin: 0;
		padding: 0.6rem 0.9rem;
		border-left: 3px solid var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		color: var(--color-text);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.grid4 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
		gap: 1.25rem;
		align-items: start;
	}

	.panel {
		min-width: 0;
		display: grid;
		gap: 0.5rem;
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

	.qq {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.ax {
		font-size: 10px;
		fill: var(--color-text-muted);
		text-anchor: middle;
	}

	.hist :global(svg) {
		max-width: 480px;
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
