import { globby } from 'globby';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { transformSource } from './source-transform';
import { transformStory } from './story-transform';
import { transformMdx, starImportSpecifiers } from './mdx-transform';
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
}

async function processStoryFile(
  file: string,
  keep: ReadonlySet<string>,
  labels: Labels,
): Promise<FileOutcome> {
  const code = await readFile(file, 'utf8');
  const result = transformStory(file, code, keep, labels);
  if (result.remainingStoryExports === 0 && result.removedStoryExports > 0) {
    await rm(file);
    return { removed: file, storiesRemoved: result.removedStoryExports };
  }
  if (result.changed) {
    await writeFile(file, result.code);
    return { written: file, storiesRemoved: result.removedStoryExports };
  }
  return { storiesRemoved: result.removedStoryExports };
}

/**
 * True when the MDX namespace-imports (`import * as X from`) a CSF module that was pruned.
 * Such a doc would fail to build, so it is removed alongside the story file it documents.
 */
function importsRemovedCsf(
  mdxFile: string,
  code: string,
  removedCsfWithoutExtension: ReadonlySet<string>,
): boolean {
  const dir = path.dirname(mdxFile);
  for (const specifier of starImportSpecifiers(code)) {
    const target = path.resolve(dir, specifier).replace(/\.tsx$/, '');
    if (removedCsfWithoutExtension.has(target)) {
      return true;
    }
  }
  return false;
}

async function processMdxFile(
  file: string,
  keep: ReadonlySet<string>,
  removedCsfWithoutExtension: ReadonlySet<string>,
): Promise<FileOutcome> {
  const code = await readFile(file, 'utf8');
  if (importsRemovedCsf(file, code, removedCsfWithoutExtension)) {
    await rm(file);
    return { removed: file };
  }
  const result = transformMdx(file, code, keep);
  if (result.deleteFile) {
    await rm(file);
    return { removed: file };
  }
  if (result.changed) {
    await writeFile(file, result.code);
    return { written: file };
  }
  return {};
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
  // must wait for story results so it can drop docs that import a pruned CSF file.
  const sourcesPromise = Promise.all(sourceFiles.map((file) => processSourceFile(file, keep)));

  const storyOutcomes = await Promise.all(
    storyFiles.map((file) => processStoryFile(file, keep, labels)),
  );

  const removedCsfWithoutExtension = new Set<string>();
  for (const outcome of storyOutcomes) {
    if (outcome.removed) {
      removedCsfWithoutExtension.add(outcome.removed.replace(/\.tsx$/, ''));
    }
  }

  const mdxOutcomes = await Promise.all(
    mdxFiles.map((file) => processMdxFile(file, keep, removedCsfWithoutExtension)),
  );
  const sourceOutcomes = await sourcesPromise;

  const summary: CorpusSummary = { written: [], removed: [], storiesRemoved: 0 };
  collect(summary, storyOutcomes);
  collect(summary, mdxOutcomes);
  collect(summary, sourceOutcomes);
  return summary;
}
