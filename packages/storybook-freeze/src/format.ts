import prettier from 'prettier';
import { readFile, writeFile } from 'node:fs/promises';

async function formatFile(file: string): Promise<void> {
  const info = await prettier.getFileInfo(file);
  if (info.ignored || !info.inferredParser) {
    return;
  }
  const config = await prettier.resolveConfig(file);
  const source = await readFile(file, 'utf8');
  const formatted = await prettier.format(source, { ...config, filepath: file });
  await writeFile(file, formatted);
}

export async function formatFiles(files: string[]): Promise<void> {
  await Promise.all(files.map(formatFile));
}
