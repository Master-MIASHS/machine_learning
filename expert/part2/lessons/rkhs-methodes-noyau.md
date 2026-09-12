---
id: p2-lesson-rkhs-methodes-noyau
type: lesson
part: 2
lesson: /part2
anchor: null
title: "Espaces de Hilbert à noyau (RKHS) et méthodes à noyau"
level: m2
priority: 1
status: pending
related: [p2-l4-svm-dualite-kkt, p2-l1-estimateurs-noyau-nadaraya-watson, p9-lesson-ntk-generalisation-moderne]
sources:
  - course_sources/marine/Cours/CM/coursClassif-4-SVM.tex
  - course_sources/marine/Cours/CM/coursClassif-1-Intro.tex
---

# Espaces de Hilbert à noyau (RKHS) et méthodes à noyau

## Mission

Leçon expert à part entière qui **unifie** deux morceaux du cours : les
méthodes locales (k-NN, leçon 1) et la SVM à noyau (leçon 4) via la théorie
des **espaces de Hilbert à noyau** (RKHS). Mercer, théorème du représentant,
noyaux universels, régression à noyau ridge (KRR), et le lien avec la
généralisation moderne (NTK, Partie IX). C'est la leçon qui donne le socle
fonctionnel aux noyaux utilisés dans la SVM.

## Course boundaries

- **Anchored to:** Partie II — Classification (`src/routes/part2/`), entre la
  leçon 1 (k-NN) et la leçon 4 (SVM à noyau).
- **Already taught (do not re-teach):** k-NN (leçon 1), noyaux PSD et feature
  maps (leçon 4, demo `KernelPSDExplorer`/`FeatureMapExplorer`), SVM (leçon 4).
- **Ground truth to read first:** `course_sources/marine/Cours/CM/coursClassif-
  4-SVM.tex` § « Le cas linéairement non séparable : SVM à noyau » (le noyau y
  est introduit) et `coursClassif-1-Intro.tex` (k-NN). La théorie RKHS complète
  est **au-delà** de ces sources.
- **Where "beyond course" starts:** Mercer, RKHS, théorème du représentant,
  noyaux universels, KRR — « au-delà du cours », leçon marquée expert.
- **Out of scope:** NTK en détail (leçon expert
  `p9-lesson-ntk-generalisation-moderne`), la preuve KKT SVM (panneau
  `p2-l4-svm-dualite-kkt`).

## Research questions

1. Énoncer le théorème de Mercer : $K\ge0$ (PSD) $\iff$ existence d'un espace
   de features et $\phi$ avec $K(x,x')=\langle\phi(x),\phi(x')\rangle$.
2. Définir un RKHS $\mathcal H_K$ et son noyau reproduisant
   $f(x)=\langle f,K(\cdot,x)\rangle$.
3. Énoncer le **théorème du représentant** : le minimiseur d'une perte
   empirique + norme $\|f\|_{\mathcal H}^2$ s'écrit $f^\star=\sum_i\alpha_i
   K(\cdot,x_i)$.
4. Définir la **régression à noyau ridge** (KRR) et son solution en forme
   close (matrice grammatiale).
5. Définir un **noyau universel** et citer un exemple (Gaussian/RBF) ; lien
   avec la consistance.
6. Relier : (a) la SVM à noyau = ERM dans un RKHS ; (b) k-NN = noyau uniforme
   local (pont leçon 1) ; (c) NTK = noyau tangent (pont Partie IX).

## Starting references

- Schölkopf & Smola, *Learning with Kernels* (2002).
- Aronszajn, « Theory of Reproducing Kernels » (1944, Pacific J. Math.).
- Rahimi & Recht, « Random Features for Large-Scale Kernel Machines » (2007,
  NeurIPS).
- Müller, Kraskowski, Smola (2005) — noyaux universels.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `rkhs-methodes-noyau.research.md` — verified claims only, each with an exact
   citation. Flag **UNVERIFIED** anything not verified.
2. `rkhs-methodes-noyau.draft.md` — French **full-lesson** draft: French, M2
   level; structured like an expert lesson; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every statement marked « au-delà du
   cours »; "Proposed demos" subsection (ex. feature map 2D→RKHS, KRR fit) +
   `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
