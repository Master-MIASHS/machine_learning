<script lang="ts">
	import type { QuizItem } from '$lib/quiz';
	import { mulberry32 } from '$lib/math/util.js';

	interface Props {
		items: QuizItem[];
		maxQuestions?: number;
	}

	let { items, maxQuestions }: Props = $props();
	let selectedAnswers = $state<Record<number, number>>({});
	let visibleIndices = $state<number[]>([]);

	// FNV-1a 32-bit hash — stable seed per question for the option shuffle.
	function hashString(s: string): number {
		let h = 0x811c9dc5;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193);
		}
		return h >>> 0;
	}

	// Deterministic (SSR-safe) option order per question: a seeded Fisher-Yates
	// permutation of the original option indices. Without it, every question's
	// correct answer would always render as the first option ("A").
	const optionOrder = $derived(
		items.map((item) => {
			const idx = item.options.map((_, i) => i);
			const rng = mulberry32(hashString(item.question + '\u0000' + item.options.join('\u0000')));
			for (let i = idx.length - 1; i > 0; i--) {
				const j = Math.floor(rng() * (i + 1));
				[idx[i], idx[j]] = [idx[j], idx[i]];
			}
			return idx;
		})
	);

	function getRandomSubset(n: number, k: number): number[] {
		const indices = Array.from({ length: n }, (_, i) => i);
		for (let i = n - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[indices[i], indices[j]] = [indices[j], indices[i]];
		}
		return indices.slice(0, k);
	}

	function updateVisibleIndices() {
		if (maxQuestions === undefined || maxQuestions >= items.length) {
			visibleIndices = Array.from({ length: items.length }, (_, i) => i);
		} else {
			visibleIndices = getRandomSubset(items.length, maxQuestions);
		}
	}

	$effect(() => {
		updateVisibleIndices();
	});

	const answeredCount = $derived(
		Object.entries(selectedAnswers).filter(([idx]) => visibleIndices.includes(Number(idx))).length
	);

	const correctCount = $derived(
		Object.entries(selectedAnswers).filter(([questionIndex, answerIndex]) => {
			const idx = Number(questionIndex);
			return visibleIndices.includes(idx) && items[idx]?.answerIndex === answerIndex;
		}).length
	);

	function selectAnswer(questionIndex: number, answerIndex: number) {
		if (selectedAnswers[questionIndex] === undefined) {
			selectedAnswers = { ...selectedAnswers, [questionIndex]: answerIndex };
		}
	}

	function reset() {
		selectedAnswers = {};
	}

	function shuffle() {
		if (maxQuestions !== undefined && maxQuestions < items.length) {
			visibleIndices = getRandomSubset(items.length, maxQuestions);
			selectedAnswers = {};
		}
	}

	function isAnswered(questionIndex: number): boolean {
		return selectedAnswers[questionIndex] !== undefined;
	}

	function isCorrect(questionIndex: number): boolean {
		return selectedAnswers[questionIndex] === items[questionIndex]?.answerIndex;
	}
</script>

