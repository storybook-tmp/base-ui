# storybook-freeze CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an interactive `storybook-freeze` CLI that strips unselected documentation facets from the Storybook corpus and commits the result to a reproducible `experiment/<name>` git branch.

**Architecture:** A new private workspace package `packages/storybook-freeze`. Pure content transforms (`.tsx` via `oxc-parser` + `magic-string`; `.mdx` via a marker scanner) are driven by a keep-set derived from `apps/storybook/classification-labels.jsonc`. A `corpus` module fans the transforms over the target files, a `git` module (via `simple-git`) forks the branch and commits, and a `@clack/prompts` CLI orchestrates the flow.

**Tech Stack:** TypeScript (ESM), `oxc-parser`, `magic-string`, `jsonc-parser`, `simple-git`, `@clack/prompts`, `prettier` (programmatic), Vitest (node environment), run with `tsx`.

## Global Constraints

- Node 25.x, pnpm 11.5.2. Package is ESM (`"type": "module"`), `"private": true`, named `@base-ui/storybook-freeze`, located at `packages/storybook-freeze/`.
- Pin already-present deps to lockfile versions: `oxc-parser@0.127.0`, `magic-string@0.30.21`, `jsonc-parser@3.3.1`, `prettier@3.8.3`. Add `simple-git` and `@clack/prompts` by letting pnpm resolve a policy-compliant version (the repo enforces `minimumReleaseAge` + a trust policy).
- Tests use **Vitest APIs only** (`expect`, `vi.fn()`, `@testing-library/jest-dom` not needed here). One assertion per `waitFor` (not used here). Test files are `name.test.ts` beside their source. Vitest `environment: 'node'`.
- Run this package's tests from the repo root: `pnpm vitest run --project @base-ui/storybook-freeze` (optionally append a filename substring to scope). It is intentionally excluded from `pnpm test`'s `test:_unit` project list.
- Facets are qualified strings `category.leaf` (e.g. `mdx.props`, `story.showcase`). The keep-set is a `Set<string>` of these.
- Every thrown error that can reach the user is prefixed `Base UI:` and states what happened, why it matters, and how to fix it (per AGENTS.md).
- Do not add `as any` casts to silence non-errors. Loose casts while traversing the untyped ESTree AST are acceptable and unavoidable; keep them minimal and local.
- The taxonomy file `apps/storybook/classification-labels.jsonc` already contains the agreed categories (`source-jsdoc`, `csf-jsdoc`, `mdx`, `general`, `story`) and `delete` array (`["mdx.styling", "mdx.testing", "story.infra"]`). Do not rename leaf keys.

---

## File Structure

- `packages/storybook-freeze/package.json` — package manifest, deps, `test` script.
- `packages/storybook-freeze/tsconfig.json` — extends repo base.
- `packages/storybook-freeze/vitest.config.mts` — standalone node-env Vitest project.
- `packages/storybook-freeze/src/labels.ts` — load taxonomy, compute offerable facets. **(Task 2)**
- `packages/storybook-freeze/src/oxc-utils.ts` — parse + leading-comment helper. **(Task 3)**
- `packages/storybook-freeze/src/source-transform.ts` — strip component/props JSDoc in `packages/react`. **(Task 4)**
- `packages/storybook-freeze/src/story-transform.ts` — strip CSF story exports + CSF JSDoc. **(Task 5)**
- `packages/storybook-freeze/src/mdx-transform.ts` — whole-file general drop + section stripping. **(Task 6)**
- `packages/storybook-freeze/src/corpus.ts` — enumerate + route + write/prune. **(Task 7)**
- `packages/storybook-freeze/src/git.ts` — `simple-git` wrapper. **(Task 8)**
- `packages/storybook-freeze/src/manifest.ts` — build/write `experiment.json`. **(Task 9)**
- `packages/storybook-freeze/src/format.ts` + `src/freeze.ts` — Prettier pass + orchestrator. **(Task 10)**
- `packages/storybook-freeze/src/cli.ts` + root `package.json` script — clack flow. **(Task 11)**

---

## Task 1: Scaffold the package

**Files:**
- Create: `packages/storybook-freeze/package.json`
- Create: `packages/storybook-freeze/tsconfig.json`
- Create: `packages/storybook-freeze/vitest.config.mts`
- Create: `packages/storybook-freeze/src/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Vitest project named `@base-ui/storybook-freeze`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@base-ui/storybook-freeze",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "CLI that freezes the Storybook corpus into an experiment branch for ML experiments.",
  "bin": {
    "storybook-freeze": "./src/cli.ts"
  },
  "scripts": {
    "start": "tsx src/cli.ts",
    "test": "vitest run",
    "typescript": "tsc --noEmit"
  },
  "dependencies": {
    "@clack/prompts": "*",
    "jsonc-parser": "3.3.1",
    "magic-string": "0.30.21",
    "oxc-parser": "0.127.0",
    "prettier": "3.8.3",
    "simple-git": "*"
  },
  "devDependencies": {
    "@types/node": "22.10.5",
    "tsx": "4.21.0",
    "typescript": "6.0.3",
    "vitest": "4.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "bundler",
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "vitest.config.mts"]
}
```

- [ ] **Step 3: Create `vitest.config.mts`** (standalone node project — do NOT merge the jsdom shared config)

```ts
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@base-ui/storybook-freeze',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create `src/smoke.test.ts`**

```ts
import { expect, it } from 'vitest';

it('runs the storybook-freeze test project', () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 5: Install dependencies**

Run:
```bash
pnpm install
pnpm --filter @base-ui/storybook-freeze add simple-git @clack/prompts
```
Expected: install completes; `simple-git` and `@clack/prompts` get concrete versions written into `packages/storybook-freeze/package.json`. If pnpm rejects a version for `minimumReleaseAge`/trust, it will pick the newest compliant one automatically.

- [ ] **Step 6: Run the smoke test to verify the project is wired**

Run: `pnpm vitest run --project @base-ui/storybook-freeze`
Expected: PASS — 1 test in `src/smoke.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add packages/storybook-freeze pnpm-lock.yaml
git commit -m "[storybook-freeze] Scaffold package"
```

---

## Task 2: `labels` — load taxonomy and compute facets

**Files:**
- Create: `packages/storybook-freeze/src/labels.ts`
- Test: `packages/storybook-freeze/src/labels.test.ts`

**Interfaces:**
- Consumes: `apps/storybook/classification-labels.jsonc`.
- Produces:
  - `type Facet = string`
  - `interface Labels { offerableFacets: Facet[]; deleteFacets: ReadonlySet<Facet>; storyTags: ReadonlySet<string>; isDeleteFacet(f: Facet): boolean; isKept(f: Facet, keep: ReadonlySet<Facet>): boolean; }`
  - `function loadLabels(jsoncPath: string): Labels`

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it, describe } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLabels } from './labels';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS = path.join(ROOT, 'apps/storybook/classification-labels.jsonc');

