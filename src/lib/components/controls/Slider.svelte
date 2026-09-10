<script module lang="ts">
	// Instance counter: the label text is not a valid HTML id (spaces,
	// accents, parentheses), so each slider gets a unique id instead.
	// Incremented in tree order on both server (prerender) and client
	// (hydration), so ids stay stable across the round-trip.
	let sliderId = 0;
</script>

<script lang="ts">
	interface Props {
		min: number;
		max: number;
		step: number;
		value: number;
		label: string;
		unit?: string;
		logarithmic?: boolean;
		disabled?: boolean;
		onchange?: (value: number) => void;
		showLabel?: boolean;
	}

	let {
		min,
		max,
		step,
		value = $bindable(),
		label,
		unit,
		logarithmic = false,
		disabled = false,
		onchange,
		showLabel = true
	}: Props = $props();

	const inputId = `slider-${++sliderId}`;

	// For logarithmic: map slider position [0,1] to [min,max] on log scale
	const sliderPos = $derived(logarithmic ? toLog(value) : value);

	function toLog(v: number): number {
		if (min <= 0) return v;
		return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
	}

	function fromLog(pos: number): number {
		return min * Math.pow(max / min, pos);
	}

	function handleInput(e: Event) {
		if (disabled) return;
		const raw = parseFloat((e.target as HTMLInputElement).value);
		const newVal = logarithmic ? fromLog(raw) : raw;
		value = newVal;
		onchange?.(newVal);
	}

	const displayValue = $derived(
		logarithmic
			? value.toPrecision(3)
			: Number.isInteger(step)
				? String(value)
				: value.toFixed(String(step).split('.')[1]?.length ?? 1)
	);

	// Fill percentage for the track background
	const fillPct = $derived(logarithmic ? sliderPos * 100 : ((value - min) / (max - min)) * 100);
</script>

<div class="slider-container" class:is-disabled={disabled}>
	<div class="slider-header">
		{#if showLabel}
			<label for={inputId} class="slider-label">{label}</label>
		{/if}
		<span class="slider-value">{displayValue}{unit ? ' ' + unit : ''}</span>
	</div>
	<input
		id={inputId}
		type="range"
		min={logarithmic ? 0 : min}
		max={logarithmic ? 1 : max}
		step={logarithmic ? 0.001 : step}
		value={logarithmic ? sliderPos : value}
		oninput={handleInput}
		{disabled}
		aria-label={label}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		style:--fill="{fillPct}%"
	/>
</div>

<style>
	.slider-container {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}

	.slider-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.slider-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.slider-value {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-belief);
		min-width: 4rem;
		text-align: right;
		transition: opacity 0.2s ease;
	}

	input[type='range'] {
		width: 100%;
		height: 5px;
		border-radius: 3px;
		appearance: none;
		background: linear-gradient(
			to right,
			var(--color-belief) 0%,
			var(--color-belief) var(--fill, 0%),
			var(--color-border) var(--fill, 0%),
			var(--color-border) 100%
		);
		outline: none;
		cursor: pointer;
		/*transition:
			opacity 0.2s ease,
			background 0.2s ease;*/
		padding: 14px 0;
		box-sizing: content-box;
		background-clip: content-box;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-belief);
		border: 2px solid var(--color-bg);
		box-shadow: 0 0 0 1px var(--color-belief);
		cursor: pointer;
		transition: transform 0.1s;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-belief);
		border: 2px solid var(--color-bg);
		box-shadow: 0 0 0 1px var(--color-belief);
		cursor: pointer;
	}

	input[type='range']:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: 2px;
		border-radius: 2px;
	}

	@media (pointer: coarse) {
		input[type='range']::-webkit-slider-thumb {
			width: 24px;
			height: 24px;
		}

		input[type='range']::-moz-range-thumb {
			width: 24px;
			height: 24px;
		}
	}

	/* ── Disabled state ── */
	.is-disabled {
		opacity: 0.45;
		pointer-events: none;
	}

	.is-disabled input[type='range'] {
		cursor: not-allowed;
		background: linear-gradient(
			to right,
			var(--color-text-muted) 0%,
			var(--color-text-muted) var(--fill, 0%),
			var(--color-border) var(--fill, 0%),
			var(--color-border) 100%
		);
	}

	.is-disabled input[type='range']::-webkit-slider-thumb {
		background: var(--color-text-muted);
		box-shadow: 0 0 0 1px var(--color-text-muted);
		cursor: not-allowed;
	}

	.is-disabled input[type='range']::-moz-range-thumb {
		background: var(--color-text-muted);
		box-shadow: 0 0 0 1px var(--color-text-muted);
		cursor: not-allowed;
	}

	.is-disabled .slider-value {
		opacity: 0.6;
	}
</style>
