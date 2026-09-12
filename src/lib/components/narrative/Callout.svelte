<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type: 'insight' | 'warning' | 'definition' | 'intuition' | 'summary' | 'proof' | 'note';
		title?: string;
		children?: Snippet;
	}

	let { type, title, children }: Props = $props();

	const config = {
		insight: {
			color: 'var(--color-belief)',
			bg: 'color-mix(in srgb, var(--color-belief) 8%, transparent)',
			border: 'color-mix(in srgb, var(--color-belief) 30%, transparent)',
			icon: '💡',
			defaultTitle: 'Insight'
		},
		warning: {
			color: 'var(--color-surprise)',
			bg: 'color-mix(in srgb, var(--color-surprise) 8%, transparent)',
			border: 'color-mix(in srgb, var(--color-surprise) 30%, transparent)',
			icon: '⚠️',
			defaultTitle: 'Attention'
		},
		definition: {
			color: 'var(--color-positive)',
			bg: 'color-mix(in srgb, var(--color-positive) 8%, transparent)',
			border: 'color-mix(in srgb, var(--color-positive) 30%, transparent)',
			icon: '📖',
			defaultTitle: 'Définition'
		},
		intuition: {
			color: 'var(--color-epistemic)',
			bg: 'color-mix(in srgb, var(--color-epistemic) 8%, transparent)',
			border: 'color-mix(in srgb, var(--color-epistemic) 30%, transparent)',
			icon: '🔮',
			defaultTitle: 'Intuition'
		},
		summary: {
			color: 'var(--color-epistemic)',
			bg: 'color-mix(in srgb, var(--color-epistemic) 8%, transparent)',
			border: 'color-mix(in srgb, var(--color-epistemic) 30%, transparent)',
			icon: '📌',
			defaultTitle: 'Retenir'
		},
		proof: {
			color: 'var(--color-positive)',
			bg: 'color-mix(in srgb, var(--color-positive) 6%, transparent)',
			border: 'color-mix(in srgb, var(--color-positive) 25%, transparent)',
			icon: '📝',
			defaultTitle: 'Démonstration'
		},
		note: {
			color: 'var(--color-neutral)',
			bg: 'color-mix(in srgb, var(--color-text-muted) 8%, transparent)',
			border: 'color-mix(in srgb, var(--color-text-muted) 30%, transparent)',
			icon: '📝',
			defaultTitle: 'Note'
		}
	} as const;

	const cfg = $derived(config[type]);
</script>

<aside
	class="callout callout-{type}"
	style:--callout-color={cfg.color}
	style:--callout-bg={cfg.bg}
	style:--callout-border={cfg.border}
>
	<div class="callout-header">
		<span class="callout-icon" aria-hidden="true">{cfg.icon}</span>
		<span class="callout-title">{title ?? cfg.defaultTitle}</span>
	</div>
	{#if children}
		<div class="callout-body">
			{@render children()}
		</div>
	{/if}
</aside>

<style>
	.callout {
		border-left: 3px solid var(--callout-border);
		background: var(--callout-bg);
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		padding: 1rem 1.25rem;
		margin: 0;
		margin-top: 1em;
		margin-bottom: 1em;
	}

	.callout-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.callout-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.callout-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--callout-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.callout-body {
		font-size: 0.9375rem;
		color: var(--color-text);
		line-height: 1.6;
	}

	.callout-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.callout-body :global(*) {
		margin-top: 0;
		/* force children to inherit callout colors instead of keeping their own */
		color: inherit;
	}
</style>
