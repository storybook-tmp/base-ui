/**
 * Which experiment branches `storybook:publish-branches` should force-push.
 *
 * - `push`: configured branches that exist locally.
 * - `missing`: configured branches with no local branch — regenerate with
 *   `pnpm experiment:freeze` before publishing.
 * - `stray`: local `experiment/*` branches no longer in experiments.config.ts;
 *   they are skipped so retired experiments do not keep shipping.
 */
export interface PushPlan {
  push: string[];
  missing: string[];
  stray: string[];
}

export function planBranchPush(configBranches: string[], localBranches: string[]): PushPlan {
  const local = new Set(localBranches);
  const configured = new Set(configBranches);
  return {
    push: configBranches.filter((branch) => local.has(branch)),
    missing: configBranches.filter((branch) => !local.has(branch)),
    stray: localBranches.filter(
      (branch) => branch.startsWith('experiment/') && !configured.has(branch),
    ),
  };
}
