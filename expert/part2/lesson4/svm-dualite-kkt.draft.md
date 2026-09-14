# Brouillon — Panneau « Dualité KKT de la SVM : vecteurs support et parcimonie »

> Brouillon du contenu `ExpertPanel` pour le brief
> `p2-l4-svm-dualite-kkt`, à greffer sur
> `src/routes/part2/lesson4/+page.svelte` — section `marge-rigide`
> (h2 id réel `marge-rigide`, ligne 253 ; le frontmatter du brief dit
> `svm-marge-rigide`, à corriger à l'intégration), **après** le Callout
> « Interprétation géométrique — conditions de Karush-Kuhn-Tucker »
> (lignes 561–593) et **avant** le Callout « Complexité algorithmique »
> (lignes 595–602).
>
> **Frontière du cours** (interne, cf. `svm-dualite-kkt.research.md` §4) —
> déjà enseigné, ne pas réenseigner : primal rigide/souple, Lagrangien,
> (P)→(Q), dualité faible + Slater, les deux énoncés duaux (Propositions de
> la leçon), `ŵ = Σα̂ᵢyᵢxᵢ`, `b̂`, KKT **énoncées** (écart complémentaire),
> dual noyau + astuce du noyau, Moore–Aronszajn. **Au-delà** (contenu du
> panneau) : la **dérivation** du dual (`min_{w,b} L` et l'apparition de
> `Σαᵢyᵢ = 0` / `0 ≤ αᵢ ≤ C`) ; `ξᵢ > 0 ⇒ α̂ᵢ = C` (ligne commentée dans la
> source, `coursClassif-4-SVM.tex:1275`) ; les **deux** complémentarités ;
> l'argument « le primal reste inchangé » sous le noyau ; l'argument de
> parcimonie.
>
> Conformément à AGENTS.md (et au précédent P1 implémenté,
> `src/routes/part1/lesson1/+page.svelte:533–833`), **aucun** Callout
> « Au-delà du cours » côté apprenant : le cadrage de la frontière est
> interne (ce brouillon + commentaires de code à l'intégration).
>
> **Numérotation** (décision validée) : le seul nouveau bloc numéroté est la
> DefinitionBlock **`4.4.bis`** (la leçon ne numérote que ses
> DefinitionBlocks 4.1–4.7) ; TheoremBlocks et ExampleBlocks **sans numéro**,
> comme tous les autres de la leçon. `InteractiveSection` : inchangées
> (4.1–4.5).
>
> Sources : Hastie, Tibshirani & Friedman, *The Elements of Statistical
> Learning*, 2e éd., Springer, ch. 12 ((12.8)–(12.25), §12.2.2, §12.3.1) —
> source principale de la dérivation non homogène ; Shalev-Shwartz &
> Ben-David, *Understanding Machine Learning*, CUP 2014, ch. 15 (§15.3
> th. 15.8 + lemme 15.9 Fritz John, §15.4) ; Boyd & Vandenberghe, *Convex
> Optimization*, CUP 2004, ch. 5 (machine de dualité, vérifié dans
> `expert/part1/lesson1/kkt-dualite-lagrangienne.research.md` §1).
>
> Convention des formules : LaTeX brut, tel qu'il ira dans les constantes de
> la page — String.raw-safe (pas de backtick, pas de `${`) ; la page
> `part2/lesson4` utilise des constantes en guillemets simples avec doubles
> backslashes (`\\`) : **convertir** à l'intégration, comme les constantes
> existantes `dualOptim3`, `softDual`, `kktHard`, `kktSoft`, … Notation de la
> leçon : `\langle \cdot, \cdot \rangle`, `\widehat{\cdot}`, `s.c.`,
> `\mathbb{R}^d`.

**Titre du panneau** : `Dualité KKT de la SVM : vecteurs support et parcimonie`

---

## Bloc 1 — Ouverture (paragraphe)

La leçon a énoncé la formulation duale (Proposition) et les conditions KKT
qu'elle satisfait, en renvoyant la preuve à la référence citée. Ce panneau
fait le travail : il calcule le `min_{(w,b)}` de la lagrangienne, et on voit
sortir **exactement** la duale de la leçon — avec sa contrainte
`\sum_i \alpha_i y_i = 0` (marge rigide), puis `0 \leq \alpha_i \leq C`
(marge souple) — et la condition d'écart complémentaire devient une
**boussole** : elle dit quels points portent le classifieur (les vecteurs
support), d'où la parcimonie de la SVM, et pourquoi le noyau entre sans
modifier le primal. C'est l'application directe, fil rouge, de la dualité
convexe de la Partie I, leçon 1 (panneau « Conditions KKT et dualité
lagrangienne »).

## Bloc 2 — DefinitionBlock « Fonction duale de la formulation rigide »

Numéro : `4.4.bis`

À la lagrangienne de la leçon

```
\mathcal{L}(w, b, \alpha) = \dfrac{1}{2}\|w\|^2 + \sum_{i=1}^n \alpha_i \left(1 - y_i\left(\langle w, x_i\rangle + b\right)\right), \qquad \alpha \geq 0,
```

on associe la **fonction duale**

```
g(\alpha) \;=\; \inf_{(w, b) \, \in \, \mathbb{R}^d \times \mathbb{R}} \; \mathcal{L}(w, b, \alpha),
```

c'est-à-dire la meilleure minoration de la valeur optimale `p^*` du primal
que produit le vecteur de multiplicateurs `\alpha` (dualité faible,
Partie I). Le problème dual est alors

```
\max_{\alpha \, \geq \, 0} \; g(\alpha) \;=\; (Q),
```

qui est précisément le `(Q)` écrit dans la leçon. La leçon s'arrête à
l'énoncé : on va maintenant **calculer** `g(\alpha)`.

## Bloc 3 — TheoremBlock « Dérivation du dual rigide »

Sans numéro (convention de la leçon).

Soit `\alpha \geq 0` fixé. La lagrangienne est quadratique strictement
convexe en `w` et affine en `b`, donc `\inf_{(w,b)} \mathcal{L}` est soit
`-\infty`, soit atteint au point où les dérivées s'annulent.

**Stationnarité en `w`.**

```
\nabla_w \, \mathcal{L}(w, b, \alpha) \;=\; w - \sum_{i=1}^n \alpha_i y_i x_i \;=\; 0 \quad \Longrightarrow \quad w(\alpha) \;=\; \sum_{i=1}^n \alpha_i y_i x_i .
```

**Stationnarité en `b`.**

```
\frac{\partial \, \mathcal{L}(w, b, \alpha)}{\partial b} \;=\; - \sum_{i=1}^n \alpha_i y_i .
```

La lagrangienne est affine en `b` de pente `- \sum_i \alpha_i y_i` : son
infimum sur `\mathbb{R}` est fini **si et seulement si** `\sum_{i=1}^n
\alpha_i y_i = 0` (sinon `g(\alpha) = -\infty`). C'est la première
contrainte du dual — elle n'était pas une hypothèse, elle sort du calcul.

**Substitution.** En `w = w(\alpha)` :

```
\mathcal{L}(w(\alpha), b, \alpha) \;=\; \sum_{i=1}^n \alpha_i - \frac{1}{2} \left\| \sum_{i=1}^n \alpha_i y_i x_i \right\|^2 - b \sum_{i=1}^n \alpha_i y_i \;=\; \sum_{i=1}^n \alpha_i - \frac{1}{2} \sum_{i=1}^n \sum_{\ell=1}^n \alpha_i \alpha_\ell \, y_i y_\ell \, \langle x_i, x_\ell \rangle ,
```

le terme en `b` s'annulant sous la contrainte. On a donc

```
g(\alpha) \;=\; \begin{cases} \displaystyle \sum_{i=1}^n \alpha_i - \frac{1}{2} \sum_{i=1}^n \sum_{\ell=1}^n \alpha_i \alpha_\ell \, y_i y_\ell \, \langle x_i, x_\ell \rangle & \text{si } \alpha \geq 0 \text{ et } \sum_{i=1}^n \alpha_i y_i = 0, \\[1.2em] -\infty & \text{sinon}. \end{cases}
```

Le dual de la leçon (la Proposition « formulation duale » de la section
ci-dessus) n'est rien d'autre que `\max_{\alpha \geq 0} g(\alpha)`. Comme le primal est convexe et que Slater tient (la leçon), la
dualité forte donne `p^* = q^*`, et la solution `\widehat{\alpha}` du dual
satisfait les conditions KKT (Partie I, leçon 1).

## Bloc 4 — TheoremBlock « Complémentarité : les vecteurs support, et la parcimonie »

Sans numéro.

L'écart complémentaire de la leçon,

```
\widehat{\alpha}_i \left[ y_i\left(\langle \widehat{w}, x_i\rangle + \widehat{b}\right) - 1 \right] = 0,
```

découpe le jeu de données en deux :

- `\widehat{\alpha}_i > 0 \Longrightarrow y_i\left(\langle \widehat{w},
  x_i\rangle + \widehat{b}\right) = 1` : le point est **sur la marge**
  (`x_i \in H_+` ou `x_i \in H_-`) — c'est la définition du vecteur support ;
- `\widehat{\alpha}_i = 0` n'impose rien : le point est en général
  **à l'extérieur** de la marge (`y_i\left(\langle \widehat{w},
  x_i\rangle + \widehat{b}\right) > 1`).

Et `w` ne dépend que des vecteurs support :

```
\widehat{w} \;=\; \sum_{i=1}^n \widehat{\alpha}_i y_i x_i \;=\; \sum_{i \,:\, \widehat{\alpha}_i > 0} \widehat{\alpha}_i y_i x_i .
```

**Proposition — retirer un point non vecteur support ne change pas la
solution.** Soit `x_k` avec `\widehat{\alpha}_k = 0`, et le même problème
rigide résolu sur les `n-1` points restants. Alors la valeur optimale est
inchangée, `\widehat{w}` aussi, et `\widehat{b}` aussi dès qu'il était
unique (le cas général : un `\widehat{\alpha}_i` intérieur) ; le vecteur
`\widehat{\alpha}`, restreint, reste dual optimal.

<div class="proof-block">
<p><strong>Idée de la démonstration :</strong> notons `p^*`, `q^*` les valeurs
optimales du primal/dual complets, et `p^*_{\mathrm{red}}`,
`q^*_{\mathrm{red}}` celles du problème réduit.</p>
<p><strong>(i)</strong> `(\widehat{w}, \widehat{b})` satisfait les
contraintes du primal réduit (c'étaient des contraintes du primal complet)
: `p^*_{\mathrm{red}} \leq \tfrac{1}{2}\|\widehat{w}\|^2 = p^*`.</p>
<p><strong>(ii)</strong> le vecteur `\widehat{\alpha}` (avec
`\widehat{\alpha}_k = 0`) est dual admissible pour le problème réduit
(`0 \leq \alpha_i` et `\sum_i \alpha_i y_i = 0` toujours satisfaites), et y
atteint la même valeur `q^*` — les termes en `\widehat{\alpha}_k` du
objectif valant `0` : `q^*_{\mathrm{red}} \geq q^*`. Réciproquement, le dual
réduit est le dual complet où l'on impose `\alpha_k = 0` (un sous-problème)
: `q^*_{\mathrm{red}} \leq q^*`. Donc `q^*_{\mathrm{red}} = q^*`.</p>
<p><strong>(iii)</strong> les contraintes du problème réduit sont affines en
`(w, b)` et il est réalisable (`(\widehat{w}, \widehat{b})`, cf. (i)) :
Slater tient (variante B&amp;V pour contraintes affines, eq. 5.27, déjà
citée dans la leçon), donc
`p^*_{\mathrm{red}} = q^*_{\mathrm{red}}`.</p>
<p>D'où `p^*_{\mathrm{red}} = q^*_{\mathrm{red}} = q^* = p^*`,
`(\widehat{w}, \widehat{b})` reste primal optimal pour le problème réduit,
et `\widehat{\alpha}` restreint reste dual optimal ; la stationnarité lui
associe le même `\widehat{w} = \sum_{i \neq k} \widehat{\alpha}_i y_i x_i`,
unique (convexité stricte de `\tfrac{1}{2}\|w\|^2`), et le même
`\widehat{b}` quand il était unique. (Même argument que Hastie, Tibshirani
&amp; Friedman, ESL 2e éd., §12.2.2 : « leaving out an observation that is
not a support vector will not change the solution ».)</p>
<p><strong>Point d'attention :</strong> en l'absence de point intérieur
(`0 < \widehat{\alpha}_i < C`), `\widehat{b}` n'est pas unique (cf. exemple 2
ci-dessous) : retirer `x_k` retire une borne de KKT sur `b`,
l'ensemble des `b` optimales ne peut que s'élargir, et `\widehat{w}` — lui —
reste le même. ∎</div>

## Bloc 5 — Callout « La parcimonie de la SVM »

`Callout type="intuition" title="La parcimonie de la SVM"`

Prédire avec la SVM, c'est évaluer

```
\operatorname{sign}\left[ \sum_{i \,:\, \widehat{\alpha}_i > 0} \widehat{\alpha}_i \, y_i \, \langle x_i, x \rangle + \widehat{b} \right] :
```

seule la **liste des vecteurs support** (et leurs `\widehat{\alpha}_i`) est
nécessaire — les autres points n'interviennent ni dans `\widehat{w}` ni dans
le classifieur. Deux conséquences :

- le nombre de vecteurs support — typiquement bien inférieur à `n` —
  contrôle le coût de la prédiction, et non la taille du jeu d'entraînement ;
- l'écart complémentaire garantit les vecteurs support **avec**
  `\widehat{\alpha}_i > 0`, pas l'inverse : un point peut être sur la marge
  avec `\widehat{\alpha}_i = 0` — c'est le « pas forcément tous » de la
  leçon, qu'on va voir en action dans l'exemple 2 ci-dessous.

## Bloc 6 — TheoremBlock « L'apparition du noyau — le primal reste inchangé »

Sans numéro.

La leçon écrit le dual noyau (produits scalaires
`\langle \phi(x_i), \phi(x_\ell)\rangle`) et note l'astuce : `\phi`
n'intervient que via ces produits scalaires. Pourquoi, alors, le **primal**
dans l'espace de redescription `\mathcal{H}` a-t-il les mêmes solutions ?
Argument de projection (le cas fini-dimensionnel est l'instance
`\mathcal{H} = \mathbb{R}^d`) :

Soit `S = \operatorname{span}\{\phi(x_1), \dots, \phi(x_n)\}` et `P_S` la
projection orthogonale de `\mathcal{H}` sur `S`. Tout `w \in \mathcal{H}` se
décompose `w = P_S w + v` avec `v \in S^\perp` :

```
\|w\|^2_{\mathcal{H}} \;=\; \|P_S w\|^2_{\mathcal{H}} + \|v\|^2_{\mathcal{H}} \;\geq\; \|P_S w\|^2_{\mathcal{H}}
\qquad \text{et} \qquad
\langle w, \phi(x_i)\rangle_{\mathcal{H}} \;=\; \langle P_S w, \phi(x_i)\rangle_{\mathcal{H}} \; \; (\text{car } \phi(x_i) \in S, \; v \perp S).
```

Le projeté `P_S w` satisfait donc **les mêmes contraintes** que `w` avec une
norme **au plus aussi grande** : la valeur optimale du primal dans
`\mathcal{H}` vaut celle du problème restreint à `S`. Plus : si `w` est
optimal et `v \neq 0`, alors `P_S w` est strictement meilleur — contradiction.
**Tout** `w` optimal appartient à `S`.

Sur `S`, la stationnarité du dual (calculée dans le bloc précédent) écrit
`w = \sum_i \alpha_i y_i \phi(x_i)`, et le dual ne contient plus que
`\langle \phi(x_i), \phi(x_\ell)\rangle_{\mathcal{H}} = K(x_i, x_\ell)` :
c'est exactement le dual noyau de la leçon. Le primal reste inchangé, et
toute la machine — dual, `\widehat{w}`, `\widehat{b}`, classifieur — ne
demande que les valeurs de `K` sur le nuage : d'où l'apparition du noyau.
(L'existence de `\mathcal{H}` et de `\phi` associées à `K` est le Théorème
Moore–Aronszajn de la leçon ; « the solution must be in the linear span of
the examples, a fact we will use later to derive SVM with kernels »,
Shalev-Shwartz &amp; Ben-David, ch. 15 §15.4.)

## Bloc 7 — TheoremBlock « Marge souple — d'où vient `0 \leq \alpha_i \leq C`, les trois régimes »

Sans numéro.

La section « SVM à marge souple » de la leçon donne le primal (les variables
d'ajustement `\xi_i`) et énonce le dual avec la contrainte `0 \leq \alpha_i
\leq C` : voici d'où elle sort. Multiplicateurs `\alpha_i \geq 0` pour
`1 - \xi_i - y_i\left(\langle w, x_i\rangle + b\right) \leq 0` et
`\mu_i \geq 0` pour `- \xi_i \leq 0` :

```
\mathcal{L}(w, b, \xi, \alpha, \mu) \;=\; \frac{1}{2}\|w\|^2 + \sum_{i=1}^n \alpha_i \left(1 - y_i\left(\langle w, x_i\rangle + b\right)\right) + \sum_{i=1}^n \bigl(C - \alpha_i - \mu_i\bigr)\, \xi_i .
```

- **Minimisation en `\xi_i \geq 0`** : `\min_{\xi_i \geq 0} (C - \alpha_i -
  \mu_i)\,\xi_i` est fini (vaut `0`, en `\xi_i = 0`) **ssi**
  `C - \alpha_i - \mu_i \geq 0`. L'objectif du dual ne dépendant pas de
  `\mu`, on pose `\mu_i = C - \alpha_i`, ce qui donne exactement la
  **contrainte en boîte** `0 \leq \alpha_i \leq C` du dual de la leçon.
- **Minimisation en `w` et `b`** : comme pour la marge rigide —
  `w = \sum_i \alpha_i y_i x_i` et la contrainte `\sum_i \alpha_i y_i = 0`.

Les conditions KKT complètes (la leçon n'en énonce que la troisième) :

```
\begin{aligned}
& y_i\left(\langle \widehat{w}, x_i\rangle + \widehat{b}\right) - 1 + \widehat{\xi}_i \;\geq\; 0 && \text{(faisabilité primal)} \\
& 0 \;\leq\; \widehat{\alpha}_i \;\leq\; C, \qquad \sum_{i=1}^n \widehat{\alpha}_i y_i = 0 && \text{(faisabilité dual)} \\
& \widehat{\alpha}_i \left[ y_i\left(\langle \widehat{w}, x_i\rangle + \widehat{b}\right) - 1 + \widehat{\xi}_i \right] = 0 && \text{(écart complémentaire)} \\
& \bigl(C - \widehat{\alpha}_i\bigr)\, \widehat{\xi}_i = 0 && \text{(écart complémentaire des slacks)}
\end{aligned}
```

Notons `m_i = y_i\left(\langle \widehat{w}, x_i\rangle + \widehat{b}\right)`
la marge fonctionnelle. Les trois régimes, et leur **preuve** :

1. **`m_i > 1`** (extérieur de la marge) : l'objectif primal étant
   croissant en `\xi_i` (coefficient `C > 0`), le slack optimal vaut
   `\widehat{\xi}_i = \max(0, 1 - m_i) = 0` ; l'écart complémentaire
   `\widehat{\alpha}_i (m_i - 1) = 0` avec `m_i - 1 > 0` donne alors
   **`\widehat{\alpha}_i = 0`** — la leçon l'énonce, on vient de le dériver.
2. **`m_i = 1`** (sur la marge) : `\widehat{\xi}_i = 0` et
   `\widehat{\alpha}_i \in [0, C]` — libre ; les points
   `0 < \widehat{\alpha}_i < C` (intérieurs) sont ceux qui servent à la
   formule de `\widehat{b}` de la leçon.
3. **`m_i < 1`** (dans la marge, y compris mal classé si `m_i < 0`) :
   `\widehat{\xi}_i = 1 - m_i > 0`, et la quatrième condition
   `(C - \widehat{\alpha}_i)\,\widehat{\xi}_i = 0` donne
   **`\widehat{\alpha}_i = C`** — c'est la ligne commentée dans la source du
   cours, maintenant démontrée (Hastie, Tibshirani &amp; Friedman, ESL 2e
   éd., (12.12)+(12.15)).

Deux nuances : la réciproque de (3) est fausse — `\widehat{\alpha}_i = C`
n'empêche pas `\widehat{\xi}_i = 0` ; et (2) ne force pas
`\widehat{\alpha}_i > 0` — un point peut être **sur** la marge avec
`\widehat{\alpha}_i = 0` (le « pas forcément tous » de la leçon).

## Bloc 8 — ExampleBlock « Trois points, marge rigide »

Sans numéro.

Reprenons l'Exercice 1 de la leçon, `x_1 = (1,0)`, `y_1 = +1` et
`x_2 = (-1,0)`, `y_2 = -1`, et ajoutons `x_3 = (2,0)`, `y_3 = +1` — bien
classé, loin de la marge. Le dual est

```
\max_{\alpha} \; \alpha_1 + \alpha_2 + \alpha_3 - \frac{1}{2}\left( \alpha_1^2 + \alpha_2^2 + \alpha_3^2 + 2\alpha_1\alpha_2 + 4\alpha_1\alpha_3 + 4\alpha_2\alpha_3 \right) \quad \text{s.c.} \quad \alpha \geq 0, \; \alpha_1 - \alpha_2 + \alpha_3 = 0,
```

matrice `\langle x_i, x_\ell\rangle` : `x_1 \cdot x_2 = -1`,
`x_1 \cdot x_3 = 2`, `x_2 \cdot x_3 = -2`. La solution est
`\widehat{\alpha} = (\tfrac{1}{2}, \tfrac{1}{2}, 0)` :

- `\widehat{w} = \tfrac{1}{2}(1,0) + \tfrac{1}{2}(-1)(-1,0) = (1,0)`,
  `\widehat{b} = 1 - \langle (1,0), (1,0)\rangle = 0` ;
- marges fonctionnelles `m = (1, 1, 2)` : `x_1`, `x_2` sur la marge
  (`\widehat{\alpha}_1 = \widehat{\alpha}_2 = \tfrac{1}{2} > 0`), `x_3`
  à l'extérieur (`m_3 = 2 > 1`, `\widehat{\alpha}_3 = 0`) — la
  complémentarité `\widehat{\alpha}_i(m_i - 1) = 0` est vérifiée point par
  point : `(0, 0, 0)` ;
- `p^* = q^* = \tfrac{1}{2}\|\widehat{w}\|^2 = \tfrac{1}{2}` : dualité
  forte, écart nul.

`x_3` n'est pas vecteur support : selon le bloc précédent, retirer `x_3`
reproduit exactement l'Exercice 1 — même `(\widehat{w}, \widehat{b})`, mêmes
`\widehat{\alpha}_1 = \widehat{\alpha}_2 = \tfrac{1}{2}`. Le troisième point
n'a **aucun** effet sur le classifieur.

## Bloc 9 — ExampleBlock « Trois points, marge souple, `C = 1` »

Sans numéro.

Mêmes deux premiers points, mais `x_3 = (-\tfrac{1}{2}, 0)`, `y_3 = +1` :
cette fois `x_3` est **dans la marge** (même côté que `x_1`). La solution du
dual (contraintes `0 \leq \alpha_i \leq 1`, `\alpha_1 - \alpha_2 +
\alpha_3 = 0`) est `\widehat{\alpha} = (0, 1, 1)` :

- `\widehat{w} = (-1)(-1,0) + (1)(-\tfrac{1}{2},0) = (\tfrac{1}{2}, 0)` ;
  avec le choix `\widehat{b} = \tfrac{1}{2}`, marges fonctionnelles
  `m = (1, 0, \tfrac{1}{4})` et slacks `\widehat{\xi} = (0, 1, \tfrac{3}{4})` ;
- objectif primal `\tfrac{1}{2}\|\widehat{w}\|^2 + C(\widehat{\xi}_1 +
  \widehat{\xi}_2 + \widehat{\xi}_3) = \tfrac{1}{8} + \tfrac{7}{4} =
  \tfrac{15}{8}` ; objectif dual `\tfrac{15}{8}` : **dualité forte, écart
  nul** ;
- les quatre conditions KKT sont vérifiées point par point (en particulier
  `(C - \widehat{\alpha}_i)\,\widehat{\xi}_i = (1,0,0)\cdot(0,1,\tfrac{3}{4})
  = 0`).

Les trois régimes du bloc précédent, **en un seul exemple** :

| point | `m_i` | `\widehat{\xi}_i` | `\widehat{\alpha}_i` | régime |
|---|---|---|---|---|
| `x_1 = (1,0)` | `1` | `0` | `0` | **sur la marge, mais `\widehat{\alpha}_1 = 0`** — le « pas forcément tous » |
| `x_2 = (-1,0)` | `0` | `1` | `C = 1` | mal classé (outlier), `\widehat{\alpha}_2 = C` |
| `x_3 = (-\tfrac{1}{2},0)` | `\tfrac{1}{4}` | `\tfrac{3}{4}` | `C = 1` | dans la marge, bien classé, `\widehat{\alpha}_3 = C` |

Aucun `\widehat{\alpha}_i` n'est ici intérieur (`0 < \widehat{\alpha}_i < C`)
: `\widehat{b}` n'est **pas unique**. Pour le voir, fixons
`\widehat{w} = (\tfrac{1}{2},0)` et faisons varier `b` : les slacks optimaux
sont `\xi_1(b) = \max(0, \tfrac{1}{2} - b)`,
`\xi_2(b) = \max(0, \tfrac{1}{2} + b)`,
`\xi_3(b) = \max(0, \tfrac{5}{4} - b)`, et pour tout
`b \in [\tfrac{1}{2}, \tfrac{5}{4}]` l'objectif primal vaut
`\tfrac{1}{8} + \tfrac{7}{4} = \tfrac{15}{8}` (les termes en `b` se
compensent), tandis qu'il est strictement plus grand pour `b < \tfrac{1}{2}`
ou `b > \tfrac{5}{4}` : l'ensemble des `b` optimales est exactement
`[\tfrac{1}{2}, \tfrac{5}{4}]`. C'est la remarque de la leçon (« il est
possible de prendre une valeur au hasard dans un certain intervalle pour
`\widehat{b}` »), rendue concrete ; le choix
`\widehat{b} = \tfrac{1}{2}` ci-dessus est la borne inférieure de cet
intervalle.

## Bloc 10 — Callout « Le pont Partie I → Partie II »

`Callout type="summary" title="Le pont Partie I → Partie II"`

Rien de nouveau sous le soleil : le panneau « Conditions KKT et dualité
lagrangienne » de la Partie I, leçon 1 (lagrangienne, fonction duale,
dualité faible, Slater, dualité forte, conditions KKT) s'applique mot pour
mot au QP de la SVM, et fait tout le travail :

1. la **contrainte** `\sum_i \alpha_i y_i = 0` du dual (et la boîte
   `0 \leq \alpha_i \leq C` en souple) sont les **conditions de finitude**
   de `\min_{(w,b,\xi)} \mathcal{L}` — elles ne se posent pas, elles
   s'obtiennent ;
2. la **complémentarité** sélectionne les vecteurs support (`\alpha_i > 0`),
   et `w` ne vit que sur eux : la **parcimonie** est un théorème, pas une
   propriété empirique ;
3. le **noyau** entre parce que toute solution vit dans le span des
   observations — le primal, lui, ne change pas.

Plus loin dans le cours, cette même marge maximale paie en généralisation :
la borne VC de la SVM dépend du rapport marge/rayon des données, et **non**
de la dimension ambiante — Théorème 3.4 (Partie IX, leçon 3).

## Proposed demo

- **Widget** : `SvmAlphaKktExplorer.svelte` dans
  `src/lib/components/demos/`, chargé via `DeferredDemo` **à l'intérieur** de
  l'ExpertPanel (masqué hors mode expert, même que le texte — pattern de
  `src/routes/part1/lesson1/+page.svelte:832`).
- **Module math** : réutilise `src/lib/math/svm.ts` **tel quel**
  (`solveSvmDual`, `LabeledPoint2D`, `generateNoisyClasses2D` (seedé),
  `functionalMargins`, `slackVariables`, noyaux) — aucun nouveau solveur.
  Un seul nouvel export, dans `svm.ts` + ses tests (`svm.test.ts` existant) :
  - `alphaRegimes(alphas: number[], C: number, margins: number[])`:
    `('hors-marge' | 'sur-marge' | 'dans-marge')[]` — `m_i > 1 + tol` /
    `|m_i - 1| ≤ tol` / `m_i < 1 - tol` (le régime « sur la marge mais
    `\alpha_i = 0` » se lit dans le rendu, pas dans l'état) ;
  - `kktResidues(alphas: number[], C: number, margins: number[])`:
    `max_i |α_i (m_i - 1 + ξ_i)|` et `max_i |(C - α_i) ξ_i|` avec
    `ξ_i = max(0, 1 - m_i)` (calculés **depuis les marges**, pas depuis les
    slacks internes du solveur — sinon un résidu éventuel serait masqué) ;
  - tests : les deux exemples chiffrés du brouillon (rigide
    `α = (½,½,0)`, `m = (1,1,2)`, résidus `0` ; souple `C = 1`,
    `α = (0,1,1)`, `m = (1,0,¼)`, résidus `0`), invariants (`kktResidues ≥ 0`
    ; `alphaRegimes` cohérent avec les seuils sur une grille), cas exacts.
- **Précondition (à traiter avant de coder la démo)** : le fallback de `b`
  de `solveSvmDual` (lorsqu'aucun `\alpha_i` est intérieur) peut sortir de
  l'intervalle KKT-valide — `src/lib/math/svm.ts:331–346`, cas documenté
  dans `svm-dualite-kkt.research.md` §3.5 (moyenne des valeurs frontales
  `3/8` hors de `[½, 5/4]`, complémentarité violée). Soit projeter `b` sur
  l'intervalle valide (bornes données par les inégalités de
  complémentarité), soit choisir pour la démo un nuage/`C` par défaut avec
  au moins un `\alpha_i` intérieur. Le widget affichant « résidus KKT ≈ 0 »,
  ce point doit être tranché **avant** intégration.
- **UI** :
  - nuage 2D seedé (ex. `generateNoisyClasses2D(nPerClass, gap, sigma, seed)`
    — signature réelle : `(nPerClass, gap = 3, sigma = 1, seed = 1050)` —
    + 1–2 points plantés « dans la marge » pour garantir les trois régimes) ;
    **note d'honnêteté dans la légende** : « petit problème synthétique
    seedé — illustration des régimes KKT et de la parcimonie, pas un
    benchmark » ;
  - slider `C` sur `\log_{10} C \in [-1, 2]` (de `0.1` à `100`) — l'échelle
    log est nécessaire : `C` parcourt trois ordres de grandeur et les
    `\alpha_i` se placent brutalement sur `0` ou `C` ;
  - barres des `\widehat{\alpha}_i` avec ligne de seuil en `C` ; chaque point
    du nuage coloré par régime (`var(--color-belief)` sur la marge,
    `var(--color-surprise)` dans la marge/outlier,
    `var(--color-text-muted)` à l'extérieur) ;
  - lecture des résidus KKT (`≈ 0` en vert `var(--color-positive)` quand
    sous la tolérance) ;
  - interaction : cliquer un point avec `\widehat{\alpha}_i = 0` le retire
    du nuage ; le solveur est relancé sur le jeu réduit et la frontière de
    décision **ne bouge pas** (c'est la Proposition du bloc 4, visible).
- **Accessibilité** : le click-to-place/retirer sur le SVG des points exige
  l'équivalent clavier — `role="button"`, `tabindex="0"`, `onkeydown`
  (`Enter` retire/rétablit le point) sur chaque point, avec un commentaire
  rappelant que le placement n'est pas arbitraire au clavier (contrainte
  AGENTS.md sur les contrôles pointer-only) ; sliders standards du
  composant `Slider` existant ; `aria-label` sur les barres.
- **Rendu** : SVG minimal fait main pour les barres et la ligne de seuil
  (fallback documenté en commentaire, à remplacer si un composant
  `BarChart` est construit) ; la frontière de décision réutilise la
  projection interne de `ScatterPlot` (vérifier sa constante de padding dans
  le composant avant d'aligner les overlays).
