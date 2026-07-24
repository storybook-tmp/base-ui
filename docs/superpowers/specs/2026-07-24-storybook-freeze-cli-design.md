# Design: `storybook-freeze` CLI

**Date:** 2026-07-24
**Status:** Approved (design)

## Purpose

Provide an interactive CLI that produces a **frozen git branch** for a machine-learning
experiment by stripping selected classes of documentation content out of the Storybook
corpus. An experiment is defined by a **keep-set** of content facets; everything outside the
keep-set is removed. The exact selection is recorded on the branch so the experiment is
reproducible.

## Core model — one rule

Every removable piece of content maps to a **qualified facet** written `category.leaf`
(e.g. `mdx.examples`, `story.showcase`, `source-jsdoc.props`). The user selects the facets to
**keep**; the CLI strips everything else.

> **Strip content whose qualified facet ∉ keep-set.** The `delete` array lists qualified
> facets that are never offered and are always stripped.

Qualification (by `category.leaf` rather than a bare leaf) is what removes the old
leaf-collision problem: `mdx.examples` and `story.examples` are now distinct, independently
keepable facets, as are `source-jsdoc.props` and `mdx.props`.

### The taxonomy

The taxonomy lives in `apps/storybook/classification-labels.jsonc` (JSONC — comments must be
tolerated by the loader). Its categories are content **sources**, plus a `delete` array:

| Category | Content source | Leaves |
|---|---|---|
| `source-jsdoc` | `packages/react/**/*.tsx` JSDoc | `component`, `props` |
| `csf-jsdoc` | JSDoc inside `*.stories.tsx` | `meta` (above `meta`), `story` (above each story export) |
| `mdx` | per-component `*.mdx` section markers | `general`, `behavior`, `examples`, `do-dont`, `when-to-use`, `anatomy`, `history`, `known-issues`, `a11y`, `brand`, `props`, `styling`, `testing` |
| `general` | whole repo-wide `*.mdx` files, matched by their `<Meta tags={[…]} />` | `general-a11y`, `general-tokens`, `general-setup`, `general-brand`, `general-do-dont`, `general-when-to-use` |
| `story` | story tags in `*.stories.tsx` | `api-ref`, `showcase`, `highlight`, `examples`, `playground`, `tests`, `infra`, `animation`, `styling` |
| `delete` | always-stripped, never offered | `mdx.styling`, `mdx.testing`, `story.infra` |

### Content → facet mapping (deterministic by location)

| Content unit | File location | Qualified facet |
|---|---|---|
| Component JSDoc (block before the exported component) | `packages/react/**/*.tsx` | `source-jsdoc.component` |
| Props/API JSDoc (on `X.Props` interface / members) | `packages/react/**/*.tsx` | `source-jsdoc.props` |
| JSDoc above `meta` | `*.stories.tsx` | `csf-jsdoc.meta` |
| JSDoc above a story export | `*.stories.tsx` | `csf-jsdoc.story` |
| Whole story export (`export const X`) | `*.stories.tsx` | `story.<tag>` |
| MDX section `{/* BEGIN: x */} … {/* END: x */}` (per-component file) | `apps/storybook/src/stories/**/*.mdx` | `mdx.x` |
| Whole MDX file whose `<Meta>` carries a `general-*` tag | repo-wide `*.mdx` (patterns/, overview/, some utilities) | `general.<tag>` — classifies the **entire file** |

### Classification details

- **Offerable facets** = every `category.leaf` across the five content categories, **minus**
  the `delete` array entries. The keep-set is a subset of the offerable facets.
- **Story keep/strip** is keyed on `story.<tag>`, where the tag set is `meta.tags ∪
  story.tags` restricted to recognized `story` leaves. An export is stripped when its
  `story.<tag>` ∉ keep-set, or when it is tagged `story.infra` (always stripped).
- **Descriptor tags** (`base`, `new`, `recreation`, `research`, `kitchen-sink`) are not
  `story` leaves; they are ignored for keep/strip decisions.
