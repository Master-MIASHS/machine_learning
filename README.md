# Fondations de l'Apprentissage Statistique — Cours interactif

> Cours en ligne de niveau Master (MIASHS M1, semestre 2 — « Régularisation et
> optimisation ») couvrant les fondements théoriques et numériques de
> l'apprentissage automatique : optimisation, régularisation, classification
> supervisée et clustering _(parties à venir)_, prédiction conformelle, optimum
> de Bayes, consistance, généralisation et calibration des fonctions de perte. Chaque concept s'appuie sur des simulations interactives,
> des démonstrations animées et des exercices (avec mode enseignant).

Université de Montpellier Paul-Valéry · Master MIASHS

## Quick Start

Prerequisites: **Node.js ≥ 22** and **pnpm ≥ 9**.

```bash
pnpm install     # install dependencies
pnpm dev         # dev server → http://localhost:5173/machine_learning/
pnpm check       # typecheck (svelte-check)
pnpm test:unit   # Vitest unit tests
pnpm lint        # ESLint
pnpm format      # Prettier
pnpm build       # production build (static adapter, GitHub Pages)
```

The base path `/machine_learning` is set in `svelte.config.js` and is the same
value CI uses for the GitHub Pages deployment.

## Objectifs du cours

L'apprentissage automatique moderne repose sur trois piliers : la
**modélisation mathématique**, l'**optimisation numérique** et la
**garantie statistique**. À l'issue de ce cours, l'étudiant doit savoir :

- **Analyser et modéliser** — identifier les propriétés d'un problème
  (convexité, coercivité, régularité du gradient, forte convexité) et en
  déduire l'existence, l'unicité et la stabilité de la solution ;
- **Concevoir et optimiser** — choisir l'algorithme de descente adapté à la
  structure du problème (classique, accélérée, stochastique, par coordonnées,
  Newton, Adam) ;
- **Maîtriser la complexité** — appliquer et comparer les méthodes de
  régularisation (Ridge, Lasso, Elastic Net) et d'ensemble (Bagging, Random
  Forest, Boosting) pour résoudre le dilemme biais-variance ;
- **Garantir et certifier** — évaluer la calibration d'un classifieur et
  appliquer la prédiction conformelle pour construire des ensembles et
  intervalles de prédiction garantis à un niveau de confiance choisi, sans
  hypothèse forte sur la distribution ;
- **Caractériser l'optimum** — dériver le classifieur de Bayes et la
  régression optimale (espérance conditionnelle en L2, médiane conditionnelle
  en L1) et identifier le risque de Bayes comme borne irréductible ;
- **Analyser la convergence** — définir la consistance (en probabilité, en
  moyenne quadratique, presque sûrement, universelle) et la vérifier pour le
  k-NN ;
- **Bonder la généralisation** — appliquer les inégalités de concentration et
  la théorie VC (dimension VC, lemme de Sauer–Shelah) pour les classes finies
  et le SVM, et discuter les limites de la théorie VC (double descente) ;
- **Concevoir des pertes optimisables** — expliquer pourquoi la perte 0-1 ne
  s'optimise pas, choisir une perte proxy convexe, appliquer le théorème de
  calibration et décomposer l'excès de risque (estimation, calibration,
  approximation).

## Plan du cours

| Partie                       | Contenu                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I — Optimisation**         | Conditions d'un minimum · Fonctions d'optimisation en ML · Descente de gradient & accélération · Adam _(mode expert)_ · SGD, descente par coordonnées & Newton · Exercices · TP |
| **II — Classification supervisée** _(contenu à venir)_ | Cadre de l'apprentissage supervisé & k-NN · Classifieurs linéaires & régression logistique · Arbres de décision · SVM · Exercices · TP               |
| **III — Clustering** _(contenu à venir)_ | Clustering hiérarchique · K-moyennes & évaluation · Exercices · TP                                                                          |
| **IV — Régularisation**      | Méthodes ensemblistes & Bagging · Random Forest & sélection de features · Boosting (AdaBoost, Gradient Boosting) · Régularisation L1/L2/Elastic Net · Exercices · TP            |
| **V — Set-valued**           | Classification Top-K · Prédiction conformelle · Intervalles de prédiction · Exercices                                                                                           |
| **VI — Optimum de Bayes**    | Classifieur optimal · Régression optimale · Exercices                                                                                                                           |
| **VII — Consistance**        | Convergence · Consistance k-NN · Exercices                                                                                                                                      |
| **VIII — Généralisation**    | Concentration & risque empirique · Généralisation pour une classe finie · Dimension VC, Sauer–Shelah & SVM · Limites de la théorie VC & double descente · Exercices            |
| **IX — Fonctions de perte**  | De la perte 0-1 aux pertes proxy · Calibration des pertes convexes · Décomposition de l'erreur · Exercices                                                                      |

