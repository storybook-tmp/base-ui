export interface CanvasPurgeResult {
  code: string;
  changed: boolean;
}

const CANVAS_REF_RE = /<Canvas\b[^>]*\bof=\{([A-Za-z0-9_$]+\.[A-Za-z0-9_$]+)\}[^>]*\/>/;
const HEADING_RE = /^(#{1,6})\s/;

function headingLevel(line: string): number {
  const match = HEADING_RE.exec(line);
  return match ? match[1].length : 0;
}

/**
 * A subsection ends at the next heading of the same or higher level, or at an MDX
 * section-delimiter comment. Deeper subheadings are part of the body (so a parent with
 * populated children is not considered empty).
 */
function isBoundary(line: string, level: number): boolean {
  const lineLevel = headingLevel(line);
  if (lineLevel > 0 && lineLevel <= level) {
    return true;
  }
  return /^\s*\{\/\*/.test(line);
}

function removeEmptyHeadings(input: string[]): string[] {
  let lines = input;
  let changed = true;
  while (changed) {
    changed = false;
    const result: string[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const level = headingLevel(lines[i]);
      if (level === 0) {
        result.push(lines[i]);
        continue;
      }
      let end = i + 1;
      let hasContent = false;
      for (; end < lines.length; end += 1) {
        if (isBoundary(lines[end], level)) {
          break;
        }
        if (lines[end].trim() !== '') {
          hasContent = true;
        }
      }
      if (hasContent) {
        result.push(lines[i]);
      } else {
        // Drop the heading and its whitespace-only body.
        changed = true;
        i = end - 1;
      }
    }
    lines = result;
  }
  return lines;
}

/**
 * Remove `<Canvas of={Alias.Export} />` invocations whose `Alias.Export` is in `removedRefs`,
 * then drop any subsection heading left with no content. `removedRefs` holds fully-qualified
 * `alias.exportName` references matching the MDX file's own namespace import.
 */
export function purgeCanvasReferences(
  code: string,
  removedRefs: ReadonlySet<string>,
): CanvasPurgeResult {
  if (removedRefs.size === 0) {
    return { code, changed: false };
  }

  let changed = false;
  const kept: string[] = [];
  for (const line of code.split('\n')) {
    const match = CANVAS_REF_RE.exec(line);
    if (match && removedRefs.has(match[1])) {
      changed = true;
      continue;
    }
    kept.push(line);
  }

  if (!changed) {
    return { code, changed: false };
  }

  const cleaned = removeEmptyHeadings(kept)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  return { code: cleaned, changed: true };
}
