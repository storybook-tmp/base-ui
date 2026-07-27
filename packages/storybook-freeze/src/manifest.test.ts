import { expect, it, describe, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildManifest, writeManifest } from './manifest';

let dir: string | undefined;
afterEach(async () => {
  if (dir) {
    await rm(dir, { recursive: true, force: true });
    dir = undefined;
  }
});

describe('manifest', () => {
  it('builds a manifest with a sorted keep-set from the branch name', () => {
    const m = buildManifest({
      branchName: 'experiment/exp-1',
      baseCommit: 'abc123',
      keptFacets: ['story.showcase', 'mdx.props'],
      createdAt: '2026-07-24T00:00:00.000Z',
      version: 1,
    });
    expect(m.branchName).toBe('experiment/exp-1');
    expect(m.keptFacets).toEqual(['mdx.props', 'story.showcase']);
    expect(m.version).toBe(1);
  });

  it('writes experiment.json to cwd', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'freeze-manifest-'));
    const m = buildManifest({
      branchName: 'experiment/exp-1',
      baseCommit: 'abc123',
      keptFacets: [],
      createdAt: '2026-07-24T00:00:00.000Z',
      version: 1,
    });
    const p = await writeManifest(dir, m);
    expect(p).toBe(path.join(dir, 'experiment.json'));
    const parsed = JSON.parse(await readFile(p, 'utf8'));
    expect(parsed.branchName).toBe('experiment/exp-1');
  });
});
