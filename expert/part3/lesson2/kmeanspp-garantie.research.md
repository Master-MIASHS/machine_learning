# k-means++ : une initialisation avec garantie — rapport de recherche

Brief : `expert/part3/lesson2/kmeanspp-garantie.md` (id `p3-l2-kmeanspp-garantie`)
Leçon cible : `src/routes/part3/lesson2/+page.svelte`
Frontière du cours : `course_sources/marine/Cours/CM/coursClassif-5-Clustering.tex`,
section « Les K-moyennes » (frames « Algorithme de Lloyd » l. 939–956 — k-means++ y est
**cité par le nom seulement**, sans définition ; « Répétition de la procédure » l. 1008–1035 —
proposition de monotonie + minima locaux + redémarrages).

Méthode : chaque affirmation ci-dessous a été lue dans la source primaire (PDF téléchargé et
extraits textuels conservés en local) ; les citations sont littérales quand marquées par des
guillemets. Les éléments non vérifiables sont marqués **UNVERIFIED**.

## Corrections apportées au brief

| Brief | Vérification |
|---|---|
| « Arthur & Vassilvitskii 2007, SOCC / Algorithmica 2007 » | La version vérifiée est **SODA 2007** (18th Annual ACM-SIAM Symposium on Discrete Algorithms, New Orleans, pp. 1027–1035). Aucune version « SOCC » trouvée. La version journal *Algorithmica* n'a pas été consultée (UNVERIFIED quant aux détails bibliographiques ; le SODA suffit comme source primaire). |
| « E[cost] ≤ 8 ln k · OPT » | L'énoncé exact est **E[φ] ≤ 8(ln k + 2)·φ_OPT** (Théorème 3.1, cf. Q3). « 8 ln k » est un raccourci asymptotique, pas l'énoncé. |
| Q1 « pire cas exponentiel en k / nombre de minima locaux » | **UNVERIFIED** — aucune telle affirmation dans A&V 2007. L'affirmation vérifiée est plus forte et différente : le ratio φ/φ_OPT de l'initialisation uniforme est **non borné** (même n et k fixés), avec haute probabilité, sur des instances « naturelles » (Q1). Le brouillon n'utilise que la version vérifiée. |
| Q5 « k-means\|\|, Drineas et al. 2014 (PDW) » | Le k-means\|\| a été **introduit** dans Bahmani, Moseley, Vattani, Kumar & Vassilvitskii, « Scalable K-Means++ », PVLDB 5(7) 2012, pp. 622–627 (PDF vérifié). L'article « k-means\|\|: A Fast Distributed Algorithm for Designing Large-scale K-means Clustering Systems », Drineas–Mairal–Schmidt, IEEE ICDM Workshops 2014, **n'a pas pu être vérifié** depuis une source primaire accessible (**UNVERIFIED**) ; le brouillon cite uniquement la référence PVLDB 2012 vérifiée. |
| « Elkan 2003 — bornes de convergence » | Elkan 2003 (ICML) est une **accélération** par inégalité triangulaire (« always computing exactly the same result as the standard algorithm ») — aucune borne d'approximation ni de vitesse de convergence nouvelle dans l'abstract vérifié. La Q4 est couverte sans Elkan (cf. Q4). |

---

## Q1 — Pourquoi l'initialisation aléatoire naïve est mauvaise

**Affirmation vérifiée** (Arthur & Vassilvitskii, SODA 2007, abstract) :

> « The k-means method is a widely used clustering technique that seeks to minimize the
> average squared distance between points in the same cluster. Although it offers no accuracy
> guarantees, its simplicity and speed are very appealing in practice. »

> « There are many natural examples for which the algorithm generates arbitrarily bad
> clusterings (i.e., **φ/φ_OPT is unbounded even when n and k are fixed**). Furthermore, these
> examples do not rely on an adversarial placement of the starting centers, and the ratio can be
> **unbounded with high probability** even with the standard randomized seeding technique. »

**Affirmation vérifiée** (ibid., §6.3, sur le jeu de données synthétique Norm25 à 25 gaussiennes
bien séparées) :

> « Even though there is an "obvious" clustering, the uniform seeding will **inevitably merge
> some of these clusters, and the local search will never be able to split them apart** (see
> [12] for further discussion of this phenomenon). The careful seeding method of k-means++
> avoided this problem altogether, and it almost always attained the optimal clustering on the
> synthetic dataset. »

