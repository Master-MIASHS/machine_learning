# Recherche — Single-linkage, MST et consistance de Hartigan

> Agent de recherche pour le brief `p3-l1-single-linkage-mst-hartigan`.
>
> **Frontière du cours** : `course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex`,
> section « Clustering hiérarchique » (diapos « Principe », « Distance entre deux
> clusters » ×3, « Dendogramme », « Choix du nombre de clusters »). La section
> enseigne : le principe CAH, les distances de liaison (lien simple = min,
> lien complet = max, lien moyen = moyenne, lien centroïdal, distance de Ward
> $d(C_k,C_\ell)=\frac{|C_k|\,|C_\ell|}{|C_k|+|C_\ell|}\,\|\mu_k-\mu_\ell\|^2$),
> la **proposition** Ward (« la distance de Ward correspond au gain de variance
> intra-classe… lorsque l'on fusionne ») **énoncée sans preuve**, le dendrogramme
> (longueur de branche = distance de fusion), le choix de $k$ (seuil $r$ ou
> silhouette), et la complexité naïve $O(dn^2)$ par itération.
> **Aucun** arbre couvrant minimal, aucune consistance de Hartigan, aucune
> récurrence de Lance–Williams n'y figurent. Tout le contenu MST + Hartigan +
> preuve de la proposition Ward est donc au-delà du cours (marqué comme tel
> dans le brouillon, sans callout de frontière visible — cf. `expert/README.md`).

## 1. Single-linkage = arbre couvrant minimal

### 1.1 Référence primaire

- **Gower, J.C., Ross, M.A. (1969).** « Minimum Spanning Trees and Single
  Linkage Cluster Analysis. » *Journal of the Royal Statistical Society.
  Series C (Applied Statistics)*, 18(1), 54–64. DOI `10.2307/2346439` (JSTOR
  2346439).
- **Statut** : référence exacte vérifiée sur Crossref. Le texte intégral
  (JSTOR) est inaccessible (client challenge). L'équivalence elle-même est
  vérifiée par deux sources secondaires indépendantes ci-dessous **et** par
  la preuve élémentaire auto-contenue du §1.3, qui ne dépend d'aucun de ces
  documents.

### 1.2 Énoncés vérifiés dans des sources consultées

- **Chaudhuri & Dasgupta (2010)** (« Rates of convergence for the cluster
  tree », NeurIPS 2010, PDF libre `proceedings.neurips.cc/paper/2010/file/
  b534ba68236ba543ae44b22bd110a1d6-Paper.pdf`, texte extrait), p. 3,
  **citation exacte** : « There is a simple and elegant algorithm that is a
  plausible estimator of the cluster tree: **single linkage (or Kruskal's
  algorithm)**; see the appendix for pseudocode. »
- **Wikipédia, « Hierarchical clustering »** (consulté 2026-09-14, version
  anglaise) : l'algorithme naïf de single-linkage est exactement Kruskal sur
  le graphe complet ; et (tableau des méthodes) : « For single linkage, an
  optimized algorithm based on minimum spanning trees reduces the time
  complexity to **O(n² log n)** ». Le même article décrit le chaînage :
  single-linkage « can detect and handle clusters of arbitrary shape,
  including elongated… structures. However, it is highly sensitive to noise
  and outliers, because a single pair of close points is sufficient to merge
  two clusters. »

### 1.3 Énoncé exact + preuve (auto-contenue, à vérifier par relecture)

**Théorème (Gower–Ross).** Soient $n$ points avec une distance $d$ symétrique,
$G_t$ le graphe sur $[n]$ de bordes $\{i,j\}$ avec $d(i,j) \le t$, et $T$ un
arbre couvrant minimal (MST) du graphe complet pondéré par $d$. Pour tout
$t \ge 0$, les composantes connexes de $G_t$ sont exactement les composantes
connexes du sous-graphe $(V, E(T) \cap \{(i,j): d(i,j)\le t\})$.

**Preuve.** L'inclusion $E(T)_{\le t} \subseteq E(G_t)$ est triviale, donc
chaque composante de $T_{\le t}$ est contenue dans une composante de $G_t$.
Réciproquement, soient $i,j$ reliés par un chemin $P = e_1 \dots e_k$ dans
$G_t$ (toutes les $e_r$ ont poids $\le t$). On remplace inductivement chaque
arête $e_r$ de $P$ : si $e_r=\{u,v\}$ est **rejetée** par Kruskal (ordre des
arêtes croissant, égalités tranchées par un ordre fixe), alors au moment où
$e_r$ est traitée, $u$ et $v$ sont déjà reliés dans la forêt en cours par un
chemin d'arêtes **acceptées**, toutes de poids $\le w(e_r) \le t$ — car
Kruskal ne rejette une arête que si ses extrémités sont déjà dans la même
composante de la forêt, et cette composante est formée d'arêtes déjà traitées,
donc de poids $\le w(e_r)$. On remplace $e_r$ dans $P$ par ce chemin : le
chemin résultant relie encore $i$ à $j$ et n'utilise que des arêtes de poids
$\le t$. À la fin, toutes les arêtes du chemin final sont acceptées par
Kruskal, donc appartiennent à $T$. Ainsi $i,j$ sont reliés dans $T_{\le t}$. ∎

**Conséquences (toutes élémentaires, déduites du théorème) :**

1. **Niveau de fusion.** Dans le dendrogramme de single-linkage, le niveau
   $\lambda(A,B)$ de la fusion de deux clusters $A,B$ est
   $\lambda(A,B) = \min\{t : A,B \text{ dans la même composante de } G_t\}
   = \max_{e \in \mathrm{chemin}_T(A,B)} w(e)$ — le poids de la plus lourde
   arête du chemin unique de $T$ reliant $A$ à $B$.
2. **Identité minimax.** Pour $i \ne j$,
   $\max_{e \in \mathrm{chemin}_T(i,j)} w(e) = \min_{P} \max_{e \in P} w(e)$
   où le minimum parcourt tous les chemins $P$ de $i$ à $j$.
   *Justification* : soit $e$ la plus lourde arête du chemin de $T$ entre $i$
   et $j$, et $S$ la composante de $T \setminus e$ contenant $i$. Tout chemin
   de $i$ à $j$ traverse le cut $(S, V\setminus S)$ par une arête de poids
   $\ge w(e)$, car $e$ est la plus légère arête traversant ce cut (propriété
   du cut, conséquence de l'algorithme de Kruskal) ; le chemin de $T$
   montre que le minimum est atteint.
3. **Chaînage.** La connexité dans $G_t$ est transitive : une chaîne de
   paires proches fusionne tous les clusters qu'elle touche, quelle que soit
   la taille des clusters. C'est le défaut d'« elongation »/chaining — la
   leçon et `course_sources/` ne le nomment pas (vérifié : aucun « chaînage »
   dans la section du tex), le panneau l'introduit et l'explique
   structurellement : single-linkage ne mesure que la connexité d'un graphe
   de seuil, pas la compacité.

### 1.4 Complexité (vérifiée)

- **Naïf** : recalcul de la matrice de distances à chaque fusion →
  $O(n-1)$ fusions × $O(n^2)$ mises à jour = $O(n^3)$ (plus $O(dn^2)$ pour la
  matrice initiale). Le cours cite $O(dn^2)$ *par itération* (même ordre,
  comptage par étape).
- **Récurrence de Lance–Williams** : pour single-linkage,
  $d(S, A\cup B) = \min\big(d(S,A),\, d(S,B)\big)$ → mise à jour $O(n)$ par
  fusion → $O(n^2)$ au total.
  - Lance, W.G., Williams, W.H. (1966). « A General Theory of
    Classificatory Sorting Strategies: 1. Hierarchical Systems. » *The
    Computer Journal*, 9(4), 373–380. **Vérifié sur Crossref.**
  - Lance, W.G. (1967). « A General Theory of Classificatory Sorting
    Strategies: II. Clustering. » *The Computer Journal*, 10(3), 271–277.
    **Vérifié sur Crossref** (DOI `10.1093/comjnl/10.3.271`).
- **SLINK** : Sibson, R. (1973). « SLINK: an optimally efficient algorithm
  for the single-link cluster method. » *The Computer Journal*, 16(1),
  30–34. DOI `10.1093/comjnl/16.1.30`. **Référence et titre vérifiés
  (Crossref + liste de Wikipédia)** ; bornes $O(n^2)$ temps / $O(n)$ espace
  : standard, cf. Murtagh & Contreras (2012) ci-dessous — le texte intégral
  n'a pas été lu (payant), on n'affirme que la borne $O(n^2)$.
- **Par le MST** : Prim sur le graphe complet (matrice de distances) en
  $O(n^2)$, puis Kruskal sur les $n-1$ arêtes de l'arbre en $O(n \log n)$ →
  $O(n^2)$ au total dans le modèle dense ; l'énoncé $O(n^2 \log n)$ de
  Wikipédia correspond au modèle avec oracule de comparaison (tri des arêtes).
  Les deux bornes couvrent le « $O(n^2 \log n)$ ou mieux » du brief.
- **Lien complet** : CLINK — Defays, D. (1977). « An efficient algorithm for
  a complete-link method. » *The Computer Journal*, 20(4), 364–366.
  **Référence vérifiée** (liste de références de Wikipédia,
  DOI `10.1093/comjnl/20.4.364`).
- **Revue d'ensemble** : Murtagh, F., Contreras, P. (2012). « Algorithms for
  hierarchical clustering: an overview. » *WIREs Data Mining and Knowledge
  Discovery*, 2(1), 86–97. DOI `10.1002/widm.53`. **Référence vérifiée**
  (liste de Wikipédia).
- **Histoire** : Johnson, S.C. (1967). « Hierarchical Clustering Schemes. »
  *Psychometrika*, 32(3), 241–254. **Vérifié sur Crossref**
  (DOI `10.1007/bf02289588`).

## 2. Ward (1963) — preuve de la proposition du cours

### 2.1 Références

- **Ward, J.H. (1963).** « Hierarchical Grouping to Optimize an Objective
  Function. » *Journal of the American Statistical Association*, 58(301),
  236–244. **Référence vérifiée** (de Amorim 2015, §1 ; page Wikipédia
  « Ward's method »).
- **de Amorim, R.C. (2015).** « Ward's hierarchical clustering method »
  (recherche de revue, PDF libre `repository.essex.ac.uk/20365/1/MW_Ward.pdf`,
  texte extrait). Confirme : la méthode de Ward fusionne **à chaque étape la
  paire qui minimise l'augmentation de la variance intra-clusters**
  (méthode gloutonne), avec la distance
  $d_W^2(S_i,S_j) = \frac{|S_i|\,|S_j|}{|S_i|+|S_j|}\, d(c_{S_i}, c_{S_j})$
  (distance entre centroïdes pondérée par les effectifs).

### 2.2 L'identité (preuve de la proposition énoncée dans le cours)

Pour un ensemble fini $S$, notons $I(S) = \sum_{x \in S} \|x - c_S\|^2$
l'inertie (SSE intra) de $S$, $c_S = \frac{1}{|S|}\sum_{x\in S} x$.

**Lemme (décomposition de l'inertie, « axe parallèle »).** Pour $A,B$
disjoints :
$I(A\cup B) = I(A) + I(B) + \frac{|A|\,|B|}{|A|+|B|}\,\|c_A - c_B\|^2.$

*Preuve* : $c_{A\cup B} = \frac{|A|c_A + |B|c_B}{|A|+|B|}$. Pour $x \in A$,
$x - c_{A\cup B} = (x - c_A) + (c_A - c_{A\cup B})$, et
$\sum_{x\in A} (x-c_A)\cdot(c_A - c_{A\cup B}) = (c_A - c_{A\cup B})\cdot
\sum_{x\in A}(x-c_A) = 0$ (orthogonalité), donc
$I(A) = \sum_{x\in A}\|x - c_{A\cup B}\|^2 - |A|\,\|c_A - c_{A\cup B}\|^2$
(attention au sens : $\sum_{x\in A}\|x - c_{A\cup B}\|^2 = I(A) +
|A|\,\|c_A - c_{A\cup B}\|^2$). De même pour $B$, et en sommant :
$I(A\cup B) = I(A) + I(B) + |A|\,\|c_A - c_{A\cup B}\|^2 +
|B|\,\|c_B - c_{A\cup B}\|^2$. Or
$c_A - c_{A\cup B} = \frac{|B|}{|A|+|B|}(c_A - c_B)$ et
$c_B - c_{A\cup B} = -\frac{|A|}{|A|+|B|}(c_A - c_B)$, donc
$|A|\,\|c_A - c_{A\cup B}\|^2 + |B|\,\|c_B - c_{A\cup B}\|^2 =
\frac{|A|\,|B|}{|A|+|B|}\,\|c_A - c_B\|^2$. ∎

**Corollaire (proposition du cours).** Fusionner $A$ et $B$ dans une
partition augmente la somme des inerties intra-clusters **exactement** de
$d_W^2(A,B) = \frac{|A|\,|B|}{|A|+|B|}\,\|c_A - c_B\|^2$ — la distance de
Ward. La fusion gloutonne de Ward choisit donc à chaque pas la paire qui
minimise cette augmentation. Comme l'inertie totale
$\sum_x \|x - c\|^2$ (avec $c$ la centroïde globale) est constante et
s'écrit $I_{\text{intra}} + I_{\text{inter}}$ (décomposition de l'inertie),
la perte d'inertie inter-classes est la même quantité : c'est la formulation
« gain de variance intra-classe / perte d'inertie inter-classes » de la
proposition du cours. **L'identité est également vérifiée telle quelle dans
le tableau de Wikipédia « Hierarchical clustering »** (entrée Ward, formule
MISSQ : $\frac{|A||B|}{|A\cup B|}\|\mu_A - \mu_B\|^2 =
\sum_{x\in A\cup B}\|x-\mu_{A\cup B}\|^2 - \sum_{x\in A}\|x-\mu_A\|^2 -
\sum_{x\in B}\|x-\mu_B\|^2$).

**Nuance à garder** : le pas de Ward est *glouton* — il minimise l'augmentation
à l'étape courante, sans optimalité globale sur la suite des fusions (de
Amorim 2015). C'est aussi vrai du single-linkage (qui n'a d'optimalité que
via la caractérisation MST, pas une minimisation d'objectif global).

## 3. Consistance de Hartigan

### 3.1 Le cadre (Hartigan 1975) — vérification partielle

- **Hartigan, J.A. (1975).** *Clustering Algorithms.* Wiley, New York.
- **Statut** : l'ouvrage existe sur archive.org (item
  `clusteringalgori0000hart`) mais est **emprunt-only** : le texte intégral
  n'est pas consultable, donc **les numéros exacts de théorèmes dans le livre
  sont UNVERIFIED**. Le *cadre* (et non les numéros) est vérifié par deux
  sources secondaires ayant lu le livre :
  - Chaudhuri & Dasgupta (2010), p. 2, Fig. 2, légende : « A probability
    density $f$, and the restriction of $C_f$ to a finite set of eight
    points. » où $C_f$ est l'arbre de clusters de la densité : les clusters
    denses au niveau $\lambda$ sont les composantes connexes de
    $\{x : f(x) \ge \lambda\}$, emboîtées quand $\lambda$ diminue.
  - Eldridge, Belkin & Wang (2015) (§3.1, « Density cluster tree ») : même
    définition.
- Le résultat de consistance de 1975 est l'ancêtre de celui de 1981 ; on
  cite 1975 pour le cadre et 1981 pour les énoncés précis (vérifiables par
  les deux sources secondaires ci-dessous).

### 3.2 Hartigan (1981) — énoncés exacts (vérifiés par citation)

- **Hartigan, J.A. (1981).** « Consistency of single linkage for
  high-density clusters. » *Journal of the American Statistical
  Association*, 76(374), 388–394. **Référence exacte vérifiée** (liste
  [5] de Chaudhuri & Dasgupta 2010 ; cf. aussi Eldridge et al. 2015).
- **Citations exactes** (Chaudhuri & Dasgupta 2010, p. 3) :
  - « Hartigan [5] has shown that it is **consistent in one dimension
    (d = 1)**. But he also demonstrates, by a lovely reduction to continuum
    percolation, that **this consistency fails in higher dimension d ≥ 2**.
    The problem is the requirement that $A \cap X_n \subset A_n$ : by the
    time the clusters are large enough that one of them contains all of $A$,
    there is a reasonable chance that this cluster will be so big as to also
    contain part of $A'$. »
  - **Consistance fractionnaire** (notion plus faible, introduite par
    Hartigan 1981) : « He then shows that single linkage has this weaker
    consistency property for any pair $A, A'$ for which the ratio of
    $\inf\{f(x) : x \in A \cup A'\}$ to $\sup\{\inf\{f(x) : x \in P\} :
    \text{paths } P \text{ from } A \text{ to } A'\}$ is sufficiently large.
    More recent work by Penrose [7] **closes the gap and shows fractional
    consistency whenever this ratio is > 1.** »
- **Penrose, M. (1995).** « Single linkage clustering and continuum
  percolation. » *Journal of Multivariate Analysis*, 53, 94–109.
  **Référence exacte vérifiée** (liste [7] de Chaudhuri & Dasgupta 2010).
  C'est lui qui relie formellement l'échec en $d \ge 2$ à la percolation de
  continuum.
- **Interprétation pour le panneau** : le défaut de chaînage (chaîne de
  paires proches reliant deux régions denses) n'est pas un artefact
  algorithmique : c'est *le* mécanisme qui fait échouer la consistance en
  $d \ge 2$ (le pont de faible densité entre deux hauts plateaux de densité
  est franchi par la connexité dès que le seuil $t$ le couvre).

### 3.3 Cas des deux populations — preuve élémentaire (notre construction)

C'est le cœur accessible du brief (question 2). **Il ne s'agit pas d'un
théorème cité mais d'un argument élémentaire que nous écrivons** (standard,
aucune source requise ; à présenter comme « le cas où la consistance est
triviale ») :

**Proposition (deux populations à support compact, bien séparées).** Soient
$P, Q \subset \mathbb{R}^d$ deux ensembles compacts avec
$\operatorname{dist}(P,Q) = \delta > 0$ et $D_{\max}$ un majorant des
distances intra-population (par ex. $D_{\max} = \mathrm{diam}(P) \vee
\mathrm{diam}(Q)$), et $X_1,\dots,X_n$ i.i.d. de loi de support inclus dans
$P \cup Q$. Pour tout seuil $t$ avec $D_{\max} < t < \delta$ : tout couple
intra-population est à distance $\le D_{\max} < t$ → chaque population
échantillonnée forme une **clique** de $G_t$ ; aucun couple
inter-population n'a de distance $< \delta$ → pas de borde entre $P$ et
$Q$. Les composantes de $G_t$ sont **exactement** les deux populations —
**déterministiquement, pour tout échantillon et toute taille $n$** ; aucune
concentration n'est nécessaire. Le dendrogramme de single-linkage a alors
pour dernière fusion la séparation $P \mid Q$ (niveau $\ge \delta > t$) :
couper le dendrogramme à tout niveau de $(D_{\max}, \delta)$ donne la vraie
partition.

**Mise en garde essentielle (support non borné) — vérifiée numériquement.**
La version « gaussiennes bien séparées » de cette proposition, avec un seuil
$t$ **fixé à l'avance**, est **fausse** en général : pour un échantillon de
$n$ points par blob gaussien d'écart-type $\sigma$ et de centre à distance
$\delta$, le plus grand diamètre intra-croît comme $O(\sigma\sqrt{\log n})$
et la plus petite distance inter-décroît comme $\delta -
O(\sigma\sqrt{\log n})$ : le *gap observé* $g_n =$ (min inter) − (max
intra) **se referme avec $n$**. Vérification numérique (script ad hoc,
paramètres du cours $generateBlobs(2, n)$ : $\sigma = 0{,}7$,
$\delta = 8$, 50 réplicas seedés par $n$, $n$ = points par blob) :

| $n$ (par blob) | 10 | 30 | 60 | 100 | 150 | 300 |
|---|---|---|---|---|---|---|
| $\mathbb{P}(g_n > 0)$ | 1,00 | 1,00 | 0,92 | 0,68 | 0,54 | **0,10** |
| max intra moyen | 2,93 | 3,53 | 3,90 | 4,19 | 4,37 | 4,72 |
| min inter moyen | 5,91 | 5,18 | 4,82 | 4,58 | 4,41 | 4,07 |

Le gap croise zéro vers $n \approx 100$–$150$ par blob : avec les
paramètres du cours, **aucun seuil ne sépare les deux blobs en single-linkage
dès $n \approx 300$** — les queues gaussiennes font le pont (chaînage).
Avec des disques de rayon $1$ à distance $6$ (support compact), en revanche,
$\mathbb{P}(g_n > 0) = 1$ pour tous $n \in \{10, \dots, 600\}$ (max intra
→ $2$, min inter → $4$) : la proposition compacte tient, comme annoncé.

**Lien avec Hartigan.** La proposition compacte est un cas particulier
(trivial) du cadre de Hartigan 1975 : la région $\{f \ge \lambda\}$ de
niveau $\lambda$ intermédiaire a exactement deux composantes, et tout
échantillon y est fidèle. Pour les mélanges gaussiens, les régions denses ne
sont pas séparées par un vide (la densité du mélange ne s'annule jamais),
c'est le *niveau de densité* $\lambda^*$ — pas une distance $t$ — qui indexe
la scission vraie, et la consistance (Hartigan 1981) est un énoncé sur la
**convergence du dendrogramme entier** vers l'arbre de clusters de la
densité, avec un seuil d'échantillon dépendant de $n$ — pas sur une coupe à
$t$ fixe. C'est précisément ce qui devient non trivial (et qui échoue en
$d \ge 2$ par percolation, Penrose 1995) : les queues/cols de densité
positive font le pont, exactement comme l'observent nos simulations.

### 3.4 Extensions robustes (contexte, une phrase dans le panneau)

- **Wishart, D. (1969).** « Mode analysis: a generalization of nearest
  neighbor which reduces chaining effects. » *Proceedings of the Colloquium
  on Numerical Taxonomy*, University of St Andrews, pp. 282–308.
  **Référence exacte vérifiée** (liste [13] de Chaudhuri & Dasgupta 2010).
  Version robuste (on ne connecte un point que s'il a $\ge k$ voisins à
  distance $\le r$) ; « Wishart does not provide a proof of convergence »
  (Chaudhuri & Dasgupta 2010, citation exacte).
- **Chaudhuri & Dasgupta (2010)** (même PDF que §1.2) : robust single
  linkage (paramètres $k, \alpha$) — **consistant**, c'est leur résultat
  principal (théorèmes du §4 du papier, PDF lu en intégral).
- **Stuetzle & Nugent (2010)** : schéma top-down, « The consistency of this
  method has not yet been established » (Chaudhuri & Dasgupta 2010).

## 4. Pourquoi complete/average n'ont pas de caractérisation comparable

- **Aucune identité de type MST** pour le lien complet ou le lien moyen dans
  les sources consultées (Chaudhuri & Dasgupta 2010 ; Eldridge et al. 2015 ;
  Murtagh & Contreras 2012 — référence non lue en intégral ; de Amorim 2015 ;
  Wikipédia). C'est une **absence vérifiée dans le corpus consulté**, pas une
  impossibilité mathématique universelle : on la formulera ainsi.
- **Caractérisation d'unicité (single-linkage seul)** : Carlsson, G.,
  Mémoli, F. (2010). « Characterization, stability and convergence of
  hierarchical clustering methods. » *Journal of Machine Learning Research*,
  11, 1425–1470. **Référence exacte vérifiée** (bibliographie d'Eldridge et
  al. 2015) ; citation exacte (Eldridge et al. 2015, §1) : « Carlsson and
  Mémoli (2010) introduced functoriality as one of three axioms related to
  Kleinberg's and showed that **single linkage agglomerative clustering is
  the only method which simultaneously satisfies each**. »
- **Kleinberg (2003)** : impossibilité — trois axiomes intuitifs (diversity,
  separation, stability) ne peuvent être satisfaits par aucune méthode
  (cité dans Eldridge et al. 2015, §1 ; le papier original n'a pas été lu —
  on cite via cette source, formulation standard).
- **Comportements** (Wikipédia « Hierarchical clustering », consulté) :
  - lien complet : « less susceptible to noise and outliers than single
    linkage. However, complete linkage is biased toward producing globular
    clusters of similar size and may incorrectly break apart large or
    irregularly shaped clusters. » → anti-chaining, biais globulaire.
  - lien moyen (UPGMA) : « a compromise between the extremes of single and
    complete linkage. Average linkage is more robust to noise than single
    linkage but, like complete linkage, it tends to be biased toward
    detecting globular clusters. »
- **von Luxburg (2007)** (« A tutorial on spectral clustering »,
  arXiv:0711.0189, PDF lu) : le MST n'y sert qu'au **calage du paramètre
  $\varepsilon$** du graphe de $\varepsilon$-voisins ; **aucun** théorème de
  consistance hiérarchique y figure. Utilisable uniquement pour le contraste
  « le MST apparaît aussi en spectral, mais pour caler un paramètre, pas
  pour la consistance ».

## 5. Ce qui est UNVERIFIED (ne pas affirmer tel quel)

1. **Numéros de théorèmes dans Hartigan (1975)** : UNVERIFIED (livre
   emprunt-only sur archive.org). Citer l'ouvrage pour le cadre, 1981 pour
   les énoncés.
2. **Abstract de Gower & Ross (1969)** : inaccessible (JSTOR). L'équivalence
   repose sur (a) Chaudhuri & Dasgupta 2010, (b) Wikipédia, (c) la preuve
   élémentaire §1.3 — triple ancrage, acceptable.
3. **Bornes exactes de SLINK dans le texte original de Sibson (1973)** :
   non lues (payant) ; on n'affirme que $O(n^2)$ temps (revues + titre
   « optimally efficient »).
