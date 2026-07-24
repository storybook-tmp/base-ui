import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

/**
 * Remove unused imports from the given files with Biome's `noUnusedImports` rule. Biome's fix
 * for a named import is classified "unsafe", so `--write --unsafe` is required; scoping to the
 * single rule keeps every other file untouched (no reformatting, no variable renaming).
 */
export function removeUnusedImports(files: string[], cwd: string): void {
  if (files.length === 0) {
    return;
  }
  const require = createRequire(import.meta.url);
  const biomeBin = require.resolve('@biomejs/biome/bin/biome');
  execFileSync(
    process.execPath,
    [biomeBin, 'lint', '--write', '--unsafe', '--only=correctness/noUnusedImports', ...files],
    { cwd, stdio: 'ignore' },
  );
}
