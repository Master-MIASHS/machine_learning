<script lang="ts">
	/**
	 * Démo « Noyaux valides : symétrique et semi-défini positif ».
	 *
	 * Source pédagogique : Marine Demangeot, « Apprentissage supervisé et non
	 * supervisé », M1 MIASHS, CM 4 — SVM (marine/Cours/CM/coursClassif-4-SVM.tex) :
	 *  - frame « Propriétés du noyau K » : définitions de symétrique et de
	 *    semi-défini positif, théorème de Moore–Aronszajn (K symétrique et
	 *    semi-définie positive ⟹ ∃ espace de Hilbert H et application φ tels
	 *    que K(x, x̃) = ⟨φ(x), φ(x̃)⟩) ;
	 *  - remarque : matrice de Gram M_{i,j} = K(x_i, x_j) ;
	 *  - frame « Exemples de noyau » : noyaux linéaire, cosinus, quadratique,
	 *    polynomial et gaussien (les candidats « valides » ci-dessous).
	 *
	 * Test PSD sur un échantillon : la plus petite valeur propre de la matrice
	 * de Gram 6×6 (minEigenvalueSymmetric, Jacobi cyclique) doit être ≥ 0 à
	 * l'erreur numérique près. Les noyaux candidats sont définis localement.
	 * Note : K = ⟨x, x̃⟩³, qui semblerait a priori suspect, est un noyau
	 * valide — noyau polynomial homogène de degré 3, développement multinomial
	 * à coefficients positifs — il est donc groupé avec les candidats valides.
	 */
	import ScatterPlot from '$lib/components/charts/ScatterPlot.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { gramMatrix, minEigenvalueSymmetric } from '$lib/math/svm';
	import type { KernelFn } from '$lib/math/svm';
	import { mulberry32, combineSeed } from '$lib/math/util';

	type KernelKey =
		'lineaire' | 'quadratique' | 'polynomial' | 'gaussien' | 'cosinus' | 'negatif' | 'cube';

	const N = 6;
	const SIZE = 300;
	const DOMAIN = 2.5;
	const PAD = 4; // synchronisé avec le pad interne de ScatterPlot

	const SUBS = ['₁', '₂', '₃', '₄', '₅', '₆'];

	const VALID_KEYS: KernelKey[] = [
		'lineaire',
		'quadratique',
		'polynomial',
		'gaussien',
		'cosinus',
		'cube'
	];
	const INVALID_KEYS: KernelKey[] = ['negatif'];

	const KernelNames: Record<KernelKey, string> = {
		lineaire: 'linéaire',
		quadratique: 'quadratique',
		polynomial: 'polynomial',
		gaussien: 'gaussien',
		cosinus: 'cosinus',
		negatif: 'négatif',
		cube: 'cube'
	};

	const KernelFormulas: Record<KernelKey, string> = {
		lineaire: 'K = ⟨x, x̃⟩',
		quadratique: 'K = (⟨x, x̃⟩ + 1)²',
		polynomial: 'K = (⟨x, x̃⟩ + 0,5)³',
		gaussien: 'K = exp(−½‖x − x̃‖²)',
		cosinus: 'K = ⟨x, x̃⟩ / (‖x‖ · ‖x̃‖)',
		negatif: 'K = −⟨x, x̃⟩',
		cube: 'K = ⟨x, x̃⟩³'
	};

	let kernelKey = $state<KernelKey>('lineaire');
	let seed = $state(7);

	// Six points d'échantillonnage déterministes dans [−2, 2]² (un PRNG par
	// coordonnée, seeds décorrélées par combineSeed).
	const points = $derived.by((): [number, number][] => {
		const r1 = mulberry32(combineSeed(seed, 1));
		const r2 = mulberry32(combineSeed(seed, 2));
		const pts: [number, number][] = [];
		for (let i = 0; i < N; i++) pts.push([2 * r1() - 2, 2 * r2() - 2]);
		return pts;
	});

	const dot = (a: number[], b: number[]): number => a[0] * b[0] + a[1] * b[1];
	const nrm = (a: number[]): number => Math.hypot(a[0], a[1]);

	// Noyaux candidats (définitions locales, exactes).
	const Kernels: Record<KernelKey, KernelFn> = {
		lineaire: (a, b) => dot(a, b),
		quadratique: (a, b) => Math.pow(dot(a, b) + 1, 2),
		polynomial: (a, b) => Math.pow(dot(a, b) + 0.5, 3),
		gaussien: (a, b) => {
			const dx = a[0] - b[0];
			const dy = a[1] - b[1];
			return Math.exp(-0.5 * (dx * dx + dy * dy));
		},
		cosinus: (a, b) => {
			const na = nrm(a);
			const nb = nrm(b);
			if (na < 1e-12 || nb < 1e-12) return 1; // garde : point à l'origine
			return dot(a, b) / (na * nb);
		},
		negatif: (a, b) => -dot(a, b),
		cube: (a, b) => Math.pow(dot(a, b), 3)
	};

	const K = $derived(Kernels[kernelKey]);
	const M = $derived(gramMatrix(points, K));
	const minEv = $derived(minEigenvalueSymmetric(M));
	const valid = $derived(minEv >= -1e-8);

	// 3 chiffres significatifs ; exponentielle pour les valeurs très petites
	// ou très grandes.
	function fmtEigen(v: number): string {
		if (!Number.isFinite(v)) return '—';
		const a = Math.abs(v);
		if (a < 0.01 || a >= 1000) return v.toExponential(2);
		return v.toFixed(3);
	}

	// Projection miroir de ScatterPlot (pad = 4).
	function projectX(x: number): number {
		return PAD + ((x + DOMAIN) / (2 * DOMAIN)) * (SIZE - 2 * PAD);
	}
	function projectY(y: number): number {
		return PAD + ((DOMAIN - y) / (2 * DOMAIN)) * (SIZE - 2 * PAD);
	}

	const plotPoints = $derived(points.map(([x, y]) => ({ x, y })));
	const pointLabels = $derived(
		points.map(([x, y], i) => ({ x: projectX(x) + 8, y: projectY(y) + 4, t: `x${SUBS[i]}` }))
	);
