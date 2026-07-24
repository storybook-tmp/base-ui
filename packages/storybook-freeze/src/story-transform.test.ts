import { expect, it, describe } from 'vitest';
import { transformStory } from './story-transform';
import type { Labels } from './labels';

const labels: Labels = {
  offerableFacets: [],
  deleteFacets: new Set(['story.infra']),
  storyTags: new Set(['showcase', 'highlight', 'api-ref', 'infra']),
  isDeleteFacet: (f) => f === 'story.infra',
  isKept: (f, keep) => f !== 'story.infra' && keep.has(f),
};

const STORY = [
  '/** File-level component description. */',
  'const meta = {',
  "  title: 'Form inputs/Checkbox',",
  "  tags: ['base'],",
  '} satisfies Meta;',
  'export default meta;',
  'type Story = StoryObj<typeof meta>;',
  '',
  '/** Hero demo. */',
  "export const Hero: Story = { tags: ['showcase', 'base'], render: () => null };",
  '',
  '/** An api-ref story. */',
  "export const Details: Story = { tags: ['api-ref'], render: () => null };",
  '',
].join('\n');

describe('transformStory', () => {
  it('keeps only exports whose tag is kept and drops the rest', () => {
    const r = transformStory('checkbox.stories.tsx', STORY, new Set(['story.showcase']), labels);
    expect(r.code).toContain('export const Hero');
    expect(r.code).not.toContain('export const Details');
    expect(r.removedStoryExports).toBe(1);
    expect(r.remainingStoryExports).toBe(1);
  });

  it('reports the names of the removed story exports', () => {
    const r = transformStory('checkbox.stories.tsx', STORY, new Set(['story.showcase']), labels);
    expect(r.removedStoryNames).toEqual(['Details']);
  });

  it('strips the meta JSDoc when csf-jsdoc.meta is not kept', () => {
    const r = transformStory(
      'checkbox.stories.tsx',
      STORY,
      new Set(['story.showcase', 'story.api-ref']),
      labels,
    );
    expect(r.code).not.toContain('File-level component description.');
  });

  it('strips per-story JSDoc when csf-jsdoc.story is not kept', () => {
    const r = transformStory(
      'checkbox.stories.tsx',
      STORY,
      new Set(['story.showcase', 'story.api-ref']),
      labels,
    );
    expect(r.code).not.toContain('Hero demo.');
    expect(r.code).not.toContain('An api-ref story.');
  });

  it('keeps CSF JSDoc when csf-jsdoc.meta and csf-jsdoc.story are kept', () => {
    const keep = new Set(['story.showcase', 'story.api-ref', 'csf-jsdoc.meta', 'csf-jsdoc.story']);
    const r = transformStory('checkbox.stories.tsx', STORY, keep, labels);
    expect(r.code).toContain('File-level component description.');
    expect(r.code).toContain('Hero demo.');
  });

  it('always strips story.infra exports (delete facet wins)', () => {
    const infra = [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Grid: Story = { tags: ['infra'], render: () => null };",
    ].join('\n');
    const r = transformStory('gallery.stories.tsx', infra, new Set(['story.infra']), labels);
    expect(r.code).not.toContain('export const Grid');
    expect(r.remainingStoryExports).toBe(0);
    expect(r.removedStoryExports).toBe(1);
  });
});
