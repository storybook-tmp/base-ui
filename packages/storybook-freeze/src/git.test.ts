import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createGit,
  assertClean,
  headSha,
  commitAll,
  localBranches,
  currentRef,
  checkoutRef,
  resetBranchToHead,
} from './git';

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

  it('creates or resets a branch to HEAD and returns to the base ref', async () => {
    const git = createGit(dir);
    const base = await currentRef(git);

    await resetBranchToHead(git, 'experiment/exp-1');
    expect((await git.status()).current).toBe('experiment/exp-1');
    expect(await localBranches(git)).toContain('experiment/exp-1');

    // Resetting again is not an error (regeneration overwrites).
    await checkoutRef(git, base);
    await resetBranchToHead(git, 'experiment/exp-1');
    expect((await git.status()).current).toBe('experiment/exp-1');

    await checkoutRef(git, base);
    expect((await git.status()).current).toBe(base);
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
