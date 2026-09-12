---
id: p1-l3-adam-convergence-adam-adaptive-methods
type: panel
part: 1
lesson: /part1/lesson3-adam
anchor: generalisation
title: "Convergence d'Adam : ce qui est réellement prouvé"
level: research
priority: 3
status: pending
related: [p1-l4-reduction-variance-svrg-sarah, p5-l4-lasso-bic-equivalence]
sources:
  - course_sources/typst/optim.typ
---

# Convergence d'Adam : ce qui est réellement prouvé

## Mission

La leçon expert Adam enseigne la mécanique d'Adam et d'AdamW, mais sans théorie
de convergence — ce qui est fidèle à l'article original (Kingma & Ba 2015 ne
prouve rien). Ce panneau recadre honnêtement l'état de l'art : un
contre-exemple de divergence (Reddi et al. 2018), la correction AMSGrad, et les
hypothèses sous lesquelles des résultats de convergence existent pour
AdaGrad/Adam/AdamW. C'est un exemple type de « frontière de recherche » à
présenter avec prudence.

## Course boundaries

- **Lesson:** `src/routes/part1/lesson3-adam/+page.svelte`
- **Already taught (do not re-teach):** de SGD à Adam, second moment, algorithme
  complet, biais, préconditionneur, $\beta_1,\beta_2,\epsilon$, learning rate,
  Adam vs AdamW, échecs, diagnostic.
- **Ground truth to read first:** `course_sources/typst/optim.typ` (la descente
  de gradient et SGD y sont ; **Adam n'y figure pas** — c'est pourquoi la leçon
  est expert). Le panneau reste donc entièrement « au-delà du cours ».
- **Where "beyond course" starts:** tout (convergence d'Adam est de la
  recherche) → « au-delà du cours » partout.
- **Out of scope:** les méthodes de réduction de variance (panneau
  `p1-l4-reduction-variance-svrg-sarah`).

## Research questions

1. Que prouve (ou ne prouve pas) Kingma & Ba (2015) ? (Réponse attendue :
   aucune preuve de convergence, une heuristique motivée.)
2. Présenter le contre-exemple de Reddi, Kale, Kumar (2018) : un problème
   convexe sur lequel Adam diverge, et la correction AMSGrad.
3. Citer au moins deux résultats de convergence conditionnels (ex. AdaGrad —
   Duchi et al. 2011, De Sa & Singh 2016 ; Adam/AdamW sous conditions — ex. les
   analyses récentes) et énoncer leurs hypothèses.
4. Expliquer pourquoi découpler le weight decay (AdamW, Loshchilov & Hutter
   2017) change la régularisation effective par rapport à Adam + L2.
5. Comparer brièvement le comportement de AdaGrad / RMSProp / Adam sur un
   problème mal conditionné (lien avec le conditionnement, panneau
   `p1-l2-conditionnement-taux-gd`).

## Starting references

- Kingma & Ba, « Adam: A Method for Stochastic Optimization » (2015, ICLR).
- Reddi, Kale, Kumar, « On the Convergence of Adam and Beyond » (2018, ICLR).
- Loshchilov & Hutter, « Decoupled Weight Decay Regularization » (2017, ICLR).
- Duchi, Hazan, Singer, « Adaptive Subgradient Methods » (2011, JMLR).
- De Sa & Singh, « How good is stochastic approximate gradient descent? »
  (2016).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `convergence-adam-adaptive-methods.research.md` — verified claims only, each
   with an exact citation. Ce sujet étant à la frontière de la recherche,
   distinguer soigneusement **prouvé** / **heuristique** / **UNVERIFIED**.
2. `convergence-adam-adaptive-methods.draft.md` — French content draft for an
   `ExpertPanel`: French, research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/claim checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content (tout est au-delà)
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Prouvé / heuristique / UNVERIFIED clairement distingués
- [ ] French draft reads at research level
