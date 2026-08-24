<script lang="ts">
	// Part VI — Cas non séparable, |H| < +infty (Théorème 3.2).
	//
	// The core contrast: a hypothesis FIXED before seeing the data only needs
	// the single-hypothesis Hoeffding bound (narrow band around y=x); the
	// ERM-selected hhat_S = argmin R_S(h) is chosen AFTER seeing the data, so
	// the same narrow bound doesn't legitimately apply to it — only the
	// uniform (union-bound) guarantee, valid simultaneously for every h in H,
	// covers it (wider band).
	//
	// NOTE: no toggle/checkbox component was available — using a plain HTML
	// checkbox (same fallback as KNNConsistencyDemo's Stone-rule toggle).

	// TODO: confirm these paths/names against your actual files.
	import Figure from '$lib/components/charts/Figure.svelte';
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		generateGenericHypothesisClass,
		simulateEmpiricalRisks,
		hoeffdingUniformBound
	} from '$lib/math/generalization';

	let classSize = $state(30);
	let n = $state(40);
	let delta = $state(0.05);
	let showErm = $state(true);

	// Fixed roster of true risks — regenerated only when classSize changes,
	// NOT when n changes (the class H doesn't depend on the sample).
	const hypotheses = $derived(generateGenericHypothesisClass(classSize, 42));

	// A fresh sample of size n each time — this is the random draw the
	// theorem's probability is taken over.
	const results = $derived(simulateEmpiricalRisks(hypotheses, n, 99));

	const fixedPoint = $derived(results[0]); // "fixed in advance": always hypothesis #0
	const ermPoint = $derived(
		results.reduce((best, r) => (r.empiricalRisk < best.empiricalRisk ? r : best))
	);

	// hoeffdingUniformBound(1, n, delta) is exactly the single-hypothesis
	// Hoeffding tail solved for t (log(1)=0 drops the union-bound term).
	const tSingle = $derived(hoeffdingUniformBound(1, n, delta));
	const tUniform = $derived(hoeffdingUniformBound(classSize, n, delta));

	const fixedGap = $derived(Math.abs(fixedPoint.empiricalRisk - fixedPoint.trueRisk));
	const ermGap = $derived(Math.abs(ermPoint.empiricalRisk - ermPoint.trueRisk));

	// ─── Scatter projection (mirrors ScatterPlot.svelte's internal pad=4) ──────
	const SIZE = 420;
	const PAD = 4;
	const DOMAIN: [number, number] = [0, 1];

	function projX(x: number): number {
		return PAD + ((x - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * (SIZE - PAD * 2);
	}
	function projY(y: number): number {
		return PAD + ((DOMAIN[1] - y) / (DOMAIN[1] - DOMAIN[0])) * (SIZE - PAD * 2);
	}

	const scatterPoints = $derived(
		results.map((r) => ({
			x: r.trueRisk,
			y: r.empiricalRisk,
			group: r.id === fixedPoint.id ? 'fixed' : r.id === ermPoint.id ? 'erm' : 'other'
		}))
	);

	function colorByGroup(d: { group?: string | number }): string {
		if (d.group === 'fixed') return 'var(--color-belief)';
		if (d.group === 'erm') return 'var(--color-surprise)';
		return 'var(--color-text-muted)';
	}
	function sizeByGroup(d: { group?: string | number }): number {
		return d.group === 'fixed' || d.group === 'erm' ? 6 : 3;
	}
</script>

<Figure type="chart">
	<ScatterPlot
		points={scatterPoints}
		domainX={DOMAIN}
		domainY={DOMAIN}
		width={SIZE}
		height={SIZE}
		colorBy={colorByGroup}
		sizeBy={sizeByGroup}
		showAxes={true}
		showLabels={true}
	>
		{#snippet snippetOverlay()}
			<!-- y = x reference (perfect estimate) -->
			<line
				x1={projX(0)}
				y1={projY(0)}
				x2={projX(1)}
				y2={projY(1)}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<!-- Narrow band: valid for ONE hypothesis fixed in advance -->
			<line
				x1={projX(0)}
				y1={projY(tSingle)}
				x2={projX(1)}
				y2={projY(1 + tSingle)}
				stroke="var(--color-belief)"
				stroke-width="1"
				stroke-dasharray="2 2"
				opacity="0.6"
			/>
			<line
				x1={projX(0)}
				y1={projY(-tSingle)}
				x2={projX(1)}
				y2={projY(1 - tSingle)}
				stroke="var(--color-belief)"
				stroke-width="1"
				stroke-dasharray="2 2"
				opacity="0.6"
			/>
			{#if showErm}
				<!-- Wide band: valid simultaneously for EVERY h, including hhat_S -->
				<line
					x1={projX(0)}
					y1={projY(tUniform)}
					x2={projX(1)}
					y2={projY(1 + tUniform)}
					stroke="var(--color-surprise)"
					stroke-width="1.5"
					stroke-dasharray="4 4"
					opacity="0.7"
				/>
				<line
					x1={projX(0)}
					y1={projY(-tUniform)}
					x2={projX(1)}
					y2={projY(1 - tUniform)}
					stroke="var(--color-surprise)"
					stroke-width="1.5"
					stroke-dasharray="4 4"
					opacity="0.7"
				/>
			{/if}
		{/snippet}
	</ScatterPlot>

	{#snippet caption()}
		Chaque point : (R(h), R_S(h)) pour une hypothèse de H sur cet échantillon. Point bleu :
		l'hypothèse #0, fixée avant de voir les données — sa bande étroite en pointillés bleus est une
		garantie valide pour elle seule.
		{#if showErm}
			Point orange : ĥ_S = argmin R_S(h), choisie <em>après</em> avoir vu les données — la même bande
			étroite ne s'applique pas légitimement à elle (elle a été sélectionnée précisément parce que son
			risque empirique semblait bas). Seule la bande large en tirets orange, valide simultanément pour
			tout h ∈ H, la couvre légitimement.
		{/if}
	{/snippet}
</Figure>

<Slider min={5} max={100} step={1} bind:value={classSize} label="Taille de la classe |H|" />
<Slider
	min={10}
	max={500}
	step={1}
	logarithmic={true}
	bind:value={n}
	label="Taille d'échantillon n"
/>
<Slider
	min={0.001}
	max={0.2}
	step={0.001}
	logarithmic={true}
	bind:value={delta}
	label="Confiance δ"
/>

<label class="erm-toggle">
	<input type="checkbox" bind:checked={showErm} />
	Comparer avec la sélection ERM (ĥ_S)
</label>

<Metrics align="left">
	<div class="cell">
		<span class="label">Écart, h fixée</span>
		<span class="value">{fixedGap.toFixed(3)} (borne {tSingle.toFixed(3)})</span>
	</div>
	{#if showErm}
		<div class="cell">
			<span class="label">Écart, ĥ_S (ERM)</span>
			<span class="value">{ermGap.toFixed(3)} (borne uniforme {tUniform.toFixed(3)})</span>
		</div>
	{/if}
</Metrics>

<style>
	.erm-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--color-text);
	}
</style>