4. **Kleinberg (2003)** : non lu en intégral ; citation via Eldridge et al.
   2015 uniquement.
5. **Murtagh & Contreras (2012)** : référence vérifiée, intégrale non lue ;
   sert de point d'entrée (revue d'ensemble) sans citation d'affirmation.

## 6. Bibliographie complète (toutes les références ci-dessus)

1. Chaudhuri, K., Dasgupta, S. (2010). Rates of convergence for the cluster
   tree. *NeurIPS 2010*. https://proceedings.neurips.cc/paper/2010/file/b534ba68236ba543ae44b22bd110a1d6-Paper.pdf
2. de Amorim, R.C. (2015). Ward's hierarchical clustering method.
   https://repository.essex.ac.uk/20365/1/MW_Ward.pdf
3. Eldridge, E., Belkin, M., Wang, Y. (2015). Beyond Hartigan consistency.
   arXiv:1506.06422.
4. Gower, J.C., Ross, M.A. (1969). Minimum Spanning Trees and Single Linkage
   Cluster Analysis. *JRSS-C* 18(1):54–64. DOI 10.2307/2346439.
5. Hartigan, J.A. (1975). *Clustering Algorithms*. Wiley.
6. Hartigan, J.A. (1981). Consistency of single linkage for high-density
   clusters. *JASA* 76(374):388–394.
