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
  forcePushBranch,
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

  it('forcePushBranch overwrites the remote branch after a history rewrite', async () => {
    const git = createGit(dir);
    // The bare remote lives outside the working repo so its refs never show up
    // as working-tree changes there.
    const remoteDir = await mkdtemp(path.join(tmpdir(), 'freeze-git-remote-'));
    try {
      await createGit(remoteDir).init(true);
      await git.addRemote('origin', remoteDir);

      await resetBranchToHead(git, 'experiment/exp-1');
      await forcePushBranch(git, 'origin', 'experiment/exp-1');

      // Regeneration rewrites the branch: same name, diverged history.
      await writeFile(path.join(dir, 'a.txt'), 'regenerated\n');
      await git.add(['-A']);
      await git.raw(['commit', '--amend', '-m', 'regenerated']);
      await forcePushBranch(git, 'origin', 'experiment/exp-1');

      const remote = createGit(remoteDir);
      expect((await remote.revparse(['experiment/exp-1'])).trim()).toBe(await headSha(git));
    } finally {
      await rm(remoteDir, { recursive: true, force: true });
    }
  });
});
