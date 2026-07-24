import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface Manifest {
  branchName: string;
  baseCommit: string;
  keptFacets: string[];
  createdAt: string;
  tool: string;
}

export function buildManifest(args: {
  branchName: string;
  baseCommit: string;
  keptFacets: string[];
  createdAt: string;
  version: string;
}): Manifest {
  return {
    branchName: args.branchName,
    baseCommit: args.baseCommit,
    keptFacets: [...args.keptFacets].sort(),
    createdAt: args.createdAt,
    tool: `storybook-freeze@${args.version}`,
  };
}

export async function writeManifest(cwd: string, manifest: Manifest): Promise<string> {
  const filePath = path.join(cwd, 'experiment.json');
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
  return filePath;
}