</script>

<div class="kpsd-demo">
	<div class="kpsd-grid">
		<div class="panel">
			<div class="panel-ttl">Points d'échantillonnage (ℝ²)</div>
			<ScatterPlot
				points={plotPoints}
				domainX={[-DOMAIN, DOMAIN]}
				domainY={[-DOMAIN, DOMAIN]}
				width={SIZE}
				height={SIZE}
				defaultColor="var(--color-text-muted)"
				defaultSize={5}
				showAxes={true}
				showLabels={true}
			>
				{#snippet snippetOverlay()}
					<!-- Index des points, synchronisés avec la matrice de Gram -->
					{#each pointLabels as l}
						<text x={l.x} y={l.y} class="pt-label">{l.t}</text>
					{/each}
				{/snippet}
			</ScatterPlot>
		</div>

		<div class="side-panel">
			<div class="readout">
				<div class="row">
					<span class="k">Noyau sélectionné</span>
					<span class="v">{KernelFormulas[kernelKey]}</span>
				</div>
				<div class="row">
					<span class="k">valeur propre minimale de la matrice de Gram</span>
					<span class="v">{fmtEigen(minEv)}</span>
				</div>
			</div>

			<div class="verdict" class:ok={valid}>
				{#if valid}
					K symétrique et semi-définie positive : il existe un espace de Hilbert H et une
					application φ tels que K(x, x̃) = ⟨φ(x), φ(x̃)⟩ (théorème de Moore–Aronszajn).
				{:else}
					La plus petite valeur propre de la matrice de Gram est négative : K n'est PAS semi-définie
					positive, il n'existe donc pas d'application φ — ce n'est pas un noyau.
				{/if}
			</div>

			<div class="gram-wrap">
				<div class="panel-ttl">Matrice de Gram M&#123;i,j&#125; = K(x_i, x_j)</div>
				<table class="gram" aria-label="Matrice de Gram">
					<thead>
						<tr>
							<th class="corner"></th>
							{#each SUBS as s}
								<th>x{s}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each M as row, i}
							<tr>
								<th>x{SUBS[i]}</th>
								{#each row as v}
									<td>{v.toFixed(2)}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="kgroups">
				<div class="grp">
					<div class="gttl">Candidats valides</div>
					<div class="kbtns">
						{#each VALID_KEYS as k}
							<Button
								variant="outline"
								size="sm"
								selected={kernelKey === k}
								onclick={() => (kernelKey = k)}>{KernelNames[k]}</Button
							>
						{/each}
					</div>
				</div>
				<div class="grp">
					<div class="gttl">Non valides</div>
					<div class="kbtns">
						{#each INVALID_KEYS as k}
							<Button
								variant="outline"
								size="sm"
								selected={kernelKey === k}
								onclick={() => (kernelKey = k)}>{KernelNames[k]}</Button
							>
						{/each}
					</div>
				</div>
			</div>

			<div class="presets">
				<Button variant="primary" size="sm" onclick={() => (seed += 1)}>Nouveaux points</Button>
			</div>
		</div>
	</div>

	<p class="cap">
		Pour que K puisse s'écrire K(x, x̃) = ⟨φ(x), φ(x̃)⟩, il faut que K soit symétrique et semi-définie
		positive (théorème de Moore–Aronszajn, diapos CM 4), c'est-à-dire que toute matrice de Gram
		M&#123;i,j&#125; = K(x_i, x_j) ait ses valeurs propres ≥ 0 — c'est le test affiché sur 6 points
		tirés au hasard. K = −⟨x, x̃⟩ échoue toujours : elle inverse le signe de toutes les valeurs
		propres. Contre-intuitivement, K = ⟨x, x̃⟩³ est un noyau valide — c'est le noyau polynomial
		homogène de degré 3, dont le développement multinomial n'a que des coefficients positifs — et la
		démo le confirme.
	</p>
</div>

<style>
	.kpsd-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.kpsd-grid {
		display: grid;
		grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}

	@media (max-width: 800px) {
		.kpsd-grid {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.panel-ttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.readout {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface-2);
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.8125rem;
	}

	.row .k {
		color: var(--color-text-muted);
	}

	.row .v {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--color-text);
		text-align: right;
	}

	.verdict {
		padding: 0.6rem 0.9rem;
		border-radius: 6px;
		font-size: 0.82rem;
		line-height: 1.55;
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-border);
		color: var(--color-text-muted);
	}

	.verdict.ok {
		border-left-color: var(--color-positive);
		color: var(--color-text);
	}

	.verdict:not(.ok) {
		border-left-color: var(--color-neutral);
		color: var(--color-text);
	}

	.gram-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gram {
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	.gram th,
	.gram td {
		border: 1px solid var(--color-border);
		padding: 0.25rem 0.5rem;
	}

	.gram thead th {
		text-align: center;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.gram tbody th {
		text-align: right;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.gram td {
		text-align: right;
		color: var(--color-text);
	}

	.gram .corner {
		border: none;
	}

	.kgroups {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.gttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.kbtns {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.pt-label {
		fill: var(--color-text);
		font-size: 11px;
		font-family: var(--font-sans);
	}

	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}
</style>
