<script lang="ts">
	/**
	 * Démo « Les multiplicateurs α̂ᵢ et les conditions KKT » (SVM à marge
	 * souple) — panneau expert « Dualité KKT de la SVM : vecteurs support et
	 * parcimonie » (brief expert/part2/lesson4/svm-dualite-kkt.md).
	 *
	 * Sur un petit jeu synthétique seedé (12 points gaussiens seedés + 2
	 * points plantés pour garantir les trois régimes), affiche :
	 *   - les barres des α̂ᵢ/C avec la ligne de seuil α = C ;
	 *   - le nuage coloré par régime (sur la marge / dans la marge / à
	 *     l'extérieur), les vecteurs support (étoiles), les points α = C
	 *     (anneaux) et les points mal classés (carrés) ;
	 *   - les deux résidus KKT recalculés depuis les marges
	 *     (kktResidues) — ≈ 0 pour toute solution du solveur ;
	 *   - l'interaction « retirer un point de α = 0 » : la frontière de
	 *     décision ne bouge pas (Proposition du panneau — parcimonie).
	 *
	 * NOTE D'HONNÊTETÉ (visible en légende) : petit problème synthétique
	 * seedé — illustration des régimes KKT et de la parcimonie, pas un
	 * benchmark. Solveur SMO de la leçon (solveSvmDual) réutilisé tel quel.
	 *
	 * La frontière et les hyperplans de marge sont tracés en snippetOverlay
	 * de ScatterPlot : projection synchronisée avec le pad=4 interne de
	 * ScatterPlot, clipage Liang-Barsky au cadre (même pattern que
	 * SvmSoftMarginExplorer). La comparaison « la frontière a-t-elle bougé ? »
	 * normalise (w, b) en ‖w‖ = 1 et tient compte de l'ambiguïté (w, b) ~
	 * (−w, −b), comme SvmMarginExplorer.
	 *
	 * Les barres α̂ᵢ/C sont un SVG minimal fait main : BarChart n'expose ni
	 * la couleur par barre ni une ligne de seuil — fallback documenté
	 * (AGENTS.md), à remplacer si un composant dédié est construit.
	 */
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import type { LabeledPoint2D } from '$lib/math/linear-classifier';
	import {
		alphaRegimes,
		functionalMargins,
		generateNoisyClasses2D,
		kktResidues,
		norm,
		solveSvmDual,
		type AlphaRegime
	} from '$lib/math/svm';

	const XMIN = -3;
	const XMAX = 5;
	const YMIN = -3;
	const YMAX = 4;
	const SIZE = 420;
	const PAD = 4; // synchronisé avec le pad interne de ScatterPlot
	const ALPHA_TOL = 1e-6;
	const RESIDUE_OK = 1e-3; // seuil d'affichage « ≈ 0 »

	// Jeu de données déterministe : deux blobs gaussiens (6 points par
	// classe) + 2 points plantés, choisis pour que les trois régimes
	// (hors/sur/dans la marge) et les trois valeurs de α̂ᵢ (0, intérieur, C)
	// apparaissent sur toute la plage de C — en particulier au défaut C = 3.
	const BASE = generateNoisyClasses2D(6, 2.2, 1, 1050);
	const PLANTED: LabeledPoint2D[] = [
		{ x1: 1.35, x2: 0.55, label: 1 }, // +1 dans la marge, sur la marge pour C ≥ 3
		{ x1: 0.65, x2: 0.85, label: -1 } // −1 mal classé (outlier, α̂ = C)
	];
	const points = [...BASE, ...PLANTED];

	let C = $state(3);
	let removed = $state<number[]>([]); // indices d'origine des points retirés

	// ── Solution duale sur le jeu actif (points non retirés) ─────────────
	const activeIdx = $derived(points.map((_, i) => i).filter((i) => !removed.includes(i)));
	const activePoints = $derived(activeIdx.map((i) => points[i]));
	const sol = $derived(solveSvmDual(activePoints, C, { tol: 1e-6, maxPasses: 300 }));
	const margins = $derived(functionalMargins(sol.w, sol.b, activePoints));
	const regimes = $derived(alphaRegimes(margins));
	const residues = $derived(kktResidues(sol.alphas, C, margins));

	// Solution de référence sur le jeu complet (même C) : sert à vérifier que
	// retirer des points de α = 0 ne fait pas bouger la frontière.
	const fullSol = $derived(solveSvmDual(points, C, { tol: 1e-6, maxPasses: 300 }));

	// Information par indice d'origine (les indices du solveur sont relatifs
	// au jeu actif).
	const infoByOrig = $derived.by(
		(): Map<number, { alpha: number; regime: AlphaRegime; m: number }> => {
			const m = new Map<number, { alpha: number; regime: AlphaRegime; m: number }>();
			activeIdx.forEach((orig, k) => {
				m.set(orig, { alpha: sol.alphas[k], regime: regimes[k], m: margins[k] });
			});
			return m;
		}
	);

	interface Marker {
		orig: number;
		x: number;
		y: number;
		alpha: number;
		regime: AlphaRegime;
		label: 1 | -1;
		m: number;
	}

	const markers = $derived.by((): Marker[] =>
		activeIdx.map((orig, k) => ({
			orig,
			x: projectX(points[orig].x1),
			y: projectY(points[orig].x2),
			alpha: sol.alphas[k],
			regime: regimes[k],
			label: points[orig].label,
			m: margins[k]
		}))
	);

	const interiorStars = $derived(markers.filter((d) => d.alpha > ALPHA_TOL && d.alpha < C - ALPHA_TOL));
	const atCRings = $derived(markers.filter((d) => d.alpha >= C - ALPHA_TOL));
	const misclassified = $derived(markers.filter((d) => d.m < 0));
	const removableDots = $derived(markers.filter((d) => d.alpha <= ALPHA_TOL));
	const hollowDots = $derived(markers.filter((d) => d.label === -1));
	const ghosts = $derived(
		removed.map((orig) => ({ orig, x: projectX(points[orig].x1), y: projectY(points[orig].x2) }))
	);

	// ── Lecture du classifieur ───────────────────────────────────────────
	const nw = $derived(norm(sol.w));
	const gamma = $derived(nw > 0 ? 1 / nw : 0);
	const cDisplay = $derived(C < 0.1 || C >= 100 ? C.toExponential(1) : C.toFixed(2));
	const resOk = $derived(residues.slack < RESIDUE_OK && residues.box < RESIDUE_OK);
	const fmtRes = (v: number): string => (v < RESIDUE_OK ? '≈ 0' : v.toExponential(1));

	// La frontière a-t-elle bougé après suppression de points (α = 0) ?
	// Comparaison des hyperplans à l'échelle près : (w, b) et (kw, kb)
	// définissent la même droite, et (w, b) ~ (−w, −b).
	const boundaryMoved = $derived.by((): 'moved' | 'same' | null => {
		if (removed.length === 0) return null;
		const n0 = norm(fullSol.w);
		const n1 = norm(sol.w);
		if (n0 === 0 || n1 === 0) return 'moved';
		const w0 = [fullSol.w[0] / n0, fullSol.w[1] / n0];
		const w1 = [sol.w[0] / n1, sol.w[1] / n1];
		let cos = w0[0] * w1[0] + w0[1] * w1[1];
		let db = Math.abs(fullSol.b / n0 - sol.b / n1);
		if (cos < 0) {
			cos = -cos;
			db = Math.abs(fullSol.b / n0 + sol.b / n1);
		}
		const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
		return angle > Math.PI / 180 || db > 0.05 ? 'moved' : 'same';
	});

	// ── Projection (mirror de ScatterPlot, pad = 4) ─────────────────────
	function projectX(x: number): number {
		return PAD + ((x - XMIN) / (XMAX - XMIN)) * (SIZE - 2 * PAD);
	}
	function projectY(y: number): number {
		return PAD + ((YMAX - y) / (YMAX - YMIN)) * (SIZE - 2 * PAD);
	}

	// ── Clip de la droite w₁x + w₂y = c au cadre (Liang-Barsky, même
	//    pattern que SvmSoftMarginExplorer) ───────────────────────────────
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

	const boundary = $derived(clipLine(-sol.b, sol.w));
	const solPlus = $derived(clipLine(1 - sol.b, sol.w));
	const solMinus = $derived(clipLine(-1 - sol.b, sol.w));
	const stripPoly = $derived.by((): string | null => {
		if (!solPlus || !solMinus) return null;
		const A1 = `${projectX(solPlus.x1)},${projectY(solPlus.y1)}`;
		const A2 = `${projectX(solPlus.x2)},${projectY(solPlus.y2)}`;
		const B1 = `${projectX(solMinus.x1)},${projectY(solMinus.y1)}`;
		const B2 = `${projectX(solMinus.x2)},${projectY(solMinus.y2)}`;
		return `M${A1} L${A2} L${B2} L${B1} Z`;
	});

	// Étoile 5 branches (chemin SVG simple) pour les vecteurs support.
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

	// ── Nuage (ScatterPlot) : couleur = régime, classe −1 = point « donut »
	const plotPoints = $derived(
		activePoints.map((p, k) => ({ x: p.x1, y: p.x2, group: regimes[k] }))
	);

	function colorByRegime(d: { group?: string | number }): string {
		if (d.group === 'sur-marge') return 'var(--color-belief)';
		if (d.group === 'dans-marge') return 'var(--color-surprise)';
		return 'var(--color-text-muted)';
	}

	function regimeColor(r: AlphaRegime): string {
		if (r === 'sur-marge') return 'var(--color-belief)';
		if (r === 'dans-marge') return 'var(--color-surprise)';
		return 'var(--color-text-muted)';
	}

	// ── Barres α̂ᵢ / C (SVG minimal fait main, voir docstring) ────────────
	const BARS = { left: 16, right: 16, top: 20, bottom: 30, w: 560, h: 150 };
	const barSlot = $derived((BARS.w - BARS.left - BARS.right) / points.length);
	const barW = $derived(Math.min(barSlot * 0.6, 24));
	const barValues = $derived(points.map((_, i) => (infoByOrig.get(i)?.alpha ?? 0) / C));

	// ── Interaction : retirer / rétablir un point ────────────────────────
	// Retirer un point de α = 0 ne change pas la solution (Proposition du
	// panneau) ; un vecteur support ne peut pas être retiré ici, car c'est
	// précisément le cas où la solution change.
	function isRemovable(orig: number): boolean {
		return !removed.includes(orig) && (infoByOrig.get(orig)?.alpha ?? 0) <= ALPHA_TOL;
	}

	function toggleRemove(orig: number): void {
		if (removed.includes(orig)) {
			removed = removed.filter((i) => i !== orig);
		} else if (isRemovable(orig)) {
			removed = [...removed, orig];
		}
	}

	function handleHitKeydown(event: KeyboardEvent, orig: number): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleRemove(orig);
		}
	}

	function resetRemoved(): void {
		removed = [];
	}
