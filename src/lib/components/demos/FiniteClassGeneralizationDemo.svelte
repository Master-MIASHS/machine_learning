<script lang="ts">
	// Part VI — Cas séparable, |H| < +infty (Théorème 3.1).
	//
	// NOTE on the "bar-chart" requirement: no verified bar-chart component was
	// available, so the |H|-strip below is plain hand-drawn SVG <rect>s inside
	// Figure (same approach as EmpiricalMeanConvergenceDemo's histogram), not
	// a guessed component API. Swap in a real one if it exists.

	import Slider from '$lib/components/controls/Slider.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';

	import {
		generateHypothesisClass,
		simulateMisleadingHypotheses,
		misleadingSampleBound,
		separableRiskBound,
		type AnnotatedHypothesis
	} from '$lib/math/generalization';

	let classSize = $state(40);
	let n = $state(30);
	let epsilon = $state(0.2);
	let delta = $state(0.05);

	// The hypothesis class (with fixed true risks) depends only on classSize
	// and epsilon — regenerating it here, NOT inside the n-dependent
	// simulation below, keeps "the same class of candidates" stable while you
	// move the n slider, matching how the theorem's H doesn't depend on n.
	const hypothesisClass = $derived(generateHypothesisClass(classSize, epsilon, 42));

	// Re-simulating "for the current sample" on every n change is intentional
	// — a fresh sample of size n is exactly what the theorem's probability is
	// taken over.
	const simulation = $derived(simulateMisleadingHypotheses(hypothesisClass, n, 99));

	const theoreticalBound = $derived(misleadingSampleBound(classSize, n, epsilon));
	const riskBound = $derived(separableRiskBound(classSize, n, delta));

	// ─── Hand-drawn strip of |H| hypotheses ─────────────────────────────────
	const STRIP_WIDTH = 420;
	const STRIP_HEIGHT = 48;
	const STRIP_PAD = 2;

	function stripColor(h: AnnotatedHypothesis): string {
		if (h.isGood) return 'var(--color-belief)';
		if (h.isMisleading) return 'var(--color-surprise)';
		return 'var(--color-border)';
	}
</script>

<Figure type="chart">
	<svg
		viewBox={`0 0 ${STRIP_WIDTH} ${STRIP_HEIGHT}`}
		width="100%"
		height={STRIP_HEIGHT}
		role="img"
		aria-label="Hypothèses de la classe H, colorées par statut"
	>
		{#each simulation.hypotheses as h, i}
			{@const w = STRIP_WIDTH / simulation.hypotheses.length}
			<rect
				x={i * w + STRIP_PAD / 2}
				y={STRIP_PAD}
				width={Math.max(0, w - STRIP_PAD)}
				height={STRIP_HEIGHT - 2 * STRIP_PAD}
				fill={stripColor(h)}
				opacity={h.isGood || h.isMisleading ? 1 : 0.55}
			/>
		{/each}
	</svg>

	{#snippet caption()}
		Chaque case est une hypothèse de H. Bleu : l'unique hypothèse « bonne » (R(h)=0, réalisable).
		Gris : hypothèses « mauvaises » (R(h)&gt;ε) correctement éliminées par cet échantillon — au
		moins une erreur d'entraînement. Orange : hypothèses « mauvaises » mais trompeuses — zéro erreur
		d'entraînement par pur hasard sur cet échantillon précis, donc indiscernables de la bonne
		hypothèse pour un algorithme ERM.
	{/snippet}
</Figure>

<Slider
	min={2}
	max={150}
	step={1}
	logarithmic={true}
	bind:value={classSize}
	label="Taille de la classe |H|"
/>
<Slider
	min={5}
	max={300}
	step={1}
	logarithmic={true}
	bind:value={n}
	label="Taille d'échantillon n"
/>
<Slider min={0.01} max={0.5} step={0.01} bind:value={epsilon} label="Seuil ε" />
<Slider
	min={0.001}
	max={0.2}
	step={0.001}
	logarithmic={true}
	bind:value={delta}
	label="Confiance δ"
/>

<Metrics align="left">
	<div class="cell">
		<span class="label">Trompeuses observées</span>
		<span class="value">{simulation.misleadingCount} / {classSize - 1}</span>
	</div>
	<div class="cell">
		<span class="label">Borne |H|e⁻ⁿᵋ</span>
		<span class="value">{theoreticalBound.toFixed(3)}</span>
	</div>
	<div class="cell">
		<span class="label">Risque garanti (1−δ)</span>
		<span class="value">R(ĥ) ≤ {riskBound.toFixed(4)}</span>
	</div>
</Metrics>

	<p class="note">
		Démonstration <strong>illustrative</strong>, pas une preuve : la borne |H|e⁻ⁿᵋ majore à la fois
		la probabilité qu'au moins une hypothèse trompeuse existe et le
	nombre moyen attendu de telles hypothèses — le nombre observé ci-dessus, sur cet unique tirage,
	n'a donc pas à rester en dessous à chaque essai, mais sa moyenne sur de nombreux tirages le
	devrait. Le majorant de risque log(|H|/δ)/n (Metrics, à droite) est exactement la même borne,
	reformulée en garantie directe sur R(ĥ) plutôt qu'en comptage d'hypothèses.
</p>

<style>
	.note {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}
</style>