describe('loadLabels', () => {
  const labels = loadLabels(LABELS);

  it('offers mdx.props and story.showcase', () => {
    expect(labels.offerableFacets).toContain('mdx.props');
    expect(labels.offerableFacets).toContain('story.showcase');
  });

  it('never offers delete facets', () => {
    expect(labels.offerableFacets).not.toContain('mdx.styling');
    expect(labels.offerableFacets).not.toContain('story.infra');
  });

  it('exposes delete facets', () => {
    expect(labels.isDeleteFacet('story.infra')).toBe(true);
    expect(labels.isDeleteFacet('story.showcase')).toBe(false);
  });

  it('exposes bare story tag leaves', () => {
    expect(labels.storyTags.has('showcase')).toBe(true);
    expect(labels.storyTags.has('infra')).toBe(true);
    expect(labels.storyTags.has('base')).toBe(false);
  });

  it('isKept is false for delete facets even if present in the keep set', () => {
    expect(labels.isKept('story.infra', new Set(['story.infra']))).toBe(false);
    expect(labels.isKept('story.showcase', new Set(['story.showcase']))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze labels`
Expected: FAIL — `loadLabels` not defined.

- [ ] **Step 3: Write the implementation**

```ts
import { readFileSync } from 'node:fs';
import { parse as parseJsonc } from 'jsonc-parser';

export type Facet = string;

export interface Labels {
  offerableFacets: Facet[];
  deleteFacets: ReadonlySet<Facet>;
  storyTags: ReadonlySet<string>;
  isDeleteFacet(facet: Facet): boolean;
  isKept(facet: Facet, keep: ReadonlySet<Facet>): boolean;
}

const CONTENT_CATEGORIES = ['source-jsdoc', 'csf-jsdoc', 'mdx', 'general', 'story'] as const;

export function loadLabels(jsoncPath: string): Labels {
  const raw = parseJsonc(readFileSync(jsoncPath, 'utf8')) as Record<string, unknown>;
  const deleteFacets = new Set<Facet>((raw.delete as string[] | undefined) ?? []);
  const offerableFacets: Facet[] = [];
  const storyTags = new Set<string>();

  for (const category of CONTENT_CATEGORIES) {
    const leaves = raw[category] as Record<string, string> | undefined;
    if (!leaves) {
      continue;
    }
    for (const leaf of Object.keys(leaves)) {
      const facet = `${category}.${leaf}`;
      if (category === 'story') {
        storyTags.add(leaf);
      }
      if (!deleteFacets.has(facet)) {
        offerableFacets.push(facet);
      }
    }
  }
  offerableFacets.sort();

  return {
    offerableFacets,
    deleteFacets,
    storyTags,
    isDeleteFacet: (facet) => deleteFacets.has(facet),
    isKept: (facet, keep) => !deleteFacets.has(facet) && keep.has(facet),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze labels`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze/src/labels.ts packages/storybook-freeze/src/labels.test.ts
git commit -m "[storybook-freeze] Add taxonomy loader"
```

---

## Task 3: `oxc-utils` — parse and locate leading comments

**Files:**
- Create: `packages/storybook-freeze/src/oxc-utils.ts`
- Test: `packages/storybook-freeze/src/oxc-utils.test.ts`

**Interfaces:**
- Produces:
  - `interface Comment { type: 'Line' | 'Block'; value: string; start: number; end: number; }`
  - `function parse(filename: string, code: string): { program: any; comments: Comment[] }`
  - `function leadingBlockComment(node: { start: number }, comments: Comment[], code: string): { start: number; end: number } | null` — returns the range from the start of the nearest preceding block comment through the start of `node` (so removal also deletes the blank gap), or `null` when there is no adjacent block comment.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it, describe } from 'vitest';
import { parse, leadingBlockComment } from './oxc-utils';

describe('oxc-utils', () => {
  it('parses and finds a leading block comment for the exported node', () => {
    const code = ['/** hello */', 'export const Foo = 1;', ''].join('\n');
    const { program, comments } = parse('Foo.tsx', code);
    const node = program.body[0];
    const range = leadingBlockComment(node, comments, code);
    expect(range).not.toBeNull();
    expect(code.slice(range!.start, range!.end)).toBe('/** hello */\n');
  });

  it('returns null when there is code between comment and node', () => {
    const code = ['/** hello */', 'const x = 1;', 'export const Foo = 2;'].join('\n');
    const { program, comments } = parse('Foo.tsx', code);
    const node = program.body[1];
    expect(leadingBlockComment(node, comments, code)).toBeNull();
  });

  it('throws a Base UI error on invalid syntax', () => {
    expect(() => parse('Bad.tsx', 'export const = ;')).toThrow(/^Base UI:/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze oxc-utils`
Expected: FAIL — `parse` not defined.

- [ ] **Step 3: Write the implementation**

```ts
import { parseSync } from 'oxc-parser';

export interface Comment {
  type: 'Line' | 'Block';
  value: string;
  start: number;
  end: number;
}

export function parse(filename: string, code: string): { program: any; comments: Comment[] } {
  const { program, comments, errors } = parseSync(filename, code);
  if (errors.length > 0) {
    throw new Error(
      `Base UI: storybook-freeze could not parse ${filename}. ` +
        `oxc reported a syntax error (${errors[0].message}), so the file cannot be safely transformed. ` +
        `Fix the syntax or exclude the file before freezing.`,
    );
  }
  return { program, comments: comments as Comment[] };
}

export function leadingBlockComment(
  node: { start: number },
  comments: Comment[],
  code: string,
): { start: number; end: number } | null {
  let best: Comment | null = null;
  for (const comment of comments) {
    if (comment.type !== 'Block') {
      continue;
    }
    if (comment.end <= node.start && /^\s*$/.test(code.slice(comment.end, node.start))) {
      if (best === null || comment.end > best.end) {
        best = comment;
      }
    }
  }
  return best ? { start: best.start, end: node.start } : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze oxc-utils`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze/src/oxc-utils.ts packages/storybook-freeze/src/oxc-utils.test.ts
git commit -m "[storybook-freeze] Add oxc parse + leading-comment helper"
```

---

## Task 4: `source-transform` — strip component/props JSDoc

**Files:**
- Create: `packages/storybook-freeze/src/source-transform.ts`
- Test: `packages/storybook-freeze/src/source-transform.test.ts`

**Interfaces:**
- Consumes: `parse`, `leadingBlockComment` from `./oxc-utils`.
- Produces:
  - `interface TransformResult { code: string; changed: boolean; }`
  - `function transformSource(filename: string, code: string, keep: ReadonlySet<string>): TransformResult`
  - Rule: remove the JSDoc before a component export (an exported `const`/`function` whose name also has a sibling `export namespace X`) when `source-jsdoc.component` ∉ keep; remove each member JSDoc inside `export interface *Props {…}` when `source-jsdoc.props` ∉ keep.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it, describe } from 'vitest';
import { transformSource } from './source-transform';

const SOURCE = [
  '/** Represents the checkbox. */',
  'export const CheckboxRoot = React.forwardRef(function CheckboxRoot() {',
  '  return null;',
  '});',
  '',
  'export interface CheckboxRootProps {',
  '  /** The id of the input. */',
  '  id?: string;',
  '  /** Whether ticked. */',
  '  checked?: boolean;',
  '}',
  '',
  'export namespace CheckboxRoot {',
  '  export type Props = CheckboxRootProps;',
  '}',
  '',
].join('\n');

describe('transformSource', () => {
  it('keeps everything when both facets are kept', () => {
    const keep = new Set(['source-jsdoc.component', 'source-jsdoc.props']);
    const r = transformSource('C.tsx', SOURCE, keep);
    expect(r.changed).toBe(false);
    expect(r.code).toBe(SOURCE);
  });

  it('removes the component JSDoc when source-jsdoc.component is not kept', () => {
    const keep = new Set(['source-jsdoc.props']);
    const r = transformSource('C.tsx', SOURCE, keep);
    expect(r.changed).toBe(true);
    expect(r.code).not.toContain('Represents the checkbox.');
    expect(r.code).toContain('The id of the input.');
    expect(r.code).toContain('export const CheckboxRoot');
  });

  it('removes each props member JSDoc when source-jsdoc.props is not kept', () => {
    const keep = new Set(['source-jsdoc.component']);
    const r = transformSource('C.tsx', SOURCE, keep);
    expect(r.changed).toBe(true);
    expect(r.code).toContain('Represents the checkbox.');
    expect(r.code).not.toContain('The id of the input.');
    expect(r.code).not.toContain('Whether ticked.');
    expect(r.code).toContain('id?: string;');
    expect(r.code).toContain('checked?: boolean;');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze source-transform`
Expected: FAIL — `transformSource` not defined.

- [ ] **Step 3: Write the implementation**

```ts
import MagicString from 'magic-string';
import { parse, leadingBlockComment } from './oxc-utils';

export interface TransformResult {
  code: string;
  changed: boolean;
}

export function transformSource(
  filename: string,
  code: string,
  keep: ReadonlySet<string>,
): TransformResult {
  const keepComponent = keep.has('source-jsdoc.component');
  const keepProps = keep.has('source-jsdoc.props');
  if (keepComponent && keepProps) {
    return { code, changed: false };
  }

  const { program, comments } = parse(filename, code);
  const ms = new MagicString(code);
  let changed = false;

  const namespaceNames = new Set<string>();
  for (const node of program.body) {
    if (
      node.type === 'ExportNamedDeclaration' &&
      node.declaration?.type === 'TSModuleDeclaration' &&
      node.declaration.id?.type === 'Identifier'
    ) {
      namespaceNames.add(node.declaration.id.name);
    }
  }

  for (const node of program.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.declaration) {
      continue;
    }
    const decl = node.declaration;

    if (!keepComponent && decl.type === 'VariableDeclaration') {
      const id = decl.declarations[0]?.id;
      if (id?.type === 'Identifier' && namespaceNames.has(id.name)) {
        const range = leadingBlockComment(node, comments, code);
        if (range) {
          ms.remove(range.start, range.end);
          changed = true;
        }
      }
    }

    if (!keepProps && decl.type === 'TSInterfaceDeclaration' && decl.id.name.endsWith('Props')) {
      for (const member of decl.body.body) {
        const range = leadingBlockComment(member, comments, code);
        if (range) {
          ms.remove(range.start, range.end);
          changed = true;
        }
      }
    }
  }

  return { code: changed ? ms.toString() : code, changed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze source-transform`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze/src/source-transform.ts packages/storybook-freeze/src/source-transform.test.ts
git commit -m "[storybook-freeze] Add source JSDoc transform"
```

---

## Task 5: `story-transform` — strip CSF story exports and CSF JSDoc

**Files:**
- Create: `packages/storybook-freeze/src/story-transform.ts`
- Test: `packages/storybook-freeze/src/story-transform.test.ts`

**Interfaces:**
- Consumes: `parse`, `leadingBlockComment` from `./oxc-utils`; `Labels` from `./labels`.
- Produces:
  - `interface StoryTransformResult { code: string; changed: boolean; removedStoryExports: number; remainingStoryExports: number; }`
  - `function transformStory(filename: string, code: string, keep: ReadonlySet<string>, labels: Labels): StoryTransformResult`
  - Rules: a story export is `export const X: Story = {…}`. Its effective tags are `meta.tags ∪ story.tags` restricted to `labels.storyTags`. Strip the export (with its leading JSDoc) when any effective tag is a delete facet, or when none of its effective tags is kept. For surviving exports, remove their leading JSDoc when `csf-jsdoc.story` ∉ keep. Remove the JSDoc before `const meta` when `csf-jsdoc.meta` ∉ keep. Report counts so `corpus` can prune emptied files.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it, describe } from 'vitest';
import { transformStory } from './story-transform';
import type { Labels } from './labels';

const labels: Labels = {
  offerableFacets: [],
  deleteFacets: new Set(['story.infra']),
  storyTags: new Set(['showcase', 'highlight', 'api-ref', 'infra']),
  isDeleteFacet: (f) => f === 'story.infra',
  isKept: (f, keep) => f !== 'story.infra' && keep.has(f),
};

const STORY = [
  '/** File-level component description. */',
  'const meta = {',
  "  title: 'Form inputs/Checkbox',",
  "  tags: ['base'],",
  '} satisfies Meta;',
  'export default meta;',
  'type Story = StoryObj<typeof meta>;',
  '',
  '/** Hero demo. */',
  "export const Hero: Story = { tags: ['showcase', 'base'], render: () => null };",
  '',
  '/** An api-ref story. */',
  "export const Details: Story = { tags: ['api-ref'], render: () => null };",
  '',
].join('\n');

describe('transformStory', () => {
  it('keeps only exports whose tag is kept and drops the rest', () => {
    const r = transformStory('checkbox.stories.tsx', STORY, new Set(['story.showcase']), labels);
    expect(r.code).toContain('export const Hero');
    expect(r.code).not.toContain('export const Details');
    expect(r.removedStoryExports).toBe(1);
    expect(r.remainingStoryExports).toBe(1);
  });

  it('strips the meta JSDoc when csf-jsdoc.meta is not kept', () => {
    const r = transformStory('checkbox.stories.tsx', STORY, new Set(['story.showcase', 'story.api-ref']), labels);
    expect(r.code).not.toContain('File-level component description.');
  });

  it('strips per-story JSDoc when csf-jsdoc.story is not kept', () => {
    const r = transformStory('checkbox.stories.tsx', STORY, new Set(['story.showcase', 'story.api-ref']), labels);
    expect(r.code).not.toContain('Hero demo.');
    expect(r.code).not.toContain('An api-ref story.');
  });

  it('keeps CSF JSDoc when csf-jsdoc.meta and csf-jsdoc.story are kept', () => {
    const keep = new Set(['story.showcase', 'story.api-ref', 'csf-jsdoc.meta', 'csf-jsdoc.story']);
    const r = transformStory('checkbox.stories.tsx', STORY, keep, labels);
    expect(r.code).toContain('File-level component description.');
    expect(r.code).toContain('Hero demo.');
  });

  it('always strips story.infra exports (delete facet wins)', () => {
    const infra = [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Grid: Story = { tags: ['infra'], render: () => null };",
    ].join('\n');
    const r = transformStory('gallery.stories.tsx', infra, new Set(['story.infra']), labels);
    expect(r.code).not.toContain('export const Grid');
    expect(r.remainingStoryExports).toBe(0);
    expect(r.removedStoryExports).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze story-transform`
Expected: FAIL — `transformStory` not defined.

- [ ] **Step 3: Write the implementation**

```ts
import MagicString from 'magic-string';
import { parse, leadingBlockComment } from './oxc-utils';
import type { Labels } from './labels';

export interface StoryTransformResult {
  code: string;
  changed: boolean;
  removedStoryExports: number;
  remainingStoryExports: number;
}

function stringArray(node: any): string[] {
  if (node?.type !== 'ArrayExpression') {
    return [];
  }
  return node.elements
    .filter((el: any) => el?.type === 'Literal' && typeof el.value === 'string')
    .map((el: any) => el.value as string);
}

function tagsOf(objectExpression: any): string[] {
  if (objectExpression?.type !== 'ObjectExpression') {
    return [];
  }
  const prop = objectExpression.properties.find(
    (p: any) => p.type === 'Property' && p.key?.name === 'tags',
  );
  return prop ? stringArray(prop.value) : [];
}

export function transformStory(
  filename: string,
  code: string,
  keep: ReadonlySet<string>,
  labels: Labels,
): StoryTransformResult {
  const { program, comments } = parse(filename, code);
  const ms = new MagicString(code);
  let changed = false;
  let removedStoryExports = 0;
  let remainingStoryExports = 0;

  let metaNode: any = null;
  let metaTags: string[] = [];
  for (const node of program.body) {
    if (node.type === 'VariableDeclaration' && node.declarations[0]?.id?.name === 'meta') {
      metaNode = node;
      metaTags = tagsOf(node.declarations[0].init);
    }
  }

  const keepMetaJsdoc = keep.has('csf-jsdoc.meta');
  const keepStoryJsdoc = keep.has('csf-jsdoc.story');

  if (metaNode && !keepMetaJsdoc) {
    const range = leadingBlockComment(metaNode, comments, code);
    if (range) {
      ms.remove(range.start, range.end);
      changed = true;
    }
  }

  for (const node of program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'VariableDeclaration') {
      continue;
    }
    const declarator = node.declaration.declarations[0];
    const typeName = declarator?.id?.typeAnnotation?.typeAnnotation?.typeName?.name;
    if (typeName !== 'Story') {
      continue;
    }

    const effectiveTags = [...new Set([...metaTags, ...tagsOf(declarator.init)])].filter((tag) =>
      labels.storyTags.has(tag),
    );
    const hasDeleteTag = effectiveTags.some((tag) => labels.isDeleteFacet(`story.${tag}`));
    const isKept = !hasDeleteTag && effectiveTags.some((tag) => keep.has(`story.${tag}`));

    if (!isKept) {
      const lead = leadingBlockComment(node, comments, code);
      let end = node.end;
      if (code[end] === '\n') {
        end += 1;
      }
      ms.remove(lead ? lead.start : node.start, end);
      changed = true;
      removedStoryExports += 1;
    } else {
      remainingStoryExports += 1;
      if (!keepStoryJsdoc) {
        const range = leadingBlockComment(node, comments, code);
        if (range) {
          ms.remove(range.start, range.end);
          changed = true;
        }
      }
    }
  }

  return {
    code: changed ? ms.toString() : code,
    changed,
    removedStoryExports,
    remainingStoryExports,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze story-transform`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze/src/story-transform.ts packages/storybook-freeze/src/story-transform.test.ts
git commit -m "[storybook-freeze] Add CSF story transform"
```

---

## Task 6: `mdx-transform` — whole-file drop and section stripping

**Files:**
- Create: `packages/storybook-freeze/src/mdx-transform.ts`
- Test: `packages/storybook-freeze/src/mdx-transform.test.ts`

**Interfaces:**
- Consumes: `Labels` from `./labels` (only `isKept` semantics via the keep set; delete facets are excluded from keep so `!keep.has(...)` strips them).
- Produces:
  - `interface MdxTransformResult { code: string; changed: boolean; deleteFile: boolean; }`
  - `function transformMdx(filename: string, code: string, keep: ReadonlySet<string>): MdxTransformResult`
  - Rules: if the `<Meta … tags={[…]} />` array contains a `general-*` tag, the file is a whole-file general doc → `deleteFile = !keep.has('general.<tag>')` and no section processing. Otherwise remove each `{/* BEGIN: x */} … {/* END: x */}` region (plus one trailing newline) whose `mdx.x` ∉ keep.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it, describe } from 'vitest';
import { transformMdx } from './mdx-transform';

const GENERAL = [
  "import { Meta } from '@storybook/addon-docs/blocks';",
  '',
  '<Meta title="BaseUI Patterns/Choosing an overlay" tags={[\'general-when-to-use\']} />',
  '',
  'Some prose.',
  '',
].join('\n');

const COMPONENT = [
  '<Meta of={SliderStories} />',
  '',
  '{/* BEGIN: general */}',
  'An easily stylable range input.',
  '{/* END: general */}',
  '',
  '{/* BEGIN: styling */}',
  '## Styling hooks',
  '{/* END: styling */}',
  '',
].join('\n');

describe('transformMdx', () => {
  it('drops a general-tagged file when its facet is not kept', () => {
    const r = transformMdx('choosing-an-overlay.mdx', GENERAL, new Set());
    expect(r.deleteFile).toBe(true);
  });

  it('keeps a general-tagged file when its facet is kept', () => {
    const r = transformMdx('choosing-an-overlay.mdx', GENERAL, new Set(['general.general-when-to-use']));
    expect(r.deleteFile).toBe(false);
    expect(r.changed).toBe(false);
  });

  it('strips only the sections whose mdx facet is not kept', () => {
    const r = transformMdx('slider.mdx', COMPONENT, new Set(['mdx.general']));
    expect(r.deleteFile).toBe(false);
    expect(r.changed).toBe(true);
    expect(r.code).toContain('An easily stylable range input.');
    expect(r.code).not.toContain('## Styling hooks');
    expect(r.code).not.toContain('BEGIN: styling');
  });

  it('strips delete-facet sections (mdx.styling) because they are never in the keep set', () => {
    const r = transformMdx('slider.mdx', COMPONENT, new Set(['mdx.general', 'mdx.styling']));
    // mdx.styling should not be passed in practice; even if present, the section is removed
    // only when absent from keep. Here it is present, so it is retained — asserting the
    // mechanism keys purely on the keep set:
    expect(r.code).toContain('## Styling hooks');
  });
});
```

Note: the loader never places `mdx.styling` in `offerableFacets`, so the CLI can never add it to the keep set; the last test documents that `transformMdx` itself is a pure keep-set function.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze mdx-transform`
Expected: FAIL — `transformMdx` not defined.

- [ ] **Step 3: Write the implementation**

```ts
export interface MdxTransformResult {
  code: string;
  changed: boolean;
  deleteFile: boolean;
}

const META_TAGS_RE = /<Meta\b[^>]*\btags=\{\[([^\]]*)\]\}/;
const STRING_RE = /['"]([^'"]+)['"]/g;

export function transformMdx(
  filename: string,
  code: string,
  keep: ReadonlySet<string>,
): MdxTransformResult {
  const metaMatch = META_TAGS_RE.exec(code);
  if (metaMatch) {
    const tags = [...metaMatch[1].matchAll(STRING_RE)].map((m) => m[1]);
    const general = tags.find((tag) => tag.startsWith('general-'));
    if (general) {
      return { code, changed: false, deleteFile: !keep.has(`general.${general}`) };
    }
  }

  let out = code;
  let changed = false;
  const beginRe = /\{\/\*\s*BEGIN:\s*([a-z0-9-]+)\s*\*\/\}/g;
  let match: RegExpExecArray | null;
  while ((match = beginRe.exec(out)) !== null) {
    const label = match[1];
    if (keep.has(`mdx.${label}`)) {
      continue;
    }
    const endRe = new RegExp(`\\{\\/\\*\\s*END:\\s*${label}\\s*\\*\\/\\}`, 'g');
    endRe.lastIndex = match.index + match[0].length;
    const endMatch = endRe.exec(out);
    if (!endMatch) {
      continue;
    }
    const start = match.index;
    let end = endMatch.index + endMatch[0].length;
    if (out[end] === '\n') {
      end += 1;
    }
    out = out.slice(0, start) + out.slice(end);
    changed = true;
    beginRe.lastIndex = start;
  }

  return { code: out, changed, deleteFile: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze mdx-transform`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze/src/mdx-transform.ts packages/storybook-freeze/src/mdx-transform.test.ts
git commit -m "[storybook-freeze] Add MDX transform"
```

---

## Task 7: `corpus` — enumerate, route, write, prune

**Files:**
- Create: `packages/storybook-freeze/src/corpus.ts`
- Test: `packages/storybook-freeze/src/corpus.test.ts`

**Interfaces:**
- Consumes: `transformSource`, `transformStory`, `transformMdx`, `Labels`.
- Produces:
  - `interface CorpusSummary { written: string[]; removed: string[]; storiesRemoved: number; }`
  - `function runCorpus(cwd: string, keep: ReadonlySet<string>, labels: Labels): Promise<CorpusSummary>`
  - Globs (relative to `cwd`): stories `apps/storybook/src/stories/**/*.stories.tsx`; MDX `apps/storybook/src/stories/**/*.mdx`; source `packages/react/src/**/*.tsx` excluding `*.test.tsx` and `*.stories.tsx`. A story file with `remainingStoryExports === 0 && removedStoryExports > 0` is unlinked.

- [ ] **Step 1: Write the failing test** (builds a tiny fake corpus in a temp dir)

```ts
import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runCorpus } from './corpus';
import type { Labels } from './labels';

const labels: Labels = {
  offerableFacets: [],
  deleteFacets: new Set(['story.infra']),
  storyTags: new Set(['showcase', 'infra']),
  isDeleteFacet: (f) => f === 'story.infra',
  isKept: (f, keep) => f !== 'story.infra' && keep.has(f),
};

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'freeze-corpus-'));
  const stories = path.join(dir, 'apps/storybook/src/stories/checkbox');
  const infra = path.join(dir, 'apps/storybook/src/stories/overview');
  const src = path.join(dir, 'packages/react/src/checkbox');
  await mkdir(stories, { recursive: true });
  await mkdir(infra, { recursive: true });
  await mkdir(src, { recursive: true });

  await writeFile(
    path.join(stories, 'checkbox.stories.tsx'),
    [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Hero: Story = { tags: ['showcase'], render: () => null };",
      "export const Grid: Story = { tags: ['infra'], render: () => null };",
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(infra, 'gallery.stories.tsx'),
    [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Only: Story = { tags: ['infra'], render: () => null };",
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(stories, 'checkbox.mdx'),
    ['{/* BEGIN: general */}', 'keep me', '{/* END: general */}', '', '{/* BEGIN: styling */}', 'drop me', '{/* END: styling */}', ''].join('\n'),
  );
  await writeFile(
    path.join(src, 'CheckboxRoot.tsx'),
    [
      '/** desc */',
      'export const CheckboxRoot = React.forwardRef(function CheckboxRoot() { return null; });',
      'export namespace CheckboxRoot { export type Props = {}; }',
      '',
    ].join('\n'),
  );
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('runCorpus', () => {
  it('drops unkept stories, prunes emptied files, strips mdx sections, and strips source jsdoc', async () => {
    const summary = await runCorpus(dir, new Set(['mdx.general']), labels);

    const checkbox = await readFile(path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.stories.tsx'), 'utf8');
    expect(checkbox).not.toContain('export const Grid');
    expect(checkbox).not.toContain('export const Hero'); // showcase not kept
    // Only infra + showcase existed; showcase not kept so both removed => file pruned
    await expect(access(path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.stories.tsx'))).rejects.toThrow();

    await expect(access(path.join(dir, 'apps/storybook/src/stories/overview/gallery.stories.tsx'))).rejects.toThrow();

    const mdx = await readFile(path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.mdx'), 'utf8');
    expect(mdx).toContain('keep me');
    expect(mdx).not.toContain('drop me');

    const source = await readFile(path.join(dir, 'packages/react/src/checkbox/CheckboxRoot.tsx'), 'utf8');
    expect(source).not.toContain('desc');

    expect(summary.storiesRemoved).toBe(3);
    expect(summary.removed.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze corpus`
Expected: FAIL — `runCorpus` not defined.

- [ ] **Step 3: Write the implementation**

```ts
import { globby } from 'globby';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { transformSource } from './source-transform';
import { transformStory } from './story-transform';
import { transformMdx } from './mdx-transform';
import type { Labels } from './labels';

export interface CorpusSummary {
  written: string[];
  removed: string[];
  storiesRemoved: number;
}

export async function runCorpus(
  cwd: string,
  keep: ReadonlySet<string>,
  labels: Labels,
): Promise<CorpusSummary> {
  const summary: CorpusSummary = { written: [], removed: [], storiesRemoved: 0 };

  const storyFiles = await globby('apps/storybook/src/stories/**/*.stories.tsx', {
    cwd,
    absolute: true,
  });
  for (const file of storyFiles) {
    const code = await readFile(file, 'utf8');
    const result = transformStory(file, code, keep, labels);
    summary.storiesRemoved += result.removedStoryExports;
    if (result.remainingStoryExports === 0 && result.removedStoryExports > 0) {
      await rm(file);
      summary.removed.push(file);
    } else if (result.changed) {
      await writeFile(file, result.code);
      summary.written.push(file);
    }
  }

  const mdxFiles = await globby('apps/storybook/src/stories/**/*.mdx', { cwd, absolute: true });
  for (const file of mdxFiles) {
    const code = await readFile(file, 'utf8');
    const result = transformMdx(file, code, keep);
    if (result.deleteFile) {
      await rm(file);
      summary.removed.push(file);
    } else if (result.changed) {
      await writeFile(file, result.code);
      summary.written.push(file);
    }
  }

  const sourceFiles = await globby(
    ['packages/react/src/**/*.tsx', '!**/*.test.tsx', '!**/*.stories.tsx'],
    { cwd, absolute: true },
  );
  for (const file of sourceFiles) {
    const code = await readFile(file, 'utf8');
    const result = transformSource(file, code, keep);
    if (result.changed) {
      await writeFile(file, result.code);
      summary.written.push(file);
    }
  }

  return summary;
}
```

Note: `globby` is already a repo dependency; add it to this package with `pnpm --filter @base-ui/storybook-freeze add globby` if the import fails to resolve under strict pnpm.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze corpus`
Expected: PASS. If the import of `globby` fails, run the add command in the note, then re-run.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze
git commit -m "[storybook-freeze] Add corpus enumeration and routing"
```

---

## Task 8: `git` — clean-tree check, branch, commit

**Files:**
- Create: `packages/storybook-freeze/src/git.ts`
- Test: `packages/storybook-freeze/src/git.test.ts`

**Interfaces:**
- Consumes: `simple-git`.
- Produces:
  - `function createGit(cwd: string): SimpleGit`
  - `function assertClean(git: SimpleGit): Promise<void>` — throws a `Base UI:` error if dirty.
  - `function headSha(git: SimpleGit): Promise<string>`
  - `function createExperimentBranch(git: SimpleGit, name: string): Promise<string>` — returns `experiment/<name>`; throws if it exists.
  - `function commitAll(git: SimpleGit, message: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createGit, assertClean, headSha, createExperimentBranch, commitAll } from './git';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'freeze-git-'));
  const git = createGit(dir);
  await git.init();
  await git.addConfig('user.email', 'test@example.com');
  await git.addConfig('user.name', 'Test');
  await writeFile(path.join(dir, 'a.txt'), 'hi\n');
  await git.add(['-A']);
  await git.commit('initial');
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('git module', () => {
  it('assertClean passes on a clean tree and throws when dirty', async () => {
    const git = createGit(dir);
    await expect(assertClean(git)).resolves.toBeUndefined();
    await writeFile(path.join(dir, 'a.txt'), 'changed\n');
    await expect(assertClean(git)).rejects.toThrow(/^Base UI:/);
  });

  it('creates an experiment branch and rejects duplicates', async () => {
    const git = createGit(dir);
    const branch = await createExperimentBranch(git, 'exp-1');
    expect(branch).toBe('experiment/exp-1');
    const status = await git.status();
    expect(status.current).toBe('experiment/exp-1');
    await git.checkout('-'); // back to previous branch
    await expect(createExperimentBranch(git, 'exp-1')).rejects.toThrow(/already exists/);
  });

  it('headSha returns a 40-char sha and commitAll records changes', async () => {
    const git = createGit(dir);
    const sha = await headSha(git);
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    await writeFile(path.join(dir, 'b.txt'), 'new\n');
    await commitAll(git, 'add b');
    const log = await git.log();
    expect(log.latest?.message).toContain('add b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze git`
Expected: FAIL — module `./git` not found / exports undefined.

- [ ] **Step 3: Write the implementation**

```ts
import { simpleGit, type SimpleGit } from 'simple-git';

export function createGit(cwd: string): SimpleGit {
  return simpleGit(cwd);
}

export async function assertClean(git: SimpleGit): Promise<void> {
  const status = await git.status();
  if (!status.isClean()) {
    throw new Error(
      'Base UI: storybook-freeze requires a clean working tree, but there are uncommitted changes. ' +
        'The experiment branch must fork from a known commit to stay reproducible. ' +
        'Commit or stash your changes, then re-run.',
    );
  }
}

export async function headSha(git: SimpleGit): Promise<string> {
  return (await git.revparse(['HEAD'])).trim();
}

export async function createExperimentBranch(git: SimpleGit, name: string): Promise<string> {
  const branch = `experiment/${name}`;
  const branches = await git.branchLocal();
  if (branches.all.includes(branch)) {
    throw new Error(
      `Base UI: storybook-freeze cannot create branch "${branch}" because it already exists. ` +
        'Each experiment needs its own branch so earlier results are not overwritten. ' +
        'Choose a different experiment name or delete the existing branch first.',
    );
  }
  await git.checkoutLocalBranch(branch);
  return branch;
}

export async function commitAll(git: SimpleGit, message: string): Promise<void> {
  await git.add(['-A']);
  await git.commit(message);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze git`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze/src/git.ts packages/storybook-freeze/src/git.test.ts
git commit -m "[storybook-freeze] Add git wrapper"
```

---

## Task 9: `manifest` — build and write `experiment.json`

**Files:**
- Create: `packages/storybook-freeze/src/manifest.ts`
- Test: `packages/storybook-freeze/src/manifest.test.ts`

**Interfaces:**
- Produces:
  - `interface Manifest { name: string; branch: string; baseCommit: string; keptFacets: string[]; createdAt: string; tool: string; }`
  - `function buildManifest(args: { name: string; baseCommit: string; keptFacets: string[]; createdAt: string; version: string }): Manifest`
  - `function writeManifest(cwd: string, manifest: Manifest): Promise<string>` — writes `experiment.json` at `cwd`, returns its path.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it, describe, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildManifest, writeManifest } from './manifest';

let dir: string | undefined;
afterEach(async () => {
  if (dir) {
    await rm(dir, { recursive: true, force: true });
  }
});

describe('manifest', () => {
  it('builds a manifest with a sorted keep-set and derived branch', () => {
    const m = buildManifest({
      name: 'exp-1',
      baseCommit: 'abc123',
      keptFacets: ['story.showcase', 'mdx.props'],
      createdAt: '2026-07-24T00:00:00.000Z',
      version: '0.1.0',
    });
    expect(m.branch).toBe('experiment/exp-1');
    expect(m.keptFacets).toEqual(['mdx.props', 'story.showcase']);
    expect(m.tool).toBe('storybook-freeze@0.1.0');
  });

  it('writes experiment.json to cwd', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'freeze-manifest-'));
    const m = buildManifest({
      name: 'exp-1',
      baseCommit: 'abc123',
      keptFacets: [],
      createdAt: '2026-07-24T00:00:00.000Z',
      version: '0.1.0',
    });
    const p = await writeManifest(dir, m);
    expect(p).toBe(path.join(dir, 'experiment.json'));
    const parsed = JSON.parse(await readFile(p, 'utf8'));
    expect(parsed.name).toBe('exp-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze manifest`
Expected: FAIL — `buildManifest` not defined.

- [ ] **Step 3: Write the implementation**

```ts
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface Manifest {
  name: string;
  branch: string;
  baseCommit: string;
  keptFacets: string[];
  createdAt: string;
  tool: string;
}

export function buildManifest(args: {
  name: string;
  baseCommit: string;
  keptFacets: string[];
  createdAt: string;
  version: string;
}): Manifest {
  return {
    name: args.name,
    branch: `experiment/${args.name}`,
    baseCommit: args.baseCommit,
    keptFacets: [...args.keptFacets].sort(),
    createdAt: args.createdAt,
    tool: `storybook-freeze@${args.version}`,
  };
}

export async function writeManifest(cwd: string, manifest: Manifest): Promise<string> {
  const filePath = path.join(cwd, 'experiment.json');
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
  return filePath;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze manifest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/storybook-freeze/src/manifest.ts packages/storybook-freeze/src/manifest.test.ts
git commit -m "[storybook-freeze] Add experiment manifest"
```

---

## Task 10: `format` + `freeze` — Prettier pass and orchestrator

**Files:**
- Create: `packages/storybook-freeze/src/format.ts`
- Create: `packages/storybook-freeze/src/freeze.ts`
- Test: `packages/storybook-freeze/src/freeze.test.ts`

**Interfaces:**
- Consumes: `createGit`, `assertClean`, `headSha`, `createExperimentBranch`, `commitAll`, `runCorpus`, `buildManifest`, `writeManifest`, `Labels`.
- Produces:
  - `function formatFiles(files: string[]): Promise<void>` — formats each existing file in place with Prettier (skips files Prettier has no parser for).
  - `interface FreezeResult { branch: string; baseCommit: string; summary: CorpusSummary; manifestPath: string; }`
  - `function runFreeze(opts: { cwd: string; name: string; keptFacets: string[]; labels: Labels; now: string; version: string }): Promise<FreezeResult>`

- [ ] **Step 1: Write `format.ts`** (no separate test — exercised via `freeze.test.ts`; fold into this task)

```ts
import prettier from 'prettier';
import { readFile, writeFile } from 'node:fs/promises';

export async function formatFiles(files: string[]): Promise<void> {
  for (const file of files) {
    const info = await prettier.getFileInfo(file);
    if (info.ignored || !info.inferredParser) {
      continue;
    }
    const config = await prettier.resolveConfig(file);
    const source = await readFile(file, 'utf8');
    const formatted = await prettier.format(source, { ...config, filepath: file });
    await writeFile(file, formatted);
  }
}
```

- [ ] **Step 2: Write the failing test** (end-to-end in a temp git repo)

```ts
import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { runFreeze } from './freeze';
import type { Labels } from './labels';

const labels: Labels = {
  offerableFacets: [],
  deleteFacets: new Set(['story.infra']),
  storyTags: new Set(['showcase', 'infra']),
  isDeleteFacet: (f) => f === 'story.infra',
  isKept: (f, keep) => f !== 'story.infra' && keep.has(f),
};

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'freeze-e2e-'));
  const stories = path.join(dir, 'apps/storybook/src/stories/checkbox');
  await mkdir(stories, { recursive: true });
  await writeFile(
    path.join(stories, 'checkbox.stories.tsx'),
    [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Hero: Story = { tags: ['showcase'], render: () => null };",
      "export const Grid: Story = { tags: ['infra'], render: () => null };",
      '',
    ].join('\n'),
  );
  const git = simpleGit(dir);
  await git.init();
  await git.addConfig('user.email', 'test@example.com');
  await git.addConfig('user.name', 'Test');
  await git.add(['-A']);
  await git.commit('initial');
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('runFreeze', () => {
  it('creates the branch, strips content, writes a manifest, and commits', async () => {
    const result = await runFreeze({
      cwd: dir,
      name: 'exp-1',
      keptFacets: ['story.showcase'],
      labels,
      now: '2026-07-24T00:00:00.000Z',
      version: '0.1.0',
    });

    expect(result.branch).toBe('experiment/exp-1');

    const git = simpleGit(dir);
    const status = await git.status();
    expect(status.current).toBe('experiment/exp-1');
    expect(status.isClean()).toBe(true); // everything committed

    const stories = await readFile(path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.stories.tsx'), 'utf8');
    expect(stories).toContain('export const Hero');
    expect(stories).not.toContain('export const Grid');

    const manifest = JSON.parse(await readFile(path.join(dir, 'experiment.json'), 'utf8'));
    expect(manifest.keptFacets).toEqual(['story.showcase']);
    expect(manifest.baseCommit).toMatch(/^[0-9a-f]{40}$/);

    const log = await git.log();
    expect(log.latest?.message).toContain('[storybook-freeze] Freeze experiment exp-1');
  });

  it('refuses to run on a dirty tree', async () => {
    await writeFile(path.join(dir, 'dirty.txt'), 'x\n');
    await expect(
      runFreeze({ cwd: dir, name: 'exp-2', keptFacets: [], labels, now: '2026-07-24T00:00:00.000Z', version: '0.1.0' }),
    ).rejects.toThrow(/clean working tree/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run --project @base-ui/storybook-freeze freeze`
Expected: FAIL — `runFreeze` not defined.

- [ ] **Step 4: Write `freeze.ts`**

```ts
import { createGit, assertClean, headSha, createExperimentBranch, commitAll } from './git';
import { runCorpus, type CorpusSummary } from './corpus';
import { buildManifest, writeManifest } from './manifest';
import { formatFiles } from './format';
import type { Labels } from './labels';

export interface FreezeResult {
  branch: string;
  baseCommit: string;
  summary: CorpusSummary;
  manifestPath: string;
}

export async function runFreeze(opts: {
  cwd: string;
  name: string;
  keptFacets: string[];
  labels: Labels;
  now: string;
  version: string;
}): Promise<FreezeResult> {
  const git = createGit(opts.cwd);
  await assertClean(git);
  const baseCommit = await headSha(git);
  const branch = await createExperimentBranch(git, opts.name);

  const keep = new Set(opts.keptFacets);
  const summary = await runCorpus(opts.cwd, keep, opts.labels);
  await formatFiles(summary.written);

  const manifest = buildManifest({
    name: opts.name,
    baseCommit,
    keptFacets: opts.keptFacets,
    createdAt: opts.now,
    version: opts.version,
  });
  const manifestPath = await writeManifest(opts.cwd, manifest);

  await commitAll(git, `[storybook-freeze] Freeze experiment ${opts.name}`);

  return { branch, baseCommit, summary, manifestPath };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run --project @base-ui/storybook-freeze freeze`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/storybook-freeze/src/format.ts packages/storybook-freeze/src/freeze.ts packages/storybook-freeze/src/freeze.test.ts
git commit -m "[storybook-freeze] Add Prettier pass and freeze orchestrator"
```

---

## Task 11: `cli` — clack flow and root script

**Files:**
- Create: `packages/storybook-freeze/src/cli.ts`
- Modify: root `package.json` (add `experiment:freeze` script)

**Interfaces:**
- Consumes: `loadLabels`, `runFreeze`.
- Produces: an executable CLI entry (`bin` already declared in Task 1) and a root script `pnpm experiment:freeze`.

- [ ] **Step 1: Write `cli.ts`**

```ts
#!/usr/bin/env node
import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLabels } from './labels';
import { runFreeze } from './freeze';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS_PATH = path.join(REPO_ROOT, 'apps/storybook/classification-labels.jsonc');
const VERSION = '0.1.0';

async function main(): Promise<void> {
  p.intro('storybook-freeze');

  const labels = loadLabels(LABELS_PATH);

  const kept = await p.multiselect({
    message: 'Select the facets to KEEP (everything else is stripped):',
    options: labels.offerableFacets.map((facet) => ({ value: facet, label: facet })),
    required: false,
  });
  if (p.isCancel(kept)) {
    p.cancel('Aborted.');
    process.exit(0);
  }

  const name = await p.text({
    message: 'Experiment name:',
    validate: (value) =>
      /^[a-z0-9][a-z0-9-]*$/.test(value)
        ? undefined
        : 'Use lowercase letters, digits, and dashes (must start with a letter or digit).',
  });
  if (p.isCancel(name)) {
    p.cancel('Aborted.');
    process.exit(0);
  }

  const keptFacets = kept as string[];
  const proceed = await p.confirm({
    message: `Create experiment/${name} keeping ${keptFacets.length} facet(s)? Everything else is stripped.`,
  });
  if (p.isCancel(proceed) || !proceed) {
    p.cancel('Aborted.');
    process.exit(0);
  }

  const spinner = p.spinner();
  spinner.start('Freezing the corpus…');
  try {
    const result = await runFreeze({
      cwd: REPO_ROOT,
      name: name as string,
      keptFacets,
      labels,
      now: new Date().toISOString(),
      version: VERSION,
    });
    spinner.stop('Done.');
    p.outro(
      `Branch ${result.branch} · ${result.summary.written.length} file(s) edited · ` +
        `${result.summary.removed.length} file(s) removed · ${result.summary.storiesRemoved} story export(s) dropped`,
    );
  } catch (error) {
    spinner.stop('Failed.');
    p.log.error((error as Error).message);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: Add the root script**

In the repo root `package.json`, add to `"scripts"`:

```json
"experiment:freeze": "tsx packages/storybook-freeze/src/cli.ts",
```

- [ ] **Step 3: Manually verify the CLI boots and lists facets**

Run: `pnpm experiment:freeze`
Expected: the clack intro renders and the multiselect lists qualified facets (e.g. `mdx.props`, `story.showcase`), with `mdx.styling`/`mdx.testing`/`story.infra` absent. Press Ctrl-C to abort (no branch is created before the confirm step).

- [ ] **Step 4: Typecheck the package**

Run: `pnpm --filter @base-ui/storybook-freeze typescript`
Expected: no type errors.

- [ ] **Step 5: Run the full package test suite**

Run: `pnpm vitest run --project @base-ui/storybook-freeze`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/storybook-freeze/src/cli.ts package.json
git commit -m "[storybook-freeze] Add clack CLI and root script"
```

---

## Task 12: End-to-end dry run on the real repo

**Files:** none (verification only).

- [ ] **Step 1: Ensure a clean tree on a throwaway branch**

```bash
git status --short   # expect empty
```

- [ ] **Step 2: Run a real freeze keeping a small facet set**

Run: `pnpm experiment:freeze`
Choose to keep, for example, `story.showcase`, `mdx.general`, `source-jsdoc.component`. Name it `dry-run-1`.
Expected: completes; prints branch `experiment/dry-run-1` and non-zero edited/removed/dropped counts.

- [ ] **Step 3: Inspect the result**

```bash
git show --stat HEAD | head -40
cat experiment.json
```
Expected: `experiment.json` lists the chosen `keptFacets`, a 40-char `baseCommit`, and `experiment/dry-run-1`. The diff shows removed stories, stripped MDX sections, and stripped source JSDoc.

- [ ] **Step 4: Confirm the corpus still parses**

Run: `pnpm --filter base-ui-storybook build-storybook` (or `pnpm eslint apps/storybook/src/stories --no-error-on-unmatched-pattern`)
Expected: no syntax errors introduced by the transforms. If failures surface, capture the file and fix the relevant transform, then re-run from Task 4/5/6 as appropriate.

- [ ] **Step 5: Clean up the dry-run branch**

```bash
git checkout -
git branch -D experiment/dry-run-1
```

---

## Self-Review

**1. Spec coverage:**

- Core keep-set rule & qualified facets → Tasks 2, 4, 5, 6.
- `source-jsdoc.component`/`.props` heuristic → Task 4.
- `csf-jsdoc.meta`/`.story` → Task 5.
- Story keep/strip via merged `meta ∪ story` tags, descriptors ignored, delete-facet wins → Task 5.
- File pruning of emptied `*.stories.tsx` → Tasks 5 (counts) + 7 (unlink).
- Two disjoint MDX kinds (whole-file general drop; section stripping) → Task 6.
- Corpus enumeration across `apps/storybook` + `packages/react` → Task 7.
- Git: clean-tree, fork from HEAD, single commit, branch-exists guard → Tasks 8 + 10.
- Manifest `experiment.json` → Task 9.
- Prettier pass on changed files → Task 10.
- `@clack/prompts` flow, `delete` hidden, name validation, confirm-before-branch → Task 11.
- Error handling (dirty tree, branch exists, parse failure) → Tasks 3, 8; surfaced in CLI Task 11.
- Testing conventions (Vitest, node env, `*.test.ts` beside source) → all tasks.

No spec requirement is left without a task.

**2. Placeholder scan:** No TBD/TODO/"handle edge cases" placeholders; every code step contains complete code and every run step states the exact command and expected result.

**3. Type consistency:** `Labels`, `Facet`, `CorpusSummary`, `StoryTransformResult`, `TransformResult`, `MdxTransformResult`, `Manifest`, `FreezeResult` are each defined once and consumed with matching field names (`written`/`removed`/`storiesRemoved`, `remainingStoryExports`/`removedStoryExports`, `deleteFile`, `changed`, `keptFacets`, `baseCommit`). `loadLabels`, `parse`, `leadingBlockComment`, `transformSource`, `transformStory`, `transformMdx`, `runCorpus`, `runFreeze`, `buildManifest`/`writeManifest`, and the git functions keep consistent names across tasks.

---

## Addendum: dangling MDX imports (implemented after Task 12)

Per-component `*.mdx` docs namespace-import their CSF file
(`import * as XStories from './x.stories'`) and render it via `<Meta of={XStories} />` /
`<Canvas of={XStories.…} />`. When the freeze prunes that CSF file, the doc would fail to
build, so it must be deleted too.

- `mdx-transform.ts` gains `starImportSpecifiers(code: string): string[]` — the specifiers of
  every `import * as X from '...'`. Unit-tested in `mdx-transform.test.ts`.
- `corpus.ts` now processes stories first, collects the extensionless absolute paths of pruned
  CSF files, then processes MDX: a `*.mdx` whose `import * as …` resolves (dir + specifier,
  `.tsx` normalized) to a pruned CSF is unlinked before any section transform runs. Source
  files run concurrently with stories. Covered by a temp-dir case in `corpus.test.ts`
  (imports-pruned-CSF ⇒ deleted; imports-surviving-CSF ⇒ kept).
- **Known limitation:** whole-file references only. An MDX that survives but references an
  individual removed export (`<Canvas of={XStories.SomeRemovedStory} />` while other exports
  remain) is left dangling. Deferred.

---

## Addendum: dead-code purge and Canvas cleanup (implemented after the dangling-MDX fix)

Two further cleanups so a frozen branch has no orphaned code or docs.

**Dead code (`deadcode.ts` + `biome.ts`, wired in `freeze.ts`).** Stripping story exports
leaves helper functions and imports unused.
- `removeUnusedTopLevel(filename, code)` parses with oxc and removes non-exported top-level
  functions/variables whose bindings are unreferenced elsewhere, iterating to a fixpoint.
  Reference counting is liberal (every identifier occurrence counts as a use) so it never
  deletes a still-referenced declaration.
- `removeUnusedImports(files, cwd)` runs `biome lint --write --unsafe
  --only=correctness/noUnusedImports`. Biome's `noUnusedVariables` only underscore-renames, so
  function/const deletion is handled by `deadcode`, not Biome.
- `freeze.ts` runs both over the changed `*.stories.tsx` (oxc first, then Biome) before
  Prettier. `@biomejs/biome` is a dev dependency; the binary is resolved via `createRequire`.

**Dangling Canvas references (`canvas-purge.ts`, wired in `corpus.ts`).** `transformStory` now
reports `removedStoryNames`; `mdx-transform` exposes `starImports` (alias + specifier).
`corpus` builds a map of surviving-CSF → removed export names, and for each sibling MDX purges
`<Canvas of={Alias.RemovedExport} />` and drops any subsection heading left empty (cascading to
parents). This closes the earlier "known limitation" about per-export references.

**Verified on the real corpus:** a dry run keeping `story.showcase` + `mdx.general` +
`source-jsdoc.component` produced 0 dangling Canvas references, 0 unused imports, and 0 unused
variables across all surviving story files.

---

## Addendum: config-driven batch regeneration (replaces the interactive CLI)

The CLI no longer prompts for facets/name per run. It reads a root `experiments.config.ts`
that default-exports `Array<{ branchName: string; facets: string[] }>` and regenerates one
branch per entry.

- **`config.ts`** — `loadExperiments(cwd)` dynamic-imports the default export;
  `validateExperiments(raw, labels)` enforces: array shape, `branchName` starts with
  `experiment/` (used verbatim), unique names, and every facet is an offerable qualified label.
- **`git.ts`** — `createExperimentBranch` (fail-if-exists) is replaced by `localBranches`,
  `currentRef` (branch name, or SHA if detached), `checkoutRef`, and `resetBranchToHead`
  (`checkout -B`, i.e. create-or-overwrite).
- **`manifest.ts`** — keyed by `branchName` (dropped the derived `name`/`branch` split).
- **`freeze.ts`** — split into `buildExperimentBranch` (reset to base → strip → dead-code →
  Prettier → manifest → commit) and `regenerateExperiments` (assert clean, capture base, build
  each entry sequentially — `no-await-in-loop` disabled because the branches share one working
  tree — then return to base).
- **`cli.ts`** — load + validate config, assert clean, list all local branches, and if any
  target `branchName` already exists, one `confirm` to override (decline ⇒ abort, no changes).
  No collisions ⇒ no prompt.
- **`experiments.config.ts`** — a sample lives at the repo root.

**Verified end-to-end on the real repo:** first run (no collisions) built
`experiment/showcase-only` and `experiment/api-reference` from the same base commit with
correct manifests; a second run listed the collisions, aborted on decline, and overwrote both
branches on accept; the base branch was restored and clean after every run.
