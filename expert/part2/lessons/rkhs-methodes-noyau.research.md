# Recherche — `p2-lesson-rkhs-methodes-noyau`

> Brief : `expert/part2/lessons/rkhs-methodes-noyau.md`.
> Sources de vérité lues **avant** recherche :
> `course_sources/marine/Cours/CM/coursClassif-4-SVM.tex` (§ « Le cas linéairement
> non séparable : SVM à noyau », frames « Problématique », « L'astuce du noyau »,
> « Propriétés du noyau K », « Exemples de noyau », « Formulation duale avec le
> noyau ») et `course_sources/marine/Cours/CM/coursClassif-1-Intro.tex` (k-NN).
> `course_sources/typst/theorie.typ` ch. 3 § « Application : borne VC pour le SVM »
> (Théorème 3.4, Vapnik 1995) — aucune mention de RKHS dans les sources typst :
> la théorie RKHS complète est bien au-delà des sources, comme le dit le brief.

---

## RQ 1 — Théorème de Mercer : K ≥ 0 (PSD) ⟺ espace de features

**Affirmation vérifiée.** Le théorème de Mercer (1909) s'énonce, pour un noyau
continu symétrique de type positif :

> **Théorème (Mercer 1909).** Soit $K : [a,b] \times [a,b] \to \mathbb{R}$
> continue, symétrique et de type positif, c'est-à-dire
> $\int_a^b \int_a^b K(x,y)\, f(x)\, f(y)\, dx\, dy \ge 0$ pour toute
> $f \in L^2([a,b])$. Il existe une base orthonormée $(\phi_i)$ de $L^2([a,b])$
> formée de fonctions propres de l'opérateur intégral
> $(T_K f)(x) = \int_a^b K(x,y)\, f(y)\, dy$ et des valeurs propres
> $\lambda_i \ge 0$ telles que
> $$K(x,y) = \sum_{i=1}^{\infty} \lambda_i\, \phi_i(x)\, \phi_i(y),$$
> la convergence étant absolue et uniforme.

En conséquence, le feature map explicite
$\phi(x) = (\sqrt{\lambda_1}\phi_1(x), \sqrt{\lambda_2}\phi_2(x), \dots) \in \ell^2$
vérifie $K(x,y) = \langle \phi(x), \phi(y) \rangle_{\ell^2}$.

