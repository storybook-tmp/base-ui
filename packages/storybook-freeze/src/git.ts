import { simpleGit, type SimpleGit } from 'simple-git';

export function createGit(cwd: string): SimpleGit {
  return simpleGit(cwd);
}

export async function assertClean(git: SimpleGit): Promise<void> {
  const status = await git.status();
  if (!status.isClean()) {
    throw new Error(
      'Base UI: storybook-freeze requires a clean working tree, but there are uncommitted changes. ' +
        'The experiment branch must fork from a known commit to stay reproducible. ' +
        'Commit or stash your changes, then re-run.',
    );
  }
}

export async function headSha(git: SimpleGit): Promise<string> {
  return (await git.revparse(['HEAD'])).trim();
}

export async function localBranches(git: SimpleGit): Promise<string[]> {
  return (await git.branchLocal()).all;
}

/** The ref to return to after regenerating: the current branch name, or the SHA if detached. */
export async function currentRef(git: SimpleGit): Promise<string> {
  const name = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
  if (name === 'HEAD') {
    return (await git.revparse(['HEAD'])).trim();
  }
  return name;
}

export async function checkoutRef(git: SimpleGit, ref: string): Promise<void> {
  await git.checkout(ref);
}

/** Create or reset `branch` to point at the current HEAD (like `git checkout -B`). */
export async function resetBranchToHead(git: SimpleGit, branch: string): Promise<void> {
  await git.checkout(['-B', branch]);
}

export async function commitAll(git: SimpleGit, message: string): Promise<void> {
  await git.add(['-A']);
  await git.commit(message);
}
