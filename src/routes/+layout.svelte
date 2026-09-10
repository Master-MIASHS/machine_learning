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

<div class="app-shell">
	<Sidebar bind:collapsed={sidebarCollapsed} />
	<main class="content-area" class:sidebar-collapsed={sidebarCollapsed}>
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		min-height: 100dvh;
		min-height: -webkit-fill-available;
		width: 100vw;
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
