<script lang="ts">
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import RadioGroup from '$lib/components/controls/RadioGroup.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import Dial from '$lib/components/controls/Dial.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';

	let sliderVal = $state(0.5);
	let logSliderVal = $state(1);
	let toggleChecked = $state(false);
	let dialVal = $state(50);
	let radioVal = $state('a');
</script>

<svelte:head>
	<title>Demo — Controls</title>
</svelte:head>

<PageTemplate title="Controls — Demo" subtitle="Catalogue interactif des composants de contrôle.">
	<TheorySection>
		<h2>Slider</h2>
		<div style="max-width: 400px; display: flex; flex-direction: column; gap: 1.5rem;">
			<Slider min={0} max={1} step={0.01} label="Variance σ²" unit="σ²" bind:value={sliderVal} />
			<Slider
				min={0.01}
				max={100}
				step={0.01}
				label="Échelle log"
				logarithmic
				bind:value={logSliderVal}
			/>
			<p style="font-size: 0.875rem; color: var(--color-text-muted)">
				Valeur: <code>{sliderVal.toFixed(2)}</code> — Échelle log:
				<code>{logSliderVal.toFixed(4)}</code>
			</p>
		</div>

		<h2 style="margin-top: 2rem;">Toggle</h2>
		<Toggle label="Activer l'animation" bind:checked={toggleChecked} />
		<p style="font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.5rem;">
			État: <code>{toggleChecked}</code>
		</p>

		<h2 style="margin-top: 2rem;">RadioButton</h2>
		<RadioGroup label="Option">
			<RadioButton value="a" label="Choix A" bind:groupValue={radioVal} />
			<RadioButton value="b" label="Choix B" bind:groupValue={radioVal} />
			<RadioButton value="c" label="Choix C" bind:groupValue={radioVal} />
		</RadioGroup>
		<p style="font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.5rem;">
			Sélection: <code>{radioVal}</code>
		</p>

		<h2 style="margin-top: 2rem;">Dial</h2>
		<div style="display: flex; gap: 2rem; flex-wrap: wrap;">
			<Dial min={0} max={100} label="Précision" bind:value={dialVal} />
			<Dial min={0} max={1} label="Bruit" value={0.3} precision={3} />
			<Dial min={1} max={10} label="Horizon" value={5} precision={0} />
		</div>

		<h2 style="margin-top: 2rem;">Button</h2>
		<div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
			<Button>Primaire</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="danger">Danger</Button>
			<Button size="sm">Small</Button>
			<Button size="lg">Large</Button>
			<Button disabled>Désactivé</Button>
		</div>
	</TheorySection>
</PageTemplate>
