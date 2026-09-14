# Brouillon — Panneau « Single-linkage, arbres couvrants minimaux et consistance de Hartigan »

> Brouillon du contenu `ExpertPanel` pour le brief
> `p3-l1-single-linkage-mst-hartigan`, à greffer sur
> `src/routes/part3/lesson1/+page.svelte`, après le Callout Ward (fin du h2
> « Liaisons entre clusters », ligne ~772) et avant l'`InteractiveSection 1.4`
> (ligne ~774). Le `anchor: distance-clusters` du brief ne correspond à aucun
> id réel ; le vrai h2 est `liaisons`. On ne modifie pas le brief.
>
> **Numérotation** : la leçon n'a pas de blocs numérotés → aucun numéro (précédent
> `svm-dualite-kkt.draft.md`).
>
> **Frontière du cours** (interne — pas de callout visible, règle AGENTS.md) :
> `course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex`, section «
> Clustering hiérarchique », enseigne les quatre liaisons de façon
> algorithmique et **énonce sans preuve** la proposition Ward. Le panneau :
> (i) **prouve** la proposition Ward (renforcement du cours, pas extension),
> (ii) donne la structure MST du single-linkage, (iii) expose la consistance
> de Hartigan, (iv) explique l'absence de caractérisation comparable pour
> complete/average. Tout le (ii)–(iv) est au-delà du cours ; le cadrage vit
> dans les commentaires de code et dans
> `single-linkage-mst-hartigan.research.md` uniquement.
>
> **Sources** (détail + statut de vérification dans le fichier de recherche) :
> Gower & Ross 1969 ; Sibson 1973 ; Lance & Williams 1966 ; Ward 1963 ;
> Hartigan 1975 (cadre) et 1981 (énoncés) ; Penrose 1995 ; Wishart 1969 ;
> Chaudhuri & Dasgupta 2010 ; Carlsson & Mémoli 2010 ; de Amorim 2015 ;
> von Luxburg 2007 (contraste spectral).
>
> **Convention** : formules dans des backticks, prêtes à coller dans
> `String.raw` (aucun backtick interne, aucun `${`). Transposes en `\top`
> (convention du dépôt).

**Titre du panneau** : `Single-linkage, arbres couvrants minimaux et consistance de Hartigan`

---

## Bloc 1 — Ouverture (paragraphe)

La leçon a présenté quatre critères de liaison comme des recettes : à chaque
étape, fusionner la paire de clusters la plus proche au sens du critère. Deux
questions naturelles restent sans réponse. **Pourquoi** le single-linkage
fusionne-t-il « si tôt » (le défaut de « chaînage », illustré en fin de
panneau), et **que
vaut** le dendrogramme qu'il produit ? La réponse surprenante est que le
single-linkage n'est pas seulement un algorithme glouton : c'est l'unique
liaison qui encode un objet mathématique exact — un **arbre couvrant minimal**
— et c'est précisément cette structure qui lui donne un résultat de
**consistance** (Hartigan 1975, 1981) que les autres liaisons n'ont pas. On
en profite aussi pour prouver la proposition Ward de la leçon, énoncée sans
preuve : la distance de Ward n'est rien d'autre que l'augmentation exacte de
l'inertie intra-clusters causée par la fusion.

## Bloc 2 — TheorySection « Le single-linkage est un arbre couvrant minimal »

Soient $n$ points $\{x_1, \dots, x_n\}$ et une distance $d$. Pour un seuil
$t \ge 0$, on note $G_t$ le graphe simple sur $[n]$ dont les arêtes sont les
paires $\{i,j\}$ avec $d(x_i, x_j) \le t$. La partition du **single-linkage**
au seuil $t$ a une lecture immédiate : deux points sont dans le même cluster
s'ils sont **connectés** dans $G_t$ — c'est la clôture transitive de « deux
éléments proches ».

```
\text{clusters au seuil } t \;=\; \text{composantes connexes de } G_t .
```

**Théorème (Gower–Ross, 1969).** Soit $T$ un arbre couvrant minimal (MST) du
graphe complet sur $[n]$ pondéré par $d$. Pour tout $t \ge 0$, les composantes
connexes de $G_t$ sont exactement les composantes connexes du sous-graphe de
$T$ formé des arêtes de poids $\le t$.

