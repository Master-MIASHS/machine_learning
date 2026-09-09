<script lang="ts">
	import Button from '$lib/components/controls/Button.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { gaussianSample } from '$lib/math/gaussian.js';
	import {
		cooksDistance,
		leverages,
		olsFit,
		studentizedResiduals,
		tQuantile
	} from '$lib/math/linear-model.js';
	import { combineSeed, mulberry32 } from '$lib/math/util.js';

	// p = 1 régresseur (d = 2 colonnes : intercept + x).
	const P = 1;
	const MAX_PTS = 30;
	const SEED = 17;
	const baseRng = mulberry32(combineSeed(SEED, 1));
	const basePts = Array.from({ length: 12 }, () => {
		const xi = baseRng() * 10;
		return { x: xi, y: 2 + 0.8 * xi + gaussianSample({ mu: 0, sigma2: 1.44 }, baseRng) };
	});

	let pts = $state(basePts.map((p) => ({ ...p })));
	let selected = $state<number | null>(null);
	let exclude = $state(false);

	const X = $derived(pts.map((p) => [1, p.x]));
	const y = $derived(pts.map((p) => p.y));
	const n = $derived(pts.length);

	const fitAll = $derived(olsFit(X, y));
	const fitDel = $derived.by(() => {
		if (exclude && selected !== null) {
			const Xd = X.filter((_, i) => i !== selected);
			const yd = y.filter((_, i) => i !== selected);
			return olsFit(Xd, yd);
		}
		return null;
	});

	const hThr = $derived((2 * (P + 1)) / n);
	const tThr = $derived(tQuantile(0.975, n - P - 2));

	const diag = $derived.by(() => {
		const h = leverages(X);
		const ti = studentizedResiduals(fitAll.residuals, h, fitAll.sigma2, n, P);
		const Di = fitAll.residuals.map((r, i) => cooksDistance(r, h[i], fitAll.sigma2, P));
		return { h, ti, Di };
	});

	const sel = $derived.by(() => {
		if (selected === null) return null;
		const i = selected;
		return {
			i,
			x: pts[i].x,
			y: pts[i].y,
			h: diag.h[i],
			t: diag.ti[i],
			D: diag.Di[i],
			resid: fitAll.residuals[i]
		};
	});

	// ── SVG principal : clic pour ajouter, clic sur point pour sélectionner ──
	const W = 460;
	const H = 280;
	const PAD = 34;
	const xDom: [number, number] = [-1, 11];
	const yDom = $derived([
		Math.min(...y) - 1.5,
		Math.max(...y) + 1.5
	] as [number, number]);
	const sx = (v: number) => PAD + ((v - xDom[0]) / (xDom[1] - xDom[0])) * (W - 2 * PAD);
	const sy = (v: number) => H - PAD - ((v - yDom[0]) / (yDom[1] - yDom[0])) * (H - 2 * PAD);

	function clientToData(evt: MouseEvent): [number, number] | null {
		// getScreenCTM().inverse() : robuste au redimensionnement CSS de l'SVG.
		const el = evt.currentTarget as SVGGraphicsElement;
		const svg = el instanceof SVGSVGElement ? el : el.ownerSVGElement;
		if (!svg) return null;
		const ctm = svg.getScreenCTM();
		if (!ctm) return null;
		const pt = new DOMPoint(evt.clientX, evt.clientY).matrixTransform(ctm.inverse());
		const fx = (pt.x - PAD) / (W - 2 * PAD);
		const fy = (H - PAD - pt.y) / (H - 2 * PAD);
		const xv = xDom[0] + fx * (xDom[1] - xDom[0]);
		const yv = yDom[0] + fy * (yDom[1] - yDom[0]);
		if (xv < xDom[0] || xv > xDom[1] || yv < yDom[0] || yv > yDom[1]) return null;
		return [xv, yv];
	}

	function addPoint(evt: MouseEvent) {
		if (pts.length >= MAX_PTS) return;
		const d = clientToData(evt);
		if (!d) return;
		pts = [...pts, { x: d[0], y: d[1] }];
		selected = pts.length - 1;
	}

	function addCenterPoint() {
		// Équivalent clavier : ajoute un point au centre du domaine (placement
		// arbitraire impossible au clavier — limitation documentée).
		if (pts.length >= MAX_PTS) return;
		pts = [...pts, { x: (xDom[0] + xDom[1]) / 2, y: (yDom[0] + yDom[1]) / 2 }];
		selected = pts.length - 1;
	}

	const lineFull = $derived([
		[sx(0), sy(fitAll.beta[0])],
		[sx(10), sy(fitAll.beta[0] + 10 * fitAll.beta[1])]
	]);
	const lineDel = $derived.by(() =>
		fitDel
			? [
					[sx(0), sy(fitDel.beta[0])],
					[sx(10), sy(fitDel.beta[0] + 10 * fitDel.beta[1])]
				]
			: null
	);

	// ── Quadrant levier × résidu studentisé ──
	const WQ = 300;
	const HQ = 240;
	const PADQ = 32;
	const hMax = $derived(Math.max(1.5 * hThr, ...diag.h) * 1.1);
	const tMax = $derived(Math.max(1.3 * tThr, ...diag.ti.map(Math.abs)) * 1.1);
	const qx = (v: number) => PADQ + (v / hMax) * (WQ - 2 * PADQ);
	const qy = (v: number) => HQ / 2 - (v / tMax) * (HQ / 2 - PADQ);
