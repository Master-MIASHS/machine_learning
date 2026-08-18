#import "config/config.typ": mobile-config

#show: mobile-config.with(
  title: [Théorie de l'Apprentissage \ Statistique],
  subtitle: "MIASHS M1 - Semestre 2"
)
#let argmin = $op("arg min", limits: #true)$
#let E = $bb(E)$
#let P = $bb(P)$
#set box(width: 100%)
#set block(width: 100%)

#outline(depth: 1)

= Introduction

On se place dans le cadre de l'apprentissage supervisé binaire (même si on mentionnera rapidement la régression). On dispose d'un espace d'entrée $cal(X)$ (typiquement $RR^d$) et d'un espace de sortie $cal(Y) = {0,1}$. Les données sont des couples $(X, Y) in cal(X) times cal(Y)$ tirés i.i.d. selon une distribution inconnue $P_(X,Y)$.

On cherche à apprendre un *classifieur* $h : cal(X) -> cal(Y)$ qui prédit correctement l'étiquette $Y$ à partir de l'observation $X$. La qualité d'un classifieur est mesurée par son *risque théorique* :
$ L(h) = E[ell(h(X), Y)] $
où $ell : cal(Y) times cal(Y) -> RR_+$ est une fonction de perte. Pour la perte 0-1, $ell(y, hat(y)) = bb(1)_{y != hat(y)}$, le risque vaut simplement $P(h(X) != Y)$.

La distribution $P_(X,Y)$ étant inconnue, on ne peut pas calculer $L(h)$ directement. On dispose seulement d'un échantillon fini $cal(S)_n = {(X_i, Y_i)}_(i=1)^n$ i.i.d., à partir duquel on substitue au risque théorique le *risque empirique* :
$ R_n (h) = 1/n sum_(i=1)^n ell(h(X_i), Y_i) $
Minimiser $R_n (h)$ sans contrainte sur $h$ conduit au surapprentissage : un classifieur qui mémorise $cal(S)_n$ obtient $R_n (h) = 0$ mais ne généralise pas. On restreint donc la recherche à une *classe de fonctions* $cal(H) subset cal(Y)^(cal(X))$ et on résout le *principe de minimisation du risque empirique* (ERM) :
$ hat(h)_n = arg min_(h in cal(H)) R_n (h) $

Ce cours étudie les fondements théoriques de cette démarche selon trois axes : le *prédicteur de Bayes* (classifieur optimal sous connaissance parfaite de $P_(X,Y)$), la *consistance et les bornes de généralisation* (dans quelle mesure $hat(h)_n$ approche-t-il ce classifieur optimal quand $n -> +oo$), et la *calibration des fonctions de perte* (comment substituer à la perte 0-1, non optimisable, une perte proxy convexe sans perdre les garanties théoriques).

= Prédicteurs optimaux de Bayes

== Le cadre de la décision Bayesienne

En apprentissage supervisé, nous cherchons à minimiser le risque théorique $L(h) = E[ell(h(X), Y)]$. Le prédicteur qui atteint la valeur minimale de ce risque est appelé *prédicteur de Bayes*, noté $h^*$.

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 1.1 (Classifieur de Bayes)*

  Pour la perte 0-1 ($ell(y, hat(y)) = bb(1)_{y != hat(y)}$), le classifieur optimal en $x$ est donné par :
  $ h^*(x) = cases(1 &"si " eta(x) >= 1/2, 0 &"sinon") $
  où $eta(x) = P(Y=1 | X=x)$ est la probabilité a posteriori.
]

*Démonstration :*

Soit $h : cal(X) -> {0, 1}$ un classifieur mesurable quelconque. On cherche à minimiser le risque :
$ R(h) = E[bb(1)_{h(X) != Y}] = P(h(X) != Y) $

*Étape 1 — Décomposition par conditionnement.*

Par la loi des espérances totales :
$ R(h) = E_X [E[bb(1)_{h(X) != Y} | X]] = E_X [r(h(X), X)] $
où l'on a posé le risque conditionnel $r(hat(y), x) = P(hat(y) != Y | X = x)$ pour une décision $h(x) in {0,1}$.

Puisque $R(h) = E_X [r(h(X), X)]$ et que $r(dot, x) >= 0$ pour tout $x$, minimiser $R(h)$ revient à minimiser $r(h(x), x)$ *pour presque tout* $x$ (au sens de la loi de $X$). On peut donc raisonner point par point.

*Étape 2 — Calcul explicite du risque conditionnel.*

Pour $x$ fixé, la variable $Y | X = x$ est de Bernoulli de paramètre $eta(x)$. On calcule $r(a, x)$ pour chaque décision possible :

- Si $a = 1$ :
$ r(1, x) = P(Y != 1 | X = x) = P(Y = 0 | X = x) = 1 - eta(x) $

- Si $a = 0$ :
$ r(0, x) = P(Y != 0 | X = x) = P(Y = 1 | X = x) = eta(x) $

*Étape 3 — Minimisation ponctuelle.*

La décision optimale en $x$ est :
$ h^*(x) = argmin_(a in {0,1}) r(a, x) $

On choisit $a = 1$ si et seulement si $r(1, x) <= r(0, x)$, c'est-à-dire :
$ 1 - eta(x) <= eta(x) <=> 1 <= 2 eta(x) <=> eta(x) >= 1/2 $

D'où :
$ h^*(x) = cases(1 &"si " eta(x) >= 1/2, 0 &"sinon") $

*Étape 4 — Optimalité globale.*

Montrons que $h^*$ minimise bien $R(h)$ parmi *tous* les classifieurs. Soit $h$ un classifieur quelconque. On a :
$ R(h) - R(h^*) = E_X [r(h(X), X) - r(h^*(X), X)] $

Par construction de $h^*$, on a $r(h^*(x), x) <= r(a, x)$ pour tout $a in {0,1}$ et pour tout $x$. Donc :
$ r(h(x), x) - r(h^*(x), x) >= 0 quad forall x $

Par positivité de l'espérance :
$ R(h) - R(h^*) = E_X [underbrace(r(h(X), X) - r(h^*(X), X), >= 0)] >= 0 $

Ainsi $R(h^*) <= R(h)$ pour tout classifieur $h$ mesurable. $qed$

*Remarque :* Le risque de Bayes (risque minimal atteignable) vaut :
$ R^* = R(h^*) = E_X [min(eta(X), 1 - eta(X))] $

On vérifie que $R^* = 0$ si et seulement si $eta(x) in {0, 1}$ p.s., c'est-à-dire quand le problème est séparable (la règle de décision est déterministe et sans erreur).
== Cas de la régression

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 1.2 (Prédicteurs optimaux en régression)*

  1. *Erreur quadratique ($L_2$)* : $ell(y, hat(y)) = (y - hat(y))^2$. Le prédicteur optimal est la *moyenne conditionnelle* :
  $ h^*(x) = E[Y | X=x] $
  2. *Erreur absolue ($L_1$)* : $ell(y, hat(y)) = |y - hat(y)|$. Le prédicteur optimal est la *médiane conditionnelle* de $Y$ sachant $X=x$.
]

=== Preuve pour la perte $L_2$

Soit $h : cal(X) -> RR$ un prédicteur mesurable. On cherche à minimiser :
$ R(h) = E[(Y - h(X))^2] $

*Étape 1 — Conditionnement.*

Par la loi des espérances totales :
$ R(h) = E_X [E[(Y - h(X))^2 | X]] $

Comme pour la classification, minimiser $R(h)$ revient à minimiser $E[(Y - h(x))^2 | X = x]$ pour presque tout $x$. On pose $m(x) = E[Y | X = x]$ et on fixe $x$.

*Étape 2 — Décomposition biais-variance conditionnelle.*

Pour toute constante $c in RR$, on écrit $Y - c = (Y - m(x)) + (m(x) - c)$, d'où :
$ E[(Y - c)^2 | X = x] =& E[(Y - m(x) + m(x) - c)^2 | X = x] \
=& E[(Y - m(x))^2 | X = x] + 2(m(x) - c) \
&underbrace(E[Y - m(x) | X = x], = 0)\
&+ (m(x) - c)^2 $

Le terme croisé est nul car $E[Y - m(x) | X = x] = E[Y|X=x] - m(x) = 0$. On obtient donc :
$ E[(Y - c)^2 | X = x] = underbrace(E[(Y - m(x))^2 | X = x], "ne dépend pas de " c) + underbrace((m(x) - c)^2, >= 0) $

*Étape 3 — Minimisation.*

