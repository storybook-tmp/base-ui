import { parseSync } from 'oxc-parser';

export interface Comment {
  type: 'Line' | 'Block';
  value: string;
  start: number;
  end: number;
}

export function parse(filename: string, code: string): { program: any; comments: Comment[] } {
  const { program, comments, errors } = parseSync(filename, code);
  if (errors.length > 0) {
    throw new Error(
      `Base UI: storybook-freeze could not parse ${filename}. ` +
        `oxc reported a syntax error (${errors[0].message}), so the file cannot be safely transformed. ` +
        `Fix the syntax or exclude the file before freezing.`,
    );
  }
  return { program, comments: comments as Comment[] };
}

export function leadingBlockComment(
  node: { start: number },
  comments: Comment[],
  code: string,
): { start: number; end: number } | null {
  let best: Comment | null = null;
  for (const comment of comments) {
    if (comment.type !== 'Block') {
      continue;
    }
    if (comment.end <= node.start && /^\s*$/.test(code.slice(comment.end, node.start))) {
      if (best === null || comment.end > best.end) {
        best = comment;
      }
    }
  }
  return best ? { start: best.start, end: node.start } : null;
}
