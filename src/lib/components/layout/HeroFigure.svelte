<!--
  HeroFigure.svelte — figure animée de la page d'accueil,
  « Les points qu'on n'a pas vus ».

  Micro-drame en boucle (~9,8 s) : les points d'un échantillon apparaissent,
  la courbe qui les MÉMORISE (l'interpolante exacte, le modèle à R_S(h) = 0,
  cf. course_sources/typst/theorie.typ — Introduction : « un classifieur qui
  mémorise S_n obtient R_n(h) = 0 mais ne généralise pas ») se trace, ratent
  le point inconnu (anneau rose), puis se lisse vers l'ajustage régularisé
  et le retrouve (anneau vert). Long temps de pause, fondu, reprise.

  Le modèle est ILLUSTRATIF (voir l'en-tête de src/lib/math/overfitting.ts) :
  la figure est une paraphrase visuelle de l'avertissement du cours sur le
  sur-apprentissage ; elle ne cite aucun théorème.

  SVG fait main, délibérément : les composants de chart (CurveChart,
  ScatterPlot) n'exposent ni tracé progressif, ni morphing de courbe, ni
  anneaux de pulsation. À remplacer par un vrai composant animé si celui-ci
  est un jour construit.

  Motif d'animation calqué sur demos/FEPGridworldDemo.svelte : un seul
  $effect piloté par une ref, une boucle requestAnimationFrame, le temps de
  frame conservé dans un var PLAIN ($state() relancerait l'effet à chaque
  frame et tuerait la boucle), un prefers-reduced-motion qui dessine une
  frame statique représentative sans démarrer de boucle, et
  cancelAnimationFrame à la destruction.
-->
<script lang="ts">
	import {
		generalizationHeroModel,
		easeInOutCubic,
		easeOutCubic,
		type GeneralizationHeroModel
	} from '$lib/math/overfitting';

	const model: GeneralizationHeroModel = generalizationHeroModel();
	const tl = model.timeline;

	// Géométrie du viewBox (unités SVG).
	const VB_W = 640;
	const VB_H = 230;
	const X0 = 30;
	const X1 = 610;
	const Y0 = 26;
	const Y1 = 196;
	const DOT_R = 3.4;
	const TEST_R = 4.5;

	const xPx = (x: number): number => X0 + x * (X1 - X0);
	const yPx = (y: number): number => Y0 + (1 - y) * (Y1 - Y0);

	// Courbe interpolée entre l'interpolante (s = 0) et l'ajustage régularisé
	// (s = 1), pré-échantillonnée sur la grille du modèle.
	const pathAt = (s: number): string =>
		model.grid
			.map((x, i) => {
				const y = model.memorizing[i] + (model.smooth[i] - model.memorizing[i]) * s;
				return `${i === 0 ? 'M' : 'L'}${xPx(x).toFixed(2)} ${yPx(y).toFixed(2)}`;
			})
			.join(' ');

	// État initial (t = 0) — sert aussi de balisage SSR / premier rendu :
	// rien n'est visible, la boucle fait tout apparaître.
	const initialPath = pathAt(0);
	const testX = xPx(model.testPoint.x);
	const testY = yPx(model.testPoint.y);
	const dropY1 = yPx(model.memorizingAtTest);

	// Refs mises à jour impérativement, frame par frame (jamais en $state).
	let group: SVGGElement | undefined = $state();
	let memCurve: SVGPathElement | undefined = $state();
	let smoothCurve: SVGPathElement | undefined = $state();
	let glowCurve: SVGPathElement | undefined = $state();
	let dropLine: SVGLineElement | undefined = $state();
	let testDot: SVGCircleElement | undefined = $state();
	let failRing: SVGCircleElement | undefined = $state();
	let okRing: SVGCircleElement | undefined = $state();
	const sampleDots: (SVGCircleElement | undefined)[] = $state([]);

	const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));
	const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

	function drawFrame(t: number): void {
		// Fondu de fin de boucle (les enfants sont à nouveau cachés à t = 0,
		// la reprise est donc sans accroc).
		const fade = 1 - easeInOutCubic(clamp01((t - tl.fadeStart) / (tl.fadeEnd - tl.fadeStart)));
		if (group) group.setAttribute('opacity', fade.toFixed(3));

		// Points de l'échantillon : apparition décalée.
		model.sample.forEach((p, i) => {
			const dot = sampleDots[i];
			if (!dot) return;
			const q = easeOutCubic(clamp01((t - (tl.pointsStart + i * tl.pointStagger)) / tl.pointDur));
			dot.setAttribute('opacity', q.toFixed(3));
			dot.setAttribute('r', (DOT_R * q).toFixed(2));
		});

		// Courbe : tracé progressif, puis morphing mémorisation -> régularisé
		// (la couleur glisse du rose « erreur » vers le bleu « croyance »).
		const draw = easeInOutCubic(clamp01((t - tl.drawStart) / (tl.drawEnd - tl.drawStart)));
		const s = easeInOutCubic(clamp01((t - tl.morphStart) / (tl.morphEnd - tl.morphStart)));
		const d = pathAt(s);
		const dash = (1 - draw).toFixed(4);
		if (memCurve) {
			memCurve.setAttribute('d', d);
			memCurve.setAttribute('stroke-dashoffset', dash);
			memCurve.setAttribute('opacity', (1 - s).toFixed(3));
		}
		if (smoothCurve) {
			smoothCurve.setAttribute('d', d);
			smoothCurve.setAttribute('stroke-dashoffset', dash);
			smoothCurve.setAttribute('opacity', s.toFixed(3));
		}
		if (glowCurve) {
			glowCurve.setAttribute('d', d);
			glowCurve.setAttribute('stroke-dashoffset', dash);
			glowCurve.setAttribute('opacity', (0.16 * s * draw).toFixed(3));
		}

		// Point inconnu + ligne de chute : l'extrémité haute suit le morphing,
		// le « toucher » du point est donc visible.
		const qT = easeOutCubic(clamp01((t - tl.testStart) / (tl.testEnd - tl.testStart)));
		if (testDot) {
			testDot.setAttribute('opacity', qT.toFixed(3));
			testDot.setAttribute('r', (TEST_R * qT).toFixed(2));
		}
		if (dropLine) {
			dropLine.setAttribute('y1', yPx(lerp(model.memorizingAtTest, model.smoothAtTest, s)).toFixed(2));
			dropLine.setAttribute('opacity', (0.8 * qT).toFixed(3));
		}

		// Un anneau rose (manqué), un anneau vert (réussi).
		updateRing(failRing, t, tl.failRingStart, tl.failRingDur);
		updateRing(okRing, t, tl.okRingStart, tl.okRingDur);
	}

	function updateRing(el: SVGCircleElement | undefined, t: number, start: number, dur: number): void {
		if (!el) return;
		const u = (t - start) / dur;
		if (u < 0 || u >= 1) {
			el.setAttribute('opacity', '0');
			return;
		}
		el.setAttribute('r', (6 + 16 * easeOutCubic(u)).toFixed(2));
		el.setAttribute('opacity', ((1 - u) * 0.9).toFixed(3));
	}

	// Var PLAIN — $state() relancerait l'effet à chaque frame et tuerait rAF.
	let animTime = 0;

	$effect(() => {
		if (!group) return;

		const reduceMotion =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		if (reduceMotion) {
			// Figée sur l'état résolu : points en place, ajustage régularisé
			// tracé, point inconnu bien prédit. Aucune boucle.
			drawFrame(8.0);
			return;
		}

		let running = true;
		let lastTs: number | null = null;
		let rafId = 0;

		function frame(ts: number): void {
			if (!running) return;
			if (lastTs === null) lastTs = ts;
			const dt = Math.min((ts - lastTs) / 1000, 0.1);
			lastTs = ts;
			animTime = (animTime + dt) % tl.loop;
			drawFrame(animTime);
			rafId = requestAnimationFrame(frame);
		}

		rafId = requestAnimationFrame(frame);

		return () => {
			running = false;
			cancelAnimationFrame(rafId);
		};
	});
