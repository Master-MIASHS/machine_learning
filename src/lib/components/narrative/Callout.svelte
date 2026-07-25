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
			bg: 'rgba(6, 182, 212, 0.08)',
			border: 'rgba(6, 182, 212, 0.3)',
			icon: '💡',
			defaultTitle: 'Insight'
		},
		warning: {
			color: 'var(--color-surprise)',
			bg: 'rgba(244, 63, 94, 0.08)',
			border: 'rgba(244, 63, 94, 0.3)',
			icon: '⚠️',
			defaultTitle: 'Attention'
		},
		definition: {
			color: 'var(--color-positive)',
			bg: 'rgba(16, 185, 129, 0.08)',
			border: 'rgba(16, 185, 129, 0.3)',
			icon: '📖',
			defaultTitle: 'Définition'
		},
		intuition: {
			color: 'var(--color-epistemic)',
			bg: 'rgba(167, 139, 250, 0.08)',
			border: 'rgba(167, 139, 250, 0.3)',
			icon: '🔮',
			defaultTitle: 'Intuition'
		},
		summary: {
			color: 'var(--color-epistemic)',
			bg: 'rgba(167, 139, 250, 0.08)',
			border: 'rgba(167, 139, 250, 0.3)',
			icon: '📌',
			defaultTitle: 'Retenir'
		},
		proof: {
			color: 'var(--color-positive)',
			bg: 'rgba(16, 185, 129, 0.06)',
			border: 'rgba(16, 185, 129, 0.25)',
			icon: '📝',
			defaultTitle: 'Démonstration'
		},
		note: {
			color: 'var(--color-neutral)',
			bg: 'rgba(107, 114, 128, 0.08)',
			border: 'rgba(107, 114, 128, 0.3)',
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
