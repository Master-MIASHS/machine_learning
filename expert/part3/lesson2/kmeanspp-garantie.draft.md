# Brouillon — panneau expert « k-means++ : une initialisation avec garantie »

Cible : `src/routes/part3/lesson2/+page.svelte`, `ExpertPanel` inséré **après l'InteractiveSection
2.2** (fin de la section « Convergence et minima locaux »), **avant `<h2 id="choix-k">`**.
TOC inchangé (le panneau est masqué hors mode expert ; il vit dans la section « convergence »).

> **Marqueurs internes « au-delà du cours »** (non visibles — le badge « Expert » porte le
> cadrage, conformément à AGENTS.md) : TOUT le contenu de ce panneau est au-delà de
> `course_sources/`. Le fichier `coursClassif-5-Clustering.tex` ne mentionne k-means++ que par le
> nom, dans la frame « Algorithme de Lloyd » (l. 943 : « algorithme K-means++ (mais ça pourrait
> être aussi des points choisis aléatoirement dans l'espace) »), sans définition ni théorie. Seuls
> la proposition de monotonie (lemme 22.1, UML) et les redémarrages (frame « Répétition de la
> procédure », l. 1008–1035) relèvent de la leçon — renvoyés par référence croisée au contenu affiché.

## Contenu du panneau

### Introduction

La section précédente propose le remède standard aux minima locaux : redémarrer la procédure
plusieurs fois avec différentes initialisations aléatoires et garder la meilleure partition.
C'est une heuristique pure : aucune garantie ne vient à la qualité de la solution finale, et
l'initialisation aléatoire uniforme elle-même peut être arbitrairement mauvaise. Arthur &
Vassilvitskii (2007) construisent des instances « naturelles » — sans placement adverse des
centres de départ — sur lesquelles le ratio `<KaTeX: φ/φ_OPT>` du résultat de Lloyd est
**non borné, même quand n et k sont fixes**, et ce **avec haute probabilité** : sur des
clusters bien séparés, le tirage uniforme met inévitablement plusieurs centres de départ dans
le même nuage, et la recherche locale de Lloyd ne fait que fusionner des nuages — elle ne peut
jamais les séparer.

La question est donc : peut-on choisir les centres de départ de façon à garantir, dès
l'initialisation, un majorant du coût ? Oui : **k-means++** (Arthur & Vassilvitskii 2007)
tire les centres proportionnellement au **carré** de la distance au centre le plus proche déjà
choisi (échantillonnage D²), et obtient une garantie d'approximation pire cas en espérance,
de l'ordre de `<KaTeX: \ln k>`.

### DefinitionBlock `2.2.1.bis` — « Échantillonnage D² (k-means++) »

Soit `<KaTeX: X = \{x_1, \dots, x_n\} \subset \mathbb R^d>`, un nombre de centres `<KaTeX: k>`,
et le **potentiel** (coût) d'un ensemble `<KaTeX: C>` de centres :

```
<KatexBlock> \phi(C) = \sum_{x \in X} \min_{c \in C} \| x - c \|^2 </KatexBlock>
```

avec `<KaTeX: \varphi_{\mathrm{OPT}} = \min_{|C| = k} \phi(C)>` le coût optimal.

**Algorithme k-means++** (Arthur–Vassilvitskii 2007, §2.2) :

1. tirer le premier centre `<KaTeX: c_1>` **uniformément au hasard dans X** ;
2. pour `<KaTeX: i = 2, \dots, k>`, soit
   `<KaTeX: D(x) = \min_{c \in C_{i-1}} \| x - c \|>` la distance de `<KaTeX: x>` au centre déjà
   choisi le plus proche ; tirer `<KaTeX: c_i = x' \in X>` avec probabilité

   ```
   <KatexBlock> p(x') = \dfrac{D(x')^2}{\sum_{x \in X} D(x)^2} </KatexBlock>
   ```

3. lancer ensuite l'algorithme de Lloyd (leçon) depuis ces k centres.

La pondération D²/ΣD² est appelée « D² weighting ». La phase de seeding fait k − 1 passes sur
les données (mise à jour de tous les `<KaTeX: D(x)>` à chaque étape) : son coût `<KaTeX: O(nkd)>`
est du même ordre de grandeur qu'une itération de Lloyd (complexité `<KaTeX: O(ndKt)>` de la
leçon, pour t itérations). La leçon a déjà nommé cette initialisation à l'étape 1 de Lloyd
(« algorithme K-means++ », dans le but de disperser les centroïdes) ; c'est ici sa définition
exacte.

### TheoremBlock `2.2.2.bis` — « Théorème (Arthur & Vassilvitskii, SODA 2007) »

Si `<KaTeX: C>` est l'ensemble des k centres produits par la phase de seeding de k-means++, alors

```
<KatexBlock> \mathbb E[\phi(C)] \le 8(\ln k + 2) \cdot \varphi_{\mathrm{OPT}} </KatexBlock>
```

(Théorème 3.1 de l'article ; la même borne est annoncée dans l'abstract, Théorème 1.1).

- L'espérance est prise sur les tirages du seeding ; la borne est **pire cas sur toutes les
  instances** — aucune hypothèse sur la répartition des données.
- La borne est démontrée **sur le seeding seul** : les itérations de Lloyd ne peuvent ensuite
  que diminuer `<KaTeX: \phi>` (Proposition 2.2.3.bis).
- C'est une borne **en espérance** : un tirage isolé peut être mauvais ; c'est la moyenne sur
  les tirages du seeding qui est majorée.

**Idée de la démonstration** (A&V 2007, §3). On décompose le coût sur les clusters
`<KaTeX: A>` d'une partition optimale `<KaTeX: C_{\mathrm{OPT}}>`, et on borne l'espérance du
coût de chaque cluster selon la façon dont les centres sont tirés :

1. **Lemme 3.1 — premier centre (tirage uniforme).** Si l'unique centre est tiré uniformément
   dans un cluster optimal `<KaTeX: A>`, alors
   `<KaTeX: \mathbb E[\varphi(A)] = 2\,\varphi_{\mathrm{OPT}}(A)>` : c'est la décomposition de la
   variance autour du centroïde — tirer un point au hasard plutôt que le centroïde (qui est le
   centre optimal du cluster) ajoute exactement la variance du cluster.
2. **Lemme 3.2 — centre tiré avec pondération D².** Si l'on ajoute à un clustering quelconque
   un centre tiré de `<KaTeX: A>` avec pondération D², alors
   `<KaTeX: \mathbb E[\varphi(A)] \le 8\,\varphi_{\mathrm{OPT}}(A)>`, par l'inégalité
   triangulaire puis l'inégalité des puissances (cas de Cauchy–Schwarz).
3. **Lemme 3.3 — récurrence.** En récurrence sur le nombre `<KaTeX: t>` de centres tirés et le
   nombre `<KaTeX: u>` de clusters optimaux encore « non couverts » (aucun centre tiré d'eux),
   l'espérance du potentiel fait intervenir la **somme harmonique**
   `<KaTeX: H_t = 1 + \frac{1}{2} + \dots + \frac{1}{t}>`. Appliquée après le premier centre
   (`<KaTeX: t = u = k - 1>`), avec `<KaTeX: H_{k-1} \le 1 + \ln k>`, elle donne la borne du
   théorème. **C'est la somme harmonique qui produit le `<KaTeX: \ln k>`** : chaque cluster
   optimal « paie » un facteur lié au moment où il est couvert pour la première fois.

**Optimalité de l'ordre.** Le Théorème 4.1 (A&V 2007) construit une famille d'instances
(k clusters très séparés) sur laquelle l'échantillonnage D² n'est pas mieux qu'
`<KaTeX: \Omega(\ln k)>`-compétitif en espérance : l'ordre `<KaTeX: \ln k>` est **optimal à un
facteur constant près**. La constante 8 a depuis été améliorée en 5 (Makarychev, Reddy & Shan,
NeurIPS 2020) : `<KaTeX: \mathbb E[\phi(C)] \le 5(\ln k + 2)\,\varphi_{\mathrm{OPT}}>`, sans
changer l'ordre.

**Sur les données bien séparées.** Ostrovsky, Rabani, Schulman & Swamy (FOCS 2006), qui
proposent indépendamment le même seeding, prouvent qu'il est **O(1)-compétitif** dès que les
données admettent une bonne partition en k clusters, à savoir
`<KaTeX: \varphi_{\mathrm{OPT},k} / \varphi_{\mathrm{OPT},k-1} \le \varepsilon^2>` (ajouter un
k+1-ième cluster n'apporte presque rien). Le régime `<KaTeX: \ln k>` est donc une borne pire
cas : sur des données « bien formées », le facteur est borné par une constante.

### TheoremBlock `2.2.3.bis` — « Lloyd après k-means++ »

Soit `<KaTeX: C_{\mathrm{seed}}>` l'ensemble des centres du seeding, et
`<KaTeX: C^*>` la partition obtenue en exécutant l'algorithme de Lloyd depuis
`<KaTeX: C_{\mathrm{seed}}>`. D'après la Proposition de la leçon (monotonie de l'inertie
intra-classes, lemme 22.1 de Shalev-Shwartz & Ben-David), le coût ne fait que diminuer le long
des itérations de Lloyd :

```
<KatexBlock> \phi(C^*) \le \phi(C_{\mathrm{seed}}) </KatexBlock>
```

D'où

```
<KatexBlock> \mathbb E[\phi(C^*)] \le 8(\ln k + 2) \cdot \varphi_{\mathrm{OPT}} </KatexBlock>
```

**la garantie se transporte au coût final de k-means++** (seeding + Lloyd). Arthur &
Vassilvitskii soulignent que c'est le raffinement par Lloyd qui rend la méthode efficace en
pratique — sur leurs jeux de données, le potentiel final est 20 à 1000 fois plus petit qu'avec
le seeding aléatoire, et la convergence est 2 à 3 fois plus rapide (moins d'itérations) — mais
la théorie ne quantifie pas ce raffinement (« it is difficult to quantify this theoretically ») :
la borne ne s'applique qu'au coût du seeding.

### Comparaison : redémarrages vs k-means++ (paragraphe)

Les **redémarrages multiples** de la section précédente restent une heuristique : chaque essai
est un tirage indépendant ; « le meilleur des R » s'améliore empiriquement avec R
(section interactive 2.2), mais aucune garantie pire cas ne s'y attache — le tirage uniforme
peut être arbitrairement mauvais, comme vu ci-dessus. **k-means++** fournit en revanche une
garantie pire cas, en espérance : `<KaTeX: O(\ln k)>` sur tout jeu de données, pour un coût de
seeding `<KaTeX: O(nkd)>` (du même ordre qu'une itération de Lloyd) — et en pratique il bat
plusieurs redémarrages, tout en convergeant plus vite (A&V 2007, §6).

**k-means||** (Bahmani, Moseley, Vattani, Kumar & Vassilvitskii, PVLDB 2012). Les k passes du
seeding de k-means++ sont séquentielles par nature ; k-means|| les parallélise : après un
premier centre uniforme, chacun des `<KaTeX: O(\log n)>` tours échantillonne **en parallèle** un
lot de points avec une probabilité proportionnelle à `<KaTeX: D(x)^2>` (environ
`<KaTeX: \ell = \Theta(k)>` nouveaux points par tour), puis on sélectionne les k centres finaux
parmi les candidats — pondérés par le nombre de points qu'ils attirent — par exemple en
réexécutant k-means++ sur l'instance pondérée. La garantie `<KaTeX: O(\ln k)>` en espérance est
préservée (Théorème 1 de l'article : si l'étape finale utilise un `<KaTeX: \alpha>`-algorithme
d'approximation, le résultat est un `<KaTeX: O(\alpha)>`-algorithme), le coût décroissant
géométriquement à chaque tour (Théorème 2) ; en pratique, un nombre constant de tours (3 à 5)
suffit. C'est la variante déployée dans les grands systèmes (Spark MLlib et autres).

### InteractiveSection `2.2.bis` — « k-means++ : la garantie en pratique »

(voir « Démo proposée » ci-dessous)

## Démo proposée — `KMeansPPGuaranteeDemo`

Nouveau composant `src/lib/components/demos/KMeansPPGuaranteeDemo.svelte`, construit **uniquement**
sur les fonctions existantes de `src/lib/math/clustering.ts` (`generateBlobs`, `kmeansLloyd`) —
pas de nouvelle fonction mathématique exportée.

- **Mêmes données que la section interactive 2.2** : `generateBlobs(3, 8, 21)` — 24 points,
  3 nuages gaussiens bien séparés (K = 3).
- **Référence φ_OPT** : exécution de Lloyd initialisée aux vrais centroïdes des nuages
  (`[4, 0]`, `[-2, 2√3]`, `[-2, -2√3]`, centroïdes analytiques de `generateBlobs`) →
  `<KaTeX: \varphi_{\mathrm{OPT}} = 25.1849>`, minimum global déjà documenté dans
  `KMeansRestartsDemo`.
- **Runs** : 30 exécutions de Lloyd avec initialisation aléatoire uniforme (seeds 31101–31130,
  redéterminables par un bouton « Réinitialiser ») + 1 exécution k-means++ (seed 32101,
  redéterminable).
- **Valeurs vérifiées** (seeds courants, mesurées avec les fonctions du dépôt) : 26 des 30 runs
  aléatoires convergent vers le minimum global (25.2) ; 4 tombent dans des minima locaux
  (198.5, 199.4, 207.7, 198.5) → pire ratio ≈ 8.25. Le run k-means++ tombe **exactement** sur
  φ_OPT en 1 itération de Lloyd (ratio 1.00) — cohérent avec le résultat O(1) sous séparation
  (Ostrovsky et al. 2006).
- **Écran** : deux scatter (pire run aléatoire vs run k-means++, centres en surimpression) +
  un `CurveChart` en **échelle log** : strip des coûts finaux des 30 runs aléatoires, ligne
  horizontale k-means++, ligne φ_OPT, ligne pointillée de la borne
  `<KaTeX: 8(\ln 3 + 2) \cdot \varphi_{\mathrm{OPT}} \approx 624>` — très au-dessus des coûts
  observés.
- **Metrics** : pire run aléatoire (valeur + ratio à φ_OPT), k-means++ (valeur + ratio),
  facteur de la borne `<KaTeX: 8(\ln 3 + 2) \approx 24.8>`.
- **Légende honnête** : petit jeu de données seedé (24 points, mêmes données que la section
  interactive 2.2) ; la garantie `<KaTeX: \mathbb E[\phi] \le 8(\ln k + 2)\,\varphi_{\mathrm{OPT}}>``
  est **en espérance sur le tirage du seeding** et **pire cas sur toutes les données** — elle est
  donc très au-dessus des coûts observés ici, et un tirage isolé peut la violer. Les itérations
  de Lloyd ne font qu'affiner le coût (proposition de la leçon), donc la borne s'applique aussi
  au coût final. Sur ces données bien séparées, k-means++ est pratiquement exact : c'est le
  régime O(1) sous séparation.

## Bibliographie à ajouter à la page (`BibElement`)

1. `Arthur, D.` · `Vassilvitskii, S.` (2007) — « k-means++: The Advantages of Careful Seeding »
   — SODA '07: Proceedings of the Eighteenth Annual ACM-SIAM Symposium on Discrete Algorithms,
   pp. 1027–1035. — lien : `https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf`
2. `Bahmani, B.` · `Moseley, B.` · `Vattani, A.` · `Kumar, R.` · `Vassilvitskii, S.` (2012) —
   « Scalable K-Means++ » — Proceedings of the VLDB Endowment, 5(7), pp. 622–627.
   — lien : `https://www.vldb.org/pvldb/vol5/p622_bahmanbahmani_vldb2012.pdf`
3. `Makarychev, K.` · `Reddy, A.` · `Shan, L.` (2020) — « Improved Guarantees for k-means++
   and k-means++ Parallel » — NeurIPS 2020.
   — lien : `https://proceedings.neurips.cc/paper/2020/file/ba304f3809ed31d0ad97b5a2b5df2a39-Paper.pdf`
4. `Ostrovsky, R.` · `Rabani, Y.` · `Schulman, L.` · `Swamy, C.` (2006) — « The Effectiveness
   of Lloyd-type Methods for the k-means Problem » — FOCS '06: Proceedings of the 47th Annual
   IEEE Symposium on Foundations of Computer Science. — (pas de lien gratuit fiable identifié ;
   `link` optionnel de `BibElement`)

## Formules (prêtes en KaTeX, sûres dans String.raw)

```ts
const phiDef = String.raw`\phi(C) = \sum_{x \in X} \min_{c \in C} \| x - c \|^2`;
const phiOptDef = String.raw`\varphi_{\mathrm{OPT}} = \min_{|C| = k} \phi(C)`;
const dDef = String.raw`D(x) = \min_{c \in C_{i-1}} \| x - c \|`;
const d2Prob = String.raw`p(x') = \dfrac{D(x')^2}{\sum_{x \in X} D(x)^2}`;
const avBound = String.raw`\mathbb E[\phi(C)] \le 8(\ln k + 2) \cdot \varphi_{\mathrm{OPT}}`;
const lemmaUniform = String.raw`\mathbb E[\varphi(A)] = 2\,\varphi_{\mathrm{OPT}}(A)`;
const lemmaD2 = String.raw`\mathbb E[\varphi(A)] \le 8\,\varphi_{\mathrm{OPT}}(A)`;
const harmonic = String.raw`H_t = 1 + \frac{1}{2} + \dots + \frac{1}{t} \le 1 + \ln t`;
const lowerBound = String.raw`\Omega(\ln k)`;
const bound2020 = String.raw`\mathbb E[\phi(C)] \le 5(\ln k + 2)\,\varphi_{\mathrm{OPT}}`;
const separation = String.raw`\varphi_{\mathrm{OPT},k} / \varphi_{\mathrm{OPT},k-1} \le \varepsilon^2`;
const lloydCarry = String.raw`\phi(C^*) \le \phi(C_{\mathrm{seed}})`;
const boundK3 = String.raw`8(\ln 3 + 2) \cdot \varphi_{\mathrm{OPT}} \approx 624`;
const boundK3Factor = String.raw`8(\ln 3 + 2) \approx 24.8`;
```

**Correction importante** : dans la définition, `D(x)` est la **distance** (pas la distance
carrée) : `<KaTeX: D(x) = \min_{c \in C_{i-1}} \| x - c \|>` — c'est le carré qui apparaît dans
la probabilité `D(x')²/Σ D(x)²` (fidèle au §2.2 de A&V 2007).
