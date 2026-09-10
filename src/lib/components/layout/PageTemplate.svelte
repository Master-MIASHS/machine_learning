<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Props as HeaderProps } from './Header.svelte';
	import Header from './Header.svelte';
	import type { PageMeta } from '$lib/navigation';

	type Props = {
		children: Snippet;
		prev?: PageMeta;
		next?: PageMeta;
	} & HeaderProps;

	let { title, authors, subtitle, children, prev, next }: Props = $props();
</script>

<article class="page-template">
	<header class="page-header">
		<Header {title} {authors} {subtitle} />
	</header>

	{@render children()}

	{#if prev || next}
		<footer class="page-nav">
			<div class="page-nav-prev">
				{#if prev}
					<a href={prev.resolvedPath} class="next-link">← <span>{prev.title}</span></a>
				{/if}
			</div>
			<div class="page-nav-next">
				{#if next}
					<a href={next.resolvedPath} class="next-link"><span>{next.title}</span> →</a>
				{/if}
			</div>
		</footer>
	{/if}
</article>

<style>
	.page-template {
		max-width: 1000px;
		margin: 0 auto;
		padding: 3rem 2rem 6rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.page-template :global(section > :global(*:first-child)) {
		margin-top: 0;
	}

	.page-header {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 1.5rem;
	}

	/* ── Navigation ── */

	.page-nav {
		border-top: 1px solid var(--color-border);
		padding-top: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.page-nav-prev,
	.page-nav-next {
		display: flex;
		align-items: center;
		min-width: 0; /* permet la troncature flex */
		flex: 1;
	}

	.page-nav-prev {
		justify-content: flex-start;
	}
	.page-nav-next {
		justify-content: flex-end;
	}
	.page-nav span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: calc(100%);
	}
	.page-nav a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-weight: 500;
		font-size: 0.9375rem;
		color: var(--color-belief);
		text-decoration: none;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.1s,
			box-shadow 0.15s;
		min-width: 0;
		max-width: 100%;
	}

	.page-nav a:hover {
		border-color: var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgb(0 0 0 / 0.08);
	}

	.page-nav a:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.page-nav a:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.page-nav span {
			max-width: 80%;
		}
	}
</style>