([12] = Guha, Meyerson, Mishra, Motwani, O'Callaghan, « Clustering data streams: Theory and
practice », IEEE TKDE 15(3), 2003 — cité dans la bibliographie de A&V 2007 ; non relu pour ce
point.)

- Le mécanisme : sur des clusters bien séparés, un tirage uniforme met plusieurs centres de
  départ dans le même cluster ; Lloyd ne peut ensuite que fusionner des clusters, jamais les
  séparer (monotonie du coût + structure de Voronoï).
- **UNVERIFIED** : l'expression « pire cas exponentiel en k / nombre de minima locaux » du
  brief. Aucune source primaire vérifiée ici ne porte cette forme exacte (il existe dans la
  littérature des résultats sur le nombre de minima locaux, mais ils n'ont pas pu être vérifiés
  dans cette session). Le brouillon n'en fait pas usage.
- À noter (contexte, déjà dans la leçon en « au-delà du cours ») : A&V 2007 §1 cite aussi que
  le problème exact est NP-difficile « even with just two clusters » [10 = Drineas, Frieze,
  Kannan, Vempala, Vinay, Mach. Learn. 56(1–3), 2004].

## Q2 — Algorithme k-means++ (définition exacte)

**Source** : Arthur & Vassilvitskii, SODA 2007, §2.2 « The k-means++ algorithm ». Citation
littérale de l'algorithme :

> « 1a. Choose an initial center c₁ uniformly at random from X.
> 1b. Choose the next center cᵢ, selecting cᵢ = x′ ∈ X with probability D(x′)² / Σ_{x∈X} D(x)².
> 1c. Repeat Step 1b until we have chosen a total of k centers.
> 2–4. Proceed as with the standard k-means algorithm.
> We call the weighting used in Step 1b simply "D² weighting". »

où, en tout point du processus, **D(x) est la distance du point de données x au centre déjà
choisi le plus proche** (défini juste avant l'algorithme : « let D(x) denote the shortest
distance from a data point x to the closest center we have already chosen »).

- Le premier centre est tiré **uniformément parmi les points de données** X (pas dans l'espace).
- Chaque centre suivant est tiré **parmi les points de données**, avec probabilité proportionnelle
  au **carré** de la distance au centre le plus proche déjà choisi.
- Puis l'algorithme de Lloyd standard (étapes 2–4 de la leçon) est lancé depuis ces k centres.
- Complexité du seeding : k−1 passes sur les données pour mettre à jour tous les D(x), soit
  O(nk) calculs de distances, i.e. O(nkd) — du même ordre qu'une itération de Lloyd (cf. la
  leçon, O(ndKt) pour t itérations).

## Q3 — Théorème principal : énoncé exact, constante, structure de la preuve

**Source** : Arthur & Vassilvitskii, SODA 2007. L'énoncé apparaît deux fois, identique :

- Abstract, **Théorème 1.1** : « For any set of data points, **E[φ] ≤ 8(ln k + 2)·φ_OPT** ».
- **Théorème 3.1** (résultat principal, §3) : « If C is constructed with k-means++, then the
  corresponding potential function φ satisfies **E[φ] ≤ 8(ln k + 2)·φ_OPT** ».

**Portée exacte** (citation littérale, §3, juste après le Théorème 3.1) :

> « In fact, we prove this holds **after only Step 1 of the algorithm above**. Steps 2 through 4
> can then only decrease φ. Not surprisingly, our experiments show this local optimization is
> important in practice, although it is difficult to quantify this theoretically. »

C'est-à-dire : la borne s'applique au **coût du seul seeding** (avant Lloyd) ; l'espérance est
sur les tirages du seeding ; la borne est **pire cas sur toutes les instances** (aucune
hypothèse sur les données). La borne se transporte au coût final après Lloyd par monotonie
(cf. Q4).

**Structure de la preuve** (§3) — vérifiée dans le texte :

1. **Lemme 3.1** (premier centre, tirage uniforme) : « Let A be an arbitrary cluster in C_OPT,
   and let C be the clustering with just one center, which is chosen uniformly at random from A.
   Then, **E[φ(A)] = 2φ_OPT(A)** ». Preuve par décomposition de la variance autour du centroïde
   (identité du Lemme 2.1 : Σ‖x−z‖² = Σ‖x−c(S)‖² + |S|·‖c(S)−z‖²) — le centre optimal du
   cluster est son centroïde, et le tirage uniforme y ajoute la variance.
