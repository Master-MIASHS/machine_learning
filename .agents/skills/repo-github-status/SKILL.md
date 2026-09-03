---
name: repo-github-status
description: Check the local repository with git (commits, branches, working tree, unpushed changes) and GitHub server-side state with gh (GitHub Pages/website deployment, CI/Actions runs, issues, pull requests). Use when asked about repository status, whether the site or page is published/deployed, CI, issues, or PRs.
---

# Repository and GitHub status

Two tools, two different sources of truth. Pick the right one per question:

- **`git`** answers questions about the **local repository** and the remote refs it has
  fetched: working tree, commits, branches, what is unpushed, what a commit changed.
- **`gh`** answers questions about **GitHub's server-side state**: GitHub Pages / website
  deployment, CI/Actions runs, issues, pull requests, releases.

They are complementary — neither alone gives the full picture. A clean `git status` tells
you nothing about whether the site is live; a green Pages build tells you nothing about
whether your local work is even committed.

## Use `git` for the repository (local) state

- Working tree: `git status --short`
- Recent commits: `git log --oneline -10`
- Current branch and HEAD: `git branch --show-current`, `git rev-parse HEAD`
- Unpushed commits: `git log --oneline @{u}..HEAD` (empty ⇒ HEAD is on the upstream/origin)
- What a commit changed: `git show --stat <sha>`, `git diff`
- Remotes: `git remote -v`

`git` only knows what the remote looked like at the last fetch. **`git fetch` before
comparing local vs remote**, otherwise "unpushed" / "ahead/behind" is stale. `git` never
sees GitHub's live deployment, CI, or issue state.

## Use `gh` for GitHub (server-side) state

- CI / Actions runs: `gh run list`, `gh run view <id>`,
  `gh run view <id> --json headSha,conclusion,status`
- GitHub Pages (the website) status + URL: `gh api repos/<owner>/<repo>/pages`
  → fields `status`, `html_url`, `source.branch`
- Issues: `gh issue list`, `gh issue view <n>`
- Pull requests: `gh pr list`, `gh pr view <n>`, `gh pr checks <n>`
- Releases: `gh release list`
- Auth check (gh requires it; git does not): `gh auth status`

## Verifying "is the last commit published / deployed?"

The concrete sequence that ties the two tools together:

1. `git rev-parse HEAD` → the commit you care about.
2. `git fetch && git log --oneline @{u}..HEAD` → confirm nothing is unpushed
   (empty ⇒ HEAD is on origin). Uncommitted work is never published.
3. `gh run list --limit 10` → find the CI/deployment run for that commit.
4. `gh run view <id> --json headSha,conclusion` → confirm `headSha` **equals** HEAD and
   `conclusion` is `success`.
5. `gh api repos/<owner>/<repo>/pages` → confirm `status` is `built` and read `html_url`.
6. Report the live URL plus the specific route/lesson path.

A build succeeding is **not** the same as the Pages deployment succeeding — when there are
two runs (build, then deploy), check that **both** are green before calling it published.

## SvelteKit on GitHub Pages: HTTP 404 is expected here

This site is built with `@sveltejs/adapter-static` configured with only
`fallback: '404.html'` (no prerendered entries), so the `build/` directory contains **no
`index.html`**. GitHub Pages therefore answers **HTTP 404 for every route** — including
the root — while serving the SPA fallback HTML as the body; the SvelteKit client router
then hydrates and renders the real page in the browser.

Consequences for verification:

- `curl -o /dev/null -w "%{http_code}"` returning **404 is NOT evidence the site is
  down**. Do not report the deployment as broken based on the status code alone.
- To confirm the site is actually serving the app, inspect the **body**: it should be the
  course's own HTML (e.g. `<title>Fondations de l'Apprentissage Statistique</title>` plus
  the `/_app/immutable/...` modulepreload links), not GitHub's default 404 page.
- The trustworthy "is it published" signals remain: Pages `status` == `built`, the
  "Build & Deploy" run green on the commit's `headSha`, and the latest `gh-pages`
  commit message (`deploy: <sha>`) matching a recent `main` commit.
- Only if the body is GitHub's stock 404 page, or Pages `status` is not `built`, is a 404
  a real failure.

## This repo (concrete values)

- Owner/repo: `Master-MIASHS/machine_learning`
- Remote `origin`: `git@github.com:Master-MIASHS/machine_learning.git`
- Pages: source branch `gh-pages` (build_type `legacy`), live at
  `https://master-miashs.github.io/machine_learning/`
- Deployment flow: pushing to `main` triggers the **"Build & Deploy"** workflow, which
  builds the Svelte site and pushes it to `gh-pages`; GitHub then runs the automatic
  **"pages build and deployment"** on `gh-pages`.
- So "published" = "Build & Deploy" success on the commit's `headSha`, **and** the
  subsequent "pages build and deployment" success, **and** Pages `status` == `built`.

## Gotchas

- `gh run view --json` exposes `headSha`, **not** `commit` (requesting `commit` errors).
- `git status` reflects the working tree, not the deployment — a dirty tree is not a
  broken site, and a clean tree does not prove the site is current.
- Stale remote view: always `git fetch` before answering "am I up to date with GitHub?"
