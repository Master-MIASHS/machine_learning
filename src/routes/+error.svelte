<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="error-page">
	<div class="error-content">
		<span class="error-code">{page.status}</span>
		<h1>
			{#if page.status === 404}
				Page introuvable
			{:else if page.status === 403}
				Accès refusé
			{:else if page.status === 401}
				Non autorisé
			{:else if page.status >= 500}
				Erreur serveur
			{:else}
				Erreur
			{/if}
		</h1>
		<p>
			{#if page.error?.message}{page.error.message}{:else}Une erreur est survenue.{/if}
		</p>
		<a href="/">Retour à l'accueil</a>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		min-height: -webkit-fill-available;
		padding: 2rem;
	}

	.error-content {
		text-align: center;
		max-width: 480px;
	}

	.error-code {
		display: block;
		font-size: 6rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-surprise);
		margin-bottom: 0.5rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	p {
		color: var(--color-text-muted);
		margin: 0 0 1.5rem;
	}

	a {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md);
		background: var(--color-surface-2);
		color: var(--color-text);
		text-decoration: none;
		transition: background 0.15s ease;
	}

	a:hover {
		background: var(--color-surface-3);
		text-decoration: none;
	}
</style>
