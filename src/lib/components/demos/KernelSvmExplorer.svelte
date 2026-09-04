<script lang="ts">
	/**
	 * Démo « Noyaux et frontière de décision » (SVM à noyau sur un anneau).
	 *
	 * Source pédagogique : Marine Demangeot, « Apprentissage supervisé et non
	 * supervisé », M1 MIASHS, CM 4 — SVM (marine/Cours/CM/coursClassif-4-SVM.tex) :
	 *  - eq. optim5 : duale à marge souple (0 ≤ α_i ≤ C, Σα_i y_i = 0) ;
	 *  - eq. optim6-bis : duale à noyau (« L'astuce du noyau » : seule la matrice
	 *    K(x_i, x_j) est calculée, jamais φ) ;
	 *  - noyaux linéaire, polynomial, gaussien.
	 *
	 * Les données (generateRingData : disque classe +1, anneau classe −1) ne sont
	 * pas séparables linéairement dans ℝ². La même duale (mêmes contraintes) est
	 * résolue par solveSvmDual (SMO déterministe) avec un noyau K dans l'espace
	 * d'ORIGINE : le score signé f(x) = Σ α_i y_i K(x_i, x) + b̂ induit alors une
	 * frontière {f = 0} très différente d'un noyau à l'autre, tracée par
	 * zeroContourSegments (marching squares).
	 *
	 * La projection des segments et des vecteurs de support dans l'overlay est
	 * synchronisée avec le pad=4 interne de ScatterPlot (même pattern que
	 * FeatureMapExplorer).
	 */
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import {
		generateRingData,
		linearKernel,
		polyKernel,
		gaussianKernel,
		solveSvmDual,
		makeDecisionFunction,
		zeroContourSegments,
		norm
	} from '$lib/math/svm';
	import type { KernelFn } from '$lib/math/svm';

	type KernelKey = 'lineaire' | 'quadratique' | 'polynomial' | 'gaussien';

	const DOMAIN = 3.2; // domaine du graphique : −3.2..3.2 sur les deux axes
	const SIZE = 400;
	const PAD = 4; // synchronisé avec le pad interne de ScatterPlot

	const kernelLabels: Record<KernelKey, string> = {
		lineaire: 'linéaire',
		quadratique: 'quadratique (c = 1)',
		polynomial: 'polynomial (d = 3, c = 0.5)',
		gaussien: 'gaussien'
	};

	let kernelKey = $state<KernelKey>('quadratique');
	let gamma = $state(1);
	let C = $state(10);

	// Données fixes et déterministes : disque (classe +1) + anneau (classe −1),
	// non séparables linéairement dans ℝ².
	const data = $derived(generateRingData(10, 22, 1, 2.4, 7));

	// Noyau du mode, dans l'espace d'origine : la duale ne voit que les
	// produits scalaires K(x_i, x_j) — c'est l'astuce du noyau.
	const kernelFn = $derived.by((): KernelFn => {
		if (kernelKey === 'lineaire') return linearKernel;
		if (kernelKey === 'quadratique') return (a, b) => polyKernel(a, b, 2, 1);
		if (kernelKey === 'polynomial') return (a, b) => polyKernel(a, b, 3, 0.5);
		return (a, b) => gaussianKernel(a, b, gamma);
	});

	// Duale à marge souple (eq. optim5) résolue par SMO dans l'espace d'origine.
	const sol = $derived(solveSvmDual(data, C, { tol: 1e-4, maxPasses: 200, kernel: kernelFn }));

	// Score signé f(x) = Σ α_i y_i K(x_i, x) + b̂ (avant le sign).
	const score = $derived(makeDecisionFunction(sol.alphas, data, sol.b, kernelFn));

	// Frontière induite {f = 0} dans l'espace d'origine (marching squares).
	const boundary = $derived(
		zeroContourSegments(
			(x, y) => score([x, y]),
			[
				[-DOMAIN, DOMAIN],
				[-DOMAIN, DOMAIN]
			],
			70
		)
	);

	// Erreurs d'entraînement : sign(score(x_i)) ≠ y_i.
	const nErrors = $derived(
		data.reduce((acc, p) => acc + (Math.sign(score([p.x1, p.x2])) !== p.label ? 1 : 0), 0)
	);

	// Marge γ = 1/‖w‖ : définie seulement pour le noyau linéaire (w explicite).
	const margin = $derived.by((): number | null => {
		if (kernelKey !== 'lineaire') return null;
		const nw = norm(sol.w);
		return nw > 0 ? 1 / nw : null;
	});

	const fmtC = $derived(C < 0.1 || C >= 100 ? C.toExponential(1) : C.toFixed(2));
	const fmtMargin = $derived(margin === null ? '—' : margin.toFixed(3));

	// ── Projection (mirror de ScatterPlot, pad = 4) ─────────────────────
	function projectX(x: number): number {
		return PAD + ((x + DOMAIN) / (2 * DOMAIN)) * (SIZE - 2 * PAD);
	}
	function projectY(y: number): number {
		return PAD + ((DOMAIN - y) / (2 * DOMAIN)) * (SIZE - 2 * PAD);
	}

	const points = $derived(
		data.map((p) => ({ x: p.x1, y: p.x2, group: p.label === 1 ? 'data-1' : 'data-0' }))
	);

	const supportPoints = $derived(
		sol.supportIndices.map((i) => ({
			cx: projectX(data[i].x1),
			cy: projectY(data[i].x2)
		}))
	);

	function colorByGroup(d: { group?: string | number }): string {
		if (d.group === 'data-1') return 'var(--color-belief)';
		if (d.group === 'data-0') return 'var(--color-surprise)';
		return 'var(--color-text-muted)';
	}
