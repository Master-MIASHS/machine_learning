<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { runAdaBoostWithHistory } from '$lib/math/boosting.js';

	const N_SAMPLES = 50;
	const SVG_W = 620;
	const SVG_H_MAIN = 300;
	const PAD_L = 55;
	const PAD_R = 20;
	const PAD_T = 25;
	const PAD_B = 40;

	const CONV_H = 160;
	const CONV_PAD_B = 35;

	function makeRng(seed: number): () => number {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return s / 2147483647;
		};
	}

	function randn(rng: () => number): number {
		let u1 = rng(),
			u2 = rng();
		while (u1 === 0) u1 = rng();
		return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
	}

	function generateMoons(
		n: number,
		noise: number,
		seed: number,
		overlap: number // 0 = lunes bien séparées, 1 = quasi superposées
	): { X: number[][]; y: number[] } {
		const rng = makeRng(seed);
		const half = Math.floor(n / 2);
		const X: number[][] = [];
		const y: number[] = [];

		// Offset vertical entre les deux lunes — interpole entre bien séparé (1.0)
		// et fortement chevauché (0.15) selon `overlap`.
		const vOffset = 1.0 - overlap * 0.85;
		const hOffset = 1.0 - overlap * 0.6;

		for (let i = 0; i < n; i++) {
			let x, label;
			if (i < half) {
				const angle = Math.PI * (i / half);
				x = [Math.cos(angle), Math.sin(angle)];
				label = 1;
			} else {
				const angle = Math.PI * ((i - half) / half);
				x = [hOffset + Math.sin(angle), vOffset - Math.cos(angle)];
				label = -1;
			}
			X.push([x[0] + noise * randn(rng), x[1] + noise * randn(rng)]);
			y.push(label);
		}

		return { X, y };
	}

	let dataSeed = $state(42);
	let currentStep = $state(0);
	const numSamples = N_SAMPLES;

	let noiseLevel = $state(0.3);
	let overlap = $state(0.55);

	const data = $derived(generateMoons(numSamples, noiseLevel, dataSeed, overlap));

	const history = $derived.by(() => runAdaBoostWithHistory(data.X, data.y, 20));
	const numModels = $derived(history.models.length);

	function projXMain(x: number): number {
		const xMin = -4,
			xMax = 5;
		return PAD_L + ((x - xMin) / (xMax - xMin)) * (SVG_W - PAD_L - PAD_R);
	}
	function projYMain(y: number): number {
		const yMin = 0,
			yMax = 60;
		return SVG_H_MAIN - PAD_B - ((y - yMin) / (yMax - yMin)) * (SVG_H_MAIN - PAD_T - PAD_B);
	}
	function projXConv(x: number): number {
		const xMin = 0,
			xMax = Math.max(numModels, 1);
		return PAD_L + ((x - xMin) / (xMax - xMin)) * (SVG_W - PAD_L - PAD_R);
	}
	function projYConv(y: number): number {
		const yMin = 0;
		const yMax = Math.max(2, ...avgLosses) * 1.1;
		return (
			PAD_T +
			(CONV_H - PAD_T - CONV_PAD_B) -
			((y - yMin) / (yMax - yMin)) * (CONV_H - PAD_T - CONV_PAD_B)
		);
	}

	const expLossPoints = $derived.by(() => {
		const xMin = -4,
			xMax = 5;
		return Array.from({ length: 200 }, (_, i) => {
			const m = xMin + ((xMax - xMin) * i) / 199;
			return { x: m, y: Math.exp(-m) };
		});
	});

	// Marges signées (y·F(x)) par échantillon à l'étape courante
	const currentMargins = $derived.by(() => {
		if (currentStep <= 0 || history.models.length === 0) return new Array(data.X.length).fill(0);
		const modelsUpToCurrent = history.models.slice(0, currentStep);
		return data.X.map((x) => {
			let margin = 0;
			for (const { stump, alpha } of modelsUpToCurrent) {
				const pred = x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
				margin += alpha * pred;
			}
			return margin;
		});
	});

	const signedMargins = $derived(currentMargins.map((m, i) => data.y[i] * m));

	// Poids AdaBoost normalisés à l'étape courante (proportionnels à exp(-marge signée))
	const currentPointWeights = $derived.by(() => {
		const raw = signedMargins.map((m) => Math.exp(-m));
		const sum = raw.reduce((a, b) => a + b, 0) || 1;
		return raw.map((r) => r / sum);
	});
	const maxPointWeight = $derived(Math.max(...currentPointWeights, 1e-9));

	const avgLosses = $derived.by(() => {
		const losses: number[] = [1]; // étape 0 : marge=0 partout → exp(0)=1
		for (let s = 1; s <= numModels; s++) {
			const modelsUpToS = history.models.slice(0, s);
			let sumLoss = 0;
			for (let i = 0; i < data.X.length; i++) {
				let margin = 0;
				for (const { stump, alpha } of modelsUpToS) {
					const pred =
						data.X[i][stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
					margin += alpha * data.y[i] * pred;
				}
				sumLoss += Math.exp(-margin);
			}
			losses.push(sumLoss / data.X.length);
		}
		return losses;
	});

	const currentAvgLoss = $derived(avgLosses[currentStep] ?? 1);

	const correctlyClassified = $derived.by(() => {
		if (currentStep <= 0) return null; // pas encore de prédiction → indéfini, pas "tout correct"
		return signedMargins.filter((m) => m > 0).length;
	});

	const minMargin = $derived(signedMargins.length > 0 ? Math.min(...signedMargins) : 0);

	function stepForward() {
		if (currentStep < numModels) currentStep++;
	}
	function stepBackward() {
		if (currentStep > 0) currentStep--;
	}
	function resetDemo() {
		currentStep = 0;
		isPlaying = false;
	}

	let isPlaying = $state(false);
	$effect(() => {
		void noiseLevel;
		void overlap;
		void dataSeed;
		currentStep = 0;
		isPlaying = false;
	});
	$effect(() => {
		if (!isPlaying) return;
		const id = setInterval(() => {
			if (currentStep < numModels) currentStep++;
			else isPlaying = false;
		}, 700);
		return () => clearInterval(id);
	});

	function togglePlay() {
		isPlaying = !isPlaying;
		if (isPlaying && currentStep >= numModels) currentStep = 0;
	}

	function regenerate() {
		dataSeed++;
		currentStep = 0;
		isPlaying = false;
	}

	const xTicksMain = $derived(
		Array.from({ length: 10 }, (_, i) => ({ val: -4 + i, px: projXMain(-4 + i) }))
	);

	const lossCurveD = $derived(
		expLossPoints
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${projXMain(p.x)} ${projYMain(Math.min(p.y, 60))}`)
			.join(' ')
	);
	const convergenceCurveD = $derived(
		avgLosses.map((l, i) => `${i === 0 ? 'M' : 'L'} ${projXConv(i)} ${projYConv(l)}`).join(' ')
	);

	// Aire remplie sous la courbe jusqu'à la perte moyenne courante — pour un
	// effet de "remplissage" qui se vide visuellement au fil des itérations.
	const fillAreaD = $derived.by(() => {
		const pts = expLossPoints.filter((p) => p.y <= 60);
		if (pts.length === 0) return '';
		const top = pts
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${projXMain(p.x)} ${projYMain(Math.min(p.y, 60))}`)
			.join(' ');
		const baseY = SVG_H_MAIN - PAD_B;
		return `${top} L ${projXMain(pts[pts.length - 1].x)} ${baseY} L ${projXMain(pts[0].x)} ${baseY} Z`;
	});
