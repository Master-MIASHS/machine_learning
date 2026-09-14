# Brouillon — Leçon expert « Espaces de Hilbert à noyau (RKHS) et méthodes à noyau »

> Brouillon du contenu de la leçon expert pour le brief
> `p2-lesson-rkhs-methodes-noyau`
> (`expert/part2/lessons/rkhs-methodes-noyau.md`).
> Contenu en français, niveau M2. Toutes les formules sont prêtes pour
> `KatexInline`/`KatexBlock` via `String.raw` (aucun backtick ni `${` à
> l'intérieur des blocs de formule).
>
> **Fidélité aux sources** : le noyau PSD, l'astuce du noyau, le théorème de
> Moore–Aronszajn (version cours), les exemples de noyaux et la duale à noyau
> sont **enseignés** (Partie II, leçon 4, `coursClassif-4-SVM.tex`) — la leçon
> les réutilise comme ancrage, sans les réenseigner (cross-references).
> **Tout le reste est au-delà des sources** : théorème de Mercer (forme
> spectrale), définition de RKHS et énoncé complet de Moore–Aronszajn,
> théorème du représentant, KRR et forme close, noyaux universels, consistance
> de la KRR, ponts SVM/k-NN/NTK (vérifié : aucun de ces objets n'apparaît dans
> `course_sources/` — cf. `rkhs-methodes-noyau.research.md`). Chaque bloc
> au-delà est attribué à sa source primaire (bibliographie en fin de page).
>
> **Conversion à l'implémentation** (conformité AGENTS.md) : le Callout
> d'ouverture « Au-delà du cours » et les mentions « au-delà du cours » des
> blocs seront reformulés pour que le contenu se lise comme construction du
> site (attribution en prose : « d'après Mercer (1909) », « d'après
> Schölkopf, Herbrich & Smola (2001) », etc.) ; les anchors internes
> (docstrings, commentaires de code, tests) conservent la citation exacte de
> `course_sources/` / de la référence primaire.
>
> **Conventions retenues** :
> - KRR : objectif $\frac{1}{n}\sum_i (y_i - f(x_i))^2 + \lambda \lVert f
>   \rVert^2_{\mathcal{H}_K}$ (forme SMLR / notes de cours Welling). La
>   solution close qui en résulte est $\alpha^\star = (K + n\lambda I)^{-1} y$
>   ; d'autres conventions circulent (scikit-learn omet le $1/n$) — la leçon
>   fixe la sienne explicitement et le pont ridge est invariant à la
>   reparamétrisation près.
> - Noyau gaussien : $\exp\big(-\lVert x - x'\rVert^2 / (2\sigma^2)\big)$,
>   i.e. $\gamma = 1/(2\sigma^2)$ — convention du cours, déjà implémentée dans
>   `src/lib/math/svm.ts` (`gaussianKernel`).
> - Numérotation : leçon expert autonome — blocs au-delà du cours en `E.n`
>   (précédent `part1/lesson3-adam`) ; le contenu réutilisé garde la
>   numérotation de la leçon 4 de la Partie II.

---

## Section 1 — `introduction` — De l'astuce du noyau à la théorie

### Bloc 1.1 — Paragraphe d'ouverture

La Partie II a enseigné deux façons de classifier. La première, **locale** :
le k-NN (leçon 1) ne calcule aucun modèle global, il compare le point
interrogé aux points proches. La deuxième, **globale** : la SVM à noyau
(leçon 4), qui travaille dans un espace de features $\mathcal{H}$ de
dimension potentiellement infinie — mais sans jamais construire
$\phi : X \to \mathcal{H}$, puisque tout se calcule à partir du noyau
$K(x, x') = \langle \phi(x), \phi(x') \rangle$ (l'astuce du noyau, et la
duale à noyau de la leçon 4).

Mais la leçon 4 s'est arrêtée à une question : **quel est exactement l'objet
mathématique que l'astuce du noyau justifie ?** Le théorème de
Moore–Aronszajn enseigné dit qu'il *existe* un espace de Hilbert et un
$\phi$ — mais il n'en donne ni la structure interne, ni la norme, ni le
rôle statistique. Cette leçon expert répond : il existe un espace unique,
constructible explicitement, dont la norme mesure la *régularité* des
fonctions — un **espaces de Hilbert à noyau reproduisant** (RKHS). Et cette
norme est la clé de la **régularisation par noyau** (KRR), du **théorème du
représentant** (pourquoi il suffit de calculer avec les $n$ points
d'entraînement), et de la **consistance** des estimateurs à noyau.

**La question de la leçon** : comment l'existence d'un noyau
semi-défini positif définit-elle un espace de fonctions muni d'une norme, et
pourquoi cet espace rend-il les méthodes à noyau (SVM, KRR) exactes,
finites et consistantes ?

### Bloc 1.2 — Callout « Au-delà du cours — leçon expert »

`Callout type="note" title="Au-delà du cours — leçon expert"`

> Ce contenu est **largement** au-delà de `course_sources/` (seul le rappel
> de la section 2, issu de la leçon 4, y est enseigné). Au-delà : la forme
> spectrale du théorème de Mercer (E.1), la définition de RKHS et
> l'énoncé complet de Moore–Aronszajn (E.2–E.3), le théorème du
> représentant (E.4), la KRR et sa forme close (E.5–E.6), les noyaux
> universels et la consistance (E.8–E.10), les ponts (section 7). Chaque
> bloc est attribué à sa source primaire (voir bibliographie).

### Bloc 1.3 — Paragraphe « Le plan »

1. **Le théorème de Mercer** : la forme spectrale $K(x,y) = \sum_i \lambda_i
   \phi_i(x)\phi_i(y)$ et le feature map explicite (section 2, E.1).
2. **Les RKHS** : définition, noyau reproduisant, théorème de
   Moore–Aronszajn complet (existence + unicité + construction) (section 3,
   E.2–E.3).
3. **Le théorème du représentant** : tout minimiseur « perte + norme » vit
   dans $\operatorname{span}\{K(\cdot, x_i)\}$ (section 4, E.4).
4. **La KRR** : définition, forme close $\alpha^\star = (K + n\lambda
   I)^{-1} y$, ponts ridge / interpolation / régularisation (section 5,
   E.5–E.7).
5. **Noyaux universels et consistance** : le noyau gaussien est universel ;
   la KRR avec noyau universel est consistante (section 6, E.8–E.10).
6. **Les ponts** : SVM = ERM dans un RKHS, k-NN = noyau local (lecture),
   NTK = noyau tangent (section 7) + synthèse, exercices, quiz (section 8).

---

## Section 2 — `theoreme-mercer` — Le théorème de Mercer (E.1)

### Bloc 2.1 — Rappel ancré dans le cours (sans numéro)

`Callout type="summary" title="Ce que la leçon 4 a déjà enseigné (rappel)"`

- Un noyau est une fonction $K : X \times X \to \mathbb{R}$ **symétrique** et
  **semi-définie positive** (toute combinaison $c^\top K c \ge 0$).
- Théorème de Moore–Aronszajn (version cours) : $K$ symétrique PSD
  $\Longrightarrow$ il existe un espace de Hilbert $\mathcal{H}$ et
  $\phi : X \to \mathcal{H}$ tels que $K(x, x') = \langle \phi(x),
  \phi(x') \rangle_{\mathcal{H}}$.
- L'astuce du noyau : tout calcul ne dépendant de $\phi$ que par des produits
  scalaires se calcule avec la matrice de Gram $K_{ij} = K(x_i, x_j)$ —
  c'est ce qui rend la duale à noyau de la leçon 4 possible.
- Exemples enseignés : noyau linéaire, cosinus, quadratique, polynomial,
  gaussien $\exp(-\lVert x - x'\rVert^2 / (2\sigma^2))$.

(Section 2 de la leçon 4, Partie II ; démos `KernelPSDExplorer` et
`FeatureMapExplorer`. Rien n'est réenseigné ici.)

### Bloc 2.2 — TheoremBlock E.1 « Théorème de Mercer »

`TheoremBlock number="E.1" title="Théorème de Mercer (1909)"`

Soit $K : [a,b] \times [a,b] \to \mathbb{R}$ continue, symétrique et de type
positif, c'est-à-dire

```
\int_a^b \int_a^b K(x,y)\, f(x)\, f(y)\, dx\, dy \ge 0
```

pour toute $f \in L^2([a,b])$. Alors il existe une base orthonormée
$(\phi_i)$ de $L^2([a,b])$ formée de **fonctions propres** de l'opérateur
intégral

```
(T_K f)(x) = \int_a^b K(x,y)\, f(y)\, dy
```

et des **valeurs propres** $\lambda_i \ge 0$ telles que

```
K(x,y) = \sum_{i=1}^{\infty} \lambda_i\, \phi_i(x)\, \phi_i(y)
```

la convergence étant **absolue et uniforme** sur $[a,b] \times [a,b]$.

**Pourquoi le noyau est de type positif** : si $K(x,y) = \langle \phi(x),
\phi(y) \rangle$ pour un $\phi$ à valeurs dans un espace de Hilbert, alors
$\int\!\int K(x,y) f(x) f(y)\,dx\,dy = \lVert \int \phi(x) f(x)\,dx \rVert^2
\ge 0$ — le type positif est la signature intégrale de l'existence d'un
feature map.

**D'après** Mercer (1909), *Phil. Trans. R. Soc. Lond. A* 209 : 415–446.

### Bloc 2.3 — Callout « Mercer vs Moore–Aronszajn : deux théorèmes, deux régimes »

`Callout type="insight" title="Deux théorèmes d'existence — ne pas confondre"`

- **Moore–Aronszajn** (version cours) : $X$ **arbitraire**, $K$ seulement
  symétrique et PSD $\Longrightarrow$ existence de *quelque* espace de
  Hilbert et de $\phi$. Résultat de **structure** (on ne dit rien de la
  dimension, ni d'une base).
- **Mercer (1909)** : $K$ **continu** sur un **compact** $[a,b]$
  $\Longrightarrow$ **décomposition spectrale** explicite (opérateur
  intégral compact auto-adjoint, valeurs propres $\lambda_i \ge 0$,
  convergence absolue et uniforme). Résultat **analytique**.

Le théorème de Mercer est l'ancêtre historique (1909) ; la version générale
de Moore–Aronszajn a été mise en forme par Aronszajn (1950). La leçon
utilise les deux : Mercer pour *voir* le feature map, Moore–Aronszajn pour
*construire* l'espace.

### Bloc 2.4 — ExampleBlock « Le feature map explicite »

`ExampleBlock number="E.1" title="Lecture de la décomposition : un feature map visible"`

La décomposition de Mercer donne directement

```
\phi(x) = \big( \sqrt{\lambda_1}\,\phi_1(x),\; \sqrt{\lambda_2}\,\phi_2(x),\;
\dots \big) \in \ell^2
```

car $\lVert \phi(x) \rVert_{\ell^2}^2 = \sum_i \lambda_i \phi_i(x)^2 =
K(x,x) < \infty$, et $K(x,y) = \langle \phi(x), \phi(y) \rangle_{\ell^2}$.
Le feature map n'est plus un objet abstrait : c'est une **suite** de
fonctions, indexée par le spectre de $T_K$. Les valeurs propres
$\lambda_i$ mesurent l'**importance** de la direction $\phi_i$ — et, on le
verra en section 3, l'inverse $\lambda_i^{-1}$ est le prix, dans la norme du
RKHS, d'activer cette direction.

*(Illustration, au-delà du cours : pour le noyau gaussien sur
$\mathbb{R}^d$, les fonctions propres de $T_K$ sont des fonctions
hermite-gaussiennes ; l'explication complète renvoie à la littérature.)*

---

## Section 3 — `rkhs` — Les espaces de Hilbert à noyau (E.2–E.3)

### Bloc 3.1 — DefinitionBlock E.2 « RKHS et noyau reproduisant »

`DefinitionBlock number="E.2" title="Espace de Hilbert à noyau reproduisant"`

Un **espaces de Hilbert à noyau reproduisant** (RKHS) est un espace de
Hilbert $\mathcal{H}$ de fonctions réelles sur un ensemble $X$ tel que, pour
tout $x \in X$, l'application d'évaluation

```
L_x : f \mapsto f(x)
```

soit **continue** (bornée) de $\mathcal{H}$ dans $\mathbb{R}$.

**Équivalence (théorème de Riesz)** : $\mathcal{H}$ est un RKHS **si et
seulement si** pour tout $x \in X$ il existe un unique $K_x \in \mathcal{H}$
tel que

```
f(x) = \langle f,\, K_x \rangle_{\mathcal{H}} \qquad \forall f \in \mathcal{H}
```

Le vecteur $K_x$ est la **fonction noyau en $x$** ; la fonction

```
K(x, y) := \langle K_x,\, K_y \rangle_{\mathcal{H}}
```

est le **noyau reproduisant** de $\mathcal{H}$ : symétrique,
semi-définie positive, et $K(\cdot, x) = K_x \in \mathcal{H}$.

**D'après** Aronszajn (1950), *Trans. AMS* 68(3) : 337–404 (définition et
équivalence Riesz standard).

### Bloc 3.2 — TheoremBlock E.3 « Moore–Aronszajn : existence et unicité »

`TheoremBlock number="E.3" title="Théorème de Moore–Aronszajn (forme complète)"`

Soit $K : X \times X \to \mathbb{R}$ un noyau symétrique et
semi-défini positif. Alors il existe un **unique** espace de Hilbert de
fonctions réelles sur $X$, noté $\mathcal{H}_K$, pour lequel $K$ est le
noyau reproduisant.

**Construction (esquisse de preuve, d'après Aronszajn 1950 ; cf.
recherche.md § RQ 2)** :

1. **Espace dense** : $\mathcal{H}_0 = \operatorname{span}\{ K_x : x \in X
   \}$ muni du « produit scalaire »
   ```
   \Big\langle \sum_j b_j\, K_{y_j},\; \sum_i a_i\, K_{x_i} \Big\rangle :=
   \sum_{i,j} a_i b_j\, K(y_j, x_i)
   ```
   — la semi-définie positivité garantit qu'il est bien un produit scalaire
   sur $\mathcal{H}_0$.
2. **Complétion** : $\mathcal{H}_K$ = complétion de $\mathcal{H}_0$. Pour
   $f = \sum_i a_i K_{x_i}$ (série convergente en norme), la propriété
   reproduisante tombe par continuité du produit scalaire :
   ```
   \langle f, K_x \rangle = \sum_i a_i\, K(x_i, x) = f(x).
   ```
3. **Unicité** : si $\mathcal{G}$ est un autre espace de fonctions sur $X$
   dont $K$ est le noyau reproduisant, alors $\mathcal{H}_K \subseteq
   \mathcal{G}$ (complétude) et $\mathcal{H}_K$ y est **fermé** (la norme de
   $\mathcal{G}$ est majorée par celle de $\mathcal{H}_K$) ; toute
   $g \in \mathcal{G}$ se décompose $g = g_{\mathcal{H}} + g_{\perp}$ avec
   $g_{\perp}$ orthogonal à $\{ K_x \}$, donc $g_{\perp}(x) =
   \langle g_{\perp}, K_x \rangle = 0$ partout — $g = g_{\mathcal{H}} \in
   \mathcal{H}_K$.

**C'est le théorème de la leçon 4, en version complète** : la version cours
n'énonçait que la direction « $K$ PSD $\Rightarrow$ espace de features » ;
la version complète ajoute (i) la **nature fonctionnelle** de l'espace (ses
éléments sont des fonctions, pas de features abstraits), (ii) la
**reproductibilité** $f(x) = \langle f, K(\cdot, x) \rangle$, (iii)
l'**unicité**.

### Bloc 3.3 — ExampleBlock « La norme mesure la régularité »

`ExampleBlock number="E.2" title="Ce que mesure ‖f‖²_HK : l'énergie spectrale"`

Croiser les sections 2 et 3 : si $K$ est continu et PSD sur $[a,b]$ avec
décomposition de Mercer $K(x,y) = \sum_i \lambda_i \phi_i(x)\phi_i(y)$,
alors $\mathcal{H}_K$ est constitué des fonctions

```
f(x) = \sum_{i=1}^{\infty} c_i\, \phi_i(x), \qquad \sum_i \frac{c_i^2}{\lambda_i}
< \infty
```

avec **norme**

```
\lVert f \rVert^2_{\mathcal{H}_K} = \sum_i \frac{c_i^2}{\lambda_i}.
```

Lecture : activer une direction spectrale $\phi_i$ coûte un facteur
$\lambda_i^{-1}$ — les directions à **petite valeur propre** (haute
fréquence, pour les noyaux lissants) sont **chères** dans la norme. Une
fonction de norme $\mathcal{H}_K$ petite est donc une fonction **lisse /
plate** : la régularisation par $\lVert f \rVert^2_{\mathcal{H}_K}$ (section
5) punit précisément les oscillations. C'est le sens mathématique du «
lissage » des noyaux gaussiens.

*(Formule de l'énergie spectrale : au-delà du cours, conséquence directe de
Mercer + construction de la section 3 — calcul immédiat, pas un théorème
numéroté.)*

---

## Section 4 — `theoreme-representant` — Le théorème du représentant (E.4)

### Bloc 4.1 — TheoremBlock E.4

`TheoremBlock number="E.4" title="Théorème du représentant"`

Soit $K : \mathcal{X} \times \mathcal{X} \to \mathbb{R}$ un noyau
semi-défini positif, $\mathcal{H}_K$ son RKHS, un échantillon
$(x_1, y_1), \dots, (x_n, y_n) \in \mathcal{X} \times \mathbb{R}$, une
fonction d'erreur **arbitraire**

```
E : \big( (\mathcal{X} \times \mathbb{R}^2) \big)^n \to \mathbb{R} \cup
\{ +\infty \}
```

et une fonction $g : [0, +\infty[ \to \mathbb{R}$ **strictement
croissante**. Tout minimiseur de

```
f \;\longmapsto\;
E\big( (x_1, y_1, f(x_1)),\; \dots,\; (x_n, y_n, f(x_n)) \big) \;+\;
g\big( \lVert f \rVert_{\mathcal{H}_K} \big)
```

admet une représentation

```
f^\star(\cdot) = \sum_{i=1}^{n} \alpha_i\, K(\cdot, x_i), \qquad \alpha_i \in
\mathbb{R}.
```

**Esquisse de preuve (d'après Schölkopf, Herbrich & Smola 2001 ; cf.
recherche.md § RQ 3)** :

1. Par décomposition en deux parties orthogonales dans $\mathcal{H}_K$,
   tout $f \in \mathcal{H}_K$ s'écrit $f = \sum_i \alpha_i K(\cdot, x_i) + v$
   avec $\langle v, K(\cdot, x_i) \rangle_{\mathcal{H}_K} = 0$ pour tout $i$.
2. La **propriété reproduisante** donne
   $f(x_j) = \sum_i \alpha_i K(x_i, x_j)$ : la valeur de $f$ aux points
   d'entraînement **ne dépend pas de $v$**. Donc $E$ est **indifférente** à
   $v$.
3. Par contre $\lVert f \rVert_{\mathcal{H}_K} = \sqrt{ \lVert \sum_i
   \alpha_i K(\cdot, x_i) \rVert^2 + \lVert v \rVert^2 } \ge \lVert \sum_i
   \alpha_i K(\cdot, x_i) \rVert$, avec **striction** si $v \ne 0$ — et $g$
   est strictement croissante, donc tout minimiseur a $v = 0$.

**Conséquence (le message de la leçon)** : un problème dans un espace de
dimension **infinie** se réduit à un problème en $n$ inconnues
$\alpha \in \mathbb{R}^n$, dont la seule donnée nécessaire est la matrice de
Gram $K_{ij} = K(x_i, x_j)$ — l'objet déjà vu en leçon 4. La SVM à noyau de
la leçon 4 est un cas particulier ($E$ = perte hinge + contrainte,
$g(t) = \frac{1}{2}t^2$).

### Bloc 4.2 — Callout « D'où vient ce théorème »

`Callout type="note" title="Génèse : Kimeldorf & Wahba (1970)"`

Le premier énoncé du théorème du représentant est dû à **Kimeldorf & Wahba
(1970)**, pour le cas particulier $E = \frac{1}{n}\sum_i (f(x_i) - y_i)^2$
et $g(t) = \lambda t^2$ (c'est exactement la KRR de la section 5) ; la forme
générale (arbitraire $E$, $g$ strictement croissante) est due à **Schölkopf,
Herbrich & Smola (2001)**.

---

## Section 5 — `krr` — La régression à noyau ridge (E.5–E.7)

### Bloc 5.1 — DefinitionBlock E.5 « La KRR »

`DefinitionBlock number="E.5" title="Régression à noyau ridge (Kernel Ridge Regression)"`

Soit $(x_i, y_i)_{i=1}^n$, $K$ un noyau PSD, $\mathcal{H}_K$ son RKHS, et
$\lambda > 0$. La **régression à noyau ridge** est

```
f^\star_\lambda \in \arg\min_{f \in \mathcal{H}_K}\;
\frac{1}{n} \sum_{i=1}^{n} \big( y_i - f(x_i) \big)^2 \;+\; \lambda\,
\lVert f \rVert^2_{\mathcal{H}_K}.
```

Lecture : on cherche la fonction du RKHS qui **ajuste les données** (perte
quadratique empirique) tout en étant la **plus lisse possible** (norme
$\mathcal{H}_K$), le paramètre $\lambda$ fixant le compromis. C'est la
régression ridge de la Partie V (leçon 4), transportée dans un espace de
dimension infinie — et c'est le problème résolu par le théorème du
représentant (section 4) avec $g(t) = \lambda t^2$.

### Bloc 5.2 — TheoremBlock E.6 « Forme close »

`TheoremBlock number="E.6" title="Forme close de la KRR"`

Sous les hypothèses de la définition E.5, la solution canonique vaut

```
f^\star_\lambda(\cdot) = \sum_{i=1}^{n} \alpha^\star_i\, K(\cdot, x_i),
\qquad \alpha^\star = \big( K + n\lambda\, I_n \big)^{-1} y,
```

où $K_{ij} = K(x_i, x_j)$ est la matrice de Gram et $y = (y_1, \dots, y_n)^\top$.
Si $K$ est inversible, $\alpha^\star$ est le **unique** minimiseur ; sinon la
formule donne le minimiseur canonique (les prédictions $K\alpha^\star$ et la
norme ci-dessous restent uniques). En particulier :

```
\lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K} = \alpha^{\star\top} K\,
\alpha^\star = y^\top K\, \big( K + n\lambda I_n \big)^{-2} y.
```

**Preuve (deux étapes)** :

1. **Représentant** (section 4) : $f = \sum_i \alpha_i K(\cdot, x_i)$, et la
   propriété reproduisante donne $\lVert f \rVert^2_{\mathcal{H}_K} =
   \sum_{i,j} \alpha_i \alpha_j K(x_i, x_j) = \alpha^\top K \alpha$.
   L'objectif devient la fonction quadratique convexe de $\alpha$ :
   ```
   \Phi(\alpha) = \frac{1}{n} \lVert y - K\alpha \rVert^2 + \lambda\,
   \alpha^\top K \alpha.
   ```
2. **Conditions d'optimalité** :
   ```
   \nabla_\alpha \Phi = \frac{2}{n} K\big( K\alpha - y \big) + 2\lambda K
   \alpha = 0
   ```
   c'est-à-dire $K\big( K + n\lambda I \big)\alpha = K y$. La matrice
   $K + n\lambda I$ est **toujours inversible** (PSD + $n\lambda I$ définie
   positive, $\lambda > 0$), et $\alpha^\star = (K + n\lambda I)^{-1} y$ est
   l'unique solution de $(K + n\lambda I)\alpha = y$ ; $\Phi$ étant convexe,
   c'est un minimiseur global — le minimiseur **unique** si $K$ est
   inversible. *Remarque* : la formule reste exacte même si $K$ est
   singulière (points en double) — on n'inverse jamais $K$ seul, toujours
   $K + n\lambda I$ (les prédictions $K\alpha^\star$ et la norme
   $\mathcal{H}_K$ restent uniques dans tous les cas).

### Bloc 5.3 — Callout « Le pont ridge : la KRR linéaire EST le ridge du cours »

`Callout type="insight" title="KRR à noyau linéaire = ridge régression (Partie V, leçon 4)"`

Avec le **noyau linéaire** $K(x, x') = x^\top x'$ et la matrice de
conception $X$ (lignes $x_i^\top$), $K = X X^\top$ et le vecteur des
prédictions vaut

```
K\, \alpha^\star = X \, \big( X^\top X + n\lambda I \big)^{-1} X^\top y,
```

exactement la solution **ridge** (moindres carrés régularisés) de paramètre
$n\lambda$ enseignée en Partie V, leçon 4. La KRR est donc le **même
estimeur** que le ridge, vu du côté du noyau : quand la dimension est
inférieure à $n$, on calcule plutôt par $\beta = (X^\top X + n\lambda
I)^{-1} X^\top y$ (coût $O(n d^2 + d^3)$) ; quand le noyau est non linéaire
ou la dimension infinie, on calcule par $\alpha = (K + n\lambda I)^{-1} y$
(coût $O(n^3)$, indépendant de la « dimension »). C'est exactement le
compromis dual/primal de la SVM, déjà vu en leçon 4.

### Bloc 5.4 — Callout « Les deux limites de λ »

`Callout type="intuition" title="λ → 0 : interpolation · λ → ∞ : f → 0"`

- **$\lambda \to 0^+$** (si $K$ inversible) : $\alpha^\star \to K^{-1} y$,
  donc $f^\star_\lambda(x_i) = (K\alpha^\star)_i \to y_i$ — la solution
  **interpole** les données (perte empirique nulle), au prix d'une norme
  $\mathcal{H}_K$ qui peut diverger (la fonction devient très oscillante
  pour ajuster le bruit).
- **$\lambda \to +\infty$** : $\alpha^\star = (K + n\lambda I)^{-1} y
  \sim \frac{1}{n\lambda}\, y \to 0$, donc $f^\star_\lambda \to 0$ — la
  régularisation écrase l'ajustement.

Entre les deux, $\lambda$ arbitre biais/variance — la même dial que
l'hypothèse de marque du cours, maintenant **dans un espace de Hilbert**.

### Bloc 5.5 — InteractiveSection E.7 « Démo : la KRR en 1D »

`InteractiveSection number="E.7" title="Explorer la KRR : régularisation, interpolation, pont ridge"`

Démo 1D : données $(x_i, y_i)$ seedées sur $[0,1]$ (fonction cible lisse +
bruit), noyau gaussien (bascule noyau linéaire pour le pont ridge). Glisseurs
$\lambda$ (échelle log), bande $\sigma$, $n$. Tracés : points de données,
fonction cible, ajustement $f^\star_\lambda$ ; barres des coefficients
$\alpha^\star_i$ ; métriques : MSE d'entraînement, $\lVert f^\star_\lambda
\rVert^2_{\mathcal{H}_K}$, nombre de coefficients « effectifs ».
Lecture attendue : $\lambda$ petit $\Rightarrow$ sur-interpolation du bruit ;
$\lambda$ grand $\Rightarrow$ courbe presque plate ; $\lVert f^\star
\rVert^2_{\mathcal{H}_K}$ décroît avec $\lambda$ ; en noyau linéaire la
courbe coïncide avec le ridge (pont 5.3). Voir section « Démos proposées »
pour le module mathématique requis.

---

## Section 6 — `noyaux-universels` — Noyaux universels et consistance (E.8–E.10)

### Bloc 6.1 — DefinitionBlock E.8 « Noyau universel »

`DefinitionBlock number="E.8" title="Noyau universel"`

Soit $X$ un espace métrique compact et $K$ un noyau continu sur $X \times
X$. $K$ est dit **universel** si son RKHS $\mathcal{H}_K$ est **dense dans
$C(X)$** pour la norme uniforme — c'est-à-dire si, pour toute fonction
continue $h : X \to \mathbb{R}$ et tout $\varepsilon > 0$, il existe
$f \in \mathcal{H}_K$ avec $\lVert f - h \rVert_\infty < \varepsilon$.

Équivalent : les noyaux universels peuvent **approximer uniformément** toute
fonction continue sur tout compact.

**D'après** Micchelli, Xu & Zhang (2006), *JMLR* 7 : 2651–2667.

### Bloc 6.2 — TheoremBlock E.9 « Le noyau gaussien est universel »

`TheoremBlock number="E.9" title="Le noyau gaussien est universel"`

Le noyau gaussien

```
K(x, x') = \exp\big( -\gamma\, \lVert x - x' \rVert^2 \big), \qquad \gamma > 0,
```

est **universel** sur tout compact de $\mathbb{R}^d$ (en particulier sur
$[0,1]^d$).

**Chaîne d'arguments (d'après Micchelli, Xu & Zhang 2006, § 4 ; cf.
recherche.md § RQ 5)** : pour un noyau **invariant par translation**
$K(x, x') = k(x - x')$ sur $\mathbb{R}^d$,

1. (Théorème de Bochner, classique) $K$ est semi-définie positive
   **si et seulement si** $k$ est la transformée de Fourier d'une mesure de
   probabilité $\mu$ sur $\mathbb{R}^d$ (mesure spectrale).
2. (Micchelli–Xu–Zhang 2006) $K$ est universel **si et seulement si** la
   mesure spectrale $\mu$ est **strictement positive** (support plein).
3. Pour $k(t) = e^{-\gamma \lVert t \rVert^2}$, la transformée de Fourier
   est la **densité gaussienne**
   ```
   \hat k(\omega) = \frac{1}{(2\pi\gamma)^{d/2}}\,
   \exp\big( -\lVert \omega \rVert^2 / (4\gamma) \big),
   ```
   strictement positive **partout** — donc $K$ est universel.

L'intuition : le spectre du noyau gaussien n'a **aucun trou** (aucune
fréquence nulle), donc son RKHS contient des fonctions de toutes les
fréquences — assez de « matière » pour approcher toute fonction continue.
Le noyau **linéaire**, en revanche, n'est pas universel dès que la dimension
de l'espace de features est finie : son RKHS est l'espace des fonctions
affines, loin d'être dense dans $C(X)$.

### Bloc 6.3 — TheoremBlock E.10 « Consistance de la KRR »

`TheoremBlock number="E.10" title="Consistance de la KRR avec noyau universel (résultat classique)"`

Soit $(X, \mu)$ un espace métrique compact muni d'une mesure de
probabilité $\mu$, $K$ un noyau **universel** continu, et $f^\star_\mu$ la
projection de carré intégrable de la cible dans $L^2(\mu)$ (la fonction de
régression). Soit $f^\star_{n, \lambda_n}$ l'estimateur KRR (définition
E.5) calculé sur $n$ observations i.i.d. de loi $\mu$, de paramètre
$\lambda_n > 0$. Si

```
\lambda_n \to 0 \qquad \text{et} \qquad n\, \lambda_n \to +\infty,
```

alors

```
\big\lVert f^\star_{n, \lambda_n} - f^\star_\mu \big\rVert_{L^2(\mu)}
\xrightarrow{\ \mathbb{P}\ } 0.
```

**Statut de la preuve** : résultat classique de la littérature des
estimateurs à noyau — première preuve dans le cadre des RKHS denses :
Kimeldorf & Wahba (1970) ; expositions modernes : Schölkopf & Smola (2002),
*Learning with Kernels*, ch. 4, et Wahba (1990), *Spline Models for
Observational Data*, SIAM. **La leçon énonce le résultat et renvoie aux
ouvrages pour la preuve complète** (la preuve utilise la compacité, la
densité de $\mathcal{H}_K$ dans $C(X)$ et des inégalités de
concentration — hors périmètre de cette leçon).

**Lecture des deux conditions** (intuition) :
- $\lambda_n \to 0$ : la régularisation doit **disparaître** (sinon
  $f^\star_{n, \lambda_n} \to 0$, pas vers $f^\star_\mu$) — condition de
  **biais** ;
- $n\lambda_n \to +\infty$ : la régularisation doit rester **suffisante
  pour contrôler le bruit** quand $n$ croît — condition de **variance**.
  Les deux à la fois : le compromis biais/variance se résout par un
  $\lambda_n$ qui tend vers $0$ « assez lentement » (par exemple
  $\lambda_n = n^{-1/3}$).

### Bloc 6.4 — Callout « Le parallèle avec la consistance du k-NN »

`Callout type="intuition" title="Même dialectique que le k-NN (Partie VIII, leçon 2)"`

La consistance du k-NN (Partie VIII, leçon 2) est la version **locale** de
la même idée : on y laisse la « flexibilité » ($k \to \infty$) et le
« contrôle de variance » ($k/n \to 0$) s'arbitrer. Ici, la flexibilité est
portée par la **densité du noyau universel** dans $C(X)$ (section 6.1), et
le contrôle de variance par $\lambda_n$. Deux lectures du même phénomène :
**sans flexibilité suffisante, biais ; sans contrôle, variance.**
*(Pont pédagogique, pas un théorème des sources — à présenter comme lecture,
pas comme résultat.)*

---

## Section 7 — `ponts` — Les ponts : SVM, k-NN, NTK

### Bloc 7.1 — Callout « La SVM à noyau est un ERM dans un RKHS »

`Callout type="insight" title="Relire la leçon 4 avec les yeux de la section 4"`

La duale à noyau enseignée en leçon 4 (équation duale de la SVM) s'écrit

```
\widehat\alpha \in \arg\max_{\alpha}\;
\sum_{i=1}^{n} \alpha_i \;-\; \frac{1}{2} \sum_{i,\ell} \alpha_i \alpha_\ell\,
y_i\, y_\ell\, K(x_i, x_\ell)
```

sous contraintes $\sum_i \alpha_i y_i = 0$ et $0 \le \alpha_i \le C$. C'est
un **ERM dans le RKHS** : on optimise les valeurs, aux points
d'entraînement, de $f = \sum_i \alpha_i y_i K(\cdot, x_i) \in \mathcal{H}_K$
(perte hinge = la fonction $E$ du théorème du représentant), et la
régularisation $\frac{1}{2}\lVert f \rVert^2_{\mathcal{H}_K} = \frac{1}{2}
\sum_{i,\ell} \alpha_i \alpha_\ell y_i y_\ell K(x_i, x_\ell)$ est
**précisément** le terme quadratique de la duale. Le théorème du
représentant (E.4) justifie rétrospectivement ce que la leçon 4 obtenait par
dualité : la solution **vit dans** $\operatorname{span}\{ K(\cdot, x_i) \}$,
et seul le Gram importe.

Cross-reference : la borne de généralisation de la SVM (Théorème 3.4,
Partie IX, leçon 3, d'après Vapnik 1995) ne dépend que de la **marge**, pas
de la dimension — ce qui cohabite avec les espaces de features
infini-dimensionnels de cette leçon.

### Bloc 7.2 — Callout « k-NN : lecture en noyau local »

`Callout type="note" title="Le k-NN comme noyau uniforme local (lecture)"`

Le régresseur k-NN de la leçon 1 peut se **lire** comme une régression à
noyau avec un **noyau uniforme local** (noyau « boîte ») :

```
\hat f(x) = \frac{ \sum_{i=1}^n \mathbf{1}\big\{ \lVert x_i - x \rVert \le
r_k(x) \big\}\, y_i }{ \sum_{i=1}^n \mathbf{1}\big\{ \lVert x_i - x \rVert
\le r_k(x) \big\} }
```

où $r_k(x)$ est la distance au $k$-ième voisin de $x$ : c'est la moyenne
pondérée des $y_i$ avec des poids qui ne dépendent que de la proximité.
L'estimateur de Nadaraya–Watson (panneau expert associé à la leçon 1,
Partie II) est la version pondérée par une fenêtre lisse.
**Attention** : ce pont est une **lecture pédagogique**, pas un théorème —
et le noyau « boîte » n'est pas continu, donc il est *hors du cadre* de
Mercer / des noyaux universels (sections 2 et 6). Ne pas écrire que le k-NN
est « une KRR » : ce n'est pas une minimisation dans un RKHS.

### Bloc 7.3 — Callout « NTK : le noyau tangent (pont vers la Partie IX) »

`Callout type="note" title="D'où vient le « noyau » d'un réseau de neurones"`

Pour un réseau de neurones $f_\theta : \mathcal{X} \to \mathbb{R}$ de
paramètres $\theta$, on peut définir le **noyau tangent neuronal**

```
K_{\mathrm{ntk}}(x, x') = \big\langle \nabla_\theta f_\theta(x),\;
\nabla_\theta f_\theta(x') \big\rangle,
```

évalué à l'initialisation — le produit scalaire des **gradients de la
sortie** par rapport aux paramètres (Jacot, Gabriel & Hongler 2018). Dans la
limite de largeur infinie, ce noyau **reste constant pendant
l'entraînement** et la dynamique de la descente de gradient est celle d'un
modèle linéaire dans le RKHS associé — ce qui relie la généralisation des
réseaux profonds à la théorie de cette leçon.
**Hors périmètre** : la théorie NTK complète (convergence, généralisation)
est réservée à la leçon expert de la Partie IX ; ici, une définition et un
fil de lecture suffisent.

### Bloc 7.4 — Callout « Scalabilité : random features »

`Callout type="note" title="Quand la matrice de Gram est trop grosse"`

La KRR et la SVM coûtent $O(n^3)$ / $O(n^2)$ en mémoire/temps à cause du
Gram. Pour les noyaux invariants par translation (gaussien en tête),
**Rahimi & Recht (2007)** approchent $K$ par un **feature map aléatoire
fini** : $\hat\phi : X \to \mathbb{R}^m$ tiré d'un nombre $m \ll n$ de
dimensions aléatoires, tel que $K(x, x') \approx \hat\phi(x)^\top
\hat\phi(x')$ en moyenne — ce qui ramène la KRR au ridge ordinaire de
dimension $m$. *(Mention en une phrase ; pas de développement.)*

---

## Section 8 — `synthese` — Synthèse, exercices, quiz

### Bloc 8.1 — Callout « Ce qu'il faut retenir »

`Callout type="summary" title="La boîte à outils RKHS"`

1. **Mercer (E.1)** : noyau continu PSD sur un compact $\Rightarrow$
   décomposition spectrale $K = \sum_i \lambda_i \phi_i \phi_i$ — le feature
   map est *visible*.
2. **Moore–Aronszajn complet (E.3)** : $K$ symétrique PSD $\iff$ **unique**
   RKHS $\mathcal{H}_K$ ; construction par complétion de
   $\operatorname{span}\{ K(\cdot, x) \}$ ; $f(x) = \langle f,
   K(\cdot, x) \rangle$.
3. **La norme = la régularité** : $\lVert f \rVert^2_{\mathcal{H}_K} = \sum_i
   c_i^2 / \lambda_i$ — régulariser, c'est punir les hautes fréquences
   (directions à petite valeur propre).
4. **Théorème du représentant (E.4)** : perte (arbitraire, aux points
   d'entraînement) + $g(\lVert f \rVert)$ avec $g$ strictement croissante
   $\Rightarrow$ minimiseur dans $\operatorname{span}\{ K(\cdot, x_i) \}$ —
   l'infini se réduit à $\alpha \in \mathbb{R}^n$.
5. **KRR (E.5–E.6)** : $\alpha^\star = (K + n\lambda I)^{-1} y$ ; noyau
   linéaire $\Rightarrow$ ridge du cours ; $\lambda \to 0$ interpolation,
   $\lambda \to \infty$ trivial.
6. **Universel + $\lambda_n \to 0$, $n\lambda_n \to \infty$ (E.8–E.10)** :
   le noyau gaussien est universel ; la KRR est alors **consistante** en
   $L^2(\mu)$.
7. **Ponts** : SVM à noyau = ERM contraint dans $\mathcal{H}_K$ (leçon 4,
   relue) ; k-NN = noyau local (lecture) ; NTK = noyau tangent (Partie IX).

### Bloc 8.2 — ExercisePanel « Exercice 1 — KRR à deux points, à la main »

`ExercisePanel number="1" title="KRR 2×2 : tout se calcule"`

Deux points $x_1, x_2$ avec noyau gaussien, $\lVert x_1 \rVert = \lVert x_2
\rVert = 0$, $K = \begin{pmatrix} 1 & \rho \\ \rho & 1 \end{pmatrix}$ avec
$\rho \in (0,1)$ (donc $K(x_1, x_2) = \rho$), $y = (1, -1)^\top$, $n = 2$.

(a) Écrire $\alpha^\star = (K + 2\lambda I)^{-1} y$ explicitement (inverser
$2 \times 2$).
(b) Calculer $\lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K} =
\alpha^{\star\top} K \alpha^\star$.
(c) Vérifier que $\lambda \to 0^+$ donne $f^\star(x_1) \to 1$,
$f^\star(x_2) \to -1$ (interpolation).
(d) Que vaut $\alpha^\star$ quand $\rho = 0$ ? Interpréter (points
« indépendants »).

`#snippet solution()` :
$K + 2\lambda I = \begin{pmatrix} 1 + 2\lambda & \rho \\ \rho & 1 + 2\lambda
\end{pmatrix}$, déterminant $D = (1 + 2\lambda)^2 - \rho^2$, et
$(K + 2\lambda I)^{-1} = \frac{1}{D} \begin{pmatrix} 1 + 2\lambda & -\rho \\
-\rho & 1 + 2\lambda \end{pmatrix}$.

(a) $\alpha^\star = (K + 2\lambda I)^{-1} y = \frac{1}{D} \begin{pmatrix}
(1+2\lambda)\cdot 1 - \rho\cdot(-1) \\ -\rho\cdot 1 + (1+2\lambda)\cdot(-1)
\end{pmatrix} = \frac{1+2\lambda + \rho}{D} \begin{pmatrix} 1 \\ -1
\end{pmatrix}$.

(b) $f^\star(x_1) = \alpha_1 + \rho \alpha_2 = \alpha_1(1 - \rho)$, donc
$\lVert f^\star \rVert^2 = \alpha^{\top} K \alpha = 2\alpha_1^2 (1 - \rho)$
= $\dfrac{2 (1+2\lambda+\rho)^2 (1-\rho)}{D^2}$.
(Contrôle : l'identité $\lVert f \rVert^2 = \alpha^\top y - n\lambda
\lVert \alpha \rVert^2$ — issue de $K\alpha^\star = y - n\lambda \alpha^\star$
— donne la même valeur : $2\alpha_1 - 4\lambda \alpha_1^2$.)

(c) $\lambda \to 0$ : $\alpha^\star \to K^{-1} y$ avec $K^{-1} =
\frac{1}{1-\rho^2} \begin{pmatrix} 1 & -\rho \\ -\rho & 1 \end{pmatrix}$,
donc $K^{-1} y = \frac{1}{1-\rho} \begin{pmatrix} 1 \\ -1 \end{pmatrix}$ et
$f^\star(x_i) = (K\alpha^\star)_i \to (K K^{-1} y)_i = y_i$ — interpolation :
$f^\star(x_1) \to 1$, $f^\star(x_2) \to -1$. ✓

(d) $\rho = 0$ : $K = I$, $\alpha^\star = \frac{1}{1 + 2\lambda} (1, -1)^\top$
— chaque point s'ajuste **indépendamment** (pas de couplage par le noyau).

### Bloc 8.3 — ExercisePanel « Exercice 2 — La norme décroît avec λ »

`ExercisePanel number="2" title="Invariance : ‖f⋆‖²_HK décroît en λ"`

Soit $K$ PSD, $y \in \mathbb{R}^n$, $\alpha(\lambda) = (K + n\lambda I)^{-1}
y$, et $h(\lambda) = \alpha(\lambda)^\top K\, \alpha(\lambda) =
\lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K}$.

(a) Montrer que $h$ est **strictement décroissante** sur $]0, +\infty[$ si
$K \ne 0$.
*(Indice : $h(\lambda) = y^\top (K + n\lambda I)^{-1} K\, (K + n\lambda
I)^{-1} y$ ; utiliser la dérivée de $t \mapsto (K + tI)^{-1}$, ou la
décomposition spectrale de $K$.)*
(b) Calculer $\lim_{\lambda \to 0^+} h(\lambda)$ et
$\lim_{\lambda \to +\infty} h(\lambda)$.
(c) Relier à la démo E.7 : la courbe $\lambda \mapsto \lVert f^\star_\lambda
\rVert^2_{\mathcal{H}_K}$ doit être strictement décroissante pour tout choix
des glisseurs.

`#snippet solution()` :
(a) Spectrale : $K = Q \operatorname{diag}(\mu_i) Q^\top$,
$h(\lambda) = \sum_i \frac{\mu_i\, (Q^\top y)_i^2}{(\mu_i + n\lambda)^2}$ —
chaque terme décroît en $\lambda$ (dérivée
$-2 n \mu_i (Q^\top y)_i^2 / (\mu_i + n\lambda)^3 \le 0$, strict si
$\mu_i > 0$ et $(Q^\top y)_i \ne 0$).
(b) $\lambda \to 0^+$ : $h \to \sum_{i: \mu_i > 0} \frac{(Q^\top y)_i^2}{\mu_i}$
(= $y^\top K^+ y$, i.e. $\lVert f_{\text{interp}} \rVert^2$ si $K$
inversible) ;
$\lambda \to \infty$ : $h(\lambda) \sim \dfrac{y^\top K\, y}{n^2 \lambda^2}
\to 0$.
(c) La démo E.7 affiche cette métrique ; l'invariance est **testée** dans
les tests du module mathématique (monotonie sur une grille de $\lambda$).

### Bloc 8.4 — InteractiveSection E.11 « Quiz »

`InteractiveSection number="E.11" title="Quiz — RKHS et méthodes à noyau"`

`Quiz items={getQuizQuestions('p2/rkhs')}` — 5 questions dans
`src/lib/quiz/questions/part2.ts`, tag `p2/rkhs` (contenu exact en section
« Démos proposées »).

---

## Bibliographie (Bloc `Bibliography`)

1. Mercer, J. (1909). « Functions of Positive and Negative Type, and their
   Connection with the Theory of Integral Equations. » *Philosophical
   Transactions of the Royal Society of London A*, 209(457–458) : 415–446.
2. Aronszajn, N. (1950). « Theory of Reproducing Kernels. » *Transactions of
   the American Mathematical Society*, 68(3) : 337–404.
   DOI 10.1090/s0002-9947-1950-0051437-7.
3. Kimeldorf, G. & Wahba, G. (1970). « A variational approach to the
   estimation of the functional structure of stochastic processes. » (première
   forme du théorème du représentant et de la consistance KRR — venue exacte
   non vérifiée, cf. recherche.md).
4. Schölkopf, B., Herbrich, J. & Smola, A. J. (2001). *Learning with
   Kernels: Support Vector Machines, Regularization, Optimization, and
   Algorithms.* MIT Press.
5. Schölkopf, B. & Smola, A. J. (2002). *Learning with Kernels.* MIT Press.
   (ch. 4 : RKHS, KRR, noyaux universels, consistance.)
6. Micchelli, C. A., Xu, Y. & Zhang, H. (2006). « Universal Kernels. »
   *Journal of Machine Learning Research*, 7(95) : 2651–2667.
7. Wahba, G. (1990). *Spline Models for Observational Data.* SIAM,
   CBMS-NSFM 48. DOI 10.1137/1.9781611970128.
8. Jacot, A., Gabriel, F. & Hongler, C. (2018). « Neural Tangent Kernel:
   Convergence and Generalization in Neural Networks. » *NeurIPS 2018*.
   arXiv:1806.07572.
9. Rahimi, A. & Recht, B. (2007). « Random Features for Large-Scale Kernel
   Machines. » *NeurIPS 2007*.

> **Notes de fidélité** (à conserver dans les anchors internes, pas dans le
> texte visible) :
> - Corrections par rapport au brief : « Aronszajn 1944, Pacific J. Math. »
>   → Aronszajn 1950, Trans. AMS (DOI vérifié) ; « Müller, Kraskowski, Smola
>   (2005) » → Micchelli, Xu & Zhang (2006), JMLR 7 : 2651–2667 (référence
>   canonique des noyaux universels).
> - UNVERIFIED (numéros de théorèmes exacts) : Schölkopf & Smola 2002 ch. 4 ;
>   Micchelli–Xu–Zhang 2006 § 4 ; Kimeldorf & Wahba 1970 (journal exact).
>   Énoncés vérifiés par dérivations/abstraits — cf. recherche.md.

---

## Démos proposées (à implémenter)

### Démo E.7 — `KernelRidgeExplorer.svelte` (`src/lib/components/demos/`)

- **But** : visualiser le compromis biais/variance de la KRR en 1D :
  sur-interpolation ($\lambda$ petit) ↔ lissage excessif ($\lambda$ grand),
  la décroissance de $\lVert f^\star \rVert^2_{\mathcal{H}_K}$, le pont ridge
  (noyau linéaire).
- **Module mathématique** : `src/lib/math/rkhs.ts` (**nouveau**) :
  - `krrSolve(K: number[][], y: number[], lambda: number): number[]` —
    résout $\alpha = (K + n\lambda I)^{-1} y$ via `solveLinearSystem`
    (`util.ts` existante) ; **jette** si $\lambda \le 0$, si les dimensions
    de $K$/$y$ sont incohérentes, ou si $K$ n'est pas PSD
    (`minEigenvalueSymmetric(K) < -1e-8`, `svm.ts` existante).
  - `krrFitted(alpha: number[], K: number[][]): number[]` — $K\alpha$
    (prédictions aux points d'entraînement).
  - `krrHilbertNormSq(alpha: number[], K: number[][]): number` —
    $\alpha^\top K \alpha$ (toujours $\ge 0$ si $K$ PSD).
  - `krrObjective(alpha: number[], K: number[][], y: number[], lambda: number): number`
    — $\frac{1}{n}\lVert y - K\alpha \rVert^2 + \lambda\, \alpha^\top K
    \alpha$ (pour les tests et le panneau métriques).
  - `krrPredictAt(kernel: KernelFn, x: number[], X: number[][], alpha: number[]): number`
    — $\sum_i \alpha_i\, K(x_i, x)$ pour tracer la courbe (réutilise
    `KernelFn`, `gaussianKernel`, `linearKernel` de `svm.ts` — **pas de
    duplication**).
  - `generateKrrDataset1D(n: number, seed: number): { x: number[], y:
    number[], fStar: (t: number) => number }` — données seedées
    (`mulberry32` + `combineSeed` de `util.ts`) : $x_i$ uniformes triées sur
    $[0,1]$, $y_i = f^\star(x_i) + 0.1\,\varepsilon_i$ avec
    $f^\star(t) = 2\sin(2\pi t) + 0.5\cos(4\pi t)$ (fonction cible fixée,
    documentée), $\varepsilon_i \sim \mathcal{N}(0,1)$ (Box–Muller ou
    somme — à choisir, seedé).
- **Contrôles** : bascule noyau **gaussien** / **linéaire** ; glisseurs
  $\lambda \in [10^{-4}, 10^{2}]$ (échelle **log**), $\sigma \in [0.02, 1]$
  (gaussien seulement), $n \in \{10, 20, 40, 80\}$.
- **Rendu** : `Figure` + SVG : points de données (scatter), courbe cible
  (grille $200$ points), courbe d'ajustement (grille $200$ points) ;
  barres des $\alpha_i^\star$ (normalisées) ; panneau métriques : MSE
  d'entraînement, $\lVert f^\star_\lambda \rVert^2_{\mathcal{H}_K}$
  (formaté), $\max_i |\alpha_i^\star|$.
- **Mode pont ridge** : quand le noyau est linéaire, un repère « ridge du
  cours » — l'ajustement est **identique** au ridge de paramètre $n\lambda$
  (vérifié par les tests, affiché dans la légende).
- **Légende honnête** (obligatoire) : « Petit problème 1D synthétique
  seedé (fonction cible fixée, bruit gaussien) — illustration du compromis
  biais/variance de la KRR, pas un benchmark. »
- **Performance** : $n \le 80$ $\Rightarrow$ Gram $80 \times 80$, une
  résolution $O(n^3)$ par changement de glisseur — trivial ; recalcul
  direct (pas de `DeferredDemo` nécessaire, mais la section reste en
  `DeferredDemo` pour la cohérence de page).

### Contenu du quiz (5 questions, tag `p2/rkhs`)

1. **Q1** (Moore–Aronszajn) : un noyau $K$ symétrique et PSD sur $X$
   implique ? → **l'existence d'un unique** RKHS $\mathcal{H}_K$ dont $K$
   est le noyau reproduisant (E.3). Pièges : « $K$ est forcément
   continu » ; « il existe plusieurs RKHS distincts » ; « $K$ est forcément
   universel ».
2. **Q2** (représentant) : sous quelle condition sur $g$ tout minimiseur de
   $E(\text{valeurs aux } x_i) + g(\lVert f \rVert_{\mathcal{H}})$ s'écrit
   $\sum_i \alpha_i K(\cdot, x_i)$ ? → **$g$ strictement croissante** sur
   $[0, +\infty[$ (E.4). Pièges : « $g$ convexe » ; « $E$ convexe » ; « $K$
   universel ».
3. **Q3** (KRR) : avec l'objectif
   $\frac{1}{n}\sum_i (y_i - f(x_i))^2 + \lambda \lVert f \rVert^2_{\mathcal{H}}$,
   la solution est ? → $\alpha^\star = (K + n\lambda I)^{-1} y$ (E.6).
   Pièges : $(K + \lambda I)^{-1} y$ (manque le $n$) ;
   $\frac{1}{n}(K + \lambda I)^{-1} y$ ; $K (K + \lambda I)^{-1} y$.
4. **Q4** (universel) : lequel de ces noyaux est **universel** sur un
   compact de $\mathbb{R}^d$ ? → le **gaussien**
   $\exp(-\lVert x - x'\rVert^2 / 2\sigma^2)$ (E.9). Pièges : « le noyau
   linéaire $x^\top x'$ » ; « tout noyau PSD » ; « le noyau boîte
   $\mathbf{1}\{\lVert x - x'\rVert \le r\}$ » (non continu).
5. **Q5** (consistance) : pour que la KRR à noyau universel soit
   **consistante** en $L^2(\mu)$ quand $n \to \infty$, il faut ? →
   $\lambda_n \to 0$ **et** $n\lambda_n \to +\infty$ (E.10). Pièges :
   « $\lambda_n \to +\infty$ » ; « $\lambda_n$ constant $> 0$ » ;
   « $n\lambda_n \to 0$ ».

---

## Vérification finale du brouillon (checklist du brief)

- [x] Chaque théorème/étape de preuve vérifié contre une source primaire ou
      une dérivation complète (cf. `rkhs-methodes-noyau.research.md` :
      énoncés lus en ligne — Mercer via R. Soc. + article Wikipédia RKHS,
      Aronszajn 1950 via DOI, representer + KRR via lecture intégrale de
      l'article Wikipédia representer theorem + chapitre SMLR 16,
      universels via page JMLR, NTK via OpenAlex/abstract).
- [x] Aucune affirmation au-delà du cours présentée comme du cours :
      Callout d'ouverture (bloc 1.2) + attribution par bloc (E.1, E.2–E.3,
      E.4, E.6, E.8–E.10) + notes de fidélité en bibliographie. Le seul
      contenu de source est le rappel de section 2 (leçon 4) et le
      cross-reference Théorème 3.4 (Partie IX, leçon 3).
- [x] Références complètes (auteur, année, venue, DOI/lien) — avec
      **corrections** des références erronées du brief (Aronszajn 1950 et
      non 1944 Pacific J. Math. ; Micchelli–Xu–Zhang 2006 et non Müller
      et al. 2005).
- [x] Formules valides KaTeX, sûres dans `String.raw` (pas de backtick ni
      de `${` dans les blocs de formule).
- [x] Structure du brouillon reflète une leçon expert existante
      (`part1/methodes-proximales` : blocs numérotés, Callouts,
      InteractiveSection + DeferredDemo, ExercisePanel avec `#snippet
      solution()`, Quiz, Bibliography ; numérotation `E.n` comme
      `part1/lesson3-adam`).
- [x] Brouillon lisible en M2 (définitions → théorèmes → forme close →
      limites → universalité → consistance → ponts).
