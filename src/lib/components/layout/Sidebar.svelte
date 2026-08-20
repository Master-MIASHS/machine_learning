<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { PAGES, PART_NAMES } from '$lib/navigation.js';
	import SidebarItem from './SidebarItem.svelte';
	import { progress, settings } from '$lib/stores/index.js';

	interface Props {
		collapsed?: boolean;
	}

	let { collapsed = $bindable(true) }: Props = $props();

	const parts = [1, 2, 3, 4, 5, 6, 7];
</script>

{#if collapsed}
	<button
		class="expand-btn-floating"
		onclick={() => (collapsed = false)}
		aria-label="Étendre la navigation"
		title="Étendre"
	>
		<svg
			class="hamburger-icon"
			width="30"
			height="30"
			viewBox="0 0 20 20"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M3 5h14M3 10h14M3 15h14"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		</svg>
	</button>
{/if}

<nav class="sidebar" class:collapsed aria-label="Navigation principale">
	{#if !collapsed}
		<div class="sidebar-logo">
			<a href={resolve('/')} class="logo-link">
				<span class="logo-icon">R</span>
				<span class="logo-text">Fondations de l'apprentissage statistique</span>
			</a>
			<button
				class="collapse-btn"
				onclick={() => (collapsed = true)}
				aria-label="Réduire la navigation"
				title="Réduire"
			>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
					<path
						d="M9 2L4 7l5 5"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>

		<div class="sidebar-scroll">
			<div class="sidebar-section">
				{#each PAGES.filter((p) => p.part === null && (!p.expert || $settings.expertMode)) as p (p.path)}
					<SidebarItem
						page={p}
						expert={p.expert}
						active={page.url.pathname === p.resolvedPath}
						visited={$progress.visited.has(p.resolvedPath)}
						interacted={$progress.interacted.has(p.resolvedPath)}
						onClick={() => (collapsed = true)}
					/>
				{/each}
			</div>

			{#each parts as partNum (partNum)}
				<div class="sidebar-part">
					<h2 class="part-label">{PART_NAMES[partNum]}</h2>
					<div class="part-pages">
						{#each PAGES.filter((p) => p.part === partNum && (!p.expert || $settings.expertMode)) as p (p.path)}
							<SidebarItem
								page={p}
								expert={p.expert}
								active={page.url.pathname === p.resolvedPath}
								visited={$progress.visited.has(p.resolvedPath)}
								interacted={$progress.interacted.has(p.resolvedPath)}
								onClick={() => (collapsed = true)}
							/>
						{/each}
					</div>
				</div>
			{/each}

			<div class="sidebar-footer">
				<label class="expert-toggle">
					<input
						type="checkbox"
						checked={$settings.expertMode}
						onchange={() => ($settings.expertMode = !$settings.expertMode)}
						aria-label="Mode Expert"
					/>
					<span>Mode Expert</span>
				</label>
			</div>
		</div>
	{/if}
</nav>

<style>
	.sidebar {
		position: fixed;
		padding-left: env(safe-area-inset-left);
		left: 0;
		/* Top and bottom margin spacing gaps from screen edge */
		top: 1rem;
		bottom: 1rem;
		width: var(--sidebar-width);
		background: var(--color-surface);

		/* Borders strictly applied to top, right, and bottom sides */
		border-top: 1px solid var(--color-border);
		border-right: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
		border-left: none;

		/* Rounded outer corners on the right side */
		border-top-right-radius: var(--radius-lg, 12px);
		border-bottom-right-radius: var(--radius-lg, 12px);

		display: flex;
		flex-direction: column;
		z-index: 100;
		transition:
			width 0.25s ease,
			transform 0.25s ease;
		overflow: hidden;
		box-sizing: border-box;
	}

	.sidebar.collapsed {
		transform: translateX(-100%);
	}

	/* ── Logo area — fixed, never scrolls ── */
	.sidebar-logo {
		display: flex;
		align-items: center;
		padding: 1.25rem 1rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
		gap: 0.5rem;
	}

	/* ── Standalone Floating Button Placement — Bypasses iOS overflow bugs ── */
	.expand-btn-floating {
		position: fixed;
		top: calc(1rem + env(safe-area-inset-top, 0px));
		left: calc(1rem + env(safe-area-inset-left, 0px));

		/* Forces a new stacking context so the massive ::before stays contained */
		isolation: isolate;

		/* Hardware acceleration */
		-webkit-transform: translate3d(0, 0, 999px);
		transform: translate3d(0, 0, 999px);
		z-index: 9999;

		width: 2.5rem;
		height: 2.5rem;

		display: flex;
		align-items: center;
		justify-content: center;

		padding: 0;
		border: none;
		background: none;
		color: var(--color-text);
		cursor: pointer;
	}

	.expand-btn-floating::before {
		content: '';
		position: absolute;

		width: 6rem;
		height: 6rem;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;

		/* 2. Apply the blur */
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);

		-webkit-mask: radial-gradient(
			circle,
			rgba(0, 0, 0, 1) 0%,
			rgba(0, 0, 0, 0.8) 20%,
			rgba(0, 0, 0, 0) 75%
		);
		mask: radial-gradient(
			circle,
			rgba(0, 0, 0, 1) 0%,
			rgba(0, 0, 0, 0.8) 20%,
			rgba(0, 0, 0, 0) 75%
		);

		opacity: 0.9;

		pointer-events: none;
		z-index: -1;
	}

	.hamburger-icon {
		position: relative;
		z-index: 1;
		transition: transform 0.2s ease; /* Smooth out that hover scale! */
	}

	/* Note: 5.1 is a massive scale increase, but keeping it per your original code */
	.expand-btn-floating:hover .hamburger-icon {
		transform: scale(1.1);
	}
	/* ── Scrollable area ── */
	.sidebar-scroll {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
		display: flex;
		flex-direction: column;
	}

	/* ── Logo link ── */
	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		text-decoration: none;
		color: var(--color-text);
		flex: 1;
		min-width: 0;
	}

	.logo-icon {
		width: 2rem;
		height: 2rem;
		background: var(--color-belief);
		color: var(--color-bg);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		font-family: var(--font-mono);
		flex-shrink: 0;
	}

	.logo-text {
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ── Collapse button ── */
	.collapse-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		transition: background 0.15s;
	}

	.collapse-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	/* ── Nav sections ── */
	.sidebar-section {
		padding: 0.5rem;
	}

	.sidebar-part {
		padding: 0 0.5rem 0.5rem;
	}

	.part-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		padding: 0.75rem 0.25rem 0.25rem;
		margin: 0;
	}

	.part-pages {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	/* ── Footer ── */
	.sidebar-footer {
		margin-top: auto;
		padding: 1rem;
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.expert-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		user-select: none;
	}

	.expert-toggle input {
		accent-color: var(--color-belief);
	}

	/* Mobile Overlay Adjustments */
	@media (max-width: 767px) {
		.sidebar {
			top: 0.5rem;
			bottom: 0.5rem;
			width: 280px;
			margin-top: env(safe-area-inset-top, 0px);
			margin-bottom: env(safe-area-inset-bottom, 0px);
		}

		/* Translate out of viewport cleanly instead of shrinking width */
		.sidebar.collapsed {
			transform: translateX(-100%);
			width: 280px;
		}

		.expand-btn-floating {
			top: calc(0.75rem + env(safe-area-inset-top, 0px));
			left: calc(0.75rem + env(safe-area-inset-left, 0px));
		}
	}
</style>
