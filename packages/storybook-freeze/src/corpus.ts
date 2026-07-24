import { globby } from 'globby';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { transformSource } from './source-transform';
import { transformStory } from './story-transform';
import { transformMdx, starImports } from './mdx-transform';
import { purgeCanvasReferences } from './canvas-purge';
import type { Labels } from './labels';

export interface CorpusSummary {
  written: string[];
  removed: string[];
  storiesRemoved: number;
}

interface FileOutcome {
  written?: string | undefined;
  removed?: string | undefined;
  storiesRemoved?: number | undefined;
  csfKey?: string | undefined;
  removedNames?: string[] | undefined;
  pruned?: boolean | undefined;
}

function withoutTsx(absolutePath: string): string {
  return absolutePath.replace(/\.tsx$/, '');
}

async function processStoryFile(
  file: string,
  keep: ReadonlySet<string>,
  labels: Labels,
): Promise<FileOutcome> {
  const code = await readFile(file, 'utf8');
  const result = transformStory(file, code, keep, labels);
  const base: FileOutcome = {
    csfKey: withoutTsx(file),
    removedNames: result.removedStoryNames,
    storiesRemoved: result.removedStoryExports,
  };
  if (result.remainingStoryExports === 0 && result.removedStoryExports > 0) {
    await rm(file);
    return { ...base, removed: file, pruned: true };
  }
  if (result.changed) {
    await writeFile(file, result.code);
    return { ...base, written: file };
  }
  return base;
}

async function processSourceFile(file: string, keep: ReadonlySet<string>): Promise<FileOutcome> {
  const code = await readFile(file, 'utf8');
  const result = transformSource(file, code, keep);
  if (result.changed) {
    await writeFile(file, result.code);
    return { written: file };
  }
  return {};
}

async function processMdxFile(
  file: string,
  keep: ReadonlySet<string>,
  prunedCsf: ReadonlySet<string>,
  removedExportsByCsf: ReadonlyMap<string, ReadonlySet<string>>,
): Promise<FileOutcome> {
  const code = await readFile(file, 'utf8');
  const dir = path.dirname(file);
  const imports = starImports(code);

  // Whole-file removal: the doc namespace-imports a CSF that was pruned entirely.
  if (imports.some((entry) => prunedCsf.has(withoutTsx(path.resolve(dir, entry.specifier))))) {
    await rm(file);
    return { removed: file };
  }

  const transformed = transformMdx(file, code, keep);
  if (transformed.deleteFile) {
    await rm(file);
    return { removed: file };
  }

  // Purge Canvas invocations of exports removed from a surviving sibling CSF.
  const removedRefs = new Set<string>();
  for (const entry of imports) {
    const removedNames = removedExportsByCsf.get(withoutTsx(path.resolve(dir, entry.specifier)));
    if (removedNames) {
      for (const name of removedNames) {
        removedRefs.add(`${entry.alias}.${name}`);
      }
    }
  }
  const purged = purgeCanvasReferences(transformed.code, removedRefs);

  if (transformed.changed || purged.changed) {
    await writeFile(file, purged.code);
    return { written: file };
  }
  return {};
}

function collect(summary: CorpusSummary, outcomes: FileOutcome[]): void {
  for (const outcome of outcomes) {
    if (outcome.written) {
      summary.written.push(outcome.written);
    }
    if (outcome.removed) {
      summary.removed.push(outcome.removed);
    }
    if (outcome.storiesRemoved) {
      summary.storiesRemoved += outcome.storiesRemoved;
    }
  }
}

export async function runCorpus(
  cwd: string,
  keep: ReadonlySet<string>,
  labels: Labels,
): Promise<CorpusSummary> {
  const [storyFiles, mdxFiles, sourceFiles] = await Promise.all([
    globby('apps/storybook/src/stories/**/*.stories.tsx', { cwd, absolute: true }),
    globby('apps/storybook/src/stories/**/*.mdx', { cwd, absolute: true }),
    globby(['packages/react/src/**/*.tsx', '!**/*.test.tsx', '!**/*.stories.tsx'], {
      cwd,
      absolute: true,
    }),
  ]);

  // Source files are independent; let them run while stories are processed. MDX processing
  // must wait for story results so it can drop docs that import a pruned CSF file and purge
  // Canvas invocations of exports removed from a surviving CSF.
  const sourcesPromise = Promise.all(sourceFiles.map((file) => processSourceFile(file, keep)));

  const storyOutcomes = await Promise.all(
    storyFiles.map((file) => processStoryFile(file, keep, labels)),
  );

  const prunedCsf = new Set<string>();
  const removedExportsByCsf = new Map<string, ReadonlySet<string>>();
  for (const outcome of storyOutcomes) {
    if (!outcome.csfKey) {
      continue;
    }
    if (outcome.pruned) {
      prunedCsf.add(outcome.csfKey);
    } else if (outcome.removedNames && outcome.removedNames.length > 0) {
      removedExportsByCsf.set(outcome.csfKey, new Set(outcome.removedNames));
    }
  }

  const mdxOutcomes = await Promise.all(
    mdxFiles.map((file) => processMdxFile(file, keep, prunedCsf, removedExportsByCsf)),
  );
  const sourceOutcomes = await sourcesPromise;

  const summary: CorpusSummary = { written: [], removed: [], storiesRemoved: 0 };
  collect(summary, storyOutcomes);
  collect(summary, mdxOutcomes);
  collect(summary, sourceOutcomes);
  return summary;
}
