import type { QuizQuestion } from '../types.js';

export const PART4: QuizQuestion[] = [
	{
		id: 'p4-l1-q1',
		tags: ['p4/l1'],
		question:
			'Sous l’hypothèse (H1) (X de plein rang), l’estimateur des moindres carrés β̂ est la solution unique des équations normales :',
		options: [
			'XᵀXβ̂ = XᵀY, c’est-à-dire β̂ = (XᵀX)⁻¹XᵀY',
			'Xβ̂ = Y, c’est-à-dire β̂ = X⁻¹Y',
			'β̂ = (XXᵀ)⁻¹Y',
			'β̂ minimise ‖Xβ‖²'
		],
		answerIndex: 0,
		explanation:
			'β̂ minimise SCR = ‖Y − Xβ‖² ; en annulant la dérivée, on obtient les équations normales XᵀXβ̂ = XᵀY, inversibles si (H1) (StatM1S1_2025, « Moindres carrés »).'
	},
	{
		id: 'p4-l1-q2',
		tags: ['p4/l1'],
		question:
			'On note SCE = ‖Ŷ − ȳ1‖², SCR = ‖Y − Ŷ‖² et SCT = ‖Y − ȳ1‖². L’identité fondamentale des sommes de carrés est :',
		options: ['SCT = SCE + SCR', 'SCE = SCT + SCR', 'SCT = SCE − SCR', 'SCT² = SCE² + SCR²'],
		answerIndex: 0,
		explanation:
			'« SCT = SCE + SCR » (StatM1S1_2025, « Sommes de carrés ») : Y se décompose orthogonalement en partie expliquée Ŷ − ȳ1 et partie résiduelle Y − Ŷ.'
	},
	{
		id: 'p4-l1-q3',
		tags: ['p4/l1'],
		question: 'Le coefficient de détermination R² = SCE/SCT mesure :',
		options: [
			'la part de la variation de Y expliquée par le modèle de régression',
			'la part de la variation de Y attribuée aux résidus',
			'l’écart-type de la variable réponse',
			'le rapport des variances des résidus et des valeurs ajustées'
		],
		answerIndex: 0,
		explanation:
			'« R² = SCE/SCT … la part de variation de Y expliquée par le modèle de régression » (StatM1S1_2025) ; on a aussi R² = 1 − SCR/SCT.'
	},
	{
		id: 'p4-l1-q4',
		tags: ['p4/l1'],
		question: 'Sous les hypothèses (H1) et (H2), la matrice de variance-covariance de β̂ est :',
		options: ['σ²(XᵀX)⁻¹', 'σ²(XᵀX)', 'σ²Xᵀ(XᵀX)⁻¹', '(XᵀX)⁻¹, indépendamment de σ²'],
		answerIndex: 0,
		explanation:
			'Théorème de Gauss-Markov (StatM1S1_2025) : β̂ est sans biais, Var(β̂) = σ²(XᵀX)⁻¹, et c’est le meilleur estimateur linéaire sans biais (BLUE).'
	},
	{
		id: 'p4-l2-q1',
		tags: ['p4/l2'],
		question:
			'Dans un modèle d’ANOVA, si l’on ne contraint pas les paramètres du facteur, la matrice de design n’est pas de plein rang. La conséquence est :',
		options: [
			'les paramètres ne sont pas identifiables, mais les valeurs ajustées Ŷ = Xβ̂ restent uniques',
			'aucun estimateur ne peut être calculé',
			'les valeurs ajustées dépendent du logiciel utilisé',
			'le R² n’est plus défini'
		],
		answerIndex: 0,
		explanation:
			'Les contraintes (sans intercept / de référence / somme) rendent X de plein rang : les paramètres changent avec le codage, pas l’ajustement (ModèleLinéaire_ANOVA_ANCOVA, « Les contraintes dans les modèles d’ANOVA »).'
	},
	{
		id: 'p4-l2-q2',
		tags: ['p4/l2'],
		question:
			'Avec le codage de référence (niveau 1, en R : contr.treatment), β0 et βj (j ≥ 2) représentent respectivement :',
		options: [
			'la moyenne de la réponse au niveau 1 ; l’écart de la moyenne du niveau j à celle du niveau 1',
			'la moyenne globale ; la moyenne du niveau j',
			'l’écart du niveau 1 à la moyenne globale ; la moyenne du niveau j',
			'la variance de la réponse au niveau 1 ; l’effet du niveau j'
		],
		answerIndex: 0,
		explanation:
			'« β0 valeur moyenne de la réponse dans le niveau 1 ; βj : écart de la réponse du niveau j au niveau 1 » (ModèleLinéaire_ANOVA_ANCOVA, « Choix d’une référence »).'
	},
	{
		id: 'p4-l2-q3',
		tags: ['p4/l2'],
		question: 'Avec le codage somme (contrainte Σⱼ βⱼ = 0, en R : contr.sum), β0 + βj représente :',
		options: [
			'la valeur moyenne de la réponse au niveau j',
			'l’écart entre le niveau j et le niveau 1',
			'la part de la variation expliquée par le facteur',
			'0 pour tout j'
		],
		answerIndex: 0,
		explanation:
			'Dans ce codage, « β0 moyenne des paramètres » et « β0 + βj : valeur moyenne de la réponse du niveau j » (ModèleLinéaire_ANOVA_ANCOVA, « Somme des paramètres »).'
	},
	{
		id: 'p4-l2-q4',
		tags: ['p4/l2'],
		question:
			'Dans un modèle d’ANOVA à deux facteurs sans interaction (additif), l’effet d’un niveau du facteur F1 :',
		options: [
			'est le même quel que soit le niveau de F2 (droites parallèles dans le graphique d’interaction)',
			'dépend du niveau de F2 (les droites du graphique d’interaction se croisent)',
			'n’a de sens que si F1 et F2 sont indépendantes',
			'est systématiquement nul'
		],
		answerIndex: 0,
		explanation:
			'Additivité des effets principaux : « αi : effet du niveau i de F1 quelque soit le niveau j de F2 » (ModèleLinéaire_ANOVA_ANCOVA, « ANOVA à 2 facteurs »).'
	},
	{
		id: 'p4-l3-q1',
		tags: ['p4/l3'],
		question:
			"L'intervalle de confiance à 95 % de βj se construit comme β̂j ± (quantile 97,5 % de la loi de Student à (n−p−1) degrés de liberté) fois :",
		options: [
			"l’écart-type estimé de β̂j, soit σ̂√((XᵀX)⁻¹)jj",
			"l’écart-type estimé σ̂ des erreurs",
			"le levier hii de l’observation j",
			"l’écart-type estimé de l’intercept σ̂√((XᵀX)⁻¹)00"
		],
		answerIndex: 0,
		explanation:
			'StatM1S1_2025 §6.5 ; exemple longley : t5(97,5 %) = 2,57058 et IC(β1) = [0,02089 ; 0,15547].'
	},
	{
		id: 'p4-l3-q2',
		tags: ['p4/l3'],
		question: "Dans le test emboîté de H₀ : β1 = 0 (q = 1), la statistique de Fisher F :",
		options: [
			'est le carré de la statistique de Student t pour β1 : les deux tests aboutissent à la même décision',
			'suit une loi de Fisher à (1, n−1) degrés de liberté',
			'est indépendante de la statistique t',
			"ne peut pas se calculer sans estimer σ² par la méthode des maximum de vraisemblance"
		],
		answerIndex: 0,
		explanation:
			'« Dans le cas particulier où q = 1 (on teste alors β1 = 0), la F-statistique est alors le carré de la t-statistique (Student) de l’inférence sur un paramètre, et conduit donc au même test » (StatM1S1_2025 §6.7).'
	},
	{
		id: 'p4-l3-q3',
		tags: ['p4/l3'],
		question:
			'Le test global H₀ : β1 = ··· = βp = 0 utilise F = (SCE/p)/(SCR/(n−p−1)). Sous (H1), (H2) et H₀, la statistique F suit :',
		options: [
			'une loi de Fisher à (p, n−p−1) degrés de liberté',
			'une loi de Fisher à (p, n) degrés de liberté',
			'une loi de Student à (n−p−1) degrés de liberté',
			'une loi du χ² à p degrés de liberté'
		],
		answerIndex: 0,
		explanation:
			'StatM1S1_2025 §6.6 : « suit une loi de Fisher Fp,n−p−1 à p et (n − p − 1) degrés de liberté » ; le tableau d’ANOVA (régression / erreur / total) en donne la lecture.'
	},
	{
		id: 'p4-l3-q4',
		tags: ['p4/l3'],
		question:
			"L'intervalle de prévision pour une nouvelle observation en x₀ s'écrit ŷ₀ ± t·σ̂√(1 + v₀ᵀ(XᵀX)⁻¹v₀). Le terme « 1 » supplémentaire par rapport à l'intervalle de confiance de la moyenne provient :",
		options: [
			'de la variance σ² de l’erreur aléatoire ε₀ de la nouvelle observation',
			'du levier de x₀ dans l’échantillon',
			'd’un quantile de Student plus large',
			'du nombre p de régresseurs'
		],
		answerIndex: 0,
		explanation:
			'StatM1S1_2025 §6.8 : la nouvelle réponse Y₀ = v₀ᵀβ + ε₀ apporte la variance σ² de son erreur, d’où le terme (1 + v₀ᵀ(XᵀX)⁻¹v₀).'
	},
	{
		id: 'p4-l4-q1',
		tags: ['p4/l4'],
		question:
			'Le VIF d’un régresseur Xj vaut VIFj = 1/(1−Rj²), où Rj² est le R² de la régression de Xj sur les autres régresseurs. Règle courante du cours : colinéarité forte si',
		options: ['VIFj > 10 (c’est-à-dire Rj² > 0,9)', 'VIFj > 1', 'VIFj > 500', 'VIFj > 100'],
		answerIndex: 0,
		explanation:
			'« Règle courante : On estime qu’il y a une forte colinéarité lorsque VIFj > 10 (c’est-à-dire Rj² > 0.9) » (8.validation_du_modele_lineaire_2025).'
	},
	{
		id: 'p4-l4-q2',
		tags: ['p4/l4'],
		question:
			"L'indice de conditionnement κ mesure le mauvais conditionnement de XᵀX. Règle courante du cours : colinéarité trop forte si",
		options: ['κ > 500', 'κ > 50', 'κ > 5000', 'κ < 1'],
		answerIndex: 0,
		explanation:
			'« Règle courante : κ > 500 => Colinéarité trop forte » (8.validation_du_modele_lineaire_2025, section sur le conditionnement).'
	},
	{
		id: 'p4-l4-q3',
		tags: ['p4/l4'],
		question:
			'Le levier hii (diagonale de la hat-matrix H = X(XᵀX)⁻¹Xᵀ) satisfait 0 ≤ hii ≤ 1 et Σᵢ hii = p+1. En pratique, l’observation i est un point levier si',
		options: ['hii > 2(p+1)/n', 'hii > (p+1)/n', 'hii > 1', 'hii > n/(p+1)'],
		answerIndex: 0,
		explanation:
			'« On dit en général que i est un point levier si hii > 2(p+1)/n » (8.validation_du_modele_lineaire_2025 §8.5) : deux fois la valeur moyenne (p+1)/n des leviers.'
	},
	{
		id: 'p4-l4-q4',
		tags: ['p4/l4'],
		question:
			'Le cours distingue observation aberrante (résidu studentisé élevé), point levier (hii élevé) et observation influente (distance de Cook Di élevée). Il prévient notamment que',
		options: [
			'un point atypique n’est pas forcément influent',
			'chaque point aberrant est influent',
			'la distance de Cook Di ne dépend que du levier hii',
			'un point levier est toujours un point aberrant'
		],
		answerIndex: 0,
		explanation:
			'« Attention, un point atypique n’est pas forcément influent ! » (8.validation_du_modele_lineaire_2025) ; Di = hii·ri²/((p+1)(1−hii)²) combine levier et résidu standardisé.'
	},
	{
		id: 'p4-syn-q1',
		tags: ['p4/synthese', 'p4/l5'],
		question:
			'Pourquoi le R² ne peut-il servir de critère de sélection de modèles entre modèles de dimensions différentes ?',
		options: [
			'il n’est comparable qu’à dimension égale : ajouter une variable augmente toujours (faiblement) le R², ce qui sélectionne le modèle le plus complexe et conduit au sur-ajustement',
			'il est biaisé sous l’hypothèse (H1)',
			'il n’est défini que pour les modèles sans intercept',
			'il suppose des erreurs gaussiennes'
		],
		answerIndex: 0,
		explanation:
			'« Le R² ne peut être un bon critère de sélection de modèles ; il ne peut servir qu’à comparer des modèles de même dimension car sinon conduit à sélectionner le modèle le plus complexe … et conduit donc au sur-ajustement » (9.choix_de_modele).'
	},
	{
		id: 'p4-syn-q2',
		tags: ['p4/synthese', 'p4/l5'],
		question:
			'Le Cp de Mallows s’écrit Cp = ‖ε̂‖²/σ̂² − (n − 2(p+1)), avec σ̂² estimé sur le modèle complet. Pour le modèle complet (p+1 paramètres), Cp vaut toujours',
		options: ['p + 1', '0', 'n', 'p'],
		answerIndex: 0,
		explanation:
			'« Pour le modèle complet, qui a (p+1) paramètres, nous avons donc toujours : Cp = p+1 » (9.choix_de_modele) ; on cherche des modèles réduits avec Cp proche de (k+1).'
	},
	{
		id: 'p4-syn-q3',
		tags: ['p4/synthese', 'p4/l5'],
		question:
			'AIC = −2 log L̂ + 2k et BIC = −2 log L̂ + k log n (k paramètres estimés). Pour n grand, le BIC tend à sélectionner des modèles plus parcimonieux que l’AIC car',
		options: [
			'sa pénalité k log n croît avec n et dépasse 2k dès que log n > 2',
			'il pénalise en plus le terme d’intercept',
			'il est calculé sur la somme des carrés des résidus',
			'il sous-estime toujours la log-vraisemblance'
		],
		answerIndex: 0,
		explanation:
			'Même log-vraisemblance maximisée pour les deux critères : la différence vient de la force de la pénalité, k log n contre 2k (9.choix_de_modele, §AIC/BIC).'
	},
	{
		id: 'p4-syn-q4',
		tags: ['p4/synthese', 'p4/l1'],
		question:
			'Le cours note que σ̂²MV = ‖Y − Xβ̂‖²/n « n’est pas sans biais ». On préfère σ̂² = ‖ε̂‖²/(n−p−1) car',
		options: [
			'les n résidus ne sont pas libres (p+1 contraintes des équations normales) : E[‖ε̂‖²] = (n−p−1)σ²',
			'σ̂²MV surestime systématiquement σ²',
			'σ̂²MV n’est pas fonction des résidus',
			"l'estimateur β̂ est biaisé"
		],
		answerIndex: 0,
		explanation:
			'« σ̂²MV = ‖ε̂‖²/n, qui n’est pas sans biais. On préférera donc plutôt l’estimateur sans biais σ̂² » (StatM1S1_2025 §5.5) : il faut diviser par le nombre de degrés de liberté n−p−1.'
	}
];