Les Parties II et III sont des emplacements réservés (pages « contenu en cours
de rédaction ») : le contenu sera rédigé à partir des supports de cours de
classification (CM en LaTeX et TP en R Markdown, conservés hors dépôt dans
`marine/Cours/`). Les énoncés de TP sont déjà servis dans `static/rmd/`.
L'ordre I → II → III → IV est pédagogique : la régularisation (bagging, forêts
aléatoires, boosting) s'appuie sur les arbres de décision enseignés en Partie II.

La liste des pages, leur ordre et leur appartenance aux parties est centralisée
dans `src/lib/navigation.ts` (barre latérale, navigation précédent/suivant,
suivi de progression).

## Approche pédagogique

- **Intuition avant formalisme** — chaque concept est introduit par une
  simulation interactive (≈ 80 démos dans `src/lib/components/demos/`) : on
  manipule les paramètres et on observe le phénomène avant de lire la formule.
- **Mathématiques rendues par KaTeX** (`KatexInline`, `KatexBlock`) ; les
  grandeurs clés (risque, biais-variance, scores de conformité, bornes de
  généralisation…) sont recalculées en direct quand les paramètres changent.
- **Mode expert** — bascule globale (stock `settings`) : révèle les cours
  réservés aux lecteurs avancés (ex. le cours Adam) et les détails
  complémentaires.
- **Suivi de progression** — la visite des pages et les interactions sont
  suivies localement (stock `progress`).
- **Exercices** — une page d'exercices par partie ; les corrigés s'affichent en
  **mode enseignant** via le paramètre d'URL `?teacher=true`.
- **Notes de cours** — la vérité mathématique du site est portée par les
  notes Typst de `typst/` ; les versions PDF servies au site sont dans
  `static/pdf/` :
  - _Optimisation pour l'Apprentissage_ (`optim.pdf`) — Partie I
  - _Agrégation, Forêts & Régularisation_ (`regularization.pdf`) — Partie IV
  - _Évaluation & Prédictions Conformelles_ (`set_valued.pdf`) — Partie V
  - _Théorie de l'Apprentissage Statistique_ (`theory.pdf`) — Parties VI à IX
- **Travaux pratiques** — notebooks Jupyter dans `static/notebooks/`
  (Parties I et IV) ; énoncés R Markdown dans `static/rmd/` (Parties II et III).

## Architecture

| Couche             | Technologie                                                      |
| ------------------ | ---------------------------------------------------------------- |
| Framework          | SvelteKit 2 · Svelte 5 (runes : `$state`, `$derived`, `$effect`) |
| Build              | Vite 6 · TypeScript 5 · Tailwind CSS 4                           |
| Rendu mathématique | KaTeX                                                            |
| Visualisation      | D3 v7 + composants SVG maison                                    |
| Animation          | motion                                                           |
| Tests              | Vitest 4 (unitaires)                                             |
| Lint / format      | ESLint 9 · Prettier                                              |
| Package manager    | pnpm 9 · Node 22                                                 |

