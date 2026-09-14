<script lang="ts">
	/**
	 * Démo E.7 « Explorer la KRR : régularisation, interpolation, pont ridge »
	 * — leçon expert « Espaces de Hilbert à noyau (RKHS) et méthodes à noyau »
	 * (brief expert/part2/lessons/rkhs-methodes-noyau.md, sections 5 et E.7).
	 *
	 * Source pédagogique : leçon expert (au-delà de course_sources/) —
	 * KRR min_{f ∈ H_K} (1/n)Σ(yᵢ − f(xᵢ))² + λ‖f‖²_{H_K} avec forme close
	 * α⋆ = (K + nλI)⁻¹y (E.5–E.6), d'après Schölkopf, Herbrich & Smola (2001)
	 * et Schölkopf & Smola (2002) ch. 4 ; convention γ = 1/(2σ²) du noyau
	 * gaussien : course_sources/marine/Cours/CM/coursClassif-4-SVM.tex.
	 * Pont ridge (noyau linéaire) : KRR(λ) = ridge de paramètre nλ (Partie V,
	 * leçon 4) — src/lib/math/rkhs.ts (krrSolve, krrFitted, krrHilbertNormSq,
	 * krrPredictAt, generateKrrDataset1D, krrGram1D), tests rkhs.test.ts.
	 *
	 * Petit problème 1D synthétique seedé (fonction cible fixée, bruit
	 * gaussien) — illustration du compromis biais/variance, pas un benchmark.
	 */
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import RadioGroup from '$lib/components/controls/RadioGroup.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import {
		krrSolve,
		krrFitted,
		krrHilbertNormSq,
		krrPredictAt,
		generateKrrDataset1D,
		krrGram1D
	} from '$lib/math/rkhs';
	import { gaussianKernel, linearKernel, type KernelFn } from '$lib/math/svm';
	import { linspace } from '$lib/math/util';

	type KernelKind = 'gaussien' | 'lineaire';

	const N_OPTIONS = [10, 20, 40, 80];
	const GRID = linspace(0, 1, 121);

	let kernelKind = $state<KernelKind>('gaussien');
	let lambda = $state(0.1);
	let sigma = $state(0.15);
	let n = $state(20);
	let seed = $state(42);

	const data = $derived(generateKrrDataset1D(n, seed));
	const K = $derived(krrGram1D(data.x, kernelKind, sigma));
	const alpha = $derived(krrSolve(K, data.y, lambda));
	const fitted = $derived(krrFitted(alpha, K));
	const hilbertNormSq = $derived(krrHilbertNormSq(alpha, K));
	const trainMSE = $derived.by((): number => {
		const m = data.y.length;
		let s = 0;
		for (let i = 0; i < m; i++) {
			const r = data.y[i] - fitted[i];
			s += r * r;
		}
		return s / m;
	});
	const maxResidual = $derived(Math.max(...data.y.map((y, i) => Math.abs(y - fitted[i]))));
	const maxAbsAlpha = $derived(Math.max(...alpha.map((a) => Math.abs(a))));

	const kernelFn = $derived.by((): KernelFn =>
		kernelKind === 'gaussien'
			? (a, b) => gaussianKernel(a, b, 1 / (2 * sigma * sigma))
			: (a, b) => linearKernel(a, b)
	);
	const X1 = $derived(data.x.map((v) => [v]));
	const fitCurve = $derived(GRID.map((t): [number, number] => [t, krrPredictAt(kernelFn, [t], X1, alpha)]));
	const targetCurve = $derived(GRID.map((t): [number, number] => [t, data.fStar(t)]));

	// Domaine y : stable tant que l'ajustement reste raisonnable, s'élargit
	// (plafonné à 8) quand la sur-interpolation fait diverger la courbe.
	const yCap = $derived.by((): number => {
		let m = 2.8;
		for (const p of fitCurve) m = Math.max(m, Math.abs(p[1]));
		return Math.min(8, m * 1.05);
	});

	// Bande des coefficients αᵢ (SVG minimal, sans composant existant adapté
	// aux valeurs signées — fallback à remplacer par un vrai BarChart signé si
	// un tel composant est construit).
	const ALPHA_W = 460;
	const ALPHA_H = 96;
	const alphaBars = $derived.by(() => {
		const m = alpha.length;
		const slot = ALPHA_W / m;
		const bars: { x: number; y: number; w: number; h: number; neg: boolean }[] = [];
		for (let i = 0; i < m; i++) {
			const a = alpha[i];
			const h = maxAbsAlpha > 0 ? (Math.abs(a) / maxAbsAlpha) * (ALPHA_H / 2 - 8) : 0;
			bars.push({
				x: i * slot + slot * 0.15,
				y: a >= 0 ? ALPHA_H / 2 - h : ALPHA_H / 2,
				w: slot * 0.7,
				h,
				neg: a < 0
			});
		}
		return bars;
	});

	// 3 chiffres ; exponentielle pour les valeurs très petites / très grandes
	// (‖f⋆‖²_HK couvre plusieurs ordres de grandeur quand λ balaye 10⁻⁴→10²).
	function fmtNum(v: number): string {
		if (!Number.isFinite(v)) return '—';
		const a = Math.abs(v);
		if (a !== 0 && (a < 0.01 || a >= 1000)) return v.toExponential(2);
		return v.toFixed(3);
	}

	interface MetricRow {
		k: string;
		v: string;
	}
	const metrics = $derived.by((): MetricRow[] => [
		{ k: 'MSE d’entraînement', v: fmtNum(trainMSE) },
		{ k: '‖f⋆‖²_HK', v: fmtNum(hilbertNormSq) },
		{ k: 'max |αᵢ|', v: fmtNum(maxAbsAlpha) },
		{ k: 'max |yᵢ − f⋆(xᵢ)|', v: fmtNum(maxResidual) }
	]);
