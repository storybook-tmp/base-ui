import { expect, it, describe } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadExperiments, validateExperiments } from './config';
import type { Labels } from './labels';

const labels: Labels = {
  offerableFacets: ['story.showcase', 'story.api-ref', 'mdx.general'],
  deleteFacets: new Set(['story.infra']),
  storyTags: new Set(['showcase', 'api-ref', 'infra']),
  isDeleteFacet: (f) => f === 'story.infra',
  isKept: (f, keep) => f !== 'story.infra' && keep.has(f),
};

describe('validateExperiments', () => {
  it('accepts a well-formed config', () => {
    const raw = [
      { branchName: 'experiment/showcase', facets: ['story.showcase'] },
      { branchName: 'experiment/api', facets: ['story.api-ref', 'mdx.general'] },
    ];
    expect(validateExperiments(raw, labels)).toEqual(raw);
  });

  it('rejects a non-array default export', () => {
    expect(() => validateExperiments({}, labels)).toThrow(/must default-export an array/);
  });

  it('rejects a branchName without the experiment/ prefix', () => {
    const raw = [{ branchName: 'showcase', facets: ['story.showcase'] }];
    expect(() => validateExperiments(raw, labels)).toThrow(/invalid branchName/);
  });

  it('rejects duplicate branch names', () => {
    const raw = [
      { branchName: 'experiment/x', facets: ['story.showcase'] },
      { branchName: 'experiment/x', facets: ['story.api-ref'] },
    ];
    expect(() => validateExperiments(raw, labels)).toThrow(/more than once/);
  });

  it('rejects unknown facets', () => {
    const raw = [{ branchName: 'experiment/x', facets: ['story.showcase', 'story.nope'] }];
    expect(() => validateExperiments(raw, labels)).toThrow(/unknown facets: story\.nope/);
  });

  it('rejects a non-string facets list', () => {
    const raw = [{ branchName: 'experiment/x', facets: 'story.showcase' }];
    expect(() => validateExperiments(raw, labels)).toThrow(/invalid facets list/);
  });
});

describe('loadExperiments', () => {
  it('throws a Base UI error when the config file is missing', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'freeze-config-'));
    try {
      await expect(loadExperiments(dir)).rejects.toThrow(/could not find experiments\.config\.ts/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
