<script lang="ts">
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/stores/index.js';

	interface Props {
		title?: string;
		children?: Snippet;
	}

	let { title = 'Mode Expert', children }: Props = $props();
</script>

<section class="page-expert">
	{#if $settings.expertMode}
		<aside class="expert-panel">
			<div class="expert-header">
				<span class="expert-badge">Expert</span>
				{#if title !== 'Mode Expert'}
					<span class="expert-title">{title}</span>
				{/if}
			</div>
			{#if children}
				<div class="expert-body">
					{@render children()}
				</div>
			{/if}
		</aside>
	{/if}
</section>

<style>
	.expert-panel {
		border: 1px solid rgba(167, 139, 250, 0.3);
		background: rgba(167, 139, 250, 0.06);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.expert-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: 0.875rem;
	}

	.expert-badge {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-epistemic);
		background: rgba(167, 139, 250, 0.15);
		border: 1px solid rgba(167, 139, 250, 0.3);
		border-radius: var(--radius-sm);
		padding: 0.125rem 0.375rem;
	}

	.expert-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-epistemic);
	}

	.expert-body {
		font-size: 0.9375rem;
		color: var(--color-text);
		line-height: 1.7;
	}

	.expert-body :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
