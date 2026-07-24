import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { regenerateExperiments } from './freeze';
import type { Labels } from './labels';

const labels: Labels = {
  offerableFacets: ['story.showcase', 'story.api-ref'],
  deleteFacets: new Set(['story.infra']),
  storyTags: new Set(['showcase', 'api-ref', 'infra']),
  isDeleteFacet: (f) => f === 'story.infra',
  isKept: (f, keep) => f !== 'story.infra' && keep.has(f),
};

let dir: string;
let base: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'freeze-regen-'));
  const stories = path.join(dir, 'apps/storybook/src/stories/checkbox');
  await mkdir(stories, { recursive: true });
  await writeFile(
    path.join(stories, 'checkbox.stories.tsx'),
    [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Hero: Story = { tags: ['showcase'], render: () => null };",
      "export const Details: Story = { tags: ['api-ref'], render: () => null };",
      '',
    ].join('\n'),
  );
  const git = simpleGit(dir);
  await git.init();
  await git.addConfig('user.email', 'test@example.com');
  await git.addConfig('user.name', 'Test');
  await git.add(['-A']);
  await git.commit('initial');
  base = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const experiments = [
  { branchName: 'experiment/showcase', facets: ['story.showcase'] },
  { branchName: 'experiment/apiref', facets: ['story.api-ref'] },
];

describe('regenerateExperiments', () => {
  it('builds one branch per entry from the same base and returns to it', async () => {
    const results = await regenerateExperiments({
      cwd: dir,
      experiments,
      labels,
      now: '2026-07-24T00:00:00.000Z',
      version: '0.1.0',
    });
    expect(results.map((r) => r.branch)).toEqual(['experiment/showcase', 'experiment/apiref']);

    const git = simpleGit(dir);
    expect((await git.status()).current).toBe(base);
    const branches = (await git.branchLocal()).all;
    expect(branches).toContain('experiment/showcase');
    expect(branches).toContain('experiment/apiref');

    await git.checkout('experiment/showcase');
    const showcase = await readFile(
      path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.stories.tsx'),
      'utf8',
    );
    expect(showcase).toContain('export const Hero');
    expect(showcase).not.toContain('export const Details');
    const manifest = JSON.parse(await readFile(path.join(dir, 'experiment.json'), 'utf8'));
    expect(manifest.branchName).toBe('experiment/showcase');
    expect(manifest.keptFacets).toEqual(['story.showcase']);

    await git.checkout('experiment/apiref');
    const apiref = await readFile(
      path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.stories.tsx'),
      'utf8',
    );
    expect(apiref).toContain('export const Details');
    expect(apiref).not.toContain('export const Hero');
  });

  it('overwrites an existing target branch on a second run', async () => {
    await regenerateExperiments({
      cwd: dir,
      experiments,
      labels,
      now: '2026-07-24T00:00:00.000Z',
      version: '0.1.0',
    });
    // Second run must not error even though the branches already exist.
    const results = await regenerateExperiments({
      cwd: dir,
      experiments,
      labels,
      now: '2026-07-25T00:00:00.000Z',
      version: '0.1.0',
    });
    expect(results).toHaveLength(2);
    const git = simpleGit(dir);
    expect((await git.status()).current).toBe(base);
  });

  it('refuses to run on a dirty tree', async () => {
    await writeFile(path.join(dir, 'dirty.txt'), 'x\n');
    await expect(
      regenerateExperiments({
        cwd: dir,
        experiments,
        labels,
        now: '2026-07-24T00:00:00.000Z',
        version: '0.1.0',
      }),
    ).rejects.toThrow(/clean working tree/);
  });
});
