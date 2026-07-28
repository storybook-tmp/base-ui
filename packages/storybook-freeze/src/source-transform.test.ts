import { expect, it, describe } from 'vitest';
import { transformSource } from './source-transform';

const SOURCE = [
  '/** Represents the checkbox. */',
  'export const CheckboxRoot = React.forwardRef(function CheckboxRoot() {',
  '  return null;',
  '});',
  '',
  'export interface CheckboxRootProps {',
  '  /** The id of the input. */',
  '  id?: string;',
  '  /** Whether ticked. */',
  '  checked?: boolean;',
  '}',
  '',
  'export namespace CheckboxRoot {',
  '  export type Props = CheckboxRootProps;',
  '}',
  '',
].join('\n');

describe('transformSource', () => {
  it('keeps everything when both facets are kept', () => {
    const keep = new Set(['source-jsdoc.component', 'source-jsdoc.props']);
    const r = transformSource('C.tsx', SOURCE, keep);
    expect(r.changed).toBe(false);
    expect(r.code).toBe(SOURCE);
  });

  it('removes the component JSDoc when source-jsdoc.component is not kept', () => {
    const keep = new Set(['source-jsdoc.props']);
    const r = transformSource('C.tsx', SOURCE, keep);
    expect(r.changed).toBe(true);
    expect(r.code).not.toContain('Represents the checkbox.');
    expect(r.code).toContain('The id of the input.');
    expect(r.code).toContain('export const CheckboxRoot');
  });

  it('removes each props member JSDoc when source-jsdoc.props is not kept', () => {
    const keep = new Set(['source-jsdoc.component']);
    const r = transformSource('C.tsx', SOURCE, keep);
    expect(r.changed).toBe(true);
    expect(r.code).toContain('Represents the checkbox.');
    expect(r.code).not.toContain('The id of the input.');
    expect(r.code).not.toContain('Whether ticked.');
    expect(r.code).toContain('id?: string;');
    expect(r.code).toContain('checked?: boolean;');
  });
});
