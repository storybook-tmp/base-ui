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

/** Every local branch name mapped to the commit it points at. */
export async function localBranchShas(git: SimpleGit): Promise<Map<string, string>> {
  const raw = await git.raw([
    'for-each-ref',
    '--format=%(objectname) %(refname:short)',
    'refs/heads/',
  ]);
  const shas = new Map<string, string>();
  for (const line of raw.split('\n')) {
    const [sha, ...rest] = line.trim().split(/\s+/);
    if (sha && rest.length > 0) {
      shas.set(rest.join(' '), sha);
    }
  }
  return shas;
}

/**
 * Every branch on `remote` mapped to the commit it points at, read with `ls-remote` so no
 * objects are fetched. Used to skip pushes that would be no-ops.
 */
export async function remoteBranchShas(
  git: SimpleGit,
  remote: string,
): Promise<Map<string, string>> {
  const raw = await git.listRemote(['--heads', remote]);
  const shas = new Map<string, string>();
  for (const line of raw.split('\n')) {
    const [sha, ref] = line.trim().split(/\s+/);
    if (sha && ref?.startsWith('refs/heads/')) {
      shas.set(ref.slice('refs/heads/'.length), sha);
    }
  }
  return shas;
}

/** The commit `branch` points at on `remote`, or undefined if the remote has no such branch. */
export async function remoteBranchSha(
  git: SimpleGit,
  remote: string,
  branch: string,
): Promise<string | undefined> {
  const raw = await git.listRemote(['--heads', remote, `refs/heads/${branch}`]);
  const [sha, ref] = raw.trim().split(/\s+/);
  return ref === `refs/heads/${branch}` ? sha : undefined;
}

export async function remoteUrl(git: SimpleGit, remote: string): Promise<string | undefined> {
  try {
    const url = await git.remote(['get-url', remote]);
    return typeof url === 'string' ? url.trim() || undefined : undefined;
  } catch {
    return undefined;
  }
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

/**
 * Force-push `branch` to the same-named ref on `remote`, without checking it out.
 * Regenerated experiment branches rewrite history on every freeze, so they never
 * fast-forward; the remote refs are disposable build artifacts.
 */
export async function forcePushBranch(
  git: SimpleGit,
  remote: string,
  branch: string,
): Promise<void> {
  await git.push([remote, `${branch}:${branch}`, '--force']);
}