2. **Lemme 3.2** (centre tiré avec pondération D² dans un cluster optimal) : « If we add a
   random center to C from A, chosen with D² weighting, then **E[φ(A)] ≤ 8φ_OPT(A)** ».
   Preuve : inégalité triangulaire D(a₀) ≤ D(a) + ‖a−a₀‖, puis inégalité des puissances
   (cas m = 2 de la power-mean inequality, conséquence de Cauchy–Schwarz), et les deux
   majorations min(D(a), ‖a−a₀‖)² ≤ ‖a−a₀‖² et ≤ D(a)².
3. **Lemme 3.3** (récurrence sur t centres ajoutés et u clusters de C_OPT encore « non couverts ») :
   l'espérance du potentiel est bornée par une expression faisant intervenir la **somme
   harmonique H_t = 1 + 1/2 + ⋯ + 1/t** ; le facteur 8 du Lemme 3.2 s'accumule sur les clusters
   non couverts.
4. **Preuve du Théorème 3.1** : application du Lemme 3.3 avec t = u = k−1 après le premier
   centre (qui couvre un cluster A, borné par le Lemme 3.1), et **H_{k−1} ≤ 1 + ln k**. C'est la
   somme harmonique qui produit le ln k.

**Borne inférieure / optimalité de l'ordre** (§4, vérifié) :

> « In this section, we show that the D² seeding used is, by k-means++, no better than Ω(log k)-
> competitive in expectation, thereby proving Theorem 3.1 is tight within a constant factor. »

**Théorème 4.1** : « D² seeding is no better than 2(ln k)-competitive. » Construction : k
clusters de n/k points disposés en simplexes réguliers, très séparés (∆ ≫ δ), n ≫ k. L'ordre
**ln k est donc optimal à un facteur constant près**.

**Amélioration récente de la constante** (vérifié) : Makarychev, Reddy & Shan, « Improved
Guarantees for k-means++ and k-means++ Parallel », NeurIPS 2020 :

> « First, we show that the expected cost of the solution output by k-means++ is at most
> **5(ln k + 2)** times the optimal solution's cost. This improves upon the bound of 8(ln k + 2)
> shown by Arthur and Vassilvitskii (2007) » (analyse raffinée du Lemme 3.2 de A&V ; borne
> inférieure correspondante). L'ordre ln k est inchangé.

**Résultat complémentaire sous séparation** (vérifié, A&V 2007 §1) :

> « This complements a very recent result of Ostrovsky et al. [24], who independently proposed
> much the same algorithm. Whereas they showed this randomized seeding is **O(1)-competitive on
> data sets following a certain separation condition**, we show it is O(log k)-competitive on
> all data sets. »

Condition de séparation (ibid. §1.1) : k-means++ est O(1)-compétitif si
**φ_OPT,k / φ_OPT,k−1 ≤ ε²** (« if this condition does not hold, then the data is not well
suited for clustering with the given value for k »). [24] = Ostrovsky, Rabani, Schulman, Swamy,
« The effectiveness of Lloyd-type methods for the k-means problem », FOCS 2006.

**Autres éléments vérifiés** :
- Généralisation (Théorème 5.1) : avec échantillonnage D^ℓ, E[φ^[ℓ]] ≤ 2^{2ℓ}(ln k + 2)·φ_OPT^[ℓ]
  (cas ℓ = 1 : k-médianne). Non utilisé dans le brouillon (hors périmètre).
- §7 : « if k-means++ is run 2^k times, our arguments can be modified to show it is likely to
  achieve a constant approximation at least once ».
- §6.2–6.3 (expériences) : k-means++ bat k-means aléatoire sur le potentiel (jusqu'à 20 à 1000
  fois sur Spam et Intrusion) et est 2 à 3 fois plus rapide par essai (moins d'itérations de
  Lloyd) ; sur Norm25 « it almost always attained the optimal clustering ».

## Q4 — Lloyd après k-means++ affine la solution

