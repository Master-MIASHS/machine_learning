<script lang="ts">
	import katex from 'katex';

	interface Props {
		formula: string;
		displayMode?: boolean;
	}

	let { formula, displayMode = true }: Props = $props();

	/** Escape a plain string so it is safe to embed in HTML. */
	function escapeHtml(s: string): string {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	// katex.renderToString with trust:false produces sanitised HTML — safe for {@html}.
	const rendered = $derived.by(() => {
		try {
			return katex.renderToString(formula, {
				displayMode,
				throwOnError: false,
				trust: false
			});
		} catch {
			return `<span class="katex-error">${escapeHtml(formula)}</span>`;
		}
	});
</script>

<div class="katex-block" role="img" aria-label={formula}>
	<span aria-hidden="true">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html rendered}
	</span>
</div>

<style>
	.katex-block {
		display: flex;
		justify-content: center;
		overflow-x: auto;
	}

	.katex-block :global(.katex-error) {
		color: var(--color-surprise);
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}
</style>