Le second terme $(m(x) - c)^2 >= 0$ est minimisé (et annulé) uniquement pour $c = m(x)$. Donc :
$ h^*(x) = arg min_(c in RR) E[(Y-c)^2 | X=x] = m(x) = E[Y | X=x] $

*Étape 4 — Optimalité globale.*

Pour tout prédicteur $h$, on repart de la décomposition de l'étape 2 appliquée avec $c = h(x)$ :
#text(16pt)[$ E[(Y - h(x))^2 | X = x] = E[(Y - m(x))^2 | X = x] + (m(x) - h(x))^2 $]

En prenant l'espérance par rapport à $X$ :
$ R(h) &= E_X [E[(Y - h(X))^2 | X]] \
       &= E_X [E[(Y - m(X))^2 | X]] + E_X [(m(X) - h(X))^2] \
       &= R(h^*) + E_X [(m(X) - h(X))^2] $

Donc :
$ R(h) - R(h^*) = E_X [(m(X) - h(X))^2] >= 0 $

avec égalité si et seulement si $h(x) = m(x)$ pour presque tout $x$ (au sens de la loi de $X$). $qed$

=== Preuve pour la perte $L_1$

Soit $h : cal(X) -> RR$ un prédicteur mesurable. On cherche à minimiser :
$ R(h) = E[ |Y - h(X)| ] $

Par le même argument de conditionnement, on minimise pour presque tout $x$ :
$ g(c) = E[ |Y - c| | X = x] $

*Étape 1 — Dérivation de $g$.*

On suppose que $Y | X = x$ admet une densité conditionnelle $f_(Y|x)$. Alors :
$ g(c) &= integral_(-oo)^(+oo) |y - c| f_(Y|x)(y) dif y \
  &= integral_(-oo)^(c) (c - y) f_(Y|x)(y) dif y + integral_(c)^(+oo) (y - c) f_(Y|x)(y) dif y $

On dérive sous le signe intégrale (théorème de Leibniz) :
$ g'(c) &= integral_(-oo)^(c) f_(Y|x)(y) dif y - integral_(c)^(+oo) f_(Y|x)(y) dif y \
  &= F_(Y|x)(c) - (1 - F_(Y|x)(c)) = 2F_(Y|x)(c) - 1 $

*Étape 2 — Condition d'optimalité.*

$g'(c) = 0$ donne $F_(Y|x)(c) = 1/2$, soit $c = "Med"(Y | X = x)$, la médiane conditionnelle.

On vérifie qu'il s'agit bien d'un minimum : $g''(c) = 2 f_(Y|x)(c) >= 0$, donc $g$ est convexe et la médiane est bien un minimiseur global.

= Consistance et convergence

== Consistance

=== Définition

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition 1.2 (Consistance)*

  Soit $(h_n)_(n >= 1)$ une suite de classifieurs appris sur un échantillon
  $cal(S)_n = {(X_i, Y_i)}_(i=1)^n$ i.i.d. de loi $P_(X,Y)$. On dit que
  $(h_n)$ est :

  - *consistant en probabilité* si :
    $ forall epsilon > 0, quad P(R(h_n) - R^* > epsilon) attach(->, t: n -> +oo) 0 $

    - *consistant en moyenne quadratique* si :
    $ E[(R(h_n) - R^*)^2] attach(->, t: n -> +oo) 0 $

    - *fortement consistant* si :
    $ P(lim_(n -> +oo) R(h_n) = R^*) = 1 $

  où $R^* = R(h^*) = E_X [min(eta(X), 1 - eta(X))]$ est le risque de Bayes.
]

Les trois notions sont de force croissante : consistance p.s. $=>$ consistance
en probabilité, et consistance en moyenne quadratique $=>$ consistance en
probabilité.

=== Pourquoi cette notion est-elle centrale ?

Le risque $R(h_n)$ se décompose naturellement en deux termes :
$ R(h_n) - R^* = underbrace(R(h_n) - inf_(h in cal(H)) R(h),
  "terme d'estimation") + underbrace(inf_(h in cal(H)) R(h) - R^*,
  "terme d'approximation") $

- Le *terme d'approximation* (ou biais) mesure la capacité de la classe $cal(H)$
  à approcher le classifieur de Bayes. Il est nul si $h^* in cal(H)$, et ne
  dépend pas des données.

- Le *terme d'estimation* mesure l'écart entre le meilleur classifieur
  théorique dans $cal(H)$ et celui effectivement appris sur $cal(S)_n$.
  Il tend vers 0 quand $n -> +oo$ sous des conditions de régularité sur $cal(H)$.

La consistance requiert que la somme de ces deux termes tende vers 0.

=== Consistance universelle

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition 1.3 (Consistance universelle)*

  Un algorithme est dit *universellement consistant* si $(h_n)$ est consistant
  pour *toute* distribution $P_(X,Y)$ sur $cal(X) times {0,1}$, sans hypothèse
  sur $eta(x)$.
]

C'est une propriété bien plus forte : elle garantit que l'algorithme converge
vers le risque de Bayes quelle que soit la structure du problème. Le résultat
fondamental de Stone (1977) établit que les $k$-plus proches voisins avec
$k = k(n) -> +oo$ et $k(n)/n -> 0$ sont universellement consistants.

== Consistance du classifieur k-NN

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 2.1 (Consistance universelle de Stone, 1977)*

  Soit $(X_i, Y_i)_(i=1)^n$ un échantillon i.i.d. de loi $P_(X,Y)$ sur
  $RR^d times {0,1}$. Si le paramètre $k = k(n)$ vérifie :
  $ k(n) attach(->, t: n -> +oo) +oo quad "et" quad k(n)/n attach(->, t: n -> +oo) 0 $

  alors le classifieur $k$-NN est universellement consistant :
  $ forall P_(X,Y), quad E[R(h_n^(k"-NN"))] attach(->, t: n -> +oo) R^* $
]

*Intuition de la preuve :* $k arrow.r infinity$ permet de réduire la variance de l'estimation locale de $eta(x)$ par la loi des grands nombres. $k/n arrow.r 0$ garantit que les voisins sont de plus en plus proches de $x$ (réduction du biais), capturant ainsi la valeur locale de la fonction de régression.

#block(
  fill: rgb("#ffe0f0"),
  inset: 10pt,
  radius: 4pt,
)[
  *Exercice 2.1*
  Pourquoi ne peut-on pas prendre $k$ fixe (ex: $k=1$) pour assurer la consistance ?
  *Indice :* Calculez l'erreur de 1-NN quand $n arrow.r infinity$ en fonction de l'erreur de Bayes $L^*$.
]

= Inégalités de concentration et Généralisation
== Inégalités fondamentales
L'apprentissage repose sur notre capacité à borner l'écart entre risque
empirique $R_n (h)$ et risque théorique $R(h)$. Les inégalités de concentration
quantifient la probabilité qu'une variable aléatoire s'écarte de son espérance.

=== Inégalité de Markov

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème (Inégalité de Markov)*

  Soit $Z$ une variable aléatoire réelle positive ($Z >= 0$ p.s.) et $t > 0$.
  Alors :
  $ P(Z >= t) <= E[Z] / t $
]

*Démonstration :*

On minore $Z$ par la variable aléatoire $t bb(1)_(Z >= t)$ :
$ Z >= t bb(1)_(Z >= t) quad "p.s." $

Cette inégalité se vérifie en distinguant deux événements :

- Sur l'événement ${Z >= t}$ : l'indicatrice vaut $1$, donc
  $t bb(1)_(Z >= t) = t <= Z$, l'inégalité tient.

- Sur l'événement ${Z < t}$ : l'indicatrice vaut $0$, donc
  $t bb(1)_(Z >= t) = 0 <= Z$, l'inégalité tient par positivité de $Z$.

En prenant l'espérance, qui préserve l'inégalité :
$ E[Z] >= E[t bb(1)_(Z >= t)] = t E[bb(1)_(Z >= t)] = t P(Z >= t) $

On divise par $t > 0$ :
$ P(Z >= t) <= E[Z] / t $ $qed$

*Remarque :* La positivité de $Z$ est essentielle. Pour une variable signée,
on peut appliquer Markov à $|Z|$ ou $(Z - E[Z])^2$.

=== Inégalité de Bienaymé-Tchebychev

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème (Inégalité de Bienaymé-Tchebychev)*

  Soit $Z$ une variable aléatoire réelle de variance finie. Pour tout
  $epsilon > 0$ :
  $ P(|Z - E[Z]| >= epsilon) <= "Var"(Z) / epsilon^2 $
]

*Démonstration :*

