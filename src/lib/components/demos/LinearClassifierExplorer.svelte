<script lang="ts">
	/**
	 * Démo « Classifieur linéaire & régression logistique » (part2/lesson2).
	 *
	 * Manipule l'hyperplan w1·x + w2·y + b = 0 sur un nuage 2D à deux classes
	 * (generateSeparableClasses2D) et affiche, pour un point requête placé par
	 * l'utilisateur : z, σ(z), la décision des demi-espaces (signe) et celle de
	 * la régression logistique (seuil α), plus les deux risques empiriques sur
	 * le jeu de données (0-1 et logistique).
	 *
	 * La droite de décision est tracée en snippetOverlay de ScatterPlot : la
	 * projection est synchronisée avec le pad=4 interne de ScatterPlot (même
	 * pattern que KNNClassifierExplorer).
	 */
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import {
		generateSeparableClasses2D,
		affineScore,
		halfSpaceDecision,
		logisticProbability,
		decisionBoundaryLine
	} from '$lib/math/linear-classifier';
	import { logLoss } from '$lib/math/loss-functions';

	const DOMAIN = 4.5;
	const SIZE = 420;
	const PAD = 4; // synchronisé avec le pad interne de ScatterPlot

	const DEFAULTS = { n: 25, separation: 0, w1: 1, w2: 1, b: 0, alpha: 0.5 };

	let n = $state(DEFAULTS.n);
	let separation = $state(DEFAULTS.separation);
	let w1 = $state(DEFAULTS.w1);
	let w2 = $state(DEFAULTS.w2);
	let b = $state(DEFAULTS.b);
	let alpha = $state(DEFAULTS.alpha);
	let query = $state({ x1: 0, x2: 0 });

	const dataset = $derived(generateSeparableClasses2D(n, separation, 42));

	const points = $derived(
		dataset.map((p) => ({ x: p.x1, y: p.x2, group: p.label === 1 ? 'data-1' : 'data-0' }))
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

	// ── Segment de la droite de décision, clipé au cadre du graphique ───
	// Liang-Barsky : on conserve la portion de la droite w1·x + w2·y + b = 0
	// à l'intérieur de [-DOMAIN, DOMAIN]².
	const boundary = $derived.by((): { x1: number; y1: number; x2: number; y2: number } | null => {
		const line = decisionBoundaryLine([w1, w2], b);
		const xA: [number, number] = line
			? [-DOMAIN, line.slope * -DOMAIN + line.intercept]
			: [-b / w1, -DOMAIN];
		const xB: [number, number] = line
			? [DOMAIN, line.slope * DOMAIN + line.intercept]
			: [-b / w1, DOMAIN];
		if (!Number.isFinite(xA[1]) || !Number.isFinite(xB[1])) return null;
		let t0 = 0;
		let t1 = 1;
		const dx = xB[0] - xA[0];
		const dy = xB[1] - xA[1];
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
			clip(-dx, xA[0] + DOMAIN) &&
			clip(dx, DOMAIN - xA[0]) &&
			clip(-dy, xA[1] + DOMAIN) &&
			clip(dy, DOMAIN - xA[1]);
		if (!ok) return null;
		return {
			x1: xA[0] + t0 * dx,
			y1: xA[1] + t0 * dy,
			x2: xA[0] + t1 * dx,
			y2: xA[1] + t1 * dy
		};
	});

	// ── Point requête : interaction ─────────────────────────────────────
	function setQueryFromPointer(event: PointerEvent) {
		const target = event.currentTarget as SVGRectElement;
		const svg = target.ownerSVGElement;
		const ctm = svg?.getScreenCTM();
		if (!svg || !ctm) return;
		const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
		query = {
			x1: Math.max(
				-DOMAIN,
				Math.min(DOMAIN, ((point.x - PAD) / (SIZE - 2 * PAD)) * 2 * DOMAIN - DOMAIN)
			),
			x2: Math.max(
				-DOMAIN,
				Math.min(DOMAIN, DOMAIN - ((point.y - PAD) / (SIZE - 2 * PAD)) * 2 * DOMAIN)
			)
		};
	}

	// Clavier : Entrée/Espace place le point au centre (fallback volontairement
	// plus limité que la souris — on ne peut pas viser un point arbitraire).
	function handlePlotKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		query = { x1: 0, x2: 0 };
	}

	const qx = $derived(projectX(query.x1));
	const qy = $derived(projectY(query.x2));

	// ── Lecture pour le point requête ───────────────────────────────────
	const zq = $derived(affineScore([w1, w2], b, [query.x1, query.x2]));
	const sigq = $derived(logisticProbability([w1, w2], b, [query.x1, query.x2]));
	const decisionSign = $derived(halfSpaceDecision([w1, w2], b, [query.x1, query.x2]));
	const decisionLogistic = $derived(sigq >= alpha ? 1 : -1);
	const wNorm = $derived(Math.hypot(w1, w2));
	const distHyperplane = $derived(wNorm > 0 ? Math.abs(zq) / wNorm : Number.NaN);

	// ── Risques empiriques sur le jeu de données ────────────────────────
	const empiricalRisks = $derived.by(() => {
		let errors = 0;
		let lossSum = 0;
		for (const p of dataset) {
			if (halfSpaceDecision([w1, w2], b, [p.x1, p.x2]) !== p.label) errors++;
			lossSum += logLoss([w1, w2], [p.x1, p.x2], p.label, b);
		}
		return { zeroOne: errors / dataset.length, logistic: lossSum / dataset.length };
	});

	function reset(): void {
		n = DEFAULTS.n;
		separation = DEFAULTS.separation;
		w1 = DEFAULTS.w1;
		w2 = DEFAULTS.w2;
		b = DEFAULTS.b;
		alpha = DEFAULTS.alpha;
		query = { x1: 0, x2: 0 };
	}

	function optimalHyperplane(): void {
		// Le générateur place les centres sur la diagonale : la normale optimale est (1, 1).
		w1 = 1;
		w2 = 1;
		b = 0;
	}

	const fmt = (v: number, digits = 3): string => (Number.isFinite(v) ? v.toFixed(digits) : '—');
