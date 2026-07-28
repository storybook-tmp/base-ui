import { expect, it, describe } from 'vitest';
import { parse, leadingBlockComment } from './oxc-utils';

describe('oxc-utils', () => {
  it('parses and finds a leading block comment for the exported node', () => {
    const code = ['/** hello */', 'export const Foo = 1;', ''].join('\n');
    const { program, comments } = parse('Foo.tsx', code);
    const node = program.body[0];
    const range = leadingBlockComment(node, comments, code);
    expect(range).not.toBeNull();
    expect(code.slice(range!.start, range!.end)).toBe('/** hello */\n');
  });

  it('returns null when there is code between comment and node', () => {
    const code = ['/** hello */', 'const x = 1;', 'export const Foo = 2;'].join('\n');
    const { program, comments } = parse('Foo.tsx', code);
    const node = program.body[1];
    expect(leadingBlockComment(node, comments, code)).toBeNull();
  });

  it('throws a Base UI error on invalid syntax', () => {
    expect(() => parse('Bad.tsx', 'export const = ;')).toThrow(/^Base UI:/);
  });
});