On applique l'inégalité de Markov à la variable aléatoire positive
$(Z - E[Z])^2$ avec le seuil $t = epsilon^2$ :
$ P((Z - E[Z])^2 >= epsilon^2) <= E[(Z - E[Z])^2] / epsilon^2 = "Var"(Z) / epsilon^2 $

Or les événements $(Z - E[Z])^2 >= epsilon^2$  et $|Z - E[Z]| >= epsilon $
sont identiques, d'où :
$ P(|Z - E[Z]| >= epsilon) <= "Var"(Z) / epsilon^2 $ $qed$

=== Application : consistance en probabilité de la moyenne empirique

Ces deux inégalités suffisent à établir la consistance de la moyenne empirique,
qui est le prototype de la convergence du risque empirique vers le risque
théorique.

Soit $Z_1, dots, Z_n$ i.i.d. de moyenne $mu = E[Z_1]$ et de variance
$sigma^2 = "Var"(Z_1) < +oo$. On pose $overline(Z)_n = 1/n sum_(i=1)^n Z_i$.

Par linéarité de l'espérance : $E[overline(Z)_n] = mu$.

Par indépendance : $"Var"(overline(Z)_n) = sigma^2 / n$.

Par Bienaymé-Tchebychev :
$ P(|overline(Z)_n - mu| >= epsilon) <= sigma^2 / (n epsilon^2)
  attach(->, t: n -> +oo) 0 $

Donc $overline(Z)_n attach(->, t: P) mu$. En particulier, le risque empirique
$R_n (h) = 1/n sum_(i=1)^n ell(h(X_i), Y_i)$ vérifie pour tout $h$ fixé :
$ P(|R_n (h) - R(h)| >= epsilon) <= frac(R(h)(1 - R(h)), (n epsilon^2))
  <= 1 / (4 n epsilon^2) $

où on a utilisé que $"Var"(bb(1)_(h(X) != Y)) = R(h)(1-R(h)) <= 1/4$.

*Limitation :* Cette borne est valable pour $h$ *fixé*. Elle ne contrôle pas
l'écart $sup_(h in cal(H)) |R_n (h) - R(h)|$ sur une classe entière de
classifieurs, ce qui est pourtant ce dont on a besoin en apprentissage puisqu'on ne prend pas un $h$ arbitraire mais qu'on doit choisir parmi $cal(H)$. C'est
l'objet de la théorie de Vapnik-Chervonenkis.

== Majoration de l'erreur de généralisation : cas fini

On suppose ici $|cal(H)| < +oo$. C'est le cadre le plus simple, mais il
illustre déjà les deux ingrédients fondamentaux : concentration et union bound.

=== Cas séparable

On dit que $cal(H)$ est *réalisable* (ou que le problème est *séparable*)
s'il existe $h^* in cal(H)$ tel que $R(h^*) = 0$, c'est-à-dire que le
classifieur de Bayes appartient à $cal(H)$ et qu'il ne fait pas d'erreur.

Dans ce cas, on n'a pas besoin d'inégalités de concentration : un argument
purement combinatoire suffit.

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 3.1 (Cas séparable, $|cal(H)| < +oo$)*

  On suppose qu'il existe $h^* in cal(H)$ tel que $R(h^*) = 0$
  (hypothèse de réalisabilité). Soit $hat(h)_cal(S)_n$ le minimiseur du risque
  empirique sur un échantillon $cal(S)_n = {(X_i, Y_i)}_(i=1)^n$ i.i.d. de loi
  $P_(X,Y)$ :
  $ hat(h)_cal(S)_n = arg min_(h in cal(H)) R_cal(S)_n (h) $

  Alors pour tout $epsilon > 0$ et tout $delta in (0,1)$ :
  $ P^n (R(hat(h)_cal(S)_n) > epsilon) <= |cal(H)| e^(-n epsilon) $
  où $P^n = P_(X,Y)^(times.o n)$.
  En particulier, pour que cette probabilité soit inférieure à $delta$, il
  suffit que :
  $ n >= log(frac(|cal(H)| , delta)) / epsilon $
]

*Démonstration :*

*Étape 1 — Réduction au cas des échantillons trompeurs.*

Par l'hypothèse de réalisabilité, $h^*$ commet zéro erreur sur tout échantillon,
donc $R_cal(S)_n (h^*) = 0$ p.s. Puisque $hat(h)_cal(S)_n$ minimise le risque empirique,
on a nécessairement $R_cal(S)_n (hat(h)_cal(S)_n) = 0$.

Ainsi, si $R(hat(h)_cal(S)_n) > epsilon$, c'est qu'un classifieur de risque réel
supérieur à $epsilon$ a réussi à obtenir un risque empirique nul — il a
"trompé" l'algorithme. On formalise cela en introduisant :

- L'ensemble des *mauvais classifieurs* :
$ cal(H)_"bad" = {h in cal(H) : R(h) > epsilon} $

- L'ensemble des *échantillons trompeurs* :
$ cal(M) = {cal(S)_n : exists h in cal(H)_"bad", R_cal(S)_n (h) = 0} $

c'est-à-dire l'ensemble des échantillons sur lesquels au moins un mauvais
classifieur semble parfait.

Puisque $R_cal(S)_n (hat(h)_cal(S)_n) = 0$, l'événement ${R(hat(h)_cal(S)_n) > epsilon}$ implique
que $hat(h)_cal(S)_n in cal(H)_"bad"$, donc que $cal(S)_n in cal(M)$. On a l'inclusion :
$ {cal(S)_n : R(hat(h)_cal(S)_n) > epsilon} subset cal(M) $

et donc :
$ P^n ({cal(S)_n : R(hat(h)_cal(S)_n) > epsilon}) <= P^n (cal(M)) $

*Étape 2 — Union bound.*

On réécrit $cal(M)$ comme une union :
$ cal(M) = union.big_(h in cal(H)_"bad") {cal(S)_n : R_cal(S)_n (h) = 0} $

Par l'_union bound_ ($P(A union B) <= P(A) + P(B)$, généralisé) :
$ P^n (cal(M))&=P^n (union.big_(h in cal(H)_"bad") {cal(S)_n : R_cal(S)_n (h) = 0}) \ &<= sum_(h in cal(H)_"bad") P^n ({cal(S)_n : R_cal(S)_n (h) = 0}) $

*Étape 3 — Borne sur chaque terme.*

Soit $h in cal(H)_"bad"$, donc $R(h) > epsilon$. Les observations étant
i.i.d., la probabilité que $h$ ne commette aucune erreur sur $S$ est :
$ P^n (R_cal(S)_n (h) = 0) &= P^n (forall i in {1, dots, n}, h(X_i) = Y_i)
  \ &= product_(i=1)^n P(h(X_i) = Y_i) = (1 - R(h))^n $

Puisque $R(h) > epsilon$ et en utilisant $1 - x <= e^(-x)$ pour $x in [0,1]$ :
$ (1 - R(h))^n < (1 - epsilon)^n <= e^(-n epsilon) $

*Étape 4 — Conclusion.*

En combinant les étapes 2 et 3 :
$ P^n (R(hat(h)_cal(S)_n) > epsilon) <= sum_(h in cal(H)_"bad") e^(-n epsilon)
  <= |cal(H)_"bad"| dot e^(-n epsilon) <= |cal(H)| e^(-n epsilon) $

En posant $delta = |cal(H)| e^(-n epsilon)$ et en résolvant pour $n$ :
$ e^(-n epsilon) = frac(delta , |cal(H)|) => n = log(frac(|cal(H)| , delta)) / epsilon $

Donc, $R(hat(h)_cal(S)_n) > epsilon)$, avec probabilité au plus $delta$ si $n >= log(frac(|cal(H)| , delta)) / epsilon$. $qed$

*Remarque :* Le terme $log |cal(H)|$ est le coût de la recherche dans $cal(H)$ :
plus la classe est grande, plus il faut de données pour garantir que le
minimiseur empirique est bon. Ce coût est cependant seulement *logarithmique*
en $|cal(H)|$ — doubler la taille de $cal(H)$ ne coûte qu'une observation
supplémentaire (à $epsilon$ et $delta$ fixés). Notons cependant, que lorsqu'on fait de la sélection de paramètres, la taille de $cal(H)$ croît *exponentiellement* avec le nombre de paramètres.

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Corollaire (Cas séparable, $|cal(H)| < +oo$)*

  On suppose qu'il existe $h^* in cal(H)$ tel que $R(h^*) = 0$
  (hypothèse de réalisabilité). Soit $hat(h)_S$ le minimiseur du risque
  empirique sur un échantillon $cal(S)_n = {(X_i, Y_i)}_(i=1)^n$ i.i.d. de loi
  $P_(X,Y)$ :
  $ hat(h)_cal(S)_n = arg min_(h in cal(H)) R_cal(S)_n (h) $

  Alors, pour tout $delta in (0,1)$, avec probabilité $1-delta$, l'inégalité suivante est satisfaite~:
  $ R(hat(h)_cal(S)_n) <= frac(log(frac(|cal(H)|, delta)), n) $
]
*Démonstration~:*