</script>

<div class="lm-cook">
	<p class="intro">
		Trois notions à ne pas confondre : <strong>atypique</strong> (grand résidu
		studentisé), <strong>levier</strong> (x loin du barycentre, hii élevé) et
		<strong>influent</strong> (la distance de Cook combine les deux). Cliquez pour
		ajouter un point (Entrée : point au centre), cliquez sur un point pour le
		sélectionner, puis écartez-le pour voir l'effet sur la droite.
	</p>

	<div class="grid2">
		<div class="panel">
			<h3>
				points colorés par levier (seuil hii &gt; 2(p+1)/n =
				{hThr.toFixed(2)})
			</h3>
			<!-- SVG manuel : fallback (clic-ajout + coloration par levier non couverts par ScatterPlot). -->
			<svg viewBox={`0 0 ${W} ${H}`} class="plot" role="group" aria-label="Nuage de points : ajouter et sélectionner des points">
				<!-- Interaction placée sur le rect (role="button") : pattern du repo
				     (VCShatteringExplorer) pour éviter les warnings a11y sur le svg racine. -->
				<rect
					x={PAD}
					y={PAD}
					width={W - 2 * PAD}
					height={H - 2 * PAD}
					fill="transparent"
					role="button"
					tabindex="0"
					aria-label="Ajouter un point : clic dans le graphique, ou Entrée pour un point au centre"
					onclick={addPoint}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addCenterPoint();
						}
					}}
				/>
				<line x1={sx(0)} y1={sy(0)} x2={sx(10)} y2={sy(0)} stroke="var(--color-border)" stroke-width="1" stroke-dasharray="3 3" />
				<line x1={lineFull[0][0]} y1={lineFull[0][1]} x2={lineFull[1][0]} y2={lineFull[1][1]} stroke="var(--color-text)" stroke-width="1.5" />
				{#if lineDel}
					<line x1={lineDel[0][0]} y1={lineDel[0][1]} x2={lineDel[1][0]} y2={lineDel[1][1]} stroke="var(--color-agent)" stroke-width="1.5" stroke-dasharray="5 4" />
				{/if}
				{#each pts as p, i (i + '-' + p.x + p.y)}
					<circle
						cx={sx(p.x)}
						cy={sy(p.y)}
						r={selected === i ? 6 : 4}
						fill={diag.h[i] > hThr ? 'var(--color-surprise)' : 'var(--color-belief)'}
						stroke={selected === i ? 'var(--color-text)' : 'transparent'}
						stroke-width="2"
						class="pt"
						role="button"
						tabindex="0"
						aria-label={`Sélectionner le point n°${i} (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`}
						onclick={(e) => {
							e.stopPropagation();
							selected = i;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								selected = i;
							}
						}}
					/>
				{/each}
			</svg>
			{#if exclude && fitDel}
				<p class="delline">point n°{selected} écarté — droite en pointillés</p>
			{/if}
		</div>
		<div class="panel">
			<h3>quadrants levier × résidu studentisé</h3>
			<svg viewBox={`0 0 ${WQ} ${HQ}`} class="plot" role="img" aria-label="Quadrants levier et résidu studentisé">
				<line x1={qx(0)} y1={qy(-tMax)} x2={qx(0)} y2={qy(tMax)} stroke="var(--color-border)" stroke-width="1" />
				<line x1={qx(0)} y1={qy(0)} x2={qx(hMax)} y2={qy(0)} stroke="var(--color-border)" stroke-width="1" />
				<line x1={qx(hThr)} y1={qy(-tMax)} x2={qx(hThr)} y2={qy(tMax)} stroke="var(--color-surprise)" stroke-width="1" stroke-dasharray="4 3" />
				<line x1={qx(0)} y1={qy(tThr)} x2={qx(hMax)} y2={qy(tThr)} stroke="var(--color-surprise)" stroke-width="1" stroke-dasharray="4 3" />
				<line x1={qx(0)} y1={qy(-tThr)} x2={qx(hMax)} y2={qy(-tThr)} stroke="var(--color-surprise)" stroke-width="1" stroke-dasharray="4 3" />
				{#each pts as p, i (i + '-' + p.x + p.y)}
					<circle
						cx={qx(diag.h[i])}
						cy={qy(diag.ti[i])}
						r={selected === i ? 5 : 3}
						fill={diag.Di[i] > 1 ? 'var(--color-negative, #e5484d)' : diag.h[i] > hThr ? 'var(--color-surprise)' : 'var(--color-belief)'}
						stroke={selected === i ? 'var(--color-text)' : 'transparent'}
						stroke-width="2"
					/>
				{/each}
				<text x={WQ - PADQ / 2 - 20} y={qy(-tMax) - 6} class="ax">levier</text>
				<text x={8} y={PADQ + 10} class="ax" transform={`rotate(-90 8 ${PADQ + 10})`}>tᵢ</text>
			</svg>
		</div>
	</div>

	<div class="controls">
		<Toggle
			checked={exclude}
			label="écart le point sélectionné"
			onchange={(v) => (exclude = v)}
		/>
		<Button variant="ghost" onclick={() => {
			pts = basePts.map((p) => ({ ...p }));
			selected = null;
			exclude = false;
		}}>
			réinitialiser
		</Button>
	</div>

	<Metrics>
		{#if sel}
			<div class="cell">
				<span class="label">point sélectionné</span>
				<span class="value">n°{sel.i} ({sel.x.toFixed(1)}, {sel.y.toFixed(1)})</span>
			</div>
			<div class="cell">
				<span class="label">levier hᵢᵢ (seuil {hThr.toFixed(2)})</span>
				<span class="value">{sel.h.toFixed(3)}</span>
			</div>
			<div class="cell">
				<span class="label">tᵢ studentisé (seuil {tThr.toFixed(2)})</span>
				<span class="value">{sel.t.toFixed(2)}</span>
			</div>
			<div class="cell">
				<span class="label">distance de Cook Dᵢ (seuil 1)</span>
				<span class="value">{sel.D.toFixed(3)}</span>
			</div>
			<div class="cell">
				<span class="label">pente β̂1 — tous points</span>
				<span class="value">{fitAll.beta[1].toFixed(3)}</span>
			</div>
			{#if fitDel}
				<div class="cell">
					<span class="label">pente β̂1 — sans ce point</span>
					<span class="value">{fitDel.beta[1].toFixed(3)}</span>
				</div>
			{/if}
		{:else}
			<div class="cell">
				<span class="label">sélection</span>
				<span class="value">cliquez sur un point</span>
			</div>
		{/if}
	</Metrics>

	<p class="caption">
		8.validation_du_modele_lineaire_2025.pdf, §8.5 : 0 ≤ hᵢᵢ ≤ 1 et Σhᵢᵢ = p+1 ; seuil
		levier hᵢᵢ &gt; 2(p+1)/n ; tᵢ ~ Student(n−p−2) avec |tᵢ| &gt; qt(0.975, n−p−2)
		(≈ 2) ; Dᵢ = hᵢᵢ·rᵢ²/((p+1)(1−hᵢᵢ)) avec seuil 1 (cooks.distance() en R). Un point
		atypique n'est pas forcément influent : c'est la combinaison levier × résidu qui
		compte. n = {n}/{MAX_PTS}, seedé.
	</p>
</div>

<style>
	.lm-cook {
		display: grid;
		gap: 1.25rem;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.grid2 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
		gap: 1.25rem;
		align-items: start;
	}

	.panel {
		min-width: 0;
		display: grid;
		gap: 0.5rem;
	}

	.panel h3 {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.plot {
		display: block;
		max-width: 100%;
		height: auto;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.plot:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: 2px;
	}

	.pt {
		cursor: pointer;
	}

	.delline {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-agent);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.ax {
		font-size: 10px;
		fill: var(--color-text-muted);
	}

	.caption {
		margin: 0;
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-epistemic);
		background: color-mix(in srgb, var(--color-epistemic) 8%, transparent);
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
</style>
