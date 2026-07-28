#!/usr/bin/env node
import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLabels } from './labels';
import { loadExperiments, validateExperiments } from './config';
import { createGit, assertClean, localBranches } from './git';
import { regenerateExperiments } from './freeze';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS_PATH = path.join(REPO_ROOT, 'apps/storybook/classification-labels.jsonc');
const VERSION = 1;

function fail(message: string): never {
  p.log.error(message);
  process.exit(1);
}

async function main(): Promise<void> {
  p.intro('storybook-freeze');

  const labels = loadLabels(LABELS_PATH);

  let experiments;
  try {
    experiments = validateExperiments(await loadExperiments(REPO_ROOT), labels);
  } catch (error) {
    fail((error as Error).message);
  }
  if (experiments.length === 0) {
    p.cancel('experiments.config.ts is empty — nothing to regenerate.');
    process.exit(0);
  }

  const git = createGit(REPO_ROOT);
  try {
    await assertClean(git);
  } catch (error) {
    fail((error as Error).message);
  }

  const existing = await localBranches(git);
  p.log.info(`Existing branches:\n${existing.map((branch) => `  • ${branch}`).join('\n')}`);

  const collisions = experiments
    .map((experiment) => experiment.branchName)
    .filter((branchName) => existing.includes(branchName));

  if (collisions.length > 0) {
    const proceed = await p.confirm({
      message: `Override ${collisions.length} existing branch(es)? ${collisions.join(', ')}`,
    });
    if (p.isCancel(proceed) || !proceed) {
      p.cancel('Aborted — no branches changed.');
      process.exit(0);
    }
  }

  const spinner = p.spinner();
  spinner.start(`Regenerating ${experiments.length} experiment branch(es)…`);
  try {
    const results = await regenerateExperiments({
      cwd: REPO_ROOT,
      experiments,
      labels,
      now: new Date().toISOString(),
      version: VERSION,
    });
    spinner.stop('Done.');
    p.outro(
      results
        .map(
          (result) =>
            `${result.branch}: ${result.summary.written.length} edited · ` +
            `${result.summary.removed.length} removed · ${result.summary.storiesRemoved} stories dropped`,
        )
        .join('\n'),
    );
  } catch (error) {
    spinner.stop('Failed.');
    fail((error as Error).message);
  }
}

main();
