---
id: p10-l2-calibration-cost-sensitive
type: panel
part: 10
lesson: /part10/lesson2
anchor: critere-phi
title: "Calibration cost-sensitive (pertes asymétriques)"
level: m2
priority: 2
status: pending
related: [p10-l2-margin-condition-taux-calibration]
sources:
  - course_sources/typst/theorie.typ
---

# Calibration cost-sensitive (pertes asymétriques)

## Mission

La leçon traite la calibration pour des pertes **symétriques** (0-1, proxy
convexe). Ce panneau étend au cas **cost-sensitive** : des coûts d'erreur
asymétriques (faux positif ≠ faux négatif). Le classifieur de Bayes décale son
seuil, la calibration se transpose sur une **distribution inclinée** (tilted),
et la borne de Bartlett a une version cost-sensitive. C'est une **extension
au-delà du cours** (marquée comme telle), utile pour les données déséquilibrées.

## Course boundaries

- **Lesson:** `src/routes/part9/lesson2/+page.svelte`
- **Already taught (do not re-teach):** calibration, calibration ponctuelle,
  critère $\varphi'(0)<0$, pertes usuelles.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Calibration » (Th. 4.1) — le panneau part du cadre symétrique et l'étend.
- **Where "beyond course" starts:** toute la version cost-sensitive est
  **au-delà** de `course_sources/` → « au-delà du cours » (extension, pas dans
  les sources).
- **Out of scope:** la calibration symétrique (déjà traitée).

## Research questions

1. Écrire la **perte 0-1 cost-sensitive** (coût $a$ FP, coût $b$ FN) et le
   **classifieur de Bayes cost-sensitive** : prédire 1 ssi
   $\eta(x)>\frac{b}{a+b}$ (seuil décalé).
2. Montrer la transformation **tilted** : la calibration cost-sensitive se
   ramène à une calibration standard sur une distribution ré-pondérée.
3. Énoncer la **borne de Bartlett cost-sensitive** (version asymétrique de la
   borne de regret).
4. Relier à la calibration symétrique : $a=b$ redonne le cas standard (cohérence).
5. Applications : données déséquilibrées (fraude, diagnostic) — en quoi le
   seuil décalé suffit parfois (re-pondération vs. seuil).

## Starting references

- Elkan, « The Foundations of Cost-Sensitive Learning » (2001, IJCAI).
- Bartlett, « Convexity, Classification, and Risk Bounds » (2006) — version
  cost-sensitive.
- `course_sources/typst/theorie.typ` (Th. 4.1, cadre symétrique de référence).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `calibration-cost-sensitive.research.md` — verified claims only, each with an
   exact citation. C'est une **extension au-delà du cours** : marquer clairement
   que ce n'est pas dans `course_sources/`. Flag **UNVERIFIED** anything not
   verified.
2. `calibration-cost-sensitive.draft.md` — French content draft for an
   `ExpertPanel`: French, M2/research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; **tout le panneau** marqué « au-delà du
   cours » (extension) ; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] Toute l'extension marquée « au-delà du cours » (pas dans les sources)
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] French draft reads at M2/research level
