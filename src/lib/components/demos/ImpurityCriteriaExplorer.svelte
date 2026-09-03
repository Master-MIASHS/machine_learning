<script lang="ts">
	import Figure from '$lib/components/charts/Figure.svelte';
	import Metrics from '$lib/components/layout/Metrics.svelte';
	import Slider from '$lib/components/controls/Slider.svelte';
	import RadioButton from '$lib/components/controls/RadioButton.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { impurityOf, type ImpurityCriterion } from '$lib/math/random-forest';
	import { findBestSplit1D, generateTwoBlobsDataset } from '$lib/math/tree-utils';

	const CRITERIA: { key: ImpurityCriterion; label: string }[] = [
		{ key: 'gini', label: 'Gini' },
		{ key: 'entropy', label: 'Entropie' },
		{ key: 'misclassification', label: 'Erreur classif.' }
	];

	const SVG_W = 460;
	const SVG_H = 360;
	const PAD = { top: 20, right: 20, bottom: 35, left: 40 };
	const PLOT_W = SVG_W - PAD.left - PAD.right;
	const PLOT_H = SVG_H - PAD.top - PAD.bottom;
	const DATA_MIN = -2.5;
	const DATA_MAX = 2.5;

	function projX(v: number): number {
		return PAD.left + ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_W;
	}
	function projY(v: number): number {
		return SVG_H - PAD.bottom - ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * PLOT_H;
	}

	// ── State ──────────────────────────────────────────────────────────
	let seed = $state(0);
	let feature = $state(0); // 0 = x₁, 1 = x₂
	let threshold = $state(0.0);
	let activeCriterion = $state<ImpurityCriterion>('gini');

	const data = $derived(generateTwoBlobsDataset(seed * 7919 + 42, 80));
	const n = $derived(data.y.length);

	const leftLabels = $derived.by(() =>
		data.X.filter((r) => r[feature] <= threshold).map((_, i) => data.y[i])
	);
	const rightLabels = $derived.by(() =>
		data.X.filter((r) => r[feature] > threshold).map((_, i) => data.y[i])
	);
	const nLeft = $derived(leftLabels.length);
	const nRight = $derived(rightLabels.length);

	const isHorizontalSplit = $derived(feature === 1);
	const splitLabel = $derived(feature === 0 ? 'x₁' : 'x₂');
	// Threshold-independent: only recomputes when feature/criterion/dataset changes.
	const bestThresholds = $derived.by(() => {
		const col = data.X.map((r) => r[feature]);
		return Object.fromEntries(
			CRITERIA.map((c) => {
				const best = findBestSplit1D(col, data.y, c.key, 1);
				return [c.key, best ? best.threshold : null];
			})
		) as Record<ImpurityCriterion, number | null>;
	});

	// Threshold-dependent display stats, now just reads bestThresholds instead of recomputing it.
	const critStats = $derived.by(() => {
		return CRITERIA.map((c) => {
			const parent = impurityOf(data.y, c.key);
			const weightedChild =
				(nLeft * impurityOf(leftLabels, c.key) + nRight * impurityOf(rightLabels, c.key)) / n;
			return {
				key: c.key,
				label: c.label,
				parent,
				weightedChild,
				gain: parent - weightedChild,
				bestThreshold: bestThresholds[c.key]
			};
		});
	});

	const activeStat = $derived(critStats.find((s) => s.key === activeCriterion)!);
	$effect(() => {
		const bt = bestThresholds[activeCriterion];
		if (bt !== null) threshold = bt;
	});

	function applyBestThreshold() {
		const bt = bestThresholds[activeCriterion];
		if (bt !== null) threshold = bt;
	}
	function newDataset() {
		seed += 1;
		threshold = 0;
	}
</script>

