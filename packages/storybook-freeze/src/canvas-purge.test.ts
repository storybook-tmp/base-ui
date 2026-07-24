import { expect, it, describe } from 'vitest';
import { purgeCanvasReferences } from './canvas-purge';

describe('purgeCanvasReferences', () => {
  it('removes Canvas invocations referencing a removed export', () => {
    const code = [
      '## How it works',
      '',
      '### Toggling',
      '',
      'Prose that stays.',
      '',
      '<Canvas of={CheckboxStories.ToggleWithClick} />',
      '',
    ].join('\n');
    const r = purgeCanvasReferences(code, new Set(['CheckboxStories.ToggleWithClick']));
    expect(r.changed).toBe(true);
    expect(r.code).not.toContain('ToggleWithClick');
    expect(r.code).toContain('### Toggling');
    expect(r.code).toContain('Prose that stays.');
  });

  it('drops a subsection heading left empty after the Canvas is removed', () => {
    const code = [
      '### Indeterminate',
      '',
      '<Canvas of={CheckboxStories.Indeterminate} />',
      '',
      '### Read-only',
      '',
      'Kept prose.',
      '',
    ].join('\n');
    const r = purgeCanvasReferences(code, new Set(['CheckboxStories.Indeterminate']));
    expect(r.changed).toBe(true);
    expect(r.code).not.toContain('### Indeterminate');
    expect(r.code).not.toContain('Indeterminate');
    expect(r.code).toContain('### Read-only');
    expect(r.code).toContain('Kept prose.');
  });

  it('keeps a parent heading whose child subsections still have content', () => {
    const code = [
      '## How it works',
      '',
      '### Kept',
      '',
      'Prose.',
      '',
      '### Gone',
      '',
      '<Canvas of={S.Gone} />',
      '',
    ].join('\n');
    const r = purgeCanvasReferences(code, new Set(['S.Gone']));
    expect(r.code).toContain('## How it works');
    expect(r.code).toContain('### Kept');
    expect(r.code).not.toContain('### Gone');
  });

  it('cascades: removes a parent heading when all its subsections empty out', () => {
    const code = [
      '## Examples',
      '',
      '### One',
      '',
      '<Canvas of={S.One} />',
      '',
      '### Two',
      '',
      '<Canvas of={S.Two} />',
      '',
      '{/* END: examples */}',
    ].join('\n');
    const r = purgeCanvasReferences(code, new Set(['S.One', 'S.Two']));
    expect(r.code).not.toContain('## Examples');
    expect(r.code).not.toContain('### One');
    expect(r.code).not.toContain('### Two');
    expect(r.code).toContain('{/* END: examples */}');
  });

  it('is a no-op when no ref matches', () => {
    const code = ['### Kept', '', '<Canvas of={S.Stays} />', ''].join('\n');
    const r = purgeCanvasReferences(code, new Set(['S.Other']));
    expect(r.changed).toBe(false);
    expect(r.code).toBe(code);
  });
});
