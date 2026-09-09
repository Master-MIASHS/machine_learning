<script lang="ts">
	import DensityChart from '$lib/components/charts/DensityChart.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { designMatrix, responseVector, longley } from '$lib/data/linear-regression.js';
	import {
		anovaTable,
		nestedFTest,
		olsFit,
		tConfidenceInterval,
		tDensity,
		tQuantile
	} from '$lib/math/linear-model.js';

	// ── Panneau A : test de Student sur longley (StatM1S1_2025.pdf, §6.5) ──
	const fit = olsFit(designMatrix(longley), responseVector(longley));
	const coefs = [
		{ j: 0, label: 'β0 (constante)' },
		{ j: 1, label: 'β1 (PNB)' },
		{ j: 2, label: 'β2 (Pop)' }
	];
	let coefIdx = $state(1);
	const alphaA = 0.05;

	const tObs = $derived(fit.tStats[coefIdx]);
	const tCrit = $derived(tQuantile(1 - alphaA / 2, fit.dfResidual));
	const ic = $derived(
		tConfidenceInterval(fit.beta[coefIdx], fit.seBeta[coefIdx], alphaA, fit.dfResidual)
	);
	const rejected = $derived(Math.abs(tObs) > tCrit);

	const tCurve = $derived.by(() =>
		Array.from({ length: 301 }, (_, i) => {
			const t = -6 + (12 * i) / 300;
			return [t, tDensity(t, fit.dfResidual)] as [number, number];
		})
	);

	// ── Panneau B : test emboîté Fq avec paramètres libres ──
	let nB = $state(20);
	let pB = $state(3);
	let qB = $state(1);
	let r2 = $state(0.8);
	let rq2 = $state(0.5);
	const alphaB = 0.05;

	const nested = $derived(
		nestedFTest(r2, Math.min(rq2, r2 - 1e-9), Math.min(qB, pB), nB, pB, alphaB)
	);
	const sqrtF = $derived(Math.sqrt(nested.f));
	const rejectB = $derived(nested.f > nested.critical);

	// Tableau d'ANOVA de longley (StatM1S1_2025.pdf, §6.6).
	const anova = $derived(anovaTable(fit));
</script>

<div class="lm-stfish">
	<p class="intro">
		Deux tests liés : le test de Student (un coefficient à la fois) et le test F emboîté (q
		coefficients à la fois). Quand <KatexInline formula="q = 1" />, le test F n'est rien d'autre que
		le test de Student au carré : <KatexInline formula="F = T²" />.
	</p>

	<div class="panel">
		<h3>test de Student sur longley (n = 8, ddl = 5)</h3>
		<div class="controls">
			{#each coefs as c (c.j)}
				<RadioButton value={c.j} label={c.label} bind:groupValue={coefIdx} />
			{/each}
		</div>
		<DensityChart
			curves={[
				{
					points: tCurve,
					stroke: 'var(--color-surprise)',
					fill: 'var(--color-surprise)',
					fillOpacity: 0.08,
					curve: 'basis'
				}
			]}
			xDomain={[-6, 6]}
			vlines={[
				{ x: -tCrit, stroke: 'var(--color-negative, #e5484d)', label: '−t₅' },
				{ x: tCrit, stroke: 'var(--color-negative, #e5484d)', label: 't₅' }
			]}
			observations={[{ x: tObs, stroke: 'var(--color-belief)', label: `T = ${tObs.toFixed(2)}` }]}
			height={190}
		/>
		<Metrics>
			<div class="cell">
				<span class="label">T observée</span>
				<span class="value">{tObs.toFixed(3)}</span>
			</div>
			<div class="cell">
				<span class="label">seuil t₅(97,5 %)</span>
				<span class="value">{tCrit.toFixed(5)}</span>
			</div>
			<div class="cell">
				<span class="label">IC 95 %</span>
				<span class="value">[{ic[0].toFixed(4)} ; {ic[1].toFixed(4)}]</span>
			</div>
			<div class="cell">
				<span class="label">conclusion (α = 5 %)</span>
				<span class="value">{rejected ? 'rejeter H0' : 'ne pas rejeter H0'}</span>
			</div>
		</Metrics>
	</div>

	<div class="panel">
		<h3>test emboîté Fq = ((R² − Rq²)/q) / ((1 − R²)/(n − p − 1))</h3>
		<div class="controls">
			<div class="control-group">
				<div class="control-row">
					<Slider min={8} max={100} step={1} bind:value={nB} label="n" />
				</div>
				<div class="control-row">
					<Slider min={1} max={6} step={1} bind:value={pB} label="p (régr. plein)" />
				</div>
			</div>
			<div class="control-group">
				<div class="control-row">
					<Slider min={1} max={6} step={1} bind:value={qB} label="q (testés = 0)" />
				</div>
				<div class="control-row">
					<Slider min={0.5} max={0.99} step={0.01} bind:value={r2} label="R² (plein)" />
				</div>
			</div>
			<div class="control-group">
				<div class="control-row">
					<Slider min={0} max={0.99} step={0.01} bind:value={rq2} label="Rq² (réduit)" />
				</div>
			</div>
		</div>
		<Metrics>
			<div class="cell">
				<span class="label">Fq observé</span>
				<span class="value">{nested.f.toFixed(3)}</span>
			</div>
			<div class="cell">
				<span class="label">F critique F{nested.d1},{nested.d2}(95 %)</span>
				<span class="value">{nested.critical.toFixed(3)}</span>
			</div>
			<div class="cell">
				<span class="label">conclusion (α = 5 %)</span>
				<span class="value">{rejectB ? 'rejeter H0' : 'ne pas rejeter H0'}</span>
			</div>
			{#if qB === 1}
				<div class="cell">
					<span class="label">q = 1 : √F (= |T|)</span>
					<span class="value">{sqrtF.toFixed(3)}</span>
				</div>
			{/if}
		</Metrics>
	</div>

	<div class="panel">
		<h3>tableau d'analyse de variance — longley (StatM1S1_2025.pdf, p. 33)</h3>
		<table>
			<thead>
				<tr>
					<th>source de variation</th>
					<th>d.d.l</th>
					<th>somme des carrés</th>
					<th>variance</th>
					<th>F-statistique</th>
				</tr>
			</thead>
			<tbody>
				{#each anova as row (row.source)}
					<tr>
						<td>{row.source}</td>
						<td>{row.df}</td>
						<td>{row.ss.toFixed(4)}</td>
						<td>{row.ms === null ? '—' : row.ms.toFixed(4)}</td>
						<td>{row.f === null ? '—' : row.f.toFixed(3)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<p class="caption">
		StatM1S1_2025.pdf, §6.4–6.7 : test de Student H0 : βj = 0, rejet si |T| &gt; tₙ₋ₚ₋₁(1−α/2) ;
		test global F = (SCE/p)/(SCR/(n−p−1)) ∼ Fp,n−p−1 ; test emboîté Fq ∼ Fq,n−p−1 — pour q = 1, Fq =
		T² : c'est le même test que le de Student. longley : t₅(97,5 %) = 2.57058, IC(β1) = [0.02089 ;
		0.15547].
	</p>
</div>

<style>
	.lm-stfish {
		display: grid;
		gap: 1.25rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.panel {
		display: grid;
		gap: 0.9rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.panel h3 {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	.control-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
		width: 100%;
	}
	.control-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		width: 100%; /* Changed from 40% to 100% */
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
