export interface QuizItem {
	question: string;
	options: string[];
	answerIndex: number;
	explanation?: string;
}

export interface QuizQuestion extends QuizItem {
	/** Stable, unique key for the question (e.g. "p4-l2-q1"). */
	id: string;
	/**
	 * Hierarchical path-tags. A question may carry several, so it can belong to
	 * multiple parts/topics at once. See the convention in index.ts.
	 */
	tags: string[];
}