**Idée de la preuve.** L'inclusion « arêtes du MST $\le t$ $\Rightarrow$
arêtes de $G_t$ » est triviale. Réciproquement, soient $i, j$ reliés par un
chemin dans $G_t$. On examine ce chemin arête par arête, dans l'ordre de
Kruskal : si une arête $e=\{u,v\}$ du chemin est **rejetée** par Kruskal,
c'est que $u$ et $v$ sont déjà reliés dans la forêt en cours par un chemin
d'arêtes **acceptées**, toutes de poids $\le w(e)$ (Kruskal ne rejette que
des arêtes dont les extrémités sont déjà connectées, et la forêt ne contient
que des arêtes traitées, donc de poids $\le w(e)$). On remplace $e$ dans le
chemin par ce chemin : on ne dépasse jamais le poids de $e$, donc on reste
sous le seuil $t$. À la fin, le chemin ne contient plus que des arêtes
acceptées par Kruskal, c'est-à-dire des arêtes de $T$. Les deux points sont
reliés dans le MST sous le seuil. $\square$

Deux conséquences immédiates. D'abord, le **niveau de fusion** $\lambda(A,B)$
de deux clusters $A, B$ dans le dendrogramme de single-linkage :

```
\lambda(A,B) \;=\; \max_{e \, \in \, \mathrm{chemin}_T(A,B)} w(e),
```

le poids de la plus lourde arête du chemin unique de $T$ reliant $A$ à $B$.
Ensuite, l'**identité minimax** : pour $i \ne j$, cette plus lourde arête
coïncide avec le meilleur chemin possible au sens du goulot d'étranglement,

```
\max_{e \in \mathrm{chemin}_T(i,j)} w(e) \;=\; \min_{P} \max_{e \in P} w(e),
```

où le minimum parcourt tous les chemins $P$ de $i$ à $j$. *Justification* :
soit $e$ la plus lourde arête du chemin de $T$ entre $i$ et $j$, et $S$ la
composante de $T \setminus e$ contenant $i$ ; $e$ est la plus légère arête
traversant le cut $(S, V \setminus S)$ (propriété du cut, conséquence de
Kruskal), donc tout chemin de $i$ à $j$ doit traverser ce cut par une arête
de poids $\ge w(e)$, et le chemin de $T$ montre que l'égalité est atteinte.

**Le chaînage, enfin, n'est plus une curiosité** : la connexité dans $G_t$
est transitive, donc une chaîne de paires de points proches — même mince,
même formée de bruit — fusionne tous les clusters qu'elle touche. Le
single-linkage ne mesure que la connexité d'un graphe de seuil, jamais la
compacité. Le cours ne nomme pas ce défaut (vérifié : aucun « chaînage » dans
la section du tex) ; le panneau l'introduit ici. Et on va voir qu'il a une
conséquence bien plus grave : il fait **tomber la
consistance** dès que la dimension vaut $2$ ou plus (Bloc 5).

## Bloc 3 — Callout « Preuve de la proposition Ward »

`Callout type="info" title="La proposition Ward, prouvée"`

La leçon a énoncé la proposition Ward sans la prouver : la distance de Ward

```
d_W^2(A,B) \;=\; \frac{|A|\,|B|}{|A|+|B|}\,\|c_A - c_B\|^2
```

correspond au gain d'inertie intra-clusters quand on fusionne $A$ et $B$.
Voici la preuve en deux lignes. Pour un ensemble fini $S$, notons
$I(S) = \sum_{x \in S} \|x - c_S\|^2$ son inertie intra et $c_S$ sa
centroïde. Comme $c_{A\cup B} = \frac{|A|c_A + |B|c_B}{|A|+|B|}$ et que
$\sum_{x \in A} (x - c_A)$ est orthogonal à $c_A - c_{A\cup B}$ (décomposition
« axe parallèle »),

```
I(A \cup B) \;=\; I(A) + I(B) + \frac{|A|\,|B|}{|A|+|B|}\,\|c_A - c_B\|^2 .
```