<div class="quiz">
	{#if items.length === 0}
		<p class="empty-state">Aucune question n'est disponible.</p>
	{:else}
		<div class="quiz-header">
			<p class="progress" aria-live="polite">
				{correctCount} / {visibleIndices.length} réponse{visibleIndices.length > 1 ? 's' : ''} correcte{visibleIndices.length >
				1
					? 's'
					: ''}
			</p>
			<div class="header-actions">
				{#if maxQuestions !== undefined && maxQuestions < items.length}
					<button type="button" class="reset-button" onclick={shuffle}> Mélanger </button>
				{/if}
				<button type="button" class="reset-button" onclick={reset} disabled={answeredCount === 0}>
					Réinitialiser
				</button>
			</div>
		</div>

		<div class="questions">
			{#each visibleIndices as questionIndex (questionIndex)}
				{@const item = items[questionIndex]}
				{@const answered = isAnswered(questionIndex)}
				{@const correct = answered && isCorrect(questionIndex)}
				{@const feedbackId = `quiz-feedback-${questionIndex}`}

				<fieldset class="question-card">
					<legend>
						<span class="question-number">Question {visibleIndices.indexOf(questionIndex) + 1}</span
						>
						<span class="question-text">{item.question}</span>
					</legend>

					<div class="options">
						{#each optionOrder[questionIndex] as origIdx, pos (origIdx)}
							{@const selected = selectedAnswers[questionIndex] === origIdx}
							{@const right = answered && origIdx === item.answerIndex}
							{@const wrong = selected && !right}

							<button
								type="button"
								class="option"
								class:selected
								class:correct={right}
								class:incorrect={wrong}
								aria-pressed={selected}
								aria-describedby={answered ? feedbackId : undefined}
								onclick={() => selectAnswer(questionIndex, origIdx)}
							>
								<span class="option-marker" aria-hidden="true">
									{String.fromCharCode(65 + pos)}
								</span>
								<span>{item.options[origIdx]}</span>
							</button>
						{/each}
					</div>

					{#if answered}
						<div
							id={feedbackId}
							class:feedback-correct={correct}
							class:feedback-incorrect={!correct}
							class="feedback"
							aria-live="polite"
						>
							<strong>{correct ? 'Correct !' : 'Incorrect.'}</strong>
							{#if item.explanation}
								<span>{item.explanation}</span>
							{/if}
						</div>
					{/if}
				</fieldset>
			{/each}
		</div>
	{/if}
</div>

<style>
	.quiz {
		display: grid;
		gap: 1rem;
	}

	.quiz-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.progress {
		margin: 0;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}

	.reset-button,
	.option {
		font: inherit;
		cursor: pointer;
	}

	.reset-button {
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.reset-button:hover:not(:disabled) {
		border-color: var(--color-text-muted);
		background: var(--color-surface-2);
	}

	.reset-button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.questions {
		display: grid;
		gap: 1rem;
	}

	.question-card {
		min-width: 0;
		margin: 0;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	legend {
		max-width: 100%;
		padding: 0 0.25rem;
		color: var(--color-text);
		font-weight: 600;
	}

	.question-number {
		display: block;
		margin-bottom: 0.35rem;
		color: var(--color-epistemic);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.question-text {
		display: block;
	}

	.options {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.85rem;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		text-align: left;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.option:hover {
		border-color: var(--color-belief);
		background: var(--color-surface-2);
	}

	.option:focus-visible,
	.reset-button:focus-visible {
		outline: 2px solid var(--color-belief);
		outline-offset: 2px;
	}

	.option-marker {
		display: grid;
		width: 1.5rem;
		height: 1.5rem;
		flex: 0 0 1.5rem;
		place-items: center;
		border: 1px solid currentColor;
		border-radius: 50%;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.option.selected {
		border-color: var(--color-belief);
		background: color-mix(in srgb, var(--color-belief) 10%, transparent);
	}

	.option.correct {
		border-color: var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 12%, transparent);
	}

	.option.incorrect {
		border-color: var(--color-surprise);
		background: color-mix(in srgb, var(--color-surprise) 12%, transparent);
	}

	.feedback {
		display: grid;
		gap: 0.25rem;
		margin-top: 0.85rem;
		padding: 0.7rem 0.85rem;
		border-left: 3px solid;
		font-size: 0.9rem;
	}

	.feedback-correct {
		border-color: var(--color-positive);
		background: color-mix(in srgb, var(--color-positive) 8%, transparent);
	}

	.feedback-incorrect {
		border-color: var(--color-surprise);
		background: color-mix(in srgb, var(--color-surprise) 8%, transparent);
	}

	.feedback span {
		color: var(--color-text-muted);
	}

	.empty-state {
		margin: 0;
		color: var(--color-text-muted);
	}

	@media (max-width: 540px) {
		.quiz-header {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