```
src/
├── lib/
│   ├── navigation.ts             # source de vérité des pages (ordre, titres, parties)
│   ├── math/                     # toutes les formules et simulateurs (≈ 35 modules, chacun testé)
│   ├── components/
│   │   ├── charts/               # Figure, CurveChart, DensityChart, ScatterPlot, …
│   │   ├── controls/             # Slider, Toggle, RadioButton, Button, …
│   │   ├── layout/               # PageTemplate, Header, Sidebar, SliderGrid, Metrics
│   │   ├── narrative/            # TheorySection, TheoremBlock, DefinitionBlock,
│   │   │                         # ExercisePanel, InteractiveSection, Callout, KaTeX, …
│   │   └── demos/                # ≈ 80 démos interactives embarquées dans les cours
│   └── stores/                   # progress, settings (mode expert), simulation
├── routes/
│   ├── +page.svelte              # page d'accueil
│   ├── intro/                    # introduction du cours + références complètes
│   ├── partN/lessonM/            # cours
│   ├── partN/exercices/          # exercices (une page par partie)
│   ├── partN/practice/           # travaux pratiques (parties I, II, III, IV)
│   └── demo/                     # bac à sable interne des composants (hors cours)
typst/                            # notes de cours source (vérité mathématique)
static/
├── pdf/                          # les 4 notes de cours (PDF)
├── notebooks/                    # notebooks Jupyter des TP (parties I et IV)
├── rmd/                          # énoncés R Markdown des TP (parties II et III)
└── logos/                        # logos UMPV et AMIS
.github/workflows/deploy.yml      # CI : check → tests → build → GitHub Pages
```

## Contribuer

Les règles principales (version complète dans `AGENTS.md`, qui s'adresse aussi
aux agents IA) :

- **Fidélité au contenu** — les cours enseignent ce qui est écrit dans les
  notes Typst (`typst/*.typ`) : mêmes numéros de théorèmes, même structure de
  preuve. Une extension au-delà du texte est admise seulement si elle est
  visiblement marquée comme telle (« au-delà du cours », « illustratif »).
- **Aucune formule inline dans les `.svelte`** — chaque nombre affiché est
  calculé par une fonction de `src/lib/math/` (un module par sujet théorique,
  un fichier `*.test.ts` par module, aléatoire déterministe via `util.ts` —
  `mulberry32` + `combineSeed`).
- **Svelte 5 runes uniquement** — jamais `export let` pour les props.
- **Toute la copie est en français** ; couleurs via variables CSS sémantiques
  (`var(--color-…)`), pas de hexadécimal en dur.
- **Ajouter une page** — créer `src/routes/…/+page.svelte` basé sur
  `PageTemplate`, puis l'enregistrer dans `RAW_PAGES`
  (`src/lib/navigation.ts`) pour qu'elle apparaisse dans la navigation et le
  suivi de progression.
- **Avant de considérer un travail comme terminé** :

```bash
pnpm check && pnpm test:unit && pnpm lint && pnpm build
```

## Déploiement

Le workflow GitHub Actions (`.github/workflows/deploy.yml`) se déclenche sur
chaque push vers `main` : typecheck, tests unitaires, build de production avec
`BASE_PATH=/machine_learning`, puis publication sur GitHub Pages
(`@sveltejs/adapter-static`, fallback `404.html` pour le routage SPA).

## Références

La liste complète, organisée par partie, est sur la page
[Introduction](src/routes/intro/+page.svelte). Ouvrages et articles de
référence :

- **Optimisation** — Boyd & Vandenberghe, _Convex Optimization_ (2004) ;
  Nesterov (1983, 2004) ; Nocedal & Wright, _Numerical Optimization_ (2006) ;
  Bottou, Curtis & Nocedal (2018) ; Bubeck (2015) ; Kingma & Ba (2015)
- **Régularisation & ensembles** — Hastie, Tibshirani & Friedman, _The Elements
  of Statistical Learning_ (2009) ; Breiman (1996, 2001) ; Freund & Schapire
  (1997) ; Friedman (2001) ; Hoerl & Kennard (1970) ; Tibshirani (1996) ;
  Zou & Hastie (2005)
- **Prédiction conformelle** — Vovk, Gammerman & Shafer (2005) ; Angelopoulos &
  Bates (2021) ; Romano, Patterson & Candès (2019) ; Romano, Sesia & Candès
  (2020) ; Barber, Candès, Ramdas & Tibshirani (2021)
- **Théorie de l'apprentissage** — Devroye, Györfi & Lugosi (1996) ; Vapnik
  (1995, 1998) ; Cover & Hart (1967) ; Stone (1977) ; Boucheron, Lugosi &
  Massart, _Concentration Inequalities_ (2013)
- **Pertes & généralisation en deep learning** — Bartlett, Jordan & McAuliffe
  (2006) ; Belkin, Hsu, Ma & Mandal (2019) ; Zhang et al. (2017)

---

*Université de Montpellier Paul-Valéry — Master MIASHS.
