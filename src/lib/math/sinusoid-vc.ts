// src/lib/math/sinusoid-vc.ts
//
// Part IX, leçon 3 — exemple « au-delà du cours » : la famille des
// signatures de sinusoïdes
//     H_sin = { h_{A,b}(x) = 1[sin(Ax + b) > 0] : A > 0, b ∈ R }  sur x ∈ R
// a dimension VC infinie : pour tout m, il existe un ensemble de m points
// qu'elle brise (en pratique, tout ensemble de points en position générale ;
// pas chaque configuration — certains ensembles symétriques admettent des
// étiquetages irréalisables).
//
// Ce résultat n'est PAS dans theorie.typ, qui ne mentionne la convention
// VCdim = +∞ que dans la définition de la dimension VC (section « Dimension
// de Vapnik-Chervonenkis ») et n'y présente que des familles de VCdim finie
// (seuils, intervalles, hyperplans). Ce module fournit le solveur utilisé par
// la démo SinusoidVCExplorer : il cherche, pour un étiquetage donné de points
// distincts, une paire (A, b) réalisant l'étiquetage. La recherche est exacte
// (à A fixé, puis en A jusqu'à un plafond de fréquence drawable) mais elle
// n'est pas une preuve de la brisure — la démo est présentée comme telle.

const TAU = 2 * Math.PI;

/** Normalise un angle réel dans [0, 2π). */
function normAngle(t: number): number {
	const r = t % TAU;
	return r < 0 ? r + TAU : r;
}

// Seuil sous lequel |sin| est du bruit d'arrondi (réduction d'argument de
// A·x + b en double précision) et non un signe effectif.
const SIN_EPS = 1e-9;

/**
 * h_{A,b}(x) = 1[sin(Ax + b) > 0] évaluée sur `xs` — convention : sin = 0
 * (ou |sin| ≤ SIN_EPS, le bruit d'arrondi) classe 0. A doit être strictement
 * positive (A ≤ 0 dégenère la famille).
 */
export function sinusoidSigns(A: number, b: number, xs: number[]): (0 | 1)[] {
	if (!Number.isFinite(A) || A <= 0) throw new Error(`A must be finite and positive, got ${A}`);
	if (!Number.isFinite(b)) throw new Error(`b must be finite, got ${b}`);
	return xs.map((x) => {
		if (!Number.isFinite(x)) throw new Error(`x must be finite, got ${x}`);
		return Math.sin(A * x + b) > SIN_EPS ? 1 : 0;
	});
}

export interface PhaseWindow {
	/** Milieu de l'arc de phases b (mod 2π) réalisant l'étiquetage, dans [0, 2π). */
	mid: number;
	/** Demi-largeur de cet arc : tout b dans (mid − halfLen, mid + halfLen) fonctionne. */
	halfLen: number;
}

/**
 * À A fixé, détermine si l'étiquetage `labels` de `xs` est réalisable par
 * h_{A,b} (en faisant varier b), et renvoie la fenêtre de phases faisable.
 *
 * Pour chaque i, la condition sin(A·x_i + b) > 0 (resp. < 0) est une
 * demi-circule ouverte de b (mod 2π) de longueur π, centrée en
 * (π/2 − A·x_i) (resp. (3π/2 − A·x_i)). L'intersection de m tels arcs est
 * vide ou un arc unique (si p appartient à l'intersection, la coupure en p
 * déploie chaque arc — de longueur < 2π — en [0, a_i) ∪ (b_i, 2π) avec
 * b_i > a_i, et l'intersection réduit à (max a_i, min b_i)). On la calcule
 * exactement : on déplie l'arc 1 sur l'intervalle réel [s0, s0 + π] (bornes
 * fermées, pour attraper aussi une intersection réduite à un point) et on
 * l'intersecte arc par arc — chaque arc ne contribuant que par les copies
 * de longueur π, espacées de 2π, qui peuvent toucher l'intervalle courant
 * (au plus trois candidats par pas). O(m).
 *
 * `xs` et `labels` doivent avoir la même longueur ; les x peuvent être dans
 * n'importe quel ordre. Renvoie null si aucun b ne réalise l'étiquetage.
 * Une intersection réduite à un point renvoie {mid, halfLen: 0} : le fit est
 * alors validé point par point par findSinusoidFit (un point assis pile sur
 * sin = 0 est classé 0 par convention).
 */