Laissée en exercice.

=== Cas non séparable

Sans hypothèse de réalisabilité, $hat(h)_S$ peut avoir un risque empirique
non nul, et l'argument précédent s'effondre : il n'y a plus d'échantillons
"trompeurs" au sens strict. On a besoin d'un outil de concentration
quantifiant l'écart entre $R_S (h)$ et $R(h)$ pour un $h$ quelconque.

==== Rappel : inégalité de Hoeffding

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème (Hoeffding, 1963)*

  Soit $Z_1, dots, Z_n$ des variables aléatoires *indépendantes* avec
  $Z_i in [a_i, b_i]$ p.s. Alors pour tout $t > 0$ :
  $ P(1/n sum_(i=1)^n (Z_i - E[Z_i]) >= t)
    <= exp(- (2n^2 t^2) / (sum_(i=1)^n (b_i - a_i)^2)) $

  En particulier, si $Z_i in [0,1]$ p.s. pour tout $i$ (cas homogène) :
  $ P(1/n sum_(i=1)^n Z_i - E[Z_1] >= t) <= e^(-2n t^2) $

  et en appliquant l'inégalité aux deux queues :
  $ P(lr(|1/n sum_(i=1)^n Z_i - E[Z_1]|) >= t) <= 2e^(-2n t^2) $
]

*Application au risque empirique.* Pour $h in cal(H)$ fixé, on pose
$Z_i = bb(1)_(h(X_i) != Y_i) in [0,1]$. Les $Z_i$ sont i.i.d. sous $P^n =
P_(X,Y)^(times.o n)$, avec $E[Z_i] = R(h)$ et $1/n sum_(i=1)^n Z_i =
R_cal(S)_n (h)$. Hoeffding donne alors :
$ P^n (|R_cal(S)_n (h) - R(h)| >= t) <= 2e^(-2n t^2) $

Cette borne vaut pour $h$ *fixé* : elle ne contrôle pas l'écart
$sup_(h in cal(H)) |R_cal(S)_n (h) - R(h)|$ sur toute la classe $cal(H)$,
ce dont on a besoin pour garantir que $hat(h)_cal(S)_n$ est bon.

==== Théorème de généralisation

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 3.2 (Cas non séparable, $|cal(H)| < +oo$)*

  Soit $cal(H)$ fini, $cal(S)_n = {(X_i, Y_i)}_(i=1)^n$ i.i.d. de loi $P_(X,Y)$,
  et $hat(h)_cal(S)_n = arg min_(h in cal(H)) R_cal(S)_n (h)$. Pour tout $delta in (0,1)$,
  avec probabilité $1 - delta$ sous $P^n = P_(X,Y)^(times.o n)$,
  *simultanément* pour tout $h in cal(H)$ :
  $ |R(h) - R_cal(S)_n (h)| <= sqrt((log |cal(H)| + log(2 / delta)) / (2n)) $

  En particulier, le risque réel de $hat(h)_cal(S)_n$ est borné par :
  $ R(hat(h)_cal(S)_n) <= R_cal(S)_n (hat(h)_cal(S)_n) + sqrt((log |cal(H)| + log(2 / delta)) / (2n)) $
]

*Démonstration :*

*Étape 1 — Concentration pour $h$ fixé.*

Pour tout $h in cal(H)$ fixé, l'application de Hoeffding aux variables
i.i.d. $Z_i = bb(1)_(h(X_i) != Y_i) in [0,1]$ donne :
$ P^n (|R_cal(S)_n (h) - R(h)| >= t) <= 2e^(-2n t^2) $

*Étape 2 — Passage à l'uniforme par union bound.*

On cherche à contrôler non pas un $h$ fixé, mais le pire cas sur $cal(H)$ :
$ P^n ({cal(S)_n : exists h in cal(H) &, |R_cal(S)_n (h) - R(h)| >= t}) \
  &= P^n (union.big_(h in cal(H)) {cal(S)_n : |R_cal(S)_n (h) - R(h)| >= t}) $

Par _union bound_ et Hoeffding :
$ P^n ({cal(S)_n : exists h in cal(H) &, |R_cal(S)_n (h) - R(h)| >= t}) \
  &<= sum_(h in cal(H)) P^n ({cal(S)_n : |R_cal(S)_n (h) - R(h)| >= t}) \
  &<= 2|cal(H)| e^(-2n t^2) $

En passant au complémentaire : avec probabilité d'*au moins* $1 - 2|cal(H)| e^(-2n t^2)$
sous $P^n$, on a simultanement pour tout $h in cal(H)$ :
$ |R_cal(S)_n (h) - R(h)| < t $

*Étape 3 — Calibration en $delta$.*

On veut pouvoir calibrer/contrôler la probabilité d'échec via $delta$. On pose :
$ delta = 2|cal(H)| e^(-2n t^2) $

et on résout pour $t$ :
$ e^(-2n t^2) &= delta / (2|cal(H)|)
  <=> 2n t^2 = log(2frac(|cal(H)|,delta)) \
  <=> t &= sqrt(log(2frac(|cal(H)|, delta)) / (2n))
       = sqrt((log|cal(H)| + log(2/delta)) / (2n)) $

Donc avec une probabilité d'au moins $1 - delta$ sous $P^n$, simultanément pour tout
$h in cal(H)$ :
$ |R(h) - R_cal(S)_n (h)| <= sqrt((log |cal(H)| + log(2/delta)) / (2n)) $

*Étape 4 — Application à $hat(h)_S$.*

La borne de l'étape 3 est *uniforme* sur $cal(H)$ : elle tient
simultanément pour tous les $h$, y compris pour $hat(h)_cal(S)_n$ qui est
lui-même une fonction aléatoire de $cal(S)_n$. On peut donc écrire sur
l'événement de probabilité $1 - delta$ :
$ R(hat(h)_cal(S)_n) &= R(hat(h)_cal(S)_n) - R_S (hat(h)_cal(S)_n) + R_S (hat(h)_cal(S)_n) \
  &<= |R(hat(h)_cal(S)_n) - R_cal(S)_n (hat(h)_cal(S)_n)| + R_S (hat(h)_cal(S)_n) \
  &<= R_cal(S)_n (hat(h)_cal(S)_n) + sqrt((log |cal(H)| + log(2/delta)) / (2n)) $ $qed$

*Remarques :*

- *Uniformité.* C'est l'apport central du théorème : la borne tient
  *simultanément* pour tous les $h in cal(H)$, ce qui est indispensable
  puisque $hat(h)_S$ dépend de $cal(S)_n$.

- *Complexité logarithmique.* Le coût du passage de $h$ fixé à
  $sup_(h in cal(H))$ est un facteur $log|cal(H)|$ dans la borne.
  Doubler $|cal(H)|$ ne coûte qu'une constante additive mais $|cal(H)|$ croît souvent *exponentiellement* vite.

- *Vitesse.* La borne est en $O(1/sqrt(n))$, contre une convergence
  $O(1/n)$ dans le cas séparable. C'est le prix à payer pour
  l'absence d'hypothèse de réalisabilité.

- *Interprétation.* La borne $R(hat(h)_cal(S)_n) <= R_cal(S)_n (hat(h)_cal(S)_n) +
  epsilon_n (delta)$ dit que le risque réel de $hat(h)_cal(S)_n$ n'excède
  son risque empirique que d'une quantité $epsilon_n (delta)$ qui tend
  vers 0 quand $n -> +oo$.

== Cas $|cal(H)| = +oo$ : théorie de Vapnik-Chervonenkis
Lorsque $cal(H)$ est infinie (par exemple, l'ensemble des hyperplans de
$RR^d$), la borne du théorème 3.2 est inutilisable car $log|cal(H)| = +oo$.
Il faut une notion de complexité plus fine, qui mesure non pas le cardinal
de $cal(H)$ mais sa capacité à *discriminer* des points.

