import { readFile, writeFile } from 'node:fs/promises';
import { createGit, assertClean, headSha, createExperimentBranch, commitAll } from './git';
import { runCorpus, type CorpusSummary } from './corpus';
import { buildManifest, writeManifest } from './manifest';
import { removeUnusedTopLevel } from './deadcode';
import { removeUnusedImports } from './biome';
import { formatFiles } from './format';
import type { Labels } from './labels';

export interface FreezeResult {
  branch: string;
  baseCommit: string;
  summary: CorpusSummary;
  manifestPath: string;
}

/**
 * Story files lose helper functions and imports when their stories are stripped. Delete the
 * now-unreferenced top-level declarations (oxc), then let Biome drop the imports they freed.
 */
async function purgeDeadCode(writtenFiles: string[], cwd: string): Promise<void> {
  const storyFiles = writtenFiles.filter((file) => file.endsWith('.stories.tsx'));
  if (storyFiles.length === 0) {
    return;
  }
  await Promise.all(
    storyFiles.map(async (file) => {
      const code = await readFile(file, 'utf8');
      const purged = removeUnusedTopLevel(file, code);
      if (purged.changed) {
        await writeFile(file, purged.code);
      }
    }),
  );
  removeUnusedImports(storyFiles, cwd);
}

export async function runFreeze(opts: {
  cwd: string;
  name: string;
  keptFacets: string[];
  labels: Labels;
  now: string;
  version: string;
}): Promise<FreezeResult> {
  const git = createGit(opts.cwd);
  await assertClean(git);
  const baseCommit = await headSha(git);
  const branch = await createExperimentBranch(git, opts.name);

  const keep = new Set(opts.keptFacets);
  const summary = await runCorpus(opts.cwd, keep, opts.labels);
  await purgeDeadCode(summary.written, opts.cwd);
  await formatFiles(summary.written);

  const manifest = buildManifest({
    name: opts.name,
    baseCommit,
    keptFacets: opts.keptFacets,
    createdAt: opts.now,
    version: opts.version,
  });
  const manifestPath = await writeManifest(opts.cwd, manifest);

  await commitAll(git, `[storybook-freeze] Freeze experiment ${opts.name}`);

  return { branch, baseCommit, summary, manifestPath };
}
