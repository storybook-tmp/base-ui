import { createGit, assertClean, headSha, createExperimentBranch, commitAll } from './git';
import { runCorpus, type CorpusSummary } from './corpus';
import { buildManifest, writeManifest } from './manifest';
import { formatFiles } from './format';
import type { Labels } from './labels';

export interface FreezeResult {
  branch: string;
  baseCommit: string;
  summary: CorpusSummary;
  manifestPath: string;
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
