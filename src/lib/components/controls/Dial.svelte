<script lang="ts">
  interface Props {
    min: number;
    max: number;
    value: number;
    label: string;
    precision?: number;
    onchange?: (value: number) => void;
  }

  let { min, max, value = $bindable(), label, precision = 2, onchange }: Props = $props();

  let dragging = $state(false);
  let startY = $state(0);
  let startVal = $state(0);

  // Map value to rotation angle: min=-135deg, max=+135deg
  const angle = $derived(((value - min) / (max - min)) * 270 - 135);
  const displayVal = $derived(value.toFixed(precision));

  function clamp(v: number) {
    return Math.min(max, Math.max(min, v));
  }

  function onmousedown(e: MouseEvent) {
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startVal = value;

    const onmove = (ev: MouseEvent) => {
      if (!dragging) return;
      const delta = (startY - ev.clientY) / 100;
      const newVal = clamp(startVal + delta * (max - min));
      value = newVal;
      onchange?.(newVal);
    };

    const onup = () => {
      dragging = false;
      window.removeEventListener('mousemove', onmove);
      window.removeEventListener('mouseup', onup);
    };

    window.addEventListener('mousemove', onmove);
    window.addEventListener('mouseup', onup);
  }

  function onkeydown(e: KeyboardEvent) {
    const step = (max - min) / 100;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      value = clamp(value + step);
      onchange?.(value);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      value = clamp(value - step);
      onchange?.(value);
    }
  }
</script>

<div class="dial-wrapper">
  <div
    class="dial"
    class:dragging
    role="slider"
    aria-label={label}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={displayVal}
    tabindex="0"
    onmousedown={onmousedown}
    onkeydown={onkeydown}
    style:--angle="{angle}deg"
    title="Drag vertically to adjust"
  >
    <svg viewBox="0 0 40 40" class="dial-svg">
      <!-- Background arc -->
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-surface-2)" stroke-width="3" />
      <!-- Indicator line -->
      <line
        x1="20" y1="20" x2="20" y2="6"
        stroke="var(--color-belief)"
        stroke-width="2.5"
        stroke-linecap="round"
        transform="rotate({angle} 20 20)"
      />
    </svg>
  </div>
  <div class="dial-info">
    <span class="dial-label">{label}</span>
    <span class="dial-value">{displayVal}</span>
  </div>
</div>

<style>
  .dial-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    user-select: none;
  }

  .dial {
    width: 3rem;
    height: 3rem;
    cursor: ns-resize;
    border-radius: 50%;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s;
  }

  .dial:hover,
  .dial.dragging {
    border-color: var(--color-belief);
  }

  .dial:focus-visible {
    outline: 2px solid var(--color-belief);
    outline-offset: 2px;
  }

  .dial-svg {
    width: 100%;
    height: 100%;
  }

  .dial-info {
    text-align: center;
  }

  .dial-label {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .dial-value {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--color-belief);
  }
</style>
