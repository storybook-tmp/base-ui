import MagicString from 'magic-string';
import { parse, leadingBlockComment } from './oxc-utils';

export interface TransformResult {
  code: string;
  changed: boolean;
}

function walk(node: any, visit: (n: any) => void, seen: WeakSet<object>): void {
  if (!node || typeof node !== 'object' || seen.has(node)) {
    return;
  }
  seen.add(node);
  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, visit, seen);
    }
    return;
  }
  if (typeof node.type === 'string') {
    visit(node);
  }
  for (const key of Object.keys(node)) {
    if (key === 'type') {
      continue;
    }
    const value = node[key];
    if (value && typeof value === 'object') {
      walk(value, visit, seen);
    }
  }
}

/**
 * Names bound by a top-level declaration that is a candidate for removal — a non-exported
 * function or a non-exported `const`/`let`/`var`. Returns `null` for anything else, and for
 * destructuring patterns (too risky to remove name-by-name).
 */
function candidateNames(node: any): string[] | null {
  if (node.type === 'FunctionDeclaration' && node.id?.type === 'Identifier') {
    return [node.id.name];
  }
  if (node.type === 'VariableDeclaration') {
    const names: string[] = [];
    for (const declarator of node.declarations) {
      if (declarator.id?.type !== 'Identifier') {
        return null;
      }
      names.push(declarator.id.name);
    }
    return names.length > 0 ? names : null;
  }
  return null;
}

function countNames(root: any): Map<string, number> {
  const counts = new Map<string, number>();
  walk(
    root,
    (node) => {
      if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
        counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
      }
    },
    new WeakSet(),
  );
  return counts;
}

/**
 * Remove non-exported top-level functions and variables whose bindings are not referenced
 * anywhere else in the file, iterating to a fixpoint so a helper used only by another removed
 * helper is cleaned up too. Reference counting is liberal (every identifier occurrence counts
 * as a use), so the bias is to keep — it never removes a still-referenced declaration.
 */
export function removeUnusedTopLevel(filename: string, code: string): TransformResult {
  let current = code;
  let changed = false;

  for (;;) {
    const { program, comments } = parse(filename, current);
    const globalCounts = countNames(program);
    const ms = new MagicString(current);
    let removedThisRound = false;

    for (const node of program.body) {
      const names = candidateNames(node);
      if (!names) {
        continue;
      }
      const selfCounts = countNames(node);
      const unused = names.every(
        (name) => (globalCounts.get(name) ?? 0) <= (selfCounts.get(name) ?? 0),
      );
      if (!unused) {
        continue;
      }
      const lead = leadingBlockComment(node, comments, current);
      let end = node.end;
      if (current[end] === '\n') {
        end += 1;
      }
      ms.remove(lead ? lead.start : node.start, end);
      removedThisRound = true;
    }

    if (!removedThisRound) {
      break;
    }
    current = ms.toString();
    changed = true;
  }

  return { code: current, changed };
}
