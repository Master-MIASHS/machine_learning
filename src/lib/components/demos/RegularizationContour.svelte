<script lang="ts">
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';

	type Penalty = 'l1' | 'l2' | 'elastic-net';

	/* ------------------------------------------------------------------ */
	/* State                                                               */
	/* ------------------------------------------------------------------ */

	let constraintRadius = $state(2.5);
	let penaltyType = $state<Penalty>('l1');
	let l1Ratio = $state(0.5);

	/* ------------------------------------------------------------------ */
	/* Problem definition                                                  */
	/* ------------------------------------------------------------------ */

	const ols = {
		x: 1,
		y: 2.5
	};

	const chartWidth = 400;
	const chartHeight = 350;
	const pad = 36;

	const xDomain: [number, number] = [-5, 5];
	const yDomain: [number, number] = [-5, 5];
	const domain: [[number, number], [number, number]] = [xDomain, yDomain];

	/* ------------------------------------------------------------------ */
	/* Coordinate projection                                               */
	/* ------------------------------------------------------------------ */

	function projX(x: number) {
		return pad + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * (chartWidth - 2 * pad);
	}

	function projY(y: number) {
		return pad + ((yDomain[1] - y) / (yDomain[1] - yDomain[0])) * (chartHeight - 2 * pad);
	}

	/* ------------------------------------------------------------------ */
	/* Quadratic loss                                                     */
	/* ------------------------------------------------------------------ */

	function mse(w1: number, w2: number) {
		const dx = w1 - ols.x;
		const dy = w2 - ols.y;

		return (dx * dx + 0.6 * dx * dy + dy * dy) / 2;
	}

	/* ------------------------------------------------------------------ */
	/* Constraint norms                                                   */
	/* ------------------------------------------------------------------ */

	function l1Norm(x: number, y: number) {
		return Math.abs(x) + Math.abs(y);
	}

	function l2Norm(x: number, y: number) {
		return Math.hypot(x, y);
	}

	function elasticNorm(x: number, y: number, alpha: number) {
		return alpha * l1Norm(x, y) + (1 - alpha) * l2Norm(x, y);
	}

	function isFeasible(x: number, y: number) {
		switch (penaltyType) {
			case 'l1':
				return l1Norm(x, y) <= constraintRadius;

			case 'l2':
				return l2Norm(x, y) <= constraintRadius;

			case 'elastic-net':
				return elasticNorm(x, y, l1Ratio) <= constraintRadius;
		}
	}

	/* ------------------------------------------------------------------ */
	/* Boundary parameterisation                                          */
	/* ------------------------------------------------------------------ */

	function boundaryPoint(theta: number, radius: number, type: Penalty, alpha = 0.5) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);

		if (type === 'l2') {
			return {
				x: radius * c,
				y: radius * s
			};
		}

		if (type === 'l1') {
			const scale = radius / (Math.abs(c) + Math.abs(s) || 1e-12);

			return {
				x: scale * c,
				y: scale * s
			};
		}

		const denom = alpha * (Math.abs(c) + Math.abs(s)) + (1 - alpha);

		const scale = radius / (denom || 1e-12);

		return {
			x: scale * c,
			y: scale * s
		};
	}

	/* ------------------------------------------------------------------ */
	/* Constrained optimum                                                */
	/* ------------------------------------------------------------------ */

	const SCAN_STEPS = 2000;

	function solveConstrained() {
		//
		// If OLS is feasible, it is the exact optimum.
		//
		if (isFeasible(ols.x, ols.y)) {
			return { ...ols };
		}

		//
		// Otherwise the optimum lies on the boundary.
		//
		let best = boundaryPoint(0, constraintRadius, penaltyType, l1Ratio);

		let bestLoss = mse(best.x, best.y);

		for (let i = 1; i < SCAN_STEPS; i++) {
			const theta = (2 * Math.PI * i) / SCAN_STEPS;

			const p = boundaryPoint(theta, constraintRadius, penaltyType, l1Ratio);

			const loss = mse(p.x, p.y);

			if (loss < bestLoss) {
				bestLoss = loss;
				best = p;
			}
		}

		return best;
	}

	const solutionPoint = $derived(solveConstrained());

	/* ------------------------------------------------------------------ */
	/* Sparsity                                                           */
	/* ------------------------------------------------------------------ */

	const SPARSITY_EPS = 0.02;

	const isSparse = $derived(
		Math.abs(solutionPoint.x) < SPARSITY_EPS || Math.abs(solutionPoint.y) < SPARSITY_EPS
	);

	/* ------------------------------------------------------------------ */
	/* SVG geometry                                                       */
	/* ------------------------------------------------------------------ */

	const constraintRadiusPx = $derived(
		(constraintRadius / (xDomain[1] - xDomain[0])) * (chartWidth - 2 * pad)
	);

	const l1Points = $derived.by(() =>
		[
			`${projX(0)},${projY(constraintRadius)}`,
			`${projX(constraintRadius)},${projY(0)}`,
			`${projX(0)},${projY(-constraintRadius)}`,
			`${projX(-constraintRadius)},${projY(0)}`
		].join(' ')
	);

	const elasticNetPoints = $derived.by(() => {
		const pts: string[] = [];

		for (let i = 0; i < 180; i++) {
			const theta = (2 * Math.PI * i) / 180;
			const p = boundaryPoint(theta, constraintRadius, 'elastic-net', l1Ratio);

			pts.push(`${projX(p.x)},${projY(p.y)}`);
		}

		return pts.join(' ');
	});

	/* ------------------------------------------------------------------ */

	const types = [
		{ key: 'l2', label: 'Ridge (L2)' },
		{ key: 'l1', label: 'Lasso (L1)' },
		{ key: 'elastic-net', label: 'Elastic Net' }
	] as const;

	function setType(type: Penalty) {
		penaltyType = type;
	}
