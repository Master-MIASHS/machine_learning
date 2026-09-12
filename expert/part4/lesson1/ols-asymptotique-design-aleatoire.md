---
id: p4-l1-ols-asymptotique-design-aleatoire
type: panel
part: 4
lesson: /part4/lesson1
anchor: estimateur-mc
title: "OLS en design aléatoire : asymptotique et Cramér–Rao"
level: m2
priority: 2
status: pending
related: [p4-l1-frisch-waugh-lovell, p4-l3-bootstrap-theorie]
sources:
  - course_sources/sophie/StatM1S1_2025.pdf
---

# OLS en design aléatoire : asymptotique et Cramér–Rao

## Mission

La leçon traite l'OLS sous **design fixe** et hypothèse gaussienne (H3). Ce
panneau élargit au **design aléatoire** ($X_i$ i.i.d., $Y_i=x_i^\top\beta+\varepsilon_i$)
: consistance, normalité asymptotique $\sqrt n(\hat\beta-\beta)\to
\mathcal N(0,\sigma^2 Q^{-1})$, et la borne de Cramér–Rao. C'est le cadre
asymptotique qui sous-tend l'inférence moderne, indépendamment de la
gaussianité.

## Course boundaries

- **Lesson:** `src/routes/part4/lesson1/+page.svelte`
- **Already taught (do not re-teach):** modèle, OLS (Th. 1), résidus,
  $\hat\sigma^2$, sommes de carrés, $R^2$.
- **Ground truth to read first:** `course_sources/sophie/StatM1S1_2025.pdf`
  (Théorème 1, Gauss–Markov, lois d'échantillonn sous H3). Le panneau
  généralise hors H3 (design aléatoire, asymptotique).
- **Where "beyond course" starts:** design aléatoire, CLT pour $\hat\beta$,
  Cramér–Rao, absents de `course_sources/` → « au-delà du cours ».
- **Out of scope:** le bootstrap (panneau `p4-l3-bootstrap-theorie`), la
  régression bayésienne (panneau `p4-l3-regression-lineaire-bayesienne`).

## Research questions

1. Énoncer le modèle en design aléatoire : $(X_i,Y_i)$ i.i.d.,
   $\mathbb E[\varepsilon\mid X]=0$, $\operatorname{Var}(\varepsilon\mid X)=\sigma^2$,
   $Q=\mathbb E[XX^\top]\succ0$.
2. Prouver la **consistance** $\hat\beta\xrightarrow{p}\beta$ (LoI + $Q\succ0$).
3. Établir la **normalité asymptotique**
   $\sqrt n(\hat\beta-\beta)\xrightarrow{d}\mathcal N(0,\sigma^2 Q^{-1})$ (CLT).
4. Donner la **borne de Cramér–Rao** pour $\operatorname{Var}(\hat\beta)$ et
   montrer que l'OLS l'atteint (efficacité) dans le cas gaussien.
5. Relier : pourquoi la gaussienne (H3) n'est pas nécessaire pour l'inférence
   asymptotique, mais l'est pour l'inférence exacte (leçon 3).

## Starting references

- Wooldridge, *Introductory Econometrics* (2020), ch. 6–7 (design aléatoire,
  asymptotique).
- Hayashi, *Econometrics* (2000), ch. 3 (CLT, Cramér–Rao).
- `course_sources/sophie/StatM1S1_2025.pdf` (Gauss–Markov, Th. 1–2).

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `ols-asymptotique-design-aleatoire.research.md` — verified claims only, each
   with an exact citation. Flag **UNVERIFIED** anything not verified.
2. `ols-asymptotique-design-aleatoire.draft.md` — French content draft for an
   `ExpertPanel`: French, M2/research level; every formula KaTeX-ready and
   `String.raw`-safe; narrative blocks; every beyond-course statement marked
   « au-delà du cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
