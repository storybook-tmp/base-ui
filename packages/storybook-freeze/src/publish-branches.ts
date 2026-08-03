#!/usr/bin/env node
/**
 * Force-push the locally regenerated `experiment/*` branches to origin
 * (`pnpm experiment:publish-branches`). Each push triggers the
 * storybook-mcp-preview workflow, which builds that branch's Storybook and
 * publishes its @storybook-tmp/baseui-mcp preview package to pkg.pr.new.
 *
 * Branches whose remote ref already points at the local commit are skipped, so re-running
 * after a partial failure only pushes what is actually missing.
 */
import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadLabels } from './labels';
import { loadExperiments, validateExperiments } from './config';
import {
  createGit,
  forcePushBranch,
  localBranchShas,
  remoteBranchSha,
  remoteBranchShas,
  remoteUrl,
} from './git';
import { planBranchPush } from './publish-plan';
import { pushWithRetry, type PushOutcome } from './push-retry';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS_PATH = path.join(REPO_ROOT, 'apps/storybook/classification-labels.jsonc');
const REMOTE = 'origin';
const DEFAULT_ATTEMPTS = 4;
/** Breathing room between pushes: back-to-back receive-packs are what trips GitHub's 5xx. */
const PAUSE_BETWEEN_PUSHES_MS = 500;

function fail(message: string): never {
  p.log.error(message);
  process.exit(1);
}

const bulleted = (branches: string[]): string =>
  branches.map((branch) => `  • ${branch}`).join('\n');

const short = (sha: string | undefined): string => (sha ? sha.slice(0, 7) : '???????');

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** How a push went, when it took more than one clean attempt. */
function pushNote(outcome: PushOutcome): string {
  if (outcome.landedDespiteError) {
    return ' — the connection dropped, but the ref landed';
  }
  if (outcome.attempts > 1) {
    return ` after ${outcome.attempts} attempts`;
  }
  return '';
}

/** The first line of a git error, which is the one naming the actual failure. */
function summarize(error: unknown): string {
  const message = (error as Error).message ?? String(error);
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const notable = lines.find((line) => /^(?:error|fatal|remote:)/i.test(line));
  return notable ?? lines[0] ?? 'unknown error';
}

async function main(): Promise<void> {
  p.intro('storybook-freeze · publish branches');

  const { values } = parseArgs({
    options: {
      yes: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      attempts: { type: 'string' },
    },
  });

  const attempts = values.attempts === undefined ? DEFAULT_ATTEMPTS : Number(values.attempts);
  if (!Number.isInteger(attempts) || attempts < 1) {
    fail(`--attempts must be a positive integer, got "${values.attempts}".`);
  }

  const labels = loadLabels(LABELS_PATH);

  let experiments;
  try {
    experiments = validateExperiments(await loadExperiments(REPO_ROOT), labels);
  } catch (error) {
    fail((error as Error).message);
  }

  const git = createGit(REPO_ROOT);
  const localShas = await localBranchShas(git);
  const url = await remoteUrl(git, REMOTE);

  const readingRemote = p.spinner();
  readingRemote.start(`Reading ${REMOTE} refs…`);
  let remoteShas: Map<string, string> | undefined;
  try {
    remoteShas = await remoteBranchShas(git, REMOTE);
    readingRemote.stop(`${REMOTE}${url ? ` (${url})` : ''}: ${remoteShas.size} branch(es).`);
  } catch (error) {
    readingRemote.stop(`Could not read ${REMOTE} refs.`);
    p.log.warn(
      `${summarize(error)}\nStaleness is unknown, so every local experiment branch will be pushed.`,
    );
  }

  const plan = planBranchPush({
    configBranches: experiments.map((experiment) => experiment.branchName),
    localShas,
    remoteShas,
    force: values.force,
  });

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
  if (plan.upToDate.length > 0) {
    p.log.info(
      `Skipping ${plan.upToDate.length} branch(es) already up to date on ${REMOTE}:\n${bulleted(
        plan.upToDate.map((branch) => `${branch} @ ${short(localShas.get(branch))}`),
      )}`,
    );
  }

  if (plan.push.length === 0) {
    if (plan.upToDate.length > 0) {
      p.outro(`Nothing to push — all ${plan.upToDate.length} branch(es) match ${REMOTE}.`);
      process.exit(0);
    }
    p.cancel(
      'No configured experiment branches exist locally — run `pnpm experiment:freeze` first.',
    );
    process.exit(1);
  }

  /** What the branch currently points at on the remote, for the "old → new" line. */
  const remoteState = (branch: string): string => {
    if (!remoteShas) {
      return 'unknown';
    }
    const sha = remoteShas.get(branch);
    return sha ? short(sha) : 'new branch';
  };

  p.log.info(
    `Branches to force-push to ${REMOTE}:\n${bulleted(
      plan.push.map(
        (branch) => `${branch} · ${remoteState(branch)} → ${short(localShas.get(branch))}`,
      ),
    )}`,
  );

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

  const pushed: string[] = [];
  const failed: { branch: string; reason: string }[] = [];

  // Sequential on purpose: per-branch progress stays readable and a failure points at the exact
  // branch it happened on. One branch failing does not stop the rest — a re-run skips whatever
  // already landed.
  /* eslint-disable no-await-in-loop */
  for (const [index, branch] of plan.push.entries()) {
    const position = `[${index + 1}/${plan.push.length}]`;
    const sha = localShas.get(branch);
    const spinner = p.spinner();
    spinner.start(`${position} Pushing ${branch} (${short(sha)})…`);

    try {
      const outcome = await pushWithRetry({
        attempts,
        push: () => forcePushBranch(git, REMOTE, branch),
        verify: async () => (await remoteBranchSha(git, REMOTE, branch)) === sha,
        onRetry: ({ attempt, delayMs, message }) => {
          spinner.message(
            `${position} ${branch}: attempt ${attempt}/${attempts} failed ` +
              `(${summarize(new Error(message))}) — retrying in ${Math.round(delayMs / 1000)}s…`,
          );
        },
      });
      pushed.push(branch);
      spinner.stop(`${position} Pushed ${branch} (${short(sha)})${pushNote(outcome)}.`);
    } catch (error) {
      const reason = summarize(error);
      failed.push({ branch, reason });
      spinner.stop(`${position} Failed to push ${branch}.`);
      p.log.error(`${branch}: ${reason}`);
    }

    if (index < plan.push.length - 1) {
      await wait(PAUSE_BETWEEN_PUSHES_MS);
    }
  }
  /* eslint-enable no-await-in-loop */

  if (failed.length > 0) {
    p.log.success(`Pushed ${pushed.length}/${plan.push.length} branch(es):\n${bulleted(pushed)}`);
    fail(
      `Failed to push ${failed.length} branch(es) after ${attempts} attempt(s) each:\n${bulleted(
        failed.map(({ branch, reason }) => `${branch}: ${reason}`),
      )}\nRe-run \`pnpm experiment:publish-branches\` — branches that already landed are skipped.`,
    );
  }

  p.outro(
    `Pushed ${pushed.length} branch(es). Each push triggers the "Storybook MCP preview" workflow, ` +
      "which publishes that branch's @storybook-tmp/baseui-mcp package to pkg.pr.new.",
  );
}

main();
