<script lang="ts">
	import '../app_warm.css';
	import '$lib/styles/page.css';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { page } from '$app/state';
	import { progress } from '$lib/stores/index.js';
	import { browser } from '$app/environment';

	let { children } = $props();

	let sidebarCollapsed = $state(true);

	// Track page visits
	$effect(() => {
		const path = page.url.pathname;
		if (browser) {
			progress.markVisited(path);
		}
	});
</script>

<a href="#main-content" class="skip-link">Aller au contenu principal</a>

<div class="app-shell">
	<Sidebar bind:collapsed={sidebarCollapsed} />
	<main id="main-content" class="content-area" class:sidebar-collapsed={sidebarCollapsed}>
		{@render children()}
	</main>
</div>

<style>
	.skip-link {
		position: absolute;
		top: -100%;
		left: 1rem;
		z-index: 100;
		padding: 0.5rem 1rem;
		background: var(--color-surface-2);
		color: var(--color-text);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
	}

	.skip-link:focus-visible {
		top: 1rem;
		outline: 2px solid var(--color-belief);
	}

	.content-area:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: -2px;
	}

	.app-shell {
		display: flex;
		min-height: 100dvh;
		min-height: -webkit-fill-available;
		width: 100%;
	}

	.content-area {
		flex: 1;
		min-width: 0;
		overflow-x: hidden;
		padding-left: env(safe-area-inset-left);
		padding-right: env(safe-area-inset-right);
		transition: margin-left 0.25s ease;
	}

	/* Mobile: no sidebar offset */
	@media (max-width: 767px) {
		.content-area {
			margin-left: 0;
		}
	}
</style>