7. Johnson, S.C. (1967). Hierarchical Clustering Schemes. *Psychometrika*
   32(3):241–254. DOI 10.1007/bf02289588.
8. Lance, W.G., Williams, W.H. (1966). A General Theory of Classificatory
   Sorting Strategies: 1. Hierarchical Systems. *The Computer Journal*
   9(4):373–380.
9. Lance, W.G. (1967). A General Theory of Classificatory Sorting Strategies:
   II. Clustering. *The Computer Journal* 10(3):271–277.
10. Defays, D. (1977). An efficient algorithm for a complete-link method.
    *The Computer Journal* 20(4):364–366. DOI 10.1093/comjnl/20.4.364.
11. Sibson, R. (1973). SLINK: an optimally efficient algorithm for the
    single-link cluster method. *The Computer Journal* 16(1):30–34.
    DOI 10.1093/comjnl/16.1.30.
12. Murtagh, F., Contreras, P. (2012). Algorithms for hierarchical
    clustering: an overview. *WIREs Data Mining and Knowledge Discovery*
    2(1):86–97. DOI 10.1002/widm.53.
13. Penrose, M. (1995). Single linkage clustering and continuum percolation.
    *J. Multivariate Analysis* 53:94–109.
14. Ward, J.H. (1963). Hierarchical Grouping to Optimize an Objective
    Function. *JASA* 58(301):236–244.