</script>

<div class="kre-demo">
	<div class="kre-grid">
		<div class="panel">
			<div class="panel-ttl">Ajustement KRR sur [0,1]</div>
			<CurveChart
				height={260}
				xDomain={[0, 1]}
				yDomain={[-yCap, yCap]}
				curves={[
					{
						points: targetCurve,
						stroke: 'var(--color-text-muted)',
						strokeWidth: 2,
						strokeDasharray: '6 4'
					},
					{ points: fitCurve, stroke: 'var(--color-belief)', strokeWidth: 2.5 }
				]}
				curveDots={data.x.map((x, i) => ({ x, y: data.y[i], r: 3, fill: 'var(--color-evidence)' }))}
				legend={[
					{ label: 'cible f⋆(t)', color: 'var(--color-text-muted)', kind: 'dashed-line' },
					{ label: 'ajustement f⋆_λ', color: 'var(--color-belief)' }
				]}
			/>
			<div class="alpha-wrap">
				<div class="panel-ttl">
					Coefficients αᵢ (f⋆(t) = Σᵢ αᵢ K(xᵢ, t) — {alpha.length} noyaux)
				</div>
				<svg
					viewBox="0 0 {ALPHA_W} {ALPHA_H}"
					class="alpha-svg"
					role="img"
					aria-label="Barres des coefficients α de la solution KRR, positives en haut, négatives en bas"
				>
					<line x1={0} x2={ALPHA_W} y1={ALPHA_H / 2} y2={ALPHA_H / 2} class="alpha-zero" />
					{#each alphaBars as b}
						<rect x={b.x} y={b.y} width={b.w} height={b.h} class:alpha-pos={!b.neg} class:alpha-neg={b.neg} />
					{/each}
				</svg>
			</div>
		</div>

		<div class="side-panel">
			<RadioGroup label="Noyau">
				<RadioButton value="gaussien" label="gaussien" bind:groupValue={kernelKind} />
				<RadioButton value="lineaire" label="linéaire" bind:groupValue={kernelKind} />
			</RadioGroup>

			<Slider
				bind:value={lambda}
				min={0.0001}
				max={100}
				step={0.01}
				logarithmic
				label="λ (régularisation)"
			/>
			<Slider
				bind:value={sigma}
				min={0.02}
				max={1}
				step={0.01}
				label="σ (bande du noyau gaussien)"
				disabled={kernelKind === 'lineaire'}
			/>
			<RadioGroup label="n (points)">
				{#each N_OPTIONS as opt}
					<RadioButton value={opt} label={String(opt)} bind:groupValue={n} />
				{/each}
			</RadioGroup>

			<div class="presets">
				<Button variant="primary" size="sm" onclick={() => (seed += 1)}>Nouvelles données</Button>
			</div>

			<div class="readout" aria-label="Métriques de la solution KRR">
				{#each metrics as row}
					<div class="row">
						<span class="k">{row.k}</span>
						<span class="v">{row.v}</span>
					</div>
				{/each}
			</div>

			<div class="verdict" class:interp={maxResidual < 0.05}>
				{#if maxResidual < 0.05}
					Les données sont (presque) interpolées : c'est le régime λ → 0, où la norme
					‖f⋆‖²_HK devient grande (la fonction s'agite pour suivre le bruit).
				{:else if hilbertNormSq < 0.01}
					La norme ‖f⋆‖²_HK est très petite : la régularisation écrase l'ajustement
					(régime λ → ∞, f⋆ → 0).
				{:else}
					Compromis biais/variance : λ arbitre entre ajuster les données (perte empirique)
					et rester lisse dans le RKHS (norme ‖f⋆‖²_HK).
				{/if}
			</div>

			{#if kernelKind === 'lineaire'}
				<p class="ridge-note">
					Noyau linéaire : l'ajustement ci-dessus est <strong>exactement</strong> celui du
					ridge régression de paramètre nλ (Partie V, leçon 4) — la KRR linéaire
					<strong>est</strong> le ridge vu du côté du noyau.
				</p>
			{/if}
		</div>
	</div>

	<p class="cap">
		Petit problème 1D synthétique seedé (fonction cible fixée f⋆(t) = 2 sin(2πt) + ½ cos(4πt),
		bruit gaussien σ = 0.1) — illustration du compromis biais/variance de la KRR, pas un
		benchmark. λ petit : la courbe sur-interpole le bruit et ‖f⋆‖²_HK explose ; λ grand : la
		courbe se plaque vers 0 et la norme s'annule ; la norme décroît strictement quand λ croît
		(exercice 2 de la leçon).
	</p>
</div>

<style>
	.kre-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.kre-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
		gap: 1.25rem;
		align-items: start;
	}

	@media (max-width: 900px) {
		.kre-grid {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.panel-ttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.alpha-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.alpha-svg {
		width: 100%;
		height: auto;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface-2);
	}

	.alpha-zero {
		stroke: var(--color-border);
		stroke-dasharray: 4 4;
	}

	.alpha-pos {
		fill: var(--color-belief);
		opacity: 0.85;
	}

	.alpha-neg {
		fill: var(--color-surprise);
		opacity: 0.85;
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.readout {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface-2);
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.8125rem;
	}

	.row .k {
		color: var(--color-text-muted);
	}

	.row .v {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--color-text);
		text-align: right;
	}

	.verdict {
		padding: 0.6rem 0.9rem;
		border-radius: 6px;
		font-size: 0.82rem;
		line-height: 1.55;
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-border);
		color: var(--color-text);
	}

	.verdict.interp {
		border-left-color: var(--color-positive);
	}

	.ridge-note {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.55;
		color: var(--color-text-muted);
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
