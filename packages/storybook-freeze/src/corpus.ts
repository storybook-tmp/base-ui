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
