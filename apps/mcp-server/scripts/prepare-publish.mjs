/**
 * Assemble this package for a pkg.pr.new preview publish.
 *
 * Copies the Storybook build's MCP manifests into the package, records build
 * provenance, stamps a branch-derived version, and lifts the `private` flag so the
 * package can be packed. It mutates package.json in place, so it is meant for CI
 * (.github/workflows/storybook-mcp-preview.yml) or a throwaway local checkout —
 * never commit its output.
 *
 * Inputs (all optional):
 * - STORYBOOK_STATIC_DIR: Storybook build output directory.
 *   Defaults to ../storybook/storybook-static.
 * - GITHUB_REPOSITORY / GITHUB_REF_NAME / GITHUB_SHA: provenance and version
 *   metadata; fall back to the local git checkout.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const staticDir =
  process.env.STORYBOOK_STATIC_DIR ?? path.join(packageRoot, '..', 'storybook', 'storybook-static');

function fromGit(args) {
  try {
    return execFileSync('git', args, { cwd: packageRoot, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function packageVersion(specifier, requireAnchor) {
  try {
    return createRequire(requireAnchor)(`${specifier}/package.json`).version;
  } catch {
    return null;
  }
}

const manifestsSource = path.join(staticDir, 'manifests');
if (!existsSync(path.join(manifestsSource, 'components.json'))) {
  console.error(
    `No manifests/components.json in ${staticDir}, so there is nothing to publish. ` +
      'Build the Storybook first: pnpm --filter base-ui-storybook build-storybook ' +
      '(or point STORYBOOK_STATIC_DIR at an existing build).',
  );
  process.exit(1);
}

const branch = process.env.GITHUB_REF_NAME ?? fromGit(['rev-parse', '--abbrev-ref', 'HEAD']);
const sha = process.env.GITHUB_SHA ?? fromGit(['rev-parse', 'HEAD']);

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
  storybookVersion: packageVersion(
    'storybook',
    new URL('../../storybook/package.json', import.meta.url),
  ),
  storybookMcpVersion: packageVersion('@storybook/mcp', import.meta.url),
};
writeFileSync(
  path.join(packageRoot, 'provenance.json'),
  `${JSON.stringify(provenance, null, 2)}\n`,
);

// `experiment/empty` -> `empty`; `research` stays `research`.
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
