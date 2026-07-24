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
    await git.checkout('-');
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