- **Déjà dans le cours** (proposition de la leçon, lemme 22.1 de Shalev-Shwartz & Ben-David,
  *Understanding Machine Learning*) : l'inertie intra-classes diminue à chaque itération de
  Lloyd. C'est le fait utilisé ici.
- **A&V 2007, §3** (citation littérale, cf. Q3) : la borne 8(ln k + 2) tient **après l'étape 1
  seule** ; « Steps 2 through 4 can then only decrease φ ». Conséquence immédiate : si C_seed
  est le seeding et C* la partition finale après Lloyd, φ(C*) ≤ φ(C_seed), donc
  **E[φ(C*)] ≤ 8(ln k + 2)·φ_OPT** — la garantie se transporte au coût final.
- Avertissement fidèle : la théorie **ne quantifie pas** le raffinement par Lloyd (« it is
  difficult to quantify this theoretically », A&V 2007 §3) — le raffinement est essentiel en
  pratique (§6) mais non borné par le théorème.
- Elkan 2003 (ICML, « Using the Triangle Inequality to Accelerate k-Means ») : vérifié par
  l'abstract — accélération par bornes inférieures/supérieures issues de l'inégalité
  triangulaire, « always computing exactly the same result as the standard algorithm ».
  **UNVERIFIED** quant à une quelconque « borne de convergence » (l'abstract n'en mentionne
  aucune) ; l'article n'est pas nécessaire au panneau.

## Q5 — Redémarrages vs k-means++ ; k-means||

**Redémarrages** (heuristique, leçon) : aucun des résultats vérifiés ci-dessus ne fournit de
garantie pire cas sur « le meilleur de R redémarrages aléatoires » ; l'abstract de A&V 2007
rappelle que le ratio de l'initialisation uniforme est non borné avec haute probabilité. Le
§7 de A&V 2007 donne en revanche une garantie en nombre d'essais pour k-means++ lui-même
(exécuté 2^k fois ⇒ approximation constante au moins une fois, avec haute probabilité).

**k-means||** (source primaire vérifiée : Bahmani, Moseley, Vattani, Kumar, Vassilvitskii,
« Scalable K-Means++ », *Proceedings of the VLDB Endowment* 5(7), 2012, pp. 622–627,
arXiv:1203.6402 — PDF lu) :

- Motivation (abstract, citation littérale) : « A major downside of the k-means++ is its
  inherent sequential nature, which limits its applicability to massive data: one must make k
  passes over the data to find a good initial set of centers. »
