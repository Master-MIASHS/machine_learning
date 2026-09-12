---
id: p4-lesson-glm-modeles-lineaires-generalises
type: lesson
part: 4
lesson: /part4
anchor: null
title: "Modèles linéaires généralisés (GLM)"
level: m2
priority: 2
status: pending
related: [p2-l2-fisher-lda, p4-l3-regression-lineaire-bayesienne, p4-l1-ols-asymptotique-design-aleatoire]
sources:
  - course_sources/sophie/StatM1S1_2025.pdf
  - course_sources/marine/Cours/CM/coursClassif-2RegLogistique.tex
---

# Modèles linéaires généralisés (GLM)

## Mission

Leçon expert à part entière qui **unifie** la régression linéaire (Partie IV)
et la régression logistique (Partie II) sous un même cadre : les **GLM**.
Famille exponentielle, lien canonique/naturel, IRLS (le M-estimateur
généralisé), vraisemblance et inférence. C'est la leçon qui montre que
« régression linéaire » et « logistique » sont deux cas d'une même machine.

## Course boundaries

- **Anchored to:** Partie IV — Régression (`src/routes/part4/`), avec un fort
  pont vers la régression logistique (Partie II, leçon 2).
- **Already taught (do not re-teach):** régression linéaire multiple + OLS
  (Partie IV), régression logistique (Partie II, leçon 2).
- **Ground truth to read first:** `course_sources/sophie/StatM1S1_2025.pdf`
  (modèle gaussien) et `course_sources/marine/Cours/CM/coursClassif-
  2RegLogistique.tex` (logistique). Le cadre GLM **unificateur** est au-delà de
  ces sources.
- **Where "beyond course" starts:** la formulation GLM, IRLS, famille
  exponentielle — « au-delà du cours », leçon marquée expert.
- **Out of scope:** les GLM non binaires en détail (Poisson, gamma — mention
  seulement), la théorie asymptotique complète (panneau
  `p4-l1-ols-asymptotique-design-aleatoire`).

## Research questions

1. Définir un GLM : $Y\sim$ famille exponentielle $(\theta,\phi)$, lien
   $g(\mathbb E[Y])=x^\top\beta$ ; écrire $p(y\mid x,\beta)=\exp\{[y\theta-b
   (\theta)]/a(\phi)+c(y,\phi)\}$.
2. Montrer que **régression linéaire** = GLM gaussien (lien identité) et
   **logistique** = GLM binomial (lien logit) — le pont central.
3. Présenter **IRLS** (Fisher & Scatchard 1934, Rao 1973) : itération
   « poids + répondant ajusté », et pourquoi c'est un M-estimateur (pont avec
  le panneau robustesse).
4. Donner la matrice de Fisher $X^\top W X$ (variance des coefficients) et
   l'analogie avec $(X^\top X)^{-1}$ de l'OLS.
5. Mentionner les autres cas (Poisson : comptages ; gamma) sans les développer.
6. En une phrase, situer le GLM par rapport au Lasso (GLM pénalisé, Partie V).

## Starting references

- McCullagh & Nelder, *Generalized Linear Models* (2nd ed., 1989).
- Fisher & Scatchard (1934) ; Rao (1973) — IRLS.
- `course_sources/sophie/StatM1S1_2025.pdf` + `coursClassif-2RegLogistique.tex`
  (les deux cas particuliers).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `glm-modeles-lineaires-generalises.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `glm-modeles-lineaires-generalises.draft.md` — French **full-lesson** draft:
   French, M2 level; structured like an expert lesson; every formula
   KaTeX-ready and `String.raw`-safe; narrative blocks; every statement marked
   « au-delà du cours »; "Proposed demos" subsection (ex. IRLS fit logistique)
   + `src/lib/math` module/function needed.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] Lesson structure mirrors an existing expert lesson (lesson3-adam)
- [ ] French draft reads at M2/research level
