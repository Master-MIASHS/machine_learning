<script lang="ts">
	/**
	 * Démo « L'espace de redescription : φ et séparabilité » (leçon SVM à noyau).
	 *
	 * Source pédagogique : Marine Demangeot, « Apprentissage supervisé et non
	 * supervisé », M1 MIASHS, CM 4 — SVM (marine/Cours/CM/coursClassif-4-SVM.tex) :
	 *  - frame « Problématique » : données « cercle » non séparables linéairement,
	 *    séparées par φ(x₁, x₂) ↦ (x₁², x₂²) dans l'espace de redescription H ;
	 *  - frame « L'astuce du noyau » : φ n'intervient que via les produits
	 *    scalaires ⟨φ(x_i), φ(x_j)⟩ (problème dual eq. optim6-bis).
	 *
	 * Dans les trois modes, la duale SVM à marge souple (C = 1e4, « quasi marge
	 * rigide ») est résolue par solveSvmDual dans l'espace d'ORIGINE avec le
	 * noyau K(x, x̃) = ⟨φ(x), φ(x̃)⟩ du mode : le dual ne voit que des produits
	 * scalaires — c'est précisément l'astuce du noyau. Pour « carre », une
	 * seconde résolution (noyau linéaire par défaut) sur les points levés 2D
	 * fournit le poids w_H de la droite de décision dans H : c'est le même
	 * problème dual que la résolution à noyau (même matrice de Gram), donc
	 * même décision dans l'espace d'origine.
	 */
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import {
		linearKernel,
		solveSvmDual,
		makeDecisionFunction,
		zeroContourSegments,
		generateRingData
	} from '$lib/math/svm';
	import type { KernelFn } from '$lib/math/svm';

	type Mode = 'id' | 'carre' | 'poly2';

	const DOMAIN = 3; // espace d'origine : domaine −3..3
	const HDOMAIN = 7; // espace H : domaine 0..7 (x_i² ∈ [0, 2.6²] ≈ [0, 6.8])
	const SIZE = 380;
	const PAD = 4; // synchronisé avec le pad interne de ScatterPlot
	const C = 1e4; // « quasi marge rigide »

	let mode = $state<Mode>('carre');

	// Données fixes : disque central (classe +1) + anneau (classe −1) —
	// non séparables linéairement, séparables après φ (diapo « Problématique »).
	const data = $derived(generateRingData(12, 24, 1, 2.6, 7));

	// Noyaux du mode, dans l'espace d'origine : K(x, x̃) = ⟨φ(x), φ(x̃)⟩.
	// « carre » : φ(x) = (x₁², x₂²).
	const carreKernel: KernelFn = (a, b) => a[0] * a[0] * b[0] * b[0] + a[1] * a[1] * b[1] * b[1];
	// « poly2 » : φ(x) = (x₁, x₂, x₁x₂, x₁², x₂²) — produit scalaire exact dans
	// H de dimension 5 (PSD par construction ; ce n'est PAS (⟨x, x̃⟩)²).
	const poly2Kernel: KernelFn = (a, b) =>
		a[0] * b[0] +
		a[1] * b[1] +
		a[0] * a[1] * b[0] * b[1] +
		a[0] * a[0] * b[0] * b[0] +
		a[1] * a[1] * b[1] * b[1];

	const modeKernel = $derived.by((): KernelFn =>
		mode === 'carre' ? carreKernel : mode === 'poly2' ? poly2Kernel : linearKernel
	);

	const dimH = $derived(mode === 'poly2' ? 5 : 2);

	// Points levés φ(x) — affichage du panneau H et seconde résolution (« carre »).
	const lifted = $derived(
		data.map((p) => {
			if (mode === 'carre') return [p.x1 * p.x1, p.x2 * p.x2];
			if (mode === 'poly2') return [p.x1, p.x2, p.x1 * p.x2, p.x1 * p.x1, p.x2 * p.x2];
			return [p.x1, p.x2];
		})
	);

	// Résolution dans l'espace d'origine avec le noyau du mode (astuce du noyau).
	const sol = $derived(solveSvmDual(data, C, { tol: 1e-5, maxPasses: 200, kernel: modeKernel }));

	// Seconde résolution sur les points levés (noyau linéaire par défaut) :
	// même problème dual que `sol` en mode « carre », elle donne directement
	// w_H pour tracer la droite de décision dans H.
	const solH = $derived.by(() => {
		if (mode !== 'carre') return null;
		const lifted2D = data.map((p, i) => ({
			x1: lifted[i][0],
			x2: lifted[i][1],
			label: p.label
		}));
		return solveSvmDual(lifted2D, C, { tol: 1e-5, maxPasses: 200 });
	});

	// Score signé dans l'espace d'origine (avant le sign).
	const score = $derived(makeDecisionFunction(sol.alphas, data, sol.b, modeKernel));

	// Frontière induite {score = 0} dans l'espace d'origine (marching squares).
	const boundarySegments = $derived(
		zeroContourSegments(
			(x, y) => score([x, y]),
			[
				[-DOMAIN, DOMAIN],
				[-DOMAIN, DOMAIN]
			],
			70
		)
	);

	// Erreurs d'entraînement : sign(score) ≠ label.
	const nErrors = $derived(
		data.reduce((acc, p) => acc + (Math.sign(score([p.x1, p.x2])) !== p.label ? 1 : 0), 0)
	);

	// Projection miroir de ScatterPlot (pad = 4), paramétrée par le domaine.
	function projectX(x: number, lo: number, hi: number): number {
		return PAD + ((x - lo) / (hi - lo)) * (SIZE - 2 * PAD);
	}
	function projectY(y: number, lo: number, hi: number): number {
		return PAD + ((hi - y) / (hi - lo)) * (SIZE - 2 * PAD);
	}

	const pointsOriginal = $derived(
		data.map((p) => ({ x: p.x1, y: p.x2, group: p.label === 1 ? 'data-1' : 'data-0' }))
	);
	const pointsLifted = $derived(
		lifted.map((z, i) => ({ x: z[0], y: z[1], group: data[i].label === 1 ? 'data-1' : 'data-0' }))
	);
	const supportPoints = $derived(
		sol.supportIndices.map((i) => ({
			cx: projectX(data[i].x1, -DOMAIN, DOMAIN),
			cy: projectY(data[i].x2, -DOMAIN, DOMAIN)
		}))
	);

	function colorByGroup(d: { group?: string | number }): string {
		if (d.group === 'data-1') return 'var(--color-belief)';
		if (d.group === 'data-0') return 'var(--color-surprise)';
		return 'var(--color-text-muted)';
	}

	// Droite w_H·z + b_H = 0, clipée au cadre [0, HDOMAIN]² (Liang-Barsky,
	// même pattern que LinearClassifierExplorer).
	const hLine = $derived.by((): { x1: number; y1: number; x2: number; y2: number } | null => {
		if (!solH) return null;
		const [a, c] = solH.w;
		const b = solH.b;
		let A: [number, number];
		let B: [number, number];
		if (Math.abs(c) > 1e-12) {
			A = [0, -b / c];
			B = [HDOMAIN, (-a * HDOMAIN - b) / c];
		} else if (Math.abs(a) > 1e-12) {
			A = [-b / a, 0];
			B = [-b / a, HDOMAIN];
		} else {
			return null;
		}
		if (!Number.isFinite(A[1]) || !Number.isFinite(B[1])) return null;
		let t0 = 0;
		let t1 = 1;
		const dx = B[0] - A[0];
		const dy = B[1] - A[1];
		const clip = (p: number, q: number): boolean => {
			if (p === 0) return q >= 0;
			const r = q / p;
			if (p < 0) {
				if (r > t1) return false;
				if (r > t0) t0 = r;
			} else {
				if (r < t0) return false;
				if (r < t1) t1 = r;
			}
			return true;
		};
		if (
			!clip(-dx, A[0]) ||
			!clip(dx, HDOMAIN - A[0]) ||
			!clip(-dy, A[1]) ||
			!clip(dy, HDOMAIN - A[1])
		) {
			return null;
		}
		return {
			x1: A[0] + t0 * dx,
			y1: A[1] + t0 * dy,
			x2: A[0] + t1 * dx,
			y2: A[1] + t1 * dy
		};
	});
