import { dirname, resolve, sep } from 'node:path';

/**
 * Map an `@storybook/mcp` manifest-provider request path to the file that backs it.
 *
 * Top-level manifests (`./manifests/<name>.json`) live in `manifestsDir`. Split/ref
 * payloads (`./services/<service>/<id>.json`, emitted by Storybooks with
 * `features.experimentalDocgenServer`) live in a `services/` directory that is a
 * sibling of `manifestsDir`, so they resolve against its parent (the Storybook
 * build root).
 *
 * Only those two roots are served; anything else — including paths that traverse
 * out of them — is rejected.
 */
export function resolveManifestFile(manifestsDir: string, requestPath: string): string {
  const normalized = requestPath.replace(/^\.?\//, '');

  let base: string;
  let rel: string;
  if (normalized.startsWith('manifests/')) {
    base = resolve(manifestsDir);
    rel = normalized.slice('manifests/'.length);
  } else if (normalized.startsWith('services/')) {
    base = resolve(dirname(resolve(manifestsDir)), 'services');
    rel = normalized.slice('services/'.length);
  } else {
    throw new Error(
      `Refusing to serve "${requestPath}": only manifests/ and services/ paths are exposed.`,
    );
  }

  const resolved = resolve(base, rel);
  if (resolved !== base && !resolved.startsWith(base + sep)) {
    throw new Error(`Refusing to serve "${requestPath}": it resolves outside ${base}.`);
  }
  return resolved;
}
