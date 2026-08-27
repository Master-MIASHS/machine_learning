<script lang="ts">
	import Slider from '$lib/components/controls/Slider.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import { mulberry32 } from '$lib/math/util';

	let m = $state(50);
	// Seed fixe (déterministe) ; « Régénérer » incrémente la graine d'une unité.
	let seed = $state(42);

	const sim = $derived.by(() => {
		const rand = mulberry32(seed);
		const gauss = () => {
			let u = 0,
				v = 0;
			while (!u) u = rand();
			while (!v) v = rand();
			return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
		};

		const oob: number[] = [],
			test: number[] = [];

		const baselineError = 0.15;

		// We introduce a seed-based global shift so the baseline error itself
		// changes completely with every regeneration.
		const seedShift = gauss() * 0.04;

		for (let k = 1; k <= m; k++) {
			// Test error curve with a unique high-variance wobble per seed
			const testWobble = gauss() * (0.04 / Math.sqrt(k));
			const currentTest = baselineError + seedShift + 0.2 / Math.sqrt(k) + testWobble;
			test.push(Math.max(0.02, currentTest));

			// OOB error with high initial instability that completely alters its path
			// depending on the seed's random sequence
			const oobNoise = gauss() * (0.28 / Math.sqrt(k));
			const currentOOB = currentTest + oobNoise + 0.08 / k;
			oob.push(Math.max(0.02, currentOOB));
		}
		return { oob, test };
	});

	const finalOOB = $derived(sim.oob.at(-1)!);
	const finalTest = $derived(sim.test.at(-1)!);
	const diff = $derived(Math.abs(finalOOB - finalTest));

	const W = 520,
		H = 260;
	const pad = { t: 30, r: 16, b: 40, l: 48 };
	const pw = W - pad.l - pad.r,
		ph = H - pad.t - pad.b;

	const yMin = $derived(Math.floor(Math.min(...sim.oob, ...sim.test) * 10) / 10);
	const yMax = $derived(Math.ceil(Math.max(...sim.oob, ...sim.test) * 10) / 10);
	const sx = (v: number) => pad.l + ((v - 1) / (m - 1)) * pw;
	const sy = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * ph;

	const testPath = $derived(
		sim.test.map((v, i) => `${i ? 'L' : 'M'}${sx(i + 1).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')
	);
	const oobPath = $derived(
		sim.oob.map((v, i) => `${i ? 'L' : 'M'}${sx(i + 1).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')
	);
	const xTicks = $derived(Array.from({ length: 6 }, (_, i) => Math.round(1 + (i / 5) * (m - 1))));
	const yTicks = $derived(
		Array.from({ length: 5 }, (_, i) => +(yMin + (i / 4) * (yMax - yMin)).toFixed(2))
	);

	function regenerate() {
		// Cycle déterministe : même suite de courbes à chaque visite de la page.
		seed += 1;
	}
</script>

<div class="oob-tracker">
	<svg
		viewBox={`0 0 ${W} ${H}`}
		role="img"
		aria-label="Convergence de l'erreur OOB et de l'erreur de test avec le nombre de modèles"
	>
		<path
			d={`M${pad.l},${pad.t} L${pad.l},${H - pad.b} L${W - pad.r},${H - pad.b}`}
			fill="none"
			stroke="var(--color-border)"
		/>
		{#each yTicks as t (t)}
			<text
				x={pad.l - 6}
				y={sy(t)}
				text-anchor="end"
				dominant-baseline="middle"
				fill="var(--color-text-muted)"
				font-size="9"
				font-family="var(--font-mono)">{t.toFixed(2)}</text
			>
		{/each}
		{#each xTicks as t (t)}
			<text
				x={sx(t)}
				y={H - pad.b + 14}
				text-anchor="middle"
				fill="var(--color-text-muted)"
				font-size="9"
				font-family="var(--font-mono)">{t}</text
			>
		{/each}

		<text
			x={(pad.l + W - pad.r) / 2}
			y={H - 4}
			text-anchor="middle"
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-sans)">Modèles (k)</text
		>
		<text
			x={12}
			y={(pad.t + H - pad.b) / 2}
			text-anchor="middle"
			transform={`rotate(-90,12,${(pad.t + H - pad.b) / 2})`}
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-sans)">Erreur</text
		>

		<path d={testPath} fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
		<path
			d={oobPath}
			fill="none"
			stroke="#22c55e"
			stroke-width="2.5"
			stroke-dasharray="6 3"
			stroke-linejoin="round"
		/>

		<rect
			x={pad.l + 8}
			y={pad.t + 4}
			width="12"
			height="3"
			rx="1"
			fill="#22c55e"
			style="stroke-dasharray:6 3"
		/>
		<text
			x={pad.l + 24}
			y={pad.t + 9}
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-sans)">Erreur OOB</text
		>
		<rect x={pad.l + 108} y={pad.t + 6} width="12" height="3" rx="1" fill="#3b82f6" />
		<text
			x={pad.l + 124}
			y={pad.t + 9}
			fill="var(--color-text-muted)"
			font-size="10"
			font-family="var(--font-sans)">Erreur de test</text
		>

		<circle cx={sx(m)} cy={sy(finalOOB)} r="4" fill="#22c55e">
			<animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
		</circle>
	</svg>

	<p class="note">
		Courbes illustratives (paramétriques), pas de vrais tirages OOB — la forme
		attendue : OOB ≈ erreur de test, avec davantage de bruit.
	</p>

	<div class="controls">
		<Slider bind:value={m} min={5} max={100} step={1} label="Modèles (M)" />
		<button class="btn-regen" onclick={regenerate}>⟳ Régénérer</button>
	</div>

	<Metrics>
		<div class="cell">
			<span class="label">Erreur OOB</span>
			<span class="value" style="color:#22c55e">{finalOOB.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">Erreur de test</span>
			<span class="value" style="color:#3b82f6">{finalTest.toFixed(4)}</span>
		</div>
		<div class="cell">
			<span class="label">Différence</span>
			<span class="value">{diff.toFixed(5)}</span>
		</div>
		<div class="cell">
			<span class="label">Modèles</span>
			<span class="value">{m}</span>
		</div>
	</Metrics>
</div>

<style>
	.oob-tracker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.note {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.25rem;
	}
	.btn-regen {
		padding: 0.35rem 0.85rem;
		font-size: 0.8125rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
		cursor: pointer;
		font-family: var(--font-sans);
		white-space: nowrap;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.btn-regen:hover {
		border-color: var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 12%, transparent);
	}
	svg text {
		user-select: none;
	}
</style>
