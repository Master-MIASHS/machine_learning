<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		number?: string;
		title?: string;
		children: Snippet;
	}

	let { number, title = 'Exemple', children }: Props = $props();

	let isOpen = $state(false);

	const label = $derived(number ? `${title} ${number}` : title);
</script>

<details class="example-block" bind:open={isOpen}>
	<summary class="block-header">
		<span class="block-icon" aria-hidden="true">📝</span>
		<span class="block-title">{label}</span>
		<span class="collapse-hint">{isOpen ? '▲' : '▼'}</span>
	</summary>
	<div class="block-body">
		{@render children()}
	</div>
</details>

<style>
	.example-block {
		border-left: 3px solid color-mix(in srgb, var(--color-neutral) 40%, transparent);
		background: color-mix(in srgb, var(--color-neutral) 4%, transparent);
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		padding: 0.75rem 1.25rem;
		margin-top: 1em;
		margin-bottom: 1em;
	}

	.block-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		list-style: none;
	}

	.block-header::-webkit-details-marker {
		display: none;
	}

	.block-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.block-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-neutral);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.collapse-hint {
		margin-left: auto;
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.block-body {
		margin-top: 0.6rem;
		padding-top: 0.6rem;
		border-top: 1px solid color-mix(in srgb, var(--color-neutral) 15%, transparent);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.block-body :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