</script>

<div class="fm-demo">
	<div class="fm-grid" class:solo={mode === 'id'}>
		<div class="panel">
			<div class="panel-ttl">Espace d'origine</div>
			<ScatterPlot
				points={pointsOriginal}
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
					<!-- Frontière induite {score = 0} -->
					{#each boundarySegments as s}
						<line
							x1={projectX(s.x1, -DOMAIN, DOMAIN)}
							y1={projectY(s.y1, -DOMAIN, DOMAIN)}
							x2={projectX(s.x2, -DOMAIN, DOMAIN)}
							y2={projectY(s.y2, -DOMAIN, DOMAIN)}
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

		{#if mode === 'carre'}
			<div class="panel">
				<div class="panel-ttl">Espace de redescription H (dimension 2)</div>
				<ScatterPlot
					points={pointsLifted}
					domainX={[0, HDOMAIN]}
					domainY={[0, HDOMAIN]}
					width={SIZE}
					height={SIZE}
					colorBy={colorByGroup}
					defaultSize={4}
					showAxes={true}
					showLabels={true}
				>
					{#snippet snippetOverlay()}
						<!-- Droite de décision dans H : w_H·z + b_H = 0 -->
						{#if hLine}
							<line
								x1={projectX(hLine.x1, 0, HDOMAIN)}
								y1={projectY(hLine.y1, 0, HDOMAIN)}
								x2={projectX(hLine.x2, 0, HDOMAIN)}
								y2={projectY(hLine.y2, 0, HDOMAIN)}
								stroke="var(--color-agent)"
								stroke-width="2.5"
							/>
						{/if}
					{/snippet}
				</ScatterPlot>
			</div>
		{:else if mode === 'poly2'}
			<div class="panel note-box">
				Espace de redescription de dimension 5 — affichage impossible en 2D ; la frontière induite
				est tracée dans l'espace d'origine.
			</div>
		{/if}
	</div>

	<div class="side-panel">
		<div class="readout">
			<div class="row">
				<span class="k">Dimension de H</span>
				<span class="v">{dimH}</span>
			</div>
			<div class="row">
				<span class="k">Erreurs d'entraînement</span>
				<span class="v">{nErrors} / {data.length}</span>
			</div>
			<div class="row">
				<span class="k">Vecteurs de support</span>
				<span class="v">{sol.supportIndices.length}</span>
			</div>
		</div>

		<div class="grp">
			<div class="gttl">Application φ (espace de redescription H)</div>
			<div class="modes">
				<Button variant="outline" size="sm" selected={mode === 'id'} onclick={() => (mode = 'id')}
					>Sans transformation (H = ℝ²)</Button
				>
				<Button
					variant="outline"
					size="sm"
					selected={mode === 'carre'}
					onclick={() => (mode = 'carre')}>φ(x) = (x₁², x₂²)</Button
				>
				<Button
					variant="outline"
					size="sm"
					selected={mode === 'poly2'}
					onclick={() => (mode = 'poly2')}>φ(x) = (x₁, x₂, x₁x₂, x₁², x₂²)</Button
				>
			</div>
		</div>
	</div>

	<p class="cap">
		Les données ne sont pas séparables linéairement dans l'espace d'origine (mode « id » : erreurs
		d'entraînement), mais l'application φ(x) = (x₁², x₂²) — l'exemple des diapositives — les rend
		séparables par une droite dans H ; la frontière induite dans l'espace d'origine est alors la
		courbe x₁² + x₂² = const (ici, un cercle de rayon ≈ 1). La SVM n'a besoin de φ que via les
		produits scalaires ⟨φ(x_i), φ(x_j)⟩ — c'est l'astuce du noyau : le mode « poly2 » (H de
		dimension 5) se résout donc directement dans l'espace d'origine avec le noyau K(x, x̃) = ⟨φ(x),
		φ(x̃)⟩.
	</p>
</div>

<style>
	.fm-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.fm-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: stretch;
	}

	.fm-grid.solo {
		grid-template-columns: minmax(0, 1fr);
	}

	@media (max-width: 900px) {
		.fm-grid {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.panel-ttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.note-box {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 1rem;
		border: 1px dashed var(--color-border);
		border-radius: 6px;
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		font-size: 0.85rem;
		line-height: 1.6;
		min-height: 200px;
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