Fusionner $A$ et $B$ augmente donc la somme des inerties intra-clusters
**exactement** de $d_W^2(A,B)$ ; le pas glouton de Ward, qui choisit la paire
de plus petite distance de Ward, est exactement le pas qui minimise
l'augmentation de variance intra-clusters. Comme l'inertie totale
$\sum_x \|x - c\|^2$ (avec $c$ la centroïde globale) est constante et
s'écrit $I_{\text{intra}} + I_{\text{inter}}$, la perte d'inertie
inter-clusters est la même quantité — c'est la seconde formulation de la
proposition. **Nuance** : le pas est *glouton* — il minimise l'augmentation à
l'étape courante, sans aucune optimalité globale sur la suite des fusions ;
la « preuve » ne promet jamais plus que cela.

## Bloc 4 — TheorySection « Consistance de Hartigan »

Quel est le « vrai » regroupement d'une distribution $P$ de $\mathbb{R}^d$ ?
Hartigan (1975) propose une réponse géométrique : pour une densité $f$ et un
niveau $\lambda$, les **clusters denses** de niveau $\lambda$ sont les
composantes connexes de la région $\{x : f(x) \ge \lambda\}$. Quand $\lambda
\downarrow 0$, ces composantes apparaissent et fusionnent : on obtient une
hiérarchie emboîtée, l'**arbre de clusters de la densité** $C_f$. La question
de consistance est alors : le dendrogramme de single-linkage, calculé sur un
échantillon de taille $n$, converge-t-il vers $C_f$ quand $n \to \infty$ ?

**Résultats de Hartigan (1981).**

1. **En dimension $1$, oui** : le single-linkage est consistant — le
   dendrogramme empirique converge vers l'arbre de clusters de la densité.
2. **En dimension $d \ge 2$, non** : Hartigan le montre par une réduction à
   la *percolation de continuum* (rendue formelle par Penrose, 1995). Le
   mécanisme est celui du chaînage : deux hauts plateaux de densité peuvent
   être reliés par un col de densité positive mais petite ; dès que le seuil
   $t$ couvre le col, la connexité franchit le pont, et le cluster empirique
   englobe un morceau de la région voisine. La consistance forte demande que
   $A \cap X_n \subset A_n$ pour la région vraie $A$ — et c'est précisément
   cette inclusion qui échoue en $d \ge 2$.
3. **Une version plus faible survit — la consistance fractionnaire** : il
   suffit que $A_n$ contienne un « morceau substantiel » de $A \cap X_n$ et
   soit très proche du reste. Hartigan (1981) l'établit pour deux régions $A,
   A'$ dès que le rapport

   ```
   \frac{\inf_{x \in A \cup A'} f(x)}{\sup_{P \,:\, A \to A'} \inf_{x \in P} f(x)}
   ```

   (densité sur les régions / pire densité le long des chemins qui les
   relient) est « suffisamment grand » ; **Penrose (1995) referme l'écart :
   le seuil exact est $\gt 1$**.

**Le cas des deux populations, qu'on peut prouver soi-même.** Soient
$P, Q \subset \mathbb{R}^d$ deux populations de **support compact**, à
distance $\delta > 0$ l'une de l'autre, et $X_1, \dots, X_n$ i.i.d. de loi de
support inclus dans $P \cup Q$. Si $D_{\max}$ majorise les distances
intra-population, alors pour tout $t$ avec $D_{\max} < t < \delta$ : chaque
population échantillonnée est une **clique** de $G_t$ (toutes ses paires sont
à distance $\le D_{\max} < t$), et aucune arête ne relie $P$ à $Q$ (toutes les
distances inter sont $\ge \delta > t$). Les composantes de $G_t$ sont donc
**exactement** les deux populations — **déterministiquement, pour tout
échantillon et toute taille $n$** : aucune concentration n'est nécessaire.
Le dendrogramme de single-linkage a alors pour dernière fusion la séparation
$P \mid Q$ : couper l'arbre à tout niveau de $(D_{\max}, \delta)$ donne la
vraie partition.

