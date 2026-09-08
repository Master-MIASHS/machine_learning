import type { QuizQuestion } from '../types.js';

export const PART10: QuizQuestion[] = [
	{
		id: 'p10-l1-q1',
		tags: ['p10/l1'],
		question:
			"Pourquoi la leçon dit-elle que la perte 0-1 n'est pas directement optimisable par descente de gradient ?",
		options: [
			"Parce qu'elle n'est pas bornée",
			"Parce qu'elle est non convexe, discontinue et que son gradient est nul presque partout",
			"Parce qu'elle dépend de la dimension VC",
			"Parce qu'elle est trop facile à calculer"
		],
		answerIndex: 1,
		explanation: 'Ces propriétés empêchent un gradient de fournir une direction de descente utile.'
	},
	{
		id: 'p10-l1-q2',
		tags: ['p10/l1'],
		question: 'Si y = +1 et f(x) = -3, la marge t = y f(x) vaut :',
		options: ['-3', '3', '0', '+1'],
		answerIndex: 0,
		explanation:
			'La marge est négative, ce qui signifie que le signe de f(x) est opposé à y et que le classifieur se trompe.'
	},
	{
		id: 'p10-l1-q3',
		tags: ['p10/l1'],
		question: "La perte charnière utilisée par le SVM s'écrit :",
		options: ['log(1 + exp(-t))', 'exp(-t)', 'max(0, 1 - y f(x))', '(1 - y f(x))²'],
		answerIndex: 2,
		explanation: 'La leçon associe la charnière max(0, 1 - y f(x)) au SVM.'
	},
	{
		id: 'p10-l1-q4',
		tags: ['p10/l1'],
		question: 'La perte logistique et la cross-entropy sont :',
		options: [
			'deux pertes sans rapport avec la marge',
			'identiques uniquement pour les réseaux très profonds',
			'deux approximations différentes de la perte 0-1',
			'identiques à un changement de convention près entre étiquettes -1/+1 et 0/1'
		],
		answerIndex: 3,
		explanation:
			'La leçon montre que la cross-entropy redonne la perte logistique sous ce changement de convention.'
	},
	{
		id: 'p10-l2-q1',
		tags: ['p10/l2'],
		question:
			"Pour une perte convexe positive, le Théorème 4.1 affirme qu'elle est calibrée si et seulement si :",
		options: [
			"phi'(0) > 0",
			'phi(0) = 0',
			"elle est différentiable en 0 et phi'(0) < 0",
			'C_phi(0, eta) est toujours linéaire'
		],
		answerIndex: 2,
		explanation: "C'est le critère local de calibration de Bartlett, Jordan et McAuliffe (2006)."
	},
	{
		id: 'p10-l2-q2',
		tags: ['p10/l2'],
		question: "Dans la preuve, la dérivée du risque conditionnel C_phi en 0 s'écrit :",
		options: ["(2 eta - 1) phi'(0)", "eta phi'(0)", "phi'(0) / (2 eta - 1)", "(1 - 2 eta) phi'(0)"],
		answerIndex: 0,
		explanation:
			"Ce signe dépend de (2 eta - 1) et de phi'(0), ce qui place le minimiseur du bon côté de 0."
	},
	{
		id: 'p10-l2-q3',
		tags: ['p10/l2'],
		question: 'Pour la perte logistique, la pente en 0 vaut :',
		options: ['-1', '-2', '0', '-1/2'],
		answerIndex: 3,
		explanation: "La leçon calcule phi'(t) = -exp(-t)/(1 + exp(-t)), donc phi'(0) = -1/2."
	},
	{
		id: 'p10-l2-q4',
		tags: ['p10/l2'],
		question: "La perte charnière est calibrée malgré son point d'angle parce que :",
		options: [
			"son point d'angle est en 0",
			"son point d'angle est en 1, donc elle est différentiable en 0 avec une pente négative",
			'sa pente en 0 est positive',
			'elle vaut 0 pour toutes les marges'
		],
		answerIndex: 1,
		explanation:
			"La leçon souligne que la charnière a son point d'angle en t = 1, pas en 0, et que sa pente en 0 est -1."
	},
	{
		id: 'p10-l3-q1',
		tags: ['p10/l3'],
		question: 'Dans la décomposition A + B + C du Théorème 4.2, le terme A correspond à :',
		options: [
			"l'écart d'approximation entre le minimiseur global et le classifieur de Bayes",
			"l'écart d'estimation dû à l'utilisation d'un échantillon fini",
			'le coût de la restriction à la classe F',
			'la variance du gradient stochastique'
		],
		answerIndex: 1,
		explanation:
			"A mesure l'écart entre le modèle appris sur l'échantillon et le meilleur modèle de la classe pour le phi-risque."
	},
	{
		id: 'p10-l3-q2',
		tags: ['p10/l3'],
		question: "Le terme B s'annule dès que :",
		options: [
			'f** ∈ F',
			"phi'(0) > 0",
			"la taille de l'échantillon est petite",
			'le terme A est négatif'
		],
		answerIndex: 0,
		explanation:
			"B mesure le coût de la restriction à F ; la leçon indique qu'il est nul si le minimiseur global f** appartient à F."
	},
	{
		id: 'p10-l3-q3',
		tags: ['p10/l3'],
		question: "Le terme C s'annule lorsque :",
		options: [
			'f** ∈ F',
			"la taille de l'échantillon est grande",
			'F est une classe finie',
			'la perte phi est calibrée'
		],
		answerIndex: 3,
		explanation:
			"C mesure l'écart entre le minimiseur global du phi-risque et le classifieur de Bayes ; une perte calibrée rend ce terme nul."
	},
	{
		id: 'p10-l3-q4',
		tags: ['p10/l3'],
		question: "Si phi est calibrée et si f** ∈ F, l'excès de risque 0-1 se réduit à :",
		options: ['A + B', 'B + C', 'A seul', 'A + C'],
		answerIndex: 2,
		explanation: "Dans ce cas favorable, B et C sont nuls, il ne reste que le terme d'estimation A."
	},
	{
		id: 'p10-syn-q1',
		tags: ['p10/synthese'],
		question: "Comment la leçon reformule-t-elle le problème de classification par la marge ?",
		options: [
			"On cherche f : X → ℝ avec h_f(x) = sgn(f(x)) et des étiquettes Y ∈ {-1, +1} ; la marge t = y f(x) est positive quand le signe est bon et |t| mesure la confiance ; la perte de substitution s'écrit ℓ_φ(f(x), y) = φ(y f(x)) avec φ : ℝ → ℝ_+.",
			"On cherche directement h : X → {0, 1} et la perte s'écrit φ(h(x) - y), sans score réel.",
			"La marge t = y f(x) est négative quand la prédiction est bonne, et φ : ℝ → ℝ_+ est la probabilité a posteriori de la classe.",
			"La marge est t = |f(x) - y| et la perte de substitution s'écrit φ(f(x) + y)."
		],
		answerIndex: 0,
		explanation:
			"Cette reformulation par le score réel f et la marge t = y f(x) est le pont entre la perte 0-1, non optimisable, et les pertes proxy convexes : toutes les pertes usuelles ne dépendent de (x, y) que par la marge."
	},
	{
		id: 'p10-syn-q2',
		tags: ['p10/synthese'],
		question: 'Que montre la vérification φ_{0-1}(t) = 1_{t < 0} ?',
		options: [
			"Que la perte 0-1 est une perte de substitution au sens propre — ℓ = 1_{yf(x) < 0} = 1_{sgn f(x) ≠ y} — la seule, hélas, qui ne puisse pas s'optimiser.",
			"Que la perte 0-1 n'est pas une perte de substitution et doit être traitée en dehors du cadre.",
			'Que φ_{0-1} est convexe et calibrée, donc optimisable par descente de gradient.',
			"Que la perte 0-1 s'optimise exactement par descente de gradient lorsque f est linéaire."
		],
		answerIndex: 0,
		explanation:
			"La leçon vérifie que la 0-1 s'écrit bien φ(y f(x)) : elle appartient au cadre des pertes de substitution, mais y est l'unique perte non convexe, discontinue, de gradient nul presque partout — d'où le recours aux pertes proxy."
	},
	{
		id: 'p10-syn-q3',
		tags: ['p10/synthese'],
		question: "Comment la leçon définit-elle le φ-risque et le φ-risque de Bayes ?",
		options: [
			'R_φ(f) = E[φ(Y f(X))], espérance sur (X, Y) de loi P, et R_φ* = inf sur toutes les fonctions f : X → ℝ de R_φ(f).',
			'R_φ(f) = (1/n) Σ φ(y_i f(x_i)) sur un échantillon fixé, et R_φ* = min de R_φ sur la classe H.',
			'R_φ(f) = E[φ(f(X)) - Y], et R_φ* = 0 par définition.',
			'R_φ(f) = P(sgn f(X) ≠ Y), et R_φ* est le risque de Bayes 0-1.'
		],
		answerIndex: 0,
		explanation:
			"Le φ-risque est l'espérance de la perte de substitution sous la distribution (X, Y), et R_φ* est son infimum sur toutes les fonctions de score réelles : c'est l'analogue du risque de Bayes pour la perte φ, que la calibration relie ensuite au risque 0-1."
	},
	{
		id: 'p10-syn-q4',
		tags: ['p10/synthese'],
		question: 'Selon le tableau des quatre pertes usuelles, à quels algorithmes sont associées la perte exponentielle et la perte carrée (Brier) ?',
		options: [
			'La perte exponentielle e^{-t} à AdaBoost, et la perte carrée (1 - t)² à la classification par moindres carrés (least-squares classification).',
			'La perte exponentielle au SVM, et la perte carrée à la régression logistique.',
			'La perte exponentielle au k-NN, et la perte carrée à AdaBoost.',
			'La perte exponentielle à AdaBoost, et la perte carrée au SVM.'
		],
		answerIndex: 0,
		explanation:
			'Le tableau associe : logistique log(1 + e^{-t}) → régression logistique / deep learning ; charnière max(0, 1 - t) → SVM ; exponentielle e^{-t} → AdaBoost ; carrée (1 - t)² → least-squares classification.'
	},
	{
		id: 'p10-syn-q5',
		tags: ['p10/synthese'],
		question: 'Que vérifie la leçon sur les quatre pertes usuelles au voisinage de 0 ?',
		options: [
			"Les quatre sont convexes et vérifient φ'(0) < 0 ; la charnière, non différentiable en t = 1, est néanmoins différentiable en t = 0, où sa pente vaut -1.",
			'Les quatre sont linéaires au voisinage de 0, de pente 0.',
			"Toutes sauf la charnière vérifient φ'(0) < 0, la charnière n'étant pas différentiable en 0.",
			"Seule la perte logistique vérifie φ'(0) < 0."
		],
		answerIndex: 0,
		explanation:
			"C'est la propriété commune qui annonce le critère de calibration de la leçon suivante (Théorème 4.1) : la non-différentiabilité de la charnière est en t = 1, pas en 0, donc elle y est différentiable avec pente -1 et le critère s'applique sans ambiguïté."
	},
	{
		id: 'p10-syn-q6',
		tags: ['p10/synthese'],
		question: "Quel est le mécanisme de l'équivalence entre perte logistique et cross-entropy, selon l'exercice de la leçon ?",
		options: [
			"Avec ỹ = (y+1)/2 et 1 - σ(t) = σ(-t), on obtient ℓ_CE(ỹ, f(x)) = log(1 + e^{-(2ỹ-1)f(x)}) : les deux pertes coïncident à un changement de convention d'étiquettes près, et minimiser la cross-entropy revient à maximiser la vraisemblance, P(Y=1|X=x) = σ(f(x)).",
			'Les deux pertes sont identiques sans aucun changement de variables, pour les étiquettes -1/+1.',
			"L'équivalence n'est vraie que si σ(t) = t, c'est-à-dire hors de la sigmoïde.",
			'La cross-entropy est la perte logistique composée avec l\'exponentielle, sans lien avec la vraisemblance.'
		],
		answerIndex: 0,
		explanation:
			"L'exercice développe les deux cas ỹ = 1 (ℓ_CE = -log σ(f(x)) = log(1 + e^{-f(x)})) et ỹ = 0 (ℓ_CE = -log(1 - σ(f(x))) = log(1 + e^{f(x)})) en utilisant 1 - σ(t) = σ(-t) : la cross-entropy est exactement la perte logistique sous le changement de convention ỹ = (y+1)/2, et sa minimisation est la maximisation de la vraisemblance du modèle logistique."
	},
	{
		id: 'p10-syn-q7',
		tags: ['p10/synthese'],
		question: "Quelle est la définition formelle d'une perte calibrée, selon la leçon ?",
		options: [
			'Une perte φ convexe et positive est calibrée si, pour toute suite (f_n) de fonctions mesurables, R_φ(f_n) → R_φ* entraîne R(h_{f_n}) → R*.',
			'Une perte est calibrée si elle est convexe et vérifie φ(0) = 0.',
			"Une perte est calibrée si φ'(0) < 0, sans aucune hypothèse de convexité.",
			"Une perte est calibrée si elle s'annule quand t → +∞."
		],
		answerIndex: 0,
		explanation:
			"Autrement dit : minimiser le φ-risque conduit bien à minimiser le risque 0-1 — toute suite de modèles qui amène le φ-risque vers sa borne inférieure amène aussi le risque 0-1 vers la sienne ; la convexité et la positivité font partie de l'hypothèse."
	},
	{
		id: 'p10-syn-q8',
		tags: ['p10/synthese'],
		question: "Quel est le risque conditionnel C_φ, et comment s'écrit R_φ(f) par la loi des espérances totales ?",
		options: [
			'C_φ(α, η) = ηφ(α) + (1 - η)φ(-α), avec η(x) = P(Y=1|X=x), et R_φ(f) = E_X[C_φ(f(X), η(X))].',
			'C_φ(α, η) = ηφ(α) - (1 - η)φ(-α), et R_φ(f) = E[φ(f(X))] sans conditionnement.',
			'C_φ(α, η) = φ(α - η), et R_φ(f) = E_X[φ(f(X) - η(X))].',
			'C_φ(α, η) = max(ηφ(α), (1 - η)φ(-α)), et R_φ(f) est un sup, pas une espérance.'
		],
		answerIndex: 0,
		explanation:
			"En conditionnant sur X, la perte espérée pour un score α au point où la probabilité a posteriori vaut η est le mélange ηφ(α) + (1 - η)φ(-α) ; la loi des espérances totales ramène le φ-risque global à l'espérance, sur X, du risque conditionnel — le même schéma que pour le classifieur de Bayes de la Partie VII."
	},
	{
		id: 'p10-syn-q9',
		tags: ['p10/synthese'],
		question: "Qu'est-ce que la calibration ponctuelle exige du minimiseur du risque conditionnel ?",
		options: [
			'Que tout minimiseur α*(η) de α ↦ C_φ(α, η) vérifie : η > 1/2 ⟺ argmin C_φ(·, η) ⊂ ℝ₊*, et η < 1/2 ⟺ argmin C_φ(·, η) ⊂ ℝ₋* — le signe du prédicteur optimal pour φ coïncide avec celui du classifieur de Bayes.',
			'Que C_φ(α, η) soit strictement croissant en α pour tout η.',
			'Que le minimiseur soit unique pour tout η, y compris η = 1/2.',
			'Que argmin C_φ(·, η) = {0} pour tout η ≠ 1/2.'
		],
		answerIndex: 0,
		explanation:
			"La calibration ponctuelle est la condition « au bon signe » : le score optimal doit être strictement positif quand la classe 1 est majoritaire et strictement négatif sinon ; la preuve du Théorème 4.1 montre qu'une perte convexe positive est calibrée si et seulement si elle est différentiable en 0 avec φ'(0) < 0."
	},
	{
		id: 'p10-syn-q10',
		tags: ['p10/synthese'],
		question: 'Dans la direction (⇒) de la preuve du Théorème 4.1, que montre le passage à la limite η → 1/2⁺ ?',
		options: [
			"Que la différentiabilité de φ en 0 n'est pas supposée mais démontrée : la limite donne le sandwich φ'₋(0) ≤ φ'₊(0) ≤ φ'₋(0), d'où φ'₊(0) = φ'₋(0), puis φ'(0) < 0.",
			'Que φ doit être linéaire au voisinage de 0.',
			'Que la convexité de φ est nécessairement stricte.',
			"Que φ'(0) = 0 est le bon critère de calibration."
		],
		answerIndex: 0,
		explanation:
			"La calibration impose, pour tout η > 1/2, ηφ'₊(0) - (1-η)φ'₋(0) < 0 ; en η → 1/2⁺ on obtient φ'₊(0) ≤ φ'₋(0), tandis que la convexité donne toujours φ'₋(0) ≤ φ'₊(0) : le sandwich prouve la différentiabilité en 0, et le signe de (C_φ)'(0) = (2η-1)φ'(0) pour η > 1/2 donne φ'(0) < 0."
	},
	{
		id: 'p10-syn-q11',
		tags: ['p10/synthese'],
		question: "Quelles sont les valeurs de φ'(0) pour les pertes exponentielle et carrée (Brier) ?",
		options: [
			"Exponentielle : φ'(0) = -1 ; carrée (Brier) : φ'(0) = -2.",
			"Exponentielle : φ'(0) = -1/2 ; carrée (Brier) : φ'(0) = -1.",
			'Exponentielle : φ\'(0) = 1 ; carrée (Brier) : φ\'(0) = 2.',
			"Exponentielle : φ'(0) = 0 ; carrée (Brier) : φ'(0) = -1."
		],
		answerIndex: 0,
		explanation:
			'La leçon calcule les quatre pentes : logistique -1/2, charnière -1, exponentielle -1, carrée -2 — toutes négatives, donc les quatre pertes usuelles sont calibrées (Théorème 4.1).'
	},
	{
		id: 'p10-syn-q12',
		tags: ['p10/synthese'],
		question: "Selon la leçon, quelle particularité distingue la perte carrée (Brier) des trois autres pertes usuelles ?",
		options: [
			"Elle est la seule qui ne s'annule pas quand t → +∞ : elle croît comme t² et pénalise donc aussi les grandes marges correctes (défaut connu du moindres carrés), tandis que la charnière vaut 0 dès t ≥ 1.",
			'Elle est la seule non convexe des quatre.',
			"Elle est la seule dont φ'(0) > 0.",
			"Elle n'est définie que pour t ≤ 0."
		],
		answerIndex: 0,
		explanation:
			'Logistique, charnière et exponentielle deviennent négligeables pour les grandes marges correctes ; la Brier, (1 - t)², continue à croître comme t² : elle pénalise même les prédictions correctes très confiantes — le défaut connu de la classification par moindres carrés.'
	},
	{
		id: 'p10-syn-q13',
		tags: ['p10/synthese'],
		question: 'Que montrent les contre-exemples de la démo de la leçon, φ(t) = t² et φ(t) = (1+t)² (illustratifs, hors du support du cours) ?',
		options: [
			"φ(t) = t² a φ'(0) = 0 : le minimiseur du risque conditionnel reste collé à 0 quelle que soit η ; φ(t) = (1+t)² a φ'(0) = 2 > 0 : le minimiseur a le mauvais signe des deux côtés de η = 1/2 — le critère φ'(0) < 0 n'est pas une curiosité formelle.",
			'Que les deux pertes sont calibrées, ce qui invalide le Théorème 4.1.',
			'Que φ(t) = t² est calibrée et (1+t)² ne l\'est pas : seul le signe de φ(0) compte.',
			'Que les deux pertes donnent le même minimiseur α*(η) pour tout η.'
		],
		answerIndex: 0,
		explanation:
			'Ces contre-exemples (donnés par la démo de la leçon, au-delà du support du cours) montrent les deux façons d\'échouer au critère : pente nulle en 0 (aucun signe, jamais) et pente positive (mauvais signe, toujours) — d\'où l\'importance du signe strict φ\'(0) < 0.'
	},
	{
		id: 'p10-syn-q14',
		tags: ['p10/synthese'],
		question: "Dans la décomposition du Théorème 4.2, que mesurent les termes B et C, et pourquoi leur nom est-il contre-intuitif ?",
		options: [
			'B est le « terme de calibration », nul si f** ∈ F (piloté par la classe F) ; C est le « terme d\'approximation », nul si φ est calibrée (piloté par la perte) — l\'inverse de l\'intuition.',
			'B est piloté par la perte φ et C par la classe F.',
			'B et C mesurent la même quantité, dans un ordre différent.',
			'B est le terme d\'estimation et C le terme d\'approximation.'
		],
		answerIndex: 0,
		explanation:
			'Convention de la leçon et de la source : B = R(h_{f*}) - R(h_{f**}) s\'annule quand le minimiseur global f** appartient à F — c\'est donc la classe qui le pilote ; C = R(h_{f**}) - R* s\'annule quand φ est calibrée — c\'est donc la perte qui le pilote.'
	},
	{
		id: 'p10-syn-q15',
		tags: ['p10/synthese'],
		question: 'Quels sont les trois objets en compétition mis en place avant le Théorème 4.2 ?',
		options: [
			'f̂_F(S_n) (le modèle appris sur l\'échantillon, minimiseur du φ-risque empirique sur F), f* (le meilleur modèle de F pour le φ-risque, minimiseur de R_φ sur F) et f** (le minimiseur global du φ-risque, x ↦ argmin C_φ(α, η(x))).',
			'f̂ (le classifieur de Bayes), f* (le classifieur k-NN) et f** (le SVM).',
			'Les trois objets sont des risques, pas des fonctions : R̂, R* et R**.',
			'f̂, f* et f** sont définis sans la classe F, qui n\'entre que dans le terme A.'
		],
		answerIndex: 0,
		explanation:
			'La mise en place oppose le modèle qu\'on apprend (f̂_F sur l\'échantillon), le meilleur modèle disponible dans la classe (f* pour le φ-risque) et le meilleur modèle en absolu (f**, dont le φ-risque de Bayes est R_φ* = R_φ(f**)) : les termes A, B, C mesurent les écarts successifs de cette chaîne.'
	}
];
