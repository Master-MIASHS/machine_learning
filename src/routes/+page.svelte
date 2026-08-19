<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Régularisation et Optimisation</title>
</svelte:head>

<main class="home">
	<div class="hero">
		<h1>Fondations de l'Apprentissage Statistique</h1>
		<p class="tagline">Maximilien Servajean</p>
		<p></p>

		<div class="cta-wrapper">
			<a href={resolve('/intro')} class="start-course-btn">
				Commencer le cours <span class="arrow">→</span>
			</a>
		</div>
	</div>
</main>

<style>
	.home {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100dvh;
		padding: 2rem;
		gap: 2rem;
	}

	.hero {
		margin: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 600px;
		text-align: center;
		padding: 2rem;
	}

	.tagline {
		color: var(--color-belief);
		font-size: 1.125rem;
		font-style: italic;
		margin-bottom: 1rem;
	}

	.cta-wrapper {
		margin-top: 2rem;
	}

	.start-course-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-belief);
		/*background: var(--color-belief);*/
		border-radius: var(--radius-lg);
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.start-course-btn:hover {
		opacity: 0.85;
	}

	.arrow {
		font-size: 1.2em;
	}
</style>