15. Wishart, D. (1969). Mode analysis: a generalization of nearest neighbor
    which reduces chaining effects. *Proc. Colloquium on Numerical Taxonomy*,
    St Andrews, 282–308.
16. Carlsson, G., Mémoli, F. (2010). Characterization, stability and
    convergence of hierarchical clustering methods. *JMLR* 11:1425–1470.
17. von Luxburg, U. (2007). A tutorial on spectral clustering. *Statistics
    and Computing* 17(2):229–261. arXiv:0711.0189.

## 7. Notes pour le brouillon

- **Ancrage** : après le Callout Ward (ligne ~772 de
  `src/routes/part3/lesson1/+page.svelte`), avant l'`InteractiveSection 1.4`
  (ligne ~774). Le brief dit `anchor: distance-clusters` mais le vrai h2 est
  `liaisons` — on ne modifie pas le brief, on greffe après le bloc Ward qui
  est le dernier bloc du h2 « Liaisons entre clusters ».
- **Numérotation** : la leçon n'a pas de blocs numérotés → **aucun numéro**
  (précédent SVM KKT).
- **Pas de callout « au-delà du cours »** visible (règle AGENTS.md +
  précédent `svm-dualite-kkt.draft.md`) : le panneau se présente comme le
  contenu propre du site ; le cadrage interne vit dans les commentaires de
  code et dans ce fichier.
- **La proposition Ward est DANS le cours** : le panneau ne la « découvre »
  pas, il la **prouve** (lemme de l'axe parallèle) et précise la nuance
  glouton/monde. C'est du renforcement du cours, pas de l'extension.
- **Formules** : KaTeX, sûres dans `String.raw` (pas de backticks, pas de
  `${`) ; convention du dépôt (transposes en `\top` si besoin).
- **Démo proposée** : `SingleLinkageMstExplorer` — (a) nuage de points +
  MST surchargé, (b) préréglage « chaînage » (deux amas + file d'attente de
  points), (c) courbe de récupération de la vraie partition (deux
  populations) en fonction de $n$, montrant le $P(\text{erreur}) \to 0$.