</script>

<div class="sak-demo">
	<div class="explorer-grid">
		<div class="plot-panel">
			<ScatterPlot
				points={plotPoints}
				domainX={[XMIN, XMAX]}
				domainY={[YMIN, YMAX]}
				width={SIZE}
				height={SIZE}
				colorBy={colorByRegime}
				defaultSize={4.5}
				showAxes={true}
				showLabels={true}
			>
				{#snippet snippetOverlay()}
					<!-- Zone d'indécision (bande entre les hyperplans de support ±1) -->
					{#if stripPoly}
						<path d={stripPoly} fill="var(--color-positive)" opacity="0.1" />
					{/if}
					<!-- Hyperplans de support ⟨w, x⟩ + b = ±1 -->
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
					<!-- Frontière de décision ⟨w, x⟩ + b = 0 -->
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
					<!-- Classe −1 : petit disque central (le point devient « donut ») -->
					{#each hollowDots as d (d.orig)}
						<circle cx={d.x} cy={d.y} r="1.7" fill="var(--color-bg)" />
					{/each}
					<!-- Vecteurs support intérieurs (0 < α̂ < C) : étoiles -->
					{#each interiorStars as d (d.orig)}
						<path
							d={starPath(d.x, d.y, 6.5)}
							fill="var(--color-agent)"
							stroke="var(--color-bg)"
							stroke-width="0.8"
						>
							<title>Vecteur support — α = {d.alpha.toFixed(2)} (0 &lt; α &lt; C) : sur la marge. Le retirer changerait la solution.</title>
						</path>
					{/each}
					<!-- Points α̂ = C (dans la marge) : anneaux -->
					{#each atCRings as d (d.orig)}
						<circle
							cx={d.x}
							cy={d.y}
							r="6"
							fill="none"
							stroke="var(--color-text)"
							stroke-width="1.6"
						>
							<title>α = C = {cDisplay} : dans la marge{d.m < 0 ? ' (mal classé)' : ''}. Le retirer changerait la solution.</title>
						</circle>
					{/each}
					<!-- Points mal classés (m < 0) : carré en surimpression -->
					{#each misclassified as d (d.orig)}
						<rect
							x={d.x - 3.5}
							y={d.y - 3.5}
							width="7"
							height="7"
							fill="none"
							stroke="var(--color-surprise)"
							stroke-width="1.5"
						/>
					{/each}
					<!-- Points retirés : fantômes (cercle pointillé) + zone de clic -->
					{#each ghosts as g (g.orig)}
						<circle
							cx={g.x}
							cy={g.y}
							r="4.5"
							fill="none"
							stroke="var(--color-text-muted)"
							stroke-width="1.2"
							stroke-dasharray="2.5 2"
						/>
						<circle
							class="hit"
							cx={g.x}
							cy={g.y}
							r="9"
							fill="transparent"
							role="button"
							tabindex="0"
							aria-label={`Rétablir le point ${g.orig + 1} retiré`}
							onclick={() => toggleRemove(g.orig)}
							onkeydown={(e) => handleHitKeydown(e, g.orig)}
						>
							<title>Point retiré — cliquer pour le rétablir</title>
						</circle>
					{/each}
					<!-- Points de α = 0 : zones de clic (retirer). Accessibilité :
					     chaque zone est un bouton individuellement focusable (Entrée
					     / Espace agit sur le point focalisé) — équivalence clavier
					     complète, cf. AGENTS.md. Le SVG parent porte role="img"
					     (ScatterPlot) ; ces rôles sont ceux exigés par le pattern
					     du codebase (SvmMarginExplorer). -->
					{#each removableDots as d (d.orig)}
						<circle
							class="hit"
							cx={d.x}
							cy={d.y}
							r="9"
							fill="transparent"
							role="button"
							tabindex="0"
							aria-label={`Retirer le point ${d.orig + 1} (classe ${d.label > 0 ? '+1' : '−1'}, α = 0) : la frontière de décision ne doit pas bouger`}
							onclick={() => toggleRemove(d.orig)}
							onkeydown={(e) => handleHitKeydown(e, d.orig)}
						>
							<title>α = 0 — cliquer pour retirer ce point (la frontière ne bouge pas)</title>
						</circle>
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
					<span class="k">Vecteurs support (α > 0)</span>
					<span class="v">{sol.supportIndices.length} / {activePoints.length}</span>
				</div>
				<div class="row">
					<span class="k">dont α = C</span>
					<span class="v">{atCRings.length}</span>
				</div>
				<div class="row">
					<span class="k">Mal classés (m &lt; 0)</span>
					<span class="v">{misclassified.length}</span>
				</div>
				<div class="row">
					<span class="k">Points retirés</span>
					<span class="v">{removed.length}</span>
				</div>
				<div class="row">
					<span class="k">max |αᵢ(mᵢ−1+ξᵢ)|</span>
					<span class="v" class:ok={resOk}>{fmtRes(residues.slack)}</span>
				</div>
				<div class="row">
					<span class="k">max |(C−αᵢ)ξᵢ|</span>
					<span class="v" class:ok={resOk}>{fmtRes(residues.box)}</span>
				</div>
				{#if boundaryMoved !== null}
					<div class="row">
						<span class="k">Frontière après retrait</span>
						<span class="v" class:ok={boundaryMoved === 'same'}>
							{boundaryMoved === 'same' ? 'inchangée' : 'a bougé'}
						</span>
					</div>
				{/if}
			</div>

			<SliderGrid variant="outline">
				<div class="grp">
					<div class="gttl">Paramètre du compromis</div>
					<Slider bind:value={C} min={0.1} max={100} step={1} label="C" logarithmic={true} />
				</div>
			</SliderGrid>

			{#if removed.length > 0}
				<Button variant="outline" size="sm" onclick={resetRemoved}>
					Rétablir les {removed.length} point{removed.length > 1 ? 's' : ''} retiré{removed.length > 1 ? 's' : ''}
				</Button>
			{/if}
		</div>
	</div>

	<div class="bars-panel">
		<div class="chart-title">
			Multiplicateurs α̂ᵢ (barres : α̂ᵢ/C) — seuil α = C en pointillés ; couleurs par régime
		</div>
		<!-- SVG minimal fait main : BarChart n'expose ni la couleur par barre
		     ni une ligne de seuil (fallback documenté, cf. docstring). -->
		<svg
			viewBox={`0 0 ${BARS.w} ${BARS.h}`}
			class="bars"
			role="img"
			aria-label="Barres des multiplicateurs α̂ᵢ normalisés par C, avec la ligne de seuil α = C"
		>
			<line
				x1={BARS.left}
				y1={BARS.h - BARS.bottom}
				x2={BARS.w - BARS.right}
				y2={BARS.h - BARS.bottom}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<line
				x1={BARS.left}
				y1={BARS.top}
				x2={BARS.w - BARS.right}
				y2={BARS.top}
				stroke="var(--color-surprise)"
				stroke-width="1"
				stroke-dasharray="4 3"
			/>
			<text
				x={BARS.w - BARS.right}
				y={BARS.top - 5}
				text-anchor="end"
				font-size="10"
				fill="var(--color-text-muted)">α = C</text
			>
			{#each points as p, i (i)}
				{@const info = infoByOrig.get(i)}
				{@const v = Math.min(1, barValues[i] ?? 0)}
				{@const bx = BARS.left + i * barSlot + (barSlot - barW) / 2}
				<rect
					x={bx.toFixed(1)}
					y={(BARS.h - BARS.bottom - (BARS.h - BARS.bottom - BARS.top) * v).toFixed(1)}
					width={barW.toFixed(1)}
					height={((BARS.h - BARS.bottom - BARS.top) * v).toFixed(1)}
					fill={info ? regimeColor(info.regime) : 'var(--color-text-muted)'}
					opacity={info ? 0.85 : 0.2}
					rx="2"
				>
					<title>
						Point {i + 1} (classe {p.label > 0 ? '+1' : '−1'}){info
							? ` — α = ${info.alpha.toFixed(3)}, ${info.regime.replace('-', ' ')}`
							: ' — retiré'}
					</title>
				</rect>
				<text
					x={(bx + barW / 2).toFixed(1)}
					y={BARS.h - BARS.bottom + 14}
					text-anchor="middle"
					font-size="9"
					fill="var(--color-text-muted)">{i + 1}</text
				>
			{/each}
		</svg>
	</div>

	<p class="cap">
		Petit problème synthétique seedé (12 points gaussiens + 2 points plantés) — illustration des
		régimes KKT et de la parcimonie, pas un benchmark. Le nuage est coloré par régime : bleu = sur
		la marge, rose = dans la marge, gris = à l'extérieur ; les points creusés (petit disque
		central) sont de classe −1. Étoile = vecteur support (0 &lt; α̂ &lt; C), anneau = α̂ = C,
		carré = mal classé. Cliquez sur un point gris (α̂ = 0) pour le retirer du jeu : la frontière
		ne bouge pas — c'est la Proposition du panneau, rendue visible. Le solveur est le SMO de la
		leçon (solveSvmDual) ; les deux résidus KKT sont recalculés depuis les marges, d'où leur
		valeur « ≈ 0 » quelle que soit la solution numérique.
	</p>
</div>

<style>
	.sak-demo {
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

	.row .v.ok {
		color: var(--color-positive);
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

	.bars-panel {
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

	.bars {
		display: block;
		width: 100%;
		height: auto;
	}

	.hit {
		cursor: pointer;
	}

	.hit:hover {
		fill: color-mix(in srgb, var(--color-agent) 12%, transparent);
	}

	.hit:focus-visible {
		outline: none;
		stroke: var(--color-agent);
		stroke-width: 1.5;
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
