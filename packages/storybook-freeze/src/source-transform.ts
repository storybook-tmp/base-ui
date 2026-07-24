import MagicString from 'magic-string';
import { parse, leadingBlockComment } from './oxc-utils';

export interface TransformResult {
  code: string;
  changed: boolean;
}

export function transformSource(
  filename: string,
  code: string,
  keep: ReadonlySet<string>,
): TransformResult {
  const keepComponent = keep.has('source-jsdoc.component');
  const keepProps = keep.has('source-jsdoc.props');
  if (keepComponent && keepProps) {
    return { code, changed: false };
  }

  const { program, comments } = parse(filename, code);
  const ms = new MagicString(code);
  let changed = false;

  const namespaceNames = new Set<string>();
  for (const node of program.body) {
    if (
      node.type === 'ExportNamedDeclaration' &&
      node.declaration?.type === 'TSModuleDeclaration' &&
      node.declaration.id?.type === 'Identifier'
    ) {
      namespaceNames.add(node.declaration.id.name);
    }
  }

  for (const node of program.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.declaration) {
      continue;
    }
    const decl = node.declaration;

    if (!keepComponent && decl.type === 'VariableDeclaration') {
      const id = decl.declarations[0]?.id;
      if (id?.type === 'Identifier' && namespaceNames.has(id.name)) {
        const range = leadingBlockComment(node, comments, code);
        if (range) {
          ms.remove(range.start, range.end);
          changed = true;
        }
      }
    }

    if (!keepProps && decl.type === 'TSInterfaceDeclaration' && decl.id.name.endsWith('Props')) {
      for (const member of decl.body.body) {
        const range = leadingBlockComment(member, comments, code);
        if (range) {
          ms.remove(range.start, range.end);
          changed = true;
        }
      }
    }
  }

  return { code: changed ? ms.toString() : code, changed };
}
