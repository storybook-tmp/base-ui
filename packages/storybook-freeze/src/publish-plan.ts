/**
 * Which experiment branches `experiment:publish-branches` should force-push.
 *
 * - `push`: configured branches that exist locally and differ from the remote.
 * - `upToDate`: configured branches whose remote ref already points at the local commit;
 *   pushing them would be a no-op that still costs a CI run, so they are skipped.
 * - `missing`: configured branches with no local branch — regenerate with
 *   `pnpm experiment:freeze` before publishing.
 * - `stray`: local `experiment/*` branches no longer in experiments.config.ts;
 *   they are skipped so retired experiments do not keep shipping.
 */
export interface PushPlan {
  push: string[];
  upToDate: string[];
  missing: string[];
  stray: string[];
}

export interface PushPlanInput {
  configBranches: string[];
  /** Local branch name → commit sha, for every local branch (not just configured ones). */
  localShas: ReadonlyMap<string, string>;
  /**
   * Remote branch name → commit sha. Omit (or pass an empty map) when the remote could not be
   * read: every local branch is then pushed, since staleness is unknown.
   */
  remoteShas?: ReadonlyMap<string, string> | undefined;
  /** Push branches even when the remote already matches, e.g. to re-trigger the CI workflow. */
  force?: boolean | undefined;
}

export function planBranchPush(input: PushPlanInput): PushPlan {
  const { configBranches, localShas, remoteShas, force = false } = input;
  const configured = new Set(configBranches);

  const present = configBranches.filter((branch) => localShas.has(branch));
  const upToDate = force
    ? []
    : present.filter((branch) => remoteShas?.get(branch) === localShas.get(branch));
  const skip = new Set(upToDate);

  return {
    push: present.filter((branch) => !skip.has(branch)),
    upToDate,
    missing: configBranches.filter((branch) => !localShas.has(branch)),
    stray: [...localShas.keys()].filter(
      (branch) => branch.startsWith('experiment/') && !configured.has(branch),
    ),
  };
}