export function feasiblePhase(A: number, xs: number[], labels: (0 | 1)[]): PhaseWindow | null {
	if (!Number.isFinite(A) || A <= 0) throw new Error(`A must be finite and positive, got ${A}`);
	if (xs.length === 0) throw new Error('xs must be non-empty');
	if (xs.length !== labels.length) {
		throw new Error(`xs and labels must have the same length (${xs.length} vs ${labels.length})`);
	}

	// Demi-circules : centre c_i, arc ouvert (c_i − π/2, c_i + π/2) mod 2π.
	const centers = xs.map((x, i) => {
		if (!Number.isFinite(x)) throw new Error(`x must be finite, got ${x}`);
		return (labels[i] === 1 ? Math.PI / 2 : (3 * Math.PI) / 2) - A * x;
	});

	const s0 = normAngle(centers[0] - Math.PI / 2);
	let lo = s0;
	let hi = s0 + Math.PI;
	for (let i = 1; i < xs.length && lo < hi; i++) {
		const c = centers[i];
		// Copies qui touchent [lo, hi] : c + 2kπ ∈ (lo − π/2, hi + π/2),
		// intervalle de longueur < 2π → au plus deux valeurs de k.
		const kBase = Math.floor((lo - Math.PI / 2 - c) / TAU);
		let nLo = Infinity;
		let nHi = -Infinity;
		for (let k = kBase - 1; k <= kBase + 2; k++) {
			const aLo = c + 2 * k * Math.PI - Math.PI / 2;
			const aHi = c + 2 * k * Math.PI + Math.PI / 2;
			const oLo = Math.max(lo, aLo);
			const oHi = Math.min(hi, aHi);
			if (oLo < oHi) {
				nLo = Math.min(nLo, oLo);
				nHi = Math.max(nHi, oHi);
			}
		}
		if (nLo === Infinity) return null;
		lo = nLo;
		hi = nHi;
	}
	if (lo > hi) return null;
	const len = hi - lo;
	if (len < 0) return null;
	if (len <= 1e-12) return { mid: normAngle(lo), halfLen: 0 };
	return { mid: normAngle((lo + hi) / 2), halfLen: len / 2 };
}

export interface SinusoidFit {
	/** Fréquence trouvée (A > 0). */
	A: number;
	/** Phase trouvée, dans [0, 2π) — milieu de la fenêtre de phases faisable (marge maximale). */
	b: number;
	/** Erreurs empiriques après vérification directe (0 dès qu'un fit est retourné). */
	errors: number;
	/** Demi-largeur de la fenêtre de phases en b pour ce A (marge en phase). */
	phaseHalfLen: number;
}

function verifyFit(A: number, b: number, xs: number[], labels: (0 | 1)[]): number {
	const signs = sinusoidSigns(A, b, xs);
	let errors = 0;
	for (let i = 0; i < xs.length; i++) if (signs[i] !== labels[i]) errors++;
	return errors;
}

/**
 * Cherche (A, b) tels que h_{A,b} réalise l'étiquetage `labels` de `xs`
 * (x distincts, dans n'importe quel ordre), ou null si la recherche échoue.
 *
 * Rappel de contexte (exemple au-delà du cours) : la dimension VC de la
 * famille est infinie, c'est-à-dire que pour tout m il EXISTE un ensemble de
 * m points que la famille brise — en pratique tout ensemble de points « en
 * position générale » l'est. Ce n'est pas vrai de chaque configuration :
 * certains ensembles symétriques (par exemple des points parfaitement
 * équirépartis) admettent des étiquetages irréalisables. La fonction renvoie
 * donc null si l'étiquetage est irréalisable, ou si la première fenêtre de
 * faisabilité se situe au-delà du domaine exploré (≈ 300 oscillations sur
 * l'espacement des points, au-delà de quoi la frontière n'est plus drawable)
 * — la démo le signale honnêtement.
 *
 * Stratégie :
 *  1. grille logarithmique d'A entre A_min = 0.3/span et
 *     A_max = 3π(m−1)/span : fast path, couvre le régime basse fréquence
 *     (étiquetages constants / nuages séparés) et les fenêtres d'alternance
 *     de premier ordre ;
 *  2. si la grille échoue, recherche EXACTE en A : les extrémités des arcs
 *     de phases sont e_i^±(A) = (−A·x_i ± π) mod 2π, et deux extrémités ne
 *     coïncident qu'en A = kπ/|x_j − x_i| ; entre deux telles valeurs
 *     consécutives, l'ordre cyclique des 2m extrémités est fixe et la
 *     couverture maximale (en b) l'est donc aussi. On trie toutes les
 *     valeurs de croisement ≤ A_search = 300π/span et on teste le milieu de
 *     chaque intervalle : toutes les fenêtres de faisabilité sont trouvées,
 *     sans approximation (plafonné à 50 000 croisements pour rester rapide).
 *
 * Pour chaque A retenu, feasiblePhase donne la fenêtre de phases exacte ;
 * b est pris au milieu de la fenêtre et le fit est vérifié point par point
 * avant d'être retourné (garde-fou contre les erreurs d'arrondi de
 * réduction d'argument quand A·x est grand, et contre les solutions
 * dégénérées en un point où un point assis sur sin = 0 serait mal classé).
 */
