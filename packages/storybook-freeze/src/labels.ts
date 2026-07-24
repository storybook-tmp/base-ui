import { readFileSync } from 'node:fs';
import { parse as parseJsonc } from 'jsonc-parser';

export type Facet = string;

export interface Labels {
  offerableFacets: Facet[];
  deleteFacets: ReadonlySet<Facet>;
  storyTags: ReadonlySet<string>;
  isDeleteFacet(facet: Facet): boolean;
  isKept(facet: Facet, keep: ReadonlySet<Facet>): boolean;
}

const CONTENT_CATEGORIES = ['source-jsdoc', 'csf-jsdoc', 'mdx', 'general', 'story'] as const;

export function loadLabels(jsoncPath: string): Labels {
  const raw = parseJsonc(readFileSync(jsoncPath, 'utf8')) as Record<string, unknown>;
  const deleteFacets = new Set<Facet>((raw.delete as string[] | undefined) ?? []);
  const offerableFacets: Facet[] = [];
  const storyTags = new Set<string>();

  for (const category of CONTENT_CATEGORIES) {
    const leaves = raw[category] as Record<string, string> | undefined;
    if (!leaves) {
      continue;
    }
    for (const leaf of Object.keys(leaves)) {
      const facet = `${category}.${leaf}`;
      if (category === 'story') {
        storyTags.add(leaf);
      }
      if (!deleteFacets.has(facet)) {
        offerableFacets.push(facet);
      }
    }
  }
  offerableFacets.sort();

  return {
    offerableFacets,
    deleteFacets,
    storyTags,
    isDeleteFacet: (facet) => deleteFacets.has(facet),
    isKept: (facet, keep) => !deleteFacets.has(facet) && keep.has(facet),
  };
}