=== Dimension de Vapnik-Chervonenkis

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition (Brisure)*

  On dit que $cal(H)$ *brise* un ensemble fini $C = {x_1, dots, x_m} subset
  cal(X)$ si pour tout étiquetage $(y_1, dots, y_m) in {0,1}^m$, il existe
  $h in cal(H)$ tel que $h(x_i) = y_i$ pour tout $i$. Autrement dit,
  $cal(H)$ réalise toutes les dichotomies possibles sur $C$ :
  $ |{(h(x_1), dots, h(x_m)) : h in cal(H)}| = 2^m $
]

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition (Dimension VC)*

  La dimension de Vapnik-Chervonenkis de $cal(H)$ est :
  $ "VCdim"(cal(H)) = sup{m in NN : exists C subset cal(X), |C| = m,
    cal(H) "brise" C} $

  Si $cal(H)$ brise des ensembles de taille arbitraire, on pose
  $"VCdim"(cal(H)) = +oo$.
]

*Exemples.*

- *Seuils sur $RR$* : $cal(H) = {x mapsto bb(1)_(x >= theta) : theta in RR}$.
  Tout singleton ${x_0}$ est brisé ($theta < x_0$ donne 1, $theta > x_0$
  donne 0). Mais aucune paire ${x_1, x_2}$ avec $x_1 < x_2$ n'est brisée :
  l'étiquetage $(1, 0)$ est impossible. Donc $"VCdim"(cal(H)) = 1$.

- *Intervalles sur $RR$* : $cal(H) = {x mapsto bb(1)_(x in [a,b]) : a <= b}$.
  La paire ${x_1, x_2}$ avec $x_1 < x_2$ est brisée (les 4 étiquetages sont
  réalisables). Mais aucun triplet n'est brisé : l'étiquetage $(1,0,1)$ est
  impossible pour trois points ordonnés. Donc $"VCdim"(cal(H)) = 2$.

- *Hyperplans de $RR^d$* : $cal(H) = {x mapsto bb(1)_(w^top x >= b) :
  w in RR^d, b in RR}$. On peut montrer que $"VCdim"(cal(H)) = d + 1$.


=== Coefficient de brisure et lemme de Sauer-Shelah

La dimension VC permet de borner le nombre de dichotomies effectivement
réalisables sur un échantillon fini, via le *coefficient de brisure*.

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition (Coefficient de brisure)*

  Le coefficient de brisure de $cal(H)$ sur $m$ points est :
  $ Pi_cal(H) (m) = max_(C subset cal(X), |C|=m)
    |{(h(x_1), dots, h(x_m)) : h in cal(H)}| $

  C'est le nombre maximal de dichotomies que $cal(H)$ peut réaliser sur
  $m$ points. On a toujours $Pi_cal(H)(m) <= 2^m$.
]

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Lemme de Sauer-Shelah (1972)*

  Si $"VCdim"(cal(H)) = d < +oo$, alors pour tout $m >= 1$ :
  $ Pi_cal(H)(m) <= sum_(i=0)^d binom(m, i) $

  En particulier, pour $m >= d$ :
  $ Pi_cal(H)(m) <= (frac(e m , d))^d $

  Le coefficient de brisure est donc *polynomial* en $m$ dès que la
  dimension VC est finie, contre $2^m$ dans le cas général.
]




=== Théorème de généralisation VC

On peut maintenant énoncer *une* borne de généralisation pour
$|cal(H)| = +oo$.

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 3.3 (Borne VC)*

  Soit $cal(H)$ de dimension VC finie $d = "VCdim"(cal(H))$. Soit
  $cal(S)_n = {(X_i,Y_i)}_(i=1)^n$ i.i.d. de loi $P_(X,Y)$. Pour tout
  $delta in (0,1)$, avec probabilité $1-delta$ sous
  $P^n = P_(X,Y)^(times.o n)$, simultanément pour tout $h in cal(H)$ :
  $ |R(h) - R_cal(S)_n (h)| <= sqrt((8d log(2e n/d) + 8 log(4/delta)) / n) $
]



=== Application : borne VC pour le SVM

Le SVM (Support Vector Machine) est un classifieur linéaire qui cherche
l'hyperplan de marge maximale. La théorie VC fournit une borne de
généralisation particulièrement élégante dans ce cas, car la dimension VC
dépend de la marge et non de la dimension ambiante.

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition (Classifieur à marge)*

  Soit $cal(X) = RR^d$. On dit que $h_(w,b)(x) = "sgn"(w^top x - b)$ classe
  $S$ avec marge $gamma > 0$ si :
  $ forall i in {1, dots, n}, quad Y_i (w^top X_i - b) >= gamma $

  On note $cal(H)_gamma$ la classe des classifieurs linéaires de norme
  $norm(w)_2 = 1$ qui séparent les données avec marge $gamma$.
]

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 3.4 (Borne VC pour le SVM, Vapnik 1995)*

  Supposons que les données vérifient $norm(X_i)_2 <= R$ p.s. Soit
  $h_(w,b) in cal(H)_gamma$ un classifieur linéaire de marge $gamma > 0$
  avec $norm(w)_2 = 1$. Alors :
  $ "VCdim"(cal(H)_gamma) <= floor(R^2 / gamma^2) $

  En appliquant le théorème 3.3, pour tout $delta in (0,1)$, avec probabilité
  $1 - delta$ sous $P^n$ :
  $ |R(h) - R_cal(S)_n (h)| <= sqrt((8 floor(R^2/gamma^2) log(2e n gamma^2/R^2)
    + 8 log(4/delta)) / n) $
]
*Démonstration~:*

Laissée en exercice. Partir du théorème VC général.

== Limites de la théorie VC pour les réseaux de neurones

Les bornes VC développées dans les sections précédentes sont des résultats
fondamentaux, mais elles se heurtent à des limitations sérieuses dès qu'on
les applique aux réseaux de neurones modernes.

=== Dimension VC des réseaux de neurones

Pour un réseau de neurones à $L$ couches, $n$ neurones et poids $W$, on
peut montrer que :

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème (Bartlett, 1998)*

  Pour un réseau de neurones à fonctions d'activation seuil, à $L$ couches
  et $W$ paramètres :
  $ "VCdim"(cal(H)) = O(W L log W) $
]

La borne VC donne donc une erreur de généralisation de l'ordre de :
$ |R(h) - R_cal(S)_n (h)| = O(sqrt(frac(W L log W, n))) $

Pour un réseau moderne, $W$ est de l'ordre de $10^8$ à $10^(11)$ paramètres.
Pour que cette borne soit non triviale (inférieure à 1), il faudrait :
$ n >> W L log W approx 10^(10) $

ce qui est *astronomiquement* plus grand que les datasets d'entraînement
habituels ($n approx 10^6$ à $10^7$). La borne VC est donc inutilisable
en pratique pour les réseaux profonds.

=== Le paradoxe de la double descente

Ce qui rend la situation encore plus paradoxale, c'est que les réseaux de
neurones modernes généralisent *bien* en pratique, même dans des régimes
où :

- Le nombre de paramètres $W$ dépasse largement $n$ (*régime
  sur-paramétré*).
- Le risque empirique est exactement nul ($R_cal(S)_n (hat(h)) = 0$,
  *interpolation*).

#block(
  fill: rgb("#fff3e0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Phénomène de double descente (Belkin et al., 2019)*

  En traçant le risque de généralisation en fonction de la complexité du
  modèle (nombre de paramètres), on observe non pas la courbe en U
  classique du compromis biais-variance, mais une *double descente* :

  1. *Régime sous-paramétré* ($W << n$) : la courbe en U classique,
     le risque augmente quand le modèle est trop complexe.
  2. *Seuil d'interpolation* ($W approx n$) : le risque explose car le
     modèle commence à interpoler mais pas encore bien.
  3. *Régime sur-paramétré* ($W >> n$) : le risque *redescend* et peut
     atteindre des niveaux très bas, malgré l'interpolation.

  Ce phénomène invalide la vision classique du compromis biais-variance
  et n'est pas expliqué par la théorie VC.
]

#figure(
  image("double_descent.svg", width: 100%),
  caption: text(15pt)[
    Illustration du phénomène de double descente pour la régression
    linéaire par pseudo-inverse en dimension $d = 50$, moyennée sur
    $50$ répétitions. La ligne verticale pointillée indique $n = d = 50$, le seuil
    d'interpolation.
    Pour $n < d$ (régime sous-paramétré), le système est sous-déterminé :
    la pseudo-inverse trouve la solution de norme minimale parmi une
    infinité de solutions, et l'erreur de test est élevée.
    En $n = d$, le système est exactement déterminé : $hat(beta) = X^(-1) y$
    interpole parfaitement les données ($R_cal(S)_n = 0$) mais l'erreur de
    test explose car la matrice $X$ est mal conditionnée.
    Pour $n > d$ (régime sur-paramétré), le système est sur-déterminé :
    la pseudo-inverse calcule la solution aux moindres carrés, l'erreur
    de test redescend et converge vers l'erreur de Bayes irréductible
    $sigma^2 = 1$.
    Ce comportement illustre que la vision classique du compromis
    biais-variance (une seule montée de l'erreur de test) est insuffisante :
    le minimum global n'est pas atteint au seuil d'interpolation mais
    *après*, dans le régime sur-paramétré.
  ]
)

