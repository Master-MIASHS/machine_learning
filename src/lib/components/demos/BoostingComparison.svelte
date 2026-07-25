<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { runAdaBoostWithHistory, evaluateAdaboostBoundary } from '$lib/math/boosting.js';

	// ─── Constants ──────────────────────────────────────
	const N_SAMPLES = 80;
	const DEFAULT_MAX_ITER = 20;
	const LEARNING_RATE = 0.3;
	const GRID_RES = 24;

	// Small SVG dimensions for side-by-side panels
	const PLOT_W = 220;
	const PLOT_H = 180;
	const PAD_L = 36,
		PAD_R = 10,
		PAD_T = 10,
		PAD_B = 28;
	const SVG_W = PLOT_W + PAD_L + PAD_R;
	const SVG_H = PLOT_H + PAD_T + PAD_B;

	// Color scheme for methods — plain hex values used consistently
	// everywhere (SVG fill, chart series, inline styles, and CSS below).
	// Do NOT wrap these in var(...) — they're consumed by JS, not CSS,
	// and parsing a var() string back apart in JS is exactly what broke
	// this before (invisible line + mismatched legend color).
	const ADABOOST_COLOR = '#06b6d4';
	const GB_COLOR = '#f59e0b';
	const NEGATIVE_COLOR = '#ef4444';

	// ─── Seeded RNG (Lehmer / MINSTD) ──────────────────
	function makeRng(seed: number): () => number {
		let s = ((seed % 2147483647) + 2147483647) % 2147483647 || 1;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646; // [0, 1)
		};
	}

	function randn(rng: () => number): number {
		let u1 = rng(),
			u2 = rng();
		while (u1 === 0) u1 = rng();
		return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	type DatasetType = 'moons' | 'circles' | 'linear';

	// ─── Data generators ────────────────────────────────
	function generateMoons(n: number, seed: number, noise: number): { X: number[][]; y: number[] } {
		const rng = makeRng(seed + 100);
		const half = Math.floor(n / 2);
		const X: number[][] = [];
		const y: number[] = [];

		for (let i = 0; i < n; i++) {
			let x: number[], label: number;
			if (i < half) {
				const angle = Math.PI * (i / (half - 1 || 1));
				x = [
					0.9 * Math.cos(angle) + 0.45 + randn(rng) * noise,
					0.9 * Math.sin(angle) - 0.25 + randn(rng) * noise
				];
				label = 1;
			} else {
				const idx = i - half;
				const angle = Math.PI * (idx / (half - 1 || 1));
				x = [
					0.9 * Math.cos(Math.PI + angle) + 0.55 + randn(rng) * noise,
					0.9 * Math.sin(Math.PI + angle) + 0.25 + randn(rng) * noise
				];
				label = -1;
			}
			X.push(x);
			y.push(label);
		}
		return { X, y };
	}

	function generateCircles(n: number, seed: number, noise: number): { X: number[][]; y: number[] } {
		const rng = makeRng(seed + 200);
		const half = Math.floor(n / 2);
		const X: number[][] = [];
		const y: number[] = [];

		for (let i = 0; i < n; i++) {
			if (i < half) {
				// Inner circle — label -1
				const angle = rng() * 2 * Math.PI;
				const r = 0.4 * Math.sqrt(rng());
				X.push([
					r * Math.cos(angle) + randn(rng) * noise,
					r * Math.sin(angle) + randn(rng) * noise
				]);
				y.push(-1);
			} else {
				// Outer ring — label +1
				const angle = rng() * 2 * Math.PI;
				const r = 0.85 + 0.15 * rng();
				X.push([
					r * Math.cos(angle) + randn(rng) * noise,
					r * Math.sin(angle) + randn(rng) * noise
				]);
				y.push(1);
			}
		}
		return { X, y };
	}

	function generateLinear(n: number, seed: number, noise: number): { X: number[][]; y: number[] } {
		const rng = makeRng(seed + 300);
		const half = Math.floor(n / 2);
		const X: number[][] = [];
		const y: number[] = [];

		for (let i = 0; i < n; i++) {
			if (i < half) {
				X.push([randn(rng) * noise + 1.0, randn(rng) * noise + 0.5]);
				y.push(1);
			} else {
				X.push([randn(rng) * noise - 0.8, randn(rng) * noise - 0.6]);
				y.push(-1);
			}
		}
		return { X, y };
	}

	function generateData(
		type: DatasetType,
		seed: number,
		noise: number
	): { X: number[][]; y: number[] } {
		switch (type) {
			case 'moons':
				return generateMoons(N_SAMPLES, seed, 0.1 + noise);
			case 'circles':
				return generateCircles(N_SAMPLES, seed, 0.05 + noise * 0.3);
			case 'linear':
				return generateLinear(N_SAMPLES, seed, 0.4 + noise * 0.8);
		}
	}

	function getDomain(type: DatasetType): { xRange: [number, number]; yRange: [number, number] } {
		switch (type) {
			case 'moons':
				return { xRange: [-1.5, 2.5], yRange: [-1.5, 1.5] };
			case 'circles':
				return { xRange: [-1.4, 1.4], yRange: [-1.4, 1.4] };
			case 'linear':
				return { xRange: [-3.0, 3.0], yRange: [-2.5, 2.5] };
		}
	}

	function getDatasetLabel(type: DatasetType): string {
		switch (type) {
			case 'moons':
				return 'Deux lunes';
			case 'circles':
				return 'Cercle / Anneau';
			case 'linear':
				return 'Séparation linéaire';
		}
	}

	// ─── 2D Regression Stump for Gradient Boosting ──────
	interface RegStump2D {
		featureIdx: number;
		threshold: number;
		leftValue: number;
		rightValue: number;
	}

	function fitRegStump2D(X: number[][], residuals: number[]): RegStump2D {
		const n = X.length;
		let bestMse = Infinity;
		let bestStump: RegStump2D | null = null;

		for (const featureIdx of [0, 1]) {
			const vals = [...new Set(X.map((row) => row[featureIdx]))].sort((a, b) => a - b);
			for (let t = 0; t < vals.length - 1; t++) {
				const threshold = (vals[t] + vals[t + 1]) / 2;

				let leftSum = 0,
					leftCount = 0,
					rightSum = 0,
					rightCount = 0;
				for (let i = 0; i < n; i++) {
					if (X[i][featureIdx] <= threshold) {
						leftSum += residuals[i];
						leftCount++;
					} else {
						rightSum += residuals[i];
						rightCount++;
					}
				}

				const leftValue = leftCount > 0 ? leftSum / leftCount : 0;
				const rightValue = rightCount > 0 ? rightSum / rightCount : 0;

				let mse = 0;
				for (let i = 0; i < n; i++) {
					const pred = X[i][featureIdx] <= threshold ? leftValue : rightValue;
					mse += (residuals[i] - pred) ** 2;
				}

				if (mse < bestMse) {
					bestMse = mse;
					bestStump = { featureIdx, threshold, leftValue, rightValue };
				}
			}
		}

		return (
			bestStump ?? {
				featureIdx: 0,
				threshold: 0,
				leftValue: residuals.reduce((a, b) => a + b, 0) / n,
				rightValue: residuals.reduce((a, b) => a + b, 0) / n
			}
		);
	}

	function predictRegStump2D(stump: RegStump2D, x: number[]): number {
		return x[stump.featureIdx] <= stump.threshold ? stump.leftValue : stump.rightValue;
	}

	// ─── Gradient Boosting on 2D classification data ──────
	interface GBHistory2D {
		stumps: RegStump2D[];
		FAtEachStep: number[][];
		trainingErrors: number[];
		residualSums: number[];
	}

	function runGBWithHistory2D(X: number[][], y: number[], T: number, lr: number): GBHistory2D {
		const n = X.length;
		// Initialize F to mean(y) — for {-1,+1}, this is close to 0
		const F_init = y.reduce((a, b) => a + b, 0) / n;
		const F = new Array(n).fill(F_init);

		function classifyError(fArr: number[]): number {
			let wrong = 0;
			for (let i = 0; i < n; i++) {
				if (Math.sign(fArr[i]) !== y[i]) wrong++;
			}
			return wrong / n;
		}

		const result: GBHistory2D = {
			stumps: [],
			FAtEachStep: [[...F]],
			trainingErrors: [classifyError(F)],
			residualSums: []
		};

		for (let t = 0; t < T; t++) {
			const residuals = Array.from({ length: n }, (_, i) => y[i] - F[i]);
			result.residualSums.push(residuals.reduce((a, b) => a + b * b, 0));

			const stump = fitRegStump2D(X, residuals);
			result.stumps.push(stump);

			for (let i = 0; i < n; i++) {
				F[i] += lr * predictRegStump2D(stump, X[i]);
			}

			result.FAtEachStep.push([...F]);
			result.trainingErrors.push(classifyError(F));
		}

		return result;
	}

	// ─── Evaluate GB boundary on 2D grid ──────────────
	function evaluateGBBoundary(
		stumps: RegStump2D[],
		F_init: number,
		lr: number,
		xRange: [number, number],
		yRange: [number, number],
		resolution = 40
	): { predictions: number[][]; values: number[][] } {
		const gridX: number[] = [];
		for (let i = 0; i <= resolution; i++) {
			gridX.push(xRange[0] + ((xRange[1] - xRange[0]) * i) / resolution);
		}

		const gridY: number[] = [];
		for (let j = 0; j <= resolution; j++) {
			gridY.push(yRange[0] + ((yRange[1] - yRange[0]) * j) / resolution);
		}

		const predictions: number[][] = [];
		const values: number[][] = [];

		for (let j = 0; j <= resolution; j++) {
			predictions[j] = [];
			values[j] = [];
			for (let i = 0; i <= resolution; i++) {
				const x = [gridX[i], gridY[j]];
				let F_val = F_init;
				for (const stump of stumps) {
					F_val += lr * predictRegStump2D(stump, x);
				}
				predictions[j][i] = Math.sign(F_val);
				values[j][i] = F_val;
			}
		}

		return { predictions, values };
	}

	// ─── State ──────────────────────────────────────────
	let dataSeed = $state(0);
	let currentStep = $state(0);
	let maxIterations = $state(DEFAULT_MAX_ITER);
	let datasetType = $state<DatasetType>('moons');
	let noiseLevel = $state(0.15);
	let isPlaying = $state(false);

	// ─── Derived: dataset + domain ──────────────────────
	const data = $derived(generateData(datasetType, dataSeed, noiseLevel));
	const domain = $derived(getDomain(datasetType));

	// ─── Derived: AdaBoost history ──────────────────────
	const adaHistory = $derived.by(() => {
		return runAdaBoostWithHistory(data.X, data.y, maxIterations);
	});

	// ─── Derived: Gradient Boosting history ─────────────
	const gbHistory = $derived.by(() => {
		return runGBWithHistory2D(data.X, data.y, maxIterations, LEARNING_RATE);
	});

	// Number of available steps (use min so both panels are always valid)
	const numStepsAda = $derived(adaHistory.models.length);
	const numStepsGB = $derived(gbHistory.stumps.length);
	const numModels = $derived(Math.min(numStepsAda, numStepsGB));

	// Clamp currentStep when model count changes
	$effect(() => {
		if (currentStep > numModels) {
			currentStep = Math.max(0, numModels);
		}
	});

	// ─── SVG projection helpers ────────────────────────
	function projX(v: number): number {
		return PAD_L + ((v - domain.xRange[0]) / (domain.xRange[1] - domain.xRange[0])) * PLOT_W;
	}
	function projY(v: number): number {
		return PAD_T + ((domain.yRange[1] - v) / (domain.yRange[1] - domain.yRange[0])) * PLOT_H;
	}

	// ─── Grid cells for AdaBoost boundary ──────────────
	interface GridCellData {
		sx: number;
		sy: number;
		pred: number;
		margin: number;
	}
	interface GridData {
		cells: GridCellData[];
		cellW: number;
		cellH: number;
	}

	const adaGridCells = $derived.by((): GridData => {
		if (currentStep < 1) return { cells: [], cellW: 0, cellH: 0 };

		const activeModels = adaHistory.models.slice(0, currentStep);
		const boundary = evaluateAdaboostBoundary(activeModels, domain.xRange, domain.yRange, GRID_RES);

		const dx = (domain.xRange[1] - domain.xRange[0]) / GRID_RES;
		const dy = (domain.yRange[1] - domain.yRange[0]) / GRID_RES;
		const cellW = projX(domain.xRange[0] + dx) - projX(domain.xRange[0]);
		const cellH = projY(domain.yRange[0]) - projY(domain.yRange[0] + dy);

		const cells: GridCellData[] = [];
		for (let iy = 0; iy < GRID_RES; iy++) {
			const sy = projY(domain.yRange[0] + (iy + 1) * dy);
			for (let ix = 0; ix < GRID_RES; ix++) {
				const sx = projX(domain.xRange[0] + ix * dx);
				const pred = boundary.predictions[iy]?.[ix] ?? 0;
				const margin = boundary.margins[iy]?.[ix] ?? 0;
				cells.push({ sx, sy, pred, margin });
			}
		}

		return { cells, cellW, cellH };
	});

	// ─── Grid cells for Gradient Boosting boundary ──────
	interface GBGridCellData {
		sx: number;
		sy: number;
		pred: number;
		value: number;
	}
	interface GBGridData {
		cells: GBGridCellData[];
		cellW: number;
		cellH: number;
	}

	const gbGridCells = $derived.by((): GBGridData => {
		if (currentStep < 1) return { cells: [], cellW: 0, cellH: 0 };

		const activeStumps = gbHistory.stumps.slice(0, currentStep);
		const F_init = data.y.reduce((a, b) => a + b, 0) / N_SAMPLES;
		const boundary = evaluateGBBoundary(
			activeStumps,
			F_init,
			LEARNING_RATE,
			domain.xRange,
			domain.yRange,
			GRID_RES
		);

		const dx = (domain.xRange[1] - domain.xRange[0]) / GRID_RES;
		const dy = (domain.yRange[1] - domain.yRange[0]) / GRID_RES;
		const cellW = projX(domain.xRange[0] + dx) - projX(domain.xRange[0]);
		const cellH = projY(domain.yRange[0]) - projY(domain.yRange[0] + dy);

		const cells: GBGridCellData[] = [];
		for (let iy = 0; iy < GRID_RES; iy++) {
			const sy = projY(domain.yRange[0] + (iy + 1) * dy);
			for (let ix = 0; ix < GRID_RES; ix++) {
				const sx = projX(domain.xRange[0] + ix * dx);
				const pred = boundary.predictions[iy]?.[ix] ?? 0;
				const value = boundary.values[iy]?.[ix] ?? 0;
				cells.push({ sx, sy, pred, value });
			}
		}

		return { cells, cellW, cellH };
	});

	// ─── Boundary edge computation helper ──────────────
	interface EdgeData {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}

	function computeBoundaryEdges<T extends { sx: number; sy: number; pred: number }>(
		cells: T[],
		cellW: number,
		cellH: number,
		res: number
	): EdgeData[] {
		if (!cells || cells.length === 0) return [];

		const edges: EdgeData[] = [];

		function getPred(ix: number, iy: number): number {
			const idx = iy * res + ix;
			return cells[idx]?.pred ?? 0;
		}

		for (let iy = 0; iy < res - 1; iy++) {
			for (let ix = 0; ix < res - 1; ix++) {
				const leftPred = getPred(ix, iy);
				const rightPred = getPred(ix + 1, iy);
				const belowPred = getPred(ix, iy + 1);

				if (leftPred !== rightPred && leftPred !== 0 && rightPred !== 0) {
					const midX = cells[iy * res + ix].sx + cellW / 2;
					edges.push({
						x1: midX,
						y1: cells[iy * res + ix].sy - 1,
						x2: midX,
						y2: cells[iy * res + ix].sy + cellH + 1
					});
				}

				if (leftPred !== belowPred && leftPred !== 0 && belowPred !== 0) {
					const midY = cells[iy * res + ix].sy + cellH / 2;
					edges.push({
						x1: cells[iy * res + ix].sx - 1,
						y1: midY,
						x2: cells[iy * res + ix].sx + cellW + 1,
						y2: midY
					});
				}
			}
		}

		return edges;
	}

	const adaEdges = $derived.by(() =>
		computeBoundaryEdges(adaGridCells.cells, adaGridCells.cellW, adaGridCells.cellH, GRID_RES)
	);
	const gbEdges = $derived.by(() =>
		computeBoundaryEdges(gbGridCells.cells, gbGridCells.cellW, gbGridCells.cellH, GRID_RES)
	);

	// ─── Projected data points (shared) ────────────────
	interface ProjPoint {
		cx: number;
		cy: number;
		label: number;
		r: number;
	}

	const projectedPoints = $derived.by((): ProjPoint[] => {
		// Use AdaBoost weights if available, otherwise uniform size
		if (adaHistory.weightsPerStep.length > 0 && currentStep < adaHistory.weightsPerStep.length) {
			const weights = adaHistory.weightsPerStep[currentStep];
			const maxW = Math.max(...weights);
			return data.X.map((x, i) => ({
				cx: projX(x[0]),
				cy: projY(x[1]),
				label: data.y[i],
				r: 2.5 + (weights[i] / maxW) * 4.5
			}));
		}
		return data.X.map((x, i) => ({
			cx: projX(x[0]),
			cy: projY(x[1]),
			label: data.y[i],
			r: 3.5
		}));
	});

	// ─── Axis ticks ────────────────────────────────────
	interface TickData {
		val: number;
		pos: number;
	}

	const xTicks = $derived.by((): TickData[] => {
		const ticks: TickData[] = [];
		for (let i = 0; i <= 4; i++) {
			const v = domain.xRange[0] + (i / 4) * (domain.xRange[1] - domain.xRange[0]);
			ticks.push({ val: v, pos: projX(v) });
		}
		return ticks;
	});

	const yTicks = $derived.by((): TickData[] => {
		const ticks: TickData[] = [];
		for (let i = 0; i <= 4; i++) {
			const v = domain.yRange[0] + (i / 4) * (domain.yRange[1] - domain.yRange[0]);
			ticks.push({ val: v, pos: projY(v) });
		}
		return ticks;
	});

	// ─── Metrics at current step ──────────────────────

	// AdaBoost metrics
	const adaCurrentError = $derived(currentStep >= 1 ? adaHistory.errors[currentStep - 1] : null);
	const adaCurrentAlpha = $derived(currentStep >= 1 ? adaHistory.alphas[currentStep - 1] : null);
	const adaCumulativeError = $derived.by(() => {
		if (currentStep < 1 || adaHistory.cumulativeErrors.length === 0) return null;
		return adaHistory.cumulativeErrors[
			Math.min(currentStep, adaHistory.cumulativeErrors.length) - 1
		];
	});

	// Gradient Boosting metrics
	const gbCurrentError = $derived.by(() => {
		if (currentStep < 1) return null;
		return gbHistory.trainingErrors[currentStep] ?? null;
	});
	const gbCurrentResidualSum = $derived.by(() => {
		if (currentStep < 1) return null;
		return gbHistory.residualSums[Math.min(currentStep, gbHistory.residualSums.length - 1)] ?? null;
	});

	// ─── Convergence chart data ──────────────────────
	// NOTE: adaHistory.cumulativeErrors[0] represents the error AFTER step 1
	// (it has no step-0 entry), while gbHistory.trainingErrors[0] represents
	// the error BEFORE any boosting (F_init only). To keep both series
	// index-aligned on a shared "step" x-axis, we prepend an explicit
	// step-0 baseline to the AdaBoost series: with zero models trained,
	// every sample is unclassified/wrong, so the baseline error is 1 (100%).
	const convergenceSeries = $derived.by(() => {
		const maxLen = Math.max(adaHistory.cumulativeErrors.length, gbHistory.trainingErrors.length);
		if (maxLen === 0) return [];

		const visibleSteps = currentStep;
		const adaValues = [1, ...adaHistory.cumulativeErrors].slice(0, visibleSteps + 1);
		const gbValues = gbHistory.trainingErrors.slice(0, visibleSteps + 1);

		return [
			{
				values: adaValues,
				color: ADABOOST_COLOR,
				label: 'AdaBoost'
			},
			{ values: gbValues, color: GB_COLOR, label: 'Gradient Boosting' }
		];
	});

	// ─── Container width for charts ────────────────────
	let containerWidth = $state(480);
	const chartWidth = $derived(Math.min(containerWidth - 60, 520));

	// ─── Current stump info (AdaBoost) ────────────────
	const adaStumpDescription = $derived.by(() => {
		if (currentStep < 1) return 'Aucune itération';
		const s = adaHistory.models[currentStep - 1].stump;
		const featureName = s.featureIdx === 0 ? 'x\u2081' : 'x\u2082';
		return `${featureName} \u2264 ${s.threshold.toFixed(2)} \u2192 classe ${s.leftValue > 0 ? '+1' : '\u22121'}`;
	});

	// ─── Controls ──────────────────────────────────────
	function stepForward() {
		if (currentStep < numModels) currentStep++;
	}

	function stepBackward() {
		if (currentStep > 0) currentStep--;
	}

	function reset() {
		currentStep = 0;
		isPlaying = false;
	}

	function togglePlay() {
		if (currentStep >= numModels) {
			currentStep = 0;
		}
		isPlaying = !isPlaying;
	}

	function regenerate() {
		dataSeed++;
	}

	function setDataset(type: DatasetType) {
		datasetType = type;
		regenerate();
	}

	// Auto-play animation loop
	$effect(() => {
		if (!isPlaying) return;

		const interval = setInterval(() => {
			if (currentStep >= numModels) {
				isPlaying = false;
			} else {
				currentStep++;
			}
		}, 800);

		return () => clearInterval(interval);
	});

	// Reset play state and step when data parameters change
	$effect(() => {
		void dataSeed;
		isPlaying = false;
		currentStep = 0;
	});

	$effect(() => {
		void maxIterations;
		if (currentStep > numModels) currentStep = Math.max(0, numModels);
	});
</script>

<Figure type="chart" bind:containerWidth>
	<div class="comparison-demo">
		<!-- Header -->
		<header class="demo-header">
			<h2>AdaBoost vs Gradient Boosting — Comparaison côte à côte</h2>
			<p>
				Observation des comportements de convergence sur le même jeu de données. Les deux méthodes
				construisent progressivement un ensemble de stumps faibles, mais avec des stratégies
				différentes : AdaBoost ajuste les poids d'échantillons tandis que Gradient Boosting suit le
				gradient du critère de perte.
			</p>
		</header>

		<!-- Dataset selector -->
		<div class="dataset-selector">
			<span class="selector-label">Jeu de données :</span>
			{#each ['moons', 'circles', 'linear'] as type}
				<Button
					variant={datasetType === type ? 'primary' : 'outline'}
					size="sm"
					onclick={() => setDataset(type as DatasetType)}
				>
					{getDatasetLabel(type as DatasetType)}
				</Button>
			{/each}
		</div>

		<!-- Side-by-side visualization panels -->
		<div class="panels-row">
			<!-- AdaBoost panel (left) -->
			<figure class="method-panel">
				<div class="panel-title ada-title">AdaBoost</div>
				<div class="plot-box">
					<svg
						viewBox={`0 0 ${SVG_W} ${SVG_H}`}
						role="img"
						aria-label="Frontière de décision AdaBoost"
					>
						<!-- Grid cells -->
						{#if adaGridCells.cells && adaGridCells.cells.length > 0}
							{#each adaGridCells.cells as cell}
								<rect
									x={cell.sx}
									y={cell.sy}
									width={adaGridCells.cellW}
									height={adaGridCells.cellH}
									fill={cell.pred === 1
										? 'rgba(59,130,246,0.18)'
										: cell.pred === -1
											? 'rgba(239,68,68,0.18)'
											: 'transparent'}
								/>
							{/each}
						{/if}

						<!-- Boundary edges -->
						{#each adaEdges as edge}
							<line
								x1={edge.x1}
								y1={edge.y1}
								x2={edge.x2}
								y2={edge.y2}
								stroke="#a78bfa"
								stroke-width="0.8"
								opacity="0.45"
							/>
						{/each}

						<!-- Data points -->
						{#each projectedPoints as p}
							<circle
								cx={p.cx}
								cy={p.cy}
								r={p.r}
								fill={p.label === 1 ? ADABOOST_COLOR : NEGATIVE_COLOR}
								stroke="rgba(255,255,255,0.5)"
								stroke-width="0.7"
								opacity="0.85"
							/>
						{/each}

						<!-- Axes -->
						<line
							x1={PAD_L}
							y1={SVG_H - PAD_B + 3}
							x2={SVG_W - PAD_R}
							y2={SVG_H - PAD_B + 3}
							stroke="var(--color-border)"
							stroke-width="0.5"
						/>
						<line
							x1={PAD_L}
							y1={PAD_T - 4}
							x2={PAD_L}
							y2={SVG_H - PAD_B + 3}
							stroke="var(--color-border)"
							stroke-width="0.5"
						/>

						<!-- X-axis tick labels -->
						{#each xTicks as tick}
							<text x={tick.pos} y={SVG_H - 4} text-anchor="middle" class="axis-label"
								>{tick.val.toFixed(1)}</text
							>
						{/each}

						<!-- Y-axis tick labels -->
						{#each yTicks as tick}
							<text x={PAD_L - 6} y={tick.pos + 3} text-anchor="end" class="axis-label"
								>{tick.val.toFixed(1)}</text
							>
						{/each}
					</svg>
				</div>

				<!-- AdaBoost metrics -->
				<div class="metrics-col">
					<div class="metric-row">
						<span class="metric-lbl">Erreur εₚ pondérée</span>
						{#if adaCurrentError !== null}
							<span
								class="metric-val"
								style:color={adaCurrentError < 0.5
									? 'var(--color-positive, #10b981)'
									: NEGATIVE_COLOR}>{(adaCurrentError * 100).toFixed(1)}%</span
							>
						{:else}
							<span class="metric-val metric-empty">–</span>
						{/if}
					</div>
					<div class="metric-row">
						<span class="metric-lbl">Poids αₚ du modèle</span>
						{#if adaCurrentAlpha !== null}
							<span class="metric-val">{adaCurrentAlpha.toFixed(4)}</span>
						{:else}
							<span class="metric-val metric-empty">–</span>
						{/if}
					</div>
					<div class="metric-row">
						<span class="metric-lbl">Erreur globale</span>
						{#if adaCumulativeError !== null}
							<span
								class="metric-val"
								style:color={adaCumulativeError === 0
									? 'var(--color-positive, #10b981)'
									: adaCumulativeError < 0.2
										? ADABOOST_COLOR
										: NEGATIVE_COLOR}>{(adaCumulativeError * 100).toFixed(1)}%</span
							>
						{:else}
							<span class="metric-val metric-empty">–</span>
						{/if}
					</div>
					<div class="metric-row stump-row">
						<span class="metric-lbl">Stump courant hₜ(x)</span>
						<span class="metric-val metric-stump">{adaStumpDescription}</span>
					</div>
				</div>
			</figure>

			<!-- Gradient Boosting panel (right) -->
			<figure class="method-panel">
				<div class="panel-title gb-title">Gradient Boosting</div>
				<div class="plot-box">
					<svg
						viewBox={`0 0 ${SVG_W} ${SVG_H}`}
						role="img"
						aria-label="Frontière de décision Gradient Boosting"
					>
						<!-- Grid cells -->
						{#if gbGridCells.cells && gbGridCells.cells.length > 0}
							{#each gbGridCells.cells as cell}
								<rect
									x={cell.sx}
									y={cell.sy}
									width={gbGridCells.cellW}
									height={gbGridCells.cellH}
									fill={cell.pred === 1
										? 'rgba(59,130,246,0.18)'
										: cell.pred === -1
											? 'rgba(239,68,68,0.18)'
											: 'transparent'}
								/>
							{/each}
						{/if}

						<!-- Boundary edges -->
						{#each gbEdges as edge}
							<line
								x1={edge.x1}
								y1={edge.y1}
								x2={edge.x2}
								y2={edge.y2}
								stroke="#a78bfa"
								stroke-width="0.8"
								opacity="0.45"
							/>
						{/each}

						<!-- Data points -->
						{#each projectedPoints as p}
							<circle
								cx={p.cx}
								cy={p.cy}
								r={p.r}
								fill={p.label === 1 ? ADABOOST_COLOR : NEGATIVE_COLOR}
								stroke="rgba(255,255,255,0.5)"
								stroke-width="0.7"
								opacity="0.85"
							/>
						{/each}

						<!-- Axes -->
						<line
							x1={PAD_L}
							y1={SVG_H - PAD_B + 3}
							x2={SVG_W - PAD_R}
							y2={SVG_H - PAD_B + 3}
							stroke="var(--color-border)"
							stroke-width="0.5"
						/>
						<line
							x1={PAD_L}
							y1={PAD_T - 4}
							x2={PAD_L}
							y2={SVG_H - PAD_B + 3}
							stroke="var(--color-border)"
							stroke-width="0.5"
						/>

						<!-- X-axis tick labels -->
						{#each xTicks as tick}
							<text x={tick.pos} y={SVG_H - 4} text-anchor="middle" class="axis-label"
								>{tick.val.toFixed(1)}</text
							>
						{/each}

						<!-- Y-axis tick labels -->
						{#each yTicks as tick}
							<text x={PAD_L - 6} y={tick.pos + 3} text-anchor="end" class="axis-label"
								>{tick.val.toFixed(1)}</text
							>
						{/each}
					</svg>
				</div>

				<!-- GB metrics -->
				<div class="metrics-col">
					<div class="metric-row">
						<span class="metric-lbl">Erreur de classification</span>
						{#if gbCurrentError !== null}
							<span
								class="metric-val"
								style:color={gbCurrentError === 0
									? 'var(--color-positive, #10b981)'
									: gbCurrentError < 0.2
										? GB_COLOR
										: NEGATIVE_COLOR}>{(gbCurrentError * 100).toFixed(1)}%</span
							>
						{:else}
							<span class="metric-val metric-empty">–</span>
						{/if}
					</div>
					<div class="metric-row">
						<span class="metric-lbl">Somme des résidus carrés</span>
						{#if gbCurrentResidualSum !== null}
							<span class="metric-val">{gbCurrentResidualSum.toFixed(2)}</span>
						{:else}
							<span class="metric-val metric-empty">–</span>
						{/if}
					</div>
					<div class="metric-row">
						<span class="metric-lbl">Taux d'apprentissage</span>
						<span class="metric-val">{LEARNING_RATE}</span>
					</div>
				</div>
			</figure>
		</div>

		<!-- Convergence chart -->
		<div class="convergence-wrap">
			<LineChart
				series={convergenceSeries}
				xLabel="Étape"
				yLabel="Erreur d'entraînement (%)"
				width={chartWidth}
				height={160}
			/>

			<!-- Legend -->
			<div class="conv-legend">
				<span><span class="swatch-line ada-swatch"></span> AdaBoost (perte exponentielle)</span>
				<span
					><span class="swatch-line gb-swatch"></span> Gradient Boosting (perte quadratique, seuil \u00e0
					0)</span
				>
			</div>

			<!-- Comparison summary -->
			{#if currentStep > 0}
				<div class="comparison-summary">
					<span
						class="summary-item ada-summary"
						style:background={adaCumulativeError !== null &&
						adaCumulativeError <= (gbCurrentError ?? Infinity)
							? 'color-mix(in srgb, #10b981 12%, transparent)'
							: ''}
					>
						AdaBoost : {(adaCumulativeError ?? -1).toFixed(1)}% {adaCumulativeError === null
							? '–'
							: adaCumulativeError < (gbCurrentError ?? Infinity)
								? '✓'
								: ''}
					</span>
					<span
						class="summary-item gb-summary"
						style:background={(gbCurrentError ?? -1) <= (adaCumulativeError ?? Infinity) &&
						gbCurrentError !== null
							? 'color-mix(in srgb, #f59e0b 12%, transparent)'
							: ''}
					>
						GB : {(gbCurrentError ?? -1).toFixed(1)}% {gbCurrentError === null
							? '–'
							: gbCurrentError < (adaCumulativeError ?? Infinity)
								? '✓'
								: ''}
					</span>
				</div>
			{/if}
		</div>

		<!-- Controls -->
		<div class="controls-panel">
			<Slider bind:value={currentStep} min={0} max={numModels} step={1} label="Étape (partagée)" />

			<div class="button-row">
				<Button variant="ghost" size="sm" onclick={reset}>⟲ Réinitialiser</Button>
				<Button
					variant="ghost"
					size="sm"
					onclick={stepBackward}
					disabled={currentStep <= 0 || numModels === 0}>← Préc.</Button
				>
				<Button variant="primary" size="sm" onclick={togglePlay} disabled={numModels === 0}>
					{isPlaying ? '⏸ Pause' : '▶ Lecture'}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onclick={stepForward}
					disabled={currentStep >= numModels || numModels === 0}>Suiv. →</Button
				>
			</div>

			<div class="sliders-row">
				<Slider bind:value={maxIterations} min={1} max={40} step={1} label="Max itérations" />
				<Slider bind:value={noiseLevel} min={0} max={0.5} step={0.01} label="Niveau de bruit" />
			</div>

			<div class="button-row">
				<Button variant="outline" size="sm" onclick={regenerate}
					>↻ Régénérer les données ({getDatasetLabel(datasetType)})</Button
				>
			</div>
		</div>

		<!-- Educational caption -->
		<p class="caption-note">
			<strong>Pédagogie :</strong> AdaBoost ajuste itérativement les poids des exemples mal classifiés,
			tandis que Gradient Boosting descend le long du gradient d'une fonction de perte. Les deux approches
			produisent des frontères de décision de plus en plus fines, mais avec des dynamiques de convergence
			différentes — particulièrement visibles sur les données bruyantes.
		</p>
	</div>
</Figure>

<style>
	.comparison-demo {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		align-items: center;
		padding: 0.25rem;
	}

	.demo-header {
		text-align: center;
	}

	.demo-header h2 {
		font-size: 1.05rem;
		margin-bottom: 0.2rem;
		color: var(--color-text);
	}

	.demo-header p {
		font-size: 0.78rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	/* ─── Dataset selector ────────────────────────────── */
	.dataset-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		font-size: 0.78rem;
	}

	.selector-label {
		color: var(--color-text-muted);
		font-weight: 500;
	}

	/* ─── Side-by-side panels ────────────────────────── */
	.panels-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		width: 100%;
	}

	.method-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.5rem;
		background: var(--color-surface-2, transparent);
		margin: 0;
	}

	.panel-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 700;
		padding: 0.15rem 0.6rem;
		border-radius: var(--radius-sm, 4px);
	}

	.ada-title {
		color: #06b6d4;
		background: color-mix(in srgb, #06b6d4 12%, transparent);
	}

	.gb-title {
		color: #f59e0b;
		background: color-mix(in srgb, #f59e0b 12%, transparent);
	}

	/* ─── Plot container: fixed aspect-ratio so the flex/grid layout
	       can never collapse the SVG's rendered height regardless of
	       what the SVG's own attributes resolve to. ── */
	.plot-box {
		width: 100%;
		aspect-ratio: 266 / 218;
	}

	.plot-box svg {
		display: block;
		width: 100%;
		height: 100%;
		user-select: none;
	}

	/* ─── Metrics columns ───────────────────────────── */
	.metrics-col {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding-top: 0.25rem;
	}

	.metric-row {
		background: var(--color-surface, transparent);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 4px);
		padding: 0.3rem 0.45rem;
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
	}

	.metric-lbl {
		font-size: 0.58rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-family: var(--font-mono, monospace);
	}

	.metric-val {
		font-family: var(--font-mono, monospace);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.1;
	}

	.metric-val.metric-empty {
		color: var(--color-text-muted);
		opacity: 0.4;
	}

	/* ─── Convergence chart area ────────────────────── */
	.convergence-wrap {
		width: 100%;
		max-width: 560px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	.conv-legend {
		display: flex;
		gap: 1rem;
		font-size: 0.72rem;
		color: var(--color-text-muted);
		flex-wrap: wrap;
		justify-content: center;
	}

	.swatch-line {
		display: inline-block;
		width: 18px;
		height: 3px;
		border-radius: 2px;
		vertical-align: middle;
		margin-right: 4px;
	}

	.ada-swatch {
		background: #06b6d4;
	}

	.gb-swatch {
		background: #f59e0b;
	}

	/* ─── Comparison summary ────────────────────────── */
	.comparison-summary {
		display: flex;
		gap: 1rem;
		font-size: 0.72rem;
		font-family: var(--font-mono, monospace);
		padding: 0.3rem 0.6rem;
		border-radius: var(--radius-sm, 4px);
		background: var(--color-surface-2, transparent);
		border: 1px solid var(--color-border);
	}

	.summary-item {
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		font-weight: 600;
	}

	.ada-summary {
		color: #06b6d4;
	}

	.gb-summary {
		color: #f59e0b;
	}

	/* ─── Controls panel ────────────────────────────── */
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}

	.button-row {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0.1rem 0;
	}

	.sliders-row {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	/* ─── Axis labels in SVGs ──────────────────────── */
	.axis-label {
		fill: var(--color-text-muted);
		font-size: 8px;
		font-family: var(--font-mono, monospace);
	}

	/* ─── Educational caption ──────────────────────── */
	.caption-note {
		text-align: center;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		padding: 0.25rem 0.5rem 0;
		font-style: italic;
	}

	/* ─── Responsive ────────────────────────────────── */
	@media (max-width: 640px) {
		.panels-row {
			grid-template-columns: 1fr;
			max-width: 320px;
		}

		.convergence-wrap {
			max-width: 95%;
		}

		.controls-panel {
			max-width: 95%;
		}

		.sliders-row {
			flex-direction: column;
		}

		.dataset-selector {
			font-size: 0.72rem;
		}

		.comparison-summary {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>