</script>

<svg viewBox={`0 0 ${VB_W} ${VB_H}`} class="hero-figure" aria-hidden="true" focusable="false">
	<defs>
		<!-- La courbe interpolante peut sortir légèrement du cadre [0,1] ;
		     le clip la recadre proprement (le clip est volontairement un peu
		     plus grand que le cadre de données pour laisser passer le trait). -->
		<clipPath id="hero-figure-clip">
			<rect x={X0} y={Y0 - 12} width={X1 - X0} height={Y1 - Y0 + 24} />
		</clipPath>
	</defs>

	<g bind:this={group}>
		<g clip-path="url(#hero-figure-clip)">
			<!-- Halo de la courbe lissée (apparait avec le morphing). -->
			<path
				bind:this={glowCurve}
				pathLength={1}
				d={initialPath}
				stroke-dasharray="1"
				stroke-dashoffset="1"
				stroke="var(--color-belief)"
				stroke-width="9"
				stroke-linecap="round"
				fill="none"
				opacity="0"
			/>
			<!-- Courbe « mémorisante » (interpolante exacte) : rose = erreur. -->
			<path
				bind:this={memCurve}
				pathLength={1}
				d={initialPath}
				stroke-dasharray="1"
				stroke-dashoffset="1"
				stroke="var(--color-surprise)"
				stroke-width="2.5"
				stroke-linecap="round"
				fill="none"
			/>
			<!-- Ajustage régularisé : bleu = la croyance qui généralise. -->
			<path
				bind:this={smoothCurve}
				pathLength={1}
				d={initialPath}
				stroke-dasharray="1"
				stroke-dashoffset="1"
				stroke="var(--color-belief)"
				stroke-width="2.5"
				stroke-linecap="round"
				fill="none"
				opacity="0"
			/>
			<!-- L'échantillon : la réalité, en crème. -->
			{#each model.sample as p, i (p.x)}
				<circle
					bind:this={sampleDots[i]}
					cx={xPx(p.x)}
					cy={yPx(p.y)}
					r="0"
					fill="var(--color-evidence)"
					opacity="0"
				/>
			{/each}
		</g>

		<!-- Ligne de chute : de la prédiction au point inconnu. -->
		<line
			bind:this={dropLine}
			x1={testX}
			x2={testX}
			y1={dropY1}
			y2={testY}
			stroke="var(--color-text-muted)"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			opacity="0"
		/>
		<circle
			bind:this={failRing}
			cx={testX}
			cy={testY}
			r="6"
			fill="none"
			stroke="var(--color-surprise)"
			stroke-width="2"
			opacity="0"
		/>
		<circle
			bind:this={okRing}
			cx={testX}
			cy={testY}
			r="6"
			fill="none"
			stroke="var(--color-positive)"
			stroke-width="2"
			opacity="0"
		/>
		<!-- Le point qu'on n'a pas vu : indigo = l'agent qui prédit. -->
		<circle bind:this={testDot} cx={testX} cy={testY} r="0" fill="var(--color-agent)" opacity="0" />
	</g>
</svg>

<style>
	.hero-figure {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
