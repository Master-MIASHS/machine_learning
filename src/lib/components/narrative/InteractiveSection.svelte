<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		tag?: string;
		number?: string;
		title?: string;
		onInteract?: () => void;
	}

	let { children, tag, number, title, onInteract }: Props = $props();

	let hasInteracted = false;

	function handleInteraction() {
		if (hasInteracted) return;
		hasInteracted = true;
		onInteract?.();
	}

	const interactionEvents = ['pointerdown', 'click', 'input', 'change', 'keydown'] as const;
	const eventHandlers = Object.fromEntries(
		interactionEvents.map((ev) => [`on${ev}`, handleInteraction])
	);
</script>

<section class="page-interactive" {...eventHandlers}>
	{#if number && title}
		<span class="interactive-title">Démo {number} — {title}</span>
	{:else if title}
		<span class="interactive-title">Démo — {title}</span>
	{:else if tag}
		<span class="interactive-title">{tag}</span>
	{/if}
	{@render children()}
</section>

<style>
	.page-interactive {
		background: linear-gradient(to bottom, var(--color-surface), transparent);
		border: 1px solid var(--color-border);
		border-top: 3px solid var(--color-epistemic);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		position: relative;
		margin-bottom: 1em;
	}

	/* The title on the box border */
	.page-interactive :global(.interactive-title) {
		position: absolute;
		top: -12px;
		right: 20px;
		background: var(--color-epistemic);
		color: white;
		font-size: 0.7rem;
		text-transform: uppercase;
		font-weight: 700;
		padding: 2px 10px;
		border-radius: 10px;
		letter-spacing: 0.05em;
	}
</style>
