<script lang="ts">
	import ContourPlot from '$lib/components/charts/ContourPlot.svelte';
	import Figure from '$lib/components/charts/Figure.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';

	let alpha = $state(1);
	let beta = $state(1);

	const domain: [[number, number], [number, number]] = [
		[-3, 3],
		[-3, 3]
	];

	const f = $derived.by(() => (x: number, y: number): number => {
		return 0.5 * (alpha * x * x + beta * y * y);
	});

	const condNum = $derived(Math.max(alpha, beta) / Math.min(alpha, beta));

	let trajectory = $state<Array<{ x: number; y: number }>>([]);
	let running = $state(false);
	let aid: number | null = null;

	function start() {
		if (running) return;
		const lr = 0.1 / Math.max(alpha, beta);
		trajectory = [{ x: 2.5, y: 2.5 }];
		let cx = 2.5,
			cy = 2.5;

		function step() {
			if (!running) return;
			cx -= lr * alpha * cx;
			cy -= lr * beta * cy;
			trajectory.push({ x: cx, y: cy });
			if (trajectory.length < 500 && (Math.abs(cx) > 1e-3 || Math.abs(cy) > 1e-3))
				aid = requestAnimationFrame(step);
			else running = false;
		}
		running = true;
		step();
	}

	function stop() {
		running = false;
		if (aid) cancelAnimationFrame(aid);
	}

	function reset() {
		stop();
		trajectory = [];
		setTimeout(() => start(), 50);
	}

	const markers = $derived.by(() => {
		if (trajectory.length === 0) return [];
		return [trajectory[trajectory.length - 1]];
	});
</script>

<div class="hess-cond">
	<Figure type="chart">
		<ContourPlot {f} {domain} width={400} height={350} numLevels={8} {markers} />
	</Figure>

	<div class="ctrls">
		<Button onclick={() => (running ? stop() : start())}
			>{running ? '⏸ Pause' : '▶ Gradient Descent'}</Button
		>
		<Button variant="outline" onclick={reset}>↺ Reset</Button>
	</div>

	<SliderGrid>
		<div class="grp">
			<div class="gttl">Valeurs propres du Hessien</div>
			<Slider bind:value={alpha} min={0.1} max={5} step={0.1} label="λ₁" />
			<Slider bind:value={beta} min={0.1} max={5} step={0.1} label="λ₂" />
		</div>
		<div class="grp">
			<div class="gttl">Conditionnement (K)</div>
			<div class="rn">{condNum.toFixed(2)}</div>
			<div class="ir">
				{condNum > 3
					? 'Convergence lente'
					: condNum > 1.5
						? 'Convergence modérée'
						: 'Convergence rapide'}
			</div>
		</div>
	</SliderGrid>

	<p class="cap">
		Une forme elliptique étirée (κ élevé) rend la descente zigzagante et lente. La régularisation
		Ridge améliore κ en augmentant uniformément les valeurs propres.
	</p>
</div>

<style>
	.hess-cond {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
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
	.ctrls {
		display: flex;
		gap: 0.5rem;
	}
	.rn {
		font-size: 1.1rem;
		font-weight: bold;
		font-family: 'SF Mono', 'Fira Code', monospace, system-ui;
	}
	.ir {
		font-size: 0.82rem;
		color: var(--color-text-muted);
		font-style: italic;
	}
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		text-align: center;
	}
</style>
