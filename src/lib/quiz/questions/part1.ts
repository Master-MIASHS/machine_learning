import type { QuizQuestion } from '../types.js';

export const PART1: QuizQuestion[] = [
	{
		id: 'p1-l1-q1',
		tags: ['p1/l1'],
		question:
			"D'après le théorème 1.3 (CNO), si f est différentiable sur un ouvert Ω et que x* est un minimum local, que peut-on conclure ?",
		options: [
			'∇f(x*) = 0',
			'le Hessien en x* est semi-défini positif',
			'x* est nécessairement un minimum global',
			'x* est un minimum local strict'
		],
		answerIndex: 0,
		explanation:
			"La condition nécessaire du premier ordre ne garantit que l'annulation du gradient : un point stationnaire peut encore être un maximum ou un point-selle (callout « Attention ! »). Le signe du Hessien relève de la condition du second ordre (théorème 1.4), et le minimum local ne devient global qu'en contexte convexe (théorème 1.7)."
	},
	{
		id: 'p1-l1-q2',
		tags: ['p1/l1'],
		question:
			"En un point x*, le gradient s'annule et le Hessien est semi-défini positif. Que peut-on conclure à partir de la leçon ?",
		options: [
			'x* est forcément un minimum local',
			'la condition nécessaire du second ordre est satisfaite, mais x* peut encore être un point-selle',
			'x* est un minimum local strict, par la CSSO',
			'x* est un minimum global'
		],
		answerIndex: 1,
		explanation:
			"Exemple 1.10 (f(x,y) = x² − x⁴ − y⁴) : à l'origine le Hessien a pour valeurs propres 2 et 0, il est donc semi-défini positif et la CNSO est vérifiée, pourtant l'origine est un point-selle. La CSSO (théorème 1.5) exige un Hessien défini positif pour conclure."
	},
	{
		id: 'p1-l1-q3',
		tags: ['p1/l1'],
		question: 'Soit f convexe et différentiable sur un ouvert convexe Ω. Que dit le théorème 1.7 ?',
		options: [
			'∇f(x*) = 0 implique que x* est un minimum local',
			'tout minimum de f est unique',
			'f est nécessairement coercive',
			'∇f(x*) = 0 si et seulement si x* est un minimum global de f'
		],
		answerIndex: 3,
		explanation:
			"Théorème 1.7 : en contexte convexe, la condition du premier ordre devient à la fois nécessaire et suffisante et certifie un minimum global — le résultat fondamental de l'optimisation convexe. L'unicité suppose la convexité stricte, qui n'est pas une hypothèse du théorème (callout « Convexité stricte »)."
	},
	{
		id: 'p1-l1-q4',
		tags: ['p1/l1'],
		question:
			'La fonction f(x) = x⁴ − x² possède deux minima globaux en ±1/√2 et un maximum local en 0. Que montre cet exemple (1.8) ?',
		options: [
			"la convexité est nécessaire pour qu'une fonction ait un minimum global",
			"la CNO n'est pas vérifiée aux minima globaux",
			'une fonction peut posséder des minima globaux sans être convexe',
			'le Hessien est toujours défini positif aux minima globaux'
		],
		answerIndex: 2,
		explanation:
			"Exemple 1.8 : la courbure en 0 est strictement négative (f''(0) = −2), donc f n'est pas convexe, mais les minima globaux existent — on les trouve en énumérant les points critiques. La convexité est donc une condition suffisante, mais non nécessaire, pour l'existence d'un minimum."
	},
	{
		id: 'p1-l1-q5',
		tags: ['p1/l1'],
		question:
			"Selon le théorème 1.12 (Weierstrass généralisé), quelle combinaison d'hypothèses garantit qu'une fonction f définie sur Ω possède au moins un minimum global ?",
		options: [
			'f continue, Ω fermé et non vide, et f coercive ou Ω compact',
			'f continue et coercive, Ω quel que soit le sous-ensemble',
			'f différentiable avec ∇f = 0 en un point',
			'f convexe, Ω ouvert'
		],
		answerIndex: 0,
		explanation:
			'Le théorème 1.12 exige la continuité, un domaine fermé non vide et la coercivité (ou la compacité) : les deux hypothèses sont indépendantes, comme le montre le callout (f(x) = e^(−x) sur [0, +∞) : fermé mais non coercif, sans minimum ; f(x) = x² sur (0,1) : domaine non fermé, minimum exclu).'
	},
	{
		id: 'p1-l2-q1',
		tags: ['p1/l2'],
		question: "D'après le théorème 2.1, la moyenne f(x) = (1/n) Σ f_i(x) est garantie convexe si :",
		options: [
			'les f_i sont différentiables',
			'les f_i sont toutes convexes',
			'les f_i sont coercives',
			'les f_i sont fortement convexes'
		],
		answerIndex: 1,
		explanation:
			'Théorème 2.1 : toute combinaison linéaire à coefficients positifs de fonctions convexes — en particulier la moyenne, avec coefficients 1/n — est convexe. La différentiabilité, la coercivité ou la forte convexité ne sont pas requises.'
	},
	{
		id: 'p1-l2-q2',
		tags: ['p1/l2'],
		question:
			"Soit f = (1/n) Σ f_i. D'après le théorème 2.4, quelles hypothèses suffisent pour que f soit coercive ?",
		options: [
			'au moins un terme f_i coercif et tous les autres minorés',
			'toutes les f_i convexes',
			'chaque f_i différentiable',
			'au moins un f_i coercif, quels que soient les autres termes'
		],
		answerIndex: 0,
		explanation:
			"Théorème 2.4 : un terme coercif force la moyenne vers +∞, à condition que les autres termes ne s'échappent pas vers −∞ (minorés). C'est précisément pourquoi on ajoute un terme de régularisation coercif (comme le Ridge) pour garantir l'existence d'un minimum global via Weierstrass."
	},
	{
		id: 'p1-l2-q3',
		tags: ['p1/l2'],
		question:
			"Pour λ > 0, pourquoi l'objectif Ridge admet-il toujours une solution unique, même si X^T X est singulière (théorème 2.6.2) ?",
		options: [
			'parce que la perte est séparable par exemple',
			"parce que la pénalité L2 n'est pas différentiable",
			'parce que X^T X + λI_d est toujours inversible : la Hessienne 2X^T X + 2λI_d est définie positive pour tout v non nul',
			'parce que les données sont nécessairement bien conditionnées'
		],
		answerIndex: 2,
		explanation:
			"Théorème 2.6.2 : pour tout v ≠ 0, v^T H v = 2||Xv||² + 2λ||v||² ≥ 2λ||v||² > 0, la Hessienne est donc définie positive et inversible quel que soit le rang de X. L'objectif est strictement convexe et la solution (X^T X + λI_d)^(−1) X^T y est unique."
	},
	{
		id: 'p1-l2-q4',
		tags: ['p1/l2'],
		question:
			"Par rapport au Ridge, qu'apporte le Lasso (pénalité L1) que le Ridge n'apporte pas ?",
		options: [
			'des coefficients exactement nuls dès que λ ≥ |w_j^OLS|, donc une sélection automatique de variables',
			'une solution en forme fermée même lorsque les features ne sont pas orthonormées',
			"la différentiabilité de l'objectif en tous les points",
			"une garantie de forte convexité de l'objectif"
		],
		answerIndex: 0,
		explanation:
			"Dans le cas orthonormé, la solution Lasso suit l'opérateur de seuillage doux : dès que λ ≥ |w_j^OLS|, le coefficient w_j* est exactement nul, produisant des modèles sparses et une sélection automatique de variables. Le Ridge rétrécit les poids sans jamais les annuler ; la pénalité L1 est convexe mais non différentiable en 0 (exemple 2.8)."
	},
	{
		id: 'p1-l2-q5',
		tags: ['p1/l2'],
		question:
			"Pourquoi la perte d'un réseau de neurones est-elle généralement non convexe, même si la perte élémentaire ℓ (MSE, log-perte) est convexe ?",
		options: [
			'parce que le nombre de paramètres est très grand',
			'parce que la moyenne sur les exemples détruit la convexité',
			"parce que le MSE n'est pas une fonction convexe",
			"parce que la fonction du réseau h_θ n'est pas affine en θ, donc le théorème 2.5 (composition affine) ne s'applique plus"
		],
		answerIndex: 3,
		explanation:
			"Callout « Perte de convexité » : le théorème 2.5 ne préserve la convexité que pour la composition avec une application affine du vecteur de paramètres. Dans un réseau, les poids des différentes couches sont multipliés entre eux, donc h_θ n'est pas affine : seuls des minima locaux sont garantis, l'initialisation compte, et des points-selle apparaissent."
	},
	{
		id: 'p1-l3-q1',
		tags: ['p1/l3'],
		question:
			"D'après le théorème 3.2, pourquoi la direction −∇f(x) est-elle une bonne direction de déplacement ?",
		options: [
			"parce qu'elle maximise f à chaque étape",
			"parce qu'elle est toujours parallèle au Hessien",
			"parce qu'elle minimise la dérivée directionnelle parmi toutes les directions de norme 1",
			"parce qu'elle est la direction de plus forte croissance"
		],
		answerIndex: 2,
		explanation:
			'Théorème 3.2 : pour une direction unitaire d, la dérivée directionnelle vaut ∇f(x)^T d = ||∇f(x)|| cos θ, minimisée pour cos θ = −1, soit d* = −∇f(x)/||∇f(x)|| : la direction de plus forte descente.'
	},
	{
		id: 'p1-l3-q2',
		tags: ['p1/l3'],
		question:
			"Dans le théorème 3.3, le développement de Taylor de f(x − α∇f(x)) à l'ordre 1 contient le terme −α||∇f(x)||². Pourquoi garantit-il une décroissance locale pour α assez petit ?",
		options: [
			'parce que le Hessien est toujours positif',
			'parce que ce terme négatif domine le reste o(α) lorsque α est petit',
			'parce que le pas α est choisi par recherche linéaire',
			'parce que le terme o(α) est le terme dominant'
		],
		answerIndex: 1,
		explanation:
			"Taylor : f(x − α∇f(x)) = f(x) − α||∇f(x)||² + o(α) ; pour α suffisamment petit, le terme quadratique −α||∇f(x)||² domine, d'où la décroissance. Le callout « Remarque cruciale » rappelle que cette décroissance n'est garantie que localement et n'est pas une preuve de convergence globale."
	},
	{
		id: 'p1-l3-q3',
		tags: ['p1/l3'],
		question:
			'Selon le théorème 3.4, quel taux de convergence la descente de gradient avec pas constant α = 1/L garantit-elle pour une fonction convexe L-lisse admettant un minimum x* ?',
		options: [
			'O(1/k) : f(x_k) − f(x*) ≤ L||x_0 − x*||² / (2k)',
			'O(1/k²), comme la méthode de Nesterov',
			'exponentiel O(e^(−μk/L)), quelle que soit la fonction',
			"convergence en un nombre fini d'étapes"
		],
		answerIndex: 0,
		explanation:
			"Théorème 3.4 : avec α = 1/L, l'écart à l'optimum décroît comme 1/k. Le taux exponentiel e^(−μk/L) est réservé aux fonctions fortement convexes (μ paramètre de forte convexité, L constante de Lipschitz du gradient), et O(1/k²) est le taux accéléré de Nesterov (Algorithme 3.8)."
	},
	{
		id: 'p1-l3-q4',
		tags: ['p1/l3'],
		question:
			'Par rapport au momentum classique, que modifie la méthode de Nesterov, et quel est le gain théorique ?',
		options: [
			'elle utilise un pas constant 1/L doublé',
			'elle supprime le besoin de convexité',
			'elle remplace le gradient par le Hessien',
			'elle évalue le gradient en un point anticipé x̃_k, ce qui donne un taux O(1/k²) au lieu de O(1/k) pour les fonctions convexes'
		],
		answerIndex: 3,
		explanation:
			"Algorithme 3.8 (NAG) : on pose x̃_k = x_k + β(x_k − x_{k−1}) puis on évalue le gradient en ce point « anticipé » plutôt qu'en x_k. Le tableau de synthèse indique O(1/k²) pour Nesterov contre O(1/k) pour le GD et le momentum en théorie : un gain quadratique dans le taux."
	},
	{
		id: 'p1-l3-q5',
		tags: ['p1/l3'],
		question:
			"Parmi les trois stratégies de pas décrites dans la section « Choix du pas d'apprentissage », laquelle garantit la convergence sous les conditions de Robbins–Monro ?",
		options: [
			'le pas constant α_k = α',
			'le pas décroissant, par exemple α_k = α_0/k ou α_0/√k',
			'la recherche linéaire (minimisation de f le long de la direction)',
			'le pas α_k = 2L'
		],
		answerIndex: 1,
		explanation:
			'Le pas décroissant garantit la convergence sous certaines conditions (théorèmes de Robbins–Monro) et est utilisé avec des variantes adaptatives (Adam, RMSprop). Le pas constant est simple mais délicat (trop grand → divergence, trop petit → convergence lente) ; la recherche linéaire est optimale à chaque itération mais coûteuse en calcul.'
	},
	{
		id: 'p1-l3-adam-q1',
		tags: ['p1/l3-adam'],
		question:
			'Dans Adam, que mesure le second moment v_t (moyenne exponentielle du carré élément par élément du gradient) ?',
		options: [
			'la direction courante du gradient',
			"l'échelle récente (magnitude) du gradient, coordonnée par coordonnée",
			'la variance des paramètres',
			'la valeur exacte de la Hessienne'
		],
		answerIndex: 1,
		explanation:
			"v_t = β₂ v_{t−1} + (1−β₂) g_t⊙² : le carré élément par élément empêche les changements de signe de s'annuler (exemple 4.1 : une suite +10, −10, … a une moyenne ≈ 0 mais une moyenne de carrés ≈ 100). Chaque composante de v_t est un second moment brut, et non une variance centrée."
	},
	{
		id: 'p1-l3-adam-q2',
		tags: ['p1/l3-adam'],
		question:
			'Pourquoi Adam divise-t-il ses deux mémoires m_t et v_t par les facteurs (1−β₁^t) et (1−β₂^t) ?',
		options: [
			'pour accélérer la convergence aux itérations finales',
			'pour garantir que les gradients sont centrés',
			'pour normaliser le learning rate α',
			'parce que les mémoires sont initialisées à zéro et ces facteurs corrigent ce biais, surtout aux premiers pas'
		],
		answerIndex: 3,
		explanation:
			"L'initialisation à zéro fait démarrer les mémoires artificiellement basses : avec un gradient constant, m_1 = (1−β₁)g, soit seulement 10 % de la valeur vers laquelle elles devraient tendre si β₁ = 0,9 (exemple 7.1, théorème 7.1). Pour t grand, 1−β^t ≈ 1 et la correction s'estompe : c'est au début qu'elle compte."
	},
	{
		id: 'p1-l3-adam-q3',
		tags: ['p1/l3-adam'],
		question:
			"La section « Adam comme préconditionneur » écrit la mise à jour d'une coordonnée i comme le produit d'un taux effectif α_eff(t,i) = α / (√v_{t,i} + ε) et d'une direction lissée. Qu'adapte réellement Adam ?",
		options: [
			'le learning rate global α, choisi automatiquement',
			'la Hessienne, approximée coordonnée par coordonnée',
			"les taux relatifs entre coordonnées, tandis que α fixe toujours l'échelle globale",
			"le nombre d'itérations de l'algorithme"
		],
		answerIndex: 2,
		explanation:
			"« Adam adapte automatiquement le learning rate » est l'une des idées fausses les plus fréquentes : Adam adapte les pas relativement entre coordonnées, mais le facteur global α reste fixé par l'utilisateur ou par un scheduler. Et ce préconditionneur est essentiellement diagonal, construit à partir des gradients passés : Adam n'est pas une approximation de la Hessienne (callout « Ce n'est pas Newton »)."
	},
	{
		id: 'p1-l3-adam-q4',
		tags: ['p1/l3-adam'],
		question:
			'Après 10 000 itérations à gradients grands, le problème entre dans une région où les gradients deviennent très petits. Si β₂ est très proche de 1, que peut-il se passer ?',
		options: [
			"Adam s'adapte immédiatement, car un β₂ proche de 1 raccourcit la mémoire",
			"la mémoire de v_t conserve longtemps l'échelle grande, et le pas effectif reste trop petit",
			'la correction du biais devient infinie',
			'le terme ε devient dominant et fait exploser les mises à jour'
		],
		answerIndex: 1,
		explanation:
			"La longueur de mémoire est approximativement N ≈ 1/(1−β₂) : un β₂ proche de 1 donne une mémoire longue (exercice 3 : « la mémoire de v_t ne disparaît pas immédiatement »). L'échelle mémorisée sous l'ancien régime persiste et retarde l'adaptation — c'est le compromis stabilité contre adaptabilité de la section β₁, β₂ et ε."
	},
	{
		id: 'p1-l3-adam-q5',
		tags: ['p1/l3-adam'],
		question:
			"Par rapport à l'ajout d'une pénalité L2 directement dans la fonction objectif, que change AdamW ?",
		options: [
			'rien : les deux formulations sont identiques',
			'il supprime la correction du biais',
			'il découple le weight decay : les paramètres sont contractés par le facteur (1−αλ), indépendamment de la normalisation adaptative',
			'il remplace le premier moment m_t par le second moment v_t'
		],
		answerIndex: 2,
		explanation:
			"Avec Adam + L2, le terme λθ entre dans le gradient puis passe dans les mécanismes adaptatifs d'Adam : la renormalisation par le second moment atténue la pénalité des poids qui reçoivent de grands gradients de tâche. AdamW applique la contraction (1−αλ)θ_{t−1} en dehors de cette normalisation, ce qui restaure une décroissance uniforme (section « Adam vs AdamW »)."
	},
	{
		id: 'p1-l4-q1',
		tags: ['p1/l4'],
		question:
			"Pourquoi le gradient stochastique suit-il globalement la bonne direction alors qu'il n'utilise que le gradient d'un seul exemple (théorème 4.2) ?",
		options: [
			"parce que E[∇f_{i_k}(x)] = ∇f(x) : l'estimateur est sans biais",
			"parce qu'un seul exemple donne toujours le gradient exact",
			'parce que le pas est choisi par recherche linéaire',
			"parce que la variance de l'estimateur est nulle"
		],
		answerIndex: 0,
		explanation:
			"Proposition 3.10 : si l'indice i_k est tiré uniformément dans {1, …, n}, l'espérance du gradient stochastique coïncide avec le gradient exact — chaque pas est bruité, mais le bruit s'annule en moyenne sans biaiser la trajectoire. Le coût d'une itération passe de O(n) (GD) à O(1) (SGD)."
	},
	{
		id: 'p1-l4-q2',
		tags: ['p1/l4'],
		question:
			'Dans le résultat de convergence du SGD (conditions de Robbins–Monro), quel est le rôle de la seconde condition, Σ α_k² < +∞ ?',
		options: [
			"garantir que la somme des pas est assez grande pour parcourir n'importe quelle distance finie",
			'garantir que le bruit accumulé au fil des itérations reste borné',
			'garantir que le pas tend vers une limite strictement positive',
			'garantir la convexité de la fonction objectif'
		],
		answerIndex: 1,
		explanation:
			"La leçon dissocie les deux rôles : Σ α_k = +∞ permet à l'algorithme de parcourir n'importe quelle distance finie depuis son point de départ ; Σ α_k² < +∞ garantit que le bruit stochastique accumulé reste borné et s'amortit. Le pas constant ne satisfait pas la seconde condition (la somme des carrés diverge) et converge seulement vers un voisinage de l'optimum (exemple des plans de décroissance)."
	},
	{
		id: 'p1-l4-q3',
		tags: ['p1/l4'],
		question:
			'La descente coordonnée cyclique converge en O(d/k) (théorème 3.16). Pourquoi le taux dépend-il de la dimension d ?',
		options: [
			'parce que le gradient complet est calculé d fois à chaque itération',
			"parce que la pénalité L1 n'est pas différentiable en 0",
			'parce que la fonction doit être séparable pour appliquer la CD',
			"parce qu'une seule coordonnée est mise à jour exactement à la fois : il faut environ d itérations pour que chaque coordonnée soit mise à jour un nombre comparable de fois"
		],
		answerIndex: 3,
		explanation:
			"Théorème 3.16 : la dépendance linéaire en d est le prix à payer pour n'optimiser qu'une coordonnée à la fois. La CD est particulièrement naturelle quand la fonction se décompose en somme séparable ou quand la régularisation a une forme explicite par coordonnée — pour le Lasso, la mise à jour est le seuillage doux, de coût minime (exemple de la leçon)."
	},
	{
		id: 'p1-l4-q4',
		tags: ['p1/l4'],
		question:
			'Que fait la méthode de Newton sur une fonction quadratique pure f(x) = (1/2) x^T Q x − b^T x ?',
		options: [
			"elle converge en un seul pas, quel que soit le conditionnement, car le modèle de Taylor d'ordre 2 est exact",
			'elle converge en O(1/k) comme la descente de gradient',
			"elle a besoin de l'amortissement d'Armijo pour être garantie",
			'elle est inapplicable, car la Hessienne est singulière'
		],
		answerIndex: 0,
		explanation:
			"Callout « Newton sur un quadratique pur » : pour cette fonction, le modèle de Taylor d'ordre 2 est une égalité valable sur tout l'espace (q(y) ≡ f(y)) et la Hessienne est constante — Newton converge donc en un seul pas, quelle que soit l'inclinaison ou le conditionnement. Sur une fonction non quadratique, plusieurs itérations sont nécessaires, mais le nombre de chiffres corrects double localement (théorème 3.14)."
	},
	{
		id: 'p1-l4-q5',
		tags: ['p1/l4'],
		question:
			'Pourquoi la méthode de Newton exacte est-elle inapplicable à un réseau de neurones avec d ≈ 10⁶ paramètres ?',
		options: [
			'parce que la perte est généralement non convexe',
			"parce que le gradient n'est pas disponible",
			"parce que l'inversion de la Hessienne coûte O(d³) et que sa seule stockage demande d² nombres",
			"parce que la méthode de ne s'applique qu'aux fonctions quadratiques"
		],
		answerIndex: 2,
		explanation:
			"Callout « Limites de Newton en grande dimension » : la Hessienne est une matrice d × d (d² nombres) et son inversion coûte O(d³), contre le coût linéaire O(d) d'un pas de gradient ou de CD. Pour d = 10⁶ elle est tout simplement inapplicable : on utilise alors du Quasi-Newton (BFGS, L-BFGS), le gradient conjugué non linéaire ou des approximations diagonales de la Hessienne (comme dans Adam)."
	},
	{
		id: 'p1-syn-q1',
		tags: ['p1/synthese'],
		question:
			"D'après le théorème 1.3 (CNO), si f est différentiable sur un ouvert Ω et que x* est un minimum local, que peut-on conclure ?",
		options: [
			'∇f(x*) = 0',
			'le Hessien en x* est semi-défini positif',
			'x* est nécessairement un minimum global',
			'x* est un minimum local strict'
		],
		answerIndex: 0,
		explanation:
			"La condition nécessaire du premier ordre ne garantit que l'annulation du gradient."
	},
	{
		id: 'p1-syn-q2',
		tags: ['p1/synthese'],
		question:
			"En un point x*, le gradient s'annule et le Hessien est semi-défini positif. Que peut-on conclure ?",
		options: [
			'x* est forcément un minimum local',
			'la condition nécessaire du second ordre est satisfaite, mais x* peut encore être un point-selle',
			'x* est un minimum local strict',
			'x* est un minimum global'
		],
		answerIndex: 1,
		explanation:
			"L'exemple 1.10 montre qu'un Hessien semi-défini positif n'est pas suffisant pour garantir un minimum."
	},
	{
		id: 'p1-syn-q3',
		tags: ['p1/synthese'],
		question: 'Soit f convexe et différentiable sur un ouvert convexe Ω. Que dit le théorème 1.7 ?',
		options: [
			'∇f(x*) = 0 implique que x* est un minimum local',
			'tout minimum de f est unique',
			'f est nécessairement coercive',
			'∇f(x*) = 0 si et seulement si x* est un minimum global de f'
		],
		answerIndex: 3,
		explanation:
			"En contexte convexe, la CNO devient nécessaire et suffisante pour l'optimalité globale."
	},
	{
		id: 'p1-syn-q4',
		tags: ['p1/synthese'],
		question:
			'La fonction f(x) = x⁴ − x² possède deux minima globaux en ±1/√2 et un maximum local en 0. Que montre cet exemple ?',
		options: [
			"la convexité est nécessaire pour qu'une fonction ait un minimum global",
			"la CNO n'est pas vérifiée aux minima globaux",
			'une fonction peut posséder des minima globaux sans être convexe',
			'le Hessien est toujours défini positif aux minima globaux'
		],
		answerIndex: 2,
		explanation:
			"La convexité est suffisante mais non nécessaire pour l'existence d'un minimum global."
	},
	{
		id: 'p1-syn-q5',
		tags: ['p1/synthese'],
		question:
			"Quelle combinaison d'hypothèses garantit qu'une fonction f définie sur Ω possède au moins un minimum global ?",
		options: [
			'f continue, Ω fermé et non vide, et f coercive ou Ω compact',
			'f continue et coercive, Ω quel que soit le sous-ensemble',
			'f différentiable avec ∇f = 0 en un point',
			'f convexe, Ω ouvert'
		],
		answerIndex: 0,
		explanation: "C'est le théorème de Weierstrass généralisé (1.12)."
	},
	{
		id: 'p1-syn-q6',
		tags: ['p1/synthese'],
		question:
			"Si le Hessien d'une fonction en un point critique est défini positif (H ≻ 0), que peut-on affirmer ?",
		options: [
			'Le point est un minimum global',
			'Le point est un minimum local strict',
			'Le point est un point-selle',
			'Le point est un maximum local'
		],
		answerIndex: 1,
		explanation: "C'est la condition suffisante du second ordre (CSSO)."
	},
	{
		id: 'p1-syn-q7',
		tags: ['p1/synthese'],
		question: 'Une fonction strictement convexe qui admet un minimum global voit ce minimum être :',
		options: ['Nécessairement nul', 'Non unique', 'Uniquement local', 'Unique'],
		answerIndex: 3,
		explanation: "La stricte convexité interdit l'existence de deux minima globaux distincts."
	},
	{
		id: 'p1-syn-q8',
		tags: ['p1/synthese'],
		question: "Laquelle de ces fonctions n'est PAS coercive sur ℝ ?",
		options: ['f(x) = x⁴ + 1', 'f(x) = x² + sin(x)', 'f(x) = eˣ', 'f(x) = x² + 5'],
		answerIndex: 2,
		explanation: "L'exponentielle tend vers 0 en -∞, elle n'est donc pas coercive."
	},
	{
		id: 'p1-syn-q9',
		tags: ['p1/synthese'],
		question: 'Quelle propriété est conservée par la somme de deux fonctions convexes ?',
		options: ['La différentiabilité', 'La convexité', "L'unicité du minimum", 'La coercivité'],
		answerIndex: 1,
		explanation: 'La somme de fonctions convexes est toujours convexe.'
	},
	{
		id: 'p1-syn-q10',
		tags: ['p1/synthese'],
		question: "Pourquoi la régularisation Ridge (L2) garantit-elle l'unicité du minimum ?",
		options: [
			"Parce qu'elle rend la fonction coercive",
			"Parce qu'elle rend la Hessienne définie positive (H ≻ 0)",
			"Parce qu'elle annule le gradient",
			"Parce qu'elle simplifie la fonction de perte"
		],
		answerIndex: 1,
		explanation:
			"L'ajout de λ||w||² rend la Hessienne définie positive, rendant la fonction strictement convexe."
	},
	{
		id: 'p1-syn-q11',
		tags: ['p1/synthese'],
		question:
			'Concernant la descente de gradient (GD), que signifie un conditionnement élevé (κ >> 1) ?',
		options: [
			'Une convergence très rapide',
			'Un minimum global garanti',
			"Un phénomène d'oscillation et une convergence lente",
			"L'absence de point critique"
		],
		answerIndex: 2,
		explanation:
			"Un fort conditionnement crée des 'vallées' étroites où le gradient oscille sans progresser rapidement."
	},
	{
		id: 'p1-syn-q12',
		tags: ['p1/synthese'],
		question:
			"Quel est l'avantage principal du SGD (Stochastic Gradient Descent) par rapport au GD Batch ?",
		options: [
			'Une convergence plus stable',
			'Un coût computationnel par itération beaucoup plus faible',
			"L'absence de bruit stochastique",
			'Une garantie de convergence vers le minimum global'
		],
		answerIndex: 1,
		explanation:
			'SGD traite un seul échantillon (ou mini-batch) au lieu de n, réduisant la complexité par itération.'
	},
	{
		id: 'p1-syn-q13',
		tags: ['p1/synthese'],
		question:
			"Quelle est la complexité computationnelle typique d'une itération de la méthode de Newton en dimension d ?",
		options: ['O(d)', 'O(d²)', 'O(d³)', 'O(nd)'],
		answerIndex: 2,
		explanation:
			"L'inversion de la Hessienne (ou la résolution du système linéaire) coûte typiquement O(d³)."
	},
	{
		id: 'p1-syn-q14',
		tags: ['p1/synthese'],
		question: 'Le Momentum de Polyak permet principalement de :',
		options: [
			'Remplacer le calcul du gradient',
			'Accélérer la convergence en amortissant les oscillations',
			'Éviter tout minimum local',
			"Supprimer le besoin d'un pas d'apprentissage (learning rate)"
		],
		answerIndex: 1,
		explanation:
			"Le momentum utilise l'inertie des gradients passés pour lisser la trajectoire et accélérer dans les directions constantes."
	},
	{
		id: 'p1-syn-q15',
		tags: ['p1/synthese'],
		question: "La méthode de Nesterov (NAG) s'améliore par rapport au Momentum classique en :",
		options: [
			'Ignorant le gradient actuel',
			'Calculant le gradient au point anticipé par le momentum',
			'Utilisant un pas constant',
			"Évitant l'utilisation de la vitesse"
		],
		answerIndex: 1,
		explanation:
			"NAG calcule le gradient après avoir appliqué l'inertie, permettant une correction plus fine."
	},
	{
		id: 'p1-syn-q16',
		tags: ['p1/synthese'],
		question: 'Quelle est la caractéristique principale de la Descente Coordonnée (CD) ?',
		options: [
			"L'optimisation de toutes les variables simultanément",
			"L'optimisation d'une seule coordonnée à la fois",
			"L'utilisation systématique de la Hessienne",
			"L'absence de pas d'apprentissage"
		],
		answerIndex: 1,
		explanation:
			"CD minimise la fonction le long d'un seul axe à chaque étape, ce qui est efficace pour les fonctions séparables."
	},
	{
		id: 'p1-syn-q17',
		tags: ['p1/synthese'],
		question:
			"L'infimum d'une fonction peut-il être atteint même si la fonction n'est pas coercive ?",
		options: [
			'Jamais',
			'Oui, si le domaine est compact',
			'Oui, si la fonction est convexe',
			'Seulement si le gradient est nul partout'
		],
		answerIndex: 1,
		explanation:
			"Le théorème de Weierstrass classique garantit l'atteinte du minimum sur un compact, même sans coercivité."
	},
	{
		id: 'p1-syn-q18',
		tags: ['p1/synthese'],
		question: 'Pour une fonction quadratique, la méthode de Newton converge en :',
		options: ['Une seule itération', 'O(1/k) itérations', 'O(log(1/ε)) itérations', 'Temps infini'],
		answerIndex: 0,
		explanation:
			'Newton utilise une approximation quadratique exacte ; si la fonction est quadratique, il trouve le minimum en un pas.'
	},
	{
		id: 'p1-syn-q19',
		tags: ['p1/synthese'],
		question: 'La perte logistique (logistic loss) est-elle convexe ?',
		options: [
			'Non, elle est concave',
			'Oui, elle est convexe',
			'Seulement si les données sont linéairement séparables',
			'Seulement en dimension 1'
		],
		answerIndex: 1,
		explanation:
			"La perte logistique est une composition d'une fonction convexe et d'une application affine, donc convexe."
	},
	{
		id: 'p1-syn-q20',
		tags: ['p1/synthese'],
		question: "Quel est le risque principal d'un pas d'apprentissage (learning rate) trop élevé ?",
		options: [
			'Une convergence trop rapide',
			'Une divergence ou des oscillations instables',
			'Une stagnation immédiate au point de départ',
			'Une réduction du bruit stochastique'
		],
		answerIndex: 1,
		explanation:
			"Un pas trop grand peut 'sauter' par-dessus le minimum et conduire la fonction vers l'infini."
	}
];
