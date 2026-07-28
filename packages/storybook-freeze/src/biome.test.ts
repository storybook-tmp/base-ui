import { expect, it, describe, afterEach } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { removeUnusedImports } from './biome';

let dir: string | undefined;
afterEach(async () => {
  if (dir) {
    await rm(dir, { recursive: true, force: true });
    dir = undefined;
  }
});

describe('removeUnusedImports', () => {
  it('deletes unused imports and leaves used ones in place', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'freeze-biome-'));
    const file = path.join(dir, 'sample.tsx');
    await writeFile(
      file,
      [
        "import { Used } from './used';",
        "import { Unused } from './unused';",
        'export const K = Used;',
        '',
      ].join('\n'),
    );

    removeUnusedImports([file], dir);

    const out = await readFile(file, 'utf8');
    expect(out).toContain("import { Used } from './used';");
    expect(out).not.toContain('Unused');
  });

  it('is a no-op for an empty file list', () => {
    expect(() => removeUnusedImports([], process.cwd())).not.toThrow();
  });
});
