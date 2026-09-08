import { PART1 } from './part1.js';
import { PART2 } from './part2.js';
import { PART3 } from './part3.js';
import { PART5 } from './part5.js';
import { PART6 } from './part6.js';
import { PART7 } from './part7.js';
import { PART8 } from './part8.js';
import { PART9 } from './part9.js';
import { PART10 } from './part10.js';
import type { QuizQuestion } from '../types.js';

// Course order, part 1 -> 10 (part 4, régression linéaire, arrive en phase D).
// A question lives in its "home" part file and reaches other parts/topics
// purely through its tags.
export const QUESTIONS: QuizQuestion[] = [
	...PART1,
	...PART2,
	...PART3,
	...PART5,
	...PART6,
	...PART7,
	...PART8,
	...PART9,
	...PART10
];
