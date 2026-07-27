import { expect, it, describe } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLabels } from './labels';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS = path.join(ROOT, 'apps/storybook/classification-labels.jsonc');

describe('loadLabels', () => {
  const labels = loadLabels(LABELS);

  it('offers mdx.props and story.showcase and story.base', () => {
    expect(labels.definedFacets).toContain('mdx.props');
    expect(labels.definedFacets).toContain('story.showcase');
    expect(labels.definedFacets).toContain('story.base');
  });

  it('never offers delete facets', () => {
    expect(labels.definedFacets).not.toContain('mdx.styling');
    expect(labels.definedFacets).not.toContain('story.infra');
  });

  it('exposes bare story tag leaves', () => {
    expect(labels.storyTags.has('showcase')).toBe(true);
    expect(labels.storyTags.has('infra')).toBe(true);
    expect(labels.storyTags.has('base')).toBe(true);
    expect(labels.storyTags.has('recreation')).toBe(false);
  });

  it('isKept is false for delete facets even if present in the keep set', () => {
    expect(labels.isKept('story.infra', new Set(['story.infra']))).toBe(false);
    expect(labels.isKept('story.showcase', new Set(['story.showcase']))).toBe(true);
  });
});