=== Pourquoi les réseaux généralisent-ils malgré tout ?

Plusieurs pistes théoriques ont été explorées, sans qu'aucune ne fournisse
une explication complète :

*1. Régularisation implicite de la descente de gradient stochastique (SGD).*

En pratique, on n'atteint pas le minimiseur global du risque empirique mais
une solution trouvée par SGD. Il a été montré que SGD a un biais vers les
solutions de *norme minimale* :

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Résultat (Zhang et al., 2017 ; Soudry et al., 2018)*

  Pour la régression logistique sur des données linéairement séparables,
  la descente de gradient converge vers le classifieur de *marge maximale*,
  c'est-à-dire la solution SVM, même sans régularisation explicite.
]

Ce biais implicite de l'optimiseur vers des solutions régulières explique
partiellement la bonne généralisation.

*2. Bornes basées sur la norme des poids.*

Plutôt que de compter les paramètres, on peut mesurer la complexité par
la norme des poids. Bartlett et al. (2017) montrent :

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème (Bartlett, Foster, Telgarsky, 2017)*

  Pour un réseau à $L$ couches de matrices de poids $W_1, dots, W_L$,
  avec probabilité $1 - delta$ :
  $ R(h) - R_cal(S)_n (h) = tilde(O)(frac(
    (product_(l=1)^L norm(W_l)_op) dot (sum_(l=1)^L norm(W_l)_(F)^(2/3))^(3/2),
    sqrt(n)
  )) $

  où $norm(dot)_op$ est la norme spectrale et $norm(dot)_F$ la norme de
  Frobenius.
]

Cette borne est *indépendante de la profondeur et de la largeur* du réseau
en tant que tels, et dépend uniquement des normes des poids. Elle peut être
non triviale même pour des réseaux très larges, si les poids restent petits.

*3. Complexité de Rademacher.*

Une alternative à la dimension VC est la *complexité de Rademacher*, qui
mesure la capacité d'une classe à s'adapter à du bruit aléatoire :

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition (Complexité de Rademacher empirique)*

  $ hat(frak(R))_n (cal(H)) = E_sigma [sup_(h in cal(H)) frac(1,n) sum_(i=1)^n sigma_i h(X_i)] $

  où $sigma_1, dots, sigma_n$ sont des variables de Rademacher i.i.d.
  ($P(sigma_i = plus.minus 1) = 1/2$), indépendantes de $cal(S)_n$.
]

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème (Borne de Rademacher)*

  Avec probabilité $1 - delta$ sous $P^n$ :
  $ sup_(h in cal(H)) |R(h) - R_cal(S)_n (h)| <= 2 hat(frak(R))_n (cal(H))
    + sqrt(frac(log(2/delta), 2n)) $
]

L'avantage de la complexité de Rademacher sur la dimension VC est qu'elle
est *data-dependent* : elle dépend de l'échantillon $cal(S)_n$ et pas
seulement de la classe $cal(H)$. Pour des réseaux dont les poids sont
contraints en norme, elle peut être bornée indépendamment du nombre de
paramètres.


= Fonctions de perte calibrées

== Motivation : pourquoi ne pas minimiser la perte 0-1 ?

Le classifieur de Bayes $h^*$ minimise le risque 0-1 $R(h) = P(h(X) != Y)$.
Il serait donc naturel de minimiser directement le risque empirique 0-1 :
$ hat(h) = arg min_(h in cal(H)) R_S (h) = arg min_(h in cal(H)) 1/n sum_(i=1)^n bb(1)_(h(X_i) != Y_i) $

Cependant, ce problème est *NP-difficile* en général : la perte 0-1 est
non convexe, discontinue, et son gradient est nul presque partout. On ne
peut pas l'optimiser par descente de gradient.

*Exemple : deep learning.* En pratique, on paramètre $h$ par un réseau de
neurones $f_theta : cal(X) -> RR$ et on pose $h_theta (x) = "sgn"(f_theta (x))$.
On ne minimise pas :
$ 1/n sum_(i=1)^n bb(1)_(y_i f_theta (x_i) < 0) $
mais la *perte logistique* (ou cross-entropy) :
$ 1/n sum_(i=1)^n log(1 + e^(-y_i f_theta (x_i))) $

qui est convexe en $f_theta (x_i)$, différentiable, et dont le gradient
donne une direction de descente utile.

#block(
  fill: rgb("#fff3e0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Exercice : équivalence entre perte logistique et cross-entropy*

  En classification binaire, on dispose de deux formulations de la perte :

  - *Perte logistique* (convention $y in {-1, +1}$, sortie $f(x) in RR$) :
  $ ell_"log" (y, f(x)) = log(1 + e^(-y f(x))) $

  - *Cross-entropy* (convention $tilde(y) in {0, 1}$, sortie $sigma(f(x)) in (0,1)$) :
  $ ell_"CE" (tilde(y), f(x)) = -tilde(y) log(sigma(f(x))) - (1 - tilde(y)) log(1 - sigma(f(x))) $

  où $sigma(t) = 1/(1 + e^(-t))$ est la fonction sigmoïde.

  *Montrer que ces deux pertes sont identiques à un changement de convention
  près.*

  *Indication :* Exprimer $sigma(f(x))$ et $1 - sigma(f(x))$ en fonction
  de $e^(f(x))$, puis traiter séparément les cas $tilde(y) = 1$ et
  $tilde(y) = 0$, correspondant respectivement à $y = +1$ et $y = -1$.
]

*Solution :*

*Étape 1 — Intuition.*

Les deux formulations encodent la même idée : pénaliser le modèle quand
il est confiant dans la mauvaise direction. La perte logistique le fait
via la marge $y f(x)$ (négative quand $f$ et $y$ sont de signes opposés),
et la cross-entropy via la log-vraisemblance d'un modèle de Bernoulli
de paramètre $sigma(f(x))$.

*Étape 2 — Rappels sur la sigmoïde.*

On note que :
$ sigma(t) = 1/(1+e^(-t)) quad "et" quad 1 - sigma(t) = e^(-t)/(1+e^(-t)) = 1/(1+e^t) = sigma(-t) $

Donc :
$ log(sigma(t)) &= -log(1 + e^(-t)) quad "et" quad log(1 - sigma(t)) \ &= log(sigma(-t)) = -log(1 + e^t) $

*Étape 3 — Cas $tilde(y) = 1$ (correspondant à $y = +1$).*

$ ell_"CE" (1, f(x)) &= -log(sigma(f(x))) \
                    &= log(1 + e^(-f(x))) \
                    &= log(1 + e^(-y f(x))) \
                    &= ell_"log" (+1, f(x)) "✓"$

*Étape 4 — Cas $tilde(y) = 0$ (correspondant à $y = -1$).*

$ ell_"CE" (0, f(x)) &= -log(1 - sigma(f(x))) \
                    &= -log(sigma(-f(x))) \
                    &= log(1 + e^(f(x))) \
                    &= log(1 + e^(-(-1) f(x))) \
                    &= log(1 + e^(-y f(x))) \
                    &= ell_"log" (-1, f(x)) "✓"$

*Conclusion.*

Les deux pertes sont identiques sous le changement de convention
$tilde(y) = (y+1)/2 in {0,1} <=> y = 2tilde(y) - 1 in {-1,+1}$ :
$ ell_"CE" (tilde(y), f(x)) = ell_"log" (2tilde(y)-1, f(x)) = log(1 + e^(-(2tilde(y)-1) f(x))) $

*Interprétation probabiliste.* La cross-entropy est la log-vraisemblance
négative du modèle probabiliste :
$ P(Y = 1 | X = x) = sigma(f(x)) $

Minimiser la cross-entropy revient donc à maximiser la vraisemblance
du modèle logistique, ce qui justifie son usage en deep learning :
on cherche les paramètres $theta$ qui rendent les labels observés
les plus probables sous le modèle $sigma(f_theta)$.

De même, le SVM minimise la perte
charnière $max(0, 1 - y f(x))$, et AdaBoost minimise implicitement la
perte exponentielle $e^(-y f(x))$.

La question fondamentale est : *minimiser une perte proxy $phi$ conduit-il
bien à un classifieur proche de $h^*$ ?* C'est l'objet de la calibration.

