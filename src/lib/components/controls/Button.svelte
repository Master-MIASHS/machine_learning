<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'danger' | 'ghost' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		selected?: boolean;
		type?: 'button' | 'submit' | 'reset';
		width?: string;
		onclick?: () => void;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		selected = false,
		type = 'button',
		width,
		onclick,
		children
	}: Props = $props();
</script>

<button
	class="btn btn-{variant} btn-{size}"
	class:btn-selected={selected}
	{type}
	{disabled}
	{onclick}
	aria-disabled={disabled}
	aria-pressed={selected}
	style:width={width ?? null}
>
	{#if children}
		{@render children()}
	{/if}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		font-family: inherit;
		font-weight: 500;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s,
			opacity 0.15s;
		white-space: nowrap;
		text-decoration: none;
		margin-right: 0.25rem;
	}

	.btn:disabled,
	.btn[aria-disabled='true'] {
		opacity: 0.45;
		cursor: not-allowed;
		pointer-events: none;
	}

	.btn:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: 2px;
	}

	/* Sizes */
	.btn-sm {
		padding: 0.25rem 0.625rem;
		font-size: 0.8125rem;
	}
	.btn-md {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}
	.btn-lg {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}

	/* Variants */
	.btn-primary {
		background: var(--color-belief);
		color: var(--color-bg);
		border-color: var(--color-belief);
	}
	.btn-primary:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-belief) 82%, black);
		border-color: color-mix(in srgb, var(--color-belief) 82%, black);
	}

	.btn-danger {
		background: var(--color-surprise);
		color: white;
		border-color: var(--color-surprise);
	}
	.btn-danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-surprise) 82%, black);
		border-color: color-mix(in srgb, var(--color-surprise) 82%, black);
	}

	.btn-ghost {
		background: transparent;
		color: var(--color-text-muted);
		border-color: transparent;
	}
	.btn-ghost:hover:not(:disabled) {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.btn-outline {
		background: transparent;
		color: var(--color-text);
		border-color: var(--color-border);
	}
	.btn-outline:hover:not(:disabled) {
		background: var(--color-surface-2);
		border-color: var(--color-text-muted);
	}

	/* Selected state overrides all variants */
	.btn-selected {
		border-color: var(--color-belief);
		color: var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 10%, transparent);
	}

	.btn-selected:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-belief) 20%, transparent);
	}
</style>