**Et si le support n'est pas compact ?** C'est ici que l'intuition trahit.
Pour deux blobs gaussiens d'écart-type $\sigma$ et de centre à distance
$\delta$, la plus grande distance intra-croît comme $O(\sigma\sqrt{\log n})$
(tandis que la plus petite distance inter-décroît comme $\delta -
O(\sigma\sqrt{\log n})$) : le *gap observé* — l'intervalle des seuils qui
séparent les deux populations — **se referme avec $n$**. Avec les paramètres
des démonstrations de la leçon ($\sigma = 0{,}7$, $\delta = 8$), une
simulation seedée (50 réplicas par $n$) donne
$\mathbb{P}(\text{gap} > 0) = 1{,}00$ à $n = 10$, $0{,}68$ à $n = 100$, et
$0{,}10$ seulement à $n = 300$ : au-delà d'une centaine de points par blob,
**aucun seuil ne sépare plus les deux blobs** — les queues gaussiennes
font le pont, c'est le chaînage. La consistance de Hartigan n'est donc pas
un énoncé sur « un seuil fixe $t$ » : c'est un énoncé sur la **convergence
du dendrogramme entier** vers l'arbre de clusters de la densité, où l'index
des niveaux est un *niveau de densité* $\lambda$ (et non une distance), avec
un seuil d'échantillon qui dépend de $n$. En $d = 1$ cette convergence a
lieu (Hartigan 1981) ; en $d \ge 2$ elle échoue (Penrose 1995) — le pont de
densité positive est le même objet que la chaîne de points du Bloc 2.

**À retenir.** Le défaut de chaînage et l'échec de la consistance en $d \ge 2$
sont **le même phénomène** : la connexité franchit les cols. C'est pourquoi
des versions robustes existent — Wishart (1969) ne connecte un point que s'il
a au moins $k$ voisins à distance $\le r$ (ce qui ignore les ponts minces),
et Chaudhuri–Dasgupta (2010) rendent cette idée consistante avec deux
paramètres $(k, \alpha)$ — et pourquoi le single-linkage « pur » reste un
outil de choix pour la dimension $1$ et les données où les clusters sont
séparés par de vrais vides.

## Bloc 5 — TheorySection « Pourquoi pas complete/average ? Complexité »

**Pas de caractérisation comparable.** Dans la littérature consultée, aucune
identité de type MST ne s'attache au lien complet ($d_{\max}$) ou au lien
moyen (UPGMA). Ce qui est vrai en sens inverse : **c'est le single-linkage
qui est unique**. Carlsson & Mémoli (2010) montrent que parmi les méthodes
hiérarchiques agglomératives, le single-linkage est la **seule** à satisfaire
simultanément trois axiomes naturels (dont la *fonctorialité*, analogue
d'un des axiomes de Kleinberg 2003 — qui lui-même prouve qu'aucune méthode ne
peut satisfaire *tous* ses axiomes). Le single-linkage n'est pas « le plus
bon » critère : c'est le seul dont la structure soit **exacte**, et c'est ce
qui le rend analysable (MST, consistance) quand les autres restent des
heuristiques. Côté comportement, le lien complet est anti-chaining mais biaise
vers des clusters globulaires de taille comparable, et le lien moyen est un
compromis plus robuste que le single-linkage mais au même biais globulaire.

**Complexité.** Le cours comptait $O(dn^2)$ par itération (recalcul de toutes
les distances de paires à chaque fusion) : $O(dn^3)$ au total. Trois
améliorations classiques.

1. **Récurrences de Lance–Williams (1966)** : la distance d'un cluster $S$ au
   nouveau cluster $A \cup B$ s'écrit comme combinaison *linéaire* des
   distances $d(S,A)$ et $d(S,B)$ (coefficients dépendant du critère et des
   effectifs) ; pour le single-linkage, elle se réduit à
   $d(S, A \cup B) = \min\big(d(S,A), d(S,B)\big)$. Mise à jour $O(n)$ par
   fusion : **$O(dn^2)$ au total** (la matrice initiale domine).
2. **SLINK (Sibson, 1973)** : pour le single-linkage seulement, $O(n^2)$
   temps et **$O(n)$ mémoire** — on n'a même pas besoin de la matrice de
   distances complète, seulement le plus proche voisin de chaque point,
   maintenu à jour.
