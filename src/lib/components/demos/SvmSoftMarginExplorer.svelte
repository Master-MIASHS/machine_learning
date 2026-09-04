<script lang="ts">
	/**
	 * Démo « Le paramètre C : compromis entre marge et outliers » (SVM à
	 * marge souple).
	 *
	 * Compare la solution duale à marge souple (solveSvmDual, eq. optim5) pour
	 * une valeur de C choisie au curseur (échelle logarithmique 10⁻² à 10³)
	 * avec la référence « marge rigide » (C → ∞) sur le preset quasi séparable,
	 * et trace les courbes γ(C) et Σξ_i(C) sur 12 valeurs de C log-espacées.
	 *
	 * Les droites (frontière, hyperplans de support ±1, référence marge
	 * rigide) sont tracées en snippetOverlay de ScatterPlot : projection
	 * synchronisée avec le pad=4 interne de ScatterPlot, clipage Liang-Barsky
	 * au cadre (même pattern que LinearClassifierExplorer).
	 */
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import CurveChart from '$lib/components/charts/CurveChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import type { LabeledPoint2D } from '$lib/math/linear-classifier';
	import { generateSeparableClasses2D } from '$lib/math/linear-classifier';
	import {
		generateNoisyClasses2D,
		norm,
		slackVariables,
		solveSvmDual,
		type SvmSolution
	} from '$lib/math/svm';

	const XMIN = -4;
	const XMAX = 6;
	const YMIN = -4;
	const YMAX = 6;
	const SIZE = 420;
	const PAD = 4; // synchronisé avec le pad interne de ScatterPlot

	type Preset = 'bruit' | 'separable' | 'petit';

	let preset = $state<Preset>('bruit');
	let C = $state(1);

	const points = $derived.by((): LabeledPoint2D[] => {
		if (preset === 'bruit') return generateNoisyClasses2D(30, 2.2, 1, 1050);
		if (preset === 'separable') return generateSeparableClasses2D(25, 1.8, 42);
		return generateNoisyClasses2D(8, 1.6, 1, 7);
	});

	const sol = $derived(solveSvmDual(points, C, { tol: 1e-4, maxPasses: 150 }));

	// Référence « marge rigide » (C → ∞) : seulement pour le preset quasi
	// séparable, afin de comparer marge rigide et marge souple sur le même
	// jeu de données.
	const hardSol = $derived.by((): SvmSolution | null =>
		preset === 'separable' ? solveSvmDual(points, 1e6, { tol: 1e-5, maxPasses: 200 }) : null
	);

	// ── Courbes de compromis : γ(C) et Σξ_i(C) sur 12 valeurs de C ───────
	let tradeoff = $state<{ logC: number; gamma: number; slacks: number }[]>([]);

	const K_TRADEOFF = 128;
	$effect(() => {
		const pts = points;
		const rows: { logC: number; gamma: number; slacks: number }[] = [];
		for (let k = 0; k < K_TRADEOFF; k++) {
			const logC = -2 + (k * 5) / (K_TRADEOFF - 1);
			const s = solveSvmDual(pts, Math.pow(10, logC), { tol: 1e-4, maxPasses: 150 });
			const nw = norm(s.w);
			rows.push({
				logC,
				gamma: nw > 0 ? 1 / nw : 0,
				slacks: slackVariables(s.w, s.b, pts).reduce((a, v) => a + v, 0)
			});
		}
		tradeoff = rows;
	});

	const gammaPoints = $derived(tradeoff.map((t) => [t.logC, t.gamma] as [number, number]));
	const slacksPoints = $derived(tradeoff.map((t) => [t.logC, t.slacks] as [number, number]));
	const curves = $derived([
		{ points: gammaPoints, stroke: 'var(--color-positive)' },
		{ points: slacksPoints, stroke: 'var(--color-surprise)' }
	]);

	// ── Lecture du classifieur ───────────────────────────────────────────
	const gamma = $derived.by((): number => {
		const nw = norm(sol.w);
		return nw > 0 ? 1 / nw : 0;
	});
	const slacks = $derived(slackVariables(sol.w, sol.b, points).reduce((a, v) => a + v, 0));
	const cDisplay = $derived(C < 0.1 || C >= 100 ? C.toExponential(1) : C.toFixed(2));

	// Pointeur sur les courbes : position de la solution courante (C, γ, Σξ).
	const currentDots = $derived.by(() => {
		const logC = Math.log10(C);
		return [
			{ x: logC, y: gamma, fill: 'var(--color-positive)' },
			{ x: logC, y: slacks, fill: 'var(--color-surprise)' }
		];
	});

	const plotPoints = $derived(
		points.map((p) => ({ x: p.x1, y: p.x2, group: p.label === 1 ? 'data-1' : 'data-0' }))
	);

	function colorByGroup(d: { group?: string | number }): string {
		if (d.group === 'data-1') return 'var(--color-belief)';
		if (d.group === 'data-0') return 'var(--color-surprise)';
		return 'var(--color-text-muted)';
	}

	// ── Projection (mirror de ScatterPlot, pad = 4) ─────────────────────
	function projectX(x: number): number {
		return PAD + ((x - XMIN) / (XMAX - XMIN)) * (SIZE - 2 * PAD);
	}
	function projectY(y: number): number {
		return PAD + ((YMAX - y) / (YMAX - YMIN)) * (SIZE - 2 * PAD);
	}

	// ── Clip de la droite w₁x + w₂y = c au cadre (Liang-Barsky, même
	//    pattern que LinearClassifierExplorer) ────────────────────────────
	interface Segment {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}

	function clipLine(c: number, w: number[]): Segment | null {
		const [wa, wb] = w;
		let A: [number, number];
		let B: [number, number];
		if (Math.abs(wb) > 1e-12) {
			const yAt = (x: number) => (c - wa * x) / wb;
			A = [XMIN, yAt(XMIN)];
			B = [XMAX, yAt(XMAX)];
		} else if (Math.abs(wa) > 1e-12) {
			const x = c / wa;
			A = [x, YMIN];
			B = [x, YMAX];
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
		const ok =
			clip(-dx, A[0] - XMIN) &&
			clip(dx, XMAX - A[0]) &&
			clip(-dy, A[1] - YMIN) &&
			clip(dy, YMAX - A[1]);
		if (!ok) return null;
		return {
			x1: A[0] + t0 * dx,
			y1: A[1] + t0 * dy,
			x2: A[0] + t1 * dx,
			y2: A[1] + t1 * dy
		};
	}

	// ── Segments tracés sur le graphique ─────────────────────────────────
	const boundary = $derived(clipLine(-sol.b, sol.w));
	const solPlus = $derived(clipLine(1 - sol.b, sol.w));
	const solMinus = $derived(clipLine(-1 - sol.b, sol.w));
	const hardBoundary = $derived(hardSol ? clipLine(-hardSol.b, hardSol.w) : null);

	// Zone d'indécision : le quadrilatère n'existe que si les deux hyperplans
	// de support traversent le cadre ; sinon on saute le remplissage.
	const stripPoly = $derived.by((): string | null => {
		if (!solPlus || !solMinus) return null;
		const A1 = `${projectX(solPlus.x1)},${projectY(solPlus.y1)}`;
		const A2 = `${projectX(solPlus.x2)},${projectY(solPlus.y2)}`;
		const B1 = `${projectX(solMinus.x1)},${projectY(solMinus.y1)}`;
		const B2 = `${projectX(solMinus.x2)},${projectY(solMinus.y2)}`;
		return `M${A1} L${A2} L${B2} L${B1} Z`;
	});

	// Étoile 5 branches (chemin SVG simple) pour les vecteurs de support.
	function starPath(cx: number, cy: number, r: number): string {
		const parts: string[] = [];
		for (let i = 0; i < 10; i++) {
			const ang = -Math.PI / 2 + (i * Math.PI) / 5;
			const rad = i % 2 === 0 ? r : r * 0.45;
			parts.push(
				`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`
			);
		}
		return `M${parts.join('L')}Z`;
	}

	const supportStars = $derived.by(() => {
		const out: { i: number; x: number; y: number }[] = [];
		for (const i of sol.supportIndices) {
			const p = points[i];
			if (p) out.push({ i, x: projectX(p.x1), y: projectY(p.x2) });
		}
		return out;
	});

	// Outliers : anneau neutre (couleur du texte), lisible quelle que soit la
	// classe du point sous-jacent ; points mal classés : carré en surimpression.
	const outlierRings = $derived.by(() => {
		const out: { i: number; x: number; y: number }[] = [];
		for (const i of sol.outlierIndices) {
			const p = points[i];
			if (p) out.push({ i, x: projectX(p.x1), y: projectY(p.x2) });
		}
		return out;
	});

	const misclassifiedSquares = $derived.by(() => {
		const out: { i: number; x: number; y: number }[] = [];
		for (const i of sol.misclassifiedIndices) {
			const p = points[i];
			if (p) out.push({ i, x: projectX(p.x1), y: projectY(p.x2) });
		}
		return out;
	});

	function setPreset(p: Preset): void {
		preset = p;
	}
</script>

<div class="ssm-demo">
	<div class="explorer-grid">
		<div class="plot-panel">
			<ScatterPlot
				points={plotPoints}
				domainX={[XMIN, XMAX]}
				domainY={[YMIN, YMAX]}
				width={SIZE}
				height={SIZE}
				colorBy={colorByGroup}
				defaultSize={4}
				showAxes={true}
				showLabels={true}
			>
				{#snippet snippetOverlay()}
					<!-- Zone d'indécision (bande entre les hyperplans de support ±1) -->
					{#if stripPoly}
						<path d={stripPoly} fill="var(--color-positive)" opacity="0.1" />
					{/if}
					{#if solPlus}
						<line
							x1={projectX(solPlus.x1)}
							y1={projectY(solPlus.y1)}
							x2={projectX(solPlus.x2)}
							y2={projectY(solPlus.y2)}
							stroke="var(--color-positive)"
							stroke-width="1.5"
							stroke-dasharray="5 4"
						/>
					{/if}
					{#if solMinus}
						<line
							x1={projectX(solMinus.x1)}
							y1={projectY(solMinus.y1)}
							x2={projectX(solMinus.x2)}
							y2={projectY(solMinus.y2)}
							stroke="var(--color-positive)"
							stroke-width="1.5"
							stroke-dasharray="5 4"
						/>
					{/if}
					<!-- Référence « marge rigide » (C → ∞), preset quasi séparable -->
					{#if hardBoundary}
						<line
							x1={projectX(hardBoundary.x1)}
							y1={projectY(hardBoundary.y1)}
							x2={projectX(hardBoundary.x2)}
							y2={projectY(hardBoundary.y2)}
							stroke="var(--color-surprise)"
							stroke-width="1.8"
							stroke-dasharray="6 4"
						/>
					{/if}
					<!-- Frontière du SVM à marge souple : ⟨w, x⟩ + b = 0 -->
					{#if boundary}
						<line
							x1={projectX(boundary.x1)}
							y1={projectY(boundary.y1)}
							x2={projectX(boundary.x2)}
							y2={projectY(boundary.y2)}
							stroke="var(--color-agent)"
							stroke-width="2.5"
						/>
					{/if}
					<!-- Outliers : anneau ; points mal classés : carré en surimpression -->
					{#each outlierRings as r (r.i)}
						<circle
							cx={r.x}
							cy={r.y}
							r="6"
							fill="none"
							stroke="var(--color-text)"
							stroke-width="1.6"
						/>
					{/each}
					{#each misclassifiedSquares as s (s.i)}
						<rect
							x={s.x - 3.5}
							y={s.y - 3.5}
							width="7"
							height="7"
							fill="none"
							stroke="var(--color-surprise)"
							stroke-width="1.5"
						/>
					{/each}
					<!-- Vecteurs de support : étoiles (plus épaisses que les points) -->
					{#each supportStars as s (s.i)}
						<path
							d={starPath(s.x, s.y, 6.5)}
							fill="var(--color-agent)"
							stroke="var(--color-bg)"
							stroke-width="0.8"
						/>
					{/each}
				{/snippet}
			</ScatterPlot>
		</div>

		<div class="side-panel">
			<div class="readout">
				<div class="row">
					<span class="k">C</span>
					<span class="v">{cDisplay}</span>
				</div>
				<div class="row">
					<span class="k">Marge γ = 1/‖w‖</span>
					<span class="v">{gamma > 0 ? gamma.toFixed(3) : '—'}</span>
				</div>
				<div class="row">
					<span class="k">Σξ_i</span>
					<span class="v">{slacks.toFixed(2)}</span>
				</div>
				<div class="row">
					<span class="k">Vecteurs de support</span>
					<span class="v">{sol.supportIndices.length}</span>
				</div>
				<div class="row">
					<span class="k">Outliers</span>
					<span class="v">{sol.outlierIndices.length}</span>
				</div>
				<div class="row">
					<span class="k">Mal classées</span>
					<span class="v">{sol.misclassifiedIndices.length}</span>
				</div>
			</div>

			<SliderGrid variant="outline">
				<div class="grp">
					<div class="gttl">Paramètre du compromis</div>
					<Slider bind:value={C} min={0.01} max={1000} step={1} label="C" logarithmic={true} />
				</div>
			</SliderGrid>

			<div class="presets">
				<Button
					variant="outline"
					size="sm"
					selected={preset === 'bruit'}
					onclick={() => setPreset('bruit')}>Bruit</Button
				>
				<Button
					variant="outline"
					size="sm"
					selected={preset === 'separable'}
					onclick={() => setPreset('separable')}>Quasi séparables</Button
				>
				<Button
					variant="outline"
					size="sm"
					selected={preset === 'petit'}
					onclick={() => setPreset('petit')}>Petit jeu</Button
				>
			</div>
		</div>
	</div>

	<div class="tradeoff">
		<div class="chart-title">
			Compromis : marge γ et Σξ_i en fonction de log₁₀(C) — 12 résolutions SMO, C de 10⁻² à 10³
		</div>
		<CurveChart
			{curves}
			xDomain={[-2, 3]}
			yScaleType="log"
			curve="linear"
			yAxis={true}
			height={210}
			curveDots={currentDots}
			legend={[
				{ label: 'marge γ', color: 'var(--color-positive)' },
				{ label: 'Σξ_i', color: 'var(--color-surprise)' }
			]}
		/>
	</div>

	<p class="cap">
		Le SVM à marge souple minimise ½‖w‖² + C·Σξ_i : C grand punit lourdement les outliers (la
		frontière les suit et la marge s'étrécit), C petit privilégie une large marge au prix d'outliers
		(cercles) et de points mal classés (carrés roses). Dans le preset « quasi séparables », la
		frontière rose pointillée (marge rigide, C → ∞) colle aux points marginaux au risque de
		sur-apprendre, alors que la frontière souple (C fini) est plus lisse et plus robuste. Les
		courbes ci-dessus illustrent le compromis : quand Σξ_i diminue, la marge diminue, et
		inversement. Solveur SMO de la formulation duale, données simulées déterministes.
	</p>
</div>

<style>
	.ssm-demo {
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

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tradeoff {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.chart-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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
