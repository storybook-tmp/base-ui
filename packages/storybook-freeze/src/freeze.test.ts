import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
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
      "import * as React from 'react';",
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "function GridHelper() { return React.createElement('div'); }",
      "export const Hero: Story = { tags: ['showcase'], render: () => null };",
      "export const Grid: Story = { tags: ['infra'], render: () => GridHelper() };",
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
    expect(status.isClean()).toBe(true);

    const stories = await readFile(
      path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.stories.tsx'),
      'utf8',
    );
    expect(stories).toContain('export const Hero');
    expect(stories).not.toContain('export const Grid');
    // Dead-code purge: helper and import used only by the removed story are gone.
    expect(stories).not.toContain('GridHelper');
    expect(stories).not.toContain('import * as React');

    const manifest = JSON.parse(await readFile(path.join(dir, 'experiment.json'), 'utf8'));
    expect(manifest.keptFacets).toEqual(['story.showcase']);
    expect(manifest.baseCommit).toMatch(/^[0-9a-f]{40}$/);

    const log = await git.log();
    expect(log.latest?.message).toContain('[storybook-freeze] Freeze experiment exp-1');
  });

  it('refuses to run on a dirty tree', async () => {
    await writeFile(path.join(dir, 'dirty.txt'), 'x\n');
    await expect(
      runFreeze({
        cwd: dir,
        name: 'exp-2',
        keptFacets: [],
        labels,
        now: '2026-07-24T00:00:00.000Z',
        version: '0.1.0',
      }),
    ).rejects.toThrow(/clean working tree/);
  });
});
