---
id: p9-l1-mc-diarmid-pac
type: panel
part: 9
lesson: /part9/lesson1
anchor: concentration
title: "Inégalité de McDiarmid et définition PAC"
level: m2
priority: 1
status: pending
related: [p8-l1-lln-fort-erm-consistance-ps, p9-l2-convergence-uniforme-fonction-croissance]
sources:
  - course_sources/typst/theorie.typ
---

# Inégalité de McDiarmid et définition PAC

## Mission

La leçon présente Markov, Bienaymé–Tchebychev et la convergence de la moyenne
empirique (Hoeffding, Th. « Inégalités fondamentales »). Ce panneau ajoute deux
briques : l'**inégalité de McDiarmid** (différences bornées), l'outil central
pour les statistiques **dépendant des données**, et la définition formelle de
l'apprentissage **PAC** (probably approximately correct) — comment la
concentration fournit une borne $(\varepsilon,\delta)$.

## Course boundaries

- **Lesson:** `src/routes/part9/lesson1/+page.svelte`
- **Already taught (do not re-teach):** Markov, Bienaymé–Tchebychev,
  convergence de la moyenne empirique, limites du contrôle pour un classifieur
  fixé (Hoeffding).
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Inégalités fondamentales » (Markov, Tchebychev, Hoeffding). Le panneau
  ajoute McDiarmid et PAC.
- **Where "beyond course" starts:** McDiarmid, définition PAC — « au-delà du
  cours ».
- **Out of scope:** la borne VC (leçon 3), la complexité de Rademacher (leçon
  3).

## Research questions

1. Énoncer **McDiarmid** : si changer une observation modifie $f$ de $\le c_i$,
   alors $\mathbb P(f-\mathbb E f\ge t)\le\exp(-2t^2/\sum c_i^2)$.
2. Montrer que McDiarmid généralise Hoeffding (cas $f=\sum$ de fonctions
   indépendantes) et s'applique aux statistiques de type « erreur empirique d'un
   classifieur appris ».
3. Distinguer **sous-gaussien** vs. **sous-exponentiel** (et le lien avec
   Hoeffding vs. Bernstein).
4. Définir l'apprentissage **PAC** : un algorithme est PAC ssi, pour tout
   $(\varepsilon,\delta)$, avec probabilité $\ge1-\delta$, le risque $\le
   \varepsilon$ ; donner la forme d'une borne PAC pour un classifieur fixé.
5. Relier : McDiarmid/Hoeffding $\to$ borne PAC (le pont vers la leçon 2,
   classe finie).

## Starting references

- McDiarmid, « On the Method of Bounded Differences » (1989, Adv. Probab.) ;
  « Concentration » (1997, All of Stat.).
- Boucheron, Lugosi, Massart, *Concentration Inequalities* (2013), ch. 4.
- Vapnik, *Statistical Learning Theory* (1998), ch. 2 (PAC).
- `course_sources/typst/theorie.typ` (Hoeffding).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `mc-diarmid-pac.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `mc-diarmid-pac.draft.md` — French content draft for an `ExpertPanel`:
   French, M2/research level; every formula KaTeX-ready and `String.raw`-safe;
   narrative blocks; every beyond-course statement marked « au-delà du cours »;
   optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
