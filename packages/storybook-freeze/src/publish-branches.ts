#!/usr/bin/env node
/**
 * Force-push the locally regenerated `experiment/*` branches to origin
 * (`pnpm storybook:publish-branches`). Each push triggers the
 * storybook-mcp-preview workflow, which builds that branch's Storybook and
 * publishes its @storybook-tmp/baseui-mcp preview package to pkg.pr.new.
 */
import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadLabels } from './labels';
import { loadExperiments, validateExperiments } from './config';
import { createGit, localBranches, forcePushBranch } from './git';
import { planBranchPush } from './publish-plan';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS_PATH = path.join(REPO_ROOT, 'apps/storybook/classification-labels.jsonc');
const REMOTE = 'origin';

function fail(message: string): never {
  p.log.error(message);
  process.exit(1);
}

async function main(): Promise<void> {
  p.intro('storybook-freeze · publish branches');

  const { values } = parseArgs({
    options: {
      yes: { type: 'boolean', default: false },
    },
  });

  const labels = loadLabels(LABELS_PATH);

  let experiments;
  try {
    experiments = validateExperiments(await loadExperiments(REPO_ROOT), labels);
  } catch (error) {
    fail((error as Error).message);
  }

  const git = createGit(REPO_ROOT);
  const plan = planBranchPush(
    experiments.map((experiment) => experiment.branchName),
    await localBranches(git),
  );

  const bulleted = (branches: string[]): string =>
    branches.map((branch) => `  • ${branch}`).join('\n');

  if (plan.missing.length > 0) {
    p.log.warn(
      `Skipping ${plan.missing.length} configured branch(es) with no local branch ` +
        `(regenerate them with \`pnpm experiment:freeze\`):\n${bulleted(plan.missing)}`,
    );
  }
  if (plan.stray.length > 0) {
    p.log.warn(
      `Skipping ${plan.stray.length} local experiment branch(es) not in ` +
        `experiments.config.ts:\n${bulleted(plan.stray)}`,
    );
  }
  if (plan.push.length === 0) {
    p.cancel(
      'No configured experiment branches exist locally — run `pnpm experiment:freeze` first.',
    );
    process.exit(1);
  }

  p.log.info(`Branches to force-push to ${REMOTE}:\n${bulleted(plan.push)}`);

  if (!values.yes) {
    const proceed = await p.confirm({
      message:
        `Force-push ${plan.push.length} branch(es)? ` +
        'Remote experiment/* refs are regenerated artifacts and will be overwritten.',
    });
    if (p.isCancel(proceed) || !proceed) {
      p.cancel('Aborted — nothing pushed.');
      process.exit(0);
    }
  }

  const spinner = p.spinner();
  spinner.start(`Pushing ${plan.push.length} branch(es) to ${REMOTE}…`);
  const pushed: string[] = [];
  try {
    // Sequential on purpose: per-branch progress stays readable and a failure
    // points at the exact branch it happened on.
    /* eslint-disable no-await-in-loop */
    for (const branch of plan.push) {
      spinner.message(`Pushing ${branch}…`);
      await forcePushBranch(git, REMOTE, branch);
      pushed.push(branch);
    }
    /* eslint-enable no-await-in-loop */
    spinner.stop(`Pushed ${pushed.length} branch(es).`);
  } catch (error) {
    spinner.stop('Failed.');
    fail(
      `Pushed ${pushed.length}/${plan.push.length} branch(es) before the failure. ` +
        `${(error as Error).message}`,
    );
  }

  p.outro(
    'Done. Each push triggers the "Storybook MCP preview" workflow, which publishes ' +
      "that branch's @storybook-tmp/baseui-mcp package to pkg.pr.new.",
  );
}

main();
