import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from 'srvx/node';
import { createStorybookMcpHandler } from '@storybook/mcp';

const PORT = 6006;
const MANIFESTS_FOLDER = fileURLToPath(import.meta.resolve('../../storybook/storybook-static/'));

const storybookMcpHandler = await createStorybookMcpHandler({
  manifestProvider: async (_request: Request | undefined, manifestPath: string) => {
    const resolvedPath = path.resolve(MANIFESTS_FOLDER, manifestPath);
    process.stdout.write(`Requested: ${manifestPath}, serving: ${resolvedPath}\n`);
    return fs.readFileSync(resolvedPath, 'utf-8');
  },
});

export async function handleRequest(request: Request): Promise<Response> {
  if (new URL(request.url).pathname === '/mcp') {
    return storybookMcpHandler(request);
  }

  return new Response('Not found', { status: 404 });
}

const server = serve({
  hostname: 'localhost',
  port: PORT,
  fetch: handleRequest,
});

await server.ready();
process.stdout.write(
  `Listening on http://localhost:${PORT} — MCP endpoint at http://localhost:${PORT}/mcp\n`,
);