#figure(
  image("proxy_loss.svg", width: 100%),
  caption: text(15pt)[Comparaison des fonctions de perte en fonction de la marge $t = y f(x)$.
    La perte 0-1 (discontinue) est le critère théorique optimal mais
    non optimisable par descente de gradient. Les pertes de substitution
    — charnière ($max(0, 1-t)$), logistique ($log(1 + e^(-t))$),
    charnière adoucie ($1/beta log(1 + e^(-beta(t-1)))$ avec $beta = 3$)
    et Brier ($(1-t)^2$) —
    en sont des majorantes convexes et différentiables. Toutes vérifient
    $phi'(0) < 0$, garantissant leur calibration au sens du théorème 4.1 :
    minimiser l'une d'elles conduit asymptotiquement au même classifieur
    que la minimisation du risque 0-1. Le score de Brier, équivalent à
    l'erreur quadratique moyenne sur les probabilités prédites, pénalise
    quadratiquement les marges inférieures à 1 et reste sensible aux
    grandes marges négatives, contrairement à la charnière qui est nulle
    pour $t >= 1$.
  ]
)

== Formalisation

On se place en classification binaire $cal(Y) = {-1, +1}$. Un modèle est
une fonction $f : cal(X) -> RR$, et la décision associée est
$h_f (x) = "sgn"(f(x))$. On remplace la perte 0-1 par une *perte de
substitution* $phi : RR -> RR_+$ appliquée à la marge $y f(x)$ :
$ ell_phi (f(x), y) = phi(y f(x)) $

*Vérification sur la perte 0-1.* On pose $phi_(0-1)(t) = bb(1)_(t < 0)$.
Alors :
$ ell_(phi_(0-1))(f(x), y) = bb(1)_(y f(x) < 0) = bb(1)_("sgn"(f(x)) != y) $

ce qui redonne bien la perte 0-1 usuelle : la marge $y f(x)$ est négative
si et seulement si $f(x)$ et $y$ sont de signes opposés, c'est-à-dire
quand le classifieur se trompe.

Le *$phi$-risque* est :
$ R_phi (f) = E[phi(Y f(X))] $

et le *$phi$-risque de Bayes* est :
$ R_phi^* = inf_(f : cal(X) -> RR) R_phi (f) $

*Exemples de pertes usuelles.*

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  #table(
    columns: (auto, auto, auto),
    [*Perte*], [*Expression $phi(t)$*], [*Usage*],
    [Logistique], [$log(1 + e^(-t))$], [Régression logistique, deep learning],
    [Charnière], [$max(0, 1-t)$], [SVM],
    [Exponentielle], [$e^(-t)$], [AdaBoost],
    [Carrée (Brier)], [$(1-t)^2$], [Least-squares classification],
  )
]

== Calibration

=== Définition et sens

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition (Perte calibrée)*

  Une fonction de perte $phi : RR -> RR_+$ *convexe et positive* est dite
  *calibrée* si pour tout $eta in [0,1]$ et toute suite $(f_n)$ de
  fonctions mesurables :
  $ R_phi (f_n) attach(->, t: n->+oo) R_phi^* ==> R(h_(f_n)) attach(->, t: n->+oo) R^* $

  Autrement dit, minimiser le $phi$-risque conduit bien à minimiser le
  risque 0-1.
]

L'idée est la suivante : si $phi$ est calibrée, on peut travailler avec
$R_phi$ (convexe, différentiable) plutôt qu'avec $R$ (discontinu), et
la convergence dans l'espace des $phi$-risques entraîne la convergence
dans l'espace des risques 0-1.

=== Condition de calibration ponctuelle

Par la loi des espérances totales, on peut écrire :
$ R_phi (f) = E_X [C_phi (f(X), eta(X))] $

où $eta(x) = P(Y=1|X=x)$ et le risque conditionnel est :
$ C_phi (alpha, eta) = eta phi(alpha) + (1-eta) phi(-alpha) $

Le $phi$-risque de Bayes conditionnel est :
$ C_phi^*(eta) = inf_(alpha in RR) C_phi (alpha, eta) $

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Définition (Calibration ponctuelle)*

  $phi$ est *ponctuellement calibrée* en $eta$ si tout minimiseur
  $alpha^*(eta)$ de $alpha mapsto C_phi (alpha, eta)$ vérifie :
  $ eta > 1/2 &<==> arg min_(alpha in RR) C_phi (alpha, eta) subset RR_+^* \
    eta < 1/2 &<==> arg min_(alpha in RR) C_phi (alpha, eta) subset RR_-^* $

  c'est-à-dire que le signe du prédicteur optimal pour $phi$ coïncide avec
  celui du classifieur de Bayes.
]

=== Théorème de calibration

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 4.1 (Bartlett, Jordan, McAuliffe, 2006)*

  Soit $phi : RR -> RR_+$ convexe et positive. Alors $phi$ est calibrée
    si et seulement si $phi$ est différentiable en $0$ et $ phi'(0) < 0$.
]

*Démonstration :*

On étudie la calibration ponctuelle en $eta$. Le risque conditionnel est :
$ C_phi (alpha, eta) = eta phi(alpha) + (1-eta) phi(-alpha) $

Puisque $phi$ est convexe, $C_phi (dot, eta)$ est convexe pour tout
$eta in [0,1]$. On caractérise la localisation des minimiseurs via les
dérivées à gauche et à droite en $0$.

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Rappel : localisation des minimiseurs d'une fonction convexe.*

  Pour une fonction convexe $g : RR -> RR$, on a :
  - $arg min g subset RR_+^*$ si et seulement si $g'_+(0) < 0$
  - $arg min g subset RR_-^*$ si et seulement si $g'_-(0) > 0$

  En effet, par convexité, $g'_+$ est croissante et $g'_-(t) <= g'_+(t)$
  pour tout $t$. Un minimiseur $alpha^*$ vérifie $g'_-(alpha^*) <= 0 <=
  g'_+(alpha^*)$. Donc $alpha^* > 0$ si et seulement si $g'_+(0) < 0$
  (sinon $0$ serait déjà minimiseur), et $alpha^* < 0$ si et seulement si
  $g'_-(0) > 0$.
]

On calcule les dérivées à gauche et à droite de $C_phi (dot, eta)$ en $0$.
Puisque $phi$ est convexe, elle admet des dérivées à gauche et à droite
en tout point, et en particulier en $0$. Par la règle de dérivation de
$alpha mapsto phi(-alpha)$, dont les dérivées à gauche et à droite en $0$
sont $-phi'_+(0)$ et $-phi'_-(0)$ respectivement :
$ (C_phi)_+(0)^' = eta phi'_+(0) - (1-eta) phi'_-(0) $
$ (C_phi)_-(0)^' = eta phi'_-(0) - (1-eta) phi'_+(0) $

On obtient ainsi les équivalences :
$ arg min_(alpha in RR) C_phi (alpha, eta) subset RR_+^*
  &<==> eta phi'_+(0) - (1-eta) phi'_-(0) < 0 $
$ arg min_(alpha in RR) C_phi (alpha, eta) subset RR_-^*
  &<==> eta phi'_-(0) - (1-eta) phi'_+(0) > 0 $

*($=>$) Si $phi$ est calibrée, alors $phi$ est différentiable en $0$ et
$phi'(0) < 0$.*

Supposons $phi$ calibrée. Pour tout $eta > 1/2$, la condition de calibration
impose $arg min C_phi (dot, eta) subset RR_+^*$, soit :
$ eta phi'_+(0) - (1-eta) phi'_-(0) < 0 $

Cette inégalité est stricte pour tout $eta > 1/2$. En faisant tendre
$eta -> 1/2^+$, on obtient à la limite :
$ 1/2 phi'_+(0) - 1/2 phi'_-(0) <= 0 <==> phi'_+(0) <= phi'_-(0) $

Or $phi$ convexe implique toujours $phi'_-(0) <= phi'_+(0)$. En combinant :
$ phi'_-(0) <= phi'_+(0) <= phi'_-(0) $

donc $phi'_+(0) = phi'_-(0)$ : $phi$ est différentiable en $0$.

Les dérivées à gauche et à droite de $phi$ en $0$ sont donc égales :
$phi$ est *différentiable en $0$*, et on note $phi'(0) = phi'_+(0) =
phi'_-(0)$.

Les équivalences deviennent alors :
$ (C_phi)'(0) = (2eta - 1) phi'(0) $

La condition de calibration pour $eta > 1/2$ impose $(2eta-1) phi'(0) < 0$,
soit $phi'(0) < 0$ puisque $2eta - 1 > 0$.