- **Two disjoint MDX kinds.** A `*.mdx` file either (a) carries a `general-*` tag on its
  `<Meta>` — a repo-wide doc classified as a whole by `general.<tag>`, removed entirely if
  not kept — or (b) uses `{/* BEGIN … */}` section markers — a per-component doc stripped
  section-by-section via `mdx.*`. In the corpus these sets never overlap (general-tagged
  files contain zero markers), so no per-file precedence is needed.
- **File pruning.** After story-export removal, any `*.stories.tsx` left with **no remaining
  story exports** (only `export default meta`) is deleted. This is what removes the internal
  harness files (`research`/`kitchen-sink` metas whose only exports were `story.infra`).
- **Dangling MDX docs.** A per-component `*.mdx` namespace-imports its CSF file
  (`import * as XStories from './x.stories'`) and renders it via `<Meta of={XStories} />` /
  `<Canvas of={XStories.…} />`. When that CSF file is pruned, the doc would fail to build, so
  any `*.mdx` whose `import * as …` resolves to a removed CSF file is deleted as well. This
  makes MDX processing depend on story results, so stories are processed first.
- **Dangling Canvas references.** When a CSF file *survives* but loses individual story
  exports, each sibling `*.mdx` has its `<Canvas of={Alias.RemovedExport} />` invocations
  removed (matched via the doc's own namespace-import alias). If removing a Canvas leaves a
  subsection heading with no remaining content, the heading is dropped too — cascading up so a
  parent heading is removed when all its subsections empty out.
- **Dead code.** Stripping story exports leaves helper functions and imports orphaned. After
  the corpus pass, each changed `*.stories.tsx` has its unreferenced top-level functions and
  variables removed (oxc reachability, to a fixpoint) and its now-unused imports removed
  (Biome `noUnusedImports`, `--write --unsafe` scoped to that one rule).
- **Aspirational facets.** `story.styling` and `story.playground` have no content in the
  corpus today; they remain offerable no-ops. `mdx.brand` and the `general.*` leaves also
  have no markers today — the marker-scanner simply finds nothing for them.
- **Strict-strip fallback.** A story export with no recognized `story` leaf after merging is
  stripped. In the current corpus this never fires — every real story carries a recognized
  tag — so it is a safety default, not an expected path.

### `classification-labels.jsonc` changes (applied)

Leaf keys are the tag/marker contract and **must not be renamed**; category keys and
descriptions may be reworked. Applied in this design:

- **Added** `mdx.props` ("API reference / props section (MDX)") so the 37× `{/* BEGIN: props
  */}` sections are an independent, keepable facet distinct from `source-jsdoc.props`.
- **Added** `mdx.styling` ("Styling hooks and guidelines (MDX)") to match the 34× styling
  markers, and changed the `delete` array from `story.styling` → `mdx.styling` so the entry
  points at real content. `story.styling` stays as an aspirational (unused) tag.
- **Fixed** the `source-jsdoc.component` description typo.

## Architecture

A new workspace package, `packages/storybook-freeze`, exposing a `tsx` bin and invoked via a
root `package.json` script (e.g. `pnpm experiment:freeze`).

### Modules (each independently testable)

1. **`labels`** — loads `classification-labels.jsonc` (JSONC; comments tolerated), computes
   the offerable facet list (every `category.leaf` minus the `delete` array), and exposes
   `isKept(facet, keepSet)` / `isDeleteFacet(facet)` over qualified `category.leaf` refs.
   Pure; no I/O beyond reading the file.
2. **`tsx-transform`** — given a `.tsx` file and a keep-set, returns the edited source (or a
   "delete whole file" signal). Uses `oxc-parser` to obtain the AST and the comment table
   with byte spans, decides which spans to remove (JSDoc blocks, story exports), and applies
   removals with `magic-string`. Formatting-preserving. Reports whether any named story
   exports remain, so `corpus` can prune emptied files.
3. **`mdx-transform`** — given a `.mdx` file and a keep-set, returns either a "delete whole
   file" signal or the edited source. It first extracts the `<Meta tags={[…]} />` array: if a
   `general-*` tag is present and `general.<tag>` ∉ keep-set, the whole file is dropped.
   Otherwise it removes the byte range of each `{/* BEGIN: x */} … {/* END: x */}` section
   whose `mdx.x` is not kept. A small scanner keyed on the exact `<Meta>` and `BEGIN`/`END`
   contracts — **not** oxc, since MDX is not JavaScript. Nested/duplicate markers of the same
   label are each matched to their nearest `END`.
4. **`canvas-purge`** — given MDX source and a set of `Alias.Export` refs, removes the
   matching single-line `<Canvas of={…} />` invocations and then drops any heading left with a
   whitespace-only body (cascading to parents). Pure text/heading scanner.
5. **`deadcode`** — given `.tsx` source, removes non-exported top-level functions/variables
   whose bindings are unreferenced elsewhere, iterating to a fixpoint. Uses `oxc-parser` +
   `magic-string`; reference counting is liberal so it never removes a still-used declaration.
6. **`biome`** — thin wrapper that runs Biome's `noUnusedImports` (`--write --unsafe --only`)
   over a list of files to delete imports freed by `deadcode`. Resolves the Biome binary via
   `createRequire`.
7. **`corpus`** — enumerates target files: `apps/storybook/src/stories/**/*.{stories.tsx,mdx}`
   and `packages/react/**/*.tsx`. Routes each file to the right transform module, prunes
   (unlinks) any `*.stories.tsx` with no remaining story exports, and — because MDX docs
   namespace-import their CSF file — processes stories before MDX so it can delete any `*.mdx`
   whose `import * as …` resolves to a pruned CSF file and purge Canvas references to exports
   removed from a surviving CSF (via `canvas-purge`). Source files run concurrently.
8. **`git`** — wraps `simple-git`: assert clean working tree, read current HEAD SHA, create
   and check out `experiment/<name>` (fail if it exists), stage, and commit.
9. **`manifest`** — builds and writes `experiment.json` (see below).
10. **`freeze`** — orchestrator: after `corpus`, runs `deadcode` + `biome` over changed
    `*.stories.tsx`, then Prettier, then writes the manifest and commits.
11. **`cli`** — the `@clack/prompts` flow that orchestrates the above.

### Edit engine

- **`.tsx`:** `oxc-parser` for parsing (AST nodes + comments with accurate byte spans) plus
  `magic-string` for surgical byte-range removal. Full-AST regeneration is rejected (noisy
  diffs, fights Prettier). Pure regex is rejected (fragile on JSDoc/exports/nested braces).
- **`.mdx`:** marker-scanner over the `BEGIN`/`END` contract.
- After edits, run **Prettier** over the changed files so diffs stay clean.

### Identifying `source-jsdoc.component` vs `source-jsdoc.props` (approved heuristic)

- `source-jsdoc.component` = the block comment immediately preceding the exported component.
- `source-jsdoc.props` = JSDoc comments on the `X.Props` interface / type and its members.

## Data flow

1. `cli` prints intro, loads `labels`.
2. Multiselect of offerable facets (grouped for display by category — `source-jsdoc`,
   `csf-jsdoc`, `mdx`, `general`, `story`; `delete` entries hidden). Result = keep-set of
   qualified facets.
3. Prompt for experiment **name**; validate to a branch-safe slug; abort if
   `experiment/<name>` already exists.
4. `git`: assert clean tree; capture base HEAD SHA; create + checkout `experiment/<name>`.
5. `corpus` enumerates files; stories are processed first (so pruned CSF paths are known),
   then MDX, with source files running concurrently. Edited files are written; files
   signalled for deletion — general MDX files whose `general.*` facet is not kept,
   `*.stories.tsx` left with no story exports, and `*.mdx` that namespace-import a pruned CSF
   file — are pruned.
6. Dead-code purge: each changed `*.stories.tsx` has unreferenced top-level declarations
   removed (`deadcode`) and then unused imports removed (`biome`).
7. Prettier runs on changed files.
8. `manifest` writes `experiment.json` at repo root.
9. `git` stages all changes and commits.
10. `cli` prints an outro summary (branch, kept facets, files changed, files removed, stories
    removed).

### `experiment.json` shape

```json
{
  "name": "<experiment name>",
  "branch": "experiment/<name>",
  "baseCommit": "<HEAD SHA at fork time>",
  "keptFacets": ["story.showcase", "mdx.props", "source-jsdoc.component", "..."],
  "createdAt": "<ISO 8601 timestamp>",
  "tool": "storybook-freeze@<version>"
}
```

## Git flow

- Library: **`simple-git`** (thin wrapper over the git binary, which is present) over
  `isomorphic-git` (pure-JS, unnecessary here).
- **Require a clean working tree**; refuse otherwise.
- Branch from **current HEAD** (not `master`).
- One commit on `experiment/<name>` containing all strips plus `experiment.json`.
  Commit message: `[storybook-freeze] Freeze experiment <name>`.

## CLI UX (`@clack/prompts`)

- `intro` → `multiselect` (facets, grouped) → `text` (name, validated) → `confirm`
  (summary of what will be removed) → `spinner` (work) → `outro`.
- Cancellation at any prompt aborts cleanly with no git side effects (branch is only created
  after confirmation).

## Error handling

- **Dirty tree:** abort before any change, instruct the user to commit/stash. Follows the
  repo error style (`Base UI:` prefix, what/why/how) where errors are surfaced to users.
- **Branch exists:** abort before checkout; suggest a different name.
- **Parse failure on a file:** report the file path and fail the run (do not silently skip),
  so the frozen branch is never partially transformed.
- **Empty keep-set:** allowed (a maximal-strip experiment) but `confirm` must make the scope
  explicit.
- On any failure after branch creation, leave the branch in place for inspection and report
  what completed; do not attempt automatic rollback of a partially built branch.

## Testing

- **`labels`:** unit tests for JSONC parsing, offerable-list computation (all facets minus
  `delete`), and `isKept`/`isDeleteFacet` on qualified `category.leaf` refs.
- **`tsx-transform`:** fixture `.tsx` inputs → expected outputs for each removal kind
  (component JSDoc, props JSDoc, meta JSDoc, per-story JSDoc, single story export), plus the
  "no remaining exports" signal that drives pruning.
- **`mdx-transform`:** fixture `.mdx` with multiple/adjacent sections → expected outputs;
  cover a kept vs stripped label and duplicate markers; plus a `general-*`-tagged file that
  is kept vs dropped as a whole; plus `starImports`/`starImportSpecifiers` extraction.
- **`canvas-purge`:** Canvas removal, empty-heading drop, parent-cascade, and no-op cases.
- **`deadcode`:** unused function/const removal, cascade, and keep-when-referenced (incl. JSX
  and type positions).
- **`biome`:** temp-dir case proving unused imports are deleted and used ones kept.
- **`corpus`/`git`/`manifest`:** integration test in a temp git repo — clean-tree assertion,
  branch creation, manifest contents, single commit; plus temp-dir cases proving an MDX doc
  that imports a pruned CSF is deleted (while one importing a surviving CSF is kept) and that a
  surviving doc's Canvas for a removed export is purged with its heading.
- **`freeze`:** end-to-end temp git repo — strips content, purges a dead helper + its import,
  writes the manifest, and commits.
- Follow repo conventions: Vitest APIs only, `name.test.ts(x)` beside source, jsdom where
  possible.

## Non-goals (YAGNI)

- No `--config` non-interactive mode (manifest-out only, per decision).
- No dead-code cleanup of helper functions left behind after removing a story export (only
  the export declaration and its JSDoc are removed).
- `general-*` facets classify whole MDX files via their `<Meta>` tag (not `BEGIN/END`
  sections); `general-a11y` and `general-tokens` are defined but unused in the corpus today.
- No cross-branch orchestration or experiment registry beyond the per-branch manifest.
- Dead-code purge is scoped to changed `*.stories.tsx` (the only files where stripping creates
  orphans); `packages/react` source only loses JSDoc comments, so it needs no purge.
- Biome's `noUnusedVariables` only underscore-renames rather than deletes, so unused
  functions/consts are removed by the `deadcode` module instead; Biome handles only imports.
