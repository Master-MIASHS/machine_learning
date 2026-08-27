# ReguOpt — Audit Remediation Plan

> Generated 2026-08-27. Every file:line anchor below was verified against the
> working tree on that date. **Line numbers may drift by ±2 — always locate the
> target by the quoted content string, not by line number.**
>
> Nothing in this plan is implemented yet. Workstreams (WS) are grouped into
> waves; within a wave the WS touch disjoint files and can run in parallel
> (separate git worktree/branch each). Do not run WS from different waves
> concurrently.

## 0. Ground truth and global rules

Ground truth (Typst) — the only source for course content:

- `typst/optim.typ` → Part I (Optimisation)
- `typst/regularization.typ` → Part II (Méthodes ensemblistes + Régularisation)
- `typst/set_valued.typ` → Part III (Set-valued)
- `typst/theorie.typ` → Parts IV–VII (Bayes, Consistance, Généralisation/VC, Pertes)

Binding rules for every WS (from `AGENTS.md`):

- **R1** — All user-facing copy in French.
- **R2** — Content not present in the Typst sources must be **visibly marked**:
  a `<Callout type="note" title="Au-delà du cours">` wrapping it, or an explicit
  inline sentence ("résultat standard, au-delà du cours", "illustratif, pas une
  simulation exacte"). Never presented as if it came from the notes.
- **R3** — Do not guess component APIs. Read the actual source of any
  `.svelte` component before using or editing it (props live in the file).
- **R4** — New numeric/formula helpers go in `src/lib/math/` with a matching
  `*.test.ts`; import `mulberry32`/`combineSeed` from `src/lib/math/util.ts`
  (do not add new private PRNG copies). Tests check closed forms / invariants,
  not self-consistency.
- **R5** — After each WS, all four must pass:
  `npm run check`, `npm run test:unit`, `npm run lint`, `npm run build`.
- **R6** — Svelte 5 runes only (`$state`, `$derived`, `$derived.by`, `$effect`).

Global decisions:

- **G1 (λ convention).** Canonical = the source form
  `min_w ‖y−Xw‖² + λ‖w‖²` with `w* = (XᵀX + λI)⁻¹Xᵀy`
  (`regularization.typ`, Définition 5.1, ~line 911). Part II lesson4 already
  uses it (unchanged). Part I lesson2 Théorème 2.6.2 switches to it (WS-3).
  Exercise 2.13 keeps its (internally correct) variant plus a one-line
  equivalence note (WS-3).
- **G2 (branding) — PENDING USER DECISION.** Default: keep the current site
  name "Fondations de l'Apprentissage Statistique" (the `<h1>` on `/`) and
  standardize every `<title>` to it. Alternative: the Typst title "Théorie de
  l'Apprentissage Statistique". Both options = the same edits, different string.
  WS-12 implements the default; if the user picks the alternative, swap the string.
- **G3 (numbering).** When adding a source result into a site lesson, use the
  lesson's own block numbers and cite the source numbering in the title, e.g.
  "Convergence du SGD (Proposition 3.11 des notes)".

---

## Wave 1 (parallel — file-disjoint)

### WS-1 — Part I: ContourLandscape / `findCriticalPoints` (bug + tests)

**Files:** `src/lib/math/optimality.ts`, `src/lib/math/optimality.test.ts`
(no change to `src/lib/components/demos/ContourLandscape.svelte` — it calls
`findCriticalPoints` at lines 35–36 and renders markers at 52–58).

**Problem.** Candidate detection (optimality.ts line 101)
`if (gx1 * gx2 < 0 && gy1 * gy3 < 0)` requires a *strict* sign change of both
gradient components inside one grid cell. For the demo defaults — paraboloid
`x²+4y²` and saddle `x²−y²` on the symmetric domain `[-3,3]²`, Rosenbrock on
`[-2,2]×[-1,3]` (see `src/lib/math/test-functions.ts`) — a gradient component
is exactly 0 along a grid line, products are 0 (never `< 0`), **zero candidates
are produced and the demo renders no markers at all**. Existing tests mask the
defect: optimality.test.ts lines 201–209 assert the empty-result behavior (the
comment documents the bug), and the Rosenbrock/saddle tests use
`if (min) { … }` guards that pass vacuously.

**Steps.**

1. `optimality.ts` — replace the candidate scan (lines 83–105) with
   multi-start Newton:
   - build a coarse start grid of 25×25 points over `domain` (include both
     endpoints);
   - run the existing `refineNewton(f, grad, x0, y0, newtonTol, maxIter)`
     (lines 145–186, unchanged) from every start point;
   - keep the existing dedup key (line 116) and Hessian classification
     (lines 120–130) unchanged;
   - keep the exported signature and `CriticalPoint` type unchanged.
2. `optimality.test.ts` — replace the vacuous tests with hard assertions:
   - paraboloid on `[-3,3]²` → exactly 1 point, `type === 'minimum'`,
     `|x| < 1e-3`, `|y| < 1e-3`, `fVal` within 1e-6 of 0;
   - saddle on `[-3,3]²` → contains a point with `type === 'saddle'`,
     `|x|, |y| < 1e-3`;
   - Rosenbrock on `[-2,2]×[-1,3]` → contains `type === 'minimum'` with
     `|x−1| < 1e-3`, `|y−1| < 1e-3`, `gradNormAtPoint < 1e-6`, `fVal < 1e-6`;
   - add: `f = (x,y) => -x*x - y*y`, `grad = (x,y) => [-2*x, -2*y]` on
     `[-3,3]²` → `'maximum'` at (0,0);
   - delete the `if (min)` / `if (found)` guards and the test at lines 201–209.
3. Verify by eye in the dev server: markers appear for paraboloid, rosenbrock,
   saddle, semiDefSaddle presets.

**DoD:** vitest green (new hard tests included), `npm run check` green.

---

### WS-2 — Part I lesson4: CD definition + SGD convergence + batch sizes

**File:** `src/routes/part1/lesson4/+page.svelte` (only).

1. **Définition 4.6 (Coordinate Descent)** — block at ~line 460; formula
   constant `cdUpdate` at line 113.
   - Source: `typst/optim.typ` lines 1023–1060 — CD updates coordinates
     sequentially at iteration k+1 **using already-updated values**:
     `x_i^{(k+1)} = argmin_t f(x_1^{(k+1)}, …, x_{i-1}^{(k+1)}, t, x_i^{(k)}, …, x_d^{(k)})`;
     the "Attention" block stresses immediate reuse of updated values.
   - Current constant (line 113) is the Jacobi form:
     `x^{(k+1)}_j = \arg\min_t f(x^{(k)}_1, \dots, t, \dots, x^{(k)}_d)`.
   - Replace the constant with
     `x^{(k+1)}_j = \arg\min_t\; f\big(x^{(k+1)}_1, \dots, x^{(k+1)}_{j-1},\; t,\; \dots,\; x^{(k)}_d\big)`
     and add one sentence (in or right after the Définition block):
     « Chaque valeur mise à jour est utilisée immédiatement pour les
     coordonnées suivantes : ce n'est pas la méthode de Jacobi. »
   - Optional (source `optim.typ:1061–1095`, sections "Comparaison : CD vs
     Gradient par coordonnées (Optionnel)" and "Stratégies de parcours
     (Optionnel)"): short paragraph contrasting the Jacobi variant (all
     coordinates updated from the state at iteration k) and naming the
     traversal strategies (cyclique, aléatoire, glouton).
2. **Théorème 4.4 (Robbins–Monro)** — block at ~line 378. Not in the source.
   Wrap it (or place immediately before it) with:
   `<Callout type="note" title="Au-delà du cours">Ce critère de convergence
   (Robbins–Monro) est un résultat standard, hors du contenu des notes.</Callout>`.
3. **Add the source's actual SGD convergence result** —
   `typst/optim.typ:944–953`, Proposition 3.11 — as a new `TheoremBlock`
   numbered "4.11" (the lesson's highest existing number is 4.10; 4.5 is
   already taken by ExampleBlock "Plans de décroissance classiques"), placed
   at the end of the SGD section (after ExampleBlock 4.5, ~line 400, before
   Définition 4.6), title "Convergence du SGD (Proposition 3.11 des notes)",
   statement in
   French: « Pour une fonction convexe et L-lisse, avec pas décroissant
   α_k = α/√k, si w̄_K = (1/K)·Σ_{k=1}^K w^{(k)} est la moyenne des itérés,
   alors E[f(w̄_K)] − f(w*) = O(1/√K). »
4. **Mini-batch callout** — "Le compromis coût / variance" (~line 344–352):
   current text claims `B \in [8, 256]`; source `optim.typ:976` says
   « Taille typique en deep learning : b ∈ {32, 64, 128, 256} ». Replace
   `B \\in [8, 256]` with `B \\in \\{32, 64, 128, 256\\}` and adapt the
   sentence (« les tailles typiques en deep learning sont 32, 64, 128, 256 —
   elles donnent le meilleur rapport précision/coût pour la plupart des
   applications »).

**DoD:** R5 all green; French text; no source formula misrepresented.

---

### WS-3 — Part I: lesson1, lesson2, exercices (small fidelity fixes)

**Files:** `src/routes/part1/lesson1/+page.svelte`,
`src/routes/part1/lesson2/+page.svelte`, `src/routes/part1/exercices/+page.svelte`
(no changes to `src/routes/part1/lesson4/+page.svelte` — that is WS-2).

1. `part1/exercices` lines 280–281 — **broken KaTeX** (the literal text
   `donne formula={f22crit} />` is rendered to the user). Current:
   ```
   <KatexInline formula={f22p} /><KatexInline formula={`=0`} /> donne formula={f22crit}
   />. Or <KatexInline formula={f22pp} />, donc c'est un <strong>maximum local</strong> par
   ```
   Replace with:
   ```
   <KatexInline formula={f22p} /> = 0 donne <KatexInline formula={f22crit} />. Or
   <KatexInline formula={f22pp} />, donc c'est un <strong>maximum local</strong> par
   ```
2. `part1/exercices` line 20 — TOC description "20 exercices" for section
   `conditions-minimum`; the section actually contains **23** `ExercisePanel`s
   (verified counts per section: 23 / 20 / 20 / 20). Change that one entry to
   `'23 exercices — minima locaux/globaux…'`. The other three "20 exercices"
   entries are correct.
3. `part1/exercices` line 2327 — « vues à la leçon précédente » refers to the
   logistic regression gradient, which lives in **lesson2**, not lesson4.
   → « vue à la leçon 2 ».
4. `part1/lesson1` line 563 — « que nous établirons formellement dans la
   leçon suivante » is false: lesson2 only mentions it in Exercice 2.1
   (line 297); there is no formal theorem. → « critère standard, rappelé dans
   l'exercice 2.1 de la leçon suivante ».
5. `part1/lesson2` line 448 (ExampleBlock 2.5.2, SVM) — « chaque terme
   t ↦ max(0,1−t) est convexe et croissant » — false: max(0,1−t) is convex and
   **décroissante**. Change « croissant » → « décroissante ». (The conclusion
   "f convexe" stays valid: convex non-increasing ∘ affine is convex.)
6. **Ridge convention (G1)** — `part1/lesson2` constants at lines 132–136,
   Théorème 2.6.2. Align to the source form (`regularization.typ`, Définition
   5.1):
   - `ridgeFormula` (132) → `f_\\lambda(w) = \\|Xw-y\\|^2 + \\lambda\\,\\|w\\|^2`
   - `ridgeHess` (134) → `H = 2X^\\top X + 2\\lambda I_d`
   - `ridgeSolution` (135) → `w^*_\\lambda = (X^\\top X + \\lambda I_d)^{-1} X^\\top y`
   - `ridgePositiveDef` (136) →
     `v^\\top H v = 2\\|Xv\\|^2 + 2\\lambda \\|v\\|^2 \\ge 2\\lambda \\|v\\|^2 > 0, \\quad \\forall v \\neq 0`
   - check the proof paragraph (lines 649–662) and Exercice 2.2 « Comportement
     asymptotique du Ridge » (line 688) read consistently under this convention
     (the λ→0 / λ→∞ limits are unchanged).
   - `RidgePathExplorer` demo already uses the source convention (shrinkage
     `d_i/(d_i+λ)`, line 180 of the demo) — **no change**.
7. `part1/exercices` Exercice 2.13 (line 1380) — its variant
   `(1/2n)‖Xw−y‖² + (λ/2)‖w‖²` is internally correct (Hessian `(1/n)XᵀX + λI`,
   eigenvalues ≥ λ). Keep it, but add one sentence right after the formula:
   « Cette écriture diffère de la Définition 5.1 des notes (‖y−Xw‖² +
   λ‖w‖²) seulement par un changement d'échelle de λ : les deux pénalisations
   sont équivalentes. »

**DoD:** R5 all green.

---

### WS-4 — Part II: lesson2 + lesson3 (arrows, AdaBoost, two demos)

**Files:** `src/routes/part2/lesson2/+page.svelte`,
`src/routes/part2/lesson3/+page.svelte`,
`src/lib/components/demos/OOBErrorTracker.svelte`,
`src/lib/components/demos/FeatureImportanceChart.svelte`,
`src/lib/math/random-forest.ts`.
(Do NOT touch `part2/lesson4` — that is WS-5/WS-6.)

1. `part2/lesson2` lines 61–62 — `errTestFormula`: the variance underbrace has
   the wrong arrow. Context: m = number of features per split (`fTDef`, line
   59: `|\mathcal{F}_t| = m`); the lesson body (line 359+, section
   "Choix du nombre de features par division") says reducing m reduces ρ̄ and
   hence variance — i.e. variance **increases** with m.
   - current variance underbrace: `\searrow \text{ quand } m \nearrow`
   - → `\nearrow \text{ quand } m \nearrow`
   - the bias underbrace (`\nearrow \text{ quand } m \searrow`) is correct —
     leave it.
2. **AdaBoost** — `part2/lesson3` Définition 7.1 (lines 278–305). Source
   Algorithme 4.3 (`regularization.typ:467–520`) has a stop rule the site
   omits:
   - add, after step b (« Calculer l'erreur pondérée »), a step:
     « Si ε_t ≥ 1/2 : arrêter (le classifieur faible ne fait pas mieux que le
     hasard). »
   - third interpretation bullet (lines 317–321: « Si ε_t > 1/2 alors
     α_t < 0 — le modèle est pire que le hasard et sera « inversé » »): in the
     source algorithm this case is unreachable (the algorithm stopped).
     Rewrite: « Dans l'algorithme des notes, on s'arrête dès que
     ε_t ≥ 1/2. Certaines variantes ne s'arrêtent pas et inversent le
     classifieur (α_t < 0) — extension au-delà du cours. » (R2.)
   - leave Théorème 7.2 (margin bound, ~line 452) unchanged — verified correct.
3. `OOBErrorTracker.svelte` — draws fake parametric curves (baseline 0.15,
   `0.2/√k` + wobble, OOB = test + `0.28/√k` noise + `0.08/k`), seeded with
   `Date.now()`, English UI. Minimal honest fix (do **not** rebuild with real
   bootstrap in this WS):
   - deterministic seed: import `mulberry32` from `$lib/math/util` and use a
     fixed seed (e.g. 42); remove the `Date.now()` seeding;
   - translate all UI strings to French (R1);
   - add a visible caption/note: « Courbes illustratives (paramétriques), pas
     de vrais tirages OOB — la forme attendue : OOB ≈ erreur de test, avec
     davantage de bruit. » (R2.)
4. `FeatureImportanceChart.svelte` + `src/lib/math/random-forest.ts` — the
   "impurity" importance is currently the **selection frequency**
   (`scores[featureIdx] += 1`, ~lines 128–148 of the demo), not the Gini
   decrease:
   - in `random-forest.ts`: add a `giniDecrease: number` field to the
     `DecisionStump` interface and compute it in `buildDecisionStump` (the Gini
     costs before/after the split are already computed internally);
   - in the demo: accumulate `importance[featureIdx] += stump.giniDecrease`
     instead of `+= 1`;
   - in `random-forest.ts` (existing debt, AGENTS.md): switch the private
     `makeRng`/`shuffle` to `mulberry32` from `src/lib/math/util.ts`; prefer
     the same for the demo's private Lehmer `makeRng` (its data generation must
     stay deterministic — keep a fixed seed);
   - sanity check: in the demo's generated data, the truly informative feature
     must rank first for the impurity importance.

**DoD:** R5 all green.

---

### WS-5 — Part II: lesson4 (κ numerics, CV refit step, λ note)

**Files:** `src/routes/part2/lesson4/+page.svelte`,
`src/lib/components/demos/IllConditionningExplosionDemo.svelte`.
(Do NOT add new sections here — that is WS-6, Wave 3.)

1. `part2/lesson4` lines 510–539 — the κ numerical application for
   `A = [[1.98, 2.00],[1.00, 1.01]]` has wrong singular values. Correct values
   (from `AᵀA = [[4.9204, 4.97],[4.97, 5.0201]]`, `det(A) = −2×10⁻⁴`):
   - `σ_max ≈ 3.003` → `σ_max ≈ 3.153`
   - `σ_min ≈ 0.000067` → `σ_min ≈ 6.3 \times 10^{-5}`
   - `κ(A) ≈ 15\,000` → `κ(A) \approx 49\,700` (≈ 5×10⁴)
   - everything else in that block is verified correct — do **not** change
     (A⁻¹ = [[−5050, 10000],[5000, −9900]], δy = (0.02, −0.01),
     δx = A⁻¹δy = (−201, 199), ‖δx‖ ≈ 283, relative error ≈ 0.5%).
2. `IllConditionningExplosionDemo.svelte` lines 68–69 —
   `condA = eig2(A)[0] / eig2(A)[1]` uses eigenvalues of the **non-symmetric**
   A (λ_min ≈ −6.7×10⁻⁵) → a negative "condition number" (≈ −44 600) shown in
   the badge at line 196. Fix:
   ```ts
   const eigAtA = eig2(AtA); // AtA already computed at line 67
   const condA = Math.sqrt(eigAtA[0] / eigAtA[1]); // κ = σ_max/σ_min ≈ 49 700
   ```
   and update the badge label (line 195) from « Conditionnement κ(A) — valeurs
   propres » to « Conditionnement κ(A) — valeurs singulières ».
3. **CV procedure** — `part2/lesson4` lines 812–828: the 3-step `<ol>` is
   missing the source's step 4 (`regularization.typ:1189–1202`, "Procédure de
   sélection par CV"): « 4. *Modèle final* : réentraîner sur toutes les données
   avec λ̂. » Add it (as the 4th `<li>` of the list or right after the
   `lambdaOpt` formula — the step must be present and explicit).
4. **λ-convention note (G1)** — `part2/lesson4` lines 106–116 (Ridge section,
   already in source form). Add a short `<Callout type="note">`:
   « Les notes écrivent min ‖y−Xw‖² + λ‖w‖². La convention
   ½‖Xw−y‖²/n + λ‖w‖² utilisée dans d'autres parties du site n'est qu'un
   changement d'échelle de λ : les chemins de régularisation sont identiques. »

**DoD:** R5 all green; demo badge shows ≈ 49 700, consistent with the lesson.

---

### WS-7 — Part III: conformal + Top-K fixes

**Files:** `src/routes/part3/exercices/+page.svelte`,
`src/routes/part3/lesson2/+page.svelte`, `src/routes/part3/lesson1/+page.svelte`,
`src/lib/math/conformal.ts`, new file `src/lib/math/conformal.test.ts`.

1. **Exercice 10.5** (part3/exercices lines 777–801, "Score cumulatif APS") —
   the solution uses the bare sum `s(x,y) = Σ_{j=1}^{r(y)} p̂_{π(j)}(x)`, but
   the source (`set_valued.typ` ~321–327) defines the cumulative score as
   `s(x,y) = 1 − Σ_{j: p̂_j ≥ p̂_y} p̂_j` — the same form lesson2's
   `F_CUMULATIVE` (part3/lesson2 line 99) and `conformal.ts` already use.
   Fix the exercise's solution formula to the `1 − Σ` form and adjust any
   numeric examples accordingly.
2. **Exercice 10.6** (line 803+, "Score SAPS": `Σ + λ(r−k)_+`, citation
   "Saddler et al.") — **not in the source** (no APS/SAPS/Romano/Saddler
   mention anywhere in `set_valued.typ`). Per R2: mark the whole exercise
   "au-delà du cours" (callout or panel header), align its base score to the
   source's `1 − Σ` form, keep the penalty term `λ(r−k)_+` as an illustrative
   extension, and remove or qualify the unverifiable "Saddler et al."
   citation (« variante illustrative, non issue des notes »).
3. `src/lib/math/conformal.ts` lines 33–41 — `conformityScoreCumulative` stops
   at the first tie in rank order; the source sums **all** j with
   `p̂_j ≥ p̂_y` (all ties included). Fix: accumulate `p̂_j` for every j whose
   probability is ≥ `p̂_{trueLabel}` (not "strictly above + one equal").
   Then create `src/lib/math/conformal.test.ts` (module currently untested)
   covering at least: a tied-probability case — e.g. probs `[0.4, 0.3, 0.3]`
   with true label 1 → score = 1 − (0.4 + 0.3 + 0.3) = 0 — and a
   no-tie case checked against the hand-computed value. Both demos
   (`ConformalPredictionDemo`, `ConformityScoreComparison`) call this
   function; verify they still render.
4. `part3/lesson2` — add the source's **product score**
   (`set_valued.typ` ~321: `s(x,S) = 1 − ∏_{y∈S} p̂_y(x)`) next to the
   cumulative score. Also verify the existing citation (Romano, Sesia &
   Candès 2020, callout at lines 360–384) is framed as a bibliographic
   reference for the set-valued conformal framework (the source doesn't
   mention it — keep it, but it must not read as "des notes").
5. **Exercice 9.6** (part3/exercices lines 206–231, "Majoration de l'exactitude
   Top-1") — the claims `Acc@K ≤ K·Acc@1` and `Acc@1 ≥ (1/K)·Acc@K` are
   **false**. Rewrite as a "does it hold?" exercise: expected answer = "Non",
   counterexample: C = 2 classes, p̂ = (0.4, 0.6), Y = 1 almost surely →
   Acc@1 = 0 while Acc@2 = 1.
6. `part3/lesson1` lines ~341–343 — the `InteractiveSection` wrapping
   `AccuracyKCutoff` is **commented out**. Uncomment it with correct props
   (`InteractiveSection.svelte` props: `{ number?, title?, tag?, onInteract? }`):
   `number` matching this lesson's demo numbering (check the other
   `InteractiveSection`s in the file), a French `title`, and
   `onInteract={tracker.trackInteraction}`. It covers part 3 of source
   Exercice 6.1 (`set_valued.typ:162–180`: « Trouvez le K optimal pour
   atteindre 90% d'accuracy de couverture »).

**DoD:** R5 all green, including the new conformal tests.

---

### WS-8 — Part IV: exercices expert page

**File:** `src/routes/part4/exercices/+page.svelte` (only).

1. Line 838 — « théorème 6.5 (Devroye, Györfi & Lugosi) »: the source result
   (theorie.typ, the "Classification is easier than regression" passage —
   locate the exact section in `typst/theorie.typ` before writing; it is in
   the Bayes/chapter-6 region, NOT numbered "Théorème 6.5"). Fix the citation
   to the correct source reference (Devroye–Györfi–Lugosi 1996) without the
   wrong theorem number.
2. Lines 1196–1199 — the conclusion reads « o(MSE) »; the result compares
   classification error to regression error and the correct asymptotic
   involves a **square root**: « o(√MSE) ». Re-derive from the source
   statement in `theorie.typ` and write the source's exact asymptotic.
3. Line 845 — `<InteractiveSection title="Classification is easier than
   regression">` → French title (« Classifier est plus facile que régresser »)
   + add `onInteract={tracker.trackInteraction}` (component:
   `ClassificationIsEasierThanRegression`).
4. The whole expert exercise block (exImplication / exMargin / exFinal,
   lines 85–114) is beyond the course → mark per R2 (e.g. an introductory
   `<Callout type="note" title="Au-delà du cours">` on that section).

**DoD:** R5 all green.

---

### WS-9 — Part V: Cover–Hart + consistency exercises

**Files:** `src/routes/part5/lesson2/+page.svelte`,
`src/routes/part5/exercices/+page.svelte`.

1. `part5/lesson2` — `coverHartBound` (line 69) and the callout at lines
   195–231.
   - The source (`theorie.typ`, section "Consistance du classifieur k-NN",
     ~253–283) only gives an **exercise hint** ("en fonction de l'erreur de
     Bayes L*"); the explicit bound is a site extension → mark per R2
     (callout title "Au-delà du cours" or an explicit sentence).
   - Correct Cover–Hart bound (replace the constant and the callout):
     `R* ≤ limsup_{n→∞} E[R(h_n^{1-NN})] ≤ 2R*(1 − R*/2) < 2R*` for
     0 < R* < 1. The current `limsup = 2E[η(X)(1−η(X))] ≥ R*` (line 69) and
     the second formula at line 221 (`≤ 2(R*)(1−R*) ≤ 2R*`) are both wrong —
     replace them.
   - Strictness: the gap between `2R*(1 − R*/2)` and `R*` is positive for
     every R* ∈ (0,1) (the current « strict dès que R* ∉ {0, 0.5} » is wrong —
     the gap vanishes only at R* ∈ {0,1}).
   - Numeric example: with R* = 0.1 the upper bound is 2 × 0.1 × 0.95 = **0.19**
     (the current 0.18 comes from the wrong formula).
2. `part5/exercices`:
   - **1.3** (lines 105–130): the solution invokes Borel–Cantelli, which is
     not the right tool. Replace with the direct argument:
     C_m = ∪_{n≥m} {R_n − R* > ε} is a decreasing sequence of events with
     C_m ⊂ {limsup_n (R_n − R* > ε)} ⊂ Ω₀ᶜ, hence P(A_n) ≤ P(C_m) ↓ 0.
   - **1.4** (lines 132–163): the counterexample "R(h_n) − R* = n with
     probability 1/n²" is unrealizable — a true risk is bounded in [0,1], and
     for bounded random variables, convergence in probability ⇔ convergence in
     L². Rewrite the exercise: « Peut-on avoir consistance en probabilité sans
     consistance en moyenne quadratique pour une suite de vrais classifieurs ?
     Non — expliquer pourquoi (bornitude des risques). » Expected solution:
     risks live in [0,1]; for bounded variables, prob-consistency implies
     L²-consistency (standard ε-truncation argument); the strict hierarchy
     (prob ⊄ L²) only shows for **unbounded** variables, e.g.
     X_n = n·1_{A_n} with P(A_n) = 1/n².

**DoD:** R5 all green.

---

### WS-10 — Part VI: minors (ε, kernel callout, bias², demos, TODOs, bibliography)

**Files:** `src/routes/part6/lesson2/+page.svelte`,
`src/routes/part6/lesson3/+page.svelte`, `src/routes/part6/exercices/+page.svelte`,
`src/routes/part6/lesson1/+page.svelte`, `src/routes/part6/lesson4/+page.svelte`,
`src/lib/components/demos/SauerGrowthDemo.svelte`,
`src/lib/components/demos/MarginVCExplorer.svelte`, plus the stale-TODO files
listed below.

1. `part6/lesson2` Théorème 3.2 (lines 273–283) — « Pour tout ε,δ∈(0,1) »: the
   ε is superfluous (the statement depends only on δ) → « Pour tout δ∈(0,1) ».
2. `part6/lesson3` lines 292–300 — the kernel-trick callout (SVM dual / kernel
   evaluation) is an extension of the source → mark per R2.
3. `part6/exercices` lines 1404–1405 — residual bias term
   `(1 - n/d)\,\|\beta\|` is missing its square →
   `(1-n/d)^2\,\|\beta\|^2` (re-derive from the source double-descent
   statement in `theorie.typ` before writing: it is a bias² term).
4. `SauerGrowthDemo.svelte` — the growth function uses `m = d` where the
   Sauer–Shelah bound needs `d + 1` (VCdim d → |H| ≤ Σ_{i=0}^{d} C(n,i)).
   Verify against the source VC section (`theorie.typ`, concentration/VC
   chapter) and the demo's own caption, then fix the sum/exponent.
5. `MarginVCExplorer.svelte` — (a) VC dimension shown as `floor(d)` where the
   source says `d + 1` for the relevant class (verify the exact claim and
   caption); (b) when the RHS of the uniform bound exceeds 1, the bound is
   vacuous — add a visible "borne triviale (vacue)" marker.
6. **Stale TODOs** — every remaining `// TODO: confirm these paths/names…` /
   `// TODO: filename/path guessed…` is resolved (the project builds). Remove
   them from: `src/lib/components/demos/` — BayesRiskNoiseDemo (lines 17, 21,
   32), VCShatteringExplorer (13, 17), EmpiricalMeanConvergenceDemo (12, 25),
   ConsistencyConvergenceDemo (12, 26), ConcentrationInequalityExplorer (14,
   28), BayesDecisionExplorer (7, 15), ApproximationEstimationDemo (11, 23),
   UniformConvergenceDemo (14), SauerGrowthDemo (13), MarginVCExplorer (11),
   KNNConsistencyDemo (25), FiniteClassGeneralizationDemo (9) — and the TODO
   comments in `src/lib/math/consistency.test.ts` and
   `src/lib/math/bayes-learning.test.ts`. (If steps 4–5 already required
   opening SauerGrowthDemo/MarginVCExplorer, the TODO removal there happens in
   the same edit.)
7. **Bibliography** (source `theorie.typ:1385+` lists them; the site only has
   inline mentions) — using the existing `BibElement`/bibliography markup
   pattern already present in those files:
   - Hoeffding 1963 → `part6/lesson1/+page.svelte` (Markov/Tchebychev/Hoeffding lesson);
   - Sauer 1972 and Shelah 1972 → `part6/lesson3/+page.svelte` (Sauer–Shelah lemma is taught there);
   - Bach 2024, "Learning Theory from First Principles" → `part6/lesson4/+page.svelte`.

**DoD:** R5 all green.

---

### WS-11 — Part VII: exercises (7.2, 7.7, 7.12) + bibliography

**File:** `src/routes/part7/exercices/+page.svelte` (+ `part7/lesson1|2|3`
bibliography sections only for item 4).

1. **Exercice 7.7** (lines 375–401, part c) — two math errors. For the
   logistic loss with labels in {−1,+1} (source formalisation,
   `theorie.typ:1100–1140`: `C_φ(α,η) = ηφ(α) + (1−η)φ(−α)`):
   - `σ(α)/σ(−α) = e^α` (the site has `e^{2α}` — wrong);
   - minimizer `α* = logit(η) = log(η/(1−η))` (the site has `½·logit(η)` — wrong);
   - `α*(0.9) = ln 9 ≈ 2.197` (the site has ≈ 1.099).
   Fix the `logitSolution` constant, the `eta09` constant, and the surrounding
   text. (The exercise is a site extension of the source's calibration
   formalism — keep it, but make sure it is marked per R2 if it isn't already.)
2. **Exercice 7.2** (lines 180–203, part c) — the source formalization uses
   `y ∈ {−1,+1}` with loss `φ(yf(x))`; the site uses `y ∈ {0,1}` but still
   writes `φ(yf(x))` — for {0,1} labels the cross-entropy is
   `φ((2y−1)f(x))`. Fix: switch the exercise to labels {−1,+1} (preferred,
   matches the source), or add the `(2y−1)` transform explicitly.
3. **Exercice 7.12** (lines 558–576) — the three excess-risk terms are
   **swapped** relative to the source (`theorie.typ` ~1350–1380):
   - A = estimation term `R(h_f̂_S) − R(h_f*)`;
   - B = calibration term `R(h_f*) − R(h_f**)` (zero when f** ∈ F);
   - C = approximation term `R(h_f**) − R*` (zero when φ is calibrated).
   The site's item B says "the class must contain f**" (that is the source's
   C) and item C says "calibration" (that is the source's B) → **swap the
   texts of items B and C**.
4. **Bibliography** — for the Part VII lesson pages, add any source reference
   (`theorie.typ:1385+`) that is cited in the part but missing from that page's
   bibliography block (check `part7/lesson1`, `part7/lesson2`, `part7/lesson3`
   against their inline citations; e.g. Bartlett–Jordan–McAuliffe 2006 is
   already present). Part VI references are WS-10's — no overlap.

**DoD:** R5 all green.

---

### WS-13 — Test debt (new test files only)

**Files:** new `src/lib/math/*.test.ts` files only. **Do not edit existing
modules** (other WS own those).

1. For each math module that is imported by live pages/demos and currently has
   no test, add a `*.test.ts` checked against independently computed closed
   forms / invariants (R4). Candidate list (verify current import status with
   grep before writing; skip any module that turns out to be dead code):
   `prediction-sets`, `regression-conformal`, `margin-analysis`,
   `loss-functions`, `laplace`, `generalization`, `diversity`, `ensemble`,
   `boosting`, `bootstrap`, `tree-utils`, `synthetic-data`, `regression`,
   `regularization`, `bias-variance`, `test-functions`, `util`
   (`conformal.test.ts` is created by WS-7 — do not duplicate it).
2. `src/lib/math/util.ts` tests must at least cover: `mulberry32`
   determinism (same seed → same sequence), distinct streams for distinct
   seeds, and `combineSeed` decorrelation (streams from different
   `combineSeed` outputs don't share a prefix).
3. PRNG consolidation (private `makeRng` copies in existing modules) is
   **out of scope** for this plan — do not refactor existing modules; note in
   the final report which files still carry private PRNGs
   (known: `random-forest.ts` — fixed by WS-4).

**DoD:** `npm run test:unit` green; no behavior change on the site.

---

## Wave 2 (sequential — touches every page)

### WS-12 — Cross-cutting: branding, intro, error page, Adam prev/next, dead code

Run **after Wave 1** (it edits all 33 pages that use prev/next, including the
files other WS touch).

1. **Branding (G2, default)** — standardize every `<title>` suffix to
   "Fondations de l'Apprentissage Statistique":
   - `src/routes/+page.svelte` line 6: `<title>Régularisation et
     Optimisation</title>` → `<title>Fondations de l'Apprentissage
     Statistique</title>`;
   - grep `Régularisation et Optimisation` in `src/routes` — every
     `<svelte:head>`/`<title>… — Régularisation et Optimisation</title>`
     (e.g. part2/lesson2 line 99) gets the new suffix.
   - Acceptance: `grep -r "Régularisation et Optimisation" src/routes` returns
     0 hits in `<title>` tags. (If the user chooses the alternative G2 string,
     use "Théorie de l'Apprentissage Statistique" instead.)
2. **Intro consistency triad** — `src/routes/intro/+page.svelte`: two
   occurrences of « (en probabilité, en espérance, universelle) » (~lines
   90–91 and ~142) → « (en probabilité, en moyenne quadratique, presque
   sûrement — et au sens universel) », matching Définitions 1.2/1.3
   (`theorie.typ:182–283`) and the wording part5/lesson1 already uses
   (line 40).
3. **`src/routes/+error.svelte`** — the whole file is in English ("Page Not
   Found", "Access Denied", "Unauthorized", "Server Error", "Go home") →
   translate to French, keeping structure, status codes, and the "home" link.
4. **Adam expert page prev/next** — `getPrevPage`/`getNextPage`
   (`src/lib/navigation.ts:102–108`) walk the full `PAGES` array (including
   the expert page `/part1/lesson3-adam`), while the sidebar
   (`src/lib/components/layout/Sidebar.svelte` lines 69, 85) hides expert pages
   when `$settings.expertMode` is off. In default mode, "next" from
   part1/lesson3 goes to the hidden Adam page while the sidebar shows
   lesson4. Fix:
   - add to `navigation.ts`:
     ```ts
     export function getAdjacentPages(
       currentPath: string,
       includeExpert: boolean
     ): { prev: PageMeta | undefined; next: PageMeta | undefined } {
       const visible = PAGES.filter((p) => includeExpert || !p.expert);
       const idx = visible.findIndex((p) => p.path === currentPath);
       if (idx < 0) return { prev: undefined, next: undefined };
       return { prev: visible[idx - 1], next: visible[idx + 1] };
     }
     ```
   - in **every** page that currently does
     `const prevMeta = $derived(getPrevPage(meta?.index ?? 0));`
     `const nextMeta = $derived(getNextPage(meta?.index ?? 0));`
     (33 files — `grep -rl "getPrevPage" src/routes`), replace with:
     ```ts
     import { settings } from '$lib/stores/index.js'; // add if not imported
     const { prev: prevMeta, next: nextMeta } = $derived(
       getAdjacentPages(meta?.path ?? '', $settings.expertMode)
     );
     ```
     (the settings store lives in `src/lib/stores/settings.store.ts`,
     re-exported by `$lib/stores/index.js` — the pattern Sidebar.svelte uses).
   - keep `getPrevPage`/`getNextPage` exported unless a project-wide grep shows
     no remaining users; if unused, delete them.
   - verify: in default mode, part1/lesson3 "next" → part1/lesson4; in expert
     mode, part1/lesson3 "next" → part1/lesson3-adam and the Adam page's
     prev/next are lesson3 / lesson4.
5. **Dead code** — rename `src/lib/math/generalisation.test.ts` →
   `src/lib/math/generalization.test.ts` (it tests `generalization.ts`; test
   files are not imported, so a plain rename is safe). Do **not** delete the
   17 untested math modules in this WS — several are imported by demos; a
   deletion audit is follow-up work, not part of this plan.

**DoD:** R5 all green; navigation behavior verified in both modes.

---

## Wave 3 (sequential — large content addition)

### WS-6 — Part II: missing source content (XGBoost/LightGBM/CatBoost, synthèse, LARS)

Run **after Wave 2** (it lands on `part2/lesson3` and `part2/lesson4` after
their nav lines have been rewritten).

Source anchors (read each range before writing; mirror faithfully, French):

- **XGBoost / LightGBM / CatBoost** — `regularization.typ:712–762`
  ("Méthodes modernes" — Limitations du GB classique 714–719, XGBoost
  720–741, LightGBM et CatBoost 742–746, Hyperparamètres critiques 747–762).
  → new `TheorySection` in `src/routes/part2/lesson3/+page.svelte` after the
  Gradient Boosting section + a `tocEntries` entry.
- **Synthèse et comparaison** — `regularization.typ:764–846` (Tableau
  comparatif 766–781, Guide de choix 782–810, Bonnes pratiques 811–846).
  → end of `src/routes/part2/lesson3/+page.svelte` (it closes the
  "méthodes ensemblistes" chapter) + `tocEntries` entry.
- **LARS** — `regularization.typ:1038–1060` (Algorithme 5.1 "LARS simplifié" —
  3 steps: initialisation; boucle (variable la plus corrélée au résidu, ajout
  à l'actif, déplacement équiangulaire); événements (nouvelle variable
  maximalement corrélée; coefficient actif atteint zéro — modification Lasso)).
  → `src/routes/part2/lesson4/+page.svelte`, in the Lasso-path section (near
  the existing CD/Lasso-path content, ~line 625+), as a `DefinitionBlock`
  "Algorithme LARS (Least Angle Regression)".

Rules: R1–R3, G3 (use the lesson's block numbering, cite source algorithm
numbers in titles); no content beyond what the source states; the "Hyperparamètres
critiques" table is reproduced faithfully from the source.

**DoD:** R5 all green; a source-reader can verify every statement line by line.

---

## Wave map and verification

| Wave | WS | Files (exclusive) |
|---|---|---|
| 1 (parallel) | WS-1 | math/optimality.ts, math/optimality.test.ts |
| 1 | WS-2 | part1/lesson4 |
| 1 | WS-3 | part1/lesson1, part1/lesson2, part1/exercices |
| 1 | WS-4 | part2/lesson2, part2/lesson3, OOBErrorTracker, FeatureImportanceChart, math/random-forest.ts |
| 1 | WS-5 | part2/lesson4, IllConditionningExplosionDemo |
| 1 | WS-7 | part3/lesson1, part3/lesson2, part3/exercices, math/conformal.ts, math/conformal.test.ts (new) |
| 1 | WS-8 | part4/exercices |
| 1 | WS-9 | part5/lesson2, part5/exercices |
| 1 | WS-10 | part6/lesson1..4, part6/exercices, SauerGrowthDemo, MarginVCExplorer, 12 demo TODO files, 2 test-file TODOs |
| 1 | WS-11 | part7/exercices, part7/lesson1..3 (bibliography only) |
| 1 | WS-13 | new math/*.test.ts files only |
| 2 (alone) | WS-12 | navigation.ts, all 33 pages (nav lines), +page.svelte, intro, +error.svelte, generalisation.test.ts rename |
| 3 (alone) | WS-6 | part2/lesson3, part2/lesson4 |

Global final check (after Wave 3): `npm run check`, `npm run test:unit`,
`npm run lint`, `npm run build` — all green — plus a visual pass over the
touched demos (ContourLandscape markers, IllConditionning κ badge ≈ 49 700,
FeatureImportanceChart ordering, OOBErrorTracker French labels,
AccuracyKCutoff live in part3/lesson1, Adam prev/next in both modes).
