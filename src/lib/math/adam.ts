/** Pure, element-wise implementations of Adam and AdamW. */

export interface AdamState {
	m: number[];
	v: number[];
	step: number;
}

export interface AdamParams {
	alpha: number;
	beta1: number;
	beta2: number;
	epsilon: number;
}

export interface AdamStepResult {
	theta: number[];
	state: AdamState;
	mHat: number[];
	vHat: number[];
	effectiveLearningRate: number[];
	update: number[];
}

export function createAdamState(dimension: number): AdamState {
	return { m: Array(dimension).fill(0), v: Array(dimension).fill(0), step: 0 };
}

function validateVectorPair(theta: number[], gradient: number[], state: AdamState): void {
	if (theta.length !== gradient.length || theta.length !== state.m.length || theta.length !== state.v.length) {
		throw new Error('Adam vectors must have the same dimension');
	}
}

/** One canonical Adam step, using sqrt(vHat) + epsilon. Inputs are never mutated. */
export function adamStep(
	theta: number[],
	gradient: number[],
	state: AdamState,
	params: AdamParams
): AdamStepResult {
	validateVectorPair(theta, gradient, state);
	const step = state.step + 1;
	const { alpha, beta1, beta2, epsilon } = params;
	const bias1 = 1 - Math.pow(beta1, step);
	const bias2 = 1 - Math.pow(beta2, step);
	const m = gradient.map((g, i) => beta1 * state.m[i] + (1 - beta1) * g);
	const v = gradient.map((g, i) => beta2 * state.v[i] + (1 - beta2) * g * g);
	const mHat = m.map((value) => value / bias1);
	const vHat = v.map((value) => value / bias2);
	const effectiveLearningRate = vHat.map((value) => alpha / (Math.sqrt(value) + epsilon));
	const update = mHat.map((value, i) => effectiveLearningRate[i] * value);

	return {
		theta: theta.map((value, i) => value - update[i]),
		state: { m, v, step },
		mHat,
		vHat,
		effectiveLearningRate,
		update
	};
}

/** AdamW step: decay is deliberately decoupled from the adaptive gradient update. */
export function adamWStep(
	theta: number[],
	gradient: number[],
	state: AdamState,
	params: AdamParams,
	weightDecay: number
): AdamStepResult {
	const result = adamStep(theta, gradient, state, params);
	const decayFactor = 1 - params.alpha * weightDecay;
	return {
		...result,
		theta: result.theta.map((value, i) => decayFactor * theta[i] - result.update[i])
	};
}

/** Exponential moving average, useful for explaining Adam's temporal memory. */
export function exponentialMovingAverage(values: number[], beta: number): number[] {
	let average = 0;
	return values.map((value) => {
		average = beta * average + (1 - beta) * value;
		return average;
	});
}

export function biasCorrected(value: number, beta: number, step: number): number {
	return value / (1 - Math.pow(beta, step));
}