</script>

<div class="lc-demo">
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
					<!-- Droite de décision ⟨w, x⟩ + b = 0 -->
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
					<!-- Point requête -->
					<circle
						cx={qx}
						cy={qy}
						r="6"
						fill="var(--color-positive)"
						stroke="var(--color-bg)"
						stroke-width="2"
					/>
					<!-- Surface de clic (fallback SVG minimal, voir AGENTS.md) -->
					<rect
						x={PAD}
						y={PAD}
						width={SIZE - 2 * PAD}
						height={SIZE - 2 * PAD}
						fill="transparent"
						role="button"
						tabindex="0"
						aria-label="Placer le point requête dans le plan (Entrée ou Espace : centre)"
						onpointerdown={setQueryFromPointer}
						onkeydown={handlePlotKeydown}
					/>
				{/snippet}
			</ScatterPlot>
		</div>

		<div class="side-panel">
			<div class="readout">
				<div class="row">
					<span class="k">Point requête</span>
					<span class="v">({query.x1.toFixed(2)}, {query.x2.toFixed(2)})</span>
				</div>
				<div class="row">
					<span class="k">z = ⟨w, x⟩ + b</span>
					<span class="v">{fmt(zq)}</span>
				</div>
				<div class="row">
					<span class="k">σ(z)</span>
					<span class="v">{fmt(sigq)}</span>
				</div>
				<div class="row">
					<span class="k">Décision demi-espaces (signe)</span>
					<span class="v" class:pos={decisionSign === 1} class:neg={decisionSign === -1}>
						{decisionSign === 1 ? '+1' : '−1'}
					</span>
				</div>
				<div class="row">
					<span class="k">Décision logistique (σ ≥ α)</span>
					<span class="v" class:pos={decisionLogistic === 1} class:neg={decisionLogistic === -1}>
						{decisionLogistic === 1 ? '+1' : '−1'}
					</span>
				</div>
				<div class="row">
					<span class="k">Distance à l'hyperplan</span>
					<span class="v">{fmt(distHyperplane)}</span>
				</div>
				<div class="row risks">
					<span class="k">Risque 0-1 empirique</span>
					<span class="v">{fmt(empiricalRisks.zeroOne)}</span>
				</div>
				<div class="row">
					<span class="k">Risque logistique empirique</span>
					<span class="v">{fmt(empiricalRisks.logistic)}</span>
				</div>
			</div>

			<SliderGrid variant="outline">
				<div class="grp">
					<div class="gttl">Hyperplan</div>
					<Slider bind:value={w1} min={-2} max={2} step={0.1} label="w₁" />
					<Slider bind:value={w2} min={-2} max={2} step={0.1} label="w₂" />
					<Slider bind:value={b} min={-3} max={3} step={0.1} label="b" />
					<Slider bind:value={alpha} min={0} max={1} step={0.01} label="Seuil α" />
				</div>
				<div class="grp">
					<div class="gttl">Données</div>
					<Slider bind:value={n} min={10} max={60} step={5} label="Points par classe" />
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
				<Button variant="outline" size="sm" onclick={reset}>Réinitialiser</Button>
				<Button variant="outline" size="sm" onclick={optimalHyperplane}
					>Hyperplan optimal (1, 1, 0)</Button
				>
			</div>
		</div>
	</div>

	<p class="cap">
		Cliquez (ou Entrée/Espace) pour placer le point requête. La droite w₁x + w₂y + b = 0 sépare le
		plan : <strong>demi-espaces</strong> prédit le signe de z, la
		<strong>régression logistique</strong> prédit +1 seulement si σ(z) ≥ α. σ(z) joue le rôle de probabilité
		de l'étiquette +1 : proche de 1/2 près de l'hyperplan, proche de 0 ou 1 loin de lui. Les deux risques
		empiriques (0-1 et logistique) sont calculés sur le jeu de données — la logistique est la version
		lissée que l'on peut optimiser (Partie IX).
	</p>
</div>

<style>
	.lc-demo {
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

	.row.risks {
		border-top: 1px solid var(--color-border);
		margin-top: 0.3rem;
		padding-top: 0.5rem;
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

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
