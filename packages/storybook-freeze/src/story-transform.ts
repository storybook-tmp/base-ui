import MagicString from 'magic-string';
import { parse, leadingBlockComment } from './oxc-utils';
import type { Labels } from './labels';

export interface StoryTransformResult {
  code: string;
  changed: boolean;
  removedStoryExports: number;
  remainingStoryExports: number;
}

function stringArray(node: any): string[] {
  if (node?.type !== 'ArrayExpression') {
    return [];
  }
  return node.elements
    .filter((el: any) => el?.type === 'Literal' && typeof el.value === 'string')
    .map((el: any) => el.value as string);
}

function tagsOf(objectExpression: any): string[] {
  if (objectExpression?.type !== 'ObjectExpression') {
    return [];
  }
  const prop = objectExpression.properties.find(
    (p: any) => p.type === 'Property' && p.key?.name === 'tags',
  );
  return prop ? stringArray(prop.value) : [];
}

export function transformStory(
  filename: string,
  code: string,
  keep: ReadonlySet<string>,
  labels: Labels,
): StoryTransformResult {
  const { program, comments } = parse(filename, code);
  const ms = new MagicString(code);
  let changed = false;
  let removedStoryExports = 0;
  let remainingStoryExports = 0;

  let metaNode: any = null;
  let metaTags: string[] = [];
  for (const node of program.body) {
    if (node.type === 'VariableDeclaration' && node.declarations[0]?.id?.name === 'meta') {
      metaNode = node;
      metaTags = tagsOf(node.declarations[0].init);
    }
  }

  const keepMetaJsdoc = keep.has('csf-jsdoc.meta');
  const keepStoryJsdoc = keep.has('csf-jsdoc.story');

  if (metaNode && !keepMetaJsdoc) {
    const range = leadingBlockComment(metaNode, comments, code);
    if (range) {
      ms.remove(range.start, range.end);
      changed = true;
    }
  }

  for (const node of program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'VariableDeclaration') {
      continue;
    }
    const declarator = node.declaration.declarations[0];
    const typeName = declarator?.id?.typeAnnotation?.typeAnnotation?.typeName?.name;
    if (typeName !== 'Story') {
      continue;
    }

    const effectiveTags = [...new Set([...metaTags, ...tagsOf(declarator.init)])].filter((tag) =>
      labels.storyTags.has(tag),
    );
    const hasDeleteTag = effectiveTags.some((tag) => labels.isDeleteFacet(`story.${tag}`));
    const isKept = !hasDeleteTag && effectiveTags.some((tag) => keep.has(`story.${tag}`));

    if (!isKept) {
      const lead = leadingBlockComment(node, comments, code);
      let end = node.end;
      if (code[end] === '\n') {
        end += 1;
      }
      ms.remove(lead ? lead.start : node.start, end);
      changed = true;
      removedStoryExports += 1;
    } else {
      remainingStoryExports += 1;
      if (!keepStoryJsdoc) {
        const range = leadingBlockComment(node, comments, code);
        if (range) {
          ms.remove(range.start, range.end);
          changed = true;
        }
      }
    }
  }

  return {
    code: changed ? ms.toString() : code,
    changed,
    removedStoryExports,
    remainingStoryExports,
  };
}
