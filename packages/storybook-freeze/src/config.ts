import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Labels } from './labels';

export interface ExperimentConfig {
  branchName: string;
  facets: string[];
}

export const CONFIG_FILENAME = 'experiments.config.ts';

/** Dynamic-import the default export of `experiments.config.ts` at the repo root. */
export async function loadExperiments(cwd: string): Promise<unknown> {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  if (!existsSync(configPath)) {
    throw new Error(
      `Base UI: storybook-freeze could not find ${CONFIG_FILENAME} at the repository root. ` +
        'The CLI regenerates one branch per entry, so it needs this file. ' +
        `Create ${CONFIG_FILENAME} default-exporting an array of ` +
        '{ branchName: string; facets: string[] }.',
    );
  }
  const imported = (await import(pathToFileURL(configPath).href)) as { default?: unknown };
  return imported.default;
}

/** Validate the raw config against the taxonomy, returning typed entries or throwing. */
export function validateExperiments(raw: unknown, labels: Labels): ExperimentConfig[] {
  if (!Array.isArray(raw)) {
    throw new Error(
      `Base UI: ${CONFIG_FILENAME} must default-export an array, but it did not. ` +
        'The CLI builds one branch per entry, so export an array of ' +
        '{ branchName: string; facets: string[] }.',
    );
  }

  const defined = new Set(labels.definedFacets);
  const seen = new Set<string>();

  return raw.map((entry, index) => {
    const where = `entry ${index}`;
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(
        `Base UI: ${CONFIG_FILENAME} ${where} is not an object. ` +
          'Each entry must be { branchName: string; facets: string[] }.',
      );
    }

    const { branchName, facets } = entry as Record<string, unknown>;

    if (typeof branchName !== 'string' || !branchName.startsWith('experiment/')) {
      throw new Error(
        `Base UI: ${CONFIG_FILENAME} ${where} has an invalid branchName. ` +
          'Generated branches share the experiment/ namespace, so every branchName must be a ' +
          'string starting with "experiment/".',
      );
    }
    if (seen.has(branchName)) {
      throw new Error(
        `Base UI: ${CONFIG_FILENAME} lists the branchName "${branchName}" more than once. ` +
          'Each branch is built once, so duplicate names would overwrite each other. ' +
          'Give every entry a unique branchName.',
      );
    }
    seen.add(branchName);

    if (!Array.isArray(facets) || facets.some((facet) => typeof facet !== 'string')) {
      throw new Error(
        `Base UI: ${CONFIG_FILENAME} ${where} (${branchName}) has an invalid facets list. ` +
          'facets drives which content is kept, so it must be an array of strings.',
      );
    }

    const unknownFacets = (facets as string[]).filter((facet) => !defined.has(facet));
    if (unknownFacets.length > 0) {
      throw new Error(
        `Base UI: ${CONFIG_FILENAME} ${where} (${branchName}) lists unknown facets: ` +
          `${unknownFacets.join(', ')}. ` +
          'Facets must be qualified labels (category.leaf) from ' +
          'classification-labels.jsonc, excluding the always-stripped delete facets.',
      );
    }

    return { branchName, facets: facets as string[] };
  });
}
