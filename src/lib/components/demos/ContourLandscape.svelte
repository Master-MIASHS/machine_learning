<script lang="ts">
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import { paraboloid, rosenbrock, saddle, semiDefSaddle } from '$lib/math/test-functions.js';
	import { findCriticalPoints } from '$lib/math/optimality.js';

	interface FuncOption {
		key: string;
		label: string;
		func: typeof paraboloid;
	}

	const funcOptions: FuncOption[] = [
		{ key: 'paraboloid', label: 'Paraboloïde (x² + 4y²)', func: paraboloid },
		{ key: 'rosenbrock', label: 'Rosenbrock ((1−x)² + 100(y−x²)²)', func: rosenbrock },
		{ key: 'saddle', label: 'Selle (x² − y²)', func: saddle },
		{ key: 'semiDefSaddle', label: 'Selle dégénéré (x² − x⁴ − y⁴)', func: semiDefSaddle }
	];

	let selectedKey = $state('paraboloid');
	let containerWidth = $state(420);

	const currentFunc = $derived(funcOptions.find((o) => o.key === selectedKey)?.func ?? paraboloid);

	const domain = $derived(
		(currentFunc.domain ?? [
			[-3, 3],
			[-3, 3]
		]) as [[number, number], [number, number]]
	);

	const aspect = $derived((domain[1][1] - domain[1][0]) / (domain[0][1] - domain[0][0]));
	const width = $derived(Math.min(containerWidth, 480));
	const height = $derived(Math.round(width * aspect));

	const criticalPoints = $derived.by(() =>
		findCriticalPoints(currentFunc.f, currentFunc.grad, domain)
	);
</script>

<div class="demo-wrap" bind:clientWidth={containerWidth}>
	<div class="controls">
		<label for="func-select">Fonction :</label>
		<select id="func-select" bind:value={selectedKey}>
			{#each funcOptions as opt}
				<option value={opt.key}>{opt.label}</option>
			{/each}
		</select>
	</div>

	<ContourPlot f={currentFunc.f} {domain} {width} {height} markers={criticalPoints} />

	{#if criticalPoints.length}
		<table class="cp-table">
			<thead>
				<tr><th>x</th><th>y</th><th>f(x,y)</th></tr>
			</thead>
			<tbody>
				{#each criticalPoints as cp, i (i)}
					<tr>
						<td>{cp.x.toFixed(2)}</td>
						<td>{cp.y.toFixed(2)}</td>
						<td>{cp.fVal.toFixed(3)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.demo-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	select {
		padding: 0.3rem 0.5rem;
		border-radius: var(--radius-sm, 4px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
		color: inherit;
	}
	.cp-table {
		width: 100%;
		max-width: 420px;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	.cp-table th,
	.cp-table td {
		padding: 0.4rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}
	.cp-table th {
		color: var(--color-text-muted);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
	}
</style>
