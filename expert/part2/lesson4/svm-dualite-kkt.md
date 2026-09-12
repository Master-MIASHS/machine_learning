---
id: p2-l4-svm-dualite-kkt
type: panel
part: 2
lesson: /part2/lesson4
anchor: svm-marge-rigide
title: "Dualité KKT de la SVM : vecteurs support et parcimonie"
level: m2
priority: 1
status: pending
related: [p1-l1-kkt-dualite-lagrangienne, p1-lesson-dualite-convexe-kkt]
sources:
  - course_sources/marine/Cours/CM/coursClassif-4-SVM.tex
  - course_sources/typst/theorie.typ
---

# Dualité KKT de la SVM : vecteurs support et parcimonie

## Mission

La leçon enseigne la SVM (marge rigide, souple, noyau) et possède déjà un
panneau « Preuve (non demandée) ». Ce panneau complète avec la **dérivation
complète par dualité KKT** : pourquoi le problème se réécrit en les
multiplicateurs $\alpha_i$, comment la **complémentarité** identifie exactement
les vecteurs support ($\alpha_i>0$), et d'où vient la parcimonie. C'est
l'application fil-rouge de la dualité convexe (Partie I) — le pont
P1↔P2.

## Course boundaries

- **Lesson:** `src/routes/part2/lesson4/+page.svelte`
- **Already taught (do not re-teach):** SVM marge rigide, marge souple, noyau,
  et le panneau « Preuve (non demandée) » existant.
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  4-SVM.tex` (les 3 sections SVM) et `course_sources/typst/theorie.typ`
  § « Théorème 3.4 (Borne VC pour le SVM, Vapnik 1995) ». Le panneau reprend
  les formulations de la source et y ajoute la dualité KKT.
- **Where "beyond course" starts:** la dérivation KKT complète (lagrangien,
  dual, complémentarité) est **au-delà** de ce que la source développe →
  « au-delà du cours ».
- **Out of scope:** la théorie de la dualité générale (leçon
  `p1-lesson-dualite-convexe-kkt`), la borne VC SVM (déjà traitée, Th. 3.4).

## Research questions

1. Écrire le primal marge rigide $\min_{w,b}\frac12\|w\|^2$ s.t.
   $y_i(w^\top x_i+b)\ge1$ et son lagrangien avec $\alpha_i\ge0$.
2. Dériver le dual $\max_\alpha\sum_i\alpha_i-\frac12\sum_{i,j}\alpha_i\alpha_j
   y_iy_j x_i^\top x_j$ s.t. $\alpha_i\ge0$, $\sum_i\alpha_iy_i=0$.
3. Montrer par **complémentarité** $\alpha_i[y_i(w^\top x_i+b)-1]=0$ que les
   seuls $x_i$ avec $\alpha_i>0$ sont sur la marge (vecteurs support).
4. Montrer la **parcimonie** : $w=\sum_i\alpha_i y_i x_i$ ne dépend que des
   vecteurs support.
5. Montrer l'apparition du noyau : $x_i^\top x_j\to K(x_i,x_j)$ (et que le
   primal reste inchangé).
6. Cas souple : ajouter $0\le\alpha_i\le C$ et interpréter $\alpha_i=C$.

## Starting references

- Vapnik, *Statistical Learning Theory* (1998), ch. 6 (SVM).
- Boyd & Vandenberghe, *Convex Optimization* (2004), § 9.4 (exemple SVM).
- Shalev-Shwartz & Ben-David, *Understanding Machine Learning* (2014), ch. 15.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `svm-dualite-kkt.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `svm-dualite-kkt.draft.md` — French content draft for an `ExpertPanel`:
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
