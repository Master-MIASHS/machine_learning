# Brouillon — Leçon expert « Dualité convexe et conditions KKT »

> Brouillon du contenu de la leçon expert pour le brief `p1-lesson-dualite-convexe-kkt`
> (`expert/part1/lessons/dualite-convexe-kkt.md`).
> Contenu en français, niveau M2. Toutes les formules sont prêtes pour
> `KatexInline`/`KatexBlock` via `String.raw` (aucun backtick ni `\` non
> échappé à l'intérieur des formules).
>
> **Fidélité aux sources** : rien de ce qui suit n'est dans
> `course_sources/` (vérifié — recherche exhaustive « lagrangien », « dual »,
> « KKT » dans `optim.typ` : 0 occurrence). Toute la leçon est donc du contenu
> expert. **Sur la page rendue, le statut expert ne s'exprime que par la
> navigation** (`expert: true` dans `src/lib/navigation.ts`) : aucun cadrage
> « au-delà du cours » dans le texte visible (règle AGENTS.md — même choix
> que la leçon `methodes-proximales`, dont le brouillon prévoyait un Callout
> d'ouverture « au-delà du cours » finalement remplacé par des Callouts de
> contenu). Chaque bloc est attribué à sa source primaire (attribution
> auteur + section/équation exacte, cf.
> `dualite-convexe-kkt.research.md`) ; le contenu déduit (exemples
> conducteurs, duales du Lasso) est marqué « calculé ci-dessous » avec sa
> vérification, jamais présenté comme venant d'une source.
>
> **Conventions de notation** (celles de Boyd & Vandenberghe 2004, ch. 5) :
> forme standard (5.1) ; multiplicateurs `λ ≥ 0` (inégalités), `ν` libres
> (égalités) ; lagrangien `L(x,λ,ν)` ; fonction duale `g(λ,ν)` ; valeurs
> `p*` (primale) et `d*` (duale).
>
> **Contenu déjà enseigné — à référencer, JAMAIS re-enseigner** :
> - Panneau P1/L1 (KKT + dualité lagrangienne en 1-D, parabole/quartique,
>   exemple de gap strict `min e^{−x}` s.t. `x²/y ≤ 0, y > 0` — exercice
>   5.21 de B&V) → `src/routes/part1/lesson1/+page.svelte` (~ligne 536).
> - Panneau P2/L4 (duale SVM complète, vecteurs support, régimes
>   `αᵢ ∈ {0, (0,C), C}`) → `src/routes/part2/lesson4/+page.svelte`
>   (~ligne 633).
> - Leçon `methodes-proximales` (prox, soft-thresholding, ISTA/FISTA) —
>   lien de la section Lasso vers l'exploitation algorithmique de l'inclusion
>   KKT non lisse.

---

## Section 1 — `introduction` — Pourquoi la dualité ?

### Bloc 1.1 — Paragraphe d'ouverture (narratif)

La Partie I a donné les outils *primal* de l'optimisation convexe :
conditions d'optimalité sans contraintes (leçon 1), convexité (leçon 2),
descente de gradient (leçon 3), Newton (leçon 4). Tous ces outils résolvent
le problème **de face** : on itère sur `x`. Il existe une autre stratégie,
souvent plus puissante : construire un *second problème*, le **problème
duale**, qui fournit des **bornes certifiées** sur la valeur optimale — et
dont la résolution donne, en bonus, le point primal optimal et un
**certificat** d'optimalité. C'est la **dualité lagrangienne**, et elle est
le fil rouge qui relie :

- la **SVM** (Partie II) : le problème primal est un QP à n contraintes ;
  le problème duale est un QP à n variables avec une structure de box —
  c'est la duale qu'on résout, et ses variables non nulles *sont* les
  **vecteurs support** (panneau P2/L4) ;
- le **Lasso** (Partie V, Déf. 5.2) : où la dualité existe aussi mais est
  **beaucoup moins exploitable** — comprendre *pourquoi* est l'objet du
  fil B de cette leçon ;
- l'analyse d'**algorithme** : le gap de dualité est le certificat de
  qualité qu'utilisent les méthodes primal-duales modernes (leçon
  « méthodes proximales » : ADMM).

### Bloc 1.2 — Callout « Ce que vous allez savoir faire » (type="summary")

> À la fin de cette leçon, pour tout problème convexe `min f₀(x)` s.t.
> `fᵢ(x) ≤ 0`, `hⱼ(x) = 0`, vous saurez : écrire la lagrangienne et la
> fonction duale ; prouver que le duale donne une borne inférieure
> (dualité faible) ; dire quand la borne est exacte (dualité forte,
> condition de Slater) ; écrire et exploiter les conditions KKT
> (nécessité et suffisance) ; et juger, sur un exemple concret (SVM vs
> Lasso), quand la duale est un outil de calcul — et quand ce n'est qu'un
> outil de certification.

### Bloc 1.3 — Paragraphe « Le plan » (narratif)

1. **Un problème 2-D de bout en bout** (section 2) : on fait *tout* à la
   main — lagrangienne, duale, dualité forte, KKT, courbe de gap — sur un
   exemple où chaque quantité a une forme close.
2. **Le cadre général** (section 3) : forme standard, lagrangienne, borne
   inférieure point par point, duale toujours convexe, dualité faible,
   contraintes « cachées » dans le domaine de la duale.
3. **Dualité forte et Slater** (section 4) : le théorème, l'interprétation
   géométrique (hyperplan support), la preuve par séparation en une
   phrase, le point de selle, et l'analyse de sensibilité (les
   multiplicateurs comme prix marginaux).
4. **Les conditions KKT** (section 5) : énoncé, preuve de nécessité
   (Slater) et de suffisance (convexité).
5. **Fil conducteur A — la SVM** (section 6) : la dualité qui paie.
6. **Fil conducteur B — le Lasso** (section 7) : la dualité moins
   exploitable, et ce que ses KKT disent de la parcimonie.
7. **Quand la dualité forte échoue** (section 8) : exemples de gap strict,
   convexité et Slater séparées.
8. **Synthèse** (section 9).

---

## Section 2 — `exemple-conducteur` — Un problème 2-D de bout en bout

### Bloc 2.1 — DefinitionBlock « Problème conducteur » (calculé ici)

Considérons le problème à deux variables

```
(P)   minimize   (x − 1)² + (y − 1)²
      subject to x + y ≤ 1.
```

Geometrically : on projette le point `(1, 1)` sur le demi-plan
`x + y ≤ 1`. La solution s'obtient immédiatement — la projection de `(1,1)`
sur la droite `x + y = 1` est `(1/2, 1/2)` (le point `(1,1)` est à
l'extérieur du demi-plan, donc la contrainte est active) :

```
x* = y* = 1/2,    p* = (1/2 − 1)² + (1/2 − 1)² = 1/2.
```

Ce problème est **convexe** (fonction objectif strictement convexe,
contrainte affine) et admet un point **strictement faisable** — `(0, 0)`
satisfait `0 + 0 < 1` strictement — donc la condition de Slater tient (on
précise ce que cela implique dans la section 4). Calculons *toute* la
machinerie duale à la main : c'est le même pipeline que pour la SVM ou le
Lasso, mais en forme close.

### Bloc 2.2 — TheorySection « La lagrangienne et la fonction duale »

La contrainte `x + y ≤ 1` reçoit un multiplicateur `λ ≥ 0` (signe : on
punit les violations). La **lagrangienne** est

```
L(x, y, λ) = (x − 1)² + (y − 1)² + λ(x + y − 1),    λ ≥ 0.
```

Pour chaque `λ ≥ 0`, on **minimise** `L` sur `(x, y)` libres : c'est une
quadratique, et la stationnarité donne

```
∂L/∂x = 2(x − 1) + λ = 0  ⟹  x(λ) = 1 − λ/2,
∂L/∂y = 2(y − 1) + λ = 0  ⟹  y(λ) = 1 − λ/2.
```

La **fonction duale** est la valeur de ce minimum :

```
g(λ) = L(1 − λ/2, 1 − λ/2, λ)
     = 2·(−λ/2)² + λ(2(1 − λ/2) − 1)
     = λ²/2 + λ(1 − λ)
     = λ − λ²/2.
```

`g` est une **parabole concave** de sommet en `λ = 1`.

### Bloc 2.3 — TheorySection « Le problème duale, et l'égalité qui fait tout »

Le **problème duale** est `maximize g(λ)` s.t. `λ ≥ 0`. Le sommet de la
parabole est à `λ* = 1 ≥ 0`, donc :

```
d* = g(1) = 1 − 1/2 = 1/2.
```

**Et `p* = d* = 1/2` : le gap de dualité est nul.** La duale a donné la
valeur optimale de la primale *sans qu'on ait jamais résolu la primale*.
C'est la **dualité forte** — section 4 dira exactement pourquoi elle tient
ici (convexité + Slater).

De plus, le minimiseur de la lagrangienne au multiplicateur optimal
redonne le primal : `x(λ*) = y(λ*) = 1 − 1/2 = 1/2` — la recette
« résoudre la duale, puis `x* = argmin L(x, λ*)` » (déjà vue au panneau
P1/L1 pour la parabole 1-D) fonctionne en 2-D.

### Bloc 2.4 — TheorySection « La courbe de gap »

Pour tout `λ ≥ 0` (pas seulement l'optimal), `g(λ)` est une borne
inférieure de `p*` :

```
gap(λ) := p* − g(λ) = 1/2 − (λ − λ²/2) = (λ − 1)²/2.
```

`gap(λ)` est une **parabole tangente à 0** en `λ* = 1` : nulle au
multiplicateur optimal, strictement positive ailleurs. C'est l'image
géométrique de la dualité faible : *chaque* point dual faisable certifie
une borne, et la meilleure certification est `d*`. (Démonstration
interactive E.1 : on fait glisser `λ`, on voit `g(λ)` monter sous `p*`, et
`gap(λ)` s'annuler exactement en `λ* = 1`.)

### Bloc 2.5 — ExampleBlock « Les KKT du problème conducteur » (calculé ici)

Écrivons les conditions KKT (énoncées et prouvées à la section 5) :

```
stationnarité   2(x − 1) + λ = 0,   2(y − 1) + λ = 0
faisabilité     x + y ≤ 1
dualité         λ ≥ 0
complémentarité λ(x + y − 1) = 0
```

De la stationnarité : `x = y = 1 − λ/2`. Deux cas : `λ = 0` (contrainte
inactive) donnerait `x = y = 1`, qui viole `x + y ≤ 1` — rejeté. Donc
`λ > 0` et la complémentarité force `x + y = 1` : `2(1 − λ/2) = 1`,
donc `λ* = 1`, et `x* = y* = 1/2`. **Un seul point KKT — et c'est
l'optimum.** La duale et les KKT racontent la même histoire par deux
portes.

### Bloc 2.6 — Callout « Le pipeline, en quatre objets » (type="insight")

> 1. **Lagrangienne** `L(x, λ)` : on « achète » la contrainte au prix
>    `λ ≥ 0`.
> 2. **Fonction duale** `g(λ) = inf_x L(x, λ)` : le meilleur prix
>    possible une fois le marché fixé — toujours concave, toujours ≤ `p*`.
> 3. **Problème duale** `max g` : la meilleure borne certifiée ; `d* ≤ p*`
>    toujours, `d* = p*` sous qualification (Slater).
> 4. **KKT** : les équations qui relient primal optimal, dual optimal et
>    complémentarité — le certificat final.
>
> Retenez ce schéma : il est *identique* pour la SVM (section 6), le
> Lasso (section 7), et pour n'importe quel problème convexe.

**Proposed demos — section 2**

- **E.1 `DualityGap2D`** (nouveau, `src/lib/components/demos/DualityGap2D.svelte`) :
  le problème conducteur `(P)` en mode interactif. Contrôles : slider `λ ∈
  [0, 3]`. Affichage (SVG 2-D) : demi-plan faisable, point primal `(1/2,1/2)`,
  point `x(λ) = (1−λ/2, 1−λ/2)` qui glisse sur la diagonale, et courbe `g(λ)`
  (parabole) avec `p*` en ligne horizontale et `gap(λ) = (λ−1)²/2` en aire
  ombrée — l'aire s'annule visiblement en `λ* = 1`. Lecture KKT : badge
  « KKT satisfaites » qui s'allume exactement en `λ = 1`.
  Fonctions math (nouvelles, `src/lib/math/duality.ts`) :
  `dualMinimizer2D(λ)` → `[1−λ/2, 1−λ/2]` ; `dualFunction2D(λ)` → `λ − λ²/2` ;
  `dualGap2D(λ)` → `(λ−1)²/2` ; `kktCheck2D(x, y, λ)` → rapport KKT
  `{primalFeasible, dualFeasible, complementarySlackness, stationarity,
  stationarityResiduals, allSatisfied}` (stationnarité `2(x−1)+λ = 0`) ;
  constante `CONDUCTOR_2D_OPTIMUM = { primal: 0.5, dual: 0.5, xStar: 0.5,
  yStar: 0.5, lambdaStar: 1 }`.

---

## Section 3 — `cadre-general` — La dualité lagrangienne générale

### Bloc 3.1 — DefinitionBlock « Forme standard » (BV04 §5.1, eq. (5.1))

On considère un problème général — **pas supposé convexe** :

```
minimize    f₀(x)
subject to  fᵢ(x) ≤ 0,   i = 1, …, m
            hⱼ(x) = 0,   j = 1, …, p
```

avec domaine `D = {x | fᵢ(x) ≤ 0 ∀i, hⱼ(x) = 0 ∀j}` non vide ; on note `p*`
sa valeur optimale (qui peut être `±∞` ou non atteinte — rien n'est supposé).

### Bloc 3.2 — DefinitionBlock « Lagrangienne et fonction duale » (BV04 §5.1.1–5.1.2, eq. (5.4))

On introduit un multiplicateur `λᵢ ≥ 0` par contrainte d'inégalité et un
`νⱼ ∈ R` par contrainte d'égalité. La **lagrangienne** est

```
L(x, λ, ν) = f₀(x) + Σᵢ λᵢ fᵢ(x) + Σⱼ νⱼ hⱼ(x).
```

L'idée (Boyd & Vandenberghe, §5.1.1) : remplacer les contraintes
« dures » (fonctions indicatrices, un « mur de brique ») par une pénalité
linéaire « douce » — zéro si la contrainte est respectée, croissante quand
elle est violée, pour `λᵢ > 0`. La **fonction duale** est la valeur
optimale de la minimisation de la lagrangienne :

```
g(λ, ν) = inf_x L(x, λ, ν),    domaine : { (λ, ν) | λ ≥ 0, g > −∞ }.
```

Deux faits immédiats et fondamentaux :

1. **Borne inférieure point par point** (BV04, eq. (5.2)) : si `x` est
   faisable et `λ ≥ 0`, alors `L(x, λ, ν) = f₀(x) + Σᵢ λᵢ fᵢ(x) +
   Σⱼ νⱼ hⱼ(x) ≤ f₀(x)` (les `fᵢ(x) ≤ 0` multipliés par des `λᵢ ≥ 0`
   sont négatifs, les `hⱼ(x) = 0` s'annulent). Donc
   `g(λ, ν) = inf_x L(x, λ, ν) ≤ f₀(x) ≤ p*` pour **tout** `(λ, ν)`
   faisable dual — *même si le problème n'est pas convexe*.
2. **Concavité** (BV04, §5.1.2) : pour chaque `x` fixé, `L(x, λ, ν)` est
   **affine** en `(λ, ν)` ; `g` est l'infimum point par point d'une famille
   de fonctions affines, donc **concave** (possiblement `-∞` sur une partie
   de son espace).

### Bloc 3.3 — DefinitionBlock « Problème duale » (BV04 §5.2, eq. (5.16))

La meilleure borne inférieure disponible dans `g` est

```
(D)   maximize    g(λ, ν)
      subject to  λ ≥ 0.
```

« This problem is called the Lagrange dual problem associated with the
problem (5.1) » — le problème d'origine devient la **primale**.

**Propriété clé** (BV04, §5.2) : la duale `(D)` est un **problème
d'optimisation convexe** (maximisation d'une fonction concave sur un
domaine convexe) — « whether or not the primal problem is convex ».
La dualité *transforme toujours* le problème en un problème convexe, même
si la primale ne l'est pas : c'est déjà une moitié de la valeur de la
dualité, indépendamment du gap.

### Bloc 3.4 — TheorySection « Dualité faible » (BV04 §5.2.2, eq. (5.23))

Notons `d*` la valeur optimale de la duale. La **dualité faible** est
l'inégalité

```
d* ≤ p*.
```

**Preuve.** Pour tout `(λ, ν)` faisable dual, `g(λ, ν) ≤ p*` (bloc 3.2,
fait 1). En prenant le supremum sur le faisable dual, `d* ≤ p*`. ∎

La différence `p* − d* ≥ 0` est le **gap de dualité optimal** : il mesure
l'écart entre la primale et la *meilleure* borne inférieure lagrangienne.
Conséquences en valeurs infinies (BV04, §5.2.2) : si `p* = −∞` (primale
non bornée inférieurement) alors `d* = −∞` (la duale est infaisable) ;
si `d* = +∞` alors `p* = +∞` (la primale est infaisable).

**Usage immédiat** : même avec un gap non nul, `d*` est une borne
*certifiée* de `p*` — et la duale est convexe, donc souvent facile à
résoudre. Exemple dans [BV04 §5.2.2] : le problème de bipartition
`min xᵀWx` s.t. `xᵢ² = 1` (NP-difficile) a pour duale un **SDP**
`max −1ᵀν` s.t. `W + diag(ν) ⪰ 0` — résoluble en `n = 1000`, et sa valeur
borne le problème combinatoire.

### Bloc 3.5 — TheorySection « Les contraintes cachées dans le domaine de la duale » (BV04 §5.2.1)

Il arrive que `g(λ, ν) = −∞` sauf si `(λ, ν)` vérifie des égalités
supplémentaires — des contraintes qui **n'apparaissaient pas** dans la
primale. Exemple type (BV04, §5.1.5/§5.2.1, LP standard `min cᵀx` s.t.
`Ax = b, x ≥ 0`) :

```
g(λ, ν) = −bᵀν   si   c + Aᵀν − λ = 0,
          −∞     sinon.
```

La contrainte d'égalité `c + Aᵀν − λ = 0` est « cachée » dans le domaine
fini de `g` : la duale explicite (5.19)–(5.20) la fait apparaître en
contrainte à part entière.

**C'est exactement le mécanisme qui produit `Σᵢ αᵢ yᵢ = 0` dans la duale
SVM** (section 6) : la contrainte n'est nulle part dans la lagrangienne —
elle émerge du fait que `g` n'est finie que sur cette affine. À retenir :
*quand une contrainte « mystérieuse » apparaît dans une duale, c'est le
domaine de `g` qui parle.*

**Proposed demos — section 3**

- Pas de démo dédiée : le bloc 3.5 renvoie visuellement au panneau P2/L4
  (la contrainte cachée `Σαᵢyᵢ = 0` y est déjà interactive). Pas de
  fonction math nouvelle.

---

## Section 4 — `dualite-forte` — Dualité forte, Slater, géométrie et sensibilité

### Bloc 4.1 — DefinitionBlock « Dualité forte » (BV04 §5.2.3, eq. (5.24))

On dit que **dualité forte** tient si

```
d* = p*
```

— le gap optimal est nul : la meilleure borne lagrangienne est *exacte*.
« Strong duality does not, in general hold » (BV04) : il faut des
hypothèses supplémentaires. La plus simple et la plus utilisée est la
condition de Slater.

### Bloc 4.2 — TheoremBlock « Dualité forte sous Slater » (BV04 §5.2.3, eq. (5.25)–(5.26), thm. de Slater)

**Théorème (Slater).** Soit le problème convexe standard

```
minimize    f₀(x)
subject to  fᵢ(x) ≤ 0,   i = 1, …, m
            Ax = b
```

avec `f₀, …, fₘ` convexes. S'il existe `x ∈ relint D` tel que

```
fᵢ(x) < 0   (i = 1, …, m),    Ax = b          (condition de Slater)
```

— un point **strictement faisable** — alors **dualité forte** : `d* = p*`.
De plus, si `d* > −∞`, le dual optimal est **atteint** : il existe
`(λ*, ν*)` faisable dual avec `g(λ*, ν*) = d* = p*`.

**Remarque (Slater affiné, BV04 eq. (5.27))** : si les `f₁, …, fₖ` sont
**affines**, elles n'ont pas besoin d'être strictes — `fᵢ(x) ≤ 0` suffit
pour `i ≤ k`, et il faut le strict pour `i > k`. En contraintes linéaires
pures, Slater se réduit à la faisabilité *interne* — et tient dès qu'un
point strictement intérieur existe. (Pour le Lasso, section 7 : la
contrainte `‖θ‖₁ ≤ t` n'est pas affine, mais `θ = 0` est strictement
faisable dès `t > 0` — Slater tient.)

### Bloc 4.3 — TheorySection « Preuve (esquisse) par séparation » (BV04 §5.3.1–5.3.2)

La preuve est géométrique et courte. On plonge le problème dans
`R^{m+p+1}` et on définit deux ensembles :

```
G = { (f₁(x), …, fₘ(x), h₁(x), …, hₚ(x), f₀(x)) | x ∈ D }      (5.36)
A = G + R₊ᵐ × {0} × R₊                                        (5.37)
```

Si le problème est convexe, `A` est convexe. Le point `(0, 0, p*)` est
**extérieur** à `A` (aucun point de `G` n'a ses `m+p` premières
coordonnées ≤ 0 et sa dernière coordonnée `≤ p*` — sinon `p*` ne serait
pas optimale). Le théorème de séparation des convexes (Partie I, leçon 2,
Th. 2.5) donne un hyperplan séparant `A` et `(0,0,p*)`. Slater
garantit que cet hyperplan peut être choisi **non vertical** (normale de
coordonnée `t` non nulle, normalisée à 1) — c'est exactement l'équation
(5.38) de BV04 :

```
p* = (λ, ν, 1)ᵀ(0, 0, p*) ≥ g(λ, ν)   pour un certain (λ, ν) avec λ ≥ 0
```

— soit `g(λ, ν) = p*`, soit dualité forte. Sans Slater, l'hyperplan
séparant peut être *vertical* (multiplicateur de la coordonnée objectif
nul) : on sépare sans rien apprendre — c'est le mécanisme du contre-
exemple de la section 8 (exercice 5.21 de BV04, au panneau P1/L1).

**Les deux rôles de Slater, précisés** : (i) convexité de `A` — vient de la
convexité du problème ; (ii) hyperplan non vertical — vient du point
strictement faisable (`relint D` non vide). Retirer l'une des deux
hypothèses peut casser la dualité forte : la section 8 le montre dans les
deux sens.

### Bloc 4.4 — TheorySection « Interprétation point de selle » (BV04 §5.4, eq. (5.45)–(5.47))

La dualité faible est une inégalité **max-min** générale (BV04 eq. (5.45),
valable sans hypothèse) :

```
sup_{λ ≥ 0} inf_x L(x, λ)  ≤  inf_x sup_{λ ≥ 0} L(x, λ),
```

le membre de gauche étant `d*` et le membre de droite étant ≥ `p*`.
**Dualité forte, c'est précisément l'égalité** :

```
sup_λ inf_x L(x, λ) = inf_x sup_λ L(x, λ) = p* = d*,
```

et le point `(x*, (λ*, ν*))` qui l'atteint est un **point de selle** de `L`
— minimum en `x`, maximum en `(λ,ν)` sur le faisable (BV04, §5.4.2,
théorème de minimax de Sion pour les hypothèses générales). L'ordre des
optimisations est l'objet entier : changer `inf/sup` change de problème —
et c'est là que la convexité + Slater achètent l'égalité.

### Bloc 4.5 — TheorySection « Prix marginaux et analyse de sensibilité » (BV04 §5.6, eq. (5.56)–(5.58))

On **perturbe** les bornes des contraintes : `fᵢ(x) ≤ uᵢ`, `hⱼ(x) = vⱼ`,
et on note `p*(u, v)` la valeur optimale du problème perturbé.

1. `p*` est **convexe** en `(u, v)` (BV04, §5.6).
2. **Inégalité globale** (BV04 eq. (5.57)) : pour tout `(u, v)`
   faisable, `p*(u, v) ≥ p*(0,0) − λ*ᵀu − ν*ᵀv` — le graphe de `p*` est
   **minoré** par l'hyperplan tangent dual. C'est `g(λ*, ν*) ≤ p*(u, v)`
   réécrit.
3. **Sensibilité locale** (BV04 eq. (5.58)) : si `p*` est différentiable en
   `(0,0)`, alors

   ```
   λᵢ* = − ∂p*/∂uᵢ (0,0),    νⱼ* = − ∂p*/∂vⱼ (0,0).
   ```

   **Les multiplicateurs optimaux sont les taux marginaux** : `λᵢ*` dit de
   combien `p*` baisse si on relâche la contrainte i d'une unité. C'est
   l'interprétation « shadow price » (BV04 §5.4.4).

**En forme close sur le problème conducteur** (calculé ici) : on perturbe
la borne en `x + y ≤ 1 + u` (`u > 0` relâche). La contrainte reste active
pour `u < 1` ; par symétrie `x*(u) = y*(u) = (1+u)/2`, le multiplicateur
vaut `λ(u) = 1 − u`, et

```
p*(u) = 2·(x*(u) − 1)² = (1 − u)²/2        (u ≤ 1)
```

(au-delà de `u = 1`, `(1,1)` devient faisable et `p*(u) = 0`). Donc
`p*'(0) = −1` et `λ* = −p*'(0) = 1` — exactement le multiplicateur dual
trouvé en section 2 ; et plus généralement `λ(u) = −p*'(u)` sur
`u < 1`. Vérifié : `p*(u) ≥ p*(0) − λ*u` pour tout `u` (inégalité (5.57)).

**Proposed demos — section 4**

- Reprise de **E.1 `DualityGap2D`** : le mode « sensibilité » du même
  composant (ou un second tab) : slider `u ∈ [−0.5, 1]` qui déplace la
  contrainte `x + y ≤ 1 + u` ; on affiche `p*(u) = (1−u)²/2` et la corde
   tangente `p*(0) − λ*u = 1/2 − u` — la courbe reste au-dessus de la corde
   (convexité de `p*`, inégalité (5.57) visible). Fonction math :
   `perturbedValue2D(u)` → `(1−u)²/2` si `u ≤ 1`, `0` sinon (forme close
   exacte — pas un toy model ; la convexité et la C¹ au point de cassure
   `u = 1` sont vérifiées par les tests).

---

## Section 5 — `kkt` — Les conditions KKT

### Bloc 5.1 — TheoremBlock « Conditions KKT » (BV04 §5.5.3, eq. (5.49))

**Théorème.** Soit un problème **convexe**

```
minimize    f₀(x)
subject to  fᵢ(x) ≤ 0,   i = 1, …, m
            hⱼ(x) = 0,   j = 1, …, p
```

avec `f₀, fᵢ, hⱼ` **différentiables**. Les **conditions KKT** sont :

```
(i)   faisabilité primale    fᵢ(x) ≤ 0  (i = 1…m),   hⱼ(x) = 0  (j = 1…p)
(ii)  faisabilité duale      λᵢ ≥ 0     (i = 1…m)
(iii) complémentarité        λᵢ fᵢ(x) = 0  (i = 1…m)
(iv)  stationnarité          ∇f₀(x) + Σᵢ λᵢ ∇fᵢ(x) + Σⱼ νⱼ ∇hⱼ(x) = 0
```

- **Nécessité** (BV04, §5.5.3) : si **Slater** tient et `x*` est optimal,
  alors `x*` et les multiplicateurs duaux optimaux `(λ*, ν*)` satisfont les
  KKT.
- **Suffisance** (BV04, §5.5.3) : si le problème est convexe (Slater n'est
  pas requis pour la suffisance) et qu'un point satisfait les KKT, alors il
  est **optimal**.

**À retenir en une ligne** : *convexe + différentiable + Slater ⟹ les KKT
sont nécessaires et suffisantes pour l'optimalité.*

### Bloc 5.2 — TheorySection « Preuve de la nécessité » (BV04 §5.5.1–5.5.3)

Quatre ingrédients, tous déjà démontrés dans cette leçon :

1. **Dualité forte + atteinte** (Slater, bloc 4.2) : il existe `(λ*, ν*)`
   avec `g(λ*, ν*) = p*`.
2. **Le primal optimal minimise la lagrangienne au dual optimal** :
   `x*` minimise `L(x, λ*, ν*)` et `L(x*, λ*, ν*) = p* = f₀(x*)` — sinon
   `g(λ*, ν*) < p*` (certificat de sous-optimale, BV04 §5.5.1).
3. **Complémentarité** (BV04 §5.5.2, eq. (5.48)) :
   `L(x*, λ*, ν*) = f₀(x*) + Σᵢ λᵢ* fᵢ(x*) + Σⱼ νⱼ* hⱼ(x*) = f₀(x*)` avec
   `fᵢ(x*) ≤ 0`, `λᵢ* ≥ 0`, `hⱼ(x*) = 0` force **chaque** terme
   `λᵢ* fᵢ(x*) = 0`.
4. **Stationnarité** : `x*` minimise la lagrangienne (étape 2) ; la
   lagrangienne est différentiable et **sans contrainte** en `x` — donc la
   condition du premier ordre sans contraintes (Partie I, leçon 1) s'applique :
   `∇ₓL(x*, λ*, ν*) = 0`, c'est la condition (iv).

Les conditions (i) et (ii) sont la faisabilité primale et duale. ∎

### Bloc 5.3 — TheorySection « Preuve de la suffisance » (BV04 §5.5.3)

Soit `x̂` **faisable** pour la primale, et `(x, λ, ν)` un point KKT.
Trois inégalités, toutes élémentaires :

1. **Convexité de `f₀`** : `f₀(x̂) ≥ f₀(x) + ∇f₀(x)ᵀ(x̂ − x)` ;
2. **Convexité des `fᵢ`**, multipliée par `λᵢ ≥ 0` et sommée — la
   **complémentarité** (`Σᵢ λᵢ fᵢ(x) = 0`) fait disparaître le terme en
   `x` :

   ```
   Σᵢ λᵢ fᵢ(x̂) ≥ (Σᵢ λᵢ ∇fᵢ(x))ᵀ(x̂ − x);
   ```

3. **Affinité des `hⱼ`** (égalité, pas inégalité) :

   ```
   Σⱼ νⱼ hⱼ(x̂) = (Σⱼ νⱼ ∇hⱼ(x))ᵀ(x̂ − x).
   ```

En ajoutant (1), (2), (3) et utilisant la **stationnarité**
`∇f₀(x) + Σᵢ λᵢ ∇fᵢ(x) + Σⱼ νⱼ ∇hⱼ(x) = 0`, le terme en `(x̂ − x)`
s'annule :

```
f₀(x̂) + Σᵢ λᵢ fᵢ(x̂) + Σⱼ νⱼ hⱼ(x̂) ≥ f₀(x)
c'est-à-dire   L(x̂, λ, ν) ≥ f₀(x).
```

Enfin, comme `x̂` est **faisable** : `fᵢ(x̂) ≤ 0` avec `λᵢ ≥ 0` donne
`Σᵢ λᵢ fᵢ(x̂) ≤ 0`, et `hⱼ(x̂) = 0` donne `Σⱼ νⱼ hⱼ(x̂) = 0`, donc
`L(x̂, λ, ν) ≤ f₀(x̂)`. Chainé :

```
f₀(x̂) ≥ L(x̂, λ, ν) ≥ f₀(x)
```

pour **tout** `x̂` faisable : `x` est optimal. ∎

### Bloc 5.4 — ExampleBlock « Water-filling : les KKT comme algorithme » (BV04, Exemple 5.2, pp. 245–246, fig. 5.7)

Problème d'allocation de puissance (information théorique) :

```
minimize    − Σᵢ log(αᵢ + xᵢ)      (αᵢ > 0)
subject to  xᵢ ≥ 0,    Σᵢ xᵢ = 1
```

On alloue une puissance totale 1 à n canaux de capacité
`log(αᵢ + xᵢ)`. KKT (multipl. `λᵢ ≥ 0` pour `xᵢ ≥ 0`, `ν` libre pour la
somme) : stationnarité `−1/(αᵢ + xᵢ) − λᵢ + ν = 0`, complémentarité
`λᵢ xᵢ = 0`, faisabilité. On élimine `λᵢ` (variable d'écart de la
stationnarité) :

```
xᵢ* = max(0, 1/ν* − αᵢ),     Σᵢ max(0, 1/ν* − αᵢ) = 1
```

— le membre de gauche est une fonction **croissante par morceaux** de
`1/ν*` (cassures aux `αᵢ`), donc `ν*` est unique et se calcule
facilement. Interprétation (BV04, fig. 5.7) : les `αᵢ` sont les niveaux
du sol sur chaque parcelle ; on inonde de niveau `1/ν*` jusqu'à avoir
déposé une quantité totale 1 d'eau ; la hauteur d'eau au-dessus de la
parcelle i est `xᵢ*`.

**Le point pédagogique** : la solution est une **sommation de
soft-threshold décalés** — `max(0, ·)` coordonnée par coordonnée, avec un
niveau `1/ν*` commun — *exactement la même forme que le Lasso en colonnes
orthonormales de la section 7* (`θ* = S_λ(Xᵀy)`) : les KKT, résolues
explicitement, **sont** l'algorithme.

### Bloc 5.5 — Callout « KKT lisses vs KKT non lisses » (type="warning")

> Les KKT classiques exigent la différentiabilité. Quand l'objectif ou une
> contrainte n'est pas lisse (le Lasso : `‖θ‖₁`), la stationnarité devient
> une **inclusion au sens du sous-différentiel** — `0 ∈ ∇f₀(x*) + Σ… +
> ∂g(x*)` — et tout le reste (faisabilité, complémentarité, suffisance
> convexe) reste valide. C'est exactement ce qui se passe pour le Lasso en
> section 7, et c'est l'objet du panneau « sous-gradient » de la leçon 1.
> Les KKT ne « cassent » pas en non lisse : elles s'élargissent.

**Proposed demos — section 5**

- Pas de démo nouvelle : le water-filling est traité narrativement (la
  leçon `methodes-proximales` a déjà une démo soft-thresholding qui joue
  le même rôle visuel). Pas de fonction math nouvelle.

---

## Section 6 — `fil-svm` — La SVM : la dualité qui paie

### Bloc 6.1 — TheorySection « De la marge rigide à la duale » (BV04 §8.6, eq. (8.20)–(8.23) ; ESL §12.2 via panneau P2/L4)

Le problème SVM à marge rigide (forme standard `yᵢ ∈ {−1, +1}` — panneau
P2/L4) est

```
minimize    ½ ‖w‖₂²
subject to  yᵢ(wᵀxᵢ + b) ≥ 1,   i = 1, …, n.
```

Chaque contrainte est **affine** en `(w, b)` — c'est la condition qui fait
toute la différence. La lagrangienne (multiplicateurs `αᵢ ≥ 0`) est

```
L(w, b, α) = ½‖w‖² − Σᵢ αᵢ [yᵢ(wᵀxᵢ + b) − 1].
```

Minimiser en `w` : stationnarité `w − Σᵢ αᵢ yᵢ xᵢ = 0` ⟹
`w* = Σᵢ αᵢ yᵢ xᵢ`. Minimiser en `b` : stationnarité
`−Σᵢ αᵢ yᵢ = 0` — et si `Σᵢ αᵢ yᵢ ≠ 0`, la lagrangienne est **non bornée
inférieurement** en `b` : `g(α) = −∞`. C'est la **contrainte cachée** de la
section 3 qui apparaît : `Σᵢ αᵢ yᵢ = 0` n'est nulle part dans la primale,
elle émerge du domaine fini de `g`. En substituant `w*` dans `L`, on obtient
la **duale** (forme close, quadratique) :

```
(D_SVM)   maximize    Σᵢ αᵢ − ½ Σᵢ Σⱼ αᵢ αⱼ yᵢ yⱼ xᵢᵀxⱼ
          subject to  Σᵢ αᵢ yᵢ = 0,    αᵢ ≥ 0.
```

Tout est **lisse**, tout est **close** : la duale ne dépend des données que
par les produits scalaires `xᵢᵀxⱼ` (le « trick du noyau » de la Partie II
s'applique donc à la duale, pas à la primale — c'est un avantage de
calcul, pas une curiosité).

**Pourquoi « la dualité paie » ici** : (1) la primale a `n + 1` variables et
`n` contraintes couplées ; la duale a `n` variables avec une contrainte
d'égalité *simple* et un box — structure idéale pour les solveurs QP et pour
les algorithmes à coordonnées (SMO). (2) La duale est **invariante par
représentation** : elle ne voit que le noyau. (3) Ses multiplicateurs
**sont la solution** : `w* = Σᵢ αᵢ yᵢ xᵢ` — la primale se lit dans la
duale.

### Bloc 6.2 — TheorySection « Complémentarité et vecteurs support » (BV04 §8.6 eq. (8.24)–(8.25), p. 427 ; KKT via P2/L4)

Les KKT de la SVM (panneau P2/L4 pour la démonstration complète) incluent la
complémentarité `αᵢ [yᵢ(wᵀxᵢ + b) − 1] = 0`. Lecture :

- `αᵢ > 0` ⟹ `yᵢ(wᵀxᵢ + b) = 1` — le point est **sur la marge** ;
- `αᵢ = 0` — le point n'entre pas dans `w* = Σαᵢyᵢxᵢ`.

Les seuls points qui construisent le classifieur sont ceux sur la marge :
les **vecteurs support**. Dans la version à marge souple (BV04 p. 427 :
`min ‖a‖² + γ(1ᵀu + 1ᵀv)` s.t. `aᵀxᵢ − b ≥ 1 − uᵢ`, … ; forme standard du
panneau P2/L4 : `min ½‖w‖² + CΣξᵢ`), la complémentarité s'enrichit en
régimes : `αᵢ = 0` (hors marge, `ξᵢ = 0`), `0 < αᵢ < C` (sur la marge),
`αᵢ = C` (dans/contre la marge, `ξᵢ > 0`) — **la parcimonie du classifieur
est une conséquence directe d'une condition de complémentarité lisse**.
C'est le cas d'école où la dualité n'est pas un outil de certification mais
l'algorithme lui-même.

### Bloc 6.3 — Callout « À voir, pas à re-démontrer » (type="note")

> La démonstration complète de la duale SVM (marge rigide et souple,
> régimes des α, construction de b, lien noyau) est au **panneau de la
> leçon 4 de la Partie II** — avec démonstration interactive des résidus
> KKT par coefficient. Cette section ne fait que montrer *où la machine
> générale de la leçon s'applique* : contraintes affines ⟹ duale close et
> exploitable.

**Proposed demos — section 6**

- **E.2 `SvmAlphaKktExplorer`** (existant, `src/lib/components/demos/SvmAlphaKktExplorer.svelte`,
  réutilisé tel quel — il affiche déjà les résidus KKT par α et les régimes
  `αᵢ ∈ {0, (0,C), C}`). Fonctions math existantes : `src/lib/math/svm.ts`
  (`solveSvmDual`, `kktResidues`, `alphaRegimes`). Pas de nouveau code.

---

## Section 7 — `fil-lasso` — Le Lasso : la dualité moins exploitable

### Bloc 7.1 — TheorySection « Le modèle, et sa contrainte non lisse » (Déf. 5.2, Partie V leçon 4)

Le Lasso (Déf. 5.2 de la Partie V) est

```
minimize_θ   ‖y − Xθ‖₂² + λ‖θ‖₁.
```

On enseignera la forme équivalente (le facteur ½ est absorbé dans λ — même
chemin de solutions) :

```
(P_λ)   minimize_θ   ½‖y − Xθ‖₂² + λ‖θ‖₁.
```

La forme **contrainte** (même chemin, Déf. 5.3 « lasso path ») est

```
(P_t)   minimize_θ   ½‖y − Xθ‖₂²     subject to   ‖θ‖₁ ≤ t.
```

Comparons la contrainte du Lasso à celle de la SVM :

| | SVM (section 6) | Lasso |
|---|---|---|
| contraintes | `yᵢ(wᵀxᵢ+b) ≥ 1` — **affines** | `‖θ‖₁ ≤ t` — **norme, non lisse, non affine** |
| `g(·)` | quadratique **close** | `p_pen(λ) − λt` — **pas de forme close** |
| duale utile | box + 1 égalité, lisse | voir blocs 7.3–7.4 |

### Bloc 7.2 — TheorySection « La duale lagrangienne : concave, 1-D, mais coûteuse à évaluer » (calculé ici, machine BV04 §5.1–5.2)

Lagrangienne de `(P_t)` : `L(θ, λ) = ½‖y − Xθ‖₂² + λ(‖θ‖₁ − t)`, `λ ≥ 0`.
La fonction duale est

```
g(λ) = inf_θ [ ½‖y − Xθ‖₂² + λ‖θ‖₁ ] − λt =: p_pen(λ) − λt,
```

où `p_pen(λ)` est la valeur optimale de `(P_λ)` — **le lasso pénalisé
lui-même**. Trois conséquences :

1. `p_pen(λ)` est **concave** en `λ` (infimum point par point de fonctions
   affines `θ ↦ ½‖y−Xθ‖² + λ‖θ‖₁` vues comme fonctions de `λ`) ⟹ `g` est
   **concave** ⟹ `max_{λ≥0} g(λ)` est une maximisation concave **en une
   seule variable** (section dorée, recherche ternaire).
2. **Pas de forme close** : chaque évaluation de `g(λ)` coûte la résolution
   d'un lasso complet (descente de coordonnées, LARS, ISTA…). C'est le
   contraste exact avec la SVM : là, `g(α)` se lit en une ligne ; ici,
   `g(λ)` *est* un sous-problème.
3. **Dualité forte tout de même** : le problème est convexe et Slater tient
   — `θ = 0` est strictement faisable dès `t > 0` (`‖0‖₁ = 0 < t`) — donc
   `max_λ g(λ) = p*` et le dual optimal est atteint (théorème de Slater,
   bloc 4.2). La duale est un **certificat exact**, pas une approximation.

**Vérification numérique** (figée dans les tests unitaires) : sur 5 jeux
`(X, y, t)` avec `X` 3×2 aléatoire, `max_λ [p_pen(λ) − λt]` égale la valeur
primaire à moins de `10⁻⁶` (primale : descente de coordonnées exacte ;
duale : section dorée sur la grille).

### Bloc 7.3 — TheorySection « La correspondance des chemins » (calculé ici, déduction KKT via BV04 §5.5.3)

**Lemme (correspondance primale-contrainte / primale-pénalisée).** Soit
`θ(λ)` une solution de `(P_λ)` et `t = ‖θ(λ)‖₁`. Alors `θ(λ)` est une
solution de `(P_t)`. Réciproquement, toute solution de `(P_t)` dont la
norme est strictement inférieure au maximum du chemin est solution de
`(P_λ)` pour un `λ ≥ 0`.

**Preuve (sens direct).** Par dualité forte + atteinte (Slater), `θ(λ)`
satisfait les KKT de `(P_λ)` — qui, en non lisse, sont l'**inclusion**

```
0 ∈ −Xᵀ(y − Xθ(λ)) + λ ∂‖θ(λ)‖₁,
```

c'est-à-dire `Xᵀ(y − Xθ(λ)) = λ z` avec `z ∈ ∂‖θ(λ)‖₁`. Les KKT de `(P_t)`
sont : `Xᵀ(y − Xθ̃) = λ̃ z̃` avec `z̃ ∈ ∂‖θ̃‖₁`, `λ̃ ≥ 0`, et
`λ̃(t − ‖θ̃‖₁) = 0`. En posant `(θ̃, λ̃, z̃) = (θ(λ), λ, z)`, tout est
satisfait — en particulier la complémentarité car `λ‖θ(λ)‖₁ = λt`. La
suffisance des KKT convexes (bloc 5.3) donne l'optimalité pour `(P_t)`. ∎

C'est le résultat standard « le lasso pénalisé et le lasso contraint
tracent le même chemin » (cf. Hastie–Tibshirani–Friedman, ESL 2e éd.,
§3.2 — référence secondaire ; la preuve ci-dessus n'utilise que la machine
KKT de la section 5). **Vérifié numériquement** : `θ_primal(t) =
θ_pen(λ*)` à moins de `10⁻⁴` (‖·‖∞) et complémentarité
`λ*(t − ‖θ_primal‖₁) ≈ 0` sur les mêmes jeux.

### Bloc 7.4 — TheorySection « La duale Fenchel du lasso pénalisé » (calculée ici, machine BV04 §5.4.2 + §3.3.1 Ex. 3.26)

Une autre porte s'ouvre : écrire `(P_λ)` sous la forme `min_θ f(Xθ) + g(θ)`
avec `f(z) = ½‖y − z‖₂²` et `g(θ) = λ‖θ‖₁`, et utiliser la **duale de
Fenchel** (théorème de minimax de Sion, bloc 4.4). Deux briques :

- la conjugée de `g = λ‖·‖₁` est l'indicatrice de la **boule duale** :
  `g*(u) = 0` si `‖u‖∞ ≤ λ`, `+∞` sinon (conjugée d'une norme = indicatrice
  de la boule de la norme duale — BV04, Exemple 3.26, avec
  `‖u‖* = sup{uᵀx | ‖x‖ ≤ 1}`) ;
- la minimisation de `f(Xθ) + uᵀθ` se résout par stationnarité
  `XᵀXθ = Xᵀy − u` (rang entier en colonnes supposé).

On obtient la duale Fenchel

```
(D_λ)   maximize_u    ½‖(I − P_X) y‖₂² + uᵀ(XᵀX)⁻¹Xᵀy − ½ uᵀ(XᵀX)⁻¹u
          subject to   ‖u‖∞ ≤ λ,      u ∈ R^d
```

où `P_X = X(XᵀX)⁻¹Xᵀ` est la projection orthogonale sur le column space de
`X` et `d` est le nombre de paramètres.

**Propriétés (toutes vérifiées numériquement, figées en tests)** :
- **Dualité forte** : `max (D_λ) = min (P_λ)` à la précision machine
  (`< 2·10⁻¹⁵` sur 6 jeux) ;
- **Lien primal–dual** : si `θ*` et `u*` sont optimaux, alors
  `u* = Xᵀ(y − Xθ*)` — le « résidu projeté » est le dual optimal ;
- en dimension 1 (`X = 1`) : `(D_λ)` se réduit à
  `max_{|u|≤λ} uy − ½u²`, dont le maximum est `u* = clip(y, −λ, λ)` —
  cas clos vérifiés : `(y, λ) = (3,1) ⟹ p* = d* = 2.5` ; `(0.5, 1) ⟹
  p* = d* = 0.125` ; `(−2.5, 1) ⟹ p* = d* = 2.0`.

### Bloc 7.5 — TheorySection « KKT du Lasso et origine de la parcimonie » (calculé ici)

Les KKT de `(P_λ)` (non lisses — bloc 5.5) sont

```
0 ∈ −Xᵀ(y − Xθ*) + λ ∂‖θ*‖₁,
```

soit coordonnée par coordonnée, avec `r* = y − Xθ*` :

```
θ*_i ≠ 0   ⟹   (Xᵀr*)_i = λ sgn(θ*_i)      (le « gradient » est saturé à ±λ)
θ*_i = 0   ⟹   |(Xᵀr*)_i| ≤ λ              (le gradient ne dépasse pas λ)
```

**C'est cette seconde ligne qui produit la parcimonie** : une coordonnée
s'annule dès que son gradient résiduel n'atteint pas le seuil `λ` — il n'y
a pas de raison de la « payer » au prix `λ par unité de norme L1`. En colonnes
orthonormales (`XᵀX = I`), l'inclusion se résout explicitement :
`θ* = S_λ(Xᵀy)` — le **soft-thresholding** (leçon « méthodes proximales »),
et la parcimonie est littéralement le « trou » de `S_λ` en 0. En général,
l'inclusion définit `θ*` sans forme close — c'est là que les méthodes
proximales (ISTA/FISTA) prennent le relais : elles itèrent exactement cette
condition de point fixe.

**Le contraste, formulé** (réponse au fil B du brief) :

- **SVM** : contraintes affines ⟹ duale close, lisse, à structure de box ;
  les KKT sont des équations ; la parcimonie (vecteurs support) est une
  **conséquence lisible** de la complémentarité.
- **Lasso** : contrainte de norme non lisse et non affine ⟹ la duale
  lagrangienne n'a **pas de forme close** (chaque évaluation coûte un lasso) ;
  la duale Fenchel est lisse mais vit en dimension `d` avec `(XᵀX)⁻¹`, et la
  **parcimonie n'apparaît dans aucune duale** — elle est un fait *primal*,
  produit par le sous-différentiel `∂|·|(0) = [−1, 1]`. La dualité sert de
  **certificat** (gap nul, valeurs, sensibilité en `t` via le `λ*` du bloc
  7.2) — pas d'algorithme de sélection.

### Bloc 7.6 — Callout « Sensibilité du lasso : ce que `λ*` mesure » (type="insight")

> D'après l'analyse de sensibilité (bloc 4.5, BV04 eq. (5.58)) : si
> `p*(t)` (valeur optimale de `(P_t)`) est différentiable en `t`, alors
> `λ* = −dp*/dt` — le multiplicateur optimal dit de combien la perte
> `½‖y − Xθ‖²` diminue quand on autorise une unité de norme L1
> supplémentaire. Sur le chemin du lasso, `λ*` décroît avec `t` : au début
> du chemin (petit `t`), chaque unité de `‖θ‖₁` « achète » beaucoup de
> perte ; plus loin, moins. C'est la lecture économique du paramètre
> d'hyper-régularisation.

**Proposed demos — section 7**

- **E.3 `LassoPrimalDualDemo`** (nouveau, `src/lib/components/demos/LassoPrimalDualDemo.svelte`) :
  petit problème fixe `X ∈ R^{2×2}`, `y ∈ R²` (choix déterministe documenté
  en commentaire — « petit problème synthétique seedé, illustration, pas un
  benchmark »), slider `λ ∈ [0, 3]`. Affichage : (1) `θ*(λ)` par
  coordonnées avec les zéros mis en évidence (parcimonie qui apparaît en
  gros `λ`) ; (2) le point dual `u*(λ)` dans la boîte `‖u‖∞ ≤ λ` et la
  valeur duale qui **colle** à la valeur primale (dualité forte visible :
  deux courbes superposées) ; (3) le vecteur `z* = Xᵀ(y − Xθ*)/λ ∈
  ∂‖θ*‖₁` affiché dans la boîte `[−1,1]^d`, ses coordonnées saturées à ±1
  exactement quand `θ*_i ≠ 0` (complémentarité du sous-différentiel en
  action). Fonctions math (nouvelles, `src/lib/math/duality.ts`) :
  `lassoPrimal(X, y, λ)` (descente de coordonnées exacte,
  `θᵢ ← S_λ(rᵢ)/(XᵀX)ᵢᵢ` avec `rᵢ = (Xᵀy)ᵢ − Σ_{j≠i}(XᵀX)ᵢⱼθⱼ`),
   `lassoDualFenchel(X, y, λ)` (max ascent de coordonnées sur la boîte),
   `lassoKktReport(X, y, θ, λ)` → `{residual, uStar, z, subgradientOk,
   maxAbsZ}` ; réutiliser
  `softThreshold` depuis `src/lib/math/regularization.ts` et le PRNG
  seedé de `src/lib/math/util.ts` pour le tirage éventuel du jeu.
  **Honnêteté** : `X` 2×2 plein rang (pas de singularité de `(XᵀX)⁻¹`),
  le jeu est fixe et affiché dans la légende.

---

## Section 8 — `gap-strict` — Quand la dualité forte échoue (et quand elle ne la fait pas)

### Bloc 8.1 — TheorySection « Deux hypothèses, deux portes de sortie »

La preuve de séparation (bloc 4.3) utilise la convexité (pour que `A` soit
convexe) et Slater (pour l'hyperplan non vertical). Retirer l'une ou
l'autre **peut** ouvrir un **gap de dualité strict** `p* − d* > 0` — mais
attention : retirer la convexité seule ne le garantit **pas**. Trois cas :

1. **Non convexe** (ci-dessous, bloc 8.2) : gap **nul** — la non-convexité
   ne suffit pas à ouvrir un gap (le « piège »).
2. **Convexe mais sans Slater** (bloc 8.3) : l'exercice 5.21 de BV04 —
   **gap = 1** ; **déjà traité au panneau P1/L1** — renvoi, pas
   re-démonstration.
3. **Primale non bornée** (bloc 8.4) : `p* = d* = −∞` — pas de gap au sens
   d'un écart fini.

### Bloc 8.2 — ExampleBlock « Le piège : non convexe, gap nul (calculé ici) »

```
minimize    (x − 2)²
subject to  x² ≥ 1        (i.e.  1 − x² ≤ 0 — contrainte NON convexe)
```

- **Primale** : l'ensemble faisable est `{x ≤ −1} ∪ {x ≥ 1}` (non convexe).
  Le piège : on est tenté de prendre le « point du bord le plus proche »,
  `x = 1` — mais **`x = 2` est faisable** (`2² = 4 ≥ 1`) et c'est le
  minimiseur de `(x−2)²` sur tout R : `p* = 0`, `x* = 2`. La contrainte est
  **inactive** en `x*` (`1 − 2² = −3 < 0`).
- **Lagrangienne** : `L(x, λ) = (x−2)² + λ(1 − x²)`, `λ ≥ 0`.
- **Fonction duale** (forme close, calculée ici) :
  - si `λ ∈ [0, 1)` : `L` est quadratique en `x` avec coefficient
    `(1−λ) > 0` ; minimiseur `x(λ) = 2/(1−λ)` et
    `g(λ) = −λ(3+λ)/(1−λ)` ;
  - si `λ ≥ 1` : le coefficient `(1−λ) ≤ 0` — `g(λ) = −∞`.
- **Duale** : `g` est **décroissante** sur `[0,1)` (`g(0) = 0`,
  `g(0.2) = −0.8`, `g(0.5) = −3.5`, `g(0.9) = −35.1`) donc
  `d* = sup g = g(0) = 0`.
- **Gap** : `p* − d* = 0` — **nul, malgré la contrainte non convexe**.
   KKT est satisfaite en `(x* = 2, λ* = 0)` (stationnarité
   `2(x−2) − 2λx = 0`, complémentarité `λ(1−x²) = 0`).

**Lecture** : l'ensemble faisable déconnecté n'empêche pas la duale de
« rattraper » la primale : le point dual optimal `λ* = 0` donne
`g(0) = inf (x−2)² = 0 = p*`. Ce dont la preuve de séparation a besoin est
d'une **condition de qualification**, pas de la convexité de l'ensemble
faisable en soi. (Quand objectif et contrainte sont quadratiques, ce
rattrapage est systématique — 7 cas vérifiés numériquement — ce qui est
cohérent avec l'exactitude de la procédure-S pour un programme quadratique
à contrainte unique.)

### Bloc 8.3 — TheorySection « Le gap strict : convexe sans Slater »

L'exercice 5.21 de BV04 (**déjà traité au panneau P1/L1** — renvoi, pas
re-démonstration) :

```
minimize    e^{−x}
subject to  x²/y ≤ 0,  y > 0
```

Problème **convexe**, mais **Slater échoue** (`x²/y < 0` est impossible —
pas de point strictement faisable) : `p* = 1` (**atteinte** — la contrainte
force `x = 0`, et tout `(0, y)` avec `y > 0` est optimal), fonction duale
`g ≡ 0` (pour `λ > 0`, l'infimum envoie d'abord `y → ∞` pour tuer `λx²/y`,
puis `x → ∞` pour tuer `e^{−x}`), donc `d* = 0`, **gap = 1**. C'est
l'exemple qui montre : c'est l'**échec de la condition de qualification** —
pas la non-convexité — qui ouvre un gap strict.

### Bloc 8.4 — ExampleBlock « Primale non bornée : `p* = d* = −∞` (calculé ici) »

```
minimize    x
subject to  x² ≥ 1
```

`p* = −∞` (`x → −∞` est faisable et fait descendre `x`). La lagrangienne
`L(x,λ) = x + λ(1−x²)` est non bornée inférieurement en `x` pour **tout**
`λ ≥ 0` (affine pour `λ = 0`, quadratique non bornée pour `λ > 0`) :
`g ≡ −∞`, `d* = −∞`. Les deux valeurs s'effondrent ensemble — c'est le cas
« `p* = −∞` ⟹ `d* = −∞` » de la dualité faible (bloc 3.4) : il n'y a pas
d'écart fini à mesurer.

**Proposed demos — section 8**

- **E.4 (mode 2 de `DualityGap2D`)** : un second onglet du composant E.1
  changeant de problème : le bloc 8.2 en 1-D (le piège). Affichage : la
  droite graduée avec l'ensemble faisable `{x ≤ −1} ∪ {x ≥ 1}` ombré et la
  courbe `f(x) = (x−2)²`, le point `x* = 2` (dans le faisable !), la ligne
  `p* = 0` ; à côté, la courbe `g(λ)` sur `[0, 1)` (qui s'effondre vers
  `−∞` quand `λ ↑ 1` — échelle tronquée), la ligne `d* = 0`, le marqueur
  `λ* = 0`, et le gap ponctuel `gap(λ) = p* − g(λ) = λ(3+λ)/(1−λ)` (courbe
  qui part de 0 et explose — son **infimum** est 0 : c'est là la leçon).
  Un slider `λ` fait bouger le minimiseur `x(λ) = 2/(1−λ)` de la
  lagrangienne, qui « s'échappe » vers `+∞` quand `λ ↑ 1`. Fonctions math
  (nouvelles, `src/lib/math/duality.ts`) : `trapLagrangian(x, λ)`,
  `trapDual(λ)` → `−λ(3+λ)/(1−λ)` pour `λ ∈ [0,1)`, `−∞` sinon (flag
  `unbounded`), `GAP_TRAP_OPTIMUM = { primal: 0, xStar: 2, dual: 0,
  lambdaStar: 0, gap: 0 }`, `unboundedLagrangian(x, λ)`,
  `unboundedDual(λ)` (≡ `−∞`),
  `GAP_UNBOUNDED_OPTIMUM = { primal: −∞, xStar: null, dual: −∞,
  lambdaStar: null }`. **Honnêteté** : formes closes calculées ici,
  vérifiées par contre-minimisation numérique (tests) — aucune source
  imprimée consultée ne les donne pour ces exemples.

---

## Section 9 — `synthese` — Synthèse et limites

### Bloc 9.1 — TableBlock « Le tableau de bord » (narratif + tableau)

| Question | Réponse | Où |
|---|---|---|
| Que vaut `g(λ,ν)` ? | Une borne inférieure de `p*`, toujours (`d* ≤ p*`) | §3, bloc 3.4 (BV04 (5.23)) |
| Quand `d* = p*` ? | Convexe + Slater (et dual atteint si `d* > −∞`) | §4, bloc 4.2 (BV04 (5.24)–(5.26)) |
| Preuve de `d* = p*` ? | Séparation de `A` et `(0,0,p*)`, hyperplan non vertical | §4, bloc 4.3 (BV04 §5.3.2) |
| Quand les KKT suffisent-elles ? | Toujours, si convexe + différentiable | §5, bloc 5.1 (BV04 (5.49)) |
| Quand les KKT sont-elles nécessaires ? | Convexe + différentiable + Slater | §5, bloc 5.1 |
| SVM : duale close ? | Oui — contraintes affines | §6 (BV04 §8.6 ; P2/L4) |
| Lasso : duale close ? | Non — `g(λ) = p_pen(λ) − λt`, pas de forme close | §7 (calculé ici) |
| Lasso : dualité forte ? | Oui — Slater (`θ = 0`, `t > 0`) | §7, bloc 7.2 |
| Lasso : d'où vient la parcimonie ? | Du sous-différentiel `∂|·|(0)` — primal, pas dual | §7, bloc 7.5 |
| La non-convexité ouvre-t-elle un gap ? | Non — le piège a gap 0 malgré `x² ≥ 1` | §8, bloc 8.2 (calculé ici) |
| Gap strict possible ? | Oui : convexe sans Slater (BV04 ex. 5.21, gap 1, panneau P1/L1) ; primale non bornée → `p* = d* = −∞` | §8, blocs 8.3–8.4 |

### Bloc 9.2 — TheorySection « Limites et suites »

- **Ce que la dualité ne donne pas** : un algorithme primal-duale complet
  (méthodes primal-duales, ADMM en version générale) — objet de la leçon
  « méthodes proximales » (ADMM y est présenté comme éclatement de
  variables avec multiplicateur, c'est-à-dire une dualité lagrangienne
  *itérée*).
- **Quand la duale est dégénérée** : si le dual optimal n'est pas atteint
  (`d*` non fini ou non atteint — possible hors Slater), le certificat
  s'affaiblit : on a une borne, pas de multiplicateurs optimaux, donc pas
  de KKT ni de sensibilité (5.58).
- **Outre la machine lagrangienne** : la dualité Fenchel (utilisée en
  bloc 7.4) est une
  autre machine — `min f + g` s'écrit `max −f* − g*` — qui couvre les
  problèmes sans contraintes explicites ; la leçon « méthodes proximales »
  en donne la version algorithmique (Moreau, Douglas–Rachford).

### Bloc 9.3 — QuizBlock « Vérifiez votre compréhension » (E.4 — quiz)

5 questions (tag `p1/dualite`, ids `p1-dualite-q1`…`q5`), propositions :

**q1** (dualité faible). Pour un problème quelconque (non convexe), que
peut-on affirmer ?
- (a) `d* = p*` toujours. (b) `d* ≤ p*`, toujours — même non convexe.
  **✓** (c) `d* ≥ p*`. (d) Le gap est toujours nul si le problème a une
  solution. — Explication : c'est l'énoncé (5.23) de BV04 ; la convexité
  n'intervient que pour la dualité *forte*.

**q2** (Slater). Pour un problème convexe différentiable, que garantit la
condition de Slater ?
- (a) `d* = p*` pour tout problème, convexe ou non. (b) **La dualité
  forte `d* = p*`, et l'atteinte du dual optimal si `d* > −∞`.**
  **✓** (c) L'unicité de la solution primale. (d) `d* = p* = 0`. —
  Explication : c'est l'énoncé exact du théorème (BV04 §5.2.3,
  eq. (5.24)–(5.26) + « the dual optimal value is attained »). La convexité
  fait partie des hypothèses — (a) est faux. Sans Slater, `d* = p*` peut
  *tout de même* tenir mais sans atteinte : ex. `minimize (x−1)²` s.t.
  `x² ≤ 0` — `p* = 1`, et `g(λ) = 1 − 1/(1+λ)` a pour supremum `1` en
  `λ → +∞`, jamais atteint (calculé ici) ; et avec gap strict, cf. ex.
  5.21 de BV04 au panneau P1/L1.

**q3** (contrainte cachée). Dans la duale SVM, la contrainte
`Σᵢ αᵢyᵢ = 0`…
- (a) est dans la primale. (b) vient de la minimisation en `b` de la
  lagrangienne : si `Σαᵢyᵢ ≠ 0`, `g(α) = −∞`. **✓** (c) est une
  hypothèse de Slater. (d) n'apparaît qu'en marge souple. — Explication :
  bloc 3.5/6.1 — le domaine fini de `g` porte les contraintes cachées.

**q4** (Lasso). Pourquoi la duale du Lasso est-elle « moins exploitable »
que celle de la SVM ?
- (a) Parce que le Lasso n'est pas convexe. (b) Parce que sa contrainte
  `‖θ‖₁ ≤ t` est non lisse et non affine : `g(λ) = p_pen(λ) − λt` n'a pas
  de forme close — chaque évaluation coûte un lasso. **✓** (c) Parce que la
  dualité forte échoue pour le Lasso. (d) Parce que le Lasso n'a pas de
  multiplicateurs. — Explication : blocs 7.1–7.2 ; la dualité forte *tient*
  (Slater en `θ = 0`), mais la duale ne s'évalue pas en une formule.

**q5** (le piège). Pour `minimize (x−2)²` s.t. `x² ≥ 1` (contrainte
non convexe), le gap de dualité optimal est…
- (a) `1` — la non-convexité ouvre un gap fini. (b) `+∞`. (c) **`0` —
  `x* = 2` est faisable : `p* = 0` et `d* = g(0) = inf (x−2)² = 0`.**
  **✓** (d) Indéterminé sans Slater. — Explication : bloc 8.2 ;
  l'ensemble faisable déconnecté `{x ≤ −1} ∪ {x ≥ 1}` ne suffit pas à
  ouvrir un gap — le minimiseur libre `x = 2` est faisable et la
  contrainte est inactive en `x*`. Un gap strict *existe* bien : cf.
  ex. 5.21 de BV04 (convexe sans Slater, gap 1 — panneau P1/L1).

### Bloc 9.4 — Bibliography

- Boyd, S. & Vandenberghe, L., *Convex Optimization*, Cambridge University
  Press, 2004 — ch. 5 (eq. (5.1)–(5.58), Ex. 5.1–5.2, ex. 5.21), §8.6
  (eq. (8.20)–(8.27)), §3.3.1 (Ex. 3.26). https://web.stanford.edu/~boyd/cvxbook/
- Nocedal, J. & Wright, S., *Numerical Optimization*, 2e éd., SIAM, 2006,
  ch. 12.
- Vapnik, V., *The Nature of Statistical Learning Theory*, Springer, 1998.
- Hastie, T., Tibshirani, R. & Friedman, J., *The Elements of Statistical
  Learning*, 2e éd., Springer, 2009, §3.2, §12.2.
  https://hastie.su.domains/ElemStatLearn/

**Proposed demos — section 9**

- **E.5** : quiz statique (composant `Quiz` existant, questions dans
  `src/lib/quiz/questions/part1.ts`, tag `p1/dualite`). Pas de math.

---

## Fonctions math récapitulatif (phase 3a)

Module `src/lib/math/duality.ts` (extension du module existant — qui couvre
déjà le problème 1-D parabole/quartique du panneau P1/L1) + tests
`duality.test.ts` :

| Fonction | Rôle | Vérification test |
|---|---|---|
| `dualMinimizer2D(λ)` | `[1−λ/2, 1−λ/2]` | valeur close + invariance de la lagrangienne |
| `dualFunction2D(λ)` | `λ − λ²/2` | contre-minimisation numérique de la lagrangienne sur grille |
| `dualGap2D(λ)` | `(λ−1)²/2` | identité `CONDUCTOR_2D_OPTIMUM.primal − dualFunction2D(λ)` ; nul en `λ*` ; ≥ 0 partout |
| `kktCheck2D(x,y,λ)` | rapport KKT (4 conditions + résidus de stationnarité) | tout satisfait en `((½,½),1)` ; unicité sur grille |
| `perturbedValue2D(u)` | `(1−u)²/2` si `u ≤ 1`, `0` sinon | convexité (inégalité de la corde) ; `−p*(u)' = 1−u = λ(u)` |
| `trapLagrangian(x,λ)` / `trapDual(λ)` | `(x−2)² + λ(1−x²)` / `−λ(3+λ)/(1−λ)` si `λ<1`, sinon `−∞` (flag `unbounded`) | contre-minimisation sur grille (λ = 0…0.9, fenêtre ±40) ; décroissance sur `[0,1)` ; `sup = g(0) = 0 = p*` (gap 0) ; KKT en `(2,0)` |
| `unboundedLagrangian(x,λ)` / `unboundedDual(λ)` | `x + λ(1−x²)` / `≡ −∞` | `L(±R, λ) → −∞` ; `p* = d* = −∞` |
| `lassoPrimal(X,y,λ)` | CD exacte `θᵢ ← S_λ((Xᵀy)ᵢ − Σ_{j≠i}(XᵀX)ᵢⱼθⱼ)/(XᵀX)ᵢᵢ` | valeurs closes du jeu diagonal (λ=1 : θ=(2,−¼), p*=2.875) ; seuils de parcimonie λ=2, λ=3 |
| `lassoDualFenchel(X,y,λ)` | ascent de coordonnées exacte sur la boîte `‖u‖∞ ≤ λ` | **dualité forte** : `|dual − primal| < 1e-7` sur jeux fixes (diagonal + non diagonal) ; lien `u* = Xᵀ(y−Xθ*)` ; 1-D : `u* = clip(y,−λ,λ)`, valeurs closes `(3,1)→2.5`, `(0.5,1)→0.125`, `(−2.5,1)→2` |
| `lassoConstrainedDualFunction(X,y,t,λ)` / `lassoConstrainedDualOptimum(X,y,t)` | `p_pen(λ) − λt` / `max_{λ≥0}` (section dorée sur `[0, max(1, ‖Xᵀy‖∞)]`) | dualité forte au point KKT (`½‖y−Xθ(λ*)‖² ≈ dualValue`, tolérance section dorée) ; correspondance `θ_pr(t) = θ_pen(λ*)`, `‖θ(λ*)‖₁ ≈ t` ; concavité de `g` ; grille primale unilatérale |
| `lassoKktReport(X,y,θ,λ)` | `[residual, u*, z*, subgradientOk, maxAbsZ]` | inclusion `z* ∈ ∂‖θ*‖₁` ; cohérence avec `lassoDualFenchel.u` |

Constantes : `CONDUCTOR_2D_OPTIMUM` (p* = d* = 0.5, (x*,y*) = (0.5,0.5),
λ* = 1), `GAP_TRAP_OPTIMUM` (p* = d* = 0, x* = 2, λ* = 0, gap 0),
`GAP_UNBOUNDED_OPTIMUM` (p* = d* = −∞), `LASSO_DEMO` (jeu lasso fixe :
X 2×2 diagonal plein rang, y ∈ R² — valeurs choisies en test).
PRNG : `mulberry32`/`combineSeed` depuis `src/lib/math/util.ts` (aucune
copie privée) ; `softThreshold` depuis `src/lib/math/regularization.ts`.
Validation d'entrée : `λ ≥ 0`, `t > 0`, `X` plein rang en colonnes
(`(XᵀX)` inversible — sinon throw avec message clair), dimensions
cohérentes — conformément aux conventions de `AGENTS.md`.