export function findSinusoidFit(xs: number[], labels: (0 | 1)[]): SinusoidFit | null {
	if (xs.length === 0) throw new Error('xs must be non-empty');
	if (xs.length !== labels.length) {
		throw new Error(`xs and labels must have the same length (${xs.length} vs ${labels.length})`);
	}
	for (const x of xs) if (!Number.isFinite(x)) throw new Error(`x must be finite, got ${x}`);
	xs.forEach((_, i) => {
		if (labels[i] !== 0 && labels[i] !== 1) {
			throw new Error(`labels must be 0 or 1, got ${labels[i]}`);
		}
	});

	// Tri par x (les labels suivent), détection des doublons.
	const order = xs
		.map((x, i) => ({ x, y: labels[i] }))
		.sort((a, b) => a.x - b.x);
	for (let i = 1; i < order.length; i++) {
		const scale = Math.max(1, Math.abs(order[i].x));
		if (order[i].x - order[i - 1].x < 1e-9 * scale) {
			throw new Error(
				`duplicate x values at ${order[i - 1].x} and ${order[i].x}: distinct points required`
			);
		}
	}
	const sx = order.map((p) => p.x);
	const sy = order.map((p) => p.y);
	const m = sx.length;
	const span = sx[m - 1] - sx[0];

	// Cas dégénéré : un seul point (ou span nul) — n'importe quel A convient.
	if (span <= 0) {
		const window = feasiblePhase(1, sx, sy);
		if (window === null) return null;
		return { A: 1, b: window.mid, errors: 0, phaseHalfLen: window.halfLen };
	}

	const aMin = 0.3 / span;
	const aMax = Math.max((3 * Math.PI * (m - 1)) / span, 1);
	const aSearch = Math.max((300 * Math.PI) / span, aMax); // plafond drawable (~300 oscillations)

	const tryA = (A: number): SinusoidFit | null => {
		const window = feasiblePhase(A, sx, sy);
		if (window === null) return null;
		const b = window.mid;
		const errors = verifyFit(A, b, sx, sy);
		if (errors > 0) return null; // garde-fou arrondi : on tente un autre A
		return { A, b, errors: 0, phaseHalfLen: window.halfLen };
	};

	// Phase 1 : grille logarithmique (fast path).
	const N = 300;
	const logMin = Math.log(aMin);
	const logMax = Math.log(aMax);
	for (let k = 0; k < N; k++) {
		const A = Math.exp(logMin + (k / (N - 1)) * (logMax - logMin));
		const fit = tryA(A);
		if (fit !== null) return fit;
	}

	// Phase 2 : recherche exacte sur [aMin, aSearch]. Les seules valeurs de A
	// où la faisabilité peut changer sont les croisements d'extrémités d'arcs,
	// A = kπ/|x_j − x_i| ; on teste le milieu de chaque intervalle entre
	// croisements consécutifs. Le plus petit A faisable est retourné (la
	// frontière la moins oscillante).
	const MAX_CROSSINGS = 50000;
	const crossings: number[] = [];
	for (let i = 0; i < m; i++) {
		for (let j = i + 1; j < m; j++) {
			const gap = sx[j] - sx[i];
			const maxK = Math.floor((aSearch * gap) / Math.PI);
			for (let k = 1; k <= maxK && crossings.length < MAX_CROSSINGS; k++) {
				crossings.push((k * Math.PI) / gap);
			}
			if (crossings.length >= MAX_CROSSINGS) break;
		}
		if (crossings.length >= MAX_CROSSINGS) break;
	}
	if (crossings.length < MAX_CROSSINGS) {
		crossings.sort((a, b) => a - b);
		let boundary = aMin;
		for (const c of crossings) {
			if (c <= boundary) continue;
			const midA = (boundary + c) / 2;
			const fit = tryA(midA);
			if (fit !== null) return fit;
			boundary = c;
		}
		const fit = tryA((boundary + aSearch) / 2);
		if (fit !== null) return fit;
	}

	return null;
}