3. **Par le MST** : Prim sur le graphe complet (matrice de distances) en
   $O(n^2)$, puis Kruskal sur les $n-1$ arêtes de l'arbre en $O(n \log n)$ —
   le théorème du Bloc 2 transforme la construction du dendrogramme en deux
   problèmes de graphes classiques, et l'on retrouve le « $O(n^2 \log n)$ ou
   mieux » annoncé. Pour le lien complet, l'algorithme analogue s'appelle
   CLINK (Defays, 1977), en $O(n^2)$.

**Contraste spectral.** Le MST réapparaît dans le clustering spectral (leçon
à venir) — mais seulement pour **caler le paramètre** $\varepsilon$ du graphe
de $\varepsilon$-voisins (von Luxburg, 2007) : aucune consistance
hiérarchique n'y est en jeu. L'apparition du MST en single-linkage est la
seule qui donne une *preuve*.

## Bloc 6 — Démo proposée (pour l'implémentation, non visible)

`DeferredDemo` → `SingleLinkageMstExplorer.svelte` (nouveau module de maths
`src/lib/math/mst.ts` + `mst.test.ts`).

**Panneau de gauche — points + MST + seuil :**
- Préréglages (radio) :
  - « Deux disques (support compact) » : deux disques uniformes de rayon $r$
    à distance $\delta > 4r$ — la proposition du Bloc 4 : à tout seuil $t$
    dans le gap, la partition est la vraie, **déterministiquement** ;
  - « Deux blobs gaussiens » : `generateBlobs(2, n, seed)` de
    `clustering.ts` ($\sigma = 0{,}7$, $\delta = 8$) — le gap observé se
    referme avec $n$ (Bloc 4, alinéa « support non compact ») ;
  - « Chaînage » : deux disques + une file de points espacés de $s < t$ entre
    eux — un seul cluster à seuil $t$ malgré des disques bien séparés (Bloc 2).
- Slider $n \in [20, 300]$ (par population) ; case « afficher le MST »
  (arêtes colorées par poids, les arêtes $\le t$ en surbrillance) ; slider de
  seuil $t$ (valeur par défaut : milieu du gap observé pour les deux
  préréglages à deux populations).
- Visualisation : scatter (composant existant) + surcharge SVG du MST (miroir
  de la projection du scatter, padding exact lu dans le composant) +
  coloration des composantes de $G_t$ (un CSS var par composante, palette
  bornée).
- Métriques : nombre de composantes de $G_t$ ; max intra ; min inter ; gap
  observé = min inter − max intra ; indicateur « 2 composantes = vraie
  partition ? » (préréglages à deux populations).

**Panneau de droite — le gap observé $g(n)$ (courbe, préréglages
« disques » et « gaussiens ») :**
- Courbe $n \mapsto \overline{g(n)}$ : pour $n \in \{10, 20, 40, 80, 120,
  160, 200, 240, 300\}$ (par blob), moyenne sur $K = 10$ réplicas seedés
  (PRNG `mulberry32` + `combineSeed` de `util.ts`) de
  $g(n) = \min_{\text{inter}} d - \max_{\text{intra}} d$. Ligne horizontale à
  $0$. Deux lectures :
  - disques : $g(n) > 0$ pour tout $n$ (tend vers $\delta - 4r$) — la
    proposition tient, toute $n$ confondue ;
  - gaussiens : $g(n)$ décroît et **croise zéro** vers $n \approx 100$–$150$
    (vérifié numériquement : $\mathbb{P}(g>0) = 1{,}00/0{,}68/0{,}10$ à
    $n = 10/100/300$, cf. fichier de recherche §3.3) — le chaînage gagne.
  Note d'honnêteté dans la légende : petit problème synthétique seedé,
  illustration du mécanisme de la consistance (et de son échec), pas un
  benchmark.

**Fonctions de maths à tester (`mst.test.ts`) :**
- `mstKruskal(points, dist?)` : poids total exact contre force brute
  (énumération des arbres de Prüfer, $n \le 6$) ; invariance par isométrie ;
  cas exacts à la main $n = 2, 4$ ; rejets d'inputs invalides.
