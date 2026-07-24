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

async function processMdxFile(file: string, keep: ReadonlySet<string>): Promise<FileOutcome> {
  const code = await readFile(file, 'utf8');
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

  const outcomes = await Promise.all([
    ...storyFiles.map((file) => processStoryFile(file, keep, labels)),
    ...mdxFiles.map((file) => processMdxFile(file, keep)),
    ...sourceFiles.map((file) => processSourceFile(file, keep)),
  ]);

  const summary: CorpusSummary = { written: [], removed: [], storiesRemoved: 0 };
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
  return summary;
}
