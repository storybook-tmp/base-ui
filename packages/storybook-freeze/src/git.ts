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

export async function createExperimentBranch(git: SimpleGit, name: string): Promise<string> {
  const branch = `experiment/${name}`;
  const branches = await git.branchLocal();
  if (branches.all.includes(branch)) {
    throw new Error(
      `Base UI: storybook-freeze cannot create branch "${branch}" because it already exists. ` +
        'Each experiment needs its own branch so earlier results are not overwritten. ' +
        'Choose a different experiment name or delete the existing branch first.',
    );
  }
  await git.checkoutLocalBranch(branch);
  return branch;
}

export async function commitAll(git: SimpleGit, message: string): Promise<void> {
  await git.add(['-A']);
  await git.commit(message);
}
