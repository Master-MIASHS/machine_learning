<script lang="ts">
	// Part V, expert lesson /part5/double-descente — why the peak: conditioning of X^T X near p = n.
	// Empirical spectrum of X^T X / n (Gaussian X, seeded) against the
	// Marchenko–Pastur density (1967) and the Bai–Yin (1993) limit of the
	// smallest non-zero eigenvalue, (1 − √γ)². Extension beyond course_sources/
	// (theorie.typ only says "X est mal conditionnée" at the threshold).
	//
	// FALLBACK: no histogram component exists in charts/, so the histogram is
	// drawn as a step curve through CurveChart (curve="linear"). Swap for a real
	// histogram component if one gets built.
	//
	// PERFORMANCE: the min-eigenvalue curve (Jacobi on ≤ 40×40 Gram matrices,
	// ~60 draws) is computed once; the slider only recomputes one or two draws.

	import Figure from '$lib/components/charts/Figure.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import {
		marchenkoPasturDensity,
		marchenkoPasturEdges,
		sampleGramSpectrum
	} from '$lib/math/double-descent';
	import { linspace } from '$lib/math/util';

	const N_ROWS = 40;
	const SEED = 3;
	const DRAWS = 3; // pooled draws for the histogram

	let p = $state(30);
	const gamma = $derived(p / N_ROWS);

	const eigs = $derived(
		Array.from({ length: DRAWS }, (_, k) => sampleGramSpectrum(N_ROWS, p, SEED + k).eigenvalues)
	);
	const pooled = $derived(eigs.flat());
	const edges = $derived(marchenkoPasturEdges(gamma));
	const xMax = $derived(Math.max(edges[1] * 1.15, ...pooled) * 1.02);

	// Histogram normalized as a density over the p eigenvalues of X^T X / n
	// (zero eigenvalues excluded), to be comparable with the continuous MP part.
	const BINS = 24;
	const histogram = $derived.by(() => {
		const w = xMax / BINS;
		const counts = new Array(BINS).fill(0);
		for (const v of pooled) counts[Math.min(BINS - 1, Math.floor(v / w))]++;
		const pts: [number, number][] = [[0, 0]];
		counts.forEach((c, i) => {
			const h = c / (DRAWS * p * w);
			pts.push([i * w, h], [(i + 1) * w, h]);
		});
		pts.push([xMax, 0]);
		return pts;
	});
	const mpCurve = $derived(
		linspace(1e-4, xMax, 300).map((s): [number, number] => [s, marchenkoPasturDensity(s, gamma)])
	);
	const yTop = $derived(
		Math.min(3, Math.max(...histogram.map((q) => q[1]), ...mpCurve.map((q) => q[1])) * 1.1)
	);

	// Static curve: smallest non-zero eigenvalue vs γ (one draw per grid point).
	const pGridStatic = Array.from({ length: 59 }, (_, i) => 2 + 2 * i); // 2..118
	const minEigCurve = pGridStatic.map((pp): [number, number] => [
		pp / N_ROWS,
		sampleGramSpectrum(N_ROWS, pp, SEED + 100).minEigenvalue
	]);
	const baiYin = linspace(0.02, 3, 300).map((g): [number, number] => [g, (1 - Math.sqrt(g)) ** 2]);

	const minEig = $derived(eigs[0][eigs[0].length - 1]);
	const maxEig = $derived(eigs[0][0]);
	// Variance factor of the min-norm estimator, V/σ² = (1/n) Σ 1/λ_i(X^T X/n)
	// (Hastie et al. 2022, Lemma 1, isotropic case), for the first draw.
	const varianceFactor = $derived(eigs[0].reduce((s, v) => s + 1 / v, 0) / N_ROWS);
	const varianceLimit = $derived(
		gamma === 1 ? Infinity : gamma < 1 ? gamma / (1 - gamma) : 1 / (gamma - 1)
	);
