export interface MdxTransformResult {
  code: string;
  changed: boolean;
  deleteFile: boolean;
}

const META_TAGS_RE = /<Meta\b[^>]*\btags=\{\[([^\]]*)\]\}/;
const STRING_RE = /['"]([^'"]+)['"]/g;
const STAR_IMPORT_RE = /import\s+\*\s+as\s+[A-Za-z0-9_$]+\s+from\s+['"]([^'"]+)['"]/g;

/**
 * Module specifiers of every `import * as X from '...'` in the MDX source. Used to detect
 * MDX docs that namespace-import a CSF file which was pruned, so the now-dangling doc can be
 * removed too.
 */
export function starImportSpecifiers(code: string): string[] {
  return [...code.matchAll(STAR_IMPORT_RE)].map((match) => match[1]);
}

export function transformMdx(
  filename: string,
  code: string,
  keep: ReadonlySet<string>,
): MdxTransformResult {
  const metaMatch = META_TAGS_RE.exec(code);
  if (metaMatch) {
    const tags = [...metaMatch[1].matchAll(STRING_RE)].map((m) => m[1]);
    const general = tags.find((tag) => tag.startsWith('general-'));
    if (general) {
      return { code, changed: false, deleteFile: !keep.has(`general.${general}`) };
    }
  }

  let out = code;
  let changed = false;
  const beginRe = /\{\/\*\s*BEGIN:\s*([a-z0-9-]+)\s*\*\/\}/g;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = beginRe.exec(out)) !== null) {
    const label = match[1];
    if (keep.has(`mdx.${label}`)) {
      continue;
    }
    const endRe = new RegExp(`\\{\\/\\*\\s*END:\\s*${label}\\s*\\*\\/\\}`, 'g');
    endRe.lastIndex = match.index + match[0].length;
    const endMatch = endRe.exec(out);
    if (!endMatch) {
      continue;
    }
    const start = match.index;
    let end = endMatch.index + endMatch[0].length;
    if (out[end] === '\n') {
      end += 1;
    }
    out = out.slice(0, start) + out.slice(end);
    changed = true;
    beginRe.lastIndex = start;
  }

  return { code: out, changed, deleteFile: false };
}
