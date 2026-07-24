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

Every removable piece of content carries a **label**. The user selects the facets to
**keep**; the CLI strips everything else.

> **Strip content whose label ∉ keep-set.** Labels in the `delete` category are never
> offered and are always stripped.

### Label → content sources

| Content unit | File location | Label source |
|---|---|---|
| Whole story file | `apps/storybook/src/stories/**/*.stories.tsx` | a `delete`-category tag on `meta.tags` (`infra` / `research` / `kitchen-sink`) → **remove entire file** |
| Story export (`export const X`) | `*.stories.tsx` | its recognized `story`-group tag (`highlight`, `api-ref`, `showcase`, `examples`, `playground`, `tests`, `animation`, `infra`) |
| Component-description JSDoc above `meta` | `*.stories.tsx` | new leaf `story.component` |
| Per-story JSDoc above each export | `*.stories.tsx` | new leaf `story.story` |
| Component JSDoc | `packages/react/**/*.tsx` | `component.jsdoc` |
| Props / API JSDoc | `packages/react/**/*.tsx` | `component.props` |
| MDX section `{/* BEGIN: x */} … {/* END: x */}` | `apps/storybook/src/stories/**/*.mdx` | the marker name `x` |

### Classification details

- A story's effective label set is `meta.tags ∪ story.tags`, restricted to **recognized**
  classification leaves.
- **Descriptor tags** (`base`, `new`, `recreation`) are not classification facets. They are
  ignored: they never trigger a strip, and their presence never keeps content on their own.
- **Dedup by leaf, delete wins.** Some leaf names appear in more than one category
  (`infra` in both `delete` and `story`; `examples` in both `component` and `story`;
  `props` is a `component` leaf and also an MDX marker). The offerable facet list is
  *all leaves minus the `delete`-category leaves*. A leaf that appears in `delete` is never
  offered and is always stripped, even when it also appears elsewhere.
- **Keep-set is keyed by leaf label**, applied uniformly across every content type. Keeping
  `examples` keeps both the MDX `examples` section and `examples`-tagged stories.
- **Strict-strip fallback.** A story export with no recognized story-group tag after merging
  is stripped. In the current corpus this never fires, because every real story carries a
  recognized tag — it is a safety default, not an expected path.

### `classification-labels.json` changes

Leaf keys are the tag/marker contract and **must not be renamed**. Category keys and all
descriptions may be reworked for clarity. Changes:

- **Add** to `story`:
  - `component`: "Component description JSDoc in the CSF meta"
  - `story`: "Per-story description JSDoc in CSF"
- **Add** to `delete`:
  - `kitchen-sink`: "Whole-file Chromatic snapshot infra"
  - `research`: "Whole-file internal harness / research tooling, kept out of the sidebar"
- **Fix** the truncated `delete.infra` description and disambiguate the `infra` / `examples`
  / `props` overlaps in description text.

## Architecture

A new workspace package, `packages/storybook-freeze`, exposing a `tsx` bin and invoked via a
root `package.json` script (e.g. `pnpm experiment:freeze`).

### Modules (each independently testable)

1. **`labels`** — loads `classification-labels.json`, computes the offerable facet list
   (leaves minus `delete` leaves), and exposes `isKept(label)` / `isDeleteLabel(label)`
   given a keep-set. Pure; no I/O beyond reading the JSON.
2. **`tsx-transform`** — given a `.tsx` file and a keep-set, returns the edited source (or a
   "delete whole file" signal). Uses `oxc-parser` to obtain the AST and the comment table
   with byte spans, decides which spans to remove (JSDoc blocks, story exports, whole-file
   marker), and applies removals with `magic-string`. Formatting-preserving.
3. **`mdx-transform`** — given a `.mdx` file and a keep-set, removes the byte range of each
   `{/* BEGIN: x */} … {/* END: x */}` section whose label is not kept. A small
   marker-scanner keyed on the exact `BEGIN`/`END` contract — **not** oxc, since MDX is not
   JavaScript. Nested/duplicate markers of the same label are each matched to their nearest
   `END`.
4. **`corpus`** — enumerates target files: `apps/storybook/src/stories/**/*.{stories.tsx,mdx}`
   and `packages/react/**/*.tsx`. Routes each file to the right transform module.
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

### Identifying `component.jsdoc` vs `component.props` (approved heuristic)

- `component.jsdoc` = the block comment immediately preceding the exported component.
- `component.props` = JSDoc comments on the `X.Props` interface / type and its members.

## Data flow

1. `cli` prints intro, loads `labels`.
2. Multiselect of offerable facets (grouped for display by `component` / `story`; `delete`
   hidden). Result = keep-set.
3. Prompt for experiment **name**; validate to a branch-safe slug; abort if
   `experiment/<name>` already exists.
4. `git`: assert clean tree; capture base HEAD SHA; create + checkout `experiment/<name>`.
5. `corpus` enumerates files; each is routed to `tsx-transform` or `mdx-transform` with the
   keep-set. Whole-file deletions are unlinked; edited files are written.
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
  "keptFacets": ["showcase", "props", "..."],
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

- **`labels`:** unit tests for offerable-list computation and dedup/delete-wins.
- **`tsx-transform`:** fixture `.tsx` inputs → expected outputs for each removal kind
  (component JSDoc, props JSDoc, story JSDoc, single story export, whole-file meta-delete).
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