*($arrow.double.l$) Si $phi$ est différentiable en $0$ et $phi'(0) < 0$, alors
$phi$ est calibrée.*

Supposons $phi'(0) < 0$. Alors :
$ (C_phi)'(0) = (2eta-1) phi'(0) $

- Si $eta > 1/2$ : $(2eta-1) > 0$ et $phi'(0) < 0$, donc
  $(C_phi)'_+(0) = (2eta-1) phi'(0) < 0$, et :
  $ arg min_(alpha in RR) C_phi (alpha, eta) subset RR_+^* "✓"$


- Si $eta < 1/2$ : $(2eta-1) < 0$ et $phi'(0) < 0$, donc
  $(C_phi)'_-(0) = (2eta-1) phi'(0) > 0$, et :
  $ arg min_(alpha in RR) C_phi (alpha, eta) subset RR_-^* "✓"$

Dans les deux cas, le minimiseur de $C_phi (dot, eta)$ est du bon signe :
$phi$ est ponctuellement calibrée pour tout $eta != 1/2$, donc calibrée
au sens de la définition $qed$.

*Vérification sur les exemples.*

- *Logistique* : $phi(t) = log(1 + e^(-t))$, $phi'(t) = -e^(-t)/(1+e^(-t))$,
  $phi'(0) = -1/2 < 0$. ✓
- *Charnière* : $phi(t) = max(0, 1-t)$, $phi'(0^-) = -1 < 0$. ✓
- *Exponentielle* : $phi(t) = e^(-t)$, $phi'(0) = -1 < 0$. ✓
- *Carrée* : $phi(t) = (1-t)^2$, $phi'(0) = -2 < 0$. ✓

== Décomposition de l'erreur

On dispose maintenant de tous les outils pour décomposer l'erreur totale
d'un algorithme qui minimise un $phi$-risque empirique sur une classe $cal(F)$.

=== Mise en place

Soit $hat(f)_cal(S)_n = arg min_(f in cal(F)) R_(phi,cal(S)_n)(f)$ le minimiseur du
$phi$-risque empirique, où :
$ R_(phi,cal(S)_n)(f) = 1/n sum_(i=1)^n phi(Y_i f(X_i)) $

On note :
- $f^* = arg min_(f in cal(F)) R_phi (f)$ : le meilleur modèle dans $cal(F)$
- $f^(** ) : x mapsto arg min_(alpha in RR) C_phi (alpha, eta(x))$ : le minimiseur
  du $phi$-risque global (sans contrainte de classe)
- $R_phi^* = R_phi (f^(**))$ : le $phi$-risque de Bayes

=== Décomposition en quatre termes

#block(
  fill: rgb("#e8f4f8"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorème 4.2 (Décomposition de l'erreur)*

  L'excès de risque 0-1 se décompose comme :
  $ R(h_(hat(f)_S)) - R^* =
    underbrace(R(h_(hat(f)_S)) - R(h_(f^*)), A) \
    + underbrace(R(h_(f^*)) - R(h_(f^(**))), B) \
    + underbrace(R(h_(f^(**))) - R^*, C) $

  où :
  - $hat(f)_S = arg min_(f in cal(F)) R_(phi,S)(f)$ est le minimiseur du
    $phi$-risque empirique
  - $f^* = arg min_(f in cal(F)) R_phi (f)$ est le meilleur modèle dans
    $cal(F)$ pour le $phi$-risque
  - $f^(**)$ est le minimiseur global du $phi$-risque sur toutes les
    fonctions mesurables

  Les trois termes ont les interprétations suivantes :
  - $A$ : *terme d'estimation* — écart dû à l'utilisation d'un échantillon
    fini plutôt que de la vraie distribution
  - $B$ : *terme de calibration* — écart entre le meilleur modèle dans
    $cal(F)$ pour $phi$ et le minimiseur global de $phi$, mesuré en risque
    0-1 ; il est nul si $f^(**) in cal(F)$
  - $C$ : *terme d'approximation* — écart entre le minimiseur global du
    $phi$-risque et le classifieur de Bayes ; il est nul si $phi$ est
    calibrée
]

*Démonstration :*

La décomposition est une identité algébrique :
$ R(h_(hat(f)_S)) - R^*
  &= R(h_(hat(f)_S)) - R(h_(f^*)) \
  &+ R(h_(f^*)) - R(h_(f^(**))) \
  &+ R(h_(f^(**))) - R^* $

Il reste à vérifier le signe de chaque terme.

- *Terme $A$ :* Pas nécessairement positif terme à terme, mais contrôlé
  en espérance par les inégalités de concentration uniformes de la section 3.

- *Terme $B$ :* $f^*$ minimise $R_phi$ sur $cal(F)$, donc
  $R_phi (f^*) <= R_phi (f^(**))$. Mais cela ne dit rien directement sur
  le risque 0-1. Ce terme mesure le *coût de la restriction à $cal(F)$*
  lorsqu'on optimise $phi$ plutôt que la perte 0-1 : même si $f^(**)
  in cal(F)$, le meilleur modèle pour $phi$ dans $cal(F)$ n'est pas
  nécessairement le meilleur pour la perte 0-1.

- *Terme $C$ :* $f^(**)$ minimise $R_phi$ sans contrainte, donc
  $R_phi (f^(**)) = R_phi^*$. Si $phi$ est calibrée, le minimiseur du
  $phi$-risque a le même signe que $eta(x) - 1/2$ pour presque tout $x$,
  donc $h_(f^(**)) = h^*$ p.s. et $C = 0$.

En particulier, si $phi$ est calibrée et $f^(**) in cal(F)$, le terme $C$
et le terme $B$ sont tous deux nuls, et l'excès de risque se réduit au
seul terme d'estimation $A$. $qed$


= Bibliographie

== Ouvrages de référence

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Théorie de l'apprentissage statistique*

  - *Devroye, L., Györfi, L., Lugosi, G.* (1996). _A Probabilistic Theory of Pattern Recognition_. Springer. #linebreak()
  - *Shalev-Shwartz, S., Ben-David, S.* (2014). _Understanding Machine Learning: From Theory to Algorithms_. Cambridge University Press. #linebreak()
  - *Bach, F.* (2024). _Learning Theory from First Principles_. MIT Press. #linebreak()
  - *Vapnik, V.* (1995). _The Nature of Statistical Learning Theory_. Springer. #linebreak()
  - *Boucheron, S., Lugosi, G., Massart, P.* (2013). _Concentration Inequalities: A Nonasymptotic Theory of Independence_. Oxford University Press. #linebreak()
]

== Articles scientifiques cités

#block(
  fill: rgb("#f0f0f0"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  *Résultats classiques*

  - *Stone, C. J.* (1977). Consistent nonparametric regression. _Annals of Statistics_, 5(4), 595–620. #linebreak()
  - *Hoeffding, W.* (1963). Probability inequalities for sums of bounded random variables. _Journal of the American Statistical Association_, 58(301), 13–30. #linebreak()
  - *Sauer, N.* (1972). On the density of families of sets. _Journal of Combinatorial Theory, Series A_, 13(1), 145–147. #linebreak()
  - *Shelah, S.* (1972). A combinatorial problem; stability and order for models and theories in infinitary languages. _Pacific Journal of Mathematics_, 41(1), 247–261. #linebreak()
  *Calibration et pertes de substitution*

  - *Bartlett, P. L., Jordan, M. I., McAuliffe, J. D.* (2006). Convexity, classification, and risk bounds. _Journal of the American Statistical Association_, 101(473), 138–156. #linebreak()
  *Généralisation des réseaux de neurones*

  - *Bartlett, P. L.* (1998). The sample complexity of pattern classification with neural networks: the size of the weights is more important than the size of the network. _IEEE Transactions on Information Theory_, 44(2), 525–536. #linebreak()
  - *Bartlett, P. L., Foster, D. J., Telgarsky, M.* (2017). Spectrally-normalized margin bounds for neural networks. _NeurIPS 2017_. #linebreak()
  - *Zhang, C., Bengio, S., Hardt, M., Recht, B., Vinyals, O.* (2017). Understanding deep learning requires rethinking generalization. _ICLR 2017_. #linebreak()
  - *Soudry, D., Hoffer, E., Nacson, M. S., Gunasekar, S., Srebro, N.* (2018). The implicit bias of gradient descent on separable data. _Journal of Machine Learning Research_, 19(1), 2822–2878. #linebreak()
  - *Belkin, M., Hsu, D., Ma, S., Mandal, S.* (2019). Reconciling modern machine-learning practice and the classical bias–variance trade-off. _PNAS_, 116(32), 15849–15854. #linebreak()
]
