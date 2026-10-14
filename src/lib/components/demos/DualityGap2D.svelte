<script lang="ts">
	/**
	 * Démo « Dualité et écart primal–dual » — leçon expert « Dualité convexe et
	 * conditions KKT » (Partie I), sections 2 (exemple conducteur) et 8 (piège).
	 *
	 * Deux onglets :
	 *  1. Conducteur 2-D : min (x−1)²+(y−1)² s.t. x+y ≤ 1. Demi-plan faisable
	 *     (SVG 2-D fait main — CurveChart ne gère pas les régions 2-D), trajectoire
	 *     x(λ) = (1−λ/2, 1−λ/2), courbe g(λ) = λ−λ²/2, ligne p* = ½, aire ombrée
	 *     = gap(λ) = (λ−1)²/2, lecture KKT (badge qui s'allume en λ* = 1).
	 *  2. Piège 1-D : min (x−2)² s.t. x² ≥ 1. Ensemble faisable déconnecté
	 *     {x ≤ −1} ∪ {x ≥ 1} ombré (SVG fait main), courbe f(x), x* = 2 (faisable),
	 *     g(λ) = −λ(3+λ)/(1−λ) sur [0,1), ligne d* = 0, aire = gap ponctuel
	 *     λ(3+λ)/(1−λ) dont l'infimum est 0 — la leçon : la non-convexité seule
	 *     n'ouvre pas de gap.
	 *
	 * NOTE D'HONNÊTETÉ (visible en légende) : les formes closes sont calculées
	 * ici et vérifiées par contre-minimisation numérique (duality.test.ts) ;
	 * aucune source imprimée ne les donne pour ces exemples. Machine de Boyd &
	 * Vandenberghe (2004), ch. 5.
	 *
	 * Les SVG 2-D / droite graduée sont des fallbacks faits main (AGENTS.md) :
	 * CurveChart ne expose ni régions ombrées ni axe 2-D, à remplacer si un
	 * composant dédié est construit.
	 */
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import RadioGroup from '$lib/components/controls/RadioGroup.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import {
		CONDUCTOR_2D_OPTIMUM,
		GAP_TRAP_OPTIMUM,
		dualFunction2D,
		dualGap2D,
		dualMinimizer2D,
		kktCheck2D,
		perturbedValue2D,
		trapDual
	} from '$lib/math/duality.js';
	import { linspace } from '$lib/math/util.js';

	type Mode = 'conducteur' | 'sensibilite' | 'piege';

	// Grilles statiques (les courbes ne dépendent pas des sliders).
	const LAMBDA_GRID = linspace(0, 3, 240);
	const G_COND_PTS: [number, number][] = LAMBDA_GRID.map((l) => [l, dualFunction2D(l)]);
	const P_LINE_PTS: [number, number][] = LAMBDA_GRID.map((l) => [l, CONDUCTOR_2D_OPTIMUM.primal]);
	const TRAP_LAMBDA_GRID = linspace(0, 0.95, 240);
	const G_TRAP_PTS: [number, number][] = TRAP_LAMBDA_GRID.map((l) => [l, trapDual(l).value]);
	const D_LINE_PTS: [number, number][] = TRAP_LAMBDA_GRID.map((l) => [l, GAP_TRAP_OPTIMUM.dual]);

	// Sensibilité : p*(u) et sa tangente duale p*(0) − λ*·u (λ* = 1).
	const U_GRID = linspace(-0.5, 1.5, 200);
	const PSTAR_PTS: [number, number][] = U_GRID.map((u) => [u, perturbedValue2D(u)]);
	const TANGENT_PTS: [number, number][] = U_GRID.map((u) => [u, CONDUCTOR_2D_OPTIMUM.primal - u]);

	let mode = $state<Mode>('conducteur');
	let lambda = $state(1);
	let trapLambda = $state(0.3);
	let u = $state(0);

	// ── Conducteur 2-D : dérivés ──────────────────────────────────────────
	const xOfLambda = $derived(dualMinimizer2D(lambda));
	const gCond = $derived(dualFunction2D(lambda));
	const gapCond = $derived(dualGap2D(lambda));
	const kktCond = $derived(kktCheck2D(xOfLambda[0], xOfLambda[1], lambda));

	// ── Piège 1-D : dérivés ───────────────────────────────────────────────
	const gTrap = $derived(trapDual(trapLambda));
	const gapTrap = $derived(-gTrap.value);
	const xTrap = $derived(trapLambda < 1 ? 2 / (1 - trapLambda) : Infinity);

	// ── Sensibilité : dérivés ─────────────────────────────────────────────
	const pStarU = $derived(perturbedValue2D(u));
	const tangentU = $derived(CONDUCTOR_2D_OPTIMUM.primal - u);
	const lambdaU = $derived(u < 1 ? 1 - u : 0);

	// ── Géométrie du SVG 2-D (conducteur) ─────────────────────────────────
	// Fallback fait main : demi-plan x+y ≤ 1 + trajectoire x(λ).
	const W = 300;
	const H = 300;
	const PAD = 30;
	const D_MIN = -0.8;
	const D_MAX = 2;
	const sx = (v: number) => PAD + ((v - D_MIN) / (D_MAX - D_MIN)) * (W - 2 * PAD);
	const sy = (v: number) => H - PAD - ((v - D_MIN) / (D_MAX - D_MIN)) * (H - 2 * PAD);

	// Triangle faisable (x+y ≤ 1) à l'intérieur du carré [D_MIN, D_MAX]².
	const feasPts = [
		[sx(D_MIN), sy(D_MIN)],
		[sx(1.8), sy(D_MIN)],
		[sx(D_MIN), sy(1.8)]
	];
	const feasPoly = feasPts.map((p) => p.join(',')).join(' ');

	// ── Géométrie de la droite graduée (piège) ────────────────────────────
	// Fallback fait main : ensemble faisable {x ≤ −1} ∪ {x ≥ 1} + f(x).
	const TW = 300;
	const TH = 190;
	const TPAD = 28;
	const TX_MIN = -2.5;
	const TX_MAX = 3.5;
	const tX = (v: number) => TPAD + ((v - TX_MIN) / (TX_MAX - TX_MIN)) * (TW - 2 * TPAD);
	const fYMax = 12;
	const fY = (v: number) => {
		const h = Math.max(0, Math.min(fYMax, v));
		return TH - 34 - (h / fYMax) * (TH - 70);
	};
	const TRAP_X_GRID = linspace(TX_MIN, TX_MAX, 200);
	const fPts: [number, number][] = TRAP_X_GRID.map((x) => [x, (x - 2) * (x - 2)]);
