# `expert/` — briefs de recherche pour le contenu expert

Ce dossier contient un **brief** par sujet expert à ajouter au cours : soit un
panneau `ExpertPanel` greffé sur une leçon existante, soit une **leçon expert**
à part entière. Chaque brief est auto-suffisant pour qu'un agent de recherche
spawné dessus fasse le travail de recherche et produise un contenu vérifié.

> Objectif de la phase 1 : ne **rien** implémenter dans le cours. On produit
> uniquement des briefs (ici) et, plus tard, les rapports de recherche et
> brouillons rédigés par les agents (`<slug>.research.md`, `<slug>.draft.md`).

## Arborescence

```
expert/
├── README.md                  # ce fichier
├── INDEX.md                   # manifeste : tous les briefs + statut
├── _template/brief.template.md
├── partN/
│   ├── lessonM/
│   │   └── <slug>.md          # brief d'un panneau (miroir de src/routes)
│   └── lessons/
│       └── <slug>.md          # brief d'une leçon expert à part entière
```

- Un **panneau** vit dans `expert/partN/lessonM/<slug>.md`, en miroir exact de
  `src/routes/partN/lessonM/`.
- Une **leçon expert** vit dans `expert/partN/lessons/<slug>.md` (`partN` =
  partie principale d'accroche ; certaines leçons enjambent deux parties).
- Les **sorties d'un agent** sont posées à côté du brief :
  `<slug>.research.md` (affirmations vérifiées + citations) et
  `<slug>.draft.md` (brouillon du contenu, en français).

## Conventions de nommage

- `slug` : minuscules, tirets, ASCII (ex. `kkt-dualite-lagrangienne`).
- `id` (frontmatter) : `p{part}-l{lesson}-{slug}` pour un panneau,
  `p{part}-lesson-{slug}` pour une leçon expert.

## Cycle de vie d'un brief (champ `status` du frontmatter)

| Statut | Signification |
|---|---|
| `pending` | Brief écrit, agent non lancé |
| `researching` | Agent spawné, recherche en cours |
| `drafted` | `<slug>.research.md` + `<slug>.draft.md` produits |
| `reviewed` | Relecture humaine faite (math + fidélité aux sources) |
| `implemented` | Contenu intégré au cours (panneau/leçon), brief archivé |

Seul l'orchestrateur met à jour `status` (et la colonne correspondante de
`INDEX.md`) après vérification des sorties d'un agent.

## Priorités

- **1 (haute)** : ponts entre parties, parts sans contenu expert, leçons sans
  panneau.
- **2 (moyenne)** : autres panneaux et leçons.
- **3 (frontière de recherche)** : sujets au niveau M2/doctorat, à traiter une
  fois les tiers 1–2 stabilisés.

## Prompt à copier pour spawnner un agent sur un brief

Remplacer `<PATH>` par le chemin du brief (ex.
`expert/part1/lesson1/kkt-dualite-lagrangienne.md`) :

```
Tu es un agent de recherche pour un cours de master en apprentissage
statistique (contenu en français, niveau M2/chercheur).

1. Lis le brief : <PATH>.
2. Lis la leçon cible (src/routes/...) et les fichiers de vérité
   (course_sources/...) listés dans le brief AVANT toute recherche.
3. Réponds à chaque "Research question" par une recherche web ciblée
   (articles, livres, arXiv). Vérifie chaque résultat contre sa source
   primaire ; ne reformule jamais une preuve depuis la mémoire.
4. Écris exactement deux fichiers, à côté du brief :
   - <slug>.research.md : affirmations vérifiées, esquisses de preuves,
     citations exactes (auteur, année, venue, n° de théorème/section, URL).
     Marque **UNVERIFIED** ce que tu n'as pas pu vérifier.
   - <slug>.draft.md : brouillon du contenu en français, formules prêtes en
     KaTeX (compatibles String.raw), blocs narratifs du projet, chaque
     passage au-delà de course_sources/ marqué « au-delà du cours ».
5. Ne modifie ni src/, ni course_sources/, ni le brief.
```

## Règles de contenu (rappel AGENTS.md)

- Tout ce qui n'est **pas** dans `course_sources/` est « au-delà du cours » et
  doit rester **visiblement marqué** dans le brouillon.
- Un théorème, un numéro, une étape de preuve doit être tiré de la source
  primaire citée — pas d'extension présentée comme du cours.
- Les brouillons sont en **français** ; les formules doivent être valides en
  KaTeX et sûres dans `String.raw`.

## Prochaine étape (hors phase 1)

Une fois un brief `reviewed`, l'intégration dans le cours suit la checklist
AGENTS.md (`npm run check`, `test:unit`, `lint`, `build`, tests du module
mathématique, imports lus avant usage).
