import { expect, it, describe } from 'vitest';
import { removeUnusedTopLevel } from './deadcode';

describe('removeUnusedTopLevel', () => {
  it('removes an unused top-level function but keeps referenced ones', () => {
    const code = [
      'function Used() { return 1; }',
      'function Unused() { return 2; }',
      'export const K = Used();',
      '',
    ].join('\n');
    const r = removeUnusedTopLevel('x.tsx', code);
    expect(r.changed).toBe(true);
    expect(r.code).toContain('function Used');
    expect(r.code).not.toContain('function Unused');
  });

  it('removes an unused top-level const', () => {
    const code = ['const unused = 5;', 'export const K = 1;', ''].join('\n');
    const r = removeUnusedTopLevel('x.tsx', code);
    expect(r.code).not.toContain('const unused');
    expect(r.code).toContain('export const K = 1;');
  });

  it('cascades: removes a helper used only by another removed helper', () => {
    const code = [
      'function Leaf() { return 1; }',
      'function Middle() { return Leaf(); }',
      'export const K = 2;',
      '',
    ].join('\n');
    const r = removeUnusedTopLevel('x.tsx', code);
    expect(r.code).not.toContain('Leaf');
    expect(r.code).not.toContain('Middle');
    expect(r.code).toContain('export const K');
  });

  it('keeps declarations referenced from exports and type positions', () => {
    const code = [
      'const meta = { a: 1 };',
      'export default meta;',
      'type Story = typeof meta;',
      'export const K: Story = meta;',
      '',
    ].join('\n');
    const r = removeUnusedTopLevel('x.tsx', code);
    expect(r.code).toContain('const meta');
    expect(r.changed).toBe(false);
  });

  it('keeps a helper referenced in JSX', () => {
    const code = [
      'function HeroExample() { return null; }',
      'export const Hero = { render: () => <HeroExample /> };',
      '',
    ].join('\n');
    const r = removeUnusedTopLevel('hero.tsx', code);
    expect(r.code).toContain('function HeroExample');
    expect(r.changed).toBe(false);
  });
});
