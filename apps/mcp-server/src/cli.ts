import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { serve } from 'srvx/node';
import { createMcpRequestHandler } from './handler';

// Both src/cli.ts (dev) and dist/cli.js (published) sit one level below the package
// root, where `prepare-publish` bakes the manifests and provenance.
const PACKAGE_ROOT = fileURLToPath(new URL(/* @vite-ignore */ '..', import.meta.url));

const { values } = parseArgs({
  options: {
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'string', default: '6006' },
    manifests: { type: 'string', default: path.join(PACKAGE_ROOT, 'manifests') },
  },
});

const port = Number(values.port);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`--port must be a TCP port number, but received "${values.port}".`);
  process.exit(1);
}

const manifestsDir = path.resolve(values.manifests);
if (!fs.existsSync(path.join(manifestsDir, 'components.json'))) {
  console.error(
    `No components.json found in ${manifestsDir}, so there is nothing to serve. ` +
      'Point --manifests at the manifests/ directory of a Storybook build ' +
      '(build one with `pnpm --filter base-ui-storybook build-storybook`), ' +
      'or run this from a published package where manifests/ is baked in.',
  );
  process.exit(1);
}

interface Provenance {
  branch?: string;
  sha?: string;
  builtAt?: string;
}

function readProvenance(): Provenance | null {
  try {
    const raw = fs.readFileSync(path.join(PACKAGE_ROOT, 'provenance.json'), 'utf-8');
    return JSON.parse(raw) as Provenance;
  } catch {
    return null;
  }
}

const handleRequest = await createMcpRequestHandler(manifestsDir);

const server = serve({
  hostname: values.host,
  port,
  fetch: handleRequest,
});

await server.ready();

const provenance = readProvenance();
if (provenance !== null) {
  process.stdout.write(
    `Serving manifests built from ${provenance.branch ?? 'unknown branch'}` +
      `@${provenance.sha?.slice(0, 7) ?? 'unknown sha'} (${provenance.builtAt ?? 'unknown time'})\n`,
  );
}
process.stdout.write(
  `Listening on http://${values.host}:${port} — MCP endpoint at http://${values.host}:${port}/mcp\n`,
);
