import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: '404.html' // required for SPA routing on GitHub Pages
		}),
		paths: {
			// Use BASE_PATH so local builds (dev/preview) always use '' while
			// CI sets BASE_PATH=/fep for GitHub Pages deployment.
			base: process.env.BASE_PATH ?? '/machine_learning'
		}
	}
};