</script>

<div class="ksvm-demo">
	<div class="explorer-grid">
		<div class="plot-panel">
			<ScatterPlot
				{points}
				domainX={[-DOMAIN, DOMAIN]}
				domainY={[-DOMAIN, DOMAIN]}
				width={SIZE}
				height={SIZE}
				colorBy={colorByGroup}
				defaultSize={4}
				showAxes={true}
				showLabels={true}
			>
				{#snippet snippetOverlay()}
					<!-- Frontière de décision induite {f = 0} (marching squares) -->
					{#each boundary as s}
						<line
							x1={projectX(s.x1)}
							y1={projectY(s.y1)}
							x2={projectX(s.x2)}
							y2={projectY(s.y2)}
							stroke="var(--color-agent)"
							stroke-width="2"
						/>
					{/each}
					<!-- Vecteurs de support (croix) -->
					{#each supportPoints as p}
						<line
							x1={p.cx - 4}
							y1={p.cy}
							x2={p.cx + 4}
							y2={p.cy}
							stroke="var(--color-positive)"
							stroke-width="1.5"
						/>
						<line
							x1={p.cx}
							y1={p.cy - 4}
							x2={p.cx}
							y2={p.cy + 4}
							stroke="var(--color-positive)"
							stroke-width="1.5"
						/>
					{/each}
				{/snippet}
			</ScatterPlot>
		</div>

		<div class="side-panel">
			<div class="readout">
				<div class="row">
					<span class="k">Noyau</span>
					<span class="v">{kernelLabels[kernelKey]}</span>
				</div>
				<div class="row">
					<span class="k">C</span>
					<span class="v">{fmtC}</span>
				</div>
				<div class="row">
					<span class="k">Vecteurs de support</span>
					<span class="v">{sol.supportIndices.length}</span>
				</div>
				<div class="row">
					<span class="k">Erreurs d'entraînement</span>
					<span class="v">{nErrors} / {data.length}</span>
				</div>
				<div class="row">
					<span class="k">Marge γ = 1/‖w‖</span>
					<span class="v">{fmtMargin}</span>
				</div>
				{#if kernelKey !== 'lineaire'}
					<div class="margin-note">
						Pour un noyau non linéaire, il n'existe pas de poids explicite w dans H : la marge 1/‖w‖
						n'est pas définie.
					</div>
				{/if}
				{#if boundary.length === 0}
					<div class="margin-note">
						Le modèle prédit une seule classe sur tout le domaine visible (pas de frontière à
						tracer) — cas attendu quand C est trop petit pour justifier de s'écarter de w ≈ 0.
					</div>
				{/if}
			</div>

			<div class="grp">
				<div class="gttl">Noyau K(x, x̃)</div>
				<div class="modes">
					<Button
						variant="outline"
						size="sm"
						selected={kernelKey === 'lineaire'}
						onclick={() => (kernelKey = 'lineaire')}>linéaire</Button
					>
					<Button
						variant="outline"
						size="sm"
						selected={kernelKey === 'quadratique'}
						onclick={() => (kernelKey = 'quadratique')}>quadratique (c = 1)</Button
					>
					<Button
						variant="outline"
						size="sm"
						selected={kernelKey === 'polynomial'}
						onclick={() => (kernelKey = 'polynomial')}>polynomial (d = 3, c = 0.5)</Button
					>
					<Button
						variant="outline"
						size="sm"
						selected={kernelKey === 'gaussien'}
						onclick={() => (kernelKey = 'gaussien')}>gaussien</Button
					>
				</div>
				{#if kernelKey === 'gaussien'}
					<Slider
						bind:value={gamma}
						min={0.1}
						max={5}
						step={0.1}
						label="γ (largeur du noyau gaussien)"
					/>
				{/if}
			</div>

			<SliderGrid variant="outline">
				<div class="grp">
					<div class="gttl">Marge souple</div>
					<Slider bind:value={C} min={0.01} max={1000} step={1} label="C" logarithmic={true} />
				</div>
			</SliderGrid>
		</div>
	</div>

	<p class="cap">
		Le même problème duale — mêmes contraintes 0 ≤ α_i ≤ C et Σ α_i y_i = 0 — est résolu avec un
		noyau K : la frontière de décision induite dans l'espace d'origine est très différente d'un
		noyau à l'autre. Le noyau linéaire ne peut pas séparer l'anneau (nombreuses erreurs
		d'entraînement), alors que les noyaux polynomial et gaussien le peuvent ; γ contrôle la
		souplesse de la frontière gaussienne (γ petit → lisse, γ grand → sinueux, au risque de
		sur-apprentissage). Note honnête : solveur SMO de la formulation duale à marge souple sur des
		données simulées déterministes, et par l'astuce du noyau seule la matrice K(x_i, x_j) est
		calculée — jamais φ.
	</p>
</div>

<style>
	.ksvm-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.explorer-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}

	@media (max-width: 800px) {
		.explorer-grid {
			grid-template-columns: 1fr;
		}
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
	}

	.margin-note {
		font-size: 0.75rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		padding-top: 0.2rem;
	}

	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.modes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
