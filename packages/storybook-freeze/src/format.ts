import prettier from 'prettier';
import { readFile, writeFile } from 'node:fs/promises';

export async function formatFiles(files: string[]): Promise<void> {
  for (const file of files) {
    const info = await prettier.getFileInfo(file);
    if (info.ignored || !info.inferredParser) {
      continue;
    }
    const config = await prettier.resolveConfig(file);
    const source = await readFile(file, 'utf8');
    const formatted = await prettier.format(source, { ...config, filepath: file });
    await writeFile(file, formatted);
  }
}
