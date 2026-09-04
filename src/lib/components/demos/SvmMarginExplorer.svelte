<script lang="ts">
	/**
	 * Démo « Marge, vecteurs de support et robustesse » (SVM à marge rigide).
	 *
	 * Manipule l'hyperplan séparateur w₁x + w₂y + b = 0 sur un nuage 2D à deux
	 * classes (generateSeparableClasses2D, seed 42) : marge fonctionnelle
	 * m_min = min_i y_i(⟨w,x_i⟩+b), marge géométrique γ = m_min/‖w‖, zone
	 * d'indécision, points les plus proches, puis solution du SVM à marge
	 * rigide (solveSvmDual, C = 10⁶) pour tester la robustesse : seuls les
	 * vecteurs de support déterminent l'hyperplan optimal.
	 *
	 * La droite de décision est tracée en snippetOverlay de ScatterPlot : la
	 * projection est synchronisée avec le pad=4 interne de ScatterPlot (même
	 * pattern que LinearClassifierExplorer) et la ligne est clipée au cadre par
	 * Liang-Barsky.
	 */
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import type { LabeledPoint2D } from '$lib/math/linear-classifier';
	import { generateSeparableClasses2D } from '$lib/math/linear-classifier';
	import { functionalMargins, norm, solveSvmDual, type SvmSolution } from '$lib/math/svm';

	const DOMAIN = 4.5;
	const SIZE = 420;
	const PAD = 4; // synchronisé avec le pad interne de ScatterPlot
	const HIT_RADIUS = 0.35; // rayon de capture du drag (unités de données)
	const NUDGE = 0.25; // pas du déplacement clavier (unités de données)
	const C_HARD = 1e6; // « marge rigide » : grand C dans la duale à marge souple

	const DEFAULTS = { n: 10, separation: 2, w1: 1, w2: 1, b: 0 };

	let n = $state(DEFAULTS.n);
	let separation = $state(DEFAULTS.separation);
	let w1 = $state(DEFAULTS.w1);
	let w2 = $state(DEFAULTS.w2);
	let b = $state(DEFAULTS.b);
	let mode = $state<'manuel' | 'solution'>('manuel');
	let data = $state<LabeledPoint2D[]>(
		generateSeparableClasses2D(DEFAULTS.n, DEFAULTS.separation, 42)
	);
	let dragIndex = $state(-1);
	let dragStartSol = $state<{ w1: number; w2: number; b: number } | null>(null);
	let moved = $state<'moved' | 'same' | null>(null);

	// Tout changement de n / separation recharge le nuage : les déplacements de
	// points ne doivent pas survivre au changement de jeu de données.
	$effect(() => {
		data = generateSeparableClasses2D(n, separation, 42);
		moved = null;
	});

	const points = $derived(
		data.map((p) => ({ x: p.x1, y: p.x2, group: p.label === 1 ? 'data-1' : 'data-0' }))
	);

	function colorByGroup(d: { group?: string | number }): string {
		if (d.group === 'data-1') return 'var(--color-belief)';
		if (d.group === 'data-0') return 'var(--color-surprise)';
		return 'var(--color-text-muted)';
	}

	// ── Projection (mirror de ScatterPlot, pad = 4) ─────────────────────
	function projectX(x: number): number {
		return PAD + ((x + DOMAIN) / (2 * DOMAIN)) * (SIZE - 2 * PAD);
	}
	function projectY(y: number): number {
		return PAD + ((DOMAIN - y) / (2 * DOMAIN)) * (SIZE - 2 * PAD);
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
			A = [-DOMAIN, yAt(-DOMAIN)];
			B = [DOMAIN, yAt(DOMAIN)];
		} else if (Math.abs(wa) > 1e-12) {
			const x = c / wa;
			A = [x, -DOMAIN];
			B = [x, DOMAIN];
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
			clip(-dx, A[0] + DOMAIN) &&
			clip(dx, DOMAIN - A[0]) &&
			clip(-dy, A[1] + DOMAIN) &&
			clip(dy, DOMAIN - A[1]);
		if (!ok) return null;
		return {
			x1: A[0] + t0 * dx,
			y1: A[1] + t0 * dy,
			x2: A[0] + t1 * dx,
			y2: A[1] + t1 * dy
		};
	}

	// ── Classifieur actif : hyperplan manuel ou solution du SVM ─────────
	const solution = $derived.by((): SvmSolution | null => {
		if (mode !== 'solution' || data.length < 2) return null;
		return solveSvmDual(data, C_HARD, { tol: 1e-5, maxPasses: 200 });
	});

	const active = $derived.by((): { w: number[]; b: number } | null => {
		if (mode === 'solution') {
			if (!solution || norm(solution.w) === 0) return null;
			return { w: solution.w, b: solution.b };
		}
		const nw = Math.hypot(w1, w2);
		return nw > 0 ? { w: [w1, w2], b } : null;
	});

	const margins = $derived(active ? functionalMargins(active.w, active.b, data) : null);
	const mMin = $derived(margins ? Math.min(...margins) : null);
	// Niveau des droites de marge : m_min pour le classifieur manuel, 1 pour la
	// solution du SVM (hyperplans de support w·x + b = ±1).
	const marginLevel = $derived(mode === 'solution' ? 1 : mMin);
	const isSeparator = $derived(mMin !== null && mMin > 0);
	const gamma = $derived(
		active && mMin !== null && mMin > 0 ? mMin / norm(active.w) : null
	);
	const gammaStar = $derived(
		mode === 'solution' && solution && norm(solution.w) > 0 ? 1 / norm(solution.w) : null
	);
	const nErrors = $derived(margins ? margins.filter((m) => m < 0).length : null);
	// Points strictement dans la zone d'indécision (bande entre les deux
	// droites de marge). En mode manuel le compte est 0 par construction (la
	// bande est définie par les points les plus proches) ; il devient non nul
	// en mode solution dès qu'un outlier entre dans la marge.
	const nStrip = $derived(
		margins && marginLevel !== null && marginLevel > 0
			? margins.filter((m) => m < marginLevel - 1e-9).length
			: null
	);
	const nSvCurrent = $derived(
		margins && mMin !== null && mMin > 0
			? margins.filter((m) => Math.abs(m - mMin) < 1e-6).length
			: null
	);

	// ── Segments tracés sur le graphique ─────────────────────────────────
	const boundarySeg = $derived(active ? clipLine(-active.b, active.w) : null);
	const plusSeg = $derived(
		active && marginLevel !== null && marginLevel > 0
			? clipLine(marginLevel - active.b, active.w)
			: null
	);
	const minusSeg = $derived(
		active && marginLevel !== null && marginLevel > 0
			? clipLine(-marginLevel - active.b, active.w)
			: null
	);
	// Zone d'indécision : le quadrilatère n'existe que si les deux droites de
	// marge traversent le cadre ; sinon on saute le remplissage.
	const stripPoly = $derived.by((): string | null => {
		if (!plusSeg || !minusSeg) return null;
		const A1 = `${projectX(plusSeg.x1)},${projectY(plusSeg.y1)}`;
		const A2 = `${projectX(plusSeg.x2)},${projectY(plusSeg.y2)}`;
		const B1 = `${projectX(minusSeg.x1)},${projectY(minusSeg.y1)}`;
		const B2 = `${projectX(minusSeg.x2)},${projectY(minusSeg.y2)}`;
		return `M${A1} L${A2} L${B2} L${B1} Z`;
	});

	// Points les plus proches de H, par classe (argmin de |m_i|) — mode manuel.
	const closestRings = $derived.by((): { x: number; y: number }[] => {
		if (mode !== 'manuel' || data.length === 0) return [];
		let iPos = -1;
		let iNeg = -1;
		let dPos = Infinity;
		let dNeg = Infinity;
		for (let i = 0; i < data.length; i++) {
			const p = data[i];
			const d = Math.abs(p.label * (w1 * p.x1 + w2 * p.x2 + b));
			if (p.label === 1) {
				if (d < dPos) {
					dPos = d;
					iPos = i;
				}
			} else if (d < dNeg) {
				dNeg = d;
				iNeg = i;
			}
		}
		const out: { x: number; y: number }[] = [];
		if (iPos >= 0) out.push({ x: projectX(data[iPos].x1), y: projectY(data[iPos].x2) });
		if (iNeg >= 0) out.push({ x: projectX(data[iNeg].x1), y: projectY(data[iNeg].x2) });
		return out;
	});

	// Étoile 5 branches (chemin SVG simple) pour les vecteurs de support.
	function starPath(cx: number, cy: number, r: number): string {
		const parts: string[] = [];
		for (let i = 0; i < 10; i++) {
			const ang = -Math.PI / 2 + (i * Math.PI) / 5;
			const rad = i % 2 === 0 ? r : r * 0.45;
			parts.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
		}
		return `M${parts.join('L')}Z`;
	}

	const supportStars = $derived.by(() => {
		if (mode !== 'solution' || !solution) return [];
		const out: { x: number; y: number }[] = [];
		for (const i of solution.supportIndices) {
			const p = data[i];
			if (p) out.push({ x: projectX(p.x1), y: projectY(p.x2) });
		}
		return out;
	});

	// ── Drag des points (pointeur) + fallback clavier ────────────────────
	function toDataCoords(event: PointerEvent): { x1: number; x2: number } | null {
		const target = event.currentTarget as SVGRectElement;
		const svg = target.ownerSVGElement;
		const ctm = svg?.getScreenCTM();
		if (!svg || !ctm) return null;
		const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
		return {
			x1: -DOMAIN + ((pt.x - PAD) / (SIZE - 2 * PAD)) * 2 * DOMAIN,
			x2: DOMAIN - ((pt.y - PAD) / (SIZE - 2 * PAD)) * 2 * DOMAIN
		};
	}

	function clampDomain(v: number): number {
		return Math.max(-DOMAIN, Math.min(DOMAIN, v));
	}

	function handlePlotPointerDown(event: PointerEvent) {
		const c = toDataCoords(event);
		if (!c) return;
		let best = -1;
		let bestD = HIT_RADIUS;
		for (let i = 0; i < data.length; i++) {
			const d = Math.hypot(data[i].x1 - c.x1, data[i].x2 - c.x2);
			if (d <= bestD) {
				bestD = d;
				best = i;
			}
		}
		if (best < 0) return;
		dragIndex = best;
		if (mode === 'solution' && solution) {
			const nw = norm(solution.w);
			// Instantané de l'hyperplan optimal avant le drag : (w, b) est
			// normalisé en ‖w‖ = 1, car (w, b) et (kw, kb) définissent la même
			// droite.
			dragStartSol =
				nw > 0
					? { w1: solution.w[0] / nw, w2: solution.w[1] / nw, b: solution.b / nw }
					: null;
			moved = null;
		}
		(event.currentTarget as SVGRectElement).setPointerCapture(event.pointerId);
	}

	function handlePlotPointerMove(event: PointerEvent) {
		if (dragIndex < 0) return;
		const c = toDataCoords(event);
		if (!c) return;
		data = data.map((p, i) =>
			i === dragIndex ? { ...p, x1: clampDomain(c.x1), x2: clampDomain(c.x2) } : p
		);
	}

	function handlePlotPointerUp() {
		if (dragIndex < 0) return;
		dragIndex = -1;
		if (mode !== 'solution' || !solution || !dragStartSol) return;
		const nw = norm(solution.w);
		if (nw === 0) return;
		const w1n = solution.w[0] / nw;
		const w2n = solution.w[1] / nw;
		const bn = solution.b / nw;
		let cos = w1n * dragStartSol.w1 + w2n * dragStartSol.w2;
		let db = Math.abs(bn - dragStartSol.b);
		if (cos < 0) {
			// (w, b) et (−w, −b) définissent le même hyperplan.
			cos = -cos;
			db = Math.abs(bn + dragStartSol.b);
		}
		const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
		moved = angle > Math.PI / 180 || db > 0.05 ? 'moved' : 'same';
	}

	// Clavier : Entrée/Espace décale de 0.25 unité de données le point le plus
	// proche du centre du plan, dans la direction qui l'éloigne du centre.
	// Fallback volontairement plus limité que la souris (on ne choisit pas quel
	// point déplacer), cf. AGENTS.md.
	function handlePlotKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		let best = -1;
		let bestD = Infinity;
		for (let i = 0; i < data.length; i++) {
			const d = Math.hypot(data[i].x1, data[i].x2);
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		}
		if (best < 0) return;
		const p = data[best];
		const len = Math.hypot(p.x1, p.x2);
		const ux = len > 1e-9 ? p.x1 / len : 1;
		const uy = len > 1e-9 ? p.x2 / len : 0;
		data = data.map((q, i) =>
			i === best
				? { ...q, x1: clampDomain(q.x1 + NUDGE * ux), x2: clampDomain(q.x2 + NUDGE * uy) }
				: q
		);
	}

	// ── Boutons ──────────────────────────────────────────────────────────
	function maximizeMargin(): void {
		mode = 'solution';
		moved = null;
		dragStartSol = null;
	}

	function backToManual(): void {
		mode = 'manuel';
		moved = null;
		dragStartSol = null;
	}

	function reset(): void {
		n = DEFAULTS.n;
		separation = DEFAULTS.separation;
		w1 = DEFAULTS.w1;
		w2 = DEFAULTS.w2;
		b = DEFAULTS.b;
		mode = 'manuel';
		dragIndex = -1;
		dragStartSol = null;
		moved = null;
	}

	const fmt = (v: number | null, digits = 3): string =>
		v !== null && Number.isFinite(v) ? v.toFixed(digits) : '—';
