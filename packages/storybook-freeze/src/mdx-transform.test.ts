import { expect, it, describe } from 'vitest';
import { transformMdx, starImportSpecifiers } from './mdx-transform';

const GENERAL = [
  "import { Meta } from '@storybook/addon-docs/blocks';",
  '',
  '<Meta title="BaseUI Patterns/Choosing an overlay" tags={[\'general-when-to-use\']} />',
  '',
  'Some prose.',
  '',
].join('\n');

const COMPONENT = [
  '<Meta of={SliderStories} />',
  '',
  '{/* BEGIN: general */}',
  'An easily stylable range input.',
  '{/* END: general */}',
  '',
  '{/* BEGIN: styling */}',
  '## Styling hooks',
  '{/* END: styling */}',
  '',
].join('\n');

describe('transformMdx', () => {
  it('drops a general-tagged file when its facet is not kept', () => {
    const r = transformMdx('choosing-an-overlay.mdx', GENERAL, new Set());
    expect(r.deleteFile).toBe(true);
  });

  it('keeps a general-tagged file when its facet is kept', () => {
    const r = transformMdx(
      'choosing-an-overlay.mdx',
      GENERAL,
      new Set(['general.general-when-to-use']),
    );
    expect(r.deleteFile).toBe(false);
    expect(r.changed).toBe(false);
  });

  it('strips only the sections whose mdx facet is not kept', () => {
    const r = transformMdx('slider.mdx', COMPONENT, new Set(['mdx.general']));
    expect(r.deleteFile).toBe(false);
    expect(r.changed).toBe(true);
    expect(r.code).toContain('An easily stylable range input.');
    expect(r.code).not.toContain('## Styling hooks');
    expect(r.code).not.toContain('BEGIN: styling');
  });

  it('keys purely on the keep set (a section stays if its facet is present)', () => {
    const r = transformMdx('slider.mdx', COMPONENT, new Set(['mdx.general', 'mdx.styling']));
    expect(r.code).toContain('## Styling hooks');
  });
});

describe('starImportSpecifiers', () => {
  it('extracts the specifier of every `import * as X from` statement', () => {
    const code = [
      "import { Meta, Canvas } from '@storybook/addon-docs/blocks';",
      "import * as CheckboxStories from './checkbox.stories';",
      "import * as Shared from '../shared/helpers';",
      "import Default from './default';",
      '',
    ].join('\n');
    expect(starImportSpecifiers(code)).toEqual(['./checkbox.stories', '../shared/helpers']);
  });

  it('returns an empty array when there are no star imports', () => {
    expect(starImportSpecifiers("import { Meta } from '@storybook/addon-docs/blocks';")).toEqual(
      [],
    );
  });
});
