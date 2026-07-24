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
| `general` | repo-wide `*.mdx` markers | `general-a11y`, `general-tokens`, `general-setup`, `general-brand`, `general-do-dont`, `general-when-to-use` |
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
| MDX section marker `x` (repo-wide docs file) | repo-wide `*.mdx` | `general.x` (none exist today) |

### Classification details

- **Offerable facets** = every `category.leaf` across the five content categories, **minus**
  the `delete` array entries. The keep-set is a subset of the offerable facets.
- **Story keep/strip** is keyed on `story.<tag>`, where the tag set is `meta.tags ∪
  story.tags` restricted to recognized `story` leaves. An export is stripped when its
  `story.<tag>` ∉ keep-set, or when it is tagged `story.infra` (always stripped).
- **Descriptor tags** (`base`, `new`, `recreation`, `research`, `kitchen-sink`) are not
  `story` leaves; they are ignored for keep/strip decisions.
- **File pruning.** After story-export removal, any `*.stories.tsx` left with **no remaining
  story exports** (only `export default meta`) is deleted. This is what removes the internal
  harness files (`research`/`kitchen-sink` metas whose only exports were `story.infra`).
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
3. **`mdx-transform`** — given a `.mdx` file and a keep-set, removes the byte range of each
   `{/* BEGIN: x */} … {/* END: x */}` section whose label is not kept. A small
   marker-scanner keyed on the exact `BEGIN`/`END` contract — **not** oxc, since MDX is not
   JavaScript. Nested/duplicate markers of the same label are each matched to their nearest
   `END`.
4. **`corpus`** — enumerates target files: `apps/storybook/src/stories/**/*.{stories.tsx,mdx}`
   and `packages/react/**/*.tsx`. Routes each file to the right transform module, and prunes
   (unlinks) any `*.stories.tsx` reported as having no remaining story exports.
5. **`git`** — wraps `simple-git`: assert clean working tree, read current HEAD SHA, create
   and check out `experiment/<name>` (fail if it exists), stage, and commit.
6. **`manifest`** — builds and writes `experiment.json` (see below).
7. **`cli`** — the `@clack/prompts` flow that orchestrates the above.

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
5. `corpus` enumerates files; each is routed to `tsx-transform` or `mdx-transform` with the
   keep-set. Edited files are written; `*.stories.tsx` left with no story exports are pruned.
6. Prettier runs on changed files.
7. `manifest` writes `experiment.json` at repo root.
8. `git` stages all changes and commits.
9. `cli` prints an outro summary (branch, kept facets, files changed, files removed, stories
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
  cover a kept vs stripped label and duplicate markers.
- **`corpus`/`git`/`manifest`:** integration test in a temp git repo — clean-tree assertion,
  branch creation, manifest contents, single commit.
- Follow repo conventions: Vitest APIs only, `name.test.ts(x)` beside source, jsdom where
  possible.

## Non-goals (YAGNI)

- No `--config` non-interactive mode (manifest-out only, per decision).
- No dead-code cleanup of helper functions left behind after removing a story export (only
  the export declaration and its JSDoc are removed).
- No handling of `general-*` labels as MDX markers (none exist in the corpus today); the
  marker-scanner keys on whatever markers are present, so they need no special case.
- No cross-branch orchestration or experiment registry beyond the per-branch manifest.
