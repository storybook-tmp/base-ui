/**
 * Assemble this package for a pkg.pr.new preview publish.
 *
 * Copies the Storybook build's MCP manifests into the package, records build
 * provenance, stamps a branch-derived version, and lifts the `private` flag so the
 * package can be packed. It mutates package.json in place, so it is meant for CI
 * (.github/workflows/storybook-mcp-preview.yml) or a throwaway local checkout.
 * Never commit its output.
 *
 * Reads GITHUB_REPOSITORY / GITHUB_REF_NAME / GITHUB_SHA for provenance and
 * version metadata. Falls back to the local git checkout.
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { simpleGit } from 'simple-git';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const staticDir = path.join(packageRoot, '..', 'storybook', 'storybook-static');

const git = simpleGit({ baseDir: packageRoot });

async function revParse(...args) {
  try {
    return (await git.revparse(args)).trim();
  } catch {
    return null;
  }
}

const manifestsSource = path.join(staticDir, 'manifests');
if (!existsSync(path.join(manifestsSource, 'components.json'))) {
  console.error(
    `No manifests/components.json in ${staticDir}, so there is nothing to publish. ` +
      'Build the Storybook first: pnpm --filter base-ui-storybook build-storybook.',
  );
  process.exit(1);
}

const branch = process.env.GITHUB_REF_NAME ?? (await revParse('--abbrev-ref', 'HEAD'));
const sha = process.env.GITHUB_SHA ?? (await revParse('HEAD'));

// Copy manifests/ (and, for docgen-server builds, its sibling services/) into the
// package so `files` picks them up.
for (const dir of ['manifests', 'services']) {
  const source = path.join(staticDir, dir);
  const target = path.join(packageRoot, dir);
  rmSync(target, { recursive: true, force: true });
  if (existsSync(source)) {
    cpSync(source, target, { recursive: true });
    process.stdout.write(`Copied ${source} -> ${target}\n`);
  }
}

const provenance = {
  repo: process.env.GITHUB_REPOSITORY ?? null,
  branch: branch ?? null,
  sha: sha ?? null,
  builtAt: new Date().toISOString(),
};
writeFileSync(
  path.join(packageRoot, 'provenance.json'),
  `${JSON.stringify(provenance, null, 2)}\n`,
);

// `experiment/empty` -> `empty`.
const slug =
  (branch ?? '')
    .replace(/^experiment\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'local';
const version = `0.0.0-${slug}.${sha?.slice(0, 7) ?? 'unknown'}`;

const packageJsonPath = path.join(packageRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = version;
// `private` only guards against accidental npm publishes from the repo; the
// pkg.pr.new pack refuses private packages, so publishes lift it explicitly.
delete packageJson.private;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

process.stdout.write(`Prepared ${packageJson.name}@${version} (branch ${branch ?? 'unknown'})\n`);
