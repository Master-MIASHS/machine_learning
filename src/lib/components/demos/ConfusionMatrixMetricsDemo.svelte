<script lang="ts">
	import Slider from '$lib/components/controls/Slider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import SliderGrid from '$lib/components/layout/SliderGrid.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import {
		confusionFromRates,
		accuracy,
		precision,
		recall,
		specificity,
		f1,
		type BinaryConfusion
	} from '$lib/math/metrics';

	// Defaults: 10 % de positifs (données déséquilibrées, comme la plupart des
	// vrais cas de classification) et un modèle bon mais imparfait.
	const DEFAULTS: { nPos: number; nNeg: number; sens: number; spec: number } = {
		nPos: 50,
		nNeg: 450,
		sens: 0.9,
		spec: 0.9
	};

	let nPos = $state(DEFAULTS.nPos);
	let nNeg = $state(DEFAULTS.nNeg);
	let sens = $state(DEFAULTS.sens);
	let spec = $state(DEFAULTS.spec);

	const cm = $derived(confusionFromRates(nPos, nNeg, sens, spec));
	const positiveRate = $derived(nPos / (nPos + nNeg));

	// La matrice affichée est la source de vérité : les métriques sont calculées
	// sur les effectifs (arrondis), pas sur les taux des curseurs — un taux au
	// dixième et une petite classe peuvent donc donner p. ex. 9/10 au lieu de 0.93.
	// La précision (TP+FP) et le F1 (2TP+FP+FN) peuvent avoir un dénominateur nul
	// (préréglage « toujours négatif » → TP = FP = 0) : les fonctions de
	// metrics.ts lèvent alors une erreur par contrat, et l'interface affiche « — ».
	const metrics = $derived.by(() => {
		const safe = (fn: (m: BinaryConfusion) => number, defined: boolean): number | null =>
			defined ? fn(cm) : null;
		return {
			accuracy: accuracy(cm),
			precision: safe(precision, cm.tp + cm.fp > 0),
			recall: safe(recall, cm.tp + cm.fn > 0),
			specificity: safe(specificity, cm.tn + cm.fp > 0),
			f1: safe(f1, 2 * cm.tp + cm.fp + cm.fn > 0)
		};
	});

	const pct = (v: number | null): string => (v === null ? '—' : `${(v * 100).toFixed(1)} %`);

	function reset(): void {
		nPos = DEFAULTS.nPos;
		nNeg = DEFAULTS.nNeg;
		sens = DEFAULTS.sens;
		spec = DEFAULTS.spec;
	}

	// « Il est facile d'avoir une bonne sensibilité en prédisant que tous les
	// exemples sont positifs » (slide) — sensibilité 1, spécificité 0.
	function allPositive(): void {
		sens = 1;
		spec = 0;
	}

	// « Il est facile d'avoir une bonne spécificité en prédisant que tous les
	// exemples sont négatifs » (slide) — sensibilité 0, spécificité 1.
	function allNegative(): void {
		sens = 0;
		spec = 1;
	}
</script>

