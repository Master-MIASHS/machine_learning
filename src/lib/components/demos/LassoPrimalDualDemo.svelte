<script lang="ts">
	/**
	 * Démo « Lasso : primale et duale » — leçon expert « Dualité convexe et
	 * conditions KKT » (Partie I), section 7 (fil-lasso).
	 *
	 * Petit problème fixe (LASSO_DEMO) : X diagonal 2×2 plein rang, y ∈ R² —
	 * choix déterministe documenté : les deux coordonnées se découplent et les
	 * seuils de parcimonie sont exacts à la main (θ₁* = S_λ(3), meurt en λ = 3 ;
	 * θ₂* = S_λ(−2)/4, meurt en λ = 2). NOTE D'HONNÊTETÉ (visible en légende) :
	 * petit problème synthétique — illustration de la machine primal–duale, pas
	 * un benchmark. Les duales sont calculées ici et vérifiées numériquement
	 * (duality.test.ts).
	 *
	 * Affichage : (1) valeurs primale p(λ) et duale d(λ) de Fenchel superposées
	 * (dualité forte visible) ; (2) chemin des coefficients θ*(λ) avec les zéros
	 * (parcimonie qui apparaît en gros λ) ; (3) le vecteur z* = Xᵀ(y−Xθ*)/λ dans
	 * la boîte [−1,1]², saturé à ±1 exactement quand θ*_i ≠ 0 (complémentarité
	 * du sous-différentiel). SVG de la boîte z* fait main (fallback AGENTS.md :
	 * aucun composant ne gère une boîte de sous-différentiel 2-D).
	 */
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import {
		LASSO_DEMO,
		lassoDualFenchel,
		lassoKktReport,
		lassoPrimal,
		lassoPrimalValue
	} from '$lib/math/duality.js';
	import { linspace } from '$lib/math/util.js';

	const { X, y, lambdaMax } = LASSO_DEMO;
	const D = X[0].length;

	// Chemins statiques (indépendants du slider) — une seule passe sur la grille.
	const LAMBDA_GRID = linspace(0, lambdaMax, 121);
	const paths = LAMBDA_GRID.map((l) => {
		const theta = lassoPrimal(X, y, l);
		return {
			l,
			theta,
			p: lassoPrimalValue(X, y, theta, l),
			d: lassoDualFenchel(X, y, l).value
		};
	});
	const PRIMAL_PTS: [number, number][] = paths.map((r) => [r.l, r.p]);
	const DUAL_PTS: [number, number][] = paths.map((r) => [r.l, r.d]);
	const THETA_PTS: [number, number][][] = Array.from({ length: D }, (_, i) =>
		paths.map((r) => [r.l, r.theta[i]])
	);

	let lambda = $state(1);

	const theta = $derived(lassoPrimal(X, y, lambda));
	const primal = $derived(lassoPrimalValue(X, y, theta, lambda));
	const dual = $derived(lassoDualFenchel(X, y, lambda).value);
	const l1 = $derived(theta.reduce((s, t) => s + Math.abs(t), 0));
	const kkt = $derived(lambda > 0 ? lassoKktReport(X, y, theta, lambda) : null);
	const gap = $derived(Math.abs(primal - dual));

	// ── Boîte z* ∈ [−1,1]² (SVG fait main) ────────────────────────────────
	const BW = 190;
	const BH = 190;
	const BPAD = 30;
	const bz = (v: number) => {
		const c = Math.max(-1.15, Math.min(1.15, v));
		return BPAD + ((c + 1.15) / 2.3) * (BW - 2 * BPAD);
	};
	const bzY = (v: number) => BH - bz(v);
</script>

