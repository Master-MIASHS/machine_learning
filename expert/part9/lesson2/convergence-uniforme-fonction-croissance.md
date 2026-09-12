---
id: p9-l2-convergence-uniforme-fonction-croissance
type: panel
part: 9
lesson: /part9/lesson2
anchor: cas-separable
title: "Convergence uniforme et fonction de croissance"
level: m2
priority: 2
status: pending
related: [p9-l1-mc-diarmid-pac, p9-l3-rademacher-complexity-vc]
sources:
  - course_sources/typst/theorie.typ
---

# Convergence uniforme et fonction de croissance

## Mission

La leçon établit la généralisation pour une classe **finie** (Théorèmes 3.1–3.2)
via un union bound en $2^{|H|}$. Ce panneau explique pourquoi cette borne est
inutilisable dès que $|H|=\infty$, et introduit la **fonction de croissance**
$\Pi_H(n)$ (nombre maximal de dichotomies de $n$ points) — le pont entre le cas
fini et la borne VC : remplacer $2^{|H|}$ par $\Pi_H(n)$, qui est polynomial en
$n$ quand la dimension VC est finie (Sauer–Shelah).

## Course boundaries

- **Lesson:** `src/routes/part9/lesson2/+page.svelte`
- **Already taught (do not re-teach):** cas séparable (Th. 3.1), cas non
  séparable (Th. 3.2), comparaison des deux régimes.
- **Ground truth to read first:** `course_sources/typst/theorie.typ` §
  « Majoration de l'erreur de généralisation : cas fini » (Th. 3.1, 3.2) et
  l'introduction de la VC (Sauer–Shelah) en § « Cas $|cal(H)|=\infty$ ». Le
  panneau développe le passage fini→VC via la fonction de croissance.
- **Where "beyond course" starts:** la fonction de croissance en détail et le
  lien explicite avec le union bound — « au-delà du cours ».
- **Out of scope:** la dimension VC et Sauer–Shelah (leçon 3).

## Research questions

1. Rappeler la borne du cas fini (Th. 3.1/3.2) : union bound en $2^{|H|}$ (ou
   $|H|$) — pourquoi elle diverge si $|H|=\infty$.
2. Définir la **fonction de croissance** $\Pi_H(n)=\max_{x_1..x_n}|\{(h(x_1),..,
   h(x_n)):h\in H\}|$.
3. Montrer que remplacer $2^{|H|}$ par $2\Pi_H(n)$ dans le union bound donne une
   borne valable pour tout $H$ (fini ou infini).
4. Énoncer (sans prouver) **Sauer–Shelah** : si $d=\mathrm{VCdim}(H)$, alors
   $\Pi_H(n)\le(en/d)^d$ — polynomial en $n$ (rattachement leçon 3).
5. En une phrase, pourquoi la fonction de croissance est « le bon compteur »
   (pas $|H|$).

## Starting references

- Vapnik & Chervonenkis, « On the Uniform Convergence of Certain Sums and Their
  Application to the Learning Problem » (1974, Theory Probab. Appl.).
- `course_sources/typst/theorie.typ` § cas fini + VC.
- Devroye, Györfi, Lugosi, *A Probabilistic Theory of Pattern Recognition*
  (1996), ch. 8.

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `convergence-uniforme-fonction-croissance.research.md` — verified claims
   only, each with an exact citation. Flag **UNVERIFIED** anything not
   verified.
2. `convergence-uniforme-fonction-croissance.draft.md` — French content draft
   for an `ExpertPanel`: French, M2/research level; every formula KaTeX-ready
   and `String.raw`-safe; narrative blocks; every beyond-course statement
   marked « au-delà du cours »; optional "Proposed demo" subsection.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
