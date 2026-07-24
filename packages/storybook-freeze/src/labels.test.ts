import { expect, it, describe } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLabels } from './labels';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const LABELS = path.join(ROOT, 'apps/storybook/classification-labels.jsonc');

describe('loadLabels', () => {
  const labels = loadLabels(LABELS);

  it('offers mdx.props and story.showcase', () => {
    expect(labels.offerableFacets).toContain('mdx.props');
    expect(labels.offerableFacets).toContain('story.showcase');
  });

  it('never offers delete facets', () => {
    expect(labels.offerableFacets).not.toContain('mdx.styling');
    expect(labels.offerableFacets).not.toContain('story.infra');
  });

  it('exposes delete facets', () => {
    expect(labels.isDeleteFacet('story.infra')).toBe(true);
    expect(labels.isDeleteFacet('story.showcase')).toBe(false);
  });

  it('exposes bare story tag leaves', () => {
    expect(labels.storyTags.has('showcase')).toBe(true);
    expect(labels.storyTags.has('infra')).toBe(true);
    expect(labels.storyTags.has('base')).toBe(false);
  });

  it('isKept is false for delete facets even if present in the keep set', () => {
    expect(labels.isKept('story.infra', new Set(['story.infra']))).toBe(false);
    expect(labels.isKept('story.showcase', new Set(['story.showcase']))).toBe(true);
  });
});