<div class="demo-wrap">
	<div class="header">
		<h2>Gain d'information et critères d'impureté</h2>
		<p class="subtitle">
			Une seule coupure, une seule variable. Déplacez le seuil et comparez les trois critères
			d'impureté : tous mesurent à quel point la région est « polluée », et le gain d'information
			est l'impureté du parent moins l'impureté pondérée des enfants.
		</p>
	</div>

	<Figure type="chart" style="width: 100%">
		<svg
			viewBox={`0 0 ${SVG_W} ${SVG_H}`}
			class="scatter-svg"
			role="img"
			aria-label="Nuage de points et ligne de séparation de la coupure en cours"
		>
			<g class="grid">
				{#each Array.from({ length: 6 }, (_, i) => DATA_MIN + (i / 5) * (DATA_MAX - DATA_MIN)) as tick}
					<line x1={projX(tick)} y1={PAD.top} x2={projX(tick)} y2={SVG_H - PAD.bottom} />
					<line x1={PAD.left} y1={projY(tick)} x2={SVG_W - PAD.right} y2={projY(tick)} />
				{/each}
			</g>

			{#if isHorizontalSplit}
				<rect
					x={PAD.left}
					y={PAD.top}
					width={PLOT_W}
					height={Math.max(0, projY(threshold) - PAD.top)}
					class="region region-left"
				/>
				<rect
					x={PAD.left}
					y={projY(threshold)}
					width={PLOT_W}
					height={Math.max(0, PAD.top - projY(threshold) + PLOT_H)}
					class="region region-right"
				/>
				<line
					x1={PAD.left}
					y1={projY(threshold)}
					x2={SVG_W - PAD.right}
					y2={projY(threshold)}
					class="boundary"
				/>
			{:else}
				<rect
					x={PAD.left}
					y={PAD.top}
					width={Math.max(0, projX(threshold) - PAD.left)}
					height={PLOT_H}
					class="region region-left"
				/>
				<rect
					x={projX(threshold)}
					y={PAD.top}
					width={Math.max(0, SVG_W - PAD.right - projX(threshold))}
					height={PLOT_H}
					class="region region-right"
				/>
				<line
					x1={projX(threshold)}
					y1={PAD.top}
					x2={projX(threshold)}
					y2={SVG_H - PAD.bottom}
					class="boundary"
				/>
			{/if}

			{#each data.X as point, i}
				<circle
					cx={projX(point[0])}
					cy={projY(point[1])}
					r={3.5}
					class="dot"
					class:is-class-0={data.y[i] === 0}
					class:is-class-1={data.y[i] === 1}
				/>
			{/each}

			<text x={SVG_W / 2} y={SVG_H - 4} class="axis-label" text-anchor="middle">x₁</text>
			<text
				x={12}
				y={SVG_H / 2}
				class="axis-label"
				text-anchor="middle"
				transform={`rotate(-90, 12, ${SVG_H / 2})`}>x₂</text
			>

			<g transform={`translate(${SVG_W / 2}, ${PAD.top - 4})`}>
				<rect x="-95" y="-10" width="190" height="20" rx="4" class="badge-bg" />
				<text x="0" y="3" text-anchor="middle" class="badge-text"
					>split : {splitLabel} ≤ {threshold.toFixed(2)}</text
				>
			</g>
		</svg>

		{#snippet caption()}
			{splitLabel} ≤ {threshold.toFixed(2)} | {nLeft} points à gauche, {nRight} à droite | données binaires
			(2 classes) — les formules du cours sont générales à C classes
		{/snippet}
	</Figure>

	<!-- Criterion cards: all three simultaneously, active one highlighted -->
	<div class="crit-grid">
		{#each critStats as s (s.key)}
			<div class="crit-card" class:active={s.key === activeCriterion}>
				<span class="crit-name">{s.label}</span>
				<div class="crit-rows">
					<div class="crit-row">
						<span class="k">parent</span>
						<span class="v">{s.parent.toFixed(3)}</span>
					</div>
					<div class="crit-row">
						<span class="k">enfants (pondéré)</span>
						<span class="v">{s.weightedChild.toFixed(3)}</span>
					</div>
					<div class="crit-row gain">
						<span class="k">gain</span>
						<span class="v">{s.gain.toFixed(3)}</span>
					</div>
					{#if s.key === activeCriterion}
						<div class="crit-row best">
							<span class="k">meilleur seuil</span>
							<span class="v">{s.bestThreshold !== null ? s.bestThreshold.toFixed(2) : '—'}</span>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<Metrics align="center">
		<div class="cell">
			<span class="label">Points gauche / droite</span>
			<span class="value">{nLeft} / {nRight}</span>
		</div>
		<div class="cell">
			<span class="label">Critère actif</span>
			<span class="value" style:color="var(--color-belief)">
				{activeStat.label}
			</span>
		</div>
		<div class="cell">
			<span class="label">Gain (seuil courant)</span>
			<span class="value" style:color="var(--color-positive)">{activeStat.gain.toFixed(3)}</span>
			<span class="unit">impureté gagnée</span>
		</div>
	</Metrics>

	<!-- Controls -->
	<div class="controls-panel">
		<div class="control-row">
			<span class="control-label">Variable</span>
			<div class="radio-group">
				<RadioButton value={0} label="x₁" bind:groupValue={feature} />
				<RadioButton value={1} label="x₂" bind:groupValue={feature} />
			</div>
		</div>

		<div class="control-row">
			<span class="control-label">Critère</span>
			<div class="radio-group">
				{#each CRITERIA as c (c.key)}
					<RadioButton value={c.key} label={c.label} bind:groupValue={activeCriterion} />
				{/each}
			</div>
		</div>

		<Slider
			bind:value={threshold}
			min={DATA_MIN}
			max={DATA_MAX}
			step={0.05}
			label={`Seuil sur ${splitLabel}`}
		/>

		<div class="actions-row">
			<Button variant="primary" size="sm" onclick={applyBestThreshold}
				>Seuil optimal (critère actif)</Button
			>
			<Button variant="outline" size="sm" onclick={newDataset}>⟲ Nouvelles données</Button>
		</div>
	</div>

	<!-- Insight box -->
	<div class="insight-box">
		<span class="icon">📊</span>
		<p>
			Coupez sur <strong>x₁</strong> : les enfants deviennent presque purs et le gain est fort, quel
			que soit le critère. Coupez sur <strong>x₂</strong> : aucune variable n'est exploitable et le
			gain reste quasi nul — c'est exactement ce que la construction gloutonne de CART exploite,
			nœud par nœud. Les trois critères s'accordent sur
			<em>quelle</em> coupure est bonne, mais ils peuvent indiquer des seuils légèrement différents (Gini
			est la plus « plate », l'erreur de classification la moins fine).
		</p>
	</div>
</div>

<style>
	.demo-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-text);
	}

	.header {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
		max-width: 520px;
	}

	.subtitle {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.scatter-svg {
		width: 100%;
		height: auto;
	}

	.grid line {
		stroke: var(--color-border);
		stroke-opacity: 0.4;
		stroke-width: 0.5;
	}

	.axis-label {
		font-size: 12px;
		fill: var(--color-text-muted);
		font-family: var(--font-mono, monospace);
	}

	.region {
		opacity: 0.1;
	}
	.region-left {
		fill: var(--color-belief);
	}
	.region-right {
		fill: var(--color-surprise);
	}

	.boundary {
		stroke: var(--color-belief);
		stroke-width: 2.5;
		filter: drop-shadow(0 0 3px color-mix(in srgb, var(--color-belief) 40%, transparent));
	}

	.dot.is-class-0 {
		fill: var(--color-surprise);
		stroke: white;
		stroke-width: 1;
	}
	.dot.is-class-1 {
		fill: var(--color-positive);
		stroke: white;
		stroke-width: 1;
	}

	.badge-bg {
		fill: var(--color-surface-2);
		stroke: var(--color-border);
		stroke-width: 0.8;
	}
	.badge-text {
		font-size: 10px;
		fill: var(--color-text);
		font-family: var(--font-mono, monospace);
	}

	.crit-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		width: 100%;
	}

	.crit-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.crit-card.active {
		border-color: var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 10%, transparent);
	}

	.crit-name {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.crit-rows {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.crit-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.78rem;
	}

	.crit-row .k {
		color: var(--color-text-muted);
	}

	.crit-row .v {
		font-family: var(--font-mono, monospace);
		font-weight: 700;
		color: var(--color-text);
	}

	.crit-row.gain .v {
		color: var(--color-positive);
	}

	.crit-row.best {
		margin-top: 0.15rem;
		padding-top: 0.2rem;
		border-top: 1px dashed var(--color-border);
	}

	.crit-row.best .k {
		color: var(--color-belief);
	}

	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background: var(--color-surface-2);
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.control-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		min-width: 4.5rem;
	}

	.radio-group {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.insight-box {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		padding: 0.65rem 1rem;
		background: color-mix(in srgb, var(--color-belief) 8%, transparent);
		border-radius: 6px;
		width: 100%;
	}

	.insight-box p {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	.insight-box strong {
		font-weight: 700;
	}

	.icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.crit-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