**Citation.** Mercer, J. (1909). « Functions of Positive and Negative Type, and
their Connection with the Theory of Integral Equations. »
*Philosophical Transactions of the Royal Society of London A*, 209(457–458) : 415–446.
- URL (abstract, Royal Society) : https://royalsocietypublishing.org/rspa/article/83/559/69/4138
- URL (article intégral, Phil. Trans. via JSTOR) : https://www.jstor.org/stable/91043
- Énoncé vérifié via : https://www.tahabouhsine.com/awesome-kernels/rkhs-fundamentals/mercer-1909
  (source secondaire, concordante avec l'énoncé classique) et l'article Wikipédia
  « Reproducing kernel Hilbert space » (§ « Integral operators and Mercer's theorem »).

**Distinguer deux théorèmes (à garder dans le cours) :**

- **Moore–Aronszajn** (théorème d'existence, tel que l'enseigne le cours,
  `coursClassif-4-SVM.tex` frame « Propriétés du noyau K ») : pour tout noyau
  symétrique et semi-défini positif sur un ensemble **arbitraire** $X$, il existe
  un espace de Hilbert $\mathcal{H}$ et $\phi : X \to \mathcal{H}$ avec
  $K(x,\tilde x) = \langle \phi(x), \phi(\tilde x) \rangle$. C'est le résultat
  général ; Wikipédia note qu'il « first appeared in Aronszajn's *Theory of
  Reproducing Kernels*, although he attributes it to E. H. Moore ».
- **Mercer (1909)** : noyaux **continus** sur un compact $[a,b]$ ; il donne en
  plus la **décomposition spectrale** (opérateur intégral compact auto-adjoint).
  Le cours n'enseigne que la première version ; la leçon expert ajoute la
  seconde (au-delà du cours).

**Note historique (vérifiée, Wikipédia RKHS).** Le noyau reproduisant apparaît
chez Zaremba (1907) pour les problèmes aux limites ; Mercer étudie
simultanément les fonctions de type positif dans la théorie des équations
intégrales ; développement systématique par Aronszajn et Bergman (début des
années 1950).

**Correction de citation par rapport au brief.** Le brief cite
« Aronszajn, *Theory of Reproducing Kernels* (1944, Pacific J. Math.) ».
**C'est erroné sur l'année ET sur le journal.** La bonne référence, vérifiée :
Aronszajn, N. (1950). « Theory of Reproducing Kernels. »
*Transactions of the American Mathematical Society*, 68(3) : 337–404.
DOI : https://doi.org/10.1090/s0002-9947-1950-0051437-7 (vérifié via la
résolution du DOI, page AMS : « Aronszajn, N. (1950). Theory of reproducing
kernels. Transactions of the American Mathematical Society, 68(3), 337–404. »).
Le papier antérieur « Théorie générale de noyaux reproduisants — Première
partie » (1943/1944) est cité dans la préface de l'article de 1950 ; la venue
exacte de ce premier papier est **UNVERIFIED** (l'OCR de la préface sur DTIC
donne « Proceedings of the Cambridge Philosophical Society, vol. 39 (1944) »,
non confirmé par une seconde source). Le cours cite le résultat sous le nom de
« Théorème de Moore-Aronszajn » — usage standard, cohérent avec la citation
ci-dessus.

---

## RQ 2 — Définition d'un RKHS et noyau reproduisant

**Affirmation vérifiée.** Un **espaces de Hilbert à noyau reproduisant (RKHS)**
est un espace de Hilbert $\mathcal{H}$ de fonctions réelles sur un ensemble $X$
tel que, pour tout $x \in X$, l'application d'évaluation
$L_x : f \mapsto f(x)$ est continue (bornée). Équivalent (théorème de Riesz) :
pour tout $x \in X$, il existe un unique $K_x \in \mathcal{H}$ tel que

$$f(x) = \langle f,\, K_x \rangle_{\mathcal{H}} \qquad \forall f \in \mathcal{H}.$$

$K_x$ est la **fonction noyau en $x$** ; la fonction
$K(x,y) := \langle K_x, K_y \rangle_{\mathcal{H}}$ est le **noyau reproduisant**,
symétrique et semi-défini positif, et l'on a
$K(x,y) = \sum_i c_i K(x_i, \cdot)$ … (la propriété reproduisante s'écrit aussi
$f(x) = \langle f, K(\cdot, x) \rangle_{\mathcal{H}}$, ce qui est la forme
utilisée dans le brief).

**Citations.** Définition et équivalences : article Wikipédia
« Reproducing kernel Hilbert space » (section « Definition »), lu en intégral —
définition par continuité de l'évaluation, équivalence Riesz, définition
$K(x,y) = \langle K_x, K_y \rangle$, conséquence PSD. Source primaire :
Aronszajn (1950), Trans. AMS 68(3):337–404 (même DOI que RQ 1).

**Théorème de Moore–Aronszajn, énoncé complet (vérifié, Wikipédia RKHS §
« Moore–Aronszajn theorem ») :**

> Soit $K$ un noyau symétrique et semi-défini positif sur $X$. Il existe un
> **unique** espace de Hilbert de fonctions sur $X$ pour lequel $K$ est noyau
> reproduisant.

Esquisse de preuve (donnée intégralement par Wikipédia, à paraphraser) :
1. $\mathcal{H}_0 = \operatorname{span}\{K_x : x \in X\}$, produit scalaire
   $\langle \sum_j b_j K_{y_j}, \sum_i a_i K_{x_i} \rangle := \sum_{i,j} a_i b_j
   K(y_j, x_i)$ — bien défini et dégénéré seulement si $K$ n'est pas PSD.
2. $\mathcal{H}$ = complétion ; pour $f = \sum_i a_i K_{x_i}$ (série
   convergente en norme), $\langle f, K_x \rangle = \sum_i a_i K(x_i, x) = f(x)$.
3. Unicité : tout autre espace $\mathcal{G}$ portant le même $K$ contient
   $\mathcal{H}$ (complétude) et $\mathcal{H}$ est un sous-espace fermé de
   $\mathcal{G}$ ; si $g \in \mathcal{G}$, décomposition
   $g = g_{\mathcal{H}} + g_{\perp}$ avec $\langle K_x, g_{\perp} \rangle = 0$,
   donc $g(x) = g_{\mathcal{H}}(x)$ — $g \in \mathcal{H}$.

---

## RQ 3 — Théorème du représentant

**Affirmation vérifiée (énoncé formel + preuve, lus intégralement).**

> **Théorème du représentant** (Schölkopf, Herbrich & Smola 2001). Soit
> $K : \mathcal{X} \times \mathcal{X} \to \mathbb{R}$ un noyau
> semi-défini positif, $\mathcal{H}_K$ son RKHS, un échantillon
> $(x_1, y_1), \dots, (x_n, y_n)$, une fonction d'erreur arbitraire
> $E : (\mathcal{X} \times \mathbb{R}^2)^n \to \mathbb{R} \cup \{+\infty\}$ et
> une fonction $g : [0, \infty) \to \mathbb{R}$ **strictement croissante**.
> Tout minimiseur de
> $$f \mapsto E\big((x_1, y_1, f(x_1)), \dots, (x_n, y_n, f(x_n))\big) +
> g(\lVert f \rVert_{\mathcal{H}_K})$$
> admet une représentation
> $$f^\star(\cdot) = \sum_{i=1}^n \alpha_i\, K(\cdot, x_i), \qquad \alpha_i \in
> \mathbb{R}.$$

Esquisse de preuve (Wikipédia « Representer theorem », attribuant énoncé et
preuve à Schölkopf–Herbrich–Smola [1]) : écrire $f = \sum_i \alpha_i
K(\cdot, x_i) + v$ avec $\langle v, K(\cdot, x_i) \rangle = 0$ (projection
orthogonale sur $\operatorname{span}\{K(\cdot, x_i)\}$). La propriété
reproduisante donne $f(x_j) = \sum_i \alpha_i K(x_i, x_j)$, indépendant de
$v$ — donc $E$ ne change pas. Par contre
$g(\lVert f \rVert) = g\big(\sqrt{\lVert \sum_i \alpha_i K(\cdot, x_i)\rVert^2 +
\lVert v \rVert^2}\big) \ge g\big(\lVert \sum_i \alpha_i K(\cdot, x_i)\rVert\big)$
avec striction si $v \ne 0$ (car $g$ strictement croissante). Tout minimiseur a
donc $v = 0$.

**Citation.** Schölkopf, B., Herbrich, J. & Smola, A. J. (2001). *Learning with
Kernels: Support Vector Machines, Regularization, Optimization, and Algorithms.*
MIT Press. (L'édition 2002 « Learning with Kernels » est la même œuvre ;
OpenAlex : « Learning with Kernels », 2001, B. Schölkopf, Max Planck Institute,
http://edoc.mpg.de/39419.) Énoncé + preuve vérifiés via :
https://en.wikipedia.org/wiki/Representer_theorem (section « Formal statement »).

**Origine (vérifiée, deux sources concordantes).** « The first statement of a
representer theorem was due to Kimeldorf and Wahba for the special case in which
$E = \frac{1}{n}\sum_i (f(x_i) - y_i)^2$ et $g(\lVert f\rVert) = \lambda
\lVert f \rVert^2$ » (Wikipédia « Representer theorem ») ; « The representer
theorem was first derived by Kimeldorf and Wahba [1, 2] in the setting of
Chebyshev splines. The results for general RKHS first appeared in [4] »
(Wahba & Wang, *Representer Theorem*,
https://pages.stat.wisc.edu/~wahba/ftp1/wahba.wang.2019submit.pdf — extrait lu
via recherche). Citation : Kimeldorf, G. & Wahba, G. (1970). « A variational
approach to the estimation of the functional structure of stochastic
processes. » (Journal communément cité : *SIAM J. Appl. Math.* 20(4):481–499 —
venue **UNVERIFIED** ; la métadonnée exacte n'a pas pu être vérifiée en ligne.)

---

## RQ 4 — Régression à noyau ridge (KRR) et solution en forme close

**Affirmation vérifiée (dérivation complète, relue et recalculée).**

> **KRR.** Soit $(x_i, y_i)_{i=1}^n$, $K$ un noyau PSD,
> $\mathcal{H}_K$ son RKHS, $\lambda > 0$. On cherche
> $$f^\star_\lambda \in \arg\min_{f \in \mathcal{H}_K}\;
> \frac{1}{n} \sum_{i=1}^n \big(y_i - f(x_i)\big)^2 + \lambda\,
> \lVert f \rVert_{\mathcal{H}_K}^2.$$
> Alors $f^\star_\lambda(\cdot) = \sum_{i=1}^n \alpha_i^\star K(\cdot, x_i)$
> avec
> $$\alpha^\star = (K + n\lambda\, I_n)^{-1}\, y, \qquad K_{ij} = K(x_i, x_j),$$
> et $\lVert f^\star_\lambda \rVert_{\mathcal{H}_K}^2 = \alpha^{\star\top} K
> \alpha^\star = y^\top K (K + n\lambda I_n)^{-2} y$ (équivalent :
> $\alpha^{\star\top} y - n\lambda \lVert \alpha^\star \rVert^2$) ; la valeur
> minimale de l'objectif est $\lambda\, y^\top (K + n\lambda I_n)^{-1} y$.
> (Vérifié numériquement sur un cas $2\times 2$ : l'identité
> $\lVert f^\star\rVert^2 = y^\top(K + n\lambda I)^{-1}y$ est **fausse** en
> général — c'est la valeur de l'objectif, pas la norme.)

Preuve (deux étapes, vérifiées pas à pas) :
1. **Théorème du représentant** (cas $E = \frac{1}{n}\sum (y_i - f(x_i))^2$,
   $g(t) = \lambda t^2$ strictement croissante sur $[0,\infty)$) :
   $f = \sum_i \alpha_i K(\cdot, x_i)$ ; et
   $\lVert f \rVert^2 = \sum_{i,j} \alpha_i \alpha_j K(x_i, x_j) = \alpha^\top
   K \alpha$.
2. **Conditions d'optimalité.** Minimiser
   $\Phi(\alpha) = \frac{1}{n}\lVert y - K\alpha \rVert^2 + \lambda \alpha^\top
   K \alpha$ :
   $\nabla_\alpha \Phi = \frac{2}{n} K (K\alpha - y) + 2\lambda K \alpha = 0$
   $\iff K(K + n\lambda I)\alpha = K y$.
   $K + n\lambda I$ est **toujours inversible** (PSD + $n\lambda I$ définie
   positive), et l'on obtient $\alpha^\star = (K + n\lambda I)^{-1} y$.
   $\alpha^\star$ est l'unique solution de $(K + n\lambda I)\alpha = y$ ;
   $\Phi$ étant convexe, c'est un minimiseur global — le minimiseur **unique**
   si $K$ est inversible. (Même si $K$ est singulière — points en double —
   la formule reste exacte : le système $(K + n\lambda I)\alpha = y$ est
   toujours bien posé, et les prédictions $K\alpha^\star$ ainsi que
   $\lVert f^\star\rVert^2 = \alpha^{\star\top}K\alpha^\star$ sont uniques
   dans tous les cas, seuls les $\alpha_i$ individuels peuvent ne pas l'être.)

**Sources.**
- Dérivation complète vérifiée (objectif, forme $\alpha^\top K\alpha$,
  système $-n\lambda I\alpha - K\alpha + y = 0$, solution
  $(K + n\lambda I)^{-1} y$, et pont ridge) :
  https://teazrq.github.io/SMLR/kernel-ridge-regression.html
  (« Statistical Machine Learning with R », ch. 16 « Kernel Ridge Regression »)
  — lu en intégral ; recalcul indépendant des dérivées effectué.
- Référence standard : Schölkopf, B. & Smola, A. J. (2002). *Learning with
  Kernels.* MIT Press, ch. 4 (section KRR). Le PDF du livre n'a pas pu être
  extrait en ligne : le numéro de proposition exact dans le livre est
  **UNVERIFIED** ; la forme close ci-dessus est indépendante (dérivation
  vérifiée).
- Convention de $\lambda$ : l'objectif retenu ici est
  $\frac{1}{n}\sum (y_i - f(x_i))^2 + \lambda \lVert f \rVert^2$ (forme
  SMLR/notes de cours Welling) ; d'autres conventions circulent
  (scikit-learn `KernelRidge` résout $(K + \alpha I)^{-1} y$, c.-à-d. sans le
  facteur $1/n$). **La leçon doit fixer son objectif explicitement** et la
  convention suit ; le cross-check ridge (voir ci-dessous) est invariant à la
  reparamétrisation près.

**Pont ridge (vérifié, idem source SMLR).** Avec le noyau linéaire et la
matrice de conception $X$ (lignes $x_i^\top$), $K = X X^\top$ et
$\hat y = K\alpha^\star = X (X^\top X + n\lambda I)^{-1} X^\top y$ — exactement
la solution ridge de paramètre $n\lambda$. **C'est le cross-check numérique à
coder dans les tests** : KRR (noyau linéaire, paramètre $\lambda$) ==
`ridgeSolver(X, y, n\lambda)`.

**Limites (vérifiées par la même dérivation).**
- $\lambda \to 0^+$ : si $K$ est inversible, $\alpha^\star \to K^{-1} y$ et
  $f^\star(x_i) = (K\alpha^\star)_i = y_i$ — **interpolation** des données.
- $\lambda \to +\infty$ : $\alpha^\star = (K + n\lambda I)^{-1} y \sim
  \frac{1}{n\lambda} y \to 0$, donc $f^\star \to 0$.

---

## RQ 5 — Noyaux universels, exemple gaussien, lien consistance

**Affirmation 5a — définition (vérifiée).** Un noyau continu $K$ sur un
espace métrique compact $X$ est dit **universel** si son RKHS
$\mathcal{H}_K$ est **dense dans $C(X)$** pour la norme uniforme —
équivalemment, $K$ peut approcher uniformément sur tout compact toute
fonction cible continue.
**Citation (abstract vérifiée, page JMLR) :** Micchelli, C. A., Xu, Y. & Zhang,
H. (2006). « Universal Kernels. » *Journal of Machine Learning Research*,
7(95) : 2651–2667. — « In this paper we investigate conditions on the features
of a continuous kernel so that it may approximate an arbitrary continuous
target function uniformly on any compact subset of the input space. »
URL : https://jmlr.org/papers/v7/micchelli06a.html

**Correction de citation par rapport au brief.** Le brief cite « Müller,
Kraskowski, Smola (2005) — noyaux universels ». **Aucun tel papier sur les
noyaux universels n'a été trouvé** (recherches multiples sans résultat) ; la
référence canonique est **Micchelli, Xu & Zhang (2006)** ci-dessus.

**Affirmation 5b — le noyau gaussien est universel (vérifié, chaîne
d'arguments).** Pour un noyau invariant par translation sur $\mathbb{R}^d$,
$K(x, x') = k(x - x')$ :
1. (Théorème de Bochner, classique) $K$ est PSD $\iff$ $k$ est la transformée
   de Fourier d'une mesure de probabilité $\mu$ sur $\mathbb{R}^d$.
2. (Micchelli–Xu–Zhang 2006, § 4 — « translation invariant kernels on
   $\mathbb{R}^d$ … several useful sufficient conditions for $K$ to be a
   universal translation invariant kernel » ; extrait de l'abstract/structure
   vérifié via la page JMLR ; le numéro exact du théorème dans le papier est
   **UNVERIFIED** car le PDF n'a pas pu être extrait) $K$ est universel
   $\iff$ la mesure spectrale $\mu$ est strictement positive (support plein).
3. Pour le noyau gaussien $k(t) = e^{-\gamma \lVert t \rVert^2}$, la
   transformée de Fourier est une **densité gaussienne**, strictement positive
   partout — donc le noyau gaussien est universel.

Remarque de cohérence avec le cours : le cours écrit le noyau gaussien sous la
forme $\exp(-\lVert x - \tilde x\rVert^2 / (2\sigma^2))$ — i.e.
$\gamma = 1/(2\sigma^2)$, convention déjà implémentée dans
`src/lib/math/svm.ts` (`gaussianKernel`).

**Affirmation 5c — consistance de la KRR avec noyau universel (classique ;
numéros de théorèmes UNVERIFIED).**

> **Théorème (consistance de la KRR, classique).** Soit $(X, \mu)$ un espace
> métrique compact avec $\mu$ probabilité, $K$ un noyau universel, et
> $f^\star_\mu$ la projection de carré intégrable de la cible dans
> $L^2(\mu)$ (fonction de régression). Soit $f^\star_{n, \lambda_n}$
> l'estimateur KRR de paramètre $\lambda_n$. Si $\lambda_n \to 0$ et
> $n \lambda_n \to +\infty$, alors
> $\lVert f^\star_{n, \lambda_n} - f^\star_\mu \rVert_{L^2(\mu)} \xrightarrow{\mathbb{P}} 0.$

**Citations (niveaux de livre, numéros de théorèmes UNVERIFIED — PDF non
extraites en ligne) :**
- Première preuve dans le cadre des RKHS denses : Kimeldorf, G. & Wahba, G.
  (1970) (voir RQ 3).
- Expositions modernes : Schölkopf & Smola (2002), *Learning with Kernels*,
  MIT Press, ch. 4 ; Wahba, G. (1990). *Spline Models for Observational Data.*
  SIAM, CBMS-NSFM 48 (livre vérifié via OpenAlex, DOI
  https://doi.org/10.1137/1.9781611970128).
- **Pour la leçon** : énoncer le résultat comme « théorème classique » avec
  ces références, et indiquer honnêtement que l'on renvoie aux ouvrages pour
  la preuve complète. Le résultat lui-même est standard (pas d'extension au-delà
  de l'état de l'art).

**Lien pédagogique avec le cours.** La consistance k-NN (Partie VIII, leçon 2)
est la version « locale » de la même idée : la densité de l'approximant
(k-voisins ou noyau universel) joue le rôle de « flexibilité suffisante », la
régularisation ($1/k$ ou $\lambda_n$) le rôle de contrôle de variance. Le pont
est pédagogique, pas un théorème des sources.

---

## RQ 6 — Ponts (SVM / k-NN / NTK)

### 6a — SVM à noyau = ERM dans un RKHS (vérifié, recodage du cours)

La duale duale à noyau enseignée (`coursClassif-4-SVM.tex`, eq. `optim6`,
frame « Formulation duale avec le noyau », lue directement) :

$$\widehat\alpha = \arg\max_\alpha \sum_{i=1}^n \alpha_i - \frac{1}{2}
\sum_{i,\ell} \alpha_i \alpha_\ell\, y_i y_\ell\, K(x_i, x_\ell)
\quad \text{s.c. } \sum_i \alpha_i y_i = 0,\; 0 \le \alpha_i \le C.$$

C'est un **ERM contraint dans le RKHS** : on optimise sur $\alpha \in \mathbb{R}^n$
les valeurs de $f = \sum_i \alpha_i y_i K(\cdot, x_i) \in \mathcal{H}_K$ aux
points d'entraînement — précisément ce que le théorème du représentant
justifie (la perte hinge est une fonction $E$ des valeurs $f(x_i)$, la
régularisation est $\frac{1}{2}\lVert f \rVert^2 = \frac{1}{2}\alpha^\top
(K \odot yy^\top) \alpha$… plus précisément $\lVert f\rVert^2 = \sum_{i,\ell}
\alpha_i \alpha_\ell y_i y_\ell K(x_i,x_\ell)$, ce qui est le terme quadratique
de la duale). Le classifieur est
$f(x) = \operatorname{sgn}\big[\sum_i \hat\alpha_i y_i K(x_i, x) + \hat b\big]$
(enseigné, idem).
**Aucune nouvelle exigence de source** : c'est une reformulation de contenu
cours + théorème du représentant (vérifié RQ 3).
Cross-reference à utiliser dans la leçon : Théorème 3.4 (Borne VC pour le SVM,
Vapnik 1995), `course_sources/typst/theorie.typ` ch. 3 l. 774 — la borne ne
dépend que de la marge, pas de la dimension : c'est le lien naturel vers la
généralisation moderne.

### 6b — k-NN = noyau uniforme local (pont leçon 1) — ILLUSTRATION, pas un théorème

Le classifieur/régresseur k-NN (leçon 1, `coursClassif-1-Intro.tex`) peut se
lire comme une régression à noyau avec un **noyau uniforme local**
(« boîte ») : le rayon de la boîte est la distance au $k$-ième voisin ; la
moyenne des $k$ voisins est la moyenne sur la boîte, i.e. le lissage
$\hat f(x) = \frac{\sum_i \mathbf{1}\{\lVert x_i - x\rVert \le r_k(x)\}}{\sum_i
\mathbf{1}\{\lVert x_i - x\rVert \le r_k(x)\}}\, y_i$. L'estimateur
Nadaraya–Watson (panneau expert `p2-l1-estimateurs-noyau-nadaraya-watson`, en
attente) est la version pondérée par une fenêtre. **Ce pont est une
illustration pédagogique** : aucun théorème des sources ne l'énonce ; le
présenter comme « lecture » et non comme résultat. (Le noyau « boîte » n'est
pas continu, donc pas au sens de Mercer/Micchelli–Xu–Zhang — à ne pas confondre
dans le texte.)

### 6c — NTK = noyau tangent (pont Partie IX) (vérifié)

> **Définition (Neural Tangent Kernel).** Pour un réseau
> $f_\theta : \mathcal{X} \to \mathbb{R}$ de paramètres $\theta$, le
> **noyau tangent neuronal** est
> $$K_{\mathrm{ntk}}(x, x') = \big\langle \nabla_\theta f_\theta(x),\;
> \nabla_\theta f_\theta(x') \big\rangle \quad \text{(évalué à
> l'initialisation)}.$$

**Citation.** Jacot, A., Gabriel, F. & Hongler, C. (2018). « Neural Tangent
Kernel: Convergence and Generalization in Neural Networks. » *NeurIPS 2018*
(arXiv :1806.07572). Vérifié via OpenAlex (W2809090039, DOI
10.48550/arXiv.1806.07572). L'abstract (reconstitué depuis l'index inversé
OpenAlex) confirme : les ANN à largeur infinie sont équivalentes à des
processus gaussiens ; la dynamique du gradient de descente est décrite par un
noyau (le NTK) qui **reste constant pendant l'entraînement** dans la limite de
largeur infinie ; convergence liée à la semi-définie positivité du NTK.
La définition elle-même ($\nabla_\theta f_\theta$) est la définition centrale
du papier — la formule exacte n'a pas pu être relue dans le PDF (non extrait) ;
le formalisme est confirmé par l'abstract et l'usage standard. **Marquer la
formule comme « définition centrale du papier, abstract vérifié »**.
**Out of scope du brief** : la leçon fait un pont (définition + phrase de
contexte), sans redérouler la théorie NTK (réservée à
`p9-lesson-ntk-generalisation-moderne`, en attente — ne pas donner de numéro de
page).

### 6d — (bonus, dans les références de départ du brief) Random features

Rahimi, A. & Recht, B. (2007). « Random Features for Large-Scale Kernel
Machines. » *NeurIPS 2007* (Advances in Neural Information Processing Systems
20). Vérifié via OpenAlex ; PDF :
http://books.nips.cc/papers/files/nips20/NIPS2007_0833.pdf. Approxime les
noyaux invariants par translation par un feature map aléatoire fini
(d'après la mesure spectrale de Bochner) — mention possible en une phrase dans
la leçon (remarque « scalabilité »), sans démo.

---

## Contenu déjà enseigné (ne pas réenseigner) — vérifié dans les sources

- **k-NN** : `coursClassif-1-Intro.tex` (leçon 1, Partie II).
- **Noyaux PSD, feature maps, astuce du noyau, théorème de Moore–Aronszajn
  (version cours), exemples de noyaux, duale à noyau, matrice de Gram** :
  `coursClassif-4-SVM.tex` § « SVM à noyau » (leçon 4, Partie II), démos
  `KernelPSDExplorer` / `FeatureMapExplorer`.
- **Théorème 3.4 (borne VC pour le SVM)** : `course_sources/typst/theorie.typ`
  ch. 3 (Partie IX, leçon 3) — cross-reference, pas à réenseigner.
- **Ridge régression** (Partie V, leçon 4) : `src/lib/math/regression.ts`
  `ridgeSolver` — utilisé pour le pont KRR-linéaire.
- La note commentée `coursClassif-4-SVM.tex` l. 1542 (« l'astuce du noyau
  s'applique aussi à … la régression ridge ») confirme que **la KRR n'est pas
  au programme du cours** — la leçon expert la présente comme construction du
  site.

## Récapitulatif des citations corrigées / UNVERIFIED

| Élément du brief | Statut |
|---|---|
| « Aronszajn 1944, Pacific J. Math. » | **ERRONÉ** → Aronszajn 1950, Trans. AMS 68(3):337–404 (DOI vérifié) |
| « Müller, Kraskowski, Smola (2005) » | **NON TROUVÉ** → Micchelli, Xu & Zhang 2006, JMLR 7:2651–2667 (vérifié) |
| Schölkopf & Smola 2002, n° de propositions ch. 4 | **UNVERIFIED** (PDF non extrait) |
| Kimeldorf & Wahba 1970, journal exact | **UNVERIFIED** (attribution vérifiée, 2 sources) |
| Micchelli–Xu–Zhang 2006, n° exact du théorème | **UNVERIFIED** (abstract/structure vérifiés) |
| Aronszajn « Première partie » 1943/44, venue | **UNVERIFIED** (non nécessaire à la leçon) |
| Jacot et al. 2018, formule NTK exacte | Formule = définition centrale du papier ; abstract vérifié, PDF non relu |
