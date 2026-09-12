<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		number?: string;
		title?: string;
		children: Snippet;
	}

	let { number, title = 'Théorème', children }: Props = $props();

	const label = $derived(number ? `${title} ${number}` : title);
</script>

<aside class="theorem-block">
	<div class="block-header">
		<span class="block-icon" aria-hidden="true">📐</span>
		<span class="block-title">{label}</span>
	</div>
	<div class="block-body">
		{@render children()}
	</div>
</aside>

<style>
	.theorem-block {
		border-left: 3px solid color-mix(in srgb, var(--color-belief) 40%, transparent);
		background: color-mix(in srgb, var(--color-belief) 6%, transparent);
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		padding: 1rem 1.25rem;
		margin-top: 1em;
		margin-bottom: 1em;
	}

	.block-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
	}

	.block-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.block-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-belief);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.block-body {
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.block-body :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