</script>

<Figure type="chart">
	<div class="exp-loss-demo">
		<header class="demo-header">
			<span class="eyebrow">AdaBoost</span>
			<h2>Perte exponentielle et marges fonctionnelles</h2>
			<p>
				Chaque point tombe sur la courbe <span class="mono">L(m) = exp(−m)</span> selon sa marge
				<span class="mono">m = y·F(x)</span>. Plus un point est loin à gauche (mal classé), plus sa
				perte explose — et plus son poids pour le prochain stump grandit.
			</p>
		</header>

		<div class="main-chart">
			<svg viewBox={`0 0 ${SVG_W} ${SVG_H_MAIN}`} width="100%" height={SVG_H_MAIN}>
				<defs>
					<linearGradient id="loss-fill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="var(--color-epistemic, #a78bfa)" stop-opacity="0.25" />
						<stop offset="100%" stop-color="var(--color-epistemic, #a78bfa)" stop-opacity="0" />
					</linearGradient>
				</defs>

				<g class="grid">
					{#each xTicksMain as tick}
						<line x1={tick.px} y1={PAD_T} x2={tick.px} y2={SVG_H_MAIN - PAD_B} />
					{/each}
				</g>

				<path d={fillAreaD} fill="url(#loss-fill)" />
				<path d={lossCurveD} class="loss-curve" />

				<line
					x1={projXMain(0)}
					y1={PAD_T}
					x2={projXMain(0)}
					y2={SVG_H_MAIN - PAD_B}
					class="zero-line"
				/>
				<text x={projXMain(0)} y={SVG_H_MAIN - 8} text-anchor="middle" class="annotation-text"
					>m = 0</text
				>

				<!-- Points "tombant" sur la courbe : taille = poids AdaBoost, couleur = correct/incorrect -->
				{#if currentStep > 0}
					{#each signedMargins as m, i}
						{@const py = projYMain(Math.min(Math.exp(-m), 60))}
						{@const w = currentPointWeights[i] / maxPointWeight}
						<line
							x1={projXMain(m)}
							y1={SVG_H_MAIN - PAD_B}
							x2={projXMain(m)}
							y2={py}
							class={`margin-line ${m > 0 ? 'correct' : 'incorrect'}`}
						/>
						<circle
							cx={projXMain(m)}
							cy={py}
							r={2.5 + w * 7}
							class={`margin-dot ${m > 0 ? 'correct' : 'incorrect'}`}
						/>
					{/each}

					<circle cx={projXMain(0)} cy={projYMain(currentAvgLoss)} r="6" class="avg-marker" />
					<text x={projXMain(0) + 12} y={projYMain(currentAvgLoss) - 10} class="avg-label">
						L̄ = {currentAvgLoss.toFixed(3)}
					</text>
				{/if}

				<line
					x1={PAD_L}
					y1={SVG_H_MAIN - PAD_B}
					x2={SVG_W - PAD_R}
					y2={SVG_H_MAIN - PAD_B}
					class="axis"
				/>
				<line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={SVG_H_MAIN - PAD_B} class="axis" />

				{#each xTicksMain as tick}
					<text x={tick.px} y={SVG_H_MAIN - 8} text-anchor="middle" class="axis-label"
						>{tick.val.toFixed(1)}</text
					>
				{/each}

				<text
					transform={`translate(${PAD_L - 45}, ${SVG_H_MAIN / 2}) rotate(-90)`}
					text-anchor="middle"
					class="axis-y-label"
				>
					exp(−m)
				</text>
				<text x={SVG_W / 2} y={SVG_H_MAIN - 1} text-anchor="middle" class="axis-title">
					Marge fonctionnelle m = y · F(x)
				</text>
			</svg>
		</div>

		<!-- Bande de poids : montre directement comment les points mal classés
		     grossissent en poids pour le tour suivant — le lien causal explicite. -->
		{#if currentStep > 0}
			<div class="weight-strip">
				<span class="weight-strip-label">Poids pour le stump suivant</span>
				<div class="weight-track">
					{#each signedMargins as m, i}
						{@const w = currentPointWeights[i] / maxPointWeight}
						<div
							class={`weight-chip ${m > 0 ? 'correct' : 'incorrect'}`}
							style:width="{4 + w * 14}px"
							style:height="{4 + w * 14}px"
							title={`marge = ${m.toFixed(2)}`}
						></div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="convergence-chart">
			<svg viewBox={`0 0 ${SVG_W} ${CONV_H}`} width="100%" height={CONV_H}>
				<g class="grid">
					{#each Array.from({ length: Math.max(numModels, 1) + 1 }, (_, i) => i) as tickVal}
						<line
							x1={projXConv(tickVal)}
							y1={PAD_T}
							x2={projXConv(tickVal)}
							y2={CONV_H - CONV_PAD_B}
						/>
					{/each}
				</g>

				<path d={convergenceCurveD} class="convergence-curve" />

				{#if currentStep > 0}
					<circle
						cx={projXConv(currentStep)}
						cy={projYConv(avgLosses[currentStep])}
						r="5"
						class="current-dot"
					/>
					<line
						x1={projXConv(currentStep)}
						y1={PAD_T}
						x2={projXConv(currentStep)}
						y2={CONV_H - CONV_PAD_B}
						class="step-line"
					/>
				{/if}

				<line
					x1={PAD_L}
					y1={CONV_H - CONV_PAD_B}
					x2={SVG_W - PAD_R}
					y2={CONV_H - CONV_PAD_B}
					class="axis"
				/>
				<line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={CONV_H - CONV_PAD_B} class="axis" />

				{#each Array.from({ length: Math.max(numModels, 1) + 1 }, (_, i) => i) as tickVal}
					<text
						x={projXConv(tickVal)}
						y={CONV_H - CONV_PAD_B + 14}
						text-anchor="middle"
						class="axis-label">{tickVal}</text
					>
				{/each}

				<text x={SVG_W / 2} y={CONV_H - 1} text-anchor="middle" class="axis-title">Itération t</text
				>
				<text
					transform={`translate(${PAD_L - 45}, ${CONV_H / 2}) rotate(-90)`}
					text-anchor="middle"
					class="axis-y-label"
				>
					Perte moyenne
				</text>
			</svg>
		</div>

		<div class="metrics-row">
			<div class="cell">
				<span class="label">Perte L̄ = exp(−m)</span>
				<span class="value">{currentAvgLoss.toFixed(4)}</span>
			</div>
			<div class="cell">
				<span class="label">Correctement classés</span>
				<span class="value" style:color="var(--color-positive)">
					{#if correctlyClassified === null}
						—
					{:else}
						{correctlyClassified}/{data.X.length} ({(
							(100 * correctlyClassified) /
							data.X.length
						).toFixed(1)}%)
					{/if}
				</span>
			</div>
			<div class="cell">
				<span class="label">Marge minimale</span>
				<span
					class="value"
					style:color={minMargin > 0 ? 'var(--color-positive)' : 'var(--color-surprise)'}
				>
					{minMargin.toFixed(4)}
				</span>
			</div>
		</div>

		<div class="controls-panel">
			<Slider bind:value={currentStep} min={0} max={numModels} step={1} label="Étape" />
			<div class="button-row">
				<Button variant="ghost" size="sm" onclick={resetDemo}>⟲ Reset</Button>
				<Button variant="outline" size="sm" onclick={stepBackward} disabled={currentStep <= 0}
					>← Préc.</Button
				>
				<Button variant="primary" size="sm" onclick={togglePlay} disabled={numModels === 0}>
					{isPlaying ? '⏸ Pause' : '▶ Jouer'}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={stepForward}
					disabled={currentStep >= numModels}>Suiv. →</Button
				>
				<Slider
					bind:value={overlap}
					min={0}
					max={0.85}
					step={0.05}
					label="Chevauchement des classes"
				/>
				<Slider bind:value={noiseLevel} min={0.05} max={0.5} step={0.01} label="Bruit" />
			</div>
			<div class="button-row">
				<Button variant="outline" size="sm" onclick={regenerate}>⟳ Nouvelles données</Button>
			</div>
		</div>

		<div class="legend">
			<span><span class="swatch-line curve-swatch"></span> Perte exponentielle L(m)</span>
			<span><span class="swatch-dot swatch-correct"></span> Marge &gt; 0 (correct)</span>
			<span><span class="swatch-dot swatch-incorrect"></span> Marge ≤ 0 (erreur)</span>
			<span><span class="swatch-chip"></span> Taille = poids du point</span>
		</div>

		<p class="caption-note">
			<strong>AdaBoost minimise implicitement la perte exponentielle.</strong> Regardez la bande de poids
			sous le graphique : les points mal classés (rouges, marge négative) grossissent visiblement — c'est
			exactement ce surpoids qui force le prochain stump à se concentrer sur eux.
		</p>
	</div>

	{#snippet caption()}
		<p>Perte exponentielle et convergence d'AdaBoost — étape {currentStep}/{numModels}</p>
	{/snippet}
</Figure>

<style>
	.exp-loss-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
		width: 100%;
	}

	.demo-header {
		text-align: center;
		padding-bottom: 0.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.eyebrow {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--color-epistemic, #a78bfa);
	}

	.demo-header h2 {
		font-size: 1.1rem;
		margin: 0;
		color: var(--color-text);
	}

	.demo-header p {
		font-size: 0.84rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.mono {
		font-family: var(--font-mono, monospace);
	}

	.main-chart {
		width: 100%;
		max-width: 620px;
		aspect-ratio: 620 / 300;
	}

	.convergence-chart {
		width: 100%;
		max-width: 620px;
		aspect-ratio: 620 / 160;
	}

	.main-chart svg,
	.convergence-chart svg {
		display: block;
		width: 100%;
		height: 100%;
		user-select: none;
	}

	.grid line {
		stroke: var(--color-border);
		stroke-width: 0.3;
		stroke-dasharray: 2, 2;
	}

	.loss-curve {
		fill: none;
		stroke: var(--color-epistemic, #a78bfa);
		stroke-width: 2;
	}

	.zero-line {
		stroke: var(--color-text-muted);
		stroke-width: 0.5;
		stroke-dasharray: 4, 3;
	}

	.margin-line {
		stroke-width: 1;
		opacity: 0.35;
	}
	.margin-line.correct {
		stroke: var(--color-belief);
	}
	.margin-line.incorrect {
		stroke: var(--color-surprise);
	}

	.margin-dot {
		stroke: rgba(255, 255, 255, 0.7);
		stroke-width: 0.8;
		transition:
			r 0.3s ease,
			cx 0.4s ease,
			cy 0.4s ease;
	}
	.margin-dot.correct {
		fill: var(--color-belief);
	}
	.margin-dot.incorrect {
		fill: var(--color-surprise);
	}

	.avg-marker {
		fill: var(--color-epistemic, #a78bfa);
		stroke: var(--color-surface);
		stroke-width: 2;
	}
	.avg-label {
		fill: var(--color-epistemic, #a78bfa);
		font-size: 10px;
		font-weight: bold;
	}

	.convergence-curve {
		fill: none;
		stroke: var(--color-belief);
		stroke-width: 2;
	}
	.current-dot {
		fill: var(--color-surprise);
		stroke: var(--color-surface);
		stroke-width: 2;
	}
	.step-line {
		stroke: var(--color-surprise);
		stroke-width: 0.5;
		stroke-dasharray: 3, 3;
		opacity: 0.5;
	}

	.axis {
		stroke: var(--color-border);
		stroke-width: 0.8;
	}
	.axis-label {
		fill: var(--color-text-muted);
		font-size: 10px;
	}
	.axis-title {
		fill: var(--color-text-muted);
		font-size: 11px;
	}
	.axis-y-label {
		fill: var(--color-text-muted);
		font-size: 10px;
	}
	.annotation-text {
		fill: var(--color-text-muted);
		font-size: 9px;
	}

	.weight-strip {
		width: 100%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2, transparent);
	}
	.weight-strip-label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		text-align: center;
	}
	.weight-track {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		justify-content: center;
		align-items: center;
		min-height: 20px;
	}
	.weight-chip {
		border-radius: 50%;
		transition:
			width 0.3s ease,
			height 0.3s ease;
	}
	.weight-chip.correct {
		background: var(--color-belief);
	}
	.weight-chip.incorrect {
		background: var(--color-surprise);
	}

	.metrics-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		background: var(--color-surface-2, #1a1b2e);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.75rem 1rem;
		width: 100%;
		max-width: 600px;
		justify-content: center;
	}
	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 0.25rem 0.75rem;
	}
	.label {
		font-size: 10px;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.value {
		font-size: 14px;
		font-weight: bold;
		font-family: var(--font-mono, monospace);
		color: var(--color-text);
	}

	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: var(--color-surface-2, #1a1b2e);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.75rem 1rem;
		width: 100%;
	}
	.button-row {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.legend {
		display: flex;
		gap: 1rem;
		font-size: 11px;
		color: var(--color-text-muted);
		flex-wrap: wrap;
		justify-content: center;
	}
	.swatch-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-right: 4px;
		vertical-align: middle;
	}
	.swatch-line {
		display: inline-block;
		width: 20px;
		height: 3px;
		margin-right: 4px;
		vertical-align: middle;
		border-radius: 1px;
	}
	.swatch-correct {
		background: var(--color-belief);
	}
	.swatch-incorrect {
		background: var(--color-surprise);
	}
	.curve-swatch {
		background: var(--color-epistemic, #a78bfa);
	}
	.swatch-chip {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-text-muted);
		margin-right: 4px;
		vertical-align: middle;
	}

	.caption-note {
		font-size: 12px;
		color: var(--color-text-muted);
		text-align: center;
		max-width: 520px;
		line-height: 1.4;
		margin-top: 0.25rem;
	}

	@media (max-width: 640px) {
		.button-row {
			flex-direction: column;
			align-items: stretch;
		}
		.metrics-row {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