</script>

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={220}
		yAxis={true}
		xDomain={[0, xMax]}
		yDomain={[0, yTop]}
		curves={[
			{ points: histogram, stroke: 'var(--color-belief)', strokeWidth: 1.5 },
			{
				points: mpCurve.map(([x, y]): [number, number] => [x, Math.min(y, yTop)]),
				stroke: 'var(--color-surprise)',
				strokeWidth: 2
			}
		]}
		vlines={[
			{
				x: edges[0],
				stroke: 'var(--color-text-muted)',
				strokeDasharray: '3 3',
				label: '(1−√γ)²'
			}
		]}
		chartLabel={`γ = p/n = ${gamma.toFixed(2)}`}
		legend={[
			{ label: 'valeurs propres non nulles de XᵀX/n (histogramme)', color: 'var(--color-belief)' },
			{ label: 'densité de Marchenko–Pastur', color: 'var(--color-surprise)' }
		]}
	/>
	{#snippet caption()}
		Spectre de <KatexInline formula={String.raw`X^\top X / n`} /> pour {DRAWS} matrices gaussiennes
		<KatexInline formula={String.raw`X \in \mathbb{R}^{n\times p}`} /> (<KatexInline
			formula="n = 40"
		/>, tirages seedés). Pour <KatexInline formula={String.raw`\gamma > 1`} />, les
		<KatexInline formula="p - n" /> valeurs propres nulles (masse <KatexInline
			formula={String.raw`1 - 1/\gamma`}
		/>) ne sont pas représentées. Quand <KatexInline formula={String.raw`\gamma \to 1`} />, le bord
		gauche du support touche 0 : il existe des directions où les données ne « voient » presque rien.
	{/snippet}
</Figure>

<Slider min={2} max={118} step={2} bind:value={p} label="Nombre de variables p (n = 40)" />

<Figure type="chart">
	<CurveChart
		curve="linear"
		height={200}
		yAxis={true}
		xDomain={[0, 3]}
		yDomain={[0, 2.2]}
		curves={[
			{ points: baiYin, stroke: 'var(--color-surprise)', strokeWidth: 2 },
			{ points: minEigCurve, stroke: 'var(--color-belief)', strokeWidth: 1.5 }
		]}
		curveDots={[{ x: gamma, y: minEig, r: 5, fill: 'var(--color-agent)' }]}
		vlines={[{ x: 1, stroke: 'var(--color-text)', strokeDasharray: '4 4', label: 'γ = 1' }]}
		legend={[
			{ label: 'limite de Bai–Yin (1−√γ)²', color: 'var(--color-surprise)' },
			{ label: 'plus petite valeur propre non nulle (un tirage)', color: 'var(--color-belief)' }
		]}
	/>
	{#snippet caption()}
		Plus petite valeur propre non nulle de <KatexInline formula={String.raw`X^\top X/n`} /> en fonction
		de <KatexInline formula={String.raw`\gamma = p/n`} />. Elle s'effondre au seuil d'interpolation,
		et c'est elle qui gouverne le terme de variance
		<KatexInline formula={String.raw`\sigma^2 \sum_i 1/s_i^2`} /> de l'estimateur de norme minimale.
	{/snippet}
</Figure>

<Metrics align="left">
	<div class="cell">
		<span class="label">λ_min empirique</span>
		<span class="value">{minEig.toExponential(2)}</span>
	</div>
	<div class="cell">
		<span class="label">Limite (1−√γ)²</span>
		<span class="value">{edges[0].toExponential(2)}</span>
	</div>
	<div class="cell">
		<span class="label">Conditionnement λ_max/λ_min</span>
		<span class="value">{(maxEig / minEig).toExponential(2)}</span>
	</div>
	<div class="cell">
		<span class="label">Variance / σ² (tirage | limite)</span>
		<span class="value"
			>{varianceFactor.toExponential(2)} | {Number.isFinite(varianceLimit)
				? varianceLimit.toFixed(2)
				: '∞'}</span
		>
	</div>
</Metrics>
