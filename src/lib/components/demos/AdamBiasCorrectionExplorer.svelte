<script lang="ts">
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';
	import { exponentialMovingAverage, biasCorrected } from '$lib/math/adam.js';
	let beta = $state(.9); let useCorrection = $state(true); const values=Array(12).fill(1);
	const raw=$derived(exponentialMovingAverage(values,beta)); const corrected=$derived(raw.map((v,i)=>biasCorrected(v,beta,i+1)));
</script>
<div class="demo"><div class="controls"><Slider bind:value={beta} min={0} max={.999} step={.001} label="β"/><label class="toggle"><input type="checkbox" bind:checked={useCorrection}/> avec correction du biais</label></div><svg viewBox="0 0 720 220" role="img" aria-label="Correction du biais d'initialisation"><line x1="30" y1="190" x2="710" y2="190" stroke="var(--color-border)"/><line x1="30" y1="30" x2="30" y2="190" stroke="var(--color-border)"/><line x1="30" y1="30" x2="710" y2="30" stroke="var(--color-positive)" stroke-dasharray="4 4" opacity=".6"/>{#each raw as value,i}<circle cx={50+i*58} cy={190-(useCorrection?corrected[i]:value)*150} r="5" fill="var(--color-epistemic)"/><circle cx={50+i*58} cy={190-value*150} r="3" fill="var(--color-surprise)"/>{/each}</svg><p class="note">Avec m₀=0, l’EMA brute est attirée vers zéro au début. La correction divise par <KatexInline formula={'1-\\beta^t'} />.</p></div>
<style>.demo{display:grid;gap:1rem}.controls{display:flex;gap:2rem;align-items:end}.toggle{font-size:.9rem;display:flex;gap:.5rem;align-items:center}.note{color:var(--color-text-muted);font-size:.9rem}svg{width:100%;background:var(--color-surface);border-radius:var(--radius-md)}@media(max-width:650px){.controls{display:grid;grid-template-columns:1fr}}</style>