</script>

<div class="svm-demo">
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
					<!-- Zone d'indécision (bande entre les deux droites de marge) -->
					{#if stripPoly}
						<path d={stripPoly} fill="var(--color-positive)" opacity="0.1" />
					{/if}
					{#if plusSeg}
						<line
							x1={projectX(plusSeg.x1)}
							y1={projectY(plusSeg.y1)}
							x2={projectX(plusSeg.x2)}
							y2={projectY(plusSeg.y2)}
							stroke="var(--color-positive)"
							stroke-width="1.5"
							stroke-dasharray="5 4"
						/>
					{/if}
					{#if minusSeg}
						<line
							x1={projectX(minusSeg.x1)}
							y1={projectY(minusSeg.y1)}
							x2={projectX(minusSeg.x2)}
							y2={projectY(minusSeg.y2)}
							stroke="var(--color-positive)"
							stroke-width="1.5"
							stroke-dasharray="5 4"
						/>
					{/if}
					<!-- Droite de décision ⟨w, x⟩ + b = 0 (manuel) ou frontière SVM -->
					{#if boundarySeg}
						<line
							x1={projectX(boundarySeg.x1)}
							y1={projectY(boundarySeg.y1)}
							x2={projectX(boundarySeg.x2)}
							y2={projectY(boundarySeg.y2)}
							stroke="var(--color-agent)"
							stroke-width="2.5"
						/>
					{/if}
					<!-- Mode manuel : points les plus proches de H, par classe -->
					{#if mode === 'manuel'}
						{#each closestRings as ring (ring.x + ',' + ring.y)}
							<circle
								cx={ring.x}
								cy={ring.y}
								r="7"
								fill="none"
								stroke="var(--color-agent)"
								stroke-width="1.5"
							/>
						{/each}
					{:else}
						<!-- Mode solution : vecteurs de support (étoiles) -->
						{#each supportStars as star (star.x + ',' + star.y)}
							<path
								d={starPath(star.x, star.y, 6.5)}
								fill="var(--color-agent)"
								stroke="var(--color-bg)"
								stroke-width="0.8"
							/>
						{/each}
					{/if}
					<!-- Surface de drag (fallback SVG minimal, voir AGENTS.md) -->
					<rect
						x={PAD}
						y={PAD}
						width={SIZE - 2 * PAD}
						height={SIZE - 2 * PAD}
						fill="transparent"
						class="drag-surface"
						role="button"
						tabindex="0"
						aria-label="Déplacer un point du nuage (Entrée ou Espace : décale le point le plus proche du centre)"
						onpointerdown={handlePlotPointerDown}
						onpointermove={handlePlotPointerMove}
						onpointerup={handlePlotPointerUp}
						onpointercancel={handlePlotPointerUp}
						onkeydown={handlePlotKeydown}
					/>
				{/snippet}
			</ScatterPlot>
		</div>

		<div class="side-panel">
			<div class="readout">
				<div class="row">
					<span class="k">Marge γ</span>
					<span class="v" class:warn={mMin !== null && !isSeparator}>{fmt(gamma)}</span>
				</div>
				{#if mMin !== null && !isSeparator}
					<div class="row">
						<span class="k"></span>
						<span class="v warn">hyperplan non séparateur</span>
					</div>
				{/if}
				<div class="row">
					<span class="k">Erreurs</span>
					<span class="v">{nErrors !== null ? `${nErrors} / ${data.length}` : '—'}</span>
				</div>
				<div class="row">
					<span class="k">Points dans la zone d'indécision</span>
					<span class="v">{fmt(nStrip, 0)}</span>
				</div>
				<div class="row">
					<span class="k">Vecteurs de support du classifieur actuel</span>
					<span class="v">{fmt(nSvCurrent, 0)}</span>
				</div>
				{#if mode === 'solution' && solution}
					<div class="row">
						<span class="k">Marge γ* (SVM)</span>
						<span class="v">{fmt(gammaStar)}</span>
					</div>
					<div class="row">
						<span class="k">Vecteurs de support (SVM)</span>
						<span class="v">{solution.supportIndices.length}</span>
					</div>
					<div class="row">
						<span class="k">H a changé ?</span>
						<span class="v" class:pos={moved === 'same'} class:neg={moved === 'moved'}>
							{moved === 'moved'
								? 'L\'hyperplan optimal a bougé'
								: moved === 'same'
									? 'L\'hyperplan optimal reste inchangé'
									: '—'}
						</span>
					</div>
				{/if}
			</div>

			<SliderGrid variant="outline">
				<div class="grp">
					<div class="gttl">Hyperplan manuel</div>
					<Slider
						bind:value={w1}
						min={-2}
						max={2}
						step={0.05}
						label="w₁"
						disabled={mode === 'solution'}
					/>
					<Slider
						bind:value={w2}
						min={-2}
						max={2}
						step={0.05}
						label="w₂"
						disabled={mode === 'solution'}
					/>
					<Slider
						bind:value={b}
						min={-3}
						max={3}
						step={0.05}
						label="b"
						disabled={mode === 'solution'}
					/>
				</div>
				<div class="grp">
					<div class="gttl">Données</div>
					<Slider bind:value={n} min={5} max={20} step={1} label="Points par classe" />
					<Slider
						bind:value={separation}
						min={0}
						max={4}
						step={0.1}
						label="Séparation des classes"
					/>
				</div>
			</SliderGrid>

			<div class="presets">
				<Button variant="outline" size="sm" selected={mode === 'solution'} onclick={maximizeMargin}
					>Maximiser la marge</Button
				>
				<Button variant="outline" size="sm" selected={mode === 'manuel'} onclick={backToManual}
					>Retour manuel</Button
				>
				<Button variant="outline" size="sm" onclick={reset}>Réinitialiser</Button>
			</div>
		</div>
	</div>

	<p class="cap">
		Il existe une infinité d'hyperplans séparateurs : les curseurs en tracent un, et sa marge γ est
		la distance à l'observation la plus proche (les deux points cerclés). Le SVM à marge rigide
		choisit l'hyperplan qui maximise γ — équidistant de l'observation positive et de l'observation
		négative les plus proches (« Maximiser la marge ») — et seuls les vecteurs de support (étoiles)
		déterminent H : déplacez un point à la souris pour le vérifier (Entrée/Espace : décale le point
		le plus proche du centre). Solveur SMO de la formulation duale avec C = 10⁶ (marge rigide en
		pratique), données simulées déterministes.
	</p>
</div>

<style>
	.svm-demo {
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

	.row .v.pos {
		color: var(--color-belief);
	}

	.row .v.neg {
		color: var(--color-surprise);
	}

	.row .v.warn {
		color: var(--color-surprise);
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

	.drag-surface {
		cursor: grab;
		touch-action: none;
	}

	.drag-surface:active {
		cursor: grabbing;
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
