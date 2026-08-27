<script lang="ts">
	import { asset, resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Régularisation et Optimisation</title>
</svelte:head>

<main class="home">
	<div class="hero">
		<h1>Fondations de l'Apprentissage Statistique</h1>
		<!-- <p class="tagline">Maximilien Servajean</p> -->
		<p></p>

		<div class="cta-wrapper">
			<a href={resolve('/intro')} class="start-course-btn">
				Commencer le cours <span class="arrow">→</span>
			</a>
		</div>
	</div>

	<img
		src={asset('/logos/UMPV_BLACK.svg')}
		alt="Université de Montpellier Paul-Valéry"
		class="university-logo university-logo--light"
		loading="lazy"
		decoding="async"
	/>
	<img
		src={asset('/logos/UMPV_WHITE.svg')}
		alt="Université de Montpellier Paul-Valéry"
		class="university-logo university-logo--dark"
		loading="lazy"
		decoding="async"
	/>
</main>

<style>
	.home {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100dvh;
		padding: 2rem;
	}

	.hero {
		margin: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 800px;
		text-align: center;
		padding: 2rem;
	}

	/*.tagline {
		color: var(--color-belief);
		font-size: 1.125rem;
		font-style: italic;
		margin-bottom: 1rem;
	}*/

	/*.cta-wrapper {
		margin-top: 2rem;
	}*/

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

	/* Logo de l'université, ancré en bas de page :
	   - sans défilement, les marges auto de .hero poussent le logo au bas de la vue ;
	   - avec défilement, il reste à 150px sous le bloc hero. */
	.university-logo {
		display: none;
		width: auto;
		height: 6rem;
		margin-top: 150px;
		margin-bottom: 150px;
	}

	.university-logo--dark {
		display: block; /* thème sombre = valeur par défaut dans app.css */
	}

	@media (prefers-color-scheme: light) {
		.university-logo--dark {
			display: none;
		}

		.university-logo--light {
			display: block;
		}
	}
</style>
