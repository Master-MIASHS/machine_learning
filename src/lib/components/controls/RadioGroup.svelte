<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		children: Snippet;
	}

	let { label, children }: Props = $props();
</script>

<!--
  role="group" (et non "radiogroup") : les RadioButton sont des boutons
  toggle (aria-pressed) nativement accessibles au clavier via Tab — un
  radiogroup exigerait des enfants role="radio" avec navigation par flèches.
-->
<div class="radio-group-row">
	<span class="radio-group-label">{label}</span>
	<div class="radio-group" role="group" aria-label={label}>
		{@render children()}
	</div>
</div>

<style>
	.radio-group-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.radio-group-label {
		min-width: 7.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.radio-group {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
</style>