<div class="cm-demo">
	<!-- ════════════════ Metrics panel ═══════════════ -->
	<Metrics align="center">
		<div class="cell">
			<span class="label">Accuracy</span>
			<span class="value">{pct(metrics.accuracy)}</span>
		</div>
		<div class="cell">
			<span class="label">Précision</span>
			<span class="value">{pct(metrics.precision)}</span>
		</div>
		<div class="cell">
			<span class="label">Sensibilité</span>
			<span class="value">{pct(metrics.recall)}</span>
		</div>
		<div class="cell">
			<span class="label">F1-score</span>
			<span class="value">{pct(metrics.f1)}</span>
		</div>
		<div class="cell">
			<span class="label">Spécificité</span>
			<span class="value">{pct(metrics.specificity)}</span>
		</div>
	</Metrics>

	<!-- ════════════════ Confusion matrix ═══════════════ -->
	<!--
		Tableau 2×2 fait main (fallback, pas HeatmapGrid) : le layout de la slide
		nécessite les en-têtes de lignes/colonnes (prédite / réelle) et les étiquettes
		TN/FP/FN/TP, que HeatmapGrid n'expose pas.
	-->
	<div class="matrix-wrap">
		<table class="cm-table">
			<caption class="sr-only">
				Matrice de confusion : classe prédite en lignes, classe réelle en colonnes
			</caption>
			<thead>
				<tr>
					<th class="corner" scope="col"><span class="sr-only">Classe prédite</span></th>
					<th scope="col">Réel 0</th>
					<th scope="col">Réel 1</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row">Prédit 0</th>
					<td class="ok">
						<span class="tag">TN</span>
						<span class="count">{cm.tn}</span>
					</td>
					<td class="err">
						<span class="tag">FN</span>
						<span class="count">{cm.fn}</span>
					</td>
				</tr>
				<tr>
					<th scope="row">Prédit 1</th>
					<td class="err">
						<span class="tag">FP</span>
						<span class="count">{cm.fp}</span>
					</td>
					<td class="ok">
						<span class="tag">TP</span>
						<span class="count">{cm.tp}</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- ════════════════ Presets ═══════════════ -->
	<div class="presets">
		<Button variant="outline" size="sm" onclick={reset}>Réinitialiser</Button>
		<Button variant="outline" size="sm" onclick={allPositive}>Prédire toujours positif</Button>
		<Button variant="outline" size="sm" onclick={allNegative}>Prédire toujours négatif</Button>
	</div>

	<!-- ════════════════ Controls ═══════════════ -->
	<SliderGrid variant="outline">
		<div class="grp">
			<div class="gttl">Classes</div>
			<Slider bind:value={nPos} min={1} max={500} step={1} label="Positifs" />
			<Slider bind:value={nNeg} min={1} max={500} step={1} label="Négatifs" />
		</div>
		<div class="grp">
			<div class="gttl">Taux du modèle</div>
			<Slider bind:value={sens} min={0} max={1} step={0.01} label="Sensibilité" />
			<Slider bind:value={spec} min={0} max={1} step={0.01} label="Spécificité" />
		</div>
	</SliderGrid>

	<!-- ════════════════ Caption ═══════════════ -->
	<p class="cap">
		La matrice croise la classe prédite (lignes) avec la classe réelle (colonnes) : TN et TP
		comptent les exemples bien classés, FP et FN les erreurs. Les effectifs sont arrondis au plus
		proche — d'où de légères différences possibles avec les taux des curseurs. Avec des classes
		déséquilibrées (ici {(positiveRate * 100).toFixed(1)} % de positifs), « prédire toujours positif » donne une sensibilité
		parfaite mais une accuracy de {(positiveRate * 100).toFixed(1)} % : c'est le piège de l'accuracy sur données
		déséquilibrées, signalé dans le cours. « Prédire toujours négatif » inverse le problème :
		spécificité parfaite, mais précision indéfinie (aucun positif n'est prédit, d'où le « — »).
	</p>
</div>

<style>
	.cm-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	/* ── Confusion matrix ─────────── */
	.matrix-wrap {
		display: flex;
		justify-content: center;
	}

	.cm-table {
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}

	.cm-table th,
	.cm-table td {
		border: 1px solid var(--color-border);
		padding: 0.5rem 1.25rem;
		min-width: 5rem;
		text-align: center;
	}

	.cm-table thead th,
	.cm-table tbody th {
		color: var(--color-text-muted);
		font-weight: 600;
		background: var(--color-surface-2);
	}

	.cm-table .corner {
		border: none;
		background: none;
	}

	.cm-table td.ok {
		background: color-mix(in srgb, var(--color-positive) 16%, transparent);
	}

	.cm-table td.err {
		background: color-mix(in srgb, var(--color-surprise) 16%, transparent);
	}

	.cm-table .tag {
		display: block;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.cm-table .count {
		display: block;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
	}

	/* ── Presets ─────────── */
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* ── Slider group styling ─────────── */
	.grp {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gttl {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	/* ── Caption ─────────── */
	.cap {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: justify;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
