import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { resolveManifestFile } from './manifest-paths';

const MANIFESTS_DIR = path.join('/build', 'storybook-static', 'manifests');

describe('resolveManifestFile', () => {
  it('resolves top-level manifests inside the manifests directory', () => {
    expect(resolveManifestFile(MANIFESTS_DIR, './manifests/components.json')).toBe(
      path.join(MANIFESTS_DIR, 'components.json'),
    );
    expect(resolveManifestFile(MANIFESTS_DIR, 'manifests/docs.json')).toBe(
      path.join(MANIFESTS_DIR, 'docs.json'),
    );
  });

  it('resolves split/ref payloads against the sibling services directory', () => {
    expect(resolveManifestFile(MANIFESTS_DIR, './services/core/docgen/button.json')).toBe(
      path.join('/build', 'storybook-static', 'services', 'core', 'docgen', 'button.json'),
    );
  });

  it('rejects paths outside the manifests and services roots', () => {
    expect(() => resolveManifestFile(MANIFESTS_DIR, './index.html')).toThrow(
      /only manifests\/ and services\/ paths/,
    );
    expect(() => resolveManifestFile(MANIFESTS_DIR, 'src/secrets.json')).toThrow(
      /only manifests\/ and services\/ paths/,
    );
  });

  it('rejects traversal that escapes the served roots', () => {
    expect(() => resolveManifestFile(MANIFESTS_DIR, './manifests/../../etc/passwd')).toThrow(
      /resolves outside/,
    );
    expect(() =>
      resolveManifestFile(MANIFESTS_DIR, 'services/../manifests/components.json'),
    ).toThrow(/resolves outside/);
  });
});
