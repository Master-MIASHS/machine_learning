<script lang="ts">
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import KatexInline from '$lib/components/narrative/KatexInline.svelte';

	// ─── Types ──────────────────────────────────────────────────
	type Vec2 = [number, number];
	type Mat2 = [[number, number], [number, number]];

	// ─── The famous nearly-singular matrix ─────────────────────
	const A: Mat2 = [
		[1.98, 2.0],
		[1.0, 1.01]
	];
	const X_TRUE: Vec2 = [1, 1];

	// ─── 2x2 linear algebra (no hardcoded results — everything below
	// is computed from A and X_TRUE at load time / reactively) ────
	function matVec(M: Mat2, v: Vec2): Vec2 {
		return [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
	}
	function matMul(M: Mat2, N: Mat2): Mat2 {
		return [
			[M[0][0] * N[0][0] + M[0][1] * N[1][0], M[0][0] * N[0][1] + M[0][1] * N[1][1]],
			[M[1][0] * N[0][0] + M[1][1] * N[1][0], M[1][0] * N[0][1] + M[1][1] * N[1][1]]
		];
	}
	function transpose(M: Mat2): Mat2 {
		return [
			[M[0][0], M[1][0]],
			[M[0][1], M[1][1]]
		];
	}
	function addScaledI(M: Mat2, s: number): Mat2 {
		return [
			[M[0][0] + s, M[0][1]],
			[M[1][0], M[1][1] + s]
		];
	}
	function inv2(M: Mat2): Mat2 {
		const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
		return [
			[M[1][1] / det, -M[0][1] / det],
			[-M[1][0] / det, M[0][0] / det]
		];
	}
	// Real eigenvalues of a 2x2 matrix via trace/det (used here on the symmetric
	// AtA and AtA + lambda*I, where the discriminant is non-negative by construction).
	function eig2(M: Mat2): [number, number] {
		const tr = M[0][0] + M[1][1];
		const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
		const half = tr / 2;
		const disc = Math.max(0, half * half - det);
		const root = Math.sqrt(disc);
		return [half + root, half - root];
	}
	function norm(v: Vec2): number {
		return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	}

	// ─── Fixed quantities derived from A (computed once, A never changes) ──
	const yExact: Vec2 = matVec(A, X_TRUE); // [3.98, 2.01]
	const yRound: Vec2 = [Math.round(yExact[0]), Math.round(yExact[1])]; // [4, 2]
	const delta: Vec2 = [yRound[0] - yExact[0], yRound[1] - yExact[1]]; // [0.02, -0.01]
	const Ainv = inv2(A);
	const At = transpose(A);
	const AtA = matMul(At, A);
	const eigAtA = eig2(AtA); // AtA already computed at line 67
	const condA = Math.sqrt(eigAtA[0] / eigAtA[1]); // κ = σ_max/σ_min ≈ 49 700

	// ─── Interactive state ──────────────────────────────────────
	let noiseScale = $state(1); // 0..2 ; 1 = exactly the real y_round - y perturbation
	let lambda = $state(0); // 0..1

	// ─── Derived: perturbed y ────────────────────────────────────
	const yPerturbed = $derived<Vec2>([
		yExact[0] + noiseScale * delta[0],
		yExact[1] + noiseScale * delta[1]
	]);
	const deltaYNorm = $derived(norm([yPerturbed[0] - yExact[0], yPerturbed[1] - yExact[1]]));

	// ─── Derived: unregularized recovery (direct inverse) ─────────
	const xHatNoReg = $derived(matVec(Ainv, yPerturbed));
	const errNoReg = $derived(norm([xHatNoReg[0] - X_TRUE[0], xHatNoReg[1] - X_TRUE[1]]));
	const ampNoReg = $derived(deltaYNorm > 1e-9 ? errNoReg / deltaYNorm : 0);

	// ─── Derived: Ridge-regularized recovery ──────────────────────
	const AtALambda = $derived(addScaledI(AtA, lambda));
	const regInv = $derived(inv2(AtALambda));
	const AtY = $derived(matVec(At, yPerturbed));
	const xHatReg = $derived(matVec(regInv, AtY));
	const errReg = $derived(norm([xHatReg[0] - X_TRUE[0], xHatReg[1] - X_TRUE[1]]));
	const ampReg = $derived(deltaYNorm > 1e-9 ? errReg / deltaYNorm : 0);
	const eigAtALambda = $derived(eig2(AtALambda));
	const condAtALambda = $derived(eigAtALambda[0] / eigAtALambda[1]);

	// ─── Plot geometry (symmetric log scale so ~1 and ~400 both fit) ──
	const PLOT_SIZE = 320;
	const PAD = 42;
	const INNER = PLOT_SIZE - 2 * PAD;
	const MAX_RANGE = 420; // covers noiseScale up to 2

	function symlog(v: number): number {
		return Math.sign(v) * Math.log10(1 + Math.abs(v));
	}
	const SYMLOG_MAX = symlog(MAX_RANGE);
	const TICKS = [-400, -100, -10, -1, 0, 1, 10, 100, 400];

	function plotX(v: number): number {
		return PAD + INNER / 2 + (symlog(v) / SYMLOG_MAX) * (INNER / 2);
	}
	function plotY(v: number): number {
		return PAD + INNER / 2 - (symlog(v) / SYMLOG_MAX) * (INNER / 2);
	}

	// ─── Replay animation ("watch it explode") ───────────────────
	let animating = $state(false);
	let animFrame: number | null = null;

	function replay() {
		if (animating) return;
		animating = true;
		const startTime = performance.now();
		const duration = 1400;
		const endNoise = Math.max(noiseScale, 1);
		noiseScale = 0;

		function step(now: number) {
			const t = Math.min(1, (now - startTime) / duration);
			const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
			noiseScale = endNoise * eased;
			if (t < 1) {
				animFrame = requestAnimationFrame(step);
			} else {
				noiseScale = endNoise;
				animating = false;
				animFrame = null;
			}
		}
		animFrame = requestAnimationFrame(step);
	}

	$effect(() => {
		return () => {
			if (animFrame !== null) cancelAnimationFrame(animFrame);
		};
	});

	// ─── Formatting ───────────────────────────────────────────────
	function fmt(v: number, digits = 3): string {
		return v.toFixed(digits);
	}
	function fmtBig(v: number): string {
		if (!isFinite(v)) return '∞';
		return v.toLocaleString('fr-FR', { maximumFractionDigits: v >= 1000 || v <= -1000 ? 0 : 1 });
	}
</script>

<div class="ill-cond-demo">
	<div class="header">
		<h4 class="demo-title">Une matrice presque singulière piège votre solveur</h4>
		<p class="demo-subtitle">
			Résoudre <KatexInline formula="Ax = y" /> semble anodin — jusqu'à ce qu'une erreur d'arrondi minuscule
			sur <KatexInline formula="y" /> fasse exploser la solution retrouvée.
		</p>
	</div>

	<!-- ═══════════ Setup: matrix + vectors ═══════════ -->
	<div class="setup-row">
		<div class="setup-card">
			<div class="setup-label">A (fixe)</div>
			<div class="matrix-grid">
				<span>{A[0][0].toFixed(2)}</span><span>{A[0][1].toFixed(2)}</span>
				<span>{A[1][0].toFixed(2)}</span><span>{A[1][1].toFixed(2)}</span>
			</div>
		</div>
		<div class="setup-card">
			<div class="setup-label">x vrai</div>
			<div class="vec-display">({X_TRUE[0]}, {X_TRUE[1]})</div>
		</div>
		<div class="setup-card">
			<div class="setup-label">y = Ax (exact)</div>
			<div class="vec-display">({fmt(yExact[0], 2)}, {fmt(yExact[1], 2)})</div>
		</div>
		<div class="setup-card highlight">
			<div class="setup-label">y perturbé</div>
			<div class="vec-display">({fmt(yPerturbed[0], 3)}, {fmt(yPerturbed[1], 3)})</div>
			<div class="setup-sub">écart : {fmt(deltaYNorm, 4)}</div>
		</div>
	</div>

	<!-- ═══════════ Conditioning badges ═══════════ -->
	<div class="badge-row">
		<div class="cond-badge danger">
			<span class="cond-badge-label">Conditionnement κ(A) — valeurs singulières</span>
			<span class="cond-badge-value">{fmtBig(condA)}</span>
		</div>
		<div class="cond-badge" class:danger={condAtALambda > 10000} class:ok={condAtALambda <= 10000}>
			<span class="cond-badge-label">κ(AᵀA + λI), λ = {lambda.toFixed(2)}</span>
			<span class="cond-badge-value">{fmtBig(condAtALambda)}</span>
		</div>
	</div>

	<!-- ═══════════ Plot ═══════════ -->
	<div class="plot-wrap">
		<svg
			viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
			width="100%"
			height={PLOT_SIZE}
			role="img"
			aria-label="Position de x vrai, x estimé sans régularisation, et x estimé avec régularisation"
		>
			<rect
				x="0"
				y="0"
				width={PLOT_SIZE}
				height={PLOT_SIZE}
				rx="8"
				fill="var(--color-surface-2, transparent)"
				stroke="var(--color-border)"
			/>

			<!-- Grid -->
			{#each TICKS as tick (tick)}
				<line
					x1={plotX(tick)}
					y1={PAD}
					x2={plotX(tick)}
					y2={PAD + INNER}
					stroke="var(--color-border)"
					stroke-width="0.6"
					opacity={tick === 0 ? 0.8 : 0.3}
				/>
				<line
					x1={PAD}
					y1={plotY(tick)}
					x2={PAD + INNER}
					y2={plotY(tick)}
					stroke="var(--color-border)"
					stroke-width="0.6"
					opacity={tick === 0 ? 0.8 : 0.3}
				/>
				<text
					x={plotX(tick)}
					y={PAD + INNER + 14}
					text-anchor="middle"
					font-size="8"
					font-family="var(--font-mono)"
					fill="var(--color-text-muted)">{tick}</text
				>
				<text
					x={PAD - 6}
					y={plotY(tick) + 3}
					text-anchor="end"
					font-size="8"
					font-family="var(--font-mono)"
					fill="var(--color-text-muted)">{tick}</text
				>
			{/each}

			<!-- Safe zone around x_true -->
			<circle
				cx={plotX(X_TRUE[0])}
				cy={plotY(X_TRUE[1])}
				r="14"
				fill="var(--color-positive)"
				opacity="0.08"
			/>

			<!-- Error line: true -> no-reg -->
			<line
				x1={plotX(X_TRUE[0])}
				y1={plotY(X_TRUE[1])}
				x2={plotX(xHatNoReg[0])}
				y2={plotY(xHatNoReg[1])}
				stroke="var(--color-surprise)"
				stroke-width="1.2"
				stroke-dasharray="4,3"
				opacity="0.6"
			/>
			<!-- Error line: true -> reg -->
			<line
				x1={plotX(X_TRUE[0])}
				y1={plotY(X_TRUE[1])}
				x2={plotX(xHatReg[0])}
				y2={plotY(xHatReg[1])}
				stroke="var(--color-positive)"
				stroke-width="1.2"
				stroke-dasharray="4,3"
				opacity="0.7"
			/>

			<!-- x_true marker -->
			<circle
				cx={plotX(X_TRUE[0])}
				cy={plotY(X_TRUE[1])}
				r="5"
				fill="var(--color-text)"
				stroke="var(--color-bg)"
				stroke-width="1.5"
			/>
			<text
				x={plotX(X_TRUE[0]) + 9}
				y={plotY(X_TRUE[1]) - 8}
				font-size="9"
				font-weight="700"
				fill="var(--color-text)">x vrai</text
			>

			<!-- x_hat no-reg marker -->
			<circle
				class="pulse-point"
				class:pulsing={errNoReg > 5}
				cx={plotX(xHatNoReg[0])}
				cy={plotY(xHatNoReg[1])}
				r="6"
				fill="var(--color-surprise)"
				stroke="var(--color-bg)"
				stroke-width="1.5"
				style="transition: cx 0.15s ease, cy 0.15s ease;"
			/>

			<!-- x_hat reg marker -->
			<circle
				cx={plotX(xHatReg[0])}
				cy={plotY(xHatReg[1])}
				r="6"
				fill="var(--color-positive)"
				stroke="var(--color-bg)"
				stroke-width="1.5"
				style="transition: cx 0.15s ease, cy 0.15s ease;"
			/>
		</svg>
	</div>

	<!-- ═══════════ Controls ═══════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Perturbation</div>
			<Slider
				bind:value={noiseScale}
				min={0}
				max={2}
				step={0.02}
				label="Échelle de l'arrondi (1 = l'exemple réel)"
				unit=""
			/>
		</div>
		<div class="grp">
			<div class="gttl">Régularisation</div>
			<Slider bind:value={lambda} min={0} max={1} step={0.01} label="λ (Ridge)" unit="" />
			<button class="replay-btn" onclick={replay} disabled={animating}>
				💥 Rejouer l'explosion
			</button>
		</div>
	</SliderGrid>

	<!-- ═══════════ Results table ═══════════ -->
	<div class="results-section">
		<div class="results-label-row">
			<span></span>
			<span>Sans régularisation</span>
			<span>Avec Ridge (λ = {lambda.toFixed(2)})</span>
		</div>
		<div class="results-row">
			<span class="results-row-label">x̂</span>
			<span class="results-value danger">({fmt(xHatNoReg[0])}, {fmt(xHatNoReg[1])})</span>
			<span class="results-value ok">({fmt(xHatReg[0])}, {fmt(xHatReg[1])})</span>
		</div>
		<div class="results-row">
			<span class="results-row-label">Erreur ‖x̂ − x‖</span>
			<span class="results-value danger">{fmt(errNoReg)}</span>
			<span class="results-value ok">{fmt(errReg)}</span>
		</div>
		<div class="results-row">
			<span class="results-row-label">Facteur d'amplification</span>
			<span class="results-value danger">×{fmtBig(ampNoReg)}</span>
			<span class="results-value ok">×{fmtBig(ampReg)}</span>
		</div>
	</div>

	<!-- ═══════════ Caption ═══════════ -->
	<p class="cap">
		<strong>Une perturbation de {fmt(deltaYNorm, 4)}</strong> sur <KatexInline formula="y" /> (l'écart
		induit par un simple arrondi à l'entier le plus proche) suffit à faire exploser
		<KatexInline formula={String.raw`\hat{x} = A^{-1}y`} /> loin de la vraie solution
		<KatexInline formula="(1, 1)" />. La régularisation de Ridge ajoute <KatexInline
			formula="\lambda I"
		/> avant l'inversion, ce qui relève la plus petite valeur propre d'un chiffre proche de zéro à au
		moins <KatexInline formula="\lambda" />, stabilisant radicalement le conditionnement — et donc
		la solution — sans changer la nature du problème.
	</p>
</div>

<style>
	.ill-cond-demo {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		width: 100%;
		max-width: 720px;
		margin: 0 auto;
	}

	.demo-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.demo-subtitle {
		margin: 0.15rem 0 0;
		font-size: 0.84rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	/* ─── Setup row ─── */
	.setup-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.setup-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 0.55rem 0.4rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
	}

	.setup-card.highlight {
		border-color: var(--color-accent, #a78bfa);
		background: color-mix(in srgb, var(--color-accent, #a78bfa) 8%, transparent);
	}

	.setup-label {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.vec-display {
		font-family: var(--font-mono);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.setup-sub {
		font-size: 0.66rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
	}

	.matrix-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.15rem 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--color-text);
	}

	/* ─── Conditioning badges ─── */
	.badge-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.cond-badge {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.6rem 0.75rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
		transition:
			border-color 0.25s ease,
			background 0.25s ease;
	}

	.cond-badge.danger {
		border-color: var(--color-surprise);
		background: color-mix(in srgb, var(--color-surprise) 10%, transparent);
	}

	.cond-badge.ok {
		border-color: var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 10%, transparent);
	}

	.cond-badge-label {
		font-size: 0.66rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.cond-badge-value {
		font-family: var(--font-mono);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--color-text);
	}

	.cond-badge.danger .cond-badge-value {
		color: var(--color-surprise);
	}

	.cond-badge.ok .cond-badge-value {
		color: var(--color-positive);
	}

	/* ─── Plot ─── */
	.plot-wrap {
		display: flex;
		justify-content: center;
	}

	.pulse-point.pulsing {
		animation: pulse-glow 1.1s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 1;
			r: 6;
		}
		50% {
			opacity: 0.55;
			r: 8.5;
		}
	}

	/* ─── Controls ─── */
	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gttl {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.replay-btn {
		align-self: flex-start;
		cursor: pointer;
		padding: 0.4rem 0.85rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-bg);
		background: var(--color-surprise);
		border: none;
		border-radius: var(--radius-sm, 6px);
		transition: opacity 0.15s ease;
	}

	.replay-btn:hover:not(:disabled) {
		opacity: 0.85;
	}

	.replay-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	/* ─── Results table ─── */
	.results-section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.7rem 0.8rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2, transparent);
	}

	.results-label-row,
	.results-row {
		display: grid;
		grid-template-columns: 1.3fr 1fr 1fr;
		gap: 0.5rem;
		align-items: center;
	}

	.results-label-row span {
		font-size: 0.66rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		text-align: center;
	}

	.results-label-row span:first-child {
		text-align: left;
	}

	.results-row-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.results-value {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 700;
		text-align: center;
	}

	.results-value.danger {
		color: var(--color-surprise);
	}

	.results-value.ok {
		color: var(--color-positive);
	}

	/* ─── Caption ─── */
	.cap {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.6;
		color: var(--color-text-muted);
	}

	.cap strong {
		color: var(--color-text);
	}

	/* ─── Responsive ─── */
	@media (max-width: 620px) {
		.setup-row {
			grid-template-columns: repeat(2, 1fr);
		}
		.badge-row {
			grid-template-columns: 1fr;
		}
		.results-label-row,
		.results-row {
			grid-template-columns: 1fr 1fr 1fr;
			font-size: 0.72rem;
		}
	}
</style>
