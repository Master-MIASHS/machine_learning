---
id: p{part}-l{lesson}-{slug}
type: panel            # panel | lesson
part: {part}
lesson: /part{part}/lesson{lesson}   # route path (panels); for lessons: primary part only
anchor: {h2-id}            # h2 id where the panel will be inserted (panels only)
title: "French title of the topic"
level: m2              # m1+ | m2 | research
priority: 1            # 1 = high, 2 = medium, 3 = research frontier
status: pending        # pending → researching → drafted → reviewed → implemented
related: []            # ids of related briefs (bridges, deeper versions)
sources:               # ground-truth files the agent must read first
  - course_sources/...
---

# {French title}

## Mission

Two to four sentences: what this expert content must teach, the precise
conceptual gap it fills for a high-level student or researcher, and why it
matters in the context of the surrounding lesson (or of the whole course).

## Course boundaries

- **Lesson:** `src/routes/part{part}/lesson{lesson}/+page.svelte`
- **Already taught (do not re-teach):** <short list of the lesson's h2 topics>
- **Ground truth to read first:** <`course_sources/` file(s) + exact section(s),
  e.g. `course_sources/typst/optim.typ` § "Momentum et méthodes accélérées">
- **Where "beyond course" starts:** <one line stating the boundary — everything
  this panel adds is NOT in `course_sources/` and must stay visibly marked>
- **Out of scope (do not cover):** <topics that belong to another part/lesson>

## Research questions

Numbered, concrete, each answerable with a citable primary source. The agent
must answer every one of these in `<slug>.research.md`.

1. ...
2. ...
3. ...

## Starting references

Seed bibliography to verify and extend (books, papers, arXiv). The agent must
confirm each against a primary source and add anything missing.

- ...
- ...

## Deliverable (agent contract)

You are a research agent for this master's-level course (content in French).
Produce exactly two files next to this brief:

1. `<slug>.research.md` — verified claims only. Every theorem, formula, result
   or historical fact carries an exact citation (author, year, venue,
   theorem/section number, URL where available). Anything you could not verify
   against a primary source is flagged **UNVERIFIED**. No restatement from
   memory.
2. `<slug>.draft.md` — the French content draft, ready to become an
   `ExpertPanel` (or a full expert lesson). Requirements:
   - Written in French, master's/research level.
   - Every formula KaTeX-ready and safe inside `String.raw` backticks.
   - Structured with the project's narrative blocks (`TheoremBlock`,
     `DefinitionBlock`, `KatexInline`, `KatexBlock`, `ExampleBlock`).
   - Every statement beyond `course_sources/` visibly marked « au-delà du
     cours » / « illustration, pas une simulation exacte ».
   - Optional "Proposed demo" subsection: widget name + the `src/lib/math`
     module + the function(s) it would need.

Hard rules: do NOT modify `src/`, `course_sources/`, or this brief. Write only
the two output files. Respect AGENTS.md content-fidelity rules throughout.

## Verification checklist

- [ ] Every theorem/proof step checked against a primary source (not memory)
- [ ] No beyond-course claim presented as course content
- [ ] All references complete (author, year, venue, link)
- [ ] All formulas valid KaTeX and `String.raw`-safe
- [ ] `course_sources/` file + section cited for the course boundary
- [ ] French draft reads at M2/research level
