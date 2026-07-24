#!/usr/bin/env node
import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLabels } from './labels';
import { runFreeze } from './freeze';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS_PATH = path.join(REPO_ROOT, 'apps/storybook/classification-labels.jsonc');
const VERSION = '0.1.0';

async function main(): Promise<void> {
  p.intro('storybook-freeze');

  const labels = loadLabels(LABELS_PATH);

  const kept = await p.multiselect({
    message: 'Select the facets to KEEP (everything else is stripped):',
    options: labels.offerableFacets.map((facet) => ({ value: facet, label: facet })),
    required: false,
  });
  if (p.isCancel(kept)) {
    p.cancel('Aborted.');
    process.exit(0);
  }

  const name = await p.text({
    message: 'Experiment name:',
    validate: (value) =>
      value && /^[a-z0-9][a-z0-9-]*$/.test(value)
        ? undefined
        : 'Use lowercase letters, digits, and dashes (must start with a letter or digit).',
  });
  if (p.isCancel(name)) {
    p.cancel('Aborted.');
    process.exit(0);
  }

  const keptFacets = kept as string[];
  const proceed = await p.confirm({
    message: `Create experiment/${name} keeping ${keptFacets.length} facet(s)? Everything else is stripped.`,
  });
  if (p.isCancel(proceed) || !proceed) {
    p.cancel('Aborted.');
    process.exit(0);
  }

  const spinner = p.spinner();
  spinner.start('Freezing the corpus…');
  try {
    const result = await runFreeze({
      cwd: REPO_ROOT,
      name: name as string,
      keptFacets,
      labels,
      now: new Date().toISOString(),
      version: VERSION,
    });
    spinner.stop('Done.');
    p.outro(
      `Branch ${result.branch} · ${result.summary.written.length} file(s) edited · ` +
        `${result.summary.removed.length} file(s) removed · ${result.summary.storiesRemoved} story export(s) dropped`,
    );
  } catch (error) {
    spinner.stop('Failed.');
    p.log.error((error as Error).message);
    process.exit(1);
  }
}

main();
