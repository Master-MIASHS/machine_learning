<script lang="ts">
	import Slider from '$lib/components/controls/Slider.svelte';
	import { adamStep, createAdamState } from '$lib/math/adam.js';

	let iteration = $state(1);
	let beta1 = $state(0.9);
	let beta2 = $state(0.999);
	const sequence = [0.8, 0.4, -0.2, -0.6, 0.3, 0.1, -0.4, 0.2];
	const result = $derived.by(() => {
		let theta = [1];
		let state = createAdamState(1);
		let current = { mHat: [0], vHat: [0], update: [0], effectiveLearningRate: [0] };
		for (let i = 0; i < iteration; i++) {
			const next = adamStep(theta, [sequence[i % sequence.length]], state, {
				alpha: 0.1, beta1, beta2, epsilon: 1e-8
			});
			theta = next.theta; state = next.state; current = next;
		}
		return { ...current, theta, state, gradient: sequence[(iteration - 1) % sequence.length] };
	});
</script>

<div class="demo">
	<div class="controls"><Slider bind:value={iteration} min={1} max={24} step={1} label="Itération t" /><Slider bind:value={beta1} min={0} max={0.99} step={0.01} label="β₁" /><Slider bind:value={beta2} min={0.9} max={0.999} step={0.001} label="β₂" /></div>
	<table><tbody>
		<tr><th>quantité</th><th>valeur</th><th>rôle</th></tr>
		<tr><td>gₜ</td><td>{result.gradient.toFixed(4)}</td><td>gradient courant</td></tr>
		<tr><td>mₜ</td><td>{result.state.m[0].toFixed(4)}</td><td>direction mémorisée</td></tr>
		<tr><td>vₜ</td><td>{result.state.v[0].toFixed(4)}</td><td>second moment brut</td></tr>
		<tr><td>m̂ₜ</td><td>{result.mHat[0].toFixed(4)}</td><td>correction du biais</td></tr>
		<tr><td>v̂ₜ</td><td>{result.vHat[0].toFixed(4)}</td><td>correction du biais</td></tr>
		<tr><td>α eff</td><td>{result.effectiveLearningRate[0].toFixed(4)}</td><td>échelle par coordonnée</td></tr>
		<tr><td>θₜ</td><td>{result.theta[0].toFixed(4)}</td><td>paramètre après mise à jour</td></tr>
	</tbody></table>
	<p class="note">À chaque clic sur l’itération, les mêmes gradients reviennent : on peut isoler l’effet de la mémoire et de la correction initiale.</p>
</div>

<style>
	.demo { display:grid; gap:1rem; } .controls { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
	table { width:100%; border-collapse:collapse; font-size:.9rem; } th,td { padding:.45rem .6rem; border-bottom:1px solid var(--color-border); text-align:left; } th { color:var(--color-text-muted); } td:nth-child(2) { font-family:var(--font-mono); color:var(--color-belief); } .note { color:var(--color-text-muted); font-size:.9rem; }
	@media(max-width:650px){.controls{grid-template-columns:1fr;}}
</style>