/**
 * Échantillonnage de y = sin(Ax + b) sur [xMin, xMax] pour le tracé :
 * ≈16 points par oscillation, borné entre 500 et 8000 points. Au-delà du
 * plafond, la courbe affichée peut aliéaser (moiré) — la classification des
 * points, elle, utilise la formule exacte et n'est pas affectée.
 */
export function sinusoidCurvePoints(A: number, b: number, xMin: number, xMax: number): [number, number][] {
	if (!Number.isFinite(A) || A <= 0) throw new Error(`A must be finite and positive, got ${A}`);
	if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
		throw new Error(`need finite xMin < xMax, got ${xMin}, ${xMax}`);
	}
	const periods = (A * (xMax - xMin)) / Math.PI;
	const n = Math.min(8000, Math.max(500, Math.ceil(16 * periods)));
	const pts: [number, number][] = [];
	for (let i = 0; i < n; i++) {
		const x = xMin + (i / (n - 1)) * (xMax - xMin);
		pts.push([x, Math.sin(A * x + b)]);
	}
	return pts;
}

/**
 * n+1 échantillons de y = sin(Ax + b), espacés régulièrement sur [a, c]
 * (bornes comprises) — pour tracer un morceau de courbe (ex. l'ombrage
 * d'une région positive entre deux zéros consécutifs).
 */
export function sampleSinusoidInterval(
	A: number,
	b: number,
	a: number,
	c: number,
	n: number
): [number, number][] {
	if (!Number.isFinite(A) || A <= 0) throw new Error(`A must be finite and positive, got ${A}`);
	if (!Number.isFinite(a) || !Number.isFinite(c) || a >= c) {
		throw new Error(`need finite a < c, got ${a}, ${c}`);
	}
	if (!Number.isInteger(n) || n < 1) throw new Error(`n must be an integer >= 1, got ${n}`);
	const pts: [number, number][] = [];
	for (let i = 0; i <= n; i++) {
		const x = a + ((c - a) * i) / n;
		pts.push([x, Math.sin(A * x + b)]);
	}
	return pts;
}

/**
 * Intervalles fermés [a, b] de [xMin, xMax] sur lesquels sin(Ax + b) > 0,
 * calculés exactement à partir des zéros x_k = (kπ − b)/A (pas d'échantillonnage).
 * Les bornes ouvertes/fermées sont sans conséquence pour le tracé.
 */
export function positiveRegions(A: number, b: number, xMin: number, xMax: number): [number, number][] {
	if (!Number.isFinite(A) || A <= 0) throw new Error(`A must be finite and positive, got ${A}`);
	if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
		throw new Error(`need finite xMin < xMax, got ${xMin}, ${xMax}`);
	}
	const lo = A * xMin + b;
	const hi = A * xMax + b;
	// Zéros strictement intérieurs : x_k = (kπ − b)/A avec kπ ∈ (lo, hi).
	const kLo = Math.floor(lo / Math.PI) + 1;
	const kHi = Math.ceil(hi / Math.PI) - 1;
	const zeros: number[] = [];
	for (let k = kLo; k <= kHi; k++) zeros.push((k * Math.PI - b) / A);

	// Le signe est constant sur chaque sous-intervalle entre zéros consécutifs
	// (et sur [xMin, xMax] s'il n'y en a aucun) : on l'évalue au milieu du
	// sous-intervalle, jamais aux bornes (un zéro peut coïncider avec xMin/xMax).
	const bounds = [xMin, ...zeros, xMax];
	const regions: [number, number][] = [];
	for (let s = 0; s < bounds.length - 1; s++) {
		const mid = (bounds[s] + bounds[s + 1]) / 2;
		if (Math.sin(A * mid + b) > 0) regions.push([bounds[s], bounds[s + 1]]);
	}
	return regions;
}