</script>

<div class="reg-contour">
	<div class="chart-area">
		<Figure type="chart" containerWidth={400}>
			<ContourPlot
				f={mse}
				{domain}
				width={chartWidth}
				height={chartHeight}
				numLevels={12}
				showAxes={true}
			/>
		</Figure>

		<svg class="overlay" width={chartWidth} height={chartHeight}>
			<!-- Constraint geometry -->
			{#if penaltyType === 'l2'}
				<circle
					cx={projX(0)}
					cy={projY(0)}
					r={constraintRadiusPx}
					fill="none"
					stroke="#f59e0b"
					stroke-width="3"
				/>
			{:else if penaltyType === 'l1'}
				<polygon points={l1Points} fill="none" stroke="#f59e0b" stroke-width="3" />
			{:else}
				<polygon points={elasticNetPoints} fill="none" stroke="#f59e0b" stroke-width="3" />
			{/if}

			<!-- OLS point -->
			<circle
				cx={projX(ols.x)}
				cy={projY(ols.y)}
				r="7"
				fill="#ef4444"
				stroke="white"
				stroke-width="2"
			/>

			<text
				x={projX(ols.x)}
				y={projY(ols.y) - 12}
				text-anchor="middle"
				fill="#ef4444"
				font-size="11"
			>
				OLS
			</text>

			<!-- Constrained solution -->
			<circle
				cx={projX(solutionPoint.x)}
				cy={projY(solutionPoint.y)}
				r="7"
				fill="#22c55e"
				stroke="white"
				stroke-width="2"
			/>

			<text
				x={projX(solutionPoint.x)}
				y={projY(solutionPoint.y) - 12}
				text-anchor="middle"
				fill="#22c55e"
				font-size="11"
			>
				Solution
			</text>

			<!-- Reference axes -->
			<line
				x1={projX(0)}
				y1={pad}
				x2={projX(0)}
				y2={chartHeight - pad}
				stroke="#6b7280"
				stroke-width="1"
				stroke-dasharray="4 3"
			/>

			<line
				x1={pad}
				y1={projY(0)}
				x2={chartWidth - pad}
				y2={projY(0)}
				stroke="#6b7280"
				stroke-width="1"
				stroke-dasharray="4 3"
			/>
		</svg>
	</div>

	<!-- Penalty selector -->
	<div class="toggle-group">
		{#each types as t (t.key)}
			<button class="type-btn" class:active={penaltyType === t.key} onclick={() => setType(t.key)}>
				{t.label}
			</button>
		{/each}
	</div>

	<!-- Elastic net mixing parameter -->
	{#if penaltyType === 'elastic-net'}
		<SliderGrid variant="outline">
			<div class="grp">
				<div class="gttl">Mélange Elastic Net</div>

				<Slider bind:value={l1Ratio} min={0} max={1} step={0.05} label="α (mix L1/L2)" />
			</div>
		</SliderGrid>
	{/if}

	<!-- Constraint size -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Force de régularisation</div>

			<Slider bind:value={constraintRadius} min={0.5} max={6} step={0.1} label="Rayon contrainte" />
		</div>
	</SliderGrid>

	<!-- Solution information -->
	<div class="solution-panel">
		<span class="sol-label"> Solution régulière: </span>

		<span class="sol-value">
			w₁ ≈ {solutionPoint.x.toFixed(3)}, w₂ ≈ {solutionPoint.y.toFixed(3)}
		</span>

		{#if isSparse}
			<span class="sparsity-badge"> ✓ Sparse (un coefficient ≈ 0) </span>
		{/if}
	</div>

	<p class="cap">
		La régularisation limite l'espace disponible pour les coefficients. Si la zone de contrainte
		contient la solution OLS, la solution reste inchangée. Lorsque la contrainte devient trop
		restrictive, la solution se déplace sur la frontière de la zone autorisée. Le
		<strong>Lasso (L1)</strong> possède des coins qui peuvent attirer la solution vers un axe et
		produire un coefficient nul. Le
		<strong>Ridge (L2)</strong>, avec sa frontière circulaire, produit un rétrécissement continu
		sans favoriser exactement les zéros.
	</p>
</div>

<style>
	.reg-contour {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.chart-area {
		position: relative;
		width: fit-content;
		margin: 0 auto;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.toggle-group {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.type-btn {
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: transparent;
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--color-text, inherit);
	}

	.type-btn.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
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

	.solution-panel {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--color-surface-2, transparent);
		font-size: 0.82rem;
	}

	.sol-label {
		color: var(--color-text-muted);
		font-weight: 600;
	}
	.sol-value {
		font-family: 'SF Mono', monospace;
		margin-left: auto;
		color: #22c55e;
	}

	.sparsity-badge {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		padding: 0.15em 0.5em;
		border-radius: var(--radius-sm, 4px);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}

	@media (max-width: 540px) {
		.solution-panel {
			flex-wrap: wrap;
		}
	}
</style>
