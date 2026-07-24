/**
 * Experiments for the storybook-freeze CLI (`pnpm experiment:freeze`).
 *
 * Each entry regenerates one git branch containing only the listed facets; everything else is
 * stripped from the Storybook corpus. Facets are qualified `category.leaf` labels from
 * `apps/storybook/classification-labels.jsonc` (excluding the always-stripped delete facets).
 * Every `branchName` must start with `experiment/`.
 */
interface Experiment {
  branchName: string;
  facets: string[];
}

const experiments: Experiment[] = [
  {
    branchName: 'experiment/showcase-only',
    facets: ['story.showcase', 'mdx.general', 'source-jsdoc.component'],
  },
  {
    branchName: 'experiment/api-reference',
    facets: ['story.api-ref', 'source-jsdoc.props', 'mdx.props'],
  },
];

export default experiments;