- `singleLinkageFromMst(points)` : **équivalence** avec
  `hierarchicalAgglomerative(points, 'single')` de `clustering.ts` sur
  plusieurs seeds — partitions `cutPartition(·, k)` identiques pour tout
  $k$ (données sans égalités de distances, sinon tie-break différent).
- `componentsAtThreshold(points, t)` : invariants — nombre de composantes
  non croissant en $t$, $t < \min d$ ⇒ $n$ composantes, $t \ge \max d$ ⇒
  $1$ composante ; **équivalence Gower–Ross** :
  `componentsAtThreshold(points, t)` = `cutByThreshold(singleLinkageFromMst(points), t)`
  (mêmes partitions) sur plusieurs $(points, t)$.
- `mstPathMaxEdge(mst, i, j)` + identité minimax : $\max$ arête du chemin MST
  $= \min_P \max_{e \in P} w(e)$, force brute (Floyd–Warshall min-max) sur
  petits graphes aléatoires seedés.
- `gapMetrics(points, labels)` : cas exact à la main ; rejets (moins de deux
  classes non vides, classe de taille 1).
- `meanGapCurve` : déterminisme (même seed → même courbe) ; préréglage
  disques : gap strictement positif sur toute la grille ; préréglage
  gaussiens (paramètres du cours) : la moyenne croise zéro dans la grille.
- `generateDisksPair` / `generateChainedDisks` : tailles, déterminisme, et
  pour les disques : tout couple intra $\le 2r$, tout couple inter $\ge
  \delta - 2r$ (bornes exactes du modèle compact).

**Imports à lire avant implémentation** : `clustering.ts` (signature
`hierarchicalAgglomerative`), `util.ts` (`mulberry32`, `combineSeed`),
`ScatterPlot.svelte` (constante de padding pour la surcharge),
`DeferredDemo.svelte`, `KktDualityExplorer.svelte` (pattern de démo),
`CahStepByStep.svelte` (fallback SVG dendrogramme).

## Références à ajouter à la Bibliographie de la leçon

- Gower, J.C., Ross, M.A. (1969). Minimum Spanning Trees and Single Linkage
  Cluster Analysis. *Journal of the Royal Statistical Society. Series C
  (Applied Statistics)*, 18(1), 54–64. DOI: 10.2307/2346439.
- Sibson, R. (1973). SLINK: an optimally efficient algorithm for the
  single-link cluster method. *The Computer Journal*, 16(1), 30–34.
  DOI: 10.1093/comjnl/16.1.30.
- Lance, W.G., Williams, W.H. (1966). A General Theory of Classificatory
  Sorting Strategies: 1. Hierarchical Systems. *The Computer Journal*,
  9(4), 373–380.
- Ward, J.H. (1963). Hierarchical Grouping to Optimize an Objective Function.
  *Journal of the American Statistical Association*, 58(301), 236–244.
- Hartigan, J.A. (1975). *Clustering Algorithms*. Wiley, New York.
- Hartigan, J.A. (1981). Consistency of single linkage for high-density
  clusters. *Journal of the American Statistical Association*, 76(374),
  388–394.
- Penrose, M. (1995). Single linkage clustering and continuum percolation.
  *Journal of Multivariate Analysis*, 53, 94–109.
- Wishart, D. (1969). Mode analysis: a generalization of nearest neighbor
  which reduces chaining effects. *Proceedings of the Colloquium on Numerical
  Taxonomy*, University of St Andrews, 282–308.
- Chaudhuri, K., Dasgupta, S. (2010). Rates of convergence for the cluster
  tree. *Advances in Neural Information Processing Systems (NeurIPS)*, 2010.
- Carlsson, G., Mémoli, F. (2010). Characterization, stability and
  convergence of hierarchical clustering methods. *Journal of Machine
  Learning Research*, 11, 1425–1470.
- Defays, D. (1977). An efficient algorithm for a complete-link method.
  *The Computer Journal*, 20(4), 364–366.
- de Amorim, R.C. (2015). Ward's hierarchical clustering method.
  *WIREs Computational Statistics* (revue) — URL :
  https://repository.essex.ac.uk/20365/1/MW_Ward.pdf