<div class="lasso-pd-demo">
	<Slider min={0} max={lambdaMax} step={0.01} bind:value={lambda} label="Paramètre de régularisation λ" />

	<div class="charts-grid">
		<div class="chart-cell">
			<h4>Valeur primale p(λ) et valeur duale de Fenchel d(λ)</h4>
			<CurveChart
				curves={[
					{ points: PRIMAL_PTS, stroke: 'var(--color-belief)' },
					{ points: DUAL_PTS, stroke: 'var(--color-positive)', strokeDasharray: '6 4' }
				]}
				xDomain={[0, lambdaMax]}
				vlines={[{ x: lambda, stroke: 'var(--color-text-muted)', label: `λ = ${lambda.toFixed(2)}` }]}
				curveDots={[
					{ x: lambda, y: primal, fill: 'var(--color-belief)' },
					{ x: lambda, y: dual, fill: 'var(--color-positive)' }
				]}
				legend={[
					{ label: 'p(λ) = ½‖y−Xθ*(λ)‖² + λ‖θ*(λ)‖₁', color: 'var(--color-belief)' },
					{ label: 'd(λ) — duale de Fenchel', color: 'var(--color-positive)', kind: 'dashed-line' }
				]}
				chartLabel="deux courbes superposées = dualité forte"
			/>
		</div>
		<div class="chart-cell">
			<h4>Chemin des coefficients θ*(λ) — la parcimonie</h4>
			<CurveChart
				curves={[
					{ points: THETA_PTS[0], stroke: 'var(--color-belief)' },
					{ points: THETA_PTS[1], stroke: 'var(--color-surprise)' }
				]}
				xDomain={[0, lambdaMax]}
				vlines={[{ x: lambda, stroke: 'var(--color-text-muted)', label: `λ = ${lambda.toFixed(2)}` }]}
				curveDots={[
					{ x: lambda, y: theta[0], fill: 'var(--color-belief)' },
					{ x: lambda, y: theta[1], fill: 'var(--color-surprise)' }
				]}
				legend={[
					{ label: 'θ₁*(λ) = S_λ(3) — meurt en λ = 3', color: 'var(--color-belief)' },
					{ label: 'θ₂*(λ) = S_λ(−2)/4 — meurt en λ = 2', color: 'var(--color-surprise)' }
				]}
				chartLabel="chaque coordonnée s'éteint à son seuil"
			/>
		</div>
	</div>

	<div class="zpanel">
		<div class="zchart">
			<h4>Complémentarité du sous-différentiel : z* = Xᵀ(y − Xθ*)/λ ∈ ∂‖θ*‖₁</h4>
			{#if kkt}
				<svg
					viewBox={`0 0 ${BW} ${BH}`}
					class="zbox"
					role="img"
					aria-label="Vecteur z* dans la boîte [−1,1]², saturé à ±1 sur les coordonnées non nulles de θ*"
				>
					<!-- Boîte [−1,1]² -->
					<rect
						x={bz(-1)}
						y={bzY(-1)}
						width={bz(1) - bz(-1)}
						height={bz(1) - bzY(-1)}
						fill="var(--color-agent)"
						opacity="0.08"
					/>
					<rect
						x={bz(-1)}
						y={bzY(-1)}
						width={bz(1) - bz(-1)}
						height={bz(1) - bzY(-1)}
						fill="none"
						stroke="var(--color-border)"
						stroke-width="1.5"
					/>
					<!-- Axes 0 -->
					<line x1={bz(0)} y1={bzY(-1)} x2={bz(0)} y2={bzY(1)} stroke="var(--color-border)" stroke-width="1" />
					<line x1={bz(-1)} y1={bzY(0)} x2={bz(1)} y2={bzY(0)} stroke="var(--color-border)" stroke-width="1" />
					<!-- Graduations ±1 -->
					<text x={bz(-1)} y={bzY(1) - 6} text-anchor="middle" class="tick" fill="var(--color-text-muted)">−1</text>
					<text x={bz(1)} y={bzY(1) - 6} text-anchor="middle" class="tick" fill="var(--color-text-muted)">+1</text>
					<!-- Point z* -->
					<circle
						cx={bz(kkt.z[0])}
						cy={bzY(kkt.z[1])}
						r="5.5"
						fill="var(--color-agent)"
						stroke="var(--color-bg)"
						stroke-width="2"
					/>
				</svg>
				<ul class="zrows">
					{#each kkt.z as zi, i}
						{@const sat = Math.abs(zi) >= 1 - 1e-6 && Math.abs(theta[i]) > 1e-7}
						<li class="zrow" class:sat>
							<span class="zlabel">z*_{i + 1} = {zi.toFixed(3)}</span>
							<span class="zstate">
								{#if sat}
									saturé à {zi > 0 ? '+1' : '−1'} (θ*_{i + 1} ≠ 0)
								{:else if Math.abs(theta[i]) > 1e-7}
									doit valoir sign(θ*_{i + 1})
								{:else}
									|z*| ≤ 1 (θ*_{i + 1} = 0)
								{/if}
							</span>
						</li>
					{/each}
				</ul>
				{#if kkt.subgradientOk}
					<p class="zbadge ok">z* ∈ ∂‖θ*‖₁ — inclusion KKT vérifiée (‖z*‖∞ = {kkt.maxAbsZ.toFixed(3)})</p>
				{:else}
					<p class="zbadge bad">z* ∉ ∂‖θ*‖₁ — vérifiez la solution</p>
				{/if}
			{:else}
				<p class="z-undefined">
					z* = Xᵀ(y − Xθ*)/λ n'est pas défini en λ = 0 (la régularisation disparaît) —
					faites glisser λ &gt; 0.
				</p>
			{/if}
		</div>
		<div class="metrics">
			<div class="metric">
				<span class="metric-label">θ₁*</span>
				<span class="metric-value">{theta[0].toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">θ₂*</span>
				<span class="metric-value">{theta[1].toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">‖θ*‖₁</span>
				<span class="metric-value">{l1.toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">p(λ) − d(λ)</span>
				<span class="metric-value">{gap < 1e-9 ? '0' : gap.toExponential(1)}</span>
			</div>
		</div>
	</div>

	<p class="demo-note">
		Petit problème synthétique fixe (X diagonal, y = (3, −1)) — illustration de la machine
		primal–duale, pas un benchmark. Les duales sont calculées ici, vérifiées par dualité forte
		numérique (tests) ; aucune source imprimée consultée ne les donne.
	</p>
</div>

<style>
	.lasso-pd-demo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 700px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	.chart-cell h4 {
		margin: 0 0 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.zpanel {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.875rem 1rem;
		background: var(--color-surface-2, transparent);
	}

	@media (max-width: 700px) {
		.zpanel {
			grid-template-columns: 1fr;
		}
	}

	.zchart h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.zbox {
		width: 100%;
		max-width: 190px;
		height: auto;
		display: block;
	}

	.tick {
		font-size: 10px;
		font-family: var(--font-mono);
	}

	.zrows {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.zrow {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 6px);
		font-size: 0.8125rem;
	}

	.zrow.sat {
		border-color: color-mix(in srgb, var(--color-agent) 50%, transparent);
		background: color-mix(in srgb, var(--color-agent) 8%, transparent);
	}

	.zlabel {
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	.zstate {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		text-align: right;
	}

	.zbadge {
		margin: 0.625rem 0 0;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm, 6px);
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.zbadge.ok {
		color: var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 9%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-positive) 35%, transparent);
	}

	.zbadge.bad {
		color: var(--color-surprise);
		background: color-mix(in srgb, var(--color-surprise) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-surprise) 35%, transparent);
	}

	.z-undefined {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.625rem;
		align-content: start;
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 6px);
	}

	.metric-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.metric-value {
		font-family: var(--font-mono);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-belief);
	}

	.demo-note {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
