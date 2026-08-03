import fs from 'node:fs/promises';
import { createStorybookMcpHandler } from '@storybook/mcp';
import { resolveManifestFile } from './manifest-paths';

/**
 * A fetch-style handler serving the Storybook MCP from on-disk manifests: requests to
 * `/mcp` hit `@storybook/mcp`, whose manifest reads resolve against `manifestsDir`.
 */
export async function createMcpRequestHandler(
  manifestsDir: string,
): Promise<(request: Request) => Promise<Response>> {
  const storybookMcpHandler = await createStorybookMcpHandler({
    manifestProvider: async (_request: Request | undefined, manifestPath: string) =>
      fs.readFile(resolveManifestFile(manifestsDir, manifestPath), 'utf-8'),
  });

  return async (request: Request): Promise<Response> => {
    if (new URL(request.url).pathname === '/mcp') {
      return storybookMcpHandler(request);
    }
    return new Response('Not found', { status: 404 });
  };
}
