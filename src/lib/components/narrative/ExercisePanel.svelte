<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	interface Props {
		number?: string;
		title?: string;
		children: Snippet;
		solution?: Snippet;
		/** Optional snippet for rich-rendered titles (KaTeX, etc.). Falls back to `title` prop. */
		titleSnippet?: Snippet;
	}

	let { number, title = 'Exercice', children, solution, titleSnippet }: Props = $props();

	const isTeacherMode = $derived(page.url.searchParams.get('teacher') === 'true');
</script>

<aside class="exercise-block">
	<div class="block-header">
		<span class="block-icon" aria-hidden="true">✏️</span>
		<span class="block-title">
			{#if titleSnippet}
				{@render titleSnippet()}
			{:else}
				{number ? `${title} ${number}` : title}
			{/if}
		</span>
	</div>
	<div class="block-body">
		{@render children()}
	</div>

	{#if solution && isTeacherMode}
		<details class="solution-toggle">
			<summary class="solution-summary">Voir la solution ▼</summary>
			<div class="solution-body">
				{@render solution()}
			</div>
		</details>
	{/if}
</aside>

<style>
	.exercise-block {
		border-left: 3px solid color-mix(in srgb, var(--color-surprise) 30%, transparent);
		background: color-mix(in srgb, var(--color-surprise) 5%, transparent);
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
		color: var(--color-surprise);
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

	.solution-toggle {
		margin-top: 0.8rem;
		padding-top: 0.8rem;
		border-top: 1px dashed color-mix(in srgb, var(--color-surprise) 20%, transparent);
	}

	.solution-summary {
		cursor: pointer;
		list-style: none;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-surprise);
		opacity: 0.75;
		transition: opacity 0.2s ease;
	}

	.solution-summary:hover {
		opacity: 1;
	}

	.solution-summary::-webkit-details-marker {
		display: none;
	}

	.solution-body {
		margin-top: 0.6rem;
		padding: 0.75rem 1rem;
		background: color-mix(in srgb, var(--color-surprise) 8%, transparent);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.solution-body :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