</script>

<div class="dgap-demo">
	<RadioGroup label="Mode">
		<RadioButton value="conducteur" bind:groupValue={mode} label="Conducteur 2-D : (x−1)²+(y−1)², x+y ≤ 1" />
		<RadioButton value="sensibilite" bind:groupValue={mode} label="Sensibilité : p*(u) et son prix marginal" />
		<RadioButton value="piege" bind:groupValue={mode} label="Piège 1-D : (x−2)², x² ≥ 1" />
	</RadioGroup>

	{#if mode === 'conducteur'}
		<Slider min={0} max={3} step={0.01} bind:value={lambda} label="Multiplicateur de Lagrange λ" />

		<div class="charts-grid">
			<div class="chart-cell">
				<h4>Demi-plan faisable et trajectoire x(λ)</h4>
				<svg viewBox={`0 0 ${W} ${H}`} class="geom" role="img" aria-label="Demi-plan faisable x+y ≤ 1 et trajectoire du minimiseur x(λ)">
					<!-- Axes -->
					<line x1={sx(0)} y1={sy(D_MIN)} x2={sx(0)} y2={sy(D_MAX)} stroke="var(--color-border)" stroke-width="1" />
					<line x1={sx(D_MIN)} y1={sy(0)} x2={sx(D_MAX)} y2={sy(0)} stroke="var(--color-border)" stroke-width="1" />
					<!-- Région faisable x+y ≤ 1 -->
					<polygon
						points={feasPoly}
						fill="var(--color-positive)"
						opacity="0.12"
					/>
					<!-- Frontière x+y = 1 -->
					<line
						x1={sx(1.8)}
						y1={sy(D_MIN)}
						x2={sx(D_MIN)}
						y2={sy(1.8)}
						stroke="var(--color-surprise)"
						stroke-width="2"
					/>
					<!-- Trajectoire (1,1) → x(λ) -->
					<line
						x1={sx(1)}
						y1={sy(1)}
						x2={sx(xOfLambda[0])}
						y2={sy(xOfLambda[1])}
						stroke="var(--color-belief)"
						stroke-width="2"
						stroke-dasharray="4 3"
					/>
					<!-- Minimum libre (1,1), infeasible -->
					<circle cx={sx(1)} cy={sy(1)} r="5" fill="none" stroke="var(--color-surprise)" stroke-width="2" />
					<text x={sx(1) + 8} y={sy(1) - 8} class="lbl" fill="var(--color-surprise)">(1,1) min libre</text>
					<!-- Optimum (1/2,1/2) -->
					<circle
						cx={sx(CONDUCTOR_2D_OPTIMUM.xStar)}
						cy={sy(CONDUCTOR_2D_OPTIMUM.yStar)}
						r="5.5"
						fill="var(--color-positive)"
						stroke="var(--color-bg)"
						stroke-width="2"
					/>
					<text x={sx(0.5) + 8} y={sy(0.5) + 14} class="lbl" fill="var(--color-positive)">(½,½) = x*</text>
					<!-- Point courant x(λ) -->
					<circle
						cx={sx(xOfLambda[0])}
						cy={sy(xOfLambda[1])}
						r="5.5"
						fill="var(--color-belief)"
						stroke="var(--color-bg)"
						stroke-width="2"
					/>
				</svg>
			</div>
			<div class="chart-cell">
				<h4>Fonction duale g(λ) et écart</h4>
				<CurveChart
					curves={[
						{ points: G_COND_PTS, stroke: 'var(--color-belief)' },
						{ points: P_LINE_PTS, stroke: 'var(--color-positive)', strokeDasharray: '6 4' }
					]}
					xDomain={[0, 3]}
					fillBetween={[{ curveA: 0, curveB: 1, fill: 'var(--color-surprise)', opacity: 0.18 }]}
					vlines={[{ x: CONDUCTOR_2D_OPTIMUM.lambdaStar, stroke: 'var(--color-positive)', label: 'λ* = 1' }]}
					curveDots={[
						{ x: lambda, y: gCond, fill: 'var(--color-belief)' },
						{ x: CONDUCTOR_2D_OPTIMUM.lambdaStar, y: CONDUCTOR_2D_OPTIMUM.dual, fill: 'var(--color-positive)' }
					]}
					legend={[
						{ label: 'g(λ) = λ − λ²/2', color: 'var(--color-belief)' },
						{ label: 'p* = d* = ½', color: 'var(--color-positive)', kind: 'dashed-line' }
					]}
					chartLabel="aire ombrée = gap(λ) = (λ−1)²/2"
				/>
			</div>
		</div>

		<div class="kkt-panel">
			<h4>Conditions KKT du couple (x(λ), λ)</h4>
			<p class="kkt-hint">
				La stationnarité est vérifiée par construction (x(λ) minimise L en (x, y)) ; ce sont la
				faisabilité primal et la complémentarité qui sélectionnent λ* = 1.
			</p>
			<ul class="kkt-rows">
				<li class="kkt-row" class:ok={kktCond.primalFeasible}>
					<span class="kkt-status" aria-hidden="true">{kktCond.primalFeasible ? '✓' : '✗'}</span>
					<span class="kkt-label">Faisabilité primal : x(λ)+y(λ) ≤ 1</span>
					<span class="kkt-value">x+y = {(xOfLambda[0] + xOfLambda[1]).toFixed(3)}</span>
				</li>
				<li class="kkt-row" class:ok={kktCond.dualFeasible}>
					<span class="kkt-status" aria-hidden="true">{kktCond.dualFeasible ? '✓' : '✗'}</span>
					<span class="kkt-label">Faisabilité dual : λ ≥ 0</span>
					<span class="kkt-value">λ = {lambda.toFixed(2)}</span>
				</li>
				<li class="kkt-row" class:ok={kktCond.complementarySlackness}>
					<span class="kkt-status" aria-hidden="true">{kktCond.complementarySlackness ? '✓' : '✗'}</span>
					<span class="kkt-label">Complémentarité : λ(x+y−1) = 0</span>
					<span class="kkt-value">λ(x+y−1) = {(lambda * (xOfLambda[0] + xOfLambda[1] - 1)).toFixed(3)}</span>
				</li>
				<li class="kkt-row" class:ok={kktCond.stationarity}>
					<span class="kkt-status" aria-hidden="true">{kktCond.stationarity ? '✓' : '✗'}</span>
					<span class="kkt-label">Stationnarité : 2(x−1)+λ = 0 et 2(y−1)+λ = 0</span>
					<span class="kkt-value">résidu = {kktCond.stationarityResiduals[0].toFixed(3)}</span>
				</li>
			</ul>
			{#if kktCond.allSatisfied}
				<p class="kkt-banner">
					Toutes les conditions KKT sont satisfaites : (x(λ), λ) = (½, ½), 1 est le point KKT
					unique — dualité forte (Slater), écart nul.
				</p>
			{/if}
		</div>

		<div class="metrics">
			<div class="metric">
				<span class="metric-label">p* = d*</span>
				<span class="metric-value">0.5</span>
			</div>
			<div class="metric">
				<span class="metric-label">g(λ)</span>
				<span class="metric-value">{gCond.toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">écart p* − g(λ)</span>
				<span class="metric-value">{gapCond.toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">x(λ)</span>
				<span class="metric-value">({xOfLambda[0].toFixed(2)}, {xOfLambda[1].toFixed(2)})</span>
			</div>
		</div>
	{:else if mode === 'sensibilite'}
		<Slider min={-0.5} max={1.5} step={0.01} bind:value={u} label="Perturbation de la contrainte u (x+y ≤ 1+u)" />

		<div class="charts-grid">
			<div class="chart-cell">
				<h4>Valeur optimale perturbée p*(u) et tangente duale</h4>
				<CurveChart
					curves={[
						{ points: PSTAR_PTS, stroke: 'var(--color-belief)' },
						{ points: TANGENT_PTS, stroke: 'var(--color-positive)', strokeDasharray: '6 4' }
					]}
					xDomain={[-0.5, 1.5]}
					fillBetween={[{ curveA: 0, curveB: 1, fill: 'var(--color-surprise)', opacity: 0.15 }]}
					vlines={[
						{ x: 0, stroke: 'var(--color-text-muted)', label: 'u = 0' },
						{ x: 1, stroke: 'var(--color-agent)', label: 'u = 1 (cassure)' }
					]}
					curveDots={[
						{ x: u, y: pStarU, fill: 'var(--color-belief)' },
						{ x: u, y: tangentU, fill: 'var(--color-positive)' }
					]}
					legend={[
						{ label: 'p*(u) = (1−u)²/2 si u ≤ 1, 0 sinon', color: 'var(--color-belief)' },
						{ label: 'tangente p*(0) − λ*·u = ½ − u', color: 'var(--color-positive)', kind: 'dashed-line' }
					]}
					chartLabel="p* convexe : toujours au-dessus de sa tangente (5.57)"
				/>
			</div>
			<div class="chart-cell sens-text">
				<h4>Le multiplicateur comme prix marginal</h4>
				<p>
					On relâche la contrainte <strong>x + y ≤ 1 + u</strong>. Tant que
					<strong>u &lt; 1</strong>, la contrainte reste active, la symétrie donne
					<strong>x*(u) = y*(u) = (1+u)/2</strong> et le multiplicateur vaut
					<strong>λ(u) = 1 − u</strong>.
				</p>
				<p>
					La courbe <strong>p*(u)</strong> reste <strong>au-dessus de sa tangente</strong>
					en 0 (convexité, inégalité 5.57) ; la pente de cette tangente est
					<strong>−λ*</strong>, donc <strong>λ(u) = −p*'(u)</strong> : le multiplicateur
					optimal est le <strong>taux marginal</strong> — de combien p* baisse quand on
					relâche la contrainte d'une unité.
				</p>
				<p>
					Au-delà de u = 1, le point libre (1,1) devient faisable : p*(u) = 0 et le prix
					marginal s'annule (λ(u) = 0).
				</p>
			</div>
		</div>

		<div class="metrics">
			<div class="metric">
				<span class="metric-label">p*(u)</span>
				<span class="metric-value">{pStarU.toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">tangente ½ − u</span>
				<span class="metric-value">{tangentU.toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">p*(u) − tangente</span>
				<span class="metric-value">{(pStarU - tangentU).toFixed(3)}</span>
			</div>
			<div class="metric">
				<span class="metric-label">λ(u) = −p*'(u)</span>
				<span class="metric-value">{lambdaU.toFixed(3)}</span>
			</div>
		</div>
	{:else}
		<Slider min={0} max={0.95} step={0.005} bind:value={trapLambda} label="Multiplicateur λ (λ &lt; 1)" />

		<div class="charts-grid">
			<div class="chart-cell">
				<h4>Droite réelle, ensemble faisable et f(x) = (x−2)²</h4>
				<svg viewBox={`0 0 ${TW} ${TH}`} class="geom" role="img" aria-label="Droite réelle avec l'ensemble faisable x² ≥ 1 ombré et la courbe f(x) = (x−2)², minimum en x* = 2">
					<!-- Régions faisables {x ≤ −1} ∪ {x ≥ 1} -->
					<rect x={tX(TX_MIN)} y={30} width={tX(-1) - tX(TX_MIN)} height={TH - 64} fill="var(--color-positive)" opacity="0.14" />
					<rect x={tX(1)} y={30} width={tX(TX_MAX) - tX(1)} height={TH - 64} fill="var(--color-positive)" opacity="0.14" />
					<!-- Zone non faisable (−1, 1) -->
					<rect x={tX(-1)} y={30} width={tX(1) - tX(-1)} height={TH - 64} fill="var(--color-surprise)" opacity="0.08" />
					<!-- Courbe f(x) -->
					<polyline
						points={fPts.map(([x, y]) => `${tX(x)},${fY(y)}`).join(' ')}
						fill="none"
						stroke="var(--color-text-muted)"
						stroke-width="2"
					/>
					<!-- Axe des x -->
					<line x1={tX(TX_MIN)} y1={TH - 34} x2={tX(TX_MAX)} y2={TH - 34} stroke="var(--color-border)" stroke-width="1.5" />
					<!-- Graduations -->
					{#each [-2, -1, 0, 1, 2, 3] as tk}
						<line x1={tX(tk)} y1={TH - 38} x2={tX(tk)} y2={TH - 30} stroke="var(--color-border)" stroke-width="1" />
						<text x={tX(tk)} y={TH - 20} text-anchor="middle" class="tick" fill="var(--color-text-muted)">{tk}</text>
					{/each}
					<!-- Frontières x = ±1 -->
					<line x1={tX(-1)} y1={30} x2={tX(-1)} y2={TH - 34} stroke="var(--color-surprise)" stroke-width="1.5" stroke-dasharray="4 3" />
					<line x1={tX(1)} y1={30} x2={tX(1)} y2={TH - 34} stroke="var(--color-surprise)" stroke-width="1.5" stroke-dasharray="4 3" />
					<!-- x* = 2 (faisable) -->
					<circle cx={tX(2)} cy={fY(0)} r="5.5" fill="var(--color-positive)" stroke="var(--color-bg)" stroke-width="2" />
					<text x={tX(2) + 8} y={fY(0) - 8} class="lbl" fill="var(--color-positive)">x* = 2 (faisable)</text>
				</svg>
			</div>
			<div class="chart-cell">
				<h4>Fonction duale g(λ) sur [0, 1) et écart ponctuel</h4>
				<CurveChart
					curves={[
						{ points: G_TRAP_PTS, stroke: 'var(--color-belief)' },
						{ points: D_LINE_PTS, stroke: 'var(--color-positive)', strokeDasharray: '6 4' }
					]}
					xDomain={[0, 0.95]}
					yDomain={[-40, 2]}
					fillBetween={[{ curveA: 0, curveB: 1, fill: 'var(--color-surprise)', opacity: 0.18 }]}
					vlines={[{ x: 0, stroke: 'var(--color-positive)', label: 'λ* = 0' }]}
					curveDots={[
						{ x: trapLambda, y: gTrap.value, fill: 'var(--color-belief)' },
						{ x: 0, y: GAP_TRAP_OPTIMUM.dual, fill: 'var(--color-positive)' }
					]}
					legend={[
						{ label: 'g(λ) = −λ(3+λ)/(1−λ)', color: 'var(--color-belief)' },
						{ label: 'd* = 0', color: 'var(--color-positive)', kind: 'dashed-line' }
					]}
					chartLabel="échelle tronquée ; aire = gap(λ) = λ(3+λ)/(1−λ)"
				/>
			</div>
		</div>

		<div class="kkt-panel">
			<h4>Pourquoi le gap est nul malgré la non-convexité</h4>
			<p class="kkt-hint">
				L'ensemble faisable <strong>{'{x ≤ −1} ∪ {x ≥ 1}'}</strong> est déconnecté — un piège visuel.
				Mais le minimiseur libre <strong>x = 2</strong> est <strong>faisable</strong> (2² ≥ 1),
				donc <strong>p* = f(2) = 0</strong> et la contrainte est inactive en x*. Le dual donne
				<strong>d* = g(0) = 0</strong> : l'écart optimal est <strong>0</strong>.
			</p>
			<p class="kkt-banner">
				Non-convexe, gap nul : c'est la qualification de contrainte (pas la convexité de
				l'ensemble) qui fait la dualité forte. Le gap ponctuel λ(3+λ)/(1−λ) part de 0 et explose
				— son infimum est 0.
			</p>
		</div>

		<div class="metrics">
			<div class="metric">
				<span class="metric-label">p* = d*</span>
				<span class="metric-value">0</span>
			</div>
			<div class="metric">
				<span class="metric-label">g(λ)</span>
				<span class="metric-value">{Number.isFinite(gTrap.value) ? gTrap.value.toFixed(3) : '−∞'}</span>
			</div>
			<div class="metric">
				<span class="metric-label">gap ponctuel</span>
				<span class="metric-value">{Number.isFinite(gapTrap) ? gapTrap.toFixed(3) : '∞'}</span>
			</div>
			<div class="metric">
				<span class="metric-label">x(λ) = 2/(1−λ)</span>
				<span class="metric-value">{Number.isFinite(xTrap) ? xTrap.toFixed(2) : '+∞'}</span>
			</div>
		</div>
	{/if}

	<p class="demo-note">
		Formes closes calculées ici, vérifiées par contre-minimisation numérique (tests) — Boyd &amp;
		Vandenberghe (2004), ch. 5. Le gap strict (convexe sans Slater) est traité à la Partie I, leçon 1.
	</p>
</div>

<style>
	.dgap-demo {
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

	.sens-text {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.sens-text p {
		margin: 0 0 0.625rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	.sens-text p:last-child {
		margin-bottom: 0;
	}

	.geom {
		width: 100%;
		height: auto;
		display: block;
		background: var(--color-surface-2, transparent);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 6px);
	}

	.lbl {
		font-size: 10px;
		font-family: var(--font-sans);
	}

	.tick {
		font-size: 10px;
		font-family: var(--font-mono);
	}

	.kkt-panel {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.875rem 1rem;
		background: var(--color-surface-2, transparent);
	}

	.kkt-panel h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.kkt-hint {
		margin: 0 0 0.625rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.kkt-rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.kkt-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-sm, 6px);
		border: 1px solid var(--color-border);
		font-size: 0.8125rem;
	}

	.kkt-row.ok {
		border-color: color-mix(in srgb, var(--color-positive) 45%, transparent);
		background: color-mix(in srgb, var(--color-positive) 7%, transparent);
	}

	.kkt-status {
		font-weight: 700;
		color: var(--color-surprise);
	}

	.kkt-row.ok .kkt-status {
		color: var(--color-positive);
	}

	.kkt-label {
		flex: 1;
	}

	.kkt-value {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.kkt-banner {
		margin: 0.625rem 0 0;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm, 6px);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 9%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-positive) 35%, transparent);
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.625rem;
	}

	@media (max-width: 700px) {
		.metrics {
			grid-template-columns: repeat(2, 1fr);
		}
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