- Algorithme (Algorithm 2 de l'article) : 1 centre initial uniforme ; puis **O(log ψ) tours**
  (ψ = coût après le premier centre, ψ ≤ n²∆²), où chaque tour échantillonne **chaque point x
  indépendamment avec probabilité ℓ·d²(x,C)/φ_X(C)** — « the expected number of points chosen
  in each iteration is ℓ » (ℓ = Θ(k)) ; enfin les candidats sont **pondérés** (w_x = nombre de
  points de X plus proches de x que de tout autre candidat) et **re-clusterisés en k centres**
  (étape 8) avec un algorithme d'approximation (par ex. k-means++).
  - Interpolation (ibid. §5.3) : « when r = 0 … simulating the Random initialization, and when
    r = k, the algorithm updates the probability distribution at every step, simulating
    k-means++ ».
- **Théorème 1** (citation littérale) : « If an α-approximation algorithm is used in Step 8,
  then Algorithm k-means|| obtains a solution that is an **O(α)-approximation** to k-means.
  Thus, if k-means++ initialization is used in Step 8, then k-means|| is an **O(log k)-
  approximation** » (en espérance).
- **Théorème 2** : « Let α = exp(−(1−e^{−ℓ/(2k)})) ≈ e^{−ℓ/(2k)}. If C is the set of centers
  at the beginning of an iteration of Algorithm 2 and C⁰ is the random set of centers added in
  that iteration, then **E[φ_X(C ∪ C⁰)] ≤ 8φ* + ((1+α)/2)·φ_X(C)** » — le coût décroît d'un
  facteur constant plus O(φ*) à chaque tour ; Corollaire 3 : E[φ^(i)] ≤ ((1+α)/2)^i·ψ +
  16/(1−α)·φ* (décroissance géométrique ⇒ O(log ψ) tours).
- Abstract (citation littérale) : « We prove that our proposed initialization algorithm
  k-means|| obtains a nearly optimal solution after a logarithmic number of passes, and then
  show that **in practice a constant number of passes suffices**. Experimental evaluation on
  real-world large-scale data demonstrates that k-means|| outperforms k-means++ in both
  sequential and parallel settings. »
- Analyse ultérieure (vérifiée, secondaire) : Rozhon, « Simple and Sharp Analysis of k-means|| »,
  ICML 2020 (arXiv:2003.02518) — borne en nombre de tours améliorée à
  O(log ψ / log log ψ), montrée optimale ; confirme que le k-means|| de PVLDB 2012 est
  « a distributed variant of the k-means++ algorithm (Arthur and Vassilvitskii, SODA 2007) ».
- **UNVERIFIED** : Drineas, Mairal, Schmidt, « k-means||: A Fast Distributed Algorithm for
  Designing Large-scale K-means Clustering Systems », IEEE ICDM Workshops (PDW) 2014 — cité
  dans le brief mais non vérifiable depuis une source primaire accessible dans cette session.
  Le brouillon cite uniquement PVLDB 2012.

## Références complètes (pour la Bibliographie de la page)

1. Arthur, D., Vassilvitskii, S. (2007). « k-means++: The Advantages of Careful Seeding ».
   In SODA '07: Proceedings of the Eighteenth Annual ACM-SIAM Symposium on Discrete Algorithms,
   New Orleans, LA, pp. 1027–1035.
   PDF : https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf (source utilisée).
2. Bahmani, B., Moseley, B., Vattani, A., Kumar, R., Vassilvitskii, S. (2012). « Scalable
   K-Means++ ». In Proceedings of the VLDB Endowment, 5(7), pp. 622–627 (VLDB 2012, Istanbul).
   PDF : https://www.vldb.org/pvldb/vol5/p622_bahmanbahmani_vldb2012.pdf (source utilisée) ;
   arXiv:1203.6402.
3. Makarychev, K., Reddy, A., Shan, L. (2020). « Improved Guarantees for k-means++ and
   k-means++ Parallel ». In NeurIPS 2020, Vancouver.
   PDF : https://proceedings.neurips.cc/paper/2020/file/ba304f3809ed31d0ad97b5a2b5df2a39-Paper.pdf
   (source utilisée).
4. Ostrovsky, R., Rabani, Y., Schulman, L., Swamy, C. (2006). « The Effectiveness of Lloyd-type
   Methods for the k-means Problem ». In FOCS '06: Proceedings of the 47th Annual IEEE
   Symposium on Foundations of Computer Science. (Cité via la référence [24] de A&V 2007 ;
   non relu directement — l'énoncé utilisé (O(1) sous φ_OPT,k/φ_OPT,k−1 ≤ ε²) est cité de A&V
   2007 §1.1, qui en est le relais fidèle. Pas de lien gratuit fiable identifié.)

Contexte (déjà cités dans la leçon) : Lloyd, S. P. (1982). « Least Squares Quantization in
PCM ». IEEE Trans. Inf. Theory 28(2), 129–136 (réf. [20] de A&V 2007) ; Shalev-Shwartz &
Ben-David, *Understanding Machine Learning* (lemme 22.1, déjà en bibliographie de la page).

## Checklist du brief

- [x] Every theorem/proof step checked against a primary source (not memory) — A&V SODA 2007
  lu en intégralité (extraction texte du PDF) ; Scalable K-Means++ PVLDB 2012 lu (algorithme +
  Théorèmes 1–2 + Corollaire 3) ; Makarychev et al. NeurIPS 2020 lu (abstract + §1).
- [x] No beyond-course claim presented as course content — tout le panneau est au-delà du
  cours (k-means++ n'est que nommé dans le .tex) ; seul le pont (proposition de monotonie,
  redémarrages) renvoie à la leçon.
- [x] All references complete (author, year, venue, link) — sauf Ostrovsky 2006 (pas de lien
  gratuit fiable) et Drineas 2014 (UNVERIFIED, exclu du brouillon).
- [x] All formulas valid KaTeX and String.raw-safe — vérifiées dans le brouillon.
- [x] course_sources/ file + section cited for the course boundary — cf. en-tête.
- [x] French draft reads at M2/research level — cf. `kmeanspp-garantie.draft.md`.
